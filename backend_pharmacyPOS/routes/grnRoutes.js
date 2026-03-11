const express = require('express');
const router = express.Router();
const grnController = require('../controllers/grnController');

// GET /api/grn
router.get('/', (req, res, next) => {
  console.log('[DEBUG] /api/grn route hit');
  grnController.getGRNs(req, res, next);
});

// GET /api/grn/purchased-quantities
router.get('/purchased-quantities', grnController.getPurchasedQuantities);

// POST /api/grn - Add new GRN
router.post('/', (req, res, next) => {
  console.log('[DEBUG] POST /api/grn route hit');
  grnController.addGRN(req, res, next);
});

// PUT /api/grn/:grn_id - Update existing GRN
router.put('/:grn_id', (req, res, next) => {
  console.log('[DEBUG] PUT /api/grn/:grn_id route hit, grn_id:', req.params.grn_id);
  grnController.updateGRN(req, res, next);
});

// DELETE /api/grn/:grn_id - Delete GRN
router.delete('/:grn_id', (req, res, next) => {
  console.log('[DEBUG] DELETE /api/grn/:grn_id route hit, grn_id:', req.params.grn_id);
  grnController.deleteGRN(req, res, next);
});

module.exports = router;
