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
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Clé API OpenAI non configurée dans le fichier .env');
    }

    console.log(`🤖 Génération de ${flashcardCount} flashcards avec OpenAI...`);
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

RÈGLES STRICTES :
1. Base-toi UNIQUEMENT sur le contenu fourni - N'invente RIEN
2. Génère EXACTEMENT ${flashcardCount} flashcards de haute qualité
3. Toutes les flashcards doivent provenir directement du document

Types de cartes à créer :
- definition : Définitions clés avec explications détaillées (3-5 phrases)
- date : Dates importantes avec contexte complet et signification
- concept : Concepts principaux avec exemples concrets du document
- formula : Formules avec explications d'utilisation

Pour chaque flashcard :
- FRONT : Question claire et précise
- BACK : Réponse complète et détaillée (3-5 phrases minimum)
- TYPE : definition/date/concept/formula
- CATEGORY : Thème du document

Format JSON strict :
{"cards":[{"front":"Qu'est-ce que X ?","back":"Explication complète et détaillée provenant du document...","type":"definition","category":"Catégorie"}]}

IMPORTANT : 
- Réponses COMPLÈTES et DÉTAILLÉES basées sur le document
- Couvrir TOUS les points importants du document
- ${flashcardCount} flashcards exactement
- Tout en français`
          },
          {
            role: 'user',
            content: `Génère ${flashcardCount} flashcards détaillées basées UNIQUEMENT sur ce contenu :\n\n${truncatedText}\n\nRAPPEL : ${flashcardCount} flashcards exactement, basées sur le document uniquement.`
          }
        ],
        temperature: 0.5, // Réduit pour plus de précision
        max_tokens: 4000, // Augmenté pour ${flashcardCount} flashcards complètes
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
