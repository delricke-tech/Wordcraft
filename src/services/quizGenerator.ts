// Service de génération de quiz avec OpenAI
// Génère des questions QCM basées sur du contenu textuel

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index de la bonne réponse (0-3)
  explanation: string;
};

export type GeneratedQuiz = {
  questions: QuizQuestion[];
  title: string;
  documentId: string;
  createdAt: string;
};

/**
 * Génère un quiz QCM basé sur le texte fourni
 * @param text - Texte source pour générer le quiz
 * @param documentTitle - Titre du document source
 * @param documentId - ID du document dans Supabase
 * @param questionCount - Nombre de questions à générer (par défaut 10)
 * @returns Quiz généré avec le nombre de questions demandé
 */
export async function generateQuizFromText(
  text: string,
  documentTitle: string,
  documentId: string,
  questionCount: number = 10
): Promise<GeneratedQuiz> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('Clé API OpenAI non configurée. Ajoutez VITE_OPENAI_API_KEY dans votre fichier .env');
    }

    console.log(`🤖 Génération de ${questionCount} questions depuis le document...`);
    console.log('📝 Longueur texte source:', text.length, 'caractères');

    // ✅ QUALITÉ OPTIMALE : Texte plus long pour des questions de qualité
    const maxTextLength = 15000; // Augmenté pour plus de contenu
    const truncatedText = text.length > maxTextLength 
      ? text.substring(0, maxTextLength) + '...' 
      : text;
    
    console.log('📝 Texte analysé:', truncatedText.length, 'caractères');

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
            content: `Tu es un professeur expert qui crée des quiz pédagogiques de haute qualité.

RÈGLES STRICTES :
1. Base-toi UNIQUEMENT sur le contenu fourni - N'invente RIEN
2. Génère EXACTEMENT ${questionCount} questions à choix multiples (QCM)
3. Toutes les questions doivent provenir directement du document

Pour chaque question :
- Pose une question claire et précise basée sur une information PRÉSENTE dans le texte
- Fournis 4 options de réponse pertinentes (A, B, C, D)
- UNE SEULE option correcte, les autres doivent être plausibles mais fausses
- Indique l'option correcte (0 pour A, 1 pour B, 2 pour C, 3 pour D)
- Fournis une explication détaillée avec référence au document

Variété des questions :
- Définitions et concepts clés
- Compréhension et mémorisation
- Application pratique
- Analyse et synthèse

Format JSON strict :
{"questions":[{"question":"Question basée sur le document ?","options":["Option A","Option B","Option C","Option D"],"correctAnswer":0,"explanation":"Explication avec citation du document"}]}

IMPORTANT : Toutes les réponses doivent être en français et basées sur le contenu réel du document.`
          },
          {
            role: 'user',
            content: `Génère ${questionCount} questions QCM de haute qualité basées UNIQUEMENT sur le contenu suivant :\n\n${truncatedText}\n\nRAPPEL : ${questionCount} questions exactement, basées sur le document uniquement.`
          }
        ],
        temperature: 0.5, // Réduit pour plus de précision
        max_tokens: 3000, // Augmenté pour ${questionCount} questions
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

    console.log('✅ Quiz généré par OpenAI:', content);

    // Parser la réponse JSON
    const parsedQuiz = JSON.parse(content);

    // Ajouter des IDs uniques à chaque question
    const questionsWithIds: QuizQuestion[] = parsedQuiz.questions.map((q: any, index: number) => ({
      id: `q${Date.now()}-${index}`,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));

    const quiz: GeneratedQuiz = {
      questions: questionsWithIds,
      title: `Quiz : ${documentTitle}`,
      documentId,
      createdAt: new Date().toISOString(),
    };

    console.log('✅ Quiz formaté avec succès:', quiz);
    return quiz;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du quiz:', error);
    throw error;
  }
}

/**
 * Calcule le score d'un quiz
 * @param userAnswers - Réponses de l'utilisateur (index des options choisies)
 * @param questions - Questions du quiz
 * @returns Score en pourcentage et détails
 */
export function calculateQuizScore(
  userAnswers: Record<string, number>,
  questions: QuizQuestion[]
): {
  score: number;
  percentage: number;
  correctCount: number;
  totalCount: number;
  details: Array<{
    questionId: string;
    correct: boolean;
    userAnswer: number;
    correctAnswer: number;
  }>;
} {
  let correctCount = 0;
  const details = questions.map(q => {
    const userAnswer = userAnswers[q.id];
    const isCorrect = userAnswer === q.correctAnswer;
    if (isCorrect) correctCount++;

    return {
      questionId: q.id,
      correct: isCorrect,
      userAnswer,
      correctAnswer: q.correctAnswer,
    };
  });

  const totalCount = questions.length;
  const percentage = (correctCount / totalCount) * 100;

  return {
    score: correctCount,
    percentage: Math.round(percentage),
    correctCount,
    totalCount,
    details,
  };
}
