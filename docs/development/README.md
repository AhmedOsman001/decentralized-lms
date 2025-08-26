# Development Setup Guide

## Overview

This guide will help you set up a complete development environment for the Decentralized Learning Management System. Follow these steps to get up and running quickly.

## Prerequisites

### System Requirements

- **Operating System**: Linux, macOS, or Windows with WSL2
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: 20GB free space
- **CPU**: Multi-core processor recommended
- **Network**: Stable broadband internet connection

### Required Tools

1. **Git** - Version control
2. **Node.js** (v16+) - Frontend development
3. **Rust** (latest stable) - Backend development
4. **DFX** (latest) - Internet Computer SDK
5. **VS Code** (recommended) - Code editor

## Step-by-Step Setup

### 1. Install System Dependencies

#### On Ubuntu/Debian:
```bash
# Update package list
sudo apt update

# Install build essentials
sudo apt install -y build-essential curl wget git

# Install CMake (required for some dependencies)
sudo apt install -y cmake pkg-config libssl-dev
```

#### On macOS:
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install build tools
xcode-select --install

# Install CMake
brew install cmake
```

#### On Windows (WSL2):
```bash
# Install WSL2 and Ubuntu
# Follow Microsoft's WSL installation guide
# Then follow Ubuntu instructions above
```

### 2. Install Node.js and npm

```bash
# Install Node Version Manager (NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js 18 (LTS)
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version  # Should output v18.x.x
npm --version   # Should output 9.x.x or higher
```

### 3. Install Rust

```bash
# Install Rust using rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow the prompts, choose default installation
# Reload shell configuration
source ~/.cargo/env

# Add WebAssembly target (required for IC development)
rustup target add wasm32-unknown-unknown

# Verify installation
rustc --version  # Should output rustc 1.x.x
cargo --version  # Should output cargo 1.x.x
```

### 4. Install DFX (DFINITY SDK)

```bash
# Install DFX
sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"

# Add DFX to PATH
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
dfx --version  # Should output dfx 0.x.x
```

### 5. Install Additional Development Tools

```bash
# Install cargo-audit for security scanning
cargo install cargo-audit

# Install wasm-pack for WebAssembly
cargo install wasm-pack

# Install ic-repl for canister interaction
cargo install ic-repl

# Install vessel for Motoko (optional)
sudo curl -fsSL https://github.com/dfinity/vessel/releases/latest/download/vessel-linux64 -o /usr/local/bin/vessel
sudo chmod +x /usr/local/bin/vessel
```

### 6. Setup Development Environment

#### Install VS Code Extensions:
```bash
# Install VS Code if not already installed
# Download from: https://code.visualstudio.com/

# Recommended extensions (install through VS Code marketplace):
# - Rust Analyzer (rust-lang.rust-analyzer)
# - ES7+ React/Redux/React-Native snippets
# - Tailwind CSS IntelliSense
# - Prettier - Code formatter
# - Thunder Client (for API testing)
# - Git Lens
```

#### Configure Git:
```bash
# Set up your Git identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Configure Git for better IC development
git config --global pull.rebase false
git config --global init.defaultBranch main
```

## Project Setup

### 1. Clone the Repository

```bash
# Clone the project
git clone <repository-url>
cd decentralized_lms

# Or if starting fresh:
mkdir decentralized_lms
cd decentralized_lms
git init
```

### 2. Project Structure Overview

```
decentralized_lms/
├── .dfx/                    # DFX generated files (don't commit)
├── .git/                    # Git repository
├── src/                     # Rust source code
│   ├── shared/              # Shared types and utilities
│   ├── router_canister/     # Router canister code
│   └── tenant_canister/     # Tenant canister code
├── frontend/                # React frontend application
│   ├── src/                 # Frontend source code
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration
├── docs/                    # Documentation
├── scripts/                 # Development scripts
├── dfx.json                 # DFX configuration
├── Cargo.toml              # Rust workspace configuration
└── README.md               # Project overview
```

### 3. Install Dependencies

```bash
# Install Rust dependencies (builds the project)
cargo build

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 4. Configure Development Environment

#### Create Local Configuration:

