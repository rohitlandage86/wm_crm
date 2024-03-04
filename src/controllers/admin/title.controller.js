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
// add Title...
const addTitle = async (req, res) => {
    const  title_name  = req.body.title_name  ? req.body.title_name.trim()  : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id  = req.companyData.untitled_id ;
 
    if (!title_name) {
        return error422("Title Name is required.", res);
    }  else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }
    //check title already is exists or not
    const isExistTitleQuery = `SELECT * FROM title WHERE LOWER(TRIM(title_name))= ? AND untitled_id = ?`;
    const isExistTitleResult = await pool.query(isExistTitleQuery, [title_name.toLowerCase(), untitled_id]);
    if (isExistTitleResult[0].length > 0) {
        return error422(" Title Name is already exists.", res);
    } 
    try {
        //insert into title master
        const insertTitleQuery = `INSERT INTO title (title_name, description, untitled_id ) VALUES (?, ?, ? )`;
        const insertTitleValues = [ title_name, description, untitled_id ];
        const titleResult = await pool.query(insertTitleQuery, insertTitleValues);
        res.status(200).json({
            status: 200,
            message: "Title added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get title list...
const getTitles = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;

    try {
        let getTitleQuery = `SELECT t.*, u.untitled_id  FROM title t
        LEFT JOIN untitled u 
        ON t.untitled_id = u.untitled_id
        WHERE t.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM title t
        LEFT JOIN untitled u
        ON t.untitled_id = u.untitled_id
        WHERE t.untitled_id = ${untitled_id}`;
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getTitleQuery += ` AND t.status = 1`;
                countQuery += ` AND t.status = 1`;
            } else if (key === "deactivated") {
                getTitleQuery += ` AND t.status = 0`;
                countQuery += ` AND t.status = 0`;
            } else {
                getTitleQuery += ` AND  LOWER(t.title_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(t.title_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getTitleQuery += " ORDER BY t.cts DESC";
        let total = 0;
        // Apply pagination if both page and perPage are provided
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            // console.log(totalResult);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getTitleQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getTitleQuery);
        const titles = result[0];
        const data = {
            status: 200,
            message: "Title retrieved successfully",
            data: titles,
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

// get title  by id...
const getTitle = async (req, res) => {
    const titleId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;

    try {
        const titleQuery = `SELECT t.*, u.untitled_id  FROM  title t
        LEFT JOIN untitled u 
        ON t.untitled_id = u.untitled_id
        WHERE t.title_id  = ? AND t.untitled_id = ?`;
        const titleResult = await pool.query(titleQuery, [titleId, untitled_id]);
        if (titleResult[0].length == 0) {
            return error422("Title Not Found.", res);
        }
        const title = titleResult[0][0];
        return res.status(200).json({
            status: 200,
            message: "Titles Retrived Successfully",
            data: title
        });
    } catch (error) {
        return error500(error, res);
    }
}
//title type update...
const updateTitle = async (req, res) => {
    const titleId = parseInt(req.params.id);
    const title_name = req.body.title_name ? req.body.title_name.trim() : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id = req.companyData.untitled_id;
    if (!title_name) {
        return error422("Title name is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!titleId) {
        return error422("Title id is required.", res);
    }
    try {
        // Check if title exists
        const titleQuery = "SELECT * FROM title WHERE title_id  = ? AND untitled_id = ?";
        const titleResult = await pool.query(titleQuery, [titleId, untitled_id ]);
        if (titleResult[0].length == 0) {
            return error422("Title Not Found.", res);
        }
        // Check if the provided title exists and is active 
        const existingTitleQuery = "SELECT * FROM title WHERE LOWER(TRIM( title_name )) = ? AND title_id!=? AND untitled_id = ?";
        const existingTitleResult = await pool.query(existingTitleQuery, [title_name.trim().toLowerCase(), titleId, untitled_id]);

        if (existingTitleResult[0].length > 0) {
            return error422("Title name already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the Title record with new data
        const updateQuery = `
            UPDATE title
            SET title_name = ?,  description = ?, untitled_id = ?, mts=?
            WHERE title_id = ?
        `;

        await pool.query(updateQuery, [title_name, description, untitled_id, nowDate, titleId]);

        return res.status(200).json({
            status: 200,
            message: "Title updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }
}

//status change of title...
const onStatusChange = async (req, res) => {
    const titleId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id = req.companyData.untitled_id ;
    try {
        // Check if the title  exists
        const titleQuery = "SELECT * FROM title WHERE title_id = ? AND untitled_id ?";
        const titleResult = await pool.query(titleQuery, [titleId, untitled_id]);

        if (titleResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Title not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the title status
        const updateQuery = `
            UPDATE title
            SET status = ?
            WHERE title_id = ?
        `;

        await pool.query(updateQuery, [status, titleId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Title ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }
};
//get title active...
const getTitleWma = async (req, res) => {
    const untitled_id = req.companyData.untitled_id ;
    let titleQuery = `SELECT t.*  FROM title t LEFT JOIN untitled u ON u.untitled_id = t.untitled_id WHERE t.status = 1 AND u.category=2 AND t.untitled_id = ${untitled_id} ORDER BY t.cts DESC`;
    try {
        const titleResult = await pool.query(titleQuery);
        const title = titleResult[0];

        return res.status(200).json({
            status: 200,
            message: "Title retrieved successfully.",
            data: title,
        });
    } catch (error) {
        return error500(error,res);
    }
}

module.exports = {
    addTitle,
    getTitles,
    getTitle,
    updateTitle,
    onStatusChange,
    getTitleWma
}