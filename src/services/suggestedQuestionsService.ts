/**
 * Service de génération de questions suggérées contextuelles et intelligentes
 * 
 * Ce service génère des questions pertinentes basées sur :
 * - Le contenu du document actuel
 * - L'historique de conversation
 * - Le contexte utilisateur
 * - Les sujets connexes et approfondissements possibles
 * 
 * Date: 10 mars 2026
 */

import { getOpenAIClient } from './openaiService';
import type { DocumentContext } from './openaiService';
import type { ChatMessage } from './openaiService';

// Types
export interface SuggestedQuestion {
  id: string;
  text: string;
  category: 'clarification' | 'approfondissement' | 'application' | 'synthèse' | 'comparaison';
  priority: 'high' | 'medium' | 'low';
  context?: string;
  relatedTopics?: string[];
  estimatedComplexity: 1 | 2 | 3 | 4 | 5; // 1 = simple, 5 = complexe
  keywords?: string[];
}

export interface QuestionGenerationOptions {
  maxQuestions?: number;
  categories?: SuggestedQuestion['category'][];
  complexityRange?: [number, number];
  includeContextualHints?: boolean;
  adaptToUserLevel?: boolean;
  focusOnWeakPoints?: boolean;
}

export interface QuestionGenerationResult {
  questions: SuggestedQuestion[];
  metadata: {
    documentAnalyzed: boolean;
    contextUsed: boolean;
    userHistoryAnalyzed: boolean;
    generationTime: number;
    topicsIdentified: string[];
  };
}

class SuggestedQuestionsService {
  private readonly DEFAULT_OPTIONS: QuestionGenerationOptions = {
    maxQuestions: 8,
    categories: ['clarification', 'approfondissement', 'application', 'synthèse'],
    complexityRange: [2, 4],
    includeContextualHints: true,
    adaptToUserLevel: true,
    focusOnWeakPoints: false
  };

