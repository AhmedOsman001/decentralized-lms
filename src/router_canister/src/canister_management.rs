use candid::Principal;
use ic_cdk::api::management_canister::main::{
    create_canister as mgmt_create_canister, delete_canister as mgmt_delete_canister, install_code,
    CreateCanisterArgument, CanisterSettings, CanisterIdRecord,
    InstallCodeArgument, CanisterInstallMode
};
use ic_cdk::id;

/// Create a new canister using the management canister
pub async fn create_canister() -> Result<Principal, String> {
    // IC requires minimum 500 billion cycles to create a canister
    // We'll allocate 900 billion to ensure the tenant has enough to operate
    const TENANT_CYCLES: u128 = 900_000_000_000; // 900 billion cycles

    let create_args = CreateCanisterArgument {
        settings: Some(CanisterSettings {
            controllers: Some(vec![id()]), // Router canister controls the tenant
            compute_allocation: Some(0u64.into()),
            memory_allocation: Some(0u64.into()),
            freezing_threshold: Some(2_592_000u64.into()), // 30 days
            reserved_cycles_limit: None,
        }),
    };
    
    match mgmt_create_canister(create_args, TENANT_CYCLES).await {
        Ok((record,)) => {
            ic_cdk::println!("Created canister {} with {} cycles", record.canister_id, TENANT_CYCLES);
            Ok(record.canister_id)
        },
        Err((code, msg)) => Err(format!("Create canister failed: {:?} - {}", code, msg)),
    }
}

/// Delete a canister (rollback operation)
pub async fn delete_canister(canister_id: Principal) -> Result<(), String> {
    let canister_record = CanisterIdRecord { canister_id };
    match mgmt_delete_canister(canister_record).await {
        Ok(_) => Ok(()),
        Err((code, msg)) => Err(format!("Delete canister failed: {:?} - {}", code, msg)),
    }
}

/// Install canister code from a template canister
pub async fn install_from_template(
    canister_id: Principal,
    _template_canister_id: Principal, // Prefixed with _ to avoid unused warning
    admin_principal: Principal,
) -> Result<(), String> {
    // In a production system, you would:
    // 1. Get the WASM from a known source (e.g., a WASM registry)
    // 2. Or copy from a well-known template canister
    // 3. Or use a governance-controlled upgrade mechanism
    
    // For now, we'll create a minimal working canister
    // This is a placeholder - in production you'd fetch the actual template WASM
    let template_wasm = create_minimal_tenant_wasm();
    
    let install_args = InstallCodeArgument {
        mode: CanisterInstallMode::Install,
        canister_id,
        wasm_module: template_wasm,
        arg: candid::encode_one(&admin_principal).map_err(|e| format!("Failed to encode admin principal: {}", e))?,
    };
    
    match install_code(install_args).await {
        Ok(_) => Ok(()),
        Err((code, msg)) => Err(format!("Install template failed: {:?} - {}", code, msg)),
    }
}

/// Create a minimal tenant WASM for testing (Production would fetch from template registry)
fn create_minimal_tenant_wasm() -> Vec<u8> {
    // This is a minimal valid WASM module
    // In production, this would be fetched from a template registry or built from source
    vec![
        0x00, 0x61, 0x73, 0x6d, // magic number
        0x01, 0x00, 0x00, 0x00, // version
        // Additional sections would be added for a real canister
    ]
}
