/**
 * Service de scoring de pertinence des citations
 * 
 * Ce service calcule et affiche les scores de confiance pour chaque citation
 * avec des métriques avancées de pertinence et fiabilité
 * 
 * Date: 11 mars 2026
 */

import type { Citation } from './citationService';

// Interface pour EnhancedCitation (non exportée de citationService)
export interface EnhancedCitation {
  id: string;
  excerpt: string;
  documentId: string;
  relevanceScore: number;
  similarityScore: number;
  documentName: string;
  context?: string;
  positionStart?: number;
  positionEnd?: number;
}

export interface CitationScore {
  id: string;
  relevanceScore: number; // 0-1
  confidenceScore: number; // 0-1
  accuracyScore: number; // 0-1
  freshnessScore: number; // 0-1
  authorityScore: number; // 0-1
  overallScore: number; // 0-1
  breakdown: {
    textualRelevance: number;
    semanticSimilarity: number;
    contextualFit: number;
    sourceQuality: number;
    recency: number;
  };
  metadata: {
    calculationTime: number;
    factorsUsed: string[];
    confidenceLevel: 'high' | 'medium' | 'low';
    recommendations: string[];
  };
}

export interface ScoringOptions {
  includeTextualAnalysis?: boolean;
  includeSemanticSimilarity?: boolean;
  includeContextualAnalysis?: boolean;
  includeSourceQuality?: boolean;
  includeTemporalAnalysis?: boolean;
  weighting?: {
    textual: number;
    semantic: number;
    contextual: number;
    quality: number;
    temporal: number;
  };
}

export interface ScoringResult {
  scores: CitationScore[];
  summary: {
    averageScore: number;
    highConfidenceCount: number;
    mediumConfidenceCount: number;
    lowConfidenceCount: number;
    totalCitations: number;
    processingTime: number;
  };
  recommendations: string[];
}

class CitationScoringService {
  private readonly DEFAULT_OPTIONS: ScoringOptions = {
    includeTextualAnalysis: true,
    includeSemanticSimilarity: true,
    includeContextualAnalysis: true,
    includeSourceQuality: true,
    includeTemporalAnalysis: false,
    weighting: {
      textual: 0.3,
      semantic: 0.3,
      contextual: 0.2,
      quality: 0.15,
      temporal: 0.05
    }
  };

  /**
   * Calcule les scores de pertinence pour un ensemble de citations
   */
  async calculateCitationScores(
    citations: (Citation | EnhancedCitation)[],
    query: string,
    documentContext?: string,
    options: ScoringOptions = {}
  ): Promise<ScoringResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    console.log('📊 ===== CALCUL SCORES PERTINENCE =====');
    console.log('  - Citations:', citations.length);
    console.log('  - Query:', query.substring(0, 100) + '...');

