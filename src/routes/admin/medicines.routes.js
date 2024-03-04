const express = require("express");
const router = express.Router();
const medicinesController = require("../../controllers/admin/medicines.controller");
// const checkAuth = require("../middleware/check.auth");
const checkAuth = require('../../middleware/check.auth');

router.post('/',checkAuth,medicinesController.addMedicines);
router.get('/',checkAuth,medicinesController.getMediciness);
router.get('/wma',checkAuth,medicinesController.getMedicinesWma);
router.get('/:id',checkAuth,medicinesController.getMedicines);
router.put('/:id',checkAuth,medicinesController.updateMedicines);
router.patch('/:id',checkAuth,medicinesController.onStatusChange);

module.exports = router 