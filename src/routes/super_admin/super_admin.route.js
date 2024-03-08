const express = require("express");
const router = express.Router();
const super_adminController = require("../../controllers/super_admin/super_admin.controller");
// const checkAuth = require("../../middleware/check.auth");

router.post('/',super_adminController.createSuperAdmin);
router.post('/login',super_adminController.login);
router.get('/lead-status',super_adminController.getAllLeadStatusList)


module.exports = router 