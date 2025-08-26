import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  UserPlus,
  Shield,
  Building2,
  Activity,
  Clock
} from 'lucide-react';
import { 
  GradientCard, 
  GradientButton, 
  LoadingSpinner 
} from '../../../shared/components';
import { adminService } from '../../../services/adminService';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalQuizzes: 0,
    preProvisionedUsers: 0,
    storageUsed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load various statistics
      const [userCount, tenantInfo, storageStats] = await Promise.allSettled([
        adminService.getUserCount(),
        adminService.getTenantInfo(),
        adminService.getStorageStats()
      ]);

      setStats({
        totalUsers: userCount.status === 'fulfilled' ? userCount.value.data || 0 : 0,
        totalCourses: 0, // Will be loaded from course service
        totalQuizzes: 0, // Will be loaded from quiz service  
        preProvisionedUsers: 0, // Will be loaded from pre-provisioning service
        storageUsed: storageStats.status === 'fulfilled' ? storageStats.value.data?.total_size || 0 : 0
      });

    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      changeType: 'positive',
      onClick: () => navigate('/tenant-admin/users')
    },
    {
      title: 'Active Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      change: '+8%',
      changeType: 'positive',
      onClick: () => navigate('/tenant-admin/courses')
    },
    {
      title: 'Quiz Activities',
      value: stats.totalQuizzes,
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      change: '+15%',
      changeType: 'positive',
      onClick: () => navigate('/tenant-admin/quizzes')
    },
    {
      title: 'Pre-provisioned',
      value: stats.preProvisionedUsers,
      icon: UserPlus,
      color: 'from-orange-500 to-orange-600',
      change: '24 pending',
      changeType: 'neutral',
      onClick: () => navigate('/tenant-admin/pre-provisioned')
    }
  ];

  const quickActions = [
    {
      title: 'User Management',
      description: 'Add, edit, or remove users from the system',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      action: () => navigate('/tenant-admin/users')
    },
    {
      title: 'Course Management',
      description: 'Oversee all courses and their settings',
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      action: () => navigate('/tenant-admin/courses')
    },
    {
      title: 'Analytics & Reports',
      description: 'View detailed analytics and generate reports',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
      action: () => navigate('/tenant-admin/analytics')
    },
    {
      title: 'System Settings',
      description: 'Configure tenant-wide settings and preferences',
      icon: Shield,
      color: 'from-orange-500 to-orange-600',
      action: () => navigate('/tenant-admin/settings')
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome to Admin Dashboard
        </h1>
        <p className="text-slate-400">
          Manage your institution's learning management system
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <GradientCard
            key={index}
            variant="glass"
            className="p-6 cursor-pointer hover:scale-105 transition-transform"
            onClick={stat.onClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stat.value.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className={`h-4 w-4 mr-1 ${
                    stat.changeType === 'positive' ? 'text-green-400' : 
                    stat.changeType === 'negative' ? 'text-red-400' : 'text-slate-400'
                  }`} />
                  <span className={`text-sm ${
                    stat.changeType === 'positive' ? 'text-green-400' : 
                    stat.changeType === 'negative' ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </GradientCard>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action, index) => (
          <GradientCard key={index} variant="glass" className="p-6">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full bg-gradient-to-r ${action.color} flex-shrink-0`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {action.title}
                </h3>
                <p className="text-slate-400 mb-4">
                  {action.description}
                </p>
                <GradientButton
                  onClick={action.action}
                  variant="secondary"
                  size="sm"
                >
                  Manage
                </GradientButton>
              </div>
            </div>
          </GradientCard>
        ))}
      </div>

      {/* Recent Activity */}
      <GradientCard variant="glass" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Activity
          </h3>
          <GradientButton variant="ghost" size="sm">
            View All
          </GradientButton>
        </div>
        
        <div className="space-y-4">
          {[
            { action: 'New user registered', user: 'John Doe', time: '2 minutes ago', type: 'user' },
            { action: 'Course published', user: 'Dr. Smith', time: '15 minutes ago', type: 'course' },
            { action: 'Quiz completed', user: 'Alice Johnson', time: '1 hour ago', type: 'quiz' },
            { action: 'System backup completed', user: 'System', time: '2 hours ago', type: 'system' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
              <div className={`p-2 rounded-full ${
                activity.type === 'user' ? 'bg-blue-500/20 text-blue-400' :
                activity.type === 'course' ? 'bg-green-500/20 text-green-400' :
                activity.type === 'quiz' ? 'bg-purple-500/20 text-purple-400' :
                'bg-orange-500/20 text-orange-400'
              }`}>
                {activity.type === 'user' ? <Users className="h-4 w-4" /> :
                 activity.type === 'course' ? <BookOpen className="h-4 w-4" /> :
                 activity.type === 'quiz' ? <FileText className="h-4 w-4" /> :
                 <Shield className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">
                  <span className="font-medium">{activity.user}</span> {activity.action}
                </p>
                <div className="flex items-center text-xs text-slate-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {activity.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </GradientCard>

      {error && (
        <div className="text-red-400 text-center p-4">
          {error}
        </div>
      )}
    </div>
  );
};
