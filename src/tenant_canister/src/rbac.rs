use candid::Principal;
use ic_cdk::caller;
use shared::{User, UserRole, LMSError, LMSResult};
use crate::storage::{USERS, TENANT_DATA};

/// RBAC (Role-Based Access Control) implementation for tenant canister
/// Provides comprehensive authentication and authorization functions

/// Check if the current caller is an admin (Admin or TenantAdmin)
pub fn is_admin() -> bool {
    match get_caller_user_or_router_admin() {
        Ok(user_or_router) => {
            match user_or_router {
                UserOrRouter::User(user) => matches!(user.role, UserRole::Admin | UserRole::TenantAdmin),
                UserOrRouter::RouterAdmin => true, // Router canister is always admin
            }
        },
        Err(_) => false,
    }
}

/// Check if the current caller has a specific role
pub fn has_role(required_role: &UserRole) -> bool {
    match get_caller_user() {
        Ok(user) => user.role.has_permission_level(required_role),
        Err(_) => false,
    }
}

/// Internal enum to distinguish between user and router admin
enum UserOrRouter {
    User(User),
    RouterAdmin, // Unit variant since we don't need to store the Principal
}

/// Get the current caller's information, checking both users and router admin
/// This replaces the old auth.rs functionality
fn get_caller_user_or_router_admin() -> LMSResult<UserOrRouter> {
    let caller_principal = caller();
    
    // Check for anonymous caller
    if caller_principal == Principal::anonymous() {
        return Err(LMSError::UserNotAuthenticated(
            "Anonymous access not allowed".to_string()
        ));
    }
    
    // First check if caller is the router canister (original admin)
    let is_router_admin = TENANT_DATA.with(|data| {
        match data.borrow().get() {
            Some(tenant_data) if tenant_data.admin_principal == caller_principal => true,
            _ => false,
        }
    });
    
    if is_router_admin {
        return Ok(UserOrRouter::RouterAdmin);
    }
    
    // Then check if caller is a registered user
    let caller_id = caller_principal.to_string();
    USERS.with(|users| {
        match users.borrow().get(&caller_id) {
            Some(user) => {
                // Check if user is active
                if !user.is_active {
                    Err(LMSError::Unauthorized(
                        "User account is deactivated".to_string()
                    ))
                } else {
                    Ok(UserOrRouter::User(user))
                }
            },
            None => Err(LMSError::user_not_found(&caller_id)),
        }
    })
}

/// Get the current caller's user information
/// Returns user data if found, otherwise returns appropriate error
pub fn get_caller_user() -> LMSResult<User> {
    let caller_principal = caller();
    
    // Check for anonymous caller
    if caller_principal == Principal::anonymous() {
        return Err(LMSError::UserNotAuthenticated(
            "Anonymous access not allowed".to_string()
        ));
    }
    
    // Convert principal to string for lookup
    let caller_id = caller_principal.to_string();
    
    // Look up user in stable storage
    USERS.with(|users| {
        match users.borrow().get(&caller_id) {
            Some(user) => {
                // Check if user is active
                if !user.is_active {
                    Err(LMSError::Unauthorized(
                        "User account is deactivated".to_string()
                    ))
                } else {
                    Ok(user)
                }
            },
            None => Err(LMSError::user_not_found(&caller_id)),
        }
    })
}

/// Get the current caller's role
pub fn get_caller_role() -> LMSResult<UserRole> {
    get_caller_user().map(|user| user.role)
}

/// Check if the current caller can perform a specific action
pub fn can_perform_action(action: &str) -> LMSResult<()> {
    let user_or_router = get_caller_user_or_router_admin()?;
    
    // Router admin can do everything
    if matches!(user_or_router, UserOrRouter::RouterAdmin) {
        return Ok(());
    }
    
    let user = match user_or_router {
        UserOrRouter::User(user) => user,
        UserOrRouter::RouterAdmin => unreachable!(), // Already handled above
    };
    
    match action {
        // User management actions
        "create_user" | "update_user" | "delete_user" => {
            if user.role.can_manage_users() {
                Ok(())
            } else {
                Err(LMSError::unauthorized_access(action, "Admin"))
            }
        },
        "view_all_users" => {
            if user.role.can_view_all_users() {
                Ok(())
            } else {
                Err(LMSError::unauthorized_access(action, "Instructor"))
            }
        },
        
        // Course management actions
        "create_course" => {
            if user.role.can_create_course() {
                Ok(())
            } else {
                Err(LMSError::unauthorized_access(action, "Instructor"))
            }
        },
        
        // Grading actions
        "assign_grade" | "update_grade" => {
            if user.role.can_grade() {
                Ok(())
            } else {
                Err(LMSError::unauthorized_access(action, "Instructor"))
            }
        },
        "view_all_grades" => {
            if user.role.can_view_all_grades() {
                Ok(())
            } else {
                Err(LMSError::unauthorized_access(action, "Admin"))
            }
        },
        
        // Tenant administration
        "manage_tenant_settings" => {
            if user.role.can_manage_tenant_settings() {
                Ok(())
            } else {
                Err(LMSError::unauthorized_access(action, "TenantAdmin"))
            }
        },
        
        _ => Err(LMSError::ValidationError(
            format!("Unknown action: {}", action)
        ))
    }
}

// ============================================================================
// BACKWARD COMPATIBILITY FUNCTIONS (to replace auth.rs)
// ============================================================================

