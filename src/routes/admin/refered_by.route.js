const express = require("express");
const router = express.Router();
const referedbyController = require("../../controllers/admin/refered_by.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,referedbyController.addReferedBy);
router.get('/',checkAuth,referedbyController.getReferedBys);
router.get('/wma',checkAuth,referedbyController.getReferedByWma);
router.get('/:id',checkAuth,referedbyController.getReferedBy);
router.put('/:id',checkAuth,referedbyController.updateReferedBy);
router.patch('/:id',checkAuth,referedbyController.onStatusChange);

module.exports = router 