use super::types::{HttpRequest, HttpResponse, HttpHeader};
use super::types::{CreateUserRequest, UpdateUserRequest, CreateCourseRequest, UpdateCourseRequest, RecordGradeRequest};
use super::routing::{parse_query_params, parse_json_body};
use super::responses::{create_json_response, create_error_response};
use crate::storage::TENANT_DATA;
use crate::api::{users, courses, grades};

/// Main API request handler - routes to specific handlers based on method and path
pub fn handle_api_request(method: &str, path_segments: &[&str], req: &HttpRequest) -> HttpResponse {
    match (method, path_segments.get(0)) {
        ("GET", Some(&"users")) => handle_users_get(path_segments, req),
        ("POST", Some(&"users")) => handle_users_post(req),
        ("PUT", Some(&"users")) => handle_users_put(path_segments, req),
        ("DELETE", Some(&"users")) => handle_users_delete(path_segments),
        
        ("GET", Some(&"courses")) => handle_courses_get(path_segments, req),
        ("POST", Some(&"courses")) => handle_courses_post(req),
        ("PUT", Some(&"courses")) => handle_courses_put(path_segments, req),
        ("DELETE", Some(&"courses")) => handle_courses_delete(path_segments),
        
        ("GET", Some(&"grades")) => handle_grades_get(req),
        ("POST", Some(&"grades")) => handle_grades_post(req),
        
        ("GET", Some(&"health")) => create_json_response(200, r#"{"status": "healthy", "canister": "tenant"}"#),
        
        _ => create_error_response(404, "API endpoint not found"),
    }
}

/// Redirect to frontend canister for UI requests
pub fn redirect_to_frontend() -> HttpResponse {
    // Use a default frontend canister ID since env vars aren't available in WASM
    // This should be configured through the canister initialization or settings
    let frontend_canister_id = "uxrrr-q7777-77774-qaaaq-cai"; // Default fallback
    
    TENANT_DATA.with(|data| {
        let tenant_id = if let Some(tenant_data) = data.borrow().get() {
            tenant_data.tenant_id.clone()
        } else {
            "unknown".to_string()
        };

        // Create a redirect response that tells the client where to go
        let redirect_info = format!(
            r#"{{
                "message": "This is a backend canister. Please use the frontend canister for UI.",
                "tenant_id": "{}",
                "frontend_canister": "{}",
                "redirect_url": "https://{}.ic0.app/?tenant={}",
                "local_redirect_url": "http://localhost:4943/?canisterId={}&tenant={}"
            }}"#,
            tenant_id,
            frontend_canister_id,
            frontend_canister_id,
            tenant_id,
            frontend_canister_id,
            tenant_id
        );

        HttpResponse {
            status_code: 200,
            headers: vec![
                HttpHeader {
                    name: "Content-Type".to_string(),
                    value: "application/json".to_string(),
                },
                HttpHeader {
                    name: "Access-Control-Allow-Origin".to_string(),
                    value: "*".to_string(),
                },
                HttpHeader {
                    name: "X-Tenant-Backend".to_string(),
                    value: "true".to_string(),
                },
            ],
            body: redirect_info.into_bytes(),
            streaming_strategy: None,
            upgrade: Some(false),
        }
    })
}

// User endpoint handlers
fn handle_users_get(path_segments: &[&str], _req: &HttpRequest) -> HttpResponse {
    if path_segments.len() == 1 {
        // GET /api/users - list all users
        let users = crate::api::users::list_users();
        let json = serde_json::to_string(&users).unwrap_or_else(|_| "[]".to_string());
        create_json_response(200, &json)
    } else {
        // GET /api/users/{id} - get specific user
        let user_id = path_segments[1];
        match crate::api::users::get_user(user_id.to_string()) {
            Ok(user) => {
                let json = serde_json::to_string(&user).unwrap_or_else(|_| "{}".to_string());
                create_json_response(200, &json)
            },
            Err(_) => create_error_response(404, "User not found")
        }
    }
}

