const pool = require("../../../db");
const fs = require('fs'); // Required for file system operations
const path = require("path"); // Required for working with file paths
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Buffer } = require('buffer');

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

//Login admin (customer)...
const customerLogin = async (req, res) => {
  const email_id = req.body.email_id ? req.body.email_id.trim() : "";
  const password = req.body.password ? req.body.password.trim() : "";

  if (!email_id) {
    return error422(" Email Id is Required.", res);
  } else if (!password) {
    return error422("Password is Required.", res);
  }

  try {
    // Check if the customer with the provided customer email id exists and is active
    const checkCustomerQuery = "SELECT * FROM wm_customer_header WHERE LOWER(TRIM(customer_email)) = ?";
    const checkCustomerResult = await pool.query(checkCustomerQuery, [email_id.toLowerCase()]);
    const wm_customer_header = checkCustomerResult[0][0];
    if (!wm_customer_header) {
      return error422("Authentication failed.", res);
    }
    // Check if the customer with the provided customer email id exists
    const checkCustomerUntitledQuery = "SELECT * FROM untitled WHERE LOWER(TRIM(email_id)) = ? AND category = 2";
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
          customer_id: wm_customer_header.customer_id,
          email_id: wm_customer_header.email_id,
        },
        "secret_this_should_be", // Use environment variable for secret key
        { expiresIn: "1h" }
      );

      const customerDataQuery = `SELECT c.*, u.untitled_id  FROM  wm_customer_header c LEFT JOIN untitled u ON u.customer_id =c.customer_id WHERE c.customer_id = ? `;
      let customerDataResult = await pool.query(customerDataQuery, [wm_customer_header.customer_id,]);

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


