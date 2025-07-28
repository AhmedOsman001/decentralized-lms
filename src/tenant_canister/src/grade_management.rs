use ic_cdk::caller;
use shared::{Grade, GradeType, LMSResult, LMSError, utils};
use crate::storage::GRADES;

/// Record a grade for a student
pub fn record_grade(
    student_id: String,
    course_id: String,
    score: f64,
    max_score: f64,
    grade_type: GradeType,
    feedback: Option<String>,
) -> LMSResult<Grade> {
    // Verify caller is an instructor for this specific course or admin
    let caller = caller();
    crate::storage::COURSES.with(|courses| {
        match courses.borrow().get(&course_id) {
            Some(course) => {
                if !course.instructor_ids.contains(&caller.to_string()) {
                    // Check if admin
                    if crate::auth::is_admin().is_err() {
                        return Err(LMSError::Unauthorized("Only course instructors or admin can record grades".to_string()));
                    }
                }
                Ok(())
            }
            None => Err(LMSError::NotFound("Course not found".to_string()))
        }
    })?;
    
    let grader = caller;
    let grade_id = utils::generate_id("grade");
    
    GRADES.with(|grades| {
        let mut grades_map = grades.borrow_mut();
        
        let grade = Grade {
            id: grade_id.clone(),
            student_id,
            quiz_id: None,
            lesson_id: None,
            course_id,
            score,
            max_score,
            grade_type,
            feedback,
            graded_by: grader.to_string(),
            graded_at: utils::current_time(),
        };
        
        grades_map.insert(grade_id, grade.clone());
        ic_cdk::println!("Grade recorded: {}", grade.id);
        Ok(grade)
    })
}

/// Record a quiz grade
pub fn record_quiz_grade(
    student_id: String,
    course_id: String,
    quiz_id: String,
    score: f64,
    max_score: f64,
    feedback: Option<String>,
) -> LMSResult<Grade> {
    // Verify caller is an instructor for this specific course or admin
    let caller = caller();
    crate::storage::COURSES.with(|courses| {
        match courses.borrow().get(&course_id) {
            Some(course) => {
                if !course.instructor_ids.contains(&caller.to_string()) {
                    // Check if admin
                    if crate::auth::is_admin().is_err() {
                        return Err(LMSError::Unauthorized("Only course instructors or admin can record quiz grades".to_string()));
                    }
                }
                Ok(())
            }
            None => Err(LMSError::NotFound("Course not found".to_string()))
        }
    })?;
    
    let grader = caller;
    let grade_id = utils::generate_id("grade");
    
    GRADES.with(|grades| {
        let mut grades_map = grades.borrow_mut();
        
        let grade = Grade {
            id: grade_id.clone(),
            student_id,
            quiz_id: Some(quiz_id),
            lesson_id: None,
            course_id,
            score,
            max_score,
            grade_type: GradeType::Quiz,
            feedback,
            graded_by: grader.to_string(),
            graded_at: utils::current_time(),
        };
        
        grades_map.insert(grade_id, grade.clone());
        ic_cdk::println!("Quiz grade recorded: {}", grade.id);
        Ok(grade)
    })
}

/// Get all grades for a student
pub fn get_student_grades(student_id: String) -> Vec<Grade> {
    GRADES.with(|grades| {
        grades.borrow()
            .iter()
            .filter(|(_, grade)| grade.student_id == student_id)
            .map(|(_, grade)| grade)
            .collect()
    })
}

/// Get all grades for a course
pub fn get_course_grades(course_id: String) -> Vec<Grade> {
    GRADES.with(|grades| {
        grades.borrow()
            .iter()
            .filter(|(_, grade)| grade.course_id == course_id)
            .map(|(_, grade)| grade)
            .collect()
    })
}

/// Get a specific grade by ID
pub fn get_grade(grade_id: String) -> LMSResult<Grade> {
    GRADES.with(|grades| {
        grades.borrow()
            .get(&grade_id)
            .ok_or_else(|| LMSError::NotFound("Grade not found".to_string()))
    })
}

/// Update a grade
pub fn update_grade(grade_id: String, score: Option<f64>, feedback: Option<String>) -> LMSResult<Grade> {
    let caller = caller();
    
    GRADES.with(|grades| {
        let mut grades_map = grades.borrow_mut();
        
        match grades_map.get(&grade_id) {
            Some(mut grade) => {
                // Verify caller is an instructor for this specific course or admin
                let course_id = grade.course_id.clone();
                crate::storage::COURSES.with(|courses| {
                    match courses.borrow().get(&course_id) {
                        Some(course) => {
                            if !course.instructor_ids.contains(&caller.to_string()) {
                                // Check if admin
                                if crate::auth::is_admin().is_err() {
                                    return Err(LMSError::Unauthorized("Only course instructors or admin can update grades".to_string()));
                                }
                            }
                            Ok(())
                        }
                        None => Err(LMSError::NotFound("Course not found".to_string()))
                    }
                })?;
                
                if let Some(new_score) = score {
                    grade.score = new_score;
                }
                if let Some(new_feedback) = feedback {
                    grade.feedback = Some(new_feedback);
                }
                grade.graded_at = utils::current_time();
                grade.graded_by = caller.to_string();
                
                grades_map.insert(grade_id, grade.clone());
                Ok(grade)
            }
            None => Err(LMSError::NotFound("Grade not found".to_string()))
        }
    })
}

/// Calculate average grade for a student in a course
pub fn calculate_course_average(student_id: String, course_id: String) -> Option<f64> {
    let grades = get_student_grades(student_id);
    let course_grades: Vec<&Grade> = grades.iter()
        .filter(|grade| grade.course_id == course_id)
        .collect();
    
    if course_grades.is_empty() {
        return None;
    }
    
    let total_weighted_score: f64 = course_grades.iter()
        .map(|grade| (grade.score / grade.max_score) * 100.0)
        .sum();
    
    Some(total_weighted_score / course_grades.len() as f64)
}
