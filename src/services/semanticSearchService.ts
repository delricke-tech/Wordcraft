/**
 * Service de recherche sémantique (vectorielle + full-text)
 * 
 * Ce service combine la recherche vectorielle (embeddings) avec la recherche
 * full-text pour fournir des résultats de recherche pertinents et contextuels
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface SearchResult {
  id: string;
  type: 'document' | 'note' | 'conversation' | 'flashcard' | 'quiz';
  title: string;
  content: string;
  excerpt: string;
  relevanceScore: number;
  semanticScore: number;
  fullTextScore: number;
  metadata: SearchMetadata;
  highlights: string[];
  url?: string;
}

export interface SearchMetadata {
  created_at: string;
  updated_at: string;
  word_count: number;
  tags?: string[];
  workspace_id?: string;
  folder_id?: string;
  created_by: string;
  type_specific: Record<string, any>;
}

export interface SearchOptions {
  query: string;
  filters?: {
    type?: ('document' | 'note' | 'conversation' | 'flashcard' | 'quiz')[];
    workspace_id?: string;
    folder_id?: string;
    tags?: string[];
    created_by?: string;
    date_range?: {
      start: string;
      end: string;
    };
    word_count_range?: {
      min: number;
      max: number;
    };
  };
  ranking?: 'semantic' | 'fulltext' | 'hybrid';
  limit?: number;
  offset?: number;
  include_highlights?: boolean;
  threshold?: number;
}

export interface EmbeddingVector {
  id: string;
  content_type: string;
  content_id: string;
  embedding: number[];
  metadata: Record<string, any>;
  created_at: string;
}

class SemanticSearchService {
  private readonly EMBEDDING_DIMENSION = 1536; // OpenAI text-embedding-3-small
  private readonly SIMILARITY_THRESHOLD = 0.7;

  /**
   * Effectue une recherche sémantique combinée
   */
  async semanticSearch(options: SearchOptions): Promise<SearchResult[]> {
    try {
      console.log('🔍 ===== RECHERCHE SÉMANTIQUE =====');
      console.log('  - Query:', options.query);
      console.log('  - Type:', options.ranking || 'hybrid');

      // Générer l'embedding de la requête
      const queryEmbedding = await this.generateQueryEmbedding(options.query);

      // Rechercher par similarité vectorielle
      const semanticResults = await this.searchByVector(queryEmbedding, options);

      // Rechercher par texte plein
      const fullTextResults = await this.searchByFullText(options.query, options);

      // Combiner et classer les résultats
      const combinedResults = this.combineSearchResults(
        semanticResults,
        fullTextResults,
        options.ranking || 'hybrid'
      );

      // Appliquer les filtres et la pagination
      const filteredResults = this.applyFilters(combinedResults, options);
      const paginatedResults = this.applyPagination(filteredResults, options);

      console.log(`✅ ${paginatedResults.length} résultats trouvés`);
      return paginatedResults;

    } catch (error) {
      console.error('❌ Erreur recherche sémantique:', error);
      throw new Error(`Échec de la recherche sémantique: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Génère l'embedding d'une requête
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      // Appeler l'API OpenAI pour générer l'embedding
      const response = await fetch('/api/generate-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: query }),
      });

      if (!response.ok) {
        throw new Error('Erreur génération embedding');
      }

      const data = await response.json();
      return data.embedding;

    } catch (error) {
      console.error('❌ Erreur génération embedding:', error);
      throw new Error('Impossible de générer l\'embedding de la requête');
    }
  }

  /**
   * Recherche par similarité vectorielle
   */
  private async searchByVector(
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase.rpc('search_by_vector', {
        query_embedding: queryEmbedding,
        match_threshold: options.threshold || this.SIMILARITY_THRESHOLD,
        match_count: options.limit || 20,
        content_types: options.filters?.type || ['document', 'note', 'conversation', 'flashcard', 'quiz']
      });

      if (error) throw error;

      return (data || []).map((result: any) => ({
        id: result.content_id,
        type: result.content_type,
        title: result.title,
        content: result.content,
        excerpt: result.excerpt,
        relevanceScore: result.similarity,
        semanticScore: result.similarity,
        fullTextScore: 0,
        metadata: result.metadata,
        highlights: [],
        url: this.generateUrl(result.content_type, result.content_id)
      }));

    } catch (error) {
      console.error('❌ Erreur recherche vectorielle:', error);
      return [];
    }
  }

  /**
   * Recherche par texte plein
   */
  private async searchByFullText(
    query: string,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    try {
      const searchQuery = this.prepareFullTextQuery(query);

      const { data, error } = await supabase.rpc('search_by_fulltext', {
        search_query: searchQuery,
        content_types: options.filters?.type || ['document', 'note', 'conversation', 'flashcard', 'quiz'],
        match_count: options.limit || 20
      });

      if (error) throw error;

      return (data || []).map((result: any) => ({
        id: result.content_id,
        type: result.content_type,
        title: result.title,
        content: result.content,
        excerpt: result.excerpt,
        relevanceScore: result.rank,
        semanticScore: 0,
        fullTextScore: result.rank,
        metadata: result.metadata,
        highlights: result.highlights || [],
        url: this.generateUrl(result.content_type, result.content_id)
      }));

    } catch (error) {
      console.error('❌ Erreur recherche plein texte:', error);
      return [];
    }
  }

  /**
   * Combine les résultats de recherche vectorielle et plein texte
   */
  private combineSearchResults(
    semanticResults: SearchResult[],
    fullTextResults: SearchResult[],
    ranking: 'semantic' | 'fulltext' | 'hybrid'
  ): SearchResult[] {
    // Créer une map pour éviter les doublons
    const resultsMap = new Map<string, SearchResult>();

    // Ajouter les résultats sémantiques
    semanticResults.forEach(result => {
      const key = `${result.type}-${result.id}`;
      resultsMap.set(key, result);
    });

    // Ajouter/mettre à jour les résultats plein texte
    fullTextResults.forEach(result => {
      const key = `${result.type}-${result.id}`;
      const existing = resultsMap.get(key);

      if (existing) {
        // Combiner les scores
        if (ranking === 'hybrid') {
          existing.relevanceScore = (existing.semanticScore * 0.6 + result.fullTextScore * 0.4);
          existing.fullTextScore = result.fullTextScore;
          existing.highlights = [...existing.highlights, ...result.highlights];
        } else if (ranking === 'fulltext') {
          existing.relevanceScore = result.fullTextScore;
          existing.fullTextScore = result.fullTextScore;
          existing.highlights = result.highlights;
        }
      } else {
        resultsMap.set(key, result);
      }
    });

    // Convertir en tableau et trier
    return Array.from(resultsMap.values()).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Applique les filtres aux résultats
   */
  private applyFilters(results: SearchResult[], options: SearchOptions): SearchResult[] {
    let filteredResults = results;

    // Filtre par type
    if (options.filters?.type && options.filters.type.length > 0) {
      filteredResults = filteredResults.filter(result => 
        options.filters!.type!.includes(result.type)
      );
    }

    // Filtre par workspace
    if (options.filters?.workspace_id) {
      filteredResults = filteredResults.filter(result => 
        result.metadata.workspace_id === options.filters!.workspace_id
      );
    }

    // Filtre par dossier
    if (options.filters?.folder_id) {
      filteredResults = filteredResults.filter(result => 
        result.metadata.folder_id === options.filters!.folder_id
      );
    }

    // Filtre par tags
    if (options.filters?.tags && options.filters.tags.length > 0) {
      filteredResults = filteredResults.filter(result => {
        const resultTags = result.metadata.tags || [];
        return options.filters!.tags!.some(tag => resultTags.includes(tag));
      });
    }

    // Filtre par créateur
    if (options.filters?.created_by) {
      filteredResults = filteredResults.filter(result => 
        result.metadata.created_by === options.filters!.created_by
      );
    }

    // Filtre par plage de dates
    if (options.filters?.date_range) {
      const { start, end } = options.filters.date_range;
      filteredResults = filteredResults.filter(result => {
        const resultDate = new Date(result.metadata.created_at);
        return resultDate >= new Date(start) && resultDate <= new Date(end);
      });
    }

    // Filtre par plage de mots
    if (options.filters?.word_count_range) {
      const { min, max } = options.filters.word_count_range;
      filteredResults = filteredResults.filter(result => 
        result.metadata.word_count >= min && result.metadata.word_count <= max
      );
    }

    return filteredResults;
  }

  /**
   * Applique la pagination
   */
  private applyPagination(results: SearchResult[], options: SearchOptions): SearchResult[] {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    return results.slice(offset, offset + limit);
  }

  /**
   * Prépare la requête pour la recherche plein texte
   */
  private prepareFullTextQuery(query: string): string {
    // Nettoyer et préparer la requête
    return query
      .trim()
      .split(/\s+/)
      .map(word => `${word}:*`)
      .join(' & ');
  }

  /**
   * Génère une URL pour un résultat
   */
  private generateUrl(type: string, id: string): string {
    const baseUrl = window.location.origin;
    
    switch (type) {
      case 'document':
        return `${baseUrl}/library/document/${id}`;
      case 'note':
        return `${baseUrl}/notes/${id}`;
      case 'conversation':
        return `${baseUrl}/chat/${id}`;
      case 'flashcard':
        return `${baseUrl}/flashcards/${id}`;
      case 'quiz':
        return `${baseUrl}/quizzes/${id}`;
      default:
        return `${baseUrl}/search/${type}/${id}`;
    }
  }

  /**
   * Indexe du contenu pour la recherche vectorielle
   */
  async indexContent(
    contentType: string,
    contentId: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Générer l'embedding du contenu
      const embedding = await this.generateContentEmbedding(content);

      // Insérer ou mettre à jour dans la base de données
      const { error } = await supabase
        .from('vector_embeddings')
        .upsert({
          content_type: contentType,
          content_id: contentId,
          embedding,
          metadata,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'content_type,content_id'
        });

      if (error) throw error;

      console.log(`✅ Contenu indexé: ${contentType}/${contentId}`);

    } catch (error) {
      console.error('❌ Erreur indexation contenu:', error);
      throw new Error(`Échec de l'indexation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Génère l'embedding du contenu
   */
  private async generateContentEmbedding(content: string): Promise<number[]> {
    try {
      // Appeler l'API OpenAI pour générer l'embedding
      const response = await fetch('/api/generate-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content }),
      });

      if (!response.ok) {
        throw new Error('Erreur génération embedding');
      }

      const data = await response.json();
      return data.embedding;

    } catch (error) {
      console.error('❌ Erreur génération embedding contenu:', error);
      throw new Error('Impossible de générer l\'embedding du contenu');
    }
  }

  /**
   * Supprime un contenu de l'index
   */
  async removeFromIndex(contentType: string, contentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vector_embeddings')
        .delete()
        .eq('content_type', contentType)
        .eq('content_id', contentId);

      if (error) throw error;

      console.log(`✅ Contenu supprimé de l'index: ${contentType}/${contentId}`);

    } catch (error) {
      console.error('❌ Erreur suppression index:', error);
      throw new Error(`Échec de la suppression de l'index: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour l'index d'un contenu
   */
  async updateIndex(
    contentType: string,
    contentId: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.indexContent(contentType, contentId, content, metadata);
  }

  /**
   * Recherche des suggestions de requêtes
   */
  async getQuerySuggestions(partialQuery: string, limit: number = 5): Promise<string[]> {
    try {
      const { data, error } = await supabase.rpc('get_query_suggestions', {
        partial_query: partialQuery,
        limit
      });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('❌ Erreur suggestions requêtes:', error);
      return [];
    }
  }

  /**
   * Obtient les statistiques de recherche
   */
  async getSearchStats(workspaceId?: string): Promise<{
    totalIndexed: number;
    indexByType: Record<string, number>;
    averageRelevance: number;
    lastIndexed: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_search_stats', {
        workspace_id: workspaceId
      });

      if (error) throw error;
      
      return {
        totalIndexed: data?.total_indexed || 0,
        indexByType: data?.index_by_type || {},
        averageRelevance: data?.average_relevance || 0,
        lastIndexed: data?.last_indexed || new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erreur statistiques recherche:', error);
      return {
        totalIndexed: 0,
        indexByType: {},
        averageRelevance: 0,
        lastIndexed: new Date().toISOString()
      };
    }
  }

  /**
   * Recherche avancée avec filtres multiples
   */
  async advancedSearch(options: SearchOptions): Promise<{
    results: SearchResult[];
    total: number;
    facets: {
      types: Record<string, number>;
      tags: Record<string, number>;
      workspaces: Record<string, number>;
      dateRanges: Record<string, number>;
    };
  }> {
    try {
      // Effectuer la recherche principale
      const results = await this.semanticSearch(options);

      // Obtenir les facettes
      const facets = await this.getSearchFacets(options);

      // Obtenir le nombre total
      const total = await this.getTotalResults(options);

      return {
        results,
        total,
        facets
      };

    } catch (error) {
      console.error('❌ Erreur recherche avancée:', error);
      throw new Error(`Échec de la recherche avancée: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Obtient les facettes de recherche
   */
  private async getSearchFacets(options: SearchOptions): Promise<{
    types: Record<string, number>;
    tags: Record<string, number>;
    workspaces: Record<string, number>;
    dateRanges: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_search_facets', {
        search_query: options.query,
        filters: options.filters
      });

      if (error) throw error;
      
      return data || {
        types: {},
        tags: {},
        workspaces: {},
        dateRanges: {}
      };

    } catch (error) {
      console.error('❌ Erreur facettes recherche:', error);
      return {
        types: {},
        tags: {},
        workspaces: {},
        dateRanges: {}
      };
    }
  }

  /**
   * Obtient le nombre total de résultats
   */
  private async getTotalResults(options: SearchOptions): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_search_total', {
        search_query: options.query,
        filters: options.filters
      });

      if (error) throw error;
      return data || 0;

    } catch (error) {
      console.error('❌ Erreur total résultats:', error);
      return 0;
    }
  }

  /**
   * Recherche par similarité de contenu
   */
  async findSimilarContent(
    contentType: string,
    contentId: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase.rpc('find_similar_content', {
        content_type: contentType,
        content_id: contentId,
        limit
      });

      if (error) throw error;

      return (data || []).map((result: any) => ({
        id: result.content_id,
        type: result.content_type,
        title: result.title,
        content: result.content,
        excerpt: result.excerpt,
        relevanceScore: result.similarity,
        semanticScore: result.similarity,
        fullTextScore: 0,
        metadata: result.metadata,
        highlights: [],
        url: this.generateUrl(result.content_type, result.content_id)
      }));

    } catch (error) {
      console.error('❌ Erreur recherche similarité:', error);
      return [];
    }
  }

  /**
   * Optimise les performances de recherche
   */
  async optimizeSearchIndex(): Promise<void> {
    try {
      // Appeler une fonction de maintenance de l'index
      const { error } = await supabase.rpc('optimize_search_index');

      if (error) throw error;

      console.log('✅ Index de recherche optimisé');

    } catch (error) {
      console.error('❌ Erreur optimisation index:', error);
      throw new Error(`Échec de l'optimisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

// Instance singleton
export const semanticSearchService = new SemanticSearchService();

// Export des fonctions utilitaires
export const semanticSearch = (options: SearchOptions) => 
  semanticSearchService.semanticSearch(options);

export const indexContent = (
  contentType: string,
  contentId: string,
  content: string,
  metadata?: Record<string, any>
) => semanticSearchService.indexContent(contentType, contentId, content, metadata);

export const removeFromIndex = (contentType: string, contentId: string) => 
  semanticSearchService.removeFromIndex(contentType, contentId);

export const updateIndex = (
  contentType: string,
  contentId: string,
  content: string,
  metadata?: Record<string, any>
) => semanticSearchService.updateIndex(contentType, contentId, content, metadata);

export const advancedSearch = (options: SearchOptions) => 
  semanticSearchService.advancedSearch(options);

export const findSimilarContent = (
  contentType: string,
  contentId: string,
  limit?: number
) => semanticSearchService.findSimilarContent(contentType, contentId, limit);

export const getSearchStats = (workspaceId?: string) => 
  semanticSearchService.getSearchStats(workspaceId);

export const getQuerySuggestions = (partialQuery: string, limit?: number) => 
  semanticSearchService.getQuerySuggestions(partialQuery, limit);
