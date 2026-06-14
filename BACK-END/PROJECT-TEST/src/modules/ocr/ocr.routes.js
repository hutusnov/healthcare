const express = require('express');
const auth = require('../../middlewares/auth');
const controller = require('./ocr.controller');

const router = express.Router();

router.post('/cccd', auth, controller.scanCccd);

module.exports = router;
