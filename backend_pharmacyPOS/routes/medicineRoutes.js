const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const multer = require('multer');
const path = require('path');

// Multer config: random filename for uploads/medicines
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/medicines'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const rand = Math.random().toString(36).substring(2, 8);
    const ts = Date.now();
    cb(null, `med-${ts}-${rand}${ext}`);
  }
});
const upload = multer({ storage });

console.log('[DEBUG] medicineRoutes loaded');
router.get('/', (req, res, next) => {
  console.log('[DEBUG] /api/medicines route hit');
  medicineController.getMedicines(req, res, next);
});
router.get('/retail-prices/latest', medicineController.getLatestRetailPrices);
router.get('/:id', medicineController.getMedicineById);
router.post('/', upload.single('image'), medicineController.addMedicine);
router.put('/:id', upload.single('image'), medicineController.updateMedicine);
router.delete('/:id', medicineController.deleteMedicine);

module.exports = router;
