import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Save, 
  Send,
  ArrowLeft,
  Timer,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { quizService } from '../../../services/quizService';
import { GradientCard, GradientButton, LoadingSpinner } from '../../../shared/components';

const QuizAttempt = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Load quiz and check if student has ongoing attempt
  useEffect(() => {
    if (user && quizId) {
      loadQuizData();
    }
  }, [user, quizId]);

  // Timer effect
  useEffect(() => {
    if (hasStarted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [hasStarted, timeRemaining]);

  const loadQuizData = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await quizService.getQuizWithProgress(quizId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load quiz');
      }

      const { quiz: quizData, attempts } = result.data;
      setQuiz(quizData);

      // Check if quiz is active
      const now = new Date();
      const startDate = new Date(quizData.start_date);
      const endDate = new Date(quizData.end_date);

      if (now < startDate) {
        setError('Quiz has not started yet');
        return;
      }

      if (now > endDate) {
        setError('Quiz has ended');
        return;
      }

      // Check for ongoing attempt
      const ongoingAttempt = attempts.find(attempt => !attempt.submitted_at);
      
      if (ongoingAttempt) {
        setAttempt(ongoingAttempt);
        setHasStarted(true);
        
        // Load existing answers
        const existingAnswers = {};
        ongoingAttempt.answers.forEach(answer => {
          existingAnswers[answer.question_id] = {
            answerText: answer.answer_text,
            selectedOptions: answer.selected_options
          };
        });
        setAnswers(existingAnswers);

        // Calculate remaining time
        if (ongoingAttempt.time_remaining) {
          setTimeRemaining(Math.floor(ongoingAttempt.time_remaining / 1000000000)); // Convert from nanoseconds to seconds
        } else {
          // Calculate from quiz duration and start time
          const attemptStarted = new Date(ongoingAttempt.started_at);
          const durationMs = quizData.duration_minutes * 60 * 1000;
          const elapsed = now - attemptStarted;
          const remaining = Math.max(0, durationMs - elapsed);
          setTimeRemaining(Math.floor(remaining / 1000));
        }
      } else {
        // Check if student has reached max attempts
        const completedAttempts = attempts.filter(attempt => attempt.submitted_at);
        if (completedAttempts.length >= quizData.max_attempts) {
          setError('Maximum attempts reached for this quiz');
          return;
        }
      }

    } catch (err) {
      console.error('Error loading quiz data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startQuizAttempt = async () => {
    try {
      setLoading(true);
      const result = await quizService.startQuizAttempt(quizId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start quiz attempt');
      }

      setAttempt(result.data);
      setHasStarted(true);
      setTimeRemaining(quiz.duration_minutes * 60); // Convert minutes to seconds
      
    } catch (err) {
      console.error('Error starting quiz attempt:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !attempt) return;

    try {
      setIsSubmitting(true);

      // Format answers for submission
      const formattedAnswers = quiz.questions.map(question => ({
        questionId: question.id,
        answerText: answers[question.id]?.answerText || '',
        selectedOptions: answers[question.id]?.selectedOptions || []
      }));

      const result = await quizService.submitQuizAttempt(attempt.id, formattedAnswers);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit quiz');
      }

      // Navigate back to exam board with success message
      navigate('/student/exams', { 
        state: { 
          message: 'Quiz submitted successfully!',
          score: result.data.score 
        }
      });

    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, attempt, quiz, answers, navigate]);

  const formatTimeRemaining = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining > 300) return 'text-green-400'; // > 5 minutes
    if (timeRemaining > 60) return 'text-yellow-400'; // > 1 minute
    return 'text-red-400'; // < 1 minute
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 mt-4">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <GradientCard variant="glass" className="p-12 text-center border border-red-500/20">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Unable to Load Quiz</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <GradientButton onClick={() => navigate('/student/exams')}>
            Back to Exam Board
          </GradientButton>
        </GradientCard>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  // Quiz start screen
  if (!hasStarted) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/student/exams')}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Exam Board</span>
          </button>
        </div>

        <GradientCard variant="glass" className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{quiz.title}</h1>
            <p className="text-slate-400">{quiz.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Timer className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300 font-medium">Duration</span>
              </div>
              <p className="text-white text-lg">{quiz.duration_minutes} minutes</p>
            </div>

            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-slate-300 font-medium">Questions</span>
              </div>
              <p className="text-white text-lg">{quiz.questions.length} questions</p>
            </div>

            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-300 font-medium">Max Attempts</span>
              </div>
              <p className="text-white text-lg">{quiz.max_attempts}</p>
            </div>

            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Save className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300 font-medium">Total Points</span>
              </div>
              <p className="text-white text-lg">
                {quiz.questions.reduce((sum, q) => sum + q.points, 0)} points
              </p>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-8">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-yellow-300 font-medium mb-2">Important Instructions</h4>
                <ul className="text-yellow-200 text-sm space-y-1">
                  <li>• Once you start the quiz, the timer will begin immediately</li>
                  <li>• You must complete and submit within the time limit</li>
                  <li>• Your answers are automatically saved as you progress</li>
                  <li>• Make sure you have a stable internet connection</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <GradientButton onClick={startQuizAttempt} disabled={loading}>
              {loading ? 'Starting Quiz...' : 'Start Quiz'}
            </GradientButton>
          </div>
        </GradientCard>
      </div>
    );
  }

  // Quiz taking interface
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header with timer */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
          <div className={`flex items-center space-x-2 ${getTimeColor()}`}>
            <Timer className="w-5 h-5" />
            <span className="text-lg font-mono font-bold">
              {formatTimeRemaining(timeRemaining)}
            </span>
          </div>
        </div>
        
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              Question {Object.keys(answers).length} of {quiz.questions.length} answered
            </span>
            <span className="text-slate-400">
              Attempt ID: {attempt?.id?.slice(-8)}
            </span>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6 mb-8">
        {quiz.questions.map((question, index) => (
          <QuizQuestion
            key={question.id}
            question={question}
            index={index}
            answer={answers[question.id]}
            onAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
          />
        ))}
      </div>

      {/* Submit Section */}
      <GradientCard variant="glass" className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Ready to Submit?</h3>
            <p className="text-slate-400 text-sm">
              Make sure you've answered all questions before submitting.
            </p>
          </div>
          <GradientButton 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Quiz</span>
              </>
            )}
          </GradientButton>
        </div>
      </GradientCard>
    </div>
  );
};

