use candid::candid_method;
use ic_cdk::{query, update};
use shared::{Quiz, QuizAttempt, Question, Answer, LMSResult};
use crate::quiz;

// Quiz Management API with RBAC Guards

/// Create a new quiz with comprehensive validation
#[update]
#[candid_method(update)]
pub fn create_quiz(
    course_id: String,
    title: String,
    description: String,
    questions: Vec<Question>,
    time_limit_minutes: Option<u32>,
    max_attempts: u32,
) -> LMSResult<Quiz> {
    quiz::create_quiz(course_id, title, description, questions, time_limit_minutes, max_attempts)
}

/// Update an existing quiz with validation
#[update]
#[candid_method(update)]
pub fn update_quiz(
    quiz_id: String,
    title: Option<String>,
    description: Option<String>,
    questions: Option<Vec<Question>>,
    time_limit_minutes: Option<Option<u32>>,
    max_attempts: Option<u32>,
) -> LMSResult<Quiz> {
    quiz::update_quiz(quiz_id, title, description, questions, time_limit_minutes, max_attempts)
}

/// Start a quiz attempt for the current student
#[update]
#[candid_method(update)]
pub fn start_quiz_attempt(quiz_id: String) -> LMSResult<QuizAttempt> {
    quiz::start_quiz_attempt(quiz_id)
}

/// Submit quiz answers and get scored result
#[update]
#[candid_method(update)]
pub fn submit_quiz_attempt(attempt_id: String, answers: Vec<Answer>) -> LMSResult<QuizAttempt> {
    quiz::submit_quiz_attempt(attempt_id, answers)
}

/// Get quiz with student progress tracking
#[query]
#[candid_method(query)]
pub fn get_quiz_with_progress(quiz_id: String) -> LMSResult<(Quiz, Vec<QuizAttempt>)> {
    quiz::get_quiz_with_progress(quiz_id)
}

/// Get comprehensive quiz analytics (instructors only)
#[query]
#[candid_method(query)]
pub fn get_quiz_analytics(quiz_id: String) -> LMSResult<String> {
    // Return analytics as JSON string for now (could be enhanced with proper types)
    match quiz::get_quiz_analytics(quiz_id) {
        Ok(analytics) => Ok(format!("{:?}", analytics)), // Simplified for now
        Err(e) => Err(e)
    }
}

/// Delete quiz with safety checks
#[update]
#[candid_method(update)]
pub fn delete_quiz(quiz_id: String) -> LMSResult<()> {
    quiz::delete_quiz(quiz_id)
}
