use candid::Principal;
use shared::Tenant;
use crate::types::{TenantRegistryInspection, RoutingTableInspection, FullSystemInspection};
use crate::storage::{with_routing_table, with_tenant_registry};

/// Comprehensive inspection of tenant registry
pub fn inspect_tenant_registry() -> TenantRegistryInspection {
    with_tenant_registry(|registry| {
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
pub fn inspect_routing_table() -> RoutingTableInspection {
    with_routing_table(|table| {
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
pub fn inspect_full_system() -> FullSystemInspection {
    let tenant_inspection = inspect_tenant_registry();
    let routing_inspection = inspect_routing_table();
    
    // Cross-reference data to find inconsistencies
    let mut orphaned_routes = Vec::new();
    let mut orphaned_tenants = Vec::new();
    
    // Find routes without corresponding tenants
    for (subdomain, canister_id) in &routing_inspection.routes {
        let has_tenant = tenant_inspection.tenants.iter()
            .any(|(_, tenant)| tenant.canister_id == canister_id.to_string());
        if !has_tenant {
            orphaned_routes.push((subdomain.clone(), *canister_id));
        }
    }
    
    // Find tenants without corresponding routes
    for (tenant_id, tenant) in &tenant_inspection.tenants {
        let has_route = routing_inspection.routes.iter()
            .any(|(_, canister_id)| canister_id.to_string() == tenant.canister_id);
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
pub fn log_tenant_registry() -> String {
    let inspection = inspect_tenant_registry();
    
    ic_cdk::println!("=== TENANT REGISTRY INSPECTION ===");
    ic_cdk::println!("Total tenants: {}", inspection.total_tenants);
    ic_cdk::println!("Active tenants: {:?}", inspection.active_tenants);
    ic_cdk::println!("Inactive tenants: {:?}", inspection.inactive_tenants);
    
    for (tenant_id, tenant) in &inspection.tenants {
        ic_cdk::println!("Tenant: {} -> {{", tenant_id);
        ic_cdk::println!("  name: {}", tenant.name);
        ic_cdk::println!("  subdomain: {}", tenant.subdomain);
        ic_cdk::println!("  canister_id: {}", tenant.canister_id);
        ic_cdk::println!("  admin_ids: {:?}", tenant.admin_ids);
        ic_cdk::println!("  created_at: {}", tenant.created_at);
        ic_cdk::println!("  is_active: {}", tenant.is_active);
        ic_cdk::println!("}}");
    }
    
    format!("Logged {} tenants to console", inspection.total_tenants)
}

/// Log routing table to console (for IC replica logs)
pub fn log_routing_table() -> String {
    let inspection = inspect_routing_table();
    
    ic_cdk::println!("=== ROUTING TABLE INSPECTION ===");
    ic_cdk::println!("Total routes: {}", inspection.total_routes);
    
    for (subdomain, canister_id) in &inspection.routes {
        ic_cdk::println!("Route: {} -> {}", subdomain, canister_id);
    }
    
    format!("Logged {} routes to console", inspection.total_routes)
}

/// Log full system state to console
pub fn log_full_system() -> String {
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
