// Router Canister - Modular Architecture
// This file serves as the main entry point and organizes the modules

mod types;
mod storage;
mod template;
mod canister_management;
mod tenant_management;
mod inspection;
mod api;

// Re-export public types for external use
pub use types::{
    TemplateConfig, RouterStats, CycleInfo, 
    TenantRegistryInspection, RoutingTableInspection, FullSystemInspection
};

// The API functions are defined in the api module and are automatically 
// exported as canister endpoints through the #[update] and #[query] macros

#[cfg(test)]
mod tests {
    use shared::utils;
    
    #[test]
    fn test_subdomain_validation() {
        assert!(utils::is_valid_subdomain("university"));
        assert!(utils::is_valid_subdomain("my-university"));
        assert!(!utils::is_valid_subdomain("-invalid"));
        assert!(!utils::is_valid_subdomain(""));
    }
}
