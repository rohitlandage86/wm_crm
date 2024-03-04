const express = require("express");
const router = express.Router();
const sourceofpatientController = require("../../controllers/admin/source_of_patient.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,sourceofpatientController.addSourceOfPatient);
router.get('/',checkAuth,sourceofpatientController.getSourceOfPatients);
router.get('/wma',checkAuth,sourceofpatientController.getSourceOfPatientWma);
router.get('/:id',checkAuth,sourceofpatientController.getSourceOfPatient);
router.put('/:id',checkAuth,sourceofpatientController.updateSourceOfPatient);
router.patch('/:id',checkAuth,sourceofpatientController.onStatusChange);

module.exports = router 