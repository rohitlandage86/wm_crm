const express = require("express");
const router = express.Router();
const servicetypeController = require("../../controllers/admin/service_type.controller");
// const checkAuth = require("../middleware/check.auth");

router.post('/',servicetypeController.addServiceType);
router.get('/',servicetypeController.getServiceTypes);
router.get('/wma',servicetypeController.getServiceTypeWma);
router.get('/:id',servicetypeController.getServiceType);
router.put('/:id',servicetypeController.updateServiceType);
router.patch('/:id',servicetypeController.onStatusChange);

module.exports = router 