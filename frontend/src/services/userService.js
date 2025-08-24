import apiService from './apiService';

class UserService {
  // Get current user details
  async getCurrentUser() {
    try {
      const result = await apiService.callTenantMethod('get_current_user', []);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        console.error('Failed to get current user:', result.Err?.message);
        return { success: false, error: result.Err?.message || 'Failed to get current user' };
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user by ID
  async getUser(userId) {
    try {
      const result = await apiService.callTenantMethod('get_user', [userId]);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        console.warn(`User ${userId} not found:`, result.Err?.message);
        return { success: false, error: result.Err?.message || 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  }

  // Update user profile
  async updateUser(userData) {
    try {
      const result = await apiService.callTenantMethod('update_user', [userData]);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err?.message || 'Failed to update user' };
      }
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }

  // Transform user data from backend format to frontend format
  transformUserData(backendUser) {
    return {
      id: backendUser.id,
      name: backendUser.name || 'Unknown User',
      email: backendUser.email || 'no-email@example.com',
      role: backendUser.role || 'student',
      tenant_id: backendUser.tenant_id,
      is_active: backendUser.is_active !== false,
      created_at: backendUser.created_at ? new Date(Number(backendUser.created_at) / 1000000) : null,
      updated_at: backendUser.updated_at ? new Date(Number(backendUser.updated_at) / 1000000) : null,
      profile: backendUser.profile || {}
    };
  }
}

export const userService = new UserService();
