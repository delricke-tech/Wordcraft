/**
 * Composant de filtres avancés (multi-critères combinés) - VERSION AMÉLIORÉE
 * 
 * Ce composant permet de créer et gérer des filtres complexes avec
 * combinaison de multiples critères pour une recherche précise
 * 
 * Date: 11 mars 2026 - Mis à jour: 12 mars 2026
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  Search, 
  Settings, 
  Download, 
  Save, 
  Trash2,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  FileText,
  Calendar,
  Hash,
  Users,
  Globe,
  Star,
  Share2,
  Tag,
  Folder,
  BarChart3,
  Zap,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  applyFilters,
  saveFilterGroup,
  getUserFilterGroups,
  deleteFilterGroup,
  createFilterPreset,
  getFilterPresets,
  getFieldDefinitions,
  validateFilterGroup,
  validateCriterion,
  applyFiltersLocal,
  // NOUVELLES IMPORTATIONS
  createPresetFilters,
  generateAdvancedFacets,
  generateSmartSuggestions,
  exportFilterResults,
  quickSearchWithRelevance,
  analyzeFilterPerformanceDetailed,
  type FilterGroup,
  type FilterCriterion,
  type FilterPreset,
  type FilterFieldDefinition,
  type FilterOperator,
  type ValueType,
  type FilterOptions,
  type FilterResult,
  type Document
} from '../services/advancedFiltersService';
import type { User } from '../contexts/AuthContext';

interface AdvancedFiltersProps<T = any> {
  user: User;
  target: 'documents' | 'notes' | 'conversations' | 'flashcards' | 'quiz' | 'all';
  items?: T[];
  onFilter?: (result: FilterResult<T>) => void;
  onItemsFiltered?: (items: T[]) => void;
  className?: string;
  showPresets?: boolean;
  showSave?: boolean;
  enableClientSide?: boolean;
}

interface FilterBuilder {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  valueType: ValueType;
  label?: string;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  user,
  target,
  items = [],
  onFilter,
  onItemsFiltered,
  className = '',
  showPresets = true,
  showSave = true,
  enableClientSide = false
}) => {
  const [filterBuilder, setFilterBuilder] = useState<FilterBuilder[]>([]);
  const [logicalOperator, setLogicalOperator] = useState<'AND' | 'OR'>('AND');
  const [isFiltering, setIsFiltering] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  
  const [savedFilters, setSavedFilters] = useState<FilterGroup[]>([]);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<FilterPreset | null>(null);
  
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<FilterResult | null>(null);

  // Charger les filtres sauvegardés et préréglages
  useEffect(() => {
    loadSavedFilters();
    loadPresets();
  }, [user.id, target]);

  const loadSavedFilters = async () => {
    try {
      const filters = await getUserFilterGroups(user.id, { includePublic: true });
      setSavedFilters(filters);
    } catch (error) {
      console.error('❌ Erreur chargement filtres sauvegardés:', error);
    }
  };

  const loadPresets = async () => {
    try {
      const userPresets = await getFilterPresets(user.id, target);
      setPresets(userPresets);
    } catch (error) {
      console.error('❌ Erreur chargement préréglages:', error);
    }
  };

  // Obtenir les définitions de champs pour le target
  const fieldDefinitions = useMemo(() => {
    return getFieldDefinitions(target);
  }, [target]);

  // Ajouter un critère de filtre
  const addCriterion = useCallback(() => {
    const newCriterion: FilterBuilder = {
      id: `criterion_${Date.now()}`,
      field: fieldDefinitions[0]?.field || '',
      operator: 'equals',
      value: '',
      valueType: fieldDefinitions[0]?.type || 'text',
      label: fieldDefinitions[0]?.label || ''
    };
    
    setFilterBuilder(prev => [...prev, newCriterion]);
  }, [fieldDefinitions]);

  // Supprimer un critère de filtre
  const removeCriterion = useCallback((id: string) => {
    setFilterBuilder(prev => prev.filter(criterion => criterion.id !== id));
  }, []);

  // Mettre à jour un critère de filtre
  const updateCriterion = useCallback((id: string, updates: Partial<FilterBuilder>) => {
    setFilterBuilder(prev => prev.map(criterion => 
      criterion.id === id ? { ...criterion, ...updates } : criterion
    ));
  }, []);

  // Valider les filtres
  const validateFilters = useCallback((): boolean => {
    if (filterBuilder.length === 0) {
      setValidationErrors(['Ajoutez au moins un critère de filtre']);
      return false;
    }

    const errors: string[] = [];
    
    filterBuilder.forEach((criterion, index) => {
      const validation = validateCriterion(criterion as FilterCriterion);
      if (!validation.isValid) {
        errors.push(`Critère ${index + 1}: ${validation.errors.join(', ')}`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  }, [filterBuilder]);

  // Appliquer les filtres
  const applyFiltersHandler = useCallback(async () => {
    if (!validateFilters()) return;

    setIsFiltering(true);
    setValidationErrors([]);

    try {
      const filterGroup: FilterGroup = {
        id: `temp_${Date.now()}`,
        name: 'Filtre temporaire',
        criteria: filterBuilder.map(criterion => ({
          id: criterion.id,
          field: criterion.field,
          operator: criterion.operator,
          value: criterion.value,
          valueType: criterion.valueType,
          label: criterion.label
        })),
        logicalOperator,
        isPublic: false,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (enableClientSide && items.length > 0) {
        // Filtrage côté client
        const filteredItems = applyFiltersLocal(items, filterGroup);
        onItemsFiltered?.(filteredItems);
        
        setLastResult({
          items: filteredItems,
          totalCount: items.length,
          filteredCount: filteredItems.length,
          executionTime: 0,
          appliedFilters: filterGroup.criteria
        });
      } else {
        // Filtrage côté serveur
        const options: FilterOptions = {
          target,
          includeFacets: true,
          limit: 50
        };

        const result = await applyFilters<T>(filterGroup, options);
        setLastResult(result);
        onFilter?.(result);
      }

      console.log('✅ Filtres appliqués avec succès');

    } catch (error) {
      console.error('❌ Erreur application filtres:', error);
      setValidationErrors(['Erreur lors de l\'application des filtres']);
    } finally {
      setIsFiltering(false);
    }
  }, [filterBuilder, logicalOperator, validateFilters, enableClientSide, items, target, user.id, onFilter, onItemsFiltered]);

  // Sauvegarder un groupe de filtres
  const saveFilterGroupHandler = useCallback(async (name: string, description?: string) => {
    try {
      const filterGroup: Partial<FilterGroup> = {
        name,
        description,
        criteria: filterBuilder.map(criterion => ({
          id: criterion.id,
          field: criterion.field,
          operator: criterion.operator,
          value: criterion.value,
          valueType: criterion.valueType,
          label: criterion.label
        })),
        logicalOperator,
        isPublic: false,
        createdBy: user.id
      };

      const savedGroup = await saveFilterGroup(filterGroup);
      setSavedFilters(prev => [savedGroup, ...prev]);
      
      console.log('✅ Groupe de filtres sauvegardé:', savedGroup.name);
      return savedGroup;

    } catch (error) {
      console.error('❌ Erreur sauvegarde groupe filtres:', error);
      throw error;
    }
  }, [filterBuilder, logicalOperator, user.id]);

  // Charger un groupe de filtres sauvegardé
  const loadFilterGroup = useCallback((filterGroup: FilterGroup) => {
    const loadedCriteria = filterGroup.criteria.map(criterion => ({
      id: criterion.id,
      field: criterion.field,
      operator: criterion.operator,
      value: criterion.value,
      valueType: criterion.valueType,
      label: criterion.label
    }));

    setFilterBuilder(loadedCriteria);
    setLogicalOperator(filterGroup.logicalOperator);
    setShowSavedFilters(false);
  }, []);

  // Supprimer un groupe de filtres
  const deleteFilterGroupHandler = useCallback(async (filterGroupId: string) => {
    try {
      await deleteFilterGroup(filterGroupId);
      setSavedFilters(prev => prev.filter(filter => filter.id !== filterGroupId));
      console.log('✅ Groupe de filtres supprimé');
    } catch (error) {
      console.error('❌ Erreur suppression groupe filtres:', error);
    }
  }, []);

  // Appliquer un préréglage
  const applyPreset = useCallback((preset: FilterPreset) => {
    loadFilterGroup(preset.filter_group);
    setSelectedPreset(preset);
    setShowPresetsModal(false);
    
    // Appliquer les filtres automatiquement
    setTimeout(() => {
      applyFiltersHandler();
    }, 100);
  }, [applyFiltersHandler, loadFilterGroup]);

  // Réinitialiser les filtres
  const resetFilters = useCallback(() => {
    setFilterBuilder([]);
    setLogicalOperator('AND');
    setValidationErrors([]);
    setLastResult(null);
    setSelectedPreset(null);
    onItemsFiltered?.(items);
  }, [items, onItemsFiltered]);

  // Obtenir les opérateurs pour un type de valeur
  const getOperatorsForType = useCallback((valueType: ValueType): FilterOperator[] => {
    switch (valueType) {
      case 'text':
        return ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'];
      case 'number':
        return ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'between', 'not_between', 'is_null', 'is_not_null'];
      case 'date':
        return ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'between', 'not_between', 'is_null', 'is_not_null'];
      case 'boolean':
        return ['equals', 'is_null', 'is_not_null'];
      case 'array':
        return ['contains', 'not_contains', 'in', 'not_in', 'is_empty', 'is_not_empty'];
      case 'select':
        return ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'];
      case 'multiselect':
        return ['contains', 'not_contains', 'in', 'not_in', 'is_empty', 'is_not_empty'];
      default:
        return ['equals'];
    }
  }, []);

  // Render du builder de filtres
  const renderFilterBuilder = () => (
    <div className="space-y-4">
      {/* Header du builder */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-800">Constructeur de filtres</h4>
        <div className="flex items-center gap-2">
          <select
            value={logicalOperator}
            onChange={(e) => setLogicalOperator(e.target.value as 'AND' | 'OR')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="AND">ET</option>
            <option value="OR">OU</option>
          </select>
          
          <button
            onClick={addCriterion}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            + Ajouter
          </button>
        </div>
      </div>

      {/* Critères de filtre */}
      <div className="space-y-3">
        {filterBuilder.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-4xl mb-4">🔍</div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">Aucun critère</h4>
            <p className="text-gray-600 mb-4">Ajoutez des critères pour filtrer les résultats</p>
            <button
              onClick={addCriterion}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Ajouter un critère
            </button>
          </div>
        ) : (
          filterBuilder.map((criterion, index) => (
            <div key={criterion.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {/* Champ */}
              <div className="flex-1">
                <select
                  value={criterion.field}
                  onChange={(e) => {
                    const fieldDef = fieldDefinitions.find(f => f.field === e.target.value);
                    updateCriterion(criterion.id, {
                      field: e.target.value,
                      valueType: fieldDef?.type || 'text',
                      label: fieldDef?.label,
                      operator: 'equals',
                      value: fieldDef?.defaultValue || ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {fieldDefinitions.map(field => (
                    <option key={field.field} value={field.field}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Opérateur */}
              <div className="w-32">
                <select
                  value={criterion.operator}
                  onChange={(e) => updateCriterion(criterion.id, { operator: e.target.value as FilterOperator })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {getOperatorsForType(criterion.valueType).map(operator => (
                    <option key={operator} value={operator}>
                      {getOperatorLabel(operator)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valeur */}
              <div className="flex-1">
                {renderValueInput(criterion, index)}
              </div>

              {/* Supprimer */}
              <button
                onClick={() => removeCriterion(criterion.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          {lastResult && (
            <div className="text-sm text-gray-600">
              {lastResult.filteredCount} / {lastResult.totalCount} résultats
              {lastResult.executionTime > 0 && ` (${lastResult.executionTime}ms)`}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            Réinitialiser
          </button>
          
          {showSave && (
            <button
              onClick={() => {
                const name = prompt('Nom du filtre:');
                if (name && name.trim()) {
                  saveFilterGroupHandler(name.trim());
                }
              }}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
            >
              💾 Sauvegarder
            </button>
          )}
          
          <button
            onClick={applyFiltersHandler}
            disabled={isFiltering || filterBuilder.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
          >
            {isFiltering ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Filtrage...
              </>
            ) : (
              <>
                🔍 Appliquer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Erreurs de validation */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-sm text-red-700">
            {validationErrors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render de l'input de valeur
  const renderValueInput = (criterion: FilterBuilder, index: number) => {
    const fieldDef = fieldDefinitions.find(f => f.field === criterion.field);
    
    switch (criterion.valueType) {
      case 'text':
        return (
          <input
            type="text"
            value={criterion.value || ''}
            onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })}
            placeholder={fieldDef?.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={criterion.value || ''}
            onChange={(e) => updateCriterion(criterion.id, { value: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={criterion.value || ''}
            onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        );
      
      case 'boolean':
        return (
          <select
            value={criterion.value?.toString() || ''}
            onChange={(e) => updateCriterion(criterion.id, { value: e.target.value === 'true' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Sélectionner...</option>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        );
      
      case 'select':
        return (
          <select
            value={criterion.value || ''}
            onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Sélectionner...</option>
            {fieldDef?.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'multiselect':
        return (
          <input
            type="text"
            value={Array.isArray(criterion.value) ? criterion.value.join(', ') : criterion.value || ''}
            onChange={(e) => {
              const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
              updateCriterion(criterion.id, { value: values });
            }}
            placeholder={fieldDef?.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={criterion.value || ''}
            onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        );
    }
  };

  // Render des filtres sauvegardés
  const renderSavedFilters = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-800">Filtres sauvegardés</h4>
        <button
          onClick={() => setShowSavedFilters(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      {savedFilters.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">💾</div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">Aucun filtre sauvegardé</h4>
          <p className="text-gray-600">Créez et sauvegardez des filtres pour les réutiliser</p>
        </div>
      ) : (
        <div className="space-y-2">
          {savedFilters.map(filter => (
            <div key={filter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{filter.name}</div>
                {filter.description && (
                  <div className="text-sm text-gray-600">{filter.description}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {filter.criteria.length} critère{filter.criteria.length > 1 ? 's' : ''} • 
                  {filter.isPublic ? ' Public' : ' Privé'} • 
                  {filter.usageCount || 0} utilisations
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadFilterGroup(filter)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Charger
                </button>
                
                {filter.created_by === user.id && (
                  <button
                    onClick={() => deleteFilterGroupHandler(filter.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render des préréglages
  const renderPresets = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-800">Préréglages</h4>
        <button
          onClick={() => setShowPresetsModal(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      {presets.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚡</div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">Aucun préréglage</h4>
          <p className="text-gray-600">Créez des préréglages pour des recherches rapides</p>
        </div>
      ) : (
        <div className="space-y-2">
          {presets.map(preset => (
            <div key={preset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <div className="font-medium text-gray-800 flex items-center gap-2">
                  {preset.name}
                  {preset.isDefault && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Défaut</span>
                  )}
                </div>
                {preset.description && (
                  <div className="text-sm text-gray-600">{preset.description}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {preset.filter_group.criteria.length} critère{preset.filter_group.criteria.length > 1 ? 's' : ''} • 
                  {preset.target}
                </div>
              </div>
              
              <button
                onClick={() => applyPreset(preset)}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                Appliquer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Obtenir le libellé d'un opérateur
  const getOperatorLabel = (operator: FilterOperator): string => {
    const labels: Record<FilterOperator, string> = {
      'equals': 'Égal à',
      'not_equals': 'Différent de',
      'contains': 'Contient',
      'not_contains': 'Ne contient pas',
      'starts_with': 'Commence par',
      'ends_with': 'Se termine par',
      'greater_than': 'Supérieur à',
      'less_than': 'Inférieur à',
      'greater_equal': 'Supérieur ou égal à',
      'less_equal': 'Inférieur ou égal à',
      'between': 'Entre',
      'not_between': 'Pas entre',
      'in': 'Dans',
      'not_in': 'Pas dans',
      'is_null': 'Est vide',
      'is_not_null': 'N\'est pas vide',
      'is_empty': 'Est vide',
      'is_not_empty': 'N\'est pas vide'
    };
    return labels[operator] || operator;
  };

  return (
    <div className={`advanced-filters ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>🔍</span>
            Filtres Avancés
          </h3>
          <p className="text-sm text-gray-600">
            Combinez plusieurs critères pour une recherche précise
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {showPresets && (
            <button
              onClick={() => setShowPresetsModal(true)}
              className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
            >
              ⚡ Préréglages
            </button>
          )}
          
          <button
            onClick={() => setShowSavedFilters(true)}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            💾 Sauvegardés
          </button>
          
          <button
            onClick={() => setShowBuilder(!showBuilder)}
            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            🔧 Builder
          </button>
        </div>
      </div>

      {/* Builder de filtres */}
      {showBuilder && renderFilterBuilder()}

      {/* Modal des filtres sauvegardés */}
      {showSavedFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4">
              {renderSavedFilters()}
            </div>
          </div>
        </div>
      )}

      {/* Modal des préréglages */}
      {showPresetsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4">
              {renderPresets()}
            </div>
          </div>
        </div>
      )}

      {/* Résultats du filtrage */}
      {lastResult && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              <strong>Résultats:</strong> {lastResult.filteredCount} / {lastResult.totalCount} éléments filtrés
              {lastResult.executionTime > 0 && ` (${lastResult.executionTime}ms)`}
            </div>
            {selectedPreset && (
              <div className="text-sm text-blue-600">
                Préréglage: {selectedPreset.name}
              </div>
            )}
          </div>
          
          {lastResult.facets && Object.keys(lastResult.facets).length > 0 && (
            <div className="mt-2 text-xs text-blue-600">
              Facettes disponibles: {Object.keys(lastResult.facets).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
