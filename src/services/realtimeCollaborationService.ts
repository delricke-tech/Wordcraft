/**
 * Service de collaboration temps réel (multi-users simultanés)
 * 
 * Ce service permet la collaboration en temps réel sur les documents
 * avec WebSocket, curseurs, synchronisation et gestion des conflits
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface CollaborationSession {
  id: string;
  documentId: string;
  documentType: 'document' | 'note' | 'conversation' | 'flashcard' | 'quiz';
  title: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  participants: CollaborationParticipant[];
  settings: CollaborationSettings;
}

export interface CollaborationParticipant {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userColor: string;
  cursor?: CursorPosition;
  selection?: TextSelection;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  permissions: ParticipantPermissions;
  joinedAt: string;
}

export interface CursorPosition {
  line: number;
  column: number;
  length?: number;
}

export interface TextSelection {
  start: CursorPosition;
  end: CursorPosition;
}

export interface ParticipantPermissions {
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canDelete: boolean;
  canManageParticipants: boolean;
}

export interface CollaborationSettings {
  allowAnonymous: boolean;
  requireApproval: boolean;
  maxParticipants: number;
  autoSave: boolean;
  autoSaveInterval: number;
  showCursors: boolean;
  showSelections: boolean;
  enableComments: boolean;
  enableChat: boolean;
  enableVersionHistory: boolean;
}

export interface CollaborationEvent {
  id: string;
  sessionId: string;
  userId: string;
  type: EventType;
  data: EventData;
  timestamp: string;
  processed: boolean;
}

export type EventType = 
  | 'cursor_move'
  | 'selection_change'
  | 'text_insert'
  | 'text_delete'
  | 'format_change'
  | 'participant_join'
  | 'participant_leave'
  | 'comment_add'
  | 'comment_edit'
  | 'comment_delete'
  | 'chat_message'
  | 'save_request'
  | 'conflict';

export interface EventData {
  position?: CursorPosition;
  selection?: TextSelection;
  text?: string;
  length?: number;
  attributes?: Record<string, any>;
  commentId?: string;
  content?: string;
  version?: number;
  conflict?: ConflictData;
}

export interface ConflictData {
  type: 'concurrent_edit' | 'version_mismatch' | 'sync_error';
  localVersion: number;
  remoteVersion: number;
  conflictingChanges: any[];
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: 'local_wins' | 'remote_wins' | 'merge' | 'manual';
  resolvedBy: string;
  resolvedAt: string;
  mergedContent?: string;
}

export interface CollaborationMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: 'text' | 'system' | 'file' | 'emoji';
  timestamp: string;
  isEdited: boolean;
  editedAt?: string;
  reactions: MessageReaction[];
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface VersionHistory {
  id: string;
  sessionId: string;
  version: number;
  content: string;
  changes: any[];
  createdBy: string;
  createdAt: string;
  description?: string;
  isAutoSave: boolean;
}

class RealtimeCollaborationService {
  private connections: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, () => void> = new Map();
  private eventHandlers: Map<EventType, ((event: CollaborationEvent) => void)[]> = new Map();

  /**
   * Crée une nouvelle session de collaboration
   */
  async createCollaborationSession(
    documentId: string,
    documentType: string,
    title: string,
    userId: string,
    settings: Partial<CollaborationSettings> = {}
  ): Promise<CollaborationSession> {
    try {
      const defaultSettings: CollaborationSettings = {
        allowAnonymous: false,
        requireApproval: false,
        maxParticipants: 10,
        autoSave: true,
        autoSaveInterval: 30000,
        showCursors: true,
        showSelections: true,
        enableComments: true,
        enableChat: true,
        enableVersionHistory: true,
        ...settings
      };

      const { data, error } = await supabase
        .from('collaboration_sessions')
        .insert({
          document_id: documentId,
          document_type: documentType,
          title,
          is_active: true,
          created_by: userId,
          settings: defaultSettings
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer la session de collaboration');

      console.log('✅ Session de collaboration créée:', data.title);
      return this.mapSessionFromDB(data);

    } catch (error) {
      console.error('❌ Erreur création session collaboration:', error);
      throw new Error(`Échec de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Rejoint une session de collaboration
   */
  async joinCollaborationSession(
    sessionId: string,
    userId: string,
    userName: string,
    userAvatar?: string
  ): Promise<CollaborationSession> {
    try {
      // Vérifier si la session existe et est active
      const { data: session, error: sessionError } = await supabase
        .from('collaboration_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('is_active', true)
        .single();

      if (sessionError) throw sessionError;
      if (!session) throw new Error('Session non trouvée ou inactive');

      // Vérifier si le nombre maximum de participants n'est pas atteint
      const { data: participants } = await supabase
        .from('collaboration_participants')
        .select('id')
        .eq('session_id', sessionId)
        .eq('status', 'online');

      if (session.settings.maxParticipants && 
          participants && participants.length >= session.settings.max_permissions) {
        throw new Error('Nombre maximum de participants atteint');
      }

      // Ajouter le participant
      const userColor = this.generateUserColor(userId);
      const { data: participant, error: participantError } = await supabase
        .from('collaboration_participants')
        .insert({
          session_id: sessionId,
          user_id: userId,
          user_name: userName,
          user_avatar: userAvatar,
          user_color: userColor,
          status: 'online',
          permissions: {
            canEdit: true,
            canComment: true,
            canShare: false,
            canDelete: false,
            canManageParticipants: false
          }
        })
        .select()
        .single();

      if (participantError) throw participantError;
      if (!participant) throw new Error('Impossible de rejoindre la session');

      // Émettre un événement de participation
      await this.emitEvent(sessionId, {
        userId,
        type: 'participant_join',
        data: {
          userName,
          userAvatar,
          userColor
        },
        timestamp: new Date().toISOString(),
        processed: false
      });

      console.log('✅ Session de collaboration rejoint:', session.title);
      return this.mapSessionFromDB(session);

    } catch (error) {
      console.error('❌ Erreur jointure session collaboration:', error);
      throw new Error(`Échec de la jointure: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Quitte une session de collaboration
   */
  async leaveCollaborationSession(sessionId: string, userId: string): Promise<void> {
    try {
      // Mettre à jour le statut du participant
      await supabase
        .from('collaboration_participants')
        .update({
          status: 'offline',
          last_seen: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      // Émettre un événement de départ
      await this.emitEvent(sessionId, {
        userId,
        type: 'participant_leave',
        data: {},
        timestamp: new Date().toISOString(),
        processed: false
      });

      // Fermer la connexion WebSocket
      this.closeConnection(sessionId);

      console.log('✅ Session de collaboration quittée');

    } catch (error) {
      console.error('❌ Erreur quitte session collaboration:', error);
      throw new Error(`Échec du départ: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Établit une connexion WebSocket pour la collaboration en temps réel
   */
  async establishRealtimeConnection(sessionId: string, userId: string): Promise<void> {
    try {
      // Fermer toute connexion existante
      this.closeConnection(sessionId);

      // Créer une nouvelle connexion WebSocket
      const wsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('🔌 Connexion WebSocket établie pour la session:', sessionId);
        
        // S'abonner aux événements de la session
        this.subscribeToSessionEvents(sessionId, userId);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealtimeEvent(sessionId, data);
        } catch (error) {
          console.error('❌ Erreur traitement message WebSocket:', error);
        }
      };

      ws.onclose = () => {
        console.log('🔌 Connexion WebSocket fermée pour la session:', sessionId);
        this.connections.delete(sessionId);
      };

      ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
      };

      this.connections.set(sessionId, ws);

    } catch (error) {
      console.error('❌ Erreur établissement connexion WebSocket:', error);
      throw new Error(`Échec de la connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Émet un événement de collaboration
   */
  async emitEvent(sessionId: string, event: Omit<CollaborationEvent, 'id' | 'sessionId' | 'processed'>): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('collaboration_events')
        .insert({
          session_id: sessionId,
          user_id: event.userId,
          event_type: event.type,
          event_data: event.data,
          timestamp: event.timestamp,
          processed: false
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible d\'émettre l\'événement');

      // Diffuser l'événement via WebSocket
      this.broadcastEvent(sessionId, {
        id: data.id,
        sessionId,
        ...event,
        processed: false
      });

    } catch (error) {
      console.error('❌ Erreur émission événement:', error);
      throw new Error(`Échec de l'émission: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour la position du curseur d'un participant
   */
  async updateCursorPosition(
    sessionId: string,
    userId: string,
    position: CursorPosition
  ): Promise<void> {
    try {
      await supabase
        .from('collaboration_participants')
        .update({
          cursor: position,
          last_seen: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      await this.emitEvent(sessionId, {
        userId,
        type: 'cursor_move',
        data: { position },
        timestamp: new Date().toISOString(),
        processed: false
      });

    } catch (error) {
      console.error('❌ Erreur mise à jour curseur:', error);
    }
  }

  /**
   * Met à jour la sélection de texte d'un participant
   */
  async updateTextSelection(
    sessionId: string,
    userId: string,
    selection: TextSelection
  ): Promise<void> {
    try {
      await supabase
        .from('collaboration_participants')
        .update({
          selection,
          last_seen: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      await this.emitEvent(sessionId, {
        userId,
        type: 'selection_change',
        data: { selection },
        timestamp: new Date().toISOString(),
        processed: false
      });

    } catch (error) {
      console.error('❌ Erreur mise à jour sélection:', error);
    }
  }

  /**
   * Insère du texte dans le document collaboratif
   */
  async insertText(
    sessionId: string,
    userId: string,
    position: CursorPosition,
    text: string
  ): Promise<void> {
    try {
      await this.emitEvent(sessionId, {
        userId,
        type: 'text_insert',
        data: { position, text },
        timestamp: new Date().toISOString(),
        processed: false
      });

    } catch (error) {
      console.error('❌ Erreur insertion texte:', error);
      throw new Error(`Échec de l'insertion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Supprime du texte dans le document collaboratif
   */
  async deleteText(
    sessionId: string,
    userId: string,
    position: CursorPosition,
    length: number
  ): Promise<void> {
    try {
      await this.emitEvent(sessionId, {
        userId,
        type: 'text_delete',
        data: { position, length },
        timestamp: new Date().toISOString(),
        processed: false
      });

    } catch (error) {
      console.error('❌ Erreur suppression texte:', error);
      throw new Error(`Échec de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Envoie un message de chat
   */
  async sendChatMessage(
    sessionId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    content: string
  ): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('collaboration_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          user_name: userName,
          user_avatar: userAvatar,
          content,
          type: 'text',
          timestamp: new Date().toISOString(),
          is_edited: false
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible d\'envoyer le message');

      await this.emitEvent(sessionId, {
        userId,
        type: 'chat_message',
        data: { messageId: data.id, content },
        timestamp: new Date().toISOString(),
        processed: false
      });

    } catch (error) {
      console.error('❌ Erreur envoi message chat:', error);
      throw new Error(`Échec de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les participants d'une session
   */
  async getSessionParticipants(sessionId: string): Promise<CollaborationParticipant[]> {
    try {
      const { data, error } = await supabase
        .from('collaboration_participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(this.mapParticipantFromDB);

    } catch (error) {
      console.error('❌ Erreur récupération participants:', error);
      return [];
    }
  }

  /**
   * Récupère les messages de chat d'une session
   */
  async getSessionMessages(sessionId: string, limit: number = 50): Promise<CollaborationMessage[]> {
    try {
      const { data, error } = await supabase
        .from('collaboration_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map(this.mapMessageFromDB).reverse();

    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      return [];
    }
  }

  /**
   * Récupère l'historique des versions d'une session
   */
  async getSessionVersionHistory(sessionId: string): Promise<VersionHistory[]> {
    try {
      const { data, error } = await supabase
        .from('collaboration_versions')
        .select('*')
        .eq('session_id', sessionId)
        .order('version', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapVersionFromDB);

    } catch (error) {
      console.error('❌ Erreur récupération historique versions:', error);
      return [];
    }
  }

  /**
   * Sauvegarde automatiquement le document
   */
  async autoSaveDocument(
    sessionId: string,
    content: string,
    userId: string
  ): Promise<void> {
    try {
      const { data: session } = await supabase
        .from('collaboration_sessions')
        .select('settings')
        .eq('id', sessionId)
        .single();

      if (!session?.settings.autoSave) return;

      // Créer une nouvelle version
      const { data: latestVersion } = await supabase
        .from('collaboration_versions')
        .select('version')
        .eq('session_id', sessionId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      const newVersion = (latestVersion?.version || 0) + 1;

      await supabase
        .from('collaboration_versions')
        .insert({
          session_id: sessionId,
          version: newVersion,
          content,
          changes: [], // À implémenter avec le diff
          created_by: userId,
          is_auto_save: true
        });

      console.log('💾 Document auto-sauvegardé, version:', newVersion);

    } catch (error) {
      console.error('❌ Erreur auto-sauvegarde:', error);
    }
  }

  /**
   * Gère les conflits de collaboration
   */
  async handleConflict(
    sessionId: string,
    userId: string,
    conflictData: ConflictData
  ): Promise<ConflictResolution> {
    try {
      // Stratégie de résolution par défaut : fusion automatique
      const resolution: ConflictResolution = {
        strategy: 'merge',
        resolvedBy: 'system',
        resolvedAt: new Date().toISOString()
      };

      // Émettre un événement de conflit
      await this.emitEvent(sessionId, {
        userId,
        type: 'conflict',
        data: { conflict },
        timestamp: new Date().toISOString(),
        processed: false
      });

      return resolution;

    } catch (error) {
      console.error('❌ Erreur gestion conflit:', error);
      throw new Error(`Échec de la gestion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * S'abonne aux événements d'une session
   */
  private subscribeToSessionEvents(sessionId: string, userId: string): void {
    const subscription = supabase
      .channel(`collaboration_${sessionId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'collaboration_events',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          this.handleRealtimeEvent(sessionId, payload.new);
        }
      )
      .subscribe();

    this.subscriptions.set(sessionId, () => subscription.unsubscribe());
  }

  /**
   * Traite les événements en temps réel
   */
  private handleRealtimeEvent(sessionId: string, event: any): void {
    const collaborationEvent: CollaborationEvent = {
      id: event.id,
      sessionId: event.session_id,
      userId: event.user_id,
      type: event.event_type,
      data: event.event_data,
      timestamp: event.timestamp,
      processed: event.processed
    };

    // Appeler les handlers d'événements
    const handlers = this.eventHandlers.get(collaborationEvent.type) || [];
    handlers.forEach(handler => {
      try {
        handler(collaborationEvent);
      } catch (error) {
        console.error('❌ Erreur handler événement:', error);
      }
    });
  }

  /**
   * Diffuse un événement via WebSocket
   */
  private broadcastEvent(sessionId: string, event: CollaborationEvent): void {
    const ws = this.connections.get(sessionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  /**
   * Ferme une connexion WebSocket
   */
  private closeConnection(sessionId: string): void {
    const ws = this.connections.get(sessionId);
    if (ws) {
      ws.close();
      this.connections.delete(sessionId);
    }

    const unsubscribe = this.subscriptions.get(sessionId);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(sessionId);
    }
  }

  /**
   * Génère une couleur unique pour un utilisateur
   */
  private generateUserColor(userId: string): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Ajoute un handler d'événement
   */
  onEvent(eventType: EventType, handler: (event: CollaborationEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
  }

  /**
   * Supprime un handler d'événement
   */
  offEvent(eventType: EventType, handler: (event: CollaborationEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.eventHandlers.set(eventType, handlers);
    }
  }

  /**
   * Mappe une session depuis la base de données
   */
  private mapSessionFromDB(data: any): CollaborationSession {
    return {
      id: data.id,
      documentId: data.document_id,
      documentType: data.document_type,
      title: data.title,
      isActive: data.is_active,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      participants: [],
      settings: data.settings
    };
  }

  /**
   * Mappe un participant depuis la base de données
   */
  private mapParticipantFromDB(data: any): CollaborationParticipant {
    return {
      id: data.id,
      userId: data.user_id,
      userName: data.user_name,
      userAvatar: data.user_avatar,
      userColor: data.user_color,
      cursor: data.cursor,
      selection: data.selection,
      status: data.status,
      lastSeen: data.last_seen,
      permissions: data.permissions,
      joinedAt: data.joined_at
    };
  }

  /**
   * Mappe un message depuis la base de données
   */
  private mapMessageFromDB(data: any): CollaborationMessage {
    return {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      userName: data.user_name,
      userAvatar: data.user_avatar,
      content: data.content,
      type: data.type,
      timestamp: data.timestamp,
      isEdited: data.is_edited,
      editedAt: data.edited_at,
      reactions: data.reactions || []
    };
  }

  /**
   * Mappe une version depuis la base de données
   */
  private mapVersionFromDB(data: any): VersionHistory {
    return {
      id: data.id,
      sessionId: data.session_id,
      version: data.version,
      content: data.content,
      changes: data.changes || [],
      createdBy: data.created_by,
      createdAt: data.created_at,
      description: data.description,
      isAutoSave: data.is_auto_save
    };
  }
}

// Instance singleton
export const realtimeCollaborationService = new RealtimeCollaborationService();

// Export des fonctions utilitaires
export const createCollaborationSession = (
  documentId: string,
  documentType: string,
  title: string,
  userId: string,
  settings?: Partial<CollaborationSettings>
) => realtimeCollaborationService.createCollaborationSession(documentId, documentType, title, userId, settings);

export const joinCollaborationSession = (
  sessionId: string,
  userId: string,
  userName: string,
  userAvatar?: string
) => realtimeCollaborationService.joinCollaborationSession(sessionId, userId, userName, userAvatar);

export const leaveCollaborationSession = (sessionId: string, userId: string) => 
  realtimeCollaborationService.leaveCollaborationSession(sessionId, userId);

export const establishRealtimeConnection = (sessionId: string, userId: string) => 
  realtimeCollaborationService.establishRealtimeConnection(sessionId, userId);

export const emitEvent = (sessionId: string, event: Omit<CollaborationEvent, 'id' | 'sessionId' | 'processed'>) => 
  realtimeCollaborationService.emitEvent(sessionId, event);

export const updateCursorPosition = (sessionId: string, userId: string, position: CursorPosition) => 
  realtimeCollaborationService.updateCursorPosition(sessionId, userId, position);

export const insertText = (sessionId: string, userId: string, position: CursorPosition, text: string) => 
  realtimeCollaborationService.insertText(sessionId, userId, position, text);

export const sendChatMessage = (
  sessionId: string,
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  content: string
) => realtimeCollaborationService.sendChatMessage(sessionId, userId, userName, userAvatar, content);

export const getSessionParticipants = (sessionId: string) => 
  realtimeCollaborationService.getSessionParticipants(sessionId);

// NOUVELLES FONCTIONNALITÉS AVANCÉES

/**
 * Interface pour les opérations avancées de collaboration
 */
export interface AdvancedCollaborationFeatures {
  versionControl: boolean;
  conflictResolution: 'manual' | 'auto' | 'merge';
  presenceIndicators: boolean;
  voiceChat: boolean;
  videoChat: boolean;
  screenSharing: boolean;
  annotationTools: boolean;
  commentSystem: boolean;
  taskManagement: boolean;
  fileSharing: boolean;
}

/**
 * Contrôle de version pour les documents collaboratifs
 */
export interface DocumentVersion {
  id: string;
  sessionId: string;
  version: number;
  content: string;
  changes: DocumentChange[];
  authorId: string;
  authorName: string;
  timestamp: Date;
  description?: string;
  isAutoSave: boolean;
  checksum: string;
}

/**
 * Changement dans le document
 */
export interface DocumentChange {
  id: string;
  type: 'insert' | 'delete' | 'replace' | 'format';
  position: CursorPosition;
  content?: string;
  oldContent?: string;
  authorId: string;
  timestamp: Date;
  applied: boolean;
}

/**
 * Résolution de conflit
 */
export interface ConflictResolution {
  conflictId: string;
  sessionId: string;
  changes: DocumentChange[];
  conflictingChanges: DocumentChange[];
  resolution: 'accept' | 'reject' | 'merge' | 'pending';
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionMethod: string;
}

/**
 * Annotation collaborative
 */
export interface CollaborativeAnnotation {
  id: string;
  sessionId: string;
  authorId: string;
  authorName: string;
  type: 'comment' | 'highlight' | 'drawing' | 'suggestion';
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  content?: string;
  color: string;
  isResolved: boolean;
  replies: AnnotationReply[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Réponse à une annotation
 */
export interface AnnotationReply {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

/**
 * Tâche collaborative
 */
export interface CollaborativeTask {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  creatorId: string;
  creatorName: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fichier partagé dans la collaboration
 */
export interface SharedFile {
  id: string;
  sessionId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
  isPublic: boolean;
  downloadCount: number;
}

/**
 * Session de chat vocal
 */
export interface VoiceChatSession {
  id: string;
  sessionId: string;
  participants: string[];
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
  recordingUrl?: string;
}

/**
 * Crée une nouvelle version de document
 */
export async function createDocumentVersion(
  sessionId: string,
  content: string,
  changes: DocumentChange[],
  authorId: string,
  authorName: string,
  description?: string,
  isAutoSave: boolean = false
): Promise<DocumentVersion> {
  try {
    const checksum = generateContentChecksum(content);
    
    const versionData = {
      session_id: sessionId,
      version: await getNextVersionNumber(sessionId),
      content,
      changes: changes.map(c => ({
        ...c,
        timestamp: c.timestamp.toISOString(),
        position: {
          line: c.position.line,
          column: c.position.column,
          length: c.position.length
        }
      })),
      author_id: authorId,
      author_name: authorName,
      timestamp: new Date().toISOString(),
      description: description || (isAutoSave ? 'Sauvegarde automatique' : 'Modification manuelle'),
      is_auto_save: isAutoSave,
      checksum
    };

    const { data, error } = await supabase
      .from('document_versions')
      .insert([versionData])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Échec de la création de version');

    return mapVersionFromDB(data);
  } catch (error) {
    console.error('❌ Erreur création version document:', error);
    throw new Error('Erreur lors de la création de la version du document');
  }
}

/**
 * Récupère l'historique des versions d'un document
 */
export async function getDocumentVersions(
  sessionId: string,
  limit: number = 50
): Promise<DocumentVersion[]> {
  try {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('session_id', sessionId)
      .order('version', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data) return [];

    return data.map(mapVersionFromDB);
  } catch (error) {
    console.error('❌ Erreur récupération versions document:', error);
    throw new Error('Erreur lors de la récupération des versions du document');
  }
}

/**
 * Détecte et résout les conflits de collaboration
 */
export async function detectAndResolveConflicts(
  sessionId: string,
  changes: DocumentChange[],
  resolutionMode: 'manual' | 'auto' | 'merge' = 'auto'
): Promise<ConflictResolution[]> {
  try {
    const conflicts: ConflictResolution[] = [];
    
    // Récupérer les changements récents
    const { data: recentChanges, error: changesError } = await supabase
      .from('document_changes')
      .select('*')
      .eq('session_id', sessionId)
      .eq('applied', false)
      .order('timestamp', { ascending: true });

    if (changesError) throw changesError;

    // Détecter les conflits
    for (const change of changes) {
      const conflictingChanges = recentChanges?.filter(rc => 
        isPositionConflicting(rc.position, change.position) && rc.author_id !== change.authorId
      ) || [];

      if (conflictingChanges.length > 0) {
        const conflict: ConflictResolution = {
          conflictId: generateConflictId(),
          sessionId,
          changes: [change],
          conflictingChanges,
          resolution: resolutionMode === 'auto' ? 'accept' : 'pending',
          resolutionMethod: resolutionMode
        };

        if (resolutionMode === 'auto') {
          await applyConflictResolution(conflict);
        }

        conflicts.push(conflict);
      }
    }

    return conflicts;
  } catch (error) {
    console.error('❌ Erreur détection conflits:', error);
    throw new Error('Erreur lors de la détection des conflits');
  }
}

/**
 * Vérifie si deux positions sont en conflit
 */
function isPositionConflicting(pos1: any, pos2: CursorPosition): boolean {
  const line1 = pos1.line;
  const col1 = pos1.column;
  const line2 = pos2.line;
  const col2 = pos2.column;

  if (line1 !== line2) return false;
  
  const length1 = pos1.length || 1;
  const length2 = pos2.length || 1;
  
  return !(col1 + length1 <= col2 || col2 + length2 <= col1);
}

/**
 * Applique une résolution de conflit
 */
async function applyConflictResolution(conflict: ConflictResolution): Promise<void> {
  try {
    const resolutionData = {
      conflict_id: conflict.conflictId,
      session_id: conflict.sessionId,
      changes: conflict.changes.map(c => ({
        ...c,
        timestamp: c.timestamp.toISOString(),
        position: {
          line: c.position.line,
          column: c.position.column,
          length: c.position.length
        }
      })),
      conflicting_changes: conflict.conflictingChanges.map(c => ({
        ...c,
        timestamp: c.timestamp.toISOString(),
        position: {
          line: c.position.line,
          column: c.position.column,
          length: c.position.length
        }
      })),
      resolution: conflict.resolution,
      resolved_at: new Date().toISOString(),
      resolution_method: conflict.resolutionMethod
    };

    const { error } = await supabase
      .from('conflict_resolutions')
      .insert([resolutionData]);

    if (error) throw error;

    // Marquer les changements comme appliqués
    await markChangesAsApplied(conflict.changes.map(c => c.id));
  } catch (error) {
    console.error('❌ Erreur application résolution conflit:', error);
    throw error;
  }
}

/**
 * Marque les changements comme appliqués
 */
async function markChangesAsApplied(changeIds: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('document_changes')
      .update({ applied: true })
      .in('id', changeIds);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Erreur marquage changements appliqués:', error);
  }
}

/**
 * Crée une annotation collaborative
 */
export async function createCollaborativeAnnotation(
  sessionId: string,
  authorId: string,
  authorName: string,
  type: 'comment' | 'highlight' | 'drawing' | 'suggestion',
  position: { x: number; y: number; width?: number; height?: number },
  content?: string,
  color: string = '#FF5722'
): Promise<CollaborativeAnnotation> {
  try {
    const annotationData = {
      session_id: sessionId,
      author_id: authorId,
      author_name: authorName,
      type,
      position,
      content: content || null,
      color,
      is_resolved: false,
      replies: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('collaborative_annotations')
      .insert([annotationData])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Échec de la création d\'annotation');

    return mapAnnotationFromDB(data);
  } catch (error) {
    console.error('❌ Erreur création annotation:', error);
    throw new Error('Erreur lors de la création de l\'annotation');
  }
}

/**
 * Récupère les annotations d'une session
 */
export async function getSessionAnnotations(
  sessionId: string,
  includeResolved: boolean = false
): Promise<CollaborativeAnnotation[]> {
  try {
    let query = supabase
      .from('collaborative_annotations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (!includeResolved) {
      query = query.eq('is_resolved', false);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map(mapAnnotationFromDB);
  } catch (error) {
    console.error('❌ Erreur récupération annotations:', error);
    throw new Error('Erreur lors de la récupération des annotations');
  }
}

/**
 * Ajoute une réponse à une annotation
 */
export async function addAnnotationReply(
  annotationId: string,
  authorId: string,
  authorName: string,
  content: string
): Promise<void> {
  try {
    const replyData = {
      id: generateReplyId(),
      author_id: authorId,
      author_name: authorName,
      content,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.rpc('add_annotation_reply', {
      annotation_id: annotationId,
      reply: replyData
    });

    if (error) throw error;
  } catch (error) {
    console.error('❌ Erreur ajout réponse annotation:', error);
    throw new Error('Erreur lors de l\'ajout de la réponse à l\'annotation');
  }
}

/**
 * Crée une tâche collaborative
 */
export async function createCollaborativeTask(
  sessionId: string,
  title: string,
  description?: string,
  creatorId: string,
  creatorName: string,
  assigneeId?: string,
  assigneeName?: string,
  priority: 'low' | 'medium' | 'high' = 'medium',
  dueDate?: Date
): Promise<CollaborativeTask> {
  try {
    const taskData = {
      session_id: sessionId,
      title,
      description: description || null,
      assignee_id: assigneeId || null,
      assignee_name: assigneeName || null,
      creator_id: creatorId,
      creator_name: creatorName,
      status: 'todo',
      priority,
      due_date: dueDate?.toISOString() || null,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('collaborative_tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Échec de la création de tâche');

    return mapTaskFromDB(data);
  } catch (error) {
    console.error('❌ Erreur création tâche collaborative:', error);
    throw new Error('Erreur lors de la création de la tâche collaborative');
  }
}

/**
 * Récupère les tâches d'une session
 */
export async function getSessionTasks(
  sessionId: string,
  status?: 'todo' | 'in_progress' | 'review' | 'done'
): Promise<CollaborativeTask[]> {
  try {
    let query = supabase
      .from('collaborative_tasks')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map(mapTaskFromDB);
  } catch (error) {
    console.error('❌ Erreur récupération tâches:', error);
    throw new Error('Erreur lors de la récupération des tâches collaboratives');
  }
}

/**
 * Met à jour le statut d'une tâche
 */
export async function updateTaskStatus(
  taskId: string,
  status: 'todo' | 'in_progress' | 'review' | 'done'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('collaborative_tasks')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Erreur mise à jour statut tâche:', error);
    throw new Error('Erreur lors de la mise à jour du statut de la tâche');
  }
}

/**
 * Partage un fichier dans une session collaborative
 */
export async function shareFileInSession(
  sessionId: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  fileUrl: string,
  uploadedBy: string,
  uploadedByName: string,
  isPublic: boolean = false
): Promise<SharedFile> {
  try {
    const fileData = {
      session_id: sessionId,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      file_url: fileUrl,
      uploaded_by: uploadedBy,
      uploaded_by_name: uploadedByName,
      is_public: isPublic,
      download_count: 0,
      uploaded_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('shared_files')
      .insert([fileData])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Échec du partage de fichier');

    return mapFileFromDB(data);
  } catch (error) {
    console.error('❌ Erreur partage fichier:', error);
    throw new Error('Erreur lors du partage du fichier');
  }
}

/**
 * Récupère les fichiers partagés d'une session
 */
export async function getSessionSharedFiles(sessionId: string): Promise<SharedFile[]> {
  try {
    const { data, error } = await supabase
      .from('shared_files')
      .select('*')
      .eq('session_id', sessionId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map(mapFileFromDB);
  } catch (error) {
    console.error('❌ Erreur récupération fichiers partagés:', error);
    throw new Error('Erreur lors de la récupération des fichiers partagés');
  }
}

/**
 * Démarre une session de chat vocal
 */
export async function startVoiceChatSession(
  sessionId: string,
  participants: string[]
): Promise<VoiceChatSession> {
  try {
    const voiceChatData = {
      session_id: sessionId,
      participants,
      is_active: true,
      started_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('voice_chat_sessions')
      .insert([voiceChatData])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Échec du démarrage du chat vocal');

    return mapVoiceChatFromDB(data);
  } catch (error) {
    console.error('❌ Erreur démarrage chat vocal:', error);
    throw new Error('Erreur lors du démarrage de la session de chat vocal');
  }
}

/**
 * Fonctions utilitaires
 */
function generateContentChecksum(content: string): string {
  // Simple checksum - dans une vraie implémentation, utiliser un algorithme plus robuste
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en 32-bit integer
  }
  return hash.toString(16);
}

async function getNextVersionNumber(sessionId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('document_versions')
      .select('version')
      .eq('session_id', sessionId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return 1;
    return data.version + 1;
  } catch (error) {
    return 1;
  }
}

function generateConflictId(): string {
  return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateReplyId(): string {
  return `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Fonctions de mapping depuis la base de données
function mapVersionFromDB(data: any): DocumentVersion {
  return {
    id: data.id,
    sessionId: data.session_id,
    version: data.version,
    content: data.content,
    changes: data.changes.map((c: any) => ({
      ...c,
      timestamp: new Date(c.timestamp),
      position: c.position
    })),
    authorId: data.author_id,
    authorName: data.author_name,
    timestamp: new Date(data.timestamp),
    description: data.description,
    isAutoSave: data.is_auto_save,
    checksum: data.checksum
  };
}

function mapAnnotationFromDB(data: any): CollaborativeAnnotation {
  return {
    id: data.id,
    sessionId: data.session_id,
    authorId: data.author_id,
    authorName: data.author_name,
    type: data.type,
    position: data.position,
    content: data.content,
    color: data.color,
    isResolved: data.is_resolved,
    replies: data.replies || [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}

function mapTaskFromDB(data: any): CollaborativeTask {
  return {
    id: data.id,
    sessionId: data.session_id,
    title: data.title,
    description: data.description,
    assigneeId: data.assignee_id,
    assigneeName: data.assignee_name,
    creatorId: data.creator_id,
    creatorName: data.creator_name,
    status: data.status,
    priority: data.priority,
    dueDate: data.due_date ? new Date(data.due_date) : undefined,
    tags: data.tags || [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}

function mapFileFromDB(data: any): SharedFile {
  return {
    id: data.id,
    sessionId: data.session_id,
    fileName: data.file_name,
    fileSize: data.file_size,
    fileType: data.file_type,
    fileUrl: data.file_url,
    uploadedBy: data.uploaded_by,
    uploadedByName: data.uploaded_by_name,
    uploadedAt: new Date(data.uploaded_at),
    isPublic: data.is_public,
    downloadCount: data.download_count
  };
}

function mapVoiceChatFromDB(data: any): VoiceChatSession {
  return {
    id: data.id,
    sessionId: data.session_id,
    participants: data.participants,
    isActive: data.is_active,
    startedAt: new Date(data.started_at),
    endedAt: data.ended_at ? new Date(data.ended_at) : undefined,
    recordingUrl: data.recording_url
  };
}

export const getSessionMessages = (sessionId: string, limit?: number) => 
  realtimeCollaborationService.getSessionMessages(sessionId, limit);
