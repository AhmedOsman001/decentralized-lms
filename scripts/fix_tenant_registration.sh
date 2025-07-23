#!/bin/bash

# Script to demonstrate proper tenant registration with unique canister IDs

echo "=================================="
echo "🔧 PROPER TENANT REGISTRATION DEMO"
echo "=================================="
echo ""

# First, let's register tenants using the legacy method but with CORRECT different canister IDs
echo "📋 Step 1: Using actual existing canister IDs"

# Get the actual tenant_canister ID
TENANT_CANISTER_ID=$(dfx canister id tenant_canister)
echo "   • Using tenant_canister ID: $TENANT_CANISTER_ID"

# Get the router canister ID (for demonstration of different IDs)
ROUTER_CANISTER_ID=$(dfx canister id router_canister)
echo "   • Using router_canister ID: $ROUTER_CANISTER_ID"

echo ""
echo "📝 Step 2: Registering MIT with tenant_canister ID"
dfx canister call router_canister register_tenant "(\"mit\", \"MIT\", \"mit.localhost\", \"$TENANT_CANISTER_ID\")"

echo ""
echo "📝 Step 3: Registering Stanford with router_canister ID (different canister)"
dfx canister call router_canister register_tenant "(\"stanford\", \"Stanford\", \"stanford.localhost\", \"$ROUTER_CANISTER_ID\")"

echo ""
echo "🔍 Step 4: Inspecting the results"
echo ""
echo "Router statistics:"
dfx canister call router_canister get_router_stats

echo ""
echo "Tenant registry inspection:"
dfx canister call router_canister inspect_tenant_registry

echo ""
echo "Routing table inspection:"
dfx canister call router_canister inspect_routing_table

echo ""
echo "✅ Now each tenant has a different canister ID!"
echo ""
echo "🔍 Verification:"
echo "MIT canister: $TENANT_CANISTER_ID"
echo "Stanford canister: $ROUTER_CANISTER_ID"
echo ""
echo "Note: In production, you would:"
echo "1. Use register_university() to create NEW canisters for each tenant"
echo "2. Or manually create separate tenant canisters for each university"
echo "3. Never reuse the same canister ID for different tenants"
