// Internet Identity Authentication Service
// Handles authentication with Internet Identity canister

import { AuthClient } from '@dfinity/auth-client';

class InternetIdentityService {
  constructor() {
    this.authClient = null;
    this.identity = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      this.authClient = await AuthClient.create();
      this.identity = this.authClient.getIdentity();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Internet Identity service:', error);
      throw error;
    }
  }

  async login() {
    if (!this.isInitialized) {
      await this.init();
    }

    // Choose identity provider based on environment
    const isDev = true;
    const iiCanisterId = 'rdmx6-jaaaa-aaaaa-aaadq-cai';
    // Use static localhost for II URL to avoid subdomain issues
    const devIdentityProvider = `http://localhost:4943/?canisterId=${iiCanisterId}`;
    const prodIdentityProvider = 'https://identity.ic0.app';

    return new Promise((resolve, reject) => {
      this.authClient.login({
        identityProvider: isDev ? devIdentityProvider : prodIdentityProvider,
        derivationOrigin: window.location.origin,
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days
        onSuccess: async () => {
          this.identity = this.authClient.getIdentity();
          resolve(this.identity);
        },
        onError: (error) => {
          console.error('Internet Identity login failed:', error);
          reject(new Error('Internet Identity authentication failed'));
        }
      });
    });
  }

  async logout() {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      await this.authClient.logout();
      this.identity = this.authClient.getIdentity();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  async isAuthenticated() {
    if (!this.isInitialized) {
      await this.init();
    }

    return await this.authClient.isAuthenticated();
  }

  async getIdentity() {
    if (!this.isInitialized) {
      await this.init();
    }

    if (await this.isAuthenticated()) {
      return this.authClient.getIdentity();
    } else {
      throw new Error('User is not authenticated');
    }
  }

  getPrincipal() {
    if (!this.identity) {
      throw new Error('Not authenticated');
    }

    return this.identity.getPrincipal();
  }

  getPrincipalString() {
    return this.getPrincipal().toString();
  }

  // Check if current session is still valid
  async checkSession() {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      const isAuth = await this.isAuthenticated();
      if (isAuth) {
        this.identity = this.authClient.getIdentity();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const internetIdentityService = new InternetIdentityService();

export default internetIdentityService;
