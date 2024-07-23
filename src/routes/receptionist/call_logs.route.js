const express = require('express');
const router = express.Router();
const checkAuth = require('../../middleware/check.auth')
const callLogController = require('../../controllers/receptionist/call-logs.controller')

router.post('/', checkAuth, callLogController.createCallLog)
router.get('/', checkAuth, callLogController.getAllCallLogs)

module.exports = router