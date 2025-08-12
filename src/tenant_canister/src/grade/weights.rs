// Grade Weight Management Module
// Handles grade weight configurations and utilities

use shared::GradeType;

/// Grade weight configuration for different grade types
#[derive(Debug, Clone)]
pub struct GradeWeights {
    pub quiz_weight: f64,
    pub assignment_weight: f64,
    pub participation_weight: f64,
    pub final_weight: f64,
    pub midterm_weight: f64,
    pub project_weight: f64,
}

impl Default for GradeWeights {
    fn default() -> Self {
        Self {
            quiz_weight: 0.2,
            assignment_weight: 0.3,
            participation_weight: 0.1,
            final_weight: 0.25,
            midterm_weight: 0.15,
            project_weight: 0.0,
        }
    }
}

impl GradeWeights {
    /// Create a new GradeWeights configuration
    pub fn new(
        quiz: f64,
        assignment: f64,
        participation: f64,
        final_exam: f64,
        midterm: f64,
        project: f64,
    ) -> Self {
        Self {
            quiz_weight: quiz,
            assignment_weight: assignment,
            participation_weight: participation,
            final_weight: final_exam,
            midterm_weight: midterm,
            project_weight: project,
        }
    }
    
    /// Validate that weights sum to approximately 1.0
    pub fn validate(&self) -> Result<(), String> {
        let total = self.quiz_weight + self.assignment_weight + self.participation_weight
            + self.final_weight + self.midterm_weight + self.project_weight;
        
        if (total - 1.0).abs() > 0.01 {
            return Err(format!("Grade weights must sum to 1.0, got {:.2}", total));
        }
        
        Ok(())
    }
    
    /// Get weight for specific grade type
    pub fn get_weight(&self, grade_type: &GradeType) -> f64 {
        match grade_type {
            GradeType::Quiz => self.quiz_weight,
            GradeType::Assignment => self.assignment_weight,
            GradeType::Participation => self.participation_weight,
            GradeType::Final => self.final_weight,
            GradeType::Midterm => self.midterm_weight,
            GradeType::Project => self.project_weight,
            GradeType::Lab => self.assignment_weight, // Use assignment weight for labs
            GradeType::Homework => self.assignment_weight, // Use assignment weight for homework
            GradeType::ExtraCredit => 0.0, // Extra credit doesn't count toward weighted average
        }
    }
}