/// Check if the caller is an admin (either router canister or TenantAdmin user)
/// This replaces auth::is_admin() with the same return type
pub fn is_admin_compat() -> LMSResult<Principal> {
    let caller_principal = caller();
    
    match get_caller_user_or_router_admin()? {
        UserOrRouter::RouterAdmin => Ok(caller_principal),
        UserOrRouter::User(user) => {
            if matches!(user.role, UserRole::Admin | UserRole::TenantAdmin) {
                Ok(caller_principal)
            } else {
                Err(LMSError::unauthorized_access("admin access", "Admin"))
            }
        }
    }
}

/// RBAC Guard Macros and Functions
/// These provide convenient wrappers for protecting API methods

/// Guard wrapper that checks if caller is admin
pub fn require_admin() -> LMSResult<User> {
    let user = get_caller_user()?;
    if matches!(user.role, UserRole::Admin | UserRole::TenantAdmin) {
        Ok(user)
    } else {
        Err(LMSError::unauthorized_access("admin access", "Admin"))
    }
}

/// Guard wrapper that checks if caller is teacher or higher
pub fn require_teacher() -> LMSResult<User> {
    let user = get_caller_user()?;
    if user.role.has_permission_level(&UserRole::Instructor) {
        Ok(user)
    } else {
        Err(LMSError::unauthorized_access("teacher access", "Instructor"))
    }
}

/// Guard wrapper that checks if caller is authenticated (any role)
pub fn require_authenticated() -> LMSResult<User> {
    get_caller_user()
}

/// Require that the caller is a student or higher (any authenticated user)
pub fn require_student() -> LMSResult<User> {
    let user = get_caller_user()?;
    if user.role.has_permission_level(&UserRole::Student) {
        Ok(user)
    } else {
        Err(LMSError::unauthorized_access("student access", "Student"))
    }
}

/// Check if caller can access specific user data
pub fn can_access_user_data(target_user_id: &str) -> LMSResult<()> {
    let caller_user = get_caller_user()?;
    let caller_id = caller().to_string();
    let target_user_id_string = target_user_id.to_string();
    
    // Admin and TenantAdmin can access any user data
    if matches!(caller_user.role, UserRole::Admin | UserRole::TenantAdmin) {
        return Ok(());
    }
    
    // Instructors can view student data
    if matches!(caller_user.role, UserRole::Instructor) {
        // Check if target user is a student
        USERS.with(|users| {
            match users.borrow().get(&target_user_id_string) {
                Some(target_user) => {
                    if matches!(target_user.role, UserRole::Student) {
                        Ok(())
                    } else {
                        Err(LMSError::AccessDenied(
                            "Instructors can only access student data".to_string()
                        ))
                    }
                },
                None => Err(LMSError::user_not_found(target_user_id))
            }
        })
    } else if caller_id == target_user_id {
        // Users can access their own data
        Ok(())
    } else {
        Err(LMSError::AccessDenied(
            "Can only access your own user data".to_string()
        ))
    }
}

/// Check if caller can modify specific user
pub fn can_modify_user(target_user_id: &str) -> LMSResult<()> {
    let caller_user = get_caller_user()?;
    let target_user_id_string = target_user_id.to_string();
    
    // Only admins can modify users
    if !caller_user.role.can_manage_users() {
        return Err(LMSError::unauthorized_access("modify user", "Admin"));
    }
    
    // Check if target user exists and role assignment is valid
    USERS.with(|users| {
        match users.borrow().get(&target_user_id_string) {
            Some(target_user) => {
                // TenantAdmin can modify anyone, Admin cannot modify TenantAdmin
                if matches!(caller_user.role, UserRole::TenantAdmin) {
                    Ok(())
                } else if matches!(target_user.role, UserRole::TenantAdmin) {
                    Err(LMSError::InsufficientPermissions(
                        "Cannot modify TenantAdmin accounts".to_string()
                    ))
                } else {
                    Ok(())
                }
            },
            None => Err(LMSError::user_not_found(target_user_id))
        }
    })
}

/// Validate role assignment permissions
pub fn can_assign_role(new_role: &UserRole) -> LMSResult<()> {
    let caller_user = get_caller_user()?;
    
    if caller_user.role.can_assign_role(new_role) {
        Ok(())
    } else {
        Err(LMSError::InvalidRoleAssignment(
            format!("Cannot assign role '{}' with current permissions", new_role.as_str())
        ))
    }
}

/// Helper function to get caller principal as string
pub fn get_caller_id() -> String {
    caller().to_string()
}

/// Logging helper for RBAC actions
pub fn log_rbac_action(action: &str, success: bool, user_id: Option<&str>) {
    let caller_id = get_caller_id();
    let user_info = user_id.unwrap_or("unknown");
    
    ic_cdk::println!(
        "RBAC: action='{}', caller='{}', target_user='{}', success={}",
        action, caller_id, user_info, success
    );
}



#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_role_hierarchy() {
        assert!(UserRole::TenantAdmin.has_permission_level(&UserRole::Admin));
        assert!(UserRole::Admin.has_permission_level(&UserRole::Instructor));
        assert!(UserRole::Instructor.has_permission_level(&UserRole::Student));
        assert!(!UserRole::Student.has_permission_level(&UserRole::Instructor));
    }
    
    #[test]
    fn test_role_permissions() {
        assert!(UserRole::TenantAdmin.can_manage_users());
        assert!(UserRole::Admin.can_manage_users());
        assert!(!UserRole::Instructor.can_manage_users());
        assert!(!UserRole::Student.can_manage_users());
        
        assert!(UserRole::Instructor.can_create_course());
        assert!(!UserRole::Student.can_create_course());
    }
}
