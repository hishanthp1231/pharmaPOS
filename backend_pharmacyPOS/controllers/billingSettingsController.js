const db = require('../db');

const getBillingSettings = async (req, res) => {
  try {
    const branch_id = req.query.branch_id || req.body.branch_id || 1;
    const [rows] = await db.query(
      'SELECT defaultPaymentMethod, defaultDiscountType, defaultDiscountValue, taxPercentage, receiptFooter FROM billing_settings WHERE branch_id = ? LIMIT 1',
      [branch_id]
    );
    if (rows.length === 0) {
      // Return defaults if not set
      return res.json({
        defaultPaymentMethod: 'Cash',
        defaultDiscountType: 'percentage',
        defaultDiscountValue: 0,
        taxPercentage: 18,
        receiptFooter: 'Thank you for your business!'
      });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch billing settings', error: error.message });
  }
};

const setBillingSettings = async (req, res) => {
  try {
    const branch_id = req.body.branch_id || 1;
    const {
      defaultPaymentMethod,
      defaultDiscountType,
      defaultDiscountValue,
      taxPercentage,
      receiptFooter = 'Thank you for your business!'
    } = req.body;

    // Upsert logic: update if exists, else insert
    const [existing] = await db.query(
      'SELECT id FROM billing_settings WHERE branch_id = ?',
      [branch_id]
    );
    if (existing.length > 0) {
      await db.query(
        `UPDATE billing_settings SET 
          defaultPaymentMethod = ?, 
          defaultDiscountType = ?, 
          defaultDiscountValue = ?, 
          taxPercentage = ?,
          receiptFooter = ?
         WHERE branch_id = ?`,
        [defaultPaymentMethod, defaultDiscountType, defaultDiscountValue, taxPercentage, receiptFooter, branch_id]
      );
    } else {
      await db.query(
        `INSERT INTO billing_settings 
          (branch_id, defaultPaymentMethod, defaultDiscountType, defaultDiscountValue, taxPercentage, receiptFooter)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [branch_id, defaultPaymentMethod, defaultDiscountType, defaultDiscountValue, taxPercentage, receiptFooter]
      );
    }
    res.json({ success: true, message: 'Billing settings saved' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save billing settings', error: error.message });
  }
};

module.exports = { getBillingSettings, setBillingSettings };
