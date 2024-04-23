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

//insert bill
const addbill = async (req, res) => {
  const mrno = req.body.mrno ? req.body.mrno : "";
  const entity_id = req.body.entity_id ? req.body.entity_id : "";
  const service_type_id = req.body.service_type_id
    ? req.body.service_type_id
    : "";
  const service_id = req.body.service_id ? req.body.service_id : "";
  const bill_amount = req.body.bill_amount ? req.body.bill_amount : "";
  const discount_amount = req.body.discount_amount
    ? req.body.discount_amount
    : "";
  const total_amount = req.body.total_amount ? req.body.total_amount : "";
  const payment_type = req.body.payment_type ? req.body.payment_type : "";
  const payment_historyDetails = req.body.payment_historyDetails
    ? req.body.payment_historyDetails
    : "";
  const untitled_id = req.companyData.untitled_id;
  if (!mrno) {
    return error422("MRNO is required.", res);
  } else if (!entity_id) {
    return error422("Entity id is required");
  } else if (!service_type_id) {
    return error422("Service Type id is required.", res);
  } else if (!service_id) {
    return error422("Service id is required.", res);
  } else if (!bill_amount) {
    return error422("Bill amount is required.", res);
  } else if (!total_amount) {
    return error422("Total amount is required.", res);
  } else if (!payment_type) {
    return error422("Payment Type is required.", res);
  } else if (!untitled_id) {
    return error422("Untitled id is required.", res);
  }

  // if lead Footer Details
  if (payment_historyDetails) {
    if (
      !payment_historyDetails ||
      !Array.isArray(payment_historyDetails) ||
      payment_historyDetails.length === 0
    ) {
      return error422(
        "No Payment history Details provided or invalid payment history Details data.",
        res
      );
    }

    if (payment_historyDetails.length != 1) {
      return error422(
        "No payment history Details provided or invalid payment history Details data.",
        res
      );
    }
  }
  //Check if untitled exists
  const isUntitledExistsQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const untitledExistResult = await pool.query(isUntitledExistsQuery, [
    untitled_id,
  ]);
  if (untitledExistResult[0].length == 0) {
    return error422("User Not Found.", res);
  }
  const customer_id = untitledExistResult[0][0].customer_id;
  if (!customer_id) {
    return error422("Customer Id is required.", res);
  }

  //check if check mrno exists
  const isExistMrnoQuery = "SELECT * FROM patient_registration WHERE mrno = ?";
  const mrnoResult = await pool.query(isExistMrnoQuery, [mrno]);
  if (mrnoResult[0].length == 0) {
    return error422("Mrno Not Found", res);
  }

  //check if check entity exists
  const isExistEntityQuery = "SELECT * FROM entity WHERE entity_id = ?";
  const entityResult = await pool.query(isExistEntityQuery, [entity_id]);
  if (entityResult[0].length == 0) {
    return error422("Entity Not Found", res);
  }

  //check if check service type exists
  const isExistServicetypeQuery =
    "SELECT * FROM service_type WHERE service_type_id = ?";
  const servicetypeResult = await pool.query(isExistServicetypeQuery, [
    service_type_id,
  ]);
  if (servicetypeResult[0].length == 0) {
    return error422("Service type Not Found", res);
  }

  //check if check service exists
  const isExistServiceQuery = "SELECT * FROM services WHERE service_id = ?";
  const serviceResult = await pool.query(isExistServiceQuery, [service_id]);
  if (serviceResult[0].length == 0) {
    return error422("Service  Not Found", res);
  }

  // attempt to obtain a database connection
  let connection = await getConnection();

  try {
    //start a transaction
    await connection.beginTransaction();

    //Insert bill table
    const insertBillQuery =
      "INSERT INTO bill ( mrno, entity_id, service_type_id, service_id, bill_amount, discount_amount, total_amount, customer_id, payment_type, untitled_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const billValues = [
      mrno,
      entity_id,
      service_type_id,
      service_id,
      bill_amount,
      discount_amount,
      total_amount,
      customer_id,
      payment_type,
      untitled_id,
    ];
    const billResult = await connection.query(insertBillQuery, billValues);
    const insertPaymentHistoryQuery =
      "INSERT INTO payment_history (payment_type, mrno, amount, entity_id, service_type_id,service_id,untitled_id) VALUES (?, ?, ?,?,?,?,?)";
    const insertpaymentHistoryValues = [
      payment_type,
      mrno,
      bill_amount,
      entity_id,
      service_type_id,
      service_id,
      untitled_id,
    ];
    const paymenthistoryResult = await connection.query(
      insertPaymentHistoryQuery,
      insertpaymentHistoryValues
    );

    // Commit the transaction
    await connection.commit();
    return res.status(200).json({
      status: 200,
      message: "Bill added successfully",
    });
  } catch (error) {
    console.log(error);
    return error500(error, res);
  }
};

