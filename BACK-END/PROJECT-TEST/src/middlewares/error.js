// src/middlewares/error.js
const R = require('../utils/apiResponse');


function notFound(req, res) {
    return R.notFound(res, 'Route not found');
}


function errorHandler(err, req, res, next) {
    console.error(err);
    // SECURITY: Hide internal error details in production
    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction ? 'Internal server error' : (err.message || 'Server error');
    return R.error(res, message);
}


module.exports = { notFound, errorHandler };