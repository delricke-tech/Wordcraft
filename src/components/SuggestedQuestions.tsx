/**
 * Composant d'affichage des questions suggérées contextuelles
 * 
 * Ce composant affiche des questions pertinentes basées sur :
 * - Le contenu du document actuel
 * - L'historique de conversation
 * - Le contexte utilisateur
 * 
 * Date: 10 mars 2026
 */

import React, { useState, useEffect, useCallback } from 'react';
import { generateSuggestedQuestions, updateQuestionsBasedOnFeedback, type SuggestedQuestion } from '../services/suggestedQuestionsService';
import type { DocumentContext, ChatMessage } from '../services/openaiService';

interface SuggestedQuestionsProps {
  documentContext: DocumentContext;
  conversationHistory?: ChatMessage[];
  onQuestionSelect?: (question: string) => void;
  maxQuestions?: number;
  showCategories?: boolean;
  className?: string;
}

interface QuestionCategory {
  name: string;
  icon: string;
  color: string;
  description: string;
}

const QUESTION_CATEGORIES: Record<SuggestedQuestion['category'], QuestionCategory> = {
  clarification: {
    name: 'Clarification',
    icon: '💡',
    color: 'blue',
    description: 'Questions pour mieux comprendre'
  },
  approfondissement: {
    name: 'Approfondissement',
    icon: '🔍',
    color: 'purple',
    description: 'Questions pour explorer plus loin'
  },
  application: {
    name: 'Application',
    icon: '🛠️',
    color: 'green',
    description: 'Questions pour appliquer les connaissances'
  },
  synthèse: {
    name: 'Synthèse',
    icon: '📝',
    color: 'orange',
    description: 'Questions pour résumer et structurer'
  },
  comparaison: {
    name: 'Comparaison',
    icon: '⚖️',
    color: 'red',
    description: 'Questions pour comparer et analyser'
  }
};

const PRIORITY_CONFIG = {
  high: { icon: '🔥', color: 'red', label: 'Prioritaire' },
  medium: { icon: '⭐', color: 'yellow', label: 'Intéressant' },
  low: { icon: '💭', color: 'gray', label: 'Optionnel' }
};

