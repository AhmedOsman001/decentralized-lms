// Quiz Validation Logic
// Contains all validation functions for quiz operations

use ic_cdk::caller;
use shared::{Question, QuestionType, LMSResult, LMSError};
use crate::storage::{COURSES, QUIZ_ATTEMPTS};
use crate::rbac::is_admin;

/// Validate course access for quiz operations (instructor/admin only)
pub fn validate_course_access(course_id: &str) -> LMSResult<()> {
    COURSES.with(|courses| {
        match courses.borrow().get(&course_id.to_string()) {
            Some(course) => {
                let caller_id = caller().to_string();
                if course.instructor_ids.contains(&caller_id) || is_admin() {
                    Ok(())
                } else {
                    Err(LMSError::Unauthorized("No access to this course.".to_string()))
                }
            }
            None => Err(LMSError::NotFound("Course not found".to_string()))
        }
    })
}

/// Validate student enrollment for quiz access
/// Checks if the calling student is enrolled in the course containing the quiz
pub fn validate_student_enrollment(course_id: &str) -> LMSResult<()> {
    let student_id = caller().to_string();
    
    COURSES.with(|courses| {
        match courses.borrow().get(&course_id.to_string()) {
            Some(course) => {
                if course.enrolled_students.contains(&student_id) {
                    Ok(())
                } else {
                    Err(LMSError::Unauthorized(
                        "You must be enrolled in this course to access its quizzes".to_string()
                    ))
                }
            }
            None => Err(LMSError::NotFound("Course not found".to_string()))
        }
    })
}

/// Unified quiz access validation based on caller's role


/// Comprehensive quiz data validation
pub fn validate_quiz_data(
    title: &str,
    description: &str,
    questions: &[Question],
    max_attempts: u32,
) -> LMSResult<()> {
    validate_title(title)?;
    validate_description(description)?;
    validate_questions(questions)?;
    
    if max_attempts == 0 {
        return Err(LMSError::ValidationError("Max attempts must be at least 1".to_string()));
    }
    
    Ok(())
}

pub fn validate_title(title: &str) -> LMSResult<()> {
    if title.trim().is_empty() {
        return Err(LMSError::ValidationError("Quiz title cannot be empty".to_string()));
    }
    if title.len() > 200 {
        return Err(LMSError::ValidationError("Quiz title too long (max 200 characters)".to_string()));
    }
    Ok(())
}

pub fn validate_description(description: &str) -> LMSResult<()> {
    if description.len() > 2000 {
        return Err(LMSError::ValidationError("Description too long (max 2000 characters)".to_string()));
    }
    Ok(())
}

pub fn validate_questions(questions: &[Question]) -> LMSResult<()> {
    if questions.is_empty() {
        return Err(LMSError::ValidationError("Quiz must have at least one question".to_string()));
    }
    
    if questions.len() > 100 {
        return Err(LMSError::ValidationError("Too many questions (max 100)".to_string()));
    }
    
    for (i, question) in questions.iter().enumerate() {
        validate_question(question, i)?;
    }
    
    Ok(())
}

fn validate_question(question: &Question, index: usize) -> LMSResult<()> {
    if question.question_text.trim().is_empty() {
        return Err(LMSError::ValidationError(
            format!("Question {} text cannot be empty", index + 1)
        ));
    }
    
    if question.points == 0 {
        return Err(LMSError::ValidationError(
            format!("Question {} must have at least 1 point", index + 1)
        ));
    }
    
    // Validate question type specific data
    match &question.question_type {
        QuestionType::MultipleChoice { options, correct_answer } => {
            if options.len() < 2 {
                return Err(LMSError::ValidationError(
                    format!("Question {} must have at least 2 options", index + 1)
                ));
            }
            if *correct_answer >= options.len() as u64 {
                return Err(LMSError::ValidationError(
                    format!("Question {} correct answer index out of bounds", index + 1)
                ));
            }
        }
        QuestionType::Essay { max_words } => {
            if let Some(max) = max_words {
                if *max == 0 {
                    return Err(LMSError::ValidationError(
                        format!("Question {} max words must be greater than 0", index + 1)
                    ));
                }
            }
        }
        _ => {} // TrueFalse and ShortAnswer are always valid if question text exists
    }
    
    Ok(())
}

/// Optimize questions for better performance and user experience
pub fn optimize_questions(mut questions: Vec<Question>) -> Vec<Question> {
    // Ensure questions have unique IDs
    for (i, question) in questions.iter_mut().enumerate() {
        if question.id.is_empty() {
            question.id = format!("q_{}", i + 1);
        }
    }
    
    // Sort by points for consistent ordering
    questions.sort_by(|a, b| a.points.cmp(&b.points));
    
    questions
}

/// Check if quiz has active attempts
pub fn has_active_quiz_attempts(quiz_id: &str) -> bool {
    QUIZ_ATTEMPTS.with(|attempts| {
        attempts.borrow().iter().any(|(_, attempt)| {
            attempt.quiz_id == quiz_id && attempt.submitted_at.is_none()
        })
    })
}

/// Unified quiz access validation based on caller's role
/// Automatically determines the appropriate validation based on user role
pub fn validate_quiz_access(course_id: &str) -> LMSResult<()> {
    use crate::rbac::get_caller_user;
    
    match get_caller_user() {
        Ok(user) => {
            match user.role {
                shared::UserRole::Student => {
                    // Students must be enrolled in the course
                    validate_student_enrollment(course_id)
                }
                _ => {
                    // Instructors and admins use course access validation
                    validate_course_access(course_id)
                }
            }
        }
        Err(e) => Err(e)
    }
}
