/**
 * Seed initial menu data for testing
 * @param {import('mysql2/promise').Pool} db - Database connection pool
 */
const up = async (db) => {
  try {
    // Get the first branch ID
    const [branches] = await db.query('SELECT id FROM branches LIMIT 1');
    if (branches.length === 0) {
      console.log('No branches found. Please create a branch first.');
      return;
    }
    
    const branchId = branches[0].id;
    
    // Insert sample categories
    const [categories] = await db.query(
      `INSERT INTO categories (name, description, branch_id, is_active)
       VALUES 
         ('Appetizers', 'Delicious starters to begin your meal', ?, TRUE),
         ('Main Course', 'Hearty and satisfying main dishes', ?, TRUE),
         ('Beverages', 'Refreshing drinks and beverages', ?, TRUE),
         ('Desserts', 'Sweet treats to end your meal', ?, TRUE)
       ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
      [branchId, branchId, branchId, branchId]
    );
    
    // Get the inserted category IDs
    const [appetizers] = await db.query(
      'SELECT id FROM categories WHERE name = ? AND branch_id = ?',
      ['Appetizers', branchId]
    );
    
    const [mainCourse] = await db.query(
      'SELECT id FROM categories WHERE name = ? AND branch_id = ?',
      ['Main Course', branchId]
    );
    
    // Insert sample variant types
    const [variantTypes] = await db.query(
      `INSERT INTO variant_types (name, branch_id)
       VALUES 
         ('Size', ?),
         ('Spice Level', ?),
         ('Milk Type', ?)
       ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
      [branchId, branchId, branchId]
    );
    
    // Get the inserted variant type IDs
    const [sizeVariant] = await db.query(
      'SELECT id FROM variant_types WHERE name = ? AND branch_id = ?',
      ['Size', branchId]
    );
    
    const [spiceVariant] = await db.query(
      'SELECT id FROM variant_types WHERE name = ? AND branch_id = ?',
      ['Spice Level', branchId]
    );
    
    const [milkVariant] = await db.query(
      'SELECT id FROM variant_types WHERE name = ? AND branch_id = ?',
      ['Milk Type', branchId]
    );
    
    // Insert variant options
    await db.query(
      `INSERT INTO variant_options 
         (variant_type_id, name, price_adjustment, is_default, branch_id)
       VALUES 
         (?, 'Small', 0.00, TRUE, ?),
         (?, 'Medium', 1.50, FALSE, ?),
         (?, 'Large', 2.50, FALSE, ?),
         (?, 'Mild', 0.00, TRUE, ?),
         (?, 'Medium', 0.00, FALSE, ?),
         (?, 'Hot', 0.00, FALSE, ?),
         (?, 'Whole Milk', 0.00, TRUE, ?),
         (?, 'Skim Milk', 0.00, FALSE, ?),
         (?, 'Almond Milk', 0.50, FALSE, ?),
         (?, 'Soy Milk', 0.50, FALSE, ?)
       ON DUPLICATE KEY UPDATE 
         price_adjustment = VALUES(price_adjustment),
         is_default = VALUES(is_default),
         updated_at = CURRENT_TIMESTAMP`,
      [
        sizeVariant[0].id, branchId,
        sizeVariant[0].id, branchId,
        sizeVariant[0].id, branchId,
        spiceVariant[0].id, branchId,
        spiceVariant[0].id, branchId,
        spiceVariant[0].id, branchId,
        milkVariant[0].id, branchId,
        milkVariant[0].id, branchId,
        milkVariant[0].id, branchId,
        milkVariant[0].id, branchId
      ]
    );
    
    // Insert sample menu items
    const [menuItems] = await db.query(
      `INSERT INTO menu_items 
         (name, description, price, category_id, branch_id, is_vegetarian, is_available, preparation_time)
       VALUES 
         ('Spring Rolls', 'Crispy vegetable spring rolls with sweet chili sauce', 5.99, ?, ?, TRUE, TRUE, 10),
         ('Chicken Wings', 'Crispy fried chicken wings with your choice of sauce', 8.99, ?, ?, FALSE, TRUE, 15),
         ('Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and basil', 12.99, ?, ?, TRUE, TRUE, 20),
         ('Chocolate Brownie', 'Warm chocolate brownie with vanilla ice cream', 6.99, ?, ?, TRUE, TRUE, 5)
       ON DUPLICATE KEY UPDATE 
         description = VALUES(description),
         price = VALUES(price),
         category_id = VALUES(category_id),
         is_vegetarian = VALUES(is_vegetarian),
         is_available = VALUES(is_available),
         preparation_time = VALUES(preparation_time),
         updated_at = CURRENT_TIMESTAMP`,
      [
        appetizers[0].id, branchId,
        appetizers[0].id, branchId,
        mainCourse[0].id, branchId,
        mainCourse[0].id, branchId
      ]
    );
    
    console.log('Initial menu data seeded successfully');
  } catch (error) {
    console.error('Error seeding initial menu data:', error);
    throw error;
  }
};

/**
 * Remove the seeded data
 * @param {import('mysql2/promise').Pool} db - Database connection pool
 */
const down = async (db) => {
  try {
    // We don't want to delete all menu items in production
    if (process.env.NODE_ENV === 'production') {
      console.log('Skipping data deletion in production environment');
      return;
    }
    
    // In development/test, we can safely delete the test data
    await db.query('DELETE FROM menu_item_variant_options');
    await db.query('DELETE FROM menu_item_variants');
    await db.query('DELETE FROM menu_items');
    await db.query('DELETE FROM variant_options');
    await db.query('DELETE FROM variant_types');
    await db.query('DELETE FROM categories');
    
    console.log('Seeded menu data removed successfully');
  } catch (error) {
    console.error('Error removing seeded menu data:', error);
    throw error;
  }
};

module.exports = { up, down };
