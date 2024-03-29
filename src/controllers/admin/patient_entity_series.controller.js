// const pool = require("../../../db");
// const util = require("util");
// const query = util.promisify(pool.query).bind(pool);

// //errror 422 handler...
// error422 = (message, res) => {
//   return res.status(422).json({
//     status: 422,
//     message: message,
//   });
// };
// //error 500 handler...
// error500 = (error, res) => {
//   return res.status(500).json({
//     status: 500,
//     message: "Internal Server Error",
//     error: error,
//   });
// };
// // add Patient Registration...
// const addPatientRegistration = async (req, res) => {
//   const entity_id = req.body.entity_id ? req.body.entity_id : "";
//   const registration_date = req.body.registration_date
//     ? req.body.registration_date
//     : "";
//   const mrno_entity_series = req.body.mrno_entity_series
//     ? req.body.mrno_entity_series.trim()
//     : "";
//   const patient_name = req.body.patient_name
//     ? req.body.patient_name.trim()
//     : "";
//   const gender = req.body.gender ? req.body.gender.trim() : "";
//   const age = req.body.age ? req.body.age : "";
//   const mobile_no = req.body.mobile_no ? req.body.mobile_no : "";
//   const city = req.body.city ? req.body.city.trim() : "";
//   const state = req.body.state ? req.body.state.trim() : "";
//   const source_of_patient_id = req.body.source_of_patient_id
//     ? req.body.source_of_patient_id
//     : "";
//   const height = req.body.height ? req.body.height : "";
//   const weight = req.body.weight ? req.body.weight : "";
//   const address = req.body.address ? req.body.address.trim() : "";
//   const bmi = req.body.bmi ? req.body.bmi.trim() : "";
//   const refered_by_id = req.body.refered_by_id
//     ? req.body.refered_by_id
//     : "";
//   const branch_id = req.body.branch_id ? req.body.branch_id : "";
//   const employee_id = req.body.employee_id ? req.body.employee_id: "";
//   // const untitled_id  = req.companyData.untitled_id ;
//   const untitled_id = 1;

//   if (!patient_name) {
//     return error422("Patient Name is required.", res);
//   } else if (!entity_id) {
//     return error422("Entity Id is required.", res);
//   } else if (!registration_date) {
//     return error422("Registration Date is required.", res);
//   } else if (!mrno_entity_series) {
//     return error422("Mrno Entity Series  is required.", res);
//   } else if (!patient_name) {
//     return error422("Patient Name  is required.", res);
//   } else if (!gender) {
//     return error422("Gender  is required.", res);
//   } else if (!age) {
//     return error422("Age is required.", res);
//   } else if (!mobile_no) {
//     return error422("Mobile No is required.", res);
//   } else if (!address) {
//     return error422("Address is required.", res);
//   } else if (!city) {
//     return error422("City is required.", res);
//   } else if (!state) {
//     return error422("State is required.", res);
//   } else if (!source_of_patient_id) {
//     return error422("Source Of Patient ID is required.", res);
//   } else if (!employee_id) {
//     return error422("Employee Id is required.", res);
//   } else if (!height) {
//     return error422("Hight is required.", res);
//   } else if (!weight) {
//     return error422("Weight is required.", res);
//   } else if (!bmi) {
//     return error422("BMI is required.", res);
//   } else if (!refered_by_id) {
//     return error422("Refered By ID is required.", res);
//   } else if (!branch_id) {
//     return error422("Branch ID is required.", res);
//   } else if (!untitled_id) {
//     return error422("Untitled ID is required.", res);
//   }
//   //check patient_registration already is exists or not
//   const isExistPatientRegistrationQuery = `SELECT * FROM patient_registration WHERE (entity_id = ${entity_id} AND mobile_no = ${mobile_no}) AND (branch_id = ${branch_id} AND mobile_no = ${mobile_no});`
//   const isExistPatientRegistrationResult = await query(isExistPatientRegistrationQuery);
//   if (isExistPatientRegistrationResult.length > 0) {
//     return error422(" Patient is already exists.", res);
//   }
//   try {
//     //insert into patient_registration master
//     const insertPatientRegistrationQuery = `INSERT INTO patient_registration (entity_id, registration_date, mrno_entity_series, patient_name, gender, age, mobile_no, address, city, state, source_of_patient_id, employee_id, height, weight, bmi, refered_by_id, branch_id, untitled_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
//     const insertPatientRegistrationResult = [
//       entity_id,
//       registration_date,
//       mrno_entity_series,
//       patient_name,
//       gender,
//       age,
//       mobile_no,
//       address,
//       city,
//       state,
//       source_of_patient_id,
//       employee_id,
//       height,
//       weight,
//       bmi,
//       refered_by_id,
//       branch_id,
//       untitled_id,
//     ];
//     const patient_registration = await query(
//       insertPatientRegistrationQuery,
//       insertPatientRegistrationResult
//     );
//     res.status(200).json({
//       status: 200,
//       message: "Patient Registration  successfully",
//     });
//   } catch (error) {
//     return error500(error, res);
//   }
// };

