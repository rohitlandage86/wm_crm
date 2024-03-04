const express = require("express");
const router = express.Router();
const servicesController = require("../../controllers/admin/serivces.contoller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,servicesController.addService);
router.get('/',checkAuth,servicesController.getServices);
router.get('/wma',checkAuth,servicesController.getServiceWma);
router.get('/:id',checkAuth,servicesController.getService);
router.put('/:id',checkAuth,servicesController.updateService);
router.patch('/:id',checkAuth,servicesController.onStatusChange);

module.exports = router 