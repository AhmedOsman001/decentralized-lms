import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  ClipboardList, 
  FileText, 
  GraduationCap, 
  BarChart3, 
  Clock, 
  Bell, 
  MessageSquare, 
  Settings,
  Search,
  User
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('dashboard');

  // Update active item based on current path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/student' || path === '/student/') {
      setActiveItem('dashboard');
    } else if (path.startsWith('/student/courses')) {
      setActiveItem('courses');
    } else if (path.startsWith('/student/schedule')) {
      setActiveItem('schedule');
    } else if (path.startsWith('/student/exams')) {
      setActiveItem('exam-board');
    } else if (path.startsWith('/student/assignments')) {
      setActiveItem('assignments');
    } else if (path.startsWith('/student/grades')) {
      setActiveItem('grade-report');
    } else if (path.startsWith('/student/attendance')) {
      setActiveItem('attendance');
    } else if (path.startsWith('/student/announcements')) {
      setActiveItem('announcements');
    } else if (path.startsWith('/student/messages')) {
      setActiveItem('messages');
    } else if (path.startsWith('/student/settings')) {
      setActiveItem('settings');
    }
  }, [location.pathname]);

  const academicItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/student' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, path: '/student/schedule' },
    { id: 'exam-board', label: 'Exam Board', icon: ClipboardList, path: '/student/exams' },
    { id: 'assignments', label: 'Assignments', icon: FileText, path: '/student/assignments' },
    { id: 'grade-report', label: 'Grade Report', icon: GraduationCap, path: '/student/grades' },
    { id: 'courses', label: 'Courses', icon: BookOpen, path: '/student/courses' },
    { id: 'attendance', label: 'Attendance', icon: Clock, path: '/student/attendance' },
    { id: 'announcements', label: 'Announcements', icon: Bell, path: '/student/announcements' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/student/messages' }
  ];

  const settingsItems = [
    { id: 'settings', label: 'Settings', icon: Settings, path: '/student/settings' }
  ];

  const handleItemClick = (item) => {
    setActiveItem(item.id);
    navigate(item.path);
  };

  const SidebarItem = ({ item }) => {
    const isActive = activeItem === item.id;
    const Icon = item.icon;
    
    return (
      <button
        onClick={() => handleItemClick(item)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
          isActive 
            ? 'bg-blue-600 text-white shadow-lg' 
            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <aside className={`fixed left-0 top-0 w-64 bg-slate-900 border-r border-slate-700 h-screen flex flex-col z-10 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">dCampus</h1>
            <p className="text-xs text-slate-400">Decentralized Learning</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-700">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Academic Section */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            ACADEMIC
          </h3>
          <div className="space-y-1">
            {academicItems.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Settings Section */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            SETTINGS
          </h3>
          <div className="space-y-1">
            {settingsItems.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Student</p>
            <p className="text-xs text-slate-400 truncate">student@university.edu</p>
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        </div>
      </div>
    </aside>
  );
};

export { Sidebar };
