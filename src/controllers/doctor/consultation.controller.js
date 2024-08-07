const pool = require("../../../db");
const path = require('path');
const fs = require('fs');
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
const createConsultation = async (req, res) => {
    const mrno = req.body.mrno ? req.body.mrno : '';
    const pluse = req.body.pluse ? req.body.pluse : 0;
    const bp = req.body.bp ? req.body.bp : 0;
    const past_history = req.body.past_history ? req.body.past_history : '';
    const chief_complaints_id = req.body.chief_complaints_id ? req.body.chief_complaints_id : '';
    const consultationChiefComplaintsDetails = req.body.consultationChiefComplaintsDetails ? req.body.consultationChiefComplaintsDetails : "";
    const consultationDiagnosisDetails = req.body.consultationDiagnosisDetails ? req.body.consultationDiagnosisDetails : "";
    const consultationTreatmentDetails = req.body.consultationTreatmentDetails ? req.body.consultationTreatmentDetails : "";
    const consultationMedicineDetails = req.body.consultationMedicineDetails ? req.body.consultationMedicineDetails : "";
    const consultationFileUploadDetails = req.body.consultationFileUploadDetails ? req.body.consultationFileUploadDetails : "";
    const appointment_date = req.body.appointment_date ? req.body.appointment_date : "";
    const appointment_time = req.body.appointment_time ? req.body.appointment_time : "";
    const untitled_id = req.companyData.untitled_id;
    if (!mrno) {
        return error422("MRNO is required.", res);
    }
    // else if (!chief_complaints_id) {
    //     return error422("Cheif complaints is required")
    // } 
    else if (!untitled_id) {
        return error422("Untitled id is required.", res)
    }
    //Check if untitled exists
    const isUntitledExistsQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
    const untitledExistResult = await pool.query(isUntitledExistsQuery, [untitled_id]);
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

    // if  consultation diagnosis details
    if (consultationDiagnosisDetails) {
        if (!consultationDiagnosisDetails || !Array.isArray(consultationDiagnosisDetails) ) {
            return error422("invalid consultation diagnosis Details data.", res);
        }
        //check duplicate diagnosis id 
        const duplicates = consultationDiagnosisDetails.reduce((acc, consultation_diagnosis, index) => {
            const { diagnosis_id } = consultation_diagnosis;
            const foundIndex = consultationDiagnosisDetails.findIndex((c, i) => i !== index && c.diagnosis_id === diagnosis_id);
            if (foundIndex !== -1 && !acc.some((entry) => entry.index === foundIndex)) {
                acc.push({ index, foundIndex });
            }
            return acc;
        }, []);

        if (duplicates.length > 0) {
            return error422("Duplicate Consultation diagnosis found in Consultation Diagnosis Details array.", res);
        }
    }

    //if consultation  treatment details
    if (consultationTreatmentDetails) {
        if (!consultationTreatmentDetails || !Array.isArray(consultationTreatmentDetails) ) {
            return error422("invalid consultation Treatment Details data.", res);
        }
        //check duplicate treatment id 
        const duplicates = consultationTreatmentDetails.reduce((acc, consultation_treatment, index) => {
            const { treatment_id } = consultation_treatment;
            const foundIndex = consultationTreatmentDetails.findIndex((c, i) => i !== index && c.treatment_id === treatment_id);
            if (foundIndex !== -1 && !acc.some((entry) => entry.index === foundIndex)) {
                acc.push({ index, foundIndex });
            }
            return acc;
        }, []);

        if (duplicates.length > 0) {
            return error422("Duplicate Consultation treatment advice found in Consultation treatment Details array.", res);
        }
    }

    // if  consultation chief complaint details
    if (consultationChiefComplaintsDetails) {
        if (!consultationChiefComplaintsDetails || !Array.isArray(consultationChiefComplaintsDetails)) {
            return error422("invalid consultation Chief Complaints Details data.", res);
        }
        //check duplicate chief complaint id 
        const duplicates = consultationChiefComplaintsDetails.reduce((acc, consultation_chief_complaint, index) => {
            const { chief_complaints_id } = consultation_chief_complaint;
            const foundIndex = consultationChiefComplaintsDetails.findIndex((c, i) => i !== index && c.chief_complaints_id === chief_complaints_id);
            if (foundIndex !== -1 && !acc.some((entry) => entry.index === foundIndex)) {
                acc.push({ index, foundIndex });
            }
            return acc;
        }, []);

        if (duplicates.length > 0) {
            return error422("Duplicate Consultation Chief complaint found in Consultation Chief Complaints Details array.", res);
        }
    }

    //if consultation  medicine details
    if (consultationMedicineDetails) {
        if (!consultationMedicineDetails || !Array.isArray(consultationMedicineDetails)) {
            return error422("invalid consultation Medicine Details data.", res);
        }
        //check duplicate medicine id 
        const duplicates = consultationMedicineDetails.reduce((acc, consultation_medicine, index) => {
            const { medicines_id } = consultation_medicine;
            const foundIndex = consultationMedicineDetails.findIndex((c, i) => i !== index && c.medicines_id === medicines_id);
            if (foundIndex !== -1 && !acc.some((entry) => entry.index === foundIndex)) {
                acc.push({ index, foundIndex });
            }
            return acc;
        }, []);

        if (duplicates.length > 0) {
            return error422("Duplicate Consultation Medicine found in Consultation Medicine Details array.", res);
        }
    }
    //if consultation file upload details
    if (consultationFileUploadDetails) {
        if (!consultationFileUploadDetails || !Array.isArray(consultationFileUploadDetails)) {
            return error422("invalid consultation File upload Details data.", res);
        }
        //check duplicate medicine id 
        const duplicates = consultationFileUploadDetails.reduce((acc, consultation_file_upload, index) => {
            const { image_name } = consultation_file_upload;
            const foundIndex = consultationFileUploadDetails.findIndex((c, i) => i !== index && c.image_name === image_name);
            if (foundIndex !== -1 && !acc.some((entry) => entry.index === foundIndex)) {
                acc.push({ index, foundIndex });
            }
            return acc;
        }, []);

        if (duplicates.length > 0) {
            return error422("Duplicate Consultation File Upload found in Consultation File Upload Details array.", res);
        }
    }

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        //Insert consultation table
        const insertConsultationQuery = "INSERT INTO consultation (mrno, pluse, bp, past_history, chief_complaints_id, customer_id, untitled_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const consultationValues = [mrno, pluse, bp, past_history, chief_complaints_id, customer_id, untitled_id];
        const consultationResult = await connection.query(insertConsultationQuery, consultationValues);
        const consultation_id = consultationResult[0].insertId;

        //consultation diagnosis details
        if (consultationDiagnosisDetails) {
            for (const row of consultationDiagnosisDetails) {
                const diagnosis_id = row.diagnosis_id;
                const notes = row.notes;
                if (diagnosis_id) {
                    try {
                        //insert  into consultation diagnosis  table...
                        const insertConsultationDiagnosisQuery = "INSERT INTO consultation_diagnosis (diagnosis_id, notes,consultation_id) VALUES (?, ?,?)";
                        const insertConsultationDiagnosisValues = [diagnosis_id, notes, consultation_id];
                        const insertConsultationDiagnosisResult = await connection.query(insertConsultationDiagnosisQuery, insertConsultationDiagnosisValues);
                    } catch (error) {
                        // Handle errors
                        await connection.rollback();
                        return error500(error, res);
                    }
                }
            }
        }

        //consultation  treatment details 
        if (consultationTreatmentDetails) {
            for (const row of consultationTreatmentDetails) {
                const treatment_id = row.treatment_id;
                const notes = row.notes;

                if (treatment_id) {
                    try {
                        //insert  into consultation treatment  table...
                        const insertConsultationTreatmentQuery = "INSERT INTO consultation_treatment_advice (treatment_id, notes,consultation_id) VALUES (?, ?,?)";
                        const insertConsultationTreatmentValues = [treatment_id, notes, consultation_id];
                        const insertConsultationTreatmentResult = await connection.query(insertConsultationTreatmentQuery, insertConsultationTreatmentValues);
                    } catch (error) {
                        // Handle errors
                        await connection.rollback();
                        return error500(error, res);
                    }
                }
            }
        }

        //consultation Chief Complaints details 
        if (consultationChiefComplaintsDetails) {
            for (const row of consultationChiefComplaintsDetails) {
                const chief_complaints_id = row.chief_complaints_id;
                if (chief_complaints_id) {
                    try {
                        //insert  into consultation cheif complaints table...
                        const insertConsultationChiefComplaintsQuery = "INSERT INTO consultation_chief_complaints (chief_complaints_id, consultation_id ) VALUES (?, ?)";
                        const insertConsultationChiefComplaintsValues = [chief_complaints_id, consultation_id];
                        const insertConsultationChiefComplaintsResult = await connection.query(insertConsultationChiefComplaintsQuery, insertConsultationChiefComplaintsValues);
                    } catch (error) {
                        // Handle errors
                        await connection.rollback();
                        return error500(error, res);
                    }
                }
            }
        }

        //consultation Medicice details 
        if (consultationMedicineDetails) {
            for (const row of consultationMedicineDetails) {
                const medicines_id = row.medicines_id;
                const dosages_id = row.dosages_id;
                const days = row.days;
                const instructions_id = row.instructions_id;
                if (medicines_id) {
                    try {
                        //insert  into consultation medicine table...
                        const insertConsultationMedicineQuery = "INSERT INTO consultation_medicine (medicines_id, dosages_id, days, instructions_id, consultation_id ) VALUES (?, ?, ?, ?, ?)";
                        const insertConsultationMedicineValues = [medicines_id, dosages_id, days, instructions_id, consultation_id];
                        const insertConsultationMedicineResult = await connection.query(insertConsultationMedicineQuery, insertConsultationMedicineValues);
                    } catch (error) {
                        // Handle errors
                        await connection.rollback();
                        return error500(error, res);
                    }
                }
            }
        }

        //consultation file upload details  consultation_file_upload_id	image_name	consultation_id	notes consultation_file_upload	

        if (consultationFileUploadDetails) {
            for (const row of consultationFileUploadDetails) {
                const imageBase64 = row.imageBase64;
                const image_name = row.image_name;
                const notes = row.notes;
                let conFileName = "";
                let conFilePath = "";
                if (image_name) {
                    if (image_name && imageBase64) {
                        const timestamp = Date.now();
                        const fileExtension = path.extname(image_name);
                        conFileName = `concultation_No${consultation_id}_${timestamp}${fileExtension}`;
                        conFilePath = path.join(__dirname, "..", "..", "..", "images", "consultationfile", conFileName);
                        const decodedLogo = Buffer.from(imageBase64, "base64");
                        fs.writeFileSync(conFilePath, decodedLogo);
                    }
                    try {
                        //insert  into consultation file upload table...
                        const insertConsultationFileUploadQuery = "INSERT INTO consultation_file_upload ( image_name, notes, consultation_id ) VALUES (?, ?, ?)";
                        const insertConsultationFileUploadValues = [conFileName, notes, consultation_id];
                        const insertConsultationFileUploadResult = await connection.query(insertConsultationFileUploadQuery, insertConsultationFileUploadValues);

                    } catch (error) {
                        // Handle errors
                        console.log(error);
                        await connection.rollback();
                        if ((conFilePath && fs.existsSync(conFilePath))) {
                            fs.unlinkSync(conFilePath);
                        }
                        return error500(error, res);
                    }
                }
            }
        }
        //consultation appointment  
        if (appointment_date && appointment_time) {
            const insertConsultationAppointmentQuery = "INSERT INTO  consultation_appointment (mrno, appointment_date, appointment_time, untitled_id, customer_id ) VALUES (?, ?, ?, ?, ?)";
            const insertConsultationAppointmentValues = [mrno, appointment_date, appointment_time, untitled_id, customer_id];
            const insertConsultationAppointmentResult = await connection.query(insertConsultationAppointmentQuery, insertConsultationAppointmentValues);
        }

        //update patient  from patient_visit_list table is checked
        const udpatePatientVisitCheckQuery = `
        UPDATE patient_visit_list 
        SET is_checked = ?
        WHERE mrno = ?`;
        const patientVisitCheckResult = await connection.query(udpatePatientVisitCheckQuery, [1, mrno]);


        // Commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: "Consultation added successfully",
            consultation_id:consultation_id
        });
    } catch (error) {
        console.log(error);
        return error500(error, res);
    } finally {
        if (connection) connection.release()
    }
}

