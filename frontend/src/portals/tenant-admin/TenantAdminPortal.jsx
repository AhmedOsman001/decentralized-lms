import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';

// Import page components
import { AdminDashboard } from './pages/AdminDashboard';
import { UserManagementPage } from './pages/UserManagementPage';
import { PreProvisionedUsersPage } from './pages/PreProvisionedUsersPage';
import { CourseManagementPage } from './pages/CourseManagementPage';
import { QuizManagementPage } from './pages/QuizManagementPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TenantSettingsPage } from './pages/TenantSettingsPage';

export const TenantAdminPortal = () => {
  return (
    <AdminLayout>
      <Routes>
        {/* Default route - redirect to dashboard */}
        <Route path="/" element={<Navigate to="/tenant-admin/dashboard" replace />} />
        
        {/* Admin Dashboard */}
        <Route path="/dashboard" element={<AdminDashboard />} />
        
        {/* User Management */}
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="/pre-provisioned" element={<PreProvisionedUsersPage />} />
        
        {/* Academic Management */}
        <Route path="/courses" element={<CourseManagementPage />} />
        <Route path="/quizzes" element={<QuizManagementPage />} />
        
        {/* Analytics and Reports */}
        <Route path="/analytics" element={<AnalyticsPage />} />
        
        {/* System Settings */}
        <Route path="/settings" element={<TenantSettingsPage />} />
        
        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/tenant-admin/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};
