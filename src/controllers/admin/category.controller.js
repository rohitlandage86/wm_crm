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
     res.send({
        status: 500,
        message: "Internal Server Error",
        error: error
    });
   res.end();
}

// add Category...
const addCategory = async (req, res) => {
    const  category_name  = req.body.category_name  ? req.body.category_name.trim()  : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id  = req.companyData.untitled_id ;
 
    if (!category_name) {
        return error422("Category Name is required.", res);
    }  else if (!untitled_id) {
        return error422("Untitled ID is required.", res);
    }

    //check category already is exists or not
    const isExistCategoryQuery = `SELECT * FROM category WHERE LOWER(TRIM(category_name))= ?`;
    const isExistCategoryResult = await pool.query(isExistCategoryQuery, [ category_name.toLowerCase()]);
    if (isExistCategoryResult[0].length > 0) {
        return error422(" Category Name is already exists.", res);
    } 

    try {
        //insert into Category
        const insertCategoryQuery = `INSERT INTO category (category_name, description, untitled_id ) VALUES (?, ?, ? )`;
        const insertCategoryValues = [ category_name, description, untitled_id ];
        const categoryResult = await pool.query(insertCategoryQuery, insertCategoryValues);

        res.status(200).json({
            status: 200,
            message: "Category added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }
}

// get categorys list...
const getCategorys = async (req, res) => {
    const { page, perPage, key } = req.query;
    const untitled_id = req.companyData.untitled_id;
    try {
        let getCategoryQuery = `SELECT c.*, u.untitled_id  FROM category c
        LEFT JOIN untitled u 
        ON c.untitled_id = u.untitled_id
        `;

        let countQuery = `SELECT COUNT(*) AS total FROM category c
        LEFT JOIN untitled u
        ON c.untitled_id = u.untitled_id
        `;
        
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (key === "activated") {
                getCategoryQuery += ` AND c.status = 1`;
                countQuery += ` AND c.status = 1`;
            } else if (key === "deactivated") {
                getCategoryQuery += ` AND c.status = 0`;
                countQuery += ` AND c.status = 0`;
            } else {
                getCategoryQuery += ` AND LOWER(c.category_name) LIKE '%${lowercaseKey}%'`;
                countQuery += ` AND LOWER(c.category_name) LIKE '%${lowercaseKey}%'`;
            }
        }
        getCategoryQuery += " ORDER BY c.cts DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);
            const start = (page - 1) * perPage;
            getCategoryQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await pool.query(getCategoryQuery);
        const category = result[0];

        const data = {
            status: 200,
            message: "Category retrieved successfully",
            data: category,
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

// get category  by id...
const getCategory = async (req, res) => {
    const categoryId = parseInt(req.params.id);
    const untitled_id = req.companyData.untitled_id;
    try {
        const categoryQuery = `SELECT c.*, u.untitled_id  FROM  category c
        LEFT JOIN untitled u 
        ON c.untitled_id = u.untitled_id
        WHERE c.category_id  = ? `;
        const categoryResult = await pool.query(categoryQuery, [categoryId]);
        
        if (categoryResult[0].length == 0) {
            return error422("Category Not Found.", res);
        }
        const category = categoryResult[0][0];
        
        return res.status(200).json({
            status: 200,
            message: "Category Retrived Successfully",
            data: category
        });
    } catch (error) {
        return error500(error, res);
    }
}

//category update...
const updateCategory = async (req, res) => {
    const categoryId = parseInt(req.params.id);
    const category_name = req.body.category_name ? req.body.category_name : '';
    const description = req.body.description ? req.body.description : '';
    const untitled_id = req.companyData.untitled_id;

    if (!category_name) {
        return error422("Category name is required.", res);
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res);
    } else if (!categoryId) {
        return error422("Category id is required.", res);
    }

    try {
        // Check if category exists
        const categoryQuery = "SELECT * FROM category WHERE category_id  = ?";
        const categoryResult = await pool.query(categoryQuery, [categoryId]);
        if (categoryResult[0].length == 0) {
            return error422("Category Not Found.", res);
        }
        // Check if the provided category exists and is active 
        const existingCategoryQuery = "SELECT * FROM category WHERE LOWER(TRIM( category_name )) = ? AND category_id!=?";
        const existingCategoryResult = await pool.query(existingCategoryQuery, [category_name.trim().toLowerCase(), categoryId]);

        if (existingCategoryResult[0].length > 0) {
            return error422("Category name already exists.", res);
        }
        const nowDate = new Date().toISOString().split('T')[0];
        // Update the category record with new data
        const updateQuery = `
            UPDATE category
            SET category_name = ?,  description = ?, untitled_id = ?, mts=?
            WHERE category_id = ?
        `;

        await pool.query(updateQuery, [category_name, description, untitled_id, nowDate, categoryId]);
        return res.status(200).json({
            status: 200,
            message: "Category updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }
}

//status change of category...
const onStatusChange = async (req, res) => {
    const categoryId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const untitled_id = req.companyData.untitled_id;

    try {
        // Check if the category  exists
        const categoryQuery = "SELECT * FROM category WHERE category_id = ? ";
        const categoryResult = await pool.query(categoryQuery, [categoryId]);

        if (categoryResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Category not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the category status
        const updateQuery = `
            UPDATE category
            SET status = ?
            WHERE category_id = ?
        `;

        await pool.query(updateQuery, [status, categoryId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";
        return res.status(200).json({
            status: 200,
            message: `Category ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }
};

const getCategoryWma = async (req, res, next) => {
    const untitled_id = req.companyData.untitled_id;
    
    const checkUntitledQuery = `SELECT * FROM untitled WHERE untitled_id = ${untitled_id}  `;
    const untitledResult = await pool.query(checkUntitledQuery);
    const customer_id =  untitledResult[0][0].customer_id;
    const isCustomerQuery = `SELECT * FROM untitled WHERE customer_id = ${customer_id} AND category = 2 `;
    const customerResult =  await pool.query(isCustomerQuery);
    const untitledId =  customerResult[0][0].untitled_id;
    
    let categoryQuery = `SELECT c.*  FROM category c LEFT JOIN untitled u ON u.untitled_id = c.untitled_id WHERE c.status = 1 AND u.category=2  ORDER BY c.category_name `;
    try {
        const categoryResult =  await pool.query(categoryQuery);
        const category = categoryResult[0];

        res.send({
            status: 200,
            message: "Category retrieved successfully.",
            data: category,
        })
        res.end();
    } catch (error) {
         error500(error,res);
    } finally {
        if (pool) {
            pool.releaseConnection();
        }
    }
    
}

module.exports = {
    addCategory,
    getCategorys,
    getCategory,
    updateCategory,
    onStatusChange,
    getCategoryWma
}