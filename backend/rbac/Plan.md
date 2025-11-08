## User Creation and Synchronization

### RBAC User Creation API
- **Endpoint**: `POST /users`
- **Purpose**: Create new users in the RBAC system when they are created in the auth backend
- **Required Fields**: `userid`, `firstName`, `lastName`, `email`, `role`
- **Implementation**: Add `UserController.php` and `UserModel.php` to RBAC backend
- **Database Integration**: Insert user into RBAC `users` table

### User Synchronization Flow
- **Trigger**: When a user is created in auth backend (student, teacher, cashier, admin)
- **Process**: Auth backend sends POST request to RBAC `/users` endpoint with user data
- **Role Assignment**: Automatically assign appropriate RBAC role based on user type:
  - `student` → `student_basic` role
  - `teacher` → `teacher_basic` role  
  - `cashier` → `cashier_basic` role
  - `admin` → `admin` role
- **Benefits**: 
  - Keeps RBAC user database in sync with main auth system
  - Automatic role assignment based on user type
  - Centralized permission management for all user types

### Implementation Steps
1. Create `UserController.php` in RBAC backend with `createUser()` method
2. Create `UserModel.php` in RBAC backend with user creation logic
3. Add `POST /users` route to RBAC `routes.php`
4. Update auth backend user creation methods to call RBAC sync API
5. Test user creation flow and automatic role assignment

## Frontend Permission Management Page

- **Access Control**: The permission management page can only be accessed by users with admin role.
- **Fields**:
  - Permission Name: Input field for the name of the permission.
- Target User Role: Input field for the target user role of the permission.
  - Description: Input field for the description of the permission.
- **Create Functionality**:
  - When the "Create" button is clicked, a POST request is sent to the backend.
  - The request includes the permission name, target user role, and description.
  - Upon successful creation, the permission is saved in the database.
- **Edit Functionality**:
  - Each permission row has an "Edit" button/icon.
  - Clicking edit opens a modal/form with pre-filled fields (name, target user role, description).
  - When "Update" button is clicked, a PUT request is sent to the backend with the permission ID.
  - The request includes updated permission name, target user role, and description.
  - Upon successful update, the permission is updated in the database and the list refreshes.
- **Delete Functionality**:
  - Each permission row has a "Delete" button/icon.
  - Clicking delete shows a confirmation dialog.
  - Upon confirmation, a DELETE request is sent to the backend with the permission ID.
  - Upon successful deletion, the permission is removed from the database and the list refreshes.
- **Database Schema**:
  - Permission Table:
    - `id`: Autoincrement primary key.
    - `name`: VARCHAR or TEXT field for permission name.
    - `target_userrole`: VARCHAR or TEXT field for target user role.
    - `description`: VARCHAR or TEXT field for permission description.

## Frontend Role Management Page

- **Access Control**: The role management page can only be accessed by users with admin role.
- **Location**: Available under "User Roles > Manage Roles" in the admin sidebar.
- **Fields**:
  - Role Name: Input field for the name of the role.
  - Description: Input field for the description of the role.
  - Permissions: Multi-select field to assign permissions to the role.
- **Create Role Functionality**:
  - When the "Create Role" button is clicked, a form modal opens.
  - User enters role name, description, and selects permissions to assign.
  - When "Create" button is clicked, a POST request is sent to the backend.
  - The request includes role name, description, and array of permission IDs.
  - Upon successful creation, the role is saved in the database with assigned permissions.
- **Edit Role Functionality**:
  - Each role row has an "Edit" button/icon.
  - Clicking edit opens a modal/form with pre-filled fields (name, description, assigned permissions).
  - User can modify role details and add/remove permissions.
  - When "Update" button is clicked, a PUT request is sent to the backend with the role ID.
  - The request includes updated role name, description, and array of permission IDs.
  - Upon successful update, the role is updated in the database and the list refreshes.
- **Delete Role Functionality**:
  - Each role row has a "Delete" button/icon.
  - Clicking delete shows a confirmation dialog.
  - Upon confirmation, a DELETE request is sent to the backend with the role ID.
  - Upon successful deletion, the role and all its permission assignments are removed from the database.
- **Assign/Revoke Permissions**:
  - In edit mode, user can check/uncheck permissions to assign or revoke them.
  - Changes are saved when the role is updated.
  - Permission assignments are managed through a junction table.
- **View Role Details**:
  - Each role row shows basic info (name, description, number of permissions).
  - Clicking on a role could expand to show assigned permissions.
- **Database Schema**:
  - Role Table:
    - `id`: Autoincrement primary key.
    - `name`: VARCHAR field for role name (unique).
    - `description`: TEXT field for role description.
    - `created_at`: TIMESTAMP for creation date.
  - Role_Permissions Table (junction table for many-to-many relationship):
    - `id`: Autoincrement primary key.
    - `role_id`: Foreign key to roles table.
    - `permission_id`: Foreign key to permissions table.
    - `assigned_at`: TIMESTAMP for when permission was assigned.
    - Unique constraint on (role_id, permission_id) to prevent duplicates.

## Frontend User Role Assignment Page

