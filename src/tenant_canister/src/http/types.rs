use candid::{CandidType, Deserialize};
use serde::Serialize;

// HTTP request/response data structures for API endpoints
#[derive(Serialize, Deserialize, Debug)]
pub struct CreateUserRequest {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: String, // Will be parsed to UserRole
    pub tenant_id: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateUserRequest {
    pub name: Option<String>,
    pub email: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateCourseRequest {
    pub id: String,
    pub title: String,
    pub description: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateCourseRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub is_published: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RecordGradeRequest {
    pub student_id: String,
    pub course_id: String,
    pub score: f64,
    pub max_score: f64,
    pub grade_type: String, // Will be parsed to GradeType
    pub feedback: Option<String>,
}

// HTTP types for tenant canister
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct HttpRequest {
    pub method: String,
    pub url: String,
    pub headers: Vec<HttpHeader>,
    pub body: Vec<u8>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct HttpHeader {
    pub name: String,
    pub value: String,
}

#[derive(CandidType, Serialize, Clone, Debug)]
pub struct HttpResponse {
    pub status_code: u16,
    pub headers: Vec<HttpHeader>,
    pub body: Vec<u8>,
    pub streaming_strategy: Option<StreamingStrategy>,
    pub upgrade: Option<bool>,
}

#[derive(CandidType, Serialize, Clone, Debug)]
pub enum StreamingStrategy {
    Callback {
        token: String,
        callback: String,
    },
}
