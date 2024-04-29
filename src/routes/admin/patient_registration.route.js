const express = require("express");
const router = express.Router();
const patientregistrationController = require("../../controllers/admin/patient_registration.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,patientregistrationController.addPatientRegistration);
router.get('/',checkAuth,patientregistrationController.getPatientRegistrations);
router.get('/wma/',checkAuth,patientregistrationController.getPatientRegistrationWma);
router.get('/patient-visit-list/',checkAuth,patientregistrationController.getPatientVisitLists);
router.get('/patient-visit-checked-list/',checkAuth,patientregistrationController.getPatientVisitCheckedLists);
//get all patient visit list (all visit date, ischecked and checked) from patient_visit_list table
router.get('/get-all-patient-visit-list',checkAuth,patientregistrationController.getAllPatientVisitList);
router.get('/search-patient-registration',checkAuth,patientregistrationController.searchPatientRegistration);
router.get('/search-patient-for-revisit',checkAuth,patientregistrationController.searchPatientForRevisit);
router.get('/generate-mrno-entity-series/:id',checkAuth,patientregistrationController.generateMrnoEntitySeries);
router.get('/:id',checkAuth,patientregistrationController.getPatientRegistration);
router.put('/:id',checkAuth,patientregistrationController.updatePatientRegistration);
router.patch('/:id',checkAuth,patientregistrationController.onStatusChange);
router.put('/patient-revisit/:id',checkAuth,patientregistrationController.patientRevisit);
module.exports = router 