```bash
# Copy example environment files
cp frontend/.env.example frontend/.env.local

# Edit the local environment file
nano frontend/.env.local
```

Example `.env.local`:
```bash
VITE_IC_HOST=http://localhost:4943
VITE_ENVIRONMENT=development
VITE_DEBUG=true
```

#### DFX Configuration:

Ensure `dfx.json` is properly configured:
```json
{
  "version": 1,
  "canisters": {
    "router_canister": {
      "type": "rust",
      "package": "router_canister"
    },
    "tenant_canister": {
      "type": "rust",
      "package": "tenant_canister"
    },
    "shared": {
      "type": "rust",
      "package": "shared"
    },
    "frontend": {
      "type": "assets",
      "source": ["frontend/dist"]
    }
  },
  "networks": {
    "local": {
      "bind": "127.0.0.1:4943",
      "type": "ephemeral"
    }
  }
}
```

## Development Workflow

### 1. Start the Local IC Replica

```bash
# Start DFX in the background
dfx start --background

# Or start in foreground for debugging
dfx start

# Verify replica is running
dfx ping
```

### 2. Deploy Canisters Locally

```bash
# Deploy all canisters
dfx deploy

# Or deploy individually
dfx deploy shared
dfx deploy router_canister
dfx deploy tenant_canister

# Get canister IDs
dfx canister id router_canister
dfx canister id tenant_canister
```

### 3. Start Frontend Development Server

```bash
# In a new terminal, navigate to frontend
cd frontend

# Start development server
npm run dev

# The frontend will be available at http://localhost:3000
```

### 4. Initialize the System

```bash
# Register a demo tenant
TENANT_CANISTER_ID=$(dfx canister id tenant_canister)
dfx canister call router_canister register_tenant '("demo", principal "'$TENANT_CANISTER_ID'")'

# Initialize the tenant canister
dfx canister call tenant_canister init '(opt (opt "demo", opt principal "'$(dfx identity get-principal)'"))'

# Create an admin user
dfx canister call tenant_canister create_user '(record {
  name = "Demo Admin";
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

## Development Tools and Scripts

### 1. Useful DFX Commands

```bash
# Check canister status
dfx canister status <canister_name>

# View canister ID
dfx canister id <canister_name>

# Call canister methods
dfx canister call <canister_name> <method_name> '(<arguments>)'

# Check identity
dfx identity whoami

# Get principal ID
dfx identity get-principal

# Stop local replica
dfx stop
```

### 2. Frontend Development Commands

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format

# Type checking (if using TypeScript)
npm run type-check
```

### 3. Backend Development Commands

```bash
# Build all Rust packages
cargo build

# Run tests
cargo test

# Check for security vulnerabilities
cargo audit

# Format code
cargo fmt

# Run linting
cargo clippy

# Build for WebAssembly
cargo build --target wasm32-unknown-unknown --release

# Generate Candid interface
cargo test  # This generates .did files in .dfx/local/canisters/*/
```

### 4. Development Scripts

Create useful scripts in the `scripts/` directory:

#### `scripts/reset-local.sh`:
```bash
#!/bin/bash
# Reset local development environment

echo "Stopping DFX..."
dfx stop

echo "Cleaning DFX state..."
rm -rf .dfx

echo "Starting DFX..."
dfx start --background

echo "Deploying canisters..."
dfx deploy

echo "Initializing system..."
# Add initialization commands here

echo "Development environment reset complete!"
```

#### `scripts/deploy-local.sh`:
```bash
#!/bin/bash
# Deploy to local environment

echo "Building Rust canisters..."
cargo build

echo "Building frontend..."
cd frontend && npm run build && cd ..

echo "Deploying canisters..."
dfx deploy

echo "Deployment complete!"
```

#### Make scripts executable:
```bash
chmod +x scripts/*.sh
```

## IDE Configuration

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "rust-analyzer.cargo.target": "wasm32-unknown-unknown",
  "rust-analyzer.checkOnSave.command": "clippy",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.did": "candid"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### VS Code Launch Configuration

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/frontend/node_modules/.bin/vite",
      "args": ["--mode", "development"],
      "cwd": "${workspaceFolder}/frontend",
      "console": "integratedTerminal"
    }
  ]
}
```

## Testing Setup

### 1. Backend Testing

```bash
# Run all tests
cargo test

