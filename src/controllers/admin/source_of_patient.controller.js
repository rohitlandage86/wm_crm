const pool = require("../../../db");


//errror 422 handler...
error422 = (message, res) => {
    return res.status(422).json({
        status: 422,
        message: message
    });
}
//error 500 handler...
error500 = (error, res) => {
    return res.status(500).json({
        status: 500,
        message: "Internal Server Error",
        error: error
    });
}

// add Source of Patient...
const addSourceOfPatient = async (req, res) => {
    const   source_of_patient_name   = req.body. source_of_patient_name   ? req.body. source_of_patient_name .trim()  : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id  = req.companyData.untitled_id ;
 
    if (! source_of_patient_name ) {
        return error422(" Source Of Patient Name is required.", res);
    }  else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }

    //check  source of patient already is exists or not
    const isExistSourceOfPatientQuery = `SELECT * FROM  source_of_patient  WHERE LOWER(TRIM(source_of_patient_name))= ? AND untitled_id = ?`;
    const isExistSourceOfPatientResult = await pool.query(isExistSourceOfPatientQuery, [ source_of_patient_name.toLowerCase(), untitled_id]);
    if (isExistSourceOfPatientResult[0].length > 0) {
        return error422(" Source of Patient Name is already exists.", res);
    } 

    try {
        //insert into source of patient
        const insertSourceOfPatientQuery = `INSERT INTO source_of_patient (source_of_patient_name, description, untitled_id ) VALUES (?, ?, ? )`;
        const insertSourceOfPatientValues = [ source_of_patient_name, description, untitled_id ];
        const sourceofpatientResult = await pool.query(insertSourceOfPatientQuery, insertSourceOfPatientValues);

        res.status(200).json({
            status: 200,
            message: "Source Of Patient added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get source of patient list...
const getSourceOfPatients = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;

    try {
        let getSourceOfPatientQuery = `SELECT s.*, u.untitled_id  FROM source_of_patient s
        LEFT JOIN untitled u 
        ON s.untitled_id = u.untitled_id
        WHERE s.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM source_of_patient s
        LEFT JOIN untitled u
        ON s.untitled_id = u.untitled_id
        WHERE s.untitled_id = ${untitled_id}`;
        
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getSourceOfPatientQuery += ` AND s.status = 1`;
                countQuery += ` AND s.status = 1`;
            } else if (key === "deactivated") {
                getSourceOfPatientQuery += ` AND s.status = 0`;
                countQuery += ` AND s.status = 0`;
            } else {
                getSourceOfPatientQuery += ` AND  LOWER(s.source_of_patient_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(s.source_of_patient_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getSourceOfPatientQuery += " ORDER BY s.cts DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getSourceOfPatientQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getSourceOfPatientQuery);
        const sourceofpatient = result[0];

        const data = {
            status: 200,
            message: "Source Of Patient retrieved successfully",
            data: sourceofpatient,
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

// get source of patient  by id...
const getSourceOfPatient = async (req, res) => {
    const sourceofpatientId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;

    try {
        const sourceofpatientQuery = `SELECT s.*, u.untitled_id  FROM  source_of_patient s
        LEFT JOIN untitled u 
        ON s.untitled_id = u.untitled_id
        WHERE s.source_of_patient_id  = ? AND s.untitled_id = ?`;
        const sourceofpatientResult = await pool.query(sourceofpatientQuery, [sourceofpatientId, untitled_id]);
        
        if (sourceofpatientResult[0].length == 0) {
            return error422("Source Of PatientNot Found.", res);
        }
        const sourceofpatient = sourceofpatientResult[0][0];
        
        return res.status(200).json({
            status: 200,
            message: "Source Of patient Retrived Successfully",
            data: sourceofpatient
        });
    } catch (error) {
        return error500(error, res);
    }
}

//source of patient update...
const updateSourceOfPatient = async (req, res) => {
    const sourceofpatientId = parseInt(req.params.id);
    const source_of_patient_name = req.body.source_of_patient_name ? req.body.source_of_patient_name.trim() : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id = req.companyData.untitled_id;
    if (!source_of_patient_name) {
        return error422("Source Of Patient name is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!sourceofpatientId) {
        return error422("Source of Patient id is required.", res);
    }
    try {
        // Check if source of patient exists
        const sourceofpatientQuery = "SELECT * FROM source_of_patient WHERE source_of_patient_id  = ? AND untitled_id = ?";
        const sourceofpatientResult = await pool.query(sourceofpatientQuery, [sourceofpatientId, untitled_id]);
        if (sourceofpatientResult[0].length == 0) {
            return error422("Source Of Patient Not Found.", res);
        }
        // Check if the provided source of patient exists and is active 
        const existingSourceOfPatientQuery = "SELECT * FROM source_of_patient WHERE LOWER(TRIM( source_of_patient_name )) = ? AND source_of_patient_id!=? AND untitled_id = ?";
        const existingSourceOfPatientResult = await pool.query(existingSourceOfPatientQuery, [source_of_patient_name.trim().toLowerCase(), sourceofpatientId, untitled_id ]);

        if (existingSourceOfPatientResult[0].length > 0) {
            return error422("Source of Patient name already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the source of patientrecord with new data
        const updateQuery = `
            UPDATE source_of_patient
            SET source_of_patient_name = ?,  description = ?, untitled_id = ?, mts=?
            WHERE source_of_patient_id = ?
        `;

        await pool.query(updateQuery, [source_of_patient_name, description, untitled_id, nowDate, sourceofpatientId]);

        return res.status(200).json({
            status: 200,
            message: "Source Of Patient updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }
}

//status change of source of patient..
const onStatusChange = async (req, res) => {
    const sourceofpatientId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id = req.companyData.untitled_id;
    try {
        // Check if the source of patient  exists
        const sourceofpatientQuery = `SELECT * FROM source_of_patient WHERE source_of_patient_id = ? AND untitled_id = ? `;
        const sourceofpatientResult = await pool.query(sourceofpatientQuery, [sourceofpatientId, untitled_id ]);

        if (sourceofpatientResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Source Of Patient not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the source of patientstatus
        const updateQuery = `
            UPDATE source_of_patient
            SET status = ?
            WHERE source_of_patient_id = ?
        `;

        await pool.query(updateQuery, [status, sourceofpatientId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Source Of Patient ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }
};
//get source of patient active...
const getSourceOfPatientWma = async (req, res) => {
    const untitled_id = req.companyData.untitled_id; 

    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id =  untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult = await pool.query(isCustomerQuery);
    const untitledId =  customerResult[0][0].untitled_id;

    let sourceofpatientQuery = `SELECT s.*  FROM source_of_patient s LEFT JOIN untitled u ON u.untitled_id = s.untitled_id WHERE s.status = 1 AND u.category=2 AND s.untitled_id = ${untitledId} ORDER BY s.cts DESC`;
    try {
        const sourceofpatientResult = await pool.query(sourceofpatientQuery);
        const sourceofpatient = sourceofpatientResult[0];

        return res.status(200).json({
            status: 200,
            message: "Source of Patient retrieved successfully.",
            data: sourceofpatient,
        });
    } catch (error) {
        return error500(error,res);
    }
    
}

module.exports = {
    addSourceOfPatient,
    getSourceOfPatients,
    getSourceOfPatient,
    updateSourceOfPatient,
    onStatusChange,
    getSourceOfPatientWma
}