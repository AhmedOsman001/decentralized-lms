// Modular Tenant Canister for Decentralized LMS
// This canister manages a single tenant (university) instance

mod types;
mod storage;
mod auth;
mod user_management;
mod course_management;
mod grade_management;
mod api;

use ic_cdk::init;
use candid::Principal;
use shared::{User, UserRole, utils, LMSResult, Course, Grade, GradeType};
use crate::types::TenantData;
use crate::storage::{TENANT_DATA, USERS};

// Re-export API functions
pub use api::*;

/// Initialize the tenant canister with an optional tenant ID and admin principal
#[init]
fn init(init_args: Option<(Option<String>, Option<Principal>)>) {
    TENANT_DATA.with(|data| {
        if data.borrow().get().is_some() {
            ic_cdk::trap("Tenant canister already initialized");
        }
        
        // Extract arguments
        let (tenant_id, admin_principal_opt) = init_args.unwrap_or((None, None));
        
        ic_cdk::println!("Tenant canister init called with tenant_id: {:?}, admin_principal: {:?}", tenant_id, admin_principal_opt);
        
        // For direct deployment, we'll create a anonymous admin that can be updated later
        // For router deployment, we require the admin principal
        let admin_principal = if let Some(admin) = admin_principal_opt {
            admin
        } else {
            // Use anonymous principal as anonymous for direct deployment
            ic_cdk::println!("No admin principal provided - using anonymous");
            Principal::anonymous()
        };
        
        // Determine tenant ID - use provided one or generate a new one
        let actual_tenant_id = tenant_id.unwrap_or_else(|| {
            format!("tenant_{}", utils::current_time())
        });
        
        // Check if there are existing users (migration case)
        let existing_tenant_id = USERS.with(|users| {
            for (_, user) in users.borrow().iter() {
                if user.role == UserRole::TenantAdmin {
                    return Some(user.tenant_id.clone());
                }
            }
            None
        });
        
        let tenant_data = if let Some(_existing_id) = existing_tenant_id {
            // Recover from existing data but use the provided tenant_id
            TenantData {
                tenant_id: actual_tenant_id.clone(),
                admin_principal,
                is_initialized: true,
                created_at: utils::current_time(),
            }
        } else {
            // Fresh initialization with provided tenant_id
            let tenant_data = TenantData {
                tenant_id: actual_tenant_id.clone(),
                admin_principal,
                is_initialized: true,
                created_at: utils::current_time(),
            };
            
            // Only create admin user if we have a real admin principal (not anonymous)
            if admin_principal != Principal::anonymous() {
                // Create the initial admin user
                let admin_user = User {
                    id: admin_principal.to_string(),
                    name: "TenantAdmin".to_string(),
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
                
                ic_cdk::println!("Created admin user for principal: {}", admin_principal);
            } else {
                ic_cdk::println!("Skipped admin user creation - placeholder principal used");
            }
            
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

