import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Users, 
  Eye,
  EyeOff,
  Calendar,
  Clock,
  MoreVertical
} from 'lucide-react';
import { 
  GradientCard, 
  GradientButton, 
  LoadingSpinner 
} from '../../../shared/components';
import { adminService } from '../../../services/adminService';

export const CourseManagementPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.listCourses();
      if (response.success) {
        setCourses(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && course.is_published) ||
                         (filterStatus === 'draft' && !course.is_published);
    
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-white mb-2">Course Management</h1>
          <p className="text-slate-400">Manage all courses in your institution</p>
        </div>
        <GradientButton
          onClick={() => {/* Handle create course */}}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </GradientButton>
      </div>

      {/* Filters and Search */}
      <GradientCard variant="glass" className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Courses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </GradientCard>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <GradientCard key={course.id} variant="glass" className="p-6 hover:scale-105 transition-transform">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-white line-clamp-2">
                    {course.title}
                  </h3>
                  <div className="flex items-center mt-1">
                    {course.is_published ? (
                      <Eye className="h-3 w-3 text-green-400 mr-1" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-slate-400 mr-1" />
                    )}
                    <span className={`text-xs ${course.is_published ? 'text-green-400' : 'text-slate-400'}`}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
              
              <button className="text-slate-400 hover:text-white transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            <p className="text-slate-400 text-sm mb-4 line-clamp-3">
              {course.description}
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-slate-400">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{course.enrolled_students?.length || 0} students</span>
                </div>
                <div className="flex items-center text-slate-400">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{new Date(Number(course.created_at) / 1000000).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="text-slate-400">
                  Instructors: {course.instructor_ids?.length || 0}
                </div>
                <div className="text-slate-400">
                  Lessons: {course.lessons?.length || 0}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <GradientButton
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {/* Handle edit course */}}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </GradientButton>
                
                <button className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </GradientCard>
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <GradientCard variant="glass" className="p-12 text-center">
          <BookOpen className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No courses found</h3>
          <p className="text-slate-500 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first course'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <GradientButton onClick={() => {/* Handle create course */}}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Course
            </GradientButton>
          )}
        </GradientCard>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GradientCard variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {courses.length}
          </div>
          <div className="text-sm text-slate-400">Total Courses</div>
        </GradientCard>
        
        <GradientCard variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {courses.filter(c => c.is_published).length}
          </div>
          <div className="text-sm text-slate-400">Published</div>
        </GradientCard>
        
        <GradientCard variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {courses.filter(c => !c.is_published).length}
          </div>
          <div className="text-sm text-slate-400">Drafts</div>
        </GradientCard>
        
        <GradientCard variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {courses.reduce((total, course) => total + (course.enrolled_students?.length || 0), 0)}
          </div>
          <div className="text-sm text-slate-400">Total Enrollments</div>
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
