const pool = require("../../../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// Function to obtain a database connection
const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    throw new Error("Failed to obtain database connection: " + error.message);
  }
};

//errror 422 handler...
error422 = (message, res) => {
  return res.status(422).json({
    status: 422,
    message: message,
  });
};
//error 500 handler...
error500 = (error, res) => {
  return res.status(500).json({
    status: 500,
    message: "Internal Server Error",
    error: error,
  });
};

// add employee...
const addEmployee = async (req, res) => {
  const name = req.body.name ? req.body.name.trim() : '';
  const email_id = req.body.email_id ? req.body.email_id.trim() : '';
  const designation_id = req.body.designation_id ? req.body.designation_id : '';
  let charges = req.body.charges ? req.body.charges : 0;
  const customer_id = req.body.customer_id ? req.body.customer_id : '';
  const password = req.body.password ? req.body.password.trim() : '';
  const untitled_id = req.companyData.untitled_id ? req.companyData.untitled_id : '';

  if (!name) {
    return error422("Name is required.", res);
  } else if (!email_id) {
    return error422("Email id is required.", res);
  } else if (!designation_id) {
    return error422("Dessignation id is required.", res);
  } else if (!customer_id) {
    return error422("Customer id is required.", res);
  } else if (!password) {
    return error422("Password is required.", res);
  } else if(!untitled_id) {
    return error422("Untitled id is required.", res)
  }

  //Check if wm_customer_header exists
  const isCustomerExistsQuery = "SELECT c.*, cb.branch_id, cb.branch FROM  wm_customer_header c LEFT JOIN wm_customer_branch cb ON cb.customer_id = c.customer_id  WHERE  c.customer_id = ?";
  const customerExistResult = await pool.query(isCustomerExistsQuery, [customer_id]);
  if (customerExistResult[0].length == 0) {
    return error422("Customer Not Found.", res);
  }
  const branch_id = customerExistResult[0][0].branch_id;

  // Check if designation exists
  const designationQuery = "SELECT * FROM designation WHERE designation_id  = ? AND untitled_id = ?";
  const designationResult = await pool.query(designationQuery, [designation_id, untitled_id]);
  if (designationResult[0].length == 0) {
    return error422("Designation Not Found.", res);
  }

  //check if designation is doctor
  if (designationResult[0][0].designation_name.toLowerCase().trim()=='doctor') {
   if (!charges) {
    return error422("Charges is required", res);
   }
  } else {
    charges = 0
  }

  //check employee  already is exists or notemployee
  const isExistEmployeeQuery = `SELECT * FROM employee  WHERE LOWER(TRIM(email_id)) = ? AND untitled_id = ?`;
  const isExistEmployeeResult = await pool.query(isExistEmployeeQuery, [email_id.toLowerCase(), untitled_id]);
  if (isExistEmployeeResult[0].length > 0) {
    return error422("Email ID is already exists.", res);
  }
  // Attempt to obtain a database connection
  let connection = await getConnection();

  try {
    // Start a transaction
    await connection.beginTransaction();

    //insert into employee
    const insertEmployeeQuery = `INSERT INTO employee (name, email_id, untitled_id, customer_id, designation_id, charges) VALUES (?, ?, ?, ?, ?, ?)`;
    const insertEmployeeValues = [name, email_id, untitled_id, customer_id, designation_id, charges];
    const employeeResult = await connection.query(insertEmployeeQuery, insertEmployeeValues);
    const employee_id = employeeResult[0].insertId;

    const hash = await bcrypt.hash(password, 10); // Hash the password using bcrypt

    // Insert untitled details
    const insertUntitledQuery = "INSERT INTO untitled (customer_id, branch_id, employee_id, email_id, extenstions,category) VALUES (?,?,?,?,?,?)";
    const insertUntitledValues = [customer_id, branch_id, employee_id, email_id, hash, 3,];
    const insertUntitledResult = await connection.query(insertUntitledQuery, insertUntitledValues);
    const customer_untitled_id = insertUntitledResult[0].insertId;

    // Commit the transaction
    await connection.commit();
    res.status(200).json({
      status: 200,
      message: "Employee added successfully",
    });
  } catch (error) {
    await connection.rollback();
    return error500(error, res);
  } finally {
    await connection.release();
  }
};

