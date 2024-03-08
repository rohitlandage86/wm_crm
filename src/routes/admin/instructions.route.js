const express = require("express");
const router = express.Router();
const instructionsController = require("../../controllers/admin/instructions.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,instructionsController.addInstructions);
router.get('/',checkAuth,instructionsController.getInstructionss);
router.get('/wma',checkAuth,instructionsController.getInstructionsWma);
router.get('/:id',checkAuth,instructionsController.getInstructions);
router.put('/:id',checkAuth,instructionsController.updateInstructions);
router.patch('/:id',checkAuth,instructionsController.onStatusChange);

module.exports = router 