import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { 
  GradientCard, 
  GradientButton, 
  GradientInput, 
  LoadingSpinner, 
  BackgroundLayout 
} from '../../shared/components';
import { Mail, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';

export default function AccountLinking() {
  const [universityId, setUniversityId] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { verifyEmailAndSendOTP, principal } = useAuth();
  const navigate = useNavigate();

  // Handle navigation when principal is not available
  useEffect(() => {
    if (!principal) {
      navigate('/login');
    }
  }, [principal, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!universityId.trim() || !email.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await verifyEmailAndSendOTP(universityId.trim(), email.trim());
      
      if (result.success) {
        // Email is pre-provisioned, OTP sent - redirect to OTP page
        navigate('/otp-verification', { 
          state: { 
            universityId: universityId.trim(), 
            email: email.trim() 
          }
        });
      } else {
        // Email not pre-provisioned
        setError(result.error || 'Email is not pre-provisioned in the system');
      }
    } catch (error) {
      console.error('Email verification failed:', error);
      setError('Failed to verify email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking principal or redirecting
  if (!principal) {
    return (
      <BackgroundLayout>
        <div className="min-h-screen flex items-center justify-center">
          <GradientCard variant="glass" className="p-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-slate-300">Checking authentication...</p>
          </GradientCard>
        </div>
      </BackgroundLayout>
    );
  }

  return (
    <BackgroundLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <GradientCard variant="glass" className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4">
                <Shield className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-white mb-2">Link Your Account</h1>
                <p className="text-gray-300">
                  Connect your Internet Identity with your university account
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="universityId" className="block text-sm font-medium text-gray-300 mb-2">
                  University ID
                </label>
                <GradientInput
                  id="universityId"
                  type="text"
                  placeholder="Enter your university ID"
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  disabled={isLoading}
                  required
                  icon={User}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  University Email
                </label>
                <GradientInput
                  id="email"
                  type="email"
                  placeholder="Enter your university email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  icon={Mail}
                />
              </div>

              {/* Error Display */}
              {error && (
                <GradientCard variant="danger" className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-300 flex-shrink-0" />
                    <p className="text-red-100 text-sm">{error}</p>
                  </div>
                </GradientCard>
              )}

              {/* Submit Button */}
              <GradientButton
                type="submit"
                disabled={isLoading || !universityId.trim() || !email.trim()}
                className="w-full py-3 text-lg"
                gradient="primary"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Verifying...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Verify Email & Send OTP
                  </div>
                )}
              </GradientButton>
            </form>

            {/* Principal ID Display */}
            <div className="mt-8 pt-6 border-t border-gray-700/50">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Internet Identity Principal:</p>
                <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3">
                  <p className="font-mono text-xs text-gray-300 break-all">{principal}</p>
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="mt-6">
              <GradientCard variant="info" className="p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-blue-200 font-medium mb-1">Important Note</h3>
                    <p className="text-blue-100 text-sm">
                      Your email must be pre-provisioned in the system. If you receive an error, 
                      please contact your system administrator.
                    </p>
                  </div>
                </div>
              </GradientCard>
            </div>
          </GradientCard>
        </div>
      </div>
    </BackgroundLayout>
  );
}
