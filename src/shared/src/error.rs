use candid::CandidType;
use serde::{Deserialize, Serialize};
use std::fmt;

/// Common error types used across the LMS platform
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub enum LMSError {
    NotFound(String),
    Unauthorized(String),
    ValidationError(String),
    InternalError(String),
    AlreadyExists(String),
    InvalidRole(String),
    InitializationError(String),
    // Enhanced RBAC Error Types
    AccessDenied(String),
    InsufficientPermissions(String),
    UserNotAuthenticated(String),
    RoleNotFound(String),
    InvalidRoleAssignment(String),
}

/// Result type alias for common LMS operations
pub type LMSResult<T> = Result<T, LMSError>;

impl LMSError {
    /// Helper to create unauthorized access error
    pub fn unauthorized_access(action: &str, required_role: &str) -> Self {
        LMSError::AccessDenied(format!(
            "Access denied: '{}' requires '{}' role or higher",
            action, required_role
        ))
    }
    
    /// Helper to create user not found error
    pub fn user_not_found(user_id: &str) -> Self {
        LMSError::NotFound(format!("User '{}' not found in tenant", user_id))
    }
    
    /// Helper to create authentication required error
    pub fn authentication_required(action: &str) -> Self {
        LMSError::UserNotAuthenticated(format!(
            "Authentication required for action: '{}'", action
        ))
    }
}

impl fmt::Display for LMSError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LMSError::NotFound(msg) => write!(f, "Not found: {}", msg),
            LMSError::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
            LMSError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            LMSError::InternalError(msg) => write!(f, "Internal error: {}", msg),
            LMSError::AlreadyExists(msg) => write!(f, "Already exists: {}", msg),
            LMSError::InvalidRole(msg) => write!(f, "Invalid role: {}", msg),
            LMSError::InitializationError(msg) => write!(f, "Initialization error: {}", msg),
            LMSError::AccessDenied(msg) => write!(f, "Access denied: {}", msg),
            LMSError::InsufficientPermissions(msg) => write!(f, "Insufficient permissions: {}", msg),
            LMSError::UserNotAuthenticated(msg) => write!(f, "User not authenticated: {}", msg),
            LMSError::RoleNotFound(msg) => write!(f, "Role not found: {}", msg),
            LMSError::InvalidRoleAssignment(msg) => write!(f, "Invalid role assignment: {}", msg),
        }
    }
}
