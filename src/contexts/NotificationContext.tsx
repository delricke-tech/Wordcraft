/**
 * Contexte pour la gestion des notifications
 * Phase 3.4 - Expérience utilisateur
 * 
 * Date: 10 mars 2025
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Check, 
  X, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  CheckCircle,
  Mail,
  MessageSquare,
  Users,
  FileText,
  Video,
  Calendar
} from 'lucide-react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 'system' | 'message' | 'document' | 'session' | 'group' | 'reminder';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 50,
  autoClose = true,
  autoCloseDelay = 5000
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // Auto-close for success notifications
    if (autoClose && notification.type === 'success') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, autoCloseDelay);
    }
  }, [maxNotifications, autoClose, autoCloseDelay]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Composant pour afficher les notifications
const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification, markAsRead } = useNotifications();

  const getIcon = (type: NotificationType, category: NotificationCategory) => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <X {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      case 'info':
      default:
        switch (category) {
          case 'message':
            return <MessageSquare {...iconProps} />;
          case 'document':
            return <FileText {...iconProps} />;
          case 'session':
            return <Video {...iconProps} />;
          case 'group':
            return <Users {...iconProps} />;
          case 'reminder':
            return <Calendar {...iconProps} />;
          default:
            return <Info {...iconProps} />;
        }
    }
  };

  const getColorClasses = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      <AnimatePresence>
        {notifications.slice(0, 5).map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              p-4 rounded-lg border shadow-lg backdrop-blur-sm
              ${getColorClasses(notification.type)}
              ${!notification.read ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
            `}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.type, notification.category)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm opacity-90 mb-2">
                  {notification.message}
                </p>
                {notification.action && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      notification.action!.onClick();
                      removeNotification(notification.id);
                    }}
                    className="text-sm font-medium underline hover:no-underline"
                  >
                    {notification.action.label}
                  </button>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-75">
                    {formatTime(notification.timestamp)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Hook pour les notifications pré-définies
export const useSystemNotifications = () => {
  const { addNotification } = useNotifications();

  const notifySuccess = (title: string, message: string, category: NotificationCategory = 'system') => {
    addNotification({ type: 'success', category, title, message });
  };

  const notifyError = (title: string, message: string, category: NotificationCategory = 'system') => {
    addNotification({ type: 'error', category, title, message });
  };

  const notifyWarning = (title: string, message: string, category: NotificationCategory = 'system') => {
    addNotification({ type: 'warning', category, title, message });
  };

  const notifyInfo = (title: string, message: string, category: NotificationCategory = 'system') => {
    addNotification({ type: 'info', category, title, message });
  };

  const notifyMessage = (sender: string, message: string, action?: () => void) => {
    addNotification({
      type: 'info',
      category: 'message',
      title: `Nouveau message de ${sender}`,
      message,
      action: action ? { label: 'Voir', onClick: action } : undefined
    });
  };

  const notifyDocument = (documentName: string, action: 'uploaded' | 'shared' | 'updated') => {
    const messages = {
      uploaded: 'a été téléchargé',
      shared: 'a été partagé avec vous',
      updated: 'a été mis à jour'
    };
    
    addNotification({
      type: 'info',
      category: 'document',
      title: 'Document',
      message: `Le document "${documentName}" ${messages[action]}`
    });
  };

  const notifySession = (sessionTitle: string, action: 'starting' | 'invitation' | 'ended') => {
    const messages = {
      starting: 'commence bientôt',
      invitation: 'vous a invité à rejoindre',
      ended: 'est terminée'
    };
    
    addNotification({
      type: action === 'starting' ? 'warning' : 'info',
      category: 'session',
      title: 'Session Live',
      message: `La session "${sessionTitle}" ${messages[action]}`
    });
  };

  const notifyGroup = (groupName: string, action: 'invitation' | 'new_member' | 'message') => {
    const messages = {
      invitation: 'vous a invité à rejoindre',
      new_member: 'a un nouveau membre',
      message: 'a un nouveau message'
    };
    
    addNotification({
      type: 'info',
      category: 'group',
      title: 'Groupe',
      message: `Le groupe "${groupName}" ${messages[action]}`
    });
  };

  return {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyMessage,
    notifyDocument,
    notifySession,
    notifyGroup
  };
};

// Fonction utilitaire pour formater l'heure
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) {
    return 'À l\'instant';
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString('fr-FR');
  }
}