// get employees list...
const getEmployees = async (req, res) => {
  const { page, perPage, key } = req.query;
  const untitled_id = req.companyData.untitled_id;
  try {
    let getEmployeeQuery = `SELECT e.*, d.designation_name, cb.branch   FROM employee e
        LEFT JOIN wm_customer_branch cb
        ON cb.customer_id = e.customer_id
        LEFT JOIN designation d
        ON d.designation_id = e.designation_id
        WHERE e.untitled_id = ${untitled_id}`;

    let countQuery = `SELECT COUNT(*) AS total FROM employee e
        LEFT JOIN wm_customer_branch cb
        ON cb.customer_id = e.customer_id
        LEFT JOIN designation d
        ON d.designation_id = e.designation_id
        WHERE e.untitled_id = ${untitled_id}`;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (key === "activated") {
        getEmployeeQuery += ` AND e.status = 1`;
        countQuery += ` AND e.status = 1`;
      } else if (key === "deactivated") {
        getEmployeeQuery += ` AND e.status = 0`;
        countQuery += ` AND e.status = 0`;
      } else {
        getEmployeeQuery += ` AND  LOWER(e.name) LIKE '%${lowercaseKey}%' `;
        countQuery += ` AND LOWER(e.name) LIKE '%${lowercaseKey}%' `;
      }
    }
    getEmployeeQuery += " ORDER BY e.cts DESC";

    // Apply pagination if both page and perPage are provided
    let total = 0;
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);
      total = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getEmployeeQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    const result = await pool.query(getEmployeeQuery);
    const employee = result[0];

    const data = {
      status: 200,
      message: "Employee retrieved successfully",
      data: employee,
    };
    // Add pagination information if provided
    if (page && perPage) {
      data.pagination = {
        per_page: perPage,
        total: total,
        current_page: page,
        last_page: Math.ceil(total / perPage),
      };
    }

    return res.status(200).json(data);
  } catch (error) {
    return error500(error, res);
  }
};

// get employee  by id...
const getEmployee = async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const untitled_id = req.companyData.untitled_id;
  try {
    const employeeQuery = `SELECT e.*, e.untitled_id, d.designation_name, cb.branch  FROM  employee e
      LEFT JOIN wm_customer_branch cb
      ON cb.customer_id = e.customer_id
      LEFT JOIN designation d
      ON d.designation_id = e.designation_id
      WHERE e.employee_id  = ? AND e.untitled_id = ?`;
    const employeeResult = await pool.query(employeeQuery, [employeeId, untitled_id]);

    if (employeeResult[0].length == 0) {
      return error422("Employee Not Found.", res);
    }
    const employee = employeeResult[0][0];

    return res.status(200).json({
      status: 200,
      message: "Employee Retrived Successfully",
      data: employee,
    });
  } catch (error) {
    return error500(error, res);
  }
};

