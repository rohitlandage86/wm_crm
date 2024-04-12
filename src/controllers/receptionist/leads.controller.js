const pool = require("../../../db");
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
//add leads header...
const addleads = async (req, res) => {
  const lead_date = req.body.lead_date ? req.body.lead_date : "";
  const category_id = req.body.category_id ? req.body.category_id : "";
  const name = req.body.name ? req.body.name.trim() : "";
  const city = req.body.city ? req.body.city.trim() : "";
  const mobile_number = req.body.mobile_number ? req.body.mobile_number : "";
  const note = req.body.note ? req.body.note.trim() : "";
  const leadFooterDetails = req.body.leadFooterDetails ? req.body.leadFooterDetails : "";
  const untitled_id = req.companyData.untitled_id;

  if (!lead_date) {
    return error422("Lead date is required.", res);
  } else if (!category_id) {
    return error422("Category id is required.", res);
  } else if (!name) {
    return error422("Name is required.", res);
  } else if (!mobile_number) {
    return error422("Mobile number is required.", res);
  } else if (!untitled_id) {
    return error422("Untitled id is required.", res);
  }
  // if lead Footer Details
  if (leadFooterDetails) {
    if (!leadFooterDetails || !Array.isArray(leadFooterDetails) || leadFooterDetails.length === 0) {
      return error422("No Leads Details provided or invalid Leads Details data.", res);
    }

    if (leadFooterDetails.length != 1) {
      return error422("No Leads Details provided or invalid Leads Details data.", res);
    }
  }
  //check untitled_id already is exists or not
  const isExistUntitledIdQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const isExistUntitledIdResult = await pool.query(isExistUntitledIdQuery, [untitled_id]);
  const employeeDetails = isExistUntitledIdResult[0][0];
  if (employeeDetails.customer_id == 0) {
    return error422("Customer Not Found.", res);
  }
  //check lead_header already is exists or not
  const isExistLeadHeaderQuery = `SELECT * FROM lead_header WHERE mobile_number = ? AND customer_id = ?`;
  const isExistLeadHeaderResult = await pool.query(isExistLeadHeaderQuery, [mobile_number, employeeDetails.customer_id]);
  if (isExistLeadHeaderResult[0].length > 0) {
    return error422("Mobile Number is already exists.", res);
  }

  // Attempt to obtain a database connection
  let connection = await getConnection();

  try {
    // Start a transaction
    await connection.beginTransaction();
    // Insert lead_header details
    const insertLeadHeaderQuery = "INSERT INTO lead_header (lead_date, name, category_id, city, mobile_number, note, untitled_id,customer_id) VALUES (?,?,?,?,?,?,?,?)";
    const insertLeadHeaderValues = [lead_date, name, category_id, city, mobile_number, note, untitled_id, employeeDetails.customer_id];
    const insertLeadHeaderResult = await connection.query(insertLeadHeaderQuery, insertLeadHeaderValues);
    const lead_hid = insertLeadHeaderResult[0].insertId;

    if (leadFooterDetails) {
      for (const row of leadFooterDetails) {
        const comments = row.comments;
        const calling_time = row.calling_time;
        const no_of_calls = row.no_of_calls;
        const lead_status_id = row.lead_status_id;
        const follow_up_date = row.follow_up_date;

        //insert  into lead footer  table...
        const insertLeadFooterQuery = "INSERT INTO lead_footer (lead_hid, comments, follow_up_date, calling_time, no_of_calls,lead_status_id) VALUES (?, ?, ?,?,?,?)";
        const insertLeadFooterValues = [lead_hid, comments, follow_up_date, calling_time, no_of_calls, lead_status_id];
        const insertLeadFooterResult = await connection.query(insertLeadFooterQuery, insertLeadFooterValues);
      }
    }

    // Commit the transaction
    await connection.commit();

    return res.status(200).json({
      status: 200,
      message: "Leads added successfully",
    });
  } catch (error) {
    // Handle errors
    await connection.rollback();
    return error500(error, res);
  } finally {
    await connection.release();
  }
};
// get lead_headers list...
const getLeadHeaders = async (req, res) => {
  const { page, perPage, key, fromDate, toDate, category_id } = req.query;
  const untitled_id = req.companyData.untitled_id;

  //check untitled_id already is exists or not
  const isExistUntitledIdQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const isExistUntitledIdResult = await pool.query(isExistUntitledIdQuery, [untitled_id]);
  const employeeDetails = isExistUntitledIdResult[0][0];
  if (employeeDetails.customer_id == 0) {
    return error422("Customer Not Found.", res);
  }
  try {
    let getLeadHeaderQuery = `SELECT l.*, c.category_name, e.name as employee_name  FROM lead_header l
          LEFT JOIN category c
          ON c.category_id = l.category_id
          LEFT JOIN untitled u
          ON u.untitled_id = l.untitled_id
          LEFT JOIN employee e
          ON e.employee_id = u.employee_id
          WHERE l.customer_id = ${employeeDetails.customer_id}`;

    let countQuery = `SELECT COUNT(*) AS total FROM lead_header l
          LEFT JOIN category c
          ON c.category_id = l.category_id
          LEFT JOIN untitled u
          ON u.untitled_id = l.untitled_id
          LEFT JOIN employee e
          ON e.employee_id = u.employee_id
          WHERE l.customer_id = ${employeeDetails.customer_id}`;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (key === "activated") {
        getLeadHeaderQuery += ` AND l.status = 1`;
        countQuery += ` AND l.status = 1`;
      } else if (key === "deactivated") {
        getLeadHeaderQuery += ` AND l.status = 0`;
        countQuery += ` AND l.status = 0`;
      } else {
        // getLeadHeaderQuery += ` AND (LOWER(l.name ) LIKE '%${lowercaseKey}%' OR LOWER(l.mobile_number) LIKE '%${lowercaseKey}%' ) `;
        // countQuery += ` AND (LOWER(l.name ) LIKE '%${lowercaseKey}%' OR LOWER(l.mobile_number) LIKE '%${lowercaseKey}%' ) `;
      }
    }
    if (fromDate && toDate) {
      getLeadHeaderQuery += ` AND l.lead_date >= '${fromDate}' AND l.lead_date <= '${toDate}'`;
      countQuery += ` AND l.lead_date >= '${fromDate}' AND l.lead_date <= '${toDate}'`;
    }
    if (category_id) {
      getLeadHeaderQuery += ` AND l.category_id = '${category_id}'`;
      countQuery += ` AND l.category_id = '${category_id}'`;
    }

    getLeadHeaderQuery += " ORDER BY l.cts DESC";

    // Apply pagination if both page and perPage are provided
    let total = 0;
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);
      total = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getLeadHeaderQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    const result = await pool.query(getLeadHeaderQuery);
    const lead_header = result[0];

    const data = {
      status: 200,
      message: " Leads retrieved successfully",
      data: lead_header,
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
// get leads Header by id...
const getLeadsHeaderById = async (req, res) => {
  const leadheaderId = parseInt(req.params.id);
  const untitled_id = req.companyData.untitled_id;

  //check untitled_id already is exists or not
  const isExistUntitledIdQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const isExistUntitledIdResult = await pool.query(isExistUntitledIdQuery, [untitled_id]);
  const employeeDetails = isExistUntitledIdResult[0][0];
  if (employeeDetails.customer_id == 0) {
    return error422("Customer Not Found.", res);
  }

  try {
    const leadheaderQuery = `SELECT * FROM lead_header WHERE lead_hid = ? AND customer_id = ?`;
    const leadheaderResult = await pool.query(leadheaderQuery, [leadheaderId, employeeDetails.customer_id]);

    const leadfooterQuery = `SELECT lf.*, ls.lead_status FROM lead_footer lf LEFT JOIN lead_status ls ON ls.lead_status_id = lf.lead_status_id  WHERE lf.lead_hid = ?`;
    const leadfooterResult = await pool.query(leadfooterQuery, [leadheaderId]);


    if (leadheaderResult[0].length === 0) {
      return error422("Leads Not Found.", res);
    }
    leadheaderResult[0][0]["leadFooterDetails"] = leadfooterResult[0];
    const lead = leadheaderResult[0][0];
    return res.status(200).json({
      status: 200,
      message: "Leads Retrieved Successfully",
      data: lead,
    });
  } catch (error) {
    return error500(error, res);
  }
};
//lead_header update...
const updateLeads = async (req, res) => {
  const leadId = parseInt(req.params.id);
  const lead_date = req.body.lead_date ? req.body.lead_date : "";
  const category_id = req.body.category_id ? req.body.category_id : "";
  const name = req.body.name ? req.body.name.trim() : "";
  const city = req.body.city ? req.body.city.trim() : "";
  const mobile_number = req.body.mobile_number ? req.body.mobile_number : "";
  const note = req.body.note ? req.body.note.trim() : "";
  const leadFooterDetails = req.body.leadFooterDetails ? req.body.leadFooterDetails : "";
  const untitled_id = req.companyData.untitled_id;
  if (!lead_date) {
    return error422("Lead Date is required.", res);
  } else if (!category_id) {
    return error422("Category Id is required.", res);
  } else if (!name) {
    return error422("Name is required.", res);
  } else if (!mobile_number) {
    return error422("Mobile Number is required.", res);
  } else if (!note) {
    return error422("Note is required.", res);
  } else if (!city) {
    return error422("City is required.", res);
  } else if (!untitled_id) {
    return error422("Untitled ID is required.", res);
  } else if (!leadId) {
    return error422("Lead Header Id is required", res);
  }

  // Check if lead exists
  const leadQuery = "SELECT * FROM lead_header WHERE lead_hid = ?";
  const leadResult = await pool.query(leadQuery, [leadId]);
  if (leadResult[0].length == 0) {
    return error422("Leads Not Found.", res);
  }

  // if lead Footer details
  if (leadFooterDetails) {
    if (!leadFooterDetails || !Array.isArray(leadFooterDetails) || leadFooterDetails.length === 0) {
      return error422("No Leads  details provided or invalid Lead  Details data.", res);
    }
    //check duplicate lead_footer id
    const duplicates = leadFooterDetails.reduce((acc, lead_footer, index) => {
      const { lead_fid } = lead_footer;
      const foundIndex = leadFooterDetails.findIndex((l, i) => i !== index && l.lead_fid === lead_fid);
      if (foundIndex !== -1 && !acc.some((entry) => entry.index === foundIndex)) {
        acc.push({ index, foundIndex });
      }
      return acc;
    }, []);

    if (duplicates.length > 0) {
      return error422("Duplicate lead footer found in lead footer Details array.", res);
    }
  }
  //check untitled_id already is exists or not
  const isExistUntitledIdQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const isExistUntitledIdResult = await pool.query(isExistUntitledIdQuery, [untitled_id]);
  const employeeDetails = isExistUntitledIdResult[0][0];
  if (employeeDetails.customer_id == 0) {
    return error422("Customer Not Found.", res);
  }

  //check lead_header  already is exists or not
  const isExistLeadHeaderQuery = `SELECT * FROM lead_header WHERE mobile_number = ? AND lead_hid!=? AND customer_id = ? `;
  const isExistLeadHeaderResult = await pool.query(isExistLeadHeaderQuery, [mobile_number, leadId, employeeDetails.customer_id]);
  if (isExistLeadHeaderResult[0].length > 0) {
    return error422("Mobile Number is already exists.", res);
  }

  // Attempt to obtain a database connection
  let connection = await getConnection();

  try {
    // Start a transaction
    await connection.beginTransaction();
    const nowDate = new Date().toISOString().split("T")[0];
    // Update the lead record with new data
    const updateQuery = `
         UPDATE lead_header
         SET lead_date = ?, category_id = ?, name = ?, mobile_number = ?, note=?, city=?, customer_id=?, untitled_id=?,  mts = ?
         WHERE lead_hid = ? `;
    await connection.query(updateQuery, [lead_date, category_id, name, mobile_number, note, city, employeeDetails.customer_id, untitled_id, nowDate, leadId]);

    if (leadFooterDetails) {
      for (const row of leadFooterDetails) {
        const lead_fid = row.lead_fid;
        const comments = row.comments;
        const calling_time = row.calling_time;
        const no_of_calls = row.no_of_calls;
        const lead_status_id = row.lead_status_id;
        const follow_up_date = row.follow_up_date;

        // Check if lead footer exists
        const leadfooterQuery = "SELECT * FROM lead_footer WHERE lead_fid = ?";
        const leadfooterResult = await connection.query(leadfooterQuery, [lead_fid]);

        if (leadfooterResult[0].length > 0) {

          try {
            // Update the lead footer record with new data
            const updateLeadFooterQuery = `
            UPDATE lead_footer
            SET lead_hid = ?, comments = ?, calling_time = ?, no_of_calls = ?, lead_status_id = ?, follow_up_date = ?
            WHERE lead_fid = ?`;
            await connection.query(updateLeadFooterQuery, [leadId, comments, calling_time, no_of_calls, lead_status_id, follow_up_date, lead_fid]);
          } catch (error) {
            // Rollback the transaction
            await connection.rollback();
            return error500(error, res);
          }
        } else {

          //insert lead header id  and lead footer id  table...
          const insertLeadFooterQuery = "INSERT INTO lead_footer (lead_hid, comments, follow_up_date, calling_time, no_of_calls, lead_status_id) VALUES (?, ?, ?, ?, ?, ?)";
          const insertLeadFooterValues = [leadId, comments, follow_up_date, calling_time, no_of_calls, lead_status_id];
          const insertLeadFooterResult = await connection.query(insertLeadFooterQuery, insertLeadFooterValues);
          const lead_fid = insertLeadFooterResult[0].insertId;
        }
      }
    }

    await connection.commit();
    return res.status(200).json({
      status: 200,
      message: "Leads updated successfully.",
    });
  } catch (error) {
    await connection.rollback();
    return error500(error, res);
  }
};
//status change of lead_header...
const onStatusChange = async (req, res) => {
  const leadheaderId = parseInt(req.params.id);
  const status = parseInt(req.query.status); // Validate and parse the status parameter
  const untitled_id = req.companyData.untitled_id;

  //check untitled_id already is exists or not
  const isExistUntitledIdQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const isExistUntitledIdResult = await pool.query(isExistUntitledIdQuery, [untitled_id]);
  const employeeDetails = isExistUntitledIdResult[0][0];
  if (employeeDetails.customer_id == 0) {
    return error422("Customer Not Found.", res);
  }

  try {
    // Check if the lead_header  exists
    const leadheaderQuery = "SELECT * FROM lead_header WHERE lead_hid = ? AND customer_id  = ?";
    const leadheaderResult = await pool.query(leadheaderQuery, [leadheaderId, employeeDetails.customer_id]);

    if (leadheaderResult[0].length == 0) {
      return res.status(404).json({
        status: 404,
        message: "leads not found.",
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

    // Soft update the lead_header status
    const updateQuery = `
            UPDATE lead_header
            SET status = ?
            WHERE lead_hid = ? `;

    await pool.query(updateQuery, [status, leadheaderId]);

    const statusMessage = status === 1 ? "activated" : "deactivated";

    return res.status(200).json({
      status: 200,
      message: `Leads ${statusMessage} successfully.`,
    });
  } catch (error) {
    return error500(error, res);
  }
};
//get lead_header active...
const getLeadHeaderWma = async (req, res) => {
  let leadheaderQuery = `SELECT l.*, e.name as employee_name  FROM lead_header l 
  LEFT JOIN untitled u 
  ON u.untitled_id = l.untitled_id 
  LEFT JOIN  employee e
  ON e.employee_id = u.employee_id
  WHERE l.status =1 AND u.category=3 ORDER BY l.cts DESC`;
  try {
    const lead_headerResult = await pool.query(leadheaderQuery);
    const lead_header = lead_headerResult[0];

    return res.status(200).json({
      status: 200,
      message: "Leads retrieved successfully.",
      data: lead_header,
    });
  } catch (error) {
    return error500(error, res);
  }
};
//delete lead_footer
const deleteLeadFooter = async (req, res) => {
  const lead_fid = parseInt(req.params.id);

  const isLeadFooterQuery =
    "SELECT * FROM lead_footer WHERE lead_fid = ?";
  const leadfooterResult = await pool.query(isLeadFooterQuery, [
    lead_fid,
  ]);
  if (leadfooterResult[0].length == 0) {
    return res.status(404).json({
      status: 404,
      message: "Lead Footer Not Found.",
    });
  }
  // Attempt to obtain a database connection
  let connection = await getConnection();

  try {
    // Start a transaction
    await connection.beginTransaction();
    //delete lead footer
    const deleteLeadFooterQuery =
      "DELETE FROM lead_footer WHERE lead_fid = ?";
    const deleteLeadFooterResult = await connection.query(
      deleteLeadFooterQuery,
      [lead_fid]
    );


    await connection.commit();
    return res.json({
      status: 200,
      message: "Leads has been deleted successfully.",
    });
  } catch (error) {
    await connection.rollback();
    return error500(error, res);
  }
};
// get follow Leads  list...
const getFollowUpLeadsList = async (req, res) => {
  const { page, perPage, key, lead_date, fromDate, toDate, lead_status_id ,follow_up_date} = req.query;
  const untitled_id = req.companyData.untitled_id;

  //check untitled_id already is exists or not
  const isExistUntitledIdQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const isExistUntitledIdResult = await pool.query(isExistUntitledIdQuery, [untitled_id]);
  const employeeDetails = isExistUntitledIdResult[0][0];
  if (employeeDetails.customer_id == 0) {
    return error422("Customer Not Found.", res);
  }

  try {
    let getFollowUpQuery = ` SELECT lf.*, lh.category_id, lh.name, lh.category_id, lh.mobile_number, lh.customer_id, lh.untitled_id, lh.note, lh.lead_date, lh.city, c.category_name, e.name as employee_name, ls.lead_status FROM lead_footer lf 
      LEFT JOIN lead_header lh
      ON lh.lead_hid = lf.lead_hid
      LEFT JOIN category c
      ON c.category_id = lh.category_id
      LEFT JOIN untitled u
      ON u.untitled_id = lh.untitled_id
      LEFT JOIN employee e
      ON e.employee_id = u.employee_id
      LEFT JOIN lead_status ls
      ON ls.lead_status_id = lf.lead_status_id
      WHERE lh.customer_id = ${employeeDetails.customer_id} AND lf.isFollowUp = 0 `;
    let countQuery = ` SELECT COUNT(*) AS total FROM lead_footer lf  
      LEFT JOIN lead_header lh
      ON lh.lead_hid = lf.lead_hid
      WHERE lh.customer_id = ${employeeDetails.customer_id} AND lf.isFollowUp = 0 `;

    if (follow_up_date) {
      getFollowUpQuery += ` AND lf.follow_up_date = '${follow_up_date}'`;
      countQuery += ` AND lf.follow_up_date = '${follow_up_date}'`;
    }
    
    if (lead_date) {
      getFollowUpQuery += ` AND lh.lead_date = '${lead_date}'`;
      countQuery += ` AND lh.lead_date = '${lead_date}'`;
    }

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (key === "activated") {
        getFollowUpQuery += ` AND l.status = 1`;
        countQuery += ` AND l.status = 1`;
      } else if (key === "deactivated") {
        getFollowUpQuery += ` AND l.status = 0`;
        countQuery += ` AND l.status = 0`;
      } else {
        getFollowUpQuery += ` AND (LOWER(l.name ) LIKE '%${lowercaseKey}%' OR LOWER(l.mobile_number) LIKE '%${lowercaseKey}%' ) `;
        countQuery += ` AND (LOWER(l.name ) LIKE '%${lowercaseKey}%' OR LOWER(l.mobile_number) LIKE '%${lowercaseKey}%' ) `;
      }
    }
    if (fromDate&&toDate) {
      getFollowUpQuery += ` AND lf.follow_up_date >= '${fromDate}' AND lf.follow_up_date <= '${toDate}'`;      
      countQuery += ` AND lf.follow_up_date >= '${fromDate}' AND lf.follow_up_date <= '${toDate}'`;      
    }
    if (lead_status_id) {
      getFollowUpQuery += ` AND lf.lead_status_id = '${lead_status_id}'`;
      countQuery += ` AND lf.lead_status_id = '${lead_status_id}'`
    }

    getFollowUpQuery += " ORDER BY lf.lead_hid DESC";
    // Apply pagination if both page and perPage are provided 
    let total = 0;
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);
      total = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getFollowUpQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }
    const result = await pool.query(getFollowUpQuery);
    const lead_header = result[0];

    const data = {
      status: 200,
      message: " Leads retrieved successfully",
      data: lead_header,
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
const updateFollowUpLead = async (req, res) => {
  const leadId = parseInt(req.params.id);
  const leadFooterDetails = req.body.leadFooterDetails ? req.body.leadFooterDetails : "";
  const untitled_id = req.companyData.untitled_id;
  if (!untitled_id) {
    return error422("Untitled ID is required.", res);
  } else if (!leadId) {
    return error422("Lead Header Id is required", res);
  }

  // Check if lead exists
  const leadQuery = "SELECT * FROM lead_header WHERE lead_hid = ?";
  const leadResult = await pool.query(leadQuery, [leadId]);
  if (leadResult[0].length == 0) {
    return error422("Leads Not Found.", res);
  }

  // if lead Footer details
  if (leadFooterDetails) {
    if (!leadFooterDetails || !Array.isArray(leadFooterDetails) || leadFooterDetails.length === 0) {
      return error422("No Leads  details provided or invalid Lead  Details data.", res);
    }
    //check duplicate lead_footer id
    const duplicates = leadFooterDetails.reduce((acc, lead_footer, index) => {
      const { lead_fid } = lead_footer;
      const foundIndex = leadFooterDetails.findIndex((l, i) => i !== index && l.lead_fid === lead_fid);
      if (foundIndex !== -1 && !acc.some((entry) => entry.index === foundIndex)) {
        acc.push({ index, foundIndex });
      }
      return acc;
    }, []);

    if (duplicates.length > 0) {
      return error422("Duplicate lead footer found in lead footer Details array.", res);
    }
  }
  //check untitled_id already is exists or not
  const isExistUntitledIdQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const isExistUntitledIdResult = await pool.query(isExistUntitledIdQuery, [untitled_id]);
  const employeeDetails = isExistUntitledIdResult[0][0];
  if (employeeDetails.customer_id == 0) {
    return error422("Customer Not Found.", res);
  }



  // Attempt to obtain a database connection
  let connection = await getConnection();

  try {
    // Start a transaction
    await connection.beginTransaction();
    const nowDate = new Date().toISOString().split("T")[0];

    if (leadFooterDetails) {
      for (const row of leadFooterDetails) {
        const lead_fid = row.lead_fid;
        const comments = row.comments;
        const calling_time = row.calling_time;
        const no_of_calls = row.no_of_calls;
        const lead_status_id = row.lead_status_id;
        const follow_up_date = row.follow_up_date;

        // Check if lead footer exists
        const leadfooterQuery = "SELECT * FROM lead_footer WHERE lead_fid = ?";
        const leadfooterResult = await connection.query(leadfooterQuery, [lead_fid]);

        if (leadfooterResult[0].length > 0) {
          try {
            // Update the lead footer record with new data
            const updateLeadFooterQuery = `
              UPDATE lead_footer
              SET lead_hid = ?, comments = ?, calling_time = ?, no_of_calls = ?, lead_status_id = ?, follow_up_date = ?, isFollowUp = ?
              WHERE lead_fid = ?`;
            await connection.query(updateLeadFooterQuery, [leadId, comments, calling_time, no_of_calls, lead_status_id, follow_up_date, 1, lead_fid]);
          } catch (error) {
            // Rollback the transaction
            await connection.rollback();
            return error500(error, res);
          }
        } else {

          //insert lead header id  and lead footer id  table...
          const insertLeadFooterQuery = "INSERT INTO lead_footer (lead_hid, comments, follow_up_date, calling_time, no_of_calls, lead_status_id) VALUES (?, ?, ?, ?, ?, ?)";
          const insertLeadFooterValues = [leadId, comments, follow_up_date, calling_time, no_of_calls, lead_status_id];
          const insertLeadFooterResult = await connection.query(insertLeadFooterQuery, insertLeadFooterValues);
          const lead_fid = insertLeadFooterResult[0].insertId;
        }
      }
    }

    await connection.commit();
    return res.status(200).json({
      status: 200,
      message: "Leads updated successfully.",
    });
  } catch (error) {
    await connection.rollback();
    return error500(error, res);
  }
}
// search lead_headers list...
const searchLeadHeaders = async (req, res) => {
  const { page, perPage, key } = req.query;
  const untitled_id = req.companyData.untitled_id;

  //check untitled_id already is exists or not
  const isExistUntitledIdQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const isExistUntitledIdResult = await pool.query(isExistUntitledIdQuery, [untitled_id]);
  const employeeDetails = isExistUntitledIdResult[0][0];
  if (employeeDetails.customer_id == 0) {
    return error422("Customer Not Found.", res);
  }
  if (!key) {
    return error422("Search key is required.", res);
  }
  try {
    let getLeadHeaderQuery = `SELECT l.*, c.category_name, e.name as employee_name  FROM lead_header l
          LEFT JOIN category c
          ON c.category_id = l.category_id
          LEFT JOIN untitled u
          ON u.untitled_id = l.untitled_id
          LEFT JOIN employee e
          ON e.employee_id = u.employee_id
          WHERE l.customer_id = ${employeeDetails.customer_id}`;

    let countQuery = `SELECT COUNT(*) AS total FROM lead_header l
          LEFT JOIN category c
          ON c.category_id = l.category_id
          LEFT JOIN untitled u
          ON u.untitled_id = l.untitled_id
          LEFT JOIN employee e
          ON e.employee_id = u.employee_id
          WHERE l.customer_id = ${employeeDetails.customer_id}`;

    const lowercaseKey = key.toLowerCase().trim();
    getLeadHeaderQuery += ` AND (LOWER(l.name ) LIKE '%${lowercaseKey}%' OR l.mobile_number LIKE '%${lowercaseKey}%' ) `;
    countQuery += ` AND (LOWER(l.name ) LIKE '%${lowercaseKey}%' OR l.mobile_number LIKE '%${lowercaseKey}%' ) `;

    getLeadHeaderQuery += " ORDER BY l.cts DESC";

    // Apply pagination if both page and perPage are provided
    let total = 0;
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);
      total = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getLeadHeaderQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    const result = await pool.query(getLeadHeaderQuery);
    const lead_header = result[0];

    const data = {
      status: 200,
      message: "Search Leads headers retrieved successfully",
      data: lead_header,
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
//pending follow up lead list...
const getPendingFollowUpLeadsList = async (req, res) => {
  const { page, perPage, key, lead_date, fromDate, current_date, lead_status_id ,follow_up_date} = req.query;
  const untitled_id = req.companyData.untitled_id;

  //check untitled_id already is exists or not
  const isExistUntitledIdQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const isExistUntitledIdResult = await pool.query(isExistUntitledIdQuery, [untitled_id]);
  const employeeDetails = isExistUntitledIdResult[0][0];
  if (employeeDetails.customer_id == 0) {
    return error422("Customer Not Found.", res);
  }

  try {
    let getFollowUpQuery = ` SELECT lf.*, lh.category_id, lh.name, lh.category_id, lh.mobile_number, lh.customer_id, lh.untitled_id, lh.note, lh.lead_date, lh.city, c.category_name, e.name as employee_name, ls.lead_status FROM lead_footer lf 
      LEFT JOIN lead_header lh
      ON lh.lead_hid = lf.lead_hid
      LEFT JOIN category c
      ON c.category_id = lh.category_id
      LEFT JOIN untitled u
      ON u.untitled_id = lh.untitled_id
      LEFT JOIN employee e
      ON e.employee_id = u.employee_id
      LEFT JOIN lead_status ls
      ON ls.lead_status_id = lf.lead_status_id
      WHERE lh.customer_id = ${employeeDetails.customer_id} AND lf.isFollowUp = 0 AND lf.follow_up_date <= '${current_date}'`;
    let countQuery = ` SELECT COUNT(*) AS total FROM lead_footer lf  
      LEFT JOIN lead_header lh
      ON lh.lead_hid = lf.lead_hid
      WHERE lh.customer_id = ${employeeDetails.customer_id} AND lf.isFollowUp = 0 AND lf.follow_up_date <= '${current_date}' `;

    // if (follow_up_date) {
    //   getFollowUpQuery += ` AND lf.follow_up_date = '${follow_up_date}'`;
    //   countQuery += ` AND lf.follow_up_date = '${follow_up_date}'`;
    // }
    
    // if (lead_date) {
    //   getFollowUpQuery += ` AND lh.lead_date = '${lead_date}'`;
    //   countQuery += ` AND lh.lead_date = '${lead_date}'`;
    // }

    // if (key) {
    //   const lowercaseKey = key.toLowerCase().trim();
    //   if (key === "activated") {
    //     getFollowUpQuery += ` AND l.status = 1`;
    //     countQuery += ` AND l.status = 1`;
    //   } else if (key === "deactivated") {
    //     getFollowUpQuery += ` AND l.status = 0`;
    //     countQuery += ` AND l.status = 0`;
    //   } else {
    //     getFollowUpQuery += ` AND (LOWER(l.name ) LIKE '%${lowercaseKey}%' OR LOWER(l.mobile_number) LIKE '%${lowercaseKey}%' ) `;
    //     countQuery += ` AND (LOWER(l.name ) LIKE '%${lowercaseKey}%' OR LOWER(l.mobile_number) LIKE '%${lowercaseKey}%' ) `;
    //   }
    // }
    // if (fromDate&&toDate) {
    //   getFollowUpQuery += ` AND lf.follow_up_date >= '${fromDate}' AND lf.follow_up_date <= '${toDate}'`;      
    //   countQuery += ` AND lf.follow_up_date >= '${fromDate}' AND lf.follow_up_date <= '${toDate}'`;      
    // }
    // if (lead_status_id) {
    //   getFollowUpQuery += ` AND lf.lead_status_id = '${lead_status_id}'`;
    //   countQuery += ` AND lf.lead_status_id = '${lead_status_id}'`
    // }

    getFollowUpQuery += " ORDER BY lf.lead_hid DESC";
    // Apply pagination if both page and perPage are provided 
    let total = 0;
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);
      total = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getFollowUpQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }
    const result = await pool.query(getFollowUpQuery);
    const lead_header = result[0];

    const data = {
      status: 200,
      message: " Pending leads retrieved successfully",
      data: lead_header,
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
module.exports = {
  addleads,
  getLeadHeaders,
  getLeadsHeaderById,
  updateLeads,
  onStatusChange,
  getLeadHeaderWma,
  getFollowUpLeadsList,
  updateFollowUpLead,
  searchLeadHeaders,
  getPendingFollowUpLeadsList
};
