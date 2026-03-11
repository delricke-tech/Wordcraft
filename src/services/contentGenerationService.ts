/**
 * Service de génération de contenu IA avancé
 * Permet de générer des résumés, fiches de révision, quiz et autres contenus pédagogiques
 * 
 * Date: 6 mars 2025
 */

import { getOpenAIClient } from './openaiService';

export interface SummaryOptions {
  type: 'global' | 'sections' | 'key_points';
  detailLevel: 'concis' | 'standard' | 'détaillé';
  language?: 'fr' | 'en';
  includeExamples?: boolean;
  targetLength?: number; // nombre de mots ou caractères
}

export interface DocumentSection {
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

export interface GeneratedSummary {
  id: string;
  documentId: string;
  documentName: string;
  type: SummaryOptions['type'];
  content: string;
  sections?: DocumentSection[];
  metadata: {
    wordCount: number;
    readingTime: number; // en minutes
    generatedAt: string;
    model: string;
    tokensUsed: number;
  };
}

export interface FlashCardOptions {
  count: number;
  difficulty: 'facile' | 'moyen' | 'difficile';
  categories: string[];
  includeExamples: boolean;
  format: 'qa' | 'definition' | 'concept';
}

export interface FlashCard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: FlashCardOptions['difficulty'];
  example?: string;
  hints?: string[];
}

export interface GeneratedFlashCards {
  id: string;
  documentId: string;
  documentName: string;
  cards: FlashCard[];
  metadata: {
    totalCount: number;
    difficulty: FlashCardOptions['difficulty'];
    categories: string[];
    generatedAt: string;
    model: string;
    tokensUsed: number;
  };
}

export interface QuizOptions {
  type: 'qcm' | 'vrai_faux' | 'ouvert' | 'mixte';
  questionCount: number;
  difficulty: 'facile' | 'moyen' | 'difficile';
  topics?: string[];
  timeLimit?: number; // en minutes
  includeExplanations?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuizOptions['type'];
  options?: string[]; // pour QCM
  correctAnswer: string | number;
  explanation?: string;
  difficulty: QuizOptions['difficulty'];
  topic?: string;
  points: number;
}

export interface GeneratedQuiz {
  id: string;
  documentId: string;
  documentName: string;
  title: string;
  questions: QuizQuestion[];
  metadata: {
    totalQuestions: number;
    type: QuizOptions['type'];
    difficulty: QuizOptions['difficulty'];
    timeLimit?: number;
    totalPoints: number;
    generatedAt: string;
    model: string;
    tokensUsed: number;
  };
}

/**
 * Génère un résumé intelligent d'un document
 */
export async function generateDocumentSummary(
  documentContent: string,
  documentId: string,
  documentName: string,
  options: SummaryOptions
): Promise<GeneratedSummary> {
  const openai = getOpenAIClient();
  
  try {
    console.log('📝 Génération de résumé pour:', documentName);
    console.log('  - Type:', options.type);
    console.log('  - Niveau:', options.detailLevel);
    console.log('  - Longueur du contenu:', documentContent.length, 'caractères');

    let prompt = '';
    let systemPrompt = '';

    // Construire le prompt selon le type de résumé
    switch (options.type) {
      case 'global':
        prompt = buildGlobalSummaryPrompt(documentContent, options);
        systemPrompt = 'Tu es un expert en synthèse de documents. Génère un résumé clair et structuré.';
        break;
      case 'sections':
        prompt = buildSectionsSummaryPrompt(documentContent, options);
        systemPrompt = 'Tu es un expert en analyse structurée. Identifie les sections principales et résume chacune.';
        break;
      case 'key_points':
        prompt = buildKeyPointsPrompt(documentContent, options);
        systemPrompt = 'Tu es un expert en extraction de points clés. Identifie les informations essentielles.';
        break;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: options.detailLevel === 'concis' ? 800 : options.detailLevel === 'standard' ? 1500 : 3000,
      temperature: 0.3, // Plus de cohérence pour les résumés
    });

    const content = completion.choices[0]?.message?.content || '';
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Analyser et structurer le contenu selon le type
    let sections: DocumentSection[] | undefined;
    if (options.type === 'sections') {
      sections = parseSummarySections(content);
    }

    const summary: GeneratedSummary = {
      id: `summary_${documentId}_${Date.now()}`,
      documentId,
      documentName,
      type: options.type,
      content: content,
      sections,
      metadata: {
        wordCount: content.split(/\s+/).length,
        readingTime: Math.ceil(content.split(/\s+/).length / 200), // 200 mots/min
        generatedAt: new Date().toISOString(),
        model: 'gpt-4',
        tokensUsed
      }
    };

    console.log('✅ Résumé généré avec succès');
    console.log('  - Mots:', summary.metadata.wordCount);
    console.log('  - Temps de lecture:', summary.metadata.readingTime, 'min');
    console.log('  - Tokens utilisés:', summary.metadata.tokensUsed);

    return summary;

  } catch (error: any) {
    console.error('❌ Erreur génération résumé:', error);
    throw new Error(`Impossible de générer le résumé: ${error.message}`);
  }
}

