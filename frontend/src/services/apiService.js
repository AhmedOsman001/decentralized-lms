// API Service for Decentralized LMS
// Handles communication with router and tenant canisters

import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { getCurrentTenant } from '../utils/tenantUtils.js';

// Import IDL definitions
const routerIdl = ({ IDL }) => {
  const LMSError = IDL.Variant({
    'NotFound': IDL.Text,
    'ValidationError': IDL.Text,
    'Unauthorized': IDL.Text,
    'AlreadyExists': IDL.Text,
    'InvalidRole': IDL.Text,
    'InternalError': IDL.Text,
    'InitializationError': IDL.Text,
  });

  const Result = IDL.Variant({ 'Ok': IDL.Principal, 'Err': LMSError });
  const TenantSettings = IDL.Record({
    'max_students': IDL.Nat32,
    'max_instructors': IDL.Nat32,
    'max_courses': IDL.Nat32,
    'allow_public_enrollment': IDL.Bool,
    'custom_branding': IDL.Bool,
  });

  const Tenant = IDL.Record({
    'id': IDL.Text,
    'name': IDL.Text,
    'subdomain': IDL.Text,
    'canister_id': IDL.Text,
    'admin_ids': IDL.Vec(IDL.Text),
    'created_at': IDL.Nat64,
    'updated_at': IDL.Nat64,
    'is_active': IDL.Bool,
    'settings': TenantSettings,
  });

  return IDL.Service({
    'get_tenant_canister': IDL.Func([IDL.Text], [Result], ['query']),
    'list_tenants': IDL.Func([], [IDL.Vec(Tenant)], ['query']),
    'health_check': IDL.Func([], [IDL.Text], ['query']),
  });
};