// get consultation list 
const getConsultationList = async (req, res) => {
    const { page, perPage, key, current_day } = req.query;
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
        let getConsultationQuery = `SELECT c.*, p.registration_date, p.mrno_entity_series, p.patient_name, p.gender, p.age, p.mobile_no, p.city, p.address, p.entity_id, e.abbrivation, e.entity_name FROM consultation c
        LEFT JOIN patient_registration p 
        ON p.mrno = c.mrno
        LEFT JOIN entity e
        ON e.entity_id = p.entity_id
        WHERE c.customer_id = ${customer_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM consultation c 
        LEFT JOIN patient_registration p 
        ON p.mrno = c.mrno 
        LEFT JOIN entity e
        ON e.entity_id = p.entity_id
        WHERE c.customer_id = ${customer_id}`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim().replace(/'/g, "\\'");;
            if (key === "activated") {
                getConsultationQuery += ` AND p.status = 1`;
                countQuery += ` AND p.status = 1`;
            } else if (key === "deactivated") {
                getConsultationQuery += ` AND p.status = 0`;
                countQuery += ` AND p.status = 0`;
            } else {
                getConsultationQuery += ` AND (p.mobile_no LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%')`;
                countQuery += ` AND (p.mobile_no LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%')`;
            }
        }

        if (current_day) {
            getConsultationQuery += ` AND DATE(c.cts) = '${current_day}'`;
            countQuery += ` AND DATE(c.cts) = '${current_day}'`;
        }

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);
            const start = (page - 1) * perPage;
            getConsultationQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await pool.query(getConsultationQuery);
        const consultations = result[0];
        const data = {
            status: 200,
            message: "Consultations retrieved successfully",
            data: consultations
        }
        //Add pagination information if provided 
        if (page && perPage) {
            data.pagination = {
                per_page: perPage,
                total: total,
                current_page: page,
                last_page: Math.ceil(total / perPage)
            };
        }
        return res.json(data);
    } catch (error) {
        console.log(error);
        return error500(error, res);
    } finally {
        if (pool) pool.releaseConnection()
    }
}
// get consultation by  id
const getConsultationById = async (req, res) => {
    const consultationId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;

    if (!consultationId) {
        return error422("Consultation id is required.", res);
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
    //check if consultation exists
    const isConsultationQuery = ` SELECT * FROM consultation WHERE consultation_id = ? AND customer_id = ?`
    const isConsultationResult = await pool.query(isConsultationQuery, [consultationId, customer_id]);
    if (isConsultationResult[0].length == 0) {
        return error422("Consultation Not Found.", res);
    }

    try {
        let getConsultationQuery = `SELECT c.*, p.*, e.name AS employee_name FROM consultation c 
        LEFT JOIN patient_registration p 
        ON p.mrno = c.mrno
        LEFT JOIN employee e
        ON p.employee_id = e.employee_id
        WHERE c.consultation_id = ${consultationId}`;
        const result = await pool.query(getConsultationQuery);
        let consultations = result[0][0];

        //query consultation chief complaints 
        const consultationChiefComplaintsQuery = `
        SELECT cc.*, c.chief_complaint
        FROM consultation_chief_complaints cc
        LEFT JOIN chief_complaints c 
        ON c.chief_complaint_id = cc.chief_complaints_id  
        WHERE cc.consultation_id =  ${consultationId}`;
        const consultationChiefComplaintsResult = await pool.query(consultationChiefComplaintsQuery);
        consultations['consultationChiefComplaintsDetails'] = consultationChiefComplaintsResult[0];

        //query consultation diagnosis 
        const consultationDiagnosisQuery = ` 
        SELECT cd.*, d.diagnosis_name 
        FROM consultation_diagnosis cd 
        LEFT JOIN diagnosis d ON d.diagnosis_id = cd.diagnosis_id  
        WHERE cd.consultation_id = ${consultationId}`;
        const consultationDiagnosisResult = await pool.query(consultationDiagnosisQuery);
        consultations['consultationDiagnosisDetails'] = consultationDiagnosisResult[0];

        //query consultation  treatment 
        const consultationTreatmentQuery = `
        SELECT ct.*, t.treatment_name
        FROM consultation_treatment_advice ct 
        LEFT JOIN treatment t ON t.treatment_id = ct.treatment_id  
        WHERE ct.consultation_id = ${consultationId}`;
        const consultationTreatmentResult = await pool.query(consultationTreatmentQuery);
        consultations['consultationTreatmentDetails'] = consultationTreatmentResult[0];


        // query consultation medicine 
        const consultationMedicineQuery = `
        SELECT cm.*, m.medicines_name, i.instruction, d.dosage_name
        FROM consultation_medicine cm
        LEFT JOIN medicines m 
        ON m.medicines_id = cm.medicines_id  
        LEFT JOIN instructions i 
        ON i.instructions_id = cm.instructions_id 
        LEFT JOIN dosages d
        ON d.dosage_id = cm.dosages_id 
        WHERE cm.consultation_id =${consultationId}`;
        const consultationMedicineResult = await pool.query(consultationMedicineQuery);
        consultations['consultationMedicineDetails'] = consultationMedicineResult[0];

        // //query consultation file upload 
        // const consultationFileUploadDetails = [];
        // const consulatationFileUploadQuery = `SELECT * FROM consultation_file_upload WHERE consultation_id = ${consultationId}`;
        // const consultationFileUploadResult = await pool.query(consulatationFileUploadQuery);
        // consultations['consultationFileUploadDetails'] = consultationFileUploadResult[0];
        // try {
        //     // Query the image name from the database
        //     const getImageNameQuery = `SELECT image_name FROM consultation_file_upload WHERE consultation_id = ?`;
        //     const getImageNameResult = await pool.query(getImageNameQuery, [consultationId]);
        //     const imageName = getImageNameResult[0][0].image_name;

        //     // Read the image file from the filesystem
        //     const imagePath = path.join(__dirname, "..", "..", "..", "images", "consultationfile", imageName);
        //     const imageBuffer = fs.readFileSync(imagePath);

        //     // Convert the image buffer to base64
        //     const imageBase64 = imageBuffer.toString('base64');
        //     console.log(imageBase64);
        // } catch (error) {
        //     console.log(error);
        // }
        //query consultation file upload 
        const consultationFileUploadQuery = `SELECT * FROM consultation_file_upload WHERE consultation_id = ${consultationId}`;
        const consultationFileUploadResult = await pool.query(consultationFileUploadQuery);
        consultations['consultationFileUploadDetails'] = consultationFileUploadResult[0];

        for (const fileUpload of consultations['consultationFileUploadDetails']) {
            try {
                if (fileUpload.image_name) {
                    // Read the image file from the filesystem
                    const imagePath = path.join(__dirname, "..", "..", "..", "images", "consultationfile", fileUpload.image_name);
                    const imageBuffer = fs.readFileSync(imagePath);

                    if (imageBuffer) {
                        // Convert the image buffer to base64
                        const imageBase64 = imageBuffer.toString('base64');

                        // Add the base64 image to the file upload object
                        fileUpload.imageBase64 = imageBase64;
                    }
                }
            } catch (error) {
                return error500(error, res)
                // Handle error if image cannot be read or converted
            }
        }


        const data = {
            status: 200,
            message: "Consultation retrieved successfully",
            data: consultations
        }

        return res.json(data);
    } catch (error) {
        console.log(error);
        return error500(error, res);
    } finally {
        if (pool) pool.releaseConnection();
    }
}
//update consultation 
const updateConsultation = async (req, res) => {
    const consultationId = parseInt(req.params.id);
    const mrno = req.body.mrno ? req.body.mrno : '';
    const pluse = req.body.pluse ? req.body.pluse : 0;
    const bp = req.body.bp ? req.body.bp : 0;
    const past_history = req.body.past_history ? req.body.past_history : '';
    const chief_complaints_id = req.body.chief_complaints_id ? req.body.chief_complaints_id : '';
    const consultationChiefComplaintsDetails = req.body.consultationChiefComplaintsDetails ? req.body.consultationChiefComplaintsDetails : "";
    const consultationDiagnosisDetails = req.body.consultationDiagnosisDetails ? req.body.consultationDiagnosisDetails : "";
    const consultationTreatmentDetails = req.body.consultationTreatmentDetails ? req.body.consultationTreatmentDetails : "";
    const consultationMedicineDetails = req.body.consultationMedicineDetails ? req.body.consultationMedicineDetails : "";
    const consultationFileUploadDetails = req.body.consultationFileUploadDetails ? req.body.consultationFileUploadDetails : "";
    const untitled_id = req.companyData.untitled_id;
    if (!mrno) {
        return error422("MRNO is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res)
    }

    //Check if untitled exists
    const isUntitledExistsQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
    const untitledExistResult = await pool.query(isUntitledExistsQuery, [untitled_id]);
    if (untitledExistResult[0].length == 0) {
        return error422("User Not Found.", res);
    }
    const customer_id = untitledExistResult[0][0].customer_id;
    if (!customer_id) {
        return error422("Customer Id is required.", res);
    }
    //check if consultation exists
    const consultationtQuery = "SELECT * FROM consultation WHERE consultation_id  = ? AND customer_id = ?";
    const consultationResult = await pool.query(consultationtQuery, [consultationId, customer_id]);
    if (consultationResult[0].length == 0) {
        return error422("Consultation Not Found.", res);
    }
    //check if check mrno exists 
    const isExistMrnoQuery = "SELECT * FROM patient_registration WHERE mrno = ?";
    const mrnoResult = await pool.query(isExistMrnoQuery, [mrno]);
    if (mrnoResult[0].length == 0) {
        return error422("Mrno Not Found", res);
    }
    // if  consultation diagnosis details
    if (consultationDiagnosisDetails) {
        if (!consultationDiagnosisDetails || !Array.isArray(consultationDiagnosisDetails) ) {
            return error422("invalid consultation diagnosis Details data.", res);
        }
        //check duplicate diagnosis id 
        const duplicates = consultationDiagnosisDetails.reduce((acc, consultation_diagnosis, index) => {
            const { diagnosis_id } = consultation_diagnosis;
            const foundIndex = consultationDiagnosisDetails.findIndex((c, i) => i !== index && c.diagnosis_id === diagnosis_id);
            if (foundIndex !== -1 && !acc.some((entry) => entry.index === foundIndex)) {
                acc.push({ index, foundIndex });
            }
            return acc;
        }, []);

        if (duplicates.length > 0) {
            return error422("Duplicate Consultation diagnosis found in Consultation Diagnosis Details array.", res);
        }
    }

    //if consultation  treatment details
    if (consultationTreatmentDetails) {
        if (!consultationTreatmentDetails || !Array.isArray(consultationTreatmentDetails) ) {
            return error422("invalid consultation Treatment Details data.", res);
        }
        //check duplicate treatment id 
        const duplicates = consultationTreatmentDetails.reduce((acc, consultation_treatment, index) => {
            const { treatment_id } = consultation_treatment;
            const foundIndex = consultationTreatmentDetails.findIndex((c, i) => i !== index && c.treatment_id === treatment_id);
            if (foundIndex !== -1 && !acc.some((entry) => entry.index === foundIndex)) {
                acc.push({ index, foundIndex });
            }
            return acc;
        }, []);

        if (duplicates.length > 0) {
            return error422("Duplicate Consultation treatment advice found in Consultation treatment Details array.", res);
        }
    }

    // if  consultation chief complaint details
    if (consultationChiefComplaintsDetails) {
        if (!consultationChiefComplaintsDetails || !Array.isArray(consultationChiefComplaintsDetails)) {
            return error422("invalid consultation Chief Complaints Details data.", res);
        }
        //check duplicate chief complaint id 
        const duplicates = consultationChiefComplaintsDetails.reduce((acc, consultation_chief_complaint, index) => {
            const { chief_complaints_id } = consultation_chief_complaint;
            const foundIndex = consultationChiefComplaintsDetails.findIndex((c, i) => i !== index && c.chief_complaints_id === chief_complaints_id);
            if (foundIndex !== -1 && !acc.some((entry) => entry.index === foundIndex)) {
                acc.push({ index, foundIndex });
            }
            return acc;
        }, []);

        if (duplicates.length > 0) {
            return error422("Duplicate Consultation Chief complaint found in Consultation Chief Complaints Details array.", res);
        }
    }

    //if consultation  medicine details
    if (consultationMedicineDetails) {
        if (!consultationMedicineDetails || !Array.isArray(consultationMedicineDetails)) {
            return error422("invalid consultation Medicine Details data.", res);
        }
        //check duplicate medicine id 
        const duplicates = consultationMedicineDetails.reduce((acc, consultation_medicine, index) => {
            const { medicines_id } = consultation_medicine;
            const foundIndex = consultationMedicineDetails.findIndex((c, i) => i !== index && c.medicines_id === medicines_id);
            if (foundIndex !== -1 && !acc.some((entry) => entry.index === foundIndex)) {
                acc.push({ index, foundIndex });
            }
            return acc;
        }, []);

        if (duplicates.length > 0) {
            return error422("Duplicate Consultation Medicine found in Consultation Medicine Details array.", res);
        }
    }
    //if consultation file upload details
    if (consultationFileUploadDetails) {
        if (!consultationFileUploadDetails || !Array.isArray(consultationFileUploadDetails)) {
            return error422("invalid consultation File upload Details data.", res);
        }
        //check duplicate medicine id 
        const duplicates = consultationFileUploadDetails.reduce((acc, consultation_file_upload, index) => {
            const { image_name } = consultation_file_upload;
            const foundIndex = consultationFileUploadDetails.findIndex((c, i) => i !== index && c.image_name === image_name);
            if (foundIndex !== -1 && !acc.some((entry) => entry.index === foundIndex)) {
                acc.push({ index, foundIndex });
            }
            return acc;
        }, []);

        if (duplicates.length > 0) {
            return error422("Duplicate Consultation File Upload found in Consultation File Upload Details array.", res);
        }

    }

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        //update consultation table
        const updateConsultationQuery = `
            UPDATE consultation 
            SET mrno = ?, pluse = ?, bp = ?, past_history = ?, chief_complaints_id = ?, customer_id = ?, untitled_id = ?
            WHERE consultation_id = ?`;
        const consultationValues = [mrno, pluse, bp, past_history, chief_complaints_id, customer_id, untitled_id, consultationId];
        const consultationResult = await connection.query(updateConsultationQuery, consultationValues);

        //consultation diagnosis details
        if (consultationDiagnosisDetails) {
            for (const row of consultationDiagnosisDetails) {
                const diagnosis_id = row.diagnosis_id;
                const notes = row.notes;
                const consultation_diagnosis_id = row.consultation_diagnosis_id;

                if (diagnosis_id) {
                                    // Check if consultation diagnosis exists
                const consultationDiagnosisQuery = "SELECT * FROM consultation_diagnosis WHERE consultation_diagnosis_id = ?";
                const consultationDiagnosisResult = await connection.query(consultationDiagnosisQuery, [consultation_diagnosis_id]);

                if (consultationDiagnosisResult[0].length > 0) {
                    try {
                        // Update the consultation diagnosis record with new data
                        const updateConsultationDiagnosisQuery = `
                        UPDATE consultation_diagnosis
                        SET  diagnosis_id = ?, notes = ?, consultation_id = ?
                        WHERE consultation_diagnosis_id = ?`;
                        await connection.query(updateConsultationDiagnosisQuery, [diagnosis_id, notes, consultationId, consultation_diagnosis_id]);
                    } catch (error) {
                        // Rollback the transaction
                        await connection.rollback();
                        return error500(error, res);
                    }
                } else {
                    //insert  into consultation diagnosis  table...
                    const insertConsultationDiagnosisQuery = "INSERT INTO consultation_diagnosis (diagnosis_id, notes,consultation_id) VALUES (?, ?,?)";
                    const insertConsultationDiagnosisValues = [diagnosis_id, notes, consultationId];
                    const insertConsultationDiagnosisResult = await connection.query(insertConsultationDiagnosisQuery, insertConsultationDiagnosisValues);
                }
                }
            }
        }

        //consultation  treatment details 
        if (consultationTreatmentDetails) {
            for (const row of consultationTreatmentDetails) {
                const treatment_id = row.treatment_id;
                const notes = row.notes;
                const consultation_treatment_id = row.consultation_treatment_id;

                if (treatment_id) {
                                    // Check if consultation treatment exists
                const consultationTreatmentQuery = "SELECT * FROM consultation_treatment_advice WHERE consultation_treatment_id = ?";
                const consultationTreatmentResult = await connection.query(consultationTreatmentQuery, [consultation_treatment_id]);

                if (consultationTreatmentResult[0].length > 0) {
                    try {
                        // Update the consultation treatment record with new data
                        const updateConsultationTreatmentQuery = `
                                        UPDATE consultation_treatment_advice
                                        SET  treatment_id = ?, notes = ?, consultation_id = ?
                                        WHERE consultation_treatment_id = ?`;
                        await connection.query(updateConsultationTreatmentQuery, [treatment_id, notes, consultationId, consultation_treatment_id]);
                    } catch (error) {
                        // Rollback the transaction
                        await connection.rollback();
                        return error500(error, res);
                    }
                } else {
                    //insert  into consultation treatment  table...
                    const insertConsultationTreatmentQuery = "INSERT INTO consultation_treatment_advice (treatment_id, notes,consultation_id) VALUES (?, ?,?)";
                    const insertConsultationTreatmentValues = [treatment_id, notes, consultationId];
                    const insertConsultationTreatmentResult = await connection.query(insertConsultationTreatmentQuery, insertConsultationTreatmentValues);
                }
                }
            }
        }
        //consultation chief complaints details 
        if (consultationChiefComplaintsDetails) {
            for (const row of consultationChiefComplaintsDetails) {
                const chief_complaints_id = row.chief_complaints_id;
                const consultation_chief_complaints_id = row.consultation_chief_complaints_id;

                if (chief_complaints_id) {
                    // Check if consultation chief complaints exists
                    const consultationChiefComplaintsQuery = "SELECT * FROM consultation_chief_complaints WHERE consultation_chief_complaints_id = ?";
                    const consultationChiefComplaintsResult = await connection.query(consultationChiefComplaintsQuery, [consultation_chief_complaints_id]);

                    if (consultationChiefComplaintsResult[0].length > 0) {
                        try {
                            // Update the consultation chief complaints record with new data
                            const updateConsultationChiefComplaintsQuery = `
                                        UPDATE consultation_chief_complaints
                                        SET  chief_complaints_id = ?, consultation_id = ?
                                        WHERE consultation_chief_complaints_id = ?`;
                            await connection.query(updateConsultationChiefComplaintsQuery, [chief_complaints_id, consultationId, consultation_chief_complaints_id]);
                        } catch (error) {
                            // Rollback the transaction
                            await connection.rollback();
                            return error500(error, res);
                        }
                    } else {
                        //insert  into consultation chief complaints table...
                        const insertConsultationChiefComplaintsQuery = "INSERT INTO consultation_chief_complaints (chief_complaints_id, consultation_id ) VALUES (?, ?)";
                        const insertConsultationChiefComplaintsValues = [chief_complaints_id, consultationId];
                        const insertConsultationChiefComplaintsResult = await connection.query(insertConsultationChiefComplaintsQuery, insertConsultationChiefComplaintsValues);
                    }
                }
            }
        }
        //consultation Medicice details 
        if (consultationMedicineDetails) {
            for (const row of consultationMedicineDetails) {
                const medicines_id = row.medicines_id;
                const dosages_id = row.dosages_id;
                const days = row.days;
                const instructions_id = row.instructions_id;
                const consultation_medicine_id = row.consultation_medicine_id;

                if (medicines_id) {
                    // Check if consultation medicine exists
                    const consultationMedicineQuery = "SELECT * FROM consultation_medicine WHERE consultation_medicine_id = ?";
                    const consultationMedicineResult = await connection.query(consultationMedicineQuery, [consultation_medicine_id]);

                    if (consultationMedicineResult[0].length > 0) {
                        try {
                            // Update the consultation medicine record with new data
                            const updateConsultationMedicineQuery = `
                                        UPDATE consultation_medicine
                                        SET  medicines_id = ?, dosages_id = ?, days = ?, instructions_id = ?, consultation_id = ?
                                        WHERE consultation_medicine_id = ?`;
                            await connection.query(updateConsultationMedicineQuery, [medicines_id, dosages_id, days, instructions_id, consultationId, consultation_medicine_id]);
                        } catch (error) {
                            // Rollback the transaction
                            await connection.rollback();
                            return error500(error, res);
                        }
                    } else {
                        //insert  into consultation medicine table...
                        const insertConsultationMedicineQuery = "INSERT INTO consultation_medicine (medicines_id, dosages_id, days, instructions_id, consultation_id ) VALUES (?, ?, ?, ?, ?)";
                        const insertConsultationMedicineValues = [medicines_id, dosages_id, days, instructions_id, consultationId];
                        const insertConsultationMedicineResult = await connection.query(insertConsultationMedicineQuery, insertConsultationMedicineValues);
                    }
                }
            }
        }

        //consultation file upload details  consultation_file_upload_id	image_name	consultation_id	notes consultation_file_upload	
        if (consultationFileUploadDetails) {
            for (const row of consultationFileUploadDetails) {
                const imageBase64 = row.imageBase64;
                const image_name = row.image_name;
                const notes = row.notes;
                const consultation_file_upload_id = row.consultation_file_upload_id;


                let conFileName = "";
                let conFilePath = "";
                if (image_name) {
                    //  Generate short logo FileName and short logo FilePath if short provided
                    if (image_name && imageBase64) {
                        const timestamp = Date.now();
                        const fileExtension = path.extname(image_name);
                        conFileName = `concultation_No${consultationId}_${timestamp}${fileExtension}`;
                        conFilePath = path.join(__dirname, "..", "..", "..", "images", "consultationfile", conFileName);
                        const decodedLogo = Buffer.from(imageBase64, "base64");
                        fs.writeFileSync(conFilePath, decodedLogo);
                    }

                    // Check if consultation file upload exists
                    const consultationFileUploadQuery = "SELECT * FROM consultation_file_upload WHERE consultation_file_upload_id = ?";
                    const consultationFileUploadResult = await connection.query(consultationFileUploadQuery, [consultation_file_upload_id]);

                    if (consultationFileUploadResult[0].length > 0) {
                        try {
                            const previousImageName = consultationFileUploadResult[0][0].image_name;
                            const previousImagePath = path.join(__dirname, "..", "..", "..", "images", "consultationfile", previousImageName);

                            // Update the consultation file upload  record with new data
                            const updateConsultationFileUploadQuery = `
                                        UPDATE consultation_file_upload
                                        SET  image_name = ?, notes = ?, consultation_id = ?
                                        WHERE consultation_file_upload_id = ?`;
                            await connection.query(updateConsultationFileUploadQuery, [conFileName, notes, consultationId, consultation_file_upload_id]);

                            // If the update is successful, delete the old file
                            if (fs.existsSync(previousImagePath)) {
                                fs.unlinkSync(previousImagePath);
                            }
                        } catch (error) {
                            // Rollback the transaction
                            await connection.rollback();
                            if ((conFilePath && fs.existsSync(conFilePath))) {
                                fs.unlinkSync(conFilePath);
                            }
                            return error500(error, res);
                        }
                    } else {
                        //insert  into consultation file upload table...
                        const insertConsultationFileUploadQuery = "INSERT INTO consultation_file_upload ( image_name, notes, consultation_id ) VALUES (?, ?, ?)";
                        const insertConsultationFileUploadValues = [conFileName, notes, consultationId];
                        const insertConsultationFileUploadResult = await connection.query(insertConsultationFileUploadQuery, insertConsultationFileUploadValues);
                    }
                }

            }
        }

        // Commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: "Consultation updated successfully"
        });
    } catch (error) {
        console.log(error);
        return error500(error, res);
    } finally {
        if (connection) connection.release()
    }

}

