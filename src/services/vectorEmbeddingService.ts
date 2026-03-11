/**
 * Service d'embeddings vectoriels pour RAG avancé
 * Utilise OpenAI embeddings et pgvector pour recherche sémantique
 * 
 * Date: 10 mars 2026
 */

import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

// Configuration
const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions
const MAX_CHUNK_SIZE = 1000; // Caractères par chunk
const CHUNK_OVERLAP = 200; // Caractères de chevauchement

// Types
export interface DocumentChunk {
  chunkIndex: number;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface EmbeddedChunk extends DocumentChunk {
  id: string;
  embedding: number[];
  documentId: string;
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  chunkText: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

export interface EnhancedCitation {
  id: string;
  documentId: string;
  documentName: string;
  excerpt: string;
  context?: string;
  relevanceScore: number;
  similarityScore: number;
  positionStart?: number;
  positionEnd?: number;
  metadata?: Record<string, unknown>;
}

// Client OpenAI pour embeddings
const getOpenAIClient = () => {
  const apiKey = import.meta.env?.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Clé OpenAI manquante pour les embeddings');
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
};

/**
 * Divise un document en chunks pour embeddings
 */
export function createDocumentChunks(
  text: string, 
  options: {
    maxChunkSize?: number;
    overlap?: number;
    preserveParagraphs?: boolean;
  } = {}
): DocumentChunk[] {
  const {
    maxChunkSize = MAX_CHUNK_SIZE,
    overlap = CHUNK_OVERLAP,
    preserveParagraphs = true
  } = options;

  const chunks: DocumentChunk[] = [];
  
  if (preserveParagraphs) {
    // Division par paragraphes d'abord
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      
      if (!trimmedParagraph) continue;

      // Si le paragraphe seul est trop grand, le diviser
      if (trimmedParagraph.length > maxChunkSize) {
        // Sauvegarder le chunk en cours
        if (currentChunk) {
          chunks.push({
            chunkIndex: chunkIndex++,
            text: currentChunk.trim(),
            metadata: { type: 'paragraph' }
          });
          currentChunk = '';
        }

        // Diviser le grand paragraphe
        const sentences = trimmedParagraph.split(/[.!?]+/);
        let sentenceChunk = '';

        for (const sentence of sentences) {
          const trimmedSentence = sentence.trim();
          if (!trimmedSentence) continue;

          if ((sentenceChunk + trimmedSentence).length > maxChunkSize) {
            if (sentenceChunk) {
              chunks.push({
                chunkIndex: chunkIndex++,
                text: sentenceChunk.trim(),
                metadata: { type: 'sentence_split' }
              });
            }
            sentenceChunk = trimmedSentence + '. ';
          } else {
            sentenceChunk += trimmedSentence + '. ';
          }
        }

        if (sentenceChunk) {
          chunks.push({
            chunkIndex: chunkIndex++,
            text: sentenceChunk.trim(),
            metadata: { type: 'sentence_split' }
          });
        }
      } else {
        // Vérifier si on peut ajouter ce paragraphe au chunk actuel
        if ((currentChunk + '\n\n' + trimmedParagraph).length > maxChunkSize) {
          if (currentChunk) {
            chunks.push({
              chunkIndex: chunkIndex++,
              text: currentChunk.trim(),
              metadata: { type: 'paragraph' }
            });
          }
          currentChunk = trimmedParagraph;
        } else {
          if (currentChunk) {
            currentChunk += '\n\n' + trimmedParagraph;
          } else {
            currentChunk = trimmedParagraph;
          }
        }
      }
    }

    // Dernier chunk
    if (currentChunk) {
      chunks.push({
        chunkIndex: chunkIndex++,
        text: currentChunk.trim(),
        metadata: { type: 'paragraph' }
      });
    }
  } else {
    // Division simple par taille avec chevauchement
    for (let i = 0; i < text.length; i += maxChunkSize - overlap) {
      const chunk = text.slice(i, i + maxChunkSize);
      if (chunk.trim()) {
        chunks.push({
          chunkIndex: Math.floor(i / (maxChunkSize - overlap)),
          text: chunk.trim(),
          metadata: { type: 'size_based', start: i, end: i + maxChunkSize }
        });
      }
    }
  }

  return chunks;
}

/**
 * Génère des embeddings pour un texte avec OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const openai = getOpenAIClient();
    
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Erreur génération embedding:', error);
    throw new Error(`Échec de la génération d'embedding: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Génère des embeddings pour plusieurs chunks en batch
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const openai = getOpenAIClient();
    
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      encoding_format: 'float',
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Erreur génération embeddings batch:', error);
    throw new Error(`Échec de la génération d'embeddings: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Stocke les embeddings d'un document dans Supabase
 */
export async function storeDocumentEmbeddings(
  documentId: string,
  chunks: DocumentChunk[]
): Promise<EmbeddedChunk[]> {
  try {
    console.log(`🔄 Génération embeddings pour ${chunks.length} chunks...`);
    
    // Extraire les textes pour traitement batch
    const texts = chunks.map(chunk => chunk.text);
    
    // Générer les embeddings en batch
    const embeddings = await generateBatchEmbeddings(texts);
    
    // Préparer les données pour Supabase
    const chunkData = chunks.map((chunk, index) => ({
      chunk_index: chunk.chunkIndex,
      chunk_text: chunk.text,
      embedding: `[${embeddings[index].join(',')}]`, // Format pour pgvector
      metadata: chunk.metadata || {}
    }));

    // Insérer via RPC
    const { data, error } = await supabase.rpc('insert_document_chunks', {
      p_document_id: documentId,
      p_chunks: chunkData
    });

    if (error) {
      console.error('Erreur insertion embeddings:', error);
      throw error;
    }

    console.log(`✅ ${data} embeddings stockés avec succès`);
    
    // Retourner les chunks avec embeddings
    return chunks.map((chunk, index) => ({
      ...chunk,
      id: `${documentId}_${chunk.chunkIndex}`,
      embedding: embeddings[index],
      documentId
    }));
  } catch (error) {
    console.error('Erreur stockage embeddings:', error);
    throw error;
  }
}

/**
 * Recherche les chunks les plus pertinents pour une requête
 */
export async function searchRelevantChunks(
  query: string,
  options: {
    documentId?: string;
    limit?: number;
    similarityThreshold?: number;
  } = {}
): Promise<SearchResult[]> {
  try {
    const {
      documentId,
      limit = 5,
      similarityThreshold = 0.7
    } = options;

    console.log(`🔍 Recherche de chunks pertinents pour: "${query.slice(0, 50)}..."`);
    
    // Générer l'embedding de la requête
    const queryEmbedding = await generateEmbedding(query);
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // Rechercher les chunks similaires via RPC
    const { data, error } = await supabase.rpc('search_similar_chunks_rpc', {
      query_embedding: embeddingString,
      document_id_param: documentId,
      limit_count: limit,
      similarity_threshold: similarityThreshold
    });

    if (error) {
      console.error('Erreur recherche chunks:', error);
      throw error;
    }

    console.log(`✅ ${data.length} chunks pertinents trouvés`);
    
    return data.map((item: {
      chunk_id: string;
      document_id: string;
      chunk_index: number;
      chunk_text: string;
      similarity: number;
      metadata: Record<string, unknown>;
    }) => ({
      chunkId: item.chunk_id,
      documentId: item.document_id,
      chunkIndex: item.chunk_index,
      chunkText: item.chunk_text,
      similarity: item.similarity,
      metadata: item.metadata
    }));
  } catch (error) {
    console.error('Erreur recherche pertinente:', error);
    throw error;
  }
}

/**
 * Génère des citations avancées avec scores de pertinence
 */
export async function generateEnhancedCitations(
  query: string,
  searchResults: SearchResult[],
  documentNames: Record<string, string> = {}
): Promise<EnhancedCitation[]> {
  try {
    const citations: EnhancedCitation[] = [];

    for (const result of searchResults) {
      // Calculer le score de pertinence (combinaison similarité + contexte)
      const relevanceScore = calculateRelevanceScore(query, result.chunkText, result.similarity);
      
      // Extraire l'extrait le plus pertinent
      const excerpt = extractRelevantExcerpt(query, result.chunkText);
      
      // Extraire le contexte
      const context = extractContext(result.chunkText, excerpt);

      const citation: EnhancedCitation = {
        id: `${result.chunkId}_${Date.now()}`,
        documentId: result.documentId,
        documentName: documentNames[result.documentId] || `Document ${result.documentId.slice(0, 8)}`,
        excerpt,
        context,
        relevanceScore,
        similarityScore: result.similarity,
        metadata: result.metadata
      };

      citations.push(citation);

      // Sauvegarder dans la base pour optimisation future
      await saveEnhancedCitation(citation, query);
    }

    // Trier par score de pertinence
    citations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return citations;
  } catch (error) {
    console.error('Erreur génération citations avancées:', error);
    throw error;
  }
}

/**
 * Calcule un score de pertinence avancé
 */
function calculateRelevanceScore(
  query: string, 
  chunkText: string, 
  similarityScore: number
): number {
  // Extraire les mots-clés de la requête
  const queryKeywords = extractKeywords(query.toLowerCase());
  const chunkLower = chunkText.toLowerCase();

  // Score de base: similarité cosinus
  let score = similarityScore * 0.6; // 60% poids pour la similarité

  // Score de mots-clés: présence et fréquence
  let keywordScore = 0;
  queryKeywords.forEach(keyword => {
    const occurrences = (chunkLower.match(new RegExp(keyword, 'g')) || []).length;
    keywordScore += occurrences * (keyword.length > 5 ? 2 : 1); // Pondération par longueur
  });

  // Normaliser le score de mots-clés
  keywordScore = Math.min(keywordScore / (queryKeywords.length * 3), 1);
  score += keywordScore * 0.3; // 30% poids pour les mots-clés

  // Score de structure: phrases complètes
  const sentences = chunkText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const structureScore = Math.min(sentences.length / 5, 1);
  score += structureScore * 0.1; // 10% poids pour la structure

  return Math.min(score, 1); // Limiter à 1
}

/**
 * Extrait les mots-clés d'une requête
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'est', 'sont',
    'dans', 'pour', 'avec', 'par', 'que', 'qui', 'quoi', 'où', 'quand',
    'comment', 'pourquoi', 'quel', 'quelle', 'quels', 'quelles', 'ce', 'cette',
    'ces', 'cet', 'sur', 'à', 'au', 'aux', 'en', 'on', 'se', 'son', 'sa',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been'
  ]);

  return text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 10); // Limiter à 10 mots-clés
}

/**
 * Extrait l'extrait le plus pertinent d'un chunk
 */
function extractRelevantExcerpt(query: string, chunkText: string): string {
  const sentences = chunkText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const queryKeywords = extractKeywords(query.toLowerCase());

  let bestSentence = '';
  let bestScore = 0;

  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase();
    let score = 0;

    queryKeywords.forEach(keyword => {
      const occurrences = (sentenceLower.match(new RegExp(keyword, 'g')) || []).length;
      score += occurrences * (keyword.length > 5 ? 2 : 1);
    });

    // Pondérer par la longueur (pas trop court, pas trop long)
    const lengthScore = Math.min(sentence.length / 100, 1);
    score *= lengthScore;

    if (score > bestScore) {
      bestScore = score;
      bestSentence = sentence.trim();
    }
  }