// // get patient_registrations list...
// const getPatientRegistrations = async (req, res) => {
//   const { page, perPage, key } = req.query;
//   // const untitled_id = req.companyData.untitled_id;
//   const untitled_id = 1;

//   try {
//     let getPatientRegistrationQuery = `SELECT p.*, e.entity_name, s.source_of_patient_name, em.name, r.refered_by_name, b.branch   FROM patient_registration p
//           LEFT JOIN entity e
//           ON e.entity_id = p.entity_id
//           LEFT JOIN source_of_patient s
//           ON s.source_of_patient_id = p.source_of_patient_id
//           LEFT JOIN employee em
//           ON em.employee_id = p.employee_id
//           LEFT JOIN refered_by r
//           ON r.refered_by_id = p.refered_by_id
//           LEFT JOIN wm_customer_branch b
//           ON b.branch_id = p.branch_id
//           WHERE p.untitled_id = ${untitled_id}`;

//     let countQuery = `SELECT COUNT(*) AS total FROM patient_registration p
//       LEFT JOIN entity e
//       ON e.entity_id = p.entity_id
//       LEFT JOIN source_of_patient s
//       ON s.source_of_patient_id = p.source_of_patient_id
//       LEFT JOIN employee em
//       ON em.employee_id = p.employee_id
//       LEFT JOIN refered_by r
//       ON r.refered_by_id = p.refered_by_id
//       LEFT JOIN wm_customer_branch b
//       ON b.branch_id = p.branch_id
//           WHERE p.untitled_id = ${untitled_id}`;

//     if (key) {
//       const lowercaseKey = key.toLowerCase().trim();
//       if (key === "activated") {
//         getPatientRegistrationQuery += ` AND p.status = 1`;
//         countQuery += ` AND p.status = 1`;
//       } else if (key === "deactivated") {
//         getPatientRegistrationQuery += ` AND p.status = 0`;
//         countQuery += ` AND p.status = 0`;
//       } else {
//         getPatientRegistrationQuery += ` AND (LOWER(p.mrno ) LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%' ) `;
//         countQuery += ` AND (LOWER(p.mrno ) LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%' ) `;
//       }
//     }
//     getPatientRegistrationQuery += " ORDER BY p.cts DESC";

//     // Apply pagination if both page and perPage are provided
//     let total = 0;
//     if (page && perPage) {
//       const totalResult = await query(countQuery);
//       total = parseInt(totalResult[0].total);

//       const start = (page - 1) * perPage;
//       getPatientRegistrationQuery += ` LIMIT ${perPage} OFFSET ${start}`;
//     }

//     const result = await query(getPatientRegistrationQuery);
//     const patient_registration = result;

//     const data = {
//       status: 200,
//       message: "Patient Registration retrieved successfully",
//       data: patient_registration,
//     };
//     // Add pagination information if provided
//     if (page && perPage) {
//       data.pagination = {
//         per_page: perPage,
//         total: total,
//         current_page: page,
//         last_page: Math.ceil(total / perPage),
//       };
//     }

//     return res.status(200).json(data);
//   } catch (error) {
//     return error500(error, res);
//   }
// };

// // get patient_registration  by id...
// const getPatientRegistration = async (req, res) => {
//   const mrno = parseInt(req.params.id);

