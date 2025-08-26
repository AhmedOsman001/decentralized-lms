import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  BarChart3, 
  FileText,
  UserPlus,
  Building2,
  LogOut,
  Shield
} from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { Logo } from '../../../shared/components';

export const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/tenant-admin/dashboard',
      icon: LayoutDashboard,
      exact: true
    },
    {
      name: 'User Management',
      path: '/tenant-admin/users',
      icon: Users
    },
    {
      name: 'Course Management',
      path: '/tenant-admin/courses',
      icon: BookOpen
    },
    {
      name: 'Quiz Management',
      path: '/tenant-admin/quizzes',
      icon: FileText
    },
    {
      name: 'Pre-provisioned Users',
      path: '/tenant-admin/pre-provisioned',
      icon: UserPlus
    },
    {
      name: 'Analytics',
      path: '/tenant-admin/analytics',
      icon: BarChart3
    },
    {
      name: 'Tenant Settings',
      path: '/tenant-admin/settings',
      icon: Settings
    }
  ];

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 shadow-xl">
      <div className="flex flex-col h-full">
        {/* Logo and Title */}
        <div className="flex items-center h-16 px-6 border-b border-slate-700">
          {/* <Logo className="h-8 w-8 text-blue-400" /> */}
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-white">Admin Portal</h1>
            <p className="text-xs text-slate-400">Decentralized LMS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }
              `}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Profile and Logout */}
        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center mb-4">
            <div className="bg-blue-600 rounded-full p-2">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-slate-400">Tenant Administrator</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
