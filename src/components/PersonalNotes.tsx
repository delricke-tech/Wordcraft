/**
 * Composant de gestion des notes personnelles (rich text editor)
 * 
 * Ce composant permet de créer, éditer et organiser des notes personnelles
 * avec un éditeur de texte riche, formatage et gestion avancée
 * 
 * Date: 11 mars 2026
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  createNote,
  getUserNotes,
  getNote,
  updateNote,
  deleteNote,
  toggleFavorite,
  toggleArchive,
  togglePin,
  searchNotes,
  getNotesStats,
  exportNotesToMarkdown,
  type PersonalNote,
  type NoteFolder
} from '../services/notesService';
import type { User } from '../contexts/AuthContext';

interface PersonalNotesProps {
  user: User;
  workspaceId?: string;
  className?: string;
}

interface NoteEditor {
  id: string | null;
  title: string;
  content: string;
  tags: string[];
  color: string;
  isPublic: boolean;
  isDirty: boolean;
  isSaving: boolean;
}

interface CreateNoteModal {
  isOpen: boolean;
  title: string;
  content: string;
  tags: string[];
  color: string;
  isPublic: boolean;
}

const PersonalNotes: React.FC<PersonalNotesProps> = ({
  user,
  workspaceId,
  className = ''
}) => {
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<PersonalNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'archived' | 'pinned'>('all');
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'title' | 'word_count'>('updated_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [stats, setStats] = useState<any>(null);

  // Éditeur de note
  const [editor, setEditor] = useState<NoteEditor>({
    id: null,
    title: '',
    content: '',
    tags: [],
    color: '#ffffff',
    isPublic: false,
    isDirty: false,
    isSaving: false
  });

  // Modals
  const [createModal, setCreateModal] = useState<CreateNoteModal>({
    isOpen: false,
    title: '',
    content: '',
    tags: [],
    color: '#ffffff',
    isPublic: false
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Charger les notes au montage
  useEffect(() => {
    loadNotes();
    loadStats();
  }, [user.id, workspaceId]);

  // Auto-save de l'éditeur
  useEffect(() => {
    if (editor.isDirty && editor.id) {
      const timer = setTimeout(() => {
        saveCurrentNote();
      }, 2000); // Auto-save après 2 secondes

      return () => clearTimeout(timer);
    }
  }, [editor.isDirty, editor.content, editor.title, editor.tags]);

  const loadNotes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const options: any = {
        workspaceId,
        sortBy,
        sortOrder: 'desc'
      };

      switch (activeFilter) {
        case 'favorites':
          options.includeFavorites = true;
          break;
        case 'archived':
          options.includeArchived = true;
          break;
        case 'pinned':
          // Filtrer localement pour les notes épinglées
          break;
      }

      const userNotes = await getUserNotes(user.id, options);
      
      let filteredNotes = userNotes;
      if (activeFilter === 'pinned') {
        filteredNotes = userNotes.filter(note => note.is_pinned);
      }
      if (activeFilter === 'archived') {
        filteredNotes = userNotes.filter(note => note.is_archived);
      }
      if (activeFilter === 'favorites') {
        filteredNotes = userNotes.filter(note => note.is_favorite);
      }

      setNotes(filteredNotes);
      
      if (filteredNotes.length > 0 && !selectedNote) {
        setSelectedNote(filteredNotes[0]);
        loadNoteInEditor(filteredNotes[0]);
      }
    } catch (err) {
      setError('Impossible de charger les notes');
      console.error('Erreur chargement notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const userStats = await getNotesStats(user.id, workspaceId);
      setStats(userStats);
    } catch (err) {
      console.error('Erreur chargement statistiques:', err);
    }
  };

  const loadNoteInEditor = (note: PersonalNote) => {
    setEditor({
      id: note.id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      color: note.color,
      isPublic: note.is_public,
      isDirty: false,
      isSaving: false
    });
  };

  const createNewNote = async () => {
    if (!createModal.title.trim()) {
      setError('Le titre est requis');
      return;
    }

    try {
      const newNote = await createNote(
        createModal.title,
        createModal.content || '<p>Commencez à écrire...</p>',
        user.id,
        {
          workspaceId,
          tags: createModal.tags,
          color: createModal.color,
          isPublic: createModal.isPublic
        }
      );

      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      loadNoteInEditor(newNote);
      setCreateModal({ isOpen: false, title: '', content: '', tags: [], color: '#ffffff', isPublic: false });
      
      console.log('✅ Note créée:', newNote.title);
    } catch (err) {
      setError('Impossible de créer la note');
      console.error('Erreur création note:', err);
    }
  };

  const saveCurrentNote = async () => {
    if (!editor.id || !editor.isDirty) return;

    setEditor(prev => ({ ...prev, isSaving: true }));

    try {
      const updatedNote = await updateNote(editor.id, {
        title: editor.title,
        content: editor.content,
        tags: editor.tags,
        color: editor.color,
        is_public: editor.isPublic
      });

      setNotes(prev => prev.map(note => 
        note.id === editor.id ? updatedNote : note
      ));
      setSelectedNote(updatedNote);
      setEditor(prev => ({ ...prev, isDirty: false, isSaving: false }));
      
      console.log('✅ Note sauvegardée');
    } catch (err) {
      setError('Impossible de sauvegarder la note');
      console.error('Erreur sauvegarde note:', err);
      setEditor(prev => ({ ...prev, isSaving: false }));
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
      
      if (selectedNote?.id === noteId) {
        const remaining = notes.filter(note => note.id !== noteId);
        setSelectedNote(remaining.length > 0 ? remaining[0] : null);
        if (remaining.length > 0) {
          loadNoteInEditor(remaining[0]);
        } else {
          setEditor({
            id: null,
            title: '',
            content: '',
            tags: [],
            color: '#ffffff',
            isPublic: false,
            isDirty: false,
            isSaving: false
          });
        }
      }
      
      setShowDeleteConfirm(null);
      console.log('✅ Note supprimée');
    } catch (err) {
      setError('Impossible de supprimer la note');
      console.error('Erreur suppression note:', err);
    }
  };

  const handleToggleFavorite = async (noteId: string) => {
    try {
      const isFavorite = await toggleFavorite(noteId);
      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, is_favorite: isFavorite } : note
      ));
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(prev => prev ? { ...prev, is_favorite: isFavorite } : null);
      }
    } catch (err) {
      setError('Impossible de modifier le favori');
      console.error('Erreur favori:', err);
    }
  };

  const handleToggleArchive = async (noteId: string) => {
    try {
      const isArchived = await toggleArchive(noteId);
      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, is_archived: isArchived } : note
      ));
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(prev => prev ? { ...prev, is_archived: isArchived } : null);
      }
    } catch (err) {
      setError('Impossible d\'archiver la note');
      console.error('Erreur archivage:', err);
    }
  };

  const handleTogglePin = async (noteId: string) => {
    try {
      const isPinned = await togglePin(noteId);
      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, is_pinned: isPinned } : note
      ));
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(prev => prev ? { ...prev, is_pinned: isPinned } : null);
      }
    } catch (err) {
      setError('Impossible d\'épingler la note');
      console.error('Erreur épinglage:', err);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      try {
        const searchResults = await searchNotes(user.id, query, { workspaceId });
        setNotes(searchResults);
      } catch (err) {
        console.error('Erreur recherche:', err);
      }
    } else {
      loadNotes();
    }
  };

  const handleExportSelected = async () => {
    try {
      const selectedNotes = notes.filter(note => 
        // Note: Dans une vraie implémentation, ajouter une sélection multiple
        note.id === selectedNote?.id
      );
      
      if (selectedNotes.length === 0) {
        setError('Aucune note sélectionnée');
        return;
      }

      const markdown = await exportNotesToMarkdown(
        selectedNotes.map(note => note.id),
        { includeMetadata: true }
      );

      // Télécharger le fichier
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `notes_export_${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Notes exportées');
    } catch (err) {
      setError('Impossible d\'exporter les notes');
      console.error('Erreur export:', err);
    }
  };

  // Render de la liste des notes
  const renderNotesList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (notes.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📝</div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">
            {searchQuery ? 'Aucun résultat' : 'Aucune note'}
          </h4>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'Essayez une autre recherche' : 'Créez votre première note'}
          </p>
          <button
            onClick={() => setCreateModal({ ...createModal, isOpen: true })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Créer une note
          </button>
        </div>
      );
    }

    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                selectedNote?.id === note.id ? 'border-blue-500 shadow-md' : 'border-gray-200'
              }`}
              style={{ borderLeftColor: note.color, borderLeftWidth: '4px' }}
              onClick={() => {
                setSelectedNote(note);
                loadNoteInEditor(note);
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-800 truncate flex-1">
                  {note.title}
                </h4>
                <div className="flex items-center gap-1">
                  {note.is_pinned && <span className="text-yellow-500">📌</span>}
                  {note.is_favorite && <span className="text-red-500">❤️</span>}
                  {note.is_archived && <span className="text-gray-500">📦</span>}
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-3 line-clamp-3">
                {note.plain_content.substring(0, 150)}
                {note.plain_content.length > 150 && '...'}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  {note.tags.length > 0 && (
                    <span className="flex items-center gap-1">
                      <span>🏷️</span>
                      {note.tags[0]}
                      {note.tags.length > 1 && `+${note.tags.length - 1}`}
                    </span>
                  )}
                  <span>{note.word_count} mots</span>
                </div>
                <span>{new Date(note.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                selectedNote?.id === note.id ? 'border-blue-500 shadow-md' : 'border-gray-200'
              }`}
              style={{ borderLeftColor: note.color, borderLeftWidth: '4px' }}
              onClick={() => {
                setSelectedNote(note);
                loadNoteInEditor(note);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800">{note.title}</h4>
                    <div className="flex items-center gap-1">
                      {note.is_pinned && <span className="text-yellow-500">📌</span>}
                      {note.is_favorite && <span className="text-red-500">❤️</span>}
                      {note.is_archived && <span className="text-gray-500">📦</span>}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {note.plain_content.substring(0, 100)}
                    {note.plain_content.length > 100 && '...'}
                  </p>
                </div>
                <div className="text-xs text-gray-500 ml-4">
                  {new Date(note.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className={`personal-notes ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>📝</span>
            Notes Personnelles
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSelected}
              className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              📤 Exporter
            </button>
            <button
              onClick={() => setCreateModal({ ...createModal, isOpen: true })}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              Nouvelle note
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-700">{stats.total_notes}</div>
              <div className="text-xs text-blue-600">Total notes</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-700">{stats.total_words}</div>
              <div className="text-xs text-green-600">Mots totaux</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-700">{stats.favorites_count}</div>
              <div className="text-xs text-purple-600">Favoris</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-700">{stats.pinned_count || 0}</div>
              <div className="text-xs text-yellow-600">Épinglées</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-700">{stats.archived_count}</div>
              <div className="text-xs text-gray-600">Archivées</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-indigo-700">{stats.unique_tags}</div>
              <div className="text-xs text-indigo-600">Tags uniques</div>
            </div>
          </div>
        )}

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher dans les notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">Toutes</option>
              <option value="favorites">Favoris</option>
              <option value="pinned">Épinglées</option>
              <option value="archived">Archivées</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="updated_at">Dernière modification</option>
              <option value="created_at">Date de création</option>
              <option value="title">Titre</option>
              <option value="word_count">Nombre de mots</option>
            </select>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {viewMode === 'grid' ? '📋' : '🗂️'}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
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

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes list */}
        <div className="lg:col-span-1">
          {renderNotesList()}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {selectedNote ? (
            <div className="bg-white border border-gray-200 rounded-lg">
              {/* Editor header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <input
                    type="text"
                    value={editor.title}
                    onChange={(e) => setEditor({ ...editor, title: e.target.value, isDirty: true })}
                    className="text-xl font-semibold bg-transparent border-none focus:outline-none flex-1"
                    placeholder="Titre de la note"
                  />
                  <div className="flex items-center gap-2">
                    {editor.isSaving && (
                      <div className="text-sm text-gray-500">Sauvegarde...</div>
                    )}
                    {editor.isDirty && !editor.isSaving && (
                      <div className="text-sm text-blue-500">Modifié</div>
                    )}
                  </div>
                </div>
                
                {/* Toolbar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleFavorite(selectedNote.id)}
                      className={`p-2 rounded ${selectedNote.is_favorite ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      ❤️
                    </button>
                    <button
                      onClick={() => handleTogglePin(selectedNote.id)}
                      className={`p-2 rounded ${selectedNote.is_pinned ? 'text-yellow-500 bg-yellow-50' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      📌
                    </button>
                    <button
                      onClick={() => handleToggleArchive(selectedNote.id)}
                      className={`p-2 rounded ${selectedNote.is_archived ? 'text-gray-500 bg-gray-100' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      📦
                    </button>
                    
                    {/* Color picker */}
                    <input
                      type="color"
                      value={editor.color}
                      onChange={(e) => setEditor({ ...editor, color: e.target.value, isDirty: true })}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(selectedNote.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              {/* Content editor */}
              <div className="p-4">
                <div
                  ref={contentRef}
                  contentEditable
                  onInput={(e) => setEditor({ ...editor, content: e.currentTarget.innerHTML, isDirty: true })}
                  className="min-h-[400px] focus:outline-none prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: editor.content }}
                />
              </div>

              {/* Tags */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {editor.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {tag}
                        <button
                          onClick={() => {
                            const newTags = editor.tags.filter((_, i) => i !== index);
                            setEditor({ ...editor, tags: newTags, isDirty: true });
                          }}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Ajouter un tag..."
                      className="px-2 py-1 text-sm border border-gray-300 rounded"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const newTags = [...editor.tags, e.currentTarget.value.trim()];
                          setEditor({ ...editor, tags: newTags, isDirty: true });
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Sélectionnez une note</h3>
              <p className="text-gray-600">Choisissez une note dans la liste pour l'éditer</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de création */}
      {createModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-800">Créer une nouvelle note</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={createModal.title}
                  onChange={(e) => setCreateModal({ ...createModal, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Titre de la note"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                <textarea
                  value={createModal.content}
                  onChange={(e) => setCreateModal({ ...createModal, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Commencez à écrire..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={createModal.tags.join(', ')}
                  onChange={(e) => setCreateModal({ 
                    ...createModal, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                  <input
                    type="color"
                    value={createModal.color}
                    onChange={(e) => setCreateModal({ ...createModal, color: e.target.value })}
                    className="w-12 h-8 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createModal.isPublic}
                    onChange={(e) => setCreateModal({ ...createModal, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Note publique</label>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => setCreateModal({ isOpen: false, title: '', content: '', tags: [], color: '#ffffff', isPublic: false })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={createNewNote}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-800">Supprimer la note</h3>
            </div>
            <div className="p-4">
              <p className="text-gray-600 mb-4">
                Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.
              </p>
            </div>
            <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteNote(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalNotes;
