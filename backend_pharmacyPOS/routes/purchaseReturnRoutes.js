const express = require('express');
const router = express.Router();
const purchaseReturnController = require('../controllers/purchaseReturnController');

router.post('/', purchaseReturnController.createPurchaseReturn);
router.get('/', purchaseReturnController.getAllPurchaseReturns);
router.get('/:id', purchaseReturnController.getPurchaseReturnById);
router.put('/:id', purchaseReturnController.updatePurchaseReturnById);
router.delete('/:id', purchaseReturnController.deletePurchaseReturnById);

module.exports = router;
