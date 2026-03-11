const db = require('../db'); // Assumes you have a db.js exporting a connection/pool

exports.getSuppliers = async (req, res) => {
  const branch_id = req.query.branch_id;
  try {
    let query = 'SELECT * FROM suppliers';
    let params = [];
    if (branch_id && branch_id !== 'all' && branch_id !== 'undefined') {
      query += ' WHERE branch_id = ?';
      params.push(branch_id);
    }
    query += ' ORDER BY id DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSupplierById = async (req, res) => {
  const { id } = req.params;
  const branch_id = req.query.branch_id;
  try {
    const [rows] = await db.query(
      'SELECT * FROM suppliers WHERE id = ? AND branch_id = ?',
      [id, branch_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSupplier = async (req, res) => {
  const { name, address, email, phone, status, branch_id } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO suppliers (name, address, email, phone, status, branch_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, address, email, phone, status, branch_id]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSupplier = async (req, res) => {
  const { id } = req.params;
  const { name, address, email, phone, status, branch_id } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE suppliers SET name=?, address=?, email=?, phone=?, status=? WHERE id=? AND branch_id=?',
      [name, address, email, phone, status, id, branch_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  const { id } = req.params;
  const branch_id = req.query.branch_id;
  try {
    const [result] = await db.query(
      'DELETE FROM suppliers WHERE id=? AND branch_id=?',
      [id, branch_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
