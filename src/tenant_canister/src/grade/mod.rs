// Grade Management Module Organization
// This module organizes grade-related functionality into focused sub-modules

pub mod core;
pub mod statistics;
pub mod validation;
pub mod types;
pub mod weights;

// Re-export main public API for backwards compatibility
pub use core::{
    record_grade, 
    record_quiz_grade, 
    update_grade, 
    get_student_grades, 
    get_course_grades, 
    get_grade, 
    bulk_import_grades, 
    delete_grade
};

pub use statistics::{
    calculate_weighted_course_average,
    calculate_course_average,
    get_course_grades_with_stats
};