//employee  update...
const updateEmployee = async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const name = req.body.name ? req.body.name : "";
  const email_id = req.body.email_id ? req.body.email_id : "";
  const customer_id = req.body.customer_id ? req.body.customer_id : "";
  const designation_id = req.body.designation_id ? req.body.designation_id : "";
  let charges = req.body.charges ? req.body.charges : 0;
  const untitled_id = req.companyData.untitled_id;

  if (!name) {
    return error422(" Name is required.", res);
  } else if (!email_id) {
    return error422("Email Id is required.", res);
  } else if (!untitled_id) {
    return error422("Untitled id is required.", res);
  } else if (!designation_id) {
    return error422("Designation id is required.", res);
  } else if (!employeeId) {
    return error422("Employee id is required.", res);
  } else if(!customer_id) {
    return error422("Customer id is required.", res);
  }
    // Check if employee exists
    const employeeQuery = "SELECT * FROM employee WHERE employee_id  = ? AND untitled_id = ?";
    const employeeResult = await pool.query(employeeQuery, [employeeId, untitled_id]);
    if (employeeResult[0].length == 0) {
      return error422("Employee Not Found.", res);
    }
    //check if wm_customer_header exists
    const isCustomerExistsQuery = "SELECT c.*, cb.branch_id, cb.branch FROM wm_customer_header c LEFT JOIN wm_customer_branch cb ON cb.customer_id = c.customer_id WHERE c.customer_id = ?";
    const  customerExistResult = await pool.query(isCustomerExistsQuery, [customer_id]);
    if (customerExistResult[0].length == 0){
      return error422("Customer Not Found.",res);
    }
    const branch_id = customerExistResult[0][0].branch_id;
    // check if designation exists
    const isDesignationExistsQuery = "SELECT * FROM designation WHERE designation_id = ? AND untitled_id = ?";
    const isDesignationExistsResult = await pool.query(isDesignationExistsQuery, [designation_id, untitled_id]);
    if (isDesignationExistsResult[0].length == 0) {
      return error422("Designation Not Found.", res);
    }
      //check if designation is doctor
  if (isDesignationExistsResult[0][0].designation_name.toLowerCase().trim()=='doctor') {
    if (!charges) {
     return error422("Charges is required", res);
    }
   } else {
    charges = 0;
   }
    // Check if the provided employee exists and is active
    const existingEmployeeQuery ="SELECT * FROM employee WHERE  LOWER(TRIM(email_id)) = ? AND (employee_id!=? AND untitled_id = ?)";
    const existingEmployeeResult = await pool.query(existingEmployeeQuery, [email_id.toLowerCase(),employeeId, untitled_id]);
    if (existingEmployeeResult[0].length > 0) {
      return error422("Email ID already exists.", res);
    }
 // Attempt to obtain a database connection
 let connection = await getConnection();

 try {
   // Start a transaction
   await connection.beginTransaction();

    const nowDate = new Date().toISOString().split("T")[0];
    // Update the employee record with new data
    const updateQuery = `
            UPDATE employee
            SET name = ?,  email_id = ?, customer_id = ?, designation_id = ?, charges = ? untitled_id = ?, mts = ?
            WHERE employee_id = ?`;
    await connection.query(updateQuery, [name, email_id, customer_id, designation_id, charges, untitled_id, nowDate, employeeId]);
    // Insert untitled details
    const updateUntitledQuery = `UPDATE untitled 
      SET customer_id = ?, branch_id = ?, email_id = ?, mts = ?
      WHERE employee_id = ?`;
    const updateUntitledValues = [customer_id, branch_id, email_id, nowDate, employeeId];
    const updateUntitledResult = await connection.query( updateUntitledQuery, updateUntitledValues);
    //commit the transaction
    await connection.commit();
    return res.status(200).json({
      status: 200,
      message: "Employee updated successfully.",
    });
  } catch (error) {
    await connection.rollback();
    return error500(error, res);
  } finally {
    await connection.release();
  }
};

