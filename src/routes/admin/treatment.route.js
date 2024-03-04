const express = require("express");
const router = express.Router();
const treatmentController = require("../../controllers/admin/treatment.controller"); 
// const checkAuth = require("../middleware/check.auth");

router.post('/',treatmentController.addTreatment);
router.get('/',treatmentController.getTreatments);
router.get('/wma/',treatmentController.getTreatmentWma);
router.get('/:id',treatmentController.getTreatment);
router.put('/:id',treatmentController.updateTreatment);
router.patch('/:id',treatmentController.onStatusChange);

module.exports = router 