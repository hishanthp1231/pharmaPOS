const db = require('../db');

// Create discount
exports.createDiscount = async (req, res) => {
  try {
    // Fix: Some setups (like raw Postman) may not parse JSON automatically
    let body = req.body;
    if (!body || typeof body !== 'object') {
      // Try to parse if body is a string
      try {
        body = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid JSON body' });
      }
    }
    // Defensive: If still not an object, fail
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' });
    }
    // Only use items, remove item
    const { name, type, value, items, startDate, endDate, status, branch_id } = body;
    if (!name || !type || value === undefined || !startDate || !endDate || !status || !branch_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Defensive: ensure value is a number
    const valueNum = typeof value === 'string' ? Number(value) : value;
    if (isNaN(valueNum)) {
      return res.status(400).json({ message: 'Discount value must be a number' });
    }
    // Defensive: ensure branch_id is a number
    const branchIdNum = typeof branch_id === 'string' ? Number(branch_id) : branch_id;
    if (isNaN(branchIdNum)) {
      return res.status(400).json({ message: 'branch_id must be a number' });
    }
    // Debug: log all values before insert
    console.log('[DISCOUNT CREATE DEBUG]', { name, type, valueNum, items, startDate, endDate, status, branchIdNum });
    await db.execute(
      'INSERT INTO discounts (name, type, value, items, startDate, endDate, status, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, type, valueNum, items || '', startDate, endDate, status, branchIdNum]
    );
    res.status(201).json({ message: 'Discount created' });
  } catch (err) {
    console.error('[DISCOUNT CREATE ERROR]', err);
    res.status(500).json({ message: 'Error creating discount', error: err.message });
  }
};

// Get all discounts
exports.getAllDiscounts = async (req, res) => {
  try {
    const branch_id = req.query.branch_id || req.body.branch_id;
    if (!branch_id) {
      return res.status(400).json({ message: "branch_id is required" });
    }
    const [rows] = await db.execute('SELECT * FROM discounts WHERE branch_id = ? ORDER BY id DESC', [branch_id]);
    // Remove items parsing
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching discounts', error: err.message });
  }
};

// Get discount by id
exports.getDiscountById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM discounts WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Discount not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching discount', error: err.message });
  }
};

// Update discount
exports.updateDiscountById = async (req, res) => {
  try {
    const { id } = req.params;
    // Only use items, remove item
    const { name, type, value, items, startDate, endDate, status } = req.body;
    if (!name || !type || !value || !startDate || !endDate || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    await db.execute(
      'UPDATE discounts SET name=?, type=?, value=?, items=?, startDate=?, endDate=?, status=? WHERE id=?',
      [name, type, value, items || '', startDate, endDate, status, id]
    );
    res.json({ message: 'Discount updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating discount', error: err.message });
  }
};

// Delete discount
exports.deleteDiscountById = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute('DELETE FROM discounts WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Discount not found' });
    res.json({ message: 'Discount deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting discount', error: err.message });
  }
};
