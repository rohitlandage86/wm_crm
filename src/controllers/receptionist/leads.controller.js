const pool = require("../../../db");
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
// add lead header...
// const addleads = async (req, res) => {
//   const lead_date = req.body.lead_date ? req.body.lead_date : "";
//   const category_id = req.body.category_id ? req.body.category_id : "";
//   const name = req.body.name ? req.body.name.trim() : "";
//   const city = req.body.city ? req.body.city.trim() : "";
//   const mobile_number = req.body.mobile_number ? req.body.mobile_number : "";
//   const note = req.body.note ? req.body.note.trim() : "";
//   const branch_id = req.body.branch_id ? req.body.branch_id : "";
//   //lead footer
//   const comments = req.body.comments ? req.body.comments.trim() : "";
//   const follow_up_date = req.body.follow_up_date ? req.body.follow_up_date : "";
//   const calling_time = req.body.calling_time ? req.body.calling_time : "";
//   const no_of_calls = req.body.no_of_calls ? req.body.no_of_calls : "";
//   const follow_up_status = req.body.follow_up_status ? req.body.follow_up_status : "";
//   // const untitled_id  = req.companyData.untitled_id ;
//   const untitled_id = 1;

//   if (!lead_date) {
//     return error422("Lead Date is required.", res);
//   } else if (!category_id) {
//     return error422("Category Id is required.", res);
//   } else if (!name) {
//     return error422("Name is required.", res);
//   } else if (!mobile_number) {
//     return error422("Mobile Number is required.", res);
//   } else if (!note) {
//     return error422("Note is required.", res);
//   } else if (!city) {
//     return error422("City is required.", res);
//   } else if (!branch_id) {
//     return error422("Branch ID is required.", res);
//   } else if (!untitled_id) {
//     return error422("Untitled ID is required.", res);
//   }else if (!comments) {
//     return error422("Comments is required.", res);
//   }else if (!follow_up_date) {
//     return error422("Follow Up Date is required.", res);
//   }else if (!calling_time) {
//     return error422("Calling Time is required.", res);
//   }else if (!no_of_calls) {
//     return error422("No Of Calls is required.", res);
//   }else if (!follow_up_status) {
//     return error422("Follow Up Status is required.", res);
//   }
//  //check leads already is exists or not
//  const isExistleadsQuery = `SELECT * FROM lead_header WHERE LOWER(TRIM(mobile_number))= ?`;
//  const isExistleadsResult = await pool.query(isExistleadsQuery, [ mobile_number ]);
//  if (isExistleadsResult[0].length > 0) {
//      return error422(" Mobile Number is already exists.", res);
//  } 
//   // Attempt to obtain a database connection
//   let connection = await getConnection();
//   try {
//     // Start a transaction
//     await connection.beginTransaction();
//     //insert into lead_header crm
//     const insertLeadHeaderQuery = `INSERT INTO lead_header (lead_date, category_id, name, mobile_number, note, city, branch_id, untitled_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
//     const insertLeadHeaderValues = [
//       lead_date,
//       category_id,
//       name,
//       mobile_number,
//       note,
//       city,
//       branch_id,
//       untitled_id,
//     ];
//     const lead_headerResult = await connection.query(
//       insertLeadHeaderQuery,
//       insertLeadHeaderValues
//       );
//       const lead_hid = lead_headerResult[0].insertId;
//         //insert into lead_footer 
//         const insertLeadFooterQuery = 'INSERT INTO lead_footer (lead_hid,comments,follow_up_date,calling_time,no_of_calls,follow_up_status) VALUES (?,?,?,?,?,?)';
//         const insertLeadFooterValues = [lead_hid, comments, follow_up_date, calling_time, no_of_calls, follow_up_status];

