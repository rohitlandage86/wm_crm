const express = require("express");
const router = express.Router();
const cutomertypeController = require("../../controllers/super_admin/wm_cutomer_type.controller");
// const checkAuth = require("../middleware/check.auth");

router.post('/',cutomertypeController.addCutomerType);
router.get('/',cutomertypeController.getCutomerTypes);
router.get('/wma',cutomertypeController.getCustomerTypeWma);
router.get('/:id',cutomertypeController.getCutomerType);
router.put('/:id',cutomertypeController.updateCutomerType);
// router.patch('/:id',cutomertypeController.onStatusChange);

module.exports = router 