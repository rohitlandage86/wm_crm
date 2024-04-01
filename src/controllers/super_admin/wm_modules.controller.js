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

// add wm_modules...
const addModules= async (req, res) => {
    const  module_name  = req.body.module_name  ? req.body.module_name.trim()  : '';
    const  description  = req.body.description  ? req.body.description.trim()  : '';
    const untitled_id  = req.companyData.untitled_id ;
 
    if (!module_name) {
        return error422("Module Name is required.", res);
    }  else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }

    //check wm_modules  already is exists or not
    const isExistWMModulesQuery = `SELECT * FROM wm_modules WHERE LOWER(TRIM(module_name))= ? AND untitled_id = ?`;
    const isExistWMModulesResult = await pool.query(isExistWMModulesQuery, [ module_name.toLowerCase(), untitled_id]);
    if (isExistWMModulesResult[0].length > 0) {
        return error422(" Module Name is already exists.", res);
    } 

    try {
        //insert into wm_modules 
        const insertWMModulesQuery = `INSERT INTO wm_modules (module_name, description, untitled_id ) VALUES (?, ?, ?)`;
        const insertWMModulesValues= [module_name, description, untitled_id ];
        const wm_modules = await pool.query(insertWMModulesQuery, insertWMModulesValues);

        res.status(200).json({
            status: 200,
            message: "Module  added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get wm_modules list...
const getModules = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;

    try {
        let getWMModulesQuery = `SELECT m.*, u.untitled_id  FROM wm_modules m
        LEFT JOIN untitled u 
        ON m.untitled_id = u.untitled_id
        WHERE m.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM wm_modules m
        LEFT JOIN untitled u
        ON m.untitled_id = u.untitled_id
        WHERE m.untitled_id = ${untitled_id}`;
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getWMModulesQuery += ` AND m.status = 1`;
                countQuery += ` AND m.status = 1`;
            } else if (key === "deactivated") {
                getWMModulesQuery += ` AND m.status = 0`;
                countQuery += ` AND m.status = 0`;
            } else {
                getWMModulesQuery += ` AND  LOWER(m.module_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(m.module_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getWMModulesQuery += " ORDER BY m.cts DESC";
        let total = 0;
        // Apply pagination if both page and perPage are provided
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);
            const start = (page - 1) * perPage;
            getWMModulesQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getWMModulesQuery);
        const wm_modules = result[0];
        const data = {
            status: 200,
            message: "Module retrieved successfully",
            data: wm_modules,
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

// get wm_module  by id...
const getModule = async (req, res) => {
    const moduleId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;

    try {
        const wmmoduleQuery = `SELECT m.*, u.untitled_id  FROM  wm_modules m
        LEFT JOIN untitled u 
        ON m.untitled_id = u.untitled_id
        WHERE m.module_id  = ? AND m.untitled_id = ?`;
        const wmmoduleResult = await pool.query(wmmoduleQuery, [moduleId, untitled_id]);
        if (wmmoduleResult[0].length == 0) {
            return error422("Module Not Found.", res);
        }
        const wm_module = wmmoduleResult[0][0];
        return res.status(200).json({
            status: 200,
            message: "Module Retrived Successfully",
            data: wm_module
        });
    } catch (error) {
        return error500(error, res);
    }
}
//wm  module  update...
const updateModule = async (req, res) => {
    const moduleId = parseInt(req.params.id);
    const module_name = req.body.module_name ? req.body.module_name.trim() : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id = req.companyData.untitled_id;

    if (!module_name) {
        return error422("Module Name is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!moduleId) {
        return error422("Module id   is required.", res);
    }
    try {
        // Check if module name exists
        const wmmodulesQuery = "SELECT * FROM wm_modules WHERE module_id  = ? AND untitled_id = ?";
        const wmmodulesResult = await pool.query(wmmodulesQuery, [moduleId, untitled_id]);
        if (wmmodulesResult[0].length == 0) {
            return error422("Module Name Not Found.", res);
        }
        // Check if the provided wm modules exists and is active 
        const existingModulesQuery = "SELECT * FROM wm_modules WHERE LOWER(TRIM( module_name )) = ? AND module_id!=? AND untitled_id = ?";
        const existingModulesResult = await pool.query(existingModulesQuery, [module_name.toLowerCase(), moduleId, untitled_id]);

        if (existingModulesResult[0].length > 0) {
            return error422("Module Name already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the wm modules record with new data
        const updateQuery = `
            UPDATE wm_modules
            SET module_name = ?,  description = ?, untitled_id = ?, mts=?
            WHERE module_id = ?
        `;

        await pool.query(updateQuery, [module_name, description, untitled_id, nowDate, moduleId]);

        return res.status(200).json({
            status: 200,
            message: "Modules updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }
}

//status change of wm modules ...
const onStatusChange = async (req, res) => {
    const moduleId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id = req.companyData.untitled_id;
    try {
        // Check if the wm modules exists
        const wmmodulesQuery = "SELECT * FROM wm_modules WHERE module_id = ? AND untitled_id = ?";
        const wmmodulesResult = await pool.query(wmmodulesQuery, [moduleId, untitled_id]);

        if (wmmodulesResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Module Name not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the wm modules status
        const updateQuery = `
            UPDATE wm_modules
            SET status = ?
            WHERE module_id = ?
        `;

        await pool.query(updateQuery, [status, module_id]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Modules ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }
};
//get wm modules active...
const getModulesWma = async (req, res) => {
    const untitled_id = req.companyData.untitled_id;
    let wmmodulesQuery = `SELECT m.*  FROM wm_modules m LEFT JOIN untitled u ON u.untitled_id = m.untitled_id WHERE  u.category=1 AND m.untitled_id = ${untitled_id} ORDER BY m.module_name `;
    try {
        const wmmodulesResult = await pool.query(wmmodulesQuery);
        const wm_modules = wmmodulesResult[0];

        return res.status(200).json({
            status: 200,
            message: "Modules retrieved successfully.",
            data: wm_modules,
        });
    } catch (error) {
        return error500(error,res);
    }
}
module.exports = {
    addModules,
    getModules,
    getModule,
    updateModule,
    onStatusChange,
    getModulesWma
}