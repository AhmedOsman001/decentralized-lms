// API Module - Modular API endpoints
// This module provides all public API endpoints for the tenant canister

pub mod users;
pub mod courses;
pub mod grades;
pub mod quizzes;
pub mod system;

// Re-export all public API functions for backward compatibility
pub use users::*;
pub use courses::*;
pub use grades::*;
pub use quizzes::*;
pub use system::*;

// Re-export pre-provisioning functions
pub use crate::pre_provision::*;
