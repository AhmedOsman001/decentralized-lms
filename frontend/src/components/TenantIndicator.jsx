import React from 'react';
import { getCurrentTenant } from '../utils/tenantUtils';

const TenantIndicator = () => {
  const tenant = getCurrentTenant();

  // Only show in development mode
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-xs">
        <div>
          <strong>Tenant:</strong> {tenant.tenantId || 'None'}
        </div>
        <div>
          <strong>Mode:</strong> {tenant.isMultiTenant ? 'Multi-tenant' : 'Single'}
        </div>
        <div>
          <strong>Environment:</strong> {tenant.isLocalDev ? 'Local' : 'Production'}
        </div>
      </div>
    </div>
  );
};

export default TenantIndicator;
