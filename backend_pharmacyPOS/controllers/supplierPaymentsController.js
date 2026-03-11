const db = require('../db');

let supplierPaymentsColumnsCache = null;

const DEFAULT_SUPPLIER_PAYMENTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS supplier_payments (
    id INT NOT NULL AUTO_INCREMENT,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_phone VARCHAR(50) DEFAULT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    method VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    branch_id INT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    balance DECIMAL(12,2) DEFAULT 0.00,
    total_due DECIMAL(12,2) DEFAULT 0.00,
    PRIMARY KEY (id)
  )
`;

const parseBranchId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toNumberOr = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isMissingTableError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes("doesn't exist") || message.includes('does not exist');
};

async function ensureSupplierPaymentsTable() {
  await db.query(DEFAULT_SUPPLIER_PAYMENTS_TABLE_SQL);
}

async function getSupplierPaymentsColumns() {
  if (supplierPaymentsColumnsCache) return supplierPaymentsColumnsCache;
  let columns;
  try {
    [columns] = await db.query('SHOW COLUMNS FROM supplier_payments');
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    await ensureSupplierPaymentsTable();
    [columns] = await db.query('SHOW COLUMNS FROM supplier_payments');
  }
  supplierPaymentsColumnsCache = new Set(columns.map(col => col.Field));
  return supplierPaymentsColumnsCache;
}

function normalizePaymentRow(row) {
  return {
    ...row,
    amount: toNumberOr(row.amount, 0),
    total_due: toNumberOr(row.total_due, 0),
    balance: toNumberOr(row.balance, 0)
  };
}

// Get all payments for a branch
exports.getPayments = async (req, res) => {
  const branch_id = parseBranchId(req.query.branch_id);
  try {
    const columns = await getSupplierPaymentsColumns();
    let query = 'SELECT * FROM supplier_payments';
    const params = [];

    if (columns.has('branch_id') && branch_id) {
      query += ' WHERE branch_id = ?';
      params.push(branch_id);
    }

    query += ' ORDER BY date DESC, id DESC';
    const [rows] = await db.query(query, params);
    res.json(rows.map(normalizePaymentRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single payment by id
exports.getPaymentById = async (req, res) => {
  const { id } = req.params;
  const branch_id = parseBranchId(req.query.branch_id);
  try {
    const columns = await getSupplierPaymentsColumns();
    let query = 'SELECT * FROM supplier_payments WHERE id = ?';
    const params = [id];

    if (columns.has('branch_id') && branch_id) {
      query += ' AND branch_id = ?';
      params.push(branch_id);
    }

    const [rows] = await db.query(query, params);
    if (rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json(normalizePaymentRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add new payment
exports.createPayment = async (req, res) => {
  console.log('[DEBUG] createPayment payload:', req.body);
  const { supplier_name, supplier_phone, amount, total_due, balance, method, date, status, branch_id } = req.body;
  const parsedBranchId = parseBranchId(branch_id || req.query.branch_id);

  if (!parsedBranchId) {
    console.error('[ERROR] branch_id is missing in createPayment');
    return res.status(400).json({ error: 'branch_id is required' });
  }

  if (!supplier_name || !String(supplier_name).trim()) {
    return res.status(400).json({ error: 'supplier_name is required' });
  }
  if (amount === undefined || amount === null || amount === '') {
    return res.status(400).json({ error: 'amount is required' });
  }
  if (!method || !String(method).trim()) {
    return res.status(400).json({ error: 'method is required' });
  }
  if (!date) {
    return res.status(400).json({ error: 'date is required' });
  }

  try {
    const columns = await getSupplierPaymentsColumns();
    const data = {};

    if (columns.has('supplier_name')) data.supplier_name = String(supplier_name).trim();
    if (columns.has('supplier_phone')) data.supplier_phone = supplier_phone || '';
    if (columns.has('amount')) data.amount = toNumberOr(amount, 0);
    if (columns.has('method')) data.method = method;
    if (columns.has('date')) data.date = date;
    if (columns.has('status')) data.status = status || 'Pending';
    if (columns.has('branch_id')) data.branch_id = parsedBranchId;
    if (columns.has('total_due')) data.total_due = toNumberOr(total_due, 0);
    if (columns.has('balance')) {
      const computedBalance = toNumberOr(total_due, 0) - toNumberOr(amount, 0);
      data.balance = balance === undefined || balance === null || balance === ''
        ? computedBalance
        : toNumberOr(balance, computedBalance);
    }

    const fieldNames = Object.keys(data);
    if (fieldNames.length === 0) {
      return res.status(400).json({ error: 'No valid supplier_payments fields available for insert' });
    }

    const placeholders = fieldNames.map(() => '?').join(', ');
    const values = fieldNames.map(name => data[name]);
    const [result] = await db.query(
      `INSERT INTO supplier_payments (${fieldNames.join(', ')}) VALUES (${placeholders})`,
      values
    );
    console.log('[DEBUG] Payment created with ID:', result.insertId);
    res.json({ id: result.insertId });
  } catch (err) {
    console.error('[ERROR] createPayment failed:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update payment
exports.updatePayment = async (req, res) => {
  const { id } = req.params;
  const { supplier_name, supplier_phone, amount, total_due, balance, method, date, status, branch_id } = req.body;
  const parsedBranchId = parseBranchId(branch_id || req.query.branch_id);

  try {
    const columns = await getSupplierPaymentsColumns();
    if (columns.has('branch_id') && !parsedBranchId) {
      return res.status(400).json({ error: 'branch_id is required' });
    }

    const updateData = {};
    if (columns.has('supplier_name') && supplier_name !== undefined) updateData.supplier_name = supplier_name;
    if (columns.has('supplier_phone') && supplier_phone !== undefined) updateData.supplier_phone = supplier_phone;
    if (columns.has('amount') && amount !== undefined) updateData.amount = toNumberOr(amount, 0);
    if (columns.has('total_due') && total_due !== undefined) updateData.total_due = toNumberOr(total_due, 0);
    if (columns.has('balance') && balance !== undefined) updateData.balance = toNumberOr(balance, 0);
    if (columns.has('method') && method !== undefined) updateData.method = method;
    if (columns.has('date') && date !== undefined) updateData.date = date;
    if (columns.has('status') && status !== undefined) updateData.status = status;

    const setFields = Object.keys(updateData);
    if (setFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = setFields.map(field => `${field} = ?`).join(', ');
    const params = setFields.map(field => updateData[field]);
    let query = `UPDATE supplier_payments SET ${setClause} WHERE id = ?`;
    params.push(id);

    if (columns.has('branch_id')) {
      query += ' AND branch_id = ?';
      params.push(parsedBranchId);
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete payment
exports.deletePayment = async (req, res) => {
  const { id } = req.params;
  const branch_id = parseBranchId(req.query.branch_id || req.body?.branch_id);
  try {
    const columns = await getSupplierPaymentsColumns();
    if (columns.has('branch_id') && !branch_id) {
      return res.status(400).json({ error: 'branch_id is required' });
    }

    let query = 'DELETE FROM supplier_payments WHERE id = ?';
    const params = [id];
    if (columns.has('branch_id')) {
      query += ' AND branch_id = ?';
      params.push(branch_id);
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
