// src/modules/users/users.routes.js
const router = require('express').Router();
const auth = require('../../middlewares/auth');
const { allow } = require('../../middlewares/role');
const ctrl = require('./users.controller');


// User can get their own profile
router.get('/me', auth, ctrl.me);

// SECURITY: Only ADMIN can list all users or view other users
router.get('/', auth, allow('ADMIN'), ctrl.getAll);
router.get('/:id', auth, allow('ADMIN'), ctrl.getById);


module.exports = router;