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

        const fs = require('fs');

        const [columns] = await connection.query("DESCRIBE sales_details");
        let output = '=== SCHEMA ===\n';
        columns.forEach(col => output += `${col.Field}: ${col.Type}\n`);

        const [rows] = await connection.query("SELECT * FROM sales_details ORDER BY id DESC LIMIT 5");
        output += '\n=== LATEST 5 ROWS ===\n';
        output += JSON.stringify(rows, null, 2);

        const [mode] = await connection.query("SELECT @@GLOBAL.sql_mode");
        output += '\n\n=== SQL MODE ===\n';
        output += JSON.stringify(mode, null, 2);

        fs.writeFileSync('schema_output.txt', output);
        console.log('Output written to schema_output.txt');

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkSchema();
