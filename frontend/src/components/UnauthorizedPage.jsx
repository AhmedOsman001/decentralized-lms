import React from 'react';
import { useAuth } from '../shared/context/AuthContext';
import { Card, Button } from '../shared/components';
import { extractRoleString } from '../utils/tenantUtils';

const UnauthorizedPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this resource.
          </p>
          
          {user && (
            <div className="bg-gray-50 rounded p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Current User:</strong> {user.name || 'Unknown'}<br />
                <strong>Role:</strong> {extractRoleString(user.role)}<br />
                <strong>Institution:</strong> {user.tenant_id || 'Unknown'}
              </p> 
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full"
            >
              Go Back
            </Button>
            
            <Button
              onClick={logout}
              variant="primary"
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;
