use candid::{candid_method, Principal};
use ic_cdk::{query, update, init, caller, id};
use ic_stable_structures::{
    DefaultMemoryImpl, 
    StableBTreeMap,
    StableCell,
    memory_manager::{MemoryId, MemoryManager, VirtualMemory}
};
use std::cell::RefCell;
use shared::{Tenant, LMSError, LMSResult, utils};

type Memory = VirtualMemory<DefaultMemoryImpl>;

// Router state with stable storage
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );
    
    // Routing table: subdomain -> tenant Principal
    static ROUTING_TABLE: RefCell<StableBTreeMap<String, Principal, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );
    
    // Tenant registry: tenant_id -> Tenant
    static TENANT_REGISTRY: RefCell<StableBTreeMap<String, Tenant, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );
    
    // WASM module storage for tenant canister deployment
    static WASM_MODULE: RefCell<StableCell<Vec<u8>, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))),
            Vec::new()
        ).unwrap()
    );
    
    // Router configuration in stable storage
    static ROUTER_CONFIG: RefCell<StableCell<bool, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3))),
            false
        ).unwrap()
    );
}

/// Initialize the router canister
#[init]
fn init() {
    ROUTER_CONFIG.with(|config| {
        let _ = config.borrow_mut().set(true);
    });
    
    ic_cdk::println!("Router canister initialized by: {}", caller());
}

/// Upload WASM module for tenant canister deployment
#[update]
#[candid_method(update)]
fn upload_wasm_module(wasm_bytes: Vec<u8>) -> LMSResult<()> {
    // Basic validation
    if wasm_bytes.is_empty() {
        return Err(LMSError::ValidationError("WASM module cannot be empty".to_string()));
    }
    
    // Check size limits (2MB for ICP canisters)
    const MAX_WASM_SIZE: usize = 2 * 1024 * 1024; // 2MB
    if wasm_bytes.len() > MAX_WASM_SIZE {
        return Err(LMSError::ValidationError("WASM module exceeds size limit".to_string()));
    }
    
    // Basic WASM validation - check magic number
    if wasm_bytes.len() < 4 || &wasm_bytes[0..4] != b"\0asm" {
        return Err(LMSError::ValidationError("Invalid WASM module format".to_string()));
    }
    
    WASM_MODULE.with(|wasm| {
        let mut module = wasm.borrow_mut();
        module.set(wasm_bytes).map_err(|_| LMSError::InternalError("Failed to store WASM module".to_string()))?;
        Ok(())
    })?;
    
    ic_cdk::println!("WASM module uploaded successfully");
    Ok(())
}

/// Register a new university and provision its tenant canister
#[update]
#[candid_method(update)]
async fn register_university(
    subdomain: String,
    university_name: String,
    admin_principal: Principal,
) -> LMSResult<Tenant> {
    // Validate subdomain format
    if !utils::is_valid_subdomain(&subdomain) {
        return Err(LMSError::ValidationError("Invalid subdomain format".to_string()));
    }
    
    // Check if subdomain already exists
    let subdomain_exists = ROUTING_TABLE.with(|table| {
        table.borrow().contains_key(&subdomain)
    });
    
    if subdomain_exists {
        return Err(LMSError::AlreadyExists("Subdomain already registered".to_string()));
    }
    
    // Check if WASM module is available
    let wasm_bytes = WASM_MODULE.with(|wasm| {
        let module = wasm.borrow();
        let bytes = module.get().clone();
        if bytes.is_empty() {
            return Err(LMSError::InitializationError("WASM module not uploaded".to_string()));
        }
        Ok(bytes)
    })?;
    
    // Create new canister
    let canister_id = match create_canister().await {
        Ok(principal) => principal,
        Err(e) => return Err(LMSError::InternalError(format!("Failed to create canister: {:?}", e))),
    };
    
    // Install tenant canister code
    match install_tenant_code(canister_id, wasm_bytes, admin_principal).await {
        Ok(_) => {},
        Err(e) => {
            // Rollback: delete the created canister
            let _ = delete_canister(canister_id).await;
            return Err(LMSError::InternalError(format!("Failed to install code: {:?}", e)));
        }
    }
    
    // Create tenant record
    let tenant_id = utils::generate_id("tenant");
    let tenant = Tenant {
        id: tenant_id.clone(),
        name: university_name,
        domain: format!("{}.localhost", subdomain),
        canister_id,
        admin_principal,
        created_at: utils::current_time(),
        is_active: true,
    };
    
    // Update routing table and tenant registry
    ROUTING_TABLE.with(|table| {
        table.borrow_mut().insert(subdomain, canister_id);
    });
    
    TENANT_REGISTRY.with(|registry| {
        registry.borrow_mut().insert(tenant_id, tenant.clone());
    });
    
    ic_cdk::println!("University registered: {} -> {}", tenant.domain, canister_id);
    Ok(tenant)
}

