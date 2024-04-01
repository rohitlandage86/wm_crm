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

// add dosages...
const addDosages = async (req, res) => {
    const  dosage_name  = req.body.dosage_name  ? req.body.dosage_name.trim()  : '';
    const untitled_id  = req.companyData.untitled_id ;
 
    if (!dosage_name) {
        return error422("Dosage Name is required.", res);
    }  else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }

    //check dosages  already is exists or not
    const isExistDosagesQuery = `SELECT * FROM dosages WHERE LOWER(TRIM(dosage_name)) = ? AND untitled_id = ?`;
    const isExistDosagesResult = await pool.query(isExistDosagesQuery, [ dosage_name.toLowerCase(), untitled_id]);
    if (isExistDosagesResult[0].length > 0) {
        return error422(" Dosages Name is already exists.", res);
    } 

    try {
        //insert into dosages 
        const insertDosagesQuery = `INSERT INTO dosages (dosage_name, untitled_id ) VALUES (?, ? )`;
        const insertDosagesValues= [dosage_name, untitled_id ];
        const dosagesResult = await pool.query(insertDosagesQuery, insertDosagesValues);

        res.status(200).json({
            status: 200,
            message: "Dosage added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get Dosagess list...
const getDosagess = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;

    try {
        let getDosagesQuery = `SELECT d.*, u.untitled_id  FROM dosages d
        LEFT JOIN untitled u 
        ON d.untitled_id = u.untitled_id
        WHERE d.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM dosages d
        LEFT JOIN untitled u
        ON d.untitled_id = u.untitled_id
        WHERE d.untitled_id = ${untitled_id}`;
        
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getDosagesQuery += ` AND d.status = 1`;
                countQuery += ` AND d.status = 1`;
            } else if (key === "deactivated") {
                getDosagesQuery += ` AND d.status = 0`;
                countQuery += ` AND d.status = 0`;
            } else {
                getDosagesQuery += ` AND  LOWER(d.dosage_name) LIKE '%${lowercaseKey}%'`;
                countQuery += ` AND  LOWER(d.dosage_name) LIKE '%${lowercaseKey}%'`;
            }
        }
        getDosagesQuery += " ORDER BY d.cts DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getDosagesQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getDosagesQuery);
        const dosages = result[0];

        const data = {
            status: 200,
            message: "Dosages retrieved successfully",
            data: dosages,
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

// get dosages  by id...
const getDosages = async (req, res) => {
    const dosagesId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;

    try {
        const dosagesQuery = `SELECT d.*, u.untitled_id  FROM  dosages d
        LEFT JOIN untitled u 
        ON d.untitled_id = u.untitled_id
        WHERE d.dosage_id  = ? AND d.untitled_id = ?`;
        const dosagesResult = await pool.query(dosagesQuery, [dosagesId, untitled_id]);
        
        if (dosagesResult[0].length == 0) {
            return error422("Dosages Not Found.", res);
        }
        const dosages = dosagesResult[0][0];
        
        return res.status(200).json({
            status: 200,
            message: "Dosages Retrived Successfully",
            data: dosages
        });
    } catch (error) {
        return error500(error, res);
    }
}

//dosages  update...
const updateDosages = async (req, res) => {
    const dosagesId = parseInt(req.params.id);
    const dosage_name = req.body.dosage_name ? req.body.dosage_name : '';
    const untitled_id = req.companyData.untitled_id;

    if (!dosage_name) {
        return error422("Dosage name is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!dosagesId) {
        return error422("Dosages id is required.", res);
    }
    try {
        // Check if dosages exists
        const dosagesQuery = "SELECT * FROM dosages WHERE dosage_id  = ? AND untitled_id = ?";
        const dosagesResult = await pool.query(dosagesQuery, [dosagesId, untitled_id]);
        if (dosagesResult[0].length == 0) {
            return error422("Dosage Not Found.", res);
        }
        // Check if the provided dosages exists and is active 
        const existingDosagesQuery = "SELECT * FROM dosages WHERE LOWER(TRIM( dosage_name )) = ? AND dosage_id!=? AND untitled_id = ?";
        const existingDosagesResult = await pool.query(existingDosagesQuery, [dosage_name.trim().toLowerCase(), dosagesId, untitled_id]);

        if (existingDosagesResult[0].length > 0) {
            return error422("Dosages name already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the dosages record with new data
        const updateQuery = `
            UPDATE dosages
            SET dosage_name = ?, untitled_id = ?, mts=?
            WHERE dosage_id = ?
        `;

        await pool.query(updateQuery, [dosage_name, untitled_id, nowDate, dosagesId]);

        return res.status(200).json({
            status: 200,
            message: "Dosage updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }
}

//status change of dosages...
const onStatusChange = async (req, res) => {
    const dosagesId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id = req.companyData.untitled_id;

    try {
        // Check if the dosages  exists
        const dosagesQuery = "SELECT * FROM dosages WHERE dosage_id = ? AND untitled_id = ?";
        const dosagesResult = await pool.query(dosagesQuery, [dosagesId, untitled_id]);

        if (dosagesResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Dosage not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the dosages status
        const updateQuery = `
            UPDATE dosages
            SET status = ?
            WHERE dosage_id = ?
        `;

        await pool.query(updateQuery, [status, dosagesId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Dosages ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }
};
//get dosages active...
const getDosagesWma = async (req, res) => {
    const untitled_id  = req.companyData.untitled_id;

    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id =  untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult = await pool.query(isCustomerQuery);
    const untitledId =  customerResult[0][0].untitled_id;

    let dosagesQuery = `SELECT d.*  FROM dosages d LEFT JOIN untitled u ON u.untitled_id = d.untitled_id WHERE d.status = 1 AND u.category=2 AND d.untitled_id = ${untitledId} ORDER BY d.dosage_name`;
    try {
        const dosagesResult = await pool.query(dosagesQuery);
        const dosages = dosagesResult[0];

        return res.status(200).json({
            status: 200,
            message: "Dosages retrieved successfully.",
            data: dosages,
        });
    } catch (error) {
        return error500(error,res);
    }
    
}

module.exports = {
    addDosages,
    getDosagess,
    getDosages,
    updateDosages,
    onStatusChange,
    getDosagesWma
}