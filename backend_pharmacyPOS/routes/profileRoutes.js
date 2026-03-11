const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// GET /api/profile - Get profile settings
router.get('/profile', profileController.getProfile);

// PUT /api/profile - Update profile settings
router.put('/profile', profileController.updateProfile);

module.exports = router;
