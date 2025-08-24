/**
 * Utility functions for tenant extraction and management
 * Handles both local development and production environments
 */

/**
 * Extracts tenant identifier from hostname
 * Supports both local development (*.localhost) and production (*.lms.app)
 * 
 * @param {string} hostname - The hostname to parse (default: window.location.hostname)
 * @returns {string|null} - Tenant identifier or null if not found
 */
export function extractTenantFromHostname(hostname = window.location.hostname) {
  // Handle local development environment
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    // Check for subdomain.lms.localhost pattern
    if (parts.length >= 3 && parts[1] === 'lms' && parts[2] === 'localhost') {
      return parts[0]; // Return subdomain (e.g., 'harvard' from 'harvard.lms.localhost')
    }
    // Check for subdomain.localhost pattern
    if (parts.length >= 2 && parts[1] === 'localhost' && parts[0] !== 'lms') {
      return parts[0]; // Return subdomain (e.g., 'harvard' from 'harvard.localhost')
    }
    return null; // Default localhost without tenant
  }
  
  // Handle production environment (*.lms.app)
  if (hostname.includes('lms.app')) {
    const parts = hostname.split('.');
    if (parts.length >= 3 && parts[1] === 'lms' && parts[2] === 'app') {
      return parts[0]; // Return subdomain (e.g., 'harvard' from 'harvard.lms.app')
    }
    return null; // Root domain lms.app
  }
  
  // Handle IC canister URLs (*.ic0.app or *.icp0.io)
  if (hostname.includes('ic0.app') || hostname.includes('icp0.io')) {
    // Extract from query parameters or custom headers
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tenant') || null;
  }
  
  return null;
}

/**
 * Gets the current tenant context
 * @returns {Object} Tenant context object
 */
export function getCurrentTenant() {
  const tenantId = extractTenantFromHostname();
  const isLocalDev = window.location.hostname.includes('localhost') || 
                     window.location.hostname.includes('127.0.0.1');
  
  // Check for dev tenant override in localStorage for testing
  if (isLocalDev && !tenantId) {
    const devTenant = localStorage.getItem('dev-tenant');
    if (devTenant) {
      console.log('Using dev tenant from localStorage:', devTenant);
    }
    
    // Save the tenant to localStorage for convenience
    if (tenantId) {
      localStorage.setItem('dev-tenant', tenantId);
    }
  }
  
  const isMultiTenant = tenantId !== null;
  
  return {
    tenantId,
    isMultiTenant,
    isLocalDev,
    baseUrl: isLocalDev ? 'http://localhost:4943' : 'https://lms.app',
    canisterHost: isLocalDev ? 'http://127.0.0.1:4943' : 'https://ic0.app'
  };
}

/**
 * Validates tenant identifier format
 * @param {string} tenantId - Tenant identifier to validate
 * @returns {boolean} True if valid
 */
export function isValidTenantId(tenantId) {
  if (!tenantId || typeof tenantId !== 'string') return false;
  
  // Tenant ID should be alphanumeric with hyphens/underscores, 3-63 characters
  const tenantRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]$/;
  return tenantRegex.test(tenantId);
}

/**
 * Generate tenant URL for navigation
 * @param {string} tenantId - Tenant identifier
 * @param {string} path - Optional path to append
 * @returns {string} Full tenant URL
 */
export function generateTenantUrl(tenantId, path = '') {
  const isLocalDev = window.location.hostname.includes('localhost');
  const port = isLocalDev ? ':3000' : '';
  const protocol = isLocalDev ? 'http' : 'https';
  const domain = isLocalDev ? 'lms.localhost' : 'lms.app';
  
  return `${protocol}://${tenantId}.${domain}${port}${path}`;
}

/**
 * Check if current context is valid for multi-tenant operations
 * @returns {Object} Validation result
 */
export function validateTenantContext() {
  const tenant = getCurrentTenant();
  
  return {
    isValid: tenant.isMultiTenant && tenant.tenantId,
    tenant,
    errors: [
      ...(!tenant.isMultiTenant ? ['No tenant detected in URL'] : []),
      ...(!tenant.tenantId ? ['Invalid tenant identifier'] : []),
      ...(!isValidTenantId(tenant.tenantId) ? ['Invalid tenant ID format'] : [])
    ]
  };
}

/**
 * Extract role string from backend role object
 * Backend returns roles as objects like {Student: null}, {Instructor: null}, etc.
 * @param {Object|string} role - Role object or string from backend
 * @returns {string} - Role name as string
 */
export function extractRoleString(role) {
  if (!role) return 'Unknown';
  
  if (typeof role === 'string') {
    return role;
  }
  
  if (typeof role === 'object') {
    const roleKeys = Object.keys(role);
    if (roleKeys.length > 0) {
      return roleKeys[0];
    }
  }
  
  return 'Unknown';
}
