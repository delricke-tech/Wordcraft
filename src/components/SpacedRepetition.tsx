/**
 * Composant de révision espacée avec algorithme SM-2
 * Interface complète pour l'étude optimisée avec suivi de progression
 * 
 * Date: 6 mars 2025
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Clock, 
  Target, 
  TrendingUp, 
  BarChart3,
  CheckCircle,
  XCircle,
  RotateCcw,
  Play,
  Pause,
  Settings,
  Download,
  Award,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  SpacedRepetitionCard,
  ReviewSession,
  ReviewResult,
  StudyStatistics,
  calculateStudyStatistics,
  getPriorityCards,
  updateCardAfterReview,
  exportSpacedRepetitionData
} from '../services/spacedRepetitionService';
import { supabase } from '../lib/supabase';

interface SpacedRepetitionProps {
  userId: string;
  documentId?: string;
  className?: string;
}

export function SpacedRepetition({ userId, documentId, className = "" }: SpacedRepetitionProps) {
  // États principaux
  const [cards, setCards] = useState<SpacedRepetitionCard[]>([]);
  const [currentCard, setCurrentCard] = useState<SpacedRepetitionCard | null>(null);
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [statistics, setStatistics] = useState<StudyStatistics | null>(null);
  
  // États de configuration
  const [focusMode, setFocusMode] = useState<'focused' | 'relaxed' | 'intense'>('focused');
  const [maxCardsPerSession, setMaxCardsPerSession] = useState(20);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // États de progression
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [cardStartTime, setCardStartTime] = useState<Date | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Charger les cartes de l'utilisateur
  const loadCards = useCallback(async () => {
    try {
      let query = supabase
        .from('spaced_repetition_cards')
        .select('*')
        .eq('user_id', userId)
        .order('next_review_date', { ascending: true });

      if (documentId) {
        query = query.eq('document_id', documentId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      const formattedCards: SpacedRepetitionCard[] = (data || []).map(card => ({
        ...card,
        nextReviewDate: new Date(card.next_review_date),
        lastReviewDate: card.last_review_date ? new Date(card.last_review_date) : undefined,
        createdAt: new Date(card.created_at),
        updatedAt: new Date(card.updated_at),
        tags: card.tags || []
      }));

      setCards(formattedCards);
      
      // Calculer les statistiques
      const stats = calculateStudyStatistics(formattedCards);
      setStatistics(stats);
      
    } catch (error: any) {
      console.error('Erreur chargement cartes:', error);
      toast.error('Erreur', {
        description: 'Impossible de charger vos cartes de révision'
      });
    }
  }, [userId, documentId]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Démarrer une session de révision
  const startReviewSession = () => {
    const cardsToReview = getPriorityCards(cards, maxCardsPerSession);
    
    if (cardsToReview.length === 0) {
      toast.info('Aucune carte à réviser', {
        description: 'Toutes vos cartes sont à jour pour aujourd\'hui !'
      });
      return;
    }

    const newSession: ReviewSession = {
      id: `session_${Date.now()}`,
      userId,
      cards: cardsToReview,
      startTime: new Date(),
      cardsReviewed: 0,
      correctAnswers: 0,
      averageResponseTime: 0,
      focusMode
    };

    setSession(newSession);
    setIsReviewing(true);
    setSessionStartTime(new Date());
    setReviewedCount(0);
    setCorrectCount(0);
    setCurrentCard(cardsToReview[0]);
    setShowAnswer(false);
    setCardStartTime(new Date());
  };

  // Soumettre une réponse
  const submitAnswer = async (difficulty: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard || !cardStartTime) return;

    const responseTime = (new Date().getTime() - cardStartTime.getTime()) / 1000;
    const isCorrect = difficulty !== 'again';

    const reviewResult: ReviewResult = {
      cardId: currentCard.id,
      isCorrect,
      responseTime,
      difficulty,
      reviewDate: new Date()
    };

    // Mettre à jour la carte
    const updatedCard = updateCardAfterReview(currentCard, reviewResult);
    
    // Sauvegarder en base de données
    try {
      const { error: cardError } = await supabase
        .from('spaced_repetition_cards')
        .update({
          ease_factor: updatedCard.easeFactor,
          interval_days: updatedCard.interval,
          repetitions: updatedCard.repetitions,
          next_review_date: updatedCard.nextReviewDate.toISOString(),
          last_review_date: updatedCard.lastReviewDate?.toISOString(),
          total_reviews: updatedCard.totalReviews,
          correct_reviews: updatedCard.correctReviews,
          average_response_time: updatedCard.averageResponseTime,
          mastery_level: updatedCard.masteryLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentCard.id);

      if (cardError) throw cardError;

      // Sauvegarder le résultat de révision
      const { error: resultError } = await supabase
        .from('review_results')
        .insert({
          session_id: session?.id,
          card_id: currentCard.id,
          user_id: userId,
          is_correct: isCorrect,
          response_time: responseTime,
          difficulty_rating: difficulty,
          quality_score: difficulty === 'again' ? 0 : difficulty === 'hard' ? 2 : difficulty === 'good' ? 3 : 5,
          ease_factor_before: currentCard.easeFactor,
          ease_factor_after: updatedCard.easeFactor,
          interval_before: currentCard.interval,
          interval_after: updatedCard.interval,
          repetitions_before: currentCard.repetitions,
          repetitions_after: updatedCard.repetitions,
          mastery_before: currentCard.masteryLevel,
          mastery_after: updatedCard.masteryLevel
        });

      if (resultError) throw resultError;

      // Mettre à jour l'état local
      setCards(prev => prev.map(card => 
        card.id === currentCard.id ? updatedCard : card
      ));

      const newReviewedCount = reviewedCount + 1;
      const newCorrectCount = correctCount + (isCorrect ? 1 : 0);
      setReviewedCount(newReviewedCount);
      setCorrectCount(newCorrectCount);

      // Passer à la carte suivante
      const remainingCards = session?.cards.slice(newReviewedCount) || [];
      if (remainingCards.length > 0) {
        setCurrentCard(remainingCards[0]);
        setShowAnswer(false);
        setCardStartTime(new Date());
      } else {
        // Fin de la session
        endReviewSession();
      }

    } catch (error: any) {
      console.error('Erreur sauvegarde révision:', error);
      toast.error('Erreur', {
        description: 'Impossible de sauvegarder votre réponse'
      });
    }
  };

  // Terminer la session de révision
  const endReviewSession = async () => {
    if (!session || !sessionStartTime) return;

    const endTime = new Date();
    // const duration = (endTime.getTime() - sessionStartTime.getTime()) / 1000 / 60; // en minutes

    try {
      const { error } = await supabase
        .from('review_sessions')
        .update({
          end_time: endTime.toISOString(),
          cards_reviewed: reviewedCount,
          correct_answers: correctCount,
          average_response_time: (sessionStartTime.getTime() - endTime.getTime()) / reviewedCount / 1000
        })
        .eq('id', session.id);

      if (error) throw error;

      toast.success('Session terminée !', {
        description: `${reviewedCount} cartes révisées, ${correctCount} correctes`
      });

    } catch (error: any) {
      console.error('Erreur fin session:', error);
    }

    setIsReviewing(false);
    setSession(null);
    setCurrentCard(null);
    setShowAnswer(false);
    setSessionStartTime(null);
    setCardStartTime(null);
    
    // Recharger les statistiques
    loadCards();
  };

  // Exporter les données
  const handleExport = (format: 'json' | 'csv' | 'anki') => {
    const exportData = exportSpacedRepetitionData(cards, format);
    const blob = new Blob([exportData], { 
      type: format === 'json' ? 'application/json' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spaced_repetition_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Export réussi', {
      description: `Fichier ${format} téléchargé`
    });
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Révision Espacée</h3>
              <p className="text-sm text-gray-600">
                {documentId ? 'Cartes du document' : 'Toutes vos cartes'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowStatistics(!showStatistics)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Statistiques"
            >
              <BarChart3 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Paramètres"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Statistiques rapides */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">À réviser</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{statistics.cardsToReview}</p>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Maîtrise</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{Math.round(statistics.averageMastery)}%</p>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Série</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{statistics.streak} jours</p>
            </div>
            
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Total</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{statistics.totalCards}</p>
            </div>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        {!isReviewing ? (
          /* Mode attente */
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Prêt à réviser ?
            </h4>
            <p className="text-gray-600 mb-6">
              {statistics?.cardsToReview === 0 
                ? 'Aucune carte à réviser pour aujourd\'hui'
                : `${statistics?.cardsToReview} cartes en attente de révision`
              }
            </p>
            
            <button
              onClick={startReviewSession}
              disabled={statistics?.cardsToReview === 0}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              <Play className="w-5 h-5" />
              Commencer la révision
            </button>
          </div>
        ) : (
          /* Mode révision */
          <div className="space-y-6">
            {/* Progression de la session */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Session en cours
                </span>
                <span className="text-sm text-gray-600">
                  {reviewedCount} / {session?.cards.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(reviewedCount / (session?.cards.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Carte actuelle */}
            {currentCard && (
              <motion.div
                key={currentCard.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-gray-200 rounded-xl p-6"
              >
                {/* En-tête de la carte */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      {currentCard.category}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {currentCard.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Target className="w-4 h-4" />
                    {currentCard.masteryLevel}%
                  </div>
                </div>

                {/* Question */}
                <div className="mb-6">
                  <h5 className="text-lg font-medium text-gray-900 mb-2">Question</h5>
                  <p className="text-gray-700 leading-relaxed">
                    {currentCard.front}
                  </p>
                </div>

                {/* Réponse */}
                <AnimatePresence>
                  {showAnswer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 pt-4"
                    >
                      <h5 className="text-lg font-medium text-gray-900 mb-2">Réponse</h5>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {currentCard.back}
                      </p>
                      
                      {/* Boutons de difficulté */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button
                          onClick={() => submitAnswer('again')}
                          className="p-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors flex flex-col items-center gap-1"
                        >
                          <XCircle className="w-5 h-5" />
                          <span className="text-xs">Encore</span>
                        </button>
                        <button
                          onClick={() => submitAnswer('hard')}
                          className="p-3 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-medium transition-colors flex flex-col items-center gap-1"
                        >
                          <RotateCcw className="w-5 h-5" />
                          <span className="text-xs">Difficile</span>
                        </button>
                        <button
                          onClick={() => submitAnswer('good')}
                          className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors flex flex-col items-center gap-1"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-xs">Bon</span>
                        </button>
                        <button
                          onClick={() => submitAnswer('easy')}
                          className="p-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors flex flex-col items-center gap-1"
                        >
                          <Award className="w-5 h-5" />
                          <span className="text-xs">Facile</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bouton afficher réponse */}
                {!showAnswer && (
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all"
                  >
                    Afficher la réponse
                  </button>
                )}
              </motion.div>
            )}

            {/* Contrôles de la session */}
            <div className="flex justify-between items-center">
              <button
                onClick={endReviewSession}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Mettre en pause
              </button>
              
              <div className="text-sm text-gray-600">
                {correctCount}/{reviewedCount} correctes
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panneau de statistiques détaillées */}
      <AnimatePresence>
        {showStatistics && statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 border-t border-gray-200"
          >
            <h4 className="font-medium text-gray-900 mb-4">Statistiques détaillées</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Répartition des cartes</h5>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Nouvelles</span>
                    <span className="font-medium">{statistics.cardsNew}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">En apprentissage</span>
                    <span className="font-medium">{statistics.cardsLearning}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Matures</span>
                    <span className="font-medium">{statistics.cardsMature}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Temps d'étude</h5>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Aujourd'hui</span>
                    <span className="font-medium">{Math.round(statistics.todayStudyTime)} min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total</span>
                    <span className="font-medium">{Math.round(statistics.totalStudyTime)} min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Export */}
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => handleExport('json')}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => handleExport('anki')}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Anki
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panneau de paramètres */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 border-t border-gray-200"
          >
            <h4 className="font-medium text-gray-900 mb-4">Paramètres de révision</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de concentration
                </label>
                <select
                  value={focusMode}
                  onChange={(e) => setFocusMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="relaxed">Relaxé</option>
                  <option value="focused">Concentré</option>
                  <option value="intense">Intense</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cartes par session
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxCardsPerSession}
                  onChange={(e) => setMaxCardsPerSession(parseInt(e.target.value) || 20)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
