import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  FileText, 
  Clock,
  Download,
  Calendar,
  Activity,
  HardDrive
} from 'lucide-react';
import { 
  GradientCard, 
  GradientButton, 
  LoadingSpinner 
} from '../../../shared/components';
import { adminService } from '../../../services/adminService';

export const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({
    userStats: { total: 0, active: 0, newThisMonth: 0 },
    courseStats: { total: 0, published: 0, avgEnrollment: 0 },
    quizStats: { total: 0, completed: 0, avgScore: 0 },
    storageStats: { totalSize: 0, fileCount: 0, hitRatio: 0 },
    importStats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load various analytics data
      const [
        userCount,
        storageStats,
        importStats,
        tenantInfo
      ] = await Promise.allSettled([
        adminService.getUserCount(),
        adminService.getStorageStats(),
        adminService.getImportStatistics(),
        adminService.getTenantInfo()
      ]);

      // Process the results
      const userStatsData = userCount.status === 'fulfilled' ? userCount.value.data : 0;
      const storageData = storageStats.status === 'fulfilled' ? storageStats.value.data : null;
      const importData = importStats.status === 'fulfilled' ? importStats.value.data : [];

      setAnalytics({
        userStats: {
          total: userStatsData || 0,
          active: Math.floor((userStatsData || 0) * 0.85), // Mock active users
          newThisMonth: Math.floor((userStatsData || 0) * 0.15) // Mock new users
        },
        courseStats: {
          total: 0, // Will be loaded from course service
          published: 0,
          avgEnrollment: 0
        },
        quizStats: {
          total: 0, // Will be loaded from quiz service
          completed: 0,
          avgScore: 0
        },
        storageStats: {
          totalSize: storageData?.total_size || 0,
          fileCount: storageData?.total_files || 0,
          hitRatio: storageData?.cache_hit_ratio || 0
        },
        importStats: importData || []
      });

    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const metricCards = [
    {
      title: 'Total Users',
      value: analytics.userStats.total.toLocaleString(),
      change: `+${analytics.userStats.newThisMonth}`,
      changeText: 'new this month',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      changeType: 'positive'
    },
    {
      title: 'Active Users',
      value: analytics.userStats.active.toLocaleString(),
      change: '+8.2%',
      changeText: 'from last month',
      icon: Activity,
      color: 'from-green-500 to-green-600',
      changeType: 'positive'
    },
    {
      title: 'Total Courses',
      value: analytics.courseStats.total.toLocaleString(),
      change: `${analytics.courseStats.published} published`,
      changeText: 'courses available',
      icon: BookOpen,
      color: 'from-purple-500 to-purple-600',
      changeType: 'neutral'
    },
    {
      title: 'Storage Used',
      value: formatBytes(analytics.storageStats.totalSize),
      change: `${analytics.storageStats.fileCount}`,
      changeText: 'files stored',
      icon: HardDrive,
      color: 'from-orange-500 to-orange-600',
      changeType: 'neutral'
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-slate-400">Monitor your institution's LMS performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          
          <GradientButton variant="secondary" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </GradientButton>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <GradientCard key={index} variant="glass" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {metric.value}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className={`h-4 w-4 mr-1 ${
                    metric.changeType === 'positive' ? 'text-green-400' : 
                    metric.changeType === 'negative' ? 'text-red-400' : 'text-slate-400'
                  }`} />
                  <span className={`text-sm ${
                    metric.changeType === 'positive' ? 'text-green-400' : 
                    metric.changeType === 'negative' ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {metric.change} {metric.changeText}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-full bg-gradient-to-r ${metric.color}`}>
                <metric.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </GradientCard>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Chart */}
        <GradientCard variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              User Activity
            </h3>
            <div className="text-sm text-slate-400">Last 7 days</div>
          </div>
          
          {/* Mock chart data */}
          <div className="space-y-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const value = Math.floor(Math.random() * 100) + 20;
              return (
                <div key={day} className="flex items-center space-x-3">
                  <div className="w-8 text-sm text-slate-400">{day}</div>
                  <div className="flex-1 bg-slate-800 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm text-slate-300 text-right">{value}%</div>
                </div>
              );
            })}
          </div>
        </GradientCard>

        {/* Quiz Performance */}
        <GradientCard variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Quiz Performance
            </h3>
            <div className="text-sm text-slate-400">This month</div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Attempts</span>
              <span className="text-white font-semibold">1,234</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Completion Rate</span>
              <span className="text-green-400 font-semibold">85.2%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Average Score</span>
              <span className="text-blue-400 font-semibold">78.5%</span>
            </div>
            
            <div className="pt-4">
              <div className="text-sm text-slate-400 mb-2">Score Distribution</div>
              <div className="space-y-2">
                {[
                  { range: '90-100%', count: 156, color: 'from-green-500 to-green-600' },
                  { range: '80-89%', count: 234, color: 'from-blue-500 to-blue-600' },
                  { range: '70-79%', count: 189, color: 'from-yellow-500 to-yellow-600' },
                  { range: '60-69%', count: 98, color: 'from-orange-500 to-orange-600' },
                  { range: '<60%', count: 67, color: 'from-red-500 to-red-600' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-16 text-xs text-slate-400">{item.range}</div>
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <div 
                        className={`bg-gradient-to-r ${item.color} h-2 rounded-full`}
                        style={{ width: `${(item.count / 234) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-xs text-slate-300 text-right">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GradientCard>
      </div>

      {/* Storage and System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GradientCard variant="glass" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <HardDrive className="h-5 w-5 mr-2" />
            Storage Analytics
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Files</span>
              <span className="text-white font-semibold">
                {analytics.storageStats.fileCount.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Storage Used</span>
              <span className="text-white font-semibold">
                {formatBytes(analytics.storageStats.totalSize)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Cache Hit Ratio</span>
              <span className="text-green-400 font-semibold">
                {(analytics.storageStats.hitRatio * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </GradientCard>

        <GradientCard variant="glass" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Activity
          </h3>
          
          <div className="space-y-3">
            {[
              { action: 'User registration spike', time: '2 min ago', type: 'info' },
              { action: 'New course published', time: '15 min ago', type: 'success' },
              { action: 'System backup completed', time: '1 hr ago', type: 'success' },
              { action: 'High storage usage alert', time: '2 hrs ago', type: 'warning' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-400' :
                  activity.type === 'warning' ? 'bg-yellow-400' :
                  activity.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                }`} />
                <div className="flex-1 text-slate-300">{activity.action}</div>
                <div className="text-slate-500">{activity.time}</div>
              </div>
            ))}
          </div>
        </GradientCard>

        <GradientCard variant="glass" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Import Statistics
          </h3>
          
          <div className="space-y-3">
            {analytics.importStats.length > 0 ? (
              analytics.importStats.map((stat, index) => (
                <div key={index} className="text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400">Total Imported</span>
                    <span className="text-white">{stat[1]}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-sm">No import data available</div>
            )}
          </div>
        </GradientCard>
      </div>

      {error && (
        <div className="text-red-400 text-center p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};