- **Access Control**: The user role assignment page can only be accessed by users with admin role.
- **Location**: Available under "User Management > Assign Roles" in the admin sidebar.
- **Purpose**: Allow administrators to assign and revoke roles from users, managing user access levels.
- **Fields**:
  - User Selection: Dropdown or search field to select a user from the system.
  - Current Roles: Display list of roles currently assigned to the selected user.
  - Available Roles: List of all available roles that can be assigned.
  - Role Assignment: Multi-select interface to assign/revoke roles.
- **User Selection Functionality**:
  - Search users by name, email, or ID.
  - Display user details (name, email, current roles) when selected.
  - Show current role assignments for the selected user.
- **Assign Role Functionality**:
  - Display all available roles in a list or grid.
  - Allow admin to select roles to assign to the user.
  - When "Assign Role" button is clicked, a POST request is sent to the backend.
  - The request includes user ID and role ID to assign.
  - Upon successful assignment, the user's role list is updated.
- **Revoke Role Functionality**:
  - For each role currently assigned to the user, show a "Revoke" button.
  - Clicking revoke shows a confirmation dialog.
  - Upon confirmation, a DELETE request is sent to the backend with user ID and role ID.
  - Upon successful revocation, the role is removed from the user's assignments.
- **Bulk Role Management**:
  - Allow assigning multiple roles at once to a user.
  - Allow revoking multiple roles at once from a user.
  - Provide "Assign All" and "Revoke All" options for convenience.
- **Role Assignment History**:
  - Track when roles were assigned/revoked and by whom.
  - Display assignment timestamps for audit purposes.
- **Validation and Constraints**:
  - Prevent assigning the same role twice to a user.
  - Ensure users always have at least one role (if required).
  - Validate that the admin has permission to assign/revoke roles.
- **Database Schema**:
  - User_Roles Table (junction table for user-role assignments):
    - `id`: Autoincrement primary key.
    - `user_id`: Foreign key to users table (references userid).
    - `role_id`: Foreign key to roles table.
    - `assigned_by`: Foreign key to users table (admin who assigned the role).
    - `assigned_at`: TIMESTAMP for when role was assigned.
    - `revoked_by`: Foreign key to users table (nullable, admin who revoked).
    - `revoked_at`: TIMESTAMP for when role was revoked (nullable).
    - `is_active`: BOOLEAN to track current assignments (true = active, false = revoked).
    - Unique constraint on (user_id, role_id, is_active) to prevent duplicate active assignments.
- **API Endpoints Required**:
  - GET /users - Get all users for selection
  - GET /users/{userId}/roles - Get current roles for a user
  - POST /users/{userId}/roles/{roleId} - Assign role to user
  - DELETE /users/{userId}/roles/{roleId} - Revoke role from user
  - GET /users/{userId}/roles/history - Get role assignment history for a user
  - GET /users/{userId}/permissions - Get all permissions for a user (combines inherent user role permissions and assigned RBAC role permissions)

## Frontend Permission-Based Access Control

- **Permission Checking System**:
  - Create permission checking utility (`permissionChecker.js`) with functions to get user permissions and check access rights
  - Implement caching mechanism to avoid repeated API calls for the same user's permissions
  - Support for checking single permissions, any of multiple permissions, or all of multiple permissions

- **Sidebar Access Control**:
  - Modify sidebar components to filter menu items based on user permissions
  - Add `requiredPermissions` array to each sidebar menu item specifying which permissions are needed to access it
  - Hide menu items that user doesn't have permission to access
  - Remove entire sections if all items in the section are hidden due to permissions

- **Permission Requirements by Feature**:
  - **User Roles Management**: Requires `user_roles.permissions` and `user_roles.all_roles` permissions
  - **Permission Management**: Requires `user_roles.permissions` permission
  - **Role Management**: Requires `user_roles.all_roles` permission
  - **User Role Assignment**: Requires `user_roles.all_roles` permission
  - **Admin Management**: Requires `admin.view` and `admin.create` permissions respectively
  - **Student Management**: Requires various student-related permissions (`student.enroll`, `student.cards`, etc.)
  - **Financial Operations**: Requires `finance.view` and `payment.view` permissions
  - **System Administration**: Requires various system-level permissions (`system.settings`, `system.backup`, etc.)

- **Implementation Approach**:
  - **Step 1**: Create permission checking utility with API integration
  - **Step 2**: Add permission requirements to sidebar menu items
  - **Step 3**: Modify dashboard components to fetch user permissions on load
  - **Step 4**: Filter sidebar items based on user permissions before rendering
  - **Step 5**: Handle loading states while permissions are being fetched
  - **Step 6**: Implement fallback behavior for permission loading failures

- **Security Considerations**:
  - Frontend permission checks are for UI/UX purposes only - all backend operations must still validate permissions server-side
  - Permission cache should be cleared on user logout or session changes
  - Handle cases where permission API calls fail gracefully (show limited UI or all options as fallback)
  - Log permission check failures for security monitoring

- **User Experience**:
  - Show loading indicator while permissions are being loaded
  - Clean UI with only relevant menu items visible to each user
  - No "Access Denied" messages for hidden menu items - items simply don't appear
  - Consistent permission checking across all dashboard types (admin, teacher, student, cashier)
