// Main App Component
// Entry point with routing and authentication

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, AUTH_STATES } from './shared/context/AuthContext.jsx';
import { NotificationProvider } from './shared/context/NotificationContext.jsx';
import { PageLoading } from './shared/components';

// Auth components
import { LoginPage } from './auth/pages/LoginPage.jsx';
import AccountLinking from './auth/pages/AccountLinking.jsx';
import OTPVerification from './auth/pages/OTPVerification.jsx';

// Portal components (to be created)
import { StudentPortal } from './portals/student/StudentPortal.jsx';
import { InstructorPortal } from './portals/instructor/InstructorPortal.jsx';
import { TenantAdminPortal } from './portals/tenant-admin/TenantAdminPortal.jsx';

// Development components
import TenantIndicator from './components/TenantIndicator.jsx';
import TenantSelector from './components/TenantSelector.jsx';
import TenantDebugger from './components/TenantDebugger.jsx';
import UnauthorizedPage from './components/UnauthorizedPage.jsx';

// Protected Route component
function ProtectedRoute({ children, requiredRoles = [] }) {
  const { authState, user, hasAnyRole } = useAuth();

  // Show loading while authentication is being checked
  if (authState === AUTH_STATES.LOADING) {
    return <PageLoading message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (authState === AUTH_STATES.UNAUTHENTICATED) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to account linking if authentication but not linked
  if (authState === AUTH_STATES.LINKING_REQUIRED) {
    return <Navigate to="/link-account" replace />;
  }

  // Check role requirements
  if (requiredRoles.length > 0 && user && !hasAnyRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Role-based redirect component
function RoleBasedRedirect() {
  const { user, getPortalPath } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getPortalPath()} replace />;
}

// App Routes component
function AppRoutes() {
  const { authState } = useAuth();

  // Show loading while authentication is being initialized
  if (authState === AUTH_STATES.LOADING) {
    return <PageLoading message="Initializing application..." />;
  }

  return (
    <Routes>
      {/* Tenant selector for development */}
      <Route path="/tenant-selector" element={<TenantSelector />} />
      <Route path="/tenant-debug" element={<TenantDebugger />} />
      
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/link-account" element={<AccountLinking />} />
      <Route path="/otp-verification" element={<OTPVerification />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected portal routes */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute requiredRoles={['Student']}>
            <StudentPortal />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/instructor/*"
        element={
          <ProtectedRoute requiredRoles={['Instructor']}>
            <InstructorPortal />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/tenant-admin/*"
        element={
          <ProtectedRoute requiredRoles={['TenantAdmin']}>
            <TenantAdminPortal />
          </ProtectedRoute>
        }
      />

      {/* Root redirect based on authentication state */}
      <Route
        path="/"
        element={
          authState === AUTH_STATES.UNAUTHENTICATED ? (
            <Navigate to="/login" replace />
          ) : authState === AUTH_STATES.LINKING_REQUIRED ? (
            <Navigate to="/link-account" replace />
          ) : (
            <RoleBasedRedirect />
          )
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App component
export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <AppRoutes />
            <TenantIndicator />
          </div>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}
