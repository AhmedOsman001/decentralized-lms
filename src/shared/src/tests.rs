use crate::*;

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
            instructor_ids: vec!["instructor_1".to_string()],
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
    fn test_course_multiple_instructors() {
        let course = Course {
            id: "course_1".to_string(),
            title: "Advanced Programming".to_string(),
            description: "Team-taught course".to_string(),
            instructor_ids: vec![
                "instructor_1".to_string(),
                "instructor_2".to_string(),
                "ta_1".to_string()
            ],
            tenant_id: "tenant_1".to_string(),
            lessons: vec![],
            enrolled_students: vec![],
            created_at: 1234567890,
            updated_at: 1234567890,
            is_published: false,
        };
        
        // Test that all instructors are properly stored
        assert_eq!(course.instructor_ids.len(), 3);
        assert!(course.instructor_ids.contains(&"instructor_1".to_string()));
        assert!(course.instructor_ids.contains(&"instructor_2".to_string()));
        assert!(course.instructor_ids.contains(&"ta_1".to_string()));
        
        // Test serialization with multiple instructors
        let encoded = encode_one(&course).expect("Failed to encode course");
        let decoded: Course = decode_one(&encoded).expect("Failed to decode course");
        assert_eq!(course, decoded);
    }
    
    #[test]
    fn test_quiz_serialization() {
        let quiz = Quiz {
            id: "quiz_1".to_string(),
            course_id: "course_1".to_string(),
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