  /**
   * Génère des questions suggérées basées sur le contexte
   */
  async generateSuggestedQuestions(
    documentContext: DocumentContext,
    conversationHistory: ChatMessage[] = [],
    options: QuestionGenerationOptions = {}
  ): Promise<QuestionGenerationResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };

    console.log('🤔 ===== GÉNÉRATION QUESTIONS SUGGÉRÉES =====');
    console.log('  - Document:', documentContext.documentName);
    console.log('  - Max questions:', mergedOptions.maxQuestions);
    console.log('  - Catégories:', mergedOptions.categories?.join(', '));

    try {
      // Analyser le contenu du document
      const documentAnalysis = await this.analyzeDocumentContent(documentContext);
      
      // Analyser l'historique de conversation
      const historyAnalysis = await this.analyzeConversationHistory(conversationHistory);
      
      // Identifier les sujets et thèmes
      const topicsIdentified = this.extractTopics(documentAnalysis, historyAnalysis);
      
      // Générer les questions avec GPT
      const questions = await this.generateQuestionsWithAI(
        documentContext,
        documentAnalysis,
        historyAnalysis,
        topicsIdentified,
        mergedOptions
      );

      // Filtrer et ordonner les questions
      const filteredQuestions = this.filterAndRankQuestions(questions, mergedOptions);

      const result: QuestionGenerationResult = {
        questions: filteredQuestions.slice(0, mergedOptions.maxQuestions || 8),
        metadata: {
          documentAnalyzed: !!documentContext.extractedText,
          contextUsed: conversationHistory.length > 0,
          userHistoryAnalyzed: historyAnalysis.topicsDiscussed.length > 0,
          generationTime: Date.now() - startTime,
          topicsIdentified: topicsIdentified
        }
      };

      console.log(`✅ ${result.questions.length} questions générées en ${result.metadata.generationTime}ms`);
      return result;

    } catch (error) {
      console.error('❌ Erreur génération questions:', error);
      
      // Fallback : questions génériques basées sur le document
      return this.generateFallbackQuestions(documentContext, mergedOptions);
    }
  }

  /**
   * Analyse le contenu du document pour extraire les concepts clés
   */
  private async analyzeDocumentContent(documentContext: DocumentContext): Promise<{
    mainTopics: string[];
    keyConcepts: string[];
    difficulty: 'basic' | 'intermediate' | 'advanced';
    documentType: string;
    structure: string[];
  }> {
    if (!documentContext.extractedText) {
      return {
        mainTopics: [],
        keyConcepts: [],
        difficulty: 'intermediate',
        documentType: 'unknown',
        structure: []
      };
    }

    const text = documentContext.extractedText.slice(0, 8000); // Limiter pour l'analyse
    const openai = getOpenAIClient();

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en analyse de documents pédagogiques. 
            Analyse le texte fourni et extrais les informations structurées suivantes au format JSON :
            
            {
              "mainTopics": ["sujet principal 1", "sujet principal 2"],
              "keyConcepts": ["concept clé 1", "concept clé 2"],
              "difficulty": "basic|intermediate|advanced",
              "documentType": "type de document",
              "structure": ["section 1", "section 2"]
            }`
          },
          {
            role: 'user',
            content: `Analyse ce document et extrais les informations clés :\n\n${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
      
    } catch (error) {
      console.warn('⚠️ Erreur analyse document, utilisation fallback');
      return this.extractBasicTopics(text);
    }
  }

  /**
   * Analyse l'historique de conversation
   */
  private async analyzeConversationHistory(history: ChatMessage[]): Promise<{
    topicsDiscussed: string[];
    userQuestions: string[];
    difficultyLevel: number;
    knowledgeGaps: string[];
    interests: string[];
  }> {
    if (history.length === 0) {
      return {
        topicsDiscussed: [],
        userQuestions: [],
        difficultyLevel: 3,
        knowledgeGaps: [],
        interests: []
      };
    }

    const recentHistory = history.slice(-10); // Derniers 10 messages
    const historyText = recentHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const openai = getOpenAIClient();

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyse l'historique de conversation et extrais :
            {
              "topicsDiscussed": ["sujet 1", "sujet 2"],
              "userQuestions": ["question 1", "question 2"],
              "difficultyLevel": 1-5,
              "knowledgeGaps": ["gap 1", "gap 2"],
              "interests": ["intérêt 1", "intérêt 2"]
            }`
          },
          {
            role: 'user',
            content: `Analyse cet historique :\n\n${historyText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
      
    } catch (error) {
      console.warn('⚠️ Erreur analyse historique, utilisation fallback');
      return this.extractBasicHistoryInfo(recentHistory);
    }
  }

  /**
   * Génère les questions avec l'IA
   */
  private async generateQuestionsWithAI(
    documentContext: DocumentContext,
    documentAnalysis: any,
    historyAnalysis: any,
    topics: string[],
    options: QuestionGenerationOptions
  ): Promise<SuggestedQuestion[]> {
    const openai = getOpenAIClient();

    const prompt = this.buildQuestionGenerationPrompt(
      documentContext,
      documentAnalysis,
      historyAnalysis,
      topics,
      options
    );

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert pédagogique spécialisé dans la création de questions d'apprentissage pertinentes.
            
            Génère des questions qui aident l'utilisateur à :
            1. Mieux comprendre le contenu
            2. Approfondir les sujets clés
            3. Appliquer les connaissances
            4. Faire des liens entre concepts
            5. Synthétiser l'information
            
            Format de réponse JSON :
            [
              {
                "text": "question complète",
                "category": "clarification|approfondissement|application|synthèse|comparaison",
                "priority": "high|medium|low",
                "context": "contexte ou indice",
                "relatedTopics": ["sujet 1", "sujet 2"],
                "estimatedComplexity": 1-5,
                "keywords": ["mot1", "mot2"]
              }
            ]`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content || '[]';
      const questions = JSON.parse(content);
      
      return questions.map((q: any, index: number) => ({
        ...q,
        id: `suggested-${Date.now()}-${index}`
      }));

    } catch (error) {
      console.error('❌ Erreur génération questions IA:', error);
      return [];
    }
  }

  /**
   * Construit le prompt pour la génération de questions
   */
  private buildQuestionGenerationPrompt(
    documentContext: DocumentContext,
    documentAnalysis: any,
    historyAnalysis: any,
    topics: string[],
    options: QuestionGenerationOptions
  ): string {
    let prompt = `Génère des questions suggérées pertinentes pour ce document :\n\n`;
    
    prompt += `**DOCUMENT :** ${documentContext.documentName}\n`;
    prompt += `**TYPE :** ${documentAnalysis.documentType || 'inconnu'}\n`;
    prompt += `**DIFFICULTÉ :** ${documentAnalysis.difficulty || 'intermédiaire'}\n\n`;
    
    if (documentAnalysis.mainTopics?.length > 0) {
      prompt += `**SUJETS PRINCIPAUX :**\n${documentAnalysis.mainTopics.join(', ')}\n\n`;
    }
    
    if (documentAnalysis.keyConcepts?.length > 0) {
      prompt += `**CONCEPTS CLÉS :**\n${documentAnalysis.keyConcepts.join(', ')}\n\n`;
    }
    
    if (historyAnalysis.topicsDiscussed?.length > 0) {
      prompt += `**SUJETS DÉJÀ DISCUTÉS :**\n${historyAnalysis.topicsDiscussed.join(', ')}\n\n`;
    }
    
    if (historyAnalysis.knowledgeGaps?.length > 0 && options.focusOnWeakPoints) {
      prompt += `**POINTS FAIBLES IDENTIFIÉS :**\n${historyAnalysis.knowledgeGaps.join(', ')}\n\n`;
    }
    
    prompt += `**CATÉGORIES REQUISES :** ${options.categories?.join(', ')}\n`;
    prompt += `**COMPLEXITÉ VISÉE :** ${options.complexityRange?.[0]}-${options.complexityRange?.[1]}/5\n`;
    prompt += `**NOMBRE DE QUESTIONS :** ${options.maxQuestions}\n\n`;
    
    prompt += `**INSTRUCTIONS SPÉCIFIQUES :**\n`;
    prompt += `- Évite les questions déjà traitées dans l'historique\n`;
    prompt += `- Adapte la complexité au niveau de l'utilisateur\n`;
    prompt += `- Inclut des indices contextuels si demandé\n`;
    prompt += `- Propose des questions qui favorisent l'apprentissage actif\n\n`;
    
    if (documentContext.extractedText) {
      prompt += `**EXTRAIT DU DOCUMENT :**\n${documentContext.extractedText.slice(0, 2000)}...\n\n`;
    }
    
    prompt += `Génère maintenant les questions au format JSON demandé.`;
    
    return prompt;
  }

  /**
   * Filtre et ordonne les questions
   */
  private filterAndRankQuestions(
    questions: SuggestedQuestion[],
    options: QuestionGenerationOptions
  ): SuggestedQuestion[] {
    let filtered = [...questions];

    // Filtrer par catégories
    if (options.categories?.length) {
      filtered = filtered.filter(q => options.categories!.includes(q.category));
    }

    // Filtrer par complexité
    if (options.complexityRange) {
      const [min, max] = options.complexityRange;
      filtered = filtered.filter(q => 
        q.estimatedComplexity >= min && q.estimatedComplexity <= max
      );
    }

    // Éviter les doublons
    const seenTexts = new Set<string>();
    filtered = filtered.filter(q => {
      const normalizedText = q.text.toLowerCase().trim();
      if (seenTexts.has(normalizedText)) return false;
      seenTexts.add(normalizedText);
      return true;
    });

    // Trier par priorité et pertinence
    filtered.sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityScore[a.priority];
      const bPriority = priorityScore[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Plus haute priorité d'abord
      }
      
      // En cas d'égalité, favoriser les questions de complexité moyenne
      const aComplexity = Math.abs(a.estimatedComplexity - 3);
      const bComplexity = Math.abs(b.estimatedComplexity - 3);
      return aComplexity - bComplexity;
    });

    return filtered;
  }

  /**
   * Extrait les sujets et thèmes
   */
  private extractTopics(documentAnalysis: any, historyAnalysis: any): string[] {
    const topics: string[] = [];
    
    if (documentAnalysis.mainTopics) {
      topics.push(...documentAnalysis.mainTopics);
    }
    
    if (documentAnalysis.keyConcepts) {
      topics.push(...documentAnalysis.keyConcepts.slice(0, 5)); // Limiter
    }
    
    if (historyAnalysis.interests) {
      topics.push(...historyAnalysis.interests);
    }
    
    // Éliminer les doublons
    return [...new Set(topics)];
  }

  /**
   * Fallback : extraction basique de sujets
   */
  private extractBasicTopics(text: string): any {
    const words = text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4)
      .slice(0, 20);
    
    return {
      mainTopics: words.slice(0, 5),
      keyConcepts: words.slice(5, 10),
      difficulty: 'intermediate',
      documentType: 'texte',
      structure: []
    };
  }

  /**
   * Fallback : analyse basique de l'historique
   */
  private extractBasicHistoryInfo(history: ChatMessage[]): any {
    const userMessages = history.filter(msg => msg.role === 'user');
    const questions = userMessages.map(msg => msg.content).slice(0, 5);
    
    return {
      topicsDiscussed: [],
      userQuestions: questions,
      difficultyLevel: 3,
      knowledgeGaps: [],
      interests: []
    };
  }

  /**
   * Fallback : questions génériques
   */
  private generateFallbackQuestions(
    documentContext: DocumentContext,
    options: QuestionGenerationOptions
  ): QuestionGenerationResult {
    const genericQuestions: SuggestedQuestion[] = [
      {
        id: `fallback-${Date.now()}-1`,
        text: `Quels sont les points principaux de ${documentContext.documentName} ?`,
        category: 'synthèse',
        priority: 'high',
        estimatedComplexity: 2,
        keywords: ['principaux', 'essentiel', 'résumé']
      },
      {
        id: `fallback-${Date.now()}-2`,
        text: `Pouvez-vous m'expliquer les concepts clés de ce document ?`,
        category: 'clarification',
        priority: 'high',
        estimatedComplexity: 3,
        keywords: ['concepts', 'explication', 'définition']
      },
      {
        id: `fallback-${Date.now()}-3`,
        text: `Comment puis-je appliquer ces connaissances en pratique ?`,
        category: 'application',
        priority: 'medium',
        estimatedComplexity: 4,
        keywords: ['application', 'pratique', 'mise en œuvre']
      }
    ];

    return {
      questions: genericQuestions.slice(0, options.maxQuestions || 3),
      metadata: {
        documentAnalyzed: false,
        contextUsed: false,
        userHistoryAnalyzed: false,
        generationTime: 100,
        topicsIdentified: []
      }
    };
  }

  /**
   * Met à jour les questions basées sur l'interaction utilisateur
   */
  async updateQuestionsBasedOnFeedback(
    currentQuestions: SuggestedQuestion[],
    userSelection: string,
    feedback?: 'helpful' | 'not_helpful'
  ): Promise<SuggestedQuestion[]> {
    // Analyser la sélection pour générer des questions plus pertinentes
    const selectedQuestion = currentQuestions.find(q => q.id === userSelection);
    
    if (!selectedQuestion) return currentQuestions;

    // Générer des questions similaires ou d'approfondissement
    const newQuestions = await this.generateFollowUpQuestions(selectedQuestion);
    
    // Mettre à jour la liste
    const updatedQuestions = currentQuestions.filter(q => q.id !== userSelection);
    updatedQuestions.push(...newQuestions);
    
    return this.filterAndRankQuestions(updatedQuestions, this.DEFAULT_OPTIONS);
  }

  /**
   * Génère des questions de suivi
   */
  private async generateFollowUpQuestions(
    baseQuestion: SuggestedQuestion
  ): Promise<SuggestedQuestion[]> {
    const followUpCategories: SuggestedQuestion['category'][] = {
      'clarification': ['approfondissement', 'application'],
      'approfondissement': ['application', 'comparaison'],
      'application': ['synthèse', 'comparaison'],
      'synthèse': ['application', 'clarification'],
      'comparaison': ['synthèse', 'approfondissement']
    };

    // Implémentation simple - pourrait être enrichie avec GPT
    return [
      {
        id: `followup-${Date.now()}-1`,
        text: `Pouvez-vous donner un exemple concret de "${baseQuestion.text}" ?`,
        category: 'application',
        priority: 'medium',
        estimatedComplexity: baseQuestion.estimatedComplexity + 1,
        keywords: ['exemple', 'concret', 'pratique']
      }
    ];
  }
}

// Instance singleton
export const suggestedQuestionsService = new SuggestedQuestionsService();

// Export des fonctions utilitaires
export const generateSuggestedQuestions = (
  documentContext: DocumentContext,
  conversationHistory?: ChatMessage[],
  options?: QuestionGenerationOptions
) => suggestedQuestionsService.generateSuggestedQuestions(documentContext, conversationHistory, options);

export const updateQuestionsBasedOnFeedback = (
  currentQuestions: SuggestedQuestion[],
  userSelection: string,
  feedback?: 'helpful' | 'not_helpful'
) => suggestedQuestionsService.updateQuestionsBasedOnFeedback(currentQuestions, userSelection, feedback);
