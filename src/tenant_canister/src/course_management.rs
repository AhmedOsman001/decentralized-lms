use ic_cdk::caller;
use shared::{Course, LMSResult, LMSError, utils};
use crate::storage::{COURSES, get_tenant_id};

/// Helper function to check if caller can modify a specific course
/// Returns true if caller is either an instructor of the course or an admin
fn can_modify_course(course: &Course) -> bool {
    let caller = caller();
    // Check if caller is one of the course instructors
    if course.instructor_ids.contains(&caller.to_string()) {
        return true;
    }
    // Check if caller is admin
    crate::rbac::is_admin_compat().is_ok()
}

/// Create a new course
pub fn create_course(id: String, title: String, description: String) -> LMSResult<Course> {
    let tenant_id = get_tenant_id()?;
    let caller = caller();
    
    COURSES.with(|courses| {
        let mut courses_map = courses.borrow_mut();
        
        // Check if course already exists
        if courses_map.contains_key(&id) {
            return Err(LMSError::AlreadyExists("Course already exists".to_string()));
        }
        
        let course = Course {
            id: id.clone(),
            title,
            description,
            instructor_ids: vec![caller.to_string()], // Initialize with creator as first instructor
            tenant_id,
            lessons: Vec::new(),
            enrolled_students: Vec::new(),
            created_at: utils::current_time(),
            updated_at: utils::current_time(),
            is_published: false,
        };
        
        courses_map.insert(id, course.clone());
        ic_cdk::println!("Course created: {}", course.id);
        Ok(course)
    })
}

/// List all courses
pub fn list_courses() -> Vec<Course> {
    COURSES.with(|courses| {
        courses.borrow().iter().map(|(_, course)| course).collect()
    })
}

/// Get a specific course by ID
pub fn get_course(course_id: String) -> LMSResult<Course> {
    COURSES.with(|courses| {
        courses.borrow()
            .get(&course_id)
            .ok_or_else(|| LMSError::NotFound("Course not found".to_string()))
    })
}

/// Enroll a student in a course
/// Caller must be verified by API layer before calling this function
pub fn enroll_student(course_id: String, student_id: String) -> LMSResult<()> {
    COURSES.with(|courses| {
        let mut courses_map = courses.borrow_mut();
        
        match courses_map.get(&course_id) {
            Some(mut course) => {
                // Course-specific authorization: only course instructors or admins can enroll
                if !can_modify_course(&course) {
                    return Err(LMSError::Unauthorized("Only course instructors or admin can enroll students".to_string()));
                }
                
                if !course.enrolled_students.contains(&student_id) {
                    course.enrolled_students.push(student_id.clone());
                    course.updated_at = utils::current_time();
                    let course_id_clone = course_id.clone();
                    courses_map.insert(course_id, course);
                    ic_cdk::println!("Student {} enrolled in course {}", student_id, course_id_clone);
                    Ok(())
                } else {
                    Err(LMSError::AlreadyExists("Student already enrolled".to_string()))
                }
            }
            None => Err(LMSError::NotFound("Course not found".to_string()))
        }
    })
}

/// Update course information
/// Caller must be verified by API layer before calling this function
pub fn update_course(course_id: String, title: Option<String>, description: Option<String>, is_published: Option<bool>) -> LMSResult<Course> {
    COURSES.with(|courses| {
        let mut courses_map = courses.borrow_mut();
        
        match courses_map.get(&course_id) {
            Some(mut course) => {
                // Course-specific authorization: only course instructors or admins can update
                if !can_modify_course(&course) {
                    return Err(LMSError::Unauthorized("Only course instructors or admin can update course".to_string()));
                }
                
                if let Some(new_title) = title {
                    course.title = new_title;
                }
                if let Some(new_description) = description {
                    course.description = new_description;
                }
                if let Some(published) = is_published {
                    course.is_published = published;
                }
                course.updated_at = utils::current_time();
                
                courses_map.insert(course_id, course.clone());
                Ok(course)
            }
            None => Err(LMSError::NotFound("Course not found".to_string()))
        }
    })
}

/// Get courses for a specific instructor
pub fn get_instructor_courses(instructor_id: String) -> Vec<Course> {
    COURSES.with(|courses| {
        courses.borrow()
            .iter()
            .filter(|(_, course)| course.instructor_ids.contains(&instructor_id))
            .map(|(_, course)| course)
            .collect()
    })
}

/// Get courses a student is enrolled in
pub fn get_student_courses(student_id: String) -> Vec<Course> {
    COURSES.with(|courses| {
        courses.borrow()
            .iter()
            .filter(|(_, course)| course.enrolled_students.contains(&student_id))
            .map(|(_, course)| course)
            .collect()
    })
}

/// Add an instructor to a course
/// Caller must be verified by API layer before calling this function  
pub fn add_instructor_to_course(course_id: String, new_instructor_id: String) -> LMSResult<Course> {
    COURSES.with(|courses| {
        let mut courses_map = courses.borrow_mut();
        
        match courses_map.get(&course_id) {
            Some(mut course) => {
                // Course-specific authorization: only course instructors or admins can add instructors
                if !can_modify_course(&course) {
                    return Err(LMSError::Unauthorized("Only current instructors or admin can add new instructors".to_string()));
                }
                
                // Add the new instructor to the list (avoiding duplicates)
                if !course.instructor_ids.contains(&new_instructor_id) {
                    course.instructor_ids.push(new_instructor_id.clone());
                    course.updated_at = utils::current_time();
                    let updated_course = course.clone();
                    courses_map.insert(course_id.clone(), course);
                    ic_cdk::println!("Added instructor {} to course {}", new_instructor_id, course_id);
                    Ok(updated_course)
                } else {
                    Err(LMSError::AlreadyExists("Instructor already assigned to this course".to_string()))
                }
            }
            None => Err(LMSError::NotFound("Course not found".to_string()))
        }
    })
}

/// Remove an instructor from a course
/// Caller must be verified by API layer before calling this function
pub fn remove_instructor_from_course(course_id: String, instructor_id: String) -> LMSResult<Course> {
    COURSES.with(|courses| {
        let mut courses_map = courses.borrow_mut();
        
        match courses_map.get(&course_id) {
            Some(mut course) => {
                // Course-specific authorization: only course instructors or admins can remove instructors
                if !can_modify_course(&course) {
                    return Err(LMSError::Unauthorized("Only current instructors or admin can remove instructors".to_string()));
                }
                
                // Ensure at least one instructor remains
                if course.instructor_ids.len() <= 1 {
                    return Err(LMSError::ValidationError("Course must have at least one instructor".to_string()));
                }
                
                // Remove the instructor from the list
                if let Some(pos) = course.instructor_ids.iter().position(|x| *x == instructor_id) {
                    course.instructor_ids.remove(pos);
                    course.updated_at = utils::current_time();
                    let updated_course = course.clone();
                    courses_map.insert(course_id.clone(), course);
                    ic_cdk::println!("Removed instructor {} from course {}", instructor_id, course_id);
                    Ok(updated_course)
                } else {
                    Err(LMSError::NotFound("Instructor not found in this course".to_string()))
                }
            }
            None => Err(LMSError::NotFound("Course not found".to_string()))
        }
    })
}

/// Get all instructors for a course
pub fn get_course_instructors(course_id: String) -> LMSResult<Vec<String>> {
    COURSES.with(|courses| {
        match courses.borrow().get(&course_id) {
            Some(course) => Ok(course.instructor_ids.clone()),
            None => Err(LMSError::NotFound("Course not found".to_string()))
        }
    })
}
