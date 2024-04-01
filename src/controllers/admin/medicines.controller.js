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

// add medicines...
const addMedicines = async (req, res) => {
    const  medicines_name  = req.body.medicines_name  ? req.body.medicines_name.trim()  : '';
    const content = req.body.content ? req.body.content.trim() : '';
    const untitled_id =req.companyData.untitled_id ;
 
    if (!medicines_name) {
        return error422("Medicines Name   is required.", res);
    }  else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }

    //check medicines  already is exists or not
    const isExistMedicinesQuery = `SELECT * FROM medicines WHERE LOWER(TRIM(medicines_name))= ? AND untitled_id = ?`;
    const isExistMedicinesResult = await pool.query(isExistMedicinesQuery, [ medicines_name.toLowerCase(), untitled_id]);
    if (isExistMedicinesResult[0].length > 0) {
        return error422(" Medicines Name  is already exists.", res);
    } 

    try {
        //insert into medicines 
        const insertMedicinesQuery = `INSERT INTO medicines (medicines_name, content, untitled_id ) VALUES (?, ?, ? )`;
        const insertMedicinesValues = [ medicines_name, content, untitled_id ];
        const medicinesResult  = await pool.query(insertMedicinesQuery, insertMedicinesValues);

        res.status(200).json({
            status: 200,
            message: "Medicines added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get Medicines  list...
const getMediciness = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;

    try {
        let getMedicinesQuery = `SELECT m.*, u.untitled_id  FROM medicines m
        LEFT JOIN untitled u 
        ON m.untitled_id = u.untitled_id
        WHERE m.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM medicines m
        LEFT JOIN untitled u
        ON m.untitled_id = u.untitled_id
        WHERE m.untitled_id = ${untitled_id}`;
        
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getMedicinesQuery += ` AND m.status = 1`;
                countQuery += ` AND m.status = 1`;
            } else if (key === "deactivated") {
                getMedicinesQuery += ` AND m.status = 0`;
                countQuery += ` AND m.status = 0`;
            } else {
                getMedicinesQuery += ` AND LOWER(m.medicines_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(m.medicines_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getMedicinesQuery += " ORDER BY m.cts DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getMedicinesQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getMedicinesQuery);
        const medicines  = result[0];

        const data = {
            status: 200,
            message: "Medicines  retrieved successfully",
            data: medicines ,
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

// get medicines   by id...
const getMedicines  = async (req, res) => {
    const medicinesId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;

    try {
        const medicinesQuery = `SELECT m.*, u.untitled_id  FROM  medicines m
        LEFT JOIN untitled u 
        ON m.untitled_id = u.untitled_id
        WHERE m.medicines_id  = ? AND m.untitled_id = ?`;
        const medicinesResult = await pool.query(medicinesQuery, [medicinesId, untitled_id ]);
        
        if (medicinesResult[0].length == 0) {
            return error422("Medicines Not Found.", res);
        }
        const medicines = medicinesResult[0][0];
        
        return res.status(200).json({
            status: 200,
            message: "Medicines Retrived Successfully",
            data: medicines 
        });
    } catch (error) {
        return error500(error, res);
    }
}

//medicines  update...
const updateMedicines  = async (req, res) => {
    const medicinesId = parseInt(req.params.id);
    const medicines_name = req.body.medicines_name ? req.body.medicines_name.trim() : '';
    const content = req.body.content ? req.body.content.trim() : '';
    const untitled_id = req.companyData.untitled_id;

    if (!medicines_name) {
        return error422("Medicines Name is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!medicinesId) {
        return error422("Medicines id is required.", res);
    }
    try {
        // Check if medicines  exists
        const medicinesQuery = "SELECT * FROM medicines WHERE medicines_id  = ? AND untitled_id = ?";
        const medicinesResult = await pool.query(medicinesQuery, [medicinesId, untitled_id ]);
        if (medicinesResult[0].length == 0) {
            return error422("Medicines Not Found.", res);
        }
        // Check if the provided medicines  exists and is active 
        const existingMedicinesQuery = "SELECT * FROM medicines WHERE LOWER(TRIM( medicines_name )) = ? AND medicines_id!=? AND untitled_id = ?";
        const existingMedicinesResult = await pool.query(existingMedicinesQuery, [medicines_name.toLowerCase(), medicinesId, untitled_id ]);

        if (existingMedicinesResult[0].length > 0) {
            return error422("Medicines Name  already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the medicines  record with new data
        const updateQuery = `
            UPDATE medicines
            SET medicines_name = ?, content = ?, untitled_id = ?, mts=?
            WHERE medicines_id = ?
        `;

        await pool.query(updateQuery, [medicines_name, content, untitled_id, nowDate, medicinesId]);

        return res.status(200).json({
            status: 200,
            message: "Medicines updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }
}

//status change of medicines ...
const onStatusChange = async (req, res) => {
    const medicinesId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id = req.companyData.untitled_id

    try {
        // Check if the medicines   exists
        const medicinesQuery = "SELECT * FROM medicines WHERE medicines_id = ? AND untitled_id =?";
        const medicinesResult = await pool.query(medicinesQuery, [medicinesId, untitled_id]);

        if (medicinesResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Medicines not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the medicines  status
        const updateQuery = `
            UPDATE medicines 
            SET status = ?
            WHERE medicines_id = ?
        `;

        await pool.query(updateQuery, [status, medicinesId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Medicines ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }
};
//get medicines  active...
const getMedicinesWma = async (req, res) => {
    const untitled_id  = req.companyData.untitled_id ;

    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id =  untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult = await pool.query(isCustomerQuery);
    const untitledId =  customerResult[0][0].untitled_id;

    let medicinesQuery = `SELECT m.*  FROM medicines m LEFT JOIN untitled u ON u.untitled_id = m.untitled_id WHERE m.status = 1 AND u.category=2 AND m.untitled_id = ${untitledId } ORDER BY m.medicines_name `;
    try {
        const medicinesResult = await pool.query(medicinesQuery);
        const medicines  = medicinesResult[0];

        return res.status(200).json({
            status: 200,
            message: "Medicines  retrieved successfully.",
            data: medicines ,
        });
    } catch (error) {
        return error500(error,res);
    }
    
}

module.exports = {
    addMedicines,
    getMediciness,
    getMedicines,
    updateMedicines,
    onStatusChange,
    getMedicinesWma
}