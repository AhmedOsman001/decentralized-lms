import { Actor } from '@dfinity/agent';
import { idlFactory } from '../declarations/tenant_canister';
import { getCurrentTenant } from '../utils/tenantUtils';
import { createActor, getBackendCanisterId } from './actorService';
import { quizService } from './quizService';

class AdminService {
  constructor() {
    this.actor = null;
  }

  async getActor() {
    if (!this.actor) {
      try {
        const canisterId = await getBackendCanisterId();
        this.actor = await createActor(idlFactory, canisterId);
      } catch (error) {
        console.error('Failed to create admin actor:', error);
        throw error;
      }
    }
    return this.actor;
  }

  // User Management
  async listUsers() {
    try {
      const actor = await this.getActor();
      const users = await actor.list_users();
      return { success: true, data: users };
    } catch (error) {
      console.error('Failed to list users:', error);
      return { success: false, error: error.message };
    }
  }

  async getUser(userId) {
    try {
      const actor = await this.getActor();
      const result = await actor.get_user(userId);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to get user:', error);
      return { success: false, error: error.message };
    }
  }

  async registerUser(name, email, universityId, role, tenantId) {
    try {
      const actor = await this.getActor();
      const result = await actor.register_user(name, email, universityId, role, tenantId);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to register user:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUser(userId, name, email, isActive) {
    try {
      const actor = await this.getActor();
      const result = await actor.update_user(
        userId, 
        name ? [name] : [], 
        email ? [email] : [], 
        typeof isActive === 'boolean' ? [isActive] : []
      );
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUserRole(userId, role) {
    try {
      const actor = await this.getActor();
      const result = await actor.update_user_role(userId, role);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      return { success: false, error: error.message };
    }
  }

  async deactivateUser(userId) {
    try {
      const actor = await this.getActor();
      const result = await actor.deactivate_user(userId);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      return { success: false, error: error.message };
    }
  }

  async reactivateUser(userId) {
    try {
      const actor = await this.getActor();
      const result = await actor.reactivate_user(userId);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to reactivate user:', error);
      return { success: false, error: error.message };
    }
  }

  // Course Management
  async listCourses() {
    try {
      const actor = await this.getActor();
      const courses = await actor.list_courses();
      return { success: true, data: courses };
    } catch (error) {
      console.error('Failed to list courses:', error);
      return { success: false, error: error.message };
    }
  }

  async createCourse(title, description, instructorId) {
    try {
      const actor = await this.getActor();
      const result = await actor.create_course(title, description, instructorId);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      return { success: false, error: error.message };
    }
  }

  async updateCourse(courseId, title, description, isPublished) {
    try {
      const actor = await this.getActor();
      const result = await actor.update_course(
        courseId,
        title ? [title] : [],
        description ? [description] : [],
        typeof isPublished === 'boolean' ? [isPublished] : []
      );
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to update course:', error);
      return { success: false, error: error.message };
    }
  }

  async addInstructorToCourse(courseId, instructorId) {
    try {
      const actor = await this.getActor();
      const result = await actor.add_instructor_to_course(courseId, instructorId);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to add instructor to course:', error);
      return { success: false, error: error.message };
    }
  }

  async removeInstructorFromCourse(courseId, instructorId) {
    try {
      const actor = await this.getActor();
      const result = await actor.remove_instructor_from_course(courseId, instructorId);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to remove instructor from course:', error);
      return { success: false, error: error.message };
    }
  }

  // Quiz Management
  async listCourseQuizzes(courseId) {
    try {
      // Use quizService to get course quizzes
      const result = await quizService.getCourseQuizzes(courseId);
      console.log('AdminService: raw result from quizService:', result);
      
      // quizService.getCourseQuizzes already returns {success: true, data: Array} format
      // So we can return it directly
      return result;
    } catch (error) {
      console.error('Failed to list course quizzes:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteQuiz(quizId) {
    try {
      const actor = await this.getActor();
      const result = await actor.delete_quiz(quizId);
      
      if ('Ok' in result) {
        return { success: true };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      return { success: false, error: error.message };
    }
  }

  async getQuizAnalytics(quizId) {
    try {
      const actor = await this.getActor();
      const result = await actor.get_quiz_analytics(quizId);
      
      if ('Ok' in result) {
        return { success: true, data: JSON.parse(result.Ok) };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to get quiz analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // Pre-provisioned Users
  async listPreProvisionedUsers() {
    try {
      const actor = await this.getActor();
      const result = await actor.list_pre_provisioned_users();
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to list pre-provisioned users:', error);
      return { success: false, error: error.message };
    }
  }

  async importUniversityRecords(records) {
    try {
      const actor = await this.getActor();
      const result = await actor.import_university_records(records);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to import university records:', error);
      return { success: false, error: error.message };
    }
  }

  async deletePreProvisionedUser(userId) {
    try {
      const actor = await this.getActor();
      const result = await actor.delete_pre_provisioned_user(userId);
      
      if ('Ok' in result) {
        return { success: true };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to delete pre-provisioned user:', error);
      return { success: false, error: error.message };
    }
  }

  async getImportStatistics() {
    try {
      const actor = await this.getActor();
      const result = await actor.get_import_statistics();
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to get import statistics:', error);
      return { success: false, error: error.message };
    }
  }

  // Analytics and System Information
  async getUserCount() {
    try {
      const actor = await this.getActor();
      const result = await actor.get_user_count();
      
      if ('Ok' in result) {
        return { success: true, data: Number(result.Ok) };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to get user count:', error);
      return { success: false, error: error.message };
    }
  }

  async getTenantInfo() {
    try {
      const actor = await this.getActor();
      const result = await actor.get_tenant_info();
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to get tenant info:', error);
      return { success: false, error: error.message };
    }
  }

  async getStorageStats() {
    try {
      const actor = await this.getActor();
      const result = await actor.get_storage_stats();
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { success: false, error: error.message };
    }
  }

  async cleanupExpiredSessions() {
    try {
      const actor = await this.getActor();
      const result = await actor.cleanup_expired_sessions();
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
      return { success: false, error: error.message };
    }
  }

  // Grade Management
  async getCourseGrades(courseId) {
    try {
      const actor = await this.getActor();
      const grades = await actor.get_course_grades(courseId);
      return { success: true, data: grades };
    } catch (error) {
      console.error('Failed to get course grades:', error);
      return { success: false, error: error.message };
    }
  }

  async getCourseGradeReport(courseId) {
    try {
      const actor = await this.getActor();
      const result = await actor.get_course_grade_report(courseId);
      
      if ('Ok' in result) {
        return { success: true, data: result.Ok };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Failed to get course grade report:', error);
      return { success: false, error: error.message };
    }
  }
}

export const adminService = new AdminService();
