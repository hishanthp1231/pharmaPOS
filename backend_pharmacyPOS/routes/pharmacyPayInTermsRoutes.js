const express = require('express');
const router = express.Router();
const controller = require('../controllers/pharmacyPayInTermsController');

console.log('[DEBUG] pharmacyPayInTermsRoutes loaded');

router.get('/', (req, res, next) => {
  console.log('[DEBUG] /api/pharmacy-pay-in-terms GET route hit');
  controller.getAll(req, res, next);
});
router.get('/:id/payments', controller.getPayments);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
