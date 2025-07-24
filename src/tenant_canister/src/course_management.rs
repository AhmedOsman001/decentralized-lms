use ic_cdk::caller;
use shared::{Course, LMSResult, LMSError, utils};
use crate::storage::{COURSES, get_tenant_id};
use crate::auth::is_teacher_or_admin;

/// Create a new course
pub fn create_course(id: String, title: String, description: String) -> LMSResult<Course> {
    // Only teachers and admins can create courses
    is_teacher_or_admin()?;
    
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
            instructor_id: caller.to_string(),
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
pub fn enroll_student(course_id: String, student_id: String) -> LMSResult<()> {
    // Only admins and instructors can enroll students
    is_teacher_or_admin()?;
    
    COURSES.with(|courses| {
        let mut courses_map = courses.borrow_mut();
        
        match courses_map.get(&course_id) {
            Some(mut course) => {
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
pub fn update_course(course_id: String, title: Option<String>, description: Option<String>, is_published: Option<bool>) -> LMSResult<Course> {
    is_teacher_or_admin()?;
    
    COURSES.with(|courses| {
        let mut courses_map = courses.borrow_mut();
        
        match courses_map.get(&course_id) {
            Some(mut course) => {
                // Check if caller is the instructor or admin
                let caller = caller();
                if course.instructor_id != caller.to_string() {
                    // Check if admin
                    if crate::auth::is_admin().is_err() {
                        return Err(LMSError::Unauthorized("Only course instructor or admin can update course".to_string()));
                    }
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
            .filter(|(_, course)| course.instructor_id == instructor_id)
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