// get bill list
const getBillList = async (req, res) => {
  const {
    page,
    perPage,
    key,
    fromDate,
    toDate,
    Bill_date,
    service_id,
    service_type_id,
    entity_id,
  } = req.query;
  const untitled_id = req.companyData.untitled_id;
  //check if untitled exists
  const isUntitledExistQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const untitledResult = await pool.query(isUntitledExistQuery, [untitled_id]);
  if (untitledResult[0].length == 0) {
    return error422("User Not Found.", res);
  }
  const customer_id = untitledResult[0][0].customer_id;
  if (!customer_id) {
    return error422("Customer Id is required.", res);
  }
  try {
    let getBillQuery = `SELECT b.*, p.registration_date, p.mrno_entity_series, p.patient_name, p.gender, p.age, p.mobile_no, p.city, p.address, p.entity_id, e.abbrivation, e.entity_name, st.service_type_name, s.service_name FROM bill b
        LEFT JOIN patient_registration p 
        ON p.mrno = b.mrno
        LEFT JOIN entity e
        ON e.entity_id = p.entity_id
        LEFT JOIN service_type st 
        ON st.service_type_id = b.service_type_id
        LEFT JOIN services s 
        ON s.service_id = b.service_id
        WHERE 
    b.customer_id = ${customer_id} `;

    let countQuery = `SELECT COUNT(*) AS total FROM bill b
        LEFT JOIN patient_registration p 
        ON p.mrno = b.mrno 
        LEFT JOIN entity e
        ON e.entity_id = p.entity_id
        LEFT JOIN service_type st 
        ON st.service_type_id = b.service_type_id
        WHERE 
        b.customer_id = ${customer_id} 
        `;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim().replace(/'/g, "\\'");
      if (key === "activated") {
        getBillQuery += ` AND p.status = 1`;
        countQuery += ` AND p.status = 1`;
      } else if (key === "deactivated") {
        getBillQuery += ` AND p.status = 0`;
        countQuery += ` AND p.status = 0`;
      } else {
        getBillQuery += ` AND (p.mobile_no LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%')`;
        countQuery += ` AND (p.mobile_no LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%')`;
      }
    }

    if (Bill_date) {
      getBillQuery += ` AND DATE(b.cts) = '${Bill_date}'`;
      countQuery += ` AND DATE(b.cts) = '${Bill_date}'`;
    }
    // filter from date and to date
    if (fromDate && toDate) {
      getBillQuery += ` AND b.cts >= '${fromDate}' AND b.cts <= '${toDate}'`;
      countQuery += ` AND b.cts >= '${fromDate}' AND b.cts <= '${toDate}'`;
    }
    if (service_id) {
      getBillQuery += ` AND b.service_id = '${service_id}'`;
      countQuery += ` AND b.service_id = '${service_id}'`;
    }
    if (service_type_id) {
      getBillQuery += ` AND b.service_type_id = '${service_type_id}'`;
      countQuery += ` AND b.service_type_id = '${service_type_id}'`;
    }
    if (entity_id) {
      getBillQuery += ` AND p.entity_id = '${entity_id}'`;
      countQuery += ` AND p.entity_id = '${entity_id}'`;
    }
    // Apply pagination if both page and perPage are provided
    let total = 0;
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);
      total = parseInt(totalResult[0][0].total);
      const start = (page - 1) * perPage;
      getBillQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }
    const result = await pool.query(getBillQuery);
    const Bills = result[0];
    const data = {
      status: 200,
      message: "Bills retrieved successfully",
      data: Bills,
    };
    //Add pagination information if provided
    if (page && perPage) {
      data.pagination = {
        per_page: perPage,
        total: total,
        current_page: page,
        last_page: Math.ceil(total / perPage),
      };
    }
    return res.json(data);
  } catch (error) {
    console.log(error);
    return error500(error, res);
  }
};

