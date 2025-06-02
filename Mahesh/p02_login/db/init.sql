CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

-- Insert a test user: username = admin, password = admin
INSERT INTO users (username, password) VALUES ('admin', MD5('admin'));
