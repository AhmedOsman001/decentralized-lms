import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { 
  GradientCard, 
  GradientButton, 
  GradientInput, 
  LoadingSpinner, 
  BackgroundLayout 
} from '../../shared/components';
import { Mail, KeyRound, Clock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function OTPVerification() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const { verifyOTPAndLink, principal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { universityId, email } = location.state || {};

  useEffect(() => {
    if (!universityId || !email || !principal) {
      navigate('/link-account');
      return;
    }

    // Start 5-minute countdown for OTP expiry
    setCountdown(300); // 5 minutes in seconds
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [universityId, email, principal, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await verifyOTPAndLink(universityId, email, otp.trim());
      
      if (result.success) {
        // OTP verified and account linked successfully
        // Navigate based on user role
        const userRole = result.user?.role || 'student';
        
        switch (userRole) {
          case 'admin':
            navigate('/tenant-admin');
            break;
          case 'instructor':
            navigate('/instructor');
            break;
          case 'student':
          default:
            navigate('/student');
            break;
        }
      } else {
        setError(result.error || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    // In a real implementation, this would call the resend OTP API
    setError('');
    setCountdown(300);
    // For now, just show a message
    alert('OTP resent to your email (simulated)');
  };

  if (!universityId || !email || !principal) {
    return null; // Will redirect in useEffect
  }

  return (
    <BackgroundLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <GradientCard variant="glass" className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4">
                <KeyRound className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-white mb-2">Verify OTP</h1>
                <p className="text-gray-300 mb-2">
                  Enter the 6-digit code sent to your email
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <p className="text-sm text-blue-300 font-medium">{email}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-2">
                  One-Time Password
                </label>
                <GradientInput
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={isLoading}
                  maxLength="6"
                  className="text-center text-lg font-mono tracking-widest"
                  autoComplete="one-time-code"
                  required
                  icon={KeyRound}
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
                disabled={isLoading || otp.length !== 6}
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
                    Verify OTP & Link Account
                  </div>
                )}
              </GradientButton>
            </form>

            {/* Account Info */}
            <div className="mt-8 pt-6 border-t border-gray-700/50">
              <div className="text-center space-y-3">
                <div className="text-sm text-gray-400">
                  <p>University ID: <span className="font-medium text-white">{universityId}</span></p>
                </div>
                
                {/* Countdown */}
                {countdown > 0 ? (
                  <GradientCard variant="subtle" className="p-3">
                    <div className="flex items-center justify-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-400" />
                      <p className="text-sm text-gray-300">
                        OTP expires in: <span className="font-mono font-medium text-orange-300">
                          {formatTime(countdown)}
                        </span>
                      </p>
                    </div>
                  </GradientCard>
                ) : (
                  <div className="space-y-3">
                    <GradientCard variant="danger" className="p-3">
                      <p className="text-sm text-red-200 text-center">OTP has expired</p>
                    </GradientCard>
                    <GradientButton
                      variant="outline"
                      size="sm"
                      onClick={handleResendOTP}
                      disabled={isLoading}
                      className="w-full"
                    >
                      Resend OTP
                    </GradientButton>
                  </div>
                )}
              </div>
            </div>

            {/* Development Note */}
            <div className="mt-6">
              <GradientCard variant="info" className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-blue-200 font-medium mb-1">Development Note</h3>
                    <p className="text-blue-100 text-sm">
                      For testing, use OTP: <span className="font-mono font-bold">123456</span>
                    </p>
                  </div>
                </div>
              </GradientCard>
            </div>

            {/* Back Button */}
            <div className="mt-6 text-center">
              <GradientButton
                variant="outline"
                size="sm"
                onClick={() => navigate('/link-account')}
                disabled={isLoading}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Account Linking
              </GradientButton>
            </div>
          </GradientCard>
        </div>
      </div>
    </BackgroundLayout>
  );
}
