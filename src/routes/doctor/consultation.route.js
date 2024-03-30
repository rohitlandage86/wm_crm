const express = require("express");
const router = express.Router();
const consultationController = require("../../controllers/doctor/consultation.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,consultationController.createConsultation);
router.get('/',checkAuth,consultationController.getConsultationList);
// router.get('/wma',checkAuth,consultationController.getModulesWma);
router.get('/patient-consultation-by-mrno/:id',checkAuth,consultationController.getConsulationsByMrno);
router.get('/appointment',checkAuth,consultationController.getAppointmentList);
router.get('/:id',checkAuth,consultationController.getConsultationById);
router.put('/:id',checkAuth,consultationController.updateConsultation);
// router.patch('/:id',checkAuth,consultationController.onStatusChange);
router.delete('/diagnosis/:id',checkAuth,consultationController.deleteConsultationDiagnosis);
router.delete('/treatment/:id',checkAuth,consultationController.deleteConsultationTreatment);
router.delete('/medicine/:id',checkAuth,consultationController.deleteConsultationMedicine);
router.delete('/fileUpload/:id',checkAuth,consultationController.deleteConsultationFileUpload);
module.exports = router 