import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Shuffle, 
  BookOpen,
  Calendar,
  Lightbulb,
  Calculator,
  CheckCircle
} from 'lucide-react';
import { GeneratedFlashcards, Flashcard, shuffleCards } from '../../services/flashcardGenerator';

interface FlashcardPlayerProps {
  flashcards: GeneratedFlashcards;
}

export function FlashcardPlayer({ flashcards }: FlashcardPlayerProps) {
  const [cards, setCards] = useState<Flashcard[]>(flashcards.cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;
  const reviewedProgress = (reviewedCards.size / cards.length) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      // Marquer comme vue quand on retourne
      setReviewedCards(prev => new Set([...prev, currentCard.id]));
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = shuffleCards(cards);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewedCards(new Set());
  };

  const getTypeIcon = (type: Flashcard['type']) => {
    switch (type) {
      case 'definition':
        return <BookOpen size={16} className="text-blue-600" />;
      case 'date':
        return <Calendar size={16} className="text-purple-600" />;
      case 'concept':
        return <Lightbulb size={16} className="text-yellow-600" />;
      case 'formula':
        return <Calculator size={16} className="text-green-600" />;
      default:
        return <BookOpen size={16} className="text-gray-600" />;
    }
  };

  const getTypeLabel = (type: Flashcard['type']) => {
    switch (type) {
      case 'definition':
        return 'Définition';
      case 'date':
        return 'Date';
      case 'concept':
        return 'Concept';
      case 'formula':
        return 'Formule';
      default:
        return 'Carte';
    }
  };

  const getTypeBgColor = (type: Flashcard['type']) => {
    switch (type) {
      case 'definition':
        return 'bg-blue-50 border-blue-200';
      case 'date':
        return 'bg-purple-50 border-purple-200';
      case 'concept':
        return 'bg-yellow-50 border-yellow-200';
      case 'formula':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Statistiques</h3>
            <p className="text-sm text-gray-600 mt-1">
              {cards.length} cartes • {reviewedCards.size} revues
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShuffle}
              className="px-3 py-2 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-colors flex items-center gap-2 text-sm font-medium border border-teal-200"
            >
              <Shuffle size={16} />
              Mélanger
            </button>
            <button
              onClick={handleRestart}
              className="px-3 py-2 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium border border-gray-200"
            >
              <RotateCw size={16} />
              Recommencer
            </button>
          </div>
        </div>

        {/* Types de cartes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 flex items-center gap-2 border border-blue-200">
            <BookOpen size={20} className="text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Définitions</p>
              <p className="text-lg font-bold text-blue-600">{flashcards.stats.definitions}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 flex items-center gap-2 border border-purple-200">
            <Calendar size={20} className="text-purple-600" />
            <div>
              <p className="text-xs text-gray-500">Dates</p>
              <p className="text-lg font-bold text-purple-600">{flashcards.stats.dates}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 flex items-center gap-2 border border-yellow-200">
            <Lightbulb size={20} className="text-yellow-600" />
            <div>
              <p className="text-xs text-gray-500">Concepts</p>
              <p className="text-lg font-bold text-yellow-600">{flashcards.stats.concepts}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 flex items-center gap-2 border border-green-200">
            <Calculator size={20} className="text-green-600" />
            <div>
              <p className="text-xs text-gray-500">Formules</p>
              <p className="text-lg font-bold text-green-600">{flashcards.stats.formulas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Carte {currentIndex + 1} sur {cards.length}
          </span>
          <span className="text-teal-600 font-medium">
            {reviewedCards.size} / {cards.length} revues ({Math.round(reviewedProgress)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Carte recto-verso */}
      <div className="relative">
        <div 
          onClick={handleFlip}
          className={`cursor-pointer transition-all duration-500 transform ${isFlipped ? 'rotate-y-180' : ''}`}
          style={{ transformStyle: 'preserve-3d', minHeight: '400px' }}
        >
          {/* Recto */}
          <div
            className={`absolute inset-0 backface-hidden ${getTypeBgColor(currentCard.type)} border-2 rounded-2xl p-8 flex flex-col items-center justify-center ${isFlipped ? 'opacity-0' : 'opacity-100'}`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex items-center gap-2 mb-6">
              {getTypeIcon(currentCard.type)}
              <span className="text-sm font-medium text-gray-600">
                {getTypeLabel(currentCard.type)}
              </span>
              {currentCard.category && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{currentCard.category}</span>
                </>
              )}
            </div>
            
            <div className="text-center max-w-2xl">
              <p className="text-2xl font-bold text-gray-900 leading-relaxed">
                {currentCard.front}
              </p>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">Cliquez pour voir la réponse</p>
              <RotateCw size={20} className="mx-auto mt-2 text-gray-400 animate-pulse" />
            </div>

            {reviewedCards.has(currentCard.id) && (
              <div className="absolute top-4 right-4">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            )}
          </div>

          {/* Verso */}
          <div
            className={`absolute inset-0 backface-hidden bg-gradient-to-br from-teal-600 to-blue-600 text-white border-2 border-teal-700 rounded-2xl p-8 flex flex-col items-center justify-center ${isFlipped ? 'opacity-100' : 'opacity-0'}`}
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              minHeight: '400px'
            }}
          >
            <div className="flex items-center gap-2 mb-6 opacity-90">
              {getTypeIcon(currentCard.type)}
              <span className="text-sm font-medium">
                {getTypeLabel(currentCard.type)}
              </span>
              {currentCard.category && (
                <>
                  <span>•</span>
                  <span className="text-sm">{currentCard.category}</span>
                </>
              )}
            </div>

            <div className="text-center max-w-2xl">
              <p className="text-xl leading-relaxed whitespace-pre-wrap">
                {currentCard.back}
              </p>
            </div>

            <div className="mt-8 text-center opacity-90">
              <p className="text-sm">Cliquez pour revenir</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
        >
          <ChevronLeft size={20} />
          Précédente
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            {isFlipped ? 'Verso' : 'Recto'}
          </p>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl hover:from-teal-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
        >
          Suivante
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Indicateurs */}
      <div className="flex justify-center gap-2 pt-4">
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => {
              setCurrentIndex(index);
              setIsFlipped(false);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-teal-600 w-8'
                : reviewedCards.has(card.id)
                ? 'bg-green-400'
                : 'bg-gray-300'
            }`}
            title={`Carte ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
