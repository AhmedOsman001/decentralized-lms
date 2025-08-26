# Deployment Guide

## Overview

This guide covers the complete deployment process for the Decentralized Learning Management System on the Internet Computer Protocol. The system consists of multiple canisters that need to be deployed in a specific order.

## Prerequisites

### System Requirements

- **Operating System**: Linux, macOS, or Windows (with WSL)
- **Node.js**: Version 16 or higher
- **Rust**: Latest stable version
- **Git**: For version control
- **DFX**: DFINITY SDK (latest version)

### Hardware Requirements

**Development Environment:**
- 4GB RAM minimum, 8GB recommended
- 10GB free disk space
- Stable internet connection

**Production Environment:**
- Depends on Internet Computer infrastructure
- No specific hardware requirements (serverless)

### Software Installation

#### 1. Install DFX (DFINITY SDK)

```bash
# Install DFX
sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"

# Add to PATH
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
dfx --version
```

#### 2. Install Node.js and npm

```bash
# Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Verify installation
node --version
npm --version
```

#### 3. Install Rust

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Verify installation
rustc --version
cargo --version
```

## Project Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd decentralized_lms
```

### 2. Install Dependencies

```bash
# Install Rust dependencies
cargo build

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Configuration

Create necessary configuration files:

```bash
# Create dfx.json if not exists (should be included in repo)
# Create .env files for different environments
```

## Local Development Deployment

### 1. Start Local IC Replica

```bash
# Start the local Internet Computer replica
dfx start --background

# Alternative: Start in foreground for debugging
dfx start
```

### 2. Deploy Shared Library

```bash
# Deploy the shared library first
dfx deploy shared
```

### 3. Deploy Router Canister

```bash
# Deploy router canister
dfx deploy router_canister

# Get router canister ID
ROUTER_CANISTER_ID=$(dfx canister id router_canister)
echo "Router Canister ID: $ROUTER_CANISTER_ID"
```

### 4. Deploy Tenant Canister

```bash
# Deploy tenant canister
dfx deploy tenant_canister

# Get tenant canister ID
TENANT_CANISTER_ID=$(dfx canister id tenant_canister)
echo "Tenant Canister ID: $TENANT_CANISTER_ID"
```

### 5. Deploy Frontend

```bash
# Deploy frontend canister
dfx deploy frontend

# Get frontend URL
dfx canister call frontend http_request '(record{url="/"; method="GET"; headers=vec{}; body=vec{}})'
```

### 6. Initialize System

```bash
# Register tenant with router
dfx canister call router_canister register_tenant '("demo", principal "'$TENANT_CANISTER_ID'")'

# Initialize tenant canister
dfx canister call tenant_canister init '(opt (opt "demo", opt principal "'$(dfx identity get-principal)'"))'

# Verify deployment
dfx canister call router_canister list_tenants
```

### 7. Create Initial Admin User

```bash
# Create admin user
dfx canister call tenant_canister create_user '(record {
  name = "Admin User";
  email = "admin@demo.edu";
  role = variant { TenantAdmin };
  university_id = opt "ADMIN001";
  profile = record {
    bio = opt "System Administrator";
    year = opt 0;
    major = opt "Administration"
  }
})'
```

## Production Deployment

### 1. Internet Computer Mainnet Setup

#### Create Internet Identity

1. Visit [Internet Identity](https://identity.ic0.app/)
2. Create a new identity
3. Save your recovery phrase securely

#### Setup DFX for Mainnet

```bash
# Add cycles wallet
dfx identity use default
dfx ledger account-id

# Get cycles (requires ICP tokens)
# Follow instructions at: https://internetcomputer.org/docs/current/developer-docs/setup/cycles/

