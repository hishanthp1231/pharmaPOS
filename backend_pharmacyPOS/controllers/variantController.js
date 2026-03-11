const db = require('../db');

// Delete a variant option
exports.deleteVariantOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_id } = req.query;
    
    if (!branch_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'branch_id is required' 
      });
    }

    // First verify the option exists and belongs to the branch
    const [option] = await db.query(
      'SELECT id FROM variant_options WHERE id = ? AND branch_id = ?',
      [id, branch_id]
    );

    if (option.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Variant option not found or does not belong to this branch'
      });
    }

    // Delete the option
    await db.query('DELETE FROM variant_options WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Variant option deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting variant option:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete variant option',
      error: err.message
    });
  }
};

// Delete a variant type and all its options
exports.deleteVariantType = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_id } = req.query;
    
    if (!branch_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'branch_id is required' 
      });
    }

    // First verify the type exists and belongs to the branch
    const [type] = await db.query(
      'SELECT id FROM variant_types WHERE id = ? AND branch_id = ?',
      [id, branch_id]
    );

    if (type.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Variant type not found or does not belong to this branch'
      });
    }

    // Start a transaction
    await db.query('START TRANSACTION');

    try {
      // First delete all options for this variant type
      await db.query('DELETE FROM variant_options WHERE variant_type_id = ?', [id]);
      
      // Then delete the variant type
      await db.query('DELETE FROM variant_types WHERE id = ?', [id]);
      
      // Commit the transaction
      await db.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Variant type and all its options deleted successfully'
      });
    } catch (err) {
      // Rollback in case of error
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Error deleting variant type:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete variant type',
      error: err.message
    });
  }
};

// Get all variant types for a branch (with options)
exports.getVariantTypes = async (req, res) => {
  try {
    const { branch_id } = req.query;
    console.log('[DEBUG] getVariantTypes called with branch_id:', branch_id);
    
    let query = 'SELECT * FROM variant_types';
    let params = [];
    
    // Filter by branch_id if provided
    if (branch_id) {
      query += ' WHERE branch_id = ?';
      params.push(branch_id);
    }
    
    query += ' ORDER BY name';
    
    const [rows] = await db.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    console.error('Error fetching variant types:', err);
    res.status(500).json({ message: 'Failed to fetch variant types', error: err.message });
  }
};

// Add a new variant type with options
exports.addVariantType = async (req, res) => {
  try {
    const { name, options, branch_id } = req.body;
    
    console.log('Adding variant type:', { name, options, branch_id });
    
    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Variant type name is required' 
      });
    }
    
    if (!branch_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'branch_id is required' 
      });
    }
    
    if (!Array.isArray(options) || options.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one option is required' 
      });
    }

    // Check if variant type already exists for this branch
    const [existing] = await db.query(
      'SELECT id FROM variant_types WHERE name = ? AND branch_id = ?', 
      [name.trim(), branch_id]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Variant type with this name already exists for this branch' 
      });
    }

    // Insert variant type
    const [result] = await db.query(
      'INSERT INTO variant_types (name, branch_id) VALUES (?, ?)', 
      [name.trim(), branch_id]
    );
    
    const variantTypeId = result.insertId;
    console.log('Created variant type with ID:', variantTypeId);

    // Insert options
    const optionDocs = [];
    for (const opt of options) {
      if (!opt.name || !opt.name.trim()) {
        console.log('Skipping empty option:', opt);
        continue;
      }
      
      const [optResult] = await db.query(
        'INSERT INTO variant_options (name, price_adjustment, variant_type_id, branch_id) VALUES (?, ?, ?, ?)',
        [opt.name.trim(), opt.price_adjustment || 0, variantTypeId, branch_id]
      );
      
      optionDocs.push({
        id: optResult.insertId,
        name: opt.name.trim(),
        price_adjustment: opt.price_adjustment || 0,
        variant_type_id: variantTypeId,
        branch_id
      });
    }

    console.log('Created options:', optionDocs.length);

    res.status(201).json({
      success: true,
      message: 'Variant type and options added successfully',
      data: { 
        id: variantTypeId, 
        name: name.trim(), 
        branch_id, 
        options: optionDocs 
      }
    });
  } catch (err) {
    console.error('Error in addVariantType:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add variant type',
      error: err.message 
    });
  }
};

