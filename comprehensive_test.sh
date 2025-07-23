#!/bin/bash

# Task 1.6: Comprehensive Command-Line Testing Script
# This script deploys and tests the decentralized LMS backend infrastructure

set -e  # Exit on any error

echo "=============================================="
echo "Decentralized LMS - Complete System Testing"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "\n${YELLOW}🔄 $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}================== $1 ==================${NC}"
}

# Test counter
TESTS_TOTAL=0
TESTS_PASSED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    print_step "Test $TESTS_TOTAL: $test_name"
    
    if eval "$test_command"; then
        print_success "$test_name passed"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        print_error "$test_name failed"
        return 1
    fi
}

# Check prerequisites
print_header "Prerequisites Check"

if ! command -v dfx &> /dev/null; then
    print_error "dfx command not found. Please install DFX first."
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    print_error "cargo command not found. Please install Rust first."
    exit 1
fi

print_success "Prerequisites check passed"

# Check if DFX is running
print_step "Checking DFX status..."
if ! dfx ping > /dev/null 2>&1; then
    print_info "Starting DFX local network..."
    dfx start --clean --background --host 127.0.0.1:8000
    sleep 5
    print_success "DFX started"
else
    print_success "DFX is already running"
fi

# Build and deploy phase
print_header "Build & Deploy Phase"

print_step "Building all canisters..."
cargo build --target wasm32-unknown-unknown --release
print_success "All canisters built successfully"

print_step "Deploying router canister..."
dfx deploy router_canister --with-cycles 2000000000000
ROUTER_CANISTER_ID=$(dfx canister id router_canister)
print_success "Router canister deployed with ID: $ROUTER_CANISTER_ID"

# Prepare tenant WASM
print_step "Preparing tenant canister WASM..."
TENANT_WASM_PATH="target/wasm32-unknown-unknown/release/tenant_canister.wasm"

if [ ! -f "$TENANT_WASM_PATH" ]; then
    print_error "Tenant canister WASM not found at $TENANT_WASM_PATH"
    exit 1
fi

# Convert WASM to hex for dfx
print_step "Converting WASM to format for upload..."
WASM_SIZE=$(wc -c < "$TENANT_WASM_PATH")
print_info "Tenant WASM size: $WASM_SIZE bytes"

# Simple file read approach for WASM upload
print_step "Uploading tenant WASM module..."
if dfx canister call router_canister upload_wasm_module --type raw --argument-file "$TENANT_WASM_PATH"; then
    print_success "Tenant WASM module uploaded successfully"
else
    print_error "Failed to upload WASM module"
    exit 1
fi

# Testing phase
print_header "Functional Testing Phase"

# Get admin principal for tests
ADMIN_PRINCIPAL=$(dfx identity get-principal)
print_info "Using admin principal: $ADMIN_PRINCIPAL"

# Test 1: Basic health check
run_test "Router health check" "
    result=\$(dfx canister call router_canister health_check)
    echo \"Health check result: \$result\"
    echo \"\$result\" | grep -q 'Router canister is healthy'
"

# Test 2: Router statistics (initial state)
run_test "Initial router statistics" "
    result=\$(dfx canister call router_canister get_router_stats)
    echo \"Initial stats: \$result\"
    echo \"\$result\" | grep -q 'has_wasm_module = true'
"

# Test 3: Register first university
run_test "Register MIT university" "
    result=\$(dfx canister call router_canister register_university '(\"mit\", \"Massachusetts Institute of Technology\", principal \"$ADMIN_PRINCIPAL\")')
    echo \"MIT registration: \$result\"
    echo \"\$result\" | grep -q 'mit.localhost'
"

