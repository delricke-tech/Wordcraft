// Service de génération de quiz avec OpenAI via Edge Function Supabase
// Génère des questions QCM basées sur du contenu textuel

import { supabase } from '../lib/supabase';

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
    console.log(`🤖 Génération de ${questionCount} questions depuis le document...`);
    console.log('📝 Longueur texte source:', text.length, 'caractères');

    // Limiter la taille du texte envoyé
    const maxTextLength = 15000;
    const truncatedText = text.length > maxTextLength 
      ? text.substring(0, maxTextLength) + '...' 
      : text;

    console.log('📝 Texte analysé:', truncatedText.length, 'caractères');

    // Récupérer le token de session actuel
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Vous devez être connecté pour générer un quiz');
    }

    // ✅ Appeler l'Edge Function Supabase pour éviter CORS
    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        text: truncatedText,
        documentName: documentTitle,
        questionCount: questionCount
      },
    });

    if (error) {
      console.error('❌ Erreur Edge Function complète:', error);
      console.error('📋 Message:', error.message);
      
      // L'erreur de Supabase Functions contient souvent le body dans error.context
      let errorMessage = error.message || 'Erreur inconnue';
      
      // Essayer d'extraire les détails si disponibles
      try {
        // Supabase Functions met parfois l'erreur dans error.message directement
        if (error.message && error.message.includes('{')) {
          const jsonMatch = error.message.match(/\{.*\}/);
          if (jsonMatch) {
            const errorDetails = JSON.parse(jsonMatch[0]);
            console.error('🔴 DÉTAILS DE L\'ERREUR:', errorDetails);
            errorMessage = `${errorDetails.error || errorMessage}${errorDetails.details ? ' - ' + errorDetails.details : ''}`;
          }
        }
      } catch (parseError) {
        console.warn('Impossible de parser les détails de l\'erreur');
      }
      
      throw new Error(`Erreur lors de la génération du quiz: ${errorMessage}`);
    }

    if (!data) {
      throw new Error('Aucune réponse de l\'Edge Function');
    }

    console.log('✅ Quiz généré par l\'Edge Function:', data);

    // L'Edge Function retourne les questions avec correctAnswer comme string
    const parsedQuiz = data;

    if (!parsedQuiz.questions || !Array.isArray(parsedQuiz.questions)) {
      throw new Error('Format de réponse invalide');
    }

    // Ajouter des IDs uniques et convertir correctAnswer en index
    const questionsWithIds: QuizQuestion[] = parsedQuiz.questions.map((q: any, index: number) => {
      // Trouver l'index de la bonne réponse
      let correctAnswerIndex = 0;
      if (typeof q.correctAnswer === 'string') {
        correctAnswerIndex = q.options.findIndex((opt: string) => opt === q.correctAnswer);
        if (correctAnswerIndex === -1) correctAnswerIndex = 0; // Fallback si non trouvé
      } else if (typeof q.correctAnswer === 'number') {
        correctAnswerIndex = q.correctAnswer;
      }

      return {
        id: `q${Date.now()}-${index}`,
        question: q.question,
        options: q.options,
        correctAnswer: correctAnswerIndex,
        explanation: q.explanation || '',
      };
    });

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
