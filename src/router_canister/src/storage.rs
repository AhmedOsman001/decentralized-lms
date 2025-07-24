use std::cell::RefCell;
use candid::Principal;
use ic_stable_structures::{
    DefaultMemoryImpl, 
    StableBTreeMap,
    StableCell,
    memory_manager::{MemoryId, MemoryManager}
};
use shared::Tenant;
use crate::types::{Memory, TemplateConfig};

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
    
    // Template configuration for tenant provisioning
    static TEMPLATE_CONFIG: RefCell<StableCell<TemplateConfig, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))),
            TemplateConfig::default()
        ).expect("Failed to initialize template config")
    );
    
    // Router configuration in stable storage
    static ROUTER_CONFIG: RefCell<StableCell<bool, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3))),
            false
        ).unwrap()
    );
}

pub fn with_routing_table<R>(f: impl FnOnce(&RefCell<StableBTreeMap<String, Principal, Memory>>) -> R) -> R {
    ROUTING_TABLE.with(f)
}

pub fn with_tenant_registry<R>(f: impl FnOnce(&RefCell<StableBTreeMap<String, Tenant, Memory>>) -> R) -> R {
    TENANT_REGISTRY.with(f)
}

pub fn with_template_config<R>(f: impl FnOnce(&RefCell<StableCell<TemplateConfig, Memory>>) -> R) -> R {
    TEMPLATE_CONFIG.with(f)
}

pub fn with_router_config<R>(f: impl FnOnce(&RefCell<StableCell<bool, Memory>>) -> R) -> R {
    ROUTER_CONFIG.with(f)
}