/**
 * Génère des fiches de révision (flashcards) depuis un document
 */
export async function generateFlashCards(
  documentContent: string,
  documentId: string,
  documentName: string,
  options: FlashCardOptions
): Promise<GeneratedFlashCards> {
  const openai = getOpenAIClient();
  
  try {
    console.log('🎴 Génération de flashcards pour:', documentName);
    console.log('  - Nombre:', options.count);
    console.log('  - Difficulté:', options.difficulty);
    console.log('  - Format:', options.format);

    const prompt = buildFlashCardsPrompt(documentContent, options);
    const systemPrompt = `Tu es un expert pédagogique spécialisé dans la création de fiches de révision. 
Génère ${options.count} flashcards de difficulté ${options.difficulty} au format ${options.format}.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: options.count * 150, // ~150 mots par flashcard
      temperature: 0.4,
    });

    const content = completion.choices[0]?.message?.content || '';
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Parser les flashcards depuis la réponse
    const cards = parseFlashCards(content, options);

    const flashCards: GeneratedFlashCards = {
      id: `flashcards_${documentId}_${Date.now()}`,
      documentId,
      documentName,
      cards,
      metadata: {
        totalCount: cards.length,
        difficulty: options.difficulty,
        categories: options.categories,
        generatedAt: new Date().toISOString(),
        model: 'gpt-4',
        tokensUsed
      }
    };

    console.log('✅ Flashcards générées avec succès');
    console.log('  - Nombre de cartes:', flashCards.metadata.totalCount);
    console.log('  - Tokens utilisés:', flashCards.metadata.tokensUsed);

    return flashCards;

  } catch (error: any) {
    console.error('❌ Erreur génération flashcards:', error);
    throw new Error(`Impossible de générer les flashcards: ${error.message}`);
  }
}

/**
 * Génère un quiz depuis un document
 */
export async function generateQuiz(
  documentContent: string,
  documentId: string,
  documentName: string,
  options: QuizOptions
): Promise<GeneratedQuiz> {
  const openai = getOpenAIClient();
  
  try {
    console.log('📋 Génération de quiz pour:', documentName);
    console.log('  - Type:', options.type);
    console.log('  - Questions:', options.questionCount);
    console.log('  - Difficulté:', options.difficulty);

    const prompt = buildQuizPrompt(documentContent, options);
    const systemPrompt = `Tu es un expert en évaluation pédagogique. 
Crée un quiz de ${options.questionCount} questions de difficulté ${options.difficulty} au format ${options.type}.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: options.questionCount * 200, // ~200 mots par question
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content || '';
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Parser les questions depuis la réponse
    const questions = parseQuizQuestions(content, options);

    const quiz: GeneratedQuiz = {
      id: `quiz_${documentId}_${Date.now()}`,
      documentId,
      documentName,
      title: `Quiz - ${documentName}`,
      questions,
      metadata: {
        totalQuestions: questions.length,
        type: options.type,
        difficulty: options.difficulty,
        timeLimit: options.timeLimit,
        totalPoints: questions.reduce((sum: number, q: QuizQuestion) => sum + q.points, 0),
        generatedAt: new Date().toISOString(),
        model: 'gpt-4',
        tokensUsed
      }
    };

    console.log('✅ Quiz généré avec succès');
    console.log('  - Questions:', quiz.metadata.totalQuestions);
    console.log('  - Points totaux:', quiz.metadata.totalPoints);
    console.log('  - Tokens utilisés:', quiz.metadata.tokensUsed);

    return quiz;

  } catch (error: any) {
    console.error('❌ Erreur génération quiz:', error);
    throw new Error(`Impossible de générer le quiz: ${error.message}`);
  }
}

