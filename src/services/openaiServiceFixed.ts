/**
 * Service OpenAI amélioré avec cohérence et fallback gracieux
 * Version corrigée pour éviter les erreurs de syntaxe
 * 
 * Date: 6 mars 2025
 */

import OpenAI from 'openai';
import { searchWeb } from './webSearch';
import { enrichResponseWithCitations, type Citation } from './citationService';
import { 
  chunkDocument, 
  selectRelevantChunks, 
  buildChunkContext,
  type DocumentChunk,
  type ChunkingOptions 
} from './documentChunkingService';

// Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface DocumentContext {
  documentId: string;
  documentName: string;
  storagePath: string;
  extractedText: string;
  file_type?: string;
}

// Configuration OpenAI
export const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Clé OpenAI manquante. Veuillez ajouter VITE_OPENAI_API_KEY dans votre fichier .env');
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Pour utiliser dans le navigateur (dev uniquement)
  });
};

/**
 * Génère un résumé du document avec cohérence améliorée
 */
export async function summarizeDocument(
  context: DocumentContext,
  detailLevel: 'concis' | 'standard' | 'détaillé' = 'détaillé'
): Promise<string> {
  const openai = getOpenAIClient();
  
  const systemPrompt = `Tu es un expert en analyse de documents académiques.

RÈGLES FONDAMENTALES:
1. Résume UNIQUEMENT le contenu fourni
2. N'invente AUCUNE information
3. Structure claire avec titres
4. Vérifie la cohérence avant de répondre

NIVEAU DE DÉTAIL: ${detailLevel}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Document: ${context.extractedText}\n\nGénère un résumé ${detailLevel}.`
        }
      ],
      max_tokens: detailLevel === 'concis' ? 800 : detailLevel === 'standard' ? 1500 : 3000,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content || 'Impossible de générer un résumé.';
    console.log('✅ Résumé généré avec cohérence');
    return summary;
  } catch (error: any) {
    console.error('❌ Erreur génération résumé:', error);
    
    // Fallback gracieux
    if (error.code === 'insufficient_quota' || error.status === 429) {
      return `⚠️ **Service temporairement indisponible**
      
Je ne peux pas générer de résumé actuellement.

**Suggestions :**
- Réessayez dans quelques instants
- Contactez le support si le problème persiste`;
    }
    
    return `❌ **Erreur génération résumé**
      
Une erreur est survenue lors de la génération.

**Suggestions :**
- Vérifiez la connexion internet
- Réessayez avec un document plus court
- Contactez le support`;
  }
}

/**
 * Envoie un message au chat avec cohérence améliorée et chunking
 */
