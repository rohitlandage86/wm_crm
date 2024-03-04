const express = require("express");
const router = express.Router();
const diagnosisController = require("../../controllers/admin/diagnosis.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,diagnosisController.addDiagnosis);
router.get('/',checkAuth,diagnosisController.getDiagnosiss);
router.get('/wma',checkAuth,diagnosisController.getDiagnosisWma);
router.get('/:id',checkAuth,diagnosisController.getDiagnosis);
router.put('/:id',checkAuth,diagnosisController.updateDiagnosis);
router.patch('/:id',checkAuth,diagnosisController.onStatusChange);

module.exports = router 