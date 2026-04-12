// src/middlewares/error.js
const R = require('../utils/apiResponse');


function notFound(req, res) {
    return R.notFound(res, 'Route not found');
}


function errorHandler(err, req, res, next) {
    console.error(err);
    const status = Number(err?.status) || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction && status >= 500
        ? 'Internal server error'
        : (err.message || 'Server error');

    if (status === 400) return R.badRequest(res, message);
    if (status === 401) return R.unauthorized(res, message);
    if (status === 403) return R.forbidden(res, message);
    if (status === 404) return R.notFound(res, message);
    if (status === 409) return R.conflict(res, message);

    return R.error(res, message);
}


module.exports = { notFound, errorHandler };
