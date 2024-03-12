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

// add Service...
const addService = async (req, res) => {
    const service_name = req.body.service_name ? req.body.service_name.trim() : '';
    const entity_id = req.body.entity_id ? req.body.entity_id : '';
    const service_type_id = req.body.service_type_id ? req.body.service_type_id : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id = req.companyData.untitled_id;

    if (!service_name) {
        return error422("Service Name is required.", res);
    } else if (!entity_id) {
        return error422("Entity ID is required.", res);
    } else if (!service_type_id) {
        return error422("Service Type ID is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }
    // Check if entity exists
    const entityQuery = "SELECT * FROM entity WHERE entity_id  = ? AND untitled_id = ?";
    const entityResult = await pool.query(entityQuery, [entity_id, untitled_id]);
    if (entityResult[0].length == 0) {
        return error422("entity Not Found.", res);
    }
    // Check if service_type exists
    const servicetypeQuery = "SELECT * FROM service_type WHERE service_type_id  = ? AND untitled_id = ?";
    const servicetypeResult = await pool.query(servicetypeQuery, [service_type_id, untitled_id]);
    if (servicetypeResult[0].length == 0) {
        return error422("Service Type Not Found.", res);
    }
    //check service  already is exists or not
    const isExistServiceQuery = `SELECT * FROM services WHERE LOWER(TRIM(service_name))= ? AND untitled_id = ?`;
    const isExistServiceResult = await pool.query(isExistServiceQuery, [service_name.toLowerCase(), untitled_id]);
    if (isExistServiceResult[0].length > 0) {
        return error422(" Service Name is already exists.", res);
    }

    try {
        //insert into service 
        const insertServiceQuery = `INSERT INTO services (service_name, description, untitled_id, entity_id, service_type_id) VALUES (?, ?, ?, ?, ?)`;
        const insertServiceValues = [service_name, description, untitled_id, entity_id, service_type_id];
        const serviceResult = await pool.query(insertServiceQuery, insertServiceValues);

        res.status(200).json({
            status: 200,
            message: "Service added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get Services list...
const getServices = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;

    try {
        let getServiceQuery = `SELECT s.*, e.entity_name, st.service_type_name   FROM services s
        LEFT JOIN entity e
        ON e.entity_id = s.entity_id
        LEFT JOIN service_type st
        ON st.service_type_id = s.service_type_id
        WHERE s.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM services s
        LEFT JOIN entity e
        ON e.entity_id = s.entity_id
        LEFT JOIN service_type st
        ON st.service_type_id = s.service_type_id
        WHERE s.untitled_id = ${untitled_id}`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getServiceQuery += ` AND s.status = 1`;
                countQuery += ` AND s.status = 1`;
            } else if (key === "deactivated") {
                getServiceQuery += ` AND s.status = 0`;
                countQuery += ` AND s.status = 0`;
            } else {
                getServiceQuery += ` AND  LOWER(s.service_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(s.service_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getServiceQuery += " ORDER BY s.cts DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getServiceQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getServiceQuery);
        const services = result[0];

        const data = {
            status: 200,
            message: "Service retrieved successfully",
            data: services,
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

// get service  by id...
const getService = async (req, res) => {
    const serviceId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;

    try {
        const serviceQuery = `SELECT s.*, u.untitled_id  FROM  services s
        LEFT JOIN untitled u 
        ON s.untitled_id = u.untitled_id
        WHERE s.service_id  = ? AND s.untitled_id = ?`;
        const serviceResult = await pool.query(serviceQuery, [serviceId, untitled_id]);

        if (serviceResult[0].length == 0) {
            return error422("Service Not Found.", res);
        }
        const service = serviceResult[0][0];

        return res.status(200).json({
            status: 200,
            message: "Services Retrived Successfully",
            data: service
        });
    } catch (error) {
        return error500(error, res);
    }
}

//Service  update...
const updateService = async (req, res) => {
    const serviceId = parseInt(req.params.id);
    const service_name = req.body.service_name ? req.body.service_name.trim() : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const entity_id = req.body.entity_id ? req.body.entity_id : '';
    const service_type_id = req.body.service_type_id ? req.body.service_type_id : '';
    const untitled_id = req.companyData.untitled_id;

    if (!service_name) {
        return error422("Service name is required.", res);
    } else if (!entity_id) {
        return error422("Entity id is required.", res);
    } else if (!service_type_id) {
        return error422("Service Type id is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!serviceId) {
        return error422("Service id is required.", res);
    }
    try {
        // Check if service exists
        const serviceQuery = "SELECT * FROM services WHERE service_id  = ? AND untitled_id = ?";
        const serviceResult = await pool.query(serviceQuery, [serviceId, untitled_id]);
        if (serviceResult[0].length == 0) {
            return error422("Service Not Found.", res);
        }
        // Check if entity exists
        const entityQuery = "SELECT * FROM entity WHERE entity_id  = ? AND untitled_id = ?";
        const entityResult = await pool.query(entityQuery, [entity_id, untitled_id]);
        if (entityResult[0].length == 0) {
            return error422("entity Not Found.", res);
        }
        // Check if service_type exists
        const servicetypeQuery = "SELECT * FROM service_type WHERE service_type_id  = ? AND untitled_id = ?";
        const servicetypeResult = await pool.query(servicetypeQuery, [service_type_id, untitled_id]);
        if (servicetypeResult[0].length == 0) {
            return error422("Service Type Not Found.", res);
        }
        // Check if the provided service exists and is active 
        const existingServiceQuery = "SELECT * FROM services WHERE LOWER(TRIM( service_name )) = ? AND service_id!=? AND untitled_id = ?";
        const existingServiceResult = await pool.query(existingServiceQuery, [service_name.trim().toLowerCase(), serviceId, untitled_id]);

        if (existingServiceResult[0].length > 0) {
            return error422("Service name already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the Service record with new data
        const updateQuery = `
            UPDATE services
            SET service_name = ?,  description = ?, entity_id = ?, service_type_id = ?, untitled_id = ?, mts = ?
            WHERE service_id = ?
        `;

        await pool.query(updateQuery, [service_name, description, entity_id, service_type_id, untitled_id, nowDate, serviceId]);

        return res.status(200).json({
            status: 200,
            message: "Service updated successfully.",
        });
    } catch (error) {
        return error500(error, res);
    }
}

//status change of Service...
const onStatusChange = async (req, res) => {
    const serviceId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id = req.companyData.untitled_id;
    try {
        // Check if the service  exists
        const serviceQuery = "SELECT * FROM services WHERE service_id = ? AND untitled_id = ?";
        const serviceResult = await pool.query(serviceQuery, [serviceId, untitled_id]);

        if (serviceResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "service not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the service status
        const updateQuery = `
            UPDATE services
            SET status = ?
            WHERE service_id = ?
        `;

        await pool.query(updateQuery, [status, serviceId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Services ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error, res);
    }
};
//get Service active...
const getServiceWma = async (req, res) => {
    const untitled_id = req.companyData.untitled_id;

    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id =  untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult = await pool.query(isCustomerQuery);
    const untitledId =  customerResult[0][0].untitled_id;

    let serviceQuery = `SELECT s.*  FROM services s LEFT JOIN untitled u ON u.untitled_id = s.untitled_id WHERE s.status = 1 AND u.category=2 AND s.untitled_id = ${untitledId} ORDER BY s.cts DESC`;
    try {
        const serviceResult = await pool.query(serviceQuery);
        const services = serviceResult[0];

        return res.status(200).json({
            status: 200,
            message: "Services retrieved successfully.",
            data: services,
        });
    } catch (error) {
        return error500(error, res);
    }

}

module.exports = {
    addService,
    getServices,
    getService,
    updateService,
    onStatusChange,
    getServiceWma
}