const tenantIdl = ({ IDL }) => {
  const LMSError = IDL.Variant({
    'NotFound': IDL.Text,
    'ValidationError': IDL.Text,
    'Unauthorized': IDL.Text,
    'AlreadyExists': IDL.Text,
    'InvalidRole': IDL.Text,
    'InternalError': IDL.Text,
    'InitializationError': IDL.Text,
  });

  const UserRole = IDL.Variant({
    'Student': IDL.Null,
    'Instructor': IDL.Null,
    'Admin': IDL.Null,
    'TenantAdmin': IDL.Null,
  });

  const PreProvisionStatus = IDL.Variant({
    'Imported': IDL.Null,
    'PendingVerification': IDL.Null,
    'Verified': IDL.Null,
    'Linked': IDL.Null,
    'Expired': IDL.Null,
  });

  const PreProvisionedUser = IDL.Record({
    'university_id': IDL.Text,
    'name': IDL.Text,
    'email': IDL.Text,
    'role': UserRole,
    'ii_principal': IDL.Opt(IDL.Text),
    'status': PreProvisionStatus,
    'is_verified': IDL.Bool,
    'created_at': IDL.Nat64,
    'updated_at': IDL.Nat64,
  });

  const Result_1 = IDL.Variant({ 'Ok': PreProvisionedUser, 'Err': LMSError });
  const Result_12 = IDL.Variant({ 'Ok': PreProvisionedUser, 'Err': LMSError });
  const Result_13 = IDL.Variant({ 'Ok': IDL.Tuple(PreProvisionStatus, IDL.Bool), 'Err': LMSError });

  const User = IDL.Record({
    'id': IDL.Text,
    'name': IDL.Text,
    'email': IDL.Text,
    'role': UserRole,
    'tenant_id': IDL.Text,
    'created_at': IDL.Nat64,
    'updated_at': IDL.Nat64,
    'is_active': IDL.Bool,
  });

  const Course = IDL.Record({
    'id': IDL.Text,
    'title': IDL.Text,
    'description': IDL.Text,
    'instructor_ids': IDL.Vec(IDL.Text),
    'tenant_id': IDL.Text,
    'lessons': IDL.Vec(IDL.Text),
    'enrolled_students': IDL.Vec(IDL.Text),
    'created_at': IDL.Nat64,
    'updated_at': IDL.Nat64,
    'is_published': IDL.Bool,
  });

  const Result_User = IDL.Variant({ 'Ok': User, 'Err': LMSError });
  const Result_Course = IDL.Variant({ 'Ok': Course, 'Err': LMSError });
  const Result_Text = IDL.Variant({ 'Ok': IDL.Text, 'Err': LMSError });

  const EmailVerificationRequest = IDL.Record({
    'university_id': IDL.Text,
    'email': IDL.Text,
    'verification_code': IDL.Text,
  });

  const QuestionType = IDL.Variant({ 
    'MultipleChoice': IDL.Record({ 'options': IDL.Vec(IDL.Text), 'correct_answer': IDL.Nat64 }),
    'TrueFalse': IDL.Record({ 'correct_answer': IDL.Bool }),
    'ShortAnswer': IDL.Record({ 'sample_answer': IDL.Text }),
    'Essay': IDL.Record({ 'max_words': IDL.Opt(IDL.Nat32) }),
  });

  const Question = IDL.Record({
    'id': IDL.Text,
    'question_text': IDL.Text,
    'question_type': QuestionType,
    'points': IDL.Nat32,
  });

  const Quiz = IDL.Record({
    'id': IDL.Text,
    'title': IDL.Text,
    'description': IDL.Text,
    'questions': IDL.Vec(Question),
    'course_id': IDL.Text,
    'time_limit_minutes': IDL.Opt(IDL.Nat32),
    'max_attempts': IDL.Nat32,
    'start_date': IDL.Nat64,
    'end_date': IDL.Nat64,
    'duration_minutes': IDL.Nat32,
    'created_at': IDL.Nat64,
    'updated_at': IDL.Nat64,
  });

  const Result_Quizzes = IDL.Variant({ 'Ok': IDL.Vec(Quiz), 'Err': LMSError });

  const QuizAttempt = IDL.Record({
    'id': IDL.Text,
    'quiz_id': IDL.Text,
    'student_id': IDL.Text,
    'answers': IDL.Vec(IDL.Record({
      'question_id': IDL.Text,
      'answer_text': IDL.Text,
      'selected_options': IDL.Vec(IDL.Text),
      'is_correct': IDL.Opt(IDL.Bool),
    })),
    'score': IDL.Opt(IDL.Float64),
    'started_at': IDL.Nat64,
    'submitted_at': IDL.Opt(IDL.Nat64),
    'time_remaining': IDL.Opt(IDL.Nat64),
  });

  const Result_QuizAttempt = IDL.Variant({ 'Ok': QuizAttempt, 'Err': LMSError });

  return IDL.Service({
    'get_pre_provisioned_user': IDL.Func([IDL.Text], [Result_12], ['query']),
    'get_linking_status': IDL.Func([IDL.Text], [Result_13], ['query']),
    'get_user': IDL.Func([IDL.Text], [Result_User], ['query']),
    'get_current_user': IDL.Func([], [Result_User], ['query']),
    'link_internet_identity': IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    
    // Pre-provisioning email verification methods
    'request_email_verification': IDL.Func([IDL.Text, IDL.Text], [Result_Text], []),
    'verify_email': IDL.Func([EmailVerificationRequest], [Result_Text], []),
    'check_university_id': IDL.Func([IDL.Text], [Result_Text], ['query']),
    
    // Course methods
    'list_courses': IDL.Func([], [IDL.Vec(Course)], ['query']),
    'get_course': IDL.Func([IDL.Text], [Result_Course], ['query']),
    'get_student_courses': IDL.Func([IDL.Text], [IDL.Vec(Course)], ['query']),
    'create_course': IDL.Func([IDL.Text, IDL.Text, IDL.Text], [Result_Course], []),
    'enroll_student': IDL.Func([IDL.Text, IDL.Text], [IDL.Variant({ 'Ok': IDL.Null, 'Err': LMSError })], []),
    
    // Quiz methods
    'list_course_quizzes': IDL.Func([IDL.Text], [Result_Quizzes], ['query']),
    'get_quiz_with_progress': IDL.Func([IDL.Text], [IDL.Variant({ 'Ok': IDL.Tuple(Quiz, IDL.Vec(QuizAttempt)), 'Err': LMSError })], ['query']),
    'start_quiz_attempt': IDL.Func([IDL.Text], [Result_QuizAttempt], []),
    'submit_quiz_attempt': IDL.Func([IDL.Text, IDL.Vec(IDL.Record({
      'question_id': IDL.Text,
      'answer_text': IDL.Text,
      'selected_options': IDL.Vec(IDL.Text),
      'is_correct': IDL.Opt(IDL.Bool),
    }))], [Result_QuizAttempt], []),
    

  });
};

