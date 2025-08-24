import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService.js';
import { getCurrentTenant } from '../utils/tenantUtils.js';

const TenantSelector = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTenants = async () => {
      try {
        setLoading(true);
        const tenantList = await apiService.listTenants();
        setTenants(tenantList || []);
      } catch (err) {
        console.error('Failed to load tenants:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTenants();
  }, []);

  const selectTenant = (tenantId) => {
    const url = `http://${tenantId}.lms.localhost:3000`;
    window.location.href = url;
  };

  const currentTenant = getCurrentTenant();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Select Tenant</h1>
        
        {/* Current Context */}
        {currentTenant.tenantId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">
              <strong>Current Tenant:</strong> {currentTenant.tenantId}
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error Loading Tenants</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Tenant List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map((tenant, index) => (
            <div key={tenant.id || index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {tenant.name || tenant.id}
              </h3>
              <p className="text-gray-600 mb-4">ID: {tenant.id}</p>
              <button
                onClick={() => selectTenant(tenant.subdomain || tenant.id)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Select Tenant
              </button>
            </div>
          ))}
        </div>

        {tenants.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No tenants available</p>
            <p className="text-gray-400 mt-2">Contact your administrator to set up tenants</p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/tenant-debug')}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View Debugging Information
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantSelector;
