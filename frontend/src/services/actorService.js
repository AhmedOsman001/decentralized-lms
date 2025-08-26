// Actor Service for Decentralized LMS
// Provides reusable functions for creating and managing actors

import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { getCurrentTenant } from '../utils/tenantUtils.js';

/**
 * Creates an actor with the provided IDL factory and canister ID
 * @param {Function} idlFactory - The IDL factory function
 * @param {string} canisterId - The canister ID
 * @param {Object} options - Additional options
 * @param {boolean} options.useIdentity - Whether to use authenticated identity
 * @returns {Promise<Actor>} The created actor
 */
export async function createActor(idlFactory, canisterId, options = {}) {
  const { useIdentity = true } = options;
  
  const tenant = getCurrentTenant();
  let agent;

  if (useIdentity) {
    // Create authenticated agent
    const authClient = await AuthClient.create();
    const identity = authClient.getIdentity();
    
    agent = new HttpAgent({
      identity,
      host: tenant.canisterHost || 'http://127.0.0.1:4943'
    });
  } else {
    // Create anonymous agent
    agent = new HttpAgent({
      host: tenant.canisterHost || 'http://127.0.0.1:4943'
    });
  }

  // Fetch root key for local development
  if (tenant.isLocalDev) {
    await agent.fetchRootKey();
  }

  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
}

/**
 * Gets the backend canister ID for the current tenant
 * @returns {Promise<string>} The canister ID
 */
export async function getBackendCanisterId() {
  const tenant = getCurrentTenant();
  
  // For development/testing, use the actual deployed canister ID
  // In production, this would be retrieved from the router canister
  if (tenant.isLocalDev) {
    return 'ulvla-h7777-77774-qaacq-cai'; // Actual deployed tenant canister ID
  }
  
  // TODO: Implement production logic to get canister ID from router
  throw new Error('Production canister ID retrieval not implemented');
}

/**
 * Creates a router actor for interacting with the router canister
 * @param {Function} routerIdlFactory - The router IDL factory
 * @returns {Promise<Actor>} The router actor
 */
export async function createRouterActor(routerIdlFactory) {
  const routerCanisterId = 'u6s2n-gx777-77774-qaaba-cai'; // Default router canister ID
  return createActor(routerIdlFactory, routerCanisterId, { useIdentity: false });
}

/**
 * Creates a tenant actor for the current tenant
 * @param {Function} tenantIdlFactory - The tenant IDL factory
 * @param {string} tenantCanisterId - Optional specific tenant canister ID
 * @returns {Promise<Actor>} The tenant actor
 */
export async function createTenantActor(tenantIdlFactory, tenantCanisterId = null) {
  if (!tenantCanisterId) {
    tenantCanisterId = await getBackendCanisterId();
  }
  
  return createActor(tenantIdlFactory, tenantCanisterId, { useIdentity: true });
}
