import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen,
  Search,
  Filter,
  Grid,
  List,
  ExternalLink,
  Star,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  GradientCard, 
  GradientButton 
} from '../../../shared/components';
import { courseService } from '../../../services/courseService';
import { mockAssignments } from '../../../data/mockData';

const CoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  // Load courses on component mount
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await courseService.getCurrentUserCourses();
      
      if (response.success) {
        setCourses(response.data || []);
      } else {
        console.error('Failed to load courses:', response.error);
        setError(response.error);
        setCourses([]);
      }
    } catch (err) {
      console.error('Error loading courses:', err);
      setError(err.message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get course code from title
  const getCourseCode = (title) => {
    const match = title?.match(/^([A-Z]{2,4}\s?\d{3,4})/);
    return match ? match[1] : title?.slice(0, 8).toUpperCase() || 'COURSE';
  };

  // Helper function to get course color based on course ID  
  const getCourseColor = (courseId) => {
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green  
      '#F59E0B', // yellow
      '#EF4444', // red
      '#8B5CF6', // purple
      '#06B6D4', // cyan
      '#F97316', // orange
      '#84CC16'  // lime
    ];
    const colorIndex = courseId ? parseInt(courseId.slice(-1), 16) % colors.length : 0;
    return colors[colorIndex];
  };

  const getCourseStats = (courseId) => {
    // For now using mock data for assignments, but this should be replaced with backend data
    const courseAssignments = mockAssignments.filter(a => a.course_id === courseId);
    const completedAssignments = courseAssignments.filter(a => a.status === 'submitted' || a.status === 'graded').length;
    const totalAssignments = courseAssignments.length;
    const progress = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
    
    return {
      totalAssignments,
      completedAssignments,
      progress: Math.round(progress)
    };
  };

  const filteredCourses = courses.filter(course => {
    const courseCode = getCourseCode(course.title);
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.instructor_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'current' && course.is_published) ||
                         (filterBy === 'completed' && !course.is_published);
    
    return matchesSearch && matchesFilter;
  });

  const CourseGridCard = ({ course }) => {
    const stats = getCourseStats(course.id);
    const courseColor = getCourseColor(course.id);
    
    return (
      <GradientCard 
        variant="glass" 
        className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
        onClick={() => navigate(`/student/courses/${course.id}`)}
      >
        {/* Color accent bar */}
        <div 
          className="h-1 w-full"
          style={{ backgroundColor: courseColor }}
        />
        
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                  {getCourseCode(course.title)}
                </h3>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3 h-3 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-blue-300 line-clamp-2 mb-3">
                {course.title}
              </p>
            </div>
            <div className="px-2 py-1 bg-white/10 backdrop-blur-sm rounded text-xs text-white">
              {course.is_published ? 'Active' : 'Draft'}
            </div>
          </div>

          {/* Description */}
          {course.description && (
            <p className="text-sm text-blue-300 mb-4 line-clamp-2">
              {course.description}
            </p>
          )}

          {/* Course Info */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center space-x-2 text-sm text-blue-300">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: courseColor }}
              />
              <span>{course.instructor_name || 'Instructor'}</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-blue-300">
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <span>{course.lessons?.length || 0} lesson{(course.lessons?.length || 0) !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-blue-300">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>{course.enrolled_students?.length || 0} student{(course.enrolled_students?.length || 0) !== 1 ? 's' : ''} enrolled</span>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-blue-300">Progress</span>
              <span className="text-white font-medium">{stats.progress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${stats.progress}%`,
                  backgroundColor: courseColor
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-blue-400 mt-1">
              <span>{stats.completedAssignments}/{stats.totalAssignments} assignments completed</span>
            </div>
          </div>

          {/* Action */}
          <GradientButton
            variant="ghost"
            size="sm"
            className="w-full justify-between group/btn"
          >
            <span>Enter Course</span>
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </GradientButton>
        </div>
      </GradientCard>
    );
  };

  const CourseListCard = ({ course }) => {
    const stats = getCourseStats(course.id);
    const courseColor = getCourseColor(course.id);
    
    return (
      <GradientCard 
        variant="glass" 
        className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
        onClick={() => navigate(`/student/courses/${course.id}`)}
      >
        <div className="p-6">
          <div className="flex items-center gap-6">
            {/* Color indicator */}
            <div 
              className="w-4 h-16 rounded-md flex-shrink-0"
              style={{ backgroundColor: courseColor }}
            />
            
            {/* Course Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                    {getCourseCode(course.title)} - {course.title}
                  </h3>
                  <p className="text-sm text-gray-300">{course.instructor_name || 'Instructor'}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.lessons?.length || 0} lessons</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{course.enrolled_students?.length || 0} students</span>
                  </div>
                  <div className="px-2 py-1 rounded text-xs" style={{ backgroundColor: courseColor, color: 'white' }}>
                    {course.is_published ? 'Active' : 'Draft'}
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300">Progress</span>
                    <span className="text-white font-medium">{stats.progress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${stats.progress}%`,
                        backgroundColor: courseColor
                      }}
                    />
                  </div>
                </div>
                <GradientButton
                  variant="ghost"
                  size="sm"
                  className="group/btn"
                >
                  <span>Enter Course</span>
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      </GradientCard>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load courses</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button 
            onClick={loadCourses}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            My Courses
          </h1>
          <p className="text-slate-400 text-lg">
            Manage and track your academic progress
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Courses</option>
            <option value="current">Active</option>
            <option value="completed">Draft</option>
          </select>
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 transition-all ${viewMode === 'grid' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-slate-300'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 transition-all ${viewMode === 'list' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-slate-300'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
            {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-6 rounded-xl border border-slate-600/50 hover:border-slate-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Courses</p>
              <p className="text-3xl font-bold text-white">{filteredCourses.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-6 rounded-xl border border-slate-600/50 hover:border-slate-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Active Courses</p>
              <p className="text-3xl font-bold text-white">{filteredCourses.filter(c => c.is_published).length}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/20">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-6 rounded-xl border border-slate-600/50 hover:border-slate-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Lessons</p>
              <p className="text-3xl font-bold text-white">{filteredCourses.reduce((sum, course) => sum + (course.lessons?.length || 0), 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/20">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-6 rounded-xl border border-slate-600/50 hover:border-slate-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Completion</p>
              <p className="text-3xl font-bold text-white">85%</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/20">
              <Star className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Courses */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No courses found</h3>
          <p className="text-slate-400">
            {courses.length === 0 
              ? "You haven't enrolled in any courses yet." 
              : "No courses match your current filters."
            }
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseGridCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <CourseListCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export { CoursesPage };
