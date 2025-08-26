import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Users,
  MoreVertical
} from 'lucide-react';
import { 
  GradientCard, 
  GradientButton, 
  LoadingSpinner 
} from '../../../shared/components';
import { adminService } from '../../../services/adminService';

export const PreProvisionedUsersPage = () => {
  const [preProvisionedUsers, setPreProvisionedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [importStats, setImportStats] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersResponse, statsResponse] = await Promise.allSettled([
        adminService.listPreProvisionedUsers(),
        adminService.getImportStatistics()
      ]);

      if (usersResponse.status === 'fulfilled' && usersResponse.value.success) {
        setPreProvisionedUsers(usersResponse.value.data);
      } else {
        setError('Failed to load pre-provisioned users');
      }

      if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
        setImportStats(statsResponse.value.data);
      }

    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load pre-provisioned user data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this pre-provisioned user?')) {
      return;
    }

    try {
      const response = await adminService.deletePreProvisionedUser(userId);
      if (response.success) {
        await loadData(); // Reload data
      } else {
        setError(response.error);
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Handle CSV file upload for bulk import
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      
      const records = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          university_id: values[0]?.trim() || '',
          email: values[1]?.trim() || '',
          name: values[2]?.trim() || '',
          role: values[3]?.trim() || 'Student',
          department: values[4]?.trim() || null,
          year_of_study: values[5] ? parseInt(values[5].trim()) : null,
          course_codes: values[6]?.trim() || ''
        };
      }).filter(record => record.university_id && record.email && record.name);

      if (records.length > 0) {
        const response = await adminService.importUniversityRecords(records);
        if (response.success) {
          await loadData(); // Reload data
        } else {
          setError(response.error);
        }
      }
    } catch (err) {
      console.error('Failed to import records:', err);
      setError('Failed to import records');
    }
  };

  const filteredUsers = preProvisionedUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.university_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (user.status && Object.keys(user.status)[0].toLowerCase() === filterStatus.toLowerCase());
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    if (!status) return Clock;
    const statusKey = Object.keys(status)[0];
    switch (statusKey) {
      case 'Verified':
      case 'Linked':
        return CheckCircle;
      case 'PendingVerification':
        return Clock;
      case 'Expired':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'text-slate-400';
    const statusKey = Object.keys(status)[0];
    switch (statusKey) {
      case 'Verified':
      case 'Linked':
        return 'text-green-400';
      case 'PendingVerification':
        return 'text-yellow-400';
      case 'Expired':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
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
          <h1 className="text-2xl font-bold text-white mb-2">Pre-provisioned Users</h1>
          <p className="text-slate-400">Manage university users awaiting account linking</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <GradientButton as="span" variant="secondary" className="flex items-center cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </GradientButton>
          </label>
          
          <GradientButton className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export Template
          </GradientButton>
        </div>
      </div>

    

      {/* Filters and Search */}
      <GradientCard variant="glass" className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or university ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="imported">Imported</option>
              <option value="pendingverification">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="linked">Linked</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </GradientCard>

      {/* Users Table */}
      <GradientCard variant="glass" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  User Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  University ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredUsers.map((user) => {
                const StatusIcon = getStatusIcon(user.status);
                const statusColor = getStatusColor(user.status);
                const statusName = user.status ? Object.keys(user.status)[0] : 'Unknown';
                const roleName = user.role ? Object.keys(user.role)[0] : 'Unknown';
                
                return (
                  <tr key={user.university_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-slate-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {user.university_id}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-300">
                        {roleName}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StatusIcon className={`h-4 w-4 mr-2 ${statusColor}`} />
                        <span className={`text-sm ${statusColor}`}>
                          {statusName}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {user.department || 'Not specified'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-slate-400 hover:text-blue-400 transition-colors">
                          <FileText className="h-4 w-4" />
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteUser(user.university_id)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        <button className="text-slate-400 hover:text-slate-300 transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">No pre-provisioned users found</h3>
              <p className="text-slate-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Import university records to get started'
                }
              </p>
            </div>
          )}
        </div>
      </GradientCard>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <GradientCard variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {preProvisionedUsers.length}
          </div>
          <div className="text-sm text-slate-400">Total Users</div>
        </GradientCard>
        
        <GradientCard variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {preProvisionedUsers.filter(u => u.status && Object.keys(u.status)[0] === 'Linked').length}
          </div>
          <div className="text-sm text-slate-400">Linked</div>
        </GradientCard>
        
        <GradientCard variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {preProvisionedUsers.filter(u => u.status && Object.keys(u.status)[0] === 'PendingVerification').length}
          </div>
          <div className="text-sm text-slate-400">Pending</div>
        </GradientCard>
        
        <GradientCard variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {preProvisionedUsers.filter(u => u.role && Object.keys(u.role)[0] === 'Student').length}
          </div>
          <div className="text-sm text-slate-400">Students</div>
        </GradientCard>
        
        <GradientCard variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {preProvisionedUsers.filter(u => u.role && ['Instructor', 'Admin'].includes(Object.keys(u.role)[0])).length}
          </div>
          <div className="text-sm text-slate-400">Staff</div>
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
