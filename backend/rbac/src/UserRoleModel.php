<?php

class UserRoleModel {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function assignRoleToUser($userId, $roleId, $assignedBy = null) {
        // Check if the assignment already exists and is active
        $stmt = $this->conn->prepare("
            SELECT id FROM user_roles
            WHERE user_id = ? AND role_id = ? AND is_active = TRUE
        ");
        $stmt->bind_param("si", $userId, $roleId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            return false; // Already assigned
        }

        // Insert new assignment
        $stmt = $this->conn->prepare("
            INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
            VALUES (?, ?, ?, NOW(), TRUE)
        ");
        $stmt->bind_param("sis", $userId, $roleId, $assignedBy);

        if ($stmt->execute()) {
            return $this->conn->insert_id;
        }
        return false;
    }

    public function revokeRoleFromUser($userId, $roleId, $revokedBy = null) {
        // Delete the active assignment (instead of updating to keep history)
        $stmt = $this->conn->prepare("
            DELETE FROM user_roles
            WHERE user_id = ? AND role_id = ? AND is_active = TRUE
        ");
        $stmt->bind_param("si", $userId, $roleId);

        if ($stmt->execute()) {
            return $stmt->affected_rows > 0;
        }
        return false;
    }

    public function getUserRoles($userId) {
        // First get the user's inherent role from the users table
        $stmt = $this->conn->prepare("SELECT role FROM users WHERE userid = ?");
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        $roles = [];

        // Add inherent user role as a system role
        if ($user && $user['role']) {
            $roles[] = [
                'id' => null, // No ID for inherent roles
                'user_id' => $userId,
                'role_id' => null, // No role_id for inherent roles
                'assigned_by' => 'system',
                'assigned_at' => null, // No assignment date for inherent roles
                'role_name' => $user['role'],
                'role_description' => ucfirst($user['role']) . ' system role',
                'assigned_by_first_name' => 'System',
                'assigned_by_last_name' => 'Administrator',
                'is_inherent' => true
            ];
        }

        // Then get explicitly assigned RBAC roles
        $stmt = $this->conn->prepare("
            SELECT ur.id, ur.user_id, ur.role_id, ur.assigned_by, ur.assigned_at,
                   r.name as role_name, r.description as role_description,
                   u1.firstName as assigned_by_first_name, u1.lastName as assigned_by_last_name,
                   FALSE as is_inherent
            FROM user_roles ur
            INNER JOIN roles r ON ur.role_id = r.id
            LEFT JOIN users u1 ON ur.assigned_by = u1.userid
            WHERE ur.user_id = ? AND ur.is_active = TRUE
            ORDER BY ur.assigned_at DESC
        ");
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $rbacRoles = $result->fetch_all(MYSQLI_ASSOC);

        // Combine inherent role with RBAC roles
        $roles = array_merge($roles, $rbacRoles);

        return $roles;
    }

    public function getUserRoleHistory($userId) {
        // Since we delete revoked records, return current active roles as "history"
        // In a real system, you'd want a separate audit table for proper history
        return $this->getUserRoles($userId);
    }

    public function getAllUsers() {
        // Get all users with their inherent roles and assigned RBAC roles
        $result = $this->conn->query("
            SELECT u.userid, u.firstName, u.lastName, u.email, u.role as inherent_role,
                   GROUP_CONCAT(DISTINCT r.name) as assigned_rbac_roles
            FROM users u
            LEFT JOIN user_roles ur ON u.userid = ur.user_id AND ur.is_active = TRUE
            LEFT JOIN roles r ON ur.role_id = r.id
            GROUP BY u.userid, u.firstName, u.lastName, u.email, u.role
            ORDER BY u.firstName, u.lastName
        ");

        $users = [];
        while ($row = $result->fetch_assoc()) {
            // Combine inherent role with assigned RBAC roles
            $allRoles = [];
            if ($row['inherent_role']) {
                $allRoles[] = $row['inherent_role'];
            }
            if ($row['assigned_rbac_roles']) {
                $rbacRoles = explode(',', $row['assigned_rbac_roles']);
                $allRoles = array_merge($allRoles, $rbacRoles);
            }

            $users[] = [
                'userid' => $row['userid'],
                'firstName' => $row['firstName'],
                'lastName' => $row['lastName'],
                'email' => $row['email'],
                'mobile' => '', // Not available in users table
                'current_roles' => array_unique($allRoles)
            ];
        }

        return $users;
    }

    public function getUserById($userId) {
        $stmt = $this->conn->prepare("
            SELECT u.userid, u.firstName, u.lastName, u.email, u.role as inherent_role,
                   GROUP_CONCAT(DISTINCT r.name) as assigned_rbac_roles
            FROM users u
            LEFT JOIN user_roles ur ON u.userid = ur.user_id AND ur.is_active = TRUE
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE u.userid = ?
            GROUP BY u.userid, u.firstName, u.lastName, u.email, u.role
        ");
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();

        if (!$row) {
            return null;
        }

        // Combine inherent role with assigned RBAC roles
        $allRoles = [];
        if ($row['inherent_role']) {
            $allRoles[] = $row['inherent_role'];
        }
        if ($row['assigned_rbac_roles']) {
            $rbacRoles = explode(',', $row['assigned_rbac_roles']);
            $allRoles = array_merge($allRoles, $rbacRoles);
        }

        return [
            'userid' => $row['userid'],
            'firstName' => $row['firstName'],
            'lastName' => $row['lastName'],
            'email' => $row['email'],
            'mobile' => '', // Not available in users table
            'current_roles' => array_unique($allRoles)
        ];
    }

    public function userHasRole($userId, $roleId) {
        $stmt = $this->conn->prepare("
            SELECT id FROM user_roles
            WHERE user_id = ? AND role_id = ? AND is_active = TRUE
        ");
        $stmt->bind_param("si", $userId, $roleId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }

    public function getUsersByRole($roleId) {
        $stmt = $this->conn->prepare("
            SELECT u.userid, u.firstName, u.lastName, u.email, u.role,
                   ur.assigned_at, ur.assigned_by
            FROM user_roles ur
            INNER JOIN users u ON ur.user_id = u.userid
            WHERE ur.role_id = ? AND ur.is_active = TRUE
            ORDER BY ur.assigned_at DESC
        ");
        $stmt->bind_param("i", $roleId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function getUserPermissions($userId) {
        // First get the user's inherent role from the users table
        $stmt = $this->conn->prepare("SELECT role FROM users WHERE userid = ?");
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        $permissions = [];

        // Get permissions for inherent role
        if ($user && $user['role']) {
            $stmt = $this->conn->prepare("
                SELECT p.id, p.name, p.target_userrole, p.description
                FROM permissions p
                WHERE p.target_userrole = ?
            ");
            $stmt->bind_param("s", $user['role']);
            $stmt->execute();
            $result = $stmt->get_result();
            $inherentPermissions = $result->fetch_all(MYSQLI_ASSOC);
            $permissions = array_merge($permissions, $inherentPermissions);
        }

        // Get permissions for assigned RBAC roles
        $stmt = $this->conn->prepare("
            SELECT DISTINCT p.id, p.name, p.target_userrole, p.description
            FROM user_roles ur
            INNER JOIN roles r ON ur.role_id = r.id
            INNER JOIN role_permissions rp ON r.id = rp.role_id
            INNER JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = ? AND ur.is_active = TRUE
        ");
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $rbacPermissions = $result->fetch_all(MYSQLI_ASSOC);
        $permissions = array_merge($permissions, $rbacPermissions);

        // Remove duplicates based on permission name
        $uniquePermissions = [];
        $seenNames = [];
        foreach ($permissions as $permission) {
            if (!in_array($permission['name'], $seenNames)) {
                $uniquePermissions[] = $permission;
                $seenNames[] = $permission['name'];
            }
        }

        return $uniquePermissions;
    }
}