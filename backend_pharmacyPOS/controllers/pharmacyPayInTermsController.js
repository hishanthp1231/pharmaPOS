const db = require('../db');

const tableColumnsCache = {};

const DEFAULT_PAY_IN_TERMS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS pharmacy_pay_in_terms (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(50) DEFAULT NULL,
    prescriptionId VARCHAR(50) DEFAULT NULL,
    medicineBatch VARCHAR(100) DEFAULT NULL,
    expiryDate DATE DEFAULT NULL,
    pharmacistNotes TEXT,
    creditLimit DECIMAL(12,2) DEFAULT 0.00,
    termDuration VARCHAR(50) DEFAULT NULL,
    paymentCycle VARCHAR(50) DEFAULT NULL,
    invoiceDate DATE DEFAULT NULL,
    dueDate DATE DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    branch_id INT DEFAULT NULL,
    PRIMARY KEY (id)
  )
`;

const DEFAULT_PHARMACY_PAYMENTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS pharmacy_payments (
    id INT NOT NULL AUTO_INCREMENT,
    pay_in_terms_id INT NOT NULL,
    date DATE DEFAULT NULL,
    amount DECIMAL(12,2) DEFAULT NULL,
    notes TEXT,
    branch_id INT DEFAULT NULL,
    PRIMARY KEY (id)
  )
`;

const EXPECTED_PAY_IN_TERMS_COLUMNS = {
  name: '`name` VARCHAR(100) DEFAULT NULL',
  contact: '`contact` VARCHAR(50) DEFAULT NULL',
  prescriptionId: '`prescriptionId` VARCHAR(50) DEFAULT NULL',
  medicineBatch: '`medicineBatch` VARCHAR(100) DEFAULT NULL',
  expiryDate: '`expiryDate` DATE DEFAULT NULL',
  pharmacistNotes: '`pharmacistNotes` TEXT',
  creditLimit: '`creditLimit` DECIMAL(12,2) DEFAULT 0.00',
  termDuration: '`termDuration` VARCHAR(50) DEFAULT NULL',
  paymentCycle: '`paymentCycle` VARCHAR(50) DEFAULT NULL',
  invoiceDate: '`invoiceDate` DATE DEFAULT NULL',
  dueDate: '`dueDate` DATE DEFAULT NULL',
  branch_id: '`branch_id` INT DEFAULT NULL',
  created_at: '`created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
};

const parseBranchId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toNumberOr = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const isMissingTableError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes("doesn't exist") || message.includes('does not exist');
};

async function ensureTable(tableName) {
  if (tableName === 'pharmacy_pay_in_terms') {
    await db.query(DEFAULT_PAY_IN_TERMS_TABLE_SQL);
    return;
  }
  if (tableName === 'pharmacy_payments') {
    await db.query(DEFAULT_PHARMACY_PAYMENTS_TABLE_SQL);
  }
}

async function ensureColumns(tableName, columnsSet, expectedColumns) {
  for (const [field, definition] of Object.entries(expectedColumns)) {
    if (columnsSet.has(field)) continue;
    try {
      await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
      columnsSet.add(field);
    } catch (error) {
      const message = String(error?.message || '').toLowerCase();
      if (message.includes('duplicate column')) {
        columnsSet.add(field);
        continue;
      }
      throw error;
    }
  }
}

async function getTableColumns(tableName) {
  if (tableColumnsCache[tableName]) return tableColumnsCache[tableName];
  let columns;
  try {
    [columns] = await db.query(`SHOW COLUMNS FROM ${tableName}`);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    await ensureTable(tableName);
    [columns] = await db.query(`SHOW COLUMNS FROM ${tableName}`);
  }
  const columnsSet = new Set(columns.map(col => col.Field));

  if (tableName === 'pharmacy_pay_in_terms') {
    await ensureColumns(tableName, columnsSet, EXPECTED_PAY_IN_TERMS_COLUMNS);
  }

  tableColumnsCache[tableName] = columnsSet;
  return tableColumnsCache[tableName];
}

function normalizePayInTermsRow(row) {
  const creditLimit = row.creditLimit ?? row.total_amount ?? 0;
  return {
    ...row,
    name: row.name ?? row.title ?? '',
    contact: row.contact ?? '',
    prescriptionId: row.prescriptionId ?? '',
    medicineBatch: row.medicineBatch ?? '',
    expiryDate: normalizeDate(row.expiryDate),
    pharmacistNotes: row.pharmacistNotes ?? '',
    creditLimit: toNumberOr(creditLimit, 0),
    termDuration: row.termDuration ?? '',
    paymentCycle: row.paymentCycle ?? '',
    invoiceDate: normalizeDate(row.invoiceDate),
    dueDate: normalizeDate(row.dueDate),
    paid_amount: toNumberOr(row.paid_amount, 0),
    balance_amount: toNumberOr(row.balance_amount, 0),
    status: row.status ?? ''
  };
}

