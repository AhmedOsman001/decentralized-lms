use candid::Principal;
use ic_cdk::caller;
use shared::{Tenant, TenantSettings, LMSError, LMSResult, utils, current_time};
use crate::storage::{with_routing_table, with_tenant_registry};
use crate::template::{get_template_config, get_deployed_tenant_canister, install_latest_template};
use crate::canister_management;

/// Register a new university and provision its tenant canister (Modern Template-Based Approach)
pub async fn register_university(
    subdomain: String,
    university_name: String,
    admin_principal: Principal,
) -> LMSResult<Tenant> {
    // Validate subdomain format
    if !utils::is_valid_subdomain(&subdomain) {
        return Err(LMSError::ValidationError("Invalid subdomain format".to_string()));
    }
    
    // Check if subdomain already exists
    let subdomain_exists = with_routing_table(|table| {
        table.borrow().contains_key(&subdomain)
    });
    
    if subdomain_exists {
        return Err(LMSError::AlreadyExists("Subdomain already registered".to_string()));
    }
    
    // Get template configuration
    let template_config = get_template_config();
    
    // Check if template is configured
    let template_canister_id = match template_config.template_canister_id {
        Some(id) => id,
        None => {
            // Fallback: use the deployed tenant canister as template
            ic_cdk::println!("No template configured, using deployed tenant canister");
            get_deployed_tenant_canister()?
        }
    };
    
    // Create new canister
    let canister_id = match canister_management::create_canister().await {
        Ok(principal) => principal,
        Err(e) => return Err(LMSError::InternalError(format!("Failed to create canister: {:?}", e))),
    };
    
    // Generate tenant ID once to ensure consistency
    let tenant_id = format!("tenant_{}", current_time());
    
    // Install latest template code with the tenant ID
    match install_latest_template(canister_id, template_canister_id, admin_principal, tenant_id.clone()).await {
        Ok(_) => {},
        Err(e) => {
            // Rollback: delete the created canister
            let _ = canister_management::delete_canister(canister_id).await;
            return Err(LMSError::InternalError(format!("Failed to install template: {:?}", e)));
        }
    }
    
    // Create tenant record using the same tenant_id that was passed to the canister
    let tenant = Tenant {
        id: tenant_id.clone(),
        name: university_name.clone(),
        subdomain: subdomain.clone(),
        canister_id: canister_id.to_string(),
        admin_ids: vec![admin_principal.to_string()],
        created_at: current_time(),
        updated_at: current_time(),
        is_active: true,
        settings: TenantSettings {
            max_students: 1000,
            max_instructors: 100,
            max_courses: 500,
            allow_public_enrollment: false,
            custom_branding: false,
        },
    };
    
    // Update routing table and tenant registry
    with_routing_table(|table| {
        table.borrow_mut().insert(subdomain, canister_id);
    });
    
    with_tenant_registry(|registry| {
        registry.borrow_mut().insert(tenant_id.clone(), tenant.clone());
    });
    
    ic_cdk::println!("University registered: {} -> {} (using template: {})", 
                     tenant.subdomain, canister_id, template_canister_id);
    Ok(tenant)
}

/// Legacy function for compatibility with existing tests
pub async fn register_tenant(
    id: String,
    name: String,
    domain: String,
    canister_id: String,
) -> LMSResult<Tenant> {
    // Parse canister_id string to Principal
    let principal = Principal::from_text(&canister_id)
        .map_err(|_| LMSError::ValidationError("Invalid canister ID format".to_string()))?;
    
    // Create tenant record
    let tenant = Tenant {
        id: id.clone(),
        name: name.clone(),
        subdomain: domain.clone(),
        canister_id: principal.to_string(),
        admin_ids: vec![caller().to_string()], // Keep caller for legacy compatibility
        created_at: current_time(),
        updated_at: current_time(),
        is_active: true,
        settings: TenantSettings {
            max_students: 1000,
            max_instructors: 100,
            max_courses: 500,
            allow_public_enrollment: false,
            custom_branding: false,
        },
    };
    
    // Extract subdomain from domain
    let subdomain = domain.split('.').next().unwrap_or(&domain).to_string();
    
    // Update routing table and tenant registry
    with_routing_table(|table| {
        table.borrow_mut().insert(subdomain, principal);
    });
    
    with_tenant_registry(|registry| {
        registry.borrow_mut().insert(id, tenant.clone());
    });
    
    ic_cdk::println!("Tenant registered: {} -> {}", domain, principal);
    Ok(tenant)
}

/// Get tenant canister ID by subdomain
pub fn get_tenant_canister(subdomain: String) -> LMSResult<Principal> {
    with_routing_table(|table| {
        table.borrow()
            .get(&subdomain)
            .ok_or_else(|| LMSError::NotFound("Subdomain not found".to_string()))
    })
}

/// List all registered tenants
pub fn list_tenants() -> Vec<Tenant> {
    with_tenant_registry(|registry| {
        registry.borrow().iter().map(|(_, tenant)| tenant).collect()
    })
}

/// Get routing table (for debugging)
pub fn get_routing_table() -> Vec<(String, Principal)> {
    with_routing_table(|table| {
        table.borrow().iter().collect()
    })
}

/// Remove a tenant and its routing entry (admin function)
pub fn remove_tenant(tenant_id: String) -> LMSResult<()> {
    // Get tenant info before removal
    let tenant = with_tenant_registry(|registry| {
        registry.borrow().get(&tenant_id)
    });
    
    match tenant {
        Some(tenant_data) => {
            // Find and remove routing entry
            let subdomain_to_remove = with_routing_table(|table| {
                let borrowed = table.borrow();
                // Find subdomain that maps to this tenant's canister
                borrowed.iter()
                    .find(|(_, canister_id)| canister_id.to_string() == tenant_data.canister_id)
                    .map(|(subdomain, _)| subdomain)
            });
            
            if let Some(subdomain) = subdomain_to_remove {
                with_routing_table(|table| {
                    table.borrow_mut().remove(&subdomain);
                });
            }
            
            // Remove tenant from registry
            with_tenant_registry(|registry| {
                registry.borrow_mut().remove(&tenant_id);
            });
            
            ic_cdk::println!("Removed tenant: {} (canister: {})", tenant_id, tenant_data.canister_id);
            Ok(())
        }
        None => Err(LMSError::NotFound(format!("Tenant '{}' not found", tenant_id)))
    }
}

/// Clear all tenant data (admin function - use with caution!)
pub fn clear_all_tenants() -> String {
    let tenant_count = with_tenant_registry(|registry| {
        registry.borrow().len()
    });
    
    let routing_count = with_routing_table(|table| {
        table.borrow().len()
    });
    
    // Collect keys first, then remove
    let tenant_keys: Vec<String> = with_tenant_registry(|registry| {
        registry.borrow().iter().map(|(key, _)| key).collect()
    });
    
    let routing_keys: Vec<String> = with_routing_table(|table| {
        table.borrow().iter().map(|(key, _)| key).collect()
    });
    
    // Clear tenant registry
    with_tenant_registry(|registry| {
        let mut borrowed = registry.borrow_mut();
        for tenant_id in tenant_keys {
            borrowed.remove(&tenant_id);
        }
    });
    
    // Clear routing table
    with_routing_table(|table| {
        let mut borrowed = table.borrow_mut();
        for subdomain in routing_keys {
            borrowed.remove(&subdomain);
        }
    });
    
    ic_cdk::println!("Cleared all tenant data: {} tenants, {} routes", tenant_count, routing_count);
    format!("Cleared {} tenants and {} routing entries", tenant_count, routing_count)
}
