import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock,
  Calendar,
  BookOpen,
  Award,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Target,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { quizService } from '../../../services/quizService';
import { courseService } from '../../../services/courseService';
import { GradientCard, GradientButton, LoadingSpinner } from '../../../shared/components';

const AttemptHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [attempts, setAttempts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('all');

  useEffect(() => {
    if (user) {
      loadAttemptHistory();
    }
  }, [user]);

  const loadAttemptHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get enrolled courses
      const coursesResult = await courseService.getStudentCourses(user.id);
      if (!coursesResult.success) {
        throw new Error(coursesResult.error || 'Failed to load courses');
      }

      const coursesData = coursesResult.data || [];
      setCourses(coursesData);

      // Get all attempts for all courses
      const allAttempts = [];
      for (const course of coursesData) {
        try {
          const attemptsResult = await quizService.getStudentAttempts(course.id, user.id);
          if (attemptsResult.success && attemptsResult.data) {
            const courseAttempts = attemptsResult.data.map(attempt => ({
              ...attempt,
              courseName: course.title,
              courseId: course.id
            }));
            allAttempts.push(...courseAttempts);
          }
        } catch (err) {
          console.warn(`Failed to load attempts for course ${course.id}:`, err);
        }
      }

      // Sort attempts by submission date (newest first)
      allAttempts.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
      setAttempts(allAttempts);
    } catch (err) {
      console.error('Error loading attempt history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp)).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 80) return 'text-blue-400';
    if (percentage >= 70) return 'text-yellow-400';
    if (percentage >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBadgeColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (percentage >= 80) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (percentage >= 70) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (percentage >= 60) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const calculateStats = () => {
    if (attempts.length === 0) return { average: 0, total: 0, bestScore: 0 };

    const scores = attempts.map(attempt => (attempt.score / attempt.max_score) * 100);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);

    return {
      average: Math.round(average),
      total: attempts.length,
      bestScore: Math.round(bestScore)
    };
  };

  const filteredAttempts = selectedCourse === 'all' 
    ? attempts 
    : attempts.filter(attempt => attempt.courseId === selectedCourse);

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <h3 className="text-xl font-semibold text-white mb-2 mt-4">Loading Attempt History</h3>
          <p className="text-slate-400">Please wait while we load your quiz attempts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <GradientCard variant="glass" className="p-12 text-center border border-red-500/20">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Attempts</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <GradientButton onClick={loadAttemptHistory}>
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
          <h1 className="text-3xl font-bold text-white mb-2">Attempt History</h1>
          <p className="text-slate-400">Review your quiz attempts and performance</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GradientCard variant="glass" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Attempts</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Target className="w-8 h-8 text-blue-400" />
          </div>
        </GradientCard>

        <GradientCard variant="glass" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Average Score</p>
              <p className="text-2xl font-bold text-white">{stats.average}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-400" />
          </div>
        </GradientCard>

        <GradientCard variant="glass" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Best Score</p>
              <p className="text-2xl font-bold text-white">{stats.bestScore}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-400" />
          </div>
        </GradientCard>
      </div>

      {/* Filter */}
      <GradientCard variant="glass" className="p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-white">Filter by Course:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-slate-700/50 text-white border border-slate-600/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>
      </GradientCard>

      {/* Attempts List */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Your Attempts</h2>
        
        {filteredAttempts.length === 0 ? (
          <GradientCard variant="glass" className="p-12 text-center">
            <Target className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Attempts Found</h3>
            <p className="text-slate-400">
              {selectedCourse === 'all' 
                ? "You haven't taken any quizzes yet. Start by taking your first quiz!"
                : "No attempts found for the selected course."
              }
            </p>
          </GradientCard>
        ) : (
          <div className="space-y-4">
            {filteredAttempts.map((attempt) => {
              const percentage = Math.round((attempt.score / attempt.max_score) * 100);
              const scoreColor = getScoreColor(attempt.score, attempt.max_score);
              const badgeColor = getScoreBadgeColor(attempt.score, attempt.max_score);

              return (
                <GradientCard key={attempt.id} variant="glass" className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{attempt.quiz_title}</h3>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${badgeColor}`}>
                          <Award className="w-3 h-3 mr-1" />
                          {percentage}%
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-blue-400" />
                          <span className="text-slate-400">Course: {attempt.courseName}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-green-400" />
                          <span className="text-slate-400">Submitted: {formatDate(attempt.submitted_at)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span className="text-slate-400">Time: {formatDuration(attempt.time_taken)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-purple-400" />
                          <span className="text-slate-400">Attempt #{attempt.attempt_number}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-400">Score:</span>
                            <span className={`text-lg font-bold ${scoreColor}`}>
                              {attempt.score}/{attempt.max_score}
                            </span>
                          </div>
                        </div>

                        <GradientButton
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/student/attempt-review/${attempt.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review Attempt
                        </GradientButton>
                      </div>
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

export default AttemptHistory;
