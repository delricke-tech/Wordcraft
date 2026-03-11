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

export const getBookmarkSuggestions = (userId: string, limit?: number) => 
  bookmarksService.getBookmarkSuggestions(userId, limit);
