/**
 * Service OpenAI avec support du proxy pour éviter CORS
 * VERSION AMÉLIORÉE : Réponses détaillées et enrichies
 * 
 * Configuration :
 * - Par défaut : Utilise Supabase directement
 * - Si CORS bloque : Utilise le proxy local (localhost:3001)
 * 
 * RÈGLE IMPORTANTE : Utilise TOUJOURS storage_path (pas le nom d'affichage)
 * pour éviter les erreurs "Invalid key" liées aux accents
 * 
 * NOUVEAUTÉS v2.0 :
 * - Prompts système détaillés pour réponses exhaustives
 * - Niveaux de détail configurables (concis, standard, détaillé)
 * - Support de la recherche web optionnelle (Tavily/Serper)
 * - Résumés structurés et approfondis
 * - Modèle GPT-4o-mini pour meilleure qualité
 * 
 * Date: 31 décembre 2024
 */

import OpenAI from 'openai';
import { searchWeb } from './webSearch';
import { enrichResponseWithCitations, type Citation } from './citationService';
import type { EnhancedCitation } from './vectorEmbeddingService';
import { podcastGenerator } from './podcastGenerator';
import { 
  chunkDocument, 
  selectRelevantChunks, 
  type DocumentChunk,
  type ChunkingOptions 
} from './documentChunkingService';

// Configuration du proxy (activer si CORS bloque) - Désactivé
// const USE_PROXY = false;
// const PROXY_URL = 'http://localhost:3001';

// Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  citations?: any[]; // Citations associées au message
}

export interface ChatOptions {
  useWebSearch?: boolean;
  detailLevel?: 'concis' | 'standard' | 'détaillé';
  includeCitations?: boolean;
  enableChunking?: boolean;
  maxChunks?: number;
  useAdvancedRAG?: boolean;
}

export interface StreamingChatOptions extends ChatOptions {
  enableStreaming?: boolean;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  chunkDelay?: number;
  typewriterSpeed?: number;
}

export interface DocumentContext {
  documentId: string;
  documentName: string; // Pour l'affichage uniquement (nom avec accents)
  storagePath: string; // Pour accéder au fichier (chemin nettoyé)
  extractedText?: string;
}

// Configuration OpenAI
export const getOpenAIClient = () => {
  const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Clé OpenAI manquante. Veuillez ajouter VITE_OPENAI_API_KEY dans votre fichier .env');
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Pour utiliser dans le navigateur (dev uniquement)
  });
};

/**
 * Extrait le texte d'un PDF depuis Supabase Storage
 * UTILISE storage_path (pas le nom d'affichage)
 * 
 * Note: Cette fonction utilise maintenant le service pdfExtractor
 * qui gère nativement le téléchargement depuis Supabase Storage
 */
export async function extractPDFText(storagePath: string): Promise<string> {
  try {
    console.log('📄 Extraction PDF via pdfExtractor service...');
    
    // Utiliser le service dédié d'extraction PDF
    const { extractPDFFromStorage } = await import('./pdfExtractor');
    const result = await extractPDFFromStorage(storagePath);
    
    console.log('✅ Texte extrait avec succès:', result.metadata);
    return result.cleanText; // Retourner le texte nettoyé

  } catch (error: any) {
    console.error('💥 Erreur lors de l\'extraction du texte:', error);
    throw new Error(`Échec de l'extraction du texte: ${error.message}`);
  }
}

/**
 * Génère un résumé DÉTAILLÉ du document avec OpenAI
 * VERSION AMÉLIORÉE : Résumés plus complets et structurés
 */
