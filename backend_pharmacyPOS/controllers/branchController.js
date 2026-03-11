const db = require('../db');

const normalizeActive = (value) => value === true || value === 1 || value === '1' || value === 'true';
let branchSchemaEnsured = false;

const getBranchColumns = async () => {
  try {
    const [rows] = await db.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches'`
    );
    return new Set((rows || []).map((r) => r.COLUMN_NAME));
  } catch (error) {
    console.warn('Could not read branches schema from information_schema, falling back to defaults:', error?.message);
    return new Set(['id', 'name', 'code', 'address', 'tel', 'manager', 'active', 'contact']);
  }
};

const ensureBranchSchema = async () => {
  if (branchSchemaEnsured) return;
  const columns = await getBranchColumns();
  const alterStatements = [];

  if (!columns.has('code')) {
    alterStatements.push(`ALTER TABLE branches ADD COLUMN code VARCHAR(100) NULL`);
  }
  if (!columns.has('address')) {
    alterStatements.push(`ALTER TABLE branches ADD COLUMN address VARCHAR(255) NULL`);
  }
  // Only add tel if neither tel nor contact exist
  if (!columns.has('tel') && !columns.has('contact')) {
    alterStatements.push(`ALTER TABLE branches ADD COLUMN tel VARCHAR(50) NULL`);
  }
  if (!columns.has('manager')) {
    alterStatements.push(`ALTER TABLE branches ADD COLUMN manager VARCHAR(100) NULL`);
  }
  if (!columns.has('active')) {
    alterStatements.push(`ALTER TABLE branches ADD COLUMN active TINYINT(1) DEFAULT 1`);
  }

  for (const statement of alterStatements) {
    try {
      await db.query(statement);
    } catch (error) {
      console.warn('Branch schema update skipped:', statement, error?.message);
    }
  }

  branchSchemaEnsured = true;
};

// Create a new branch
const createBranch = async (req, res) => {
  try {
    await ensureBranchSchema();
    const { name, address, code, tel, manager, active, contact } = req.body;
    const normalizedTel = tel ?? contact ?? null;
    const normalizedManager = manager ?? null;
    const activeValue = active === undefined ? 1 : (normalizeActive(active) ? 1 : 0);
    const columns = await getBranchColumns();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Branch name is required'
      });
    }
    if (columns.has('code') && !code) {
      return res.status(400).json({
        success: false,
        message: 'Branch name and code are required'
      });
    }

    // Check if branch code exists
    if (columns.has('code')) {
      const [existing] = await db.query('SELECT id FROM branches WHERE code = ?', [code]);
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Branch code already exists'
        });
      }
    }

    const insertCols = [];
    const values = [];
    const addInsert = (col, val) => {
      if (!columns.has(col)) return;
      insertCols.push(col);
      values.push(val);
    };

    addInsert('name', name);
    addInsert('code', code);
    addInsert('address', address || null);
    if (columns.has('tel')) addInsert('tel', normalizedTel);
    else if (columns.has('contact')) addInsert('contact', normalizedTel);
    addInsert('manager', normalizedManager);
    addInsert('active', activeValue);

    if (insertCols.length === 0) {
      return res.status(500).json({ success: false, message: 'Branches table has no writable columns' });
    }

    const placeholders = insertCols.map(() => '?').join(', ');
    const sql = `INSERT INTO branches (${insertCols.join(', ')}) VALUES (${placeholders})`;
    await db.query(sql, values);

    res.status(201).json({ success: true, message: 'Branch created successfully' });
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ success: false, message: 'Failed to create branch' });
  }
};

// Get all branches
const getAllBranches = async (req, res) => {
  try {
    const [branches] = await db.query('SELECT * FROM branches ORDER BY id DESC');
    const normalized = (branches || []).map((b) => ({
      ...b,
      // Backward compatibility: map legacy "contact" to "tel" if needed
      tel: b.tel ?? b.contact ?? null,
      active: b.active === undefined ? 1 : b.active
    }));
    res.json({ success: true, branches: normalized });
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch branches' });
  }
};

// Update a branch
const updateBranch = async (req, res) => {
  try {
    await ensureBranchSchema();
    const { id } = req.params;
    const { name, address, code, tel, manager, active, contact } = req.body;
    const normalizedTel = tel ?? contact ?? null;
    const normalizedManager = manager ?? null;
    const columns = await getBranchColumns();
    const updates = [];
    const values = [];

    const addUpdate = (col, val, condition = true) => {
      if (!columns.has(col) || !condition) return;
      updates.push(`${col} = ?`);
      values.push(val);
    };

    addUpdate('name', name, name !== undefined);
    addUpdate('code', code, code !== undefined);
    addUpdate('address', address || null, address !== undefined);
    if (columns.has('tel')) {
      addUpdate('tel', normalizedTel, tel !== undefined || contact !== undefined);
    } else if (columns.has('contact')) {
      addUpdate('contact', normalizedTel, tel !== undefined || contact !== undefined);
    }
    addUpdate('manager', normalizedManager, manager !== undefined);
    addUpdate('active', normalizeActive(active) ? 1 : 0, active !== undefined);

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const sql = `UPDATE branches SET ${updates.join(', ')} WHERE id = ?`;
    values.push(id);
    await db.query(sql, values);

    res.json({ success: true, message: 'Branch updated successfully' });
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ success: false, message: 'Failed to update branch' });
  }
};

// Delete a branch
const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are users or workers associated
    const [users] = await db.query('SELECT id FROM users_auth WHERE branch_id = ?', [id]);
    if (users.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete branch with assigned users.'
      });
    }

    await db.query('DELETE FROM branches WHERE id = ?', [id]);

    res.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ success: false, message: 'Failed to delete branch' });
  }
};

module.exports = {
  createBranch,
  getAllBranches,
  updateBranch,
  deleteBranch
};
