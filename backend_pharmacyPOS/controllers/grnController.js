const db = require('../db');

// Add a new GRN (purchase batch)
exports.addGRN = async (req, res) => {
  try {
    console.log('Received GRN payload:', req.body);
    const { branch_id, date, supplier, invoice, items } = req.body;
    if (!branch_id || !date || !supplier || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'All fields and at least one item are required' });
    }
    // Generate new grn_id
    const [grnRows] = await db.query('SELECT MAX(grn_id) AS maxId FROM grn_items');
    const newGrnId = (grnRows[0].maxId || 0) + 1;
    // Insert items, each with batch details and grn_id
    for (const item of items) {
      // Fix expiry date format if present
      let expiry = item.expiry || null;
      if (expiry && typeof expiry === 'string') {
        // Accept only 'YYYY-MM-DD' for MySQL DATE
        if (expiry.includes('T')) {
          expiry = expiry.split('T')[0];
        }
      }
      const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.mrp) || 0);
      await db.query(
        'INSERT INTO grn_items (grn_id, branch_id, medicine_id, quantity, unit, mrp, retail, wholesale, expiry, supplier, date, invoice, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',        [
          newGrnId,
          branch_id,
          item.medicineId,
          item.quantity,
          item.unit || null,
          item.mrp,
          item.retail || null,
          item.wholesale || null,
          expiry,
          supplier,
          date,
          invoice || null,
          itemTotal
        ]
      );
    }
    res.status(201).json({ message: 'GRN saved', grnId: newGrnId });
  } catch (err) {
    console.error('Error in addGRN:', err);
    res.status(500).json({ message: 'Failed to save GRN', error: err.message });
  }
};

// Fetch all GRN batches (grouped by grn_id)
exports.getGRNs = async (req, res) => {
  try {
    const branch_id = req.query.branch_id;
    let query = `
      SELECT
        grn_id, supplier, date, invoice
      FROM grn_items
    `;
    let params = [];
    if (branch_id) {
      query += ' WHERE branch_id = ?';
      params.push(branch_id);
    }
    query += ' GROUP BY grn_id, supplier, date, invoice ORDER BY date DESC';
    const [rows] = await db.query(query, params);

    // For each batch, fetch items
    const batches = [];
    for (const row of rows) {
      const [items] = await db.query(
        `SELECT gi.*, m.name AS medicine_name
         FROM grn_items gi
         JOIN medicines m ON gi.medicine_id = m.id
         WHERE gi.grn_id = ?`,
        [row.grn_id]
      );
      batches.push({
        grn_id: row.grn_id,
        supplier: row.supplier,
        date: row.date,
        invoice: row.invoice,
        items
      });
    }
    res.json({ data: batches });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch GRNs', error: err.message });
  }
};

// Get all GRN batches with optional branch filter
exports.getAll = async (req, res) => {
  try {
    const branch_id = req.query.branch_id;
    let query = 'SELECT * FROM grn_batches';
    let params = [];
    if (branch_id) {
      query += ' WHERE branch_id = ?';
      params.push(branch_id);
    }
    query += ' ORDER BY grn_id DESC';
    const [rows] = await db.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch GRN batches', error: err.message });
  }
};

// Update an existing GRN (purchase batch)
exports.updateGRN = async (req, res) => {
  try {
    const grn_id = req.params.grn_id;
    console.log('updateGRN called for grn_id:', grn_id, 'body:', req.body);
    const { branch_id, date, supplier, invoice, items } = req.body;
    if (!grn_id || !branch_id || !date || !supplier || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'All fields and at least one item are required' });
    }
    // Delete old items
    await db.query('DELETE FROM grn_items WHERE grn_id = ?', [grn_id]);
    // Insert new items with the same grn_id
    for (const item of items) {
      let expiry = item.expiry || null;
      if (expiry && typeof expiry === 'string') {
        if (expiry.includes('T')) {
          expiry = expiry.split('T')[0];
        }
      }
      const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.mrp) || 0);
      await db.query(
        'INSERT INTO grn_items (grn_id, branch_id, medicine_id, quantity, unit, mrp, retail, wholesale, expiry, supplier, date, invoice, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',        [
          grn_id,
          branch_id,
          item.medicineId,
          item.quantity,
          item.unit || null,
          item.mrp,
          item.retail || null,
          item.wholesale || null,
          expiry,
          supplier,
          date,
          invoice || null,
          itemTotal
        ]
      );
    }
    res.status(200).json({ message: 'GRN updated', grnId: grn_id });
  } catch (err) {
    console.error('Error in updateGRN:', err);
    res.status(500).json({ message: 'Failed to update GRN', error: err.message });
  }
};

// Delete a GRN (all items with given grn_id)
exports.deleteGRN = async (req, res) => {
  try {
    const grn_id = req.params.grn_id;
    if (!grn_id) {
      return res.status(400).json({ message: 'GRN ID required' });
    }
    await db.query('DELETE FROM grn_items WHERE grn_id = ?', [grn_id]);
    res.status(200).json({ message: 'GRN deleted', grnId: grn_id });
  } catch (err) {
    console.error('Error in deleteGRN:', err);
    res.status(500).json({ message: 'Failed to delete GRN', error: err.message });
  }
};

// Get total purchased quantity for all medicines up to today
exports.getPurchasedQuantities = async (req, res) => {
  try {
    const branch_id = req.query.branch_id;
    const today = new Date().toISOString().slice(0, 10);
    let query = `
      SELECT medicine_id, SUM(quantity) AS total_purchased
      FROM grn_items
      WHERE date <= ?`;
    let params = [today];
    if (branch_id) {
      query += ' AND branch_id = ?';
      params.push(branch_id);
    }
    query += ' GROUP BY medicine_id';
    const [rows] = await db.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch purchased quantities', error: err.message });
  }
};
