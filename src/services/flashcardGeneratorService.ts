/**
 * Service de génération automatique de flashcards par IA
 * Analyse les documents et crée des flashcards optimisées pour l'apprentissage
 * 
 * Date: 10 mars 2026
 */

import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

// Types
export interface Flashcard {
  id: string;
  documentId: string;
  front: string; // Question / Terme
  back: string; // Réponse / Définition
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  context?: string; // Contexte supplémentaire
  source: {
    type: 'page' | 'section' | 'chapter';
    reference: string;
    excerpt?: string;
  };
  metadata: {
    generatedAt: string;
    confidence: number; // Score de confiance 0-1
    reviewCount: number;
    lastReview?: string;
    nextReview?: string;
    interval: number; // Jours jusqu'à la prochaine révision
    easeFactor: number; // Facteur de facilité SM-2
  };
}

export interface FlashcardGenerationOptions {
  count?: number; // Nombre de flashcards à générer (défaut: 10)
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  categories?: string[]; // Catégories spécifiques
  includeDiagrams?: boolean; // Inclure des diagrammes
  includeExamples?: boolean; // Inclure des exemples
  focusAreas?: string[]; // Zones de focus spécifiques
  language?: 'fr' | 'en';
  style?: 'qa' | 'term-definition' | 'concept-explanation' | 'mixed';
}

export interface FlashcardGenerationResult {
  flashcards: Flashcard[];
  metadata: {
    documentId: string;
    totalGenerated: number;
    acceptedCount: number;
    rejectedCount: number;
    processingTime: number;
    categories: string[];
    difficultyDistribution: {
      easy: number;
      medium: number;
      hard: number;
    };
  };
}

// Client OpenAI
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Clé OpenAI manquante pour la génération de flashcards');
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
};

/**
 * Génère des flashcards à partir d'un document
 */
