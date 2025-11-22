-- Run this SQL against the RBAC database to assign the 'admin' role to user A001.
-- It uses a subquery to safely resolve the 'admin' role id.

INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by, is_active) VALUES
('A001', (SELECT id FROM roles WHERE name = 'admin'), 'A001', TRUE);

-- Example (mysql):
-- docker exec -i rbac-mysql-server mysql -uroot -p${MYSQL_ROOT_PASSWORD} rbac-db < assign_admin_A001.sql
