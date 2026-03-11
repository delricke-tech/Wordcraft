/**
 * Service de streaming pour les réponses de chat avec typewriter effect
 * Fournit une expérience utilisateur fluide avec affichage progressif
 * 
 * Date: 10 mars 2026
 */

import OpenAI from 'openai';
import { sendChatMessage, type ChatOptions, type DocumentContext } from './openaiService';
import { enrichResponseWithCitations } from './citationService';

// Types
export interface StreamingChatOptions extends ChatOptions {
  enableStreaming?: boolean;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string, citations?: any[]) => void;
  onError?: (error: Error) => void;
  chunkDelay?: number; // Millisecondes entre chunks
  typewriterSpeed?: number; // Caractères par seconde
  showProgress?: boolean;
  onProgress?: (progress: number) => void;
}

export interface StreamChunk {
  content: string;
  isComplete: boolean;
  progress: number; // 0-100
  timestamp: number;
}

export interface TypewriterConfig {
  speed: number; // caractères par seconde
  variation: number; // variation de vitesse (0.2 = 20%)
  pauses: {
    comma: number; // pause après virgule (ms)
    period: number; // pause après point (ms)
    paragraph: number; // pause après paragraphe (ms)
  };
}

// Client OpenAI
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Clé OpenAI manquante pour le streaming');
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
};

/**
 * Service principal de streaming chat
 */
export class StreamingChatService {
  private typewriterConfig: TypewriterConfig;
  private abortController?: AbortController;

  constructor() {
    this.typewriterConfig = {
      speed: 30, // 30 caractères par seconde
      variation: 0.2, // 20% de variation
      pauses: {
        comma: 200, // 200ms après virgule
        period: 400, // 400ms après point
        paragraph: 800 // 800ms après paragraphe
      }
    };
  }

  /**
   * Envoie un message avec streaming et typewriter effect
   */
  async sendMessageWithStreaming(
    message: string,
    context: DocumentContext | DocumentContext[],
    options: StreamingChatOptions = {}
  ): Promise<void> {
    const {
      enableStreaming = true,
      onChunk,
      onComplete,
      onError,
      chunkDelay = 50,
      typewriterSpeed = 30,
      showProgress = false,
      onProgress,
      ...chatOptions
    } = options;

    // Configurer le controller pour annulation
    this.abortController = new AbortController();

    try {
      console.log('📝 ===== STREAMING CHAT =====');
      console.log('  - Message:', message);
      console.log('  - Streaming:', enableStreaming);
      console.log('  - Typewriter speed:', typewriterSpeed);

      if (!enableStreaming) {
        // Mode normal sans streaming
        const result = await sendChatMessage(message, context, chatOptions);
        onComplete?.(result.response, result.citations);
        return;
      }

      // Préparer le contexte
      const contextArray = Array.isArray(context) ? context : [context];
      const contextForPrompt = await this.prepareContext(contextArray);
      
      if (!contextForPrompt) {
        throw new Error('Contexte invalide ou vide');
      }

      console.log('✅ Contexte valide, début streaming...');

      // Lancer le streaming
      await this.executeStreaming(
        message,
        contextForPrompt,
        contextArray,
        {
          onChunk,
          onComplete,
          onError,
          chunkDelay,
          typewriterSpeed,
          showProgress,
          onProgress,
          ...chatOptions
        }
      );

    } catch (error) {
      console.error('💥 Erreur streaming:', error);
      const errorObj = error instanceof Error ? error : new Error('Erreur inconnue');
      onError?.(errorObj);
      throw errorObj;
    }
  }

