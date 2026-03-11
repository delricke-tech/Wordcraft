/**
 * Service de formatage des citations avec numérotation
 * 
 * Ce service transforme les citations brutes en format numéroté [1] [2] [3]
 * et gère l'intégration dans les réponses de l'IA
 * 
 * Date: 11 mars 2026
 */

import type { Citation, EnhancedCitation } from './citationService';

export interface FormattedCitation {
  id: string;
  number: number;
  originalCitation: Citation | EnhancedCitation;
  position: number;
  context?: string;
}

export interface CitationFormattingOptions {
  style: 'brackets' | 'superscript' | 'inline';
  includeScores?: boolean;
  maxCitations?: number;
  sortByRelevance?: boolean;
  groupByDocument?: boolean;
}

export interface FormattedResponse {
  text: string;
  citations: FormattedCitation[];
  metadata: {
    totalCitations: number;
    uniqueDocuments: number;
    averageRelevance?: number;
    formattingStyle: string;
  };
}

class CitationFormatterService {
  private readonly DEFAULT_OPTIONS: CitationFormattingOptions = {
    style: 'brackets',
    includeScores: true,
    maxCitations: 10,
    sortByRelevance: true,
    groupByDocument: false
  };

  /**
   * Formate une réponse avec citations numérotées
   */
  formatResponseWithCitations(
    response: string,
    citations: (Citation | EnhancedCitation)[],
    options: Partial<CitationFormattingOptions> = {}
  ): FormattedResponse {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    console.log('📝 ===== FORMATTING CITATIONS =====');
    console.log('  - Citations reçues:', citations.length);
    console.log('  - Style:', mergedOptions.style);

    try {
      // Préparer et filtrer les citations
      const processedCitations = this.processCitations(citations, mergedOptions);
      
      // Insérer les marqueurs de citation dans le texte
      const formattedText = this.insertCitationMarkers(response, processedCitations, mergedOptions);
      
      // Créer les objets de citation formatés
      const formattedCitations = this.createFormattedCitations(processedCitations);
      
      // Calculer les métadonnées
      const metadata = this.calculateMetadata(formattedCitations, mergedOptions);

      console.log(`✅ ${formattedCitations.length} citations formatées`);
      
      return {
        text: formattedText,
        citations: formattedCitations,
        metadata
      };

    } catch (error) {
      console.error('❌ Erreur formatage citations:', error);
      return this.createFallbackResponse(response, citations, mergedOptions);
    }
  }

  /**
   * Traite les citations (filtrage, tri, déduplication)
   */
  private processCitations(
    citations: (Citation | EnhancedCitation)[],
    options: CitationFormattingOptions
  ): (Citation | EnhancedCitation)[] {
    let processed = [...citations];

    // Limiter le nombre de citations
    if (options.maxCitations && processed.length > options.maxCitations) {
      processed = processed.slice(0, options.maxCitations);
    }

    // Trier par pertinence si demandé
    if (options.sortByRelevance) {
      processed.sort((a, b) => {
        const scoreA = this.getRelevanceScore(a);
        const scoreB = this.getRelevanceScore(b);
        
        if (scoreA !== null && scoreB !== null) {
          return scoreB - scoreA; // Plus pertinent d'abord
        }
        
        return 0; // Garder l'ordre original si pas de score
      });
    }

    // Regrouper par document si demandé
    if (options.groupByDocument) {
      processed = this.groupCitationsByDocument(processed);
    }

    return processed;
  }

  /**
   * Insère les marqueurs de citation dans le texte
   */
  private insertCitationMarkers(
    text: string,
    citations: (Citation | EnhancedCitation)[],
    options: CitationFormattingOptions
  ): string {
    let formattedText = text;

    // Identifier les endroits où insérer des citations
    const insertionPoints = this.findCitationInsertionPoints(text, citations);

    // Insérer les marqueurs en ordre inverse pour ne pas perturber les positions
    insertionPoints
      .sort((a, b) => b.position - a.position)
      .forEach(({ position, citationIndex }) => {
        const marker = this.createCitationMarker(citationIndex + 1, options.style);
        formattedText = this.insertAtPosition(formattedText, position, marker);
      });

    return formattedText;
  }

  /**
   * Trouve les points d'insertion optimaux pour les citations
   */
  private findCitationInsertionPoints(
    text: string,
    citations: (Citation | EnhancedCitation)[]
  ): Array<{ position: number; citationIndex: number }> {
    const insertionPoints: Array<{ position: number; citationIndex: number }> = [];
    
    // Stratégie 1: Identifier les phrases qui contiennent des informations citables
    const sentences = text.split(/[.!?]+/);
    let currentPosition = 0;

    citations.forEach((citation, index) => {
      const bestPosition = this.findBestPositionForCitation(
        text,
        citation,
        currentPosition,
        sentences
      );
      
      if (bestPosition !== -1) {
        insertionPoints.push({
          position: bestPosition,
          citationIndex: index
        });
        currentPosition = bestPosition;
      }
    });

    return insertionPoints;
  }