//   try {
//     const patientregistrationQuery = `SELECT p.*, u.untitled_id  FROM  patient_registration p
//         LEFT JOIN untitled u 
//         ON p.untitled_id = u.untitled_id
//         WHERE p.mrno = ?`;
//     const patientregistrationResult = await query(patientregistrationQuery, [
//         mrno,
//     ]);
//     if (patientregistrationResult.length == 0) {
//       return error422("Patient Not Found.", res);
//     }
//     const patient_registration = patientregistrationResult[0];
//     return res.status(200).json({
//       status: 200,
//       message: "Patient  Retrived Successfully",
//       data: patient_registration,
//     });
//   } catch (error) {
//     return error500(error, res);
//   }
// };
// //patient_registration update...
// const updatePatientRegistration = async (req, res) => {
//     const mrno = parseInt(req.params.id);
//     const entity_id = req.body.entity_id ? req.body.entity_id : "";
//     const registration_date = req.body.registration_date
//       ? req.body.registration_date
//       : "";
//     const mrno_entity_series = req.body.mrno_entity_series
//       ? req.body.mrno_entity_series.trim()
//       : "";
//     const patient_name = req.body.patient_name
//       ? req.body.patient_name.trim()
//       : "";
//     const gender = req.body.gender ? req.body.gender.trim() : "";
//     const age = req.body.age ? req.body.age : "";
//     const mobile_no = req.body.mobile_no ? req.body.mobile_no : "";
//     const city = req.body.city ? req.body.city.trim() : "";
//     const state = req.body.state ? req.body.state.trim() : "";
//     const source_of_patient_id = req.body.source_of_patient_id
//       ? req.body.source_of_patient_id
//       : "";
//     const height = req.body.height ? req.body.height: "";
//     const weight = req.body.weight ? req.body.weight: "";
//     const address = req.body.address ? req.body.address.trim() : "";
//     const bmi = req.body.bmi ? req.body.bmi.trim() : "";
//     const refered_by_id = req.body.refered_by_id
//       ? req.body.refered_by_id
//       : "";
//     const branch_id = req.body.branch_id ? req.body.branch_id : "";
//     const employee_id = req.body.employee_id ? req.body.employee_id : "";
//     // const untitled_id  = req.companyData.untitled_id ;
//     const untitled_id = 1;
//     if (!patient_name) {
//         return error422("Patient Name is required.", res);
//       } else if (!entity_id) {
//         return error422("Entity Id is required.", res);
//       } else if (!registration_date) {
//         return error422("Registration Date is required.", res);
//       } else if (!mrno_entity_series) {
//         return error422("Mrno Entity Series  is required.", res);
//       } else if (!patient_name) {
//         return error422("Patient Name  is required.", res);
//       } else if (!gender) {
//         return error422("Gender  is required.", res);
//       } else if (!age) {
//         return error422("Age is required.", res);
//       } else if (!mobile_no) {
//         return error422("Mobile No is required.", res);
//       } else if (!address) {
//         return error422("Address is required.", res);
//       } else if (!city) {
//         return error422("City is required.", res);
//       } else if (!state) {
//         return error422("State is required.", res);
//       } else if (!source_of_patient_id) {
//         return error422("Source Of Patient ID is required.", res);
//       } else if (!employee_id) {
//         return error422("Employee Id is required.", res);
//       } else if (!height) {
//         return error422("Hight is required.", res);
//       } else if (!weight) {
//         return error422("Weight is required.", res);
//       } else if (!bmi) {
//         return error422("BMI is required.", res);
//       } else if (!refered_by_id) {
//         return error422("Refered By ID is required.", res);
//       } else if (!branch_id) {
//         return error422("Branch ID is required.", res);
//       } else if (!untitled_id) {
//         return error422("Untitled ID is required.", res);
//       } else if (!mrno) {
//         return error422("Mrno is required.", res);
//       }
//     try {
//       // Check if patient_registration exists
//       const patientregistrationQuery = "SELECT * FROM patient_registration WHERE mrno  = ?";
//       const patientregistrationResult = await query(patientregistrationQuery, [mrno]);
//       if (patientregistrationResult.length == 0) {
//         return error422("Patient Not Found.", res);
//       }
  
