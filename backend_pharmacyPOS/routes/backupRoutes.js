const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const multer = require('multer');
const path = require('path');

// Configure multer for SQL files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'restore-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.sql') {
            cb(null, true);
        } else {
            cb(new Error('Only .sql files are allowed'));
        }
    }
});

router.get('/create', backupController.createBackup);
router.post('/restore', upload.single('backupFile'), backupController.restoreBackup);

module.exports = router;
