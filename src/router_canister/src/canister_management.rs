use candid::Principal;
use ic_cdk::api::management_canister::main::{
    create_canister as mgmt_create_canister, delete_canister as mgmt_delete_canister, install_code,
    CreateCanisterArgument, CanisterSettings, CanisterIdRecord,
    InstallCodeArgument, CanisterInstallMode
};
use ic_cdk::id;

// Include the tenant WASM bytes at compile time
include!(concat!(env!("OUT_DIR"), "/tenant_wasm.rs"));

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

/// Install canister code from embedded tenant WASM
pub async fn install_from_template(
    canister_id: Principal,
    _template_canister_id: Principal, // Prefixed with _ to avoid unused warning
    _admin_principal: Principal,      // Prefixed with _ to avoid unused warning
    tenant_id: String,
) -> Result<(), String> {
    // Use the embedded tenant WASM
    let tenant_wasm = get_tenant_wasm();
    
    // Log the WASM size for debugging
    ic_cdk::println!("Installing tenant WASM: {} bytes", tenant_wasm.len());
    
    // Create initialization arguments: Some(tenant_id: String)
    let init_args = candid::encode_one(&Some(tenant_id.clone()))
        .map_err(|e| format!("Failed to encode tenant ID: {}", e))?;
    
    let install_args = InstallCodeArgument {
        mode: CanisterInstallMode::Install,
        canister_id,
        wasm_module: tenant_wasm,
        arg: init_args,
    };
    
    match install_code(install_args).await {
        Ok(_) => {
            ic_cdk::println!("Successfully installed tenant WASM on canister {} with tenant_id: {}", canister_id, tenant_id);
            Ok(())
        },
        Err((code, msg)) => Err(format!("Install template failed: {:?} - {}", code, msg)),
    }
}

/// Get the tenant WASM bytes (either embedded or fetched from template)
fn get_tenant_wasm() -> Vec<u8> {
    // Use the tenant WASM embedded at compile time
    TENANT_WASM.to_vec()
}
