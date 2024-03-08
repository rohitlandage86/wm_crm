const express = require("express");
const router = express.Router();
const cutomertypeController = require("../../controllers/super_admin/wm_cutomer_type.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,cutomertypeController.addCutomerType);
router.get('/',checkAuth,cutomertypeController.getCutomerTypes);
router.get('/wma',checkAuth,cutomertypeController.getCustomerTypeWma);
router.get('/:id',checkAuth,cutomertypeController.getCutomerType);
router.put('/:id',checkAuth,cutomertypeController.updateCutomerType);
router.patch('/:id',cutomertypeController.onStatusChange);

module.exports = router 