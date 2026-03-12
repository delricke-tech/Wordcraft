import { useState, useEffect } from 'react';
import { 
  Users, 
  X,
  Check,
  Loader2,
  Wifi,
  WifiOff,
  User,
  MessageSquare,
  Share2
} from 'lucide-react';
import { realtimeCollaborationService } from '../services/realtimeCollaborationService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface RealtimeCollaborationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
}

export function RealtimeCollaborationPanel({ isOpen, onClose, documentId }: RealtimeCollaborationPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isOnline: boolean;
    isEditing: boolean;
    lastSeen: string;
  }>>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isOpen && user && documentId) {
      loadCollaborators();
    }
  }, [isOpen, user, documentId]);

  const loadCollaborators = async () => {
    try {
      const session = await realtimeCollaborationService.getDocumentSession(documentId!);
      if (session) {
        setIsEnabled(true);
        setCollaborators(session.collaborators);
        setIsConnected(session.isActive);
      }
    } catch (error) {
      console.error('Erreur chargement collaborateurs:', error);
    }
  };

  const handleEnableCollaboration = async () => {
    if (!documentId || !user) return;
    
    setLoading(true);
    try {
      await realtimeCollaborationService.createDocumentSession(documentId, user.id);
      setIsEnabled(true);
      toast.success('Collaboration temps réel activée !');
      loadCollaborators();
    } catch (error) {
      toast.error('Erreur lors de l\'activation');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!documentId || !user) return;
    
    setLoading(true);
    try {
      await realtimeCollaborationService.joinDocumentSession(documentId, user.id);
      toast.success('Vous avez rejoint la session');
      loadCollaborators();
    } catch (error) {
      toast.error('Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
              {isConnected ? (
                <Wifi className="w-6 h-6 text-green-600" />
              ) : (
                <WifiOff className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Collaboration temps réel</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isConnected ? 'Connecté' : 'Hors ligne'}
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {!isEnabled ? (
            <div className="text-center py-8">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Activer la collaboration
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Permettez à plusieurs utilisateurs de travailler simultanément sur ce document avec des mises à jour en temps réel.
              </p>
              <button
                onClick={handleEnableCollaboration}
                disabled={loading || !documentId}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
                Activer la collaboration
              </button>
            </div>
          ) : (
            <>
              {/* Collaborators List */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Collaborateurs ({collaborators.length})
                </h3>
                {collaborators.length > 0 ? (
                  <div className="space-y-3">
                    {collaborators.map((collab) => (
                      <div
                        key={collab.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                              {collab.avatar ? (
                                <img src={collab.avatar} alt={collab.name} className="w-full h-full rounded-full" />
                              ) : (
                                collab.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                              collab.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {collab.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {collab.isEditing ? (
                                <span className="flex items-center gap-1 text-amber-600">
                                  <MessageSquare className="w-3 h-3" />
                                  En train d'éditer...
                                </span>
                              ) : (
                                collab.isOnline ? 'En ligne' : `Vu ${collab.lastSeen}`
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun collaborateur pour le moment</p>
                    <p className="text-sm mt-1">Partagez le document pour inviter d'autres personnes</p>
                  </div>
                )}
              </div>

              {!isConnected && (
                <button
                  onClick={handleJoinSession}
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Wifi className="w-5 h-5" />
                      Rejoindre la session
                    </>
                  )}
                </button>
              )}
            </>
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
