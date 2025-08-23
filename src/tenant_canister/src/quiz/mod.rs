// Quiz Management Module - Organized by Domain
// Modular architecture following Rust best practices

pub mod core;         // Core quiz operations (create, update, delete, get)
pub mod validation;   // Quiz validation logic
pub mod attempts;     // Quiz attempt management
pub mod analytics;    // Quiz analytics and statistics
pub mod types;        // Quiz-related data structures

// Re-export public API - only export what's actually used
pub use core::{create_quiz, update_quiz, delete_quiz, list_course_quizzes};
pub use attempts::{start_quiz_attempt, submit_quiz_attempt, get_quiz_with_progress};
pub use analytics::{get_quiz_analytics};
pub use validation::{validate_quiz_data};
