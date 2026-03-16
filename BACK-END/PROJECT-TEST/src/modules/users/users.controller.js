// src/modules/users/users.controller.js
const R = require('../../utils/apiResponse');
const svc = require('./users.service');


async function me(req, res) {
const data = await svc.me(req.user.id);
return R.ok(res, data);
}

async function getAll(req, res) {
const data = await svc.getAll(req.query);
return R.ok(res, data);
}

async function getById(req, res) {
const { id } = req.params;
const data = await svc.getById(id);
if (!data) {
return R.notFound(res, 'User not found');
}
return R.ok(res, data);
}


module.exports = { me, getAll, getById };