const db = require('../db');

// Get profile settings (single row, id=1)
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM profile_settings WHERE id = 1 LIMIT 1');
    if (!rows.length) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update profile settings (single row, id=1)
exports.updateProfile = async (req, res) => {
  try {
    console.log('[PROFILE UPDATE DEBUG] Request body:', req.body);
    const { name, email, phone, role } = req.body;

    // Ensure a row exists before updating
    const [rows] = await db.query('SELECT * FROM profile_settings WHERE id = 1');
    if (!rows.length) {
      await db.query(
        'INSERT INTO profile_settings (id, name, email, phone, role) VALUES (1, ?, ?, ?, ?)',
        [name || '', email || '', phone || '', role || 'Admin']
      );
    }

    // Get current values to use as fallback for missing fields
    const [currentRows] = await db.query('SELECT * FROM profile_settings WHERE id = 1');
    const current = currentRows[0] || {};

    // Use previous value if field is missing
    const updatedName = typeof name !== 'undefined' ? name : current.name || '';
    const updatedEmail = typeof email !== 'undefined' ? email : current.email || '';
    const updatedPhone = typeof phone !== 'undefined' ? phone : current.phone || '';
    const updatedRole = typeof role !== 'undefined' ? role : current.role || 'Admin';

    // Log the exact SQL query for debugging
    console.log('[PROFILE UPDATE SQL DEBUG] About to execute:');
    console.log('UPDATE profile_settings SET name=?, email=?, phone=?, role=? WHERE id=1');
    console.log('Values:', [updatedName, updatedEmail, updatedPhone, updatedRole]);

    try {
      await db.query(
        'UPDATE profile_settings SET name=?, email=?, phone=?, role=? WHERE id=1',
        [updatedName, updatedEmail, updatedPhone, updatedRole]
      );
    } catch (sqlErr) {
      console.error('[PROFILE UPDATE SQL ERROR]', sqlErr);
      console.error('SQL error message:', sqlErr.message);
      console.error('SQL error code:', sqlErr.code);
      console.error('SQL error errno:', sqlErr.errno);
      console.error('SQL error state:', sqlErr.sqlState);
      throw sqlErr;
    }

    const [updatedRows] = await db.query('SELECT * FROM profile_settings WHERE id = 1');
    res.json({ success: true, data: updatedRows[0] });
  } catch (err) {
    console.error('[PROFILE UPDATE ERROR]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
