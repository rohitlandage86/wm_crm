const express = require("express");
const router = express.Router();
const servicesController = require("../../controllers/admin/serivces.contoller");
// const checkAuth = require("../middleware/check.auth");

router.post('/',servicesController.addService);
router.get('/',servicesController.getServices);
router.get('/wma',servicesController.getServiceWma);
router.get('/:id',servicesController.getService);
router.put('/:id',servicesController.updateService);
router.patch('/:id',servicesController.onStatusChange);

module.exports = router 