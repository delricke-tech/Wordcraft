import { useState } from 'react';
import { Check, X, ChevronRight, Trophy, RotateCcw } from 'lucide-react';
import { GeneratedQuiz, QuizQuestion, calculateQuizScore } from '../../services/quizGenerator';

interface QuizPlayerProps {
  quiz: GeneratedQuiz;
}

export function QuizPlayer({ quiz }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const hasAnswered = selectedAnswer !== null;

  const handleSelectAnswer = (optionIndex: number) => {
    if (!showExplanation) {
      setSelectedAnswer(optionIndex);
    }
  };

  const handleValidate = () => {
    if (selectedAnswer === null) return;

    // Sauvegarder la réponse
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer
    }));

    // Afficher l'explication
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Quiz terminé
      setQuizCompleted(true);
    } else {
      // Question suivante
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizCompleted(false);
  };

  // Résultats du quiz
  if (quizCompleted) {
    const results = calculateQuizScore(userAnswers, quiz.questions);
    const passThreshold = 60; // 60% pour réussir
    const passed = results.percentage >= passThreshold;

    return (
      <div className="space-y-6">
        {/* Score */}
        <div className={`p-8 rounded-2xl text-center ${
          passed 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200' 
            : 'bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200'
        }`}>
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${
            passed ? 'text-green-600' : 'text-orange-600'
          }`} />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {passed ? '🎉 Félicitations !' : '💪 Presque réussi !'}
          </h2>
          <p className="text-xl text-gray-700 mb-4">
            Score : {results.correctCount}/{results.totalCount} ({results.percentage}%)
          </p>
          <p className="text-gray-600">
            {passed 
              ? 'Excellent travail ! Vous maîtrisez bien ce sujet.' 
              : 'Continuez à réviser, vous y êtes presque !'}
          </p>
        </div>

        {/* Détails des réponses */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Détails des réponses</h3>
          {quiz.questions.map((question, index) => {
            const userAnswer = userAnswers[question.id];
            const isCorrect = userAnswer === question.correctAnswer;

            return (
              <div
                key={question.id}
                className={`p-4 rounded-xl border-2 ${
                  isCorrect 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">
                      Question {index + 1} : {question.question}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Votre réponse :</span>{' '}
                      {question.options[userAnswer]}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Bonne réponse :</span>{' '}
                        {question.options[question.correctAnswer]}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-2 italic">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <RotateCcw size={20} />
            Recommencer le quiz
          </button>
        </div>
      </div>
    );
  }

  // Affichage de la question
  return (
    <div className="space-y-6">
      {/* Progression */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Question {currentQuestionIndex + 1} sur {quiz.questions.length}
        </div>
        <div className="flex gap-1">
          {quiz.questions.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-8 rounded-full transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-teal-600'
                  : index < currentQuestionIndex
                  ? 'bg-teal-300'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 p-6 rounded-xl border border-teal-200">
        <h3 className="text-xl font-semibold text-gray-900">
          {currentQuestion.question}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = index === currentQuestion.correctAnswer;
          const showResult = showExplanation;

          let optionClass = 'border-gray-300 hover:border-teal-500 hover:bg-teal-50';
          
          if (showResult) {
            if (isCorrect) {
              optionClass = 'border-green-500 bg-green-50';
            } else if (isSelected && !isCorrect) {
              optionClass = 'border-red-500 bg-red-50';
            }
          } else if (isSelected) {
            optionClass = 'border-teal-500 bg-teal-50';
          }

          return (
            <button
              key={index}
              onClick={() => handleSelectAnswer(index)}
              disabled={showExplanation}
              className={`w-full p-4 border-2 rounded-xl text-left transition-all ${optionClass} ${
                showExplanation ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium ${
                  showResult && isCorrect
                    ? 'border-green-600 bg-green-600 text-white'
                    : showResult && isSelected && !isCorrect
                    ? 'border-red-600 bg-red-600 text-white'
                    : isSelected
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-gray-300 text-gray-600'
                }`}>
                  {showResult && isCorrect ? (
                    <Check size={20} />
                  ) : showResult && isSelected && !isCorrect ? (
                    <X size={20} />
                  ) : (
                    String.fromCharCode(65 + index) // A, B, C, D
                  )}
                </div>
                <span className="flex-1 text-gray-900">{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Explication */}
      {showExplanation && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm font-medium text-blue-900 mb-1">💡 Explication</p>
          <p className="text-sm text-blue-800">{currentQuestion.explanation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {!showExplanation ? (
          <button
            onClick={handleValidate}
            disabled={!hasAnswered}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Valider
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            {isLastQuestion ? 'Voir les résultats' : 'Question suivante'}
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
