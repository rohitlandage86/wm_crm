const express = require("express");
const router = express.Router();
const sourceofpatientController = require("../../controllers/admin/source_of_patient.controller");
// const checkAuth = require("../middleware/check.auth");

router.post('/',sourceofpatientController.addSourceOfPatient);
router.get('/',sourceofpatientController.getSourceOfPatients);
router.get('/wma',sourceofpatientController.getSourceOfPatientWma);
router.get('/:id',sourceofpatientController.getSourceOfPatient);
router.put('/:id',sourceofpatientController.updateSourceOfPatient);
router.patch('/:id',sourceofpatientController.onStatusChange);

module.exports = router 