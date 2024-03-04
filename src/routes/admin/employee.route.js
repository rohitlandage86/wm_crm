const express = require("express");
const router = express.Router();
const employeeController = require("../../controllers/admin/employee.controller");
// const checkAuth = require("../middleware/check.auth");

router.post('/',employeeController.addEmployee);
router.get('/',employeeController.getEmployees);
router.get('/wma',employeeController.getEmployeeWma);
router.get('/:id',employeeController.getEmployee);
router.put('/:id',employeeController.updateEmployee);
router.patch('/:id',employeeController.onStatusChange);

module.exports = router 