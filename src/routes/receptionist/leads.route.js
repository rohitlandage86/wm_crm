const express = require("express");
const router = express.Router();
const leadheaderController = require("../../controllers/receptionist/leads.controller");
// const checkAuth = require("../middleware/check.auth");

router.post('/',leadheaderController.addleads);
router.get('/',leadheaderController.getLeadHeaders);
router.get('/wma/',leadheaderController.getLeadHeaderWma);
router.get('/lf/',leadheaderController.getLeadFooters);
router.get('/:id',leadheaderController.getLeads);
router.put('/:id',leadheaderController.updateLeads);
router.patch('/:id',leadheaderController.onStatusChange);
router.delete('/:id',leadheaderController.deleteLeadFooter);
module.exports = router