import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { 
  Calendar, 
  BookOpen, 
  Clock, 
  Trophy, 
  Bell, 
  TrendingUp, 
  Users,
  FileText,
  GraduationCap,
  Search,
  User
} from 'lucide-react';
import { StudentLayout } from './components/StudentLayout';
import { CourseCard } from './components/CourseCard';
import { CoursesPage } from './pages/CoursesPage';
import { CoursePage } from './pages/CoursePage';
import { ExamBoard } from './pages/ExamBoard';
import QuizAttempt from './pages/QuizAttempt';
import { courseService } from '../../services/courseService';
import { mockAssignments, mockExams, mockAnnouncements } from '../../data/mockData';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load student's enrolled courses
  useEffect(() => {
    loadEnrolledCourses();
  }, [user]);

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await courseService.getCurrentUserCourses();
      
      if (response.success) {
        setEnrolledCourses(response.data || []);
      } else {
        console.error('Failed to load courses:', response.error);
        setError(response.error);
        setEnrolledCourses([]); // Fallback to empty array
      }
    } catch (err) {
      console.error('Error loading enrolled courses:', err);
      setError(err.message);
      setEnrolledCourses([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract role string from role object
  const getRoleString = (role) => {
    if (!role) return 'Unknown';
    if (typeof role === 'string') return role;
    if (typeof role === 'object') {
      const roleKeys = Object.keys(role);
      return roleKeys.length > 0 ? roleKeys[0] : 'Unknown';
    }
    return 'Unknown';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const upcomingAssignments = mockAssignments
    .filter(a => a.status === 'pending' || a.status === 'overdue')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 4);

  const pendingAssignments = upcomingAssignments.filter(a => a.status === 'pending');

  const recentAnnouncements = mockAnnouncements.slice(0, 3);
  
  const upcomingExams = mockExams
    .filter(e => e.status === 'upcoming')
    .slice(0, 3);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Hero Section */}
      <div className="bg-gradient-to-r from-slate-800 to-blue-900 rounded-xl p-6 text-white relative overflow-hidden border border-slate-700">
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">
            {getGreeting()}, {user?.name || 'Student'}!
          </h1>
          <p className="text-slate-300 mb-4">
            Ready to continue your learning journey? Check out your upcoming assignments and recent progress.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-400/5 rounded-full translate-y-12 -translate-x-12"></div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Enrolled Courses</p>
              <p className="text-2xl font-bold text-white">{enrolledCourses.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Pending Assignments</p>
              <p className="text-2xl font-bold text-white">{pendingAssignments.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/20">
              <FileText className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Upcoming Exams</p>
              <p className="text-2xl font-bold text-white">{upcomingExams.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-cyan-500/20">
              <Calendar className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Current GPA</p>
              <p className="text-2xl font-bold text-white">3.8</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/20">
              <Trophy className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrolled Courses */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex flex-row items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Enrolled Courses</h2>
              <button 
                onClick={() => navigate('/student/courses')}
                className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-2 text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-slate-400 mt-2">Loading your courses...</p>
                </div>
              ) : error ? (
                <div className="col-span-2 text-center py-8">
                  <p className="text-red-400 mb-2">Failed to load courses</p>
                  <p className="text-slate-400 text-sm">{error}</p>
                  <button 
                    onClick={loadEnrolledCourses}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : enrolledCourses.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-400 mb-2">No courses enrolled yet</p>
                  <p className="text-slate-500 text-sm">Start your learning journey by enrolling in courses</p>
                </div>
              ) : (
                enrolledCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))
              )}
            </div>
          </div>

          {/* Exam Board - Use dedicated component */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex flex-row items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Exam Board</h2>
              <button 
                onClick={() => navigate('/student/exams')}
                className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
              >
                View all
              </button>
            </div>
            <ExamBoard isEmbedded={true} />
          </div>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/student/courses')}
                className="w-full flex items-center justify-between p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Browse Courses
                </span>
                <span>→</span>
              </button>
              <button 
                onClick={() => navigate('/student/schedule')}
                className="w-full flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  View Schedule
                </span>
                <span>→</span>
              </button>
              <button 
                onClick={() => navigate('/student/assignments')}
                className="w-full flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Assignments
                </span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-white mb-4">
              <Bell className="w-5 h-5 text-yellow-400" />
              Recent Announcements
            </h3>
            <div className="space-y-3">
              {recentAnnouncements.length > 0 ? recentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="p-3 bg-slate-700/30 rounded-lg text-sm">
                  <div className="font-medium text-white mb-1">{announcement.title}</div>
                  <div className="text-slate-400 text-xs mb-2">{announcement.course} • {announcement.date}</div>
                  <div className="text-slate-300 text-sm line-clamp-2">{announcement.content}</div>
                </div>
              )) : (
                <div className="p-3 bg-slate-700/30 rounded-lg text-sm text-slate-400 text-center">
                  No recent announcements
                </div>
              )}
            </div>
          </div>

          {/* Academic Calendar */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-white mb-4">
              <Calendar className="w-5 h-5 text-blue-400" />
              Academic Calendar
            </h3>
            <div className="space-y-3">
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  Friday
                </div>
                <div className="text-sm text-slate-400">
                  August 23, 2025
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-white">Upcoming Exams</h4>
                {upcomingExams.length > 0 ? upcomingExams.map((exam) => (
                  <div key={exam.id} className="p-3 bg-slate-700/30 rounded-lg text-sm">
                    <div className="font-medium text-blue-400">{exam.course_code}</div>
                    <div className="text-slate-300">{exam.title}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {exam.date} at {exam.time}
                    </div>
                  </div>
                )) : (
                  <div className="p-3 bg-slate-700/30 rounded-lg text-sm text-slate-400 text-center">
                    No upcoming exams
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StudentPortal = () => {
  return (
    <StudentLayout>
      <Routes>
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CoursePage />} />
        <Route path="/exams" element={<ExamBoard />} />
        <Route path="/quiz/:quizId" element={<QuizAttempt />} />
      </Routes>
    </StudentLayout>
  );
};