// Quiz Question Component
const QuizQuestion = ({ question, index, answer, onAnswerChange }) => {
  const handleMultipleChoiceChange = (optionIndex) => {
    onAnswerChange({
      selectedOptions: [optionIndex.toString()],
      answerText: question.options[optionIndex]
    });
  };

  const handleTrueFalseChange = (value) => {
    onAnswerChange({
      selectedOptions: [value.toString()],
      answerText: value.toString()
    });
  };

  const handleTextChange = (text) => {
    onAnswerChange({
      answerText: text,
      selectedOptions: []
    });
  };

  return (
    <GradientCard variant="glass" className="p-6">
      <div className="mb-4">
        <div className="flex items-start space-x-3">
          <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm font-medium">
            Q{index + 1}
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white mb-2">{question.text}</h3>
            <span className="text-slate-400 text-sm">{question.points} points</span>
          </div>
        </div>
      </div>

      <div className="ml-10">
        {question.type === 'multiple_choice' && (
          <div className="space-y-3">
            {question.options.map((option, optionIndex) => (
              <label 
                key={optionIndex}
                className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={answer?.selectedOptions?.[0] === optionIndex.toString()}
                  onChange={() => handleMultipleChoiceChange(optionIndex)}
                  className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 focus:ring-blue-500"
                />
                <span className="text-white">{option}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'true_false' && (
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={answer?.selectedOptions?.[0] === 'true'}
                onChange={() => handleTrueFalseChange(true)}
                className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 focus:ring-blue-500"
              />
              <span className="text-white">True</span>
            </label>
            <label className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={answer?.selectedOptions?.[0] === 'false'}
                onChange={() => handleTrueFalseChange(false)}
                className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 focus:ring-blue-500"
              />
              <span className="text-white">False</span>
            </label>
          </div>
        )}

        {(question.type === 'short_answer' || question.type === 'essay') && (
          <div>
            <textarea
              value={answer?.answerText || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={question.type === 'essay' ? 'Write your essay answer here...' : 'Enter your answer...'}
              rows={question.type === 'essay' ? 8 : 3}
              className="w-full p-3 bg-slate-700/30 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
            {question.type === 'essay' && question.maxWords && (
              <p className="text-slate-400 text-sm mt-2">
                Maximum {question.maxWords} words
              </p>
            )}
          </div>
        )}
      </div>
    </GradientCard>
  );
};

export default QuizAttempt;