# Test 4: Get tenant canister for MIT
run_test "Get MIT tenant canister" "
    result=\$(dfx canister call router_canister get_tenant_canister '(\"mit\")')
    echo \"MIT canister: \$result\"
    [[ \"\$result\" != *'NotFound'* ]]
"

# Test 5: Register second university
run_test "Register Stanford university" "
    result=\$(dfx canister call router_canister register_university '(\"stanford\", \"Stanford University\", principal \"$ADMIN_PRINCIPAL\")')
    echo \"Stanford registration: \$result\"
    echo \"\$result\" | grep -q 'stanford.localhost'
"

# Test 6: List all tenants
run_test "List all registered tenants" "
    result=\$(dfx canister call router_canister list_tenants)
    echo \"All tenants: \$result\"
    echo \"\$result\" | grep -q 'Massachusetts Institute of Technology' && echo \"\$result\" | grep -q 'Stanford University'
"

# Test 7: Get routing table
run_test "Get routing table" "
    result=\$(dfx canister call router_canister get_routing_table)
    echo \"Routing table: \$result\"
    echo \"\$result\" | grep -q 'mit' && echo \"\$result\" | grep -q 'stanford'
"

# Test 8: Test legacy register_tenant function
run_test "Legacy register_tenant function" "
    result=\$(dfx canister call router_canister register_tenant '(\"harvard\", \"Harvard University\", \"harvard.localhost\", \"rdmx6-jaaaa-aaaaa-aaadq-cai\")')
    echo \"Legacy registration: \$result\"
    echo \"\$result\" | grep -q 'Harvard University'
"

# Test 9: Updated statistics
run_test "Updated router statistics" "
    result=\$(dfx canister call router_canister get_router_stats)
    echo \"Updated stats: \$result\"
    echo \"\$result\" | grep -q 'tenant_count = 3'
"

# Test 10: Duplicate subdomain rejection
run_test "Duplicate subdomain rejection" "
    if dfx canister call router_canister register_university '(\"mit\", \"Another MIT\", principal \"$ADMIN_PRINCIPAL\")' 2>/dev/null; then
        echo 'ERROR: Duplicate registration should have failed'
        false
    else
        echo 'SUCCESS: Duplicate registration correctly rejected'
        true
    fi
"

# Test 11: Invalid subdomain rejection
run_test "Invalid subdomain rejection" "
    if dfx canister call router_canister register_university '(\"-invalid\", \"Invalid University\", principal \"$ADMIN_PRINCIPAL\")' 2>/dev/null; then
        echo 'ERROR: Invalid subdomain should have been rejected'
        false
    else
        echo 'SUCCESS: Invalid subdomain correctly rejected'
        true
    fi
"

# Test 12: Get non-existent tenant
run_test "Non-existent tenant lookup" "
    if dfx canister call router_canister get_tenant_canister '(\"nonexistent\")' 2>/dev/null; then
        echo 'ERROR: Non-existent tenant should not be found'
        false
    else
        echo 'SUCCESS: Non-existent tenant correctly not found'
        true
    fi
"

# Final summary
print_header "Test Results Summary"

echo ""
print_info "Total tests run: $TESTS_TOTAL"
print_info "Tests passed: $TESTS_PASSED"
print_info "Tests failed: $((TESTS_TOTAL - TESTS_PASSED))"

if [ "$TESTS_PASSED" -eq "$TESTS_TOTAL" ]; then
    echo ""
    print_success "🎉 ALL TESTS PASSED! 🎉"
    echo ""
    echo "The decentralized LMS backend is working correctly:"
    echo "- ✅ Router canister operational"
    echo "- ✅ Tenant WASM module management working"
    echo "- ✅ University registration and provisioning functional"
    echo "- ✅ Routing table management operational"
    echo "- ✅ Error handling working correctly"
    echo "- ✅ Legacy compatibility maintained"
else
    echo ""
    print_error "Some tests failed. Please check the output above."
    exit 1
fi

echo ""
print_header "System Information"
echo "Router Canister ID: $ROUTER_CANISTER_ID"
echo "Admin Principal: $ADMIN_PRINCIPAL"
echo "DFX Network: Local (127.0.0.1:8000)"
echo ""

print_header "Usage Examples"
echo "Register a new university:"
echo "dfx canister call router_canister register_university '(\"<subdomain>\", \"<university_name>\", principal \"<admin_principal>\")'"
echo ""
echo "Get tenant canister for a subdomain:"
echo "dfx canister call router_canister get_tenant_canister '(\"<subdomain>\")'"
echo ""
echo "List all registered tenants:"
echo "dfx canister call router_canister list_tenants"
echo ""

print_success "Comprehensive testing completed successfully!"