    try {
      const scores: CitationScore[] = [];

      for (let i = 0; i < citations.length; i++) {
        const citation = citations[i];
        console.log(`📈 Scoring citation ${i + 1}/${citations.length}`);
        
        const score = await this.calculateIndividualScore(
          citation,
          query,
          documentContext,
          mergedOptions
        );
        
        scores.push(score);
      }

      // Calculer le résumé
      const summary = this.calculateSummary(scores);
      const recommendations = this.generateRecommendations(scores, query);

      const result: ScoringResult = {
        scores,
        summary: {
          ...summary,
          processingTime: Date.now() - startTime
        },
        recommendations
      };

      console.log(`✅ Scores calculés en ${result.summary.processingTime}ms`);
      console.log(`📊 Score moyen: ${(result.summary.averageScore * 100).toFixed(1)}%`);

      return result;

    } catch (error) {
      console.error('❌ Erreur calcul scores:', error);
      return this.createFallbackResult(citations, Date.now() - startTime);
    }
  }

  /**
   * Calcule le score pour une citation individuelle
   */
  private async calculateIndividualScore(
    citation: Citation | EnhancedCitation,
    query: string,
    documentContext?: string,
    options: ScoringOptions
  ): Promise<CitationScore> {
    const startTime = Date.now();
    const factors: string[] = [];
    const breakdown = {
      textualRelevance: 0,
      semanticSimilarity: 0,
      contextualFit: 0,
      sourceQuality: 0,
      recency: 0
    };

    // Analyse textuelle
    if (options.includeTextualAnalysis) {
      breakdown.textualRelevance = this.calculateTextualRelevance(citation.excerpt, query);
      factors.push('textual');
    }

    // Similarité sémantique
    if (options.includeSemanticSimilarity) {
      breakdown.semanticSimilarity = await this.calculateSemanticSimilarity(
        citation.excerpt,
        query
      );
      factors.push('semantic');
    }

    // Adéquation contextuelle
    if (options.includeContextualAnalysis && documentContext) {
      breakdown.contextualFit = this.calculateContextualFit(
        citation.excerpt,
        documentContext,
        query
      );
      factors.push('contextual');
    }

    // Qualité de la source
    if (options.includeSourceQuality) {
      breakdown.sourceQuality = this.calculateSourceQuality(citation);
      factors.push('quality');
    }

    // Analyse temporelle
    if (options.includeTemporalAnalysis) {
      breakdown.recency = this.calculateRecency(citation);
      factors.push('temporal');
    }

    // Calculer les scores composites
    const relevanceScore = this.calculateWeightedScore(breakdown, options.weighting!);
    const confidenceScore = this.calculateConfidenceScore(breakdown, factors);
    const accuracyScore = this.calculateAccuracyScore(citation, breakdown);
    const freshnessScore = breakdown.recency;
    const authorityScore = breakdown.sourceQuality;
    const overallScore = (relevanceScore + confidenceScore + accuracyScore) / 3;

    // Déterminer le niveau de confiance
    const confidenceLevel = this.getConfidenceLevel(overallScore);

    // Générer des recommandations
    const recommendations = this.generateScoreRecommendations(breakdown, overallScore);

    return {
      id: citation.id || `score-${Date.now()}`,
      relevanceScore,
      confidenceScore,
      accuracyScore,
      freshnessScore,
      authorityScore,
      overallScore,
      breakdown,
      metadata: {
        calculationTime: Date.now() - startTime,
        factorsUsed: factors,
        confidenceLevel,
        recommendations
      }
    };
  }

  /**
   * Calcule la pertinence textuelle basée sur les mots-clés
   */
  private calculateTextualRelevance(excerpt: string, query: string): number {
    const excerptWords = this.extractKeywords(excerpt.toLowerCase());
    const queryWords = this.extractKeywords(query.toLowerCase());
    const queryWordsArray = Array.from(queryWords);
    
    if (queryWordsArray.length === 0) return 0;

    // Calculer le Jaccard similarity
    const intersection = new Set([...excerptWords].filter(word => queryWords.has(word)));
    const union = new Set([...excerptWords, ...queryWords]);
    const unionArray = Array.from(union);
    
    return intersection.size / unionArray.length;
  }

  /**
   * Calcule la similarité sémantique avec embeddings
   */
  private async calculateSemanticSimilarity(excerpt: string, query: string): Promise<number> {
    try {
      // Simuler une analyse sémantique (dans une vraie implémentation, utiliserait des embeddings)
      const commonWords = this.extractCommonWords(excerpt, query);
      const totalWords = Math.max(excerpt.split(' ').length, query.split(' ').length);
      
      return Math.min(commonWords / totalWords, 1);
    } catch (error) {
      console.warn('⚠️ Erreur similarité sémantique, fallback vers textuel');
      return this.calculateTextualRelevance(excerpt, query);
    }
  }

  /**
   * Calcule l'adéquation contextuelle
   */
  private calculateContextualFit(excerpt: string, documentContext: string, query: string): number {
    const excerptKeywords = this.extractKeywords(excerpt.toLowerCase());
    const contextKeywords = this.extractKeywords(documentContext.toLowerCase());
    const queryKeywords = this.extractKeywords(query.toLowerCase());
    const contextKeywordsArray = Array.from(contextKeywords);
    const queryKeywordsArray = Array.from(queryKeywords);
    
    // Vérifier si l'extrait est pertinent pour le contexte global
    const contextOverlap = new Set([...excerptKeywords].filter(word => contextKeywords.has(word)));
    const queryOverlap = new Set([...excerptKeywords].filter(word => queryKeywords.has(word)));
    
    const contextScore = contextKeywordsArray.length > 0 ? contextOverlap.size / contextKeywordsArray.length : 0;
    const queryScore = queryKeywordsArray.length > 0 ? queryOverlap.size / queryKeywordsArray.length : 0;
    
    return (contextScore + queryScore) / 2;
  }

  /**
   * Calcule la qualité de la source
   */
  private calculateSourceQuality(citation: Citation | EnhancedCitation): number {
    let score = 0.5; // Score de base

    // Facteurs de qualité
    const excerptLength = citation.excerpt.length;
    
    // Longueur appropriée (ni trop courte, ni trop longue)
    if (excerptLength >= 50 && excerptLength <= 500) {
      score += 0.2;
    } else if (excerptLength >= 30 && excerptLength <= 800) {
      score += 0.1;
    }

    // Présence de contexte (pour les citations améliorées)
    if ('context' in citation && citation.context) {
      score += 0.2;
    }

    // Présence de métadonnées
    if ('documentName' in citation && citation.documentName) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  /**
   * Calcule la fraîcheur (pertinence temporelle)
   */
  private calculateRecency(citation: Citation | EnhancedCitation): number {
    // Simuler une analyse temporelle
    // Dans une vraie implémentation, utiliserait les dates réelles des documents
    return 0.7; // Valeur par défaut
  }

  /**
   * Calcule un score pondéré
   */
  private calculateWeightedScore(
    breakdown: { textualRelevance: number; semanticSimilarity: number; contextualFit: number; sourceQuality: number; recency: number },
    weighting: { textual: number; semantic: number; contextual: number; quality: number; temporal: number }
  ): number {
    return (
      breakdown.textualRelevance * weighting.textual +
      breakdown.semanticSimilarity * weighting.semantic +
      breakdown.contextualFit * weighting.contextual +
      breakdown.sourceQuality * weighting.quality +
      breakdown.recency * weighting.temporal
    );
  }

  /**
   * Calcule le score de confiance
   */
  private calculateConfidenceScore(
    breakdown: { textualRelevance: number; semanticSimilarity: number; contextualFit: number; sourceQuality: number; recency: number },
    factorsUsed: string[]
  ): number {
    const scores = Object.values(breakdown).filter(score => score > 0);
    
    if (scores.length === 0) return 0;
    
    // Score basé sur la cohérence des différents facteurs
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    // Plus la variance est faible, plus la confiance est élevée
    const consistencyScore = Math.max(0, 1 - variance);
    
    // Ajuster selon le nombre de facteurs utilisés
    const factorScore = Math.min(factorsUsed.length / 5, 1); // 5 facteurs max
    
    return (mean * 0.7 + consistencyScore * 0.2 + factorScore * 0.1);
  }

  /**
   * Calcule le score de précision
   */
  private calculateAccuracyScore(
    _citation: Citation | EnhancedCitation,
    breakdown: { textualRelevance: number; semanticSimilarity: number; contextualFit: number; sourceQuality: number; recency: number }
  ): number {
    // Basé sur la qualité de la source et la pertinence textuelle
    const baseScore = (breakdown.textualRelevance + breakdown.sourceQuality) / 2;
    
    // Ajuster selon la présence de métadonnées
    let bonus = 0;
    
    if ('positionStart' in _citation && _citation.positionStart !== undefined) {
      bonus += 0.1; // Position précise
    }
    
    if ('context' in _citation && _citation.context) {
      bonus += 0.1; // Contexte disponible
    }
    
    if ('similarityScore' in _citation && _citation.similarityScore) {
      bonus += 0.1; // Score de similarité disponible
    }
    
    return Math.min(baseScore + bonus, 1);
  }

  /**
   * Extrait les mots-clés d'un texte
   */
  private extractKeywords(text: string): Set<string> {
    const stopWords = new Set([
      'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais',
      'donc', 'or', 'ni', 'car', 'que', 'qui', 'quoi', 'comment', 'pourquoi',
      'est', 'sont', 'a', 'ont', 'été', 'être', 'avoir', 'faire', 'avec',
      'pour', 'par', 'sur', 'dans', 'vers', 'sans', 'sous', 'entre', 'chez',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'
    ]);

    return new Set(
      text
        .toLowerCase()
        .split(/\s+/)
        .filter(word => 
          word.length > 2 && 
          !stopWords.has(word) && 
          /^[a-zàâäéèêëïîôöùûüÿç]+$/.test(word)
        )
    );
  }

  /**
   * Extrait les mots communs entre deux textes
   */
  private extractCommonWords(text1: string, _text2: string): number {
    const words1 = this.extractKeywords(text1.toLowerCase());
    const words2 = this.extractKeywords(_text2.toLowerCase());
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    return intersection.size;
  }

  /**
   * Détermine le niveau de confiance
   */
  private getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Génère des recommandations pour un score
   */
  private generateScoreRecommendations(
    breakdown: { textualRelevance: number; semanticSimilarity: number; contextualFit: number; sourceQuality: number; recency: number },
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (breakdown.textualRelevance < 0.5) {
      recommendations.push('Faible pertinence textuelle - vérifier les mots-clés');
    }

    if (breakdown.semanticSimilarity < 0.5) {
      recommendations.push('Similarité sémantique faible - considérer d autres sources');
    }

    if (breakdown.contextualFit < 0.5) {
      recommendations.push('Contexte inadéquat - vérifier la cohérence avec le document');
    }

    if (breakdown.sourceQuality < 0.5) {
      recommendations.push('Qualité de source faible - préférer des sources plus fiables');
    }

    if (overallScore >= 0.8) {
      recommendations.push('Excellente pertinence - source très recommandée');
    } else if (overallScore >= 0.6) {
      recommendations.push('Bonne pertinence - source acceptable');
    } else {
      recommendations.push('Pertinence faible - considérer remplacer cette source');
    }

    return recommendations;
  }

  /**
   * Calcule le résumé des scores
   */
  private calculateSummary(scores: CitationScore[]) {
    const totalScores = scores.length;
    const averageScore = scores.reduce((sum, score) => sum + score.overallScore, 0) / totalScores;
    
    const highConfidenceCount = scores.filter(s => s.metadata.confidenceLevel === 'high').length;
    const mediumConfidenceCount = scores.filter(s => s.metadata.confidenceLevel === 'medium').length;
    const lowConfidenceCount = scores.filter(s => s.metadata.confidenceLevel === 'low').length;

    return {
      averageScore,
      highConfidenceCount,
      mediumConfidenceCount,
      lowConfidenceCount,
      totalCitations: totalScores
    };
  }

  /**
   * Génère des recommandations globales
   */
  private generateRecommendations(scores: CitationScore[], query: string): string[] {
    const recommendations: string[] = [];
    const summary = this.calculateSummary(scores);

    if (summary.averageScore < 0.5) {
      recommendations.push('Les scores globaux sont faibles - envisager une nouvelle recherche');
    }

    if (summary.lowConfidenceCount > summary.totalCitations * 0.5) {
      recommendations.push('Plus de la moitié des sources ont une faible confiance - affiner la requête');
    }

    if (summary.highConfidenceCount >= 3) {
      recommendations.push('Excellent ensemble de sources avec une haute confiance');
    }

    const lowScoreCitations = scores.filter(s => s.overallScore < 0.4);
    if (lowScoreCitations.length > 0) {
      recommendations.push(`${lowScoreCitations.length} source(s) peu pertinente(s) à considérer pour suppression`);
    }

    return recommendations;
  }

  /**
   * Crée un résultat de fallback
   */
  private createFallbackResult(
    citations: (Citation | EnhancedCitation)[],
    processingTime: number
  ): ScoringResult {
    const scores: CitationScore[] = citations.map((citation, index) => ({
      id: citation.id || `fallback-${index}`,
      relevanceScore: 0.5,
      confidenceScore: 0.3,
      accuracyScore: 0.4,
      freshnessScore: 0.5,
      authorityScore: 0.5,
      overallScore: 0.4,
      breakdown: {
        textualRelevance: 0.5,
        semanticSimilarity: 0.3,
        contextualFit: 0.4,
        sourceQuality: 0.5,
        recency: 0.5
      },
      metadata: {
        calculationTime: 10,
        factorsUsed: ['textual'],
        confidenceLevel: 'low' as const,
        recommendations: ['Score calculé avec méthode fallback - précision limitée']
      }
    }));

    return {
      scores,
      summary: {
        averageScore: 0.4,
        highConfidenceCount: 0,
        mediumConfidenceCount: 0,
        lowConfidenceCount: citations.length,
        totalCitations: citations.length,
        processingTime
      },
      recommendations: ['Calcul effectué en mode fallback - résultats à vérifier manuellement']
    };
  }

  /**
   * Exporte les scores au format CSV
   */
  exportScoresCSV(scores: CitationScore[]): string {
    const headers = [
      'ID', 'Overall Score', 'Relevance', 'Confidence', 'Accuracy', 
      'Freshness', 'Authority', 'Textual', 'Semantic', 'Contextual', 
      'Quality', 'Confidence Level', 'Recommendations'
    ];

    const rows = scores.map(score => [
      score.id,
      (score.overallScore * 100).toFixed(1) + '%',
      (score.relevanceScore * 100).toFixed(1) + '%',
      (score.confidenceScore * 100).toFixed(1) + '%',
      (score.accuracyScore * 100).toFixed(1) + '%',
      (score.freshnessScore * 100).toFixed(1) + '%',
      (score.authorityScore * 100).toFixed(1) + '%',
      (score.breakdown.textualRelevance * 100).toFixed(1) + '%',
      (score.breakdown.semanticSimilarity * 100).toFixed(1) + '%',
      (score.breakdown.contextualFit * 100).toFixed(1) + '%',
      (score.breakdown.sourceQuality * 100).toFixed(1) + '%',
      score.metadata.confidenceLevel,
      score.metadata.recommendations.join('; ')
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Instance singleton
export const citationScoringService = new CitationScoringService();

// Export des fonctions utilitaires
export const calculateCitationScores = (
  citations: (Citation | EnhancedCitation)[],
  query: string,
  documentContext?: string,
  options?: ScoringOptions
) => citationScoringService.calculateCitationScores(citations, query, documentContext, options);

export const exportScoresCSV = (scores: CitationScore[]) => 
  citationScoringService.exportScoresCSV(scores);
