const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// POST /api/orders - Create new order
router.post('/orders', orderController.createOrder);

// GET /api/orders?branch_id=1 - Get all orders for a branch
router.get('/orders', orderController.getOrders);

// POST /api/orders/assign-table - Assign a table to an order
router.post('/orders/assign-table', orderController.assignTable);

// GET /api/tables?branch_id=1 - Get all tables for a branch
router.get('/tables', orderController.getTables);

// PUT /api/orders/:id - Update an existing order (billing/cart)
router.put('/orders/:id', orderController.updateOrder);

// DELETE /api/orders/:id - Delete an order by id
router.delete('/orders/:id', orderController.deleteOrder);

// PATCH /api/orders/:id/status - Update only the status of an order
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, branch_id } = req.body;
    if (!id || !status || !branch_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    await require('../db').query(
      'UPDATE orders SET status = ? WHERE id = ? AND branch_id = ?',
      [status, id, branch_id]
    );
    res.json({ success: true, message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id?branch_id=1 - Get a single order by id and branch
router.get('/orders/:id', orderController.getOrderById);

module.exports = router;