export async function summarizeDocument(
  documentText: string, 
  documentName: string,
  options?: {
    detailLevel?: 'bref' | 'standard' | 'exhaustif';
  }
): Promise<string> {
  try {
    console.log('🤖 ===== GÉNÉRATION RÉSUMÉ AMÉLIORÉ =====');
    console.log('  - Document:', documentName);
    console.log('📄 Texte récupéré:', documentText ? `${documentText.length} caractères` : 'NULL/VIDE');
    
    // ✅ VÉRIFICATION : Le texte doit exister
    if (!documentText || documentText.trim() === '') {
      throw new Error(
        `Erreur : Le texte de ce cours n'a pas encore été extrait.\n\n` +
        `Document : "${documentName}"\n\n` +
        `Veuillez patienter quelques secondes et réessayer.`
      );
    }
    
    const openai = getOpenAIClient();

    // Déterminer le niveau de détail
    const detailLevel = options?.detailLevel || 'exhaustif';
    const maxTokens = detailLevel === 'bref' ? 800 : detailLevel === 'standard' ? 1500 : 2500;
    
    // Utiliser plus de texte pour un résumé plus riche
    const maxInputLength = detailLevel === 'bref' ? 15000 : detailLevel === 'standard' ? 25000 : 40000;
    const truncatedText = documentText.slice(0, maxInputLength);
    console.log('  - Texte tronqué pour OpenAI:', truncatedText.length, 'caractères');
    console.log('  - Niveau de détail:', detailLevel);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modèle plus performant
      messages: [
        {
          role: 'system',
          content: `Tu es un assistant pédagogique expert spécialisé dans la synthèse de documents académiques. 
Tu dois analyser le document "${documentName}" et en fournir un résumé DÉTAILLÉ, STRUCTURÉ et PÉDAGOGIQUE.`
        },
        {
          role: 'user',
          content: `📚 Analyse ce document "${documentName}" et génère un résumé ${detailLevel === 'bref' ? 'concis' : detailLevel === 'standard' ? 'équilibré' : 'EXHAUSTIF et DÉTAILLÉ'}.

${detailLevel === 'exhaustif' ? `
🎯 STRUCTURE REQUISE (résumé exhaustif) :

## 📖 Vue d'Ensemble
- Résumé en 2-3 phrases
- Objectif principal du document

## 🔑 Points Clés Principaux
- Liste détaillée des points essentiels (au moins 5-8 points)
- Développe chaque point avec explications

## 💡 Concepts Importants
- Liste et explique tous les concepts majeurs
- Donne des définitions claires
- Fais des liens entre les concepts

## 📊 Informations Détaillées
- Données chiffrées importantes
- Formules ou équations clés
- Méthodologies mentionnées

## 🌐 Contexte et Applications
- Dans quel contexte ce document s'inscrit-il ?
- Quelles sont les applications pratiques ?
- Qui est concerné par ces informations ?

## 📌 Points À Retenir Absolument
- Les 5-10 éléments ESSENTIELS à mémoriser
- Ce qu'il ne faut surtout pas oublier

## 💪 Suggestions d'Approfondissement
- Quels sujets connexes explorer ?
- Quelles questions se poser pour aller plus loin ?

## ✅ Conclusion
- Synthèse finale
- Importance de ce document
` : detailLevel === 'standard' ? `
🎯 STRUCTURE REQUISE (résumé standard) :

## 📖 Résumé
- Vue d'ensemble en quelques phrases

## 🔑 Points Clés (4-6 points)
- Les éléments essentiels

## 💡 Concepts (3-4 concepts)
- Définitions et explications

## 📌 Points à Retenir (3-5 points)
- Les éléments les plus importants

## ✅ Conclusion
- Synthèse finale
` : `
🎯 STRUCTURE REQUISE (résumé bref) :

## 📖 Résumé
- Vue d'ensemble en 1-2 phrases

## 🔑 Points Clés (2-3 points)
- Les éléments absolument essentiels

## ✅ Conclusion
- Synthèse ultra-brève
`}

DOCUMENT À ANALYSER :
${truncatedText}

Génère maintenant le résumé structuré en suivant EXACTEMENT cette structure.`
        }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 0.95,
      frequency_penalty: 0.3,
      presence_penalty: 0.3
    });

    const summary = completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer de résumé.';
    console.log('✅ Résumé généré avec succès:', summary.slice(0, 100) + '...');
    return summary;

  } catch (error: any) {
    console.error('💥 Erreur lors de la génération du résumé:', error);
    
    if (error.code === 'insufficient_quota') {
      return `❌ **Quota OpenAI épuisé**

Veuillez vérifier votre compte OpenAI et ajouter des crédits pour continuer à utiliser cette fonctionnalité.`;
    }
    
    if (error.code === 'invalid_api_key') {
      return `❌ **Clé API OpenAI invalide**

Veuillez vérifier votre configuration OpenAI dans les variables d'environnement.`;
    }
    
    // Erreur générique avec fallback utile
    return `❌ **Une erreur est survenue**
      
Je ne peux pas générer de résumé actuellement.

**Causes possibles :**
- Service temporairement indisponible
- Document trop volumineux
- Erreur de format

**Suggestions :**
- Réessayez dans quelques instants
- Simplifiez le document si possible
- Contactez le support si le problème persiste`;
  }
}

/**
 * Envoie un message à l'API OpenAI avec le contexte du document
 * VERSION AMÉLIORÉE : Réponses plus détaillées et enrichies
 */
