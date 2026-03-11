const express = require('express');
const router = express.Router();
const { 
  addCategory, 
  getCategories, 
  getCategoryById,
  updateCategory,
  deleteCategory 
} = require('../controllers/categoryController');

// Input validation middleware
const validateCategory = (req, res, next) => {
  const { name, branch_id } = req.body;
  
  if (!name || !branch_id) {
    return res.status(400).json({ 
      success: false,
      message: 'Category name and branch_id are required' 
    });
  }
  
  next();
};

// Get all categories for a branch
// GET /api/categories?branch_id=1&include_inactive=false
router.get('/', getCategories);

// Get a single category by ID
// GET /api/categories/:id?branch_id=1
router.get('/:id', getCategoryById);

// Add a new category
// POST /api/categories
router.post('/', validateCategory, addCategory);

// Update a category
// PUT /api/categories/:id
router.put('/:id', validateCategory, updateCategory);

// Delete a category
// DELETE /api/categories/:id
// Request body: { branch_id: 1 }
router.delete('/:id', deleteCategory);

// No changes needed, just ensure controller methods are implemented

module.exports = router;
