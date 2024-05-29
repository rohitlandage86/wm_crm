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
    res.status(500).json({
        status: 500,
        message: "Internal Server Error",
        error: error
    });
    res.end();
}

// add diagnosis...
const addDiagnosis = async (req, res) => {
    const diagnosis_name = req.body.diagnosis_name ? req.body.diagnosis_name.trim() : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id = req.companyData.untitled_id;

    //  add a chief complaint for insert admin untitled id
    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id = untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult = await pool.query(isCustomerQuery);
    const untitledId = customerResult[0][0].untitled_id;

    if (!diagnosis_name) {
        return error422(" Diagnosis Name is required.", res);
    } else if (!untitledId) {
        return error422("Untitled ID is required.", res);
    }

    //check  Diagnosis already is exists or not
    const isExistDiagnosisQuery = `SELECT * FROM  diagnosis  WHERE LOWER(TRIM(diagnosis_name))= ? AND untitled_id = ?`;
    const isExistDiagnosisResult = await pool.query(isExistDiagnosisQuery, [diagnosis_name.toLowerCase(), untitledId]);
    if (isExistDiagnosisResult[0].length > 0) {
        return error422(" Diagnosis Name is already exists.", res);
    }

    try {
        //insert into Diagnosis
        const insertDiagnosisQuery = `INSERT INTO diagnosis (diagnosis_name, description, untitled_id ) VALUES (?, ?, ? )`;
        const insertDiagnosisValues = [diagnosis_name, description, untitledId];
        const diagnosisResult = await pool.query(insertDiagnosisQuery, insertDiagnosisValues);

        res.status(200).json({
            status: 200,
            message: "Diagnosis added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get diagnosis list...
const getDiagnosiss = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;

    try {
        let getDiagnosisQuery = `SELECT d.*, u.untitled_id  FROM diagnosis d
        LEFT JOIN untitled u 
        ON d.untitled_id = u.untitled_id
        WHERE d.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM diagnosis d
        LEFT JOIN untitled u
        ON d.untitled_id = u.untitled_id
        WHERE d.untitled_id = ${untitled_id}`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getDiagnosisQuery += ` AND d.status = 1`;
                countQuery += ` AND d.status = 1`;
            } else if (key === "deactivated") {
                getDiagnosisQuery += ` AND d.status = 0`;
                countQuery += ` AND d.status = 0`;
            } else {
                getDiagnosisQuery += ` AND LOWER(d.diagnosis_name) LIKE '%${lowercaseKey}%'`;
                countQuery += ` AND  LOWER(d.diagnosis_name) LIKE '%${lowercaseKey}%'`;
            }
        }
        getDiagnosisQuery += " ORDER BY d.cts DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getDiagnosisQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getDiagnosisQuery);
        const diagnosis = result[0];

        const data = {
            status: 200,
            message: "Diagnosis retrieved successfully",
            data: diagnosis,
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

// get Diagnosis  by id...
const getDiagnosis = async (req, res) => {
    const diagnosisId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;

    try {
        const diagnosisQuery = `SELECT d.*, u.untitled_id  FROM  diagnosis d
        LEFT JOIN untitled u 
        ON d.untitled_id = u.untitled_id
        WHERE d.diagnosis_id  = ? AND d.untitled_id = ?`;
        const diagnosisResult = await pool.query(diagnosisQuery, [diagnosisId, untitled_id
        ]);

        if (diagnosisResult[0].length == 0) {
            return error422("Diagnosis Not Found.", res);
        }
        const diagnosis = diagnosisResult[0][0];

        return res.status(200).json({
            status: 200,
            message: "Diagnosis Retrived Successfully",
            data: diagnosis
        });
    } catch (error) {
        return error500(error, res);
    }
}

//diagnosis update...
const updateDiagnosis = async (req, res) => {
    const diagnosisId = parseInt(req.params.id);
    const diagnosis_name = req.body.diagnosis_name ? req.body.diagnosis_name.trim() : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id = req.companyData.untitled_id;

    if (!diagnosis_name) {
        return error422("Diagnosis name is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!diagnosisId) {
        return error422("Diagnosis id is required.", res);
    }
    try {
        // Check if diagnosis exists
        const diagnosisQuery = "SELECT * FROM diagnosis WHERE diagnosis_id  = ? AND untitled_id = ?";
        const diagnosisResult = await pool.query(diagnosisQuery, [diagnosisId, untitled_id]);
        if (diagnosisResult[0].length == 0) {
            return error422("Diagnosis Not Found.", res);
        }
        // Check if the provided diagnosis exists and is active 
        const existingDiagnosisQuery = "SELECT * FROM diagnosis WHERE LOWER(TRIM( diagnosis_name )) = ? AND diagnosis_id!=? AND untitled_id = ?";
        const existingDiagnosisResult = await pool.query(existingDiagnosisQuery, [diagnosis_name.toLowerCase(), diagnosisId, untitled_id]);

        if (existingDiagnosisResult[0].length > 0) {
            return error422("Diagnosis name already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the diagnosis record with new data
        const updateQuery = `
            UPDATE diagnosis
            SET diagnosis_name = ?,  description = ?, untitled_id = ?, mts=?
            WHERE diagnosis_id = ?
        `;

        await pool.query(updateQuery, [diagnosis_name, description, untitled_id, nowDate, diagnosisId]);

        return res.status(200).json({
            status: 200,
            message: "Diagnosis updated successfully.",
        });
    } catch (error) {
        return error500(error, res);
    }
}

//status change of diagnosis..
const onStatusChange = async (req, res) => {
    const diagnosisId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id = req.companyData.untitled_id;
    try {
        // Check if the diagnosis  exists
        const diagnosisQuery = "SELECT * FROM diagnosis WHERE diagnosis_id = ? AND untitled_id = ?";
        const diagnosisResult = await pool.query(diagnosisQuery, [diagnosisId, untitled_id]);

        if (diagnosisResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Diagnosis not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the diagnosis status
        const updateQuery = `
            UPDATE diagnosis
            SET status = ?
            WHERE diagnosis_id = ?
        `;

        await pool.query(updateQuery, [status, diagnosisId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Diagnosis ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error, res);
    }
};
//get diagnosis active...
const getDiagnosisWma = async (req, res, next) => {
    const untitled_id = req.companyData.untitled_id;

    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id = untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult = await pool.query(isCustomerQuery);
    const untitledId = customerResult[0][0].untitled_id;

    let diagnosisQuery = `SELECT d.*  FROM diagnosis d LEFT JOIN untitled u ON u.untitled_id = d.untitled_id WHERE d.status = 1 AND u.category=2 AND d.untitled_id = ${untitledId} ORDER BY d.diagnosis_name`;
    try {
        const diagnosisResult = await pool.query(diagnosisQuery);
        const diagnosis = diagnosisResult[0];

        res.status(200).json({
            status: 200,
            message: "Diagnosis retrieved successfully.",
            data: diagnosis,
        });
        res.end();
    } catch (error) {
        error500(error, res);
    }

}

module.exports = {
    addDiagnosis,
    getDiagnosiss,
    getDiagnosis,
    updateDiagnosis,
    onStatusChange,
    getDiagnosisWma
}