/**
 * Service de gestion des citations sources
 * Permet d'extraire et de formater des citations avec références aux documents
 * VERSION AMÉLIORÉE : Support RAG avancé avec embeddings vectoriels
 * 
 * Date: 6 mars 2025
 * Mis à jour: 10 mars 2026 (RAG avancé)
 */

import { 
  searchRelevantChunks, 
  generateEnhancedCitations, 
  formatEnhancedCitations,
  updateDocumentEmbeddings,
  type SearchResult,
  type EnhancedCitation
} from './vectorEmbeddingService';

export interface Citation {
  id: string;
  documentId: string;
  documentName: string;
  excerpt: string;
  startIndex: number;
  endIndex: number;
  context: string;
  relevanceScore?: number;
}

export interface DocumentWithCitations {
  id: string;
  name: string;
  content: string;
  citations: Citation[];
}

/**
 * Extrait les citations pertinentes d'un document basé sur une question
 */
export function extractRelevantCitations(
  documentContent: string,
  documentId: string,
  documentName: string,
  question: string,
  maxCitations: number = 3
): Citation[] {
  // Nettoyer et normaliser le contenu
  const cleanContent = documentContent.replace(/\s+/g, ' ').trim();
  
  // Extraire les mots-clés de la question
  const keywords = extractKeywords(question);
  
  // Diviser le contenu en phrases
  const sentences = splitIntoSentences(cleanContent);
  
  // Calculer le score de pertinence pour chaque phrase
  const scoredSentences = sentences.map((sentence, index) => {
    const score = calculateRelevanceScore(sentence, keywords);
    return {
      sentence,
      score,
      index
    };
  });
  
  // Trier par score de pertinence
  scoredSentences.sort((a, b) => b.score - a.score);
  
  // Prendre les meilleures phrases
  const bestSentences = scoredSentences.slice(0, maxCitations);
  
  // Créer les citations
  const citations: Citation[] = bestSentences.map((item, citationIndex) => {
    const startIndex = cleanContent.indexOf(item.sentence);
    const endIndex = startIndex + item.sentence.length;
    
    // Extraire le contexte (phrase avant et après)
    const contextStart = Math.max(0, startIndex - 100);
    const contextEnd = Math.min(cleanContent.length, endIndex + 100);
    const context = cleanContent.substring(contextStart, contextEnd);
    
    return {
      id: `${documentId}_${citationIndex}`,
      documentId,
      documentName,
      excerpt: item.sentence.trim(),
      startIndex,
      endIndex,
      context: context.trim(),
      relevanceScore: item.score
    };
  });
  
  return citations.filter(citation => (citation.relevanceScore || 0) > 0.1);
}

/**
 * Extrait les mots-clés d'une question
 */
function extractKeywords(question: string): string[] {
  // Mots à ignorer (stop words)
  const stopWords = new Set([
    'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'est', 'sont', 
    'dans', 'pour', 'avec', 'par', 'que', 'qui', 'quoi', 'où', 'quand', 
    'comment', 'pourquoi', 'quel', 'quelle', 'quels', 'quelles', 'ce', 'cette',
    'ces', 'cet', 'sur', 'à', 'au', 'aux', 'en', 'on', 'se', 'son', 'sa',
    'ses', 'leur', 'leurs', 'notre', 'nos', 'votre', 'vos', 'mais', 'ou',
    'est', 'donc', 'or', 'ni', 'car', 'the', 'a', 'an', 'and', 'or', 'but',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are',
    'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did'
  ]);
  
  // Extraire les mots et les normaliser
  const words = question
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  return Array.from(new Set(words)); // Éliminer les doublons
}

/**
 * Divise un texte en phrases
 */
function splitIntoSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 10); // Ignorer les très courtes
}

/**
 * Calcule le score de pertinence d'une phrase par rapport aux mots-clés
 */
function calculateRelevanceScore(sentence: string, keywords: string[]): number {
  const lowerSentence = sentence.toLowerCase();
  let score = 0;
  
  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    const occurrences = (lowerSentence.match(new RegExp(keywordLower, 'g')) || []).length;
    
    // Pondération selon la longueur du mot-clé
    const weight = keyword.length > 5 ? 2 : 1;
    score += occurrences * weight;
  });
  
  // Normaliser par la longueur de la phrase
  const normalizedScore = score / sentence.length;
  
  return Math.min(normalizedScore * 100, 100); // Limiter à 100
}

/**
 * Formate les citations pour l'affichage dans une réponse IA
 */
export function formatCitationsForResponse(citations: Citation[]): string {
  if (citations.length === 0) {
    return '';
  }
  
  let citationsText = '\n\n📚 **Sources et références**:\n\n';
  
  citations.forEach((citation, index) => {
    citationsText += `${index + 1}. **${citation.documentName}**:\n`;
    citationsText += `   > "${citation.excerpt}"\n`;
    
    // Ajouter le contexte si disponible
    if (citation.context && citation.context !== citation.excerpt) {
      citationsText += `   _Contexte: ...${citation.context.substring(Math.max(0, citation.context.indexOf(citation.excerpt) - 50), citation.context.indexOf(citation.excerpt))}..._\n`;
    }
    
    citationsText += '\n';
  });
  
  citationsText += '---\n*Les citations sont extraites automatiquement des documents pour référence*';
  
  return citationsText;
}

