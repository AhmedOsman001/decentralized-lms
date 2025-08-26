import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck,
  UserX,
  UserCheck,
  MoreVertical,
  Upload,
  X,
  UserPlus,
  Edit2
} from 'lucide-react';
import { 
  GradientCard, 
  GradientButton, 
  LoadingSpinner,
  Modal
} from '../../../shared/components';
import { adminService } from '../../../services/adminService';
import { icpTimestampToDate } from '../../../utils/icpUtils';

export const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [preProvisionedUsers, setPreProvisionedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddPreProvisionedModal, setShowAddPreProvisionedModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'preprovisioned'

  // Form state for adding pre-provisioned users
  const [preProvisionedForm, setPreProvisionedForm] = useState({
    name: '',
    email: '',
    universityId: '',
    role: 'Student',
    department: ''
  });

  useEffect(() => {
    loadUsers();
    loadPreProvisionedUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await adminService.listUsers();
      if (response.success) {
        setUsers(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadPreProvisionedUsers = async () => {
    try {
      const response = await adminService.listPreProvisionedUsers();
      if (response.success) {
        // Remove duplicates based on email
        const uniqueUsers = response.data.filter((user, index, self) => 
          index === self.findIndex(u => u.email === user.email)
        );
        setPreProvisionedUsers(uniqueUsers);
      } else {
        setError(response.error);
      }
    } catch (err) {
      console.error('Failed to load pre-provisioned users:', err);
      setError('Failed to load pre-provisioned users');
    }
  };

  const handleAddPreProvisionedUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Create single import record with university_id from form
      const importRecord = {
        university_id: preProvisionedForm.universityId || '', // Use form value or empty
        email: preProvisionedForm.email,
        name: preProvisionedForm.name,
        role: preProvisionedForm.role,
        course_codes: '', // Required field - empty for now
        year_of_study: [], // Optional field - None
        department: preProvisionedForm.department ? [preProvisionedForm.department] : [] // Optional field - Some(value) or None
      };

      const response = await adminService.importUniversityRecords([importRecord]);
      
      if (response.success) {
        setShowAddPreProvisionedModal(false);
        setPreProvisionedForm({
          name: '',
          email: '',
          universityId: '',
          role: 'Student',
          department: ''
        });
        await loadPreProvisionedUsers(); // Reload pre-provisioned users
      } else {
        setError(response.error);
      }
    } catch (err) {
      console.error('Failed to add pre-provisioned user:', err);
      setError('Failed to add pre-provisioned user');
    } finally {
      setLoading(false);
    }
  };

  const handleImportUsers = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const importRecords = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const record = {};
          headers.forEach((header, index) => {
            record[header] = values[index];
          });
          return {
            university_id: record.university_id || '',
            email: record.email,
            name: record.name,
            role: record.role,
            course_codes: record.course_codes || '', // Required field
            year_of_study: record.year_of_study ? [parseInt(record.year_of_study)] : [], // Optional field - Some(value) or None
            department: record.department ? [record.department] : [] // Optional field - Some(value) or None
          };
        });

      const response = await adminService.importUniversityRecords(importRecords);
      
      if (response.success) {
        setShowImportModal(false);
        await loadPreProvisionedUsers();
      } else {
        setError(response.error);
      }
    } catch (err) {
      console.error('Failed to import users:', err);
      setError('Failed to import users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePreProvisionedUser = async (email) => {
    try {
      const response = await adminService.deletePreProvisionedUser(email);
      if (response.success) {
        await loadPreProvisionedUsers(); // Reload pre-provisioned users
      } else {
        setError(response.error);
      }
    } catch (err) {
      console.error('Failed to delete pre-provisioned user:', err);
      setError('Failed to delete pre-provisioned user');
    }
  };

  const handleUserAction = async (action, userId) => {
    try {
      let response;
      switch (action) {
        case 'deactivate':
          response = await adminService.deactivateUser(userId);
          break;
        case 'activate':
          response = await adminService.activateUser(userId);
          break;
        case 'delete':
          response = await adminService.deleteUser(userId);
          break;
        default:
          return;
      }

      if (response.success) {
        await loadUsers(); // Reload users
      } else {
        setError(response.error);
      }
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      setError(`Failed to ${action} user`);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || 
                       (user.role && Object.keys(user.role)[0]?.toLowerCase() === filterRole.toLowerCase());
    return matchesSearch && matchesRole;
  });

  const getRoleName = (role) => {
    if (!role || typeof role !== 'object') return 'Unknown';
    return Object.keys(role)[0] || 'Unknown';
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400">Manage user accounts and permissions</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'preprovisioned' && (
            <>
              <GradientButton
                onClick={() => setShowImportModal(true)}
                variant="secondary"
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Import Users
              </GradientButton>
              <GradientButton
                onClick={() => setShowAddPreProvisionedModal(true)}
                className="flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Pre-provisioned User
              </GradientButton>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          Active Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('preprovisioned')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'preprovisioned'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          Pre-provisioned ({preProvisionedUsers.length})
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-center p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'users' ? (
        <>
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="pl-10 pr-8 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="instructor">Instructors</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <GradientCard variant="glass" className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {users.length}
              </div>
              <div className="text-sm text-slate-400">Total Users</div>
            </GradientCard>
            
            <GradientCard variant="glass" className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {users.filter(u => u.is_active).length}
              </div>
              <div className="text-sm text-slate-400">Active Users</div>
            </GradientCard>
            
            <GradientCard variant="glass" className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {users.filter(u => u.role && Object.keys(u.role)[0] === 'Instructor').length}
              </div>
              <div className="text-sm text-slate-400">Instructors</div>
            </GradientCard>
            
            <GradientCard variant="glass" className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {users.filter(u => u.role && Object.keys(u.role)[0] === 'Student').length}
              </div>
              <div className="text-sm text-slate-400">Students</div>
            </GradientCard>
          </div>

          {/* Users Table */}
          <GradientCard variant="glass" className="overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Active Users</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Join Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredUsers.map((user) => {
                    const roleName = getRoleName(user.role);
                    return (
                      <tr key={`active-${user.id}`} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{user.name}</div>
                              <div className="text-sm text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            roleName === 'Instructor' 
                              ? 'bg-blue-900/20 text-blue-300'
                              : roleName === 'Student'
                              ? 'bg-green-900/20 text-green-300'
                              : 'bg-purple-900/20 text-purple-300'
                          }`}>
                            {roleName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active 
                              ? 'bg-green-900/20 text-green-300'
                              : 'bg-red-900/20 text-red-300'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {user.created_at ? icpTimestampToDate(user.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUserAction(user.is_active ? 'deactivate' : 'activate', user.id)}
                              className={`p-1 rounded ${
                                user.is_active 
                                  ? 'text-yellow-400 hover:text-yellow-300'
                                  : 'text-green-400 hover:text-green-300'
                              }`}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleUserAction('delete', user.id)}
                              className="text-red-400 hover:text-red-300 p-1 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
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
                  <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-400 mb-2">No users found</h3>
                  <p className="text-slate-500">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          </GradientCard>
        </>
      ) : (
        <>
          {/* Pre-provisioned Users */}
          <GradientCard variant="glass" className="overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Pre-provisioned Users</h3>
              <p className="text-slate-400 text-sm">Users imported from university records waiting to link their accounts</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      University ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {preProvisionedUsers.map((user) => (
                    <tr key={`preprovisioned-${user.email}`} className="hover:bg-slate-800/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.university_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {typeof user.role === 'object' ? getRoleName(user.role) : user.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/20 text-yellow-300">
                          Pending Verification
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeletePreProvisionedUser(user.email)}
                          className="text-red-400 hover:text-red-300 p-1 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {preProvisionedUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-400 mb-2">No pre-provisioned users</h3>
                  <p className="text-slate-500">Import university records to pre-provision users</p>
                </div>
              )}
            </div>
          </GradientCard>
        </>
      )}

      {/* Add Pre-provisioned User Modal */}
      {showAddPreProvisionedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <GradientCard variant="glass" className="w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Add Pre-provisioned User</h3>
                <button
                  onClick={() => setShowAddPreProvisionedModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddPreProvisionedUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={preProvisionedForm.name}
                    onChange={(e) => setPreProvisionedForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={preProvisionedForm.email}
                    onChange={(e) => setPreProvisionedForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    University ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={preProvisionedForm.universityId}
                    onChange={(e) => setPreProvisionedForm(prev => ({ ...prev, universityId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter university ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={preProvisionedForm.role}
                    onChange={(e) => setPreProvisionedForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Student">Student</option>
                    <option value="Instructor">Instructor</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Department (Optional)
                  </label>
                  <input
                    type="text"
                    value={preProvisionedForm.department}
                    onChange={(e) => setPreProvisionedForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddPreProvisionedModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-600 rounded-md text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add User'}
                  </button>
                </div>
              </form>
            </div>
          </GradientCard>
        </div>
      )}

      {/* Import Users Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <GradientCard variant="glass" className="w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Import Users</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Upload CSV File
                  </label>
                  <div className="border-2 border-dashed border-slate-600 rounded-md p-6 text-center">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 mb-2">
                      Drag and drop your CSV file here, or click to select
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportUsers}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="inline-flex items-center px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 cursor-pointer"
                    >
                      Select File
                    </label>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-md p-4">
                  <h4 className="text-sm font-medium text-white mb-2">CSV Format Requirements:</h4>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li>• Required columns: name, email, role, course_codes</li>
                    <li>• Optional columns: university_id, department, year_of_study</li>
                    <li>• Role must be either "Student" or "Instructor"</li>
                    <li>• Email addresses must be unique</li>
                    <li>• First row should contain headers</li>
                  </ul>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-600 rounded-md text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </GradientCard>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
