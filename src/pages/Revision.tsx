import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Target,
  Flame,
  Play,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle,
  XCircle,
  RotateCcw,
  Settings,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, StudyCard } from '../lib/supabase';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

type ReviewState = 'idle' | 'reviewing' | 'complete';

export function Revision() {
  useAuth();
  const [dueCards, setDueCards] = useState<StudyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewState, setReviewState] = useState<ReviewState>('idle');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [stats, setStats] = useState({
    reviewed: 0,
    correct: 0,
    streak: 7,
  });

  useEffect(() => {
    fetchDueCards();
  }, []);

  const fetchDueCards = async () => {
    try {
      const { data, error } = await supabase
        .from('study_cards')
        .select('*')
        .lte('next_review_at', new Date().toISOString())
        .order('next_review_at');

      if (error) throw error;
      setDueCards(data || []);
    } catch (error) {
      console.error('Error fetching due cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const startReview = () => {
    setReviewState('reviewing');
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const handleAnswer = async (quality: number) => {
    const card = dueCards[currentCardIndex];

    const newEaseFactor = Math.max(1.3, card.mastery_level / 100 * 2.5 + (quality - 3) * 0.1);
    const newInterval = quality >= 3 ? Math.max(1, Math.round(1 * newEaseFactor)) : 1;
    const newMastery = Math.min(100, Math.max(0, card.mastery_level + (quality - 3) * 10));

    await supabase
      .from('study_cards')
      .update({
        mastery_level: newMastery,
        last_reviewed_at: new Date().toISOString(),
        next_review_at: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000).toISOString(),
        review_count: card.review_count + 1,
      })
      .eq('id', card.id);

    setStats((prev) => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      correct: quality >= 3 ? prev.correct + 1 : prev.correct,
    }));

    if (currentCardIndex < dueCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      setReviewState('complete');
    }
  };

  const getWeekDates = () => {
    const start = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const weekDates = getWeekDates();

  const currentCard = dueCards[currentCardIndex];

  if (reviewState === 'reviewing' && currentCard) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setReviewState('idle')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={20} />
            Retour
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Fiche {currentCardIndex + 1} sur {dueCards.length}
            </span>
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all"
                style={{ width: `${((currentCardIndex + 1) / dueCards.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl">
            <div
              className={`bg-white rounded-2xl shadow-xl p-8 min-h-[400px] flex flex-col cursor-pointer transition-all ${
                showAnswer ? 'bg-gradient-to-br from-white to-teal-50' : ''
              }`}
              onClick={() => !showAnswer && setShowAnswer(true)}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  {currentCard.tags?.[0] || 'General'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentCard.mastery_level >= 80 ? 'bg-green-100 text-green-700' :
                  currentCard.mastery_level >= 50 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  Maitrise : {currentCard.mastery_level}%
                </span>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentCard.title}</h2>

                {!showAnswer ? (
                  <p className="text-gray-500">Cliquez pour reveler la reponse</p>
                ) : (
                  <div className="space-y-4 w-full">
                    {currentCard.content.key_points?.length > 0 && (
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-700 mb-2">Points cles :</h3>
                        <ul className="space-y-1">
                          {currentCard.content.key_points.map((point, i) => (
                            <li key={i} className="text-gray-600 flex items-start gap-2">
                              <span className="text-teal-500 mt-1">-</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {currentCard.content.definitions?.length > 0 && (
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-700 mb-2">Definitions :</h3>
                        {currentCard.content.definitions.map((def, i) => (
                          <p key={i} className="text-gray-600">
                            <strong>{def.term} :</strong> {def.definition}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {showAnswer && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 text-center mb-4">Comment avez-vous repondu ?</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleAnswer(1)}
                      className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="w-8 h-8 text-red-500" />
                      <span className="text-xs text-gray-600">A revoir</span>
                    </button>
                    <button
                      onClick={() => handleAnswer(2)}
                      className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg hover:bg-amber-50 transition-colors"
                    >
                      <RotateCcw className="w-8 h-8 text-amber-500" />
                      <span className="text-xs text-gray-600">Difficile</span>
                    </button>
                    <button
                      onClick={() => handleAnswer(3)}
                      className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Target className="w-8 h-8 text-blue-500" />
                      <span className="text-xs text-gray-600">Correct</span>
                    </button>
                    <button
                      onClick={() => handleAnswer(4)}
                      className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <span className="text-xs text-gray-600">Facile</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (reviewState === 'complete') {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Revision terminee !</h2>
          <p className="text-gray-500 mb-6">
            Vous avez revise {stats.reviewed} fiches avec {Math.round((stats.correct / stats.reviewed) * 100)}% de precision.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                setReviewState('idle');
                fetchDueCards();
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Retour au tableau de bord
            </button>
            <Link
              to="/cards"
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Voir toutes les fiches
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revision</h1>
          <p className="text-gray-500 mt-1">Repetition espacee pour une retention optimale</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Settings size={18} />
          Parametres
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">A reviser aujourd'hui</span>
            <Clock size={18} className="text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{dueCards.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Revisees aujourd'hui</span>
            <CheckCircle size={18} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.reviewed}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Precision</span>
            <Target size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0}%
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Serie</span>
            <Flame size={18} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.streak} jours</p>
        </div>
      </div>

      {dueCards.length > 0 && (
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Pret a reviser</h2>
              <p className="text-teal-100">
                Vous avez {dueCards.length} fiches a reviser
              </p>
            </div>
            <button
              onClick={startReview}
              className="flex items-center gap-2 px-6 py-3 bg-white text-teal-700 rounded-lg font-medium hover:bg-teal-50"
            >
              <Play size={20} />
              Commencer la revision
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Apercu de la semaine</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-gray-600 w-32 text-center">
              {format(weekDates[0], 'd MMM', { locale: fr })} - {format(weekDates[6], 'd MMM', { locale: fr })}
            </span>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {weekDates.map((date) => {
            const isCurrentDay = isToday(date);
            const dayDueCount = Math.floor(Math.random() * 10);

            return (
              <div
                key={date.toISOString()}
                className={`text-center p-4 rounded-xl ${
                  isCurrentDay ? 'bg-teal-50 border-2 border-teal-500' : 'bg-gray-50'
                }`}
              >
                <p className="text-xs text-gray-500 uppercase">{format(date, 'EEE', { locale: fr })}</p>
                <p className={`text-lg font-bold ${isCurrentDay ? 'text-teal-600' : 'text-gray-900'}`}>
                  {format(date, 'd')}
                </p>
                <p className="text-sm text-gray-500 mt-2">{dayDueCount} fiches</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Fiches a reviser</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
          </div>
        ) : dueCards.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-500">Tout est a jour ! Aucune fiche a reviser.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {dueCards.slice(0, 10).map((card) => (
              <div key={card.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <BookOpen size={20} className="text-teal-600" />
                  <div>
                    <p className="font-medium text-gray-900">{card.title}</p>
                    <p className="text-sm text-gray-500">
                      Maitrise : {card.mastery_level}% | Revisions : {card.review_count}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  card.mastery_level < 30 ? 'bg-red-100 text-red-700' :
                  card.mastery_level < 70 ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {card.mastery_level < 30 ? 'A reviser' :
                   card.mastery_level < 70 ? 'En cours' : 'Presque maitrise'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
