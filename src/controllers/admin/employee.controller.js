const pool = require("../../../db");


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
  const name = req.body.name ? req.body.name.trim() : "";
  const email_id = req.body.email_id ? req.body.email_id : "";
  const branch_id = req.body.branch_id ? req.body.branch_id : "";
  const designation_id = req.body.designation_id ? req.body.designation_id : "";
  // const untitled_id  = req.companyData.untitled_id ;
  const untitled_id = 1;

  if (!name) {
    return error422("Name is required.", res);
  } else if (!email_id) {
    return error422("Email ID is required.", res);
  } else if (!branch_id) {
    return error422("Branch ID is required.", res);
  } else if (!designation_id) {
    return error422("Designation ID is required.", res);
  }
  // Check if wm_customer- branch exists
  const wmcustomerbranchQuery =
    "SELECT * FROM wm_customer_branch WHERE branch_id  = ?";
  const wmcustomerbranchResult = await pool.query(wmcustomerbranchQuery, [
    branch_id,
  ]);
  if (wmcustomerbranchResult[0].length == 0) {
    return error422("Branch Not Found.", res);
  }
  // Check if designation exists
  const designationQuery =
    "SELECT * FROM designation WHERE designation_id  = ?";
  const designationResult = await pool.query(designationQuery, [designation_id]);
  if (designationResult[0].length == 0) {
    return error422("Designation Not Found.", res);
  }
  //check employee  already is exists or not
  const isExistEmployeeQuery = `SELECT * FROM employee WHERE LOWER(TRIM(name))= ? OR LOWER(TRIM(email_id)) = ?`;
  const isExistEmployeeResult = await pool.query(isExistEmployeeQuery, [
    name.toLowerCase(),
    email_id.toLowerCase(),
  ]);
  if (isExistEmployeeResult[0].length > 0) {
    return error422(" Name And Email ID is already exists.", res);
  }

  try {
    //insert into employee
    const insertEmployeeQuery = `INSERT INTO employee (name, email_id, untitled_id, branch_id, designation_id) VALUES (?, ?, ?, ?, ?)`;
    const insertEmployeeValues = [
      name,
      email_id,
      untitled_id,
      branch_id,
      designation_id,
    ];
    const employeeResult = await pool.query(insertEmployeeQuery, insertEmployeeValues);

    res.status(200).json({
      status: 200,
      message: "Employee added successfully",
    });
  } catch (error) {
    return error500(error, res);
  }
};

// get employees list...
const getEmployees = async (req, res) => {
  const { page, perPage, key } = req.query;
  // const untitled_id = req.companyData.untitled_id;
  const untitled_id = 1;

  try {
    let getEmployeeQuery = `SELECT e.*, cb.branch, d.designation_name   FROM employee e
        LEFT JOIN wm_customer_branch cb
        ON cb.branch_id = e.branch_id
        LEFT JOIN designation d
        ON d.designation_id = e.designation_id
        WHERE e.untitled_id = ${untitled_id}`;

    let countQuery = `SELECT COUNT(*) AS total FROM employee e
        LEFT JOIN wm_customer_branch cb
        ON cb.branch_id = e.branch_id
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

  try {
    const employeeQuery = `SELECT e.*, u.untitled_id  FROM  employee e
        LEFT JOIN untitled u 
        ON e.untitled_id = e.untitled_id
        WHERE e.employee_id  = ?`;
    const employeeResult = await pool.query(employeeQuery, [employeeId]);

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
  const branch_id = req.body.branch_id ? req.body.branch_id : "";
  const designation_id = req.body.designation_id ? req.body.designation_id : "";
  // const untitled_id = req.companyData.untitled_id;
  const untitled_id = 1;
  if (!name) {
    return error422(" Name is required.", res);
  } else if (!email_id) {
    return error422("Email Id is required.", res);
  } else if (!branch_id) {
    return error422("Branch id is required.", res);
  } else if (!untitled_id) {
    return error422("Untitled id is required.", res);
  } else if (!designation_id) {
    return error422("Designation id is required.", res);
  } else if (!employeeId) {
    return error422("Employee id is required.", res);
  }
  try {
    // Check if employee exists
    const employeeQuery = "SELECT * FROM employee WHERE employee_id  = ?";
    const employeeResult = await pool.query(employeeQuery, [employeeId]);
    if (employeeResult[0].length == 0) {
      return error422("Employee Not Found.", res);
    }

    // Check if the provided employee exists and is active
    const existingEmployeeQuery =
      "SELECT * FROM employee WHERE LOWER(TRIM(name))= ? OR LOWER(TRIM(email_id)) = ? AND employee_id!=?";
    const existingEmployeeResult = await pool.query(existingEmployeeQuery, [
      name.trim().toLowerCase(),
      email_id.toLowerCase(),
      employeeId,
    ]);

    if (existingEmployeeResult[0].length > 0) {
      return error422("Name And Email ID already exists.", res);
    }
    
    const nowDate = new Date().toISOString().split("T")[0];
    // Update the employee record with new data
    const updateQuery = `
            UPDATE employee
            SET name = ?,  email_id = ?, branch_id = ?, designation_id = ?, untitled_id = ?, mts = ?
            WHERE employee_id = ?
        `;

    await pool.query(updateQuery, [
      name,
      email_id,
      branch_id,
      designation_id,
      untitled_id,
      nowDate,
      employeeId,
    ]);

    return res.status(200).json({
      status: 200,
      message: "Employee updated successfully.",
    });
  } catch (error) {
    return error500(error, res);
  }
};

//status change of employee...
const onStatusChange = async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const status = parseInt(req.query.status); // Validate and parse the status parameter
  try {
    // Check if the employee  exists
    const employeeQuery = "SELECT * FROM employee WHERE employee_id = ?";
    const employeeResult = await pool.query(employeeQuery, [employeeId]);

    if (employeeResult[0].length == 0) {
      return res.status(404).json({
        status: 404,
        message: "Employee not found.",
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
  let employeeQuery = `SELECT e.*, cb.branch, d.designation_name  FROM employee e 
    LEFT JOIN wm_customer_branch cb
    ON cb.branch_id = e.branch_id
    LEFT JOIN designation d
    ON d.designation_id = e.designation_id
    LEFT JOIN untitled u 
    ON u.untitled_id = e.untitled_id 
    WHERE e.status = 1 AND u.category=1 ORDER BY e.cts DESC`;
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

module.exports = {
  addEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  onStatusChange,
  getEmployeeWma,
};
