const express = require('express');
const router = express.Router();
const { getBillingSettings, setBillingSettings } = require('../controllers/billingSettingsController');

router.get('/', getBillingSettings);
router.post('/', setBillingSettings);

module.exports = router;
