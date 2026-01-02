import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Home,
  RotateCcw,
  Trophy,
  Target,
  Award,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  question_count: number;
  settings: {
    time_limit_minutes?: number;
    passing_score: number;
    show_correct_answers: boolean;
    randomize_questions: boolean;
    randomize_options: boolean;
  };
}

export function TakeQuiz() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState(new Date());

  useEffect(() => {
    if (id) {
      fetchQuizData();
    }
  }, [id]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || showResults) return;

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResults]);

  const fetchQuizData = async () => {
    try {
      // Récupérer le quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();

      if (quizError) throw quizError;

      setQuiz(quizData);

      // Récupérer les questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', id)
        .order('position', { ascending: true });

      if (questionsError) throw questionsError;

      // Mélanger les questions si nécessaire
      let finalQuestions = questionsData || [];
      if (quizData.settings.randomize_questions) {
        finalQuestions = [...finalQuestions].sort(() => Math.random() - 0.5);
      }

      // Mélanger les options si nécessaire
      if (quizData.settings.randomize_options) {
        finalQuestions = finalQuestions.map((q) => {
          const shuffledOptions = [...q.options];
          const correctOption = shuffledOptions[q.correct_answer];
          
          // Fisher-Yates shuffle
          for (let i = shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
          }

          // Trouver le nouvel index de la bonne réponse
          const newCorrectIndex = shuffledOptions.indexOf(correctOption);

          return {
            ...q,
            options: shuffledOptions,
            correct_answer: newCorrectIndex,
          };
        });
      }

      setQuestions(finalQuestions);

      // Initialiser le timer si nécessaire
      if (quizData.settings.time_limit_minutes) {
        setTimeLeft(quizData.settings.time_limit_minutes * 60);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du quiz:', error);
      toast.error('Impossible de charger le quiz');
      navigate('/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: optionIndex,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    const correctAnswers = questions.filter(
      (q, index) => answers[index] === q.correct_answer
    ).length;

    const score = Math.round((correctAnswers / questions.length) * 100);
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    // Enregistrer la tentative
    try {
      const { error } = await supabase.from('quiz_attempts').insert({
        quiz_id: id,
        user_id: user?.id,
        score,
        total_questions: questions.length,
        correct_answers: correctAnswers,
        time_taken_seconds: duration,
        answers: Object.keys(answers).map((key) => ({
          question_index: parseInt(key),
          selected_answer: answers[parseInt(key)],
          is_correct:
            answers[parseInt(key)] === questions[parseInt(key)].correct_answer,
        })),
      });

      if (error) console.error('Erreur enregistrement tentative:', error);

      // Mettre à jour les statistiques du quiz
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('total_attempts, average_score')
        .eq('id', id)
        .single();

      if (quizData) {
        const newTotalAttempts = (quizData.total_attempts || 0) + 1;
        const newAverageScore =
          ((quizData.average_score || 0) * (quizData.total_attempts || 0) + score) /
          newTotalAttempts;

        await supabase
          .from('quizzes')
          .update({
            total_attempts: newTotalAttempts,
            average_score: newAverageScore,
          })
          .eq('id', id);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
    }

    setShowResults(true);
    
    if (score >= (quiz?.settings.passing_score || 70)) {
      toast.success(`Félicitations ! Score : ${score}%`);
    } else {
      toast.error(`Score : ${score}% - Continuez vos efforts !`);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setTimeLeft(
      quiz?.settings.time_limit_minutes
        ? quiz.settings.time_limit_minutes * 60
        : null
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz introuvable</h2>
          <Link
            to="/quizzes"
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            Retour aux quiz
          </Link>
        </div>
      </div>
    );
  }

  if (showResults) {
    const correctAnswers = questions.filter(
      (q, index) => answers[index] === q.correct_answer
    ).length;
    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= quiz.settings.passing_score;

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                passed ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {passed ? (
                <Trophy className="w-10 h-10 text-green-600" />
              ) : (
                <Target className="w-10 h-10 text-red-600" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {passed ? 'Félicitations !' : 'Continuez vos efforts !'}
            </h2>
            <p className="text-gray-600">
              Votre score : {correctAnswers} / {questions.length}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Score</p>
              <p className="text-2xl font-bold text-gray-900">{score}%</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Bonnes réponses</p>
              <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Mauvaises réponses</p>
              <p className="text-2xl font-bold text-red-600">
                {questions.length - correctAnswers}
              </p>
            </div>
          </div>

          {quiz.settings.show_correct_answers && (
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-gray-900">Correction</h3>
              {questions.map((question, index) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer === question.correct_answer;

                return (
                  <div
                    key={question.id}
                    className={`border-2 rounded-xl p-4 ${
                      isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">
                          {index + 1}. {question.question_text}
                        </p>
                        {userAnswer !== undefined && (
                          <p className="text-sm text-gray-600 mb-1">
                            Votre réponse :{' '}
                            <span
                              className={
                                isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'
                              }
                            >
                              {question.options[userAnswer]}
                            </span>
                          </p>
                        )}
                        {!isCorrect && (
                          <p className="text-sm text-gray-600 mb-1">
                            Bonne réponse :{' '}
                            <span className="text-green-700 font-medium">
                              {question.options[question.correct_answer]}
                            </span>
                          </p>
                        )}
                        {question.explanation && (
                          <p className="text-sm text-gray-600 mt-2 p-3 bg-white rounded-lg">
                            💡 {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <RotateCcw size={20} />
              Réessayer
            </button>
            <Link
              to="/quizzes"
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home size={20} />
              Retour aux quiz
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            {timeLeft !== null && (
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                <Clock size={20} />
                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>
              Question {currentQuestionIndex + 1} sur {questions.length}
            </span>
            <span>{Math.round(progress)}% complété</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion.question_text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  answers[currentQuestionIndex] === index
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQuestionIndex] === index
                        ? 'border-teal-600 bg-teal-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {answers[currentQuestionIndex] === index && (
                      <CheckCircle2 size={16} className="text-white" />
                    )}
                  </div>
                  <span className="flex-1 font-medium text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={20} />
            Précédent
          </button>

          <div className="text-sm text-gray-600">
            {Object.keys(answers).length} / {questions.length} réponses
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== questions.length}
              className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Award size={20} />
              Terminer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Suivant
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
