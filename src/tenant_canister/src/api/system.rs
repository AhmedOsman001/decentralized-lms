use candid::candid_method;
use ic_cdk::{query, update, caller};
use shared::{User, UserRole, LMSResult, LMSError};
use crate::types::TenantData;
use crate::storage::{TENANT_DATA, USERS};
use crate::{user_management, rbac};

// System API

#[query]
#[candid_method(query)]
pub fn health_check() -> String {
    format!("Tenant canister is healthy. Caller: {}", caller())
}

#[query]
#[candid_method(query)]
pub fn get_tenant_info() -> LMSResult<TenantData> {
    TENANT_DATA.with(|data| {
        data.borrow()
            .get()
            .clone()
            .ok_or_else(|| LMSError::NotFound("Tenant data not initialized".to_string()))
    })
}

/// Recover tenant data from existing users (migration helper)
#[update]
#[candid_method(update)]
pub fn recover_tenant_data() -> LMSResult<TenantData> {
    // Only allow recovery if no tenant data exists
    let existing_data = TENANT_DATA.with(|data| data.borrow().get().clone());
    if existing_data.is_some() {
        return Err(LMSError::AccessDenied("Tenant data already exists".to_string()));
    }
    
    // Try to infer tenant from users
    let users = user_management::list_users();
    if users.is_empty() {
        return Err(LMSError::NotFound("No users found to recover tenant from".to_string()));
    }
    
    // Use the tenant_id from the first user
    let first_user = &users[0];
    let tenant_data = TenantData {
        tenant_id: first_user.tenant_id.clone(),
        admin_principal: caller(),
        created_at: shared::utils::current_time(),
        is_initialized: true,
    };
    
    TENANT_DATA.with(|data| {
        let _ = data.borrow_mut().set(Some(tenant_data.clone()));
    });
    Ok(tenant_data)
}

// RBAC (Role-Based Access Control) API Functions

/// Check if the current caller is an admin
#[query]
#[candid_method(query)]
pub fn is_admin() -> bool {
    rbac::require_admin().is_ok()
}

/// Check if the current caller is a teacher/instructor
#[query]
#[candid_method(query)]
pub fn is_teacher() -> bool {
    rbac::require_teacher().is_ok()
}

/// Check if the current caller is a student
#[query]
#[candid_method(query)]
pub fn is_student() -> bool {
    rbac::require_student().is_ok()
}

/// Check if the current caller is authenticated
#[query]
#[candid_method(query)]
pub fn is_authenticated() -> bool {
    rbac::require_authenticated().is_ok()
}

/// Check if the current caller is anonymous
#[query]
#[candid_method(query)]
pub fn is_anonymous_caller() -> bool {
    caller() == candid::Principal::anonymous()
}

/// Get user count (for admin statistics)
#[query]
#[candid_method(query)]
pub fn get_user_count() -> LMSResult<u64> {
    rbac::require_admin()?;
    
    let count = USERS.with(|users| users.borrow().len());
    Ok(count)
}

/// Get the current caller's user information
#[query]
#[candid_method(query)]
pub fn get_current_user() -> LMSResult<User> {
    rbac::get_caller_user()
}

/// Get the current caller's role
#[query]
#[candid_method(query)]
pub fn get_current_user_role() -> LMSResult<UserRole> {
    rbac::get_caller_role()
}

/// Check if the current caller has a specific role or higher
#[query]
#[candid_method(query)]
pub fn has_role(role: UserRole) -> bool {
    rbac::has_role(&role)
}

/// Check if the current caller can perform a specific action
#[query]
#[candid_method(query)]
pub fn can_perform_action(action: String) -> bool {
    rbac::can_perform_action(&action).is_ok()
}

/// Get the current caller's principal ID as string
#[query]
#[candid_method(query)]
pub fn get_caller_principal() -> String {
    rbac::get_caller_id()
}