// create customer...
const createCustomer = async (req, res) => {

  const organization_name = req.body.organization_name ? req.body.organization_name.trim() : "";
  const customer_name = req.body.customer_name ? req.body.customer_name.trim() : "";
  const customer_email = req.body.customer_email ? req.body.customer_email.trim() : "";
  const customer_phone = req.body.customer_phone ? req.body.customer_phone : "";
  const logoName = req.body.logoName ? req.body.logoName.trim() : "";
  const logoBase64 = req.body.logoBase64 ? req.body.logoBase64.trim() : "";
  const customer_type_id = req.body.customer_type_id ? req.body.customer_type_id : "";
  const branch = req.body.branch ? req.body.branch.trim() : "";
  const city = req.body.city ? req.body.city.trim() : "";
  const state = req.body.state ? req.body.state.trim() : "";
  const password = req.body.password ? req.body.password.trim() : "";
  const customerModulesDetails = req.body.customerModulesDetails ? req.body.customerModulesDetails : "";
  const untitled_id = req.companyData.untitled_id;

  if (!organization_name) {
    return error422("Organization Name is required.", res);
  } else if (!customer_name) {
    return error422("Customer Name is required.", res);
  } else if (!customer_email) {
    return error422("Customer Email is required.", res);
  } else if (!customer_phone) {
    return error422("Customer Phone is required.", res);
  } else if (!logoName) {
    return error422("Logo Name is required.", res);
  } else if (!logoBase64) {
    return error422("LogoBase64 is required.", res);
  } else if (!customer_type_id) {
    return error422("Customer Type ID is required.", res);
  } else if (!branch) {
    return error422("Branch is required.", res);
  } else if (!city) {
    return error422("City is required.", res);
  } else if (!state) {
    return error422("State is required.", res);
  } else if (!password) {
    return error422("Password is required.", res);
  } else if (!untitled_id) {
    return error422("Untitled ID is required.", res);
  }
  // if customer Modules Details
  if (customerModulesDetails) {
    if (!customerModulesDetails || !Array.isArray(customerModulesDetails) || customerModulesDetails.length === 0) {
      return error422("No Customer Modules Details provided or invalid Customer Modules Details data.", res);
    }
    //check duplicate customer_module_id
    const duplicates = customerModulesDetails.reduce(
      (acc, customer_modules, index) => {
        const { module_id } = customer_modules;
        const foundIndex = customerModulesDetails.findIndex((c, i) => i !== index && c.module_id === module_id);
        if (foundIndex !== -1 && !acc.some((entry) => entry.index === foundIndex)) {
          acc.push({ index, foundIndex });
        }
        return acc;
      }, []
    );

    if (duplicates.length > 0) {
      return error422("Duplicate Customer Modules found in Customer Modules Details array.", res);
    }
  }



  //check wm customer header  already is exists or not
  const isExistCustomerHeaderQuery = `SELECT * FROM wm_customer_header WHERE LOWER(TRIM(customer_email))= ? OR LOWER(TRIM(customer_phone)) = ?`;
  const isExistCustomerHeaderResult = await pool.query(
    isExistCustomerHeaderQuery,
    [customer_email.toLowerCase(), customer_phone]
  );
  const wm_customer_header = isExistCustomerHeaderResult[0];
  if (wm_customer_header.length > 0) {
    if (logoFilePath && fs.existsSync(logoFilePath)) {
      fs.unlinkSync(logoFilePath);
    }
    return error422("Customer Email And Phone Number is already exists.", res);
  }
  let logoFileName = "";
  let logoFilePath = "";
  // Generate logoFileName and logoFilePath if logo provided
  if (logoName && logoBase64) {
    const timestamp = Date.now();
    const fileExtension = path.extname(logoName);
    logoFileName = `${customer_name}_${timestamp}${fileExtension}`;
    logoFilePath = path.join(__dirname, "..", "..", "..", "images", "logo", logoFileName);
    const decodedLogo = Buffer.from(logoBase64, "base64");
    fs.writeFileSync(logoFilePath, decodedLogo);
  }
  // Attempt to obtain a database connection
  let connection = await getConnection();

  try {
    // Start a transaction
    await connection.beginTransaction();
    // Insert wm_customer_header details
    const insertCustomerHeaderQuery = "INSERT INTO wm_customer_header (organization_name, customer_name, customer_email, customer_phone, logo, customer_type_id, untitled_id) VALUES (?,?,?,?,?,?,?)";
    let insertCustomerHeaderValues = [organization_name, customer_name, customer_email, customer_phone, logoFileName, customer_type_id, untitled_id];
    const insertCustomerHeaderResult = await connection.query(insertCustomerHeaderQuery, insertCustomerHeaderValues);
    const customer_id = insertCustomerHeaderResult[0].insertId;

    // Insert wm_customer_branch details
    const insertCustomerBranchQuery = "INSERT INTO wm_customer_branch (customer_id, branch, city, state, untitled_id) VALUES (?,?,?,?,?)";
    const insertCustomerBranchValues = [customer_id, branch, city, state, untitled_id];
    const insertCustomerBranchResult = await connection.query(insertCustomerBranchQuery, insertCustomerBranchValues);
    const branch_id = insertCustomerBranchResult[0].insertId;

    const hash = await bcrypt.hash(password, 10); // Hash the password using bcrypt
    // Insert untitled details
    const insertUntitledQuery = "INSERT INTO untitled (customer_id, branch_id, email_id, extenstions,category) VALUES (?,?,?,?,?)";
    const insertUntitledValues = [customer_id, branch_id, customer_email, hash, 2,];
    const insertUntitledResult = await connection.query(insertUntitledQuery, insertUntitledValues);
    const customer_untitled_id = insertUntitledResult[0].insertId;

    if (customerModulesDetails) {
      for (const row of customerModulesDetails) {
        const module_id = row.module_id;

        //check wm_customer_modules  already is exists or not
        const isExistCustomerModulesQuery = `SELECT * FROM wm_customer_modules WHERE TRIM(customer_id)= ? AND TRIM(module_id) = ?`;
        const isExistCustomerModulesResult = await pool.query(isExistCustomerModulesQuery, [customer_id, module_id]);
        if (isExistCustomerModulesResult[0].length > 0) {
          if (logoFilePath && fs.existsSync(logoFilePath)) {
            fs.unlinkSync(logoFilePath);
          }
          return error422("Customer Id And Module Id is already exists.", res);
        }

        try {
          //insert  into customer modules  table...
          const insertCustomerModulesQuery = "INSERT INTO wm_customer_modules (customer_id, module_id,untitled_id) VALUES (?, ?,?)";
          const insertCustomerModulesValues = [customer_id, module_id, customer_untitled_id,];
          const insertCustomerModulesResult = await connection.query(insertCustomerModulesQuery, insertCustomerModulesValues);
        } catch (error) {
          // Handle errors
          await connection.rollback();
          if (logoFilePath && fs.existsSync(logoFilePath)) {
            fs.unlinkSync(logoFilePath);
          }
          return error500(error, res);
        }
      }
    }

    // Commit the transaction
    await connection.commit();
    // Generate a JWT token
    const token = jwt.sign(
      {
        untitled_id: customer_untitled_id,
        email_id: customer_email,
      },
      "secret_this_should_be", // Use environment variable for secret key
      { expiresIn: "1h" }
    );
    return res.status(200).json({
      status: 200,
      message: "Customer added successfully",
      data: {
        customer_id: customer_id,
        untitled_id: customer_untitled_id,
        category: 2,
        token: token,
        expiresIn: 3600, // 1 hour in seconds,
      },
    });
  } catch (error) {
    // Handle errors
    await connection.rollback();
    // If logo was uploaded before error occurred, delete the uploaded image
    if (logoFilePath && fs.existsSync(logoFilePath)) {
      fs.unlinkSync(logoFilePath);
    }
    return error500(error, res);
  } finally {
    await connection.release();
  }
};

