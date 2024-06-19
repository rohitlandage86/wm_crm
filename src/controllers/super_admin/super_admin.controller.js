const pool = require("../../../db");
const bcrypt = require('bcrypt');
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
//error 422 handle...
error422 = (message, res) => {
  return res.status(422).json({
    status: 422,
    message: message,
  });
};
//error 500 handle...
error500 = (err, res) => {
   res.json({
    status: 500,
    message: "Internal Server Error",
    error: err,
  });
  res.end();
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
    const isPasswordValid = await bcrypt.compare(password, untitled.extenstions);
    if (!isPasswordValid) {
      return error422("Password worng.", res);
    }

    let untitledDataResult = {}
    if (untitled.category == 1) {
      const customerInfoQuery =
        `SELECT u.email_id, u.category, u.untitled_id
      FROM  untitled u 
      WHERE u.untitled_id = ? `;
      const customerInfoResult = await pool.query(customerInfoQuery, [untitled.untitled_id]);
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
      const customerInfoResult = await pool.query(customerInfoQuery, [untitled.untitled_id]);
      untitledDataResult = customerInfoResult[0][0];

      //get customer module
      const customerModuleInfoQuery = `SELECT cm.customer_module_id, cm.module_id, m.module_name FROM wm_customer_modules cm 
      LEFT JOIN wm_modules m
      ON m.module_id = cm.module_id
      WHERE cm.customer_id = ?`;
      const customerModuleInfoResult = await pool.query(customerModuleInfoQuery, [untitledDataResult.customer_id]);
      untitledDataResult['customerModelDetails'] = customerModuleInfoResult[0]
    } else if (untitled.category == 3) {
      const employeeInfoQuery =
        `SELECT u.email_id, u.category, c.logo, c.short_logo, u.untitled_id, u.employee_id, u.customer_id, cb.branch, cb.city, cb.state_id, s.state_name, cb.branch_id, e.name, e.designation_id, d.designation_name
      FROM  untitled u 
      LEFT JOIN wm_customer_header c 
      ON c.customer_id = u.customer_id 
      LEFT JOIN employee e 
      ON e.employee_id = u.employee_id
      LEFT JOIN wm_customer_branch cb 
      ON cb.branch_id = u.branch_id 
      LEFT JOIN designation d 
      ON d.designation_id = e.designation_id 
      LEFT JOIN state s
      ON s.state_id  = cb.state_id 
      WHERE u.untitled_id = ? `;
      const employeeInfoResult = await pool.query(employeeInfoQuery, [untitled.untitled_id]);
      untitledDataResult = employeeInfoResult[0][0];
    } else {
      return error422("Authentication failed.", res);
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
      category: untitled.category
    });
  } catch (error) {
    return error500(error, res);
  }
}
//get alll lead status list
const getAllLeadStatusList = async (req, res, next) => {
  try {
    const leadStatusQuery = "SELECT * FROM lead_status WHERE status = 1";
    const leadStatusResult = await pool.query(leadStatusQuery);
    res.status(200).json({
      status: 200,
      message: "Lead status retrived successfully.",
      data: leadStatusResult[0]
    });
    res.end();
  } catch (error) {
    error500(error);
  } finally {
    if (pool) {
      pool.releaseConnection();
    }
  }
}
//get all state list
const getAllStateList = async (req, res, next) => {
  try {
    const stateQuery = "SELECT * FROM state WHERE status = 1";
    const stateResult = await pool.query(stateQuery);
    res.json({
      status: 200,
      message: "State retrived successfully",
      data: stateResult[0]
    })
    res.end();
  } catch (error) {
    error500(error, res);
  } finally {
    if (pool) {
      pool.releaseConnection();
    }
  }
}
//------------------------multiple lead footer and lead header get and upload in database -------------------------------------//
const getDemo = async (req, res) => {
  try {
    const query = `SELECT h.* 
  FROM   nirmitikolhapur_tbl_inquiry_header h
  where h.inquiry_date >= '2023-10-01' 
  ORDER BY h.inquiry_date DESC;`
    const result = await pool.query(query)
    let leadResult = result[0];
    for (let index = 0; index < leadResult.length; index++) {
      const element = leadResult[index];
      let footerQuery = `SELECT * FROM nirmitikolhapur_tbl_inquiry_footer WHERE inquiry_id = ${element.inquiry_id}`;
      let footerResult = await pool.query(footerQuery);
      leadResult[index]['leadFooterDetails'] = footerResult[0]
    }

    res.status(200).json({
      status: "Lead retrived successfully ",
      data: leadResult
    })
  } catch (error) {
    return error500(error, res);
  }
}
const leadUpload = async (req, res) => {
  const { leadData } = req.body;

  if (!leadData) {
    return error422("Lead Data is required.", res);
  }
  //attempt to obtain a database connection
  let connection = await getConnection();

  try {
    for (let index = 0; index < leadData.length; index++) {
      const element = leadData[index];
      let insertQuery = `INSERT INTO lead_header ( lead_date, category_id, name, city, mobile_number, note, customer_id, untitled_id) VALUES
       (?, ?, ?, ?, ?, ?, ?, ?)`;
      let insertValue = [element.inquiry_date, element.inquiry_type_id, element.name, element.city, element.mobile, element.inquiry_description, 3, 2]
      let LeadResult = await connection.query(insertQuery, insertValue);
      if (element.leadFooterDetails.length > 0) {
        for (let index = 0; index < element.leadFooterDetails.length; index++) {
          const footer = element.leadFooterDetails[index];
          try {
            let insertFooterQuery = `INSERT INTO lead_footer ( lead_hid, comments, follow_up_date, calling_time, no_of_calls, lead_status_id) VALUES
          (?, ?, ?, ?, ?, ?)`;
            let insertFooterValue = [LeadResult[0].insertId, footer.comment_by_receptionist, footer.follow_up_date, footer.ftime, footer.no_of_call, 1]
            await connection.query(insertFooterQuery, insertFooterValue);
          } catch (error) {
            // Handle errors
            await connection.rollback();
            return error500(error, res);
          }
        }
      }

    }
    //commit the  transaction
    await connection.commit();
    res.status(200).json({
      status: "Lead upload successfully "
    })
  } catch (error) {
    // Handle errors
    await connection.rollback();
    return error500(error, res);
  }
}
// ----------------------- single footer and lead header get and upload in database------------------------------------//
const getLeadOPDList = async (req, res) => {
  //sangli 
  // nirmitisangli_tbl_inquiry_header
  // nirmitisangli_tbl_inquiry_footer
  //kolhapur
  // nirmitikolhapur_tbl_inquiry_header
  // nirmitikolhapur_tbl_inquiry_footer
  try {
    const query = `WITH RankedData AS (
      SELECT 
          h.inquiry_id,
          h.inquiry_date,
          h.inquiry_type_id,
          h.inquiry_cat_name,
          h.name,
          h.city,
          h.mobile,
          h.inquiry_description,
          f.comment_by_receptionist,
          f.follow_up_date,
          f.ftime,
          f.no_of_call,
         f.status,
        f.cts,
          ROW_NUMBER() OVER(PARTITION BY h.inquiry_id ORDER BY f.follow_up_date DESC) AS rn
      FROM 
          nirmitikolhapur_tbl_inquiry_header AS h
      JOIN 
          nirmitikolhapur_tbl_inquiry_footer AS f
      ON 
          f.inquiry_id = h.inquiry_id
      WHERE 
          f.follow_up_date > '2024-01-01' AND f.status='Follow Up'
  )
  
  SELECT 
      inquiry_id,
      inquiry_date,
      inquiry_type_id,
      inquiry_cat_name,
      name,
      city,
      mobile,
      inquiry_description,
      comment_by_receptionist,
      follow_up_date,
      ftime, no_of_call,status,cts
  FROM 
      RankedData
  WHERE 
      rn = 1
  ORDER BY 
      inquiry_id DESC`
    const result = await pool.query(query)
    let leadResult = result[0];

    res.status(200).json({
      status: "Lead OPD retrived successfully ",
      data: leadResult
    })
  } catch (error) {
    return error500(error, res);
  }
}
const wmLeadUpload = async (req, res) => {
  const { leadData } = req.body;

  if (!leadData) {
    return error422("Lead Data is required.", res);
  }
  //attempt to obtain a database connection
  let connection = await getConnection();

  try {
    for (let index = 0; index < leadData.length; index++) {
      const element = leadData[index];
      let category_name = '';
      category_name = element.inquiry_cat_name.trim().toLowerCase();

      let getCategoryQuery = `SELECT * FROM category WHERE LOWER(TRIM( category_name )) = '${category_name}' `;
      let getCategoryResult = await connection.query(getCategoryQuery);
      let insertQuery = `INSERT INTO lead_header ( lead_date, category_id, name, city, mobile_number, note, customer_id, untitled_id) VALUES
       (?, ?, ?, ?, ?, ?, ?, ?)`;
      let insertValue = [element.inquiry_date, getCategoryResult[0][0].category_id, element.name, element.city, element.mobile, element.inquiry_description, 4, 7]
      let LeadResult = await connection.query(insertQuery, insertValue);
      let insertFooterQuery = `INSERT INTO lead_footer ( lead_hid, comments, follow_up_date, calling_time, no_of_calls, lead_status_id) VALUES
      (?, ?, ?, ?, ?, ?)`;
      let insertFooterValue = [LeadResult[0].insertId, element.comment_by_receptionist, element.follow_up_date, element.ftime, element.no_of_call, 1]
      await connection.query(insertFooterQuery, insertFooterValue);

    }
    //commit the  transaction
    await connection.commit();
    res.status(200).json({
      status: "Lead upload successfully "
    })
  } catch (error) {
    // Handle errors
    console.log(error);
    await connection.rollback();
    return error500(error, res);
  }
}
module.exports = {
  createSuperAdmin,
  login,
  getAllLeadStatusList,
  getAllStateList,
  getDemo,
  leadUpload,
  getLeadOPDList,
  wmLeadUpload
};
