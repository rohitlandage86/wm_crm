const mysql = require('mysql2/promise');

// Create a connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'wm_crm',
  port: 3306,
  timezone: '+00:00',  // Set the time zone for the connection
  waitForConnections: true,
  connectionLimit: 20,  // Adjust based on your requirements
  queueLimit: 0
});

// Check if the pool successfully connects to the database
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to database');
    connection.release();
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
})();

// Export the pool to be used in other modules
module.exports = pool;