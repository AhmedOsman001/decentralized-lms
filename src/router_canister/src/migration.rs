use shared::{TenantSettings, LMSResult};
use crate::storage::with_tenant_registry;

/// Migrate old tenant data to new format
pub fn migrate_tenant_data() -> LMSResult<String> {
    let migration_count = with_tenant_registry(|registry| {
        let mut borrowed = registry.borrow_mut();
        let mut migrated_tenants = Vec::new();
        let mut migration_count = 0;

        // Collect all tenants for migration
        for (key, tenant) in borrowed.iter() {
            // Check if tenant needs migration (has missing fields)
            if tenant.settings.max_students == 0 || tenant.updated_at == 0 {
                let mut migrated_tenant = tenant.clone();
                
                // Set default settings if missing
                if migrated_tenant.settings.max_students == 0 {
                    migrated_tenant.settings = TenantSettings::default();
                }
                
                // Set updated_at if missing
                if migrated_tenant.updated_at == 0 {
                    migrated_tenant.updated_at = migrated_tenant.created_at;
                }
                
                migrated_tenants.push((key, migrated_tenant));
                migration_count += 1;
            }
        }

        // Update migrated tenants
        for (key, migrated_tenant) in migrated_tenants {
            borrowed.insert(key, migrated_tenant);
        }

        migration_count
    });

    Ok(format!("Migrated {} tenants to new format", migration_count))
}

/// Force clear and recreate tenant registry (nuclear option for testing)
pub fn clear_tenant_registry() -> LMSResult<String> {
    with_tenant_registry(|registry| {
        let mut borrowed = registry.borrow_mut();
        let keys: Vec<String> = borrowed.iter().map(|(k, _)| k).collect();
        for key in keys {
            borrowed.remove(&key);
        }
    });
    Ok("Tenant registry cleared".to_string())
}
