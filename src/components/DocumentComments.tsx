/**
 * Composant de commentaires documents avec threads imbriqués
 * 
 * Ce composant permet d'ajouter des commentaires aux documents avec
 * support des réponses, mentions, et threads de discussion
 * 
 * Date: 12 mars 2026
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Reply, 
  Send, 
  X, 
  Trash2, 
  Edit3, 
  AtSign,
  Smile,
  Paperclip,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Pin,
  Flag,
  Check,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { 
  createComment,
  getComments,
  updateComment,
  deleteComment,
  togglePinComment,
  reportComment,
  getCommentReplies,
  createReply,
  updateReply,
  deleteReply,
  searchMentions,
  type Comment,
  type CommentReply,
  type CommentThread,
  type CommentOptions,
  type ReplyOptions
} from '../services/documentCommentsService';

interface DocumentCommentsProps {
  documentId: string;
  documentTitle: string;
  className?: string;
  compact?: boolean;
  showReplies?: boolean;
  allowMentions?: boolean;
  maxDepth?: number;
}

interface CommentState {
  text: string;
  isEditing: boolean;
  isReplying: boolean;
  showReplies: boolean;
  mentions: string[];
}

const DocumentComments: React.FC<DocumentCommentsProps> = ({
  documentId,
  documentTitle,
  className = '',
  compact = false,
  showReplies = true,
  allowMentions = true,
  maxDepth = 3
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentStates, setCommentStates] = useState<Map<string, CommentState>>(new Map());
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{id: string, name: string, email: string}>>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionCursor, setMentionCursor] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'pinned' | 'mentions'>('all');

  // Charger les commentaires
  useEffect(() => {
    if (documentId) {
      loadComments();
    }
  }, [documentId, sortBy, filterBy]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const options: CommentOptions = {
        sortBy,
        filterBy,
        includeReplies: showReplies,
        maxDepth
      };
      
      const threads = await getComments(documentId, options);
      setComments(threads);
      
      // Initialiser les états des commentaires
      const states = new Map<string, CommentState>();
      threads.forEach(thread => {
        states.set(thread.comment.id, {
          text: '',
          isEditing: false,
          isReplying: false,
          showReplies: true,
          mentions: []
        });
      });
      setCommentStates(states);
      
    } catch (error) {
      console.error('❌ Erreur chargement commentaires:', error);
      toast.error('Erreur lors du chargement des commentaires');
    } finally {
      setLoading(false);
    }
  };

  // Gérer la saisie de commentaire
  const handleCommentChange = useCallback((text: string) => {
    setNewComment(text);
    
    // Détecter les mentions
    if (allowMentions && text.includes('@')) {
      const cursorPos = text.length;
      const lastAtPos = text.lastIndexOf('@');
      
      if (lastAtPos !== -1 && cursorPos - lastAtPos <= 20) {
        const mentionText = text.substring(lastAtPos + 1);
        if (mentionText.length > 0) {
          searchMentions(mentionText).then(setMentionSuggestions);
          setShowMentionSuggestions(true);
        } else {
          setMentionSuggestions([]);
          setShowMentionSuggestions(false);
        }
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  }, [allowMentions]);

  // Ajouter une mention
  const addMention = useCallback((mention: {id: string, name: string, email: string}) => {
    const text = newComment;
    const lastAtPos = text.lastIndexOf('@');
    const beforeMention = text.substring(0, lastAtPos);
    const afterMention = text.substring(lastAtPos);
    
    setNewComment(`${beforeMention}@${mention.name} `);
    setShowMentionSuggestions(false);
    setMentionSuggestions([]);
  }, [newComment]);

  // Poster un commentaire
  const handlePostComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      const comment = await createComment({
        documentId,
        userId: user.id,
        content: newComment.trim(),
        mentions: allowMentions ? extractMentions(newComment) : []
      });

      // Ajouter le commentaire à la liste
      setComments(prev => [{
        comment,
        replies: [],
        replyCount: 0,
        isPinned: false
      }, ...prev]);

      setNewComment('');
      toast.success('Commentaire publié');
      
    } catch (error) {
      console.error('❌ Erreur publication commentaire:', error);
      toast.error('Erreur lors de la publication du commentaire');
    }
  };

  // Extraire les mentions du texte
  const extractMentions = (text: string): string[] => {
    const mentions = text.match(/@(\w+)/g);
    return mentions ? mentions.map(m => m.substring(1)) : [];
  };

  // Répondre à un commentaire
  const handleReply = async (commentId: string, replyText: string) => {
    if (!replyText.trim() || !user) return;

    try {
      const reply = await createReply({
        commentId,
        userId: user.id,
        content: replyText.trim(),
        mentions: allowMentions ? extractMentions(replyText) : []
      });

      // Mettre à jour le thread
      setComments(prev => prev.map(thread => {
        if (thread.comment.id === commentId) {
          return {
            ...thread,
            replies: [...thread.replies, reply],
            replyCount: thread.replyCount + 1
          };
        }
        return thread;
      }));

      // Réinitialiser l'état de réponse
      const state = commentStates.get(commentId);
      if (state) {
        setCommentStates(prev => new Map(prev).set(commentId, {
          ...state,
          text: '',
          isReplying: false
        }));
      }

      toast.success('Réponse publiée');
      
    } catch (error) {
      console.error('❌ Erreur réponse:', error);
      toast.error('Erreur lors de la publication de la réponse');
    }
  };

  // Modifier un commentaire
  const handleEditComment = async (commentId: string, newText: string) => {
    if (!newText.trim()) return;

    try {
      await updateComment(commentId, {
        content: newText.trim(),
        mentions: allowMentions ? extractMentions(newText) : []
      });

      // Mettre à jour le commentaire
      setComments(prev => prev.map(thread => {
        if (thread.comment.id === commentId) {
          return {
            ...thread,
            comment: {
              ...thread.comment,
              content: newText.trim(),
              editedAt: new Date().toISOString(),
              edited: true
            }
          };
        }
        return thread;
      }));

      // Réinitialiser l'état d'édition
      const state = commentStates.get(commentId);
      if (state) {
        setCommentStates(prev => new Map(prev).set(commentId, {
          ...state,
          isEditing: false
        }));
      }

      toast.success('Commentaire modifié');
      
    } catch (error) {
      console.error('❌ Erreur modification:', error);
      toast.error('Erreur lors de la modification du commentaire');
    }
  };

  // Supprimer un commentaire
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;

    try {
      await deleteComment(commentId);

      // Retirer le commentaire
      setComments(prev => prev.filter(thread => thread.comment.id !== commentId));
      
      toast.success('Commentaire supprimé');
      
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Erreur lors de la suppression du commentaire');
    }
  };

  // Épingler/dépingler un commentaire
  const handleTogglePin = async (commentId: string) => {
    try {
      await togglePinComment(commentId);

      // Mettre à jour l'état d'épingle
      setComments(prev => prev.map(thread => {
        if (thread.comment.id === commentId) {
          return {
            ...thread,
            isPinned: !thread.isPinned
          };
        }
        return thread;
      }));

      toast.success(thread => thread.isPinned ? 'Commentaire épinglé' : 'Commentaire désépinglé');
      
    } catch (error) {
      console.error('❌ Erreur épingle:', error);
      toast.error('Erreur lors de la modification de l\'épingle');
    }
  };

  // Mettre à jour l'état d'un commentaire
  const updateCommentState = (commentId: string, updates: Partial<CommentState>) => {
    setCommentStates(prev => {
      const current = prev.get(commentId) || {
        text: '',
        isEditing: false,
        isReplying: false,
        showReplies: true,
        mentions: []
      };
      return new Map(prev).set(commentId, { ...current, ...updates });
    });
  };

  // Rendu d'un commentaire
  const renderComment = (thread: CommentThread, depth: number = 0) => {
    const state = commentStates.get(thread.comment.id) || {
      text: '',
      isEditing: false,
      isReplying: false,
      showReplies: true,
      mentions: []
    };

    const isOwner = user?.id === thread.comment.userId;
    const canEdit = isOwner;
    const canDelete = isOwner || user?.role === 'admin';

    return (
      <motion.div
        key={thread.comment.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border-l-2 ${thread.isPinned ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'} 
                   ${depth > 0 ? 'ml-8 mt-2' : 'mb-4'} rounded-r-lg p-4`}
      >
        {/* En-tête du commentaire */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900 flex items-center gap-2">
                {thread.comment.userName}
                {thread.isPinned && <Pin className="w-3 h-3 text-yellow-600" />}
                {thread.comment.edited && <span className="text-xs text-gray-500">(modifié)</span>}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(thread.comment.createdAt).toLocaleDateString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {thread.isPinned && (
              <button
                onClick={() => handleTogglePin(thread.comment.id)}
                className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
                title="Désépingler"
              >
                <Pin className="w-4 h-4" />
              </button>
            )}
            
            <div className="relative">
              <button className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {/* Menu déroulant des actions */}
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                {!thread.isPinned && (
                  <button
                    onClick={() => handleTogglePin(thread.comment.id)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Pin className="w-4 h-4" />
                    Épingler
                  </button>
                )}
                
                {canEdit && (
                  <button
                    onClick={() => updateCommentState(thread.comment.id, { isEditing: true })}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Modifier
                  </button>
                )}
                
                {canDelete && (
                  <button
                    onClick={() => handleDeleteComment(thread.comment.id)}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                )}
                
                <button
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  Signaler
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu du commentaire */}
        <div className="mb-3">
          {state.isEditing ? (
            <div className="space-y-2">
              <textarea
                value={state.text || thread.comment.content}
                onChange={(e) => updateCommentState(thread.comment.id, { text: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Modifiez votre commentaire..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditComment(thread.comment.id, state.text || thread.comment.content)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateCommentState(thread.comment.id, { isEditing: false, text: '' })}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-gray-700 whitespace-pre-wrap">
              {thread.comment.content}
            </div>
          )}
        </div>

        {/* Actions de réponse */}
        {showReplies && depth < maxDepth && (
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => updateCommentState(thread.comment.id, { isReplying: !state.isReplying })}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Reply className="w-4 h-4" />
              Répondre
            </button>
            
            {thread.replyCount > 0 && (
              <button
                onClick={() => updateCommentState(thread.comment.id, { showReplies: !state.showReplies })}
                className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
              >
                {state.showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {thread.replyCount} réponse{thread.replyCount > 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}

        {/* Formulaire de réponse */}
        {state.isReplying && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <textarea
              value={state.text}
              onChange={(e) => updateCommentState(thread.comment.id, { text: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Écrivez votre réponse..."
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleReply(thread.comment.id, state.text)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
              >
                <Send className="w-4 h-4" />
                Répondre
              </button>
              <button
                onClick={() => updateCommentState(thread.comment.id, { isReplying: false, text: '' })}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Réponses */}
        {showReplies && state.showReplies && thread.replies.length > 0 && (
          <div className="mt-4 space-y-2">
            {thread.replies.map(reply => (
              <div key={reply.id} className="ml-8 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {reply.userName}
                      {reply.edited && <span className="text-xs text-gray-500 ml-1">(modifié)</span>}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(reply.createdAt).toLocaleDateString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {reply.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`document-comments ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Commentaires ({comments.length})
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="newest">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="popular">Populaires</option>
          </select>
          
          {/* Filtre */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">Tous</option>
            <option value="pinned">Épinglés</option>
            <option value="mentions">Mentions</option>
          </select>
        </div>
      </div>

      {/* Nouveau commentaire */}
      <div className="mb-6">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => handleCommentChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Ajoutez un commentaire..."
          />
          
          {/* Suggestions de mentions */}
          {showMentionSuggestions && mentionSuggestions.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              {mentionSuggestions.map((mention, index) => (
                <button
                  key={mention.id}
                  onClick={() => addMention(mention)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                    index === mentionCursor ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{mention.name}</div>
                    <div className="text-xs text-gray-500">{mention.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600" title="Ajouter un emoji">
              <Smile className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600" title="Joindre un fichier">
              <Paperclip className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handlePostComment}
            disabled={!newComment.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Publier
          </button>
        </div>
      </div>

      {/* Liste des commentaires */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Chargement des commentaires...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-800 mb-2">Aucun commentaire</h4>
            <p className="text-gray-600">Soyez le premier à commenter ce document</p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map(thread => renderComment(thread))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default DocumentComments;
