use candid::Principal;
use shared::{LMSError, LMSResult, utils};
use crate::types::TemplateConfig;
use crate::storage::{with_template_config, with_tenant_registry};

/// Configure template canister for tenant provisioning
pub fn configure_template(template_canister_id: Principal, version: String) -> LMSResult<()> {
    let config = TemplateConfig {
        template_canister_id: Some(template_canister_id),
        template_version: version,
        last_updated: utils::current_time(),
        auto_update: true,
    };
    
    with_template_config(|template| {
        template.borrow_mut().set(config).map_err(|_| {
            LMSError::InternalError("Failed to store template configuration".to_string())
        })?;
        Ok(())
    })?;
    
    ic_cdk::println!("Template configured: {}", template_canister_id);
    Ok(())
}

/// Get template configuration
pub fn get_template_config() -> TemplateConfig {
    with_template_config(|template| {
        template.borrow().get().clone()
    })
}

/// Auto-configure template using deployed tenant canister
pub fn auto_configure_template() -> LMSResult<String> {
    // Instead of using ic_cdk::id() (which gives router's ID),
    // we should look for the actual tenant canister from the environment
    // or require manual configuration
    
    // For now, return an error suggesting manual configuration
    Err(LMSError::InitializationError(
        "Auto-configuration not available. Please use configure_template() to set the tenant canister ID manually.".to_string()
    ))
}

/// Get the deployed tenant canister as a fallback template
pub fn get_deployed_tenant_canister() -> LMSResult<Principal> {
    // Try to find an existing tenant canister to use as template
    with_tenant_registry(|registry| {
        let borrowed = registry.borrow();
        if let Some((_, tenant)) = borrowed.iter().next() {
            tenant.canister_id.parse::<Principal>()
                .map_err(|_| LMSError::InternalError("Invalid canister ID format".to_string()))
        } else {
            Err(LMSError::NotFound("No deployed tenant canisters found".to_string()))
        }
    })
}

/// Install latest template code on a new canister (Modern Approach)
pub async fn install_latest_template(
    canister_id: Principal,
    template_canister_id: Principal,
    admin_principal: Principal,
) -> Result<(), String> {
    // Use the management canister to copy code from template
    // This is a simplified approach - in production, you'd have more sophisticated template management
    
    // For now, we'll get the WASM from the template canister and install it
    // In a real implementation, you might use canister_status to get the module_hash
    // and then install from a known source
    
    match crate::canister_management::install_from_template(canister_id, template_canister_id, admin_principal).await {
        Ok(_) => {
            ic_cdk::println!("Successfully installed template {} on canister {}", 
                           template_canister_id, canister_id);
            Ok(())
        },
        Err(e) => {
            ic_cdk::println!("Failed to install template: {}", e);
            Err(e)
        }
    }
}
