const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTable() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to database.');

        const [rows] = await connection.query("SHOW TABLES LIKE 'sales_details'");
        if (rows.length === 0) {
            console.log('Table sales_details does NOT exist.');
        } else {
            console.log('Table sales_details exists.');
            const [columns] = await connection.query("SHOW COLUMNS FROM sales_details");
            console.log('Columns:', columns.map(c => c.Field));
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTable();
