const db = require('../db');

// Add a new payment
exports.addPayment = async (req, res) => {
    try {
        const { pay_in_terms_id, amount, date, branch_id } = req.body;
        if (!pay_in_terms_id || !branch_id) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const [result] = await db.query(
            'INSERT INTO pharmacy_payments (pay_in_terms_id, amount, date, branch_id) VALUES (?, ?, ?, ?)',
            [pay_in_terms_id, amount, date || new Date(), branch_id]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get payment history for a customer/terms_id
exports.getPaymentHistory = async (req, res) => {
    try {
        const { pay_in_terms_id } = req.params;
        const { branch_id } = req.query;
        let query = 'SELECT * FROM pharmacy_payments WHERE pay_in_terms_id = ?';
        let params = [pay_in_terms_id];

        if (branch_id) {
            query += ' AND branch_id = ?';
            params.push(branch_id);
        }

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete a payment
exports.deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { branch_id } = req.query;

        let query = 'DELETE FROM pharmacy_payments WHERE id = ?';
        let params = [id];

        if (branch_id) {
            query += ' AND branch_id = ?';
            params.push(branch_id);
        }

        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        res.json({ success: true, message: 'Payment deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};
