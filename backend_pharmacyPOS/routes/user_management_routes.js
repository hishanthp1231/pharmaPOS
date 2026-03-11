const express = require('express');
const router = express.Router();
const userManagementController = require('../controllers/user_management_controller');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Role Management
router.post('/roles', verifyToken, checkRole(['super_admin']), userManagementController.createRole);
router.get('/roles', verifyToken, userManagementController.getAllRoles);
router.get('/roles/:id', verifyToken, userManagementController.getRoleById);
router.put('/roles/:id', verifyToken, checkRole(['super_admin']), userManagementController.updateRole);
router.delete('/roles/:id', verifyToken, checkRole(['super_admin']), userManagementController.deleteRole);

// User Management
router.get('/users', verifyToken, checkRole(['super_admin']), userManagementController.getAllUsers);
router.post('/users', verifyToken, checkRole(['super_admin']), userManagementController.createUserV2);
router.get('/users/:id', verifyToken, checkRole(['super_admin']), userManagementController.getUserById);
router.put('/users/:id', verifyToken, checkRole(['super_admin']), userManagementController.updateUser);
router.delete('/users/:id', verifyToken, checkRole(['super_admin']), userManagementController.deleteUser);

// Branch Admin/User (Legacy/Specific)
router.post('/branch-admin', verifyToken, checkRole(['super_admin']), userManagementController.createBranchAdmin);
router.post('/branch-user', verifyToken, checkRole(['super_admin', 'branch_admin']), userManagementController.createBranchUser);
router.get('/branch/:branchId', verifyToken, checkRole(['super_admin', 'branch_admin']), userManagementController.getUsersByBranch);

module.exports = router;
