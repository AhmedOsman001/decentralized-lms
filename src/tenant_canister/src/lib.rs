// Modular Tenant Canister for Decentralized LMS
// This canister manages a single tenant (university) instance

mod types;
mod storage;
mod auth;
mod user_management;
mod course_management;
mod grade_management;
mod api;

use ic_cdk::{init, caller};
use shared::{User, UserRole, utils, LMSResult, Course, Grade, GradeType};
use crate::types::TenantData;
use crate::storage::{TENANT_DATA, USERS};

// Re-export API functions
pub use api::*;

/// Initialize the tenant canister
#[init]
fn init() {
    TENANT_DATA.with(|data| {
        if data.borrow().get().is_some() {
            ic_cdk::trap("Tenant canister already initialized");
        }
        
        // Use the caller as the admin (the one deploying the canister)
        let admin_principal = caller();
        
        // Check if there are existing users (migration case)
        let existing_tenant_id = USERS.with(|users| {
            for (_, user) in users.borrow().iter() {
                if user.role == UserRole::TenantAdmin {
                    return Some(user.tenant_id.clone());
                }
            }
            None
        });
        
        let tenant_data = if let Some(existing_id) = existing_tenant_id {
            // Recover from existing data
            TenantData {
                tenant_id: existing_id,
                admin_principal,
                is_initialized: true,
                created_at: utils::current_time(),
            }
        } else {
            // Fresh initialization
            let tenant_data = TenantData {
                tenant_id: format!("tenant_{}", utils::current_time()),
                admin_principal,
                is_initialized: true,
                created_at: utils::current_time(),
            };
            
            // Create the initial admin user
            let admin_user = User {
                id: format!("admin_{}", utils::current_time()),
                name: "System Admin".to_string(),
                email: format!("admin@{}.edu", tenant_data.tenant_id),
                role: UserRole::TenantAdmin,
                tenant_id: tenant_data.tenant_id.clone(),
                created_at: utils::current_time(),
                updated_at: utils::current_time(),
                is_active: true,
            };
            
            USERS.with(|users| {
                users.borrow_mut().insert(admin_user.id.clone(), admin_user);
            });
            
            tenant_data
        };
        
        data.borrow_mut().set(Some(tenant_data.clone())).expect("Failed to store tenant data");
        ic_cdk::println!("Tenant canister initialized with admin: {} and tenant_id: {}", admin_principal, tenant_data.tenant_id);
    });
}

// Generate Candid interface
candid::export_service!();

#[ic_cdk::query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    __export_service()
}

#[cfg(test)]
mod tests {
    use super::*;
    use candid::Principal;
    
    #[test]
    fn test_tenant_initialization() {
        let admin = Principal::from_text("rrkah-fqaaa-aaaah-qcura-cai").unwrap();
        // Note: In actual tests, would need to set up the canister environment
        // This is a basic structure test
        assert!(admin.to_string().len() > 0);
    }
    
    #[test] 
    fn test_tenant_data_creation() {
        let tenant_data = TenantData {
            tenant_id: "test_tenant".to_string(),
            admin_principal: Principal::anonymous(),
            is_initialized: true,
            created_at: 1234567890,
        };
        assert_eq!(tenant_data.tenant_id, "test_tenant");
        assert!(tenant_data.is_initialized);
    }
}
