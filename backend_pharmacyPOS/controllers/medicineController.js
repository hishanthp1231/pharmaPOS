const db = require('../db');
const path = require('path');
const IMAGE_BASE_URL = `${process.env.BACKEND_URL}/uploads/medicines/`;

// Helper: pad medicine id to 8 digits
function generateBarcodeNumber(id) {
  return String(id).padStart(8, '0');
}

exports.getMedicines = async (req, res) => {
  try {
    console.log('[DEBUG] getMedicines called with branch_id:', req.query.branch_id, 'category:', req.query.category);
    const branch_id = req.query.branch_id;
    const category = req.query.category;
    let columns;
    try {
      [columns] = await db.query("SHOW COLUMNS FROM medicines LIKE 'branch_id'");
    } catch (sqlErr) {
      console.error('[ERROR] SQL error when checking columns:', sqlErr);
      return res.status(500).json({ message: 'SQL error: medicines table missing?', error: sqlErr.message });
    }
    let query = 'SELECT * FROM medicines';
    let params = [];
    let whereClauses = [];
    if (branch_id && columns.length > 0) {
      whereClauses.push('branch_id = ?');
      params.push(branch_id);
    }
    if (category && category !== 'all') {
      whereClauses.push('category = ?');
      params.push(category);
    }
    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }
    query += ' ORDER BY id DESC';
    let rows;
    try {
      [rows] = await db.query(query, params);
    } catch (sqlErr) {
      console.error('[ERROR] SQL error when querying medicines:', sqlErr);
      return res.status(500).json({ message: 'SQL error: medicines table missing?', error: sqlErr.message });
    }
    // Map each row to frontend format
    const mappedRows = (rows || []).map(med => ({
      id: med.id,
      name: med.name,
      genericName: med.generic_name,
      category: med.category,
      defaultMRP: typeof med.default_mrp === 'number' ? med.default_mrp : Number(med.default_mrp) || 0,
      price: typeof med.default_mrp === 'number' ? med.default_mrp : Number(med.default_mrp) || 0, // Fix for frontend "0.00" price issue
      expiryDate: med.expiry_date ? new Date(med.expiry_date).toISOString().split('T')[0] : '', // Add expiryDate
      quantity: med.quantity || 0, // Add quantity
      suppliers: med.suppliers || '', // Add suppliers
      image: (med.image && !med.image.startsWith('data:image') && !med.image.startsWith('http') && med.image !== '')
        ? IMAGE_BASE_URL + med.image
        : (med.image || ''),
      variants: (() => {
        try {
          if (Array.isArray(med.variants)) return med.variants;
          if (typeof med.variants === 'string' && med.variants.trim() !== '') {
            const arr = JSON.parse(med.variants);
            return Array.isArray(arr) ? arr : [];
          }
          return [];
        } catch {
          return [];
        }
      })(),
      barcode: med.barcode || generateBarcodeNumber(med.id)
    }));
    res.status(200).json({ data: mappedRows });
  } catch (err) {
    console.error('[ERROR] getMedicines:', err);
    res.status(500).json({ message: 'Failed to fetch medicines', error: err.message });
  }
};

