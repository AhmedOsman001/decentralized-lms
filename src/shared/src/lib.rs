// Modular shared library for Decentralized LMS
// Re-export all modules to maintain backward compatibility

pub mod error;
pub mod user;
pub mod course;
pub mod quiz;
pub mod grade;
pub mod utils;
pub mod pre_provision;
pub mod file_storage;

#[cfg(test)]
pub mod tests;

// Re-export types for backward compatibility
pub use error::{LMSError, LMSResult};
pub use user::{User, UserRole, Tenant, TenantSettings};
pub use course::{Course, Lesson, LessonType};
pub use quiz::{Quiz, Question, QuestionType, QuizAttempt, Answer};
pub use grade::{Grade, GradeType};
pub use pre_provision::{
    PreProvisionedUser, PreProvisionStatus, UniversityImportRecord,
    EmailVerificationRequest, IILinkingRequest, ImportStats
};
pub use file_storage::{
    FileMetadata, FileChunk, UploadSession, DownloadStream, FileOperationResult,
    FileStats, PrivacyLevel, OwnerType
};
pub use utils::*;
