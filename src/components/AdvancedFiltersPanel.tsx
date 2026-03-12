import { useState, useEffect } from 'react';
import { 
  Filter, 
  ArrowUpDown, 
  Bookmark, 
  X, 
  ChevronDown,
  SlidersHorizontal,
  Star,
  Pin,
  Calendar,
  FileText,
  Hash,
  Tag
} from 'lucide-react';
import { advancedFiltersService, FilterCriterion, FilterPreset } from '../services/advancedFiltersService';
import { customSortingService, SortConfiguration, SortCriterion } from '../services/customSortingService';
import { bookmarksService, BookmarkCategory } from '../services/bookmarksService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface AdvancedFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterCriterion[]) => void;
  onApplySort: (criteria: SortCriterion[]) => void;
  onShowFavorites: (show: boolean) => void;
  showFavorites: boolean;
  documentCount: number;
  filteredCount: number;
}

export function AdvancedFiltersPanel({
  isOpen,
  onClose,
  onApplyFilters,
  onApplySort,
  onShowFavorites,
  showFavorites,
  documentCount,
  filteredCount
}: AdvancedFiltersPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'filters' | 'sort' | 'bookmarks'>('filters');
  
  // Filters state
  const [availableFilters, setAvailableFilters] = useState<FilterCriterion[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterCriterion[]>([]);
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  
  // Sort state
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'created_at', direction: 'desc', algorithm: 'date' }
  ]);
  const [sortConfigs, setSortConfigs] = useState<SortConfiguration[]>([]);
  
  // Bookmarks state
  const [bookmarkCategories, setBookmarkCategories] = useState<BookmarkCategory[]>([]);
  const [bookmarkStats, setBookmarkStats] = useState({
    totalBookmarks: 0,
    pinnedBookmarks: 0,
    byType: {} as Record<string, number>
  });

  useEffect(() => {
    if (isOpen && user) {
      loadFilterPresets();
      loadSortConfigs();
      loadBookmarkCategories();
      loadBookmarkStats();
    }
  }, [isOpen, user]);

  const loadFilterPresets = async () => {
    try {
      const presets = await advancedFiltersService.getFilterPresets(user!.id, 'documents');
      setFilterPresets(presets);
    } catch (error) {
      console.error('Erreur chargement presets:', error);
    }
  };

  const loadSortConfigs = async () => {
    try {
      const configs = await customSortingService.getSortConfigurations(user!.id, 'documents');
      setSortConfigs(configs);
    } catch (error) {
      console.error('Erreur chargement configs tri:', error);
    }
  };

  const loadBookmarkCategories = async () => {
    try {
      const categories = await bookmarksService.getCategories(user!.id);
      setBookmarkCategories(categories);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const loadBookmarkStats = async () => {
    try {
      const stats = await bookmarksService.getBookmarkStats(user!.id);
      setBookmarkStats({
        totalBookmarks: stats.totalBookmarks,
        pinnedBookmarks: stats.pinnedBookmarks.length,
        byType: stats.bookmarksByType
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleAddFilter = (field: string, operator: string, value: any) => {
    const newFilter: FilterCriterion = {
      id: Date.now().toString(),
      field,
      operator: operator as any,
      value,
      valueType: 'text',
      label: getFieldLabel(field)
    };
    setActiveFilters([...activeFilters, newFilter]);
  };

  const handleRemoveFilter = (id: string) => {
    setActiveFilters(activeFilters.filter(f => f.id !== id));
  };

  const handleApplyFilters = () => {
    onApplyFilters(activeFilters);
    toast.success(`${activeFilters.length} filtre(s) appliqué(s)`);
  };

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    const newCriteria: SortCriterion = { 
      field, 
      direction,
      algorithm: getAlgorithmForField(field)
    };
    setSortCriteria([newCriteria]);
    onApplySort([newCriteria]);
    toast.success(`Tri par ${getFieldLabel(field)} ${direction === 'asc' ? 'croissant' : 'décroissant'}`);
  };

  const handleSaveAsPreset = async () => {
    if (!user) return;
    
    try {
      await advancedFiltersService.saveFilterPreset({
        name: `Preset ${filterPresets.length + 1}`,
        target: 'documents',
        filterGroup: {
          id: Date.now().toString(),
          name: `Groupe ${Date.now()}`,
          criteria: activeFilters,
          logicalOperator: 'AND',
          isPublic: false,
          createdBy: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Filtres sauvegardés comme preset');
      loadFilterPresets();
    } catch (error) {
      toast.error('Erreur sauvegarde preset');
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      'title': 'Titre',
      'document_name': 'Nom du fichier',
      'file_type': 'Type',
      'file_size': 'Taille',
      'created_at': 'Date de création',
      'updated_at': 'Date de modification',
      'word_count': 'Nombre de mots',
      'relevance_score': 'Pertinence',
      'access_count': 'Accès'
    };
    return labels[field] || field;
  };

  const getAlgorithmForField = (field: string): any => {
    const algorithms: Record<string, any> = {
      'title': 'alphabetical',
      'document_name': 'alphabetical',
      'file_size': 'size',
      'word_count': 'size',
      'created_at': 'date',
      'updated_at': 'recent',
      'relevance_score': 'relevance',
      'access_count': 'popularity'
    };
    return algorithms[field] || 'alphabetical';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtres & Tri</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {filteredCount} / {documentCount} documents
          </span>
          {activeFilters.length > 0 && (
            <span className="text-teal-600 font-medium">
              {activeFilters.length} filtre(s)
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('filters')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'filters' 
              ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50 dark:bg-teal-900/20' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtres
        </button>
        <button
          onClick={() => setActiveTab('sort')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'sort' 
              ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50 dark:bg-teal-900/20' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ArrowUpDown className="w-4 h-4" />
          Tri
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'bookmarks' 
              ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50 dark:bg-teal-900/20' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Favoris
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        
        {/* FILTERS TAB */}
        {activeTab === 'filters' && (
          <div className="space-y-4">
            {/* Quick Filters */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Filtres rapides
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleAddFilter('file_type', 'equals', 'pdf')}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Documents PDF</span>
                </button>
                <button
                  onClick={() => handleAddFilter('created_at', 'greater_than', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Cette semaine</span>
                </button>
                <button
                  onClick={() => handleAddFilter('word_count', 'greater_than', 1000)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <Hash className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">+1000 mots</span>
                </button>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Filtres actifs
                </h3>
                <div className="space-y-2">
                  {activeFilters.map(filter => (
                    <div 
                      key={filter.id}
                      className="flex items-center justify-between p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-200 dark:border-teal-800"
                    >
                      <span className="text-sm text-teal-800 dark:text-teal-200">
                        {filter.label}
                      </span>
                      <button 
                        onClick={() => handleRemoveFilter(filter.id)}
                        className="p-1 hover:bg-teal-100 dark:hover:bg-teal-800 rounded"
                      >
                        <X className="w-3 h-3 text-teal-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Presets */}
            {filterPresets.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Presets sauvegardés
                </h3>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                >
                  <option value="">Choisir un preset...</option>
                  {filterPresets.map(preset => (
                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleApplyFilters}
                className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                Appliquer
              </button>
              <button
                onClick={() => {
                  setActiveFilters([]);
                  onApplyFilters([]);
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}

        {/* SORT TAB */}
        {activeTab === 'sort' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Trier par
              </h3>
              <div className="space-y-2">
                {[
                  { field: 'created_at', label: 'Date de création', icon: Calendar },
                  { field: 'updated_at', label: 'Date de modification', icon: Calendar },
                  { field: 'title', label: 'Titre', icon: FileText },
                  { field: 'file_size', label: 'Taille', icon: Hash },
                  { field: 'word_count', label: 'Nombre de mots', icon: Hash },
                  { field: 'relevance_score', label: 'Pertinence', icon: Star },
                  { field: 'access_count', label: 'Popularité', icon: Pin }
                ].map(({ field, label, icon: Icon }) => (
                  <div key={field} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSortChange(field, 'asc')}
                        className={`p-1 rounded ${sortCriteria[0]?.field === field && sortCriteria[0]?.direction === 'asc' ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleSortChange(field, 'desc')}
                        className={`p-1 rounded ${sortCriteria[0]?.field === field && sortCriteria[0]?.direction === 'desc' ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BOOKMARKS TAB */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-4">
            {/* Show Favorites Toggle */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Afficher les favoris</span>
                </div>
                <button
                  onClick={() => onShowFavorites(!showFavorites)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showFavorites ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showFavorites ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {showFavorites && (
                <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  Affichage des documents favoris uniquement
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <div className="text-2xl font-bold text-teal-600">{bookmarkStats.totalBookmarks}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Favoris</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <div className="text-2xl font-bold text-teal-600">{bookmarkStats.pinnedBookmarks}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Épinglés</div>
              </div>
            </div>

            {/* Categories */}
            {bookmarkCategories.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Catégories
                </h3>
                <div className="space-y-2">
                  {bookmarkCategories.map(category => (
                    <div 
                      key={category.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{category.bookmarkCount || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By Type */}
            {Object.keys(bookmarkStats.byType).length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Par type
                </h3>
                <div className="space-y-2">
                  {Object.entries(bookmarkStats.byType).map(([type, count]) => (
                    <div 
                      key={type}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{type}</span>
                      <span className="text-xs text-gray-500">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