exports.getMedicineById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query('SELECT id, name, generic_name, category, default_mrp, image, variants, barcode, expiry_date, quantity, suppliers FROM medicines WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
    const med = rows[0];

    // DEBUG: Log variants structure
    let variantsArr = [];
    try {
      if (Array.isArray(med.variants)) {
        variantsArr = med.variants;
      } else if (typeof med.variants === 'string' && med.variants.trim() !== '') {
        variantsArr = JSON.parse(med.variants);
      }
    } catch {
      variantsArr = [];
    }
    console.log('[DEBUG] Medicine variants:', JSON.stringify(variantsArr, null, 2));

    // Map optionName to name for frontend compatibility
    const mappedVariants = variantsArr.map(variant => ({
      ...variant,
      options: Array.isArray(variant.options)
        ? variant.options.map(opt => ({
          ...opt,
          name: opt.optionName || opt.name || '', // map optionName to name
          price: typeof opt.price === 'number' ? opt.price : (opt.price_adjustment || 0) // map price if available
        }))
        : []
    }));

    res.json({
      data: {
        id: med.id,
        name: med.name,
        genericName: med.generic_name,
        category: med.category,
        defaultMRP: typeof med.default_mrp === 'number' ? med.default_mrp : Number(med.default_mrp) || 0,
        price: typeof med.default_mrp === 'number' ? med.default_mrp : Number(med.default_mrp) || 0, // Fix for frontend "0.00" price issue
        expiryDate: med.expiry_date ? new Date(med.expiry_date).toISOString().split('T')[0] : '', // Add expiryDate
        quantity: med.quantity || 0, // Add quantity
        suppliers: med.suppliers || '', // Add suppliers
        image: (med.image && !med.image.startsWith('data:image') && !med.image.startsWith('http')) ? IMAGE_BASE_URL + med.image : '',
        variants: mappedVariants,
        barcode: med.barcode || generateBarcodeNumber(med.id)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch medicine', error: err.message });
  }
};

// Helper to get filename from file or string
function getImageFilename(req) {
  if (req.file && req.file.filename) {
    return req.file.filename; // now a small random filename
  }
  // Accept direct filename string for updates
  if (typeof req.body.image === 'string' && !req.body.image.startsWith('data:image')) {
    return req.body.image;
  }
  return '';
}

// Add this at the top of your file (or in your routes file):
// const multer = require('multer');
// const upload = multer({ dest: path.join(__dirname, '../uploads/medicines') });

exports.addMedicine = async (req, res) => {
  try {
    const { name, genericName, category, defaultMRP, variants, branch_id, expiryDate, quantity, suppliers } = req.body;
    console.log('[DEBUG] addMedicine called with branch_id:', branch_id);

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Medicine name is required' });
    }

    if (!branch_id) {
      return res.status(400).json({ message: 'branch_id is required' });
    }

    // Defensive: ensure variants is always a JSON string
    let variantsJson;
    try {
      if (Array.isArray(req.body.variants)) {
        variantsJson = JSON.stringify(req.body.variants);
      } else if (typeof req.body.variants === 'string') {
        variantsJson = req.body.variants;
      } else {
        variantsJson = '[]';
      }
    } catch {
      variantsJson = '[]';
    }
    // Defensive: ensure category is a string (name)
    let categoryName = category;
    if (typeof category === 'object' && category !== null) {
      categoryName = category.name || '';
    }
    if (!categoryName && typeof category === 'number') {
      const [catRows] = await db.query('SELECT name FROM categories WHERE id = ?', [category]);
      categoryName = catRows.length > 0 ? catRows[0].name : '';
    }
    // Defensive: defaultMRP is a number
    const mrp = isNaN(Number(defaultMRP)) ? 0 : Number(defaultMRP);
    // Quantity default to 0
    const qty = isNaN(Number(quantity)) ? 0 : Number(quantity);
    // Suppliers text/string
    const supp = suppliers || '';

    // Accept file upload or filename
    let imageFilename = getImageFilename(req);
    console.log('Received image:', {
      originalname: req.file ? req.file.originalname : null,
      storedFilename: imageFilename,
      bodyImage: req.body.image
    });
    if (imageFilename.length > 512) {
      imageFilename = imageFilename.substring(0, 512);
    }

    // Generate barcode (will be updated after insert with id)
    let barcode = '';

    const formattedExpiry = expiryDate ? new Date(expiryDate).toISOString().slice(0, 10) : null;

    const [result] = await db.query(
      'INSERT INTO medicines (name, generic_name, category, default_mrp, image, variants, barcode, branch_id, expiry_date, quantity, suppliers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, genericName, categoryName, mrp, imageFilename, variantsJson, barcode, branch_id, formattedExpiry, qty, supp]
    );
    // After insert, update barcode field with generated value
    const generatedBarcode = generateBarcodeNumber(result.insertId);
    await db.query('UPDATE medicines SET barcode=? WHERE id=?', [generatedBarcode, result.insertId]);
    const [newMedRows] = await db.query('SELECT * FROM medicines WHERE id = ?', [result.insertId]);
    res.json({ message: 'Medicine added', data: newMedRows[0] });
  } catch (err) {
    console.error('Error in addMedicine:', err, req.body);
    res.status(500).json({ message: 'Failed to add medicine', error: err.message });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, genericName, category, defaultMRP, variants, branch_id, expiryDate, quantity, suppliers } = req.body;
    console.log('[DEBUG] updateMedicine called with branch_id:', branch_id);

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Medicine name is required' });
    }

    if (!branch_id) {
      return res.status(400).json({ message: 'branch_id is required' });
    }

    // Defensive: ensure variants is always a JSON string
    let variantsJson;
    try {
      if (Array.isArray(req.body.variants)) {
        variantsJson = JSON.stringify(req.body.variants);
      } else if (typeof req.body.variants === 'string') {
        variantsJson = req.body.variants;
      } else {
        variantsJson = '[]';
      }
    } catch {
      variantsJson = '[]';
    }
    let categoryName = category;
    if (typeof category === 'object' && category !== null) {
      categoryName = category.name || '';
    }
    if (!categoryName && typeof category === 'number') {
      const [catRows] = await db.query('SELECT name FROM categories WHERE id = ?', [category]);
      categoryName = catRows.length > 0 ? catRows[0].name : '';
    }
    // Defensive: defaultMRP is a number
    const mrp = isNaN(Number(defaultMRP)) ? 0 : Number(defaultMRP);

    // Accept file upload or filename
    let imageFilename = getImageFilename(req);
    console.log('Received image:', {
      originalname: req.file ? req.file.originalname : null,
      storedFilename: imageFilename,
      bodyImage: req.body.image
    });
    if (imageFilename.length > 512) {
      imageFilename = imageFilename.substring(0, 512);
    }

    // Always update barcode to match id (if not present)
    const barcode = generateBarcodeNumber(id);

    const formattedExpiry = expiryDate ? new Date(expiryDate).toISOString().slice(0, 10) : null;
    const qty = isNaN(Number(quantity)) ? 0 : Number(quantity);
    const supp = suppliers || '';

    try {
      await db.query(
        'UPDATE medicines SET name=?, generic_name=?, category=?, default_mrp=?, image=?, variants=?, barcode=?, branch_id=?, expiry_date=?, quantity=?, suppliers=? WHERE id=?',
        [name, genericName, categoryName, mrp, imageFilename, variantsJson, barcode, branch_id, formattedExpiry, qty, supp, id]
      );
    } catch (sqlErr) {
      console.error('SQL error in updateMedicine:', sqlErr);
      return res.status(500).json({ message: 'SQL error during update', error: sqlErr.message });
    }

    const [updatedRows] = await db.query('SELECT * FROM medicines WHERE id = ?', [id]);
    res.json({ message: 'Medicine updated', data: updatedRows[0] });
  } catch (err) {
    console.error('Error in updateMedicine:', err, req.body);
    res.status(500).json({ message: 'Failed to update medicine', error: err.message });
  }
};
exports.deleteMedicine = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.query('DELETE FROM medicines WHERE id = ?', [id]);
    res.json({ message: 'Medicine deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete medicine', error: err.message });
  }
};

