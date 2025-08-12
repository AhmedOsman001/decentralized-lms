// Grade Validation Module
// Contains all validation logic for grade operations

use shared::{Grade, GradeType, LMSError, LMSResult};
use crate::storage::{GRADES, COURSES, USERS};
use ic_cdk::caller;
use crate::rbac::is_admin;
use super::types::BulkGradeEntry;

/// Enhanced permission validation for grading operations
pub fn validate_grading_permissions(course_id: &str) -> LMSResult<()> {
    let caller_id = caller().to_string();
    
    // Admin always has permission
    if is_admin() {
        return Ok(());
    }
    
    // Check if caller is instructor for this course
    COURSES.with(|courses| {
        match courses.borrow().get(&course_id.to_string()) {
            Some(course) => {
                if course.instructor_ids.contains(&caller_id) {
                    Ok(())
                } else {
                    Err(LMSError::Unauthorized("Only course instructors or admins can manage grades".to_string()))
                }
            }
            None => Err(LMSError::NotFound("Course not found".to_string()))
        }
    })
}

/// Comprehensive grade input validation
pub fn validate_grade_input(
    student_id: &str,
    course_id: &str,
    score: f64,
    max_score: f64,
) -> LMSResult<()> {
    // Validate student exists and is enrolled
    USERS.with(|users| {
        match users.borrow().get(&student_id.to_string()) {
            Some(user) => {
                if !user.is_active {
                    return Err(LMSError::ValidationError("Student account is inactive".to_string()));
                }
                Ok(())
            }
            None => Err(LMSError::NotFound("Student not found".to_string()))
        }
    })?;
    
    // Validate course exists
    COURSES.with(|courses| {
        match courses.borrow().get(&course_id.to_string()) {
            Some(_) => Ok(()),
            None => Err(LMSError::NotFound("Course not found".to_string()))
        }
    })?;
    
    // Validate score ranges
    validate_score_range(score, max_score)?;
    
    Ok(())
}

/// Validate score range with extra credit allowance
pub fn validate_score_range(score: f64, max_score: f64) -> LMSResult<()> {
    if max_score <= 0.0 {
        return Err(LMSError::ValidationError("Max score must be greater than 0".to_string()));
    }
    
    if score < 0.0 {
        return Err(LMSError::ValidationError("Score cannot be negative".to_string()));
    }
    
    if score > max_score * 1.1 { // Allow 10% extra credit
        return Err(LMSError::ValidationError("Score exceeds maximum allowed (including extra credit)".to_string()));
    }
    
    Ok(())
}

/// Check for duplicate grades to prevent accidental double-grading
pub fn check_duplicate_grade(
    student_id: &str,
    course_id: &str,
    grade_type: &GradeType,
) -> LMSResult<()> {
    // For assignments and participation, duplicates might be allowed
    // For finals and midterms, typically only one is allowed
    match grade_type {
        GradeType::Final => {
            let existing = GRADES.with(|grades| {
                grades.borrow().iter().any(|(_, grade)| {
                    grade.student_id == student_id &&
                    grade.course_id == course_id &&
                    grade.grade_type == GradeType::Final
                })
            });
            
            if existing {
                return Err(LMSError::ValidationError("Final grade already exists for this student".to_string()));
            }
        }
        _ => {} // Allow duplicates for other types
    }
    
    Ok(())
}

/// Validate quiz context for quiz grades
pub fn validate_quiz_grade_context(quiz_id: &str, course_id: &str) -> LMSResult<()> {
    // This would check if quiz exists and belongs to the course
    // Implementation depends on quiz storage structure
    crate::storage::QUIZZES.with(|quizzes| {
        match quizzes.borrow().get(&quiz_id.to_string()) {
            Some(quiz) => {
                // Verify quiz belongs to this course
                if quiz.course_id == course_id {
                    Ok(())
                } else {
                    Err(LMSError::ValidationError("Quiz does not belong to this course".to_string()))
                }
            }
            None => Err(LMSError::NotFound("Quiz not found".to_string()))
        }
    })
}

/// Validate permissions for modifying specific grade
pub fn validate_grade_modification_permissions(grade: &Grade) -> LMSResult<()> {
    validate_grading_permissions(&grade.course_id)?;
    
    // Additional checks could include:
    // - Time limits for grade modifications
    // - Whether final grades can be modified
    // - Student consent requirements
    
    Ok(())
}

/// Validate bulk grade entry
pub fn validate_bulk_grade_entry(entry: &BulkGradeEntry) -> LMSResult<()> {
    validate_grade_input(&entry.student_id, &entry.course_id, entry.score, entry.max_score)?;
    
    if entry.max_score <= 0.0 {
        return Err(LMSError::ValidationError("Max score must be positive".to_string()));
    }
    
    Ok(())
}
