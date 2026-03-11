/**
 * Composant de tri personnalisé (nom, date, taille, pertinence)
 * 
 * Ce composant permet de trier les contenus selon des critères personnalisés
 * avec algorithmes avancés et métadonnées de pertinence
 * 
 * Date: 11 mars 2026
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  applySort,
  applySortLocal,
  saveSortConfiguration,
  getUserSortConfigurations,
  deleteSortConfiguration,
  getFieldDefinitions,
  validateSortConfiguration,
  type SortConfiguration,
  type SortCriterion,
  type SortOptions,
  type SortResult,
  type SortFieldDefinition,
  type SortAlgorithm
} from '../services/customSortingService';
import type { User } from '../contexts/AuthContext';

interface CustomSortingProps<T = any> {
  user: User;
  target: 'documents' | 'notes' | 'conversations' | 'flashcards' | 'quiz' | 'all';
  items?: T[];
  onSort?: (result: SortResult<T>) => void;
  onItemsSorted?: (items: T[]) => void;
  className?: string;
  showPresets?: boolean;
  showSave?: boolean;
  enableClientSide?: boolean;
  compact?: boolean;
}

interface SortBuilder {
  id: string;
  field: string;
  direction: 'asc' | 'desc';
  algorithm: SortAlgorithm;
  weight: number;
  label?: string;
}

const CustomSorting: React.FC<CustomSortingProps> = ({
  user,
  target,
  items = [],
  onSort,
  onItemsSorted,
  className = '',
  showPresets = true,
  showSave = true,
  enableClientSide = false,
  compact = false
}) => {
  const [sortBuilder, setSortBuilder] = useState<SortBuilder[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showSavedSorts, setShowSavedSorts] = useState(false);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  
  const [savedSorts, setSavedSorts] = useState<SortConfiguration[]>([]);
  const [selectedSort, setSelectedSort] = useState<SortConfiguration | null>(null);
  
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<SortResult | null>(null);
  const [activeSort, setActiveSort] = useState<string>('updated_at_desc');

  // Charger les configurations de tri sauvegardées
  useEffect(() => {
    loadSavedSorts();
  }, [user.id, target]);

  const loadSavedSorts = async () => {
    try {
      const sorts = await getUserSortConfigurations(user.id, target);
      setSavedSorts(sorts);
    } catch (error) {
      console.error('❌ Erreur chargement configurations tri:', error);
    }
  };

  // Obtenir les définitions de champs pour le target
  const fieldDefinitions = useMemo(() => {
    return getFieldDefinitions(target);
  }, [target]);

  // Ajouter un critère de tri
  const addCriterion = useCallback(() => {
    const newCriterion: SortBuilder = {
      id: `criterion_${Date.now()}`,
      field: fieldDefinitions[0]?.field || 'title',
      direction: 'desc',
      algorithm: 'alphabetical',
      weight: 1.0,
      label: fieldDefinitions[0]?.label || 'Titre'
    };
    
    setSortBuilder(prev => [...prev, newCriterion]);
  }, [fieldDefinitions]);

  // Supprimer un critère de tri
  const removeCriterion = useCallback((id: string) => {
    setSortBuilder(prev => prev.filter(criterion => criterion.id !== id));
  }, []);

  // Mettre à jour un critère de tri
  const updateCriterion = useCallback((id: string, updates: Partial<SortBuilder>) => {
    setSortBuilder(prev => prev.map(criterion => 
      criterion.id === id ? { ...criterion, ...updates } : criterion
    ));
  }, []);

  // Appliquer le tri
  const applySortHandler = useCallback(async () => {
    if (!validateSort()) return;

    setIsSorting(true);
    setValidationErrors([]);

    try {
      const sortConfig: SortConfiguration = {
        id: `temp_${Date.now()}`,
        name: 'Tri temporaire',
        target,
        criteria: sortBuilder.map(criterion => ({
          field: criterion.field,
          direction: criterion.direction,
          algorithm: criterion.algorithm,
          weight: criterion.weight
        })),
        defaultSort: false,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (enableClientSide && items.length > 0) {
        // Tri côté client
        const sortedItems = applySortLocal(items, sortConfig);
        onItemsSorted?.(sortedItems);
        
        setLastResult({
          items: sortedItems,
          totalCount: items.length,
          sortedCount: sortedItems.length,
          executionTime: 0,
          appliedSort: sortConfig.criteria
        });
      } else {
        // Tri côté serveur
        const options: SortOptions = {
          target,
          includeMetadata: true,
          limit: 50,
          customConfig: sortConfig
        };

        const result = await applySort<T>(options);
        setLastResult(result);
        onSort?.(result);
      }

      console.log('✅ Tri appliqué avec succès');

    } catch (error) {
      console.error('❌ Erreur application tri:', error);
      setValidationErrors(['Erreur lors de l\'application du tri']);
    } finally {
      setIsSorting(false);
    }
  }, [sortBuilder, target, validateSort, enableClientSide, items, user.id, onSort, onItemsSorted]);

  // Valider la configuration de tri
  const validateSort = useCallback((): boolean => {
    if (sortBuilder.length === 0) {
      setValidationErrors(['Ajoutez au moins un critère de tri']);
      return false;
    }

    const sortConfig: SortConfiguration = {
      id: 'temp',
      name: 'Temp',
      target,
      criteria: sortBuilder.map(criterion => ({
        field: criterion.field,
        direction: criterion.direction,
        algorithm: criterion.algorithm,
        weight: criterion.weight
      })),
      defaultSort: false,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const validation = validateSortConfiguration(sortConfig);
    setValidationErrors(validation.errors);
    return validation.isValid;
  }, [sortBuilder, target, user.id]);

  // Sauvegarder une configuration de tri
  const saveSortConfigurationHandler = useCallback(async (name: string, description?: string) => {
    try {
      const sortConfig: Partial<SortConfiguration> = {
        name,
        description,
        target,
        criteria: sortBuilder.map(criterion => ({
          field: criterion.field,
          direction: criterion.direction,
          algorithm: criterion.algorithm,
          weight: criterion.weight
        })),
        defaultSort: false,
        createdBy: user.id
      };

      const savedConfig = await saveSortConfiguration(sortConfig);
      setSavedSorts(prev => [savedConfig, ...prev]);
      
      console.log('✅ Configuration de tri sauvegardée:', savedConfig.name);
      return savedConfig;

    } catch (error) {
      console.error('❌ Erreur sauvegarde configuration tri:', error);
      throw error;
    }
  }, [sortBuilder, target, user.id]);

  // Charger une configuration de tri sauvegardée
  const loadSortConfiguration = useCallback((sortConfig: SortConfiguration) => {
    const loadedCriteria = sortConfig.criteria.map(criterion => ({
      id: criterion.field,
      field: criterion.field,
      direction: criterion.direction,
      algorithm: criterion.algorithm || 'alphabetical',
      weight: criterion.weight || 1.0,
      label: fieldDefinitions.find(f => f.field === criterion.field)?.label
    }));

    setSortBuilder(loadedCriteria);
    setShowSavedSorts(false);
  }, [fieldDefinitions]);

  // Supprimer une configuration de tri
  const deleteSortConfigurationHandler = useCallback(async (sortConfigId: string) => {
    try {
      await deleteSortConfiguration(sortConfigId);
      setSavedSorts(prev => prev.filter(sort => sort.id !== sortConfigId));
      console.log('✅ Configuration de tri supprimée');
    } catch (error) {
      console.error('❌ Erreur suppression configuration tri:', error);
    }
  }, []);

  // Appliquer un tri rapide
  const applyQuickSort = useCallback((field: string, direction: 'asc' | 'desc' = 'desc') => {
    const fieldDef = fieldDefinitions.find(f => f.field === field);
    if (!fieldDef) return;

    const quickCriterion: SortBuilder = {
      id: `quick_${Date.now()}`,
      field,
      direction,
      algorithm: fieldDef.algorithm || 'alphabetical',
      weight: fieldDef.weight || 1.0,
      label: fieldDef.label
    };

    setSortBuilder([quickCriterion]);
    setActiveSort(`${field}_${direction}`);
    
    // Appliquer automatiquement
    setTimeout(() => {
      applySortHandler();
    }, 100);
  }, [fieldDefinitions, applySortHandler]);

  // Réinitialiser le tri
  const resetSort = useCallback(() => {
    setSortBuilder([]);
    setValidationErrors([]);
    setLastResult(null);
    setSelectedSort(null);
    setActiveSort('updated_at_desc');
    onItemsSorted?.(items);
  }, [items, onItemsSorted]);

  // Obtenir les algorithmes disponibles
  const getAlgorithmsForType = useCallback((fieldType: string): SortAlgorithm[] => {
    switch (fieldType) {
      case 'text':
        return ['alphabetical', 'relevance', 'popularity'];
      case 'number':
        return ['numeric', 'size', 'relevance'];
      case 'date':
        return ['date', 'recent'];
      case 'boolean':
        return ['numeric'];
      default:
        return ['alphabetical'];
    }
  }, []);

  // Render compact (quick sort buttons)
  const renderCompactSort = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">Trier par:</span>
      
      {fieldDefinitions.slice(0, 5).map(field => (
        <button
          key={field.field}
          onClick={() => applyQuickSort(field.field, field.defaultDirection)}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            activeSort === `${field.field}_${field.defaultDirection}`
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {field.label}
        </button>
      ))}
      
      <button
        onClick={() => setShowBuilder(true)}
        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
      >
        ⚙️ Avancé
      </button>
    </div>
  );

  // Render du builder de tri
  const renderSortBuilder = () => (
    <div className="space-y-4">
      {/* Header du builder */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-800">Constructeur de tri</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={addCriterion}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            + Ajouter
          </button>
        </div>
      </div>

      {/* Critères de tri */}
      <div className="space-y-3">
        {sortBuilder.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-4xl mb-4">🔄</div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">Aucun critère</h4>
            <p className="text-gray-600 mb-4">Ajoutez des critères pour trier les résultats</p>
            <button
              onClick={addCriterion}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Ajouter un critère
            </button>
          </div>
        ) : (
          sortBuilder.map((criterion, index) => (
            <div key={criterion.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {/* Champ */}
              <div className="flex-1">
                <select
                  value={criterion.field}
                  onChange={(e) => {
                    const fieldDef = fieldDefinitions.find(f => f.field === e.target.value);
                    updateCriterion(criterion.id, {
                      field: e.target.value,
                      algorithm: fieldDef?.algorithm || 'alphabetical',
                      weight: fieldDef?.weight || 1.0,
                      label: fieldDef?.label
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

              {/* Direction */}
              <div className="w-24">
                <select
                  value={criterion.direction}
                  onChange={(e) => updateCriterion(criterion.id, { direction: e.target.value as 'asc' | 'desc' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="asc">↑ Croissant</option>
                  <option value="desc">↓ Décroissant</option>
                </select>
              </div>

              {/* Algorithme */}
              <div className="w-32">
                <select
                  value={criterion.algorithm}
                  onChange={(e) => updateCriterion(criterion.id, { algorithm: e.target.value as SortAlgorithm })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {getAlgorithmsForType(fieldDefinitions.find(f => f.field === criterion.field)?.type || 'text').map(algorithm => (
                    <option key={algorithm} value={algorithm}>
                      {getAlgorithmLabel(algorithm)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Poids */}
              <div className="w-20">
                <input
                  type="number"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={criterion.weight}
                  onChange={(e) => updateCriterion(criterion.id, { weight: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
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
              {lastResult.sortedCount} éléments triés
              {lastResult.executionTime > 0 && ` (${lastResult.executionTime}ms)`}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={resetSort}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            Réinitialiser
          </button>
          
          {showSave && (
            <button
              onClick={() => {
                const name = prompt('Nom de la configuration:');
                if (name && name.trim()) {
                  saveSortConfigurationHandler(name.trim());
                }
              }}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
            >
              💾 Sauvegarder
            </button>
          )}
          
          <button
            onClick={applySortHandler}
            disabled={isSorting || sortBuilder.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
          >
            {isSorting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Tri...
              </>
            ) : (
              <>
                🔄 Trier
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

  // Render des configurations sauvegardées
  const renderSavedSorts = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-800">Configurations sauvegardées</h4>
        <button
          onClick={() => setShowSavedSorts(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      {savedSorts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">💾</div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">Aucune configuration</h4>
          <p className="text-gray-600">Créez et sauvegardez des configurations pour les réutiliser</p>
        </div>
      ) : (
        <div className="space-y-2">
          {savedSorts.map(sort => (
            <div key={sort.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <div className="font-medium text-gray-800 flex items-center gap-2">
                  {sort.name}
                  {sort.defaultSort && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Défaut</span>
                  )}
                </div>
                {sort.description && (
                  <div className="text-sm text-gray-600">{sort.description}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {sort.criteria.length} critère{sort.criteria.length > 1 ? 's' : ''} • 
                  {sort.usageCount || 0} utilisations
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadSortConfiguration(sort)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Charger
                </button>
                
                {sort.created_by === user.id && (
                  <button
                    onClick={() => deleteSortConfigurationHandler(sort.id)}
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

  // Obtenir le libellé d'un algorithme
  const getAlgorithmLabel = (algorithm: SortAlgorithm): string => {
    const labels: Record<SortAlgorithm, string> = {
      'alphabetical': 'Alphabétique',
      'numeric': 'Numérique',
      'date': 'Date',
      'size': 'Taille',
      'relevance': 'Pertinence',
      'popularity': 'Popularité',
      'recent': 'Récence',
      'custom': 'Personnalisé'
    };
    return labels[algorithm] || algorithm;
  };

  // Render principal
  if (compact) {
    return renderCompactSort();
  }

  return (
    <div className={`custom-sorting ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>🔄</span>
            Tri Personnalisé
          </h3>
          <p className="text-sm text-gray-600">
            Organisez vos contenus avec des critères de tri avancés
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {showPresets && (
            <button
              onClick={() => setShowPresetsModal(true)}
              className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
            >
              ⚡ Rapides
            </button>
          )}
          
          <button
            onClick={() => setShowSavedSorts(true)}
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

      {/* Quick sort buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {fieldDefinitions.slice(0, 6).map(field => (
          <button
            key={field.field}
            onClick={() => applyQuickSort(field.field, field.defaultDirection)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              activeSort === `${field.field}_${field.defaultDirection}`
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {field.label}
          </button>
        ))}
      </div>

      {/* Builder de tri */}
      {showBuilder && renderSortBuilder()}

      {/* Modal des configurations sauvegardées */}
      {showSavedSorts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4">
              {renderSavedSorts()}
            </div>
          </div>
        </div>
      )}

      {/* Modal des tris rapides */}
      {showPresetsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-800">Tris rapides</h4>
                <button
                  onClick={() => setShowPresetsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => applyQuickSort('updated_at', 'desc')}
                  className="w-full text-left px-3 py-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium">Les plus récents</div>
                  <div className="text-sm text-gray-600">Modifiés récemment</div>
                </button>
                
                <button
                  onClick={() => applyQuickSort('title', 'asc')}
                  className="w-full text-left px-3 py-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium">Alphabétique</div>
                  <div className="text-sm text-gray-600">Ordre alphabétique</div>
                </button>
                
                <button
                  onClick={() => applyQuickSort('file_size', 'desc')}
                  className="w-full text-left px-3 py-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium">Les plus volumineux</div>
                  <div className="text-sm text-gray-600">Par taille décroissante</div>
                </button>
                
                <button
                  onClick={() => applyQuickSort('relevance_score', 'desc')}
                  className="w-full text-left px-3 py-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium">Par pertinence</div>
                  <div className="text-sm text-gray-600">Score IA le plus élevé</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Résultats du tri */}
      {lastResult && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              <strong>Tri appliqué:</strong> {lastResult.sortedCount} éléments
              {lastResult.executionTime > 0 && ` (${lastResult.executionTime}ms)`}
            </div>
            {lastResult.metadata && (
              <div className="text-xs text-blue-600">
                Algorithme: {lastResult.metadata.algorithm}
              </div>
            )}
          </div>
          
          {lastResult.appliedSort && (
            <div className="mt-2 text-xs text-blue-600">
              Critères: {lastResult.appliedSort.map(c => `${c.field} ${c.direction}`).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSorting;
