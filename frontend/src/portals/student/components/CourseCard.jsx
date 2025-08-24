import React from 'react';
import { Clock, MapPin, Users, ExternalLink, BookOpen } from 'lucide-react';
import { GradientCard, GradientButton } from '../../../shared/components';

const CourseCard = ({ course, className = '' }) => {
  // Helper function to format course code from title
  const getCourseCode = () => {
    // Extract course code from title if it exists, or create one
    const match = course.title?.match(/^([A-Z]{2,4}\s?\d{3,4})/);
    return match ? match[1] : course.title?.slice(0, 8).toUpperCase() || 'COURSE';
  };

  // Helper function to get a color based on course ID
  const getCourseColor = () => {
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
    // Use course ID to determine color consistently
    const colorIndex = course.id ? parseInt(course.id.slice(-1), 16) % colors.length : 0;
    return colors[colorIndex];
  };

  // Helper function to format lessons count
  const getLessonsInfo = () => {
    const lessonCount = course.lessons?.length || 0;
    return `${lessonCount} lesson${lessonCount !== 1 ? 's' : ''}`;
  };

  // Helper function to get enrollment count
  const getEnrollmentCount = () => {
    return course.enrolled_students?.length || 0;
  };

  const courseColor = getCourseColor();

  return (
    <div className={`bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}>
      {/* Color accent bar */}
      <div 
        className="h-1 w-full"
        style={{ backgroundColor: courseColor }}
      />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">
              {getCourseCode()}
            </h3>
            <p className="text-sm text-slate-400 line-clamp-2">
              {course.title}
            </p>
          </div>
          <div 
            className="px-2 py-1 rounded text-xs font-medium text-white flex items-center space-x-1"
            style={{ backgroundColor: courseColor }}
          >
            <BookOpen className="w-3 h-3" />
            <span>{course.is_published ? 'Active' : 'Draft'}</span>
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-slate-400 mb-3 line-clamp-2">
            {course.description}
          </p>
        )}

        {/* Instructor */}
        <div className="flex items-center space-x-2 text-sm text-slate-400 mb-3">
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: courseColor }}
          />
          <span>{course.instructor_name || 'Instructor'}</span>
        </div>

        {/* Course Info */}
        <div className="flex items-center space-x-2 text-sm text-slate-400 mb-3">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{getLessonsInfo()}</span>
        </div>

        {/* Enrollment */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center space-x-2 text-slate-400">
            <Users className="w-4 h-4" />
            <span>
              {getEnrollmentCount()} student{getEnrollmentCount() !== 1 ? 's' : ''} enrolled
            </span>
          </div>
        </div>

        {/* Action button */}
        <button className="w-full flex items-center justify-between p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-white transition-colors group">
          <span>View Course</span>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export { CourseCard };