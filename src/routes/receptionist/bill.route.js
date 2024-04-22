const express = require("express");
const router = express.Router();
const billController = require("../../controllers/receptionist/bill.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,billController.addbill);
router.get('/',checkAuth,billController.getBillList);
router.get('/Entity/:id',checkAuth,billController.getBillEntityList);
router.get('/:id',checkAuth,billController.getBillById);
router.get('/patient-consultation-by-mrno/:id',checkAuth,billController.getBillByMrno);
module.exports = router