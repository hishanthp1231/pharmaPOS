const db = require('../db');

let salesColumnsPromise = null;

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const parseBranchId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeBillNumber = (value) => {
  if (value === undefined || value === null) return null;
  const bill = String(value).trim();
  return bill ? bill : null;
};

const parseItemsFromRow = (row) => {
  try {
    if (typeof row.items === 'string') {
      const parsed = JSON.parse(row.items);
      return Array.isArray(parsed) ? parsed : [];
    }
    if (Array.isArray(row.items)) {
      return row.items;
    }
  } catch (err) {
    console.error('[SALES DEBUG] Error parsing items:', err, row.items);
  }
  return [];
};

const toCompactItems = (items) => {
  return items.map(item => ({
    name: item?.name || '',
    quantity: Number(item?.quantity ?? item?.qty) || 1
  }));
};

const toDetailedItems = (items) => {
  return items.map(item => ({
    ...item,
    quantity: Number(item?.quantity ?? item?.qty) || 1
  }));
};

const mapSaleRow = (row, detailedItems = false) => {
  const parsedItems = parseItemsFromRow(row);
  return {
    id: row.id,
    bill_number: row.bill_number || null,
    date: normalizeDate(row.date),
    customer: row.customer,
    customer_phone: row.customer_phone || '',
    items: detailedItems ? toDetailedItems(parsedItems) : toCompactItems(parsedItems),
    total: row.total,
    branch_id: row.branch_id
  };
};

async function getSalesColumns() {
  if (!salesColumnsPromise) {
    salesColumnsPromise = (async () => {
      try {
        const [columns] = await db.query('SHOW COLUMNS FROM sales_details');
        const columnsSet = new Set(columns.map(col => col.Field));

        if (!columnsSet.has('bill_number')) {
          await db.query('ALTER TABLE sales_details ADD COLUMN bill_number VARCHAR(100) DEFAULT NULL');
          columnsSet.add('bill_number');
        }

        return columnsSet;
      } catch (err) {
        salesColumnsPromise = null;
        throw err;
      }
    })();
  }

  return salesColumnsPromise;
}

// GET /api/sales-details
exports.getSalesDetails = async (req, res) => {
  try {
    await getSalesColumns();
    const branch_id = req.query.branch_id;
    let query = 'SELECT * FROM sales_details';
    let params = [];
    if (branch_id) {
      query += ' WHERE branch_id = ?';
      params.push(branch_id);
    }
    query += ' ORDER BY id DESC';
    const [rows] = await db.query(query, params);
    const sales = rows.map(row => mapSaleRow(row, false));
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sales', error: err.message });
  }
};

