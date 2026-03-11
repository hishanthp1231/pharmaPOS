const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const multer = require('multer');
const path = require('path');

// Multer config for logo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, 'logo_' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// Store Info
router.get('/store', storeController.getStoreInfo);
// The logo path will be handled by the controller
router.post('/store', upload.single('logo'), storeController.updateStoreInfo);

// Set active branch
router.post('/store/active-branch', storeController.setActiveBranch);

module.exports = router;