export async function sendChatMessage(
  message: string,
  context: DocumentContext,
  conversationHistory: ChatMessage[],
  options?: {
    useWebSearch?: boolean;
    detailLevel?: 'concis' | 'standard' | 'détaillé';
    includeCitations?: boolean;
    enableChunking?: boolean;
    maxChunks?: number;
  }
): Promise<{ response: string; citations?: Citation[] }> {
  try {
    console.log('💬 ===== ENVOI MESSAGE CHAT (VERSION COHÉRENCE) =====');
    console.log('  - Message utilisateur:', message);
    console.log('  - Document ID:', context.documentId);
    console.log('  - Chunking:', options?.enableChunking ? 'Activé' : 'Désactivé');
    
    // Gestion du chunking pour documents longs
    let contextText = context.extractedText || '';
    let chunks: DocumentChunk[] = [];
    
    if (options?.enableChunking && contextText.length > 8000) {
      console.log('🔪 Activation du chunking pour document long');
      
      const chunkingOptions: ChunkingOptions = {
        maxChunkSize: 4000,
        minChunkSize: 500,
        overlapSize: 200,
        strategy: 'semantic',
        preserveContext: true,
        generateSummaries: true,
        extractKeywords: true
      };
      
      const chunkingResult = await chunkDocument(
        context.documentId,
        contextText,
        chunkingOptions
      );
      
      chunks = chunkingResult.chunks;
      console.log(`  - Document divisé en ${chunks.length} chunks`);
    }
    
    // Sélection des chunks pertinents
    let selectedChunks: DocumentChunk[] = [];
    let contextForPrompt = contextText;
    
    if (chunks.length > 0) {
      selectedChunks = selectRelevantChunks(chunks, message, options?.maxChunks || 5);
      contextForPrompt = selectedChunks
        .map(chunk => `CHUNK ${chunk.chunkIndex + 1}:\n${chunk.content}`)
        .join('\n\n---\n\n');
      
      console.log(`  - ${selectedChunks.length} chunks sélectionnés pour le contexte`);
    }
    
    // Vérification du contexte
    if (!contextForPrompt || contextForPrompt.trim() === '') {
      throw new Error('Le texte du document est vide ou non disponible.');
    }
    
    const openai = getOpenAIClient();

    // Construction du prompt système avec cohérence
    const systemPrompt = `Tu es un assistant expert spécialisé dans l'analyse de documents. 

RÈGLES FONDAMENTALES:
1. Réponds UNIQUEMENT en te basant sur le contexte fourni
2. N'invente AUCUNE information qui n'est pas dans le document
3. Si tu ne connais pas la réponse, dis-le clairement
4. Cite les sources spécifiques quand tu utilises une information
5. Évite les généralisations abusives
6. Vérifie la cohérence de ta réponse avant de l'envoyer

${chunks.length > 0 ? `
CONTEXTE DOCUMENTAIRE:
Le document a été divisé en ${chunks.length} sections optimisées.
Utilise ces sections pour répondre précisément à la question.
Pour chaque information importante, cite la section source (CHUNK X).` : ''}

NIVEAU DE DÉTAIL: ${options?.detailLevel || 'détaillé'}`;

    // Ajout des instructions selon le niveau
    switch (options?.detailLevel || 'détaillé') {
      case 'concis':
        systemPrompt += `\n\nRéponds de manière CONCISE et DIRECTE (max 800 tokens).
Sois factuel, précis et va droit au but.
Vérifie chaque information avant de l'inclure.`;
        break;
        
      case 'standard':
        systemPrompt += `\n\nRéponds de manière ÉQUILIBRÉE avec des explications CLAIRES (max 1500 tokens).
Inclus des exemples pertinents quand c'est utile.
Vérifie la cohérence de ta réponse avec le contexte.`;
        break;
        
      case 'détaillé':
        systemPrompt += `\n\nRéponds de manière EXHAUSTIVE et APPROFONDIE (max 3000 tokens).
Fournis des détails complets, des nuances et des analyses approfondies.
Pour chaque affirmation importante, cite la section source spécifique.
Vérifie systématiquement la cohérence des informations.`;
        break;
    }

    // Construction des messages
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `QUESTION: ${message}

CONTEXTE DOCUMENTAIRE:
${contextForPrompt}

INSTRUCTIONS:
Réponds en te basant UNIQUEMENT sur les informations fournies ci-dessus.
Si une information n'est pas dans le contexte, dis-le clairement.
Vérifie la cohérence de ta réponse avant de l'envoyer.`
      }
    ];

    // Appel API OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: options?.detailLevel === 'concis' ? 800 : options?.detailLevel === 'standard' ? 1500 : 3000,
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0.3,
      presence_penalty: 0.3,
    });

    let response = completion.choices[0]?.message?.content || 'Désolé, je ne peux pas répondre à cette question.';
    
    // Enrichissement avec citations si demandé
    let citations: Citation[] | undefined;
    if (options?.includeCitations && contextForPrompt) {
      citations = await enrichResponseWithCitations(response, contextForPrompt, context.documentName);
      response = response;
    }

    console.log('✅ Réponse générée avec cohérence');
    console.log(`📊 Longueur de la réponse: ${response.length} caractères`);
    
    return { response, citations };

  } catch (error: any) {
    console.error('❌ Erreur OpenAI:', error);
    
    // Fallback gracieux en cas d'erreur API
    if (error.code === 'insufficient_quota' || error.status === 429) {
      return {
        response: `⚠️ **Service temporairement indisponible**
        
Je suis actuellement confronté à une forte demande et ne peux pas traiter votre demande immédiatement.

**Suggestions :**
- Réessayez dans quelques instants
- Simplifiez votre question
- Contactez le support si le problème persiste

**Message original :** ${message}`
      };
    }
    
    if (error.code === 'invalid_request' && error.message?.includes('maximum')) {
      return {
        response: `⚠️ **Question trop complexe**
        
Votre question dépasse les limites de traitement actuelles.

**Suggestions :**
- Divisez votre question en parties plus simples
- Soyez plus spécifique
- Utilisez le niveau de détail "Concis"`

**Message original :** ${message}`
      };
    }
    
    if (error.message?.includes('timeout')) {
      return {
        response: `⚠️ **Délai d'attente dépassé**
        
Le traitement a pris trop de temps.

**Suggestions :**
- Réessayez avec une question plus courte
- Vérifiez votre connexion internet
- Contactez le support si le problème persiste

**Message original :** ${message}`
      };
    }
    
    // Erreur générique avec fallback utile
    return {
      response: `❌ **Une erreur est survenue**
      
Je ne peux pas traiter votre demande actuellement.

**Causes possibles :**
- Service temporairement indisponible
- Question trop complexe
- Document trop volumineux

**Suggestions :**
- Réessayez dans quelques instants
- Simplifiez votre question
- Contactez le support si le problème persiste

**Message original :** ${message}

**Détails techniques :** ${error.message || 'Erreur inconnue'}`
    };
  }
}

/**
 * Analyse un document uploadé
 */
export async function analyzeUploadedDocument(file: File): Promise<string> {
  try {
    console.log('📎 Analyse du fichier uploadé:', file.name);

    if (file.type !== 'application/pdf') {
      throw new Error('Seuls les fichiers PDF sont supportés pour l\'instant.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    console.log('✅ Analyse terminée');
    console.log(`📊 Pages analysées: ${Math.min(pdf.numPages, 10)}`);
    console.log(`📊 Longueur du texte: ${fullText.length} caractères`);

    return fullText;

  } catch (error: any) {
    console.error('❌ Erreur analyse document:', error);
    
    // Fallback gracieux
    if (error.message?.includes('Invalid PDF')) {
      throw new Error('Le fichier PDF semble corrompu ou invalide. Veuillez vérifier le fichier et réessayer.');
    }
    
    if (error.message?.includes('network')) {
      throw new Error('Erreur de connexion lors de l\'analyse du document. Veuillez vérifier votre connexion internet et réessayer.');
    }
    
    throw new Error(`Erreur lors de l'analyse du document: ${error.message || 'Erreur inconnue'}`);
  }
}