export async function sendChatMessage(
  message: string,
  context: DocumentContext,
  options?: ChatOptions
): Promise<{ response: string; citations?: Citation[] | EnhancedCitation[] }> {
  try {
    console.log('💬 ===== ENVOI MESSAGE CHAT (VERSION AMÉLIORÉE) =====');
    console.log('  - Message utilisateur:', message);
    console.log('  - Document ID:', context.documentId);
    console.log('  - Document Name:', context.documentName);
    console.log('  - Storage Path:', context.storagePath);
    console.log('  - Niveau de détail:', options?.detailLevel || 'détaillé');
    console.log('  - Recherche web:', options?.useWebSearch ? 'Activée' : 'Désactivée');
    console.log('  - Chunking:', options?.enableChunking ? 'Activé' : 'Désactivé');
    
    // Gestion du chunking pour documents longs
    const contextText = context.extractedText || '';
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
      console.log(`  - Taille moyenne: ${Math.round(chunkingResult.metadata.averageChunkSize)} caractères`);
    }
    
    // Sélection des chunks les plus pertinents
    let selectedChunks: DocumentChunk[] = [];
    let contextForPrompt = contextText;
    
    if (chunks.length > 0) {
      selectedChunks = selectRelevantChunks(chunks, message, options?.maxChunks || 5);
      contextForPrompt = selectedChunks
        .map(chunk => `CHUNK ${chunk.chunkIndex + 1}:\n${chunk.content}`)
        .join('\n\n---\n\n');
      
      console.log(`  - ${selectedChunks.length} chunks sélectionnés pour le contexte`);
    }
    
    // ✅ VÉRIFICATION 2 : Le texte doit être disponible (FALLBACK)
    if (!contextForPrompt || contextForPrompt.trim() === '') {
      console.error('❌ Le texte extrait est vide ou NULL');
      console.error('   Storage Path utilisé:', context.storagePath);
      throw new Error(
        `Erreur : Le texte de ce cours n'a pas encore été extrait.\n\n` +
        `Document : "${context.documentName}"\n` +
        `Fichier identifié : ${context.storagePath}\n\n` +
        `Veuillez patienter quelques secondes et réessayer. Si le problème persiste, ` +
        `retournez à la bibliothèque et rouvrez le document.`
      );
    }

    console.log('✅ Contexte valide, texte disponible');
    console.log('  - Longueur du texte:', contextForPrompt.length);
    console.log('  - Premiers 100 caractères:', contextForPrompt.slice(0, 100) + '...');

    const openai = getOpenAIClient();

    // Déterminer le niveau de détail
    const detailLevel = options?.detailLevel || 'détaillé';
    const maxTokens = detailLevel === 'concis' ? 800 : detailLevel === 'standard' ? 1500 : 3000;

    // 🔍 Recherche web optionnelle (si activée)
    let webContext = '';
    if (options?.useWebSearch) {
      console.log('🌐 Recherche web activée...');
      try {
        // Utiliser le service de recherche web
        webContext = await searchWeb(message, context.documentName);
        console.log('✅ Recherche web terminée');
      } catch (error) {
        console.warn('⚠️ Recherche web échouée, utilisation du contexte document uniquement');
        // En cas d'erreur, utiliser le mode offline enrichment
        const { getOfflineEnrichment } = await import('./webSearch');
        webContext = getOfflineEnrichment();
      }
    }

    // Construire le systemPrompt amélioré
    const systemPrompt = `Tu es un expert en pédagogie et en synthèse de documents. Ton objectif est d'aider l'utilisateur à comprendre et à maîtriser le contenu des documents fournis.

CONSIGNE PRINCIPALE :
Génère une réponse qui permette à l'étudiant de :
1. Comprendre en profondeur les concepts clés
2. Retenir efficacement l'information essentielle  
3. Appliquer concrètement les connaissances

MÉTHODOLOGIE :
- Commence par une synthèse claire des points principaux
- Ensuite, développe chaque point avec des explications détaillées
- Ajoute des sections comme :
  - Point Clé
  - Attention
  - A Retenir
  - Approfondissement
  - Exercice Pratique
  - Contexte Plus Large

STYLE DE RÉPONSE (${detailLevel}) :
${detailLevel === 'concis' ? '- Réponse synthétique mais complète (800 tokens max)' : ''}
${detailLevel === 'standard' ? '- Réponse équilibrée avec détails et exemples (1500 tokens max)' : ''}
${detailLevel === 'détaillé' ? '- Réponse exhaustive avec explications approfondies, exemples multiples, contexte élargi (3000 tokens max)' : ''}

OBJECTIF : Rendre l'étudiant EXPERT sur le sujet abordé !`;

    // Construire les messages pour OpenAI avec prompt amélioré et cohérence
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `QUESTION: ${message}

${webContext ? `INFORMATIONS WEB SUPPLÉMENTAIRES:
${webContext}

` : ''}

CONTEXTE DOCUMENTAIRE:
${contextForPrompt}

INSTRUCTIONS:
Réponds en te basant UNIQUEMENT sur les informations fournies ci-dessus.
Si une information n'est pas dans le contexte, dis-le clairement.
Vérifie la cohérence de ta réponse avant de l'envoyer.`
      }
    ];

    console.log('🤖 Appel à OpenAI en cours avec GPT-4o-mini (mode détaillé)...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modèle plus performant pour des réponses de qualité
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 0.95,
      frequency_penalty: 0.3, // Évite les répétitions
      presence_penalty: 0.3,  // Encourage la diversité du vocabulaire
    });

    const response = completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer de réponse.';
    console.log('✅ Réponse reçue de OpenAI:', response.slice(0, 100) + '...');
    console.log(`📊 Longueur de la réponse: ${response.length} caractères`);

    // Ajouter les citations si demandé
    if (options?.includeCitations && context.extractedText) {
      console.log('🔍 Ajout des citations automatiques...');
      
      const documents = [{
        id: context.documentId,
        name: context.documentName,
        content: context.extractedText
      }];

      const citationResult = await enrichResponseWithCitations(
        response,
        documents,
        message,
        {
          useAdvancedRAG: options?.useAdvancedRAG,
          maxCitations: 5
        }
      );

      console.log(`✅ ${citationResult.citations.length} citations ajoutées`);
      return {
        response: citationResult.enrichedResponse,
        citations: citationResult.citations
      };
    }

    return {
      response,
      citations: undefined
    };
  } catch (error: any) {
    console.error('💥 Erreur lors de l\'envoi du message:', error);
    
    if (error.code === 'insufficient_quota') {
      throw new Error('Quota OpenAI épuisé. Veuillez vérifier votre compte OpenAI.');
    }
    
    throw new Error(`Erreur OpenAI: ${error.message}`);
  }
}

