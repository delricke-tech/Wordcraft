import { useState, useEffect } from 'react';
import { 
  Bookmark, 
  X,
  Check,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Folder,
  Star,
  Search
} from 'lucide-react';
import { bookmarksService, BookmarkCategory, BookmarkCollection } from '../services/bookmarksService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface BookmarksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
}

export function BookmarksPanel({ isOpen, onClose, documentId }: BookmarksPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [categories, setCategories] = useState<BookmarkCategory[]>([]);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'collections' | 'categories'>('bookmarks');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBookmark, setNewBookmark] = useState({
    title: '',
    description: '',
    url: '',
    categoryId: '',
    collectionId: '',
    tags: []
  });

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    try {
      const [bookmarksData, collectionsData, categoriesData] = await Promise.all([
        bookmarksService.getUserBookmarks(user!.id),
        bookmarksService.getUserCollections(user!.id),
        bookmarksService.getBookmarkCategories()
      ]);
      
      setBookmarks(bookmarksData);
      setCollections(collectionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erreur chargement bookmarks:', error);
    }
  };

  const handleAddBookmark = async () => {
    if (!user || !documentId) return;
    
    setLoading(true);
    try {
      await bookmarksService.addBookmark({
        userId: user.id,
        documentId,
        title: newBookmark.title || `Document ${Date.now()}`,
        description: newBookmark.description,
        url: newBookmark.url,
        categoryId: newBookmark.categoryId,
        collectionId: newBookmark.collectionId,
        tags: newBookmark.tags
      });
      
      toast.success('Bookmark ajouté !');
      setShowAddForm(false);
      setNewBookmark({
        title: '',
        description: '',
        url: '',
        categoryId: '',
        collectionId: '',
        tags: []
      });
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    setLoading(true);
    try {
      await bookmarksService.deleteBookmark(bookmarkId);
      toast.success('Bookmark supprimé');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    const name = prompt('Nom de la collection :');
    if (!name || !user) return;
    
    setLoading(true);
    try {
      await bookmarksService.createCollection({
        userId: user.id,
        name,
        description: '',
        isPublic: false,
        tags: []
      });
      
      toast.success('Collection créée !');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    switch (category?.name) {
      case 'documents': return <FileText className="w-4 h-4" />;
      case 'research': return <Star className="w-4 h-4" />;
      case 'study': return <Folder className="w-4 h-4" />;
      default: return <Bookmark className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#6B7280';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Bookmark className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bookmarks</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {bookmarks.length} bookmarks, {collections.length} collections
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
            { id: 'collections', label: 'Collections', icon: Folder },
            { id: 'categories', label: 'Catégories', icon: Tag }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Mes Bookmarks
                </h3>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              {showAddForm && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-4">
                  <input
                    type="text"
                    placeholder="Titre"
                    value={newBookmark.title}
                    onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                  <textarea
                    placeholder="Description"
                    value={newBookmark.description}
                    onChange={(e) => setNewBookmark({ ...newBookmark, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                  <select
                    value={newBookmark.categoryId}
                    onChange={(e) => setNewBookmark({ ...newBookmark, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddBookmark}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Ajouter
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {bookmarks.length > 0 ? (
                <div className="grid gap-3">
                  {bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: getCategoryColor(bookmark.categoryId) }}
                        >
                          {getCategoryIcon(bookmark.categoryId)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {bookmark.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {bookmark.description || 'Pas de description'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteBookmark(bookmark.id)}
                        disabled={loading}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun bookmark</p>
                  <p className="text-sm mt-1">Ajoutez vos premiers bookmarks</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'collections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Collections
                </h3>
                <button
                  onClick={handleCreateCollection}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle collection
                </button>
              </div>

              {collections.length > 0 ? (
                <div className="grid gap-3">
                  {collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {collection.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {collection.description || 'Pas de description'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                          {collection.isPublic ? 'Public' : 'Privé'}
                        </span>
                        <button className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-500 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune collection</p>
                  <p className="text-sm mt-1">Créez vos premières collections</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Catégories
              </h3>

              <div className="grid gap-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {category.description || 'Pas de description'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                      {category.isDefault ? 'Défaut' : 'Personnalisé'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
