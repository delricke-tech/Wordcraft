/**
 * Service de génération de flashcards (cartes recto-verso)
 * Extrait les définitions clés et dates importantes d'un document
 */

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
 */
export async function generateFlashcardsFromText(
  text: string,
  documentTitle: string,
  documentId: string
): Promise<GeneratedFlashcards> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Clé API OpenAI non configurée dans le fichier .env');
    }

    console.log('🤖 Génération de flashcards avec OpenAI...');
    console.log(`📄 Document: ${documentTitle}`);
    console.log(`📝 Longueur texte: ${text.length} caractères`);

    // ✅ QUALITÉ MAXIMALE : Texte plus long pour un contenu complet et de qualité
    const maxLength = 15000; // Augmenté pour garantir la qualité du contenu
    const truncatedText = text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text;

    console.log(`📝 Texte analysé: ${truncatedText.length} caractères`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en création de fiches de révision complètes et détaillées.
Extrais les informations essentielles du document et crée 20-30 flashcards de qualité.

Types de cartes :
- definition : Définitions clés avec explications détaillées
- date : Dates importantes avec contexte complet
- concept : Concepts principaux avec exemples
- formula : Formules avec explications d'application

Format JSON strict :
{"cards":[{"front":"Question détaillée ?","back":"Réponse complète et détaillée","type":"definition","category":"Catégorie"}]}

IMPORTANT : Réponses complètes et détaillées (3-5 phrases). Couvrir tous les points importants du document. Français.`
          },
          {
            role: 'user',
            content: `Génère 20-30 flashcards détaillées basées sur ce contenu :\n\n${truncatedText}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500, // Augmenté pour des réponses plus complètes et détaillées
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erreur lors de l\'appel à l\'API OpenAI');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Aucune réponse générée par OpenAI');
    }

    console.log('✅ Flashcards générées par OpenAI:', content);

    // Parser la réponse JSON
    const parsedCards = JSON.parse(content);

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
