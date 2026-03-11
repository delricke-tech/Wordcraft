/**
 * Liste des conversations IA avec gestion
 * Permet de visualiser, charger et supprimer les conversations
 * 
 * Date: 6 mars 2025
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Trash2, 
  Download, 
  Clock, 
  FileText,
  Search,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  type Conversation, 
  deleteConversation,
  exportConversationAsText,
  exportConversationAsMarkdown,
  getConversationWithMessages
} from '../services/conversationService';
import { toast } from 'sonner';

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversationId: string) => void;
  onLoadConversation: (conversationId: string) => Promise<void>;
  onNewConversation: () => void;
  currentConversationId?: string;
}

export function ConversationList({
  conversations,
  onSelectConversation,
  onLoadConversation,
  onNewConversation,
  currentConversationId
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtrer les conversations selon la recherche
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.document_context.document_names.some(name => 
      name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleLoadConversation = async (conversationId: string) => {
    try {
      await onLoadConversation(conversationId);
      onSelectConversation(conversationId);
    } catch (error: any) {
      toast.error('Erreur', {
        description: 'Impossible de charger la conversation'
      });
    }
  };

  const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (deletingId) return;
    
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Confirmation
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer la conversation "${conversation.title}" ?\n\nCette action est irréversible.`
    );
    
    if (!confirmed) return;

    setDeletingId(conversationId);
    
    try {
      await deleteConversation(conversationId, ''); // userId sera ajouté dans le service
      toast.success('Conversation supprimée');
      
      // Recharger la liste (sera fait par le parent)
    } catch (error: any) {
      toast.error('Erreur', {
        description: 'Impossible de supprimer la conversation'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportConversation = async (
    conversationId: string, 
    format: 'text' | 'markdown', 
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    try {
      // Charger la conversation complète avec messages
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const conversationWithMessages = await getConversationWithMessages(conversationId, user.id);
      
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'text') {
        content = exportConversationAsText(conversationWithMessages);
        filename = `${conversation.title}.txt`;
        mimeType = 'text/plain';
      } else {
        content = exportConversationAsMarkdown(conversationWithMessages);
        filename = `${conversation.title}.md`;
        mimeType = 'text/markdown';
      }

      // Télécharger le fichier
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Export réussi', {
        description: `Conversation exportée au format ${format}`
      });
    } catch (error: any) {
      toast.error('Erreur', {
        description: 'Impossible d\'exporter la conversation'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Conversations</h3>
          <button
            onClick={onNewConversation}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Nouvelle conversation"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery 
                ? 'Essayez une autre recherche' 
                : 'Commencez une nouvelle conversation pour voir l\'historique'
              }
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all mb-2 ${
                  currentConversationId === conversation.id
                    ? 'bg-blue-100 border-2 border-blue-300'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
                onClick={() => handleLoadConversation(conversation.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate mb-1">
                      {conversation.title}
                    </h4>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {conversation.document_context.document_names.length} document(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(conversation.updated_at)}
                      </span>
                      {conversation.message_count && (
                        <span>{conversation.message_count} messages</span>
                      )}
                    </div>

                    {conversation.document_context.document_names.length > 0 && (
                      <div className="text-xs text-gray-400">
                        {conversation.document_context.document_names.slice(0, 2).join(', ')}
                        {conversation.document_context.document_names.length > 2 && 
                          ` +${conversation.document_context.document_names.length - 2} autres`
                        }
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleExportConversation(conversation.id, 'markdown', e)}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                      title="Exporter en Markdown"
                    >
                      <Download className="w-3 h-3 text-gray-600" />
                    </button>
                    
                    <button
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      disabled={deletingId === conversation.id}
                      className="p-1.5 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      {deletingId === conversation.id ? (
                        <div className="w-3 h-3 animate-spin rounded-full border border-red-600 border-t-transparent" />
                      ) : (
                        <Trash2 className="w-3 h-3 text-red-600" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600 text-center">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