  return bestSentence || chunkText.slice(0, 200) + '...';
}

/**
 * Extrait le contexte autour d'un extrait
 */
function extractContext(chunkText: string, excerpt: string): string {
  const excerptIndex = chunkText.indexOf(excerpt);
  if (excerptIndex === -1) return chunkText.slice(0, 300) + '...';

  const contextStart = Math.max(0, excerptIndex - 100);
  const contextEnd = Math.min(chunkText.length, excerptIndex + excerpt.length + 100);
  
  let context = chunkText.slice(contextStart, contextEnd);
  
  if (contextStart > 0) context = '...' + context;
  if (contextEnd < chunkText.length) context = context + '...';
  
  return context;
}

/**
 * Sauvegarde une citation avancée dans la base
 */
async function saveEnhancedCitation(
  citation: EnhancedCitation,
  queryText: string
): Promise<void> {
  try {
    await supabase.rpc('save_enhanced_citation', {
      p_document_id: citation.documentId,
      p_chunk_id: citation.id.split('_')[0],
      p_query_text: queryText,
      p_excerpt: citation.excerpt,
      p_context: citation.context,
      p_relevance_score: citation.relevanceScore,
      p_similarity_score: citation.similarityScore,
      p_position_start: citation.positionStart,
      p_position_end: citation.positionEnd,
      p_metadata: citation.metadata || {}
    });
  } catch (error) {
    console.warn('⚠️ Erreur sauvegarde citation:', error);
    // Ne pas bloquer le flux principal
  }
}

