# Decentralized LMS Frontend

A modern, responsive React frontend for the Decentralized Learning Management System built on the Internet Computer Protocol (ICP).

## 🏗️ Architecture

The frontend has been completely refactored with a clean, modular architecture:

```
src/
├── auth/                    # Authentication components
│   └── pages/
│       └── LoginPage.jsx    # University selection & II login
├── context/                 # React Context providers
│   ├── AuthContext.jsx      # Authentication state management
│   └── ThemeContext.jsx     # Theme and dark mode management
├── layout/                  # Layout components
│   └── AppLayout.jsx        # Main app layout with navigation
├── portals/                 # Role-based portal components
│   ├── admin/
│   │   └── pages/
│   │       └── AdminDashboard.jsx
│   ├── instructor/
│   │   └── pages/
│   │       └── InstructorDashboard.jsx
│   └── student/
│       └── pages/
│           ├── StudentDashboard.jsx
│           ├── CoursesPage.jsx
│           └── AssignmentsPage.jsx
├── services/                # API service layer
│   ├── canisterService.js   # ICP canister interactions
│   └── internetIdentityService.js
├── shared/                  # Reusable components
│   └── components/
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── LoadingSpinner.jsx
│       └── Modal.jsx
├── styles/                  # Global styles
│   └── theme.css           # Theme variables and utilities
└── utils/                   # Utility functions
```

## 🎨 Design System

### Theme
- **Inspired by**: The reactcode project's elegant color palette and layout
- **Colors**: Warm purple (#424874), Accent blue (#A6B1E1), Sand (#DCD6F7), Cream (#F4EEFF)
- **Dark Mode**: Full support with automatic theme switching
- **Typography**: Inter font family with optimized reading experience

### Components
- **Consistent**: All components follow the same design patterns
- **Responsive**: Mobile-first design with Tailwind-like utilities
- **Accessible**: ARIA labels, keyboard navigation, and semantic HTML
- **Themed**: Automatic dark/light mode adaptation

## 🔐 Authentication Flow

### Pre-provisioned User Integration
1. **University Selection**: Users select their university (tenant)
2. **Internet Identity Login**: Secure authentication via II
3. **Email Verification**: OTP verification using pre-provisioned university records
4. **Account Linking**: Links II principal to university account
5. **Role-based Routing**: Automatic redirection to appropriate portal

### Supported User Roles
- **Student**: Course enrollment, assignments, grades
- **Instructor**: Course management, grading, analytics  
- **Admin**: User management, system administration

## 🚀 Portal Features

### Student Portal
- **Dashboard**: Course overview, grade summary, quick actions
- **Courses**: Enrolled courses with progress tracking
- **Assignments**: Assignment tracking with status filters
- **Grades**: Grade history and GPA calculation

### Instructor Portal
- **Dashboard**: Course statistics, recent grading activity
- **Course Management**: Create and manage courses
- **Grading**: Grade student submissions
- **Analytics**: Course performance insights

### Admin Portal  
- **Dashboard**: System overview, user statistics
- **User Management**: Add/edit users, role assignment
- **Course Management**: System-wide course administration
- **Analytics**: Platform-wide insights and reports

## 🛠️ Technical Features

### State Management
- **AuthContext**: Global authentication state
- **ThemeContext**: Theme and dark mode preferences
- **Local Storage**: Persistent user preferences

### Routing
- **React Router v6**: Modern routing with nested routes
- **Protected Routes**: Role-based access control
- **Dynamic Navigation**: Context-aware navigation menus

### API Integration
- **Canister Service**: Type-safe ICP canister interactions
- **Error Handling**: Comprehensive error boundaries
- **Loading States**: Smooth loading experiences

### Performance
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component-level lazy loading
- **Optimized Builds**: Production-ready builds with Vite

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Enhanced tablet experience
- **Desktop**: Full-featured desktop interface
- **Touch Friendly**: Touch-optimized interactions

## 🎯 Key Improvements

### From Previous Version
1. **Complete Refactor**: Modern React patterns and hooks
2. **Role-based Portals**: Separate interfaces for each user type
3. **Enhanced UX**: Smooth animations, loading states, error handling
4. **Theme System**: Consistent theming with dark mode support
5. **Better Navigation**: Intuitive navigation with breadcrumbs
6. **Mobile Optimization**: Fully responsive design
7. **Type Safety**: Better prop validation and error handling

### Integration with Backend
- **Pre-provisioning**: Seamless integration with university data import
- **RBAC**: Role-based access control enforcement
- **Real-time Data**: Live updates from canister state
- **Error Handling**: Graceful handling of canister errors

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Running ICP local replica

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 🔧 Configuration

### Environment Variables
- `NODE_ENV`: Development/production mode
- Canister IDs are configured in `canisterService.js`

### Theme Customization
Modify `src/styles/theme.css` to customize:
- Color palette
- Typography
- Spacing
- Animations

## 🧪 Testing

### Manual Testing Flow
1. Start local replica: `dfx start`
2. Deploy canisters: `dfx deploy`
3. Import university data via admin
4. Test login flow with pre-provisioned users
5. Verify role-based portal access

### Test Users
After importing university data, test with:
- Student: `STU_harvard_001`
- Instructor: `INS_harvard_001` 
- Admin: Use the admin principal from deployment

## 🏷️ Multitenancy (Dev)

- The app derives the tenant from the subdomain.
- Example: open `http://uni.lms.localhost:3000` and the active tenant will be `uni`.
- You can also override with `?tenant=uni` for quick testing.
- No special hosts setup is required on modern browsers for `*.localhost`.

## 📚 Documentation

### Component Documentation
Each component includes:
- PropTypes or TypeScript definitions
- Usage examples
- Styling guidelines

### API Documentation
Service layer documentation covers:
- Canister method mappings
- Error handling patterns
- Authentication requirements

## 🤝 Contributing

### Code Style
- ESLint configuration for consistency
- Prettier for code formatting
- Component naming conventions

### Pull Request Process
1. Feature branches from `main`
2. Comprehensive testing
3. Documentation updates
4. Code review approval

## 📄 License

This project is part of the Decentralized LMS system built on the Internet Computer Protocol.

