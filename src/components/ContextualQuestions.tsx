/**
 * Composant pour afficher les questions suggérées contextuelles
 * Permet aux utilisateurs de poser des questions pertinentes basées sur le contenu
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Lightbulb, 
  TrendingUp, 
  Target,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Brain,
  BookOpen
} from 'lucide-react';
import { 
  generateContextualQuestions,
  generateFollowUpQuestions,
  filterQuestions,
  sortQuestionsByRelevance,
  type SuggestedQuestion,
  type QuestionSuggestionOptions
} from '../services/contextualQuestionsService';
import { toast } from 'sonner';

interface ContextualQuestionsProps {
  documentTitle: string;
  documentContent: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  lastResponse?: string;
  onQuestionClick?: (question: SuggestedQuestion) => void;
  className?: string;
}

export function ContextualQuestions({ 
  documentTitle, 
  documentContent, 
  conversationHistory = [],
  lastResponse,
  onQuestionClick,
  className = ''
}: ContextualQuestionsProps) {
  const [questions, setQuestions] = useState<SuggestedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<SuggestedQuestion['category'][]>([
    'clarification', 'exploration', 'approfondissement', 'application'
  ]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'priority' | 'relevance'>('priority');

  // Générer les questions initiales
  useEffect(() => {
    if (documentContent && documentTitle) {
      generateInitialQuestions();
    }
  }, [documentContent, documentTitle]);

  // Générer les questions de suivi quand la réponse change
  useEffect(() => {
    if (lastResponse && conversationHistory.length > 0) {
      generateFollowUpQuestions();
    }
  }, [lastResponse]);

  const generateInitialQuestions = async () => {
    setIsLoading(true);
    try {
      const generatedQuestions = await generateContextualQuestions(documentContent, documentTitle, {
        maxQuestions: 8,
        categories: selectedCategories
      });
      
      // Trier par pertinence
      const sortedQuestions = sortQuestionsByRelevance(generatedQuestions);
      setQuestions(sortedQuestions);
      
      toast.success('Questions suggérées générées', {
        description: `${sortedQuestions.length} questions pertinentes`
      });
    } catch (error: any) {
      console.error('❌ Erreur génération questions:', error);
      toast.error('Erreur lors de la génération des questions', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateFollowUpQuestions = async () => {
    if (!lastResponse) return;
    
    setIsLoading(true);
    try {
      const followUpQuestions = await generateFollowUpQuestions(
        conversationHistory,
        lastResponse,
        { maxQuestions: 5 }
      );
      
      // Ajouter aux questions existantes
      setQuestions(prev => [...prev, ...followUpQuestions]);
      
      toast.success('Questions de suivi générées', {
        description: `${followUpQuestions.length} nouvelles questions`
      });
    } catch (error: any) {
      console.error('❌ Erreur génération suivi:', error);
      toast.error('Erreur lors de la génération des questions de suivi', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionClick = (question: SuggestedQuestion) => {
    onQuestionClick?.(question);
  };

  const toggleQuestionExpansion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleCategoryToggle = (category: SuggestedQuestion['category']) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(newCategories);
    
    // Filtrer les questions
    const filteredQuestions = filterQuestions(questions, { categories: newCategories });
    setQuestions(filteredQuestions);
  };

  const handleSortToggle = () => {
    const newSortBy = sortBy === 'priority' ? 'relevance' : 'priority';
    setSortBy(newSortBy);
    
    const sortedQuestions = newSortBy === 'relevance' 
      ? sortQuestionsByRelevance(questions)
      : [...questions].sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    
    setQuestions(sortedQuestions);
  };

  const getCategoryIcon = (category: SuggestedQuestion['category']) => {
    switch (category) {
      case 'clarification': return <Lightbulb className="w-4 h-4" />;
      case 'exploration': return <TrendingUp className="w-4 h-4" />;
      case 'approfondissement': return <Target className="w-4 h-4" />;
      case 'application': return <Brain className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: SuggestedQuestion['category']) => {
    switch (category) {
      case 'clarification': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'exploration': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'approfondissement': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'application': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getPriorityIcon = (priority: SuggestedQuestion['priority']) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getDifficultyColor = (difficulty: SuggestedQuestion['estimatedDifficulty']) => {
    switch (difficulty) {
      case 'facile': return 'text-green-400';
      case 'moyenne': return 'text-yellow-400';
      case 'difficile': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Questions Suggérées IA</h3>
            <p className="text-sm text-white/70">Questions pertinentes basées sur le contexte</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generateInitialQuestions}
            disabled={isLoading || !documentContent}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 rounded-lg transition-colors text-blue-300 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Regénérer
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/60 text-sm"
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>
      </div>

      {/* Filtres */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 rounded-lg p-4 border border-white/10"
          >
            <div className="space-y-4">
              {/* Catégories */}
              <div>
                <h4 className="text-sm font-medium text-white/80 mb-3">Catégories :</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'clarification', label: 'Clarification', icon: <Lightbulb className="w-4 h-4" /> },
                    { id: 'exploration', label: 'Exploration', icon: <TrendingUp className="w-4 h-4" /> },
                    { id: 'approfondissement', label: 'Approfondissement', icon: <Target className="w-4 h-4" /> },
                    { id: 'application', label: 'Application', icon: <Brain className="w-4 h-4" /> }
                  ].map(category => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id as any)}
                        onChange={() => handleCategoryToggle(category.id as any)}
                        className="rounded border-white/20 bg-white/10 text-blue-400 focus:ring-blue-400/50"
                      />
                      <div className="flex items-center gap-2">
                        {category.icon}
                        <span className="text-sm text-white/80">{category.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tri */}
              <div>
                <h4 className="text-sm font-medium text-white/80 mb-3">Tri par :</h4>
                <button
                  onClick={handleSortToggle}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/60 text-sm w-full"
                >
                  <BookOpen className="w-4 h-4" />
                  {sortBy === 'priority' ? 'Priorité' : 'Pertinence'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions */}
      <div className="space-y-3">
        {questions.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">Aucune question suggérée disponible</p>
            <p className="text-sm text-white/40 mt-2">
              Générez des questions en cliquant sur "Regénérer"
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-blue-300">Génération des questions...</span>
            </div>
          </div>
        )}

        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:bg-white/10 transition-colors"
          >
            <button
              onClick={() => handleQuestionClick(question)}
              className="w-full text-left p-4"
            >
              <div className="flex items-start gap-3">
                {/* Catégorie et priorité */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-2 rounded-lg border ${getCategoryColor(question.category)}`}>
                    {getCategoryIcon(question.category)}
                  </div>
                  <span className="text-lg">{getPriorityIcon(question.priority)}</span>
                </div>

                {/* Contenu de la question */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium mb-2 leading-relaxed">
                    {question.question}
                  </h4>

                  {/* Métadonnées */}
                  <div className="flex items-center gap-4 text-xs text-white/60 mb-2">
                    <span className={`font-medium ${getDifficultyColor(question.estimatedDifficulty)}`}>
                      {question.estimatedDifficulty}
                    </span>
                    <span>•</span>
                    <span>{question.category}</span>
                    <span>•</span>
                    <span>{question.priority}</span>
                  </div>

                  {/* Mots-clés */}
                  {question.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {question.keywords.map((keyword, keywordIndex) => (
                        <span
                          key={keywordIndex}
                          className="px-2 py-1 bg-white/10 rounded text-xs text-white/70"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Contexte (expandable) */}
                  {question.context && (
                    <div className="mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleQuestionExpansion(index);
                        }}
                        className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ChevronDown 
                          className={`w-3 h-3 transition-transform ${
                            expandedQuestions.has(index) ? 'rotate-180' : ''
                          }`}
                        />
                        Contexte
                      </button>

                      <AnimatePresence>
                        {expandedQuestions.has(index) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-2 p-3 bg-white/5 rounded border border-white/10 text-xs text-white/60"
                          >
                            {question.context}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Statistiques */}
      {questions.length > 0 && (
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between text-sm text-white/60">
            <span>{questions.length} questions suggérées</span>
            <span>
              {selectedCategories.length} catégories actives
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
