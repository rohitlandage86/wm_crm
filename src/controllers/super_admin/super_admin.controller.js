const pool = require("../../../db");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
//error 422 handle...
error422 = (message, res) => {
  return res.status(422).json({
    status: 422,
    message: message,
  });
};
//error 500 handle...
error500 = (err, res) => {
  return res.status(500).json({
    status: 500,
    message: "Internal Server Error",
    error: err,
  });
};
//create super admin...
const createSuperAdmin = async (req, res) => {
  const email_id = req.body.email_id ? req.body.email_id.trim() : "";
  const password = req.body.password ? req.body.password.trim() : "";
  const customer_id = req.body.customer_id ? req.body.customer_id : "";
  const branch_id = req.body.branch_id ? req.body.branch_id : "";
  const category = req.body.category ? req.body.category : "";
  if (!email_id) {
    return error422("Email Id is required", res);
  } else if (!password) {
    return error422("Password is required", res);
  } else if ((!customer_id) && (customer_id != 0)) {
    return error422("Customer Id is required.", res);
  } else if ((!branch_id) && (branch_id != 0)) {
    return error422("Branch ID is required.", res);
  }
  //check email_id already exists in untitled
  const isExistEmailIdQuery = `SELECT * FROM untitled WHERE LOWER(TRIM(email_id))= ?`;
  const isExistEmailIdResult = await pool.query(isExistEmailIdQuery, [
    email_id
  ]);
  const untitled = isExistEmailIdResult[0];
  if (untitled.length > 0) {
    return error422(" Email Id is already exists.", res);
  }
  try {


    const hash = await bcrypt.hash(password, 10); // Hash the password using bcrypt

    // Insert untitled details
    const insertUntitledQuery =
      "INSERT INTO untitled (email_id, extenstions, customer_id, branch_id, category) VALUES (?,?,?,?,?)";
    const insertUntitledValues = [
      email_id,
      hash,
      customer_id,
      branch_id,
      1,
    ];

    const insertUntitledResult = await pool.query(
      insertUntitledQuery,
      insertUntitledValues
    );
    const untitled_id = insertUntitledResult[0].insertId;

    // Generate a JWT token
    const token = jwt.sign(
      {
        untitled_id: untitled.untitled_id,
        email_id: untitled.email_id,
      },
      "secret_this_should_be", // Use environment variable for secret key
      { expiresIn: "1h" }
    );
    return res.status(200).json({
      status: 200,
      message: "Super Admin added successfully",
      data: {
        untitled_id: untitled_id,
        category: 1,
        token: token,
        expiresIn: 3600, // 1 hour in seconds,
      },
    });
  } catch (error) {
    return error500(error, res);
  }
};

const login = async (req, res) => {
  const email_id = req.body.email_id ? req.body.email_id.trim() : '';
  const password = req.body.password ? req.body.password.trim() : '';

  if (!email_id) {
    return error422("Email id is required.", res);
  } else if (!password) {
    return error422("Password is required.", res);
  }

  try {
    // check if the untitled with provided email id exist and its active
    const checkUntitledQuery = "SELECT * FROM untitled WHERE LOWER(TRIM(email_id)) = ?";
    const checkUntitledResult = await pool.query(checkUntitledQuery, [email_id]);
    const untitled = checkUntitledResult[0][0];
    if (!untitled) {
      return error422("Authentication failed.", res);
    }
    const isPasswordValid = await bcrypt.compare(password,untitled.extenstions);
    if (!isPasswordValid) {
      return error422("Password worng.", res);
    }

    let untitledDataResult ={}
    if (untitled.category == 1) {
      const customerInfoQuery = 
      `SELECT u.email_id, u.category, u.untitled_id
      FROM  untitled u 
      WHERE u.untitled_id = ? `;
      const customerInfoResult = await pool.query(customerInfoQuery,[untitled.untitled_id]);
      untitledDataResult = customerInfoResult[0][0];
    } else if (untitled.category == 2) {
      //get customer info
      const customerInfoQuery = 
      `SELECT u.email_id, u.category, c.*, cb.*, ct.customer_type, u.untitled_id, s.state_name
      FROM  untitled u 
      LEFT JOIN wm_customer_header c 
      ON c.customer_id = u.customer_id 
      LEFT JOIN wm_customer_branch cb 
      ON cb.branch_id = u.branch_id 
      LEFT JOIN wm_cutomer_type ct
      ON ct.customer_type_id  = c.customer_type_id 
      LEFT JOIN state s
      ON s.state_id  = cb.state_id 
      WHERE u.untitled_id = ? `;
      const customerInfoResult = await pool.query(customerInfoQuery,[untitled.untitled_id]);
      untitledDataResult = customerInfoResult[0][0];

      //get customer module
      const customerModuleInfoQuery = `SELECT cm.customer_module_id, cm.module_id, m.module_name FROM wm_customer_modules cm 
      LEFT JOIN wm_modules m
      ON m.module_id = cm.module_id
      WHERE cm.customer_id = ?`;
      const customerModuleInfoResult = await pool.query(customerModuleInfoQuery,[untitledDataResult.customer_id]);
      untitledDataResult['customerModelDetails'] = customerModuleInfoResult[0]
    } else if (untitled.category ==3){
      const employeeInfoQuery = 
      `SELECT u.email_id, u.category, u.untitled_id, u.employee_id, u.customer_id, cb.branch, cb.city, cb.state, s.state_name, cb.branch_id, e.name, e.designation_id, d.designation_name
      FROM  untitled u 
      LEFT JOIN employee e 
      ON e.employee_id = u.employee_id
      LEFT JOIN wm_customer_branch cb 
      ON cb.branch_id = u.branch_id 
      LEFT JOIN designation d 
      ON d.designation_id = e.designation_id 
      LEFT JOIN state s
      ON s.state_id  = cb.state_id 
      WHERE u.untitled_id = ? `;
      const employeeInfoResult = await pool.query(employeeInfoQuery,[untitled.untitled_id]);
      untitledDataResult = employeeInfoResult[0][0];
    } else{
      return error422("Authentication failed.",res);
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        untitled_id: untitled.untitled_id,
        email_id: untitled.email_id,
      },
      "secret_this_should_be", // Use environment variable for secret key
      { expiresIn: "1h" }
    );
    
    // Commit the transaction
    return res.status(200).json({
      status: 200,
      message: "Authentication successfully",
      token: token,
      expiresIn: 3600, // 1 hour in seconds,
      data: untitledDataResult,
      category :untitled.category
    });
  } catch (error) {
    return error500(error, res);
  }
}
//get alll lead status list
const getAllLeadStatusList = async (req, res )=> {
  try {
    const leadStatusQuery = "SELECT * FROM lead_status WHERE status = 1";
    const leadStatusResult = await pool.query(leadStatusQuery);
    return res.status(200).json({
      status:200,
      message:"Lead status retrived successfully.",
      data:leadStatusResult[0]
    })
  } catch (error) {
    return error500(error);
  }
}
//get all state list
const getAllStateList = async (req, res) =>{
  try {
    const stateQuery = "SELECT * FROM state WHERE status = 1";
    const stateResult = await pool.query(stateQuery);
    return res.status(200).json({
      status:200,
      message:"State retrived successfully",
      data:stateResult[0]
    })
  } catch (error) {
    return error500(error,res);
  }
}
module.exports = {
  createSuperAdmin,
  login,
  getAllLeadStatusList,
  getAllStateList
};
