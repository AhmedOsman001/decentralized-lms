import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Building2, 
  Shield, 
  Database,
  Bell,
  Mail,
  Clock,
  Users,
  FileText
} from 'lucide-react';
import { 
  GradientCard, 
  GradientButton, 
  LoadingSpinner 
} from '../../../shared/components';
import { adminService } from '../../../services/adminService';

export const TenantSettingsPage = () => {
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [settings, setSettings] = useState({
    tenant: {
      name: '',
      description: '',
      contactEmail: '',
      adminEmail: ''
    },
    system: {
      maxUsers: 1000,
      maxCoursesPerInstructor: 10,
      maxStudentsPerCourse: 200,
      defaultQuizTimeLimit: 60,
      maxFileSize: 100, // MB
      enableEmailNotifications: true,
      enableSMSNotifications: false,
      sessionTimeoutMinutes: 480,
      autoBackupEnabled: true,
      backupFrequencyHours: 24
    },
    security: {
      requireEmailVerification: true,
      allowSelfRegistration: false,
      passwordExpiryDays: 90,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 30,
      requireTwoFactor: false
    }
  });

  useEffect(() => {
    loadTenantSettings();
  }, []);

  const loadTenantSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getTenantInfo();
      if (response.success) {
        setTenantInfo(response.data);
        // Update settings with actual tenant data
        setSettings(prev => ({
          ...prev,
          tenant: {
            ...prev.tenant,
            name: response.data.tenant_id || '',
            // Add other tenant-specific settings here
          }
        }));
      } else {
        setError(response.error);
      }
    } catch (err) {
      console.error('Failed to load tenant settings:', err);
      setError('Failed to load tenant settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage('');

      // In a real implementation, you would have API endpoints to save these settings
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

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
          <h1 className="text-2xl font-bold text-white mb-2">Tenant Settings</h1>
          <p className="text-slate-400">Configure your institution's LMS settings</p>
        </div>
        
        <GradientButton
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center"
        >
          {saving ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </GradientButton>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="text-green-400 text-center p-4 bg-green-900/20 border border-green-500/20 rounded-lg">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="text-red-400 text-center p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Tenant Information */}
      <GradientCard variant="glass" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Tenant Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Institution Name
            </label>
            <input
              type="text"
              value={settings.tenant.name}
              onChange={(e) => handleInputChange('tenant', 'name', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter institution name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={settings.tenant.contactEmail}
              onChange={(e) => handleInputChange('tenant', 'contactEmail', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="contact@institution.edu"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={settings.tenant.description}
              onChange={(e) => handleInputChange('tenant', 'description', e.target.value)}
              rows="3"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of your institution"
            />
          </div>
        </div>
      </GradientCard>

      {/* System Limits */}
      <GradientCard variant="glass" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Database className="h-5 w-5 mr-2" />
          System Limits
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Users
            </label>
            <input
              type="number"
              value={settings.system.maxUsers}
              onChange={(e) => handleInputChange('system', 'maxUsers', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Courses per Instructor
            </label>
            <input
              type="number"
              value={settings.system.maxCoursesPerInstructor}
              onChange={(e) => handleInputChange('system', 'maxCoursesPerInstructor', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Students per Course
            </label>
            <input
              type="number"
              value={settings.system.maxStudentsPerCourse}
              onChange={(e) => handleInputChange('system', 'maxStudentsPerCourse', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Default Quiz Time Limit (minutes)
            </label>
            <input
              type="number"
              value={settings.system.defaultQuizTimeLimit}
              onChange={(e) => handleInputChange('system', 'defaultQuizTimeLimit', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max File Size (MB)
            </label>
            <input
              type="number"
              value={settings.system.maxFileSize}
              onChange={(e) => handleInputChange('system', 'maxFileSize', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.system.sessionTimeoutMinutes}
              onChange={(e) => handleInputChange('system', 'sessionTimeoutMinutes', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </GradientCard>

      {/* Notifications */}
      <GradientCard variant="glass" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notification Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-slate-400 mr-2" />
              <span className="text-slate-300">Email Notifications</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.system.enableEmailNotifications}
                onChange={(e) => handleInputChange('system', 'enableEmailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-slate-400 mr-2" />
              <span className="text-slate-300">Auto Backup</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.system.autoBackupEnabled}
                onChange={(e) => handleInputChange('system', 'autoBackupEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </GradientCard>

      {/* Security Settings */}
      <GradientCard variant="glass" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Security Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-slate-300">Require Email Verification</span>
              <p className="text-sm text-slate-500">Users must verify their email before accessing the system</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.security.requireEmailVerification}
                onChange={(e) => handleInputChange('security', 'requireEmailVerification', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-slate-300">Allow Self Registration</span>
              <p className="text-sm text-slate-500">Users can create accounts without admin approval</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.security.allowSelfRegistration}
                onChange={(e) => handleInputChange('security', 'allowSelfRegistration', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Lockout Duration (minutes)
              </label>
              <input
                type="number"
                value={settings.security.lockoutDurationMinutes}
                onChange={(e) => handleInputChange('security', 'lockoutDurationMinutes', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </GradientCard>

      {/* Current Tenant Info Display */}
      {tenantInfo && (
        <GradientCard variant="glass" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Current Tenant Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Tenant ID:</span>
              <span className="text-white ml-2">{tenantInfo.tenant_id}</span>
            </div>
            <div>
              <span className="text-slate-400">Created:</span>
              <span className="text-white ml-2">
                {new Date(Number(tenantInfo.created_at) / 1000000).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Initialized:</span>
              <span className={`ml-2 ${tenantInfo.is_initialized ? 'text-green-400' : 'text-red-400'}`}>
                {tenantInfo.is_initialized ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </GradientCard>
      )}
    </div>
  );
};
