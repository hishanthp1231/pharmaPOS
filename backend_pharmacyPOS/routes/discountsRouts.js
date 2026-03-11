const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountsController');

// CRUD endpoints
router.post('/', discountController.createDiscount);
router.get('/', discountController.getAllDiscounts);
router.get('/:id', discountController.getDiscountById);
router.put('/:id', discountController.updateDiscountById);
router.delete('/:id', discountController.deleteDiscountById);

module.exports = router;
