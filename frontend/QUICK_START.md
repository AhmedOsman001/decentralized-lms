# Quick Start Guide - Decentralized LMS Frontend

## 🚀 Running the Development Server

### Option 1: Using the provided scripts (Recommended)

**On Windows:**
```cmd
# Double-click or run from command prompt
start-dev.bat
```

**On Linux/WSL:**
```bash
./start-dev.sh
```

### Option 2: Using WSL directly
```bash
wsl -e bash -c "cd /home/ahmed/decentralized_lms/frontend && npm run dev"
```

### Option 3: From within WSL
```bash
# Open WSL terminal
wsl

# Navigate to frontend directory
cd /home/ahmed/decentralized_lms/frontend

# Start development server
npm run dev
```

## 🌐 Accessing the Application

Once the development server starts, the application will be available at:
- **Local**: http://localhost:5173
- **Network**: http://[your-ip]:5173

## 🔧 Prerequisites

Before running the frontend, ensure you have:

1. **Backend Running**: The ICP local replica and canisters should be deployed
   ```bash
   # In the project root
   dfx start --background
   dfx deploy
   ```

2. **University Data**: Import pre-provisioned users (for testing)
   ```bash
   # Run the pre-provisioning test script
   ./test_pre_provision.sh
   ```

## 🧪 Testing the Application

### Test Flow:
1. **Start Backend**: `dfx start --background && dfx deploy`
2. **Import Data**: Run pre-provisioning scripts to create test users
3. **Start Frontend**: Use one of the methods above
4. **Test Login**: 
   - Select university (e.g., "harvard")
   - Login with Internet Identity
   - Verify with university credentials
   - Access role-based portal

### Test Users (after pre-provisioning):
- **Student**: `STU_harvard_001` / `student1@harvard.edu`
- **Instructor**: `INS_harvard_001` / `instructor1@harvard.edu`  
- **Admin**: Use the principal from canister deployment

## 🎨 Features to Test

### Student Portal:
- ✅ Dashboard with course overview
- ✅ Course enrollment and details
- ✅ Assignment tracking
- ✅ Grade viewing

### Instructor Portal:
- ✅ Course management dashboard
- ✅ Student grading interface
- ✅ Course analytics

### Admin Portal:
- ✅ User management
- ✅ System overview
- ✅ Pre-provisioned user monitoring

## 🎯 Theme Features

### Dark/Light Mode:
- Toggle in the top navigation
- Persistent across sessions
- Automatic system preference detection

### Theme Variants:
- Warm (default) - Purple/blue palette
- Cool - Blue/teal palette  
- Nature - Green palette
- Sunset - Orange palette
- Ocean - Deep blue palette

## 🔍 Troubleshooting

### Common Issues:

1. **UNC Path Error (Windows)**:
   - Use the provided `start-dev.bat` script
   - Or run from WSL directly

2. **Permission Denied**:
   ```bash
   wsl -e bash -c "chmod +x /home/ahmed/decentralized_lms/frontend/node_modules/.bin/vite"
   ```

3. **Port Already in Use**:
   - Check for running Vite processes: `ps aux | grep vite`
   - Kill existing processes or use different port

4. **Cannot Connect to Backend**:
   - Ensure `dfx start` is running
   - Check canister IDs in `canisterService.js`
   - Verify network connectivity

### Development Tips:

1. **Hot Reload**: Changes to React components will automatically refresh
2. **Console Logs**: Open browser DevTools to see authentication flow
3. **Network Tab**: Monitor API calls to canisters
4. **React DevTools**: Install for component debugging

## 📱 Mobile Testing

The application is fully responsive. Test on:
- **Mobile**: iPhone/Android browsers
- **Tablet**: iPad/Android tablets  
- **Desktop**: All modern browsers

## 🔄 Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

## 📚 Next Steps

1. **Explore Features**: Test all portal functionalities
2. **Customize Theme**: Modify `src/styles/theme.css`
3. **Add Features**: Extend portal capabilities
4. **Deploy**: Configure for production deployment

---

**Need Help?** Check the main `FRONTEND_README.md` for detailed documentation.
