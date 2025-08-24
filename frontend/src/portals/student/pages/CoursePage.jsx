import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen,
  FileText,
  Video,
  Download,
  Play,
  User,
  Star,
  MessageSquare,
  Share2,
  Bell,
  Settings,
  ChevronRight,
  ExternalLink,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Timer
} from 'lucide-react';
import { 
  GradientCard, 
  GradientButton,
  Badge 
} from '../../../shared/components';
import { courseService } from '../../../services/courseService';
import { mockAssignments, mockCourseMaterials } from '../../../data/mockData';

const CoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await courseService.getCourse(courseId);
      
      if (response.success && response.data) {
        setCourse(response.data);
        
        // For now, use mock data for materials and assignments
        // TODO: Replace with real backend calls when materials/assignments API is ready
        setMaterials(mockCourseMaterials.filter(m => m.course_id === courseId));
        setAssignments(mockAssignments.filter(a => a.course_id === courseId));
      } else {
        setError(response.error || 'Course not found');
      }
    } catch (err) {
      console.error('Error loading course:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <GradientCard variant="glass" className="p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Course</h3>
          <p className="text-slate-400">Please wait while we load the course details...</p>
        </GradientCard>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-6">
        <GradientCard variant="glass" className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {error || 'Course not found'}
          </h3>
          <p className="text-slate-400 mb-4">
            {error ? 'There was an error loading the course.' : "The course you're looking for doesn't exist."}
          </p>
          <GradientButton onClick={() => navigate('/student/courses')}>
            Back to Courses
          </GradientButton>
        </GradientCard>
      </div>
    );
  }

  const getAssignmentStats = () => {
    const total = assignments.length;
    const completed = assignments.filter(a => a.status === 'submitted' || a.status === 'graded').length;
    const pending = assignments.filter(a => a.status === 'pending').length;
    const overdue = assignments.filter(a => a.status === 'overdue').length;
    
    return { total, completed, pending, overdue };
  };

  const MaterialCard = ({ material }) => {
    const getIcon = (type) => {
      switch (type) {
        case 'video': return <Video className="w-5 h-5" />;
        case 'document': return <FileText className="w-5 h-5" />;
        case 'presentation': return <BookOpen className="w-5 h-5" />;
        default: return <FileText className="w-5 h-5" />;
      }
    };

    const getTypeColor = (type) => {
      switch (type) {
        case 'video': return 'text-red-400';
        case 'document': return 'text-blue-400';
        case 'presentation': return 'text-green-400';
        default: return 'text-slate-400';
      }
    };

    return (
      <GradientCard variant="glass" className="p-4 hover:shadow-lg transition-all duration-300 group cursor-pointer">
        <div className="flex items-start gap-3">
          <div className={`${getTypeColor(material.type)} mt-1`}>
            {getIcon(material.type)}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-white group-hover:text-blue-300 transition-colors">
              {material.title}
            </h4>
            <p className="text-sm text-slate-400 mt-1">{material.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span>Week {material.week}</span>
              <span>{material.size}</span>
              <span>Added {new Date(material.uploaded_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GradientButton variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </GradientButton>
            <GradientButton variant="ghost" size="sm">
              <ExternalLink className="w-4 h-4" />
            </GradientButton>
          </div>
        </div>
      </GradientCard>
    );
  };

  const AssignmentCard = ({ assignment }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'submitted': return 'text-green-400 bg-green-400/20';
        case 'graded': return 'text-blue-400 bg-blue-400/20';
        case 'pending': return 'text-yellow-400 bg-yellow-400/20';
        case 'overdue': return 'text-red-400 bg-red-400/20';
        default: return 'text-slate-400 bg-slate-400/20';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'submitted':
        case 'graded':
          return <CheckCircle2 className="w-4 h-4" />;
        case 'overdue':
          return <AlertCircle className="w-4 h-4" />;
        default:
          return <Timer className="w-4 h-4" />;
      }
    };

    const daysLeft = Math.ceil((new Date(assignment.due_date) - new Date()) / (1000 * 60 * 60 * 24));

    return (
      <GradientCard variant="glass" className="p-4 hover:shadow-lg transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-white mb-1">{assignment.title}</h4>
            <p className="text-sm text-slate-400">{assignment.description}</p>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(assignment.status)}`}>
            {getStatusIcon(assignment.status)}
            <span className="capitalize">{assignment.status}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="text-slate-400">
            Due: {new Date(assignment.due_date).toLocaleDateString()}
            {assignment.status === 'pending' && daysLeft > 0 && (
              <span className="ml-2 text-yellow-400">
                ({daysLeft} days left)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {assignment.grade && (
              <span className="text-blue-400 font-medium">{assignment.grade}/100</span>
            )}
            <GradientButton variant="ghost" size="sm">
              View Details
            </GradientButton>
          </div>
        </div>
      </GradientCard>
    );
  };

  const stats = getAssignmentStats();

  return (
    <div className="p-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <button
          onClick={() => navigate('/student/courses')}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Courses
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">{getCourseCode(course.title)}</span>
      </div>

      {/* Course Header */}
      <GradientCard variant="glass" className="p-6">
        <div className="flex items-start gap-6">
          {/* Color indicator */}
          <div 
            className="w-6 h-20 rounded-lg flex-shrink-0"
            style={{ backgroundColor: getCourseColor(course.id) }}
          />
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {getCourseCode(course.title)} - {course.title}
                </h1>
                <p className="text-slate-400 mb-3">{course.description}</p>
                
                <div className="flex items-center gap-6 text-sm text-blue-300">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{course.instructor_name || 'Instructor'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.lessons?.length || 0} lesson{(course.lessons?.length || 0) !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{course.enrolled_students?.length || 0} student{(course.enrolled_students?.length || 0) !== 1 ? 's' : ''} enrolled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${course.is_published ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                      {course.is_published ? 'Active' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <GradientButton variant="ghost" size="sm">
                  <Bell className="w-4 h-4" />
                  Notifications
                </GradientButton>
                <GradientButton variant="ghost" size="sm">
                  <Share2 className="w-4 h-4" />
                  Share
                </GradientButton>
                <GradientButton variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </GradientButton>
              </div>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-blue-300">Assignments</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{materials.length}</p>
                <p className="text-sm text-blue-300">Materials</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </p>
                <p className="text-sm text-blue-300">Progress</p>
              </div>
            </div>
          </div>
        </div>
      </GradientCard>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'materials', label: 'Materials', icon: FileText },
          { id: 'assignments', label: 'Assignments', icon: Paperclip },
          { id: 'discussions', label: 'Discussions', icon: MessageSquare }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <GradientCard variant="glass" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </GradientCard>

            <GradientCard variant="glass" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <Timer className="w-8 h-8 text-yellow-400" />
              </div>
            </GradientCard>

            <GradientCard variant="glass" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Overdue</p>
                  <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </GradientCard>

            <GradientCard variant="glass" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Materials</p>
                  <p className="text-2xl font-bold text-blue-400">{materials.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
            </GradientCard>
          </div>

          {/* Recent Materials & Assignments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Materials */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Materials</h3>
                <GradientButton 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab('materials')}
                >
                  View All
                </GradientButton>
              </div>
              <div className="space-y-3">
                {materials.slice(0, 3).map(material => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>
            </div>

            {/* Recent Assignments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Assignments</h3>
                <GradientButton 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab('assignments')}
                >
                  View All
                </GradientButton>
              </div>
              <div className="space-y-3">
                {assignments.slice(0, 3).map(assignment => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Course Materials</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">{materials.length} items</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {materials.map(material => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>

          {materials.length === 0 && (
            <GradientCard variant="glass" className="p-12 text-center">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No materials yet</h3>
              <p className="text-slate-400">Course materials will appear here when available.</p>
            </GradientCard>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Assignments</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">{assignments.length} assignments</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {assignments.map(assignment => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>

          {assignments.length === 0 && (
            <GradientCard variant="glass" className="p-12 text-center">
              <Paperclip className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No assignments yet</h3>
              <p className="text-slate-400">Course assignments will appear here when available.</p>
            </GradientCard>
          )}
        </div>
      )}

      {activeTab === 'discussions' && (
        <GradientCard variant="glass" className="p-12 text-center">
          <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Discussions</h3>
          <p className="text-slate-400">Course discussions and forums will be available here.</p>
        </GradientCard>
      )}
    </div>
  );
};

export { CoursePage };
