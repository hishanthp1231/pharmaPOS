const db = require("../db");

// Create (POST) - Add new category
exports.addCategory = async (req, res) => {
  try {
    const { name, branch_id } = req.body;
    if (!name || !branch_id) {
      return res.status(400).json({ message: "Category name and branch_id are required" });
    }
    // Check for duplicate
    const [existing] = await db.query("SELECT id FROM categories WHERE name = ? AND branch_id = ?", [name, branch_id]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Category already exists for this branch" });
    }
    const [result] = await db.query("INSERT INTO categories (name, branch_id) VALUES (?, ?)", [name, branch_id]);
    res.status(201).json({ id: result.insertId, name, branch_id });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Read (GET) - Get all categories for a branch
exports.getCategories = async (req, res) => {
  try {
    const branch_id = req.query.branch_id;
    let query = 'SELECT * FROM categories';
    let params = [];
    if (branch_id) {
      query += ' WHERE branch_id = ?';
      params.push(branch_id);
    }
    const [rows] = await db.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
};

// Read (GET) - Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const branch_id = req.query.branch_id || req.body.branch_id;
    if (!id || !branch_id) {
      return res.status(400).json({ message: "Category ID and branch_id are required" });
    }
    const [categories] = await db.query("SELECT id, name FROM categories WHERE id = ? AND branch_id = ?", [id, branch_id]);
    if (categories.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(categories[0]);
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update (PUT) - Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, branch_id } = req.body;
    if (!id || !name || !branch_id) {
      return res.status(400).json({ message: "Category ID, name, and branch_id are required" });
    }
    // Check if category exists
    const [existing] = await db.query("SELECT id FROM categories WHERE id = ? AND branch_id = ?", [id, branch_id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    await db.query("UPDATE categories SET name = ? WHERE id = ? AND branch_id = ?", [name, id, branch_id]);
    res.json({ id, name, branch_id });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete (DELETE) - Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const branch_id = req.body.branch_id || req.query.branch_id;
    if (!id || !branch_id) {
      return res.status(400).json({ message: "Category ID and branch_id are required" });
    }
    // Check if category exists
    const [existing] = await db.query("SELECT id FROM categories WHERE id = ? AND branch_id = ?", [id, branch_id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    await db.query("DELETE FROM categories WHERE id = ? AND branch_id = ?", [id, branch_id]);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
