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
    const pluse = req.body.pluse ? req.body.pluse : '';
    const bp = req.body.bp ? req.body.bp : '';
    const past_history = req.body.past_history ? req.body.past_history : '';
    const chief_complaints_id = req.body.chief_complaints_id ? req.body.chief_complaints_id : '';
    const consultationDiagnosisDetails = req.body.consultationDiagnosisDetails ? req.body.consultationDiagnosisDetails : "";
    const consultationTreatmentDetails = req.body.consultationTreatmentDetails ? req.body.consultationTreatmentDetails : "";
    const consultationMedicineDetails = req.body.consultationMedicineDetails ? req.body.consultationMedicineDetails : "";
    const consultationFileUploadDetails = req.body.consultationFileUploadDetails ? req.body.consultationFileUploadDetails : "";
    const appointment_date = req.body.appointment_date ? req.body.appointment_date : "";
    const appointment_time = req.body.appointment_time ? req.body.appointment_time : "";
    const untitled_id = req.companyData.untitled_id;
    if (!mrno) {
        return error422("MRNO is required.", res);
    } else if (!past_history) {
        return error422("Past History is required", res);
    } else if (!chief_complaints_id) {
        return error422("Cheif complaints is required")
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

    //check if check mrno exists 
    const isExistMrnoQuery = "SELECT * FROM patient_registration WHERE mrno = ?";
    const mrnoResult = await pool.query(isExistMrnoQuery, [mrno]);
    if (mrnoResult[0].length == 0) {
        return error422("Mrno Not Found", res);
    }

    // if  consultation diagnosis details
    if (consultationDiagnosisDetails) {
        if (!consultationDiagnosisDetails || !Array.isArray(consultationDiagnosisDetails) || consultationDiagnosisDetails.length === 0) {
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
        if (!consultationTreatmentDetails || !Array.isArray(consultationTreatmentDetails) || consultationTreatmentDetails.length === 0) {
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

        //consultation  treatment details 
        if (consultationTreatmentDetails) {
            for (const row of consultationTreatmentDetails) {
                const treatment_id = row.treatment_id;
                const notes = row.notes;

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

        //consultation Medicice details 
        if (consultationMedicineDetails) {
            for (const row of consultationMedicineDetails) {
                const medicines_id = row.medicines_id;
                const dosages_id = row.dosages_id;
                const days = row.days;
                const instructions_id = row.instructions_id;

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

        //consultation file upload details  consultation_file_upload_id	image_name	consultation_id	notes consultation_file_upload	

        if (consultationFileUploadDetails) {
            for (const row of consultationFileUploadDetails) {
                const imageBase64 = row.imageBase64;
                const image_name = row.image_name;
                const notes = row.notes;
                let conFileName = "";
                let conFilePath = "";
                //  Generate short logo FileName and short logo FilePath if short provided
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
        //consultation appointment  
        if (appointment_date && appointment_time) {
            const insertConsultationAppointmentQuery = "INSERT INTO  consultation_appointment (mrno, appointment_date, appointment_time, untitled_id, customer_id ) VALUES (?, ?, ?, ?, ?)";
            const insertConsultationAppointmentValues = [mrno, appointment_date, appointment_time, untitled_id, customer_id];
            const insertConsultationAppointmentResult = await connection.query(insertConsultationAppointmentQuery, insertConsultationAppointmentValues);
        }


        // Commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: "Consultation added successfully"
        });
    } catch (error) {
        console.log(error);
        return error500(error, res);
    }
}

// get consultation list 
const getConsultationList = async (req, res) => {
    const { page, perPage, key } = req.query;
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
        let getConsultationQuery = `SELECT c.*, p.* FROM consultation c 
        LEFT JOIN patient_registration p 
        ON p.mrno = c.mrno
        WHERE c.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM consultation c 
        LEFT JOIN patient_registration p 
        ON p.mrno = c.mrno 
        WHERE c.untitled_id = ${untitled_id}`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim().replace(/'/g, "\\'");;
            if (key === "activated") {
                getConsultationQuery += ` AND p.status = 1`;
                countQuery += ` AND p.status = 1`;
            } else if (key === "deactivated") {
                getConsultationQuery += ` AND p.status = 0`;
                countQuery += ` AND p.status = 0`;
            } else {
                getConsultationQuery += ` AND (LOWER(p.mrno) LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%')`;
                countQuery += ` AND (LOWER(p.mrno) LIKE '%${lowercaseKey}%' OR LOWER(p.patient_name) LIKE '%${lowercaseKey}%')`;
            }
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
    }
}
// get consultation by  id
const getConsultationById = async (req, res) => {
    const consultationId = parseInt(req.params.id);
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
        let getConsultationQuery = `SELECT c.*, p.* FROM consultation c 
        LEFT JOIN patient_registration p 
        ON p.mrno = c.mrno
        WHERE c.consultation_id = ${consultationId}`;
        const result = await pool.query(getConsultationQuery);
        let consultations = result[0][0];

        //query consultation diagnosis 
        const consultationDiagnosisDetails = [];
        const consultationDiagnosisQuery = `SELECT * FROM  consultation_diagnosis WHERE consultation_id = ${consultationId}`;
        const consultationDiagnosisResult = await pool.query(consultationDiagnosisQuery);
        consultations['consultationDiagnosisDetails'] = consultationDiagnosisResult[0];

        //query consultation  treatment 
        const consultationTreatmentDetails = [];
        const consultationTreatmentQuery = `SELECT * FROM consultation_treatment_advice  WHERE consultation_id = ${consultationId}`;
        const consultationTreatmentResult = await pool.query(consultationTreatmentQuery);
        consultations['consultationTreatmentDetails'] = consultationTreatmentResult[0];


        // query consultation medicine 
        const consultationMedicineDetails = [];
        const consultationMedicineQuery = `SELECT * FROM consultation_medicine   WHERE consultation_id = ${consultationId}`;
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
const consultationFileUploadDetails = [];
const consultationFileUploadQuery = `SELECT * FROM consultation_file_upload WHERE consultation_id = ${consultationId}`;
const consultationFileUploadResult = await pool.query(consultationFileUploadQuery);
consultations['consultationFileUploadDetails'] = consultationFileUploadResult[0];

for (const fileUpload of consultations['consultationFileUploadDetails']) {
    try {
        // Read the image file from the filesystem
        const imagePath = path.join(__dirname, "..", "..", "..", "images", "consultationfile", fileUpload.image_name);
        const imageBuffer = fs.readFileSync(imagePath);
    
        // Convert the image buffer to base64
        const imageBase64 = imageBuffer.toString('base64');
        
        // Add the base64 image to the file upload object
        fileUpload.imageBase64 = imageBase64;
    } catch (error) {
        console.log(error);
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
    }
}
module.exports = {
    createConsultation,
    getConsultationById,
    getConsultationList
}