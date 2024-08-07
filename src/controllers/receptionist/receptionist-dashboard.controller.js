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
        if (connection) connection.release()
    }
};
// get receptionist dashboard Count...
const getReceptionistDashboardCount = async (req, res) => {
    const { page, perPage, key, lead_date } = req.query;
    const untitled_id = req.companyData.untitled_id;
    const visit_date = new Date().toISOString().split('T')[0];

    //check untitled_id already is exists or not
    const isExistUntitledIdQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
    const isExistUntitledIdResult = await pool.query(isExistUntitledIdQuery, [untitled_id]);
    const employeeDetails = isExistUntitledIdResult[0][0];
    if (employeeDetails.customer_id == 0) {
        return error422("Customer Not Found.", res);
    }

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const dateRangeQuery = `
        WITH RECURSIVE date_range AS (
            SELECT ? AS date_value
            UNION ALL
            SELECT DATE_ADD(date_value, INTERVAL 1 DAY)
            FROM date_range
            WHERE date_value < ?
        )
        SELECT date_range.date_value AS registrationDate
        FROM date_range
    `;

    const dateRangeResult = await pool.query(dateRangeQuery, [firstDayOfMonth, lastDayOfMonth]);
    const dateRange = dateRangeResult.map(row => row.registrationDate);

    const registrationCountQuery = `
        SELECT DATE(registration_date) AS registrationDate, COUNT(*) AS registrationCount
        FROM patient_registration
        WHERE registration_date >= ? AND registration_date <= ?
        GROUP BY DATE(registration_date)
    `;

    const registrationCountResult = await pool.query(registrationCountQuery, [firstDayOfMonth, lastDayOfMonth]);
    const registrationCountMap = {};
    registrationCountResult.forEach(row => {
        registrationCountMap[row.registrationDate] = row.registrationCount;
    });


    try {
        let today_total_patient_count = 0;
        let is_checked_count = 0;
        let is_not_checked_count = 0;
        let first_visit_count = 0;
        let re_visit_count = 0;

        //today total patient count...
        let todayTotalPatientCountQuery = `SELECT COUNT(*) AS total FROM patient_visit_list p 
        LEFT JOIN patient_registration pr 
        ON pr.mrno = p.mrno 
        LEFT JOIN entity e
        ON e.entity_id = pr.entity_id
        WHERE p.visit_date = '${visit_date}'  AND pr.customer_id = ${employeeDetails.customer_id}`;
        const todayTotalPatientCountResult = await pool.query(todayTotalPatientCountQuery);
        today_total_patient_count = parseInt(todayTotalPatientCountResult[0][0].total);

        //today is checked total patient count...
        let ischeckedCountQuery = `SELECT COUNT(*) AS total FROM patient_visit_list p 
        LEFT JOIN patient_registration pr 
        ON pr.mrno = p.mrno
        LEFT JOIN entity e
        ON e.entity_id = pr.entity_id
        WHERE p.visit_date = '${visit_date}' AND p.is_checked = 1 AND pr.customer_id = ${employeeDetails.customer_id}`;
        const isCheckedTotalCountResult = await pool.query(ischeckedCountQuery);
        is_checked_count = parseInt(isCheckedTotalCountResult[0][0].total);

        //today is not checked total patient count...
        let isNotCheckedCountQuery = `SELECT COUNT(*) AS total FROM patient_visit_list p 
        LEFT JOIN patient_registration pr 
        ON pr.mrno = p.mrno
        LEFT JOIN entity e
        ON e.entity_id = pr.entity_id
        WHERE p.visit_date = '${visit_date}' AND p.is_checked = 0 AND pr.customer_id = ${employeeDetails.customer_id}`;
        const isNotCheckedTotalCountResult = await pool.query(isNotCheckedCountQuery);
        is_not_checked_count = parseInt(isNotCheckedTotalCountResult[0][0].total);

        //today first visit total patient count...
        let firstVisitCountQuery = `SELECT COUNT(*) AS total FROM patient_visit_list p 
        LEFT JOIN patient_registration pr 
        ON pr.mrno = p.mrno
        LEFT JOIN entity e
        ON e.entity_id = pr.entity_id
        WHERE p.visit_date = '${visit_date}' AND p.visit_type = 'FIRST_VISIT' AND pr.customer_id = ${employeeDetails.customer_id}`;
        const firstVisitTotalCountResult = await pool.query(firstVisitCountQuery);
        first_visit_count = parseInt(firstVisitTotalCountResult[0][0].total);

        //today re visit total patient count...
        let reVisitCountQuery = `SELECT COUNT(*) AS total FROM patient_visit_list p 
         LEFT JOIN patient_registration pr 
         ON pr.mrno = p.mrno
         LEFT JOIN entity e
         ON e.entity_id = pr.entity_id
         WHERE p.visit_date = '${visit_date}' AND p.visit_type = 'RE_VISIT' AND pr.customer_id = ${employeeDetails.customer_id}`;
        const reVisitTotalCountResult = await pool.query(reVisitCountQuery);
        re_visit_count = parseInt(reVisitTotalCountResult[0][0].total);


        // //monthly datewise patient registration 
        const monthlyDatewisePatientRegistrationQuery = `
               SELECT DATE(registration_date) AS registrationDate, COUNT(*) AS registrationCount
               FROM patient_registration
               WHERE MONTH(registration_date) = MONTH(NOW()) AND YEAR(registration_date) = YEAR(NOW()) AND customer_id = ${employeeDetails.customer_id}
               GROUP BY DATE(registration_date)
           `;
        const monthlyDatewisePatientRegistrationResult = await pool.query(monthlyDatewisePatientRegistrationQuery);
        const monthly_datewise_patient_registration = monthlyDatewisePatientRegistrationResult[0];
        // Generate a date range for the current month 
        const nowDate = new Date().toISOString().split("T")[0]
        nowMonth = nowDate.split("-")[0] + '-' + nowDate.split("-")[1];
        const dateRangeQuery = `
       WITH RECURSIVE date_range AS (
           SELECT DATE('${nowMonth + '-' + '01'}') AS date_value
           UNION ALL
           SELECT DATE_ADD(date_value, INTERVAL 1 DAY)
           FROM date_range
           WHERE date_value < LAST_DAY(NOW())
       )
       SELECT date_range.date_value AS registrationDate
       FROM date_range
   `;

        const dateRangeResult = await pool.query(dateRangeQuery);
        const dateRange = dateRangeResult[0].map(row => row.registrationDate.toISOString().split('T')[0]);

        // Map the existing result to an object for easy lookup
        const existingResultMap = {};
        monthly_datewise_patient_registration.forEach(row => {
            existingResultMap[row.registrationDate.toISOString().split('T')[0]] = row.registrationCount;
        });

        // Build the final result array including zero counts for missing dates
        const finalResult = dateRange.map(date => ({
            registrationDate: date,
            registrationCount: existingResultMap[date] || 0
        }));


        const data = {
            status: 200,
            message: " Receptionist dashboard count retrieved successfully",
            today_total_patient_count: today_total_patient_count,
            is_checked_count: is_checked_count,
            is_not_checked_count: is_not_checked_count,
            first_visit_count: first_visit_count,
            re_visit_count: re_visit_count,
            monthly_datewise_patient_registration: finalResult
        };

        return res.status(200).json(data);
    } catch (error) {
        return error500(error, res);
    } finally {
        if (pool) pool.releaseConnection()
    }
};
const dateWisePatientAppointmentList = async (req, res) => {
    const appointment_date = req.query.appointment_date
    const untitled_id = req.companyData.untitled_id
    //check untitled_id already is exists or not
    const isExistUntitledIdQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
    const isExistUntitledIdResult = await pool.query(isExistUntitledIdQuery, [untitled_id]);
    const employeeDetails = isExistUntitledIdResult[0][0];
    if (employeeDetails.customer_id == 0) {
        return error422("Customer Not Found.", res);
    }
    if (!appointment_date) {
        return error422("Appointment date is required.", res)
    }

    try {
        //get patient consultation appointment
        const patientConsultationAppointmentListQuery = "SELECT a.*, p.* FROM consultation_appointment a LEFT JOIN patient_registration p ON p.mrno = a.mrno  WHERE a.customer_id = ? AND a.appointment_date = ? ";
        const patientConsultationAppointmentResult = await pool.query(patientConsultationAppointmentListQuery, [employeeDetails.customer_id, appointment_date]);
        return res.json({
            status: 200,
            message: "Patient consultation appointment retrived.",
            data: patientConsultationAppointmentResult[0]
        })

    } catch (error) {
        console.log(error);
        return error500(error, res);
    } finally {
        if (pool) pool.releaseConnection()
    }
}
// get category wise lead header count
const  getCategoryWiseLeadHeaderCount = async (req, res) =>{
    try {
        const query = `SELECT c.category_id, c.category_name, COALESCE(lh.lead_count, 0) AS lead_count 
        FROM category c
        LEFT JOIN (
            SELECT category_id, COUNT(lead_hid) AS lead_count
            FROM 
                lead_header
            WHERE 
                MONTH(lead_date) = MONTH(CURDATE())
            GROUP BY 
                category_id)
        lh ON c.category_id = lh.category_id`;
        const categoryWiseLeadCount = await pool.query(query);
        return res.status(200).json({
            status:200,
            message:"Category Wise Lead Header count for corrent month",
            data:categoryWiseLeadCount[0]
        })
    } catch (error) {
        return error500(error, res);
    } finally{
        if (pool) pool.releaseConnection()
    }
}
//get entity wise patient registration count
const getEntityWisePatientRegistrationCount = async (req, res)=>{
    try {
        const query =  ` SELECT e.entity_id, e.entity_name, COALESCE(p.patient_count, 0) AS patient_count
            FROM entity e
            LEFT JOIN  (
                SELECT entity_id, COUNT(mrno) AS patient_count
                FROM 
                    patient_registration
                WHERE 
                    MONTH(registration_date) = MONTH(CURDATE())
                GROUP BY
                    entity_id)
            p ON e.entity_id = p.entity_id` ;
        const entityWisePatientRegistrationCount = await pool.query(query);
        return res.status(200).json({
            status:200,
            message:"Entity wise patient registration count for correct month",
            data:entityWisePatientRegistrationCount[0]
        })
    } catch (error) {
        return error500(error, res);
    } finally {
        if (pool) pool.releaseConnection()
    }
}
//get call log Dashboard Count...
const getCallLogDashboardCount = async (req, res) => {
    const untitled_id = req.companyData.untitled_id;
    //check untitled_id already is exists or not
    const isExistUntitledIdQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
    const isExistUntitledIdResult = await pool.query(isExistUntitledIdQuery, [untitled_id]);
    const employeeDetails = isExistUntitledIdResult[0][0];
    if (employeeDetails.customer_id == 0) {
        return error422("Customer Not Found.", res);
    }
    const current_date = new Date().toISOString().split('T')[0];
    
    try {
        let today_total_call_log_count = 0;
        let is_outgoing_count = 0;
        let is_incoming_count = 0;
        let is_missed_count = 0;
        let is_rejected_count = 0;

        //today total call log count...
        let todayTotalCallLogCountQuery = `SELECT COUNT(*) AS total FROM call_logs c 
        WHERE Date(c.cts) = '${current_date}'  AND c.customer_id = ${employeeDetails.customer_id}`;
        const todayTotalCallLogCountResult = await pool.query(todayTotalCallLogCountQuery);
        today_total_call_log_count = parseInt(todayTotalCallLogCountResult[0][0].total);

        //today is outgoing total call logs count...
        let isOutGoingCountQuery = `SELECT COUNT(*) AS total FROM call_logs c 
        WHERE Date(c.cts) = '${current_date}' AND c.customer_id = ${employeeDetails.customer_id} AND c.calling_type = 'OUTGOING'`;
        const isGoingTotalCountResult = await pool.query(isOutGoingCountQuery);
        is_outgoing_count = parseInt(isGoingTotalCountResult[0][0].total);

        //today is incoming total call logs count...
        let isIncomingCountQuery = `SELECT COUNT(*) AS total FROM call_logs c 
        WHERE Date(c.cts) = '${current_date}'  AND c.customer_id = ${employeeDetails.customer_id} AND c.calling_type = 'INCOMING'`;
        const isIncomingTotalCountResult = await pool.query(isIncomingCountQuery);
        is_incoming_count = parseInt(isIncomingTotalCountResult[0][0].total);

        //today missed total call log count...
        let isMissedCountQuery = `SELECT COUNT(*) AS total FROM call_logs c  
        WHERE Date(c.cts) = '${current_date}' AND c.calling_type = 'MISSED' AND c.customer_id = ${employeeDetails.customer_id}`;
        const isMissedTotalCountResult = await pool.query(isMissedCountQuery);
        is_missed_count = parseInt(isMissedTotalCountResult[0][0].total);

        //today reject total call logs count...
        let rejectedCountQuery = `SELECT COUNT(*) AS total FROM call_logs c
         WHERE Date(c.cts) = '${current_date}' AND c.calling_type = 'REJECTED' AND c.customer_id = ${employeeDetails.customer_id}`;
        const rejectedTotalCountResult = await pool.query(rejectedCountQuery);
        is_rejected_count = parseInt(rejectedTotalCountResult[0][0].total);

        const data = {
            status: 200,
            message: " Receptionist dashboard call log count retrieved successfully",
            today_total_call_log_count: today_total_call_log_count,
            is_outgoing_count: is_outgoing_count,
            is_incoming_count: is_incoming_count,
            is_missed_count: is_missed_count,
            is_rejected_count: is_rejected_count,
        };

        return res.status(200).json(data);
    } catch (error) {
        return error500(error, res);
    } finally {
        if (pool) pool.releaseConnection()
    }
}
module.exports = {
    addleads,
    getReceptionistDashboardCount,
    dateWisePatientAppointmentList,
    getCategoryWiseLeadHeaderCount,
    getEntityWisePatientRegistrationCount,
    getCallLogDashboardCount

};
