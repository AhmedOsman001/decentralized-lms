#!/bin/bash

# Comprehensive Tenant HashMap Inspection Script
# This script provides detailed inspection of the router canister's internal data structures

echo "=================================="
echo "🔍 TENANT HASHMAP INSPECTION TOOL"
echo "=================================="
echo ""

# Function to display section headers
section_header() {
    echo ""
    echo "📊 $1"
    echo "$(printf '%.0s-' {1..50})"
}

# Function to format JSON output for better readability
format_output() {
    # Simple formatting to make Candid output more readable
    sed 's/record {/{\n  /g' | \
    sed 's/; /;\n  /g' | \
    sed 's/}/\n}/g' | \
    sed 's/vec {/[\n    /g' | \
    sed 's/principal "/Principal: "/g'
}

# Check if DFX is running
if ! dfx ping > /dev/null 2>&1; then
    echo "❌ Error: DFX replica is not running. Please start it with 'dfx start'"
    exit 1
fi

section_header "Router Statistics"
echo "Getting basic router canister statistics..."
dfx canister call router_canister get_router_stats 2>/dev/null | format_output

section_header "Tenant Registry Details"
echo "Inspecting internal tenant registry (HashMap)..."
echo ""
echo "Raw Candid Output:"
dfx canister call router_canister inspect_tenant_registry 2>/dev/null

echo ""
echo "Human-readable format:"
echo "Logging detailed tenant data to IC replica console..."
dfx canister call router_canister log_tenant_registry 2>/dev/null

section_header "Routing Table Details"
echo "Inspecting internal routing table (subdomain → canister mapping)..."
echo ""
echo "Raw Candid Output:"
dfx canister call router_canister inspect_routing_table 2>/dev/null

echo ""
echo "Human-readable format:"
echo "Logging routing table to IC replica console..."
dfx canister call router_canister log_routing_table 2>/dev/null

section_header "Full System Analysis"
echo "Comprehensive system inspection with consistency checks..."
echo ""
dfx canister call router_canister inspect_full_system 2>/dev/null | format_output

echo ""
echo "System consistency check:"
dfx canister call router_canister log_full_system 2>/dev/null

section_header "Available Inspection Functions"
echo "The following functions are available for tenant HashMap inspection:"
echo ""
echo "📋 Query Functions (read-only):"
echo "  • get_router_stats()           - Basic statistics"
echo "  • inspect_tenant_registry()    - Full tenant HashMap"
echo "  • inspect_routing_table()      - Full routing HashMap"
echo "  • inspect_full_system()        - Combined analysis with consistency checks"
echo "  • list_tenants()              - Simple tenant list"
echo "  • get_routing_table()         - Simple routing pairs"
echo ""
echo "📝 Update Functions (with console logging):"
echo "  • log_tenant_registry()       - Log tenants to IC replica console"
echo "  • log_routing_table()         - Log routes to IC replica console"
echo "  • log_full_system()           - Log complete system state"
echo ""

section_header "Data Structure Analysis"
echo "Based on the inspection, here's what we found:"

# Get stats for analysis
STATS=$(dfx canister call router_canister get_router_stats 2>/dev/null)
TENANT_COUNT=$(echo "$STATS" | grep -o 'tenant_count = [0-9]*' | cut -d'=' -f2 | tr -d ' ')
ROUTING_COUNT=$(echo "$STATS" | grep -o 'routing_entries = [0-9]*' | cut -d'=' -f2 | tr -d ' ')
HAS_WASM=$(echo "$STATS" | grep -o 'has_wasm_module = [a-z]*' | cut -d'=' -f2 | tr -d ' ')

echo ""
echo "🏗️  Architecture Summary:"
echo "   • TENANT_REGISTRY: StableBTreeMap<String, Tenant>"
echo "   • ROUTING_TABLE: StableBTreeMap<String, Principal>"
echo "   • WASM_MODULE: StableCell<Vec<u8>>"
echo "   • ROUTER_CONFIG: StableCell<bool>"
echo ""
echo "📈 Current Data:"
echo "   • Total tenants in registry: $TENANT_COUNT"
echo "   • Total routing entries: $ROUTING_COUNT"
echo "   • WASM module loaded: $HAS_WASM"
echo "   • Data persistence: Stable storage (survives upgrades)"
echo ""

if [ "$TENANT_COUNT" = "$ROUTING_COUNT" ]; then
    echo "✅ Data consistency: GOOD (tenant count matches routing entries)"
else
    echo "⚠️  Data consistency: MISMATCH (tenant count ≠ routing entries)"
fi

section_header "Usage Examples"
echo "To inspect specific tenant data:"
echo ""
echo "# Get tenant by subdomain"
echo "dfx canister call router_canister get_tenant_canister '(\"mit\")'"
echo ""
echo "# List all tenants"
echo "dfx canister call router_canister list_tenants"
echo ""
echo "# Get routing table"
echo "dfx canister call router_canister get_routing_table"
echo ""
echo "# Full system inspection"
echo "dfx canister call router_canister inspect_full_system"
echo ""

echo "=================================="
echo "✅ Inspection complete!"
echo "Check the IC replica logs for detailed output from the logging functions."
echo "=================================="