// Get latest retail prices from GRN table for each medicine
exports.getLatestRetailPrices = async (req, res) => {
  try {
    const branch_id = req.query.branch_id;
    console.log('[DEBUG] getLatestRetailPrices called with branch_id:', branch_id);

    if (!branch_id) {
      return res.status(400).json({ message: 'branch_id is required' });
    }

    // Simplified query to avoid potential SQL issues
    const query = `
      SELECT 
        medicine_id,
        retail,
        mrp,
        date
      FROM grn_items 
      WHERE branch_id = ?
      ORDER BY medicine_id, date DESC
    `;

    console.log('[DEBUG] Executing query with branch_id:', branch_id);
    const [rows] = await db.query(query, [branch_id]);
    console.log('[DEBUG] Query returned', rows.length, 'rows');

    // Process results to get latest price for each medicine
    const retailPricesMap = {};
    const processedMedicines = new Set();

    rows.forEach(row => {
      // Only process the first occurrence of each medicine (latest due to ORDER BY date DESC)
      if (!processedMedicines.has(row.medicine_id)) {
        processedMedicines.add(row.medicine_id);

        // Use retail price if available, otherwise use MRP
        const priceToUse = row.retail || row.mrp || 0;
        retailPricesMap[row.medicine_id] = {
          lkr_value: Number(priceToUse) || 0,
          date: row.date,
          source: row.retail ? 'retail' : (row.mrp ? 'mrp' : 'none')
        };
        console.log(`[DEBUG] Medicine ${row.medicine_id}: retail=${row.retail}, mrp=${row.mrp}, using=${priceToUse}`);
      }
    });

    console.log('[DEBUG] Final retail prices found:', Object.keys(retailPricesMap).length, 'medicines');
    res.json({ data: retailPricesMap });
  } catch (err) {
    console.error('Error in getLatestRetailPrices:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ message: 'Failed to fetch latest retail prices', error: err.message });
  }
};