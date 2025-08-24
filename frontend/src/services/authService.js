// Authentication Service - Backend Integration
// Handles authentication and user management with Internet Identity and backend

import { AuthClient } from '@dfinity/auth-client';
import { HttpAgent } from '@dfinity/agent';
import apiService from './apiService';

class AuthService {
  constructor() {
    this.authClient = null;
    this.user = null;
    this.isInitialized = false;
    this.initPromise = this.init();
  }

  async init() {
    try {
      this.authClient = await AuthClient.create({
        idleOptions: {
          disableIdle: true,
          disableDefaultIdleCallback: true
        }
      });
      
      if (await this.authClient.isAuthenticated()) {
        await this.loadCurrentUser();
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      this.isInitialized = true;
      return false;
    }
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initPromise;
    }
  }
  async login() {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      this.authClient.login({
        identityProvider: process.env.NODE_ENV === 'development' 
          ? `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943`
          : 'https://identity.ic0.app',
        onSuccess: async () => {
          try {
            // Update apiService with the new identity
            await apiService.updateIdentity(this.authClient.getIdentity());
            await this.loadCurrentUser();
            resolve({ success: true, user: this.user });
          } catch (error) {
            console.error('Post-login setup failed:', error);
            reject({ success: false, error: error.message });
          }
        },
        onError: (error) => {
          console.error('Login failed:', error);
          reject({ success: false, error: error.message });
        }
      });
    });
  }

  async logout() {
    await this.ensureInitialized();
    await this.authClient.logout();
    this.user = null;
    // Clear apiService identity
    await apiService.updateIdentity(null);
  }

  async isAuthenticated() {
    await this.ensureInitialized();
    return await this.authClient.isAuthenticated();
  }

  getIdentity() {
    return this.authClient?.getIdentity();
  }

  getAgent() {
    const identity = this.getIdentity();
    const agent = new HttpAgent({ 
      identity,
      host: process.env.NODE_ENV === 'development' ? 'http://localhost:4943' : 'https://ic0.app'
    });

    if (process.env.NODE_ENV === 'development') {
      agent.fetchRootKey();
    }

    return agent;
  }

  async loadCurrentUser() {
    try {
      const result = await apiService.callTenantMethod('get_current_user', []);
      
      if ('Ok' in result) {
        this.user = this.transformUserData(result.Ok);
        return this.user;
      } else {
        console.warn('User not found in backend:', result.Err);
        this.user = null;
        return null;
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
      this.user = null;
      return null;
    }
  }

  getCurrentUser() {
    return this.user;
  }

  async registerUser(name, email, universityId, role) {
    try {
      const result = await apiService.callTenantMethod('register_user', [
        name, 
        email, 
        universityId, 
        this.mapRole(role), 
        ''
      ]);
      
      if ('Ok' in result) {
        this.user = this.transformUserData(result.Ok);
        return { success: true, user: this.user };
      } else {
        throw new Error(result.Err?.message || 'Failed to register user');
      }
    } catch (error) {
      console.error('Error registering user:', error);
      return { success: false, error: error.message };
    }
  }

  // Pre-provisioning methods for university integration
  async checkUniversityId(universityId) {
    try {
      const result = await apiService.callTenantMethod('check_university_id', [universityId]);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        throw new Error(result.Err?.message || 'University ID not found');
      }
    } catch (error) {
      console.error('Error checking university ID:', error);
      return { success: false, error: error.message };
    }
  }

  async requestEmailVerification(universityId, email) {
    try {
      const result = await apiService.callTenantMethod('request_email_verification', [universityId, email]);
      
      if ('Ok' in result) {
        return { success: true, message: result.Ok };
      } else {
        throw new Error(result.Err?.message || 'Failed to request verification');
      }
    } catch (error) {
      console.error('Error requesting email verification:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyEmail(universityId, email, verificationCode) {
    try {
      const result = await apiService.callTenantMethod('verify_email', [{
        university_id: universityId,
        email: email,
        verification_code: verificationCode
      }]);
      
      if ('Ok' in result) {
        return { success: true, message: result.Ok };
      } else {
        throw new Error(result.Err?.message || 'Failed to verify email');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      return { success: false, error: error.message };
    }
  }

  async linkInternetIdentity(universityId, email) {
    try {
      const result = await apiService.callTenantMethod('link_internet_identity', [universityId, email]);
      
      if ('Ok' in result) {
        return { success: true, user: this.transformUserData(result.Ok) };
      } else {
        throw new Error(result.Err?.message || 'Failed to link identity');
      }
    } catch (error) {
      console.error('Error linking Internet Identity:', error);
      return { success: false, error: error.message };
    }
  }

  async getLinkingStatus(universityId) {
    try {
      const result = await apiService.callTenantMethod('get_linking_status', [universityId]);
      
      if ('Ok' in result) {
        const [status, isLinked] = result.Ok;
        return { success: true, status: this.transformProvisionStatus(status), isLinked };
      } else {
        throw new Error(result.Err?.message || 'Failed to get linking status');
      }
    } catch (error) {
      console.error('Error getting linking status:', error);
      return { success: false, error: error.message };
    }
  }

  // Role management
  async getCurrentUserRole() {
    try {
      const result = await apiService.callTenantMethod('get_current_user_role', []);
      
      if ('Ok' in result) {
        return this.transformRole(result.Ok);
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting current user role:', error);
      return null;
    }
  }

  async hasRole(role) {
    try {
      return await apiService.callTenantMethod('has_role', [this.mapRole(role)]);
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  async isAdmin() {
    try {
      return await apiService.callTenantMethod('is_admin', []);
    } catch (error) {
      return false;
    }
  }

  async isTeacher() {
    try {
      return await apiService.callTenantMethod('is_teacher', []);
    } catch (error) {
      return false;
    }
  }

  async isStudent() {
    try {
      return await apiService.callTenantMethod('is_student', []);
    } catch (error) {
      return false;
    }
  }

  // Utility methods
  mapRole(role) {
    const roleMap = {
      'Student': { 'Student': null },
      'Instructor': { 'Instructor': null },
      'Admin': { 'Admin': null },
      'TenantAdmin': { 'TenantAdmin': null }
    };
    return roleMap[role] || { 'Student': null };
  }

  transformRole(backendRole) {
    if ('Student' in backendRole) return 'Student';
    if ('Instructor' in backendRole) return 'Instructor';
    if ('Admin' in backendRole) return 'Admin';
    if ('TenantAdmin' in backendRole) return 'TenantAdmin';
    return 'Student';
  }

  transformProvisionStatus(backendStatus) {
    if ('Imported' in backendStatus) return 'imported';
    if ('PendingVerification' in backendStatus) return 'pending_verification';
    if ('Verified' in backendStatus) return 'verified';
    if ('Linked' in backendStatus) return 'linked';
    if ('Expired' in backendStatus) return 'expired';
    return 'unknown';
  }

  transformUserData(backendUser) {
    return {
      id: backendUser.id,
      name: backendUser.name,
      email: backendUser.email,
      role: this.transformRole(backendUser.role),
      tenant_id: backendUser.tenant_id,
      is_active: backendUser.is_active,
      created_at: new Date(Number(backendUser.created_at) / 1000000).toISOString(),
      updated_at: new Date(Number(backendUser.updated_at) / 1000000).toISOString()
    };
  }

  // Health check
  async healthCheck() {
    try {
      const result = await apiService.callTenantMethod('health_check', []);
      return { success: true, message: result };
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export const authClient = new AuthService();
export { authClient as authService };
