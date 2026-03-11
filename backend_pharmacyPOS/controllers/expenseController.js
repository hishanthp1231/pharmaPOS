const db = require('../db');

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    // Accept only fields that match your expenses table
    const { date, expense, amount, paymentMethod, paidTo, status, remark, balance, branch_id } = req.body;
    let receipt = null;
    if (req.file) {
      // Defensive: always use req.file.filename (already normalized by multer)
      receipt = req.file.filename;
    }
    const branchIdValue = branch_id || req.body.branchId || 1;
    const amountValue = Number(amount);

    // Ensure balance is a valid decimal or null
    let balanceValue = null;
    if (balance !== undefined && balance !== null && balance !== '') {
      balanceValue = Number(balance);
      if (isNaN(balanceValue)) balanceValue = null;
    }

    // Validate required fields
    if (!date || !expense || !amountValue || isNaN(amountValue) || !paymentMethod || !paidTo || !branchIdValue) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await db.execute(
      'INSERT INTO expenses (date, expense, amount, paymentMethod, paidTo, status, remark, balance, receipt, branch_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [
        date,
        expense,
        amountValue,
        paymentMethod,
        paidTo,
        status || 'Paid',
        remark || '',
        balanceValue,
        receipt,
        branchIdValue
      ]
    );
    res.status(201).json({ message: 'Expense created' });
  } catch (err) {
    console.error('Error in createExpense:', err);
    res.status(500).json({ message: 'Error creating expense', error: err.message, stack: err.stack });
  }
};

// Get all expenses (with optional date filter)
exports.getAllExpenses = async (req, res) => {
  try {
    const branch_id = req.query.branch_id || req.body.branch_id;
    const from = req.query.from;
    const to = req.query.to;
    if (!branch_id) {
      return res.status(400).json({ message: "branch_id is required" });
    }
    let query = 'SELECT * FROM expenses WHERE branch_id = ?';
    let params = [branch_id];
    if (from && to) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(from, to);
    } else if (from) {
      query += ' AND date >= ?';
      params.push(from);
    } else if (to) {
      query += ' AND date <= ?';
      params.push(to);
    }
    query += ' ORDER BY id DESC';
    const [rows] = await db.execute(query, params);

    // Always send date as local YYYY-MM-DD string
    const formattedRows = rows.map(row => ({
      ...row,
      date: formatDateToLocal(row.date),
      receipt: row.receipt || null // Ensure receipt is always present
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error('Error in getAllExpenses:', err);
    res.status(500).json({ message: 'Error fetching expenses', error: err.message });
  }
};

// Get expense by id
exports.getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM expenses WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    // Ensure receipt field is present
    const expense = { ...rows[0], receipt: rows[0].receipt || null };
    res.json(expense);
  } catch (err) {
    console.error('Error in getExpenseById:', err);
    res.status(500).json({ message: 'Error fetching expense', error: err.message });
  }
};

// Update expense by id
exports.updateExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    // Defensive: If req.body is undefined, parse from req.fields (for some multer configs)
    let body = req.body || {};
    if (!body || Object.keys(body).length === 0) {
      if (req.fields) body = req.fields;
    }

    // Extract fields
    const {
      date,
      expense,
      amount,
      paymentMethod,
      paidTo,
      status,
      remark,
      balance
    } = body;

    let receipt = null;
    if (req.file) {
      // Defensive: always use req.file.filename (already normalized by multer)
      receipt = req.file.filename;
    }

    // Defensive: convert amount and balance to numbers or null
    const amountValue = amount !== undefined && amount !== null && amount !== '' ? Number(amount) : null;
    let balanceValue = balance !== undefined && balance !== null && balance !== '' ? Number(balance) : null;

    // Defensive: check for missing required fields
    if (!date || !expense || amountValue === null || isNaN(amountValue) || !paymentMethod || !paidTo) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Only update fields that exist in your table
    let query = 'UPDATE expenses SET date=?, expense=?, amount=?, paymentMethod=?, paidTo=?, status=?, remark=?, balance=?';
    let params = [
      date,
      expense,
      amountValue,
      paymentMethod,
      paidTo,
      status || 'Paid',
      remark || '',
      balanceValue
    ];
    if (receipt) {
      query += ', receipt=?';
      params.push(receipt);
    }
    query += ' WHERE id=?';
    params.push(id);

    // Actually update
    const [result] = await db.execute(query, params);

    // DEBUG: Log result for troubleshooting
    console.log('Update Expense - SQL result:', result);

    // If changedRows is 0, it means the data sent is identical to the existing row
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    if (result.changedRows === 0) {
      // No actual change, but update was successful
      return res.status(200).json({ message: 'No changes made. Expense data is identical to existing.' });
    }

    // Fetch and return the updated expense for confirmation
    const [updatedRows] = await db.execute('SELECT * FROM expenses WHERE id = ?', [id]);
    res.status(200).json({ message: 'Expense updated successfully', expense: updatedRows[0] });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Error updating expense', error: error.message, stack: error.stack });
  }
};

// Delete expense by id
exports.deleteExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, check if the expense exists
    const [expense] = await db.execute('SELECT * FROM expenses WHERE id = ?', [id]);
    if (expense.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Delete the expense
    const [result] = await db.execute('DELETE FROM expenses WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Error deleting expense', error: error.message });
  }
};

function formatDateToLocal(dateValue) {
  // Handles Date object, UTC string, or MySQL DATETIME string
  if (!dateValue) return '';
  if (dateValue instanceof Date) {
    // Use local time, not UTC
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof dateValue === 'string') {
    // If ISO string, convert to local date
    if (dateValue.includes('T')) {
      const d = new Date(dateValue);
      if (!isNaN(d)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      // fallback: just take first 10 chars
      return dateValue.slice(0, 10);
    }
    // If already YYYY-MM-DD, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
    // fallback: just take first 10 chars
    return dateValue.slice(0, 10);
  }
  return '';
}