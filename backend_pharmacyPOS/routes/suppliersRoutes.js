const express = require('express');
const router = express.Router();
const suppliersController = require('../controllers/suppliersController');

// GET /api/suppliers?branch_id=1
router.get('/', suppliersController.getSuppliers);

// GET /api/suppliers/:id?branch_id=1
router.get('/:id', suppliersController.getSupplierById);

// POST /api/suppliers
router.post('/', suppliersController.createSupplier);

// PUT /api/suppliers/:id
router.put('/:id', suppliersController.updateSupplier);

// DELETE /api/suppliers/:id?branch_id=1
router.delete('/:id', suppliersController.deleteSupplier);

module.exports = router;
