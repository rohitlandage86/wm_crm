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

// add refered_by...
const addReferedBy = async (req, res) => {
    const  refered_by_name  = req.body.refered_by_name  ? req.body.refered_by_name.trim()  : '';
    const untitled_id  = req.companyData.untitled_id ;
 
    if (!refered_by_name) {
        return error422("Refered By Name is required.", res);
    }  else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }

    //check refered_by  already is exists or not
    const isExistReferedByQuery = `SELECT * FROM refered_by WHERE LOWER(TRIM(refered_by_name))= ? AND untitled_id = ?`;
    const isExistReferedByResult = await pool.query(isExistReferedByQuery, [ refered_by_name.toLowerCase(), untitled_id]);
    if (isExistReferedByResult[0].length > 0) {
        return error422(" Refered By Name is already exists.", res);
    } 

    try {
        //insert into refered_by 
        const insertReferedByQuery = `INSERT INTO refered_by (refered_by_name, untitled_id ) VALUES (?, ? )`;
        const insertReferedByValues= [refered_by_name, untitled_id ];
        const refered_byResult = await pool.query(insertReferedByQuery, insertReferedByValues);

        res.status(200).json({
            status: 200,
            message: "Refered By added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get refered_by list...
const getReferedBys = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;

    try {
        let getReferedByQuery = `SELECT r.*, u.untitled_id  FROM refered_by r
        LEFT JOIN untitled u 
        ON r.untitled_id = u.untitled_id
        WHERE r.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM refered_by r
        LEFT JOIN untitled u
        ON r.untitled_id = u.untitled_id
        WHERE r.untitled_id = ${untitled_id}`;
        
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getReferedByQuery += ` AND r.status = 1`;
                countQuery += ` AND r.status = 1`;
            } else if (key === "deactivated") {
                getReferedByQuery += ` AND r.status = 0`;
                countQuery += ` AND r.status = 0`;
            } else {
                getReferedByQuery += ` AND  LOWER(r.refered_by_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(r.refered_by_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getReferedByQuery += " ORDER BY r.cts DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getReferedByQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getReferedByQuery);
        const refered_by = result[0];

        const data = {
            status: 200,
            message: "Refered By retrieved successfully",
            data: refered_by,
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

// get refered_by  by id...
const getReferedBy = async (req, res) => {
    const refered_byId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;

    try {
        const referedbyQuery = `SELECT r.*, u.untitled_id  FROM  refered_by r
        LEFT JOIN untitled u 
        ON r.untitled_id = u.untitled_id
        WHERE r.refered_by_id  = ? AND r.untitled_id = ?`;
        const referedbyResult = await pool.query(referedbyQuery, [refered_byId, untitled_id]);
        
        if (referedbyResult[0].length == 0) {
            return error422("Refered By Not Found.", res);
        }
        const refered_by = referedbyResult[0][0];
        
        return res.status(200).json({
            status: 200,
            message: "Refered By Retrived Successfully",
            data: refered_by
        });
    } catch (error) {
        return error500(error, res);
    }
}

//refered_by  update...
const updateReferedBy = async (req, res) => {
    const refered_byId = parseInt(req.params.id);
    const refered_by_name = req.body.refered_by_name ? req.body.refered_by_name.trim() : '';
    const untitled_id = req.companyData.untitled_id;

    if (!refered_by_name) {
        return error422("Refered By name is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!refered_byId) {
        return error422("Refered By id is required.", res);
    }
    try {
        // Check if refered_by exists
        const referedbyQuery = "SELECT * FROM refered_by WHERE refered_by_id  = ? AND untitled_id = ?";
        const referedbyResult = await pool.query(referedbyQuery, [refered_byId, untitled_id]);
        if (referedbyResult[0].length == 0) {
            return error422("Refered By Not Found.", res);
        }
        // Check if the provided refered_by exists and is active 
        const existingReferedByQuery = "SELECT * FROM refered_by WHERE LOWER(TRIM( refered_by_name )) = ? AND refered_by_id!=? AND untitled_id = ? ";
        const existingReferedByResult = await pool.query(existingReferedByQuery, [refered_by_name.toLowerCase(), refered_byId, untitled_id]);

        if (existingReferedByResult[0].length > 0) {
            return error422("Refered By Name already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the refered_by record with new data
        const updateQuery = `
            UPDATE refered_by
            SET refered_by_name = ?, untitled_id = ?, mts=?
            WHERE refered_by_id = ?
        `;

        await pool.query(updateQuery, [refered_by_name, untitled_id, nowDate, refered_byId]);

        return res.status(200).json({
            status: 200,
            message: "Refered By updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }
}

//status change of refered_by...
const onStatusChange = async (req, res) => {
    const refered_byId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id = req.companyData.untitled_id;
    try {
        // Check if the refered_by  exists
        const referedbyQuery = "SELECT * FROM refered_by WHERE refered_by_id = ? AND untitled_id = ?";
        const referedbyResult = await pool.query(referedbyQuery, [refered_byId, untitled_id ]);

        if (referedbyResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Refered By not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the refered_by status
        const updateQuery = `
            UPDATE refered_by
            SET status = ?
            WHERE refered_by_id = ?
        `;

        await pool.query(updateQuery, [status, refered_byId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Refered By ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }
};
//get refered_by active...
const getReferedByWma = async (req, res) => {
    const untitled_id = req.companyData.untitled_id ;
    let ReferedByQuery = `SELECT r.*  FROM refered_by r LEFT JOIN untitled u ON u.untitled_id = r.untitled_id WHERE r.status = 1 AND u.category=2 AND r.untitled_id = ${untitled_id} ORDER BY r.cts DESC`;
    try {
        const ReferedByResult = await pool.query(ReferedByQuery);
        const refered_by = ReferedByResult[0];

        return res.status(200).json({
            status: 200,
            message: "Refered By retrieved successfully.",
            data: refered_by,
        });
    } catch (error) {
        return error500(error,res);
    }
    
}

module.exports = {
    addReferedBy,
    getReferedBys,
    getReferedBy,
    updateReferedBy,
    onStatusChange,
    getReferedByWma
}