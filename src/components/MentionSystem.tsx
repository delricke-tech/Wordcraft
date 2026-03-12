/**
 * Composant de système de mentions @utilisateur avec notifications
 * 
 * Ce composant gère les mentions d'utilisateurs avec autocomplete,
 * suggestions intelligentes et notifications en temps réel
 * 
 * Date: 12 mars 2026
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AtSign, 
  User, 
  X, 
  Check, 
  AlertCircle,
  Bell,
  BellOff,
  Search,
  Users,
  Mail,
  MessageSquare,
  Star,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { 
  searchUsers,
  getUserMentions,
  markMentionAsRead,
  getMentionNotifications,
  createMention,
  type MentionUser,
  type MentionNotification,
  type MentionOptions
} from '../services/mentionService';

interface MentionSystemProps {
  onMention?: (userId: string, userName: string) => void;
  onTextChange?: (text: string, mentions: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showNotifications?: boolean;
  maxSuggestions?: number;
  excludeIds?: string[];
  includeTeams?: boolean;
}

interface MentionState {
  text: string;
  mentions: Array<{id: string, name: string, start: number, end: number}>;
  cursorPosition: number;
  showSuggestions: boolean;
  suggestionQuery: string;
  selectedSuggestion: number;
}

const MentionSystem: React.FC<MentionSystemProps> = ({
  onMention,
  onTextChange,
  placeholder = "Tapez @ pour mentionner un utilisateur...",
  className = '',
  disabled = false,
  showNotifications = true,
  maxSuggestions = 8,
  excludeIds = [],
  includeTeams = false
}) => {
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const [state, setState] = useState<MentionState>({
    text: '',
    mentions: [],
    cursorPosition: 0,
    showSuggestions: false,
    suggestionQuery: '',
    selectedSuggestion: 0
  });
  
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<MentionNotification[]>([]);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger les notifications
  useEffect(() => {
    if (showNotifications && user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // Toutes les 30 secondes
      return () => clearInterval(interval);
    }
  }, [showNotifications, user]);

  const loadNotifications = async () => {
    try {
      const notifs = await getMentionNotifications(user!.id, { unread: true });
      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    }
  };

  // Gérer le changement de texte
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Détecter si on est en train de taper une mention
    const beforeCursor = text.substring(0, cursorPosition);
    const afterMention = beforeCursor.lastIndexOf('@');
    
    let showSuggestions = false;
    let suggestionQuery = '';
    let selectedSuggestion = 0;
    
    if (afterMention !== -1) {
      const mentionText = beforeCursor.substring(afterMention + 1);
      
      // Vérifier si c'est une mention valide (pas d'espace, pas plus de 20 caractères)
      if (!mentionText.includes(' ') && mentionText.length <= 20) {
        showSuggestions = true;
        suggestionQuery = mentionText;
        
        // Charger les suggestions
        if (mentionText.length > 0) {
          loadSuggestions(mentionText);
        }
      }
    }
    
    setState(prev => ({
      ...prev,
      text,
      cursorPosition,
      showSuggestions,
      suggestionQuery,
      selectedSuggestion
    }));
    
    // Extraire les mentions du texte
    const mentions = extractMentions(text);
    
    // Notifier le parent
    onTextChange?.(text, mentions.map(m => m.name));
    
  }, [onTextChange]);

  // Charger les suggestions d'utilisateurs
  const loadSuggestions = async (query: string) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const options: MentionOptions = {
        query,
        limit: maxSuggestions,
        excludeIds: [...excludeIds, user?.id || ''],
        includeTeams,
        activeOnly: true
      };
      
      const users = await searchUsers(options);
      setSuggestions(users);
      
    } catch (error) {
      console.error('❌ Erreur chargement suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Extraire les mentions du texte
  const extractMentions = (text: string): Array<{id: string, name: string, start: number, end: number}> => {
    const mentions = [];
    const regex = /@(\w+)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      mentions.push({
        id: '', // Sera rempli plus tard
        name: match[1],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    return mentions;
  };

  // Sélectionner une suggestion
  const selectSuggestion = useCallback((suggestion: MentionUser) => {
    const text = state.text;
    const beforeCursor = text.substring(0, state.cursorPosition);
    const afterCursor = text.substring(state.cursorPosition);
    const lastAtPos = beforeCursor.lastIndexOf('@');
    
    const newText = beforeCursor.substring(0, lastAtPos) + 
                   `@${suggestion.name} ` + 
                   afterCursor;
    
    setState(prev => ({
      ...prev,
      text: newText,
      mentions: [...prev.mentions, {
        id: suggestion.id,
        name: suggestion.name,
        start: lastAtPos,
        end: lastAtPos + suggestion.name.length + 2
      }],
      showSuggestions: false,
      suggestionQuery: '',
      selectedSuggestion: 0
    }));
    
    // Créer la mention dans la base de données
    if (user) {
      createMention({
        mentionedUserId: suggestion.id,
        mentionedByUserId: user.id,
        context: 'comment',
        content: state.text
      }).catch(error => {
        console.error('❌ Erreur création mention:', error);
      });
    }
    
    // Notifier le parent
    onMention?.(suggestion.id, suggestion.name);
    
    // Remettre le focus
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = lastAtPos + suggestion.name.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
    
    setSuggestions([]);
  }, [state.text, state.cursorPosition, state.mentions, onMention, user]);

  // Gérer les touches du clavier
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!state.showSuggestions) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setState(prev => ({
          ...prev,
          selectedSuggestion: Math.min(prev.selectedSuggestion + 1, suggestions.length - 1)
        }));
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setState(prev => ({
          ...prev,
          selectedSuggestion: Math.max(prev.selectedSuggestion - 1, 0)
        }));
        break;
        
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (suggestions[state.selectedSuggestion]) {
          selectSuggestion(suggestions[state.selectedSuggestion]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setState(prev => ({
          ...prev,
          showSuggestions: false,
          suggestionQuery: '',
          selectedSuggestion: 0
        }));
        setSuggestions([]);
        break;
    }
  }, [state.showSuggestions, state.selectedSuggestion, suggestions, selectSuggestion]);

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      await markMentionAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Erreur marquage notification lue:', error);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      await Promise.all(notifications.map(n => markMentionAsRead(n.id)));
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Toutes les notifications marquées comme lues');
    } catch (error) {
      console.error('❌ Erreur marquage notifications lues:', error);
      toast.error('Erreur lors du marquage des notifications');
    }
  };

  // Rendu des suggestions
  const renderSuggestions = () => {
    if (!state.showSuggestions || suggestions.length === 0) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          ref={suggestionsRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto"
        >
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => selectSuggestion(suggestion)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors ${
                  index === state.selectedSuggestion ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
              >
                <div className="relative">
                  {suggestion.avatar ? (
                    <img
                      src={suggestion.avatar}
                      alt={suggestion.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {suggestion.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {suggestion.name}
                    </span>
                    {suggestion.isTeam && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                        Équipe
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.email}
                  </div>
                  {suggestion.role && (
                    <div className="text-xs text-gray-400">
                      {suggestion.role}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {suggestion.isFollowed && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                  {index === state.selectedSuggestion && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              </button>
            ))
          )}
          
          {suggestions.length === 0 && !loading && (
            <div className="px-3 py-4 text-center text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucun utilisateur trouvé</p>
              <p className="text-xs">Essayez une autre recherche</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  // Rendu du panneau de notifications
  const renderNotifications = () => {
    if (!showNotifications || !user) return null;
    
    return (
      <AnimatePresence>
        {showNotificationsPanel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            {/* En-tête */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications ({unreadCount})
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Tout marquer comme lu
                  </button>
                )}
                <button
                  onClick={() => setShowNotificationsPanel(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Liste des notifications */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-800 mb-1">Aucune notification</h4>
                  <p className="text-sm text-gray-500">Vous n'avez pas de nouvelles mentions</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <AtSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {notification.mentionedByUserName}
                            </span>
                            <span className="text-xs text-gray-500">
                              vous a mentionné
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.context === 'comment' && 'dans un commentaire'}
                            {notification.context === 'document' && 'dans un document'}
                            {notification.context === 'note' && 'dans une note'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {notification.targetTitle && (
                              <span className="truncate">
                                dans: {notification.targetTitle}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className={`mention-system relative ${className}`}>
      {/* Zone de texte */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={state.text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          rows={3}
        />
        
        {/* Suggestions */}
        {renderSuggestions()}
      </div>
      
      {/* Barre d'outils */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <AtSign className="w-4 h-4" />
            Tapez @ pour mentionner
          </div>
          
          {state.mentions.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-blue-600">
              <Users className="w-4 h-4" />
              {state.mentions.length} mention{state.mentions.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        {/* Bouton notifications */}
        {showNotifications && (
          <div className="relative">
            <button
              onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
              className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {renderNotifications()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentionSystem;
