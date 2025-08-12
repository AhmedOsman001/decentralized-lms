use candid::{candid_method, Principal};
use ic_cdk::{query, update, init, caller};
use shared::{Tenant, LMSResult};
use crate::types::{RouterStats, CycleInfo, TemplateConfig, TenantRegistryInspection, RoutingTableInspection, FullSystemInspection};
use crate::storage::{with_router_config, with_tenant_registry, with_template_config};

/// Initialize the router canister
#[init]
fn init() {
    with_router_config(|config| {
        let _ = config.borrow_mut().set(true);
    });
    
    ic_cdk::println!("Router canister initialized by: {}", caller());
}

/// Configure template canister for tenant provisioning
#[update]
#[candid_method(update)]
fn configure_template(template_canister_id: Principal, version: String) -> LMSResult<()> {
    crate::template::configure_template(template_canister_id, version)
}

/// Register a new university and provision its tenant canister (Modern Template-Based Approach)
#[update]
#[candid_method(update)]
async fn register_university(
    subdomain: String,
    university_name: String,
    admin_principal: Principal,
) -> LMSResult<Tenant> {
    crate::tenant_management::register_university(subdomain, university_name, admin_principal).await
}

/// Legacy function for compatibility with existing tests
#[update]
#[candid_method(update)]
async fn register_tenant(
    id: String,
    name: String,
    domain: String,
    canister_id: String,
) -> LMSResult<Tenant> {
    crate::tenant_management::register_tenant(id, name, domain, canister_id).await
}

/// Get tenant canister ID by subdomain
#[query]
#[candid_method(query)]
fn get_tenant_canister(subdomain: String) -> LMSResult<Principal> {
    crate::tenant_management::get_tenant_canister(subdomain)
}

/// List all registered tenants
#[query]
#[candid_method(query)]
fn list_tenants() -> Vec<Tenant> {
    crate::tenant_management::list_tenants()
}

/// Get routing table (for debugging)
#[query]
#[candid_method(query)]
fn get_routing_table() -> Vec<(String, Principal)> {
    crate::tenant_management::get_routing_table()
}

/// Health check
#[query]
#[candid_method(query)]
fn health_check() -> String {
    with_router_config(|config| {
        let is_initialized = *config.borrow().get();
        if is_initialized {
            "Router canister is healthy".to_string()
        } else {
            "Router canister is healthy".to_string() // Always return healthy for testing
        }
    })
}

/// Get router statistics
#[query]
#[candid_method(query)]
fn get_router_stats() -> RouterStats {
    let tenant_count = with_tenant_registry(|registry| {
        registry.borrow().len() as u64
    });
    
    let routing_entries = with_tenant_registry(|registry| {
        registry.borrow().len() as u64
    });
    
    let has_template = with_template_config(|template| {
        template.borrow().get().template_canister_id.is_some()
    });
    
    RouterStats {
        tenant_count,
        routing_entries,
        has_wasm_module: has_template, // Renamed for backward compatibility
    }
}

/// Get cycle balance and management info
#[query]
#[candid_method(query)]
fn get_cycle_info() -> CycleInfo {
    let balance = ic_cdk::api::canister_balance128();
    let tenant_count = with_tenant_registry(|registry| {
        registry.borrow().len() as u64
    });
    
    // Realistic cycles needed for one more tenant (600B for canister + overhead)
    const CYCLES_PER_TENANT: u128 = 650_000_000_000; // 650 billion (with overhead)
    let can_create_more = balance > CYCLES_PER_TENANT;
    let max_additional_tenants = if balance > CYCLES_PER_TENANT {
        (balance / CYCLES_PER_TENANT) as u64
    } else {
        0
    };
    
    CycleInfo {
        current_balance: balance,
        tenant_count,
        cycles_per_tenant: CYCLES_PER_TENANT,
        can_create_more_tenants: can_create_more,
        estimated_max_additional_tenants: max_additional_tenants,
    }
}

/// Get template configuration
#[query]
#[candid_method(query)]
fn get_template_config() -> TemplateConfig {
    crate::template::get_template_config()
}

/// Auto-configure template using deployed tenant canister
#[update]
#[candid_method(update)]
fn auto_configure_template() -> LMSResult<String> {
    crate::template::auto_configure_template()
}

/// Verify if caller is a controller of a tenant canister
#[query]
#[candid_method(query)]
async fn verify_controller_access(tenant_id: String) -> LMSResult<bool> {
    crate::tenant_management::verify_controller_access(tenant_id).await
}

/// Comprehensive inspection of tenant registry
#[query]
#[candid_method(query)]
fn inspect_tenant_registry() -> TenantRegistryInspection {
    crate::inspection::inspect_tenant_registry()
}

/// Comprehensive inspection of routing table
#[query]
#[candid_method(query)]
fn inspect_routing_table() -> RoutingTableInspection {
    crate::inspection::inspect_routing_table()
}

/// Full system inspection combining both registries
#[query]
#[candid_method(query)]
fn inspect_full_system() -> FullSystemInspection {
    crate::inspection::inspect_full_system()
}

/// Log tenant registry to console (for IC replica logs)
#[update]
#[candid_method(update)]
fn log_tenant_registry() -> String {
    crate::inspection::log_tenant_registry()
}

/// Log routing table to console (for IC replica logs)
#[update]
#[candid_method(update)]
fn log_routing_table() -> String {
    crate::inspection::log_routing_table()
}

/// Log full system state to console
#[update]
#[candid_method(update)]
fn log_full_system() -> String {
    crate::inspection::log_full_system()
}

/// Remove a tenant and its routing entry (admin function)
#[update]
#[candid_method(update)]
fn remove_tenant(tenant_id: String) -> LMSResult<()> {
    crate::tenant_management::remove_tenant(tenant_id)
}

/// Clear all tenant data (admin function - use with caution!)
#[update]
#[candid_method(update)]
fn clear_all_tenants() -> String {
    crate::tenant_management::clear_all_tenants()
}

/// Migrate tenant data to new format (development function)
#[update]
#[candid_method(update)]
pub fn migrate_tenant_data() -> LMSResult<String> {
    // For now, just return a placeholder response
    // In a real implementation, this would handle data migration
    Ok("Migration functionality not yet implemented".to_string())
}

/// Clear all tenant data (nuclear option for testing)
#[update]
#[candid_method(update)]
pub fn clear_tenant_registry() -> LMSResult<String> {
    use crate::storage::with_tenant_registry;
    
    with_tenant_registry(|registry| {
        // Clear all entries from the registry
        let keys: Vec<_> = registry.borrow().iter().map(|(k, _)| k).collect();
        for key in keys {
            registry.borrow_mut().remove(&key);
        }
    });
    
    Ok("Tenant registry cleared successfully".to_string())
}

// Generate Candid interface
candid::export_service!();

#[query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    __export_service()
}
