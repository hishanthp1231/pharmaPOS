const twilio = require('twilio');
const db = require('../db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

console.log('[NOTIFICATION DEBUG] Twilio Initialized with:');
console.log('  SID:', process.env.TWILIO_ACCOUNT_SID ? `${process.env.TWILIO_ACCOUNT_SID.substring(0, 5)}...${process.env.TWILIO_ACCOUNT_SID.slice(-4)}` : 'MISSING');
console.log('  Phone:', process.env.TWILIO_PHONE_NUMBER);

const sendNotification = async (req, res) => {
    const { to, message, type } = req.body;

    if (!to || !message) {
        return res.status(400).json({ success: false, error: 'Recipient and message are required' });
    }

    console.log('[NOTIFICATION DEBUG] Sending to:', to, 'Message:', message, 'Type:', type);
    try {
        let response;
        if (type === 'WhatsApp') {
            response = await client.messages.create({
                from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
                to: `whatsapp:${to}`,
                body: message,
            });
        } else {
            response = await client.messages.create({
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to,
                body: message,
            });
        }

        console.log('[NOTIFICATION DEBUG] Success:', response.sid);
        res.json({ success: true, sid: response.sid });
    } catch (error) {
        console.error('[NOTIFICATION DEBUG] Twilio error:', error);
        const logData = `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\nBody: ${JSON.stringify(req.body)}\n\n`;
        fs.appendFileSync(path.join(__dirname, '../debug_notification.log'), logData);

        // Twilio errors often have a 'code' property
        const statusCode = (error.code && error.code >= 20000) ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to send notification',
            details: error.message
        });
    }
};

const checkAndNotifyLowStock = async (branch_id, threshold = 10) => {
    try {
        // 1. Get total purchased
        const [purchased] = await db.query(
            'SELECT medicine_id, SUM(quantity) AS total_purchased FROM grn_items WHERE branch_id = ? GROUP BY medicine_id',
            [branch_id]
        );

        // 2. Get total sold
        const [sales] = await db.query(
            'SELECT items FROM sales_details WHERE branch_id = ?',
            [branch_id]
        );

        const soldMap = {};
        sales.forEach(row => {
            let items = [];
            try {
                items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
            } catch { }
            if (Array.isArray(items)) {
                items.forEach(item => {
                    if (item.medicineId) { // grn items use medicineId, sales use medicineId or id
                        soldMap[item.medicineId] = (soldMap[item.medicineId] || 0) + (Number(item.quantity) || 0);
                    }
                });
            }
        });

        const lowStockItems = [];
        for (const item of purchased) {
            const sold = soldMap[item.medicine_id] || 0;
            const currentStock = item.total_purchased - sold;
            if (currentStock <= threshold) {
                const [med] = await db.query('SELECT name FROM medicines WHERE id = ?', [item.medicine_id]);
                lowStockItems.push({ id: item.medicine_id, name: med[0]?.name || 'Unknown', stock: currentStock });
            }
        }

        return lowStockItems;
    } catch (error) {
        console.error('Check low stock error:', error);
        throw error;
    }
};

const checkAndNotifyExpiry = async (branch_id, daysThreshold = 30) => {
    try {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
        const thresholdDateStr = thresholdDate.toISOString().split('T')[0];

        const [expiring] = await db.query(
            `SELECT gi.medicine_id, gi.expiry, m.name 
             FROM grn_items gi 
             JOIN medicines m ON gi.medicine_id = m.id 
             WHERE gi.branch_id = ? AND gi.expiry IS NOT NULL AND gi.expiry <= ? AND gi.expiry >= CURDATE()`,
            [branch_id, thresholdDateStr]
        );

        return expiring;
    } catch (error) {
        console.error('Check expiry error:', error);
        throw error;
    }
};

module.exports = {
    sendNotification,
    checkAndNotifyLowStock,
    checkAndNotifyExpiry
};
