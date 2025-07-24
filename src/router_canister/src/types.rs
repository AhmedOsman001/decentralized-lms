use candid::Principal;
use ic_stable_structures::{Storable, memory_manager::VirtualMemory, DefaultMemoryImpl};
use std::borrow::Cow;
use shared::Tenant;

pub type Memory = VirtualMemory<DefaultMemoryImpl>;

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize, Clone)]
pub struct TemplateConfig {
    pub template_canister_id: Option<Principal>,
    pub template_version: String,
    pub last_updated: u64,
    pub auto_update: bool,
}

impl Default for TemplateConfig {
    fn default() -> Self {
        Self {
            template_canister_id: None,
            template_version: "1.0.0".to_string(),
            last_updated: 0,
            auto_update: true,
        }
    }
}

impl Storable for TemplateConfig {
    fn to_bytes(&self) -> Cow<[u8]> {
        match candid::encode_one(self) {
            Ok(bytes) => Cow::Owned(bytes),
            Err(_) => Cow::Owned(vec![])
        }
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        match candid::decode_one(&bytes) {
            Ok(config) => config,
            Err(_) => Self::default()
        }
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Bounded {
        max_size: 1000,
        is_fixed_size: false,
    };
}

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize)]
pub struct RouterStats {
    pub tenant_count: u64,
    pub routing_entries: u64,
    pub has_wasm_module: bool, // Backward compatibility - now indicates template availability
}

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize)]
pub struct CycleInfo {
    pub current_balance: u128,
    pub tenant_count: u64,
    pub cycles_per_tenant: u128,
    pub can_create_more_tenants: bool,
    pub estimated_max_additional_tenants: u64,
}

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize, Clone)]
pub struct TenantRegistryInspection {
    pub total_tenants: u64,
    pub tenants: Vec<(String, Tenant)>,
    pub tenant_ids: Vec<String>,
    pub active_tenants: Vec<String>,
    pub inactive_tenants: Vec<String>,
}

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize, Clone)]
pub struct RoutingTableInspection {
    pub total_routes: u64,
    pub routes: Vec<(String, Principal)>,
    pub subdomains: Vec<String>,
    pub canister_ids: Vec<Principal>,
}

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize)]
pub struct FullSystemInspection {
    pub tenant_registry: TenantRegistryInspection,
    pub routing_table: RoutingTableInspection,
    pub orphaned_routes: Vec<(String, Principal)>,
    pub orphaned_tenants: Vec<(String, Tenant)>,
    pub data_consistency: bool,
}
