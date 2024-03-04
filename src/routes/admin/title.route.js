const express = require("express");
const router = express.Router();
const titleController = require("../../controllers/admin/title.controller");
// const checkAuth = require("../middleware/check.auth");

router.post('/',titleController.addTitle);
router.get('/',titleController.getTitles);
router.get('/wma/',titleController.getTitleWma);
router.get('/:id',titleController.getTitle);
router.put('/:id',titleController.updateTitle);
router.patch('/:id',titleController.onStatusChange);

module.exports = router 