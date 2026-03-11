const { promises: fs } = require('fs');
const path = require('path');

/**
 * Create all menu system related tables
 * @param {import('mysql2/promise').Pool} db - Database connection pool
 */
const up = async (db) => {
  try {
    // Create categories table
    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        branch_id INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_category_per_branch (name, branch_id),
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create variant_types table
    await db.query(`
      CREATE TABLE IF NOT EXISTS variant_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        branch_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_variant_type_per_branch (name, branch_id),
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create variant_options table
    await db.query(`
      CREATE TABLE IF NOT EXISTS variant_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        variant_type_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
        is_default BOOLEAN DEFAULT FALSE,
        branch_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_option_per_type (variant_type_id, name),
        FOREIGN KEY (variant_type_id) REFERENCES variant_types(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create menu_items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category_id INT NOT NULL,
        branch_id INT NOT NULL,
        is_vegetarian BOOLEAN DEFAULT FALSE,
        is_vegan BOOLEAN DEFAULT FALSE,
        is_gluten_free BOOLEAN DEFAULT FALSE,
        is_available BOOLEAN DEFAULT TRUE,
        image_url VARCHAR(255),
        preparation_time INT COMMENT 'Preparation time in minutes',
        ingredients TEXT COMMENT 'JSON string of ingredients with quantities',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
        UNIQUE KEY unique_menu_item_per_branch (name, branch_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create menu_item_variants junction table
    await db.query(`
      CREATE TABLE IF NOT EXISTS menu_item_variants (
        menu_item_id INT NOT NULL,
        variant_type_id INT NOT NULL,
        is_required BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (menu_item_id, variant_type_id),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_type_id) REFERENCES variant_types(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create menu_item_variant_options junction table
    await db.query(`
      CREATE TABLE IF NOT EXISTS menu_item_variant_options (
        menu_item_id INT NOT NULL,
        variant_option_id INT NOT NULL,
        price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (menu_item_id, variant_option_id),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_option_id) REFERENCES variant_options(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Menu system tables created successfully');
  } catch (error) {
    console.error('Error creating menu system tables:', error);
    throw error;
  }
};

/**
 * Drop all menu system related tables
 * @param {import('mysql2/promise').Pool} db - Database connection pool
 */
const down = async (db) => {
  try {
    // Drop tables in reverse order of creation to handle foreign key constraints
    await db.query('DROP TABLE IF EXISTS menu_item_variant_options');
    await db.query('DROP TABLE IF EXISTS menu_item_variants');
    await db.query('DROP TABLE IF EXISTS menu_items');
    await db.query('DROP TABLE IF EXISTS variant_options');
    await db.query('DROP TABLE IF EXISTS variant_types');
    await db.query('DROP TABLE IF EXISTS categories');
    
    console.log('Menu system tables dropped successfully');
  } catch (error) {
    console.error('Error dropping menu system tables:', error);
    throw error;
  }
};

module.exports = { up, down };
