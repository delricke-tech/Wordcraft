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

export const getSessionMessages = (sessionId: string, limit?: number) => 
  realtimeCollaborationService.getSessionMessages(sessionId, limit);
