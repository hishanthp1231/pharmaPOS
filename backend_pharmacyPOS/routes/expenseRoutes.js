const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for receipt uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    // Remove spaces and non-ASCII characters
    let original = file.originalname.replace(/\s+/g, '_').replace(/[^\w.]/g, '');
    const ext = path.extname(original).toLowerCase();
    let base = path.basename(original, ext);
    base = base.replace(/_(jpg|jpeg|png|gif|pdf)$/i, '');
    base = base.replace(/[.]+/g, '_');
    base = base.replace(/[_\.]+$/, '');
    if (!base) base = 'file';
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const finalName = `${unique}-${base}${ext}`;
    // Log the final filename and path for debugging
    console.log('[MULTER DEBUG] Saving file:', { original, base, ext, finalName, dest: path.join(__dirname, '../uploads', finalName) });
    cb(null, finalName);
  }
});
const upload = multer({ storage });

// CRUD routes
router.post('/', upload.single('receipt'), (req, res, next) => {
  const files = require('fs').readdirSync(path.join(__dirname, '../uploads'));
  console.log('[MULTER DEBUG] Files in uploads after upload:', files);
  // Log the filename being saved to DB
  if (req.file) {
    console.log('[MULTER DEBUG] Filename sent to DB:', req.file.filename);
  }
  next();
}, expenseController.createExpense);
router.get('/', expenseController.getAllExpenses);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', upload.single('receipt'), (req, res, next) => {
  const files = require('fs').readdirSync(path.join(__dirname, '../uploads'));
  console.log('[MULTER DEBUG] Files in uploads after upload:', files);
  if (req.file) {
    console.log('[MULTER DEBUG] Filename sent to DB:', req.file.filename);
  }
  next();
}, expenseController.updateExpenseById);
router.delete('/:id', expenseController.deleteExpenseById);

module.exports = router;
  