# Set network to IC mainnet
dfx start --network ic
```

### 2. Deploy to Mainnet

#### Deploy Shared Library

```bash
dfx deploy shared --network ic --with-cycles 1000000000000
```

#### Deploy Router Canister

```bash
dfx deploy router_canister --network ic --with-cycles 2000000000000
```

#### Deploy Tenant Canister

```bash
dfx deploy tenant_canister --network ic --with-cycles 5000000000000
```

#### Deploy Frontend

```bash
# Build production frontend
cd frontend
npm run build
cd ..

# Deploy frontend
dfx deploy frontend --network ic --with-cycles 1000000000000
```

### 3. Configure Production Environment

#### Set Environment Variables

```bash
# Update frontend environment for production
cd frontend
echo "VITE_IC_HOST=https://ic0.app" > .env.production
echo "VITE_ROUTER_CANISTER_ID=$(dfx canister id router_canister --network ic)" >> .env.production
echo "VITE_ENVIRONMENT=production" >> .env.production
```

#### Configure Domain (Optional)

```bash
# If using custom domain, configure DNS
# Point your domain to the frontend canister URL
# Update dfx.json with custom domain settings
```

## Multi-Tenant Setup

### 1. Deploy Additional Tenant Canisters

```bash
# Deploy tenant canister for each institution
dfx deploy tenant_canister_harvard --network ic --with-cycles 5000000000000
dfx deploy tenant_canister_mit --network ic --with-cycles 5000000000000

# Get canister IDs
HARVARD_CANISTER=$(dfx canister id tenant_canister_harvard --network ic)
MIT_CANISTER=$(dfx canister id tenant_canister_mit --network ic)
```

### 2. Register Tenants

```bash
# Register each tenant with the router
dfx canister call router_canister register_tenant --network ic '("harvard", principal "'$HARVARD_CANISTER'")'
dfx canister call router_canister register_tenant --network ic '("mit", principal "'$MIT_CANISTER'")'
```

### 3. Initialize Tenant Canisters

```bash
# Initialize each tenant
dfx canister call tenant_canister_harvard init --network ic '(opt (opt "harvard", null))'
dfx canister call tenant_canister_mit init --network ic '(opt (opt "mit", null))'
```

## SSL/TLS Configuration

### 1. Internet Computer Native HTTPS

The Internet Computer provides native HTTPS support:

```bash
# Access via IC domain
https://<canister-id>.ic0.app

# Or via custom domain (if configured)
https://your-domain.com
```

### 2. Custom Domain Setup

1. Configure DNS CNAME record
2. Update canister settings
3. Verify SSL certificate

## Monitoring and Health Checks

### 1. Canister Status Monitoring

```bash
# Check canister status
dfx canister status router_canister --network ic
dfx canister status tenant_canister --network ic
dfx canister status frontend --network ic

# Check cycles balance
dfx canister call router_canister wallet_balance --network ic
```

### 2. Health Check Endpoints

```bash
# Router health check
dfx canister call router_canister health_check --network ic

# Tenant health check (implement if needed)
dfx canister call tenant_canister get_system_info --network ic
```

### 3. Performance Monitoring

```javascript
// Frontend monitoring
import { performance } from 'perf_hooks';

const startTime = performance.now();
// API call
const endTime = performance.now();
console.log(`API call took ${endTime - startTime} milliseconds`);
```

## Backup and Recovery

### 1. Canister Backup

```bash
# Export canister state (if supported)
dfx canister call tenant_canister export_data --network ic

# Backup canister WASM
dfx canister info tenant_canister --network ic
```

### 2. Data Export

```bash
# Export user data
dfx canister call tenant_canister export_users --network ic

# Export course data
dfx canister call tenant_canister export_courses --network ic
```

### 3. Recovery Procedures

```bash
# Reinstall canister if needed
dfx canister install tenant_canister --mode reinstall --network ic

# Import data after recovery
dfx canister call tenant_canister import_data --network ic '(<exported_data>)'
```

## Scaling Considerations

### 1. Canister Scaling

- **Vertical Scaling**: Upgrade canister with more cycles
- **Horizontal Scaling**: Deploy additional tenant canisters
- **Load Balancing**: Router canister handles distribution

### 2. Storage Scaling

```bash
# Monitor storage usage
dfx canister status tenant_canister --network ic

