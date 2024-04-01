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

// add service_type...
const addServiceType = async (req, res) => {
    const  service_type_name  = req.body.service_type_name  ? req.body.service_type_name.trim()  : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id  = req.companyData.untitled_id ;
 
    if (!service_type_name) {
        return error422("Service Type Name is required.", res);
    }  else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }

    //check service type already is exists or not
    const isExistServiceTypeQuery = `SELECT * FROM service_type WHERE LOWER(TRIM(service_type_name))= ? AND untitled_id = ?`;
    const isExistServiceTypeResult = await pool.query(isExistServiceTypeQuery, [ service_type_name.toLowerCase(), untitled_id ]);
    if (isExistServiceTypeResult[0].length > 0) {
        return error422(" Service Type Name is already exists.", res);
    } 

    try {
        //insert into service_type
        const insertServiceTypeQuery = `INSERT INTO service_type (service_type_name, description, untitled_id ) VALUES (?, ?, ? )`;
        const insertServiceTypeValues = [ service_type_name, description, untitled_id ];
        const servicetypeResult = await pool.query(insertServiceTypeQuery, insertServiceTypeValues);

        res.status(200).json({
            status: 200,
            message: "Service Type added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get service_type list...
const getServiceTypes = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;

    try {
        let getServiceTypeQuery = `SELECT s.*, u.untitled_id  FROM service_type s
        LEFT JOIN untitled u 
        ON s.untitled_id = u.untitled_id
        WHERE s.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM service_type s
        LEFT JOIN untitled u
        ON s.untitled_id = u.untitled_id
        WHERE s.untitled_id = ${untitled_id}`;
        
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getServiceTypeQuery += ` AND s.status = 1`;
                countQuery += ` AND s.status = 1`;
            } else if (key === "deactivated") {
                getServiceTypeQuery += ` AND s.status = 0`;
                countQuery += ` AND s.status = 0`;
            } else {
                getServiceTypeQuery += ` AND LOWER(s.service_type_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(s.service_type_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getServiceTypeQuery += " ORDER BY s.cts DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getServiceTypeQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getServiceTypeQuery);
        const servicetype = result[0];

        const data = {
            status: 200,
            message: "Service Type retrieved successfully",
            data: servicetype,
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

// get service_type  by id...
const getServiceType = async (req, res) => {
    const servicetypeId = parseInt(req.params.id);
    const untitled_id  = req.companyData.untitled_id ;

    try {
        const servicetypeQuery = `SELECT s.*, u.untitled_id  FROM  service_type s
        LEFT JOIN untitled u 
        ON s.untitled_id = u.untitled_id
        WHERE s.service_type_id  = ? AND s.untitled_id = ?`;
        const servicetypeResult = await pool.query(servicetypeQuery, [servicetypeId, untitled_id]);
        
        if (servicetypeResult[0].length == 0) {
            return error422("Service Type Not Found.", res);
        }
        const servicetype = servicetypeResult[0][0];
        
        return res.status(200).json({
            status: 200,
            message: "Service Type Retrived Successfully",
            data: servicetype
        });
    } catch (error) {
        return error500(error, res);
    }
}

//Service type update...
const updateServiceType = async (req, res) => {
    const servicetypeId = parseInt(req.params.id);
    const service_type_name = req.body.service_type_name ? req.body.service_type_name.trim() : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id = req.companyData.untitled_id;

    if (!service_type_name) {
        return error422("Service Type name is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!servicetypeId) {
        return error422("Service Type id is required.", res);
    }
    try {
        // Check if service_type exists
        const servicetypeQuery = "SELECT * FROM service_type WHERE service_type_id  = ? AND untitled_id = ?";
        const servicetypeResult = await pool.query(servicetypeQuery, [servicetypeId, untitled_id ]);
        if (servicetypeResult[0].length == 0) {
            return error422("Service Type Not Found.", res);
        }
        // Check if the provided service_type exists and is active 
        const existingServiceTypeQuery = "SELECT * FROM service_type WHERE LOWER(TRIM( service_type_name )) = ? AND service_type_id!=? AND untitled_id = ?";
        const existingServiceTypeResult = await pool.query(existingServiceTypeQuery, [service_type_name.trim().toLowerCase(), servicetypeId, untitled_id ]);

        if (existingServiceTypeResult[0].length > 0) {
            return error422("Service Type name already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the service_type record with new data
        const updateQuery = `
            UPDATE service_type
            SET service_type_name = ?,  description = ?, untitled_id = ?, mts=?
            WHERE service_type_id = ?
        `;

        await pool.query(updateQuery, [service_type_name, description, untitled_id, nowDate, servicetypeId]);

        return res.status(200).json({
            status: 200,
            message: "Service Type updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }
}

//status change of service_type...
const onStatusChange = async (req, res) => {
    const servicetypeId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id = req.companyData.untitled_id ;

    try {
        // Check if the service_type  exists
        const servicetypeQuery = "SELECT * FROM service_type WHERE service_type_id = ? AND untitled_id = ?";
        const servicetypeResult = await pool.query(servicetypeQuery, [servicetypeId, untitled_id]);

        if (servicetypeResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Service Type not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the service_type status
        const updateQuery = `
            UPDATE service_type
            SET status = ?
            WHERE service_type_id = ?
        `;

        await pool.query(updateQuery, [status, servicetypeId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Service Type ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }
};
//get service_type active...
const getServiceTypeWma = async (req, res) => {
    const untitled_id = req.companyData.untitled_id;

    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id =  untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult = await pool.query(isCustomerQuery);
    const untitledId =  customerResult[0][0].untitled_id;

    let servicetypeQuery = `SELECT s.*  FROM service_type s LEFT JOIN untitled u ON u.untitled_id = s.untitled_id WHERE s.status = 1 AND u.category=2 AND s.untitled_id = ${untitledId} ORDER BY s.service_type_name`;
    try {
        const servicetypeResult = await pool.query(servicetypeQuery);
        const servicetype = servicetypeResult[0];

        return res.status(200).json({
            status: 200,
            message: "Service Type retrieved successfully.",
            data: servicetype,
        });
    } catch (error) {
        return error500(error,res);
    }
    
}

module.exports = {
    addServiceType,
    getServiceTypes,
    getServiceType,
    updateServiceType,
    onStatusChange,
    getServiceTypeWma
}