# Run specific test module
cargo test user_management

# Run tests with output
cargo test -- --nocapture

# Run tests in specific package
cargo test -p tenant_canister
```

### 2. Frontend Testing

```bash
cd frontend

# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### 3. Integration Testing

```bash
# Install ic-repl for integration testing
cargo install ic-repl

# Run integration tests
ic-repl tests/integration.repl
```

## Debugging

### 1. Frontend Debugging

```javascript
// Enable debug mode
localStorage.setItem('DEBUG', 'true');

// Debug API calls
console.log('API Response:', response);

// React Developer Tools (install browser extension)
```

### 2. Backend Debugging

```rust
// Add debug prints in Rust code
ic_cdk::println!("Debug: {}", variable);

// Use debug builds for more information
cargo build  # Instead of cargo build --release
```

### 3. Network Debugging

```bash
# Check local replica status
dfx ping

# View canister logs (if available)
dfx canister logs <canister_name>

# Monitor network requests in browser developer tools
```

## Common Development Tasks

### 1. Adding a New API Endpoint

1. Define the function in the appropriate Rust module
2. Add it to the public API in `api.rs`
3. Update the Candid interface (`.did` file)
4. Add frontend service method
5. Test the endpoint

### 2. Creating a New Frontend Component

1. Create component file in appropriate directory
2. Add necessary imports and dependencies
3. Implement component logic
4. Add styling with Tailwind CSS
5. Export component
6. Add to parent component or routing

### 3. Adding a New Database Entity

1. Define the struct in `shared/src/types.rs`
2. Add storage in `tenant_canister/src/storage.rs`
3. Implement CRUD operations
4. Add API endpoints
5. Update frontend services
6. Add UI components

### 4. Updating Dependencies

```bash
# Update Rust dependencies
cargo update

# Update frontend dependencies
cd frontend && npm update

# Update DFX
dfx upgrade
```

## Performance Optimization

### 1. Frontend Performance

- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Lazy load components and routes
- Optimize bundle size with code splitting

### 2. Backend Performance

- Use appropriate data structures (HashMap for O(1) lookups)
- Implement caching for frequently accessed data
- Optimize Candid serialization
- Use query calls instead of update calls when possible

### 3. Development Environment Performance

- Use SSD storage for better I/O performance
- Allocate sufficient RAM for the IC replica
- Use incremental builds when possible
- Close unnecessary applications during development

## Troubleshooting

### Common Issues

#### 1. DFX Won't Start
```bash
# Check if port 4943 is in use
lsof -i :4943

# Kill existing DFX processes
pkill dfx

# Start fresh
dfx start --clean
```

#### 2. Canister Build Failures
```bash
# Clean build artifacts
cargo clean

# Rebuild dependencies
cargo build

# Check Rust version
rustc --version

# Update Rust if needed
rustup update
```

#### 3. Frontend Won't Start
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version
```

#### 4. CORS Issues
- Ensure proper CORS configuration in canister
- Check that frontend is running on correct port
- Verify IC_HOST environment variable

### Getting Help

1. **Documentation**: Check the official Internet Computer documentation
2. **Forums**: DFINITY Developer Forum
3. **Discord**: DFINITY Discord server
4. **Stack Overflow**: Tag questions with `internet-computer`
5. **GitHub Issues**: Project-specific issues

## Best Practices

### 1. Code Organization
- Follow domain-driven design principles
- Keep related code in the same module
- Use clear, descriptive names
- Write comprehensive tests

### 2. Git Workflow
- Use meaningful commit messages
- Create feature branches for new development
- Use pull requests for code review
- Keep commits small and focused

### 3. Security
- Never commit sensitive information
- Use environment variables for configuration
- Validate all inputs
- Follow Rust safety guidelines

### 4. Performance
- Profile code regularly
- Monitor resource usage
- Optimize critical paths
- Use appropriate data structures

This development setup guide should get you up and running with the Decentralized LMS project quickly and efficiently!
