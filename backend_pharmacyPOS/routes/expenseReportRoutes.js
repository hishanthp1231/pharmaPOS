const express = require('express');
const router = express.Router();
const reportController = require('../controllers/expenseReportController');
const { authenticate } = require('../middleware/auth');

// Get expense summary by category
router.get('/summary/category', authenticate, reportController.getExpenseSummaryByCategory);

// Get expenses by time period (daily, weekly, monthly)
router.get('/summary/time', authenticate, reportController.getExpensesByTimePeriod);

// Get branch-wise expense comparison
router.get('/summary/branches', authenticate, reportController.getBranchWiseExpenses);

module.exports = router;
