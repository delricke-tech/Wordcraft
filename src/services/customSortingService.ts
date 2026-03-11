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
