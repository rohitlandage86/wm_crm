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

// add designation...
const addDesignation = async (req, res) => {
    const  designation_name  = req.body.designation_name  ? req.body.designation_name.trim()  : '';
    const untitled_id  = req.companyData.untitled_id ;

    if (!designation_name) {
        return error422("Designation Name is required.", res);
    }  else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }

    //check designation  already is exists or not
    const isExistDesignationQuery = `SELECT * FROM designation WHERE LOWER(TRIM(designation_name))= ? AND untitled_id = ?`;
    const isExistDesignationResult = await pool.query(isExistDesignationQuery, [ designation_name.toLowerCase(), untitled_id]);
    if (isExistDesignationResult[0].length > 0) {
        return error422(" Designation Name is already exists.", res);
    } 

    try {
        //insert into designation 
        const insertDesignationQuery = `INSERT INTO designation (designation_name, untitled_id ) VALUES (?, ? )`;
        const insertDesignationValues= [designation_name, untitled_id ];
        const designationResult = await pool.query(insertDesignationQuery, insertDesignationValues);

        res.status(200).json({
            status: 200,
            message: "Designation added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get designation list...
const getDesignations = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;

    try {
        let getDesignationQuery = `SELECT d.*, u.untitled_id  FROM designation d
        LEFT JOIN untitled u 
        ON d.untitled_id = u.untitled_id
        WHERE d.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM designation d
        LEFT JOIN untitled u
        ON d.untitled_id = u.untitled_id
        WHERE d.untitled_id = ${untitled_id}`;
        
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getDesignationQuery += ` AND d.status = 1`;
                countQuery += ` AND d.status = 1`;
            } else if (key === "deactivated") {
                getDesignationQuery += ` AND d.status = 0`;
                countQuery += ` AND d.status = 0`;
            } else {
                getDesignationQuery += ` AND  LOWER(d.designation_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND  LOWER(d.designation_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getDesignationQuery += " ORDER BY d.cts DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getDesignationQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getDesignationQuery);
        const designation = result[0];

        const data = {
            status: 200,
            message: "Designation retrieved successfully",
            data: designation,
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

// get designation  by id...
const getDesignation = async (req, res) => {
    const designationId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;

    try {
        const designationQuery = `SELECT d.*  FROM  designation d
        LEFT JOIN untitled u 
        ON d.untitled_id = u.untitled_id
        WHERE d.designation_id  = ? AND d.untitled_id = ?`;
        const designationResult = await pool.query(designationQuery, [designationId, untitled_id]);
        
        if (designationResult[0].length == 0) {
            return error422("Designation Not Found.", res);
        }
        const designation = designationResult[0][0];
        
        return res.status(200).json({
            status: 200,
            message: "Designation Retrived Successfully",
            data: designation
        });
    } catch (error) {
        return error500(error, res);
    }
}

//designation  update...
const updateDesignation = async (req, res) => {
    const designationId = parseInt(req.params.id);
    const designation_name = req.body.designation_name ? req.body.designation_name : '';
    const untitled_id = req.companyData.untitled_id;

    if (!designation_name) {
        return error422("Designation name is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!designationId) {
        return error422("Designation id is required.", res);
    }
    try {
        // Check if designation exists
        const designationQuery = "SELECT * FROM designation WHERE designation_id  = ? AND untitled_id = ?";
        const designationResult = await pool.query(designationQuery, [designationId, untitled_id]);
        if (designationResult[0].length == 0) {
            return error422("Designation Not Found.", res);
        }
        // Check if the provided designation exists and is active 
        const existingDesignationQuery = "SELECT * FROM designation WHERE LOWER(TRIM( designation_name )) = ? AND designation_id!=? AND untitled_id = ?";
        const existingDesignationResult = await pool.query(existingDesignationQuery, [designation_name.trim().toLowerCase(), designationId, untitled_id]);

        if (existingDesignationResult[0].length > 0) {
            return error422("Designation Name already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the dosages record with new data
        const updateQuery = `
            UPDATE designation
            SET designation_name = ?, untitled_id = ?, mts=?
            WHERE designation_id = ?
        `;

        await pool.query(updateQuery, [designation_name, untitled_id, nowDate, designationId]);

        return res.status(200).json({
            status: 200,
            message: "Designation updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }
}

//status change of designation...
const onStatusChange = async (req, res) => {
    const designationId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id = req.companyData.untitled_id;

    try {
        // Check if the designation  exists
        const designationQuery = "SELECT * FROM designation WHERE designation_id = ? AND untitled_id = ?";
        const designationResult = await pool.query(designationQuery, [designationId, untitled_id]);

        if (designationResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Designation not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the designation status
        const updateQuery = `
            UPDATE designation
            SET status = ?
            WHERE designation_id = ?
        `;

        await pool.query(updateQuery, [status, designationId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Designation ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }
};
//get designation active...
const getDesignationWma = async (req, res) => {
    const untitled_id = req.companyData.untitled_id;

    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id =  untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult = await pool.query(isCustomerQuery);
    const untitledId =  customerResult[0][0].untitled_id;

    let designationQuery = `SELECT d.*  FROM designation d LEFT JOIN untitled u ON u.untitled_id = d.untitled_id WHERE d.status = 1 AND u.category=2 AND d.untitled_id = ${untitledId} ORDER BY d.designation_name`;
    try {
        const designationResult = await pool.query(designationQuery);
        const designation = designationResult[0];

        return res.status(200).json({
            status: 200,
            message: "Designation retrieved successfully.",
            data: designation,
        });
    } catch (error) {
        return error500(error,res);
    }
    
}

module.exports = {
    addDesignation,
    getDesignations,
    getDesignation,
    updateDesignation,
    onStatusChange,
    getDesignationWma
}