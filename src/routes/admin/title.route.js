const express = require("express");
const router = express.Router();
const titleController = require("../../controllers/admin/title.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,titleController.addTitle);
router.get('/',checkAuth,titleController.getTitles);
router.get('/wma/',checkAuth,titleController.getTitleWma);
router.get('/:id',checkAuth,titleController.getTitle);
router.put('/:id',checkAuth,titleController.updateTitle);
router.patch('/:id',checkAuth,titleController.onStatusChange);

module.exports = router 