# If approaching limits, consider:
# - Data archiving
# - Additional canisters
# - External storage integration
```

### 3. Performance Optimization

- Monitor response times
- Optimize query vs update calls
- Implement caching strategies
- Use async patterns

## Security Hardening

### 1. Access Control

```bash
# Set canister controllers
dfx canister update-settings tenant_canister --add-controller <principal> --network ic

# Remove default controllers if needed
dfx canister update-settings tenant_canister --remove-controller <principal> --network ic
```

### 2. Cycle Management

```bash
# Set up cycle monitoring
# Implement automatic top-up mechanisms
# Monitor cycle consumption patterns
```

### 3. Security Auditing

- Regular security reviews
- Penetration testing
- Code audits
- Dependency scanning

## Troubleshooting

### Common Issues

#### 1. Deployment Failures

```bash
# Check cycles balance
dfx wallet balance --network ic

# Check canister status
dfx canister status <canister_name> --network ic

# Review deployment logs
dfx deploy --verbose --network ic
```

#### 2. Network Connectivity

```bash
# Test IC connectivity
dfx ping --network ic

# Check replica status
dfx info --network ic
```

#### 3. Authentication Issues

```bash
# Verify identity
dfx identity whoami

# Check wallet balance
dfx wallet balance --network ic

# Refresh authentication
dfx identity use default
```

### Debugging Tools

#### 1. Canister Logs

```bash
# View canister logs (if available)
dfx canister logs <canister_name> --network ic
```

#### 2. Frontend Debugging

```javascript
// Enable debug mode
localStorage.setItem('DEBUG', 'true');

// Monitor network requests
console.log('API calls:', window.performance.getEntriesByType('navigation'));
```

#### 3. Performance Profiling

```bash
# Profile canister performance
dfx canister call <canister_name> <method_name> --query --network ic
```

## Maintenance Procedures

### 1. Regular Updates

```bash
# Update DFX
dfx upgrade

# Update dependencies
cd frontend && npm update

# Update Rust dependencies
cargo update
```

### 2. Canister Upgrades

```bash
# Upgrade canister with new code
dfx deploy <canister_name> --mode upgrade --network ic

# Verify upgrade success
dfx canister status <canister_name> --network ic
```

### 3. Data Maintenance

```bash
# Regular data cleanup (implement as needed)
dfx canister call tenant_canister cleanup_old_data --network ic

# Archive historical data
dfx canister call tenant_canister archive_data --network ic
```

## Cost Optimization

### 1. Cycle Management

- Monitor cycle consumption
- Optimize query vs update calls
- Implement efficient data structures
- Use batch operations

### 2. Resource Optimization

```bash
# Monitor resource usage
dfx canister status --network ic

# Optimize WASM size
cargo build --release --target wasm32-unknown-unknown
wasm-opt --strip-debug --optimize target/wasm32-unknown-unknown/release/*.wasm
```

### 3. Cost Monitoring

- Track cycle costs
- Monitor API usage patterns
- Optimize high-frequency operations
- Implement caching strategies

## Rollback Procedures

### 1. Quick Rollback

```bash
# Rollback to previous version
dfx canister install <canister_name> --mode reinstall --wasm <previous_version.wasm> --network ic
```

### 2. Data Rollback

```bash
# Restore from backup (if implemented)
dfx canister call tenant_canister restore_backup --network ic '(<backup_data>)'
```

### 3. Emergency Procedures

1. Stop traffic to affected canisters
2. Assess the issue
3. Implement fix or rollback
4. Verify functionality
5. Resume traffic

This deployment guide provides comprehensive instructions for deploying and maintaining the Decentralized LMS on the Internet Computer Protocol.
