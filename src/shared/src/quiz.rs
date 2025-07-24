use candid::CandidType;
use serde::{Deserialize, Serialize};

#[cfg(feature = "stable-storage")]
use ic_stable_structures::Storable;
#[cfg(feature = "stable-storage")]
use std::borrow::Cow;

/// Quiz representation
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct Quiz {
    pub id: String,
    pub lesson_id: String,
    pub title: String,
    pub description: String,
    pub questions: Vec<Question>,
    pub time_limit_minutes: Option<u32>,
    pub max_attempts: u32,
    pub created_at: u64,
    pub updated_at: u64,
}

/// Question in a quiz
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct Question {
    pub id: String,
    pub question_text: String,
    pub question_type: QuestionType,
    pub points: u32,
}

/// Types of questions
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub enum QuestionType {
    MultipleChoice { options: Vec<String>, correct_answer: usize },
    TrueFalse { correct_answer: bool },
    ShortAnswer { sample_answer: String },
    Essay { max_words: Option<u32> },
}

#[derive(Debug, Clone, PartialEq, CandidType, Serialize, Deserialize)]
pub struct QuizAttempt {
    pub id: String,
    pub quiz_id: String,
    pub student_id: String,
    pub answers: Vec<Answer>,
    pub score: Option<f64>,
    pub max_score: f64,
    pub started_at: u64,
    pub submitted_at: Option<u64>,
    pub attempt_number: u32,
}

#[derive(Debug, Clone, PartialEq, CandidType, Serialize, Deserialize)]
pub struct Answer {
    pub question_id: String,
    pub answer_text: String,
    pub is_correct: Option<bool>,
}

// Stable storage implementations
#[cfg(feature = "stable-storage")]
impl Storable for Quiz {
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

#[cfg(feature = "stable-storage")]
impl Storable for QuizAttempt {
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}
