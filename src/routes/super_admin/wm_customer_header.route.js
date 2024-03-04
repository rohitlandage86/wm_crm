const express = require("express");
const router = express.Router();
const customerheaderController = require("../../controllers/super_admin/wm_customer_header.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,customerheaderController.createCustomer);
router.post('/login',customerheaderController.customerLogin);
router.get('/',checkAuth,customerheaderController.getCustomers);
router.get('/wma/',customerheaderController.getCustomerWma);
router.get('/:id',checkAuth,customerheaderController.getCustomer);
router.put('/:id',checkAuth,customerheaderController.updateCustomer);
router.patch('/:id',checkAuth,customerheaderController.onStatusChange);

module.exports = router