// get customer Lists ...
const getCustomers = async (req, res) => {
  const { page, perPage, key } = req.query;
  const untitled_id = req.companyData.untitled_id;

  try {
    let getCustomerQuery = `SELECT c.*, u.untitled_id, cb.branch_id, cb.branch, cb.city, cb.state   FROM wm_customer_header c
      LEFT JOIN untitled u 
      ON c.untitled_id = u.untitled_id
      LEFT JOIN wm_customer_branch cb
      ON c.customer_id = cb.customer_id
      WHERE c.untitled_id = ${untitled_id}`;

    let countQuery = `SELECT COUNT(*) AS total FROM wm_customer_header c
      LEFT JOIN untitled u
      ON c.untitled_id = u.untitled_id
      LEFT JOIN wm_customer_branch cb
      ON c.customer_id = cb.customer_id
      WHERE c.untitled_id = ${untitled_id}`;
    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (key === "activated") {
        getCustomerQuery += ` AND c.status = 1`;
        countQuery += ` AND c.status = 1`;
      } else if (key === "deactivated") {
        getCustomerQuery += ` AND c.status = 0`;
        countQuery += ` AND c.status = 0`;
      } else {
        getCustomerQuery += ` AND  LOWER(c.customer_name) LIKE '%${lowercaseKey}%' `;
        countQuery += ` AND LOWER(c.customer_name) LIKE '%${lowercaseKey}%' `;
      }
    }
    getCustomerQuery += " ORDER BY c.cts DESC";
    let total = 0;
    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);

      total = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getCustomerQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    const result = await pool.query(getCustomerQuery);
    const customer = result[0];
    const data = {
      status: 200,
      message: "Customer retrieved successfully",
      data: customer,
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
// get customer  by id...
const getCustomer = async (req, res) => {
  const customerheaderId = parseInt(req.params.id);
  try {
    const customerheaderQuery = `SELECT c.*, cb.branch_id, cb.branch, cb.city, cb.state  FROM  wm_customer_header c
          LEFT JOIN wm_customer_branch cb
          ON c.customer_id = cb.customer_id
          WHERE c.customer_id  = ?`;
    const customerheaderResult = await pool.query(customerheaderQuery, [customerheaderId]);

    const customermodulesQuery = `SELECT cm.*, m.module_name FROM wm_customer_modules cm LEFT JOIN wm_modules m ON m.module_id = cm.module_id WHERE cm.customer_id = ?`;
    const customermodulesResult = await pool.query(customermodulesQuery, [customerheaderId]);

    if (customerheaderResult[0].length === 0) {
      return error422("Customer Not Found.", res);
    }
    customerheaderResult[0][0]["customerModulesDetails"] = customermodulesResult[0];
    const customer = customerheaderResult[0][0];
    return res.status(200).json({
      status: 200,
      message: "Customer Retrieved Successfully",
      data: customer,
    });
  } catch (error) {
    return error500(error, res);
  }
};
//customer update...
const updateCustomer = async (req, res) => {
  const customerId = parseInt(req.params.id);
  const organization_name = req.body.organization_name ? req.body.organization_name.trim() : "";
  const customer_name = req.body.customer_name ? req.body.customer_name.trim() : "";
  const customer_email = req.body.customer_email ? req.body.customer_email.trim() : "";
  const customer_phone = req.body.customer_phone ? req.body.customer_phone : "";
  const logoName = req.body.logoName ? req.body.logoName.trim() : "";
  const logoBase64 = req.body.logoBase64 ? req.body.logoBase64.trim() : "";
  const customer_type_id = req.body.customer_type_id ? req.body.customer_type_id : "";
  const branch = req.body.branch ? req.body.branch.trim() : "";
  const city = req.body.city ? req.body.city.trim() : "";
  const state = req.body.state ? req.body.state.trim() : "";
  const customerModulesDetails = req.body.customerModulesDetails ? req.body.customerModulesDetails : "";
  const untitled_id = req.companyData.untitled_id;

  if (!organization_name) {
    return error422("Organization Name is required.", res);
  } else if (!customer_name) {
    return error422("Customer Name is required.", res);
  } else if (!customer_email) {
    return error422("Customer Email is required.", res);
  } else if (!customer_phone) {
    return error422("Customer Phone is required.", res);
  } else if (!logoName) {
    return error422("Logo Name is required.", res);
  } else if (!logoBase64) {
    return error422("LogoBase64 is required.", res);
  } else if (!customer_type_id) {
    return error422("Customer Type ID is required.", res);
  } else if (!branch) {
    return error422("Branch is required.", res);
  } else if (!city) {
    return error422("City is required.", res);
  } else if (!state) {
    return error422("State is required.", res);
  } else if (!untitled_id) {
    return error422("Untitled ID is required.", res);
  } else if (!customerId) {
    return error422("Customer Id   is required.", res);
  }

  // Check if customer exists
  const customerQuery = "SELECT * FROM wm_customer_header WHERE customer_id = ?";
  const customerResult = await pool.query(customerQuery, [customerId]);
  if (customerResult[0].length == 0) {
    return error422("Customer Not Found.", res);
  }

  // if wm customer modules details
  if (customerModulesDetails) {
    if (!customerModulesDetails || !Array.isArray(customerModulesDetails) || customerModulesDetails.length === 0) {
      return error422("No Customer Modules Details provided or invalid Customer Modules Details data.", res);
    }

    //check duplicate customer_module_id
    const duplicates = customerModulesDetails.reduce((acc, customer_modules, index) => {
      const { module_id } = customer_modules;
      const foundIndex = customerModulesDetails.findIndex((c, i) => i !== index && c.module_id === module_id);
      if (foundIndex !== -1 && !acc.some((entry) => entry.index === foundIndex)) {
        acc.push({ index, foundIndex });
      }
      return acc;
    }, []);

    if (duplicates.length > 0) {
      return error422("Duplicate Customer Modules found in Customer Modules Details array.", res);
    }
  }

  //check wm customer header  already is exists or not
  const isExistCustomerHeaderQuery = `SELECT * FROM wm_customer_header WHERE LOWER(TRIM(customer_email))= ? OR TRIM(customer_phone) = ?`;
  const isExistCustomerHeaderResult = await pool.query(isExistCustomerHeaderQuery, [customer_email.toLowerCase(), customer_phone]);
  if (isExistCustomerHeaderResult[0].length > 0) {
    return error422("Customer Email And Phone Number is already exists.", res);
  }

  // Attempt to obtain a database connection
  let connection = await getConnection();

  try {
    //Check if the provided wm customer exists and is active
    const existingCustomerQuery = "SELECT * FROM wm_customer_header WHERE LOWER(TRIM( customer_name )) = ? AND customer_id!=?";
    const existingCustomerResult = await pool.query(existingCustomerQuery, [customer_name.trim().toLowerCase(), customerId,]);
    if (existingCustomerResult[0].length > 0) {
      return error422("Customer Name already exists.", res);
    }

    // Start a transaction
    await connection.beginTransaction();
    const nowDate = new Date().toISOString().split("T")[0];
    //  Generate logoFileName and logoFilePath if logo provided
    let logoFileName = "";
    let logoFilePath = "";
    if (logoName && logoBase64) {
      const timestamp = Date.now();
      const fileExtension = path.extname(logoName);
      logoFileName = `${customer_name}_${timestamp}${fileExtension}`;
      logoFilePath = path.join(__dirname, "..", "..", "..", "images", "logo", logoFileName);

      const decodedLogo = Buffer.from(logoBase64, "base64");
      fs.writeFileSync(logoFilePath, decodedLogo);
    }
    // Update the lead record with new data
    const updateQuery = `
              UPDATE wm_customer_header
              SET   organization_name = ?,
              customer_name = ?,
              customer_email = ?,
              customer_phone = ?,
              logo = ?,
              customer_type_id = ?,
              untitled_id = ?, mts=?
              WHERE customer_id = ?
          `;
    await pool.query(updateQuery, [organization_name,customer_name,customer_email,customer_phone,logoFileName,customer_type_id,untitled_id,nowDate,customerId]);

    const UpdateQuery = `
                UPDATE wm_customer_branch
                SET   customer_id = ?,
                branch = ?,
                state = ?,
                untitled_id = ?, mts=?
                WHERE branch = ?
            `;
    await pool.query(UpdateQuery, [customerId,branch,state,untitled_id,nowDate,branch]);

    if (customerModulesDetails) {
      for (const row of customerModulesDetails) {
        const module_id = row.module_id;
        // Check if customer modules exists
        const customermodulesQuery ="SELECT * FROM wm_customer_modules WHERE module_id = ?";
        const customermodulesResult = await connection.query(customermodulesQuery,[module_id]);
        if (customermodulesResult[0].length > 0) {
          try {
            // Update the customer Modules Details record with new data
            const updateCustomerModulesQuery = `
                          UPDATE wm_customer_modules
                          SET customer_id = ?,module_id=?,
                          WHERE customer_module_id = ?
                          `;

            // Pass the values as an array to the connection.query method
            await connection.query(updateCustomerModulesQuery, [customerId]);
          } catch (error) {
            // Rollback the transaction
            await connection.rollback();
            return error500(error, res);
          }
        } else {
          //insert wm_customer_header  Details id  and customer Modules id  table...
          const insertCustomerModulesQuery ="INSERT INTO wm_customer_modules (customer_id, module_id) VALUES (?, ?)";
          const insertCustomerModulesValues = [customerId, module_id];
          const insertCustomerModulesResult = await connection.query(insertCustomerModulesQuery,insertCustomerModulesValues);
          const customer_module_id = insertCustomerModulesResult[0].insertId;
        }
      }
    }

    await connection.commit();
    return res.status(200).json({
      status: 200,
      message: "Customer updated successfully.",
    });
  } catch (error) {
    await connection.rollback();
    return error500(error, res);
  }
};

//status change of customer...
const onStatusChange = async (req, res) => {
  const customerId = parseInt(req.params.id);
  const status = parseInt(req.query.status); // Validate and parse the status parameter
  try {
    // Check if the customer  exists
    const customerQuery = "SELECT * FROM wm_customer_header WHERE customer_id = ?";
    const customerResult = await pool.query(customerQuery, [customerId]);

    if (customerResult[0].length == 0) {
      return res.status(404).json({
        status: 404,
        message: "Customer not found.",
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

    // Soft update the customer status
    const updateQuery = `
            UPDATE wm_customer_header
            SET status = ?
            WHERE customer_id = ?
        `;

    await pool.query(updateQuery, [status, customerId]);

    const statusMessage = status === 1 ? "activated" : "deactivated";

    return res.status(200).json({
      status: 200,
      message: `Customer ${statusMessage} successfully.`,
    });
  } catch (error) {
    return error500(error, res);
  }
};
//get customer active...
const getCustomerWma = async (req, res) => {
  let customerQuery =
    "SELECT c.*  FROM wm_customer_header c LEFT JOIN untitled u ON u.untitled_id = c.untitled_id WHERE c.status =1 AND u.category=1 ORDER BY c.cts DESC";
  try {
    const customerResult = await pool.query(customerQuery);
    const customer = customerResult[0];

    return res.status(200).json({
      status: 200,
      message: "Customer retrieved successfully.",
      data: customer,
    });
  } catch (error) {
    return error500(error, res);
  }
};

module.exports = {
  customerLogin,
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  onStatusChange,
  getCustomerWma,
};
