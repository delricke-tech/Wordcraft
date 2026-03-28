/**
 * Service de tri personnalisé (nom, date, taille, pertinence)
 * 
 * Ce service permet de trier les contenus selon des critères personnalisés
 * avec algorithmes avancés et métadonnées de pertinence
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface SortCriterion {
  field: string;
  direction: 'asc' | 'desc';
  weight?: number;
  algorithm?: SortAlgorithm;
}

export type SortAlgorithm = 
  | 'alphabetical'
  | 'numeric'
  | 'date'
  | 'size'
  | 'relevance'
  | 'popularity'
  | 'recent'
  | 'custom';

export interface SortConfiguration {
  id: string;
  name: string;
  description?: string;
  target: 'documents' | 'notes' | 'conversations' | 'flashcards' | 'quiz' | 'all';
  criteria: SortCriterion[];
  defaultSort?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

export interface SortOptions {
  target: 'documents' | 'notes' | 'conversations' | 'flashcards' | 'quiz' | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  customConfig?: SortConfiguration;
  includeMetadata?: boolean;
  limit?: number;
  offset?: number;
  workspaceId?: string;
  userId?: string;
}

export interface SortResult<T = any> {
  items: T[];
  totalCount: number;
  sortedCount: number;
  executionTime: number;
  appliedSort: SortCriterion[];
  metadata?: SortMetadata;
}

export interface SortMetadata {
  algorithm: string;
  fieldTypes: Record<string, string>;
  processingTime: number;
  cacheHit: boolean;
  facets?: Record<string, any>;
}

export interface SortFieldDefinition {
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'array';
  sortable: boolean;
  defaultDirection: 'asc' | 'desc';
  algorithm?: SortAlgorithm;
  weight?: number;
  description?: string;
  category?: string;
}

class CustomSortingService {

  /**
   * Définition des champs de tri disponibles pour chaque type de contenu
   */
  private readonly FIELD_DEFINITIONS: Record<string, SortFieldDefinition[]> = {
    documents: [
      { field: 'title', label: 'Titre', type: 'text', sortable: true, defaultDirection: 'asc', algorithm: 'alphabetical', weight: 1.0, category: 'basic' },
      { field: 'document_name', label: 'Nom du fichier', type: 'text', sortable: true, defaultDirection: 'asc', algorithm: 'alphabetical', weight: 1.0, category: 'basic' },
      { field: 'file_size', label: 'Taille', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'size', weight: 0.8, category: 'metadata' },
      { field: 'extracted_text_length', label: 'Longueur du texte', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'size', weight: 0.7, category: 'content' },
      { field: 'word_count', label: 'Nombre de mots', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'size', weight: 0.9, category: 'content' },
      { field: 'created_at', label: 'Date de création', type: 'date', sortable: true, defaultDirection: 'desc', algorithm: 'date', weight: 1.0, category: 'temporal' },
      { field: 'updated_at', label: 'Date de modification', type: 'date', sortable: true, defaultDirection: 'desc', algorithm: 'recent', weight: 1.0, category: 'temporal' },
      { field: 'file_type', label: 'Type de fichier', type: 'text', sortable: true, defaultDirection: 'asc', algorithm: 'alphabetical', weight: 0.6, category: 'metadata' },
      { field: 'relevance_score', label: 'Score de pertinence', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'relevance', weight: 1.2, category: 'ai' },
      { field: 'access_count', label: 'Nombre d\'accès', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'popularity', weight: 0.8, category: 'usage' },
      { field: 'tags', label: 'Tags', type: 'array', sortable: false, defaultDirection: 'asc', category: 'metadata' }
    ],
    notes: [
      { field: 'title', label: 'Titre', type: 'text', sortable: true, defaultDirection: 'asc', algorithm: 'alphabetical', weight: 1.0, category: 'basic' },
      { field: 'content', label: 'Contenu', type: 'text', sortable: true, defaultDirection: 'asc', algorithm: 'alphabetical', weight: 0.8, category: 'content' },
      { field: 'plain_content', label: 'Contenu texte brut', type: 'text', sortable: true, defaultDirection: 'asc', algorithm: 'alphabetical', weight: 0.8, category: 'content' },
      { field: 'word_count', label: 'Nombre de mots', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'size', weight: 0.9, category: 'content' },
      { field: 'reading_time', label: 'Temps de lecture', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'size', weight: 0.7, category: 'content' },
      { field: 'created_at', label: 'Date de création', type: 'date', sortable: true, defaultDirection: 'desc', algorithm: 'date', weight: 1.0, category: 'temporal' },
      { field: 'updated_at', label: 'Date de modification', type: 'date', sortable: true, defaultDirection: 'desc', algorithm: 'recent', weight: 1.0, category: 'temporal' },
      { field: 'is_favorite', label: 'Favori', type: 'boolean', sortable: true, defaultDirection: 'desc', weight: 1.1, category: 'user' },
      { field: 'is_pinned', label: 'Épinglé', type: 'boolean', sortable: true, defaultDirection: 'desc', weight: 1.1, category: 'user' },
      { field: 'is_archived', label: 'Archivé', type: 'boolean', sortable: true, defaultDirection: 'desc', weight: 0.8, category: 'status' },
      { field: 'access_count', label: 'Nombre d\'accès', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'popularity', weight: 0.8, category: 'usage' },
      { field: 'color', label: 'Couleur', type: 'text', sortable: true, defaultDirection: 'asc', algorithm: 'alphabetical', weight: 0.5, category: 'metadata' }
    ],
    conversations: [
      { field: 'title', label: 'Titre', type: 'text', sortable: true, defaultDirection: 'asc', algorithm: 'alphabetical', weight: 1.0, category: 'basic' },
      { field: 'message_count', label: 'Nombre de messages', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'size', weight: 0.8, category: 'content' },
      { field: 'total_words', label: 'Nombre total de mots', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'size', weight: 0.9, category: 'content' },
      { field: 'created_at', label: 'Date de création', type: 'date', sortable: true, defaultDirection: 'desc', algorithm: 'date', weight: 1.0, category: 'temporal' },
      { field: 'updated_at', label: 'Date de modification', type: 'date', sortable: true, defaultDirection: 'desc', algorithm: 'recent', weight: 1.0, category: 'temporal' },
      { field: 'has_citations', label: 'Contient des citations', type: 'boolean', sortable: true, defaultDirection: 'desc', weight: 0.7, category: 'content' },
      { field: 'quality_score', label: 'Score de qualité', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'relevance', weight: 1.2, category: 'ai' }
    ],
    flashcards: [
      { field: 'question', label: 'Question', type: 'text', sortable: true, defaultDirection: 'asc', algorithm: 'alphabetical', weight: 1.0, category: 'basic' },
      { field: 'answer', label: 'Réponse', type: 'text', sortable: true, defaultDirection: 'asc', algorithm: 'alphabetical', weight: 0.8, category: 'content' },
      { field: 'difficulty', label: 'Difficulté', type: 'text', sortable: true, defaultDirection: 'asc', algorithm: 'alphabetical', weight: 0.7, category: 'metadata' },
      { field: 'created_at', label: 'Date de création', type: 'date', sortable: true, defaultDirection: 'desc', algorithm: 'date', weight: 1.0, category: 'temporal' },
      { field: 'last_reviewed', label: 'Dernière révision', type: 'date', sortable: true, defaultDirection: 'desc', algorithm: 'recent', weight: 0.9, category: 'temporal' },
      { field: 'review_count', label: 'Nombre de révisions', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'popularity', weight: 0.8, category: 'usage' },
      { field: 'success_rate', label: 'Taux de succès', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'relevance', weight: 1.1, category: 'performance' },
      { field: 'next_review_date', label: 'Prochaine révision', type: 'date', sortable: true, defaultDirection: 'asc', algorithm: 'date', weight: 0.8, category: 'temporal' },
      { field: 'is_favorite', label: 'Favori', type: 'boolean', sortable: true, defaultDirection: 'desc', weight: 1.1, category: 'user' }
    ],
    quiz: [
      { field: 'title', label: 'Titre', type: 'text', sortable: true, defaultDirection: 'asc', algorithm: 'alphabetical', weight: 1.0, category: 'basic' },
      { field: 'question_count', label: 'Nombre de questions', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'size', weight: 0.8, category: 'content' },
      { field: 'difficulty', label: 'Difficulté', type: 'text', sortable: true, defaultDirection: 'asc', algorithm: 'alphabetical', weight: 0.7, category: 'metadata' },
      { field: 'created_at', label: 'Date de création', type: 'date', sortable: true, defaultDirection: 'desc', algorithm: 'date', weight: 1.0, category: 'temporal' },
      { field: 'time_limit', label: 'Limite de temps', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'size', weight: 0.7, category: 'metadata' },
      { field: 'passing_score', label: 'Score de réussite', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'relevance', weight: 0.9, category: 'performance' },
      { field: 'completion_rate', label: 'Taux de complétion', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'relevance', weight: 1.0, category: 'performance' },
      { field: 'average_score', label: 'Score moyen', type: 'number', sortable: true, defaultDirection: 'desc', algorithm: 'relevance', weight: 1.1, category: 'performance' },
      { field: 'is_public', label: 'Public', type: 'boolean', sortable: true, defaultDirection: 'desc', weight: 0.8, category: 'sharing' }
    ]
  };

  /**
   * Applique un tri personnalisé sur un ensemble de données
   */
  async applySort<T = any>(options: SortOptions): Promise<SortResult<T>> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 ===== TRI PERSONNALISÉ =====');
      console.log('  - Target:', options.target);
      console.log('  - Sort by:', options.sortBy);
      console.log('  - Order:', options.sortOrder);

      // Construire la configuration de tri
      const sortConfig = this.buildSortConfiguration(options);
      
      // Exécuter le tri
      const { data, error } = await supabase.rpc('execute_custom_sort', {
        target_table: options.target,
        sort_config: sortConfig,
        include_metadata: options.includeMetadata || false,
        limit: options.limit || 50,
        offset: options.offset || 0,
        workspace_id: options.workspaceId,
        user_id: options.userId
      });

      if (error) throw error;

      const executionTime = Date.now() - startTime;

      const result: SortResult<T> = {
        items: data?.items || [],
        totalCount: data?.total_count || 0,
        sortedCount: data?.sorted_count || 0,
        executionTime,
        appliedSort: sortConfig.criteria,
        metadata: data?.metadata
      };

      console.log(`✅ Tri appliqué: ${result.sortedCount} éléments triés (${executionTime}ms)`);
      return result;

    } catch (error) {
      console.error('❌ Erreur application tri:', error);
      throw new Error(`Échec du tri: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Construit la configuration de tri
   */
  private buildSortConfiguration(options: SortOptions): SortConfiguration {
    const criteria: SortCriterion[] = [];

    // Si une configuration personnalisée est fournie
    if (options.customConfig) {
      return options.customConfig;
    }

    // Sinon, construire à partir des options simples
    if (options.sortBy) {
      const fieldDef = this.getFieldDefinition(options.target, options.sortBy);
      if (fieldDef && fieldDef.sortable) {
        criteria.push({
          field: options.sortBy,
          direction: options.sortOrder || fieldDef.defaultDirection,
          weight: fieldDef.weight || 1.0,
          algorithm: fieldDef.algorithm || 'alphabetical'
        });
      }
    }

    // Configuration par défaut si aucun critère spécifié
    if (criteria.length === 0) {
      const defaultField = this.getDefaultSortField(options.target);
      criteria.push({
        field: defaultField.field,
        direction: defaultField.defaultDirection,
        weight: defaultField.weight || 1.0,
        algorithm: defaultField.algorithm || 'alphabetical'
      });
    }

    return {
      id: `default_${Date.now()}`,
      name: 'Tri par défaut',
      target: options.target,
      criteria,
      defaultSort: true,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Obtient le champ de tri par défaut pour un type de contenu
   */
  private getDefaultSortField(target: string): SortFieldDefinition {
    const fields = this.FIELD_DEFINITIONS[target] || [];
    
    // Prioriser les champs récents, puis pertinence, puis alphabétique
    const recentFields = fields.filter(f => f.category === 'temporal');
    const relevanceFields = fields.filter(f => f.category === 'ai' || f.category === 'relevance');
    const basicFields = fields.filter(f => f.category === 'basic');

    return recentFields[0] || relevanceFields[0] || basicFields[0] || fields[0];
  }

  /**
   * Tri côté client avec algorithmes personnalisés
   */
  applySortLocal<T extends Record<string, any>>(
    items: T[],
    config: SortConfiguration
  ): T[] {
    try {
      console.log('🔄 Tri côté client avec configuration:', config.name);

      // Appliquer les critères de tri selon l'algorithme
      let sortedItems = [...items];

      for (const criterion of config.criteria) {
        sortedItems = this.sortByCriterion(sortedItems, criterion);
      }

      console.log(`✅ ${sortedItems.length} éléments triés côté client`);
      return sortedItems;

    } catch (error) {
      console.error('❌ Erreur tri côté client:', error);
      return items;
    }
  }

  /**
   * Trie selon un critère spécifique
   */
  private sortByCriterion<T extends Record<string, any>>(
    items: T[],
    criterion: SortCriterion
  ): T[] {
    const algorithm = criterion.algorithm || 'alphabetical';
    const field = criterion.field;
    const direction = criterion.direction || 'asc';
    const weight = criterion.weight || 1.0;

    switch (algorithm) {
      case 'alphabetical':
        return this.sortAlphabetically(items, field, direction, weight);
      case 'numeric':
        return this.sortNumerically(items, field, direction, weight);
      case 'date':
        return this.sortByDate(items, field, direction, weight);
      case 'size':
        return this.sortBySize(items, field, direction, weight);
      case 'relevance':
        return this.sortByRelevance(items, field, direction, weight);
      case 'popularity':
        return this.sortByPopularity(items, field, direction, weight);
      case 'recent':
        return this.sortByRecency(items, field, direction, weight);
      case 'custom':
        return this.sortCustom(items, field, direction, weight);
      default:
        return this.sortAlphabetically(items, field, direction, weight);
    }
  }

  /**
   * Tri alphabétique avec gestion des accents et casse
   */
  private sortAlphabetically<T extends Record<string, any>>(
    items: T[],
    field: string,
    direction: 'asc' | 'desc',
    weight: number
  ): T[] {
    return items.sort((a, b) => {
      const aValue = this.normalizeString(a[field]);
      const bValue = this.normalizeString(b[field]);
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;
      
      return direction === 'desc' ? comparison * weight : comparison * -weight;
    });
  }

  /**
   * Tri numérique avec gestion des valeurs nulles
   */
  private sortNumerically<T extends Record<string, any>>(
    items: T[],
    field: string,
    direction: 'asc' | 'desc',
    weight: number
  ): T[] {
    return items.sort((a, b) => {
      const aValue = Number(a[field]) || 0;
      const bValue = Number(b[field]) || 0;
      
      const comparison = aValue - bValue;
      return direction === 'desc' ? comparison * weight : comparison * -weight;
    });
  }

  /**
   * Tri par date avec gestion des formats multiples
   */
  private sortByDate<T extends Record<string, any>>(
    items: T[],
    field: string,
    direction: 'asc' | 'desc',
    weight: number
  ): T[] {
    return items.sort((a, b) => {
      const aValue = new Date(a[field] || 0).getTime();
      const bValue = new Date(b[field] || 0).getTime();
      
      const comparison = aValue - bValue;
      return direction === 'desc' ? comparison * weight : comparison * -weight;
    });
  }

  /**
   * Tri par taille (taille de fichier, nombre de mots, etc.)
   */
  private sortBySize<T extends Record<string, any>>(
    items: T[],
    field: string,
    direction: 'asc' | 'desc',
    weight: number
  ): T[] {
    return items.sort((a, b) => {
      const aValue = this.extractSize(a[field]);
      const bValue = this.extractSize(b[field]);
      
      const comparison = aValue - bValue;
      return direction === 'desc' ? comparison * weight : comparison * -weight;
    });
  }

  /**
   * Tri par pertinence avec scoring personnalisé
   */
  private sortByRelevance<T extends Record<string, any>>(
    items: T[],
    field: string,
    direction: 'asc' | 'desc',
    weight: number
  ): T[] {
    return items.sort((a, b) => {
      const aValue = this.calculateRelevance(a, field);
      const bValue = this.calculateRelevance(b, field);
      
      const comparison = aValue - bValue;
      return direction === 'desc' ? comparison * weight : comparison * -weight;
    });
  }

  /**
   * Tri par popularité (accès, vues, etc.)
   */
  private sortByPopularity<T extends Record<string, any>>(
    items: T[],
    field: string,
    direction: 'asc' | 'desc',
    weight: number
  ): T[] {
    return items.sort((a, b) => {
      const aValue = Number(a[field]) || 0;
      const bValue = Number(b[field]) || 0;
      
      const comparison = aValue - bValue;
      return direction === 'desc' ? comparison * weight : comparison * -weight;
    });
  }

  /**
   * Tri par récence (date la plus récente)
   */
  private sortByRecency<T extends Record<string, any>>(
    items: T[],
    field: string,
    direction: 'asc' | 'desc',
    weight: number
  ): T[] {
    const now = Date.now();
    
    return items.sort((a, b) => {
      const aValue = now - new Date(a[field] || 0).getTime();
      const bValue = now - new Date(b[field] || 0).getTime();
      
      const comparison = aValue - bValue;
      return direction === 'desc' ? comparison * weight : comparison * -weight;
    });
  }

  /**
   * Tri personnalisé avec algorithme custom
   */
  private sortCustom<T extends Record<string, any>>(
    items: T[],
    field: string,
    direction: 'asc' | 'desc',
    weight: number
  ): T[] {
    // Algorithme custom basé sur plusieurs facteurs
    return items.sort((a, b) => {
      const scoreA = this.calculateCustomScore(a, field);
      const scoreB = this.calculateCustomScore(b, field);
      
      const comparison = scoreA - scoreB;
      return direction === 'desc' ? comparison * weight : comparison * -weight;
    });
  }

  /**
   * Normalise une chaîne de caractères pour le tri alphabétique
   */
  private normalizeString(str: any): string {
    if (typeof str !== 'string') return String(str || '');
    
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .trim();
  }

  /**
   * Extrait une valeur de taille depuis différents formats
   */
  private extractSize(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Extraire les nombres d'une chaîne (ex: "1.2 MB" -> 1258211)
      const match = value.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }
    if (Array.isArray(value)) return value.length;
    return 0;
  }

  /**
   * Calcule un score de pertinence pour un élément
   */
  private calculateRelevance(item: Record<string, any>, field: string): number {
    let score = 0;
    
    // Score de base
    const fieldValue = item[field];
    if (fieldValue) {
      if (typeof fieldValue === 'number') {
        score = fieldValue;
      } else if (typeof fieldValue === 'string') {
        score = fieldValue.length * 0.1; // Longueur du texte
      }
    }
    
    // Bonus pour les éléments favoris
    if (item.is_favorite) score += 10;
    if (item.is_pinned) score += 5;
    
    // Bonus pour les éléments récemment modifiés
    const updatedDays = (Date.now() - new Date(item.updated_at || 0).getTime()) / (1000 * 60 * 60 * 24);
    if (updatedDays < 7) score += 3;
    if (updatedDays < 1) score += 5;
    
    // Bonus pour les éléments avec beaucoup d'interactions
    if (item.access_count) score += Math.min(item.access_count * 0.1, 5);
    
    return score;
  }

  /**
   * Calcule un score personnalisé complexe
   */
  private calculateCustomScore(item: Record<string, any>, field: string): number {
    let score = 0;
    
    // Facteur principal : valeur du champ
    const fieldValue = item[field];
    if (fieldValue) {
      score += this.extractSize(fieldValue) * 0.3;
    }
    
    // Facteurs secondaires
    if (item.word_count) score += item.word_count * 0.2;
    if (item.is_favorite) score += 15;
    if (item.is_pinned) score += 10;
    if (item.access_count) score += Math.min(item.access_count * 0.5, 10);
    
    // Facteur temporel (plus récent = plus de points)
    const daysSinceUpdate = (Date.now() - new Date(item.updated_at || 0).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysSinceUpdate * 0.5);
    
    // Facteur de qualité
    if (item.quality_score) score += item.quality_score * 0.4;
    if (item.success_rate) score += item.success_rate * 0.3;
    
    return score;
  }

  /**
   * Sauvegarde une configuration de tri
   */
  async saveSortConfiguration(config: Partial<SortConfiguration>): Promise<SortConfiguration> {
    try {
      const { data, error } = await supabase
        .from('sort_configurations')
        .upsert({
          name: config.name!,
          description: config.description,
          target: config.target!,
          criteria: config.criteria || [],
          default_sort: config.defaultSort || false,
          created_by: config.createdBy!,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de sauvegarder la configuration de tri');

      console.log('✅ Configuration de tri sauvegardée:', data.name);
      return data;

    } catch (error) {
      console.error('❌ Erreur sauvegarde configuration tri:', error);
      throw new Error(`Échec de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les configurations de tri d'un utilisateur
   */
  async getUserSortConfigurations(userId: string, target?: string): Promise<SortConfiguration[]> {
    try {
      let query = supabase
        .from('sort_configurations')
        .select('*')
        .eq('created_by', userId);

      if (target) {
        query = query.eq('target', target);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('❌ Erreur récupération configurations tri:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Supprime une configuration de tri
   */
  async deleteSortConfiguration(configId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sort_configurations')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      console.log('✅ Configuration de tri supprimée');

    } catch (error) {
      console.error('❌ Erreur suppression configuration tri:', error);
      throw new Error(`Échec de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Obtient les définitions de champs pour un type de contenu
   */
  getFieldDefinitions(target: string): SortFieldDefinition[] {
    return this.FIELD_DEFINITIONS[target] || [];
  }

  /**
   * Obtient un champ spécifique pour un type de contenu
   */
  getFieldDefinition(target: string, field: string): SortFieldDefinition | undefined {
    return this.FIELD_DEFINITIONS[target]?.find(f => f.field === field);
  }

  /**
   * Valide une configuration de tri
   */
  validateSortConfiguration(config: SortConfiguration): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifier le nom
    if (!config.name || config.name.trim().length === 0) {
      errors.push('Le nom de la configuration est requis');
    }

    // Vérifier les critères
    if (!config.criteria || config.criteria.length === 0) {
      warnings.push('Aucun critère de tri défini');
    } else {
      config.criteria.forEach((criterion, index) => {
        const validation = this.validateCriterion(criterion, config.target);
        if (!validation.isValid) {
          errors.push(`Critère ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });
    }

    // Vérifier la cible
    if (!config.target || !['documents', 'notes', 'conversations', 'flashcards', 'quiz', 'all'].includes(config.target)) {
      errors.push('La cible est invalide');
    }

    // Avertissements
    if (config.criteria && config.criteria.length > 5) {
      warnings.push('Beaucoup de critères peuvent affecter les performances');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valide un critère de tri
   */
  private validateCriterion(criterion: SortCriterion, target: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Vérifier le champ
    if (!criterion.field || criterion.field.trim().length === 0) {
      errors.push('Le champ est requis');
    } else {
      const fieldDef = this.getFieldDefinition(target, criterion.field);
      if (!fieldDef) {
        errors.push('Le champ n\'existe pas pour cette cible');
      } else if (!fieldDef.sortable) {
        errors.push('Ce champ n\'est pas triable');
      }
    }

    // Vérifier la direction
    if (!criterion.direction || !['asc', 'desc'].includes(criterion.direction)) {
      errors.push('La direction doit être asc ou desc');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Génère des suggestions de tri basées sur l'usage
   */
  async generateSortSuggestions(userId: string, target: string): Promise<{
    popularFields: Array<{ field: string; count: number }>;
    popularDirections: Record<string, 'asc' | 'desc'>;
    suggestedSorts: SortConfiguration[];
  }> {
    try {
      const { data, error } = await supabase.rpc('generate_sort_suggestions', {
        user_id: userId,
        target_type: target
      });

      if (error) throw error;

      return data || {
        popularFields: [],
        popularDirections: {},
        suggestedSorts: []
      };

    } catch (error) {
      console.error('❌ Erreur génération suggestions tri:', error);
      return {
        popularFields: [],
        popularDirections: {},
        suggestedSorts: []
      };
    }
  }

  /**
   * Exporte une configuration de tri au format JSON
   */
  exportSortConfiguration(config: SortConfiguration): string {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Importe une configuration de tri depuis du JSON
   */
  importSortConfiguration(jsonString: string, target: string): SortConfiguration {
    try {
      const config = JSON.parse(jsonString);
      config.target = target; // Forcer la cible
      
      // Validation
      const validation = this.validateSortConfiguration(config);
      if (!validation.isValid) {
        throw new Error(`Configuration invalide: ${validation.errors.join(', ')}`);
      }

      return config;

    } catch (error) {
      console.error('❌ Erreur import configuration tri:', error);
      throw new Error(`Échec de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

// Instance singleton
export const customSortingService = new CustomSortingService();

// Export des fonctions utilitaires
export const applySort = <T = any>(options: SortOptions) => 
  customSortingService.applySort<T>(options);

export const applySortLocal = <T extends Record<string, any>>(
  items: T[],
  config: SortConfiguration
) => customSortingService.applySortLocal(items, config);

export const saveSortConfiguration = (config: Partial<SortConfiguration>) => 
  customSortingService.saveSortConfiguration(config);

export const getUserSortConfigurations = (userId: string, target?: string) => 
  customSortingService.getUserSortConfigurations(userId, target);

export const deleteSortConfiguration = (configId: string) => 
  customSortingService.deleteSortConfiguration(configId);

export const getFieldDefinitions = (target: string) => 
  customSortingService.getFieldDefinitions(target);

export const validateSortConfiguration = (config: SortConfiguration) => 
  customSortingService.validateSortConfiguration(config);

// NOUVELLES FONCTIONNALITÉS AVANCÉES

/**
 * Interface pour les documents avec métadonnées étendues
 */
export interface DocumentWithMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  content?: string;
  tags?: string[];
  author?: string;
  folder?: string;
  isFavorite?: boolean;
  isShared?: boolean;
  sharedWith?: string[];
  metadata?: Record<string, any>;
  excerpt?: string;
  wordCount?: number;
  pageCount?: number;
  language?: string;
  status?: 'draft' | 'published' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  // Métadonnées de pertinence
  relevanceScore?: number;
  viewCount?: number;
  downloadCount?: number;
  shareCount?: number;
  lastAccessed?: Date;
  rating?: number;
  reviewCount?: number;
}

/**
 * Options de tri avancées
 */
export interface AdvancedSortOptions {
  target: 'documents' | 'notes' | 'conversations' | 'flashcards' | 'quiz' | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  customConfig?: SortConfiguration;
  includeMetadata?: boolean;
  limit?: number;
  offset?: number;
  workspaceId?: string;
  userId?: string;
  // Nouvelles options
  relevanceWeights?: {
    name?: number;
    content?: number;
    tags?: number;
    author?: number;
    date?: number;
    size?: number;
    popularity?: number;
    favorites?: number;
  };
  multiLevelSort?: boolean;
  groupBy?: string;
  includeEmpty?: boolean;
  caseSensitive?: boolean;
  locale?: string;
}

/**
 * Résultat de tri avec statistiques
 */
export interface SortResult<T = any> {
  items: T[];
  totalCount: number;
  sortedCount: number;
  groups?: Record<string, T[]>;
  statistics: {
    executionTime: number;
    algorithmUsed: string;
    comparisons: number;
    swaps: number;
    efficiency: number;
  };
  metadata?: {
    sortFields: string[];
    sortDirections: string[];
    groups: string[];
    emptyFields: string[];
  };
}

/**
 * Calcule le score de pertinence d'un document
 */
export function calculateRelevanceScore(
  document: DocumentWithMetadata,
  weights: AdvancedSortOptions['relevanceWeights'] = {}
): number {
  const defaultWeights = {
    name: 0.3,
    content: 0.25,
    tags: 0.15,
    author: 0.1,
    date: 0.1,
    size: 0.05,
    popularity: 0.03,
    favorites: 0.02
  };
  
  const finalWeights = { ...defaultWeights, ...weights };
  let score = 0;
  
  // Score basé sur le nom
  if (document.name) {
    score += finalWeights.name! * (document.name.length > 10 ? 1 : 0.8);
  }
  
  // Score basé sur le contenu
  if (document.content) {
    const contentLength = document.content.length;
    if (contentLength > 1000) score += finalWeights.content! * 1;
    else if (contentLength > 500) score += finalWeights.content! * 0.8;
    else if (contentLength > 100) score += finalWeights.content! * 0.6;
    else score += finalWeights.content! * 0.4;
  }
  
  // Score basé sur les tags
  if (document.tags && document.tags.length > 0) {
    score += finalWeights.tags! * Math.min(document.tags.length / 5, 1);
  }
  
  // Score basé sur l'auteur
  if (document.author) {
    score += finalWeights.author! * 0.8;
  }
  
  // Score basé sur la date (plus récent = meilleur)
  if (document.updatedAt) {
    const daysSinceUpdate = (Date.now() - document.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSinceUpdate / 365); // Décroît sur 1 an
    score += finalWeights.date! * recencyScore;
  }
  
  // Score basé sur la taille (taille modérée = meilleur)
  if (document.size) {
    const sizeMB = document.size / (1024 * 1024);
    let sizeScore = 0;
    if (sizeMB < 1) sizeScore = 0.3;
    else if (sizeMB < 10) sizeScore = 1;
    else if (sizeMB < 50) sizeScore = 0.8;
    else sizeScore = 0.5;
    score += finalWeights.size! * sizeScore;
  }
  
  // Score basé sur la popularité
  const popularity = (document.viewCount || 0) + (document.downloadCount || 0) + (document.shareCount || 0);
  if (popularity > 0) {
    score += finalWeights.popularity! * Math.min(popularity / 100, 1);
  }
  
  // Score basé sur les favoris
  if (document.isFavorite) {
    score += finalWeights.favorites!;
  }
  
  // Score basé sur la note
  if (document.rating) {
    score += (document.rating / 5) * 0.2; // Bonus pour les bonnes notes
  }
  
  return Math.min(score, 1); // Normaliser entre 0 et 1
}

/**
 * Tri avancé avec pertinence et multi-niveaux
 */
export function advancedSort<T extends DocumentWithMetadata>(
  items: T[],
  options: AdvancedSortOptions
): SortResult<T> {
  const startTime = Date.now();
  let comparisons = 0;
  let swaps = 0;
  
  // Calculer les scores de pertinence si nécessaire
  if (options.sortBy === 'relevance' || options.relevanceWeights) {
    items = items.map(item => ({
      ...item,
      relevanceScore: calculateRelevanceScore(item, options.relevanceWeights)
    }));
  }
  
  // Tri principal
  let sortedItems = [...items];
  const sortFields = options.sortBy ? [options.sortBy] : options.customConfig?.criteria.map(c => c.field) || ['updatedAt'];
  const sortDirections = options.sortOrder ? [options.sortOrder] : options.customConfig?.criteria.map(c => c.direction) || ['desc'];
  
  // Tri multi-niveaux
  if (options.multiLevelSort && sortFields.length > 1) {
    sortedItems.sort((a, b) => {
      for (let i = 0; i < sortFields.length; i++) {
        const field = sortFields[i];
        const direction = sortDirections[i] || 'asc';
        
        const aValue = getNestedValue(a, field);
        const bValue = getNestedValue(b, field);
        
        comparisons++;
        
        let comparison = 0;
        
        if (aValue === null || aValue === undefined) comparison = -1;
        else if (bValue === null || bValue === undefined) comparison = 1;
        else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = options.caseSensitive 
            ? aValue.localeCompare(bValue, options.locale)
            : aValue.toLowerCase().localeCompare(bValue.toLowerCase(), options.locale);
        } else {
          comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
        
        if (comparison !== 0) {
          swaps++;
          return direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  } else {
    // Tri simple
    const field = sortFields[0] || 'updatedAt';
    const direction = sortDirections[0] || 'desc';
    
    sortedItems.sort((a, b) => {
      const aValue = getNestedValue(a, field);
      const bValue = getNestedValue(b, field);
      
      comparisons++;
      
      let comparison = 0;
      
      if (aValue === null || aValue === undefined) comparison = -1;
      else if (bValue === null || bValue === undefined) comparison = 1;
      else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = options.caseSensitive 
          ? aValue.localeCompare(bValue, options.locale)
          : aValue.toLowerCase().localeCompare(bValue.toLowerCase(), options.locale);
      } else {
        comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
      
      if (comparison !== 0) {
        swaps++;
      }
      
      return direction === 'desc' ? -comparison : comparison;
    });
  }
  
  // Grouper les résultats si demandé
  let groups: Record<string, T[]> | undefined;
  if (options.groupBy) {
    groups = sortedItems.reduce((acc, item) => {
      const groupValue = String(getNestedValue(item, options.groupBy!) || 'unknown');
      if (!acc[groupValue]) acc[groupValue] = [];
      acc[groupValue].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }
  
  const executionTime = Date.now() - startTime;
  const efficiency = items.length > 0 ? (items.length / (comparisons + 1)) : 0;
  
  return {
    items: sortedItems,
    totalCount: items.length,
    sortedCount: sortedItems.length,
    groups,
    statistics: {
      executionTime,
      algorithmUsed: options.multiLevelSort ? 'multi-level-quick-sort' : 'standard-sort',
      comparisons,
      swaps,
      efficiency
    },
    metadata: {
      sortFields,
      sortDirections,
      groups: options.groupBy ? Object.keys(groups || {}) : [],
      emptyFields: sortFields.filter(field => 
        items.every(item => getNestedValue(item, field) === null || getNestedValue(item, field) === undefined)
      )
    }
  };
}

/**
 * Tri intelligent avec apprentissage des préférences
 */
export function intelligentSort<T extends DocumentWithMetadata>(
  items: T[],
  userId: string,
  options?: Partial<AdvancedSortOptions>
): SortResult<T> {
  // Récupérer les préférences de tri de l'utilisateur
  const userPreferences = getUserSortPreferences(userId);
  
  // Combiner avec les options fournies
  const finalOptions: AdvancedSortOptions = {
    ...options,
    sortBy: options?.sortBy || userPreferences.defaultSortField,
    sortOrder: options?.sortOrder || userPreferences.defaultSortDirection,
    relevanceWeights: {
      ...userPreferences.relevanceWeights,
      ...options?.relevanceWeights
    },
    multiLevelSort: options?.multiLevelSort ?? userPreferences.preferMultiLevelSort,
    groupBy: options?.groupBy || userPreferences.defaultGroupBy
  };
  
  const result = advancedSort(items, finalOptions);
  
  // Enregistrer l'utilisation pour améliorer les futures recommandations
  recordSortUsage(userId, finalOptions);
  
  return result;
}

/**
 * Récupère les préférences de tri d'un utilisateur
 */
function getUserSortPreferences(userId: string): {
  defaultSortField: string;
  defaultSortDirection: 'asc' | 'desc';
  relevanceWeights: Record<string, number>;
  preferMultiLevelSort: boolean;
  defaultGroupBy?: string;
} {
  try {
    if (typeof localStorage === 'undefined') throw new Error('Storage indisponible');
    const saved = localStorage.getItem(`sortPreferences_${userId}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('❌ Erreur chargement préférences tri:', error);
  }
  
  // Préférences par défaut
  return {
    defaultSortField: 'updatedAt',
    defaultSortDirection: 'desc',
    relevanceWeights: {
      name: 0.3,
      content: 0.25,
      tags: 0.15,
      author: 0.1,
      date: 0.1,
      size: 0.05,
      popularity: 0.03,
      favorites: 0.02
    },
    preferMultiLevelSort: false
  };
}

/**
 * Enregistre l'utilisation d'un tri pour améliorer les recommandations
 */
function recordSortUsage(userId: string, options: AdvancedSortOptions): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const usageKey = `sortUsage_${userId}`;
    const existing = localStorage.getItem(usageKey);
    const usage = existing ? JSON.parse(existing) : { history: [], frequency: {} };
    
    // Ajouter à l'historique
    usage.history.unshift({
      timestamp: new Date().toISOString(),
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      groupBy: options.groupBy,
      multiLevelSort: options.multiLevelSort
    });
    
    // Limiter l'historique à 100 entrées
    usage.history = usage.history.slice(0, 100);
    
    // Mettre à jour les fréquences
    const sortKey = `${options.sortBy}_${options.sortOrder}`;
    usage.frequency[sortKey] = (usage.frequency[sortKey] || 0) + 1;
    
    localStorage.setItem(usageKey, JSON.stringify(usage));
  } catch (error) {
    console.error('❌ Erreur enregistrement utilisation tri:', error);
  }
}

/**
 * Génère des suggestions de tri basées sur l'historique
 */
export function generateSortSuggestions(userId: string, target: string): Array<{
  field: string;
  direction: 'asc' | 'desc';
  confidence: number;
  reason: string;
}> {
  try {
    if (typeof localStorage === 'undefined') return getDefaultSuggestions(target);
    const usageKey = `sortUsage_${userId}`;
    const existing = localStorage.getItem(usageKey);
    
    if (!existing) {
      return getDefaultSuggestions(target);
    }
    
    const usage = JSON.parse(existing);
    const suggestions: Array<{
      field: string;
      direction: 'asc' | 'desc';
      confidence: number;
      reason: string;
    }> = [];
    
    // Analyser les fréquences
    const totalSorts = Object.values(usage.frequency).reduce((sum: number, count: number) => sum + count, 0);
    
    Object.entries(usage.frequency).forEach(([sortKey, count]) => {
      const [field, direction] = sortKey.split('_');
      const confidence = count / totalSorts;
      
      if (confidence > 0.1) { // Seulement les suggestions avec >10% d'utilisation
        suggestions.push({
          field,
          direction: direction as 'asc' | 'desc',
          confidence,
          reason: `Utilisé ${count} fois (${Math.round(confidence * 100)}% du temps)`
        });
      }
    });
    
    // Trier par confiance
    suggestions.sort((a, b) => b.confidence - a.confidence);
    
    return suggestions.slice(0, 5); // Top 5 suggestions
  } catch (error) {
    console.error('❌ Erreur génération suggestions tri:', error);
    return getDefaultSuggestions(target);
  }
}

/**
 * Suggestions de tri par défaut
 */
function getDefaultSuggestions(target: string): Array<{
  field: string;
  direction: 'asc' | 'desc';
  confidence: number;
  reason: string;
}> {
  const defaultSuggestions = {
    documents: [
      { field: 'updatedAt', direction: 'desc' as const, confidence: 0.8, reason: 'Documents récents en premier' },
      { field: 'name', direction: 'asc' as const, confidence: 0.6, reason: 'Ordre alphabétique' },
      { field: 'size', direction: 'desc' as const, confidence: 0.4, reason: 'Plus gros fichiers en premier' },
      { field: 'relevanceScore', direction: 'desc' as const, confidence: 0.7, reason: 'Par pertinence' },
      { field: 'createdAt', direction: 'desc' as const, confidence: 0.5, reason: 'Plus récents créés' }
    ],
    notes: [
      { field: 'updatedAt', direction: 'desc' as const, confidence: 0.8, reason: 'Notes récentes en premier' },
      { field: 'name', direction: 'asc' as const, confidence: 0.6, reason: 'Ordre alphabétique' },
      { field: 'relevanceScore', direction: 'desc' as const, confidence: 0.7, reason: 'Par pertinence' }
    ],
    conversations: [
      { field: 'updatedAt', direction: 'desc' as const, confidence: 0.9, reason: 'Conversations récentes' },
      { field: 'name', direction: 'asc' as const, confidence: 0.5, reason: 'Ordre alphabétique' },
      { field: 'relevanceScore', direction: 'desc' as const, confidence: 0.6, reason: 'Par pertinence' }
    ],
    flashcards: [
      { field: 'updatedAt', direction: 'desc' as const, confidence: 0.8, reason: 'Cartes récentes' },
      { field: 'name', direction: 'asc' as const, confidence: 0.6, reason: 'Ordre alphabétique' },
      { field: 'relevanceScore', direction: 'desc' as const, confidence: 0.7, reason: 'Par pertinence' }
    ],
    quiz: [
      { field: 'updatedAt', direction: 'desc' as const, confidence: 0.8, reason: 'Quiz récents' },
      { field: 'name', direction: 'asc' as const, confidence: 0.6, reason: 'Ordre alphabétique' },
      { field: 'relevanceScore', direction: 'desc' as const, confidence: 0.7, reason: 'Par pertinence' }
    ]
  };
  
  return defaultSuggestions[target as keyof typeof defaultSuggestions] || defaultSuggestions.documents;
}

/**
 * Exporte les résultats de tri en multiple formats
 */
export function exportSortResults<T>(
  result: SortResult<T>,
  format: 'csv' | 'json' | 'xlsx'
): string {
  const { items, statistics, metadata } = result;
  
  switch (format) {
    case 'csv':
      return exportSortToCSV(items, statistics, metadata);
    case 'json':
      return JSON.stringify({
        items,
        statistics,
        metadata,
        exportedAt: new Date().toISOString()
      }, null, 2);
    case 'xlsx':
      // Placeholder pour export Excel
      return exportSortToCSV(items, statistics, metadata);
    default:
      return exportSortToCSV(items, statistics, metadata);
  }
}

/**
 * Export CSV des résultats de tri
 */
function exportSortToCSV<T>(
  items: T[],
  statistics: SortResult['statistics'],
  metadata?: SortResult['metadata']
): string {
  const headers = [
    'Position',
    'ID',
    'Nom',
    'Type',
    'Taille (octets)',
    'Date de création',
    'Date de modification',
    'Score de pertinence',
    'Tags',
    'Auteur',
    'Dossier',
    'Favori',
    'Partagé'
  ];
  
  const csvContent = [
    `# Statistiques de tri`,
    `# Temps d'exécution: ${statistics.executionTime}ms`,
    `# Algorithm: ${statistics.algorithmUsed}`,
    `# Comparaisons: ${statistics.comparisons}`,
    `# Échanges: ${statistics.swaps}`,
    `# Efficacité: ${statistics.efficiency.toFixed(2)}`,
    '',
    headers.join(','),
    ...items.map((item, index) => {
      const doc = item as any;
      return [
        index + 1,
        doc.id,
        `"${doc.name}"`,
        doc.type,
        doc.size,
        doc.createdAt?.toISOString() || '',
        doc.updatedAt?.toISOString() || '',
        doc.relevanceScore?.toFixed(3) || '',
        `"${(doc.tags || []).join(';')}"`,
        `"${doc.author || ''}"`,
        `"${doc.folder || ''}"`,
        doc.isFavorite ? 'Oui' : 'Non',
        doc.isShared ? 'Oui' : 'Non'
      ].join(',');
    })
  ].join('\n');
  
  return csvContent;
}

/**
 * Récupère une valeur imbriquée dans un objet
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Analyse les performances de tri
 */
export function analyzeSortPerformance(result: SortResult): {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  recommendations: string[];
  insights: {
    efficiency: string;
    speed: string;
    algorithm: string;
  };
} {
  const { statistics, metadata } = result;
  const { executionTime, comparisons, swaps, efficiency } = statistics;
  
  let score = 0;
  let recommendations: string[] = [];
  
  // Score basé sur le temps d'exécution
  if (executionTime < 50) score += 25;
  else if (executionTime < 200) score += 20;
  else if (executionTime < 500) score += 15;
  else if (executionTime < 1000) score += 10;
  else score += 5;
  
  // Score basé sur l'efficacité
  if (efficiency > 0.8) score += 25;
  else if (efficiency > 0.6) score += 20;
  else if (efficiency > 0.4) score += 15;
  else if (efficiency > 0.2) score += 10;
  else score += 5;
  
  // Score basé sur le ratio comparaisons/échanges
  const swapRatio = swaps > 0 ? comparisons / swaps : comparisons;
  if (swapRatio > 10) score += 25;
  else if (swapRatio > 5) score += 20;
  else if (swapRatio > 3) score += 15;
  else if (swapRatio > 2) score += 10;
  else score += 5;
  
  // Score basé sur l'algorithme utilisé
  if (statistics.algorithmUsed.includes('multi-level')) score += 25;
  else if (statistics.algorithmUsed.includes('quick-sort')) score += 20;
  else if (statistics.algorithmUsed.includes('merge-sort')) score += 15;
  else score += 10;
  
  // Recommandations
  if (executionTime > 1000) {
    recommendations.push('Le tri est lent. Envisagez d\'optimiser les critères ou d\'utiliser l\'indexation.');
  }
  
  if (efficiency < 0.5) {
    recommendations.push('L\'efficacité est faible. Vérifiez les champs de tri et les données.');
  }
  
  if (swapRatio < 2) {
    recommendations.push('Beaucoup d\'échanges. Les données peuvent être déjà presque triées.');
  }
  
  if (metadata?.emptyFields && metadata.emptyFields.length > 0) {
    recommendations.push(`Champs vides détectés: ${metadata.emptyFields.join(', ')}. Considérez les exclure du tri.`);
  }
  
  // Déterminer la note
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';
  
  return {
    grade,
    score,
    recommendations,
    insights: {
      efficiency: efficiency > 0.7 ? 'Excellente' : efficiency > 0.5 ? 'Bonne' : 'À améliorer',
      speed: executionTime < 100 ? 'Très rapide' : executionTime < 500 ? 'Rapide' : executionTime < 1000 ? 'Modérée' : 'Lente',
      algorithm: statistics.algorithmUsed.includes('multi-level') ? 'Avancé' : 'Standard'
    }
  };
}
