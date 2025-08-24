import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { Card } from '../../shared/components';

const TenantAdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Tenant Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">User Management</h3>
            <p className="text-slate-400">Manage students, instructors, and admin users</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Course Management</h3>
            <p className="text-slate-400">Oversee all courses in your institution</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">System Settings</h3>
            <p className="text-slate-400">Configure institution-wide settings</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Pre-provisioned Users</h3>
            <p className="text-slate-400">Manage pre-provisioned user accounts</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
            <p className="text-slate-400">View system usage and performance metrics</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Reports</h3>
            <p className="text-slate-400">Generate academic and administrative reports</p>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Welcome, {user?.name || 'Admin'}!</h3>
            <p className="text-slate-400">
              You're successfully logged in to the Tenant Admin Portal. This is where you'll manage your 
              institution's LMS configuration, users, and system-wide settings.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const TenantAdminPortal = () => {
  return (
    <Routes>
      <Route path="/*" element={<TenantAdminDashboard />} />
    </Routes>
  );
};
