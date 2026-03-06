/**
 * Service de gestion des citations sources
 * Permet d'extraire et de formater des citations avec références aux documents
 * 
 * Date: 6 mars 2025
 */

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
  
  return [...new Set(words)]; // Éliminer les doublons
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
 */
export function enrichResponseWithCitations(
  response: string,
  documents: Array<{ id: string; name: string; content: string }>,
  question: string
): { enrichedResponse: string; citations: Citation[] } {
  const allCitations: Citation[] = [];
  
  // Extraire les citations de chaque document
  documents.forEach(document => {
    const citations = extractRelevantCitations(
      document.content,
      document.id,
      document.name,
      question,
      2 // 2 citations par document maximum
    );
    allCitations.push(...citations);
  });
  
  // Toutes les citations par score de pertinence
  allCitations.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  
  // Prendre les 5 meilleures citations
  const topCitations = allCitations.slice(0, 5);
  
  // Ajouter les citations à la réponse
  const citationsText = formatCitationsForResponse(topCitations);
  const enrichedResponse = response + citationsText;
  
  return {
    enrichedResponse,
    citations: topCitations
  };
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
