import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  Calendar,
  User,
  BookOpen,
  Target
} from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { quizService } from '../../../services/quizService';
import { GradientCard, GradientButton, LoadingSpinner } from '../../../shared/components';

const AttemptReview = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && attemptId) {
      loadAttemptData();
    }
  }, [user, attemptId]);

  const loadAttemptData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the attempt details
      const attemptResult = await quizService.getAttemptDetails(attemptId);
      if (!attemptResult.success) {
        throw new Error(attemptResult.error || 'Failed to load attempt');
      }

      const attemptData = attemptResult.data;
      setAttempt(attemptData);

      // Get the quiz details
      const quizResult = await quizService.getQuizWithProgress(attemptData.quiz_id);
      if (!quizResult.success) {
        throw new Error(quizResult.error || 'Failed to load quiz');
      }

      setQuiz(quizResult.data.quiz);
    } catch (err) {
      console.error('Error loading attempt data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp)).toLocaleString();
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
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

  const getAnswerIcon = (isCorrect) => {
    return isCorrect ? CheckCircle2 : XCircle;
  };

  const getAnswerColor = (isCorrect) => {
    return isCorrect ? 'text-green-400' : 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <h3 className="text-xl font-semibold text-white mb-2 mt-4">Loading Attempt Review</h3>
          <p className="text-slate-400">Please wait while we load your attempt details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <GradientCard variant="glass" className="p-12 text-center border border-red-500/20 max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Attempt</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <div className="space-y-2">
            <GradientButton onClick={loadAttemptData} className="w-full">
              Try Again
            </GradientButton>
            <button 
              onClick={() => navigate(-1)}
              className="w-full text-slate-400 hover:text-white transition-colors"
            >
              Go Back
            </button>
          </div>
        </GradientCard>
      </div>
    );
  }

  if (!attempt || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <GradientCard variant="glass" className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Attempt Not Found</h3>
          <p className="text-slate-400 mb-4">The attempt you're looking for doesn't exist or you don't have permission to view it.</p>
          <GradientButton onClick={() => navigate(-1)}>
            Go Back
          </GradientButton>
        </GradientCard>
      </div>
    );
  }

  const percentage = Math.round((attempt.score / attempt.max_score) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Attempt Review</h1>
              <p className="text-slate-400">Review your quiz performance and answers</p>
            </div>
          </div>
        </div>

        {/* Score Overview */}
        <GradientCard variant="glass" className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(attempt.score, attempt.max_score)}`}>
                {attempt.score}/{attempt.max_score}
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getScoreBadgeColor(attempt.score, attempt.max_score)}`}>
                <Award className="w-4 h-4 mr-1" />
                {percentage}%
              </div>
              <p className="text-slate-400 text-sm mt-2">Final Score</p>
            </div>

            {/* Time Taken */}
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">
                {formatDuration(attempt.time_taken)}
              </div>
              <div className="flex items-center justify-center text-slate-400">
                <Clock className="w-4 h-4 mr-1" />
                <span className="text-sm">Time Taken</span>
              </div>
            </div>

            {/* Attempt Number */}
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">
                #{attempt.attempt_number}
              </div>
              <div className="flex items-center justify-center text-slate-400">
                <Target className="w-4 h-4 mr-1" />
                <span className="text-sm">Attempt</span>
              </div>
            </div>

            {/* Submitted Date */}
            <div className="text-center">
              <div className="text-lg font-bold text-white mb-2">
                {formatDate(attempt.submitted_at)}
              </div>
              <div className="flex items-center justify-center text-slate-400">
                <Calendar className="w-4 h-4 mr-1" />
                <span className="text-sm">Submitted</span>
              </div>
            </div>
          </div>
        </GradientCard>

        {/* Quiz Information */}
        <GradientCard variant="glass" className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quiz Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Quiz Title</p>
                <p className="text-white font-medium">{quiz.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-slate-400">Time Limit</p>
                <p className="text-white font-medium">{quiz.duration_minutes} minutes</p>
              </div>
            </div>
          </div>
          {quiz.description && (
            <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
              <p className="text-slate-300">{quiz.description}</p>
            </div>
          )}
        </GradientCard>

        {/* Question Review */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Question Review</h2>
          
          {attempt.answers.map((answer, index) => {
            const question = quiz.questions.find(q => q.id === answer.question_id);
            if (!question) return null;

            const isCorrect = answer.is_correct;
            const AnswerIcon = getAnswerIcon(isCorrect);
            const answerColor = getAnswerColor(isCorrect);

            return (
              <GradientCard key={answer.question_id} variant="glass" className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-slate-400 text-sm">Question {index + 1}</span>
                      <div className={`flex items-center space-x-1 ${answerColor}`}>
                        <AnswerIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-3">{question.question_text}</h3>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${answerColor}`}>
                      {isCorrect ? question.points : 0}/{question.points}
                    </div>
                    <div className="text-xs text-slate-400">points</div>
                  </div>
                </div>

                {/* Multiple Choice / True False */}
                {(question.question_type.MultipleChoice || question.question_type.TrueFalse) && (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = answer.selected_option === option;
                      const isCorrectOption = question.correct_answer === option;
                      
                      let optionClass = 'p-3 rounded-lg border ';
                      if (isSelected && isCorrectOption) {
                        optionClass += 'bg-green-500/20 border-green-500/50 text-green-300';
                      } else if (isSelected && !isCorrectOption) {
                        optionClass += 'bg-red-500/20 border-red-500/50 text-red-300';
                      } else if (!isSelected && isCorrectOption) {
                        optionClass += 'bg-green-500/10 border-green-500/30 text-green-400';
                      } else {
                        optionClass += 'bg-slate-700/30 border-slate-600/50 text-slate-300';
                      }

                      return (
                        <div key={optionIndex} className={optionClass}>
                          <div className="flex items-center justify-between">
                            <span>{option}</span>
                            <div className="flex items-center space-x-2">
                              {isSelected && (
                                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                  Your Answer
                                </span>
                              )}
                              {isCorrectOption && (
                                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                                  Correct Answer
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer / Essay */}
                {(question.question_type.ShortAnswer || question.question_type.Essay) && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Your Answer:</p>
                      <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                        <p className="text-slate-300">{answer.text_answer || 'No answer provided'}</p>
                      </div>
                    </div>
                    
                    {question.correct_answer && (
                      <div>
                        <p className="text-sm text-slate-400 mb-2">Expected Answer:</p>
                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                          <p className="text-green-300">{question.correct_answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {question.explanation && (
                  <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <p className="text-sm text-blue-400 font-medium mb-1">Explanation:</p>
                    <p className="text-blue-300 text-sm">{question.explanation}</p>
                  </div>
                )}
              </GradientCard>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <GradientButton
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Attempts
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default AttemptReview;
