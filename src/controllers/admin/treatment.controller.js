
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
// add Treatment...
const addTreatment = async (req, res) => {
    const  treatment_name  = req.body.treatment_name  ? req.body.treatment_name.trim()  : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id  = req.companyData.untitled_id ;
 
    if (!treatment_name) {
        return error422("Treatment Name is required.", res);
    }  else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }
    //check Treatment already is exists or not
    const isExistTreatmentQuery = `SELECT * FROM treatment WHERE LOWER(TRIM(treatment_name))= ? AND untitled_id = ?`;
    const isExistTreatmentResult = await pool.query(isExistTreatmentQuery, [treatment_name.toLowerCase(), untitled_id ]);
    if (isExistTreatmentResult[0].length > 0) {
        return error422(" Treatment Name is already exists.", res);
    } 
    try {
        //insert into treatment master
        const insertTreatmentQuery = `INSERT INTO treatment (treatment_name, description, untitled_id ) VALUES (?, ?, ? )`;
        const insertTreatmentValues = [treatment_name, description, untitled_id ];
        const treatmentResult = await pool.query(insertTreatmentQuery, insertTreatmentValues);
        res.status(200).json({
            status: 200,
            message: "Treatment added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get treatment list...
const getTreatments = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;

    try {
        let getTreatmentQuery = `SELECT t.*, u.untitled_id  FROM treatment t
        LEFT JOIN untitled u 
        ON t.untitled_id = u.untitled_id
        WHERE t.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM treatment t
        LEFT JOIN untitled u
        ON t.untitled_id = u.untitled_id
        WHERE t.untitled_id = ${untitled_id}`;
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getTreatmentQuery += ` AND t.status = 1`;
                countQuery += ` AND t.status = 1`;
            } else if (key === "deactivated") {
                getTreatmentQuery += ` AND t.status = 0`;
                countQuery += ` AND t.status = 0`;
            } else {
                getTreatmentQuery += ` AND LOWER(t.treatment_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND  LOWER(t.treatment_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getTreatmentQuery += " ORDER BY t.cts DESC";
        let total = 0;
        // Apply pagination if both page and perPage are provided
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            // console.log(totalResult);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getTreatmentQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getTreatmentQuery);
        const treatments = result[0];
        const data = {
            status: 200,
            message: "Treatment retrieved successfully",
            data: treatments,
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
        // const result = await query(getUsersQuery)

        return res.status(200).json(data);
    } catch (error) {
        return error500(error, res);
    }

}

// get treatment  by id...
const getTreatment = async (req, res) => {
    const treatmentId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id ;

    try {
        const treatmentQuery = `SELECT t.*, u.untitled_id  FROM  treatment t
        LEFT JOIN untitled u 
        ON t.untitled_id = u.untitled_id
        WHERE t.treatment_id  = ? AND t.untitled_id = ?`;
        const treatmentResult = await pool.query(treatmentQuery, [treatmentId, untitled_id]);
        if (treatmentResult[0].length == 0) {
            return error422("Treatment Not Found.", res);
        }
        const treatment = treatmentResult[0][0];
        return res.status(200).json({
            status: 200,
            message: "Treatment Retrived Successfully",
            data: treatment
        });
    } catch (error) {
        return error500(error, res);
    }
}
//Treatment update...
const updateTreatment = async (req, res) => {
    const treatmentId = parseInt(req.params.id);
    const treatment_name = req.body.treatment_name ? req.body.treatment_name.trim() : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id = req.companyData.untitled_id;
    if (!treatment_name) {
        return error422("Treatment name is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!treatmentId) {
        return error422("Treatment id is required.", res);
    }
    try {
        // Check if treatment exists
        const treatmentQuery = "SELECT * FROM treatment WHERE treatment_id  = ? AND untitled_id = ?";
        const treatmentResult = await pool.query(treatmentQuery, [treatmentId, untitled_id]);
        if (treatmentResult[0].length == 0) {
            return error422("Treatment Not Found.", res);
        }
        // Check if the provided Treatment exists and is active 
        const existingTreatmentQuery = "SELECT * FROM treatment WHERE LOWER(TRIM( treatment_name )) = ? AND treatment_id!=? AND untitled_id = ?";
        const existingTreatmentResult = await pool.query(existingTreatmentQuery, [treatment_name.trim().toLowerCase(), treatmentId, untitled_id]);

        if (existingTreatmentResult[0].length > 0) {
            return error422("Treatment name already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the Service record with new data
        const updateQuery = `
            UPDATE treatment
            SET treatment_name = ?,  description = ?, untitled_id = ?, mts=?
            WHERE treatment_id = ?
        `;

        await pool.query(updateQuery, [treatment_name, description, untitled_id, nowDate, treatmentId]);

        return res.status(200).json({
            status: 200,
            message: "Treatment updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }
}

//status change of Treatment...
const onStatusChange = async (req, res) => {
    const treatmentId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id = req.companyData.untitled_id;
    try {
        // Check if the treatment  exists
        const treatmentQuery = "SELECT * FROM treatment WHERE treatment_id = ? AND untitled_id = ?";
        const treatmentResult = await pool.query(treatmentQuery, [treatmentId, untitled_id]);

        if (treatmentResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Treatment not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the treatment status
        const updateQuery = `
            UPDATE treatment
            SET status = ?
            WHERE treatment_id = ?
        `;

        await pool.query(updateQuery, [status, treatmentId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Treatment ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }
};
//get treatment active...
const getTreatmentWma = async (req, res) => {
    const untitled_id = req.companyData.untitled ;

    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id =  untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult = await pool.query(isCustomerQuery);
    const untitledId =  customerResult[0][0].untitled_id;

    let treatmentQuery = `SELECT t.*  FROM treatment t LEFT JOIN untitled u ON u.untitled_id = t.untitled_id WHERE t.status = 1 AND u.category=2 AND t.untitled_id = ${untitledId } ORDER BY t.cts DESC`;
    
    try {
        const treatmentResult = await pool.query(treatmentQuery);
        const treatments = treatmentResult[0];

        return res.status(200).json({
            status: 200,
            message: "Treatments retrieved successfully.",
            data: treatments,
        });
    } catch (error) {
        return error500(error,res);
    }
    
}

module.exports = {
    addTreatment,
    getTreatments,
    getTreatment,
    updateTreatment,
    onStatusChange,
    getTreatmentWma
}