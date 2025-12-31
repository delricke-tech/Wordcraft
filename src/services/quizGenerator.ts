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
 * Génère un quiz de 5 questions QCM basé sur le texte fourni
 * @param text - Texte source pour générer le quiz
 * @param documentTitle - Titre du document source
 * @param documentId - ID du document dans Supabase
 * @returns Quiz généré avec 5 questions
 */
export async function generateQuizFromText(
  text: string,
  documentTitle: string,
  documentId: string
): Promise<GeneratedQuiz> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('Clé API OpenAI non configurée. Ajoutez VITE_OPENAI_API_KEY dans votre fichier .env');
    }

    console.log('🤖 Génération de quiz avec OpenAI...');
    console.log('📝 Longueur texte source:', text.length, 'caractères');

    // ✅ QUALITÉ OPTIMALE : Texte plus long pour des questions de qualité
    const maxTextLength = 8000; // Augmenté pour garantir la qualité des questions
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
            content: `Tu es un professeur expert qui crée des quiz pédagogiques de qualité.
Génère 5 questions à choix multiples (QCM) basées sur le contenu fourni.

Pour chaque question :
- Pose une question claire et précise
- Fournis 4 options de réponse pertinentes (A, B, C, D)
- Indique l'option correcte (0 pour A, 1 pour B, 2 pour C, 3 pour D)
- Fournis une explication détaillée et pédagogique

Format JSON strict :
{"questions":[{"question":"Question détaillée ?","options":["Option A","Option B","Option C","Option D"],"correctAnswer":0,"explanation":"Explication complète"}]}

Questions variées : définitions, compréhension, application, analyse. Réponses en français.`
          },
          {
            role: 'user',
            content: `Génère 5 questions QCM de qualité basées sur ce cours :\n\n${truncatedText}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500, // Augmenté pour des explications plus détaillées
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
