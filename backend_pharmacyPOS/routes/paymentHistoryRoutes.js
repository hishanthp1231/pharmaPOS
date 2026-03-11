const express = require('express');
const router = express.Router();
const paymentHistoryController = require('../controllers/paymentHistoryController');

// Add a new payment
router.post('/', paymentHistoryController.addPayment);

// Get payment history for a customer (with branch_id as query param)
router.get('/:pay_in_terms_id', paymentHistoryController.getPaymentHistory);

// Delete a payment
router.delete('/:id', paymentHistoryController.deletePayment);

module.exports = router;