/**
 * Analyse un document uploadé depuis le chat (via trombone)
 */
export async function analyzeUploadedDocument(file: File): Promise<string> {
  try {
    console.log('📎 Analyse du fichier uploadé:', file.name);

    // Vérifier que c'est un PDF
    if (file.type !== 'application/pdf') {
      throw new Error('Seuls les fichiers PDF sont supportés pour l\'instant.');
    }

    // Extraire le texte du fichier
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) { // Limiter à 10 pages pour les fichiers uploadés
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    console.log('✅ Texte extrait du fichier uploadé');
    return fullText.trim();
  } catch (error: any) {
    console.error('💥 Erreur lors de l\'analyse du fichier:', error);
    throw new Error(`Impossible d'analyser le fichier: ${error.message}`);
  }
}

// === FONCTIONS TTS ET PODCAST ===

/**
 * Génère de l'audio à partir du texte avec OpenAI TTS
 */
export async function generateSpeechFromText(text: string, voice = 'nova'): Promise<ArrayBuffer> {
  try {
    console.log(`🎤 Génération audio avec OpenAI TTS - Voix: ${voice}`);
    
    const openai = getOpenAIClient();
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: voice as any,
      input: text,
      response_format: 'mp3',
      speed: 1.0,
    });

    const audioBuffer = await mp3.arrayBuffer();
    console.log('✅ Audio généré avec succès');
    return audioBuffer;
    
  } catch (error) {
    console.error('❌ Erreur génération TTS:', error);
    throw new Error(`Échec de la génération audio: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Génère un podcast complet à partir du contenu
 */
export async function generatePodcastFromContent(
  content: string, 
  options: {
    title?: string;
    duration?: number;
    style?: 'conversationnel' | 'éducatif' | 'journalistique';
    voices?: {
      host1?: 'nova' | 'alloy' | 'echo' | 'shimmer' | 'fable' | 'onyx';
      host2?: 'nova' | 'alloy' | 'echo' | 'shimmer' | 'fable' | 'onyx';
    };
  } = {}
) {
  try {
    console.log('🎙️ Début génération podcast complet...');
    
    const podcast = await podcastGenerator.generatePodcastAudio(content, {
      title: options.title || 'Podcast WordCraft IA',
      duration: options.duration || 7,
      style: options.style || 'conversationnel',
      voices: options.voices ? {
        host1: options.voices.host1 || 'nova',
        host2: options.voices.host2 || 'alloy'
      } : {
        host1: 'nova',
        host2: 'alloy'
      }
    });
    console.log('✅ Podcast généré avec succès');
    return podcast;
    
  } catch (error) {
    console.error('❌ Erreur génération podcast:', error);
    throw new Error(`Échec de la génération du podcast: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Export par défaut pour compatibilité
 */
export default {
  getOpenAIClient,
  extractPDFText,
  summarizeDocument,
  sendChatMessage,
  analyzeUploadedDocument,
  generateSpeechFromText,
  generatePodcastFromContent
};
