const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Get all notification templates
router.get('/', notificationController.getAllTemplates);

// Get template by ID
router.get('/:id', notificationController.getTemplateById);

// Create new template
router.post('/', notificationController.createTemplate);

// Update template
router.put('/:id', notificationController.updateTemplate);

// Delete template
router.delete('/:id', notificationController.deleteTemplate);

module.exports = router;
