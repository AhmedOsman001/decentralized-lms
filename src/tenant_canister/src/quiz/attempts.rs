// Quiz Attempt Management
// Handles starting, submitting, and tracking quiz attempts

use ic_cdk::caller;
use std::collections::HashMap;
use shared::{Quiz, QuizAttempt, Answer, LMSResult, LMSError, utils, Question, QuestionType};
use crate::storage::{QUIZ_ATTEMPTS, QUIZZES};
use crate::rbac::{require_student, require_authenticated};
use super::core::{get_quiz_with_access_check};

/// Start a quiz attempt with comprehensive validation
pub fn start_quiz_attempt(quiz_id: String) -> LMSResult<QuizAttempt> {
    // Validate student permissions
    require_student()?;
    
    let student_id = caller().to_string();
    
    // Validate quiz exists and student has access (enrolled in course)
    let quiz = get_quiz_with_access_check(quiz_id.clone())?;
    
    // Check quiz availability based on start and end dates
    let current_time = utils::current_time();
    if current_time < quiz.start_date {
        return Err(LMSError::ValidationError(
            "Quiz has not started yet".to_string()
        ));
    }
    
    if current_time > quiz.end_date {
        return Err(LMSError::ValidationError(
            "Quiz has ended".to_string()
        ));
    }
    
    // Check attempt limits
    let current_attempts = count_student_quiz_attempts(&student_id, &quiz_id);
    if current_attempts >= quiz.max_attempts {
        return Err(LMSError::ValidationError(
            format!("Maximum attempts ({}) exceeded", quiz.max_attempts)
        ));
    }
    
    // Check for existing active attempt
    if has_active_student_attempt(&student_id, &quiz_id) {
        return Err(LMSError::ValidationError(
            "You already have an active attempt for this quizz".to_string()
        ));
    }
    
    let attempt_id = utils::generate_id("quiz_attempt");
    let current_time = utils::current_time();
    
    let attempt = QuizAttempt {
        id: attempt_id.clone(),
        quiz_id: quiz_id.clone(),
        student_id: student_id.clone(),
        answers: Vec::new(),
        score: None,
        started_at: current_time,
        submitted_at: None,
        time_remaining: Some(quiz.duration_minutes as u64 * 60), // Use duration_minutes instead of time_limit_minutes
    };
    
    QUIZ_ATTEMPTS.with(|attempts| {
        attempts.borrow_mut().insert(attempt_id.clone(), attempt.clone());
        ic_cdk::println!("Quiz attempt started: {} for student {}", attempt_id, student_id);
        Ok(attempt)
    })
}

/// Submit quiz answers with advanced scoring
pub fn submit_quiz_attempt(
    attempt_id: String,
    answers: Vec<Answer>,
) -> LMSResult<QuizAttempt> {
    let student_id = caller().to_string();
    
    QUIZ_ATTEMPTS.with(|attempts| {
        let mut attempts_map = attempts.borrow_mut();
        
        match attempts_map.get(&attempt_id) {
            Some(mut attempt) => {
                // Validate ownership
                if attempt.student_id != student_id {
                    return Err(LMSError::Unauthorized("Cannot submit another student's quiz attempt".to_string()));
                }
                
                // Check if already submitted
                if attempt.submitted_at.is_some() {
                    return Err(LMSError::ValidationError("Quiz attempt already submitted".to_string()));
                }
                
                // Validate time limit if applicable
                let quiz = QUIZZES.with(|quizzes| {
                    quizzes.borrow().get(&attempt.quiz_id).unwrap()
                });
                
                if let Some(time_limit) = quiz.time_limit_minutes {
                    let elapsed_minutes = (utils::current_time() - attempt.started_at) / 60_000_000_000;
                    if elapsed_minutes > time_limit as u64 {
                        return Err(LMSError::ValidationError("Time limit exceeded".to_string()));
                    }
                }
                
                // Score the quiz with advanced algorithms
                let score = score_quiz_attempt(&quiz, &answers)?;
                
                attempt.answers = answers;
                attempt.score = Some(score);
                attempt.submitted_at = Some(utils::current_time());
                
                attempts_map.insert(attempt_id.clone(), attempt.clone());
                ic_cdk::println!("Quiz attempt submitted: {} with score {}", attempt_id, score);
                
                Ok(attempt)
            }
            None => Err(LMSError::NotFound("Quiz attempt not found".to_string()))
        }
    })
}

