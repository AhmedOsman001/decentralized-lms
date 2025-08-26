import React, { useState, useEffect } from 'react';
import { useAuth, AUTH_STATES } from '../../shared/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LoadingSpinner, 
  GradientButton, 
  GradientCard, 
  GradientCardHeader, 
  GradientCardContent, 
  GradientCardTitle, 
  GradientCardDescription,
  BackgroundLayout,
  Header,
  Logo
} from '../../shared/components';
import { getCurrentTenant } from '../../utils/tenantUtils';
import { Shield, GraduationCap, BookOpen, Settings, CheckCircle, ArrowRight, Key, AlertCircle, Building2 } from 'lucide-react';

const LoginPage = () => {
  const { login, authState, error, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const currentTenant = getCurrentTenant();

  // Debug: log current auth state
  console.log('LoginPage - Current auth state:', authState);
  console.log('LoginPage - Is authenticated:', isAuthenticated);
  console.log('LoginPage - User:', user);

  // Portal information for display
  const portals = [
    {
      icon: GraduationCap,
      title: "Student Portal",
      description: "View courses and assignments",
      color: "text-blue-400"
    },
    {
      icon: BookOpen,
      title: "Instructor Portal", 
      description: "Manage courses and grades",
      color: "text-green-400"
    },
    {
      icon: Settings,
      title: "Admin Portal",
      description: "System administration", 
      color: "text-purple-400"
    }
  ];

  // Redirect if user is already authenticated and linked
  useEffect(() => {
    if (authState === AUTH_STATES.LINKED && isAuthenticated && user) {
      // Extract role from backend format: {TenantAdmin: null} -> "TenantAdmin"
      let userRole = 'Student'; // default
      if (user.role && typeof user.role === 'object') {
        const roleKeys = Object.keys(user.role);
        if (roleKeys.length > 0) {
          userRole = roleKeys[0]; // Keep original case
        }
      } else if (typeof user.role === 'string') {
        userRole = user.role;
      }
      
      console.log('Redirecting authenticated user to portal:', userRole);
      
      switch (userRole) {
        case 'TenantAdmin':
          navigate('/tenant-admin/dashboard', { replace: true });
          break;
        case 'Instructor':
          navigate('/instructor', { replace: true });
          break;
        case 'Student':
        default:
          navigate('/student', { replace: true });
          break;
      }
    } else if (authState === AUTH_STATES.LINKING_REQUIRED) {
      console.log('Redirecting to link account');
      navigate('/link-account', { replace: true });
    }
  }, [authState, isAuthenticated, user, navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await login();
      
      if (result && result.success) {
        if (result.redirect === 'role-based') {
          // User is authenticated and linked, useEffect will handle redirection
          console.log('Login successful, user will be redirected based on role');
        } else if (result.redirect === 'link-account') {
          // User needs to link account, useEffect will handle redirection
          console.log('User needs to link account');
        }
      } else if (result && result.error) {
        console.error('Login failed:', result.error);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while authentication is being processed
  if (authState === AUTH_STATES.LOADING) {
    return (
      <BackgroundLayout>
        <div className="min-h-screen flex items-center justify-center">
          <GradientCard variant="glass" className="p-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-slate-300">Authenticating...</p>
          </GradientCard>
        </div>
      </BackgroundLayout>
    );
  }

  // Show tenant selection if no tenant is detected
  if (!currentTenant.tenantId) {
    return (
      <BackgroundLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <GradientCard variant="glass" className="p-8 max-w-md w-full">
            <div className="text-center">
              <div className="mb-6">
                <Building2 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome to Decentralized LMS
                </h2>
                <p className="text-slate-300">
                  Please select your institution to continue
                </p>
              </div>
              
              <div className="space-y-4">
                <GradientButton
                  onClick={() => window.location.href = '/tenant-selector'}
                  className="w-full py-3"
                  gradient="primary"
                  size="lg"
                >
                  <div className="flex items-center justify-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Select Institution
                  </div>
                </GradientButton>
                
                <a
                  href="/tenant-debug"
                  className="block text-blue-300 hover:text-blue-200 text-sm underline transition-colors"
                >
                  View Available Institutions
                </a>
              </div>
            </div>
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
            {/* Welcome Content */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome to {currentTenant.tenantId}
              </h1>
              <p className="text-slate-300">
                Sign in to access your Learning Management System
              </p>
            </div>

            {/* Authentication Info */}
            <div className="mb-6">
              <GradientCard variant="subtle" className="p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      Internet Identity Authentication
                    </h3>
                    <p className="text-slate-300 text-sm">
                      Secure, decentralized authentication with cryptographic verification.
                    </p>
                  </div>
                </div>
              </GradientCard>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6">
                <GradientCard variant="danger" className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-300" />
                    <p className="text-red-100 text-sm">{error}</p>
                  </div>
                </GradientCard>
              </div>
            )}

            {/* Login Button */}
            <div className="space-y-4">
              <GradientButton
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full py-3 text-lg"
                gradient="primary"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Key className="h-5 w-5 mr-2" />
                    Sign In with Internet Identity
                  </div>
                )}
              </GradientButton>

              {/* Create Identity Link */}
              <div className="text-center">
                <p className="text-xs text-slate-400">
                  Don't have an Internet Identity?{' '}
                  <a 
                    href="http://127.0.0.1:4943/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 underline transition-colors"
                  >
                    Create one here
                  </a>
                </p>
              </div>
            </div>

            {/* Institution Info */}
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-1">Current Institution:</p>
                <div className="flex items-center justify-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  <p className="font-medium text-white">{currentTenant.tenantId}</p>
                </div>
              </div>
            </div>
          </GradientCard>
        </div>
      </div>
    </BackgroundLayout>
  );
};

export { LoginPage };
