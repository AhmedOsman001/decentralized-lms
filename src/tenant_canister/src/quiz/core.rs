// Quiz Core Operations
// Handles CRUD operations for quizzes

use shared::{Quiz, Question, LMSResult, LMSError, utils};
use crate::storage::QUIZZES;
use crate::rbac::require_teacher;
use super::validation::{validate_course_access, validate_quiz_data, has_active_quiz_attempts, optimize_questions, validate_quiz_dates};

/// Advanced quiz creation with validation and optimization
pub fn create_quiz(
    course_id: String,
    title: String,
    description: String,
    questions: Vec<Question>,
    time_limit_minutes: Option<u32>,
    max_attempts: u32,
    start_date: u64,
    end_date: u64,
    duration_minutes: u32,
) -> LMSResult<Quiz> {
    // Validate permissions - only instructors and admins can create quizzes
    require_teacher()?;
    
    // Validate course exists and caller has access
    validate_course_access(&course_id)?;
    
    // Validate quiz data
    validate_quiz_data(&title, &description, &questions, max_attempts)?;
    
    // Validate date ranges
    validate_quiz_dates(start_date, end_date, duration_minutes)?;
    
    let quiz_id = utils::generate_id("quiz");
    let current_time = utils::current_time();
    
    let quiz = Quiz {
        id: quiz_id.clone(),
        course_id,
        title,
        description,
        questions: optimize_questions(questions),
        time_limit_minutes,
        max_attempts,
        start_date,
        end_date,
        duration_minutes,
        created_at: current_time,
        updated_at: current_time,
    };
    
    QUIZZES.with(|quizzes| {
        quizzes.borrow_mut().insert(quiz_id.clone(), quiz.clone());
        ic_cdk::println!("Quiz created: {} with {} questions", quiz_id, quiz.questions.len());
        Ok(quiz)
    })
}

/// Update an existing quiz with comprehensive validation
pub fn update_quiz(
    quiz_id: String,
    title: Option<String>,
    description: Option<String>,
    questions: Option<Vec<Question>>,
    time_limit_minutes: Option<Option<u32>>,
    max_attempts: Option<u32>,
    start_date: Option<u64>,
    end_date: Option<u64>,
    duration_minutes: Option<u32>,
) -> LMSResult<Quiz> {
    // Validate permissions
    require_teacher()?;
    
    QUIZZES.with(|quizzes| {
        let mut quizzes_map = quizzes.borrow_mut();
        
        match quizzes_map.get(&quiz_id) {
            Some(mut quiz) => {
                // Validate course access
                validate_course_access(&quiz.course_id)?;
                
                // Check if quiz has active attempts - prevent major changes
                let has_active = has_active_quiz_attempts(&quiz_id);
                
                // Update fields with validation
                if let Some(new_title) = title {
                    super::validation::validate_title(&new_title)?;
                    quiz.title = new_title;
                }
                
                if let Some(new_description) = description {
                    super::validation::validate_description(&new_description)?;
                    quiz.description = new_description;
                }
                
                if let Some(new_questions) = questions {
                    if has_active {
                        return Err(LMSError::ValidationError(
                            "Cannot modify questions while quiz has active attempts".to_string()
                        ));
                    }
                    super::validation::validate_questions(&new_questions)?;
                    quiz.questions = optimize_questions(new_questions);
                }
                
                if let Some(new_time_limit) = time_limit_minutes {
                    quiz.time_limit_minutes = new_time_limit;
                }
                
                if let Some(new_max_attempts) = max_attempts {
                    if new_max_attempts == 0 {
                        return Err(LMSError::ValidationError("Max attempts must be at least 1".to_string()));
                    }
                    quiz.max_attempts = new_max_attempts;
                }
                
                if let Some(new_start_date) = start_date {
                    quiz.start_date = new_start_date;
                }
                
                if let Some(new_end_date) = end_date {
                    quiz.end_date = new_end_date;
                }
                
                if let Some(new_duration) = duration_minutes {
                    quiz.duration_minutes = new_duration;
                }
                
                // Validate date consistency if any date fields were updated
                if start_date.is_some() || end_date.is_some() || duration_minutes.is_some() {
                    super::validation::validate_quiz_dates(quiz.start_date, quiz.end_date, quiz.duration_minutes)?;
                }
                
                quiz.updated_at = utils::current_time();
                
                quizzes_map.insert(quiz_id.clone(), quiz.clone());
                ic_cdk::println!("Quiz updated: {}", quiz_id);
                Ok(quiz)
            }
            None => Err(LMSError::NotFound("Quiz not found".to_string()))
        }
    })
}

/// Delete quiz with safety checks
pub fn delete_quiz(quiz_id: String) -> LMSResult<()> {
    require_teacher()?;
    
    // Check if quiz has any attempts
    let has_attempts = crate::storage::QUIZ_ATTEMPTS.with(|attempts| {
        attempts.borrow().iter().any(|(_, attempt)| attempt.quiz_id == quiz_id)
    });
    
    if has_attempts {
        return Err(LMSError::ValidationError(
            "Cannot delete quiz with existing attempts. Archive it instead.".to_string()
        ));
    }
    
    QUIZZES.with(|quizzes| {
        match quizzes.borrow_mut().remove(&quiz_id) {
            Some(_) => {
                ic_cdk::println!("Quiz deleted: {}", quiz_id);
                Ok(())
            }
            None => Err(LMSError::NotFound("Quiz not found".to_string()))
        }
    })
}

/// Get quiz with unified access validation
/// Automatically handles different validation based on caller's role
pub fn get_quiz_with_access_check(quiz_id: String) -> LMSResult<Quiz> {
    QUIZZES.with(|quizzes| {
        match quizzes.borrow().get(&quiz_id) {
            Some(quiz) => {
                // Use unified validation that handles all roles appropriately
                super::validation::validate_quiz_access(&quiz.course_id)?;
                Ok(quiz)
            }
            None => Err(LMSError::NotFound("Quiz not found".to_string()))
        }
    })
}

/// List all quizzes for a specific course
pub fn list_course_quizzes(course_id: String) -> LMSResult<Vec<Quiz>> {
    // Validate course access first
    super::validation::validate_quiz_access(&course_id)?;
    
    QUIZZES.with(|quizzes| {
        let course_quizzes: Vec<Quiz> = quizzes
            .borrow()
            .iter()
            .filter_map(|(_, quiz)| {
                if quiz.course_id == course_id {
                    Some(quiz.clone())
                } else {
                    None
                }
            })
            .collect();
        
        ic_cdk::println!("Found {} quizzes for course: {}", course_quizzes.len(), course_id);
        Ok(course_quizzes)
    })
}