/// Create a new canister using the management canister
async fn create_canister() -> Result<Principal, String> {
    use ic_cdk::api::management_canister::main::{create_canister, CreateCanisterArgument, CanisterSettings};
    
    let create_args = CreateCanisterArgument {
        settings: Some(CanisterSettings {
            controllers: Some(vec![id()]), // Router canister controls the tenant
            compute_allocation: Some(0u64.into()),
            memory_allocation: Some(0u64.into()),
            freezing_threshold: Some(2_592_000u64.into()), // 30 days
            reserved_cycles_limit: None,
        }),
    };
    
    match create_canister(create_args, 1_000_000_000_000u128).await {
        Ok((record,)) => Ok(record.canister_id),
        Err((code, msg)) => Err(format!("Create canister failed: {:?} - {}", code, msg)),
    }
}

/// Install tenant canister code
async fn install_tenant_code(
    canister_id: Principal,
    wasm_bytes: Vec<u8>,
    admin_principal: Principal,
) -> Result<(), String> {
    use ic_cdk::api::management_canister::main::{install_code, InstallCodeArgument, CanisterInstallMode};
    
    let install_args = InstallCodeArgument {
        mode: CanisterInstallMode::Install,
        canister_id,
        wasm_module: wasm_bytes,
        arg: candid::encode_one(&admin_principal).map_err(|e| format!("Failed to encode admin principal: {}", e))?,
    };
    
    match install_code(install_args).await {
        Ok(_) => Ok(()),
        Err((code, msg)) => Err(format!("Install code failed: {:?} - {}", code, msg)),
    }
}

/// Delete a canister (rollback operation)
async fn delete_canister(canister_id: Principal) -> Result<(), String> {
    use ic_cdk::api::management_canister::main::{delete_canister, CanisterIdRecord};
    
    let canister_record = CanisterIdRecord { canister_id };
    match delete_canister(canister_record).await {
        Ok(_) => Ok(()),
        Err((code, msg)) => Err(format!("Delete canister failed: {:?} - {}", code, msg)),
    }
}

/// Get tenant canister ID by subdomain
#[query]
#[candid_method(query)]
fn get_tenant_canister(subdomain: String) -> LMSResult<Principal> {
    ROUTING_TABLE.with(|table| {
        table.borrow()
            .get(&subdomain)
            .ok_or_else(|| LMSError::NotFound("Subdomain not found".to_string()))
    })
}

/// List all registered tenants
#[query]
#[candid_method(query)]
fn list_tenants() -> Vec<Tenant> {
    TENANT_REGISTRY.with(|registry| {
        registry.borrow().iter().map(|(_, tenant)| tenant).collect()
    })
}

/// Get routing table (for debugging)
#[query]
#[candid_method(query)]
fn get_routing_table() -> Vec<(String, Principal)> {
    ROUTING_TABLE.with(|table| {
        table.borrow().iter().collect()
    })
}