// get bill by  id
const getBillById = async (req, res) => {
  const billId = parseInt(req.params.id);
  const untitled_id = req.companyData.untitled_id;

  if (!billId) {
    return error422("Bill id is required.", res);
  }

  //check if untitled exists
  const isUntitledExistQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const untitledResult = await pool.query(isUntitledExistQuery, [untitled_id]);
  if (untitledResult[0].length == 0) {
    return error422("User Not Found.", res);
  }
  const customer_id = untitledResult[0][0].customer_id;
  if (!customer_id) {
    return error422("Customer Id is required.", res);
  }
  //check if bill exists
  const isBillQuery = ` SELECT * FROM bill WHERE bill_id = ? AND customer_id = ?`;
  const isBillResult = await pool.query(isBillQuery, [billId, customer_id]);
  if (isBillResult[0].length == 0) {
    return error422("Bill Not Found.", res);
  }

  try {
    let getBillQuery = `SELECT b.*, p.* FROM bill b 
        LEFT JOIN patient_registration p 
        ON p.mrno = b.mrno
        WHERE b.bill_id = ${billId}`;
    const result = await pool.query(getBillQuery);
    let bills = result[0][0];

    const data = {
      status: 200,
      message: "Bills retrieved successfully",
      data: bills,
    };

    return res.json(data);
  } catch (error) {
    console.log(error);
    return error500(error, res);
  }
};

// patient Bill  history list
const getBillByMrno = async (req, res) => {
  const { page, perPage, key } = req.query;
  const mrno = parseInt(req.params.id);
  const untitled_id = req.companyData.untitled_id;
  //check if untitled exists
  const isUntitledExistQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const untitledResult = await pool.query(isUntitledExistQuery, [untitled_id]);
  if (untitledResult[0].length == 0) {
    return error422("User Not Found.", res);
  }
  const customer_id = untitledResult[0][0].customer_id;
  if (!customer_id) {
    return error422("Customer Id is required.", res);
  }
  if (!mrno) {
    return error422("Mrno is required.", res);
  }

  try {
    let getBillQuery = `
    SELECT 
        b.*, 
        p.registration_date, 
        p.mrno_entity_series, 
        p.patient_name, 
        p.gender, 
        p.age, 
        p.mobile_no, 
        p.city, 
        p.address, 
        p.entity_id, 
        e.abbrivation, 
        e.entity_name, 
        st.service_type_name, 
        s.service_name 
    FROM 
        bill b
    LEFT JOIN 
        patient_registration p ON p.mrno = b.mrno
    LEFT JOIN 
        entity e ON e.entity_id = p.entity_id
    LEFT JOIN 
        service_type st ON st.service_type_id = b.service_type_id
    LEFT JOIN 
        services s ON s.service_id = b.service_id
    WHERE 
        b.untitled_id = ${untitled_id} 
        AND p.mrno = ${mrno}`;

    let countQuery = `
    SELECT 
        COUNT(*) AS total 
    FROM 
        bill b 
    LEFT JOIN 
        patient_registration p ON p.mrno = b.mrno
    LEFT JOIN 
        entity e ON e.entity_id = p.entity_id
    LEFT JOIN 
        service_type st ON st.service_type_id = b.service_type_id
    LEFT JOIN 
        services s ON s.service_id = b.service_id
    WHERE 
        b.untitled_id = ${untitled_id} 
        AND p.mrno = ${mrno}`;

    // Apply pagination if both page and perPage are provided
    let total = 0;
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);
      total = parseInt(totalResult[0][0].total);
      const start = (page - 1) * perPage;
      getBillQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }
    const result = await pool.query(getBillQuery);
    const bills = result[0];

    const data = {
      status: 200,
      message: "Bill by MRNO  retrieved successfully",
      data: bills,
    };
    //Add pagination information if provided
    if (page && perPage) {
      data.pagination = {
        per_page: perPage,
        total: total,
        current_page: page,
        last_page: Math.ceil(total / perPage),
      };
    }
    return res.json(data);
  } catch (error) {
    console.log(error);
    return error500(error, res);
  }
};

