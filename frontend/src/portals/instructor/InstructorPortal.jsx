import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { Card } from '../../shared/components';

const InstructorDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Instructor Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 hover:border-slate-500 transition-all">
            <h3 className="text-lg font-semibold text-white mb-2">My Courses</h3>
            <p className="text-slate-400">Manage courses you're teaching</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 hover:border-slate-500 transition-all">
            <h3 className="text-lg font-semibold text-white mb-2">Student Management</h3>
            <p className="text-slate-400">View and manage enrolled students</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 hover:border-slate-500 transition-all">
            <h3 className="text-lg font-semibold text-white mb-2">Grading</h3>
            <p className="text-slate-400">Grade assignments and manage evaluations</p>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="p-8 bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600">
            <h3 className="text-xl font-semibold text-white mb-4">Welcome, {user?.name || 'Instructor'}!</h3>
            <p className="text-slate-400 text-lg leading-relaxed">
              You're successfully logged in to the Instructor Portal. This is where you'll manage your courses, 
              students, and academic evaluations.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const InstructorPortal = () => {
  return (
    <Routes>
      <Route path="/*" element={<InstructorDashboard />} />
    </Routes>
  );
};
