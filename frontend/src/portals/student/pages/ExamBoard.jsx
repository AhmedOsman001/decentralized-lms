import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';
import { courseService } from '../../../services/courseService';
import { quizService } from '../../../services/quizService';
import { 
  GradientCard, 
  LoadingSpinner, 
  GradientButton 
} from '../../../shared/components';
import { 
  ClipboardList, 
  Calendar, 
  Clock, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2,
  Timer,
  Users,
  Trophy,
  Play
} from 'lucide-react';

const ExamBoard = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadStudentQuizzes();
    }
  }, [user]);

  const loadStudentQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get enrolled courses for the current student
      const coursesResult = await courseService.getStudentCourses(user.id);
      if (!coursesResult.success) {
        throw new Error(coursesResult.error || 'Failed to load courses');
      }

      const courses = coursesResult.data || [];
      setEnrolledCourses(courses);

      // Get all quizzes for enrolled courses
      const allQuizzes = [];
      for (const course of courses) {
        try {
          const quizzesResult = await quizService.getCourseQuizzes(course.id);
          if (quizzesResult.success && quizzesResult.data) {
            const courseQuizzes = quizzesResult.data.map(quiz => ({
              ...quiz,
              courseName: course.title,
              courseId: course.id
            }));
            allQuizzes.push(...courseQuizzes);
          }
        } catch (err) {
          console.warn(`Failed to load quizzes for course ${course.id}:`, err);
        }
      }

      // Filter for upcoming and active quizzes (end_date is in the future)
      const currentTime = new Date();
      const availableQuizzes = allQuizzes
        .filter(quiz => new Date(quiz.end_date) > currentTime) // Show if not ended yet
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date)); // Sort by start date

      setAvailableQuizzes(availableQuizzes);
    } catch (err) {
      console.error('Error loading student quizzes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeUntilQuiz = (startDate) => {
    const now = Date.now();
    const quizStartTime = new Date(startDate).getTime();
    const timeDiff = quizStartTime - now;
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };

  const getQuizTimeInfo = (quiz) => {
    const now = new Date();
    const startDate = new Date(quiz.start_date);
    const endDate = new Date(quiz.end_date);
    
    if (now < startDate) {
      // Upcoming quiz - show time until it starts
      const timeDiff = startDate.getTime() - now.getTime();
      const timeString = formatTimeDifference(timeDiff);
      return {
        label: "Time until quiz starts:",
        time: timeString,
        color: "text-blue-300"
      };
    } else if (now >= startDate && now <= endDate) {
      // Active quiz - show time until it ends
      const timeDiff = endDate.getTime() - now.getTime();
      const timeString = formatTimeDifference(timeDiff);
      return {
        label: "Time until quiz ends:",
        time: timeString,
        color: "text-green-300"
      };
    } else {
      // Ended quiz
      return {
        label: "Quiz ended",
        time: "",
        color: "text-slate-400"
      };
    }
  };

  const formatTimeDifference = (timeDiff) => {
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };

  const getQuizStatus = (quiz) => {
    const now = new Date();
    const startDate = new Date(quiz.start_date);
    const endDate = new Date(quiz.end_date);
    
    if (now < startDate) {
      return { status: 'upcoming', color: 'text-blue-400', icon: Timer, label: 'Upcoming' };
    } else if (now >= startDate && now <= endDate) {
      return { status: 'active', color: 'text-green-400', icon: CheckCircle2, label: 'Active' };
    } else {
      return { status: 'ended', color: 'text-slate-400', icon: Clock, label: 'Ended' };
    }
  };

  // Handle embedded mode layout
  if (isEmbedded) {
    if (loading) {
      return (
        <div className="text-center py-4">
          <LoadingSpinner size="md" />
          <p className="text-slate-400 mt-2 text-sm">Loading quizzes...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 text-sm mb-2">Failed to load quizzes</p>
          <button 
            onClick={loadStudentQuizzes}
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {availableQuizzes.length === 0 ? (
          <div className="text-center py-6">
            <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No available quizzes</p>
          </div>
        ) : (
          availableQuizzes.slice(0, 3).map((quiz) => {
            const status = getQuizStatus(quiz);
            const timeInfo = getQuizTimeInfo(quiz);
            const StatusIcon = status.icon;
            
            return (
              <div key={quiz.id} className="p-4 bg-slate-700/30 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-white text-sm">{quiz.title}</h4>
                  <div className={`flex items-center space-x-1 ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="text-xs">{status.label}</span>
                  </div>
                </div>
                <p className="text-slate-400 text-xs mb-2 line-clamp-1">{quiz.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{quiz.courseName}</span>
                  <span className={timeInfo.color}>{timeInfo.time}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // Full page layout
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Exam Board</h1>
            <p className="text-slate-400">View your upcoming quizzes and exams</p>
          </div>
        </div>

        <GradientCard variant="glass" className="p-12 text-center">
          <LoadingSpinner size="lg" />
          <h3 className="text-xl font-semibold text-white mb-2 mt-4">Loading Exam Board</h3>
          <p className="text-slate-400">Fetching your upcoming quizzes...</p>
        </GradientCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Exam Board</h1>
            <p className="text-slate-400">View your upcoming quizzes and exams</p>
          </div>
        </div>

        <GradientCard variant="glass" className="p-12 text-center border border-red-500/20">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Exam Board</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <GradientButton onClick={loadStudentQuizzes}>
            Try Again
          </GradientButton>
        </GradientCard>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Exam Board</h1>
          <p className="text-slate-400">
            View your available quizzes and exams across all enrolled courses
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GradientCard variant="glass" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Enrolled Courses</p>
              <p className="text-2xl font-bold text-white">{enrolledCourses.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-400" />
          </div>
        </GradientCard>

        <GradientCard variant="glass" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Available Quizzes</p>
              <p className="text-2xl font-bold text-white">{availableQuizzes.length}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-green-400" />
          </div>
        </GradientCard>

        <GradientCard variant="glass" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Next Quiz</p>
              <p className="text-2xl font-bold text-white">
                {availableQuizzes.length > 0 ? getQuizTimeInfo(availableQuizzes[0]).time || 'Active' : 'None'}
              </p>
            </div>
            <Timer className="w-8 h-8 text-yellow-400" />
          </div>
        </GradientCard>
      </div>

      {/* Upcoming Quizzes */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Available Quizzes</h2>
        
        {availableQuizzes.length === 0 ? (
          <GradientCard variant="glass" className="p-12 text-center">
            <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Available Quizzes</h3>
            <p className="text-slate-400">
              You don't have any quizzes scheduled at the moment. Check back later or contact your instructors.
            </p>
          </GradientCard>
        ) : (
          <div className="space-y-4">
            {availableQuizzes.map((quiz) => {
              const status = getQuizStatus(quiz);
              const timeInfo = getQuizTimeInfo(quiz);
              const StatusIcon = status.icon;
              
              return (
                <GradientCard key={quiz.id} variant="glass" className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{quiz.title}</h3>
                        <div className={`flex items-center space-x-1 ${status.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">{status.label}</span>
                        </div>
                      </div>
                      
                      <p className="text-slate-400 mb-3">{quiz.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-blue-400" />
                          <span className="text-slate-400">Course: {quiz.courseName}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-green-400" />
                          <span className="text-slate-400">Start: {formatDate(quiz.start_date)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span className="text-slate-400">Duration: {quiz.duration_minutes} min</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-purple-400" />
                          <span className="text-slate-400">Max Attempts: {quiz.max_attempts}</span>
                        </div>
                      </div>
                      
                      {timeInfo.time && (
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Timer className="w-4 h-4 text-blue-400" />
                              <span className={`text-sm ${timeInfo.color}`}>
                                {timeInfo.label} {timeInfo.time}
                              </span>
                            </div>
                            
                            {status.status === 'active' && (
                              <GradientButton 
                                size="sm"
                                onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                                className="flex items-center space-x-2"
                              >
                                <Play className="w-4 h-4" />
                                <span>Take Quiz</span>
                              </GradientButton>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </GradientCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export { ExamBoard };
