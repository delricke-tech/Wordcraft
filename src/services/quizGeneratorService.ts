/**
 * Service de génération automatique de Quiz par IA
 * Crée des QCM intelligents et variés à partir de documents
 * 
 * Date: 10 mars 2026
 */

import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

// Types
export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-blank' | 'matching' | 'short-answer';

export interface QuizQuestion {
  id: string;
  documentId: string;
  type: QuestionType;
  question: string;
  options?: string[]; // Pour QCM
  correctAnswer: string | number; // Index pour QCM, texte pour autres
  explanation: string; // Pourquoi c'est la bonne réponse
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  points: number;
  timeLimit?: number; // Secondes
  hints?: string[];
  source: {
    type: 'page' | 'section' | 'chapter';
    reference: string;
    excerpt?: string;
  };
  metadata: {
    generatedAt: string;
    confidence: number;
    BloomLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
    estimatedTime: number; // Secondes
  };
}

export interface Quiz {
  id: string;
  documentId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  metadata: {
    totalQuestions: number;
    totalPoints: number;
    estimatedDuration: number; // Minutes
    difficultyDistribution: {
      easy: number;
      medium: number;
      hard: number;
    };
    typeDistribution: Record<QuestionType, number>;
    categories: string[];
    generatedAt: string;
  };
  settings: {
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
    showResultsImmediately: boolean;
    allowReview: boolean;
    passingScore: number; // Pourcentage
  };
}

export interface QuizGenerationOptions {
  questionCount?: number; // Nombre de questions (défaut: 10)
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  questionTypes?: QuestionType[]; // Types de questions
  categories?: string[]; // Catégories spécifiques
  focusAreas?: string[]; // Zones de focus
  includeExplanations?: boolean;
  includeHints?: boolean;
  timePerQuestion?: number; // Secondes
  bloomLevels?: QuizQuestion['metadata']['BloomLevel'][];
  language?: 'fr' | 'en';
  style?: 'academic' | 'professional' | 'casual';
}

export interface QuizGenerationResult {
  quiz: Quiz;
  statistics: {
    processingTime: number;
    confidence: number;
    coverage: number; // % du document couvert
    diversity: number; // Diversité des types de questions
  };
}

// Client OpenAI
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Clé OpenAI manquante pour la génération de quiz');
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
};

/**
 * Génère un quiz complet à partir d'un document
 */
