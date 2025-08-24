import React, { createContext, useContext, useReducer, useEffect } from 'react';
import internetIdentityService from '../../services/internetIdentityService.js';
import apiService from '../../services/apiService.js';
import { getCurrentTenant, extractRoleString } from '../../utils/tenantUtils.js';

// Authentication states
const AUTH_STATES = {
  LOADING: 'loading',
  UNAUTHENTICATED: 'unauthenticated',
  AUTHENTICATED: 'authenticated',
  LINKING_REQUIRED: 'linking_required',
  LINKED: 'linked',
  ERROR: 'error'
};

// Authentication actions
const AUTH_ACTIONS = {
  SET_LOADING: 'set_loading',
  SET_AUTHENTICATED: 'set_authenticated',
  SET_LINKING_REQUIRED: 'set_linking_required',
  SET_LINKED: 'set_linked',
  SET_USER_LINKED: 'set_user_linked',
  SET_ERROR: 'set_error',
  SET_SUCCESS: 'set_success',
  CLEAR_ERROR: 'clear_error',
  LOGOUT: 'logout'
};

// Initial state
const initialState = {
  authState: AUTH_STATES.LOADING,
  isAuthenticated: false,
  isLinked: false,
  user: null,
  principal: null,
  error: null,
  successMessage: null
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        authState: AUTH_STATES.LOADING,
        error: null
      };

    case AUTH_ACTIONS.SET_AUTHENTICATED:
      return {
        ...state,
        authState: AUTH_STATES.AUTHENTICATED,
        isAuthenticated: true,
        principal: action.payload.principal,
        error: null
      };

    case AUTH_ACTIONS.SET_LINKING_REQUIRED:
      return {
        ...state,
        authState: AUTH_STATES.LINKING_REQUIRED,
        isAuthenticated: true,
        isLinked: false,
        error: null
      };

    case AUTH_ACTIONS.SET_LINKED:
      return {
        ...state,
        authState: AUTH_STATES.LINKED,
        user: action.payload.user,
        isLinked: true,
        error: null
      };

    case AUTH_ACTIONS.SET_USER_LINKED:
      return {
        ...state,
        authState: AUTH_STATES.LINKED,
        isAuthenticated: true,
        isLinked: true,
        principal: action.payload.principal,
        user: action.payload.user,
        error: null
      };

    case AUTH_ACTIONS.SET_SUCCESS:
      return {
        ...state,
        error: null,
        successMessage: action.payload
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        authState: AUTH_STATES.ERROR,
        error: action.payload,
        isAuthenticated: false,
        isLinked: false
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        authState: AUTH_STATES.UNAUTHENTICATED
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Initialize authentication
  const initializeAuth = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING });

      // Check if user is already authenticated with Internet Identity
      const isAuthenticated = await internetIdentityService.isAuthenticated();
      
      if (isAuthenticated) {
        const identity = await internetIdentityService.getIdentity();
        const principal = identity.getPrincipal();
        const principalString = principal.toString();

        dispatch({
          type: AUTH_ACTIONS.SET_AUTHENTICATED,
          payload: { principal: principalString }
        });

        // Check if this principal is linked to a pre-provisioned user
        await checkUserLinking(principalString);
      } else {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Authentication initialization failed'
      });
    }
  };

  // Check if user is linked to pre-provisioned account
  const checkUserLinking = async (principalString) => {
    try {
      console.log('Checking user linking for principal:', principalString);
      
      // First check if we have a valid tenant context
      const tenant = getCurrentTenant();
      if (!tenant.tenantId) {
        console.warn('No tenant detected. Cannot check user linking.');
        dispatch({ type: AUTH_ACTIONS.SET_LINKING_REQUIRED });
        return;
      }

      console.log('Using tenant:', tenant.tenantId);

      // Call backend to check if this principal is linked to a user
      const response = await apiService.getUserByPrincipal(principalString);
      
      console.log('getUserByPrincipal response:', response);
      
      if (response && response.user && response.user.isLinked) {
        // Store principal with user data for session validation
        const userWithPrincipal = {
          ...response.user,
          principal: principalString
        };
        
        console.log('User is linked, setting authenticated state:', userWithPrincipal);
        
        dispatch({
          type: AUTH_ACTIONS.SET_LINKED,
          payload: { user: userWithPrincipal }
        });
      } else {
        // User needs to link their II to a pre-provisioned account
        console.log('User needs to link account');
        dispatch({ type: AUTH_ACTIONS.SET_LINKING_REQUIRED });
      }
    } catch (error) {
      console.error('Failed to check user linking:', error);
      // If user doesn't exist or API call fails, they need to link
      dispatch({ type: AUTH_ACTIONS.SET_LINKING_REQUIRED });
    }
  };

  // Login with Internet Identity
  const login = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING });
      
      // Step 1: Authenticate with Internet Identity
      await internetIdentityService.login();
      
      // Get the authenticated identity
      const identity = await internetIdentityService.getIdentity();
      const principal = identity.getPrincipal();
      const principalString = principal.toString();

      console.log('Internet Identity login successful:', principalString);

      // Step 2: Check if principal exists in tenant users
      const principalCheck = await apiService.checkPrincipalExists(principalString);
      
      if (principalCheck.exists && principalCheck.isLinked) {
        // Step 3a: Principal exists and is linked - get user data and set authenticated
        console.log('Principal exists and is linked, getting user data...');
        const userData = await apiService.getUserByPrincipal(principalString);
        
        if (userData && userData.user) {
          dispatch({
            type: AUTH_ACTIONS.SET_USER_LINKED,
            payload: {
              principal: principalString,
              user: userData.user
            }
          });
          
          console.log('Authentication successful, user:', userData.user);
          return { success: true, redirect: 'role-based', user: userData.user };
        } else {
          throw new Error('Failed to get user data despite linked principal');
        }
      } else {
        // Step 3b: Principal not found or not linked - set as authenticated but needs linking
        console.log('Principal not found or not linked, needs to link account');
        dispatch({
          type: AUTH_ACTIONS.SET_LINKING_REQUIRED,
          payload: { principal: principalString }
        });
        
        return { success: true, redirect: 'link-account', needsLinking: true };
      }
      
    } catch (error) {
      console.error('Login failed:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Login failed'
      });
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  // Verify email and send OTP
  const verifyEmailAndSendOTP = async (universityId, email) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING });
      
      if (!state.principal) {
        throw new Error('Not authenticated with Internet Identity');
      }
      
      // Check if email is pre-provisioned and send OTP
      const response = await apiService.verifyEmailAndSendOTP(universityId, email);
      
      if (response.success && response.isPreprovisioned) {
        // OTP sent successfully
        dispatch({
          type: AUTH_ACTIONS.SET_SUCCESS,
          payload: response.message
        });
        return { success: true, message: response.message };
      } else {
        // Email not pre-provisioned
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: response.message
        });
        return { success: false, error: response.message };
      }
      
    } catch (error) {
      console.error('Email verification failed:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Email verification failed'
      });
      return { success: false, error: error.message || 'Email verification failed' };
    }
  };

  // Verify OTP and complete linking
  const verifyOTPAndLink = async (universityId, email, otp) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING });
      
      if (!state.principal) {
        throw new Error('Not authenticated with Internet Identity');
      }
      
      // Verify OTP
      const otpResponse = await apiService.verifyOTP(universityId, email, otp);
      
      if (otpResponse.success) {
        // OTP verified, now link the principal to the user
        const linkResponse = await apiService.linkPrincipalToUser(
          state.principal,
          universityId,
          email,
          otpResponse.userInfo
        );
        
        if (linkResponse.success) {
          // Successfully linked, update auth state
          dispatch({
            type: AUTH_ACTIONS.SET_USER_LINKED,
            payload: {
              principal: state.principal,
              user: linkResponse.linkedUser
            }
          });
          
          return { 
            success: true, 
            user: linkResponse.linkedUser,
            message: 'Account successfully linked!'
          };
        } else {
          throw new Error('Failed to link account after OTP verification');
        }
      } else {
        // Invalid OTP
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: otpResponse.message
        });
        return { success: false, error: otpResponse.message };
      }
      
    } catch (error) {
      console.error('OTP verification failed:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'OTP verification failed'
      });
      return { success: false, error: error.message || 'OTP verification failed' };
    }
  };

  // Verify university credentials (for account linking)
  const verifyUniversityCredentials = async (universityId, email) => {
    try {
      const response = await apiService.verifyUniversityCredentials(universityId, email);
      return response;
    } catch (error) {
      console.error('Credential verification failed:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await internetIdentityService.logout();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if logout fails
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Get user role for navigation
  const getUserRole = () => {
    return extractRoleString(state.user?.role);
  };

  // Check if user has specific role
  const hasRole = (role) => {
    const userRole = extractRoleString(state.user?.role);
    return userRole === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    const userRole = extractRoleString(state.user?.role);
    return roles.includes(userRole);
  };

  // Get portal path based on user role
  const getPortalPath = () => {
    const role = getUserRole();
    switch (role) {
      case 'Student':
        return '/student';
      case 'Instructor':
        return '/instructor';
      case 'TenantAdmin':
        return '/tenant-admin';
      default:
        return '/login';
    }
  };

  const contextValue = {
    // State
    authState: state.authState,
    isAuthenticated: state.isAuthenticated,
    isLinked: state.isLinked,
    user: state.user,
    principal: state.principal,
    error: state.error,
    successMessage: state.successMessage,
    
    // Actions
    login,
    logout,
    verifyEmailAndSendOTP,
    verifyOTPAndLink,
    verifyUniversityCredentials,
    clearError,
    
    // Utilities
    getUserRole,
    hasRole,
    hasAnyRole,
    getPortalPath
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export constants
export { AUTH_STATES, AUTH_ACTIONS };