//delete consultation diagnosis
const deleteConsultationDiagnosis = async (req, res) => {
    const consultationDiagnosisId = parseInt(req.params.id);
    const { consultation_id } = req.query;
    if (!consultation_id) {
        return error422("Consultation id is required.", res);
    }

    const isConsultationDiagnosisQuery = "SELECT * FROM consultation_diagnosis WHERE consultation_diagnosis_id = ? AND consultation_id = ?";
    const consultationDiagnosisResult = await pool.query(isConsultationDiagnosisQuery, [consultationDiagnosisId, consultation_id]);
    if (consultationDiagnosisResult[0].length == 0) {
        return res.status(404).json({
            status: 404,
            message: "Consultation Diagnosis Not Found.",
        });
    }
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        //delete consultation diagnosis
        const deleteConsultationDiagnosisQuery = "DELETE FROM consultation_diagnosis WHERE consultation_diagnosis_id = ?";
        const deleteConsultationDiagnosisResult = await connection.query(deleteConsultationDiagnosisQuery, [consultationDiagnosisId]);

        await connection.commit();
        return res.json({
            status: 200,
            message: "Consulation diagnosis has been deleted successfully.",
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        if (connection) connection.release()
    }
};
//delete consultation Traetment
const deleteConsultationTreatment = async (req, res) => {
    const consultationTreatmentId = parseInt(req.params.id);
    const { consultation_id } = req.query;
    if (!consultation_id) {
        return error422("Consultation id is required.", res);
    }

    const isConsultationTreatmentQuery = "SELECT * FROM consultation_treatment_advice WHERE consultation_treatment_id = ? AND consultation_id = ?";
    const consultationTreatmentResult = await pool.query(isConsultationTreatmentQuery, [consultationTreatmentId, consultation_id]);
    if (consultationTreatmentResult[0].length == 0) {
        return res.status(404).json({
            status: 404,
            message: "Consultation Treatment Not Found.",
        });
    }
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        //delete consultation treatment
        const deleteConsultationTreatmentQuery = "DELETE FROM consultation_treatment_advice WHERE consultation_treatment_id = ?";
        const deleteConsultationTreatmentResult = await connection.query(deleteConsultationTreatmentQuery, [consultationTreatmentId]);

        await connection.commit();
        return res.json({
            status: 200,
            message: "Consulation Treatment has been deleted successfully.",
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        if (connection) connection.release()
    }
};
//delete consultation chief complaints
const deleteConsultationChiefComplaints = async (req, res) => {
    const consultationChiefComplaintsId = parseInt(req.params.id);
    const { consultation_id } = req.query;

    if (!consultation_id) {
        return error422("Consultation id is required.", res);
    }

    const isConsultationChiefComplaintsQuery = "SELECT * FROM consultation_chief_complaints WHERE consultation_chief_complaints_id = ? AND consultation_id = ?";
    const consultationChiefComplaintsResult = await pool.query(isConsultationChiefComplaintsQuery, [consultationChiefComplaintsId, consultation_id]);
    if (consultationChiefComplaintsResult[0].length == 0) {
        return res.status(404).json({
            status: 404,
            message: "Consultation Chief Complaints Not Found.",
        });
    }
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        //delete consultation chief complaints
        const deleteConsultationChiefComplaintsQuery = "DELETE FROM consultation_chief_complaints WHERE consultation_chief_complaints_id = ?";
        const deleteConsulationChiefComplaintsResult = await connection.query(deleteConsultationChiefComplaintsQuery, [consultationChiefComplaintsId]);

        await connection.commit();
        return res.json({
            status: 200,
            message: "Consulation Chief Complaints has been deleted successfully.",
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        if (connection) connection.release()
    }
};
//delete consultation Medicine
const deleteConsultationMedicine = async (req, res) => {
    const consultationMedicineId = parseInt(req.params.id);
    const { consultation_id } = req.query;

    if (!consultation_id) {
        return error422("Consultation id is required.", res);
    }

    const isConsultationMedicineQuery = "SELECT * FROM consultation_medicine WHERE consultation_medicine_id = ? AND consultation_id = ?";
    const consultationMedicineResult = await pool.query(isConsultationMedicineQuery, [consultationMedicineId, consultation_id]);
    if (consultationMedicineResult[0].length == 0) {
        return res.status(404).json({
            status: 404,
            message: "Consultation Medicine Not Found.",
        });
    }
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        //delete consultation medicine
        const deleteConsultationMedicineQuery = "DELETE FROM consultation_medicine WHERE consultation_medicine_id = ?";
        const deleteConsulationMedicineResult = await connection.query(deleteConsultationMedicineQuery, [consultationMedicineId]);

        await connection.commit();
        return res.json({
            status: 200,
            message: "Consulation Medicine has been deleted successfully.",
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        if (connection) connection.release()
    }
};
//delete consultation file upload
const deleteConsultationFileUpload = async (req, res) => {
    const consultationFileUploadId = parseInt(req.params.id);
    const { consultation_id } = req.query;

    if (!consultation_id) {
        return error422("Consultation id is required.", res);
    }

    const isConsultationFileUploadQuery = "SELECT * FROM consultation_file_upload WHERE consultation_file_upload_id = ? AND consultation_id = ?";
    const consultationFileUploadResult = await pool.query(isConsultationFileUploadQuery, [consultationFileUploadId, consultation_id]);
    if (consultationFileUploadResult[0].length == 0) {
        return res.status(404).json({
            status: 404,
            message: "Consultation File Upload Not Found.",
        });
    }
    // Attempt to obtain a database connection
    let connection = await getConnection();
    const previousImageName = consultationFileUploadResult[0][0].image_name;
    const previousImagePath = path.join(__dirname, "..", "..", "..", "images", "consultationfile", previousImageName);
    try {
        // Start a transaction
        await connection.beginTransaction();
        //delete consultation File upload
        const deleteConsultationFileUploadQuery = "DELETE FROM consultation_file_upload WHERE consultation_file_upload_id = ?";
        const deleteConsultationFileUploadResult = await connection.query(deleteConsultationFileUploadQuery, [consultationFileUploadId]);
        // If the update is successful, delete the old file
        if (fs.existsSync(previousImagePath)) {
            fs.unlinkSync(previousImagePath);
        }
        await connection.commit();
        return res.json({
            status: 200,
            message: "Consulation File Upload has been deleted successfully.",
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        if (connection) connection.release()
    }
};
// patient consultation  history list
const getConsulationsByMrno = async (req, res) => {
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
        return error422("Mrno is required.", res)
    }

    try {
        let getConsultationQuery = `SELECT c.*, p.registration_date, p.mrno_entity_series, p.patient_name, p.gender, p.age, p.mobile_no, p.city, p.address, p.entity_id, cc.chief_complaint FROM consultation c 
        LEFT JOIN patient_registration p 
        ON p.mrno = c.mrno
        LEFT JOIN chief_complaints cc 
        ON cc.chief_complaint_id = c.chief_complaints_id
        WHERE c.untitled_id = ${untitled_id} AND p.mrno = ${mrno} `;

        let countQuery = `SELECT COUNT(*) AS total FROM consultation c 
        LEFT JOIN patient_registration p 
        ON p.mrno = c.mrno
        LEFT JOIN chief_complaints cc 
        ON cc.chief_complaint_id = c.chief_complaints_id
        WHERE c.untitled_id = ${untitled_id} AND p.mrno = ${mrno} `;

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);
            const start = (page - 1) * perPage;
            getConsultationQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await pool.query(getConsultationQuery);
        const consultations = result[0];
        //consulation diagnosis details
        for (let index = 0; index < consultations.length; index++) {
            const element = consultations[index];
            let consultationDiagnosisQuery = `
                SELECT cd.*, d.diagnosis_name 
                FROM consultation_diagnosis cd 
                LEFT JOIN diagnosis d ON d.diagnosis_id = cd.diagnosis_id  
                WHERE cd.consultation_id = ${element.consultation_id}`;
            let consultationDiagnosisResult = await pool.query(consultationDiagnosisQuery);
            consultations[index]['consultationDiagnosisDetails'] = consultationDiagnosisResult[0];
        }
        //consultatin treatment details
        for (let index = 0; index < consultations.length; index++) {
            const element = consultations[index];
            let consultationTreatmentQuery = `
                SELECT ct.*, t.treatment_name
                FROM consultation_treatment_advice ct 
                LEFT JOIN treatment t ON t.treatment_id = ct.treatment_id  
                WHERE ct.consultation_id = ${element.consultation_id}`;
            let consultationTreatmentResult = await pool.query(consultationTreatmentQuery);
            consultations[index]['consultationTreatmentDetails'] = consultationTreatmentResult[0];
        }
        //consultatin chief complaints details
        for (let index = 0; index < consultations.length; index++) {
            const element = consultations[index];
            let consultationChiefComplaintsQuery = `
                SELECT cc.*, c.chief_complaint
                FROM consultation_chief_complaints cc
                LEFT JOIN chief_complaints c 
                ON c.chief_complaint_id = cc.chief_complaints_id  
                WHERE cc.consultation_id = ${element.consultation_id}`;
            let consultationChiefComplaintsResult = await pool.query(consultationChiefComplaintsQuery);
            consultations[index]['consultationChiefComplaintsDetails'] = consultationChiefComplaintsResult[0];
        }
        //consultatin medicine details
        for (let index = 0; index < consultations.length; index++) {
            const element = consultations[index];
            let consultationMedicineQuery = `
                SELECT cm.*, m.medicines_name, i.instruction, d.dosage_name
                FROM consultation_medicine cm
                LEFT JOIN medicines m 
                ON m.medicines_id = cm.medicines_id  
                LEFT JOIN instructions i 
                ON i.instructions_id = cm.instructions_id 
                LEFT JOIN dosages d
                ON d.dosage_id = cm.dosages_id 
                WHERE cm.consultation_id = ${element.consultation_id}`;
            let consultationMedicineResult = await pool.query(consultationMedicineQuery);
            consultations[index]['consultationMedicineDetails'] = consultationMedicineResult[0];
        }

        //consultatin file upload details
        for (let index = 0; index < consultations.length; index++) {
            const element = consultations[index];
            let consultationFileUploadQuery = `
                        SELECT cf.*
                        FROM consultation_file_upload cf
                        WHERE cf.consultation_id = ${element.consultation_id}`;
            let consultationFileUploadResult = await pool.query(consultationFileUploadQuery);
            consultations[index]['consultationFileUploadDetails'] = consultationFileUploadResult[0];
        }



        const data = {
            status: 200,
            message: "Consultations by MRNO  retrieved successfully",
            data: consultations
        }
        //Add pagination information if provided 
        if (page && perPage) {
            data.pagination = {
                per_page: perPage,
                total: total,
                current_page: page,
                last_page: Math.ceil(total / perPage)
            };
        }
        return res.json(data);
    } catch (error) {
        console.log(error);
        return error500(error, res);
    } finally {
        if (pool) pool.releaseConnection()
    }
}
//Appointment list 
const getAppointmentList = async (req, res) => {
    const { page, perPage, key, fromDate, toDate, appointment_date } = req.query;

    const untitled_id = req.companyData.untitled_id;

    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id = untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult = await pool.query(isCustomerQuery);
    const untitledId = customerResult[0][0].untitled_id;
    let appointmentQuery = `SELECT a.*, p.*, p.registration_date, p.mrno_entity_series, p.patient_name,p.gender,p.age, p.mobile_no, p.city, e.entity_name, e.abbrivation, s.source_of_patient_name, em.name AS employee_name , r.refered_by_name
    FROM consultation_appointment a 
    LEFT JOIN patient_registration p 
    ON p.mrno = a.mrno 
    LEFT JOIN entity e
    ON e.entity_id = p.entity_id
    LEFT JOIN source_of_patient s
    ON s.source_of_patient_id = p.source_of_patient_id
    LEFT JOIN employee em
    ON em.employee_id = p.employee_id
    LEFT JOIN refered_by r
    ON r.refered_by_id = p.refered_by_id
    WHERE  a.customer_id = ${customer_id} `;
    let countQuery = `SELECT COUNT(*) AS total FROM consultation_appointment a 
    LEFT JOIN patient_registration p 
    ON p.mrno = a.mrno 
    LEFT JOIN entity e
    ON e.entity_id = p.entity_id
    LEFT JOIN source_of_patient s
    ON s.source_of_patient_id = p.source_of_patient_id
    LEFT JOIN employee em
    ON em.employee_id = p.employee_id
    LEFT JOIN refered_by r
    ON r.refered_by_id = p.refered_by_id
    WHERE  a.customer_id = ${customer_id} `;

    // filter from date and to date
    if (fromDate && toDate) {
        appointmentQuery += ` AND a.appointment_date >= '${fromDate}' AND a.appointment_date <= '${toDate}'`;
        countQuery += ` AND a.appointment_date >= '${fromDate}' AND a.appointment_date <= '${toDate}'`;
    }
    // filter appointment date
    if (appointment_date) {
        appointmentQuery += ` AND a.appointment_date = '${appointment_date}'`;
        countQuery += ` AND a.appointment_date = '${appointment_date}'`;
    }
    appointmentQuery += ` ORDER BY a.cts DESC`;
    try {
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            appointmentQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const appointmentResult = await pool.query(appointmentQuery);
        const appointment = appointmentResult[0];

        const data = {
            status: 200,
            message: "Consultation Appointment retrieved successfully.",
            data: appointment,
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
        console.log(error);
        return error500(error, res);
    } finally {
        if (pool) pool.releaseConnection()
    }

}
//consultation diagnosis list for report 
const getConsultationDiagnosisList = async (req, res) => {
    const { page, perPage, key, fromDate, toDate, diagnosis_id, entity_id } = req.query;

    const untitled_id = req.companyData.untitled_id;

    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id = untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult = await pool.query(isCustomerQuery);
    const untitledId = customerResult[0][0].untitled_id;

    let consultationDiagnosisQuery = `SELECT cd.*, c.*, d.diagnosis_name,  p.registration_date, p.mrno_entity_series, p.patient_name,p.gender,p.age, p.mobile_no, p.city, e.abbrivation, e.entity_name, e.entity_id,  em.name AS employee_name FROM 
    consultation_diagnosis cd
    LEFT JOIN consultation c
    ON c.consultation_id = cd.consultation_id
    LEFT JOIN patient_registration p
    ON p.mrno = c.mrno
    LEFT JOIN diagnosis d
    ON d.diagnosis_id = cd.diagnosis_id
    LEFT JOIN employee em
    ON em.employee_id = p.employee_id
    LEFT JOIN entity e
    ON e.entity_id = p.entity_id
    WHERE c.customer_id = ${customer_id}`;
    let countQuery = `SELECT COUNT(*) AS total FROM 
    consultation_diagnosis cd
    LEFT JOIN consultation c
    ON c.consultation_id = cd.consultation_id
    LEFT JOIN patient_registration p
    ON p.mrno = c.mrno
    LEFT JOIN diagnosis d
    ON d.diagnosis_id = cd.diagnosis_id
    LEFT JOIN employee em
    ON em.employee_id = p.employee_id
    LEFT JOIN entity e
    ON e.entity_id = p.entity_id
    WHERE c.customer_id = ${customer_id}
     `;

     if (key) {
        const lowercaseKey = key.toLowerCase().trim().replace(/'/g, "\\'");;
        if (key === "activated") {
            consultationDiagnosisQuery += ` AND p.status = 1`;
            countQuery += ` AND p.status = 1`;
        } else if (key === "deactivated") {
            consultationDiagnosisQuery += ` AND p.status = 0`;
            countQuery += ` AND p.status = 0`;
        } else {
            consultationDiagnosisQuery += ` AND (p.mobile_no LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%')`;
            countQuery += ` AND (p.mobile_no LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%')`;
        }
    }
    // filter from date and to date
    if (fromDate && toDate) {
        // Convert fromDate and toDate to UTC format
        const fromUTCDate = new Date(fromDate).toISOString().split('T')[0];
        const toUTCDate = new Date(toDate).toISOString().split('T')[0];

        consultationDiagnosisQuery += ` AND DATE(c.cts) >= '${fromUTCDate}' AND DATE(c.cts) <= '${toUTCDate}'`;
        countQuery += ` AND DATE(c.cts) >= '${fromUTCDate}' AND DATE(c.cts) <= '${toUTCDate}'`;
    }
    // filter diagnosis 
    if (diagnosis_id) {
        consultationDiagnosisQuery += ` AND cd.diagnosis_id = ${diagnosis_id} `;
        countQuery += ` AND cd.diagnosis_id = ${diagnosis_id} `;
    }
    //fitler entity id
    if (entity_id) {
        consultationDiagnosisQuery += ` AND p.entity_id = '${entity_id}'`;
        countQuery += ` AND p.entity_id = '${entity_id}'`;
    }

    consultationDiagnosisQuery += ` ORDER BY c.cts DESC`;
    try {
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            consultationDiagnosisQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const consultationDiagnosisResult = await pool.query(consultationDiagnosisQuery);
        const consultationDiagnosis = consultationDiagnosisResult[0];

        const data = {
            status: 200,
            message: "Consultation Diagnosis retrieved successfully.",
            data: consultationDiagnosis,
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
        console.log(error);
        return error500(error, res);
    } finally {
        if (pool) pool.releaseConnection()
    }

}
//consultation treatment list for report 
const getConsultationTreatmentList = async (req, res) => {
    const { page, perPage, key, fromDate, toDate, treatment_id, entity_id } = req.query;
    const untitled_id = req.companyData.untitled_id;
    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id = untitledResult[0][0].customer_id;

    let consultationTreatmentQuery = `SELECT ct.*, c.*, t.treatment_name,  p.registration_date, p.mrno_entity_series, p.patient_name,p.gender,p.age, p.mobile_no, p.city, e.abbrivation, e.entity_name, e.entity_id,  em.name AS employee_name  FROM 
    consultation_treatment_advice ct
    LEFT JOIN consultation c
    ON c.consultation_id = ct.consultation_id
    LEFT JOIN patient_registration p
    ON p.mrno = c.mrno
    LEFT JOIN treatment t
    ON t.treatment_id = ct.treatment_id
    LEFT JOIN employee em
    ON em.employee_id = p.employee_id
    LEFT JOIN entity e
    ON e.entity_id = p.entity_id
    WHERE c.customer_id = ${customer_id}`;
    let countQuery = `SELECT COUNT(*) AS total FROM 
    consultation_treatment_advice ct
    LEFT JOIN consultation c
    ON c.consultation_id = ct.consultation_id
    LEFT JOIN patient_registration p
    ON p.mrno = c.mrno
    LEFT JOIN treatment t
    ON t.treatment_id = ct.treatment_id
    LEFT JOIN employee em
    ON em.employee_id = p.employee_id
    LEFT JOIN entity e
    ON e.entity_id = p.entity_id
    WHERE c.customer_id = ${customer_id}`;

    if (key) {
        const lowercaseKey = key.toLowerCase().trim().replace(/'/g, "\\'");;
        if (key === "activated") {
            consultationTreatmentQuery += ` AND p.status = 1`;
            countQuery += ` AND p.status = 1`;
        } else if (key === "deactivated") {
            consultationTreatmentQuery += ` AND p.status = 0`;
            countQuery += ` AND p.status = 0`;
        } else {
            consultationTreatmentQuery += ` AND (p.mobile_no LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%')`;
            countQuery += ` AND (p.mobile_no LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%')`;
        }
    } 
    // filter from date and to date
    if (fromDate && toDate) {
        // Convert fromDate and toDate to UTC format
        const fromUTCDate = new Date(fromDate).toISOString().split('T')[0];
        const toUTCDate = new Date(toDate).toISOString().split('T')[0];

        consultationTreatmentQuery += ` AND DATE(c.cts) >= '${fromUTCDate}' AND DATE(c.cts) <= '${toUTCDate}'`;
        countQuery += ` AND DATE(c.cts) >= '${fromUTCDate}' AND DATE(c.cts) <= '${toUTCDate}'`;
    }
    // filter treatment  
    if (treatment_id) {
        consultationTreatmentQuery += ` AND ct.treatment_id = ${treatment_id} `;
        countQuery += ` AND ct.treatment_id = ${treatment_id} `;
    }
    //fitler entity id
    if (entity_id) {
        consultationTreatmentQuery += ` AND p.entity_id = '${entity_id}'`;
        countQuery += ` AND p.entity_id = '${entity_id}'`;
    }
    consultationTreatmentQuery += ` ORDER BY c.cts DESC`;
    try {
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            consultationTreatmentQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const consultationTreatmentResult = await pool.query(consultationTreatmentQuery);
        const consultationTreatment = consultationTreatmentResult[0];

        const data = {
            status: 200,
            message: "Consultation Treatment retrieved successfully.",
            data: consultationTreatment,
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
        console.log(error);
        return error500(error, res);
    } finally {
        if(pool) pool.releaseConnection()
    }

}
module.exports = {
    createConsultation,
    getConsultationById,
    getConsultationList,
    updateConsultation,
    deleteConsultationDiagnosis,
    deleteConsultationTreatment,
    deleteConsultationMedicine,
    deleteConsultationFileUpload,
    deleteConsultationChiefComplaints,
    getConsulationsByMrno,
    getAppointmentList,
    getConsultationDiagnosisList,
    getConsultationTreatmentList

}