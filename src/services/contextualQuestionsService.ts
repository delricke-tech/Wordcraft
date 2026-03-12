/**
 * Service pour la génération de questions suggérées contextuelles
 * Utilise l'IA pour générer des questions pertinentes basées sur le contenu
 */

import { getOpenAIClient } from './openaiService';

export interface SuggestedQuestion {
  id: string;
  question: string;
  category: 'clarification' | 'exploration' | 'approfondissement' | 'application';
  priority: 'high' | 'medium' | 'low';
  context: string;
  keywords: string[];
  estimatedDifficulty: 'facile' | 'moyenne' | 'difficile';
}

export interface QuestionSuggestionOptions {
  maxQuestions?: number;
  categories?: SuggestedQuestion['category'][];
  difficulty?: SuggestedQuestion['estimatedDifficulty'];
  includeFollowUp?: boolean;
  contextLength?: number;
}

/**
 * Génère des questions suggérées basées sur le contexte
 */
export async function generateContextualQuestions(
  content: string,
  documentTitle: string,
  options: QuestionSuggestionOptions = {}
): Promise<SuggestedQuestion[]> {
  const {
    maxQuestions = 8,
    categories = ['clarification', 'exploration', 'approfondissement', 'application'],
    difficulty,
    includeFollowUp = true,
    contextLength = 2000
  } = options;

  try {
    console.log('🤔 Génération de questions contextuelles...');
    console.log(`  - Document: ${documentTitle}`);
    console.log(`  - Max questions: ${maxQuestions}`);
    console.log(`  - Catégories: ${categories.join(', ')}`);

    const openai = getOpenAIClient();

    const systemPrompt = `Tu es un expert en pédagogie et en analyse de contenu. Ta mission est de générer des questions pertinentes et contextuelles qui aident l'utilisateur à mieux comprendre et explorer le contenu fourni.

CATÉGORIES DE QUESTIONS :
- clarification: Questions qui aident à clarifier des concepts ou définitions
- exploration: Questions qui encouragent l'exploration de sujets connexes
- approfondissement: Questions qui vont plus loin dans l'analyse
- application: Questions qui demandent d'appliquer les concepts à des cas pratiques

FORMAT DE SORTIE OBLIGATOIRE (JSON) :
{
  "questions": [
    {
      "question": "Question précise et claire",
      "category": "clarification|exploration|approfondissement|application",
      "priority": "high|medium|low",
      "context": "Extrait du contexte pertinent",
      "keywords": ["mot1", "mot2", "mot3"],
      "estimatedDifficulty": "facile|moyenne|difficile"
    }
  ]
}

DIRECTIVES :
1. Générer exactement ${maxQuestions} questions maximum
2. Varier les catégories selon: ${categories.join(', ')}
3. Les questions doivent être basées sur le contenu fourni
4. Inclure des mots-clés pertinents pour chaque question
5. Estimer la difficulté de manière réaliste
6. Prioriser les questions les plus utiles

IMPORTANT : Réponds UNIQUEMENT avec le JSON valide, sans aucun texte avant ou après.`;

    const userPrompt = `Génère des questions contextuelles pour le contenu suivant :

TITRE DU DOCUMENT : ${documentTitle}
CONTENU (tronqué à ${contextLength} caractères) :
${content.substring(0, contextLength)}${content.length > contextLength ? '\\n\\n[Contenu tronqué pour traitement...]': ''}

OPTIONS :
- Nombre maximum de questions : ${maxQuestions}
- Catégories souhaitées : ${categories.join(', ')}
${difficulty ? `- Difficulté cible : ${difficulty}` : ''}
${includeFollowUp ? '- Inclure des questions de suivi' : ''}

Génère les questions en suivant le format JSON spécifié.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Pas de réponse de l\'IA pour la génération de questions');
    }

    // Extraire le JSON de la réponse
    let questionsData: { questions: SuggestedQuestion[] };
    try {
      // Nettoyer la réponse pour extraire le JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0]);
      } else {
        questionsData = JSON.parse(content);
      }
    } catch (parseError: any) {
      console.error('Erreur parsing JSON questions:', parseError);
      throw new Error('Format de réponse invalide pour les questions suggérées');
    }

    // Enrichir les questions avec des IDs
    const enrichedQuestions = questionsData.questions.map((q, index) => ({
      ...q,
      id: `question_${Date.now()}_${index}`
    }));

    console.log(`✅ ${enrichedQuestions.length} questions contextuelles générées`);
    return enrichedQuestions.slice(0, maxQuestions);

  } catch (error: any) {
    console.error('❌ Erreur génération questions contextuelles:', error);
    throw new Error(`Échec de la génération des questions: ${error.message}`);
  }
}

/**
 * Génère des questions de suivi basées sur une conversation
 */
export async function generateFollowUpQuestions(
  conversationHistory: Array<{ role: string; content: string }>,
  lastResponse: string,
  options: QuestionSuggestionOptions = {}
): Promise<SuggestedQuestion[]> {
  const { maxQuestions = 5 } = options;

  try {
    console.log('🔄 Génération de questions de suivi...');

    const openai = getOpenAIClient();

    const systemPrompt = `Tu es un expert en conversation et en analyse de dialogue. Génère des questions de suivi pertinentes basées sur l'historique de conversation et la dernière réponse.

FORMAT DE SORTIE OBLIGATOIRE (JSON) :
{
  "questions": [
    {
      "question": "Question de suivi naturelle et pertinente",
      "category": "clarification|exploration|approfondissement|application",
      "priority": "high|medium|low",
      "context": "Contexte de la conversation pertinent",
      "keywords": ["mot1", "mot2"],
      "estimatedDifficulty": "facile|moyenne|difficile"
    }
  ]
}

DIRECTIVES :
1. Les questions doivent être des suites logiques de la conversation
2. Éviter de répéter des questions déjà posées
3. Se concentrer sur les points qui méritent d'être approfondis
4. Générer maximum ${maxQuestions} questions
5. Les questions doivent encourager la continuation naturelle de la conversation`;

    const userPrompt = `Génère des questions de suivi basées sur :

DERNIÈRE RÉPONSE DE L'IA :
${lastResponse}

HISTORIQUE RÉCENT DE LA CONVERSATION :
${conversationHistory.slice(-6).map(msg => `${msg.role}: ${msg.content}`).join('\\n')}

Génère ${maxQuestions} questions de suivi pertinentes.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Pas de réponse pour les questions de suivi');
    }

    let questionsData: { questions: SuggestedQuestion[] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0]);
      } else {
        questionsData = JSON.parse(content);
      }
    } catch (parseError: any) {
      console.error('Erreur parsing JSON follow-up:', parseError);
      throw new Error('Format de réponse invalide pour les questions de suivi');
    }

    const enrichedQuestions = questionsData.questions.map((q, index) => ({
      ...q,
      id: `followup_${Date.now()}_${index}`
    }));

    return enrichedQuestions.slice(0, maxQuestions);

  } catch (error: any) {
    console.error('❌ Erreur génération questions suivi:', error);
    throw new Error(`Échec de la génération: ${error.message}`);
  }
}

