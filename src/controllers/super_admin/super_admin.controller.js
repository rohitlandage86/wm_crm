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
  if (untitled.length>0) {
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

//Login  super admin...
const superadminLogin = async (req, res) => {
  const email_id = req.body.email_id ? req.body.email_id.trim() : "";
  const password = req.body.password ? req.body.password.trim() : "";

  if (!email_id) {
    return error422("Email Id is Required.", res);
  } else if (!password) {
    return error422("Password is Required.", res);
  }
  try {
  
    // Check if the untiled with the provided email id exists and is active
    const checkUntitledQuery =
      "SELECT * FROM untitled WHERE LOWER(TRIM(email_id)) = ?";
    const checkUntitledResult = await pool.query(checkUntitledQuery, [
      email_id,
    ]);
    const untitled = checkUntitledResult[0][0];
    if (!untitled) {
      return error422("Authentication failed. Contact to admin.", res);
    }
    try {
      const isPasswordValid = await bcrypt.compare(
        password,
        untitled.extenstions
      );

      if (!isPasswordValid) {
        return error422("Password worng.", res);
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
      const untitledDataQuery = `SELECT untitled_id , email_id,category  FROM  untitled 
    WHERE untitled_id = ? `;
      let untitledDataResult = await pool.query(untitledDataQuery,[untitled.untitled_id]);
    
    
      // Commit the transaction
      return res.status(200).json({
        status: 200,
        message: "Authentication successfully",
        token: token,
        expiresIn: 3600, // 1 hour in seconds,
        data: untitledDataResult[0][0],
        category: untitled.category,
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
  createSuperAdmin,
  superadminLogin,

};
