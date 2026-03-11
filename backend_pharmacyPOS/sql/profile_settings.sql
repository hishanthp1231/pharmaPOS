CREATE TABLE profile_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  role VARCHAR(30) NOT NULL
);

-- Insert default row
INSERT INTO profile_settings (name, email, phone, role) VALUES ('', '', '', 'Admin');