const COMPLEXITY_LABELS = {
  1: 'Très simple',
  2: 'Simple',
  3: 'Moyen',
  4: 'Complexe',
  5: 'Très complexe'
};

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  documentContext,
  conversationHistory = [],
  onQuestionSelect,
  maxQuestions = 6,
  showCategories = true,
  className = ''
}) => {
  const [questions, setQuestions] = useState<SuggestedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SuggestedQuestion['category'] | 'all'>('all');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});

  // Charger les questions au montage et quand le contexte change
  useEffect(() => {
    loadQuestions();
  }, [documentContext.documentId, conversationHistory.length]);

  const loadQuestions = useCallback(async () => {
    if (!documentContext.extractedText) {
      setError('Le contenu du document doit être extrait pour générer des questions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateSuggestedQuestions(
        documentContext,
        conversationHistory,
        {
          maxQuestions,
          includeContextualHints: true,
          adaptToUserLevel: true
        }
      );

      setQuestions(result.questions);
      console.log(`✅ ${result.questions.length} questions suggérées générées`);
      
    } catch (err) {
      console.error('❌ Erreur chargement questions:', err);
      setError('Impossible de générer des questions suggérées');
    } finally {
      setLoading(false);
    }
  }, [documentContext, conversationHistory, maxQuestions]);

  const handleQuestionSelect = useCallback((question: SuggestedQuestion) => {
    if (onQuestionSelect) {
      onQuestionSelect(question.text);
    }
    
    // Marquer la question comme utilisée
    setFeedbackGiven(prev => ({ ...prev, [question.id]: true }));
    
    // Mettre à jour les questions basées sur la sélection
    updateQuestions(question);
  }, [onQuestionSelect]);

  const updateQuestions = useCallback(async (selectedQuestion: SuggestedQuestion) => {
    try {
      const updatedQuestions = await updateQuestionsBasedOnFeedback(
        questions,
        selectedQuestion.id,
        'helpful'
      );
      setQuestions(updatedQuestions);
    } catch (err) {
      console.warn('⚠️ Erreur mise à jour questions:', err);
    }
  }, [questions]);

  const handleFeedback = useCallback(async (questionId: string, helpful: boolean) => {
    setFeedbackGiven(prev => ({ ...prev, [questionId]: true }));
    
    if (helpful) {
      try {
        const updatedQuestions = await updateQuestionsBasedOnFeedback(
          questions,
          questionId,
          'helpful'
        );
        setQuestions(updatedQuestions);
      } catch (err) {
        console.warn('⚠️ Erreur mise à jour questions:', err);
      }
    }
  }, [questions]);

  const filteredQuestions = React.useMemo(() => {
    if (selectedCategory === 'all') return questions;
    return questions.filter(q => q.category === selectedCategory);
  }, [questions, selectedCategory]);

  const questionsByCategory = React.useMemo(() => {
    const grouped: Record<SuggestedQuestion['category'], SuggestedQuestion[]> = {
      clarification: [],
      approfondissement: [],
      application: [],
      synthèse: [],
      comparaison: []
    };

    questions.forEach(q => {
      grouped[q.category].push(q);
    });

    return grouped;
  }, [questions]);

  const getCategoryStats = () => {
    return Object.entries(questionsByCategory).map(([category, categoryQuestions]) => ({
      category: category as SuggestedQuestion['category'],
      count: categoryQuestions.length,
      ...QUESTION_CATEGORIES[category as SuggestedQuestion['category']]
    }));
  };

  if (loading) {
    return (
      <div className={`suggested-questions loading ${className}`}>
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Génération des questions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`suggested-questions error ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={loadQuestions}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={`suggested-questions empty ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <span className="text-gray-500">Aucune question suggérée disponible</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`suggested-questions ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Questions suggérées
        </h3>
        <p className="text-sm text-gray-600">
          Basées sur votre document et votre conversation
        </p>
      </div>

      {/* Filtres par catégorie */}
      {showCategories && questions.length > 3 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Toutes ({questions.length})
            </button>
            {getCategoryStats().map(({ category, count, icon, color }) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {icon} {count}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Liste des questions */}
      <div className="space-y-3">
        {filteredQuestions.map((question) => {
          const category = QUESTION_CATEGORIES[question.category];
          const priority = PRIORITY_CONFIG[question.priority];
          const isExpanded = expandedQuestion === question.id;
          const hasFeedback = feedbackGiven[question.id];

          return (
            <div
              key={question.id}
              className={`bg-white border rounded-lg p-4 transition-all hover:shadow-md ${
                hasFeedback ? 'opacity-75' : ''
              }`}
            >
              {/* En-tête de la question */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className={`text-xs px-2 py-1 rounded-full bg-${category.color}-100 text-${category.color}-700`}>
                    {category.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {COMPLEXITY_LABELS[question.estimatedComplexity]}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm">{priority.icon}</span>
                </div>
              </div>

              {/* Texte de la question */}
              <button
                onClick={() => handleQuestionSelect(question)}
                className="w-full text-left text-gray-800 hover:text-blue-600 transition-colors font-medium mb-2"
                disabled={hasFeedback}
              >
                {question.text}
              </button>

              {/* Métadonnées */}
              {(question.context || question.relatedTopics?.length) && (
                <div className="text-xs text-gray-500 mb-2">
                  {question.context && (
                    <div className="mb-1">
                      <span className="font-medium">Contexte : </span>
                      {question.context}
                    </div>
                  )}
                  {question.relatedTopics && question.relatedTopics.length > 0 && (
                    <div>
                      <span className="font-medium">Sujets liés : </span>
                      {question.relatedTopics.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex gap-2">
                  {!hasFeedback && (
                    <>
                      <button
                        onClick={() => handleFeedback(question.id, true)}
                        className="text-xs text-green-600 hover:text-green-700"
                        title="Cette question est utile"
                      >
                        👍 Utile
                      </button>
                      <button
                        onClick={() => handleFeedback(question.id, false)}
                        className="text-xs text-red-600 hover:text-red-700"
                        title="Cette question n'est pas pertinente"
                      >
                        👍 Pas utile
                      </button>
                    </>
                  )}
                  {hasFeedback && (
                    <span className="text-xs text-gray-500">Merci pour votre feedback !</span>
                  )}
                </div>
                
                {question.keywords && question.keywords.length > 0 && (
                  <button
                    onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    {isExpanded ? 'Masquer' : 'Mots-clés'}
                  </button>
                )}
              </div>

              {/* Mots-clés (expandable) */}
              {isExpanded && question.keywords && (
                <div className="mt-2 pt-2 border-t">
                  <div className="flex flex-wrap gap-1">
                    {question.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{questions.length} questions générées</span>
          <button
            onClick={loadQuestions}
            className="text-blue-600 hover:text-blue-700"
          >
            🔄 Actualiser
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestedQuestions;
