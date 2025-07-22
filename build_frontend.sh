#!/bin/bash

set -e

echo "🚀 Building Frontend for Decentralized LMS"
echo "==========================================="

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found. Run this from the project root."
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in frontend directory."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

# Build the frontend
echo "🔨 Building frontend application..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully"
else
    echo "❌ Failed to build frontend"
    exit 1
fi

# Check if dist directory was created
if [ -d "dist" ]; then
    echo "✅ Build output found in dist/ directory"
    echo "   Files:"
    ls -la dist/
else
    echo "❌ Build output not found"
    exit 1
fi

cd ..

echo ""
echo "🎉 Frontend build completed successfully!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Run 'dfx canister create --all' to create all canister IDs"
echo "2. Run 'dfx deploy' to deploy backend and frontend canisters"
echo "3. Access the frontend via the canister URL"
