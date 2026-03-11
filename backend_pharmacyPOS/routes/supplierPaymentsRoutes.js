const express = require('express');
const router = express.Router();
const controller = require('../controllers/supplierPaymentsController');

// GET /api/suppliers/payments?branch_id=1
router.get('/', controller.getPayments);

// GET /api/suppliers/payments/:id?branch_id=1
router.get('/:id', controller.getPaymentById);

// POST /api/suppliers/payments
router.post('/', controller.createPayment);

// PUT /api/suppliers/payments/:id
router.put('/:id', controller.updatePayment);

// DELETE /api/suppliers/payments/:id?branch_id=1
router.delete('/:id', controller.deletePayment);

module.exports = router;
