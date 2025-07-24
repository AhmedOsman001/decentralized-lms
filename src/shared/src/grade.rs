use candid::{CandidType, Deserialize};
use serde::Serialize;

#[cfg(feature = "stable-storage")]
use ic_stable_structures::Storable;
#[cfg(feature = "stable-storage")]
use std::borrow::Cow;

/// Grade representation
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct Grade {
    pub id: String,
    pub student_id: String,
    pub quiz_id: Option<String>,
    pub lesson_id: Option<String>,
    pub course_id: String,
    pub score: f64,
    pub max_score: f64,
    pub grade_type: GradeType,
    pub feedback: Option<String>,
    pub graded_by: String, // Instructor ID
    pub graded_at: u64,
}

/// Types of grades
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub enum GradeType {
    Quiz,
    Assignment,
    Participation,
    Final,
}

// Stable storage implementations
#[cfg(feature = "stable-storage")]
impl Storable for Grade {
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}
