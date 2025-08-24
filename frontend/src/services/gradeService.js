// Grade Service - Backend Integration
// Handles all grade and assignment-related API calls

import apiService from './apiService';

class GradeService {
  constructor() {
    // All tenant interactions will be handled through apiService
  }

  // Helper method to call tenant methods with automatic canister ID resolution
  async callTenantMethod(methodName, args = []) {
    try {
      console.log(`[GradeService] Calling ${methodName} with args:`, args);
      const result = await apiService.callTenantMethod(methodName, args);
      console.log(`[GradeService] ${methodName} result:`, result);
      return result;
    } catch (error) {
      console.error(`[GradeService] Error calling ${methodName}:`, error);
      throw error;
    }
  }

  // Grade Management
  async recordGrade(studentId, courseId, score, maxScore, gradeType, feedback = null) {
    try {
      const result = await this.callTenantMethod('record_grade', [
        studentId,
        courseId,
        score,
        maxScore,
        this.mapGradeType(gradeType),
        feedback ? [feedback] : []
      ]);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        throw new Error(result.Err?.message || 'Failed to record grade');
      }
    } catch (error) {
      console.error('Error recording grade:', error);
      return { success: false, error: error.message };
    }
  }

  async recordQuizGrade(studentId, quizId, courseId, score, maxScore, feedback = null) {
    try {
      const result = await this.callTenantMethod('record_quiz_grade', [
        studentId,
        quizId,
        courseId,
        score,
        maxScore,
        feedback ? [feedback] : []
      ]);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        throw new Error(result.Err?.message || 'Failed to record quiz grade');
      }
    } catch (error) {
      console.error('Error recording quiz grade:', error);
      return { success: false, error: error.message };
    }
  }

  async getStudentGrades(studentId, courseId = null, gradeType = null, includeAll = false) {
    try {
      const result = await this.callTenantMethod('get_student_grades_filtered', [
        studentId,
        courseId ? [courseId] : [],
        gradeType ? [this.mapGradeType(gradeType)] : [],
        includeAll
      ]);
      
      // get_student_grades_filtered returns vec Grade directly, not a Result type
      return { success: true, data: result.map(grade => this.transformGradeData(grade)) };
    } catch (error) {
      console.error('Error getting student grades:', error);
      return { success: false, error: error.message };
    }
  }

  async getCourseGrades(courseId) {
    try {
      const grades = await this.callTenantMethod('get_course_grades', [courseId]);
      return { 
        success: true, 
        data: grades.map(grade => this.transformGradeData(grade))
      };
    } catch (error) {
      console.error('Error getting course grades:', error);
      return { success: false, error: error.message };
    }
  }

  async updateGrade(gradeId, newScore = null, newFeedback = null) {
    try {
      const result = await this.callTenantMethod('update_grade', [
        gradeId,
        newScore !== null ? [newScore] : [],
        newFeedback ? [newFeedback] : []
      ]);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        throw new Error(result.Err?.message || 'Failed to update grade');
      }
    } catch (error) {
      console.error('Error updating grade:', error);
      return { success: false, error: error.message };
    }
  }

  async calculateCourseAverage(courseId, studentId) {
    try {
      const average = await this.callTenantMethod('calculate_course_average', [courseId, studentId]);
      return { success: true, data: average };
    } catch (error) {
      console.error('Error calculating course average:', error);
      return { success: false, error: error.message };
    }
  }

  async calculateWeightedAverage(courseId, studentId, weights) {
    try {
      const weightedGrades = weights.map(w => [this.mapGradeType(w.type), w.weight]);
      const average = await this.callTenantMethod('calculate_weighted_average', [courseId, studentId, weightedGrades]);
      return { success: true, data: average };
    } catch (error) {
      console.error('Error calculating weighted average:', error);
      return { success: false, error: error.message };
    }
  }

  async getCourseGradeReport(courseId) {
    try {
      const result = await this.callTenantMethod('get_course_grade_report', [courseId]);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        throw new Error(result.Err?.message || 'Failed to get grade report');
      }
    } catch (error) {
      console.error('Error getting course grade report:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteGrade(gradeId, reason) {
    try {
      const result = await this.callTenantMethod('delete_grade_with_reason', [gradeId, reason]);
      
      if ('Ok' in result) {
        return { success: true };
      } else {
        throw new Error(result.Err?.message || 'Failed to delete grade');
      }
    } catch (error) {
      console.error('Error deleting grade:', error);
      return { success: false, error: error.message };
    }
  }

  // Utility methods
  mapGradeType(type) {
    const typeMap = {
      'assignment': { 'Assignment': null },
      'quiz': { 'Quiz': null },
      'final': { 'Final': null },
      'participation': { 'Participation': null }
    };
    return typeMap[type?.toLowerCase()] || { 'Assignment': null };
  }

  reverseMapGradeType(backendType) {
    if ('Assignment' in backendType) return 'assignment';
    if ('Quiz' in backendType) return 'quiz';
    if ('Final' in backendType) return 'final';
    if ('Participation' in backendType) return 'participation';
    return 'assignment';
  }

  transformGradeData(backendGrade) {
    return {
      id: backendGrade.id,
      student_id: backendGrade.student_id,
      course_id: backendGrade.course_id,
      quiz_id: backendGrade.quiz_id?.[0] || null,
      lesson_id: backendGrade.lesson_id?.[0] || null,
      score: backendGrade.score,
      max_score: backendGrade.max_score,
      percentage: Math.round((backendGrade.score / backendGrade.max_score) * 100),
      grade_type: this.reverseMapGradeType(backendGrade.grade_type),
      feedback: backendGrade.feedback?.[0] || null,
      graded_by: backendGrade.graded_by,
      graded_at: new Date(Number(backendGrade.graded_at) / 1000000).toISOString(),
      letter_grade: this.calculateLetterGrade(backendGrade.score, backendGrade.max_score)
    };
  }

  calculateLetterGrade(score, maxScore) {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
  }

  // Transform grades into assignment format for UI display
  transformGradesToAssignments(grades, course) {
    if (!grades || grades.length === 0) return [];
    
    return grades.map(grade => {
      const transformedGrade = this.transformGradeData(grade);
      
      return {
        id: transformedGrade.id,
        course_id: transformedGrade.course_id,
        course_code: course?.code || course?.id || 'Unknown',
        course_title: course?.title || 'Unknown Course',
        title: this.generateAssignmentTitle(transformedGrade.grade_type, transformedGrade.quiz_id, transformedGrade.lesson_id),
        description: transformedGrade.feedback || `${transformedGrade.grade_type} assignment`,
        type: transformedGrade.grade_type,
        due_date: transformedGrade.graded_at,
        max_score: transformedGrade.max_score,
        status: 'graded',
        grade: transformedGrade.score,
        percentage: transformedGrade.percentage,
        letter_grade: transformedGrade.letter_grade,
        feedback: transformedGrade.feedback,
        submitted_at: transformedGrade.graded_at,
        graded_at: transformedGrade.graded_at,
        graded_by: transformedGrade.graded_by
      };
    });
  }

  // Generate mock assignments based on grades
  generateAssignmentsFromGrades(grades) {
    const assignments = [];
    const assignmentMap = new Map();

    grades.forEach(grade => {
      const key = `${grade.course_id}-${grade.grade_type}-${grade.quiz_id || grade.lesson_id || 'general'}`;
      
      if (!assignmentMap.has(key)) {
        const assignment = {
          id: grade.id,
          course_id: grade.course_id,
          title: this.generateAssignmentTitle(grade.grade_type, grade.quiz_id, grade.lesson_id),
          description: grade.feedback || `${grade.grade_type} assignment`,
          type: grade.grade_type,
          due_date: grade.graded_at,
          max_score: grade.max_score,
          status: 'graded',
          grade: grade.score,
          feedback: grade.feedback,
          submitted_at: grade.graded_at
        };
        
        assignments.push(assignment);
        assignmentMap.set(key, assignment);
      }
    });

    return assignments;
  }

  generateAssignmentTitle(gradeType, quizId, lessonId) {
    const typeNames = {
      'assignment': 'Assignment',
      'quiz': 'Quiz',
      'final': 'Final Exam',
      'participation': 'Participation'
    };
    
    const baseName = typeNames[gradeType] || 'Assignment';
    
    if (quizId) return `${baseName} - ${quizId}`;
    if (lessonId) return `${baseName} - Lesson ${lessonId}`;
    
    return baseName;
  }
}

export const gradeService = new GradeService();
