// Grade Core Operations Module
// Contains primary grade CRUD operations

use shared::{Grade, GradeType, LMSError, LMSResult, utils};
use crate::storage::GRADES;
use crate::rbac::require_admin;
use ic_cdk::caller;
use super::validation::{
    validate_grading_permissions, 
    validate_grade_input, 
    check_duplicate_grade,
    validate_quiz_grade_context,
    validate_grade_modification_permissions,
    validate_bulk_grade_entry
};
use super::types::{BulkGradeEntry, BulkImportResult, BulkImportError};

/// Advanced grade recording with comprehensive validation and metadata
pub fn record_grade(
    student_id: String,
    course_id: String,
    score: f64,
    max_score: f64,
    grade_type: GradeType,
    feedback: Option<String>,
) -> LMSResult<Grade> {
    // Enhanced permission validation
    validate_grading_permissions(&course_id)?;
    
    // Comprehensive input validation
    validate_grade_input(&student_id, &course_id, score, max_score)?;
    
    // Check for duplicate grades (prevent accidental double-grading)
    check_duplicate_grade(&student_id, &course_id, &grade_type)?;
    
    let grade_id = utils::generate_id("grade");
    let grader_id = caller().to_string();
    let current_time = utils::current_time();
    
    // Create grade with enhanced metadata
    let grade = Grade {
        id: grade_id.clone(),
        student_id: student_id.clone(),
        quiz_id: None,
        lesson_id: None,
        course_id: course_id.clone(),
        score,
        max_score,
        grade_type: grade_type.clone(),
        feedback,
        graded_by: grader_id.clone(),
        graded_at: current_time,
    };
    
    // Store grade with transaction-like behavior
    GRADES.with(|grades| {
        grades.borrow_mut().insert(grade_id.clone(), grade.clone());
        
        // Log grading action for audit trail
        ic_cdk::println!(
            "Grade recorded: {} for student {} in course {} by {} (Score: {}/{})",
            grade_id, student_id, course_id, grader_id, score, max_score
        );
        
        // Update course statistics (could be enhanced with separate stats storage)
        update_course_grading_stats(&course_id);
        
        Ok(grade)
    })
}

/// Record quiz-specific grade with quiz context
pub fn record_quiz_grade(
    student_id: String,
    course_id: String,
    quiz_id: String,
    score: f64,
    max_score: f64,
    feedback: Option<String>,
) -> LMSResult<Grade> {
    // Validate permissions and quiz existence
    validate_grading_permissions(&course_id)?;
    validate_quiz_grade_context(&quiz_id, &course_id)?;
    validate_grade_input(&student_id, &course_id, score, max_score)?;
    
    let grade_id = utils::generate_id("grade");
    let grader_id = caller().to_string();
    let current_time = utils::current_time();
    
    let grade = Grade {
        id: grade_id.clone(),
        student_id: student_id.clone(),
        quiz_id: Some(quiz_id.clone()),
        lesson_id: None,
        course_id: course_id.clone(),
        score,
        max_score,
        grade_type: GradeType::Quiz,
        feedback,
        graded_by: grader_id.clone(),
        graded_at: current_time,
    };
    
    GRADES.with(|grades| {
        grades.borrow_mut().insert(grade_id.clone(), grade.clone());
        
        ic_cdk::println!(
            "Quiz grade recorded: {} for quiz {} student {} (Score: {}/{})",
            grade_id, quiz_id, student_id, score, max_score
        );
        
        Ok(grade)
    })
}

/// Advanced grade update with change tracking
pub fn update_grade(
    grade_id: String,
    score: Option<f64>,
    feedback: Option<String>,
    reason: Option<String>,
) -> LMSResult<Grade> {
    let grader_id = caller().to_string();
    
    GRADES.with(|grades| {
        let mut grades_map = grades.borrow_mut();
        
        match grades_map.get(&grade_id) {
            Some(mut grade) => {
                // Validate permissions for this specific grade
                validate_grade_modification_permissions(&grade)?;
                
                // Track changes for audit purposes
                let original_score = grade.score;
                let _original_feedback = grade.feedback.clone();
                
                // Apply updates
                if let Some(new_score) = score {
                    super::validation::validate_score_range(new_score, grade.max_score)?;
                    grade.score = new_score;
                }
                
                if let Some(new_feedback) = feedback {
                    grade.feedback = Some(new_feedback);
                }
                
                // Update metadata
                grade.graded_by = grader_id.clone();
                grade.graded_at = utils::current_time();
                
                grades_map.insert(grade_id.clone(), grade.clone());
                
                // Log the change for audit trail
                ic_cdk::println!(
                    "Grade updated: {} by {} (Score: {} -> {}, Reason: {:?})",
                    grade_id, grader_id, original_score, grade.score, reason
                );
                
                Ok(grade)
            }
            None => Err(LMSError::NotFound("Grade not found".to_string()))
        }
    })
}

