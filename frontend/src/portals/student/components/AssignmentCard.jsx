import React from 'react';
import { Calendar, Clock, FileText, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { GradientCard, GradientButton } from '../../../shared/components';

const AssignmentCard = ({ assignment, className = '' }) => {
  const getStatusIcon = () => {
    switch (assignment.status) {
      case 'submitted':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'graded':
        return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
      case 'overdue':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
      submitted: { label: 'Submitted', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
      graded: { label: 'Graded', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      overdue: { label: 'Overdue', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
    };

    const config = statusConfig[assignment.status];
    return (
      <div className={`px-2 py-1 rounded border text-xs ${config.color}`}>
        {config.label}
      </div>
    );
  };

  const formatDueDate = () => {
    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    const diffInHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24 && diffInHours > 0) {
      return {
        text: `Due in ${Math.round(diffInHours)} hours`,
        urgent: true
      };
    } else if (diffInHours < 0) {
      return {
        text: `Overdue by ${Math.abs(Math.round(diffInHours))} hours`,
        urgent: true
      };
    }
    
    return {
      text: `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      urgent: false
    };
  };

  const dueInfo = formatDueDate();

  const getBorderClass = () => {
    if (assignment.status === 'overdue') return 'border-red-500/50';
    if (assignment.status === 'graded') return 'border-blue-500/50';
    if (assignment.status === 'submitted') return 'border-green-500/50';
    if (dueInfo.urgent) return 'border-yellow-500/50';
    return 'border-white/20';
  };

  return (
    <GradientCard 
      variant="glass"
      className={`hover:shadow-md transition-all duration-200 ${getBorderClass()} ${className}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="px-2 py-1 bg-white/10 backdrop-blur-sm rounded text-xs font-medium text-white">
                {assignment.course_code}
              </div>
              {getStatusIcon()}
            </div>
            <h3 className="font-semibold text-base text-white line-clamp-1">
              {assignment.title}
            </h3>
            {assignment.description && (
              <p className="text-sm text-gray-300 line-clamp-2">
                {assignment.description}
              </p>
            )}
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-3">
          {/* Due date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className={`${dueInfo.urgent ? 'text-yellow-300 font-medium' : 'text-gray-300'}`}>
              {dueInfo.text}
            </span>
          </div>

          {/* Points */}
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">
              {assignment.points} points
            </span>
          </div>

          {/* Submission type */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 capitalize">
              {assignment.submission_type} submission
            </span>
          </div>

          {/* Action button */}
          <GradientButton 
            variant="ghost" 
            size="sm" 
            className="w-full mt-4"
            disabled={assignment.status === 'graded'}
          >
            {assignment.status === 'pending' && 'Submit Assignment'}
            {assignment.status === 'submitted' && 'View Submission'}
            {assignment.status === 'graded' && 'View Grade'}
            {assignment.status === 'overdue' && 'Submit Late'}
          </GradientButton>
        </div>
      </div>
    </GradientCard>
  );
};

export { AssignmentCard };
