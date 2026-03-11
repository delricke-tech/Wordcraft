/**
 * Service de gestion des notes personnelles (rich text editor)
 * 
 * Ce service permet de créer, gérer et organiser des notes personnelles
 * avec un éditeur de texte riche, formatage et organisation avancée
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface PersonalNote {
  id: string;
  title: string;
  content: string; // Rich text content (HTML)
  plain_content: string; // Plain text version for search
  workspace_id?: string;
  folder_id?: string;
  tags: string[];
  is_public: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  is_pinned: boolean;
  color: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  word_count: number;
  reading_time: number;
  metadata: NoteMetadata;
}

export interface NoteMetadata {
  last_edited_at: string;
  editor_version: string;
  word_count: number;
  character_count: number;
  paragraph_count: number;
  links_count: number;
  images_count: number;
  attachments_count: number;
  version: number;
  collaboration_enabled: boolean;
}

export interface NoteFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  workspace_id?: string;
  parent_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  notes_count?: number;
  subfolders_count?: number;
}

export interface NoteAttachment {
  id: string;
  note_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_url: string;
  thumbnail_url?: string;
  created_at: string;
  created_by: string;
}

export interface NoteVersion {
  id: string;
  note_id: string;
  content: string;
  version_number: number;
  change_summary?: string;
  created_at: string;
  created_by: string;
}

export interface NoteShare {
  id: string;
  note_id: string;
  shared_by: string;
  shared_with: string;
  permission: 'read' | 'write' | 'admin';
  expires_at?: string;
  created_at: string;
  access_count: number;
}

class NotesService {
  /**
   * Crée une nouvelle note
   */
  async createNote(
    title: string,
    content: string,
    userId: string,
    options: {
      workspaceId?: string;
      folderId?: string;
      tags?: string[];
      color?: string;
      isPublic?: boolean;
    } = {}
  ): Promise<PersonalNote> {
    try {
      const plainContent = this.htmlToPlainText(content);
      const wordCount = this.countWords(plainContent);
      const readingTime = Math.ceil(wordCount / 200); // ~200 mots/min

      const metadata: NoteMetadata = {
        last_edited_at: new Date().toISOString(),
        editor_version: '1.0',
        word_count: wordCount,
        character_count: plainContent.length,
        paragraph_count: this.countParagraphs(plainContent),
        links_count: this.countLinks(content),
        images_count: this.countImages(content),
        attachments_count: 0,
        version: 1,
        collaboration_enabled: false
      };

      const { data, error } = await supabase
        .from('personal_notes')
        .insert({
          title,
          content,
          plain_content: plainContent,
          workspace_id: options.workspaceId,
          folder_id: options.folderId,
          tags: options.tags || [],
          is_public: options.isPublic || false,
          is_favorite: false,
          is_archived: false,
          is_pinned: false,
          color: options.color || '#ffffff',
          created_by: userId,
          word_count: wordCount,
          reading_time: readingTime,
          metadata
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer la note');

      console.log('✅ Note créée:', data.title);
      return data;

    } catch (error) {
      console.error('❌ Erreur création note:', error);
      throw new Error(`Échec de la création de la note: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère toutes les notes d'un utilisateur
   */
  async getUserNotes(
    userId: string,
    options: {
      workspaceId?: string;
      folderId?: string;
      tags?: string[];
      includeArchived?: boolean;
      includeFavorites?: boolean;
      search?: string;
      sortBy?: 'created_at' | 'updated_at' | 'title' | 'word_count';
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<PersonalNote[]> {
    try {
      let query = supabase
        .from('personal_notes')
        .select('*')
        .eq('created_by', userId);

      // Filtrer par workspace
      if (options.workspaceId) {
        query = query.eq('workspace_id', options.workspaceId);
      }

      // Filtrer par dossier
      if (options.folderId) {
        query = query.eq('folder_id', options.folderId);
      }

      // Filtrer par tags
      if (options.tags && options.tags.length > 0) {
        query = query.contains('tags', options.tags);
      }

      // Filtrer par archived
      if (!options.includeArchived) {
        query = query.eq('is_archived', false);
      }

      // Filtrer par favorites
      if (options.includeFavorites) {
        query = query.eq('is_favorite', true);
      }

      // Recherche textuelle
      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,plain_content.ilike.%${options.search}%`);
      }

      // Tri
      const sortBy = options.sortBy || 'updated_at';
      const sortOrder = options.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      // Note: offset n'est pas disponible dans cette version de supabase-js

      const { data, error } = await query;

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('❌ Erreur récupération notes:', error);
      throw new Error(`Échec de la récupération des notes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère une note spécifique
   */
  async getNote(noteId: string): Promise<PersonalNote | null> {
    try {
      const { data, error } = await supabase
        .from('personal_notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('❌ Erreur récupération note:', error);
      return null;
    }
  }

  /**
   * Met à jour une note
   */
  async updateNote(
    noteId: string,
    updates: Partial<PersonalNote>
  ): Promise<PersonalNote> {
    try {
      // Si le contenu est mis à jour, mettre à jour les métadonnées
      if (updates.content) {
        const plainContent = this.htmlToPlainText(updates.content);
        const wordCount = this.countWords(plainContent);
        const readingTime = Math.ceil(wordCount / 200);

        updates.plain_content = plainContent;
        updates.word_count = wordCount;
        updates.reading_time = readingTime;
        updates.metadata = {
          ...(updates.metadata || {}),
          last_edited_at: new Date().toISOString(),
          word_count: wordCount,
          character_count: plainContent.length,
          paragraph_count: this.countParagraphs(plainContent),
          links_count: this.countLinks(updates.content),
          images_count: this.countImages(updates.content),
          version: ((updates.metadata as NoteMetadata)?.version || 0) + 1,
          editor_version: '1.0',
          attachments_count: (updates.metadata as NoteMetadata)?.attachments_count || 0,
          collaboration_enabled: (updates.metadata as NoteMetadata)?.collaboration_enabled || false
        };

        // Créer une version sauvegardée
        await this.createNoteVersion(noteId, updates.content, 'Mise à jour manuelle');
      }

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('personal_notes')
        .update(updates)
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Note non trouvée');

      console.log('✅ Note mise à jour:', data.title);
      return data;

    } catch (error) {
      console.error('❌ Erreur mise à jour note:', error);
      throw new Error(`Échec de la mise à jour de la note: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Supprime une note
   */
  async deleteNote(noteId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('personal_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      console.log('✅ Note supprimée');

    } catch (error) {
      console.error('❌ Erreur suppression note:', error);
      throw new Error(`Échec de la suppression de la note: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Crée un dossier de notes
   */
  async createFolder(
    name: string,
    userId: string,
    options: {
      workspaceId?: string;
      parentId?: string;
      description?: string;
      color?: string;
    } = {}
  ): Promise<NoteFolder> {
    try {
      const { data, error } = await supabase
        .from('note_folders')
        .insert({
          name,
          description: options.description,
          color: options.color || '#e5e7eb',
          workspace_id: options.workspaceId,
          parent_id: options.parentId,
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer le dossier');

      console.log('✅ Dossier créé:', data.name);
      return data;

    } catch (error) {
      console.error('❌ Erreur création dossier:', error);
      throw new Error(`Échec de la création du dossier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les dossiers d'un utilisateur
   */
  async getUserFolders(
    userId: string,
    options: {
      workspaceId?: string;
      parentId?: string;
    } = {}
  ): Promise<NoteFolder[]> {
    try {
      let query = supabase
        .from('note_folders')
        .select('*')
        .eq('created_by', userId);

      if (options.workspaceId) {
        query = query.eq('workspace_id', options.workspaceId);
      }

      if (options.parentId) {
        query = query.eq('parent_id', options.parentId);
      } else {
        query = query.is('parent_id', null);
      }

      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('❌ Erreur récupération dossiers:', error);
      throw new Error(`Échec de la récupération des dossiers: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Recherche des notes
   */
  async searchNotes(
    userId: string,
    query: string,
    options: {
      workspaceId?: string;
      folderId?: string;
      tags?: string[];
      limit?: number;
    } = {}
  ): Promise<PersonalNote[]> {
    return this.getUserNotes(userId, {
      ...options,
      search: query
    });
  }

  /**
   * Bascule le statut favori d'une note
   */
  async toggleFavorite(noteId: string): Promise<boolean> {
    try {
      const note = await this.getNote(noteId);
      if (!note) throw new Error('Note non trouvée');

      const { data, error } = await supabase
        .from('personal_notes')
        .update({ is_favorite: !note.is_favorite })
        .eq('id', noteId)
        .select('is_favorite')
        .single();

      if (error) throw error;
      return data?.is_favorite || false;

    } catch (error) {
      console.error('❌ Erreur basculement favori:', error);
      throw new Error(`Échec du basculement favori: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Archive/désarchive une note
   */
  async toggleArchive(noteId: string): Promise<boolean> {
    try {
      const note = await this.getNote(noteId);
      if (!note) throw new Error('Note non trouvée');

      const { data, error } = await supabase
        .from('personal_notes')
        .update({ is_archived: !note.is_archived })
        .eq('id', noteId)
        .select('is_archived')
        .single();

      if (error) throw error;
      return data?.is_archived || false;

    } catch (error) {
      console.error('❌ Erreur archivage note:', error);
      throw new Error(`Échec de l'archivage de la note: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Épingle/désépingle une note
   */
  async togglePin(noteId: string): Promise<boolean> {
    try {
      const note = await this.getNote(noteId);
      if (!note) throw new Error('Note non trouvée');

      const { data, error } = await supabase
        .from('personal_notes')
        .update({ is_pinned: !note.is_pinned })
        .eq('id', noteId)
        .select('is_pinned')
        .single();

      if (error) throw error;
      return data?.is_pinned || false;

    } catch (error) {
      console.error('❌ Erreur épinglage note:', error);
      throw new Error(`Échec de l'épinglage de la note: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Crée une version sauvegardée d'une note
   */
  async createNoteVersion(
    noteId: string,
    content: string,
    changeSummary?: string
  ): Promise<NoteVersion> {
    try {
      // Obtenir la dernière version
      const { data: lastVersion } = await supabase
        .from('note_versions')
        .select('version_number')
        .eq('note_id', noteId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (lastVersion?.version_number || 0) + 1;

      const { data, error } = await supabase
        .from('note_versions')
        .insert({
          note_id: noteId,
          content,
          version_number: nextVersion,
          change_summary: changeSummary,
          created_by: 'current_user' // À remplacer par l'utilisateur réel
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer la version');

      console.log('✅ Version sauvegardée:', data.version_number);
      return data;

    } catch (error) {
      console.error('❌ Erreur création version:', error);
      throw new Error(`Échec de la création de la version: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les versions d'une note
   */
  async getNoteVersions(noteId: string): Promise<NoteVersion[]> {
    try {
      const { data, error } = await supabase
        .from('note_versions')
        .select('*')
        .eq('note_id', noteId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('❌ Erreur récupération versions:', error);
      throw new Error(`Échec de la récupération des versions: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Partage une note
   */
  async shareNote(
    noteId: string,
    _sharedWith: string,
    permission: 'read' | 'write' | 'admin',
    expiresAt?: string
  ): Promise<NoteShare> {
    try {
      const { data, error } = await supabase
        .from('note_shares')
        .insert({
          note_id: noteId,
          shared_by: 'current_user', // À remplacer par l'utilisateur réel
          shared_with: _sharedWith,
          permission,
          expires_at: expiresAt,
          access_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de partager la note');

      console.log('✅ Note partagée');
      return data;

    } catch (error) {
      console.error('❌ Erreur partage note:', error);
      throw new Error(`Échec du partage de la note: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les notes partagées avec l'utilisateur
   */
  async getSharedNotes(userId: string): Promise<PersonalNote[]> {
    try {
      const { data, error } = await supabase
        .from('note_shares')
        .select(`
          personal_notes!inner(*),
          permission,
          expires_at
        `)
        .eq('shared_with', userId)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (error) throw error;
      return data?.map((share: any) => share.personal_notes) || [];

    } catch (error) {
      console.error('❌ Erreur récupération notes partagées:', error);
      throw new Error(`Échec de la récupération des notes partagées: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Convertit HTML en texte brut
   */
  private htmlToPlainText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * Compte les mots dans un texte
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Compte les paragraphes dans un texte
   */
  private countParagraphs(text: string): number {
    return text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
  }

  /**
   * Compte les liens dans du HTML
   */
  private countLinks(html: string): number {
    const linkRegex = /<a[^>]*>/gi;
    return (html.match(linkRegex) || []).length;
  }

  /**
   * Compte les images dans du HTML
   */
  private countImages(html: string): number {
    const imgRegex = /<img[^>]*>/gi;
    return (html.match(imgRegex) || []).length;
  }

  /**
   * Exporte des notes au format Markdown
   */
  async exportNotesToMarkdown(
    noteIds: string[],
    options: {
      includeMetadata?: boolean;
      includeVersions?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const notes = await Promise.all(
        noteIds.map(id => this.getNote(id))
      );

      const validNotes = notes.filter((note): note is PersonalNote => note !== null);

      let markdown = '# Notes Exportées\n\n';

      if (options.includeMetadata) {
        markdown += `**Date d'export:** ${new Date().toLocaleDateString()}\n`;
        markdown += `**Nombre de notes:** ${validNotes.length}\n\n`;
      }

      validNotes.forEach((note, index) => {
        markdown += `## ${index + 1}. ${note.title}\n\n`;
        
        if (options.includeMetadata) {
          markdown += `**Créée le:** ${new Date(note.created_at).toLocaleDateString()}\n`;
          markdown += `**Mise à jour:** ${new Date(note.updated_at).toLocaleDateString()}\n`;
          markdown += `**Mots:** ${note.word_count}\n`;
          markdown += `**Temps de lecture:** ${note.reading_time} min\n`;
          if (note.tags.length > 0) {
            markdown += `**Tags:** ${note.tags.join(', ')}\n`;
          }
          markdown += '\n';
        }

        markdown += `${this.htmlToPlainText(note.content)}\n\n`;

        if (options.includeVersions) {
          const versions = await this.getNoteVersions(note.id);
          if (versions.length > 1) {
            markdown += `### Versions (${versions.length})\n\n`;
            for (const version of versions) {
              markdown += `- Version ${version.version_number}: ${version.change_summary || 'Sans description'} (${new Date(version.created_at).toLocaleDateString()})\n`;
            }
            markdown += '\n';
          }
        }

        markdown += '---\n\n';
      });

      return markdown;

    } catch (error) {
      console.error('❌ Erreur export Markdown:', error);
      throw new Error(`Échec de l'export Markdown: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Obtient les statistiques des notes d'un utilisateur
   */
  async getNotesStats(userId: string): Promise<{
    totalNotes: number;
    totalWords: number;
    totalReadingTime: number;
    favoritesCount: number;
    archivedCount: number;
    tagsCount: number;
    foldersCount: number;
  }> {
    try {
      const [notes, folders] = await Promise.all([
        this.getUserNotes(userId),
        this.getUserFolders(userId)
      ]);

      const totalNotes = notes.length;
      const totalWords = notes.reduce((sum, note) => sum + note.word_count, 0);
      const totalReadingTime = notes.reduce((sum, note) => sum + note.reading_time, 0);
      const favoritesCount = notes.filter(note => note.is_favorite).length;
      const archivedCount = notes.filter(note => note.is_archived).length;
      
      const allTags = new Set<string>();
      notes.forEach(note => note.tags.forEach(tag => allTags.add(tag)));
      const tagsCount = allTags.size;

      return {
        totalNotes,
        totalWords,
        totalReadingTime,
        favoritesCount,
        archivedCount,
        tagsCount,
        foldersCount: folders.length
      };

    } catch (error) {
      console.error('❌ Erreur statistiques notes:', error);
      throw new Error(`Échec du calcul des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

// Instance singleton
export const notesService = new NotesService();

// Export des fonctions utilitaires
export const createNote = (
  title: string,
  content: string,
  userId: string,
  options?: {
    workspaceId?: string;
    folderId?: string;
    tags?: string[];
    color?: string;
    isPublic?: boolean;
  }
) => notesService.createNote(title, content, userId, options);

export const getUserNotes = (
  userId: string,
  options?: {
    workspaceId?: string;
    folderId?: string;
    tags?: string[];
    includeArchived?: boolean;
    includeFavorites?: boolean;
    search?: string;
    sortBy?: 'created_at' | 'updated_at' | 'title' | 'word_count';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }
) => notesService.getUserNotes(userId, options);

export const getNote = (noteId: string) => notesService.getNote(noteId);

export const updateNote = (
  noteId: string,
  updates: Partial<PersonalNote>
) => notesService.updateNote(noteId, updates);

export const deleteNote = (noteId: string) => notesService.deleteNote(noteId);

export const toggleFavorite = (noteId: string) => notesService.toggleFavorite(noteId);

export const searchNotes = (
  userId: string,
  query: string,
  options?: {
    workspaceId?: string;
    folderId?: string;
    tags?: string[];
    limit?: number;
  }
) => notesService.searchNotes(userId, query, options);

export const getNotesStats = (userId: string) => notesService.getNotesStats(userId);

export const exportNotesToMarkdown = (
  noteIds: string[],
  options?: {
    includeMetadata?: boolean;
    includeVersions?: boolean;
  }
) => notesService.exportNotesToMarkdown(noteIds, options);