//         const LeadFooterResult = await connection.query(insertLeadFooterQuery, insertLeadFooterValues);
//         await connection.commit();
//     res.status(200).json({
//       status: 200,
//       message: "Leads Add  successfully",
//     });
//   } catch (error) {
//     return error500(error, res);
//   }
// };
//add leads...
const addleads = async (req, res) => {
  const lead_date = req.body.lead_date ? req.body.lead_date : "";
  const category_id = req.body.category_id ? req.body.category_id : "";
  const name = req.body.name ? req.body.name.trim() : "";
  const city = req.body.city ? req.body.city.trim() : "";
  const mobile_number = req.body.mobile_number ? req.body.mobile_number : "";
  const note = req.body.note ? req.body.note.trim() : "";
  const branch_id = req.body.branch_id ? req.body.branch_id : "";
  const leadFooterDetails = req.body.leadFooterDetails ? req.body.leadFooterDetails : "";
const untitled_id  = req.companyData.untitled_id ;
  //  const untitled_id = 1;
 

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
  } else if (!branch_id) {
    return error422("Branch ID is required.", res);
  } else if (!untitled_id) {
    return error422("Untitled ID is required.", res);
  }
  // if lead Footer Details
  if (leadFooterDetails) {
    if (
      !leadFooterDetails ||
      !Array.isArray(leadFooterDetails) ||
      leadFooterDetails.length === 0
    ) {
      return error422(
        "No Leads Details provided or invalid Leads Details data.",
        res
      );
    }

    //check duplicate lead id
    const duplicates = leadFooterDetails.reduce((acc, lead_footer, index) => {
      const { lead_fid } = lead_footer;
      // || (i !== index && l.lead_fid === lead_fid)
      const foundIndex = leadFooterDetails.findIndex(
        (l, i) => i !== index && l.lead_fid === lead_fid
      );
      if (
        foundIndex !== -1 &&
        !acc.some((entry) => entry.index === foundIndex)
      ) {
        acc.push({ index, foundIndex });
      }
      return acc;
    }, []);

    if (duplicates.length > 0) {
      return error422("Duplicate Leads found in Lead Details array.", res);
    }
  }
