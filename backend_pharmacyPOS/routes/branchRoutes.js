const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Protect all branch routes with super_admin check
// GET /api/branches - Get all branches (Public for Login)
router.get('/', branchController.getAllBranches);

// POST /api/branches - Add a branch
router.post('/', verifyToken, checkRole(['super_admin']), branchController.createBranch);

// PUT /api/branches/:id - Update a branch
router.put('/:id', verifyToken, checkRole(['super_admin']), branchController.updateBranch);

// DELETE /api/branches/:id - Delete a branch
router.delete('/:id', verifyToken, checkRole(['super_admin']), branchController.deleteBranch);

module.exports = router;