  /**
   * Exécute le streaming avec OpenAI
   */
  private async executeStreaming(
    message: string,
    contextForPrompt: string,
    contextArray: DocumentContext[],
    options: {
      onChunk?: (chunk: string) => void;
      onComplete?: (fullResponse: string, citations?: any[]) => void;
      onError?: (error: Error) => void;
      chunkDelay?: number;
      typewriterSpeed?: number;
      showProgress?: boolean;
      onProgress?: (progress: number) => void;
      detailLevel?: string;
      useWebSearch?: boolean;
      includeCitations?: boolean;
      useAdvancedRAG?: boolean;
    }
  ): Promise<void> {
    const {
      onChunk,
      onComplete,
      onError,
      chunkDelay = 50,
      typewriterSpeed = 30,
      showProgress = false,
      onProgress,
      detailLevel = 'détaillé',
      useWebSearch = false,
      includeCitations = false,
      useAdvancedRAG = false
    } = options;

    const openai = getOpenAIClient();
    const maxTokens = detailLevel === 'concis' ? 800 : detailLevel === 'standard' ? 1500 : 3000;

    // Construire les messages pour l'API
    const systemPrompt = this.buildSystemPrompt(detailLevel, useWebSearch);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: this.buildUserPrompt(message, contextForPrompt) }
    ];

    let fullResponse = '';
    let buffer = '';
    let totalTokens = 0;
    const estimatedTokens = maxTokens;

    // Stream OpenAI
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
      stream: true
    });

    // Traiter le stream
    for await (const chunk of stream) {
      if (this.abortController?.signal.aborted) {
        throw new Error('Stream annulé');
      }

      const content = chunk.choices[0]?.delta?.content;
      
      if (content) {
        buffer += content;
        totalTokens += content.length / 4; // Estimation tokens
        
        // Appliquer l'effet typewriter
        const typedBuffer = await this.applyTypewriterEffect(buffer, typewriterSpeed);
        
        // Envoyer le nouveau contenu
        if (typedBuffer.length > fullResponse.length) {
          const newContent = typedBuffer.slice(fullResponse.length);
          fullResponse = typedBuffer;
          
          onChunk?.(newContent);
          
          // Progression
          if (showProgress && onProgress) {
            const progress = Math.min(100, (totalTokens / estimatedTokens) * 100);
            onProgress(progress);
          }
          
          // Délai naturel entre chunks
          if (chunkDelay > 0) {
            await this.delay(chunkDelay);
          }
        }
      }
    }

    // Ajouter les citations si demandé
    if (includeCitations && contextArray[0]?.extractedText) {
      console.log('🔍 Ajout des citations après streaming...');
      
      const documents = contextArray.map(ctx => ({
        id: ctx.documentId,
        name: ctx.documentName,
        content: ctx.extractedText!
      }));

      const citationResult = await enrichResponseWithCitations(
        fullResponse,
        documents,
        message,
        {
          useAdvancedRAG,
          maxCitations: 5
        }
      );

      fullResponse = citationResult.enrichedResponse;
      onComplete?.(fullResponse, citationResult.citations);
    } else {
      onComplete?.(fullResponse);
    }

    console.log('✅ Streaming terminé');
  }

  /**
   * Applique l'effet typewriter avec variations naturelles
   */
  private async applyTypewriterEffect(
    text: string,
    baseSpeed: number
  ): Promise<string> {
    // Pour l'instant, retourne le texte directement
    // L'effet visuel sera géré par le composant React avec plus de précision
    return text;
  }

  /**
   * Calcule le délai pour le typewriter effect
   */
  private calculateTypewriterDelay(char: string, baseSpeed: number): number {
    const baseDelay = 1000 / baseSpeed; // ms par caractère
    
    // Variation naturelle
    const variation = 1 + (Math.random() - 0.5) * this.typewriterConfig.variation;
    let delay = baseDelay * variation;
    
    // Pauses pour la ponctuation
    if (char === ',') delay += this.typewriterConfig.pauses.comma;
    else if (char === '.') delay += this.typewriterConfig.pauses.period;
    else if (char === '\n') delay += this.typewriterConfig.pauses.paragraph;
    
    return Math.max(10, delay); // Minimum 10ms
  }

  /**
   * Prépare le contexte depuis les documents
   */
  private async prepareContext(contexts: DocumentContext[]): Promise<string> {
    // Implémentation simplifiée
    const validContexts = contexts.filter(ctx => ctx.extractedText);
    if (validContexts.length === 0) return '';
    
    return validContexts
      .map(ctx => `Document: ${ctx.documentName}\n${ctx.extractedText}`)
      .join('\n\n---\n\n');
  }

  /**
   * Construit le prompt système
   */
  private buildSystemPrompt(detailLevel: string, useWebSearch: boolean): string {
    let prompt = `Tu es un assistant IA expert spécialisé dans l'analyse de documents.`;
    
    if (detailLevel === 'concis') {
      prompt += ` Fournis des réponses concises et directes.`;
    } else if (detailLevel === 'standard') {
      prompt += ` Fournis des réponses équilibrées avec les informations essentielles.`;
    } else {
      prompt += ` Fournis des réponses détaillées et approfondies avec des exemples.`;
    }
    
    if (useWebSearch) {
      prompt += ` Utilise les informations de recherche web pour enrichir tes réponses.`;
    }
    
    return prompt;
  }

  /**
   * Construit le prompt utilisateur
   */
  private buildUserPrompt(message: string, context: string): string {
    return `Contexte du document:
${context}

Question: ${message}`;
  }

  /**
   * Annule le streaming en cours
   */
  cancelStreaming(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
  }

  /**
   * Utilitaire de délai
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Crée un stream simulé pour les tests
   */
  createMockStream(
    text: string,
    options: {
      chunkSize?: number;
      delay?: number;
      onChunk?: (chunk: string) => void;
      onComplete?: (fullText: string) => void;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<void> {
    const {
      chunkSize = 10,
      delay = 100,
      onChunk,
      onComplete,
      onProgress
    } = options;

    return new Promise((resolve) => {
      let index = 0;
      const totalLength = text.length;
      
      const processChunk = () => {
        if (index >= totalLength) {
          onComplete?.(text);
          onProgress?.(100);
          resolve();
          return;
        }
        
        const chunk = text.slice(index, index + chunkSize);
        onChunk?.(chunk);
        index += chunkSize;
        
        const progress = (index / totalLength) * 100;
        onProgress?.(progress);
        
        setTimeout(processChunk, delay);
      };
      
      processChunk();
    });
  }

  /**
   * Configure l'effet typewriter
   */
  configureTypewriter(config: Partial<TypewriterConfig>): void {
    this.typewriterConfig = { ...this.typewriterConfig, ...config };
  }

  /**
   * Obtient la configuration actuelle
   */
  getTypewriterConfig(): TypewriterConfig {
    return { ...this.typewriterConfig };
  }
}

// Instance singleton
export const streamingChatService = new StreamingChatService();

// Export des fonctions utilitaires
export const sendMessageWithStreaming = (
  message: string,
  context: DocumentContext | DocumentContext[],
  options: StreamingChatOptions = {}
) => streamingChatService.sendMessageWithStreaming(message, context, options);

export const cancelStreaming = () => streamingChatService.cancelStreaming();

export const createMockStream = (
  text: string,
  options?: Parameters<typeof streamingChatService.createMockStream>[1]
) => streamingChatService.createMockStream(text, options);
