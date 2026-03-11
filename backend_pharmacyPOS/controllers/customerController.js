const db = require('../db');

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const {
      name, phone, address, dob, email,
      whatsapp, viber, paid, due, credit, status, branch_id
    } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }
    // Insert all fields
    const [result] = await db.query(
      `INSERT INTO customers
      (name, phone, address, dob, email, whatsapp, viber, paid, due, credit, status, branch_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        phone,
        address || '',
        dob || null,
        email || '',
        whatsapp ? 1 : 0,
        viber ? 1 : 0,
        paid ? Number(paid) : 0,
        due ? Number(due) : 0,
        credit ? Number(credit) : 0,
        status || 'Active',
        branch_id ? Number(branch_id) : 1
      ]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all customers (now join with orders to show purchase summary if needed)
exports.getCustomers = async (req, res) => {
  try {
    const { branch_id } = req.query;
    let query = 'SELECT * FROM customers';
    let params = [];
    if (branch_id) {
      query += ' WHERE branch_id = ?';
      params.push(branch_id);
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    // Map all fields for frontend
    const customers = rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      whatsapp: !!row.whatsapp,
      viber: !!row.viber,
      email: row.email,
      address: row.address,
      dob: row.dob,
      paid: Number(row.paid) || 0,
      due: Number(row.due) || 0,
      credit: Number(row.credit) || 0,
      status: row.status,
      created_at: row.created_at,
      branch_id: row.branch_id,
      // If you have purchases column, parse it
      purchases: (() => {
        try {
          return row.purchases ? JSON.parse(row.purchases) : [];
        } catch {
          return [];
        }
      })()
    }));
    res.json(customers);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get a single customer by id
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update customer details
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, phone, address, dob, email,
      whatsapp, viber, paid, due, credit, status, branch_id
    } = req.body;
    await db.query(
      `UPDATE customers SET
      name=?, phone=?, address=?, dob=?, email=?, whatsapp=?, viber=?, paid=?, due=?, credit=?, status=?, branch_id=?
      WHERE id=?`,
      [
        name,
        phone,
        address || '',
        dob || null,
        email || '',
        whatsapp ? 1 : 0,
        viber ? 1 : 0,
        paid ? Number(paid) : 0,
        due ? Number(due) : 0,
        credit ? Number(credit) : 0,
        status || 'Active',
        branch_id ? Number(branch_id) : 1,
        id
      ]
    );
    res.json({ success: true, message: 'Customer updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM customers WHERE id=?', [id]);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get purchase history for a customer
exports.getCustomerPurchases = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_id } = req.query;
    if (!id || !branch_id) {
      return res.status(400).json({ success: false, message: 'customer_id and branch_id are required' });
    }
    // Fetch all relevant order fields for purchase history
    const [orders] = await db.query(
      `SELECT id, date, cart, subtotal, discount, total, paid_amount, future_credit, status
       FROM orders
       WHERE customer_id = ? AND branch_id = ?
       ORDER BY created_at DESC`,
      [id, branch_id]
    );
    // Parse cart and discount fields from JSON if needed
    const parsedOrders = orders.map(order => ({
      ...order,
      cart: typeof order.cart === 'string' ? (() => { try { return JSON.parse(order.cart); } catch { return order.cart; } })() : order.cart,
      discount: typeof order.discount === 'string' ? (() => { try { return JSON.parse(order.discount); } catch { return order.discount; } })() : order.discount
    }));
    res.json({ success: true, data: parsedOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Sync customers table with orders table (insert missing customers from orders for a branch)
exports.syncCustomersFromOrders = async (req, res) => {
  try {
    const branch_id = req.body.branch_id || req.query.branch_id || 1; // default to 1 if not provided
    if (!branch_id) {
      return res.status(400).json({ success: false, message: 'branch_id is required' });
    }
    // Find all unique customer_name and customer_phone pairs in orders for this branch
    const [orderCustomers] = await db.query(
      `SELECT DISTINCT customer_name, customer_phone
       FROM orders
       WHERE branch_id = ? AND customer_name IS NOT NULL AND customer_name != '' AND customer_phone IS NOT NULL AND customer_phone != ''`,
      [branch_id]
    );

    let inserted = 0;
    for (const oc of orderCustomers) {
      // Check if customer already exists by phone and branch
      const [existing] = await db.query(
        'SELECT id FROM customers WHERE phone = ? AND branch_id = ?',
        [oc.customer_phone, branch_id]
      );
      if (existing.length === 0) {
        // Insert new customer with name and phone only
        await db.query(
          'INSERT INTO customers (name, phone, branch_id) VALUES (?, ?, ?)',
          [oc.customer_name, oc.customer_phone, branch_id]
        );
        inserted++;
      }
    }
    res.json({ success: true, message: `Synced ${inserted} new customers from orders for branch ${branch_id}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all customers
exports.getAll = async (req, res) => {
  try {
    const branch_id = req.query.branch_id;
    let query = 'SELECT * FROM customers';
    let params = [];
    if (branch_id) {
      query += ' WHERE branch_id = ?';
      params.push(branch_id);
    }
    query += ' ORDER BY id DESC';
    const [rows] = await db.query(query, params);
    const customers = rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      whatsapp: !!row.whatsapp,
      viber: !!row.viber,
      email: row.email,
      address: row.address,
      dob: row.dob,
      paid: Number(row.paid) || 0,
      due: Number(row.due) || 0,
      credit: Number(row.credit) || 0,
      status: row.status,
      created_at: row.created_at,
      purchases: (() => {
        try {
          return row.purchases ? JSON.parse(row.purchases) : [];
        } catch {
          return [];
        }
      })(),
      branch_id: row.branch_id
    }));
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single customer by id
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM customers WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const row = rows[0];
    res.json({
      id: row.id,
      name: row.name,
      phone: row.phone,
      whatsapp: !!row.whatsapp,
      viber: !!row.viber,
      email: row.email,
      address: row.address,
      dob: row.dob,
      paid: Number(row.paid) || 0,
      due: Number(row.due) || 0,
      credit: Number(row.credit) || 0,
      status: row.status,
      created_at: row.created_at,
      purchases: (() => {
        try {
          return row.purchases ? JSON.parse(row.purchases) : [];
        } catch {
          return [];
        }
      })()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create customer
exports.create = async (req, res) => {
  try {
    const {
      name, phone, whatsapp, viber, email, address, dob,
      paid, due, credit, status, purchases, branch_id
    } = req.body;
    if (!branch_id) {
      return res.status(400).json({ error: 'branch_id is required' });
    }
    // Ensure all fields are present and mapped
    const purchasesJson = JSON.stringify(Array.isArray(purchases) ? purchases : []);
    await db.query(
      `INSERT INTO customers
      (name, phone, whatsapp, viber, email, address, dob, paid, due, credit, status, purchases, branch_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        phone,
        whatsapp ? 1 : 0,
        viber ? 1 : 0,
        email,
        address,
        dob,
        paid ? Number(paid) : 0,
        due ? Number(due) : 0,
        credit ? Number(credit) : 0,
        status,
        purchasesJson,
        branch_id
      ]
    );
    res.json({ message: 'Customer created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update customer
exports.update = async (req, res) => {
  try {
    const {
      name, phone, whatsapp, viber, email, address, dob,
      paid, due, credit, status, purchases
    } = req.body;
    const purchasesJson = JSON.stringify(Array.isArray(purchases) ? purchases : []);
    await db.query(
      `UPDATE customers SET
      name=?, phone=?, whatsapp=?, viber=?, email=?, address=?, dob=?, paid=?, due=?, credit=?, status=?, purchases=?
      WHERE id=?`,
      [
        name,
        phone,
        whatsapp ? 1 : 0,
        viber ? 1 : 0,
        email,
        address,
        dob,
        paid ? Number(paid) : 0,
        due ? Number(due) : 0,
        credit ? Number(credit) : 0,
        status,
        purchasesJson,
        req.params.id
      ]
    );
    res.json({ message: 'Customer updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete customer
exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM customers WHERE id=?', [req.params.id]);
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
