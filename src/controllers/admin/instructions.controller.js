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

// add instructions...
const addInstructions = async (req, res) => {
    const  instruction  = req.body.instruction  ? req.body.instruction.trim()  : '';
    const untitled_id  = req.companyData.untitled_id ;
 
    if (!instruction) {
        return error422("Instruction  is required.", res);
    }  else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }

    //check instructions  already is exists or not
    const isExistInstructionsQuery = `SELECT * FROM instructions WHERE LOWER(TRIM(instruction))= ? AND untitled_id = ?`;
    const isExistInstructionsResult = await pool.query(isExistInstructionsQuery, [ instruction.toLowerCase(), untitled_id]);
    if (isExistInstructionsResult[0].length > 0) {
        return error422(" Instructions is already exists.", res);
    } 

    try {
        //insert into instructions 
        const insertInstructionsQuery = `INSERT INTO instructions (instruction, untitled_id ) VALUES (?, ? )`;
        const insertInstructionsValues= [instruction, untitled_id ];
        const instructionsResults = await pool.query(insertInstructionsQuery, insertInstructionsValues);

        res.status(200).json({
            status: 200,
            message: "Instructions added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get instructions list...
const getInstructionss = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;

    try {
        let getInstructionsQuery = `SELECT i.*, u.untitled_id  FROM instructions i
        LEFT JOIN untitled u 
        ON i.untitled_id = u.untitled_id
        WHERE i.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM instructions i
        LEFT JOIN untitled u
        ON i.untitled_id = u.untitled_id
        WHERE i.untitled_id = ${untitled_id}`;
        
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getInstructionsQuery += ` AND i.status = 1`;
                countQuery += ` AND i.status = 1`;
            } else if (key === "deactivated") {
                getInstructionsQuery += ` AND i.status = 0`;
                countQuery += ` AND i.status = 0`;
            } else {
                getInstructionsQuery += ` AND LOWER(i.instruction_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(i.instruction_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getInstructionsQuery += " ORDER BY i.cts DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getInstructionsQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getInstructionsQuery);
        const instructions = result[0];

        const data = {
            status: 200,
            message: "Instructions retrieved successfully",
            data: instructions,
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

// get instructions  by id...
const getInstructions = async (req, res) => {
    const instructionsId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;

    try {
        const instructionsQuery = `SELECT i.*, u.untitled_id  FROM  instructions i
        LEFT JOIN untitled u 
        ON i.untitled_id = u.untitled_id
        WHERE i.instructions_id  = ? AND i.untitled_id = ?`;
        const instructionsResult = await pool.query(instructionsQuery, [instructionsId, untitled_id]);
        
        if (instructionsResult[0].length == 0) {
            return error422("Instructions Not Found.", res);
        }
        const instructions = instructionsResult[0][0];
        
        return res.status(200).json({
            status: 200,
            message: "Instructions Retrived Successfully",
            data: instructions
        });
    } catch (error) {
        return error500(error, res);
    }
}

//instructions  update...
const updateInstructions = async (req, res) => {
    const instructionsId = parseInt(req.params.id);
    const instruction = req.body.instruction ? req.body.instruction.trim() : '';
    const untitled_id = req.companyData.untitled_id;
    
    if (!instruction) {
        return error422("Instruction is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!instructionsId) {
        return error422("Instructions id is required.", res);
    }
    try {
        // Check if instructions exists
        const instructionsQuery = "SELECT * FROM instructions WHERE instructions_id  = ? AND untitled_id = ?";
        const instructionsResult = await pool.query(instructionsQuery, [instructionsId, untitled_id]);
        if (instructionsResult[0].length == 0) {
            return error422("Instructions Not Found.", res);
        }
        // Check if the provided instructions exists and is active 
        const existingInstructionsQuery = "SELECT * FROM instructions WHERE LOWER(TRIM( instruction )) = ? AND instructions_id!=? AND untitled_id = ?";
        const existingInstructionsResult = await pool.query(existingInstructionsQuery, [instruction.toLowerCase(), instructionsId, untitled_id]);

        if (existingInstructionsResult[0].length > 0) {
            return error422("Instructions name already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the instructions record with new data
        const updateQuery = `
            UPDATE instructions
            SET instruction = ?, untitled_id = ?, mts=?
            WHERE instructions_id = ?
        `;

        await pool.query(updateQuery, [instruction, untitled_id, nowDate, instructionsId]);

        return res.status(200).json({
            status: 200,
            message: "Instructions updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }
}

//status change of instructions...
const onStatusChange = async (req, res) => {
    const instructionsId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id  = req.companyData.untitled_id ;
    try {
        // Check if the instructions  exists
        const instructionsQuery = "SELECT * FROM instructions WHERE instructions_id = ? AND untitled_id = ?";
        const instructionsResult = await pool.query(instructionsQuery, [instructionsId, untitled_id]);

        if (instructionsResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Instructions not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the instructions status
        const updateQuery = `
            UPDATE instructions
            SET status = ?
            WHERE instructions_id = ?
        `;

        await pool.query(updateQuery, [status, instructionsId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Instructions ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }
};
//get instructions active...
const getInstructionsWma = async (req, res, next) => {
    const untitled_id = req.companyData.untitled_id;

    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id =  untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult = await pool.query(isCustomerQuery);
    const untitledId =  customerResult[0][0].untitled_id;

    let instructionsQuery = `SELECT i.*  FROM instructions i LEFT JOIN untitled u ON u.untitled_id = i.untitled_id WHERE i.status = 1 AND u.category=2 AND i.untitled_id = ${untitledId} ORDER BY i.instruction`;
    try {
        const instructionsResult = await pool.query(instructionsQuery);
        const instructions = instructionsResult[0];

        res.status(200).json({
            status: 200,
            message: "Instructions retrieved successfully.",
            data: instructions,
        });
        res.end();
    } catch (error) {
        error500(error,res);
    }
    
}


module.exports = {
    addInstructions,
    getInstructionss,
    getInstructions,
    updateInstructions,
    onStatusChange,
    getInstructionsWma
}