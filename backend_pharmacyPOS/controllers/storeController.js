const db = require('../db');
const path = require('path');
const fs = require('fs');

// Store Info
exports.getStoreInfo = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM store_info LIMIT 1');
    const storeInfo = rows[0] || {};
    
    // Handle logo path - ensure it's just the filename
    if (storeInfo.logo) {
      // Remove any existing /uploads/ prefix to avoid duplication
      storeInfo.logo = storeInfo.logo.replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
        .replace(/^uploads\//, ''); // Remove any uploads/ prefix
    }
    
    res.json(storeInfo);
  } catch (error) {
    console.error('Error getting store info:', error);
    res.status(500).json({ error: 'Failed to get store info' });
  }
};

exports.updateStoreInfo = async (req, res) => {
  try {
    // Debug: log incoming payload and file
    console.log('Received store info:', req.body);
    if (req.file) {
      console.log('Received logo file:', req.file);
    }

    const { name, code, email, businessType } = req.body;

    // If there is no entry in store_info, insert instead of update
    const [existing] = await db.query('SELECT * FROM store_info WHERE id = 1');
    let logo = existing[0]?.logo || null;

    // Handle file upload if present
    if (req.file && req.file.filename) {
      if (logo) {
        const cleanLogoPath = logo.startsWith('/uploads/') ? logo.substring(8) : logo;
        const oldLogoPath = path.join(__dirname, '../uploads', cleanLogoPath);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      logo = req.file.filename;
    }

    if (!name || !code || !email || !businessType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (existing.length === 0) {
      // Insert new store info if not exists
      await db.query(
        `INSERT INTO store_info (id, name, code, email, businessType, logo) VALUES (1, ?, ?, ?, ?, ?)`,
        [name, code, email, businessType, logo]
      );
    } else {
      // Update existing store info
      await db.query(
        `UPDATE store_info SET name = ?, code = ?, email = ?, businessType = ?, logo = ? WHERE id = 1`,
        [name, code, email, businessType, logo]
      );
    }

    // Get updated store info
    const [updatedStore] = await db.query('SELECT * FROM store_info WHERE id = 1');
    const updatedStoreInfo = updatedStore[0] || {};

    if (updatedStoreInfo.logo) {
      updatedStoreInfo.logo = updatedStoreInfo.logo
        .replace(/^\/+|\/+$/g, '')
        .replace(/^uploads\//, '');
    }

    res.json({
      success: true,
      store: updatedStoreInfo
    });
  } catch (error) {
    console.error('Error updating store info:', error);
    res.status(500).json({ error: 'Failed to update store info' });
  }
};

exports.setActiveBranch = async (req, res) => {
  const { branchId } = req.body;
  await db.query('UPDATE store_info SET activeBranchId=? WHERE id=1', [branchId]);
  res.json({ success: true });
};