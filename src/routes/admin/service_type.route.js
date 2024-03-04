const express = require("express");
const router = express.Router();
const servicetypeController = require("../../controllers/admin/service_type.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,servicetypeController.addServiceType);
router.get('/',checkAuth,servicetypeController.getServiceTypes);
router.get('/wma',checkAuth,servicetypeController.getServiceTypeWma);
router.get('/:id',checkAuth,servicetypeController.getServiceType);
router.put('/:id',checkAuth,servicetypeController.updateServiceType);
router.patch('/:id',checkAuth,servicetypeController.onStatusChange);

module.exports = router 