const db = require('../db');

const tableColumnsCache = {};
const ALLOWED_REASON_MAP = {
  'wrong medicine': 'Wrong Medicine',
  wrong_medicine: 'Wrong Medicine',
  wrongmedicine: 'Wrong Medicine',
  'expiry date': 'Expiry Date',
  expiry_date: 'Expiry Date',
  expirydate: 'Expiry Date',
  'expired medicine': 'Expiry Date'
};
const WRONG_MEDICINE_REASON = 'Wrong Medicine';

const DEFAULT_RETURNS_REFUNDS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS pharmacy_returns_refunds (
    id INT NOT NULL AUTO_INCREMENT,
    date DATE DEFAULT NULL,
    medicine VARCHAR(100) DEFAULT NULL,
    batch VARCHAR(50) DEFAULT NULL,
    expiry DATE DEFAULT NULL,
    billNumber VARCHAR(100) DEFAULT NULL,
    order_id INT DEFAULT NULL,
    product_id INT DEFAULT NULL,
    quantity INT DEFAULT 1,
    reason VARCHAR(255) DEFAULT NULL,
    refundAmount DECIMAL(12,2) DEFAULT NULL,
    amount DECIMAL(12,2) DEFAULT NULL,
    method VARCHAR(50) DEFAULT NULL,
    pharmacistNotes TEXT,
    customerName VARCHAR(100) DEFAULT NULL,
    customerContact VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    branch_id INT DEFAULT NULL,
    PRIMARY KEY (id)
  )
`;

const EXPECTED_RETURNS_REFUNDS_COLUMNS = {
  date: '`date` DATE DEFAULT NULL',
  medicine: '`medicine` VARCHAR(100) DEFAULT NULL',
  batch: '`batch` VARCHAR(50) DEFAULT NULL',
  expiry: '`expiry` DATE DEFAULT NULL',
  billNumber: '`billNumber` VARCHAR(100) DEFAULT NULL',
  order_id: '`order_id` INT DEFAULT NULL',
  product_id: '`product_id` INT DEFAULT NULL',
  quantity: '`quantity` INT DEFAULT 1',
  reason: '`reason` VARCHAR(255) DEFAULT NULL',
  refundAmount: '`refundAmount` DECIMAL(12,2) DEFAULT NULL',
  amount: '`amount` DECIMAL(12,2) DEFAULT NULL',
  method: '`method` VARCHAR(50) DEFAULT NULL',
  pharmacistNotes: '`pharmacistNotes` TEXT',
  customerName: '`customerName` VARCHAR(100) DEFAULT NULL',
  customerContact: '`customerContact` VARCHAR(50) DEFAULT NULL',
  created_at: '`created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP',
  branch_id: '`branch_id` INT DEFAULT NULL'
};

const parseBranchId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toNumberOr = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toPositiveInt = (value, fallback = 1) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
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

const normalizeBillNumber = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const normalizeReason = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  return ALLOWED_REASON_MAP[normalized.toLowerCase()] || null;
};

const normalizeProductId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const shouldRestockForReason = (reason) => reason === WRONG_MEDICINE_REASON;

async function resolveMedicineId(connection, branch_id, productId, medicineName) {
  if (productId) return productId;
  const normalizedName = String(medicineName || '').trim();
  if (!normalizedName) return null;
  const [rows] = await connection.query(
    'SELECT id FROM medicines WHERE branch_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1',
    [branch_id, normalizedName]
  );
  return rows[0]?.id || null;
}

async function applyStockDelta(connection, branch_id, medicineId, deltaQty) {
  if (!medicineId || !deltaQty) return;
  await connection.query(
    'UPDATE medicines SET quantity = GREATEST(0, quantity + ?) WHERE id = ? AND branch_id = ?',
    [deltaQty, medicineId, branch_id]
  );
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
    if (tableName === 'pharmacy_returns_refunds') {
      await db.query(DEFAULT_RETURNS_REFUNDS_TABLE_SQL);
    }
    [columns] = await db.query(`SHOW COLUMNS FROM ${tableName}`);
  }
  const columnsSet = new Set(columns.map(col => col.Field));

  if (tableName === 'pharmacy_returns_refunds') {
    await ensureColumns(tableName, columnsSet, EXPECTED_RETURNS_REFUNDS_COLUMNS);
  }

  tableColumnsCache[tableName] = columnsSet;
  return tableColumnsCache[tableName];
}

