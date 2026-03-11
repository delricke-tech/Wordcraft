/**
 * Composant de gestion des bookmarks intelligents (système de favoris)
 * 
 * Ce composant permet de gérer des bookmarks avec tags, catégories,
 * recherche et suggestions basées sur l'usage
 * 
 * Date: 11 mars 2026
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  createBookmark,
  getBookmarks,
  updateBookmark,
  deleteBookmark,
  toggleBookmark,
  getBookmarkStats,
  searchBookmarks,
  getBookmarkSuggestions,
  createCategory,
  getCategories,
  createCollection,
  getCollections,
  exportBookmarks,
  importBookmarks,
  type Bookmark,
  type BookmarkCategory,
  type BookmarkCollection,
  type BookmarkOptions,
  type BookmarkType,
  type BookmarkStats
} from '../services/bookmarksService';
import type { User } from '../contexts/AuthContext';

interface BookmarkManagerProps {
  user: User;
  onBookmarkToggle?: (targetId: string, targetType: string, isBookmarked: boolean) => void;
  className?: string;
  showStats?: boolean;
  showCategories?: boolean;
  showCollections?: boolean;
  compact?: boolean;
}

const BookmarkManager: React.FC<BookmarkManagerProps> = ({
  user,
  onBookmarkToggle,
  className = '',
  showStats = true,
  showCategories = true,
  showCollections = true,
  compact = false
}) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<BookmarkCategory[]>([]);
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [stats, setStats] = useState<BookmarkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour les modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // États pour les filtres et recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<BookmarkType | ''>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'title' | 'access_count'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // État pour le formulaire de création
  const [newBookmark, setNewBookmark] = useState({
    title: '',
    description: '',
    url: '',
    type: 'document' as BookmarkType,
    targetId: '',
    targetType: 'document' as const,
    tags: [] as string[],
    category: '',
    isPublic: false,
    isPinned: false,
    priority: 'medium' as const
  });

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [bookmarksData, categoriesData, collectionsData, statsData] = await Promise.all([
        getBookmarks({ userId: user.id }),
        getCategories(user.id),
        getCollections(user.id),
        getBookmarkStats(user.id)
      ]);

      setBookmarks(bookmarksData);
      setCategories(categoriesData);
      setCollections(collectionsData);
      setStats(statsData);

    } catch (err) {
      setError('Impossible de charger les bookmarks');
      console.error('Erreur chargement bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les bookmarks
  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks;

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(bookmark => 
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (selectedCategory) {
      filtered = filtered.filter(bookmark => bookmark.category === selectedCategory);
    }

    // Filtre par type
    if (selectedType) {
      filtered = filtered.filter(bookmark => bookmark.type === selectedType);
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updated_at':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'access_count':
          comparison = (a.accessCount || 0) - (b.accessCount || 0);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [bookmarks, searchQuery, selectedCategory, selectedType, sortBy, sortOrder]);

  // Créer un nouveau bookmark
  const handleCreateBookmark = async () => {
    if (!newBookmark.title.trim()) {
      setError('Le titre est requis');
      return;
    }

    try {
      const bookmark = await createBookmark({
        ...newBookmark,
        createdBy: user.id
      });

      setBookmarks(prev => [bookmark, ...prev]);
      setShowCreateModal(false);
      resetNewBookmark();
      
      console.log('✅ Bookmark créé:', bookmark.title);

    } catch (err) {
      setError('Impossible de créer le bookmark');
      console.error('Erreur création bookmark:', err);
    }
  };

  // Basculer l'état favori
  const handleToggleBookmark = async (targetId: string, targetType: string) => {
    try {
      const bookmark = await toggleBookmark(targetId, targetType, user.id);
      const isBookmarked = bookmark !== null;

      if (isBookmarked) {
        setBookmarks(prev => [bookmark!, ...prev]);
      } else {
        setBookmarks(prev => prev.filter(b => b.targetId !== targetId));
      }

      onBookmarkToggle?.(targetId, targetType, isBookmarked);

    } catch (err) {
      setError('Impossible de basculer le bookmark');
      console.error('Erreur basculement bookmark:', err);
    }
  };

  // Supprimer un bookmark
  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      await deleteBookmark(bookmarkId);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      console.log('✅ Bookmark supprimé');
    } catch (err) {
      setError('Impossible de supprimer le bookmark');
      console.error('Erreur suppression bookmark:', err);
    }
  };

  // Exporter les bookmarks
  const handleExport = async () => {
    try {
      const exportData = await exportBookmarks(user.id);
      
      // Télécharger le fichier
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bookmarks_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Bookmarks exportés');

    } catch (err) {
      setError('Impossible d\'exporter les bookmarks');
      console.error('Erreur export bookmarks:', err);
    }
  };

  // Importer des bookmarks
  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const result = await importBookmarks(text, user.id);
      
      if (result.errors.length > 0) {
        setError(`Import terminé avec ${result.errors.length} erreurs`);
      } else {
        setError(`Import réussi: ${result.imported} bookmarks importés`);
      }

      await loadData(); // Recharger les données

    } catch (err) {
      setError('Impossible d\'importer les bookmarks');
      console.error('Erreur import bookmarks:', err);
    }
  };

  // Réinitialiser le formulaire
  const resetNewBookmark = () => {
    setNewBookmark({
      title: '',
      description: '',
      url: '',
      type: 'document',
      targetId: '',
      targetType: 'document',
      tags: [],
      category: '',
      isPublic: false,
      isPinned: false,
      priority: 'medium'
    });
  };

  // Render compact
  if (compact) {
    return (
      <div className={`bookmark-manager-compact ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Favoris:</span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 text-yellow-500 hover:bg-yellow-50 rounded transition-colors"
            title="Ajouter aux favoris"
          >
            ⭐
          </button>
          <span className="text-sm font-medium text-gray-800">
            {stats?.totalBookmarks || 0}
          </span>
        </div>

        {/* Modal de création compact */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ajouter aux favoris</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                    <input
                      type="text"
                      value={newBookmark.title}
                      onChange={(e) => setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Nom du favori"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL (optionnel)</label>
                    <input
                      type="url"
                      value={newBookmark.url}
                      onChange={(e) => setNewBookmark(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetNewBookmark();
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateBookmark}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render complet
  return (
    <div className={`bookmark-manager ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>⭐</span>
            Bookmarks Intelligents
          </h3>
          <p className="text-sm text-gray-600">
            Organisez vos favoris avec tags et catégories
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            📤 Exporter
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
          >
            📥 Importer
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Nouveau Bookmark
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-700">{stats.totalBookmarks}</div>
            <div className="text-xs text-blue-600">Total bookmarks</div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-700">{stats.pinnedBookmarks.length}</div>
            <div className="text-xs text-green-600">Épinglés</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-700">{stats.topTags.length}</div>
            <div className="text-xs text-purple-600">Tags uniques</div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-700">{stats.mostAccessed.length}</div>
            <div className="text-xs text-yellow-600">Plus consultés</div>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans les bookmarks..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Toutes catégories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as BookmarkType)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Tous types</option>
            <option value="document">Documents</option>
            <option value="note">Notes</option>
            <option value="conversation">Conversations</option>
            <option value="flashcard">Flashcards</option>
            <option value="quiz">Quiz</option>
            <option value="website">Sites web</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="updated_at">Dernière modification</option>
            <option value="created_at">Date de création</option>
            <option value="title">Titre</option>
            <option value="access_count">Nombre d'accès</option>
          </select>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Liste des bookmarks */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⭐</div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">
              {searchQuery || selectedCategory || selectedType ? 'Aucun résultat' : 'Aucun bookmark'}
            </h4>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Essayez une autre recherche' : 'Créez votre premier bookmark'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Créer un bookmark
            </button>
          </div>
        ) : (
          filteredBookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800">{bookmark.title}</h4>
                    {bookmark.isPinned && <span className="text-yellow-500">📌</span>}
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {bookmark.type}
                    </span>
                    {bookmark.category && (
                      <span 
                        className="px-2 py-1 text-xs rounded"
                        style={{ 
                          backgroundColor: categories.find(c => c.name === bookmark.category)?.color || '#e5e7eb',
                          color: '#374151'
                        }}
                      >
                        {bookmark.category}
                      </span>
                    )}
                  </div>
                  
                  {bookmark.description && (
                    <p className="text-sm text-gray-600 mb-2">{bookmark.description}</p>
                  )}
                  
                  {bookmark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {bookmark.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Accédé {bookmark.accessCount || 0} fois • 
                    Dernier accès: {bookmark.lastAccessed ? new Date(bookmark.lastAccessed).toLocaleDateString() : 'Jamais'}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {bookmark.url && (
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                      title="Visiter le lien"
                    >
                      🔗
                    </a>
                  )}
                  
                  <button
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Créer un bookmark</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                    <input
                      type="text"
                      value={newBookmark.title}
                      onChange={(e) => setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Nom du bookmark"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                    <input
                      type="url"
                      value={newBookmark.url}
                      onChange={(e) => setNewBookmark(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newBookmark.description}
                    onChange={(e) => setNewBookmark(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Description du bookmark"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={newBookmark.type}
                      onChange={(e) => setNewBookmark(prev => ({ ...prev, type: e.target.value as BookmarkType }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="document">Document</option>
                      <option value="note">Note</option>
                      <option value="conversation">Conversation</option>
                      <option value="flashcard">Flashcard</option>
                      <option value="quiz">Quiz</option>
                      <option value="website">Site web</option>
                      <option value="article">Article</option>
                      <option value="video">Vidéo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <select
                      value={newBookmark.category}
                      onChange={(e) => setNewBookmark(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Aucune</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                    <select
                      value={newBookmark.priority}
                      onChange={(e) => setNewBookmark(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input
                    type="text"
                    value={newBookmark.tags.join(', ')}
                    onChange={(e) => setNewBookmark(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newBookmark.isPinned}
                      onChange={(e) => setNewBookmark(prev => ({ ...prev, isPinned: e.target.checked }))}
                      className="rounded"
                    />
                    Épingler
                  </label>
                  
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newBookmark.isPublic}
                      onChange={(e) => setNewBookmark(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="rounded"
                    />
                    Public
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetNewBookmark();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateBookmark}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'import */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Importer des bookmarks</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fichier JSON
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImport(file);
                        setShowImportModal(false);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <p className="text-sm text-gray-600">
                  Sélectionnez un fichier JSON exporté depuis WordCraft
                </p>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarkManager;
