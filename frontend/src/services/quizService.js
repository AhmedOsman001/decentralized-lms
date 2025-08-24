// Quiz Service - Backend Integration
// Handles all quiz-related API calls

import apiService from './apiService';

class QuizService {
  constructor() {
    // All tenant interactions will be handled through apiService
  }

  // Helper method to call tenant methods with automatic canister ID resolution
  async callTenantMethod(methodName, args = []) {
    try {
      console.log(`[QuizService] Calling ${methodName} with args:`, args);
      const result = await apiService.callTenantMethod(methodName, args);
      console.log(`[QuizService] ${methodName} result:`, result);
      return result;
    } catch (error) {
      console.error(`[QuizService] Error calling ${methodName}:`, error);
      throw error;
    }
  }



  async getCourseQuizzes(courseId) {
    try {
      // For now, we'll use a workaround to get all quizzes and filter by course
      // This should be replaced with a dedicated backend method like 'get_course_quizzes'
      const result = await this.callTenantMethod('list_course_quizzes', [courseId]);
      
      if ('Ok' in result) {
        return { 
          success: true, 
          data: result.Ok.map(quiz => this.transformQuizData(quiz))
        };
      } else {
        // If the method doesn't exist, return empty array for now
        console.warn('Backend method list_course_quizzes not available');
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('Error getting course quizzes:', error);
      // For development, return empty array instead of error
      return { success: true, data: [] };
    }
  }

  // Quiz Attempt Methods
  async startQuizAttempt(quizId) {
    try {
      const result = await this.callTenantMethod('start_quiz_attempt', [quizId]);
      
      if ('Ok' in result) {
        return {
          success: true,
          data: this.transformQuizAttemptData(result.Ok)
        };
      } else {
        return {
          success: false,
          error: result.Err?.ValidationError || result.Err?.NotFound || 'Failed to start quiz attempt'
        };
      }
    } catch (error) {
      console.error('Error starting quiz attempt:', error);
      return {
        success: false,
        error: error.message || 'Failed to start quiz attempt'
      };
    }
  }

  async submitQuizAttempt(attemptId, answers) {
    try {
      const formattedAnswers = answers.map(answer => this.formatAnswer(answer));
      const result = await this.callTenantMethod('submit_quiz_attempt', [attemptId, formattedAnswers]);
      
      if ('Ok' in result) {
        return {
          success: true,
          data: this.transformQuizAttemptData(result.Ok)
        };
      } else {
        return {
          success: false,
          error: result.Err?.ValidationError || result.Err?.NotFound || 'Failed to submit quiz attempt'
        };
      }
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit quiz attempt'
      };
    }
  }

  async getQuizWithProgress(quizId) {
    try {
      const result = await this.callTenantMethod('get_quiz_with_progress', [quizId]);
      
      if ('Ok' in result) {
        const [quiz, attempts] = result.Ok;
        return {
          success: true,
          data: {
            quiz: this.transformQuizData(quiz),
            attempts: attempts.map(attempt => this.transformQuizAttemptData(attempt))
          }
        };
      } else {
        return {
          success: false,
          error: result.Err?.NotFound || 'Quiz not found'
        };
      }
    } catch (error) {
      console.error('Error getting quiz with progress:', error);
      return {
        success: false,
        error: error.message || 'Failed to get quiz'
      };
    }
  }



  // Utility Methods
  formatQuestion(question) {
    let questionType;
    
    switch (question.type) {
      case 'multiple_choice':
        questionType = {
          'MultipleChoice': {
            options: question.options,
            correct_answer: BigInt(question.correctAnswer)
          }
        };
        break;
      case 'true_false':
        questionType = {
          'TrueFalse': {
            correct_answer: question.correctAnswer
          }
        };
        break;
      case 'short_answer':
        questionType = {
          'ShortAnswer': {
            sample_answer: question.sampleAnswer || ''
          }
        };
        break;
      case 'essay':
        questionType = {
          'Essay': {
            max_words: question.maxWords ? [question.maxWords] : []
          }
        };
        break;
      default:
        questionType = {
          'ShortAnswer': {
            sample_answer: ''
          }
        };
    }

    return {
      id: question.id || this.generateQuestionId(),
      question_text: question.text,
      question_type: questionType,
      points: question.points || 1
    };
  }

  formatAnswer(answer) {
    return {
      question_id: answer.questionId,
      answer_text: answer.answerText || answer.text || '',
      selected_options: answer.selectedOptions || [],
      is_correct: [] // Will be determined by backend
    };
  }

  transformQuizAttemptData(backendAttempt) {
    return {
      id: backendAttempt.id,
      quiz_id: backendAttempt.quiz_id,
      student_id: backendAttempt.student_id,
      answers: backendAttempt.answers.map(answer => ({
        question_id: answer.question_id,
        answer_text: answer.answer_text,
        selected_options: answer.selected_options,
        is_correct: answer.is_correct?.[0] || null
      })),
      score: backendAttempt.score?.[0] || null,
      started_at: new Date(Number(backendAttempt.started_at) / 1000000).toISOString(),
      submitted_at: backendAttempt.submitted_at?.[0] ? 
        new Date(Number(backendAttempt.submitted_at[0]) / 1000000).toISOString() : null,
      time_remaining: backendAttempt.time_remaining?.[0] || null
    };
  }

