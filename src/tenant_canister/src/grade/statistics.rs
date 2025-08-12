// Grade Statistics Module
// Handles statistical calculations and reporting

use shared::Grade;
use std::collections::HashMap;
use super::types::{GradeStatistics, CourseGradeReport, WeightedGradeResult, GradeTypeBreakdown};
use super::weights::GradeWeights;
use super::core::get_student_grades;
use shared::{GradeType, LMSError, LMSResult};

/// Calculate comprehensive grade statistics
pub fn calculate_grade_statistics(grades: &[Grade]) -> GradeStatistics {
    if grades.is_empty() {
        return GradeStatistics::default();
    }
    
    let percentages: Vec<f64> = grades.iter()
        .map(|g| (g.score / g.max_score) * 100.0)
        .collect();
    
    let mean = percentages.iter().sum::<f64>() / percentages.len() as f64;
    
    let variance = percentages.iter()
        .map(|&x| (x - mean).powi(2))
        .sum::<f64>() / percentages.len() as f64;
    
    let std_dev = variance.sqrt();
    
    let mut sorted_percentages = percentages.clone();
    sorted_percentages.sort_by(|a, b| a.partial_cmp(b).unwrap());
    
    let median = if sorted_percentages.len() % 2 == 0 {
        let mid = sorted_percentages.len() / 2;
        (sorted_percentages[mid - 1] + sorted_percentages[mid]) / 2.0
    } else {
        sorted_percentages[sorted_percentages.len() / 2]
    };
    
    GradeStatistics {
        mean,
        median,
        std_deviation: std_dev,
        min: sorted_percentages.first().copied().unwrap_or(0.0),
        max: sorted_percentages.last().copied().unwrap_or(0.0),
        count: grades.len(),
    }
}

/// Calculate letter grade distribution
pub fn calculate_letter_grade_distribution(grades: &[Grade]) -> HashMap<String, usize> {
    let mut distribution = HashMap::new();
    
    for grade in grades {
        let percentage = (grade.score / grade.max_score) * 100.0;
        let letter = calculate_letter_grade(percentage);
        *distribution.entry(letter).or_insert(0) += 1;
    }
    
    distribution
}

/// Calculate letter grade from percentage
pub fn calculate_letter_grade(percentage: f64) -> String {
    match percentage {
        p if p >= 97.0 => "A+".to_string(),
        p if p >= 93.0 => "A".to_string(),
        p if p >= 90.0 => "A-".to_string(),
        p if p >= 87.0 => "B+".to_string(),
        p if p >= 83.0 => "B".to_string(),
        p if p >= 80.0 => "B-".to_string(),
        p if p >= 77.0 => "C+".to_string(),
        p if p >= 73.0 => "C".to_string(),
        p if p >= 70.0 => "C-".to_string(),
        p if p >= 67.0 => "D+".to_string(),
        p if p >= 63.0 => "D".to_string(),
        p if p >= 60.0 => "D-".to_string(),
        _ => "F".to_string(),
    }
}

/// Calculate average for a specific grade type
pub fn calculate_type_average(grades: &[&Grade]) -> f64 {
    if grades.is_empty() {
        return 0.0;
    }
    
    let total: f64 = grades.iter()
        .map(|g| (g.score / g.max_score) * 100.0)
        .sum();
    
    total / grades.len() as f64
}

/// Calculate weighted course average with sophisticated algorithm
pub fn calculate_weighted_course_average(
    student_id: String,
    course_id: String,
    weights: Option<GradeWeights>,
) -> LMSResult<WeightedGradeResult> {
    let grade_weights = weights.unwrap_or_default();
    let student_grades = get_student_grades(student_id.clone(), Some(course_id.clone()), None, false);
    
    if student_grades.is_empty() {
        return Err(LMSError::NotFound("No grades found for student in this course".to_string()));
    }
    
    // Group grades by type
    let mut grade_groups: HashMap<GradeType, Vec<&Grade>> = HashMap::new();
    for grade in &student_grades {
        grade_groups.entry(grade.grade_type.clone()).or_insert_with(Vec::new).push(grade);
    }
    
    let mut weighted_total = 0.0;
    let mut total_weight = 0.0;
    let mut grade_breakdown = HashMap::new();
    
    // Calculate weighted averages for each grade type
    for (grade_type, grades) in grade_groups {
        let type_average = calculate_type_average(&grades);
        let weight = grade_weights.get_weight(&grade_type);
        
        if weight > 0.0 {
            weighted_total += type_average * weight;
            total_weight += weight;
            
            grade_breakdown.insert(grade_type, GradeTypeBreakdown {
                average: type_average,
                weight,
                count: grades.len(),
                letter_grade: calculate_letter_grade(type_average),
            });
        }
    }
    
    let final_average = if total_weight > 0.0 {
        weighted_total / total_weight
    } else {
        0.0
    };
    
    Ok(WeightedGradeResult {
        student_id,
        course_id,
        final_average,
        letter_grade: calculate_letter_grade(final_average),
        grade_breakdown,
        total_weight_used: total_weight,
    })
}

/// Simple average calculation for backward compatibility
pub fn calculate_course_average(student_id: String, course_id: String) -> Option<f64> {
    let grades = get_student_grades(student_id, Some(course_id), None, false);
    
    if grades.is_empty() {
        return None;
    }
    
    let total_weighted_score: f64 = grades.iter()
        .map(|grade| (grade.score / grade.max_score) * 100.0)
        .sum();
    
    Some(total_weighted_score / grades.len() as f64)
}

/// Get comprehensive course grades with statistics
pub fn get_course_grades_with_stats(course_id: String) -> LMSResult<CourseGradeReport> {
    // Validate permissions - only instructors and admins
    super::validation::validate_grading_permissions(&course_id)?;
    
    let grades = super::core::get_course_grades(course_id.clone());
    
    if grades.is_empty() {
        return Ok(CourseGradeReport {
            course_id,
            total_grades: 0,
            grades,
            statistics: GradeStatistics::default(),
            letter_grade_distribution: HashMap::new(),
        });
    }
    
    let statistics = calculate_grade_statistics(&grades);
    let letter_distribution = calculate_letter_grade_distribution(&grades);
    
    Ok(CourseGradeReport {
        course_id,
        total_grades: grades.len(),
        grades,
        statistics,
        letter_grade_distribution: letter_distribution,
    })
}
