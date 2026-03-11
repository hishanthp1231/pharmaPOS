const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const createBackup = (req, res) => {
    const host = process.env.DB_HOST;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_NAME;

    const fileName = `backup-${database}-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    const filePath = path.join(__dirname, '..', 'uploads', fileName);

    const command = `mysqldump -h ${host} -u ${user} -p${password} ${database} > "${filePath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Backup error: ${error.message}`);
            return res.status(500).json({ success: false, error: 'Backup failed', details: error.message });
        }

        // Send file to user
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error(`Download error: ${err.message}`);
            }
            // Optionally delete file after download
            // fs.unlinkSync(filePath);
        });
    });
};

const restoreBackup = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No backup file uploaded' });
    }

    const host = process.env.DB_HOST;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_NAME;
    const filePath = req.file.path;

    const command = `mysql -h ${host} -u ${user} -p${password} ${database} < "${filePath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Restore error: ${error.message}`);
            return res.status(500).json({ success: false, error: 'Restore failed', details: error.message });
        }

        // Delete the uploaded file after restore
        fs.unlinkSync(filePath);

        res.json({ success: true, message: 'Database restored successfully' });
    });
};

module.exports = {
    createBackup,
    restoreBackup
};
