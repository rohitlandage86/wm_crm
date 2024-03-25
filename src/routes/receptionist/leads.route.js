const express = require("express");
const router = express.Router();
const leadheaderController = require("../../controllers/receptionist/leads.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,leadheaderController.addleads);
router.get('/',checkAuth,leadheaderController.getLeadHeaders);
router.get('/wma/',checkAuth,leadheaderController.getLeadHeaderWma);
router.put('/lead-follow-up/:id',checkAuth,leadheaderController.updateFollowUpLead);
router.get('/lead-follow-up',checkAuth,leadheaderController.getFollowUpLeadsList);
router.get('/search-lead-header',checkAuth,leadheaderController.searchLeadHeaders);
// router.get('/lf/',checkAuth,leadheaderController.get LeadFooters);
router.get('/:id',checkAuth,leadheaderController.getLeadsHeaderById);
router.put('/:id',checkAuth,leadheaderController.updateLeads);
router.patch('/:id',checkAuth,leadheaderController.onStatusChange);
// router.delete('/:id',checkAuth,leadheaderController.deleteLeadFooter);
module.exports = router