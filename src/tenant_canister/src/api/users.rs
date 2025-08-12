use candid::candid_method;
use ic_cdk::{query, update};
use shared::{User, UserRole, LMSResult};
use crate::{user_management, rbac};

// User Management API with RBAC Guards

#[update]
#[candid_method(update)]
pub fn register_user(id: String, name: String, email: String, role: UserRole, tenant_id: String) -> LMSResult<User> {
    // Check if caller has permission to create users
    rbac::require_admin()?;
    
    // Validate role assignment permissions
    rbac::can_assign_role(&role)?;
    
    // Log the action
    rbac::log_rbac_action("register_user", true, Some(&id));
    
    user_management::register_user(id, name, email, role, tenant_id)
}

#[query]
#[candid_method(query)]
pub fn list_users() -> Vec<User> {
    // Check if caller can view all users (Instructor or higher)
    match rbac::require_teacher() {
        Ok(_) => {
            rbac::log_rbac_action("list_users", true, None);
            user_management::list_users()
        },
        Err(_) => {
            rbac::log_rbac_action("list_users", false, None);
            Vec::new() // Return empty list instead of error for query method
        }
    }
}

#[query]
#[candid_method(query)]
pub fn get_user(user_id: String) -> LMSResult<User> {
    // Check if caller can access this user's data
    rbac::can_access_user_data(&user_id)?;
    
    rbac::log_rbac_action("get_user", true, Some(&user_id));
    user_management::get_user(user_id)
}

#[update]
#[candid_method(update)]
pub fn update_user(user_id: String, name: Option<String>, email: Option<String>, is_active: Option<bool>) -> LMSResult<User> {
    // Check if caller can modify this user
    rbac::can_modify_user(&user_id)?;
    
    rbac::log_rbac_action("update_user", true, Some(&user_id));
    user_management::update_user(user_id, name, email, is_active)
}

/// Update user role (Admin only)
#[update]
#[candid_method(update)]
pub fn update_user_role(user_id: String, new_role: UserRole) -> LMSResult<User> {
    // Only admins can change user roles
    rbac::require_admin()?;
    
    // Validate role assignment permissions
    rbac::can_assign_role(&new_role)?;
    
    rbac::log_rbac_action("update_user_role", true, Some(&user_id));
    user_management::update_user_role(user_id, new_role)
}

/// Deactivate user account (Admin only)
#[update]
#[candid_method(update)]
pub fn deactivate_user(user_id: String) -> LMSResult<User> {
    // Only admins can deactivate users
    rbac::require_admin()?;
    
    rbac::log_rbac_action("deactivate_user", true, Some(&user_id));
    user_management::update_user(user_id, None, None, Some(false))
}

/// Reactivate user account (Admin only)
#[update]
#[candid_method(update)]
pub fn reactivate_user(user_id: String) -> LMSResult<User> {
    // Only admins can reactivate users
    rbac::require_admin()?;
    
    rbac::log_rbac_action("reactivate_user", true, Some(&user_id));
    user_management::update_user(user_id, None, None, Some(true))
}

/// Public query to fetch display names for given user IDs (authenticated callers only)
#[query]
#[candid_method(query)]
pub fn get_public_user_names(user_ids: Vec<String>) -> Vec<(String, String)> {
    // Any authenticated user can resolve display names
    match rbac::require_authenticated() {
        Ok(_) => user_management::get_public_user_names(user_ids),
        Err(_) => Vec::new(),
    }
}
