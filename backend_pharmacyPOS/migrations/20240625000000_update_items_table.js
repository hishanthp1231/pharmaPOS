const db = require('../db');

module.exports = {
  up: async () => {
    try {
      // Check if the columns already exist
      const [columns] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items'`
      );

      const columnNames = columns.map(col => col.COLUMN_NAME);
      
      // Add missing columns or modify existing ones
      if (!columnNames.includes('model_name')) {
        await db.query(
          `ALTER TABLE items 
           CHANGE COLUMN name model_name VARCHAR(255) NOT NULL`
        );
      }

      if (!columnNames.includes('model_number')) {
        await db.query(
          `ALTER TABLE items 
           CHANGE COLUMN model model_number VARCHAR(255) NOT NULL`
        );
      }

      if (!columnNames.includes('category_id')) {
        await db.query(
          `ALTER TABLE items 
           CHANGE COLUMN categoryCode category_id INT NOT NULL`
        );
      }

      if (!columnNames.includes('variant_type')) {
        await db.query(
          `ALTER TABLE items 
           ADD COLUMN variant_type VARCHAR(255) NULL`
        );
      }

      if (!columnNames.includes('variant_option')) {
        await db.query(
          `ALTER TABLE items 
           ADD COLUMN variant_option VARCHAR(255) NULL`
        );
      }

      console.log('Items table updated successfully');
    } catch (error) {
      console.error('Error updating items table:', error);
      throw error;
    }
  },

  down: async () => {
    // Rollback changes if needed
    await db.query(
      `ALTER TABLE items 
       CHANGE COLUMN model_name name VARCHAR(255) NOT NULL,
       CHANGE COLUMN model_number model VARCHAR(255) NOT NULL,
       CHANGE COLUMN category_id categoryCode INT NOT NULL`
    );

    await db.query(
      `ALTER TABLE items 
       DROP COLUMN variant_type,
       DROP COLUMN variant_option`
    );
  }
};
