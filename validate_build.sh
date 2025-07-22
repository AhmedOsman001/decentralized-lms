#!/bin/bash

set -e

echo "🔧 Building DFX + Rust Workspace for Decentralized LMS"
echo "======================================================="

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ DFX is not installed. Please install dfx first."
    exit 1
fi

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo is not installed. Please install Rust first."
    exit 1
fi

echo "✅ DFX and Cargo are installed"

# Check if wasm32-unknown-unknown target is added
if ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
    echo "🔧 Adding wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

echo "✅ WebAssembly target is available"

# Build shared library
echo "🔨 Building shared library..."
cargo build -p shared
if [ $? -eq 0 ]; then
    echo "✅ Shared library compiled successfully"
else
    echo "❌ Failed to build shared library"
    exit 1
fi

# Build router canister for WebAssembly
echo "🔨 Building router canister for WebAssembly..."
cargo build -p router_canister --target wasm32-unknown-unknown
if [ $? -eq 0 ]; then
    echo "✅ Router canister compiled to WebAssembly successfully"
else
    echo "❌ Failed to build router canister for WebAssembly"
    exit 1
fi

# Build tenant canister for WebAssembly
echo "🔨 Building tenant canister for WebAssembly..."
cargo build -p tenant_canister --target wasm32-unknown-unknown
if [ $? -eq 0 ]; then
    echo "✅ Tenant canister compiled to WebAssembly successfully"
else
    echo "❌ Failed to build tenant canister for WebAssembly"
    exit 1
fi

# Check if WebAssembly files exist
echo "🔍 Checking for WebAssembly outputs..."
ROUTER_WASM="target/wasm32-unknown-unknown/debug/router_canister.wasm"
TENANT_WASM="target/wasm32-unknown-unknown/debug/tenant_canister.wasm"

if [ -f "$ROUTER_WASM" ]; then
    echo "✅ Router canister WASM found: $ROUTER_WASM"
    echo "   Size: $(du -h $ROUTER_WASM | cut -f1)"
else
    echo "❌ Router canister WASM not found at $ROUTER_WASM"
    exit 1
fi

if [ -f "$TENANT_WASM" ]; then
    echo "✅ Tenant canister WASM found: $TENANT_WASM"
    echo "   Size: $(du -h $TENANT_WASM | cut -f1)"
else
    echo "❌ Tenant canister WASM not found at $TENANT_WASM"
    exit 1
fi

# Build entire workspace (only shared library since canisters are wasm-only)
echo "🔨 Building compatible workspace components..."
cargo build -p shared
if [ $? -eq 0 ]; then
    echo "✅ Compatible workspace components compiled successfully"
else
    echo "❌ Failed to build compatible workspace components"
    exit 1
fi

echo ""
echo "🎉 All builds completed successfully!"
echo "======================================="
echo ""
echo "Summary:"
echo "- ✅ Shared library crate: Independent compilation"
echo "- ✅ Router canister: WebAssembly compilation" 
echo "- ✅ Tenant canister: WebAssembly compilation"
echo "- ✅ Workspace: Compatible components compile correctly"
echo "- ℹ️  Note: Canister crates use cdylib and only target WebAssembly"
echo ""
echo "Next steps:"
echo "1. Run 'dfx start --background' to start local replica"
echo "2. Run 'dfx canister create --all' to create canister IDs"
echo "3. Run 'dfx deploy' to deploy to local replica"
