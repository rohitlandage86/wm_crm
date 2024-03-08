const express = require("express");
const router = express.Router();
const employeeController = require("../../controllers/admin/employee.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,employeeController.addEmployee);
router.get('/',checkAuth,employeeController.getEmployees);
router.post('/login',employeeController.employeeLogin);
router.get('/wma',checkAuth,employeeController.getEmployeeWma);
router.get('/:id',checkAuth,employeeController.getEmployee);
router.put('/:id',checkAuth,employeeController.updateEmployee);
router.patch('/:id',checkAuth,employeeController.onStatusChange);

module.exports = router 