import { useState, useEffect } from 'react';
import { 
  Share2, 
  Link, 
  Copy,
  Check,
  X,
  Lock,
  Eye,
  MessageSquare,
  Trash2,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { externalSharingService, ShareLink } from '../services/externalSharingService';
import { documentCommentsService, DocumentComment } from '../services/documentCommentsService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface DocumentSharingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle?: string;
}

export function DocumentSharingPanel({
  isOpen,
  onClose,
  documentId,
  documentTitle
}: DocumentSharingPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'share' | 'comments'>('share');
  
  // Share state
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Comments state
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadShareLinks();
      loadComments();
    }
  }, [isOpen, user, documentId]);

  const loadShareLinks = async () => {
    try {
      const links = await externalSharingService.getShareLinks(user!.id, {
        targetType: 'document'
      });
      setShareLinks(links.filter(l => l.targetId === documentId));
    } catch (error) {
      console.error('Erreur chargement liens:', error);
    }
  };

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const comments = await documentCommentsService.getDocumentComments(
        documentId,
        'document'
      );
      setComments(comments);
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCreateShareLink = async () => {
    if (!user) return;
    
    setIsCreatingLink(true);
    try {
      const link = await externalSharingService.createShareLink(
        documentId,
        'document',
        {
          title: `Partage: ${documentTitle || 'Document'}`,
          permissions: {
            canView: true,
            canDownload: false,
            canComment: true,
            canShare: false,
            canEdit: false,
            canPrint: false
          },
          settings: {
            allowDownload: false,
            allowComment: true,
            allowShare: false,
            showMetadata: true,
            watermark: true,
            theme: 'auto',
            language: 'fr'
          }
        },
        user.id
      );

      setShareLinks([link, ...shareLinks]);
      toast.success('Lien de partage créé !');
    } catch (error) {
      toast.error('Erreur lors de la création du lien');
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(null), 2000);
    toast.success('Lien copié !');
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await externalSharingService.deleteShareLink(linkId);
      setShareLinks(shareLinks.filter(l => l.id !== linkId));
      toast.success('Lien supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      await documentCommentsService.addComment(
        newComment,
        user.id,
        user.email || 'Utilisateur',
        undefined,
        {
          targetId: documentId,
          targetType: 'document'
        }
      );

      setNewComment('');
      loadComments();
      toast.success('Commentaire ajouté');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Share2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Partage & Collaboration</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                {documentTitle || 'Document'}
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
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'share'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Link className="w-4 h-4" />
            Liens de partage
            {shareLinks.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {shareLinks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'comments'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Commentaires
            {comments.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {comments.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'share' ? (
            <div className="space-y-6">
              {/* Create Link Button */}
              <button
                onClick={handleCreateShareLink}
                disabled={isCreatingLink}
                className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isCreatingLink ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                ) : (
                  <>
                    <Link className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900 dark:text-white">Créer un lien de partage</span>
                  </>
                )}
              </button>

              {/* Share Links List */}
              {shareLinks.length > 0 ? (
                <div className="space-y-3">
                  {shareLinks.map((link) => (
                    <div
                      key={link.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {link.title}
                            </h4>
                            {link.password && (
                              <Lock className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          
                          {/* URL */}
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="text"
                              value={`${window.location.origin}/share/${link.token}`}
                              readOnly
                              className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400"
                            />
                            <button
                              onClick={() => handleCopyLink(link.token)}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                              title="Copier le lien"
                            >
                              {copiedLink === link.token ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                            <a
                              href={`/share/${link.token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                              title="Ouvrir le lien"
                            >
                              <ExternalLink className="w-4 h-4 text-gray-500" />
                            </a>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {link.currentViews} vues
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(link.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-4">
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Link className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun lien de partage actif
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Créez un lien pour partager ce document
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add Comment */}
              <div className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Commenter
                  </button>
                </div>
              </div>

              {/* Comments List */}
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-blue-600">
                            {comment.authorName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {comment.authorName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun commentaire
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Soyez le premier à commenter ce document
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
