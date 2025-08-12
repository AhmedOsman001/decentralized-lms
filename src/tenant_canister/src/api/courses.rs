use candid::candid_method;
use ic_cdk::{query, update};
use shared::{Course, LMSResult};
use crate::{course_management, rbac};

// Course Management API with RBAC Guards

#[update]
#[candid_method(update)]
pub fn create_course(id: String, title: String, description: String) -> LMSResult<Course> {
    // Check if caller can create courses (Instructor or higher)
    rbac::require_teacher()?;
    
    rbac::log_rbac_action("create_course", true, None);
    course_management::create_course(id, title, description)
}

#[query]
#[candid_method(query)]
pub fn list_courses() -> Vec<Course> {
    // Any authenticated user can list courses
    match rbac::require_authenticated() {
        Ok(_) => {
            rbac::log_rbac_action("list_courses", true, None);
            course_management::list_courses()
        },
        Err(_) => {
            rbac::log_rbac_action("list_courses", false, None);
            Vec::new() // Return empty list for unauthenticated users
        }
    }
}

#[query]
#[candid_method(query)]
pub fn get_course(course_id: String) -> LMSResult<Course> {
    // Any authenticated user can view course details
    rbac::require_authenticated()?;
    
    rbac::log_rbac_action("get_course", true, Some(&course_id));
    course_management::get_course(course_id)
}

#[update]
#[candid_method(update)]
pub fn enroll_student(course_id: String, student_id: String) -> LMSResult<()> {
    // Check if caller can manage enrollments (Instructor or higher)
    rbac::require_teacher()?;
    
    rbac::log_rbac_action("enroll_student", true, Some(&student_id));
    course_management::enroll_student(course_id, student_id)
}

#[update]
#[candid_method(update)]
pub fn update_course(course_id: String, title: Option<String>, description: Option<String>, is_published: Option<bool>) -> LMSResult<Course> {
    // Check if caller can update courses (Instructor or higher)
    rbac::require_teacher()?;
    
    rbac::log_rbac_action("update_course", true, Some(&course_id));
    course_management::update_course(course_id, title, description, is_published)
}

#[query]
#[candid_method(query)]
pub fn get_instructor_courses(instructor_id: String) -> Vec<Course> {
    // Check if caller can access instructor data
    match rbac::can_access_user_data(&instructor_id) {
        Ok(_) => {
            rbac::log_rbac_action("get_instructor_courses", true, Some(&instructor_id));
            course_management::get_instructor_courses(instructor_id)
        },
        Err(_) => {
            rbac::log_rbac_action("get_instructor_courses", false, Some(&instructor_id));
            Vec::new()
        }
    }
}

#[query]
#[candid_method(query)]
pub fn get_student_courses(student_id: String) -> Vec<Course> {
    // Check if caller can access student data
    match rbac::can_access_user_data(&student_id) {
        Ok(_) => {
            rbac::log_rbac_action("get_student_courses", true, Some(&student_id));
            course_management::get_student_courses(student_id)
        },
        Err(_) => {
            rbac::log_rbac_action("get_student_courses", false, Some(&student_id));
            Vec::new()
        }
    }
}

// Multi-Instructor Management API with RBAC Guards
#[update]
#[candid_method(update)]
pub fn add_instructor_to_course(course_id: String, instructor_id: String) -> LMSResult<Course> {
    // Check if caller can manage course instructors (Admin or higher)
    rbac::require_admin()?;
    
    rbac::log_rbac_action("add_instructor_to_course", true, Some(&instructor_id));
    course_management::add_instructor_to_course(course_id, instructor_id)
}

#[update]
#[candid_method(update)]
pub fn remove_instructor_from_course(course_id: String, instructor_id: String) -> LMSResult<Course> {
    // Check if caller can manage course instructors (Admin or higher)
    rbac::require_admin()?;
    
    rbac::log_rbac_action("remove_instructor_from_course", true, Some(&instructor_id));
    course_management::remove_instructor_from_course(course_id, instructor_id)
}

#[query]
#[candid_method(query)]
pub fn get_course_instructors(course_id: String) -> LMSResult<Vec<String>> {
    // Any authenticated user can view course instructors
    rbac::require_authenticated()?;
    
    rbac::log_rbac_action("get_course_instructors", true, Some(&course_id));
    course_management::get_course_instructors(course_id)
}