export async function generateQuizFromDocument(
  documentId: string,
  documentText: string,
  documentTitle: string,
  options: QuizGenerationOptions = {}
): Promise<QuizGenerationResult> {
  const startTime = Date.now();
  
  try {
    console.log('🎯 ===== GÉNÉRATION QUIZ =====');
    console.log('  - Document:', documentTitle);
    console.log('  - Document ID:', documentId);
    console.log('  - Options:', options);

    const openai = getOpenAIClient();
    
    // Options par défaut
    const {
      questionCount = 10,
      difficulty = 'mixed',
      questionTypes = ['multiple-choice', 'true-false', 'fill-blank'],
      categories = [],
      focusAreas = [],
      includeExplanations = true,
      includeHints = false,
      timePerQuestion = 60,
      bloomLevels = ['remember', 'understand', 'apply'],
      language = 'fr',
      style = 'academic'
    } = options;

    // Limiter le texte pour l'API
    const maxTextLength = 20000;
    const truncatedText = documentText.slice(0, maxTextLength);
    
    console.log(`  - Texte tronqué: ${truncatedText.length} caractères`);

    // Construire les prompts
    const systemPrompt = buildQuizSystemPrompt(options);
    const userPrompt = buildQuizUserPrompt(
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
      max_tokens: 6000,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Pas de réponse de OpenAI');
    }

    // Parser la réponse JSON
    let quizData;
    try {
      quizData = JSON.parse(responseContent);
    } catch (error) {
      console.error('❌ Erreur parsing JSON:', error);
      throw new Error('Réponse OpenAI invalide');
    }

    // Traiter les questions
    const processedQuestions = processQuizQuestions(
      quizData.questions || [],
      documentId,
      documentTitle
    );

    // Créer le quiz
    const quiz = createQuizObject(
      documentId,
      documentTitle,
      processedQuestions,
      options
    );

    // Calculer les statistiques
    const processingTime = Date.now() - startTime;
    const statistics = calculateQuizStatistics(
      quiz,
      processingTime,
      documentText.length
    );

    console.log(`✅ Quiz généré: ${quiz.questions.length} questions en ${processingTime}ms`);

    return {
      quiz,
      statistics
    };

  } catch (error) {
    console.error('💥 Erreur génération quiz:', error);
    throw new Error(`Échec de la génération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Construit le prompt système pour la génération de quiz
 */
function buildQuizSystemPrompt(options: QuizGenerationOptions): string {
  const { difficulty, questionTypes, bloomLevels, language, style, includeExplanations, includeHints } = options;
  
  return `Tu es un expert en évaluation pédagogique spécialisé dans la création de quiz et de QCM de haute qualité.

TON OBJECTIF :
Créer un quiz équilibré qui évalue efficacement la compréhension du document à différents niveaux cognitifs.

PRINCIPES PÉDAGOGIQUES :
- Utiliser la taxonomie de Bloom pour varier les niveaux cognitifs
- Créer des questions claires et non ambiguës
- Inclure des distracteurs plausibles pour les QCM
- Adapter la complexité au niveau visé
- Fournir des explications pédagogiques

TYPES DE QUESTIONS (${questionTypes?.join(', ') || 'variés'}) :
${questionTypes?.includes('multiple-choice') ? '- QCM : 4 options avec une seule bonne réponse' : ''}
${questionTypes?.includes('true-false') ? '- Vrai/Faux : affirmations à évaluer' : ''}
${questionTypes?.includes('fill-blank') ? '- Texte à trous : mot ou phrase manquante' : ''}
${questionTypes?.includes('matching') ? '- Association : relier des éléments' : ''}
${questionTypes?.includes('short-answer') ? '- Réponse courte : réponse brève attendue' : ''}

NIVEAUX DE BLOOM (${bloomLevels?.join(', ') || 'variés'}) :
${bloomLevels?.includes('remember') ? '- Remember : mémorisation de faits' : ''}
${bloomLevels?.includes('understand') ? '- Understand : compréhension de concepts' : ''}
${bloomLevels?.includes('apply') ? '- Apply : application pratique' : ''}
${bloomLevels?.includes('analyze') ? '- Analyze : analyse et comparaison' : ''}
${bloomLevels?.includes('evaluate') ? '- Evaluate : jugement et évaluation' : ''}
${bloomLevels?.includes('create') ? '- Create : création et synthèse' : ''}

DIFFICULTÉ (${difficulty}) :
${difficulty === 'easy' ? '- Questions simples, mémorisation directe' : ''}
${difficulty === 'medium' ? '- Questions modérées, application requise' : ''}
${difficulty === 'hard' ? '- Questions complexes, analyse et synthèse' : ''}
${difficulty === 'mixed' ? '- Équilibre entre tous les niveaux' : ''}

FORMAT DE SORTIE OBLIGATOIRE :
{
  "title": "Titre du quiz",
  "description": "Description brève du quiz",
  "questions": [
    {
      "type": "multiple-choice|true-false|fill-blank|matching|short-answer",
      "question": "Question claire et précise",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explication détaillée",
      "difficulty": "easy|medium|hard",
      "category": "Catégorie thématique",
      "tags": ["tag1", "tag2"],
      "points": 1,
      "timeLimit": 60,
      "hints": ["Indice 1", "Indice 2"],
      "source": {
        "type": "page|section|chapter",
        "reference": "Référence",
        "excerpt": "Extrait pertinent"
      },
      "BloomLevel": "remember|understand|apply|analyze|evaluate|create",
      "confidence": 0.85
    }
  ]
}

LANGUE : ${language === 'fr' ? 'Français' : 'Anglais'}
STYLE : ${style === 'academic' ? 'Académique et formel' : style === 'professional' ? 'Professionnel et direct' : 'Décontracté et accessible'}
${includeExplanations ? '- Inclure des explications détaillées pour chaque réponse' : ''}
${includeHints ? '- Ajouter des indices pour les questions difficiles' : ''}

RÈGLES QUALITÉ :
- Les questions doivent tester des compétences différentes
- Les options des QCM doivent être plausibles mais distinctes
- Les explications doivent être pédagogiques et constructives
- Le quiz doit couvrir les points importants du document
- Éviter les questions pièges ou ambiguës`;
}

/**
 * Construit le prompt utilisateur pour la génération
 */
function buildQuizUserPrompt(
  documentTitle: string,
  documentText: string,
  options: QuizGenerationOptions
): string {
  const { questionCount, categories, focusAreas } = options;
  
  let prompt = `DOCUMENT : "${documentTitle}"

CONTEXTE :
Analyse ce document et crée un quiz de ${questionCount} questions de haute qualité pour évaluer la compréhension.

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
- Identifie les concepts clés, les définitions, les procédures et les applications importantes
- Crée des questions qui couvrent différents niveaux de compréhension
- Varie les types de questions pour maintenir l'engagement
- Assure-toi que chaque question évalue une compétence spécifique
- Inclut des questions qui demandent de l'application pratique

Génère maintenant le quiz au format JSON requis.`;

  return prompt;
}

/**
 * Traite et valide les questions générées
 */
function processQuizQuestions(
  rawQuestions: any[],
  documentId: string,
  documentTitle: string
): QuizQuestion[] {
  const processedQuestions: QuizQuestion[] = [];

  for (let i = 0; i < rawQuestions.length; i++) {
    const raw = rawQuestions[i];
    
    try {
      // Validation de base
      if (!raw.question || !raw.type) {
        console.warn(`⚠️ Question ${i} invalide: question/type manquant`);
        continue;
      }

      // Validation spécifique par type
      if (raw.type === 'multiple-choice' && (!raw.options || raw.options.length < 2)) {
        console.warn(`⚠️ Question QCM ${i} invalide: options manquantes`);
        continue;
      }

      if (raw.correctAnswer === undefined || raw.correctAnswer === null) {
        console.warn(`⚠️ Question ${i} invalide: correctAnswer manquant`);
        continue;
      }

      // Créer la question avec valeurs par défaut
      const question: QuizQuestion = {
        id: `q_${documentId}_${Date.now()}_${i}`,
        documentId,
        type: validateQuestionType(raw.type),
        question: cleanText(raw.question),
        options: raw.options ? raw.options.map(String) : undefined,
        correctAnswer: raw.correctAnswer,
        explanation: raw.explanation ? cleanText(raw.explanation) : 'Explication non fournie',
        difficulty: validateDifficulty(raw.difficulty),
        category: raw.category || 'Général',
        tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
        points: Number(raw.points) || 1,
        timeLimit: Number(raw.timeLimit) || 60,
        hints: raw.hints ? raw.hints.map(String) : undefined,
        source: {
          type: validateSourceType(raw.source?.type),
          reference: raw.source?.reference || 'Non spécifié',
          excerpt: raw.source?.excerpt ? cleanText(raw.source.excerpt) : undefined
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          confidence: Math.max(0.1, Math.min(1, Number(raw.confidence) || 0.7)),
          BloomLevel: validateBloomLevel(raw.BloomLevel),
          estimatedTime: Number(raw.estimatedTime) || 60
        }
      };

      processedQuestions.push(question);
    } catch (error) {
      console.error(`❌ Erreur traitement question ${i}:`, error);
    }
  }

  return processedQuestions;
}

/**
 * Crée l'objet quiz complet
 */
function createQuizObject(
  documentId: string,
  documentTitle: string,
  questions: QuizQuestion[],
  options: QuizGenerationOptions
): Quiz {
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const estimatedDuration = Math.ceil(questions.reduce((sum, q) => sum + (q.timeLimit || 60), 0) / 60);
  
  // Calculer les distributions
  const difficultyDistribution = {
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length
  };

  const typeDistribution: Record<QuestionType, number> = {
    'multiple-choice': 0,
    'true-false': 0,
    'fill-blank': 0,
    'matching': 0,
    'short-answer': 0
  };

  questions.forEach(q => {
    typeDistribution[q.type]++;
  });

  const categories = [...new Set(questions.map(q => q.category))];

  return {
    id: `quiz_${documentId}_${Date.now()}`,
    documentId,
    title: `Quiz : ${documentTitle}`,
    description: `Quiz auto-généré à partir du document "${documentTitle}"`,
    questions,
    metadata: {
      totalQuestions: questions.length,
      totalPoints,
      estimatedDuration,
      difficultyDistribution,
      typeDistribution,
      categories,
      generatedAt: new Date().toISOString()
    },
    settings: {
      randomizeQuestions: true,
      randomizeOptions: true,
      showResultsImmediately: false,
      allowReview: true,
      passingScore: 70
    }
  };
}

/**
 * Calcule les statistiques du quiz
 */
function calculateQuizStatistics(
  quiz: Quiz,
  processingTime: number,
  documentLength: number
): QuizGenerationResult['statistics'] {
  const confidence = quiz.questions.reduce((sum, q) => sum + q.metadata.confidence, 0) / quiz.questions.length;
  
  // Diversité des types (0-1)
  const typeCount = Object.values(quiz.metadata.typeDistribution).filter(count => count > 0).length;
  const diversity = typeCount / 5; // 5 types maximum
  
  // Couverture estimée (basée sur le nombre de questions et la longueur)
  const coverage = Math.min(1, (quiz.questions.length * 1000) / documentLength);

  return {
    processingTime,
    confidence,
    coverage,
    diversity
  };
}

/**
 * Fonctions de validation
 */
function validateQuestionType(type: any): QuestionType {
  const validTypes: QuestionType[] = ['multiple-choice', 'true-false', 'fill-blank', 'matching', 'short-answer'];
  return validTypes.includes(type) ? type : 'multiple-choice';
}

function validateDifficulty(difficulty: any): QuizQuestion['difficulty'] {
  const validDifficulties: QuizQuestion['difficulty'][] = ['easy', 'medium', 'hard'];
  return validDifficulties.includes(difficulty) ? difficulty : 'medium';
}

function validateBloomLevel(level: any): QuizQuestion['metadata']['BloomLevel'] {
  const validLevels: QuizQuestion['metadata']['BloomLevel'][] = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
  return validLevels.includes(level) ? level : 'understand';
}

function validateSourceType(type: any): QuizQuestion['source']['type'] {
  const validTypes: QuizQuestion['source']['type'][] = ['page', 'section', 'chapter'];
  return validTypes.includes(type) ? type : 'section';
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
 * Sauvegarde le quiz dans Supabase
 */
export async function saveQuizToDatabase(quiz: Quiz): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('generated_quizzes')
      .insert({
        id: quiz.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        document_id: quiz.documentId,
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        metadata: quiz.metadata,
        settings: quiz.settings,
        created_at: quiz.metadata.generatedAt
      });

    if (error) {
      throw error;
    }

    console.log(`💾 Quiz sauvegardé: ${quiz.id}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sauvegarde quiz:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Formate le quiz pour l'affichage
 */
export function formatQuizForDisplay(
  quiz: Quiz,
  options: {
    includeAnswers?: boolean;
    includeExplanations?: boolean;
    groupByCategory?: boolean;
    compact?: boolean;
  } = {}
): string {
  const {
    includeAnswers = false,
    includeExplanations = false,
    groupByCategory = false,
    compact = false
  } = options;

  let formattedText = `# ${quiz.title}\n\n`;
  formattedText += `${quiz.description}\n\n`;
  
  // Métadonnées
  formattedText += `## 📊 Informations\n\n`;
  formattedText += `- **Questions :** ${quiz.metadata.totalQuestions}\n`;
  formattedText += `- **Points :** ${quiz.metadata.totalPoints}\n`;
  formattedText += `- **Durée estimée :** ${quiz.metadata.estimatedDuration} minutes\n`;
  formattedText += `- **Score de passage :** ${quiz.settings.passingScore}%\n\n`;

  if (!compact) {
    formattedText += `### 📈 Distribution\n\n`;
    formattedText += `- **Facile :** ${quiz.metadata.difficultyDistribution.easy} questions\n`;
    formattedText += `- **Moyen :** ${quiz.metadata.difficultyDistribution.medium} questions\n`;
    formattedText += `- **Difficile :** ${quiz.metadata.difficultyDistribution.hard} questions\n\n`;
  }

  // Questions
  if (groupByCategory) {
    const categories = quiz.metadata.categories;
    categories.forEach(category => {
      const categoryQuestions = quiz.questions.filter(q => q.category === category);
      formattedText += `## 📚 ${category} (${categoryQuestions.length} questions)\n\n`;
      
      categoryQuestions.forEach((question, index) => {
        formattedText += formatQuizQuestion(question, index + 1, includeAnswers, includeExplanations);
      });
    });
  } else {
    formattedText += `## 🎯 Questions\n\n`;
    quiz.questions.forEach((question, index) => {
      formattedText += formatQuizQuestion(question, index + 1, includeAnswers, includeExplanations);
    });
  }

  return formattedText;
}

/**
 * Formate une question individuelle
 */
function formatQuizQuestion(
  question: QuizQuestion,
  index: number,
  includeAnswers: boolean,
  includeExplanations: boolean
): string {
  let questionText = `### ${index}. ${question.question}\n\n`;
  
  // Options pour QCM
  if (question.type === 'multiple-choice' && question.options) {
    question.options.forEach((option, i) => {
      const letter = String.fromCharCode(65 + i); // A, B, C, D
      const isCorrect = includeAnswers && i === question.correctAnswer;
      questionText += `${letter}) ${option}${isCorrect ? ' ✅' : ''}\n`;
    });
    questionText += '\n';
  }
  
  // Vrai/Faux
  if (question.type === 'true-false') {
    const correct = includeAnswers ? 
      (question.correctAnswer === 0 ? 'Vrai' : 'Faux') + ' ✅' : 
      '';
    questionText += `a) Vrai\nb) Faux\n\n${correct ? `Réponse : ${correct}\n\n` : ''}`;
  }
  
  // Texte à trous
  if (question.type === 'fill-blank') {
    questionText += `Réponse : ${includeAnswers ? question.correctAnswer + ' ✅' : '_____'}\n\n`;
  }
  
  // Métadonnées
  if (!includeAnswers) {
    questionText += `- **Type :** ${question.type}\n`;
    questionText += `- **Difficulté :** ${question.difficulty}\n`;
    questionText += `- **Points :** ${question.points}\n`;
    if (question.timeLimit) {
      questionText += `- **Temps limite :** ${question.timeLimit}s\n`;
    }
    questionText += '\n';
  }
  
  // Explications
  if (includeExplanations && question.explanation) {
    questionText += `💡 **Explication :** ${question.explanation}\n\n`;
  }
  
  return questionText;
}
