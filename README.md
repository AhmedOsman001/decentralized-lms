# Decentralized Learning Management System (LMS) on Internet Computer

A multi-tenant learning management system built on the Internet Computer using DFX and Rust. This project demonstrates a decentralized architecture where each university (tenant) operates in its own isolated canister while being coordinated by a central router.

## 🏗️ Architecture

The system is designed with a multi-canister architecture:

- **Router Canister**: Central coordinator that manages tenant registration and routing
- **Tenant Canister**: Isolated canister for each university with its own users and courses
- **Shared Library**: Common types and utilities used across all canisters

## 📁 Project Structure

```
decentralized_lms/
├── src/
│   ├── router_canister/          # Central router logic
│   │   ├── src/lib.rs
│   │   ├── Cargo.toml
│   │   └── router_canister.did
│   ├── tenant_canister/          # University-specific logic
│   │   ├── src/lib.rs
│   │   ├── Cargo.toml
│   │   └── tenant_canister.did
│   └── shared/                   # Shared types and utilities
│       ├── src/lib.rs
│       └── Cargo.toml
├── Cargo.toml                    # Workspace configuration
├── dfx.json                      # DFX configuration
├── validate_build.sh             # Build validation script
└── README.md
```

## 🛠️ Prerequisites

- [DFX](https://internetcomputer.org/docs/current/developer-docs/setup/install/) (Internet Computer SDK)
- [Rust](https://rustup.rs/) with `wasm32-unknown-unknown` target
- [Node.js](https://nodejs.org/) (for frontend, if needed)

## 🚀 Quick Start

### 1. Setup WebAssembly Target

```bash
rustup target add wasm32-unknown-unknown
```

### 2. Validate Build

Run the validation script to ensure everything compiles correctly:

```bash
./validate_build.sh
```

This script will:
- ✅ Check prerequisites (DFX, Cargo, WebAssembly target)
- ✅ Build shared library independently
- ✅ Build router canister for WebAssembly
- ✅ Build tenant canister for WebAssembly
- ✅ Verify WASM files are generated

To learn more about Internet Computer development, see the following documentation:

- [Quick Start](https://internetcomputer.org/docs/current/developer-docs/setup/deploy-locally)
- [SDK Developer Tools](https://internetcomputer.org/docs/current/developer-docs/setup/install)
- [Rust Canister Development Guide](https://internetcomputer.org/docs/current/developer-docs/backend/rust/)
- [ic-cdk](https://docs.rs/ic-cdk)
- [ic-cdk-macros](https://docs.rs/ic-cdk-macros)
- [Candid Introduction](https://internetcomputer.org/docs/current/developer-docs/backend/candid/)

## 🔧 Running the Project Locally

### 1. Start the Local Replica

```bash
# Start DFX replica in the background
dfx start --background

# Or start with clean state
dfx start --clean
```

### 2. Create Canister IDs

```bash
# Create all canisters defined in dfx.json
dfx canister create --all
```

### 3. Deploy Canisters

```bash
# Deploy all canisters to local replica
dfx deploy
```

### 4. Test the Deployment

```bash
# Test router canister health
dfx canister call router_canister health_check

# Register a test tenant
dfx canister call router_canister register_tenant '("university_1", "University One", "uni1.edu", "rdmx6-jaaaa-aaaah-qcaiq-cai")'

# List all tenants
dfx canister call router_canister list_tenants
```

## 📊 Crate Configuration

### Shared Library (`src/shared`)
```toml
[lib]
crate-type = ["lib"]  # Standard library crate
```

### Router Canister (`src/router_canister`)
```toml
[lib]
crate-type = ["cdylib"]  # WebAssembly binary
```

### Tenant Canister (`src/tenant_canister`)
```toml
[lib]
crate-type = ["cdylib"]  # WebAssembly binary
```

## 🔧 Build System

### Independent Compilation

Each crate can be built independently:

```bash
# Shared library
cargo build -p shared

# Router canister (WebAssembly)
cargo build -p router_canister --target wasm32-unknown-unknown

# Tenant canister (WebAssembly)
cargo build -p tenant_canister --target wasm32-unknown-unknown
```

### WebAssembly Output

Compiled WASM files are located at:
```
target/wasm32-unknown-unknown/debug/
├── router_canister.wasm
└── tenant_canister.wasm
```

## 🔒 Security & Architecture Features

- **Tenant Isolation**: Each university operates in its own canister
- **Role-Based Access**: Students, Instructors, Admins, TenantAdmins
- **Domain-Based Routing**: Secure tenant identification
- **IC Authentication**: Built-in Internet Computer security

## 🐛 Troubleshooting

### Common Issues

1. **WASM Compilation Errors**
   - Ensure `wasm32-unknown-unknown` target is installed: `rustup target add wasm32-unknown-unknown`
   - Check that dependencies support WebAssembly

2. **DFX Start Issues**
   - Try `dfx stop` followed by `dfx start --clean`
   - Check for port conflicts (default port: 4943)

3. **Build Warnings**
   - Unused imports and variables are expected in this demo
   - Run `cargo fix` to automatically apply suggestions

## 📝 Development Resources
