const db = require('../db');
const bcrypt = require('bcryptjs');
const { sendUserCredentialsEmail } = require('../utils/mailer');

// Helper to create a user in users_auth and workers
const createUser = async (req, res, role) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { username, email, password, name, contact, branchId, branch_id } = req.body;
    const resolvedBranchId = branchId || branch_id;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if email exists
    const [existingEmail] = await connection.query('SELECT email FROM workers WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Check if username exists
    const [existingUser] = await connection.query('SELECT username FROM users_auth WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 1. Insert into workers
    await connection.query(
      'INSERT INTO workers (name, email, contact, role, branchCode) VALUES (?, ?, ?, ?, ?)',
      [name, email, contact, role, resolvedBranchId]
    );

    // 2. Insert into users_auth
    await connection.query(
      'INSERT INTO users_auth (username, email, password_hash, role, branch_id) VALUES (?, ?, ?, ?, ?)',
      [username, email, password_hash, role, resolvedBranchId]
    );

    // Fetch branch name for email (if available)
    let branchName = '';
    if (resolvedBranchId) {
      const [branches] = await connection.query('SELECT name FROM branches WHERE id = ?', [resolvedBranchId]);
      branchName = branches?.[0]?.name || '';
    }

    await connection.commit();
    res.status(201).json({ success: true, message: `${role} created successfully` });

    // Send credentials email (non-blocking)
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    sendUserCredentialsEmail({
      to: email,
      username,
      password,
      role,
      branchName,
      loginUrl
    }).catch(err => {
      console.error('[MAILER] Failed to send credentials email:', err.message || err);
    });
  } catch (error) {
    await connection.rollback();
    console.error(`Error creating ${role}:`, error);
    res.status(500).json({ success: false, message: `Failed to create ${role}` });
  } finally {
    connection.release();
  }
};

const createBranchAdmin = async (req, res) => {
  await createUser(req, res, 'branch_admin');
};

const createBranchUser = async (req, res) => {
  if (req.user.role === 'branch_admin') {
    const reqBranchId = Number(req.body.branchId || req.body.branch_id);
    const userBranchId = Number(req.user.branchId);
    if (!isNaN(reqBranchId) && !isNaN(userBranchId) && reqBranchId !== userBranchId) {
      return res.status(403).json({ success: false, message: 'Cannot create user for another branch' });
    }
  }
  await createUser(req, res, 'branch_user');
};

const getUsersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    const reqBranchId = Number(branchId);
    const userBranchId = Number(req.user.branchId);
    if (req.user.role === 'branch_admin' && !isNaN(reqBranchId) && !isNaN(userBranchId) && reqBranchId !== userBranchId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to other branch users' });
    }

    const [users] = await db.query(
      `SELECT ua.id, ua.username, ua.email, ua.role, ua.branch_id, w.name, w.contact 
       FROM users_auth ua
       LEFT JOIN workers w ON ua.email = w.email
       WHERE ua.branch_id = ?`,
      [branchId]
    );

    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// Role Management
const createRole = async (req, res) => {
  try {
    const { name, can_view, can_edit, can_delete, pages, is_admin } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Role name is required' });

    await db.query(
      'INSERT INTO roles (name, can_view, can_edit, can_delete, pages, is_admin) VALUES (?, ?, ?, ?, ?, ?)',
      [name, !!can_view, !!can_edit, !!can_delete, JSON.stringify(pages || []), !!is_admin]
    );

    res.status(201).json({ success: true, message: 'Role created successfully' });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ success: false, message: 'Failed to create role' });
  }
};

