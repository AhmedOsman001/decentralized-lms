use candid::{candid_method, Principal};
use ic_cdk::{query, update, init, pre_upgrade, post_upgrade};
use std::collections::HashMap;
use shared::{Tenant, LMSError, LMSResult};

// Global state for tenant registry
thread_local! {
    static TENANTS: std::cell::RefCell<HashMap<String, Tenant>> = std::cell::RefCell::new(HashMap::new());
    static TENANT_DOMAINS: std::cell::RefCell<HashMap<String, String>> = std::cell::RefCell::new(HashMap::new());
}

#[init]
fn init() {
    ic_cdk::println!("Router canister initialized");
}

#[pre_upgrade]
fn pre_upgrade() {
    // In production, implement proper stable memory serialization
    ic_cdk::println!("Router canister pre-upgrade");
}

#[post_upgrade]
fn post_upgrade() {
    // In production, implement proper stable memory deserialization
    ic_cdk::println!("Router canister post-upgrade");
}

/// Register a new tenant (university) in the system
#[update]
#[candid_method(update)]
async fn register_tenant(
    id: String,
    name: String,
    domain: String,
    canister_id: String,
) -> LMSResult<Tenant> {
    // Validate input
    if id.is_empty() || name.is_empty() || domain.is_empty() || canister_id.is_empty() {
        return Err(LMSError::ValidationError("All fields are required".to_string()));
    }

    // Check if tenant ID already exists
    let tenant_exists = TENANTS.with(|tenants| {
        tenants.borrow().contains_key(&id)
    });
    
    if tenant_exists {
        return Err(LMSError::ValidationError("Tenant already exists".to_string()));
    }

    // Check if domain already exists
    let domain_exists = TENANT_DOMAINS.with(|domains| {
        domains.borrow().contains_key(&domain)
    });
    
    if domain_exists {
        return Err(LMSError::ValidationError("Domain already in use".to_string()));
    }

    let tenant = Tenant {
        id: id.clone(),
        name,
        domain: domain.clone(),
        canister_id,
        created_at: shared::utils::current_time(),
        is_active: true,
    };

    // Store tenant and domain mapping
    TENANTS.with(|tenants| {
        tenants.borrow_mut().insert(id.clone(), tenant.clone());
    });

    TENANT_DOMAINS.with(|domains| {
        domains.borrow_mut().insert(domain, id);
    });

    Ok(tenant)
}

/// Get tenant information by ID
#[query]
#[candid_method(query)]
fn get_tenant(id: String) -> LMSResult<Tenant> {
    TENANTS.with(|tenants| {
        tenants
            .borrow()
            .get(&id)
            .cloned()
            .ok_or_else(|| LMSError::NotFound(format!("Tenant {} not found", id)))
    })
}

/// Get tenant by domain
#[query]
#[candid_method(query)]
fn get_tenant_by_domain(domain: String) -> LMSResult<Tenant> {
    let tenant_id = TENANT_DOMAINS.with(|domains| {
        domains
            .borrow()
            .get(&domain)
            .cloned()
            .ok_or_else(|| LMSError::NotFound(format!("Tenant with domain {} not found", domain)))
    })?;

    get_tenant(tenant_id)
}

/// List all registered tenants
#[query]
#[candid_method(query)]
fn list_tenants() -> Vec<Tenant> {
    TENANTS.with(|tenants| {
        tenants.borrow().values().cloned().collect()
    })
}

/// Route request to appropriate tenant canister
#[update]
#[candid_method(update)]
async fn route_to_tenant(tenant_id: String, _method: String, _args: Vec<u8>) -> LMSResult<Vec<u8>> {
    let tenant = get_tenant(tenant_id)?;
    
    if !tenant.is_active {
        return Err(LMSError::Unauthorized("Tenant is inactive".to_string()));
    }

    // In a real implementation, this would make an inter-canister call
    // For now, we'll return a placeholder response
    let _canister_principal = Principal::from_text(&tenant.canister_id)
        .map_err(|e| LMSError::ValidationError(format!("Invalid canister ID: {}", e)))?;

    // Placeholder for inter-canister call
    ic_cdk::println!("Routing call to tenant canister: {}", tenant.canister_id);
    
    Ok(vec![]) // Placeholder response
}

/// Health check endpoint
#[query]
#[candid_method(query)]
fn health_check() -> String {
    "Router canister is healthy".to_string()
}

candid::export_service!();

#[query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    __export_service()
}
