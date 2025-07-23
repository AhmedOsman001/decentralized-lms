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
    
    // Router configuration
    static ROUTER_DATA: RefCell<Option<RouterData>> = RefCell::new(None);
}

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize, Clone, Debug)]
struct RouterData {
    is_initialized: bool,
    created_at: u64,
    admin_principal: Option<Principal>,
}

/// Initialize the router canister
#[init]
fn init() {
    ROUTER_DATA.with(|data| {
        *data.borrow_mut() = Some(RouterData {
            is_initialized: true,
            created_at: utils::current_time(),
            admin_principal: Some(caller()),
        });
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
            compute_allocation: Some(0.into()),
            memory_allocation: Some(0.into()),
            freezing_threshold: Some(2_592_000.into()), // 30 days
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
    use ic_cdk::api::management_canister::main::delete_canister;
    
    match delete_canister(candid::Principal::from(canister_id)).await {
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
    ROUTER_DATA.with(|data| {
        match data.borrow().as_ref() {
            Some(_) => "Router canister is healthy".to_string(),
            None => "Router canister not initialized".to_string()
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

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize)]
struct RouterStats {
    tenant_count: u64,
    routing_entries: u64,
    has_wasm_module: bool,
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