exports.getAll = async (req, res) => {
  console.log('[DEBUG] pharmacyPayInTermsController.getAll called', req.query);
  try {
    const branch_id = parseBranchId(req.query.branch_id);
    const columns = await getTableColumns('pharmacy_pay_in_terms');
    let query = 'SELECT * FROM pharmacy_pay_in_terms';
    const params = [];

    if (columns.has('branch_id') && branch_id) {
      query += ' WHERE branch_id = ?';
      params.push(branch_id);
    }

    query += ' ORDER BY id DESC';
    const [rows] = await db.query(query, params);
    let normalized = rows.map(normalizePayInTermsRow);

    const category = req.query.category;
    const paymentCycle = req.query.paymentCycle;
    const termDuration = req.query.termDuration;

    if (category && category !== 'all' && normalized.some(row => row.category)) {
      normalized = normalized.filter(row => row.category === category);
    }
    if (paymentCycle && paymentCycle !== 'all') {
      normalized = normalized.filter(row => row.paymentCycle === paymentCycle);
    }
    if (termDuration && termDuration !== 'all') {
      normalized = normalized.filter(row => row.termDuration === termDuration);
    }

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { id } = req.params;
    const branch_id = parseBranchId(req.query.branch_id);
    const columns = await getTableColumns('pharmacy_payments');

    let query = 'SELECT * FROM pharmacy_payments WHERE pay_in_terms_id = ?';
    const params = [id];

    if (columns.has('branch_id') && branch_id) {
      query += ' AND branch_id = ?';
      params.push(branch_id);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  console.log('[DEBUG] pharmacyPayInTerms create payload:', req.body);
  try {
    const payload = req.body || {};
    const branch_id = parseBranchId(payload.branch_id || req.query.branch_id);
    const columns = await getTableColumns('pharmacy_pay_in_terms');

    if (columns.has('branch_id') && !branch_id) {
      return res.status(400).json({ error: 'branch_id is required' });
    }
    if (columns.has('name') && !payload.name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const data = {};

    if (columns.has('name')) data.name = payload.name;
    if (columns.has('contact')) data.contact = payload.contact || '';
    if (columns.has('prescriptionId')) data.prescriptionId = payload.prescriptionId || '';
    if (columns.has('medicineBatch')) data.medicineBatch = payload.medicineBatch || '';
    if (columns.has('expiryDate')) data.expiryDate = normalizeDate(payload.expiryDate);
    if (columns.has('pharmacistNotes')) data.pharmacistNotes = payload.pharmacistNotes || '';
    if (columns.has('creditLimit')) data.creditLimit = toNumberOr(payload.creditLimit, 0);
    if (columns.has('termDuration')) data.termDuration = payload.termDuration || '';
    if (columns.has('paymentCycle')) data.paymentCycle = payload.paymentCycle || '';
    if (columns.has('invoiceDate')) data.invoiceDate = normalizeDate(payload.invoiceDate);
    if (columns.has('dueDate')) data.dueDate = normalizeDate(payload.dueDate);
    if (columns.has('branch_id')) data.branch_id = branch_id;

    if (columns.has('title')) data.title = payload.title || payload.name || 'Pay In Terms';
    if (columns.has('total_amount')) data.total_amount = toNumberOr(payload.total_amount ?? payload.creditLimit, 0);
    if (columns.has('paid_amount')) data.paid_amount = toNumberOr(payload.paid_amount, 0);
    if (columns.has('balance_amount')) {
      const total = toNumberOr(payload.total_amount ?? payload.creditLimit, 0);
      const paid = toNumberOr(payload.paid_amount, 0);
      data.balance_amount = payload.balance_amount === undefined ? (total - paid) : toNumberOr(payload.balance_amount, total - paid);
    }
    if (columns.has('status')) data.status = payload.status || 'Pending';

    const entries = Object.entries(data).filter(([, value]) => value !== undefined);
    if (entries.length === 0) {
      return res.status(400).json({ error: 'No valid fields found for insert' });
    }

    const fieldNames = entries.map(([field]) => field);
    const placeholders = entries.map(() => '?').join(', ');
    const values = entries.map(([, value]) => value);
    const [result] = await db.query(
      `INSERT INTO pharmacy_pay_in_terms (${fieldNames.join(', ')}) VALUES (${placeholders})`,
      values
    );

    res.json({ message: 'Created', id: result.insertId });
  } catch (err) {
    console.error('[ERROR] pharmacyPayInTerms create failed:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const columns = await getTableColumns('pharmacy_pay_in_terms');
    const branch_id = parseBranchId(payload.branch_id || req.query.branch_id);

    if (columns.has('branch_id') && !branch_id) {
      return res.status(400).json({ error: 'branch_id is required' });
    }

    let existsQuery = 'SELECT id FROM pharmacy_pay_in_terms WHERE id = ?';
    const existsParams = [id];
    if (columns.has('branch_id')) {
      existsQuery += ' AND branch_id = ?';
      existsParams.push(branch_id);
    }

    const [existing] = await db.query(existsQuery, existsParams);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Not found for this branch' });
    }

    const updateData = {};

    if (columns.has('name') && payload.name !== undefined) updateData.name = payload.name;
    if (columns.has('contact') && payload.contact !== undefined) updateData.contact = payload.contact;
    if (columns.has('prescriptionId') && payload.prescriptionId !== undefined) updateData.prescriptionId = payload.prescriptionId;
    if (columns.has('medicineBatch') && payload.medicineBatch !== undefined) updateData.medicineBatch = payload.medicineBatch;
    if (columns.has('expiryDate') && payload.expiryDate !== undefined) updateData.expiryDate = normalizeDate(payload.expiryDate);
    if (columns.has('pharmacistNotes') && payload.pharmacistNotes !== undefined) updateData.pharmacistNotes = payload.pharmacistNotes;
    if (columns.has('creditLimit') && payload.creditLimit !== undefined) updateData.creditLimit = toNumberOr(payload.creditLimit, 0);
    if (columns.has('termDuration') && payload.termDuration !== undefined) updateData.termDuration = payload.termDuration;
    if (columns.has('paymentCycle') && payload.paymentCycle !== undefined) updateData.paymentCycle = payload.paymentCycle;
    if (columns.has('invoiceDate') && payload.invoiceDate !== undefined) updateData.invoiceDate = normalizeDate(payload.invoiceDate);
    if (columns.has('dueDate') && payload.dueDate !== undefined) updateData.dueDate = normalizeDate(payload.dueDate);

    if (columns.has('title') && payload.title !== undefined) updateData.title = payload.title;
    if (columns.has('total_amount') && (payload.total_amount !== undefined || payload.creditLimit !== undefined)) {
      updateData.total_amount = toNumberOr(payload.total_amount ?? payload.creditLimit, 0);
    }
    if (columns.has('paid_amount') && payload.paid_amount !== undefined) {
      updateData.paid_amount = toNumberOr(payload.paid_amount, 0);
    }
    if (columns.has('balance_amount') && (payload.balance_amount !== undefined || payload.total_amount !== undefined || payload.creditLimit !== undefined || payload.paid_amount !== undefined)) {
      if (payload.balance_amount !== undefined) {
        updateData.balance_amount = toNumberOr(payload.balance_amount, 0);
      } else {
        const total = toNumberOr(payload.total_amount ?? payload.creditLimit, 0);
        const paid = toNumberOr(payload.paid_amount, 0);
        updateData.balance_amount = total - paid;
      }
    }
    if (columns.has('status') && payload.status !== undefined) updateData.status = payload.status;

    const setFields = Object.keys(updateData);
    if (setFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = setFields.map(field => `${field} = ?`).join(', ');
    const params = setFields.map(field => updateData[field]);
    let query = `UPDATE pharmacy_pay_in_terms SET ${setClause} WHERE id = ?`;
    params.push(id);

    if (columns.has('branch_id')) {
      query += ' AND branch_id = ?';
      params.push(branch_id);
    }

    await db.query(query, params);
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const columns = await getTableColumns('pharmacy_pay_in_terms');
    const branch_id = parseBranchId(req.body.branch_id || req.query.branch_id);

    if (columns.has('branch_id') && !branch_id) {
      return res.status(400).json({ error: 'branch_id is required' });
    }

    let query = 'DELETE FROM pharmacy_pay_in_terms WHERE id = ?';
    const params = [id];
    if (columns.has('branch_id')) {
      query += ' AND branch_id = ?';
      params.push(branch_id);
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not found for this branch' });
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
