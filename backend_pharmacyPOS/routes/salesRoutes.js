const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// Accept branch_id as query param
router.get('/', salesController.getSalesDetails);
router.get('/bill/:billNumber', salesController.getSaleByBillNumber);
router.post('/', salesController.addSalesDetail);
router.put('/:id', salesController.updateSalesDetail);
router.delete('/:id', salesController.deleteSalesDetail);
router.get('/sold-quantities', salesController.getSoldQuantities);

module.exports = router;
