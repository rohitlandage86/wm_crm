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
// add Patient Registration...
const addPatientRegistration = async (req, res) => {
  const entity_id = req.body.entity_id ? req.body.entity_id : "";
  const registration_date = req.body.registration_date ? req.body.registration_date : "";
  const mrno_entity_series = req.body.mrno_entity_series ? req.body.mrno_entity_series.trim() : "";
  const patient_name = req.body.patient_name ? req.body.patient_name.trim() : "";
  const gender = req.body.gender ? req.body.gender.trim() : "";
  const age = req.body.age ? req.body.age : "";
  const mobile_no = req.body.mobile_no ? req.body.mobile_no : "";
  const address = req.body.address ? req.body.address.trim() : "";
  const city = req.body.city ? req.body.city.trim() : "";
  const state_id = req.body.state_id ? req.body.state_id : "";
  const source_of_patient_id = req.body.source_of_patient_id ? req.body.source_of_patient_id : "";
  const employee_id = req.body.employee_id ? req.body.employee_id : "";
  const height = req.body.height ? req.body.height : "";
  const weight = req.body.weight ? req.body.weight : "";
  const bmi = req.body.bmi ? req.body.bmi.trim() : "";
  const amount = req.body.amount ? req.body.amount : 0;
  const refered_by_id = req.body.refered_by_id ? req.body.refered_by_id : "";
  const payment_type = req.body.payment_type ? req.body.payment_type : '';
  const untitled_id = req.companyData.untitled_id;

  if (!patient_name) {
    return error422("Patient Name is required.", res);
  } else if (!entity_id) {
    return error422("Entity Id is required.", res);
  } else if (!registration_date) {
    return error422("Registration Date is required.", res);
  } else if (!mrno_entity_series) {
    return error422("Mrno Entity Series  is required.", res);
  } else if (!patient_name) {
    return error422("Patient Name  is required.", res);
  } else if (!gender) {
    return error422("Gender  is required.", res);
  } else if (!age) {
    return error422("Age is required.", res);
  } else if (!mobile_no) {
    return error422("Mobile No is required.", res);
  } else if (!address) {
    return error422("Address is required.", res);
  } else if (!city) {
    return error422("City is required.", res);
  } else if (!state_id) {
    return error422("State id is required.", res);
  } else if (!source_of_patient_id) {
    return error422("Source Of Patient ID is required.", res);
  } else if (!employee_id) {
    return error422("Employee Id is required.", res);
  } else if (!height) {
    return error422("Hight is required.", res);
  } else if (!weight) {
    return error422("Weight is required.", res);
  } else if (!bmi) {
    return error422("BMI is required.", res);
  } else if (!amount) {
    return error422("Amount is required.", res);
  } else if (!refered_by_id) {
    return error422("Refered By ID is required.", res);
  } else if (!payment_type) {
    return error422("Payment Type is required.", res);
  } else if (!untitled_id) {
    return error422("Untitled ID is required.", res);
  }
  //Check if untitled exists
  const isUntitledExistsQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const untitledExistResult = await pool.query(isUntitledExistsQuery, [untitled_id]);
  if (untitledExistResult[0].length == 0) {
    return error422("USER Not Found.", res);
  }
  const customer_id = untitledExistResult[0][0].customer_id;
  if (!customer_id) {
    return error422("Customer ID is required.", res);
  }
  //check patient_registration already is exists or not
  const isExistPatientRegistrationQuery = `SELECT * FROM patient_registration WHERE (entity_id = ${entity_id} AND mobile_no = ${mobile_no}) AND (customer_id = ${customer_id} AND mobile_no = ${mobile_no});`
  const isExistPatientRegistrationResult = await pool.query(isExistPatientRegistrationQuery);
  if (isExistPatientRegistrationResult[0].length > 0) {
    return error422(" Patient is already exists.", res);
  }

  // Attempt to obtain a database connection
  let connection = await getConnection();
  try {
    // Start a transaction
    await connection.beginTransaction();
    //insert into patient_registration master
    const insertPatientRegistrationQuery = `INSERT INTO patient_registration (entity_id, registration_date, mrno_entity_series, patient_name, gender, age, mobile_no, address, city, state_id, source_of_patient_id, employee_id, height, weight, bmi, amount, refered_by_id, customer_id, untitled_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertPatientRegistrationValues = [entity_id, registration_date, mrno_entity_series, patient_name, gender, age, mobile_no, address, city, state_id, source_of_patient_id, employee_id, height, weight, bmi, amount, refered_by_id, customer_id, untitled_id];
    const patient_registrationResult = await connection.query(insertPatientRegistrationQuery, insertPatientRegistrationValues);
    const mrno = patient_registrationResult[0].insertId;

    //insert into patient_visit_list 
    const insertPatientVisitListQuery = 'INSERT INTO patient_visit_list (mrno,visit_type,visit_date) VALUES (?,?,?)';
    const insertPatientVisitListValues = [mrno, 'FIRST_VISIT', registration_date];
    const PatientVisitListResult = await connection.query(insertPatientVisitListQuery, insertPatientVisitListValues);

    //insert into payment history table
    const insertPaymentHistoryQuery = 'INSERT INTO payment_history (payment_type, mrno, amount, untitled_id ) VALUES (?, ?, ?, ?)';
    const insertPaymentHistoryValues = [payment_type, mrno, amount, untitled_id];
    const paymentHistoryResult = await connection.query(insertPaymentHistoryQuery, insertPaymentHistoryValues);

    //check lead_header  is exists or not
    const isExistLeadHeaderQuery = `SELECT * FROM lead_header WHERE mobile_number = ? AND customer_id = ?`;
    const isExistLeadHeaderResult = await connection.query(isExistLeadHeaderQuery, [mobile_no, customer_id]);
    if (isExistLeadHeaderResult[0].length > 0) {
      //insert  into lead footer  table...
      const insertLeadFooterQuery = "INSERT INTO lead_footer (lead_hid, comments, follow_up_date, calling_time, no_of_calls,lead_status_id) VALUES (?, ?, ?, ?, ?, ?)";
      const insertLeadFooterValues = [isExistLeadHeaderResult[0][0].lead_hid, "PATIENT REGISTRATION", registration_date, '', '', 2];
      const insertLeadFooterResult = await connection.query(insertLeadFooterQuery, insertLeadFooterValues);
    }
    await connection.commit();
    res.status(200).json({
      status: 200,
      message: "Patient Registration successfully",
    });
  } catch (error) {
    return error500(error, res);
  }
};
// get patient_registrations list...
const getPatientRegistrations = async (req, res) => {
  const { page, perPage, key, fromDate, toDate, entity_id, gender, source_of_patient_id, employee_id, refered_by_id } = req.query;
  const untitled_id = req.companyData.untitled_id;
  //Check if untitled exists
  const isUntitledExistsQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const untitledExistResult = await pool.query(isUntitledExistsQuery, [untitled_id]);
  if (untitledExistResult[0].length == 0) {
    return error422("USER Not Found.", res);
  }
  const customer_id = untitledExistResult[0][0].customer_id;
  if (!customer_id) {
    return error422("Customer ID is required.", res);
  }
  try {
    let getPatientRegistrationQuery = `SELECT p.*, e.entity_name, e.abbrivation, s.source_of_patient_name, em.name AS employee_name , r.refered_by_name   FROM patient_registration p
          LEFT JOIN entity e
          ON e.entity_id = p.entity_id
          LEFT JOIN source_of_patient s
          ON s.source_of_patient_id = p.source_of_patient_id
          LEFT JOIN employee em
          ON em.employee_id = p.employee_id
          LEFT JOIN refered_by r
          ON r.refered_by_id = p.refered_by_id
          WHERE p.customer_id = ${customer_id}`;

    let countQuery = `SELECT COUNT(*) AS total FROM patient_registration p
      LEFT JOIN entity e
      ON e.entity_id = p.entity_id
      LEFT JOIN source_of_patient s
      ON s.source_of_patient_id = p.source_of_patient_id
      LEFT JOIN employee em
      ON em.employee_id = p.employee_id
      LEFT JOIN refered_by r
      ON r.refered_by_id = p.refered_by_id
      WHERE p.customer_id = ${customer_id}`;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (key === "activated") {
        getPatientRegistrationQuery += ` AND p.status = 1`;
        countQuery += ` AND p.status = 1`;
      } else if (key === "deactivated") {
        getPatientRegistrationQuery += ` AND p.status = 0`;
        countQuery += ` AND p.status = 0`;
      } else {
        // getPatientRegistrationQuery += ` AND (LOWER(p.mrno ) LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%' ) `;
        // countQuery += ` AND (LOWER(p.mrno ) LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%' ) `;
      }
    }
    // filter from date and to date
    if (fromDate && toDate) {
      getPatientRegistrationQuery += ` AND p.registration_date >= '${fromDate}' AND p.registration_date <= '${toDate}'`;
      countQuery += ` AND p.registration_date >= '${fromDate}' AND p.registration_date <= '${toDate}'`;
    }
    //fitler entity id
    if (entity_id) {
      getPatientRegistrationQuery += ` AND p.entity_id = '${entity_id}'`;
      countQuery += ` AND p.entity_id = '${entity_id}'`;
    }
    //fitler gender
    if (gender) {
      getPatientRegistrationQuery += ` AND p.gender = '${gender}'`;
      countQuery += ` AND p.gender = '${gender}'`;
    }
    // filter  source of patient id
    if (source_of_patient_id) {
      getPatientRegistrationQuery += ` AND p.source_of_patient_id = '${source_of_patient_id}'`;
      countQuery += ` AND p.source_of_patient_id = '${source_of_patient_id}'`;
    }
    //filter employee id
    if (employee_id) {
      getPatientRegistrationQuery += ` AND p.employee_id = '${employee_id}'`;
      countQuery += ` AND p.employee_id = '${employee_id}'`;
    }
    //filter refered by id
    if (refered_by_id) {
      getPatientRegistrationQuery += ` AND p.refered_by_id = '${refered_by_id}'`;
      countQuery += ` AND p.refered_by_id = '${refered_by_id}'`
    }
    getPatientRegistrationQuery += " ORDER BY p.registration_date DESC";
    // Apply pagination if both page and perPage are provided
    let total = 0;
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);
      total = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getPatientRegistrationQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    const result = await pool.query(getPatientRegistrationQuery);
    const patient_registration = result[0];

    const data = {
      status: 200,
      message: "Patient Registration retrieved successfully",
      data: patient_registration,
    };
    // Add pagination information if provided
    if (page && perPage) {
      data.pagination = {
        per_page: perPage,
        total: total,
        current_page: page,
        last_page: Math.ceil(total / perPage)
      };
    }

    return res.status(200).json(data);
  } catch (error) {
    return error500(error, res);
  }
};
// get patient_registration  by id...
const getPatientRegistration = async (req, res) => {
  const mrno = parseInt(req.params.id);
  const untitled_id = req.companyData.untitled_id;

  //Check if untitled exists
  const isUntitledExistsQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const untitledExistResult = await pool.query(isUntitledExistsQuery, [untitled_id]);
  if (untitledExistResult[0].length == 0) {
    return error422("USER Not Found.", res);
  }
  const customer_id = untitledExistResult[0][0].customer_id;
  if (!customer_id) {
    return error422("Customer ID is required.", res);
  }

  if (!mrno) {
    return error422("MRNO is required.", res);
  }
  try {
    const patientregistrationQuery = `SELECT p.*, u.untitled_id, e.entity_name, s.source_of_patient_name, em.name, r.refered_by_name  FROM  patient_registration p
        LEFT JOIN untitled u 
        ON p.untitled_id = u.untitled_id
        LEFT JOIN entity e
        ON e.entity_id = p.entity_id
        LEFT JOIN source_of_patient s
        ON s.source_of_patient_id = p.source_of_patient_id
        LEFT JOIN employee em
        ON em.employee_id = p.employee_id
        LEFT JOIN refered_by r
        ON r.refered_by_id = p.refered_by_id
        WHERE p.mrno = ? AND p.customer_id = ?`;
    const patientregistrationResult = await pool.query(patientregistrationQuery, [mrno, customer_id]);
    if (patientregistrationResult[0].length == 0) {
      return error422("Patient Not Found.", res);
    }
    const patient_registration = patientregistrationResult[0][0];
    return res.status(200).json({
      status: 200,
      message: "Patient  Retrived Successfully.",
      data: patient_registration,
    });
  } catch (error) {
    return error500(error, res);
  }
};
//patient_registration update...
const updatePatientRegistration = async (req, res) => {
  const mrno = parseInt(req.params.id);
  const entity_id = req.body.entity_id ? req.body.entity_id : "";
  const registration_date = req.body.registration_date ? req.body.registration_date : "";
  const mrno_entity_series = req.body.mrno_entity_series ? req.body.mrno_entity_series.trim() : "";
  const patient_name = req.body.patient_name ? req.body.patient_name.trim() : "";
  const gender = req.body.gender ? req.body.gender.trim() : "";
  const age = req.body.age ? req.body.age : "";
  const mobile_no = req.body.mobile_no ? req.body.mobile_no : "";
  const address = req.body.address ? req.body.address.trim() : "";
  const city = req.body.city ? req.body.city.trim() : "";
  const state_id = req.body.state_id ? req.body.state_id : "";
  const source_of_patient_id = req.body.source_of_patient_id ? req.body.source_of_patient_id : "";
  const height = req.body.height ? req.body.height : "";
  const weight = req.body.weight ? req.body.weight : "";
  const bmi = req.body.bmi ? req.body.bmi.trim() : "";
  const refered_by_id = req.body.refered_by_id ? req.body.refered_by_id : "";
  const employee_id = req.body.employee_id ? req.body.employee_id : "";
  const untitled_id = req.companyData.untitled_id;

  if (!patient_name) {
    return error422("Patient Name is required.", res);
  } else if (!entity_id) {
    return error422("Entity Id is required.", res);
  } else if (!registration_date) {
    return error422("Registration Date is required.", res);
  } else if (!mrno_entity_series) {
    return error422("Mrno Entity Series  is required.", res);
  } else if (!patient_name) {
    return error422("Patient Name  is required.", res);
  } else if (!gender) {
    return error422("Gender  is required.", res);
  } else if (!age) {
    return error422("Age is required.", res);
  } else if (!mobile_no) {
    return error422("Mobile No is required.", res);
  } else if (!address) {
    return error422("Address is required.", res);
  } else if (!city) {
    return error422("City is required.", res);
  } else if (!state_id) {
    return error422("State id is required.", res);
  } else if (!source_of_patient_id) {
    return error422("Source Of Patient ID is required.", res);
  } else if (!employee_id) {
    return error422("Employee Id is required.", res);
  } else if (!height) {
    return error422("Hight is required.", res);
  } else if (!weight) {
    return error422("Weight is required.", res);
  } else if (!bmi) {
    return error422("BMI is required.", res);
  } else if (!refered_by_id) {
    return error422("Refered By ID is required.", res);
  } else if (!untitled_id) {
    return error422("Untitled ID is required.", res);
  } else if (!mrno) {
    return error422("Mrno is required.", res);
  }
  //Check if untitled exists
  const isUntitledExistsQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const untitledExistResult = await pool.query(isUntitledExistsQuery, [untitled_id]);
  if (untitledExistResult[0].length == 0) {
    return error422("User Not Found.", res);
  }
  const customer_id = untitledExistResult[0][0].customer_id;
  if (!customer_id) {
    return error422("Customer ID is required.", res);
  }
  // Check if patient_registration exists
  const patientregistrationQuery = "SELECT * FROM patient_registration WHERE mrno  = ? AND customer_id = ?";
  const patientregistrationResult = await pool.query(patientregistrationQuery, [mrno, customer_id]);
  if (patientregistrationResult[0].length == 0) {
    return error422("Patient Not Found.", res);
  }
  // Check if the provided patient_registration exists and is active
  const existingPatientRegistrationQuery =
    `SELECT * FROM patient_registration WHERE ((entity_id = ${entity_id} AND mobile_no = ${mobile_no}) AND (customer_id = ${customer_id} AND mobile_no = ${mobile_no})) AND mrno !=${mrno} ;`
  const existingPatientRegistrationResult = await pool.query(existingPatientRegistrationQuery);

  if (existingPatientRegistrationResult[0].length > 0) {
    return error422("Mobile No already exists.", res);
  }
  try {
    const nowDate = new Date().toISOString().split("T")[0];
    // Update the patient_registration record with new data
    const updateQuery = `UPDATE patient_registration SET  
    entity_id = ?, registration_date = ?, mrno_entity_series = ?, patient_name = ?, gender = ?, age = ?, mobile_no = ?, address = ?, city = ?, state_id = ?, source_of_patient_id = ?, employee_id = ?, height = ?, weight = ?, bmi = ?, refered_by_id = ?, customer_id = ?, untitled_id = ?, mts = ? 
    WHERE mrno = ?`;

    await pool.query(updateQuery, [entity_id, registration_date, mrno_entity_series, patient_name, gender, age, mobile_no, address, city, state_id, source_of_patient_id, employee_id, height, weight, bmi, refered_by_id, customer_id, untitled_id, nowDate, mrno]);

    return res.status(200).json({
      status: 200,
      message: "patient updated successfully.",
    });
  } catch (error) {
    return error500(error, res);
  }
};
//status change of patient_registration...
const onStatusChange = async (req, res) => {
  const patientregistrationId = parseInt(req.params.id);
  const status = parseInt(req.query.status); // Validate and parse the status parameter
  try {
    // Check if the patient_registration  exists
    const patientregistrationQuery = "SELECT * FROM patient_registration WHERE mrno = ?";
    const patientregistrationResult = await pool.query(patientregistrationQuery, [patientregistrationId]);

    if (patientregistrationResult[0].length == 0) {
      return res.status(404).json({
        status: 404,
        message: "Patient not found.",
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

    // Soft update the patient_registration status
    const updateQuery = `
            UPDATE patient_registration
            SET status = ?
            WHERE mrno = ?
        `;

    await pool.query(updateQuery, [status, patientregistrationId]);

    const statusMessage = status === 1 ? "activated" : "deactivated";

    return res.status(200).json({
      status: 200,
      message: `Patient ${statusMessage} successfully.`,
    });
  } catch (error) {
    return error500(error, res);
  }
};
//get patient_registration active...
const getPatientRegistrationWma = async (req, res) => {
  let patientregistrationQuery =
    "SELECT p.*  FROM patient_registration p LEFT JOIN untitled u ON u.untitled_id = p.untitled_id WHERE p.status =1 AND u.category=1 ORDER BY p.patient_name ";
  try {
    const patientregistrationResult = await pool.query(patientregistrationQuery);
    const patient_registration = patientregistrationResult[0];

    return res.status(200).json({
      status: 200,
      message: "Patients retrieved successfully.",
      data: patient_registration,
    });
  } catch (error) {
    return error500(error, res);
  }
};
// get Patient Visit Lists ...
const getPatientVisitLists = async (req, res) => {
  const { page, perPage, key } = req.query;
  const untitled_id = req.companyData.untitled_id;
  const visit_date = new Date().toISOString().split('T')[0];

  const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
  const untitledResult = await pool.query(checkUntitledQuery);
  const customer_id = untitledResult[0][0].customer_id;

  try {
    let getPatientVisitListsQuery = `SELECT p.*, pr.mrno_entity_series, pr.patient_name, pr.gender, pr.age, pr.mobile_no, pr.address, pr.city, pr.height, pr.weight, pr.bmi, e.entity_name FROM patient_visit_list p 
    LEFT JOIN patient_registration pr 
    ON pr.mrno = p.mrno
    LEFT JOIN entity e
    ON e.entity_id = pr.entity_id
    WHERE p.visit_date = '${visit_date}' AND p.is_checked = 0 AND pr.customer_id = ${customer_id}`;

    let countQuery = `SELECT COUNT(*) AS total  FROM patient_visit_list p 
    LEFT JOIN patient_registration pr 
    ON pr.mrno = p.mrno
    LEFT JOIN entity e
    ON e.entity_id = pr.entity_id
    WHERE p.visit_date = '${visit_date}' AND p.is_checked = 0 AND pr.customer_id = ${customer_id}`;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (key === "activated") {
        getPatientVisitListsQuery += ` AND p.status = 1`;
        countQuery += ` AND p.status = 1`;
      } else if (key === "deactivated") {
        getPatientVisitListsQuery += ` AND p.status = 0`;
        countQuery += ` AND p.status = 0`;
      } else {
        getPatientVisitListsQuery += ` AND  LOWER(p.visit_date) LIKE '%${lowercaseKey}%' `;
        countQuery += ` AND  LOWER(p.visit_date) LIKE '%${lowercaseKey}%' `;
      }
    }
    getPatientVisitListsQuery += " ORDER BY p.mrno DESC";
    // Apply pagination if both page and perPage are provided
    let total = 0;
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);
      total = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getPatientVisitListsQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    const result = await pool.query(getPatientVisitListsQuery);
    const patient_visit_list = result[0];


    const data = {
      status: 200,
      message: "Patient Visit Listretrieved successfully",
      data: patient_visit_list,
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
// get Patient Visit checked Lists ...
const getPatientVisitCheckedLists = async (req, res) => {
  const { page, perPage, key } = req.query;
  const untitled_id = req.companyData.untitled_id;
  const visit_date = new Date().toISOString().split('T')[0];

  const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
  const untitledResult = await pool.query(checkUntitledQuery);
  const customer_id = untitledResult[0][0].customer_id;

  try {
    let getPatientVisitListsQuery = `SELECT p.*, pr.mrno_entity_series, pr.patient_name, pr.gender, pr.age, pr.mobile_no, pr.address, pr.city, pr.height, pr.weight, pr.bmi, e.entity_name FROM patient_visit_list p 
    LEFT JOIN patient_registration pr 
    ON pr.mrno = p.mrno
    LEFT JOIN entity e
    ON e.entity_id = pr.entity_id
    WHERE p.visit_date = '${visit_date}' AND p.is_checked = 1 AND pr.customer_id = ${customer_id}`;

    let countQuery = `SELECT COUNT(*) AS total  FROM patient_visit_list p 
    LEFT JOIN patient_registration pr 
    ON pr.mrno = p.mrno
    LEFT JOIN entity e
    ON e.entity_id = pr.entity_id
    WHERE p.visit_date = '${visit_date}' AND p.is_checked = 1 AND pr.customer_id = ${customer_id}`;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (key === "activated") {
        getPatientVisitListsQuery += ` AND p.status = 1`;
        countQuery += ` AND p.status = 1`;
      } else if (key === "deactivated") {
        getPatientVisitListsQuery += ` AND p.status = 0`;
        countQuery += ` AND p.status = 0`;
      } else {
        getPatientVisitListsQuery += ` AND  LOWER(p.visit_date) LIKE '%${lowercaseKey}%' `;
        countQuery += ` AND  LOWER(p.visit_date) LIKE '%${lowercaseKey}%' `;
      }
    }

    // Apply pagination if both page and perPage are provided
    let total = 0;
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);
      total = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getPatientVisitListsQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    const result = await pool.query(getPatientVisitListsQuery);
    const patient_visit_list = result[0];


    const data = {
      status: 200,
      message: "Patient Visit checked List retrieved successfully",
      data: patient_visit_list,
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
//patient revisit 
const patientRevisit = async (req, res) => {
  const mrno = parseInt(req.params.id);
  const untitled_id = req.companyData.untitled_id;

  const visit_type = req.body.visit_type;
  if (!visit_type || visit_type != 'RE_VISIT') {
    return error422("Patient Visit Type is required.", res);
  }
  const nowDate = new Date().toISOString().split("T")[0];

  // const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
  // const untitledResult = await pool.query(checkUntitledQuery);
  // const customer_id =  untitledResult[0][0].customer_id;
  // const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
  // const customerResult = await pool.query(isCustomerQuery);
  // const untitledId =  customerResult[0][0].untitled_id;
  
  try {
    //insert into patient_visit_list 
    const insertPatientVisitListQuery = 'INSERT INTO patient_visit_list (mrno,visit_type,visit_date) VALUES (?,?,?)';
    const insertPatientVisitListValues = [mrno, 'RE_VISIT', nowDate];
    const PatientVisitListResult = await pool.query(insertPatientVisitListQuery, insertPatientVisitListValues);
    return res.status(200).json({
      status: 200,
      message: "Patient Re_Visit Successfully."
    })
  } catch (error) {
    return error422(error, res);
  }
}
const generateMrnoEntitySeries = async (req, res) => {
  const entityId = parseInt(req.params.id);
  const untitled_id = req.companyData.untitled_id;
  //Check if untitled exists
  const isUntitledExistsQuery = "SELECT u.*, cb.* FROM untitled u LEFT JOIN wm_customer_branch cb ON cb.branch_id = u.branch_id WHERE u.untitled_id = ?";
  const untitledExistResult = await pool.query(isUntitledExistsQuery, [untitled_id]);
  if (untitledExistResult[0].length == 0) {
    return error422("USER Not Found.", res);
  }
  const customer_id = untitledExistResult[0][0].customer_id;
  if (!customer_id) {
    return error422("Customer ID is required.", res);
  }

  // get customer untitled id for check  entity_id is exist 
  const isCustomerUntitledQuery = "SELECT * FROM untitled WHERE  customer_id = ? AND category = 2";
  const customerUntitledResut = await pool.query(isCustomerUntitledQuery, [customer_id]);
  const customerUntitledId = customerUntitledResut[0][0].untitled_id;

  //check entity is exsist 
  const isExistEntityQuery = `SELECT * FROM entity WHERE entity_id = ${entityId} AND untitled_id = ${customerUntitledId}`;
  const entityResult = await pool.query(isExistEntityQuery);
  if (entityResult[0].length == 0) {
    return error422("Entity Not Found.", res);
  }
  //get patient total count 
  const getPatientCountQuery = "SELECT * FROM patient_registration WHERE entity_id = ?";
  const patientRegistrationCount = await pool.query(getPatientCountQuery, [entityId]);

  let mrnoEntitySeries = entityResult[0][0].abbrivation + '_' + untitledExistResult[0][0].city + '_' + (patientRegistrationCount[0].length + 1);

  let data = {
    status: 200,
    message: "Generate mrno entity series successfully.",
    mrnoEntitySeries: mrnoEntitySeries
  }
  return res.json(data)
}
//search patient registration by mobile and patient
const searchPatientRegistration = async (req, res) => {
  const { page, perPage, key } = req.query;
  const untitled_id = req.companyData.untitled_id;
  //Check if untitled exists
  const isUntitledExistsQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
  const untitledExistResult = await pool.query(isUntitledExistsQuery, [untitled_id]);
  if (untitledExistResult[0].length == 0) {
    return error422("USER Not Found.", res);
  }
  const customer_id = untitledExistResult[0][0].customer_id;
  if (!customer_id) {
    return error422("Customer ID is required.", res);
  }
  if (!key) {
    return error422("Search Key is required", res);
  }
  try {
    let getPatientRegistrationQuery = `SELECT p.*, e.entity_name, s.source_of_patient_name, em.name, r.refered_by_name   FROM patient_registration p
          LEFT JOIN entity e
          ON e.entity_id = p.entity_id
          LEFT JOIN source_of_patient s
          ON s.source_of_patient_id = p.source_of_patient_id
          LEFT JOIN employee em
          ON em.employee_id = p.employee_id
          LEFT JOIN refered_by r
          ON r.refered_by_id = p.refered_by_id
          WHERE p.customer_id = ${customer_id}`;

    let countQuery = `SELECT COUNT(*) AS total FROM patient_registration p
      LEFT JOIN entity e
      ON e.entity_id = p.entity_id
      LEFT JOIN source_of_patient s
      ON s.source_of_patient_id = p.source_of_patient_id
      LEFT JOIN employee em
      ON em.employee_id = p.employee_id
      LEFT JOIN refered_by r
      ON r.refered_by_id = p.refered_by_id
      WHERE p.customer_id = ${customer_id}`;

    const lowercaseKey = key.toLowerCase().trim();

    getPatientRegistrationQuery += ` AND (p.mobile_no LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%' ) `;
    countQuery += ` AND (p.mobile_no LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%' ) `;
    getPatientRegistrationQuery += " ORDER BY p.cts DESC";

    // Apply pagination if both page and perPage are provided
    let total = 0;
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);
      total = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getPatientRegistrationQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    const result = await pool.query(getPatientRegistrationQuery);
    const patient_registration = result[0];

    const data = {
      status: 200,
      message: "Search Patient Registration retrieved successfully",
      data: patient_registration,
    };
    // Add pagination information if provided
    if (page && perPage) {
      data.pagination = {
        per_page: perPage,
        total: total,
        current_page: page,
        last_page: Math.ceil(total / perPage)
      };
    }

    return res.status(200).json(data);
  } catch (error) {
    return error500(error, res);
  }
}
//get all patient visit lists...
const getAllPatientVisitList = async (req, res) => {
  const { page, perPage, key, fromDate, toDate, visit_type } = req.query;
  const untitled_id = req.companyData.untitled_id;

  const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
  const untitledResult = await pool.query(checkUntitledQuery);
  const customer_id = untitledResult[0][0].customer_id;

  try {
    let getPatientVisitListsQuery = `SELECT p.*, pr.mrno_entity_series, pr.patient_name, pr.gender, pr.age, pr.mobile_no, pr.address, pr.city, pr.height, pr.weight, pr.bmi, e.entity_name, pr.customer_id FROM patient_visit_list p 
    LEFT JOIN patient_registration pr 
    ON pr.mrno = p.mrno
    LEFT JOIN entity e
    ON e.entity_id = pr.entity_id
    WHERE pr.customer_id = ${customer_id}`;
    // p.visit_date = '${visit_date}'  

    let countQuery = `SELECT COUNT(*) AS total  FROM patient_visit_list p 
    LEFT JOIN patient_registration pr 
    ON pr.mrno = p.mrno
    LEFT JOIN entity e
    ON e.entity_id = pr.entity_id
    WHERE  pr.customer_id = ${customer_id}`;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (key === "activated") {
        getPatientVisitListsQuery += ` AND p.status = 1`;
        countQuery += ` AND p.status = 1`;
      } else if (key === "deactivated") {
        getPatientVisitListsQuery += ` AND p.status = 0`;
        countQuery += ` AND p.status = 0`;
      } else {
        // getPatientVisitListsQuery += ` AND  LOWER(p.visit_date) LIKE '%${lowercaseKey}%' `;
        // countQuery += ` AND  LOWER(p.visit_date) LIKE '%${lowercaseKey}%' `;
      }
    }
    if (fromDate && toDate) {
      getPatientVisitListsQuery += ` AND p.visit_date >= '${fromDate}' AND p.visit_date <= '${toDate}'`;
      countQuery += ` AND p.visit_date >= '${fromDate}' AND p.visit_date <= '${toDate}'`;
    }
    if (visit_type) {
      getPatientVisitListsQuery += ` AND p.visit_type = '${visit_type}'`;
      countQuery += ` AND p.visit_type = '${visit_type}'`;
    }

    // Apply pagination if both page and perPage are provided
    let total = 0;
    if (page && perPage) {
      const totalResult = await pool.query(countQuery);
      total = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getPatientVisitListsQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    const result = await pool.query(getPatientVisitListsQuery);
    const patient_visit_list = result[0];


    const data = {
      status: 200,
      message: "Patient Visit Listretrieved successfully",
      data: patient_visit_list,
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
}

module.exports = {
  addPatientRegistration,
  getPatientRegistrations,
  getPatientRegistration,
  updatePatientRegistration,
  onStatusChange,
  getPatientRegistrationWma,
  getPatientVisitLists,
  getPatientVisitCheckedLists,
  patientRevisit,
  generateMrnoEntitySeries,
  searchPatientRegistration,
  getAllPatientVisitList
};