fn handle_users_post(req: &HttpRequest) -> HttpResponse {
    // Parse request body
    let request_data: CreateUserRequest = match parse_json_body(&req.body) {
        Ok(data) => data,
        Err(e) => return create_error_response(400, &format!("Invalid request body: {}", e)),
    };

    // Parse role from string
    let role = match request_data.role.as_str() {
        "student" => shared::UserRole::Student,
        "instructor" => shared::UserRole::Instructor,
        "admin" => shared::UserRole::Admin,
        "tenant_admin" => shared::UserRole::TenantAdmin,
        _ => return create_error_response(400, "Invalid role. Must be one of: student, instructor, admin, tenant_admin"),
    };

    // Call the API function
    match users::register_user(
        request_data.id,
        request_data.name,
        request_data.email,
        role,
        request_data.tenant_id,
    ) {
        Ok(user) => {
            let json = serde_json::to_string(&user).unwrap_or_else(|_| "{}".to_string());
            create_json_response(201, &json)
        },
        Err(e) => {
            let error_msg = format!("{:?}", e);
            create_error_response(400, &error_msg)
        }
    }
}

fn handle_users_put(path_segments: &[&str], req: &HttpRequest) -> HttpResponse {
    if path_segments.len() < 2 {
        return create_error_response(400, "User ID required in path");
    }
    
    let user_id = path_segments[1];
    
    // Parse request body
    let request_data: UpdateUserRequest = match parse_json_body(&req.body) {
        Ok(data) => data,
        Err(e) => return create_error_response(400, &format!("Invalid request body: {}", e)),
    };

    // Call the API function
    match users::update_user(
        user_id.to_string(),
        request_data.name,
        request_data.email,
        request_data.is_active,
    ) {
        Ok(user) => {
            let json = serde_json::to_string(&user).unwrap_or_else(|_| "{}".to_string());
            create_json_response(200, &json)
        },
        Err(e) => {
            let error_msg = format!("{:?}", e);
            create_error_response(400, &error_msg)
        }
    }
}

fn handle_users_delete(path_segments: &[&str]) -> HttpResponse {
    if path_segments.len() < 2 {
        return create_error_response(400, "User ID required in path");
    }
    
    let user_id = path_segments[1];
    
    // For now, we'll deactivate the user instead of deleting
    // This is a safer approach for production systems
    match users::update_user(
        user_id.to_string(),
        None, // name
        None, // email  
        Some(false), // is_active = false
    ) {
        Ok(_) => {
            let response = serde_json::json!({
                "message": "User deactivated successfully",
                "user_id": user_id
            });
            create_json_response(200, &response.to_string())
        },
        Err(e) => {
            let error_msg = format!("{:?}", e);
            create_error_response(400, &error_msg)
        }
    }
}

// Course endpoint handlers
fn handle_courses_get(path_segments: &[&str], _req: &HttpRequest) -> HttpResponse {
    if path_segments.len() == 1 {
        // GET /api/courses - list all courses
        let courses = courses::list_courses();
        let json = serde_json::to_string(&courses).unwrap_or_else(|_| "[]".to_string());
        create_json_response(200, &json)
    } else {
        // GET /api/courses/{id} - get specific course
        let course_id = path_segments[1];
        match courses::get_course(course_id.to_string()) {
            Ok(course) => {
                let json = serde_json::to_string(&course).unwrap_or_else(|_| "{}".to_string());
                create_json_response(200, &json)
            },
            Err(_) => create_error_response(404, "Course not found")
        }
    }
}

fn handle_courses_post(req: &HttpRequest) -> HttpResponse {
    // Parse request body
    let request_data: CreateCourseRequest = match parse_json_body(&req.body) {
        Ok(data) => data,
        Err(e) => return create_error_response(400, &format!("Invalid request body: {}", e)),
    };

    // Call the API function
    match courses::create_course(
        request_data.id,
        request_data.title,
        request_data.description,
    ) {
        Ok(course) => {
            let json = serde_json::to_string(&course).unwrap_or_else(|_| "{}".to_string());
            create_json_response(201, &json)
        },
        Err(e) => {
            let error_msg = format!("{:?}", e);
            create_error_response(400, &error_msg)
        }
    }
}