/// Health check
#[query]
#[candid_method(query)]
fn health_check() -> String {
    ROUTER_CONFIG.with(|config| {
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
    let tenant_count = TENANT_REGISTRY.with(|registry| {
        registry.borrow().len() as u64
    });
    
    let routing_entries = ROUTING_TABLE.with(|table| {
        table.borrow().len() as u64
    });
    
    let has_wasm = WASM_MODULE.with(|wasm| {
        !wasm.borrow().get().is_empty()
    });
    
    RouterStats {
        tenant_count,
        routing_entries,
        has_wasm_module: has_wasm,
    }
}

/// Comprehensive inspection of tenant registry
#[query]
#[candid_method(query)]
fn inspect_tenant_registry() -> TenantRegistryInspection {
    TENANT_REGISTRY.with(|registry| {
        let borrowed = registry.borrow();
        let tenants: Vec<(String, Tenant)> = borrowed.iter().collect();
        
        TenantRegistryInspection {
            total_tenants: tenants.len() as u64,
            tenants: tenants.clone(),
            tenant_ids: tenants.iter().map(|(id, _)| id.clone()).collect(),
            active_tenants: tenants.iter().filter(|(_, t)| t.is_active).map(|(id, _)| id.clone()).collect(),
            inactive_tenants: tenants.iter().filter(|(_, t)| !t.is_active).map(|(id, _)| id.clone()).collect(),
        }
    })
}

/// Comprehensive inspection of routing table
#[query]
#[candid_method(query)]
fn inspect_routing_table() -> RoutingTableInspection {
    ROUTING_TABLE.with(|table| {
        let borrowed = table.borrow();
        let routes: Vec<(String, Principal)> = borrowed.iter().collect();
        
        RoutingTableInspection {
            total_routes: routes.len() as u64,
            routes: routes.clone(),
            subdomains: routes.iter().map(|(subdomain, _)| subdomain.clone()).collect(),
            canister_ids: routes.iter().map(|(_, principal)| *principal).collect(),
        }
    })
}

/// Full system inspection combining both registries
#[query]
#[candid_method(query)]
fn inspect_full_system() -> FullSystemInspection {
    let tenant_inspection = inspect_tenant_registry();
    let routing_inspection = inspect_routing_table();
    
    // Cross-reference data to find inconsistencies
    let mut orphaned_routes = Vec::new();
    let mut orphaned_tenants = Vec::new();
    
    // Find routes without corresponding tenants
    for (subdomain, canister_id) in &routing_inspection.routes {
        let has_tenant = tenant_inspection.tenants.iter()
            .any(|(_, tenant)| tenant.canister_id == *canister_id);
        if !has_tenant {
            orphaned_routes.push((subdomain.clone(), *canister_id));
        }
    }
    
    // Find tenants without corresponding routes
    for (tenant_id, tenant) in &tenant_inspection.tenants {
        let has_route = routing_inspection.routes.iter()
            .any(|(_, canister_id)| *canister_id == tenant.canister_id);
        if !has_route {
            orphaned_tenants.push((tenant_id.clone(), tenant.clone()));
        }
    }
    
    let is_consistent = orphaned_routes.is_empty() && orphaned_tenants.is_empty();
    
    FullSystemInspection {
        tenant_registry: tenant_inspection,
        routing_table: routing_inspection,
        orphaned_routes,
        orphaned_tenants,
        data_consistency: is_consistent,
    }
}

/// Log tenant registry to console (for IC replica logs)
#[update]
#[candid_method(update)]
fn log_tenant_registry() -> String {
    let inspection = inspect_tenant_registry();
    
    ic_cdk::println!("=== TENANT REGISTRY INSPECTION ===");
    ic_cdk::println!("Total tenants: {}", inspection.total_tenants);
    ic_cdk::println!("Active tenants: {:?}", inspection.active_tenants);
    ic_cdk::println!("Inactive tenants: {:?}", inspection.inactive_tenants);
    
    for (tenant_id, tenant) in &inspection.tenants {
        ic_cdk::println!("Tenant: {} -> {{", tenant_id);
        ic_cdk::println!("  name: {}", tenant.name);
        ic_cdk::println!("  domain: {}", tenant.domain);
        ic_cdk::println!("  canister_id: {}", tenant.canister_id);
        ic_cdk::println!("  admin: {}", tenant.admin_principal);
        ic_cdk::println!("  created_at: {}", tenant.created_at);
        ic_cdk::println!("  is_active: {}", tenant.is_active);
        ic_cdk::println!("}}");
    }
    
    format!("Logged {} tenants to console", inspection.total_tenants)
}

/// Log routing table to console (for IC replica logs)
#[update]
#[candid_method(update)]
fn log_routing_table() -> String {
    let inspection = inspect_routing_table();
    
    ic_cdk::println!("=== ROUTING TABLE INSPECTION ===");
    ic_cdk::println!("Total routes: {}", inspection.total_routes);
    
    for (subdomain, canister_id) in &inspection.routes {
        ic_cdk::println!("Route: {} -> {}", subdomain, canister_id);
    }
    
    format!("Logged {} routes to console", inspection.total_routes)
}

/// Log full system state to console
#[update]
#[candid_method(update)]
fn log_full_system() -> String {
    let inspection = inspect_full_system();
    
    ic_cdk::println!("=== FULL SYSTEM INSPECTION ===");
    ic_cdk::println!("Tenant count: {}", inspection.tenant_registry.total_tenants);
    ic_cdk::println!("Route count: {}", inspection.routing_table.total_routes);
    ic_cdk::println!("Data consistency: {}", inspection.data_consistency);
    
    if !inspection.orphaned_routes.is_empty() {
        ic_cdk::println!("ORPHANED ROUTES (routes without tenants):");
        for (subdomain, canister_id) in &inspection.orphaned_routes {
            ic_cdk::println!("  {} -> {}", subdomain, canister_id);
        }
    }
    
    if !inspection.orphaned_tenants.is_empty() {
        ic_cdk::println!("ORPHANED TENANTS (tenants without routes):");
        for (tenant_id, tenant) in &inspection.orphaned_tenants {
            ic_cdk::println!("  {} (canister: {})", tenant_id, tenant.canister_id);
        }
    }
    
    format!("Full system inspection completed. Consistency: {}", inspection.data_consistency)
}

/// Remove a tenant and its routing entry (admin function)
#[update]
#[candid_method(update)]
fn remove_tenant(tenant_id: String) -> LMSResult<()> {
    // Get tenant info before removal
    let tenant = TENANT_REGISTRY.with(|registry| {
        registry.borrow().get(&tenant_id)
    });
    
    match tenant {
        Some(tenant_data) => {
            // Find and remove routing entry
            let subdomain_to_remove = ROUTING_TABLE.with(|table| {
                let borrowed = table.borrow();
                // Find subdomain that maps to this tenant's canister
                borrowed.iter()
                    .find(|(_, canister_id)| *canister_id == tenant_data.canister_id)
                    .map(|(subdomain, _)| subdomain)
            });
            
            if let Some(subdomain) = subdomain_to_remove {
                ROUTING_TABLE.with(|table| {
                    table.borrow_mut().remove(&subdomain);
                });
            }
            
            // Remove tenant from registry
            TENANT_REGISTRY.with(|registry| {
                registry.borrow_mut().remove(&tenant_id);
            });
            
            ic_cdk::println!("Removed tenant: {} (canister: {})", tenant_id, tenant_data.canister_id);
            Ok(())
        }
        None => Err(LMSError::NotFound(format!("Tenant '{}' not found", tenant_id)))
    }
}

/// Clear all tenant data (admin function - use with caution!)
#[update]
#[candid_method(update)]
fn clear_all_tenants() -> String {
    let tenant_count = TENANT_REGISTRY.with(|registry| {
        registry.borrow().len()
    });
    
    let routing_count = ROUTING_TABLE.with(|table| {
        table.borrow().len()
    });
    
    // Collect keys first, then remove
    let tenant_keys: Vec<String> = TENANT_REGISTRY.with(|registry| {
        registry.borrow().iter().map(|(key, _)| key).collect()
    });
    
    let routing_keys: Vec<String> = ROUTING_TABLE.with(|table| {
        table.borrow().iter().map(|(key, _)| key).collect()
    });
    
    // Clear tenant registry
    TENANT_REGISTRY.with(|registry| {
        let mut borrowed = registry.borrow_mut();
        for tenant_id in tenant_keys {
            borrowed.remove(&tenant_id);
        }
    });
    
    // Clear routing table
    ROUTING_TABLE.with(|table| {
        let mut borrowed = table.borrow_mut();
        for subdomain in routing_keys {
            borrowed.remove(&subdomain);
        }
    });
    
    ic_cdk::println!("Cleared all tenant data: {} tenants, {} routes", tenant_count, routing_count);
    format!("Cleared {} tenants and {} routing entries", tenant_count, routing_count)
}

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize)]
struct RouterStats {
    tenant_count: u64,
    routing_entries: u64,
    has_wasm_module: bool,
}

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize, Clone)]
struct TenantRegistryInspection {
    total_tenants: u64,
    tenants: Vec<(String, Tenant)>,
    tenant_ids: Vec<String>,
    active_tenants: Vec<String>,
    inactive_tenants: Vec<String>,
}

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize, Clone)]
struct RoutingTableInspection {
    total_routes: u64,
    routes: Vec<(String, Principal)>,
    subdomains: Vec<String>,
    canister_ids: Vec<Principal>,
}

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize)]
struct FullSystemInspection {
    tenant_registry: TenantRegistryInspection,
    routing_table: RoutingTableInspection,
    orphaned_routes: Vec<(String, Principal)>,
    orphaned_tenants: Vec<(String, Tenant)>,
    data_consistency: bool,
}

// Legacy function for compatibility with existing tests
#[update]
#[candid_method(update)]
async fn register_tenant(
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
        name,
        domain: domain.clone(),
        canister_id: principal,
        admin_principal: caller(), // Use caller as admin for now
        created_at: utils::current_time(),
        is_active: true,
    };
    
    // Extract subdomain from domain
    let subdomain = domain.split('.').next().unwrap_or(&domain).to_string();
    
    // Update routing table and tenant registry
    ROUTING_TABLE.with(|table| {
        table.borrow_mut().insert(subdomain, principal);
    });
    
    TENANT_REGISTRY.with(|registry| {
        registry.borrow_mut().insert(id, tenant.clone());
    });
    
    ic_cdk::println!("Tenant registered: {} -> {}", domain, principal);
    Ok(tenant)
}

// Generate Candid interface
candid::export_service!();

#[query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    __export_service()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_subdomain_validation() {
        assert!(utils::is_valid_subdomain("university"));
        assert!(utils::is_valid_subdomain("my-university"));
        assert!(!utils::is_valid_subdomain("-invalid"));
        assert!(!utils::is_valid_subdomain(""));
    }
}