// GET /api/sales-details/bill/:billNumber
exports.getSaleByBillNumber = async (req, res) => {
  try {
    const billNumber = normalizeBillNumber(req.params.billNumber);
    if (!billNumber) {
      return res.status(400).json({ message: 'bill number is required' });
    }

    const columns = await getSalesColumns();
    const branch_id = parseBranchId(req.query.branch_id || req.body?.branch_id);

    let rows = [];

    if (columns.has('bill_number')) {
      let query = 'SELECT * FROM sales_details WHERE bill_number = ?';
      const params = [billNumber];
      if (branch_id) {
        query += ' AND branch_id = ?';
        params.push(branch_id);
      }
      query += ' ORDER BY id DESC LIMIT 1';
      [rows] = await db.query(query, params);
    }

    if (rows.length === 0) {
      const numericId = Number(billNumber);
      if (Number.isInteger(numericId) && numericId > 0) {
        let query = 'SELECT * FROM sales_details WHERE id = ?';
        const params = [numericId];
        if (branch_id) {
          query += ' AND branch_id = ?';
          params.push(branch_id);
        }
        query += ' LIMIT 1';
        [rows] = await db.query(query, params);
      }
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({ success: true, data: mapSaleRow(rows[0], true) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bill details', error: err.message });
  }
};

// POST /api/sales-details
exports.addSalesDetail = async (req, res) => {
  try {
    const { date, customer, customer_phone, items, total, branch_id } = req.body;
    const columns = await getSalesColumns();
    const billNumber = normalizeBillNumber(req.body.bill_number || req.body.billNumber) || `INV-${Date.now()}`;
    const normalizedCustomerName = String(customer || '').trim();
    const normalizedCustomerPhone = String(customer_phone || '').trim();

    if (!date || !normalizedCustomerName || !Array.isArray(items) || typeof total === 'undefined' || !branch_id) {
      return res.status(400).json({ message: 'Missing required fields (including branch_id)' });
    }

    const itemsJson = JSON.stringify(items);
    const formattedDate = normalizeDate(date);
    if (!formattedDate) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    if (columns.has('bill_number')) {
      await db.query(
        'INSERT INTO sales_details (date, customer, customer_phone, items, total, branch_id, bill_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [formattedDate, normalizedCustomerName, normalizedCustomerPhone, itemsJson, total, branch_id, billNumber]
      );
    } else {
      await db.query(
        'INSERT INTO sales_details (date, customer, customer_phone, items, total, branch_id) VALUES (?, ?, ?, ?, ?, ?)',
        [formattedDate, normalizedCustomerName, normalizedCustomerPhone, itemsJson, total, branch_id]
      );
    }

    // Sync Customer: If it's a real name (not Walk-in), ensure they exist in customers table
    if (normalizedCustomerName.toLowerCase() !== 'walk-in customer') {
      try {
        let existingQuery = 'SELECT id FROM customers WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND branch_id = ?';
        const existingParams = [normalizedCustomerName, branch_id];
        if (normalizedCustomerPhone) {
          existingQuery += ' OR (phone = ? AND branch_id = ?)';
          existingParams.push(normalizedCustomerPhone, branch_id);
        }
        const [existing] = await db.query(existingQuery, existingParams);

        if (existing.length === 0) {
          await db.query(
            'INSERT INTO customers (name, phone, branch_id) VALUES (?, ?, ?)',
            [normalizedCustomerName, normalizedCustomerPhone, branch_id]
          );
          console.log(`[SALES] Auto-created new customer: ${normalizedCustomerName}`);
        }
      } catch (syncErr) {
        console.error('[SALES] Customer sync failed:', syncErr);
        // Don't fail the whole sale just because customer sync failed
      }
    }

    // Decrement quantity in medicines table for each sold item
    for (const item of items) {
      const soldQty = Number(item.quantity) || Number(item.qty) || 1;
      const medicineId = item.id;
      if (medicineId) {
        await db.query(
          'UPDATE medicines SET quantity = GREATEST(0, quantity - ?) WHERE id = ? AND branch_id = ?',
          [soldQty, medicineId, branch_id]
        );
      }
    }

    res.json({ message: 'Sale added', bill_number: billNumber });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add sale', error: err.message });
  }
};

// PUT /api/sales-details/:id
exports.updateSalesDetail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { date, customer, customer_phone, items, total, branch_id } = req.body;
    const columns = await getSalesColumns();
    const billNumber = normalizeBillNumber(req.body.bill_number || req.body.billNumber);

    if (!date || !customer || !Array.isArray(items) || typeof total === 'undefined' || !branch_id) {
      return res.status(400).json({ message: 'Missing required fields (including branch_id)' });
    }

    const itemsJson = JSON.stringify(items);
    const formattedDate = normalizeDate(date);
    if (!formattedDate) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    const setParts = ['date=?', 'customer=?', 'customer_phone=?', 'items=?', 'total=?'];
    const values = [formattedDate, customer, customer_phone || '', itemsJson, total];

    if (columns.has('bill_number') && billNumber) {
      setParts.push('bill_number=?');
      values.push(billNumber);
    }

    await db.query(
      `UPDATE sales_details SET ${setParts.join(', ')} WHERE id=? AND branch_id=?`,
      [...values, id, branch_id]
    );

    res.json({ message: 'Sale updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update sale', error: err.message });
  }
};

// DELETE /api/sales-details/:id
exports.deleteSalesDetail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const branch_id = req.query.branch_id || req.body.branch_id;
    if (!branch_id) {
      return res.status(400).json({ message: 'branch_id required for delete' });
    }
    await db.query('DELETE FROM sales_details WHERE id=? AND branch_id=?', [id, branch_id]);
    res.json({ message: 'Sale deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete sale', error: err.message });
  }
};

// Get total sold quantity for all medicines up to today
exports.getSoldQuantities = async (req, res) => {
  try {
    const branch_id = req.query.branch_id;
    const today = new Date().toISOString().slice(0, 10);
    let query = `
      SELECT items, date
      FROM sales_details
      WHERE date <= ?`;
    let params = [today];
    if (branch_id) {
      query += ' AND branch_id = ?';
      params.push(branch_id);
    }
    const [rows] = await db.query(query, params);
    // Aggregate sold quantities by medicine name
    const soldMap = {};
    for (const row of rows) {
      let items = [];
      try {
        items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
      } catch { }
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (item.name) {
            soldMap[item.name] = (soldMap[item.name] || 0) + (Number(item.quantity) || 0);
          }
        });
      }
    }
    // Convert to array
    const result = Object.entries(soldMap).map(([name, total_sold]) => ({ name, total_sold }));
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sold quantities', error: err.message });
  }
};