  /**
   * Trouve la meilleure position pour une citation spécifique
   */
  private findBestPositionForCitation(
    text: string,
    citation: Citation | EnhancedCitation,
    startPosition: number,
    sentences: string[]
  ): number {
    // Stratégie simple : trouver la fin de la phrase la plus pertinente
    const citationKeywords = this.extractKeywords(citation);
    let bestScore = -1;
    let bestPosition = -1;

    sentences.forEach((sentence, index) => {
      const sentenceStart = text.indexOf(sentence, startPosition);
      if (sentenceStart === -1) return;

      const sentenceEnd = sentenceStart + sentence.length;
      
      // Calculer un score de pertinence
      const score = this.calculateSentenceRelevance(sentence, citationKeywords);
      
      if (score > bestScore && score > 0.3) { // Seuil minimum
        bestScore = score;
        bestPosition = sentenceEnd;
      }
    });

    return bestPosition;
  }

  /**
   * Calcule la pertinence d'une phrase pour une citation
   */
  private calculateSentenceRelevance(sentence: string, keywords: string[]): number {
    const sentenceLower = sentence.toLowerCase();
    const matchedKeywords = keywords.filter(keyword => 
      sentenceLower.includes(keyword.toLowerCase())
    );

    if (matchedKeywords.length === 0) return 0;

    // Score basé sur le pourcentage de mots-clés trouvés
    return matchedKeywords.length / keywords.length;
  }

