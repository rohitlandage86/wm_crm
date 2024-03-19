const express = require("express");
const router = express.Router();
const consultationController = require("../../controllers/doctor/consultation.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,consultationController.createConsultation);
router.get('/',checkAuth,consultationController.getConsultationList);
// router.get('/wma',checkAuth,consultationController.getModulesWma);
router.get('/:id',checkAuth,consultationController.getConsultationById);
// router.put('/:id',checkAuth,consultationController.updateModule);
// router.patch('/:id',checkAuth,consultationController.onStatusChange);

module.exports = router 