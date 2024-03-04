const express = require("express");
const router = express.Router();
const chief_complaintsController = require("../../controllers/admin/chief_complaints.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,chief_complaintsController.addChiefComplaints);
router.get('/',checkAuth,chief_complaintsController.getChiefComplaintss);
router.get('/wma',checkAuth,chief_complaintsController.getChiefComplaintsWma);
router.get('/:id',checkAuth,chief_complaintsController.getChiefComplaints);
router.put('/:id',checkAuth,chief_complaintsController.updateChiefComplaints);
router.patch('/:id',checkAuth,chief_complaintsController.onStatusChange);

module.exports = router 