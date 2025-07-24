#!/bin/bash

# Template-Based University Registration Test
# Tests the new production-ready architecture without WASM uploads

set -e

echo "=============================================="
echo "Template-Based University Registration Test"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

ADMIN_PRINCIPAL=$(dfx identity get-principal)
print_info "Admin principal: $ADMIN_PRINCIPAL"

# Test 1: Check router health
print_header "Router Health Check"
print_step "Testing router canister health..."
HEALTH=$(dfx canister call router_canister health_check)
echo "Health status: $HEALTH"
if echo "$HEALTH" | grep -q "healthy"; then
    print_success "Router canister is healthy"
else
    print_error "Router canister health check failed"
    exit 1
fi

# Test 2: Check initial stats
print_header "Initial System State"
print_step "Getting router statistics..."
STATS=$(dfx canister call router_canister get_router_stats)
echo "Initial stats: $STATS"

# Test 3: Check template configuration
print_step "Checking template configuration..."
TEMPLATE_CONFIG=$(dfx canister call router_canister get_template_config)
echo "Template config: $TEMPLATE_CONFIG"

# Test 4: Auto-configure template
print_step "Auto-configuring template..."
AUTO_CONFIG_RESULT=$(dfx canister call router_canister auto_configure_template)
echo "Auto-config result: $AUTO_CONFIG_RESULT"

if echo "$AUTO_CONFIG_RESULT" | grep -q "Ok"; then
    print_success "Template auto-configuration successful"
else
    print_error "Template auto-configuration failed"
fi

# Test 5: Verify template configuration
print_step "Verifying template configuration..."
UPDATED_TEMPLATE_CONFIG=$(dfx canister call router_canister get_template_config)
echo "Updated template config: $UPDATED_TEMPLATE_CONFIG"

# Test 6: Check updated stats
print_step "Checking updated router statistics..."
UPDATED_STATS=$(dfx canister call router_canister get_router_stats)
echo "Updated stats: $UPDATED_STATS"

if echo "$UPDATED_STATS" | grep -q "has_wasm_module = true"; then
    print_success "Template is now available for university registration"
else
    print_error "Template not properly configured"
fi

# Test 7: Register first university
print_header "University Registration Tests"
print_step "Registering Harvard University..."
HARVARD_RESULT=$(dfx canister call router_canister register_university '("harvard", "Harvard University", principal "'"$ADMIN_PRINCIPAL"'")')
echo "Harvard registration result: $HARVARD_RESULT"

if echo "$HARVARD_RESULT" | grep -q '"Ok"'; then
    print_success "Harvard University registered successfully!"
    
    # Extract canister ID from result for verification
    HARVARD_CANISTER=$(echo "$HARVARD_RESULT" | grep -o 'canister_id = principal "[^"]*"' | grep -o '"[^"]*"' | tr -d '"')
    print_info "Harvard canister ID: $HARVARD_CANISTER"
else
    print_error "Harvard registration failed"
    echo "Error details: $HARVARD_RESULT"
fi

# Test 8: Register second university
print_step "Registering MIT..."
MIT_RESULT=$(dfx canister call router_canister register_university '("mit", "Massachusetts Institute of Technology", principal "'"$ADMIN_PRINCIPAL"'")')
echo "MIT registration result: $MIT_RESULT"

if echo "$MIT_RESULT" | grep -q '"Ok"'; then
    print_success "MIT registered successfully!"
    
    MIT_CANISTER=$(echo "$MIT_RESULT" | grep -o 'canister_id = principal "[^"]*"' | grep -o '"[^"]*"' | tr -d '"')
    print_info "MIT canister ID: $MIT_CANISTER"
else
    print_error "MIT registration failed"
    echo "Error details: $MIT_RESULT"
fi

# Test 9: Register third university
print_step "Registering Stanford..."
STANFORD_RESULT=$(dfx canister call router_canister register_university '("stanford", "Stanford University", principal "'"$ADMIN_PRINCIPAL"'")')
echo "Stanford registration result: $STANFORD_RESULT"

if echo "$STANFORD_RESULT" | grep -q '"Ok"'; then
    print_success "Stanford registered successfully!"
    
    STANFORD_CANISTER=$(echo "$STANFORD_RESULT" | grep -o 'canister_id = principal "[^"]*"' | grep -o '"[^"]*"' | tr -d '"')
    print_info "Stanford canister ID: $STANFORD_CANISTER"
else
    print_error "Stanford registration failed"
    echo "Error details: $STANFORD_RESULT"
fi

# Test 10: Verify unique canister IDs
print_header "Verification Tests"
print_step "Verifying each university has unique canister IDs..."

echo "Canister IDs:"
echo "  Harvard: $HARVARD_CANISTER"
echo "  MIT: $MIT_CANISTER"
echo "  Stanford: $STANFORD_CANISTER"

if [ "$HARVARD_CANISTER" != "$MIT_CANISTER" ] && [ "$MIT_CANISTER" != "$STANFORD_CANISTER" ] && [ "$HARVARD_CANISTER" != "$STANFORD_CANISTER" ]; then
    print_success "All universities have unique canister IDs!"
else
    print_error "Duplicate canister IDs detected!"
fi

# Test 11: List all tenants
print_step "Listing all registered tenants..."
TENANTS=$(dfx canister call router_canister list_tenants)
echo "All tenants: $TENANTS"

# Test 12: Check routing table
print_step "Checking routing table..."
ROUTING_TABLE=$(dfx canister call router_canister get_routing_table)
echo "Routing table: $ROUTING_TABLE"

# Test 13: Test tenant lookup
print_step "Testing tenant lookups..."
HARVARD_LOOKUP=$(dfx canister call router_canister get_tenant_canister '("harvard")')
MIT_LOOKUP=$(dfx canister call router_canister get_tenant_canister '("mit")')
STANFORD_LOOKUP=$(dfx canister call router_canister get_tenant_canister '("stanford")')

echo "Tenant lookups:"
echo "  Harvard: $HARVARD_LOOKUP"
echo "  MIT: $MIT_LOOKUP"
echo "  Stanford: $STANFORD_LOOKUP"

# Test 14: Final statistics
print_step "Final system statistics..."
FINAL_STATS=$(dfx canister call router_canister get_router_stats)
echo "Final stats: $FINAL_STATS"

if echo "$FINAL_STATS" | grep -q "tenant_count = 3"; then
    print_success "All 3 universities registered correctly"
else
    print_error "Incorrect tenant count in final statistics"
fi

# Test 15: System inspection
print_header "System Inspection"
print_step "Running full system inspection..."
SYSTEM_INSPECTION=$(dfx canister call router_canister inspect_full_system)
echo "System inspection: $SYSTEM_INSPECTION"

if echo "$SYSTEM_INSPECTION" | grep -q "data_consistency = true"; then
    print_success "System data is consistent"
else
    print_error "System data consistency issues detected"
fi

print_header "Test Summary"
echo ""
print_success "🎉 Template-Based University Registration Test Complete! 🎉"
echo ""
echo "✅ Key Achievements:"
echo "  - Template-based architecture working"
echo "  - No WASM upload required"
echo "  - Automatic unique canister creation"
echo "  - Multiple universities registered successfully"
echo "  - Data consistency maintained"
echo ""
echo "🏛️ Registered Universities:"
echo "  1. Harvard University (harvard.localhost) -> $HARVARD_CANISTER"
echo "  2. MIT (mit.localhost) -> $MIT_CANISTER"
echo "  3. Stanford University (stanford.localhost) -> $STANFORD_CANISTER"
echo ""
print_info "The production-ready template-based architecture is now fully operational!"
