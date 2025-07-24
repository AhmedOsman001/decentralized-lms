use candid::CandidType;
use serde::{Deserialize, Serialize};

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
}

/// Result type alias for common LMS operations
pub type LMSResult<T> = Result<T, LMSError>;
