use candid::candid_method;
use ic_cdk::{query, update, caller};
use shared::{User, UserRole, Course, Grade, GradeType, LMSResult, LMSError};
use crate::types::TenantData;
use crate::storage::{TENANT_DATA, USERS};
use crate::{user_management, course_management, grade_management};

// User Management API
#[update]
#[candid_method(update)]
pub fn register_user(id: String, name: String, email: String, role: UserRole, tenant_id: String) -> LMSResult<User> {
    user_management::register_user(id, name, email, role, tenant_id)
}

#[query]
#[candid_method(query)]
pub fn list_users() -> Vec<User> {
    user_management::list_users()
}

#[query]
#[candid_method(query)]
pub fn get_user(user_id: String) -> LMSResult<User> {
    user_management::get_user(user_id)
}

#[update]
#[candid_method(update)]
pub fn update_user(user_id: String, name: Option<String>, email: Option<String>, is_active: Option<bool>) -> LMSResult<User> {
    user_management::update_user(user_id, name, email, is_active)
}

// Course Management API
#[update]
#[candid_method(update)]
pub fn create_course(id: String, title: String, description: String) -> LMSResult<Course> {
    course_management::create_course(id, title, description)
}

#[query]
#[candid_method(query)]
pub fn list_courses() -> Vec<Course> {
    course_management::list_courses()
}

#[query]
#[candid_method(query)]
pub fn get_course(course_id: String) -> LMSResult<Course> {
    course_management::get_course(course_id)
}

#[update]
#[candid_method(update)]
pub fn enroll_student(course_id: String, student_id: String) -> LMSResult<()> {
    course_management::enroll_student(course_id, student_id)
}

#[update]
#[candid_method(update)]
pub fn update_course(course_id: String, title: Option<String>, description: Option<String>, is_published: Option<bool>) -> LMSResult<Course> {
    course_management::update_course(course_id, title, description, is_published)
}

#[query]
#[candid_method(query)]
pub fn get_instructor_courses(instructor_id: String) -> Vec<Course> {
    course_management::get_instructor_courses(instructor_id)
}

#[query]
#[candid_method(query)]
pub fn get_student_courses(student_id: String) -> Vec<Course> {
    course_management::get_student_courses(student_id)
}

// Multi-Instructor Management API
#[update]
#[candid_method(update)]
pub fn add_instructor_to_course(course_id: String, instructor_id: String) -> LMSResult<Course> {
    course_management::add_instructor_to_course(course_id, instructor_id)
}

#[update]
#[candid_method(update)]
pub fn remove_instructor_from_course(course_id: String, instructor_id: String) -> LMSResult<Course> {
    course_management::remove_instructor_from_course(course_id, instructor_id)
}

#[query]
#[candid_method(query)]
pub fn get_course_instructors(course_id: String) -> LMSResult<Vec<String>> {
    course_management::get_course_instructors(course_id)
}

// Grade Management API
#[update]
#[candid_method(update)]
pub fn record_grade(
    student_id: String,
    course_id: String,
    score: f64,
    max_score: f64,
    grade_type: GradeType,
    feedback: Option<String>,
) -> LMSResult<Grade> {
    grade_management::record_grade(student_id, course_id, score, max_score, grade_type, feedback)
}

#[update]
#[candid_method(update)]
pub fn record_quiz_grade(
    student_id: String,
    course_id: String,
    quiz_id: String,
    score: f64,
    max_score: f64,
    feedback: Option<String>,
) -> LMSResult<Grade> {
    grade_management::record_quiz_grade(student_id, course_id, quiz_id, score, max_score, feedback)
}

#[query]
#[candid_method(query)]
pub fn get_student_grades(student_id: String) -> Vec<Grade> {
    grade_management::get_student_grades(student_id)
}

#[query]
#[candid_method(query)]
pub fn get_course_grades(course_id: String) -> Vec<Grade> {
    grade_management::get_course_grades(course_id)
}

#[query]
#[candid_method(query)]
pub fn get_grade(grade_id: String) -> LMSResult<Grade> {
    grade_management::get_grade(grade_id)
}

#[update]
#[candid_method(update)]
pub fn update_grade(grade_id: String, score: Option<f64>, feedback: Option<String>) -> LMSResult<Grade> {
    grade_management::update_grade(grade_id, score, feedback)
}

#[query]
#[candid_method(query)]
pub fn calculate_course_average(student_id: String, course_id: String) -> Option<f64> {
    grade_management::calculate_course_average(student_id, course_id)
}

// System API
#[query]
#[candid_method(query)]
pub fn health_check() -> String {
    TENANT_DATA.with(|data| {
        match data.borrow().get() {
            Some(tenant_data) => format!("Tenant canister {} is healthy", tenant_data.tenant_id),
            None => "Tenant canister not initialized".to_string()
        }
    })
}

#[query]
#[candid_method(query)]
pub fn get_tenant_info() -> LMSResult<TenantData> {
    TENANT_DATA.with(|data| {
        match data.borrow().get() {
            Some(d) => Ok(d.clone()),
            None => Err(LMSError::InitializationError("Tenant not initialized".to_string()))
        }
    })
}

/// Recover tenant data from existing users (migration helper)
#[update]
#[candid_method(update)]
pub fn recover_tenant_data() -> LMSResult<TenantData> {
    TENANT_DATA.with(|data| {
        if data.borrow().get().is_some() {
            return Err(LMSError::AlreadyExists("Tenant already initialized".to_string()));
        }
        
        // Find existing tenant_id from users
        let existing_data = USERS.with(|users| {
            for (_, user) in users.borrow().iter() {
                if user.role == UserRole::TenantAdmin {
                    return Some((user.tenant_id.clone(), user.created_at));
                }
            }
            None
        });
        
        if let Some((tenant_id, created_at)) = existing_data {
            let tenant_data = TenantData {
                tenant_id,
                admin_principal: caller(),
                is_initialized: true,
                created_at,
            };
            
            data.borrow_mut().set(Some(tenant_data.clone())).expect("Failed to store tenant data");
            ic_cdk::println!("Recovered tenant data: {}", tenant_data.tenant_id);
            Ok(tenant_data)
        } else {
            Err(LMSError::NotFound("No existing tenant data found".to_string()))
        }
    })
}
