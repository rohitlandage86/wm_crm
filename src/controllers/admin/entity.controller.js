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
// add Entity...
const addEntity = async (req, res) => {
    const  entity_name  = req.body.entity_name  ? req.body.entity_name.trim()  : '';
    const  abbrivation  = req.body.abbrivation  ? req.body.abbrivation.trim()  : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id  = req.companyData.untitled_id ;
 
    if (!entity_name) {
        return error422("Entity Name is required.", res);
    }  else if (!abbrivation) {
        return error422("Abbrivation is required.", res);
    }  else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }
    //check Entity already is exists or not
    const isExistEntityQuery = `SELECT * FROM entity WHERE LOWER(TRIM(entity_name))= ? OR LOWER(TRIM(abbrivation)) = ? AND untitled_id = ?`;
    const isExistEntityResult = await pool.query(isExistEntityQuery, [entity_name.toLowerCase(),abbrivation.toLowerCase(), untitled_id]);
    if (isExistEntityResult[0].length > 0) {
        return error422(" Entity Name Or Abbrivation is already exists.", res);
    } 
    try {
        //insert into Entity master
        const insertEntityQuery = `INSERT INTO entity (entity_name, abbrivation, description, untitled_id ) VALUES (?, ?, ?, ? )`;
        const insertEntityValues = [ entity_name, abbrivation, description, untitled_id ];
        const serviceResult = await pool.query(insertEntityQuery, insertEntityValues);
        res.status(200).json({
            status: 200,
            message: "Entity added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get Entity list...
const getEntitys = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;

    try {
        let getEntityQuery = `SELECT e.*, u.untitled_id  FROM entity e
        LEFT JOIN untitled u 
        ON e.untitled_id = u.untitled_id
        WHERE e.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM entity e
        LEFT JOIN untitled u
        ON e.untitled_id = u.untitled_id
        WHERE e.untitled_id = ${untitled_id}`;
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getEntityQuery += ` AND e.status = 1`;
                countQuery += ` AND e.status = 1`;
            } else if (key === "deactivated") {
                getEntityQuery += ` AND e.status = 0`;
                countQuery += ` AND e.status = 0`;
            } else {
                getEntityQuery += ` AND ( LOWER(e.abbrivation) LIKE '%${lowercaseKey}%' OR LOWER(e.entity_name) LIKE '%${lowercaseKey}%' )  `;
                countQuery +=` AND ( LOWER(e.abbrivation) LIKE '%${lowercaseKey}%' OR LOWER(e.entity_name) LIKE '%${lowercaseKey}%' )  `;
            }
        }
        getEntityQuery += " ORDER BY e.cts DESC";
        let total = 0;
        // Apply pagination if both page and perPage are provided
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getEntityQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getEntityQuery);
        const entitys = result[0];
        const data = {
            status: 200,
            message: "Entity retrieved successfully",
            data: entitys,
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

// get Entity  by id...
const getEntity = async (req, res) => {
    const entityId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;
    try {
        const entityQuery = `SELECT e.*, u.untitled_id  FROM  entity e
        LEFT JOIN untitled u 
        ON e.untitled_id = u.untitled_id
        WHERE e.entity_id  = ? AND e.untitled_id = ?`;
        const entityResult = await pool.query(entityQuery, [entityId, untitled_id]);
        if (entityResult[0].length == 0) {
            return error422("Entity Not Found.", res);
        }
        const entity = entityResult[0][0];
        return res.status(200).json({
            status: 200,
            message: "Entitys Retrived Successfully",
            data: entity
        });
    } catch (error) {
        return error500(error, res);
    }
}
//entity update...
const updateEntity = async (req, res) => {
    const entityId = parseInt(req.params.id);
    const entity_name = req.body.entity_name ? req.body.entity_name.trim() : '';
    const abbrivation = req.body.abbrivation ? req.body.abbrivation.trim() : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id = req.companyData.untitled_id;
    if (!entity_name) {
        return error422("Entity name is required.", res);
    } else if (!abbrivation) {
        return error422("Abbrivation is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!entityId) {
        return error422("Entity id is required.", res);
    }
    try {
        // Check if entity exists
        const entityQuery = "SELECT * FROM entity WHERE entity_id  = ? AND untitled_id = ?";
        const entityResult = await pool.query(entityQuery, [entityId, untitled_id]);
        if (entityResult[0].length == 0) {
            return error422("Entity Not Found.", res);
        }
        // Check if the provided entity exists and is active 
        const existingEntityQuery = "SELECT * FROM entity WHERE LOWER(TRIM(LOWER(entity_name)) = ? OR TRIM(LOWER(abbrivation)) = ? ) AND entity_id!=? AND untitled_id = ?";
        const existingEntityResult = await pool.query(existingEntityQuery, [entity_name.toLowerCase(), abbrivation.toLowerCase(), entityId, untitled_id]);

        if (existingEntityResult[0].length > 0) {
            return error422("Entity name And Abbrivation already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the Service record with new data
        const updateQuery = `
            UPDATE entity
            SET entity_name = ?, abbrivation = ?, description = ?, untitled_id = ?, mts=?
            WHERE entity_id = ?
        `;

        await pool.query(updateQuery, [entity_name, abbrivation, description, untitled_id, nowDate, entityId]);

        return res.status(200).json({
            status: 200,
            message: "Entity updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }
}

//status change of entity...
const onStatusChange = async (req, res) => {
    const entityId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter\
    const untitled_id = req.companyData.untitled_id;
    try {
        // Check if the entity  exists
        const entityQuery = "SELECT * FROM entity WHERE entity_id = ? AND untitled_id = ?";
        const entityResult = await pool.query(entityQuery, [entityId, untitled_id]);

        if (entityResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Entity not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the entity status
        const updateQuery = `
            UPDATE entity
            SET status = ?
            WHERE entity_id = ?
        `;

        await pool.query(updateQuery, [status, entityId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Entity ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    } 
};
//get entity active...
const getEntityWma = async (req, res) => {
    const untitled_id = req.companyData.untitled_id;
    let entityQuery = `SELECT e.*  FROM entity e LEFT JOIN untitled u ON u.untitled_id = e.untitled_id WHERE e.status =1 AND u.category=2 AND e.untitled_id = ${untitled_id} ORDER BY e.cts`;
    try {
        const entityResult = await pool.query(entityQuery);
        const entitys = entityResult[0];

        return res.status(200).json({
            status: 200,
            message: "Entitys retrieved successfully.",
            data: entitys,
        });
    } catch (error) {
        return error500(error,res);
    }
    
}

module.exports = {
    addEntity,
    getEntitys,
    getEntity,
    updateEntity,
    onStatusChange,
    getEntityWma
}