CREATE TABLE menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  cost DECIMAL(10,2),
  isAvailable BOOLEAN DEFAULT 1,
  image VARCHAR(512),
  branch_id INT NOT NULL
);

CREATE TABLE menu_item_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2),
  unit VARCHAR(32),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

CREATE TABLE menu_item_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  type VARCHAR(255) NOT NULL,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

CREATE TABLE menu_item_variant_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_variant_id INT NOT NULL,
  optionId INT,
  name VARCHAR(255),
  price DECIMAL(10,2),
  FOREIGN KEY (menu_item_variant_id) REFERENCES menu_item_variants(id) ON DELETE CASCADE
);
