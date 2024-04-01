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

// add chief complaints...
const addChiefComplaints = async (req, res) => {
    const  chief_complaint  = req.body.chief_complaint  ? req.body.chief_complaint.trim()  : '';
    const untitled_id  = req.companyData.untitled_id ;
    
    //  add a chief complaint for insert admin untitled id
    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id =  untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult = await pool.query(isCustomerQuery);
    const untitledId =  customerResult[0][0].untitled_id;


    if (!chief_complaint) {
        return error422("Chief Complaint is required.", res);
    }  else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }

    //check chief_complaints  already is exists or not
    const isExistChiefComplaintsQuery = `SELECT * FROM chief_complaints WHERE LOWER(TRIM(chief_complaint))= ? AND untitled_id = ?`;
    const isExistChiefComplaintsResult = await pool.query(isExistChiefComplaintsQuery, [ chief_complaint.toLowerCase(), untitledId]);
    if (isExistChiefComplaintsResult[0].length > 0) {
        return error422(" Chief Complaints is already exists.", res);
    } 

    try {
        //insert into chief_complaints 
        const insertChiefComplaintsQuery = `INSERT INTO chief_complaints (chief_complaint, untitled_id ) VALUES (?, ? )`;
        const insertChiefComplaintsValues= [chief_complaint, untitledId ];
        const chief_complaintsResult = await pool.query(insertChiefComplaintsQuery, insertChiefComplaintsValues);

        res.status(200).json({
            status: 200,
            message: "Chief Complaints added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get chief_complaintss list...
const getChiefComplaintss = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;

    try {
        let getChiefComplaintsQuery = `SELECT c.*, u.untitled_id  FROM chief_complaints c
        LEFT JOIN untitled u 
        ON c.untitled_id = u.untitled_id
        WHERE c.untitled_id = ${untitled_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM chief_complaints c
        LEFT JOIN untitled u
        ON c.untitled_id = u.untitled_id
        WHERE c.untitled_id = ${untitled_id}`;
        
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getChiefComplaintsQuery += ` AND c.status = 1`;
                countQuery += ` AND c.status = 1`;
            } else if (key === "deactivated") {
                getChiefComplaintsQuery += ` AND c.status = 0`;
                countQuery += ` AND c.status = 0`;
            } else {
                getChiefComplaintsQuery += ` AND  LOWER(c.chief_complaint) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND  LOWER(c.chief_complaint) LIKE '%${lowercaseKey}%' `;
            }
        }
        getChiefComplaintsQuery += " ORDER BY c.cts DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getChiefComplaintsQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getChiefComplaintsQuery);
        const chief_complaints = result[0];

        const data = {
            status: 200,
            message: "Chief Complaints retrieved successfully",
            data: chief_complaints,
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

// get chief_complaints  by id...
const getChiefComplaints = async (req, res) => {
    const chief_complaintsId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;

    try {
        const chief_complaintsQuery = `SELECT c.*, u.untitled_id  FROM  chief_complaints c
        LEFT JOIN untitled u 
        ON c.untitled_id = u.untitled_id
        WHERE c.chief_complaint_id  = ? AND c.untitled_id = ?`;
        const chief_complaintsResult = await pool.query(chief_complaintsQuery, [chief_complaintsId, untitled_id]);
        
        if (chief_complaintsResult[0].length == 0) {
            return error422("Chief Complaints Not Found.", res);
        }
        const chief_complaints = chief_complaintsResult[0][0];
        
        return res.status(200).json({
            status: 200,
            message: "Chief Complaints Retrived Successfully",
            data: chief_complaints
        });
    } catch (error) {
        return error500(error, res);
    }
}

//chief_complaints  update...
const updateChiefComplaints = async (req, res) => {
    const chief_complaintsId = parseInt(req.params.id);
    const chief_complaint = req.body.chief_complaint ? req.body.chief_complaint : '';
    const untitled_id = req.companyData.untitled_id;

    if (!chief_complaint) {
        return error422("Chief Complaint is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!chief_complaintsId) {
        return error422("Chief Complaints id is required.", res);
    }
    try {
        // Check if chief_complaints exists
        const chief_complaintsQuery = "SELECT * FROM chief_complaints WHERE chief_complaint_id  = ? AND untitled_id = ?";
        const chief_complaintsResult = await pool.query(chief_complaintsQuery, [chief_complaintsId, untitled_id]);
        if (chief_complaintsResult[0].length == 0) {
            return error422("Chief Complaints Not Found.", res);
        }
        // Check if the provided chief_complaints exists and is active 
        const existingChiefComplaintsQuery = "SELECT * FROM chief_complaints WHERE LOWER(TRIM( chief_complaint )) = ? AND chief_complaint_id!=? AND untitled_id = ?";
        const existingChiefComplaintsResult = await pool.query(existingChiefComplaintsQuery, [chief_complaint.trim().toLowerCase(), chief_complaintsId, untitled_id]);

        if (existingChiefComplaintsResult[0].length > 0) {
            return error422(" Chief Complaint already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the chief_complaints record with new data
        const updateQuery = `
            UPDATE chief_complaints
            SET chief_complaint = ?, untitled_id = ?, mts=?
            WHERE chief_complaint_id = ?
        `;

        await pool.query(updateQuery, [chief_complaint, untitled_id, nowDate, chief_complaintsId]);

        return res.status(200).json({
            status: 200,
            message: "Chief Complaints updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }
}

//status change of chief_complaints...
const onStatusChange = async (req, res) => {
    const chief_complaintsId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id = req.companyData.untitled_id;

    try {
        // Check if the chief_complaints  exists
        const chief_complaintsQuery = "SELECT * FROM chief_complaints WHERE chief_complaint_id = ? AND untitled_id = ? ";
        const chief_complaintsResult = await pool.query(chief_complaintsQuery, [chief_complaintsId, untitled_id]);

        if (chief_complaintsResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Chief Complaints not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the chief_complaints status
        const updateQuery = `
            UPDATE chief_complaints
            SET status = ?
            WHERE chief_complaint_id = ?
        `;

        await pool.query(updateQuery, [status, chief_complaintsId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";

        return res.status(200).json({
            status: 200,
            message: `Chief Complaints ${statusMessage} Successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }
};
//get chief_complaints active...
const getChiefComplaintsWma = async (req, res) => {
    const untitled_id = req.companyData.untitled_id;

    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id =  untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult = await pool.query(isCustomerQuery);
    const untitledId =  customerResult[0][0].untitled_id;

    let chief_complaintsQuery = `SELECT c.*  FROM chief_complaints c LEFT JOIN untitled u ON u.untitled_id = c.untitled_id WHERE c.status = 1 AND u.category=2 AND c.untitled_id = ${untitledId} ORDER BY c.chief_complaint `;
    try {
        const chief_complaintsResult = await pool.query(chief_complaintsQuery);
        const chief_complaints = chief_complaintsResult[0];

        return res.status(200).json({
            status: 200,
            message: "Chief Complaints retrieved successfully.",
            data: chief_complaints,
        });
    } catch (error) {
        return error500(error,res);
    }
    
}

module.exports = {
    addChiefComplaints,
    getChiefComplaintss,
    getChiefComplaints,
    updateChiefComplaints,
    onStatusChange,
    getChiefComplaintsWma
}