const getAllRoles = async (req, res) => {
  try {
    const [roles] = await db.query('SELECT * FROM roles');
    const sanitizedRoles = roles.map(role => ({
      ...role,
      pages: typeof role.pages === 'string' ? JSON.parse(role.pages) : (role.pages || [])
    }));
    res.json({ success: true, data: sanitizedRoles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch roles' });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const [roles] = await db.query('SELECT * FROM roles WHERE id = ?', [id]);
    if (roles.length === 0) return res.status(404).json({ success: false, message: 'Role not found' });

    const role = roles[0];
    role.pages = typeof role.pages === 'string' ? JSON.parse(role.pages) : (role.pages || []);

    res.json({ success: true, data: role });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch role' });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, can_view, can_edit, can_delete, pages, is_admin } = req.body;

    await db.query(
      'UPDATE roles SET name=?, can_view=?, can_edit=?, can_delete=?, pages=?, is_admin=? WHERE id=?',
      [name, !!can_view, !!can_edit, !!can_delete, JSON.stringify(pages || []), !!is_admin, id]
    );

    res.json({ success: true, message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM roles WHERE id = ?', [id]);
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ success: false, message: 'Failed to delete role' });
  }
};

// User Management (New Methods for UserManagement.jsx)
const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT ua.id, ua.username, ua.email, ua.role, ua.branch_id, ua.role_id, w.name, w.contact 
      FROM users_auth ua
      LEFT JOIN workers w ON ua.email = w.email
    `);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

const createUserV2 = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { username, password, email, role_id, branch_id, name, contact } = req.body;

    // Get role info to know if it's admin or which role name it has
    const [roles] = await connection.query('SELECT name, is_admin FROM roles WHERE id = ?', [role_id]);
    if (roles.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Invalid role ID' });
    }
    const roleName = roles[0].name.toLowerCase().replace(' ', '_');

    const password_hash = await bcrypt.hash(password, 10);

    // Insert into workers if email doesn't exist, else update
    await connection.query(
      `INSERT INTO workers (name, email, contact, role, branchCode) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), contact=VALUES(contact), role=VALUES(role), branchCode=VALUES(branchCode)`,
      [name || username, email || `${username}@example.com`, contact || '', roleName, Array.isArray(branch_id) ? branch_id[0] : branch_id]
    );

    // Insert into users_auth
    await connection.query(
      'INSERT INTO users_auth (username, email, password_hash, role, branch_id, role_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email || `${username}@example.com`, password_hash, roleName, Array.isArray(branch_id) ? JSON.stringify(branch_id) : branch_id, role_id]
    );

    // Fetch branch name for email (if available)
    let branchName = '';
    const resolvedBranchId = Array.isArray(branch_id) ? branch_id[0] : branch_id;
    if (resolvedBranchId) {
      const [branches] = await connection.query('SELECT name FROM branches WHERE id = ?', [resolvedBranchId]);
      branchName = branches?.[0]?.name || '';
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'User created successfully' });

    // Send credentials email (non-blocking)
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const targetEmail = email || `${username}@example.com`;
    sendUserCredentialsEmail({
      to: targetEmail,
      username,
      password,
      role: roleName,
      branchName,
      loginUrl
    }).catch(err => {
      console.error('[MAILER] Failed to send credentials email:', err.message || err);
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  } finally {
    connection.release();
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await db.query(`
      SELECT ua.id, ua.username, ua.email, ua.role, ua.branch_id, ua.role_id, w.name, w.contact 
      FROM users_auth ua
      LEFT JOIN workers w ON ua.email = w.email
      WHERE ua.id = ?
    `, [id]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const user = users[0];
    if (typeof user.branch_id === 'string' && user.branch_id.startsWith('[')) {
      user.branch_id = JSON.parse(user.branch_id);
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

const updateUser = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { username, password, email, role_id, branch_id } = req.body;

    const [roles] = await connection.query('SELECT name FROM roles WHERE id = ?', [role_id]);
    const roleName = roles.length > 0 ? roles[0].name.toLowerCase().replace(' ', '_') : null;

    let query = 'UPDATE users_auth SET username=?, email=?, role_id=?, branch_id=?';
    const params = [username, email, role_id, Array.isArray(branch_id) ? JSON.stringify(branch_id) : branch_id];

    if (roleName) {
      query += ', role=?';
      params.push(roleName);
    }

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      query += ', password_hash=?';
      params.push(password_hash);
    }

    query += ' WHERE id=?';
    params.push(id);

    await connection.query(query, params);

    // Also update worker
    await connection.query(
      'UPDATE workers SET email=?, role=?, branchCode=? WHERE email = (SELECT email FROM users_auth WHERE id=?)',
      [email, roleName, Array.isArray(branch_id) ? branch_id[0] : branch_id, id]
    );

    await connection.commit();
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  } finally {
    connection.release();
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users_auth WHERE id = ?', [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

module.exports = {
  createBranchAdmin,
  createBranchUser,
  getUsersByBranch,
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getAllUsers,
  createUserV2,
  getUserById,
  updateUser,
  deleteUser
};