  transformQuizData(backendQuiz) {
    return {
      id: backendQuiz.id,
      title: backendQuiz.title,
      description: backendQuiz.description,
      course_id: backendQuiz.course_id,
      questions: backendQuiz.questions.map(q => this.transformQuestionData(q)),
      time_limit_minutes: backendQuiz.time_limit_minutes?.[0] || null,
      max_attempts: backendQuiz.max_attempts,
      start_date: new Date(Number(backendQuiz.start_date) / 1000000).toISOString(),
      end_date: new Date(Number(backendQuiz.end_date) / 1000000).toISOString(),
      duration_minutes: backendQuiz.duration_minutes,
      created_at: new Date(Number(backendQuiz.created_at) / 1000000).toISOString(),
      updated_at: new Date(Number(backendQuiz.updated_at) / 1000000).toISOString()
    };
  }

  transformQuestionData(backendQuestion) {
    let questionType, options, correctAnswer, sampleAnswer, maxWords;

    if ('MultipleChoice' in backendQuestion.question_type) {
      questionType = 'multiple_choice';
      options = backendQuestion.question_type.MultipleChoice.options;
      correctAnswer = Number(backendQuestion.question_type.MultipleChoice.correct_answer);
    } else if ('TrueFalse' in backendQuestion.question_type) {
      questionType = 'true_false';
      correctAnswer = backendQuestion.question_type.TrueFalse.correct_answer;
    } else if ('ShortAnswer' in backendQuestion.question_type) {
      questionType = 'short_answer';
      sampleAnswer = backendQuestion.question_type.ShortAnswer.sample_answer;
    } else if ('Essay' in backendQuestion.question_type) {
      questionType = 'essay';
      maxWords = backendQuestion.question_type.Essay.max_words?.[0] || null;
    }

    return {
      id: backendQuestion.id,
      text: backendQuestion.question_text,
      type: questionType,
      points: backendQuestion.points,
      options,
      correctAnswer,
      sampleAnswer,
      maxWords
    };
  }

  transformAttemptData(backendAttempt) {
    return {
      id: backendAttempt.id,
      quiz_id: backendAttempt.quiz_id,
      student_id: backendAttempt.student_id,
      answers: backendAttempt.answers.map(a => this.transformAnswerData(a)),
      score: backendAttempt.score?.[0] || null,
      started_at: new Date(Number(backendAttempt.started_at) / 1000000).toISOString(),
      submitted_at: backendAttempt.submitted_at?.[0] ? 
        new Date(Number(backendAttempt.submitted_at[0]) / 1000000).toISOString() : null,
      time_remaining: backendAttempt.time_remaining?.[0] || null
    };
  }

  transformAnswerData(backendAnswer) {
    return {
      questionId: backendAnswer.question_id,
      text: backendAnswer.answer_text,
      selectedOptions: backendAnswer.selected_options,
      isCorrect: backendAnswer.is_correct?.[0] || null
    };
  }

  generateQuestionId() {
    return `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Date utility methods
  createDateTimestamp(dateString, timeString) {
    // Combine date and time strings into a timestamp
    // dateString format: "24/8/2025", timeString format: "13:00" (1pm)
    const [day, month, year] = dateString.split('/');
    const [hours, minutes] = timeString.split(':');
    
    const date = new Date(year, month - 1, day, hours, minutes);
    return date.getTime() * 1_000_000; // Convert to nanoseconds
  }

  formatDateForInput(timestampNs) {
    // Convert nanosecond timestamp to date/time format for inputs
    const date = new Date(Number(timestampNs) / 1_000_000);
    return {
      date: date.toLocaleDateString('en-GB'), // DD/MM/YYYY format
      time: date.toTimeString().substring(0, 5) // HH:MM format
    };
  }

  isQuizAvailable(quiz) {
    const now = Date.now() * 1_000_000; // Current time in nanoseconds
    const startDate = Number(quiz.start_date);
    const endDate = Number(quiz.end_date);
    
    return now >= startDate && now <= endDate;
  }

  getQuizStatus(quiz) {
    const now = Date.now() * 1_000_000; // Current time in nanoseconds
    const startDate = Number(quiz.start_date);
    const endDate = Number(quiz.end_date);
    
    if (now < startDate) {
      return 'upcoming';
    } else if (now > endDate) {
      return 'ended';
    } else {
      return 'active';
    }
  }

  // Generate mock data for compatibility
  generateMockQuizzes(courses) {
    return courses.map(course => {
      // Create a quiz that starts in 1 hour and lasts for 2 hours
      const startDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const endDate = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours from now
      
      return {
        id: `quiz_${course.id}_1`,
        course_id: course.id,
        title: `${course.title} - Midterm Quiz`,
        description: `Midterm assessment for ${course.title}`,
        questions: [],
        time_limit_minutes: 60,
        max_attempts: 2,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        duration_minutes: 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'upcoming'
      };
    });
  }
}

export const quizService = new QuizService();