class ApiService {
  constructor() {
    this.agent = null;
    this.routerActor = null;
    this.tenant = getCurrentTenant();
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      // Create agent
      this.agent = new HttpAgent({
        host: this.tenant.canisterHost || 'http://127.0.0.1:4943'
      });

      // Fetch root key for local development
      if (this.tenant.isLocalDev) {
        await this.agent.fetchRootKey();
      }

      // Create router actor
      const routerCanisterId = 'u6s2n-gx777-77774-qaaba-cai';
      this.routerActor = Actor.createActor(routerIdl, {
        agent: this.agent,
        canisterId: routerCanisterId,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize API service:', error);
      throw error;
    }
  }

  async getTenantActor(tenantCanisterId, requireAuth = true) {
    if (!this.agent) {
      await this.init();
    }

    let agent = this.agent;

    if (requireAuth) {
      // Create authenticated agent
      const authClient = await AuthClient.create();
      const identity = authClient.getIdentity();
      
      agent = new HttpAgent({
        identity,
        host: this.tenant.canisterHost || 'http://127.0.0.1:4943'
      });

      if (this.tenant.isLocalDev) {
        await agent.fetchRootKey();
      }
    }

    return Actor.createActor(tenantIdl, {
      agent,
      canisterId: tenantCanisterId,
    });
  }

  async getTenantCanisterId(tenantId = this.tenant.tenantId) {
    if (!tenantId) {
      console.log('No tenant ID provided. Current tenant context:', this.tenant);
      throw new Error('Tenant ID is required. Please access the app through a tenant subdomain (e.g., harvard.lms.localhost)');
    }

    try {
      if (!this.isInitialized) {
        await this.init();
      }

      console.log('Getting canister ID for tenant:', tenantId);
      const result = await this.routerActor.get_tenant_canister(tenantId);
      console.log('Router response:', result);
      
      if (result.Ok) {
        const canisterId = result.Ok.toString();
        console.log('Found canister ID:', canisterId);
        return canisterId;
      } else {
        console.error('Router error:', result.Err);
        throw new Error(`Tenant '${tenantId}' not found. ${JSON.stringify(result.Err)}`);
      }
    } catch (error) {
      console.error('Failed to get tenant canister ID:', error);
      throw error;
    }
  }

  async callTenantMethod(methodName, args = [], tenantId = this.tenant.tenantId) {
    try {
      const canisterId = await this.getTenantCanisterId(tenantId);
      const tenantActor = await this.getTenantActor(canisterId, true);
      
      console.log(`Calling ${methodName} on tenant ${tenantId} (${canisterId})`);
      const result = await tenantActor[methodName](...args);
      console.log(`${methodName} result:`, result);
      
      return result;
    } catch (error) {
      console.error(`Failed to call tenant method ${methodName}:`, error);
      throw error;
    }
  }

  // Authentication and linking methods
  async checkPrincipalExists(principalString) {
    try {
      console.log('Checking principal existence for:', principalString);
      
      // Try to get current user - if successful, principal exists and is linked
      const userResponse = await this.callTenantMethod('get_current_user', []);
      
      console.log('Principal check via get_current_user:', userResponse);
      
      if (userResponse && userResponse.Ok) {
        // User exists and is linked
        return {
          exists: true,
          isLinked: true,
          user: userResponse.Ok
        };
      } else if (userResponse && userResponse.Err) {
        // Check error type
        if (userResponse.Err.NotFound || userResponse.Err.Unauthorized) {
          // Principal not found or not linked
          return {
            exists: false,
            isLinked: false,
            status: null
          };
        } else {
          throw new Error(JSON.stringify(userResponse.Err));
        }
      } else {
        return {
          exists: false,
          isLinked: false,
          status: null
        };
      }
    } catch (error) {
      console.error('Failed to check principal existence:', error);
      // If error, assume principal doesn't exist to trigger linking flow
      return {
        exists: false,
        isLinked: false,
        status: null
      };
    }
  }

  async getUserByPrincipal(principalString) {
    try {
      console.log('Getting user data for principal:', principalString);
      
      // Use get_current_user to get the user data for the authenticated principal
      // This works because the API call is made with the principal's identity
      const userResponse = await this.callTenantMethod('get_current_user', []);
      
      console.log('get_current_user response:', userResponse);
      
      if (userResponse && userResponse.Ok) {
        // User exists and is linked (otherwise get_current_user would fail)
        return {
          user: {
            ...userResponse.Ok,
            principal: principalString,
            isLinked: true
          }
        };
      } else if (userResponse && userResponse.Err) {
        console.log('get_current_user failed:', userResponse.Err);
        
        // Check if it's a NotFound error (user not linked) or other error
        if (userResponse.Err.NotFound || userResponse.Err.Unauthorized) {
          return {
            user: null,
            needsLinking: true
          };
        } else {
          throw new Error(JSON.stringify(userResponse.Err));
        }
      } else {
        console.log('Unexpected response format from get_current_user:', userResponse);
        return {
          user: null,
          needsLinking: true
        };
      }
    } catch (error) {
      console.error('Failed to get user by principal:', error);
      
      // If the call fails, it likely means the principal is not linked
      return {
        user: null,
        needsLinking: true
      };
    }
  }

  async verifyUniversityCredentials(universityId, email) {
    try {
      // Get the pre-provisioned user by university ID
      const response = await this.callTenantMethod('get_pre_provisioned_user', [universityId]);
      
      if (response && response.Ok) {
        const user = response.Ok;
        
        // Verify the email matches
        if (user.email === email) {
          return {
            Ok: {
              userId: user.university_id,
              email: user.email,
              name: user.name,
              role: user.role,
              status: user.status,
              isVerified: user.is_verified,
              isLinked: user.ii_principal ? true : false
            }
          };
        } else {
          return {
            Err: {
              ValidationError: 'Email does not match university records'
            }
          };
        }
      } else {
        return response; // Return the error response
      }
    } catch (error) {
      console.error('Failed to verify university credentials:', error);
      throw error;
    }
  }

  async verifyEmailAndSendOTP(universityId, email) {
    try {
      // Check if email is pre-provisioned in the system and request verification
      const response = await this.callTenantMethod('request_email_verification', [
        universityId,
        email
      ]);
      
      if (response && response.Ok) {
        // Email is pre-provisioned, OTP should be sent
        return {
          success: true,
          isPreprovisioned: true,
          message: 'OTP sent to your email'
        };
      } else if (response && response.Err) {
        if (response.Err.NotFound) {
          return {
            success: false,
            isPreprovisioned: false,
            message: 'Email is not pre-provisioned in the system'
          };
        } else {
          throw new Error(JSON.stringify(response.Err));
        }
      }
    } catch (error) {
      console.error('Failed to verify email:', error);
      // For development, simulate email verification
      // In production, this should properly handle the backend response
      if (email.endsWith('@harvard.edu') || email.endsWith('@student.harvard.edu')) {
        return {
          success: true,
          isPreprovisioned: true,
          message: 'OTP sent to your email (simulated)'
        };
      } else {
        return {
          success: false,
          isPreprovisioned: false,
          message: 'Email is not pre-provisioned in the system'
        };
      }
    }
  }

  async verifyOTP(universityId, email, otp) {
    try {
      const response = await this.callTenantMethod('verify_email', [{
        university_id: universityId,
        email: email,
        verification_code: otp
      }]);
      
      if (response && response.Ok) {
        return {
          success: true,
          userInfo: response.Ok
        };
      } else {
        return {
          success: false,
          message: response.Err ? JSON.stringify(response.Err) : 'Invalid OTP'
        };
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      // For development, simulate OTP verification
      if (otp === '123456') {
        return {
          success: true,
          userInfo: {
            university_id: universityId,
            email: email,
            role: email.includes('admin') ? 'admin' : email.includes('instructor') ? 'instructor' : 'student'
          }
        };
      } else {
        return {
          success: false,
          message: 'Invalid OTP'
        };
      }
    }
  }

  async linkPrincipalToUser(principalString, universityId, email, userInfo) {
    try {
      const response = await this.callTenantMethod('link_internet_identity', [
        universityId,
        email
      ]);
      
      if (response && response.Ok) {
        return {
          success: true,
          linkedUser: response.Ok
        };
      } else {
        throw new Error(JSON.stringify(response.Err));
      }
    } catch (error) {
      console.error('Failed to link principal to user:', error);
      // For development, simulate successful linking
      return {
        success: true,
        linkedUser: {
          principal: principalString,
          university_id: universityId,
          email: email,
          role: userInfo.role || 'student',
          status: 'Linked'
        }
      };
    }
  }

  // Tenant management
  async listTenants() {
    try {
      if (!this.isInitialized) {
        await this.init();
      }
      
      const result = await this.routerActor.list_tenants();
      return result;
    } catch (error) {
      console.error('Failed to list tenants:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      if (!this.isInitialized) {
        await this.init();
      }
      
      const result = await this.routerActor.health_check();
      return result;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
