const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variantController');

// GET /api/variants/types?branch_id=1 - Get all variant types for a branch
router.get('/types', variantController.getVariantTypes);

// POST /api/variants/types - Add a new variant type with options
router.post('/types', variantController.addVariantType);

// DELETE /api/variants/types/:id?branch_id=1 - Delete a variant type and all its options
router.delete('/types/:id', variantController.deleteVariantType);

// GET /api/variants?branch_id=1&variant_type=... - Get options for a variant type
router.get('/', variantController.getVariantOptions);

// POST /api/variants - Add a new option to existing variant type
router.post('/', variantController.addVariantOption);

// DELETE /api/variants/:id?branch_id=1 - Delete a variant option
router.delete('/:id', variantController.deleteVariantOption);

module.exports = router;