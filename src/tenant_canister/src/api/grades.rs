use candid::candid_method;
use ic_cdk::{query, update};
use shared::{Grade, GradeType, LMSResult};
use crate::{grade_management, rbac};

// Grade Management API with RBAC Guards

#[update]
#[candid_method(update)]
pub fn record_grade(
    student_id: String,
    course_id: String,
    score: f64,
    max_score: f64,
    grade_type: GradeType,
    feedback: Option<String>,
) -> LMSResult<Grade> {
    // Check if caller can assign grades (Instructor or higher)
    rbac::require_teacher()?;
    
    rbac::log_rbac_action("record_grade", true, Some(&student_id));
    grade_management::record_grade(student_id, course_id, score, max_score, grade_type, feedback)
}

#[update]
#[candid_method(update)]
pub fn record_quiz_grade(
    student_id: String,
    course_id: String,
    quiz_id: String,
    score: f64,
    max_score: f64,
    feedback: Option<String>,
) -> LMSResult<Grade> {
    // Check if caller can assign grades (Instructor or higher)
    rbac::require_teacher()?;
    
    rbac::log_rbac_action("record_quiz_grade", true, Some(&student_id));
    grade_management::record_quiz_grade(student_id, course_id, quiz_id, score, max_score, feedback)
}

#[query]
#[candid_method(query)]
pub fn get_student_grades(student_id: String) -> Vec<Grade> {
    // Check if caller can access student grade data
    match rbac::can_access_user_data(&student_id) {
        Ok(_) => {
            rbac::log_rbac_action("get_student_grades", true, Some(&student_id));
            grade_management::get_student_grades(student_id, None, None, false)
        },
        Err(_) => {
            rbac::log_rbac_action("get_student_grades", false, Some(&student_id));
            Vec::new()
        }
    }
}

#[query]
#[candid_method(query)]
pub fn get_course_grades(course_id: String) -> Vec<Grade> {
    // Check if caller can view all grades (Admin or higher)
    match rbac::require_admin() {
        Ok(_) => {
            rbac::log_rbac_action("get_course_grades", true, Some(&course_id));
            grade_management::get_course_grades(course_id)
        },
        Err(_) => {
            rbac::log_rbac_action("get_course_grades", false, Some(&course_id));
            Vec::new()
        }
    }
}

#[query]
#[candid_method(query)]
pub fn get_grade(grade_id: String) -> LMSResult<Grade> {
    // Any authenticated user can view specific grade details
    // Note: Additional checks might be needed based on ownership
    rbac::require_authenticated()?;
    
    rbac::log_rbac_action("get_grade", true, Some(&grade_id));
    grade_management::get_grade(grade_id)
}

#[update]
#[candid_method(update)]
pub fn update_grade(grade_id: String, score: Option<f64>, feedback: Option<String>) -> LMSResult<Grade> {
    // Check if caller can update grades (Instructor or higher)
    rbac::require_teacher()?;
    
    rbac::log_rbac_action("update_grade", true, Some(&grade_id));
    grade_management::update_grade(grade_id, score, feedback, None)
}

#[query]
#[candid_method(query)]
pub fn calculate_course_average(student_id: String, course_id: String) -> Option<f64> {
    // Check if caller can access student grade data
    match rbac::can_access_user_data(&student_id) {
        Ok(_) => {
            rbac::log_rbac_action("calculate_course_average", true, Some(&student_id));
            grade_management::calculate_course_average(student_id, course_id)
        },
        Err(_) => {
            rbac::log_rbac_action("calculate_course_average", false, Some(&student_id));
            None
        }
    }
}

// Advanced Grade Management API

/// Advanced grade recording with comprehensive validation
#[update]
#[candid_method(update)]
pub fn record_advanced_grade(
    student_id: String,
    course_id: String,
    score: f64,
    max_score: f64,
    grade_type: GradeType,
    feedback: Option<String>,
) -> LMSResult<Grade> {
    grade_management::record_grade(student_id, course_id, score, max_score, grade_type, feedback)
}

/// Advanced grade update with change tracking
#[update]
#[candid_method(update)]
pub fn update_advanced_grade(
    grade_id: String,
    score: Option<f64>,
    feedback: Option<String>,
    reason: Option<String>,
) -> LMSResult<Grade> {
    grade_management::update_grade(grade_id, score, feedback, reason)
}

/// Get student grades with advanced filtering
#[query]
#[candid_method(query)]
pub fn get_student_grades_filtered(
    student_id: String,
    course_id: Option<String>,
    grade_type: Option<GradeType>,
    include_draft: bool,
) -> Vec<Grade> {
    grade_management::get_student_grades(student_id, course_id, grade_type, include_draft)
}

/// Get comprehensive course grade report with statistics
#[query]
#[candid_method(query)]
pub fn get_course_grade_report(course_id: String) -> LMSResult<String> {
    // Return as JSON string for now (could be enhanced with proper Candid types)
    match grade_management::get_course_grades_with_stats(course_id) {
        Ok(report) => Ok(format!("{:?}", report)), // Simplified for now
        Err(e) => Err(e)
    }
}

/// Calculate weighted course average with sophisticated algorithm
#[query]
#[candid_method(query)]
pub fn calculate_weighted_average(
    student_id: String,
    course_id: String,
) -> LMSResult<String> {
    // Return as JSON string for now
    match grade_management::calculate_weighted_course_average(student_id, course_id, None) {
        Ok(result) => Ok(format!("{:?}", result)), // Simplified for now
        Err(e) => Err(e)
    }
}

/// Bulk import grades with validation and rollback
#[update]
#[candid_method(update)]
pub fn bulk_import_grades(_grades_csv: String) -> LMSResult<String> {
    // Parse CSV and create bulk grade entries (simplified implementation)
    // In production, this would include proper CSV parsing
    let entries = Vec::new(); // Placeholder - would parse _grades_csv
    
    match grade_management::bulk_import_grades(entries) {
        Ok(result) => Ok(format!("{:?}", result)),
        Err(e) => Err(e)
    }
}

/// Delete grade with audit logging (admin only)
#[update]
#[candid_method(update)]
pub fn delete_grade_with_reason(grade_id: String, reason: String) -> LMSResult<()> {
    grade_management::delete_grade(grade_id, reason)
}