/**
 * Filtre les questions par pertinence et catégorie
 */
export function filterQuestions(
  questions: SuggestedQuestion[],
  filters: {
    categories?: SuggestedQuestion['category'][];
    priority?: SuggestedQuestion['priority'][];
    difficulty?: SuggestedQuestion['estimatedDifficulty'][];
    keywords?: string[];
  }
): SuggestedQuestion[] {
  return questions.filter(question => {
    // Filtrer par catégorie
    if (filters.categories && !filters.categories.includes(question.category)) {
      return false;
    }

    // Filtrer par priorité
    if (filters.priority && !filters.priority.includes(question.priority)) {
      return false;
    }

    // Filtrer par difficulté
    if (filters.difficulty && !filters.difficulty.includes(question.estimatedDifficulty)) {
      return false;
    }

    // Filtrer par mots-clés
    if (filters.keywords && filters.keyword.length > 0) {
      const hasKeyword = filters.keywords.some(keyword =>
        question.keywords.some(qKeyword => 
          qKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(qKeyword.toLowerCase())
        )
      );
      if (!hasKeyword) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Trie les questions par pertinence
 */
export function sortQuestionsByRelevance(
  questions: SuggestedQuestion[],
  userKeywords: string[] = []
): SuggestedQuestion[] {
  return questions.sort((a, b) => {
    // Score de priorité
    const priorityScore = { high: 3, medium: 2, low: 1 };
    const aPriorityScore = priorityScore[a.priority] || 1;
    const bPriorityScore = priorityScore[b.priority] || 1;

    // Score de mots-clés correspondants
    const aKeywordScore = a.keywords.reduce((score, keyword) => {
      const matches = userKeywords.filter(userKeyword =>
        keyword.toLowerCase().includes(userKeyword.toLowerCase()) ||
        userKeyword.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      return score + matches;
    }, 0);

    const bKeywordScore = b.keywords.reduce((score, keyword) => {
      const matches = userKeywords.filter(userKeyword =>
        keyword.toLowerCase().includes(userKeyword.toLowerCase()) ||
        userKeyword.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      return score + matches;
    }, 0);

    // Score total
    const aScore = aPriorityScore * 10 + aKeywordScore * 5;
    const bScore = bPriorityScore * 10 + bKeywordScore * 5;

    return bScore - aScore;
  });
}
