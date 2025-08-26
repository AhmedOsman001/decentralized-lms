import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Clock, 
  Users,
  BarChart,
  Calendar,
  CheckCircle,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { 
  GradientCard, 
  GradientButton, 
  LoadingSpinner 
} from '../../../shared/components';
import { adminService } from '../../../services/adminService';
import { icpTimestampToDate } from '../../../utils/icpUtils';

export const QuizManagementPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load courses first
      const coursesResponse = await adminService.listCourses();
      if (coursesResponse.success) {
        setCourses(coursesResponse.data);
        
        // Load quizzes for each course
        const allQuizzes = [];
        for (const course of coursesResponse.data) {
          const quizzesResponse = await adminService.listCourseQuizzes(course.id);
          console.log('QuizManagementPage: quizzesResponse for course', course.id, ':', quizzesResponse);
          
          if (quizzesResponse.success && Array.isArray(quizzesResponse.data)) {
            const courseQuizzes = quizzesResponse.data.map(quiz => ({
              ...quiz,
              courseName: course.title
            }));
            allQuizzes.push(...courseQuizzes);
          } else if (quizzesResponse.success) {
            console.warn('QuizManagementPage: quizzesResponse.data is not an array:', quizzesResponse.data);
          }
        }
        setQuizzes(allQuizzes);
      } else {
        setError(coursesResponse.error);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load quiz data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await adminService.deleteQuiz(quizId);
      if (response.success) {
        await loadData(); // Reload data
      } else {
        setError(response.error);
      }
    } catch (err) {
      console.error('Failed to delete quiz:', err);
      setError('Failed to delete quiz');
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = filterCourse === 'all' || quiz.course_id === filterCourse;
    
    return matchesSearch && matchesCourse;
  });

  const isQuizActive = (quiz) => {
    const now = Date.now();
    const startDate = icpTimestampToDate(quiz.start_date);
    const endDate = icpTimestampToDate(quiz.end_date);
    return now >= startDate.getTime() && now <= endDate.getTime();
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Quiz Management</h1>
          <p className="text-slate-400">Manage all quizzes across your institution</p>
        </div>
        <GradientButton
          onClick={() => {/* Handle create quiz */}}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </GradientButton>
      </div>

      {/* Filters and Search */}
      <GradientCard variant="glass" className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search quizzes by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GradientCard>

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.map((quiz) => {
          const isActive = isQuizActive(quiz);
          const questionsCount = quiz.questions?.length || 0;
          const totalPoints = quiz.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0;
          
          return (
            <GradientCard key={quiz.id} variant="glass" className="p-6 hover:scale-105 transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white line-clamp-2">
                      {quiz.title}
                    </h3>
                    <div className="flex items-center mt-1">
                      {isActive ? (
                        <CheckCircle className="h-3 w-3 text-green-400 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 text-slate-400 mr-1" />
                      )}
                      <span className={`text-xs ${isActive ? 'text-green-400' : 'text-slate-400'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button className="text-slate-400 hover:text-white transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                {quiz.description}
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-slate-400">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatDuration(quiz.duration_minutes)}</span>
                  </div>
                  <div className="text-slate-400">
                    {questionsCount} questions
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-slate-400">
                    Max attempts: {quiz.max_attempts}
                  </div>
                  <div className="text-slate-400">
                    {totalPoints} points
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-slate-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{icpTimestampToDate(quiz.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-slate-400">
                    Course: {quiz.courseName}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <GradientButton
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {/* Handle view analytics */}}
                  >
                    <BarChart className="h-3 w-3 mr-1" />
                    Analytics
                  </GradientButton>
                  
                  <button 
                    className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                    onClick={() => {/* Handle edit quiz */}}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  <button 
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    onClick={() => handleDeleteQuiz(quiz.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </GradientCard>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredQuizzes.length === 0 && (
        <GradientCard variant="glass" className="p-12 text-center">
          <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No quizzes found</h3>
          <p className="text-slate-500 mb-6">
            {searchTerm || filterCourse !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first quiz'
            }
          </p>
          {!searchTerm && filterCourse === 'all' && (
            <GradientButton onClick={() => {/* Handle create quiz */}}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Quiz
            </GradientButton>
          )}
        </GradientCard>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GradientCard variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {quizzes.length}
          </div>
          <div className="text-sm text-slate-400">Total Quizzes</div>
        </GradientCard>
        
        <GradientCard variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {quizzes.filter(quiz => isQuizActive(quiz)).length}
          </div>
          <div className="text-sm text-slate-400">Active Quizzes</div>
        </GradientCard>
        
        <GradientCard variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {quizzes.reduce((total, quiz) => total + (quiz.questions?.length || 0), 0)}
          </div>
          <div className="text-sm text-slate-400">Total Questions</div>
        </GradientCard>
        
        <GradientCard variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {courses.length}
          </div>
          <div className="text-sm text-slate-400">Courses with Quizzes</div>
        </GradientCard>
      </div>

      {error && (
        <div className="text-red-400 text-center p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};
