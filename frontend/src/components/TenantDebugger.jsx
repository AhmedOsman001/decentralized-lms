import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService.js';
import { getCurrentTenant, extractTenantFromHostname } from '../utils/tenantUtils.js';

const TenantDebugger = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);

  useEffect(() => {
    const loadTenantInfo = async () => {
      try {
        setLoading(true);
        
        // Get current tenant context
        const current = getCurrentTenant();
        setCurrentTenant(current);
        
        // List available tenants
        const tenantList = await apiService.listTenants();
        setTenants(tenantList || []);
        
      } catch (err) {
        console.error('Failed to load tenant info:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTenantInfo();
  }, []);

  const navigateToTenant = (tenantId) => {
    const url = `http://${tenantId}.lms.localhost:3000`;
    window.location.href = url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tenant information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tenant Debugger</h1>
        
        {/* Current Context */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Context</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Hostname:</strong> {window.location.hostname}</p>
              <p><strong>Full URL:</strong> {window.location.href}</p>
              <p><strong>Detected Tenant:</strong> {extractTenantFromHostname() || 'None'}</p>
            </div>
            <div>
              <p><strong>Is Multi-tenant:</strong> {currentTenant?.isMultiTenant ? 'Yes' : 'No'}</p>
              <p><strong>Is Local Dev:</strong> {currentTenant?.isLocalDev ? 'Yes' : 'No'}</p>
              <p><strong>Tenant ID:</strong> {currentTenant?.tenantId || 'None'}</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error Loading Tenants</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Available Tenants */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Available Tenants</h2>
          
          {tenants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tenants found in the system.</p>
              <p className="text-sm text-gray-400 mt-2">
                You may need to register a tenant first using the router canister.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.map((tenant, index) => (
                <div key={tenant.id || index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <h3 className="font-semibold text-gray-900">{tenant.name || tenant.id}</h3>
                  <p className="text-sm text-gray-600 mb-2">ID: {tenant.id}</p>
                  <p className="text-sm text-gray-600 mb-3">Subdomain: {tenant.subdomain}</p>
                  <button
                    onClick={() => navigateToTenant(tenant.subdomain || tenant.id)}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    Access Tenant
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-blue-800 font-semibold mb-2">How to Use Multi-tenant URLs</h3>
          <div className="text-blue-700 space-y-2">
            <p><strong>Local Development:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>http://harvard.lms.localhost:3000</code> - Access Harvard tenant</li>
              <li><code>http://mit.lms.localhost:3000</code> - Access MIT tenant</li>
              <li><code>http://localhost:3000</code> - No tenant (may cause errors)</li>
            </ul>
            
            <p className="mt-4"><strong>Note:</strong> Make sure your local DNS resolves *.localhost to 127.0.0.1</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDebugger;
