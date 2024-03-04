const express = require("express");
const router = express.Router();
const entityController = require("../../controllers/admin/entity.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,entityController.addEntity);
router.get('/',checkAuth,entityController.getEntitys);
router.get('/wma/',checkAuth,entityController.getEntityWma);
router.get('/:id',checkAuth,entityController.getEntity);
router.put('/:id',checkAuth,entityController.updateEntity);
router.patch('/:id',checkAuth,entityController.onStatusChange);

module.exports = router 