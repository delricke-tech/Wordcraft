/**
 * Service de bookmarks intelligents (système de favoris)
 * 
 * Ce service permet de gérer des bookmarks intelligents avec tags,
 * catégories, recherche et suggestions basées sur l'usage
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface Bookmark {
  id: string;
  title: string;
  description?: string;
  url?: string;
  type: BookmarkType;
  targetId: string;
  targetType: 'document' | 'note' | 'conversation' | 'flashcard' | 'quiz' | 'folder' | 'external';
  tags: string[];
  category?: string;
  isPublic: boolean;
  isPinned: boolean;
  priority: 'low' | 'medium' | 'high';
  metadata: BookmarkMetadata;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastAccessed?: string;
  accessCount: number;
}

export type BookmarkType = 
  | 'document'
  | 'note'
  | 'conversation'
  | 'flashcard'
  | 'quiz'
  | 'folder'
  | 'website'
  | 'article'
  | 'video'
  | 'tool'
  | 'resource';

export interface BookmarkMetadata {
  thumbnail?: string;
  preview?: string;
  excerpt?: string;
  wordCount?: number;
  readingTime?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  language?: string;
  fileSize?: number;
  fileType?: string;
  relevanceScore?: number;
  customFields?: Record<string, any>;
}

export interface BookmarkCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  parentId?: string;
  isPublic: boolean;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  bookmarkCount?: number;
}

export interface BookmarkCollection {
  id: string;
  name: string;
  description?: string;
  bookmarkIds: string[];
  isPublic: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  bookmarkCount?: number;
}

export interface BookmarkOptions {
  includeMetadata?: boolean;
  includeCategories?: boolean;
  includeCollections?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'title' | 'access_count' | 'priority';
  sortOrder?: 'asc' | 'desc';
  tags?: string[];
  category?: string;
  type?: BookmarkType;
  targetType?: string;
  search?: string;
  isPublic?: boolean;
  isPinned?: boolean;
  priority?: 'low' | 'medium' | 'high';
  userId?: string;
}

export interface BookmarkStats {
  totalBookmarks: number;
  bookmarksByType: Record<BookmarkType, number>;
  bookmarksByCategory: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  recentlyAccessed: Bookmark[];
  mostAccessed: Bookmark[];
  pinnedBookmarks: Bookmark[];
}

class BookmarksService {
  /**
   * Crée un nouveau bookmark
   */
  async createBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>): Promise<Bookmark> {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          title: bookmark.title,
          description: bookmark.description,
          url: bookmark.url,
          type: bookmark.type,
          target_id: bookmark.targetId,
          target_type: bookmark.targetType,
          tags: bookmark.tags,
          category: bookmark.category,
          is_public: bookmark.isPublic,
          is_pinned: bookmark.isPinned,
          priority: bookmark.priority,
          metadata: bookmark.metadata,
          created_by: bookmark.createdBy,
          last_accessed: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer le bookmark');

      console.log('✅ Bookmark créé:', data.title);
      return this.mapBookmarkFromDB(data);

    } catch (error) {
      console.error('❌ Erreur création bookmark:', error);
      throw new Error(`Échec de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les bookmarks d'un utilisateur
   */
  async getBookmarks(options: BookmarkOptions = {}): Promise<Bookmark[]> {
    try {
      let query = supabase
        .from('bookmarks')
        .select(`
          *,
          bookmark_categories(name, color, icon),
          bookmark_collections(id, name, is_default)
        `);

      // Appliquer les filtres
      if (options.userId) {
        query = query.eq('created_by', options.userId);
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.targetType) {
        query = query.eq('target_type', options.targetType);
      }

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.isPublic !== undefined) {
        query = query.eq('is_public', options.isPublic);
      }

      if (options.isPinned !== undefined) {
        query = query.eq('is_pinned', options.isPinned);
      }

      if (options.priority) {
        query = query.eq('priority', options.priority);
      }

      if (options.tags && options.tags.length > 0) {
        query = query.contains('tags', options.tags);
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      // Appliquer le tri
      const sortBy = options.sortBy || 'updated_at';
      const sortOrder = options.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Appliquer la pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      // Note: offset n'est pas disponible dans cette version de supabase-js

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(this.mapBookmarkFromDB);

    } catch (error) {
      console.error('❌ Erreur récupération bookmarks:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour un bookmark
   */
  async updateBookmark(id: string, updates: Partial<Bookmark>): Promise<Bookmark> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Mapper les champs camelCase vers snake_case
      if (updates.targetId !== undefined) {
        updateData.target_id = updates.targetId;
        delete updateData.targetId;
      }
      if (updates.targetType !== undefined) {
        updateData.target_type = updates.targetType;
        delete updateData.targetType;
      }
      if (updates.isPublic !== undefined) {
        updateData.is_public = updates.isPublic;
        delete updateData.isPublic;
      }
      if (updates.isPinned !== undefined) {
        updateData.is_pinned = updates.isPinned;
        delete updateData.isPinned;
      }

      const { data, error } = await supabase
        .from('bookmarks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Bookmark non trouvé');

      console.log('✅ Bookmark mis à jour:', data.title);
      return this.mapBookmarkFromDB(data);

    } catch (error) {
      console.error('❌ Erreur mise à jour bookmark:', error);
      throw new Error(`Échec de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Supprime un bookmark
   */
  async deleteBookmark(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Bookmark supprimé');

    } catch (error) {
      console.error('❌ Erreur suppression bookmark:', error);
      throw new Error(`Échec de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Bascule l'état favori d'un élément
   */
  async toggleBookmark(targetId: string, targetType: string, userId: string): Promise<Bookmark | null> {
    try {
      // Vérifier si le bookmark existe déjà
      const existing = await this.getBookmarks({
        userId,
        targetType,
        limit: 1
      }).then(bookmarks => bookmarks.find(b => b.targetId === targetId));

      if (existing) {
        // Supprimer le bookmark existant
        await this.deleteBookmark(existing.id);
        return null;
      } else {
        // Créer un nouveau bookmark
        const targetInfo = await this.getTargetInfo(targetId, targetType);
        const newBookmark = await this.createBookmark({
          title: targetInfo.title,
          description: targetInfo.description,
          type: targetType as BookmarkType,
          targetId,
          targetType: targetType as any,
          tags: targetInfo.tags || [],
          isPublic: false,
          isPinned: false,
          priority: 'medium',
          metadata: targetInfo.metadata || {},
          createdBy: userId
        });
        return newBookmark;
      }

    } catch (error) {
      console.error('❌ Erreur basculement bookmark:', error);
      throw new Error(`Échec du basculement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Incrémente le compteur d'accès
   */
  async incrementAccessCount(id: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_bookmark_access', { bookmark_id: id });

      if (error) throw error;

      console.log('✅ Compteur d\'accès incrémenté');

    } catch (error) {
      console.error('❌ Erreur incrémentation accès:', error);
    }
  }

  /**
   * Obtient les statistiques des bookmarks
   */
  async getBookmarkStats(userId: string): Promise<BookmarkStats> {
    try {
      const { data, error } = await supabase.rpc('get_bookmark_stats', { user_id: userId });

      if (error) throw error;

      const stats = data || {
        total_bookmarks: 0,
        bookmarks_by_type: {},
        bookmarks_by_category: {},
        top_tags: [],
        recently_accessed: [],
        most_accessed: [],
        pinned_bookmarks: []
      };

      return {
        totalBookmarks: stats.total_bookmarks,
        bookmarksByType: stats.bookmarks_by_type as Record<BookmarkType, number>,
        bookmarksByCategory: stats.bookmarks_by_category,
        topTags: stats.top_tags,
        recentlyAccessed: (stats.recently_accessed || []).map(this.mapBookmarkFromDB),
        mostAccessed: (stats.most_accessed || []).map(this.mapBookmarkFromDB),
        pinnedBookmarks: (stats.pinned_bookmarks || []).map(this.mapBookmarkFromDB)
      };

    } catch (error) {
      console.error('❌ Erreur statistiques bookmarks:', error);
      return {
        totalBookmarks: 0,
        bookmarksByType: {} as Record<BookmarkType, number>,
        bookmarksByCategory: {},
        topTags: [],
        recentlyAccessed: [],
        mostAccessed: [],
        pinnedBookmarks: []
      };
    }
  }

  /**
   * Recherche des bookmarks
   */
  async searchBookmarks(query: string, userId: string, options: Partial<BookmarkOptions> = {}): Promise<Bookmark[]> {
    return this.getBookmarks({
      userId,
      search: query,
      ...options
    });
  }

  /**
   * Obtient les suggestions de bookmarks basées sur l'usage
   */
  async getBookmarkSuggestions(userId: string, limit: number = 10): Promise<Bookmark[]> {
    try {
      const { data, error } = await supabase.rpc('get_bookmark_suggestions', {
        user_id: userId,
        limit
      });

      if (error) throw error;
      return (data || []).map(this.mapBookmarkFromDB);

    } catch (error) {
      console.error('❌ Erreur suggestions bookmarks:', error);
      return [];
    }
  }

  /**
   * Crée une catégorie de bookmarks
   */
  async createCategory(category: Omit<BookmarkCategory, 'id' | 'createdAt' | 'updatedAt' | 'bookmarkCount'>): Promise<BookmarkCategory> {
    try {
      const { data, error } = await supabase
        .from('bookmark_categories')
        .insert({
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          parent_id: category.parentId,
          is_public: category.isPublic,
          sort_order: category.sortOrder,
          created_by: category.createdBy
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer la catégorie');

      console.log('✅ Catégorie créée:', data.name);
      return this.mapCategoryFromDB(data);

    } catch (error) {
      console.error('❌ Erreur création catégorie:', error);
      throw new Error(`Échec de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les catégories de bookmarks
   */
  async getCategories(userId: string): Promise<BookmarkCategory[]> {
    try {
      const { data, error } = await supabase
        .from('bookmark_categories')
        .select('*')
        .eq('created_by', userId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []).map(this.mapCategoryFromDB);

    } catch (error) {
      console.error('❌ Erreur récupération catégories:', error);
      return [];
    }
  }

  /**
   * Crée une collection de bookmarks
   */
  async createCollection(collection: Omit<BookmarkCollection, 'id' | 'createdAt' | 'updatedAt' | 'bookmarkCount'>): Promise<BookmarkCollection> {
    try {
      const { data, error } = await supabase
        .from('bookmark_collections')
        .insert({
          name: collection.name,
          description: collection.description,
          bookmark_ids: collection.bookmarkIds,
          is_public: collection.isPublic,
          is_default: collection.isDefault,
          created_by: collection.createdBy
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer la collection');

      console.log('✅ Collection créée:', data.name);
      return this.mapCollectionFromDB(data);

    } catch (error) {
      console.error('❌ Erreur création collection:', error);
      throw new Error(`Échec de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les collections de bookmarks
   */
  async getCollections(userId: string): Promise<BookmarkCollection[]> {
    try {
      const { data, error } = await supabase
        .from('bookmark_collections')
        .select('*')
        .eq('created_by', userId)
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      return (data || []).map(this.mapCollectionFromDB);

    } catch (error) {
      console.error('❌ Erreur récupération collections:', error);
      return [];
    }
  }

  /**
   * Exporte les bookmarks au format JSON
   */
  async exportBookmarks(userId: string, options: BookmarkOptions = {}): Promise<string> {
    try {
      const bookmarks = await this.getBookmarks({ userId, ...options });
      const categories = await this.getCategories(userId);
      const collections = await this.getCollections(userId);

      const exportData = {
        bookmarks,
        categories,
        collections,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      return JSON.stringify(exportData, null, 2);

    } catch (error) {
      console.error('❌ Erreur export bookmarks:', error);
      throw new Error(`Échec de l'export: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Importe des bookmarks depuis du JSON
   */
  async importBookmarks(jsonString: string, userId: string): Promise<{
    imported: number;
    errors: string[];
  }> {
    try {
      const importData = JSON.parse(jsonString);
      const errors: string[] = [];
      let imported = 0;

      // Importer les catégories
      if (importData.categories && Array.isArray(importData.categories)) {
        for (const category of importData.categories) {
          try {
            await this.createCategory({
              ...category,
              createdBy: userId
            });
          } catch (error) {
            errors.push(`Catégorie "${category.name}": ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          }
        }
      }

      // Importer les bookmarks
      if (importData.bookmarks && Array.isArray(importData.bookmarks)) {
        for (const bookmark of importData.bookmarks) {
          try {
            await this.createBookmark({
              ...bookmark,
              createdBy: userId
            });
            imported++;
          } catch (error) {
            errors.push(`Bookmark "${bookmark.title}": ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          }
        }
      }

      // Importer les collections
      if (importData.collections && Array.isArray(importData.collections)) {
        for (const collection of importData.collections) {
          try {
            await this.createCollection({
              ...collection,
              createdBy: userId
            });
          } catch (error) {
            errors.push(`Collection "${collection.name}": ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          }
        }
      }

      console.log(`✅ Import terminé: ${imported} bookmarks importés`);
      return { imported, errors };

    } catch (error) {
      console.error('❌ Erreur import bookmarks:', error);
      throw new Error(`Échec de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Obtient les informations d'une cible
   */
  private async getTargetInfo(targetId: string, targetType: string): Promise<{
    title: string;
    description?: string;
    tags?: string[];
    metadata?: BookmarkMetadata;
  }> {
    try {
      switch (targetType) {
        case 'document':
          const { data: doc } = await supabase
            .from('documents')
            .select('title, extracted_text, tags')
            .eq('id', targetId)
            .single();
          
          return {
            title: doc?.title || 'Document sans titre',
            description: doc?.extracted_text?.substring(0, 200) + '...',
            tags: doc?.tags || [],
            metadata: {
              excerpt: doc?.extracted_text?.substring(0, 500),
              wordCount: doc?.extracted_text?.split(' ').length
            }
          };

        case 'note':
          const { data: note } = await supabase
            .from('personal_notes')
            .select('title, plain_content, tags')
            .eq('id', targetId)
            .single();
          
          return {
            title: note?.title || 'Note sans titre',
            description: note?.plain_content?.substring(0, 200) + '...',
            tags: note?.tags || [],
            metadata: {
              excerpt: note?.plain_content?.substring(0, 500),
              wordCount: note?.plain_content?.split(' ').length
            }
          };

        case 'conversation':
          const { data: conv } = await supabase
            .from('ai_conversations')
            .select('title')
            .eq('id', targetId)
            .single();
          
          return {
            title: conv?.title || 'Conversation sans titre',
            description: 'Conversation avec IA'
          };

        default:
          return {
            title: 'Élément sans titre',
            description: 'Description non disponible'
          };
      }

    } catch (error) {
      console.error('❌ Erreur récupération infos cible:', error);
      return {
        title: 'Élément sans titre',
        description: 'Description non disponible'
      };
    }
  }

  /**
   * Mappe un bookmark depuis la base de données
   */
  private mapBookmarkFromDB(data: any): Bookmark {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      url: data.url,
      type: data.type,
      targetId: data.target_id,
      targetType: data.target_type,
      tags: data.tags || [],
      category: data.category,
      isPublic: data.is_public,
      isPinned: data.is_pinned,
      priority: data.priority,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      lastAccessed: data.last_accessed,
      accessCount: data.access_count || 0
    };
  }

  /**
   * Mappe une catégorie depuis la base de données
   */
  private mapCategoryFromDB(data: any): BookmarkCategory {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      parentId: data.parent_id,
      isPublic: data.is_public,
      sortOrder: data.sort_order,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      bookmarkCount: data.bookmark_count
    };
  }

  /**
   * Mappe une collection depuis la base de données
   */
  private mapCollectionFromDB(data: any): BookmarkCollection {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      bookmarkIds: data.bookmark_ids || [],
      isPublic: data.is_public,
      isDefault: data.is_default,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      bookmarkCount: data.bookmark_count
    };
  }
}

// Instance singleton
export const bookmarksService = new BookmarksService();

// Export des fonctions utilitaires
export const createBookmark = (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>) => 
  bookmarksService.createBookmark(bookmark);

export const getBookmarks = (options: BookmarkOptions) => 
  bookmarksService.getBookmarks(options);

export const updateBookmark = (id: string, updates: Partial<Bookmark>) => 
  bookmarksService.updateBookmark(id, updates);

export const deleteBookmark = (id: string) => 
  bookmarksService.deleteBookmark(id);

export const toggleBookmark = (targetId: string, targetType: string, userId: string) => 
  bookmarksService.toggleBookmark(targetId, targetType, userId);

export const getBookmarkStats = (userId: string) => 
  bookmarksService.getBookmarkStats(userId);

export const searchBookmarks = (query: string, userId: string, options?: Partial<BookmarkOptions>) => 
  bookmarksService.searchBookmarks(query, userId, options);

// NOUVELLES FONCTIONNALITÉS AVANCÉES

/**
 * Options de recherche et filtrage avancées pour les bookmarks
 */
export interface AdvancedBookmarkOptions {
  userId: string;
  query?: string;
  tags?: string[];
  category?: string;
  type?: BookmarkType;
  targetType?: string;
  priority?: 'low' | 'medium' | 'high';
  isPinned?: boolean;
  isPublic?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  sortBy?: 'createdAt' | 'updatedAt' | 'lastAccessed' | 'accessCount' | 'title' | 'priority';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  includeMetadata?: boolean;
  includeSuggestions?: boolean;
}

/**
 * Résultat de recherche de bookmarks avec suggestions
 */
export interface BookmarkSearchResult {
  bookmarks: Bookmark[];
  totalCount: number;
  suggestions: string[];
  categories: Array<{ name: string; count: number }>;
  tags: Array<{ name: string; count: number }>;
  statistics: {
    totalBookmarks: number;
    pinnedBookmarks: number;
    recentBookmarks: number;
    mostAccessed: Bookmark | null;
    averageAccessCount: number;
  };
}

/**
 * Bookmark intelligent avec IA et recommandations
 */
export interface IntelligentBookmark extends Bookmark {
  relevanceScore?: number;
  suggestedTags?: string[];
  suggestedCategory?: string;
  relatedBookmarks?: string[];
  accessPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
    bestTimeOfDay?: string;
    lastAccessPattern?: string;
  };
  aiSummary?: string;
  quickActions?: string[];
}

/**
 * Recherche avancée de bookmarks avec IA
 */
export async function advancedBookmarkSearch(options: AdvancedBookmarkOptions): Promise<BookmarkSearchResult> {
  try {
    // Récupérer tous les bookmarks de l'utilisateur
    const baseBookmarks = await getBookmarks({ 
      userId: options.userId, 
      includeMetadata: true 
    });
    
    let filteredBookmarks = [...baseBookmarks];
    
    // Filtrage par texte
    if (options.query) {
      const searchTerms = options.query.toLowerCase().split(' ');
      filteredBookmarks = filteredBookmarks.filter(bookmark => {
        const searchableText = [
          bookmark.title,
          bookmark.description,
          bookmark.tags.join(' '),
          bookmark.category,
          bookmark.metadata.excerpt || ''
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchableText.includes(term));
      });
    }
    
    // Filtrage par tags
    if (options.tags && options.tags.length > 0) {
      filteredBookmarks = filteredBookmarks.filter(bookmark => 
        options.tags!.some(tag => bookmark.tags.includes(tag))
      );
    }
    
    // Filtrage par catégorie
    if (options.category) {
      filteredBookmarks = filteredBookmarks.filter(bookmark => 
        bookmark.category === options.category
      );
    }
    
    // Filtrage par type
    if (options.type) {
      filteredBookmarks = filteredBookmarks.filter(bookmark => 
        bookmark.type === options.type
      );
    }
    
    // Filtrage par targetType
    if (options.targetType) {
      filteredBookmarks = filteredBookmarks.filter(bookmark => 
        bookmark.targetType === options.targetType
      );
    }
    
    // Filtrage par priorité
    if (options.priority) {
      filteredBookmarks = filteredBookmarks.filter(bookmark => 
        bookmark.priority === options.priority
      );
    }
    
    // Filtrage par épinglé
    if (options.isPinned !== undefined) {
      filteredBookmarks = filteredBookmarks.filter(bookmark => 
        bookmark.isPinned === options.isPinned
      );
    }
    
    // Filtrage par public
    if (options.isPublic !== undefined) {
      filteredBookmarks = filteredBookmarks.filter(bookmark => 
        bookmark.isPublic === options.isPublic
      );
    }
    
    // Filtrage par plage de dates
    if (options.dateRange) {
      filteredBookmarks = filteredBookmarks.filter(bookmark => {
        const bookmarkDate = new Date(bookmark.createdAt);
        return bookmarkDate >= options.dateRange!.from && bookmarkDate <= options.dateRange!.to;
      });
    }
    
    // Tri
    if (options.sortBy) {
      filteredBookmarks.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (options.sortBy) {
          case 'createdAt':
          case 'updatedAt':
          case 'lastAccessed':
            aValue = new Date(a[options.sortBy]);
            bValue = new Date(b[options.sortBy]);
            break;
          case 'accessCount':
            aValue = a.accessCount;
            bValue = b.accessCount;
            break;
          case 'priority':
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            aValue = priorityOrder[a.priority];
            bValue = priorityOrder[b.priority];
            break;
          default:
            aValue = a[options.sortBy];
            bValue = b[options.sortBy];
        }
        
        if (options.sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }
    
    // Pagination
    const totalCount = filteredBookmarks.length;
    const startIndex = options.offset || 0;
    const endIndex = startIndex + (options.limit || filteredBookmarks.length);
    const paginatedBookmarks = filteredBookmarks.slice(startIndex, endIndex);
    
    // Générer des suggestions
    const suggestions = generateBookmarkSuggestions(paginatedBookmarks, options.query);
    
    // Générer les statistiques
    const statistics = generateBookmarkStatistics(baseBookmarks);
    
    // Extraire les catégories et tags uniques
    const categories = extractCategories(baseBookmarks);
    const tags = extractTags(baseBookmarks);
    
    return {
      bookmarks: paginatedBookmarks,
      totalCount,
      suggestions,
      categories,
      tags,
      statistics
    };
    
  } catch (error) {
    console.error('❌ Erreur recherche avancée bookmarks:', error);
    throw new Error('Erreur lors de la recherche avancée des bookmarks');
  }
}

/**
 * Génère des suggestions basées sur les bookmarks existants
 */
function generateBookmarkSuggestions(bookmarks: Bookmark[], query?: string): string[] {
  const suggestions: string[] = [];
  
  if (query) {
    // Suggestions basées sur la requête
    const queryLower = query.toLowerCase();
    
    // Suggérer des tags similaires
    const allTags = bookmarks.flatMap(b => b.tags);
    const similarTags = allTags.filter(tag => 
      tag.toLowerCase().includes(queryLower) || queryLower.includes(tag.toLowerCase())
    );
    suggestions.push(...similarTags.slice(0, 3));
    
    // Suggérer des catégories similaires
    const categories = bookmarks
      .map(b => b.category)
      .filter(Boolean) as string[];
    const similarCategories = categories.filter(cat => 
      cat.toLowerCase().includes(queryLower) || queryLower.includes(cat.toLowerCase())
    );
    suggestions.push(...similarCategories.slice(0, 2));
  } else {
    // Suggestions générales basées sur l'usage
    const mostUsedTags = getMostUsedTags(bookmarks, 5);
    suggestions.push(...mostUsedTags);
    
    const mostUsedCategories = getMostUsedCategories(bookmarks, 3);
    suggestions.push(...mostUsedCategories);
  }
  
  return [...new Set(suggestions)].slice(0, 8); // Éliminer les doublons et limiter à 8
}

/**
 * Génère les statistiques des bookmarks
 */
function generateBookmarkStatistics(bookmarks: Bookmark[]) {
  const totalBookmarks = bookmarks.length;
  const pinnedBookmarks = bookmarks.filter(b => b.isPinned).length;
  const recentBookmarks = bookmarks.filter(b => {
    const daysSinceCreation = (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 7;
  }).length;
  
  const mostAccessed = bookmarks.reduce((prev, current) => 
    current.accessCount > (prev?.accessCount || 0) ? current : prev, null as Bookmark | null
  );
  
  const averageAccessCount = totalBookmarks > 0 
    ? bookmarks.reduce((sum, b) => sum + b.accessCount, 0) / totalBookmarks 
    : 0;
  
  return {
    totalBookmarks,
    pinnedBookmarks,
    recentBookmarks,
    mostAccessed,
    averageAccessCount
  };
}

/**
 * Extrait les catégories uniques avec leur nombre d'occurrences
 */
function extractCategories(bookmarks: Bookmark[]): Array<{ name: string; count: number }> {
  const categoryCount: Record<string, number> = {};
  
  bookmarks.forEach(bookmark => {
    if (bookmark.category) {
      categoryCount[bookmark.category] = (categoryCount[bookmark.category] || 0) + 1;
    }
  });
  
  return Object.entries(categoryCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Extrait les tags uniques avec leur nombre d'occurrences
 */
function extractTags(bookmarks: Bookmark[]): Array<{ name: string; count: number }> {
  const tagCount: Record<string, number> = {};
  
  bookmarks.forEach(bookmark => {
    bookmark.tags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });
  
  return Object.entries(tagCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Récupère les tags les plus utilisés
 */
function getMostUsedTags(bookmarks: Bookmark[], limit: number): string[] {
  const tagCount: Record<string, number> = {};
  
  bookmarks.forEach(bookmark => {
    bookmark.tags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });
  
  return Object.entries(tagCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([tag]) => tag);
}

/**
 * Récupère les catégories les plus utilisées
 */
function getMostUsedCategories(bookmarks: Bookmark[], limit: number): string[] {
  const categoryCount: Record<string, number> = {};
  
  bookmarks.forEach(bookmark => {
    if (bookmark.category) {
      categoryCount[bookmark.category] = (categoryCount[bookmark.category] || 0) + 1;
    }
  });
  
  return Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([category]) => category);
}

/**
 * Crée un bookmark intelligent avec suggestions IA
 */
export async function createIntelligentBookmark(
  bookmarkData: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>,
  userId: string
): Promise<IntelligentBookmark> {
  try {
    // Créer le bookmark de base
    const bookmark = await createBookmark({
      ...bookmarkData,
      accessCount: 0
    });
    
    // Enrichir avec des fonctionnalités intelligentes
    const intelligentBookmark: IntelligentBookmark = {
      ...bookmark,
      relevanceScore: calculateBookmarkRelevance(bookmark),
      suggestedTags: generateSuggestedTags(bookmark),
      suggestedCategory: generateSuggestedCategory(bookmark),
      relatedBookmarks: findRelatedBookmarks(bookmark, userId),
      accessPattern: analyzeAccessPattern(bookmark),
      aiSummary: await generateAISummary(bookmark),
      quickActions: generateQuickActions(bookmark)
    };
    
    return intelligentBookmark;
  } catch (error) {
    console.error('❌ Erreur création bookmark intelligent:', error);
    throw new Error('Erreur lors de la création du bookmark intelligent');
  }
}

/**
 * Calcule le score de pertinence d'un bookmark
 */
function calculateBookmarkRelevance(bookmark: Bookmark): number {
  let score = 0;
  
  // Score basé sur l'accès récent
  if (bookmark.lastAccessed) {
    const daysSinceAccess = (Date.now() - new Date(bookmark.lastAccessed).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 1 - daysSinceAccess / 30) * 0.3; // Décroît sur 30 jours
  }
  
  // Score basé sur la fréquence d'accès
  score += Math.min(bookmark.accessCount / 10, 1) * 0.25;
  
  // Score basé sur les tags (plus de tags = plus pertinent)
  score += Math.min(bookmark.tags.length / 5, 1) * 0.15;
  
  // Score basé sur la priorité
  const priorityScore = { high: 1, medium: 0.6, low: 0.3 };
  score += priorityScore[bookmark.priority] * 0.15;
  
  // Score basé sur l'épinglage
  if (bookmark.isPinned) score += 0.1;
  
  // Score basé sur la description (plus de détails = plus pertinent)
  if (bookmark.description && bookmark.description.length > 20) {
    score += 0.05;
  }
  
  return Math.min(score, 1);
}

/**
 * Génère des tags suggérés basés sur le contenu
 */
function generateSuggestedTags(bookmark: Bookmark): string[] {
  const suggestions: string[] = [];
  const content = [
    bookmark.title,
    bookmark.description,
    bookmark.metadata.excerpt || ''
  ].join(' ').toLowerCase();
  
  // Tags basés sur le type
  const typeTags: Record<BookmarkType, string[]> = {
    document: ['document', 'fichier', 'ressource'],
    note: ['note', 'mémo', 'idée', 'pense'],
    conversation: ['chat', 'discussion', 'ia', 'conversation'],
    flashcard: ['carte', 'révision', 'étude', 'mémoire'],
    quiz: ['quiz', 'test', 'examen', 'évaluation'],
    folder: ['dossier', 'collection', 'groupe'],
    website: ['site', 'web', 'lien', 'url'],
    article: ['article', 'lecture', 'info', 'actualité'],
    video: ['vidéo', 'multimédia', 'visual'],
    tool: ['outil', 'utilitaire', 'service'],
    resource: ['ressource', 'aide', 'guide']
  };
  
  if (typeTags[bookmark.type]) {
    suggestions.push(...typeTags[bookmark.type]);
  }
  
  // Tags basés sur les mots-clés dans le contenu
  const keywords = ['important', 'urgent', 'à suivre', 'référence', 'favori', 'projet', 'travail', 'personnel'];
  keywords.forEach(keyword => {
    if (content.includes(keyword)) {
      suggestions.push(keyword);
    }
  });
  
  return [...new Set(suggestions)].slice(0, 5);
}

/**
 * Génère une catégorie suggérée
 */
function generateSuggestedCategory(bookmark: Bookmark): string {
  const content = bookmark.title.toLowerCase();
  
  // Catégories basées sur les mots-clés
  const categoryKeywords: Record<string, string[]> = {
    'Travail': ['projet', 'travail', 'professionnel', 'bureau', 'meeting'],
    'Personnel': ['personnel', 'privé', 'maison', 'famille', 'vie'],
    'Études': ['étude', 'cours', 'formation', 'apprentissage', 'éducation'],
    'Loisirs': ['loisir', 'hobby', 'divertissement', 'jeu', 'passion'],
    'Technologie': ['tech', 'programmation', 'développement', 'code', 'software'],
    'Santé': ['santé', 'médical', 'bien-être', 'sport', 'exercice'],
    'Finance': ['argent', 'budget', 'finance', 'investissement', 'épargne'],
    'Voyage': ['voyage', 'destination', 'hôtel', 'avion', 'vacances'],
    'Recettes': ['recette', 'cuisine', 'nourriture', 'restaurant', 'plat'],
    'Actualités': ['actualité', 'news', 'info', 'journal', 'média']
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      return category;
    }
  }
  
  return 'Général';
}

/**
 * Trouve des bookmarks similaires
 */
async function findRelatedBookmarks(bookmark: Bookmark, userId: string): Promise<string[]> {
  try {
    const userBookmarks = await getBookmarks({ userId });
    
    const relatedBookmarks = userBookmarks
      .filter(b => b.id !== bookmark.id)
      .filter(b => {
        // Mêmes tags
        const commonTags = b.tags.filter(tag => bookmark.tags.includes(tag));
        if (commonTags.length >= 2) return true;
        
        // Même type
        if (b.type === bookmark.type && b.targetType === bookmark.targetType) return true;
        
        // Même catégorie
        if (b.category === bookmark.category) return true;
        
        // Titre similaire
        const titleSimilarity = calculateStringSimilarity(b.title, bookmark.title);
        if (titleSimilarity > 0.7) return true;
        
        return false;
      })
      .slice(0, 5)
      .map(b => b.id);
    
    return relatedBookmarks;
  } catch (error) {
    console.error('❌ Erreur recherche bookmarks similaires:', error);
    return [];
  }
}

/**
 * Calcule la similarité entre deux chaînes
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Distance de Levenshtein simplifiée
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Analyse le pattern d'accès d'un bookmark
 */
function analyzeAccessPattern(bookmark: Bookmark): IntelligentBookmark['accessPattern'] {
  const pattern: IntelligentBookmark['accessPattern'] = {
    frequency: 'rarely',
    bestTimeOfDay: undefined,
    lastAccessPattern: undefined
  };
  
  // Analyser la fréquence d'accès
  if (bookmark.lastAccessed) {
    const daysSinceCreation = (Date.now() - new Date(bookmark.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const daysSinceLastAccess = (Date.now() - new Date(bookmark.lastAccessed).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation > 0) {
      const averageDaysBetweenAccess = daysSinceCreation / bookmark.accessCount;
      
      if (averageDaysBetweenAccess < 1) pattern.frequency = 'daily';
      else if (averageDaysBetweenAccess < 7) pattern.frequency = 'weekly';
      else if (averageDaysBetweenAccess < 30) pattern.frequency = 'monthly';
      else pattern.frequency = 'rarely';
    }
    
    // Heure d'accès optimale (basée sur le dernier accès)
    const lastAccessHour = new Date(bookmark.lastAccessed).getHours();
    if (lastAccessHour >= 9 && lastAccessHour <= 11) pattern.bestTimeOfDay = 'morning';
    else if (lastAccessHour >= 14 && lastAccessHour <= 16) pattern.bestTimeOfDay = 'afternoon';
    else if (lastAccessHour >= 19 && lastAccessHour <= 21) pattern.bestTimeOfDay = 'evening';
  }
  
  return pattern;
}

/**
 * Génère un résumé IA (placeholder pour l'intégration avec une vraie IA)
 */
async function generateAISummary(bookmark: Bookmark): Promise<string> {
  // Placeholder pour l'intégration avec ChatGPT ou Claude
  // Dans une vraie implémentation, on enverrait le contenu à l'IA
  
  const summary = `Bookmark: ${bookmark.title}`;
  
  if (bookmark.description) {
    return `${summary}\n${bookmark.description}`;
  }
  
  if (bookmark.metadata.excerpt) {
    const excerpt = bookmark.metadata.excerpt.substring(0, 200);
    return `${summary}\n${excerpt}${bookmark.metadata.excerpt.length > 200 ? '...' : ''}`;
  }
  
  return summary;
}

/**
 * Génère des actions rapides pour un bookmark
 */
function generateQuickActions(bookmark: Bookmark): string[] {
  const actions: string[] = [];
  
  // Actions basées sur le type
  switch (bookmark.type) {
    case 'document':
      actions.push('Ouvrir le document', 'Télécharger', 'Partager');
      break;
    case 'website':
      actions.push('Visiter le site', 'Ajouter aux favoris du navigateur');
      break;
    case 'video':
      actions.push('Lire la vidéo', 'Ajouter à regarder plus tard');
      break;
    case 'article':
      actions.push('Lire l\'article', 'Enregistrer pour plus tard');
      break;
    default:
      actions.push('Ouvrir', 'Partager', 'Modifier');
  }
  
  // Actions basées sur les métadonnées
  if (bookmark.url) {
    actions.push('Copier le lien');
  }
  
  if (bookmark.tags.includes('important')) {
    actions.push('Ajouter rappel');
  }
  
  return actions.slice(0, 4);
}

/**
 * Exporte les bookmarks en multiple formats
 */
export function exportBookmarks(
  bookmarks: Bookmark[],
  format: 'json' | 'csv' | 'html' | 'md',
  includeMetadata: boolean = true
): string {
  switch (format) {
    case 'json':
      return JSON.stringify({
        bookmarks,
        exportedAt: new Date().toISOString(),
        totalCount: bookmarks.length,
        includeMetadata
      }, null, 2);
    
    case 'csv':
      return exportBookmarksToCSV(bookmarks, includeMetadata);
    
    case 'html':
      return exportBookmarksToHTML(bookmarks, includeMetadata);
    
    case 'md':
      return exportBookmarksToMarkdown(bookmarks, includeMetadata);
    
    default:
      return JSON.stringify(bookmarks, null, 2);
  }
}

/**
 * Export CSV des bookmarks
 */
function exportBookmarksToCSV(bookmarks: Bookmark[], includeMetadata: boolean): string {
  const headers = [
    'Titre',
    'Description',
    'URL',
    'Type',
    'Type Cible',
    'Tags',
    'Catégorie',
    'Priorité',
    'Épinglé',
    'Public',
    'Créé le',
    'Dernier accès',
    'Nombre d\'accès'
  ];
  
  if (includeMetadata) {
    headers.push('Extrait', 'Nombre de mots');
  }
  
  const csvContent = [
    headers.join(','),
    ...bookmarks.map(bookmark => [
      `"${bookmark.title}"`,
      `"${bookmark.description || ''}"`,
      `"${bookmark.url || ''}"`,
      bookmark.type,
      bookmark.targetType,
      `"${bookmark.tags.join(';')}"`,
      `"${bookmark.category || ''}"`,
      bookmark.priority,
      bookmark.isPinned ? 'Oui' : 'Non',
      bookmark.isPublic ? 'Oui' : 'Non',
      bookmark.createdAt,
      bookmark.lastAccessed || '',
      bookmark.accessCount,
      ...(includeMetadata ? [
        `"${(bookmark.metadata.excerpt || '').substring(0, 100).replace(/"/g, '""')}"`,
        bookmark.metadata.wordCount || ''
      ] : [])
    ].join(','))
  ].join('\n');
  
  return csvContent;
}

/**
 * Export HTML des bookmarks
 */
function exportBookmarksToHTML(bookmarks: Bookmark[], includeMetadata: boolean): string {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Export Bookmarks</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .bookmark { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
    .title { font-weight: bold; color: #333; }
    .description { color: #666; margin: 5px 0; }
    .metadata { font-size: 0.9em; color: #888; }
    .tags { margin: 10px 0; }
    .tag { background: #e1e1e1; padding: 2px 6px; border-radius: 3px; margin-right: 5px; font-size: 0.8em; }
  </style>
</head>
<body>
  <h1>Mes Bookmarks (${bookmarks.length})</h1>
  <p>Exporté le ${new Date().toLocaleString('fr-FR')}</p>
  ${bookmarks.map(bookmark => `
    <div class="bookmark">
      <div class="title">${bookmark.title}</div>
      ${bookmark.description ? `<div class="description">${bookmark.description}</div>` : ''}
      ${bookmark.url ? `<div class="metadata"><a href="${bookmark.url}" target="_blank">${bookmark.url}</a></div>` : ''}
      <div class="metadata">
        Type: ${bookmark.type} | Catégorie: ${bookmark.category || 'Non définie'} | Priorité: ${bookmark.priority}
        ${bookmark.isPinned ? ' | 📌 Épinglé' : ''}
      </div>
      ${bookmark.tags.length > 0 ? `
        <div class="tags">
          ${bookmark.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      ` : ''}
      ${includeMetadata && bookmark.metadata.excerpt ? `
        <div class="metadata">
          <strong>Extrait:</strong> ${bookmark.metadata.excerpt.substring(0, 200)}${bookmark.metadata.excerpt.length > 200 ? '...' : ''}
        </div>
      ` : ''}
    </div>
  `).join('')}
</body>
</html>`;
  
  return html;
}

/**
 * Export Markdown des bookmarks
 */
function exportBookmarksToMarkdown(bookmarks: Bookmark[], includeMetadata: boolean): string {
  let markdown = `# Mes Bookmarks (${bookmarks.length})\n\n`;
  markdown += `Exporté le ${new Date().toLocaleString('fr-FR')}\n\n`;
  
  bookmarks.forEach((bookmark, index) => {
    markdown += `## ${index + 1}. ${bookmark.title}\n\n`;
    
    if (bookmark.description) {
      markdown += `**Description:** ${bookmark.description}\n\n`;
    }
    
    if (bookmark.url) {
      markdown += `**Lien:** [${bookmark.url}](${bookmark.url})\n\n`;
    }
    
    markdown += `**Type:** ${bookmark.type}\n`;
    markdown += `**Catégorie:** ${bookmark.category || 'Non définie'}\n`;
    markdown += `**Priorité:** ${bookmark.priority}\n`;
    markdown += `**Accès:** ${bookmark.accessCount}\n`;
    
    if (bookmark.tags.length > 0) {
      markdown += `**Tags:** ${bookmark.tags.join(', ')}\n`;
    }
    
    if (bookmark.isPinned) {
      markdown += `📌 Épinglé\n`;
    }
    
    if (includeMetadata && bookmark.metadata.excerpt) {
      markdown += `\n**Extrait:**\n> ${bookmark.metadata.excerpt.substring(0, 200)}${bookmark.metadata.excerpt.length > 200 ? '...' : ''}\n`;
    }
    
    markdown += '\n---\n\n';
  });
  
  return markdown;
}

export const getBookmarkSuggestions = (userId: string, limit?: number) => 
  bookmarksService.getBookmarkSuggestions(userId, limit);