/**
 * Formate les citations avancées pour l'affichage
 */
export function formatEnhancedCitations(citations: EnhancedCitation[]): string {
  if (citations.length === 0) {
    return '';
  }

  let citationsText = '\n\n📚 **Sources et références avancées**:\n\n';

  citations.forEach((citation, index) => {
    citationsText += `${index + 1}. **${citation.documentName}**`;
    
    // Ajouter les scores
    if (citation.relevanceScore > 0.8) {
      citationsText += ' 🔥';
    } else if (citation.relevanceScore > 0.6) {
      citationsText += ' ⭐';
    }
    
    citationsText += ` (Pertinence: ${(citation.relevanceScore * 100).toFixed(1)}%, Similarité: ${(citation.similarityScore * 100).toFixed(1)}%)\n`;
    citationsText += `   > "${citation.excerpt}"\n`;
    
    // Ajouter le contexte si disponible
    if (citation.context && citation.context !== citation.excerpt) {
      citationsText += `   _Contexte: ${citation.context}_\n`;
    }
    
    citationsText += '\n';
  });

  citationsText += '---\n*Les citations sont classées par ordre de pertinence avec scores de similarité vectorielle*';

  return citationsText;
}

/**
 * Met à jour les embeddings d'un document
 */
export async function updateDocumentEmbeddings(documentId: string, text: string): Promise<void> {
  try {
    console.log(`🔄 Mise à jour embeddings pour document ${documentId}`);
    
    // Créer les chunks
    const chunks = createDocumentChunks(text);
    
    // Stocker les nouveaux embeddings
    await storeDocumentEmbeddings(documentId, chunks);
    
    console.log(`✅ Embeddings mis à jour avec succès`);
  } catch (error) {
    console.error('Erreur mise à jour embeddings:', error);
    throw error;
  }
}
