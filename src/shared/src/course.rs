use candid::{CandidType, Deserialize};
use serde::Serialize;

#[cfg(feature = "stable-storage")]
use ic_stable_structures::Storable;
#[cfg(feature = "stable-storage")]
use std::borrow::Cow;

/// Course representation
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct Course {
    pub id: String,
    pub title: String,
    pub description: String,
    pub instructor_ids: Vec<String>, // Multiple instructors support
    pub tenant_id: String,
    pub lessons: Vec<String>, // Lesson IDs
    pub enrolled_students: Vec<String>, // Student IDs
    pub created_at: u64,
    pub updated_at: u64,
    pub is_published: bool,
}

/// Lesson representation
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct Lesson {
    pub id: String,
    pub course_id: String,
    pub title: String,
    pub content: String,
    pub lesson_type: LessonType,
    pub order: u32,
    pub quiz_id: Option<String>,
    pub created_at: u64,
    pub updated_at: u64,
}

/// Types of lessons supported
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub enum LessonType {
    Text,
    Video,
    Interactive,
    Assignment,
}

// Stable storage implementations
#[cfg(feature = "stable-storage")]
impl Storable for Course {
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

#[cfg(feature = "stable-storage")]
impl Storable for Lesson {
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}
