// Grade Management Data Types
// Data structures and type definitions for grade management

use shared::{Grade, GradeType};
use std::collections::HashMap;

/// Course grade report with comprehensive statistics
#[derive(Debug, Clone)]
#[allow(dead_code)] // Fields are used via serialization/API responses
pub struct CourseGradeReport {
    pub course_id: String,
    pub total_grades: usize,
    pub grades: Vec<Grade>,
    pub statistics: GradeStatistics,
    pub letter_grade_distribution: HashMap<String, usize>,
}

/// Statistical data for grades
#[derive(Debug, Clone)]
#[allow(dead_code)] // Fields are used via serialization/API responses
pub struct GradeStatistics {
    pub mean: f64,
    pub median: f64,
    pub std_deviation: f64,
    pub min: f64,
    pub max: f64,
    pub count: usize,
}

impl Default for GradeStatistics {
    fn default() -> Self {
        Self {
            mean: 0.0,
            median: 0.0,
            std_deviation: 0.0,
            min: 0.0,
            max: 0.0,
            count: 0,
        }
    }
}

/// Weighted grade calculation result
#[derive(Debug, Clone)]
#[allow(dead_code)] // Fields are used via serialization/API responses
pub struct WeightedGradeResult {
    pub student_id: String,
    pub course_id: String,
    pub final_average: f64,
    pub letter_grade: String,
    pub grade_breakdown: HashMap<GradeType, GradeTypeBreakdown>,
    pub total_weight_used: f64,
}

/// Breakdown for each grade type in weighted calculation
#[derive(Debug, Clone)]
#[allow(dead_code)] // Fields are used via serialization/API responses
pub struct GradeTypeBreakdown {
    pub average: f64,
    pub weight: f64,
    pub count: usize,
    pub letter_grade: String,
}

/// Entry for bulk grade import
#[derive(Debug, Clone)]
pub struct BulkGradeEntry {
    pub student_id: String,
    pub course_id: String,
    pub score: f64,
    pub max_score: f64,
    pub grade_type: GradeType,
    pub feedback: Option<String>,
}

/// Result of bulk grade import operation
#[derive(Debug, Clone)]
#[allow(dead_code)] // Fields are used via serialization/API responses
pub struct BulkImportResult {
    pub success_count: usize,
    pub error_count: usize,
    pub errors: Vec<BulkImportError>,
}

/// Error encountered during bulk import
#[derive(Debug, Clone)]
#[allow(dead_code)] // Fields are used via serialization/API responses
pub struct BulkImportError {
    pub row_index: usize,
    pub error: String,
}