/// Get quiz with comprehensive student progress tracking
pub fn get_quiz_with_progress(quiz_id: String) -> LMSResult<(Quiz, Vec<QuizAttempt>)> {
    require_authenticated()?;
    
    let caller_id = caller().to_string();
    let quiz = get_quiz_with_access_check(quiz_id.clone())?;
    
    // Get student's attempts for this quiz
    let attempts = get_student_quiz_attempts(&caller_id, &quiz_id);
    
    Ok((quiz, attempts))
}

// Helper functions

fn count_student_quiz_attempts(student_id: &str, quiz_id: &str) -> u32 {
    QUIZ_ATTEMPTS.with(|attempts| {
        attempts.borrow().iter()
            .filter(|(_, attempt)| attempt.student_id == student_id && attempt.quiz_id == quiz_id)
            .count() as u32
    })
}

fn has_active_student_attempt(student_id: &str, quiz_id: &str) -> bool {
    QUIZ_ATTEMPTS.with(|attempts| {
        attempts.borrow().iter().any(|(_, attempt)| {
            attempt.student_id == student_id && 
            attempt.quiz_id == quiz_id && 
            attempt.submitted_at.is_none()
        })
    })
}

pub fn calculate_quiz_max_score(quiz: &Quiz) -> f64 {
    quiz.questions.iter().map(|q| q.points as f64).sum()
}

fn score_quiz_attempt(quiz: &Quiz, answers: &[Answer]) -> LMSResult<f64> {
    let mut total_score = 0.0;
    let answer_map: HashMap<String, &Answer> = answers.iter()
        .map(|a| (a.question_id.clone(), a))
        .collect();
    
    for question in &quiz.questions {
        if let Some(answer) = answer_map.get(&question.id) {
            let question_score = score_question(question, answer);
            total_score += question_score;
        }
        // No penalty for unanswered questions in this implementation
    }
    
    Ok(total_score)
}

fn score_question(question: &Question, answer: &Answer) -> f64 {
    let max_points = question.points as f64;
    
    match &question.question_type {
        QuestionType::MultipleChoice { options: _, correct_answer } => {
            if let Ok(selected) = answer.answer_text.parse::<u64>() {
                if selected == *correct_answer {
                    max_points
                } else {
                    0.0
                }
            } else {
                0.0
            }
        }
        QuestionType::TrueFalse { correct_answer } => {
            if let Ok(selected) = answer.answer_text.parse::<bool>() {
                if selected == *correct_answer {
                    max_points
                } else {
                    0.0
                }
            } else {
                0.0
            }
        }
        QuestionType::ShortAnswer { sample_answer } => {
            // Simple string comparison - could be enhanced with fuzzy matching
            let similarity = calculate_string_similarity(&answer.answer_text, sample_answer);
            if similarity > 0.8 {
                max_points
            } else if similarity > 0.6 {
                max_points * 0.5 // Partial credit
            } else {
                0.0
            }
        }
        QuestionType::Essay { .. } => {
            // Essays require manual grading - return 0 for now, will be updated by instructor
            0.0
        }
    }
}

fn calculate_string_similarity(s1: &str, s2: &str) -> f64 {
    let s1_clean = s1.trim().to_lowercase();
    let s2_clean = s2.trim().to_lowercase();
    
    if s1_clean == s2_clean {
        1.0
    } else if s1_clean.contains(&s2_clean) || s2_clean.contains(&s1_clean) {
        0.7
    } else {
        0.0
    }
}

fn get_student_quiz_attempts(student_id: &str, quiz_id: &str) -> Vec<QuizAttempt> {
    QUIZ_ATTEMPTS.with(|attempts| {
        attempts.borrow()
            .iter()
            .filter(|(_, attempt)| attempt.student_id == student_id && attempt.quiz_id == quiz_id)
            .map(|(_, attempt)| attempt)
            .collect()
    })
}
