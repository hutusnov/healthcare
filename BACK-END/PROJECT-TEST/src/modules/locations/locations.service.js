const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE = 'https://provinces.open-api.vn';
const REQUEST_TIMEOUT_MS = Number(process.env.LOCATION_API_TIMEOUT_MS || 5000);
const LOCAL_DATA_PATH = path.join(__dirname, 'vietnam-locations.json');
const cache = { provinces: null, tPro: 0, districts: new Map(), wards: new Map() };
const TTL = 1000 * 60 * 60; // 1h
let localLocations = null;

const now = () => Date.now();

function sortVi(a, b) {
  return a.name.localeCompare(b.name, 'vi');
}

function loadLocalLocations() {
  if (localLocations) return localLocations;
  const raw = fs.readFileSync(LOCAL_DATA_PATH, 'utf8');
  localLocations = JSON.parse(raw);
  return localLocations;
}

function normalizeProvince(item) {
  return {
    code: String(item.code).padStart(2, '0'),
    name: item.name,
  };
}

function normalizeDistrict(item, provinceCode) {
  return {
    code: String(item.code),
    name: item.name,
    province_code: String(provinceCode).padStart(2, '0'),
  };
}

function normalizeWard(item, districtCode) {
  return {
    code: String(item.code),
    name: item.name,
    district_code: String(districtCode),
  };
}

function filterByQuery(items, q) {
  if (!q) return items;
  const needle = String(q).toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(needle));
}

function getLocalProvinces() {
  return loadLocalLocations().map(normalizeProvince);
}

function getLocalDistricts(provinceCode) {
  const key = Number.parseInt(provinceCode, 10);
  const province = loadLocalLocations().find((item) => Number(item.code) === key);
  return (province?.districts || []).map((district) => normalizeDistrict(district, province.code));
}

function getLocalWards(districtCode) {
  const key = Number.parseInt(districtCode, 10);
  for (const province of loadLocalLocations()) {
    const district = (province.districts || []).find((item) => Number(item.code) === key);
    if (district) {
      return (district.wards || []).map((ward) => normalizeWard(ward, district.code));
    }
  }
  return [];
}

async function getRemote(url) {
  return axios.get(url, { timeout: REQUEST_TIMEOUT_MS });
}

async function listProvinces({ q } = {}) {
  if (!cache.provinces || now() - cache.tPro > TTL) {
    try {
      const { data } = await getRemote(`${BASE}/api/p/`);
      cache.provinces = data.map(normalizeProvince);
    } catch (error) {
      cache.provinces = getLocalProvinces();
    }
    cache.tPro = now();
  }
  return filterByQuery(cache.provinces, q).sort(sortVi);
}

async function listDistricts({ province_code, q } = {}) {
  if (!province_code) throw new Error('province_code is required');
  const key = String(parseInt(province_code, 10));
  if (!cache.districts.has(key)) {
    let arr;
    try {
      const { data } = await getRemote(`${BASE}/api/p/${key}?depth=2`);
      arr = (data?.districts || []).map((district) => normalizeDistrict(district, data.code));
    } catch (error) {
      arr = getLocalDistricts(key);
    }
    cache.districts.set(key, arr);
  }
  return filterByQuery(cache.districts.get(key), q).sort(sortVi);
}

async function listWards({ district_code, q } = {}) {
  if (!district_code) throw new Error('district_code is required');
  const key = String(parseInt(district_code, 10));
  if (!cache.wards.has(key)) {
    let arr;
    try {
      const { data } = await getRemote(`${BASE}/api/d/${key}?depth=2`);
      arr = (data?.wards || []).map((ward) => normalizeWard(ward, data.code));
    } catch (error) {
      arr = getLocalWards(key);
    }
    cache.wards.set(key, arr);
  }
  return filterByQuery(cache.wards.get(key), q).sort(sortVi);
}

module.exports = { listProvinces, listDistricts, listWards };
