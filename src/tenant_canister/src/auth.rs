use candid::Principal;
use ic_cdk::caller;
use shared::{LMSError, LMSResult, UserRole};
use crate::storage::{TENANT_DATA, USERS};

/// Check if the caller is an admin
pub fn is_admin() -> LMSResult<Principal> {
    let caller = caller();
    TENANT_DATA.with(|data| {
        match data.borrow().get() {
            Some(data) if data.admin_principal == caller => Ok(caller),
            Some(_) => {
                // Also check if caller is a TenantAdmin user
                USERS.with(|users| {
                    for (_, user) in users.borrow().iter() {
                        if user.role == UserRole::TenantAdmin {
                            return Ok(caller);
                        }
                    }
                    Err(LMSError::Unauthorized("Admin access required".to_string()))
                })
            },
            None => Err(LMSError::InitializationError("Tenant not initialized".to_string())),
        }
    })
}

/// Check if the caller is a teacher or admin
pub fn is_teacher_or_admin() -> LMSResult<Principal> {
    let caller = caller();
    
    // First check if admin
    if is_admin().is_ok() {
        return Ok(caller);
    }
    
    // Then check if instructor
    USERS.with(|users| {
        for (_, user) in users.borrow().iter() {
            if user.role == UserRole::Instructor || user.role == UserRole::TenantAdmin {
                return Ok(caller);
            }
        }
        Err(LMSError::Unauthorized("Teacher or admin access required".to_string()))
    })
}

/// Check if caller is authenticated and has student level access or above
#[allow(dead_code)]
pub fn is_student_or_above() -> LMSResult<Principal> {
    let caller = caller();
    
    // Allow any user with a role
    USERS.with(|users| {
        for (_, user) in users.borrow().iter() {
            match user.role {
                UserRole::Student | UserRole::Instructor | UserRole::TenantAdmin | UserRole::Admin => {
                    return Ok(caller);
                }
            }
        }
        Err(LMSError::Unauthorized("User access required".to_string()))
    })
}
