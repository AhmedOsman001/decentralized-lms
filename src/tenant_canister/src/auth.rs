use candid::Principal;

use ic_cdk::caller;

use shared::{LMSError, LMSResult, UserRole};

use crate::storage::{TENANT_DATA, USERS};

/// Check if the caller is an admin (either router canister or TenantAdmin user)

pub fn is_admin() -> LMSResult<Principal> {
    let caller = caller();

    // First check if caller is the router canister (original admin)

    let router_admin = TENANT_DATA.with(|data| match data.borrow().get() {
        Some(data) if data.admin_principal == caller => true,

        _ => false,
    });

    if router_admin {
        return Ok(caller);
    }

    // Then check if caller is a TenantAdmin user

    USERS.with(|users| {
        for (_, user) in users.borrow().iter() {
            if user.role == UserRole::TenantAdmin && caller.to_string() == user.id {
                return Ok(caller);
            }
        }

        Err(LMSError::Unauthorized("Admin access required".to_string()))
    })
}

/// Check if the caller is a teacher or admin

pub fn is_teacher_or_admin() -> LMSResult<Principal> {
    let caller = caller();

    // First check if admin

    if is_admin().is_ok() {
        return Ok(caller);
    }

    // Then check if this specific caller is an instructor

    USERS.with(|users| {
        for (_, user) in users.borrow().iter() {
            // Check if THIS specific caller is an instructor or tenant admin

            if (user.role == UserRole::Instructor || user.role == UserRole::TenantAdmin)
                && caller.to_string() == user.id
            {
                return Ok(caller);
            }
        }

        Err(LMSError::Unauthorized(
            "Teacher or admin access required".to_string(),
        ))
    })
}

/// Check if caller is authenticated and has student level access or above

#[allow(dead_code)]

pub fn is_student_or_above() -> LMSResult<Principal> {
    let caller = caller();

    // Allow this specific caller if they have a role

    USERS.with(|users| {
        for (_, user) in users.borrow().iter() {
            // Check if THIS specific caller has a valid role

            if caller.to_string() == user.id {
                match user.role {
                    UserRole::Student
                    | UserRole::Instructor
                    | UserRole::TenantAdmin
                    | UserRole::Admin => {
                        return Ok(caller);
                    }
                }
            }
        }

        Err(LMSError::Unauthorized("User access required".to_string()))
    })
}