// ===== Fonctions utilitaires pour construire les prompts =====

function buildGlobalSummaryPrompt(content: string, options: SummaryOptions): string {
  const language = options.language || 'fr';
  const targetLength = options.targetLength || (options.detailLevel === 'concis' ? 150 : options.detailLevel === 'standard' ? 300 : 500);
  
  let prompt = language === 'fr' 
    ? `Génère un résumé ${options.detailLevel} du document suivant en environ ${targetLength} mots.\n\n`
    : `Generate a ${options.detailLevel} summary of the following document in approximately ${targetLength} words.\n\n`;

  if (options.includeExamples) {
    prompt += language === 'fr' 
      ? "Inclus des exemples concrets pour illustrer les points clés.\n\n"
      : "Include concrete examples to illustrate key points.\n\n";
  }

  prompt += `--- DOCUMENT ---\n\n${content}\n\n--- FIN DOCUMENT ---\n\n`;
  
  prompt += language === 'fr'
    ? `Résumé demandé :\n\n- Structure claire avec introduction et conclusion\n- Points principaux bien identifiés\n- ${options.detailLevel === 'concis' ? 'Synthèse directe' : options.detailLevel === 'standard' ? 'Explications concises' : 'Détails approfondis'}\n- Format Markdown avec titres et listes`
    : `Required summary:\n\n- Clear structure with introduction and conclusion\n- Key points well identified\n- ${options.detailLevel === 'concis' ? 'Direct synthesis' : options.detailLevel === 'standard' ? 'Concise explanations' : 'In-depth details'}\n- Markdown format with headings and lists`;

  return prompt;
}

function buildSectionsSummaryPrompt(content: string, options: SummaryOptions): string {
  const language = options.language || 'fr';
  
  let prompt = language === 'fr'
    ? `Analyse le document suivant et génère un résumé structuré par sections principales.\n\n`
    : `Analyze the following document and generate a structured summary by main sections.\n\n`;

  prompt += `--- DOCUMENT ---\n\n${content}\n\n--- FIN DOCUMENT ---\n\n`;
  
  prompt += language === 'fr'
    ? `Résumé structuré demandé :\n\n- Identifie 3-5 sections principales du document\n- Pour chaque section : titre clair + résumé ${options.detailLevel}\n- Utilise le format ## pour les titres de sections\n- Ajoute une brève introduction et conclusion`
    : `Required structured summary:\n\n- Identify 3-5 main sections of the document\n- For each section: clear title + ${options.detailLevel} summary\n- Use ## format for section titles\n- Add a brief introduction and conclusion`;

  return prompt;
}

function buildKeyPointsPrompt(content: string, options: SummaryOptions): string {
  const language = options.language || 'fr';
  
  let prompt = language === 'fr'
    ? `Extrais les points clés essentiels du document suivant.\n\n`
    : `Extract the essential key points from the following document.\n\n`;

  prompt += `--- DOCUMENT ---\n\n${content}\n\n--- FIN DOCUMENT ---\n\n`;
  
  prompt += language === 'fr'
    ? `Points clés demandés :\n\n- Format liste à puces avec hiérarchie\n- Concepts principaux et leurs définitions\n- Données importantes et statistiques\n- ${options.includeExamples ? 'Exemples pratiques pour chaque point' : 'Focus sur les concepts uniquement'}\n- Maximum ${options.detailLevel === 'concis' ? '10' : options.detailLevel === 'standard' ? '20' : '30'} points clés`
    : `Required key points:\n\n- Bulleted list format with hierarchy\n- Main concepts and their definitions\n- Important data and statistics\n- ${options.includeExamples ? 'Practical examples for each point' : 'Focus on concepts only'}\n- Maximum ${options.detailLevel === 'concis' ? '10' : options.detailLevel === 'standard' ? '20' : '30'} key points`;

  return prompt;
}

