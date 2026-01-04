/**
 * Service de génération de flashcards (cartes recto-verso) via Edge Function Supabase
 * Extrait les définitions clés et dates importantes d'un document
 */

import { supabase } from '../lib/supabase';

export type Flashcard = {
  id: string;
  front: string;  // Question ou concept (recto)
  back: string;   // Réponse ou définition (verso)
  type: 'definition' | 'date' | 'concept' | 'formula';
  category?: string;
};

export type GeneratedFlashcards = {
  cards: Flashcard[];
  title: string;
  documentId: string;
  createdAt: string;
  stats: {
    definitions: number;
    dates: number;
    concepts: number;
    formulas: number;
  };
};

/**
 * Génère des flashcards à partir du texte d'un document
 * @param text - Texte source
 * @param documentTitle - Titre du document
 * @param documentId - ID du document
 * @param flashcardCount - Nombre de flashcards à générer (par défaut 15)
 */
export async function generateFlashcardsFromText(
  text: string,
  documentTitle: string,
  documentId: string,
  flashcardCount: number = 15
): Promise<GeneratedFlashcards> {
  try {
    console.log(`🤖 Génération de ${flashcardCount} flashcards...`);
    console.log(`📄 Document: ${documentTitle}`);
    console.log(`📝 Longueur texte: ${text.length} caractères`);

    // Limiter la taille du texte envoyé
    const maxLength = 15000;
    const truncatedText = text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text;

    console.log(`📝 Texte analysé: ${truncatedText.length} caractères`);

    // Récupérer la session actuelle
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Vous devez être connecté pour générer des flashcards');
    }

    // ✅ Appeler l'Edge Function Supabase pour éviter CORS
    const { data, error } = await supabase.functions.invoke('generate-flashcards', {
      body: {
        text: truncatedText,
        documentName: documentTitle,
        cardCount: flashcardCount
      },
    });

    if (error) {
      console.error('❌ Erreur Edge Function:', error);
      throw new Error(`Erreur lors de la génération des flashcards: ${error.message}`);
    }

    if (!data) {
      throw new Error('Aucune réponse de l\'Edge Function');
    }

    console.log('✅ Flashcards générées par l\'Edge Function:', data);

    const parsedCards = data;

    if (!parsedCards.cards || !Array.isArray(parsedCards.cards)) {
      throw new Error('Format de réponse invalide');
    }

    // Ajouter des IDs uniques à chaque carte
    const cardsWithIds: Flashcard[] = parsedCards.cards.map((card: any, index: number) => ({
      id: `card${Date.now()}-${index}`,
      front: card.front,
      back: card.back,
      type: card.type || 'concept',
      category: card.category,
    }));

    // Calculer les statistiques
    const stats = {
      definitions: cardsWithIds.filter(c => c.type === 'definition').length,
      dates: cardsWithIds.filter(c => c.type === 'date').length,
      concepts: cardsWithIds.filter(c => c.type === 'concept').length,
      formulas: cardsWithIds.filter(c => c.type === 'formula').length,
    };

    const flashcards: GeneratedFlashcards = {
      cards: cardsWithIds,
      title: `Fiches : ${documentTitle}`,
      documentId,
      createdAt: new Date().toISOString(),
      stats,
    };

    console.log('✅ Flashcards formatées avec succès:', {
      total: cardsWithIds.length,
      stats,
    });

    return flashcards;
  } catch (error) {
    console.error('❌ Erreur lors de la génération des flashcards:', error);
    throw error;
  }
}

/**
 * Calcule la progression d'apprentissage
 */
export function calculateProgress(
  reviewed: Set<string>,
  total: number
): {
  percentage: number;
  reviewed: number;
  remaining: number;
} {
  const reviewedCount = reviewed.size;
  return {
    percentage: Math.round((reviewedCount / total) * 100),
    reviewed: reviewedCount,
    remaining: total - reviewedCount,
  };
}

/**
 * Mélange les cartes (algorithme Fisher-Yates)
 */
export function shuffleCards(cards: Flashcard[]): Flashcard[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Filtre les cartes par type
 */
export function filterCardsByType(
  cards: Flashcard[],
  type: Flashcard['type']
): Flashcard[] {
  return cards.filter(card => card.type === type);
}
