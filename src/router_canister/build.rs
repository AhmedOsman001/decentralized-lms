use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // Path to the compiled tenant canister WASM (relative to the workspace root)
    let tenant_wasm_path = "../../.dfx/local/canisters/tenant_canister/tenant_canister.wasm";
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("tenant_wasm.rs");
    
    // Check if the WASM file exists
    if Path::new(tenant_wasm_path).exists() {
        // Read the WASM file
        match fs::read(tenant_wasm_path) {
            Ok(wasm_bytes) => {
                // Generate Rust code that includes the WASM as a byte array
                let code = format!(
                    "pub const TENANT_WASM: &[u8] = &{:?};",
                    wasm_bytes
                );
                
                // Write the generated code to a file
                fs::write(&dest_path, code).unwrap();
                println!("cargo:rerun-if-changed={}", tenant_wasm_path);
                println!("cargo:warning=Successfully embedded tenant WASM: {} bytes", wasm_bytes.len());
            }
            Err(e) => {
                // If we can't read the WASM file, generate a placeholder
                let placeholder_code = r#"
                    pub const TENANT_WASM: &[u8] = &[
                        0x00, 0x61, 0x73, 0x6d, // magic number
                        0x01, 0x00, 0x00, 0x00, // version
                    ];
                "#;
                fs::write(&dest_path, placeholder_code).unwrap();
                println!("cargo:warning=Failed to read tenant WASM: {}", e);
            }
        }
    } else {
        // Generate a placeholder if the WASM doesn't exist yet
        let placeholder_code = r#"
            pub const TENANT_WASM: &[u8] = &[
                0x00, 0x61, 0x73, 0x6d, // magic number
                0x01, 0x00, 0x00, 0x00, // version
            ];
        "#;
        fs::write(&dest_path, placeholder_code).unwrap();
        println!("cargo:warning=Tenant WASM not found at {}, using placeholder", tenant_wasm_path);
    }
}