function buildFlashCardsPrompt(content: string, options: FlashCardOptions): string {
  let prompt = `Crée ${options.count} flashcards au format ${options.format} de difficulté ${options.difficulty} basées sur ce contenu :\n\n`;
  
  prompt += `--- DOCUMENT ---\n\n${content}\n\n--- FIN DOCUMENT ---\n\n`;
  
  prompt += `Format demandé :\n\n`;
  
  switch (options.format) {
    case 'qa':
      prompt += `Q: [Question claire]\nA: [Réponse précise]\n\nRépéter pour ${options.count} cartes.`;
      break;
    case 'definition':
      prompt += `Terme: [Concept important]\nDéfinition: [Définition claire]\n\nRépéter pour ${options.count} cartes.`;
      break;
    case 'concept':
      prompt += `Concept: [Idée principale]\nExplication: [Explication détaillée]\n${options.includeExamples ? 'Exemple: [Exemple concret]\n' : ''}\n\nRépéter pour ${options.count} cartes.`;
      break;
  }
  
  if (options.categories.length > 0) {
    prompt += `\nCatégories à couvrir : ${options.categories.join(', ')}`;
  }
  
  return prompt;
}

function buildQuizPrompt(content: string, options: QuizOptions): string {
  let prompt = `Crée un quiz de ${options.questionCount} questions de type ${options.type} (difficulté ${options.difficulty}) basé sur ce contenu :\n\n`;
  
  prompt += `--- DOCUMENT ---\n\n${content}\n\n--- FIN DOCUMENT ---\n\n`;
  
  prompt += `Format demandé :\n\n`;
  
  switch (options.type) {
    case 'qcm':
      prompt += `Q[num]: [Question]\na) [Option A]\nb) [Option B]\nc) [Option C]\nd) [Option D]\nRéponse: [lettre correcte]\n${options.includeExplanations ? 'Explication: [Pourquoi c\'est correct]\n' : ''}\n`;
      break;
    case 'vrai_faux':
      prompt += `Q[num]: [Affirmation]\nRéponse: [Vrai/Faux]\n${options.includeExplanations ? 'Explication: [Pourquoi c\'est vrai/faux]\n' : ''}\n`;
      break;
    case 'ouvert':
      prompt += `Q[num]: [Question ouverte]\nRéponse: [Réponse attendue]\n${options.includeExplanations ? 'Explication: [Contexte additionnel]\n' : ''}\n`;
      break;
    case 'mixte':
      prompt += `Mélange les trois formats (QCM, Vrai/Faux, Ouvert) en respectant le format spécifique à chaque type.\n`;
      break;
  }
  
  if (options.topics && options.topics.length > 0) {
    prompt += `\nSujets à couvrir : ${options.topics.join(', ')}`;
  }
  
  return prompt;
}

// ===== Fonctions de parsing =====

