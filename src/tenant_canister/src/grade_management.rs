// Grade Management Module - Refactored for Better Organization
// This file now acts as a re-export facade for the modularized grade system

// Re-export all public APIs from the grade module
pub use crate::grade::{
    // Core operations - essential grade functions
    record_grade,
    record_quiz_grade, 
    update_grade,
    get_student_grades,
    get_course_grades,
    get_grade,
    delete_grade,
    
    // Grade calculations - core averaging functions
    calculate_weighted_course_average,
    calculate_course_average,
    get_course_grades_with_stats,
    bulk_import_grades

};