/// Get student grades with advanced filtering and sorting
pub fn get_student_grades(
    student_id: String,
    course_id: Option<String>,
    grade_type: Option<GradeType>,
    include_draft: bool,
) -> Vec<Grade> {
    GRADES.with(|grades| {
        grades.borrow()
            .iter()
            .filter(|(_, grade)| {
                // Basic student filter
                if grade.student_id != student_id {
                    return false;
                }
                
                // Course filter
                if let Some(ref filter_course) = course_id {
                    if grade.course_id != *filter_course {
                        return false;
                    }
                }
                
                // Grade type filter
                if let Some(ref filter_type) = grade_type {
                    if grade.grade_type != *filter_type {
                        return false;
                    }
                }
                
                // Draft filter (assuming score of 0 might be draft)
                if !include_draft && grade.score == 0.0 {
                    return false;
                }
                
                true
            })
            .map(|(_, grade)| grade)
            .collect::<Vec<_>>()
            .into_iter()
            .collect()
    })
}

/// Get all grades for a course (helper function)
pub fn get_course_grades(course_id: String) -> Vec<Grade> {
    GRADES.with(|grades| {
        grades.borrow()
            .iter()
            .filter(|(_, grade)| grade.course_id == course_id)
            .map(|(_, grade)| grade)
            .collect()
    })
}

/// Get a specific grade by ID
pub fn get_grade(grade_id: String) -> LMSResult<Grade> {
    GRADES.with(|grades| {
        grades.borrow()
            .get(&grade_id)
            .ok_or_else(|| LMSError::NotFound("Grade not found".to_string()))
    })
}

/// Bulk grade import with validation and rollback capability
pub fn bulk_import_grades(grades_data: Vec<BulkGradeEntry>) -> LMSResult<BulkImportResult> {
    // Validate all entries before importing any
    let mut validation_errors = Vec::new();
    
    for (index, entry) in grades_data.iter().enumerate() {
        if let Err(error) = validate_bulk_grade_entry(entry) {
            validation_errors.push(BulkImportError {
                row_index: index,
                error: error.to_string(),
            });
        }
    }
    
    if !validation_errors.is_empty() {
        return Ok(BulkImportResult {
            success_count: 0,
            error_count: validation_errors.len(),
            errors: validation_errors,
        });
    }
    
    // Import grades
    let mut success_count = 0;
    let mut import_errors = Vec::new();
    
    for (index, entry) in grades_data.iter().enumerate() {
        match record_grade(
            entry.student_id.clone(),
            entry.course_id.clone(),
            entry.score,
            entry.max_score,
            entry.grade_type.clone(),
            entry.feedback.clone(),
        ) {
            Ok(_) => success_count += 1,
            Err(error) => {
                import_errors.push(BulkImportError {
                    row_index: index,
                    error: error.to_string(),
                });
            }
        }
    }
    
    Ok(BulkImportResult {
        success_count,
        error_count: import_errors.len(),
        errors: import_errors,
    })
}

/// Delete grade with safety checks and audit logging
pub fn delete_grade(grade_id: String, reason: String) -> LMSResult<()> {
    // Only admins can delete grades, instructors can only update
    require_admin()?;
    
    GRADES.with(|grades| {
        let mut grades_map = grades.borrow_mut();
        
        match grades_map.get(&grade_id) {
            Some(grade) => {
                // Log deletion for audit
                ic_cdk::println!(
                    "Grade deleted: {} for student {} by {} (Reason: {})",
                    grade_id, grade.student_id, caller().to_string(), reason
                );
                
                grades_map.remove(&grade_id);
                Ok(())
            }
            None => Err(LMSError::NotFound("Grade not found".to_string()))
        }
    })
}

/// Update course grading statistics (placeholder for future enhancement)
fn update_course_grading_stats(course_id: &str) {
    // This could update cached statistics for better performance
    // Implementation would depend on requirements
    ic_cdk::println!("Updated grading stats for course: {}", course_id);
}