/**
 * Enrichit une réponse IA avec des citations pertinentes
 * VERSION AMÉLIORÉE : Utilise les embeddings vectoriels si disponibles
 */
export async function enrichResponseWithCitations(
  response: string,
  documents: Array<{ id: string; name: string; content: string }>,
  question: string,
  options: {
    useAdvancedRAG?: boolean; // Utiliser RAG avancé avec embeddings
    maxCitations?: number;
  } = {}
): Promise<{ enrichedResponse: string; citations: Citation[] | EnhancedCitation[] }> {
  const { useAdvancedRAG = true, maxCitations = 5 } = options;
  
  try {
    if (useAdvancedRAG) {
      console.log('🔍 Utilisation RAG avancé avec embeddings...');
      
      // Rechercher les chunks pertinents pour chaque document
      const allSearchResults: SearchResult[] = [];
      const documentNames: Record<string, string> = {};
      
      for (const document of documents) {
        try {
          const searchResults = await searchRelevantChunks(question, {
            documentId: document.id,
            limit: Math.ceil(maxCitations / documents.length)
          });
          
          allSearchResults.push(...searchResults);
          documentNames[document.id] = document.name;
        } catch (error) {
          console.warn(`⚠️ Erreur recherche embeddings pour ${document.name}:`, error);
          // Fallback vers méthode classique pour ce document
          const classicCitations = extractRelevantCitations(
            document.content,
            document.id,
            document.name,
            question,
            2
          );
          // Convertir en format SearchResult pour traitement unifié
          allSearchResults.push(...classicCitations.map(citation => ({
            chunkId: citation.id,
            documentId: citation.documentId,
            chunkIndex: 0,
            chunkText: citation.excerpt,
            similarity: citation.relevanceScore || 0.5,
            metadata: { legacy: true }
          })));
        }
      }
      
      // Générer les citations avancées
      const enhancedCitations = await generateEnhancedCitations(
        question,
        allSearchResults.slice(0, maxCitations),
        documentNames
      );
      
      // Formater et ajouter à la réponse
      const citationsText = formatEnhancedCitations(enhancedCitations);
      const enrichedResponse = response + citationsText;
      
      return {
        enrichedResponse,
        citations: enhancedCitations
      };
    } else {
      // Méthode classique (legacy)
      console.log('📚 Utilisation méthode classique de citations...');
      
      const allCitations: Citation[] = [];
      
      // Extraire les citations de chaque document
      documents.forEach(document => {
        const citations = extractRelevantCitations(
          document.content,
          document.id,
          document.name,
          question,
          Math.ceil(maxCitations / documents.length)
        );
        allCitations.push(...citations);
      });
      
      // Trier par score de pertinence
      allCitations.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      
      // Prendre les meilleures citations
      const topCitations = allCitations.slice(0, maxCitations);
      
      // Ajouter les citations à la réponse
      const citationsText = formatCitationsForResponse(topCitations);
      const enrichedResponse = response + citationsText;
      
      return {
        enrichedResponse,
        citations: topCitations
      };
    }
  } catch (error) {
    console.error('Erreur enrichissement citations:', error);
    // Fallback gracieux
    return {
      enrichedResponse: response,
      citations: []
    };
  }
}

/**
 * Met à jour les embeddings d'un document pour RAG avancé
 */
export async function updateDocumentCitationsEmbeddings(
  documentId: string,
  documentContent: string
): Promise<boolean> {
  try {
    await updateDocumentEmbeddings(documentId, documentContent);
    console.log(`✅ Embeddings mis à jour pour document ${documentId}`);
    return true;
  } catch (error) {
    console.error('Erreur mise à jour embeddings:', error);
    return false;
  }
}

/**
 * Vérifie si les embeddings sont disponibles pour un document
 */
export async function hasEmbeddings(documentId: string): Promise<boolean> {
  try {
    const { supabase } = await import('../lib/supabase');
    const { data, error } = await supabase
      .from('document_embeddings')
      .select('id')
      .eq('document_id', documentId)
      .limit(1);
    
    return !error && data && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Génère un numéro de citation unique dans le texte
 */
export function generateCitationMarkers(citations: Citation[]): Map<string, number> {
  const markerMap = new Map<string, number>();
  
  citations.forEach((citation, index) => {
    markerMap.set(citation.id, index + 1);
  });
  
  return markerMap;
}

/**
 * Recherche des citations spécifiques dans le contenu
 */
export function findCitationInContent(
  _content: string,
  _citationId: string
): Citation | null {
  // Cette fonction pourrait être étendue pour chercher dans une base de données
  // Pour l'instant, retourne null car les citations sont générées à la volée
  return null;
}

/**
 * Valide si une citation est pertinente
 */
export function validateCitation(citation: Citation): boolean {
  return (
    citation.excerpt.length > 20 &&
    citation.excerpt.length < 500 &&
    citation.documentName.length > 0 &&
    citation.startIndex >= 0 &&
    citation.endIndex > citation.startIndex &&
    (citation.relevanceScore === undefined || citation.relevanceScore > 0)
  );
}
