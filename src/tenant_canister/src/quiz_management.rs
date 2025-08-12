// Quiz Management Module - Refactored for Better Organization
// This file now acts as a re-export facade for the modularized quiz system

// Re-export only used public APIs from the quiz module
pub use crate::quiz::{
    // Types and data structures
    analytics::QuizAnalytics,
    analytics::ScoreDistribution,
    analytics::QuestionAnalytics,
};
