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

// add wm_cutomer_type...
const addCutomerType = async (req, res) => {
    const  customer_type  = req.body.customer_type  ? req.body.customer_type.trim()  : '';
    const  description  = req.body.description  ? req.body.description.trim()  : '';
    const untitled_id  = req.companyData.untitled_id ;

    if (!customer_type) {
        return error422("Customer Type is required.", res);
    }  else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }

    //check wm_cutomer_type  already is exists or not
    const isExistWMCutomerTypeQuery = `SELECT * FROM wm_cutomer_type WHERE LOWER(TRIM(customer_type))= ? AND untitled_id = ?`;
    const isExistWMCutomerTypeResult = await pool.query(isExistWMCutomerTypeQuery, [ customer_type.toLowerCase(), untitled_id]);
    if (isExistWMCutomerTypeResult[0].length > 0) {
        return error422(" Customer Type is already exists.", res);
    } 

    try {
        //insert into wm_cutomer_type 
        const insertWMCutomerTypeQuery = `INSERT INTO wm_cutomer_type (customer_type, description, untitled_id ) VALUES (?, ?, ?)`;
        const insertWMCutomerTypeValues= [customer_type, description, untitled_id ];
        const wm_cutomer_type = await pool.query(insertWMCutomerTypeQuery, insertWMCutomerTypeValues);

        res.status(200).json({
            status: 200,
            message: "Cutomer Type added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get wm_cutomer_type list...
const getCutomerTypes = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;
    
    try {
        let getWMCutomerTypeQuery = `SELECT ct.*, u.untitled_id  FROM wm_cutomer_type ct
        LEFT JOIN untitled u 
        ON ct.untitled_id = u.untitled_id
        WHERE ct.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM wm_cutomer_type ct
        LEFT JOIN untitled u
        ON ct.untitled_id = u.untitled_id
        WHERE ct.untitled_id = ${untitled_id}`;
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getWMCutomerTypeQuery += ` AND ct.status = 1`;
                countQuery += ` AND ct.status = 1`;
            } else if (key === "deactivated") {
                getWMCutomerTypeQuery += ` AND ct.status = 0`;
                countQuery += ` AND ct.status = 0`;
            } else {
                getWMCutomerTypeQuery += ` AND  LOWER(ct.customer_type) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(ct.customer_type) LIKE '%${lowercaseKey}%' `;
            }
        }
        getWMCutomerTypeQuery += " ORDER BY ct.cts DESC";
        let total = 0;
        // Apply pagination if both page and perPage are provided
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);
            const start = (page - 1) * perPage;
            getWMCutomerTypeQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getWMCutomerTypeQuery);
        const wm_cutomer_type = result[0];
        const data = {
            status: 200,
            message: "Cutomer Type retrieved successfully",
            data: wm_cutomer_type,
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

// get wm_cutomer_type  by id...
const getCutomerType = async (req, res) => {
    const cutomertypeId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;

    try {
        const wmcutomertypeQuery = `SELECT ct.*, u.untitled_id  FROM  wm_cutomer_type ct
        LEFT JOIN untitled u 
        ON ct.untitled_id = u.untitled_id
        WHERE ct.customer_type_id  = ? AND ct.untitled_id = ?`;
        const wmcutomertypeResult = await pool.query(wmcutomertypeQuery, [cutomertypeId, untitled_id ]);
        if (wmcutomertypeResult[0].length == 0) {
            return error422("Cutomer Type Not Found.", res);
        }
        const wm_cutomer_type = wmcutomertypeResult[0][0];
        return res.status(200).json({
            status: 200,
            message: "Cutomer Type Retrived Successfully",
            data: wm_cutomer_type
        });
    } catch (error) {
        return error500(error, res);
    }
}
//wm cutomer type  update...
const updateCutomerType = async (req, res) => {
    const customertypeId = parseInt(req.params.id);
    const customer_type = req.body.customer_type ? req.body.customer_type.trim() : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id = req.companyData.untitled_id;

    if (!customer_type) {
        return error422("Customer Type is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!customertypeId) {
        return error422("Customer Type id   is required.", res);
    }
    try {
        // Check if wm cutomer type exists
        const customertypeQuery = "SELECT * FROM wm_cutomer_type WHERE customer_type_id  = ? AND untitled_id = ? ";
        const customertypeResult = await pool.query(customertypeQuery, [customertypeId, untitled_id ]);
        if (customertypeResult[0].length == 0) {
            return error422("Customer Type Not Found.", res);
        }
        // Check if the provided cutomer type exists and is active 
        const existingCustomerTypeQuery = "SELECT * FROM wm_cutomer_type WHERE LOWER(TRIM( customer_type )) = ? AND customer_type_id!=? AND untitled_id = ?";
        const existingCustomerTypeResult = await pool.query(existingCustomerTypeQuery, [customer_type.trim().toLowerCase(), customertypeId, untitled_id]);

        if (existingCustomerTypeResult[0].length > 0) {
            return error422("Customer Type already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the wm cutomer type record with new data
        const updateQuery = `
            UPDATE wm_cutomer_type
            SET customer_type = ?,  description = ?, untitled_id = ?, mts=?
            WHERE customer_type_id = ?
        `;

        await pool.query(updateQuery, [customer_type, description, untitled_id, nowDate, customertypeId]);

        return res.status(200).json({
            status: 200,
            message: "Customer Type updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }
}

//status change of Customer Type ...
const onStatusChange = async (req, res) => {
    const customerTypeId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id = req.body.untitled_id ;
    try {
        // Check if the Customer Type  exists
        const customertypeQuery = "SELECT * FROM wm_cutomer_type WHERE customer_type_id = ? AND untitled_id = ?";
        const customertypeResult = await pool.query(customertypeQuery, [customerTypeId, untitled_id]);

        if (customertypeResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Customer Type not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the wm_cutomer_type status
        const updateQuery = `
            UPDATE wm_cutomer_type
            SET status = ?
            WHERE customer_type_id = ?
        `;

        await pool.query(updateQuery, [status, customertypeId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Customer Type ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }
};
//get Customer Type active...
const getCustomerTypeWma = async (req, res) => {
    const untitled_id = req.companyData.untitled_id;
    let customertypeQuery = `SELECT ct.*  FROM wm_cutomer_type ct LEFT JOIN untitled u ON u.untitled_id = ct.untitled_id WHERE  u.category=1 AND  ct.untitled_id = ${untitled_id} ORDER BY ct.customer_type `;
    try {
        const customertypeResult = await pool.query(customertypeQuery);
        const customer_type = customertypeResult[0];

        return res.status(200).json({
            status: 200,
            message: "Customer Type retrieved successfully.",
            data: customer_type,
        });
    } catch (error) {
        return error500(error,res);
    }
}
module.exports = {
    addCutomerType,
    getCutomerTypes,
    getCutomerType,
    updateCutomerType,
    onStatusChange,
    getCustomerTypeWma
}