fn handle_courses_put(path_segments: &[&str], req: &HttpRequest) -> HttpResponse {
    if path_segments.len() < 2 {
        return create_error_response(400, "Course ID required in path");
    }
    
    let course_id = path_segments[1];
    
    // Parse request body
    let request_data: UpdateCourseRequest = match parse_json_body(&req.body) {
        Ok(data) => data,
        Err(e) => return create_error_response(400, &format!("Invalid request body: {}", e)),
    };

    // Call the API function
    match courses::update_course(
        course_id.to_string(),
        request_data.title,
        request_data.description,
        request_data.is_published,
    ) {
        Ok(course) => {
            let json = serde_json::to_string(&course).unwrap_or_else(|_| "{}".to_string());
            create_json_response(200, &json)
        },
        Err(e) => {
            let error_msg = format!("{:?}", e);
            create_error_response(400, &error_msg)
        }
    }
}

fn handle_courses_delete(path_segments: &[&str]) -> HttpResponse {
    if path_segments.len() < 2 {
        return create_error_response(400, "Course ID required in path");
    }
    
    let course_id = path_segments[1];
    
    // For now, we'll unpublish the course instead of deleting
    // This is a safer approach for production systems
    match courses::update_course(
        course_id.to_string(),
        None, // title
        None, // description
        Some(false), // is_published = false
    ) {
        Ok(_) => {
            let response = serde_json::json!({
                "message": "Course unpublished successfully",
                "course_id": course_id
            });
            create_json_response(200, &response.to_string())
        },
        Err(e) => {
            let error_msg = format!("{:?}", e);
            create_error_response(400, &error_msg)
        }
    }
}

// Grade endpoint handlers
fn handle_grades_get(req: &HttpRequest) -> HttpResponse {
    // Parse query parameters from URL
    let params = parse_query_params(&req.url);
    
    let student_id = params.get("student_id");
    let course_id = params.get("course_id");
    
    match (student_id, course_id) {
        (Some(student_id), Some(_course_id)) => {
            // For now, just get all grades for the student
            // TODO: Filter by course when the API supports it
            let grades = grades::get_student_grades(student_id.clone());
            let json = serde_json::to_string(&grades).unwrap_or_else(|_| "[]".to_string());
            create_json_response(200, &json)
        },
        (Some(student_id), None) => {
            // Get all grades for a student
            let grades = grades::get_student_grades(student_id.clone());
            let json = serde_json::to_string(&grades).unwrap_or_else(|_| "[]".to_string());
            create_json_response(200, &json)
        },
        (None, Some(course_id)) => {
            // Get all grades for a course
            let grades = grades::get_course_grades(course_id.clone());
            let json = serde_json::to_string(&grades).unwrap_or_else(|_| "[]".to_string());
            create_json_response(200, &json)
        },
        (None, None) => {
            create_error_response(400, "Missing required query parameters: student_id or course_id")
        }
    }
}

fn handle_grades_post(req: &HttpRequest) -> HttpResponse {
    // Parse request body
    let request_data: RecordGradeRequest = match parse_json_body(&req.body) {
        Ok(data) => data,
        Err(e) => return create_error_response(400, &format!("Invalid request body: {}", e)),
    };

    // Parse grade type from string
    let grade_type = match request_data.grade_type.as_str() {
        "assignment" => shared::GradeType::Assignment,
        "quiz" => shared::GradeType::Quiz,
        "final" => shared::GradeType::Final,
        "participation" => shared::GradeType::Participation,
        _ => return create_error_response(400, "Invalid grade type. Must be one of: assignment, quiz, final, participation"),
    };

    // Call the API function
    match grades::record_grade(
        request_data.student_id,
        request_data.course_id,
        request_data.score,
        request_data.max_score,
        grade_type,
        request_data.feedback,
    ) {
        Ok(grade) => {
            let json = serde_json::to_string(&grade).unwrap_or_else(|_| "{}".to_string());
            create_json_response(201, &json)
        },
        Err(e) => {
            let error_msg = format!("{:?}", e);
            create_error_response(400, &error_msg)
        }
    }
}
