const express = require("express");
const router = express.Router();
const receptionistDashboardController = require("../../controllers/receptionist/receptionist-dashboard.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,receptionistDashboardController.addleads);
router.get('/',checkAuth,receptionistDashboardController.getReceptionistDashboardCount);
// router.get('/wma/',checkAuth,leadheaderController.getLeadHeaderWma);
// router.get('/lead-follow-up',checkAuth,leadheaderController.getFollowUpLeadsList)
// router.get('/lf/',checkAuth,leadheaderController.get LeadFooters);
// router.get('/:id',checkAuth,leadheaderController.getLeadsHeaderById);
// router.put('/:id',checkAuth,leadheaderController.updateLeads);
// router.patch('/:id',checkAuth,leadheaderController.onStatusChange);
// router.delete('/:id',checkAuth,leadheaderController.deleteLeadFooter);
module.exports = router