//check lead_header  already is exists or not
const isExistLeadHeaderQuery = `SELECT * FROM lead_header WHERE LOWER(TRIM(name))= ? OR LOWER(TRIM(mobile_number)) = ?`;
const isExistLeadHeaderResult = await pool.query(isExistLeadHeaderQuery, [
  name.toLowerCase(),
  mobile_number,
]);
if (isExistLeadHeaderResult[0].length > 0) {
  return error422(" Name And Mobile Number is already exists.", res);
}

  // Attempt to obtain a database connection
  let connection = await getConnection();
  
  try {
    // Start a transaction
    await connection.beginTransaction();
    // Insert lead_header details
    const insertLeadHeaderQuery =
    "INSERT INTO lead_header (lead_date, name, category_id, city, mobile_number, note, branch_id, untitled_id) VALUES (?,?,?,?,?,?,?,?)";
    const insertLeadHeaderValues = [
      lead_date,
      name,
      category_id,
      city,
      mobile_number,
      note,
      branch_id,
      untitled_id
      
    ];
    const insertLeadHeaderResult = await connection.query(
      insertLeadHeaderQuery,
      insertLeadHeaderValues
      );
      const lead_hid = insertLeadHeaderResult[0].insertId;
      
      if (leadFooterDetails) {
        for (const row of leadFooterDetails) {
          const comments = row.comments;
          const calling_time = row.calling_time;
          const no_of_calls = row.no_of_calls;
          const follow_up_status = row.follow_up_status;
          const follow_up_date = row.follow_up_date;
         
     
        
        //insert  into lead footer  table...
        const insertLeadFooterQuery ="INSERT INTO lead_footer (lead_hid, comments, follow_up_date, calling_time, no_of_calls,follow_up_status) VALUES (?, ?, ?,?,?,?)";
        const insertLeadFooterValues = [lead_hid, comments, follow_up_date,calling_time,no_of_calls,follow_up_status];
        const insertLeadFooterResult = await connection.query(insertLeadFooterQuery,insertLeadFooterValues);
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
  const { page, perPage, key } = req.query;
  // const untitled_id = req.companyData.untitled_id;
  const untitled_id = 1;


  try {
    let getLeadHeaderQuery = `SELECT l.*, c.category_name, cb.branch  FROM lead_header l
          LEFT JOIN category c
          ON c.category_id = l.category_id
          LEFT JOIN wm_customer_branch cb
          ON cb.branch_id = l.branch_id
          WHERE l.untitled_id = ${untitled_id}`;

    let countQuery = `SELECT COUNT(*) AS total FROM lead_header l
      LEFT JOIN category c
      ON c.category_id = l.category_id
      LEFT JOIN wm_customer_branch cb
      ON cb.branch_id = l.branch_id
          WHERE l.untitled_id = ${untitled_id}`;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (key === "activated") {
        getLeadHeaderQuery += ` AND l.status = 1`;
        countQuery += ` AND l.status = 1`;
      } else if (key === "deactivated") {
        getLeadHeaderQuery += ` AND l.status = 0`;
        countQuery += ` AND l.status = 0`;
      } else {
        getLeadHeaderQuery += ` AND (LOWER(l.name ) LIKE '%${lowercaseKey}%' OR LOWER(l.mobile_number) LIKE '%${lowercaseKey}%' ) `;
        countQuery += ` AND (LOWER(l.name ) LIKE '%${lowercaseKey}%' OR LOWER(l.mobile_number) LIKE '%${lowercaseKey}%' ) `;
      }
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
// get lead footer Lists ...
const getLeadFooters = async (req, res) => {
  const { page, perPage, key } = req.query;
  // const untitled_id = req.companyData.untitled_id;
  const untitled_id = 1;
 
  
  try {
    let getLeadFooterQuery = `SELECT l.* FROM lead_footer l 
    `;
   

  // return res.json(getPatientVisitListsQuery);
    
    let countQuery = `SELECT COUNT(*) AS total FROM lead_footer l
      `;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (key === "activated") {
        getLeadFooterQuery += ` AND l.status = 1`;
        countQuery += ` AND l.status = 1`;
      } else if (key === "deactivated") {
        getLeadFooterQuery += ` AND l.status = 0`;
        countQuery += ` AND l.status = 0`;
      } else {
        getLeadFooterQuery += ` AND  LOWER(l.follow_up_date) LIKE '%${lowercaseKey}%' `;
        countQuery += ` AND  LOWER(l.follow_up_date) LIKE '%${lowercaseKey}%' `;
      }
    }

    // Apply pagination if both page and perPage are provided
    let total = 0;
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);
      total = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getLeadFooterQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    const result = await pool.query(getLeadFooterQuery);
    const lead_footer = result[0];
  

    const data = {
      status: 200,
      message: "Lead Footer retrieved successfully",
      data: lead_footer,
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
// get leads  by id...
const getLeads = async (req, res) => {
  const leadheaderId = parseInt(req.params.id);
  try {
    const leadheaderQuery = `SELECT * FROM lead_header WHERE lead_hid = ?`;
    const leadheaderResult = await pool.query(leadheaderQuery, [leadheaderId]);

    const leadfooterQuery = `SELECT * FROM lead_footer WHERE lead_hid = ?`;
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
  const branch_id = req.body.branch_id ? req.body.branch_id : "";
  const leadFooterDetails = req.body.leadFooterDetails ? req.body.leadFooterDetails : "";
// const untitled_id = req.companyData.untitled_id;
  const untitled_id = 1;

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
  } else if (!branch_id) {
    return error422("Branch ID is required.", res);
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
    if (
      !leadFooterDetails ||
      !Array.isArray(leadFooterDetails) ||
      leadFooterDetails.length === 0
    ) {
      return error422(
        "No Leads  details provided or invalid Lead  Details data.",
        res
      );
    }
    //check duplicate lead_footer id
    const duplicates = leadFooterDetails.reduce((acc, lead_footer, index) => {
      const { lead_fid } = lead_footer;
      // || (i !== index && l.lead_fid === lead_fid)
      const foundIndex = leadFooterDetails.findIndex(
        (l, i) => i !== index && l.lead_fid === lead_fid
      );
      if (
        foundIndex !== -1 &&
        !acc.some((entry) => entry.index === foundIndex)
      ) {
        acc.push({ index, foundIndex });
      }
      return acc;
    }, []);

    if (duplicates.length > 0) {
      return error422("Duplicate lead footer found in lead footer Details array.", res);
    }
  }

  //check lead_header  already is exists or not
const isExistLeadHeaderQuery = `SELECT * FROM lead_header WHERE (LOWER(TRIM(name))= ? OR LOWER(TRIM(mobile_number)) = ?) AND lead_hid!=?`;
const isExistLeadHeaderResult = await pool.query(isExistLeadHeaderQuery, [
  name.toLowerCase(),
  mobile_number,
  leadId,

]);
console.log(isExistLeadHeaderResult[0]);
if (isExistLeadHeaderResult[0].length > 0) {
  return error422(" Name And Mobile Number is already exists.", res);
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
         SET lead_date = ?, category_id = ?, name = ?, mobile_number = ?, note=?, city=?, branch_id=?, untitled_id=?,  cts = ?
         WHERE lead_hid = ?
     `;
    await connection.query(updateQuery, [
      lead_date,
      category_id,
      name,
      mobile_number,
      note,
      city,
      branch_id,
      untitled_id,
      nowDate,
      leadId,
    ]);

    if (leadFooterDetails) {
      for (const row of leadFooterDetails) {
        const comments = row.comments;
        const calling_time = row.calling_time;
        const no_of_calls = row.no_of_calls;
        const follow_up_status = row.follow_up_status;
        const follow_up_date = row.follow_up_date;
        const lead_fid = row.lead_fid;
        // Check if lead footer exists
        const leadfooterQuery =
          "SELECT * FROM lead_footer WHERE lead_fid = ?";
        const leadfooterResult = await connection.query(leadfooterQuery, [
          lead_fid,
        ]);
        if (leadfooterResult[0].length > 0) {
          
          try {
            // Update the lead footer record with new data
            const updateLeadFooterQuery = `
            UPDATE lead_footer
            SET lead_hid = ?,comments=?, calling_time=?, no_of_calls=?, follow_up_status=?, follow_up_date=?
            WHERE lead_fid = ?
            `;

            // Pass the values as an array to the connection.query method
            await connection.query(updateLeadFooterQuery, [
              leadId,
              comments,
              calling_time,
              no_of_calls,
              follow_up_status,
              follow_up_date,
              lead_fid,
            ]);
            // return res.json("HII")
          } catch (error) {
            // Rollback the transaction
            await connection.rollback();
            return error500(error, res);
          }
        } else {
          // Check if the lead_footer id already exists
          // const isExistLeadFooterQuery = `SELECT cd.*, dm.device_uid FROM client_device cd 
          // LEFT JOIN device_master dm 
          // ON dm.device_id = cd.device_id 
          // WHERE cd.device_id = ? AND cd.status = 1`;
          // const isExistLeadFooterResult = await connection.query(
          //   isExistLeadFooterQuery,
          //   [device_id]
          // );
          // if (isExistLeadFooterResult[0].length > 0) {
          //   await connection.rollback();
          //   return error422(
          //     "This '" +
          //       isExistLeadFooterResult[0][0].device_uid +
          //       "' UID is already exists ",
          //     res
          //   );
          // }

          //insert lead header id  and lead footer id  table...
          const insertLeadFooterQuery =
            "INSERT INTO lead_footer (lead_hid, comments, follow_up_date, calling_time, no_of_calls, follow_up_status) VALUES (?, ?, ?, ?, ?, ?)";
          const insertLeadFooterValues = [leadId, comments, follow_up_date, calling_time, no_of_calls, follow_up_status];
          const insertLeadFooterResult = await connection.query(
            insertLeadFooterQuery,
            insertLeadFooterValues
          );
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
  try {
    // Check if the lead_header  exists
    const leadheaderQuery = "SELECT * FROM lead_header WHERE lead_hid = ?";
    const leadheaderResult = await pool.query(leadheaderQuery, [leadheaderId]);

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
            WHERE lead_hid = ?
        `;

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
  let leadheaderQuery =
    "SELECT l.*  FROM lead_header l LEFT JOIN untitled u ON u.untitled_id = l.untitled_id WHERE l.status =1 AND u.category=1 ORDER BY l.cts DESC";
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

module.exports = {
  addleads,
  getLeadHeaders,
  getLeads,
  updateLeads,
  onStatusChange,
  getLeadHeaderWma,
  //get lead footer list 
  getLeadFooters,
  deleteLeadFooter

};
