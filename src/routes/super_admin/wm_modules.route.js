const express = require("express");
const router = express.Router();
const wm_modulesController = require("../../controllers/super_admin/wm_modules.controller");
// const checkAuth = require("../middleware/check.auth");

router.post('/',wm_modulesController.addModules);
router.get('/',wm_modulesController.getModules);
router.get('/wma',wm_modulesController.getModulesWma);
router.get('/:id',wm_modulesController.getModule);
router.put('/:id',wm_modulesController.updateModule);
// router.patch('/:id',wm_modulesController.onStatusChange);

module.exports = router 