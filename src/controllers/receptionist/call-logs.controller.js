const pool = require('../../../db')
// Function to obtain a database connection
const getConnection = async () => {
    try {
        const connection = await pool.getConnection()
        return connection
    } catch (error) {
        throw new Error('Failed to obtain database connection: ' + error.message)
    }
}
//error 422 handler...
const error422 = (message, res) => {
    return res.status(422).json({
        status: 422,
        message: message
    })
}
// error 500 handler...
const error500 = (error, res) => {
    console.log(error)
    return res.status(500).json({
        status: 500,
        message: 'Internal Server Error',
        error: error
    })
}
//create call log...
const createCallLog = async (req, res) => {
    const mobile_number = req.body.mobile_number ? req.body.mobile_number : null
    const customer_name = req.body.customer_name
        ? req.body.customer_name.trim()
        : ''
    const calling_type = req.body.calling_type
        ? req.body.calling_type.trim()
        : null
    const call_duration = req.body.call_duration
        ? req.body.call_duration.trim()
        : null
    const untitled_id = req.companyData.untitled_id

    if (!mobile_number) {
        return error422('Mobile number is required.', res)
    } else if (!untitled_id) {
        return error422('Untitled ID is required.', res)
    } else if (!calling_type) {
        return error422('Calling type is required.', res)
    }
    //check untitled_id already is exists or not
    const isExistUntitledIdQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
    const isExistUntitledIdResult = await pool.query(isExistUntitledIdQuery, [
        untitled_id,
    ]);
    const employeeDetails = isExistUntitledIdResult[0][0];
    if (employeeDetails.customer_id == 0) {
        return error422("Customer Not Found.", res);
    }
    // Attempt to obtain a database connection
    let connection = await getConnection()
    try {
        // Start a transaction
        await connection.beginTransaction()


        //insert into call log
        const insertCallLogQuery = `INSERT INTO call_logs (mobile_number, customer_name, calling_type, call_duration, customer_id ) VALUES (?, ?, ?, ?, ? )`
        const insertCallLogValues = [
            mobile_number,
            customer_name,
            calling_type,
            call_duration,
            employeeDetails.customer_id
        ]
        const callLogResult = await pool.query(
            insertCallLogQuery,
            insertCallLogValues
        )
        // Commit the transaction
        await connection.commit()
        res.status(200).json({
            status: 200,
            message: 'Call Log Created Successfully'
        })
    } catch (error) {
        return error500(error, res)
    } finally {
        if (connection) connection.release()
    }
}
//get all call log...
const getAllCallLogs = async (req, res) => {
    const {
        page,
        perPage,
        key,
        fromDate,
        toDate,
        current_date,
        calling_type
    } = req.query
    const untitled_id = req.companyData.untitled_id

    //check untitled_id already is exists or not
    const isExistUntitledIdQuery = 'SELECT * FROM untitled WHERE untitled_id = ?'
    const isExistUntitledIdResult = await pool.query(isExistUntitledIdQuery, [
        untitled_id
    ])
    const employeeDetails = isExistUntitledIdResult[0][0]
    if (employeeDetails.customer_id == 0) {
        return error422('Customer Not Found.', res)
    }

    try {
        let getCallLogQuery = ` SELECT c.* FROM call_logs c
          WHERE c.customer_id = ${employeeDetails.customer_id}  `
        let countQuery = ` SELECT COUNT(*) AS total FROM call_logs c  
          WHERE c.customer_id = ${employeeDetails.customer_id} `

        if (current_date) {
            getCallLogQuery += ` AND Date(c.cts) = '${current_date}'`
            countQuery += ` AND Date(c.cts) = '${current_date}'`
        }

        if (calling_type) {
            getCallLogQuery += ` AND c.calling_type = '${calling_type}'`
            countQuery += ` AND c.calling_type = '${calling_type}'`
        }

        if (key) {
            const lowercaseKey = key.toLowerCase().trim()
            if (lowercaseKey === 'activated') {
                getCallLogQuery += ` AND c.status = 1`
                countQuery += ` AND c.status = 1`
            } else if (lowercaseKey === 'deactivated') {
                getCallLogQuery += ` AND c.status = 0`
                countQuery += ` AND c.status = 0`
            } else {
                getCallLogQuery += ` AND (c.mobile_number LIKE '%${lowercaseKey}%' OR LOWER(c.customer_name) LIKE '%${lowercaseKey}%' ) `
                countQuery += ` AND (c.mobile_number LIKE '%${lowercaseKey}%' OR LOWER(c.customer_name) LIKE '%${lowercaseKey}%' ) `
            }
        }
        if (fromDate && toDate) {
            getCallLogQuery += ` AND Date(c.cts) >= '${fromDate}' AND Date(c.cts) <= '${toDate}'`
            countQuery += ` AND Date(c.cts) >= '${fromDate}' AND Date(c.cts) <= '${toDate}'`
        }

        getCallLogQuery += ' ORDER BY c.cts DESC'
        // Apply pagination if both page and perPage are provided
        let total = 0
        if (page && perPage) {
            const totalResult = await pool.query(countQuery)
            total = parseInt(totalResult[0][0].total)

            const start = (page - 1) * perPage
            getCallLogQuery += ` LIMIT ${perPage} OFFSET ${start}`
        }
        const result = await pool.query(getCallLogQuery)
        const call_logs = result[0]

        const data = {
            status: 200,
            message: ' Call logs retrieved successfully',
            data: call_logs
        }
        // Add pagination information if provided
        if (page && perPage) {
            data.pagination = {
                per_page: perPage,
                total: total,
                current_page: page,
                last_page: Math.ceil(total / perPage)
            }
        }

        return res.status(200).json(data)
    } catch (error) {
        return error500(error, res)
    } finally {
        if (pool) pool.releaseConnection()
    }
}

module.exports = {
    createCallLog,
    getAllCallLogs
}