//       // Check if the provided patient_registration exists and is active
//       const existingPatientRegistrationQuery =
//       `SELECT * FROM patient_registration WHERE ((entity_id = ${entity_id} AND mobile_no = ${mobile_no}) AND (branch_id = ${branch_id} AND mobile_no = ${mobile_no})) AND mrno !=${mrno} ;`
//       const existingPatientRegistrationResult = await query(existingPatientRegistrationQuery);
  
//       if (existingPatientRegistrationResult.length > 0) {
//         return error422("Mobile No already exists.", res);
//       }
//       const nowDate = new Date().toISOString().split("T")[0];
//       // Update the patient_registration record with new data
//       const updateQuery = `
//               UPDATE patient_registration
//               SET  entity_id = ?,
//               registration_date = ?,
//               mrno_entity_series = ?,
//               patient_name = ?,
//               gender = ?,
//               age = ?,
//               mobile_no = ?,
//               address = ?,
//               city = ?,
//               state = ?,
//               source_of_patient_id = ?,
//               employee_id = ?,
//               height = ?,
//               weight = ?,
//               bmi = ?,
//               refered_by_id = ?,
//               branch_id = ?,
//               untitled_id = ?, mts = ?
//               WHERE mrno = ?
//           `;
  
//       await query(updateQuery, [
//         entity_id,
//         registration_date,
//         mrno_entity_series,
//         patient_name,
//         gender,
//         age,
//         mobile_no,
//         address,
//         city,
//         state,
//         source_of_patient_id,
//         employee_id,
//         height,
//         weight,
//         bmi,
//         refered_by_id,
//         branch_id,
//         untitled_id,
//         untitled_id,
//         nowDate,
//         mrno ,
//       ]);
  
//       return res.status(200).json({
//         status: 200,
//         message: "patient updated successfully.",
//       });
//     } catch (error) {
//       return error500(error, res);
//     }
//   };

// //status change of patient_registration...
// const onStatusChange = async (req, res) => {
//   const patientregistrationId = parseInt(req.params.id);
//   const status = parseInt(req.query.status); // Validate and parse the status parameter
//   try {
//     // Check if the patient_registration  exists
//     const patientregistrationQuery = "SELECT * FROM patient_registration WHERE mrno = ?";
//     const patientregistrationResult = await query(patientregistrationQuery, [patientregistrationId]);

//     if (patientregistrationResult.length == 0) {
//       return res.status(404).json({
//         status: 404,
//         message: "Patient not found.",
//       });
//     }

//     // Validate the status parameter
//     if (status !== 0 && status !== 1) {
//       return res.status(400).json({
//         status: 400,
//         message:
//           "Invalid status value. Status must be 0 (inactive) or 1 (active).",
//       });
//     }

//     // Soft update the patient_registration status
//     const updateQuery = `
//             UPDATE patient_registration
//             SET status = ?
//             WHERE mrno = ?
//         `;

//     await query(updateQuery, [status, patientregistrationId]);

//     const statusMessage = status === 1 ? "activated" : "deactivated";

//     return res.status(200).json({
//       status: 200,
//       message: `Patient ${statusMessage} successfully.`,
//     });
//   } catch (error) {
//     return error500(error, res);
//   }
// };
// //get patient_registration active...
// const getPatientRegistrationWma = async (req, res) => {
//   let patientregistrationQuery =
//     "SELECT p.*  FROM patient_registration p LEFT JOIN untitled u ON u.untitled_id = p.untitled_id WHERE p.status =1 AND u.category=1 ORDER BY p.cts DESC";
//   try {
//     const patientregistrationResult = await query(patientregistrationQuery);
//     const patient_registration = patientregistrationResult;

//     return res.status(200).json({
//       status: 200,
//       message: "Patients retrieved successfully.",
//       data: patient_registration,
//     });
//   } catch (error) {
//     return error500(error, res);
//   }
// };

// module.exports = {
//   addPatientRegistration,
//   getPatientRegistrations,
//   getPatientRegistration,
//   updatePatientRegistration,
//   onStatusChange,
//   getPatientRegistrationWma
// };
