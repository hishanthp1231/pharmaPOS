const db = require('../db');

// Create a new order with full details (including billing)
exports.createOrder = async (req, res) => {
  try {
    let {
      customer_name, customer_phone, num_persons, order_type, branch_id, table_id, date, status,
      cart, payment_method, subtotal, discount, tax, total, paid_amount, future_credit
    } = req.body;

    console.log('[orderController] Received order:', req.body);

    // Accept both camelCase and snake_case for customerName, customerPhone, tableId, table_id
    const _customer_name = customer_name || req.body.customerName || '';
    const _customer_phone = customer_phone || req.body.customerPhone || '';
    branch_id = branch_id || req.body.branch_id || 1; // <-- change const to let
    // Accept table_id from: table_id, tableId, table?.id, or req.body.table?.id
    let _table_id = table_id;
    if (_table_id === undefined || _table_id === null) {
      _table_id = req.body.tableId || (req.body.table && req.body.table.id) || null;
    }

    if (!_customer_name || !num_persons || !order_type || !branch_id || !date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // --- Customer auto-create/link logic ---
    let customerId = null;
    if (_customer_phone) {
      // Try to find customer by phone and branch
      const [existing] = await db.query(
        'SELECT id FROM customers WHERE phone = ? AND branch_id = ? LIMIT 1',
        [_customer_phone, branch_id]
      );
      if (existing.length > 0) {
        customerId = existing[0].id;
      } else if (_customer_name) {
        // Create new customer with name and phone
        const [result] = await db.query(
          'INSERT INTO customers (name, phone, branch_id) VALUES (?, ?, ?)',
          [_customer_name, _customer_phone, branch_id]
        );
        customerId = result.insertId;
      }
    }

    // Insert order with customer_id
    const [result] = await db.query(
      `INSERT INTO orders (
        customer_name, customer_phone, num_persons, order_type, branch_id, table_id, status, date,
        cart, payment_method, subtotal, discount, tax, total, paid_amount, future_credit, customer_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        _customer_name,
        _customer_phone,
        num_persons,
        order_type,
        branch_id,
        _table_id,
        status,
        date,
        JSON.stringify(cart || []),
        payment_method || null,
        subtotal || 0,
        discount ? JSON.stringify(discount) : null,
        tax ? JSON.stringify(tax) : null,
        total || 0,
        paid_amount || 0,
        future_credit || 0,
        customerId
      ]
    );
    res.status(201).json({ success: true, order_id: result.insertId, customer_id: customerId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all orders for a branch
exports.getOrders = async (req, res) => {
  try {
    const { branch_id } = req.query;
    if (!branch_id) return res.status(400).json({ success: false, message: 'branch_id is required' });
    const [rows] = await db.query(
      'SELECT * FROM orders WHERE branch_id = ? ORDER BY created_at DESC',
      [branch_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Assign a table to an order (for dine-in)
exports.assignTable = async (req, res) => {
  try {
    const { order_id, table_id } = req.body;
    if (!order_id || !table_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    // Mark table as booked and link to order
    await db.query(
      'UPDATE tables SET status = ?, order_id = ? WHERE id = ?',
      ['booked', order_id, table_id]
    );
    await db.query(
      'UPDATE orders SET table_id = ?, status = ? WHERE id = ?',
      [table_id, 'active', order_id]
    );
    res.json({ success: true, message: 'Table assigned to order' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all tables for a branch
exports.getTables = async (req, res) => {
  try {
    const { branch_id } = req.query;
    if (!branch_id) return res.status(400).json({ success: false, message: 'branch_id is required' });
    const [rows] = await db.query(
      'SELECT t.*, o.customer_name, o.num_persons, o.status as order_status FROM tables t LEFT JOIN orders o ON t.order_id = o.id WHERE t.branch_id = ?',
      [branch_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update an existing order with billing/cart details
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    // Accept all billing fields from body
    const {
      cart, payment_method, subtotal, discount, tax, total, paid_amount, future_credit, status
    } = req.body;

    // Build update fields only for billing/cart
    const fields = [];
    const values = [];

    if (cart !== undefined) {
      fields.push('cart = ?');
      values.push(JSON.stringify(cart));
    }
    if (payment_method !== undefined) {
      fields.push('payment_method = ?');
      values.push(payment_method);
    }
    if (subtotal !== undefined) {
      fields.push('subtotal = ?');
      values.push(subtotal);
    }
    if (discount !== undefined) {
      fields.push('discount = ?');
      values.push(typeof discount === 'string' ? discount : JSON.stringify(discount));
    }
    if (tax !== undefined) {
      fields.push('tax = ?');
      values.push(typeof tax === 'string' ? tax : JSON.stringify(tax));
    }
    if (total !== undefined) {
      fields.push('total = ?');
      values.push(total);
    }
    if (paid_amount !== undefined) {
      fields.push('paid_amount = ?');
      values.push(paid_amount);
    }
    if (future_credit !== undefined) {
      fields.push('future_credit = ?');
      values.push(future_credit);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      values.push(status);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No billing fields to update' });
    }

    // Update only billing/cart fields
    await db.query(
      `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`,
      [...values, id]
    );

    // Return updated order
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete an order by id
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    // Optionally, you can check for branch_id for extra safety
    if (!id) {
      return res.status(400).json({ success: false, message: 'Order id is required' });
    }
    // Remove the order
    const [result] = await db.query('DELETE FROM orders WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get a single order by id and branch
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_id } = req.query;
    if (!id || !branch_id) return res.status(400).json({ success: false, message: 'Missing id or branch_id' });
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ? AND branch_id = ?', [id, branch_id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
