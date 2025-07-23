use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

#[cfg(feature = "stable-storage")]
use ic_stable_structures::Storable;
#[cfg(feature = "stable-storage")]
use std::borrow::Cow;

/// Common error types used across the LMS platform
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub enum LMSError {
    NotFound(String),
    Unauthorized(String),
    ValidationError(String),
    InternalError(String),
    AlreadyExists(String),
    InvalidRole(String),
    InitializationError(String),
}

/// User representation shared across canisters
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: UserRole,
    pub tenant_id: String,
    pub created_at: u64,
    pub updated_at: u64,
    pub is_active: bool,
}

/// User roles in the LMS system
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub enum UserRole {
    Student,
    Instructor,
    Admin,
    TenantAdmin,
}

/// Role-based access control trait
impl UserRole {
    pub fn can_create_course(&self) -> bool {
        matches!(self, UserRole::Instructor | UserRole::Admin | UserRole::TenantAdmin)
    }
    
    pub fn can_manage_users(&self) -> bool {
        matches!(self, UserRole::Admin | UserRole::TenantAdmin)
    }
    
    pub fn can_grade(&self) -> bool {
        matches!(self, UserRole::Instructor | UserRole::Admin | UserRole::TenantAdmin)
    }
}

/// Course representation
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct Course {
    pub id: String,
    pub title: String,
    pub description: String,
    pub instructor_id: String,
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

/// Tenant (University) representation
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct Tenant {
    pub id: String,
    pub name: String,
    pub domain: String,
    pub canister_id: Principal,
    pub admin_principal: Principal,
    pub created_at: u64,
    pub is_active: bool,
}

/// Utility functions
pub mod utils {
    use ic_cdk::api::time;
    
    /// Get current timestamp in nanoseconds
    pub fn current_time() -> u64 {
        time()
    }
    
    /// Generate a simple ID (in production, use more robust ID generation)
    pub fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, current_time())
    }
    
    /// Validate email format (basic validation)
    pub fn is_valid_email(email: &str) -> bool {
        email.contains('@') && email.contains('.')
    }
    
    /// Validate subdomain format
    pub fn is_valid_subdomain(subdomain: &str) -> bool {
        subdomain.len() > 0 
            && subdomain.chars().all(|c| c.is_alphanumeric() || c == '-')
            && !subdomain.starts_with('-')
            && !subdomain.ends_with('-')
    }
}

/// Result type alias for common LMS operations
pub type LMSResult<T> = Result<T, LMSError>;

// Stable storage implementations
#[cfg(feature = "stable-storage")]
impl Storable for User {
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

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
impl Storable for Grade {
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
impl Storable for Tenant {
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use candid::{encode_one, decode_one};
    use super::{User, UserRole, Course, Quiz, Question, QuestionType, Grade, GradeType, LMSError, utils};
    
    #[test]
    fn test_user_serialization() {
        let user = User {
            id: "user_1".to_string(),
            name: "John Doe".to_string(),
            email: "john@example.com".to_string(),
            role: UserRole::Student,
            tenant_id: "tenant_1".to_string(),
            created_at: 1234567890,
            updated_at: 1234567890,
            is_active: true,
        };
        
        // Test Candid serialization
        let encoded = encode_one(&user).expect("Failed to encode user");
        let decoded: User = decode_one(&encoded).expect("Failed to decode user");
        assert_eq!(user, decoded);
        
        // Test JSON serialization
        #[cfg(test)]
        {
            let json = serde_json::to_string(&user).expect("Failed to serialize to JSON");
            let from_json: User = serde_json::from_str(&json).expect("Failed to deserialize from JSON");
            assert_eq!(user, from_json);
        }
    }
    
    #[test]
    fn test_course_serialization() {
        let course = Course {
            id: "course_1".to_string(),
            title: "Introduction to Rust".to_string(),
            description: "Learn Rust programming".to_string(),
            instructor_id: "instructor_1".to_string(),
            tenant_id: "tenant_1".to_string(),
            lessons: vec!["lesson_1".to_string(), "lesson_2".to_string()],
            enrolled_students: vec!["student_1".to_string()],
            created_at: 1234567890,
            updated_at: 1234567890,
            is_published: true,
        };
        
        let encoded = encode_one(&course).expect("Failed to encode course");
        let decoded: Course = decode_one(&encoded).expect("Failed to decode course");
        assert_eq!(course, decoded);
    }
    
    #[test]
    fn test_quiz_serialization() {
        let quiz = Quiz {
            id: "quiz_1".to_string(),
            lesson_id: "lesson_1".to_string(),
            title: "Chapter 1 Quiz".to_string(),
            description: "Test your knowledge".to_string(),
            questions: vec![
                Question {
                    id: "q1".to_string(),
                    question_text: "What is Rust?".to_string(),
                    question_type: QuestionType::MultipleChoice {
                        options: vec!["A language".to_string(), "A framework".to_string()],
                        correct_answer: 0,
                    },
                    points: 10,
                }
            ],
            time_limit_minutes: Some(30),
            max_attempts: 3,
            created_at: 1234567890,
            updated_at: 1234567890,
        };
        
        let encoded = encode_one(&quiz).expect("Failed to encode quiz");
        let decoded: Quiz = decode_one(&encoded).expect("Failed to decode quiz");
        assert_eq!(quiz, decoded);
    }
    
    #[test]
    fn test_grade_serialization() {
        let grade = Grade {
            id: "grade_1".to_string(),
            student_id: "student_1".to_string(),
            quiz_id: Some("quiz_1".to_string()),
            lesson_id: None,
            course_id: "course_1".to_string(),
            score: 85.5,
            max_score: 100.0,
            grade_type: GradeType::Quiz,
            feedback: Some("Good work!".to_string()),
            graded_by: "instructor_1".to_string(),
            graded_at: 1234567890,
        };
        
        let encoded = encode_one(&grade).expect("Failed to encode grade");
        let decoded: Grade = decode_one(&encoded).expect("Failed to decode grade");
        assert_eq!(grade, decoded);
    }
    
    #[test]
    fn test_user_role_permissions() {
        assert!(UserRole::Instructor.can_create_course());
        assert!(UserRole::Admin.can_manage_users());
        assert!(UserRole::TenantAdmin.can_grade());
        assert!(!UserRole::Student.can_create_course());
        assert!(!UserRole::Student.can_manage_users());
    }
    
    #[test]
    fn test_validation_utilities() {
        use utils::*;
        
        assert!(is_valid_email("test@example.com"));
        assert!(!is_valid_email("invalid-email"));
        
        assert!(is_valid_subdomain("university"));
        assert!(is_valid_subdomain("my-university"));
        assert!(!is_valid_subdomain("-invalid"));
        assert!(!is_valid_subdomain("invalid-"));
        assert!(!is_valid_subdomain(""));
    }
    
    #[test]
    fn test_error_types() {
        let error = LMSError::NotFound("User not found".to_string());
        let encoded = encode_one(&error).expect("Failed to encode error");
        let decoded: LMSError = decode_one(&encoded).expect("Failed to decode error");
        assert_eq!(error, decoded);
    }
}