//status change of employee...
const onStatusChange = async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const status = parseInt(req.query.status); // Validate and parse the status parameter
  const untitled_id = req.companyData.untitled_id;
  try {
    // Check if the employee  exists
    const employeeQuery = "SELECT * FROM employee WHERE employee_id = ? AND untitled_id = ?";
    const employeeResult = await pool.query(employeeQuery, [employeeId, untitled_id]);

    if (employeeResult[0].length == 0) {
      return res.status(404).json({
        status: 404,
        message: "Employee Not Found.",
      });
    }

    // Validate the status parameter
    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        status: 400,
        message:
          "Invalid status value. Status must be 0 (inactive) or 1 (active).",
      });
    }

    // Soft update the employee status
    const updateQuery = `
            UPDATE employee
            SET status = ?
            WHERE employee_id = ?
        `;

    await pool.query(updateQuery, [status, employeeId]);

    const statusMessage = status === 1 ? "activated" : "deactivated";

    return res.status(200).json({
      status: 200,
      message: `Employee ${statusMessage} successfully.`,
    });
  } catch (error) {
    return error500(error, res);
  }
};
//get employee active...
const getEmployeeWma = async (req, res) => {
  const untitled_id = req.companyData.untitled_id;
  let employeeQuery = `SELECT e.*, d.designation_name, cb.branch   FROM employee e
  LEFT JOIN wm_customer_branch cb
  ON cb.customer_id = e.customer_id
  LEFT JOIN designation d
  ON d.designation_id = e.designation_id
  LEFT JOIN untitled u
  ON u.employee_id = e.employee_id
    WHERE e.status = 1 AND u.category=3 ORDER BY e.cts DESC`;
  try {
    const employeeResult = await pool.query(employeeQuery);
    const employee = employeeResult[0];

    return res.status(200).json({
      status: 200,
      message: "Employee retrieved successfully.",
      data: employee,
    });
  } catch (error) {
    return error500(error, res);
  }
};
//Login employee...
const employeeLogin = async (req, res) => {
  const email_id = req.body.email_id ? req.body.email_id.trim() : "";
  const password = req.body.password ? req.body.password.trim() : "";

  if (!email_id) {
    return error422("Email Id is Required.", res);
  } else if (!password) {
    return error422("Password is Required.", res);
  }

  try {
    // Check if the customer with the provided customer email id exists and is active
    const checkCustomerQuery = "SELECT * FROM employee WHERE LOWER(TRIM(email_id)) = ?";
    const checkCustomerResult = await pool.query(checkCustomerQuery, [email_id.toLowerCase()]);
    const wm_customer_header = checkCustomerResult[0][0];
    if (!wm_customer_header) {
      return error422("Authentication failed.", res);
    }
    // Check if the customer with the provided customer email id exists
    const checkCustomerUntitledQuery = "SELECT * FROM untitled WHERE LOWER(TRIM(email_id)) = ? AND category = 3";
    const checkCustomerUntitledResult = await pool.query(checkCustomerUntitledQuery, [email_id.toLowerCase()]);
    const wm_customer_untitled = checkCustomerUntitledResult[0][0];
    if (!wm_customer_untitled) {
      return error422("Authentication failed.", res);
    }
    try {
      const isPasswordValid = await bcrypt.compare(password, wm_customer_untitled.extenstions);
      if (!isPasswordValid) {
        return error422("Password worng.", res);
      }

      // Generate a JWT token
      const token = jwt.sign(
        {
          untitled_id: wm_customer_untitled.untitled_id,
          email_id: wm_customer_header.email_id,
        },
        "secret_this_should_be", // Use environment variable for secret key
        { expiresIn: "1h" }
      );

      const customerDataQuery = `SELECT e.*, u.untitled_id, d.designation_name  FROM  employee e 
          LEFT JOIN untitled u 
          ON u.employee_id =e.employee_id 
          LEFT JOIN designation d
          ON d.designation_id = e.designation_id
          WHERE e.employee_id = ? `;
      let customerDataResult = await pool.query(customerDataQuery, [wm_customer_header.employee_id]);

      // Commit the transaction
      return res.status(200).json({
        status: 200,
        message: "Authentication successfully",
        token: token,
        expiresIn: 3600, // 1 hour in seconds,
        data: customerDataResult[0][0],
        category: wm_customer_header.category,
      });
    } catch (error) {
      throw error; // Rethrow the error to be caught by the outer try-catch block
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error,
    });
  }
};
module.exports = {
  addEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  onStatusChange,
  getEmployeeWma,
  employeeLogin
};
