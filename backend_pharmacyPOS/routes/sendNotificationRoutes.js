const express = require('express');
const router = express.Router();
const sendNotificationController = require('../controllers/sendNotificationController');

router.post('/', sendNotificationController.sendNotification);

module.exports = router;
