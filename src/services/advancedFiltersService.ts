/**
 * Service de filtres avancés (multi-critères combinés)
 * 
 * Ce service permet de créer et gérer des filtres complexes avec
 * combinaison de multiples critères pour une recherche précise
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface FilterCriterion {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  valueType: ValueType;
  label?: string;
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
  | 'multiselect';

export interface FilterGroup {
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