function parseSummarySections(content: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const lines = content.split('\n');
  let currentSection: DocumentSection | null = null;
  let startIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Détecter les titres de section (## ou ###)
    if (line.startsWith('##')) {
      if (currentSection) {
        currentSection.endIndex = startIndex;
        currentSection.content = currentSection.content.trim();
        sections.push(currentSection);
      }
      
      currentSection = {
        title: line.replace(/^#+\s*/, '').trim(),
        content: '',
        startIndex,
        endIndex: 0
      };
    } else if (currentSection) {
      currentSection.content += line + '\n';
      startIndex += line.length + 1;
    }
  }
  
  if (currentSection) {
    currentSection.endIndex = startIndex;
    currentSection.content = currentSection.content.trim();
    sections.push(currentSection);
  }
  
  return sections;
}

function parseFlashCards(content: string, options: FlashCardOptions): FlashCard[] {
  const cards: FlashCard[] = [];
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  let currentCard: Partial<FlashCard> = {};
  let cardIndex = 0;
  
  for (let i = 0; i < lines.length && cardIndex < options.count; i++) {
    const line = lines[i];
    
    if (line.startsWith('Q:') || line.startsWith('Question:')) {
      if (currentCard.front && currentCard.back) {
        cards.push({
          id: `card_${Date.now()}_${cardIndex}`,
          front: currentCard.front,
          back: currentCard.back,
          category: options.categories[0] || 'Général',
          difficulty: options.difficulty,
          example: currentCard.example,
          hints: currentCard.hints
        });
        cardIndex++;
      }
      
      currentCard = { front: line.replace(/^(Q|Question):\s*/, '').trim() };
    } else if (line.startsWith('A:') || line.startsWith('Réponse:')) {
      currentCard.back = line.replace(/^(A|Réponse):\s*/, '').trim();
    } else if (line.startsWith('Terme:')) {
      if (currentCard.front && currentCard.back) {
        cards.push({
          id: `card_${Date.now()}_${cardIndex}`,
          front: currentCard.front,
          back: currentCard.back,
          category: options.categories[0] || 'Général',
          difficulty: options.difficulty,
          example: currentCard.example,
          hints: currentCard.hints
        });
        cardIndex++;
      }
      
      currentCard = { front: line.replace(/^Terme:\s*/, '').trim() };
    } else if (line.startsWith('Définition:')) {
      currentCard.back = line.replace(/^Définition:\s*/, '').trim();
    } else if (line.startsWith('Exemple:')) {
      currentCard.example = line.replace(/^Exemple:\s*/, '').trim();
    }
  }
  
  // Ajouter la dernière carte
  if (currentCard.front && currentCard.back && cardIndex < options.count) {
    cards.push({
      id: `card_${Date.now()}_${cardIndex}`,
      front: currentCard.front,
      back: currentCard.back,
      category: options.categories[0] || 'Général',
      difficulty: options.difficulty,
      example: currentCard.example,
      hints: currentCard.hints
    });
  }
  
  return cards;
}

function parseQuizQuestions(content: string, options: QuizOptions): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  let currentQuestion: Partial<QuizQuestion> = {};
  let questionIndex = 0;
  
  for (let i = 0; i < lines.length && questionIndex < options.questionCount; i++) {
    const line = lines[i];
    
    if (line.startsWith('Q[') || line.match(/^Q\d+:/)) {
      if (currentQuestion.question && currentQuestion.correctAnswer !== undefined) {
        questions.push({
          id: `question_${Date.now()}_${questionIndex}`,
          question: currentQuestion.question,
          type: currentQuestion.type || options.type,
          options: currentQuestion.options,
          correctAnswer: currentQuestion.correctAnswer,
          explanation: currentQuestion.explanation,
          difficulty: options.difficulty,
          topic: currentQuestion.topic,
          points: currentQuestion.points || 1
        });
        questionIndex++;
      }
      
      currentQuestion = { 
        question: line.replace(/^Q\d+:\s*|Q\[\d+\]:\s*/, '').trim(),
        type: options.type,
        points: 1
      };
    } else if (line.match(/^[a-d]\)/)) {
      if (!currentQuestion.options) currentQuestion.options = [];
      currentQuestion.options.push(line.replace(/^[a-d]\)\s*/, '').trim());
    } else if (line.startsWith('Réponse:')) {
      const answer = line.replace(/^Réponse:\s*/, '').trim();
      if (options.type === 'qcm') {
        currentQuestion.correctAnswer = answer.toLowerCase();
      } else {
        currentQuestion.correctAnswer = answer;
      }
    } else if (line.startsWith('Explication:')) {
      currentQuestion.explanation = line.replace(/^Explication:\s*/, '').trim();
    }
  }
  
  // Ajouter la dernière question
  if (currentQuestion.question && currentQuestion.correctAnswer !== undefined && questionIndex < options.questionCount) {
    questions.push({
      id: `question_${Date.now()}_${questionIndex}`,
      question: currentQuestion.question,
      type: currentQuestion.type || options.type,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
      difficulty: options.difficulty,
      topic: currentQuestion.topic,
      points: currentQuestion.points || 1
    });
  }
  
  return questions;
}
