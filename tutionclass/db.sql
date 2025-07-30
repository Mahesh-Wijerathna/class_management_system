CREATE TABLE students (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100),
    mobile VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255)
);

INSERT INTO students (id, name, mobile, email, password_hash) VALUES
('s001', 'Student One', '0711111111', 'student1@example.com', '$2y$10$mSfuQh5CkN9L6azDbNZbt.yJBJlPpUQm8kWOuAa3sS9kMewL2ui5G'),
('s002', 'Student Two', '0722222222', 'student2@example.com', '$2y$10$mSfuQh5CkN9L6azDbNZbt.yJBJlPpUQm8kWOuAa3sS9kMewL2ui5G'),
('s003', 'Student Three', '0733333333', 'student3@example.com', '$2y$10$mSfuQh5CkN9L6azDbNZbt.yJBJlPpUQm8kWOuAa3sS9kMewL2ui5G');





CREATE TABLE teachers (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100),
    mobile VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255)
);

-- Teachers
INSERT INTO teachers (id, name, mobile, email, password_hash) VALUES
('t001', 'Teacher One', '0744444444', 'teacher1@example.com', '$2y$10$mSfuQh5CkN9L6azDbNZbt.yJBJlPpUQm8kWOuAa3sS9kMewL2ui5G'),
('t002', 'Teacher Two', '0755555555', 'teacher2@example.com', '$2y$10$mSfuQh5CkN9L6azDbNZbt.yJBJlPpUQm8kWOuAa3sS9kMewL2ui5G'),
('t003', 'Teacher Three', '0766666666', 'teacher3@example.com', '$2y$10$mSfuQh5CkN9L6azDbNZbt.yJBJlPpUQm8kWOuAa3sS9kMewL2ui5G');




CREATE TABLE admins (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100),
    mobile VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255)
);


-- Admins
INSERT INTO admins (id, name, mobile, email, password_hash) VALUES
('a001', 'Admin One', '0777777777', 'admin1@example.com', '$2y$10$mSfuQh5CkN9L6azDbNZbt.yJBJlPpUQm8kWOuAa3sS9kMewL2ui5G'),
('a002', 'Admin Two', '0788888888', 'admin2@example.com', '$2y$10$mSfuQh5CkN9L6azDbNZbt.yJBJlPpUQm8kWOuAa3sS9kMewL2ui5G'),
('a003', 'Admin Three', '0799999999', 'admin3@example.com', '$2y$10$mSfuQh5CkN9L6azDbNZbt.yJBJlPpUQm8kWOuAa3sS9kMewL2ui5G');



CREATE TABLE staff (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100),
    mobile VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255)
);


-- Staff (Minor Staff)
INSERT INTO staff (id, name, mobile, email, password_hash) VALUES
('m001', 'Staff One', '0700000001', 'staff1@example.com', '$2y$10$mSfuQh5CkN9L6azDbNZbt.yJBJlPpUQm8kWOuAa3sS9kMewL2ui5G'),
('m002', 'Staff Two', '0700000002', 'staff2@example.com', '$2y$10$mSfuQh5CkN9L6azDbNZbt.yJBJlPpUQm8kWOuAa3sS9kMewL2ui5G'),
('m003', 'Staff Three', '0700000003', 'staff3@example.com', '$2y$10$mSfuQh5CkN9L6azDbNZbt.yJBJlPpUQm8kWOuAa3sS9kMewL2ui5G');