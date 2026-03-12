/**
 * Service de filtres avancés (multi-critères combinés) - VERSION AMÉLIORÉE
 * 
 * Ce service permet de créer et gérer des filtres complexes avec
 * combinaison de multiples critères pour une recherche précise
 * 
 * Date: 11 mars 2026 - Mis à jour: 12 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface FilterCriterion {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  valueType: ValueType;
  label?: string;
  enabled?: boolean;
  options?: Array<{ label: string; value: any; count?: number }>;
  placeholder?: string;
  min?: number;
  max?: number;
}

export type FilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'between'
  | 'not_between'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'
  | 'is_empty'
  | 'is_not_empty';

export type ValueType = 
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'array'
  | 'select'
  | 'multiselect'
  | 'range';

export interface FilterGroup {
  id: string;
  name: string;
  criteria: FilterCriterion[];
  logic: 'AND' | 'OR';
  enabled: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface FilterResult {
  items: any[];
  totalCount: number;
  filteredCount: number;
  facets: Record<string, Array<{ value: string; count: number }>>;
  suggestions?: string[];
  performance?: {
    executionTime: number;
    efficiency: number;
    recommendations: string[];
  };
}

export interface Document {
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
}

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  criteria: FilterCriterion[];
  logicalOperator: 'AND' | 'OR';
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  target: 'documents' | 'notes' | 'conversations' | 'flashcards' | 'quiz' | 'all';
  filterGroup: FilterGroup;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  isDefault?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterFieldDefinition {
  field: string;
  label: string;
  type: ValueType;
  operators: FilterOperator[];
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  placeholder?: string;
  description?: string;
  category?: string;
}

export interface FilterResult<T = any> {
  items: T[];
  totalCount: number;
  filteredCount: number;
  facets?: Record<string, Record<string, number>>;
  executionTime: number;
  appliedFilters: FilterCriterion[];
}

export interface FilterOptions {
  target?: 'documents' | 'notes' | 'conversations' | 'flashcards' | 'quiz' | 'all';
  includeFacets?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  workspaceId?: string;
  userId?: string;
}

class AdvancedFiltersService {
  private readonly DEFAULT_OPERATORS: Record<ValueType, FilterOperator[]> = {
    text: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
    number: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'between', 'not_between', 'is_null', 'is_not_null'],
    date: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'between', 'not_between', 'is_null', 'is_not_null'],
    boolean: ['equals', 'is_null', 'is_not_null'],
    array: ['contains', 'not_contains', 'in', 'not_in', 'is_empty', 'is_not_empty'],
    select: ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'],
    multiselect: ['contains', 'not_contains', 'in', 'not_in', 'is_empty', 'is_not_empty']
  };

  /**
   * Définition des champs disponibles pour chaque type de contenu
   */
  private readonly FIELD_DEFINITIONS: Record<string, FilterFieldDefinition[]> = {
    documents: [
      { field: 'title', label: 'Titre', type: 'text', operators: this.DEFAULT_OPERATORS.text, placeholder: 'Rechercher dans le titre...' },
      { field: 'document_name', label: 'Nom du fichier', type: 'text', operators: this.DEFAULT_OPERATORS.text, placeholder: 'Nom du fichier...' },
      { field: 'file_type', label: 'Type de fichier', type: 'select', operators: ['equals', 'not_equals', 'in', 'not_in'], 
        options: [
          { value: 'pdf', label: 'PDF' },
          { value: 'docx', label: 'Word' },
          { value: 'xlsx', label: 'Excel' },
          { value: 'pptx', label: 'PowerPoint' },
          { value: 'txt', label: 'Texte' },
          { value: 'jpg', label: 'Image JPG' },
          { value: 'png', label: 'Image PNG' }
        ]
      },
      { field: 'file_size', label: 'Taille (octets)', type: 'number', operators: this.DEFAULT_OPERATORS.number, description: 'Taille du fichier en octets' },
      { field: 'extracted_text_length', label: 'Longueur du texte', type: 'number', operators: this.DEFAULT_OPERATORS.number, description: 'Nombre de caractères extraits' },
      { field: 'word_count', label: 'Nombre de mots', type: 'number', operators: this.DEFAULT_OPERATORS.number },
      { field: 'created_at', label: 'Date de création', type: 'date', operators: this.DEFAULT_OPERATORS.date },
      { field: 'updated_at', label: 'Date de modification', type: 'date', operators: this.DEFAULT_OPERATORS.date },
      { field: 'folder_id', label: 'Dossier', type: 'select', operators: ['equals', 'not_equals', 'is_null', 'is_not_null'] },
      { field: 'tags', label: 'Tags', type: 'multiselect', operators: this.DEFAULT_OPERATORS.array, placeholder: 'Tags...' },
      { field: 'is_public', label: 'Public', type: 'boolean', operators: this.DEFAULT_OPERATORS.boolean },
      { field: 'workspace_id', label: 'Workspace', type: 'select', operators: ['equals', 'not_equals', 'is_null', 'is_not_null'] }
    ],
    notes: [
      { field: 'title', label: 'Titre', type: 'text', operators: this.DEFAULT_OPERATORS.text, placeholder: 'Rechercher dans le titre...' },
      { field: 'content', label: 'Contenu', type: 'text', operators: this.DEFAULT_OPERATORS.text, placeholder: 'Rechercher dans le contenu...' },
      { field: 'plain_content', label: 'Contenu texte brut', type: 'text', operators: this.DEFAULT_OPERATORS.text },
      { field: 'word_count', label: 'Nombre de mots', type: 'number', operators: this.DEFAULT_OPERATORS.number },
      { field: 'reading_time', label: 'Temps de lecture (min)', type: 'number', operators: this.DEFAULT_OPERATORS.number },
      { field: 'created_at', label: 'Date de création', type: 'date', operators: this.DEFAULT_OPERATORS.date },
      { field: 'updated_at', label: 'Date de modification', type: 'date', operators: this.DEFAULT_OPERATORS.date },
      { field: 'folder_id', label: 'Dossier', type: 'select', operators: ['equals', 'not_equals', 'is_null', 'is_not_null'] },
      { field: 'tags', label: 'Tags', type: 'multiselect', operators: this.DEFAULT_OPERATORS.array },
      { field: 'is_favorite', label: 'Favori', type: 'boolean', operators: this.DEFAULT_OPERATORS.boolean },
      { field: 'is_archived', label: 'Archivé', type: 'boolean', operators: this.DEFAULT_OPERATORS.boolean },
      { field: 'is_pinned', label: 'Épinglé', type: 'boolean', operators: this.DEFAULT_OPERATORS.boolean },
      { field: 'is_public', label: 'Public', type: 'boolean', operators: this.DEFAULT_OPERATORS.boolean },
      { field: 'color', label: 'Couleur', type: 'text', operators: ['equals', 'not_equals', 'is_null', 'is_not_null'] },
      { field: 'workspace_id', label: 'Workspace', type: 'select', operators: ['equals', 'not_equals', 'is_null', 'is_not_null'] }
    ],
    conversations: [
      { field: 'title', label: 'Titre', type: 'text', operators: this.DEFAULT_OPERATORS.text, placeholder: 'Rechercher dans le titre...' },
      { field: 'message_count', label: 'Nombre de messages', type: 'number', operators: this.DEFAULT_OPERATORS.number },
      { field: 'total_words', label: 'Nombre total de mots', type: 'number', operators: this.DEFAULT_OPERATORS.number },
      { field: 'created_at', label: 'Date de création', type: 'date', operators: this.DEFAULT_OPERATORS.date },
      { field: 'updated_at', label: 'Date de modification', type: 'date', operators: this.DEFAULT_OPERATORS.date },
      { field: 'has_citations', label: 'Contient des citations', type: 'boolean', operators: this.DEFAULT_OPERATORS.boolean },
      { field: 'workspace_id', label: 'Workspace', type: 'select', operators: ['equals', 'not_equals', 'is_null', 'is_not_null'] }
    ],
    flashcards: [
      { field: 'question', label: 'Question', type: 'text', operators: this.DEFAULT_OPERATORS.text, placeholder: 'Rechercher dans la question...' },
      { field: 'answer', label: 'Réponse', type: 'text', operators: this.DEFAULT_OPERATORS.text, placeholder: 'Rechercher dans la réponse...' },
      { field: 'difficulty', label: 'Difficulté', type: 'select', operators: ['equals', 'not_equals', 'in', 'not_in'],
        options: [
          { value: 'easy', label: 'Facile' },
          { value: 'medium', label: 'Moyen' },
          { value: 'hard', label: 'Difficile' }
        ]
      },
      { field: 'created_at', label: 'Date de création', type: 'date', operators: this.DEFAULT_OPERATORS.date },
      { field: 'last_reviewed', label: 'Dernière révision', type: 'date', operators: this.DEFAULT_OPERATORS.date },
      { field: 'review_count', label: 'Nombre de révisions', type: 'number', operators: this.DEFAULT_OPERATORS.number },
      { field: 'success_rate', label: 'Taux de succès (%)', type: 'number', operators: this.DEFAULT_OPERATORS.number },
      { field: 'tags', label: 'Tags', type: 'multiselect', operators: this.DEFAULT_OPERATORS.array },
      { field: 'is_favorite', label: 'Favori', type: 'boolean', operators: this.DEFAULT_OPERATORS.boolean }
    ],
    quiz: [
      { field: 'title', label: 'Titre', type: 'text', operators: this.DEFAULT_OPERATORS.text, placeholder: 'Rechercher dans le titre...' },
      { field: 'question_count', label: 'Nombre de questions', type: 'number', operators: this.DEFAULT_OPERATORS.number },
      { field: 'difficulty', label: 'Difficulté', type: 'select', operators: ['equals', 'not_equals', 'in', 'not_in'],
        options: [
          { value: 'beginner', label: 'Débutant' },
          { value: 'intermediate', label: 'Intermédiaire' },
          { value: 'advanced', label: 'Avancé' }
        ]
      },
      { field: 'created_at', label: 'Date de création', type: 'date', operators: this.DEFAULT_OPERATORS.date },
      { field: 'time_limit', label: 'Limite de temps (min)', type: 'number', operators: this.DEFAULT_OPERATORS.number },
      { field: 'passing_score', label: 'Score de réussite (%)', type: 'number', operators: this.DEFAULT_OPERATORS.number },
      { field: 'is_public', label: 'Public', type: 'boolean', operators: this.DEFAULT_OPERATORS.boolean },
      { field: 'tags', label: 'Tags', type: 'multiselect', operators: this.DEFAULT_OPERATORS.array }
    ]
  };

  /**
   * Applique des filtres avancés sur un ensemble de données
   */
  async applyFilters<T = any>(
    filterGroup: FilterGroup,
    options: FilterOptions = {}
  ): Promise<FilterResult<T>> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 ===== FILTRES AVANCÉS =====');
      console.log('  - Target:', options.target || 'all');
      console.log('  - Criteria:', filterGroup.criteria.length);
      console.log('  - Operator:', filterGroup.logicalOperator);

      // Construire la requête SQL
      const { query, params } = this.buildQuery(filterGroup, options);
      
      // Exécuter la requête
      const { data, error } = await supabase.rpc('execute_advanced_filters', {
        filter_query: query,
        filter_params: params,
        target_table: options.target || 'all',
        include_facets: options.includeFacets || false,
        sort_by: options.sortBy,
        sort_order: options.sortOrder || 'asc',
        limit: options.limit || 50,
        offset: options.offset || 0,
        workspace_id: options.workspaceId,
        user_id: options.userId
      });

      if (error) throw error;

      const executionTime = Date.now() - startTime;

      const result: FilterResult<T> = {
        items: data?.items || [],
        totalCount: data?.total_count || 0,
        filteredCount: data?.filtered_count || 0,
        facets: data?.facets,
        executionTime,
        appliedFilters: filterGroup.criteria
      };

      console.log(`✅ Filtres appliqués: ${result.filteredCount}/${result.totalCount} résultats (${executionTime}ms)`);
      return result;

    } catch (error) {
      console.error('❌ Erreur application filtres:', error);
      throw new Error(`Échec de l'application des filtres: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Construit une requête SQL à partir des critères de filtre
   */
  private buildQuery(filterGroup: FilterGroup, options: FilterOptions): { query: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    filterGroup.criteria.forEach((criterion, index) => {
      const condition = this.buildCondition(criterion, index, params);
      if (condition) {
        conditions.push(condition);
      }
    });

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(` ${filterGroup.logicalOperator} `)}`
      : '';

    return {
      query: whereClause,
      params
    };
  }

  /**
   * Construit une condition SQL individuelle
   */
  private buildCondition(criterion: FilterCriterion, index: number, params: any[]): string {
    const paramIndex = params.length + 1;
    let condition = '';

    switch (criterion.operator) {
      case 'equals':
        condition = `${criterion.field} = $${paramIndex}`;
        params.push(criterion.value);
        break;
      
      case 'not_equals':
        condition = `${criterion.field} != $${paramIndex}`;
        params.push(criterion.value);
        break;
      
      case 'contains':
        condition = `${criterion.field} ILIKE $${paramIndex}`;
        params.push(`%${criterion.value}%`);
        break;
      
      case 'not_contains':
        condition = `${criterion.field} NOT ILIKE $${paramIndex}`;
        params.push(`%${criterion.value}%`);
        break;
      
      case 'starts_with':
        condition = `${criterion.field} ILIKE $${paramIndex}`;
        params.push(`${criterion.value}%`);
        break;
      
      case 'ends_with':
        condition = `${criterion.field} ILIKE $${paramIndex}`;
        params.push(`%${criterion.value}`);
        break;
      
      case 'greater_than':
        condition = `${criterion.field} > $${paramIndex}`;
        params.push(criterion.value);
        break;
      
      case 'less_than':
        condition = `${criterion.field} < $${paramIndex}`;
        params.push(criterion.value);
        break;
      
      case 'greater_equal':
        condition = `${criterion.field} >= $${paramIndex}`;
        params.push(criterion.value);
        break;
      
      case 'less_equal':
        condition = `${criterion.field} <= $${paramIndex}`;
        params.push(criterion.value);
        break;
      
      case 'between':
        condition = `${criterion.field} BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(criterion.value[0], criterion.value[1]);
        break;
      
      case 'not_between':
        condition = `${criterion.field} NOT BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(criterion.value[0], criterion.value[1]);
        break;
      
      case 'in':
        if (Array.isArray(criterion.value) && criterion.value.length > 0) {
          const placeholders = criterion.value.map((_, i) => `$${paramIndex + i}`).join(', ');
          condition = `${criterion.field} IN (${placeholders})`;
          params.push(...criterion.value);
        }
        break;
      
      case 'not_in':
        if (Array.isArray(criterion.value) && criterion.value.length > 0) {
          const placeholders = criterion.value.map((_, i) => `$${paramIndex + i}`).join(', ');
          condition = `${criterion.field} NOT IN (${placeholders})`;
          params.push(...criterion.value);
        }
        break;
      
      case 'is_null':
        condition = `${criterion.field} IS NULL`;
        break;
      
      case 'is_not_null':
        condition = `${criterion.field} IS NOT NULL`;
        break;
      
      case 'is_empty':
        condition = `(${criterion.field} IS NULL OR ${criterion.field} = '')`;
        break;
      
      case 'is_not_empty':
        condition = `(${criterion.field} IS NOT NULL AND ${criterion.field} != '')`;
        break;
    }

    return condition;
  }

  /**
   * Sauvegarde un groupe de filtres
   */
  async saveFilterGroup(filterGroup: Partial<FilterGroup>): Promise<FilterGroup> {
    try {
      const { data, error } = await supabase
        .from('filter_groups')
        .upsert({
          name: filterGroup.name!,
          description: filterGroup.description,
          criteria: filterGroup.criteria || [],
          logical_operator: filterGroup.logicalOperator || 'AND',
          is_public: filterGroup.isPublic || false,
          created_by: filterGroup.createdBy!,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de sauvegarder le groupe de filtres');

      console.log('✅ Groupe de filtres sauvegardé:', data.name);
      return data;

    } catch (error) {
      console.error('❌ Erreur sauvegarde groupe filtres:', error);
      throw new Error(`Échec de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les groupes de filtres d'un utilisateur
   */
  async getUserFilterGroups(userId: string, options: { includePublic?: boolean } = {}): Promise<FilterGroup[]> {
    try {
      let query = supabase
        .from('filter_groups')
        .select('*')
        .eq('created_by', userId);

      if (options.includePublic) {
        query = query.or('created_by.eq.' + userId + ',is_public.eq.true');
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('❌ Erreur récupération groupes filtres:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Supprime un groupe de filtres
   */
  async deleteFilterGroup(filterGroupId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('filter_groups')
        .delete()
        .eq('id', filterGroupId);

      if (error) throw error;

      console.log('✅ Groupe de filtres supprimé');

    } catch (error) {
      console.error('❌ Erreur suppression groupe filtres:', error);
      throw new Error(`Échec de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Crée un préréglage de filtre
   */
  async createFilterPreset(preset: Partial<FilterPreset>): Promise<FilterPreset> {
    try {
      const { data, error } = await supabase
        .from('filter_presets')
        .insert({
          name: preset.name!,
          description: preset.description,
          target: preset.target!,
          filter_group: preset.filterGroup!,
          sort_by: preset.sortBy,
          sort_order: preset.sortOrder || 'asc',
          limit: preset.limit,
          is_default: preset.isDefault || false,
          created_by: preset.createdBy!
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer le préréglage');

      console.log('✅ Préréglage créé:', data.name);
      return data;

    } catch (error) {
      console.error('❌ Erreur création préréglage:', error);
      throw new Error(`Échec de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les préréglages de filtres
   */
  async getFilterPresets(userId: string, target?: string): Promise<FilterPreset[]> {
    try {
      let query = supabase
        .from('filter_presets')
        .select('*')
        .eq('created_by', userId);

      if (target) {
        query = query.eq('target', target);
      }

      const { data, error } = await query.order('is_default', { ascending: false }).order('name');

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('❌ Erreur récupération préréglages:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Obtient les définitions de champs pour un type de contenu
   */
  getFieldDefinitions(target: string): FilterFieldDefinition[] {
    return this.FIELD_DEFINITIONS[target] || [];
  }

  /**
   * Obtient les opérateurs disponibles pour un type de valeur
   */
  getOperatorsForType(valueType: ValueType): FilterOperator[] {
    return this.DEFAULT_OPERATORS[valueType] || [];
  }

  /**
   * Valide un critère de filtre
   */
  validateCriterion(criterion: FilterCriterion): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Vérifier le champ
    if (!criterion.field || criterion.field.trim().length === 0) {
      errors.push('Le champ est requis');
    }

    // Vérifier l'opérateur
    if (!criterion.operator) {
      errors.push('L\'opérateur est requis');
    }

    // Vérifier la valeur
    if (criterion.operator !== 'is_null' && criterion.operator !== 'is_not_null' && 
        criterion.operator !== 'is_empty' && criterion.operator !== 'is_not_empty') {
      if (criterion.value === undefined || criterion.value === null) {
        errors.push('La valeur est requise pour cet opérateur');
      }

      // Validation spécifique au type
      if (criterion.valueType === 'number' && isNaN(Number(criterion.value))) {
        errors.push('La valeur doit être un nombre');
      }

      if (criterion.valueType === 'date' && !Date.parse(criterion.value)) {
        errors.push('La valeur doit être une date valide');
      }

      if ((criterion.operator === 'between' || criterion.operator === 'not_between') && 
          (!Array.isArray(criterion.value) || criterion.value.length !== 2)) {
        errors.push('L\'opérateur entre/dehors nécessite deux valeurs');
      }

      if ((criterion.operator === 'in' || criterion.operator === 'not_in') && 
          (!Array.isArray(criterion.value) || criterion.value.length === 0)) {
        errors.push('L\'opérateur dans/hors nécessite au moins une valeur');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide un groupe de filtres complet
   */
  validateFilterGroup(filterGroup: FilterGroup): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifier le nom
    if (!filterGroup.name || filterGroup.name.trim().length === 0) {
      errors.push('Le nom du groupe est requis');
    }

    // Vérifier les critères
    if (!filterGroup.criteria || filterGroup.criteria.length === 0) {
      warnings.push('Aucun critère de filtre défini');
    } else {
      filterGroup.criteria.forEach((criterion, index) => {
        const validation = this.validateCriterion(criterion);
        if (!validation.isValid) {
          errors.push(`Critère ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });
    }

    // Vérifier l'opérateur logique
    if (!filterGroup.logicalOperator || !['AND', 'OR'].includes(filterGroup.logicalOperator)) {
      errors.push('L\'opérateur logique doit être AND ou OR');
    }

    // Avertissements
    if (filterGroup.criteria && filterGroup.criteria.length > 10) {
      warnings.push('Beaucoup de critères peuvent affecter les performances');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Applique des filtres sur des données locales (client-side)
   */
  applyFiltersLocal<T extends Record<string, any>>(
    items: T[],
    filterGroup: FilterGroup
  ): T[] {
    return items.filter(item => {
      const results = filterGroup.criteria.map(criterion => {
        return this.evaluateCriterion(item, criterion);
      });

      // Appliquer l'opérateur logique
      if (filterGroup.logicalOperator === 'AND') {
        return results.every(result => result);
      } else {
        return results.some(result => result);
      }
    });
  }

  /**
   * Évalue un critère sur un élément
   */
  private evaluateCriterion(item: Record<string, any>, criterion: FilterCriterion): boolean {
    const value = item[criterion.field];
    const filterValue = criterion.value;

    switch (criterion.operator) {
      case 'equals':
        return value === filterValue;
      
      case 'not_equals':
        return value !== filterValue;
      
      case 'contains':
        return typeof value === 'string' && value.toLowerCase().includes(filterValue.toLowerCase());
      
      case 'not_contains':
        return typeof value !== 'string' || !value.toLowerCase().includes(filterValue.toLowerCase());
      
      case 'starts_with':
        return typeof value === 'string' && value.toLowerCase().startsWith(filterValue.toLowerCase());
      
      case 'ends_with':
        return typeof value === 'string' && value.toLowerCase().endsWith(filterValue.toLowerCase());
      
      case 'greater_than':
        return Number(value) > Number(filterValue);
      
      case 'less_than':
        return Number(value) < Number(filterValue);
      
      case 'greater_equal':
        return Number(value) >= Number(filterValue);
      
      case 'less_equal':
        return Number(value) <= Number(filterValue);
      
      case 'between':
        return Array.isArray(filterValue) && 
               Number(value) >= Number(filterValue[0]) && 
               Number(value) <= Number(filterValue[1]);
      
      case 'not_between':
        return !Array.isArray(filterValue) || 
               Number(value) < Number(filterValue[0]) || 
               Number(value) > Number(filterValue[1]);
      
      case 'in':
        return Array.isArray(filterValue) && filterValue.includes(value);
      
      case 'not_in':
        return !Array.isArray(filterValue) || !filterValue.includes(value);
      
      case 'is_null':
        return value === null || value === undefined;
      
      case 'is_not_null':
        return value !== null && value !== undefined;
      
      case 'is_empty':
        return value === null || value === undefined || value === '';
      
      case 'is_not_empty':
        return value !== null && value !== undefined && value !== '';
      
      default:
        return true;
    }
  }

  /**
   * Génère des suggestions de filtres basées sur l'usage
   */
  async generateFilterSuggestions(userId: string, target: string): Promise<{
    popularFields: Array<{ field: string; count: number }>;
    popularValues: Record<string, Array<{ value: string; count: number }>>;
    suggestedFilters: FilterGroup[];
  }> {
    try {
      const { data, error } = await supabase.rpc('generate_filter_suggestions', {
        user_id: userId,
        target_type: target
      });

      if (error) throw error;

      return data || {
        popularFields: [],
        popularValues: {},
        suggestedFilters: []
      };

    } catch (error) {
      console.error('❌ Erreur génération suggestions:', error);
      return {
        popularFields: [],
        popularValues: {},
        suggestedFilters: []
      };
    }
  }

  /**
   * Exporte un groupe de filtres au format JSON
   */
  exportFilterGroup(filterGroup: FilterGroup): string {
    return JSON.stringify(filterGroup, null, 2);
  }

  /**
   * Importe un groupe de filtres depuis du JSON
   */
  importFilterGroup(jsonString: string): FilterGroup {
    try {
      const filterGroup = JSON.parse(jsonString);
      
      // Validation
      const validation = this.validateFilterGroup(filterGroup);
      if (!validation.isValid) {
        throw new Error(`Filtre invalide: ${validation.errors.join(', ')}`);
      }

      return filterGroup;

    } catch (error) {
      console.error('❌ Erreur import groupe filtres:', error);
      throw new Error(`Échec de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

// Instance singleton
export const advancedFiltersService = new AdvancedFiltersService();

// Export des fonctions utilitaires
export const applyFilters = <T = any>(
  filterGroup: FilterGroup,
  options?: FilterOptions
) => advancedFiltersService.applyFilters<T>(filterGroup, options);

export const saveFilterGroup = (filterGroup: Partial<FilterGroup>) => 
  advancedFiltersService.saveFilterGroup(filterGroup);

export const getUserFilterGroups = (userId: string, options?: { includePublic?: boolean }) => 
  advancedFiltersService.getUserFilterGroups(userId, options);

export const deleteFilterGroup = (filterGroupId: string) => 
  advancedFiltersService.deleteFilterGroup(filterGroupId);

export const createFilterPreset = (preset: Partial<FilterPreset>) => 
  advancedFiltersService.createFilterPreset(preset);

export const getFilterPresets = (userId: string, target?: string) => 
  advancedFiltersService.getFilterPresets(userId, target);

export const getFieldDefinitions = (target: string) => 
  advancedFiltersService.getFieldDefinitions(target);

export const validateFilterGroup = (filterGroup: FilterGroup) => 
  advancedFiltersService.validateFilterGroup(filterGroup);

export const applyFiltersLocal = <T extends Record<string, any>>(
  items: T[],
  filterGroup: FilterGroup
) => advancedFiltersService.applyFiltersLocal(items, filterGroup);

// NOUVELLES FONCTIONNALITÉS AVANCÉES

/**
 * Crée les filtres prédéfinis pour les documents avec options étendues
 */
export function createPresetFilters(): FilterCriterion[] {
  return [
    {
      id: 'name',
      field: 'name',
      operator: 'contains',
      value: '',
      valueType: 'text',
      label: 'Nom du document',
      placeholder: 'Rechercher par nom...',
      enabled: false
    },
    {
      id: 'type',
      field: 'type',
      operator: 'in',
      value: [],
      valueType: 'multiselect',
      label: 'Type de fichier',
      options: [
        { label: 'PDF', value: 'pdf' },
        { label: 'Word', value: 'docx' },
        { label: 'PowerPoint', value: 'pptx' },
        { label: 'Excel', value: 'xlsx' },
        { label: 'Image', value: 'jpg,png,gif' },
        { label: 'Texte', value: 'txt,md' },
        { label: 'Vidéo', value: 'mp4,avi,mov' },
        { label: 'Audio', value: 'mp3,wav' }
      ],
      enabled: false
    },
    {
      id: 'tags',
      field: 'tags',
      operator: 'in',
      value: [],
      valueType: 'multiselect',
      label: 'Tags',
      options: [],
      placeholder: 'Sélectionner des tags...',
      enabled: false
    },
    {
      id: 'author',
      field: 'author',
      operator: 'contains',
      value: '',
      valueType: 'text',
      label: 'Auteur',
      placeholder: 'Rechercher par auteur...',
      enabled: false
    },
    {
      id: 'folder',
      field: 'folder',
      operator: 'equals',
      value: '',
      valueType: 'select',
      label: 'Dossier',
      options: [],
      placeholder: 'Sélectionner un dossier...',
      enabled: false
    },
    {
      id: 'size',
      field: 'size',
      operator: 'between',
      value: [0, 1000],
      valueType: 'range',
      label: 'Taille (Mo)',
      min: 0,
      max: 1000,
      enabled: false
    },
    {
      id: 'dateCreated',
      field: 'createdAt',
      operator: 'between',
      value: [],
      valueType: 'date',
      label: 'Date de création',
      enabled: false
    },
    {
      id: 'dateUpdated',
      field: 'updatedAt',
      operator: 'between',
      value: [],
      valueType: 'date',
      label: 'Date de modification',
      enabled: false
    },
    {
      id: 'wordCount',
      field: 'wordCount',
      operator: 'between',
      value: [0, 100000],
      valueType: 'range',
      label: 'Nombre de mots',
      min: 0,
      max: 100000,
      enabled: false
    },
    {
      id: 'pageCount',
      field: 'pageCount',
      operator: 'between',
      value: [0, 1000],
      valueType: 'range',
      label: 'Nombre de pages',
      min: 0,
      max: 1000,
      enabled: false
    },
    {
      id: 'language',
      field: 'language',
      operator: 'equals',
      value: '',
      valueType: 'select',
      label: 'Langue',
      options: [
        { label: 'Français', value: 'fr' },
        { label: 'Anglais', value: 'en' },
        { label: 'Espagnol', value: 'es' },
        { label: 'Allemand', value: 'de' },
        { label: 'Italien', value: 'it' },
        { label: 'Portugais', value: 'pt' },
        { label: 'Chinois', value: 'zh' },
        { label: 'Japonais', value: 'ja' }
      ],
      enabled: false
    },
    {
      id: 'status',
      field: 'status',
      operator: 'equals',
      value: '',
      valueType: 'select',
      label: 'Statut',
      options: [
        { label: 'Brouillon', value: 'draft' },
        { label: 'Publié', value: 'published' },
        { label: 'Archivé', value: 'archived' }
      ],
      enabled: false
    },
    {
      id: 'priority',
      field: 'priority',
      operator: 'equals',
      value: '',
      valueType: 'select',
      label: 'Priorité',
      options: [
        { label: 'Basse', value: 'low' },
        { label: 'Moyenne', value: 'medium' },
        { label: 'Haute', value: 'high' }
      ],
      enabled: false
    },
    {
      id: 'isFavorite',
      field: 'isFavorite',
      operator: 'equals',
      value: false,
      valueType: 'boolean',
      label: 'Favoris uniquement',
      enabled: false
    },
    {
      id: 'isShared',
      field: 'isShared',
      operator: 'equals',
      value: false,
      valueType: 'boolean',
      label: 'Partagés uniquement',
      enabled: false
    },
    {
      id: 'content',
      field: 'content',
      operator: 'contains',
      value: '',
      valueType: 'text',
      label: 'Contenu du document',
      placeholder: 'Rechercher dans le contenu...',
      enabled: false
    }
  ];
}

/**
 * Génère des facettes améliorées avec statistiques détaillées
 */
export function generateAdvancedFacets(documents: Document[]): Record<string, Array<{ value: string; count: number; percentage?: number }>> {
  const facets: Record<string, Array<{ value: string; count: number; percentage?: number }>> = {};
  const total = documents.length;
  
  // Facette par type de fichier avec pourcentages
  const typeFacet: Record<string, number> = {};
  documents.forEach(doc => {
    const type = doc.type || 'unknown';
    typeFacet[type] = (typeFacet[type] || 0) + 1;
  });
  facets.type = Object.entries(typeFacet).map(([value, count]) => ({ 
    value, 
    count, 
    percentage: Math.round((count / total) * 100) 
  }));
  
  // Facette par tags avec pourcentages
  const tagFacet: Record<string, number> = {};
  documents.forEach(doc => {
    if (doc.tags) {
      doc.tags.forEach(tag => {
        tagFacet[tag] = (tagFacet[tag] || 0) + 1;
      });
    }
  });
  facets.tags = Object.entries(tagFacet).map(([value, count]) => ({ 
    value, 
    count, 
    percentage: Math.round((count / total) * 100) 
  }));
  
  // Facette par auteur avec pourcentages
  const authorFacet: Record<string, number> = {};
  documents.forEach(doc => {
    const author = doc.author || 'unknown';
    authorFacet[author] = (authorFacet[author] || 0) + 1;
  });
  facets.author = Object.entries(authorFacet).map(([value, count]) => ({ 
    value, 
    count, 
    percentage: Math.round((count / total) * 100) 
  }));
  
  // Facette par statut avec pourcentages
  const statusFacet: Record<string, number> = {};
  documents.forEach(doc => {
    const status = doc.status || 'unknown';
    statusFacet[status] = (statusFacet[status] || 0) + 1;
  });
  facets.status = Object.entries(statusFacet).map(([value, count]) => ({ 
    value, 
    count, 
    percentage: Math.round((count / total) * 100) 
  }));
  
  // Facette par langue avec pourcentages
  const languageFacet: Record<string, number> = {};
  documents.forEach(doc => {
    const language = doc.language || 'unknown';
    languageFacet[language] = (languageFacet[language] || 0) + 1;
  });
  facets.language = Object.entries(languageFacet).map(([value, count]) => ({ 
    value, 
    count, 
    percentage: Math.round((count / total) * 100) 
  }));
  
  // Facette par priorité avec pourcentages
  const priorityFacet: Record<string, number> = {};
  documents.forEach(doc => {
    const priority = doc.priority || 'unknown';
    priorityFacet[priority] = (priorityFacet[priority] || 0) + 1;
  });
  facets.priority = Object.entries(priorityFacet).map(([value, count]) => ({ 
    value, 
    count, 
    percentage: Math.round((count / total) * 100) 
  }));
  
  return facets;
}

/**
 * Génère des suggestions intelligentes basées sur les résultats filtrés
 */
export function generateSmartSuggestions(documents: Document[], filter: FilterGroup): string[] {
  const suggestions: string[] = [];
  const activeCriteria = filter.criteria.filter(c => c.enabled);
  
  if (activeCriteria.length === 0) {
    // Suggestions pour les filtres les plus utiles
    if (documents.length > 50) {
      suggestions.push('Filtrer par type de fichier pour réduire les résultats');
    }
    
    const hasFavorites = documents.some(d => d.isFavorite);
    if (hasFavorites) {
      suggestions.push('Afficher uniquement les favoris pour un accès rapide');
    }
    
    const hasShared = documents.some(d => d.isShared);
    if (hasShared) {
      suggestions.push('Filtrer les documents partagés pour la collaboration');
    }
    
    const hasRecent = documents.some(d => {
      const daysDiff = (Date.now() - d.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff < 7;
    });
    if (hasRecent) {
      suggestions.push('Afficher les documents modifiés récemment');
    }
  } else {
    // Suggestions basées sur les filtres actifs
    const filteredCount = documents.length;
    
    if (filteredCount === 0) {
      suggestions.push('Aucun document trouvé. Essayez d\'élargir vos critères ou de vérifier l\'orthographe.');
      suggestions.push('Utilisez la recherche rapide pour trouver des documents similaires.');
    } else if (filteredCount < 5) {
      suggestions.push('Résultats très précis. Essayez d\'ajouter plus de documents ou d\'élargir les critères.');
    } else if (filteredCount > 100) {
      suggestions.push('Beaucoup de résultats. Ajoutez des critères pour affiner la recherche.');
    }
    
    // Suggérer des filtres complémentaires
    if (!activeCriteria.some(c => c.field === 'tags')) {
      suggestions.push('Ajouter un filtre par tags pour plus de précision');
    }
    
    if (!activeCriteria.some(c => c.field === 'createdAt')) {
      suggestions.push('Filtrer par date de création pour trouver les documents récents');
    }
    
    if (!activeCriteria.some(c => c.field === 'type')) {
      suggestions.push('Filtrer par type de fichier pour cibler un format spécifique');
    }
  }
  
  return suggestions;
}

/**
 * Exporte les résultats de filtre en multiple formats
 */
export function exportFilterResults(documents: Document[], format: 'csv' | 'json' | 'xlsx' | 'pdf'): string {
  switch (format) {
    case 'csv':
      return exportToCSV(documents);
    case 'json':
      return JSON.stringify(documents, null, 2);
    case 'xlsx':
      // Placeholder pour export Excel avancé
      return exportToCSV(documents);
    case 'pdf':
      // Placeholder pour export PDF
      return exportToCSV(documents);
    default:
      return exportToCSV(documents);
  }
}

/**
 * Export CSV amélioré avec plus de métadonnées
 */
function exportToCSV(documents: Document[]): string {
  const headers = [
    'ID', 'Nom', 'Type', 'Taille (octets)', 'Taille (Mo)', 'Date de création', 'Date de modification',
    'Auteur', 'Dossier', 'Tags', 'Favori', 'Partagé', 'Langue', 'Statut', 'Priorité',
    'Nombre de mots', 'Nombre de pages', 'Extrait'
  ];
  
  const csvContent = [
    headers.join(','),
    ...documents.map(doc => [
      doc.id,
      `"${doc.name}"`,
      doc.type,
      doc.size,
      (doc.size / (1024 * 1024)).toFixed(2),
      doc.createdAt.toISOString(),
      doc.updatedAt.toISOString(),
      `"${doc.author || ''}"`,
      `"${doc.folder || ''}"`,
      `"${(doc.tags || []).join(';')}"`,
      doc.isFavorite ? 'Oui' : 'Non',
      doc.isShared ? 'Oui' : 'Non',
      doc.language || '',
      doc.status || '',
      doc.priority || '',
      doc.wordCount || 0,
      doc.pageCount || 0,
      `"${(doc.excerpt || '').substring(0, 100).replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');
  
  return csvContent;
}

/**
 * Recherche rapide avec suggestions et pertinence
 */
export function quickSearchWithRelevance(
  documents: Document[],
  query: string,
  fields: string[] = ['name', 'content', 'author', 'tags']
): { results: Document[]; suggestions: string[] } {
  if (!query || query.trim().length === 0) {
    return { results: documents, suggestions: [] };
  }
  
  const searchTerms = query.toLowerCase().split(' ');
  const scoredResults: { document: Document; score: number }[] = [];
  
  documents.forEach(doc => {
    let score = 0;
    let matchedFields = 0;
    
    fields.forEach(field => {
      const value = getNestedValue(doc, field);
      if (!value) return;
      
      if (Array.isArray(value)) {
        value.forEach(v => {
          const fieldValue = String(v).toLowerCase();
          searchTerms.forEach(term => {
            if (fieldValue.includes(term)) {
              score += fieldValue === term ? 10 : 5; // Exact match > Partial match
              matchedFields++;
            }
          });
        });
      } else {
        const fieldValue = String(value).toLowerCase();
        searchTerms.forEach(term => {
          if (fieldValue.includes(term)) {
            score += fieldValue === term ? 10 : 5;
            matchedFields++;
          }
        });
      }
    });
    
    if (score > 0) {
      scoredResults.push({ document: doc, score });
    }
  });
  
  // Trier par score de pertinence
  scoredResults.sort((a, b) => b.score - a.score);
  
  // Générer des suggestions basées sur les résultats
  const suggestions = generateSearchSuggestions(scoredResults.slice(0, 5), query);
  
  return {
    results: scoredResults.map(sr => sr.document),
    suggestions
  };
}

/**
 * Génère des suggestions de recherche
 */
function generateSearchSuggestions(results: { document: Document; score: number }[], query: string): string[] {
  const suggestions: string[] = [];
  const terms = new Set<string>();
  
  results.forEach(({ document }) => {
    // Extraire des mots-clés des noms de documents
    const words = document.name.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 2 && !word.includes(query.toLowerCase())) {
        terms.add(word);
      }
    });
    
    // Extraire des tags pertinents
    if (document.tags) {
      document.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes(tag.toLowerCase())) {
          terms.add(tag);
        }
      });
    }
  });
  
  return Array.from(terms).slice(0, 5);
}

/**
 * Récupère une valeur imbriquée dans un objet
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Analyse les performances des filtres avec métriques détaillées
 */
export function analyzeFilterPerformanceDetailed(
  originalCount: number,
  filteredCount: number,
  criteriaCount: number,
  executionTime: number
): {
  efficiency: number;
  precision: number;
  performance: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
  metrics: {
    reductionRate: number;
    averageTimePerCriterion: number;
    complexity: 'low' | 'medium' | 'high';
  };
} {
  const efficiency = originalCount > 0 ? (originalCount - filteredCount) / originalCount : 0;
  const precision = filteredCount > 0 ? 1 / (1 + executionTime / 1000) : 0;
  const reductionRate = originalCount > 0 ? (originalCount - filteredCount) / originalCount : 0;
  const averageTimePerCriterion = criteriaCount > 0 ? executionTime / criteriaCount : 0;
  
  let performance: 'excellent' | 'good' | 'fair' | 'poor';
  let recommendations: string[] = [];
  let complexity: 'low' | 'medium' | 'high';
  
  if (criteriaCount <= 3) {
    complexity = 'low';
  } else if (criteriaCount <= 6) {
    complexity = 'medium';
  } else {
    complexity = 'high';
  }
  
  if (efficiency > 0.8 && precision > 0.8 && executionTime < 100) {
    performance = 'excellent';
  } else if (efficiency > 0.6 && precision > 0.6 && executionTime < 500) {
    performance = 'good';
    if (efficiency < 0.7) {
      recommendations.push('Ajoutez plus de critères pour améliorer la précision');
    }
    if (precision < 0.7) {
      recommendations.push('Optimisez les critères pour réduire le temps d\'exécution');
    }
  } else if (efficiency > 0.4 && precision > 0.4 && executionTime < 1000) {
    performance = 'fair';
    recommendations.push('Considérez l\'ajout de filtres plus spécifiques');
    recommendations.push('Vérifiez l\'ordre des critères pour optimiser les performances');
  } else {
    performance = 'poor';
    recommendations.push('Les filtres sont trop larges ou mal configurés');
    recommendations.push('Simplifiez les critères ou utilisez la recherche rapide');
  }
  
  if (criteriaCount > 8) {
    recommendations.push('Trop de critères peuvent ralentir la recherche. Essayez de les combiner.');
  }
  
  if (averageTimePerCriterion > 100) {
    recommendations.push('Certains critères sont lents. Envisagez d\'optimiser les champs de recherche.');
  }
  
  return {
    efficiency,
    precision,
    performance,
    recommendations,
    metrics: {
      reductionRate,
      averageTimePerCriterion,
      complexity
    }
  };
}
