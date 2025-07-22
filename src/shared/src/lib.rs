use candid::{CandidType, Deserialize};
use serde::Serialize;

/// Common error types used across the LMS platform
#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub enum LMSError {
    NotFound(String),
    Unauthorized(String),
    ValidationError(String),
    InternalError(String),
}

/// User representation shared across canisters
#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: UserRole,
    pub tenant_id: String,
}

/// User roles in the LMS system
#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub enum UserRole {
    Student,
    Instructor,
    Admin,
    TenantAdmin,
}

/// Course representation
#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct Course {
    pub id: String,
    pub title: String,
    pub description: String,
    pub instructor_id: String,
    pub tenant_id: String,
    pub created_at: u64,
    pub updated_at: u64,
}

/// Tenant (University) representation
#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct Tenant {
    pub id: String,
    pub name: String,
    pub domain: String,
    pub canister_id: String,
    pub created_at: u64,
    pub is_active: bool,
}

/// Utility functions
pub mod utils {
    use ic_cdk::api::time;
    
    /// Get current timestamp in nanoseconds
    pub fn current_time() -> u64 {
        time()
    }
    
    /// Generate a simple ID (in production, use more robust ID generation)
    pub fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, current_time())
    }
}

/// Result type alias for common LMS operations
pub type LMSResult<T> = Result<T, LMSError>;
