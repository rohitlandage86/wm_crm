const express = require("express");
const router = express.Router();
const dosagesController = require("../../controllers/admin/dosages.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,dosagesController.addDosages);
router.get('/',checkAuth,dosagesController.getDosagess);
router.get('/wma',checkAuth,dosagesController.getDosagesWma);
router.get('/:id',checkAuth,dosagesController.getDosages);
router.put('/:id',checkAuth,dosagesController.updateDosages);
router.patch('/:id',checkAuth,dosagesController.onStatusChange);

module.exports = router 