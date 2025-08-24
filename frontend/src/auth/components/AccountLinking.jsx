import React, { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { LoadingSpinner, Button, Input, Card } from '../../shared/components';
import { getCurrentTenant } from '../../utils/tenantUtils';

const AccountLinking = () => {
  const { linkToPreProvisionedUser, verifyUniversityCredentials, authState, error } = useAuth();
  const [formData, setFormData] = useState({
    universityId: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [verificationStep, setVerificationStep] = useState('credentials'); // 'credentials' | 'linking'

  const currentTenant = getCurrentTenant();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setVerificationError(null);
  };

  const handleVerifyCredentials = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setVerificationError(null);

    try {
      const response = await verifyUniversityCredentials(formData.universityId, formData.email);
      
      if (response && response.Ok) {
        // Credentials verified, proceed to linking
        setVerificationStep('linking');
      } else {
        setVerificationError(response?.Err?.ValidationError || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationError(err.message || 'Failed to verify credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async () => {
    setIsLoading(true);
    setVerificationError(null);

    try {
      await linkToPreProvisionedUser(formData.universityId, formData.email);
      // Success is handled by the AuthContext state change
    } catch (err) {
      console.error('Linking error:', err);
      setVerificationError(err.message || 'Failed to link account');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentTenant.tenantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Tenant Selected</h2>
            <p className="text-gray-600 mb-6">
              Please access the application through a tenant subdomain (e.g., harvard.lms.localhost)
            </p>
            <a
              href="/tenant-selector"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Select Tenant
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Link Your Account</h1>
          <p className="text-gray-600">
            Connect your Internet Identity to your {currentTenant.tenantId} account
          </p>
        </div>

        {verificationStep === 'credentials' ? (
          <form onSubmit={handleVerifyCredentials} className="space-y-6">
            <div>
              <label htmlFor="universityId" className="block text-sm font-medium text-gray-700 mb-2">
                University ID
              </label>
              <Input
                id="universityId"
                name="universityId"
                type="text"
                placeholder="Enter your university ID (e.g., STU001)"
                value={formData.universityId}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                University Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your.email@university.edu"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>

            {verificationError && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-700 text-sm">{verificationError}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !formData.universityId || !formData.email}
              className="w-full"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Verify Credentials'}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="text-green-800 font-medium mb-2">Credentials Verified!</h3>
              <p className="text-green-700 text-sm">
                Your university credentials have been verified. Click below to link your Internet Identity.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h4 className="text-blue-800 font-medium mb-2">Account Details</h4>
              <p className="text-blue-700 text-sm">
                <strong>University ID:</strong> {formData.universityId}<br />
                <strong>Email:</strong> {formData.email}<br />
                <strong>Tenant:</strong> {currentTenant.tenantId}
              </p>
            </div>

            {verificationError && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-700 text-sm">{verificationError}</p>
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                onClick={() => setVerificationStep('credentials')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleLinkAccount}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Link Account'}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Need help? Contact your university's IT support team for assistance with account linking.
          </p>
        </div>
      </Card>
    </div>
  );
};

export { AccountLinking };