// Add a new option to an existing variant type
exports.addVariantOption = async (req, res) => {
  try {
    const { variant_type, option_name, price_adjustment, branch_id } = req.body;
    
    console.log('Adding variant option:', { variant_type, option_name, price_adjustment, branch_id });
    
    // Validation
    if (!variant_type) {
      return res.status(400).json({ 
        success: false, 
        message: 'variant_type is required' 
      });
    }
    
    if (!option_name || !option_name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'option_name is required' 
      });
    }
    
    if (!branch_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'branch_id is required' 
      });
    }

    // Find variant type id by name or id
    let variantTypeId = variant_type;
    
    if (isNaN(Number(variant_type))) {
      // If not a number, treat as name
      const [rows] = await db.query(
        'SELECT id FROM variant_types WHERE name = ? AND branch_id = ?', 
        [variant_type, branch_id]
      );
      
      if (!rows.length) {
        return res.status(404).json({ 
          success: false, 
          message: 'Variant type not found' 
        });
      }
      
      variantTypeId = rows[0].id;
    } else {
      // Verify the variant type exists and belongs to the branch
      const [rows] = await db.query(
        'SELECT id FROM variant_types WHERE id = ? AND branch_id = ?', 
        [variant_type, branch_id]
      );
      
      if (!rows.length) {
        return res.status(404).json({ 
          success: false, 
          message: 'Variant type not found or does not belong to this branch' 
        });
      }
    }

    // Check if option already exists for this variant type
    const [existing] = await db.query(
      'SELECT id FROM variant_options WHERE name = ? AND variant_type_id = ? AND branch_id = ?',
      [option_name.trim(), variantTypeId, branch_id]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Option with this name already exists for this variant type' 
      });
    }

    // Insert option
    const [result] = await db.query(
      'INSERT INTO variant_options (name, price_adjustment, variant_type_id, branch_id) VALUES (?, ?, ?, ?)',
      [option_name.trim(), price_adjustment || 0, variantTypeId, branch_id]
    );

    console.log('Created variant option with ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Variant option added successfully',
      data: {
        id: result.insertId,
        name: option_name.trim(),
        price_adjustment: price_adjustment || 0,
        variant_type_id: variantTypeId,
        branch_id
      }
    });
  } catch (err) {
    console.error('Error in addVariantOption:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add variant option',
      error: err.message 
    });
  }
};

// Get all options for a variant type in a branch
exports.getVariantOptions = async (req, res) => {
  try {
    const { branch_id, variant_type } = req.query;
    
    if (!branch_id || !variant_type) {
      return res.status(400).json({ 
        success: false, 
        message: 'branch_id and variant_type are required' 
      });
    }

    // Find variant type id by name or id
    let variantTypeId = variant_type;
    
    if (isNaN(Number(variant_type))) {
      const [rows] = await db.query(
        'SELECT id FROM variant_types WHERE name = ? AND branch_id = ?', 
        [variant_type, branch_id]
      );
      
      if (!rows.length) {
        return res.status(404).json({ 
          success: false, 
          message: 'Variant type not found' 
        });
      }
      
      variantTypeId = rows[0].id;
    }

    const [options] = await db.query(
      'SELECT * FROM variant_options WHERE variant_type_id = ? AND branch_id = ? ORDER BY name',
      [variantTypeId, branch_id]
    );
    
    res.json({ 
      success: true, 
      data: options 
    });
  } catch (err) {
    console.error('Error in getVariantOptions:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch variant options',
      error: err.message 
    });
  }
};