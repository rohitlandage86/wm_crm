const express = require("express");
const router = express.Router();
const categoryController = require("../../controllers/admin/category.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,categoryController.addCategory);
router.get('/',checkAuth,categoryController.getCategorys);
router.get('/wma',checkAuth,categoryController.getCategoryWma);
router.get('/:id',checkAuth,categoryController.getCategory);
router.put('/:id',checkAuth,categoryController.updateCategory);
router.patch('/:id',checkAuth,categoryController.onStatusChange);

module.exports = router 