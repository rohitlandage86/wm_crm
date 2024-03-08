const express = require("express");
const router = express.Router();
const wm_modulesController = require("../../controllers/super_admin/wm_modules.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,wm_modulesController.addModules);
router.get('/',checkAuth,wm_modulesController.getModules);
router.get('/wma',checkAuth,wm_modulesController.getModulesWma);
router.get('/:id',checkAuth,wm_modulesController.getModule);
router.put('/:id',checkAuth,wm_modulesController.updateModule);
router.patch('/:id',checkAuth,wm_modulesController.onStatusChange);

module.exports = router 