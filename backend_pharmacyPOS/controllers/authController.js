
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email and password are required'
      });
    }

    // Check if email exists in workers table
    const [worker] = await db.query(
      'SELECT role, branchCode FROM workers WHERE email = ?',
      [email]
    );

    if (worker.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email not found in our system. Please contact your administrator.'
      });
    }

    // Check if username already exists in users_auth table
    const [existingUser] = await db.query(
      'SELECT id FROM users_auth WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already registered'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Get worker's role and branch code
    const { role, branchCode } = worker[0];

    // Insert into users_auth table using branch_id
    await db.query(
      `INSERT INTO users_auth 
       (username, email, password_hash, role, branch_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, password_hash, role, branchCode]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        username,
        email,
        role,
        branchId: branchCode
      }
    });

  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      code: error.code,
      sql: error.sql,
      sqlMessage: error.sqlMessage
    });

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password, branchId } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user in users_auth table
    // We join with branches to get branch name if needed
    const [users] = await db.query(
      `SELECT ua.*, w.name, w.contact, b.name as branch_name
             FROM users_auth ua
             LEFT JOIN workers w ON ua.email = w.email
             LEFT JOIN branches b ON ua.branch_id = b.id
             WHERE ua.username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Branch Access Check
    // If user is super_admin, they can access any branch (or no branch implies global)
    // If user is branch_admin or branch_user, they MUST belong to the branch they are trying to access (if branchId is provided)
    // However, the login logic usually ESTABLISHES the session. 
    // If the user attempts to login to a specific branch context, we check.
    // If the user has a fixed branch_id, they can only access that branch.

    // Normalize branch_id from DB (could be number, stringified array, etc.)
    const normalizeBranchIds = (value) => {
      if (value === null || value === undefined || value === '') return [];
      if (Array.isArray(value)) return value.map(v => String(v));
      if (typeof value === 'number') return [String(value)];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        // Try JSON array
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.map(v => String(v));
        } catch { /* ignore */ }
        // Try comma-separated list
        if (trimmed.includes(',')) {
          return trimmed.split(',').map(v => v.trim()).filter(Boolean);
        }
        return [trimmed];
      }
      return [];
    };

    const branchIds = normalizeBranchIds(user.branch_id);
    let selectedBranchId = branchId ? String(branchId) : null;

    if (user.role !== 'super_admin') {
      // If user has multiple branches and didn't select one, force selection
      if (!selectedBranchId && branchIds.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'Please select a branch to continue.'
        });
      }

      // If branchId provided, ensure it is within user's branch list
      if (selectedBranchId && branchIds.length > 0 && !branchIds.includes(selectedBranchId)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this branch.'
        });
      }

      // If not provided, default to user's first branch (single-branch users)
      if (!selectedBranchId && branchIds.length === 1) {
        selectedBranchId = branchIds[0];
      }
    }

    // Prepare user data for token and response
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      role_id: user.role_id,
      branchId: selectedBranchId || (branchIds[0] || null),
      branchName: user.branch_name,
      name: user.name,
      contact: user.contact
    };

    // Generate JWT token
    const token = jwt.sign(
      userData,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sql: error.sql,
      sqlMessage: error.sqlMessage
    });

    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again later.'
    });
  }
};

module.exports = { register, login };
