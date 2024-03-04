const express = require("express");
const router = express.Router();
const treatmentController = require("../../controllers/admin/treatment.controller"); 
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,treatmentController.addTreatment);
router.get('/',checkAuth,treatmentController.getTreatments);
router.get('/wma/',checkAuth,treatmentController.getTreatmentWma);
router.get('/:id',checkAuth,treatmentController.getTreatment);
router.put('/:id',checkAuth,treatmentController.updateTreatment);
router.patch('/:id',checkAuth,treatmentController.onStatusChange);

module.exports = router 