  /**
   * Extrait les mots-clés d'une citation
   */
  private extractKeywords(citation: Citation | EnhancedCitation): string[] {
    const text = citation.excerpt.toLowerCase();
    
    // Mots à ignorer (stop words)
    const stopWords = new Set([
      'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais',
      'donc', 'or', 'ni', 'car', 'que', 'qui', 'quoi', 'comment', 'pourquoi',
      'est', 'sont', 'a', 'ont', 'été', 'être', 'avoir', 'faire', 'avec',
      'pour', 'par', 'sur', 'dans', 'vers', 'sans', 'sous', 'entre', 'chez'
    ]);

    // Extraire les mots significatifs
    return text
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 5); // Limiter à 5 mots-clés
  }

  /**
   * Crée un marqueur de citation selon le style
   */
  private createCitationMarker(number: number, style: string): string {
    switch (style) {
      case 'superscript':
        return `<sup>[${number}]</sup>`;
      case 'inline':
        return `(${number})`;
      case 'brackets':
      default:
        return ` [${number}]`;
    }
  }

  /**
   * Insère du texte à une position spécifique
   */
  private insertAtPosition(text: string, position: number, insertion: string): string {
    return text.slice(0, position) + insertion + text.slice(position);
  }

  /**
   * Crée les objets de citation formatés
   */
  private createFormattedCitations(
    citations: (Citation | EnhancedCitation)[]
  ): FormattedCitation[] {
    return citations.map((citation, index) => ({
      id: citation.id || `citation-${index}`,
      number: index + 1,
      originalCitation: citation,
      position: 0, // Sera mis à jour si nécessaire
      context: 'context' in citation ? citation.context : undefined
    }));
  }

  /**
   * Calcule les métadonnées du formatage
   */
  private calculateMetadata(
    formattedCitations: FormattedCitation[],
    options: CitationFormattingOptions
  ) {
    const uniqueDocuments = new Set(
      formattedCitations.map(c => 
        'documentName' in c.originalCitation 
          ? c.originalCitation.documentName 
          : c.originalCitation.name
      )
    ).size;

    const relevanceScores = formattedCitations
      .map(c => this.getRelevanceScore(c.originalCitation))
      .filter(score => score !== null) as number[];

    const averageRelevance = relevanceScores.length > 0
      ? relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length
      : undefined;

    return {
      totalCitations: formattedCitations.length,
      uniqueDocuments,
      averageRelevance,
      formattingStyle: options.style
    };
  }

  /**
   * Obtient le score de pertinence d'une citation
   */
  private getRelevanceScore(citation: Citation | EnhancedCitation): number | null {
    if ('relevanceScore' in citation) {
      return citation.relevanceScore;
    }
    return null;
  }

  /**
   * Regroupe les citations par document
   */
  private groupCitationsByDocument(
    citations: (Citation | EnhancedCitation)[]
  ): (Citation | EnhancedCitation)[] {
    const documentGroups = new Map<string, (Citation | EnhancedCitation)[]>();

    citations.forEach(citation => {
      const docName = 'documentName' in citation 
        ? citation.documentName 
        : citation.name;
      
      if (!documentGroups.has(docName)) {
        documentGroups.set(docName, []);
      }
      documentGroups.get(docName)!.push(citation);
    });

    // Prendre la meilleure citation de chaque document
    const grouped: (Citation | EnhancedCitation)[] = [];
    documentGroups.forEach(group => {
      // Trier par pertinence et prendre la meilleure
      const sorted = group.sort((a, b) => {
        const scoreA = this.getRelevanceScore(a);
        const scoreB = this.getRelevanceScore(b);
        
        if (scoreA !== null && scoreB !== null) {
          return scoreB - scoreA;
        }
        
        return 0;
      });
      
      grouped.push(sorted[0]);
    });

    return grouped;
  }

  /**
   * Crée une réponse de fallback en cas d'erreur
   */
  private createFallbackResponse(
    response: string,
    citations: (Citation | EnhancedCitation)[],
    options: CitationFormattingOptions
  ): FormattedResponse {
    // Ajouter les citations à la fin du texte
    let formattedText = response;
    
    if (citations.length > 0) {
      formattedText += '\n\n**Sources:**\n';
      citations.forEach((citation, index) => {
        const docName = 'documentName' in citation ? citation.documentName : citation.name;
        formattedText += ` [${index + 1}] ${docName}\n`;
      });
    }

    return {
      text: formattedText,
      citations: this.createFormattedCitations(citations),
      metadata: {
        totalCitations: citations.length,
        uniqueDocuments: new Set(citations.map(c => 'documentName' in c ? c.documentName : c.name)).size,
        formattingStyle: options.style
      }
    };
  }

  /**
   * Génère une bibliographie formatée
   */
  generateBibliography(
    citations: FormattedCitation[],
    format: 'apa' | 'mla' | 'chicago' = 'apa'
  ): string {
    if (citations.length === 0) return '';

    const bibliography = citations.map(citation => {
      const original = citation.originalCitation;
      const docName = 'documentName' in original ? original.documentName : original.name;
      
      switch (format) {
        case 'apa':
          return `[${citation.number}] ${docName}. ${original.excerpt.slice(0, 100)}...`;
        
        case 'mla':
          return `[${citation.number}] "${docName}." ${original.excerpt.slice(0, 100)}...`;
        
        case 'chicago':
          return `[${citation.number}] ${docName}. ${original.excerpt.slice(0, 100)}...`;
        
        default:
          return `[${citation.number}] ${docName}`;
      }
    });

    return `## Bibliographie\n\n${bibliography.join('\n\n')}`;
  }

  /**
   * Valide le formatage des citations
   */
  validateCitationFormatting(text: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifier les marqueurs de citation
    const citationMarkers = text.match(/\[\d+\]/g) || [];
    
    // Vérifier la séquence numérique
    const numbers = citationMarkers.map(marker => parseInt(marker.slice(1, -1)));
    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    
    for (let i = 0; i < sortedNumbers.length; i++) {
      if (sortedNumbers[i] !== i + 1) {
        errors.push(`Numérotation incorrecte: attendu ${i + 1}, trouvé ${sortedNumbers[i]}`);
        break;
      }
    }

    // Vérifier les doublons
    const duplicates = numbers.filter((num, index) => numbers.indexOf(num) !== index);
    if (duplicates.length > 0) {
      warnings.push(`Citations dupliquées: ${duplicates.join(', ')}`);
    }

    // Vérifier les citations orphelines
    const expectedNumbers = Array.from({ length: Math.max(...numbers, 0) }, (_, i) => i + 1);
    const missingNumbers = expectedNumbers.filter(num => !numbers.includes(num));
    if (missingNumbers.length > 0) {
      warnings.push(`Citations manquantes: ${missingNumbers.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Instance singleton
export const citationFormatterService = new CitationFormatterService();

// Export des fonctions utilitaires
export const formatResponseWithCitations = (
  response: string,
  citations: (Citation | EnhancedCitation)[],
  options?: Partial<CitationFormattingOptions>
) => citationFormatterService.formatResponseWithCitations(response, citations, options);

export const generateBibliography = (
  citations: FormattedCitation[],
  format?: 'apa' | 'mla' | 'chicago'
) => citationFormatterService.generateBibliography(citations, format);

export const validateCitationFormatting = (text: string) => 
  citationFormatterService.validateCitationFormatting(text);
