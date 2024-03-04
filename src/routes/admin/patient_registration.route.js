const express = require("express");
const router = express.Router();
const patientregistrationController = require("../../controllers/admin/patient_registration.controller");
// const checkAuth = require("../middleware/check.auth");

router.post('/',patientregistrationController.addPatientRegistration);
router.get('/',patientregistrationController.getPatientRegistrations);
router.get('/wma/',patientregistrationController.getPatientRegistrationWma);
router.get('/pvl/',patientregistrationController.getPatientVisitLists);
router.get('/:id',patientregistrationController.getPatientRegistration);
router.put('/:id',patientregistrationController.updatePatientRegistration);
router.patch('/:id',patientregistrationController.onStatusChange);
module.exports = router 