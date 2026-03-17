const R = require('../../utils/apiResponse');
const svc = require('./public.service');

async function homeStats(req, res) {
  const data = await svc.getHomeStats();
  return R.ok(res, data);
}

module.exports = { homeStats };
