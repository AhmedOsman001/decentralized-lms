// Quiz Analytics and Statistics
// Handles quiz performance metrics and analytics

use shared::{Quiz, QuizAttempt, LMSResult};
use crate::storage::QUIZ_ATTEMPTS;
use crate::rbac::require_teacher;
use super::core::get_quiz_with_access_check;
use super::attempts::calculate_quiz_max_score;

/// Get comprehensive quiz analytics for instructors
pub fn get_quiz_analytics(quiz_id: String) -> LMSResult<QuizAnalytics> {
    require_teacher()?;
    
    let quiz = get_quiz_with_access_check(quiz_id.clone())?;
    
    // Collect all attempts for this quiz
    let all_attempts = get_all_quiz_attempts(&quiz_id);
    
    let analytics = QuizAnalytics {
        quiz_id: quiz_id.clone(),
        total_attempts: all_attempts.len(),
        completed_attempts: all_attempts.iter().filter(|a| a.submitted_at.is_some()).count(),
        average_score: calculate_average_score(&quiz, &all_attempts),
        score_distribution: calculate_score_distribution(&quiz, &all_attempts),
        question_analytics: calculate_question_analytics(&quiz, &all_attempts),
        completion_rate: calculate_completion_rate(&all_attempts),
        average_time_taken: calculate_average_time(&all_attempts),
    };
    
    Ok(analytics)
}

// Data structures for analytics

#[derive(Debug, Clone)]
#[allow(dead_code)] // Fields are used via serialization/API responses
pub struct QuizAnalytics {
    pub quiz_id: String,
    pub total_attempts: usize,
    pub completed_attempts: usize,
    pub average_score: f64,
    pub score_distribution: ScoreDistribution,
    pub question_analytics: Vec<QuestionAnalytics>,
    pub completion_rate: f64,
    pub average_time_taken: f64, // in minutes
}

#[derive(Debug, Clone)]
#[allow(dead_code)] // Fields are used via serialization/API responses
pub struct ScoreDistribution {
    pub ranges: Vec<(String, usize)>, // (range_label, count)
}

#[derive(Debug, Clone)]
#[allow(dead_code)] // Fields are used via serialization/API responses
pub struct QuestionAnalytics {
    pub question_id: String,
    pub correct_answers: usize,
    pub total_answers: usize,
    pub difficulty_rating: f64, // 0.0 (easy) to 1.0 (hard)
}

// Helper functions for analytics calculations

fn get_all_quiz_attempts(quiz_id: &str) -> Vec<QuizAttempt> {
    QUIZ_ATTEMPTS.with(|attempts| {
        attempts.borrow()
            .iter()
            .filter(|(_, attempt)| attempt.quiz_id == quiz_id)
            .map(|(_, attempt)| attempt)
            .collect()
    })
}

fn calculate_average_score(quiz: &Quiz, attempts: &[QuizAttempt]) -> f64 {
    let completed: Vec<&QuizAttempt> = attempts.iter()
        .filter(|a| a.score.is_some())
        .collect();
    
    if completed.is_empty() {
        return 0.0;
    }
    
    let max_score = calculate_quiz_max_score(quiz);
    let total: f64 = completed.iter()
        .map(|a| a.score.unwrap() / max_score * 100.0)
        .sum();
    
    total / completed.len() as f64
}

fn calculate_score_distribution(quiz: &Quiz, attempts: &[QuizAttempt]) -> ScoreDistribution {
    let mut ranges = vec![
        ("0-20%".to_string(), 0),
        ("21-40%".to_string(), 0),
        ("41-60%".to_string(), 0),
        ("61-80%".to_string(), 0),
        ("81-100%".to_string(), 0),
    ];
    
    let max_score = calculate_quiz_max_score(quiz);
    
    for attempt in attempts {
        if let Some(score) = attempt.score {
            let percentage = (score / max_score) * 100.0;
            let index = match percentage {
                0.0..=20.0 => 0,
                20.1..=40.0 => 1,
                40.1..=60.0 => 2,
                60.1..=80.0 => 3,
                _ => 4,
            };
            ranges[index].1 += 1;
        }
    }
    
    ScoreDistribution { ranges }
}

fn calculate_question_analytics(quiz: &Quiz, attempts: &[QuizAttempt]) -> Vec<QuestionAnalytics> {
    let mut analytics = Vec::new();
    
    for question in &quiz.questions {
        let mut correct = 0;
        let mut total = 0;
        
        for attempt in attempts {
            if attempt.submitted_at.is_some() {
                if let Some(answer) = attempt.answers.iter().find(|a| a.question_id == question.id) {
                    total += 1;
                    if answer.is_correct.unwrap_or(false) {
                        correct += 1;
                    }
                }
            }
        }
        
        let difficulty = if total > 0 {
            1.0 - (correct as f64 / total as f64)
        } else {
            0.5 // Unknown difficulty
        };
        
        analytics.push(QuestionAnalytics {
            question_id: question.id.clone(),
            correct_answers: correct,
            total_answers: total,
            difficulty_rating: difficulty,
        });
    }
    
    analytics
}

fn calculate_completion_rate(attempts: &[QuizAttempt]) -> f64 {
    if attempts.is_empty() {
        return 0.0;
    }
    
    let completed = attempts.iter()
        .filter(|a| a.submitted_at.is_some())
        .count();
    
    (completed as f64 / attempts.len() as f64) * 100.0
}

fn calculate_average_time(attempts: &[QuizAttempt]) -> f64 {
    let completed: Vec<&QuizAttempt> = attempts.iter()
        .filter(|a| a.submitted_at.is_some())
        .collect();
    
    if completed.is_empty() {
        return 0.0;
    }
    
    let total_time: u64 = completed.iter()
        .map(|a| a.submitted_at.unwrap() - a.started_at)
        .sum();
    
    (total_time as f64 / completed.len() as f64) / 60_000_000_000.0 // Convert to minutes
}
