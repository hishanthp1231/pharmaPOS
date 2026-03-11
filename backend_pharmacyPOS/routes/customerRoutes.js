const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// POST /api/customers - Add new customer
router.post('/customers', customerController.createCustomer);

// GET /api/customers - Get all customers
router.get('/customers', customerController.getCustomers);

// GET /api/customers/:id - Get customer by id
router.get('/customers/:id', customerController.getCustomerById);

// PUT /api/customers/:id - Update customer
router.put('/customers/:id', customerController.updateCustomer);

// DELETE /api/customers/:id - Delete customer
router.delete('/customers/:id', customerController.deleteCustomer);

// GET /api/customers/:id/purchases - Get purchase history for customer
router.get('/customers/:id/purchases', customerController.getCustomerPurchases);

// POST /api/customers/sync-from-orders - Sync customers table with orders table (send branch_id in body or query)
router.post('/customers/sync-from-orders', customerController.syncCustomersFromOrders);

// Get all customers
router.get('/', customerController.getAll);

// Get single customer by id
router.get('/:id', customerController.getById);

// Create customer
router.post('/', customerController.create);

// Update customer
router.put('/:id', customerController.update);

// Delete customer
router.delete('/:id', customerController.delete);

module.exports = router;