function normalizeRefundRow(row) {
  return {
    ...row,
    date: normalizeDate(row.date),
    medicine: row.medicine ?? (row.product_id != null ? String(row.product_id) : ''),
    product_id: normalizeProductId(row.product_id),
    quantity: toPositiveInt(row.quantity, 1),
    batch: row.batch ?? '',
    expiry: normalizeDate(row.expiry),
    billNumber: row.billNumber ?? row.bill_number ?? '',
    reason: row.reason ?? '',
    refundAmount: toNumberOr(row.refundAmount ?? row.amount, 0),
    method: row.method ?? '',
    pharmacistNotes: row.pharmacistNotes ?? '',
    customerName: row.customerName ?? '',
    customerContact: row.customerContact ?? ''
  };
}

exports.getAll = async (req, res) => {
  try {
    const branch_id = parseBranchId(req.query.branch_id);
    const columns = await getTableColumns('pharmacy_returns_refunds');

    let query = 'SELECT * FROM pharmacy_returns_refunds';
    const params = [];
    if (columns.has('branch_id') && branch_id) {
      query += ' WHERE branch_id = ?';
      params.push(branch_id);
    }
    query += ' ORDER BY id DESC';

    const [rows] = await db.query(query, params);
    let normalized = rows.map(normalizeRefundRow);

    const category = req.query.category;
    const method = req.query.method;
    const reason = req.query.reason;

    if (category && category !== 'all' && normalized.some(row => row.category)) {
      normalized = normalized.filter(row => row.category === category);
    }
    if (method && method !== 'all') {
      normalized = normalized.filter(row => row.method === method);
    }
    if (reason && reason !== 'all') {
      const normalizedReason = normalizeReason(reason);
      normalized = normalizedReason
        ? normalized.filter(row => row.reason === normalizedReason)
        : [];
    }

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  console.log('[DEBUG] pharmacyReturnsRefunds create payload:', req.body);
  try {
    const payload = req.body || {};
    const columns = await getTableColumns('pharmacy_returns_refunds');
    const branch_id = parseBranchId(payload.branch_id || req.query.branch_id);
    const normalizedReason = normalizeReason(payload.reason);
    const billNumber = normalizeBillNumber(payload.billNumber || payload.bill_number);
    const payloadProductId = normalizeProductId(payload.product_id ?? payload.productId);
    const normalizedQuantity = toPositiveInt(payload.quantity, 1);

    if (columns.has('branch_id') && !branch_id) {
      return res.status(400).json({ error: 'branch_id is required' });
    }
    if (!normalizedReason) {
      return res.status(400).json({ error: 'reason must be Wrong Medicine or Expiry Date' });
    }
    if (!billNumber) {
      return res.status(400).json({ error: 'billNumber is required' });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const resolvedMedicineId = await resolveMedicineId(
        connection,
        branch_id,
        payloadProductId,
        payload.medicine
      );
      if (shouldRestockForReason(normalizedReason) && !resolvedMedicineId) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Medicine not found for stock update' });
      }

      const data = {};
      if (columns.has('date')) data.date = normalizeDate(payload.date) || normalizeDate(new Date());
      if (columns.has('medicine')) data.medicine = payload.medicine || '';
      if (columns.has('batch')) data.batch = payload.batch || '';
      if (columns.has('expiry')) data.expiry = normalizeDate(payload.expiry);
      if (columns.has('billNumber')) data.billNumber = billNumber;
      if (columns.has('reason')) data.reason = normalizedReason;
      if (columns.has('refundAmount')) data.refundAmount = toNumberOr(payload.refundAmount, 0);
      if (columns.has('method')) data.method = payload.method || '';
      if (columns.has('pharmacistNotes')) data.pharmacistNotes = payload.pharmacistNotes || '';
      if (columns.has('customerName')) data.customerName = payload.customerName || '';
      if (columns.has('customerContact')) data.customerContact = payload.customerContact || '';
      if (columns.has('branch_id')) data.branch_id = branch_id;
      if (columns.has('order_id')) data.order_id = payload.order_id ?? null;
      if (columns.has('product_id')) data.product_id = payloadProductId ?? resolvedMedicineId;
      if (columns.has('quantity')) data.quantity = normalizedQuantity;
      if (columns.has('amount')) data.amount = toNumberOr(payload.amount ?? payload.refundAmount, 0);

      const entries = Object.entries(data).filter(([, value]) => value !== undefined);
      if (entries.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'No valid fields found for insert' });
      }

      const fieldNames = entries.map(([field]) => field);
      const placeholders = entries.map(() => '?').join(', ');
      const values = entries.map(([, value]) => value);
      const [result] = await connection.query(
        `INSERT INTO pharmacy_returns_refunds (${fieldNames.join(', ')}) VALUES (${placeholders})`,
        values
      );

      if (shouldRestockForReason(normalizedReason)) {
        await applyStockDelta(connection, branch_id, resolvedMedicineId, normalizedQuantity);
      }

      await connection.commit();
      connection.release();
      res.json({ message: 'Created', id: result.insertId });
    } catch (transactionErr) {
      await connection.rollback();
      connection.release();
      throw transactionErr;
    }
  } catch (err) {
    console.error('[ERROR] pharmacyReturnsRefunds create failed:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const columns = await getTableColumns('pharmacy_returns_refunds');
    const branch_id = parseBranchId(payload.branch_id || req.query.branch_id);
    const incomingReason = payload.reason;
    const incomingBillNumber = payload.billNumber ?? payload.bill_number;
    const incomingProductId = payload.product_id ?? payload.productId;
    const incomingQuantity = payload.quantity;

    if (columns.has('branch_id') && !branch_id) {
      return res.status(400).json({ error: 'branch_id is required' });
    }

    const existingFields = ['id'];
    if (columns.has('reason')) existingFields.push('reason');
    if (columns.has('quantity')) existingFields.push('quantity');
    if (columns.has('medicine')) existingFields.push('medicine');
    if (columns.has('product_id')) existingFields.push('product_id');

    let existsQuery = `SELECT ${existingFields.join(', ')} FROM pharmacy_returns_refunds WHERE id = ?`;
    const existsParams = [id];
    if (columns.has('branch_id')) {
      existsQuery += ' AND branch_id = ?';
      existsParams.push(branch_id);
    }

    const [existing] = await db.query(existsQuery, existsParams);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Not found for this branch' });
    }
    const existingRow = existing[0];

    const updateData = {};
    let normalizedIncomingReason = null;

    if (columns.has('date') && payload.date !== undefined) updateData.date = normalizeDate(payload.date);
    if (columns.has('medicine') && payload.medicine !== undefined) updateData.medicine = payload.medicine;
    if (columns.has('batch') && payload.batch !== undefined) updateData.batch = payload.batch;
    if (columns.has('expiry') && payload.expiry !== undefined) updateData.expiry = normalizeDate(payload.expiry);
    if (columns.has('billNumber') && incomingBillNumber !== undefined) {
      const normalizedBillNumber = normalizeBillNumber(incomingBillNumber);
      if (!normalizedBillNumber) {
        return res.status(400).json({ error: 'billNumber cannot be empty' });
      }
      updateData.billNumber = normalizedBillNumber;
    }
    if (columns.has('reason') && incomingReason !== undefined) {
      normalizedIncomingReason = normalizeReason(incomingReason);
      if (!normalizedIncomingReason) {
        return res.status(400).json({ error: 'reason must be Wrong Medicine or Expiry Date' });
      }
      updateData.reason = normalizedIncomingReason;
    }
    if (columns.has('refundAmount') && payload.refundAmount !== undefined) updateData.refundAmount = toNumberOr(payload.refundAmount, 0);
    if (columns.has('method') && payload.method !== undefined) updateData.method = payload.method;
    if (columns.has('pharmacistNotes') && payload.pharmacistNotes !== undefined) updateData.pharmacistNotes = payload.pharmacistNotes;
    if (columns.has('customerName') && payload.customerName !== undefined) updateData.customerName = payload.customerName;
    if (columns.has('customerContact') && payload.customerContact !== undefined) updateData.customerContact = payload.customerContact;

    if (columns.has('order_id') && payload.order_id !== undefined) updateData.order_id = payload.order_id;
    if (columns.has('product_id') && incomingProductId !== undefined) {
      updateData.product_id = normalizeProductId(incomingProductId);
    }
    if (columns.has('quantity') && incomingQuantity !== undefined) updateData.quantity = toPositiveInt(incomingQuantity, 1);
    if (columns.has('amount') && (payload.amount !== undefined || payload.refundAmount !== undefined)) {
      updateData.amount = toNumberOr(payload.amount ?? payload.refundAmount, 0);
    }

    const setFields = Object.keys(updateData);
    if (setFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = setFields.map(field => `${field} = ?`).join(', ');
    const params = setFields.map(field => updateData[field]);
    let query = `UPDATE pharmacy_returns_refunds SET ${setClause} WHERE id = ?`;
    params.push(id);

    if (columns.has('branch_id')) {
      query += ' AND branch_id = ?';
      params.push(branch_id);
    }

    const previousReason = normalizeReason(existingRow.reason) || existingRow.reason;
    const nextReason = normalizedIncomingReason || previousReason;
    const previousQuantity = toPositiveInt(existingRow.quantity, 1);
    const nextQuantity = columns.has('quantity') && incomingQuantity !== undefined
      ? toPositiveInt(incomingQuantity, 1)
      : previousQuantity;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const previousProductId = normalizeProductId(existingRow.product_id);
      const nextProductId = incomingProductId !== undefined
        ? normalizeProductId(incomingProductId)
        : previousProductId;
      const previousMedicineName = existingRow.medicine || '';
      const nextMedicineName = payload.medicine !== undefined ? payload.medicine : previousMedicineName;

      const previousMedicineId = await resolveMedicineId(
        connection,
        branch_id,
        previousProductId,
        previousMedicineName
      );
      const nextMedicineId = await resolveMedicineId(
        connection,
        branch_id,
        nextProductId,
        nextMedicineName
      );

      if (shouldRestockForReason(nextReason) && !nextMedicineId) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Medicine not found for stock update' });
      }

      await connection.query(query, params);

      if (shouldRestockForReason(previousReason)) {
        await applyStockDelta(connection, branch_id, previousMedicineId, -previousQuantity);
      }
      if (shouldRestockForReason(nextReason)) {
        await applyStockDelta(connection, branch_id, nextMedicineId, nextQuantity);
      }

      await connection.commit();
      connection.release();
      res.json({ message: 'Updated' });
    } catch (transactionErr) {
      await connection.rollback();
      connection.release();
      throw transactionErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const columns = await getTableColumns('pharmacy_returns_refunds');
    const branch_id = parseBranchId(req.query.branch_id || req.body?.branch_id);

    if (columns.has('branch_id') && !branch_id) {
      return res.status(400).json({ error: 'branch_id is required' });
    }

    const selectFields = ['id'];
    if (columns.has('reason')) selectFields.push('reason');
    if (columns.has('quantity')) selectFields.push('quantity');
    if (columns.has('medicine')) selectFields.push('medicine');
    if (columns.has('product_id')) selectFields.push('product_id');

    let getQuery = `SELECT ${selectFields.join(', ')} FROM pharmacy_returns_refunds WHERE id = ?`;
    const getParams = [id];
    if (columns.has('branch_id')) {
      getQuery += ' AND branch_id = ?';
      getParams.push(branch_id);
    }
    const [existingRows] = await db.query(getQuery, getParams);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Not found for this branch' });
    }
    const existing = existingRows[0];

    let query = 'DELETE FROM pharmacy_returns_refunds WHERE id = ?';
    const params = [id];
    if (columns.has('branch_id')) {
      query += ' AND branch_id = ?';
      params.push(branch_id);
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(query, params);
      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Not found for this branch' });
      }

      const existingReason = normalizeReason(existing.reason) || existing.reason;
      if (shouldRestockForReason(existingReason)) {
        const existingQuantity = toPositiveInt(existing.quantity, 1);
        const existingMedicineId = await resolveMedicineId(
          connection,
          branch_id,
          normalizeProductId(existing.product_id),
          existing.medicine
        );
        await applyStockDelta(connection, branch_id, existingMedicineId, -existingQuantity);
      }

      await connection.commit();
      connection.release();
      res.json({ message: 'Deleted' });
    } catch (transactionErr) {
      await connection.rollback();
      connection.release();
      throw transactionErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
