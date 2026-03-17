const router = require('express').Router();
const ctrl = require('./public.controller');

router.get('/stats', ctrl.homeStats);

module.exports = router;