//Bill  list for entity wise report
const getBillEntityList = async (req, res) => {
  const { page, perPage, key } = req.query;
  const entity_id = parseInt(req.params.id);
  const untitled_id = req.companyData.untitled_id;
  //check if untitled exists
  const isUntitledExistQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const untitledResult = await pool.query(isUntitledExistQuery, [untitled_id]);
  if (untitledResult[0].length == 0) {
    return error422("User Not Found.", res);
  }
  const customer_id = untitledResult[0][0].customer_id;
  if (!customer_id) {
    return error422("Customer Id is required.", res);
  }

  try {
    let getBillQuery = `
    SELECT 
        b.*, 
        p.registration_date, 
        p.mrno_entity_series, 
        p.patient_name, 
        p.gender, 
        p.age, 
        p.mobile_no, 
        p.city, 
        p.address, 
        p.entity_id, 
        e.abbrivation, 
        e.entity_name, 
        st.service_type_name, 
        s.service_name 
    FROM 
        bill b
    LEFT JOIN 
        patient_registration p ON p.mrno = b.mrno
    LEFT JOIN 
        entity e ON e.entity_id = p.entity_id
    LEFT JOIN 
        service_type st ON st.service_type_id = b.service_type_id
    LEFT JOIN 
        services s ON s.service_id = b.service_id
    WHERE 
        b.untitled_id = ${untitled_id} 
        AND e.entity_id = ${entity_id}`;

    let countQuery = `
    SELECT 
        COUNT(*) AS total 
    FROM 
        bill b 
    LEFT JOIN 
        patient_registration p ON p.mrno = b.mrno
    LEFT JOIN 
        entity e ON e.entity_id = p.entity_id
    LEFT JOIN 
        service_type st ON st.service_type_id = b.service_type_id
    LEFT JOIN 
        services s ON s.service_id = b.service_id
    WHERE 
        b.untitled_id = ${untitled_id} 
        AND e.entity_id = ${entity_id}`;

    //fitler entity id
    if (entity_id) {
      getBillQuery += ` AND p.entity_id = '${entity_id}'`;
      countQuery += ` AND p.entity_id = '${entity_id}'`;
    }

    // Apply pagination if both page and perPage are provided
    let total = 0;
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);
      total = parseInt(totalResult[0][0].total);
      const start = (page - 1) * perPage;
      getBillQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }
    const result = await pool.query(getBillQuery);
    const bills = result[0];

    const data = {
      status: 200,
      message: "Bill by entity  retrieved successfully",
      data: bills,
    };
    //Add pagination information if provided
    if (page && perPage) {
      data.pagination = {
        per_page: perPage,
        total: total,
        current_page: page,
        last_page: Math.ceil(total / perPage),
      };
    }
    return res.json(data);
  } catch (error) {
    console.log(error);
    return error500(error, res);
  }
};

module.exports = {
  addbill,
  getBillList,
  getBillById,
  getBillByMrno,
  getBillEntityList,
};
