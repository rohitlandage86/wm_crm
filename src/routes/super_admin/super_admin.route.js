const express = require("express");
const router = express.Router();
const super_adminController = require("../../controllers/super_admin/super_admin.controller");
// const checkAuth = require("../../middleware/check.auth");

router.post('/',super_adminController.createSuperAdmin);
router.post('/login',super_adminController.login);
router.post('/lead-upload',super_adminController.leadUpload);
router.post('/wm-lead-upload',super_adminController.wmLeadUpload);
router.get('/demo-list',super_adminController.getDemo);
router.get('/OPD-lead-list',super_adminController.getLeadOPDList);
router.get('/lead-status',super_adminController.getAllLeadStatusList)
router.get('/state',super_adminController.getAllStateList)


module.exports = router 