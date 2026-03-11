const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to database.');

        const [columns] = await connection.query("DESCRIBE sales_details");
        console.log('Schema:', columns);

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkSchema();
