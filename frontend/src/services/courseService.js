// Course Service - Backend Integration
// Handles all course-related API calls to the tenant canister

import apiService from './apiService';
import { userService } from './userService';

class CourseService {
  constructor() {
    this.apiService = apiService;
  }

  // Helper method to call tenant methods with automatic canister ID resolution
  async callTenantMethod(methodName, args = []) {
    try {
      console.log(`[CourseService] Calling ${methodName} with args:`, args);
      const result = await this.apiService.callTenantMethod(methodName, args);
      console.log(`[CourseService] ${methodName} result:`, result);
      return result;
    } catch (error) {
      console.error(`[CourseService] Error calling ${methodName}:`, error);
      throw error;
    }
  }

  // Course Management
  async createCourse(title, description, instructorId) {
    try {
      const result = await this.callTenantMethod('create_course', [title, description, instructorId]);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        throw new Error(result.Err?.message || 'Failed to create course');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      return { success: false, error: error.message };
    }
  }

  async listCourses() {
    try {
      const courses = await this.callTenantMethod('list_courses', []);
      // list_courses returns vec Course directly, not a Result type
      return { success: true, data: courses };
    } catch (error) {
      console.error('Error listing courses:', error);
      return { success: false, error: error.message };
    }
  }

  async getCourse(courseId) {
    try {
      const result = await this.callTenantMethod('get_course', [courseId]);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        throw new Error(result.Err?.message || 'Course not found');
      }
    } catch (error) {
      console.error('Error getting course:', error);
      return { success: false, error: error.message };
    }
  }

  async updateCourse(courseId, title = null, description = null, isPublished = null) {
    try {
      const result = await this.callTenantMethod('update_course', [
        courseId,
        title ? [title] : [],
        description ? [description] : [],
        isPublished !== null ? [isPublished] : []
      ]);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        throw new Error(result.Err?.message || 'Failed to update course');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      return { success: false, error: error.message };
    }
  }

  async enrollStudent(courseId, studentId) {
    try {
      const result = await this.callTenantMethod('enroll_student', [courseId, studentId]);
      
      if ('Ok' in result) {
        return { success: true };
      } else {
        throw new Error(result.Err?.message || 'Failed to enroll student');
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      return { success: false, error: error.message };
    }
  }

  // Student-specific course methods
  // Enrollment Management
  async getStudentCourses(studentId) {
    try {
      const result = await this.callTenantMethod('get_student_courses', [studentId]);
      
      // get_student_courses returns vec Course directly, not a Result type
      return { success: true, data: result };
    } catch (error) {
      console.error('Error getting student courses:', error);
      return { success: false, error: error.message };
    }
  }

  // Get courses for the current authenticated user
  async getCurrentUserCourses() {
    try {
      // First get current user to get their ID and role
      const userResponse = await this.apiService.callTenantMethod('get_current_user', []);
      
      if (!userResponse || !userResponse.Ok) {
        throw new Error('Failed to get current user');
      }
      
      const user = userResponse.Ok;
      const userRole = this.extractRoleString(user.role);
      
      if (userRole === 'Student') {
        // For students, get their enrolled courses
        return await this.getStudentCourses(user.id);
      } else if (userRole === 'Instructor') {
        // For instructors, get courses they teach
        return await this.getInstructorCourses(user.id);
      } else {
        // For admins, get all courses
        return await this.listCourses();
      }
    } catch (error) {
      console.error('Error getting current user courses:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to extract role string (same as in tenantUtils)
  extractRoleString(role) {
    if (!role) return 'Unknown';
    
    if (typeof role === 'string') {
      return role;
    }
    
    if (typeof role === 'object') {
      const roleKeys = Object.keys(role);
      if (roleKeys.length > 0) {
        return roleKeys[0];
      }
    }
    
    return 'Unknown';
  }

  async getCourseStudents(courseId) {
    try {
      const result = await this.callTenantMethod('get_course_students', [courseId]);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        throw new Error(result.Err?.message || 'Failed to get course students');
      }
    } catch (error) {
      console.error('Error getting course students:', error);
      return { success: false, error: error.message };
    }
  }

  async unenrollStudent(courseId, studentId) {
    try {
      const result = await this.callTenantMethod('unenroll_student', [courseId, studentId]);
      
      if ('Ok' in result) {
        return { success: true };
      } else {
        throw new Error(result.Err?.message || 'Failed to unenroll student');
      }
    } catch (error) {
      console.error('Error unenrolling student:', error);
      return { success: false, error: error.message };
    }
  }

  // Instructor-specific course methods
  async getInstructorCourses(instructorId) {
    try {
      const courses = await this.callTenantMethod('get_instructor_courses', [instructorId]);
      // get_instructor_courses returns vec Course directly, not a Result type
      return { success: true, data: courses };
    } catch (error) {
      console.error('Error getting instructor courses:', error);
      return { success: false, error: error.message };
    }
  }

  async addInstructorToCourse(courseId, instructorId) {
    try {
      const result = await this.callTenantMethod('add_instructor_to_course', [courseId, instructorId]);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        throw new Error(result.Err?.message || 'Failed to add instructor');
      }
    } catch (error) {
      console.error('Error adding instructor to course:', error);
      return { success: false, error: error.message };
    }
  }

  async removeInstructorFromCourse(courseId, instructorId) {
    try {
      const result = await this.callTenantMethod('remove_instructor_from_course', [courseId, instructorId]);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        throw new Error(result.Err?.message || 'Failed to remove instructor');
      }
    } catch (error) {
      console.error('Error removing instructor from course:', error);
      return { success: false, error: error.message };
    }
  }

  async getCourseInstructors(courseId) {
    try {
      const result = await this.callTenantMethod('get_course_instructors', [courseId]);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        throw new Error(result.Err?.message || 'Failed to get course instructors');
      }
    } catch (error) {
      console.error('Error getting course instructors:', error);
      return { success: false, error: error.message };
    }
  }

  // Grade-related methods for courses
  async getCourseGrades(courseId) {
    try {
      const grades = await this.callTenantMethod('get_course_grades', [courseId]);
      return { success: true, data: grades };
    } catch (error) {
      console.error('Error getting course grades:', error);
      return { success: false, error: error.message };
    }
  }

  async getStudentGrades(studentId, courseId = null) {
    try {
      const grades = await this.callTenantMethod('get_student_grades_filtered', [
        studentId,
        courseId ? [courseId] : [],
        [],
        false
      ]);
      
      if ('Ok' in grades) {
        return { success: true, data: grades.Ok };
      } else {
        throw new Error(grades.Err?.message || 'Failed to get student grades');
      }
    } catch (error) {
      console.error('Error getting student grades:', error);
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

  // Quiz-related methods for courses
  async getCourseQuizzes(courseId) {
    try {
      // Since there's no direct method, we'll need to get all quizzes and filter by course
      // This would require additional implementation on the backend
      console.warn('getCourseQuizzes not directly available in backend');
      return { success: false, error: 'Method not implemented in backend' };
    } catch (error) {
      console.error('Error getting course quizzes:', error);
      return { success: false, error: error.message };
    }
  }

  // Utility methods
  transformCourseData(backendCourse) {
    return {
      id: backendCourse.id,
      code: backendCourse.id.toUpperCase(), // Using ID as code for now
      title: backendCourse.title,
      description: backendCourse.description,
      instructor_ids: backendCourse.instructor_ids,
      instructor_name: 'Loading...', // Will need to fetch instructor details separately
      credits: 3, // Default, could be added to backend
      semester: 'Current',
      year: new Date().getFullYear(),
      schedule: {
        days: ['Monday', 'Wednesday', 'Friday'],
        start_time: '09:00',
        end_time: '10:00',
        location: 'TBD'
      },
      enrollment_count: backendCourse.enrolled_students?.length || 0,
      max_enrollment: 50, // Default
      status: backendCourse.is_published ? 'active' : 'inactive',
      color: this.generateCourseColor(backendCourse.id),
      created_at: new Date(Number(backendCourse.created_at) / 1000000).toISOString(),
      updated_at: new Date(Number(backendCourse.updated_at) / 1000000).toISOString()
    };
  }

  generateCourseColor(courseId) {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
      '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
    ];
    const hash = courseId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  // User info helpers (delegate to userService)
  async getCurrentUser() {
    return await userService.getCurrentUser();
  }

  // Get user details by ID (delegate to userService)
  async getUser(userId) {
    return await userService.getUser(userId);
  }

  // Enhanced course transformation with instructor name lookup
  async transformCourseDataWithInstructor(backendCourse) {
    const transformedCourse = this.transformCourseData(backendCourse);
    
    // Fetch instructor name if instructor_ids exist
    if (backendCourse.instructor_ids && backendCourse.instructor_ids.length > 0) {
      try {
        const instructorId = backendCourse.instructor_ids[0]; // Take first instructor
        const instructorResult = await this.getUser(instructorId);
        
        if (instructorResult.success && instructorResult.data) {
          transformedCourse.instructor_name = instructorResult.data.name || instructorResult.data.email || 'Unknown Instructor';
        }
      } catch (error) {
        console.warn('Failed to fetch instructor name:', error);
        transformedCourse.instructor_name = 'Unknown Instructor';
      }
    }
    
    return transformedCourse;
  }

  // Batch transform courses with instructor lookup (more efficient)
  async transformCoursesWithInstructors(backendCourses) {
    // Extract all unique instructor IDs
    const instructorIds = [...new Set(
      backendCourses.flatMap(course => course.instructor_ids || [])
    )];

    // Fetch all instructor details in parallel
    const instructorDetails = {};
    await Promise.all(
      instructorIds.map(async (instructorId) => {
        const result = await this.getUser(instructorId);
        if (result.success && result.data) {
          instructorDetails[instructorId] = result.data.name || result.data.email || 'Unknown Instructor';
        } else {
          console.warn(`Failed to fetch instructor ${instructorId}:`, result.error);
          instructorDetails[instructorId] = 'Unknown Instructor';
        }
      })
    );

    // Transform courses with instructor names
    return backendCourses.map(course => {
      const transformedCourse = this.transformCourseData(course);
      
      if (course.instructor_ids && course.instructor_ids.length > 0) {
        const instructorId = course.instructor_ids[0];
        transformedCourse.instructor_name = instructorDetails[instructorId] || 'Unknown Instructor';
      }
      
      return transformedCourse;
    });
  }
}

export const courseService = new CourseService();