export async function generateFlashcardsFromDocument(
  documentId: string,
  documentText: string,
  documentTitle: string,
  options: FlashcardGenerationOptions = {}
): Promise<FlashcardGenerationResult> {
  const startTime = Date.now();
  
  try {
    console.log('🎯 ===== GÉNÉRATION FLASHCARDS =====');
    console.log('  - Document:', documentTitle);
    console.log('  - Document ID:', documentId);
    console.log('  - Options:', options);

    const openai = getOpenAIClient();
    
    // Options par défaut
    const {
      count = 10,
      difficulty = 'mixed',
      categories = [],
      includeDiagrams = true,
      includeExamples = true,
      focusAreas = [],
      language = 'fr',
      style = 'mixed'
    } = options;

    // Limiter le texte pour l'API
    const maxTextLength = 15000;
    const truncatedText = documentText.slice(0, maxTextLength);
    
    console.log(`  - Texte tronqué: ${truncatedText.length} caractères`);

    // Construire le prompt pour la génération
    const systemPrompt = buildFlashcardSystemPrompt(options);
    const userPrompt = buildFlashcardUserPrompt(
      documentTitle,
      truncatedText,
      options
    );

    // Appeler OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Pas de réponse de OpenAI');
    }

    // Parser la réponse JSON
    let flashcardData;
    try {
      flashcardData = JSON.parse(responseContent);
    } catch (error) {
      console.error('❌ Erreur parsing JSON:', error);
      throw new Error('Réponse OpenAI invalide');
    }

    // Valider et structurer les flashcards
    const processedFlashcards = processGeneratedFlashcards(
      flashcardData.flashcards || [],
      documentId,
      documentTitle
    );

    // Calculer les statistiques
    const processingTime = Date.now() - startTime;
    const metadata = {
      documentId,
      totalGenerated: processedFlashcards.length,
      acceptedCount: processedFlashcards.length,
      rejectedCount: (flashcardData.flashcards || []).length - processedFlashcards.length,
      processingTime,
      categories: [...new Set(processedFlashcards.map(f => f.category))],
      difficultyDistribution: {
        easy: processedFlashcards.filter(f => f.difficulty === 'easy').length,
        medium: processedFlashcards.filter(f => f.difficulty === 'medium').length,
        hard: processedFlashcards.filter(f => f.difficulty === 'hard').length
      }
    };

    console.log(`✅ ${processedFlashcards.length} flashcards générées en ${processingTime}ms`);

    return {
      flashcards: processedFlashcards,
      metadata
    };

  } catch (error) {
    console.error('💥 Erreur génération flashcards:', error);
    throw new Error(`Échec de la génération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Construit le prompt système pour la génération de flashcards
 */
function buildFlashcardSystemPrompt(options: FlashcardGenerationOptions): string {
  const { difficulty, style, language, includeDiagrams, includeExamples } = options;
  
  return `Tu es un expert pédagogique spécialisé dans la création de flashcards pour l'apprentissage efficace. 

TON OBJECTIF :
Créer des flashcards de haute qualité qui favorisent la rétention à long terme et la compréhension profonde.

PRINCIPES PÉDAGOGIQUES :
- Utiliser la technique de répétition espacée (SM-2)
- Varier les types de questions (QCM, vrai/faux, association, etc.)
- Inclure des exemples concrets quand possible
- Structurer l'information de manière hiérarchique
- Adapter la complexité au niveau de l'apprenant

STYLE DE FLASHCARDS (${style}) :
${style === 'qa' ? '- Questions/Réponses directes et précises' : ''}
${style === 'term-definition' ? '- Termes et définitions claires' : ''}
${style === 'concept-explanation' ? '- Concepts et explications détaillées' : ''}
${style === 'mixed' ? '- Mélange équilibré de tous les styles' : ''}

DIFFICULTÉ (${difficulty}) :
${difficulty === 'easy' ? '- Questions simples et directes' : ''}
${difficulty === 'medium' ? '- Questions modérément complexes' : ''}
${difficulty === 'hard' ? '- Questions complexes et nuancées' : ''}
${difficulty === 'mixed' ? '- Bon équilibre entre tous les niveaux' : ''}

FORMAT DE SORTIE OBLIGATOIRE :
{
  "flashcards": [
    {
      "front": "Question ou terme clair",
      "back": "Réponse précise et complète",
      "category": "Catégorie thématique",
      "difficulty": "easy|medium|hard",
      "tags": ["tag1", "tag2"],
      "context": "Contexte supplémentaire si utile",
      "source": {
        "type": "page|section|chapter",
        "reference": "Référence dans le document",
        "excerpt": "Extrait pertinent si disponible"
      },
      "confidence": 0.85
    }
  ]
}

LANGUE : ${language === 'fr' ? 'Français' : 'Anglais'}
${includeDiagrams ? '- Inclure des diagrammes et schémas quand approprié' : ''}
${includeExamples ? '- Ajouter des exemples pratiques' : ''}

RÈGLES QUALITÉ :
- Les questions doivent être claires et non ambiguës
- Les réponses doivent être exactes et complètes
- Une flashcard = une idée principale
- Éviter les questions vagues ou trop larges
- Inclure des indices si la question est très difficile`;
}

/**
 * Construit le prompt utilisateur pour la génération
 */
function buildFlashcardUserPrompt(
  documentTitle: string,
  documentText: string,
  options: FlashcardGenerationOptions
): string {
  const { count, categories, focusAreas } = options;
  
  let prompt = `DOCUMENT : "${documentTitle}"

CONTEXTE :
Analyse ce document et génère ${count} flashcards de haute qualité pour l'apprentissage.

TEXTE À ANALYSER :
${documentText}

INSTRUCTIONS SPÉCIFIques :`;

  if (categories && categories.length > 0) {
    prompt += `\n- Catégories prioritaires : ${categories.join(', ')}`;
  }

  if (focusAreas && focusAreas.length > 0) {
    prompt += `\n- Zones de focus : ${focusAreas.join(', ')}`;
  }

  prompt += `

CONSEILS :
- Identifie les concepts clés, définitions, formules et procédures importantes
- Crée des flashcards sur les points qui méritent d'être mémorisés
- Varie les types de questions pour maintenir l'engagement
- Assure-toi que chaque flashcard teste une compétence spécifique

Génère maintenant les flashcards au format JSON requis.`;

  return prompt;
}

/**
 * Traite et valide les flashcards générées
 */
function processGeneratedFlashcards(
  rawFlashcards: any[],
  documentId: string,
  documentTitle: string
): Flashcard[] {
  const processedFlashcards: Flashcard[] = [];

  for (let i = 0; i < rawFlashcards.length; i++) {
    const raw = rawFlashcards[i];
    
    try {
      // Validation de base
      if (!raw.front || !raw.back) {
        console.warn(`⚠️ Flashcard ${i} invalide: front/back manquant`);
        continue;
      }

      if (raw.front.length < 5 || raw.back.length < 5) {
        console.warn(`⚠️ Flashcard ${i} trop courte`);
        continue;
      }

      // Créer la flashcard avec valeurs par défaut
      const flashcard: Flashcard = {
        id: `fc_${documentId}_${Date.now()}_${i}`,
        documentId,
        front: cleanText(raw.front),
        back: cleanText(raw.back),
        category: raw.category || 'Général',
        difficulty: validateDifficulty(raw.difficulty),
        tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
        context: raw.context ? cleanText(raw.context) : undefined,
        source: {
          type: validateSourceType(raw.source?.type),
          reference: raw.source?.reference || 'Non spécifié',
          excerpt: raw.source?.excerpt ? cleanText(raw.source.excerpt) : undefined
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          confidence: Math.max(0.1, Math.min(1, Number(raw.confidence) || 0.7)),
          reviewCount: 0,
          interval: 1, // Première révision dans 1 jour
          easeFactor: 2.5 // Facteur de facilité initial SM-2
        }
      };

      processedFlashcards.push(flashcard);
    } catch (error) {
      console.error(`❌ Erreur traitement flashcard ${i}:`, error);
    }
  }

  return processedFlashcards;
}

/**
 * Nettoie le texte
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .trim();
}

/**
 * Valide et normalise la difficulté
 */
function validateDifficulty(difficulty: any): Flashcard['difficulty'] {
  const validDifficulties: Flashcard['difficulty'][] = ['easy', 'medium', 'hard'];
  return validDifficulties.includes(difficulty) ? difficulty : 'medium';
}

/**
 * Valide et normalise le type de source
 */
function validateSourceType(type: any): Flashcard['source']['type'] {
  const validTypes: Flashcard['source']['type'][] = ['page', 'section', 'chapter'];
  return validTypes.includes(type) ? type : 'section';
}

/**
 * Sauvegarde les flashcards générées dans Supabase
 */
export async function saveFlashcardsToDatabase(
  flashcards: Flashcard[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const flashcard of flashcards) {
    try {
      const { error } = await supabase
        .from('study_cards')
        .insert({
          id: flashcard.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          document_id: flashcard.documentId,
          front: flashcard.front,
          back: flashcard.back,
          category: flashcard.category,
          difficulty: flashcard.difficulty,
          tags: flashcard.tags,
          context: flashcard.context,
          source_type: flashcard.source.type,
          source_reference: flashcard.source.reference,
          source_excerpt: flashcard.source.excerpt,
          confidence: flashcard.metadata.confidence,
          review_count: flashcard.metadata.reviewCount,
          interval: flashcard.metadata.interval,
          ease_factor: flashcard.metadata.easeFactor,
          created_at: flashcard.metadata.generatedAt
        });

      if (error) {
        throw error;
      }

      success++;
    } catch (error) {
      failed++;
      errors.push(`Flashcard ${flashcard.id}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  console.log(`💾 Sauvegarde flashcards: ${success} succès, ${failed} échecs`);
  
  return { success, failed, errors };
}

/**
 * Met à jour une flashcard après révision (algorithme SM-2)
 */
export function updateFlashcardAfterReview(
  flashcard: Flashcard,
  quality: number // 0-5: 0=total blackout, 5=perfect response
): Flashcard {
  const { metadata } = flashcard;
  let { easeFactor, interval, reviewCount } = metadata;

  // Algorithme SM-2 simplifié
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  if (quality < 3) {
    interval = 1; // Recommencer après échec
  } else if (reviewCount === 0) {
    interval = 1;
  } else if (reviewCount === 1) {
    interval = 6;
  } else {
    interval = Math.round(interval * easeFactor);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...flashcard,
    metadata: {
      ...metadata,
      reviewCount: reviewCount + 1,
      lastReview: new Date().toISOString(),
      nextReview: nextReview.toISOString(),
      interval,
      easeFactor
    }
  };
}

/**
 * Formate les flashcards pour l'affichage
 */
export function formatFlashcardsForDisplay(
  flashcards: Flashcard[],
  options: {
    includeMetadata?: boolean;
    groupByCategory?: boolean;
    sortBy?: 'difficulty' | 'category' | 'created' | 'nextReview';
  } = {}
): string {
  const {
    includeMetadata = false,
    groupByCategory = false,
    sortBy = 'created'
  } = options;

  let formattedText = `🎯 **Flashcards générées** (${flashcards.length} cartes)\n\n`;

  // Trier
  const sortedFlashcards = [...flashcards].sort((a, b) => {
    switch (sortBy) {
      case 'difficulty':
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      case 'category':
        return a.category.localeCompare(b.category);
      case 'nextReview':
        return (a.metadata.nextReview || '').localeCompare(b.metadata.nextReview || '');
      default:
        return a.metadata.generatedAt.localeCompare(b.metadata.generatedAt);
    }
  });

  // Grouper par catégorie si demandé
  if (groupByCategory) {
    const categories = [...new Set(sortedFlashcards.map(f => f.category))];
    
    categories.forEach(category => {
      const categoryFlashcards = sortedFlashcards.filter(f => f.category === category);
      formattedText += `## 📚 ${category} (${categoryFlashcards.length})\n\n`;
      
      categoryFlashcards.forEach((flashcard, index) => {
        formattedText += formatSingleFlashcard(flashcard, index + 1, includeMetadata);
      });
      
      formattedText += '\n---\n\n';
    });
  } else {
    sortedFlashcards.forEach((flashcard, index) => {
      formattedText += formatSingleFlashcard(flashcard, index + 1, includeMetadata);
    });
  }

  return formattedText;
}

/**
 * Formate une flashcard individuelle
 */
function formatSingleFlashcard(
  flashcard: Flashcard,
  index: number,
  includeMetadata: boolean
): string {
  let cardText = `### ${index}. ${flashcard.front}\n\n`;
  cardText += `**Réponse :** ${flashcard.back}\n\n`;
  
  if (flashcard.context) {
    cardText += `*Contexte :* ${flashcard.context}\n\n`;
  }

  if (flashcard.tags.length > 0) {
    cardText += `*Tags :* ${flashcard.tags.join(', ')}\n\n`;
  }

  if (includeMetadata) {
    cardText += `*Métadonnées :*\n`;
    cardText += `- Difficulté : ${flashcard.difficulty}\n`;
    cardText += `- Confiance : ${(flashcard.metadata.confidence * 100).toFixed(1)}%\n`;
    cardText += `- Révisions : ${flashcard.metadata.reviewCount}\n`;
    cardText += `- Prochaine révision : ${flashcard.metadata.nextReview ? new Date(flashcard.metadata.nextReview).toLocaleDateString() : 'Non définie'}\n\n`;
  }

  return cardText;
}
