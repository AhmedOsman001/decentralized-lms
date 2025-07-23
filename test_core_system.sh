#!/bin/bash

# Task 1.6: Core System Testing Script
# Tests the essential functionality of the decentralized LMS backend

set -e  # Exit on any error

echo "=============================================="
echo "Decentralized LMS - Core System Testing"
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

for cmd in dfx cargo; do
    if ! command -v $cmd &> /dev/null; then
        print_error "$cmd command not found. Please install it first."
        exit 1
    fi
done

print_success "Prerequisites check passed"

# Start DFX if needed
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

print_step "Building canisters..."
cargo build --target wasm32-unknown-unknown --release
print_success "Canisters built successfully"

print_step "Deploying router canister..."
dfx deploy router_canister --with-cycles 2000000000000
ROUTER_CANISTER_ID=$(dfx canister id router_canister)
print_success "Router canister deployed: $ROUTER_CANISTER_ID"

# Core functionality testing
print_header "Core Functionality Testing"

ADMIN_PRINCIPAL=$(dfx identity get-principal)
print_info "Testing with admin principal: $ADMIN_PRINCIPAL"

# Test 1: Health check
run_test "Router health check" "
    result=\$(dfx canister call router_canister health_check 2>/dev/null)
    echo \"Health result: \$result\"
    echo \"\$result\" | grep -q 'Router canister is healthy'
"

# Test 2: Router statistics (get current state)
run_test "Router statistics check" "
    result=\$(dfx canister call router_canister get_router_stats 2>/dev/null)
    echo \"Current stats: \$result\"
    echo \"\$result\" | grep -q 'has_wasm_module = false'
"

# Test 3: Legacy tenant registration (doesn't require WASM upload)
run_test "Legacy tenant registration" "
    result=\$(dfx canister call router_canister register_tenant '(\"mit\", \"MIT\", \"mit.localhost\", \"rdmx6-jaaaa-aaaaa-aaadq-cai\")' 2>/dev/null)
    echo \"Legacy registration: \$result\"
    echo \"\$result\" | grep -q 'MIT'
"

# Test 4: Get tenant canister by subdomain
run_test "Get tenant canister lookup" "
    result=\$(dfx canister call router_canister get_tenant_canister '(\"mit\")' 2>/dev/null)
    echo \"Tenant lookup: \$result\"
    echo \"\$result\" | grep -q 'rdmx6-jaaaa-aaaaa-aaadq-cai'
"

# Test 5: List tenants
run_test "List all tenants" "
    result=\$(dfx canister call router_canister list_tenants 2>/dev/null)
    echo \"Tenants list: \$result\"
    echo \"\$result\" | grep -q 'MIT'
"

# Test 6: Get routing table
run_test "Get routing table" "
    result=\$(dfx canister call router_canister get_routing_table 2>/dev/null)
    echo \"Routing table: \$result\"
    echo \"\$result\" | grep -q 'mit'
"

# Test 7: Register another tenant
run_test "Register second tenant" "
    result=\$(dfx canister call router_canister register_tenant '(\"stanford\", \"Stanford\", \"stanford.localhost\", \"rdmx6-jaaaa-aaaaa-aaadq-cai\")' 2>/dev/null)
    echo \"Second registration: \$result\"
    echo \"\$result\" | grep -q 'Stanford'
"

# Test 8: Updated statistics
run_test "Updated statistics check" "
    result=\$(dfx canister call router_canister get_router_stats 2>/dev/null)
    echo \"Updated stats: \$result\"
    echo \"\$result\" | grep -q 'tenant_count = 2'
"

# Test 9: Non-existent tenant lookup
run_test "Non-existent tenant lookup" "
    result=\$(dfx canister call router_canister get_tenant_canister '(\"nonexistent\")' 2>/dev/null)
    echo \"Non-existent lookup result: \$result\"
    if echo \"\$result\" | grep -q 'NotFound'; then
        echo 'SUCCESS: Correctly rejected non-existent tenant'
        true
    else
        echo 'ERROR: Should not find non-existent tenant'
        false
    fi
"

# Test 10: Try university registration without WASM (should fail gracefully)
run_test "University registration without WASM" "
    result=\$(dfx canister call router_canister register_university '(\"harvard\", \"Harvard\", principal \"$ADMIN_PRINCIPAL\")' 2>/dev/null)
    echo \"University registration result: \$result\"
    if echo \"\$result\" | grep -q 'InitializationError.*WASM module not uploaded'; then
        echo 'SUCCESS: Correctly rejected registration without WASM'
        true
    else
        echo 'ERROR: Should fail without WASM module'
        false
    fi
"

# Deploy tenant canister for more comprehensive testing
print_header "Extended Testing with Tenant Canister"

print_step "Deploying tenant canister for direct testing..."
dfx deploy tenant_canister --argument "(principal \"$ADMIN_PRINCIPAL\")" --with-cycles 2000000000000
TENANT_CANISTER_ID=$(dfx canister id tenant_canister)
print_success "Tenant canister deployed: $TENANT_CANISTER_ID"

# Test 11: Tenant canister health
run_test "Tenant canister health check" "
    result=\$(dfx canister call tenant_canister health_check 2>/dev/null)
    echo \"Tenant health: \$result\"
    echo \"\$result\" | grep -q 'Tenant canister is healthy'
"

# Test 12: Create user in tenant
run_test "Create user in tenant canister" "
    result=\$(dfx canister call tenant_canister create_user '(\"user1\", \"John Doe\", \"john@mit.edu\", variant { Student })' 2>/dev/null)
    echo \"User creation: \$result\"
    echo \"\$result\" | grep -q 'user1'
"

# Test 13: Get user from tenant
run_test "Get user from tenant canister" "
    result=\$(dfx canister call tenant_canister get_user '(\"user1\")' 2>/dev/null)
    echo \"User retrieval: \$result\"
    echo \"\$result\" | grep -q 'John Doe'
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
    echo "System Status:"
    echo "- ✅ Router canister: Operational"
    echo "- ✅ Tenant canister: Operational" 
    echo "- ✅ Legacy registration: Working"
    echo "- ✅ Routing table: Functional"
    echo "- ✅ User management: Working"
    echo "- ✅ Error handling: Correct"
else
    echo ""
    print_error "Some tests failed. Please review the output above."
    exit 1
fi

echo ""
print_header "Deployment Information"
echo "Router Canister ID: $ROUTER_CANISTER_ID"
echo "Tenant Canister ID: $TENANT_CANISTER_ID"
echo "Admin Principal: $ADMIN_PRINCIPAL"
echo "DFX Network: Local development"
echo ""

print_header "Next Steps for Full Testing"
echo "To test university registration with WASM upload:"
echo "1. Upload tenant WASM to router canister"
echo "2. Test register_university function"
echo "3. Verify automatic tenant provisioning"
echo ""

print_success "Core system testing completed successfully!"
echo ""
echo "The decentralized LMS backend infrastructure is ready for use!"
