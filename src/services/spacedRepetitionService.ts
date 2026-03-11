/**
 * Service de révision espacée avec algorithme SM-2 (SuperMemo 2)
 * Permet d'optimiser la mémorisation à long terme
 * 
 * Date: 6 mars 2025
 */

export interface SpacedRepetitionCard {
  id: string;
  userId: string;
  documentId: string;
  front: string;
  back: string;
  category: string;
  tags: string[];
  difficulty: 'facile' | 'moyen' | 'difficile';
  
  // Propriétés SM-2
  easeFactor: number; // Facteur de facilité (défaut: 2.5)
  interval: number; // Intervalle en jours
  repetitions: number; // Nombre de répétitions
  nextReviewDate: Date; // Prochaine date de révision
  lastReviewDate?: Date; // Dernière date de révision
  
  // Statistiques
  totalReviews: number;
  correctReviews: number;
  averageResponseTime: number; // en secondes
  masteryLevel: number; // 0-100%
  
  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewSession {
  id: string;
  userId: string;
  cards: SpacedRepetitionCard[];
  startTime: Date;
  endTime?: Date;
  cardsReviewed: number;
  correctAnswers: number;
  averageResponseTime: number;
  focusMode: 'focused' | 'relaxed' | 'intense';
}

export interface ReviewResult {
  cardId: string;
  isCorrect: boolean;
  responseTime: number; // en secondes
  difficulty: 'again' | 'hard' | 'good' | 'easy';
  reviewDate: Date;
}

export interface StudyStatistics {
  totalCards: number;
  cardsToReview: number;
  cardsNew: number;
  cardsLearning: number;
  cardsMature: number;
  averageEaseFactor: number;
  averageMastery: number;
  streak: number; // jours consécutifs
  totalStudyTime: number; // en minutes
  todayStudyTime: number; // en minutes
  weeklyProgress: number[]; // 7 derniers jours
  monthlyProgress: number[]; // 30 derniers jours
}

/**
 * Calcule le prochain intervalle et facteur de facilité selon l'algorithme SM-2
 */
export function calculateNextReview(
  card: SpacedRepetitionCard,
  quality: number // 0-5 (0=total blackout, 5=perfect response)
): {
  nextInterval: number;
  nextEaseFactor: number;
  nextRepetitions: number;
  nextMastery: number;
} {
  const { easeFactor, interval, repetitions, totalReviews, correctReviews } = card;
  
  // Calcul du nouveau facteur de facilité
  let nextEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  nextEaseFactor = Math.max(1.3, nextEaseFactor); // Minimum 1.3
  
  // Calcul du prochain intervalle
  let nextInterval: number;
  let nextRepetitions: number;
  
  if (quality < 3) {
    // Si la réponse est mauvaise, on recommence
    nextInterval = 1;
    nextRepetitions = 0;
  } else {
    if (repetitions === 0) {
      nextInterval = 1;
    } else if (repetitions === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(interval * nextEaseFactor);
    }
    nextRepetitions = repetitions + 1;
  }
  
  // Calcul de la maîtrise
  const newTotalReviews = totalReviews + 1;
  const newCorrectReviews = correctReviews + (quality >= 3 ? 1 : 0);
  const nextMastery = Math.round((newCorrectReviews / newTotalReviews) * 100);
  
  return {
    nextInterval,
    nextEaseFactor,
    nextRepetitions,
    nextMastery
  };
}

/**
 * Met à jour une carte après une révision
 */
export function updateCardAfterReview(
  card: SpacedRepetitionCard,
  reviewResult: ReviewResult
): SpacedRepetitionCard {
  const quality = mapDifficultyToQuality(reviewResult.difficulty);
  const calculation = calculateNextReview(card, quality);
  
  const now = new Date();
  const nextReviewDate = new Date(now.getTime() + calculation.nextInterval * 24 * 60 * 60 * 1000);
  
  // Mise à jour du temps de réponse moyen
  const newTotalReviews = card.totalReviews + 1;
  const newAverageResponseTime = (
    (card.averageResponseTime * card.totalReviews + reviewResult.responseTime) / newTotalReviews
  );
  
  return {
    ...card,
    easeFactor: calculation.nextEaseFactor,
    interval: calculation.nextInterval,
    repetitions: calculation.nextRepetitions,
    nextReviewDate,
    lastReviewDate: now,
    totalReviews: newTotalReviews,
    correctReviews: card.correctReviews + (reviewResult.isCorrect ? 1 : 0),
    averageResponseTime: newAverageResponseTime,
    masteryLevel: calculation.nextMastery,
    updatedAt: now
  };
}

/**
 * Convertit la difficulté en qualité SM-2 (0-5)
 */
function mapDifficultyToQuality(difficulty: ReviewResult['difficulty']): number {
  switch (difficulty) {
    case 'again': return 0; // Total blackout
    case 'hard': return 2; // Incorrect response, but the correct one remembered
    case 'good': return 3; // Correct response after hesitation
    case 'easy': return 5; // Perfect response
    default: return 3;
  }
}

/**
 * Crée une nouvelle carte avec les valeurs par défaut SM-2
 */
export function createNewSpacedRepetitionCard(
  cardData: Omit<SpacedRepetitionCard, 
    | 'easeFactor' 
    | 'interval' 
    | 'repetitions' 
    | 'nextReviewDate' 
    | 'totalReviews' 
    | 'correctReviews' 
    | 'averageResponseTime' 
    | 'masteryLevel' 
    | 'createdAt' 
    | 'updatedAt'
  >
): SpacedRepetitionCard {
  const now = new Date();
  
  return {
    ...cardData,
    easeFactor: 2.5, // Valeur par défaut SM-2
    interval: 0, // Nouvelle carte, pas encore d'intervalle
    repetitions: 0,
    nextReviewDate: now, // À réviser immédiatement
    totalReviews: 0,
    correctReviews: 0,
    averageResponseTime: 0,
    masteryLevel: 0,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Filtre les cartes à réviser pour une date donnée
 */
export function getCardsToReview(
  cards: SpacedRepetitionCard[],
  reviewDate: Date = new Date()
): SpacedRepetitionCard[] {
  return cards
    .filter(card => card.nextReviewDate <= reviewDate)
    .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
}

/**
 * Calcule les statistiques d'étude
 */
export function calculateStudyStatistics(
  cards: SpacedRepetitionCard[]
): StudyStatistics {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const cardsToReview = getCardsToReview(cards, now);
  const newCards = cards.filter(card => card.totalReviews === 0);
  const learningCards = cards.filter(card => card.repetitions > 0 && card.repetitions <= 3);
  const matureCards = cards.filter(card => card.repetitions > 3);
  
  // Calcul de la série de jours consécutifs
  const streak = calculateStreak(cards);
  
  // Calcul du temps d'étude (simulé pour l'instant)
  const totalStudyTime = cards.reduce((sum, card) => sum + card.totalReviews * card.averageResponseTime, 0) / 60;
  const todayStudyTime = cards
    .filter(card => card.lastReviewDate && card.lastReviewDate >= todayStart)
    .reduce((sum, card) => sum + card.averageResponseTime, 0) / 60;
  
  // Progression hebdomadaire et mensuelle
  const weeklyProgress = calculateProgressOverPeriod(cards, 7);
  const monthlyProgress = calculateProgressOverPeriod(cards, 30);
  
  const averageEaseFactor = cards.length > 0 
    ? cards.reduce((sum, card) => sum + card.easeFactor, 0) / cards.length 
    : 2.5;
  
  const averageMastery = cards.length > 0 
    ? cards.reduce((sum, card) => sum + card.masteryLevel, 0) / cards.length 
    : 0;
  
  return {
    totalCards: cards.length,
    cardsToReview: cardsToReview.length,
    cardsNew: newCards.length,
    cardsLearning: learningCards.length,
    cardsMature: matureCards.length,
    averageEaseFactor,
    averageMastery,
    streak,
    totalStudyTime,
    todayStudyTime,
    weeklyProgress,
    monthlyProgress
  };
}

/**
 * Calcule la série de jours consécutifs avec révisions
 */
function calculateStreak(cards: SpacedRepetitionCard[]): number {
  const today = new Date();
  let streak = 0;
  
  for (let i = 0; i < 365; i++) { // Max 365 jours
    const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const hasReviewsOnDay = cards.some(card => 
      card.lastReviewDate && 
      card.lastReviewDate >= dayStart && 
      card.lastReviewDate < dayEnd
    );
    
    if (hasReviewsOnDay) {
      streak++;
    } else if (i > 0) { // Autoriser le jour actuel sans révision
      break;
    }
  }
  
  return streak;
}

/**
 * Calcule la progression sur une période en jours
 */
function calculateProgressOverPeriod(cards: SpacedRepetitionCard[], days: number): number[] {
  const progress = new Array(days).fill(0);
  const now = new Date();
  
  cards.forEach(card => {
    if (card.lastReviewDate) {
      const daysAgo = Math.floor((now.getTime() - card.lastReviewDate.getTime()) / (24 * 60 * 60 * 1000));
      if (daysAgo < days) {
        progress[days - 1 - daysAgo]++;
      }
    }
  });
  
  return progress;
}

/**
 * Génère un plan de révision optimal
 */
export function generateReviewPlan(
  cards: SpacedRepetitionCard[],
  maxCardsPerDay: number = 20,
  daysAhead: number = 7
): { date: Date; cards: SpacedRepetitionCard[] }[] {
  const plan: { date: Date; cards: SpacedRepetitionCard[] }[] = [];
  const cardsToReview = getCardsToReview(cards);
  
  for (let day = 0; day < daysAhead; day++) {
    const targetDate = new Date(Date.now() + day * 24 * 60 * 60 * 1000);
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    // Cartes à réviser pour ce jour
    const dayCards = cardsToReview.filter(card => 
      card.nextReviewDate >= dayStart && card.nextReviewDate < dayEnd
    );
    
    // Limiter le nombre de cartes par jour
    const limitedCards = dayCards.slice(0, maxCardsPerDay);
    
    plan.push({
      date: targetDate,
      cards: limitedCards
    });
  }
  
  return plan;
}

/**
 * Suggère des cartes à réviser en priorité
 */
export function getPriorityCards(
  cards: SpacedRepetitionCard[],
  limit: number = 10
): SpacedRepetitionCard[] {
  return cards
    .filter(card => card.nextReviewDate <= new Date())
    .sort((a, b) => {
      // Priorité 1: Cartes en retard
      const aOverdue = a.nextReviewDate.getTime() - Date.now();
      const bOverdue = b.nextReviewDate.getTime() - Date.now();
      
      if (aOverdue < 0 && bOverdue >= 0) return -1;
      if (bOverdue < 0 && aOverdue >= 0) return 1;
      
      // Priorité 2: Faible maîtrise
      if (a.masteryLevel !== b.masteryLevel) {
        return a.masteryLevel - b.masteryLevel;
      }
      
      // Priorité 3: Ancienneté de la date de révision
      return a.nextReviewDate.getTime() - b.nextReviewDate.getTime();
    })
    .slice(0, limit);
}

/**
 * Exporte les données de révision espacée
 */
export function exportSpacedRepetitionData(
  cards: SpacedRepetitionCard[],
  format: 'json' | 'csv' | 'anki'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(cards, null, 2);
    
    case 'csv':
      const headers = [
        'ID', 'Document', 'Front', 'Back', 'Category', 'Tags',
        'Ease Factor', 'Interval', 'Repetitions', 'Mastery %',
        'Total Reviews', 'Correct Reviews', 'Avg Response Time',
        'Next Review', 'Created At'
      ];
      
      const rows = cards.map(card => [
        card.id,
        card.documentId,
        `"${card.front.replace(/"/g, '""')}"`,
        `"${card.back.replace(/"/g, '""')}"`,
        card.category,
        `"${card.tags.join('; ')}"`,
        card.easeFactor.toFixed(2),
        card.interval,
        card.repetitions,
        card.masteryLevel,
        card.totalReviews,
        card.correctReviews,
        card.averageResponseTime.toFixed(2),
        card.nextReviewDate.toISOString(),
        card.createdAt.toISOString()
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    case 'anki':
      // Format Anki (simplifié)
      return cards.map(card => 
        `${card.front}\t${card.back}\t${card.tags.join(' ')}`
      ).join('\n');
    
    default:
      return JSON.stringify(cards, null, 2);
  }
}
