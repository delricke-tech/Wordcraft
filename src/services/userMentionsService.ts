/**
 * Service de mentions @utilisateur avec notifications
 * 
 * Ce service permet de gérer les mentions d'utilisateurs, les notifications,
 * l'auto-complétion et le suivi des interactions
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface UserMention {
  id: string;
  sourceId: string;
  sourceType: MentionSourceType;
  sourceContent: string;
  mentionedUserId: string;
  mentionedUserName: string;
  mentionedByUserId: string;
  mentionedByUserName: string;
  position: number;
  context: string;
  status: MentionStatus;
  readAt?: string;
  createdAt: string;
  metadata: MentionMetadata;
}

export type MentionSourceType = 
  | 'comment'
  | 'note'
  | 'conversation'
  | 'chat_message'
  | 'document_share'
  | 'task_assignment'
  | 'announcement';

export type MentionStatus = 'pending' | 'read' | 'acknowledged' | 'dismissed';

export interface MentionMetadata {
  originalText: string;
  mentionType: MentionType;
  urgency: MentionUrgency;
  category: MentionCategory;
  tags: string[];
  relatedEntities: RelatedEntity[];
  contextInfo: ContextInfo;
}

export type MentionType = 'direct' | 'team' | 'role' | 'channel' | 'everyone';
export type MentionUrgency = 'low' | 'medium' | 'high' | 'urgent';
export type MentionCategory = 'question' | 'task' | 'feedback' | 'info' | 'alert';

export interface RelatedEntity {
  id: string;
  type: 'document' | 'note' | 'conversation' | 'task' | 'project';
  name: string;
  url?: string;
}

export interface ContextInfo {
  title: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  excerpt: string;
  location: string;
}

export interface MentionNotification {
  id: string;
  userId: string;
  mentionId: string;
  type: NotificationType;
  title: string;
  content: string;
  data: NotificationData;
  read: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  metadata: NotificationMetadata;
}

export type NotificationType = 
  | 'mention'
  | 'reply_to_mention'
  | 'mention_resolved'
  | 'team_mention'
  | 'role_mention'
  | 'everyone_mention';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationChannel = 'in_app' | 'email' | 'push' | 'slack' | 'webhook';

export interface NotificationData {
  mentionId: string;
  sourceId: string;
  sourceType: MentionSourceType;
  mentionedBy: string;
  mentionedByAvatar?: string;
  context: string;
  actionUrl?: string;
  preview?: string;
}

export interface NotificationMetadata {
  deliveryAttempts: number;
  lastDeliveryAttempt?: string;
  deliveryStatus: DeliveryStatus;
  scheduledAt?: string;
  retryCount: number;
  maxRetries: number;
}

export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'expired';

export interface MentionSuggestion {
  id: string;
  userName: string;
  displayName: string;
  avatar?: string;
  role?: string;
  team?: string;
  department?: string;
  isActive: boolean;
  lastActive?: string;
  mentionCount: number;
  relevanceScore: number;
  priority: SuggestionPriority;
}

export type SuggestionPriority = 'high' | 'medium' | 'low';

export interface MentionStats {
  totalMentions: number;
  mentionsReceived: number;
  mentionsSent: number;
  unreadMentions: number;
  mentionsByType: Record<MentionType, number>;
  mentionsByCategory: Record<MentionCategory, number>;
  topMentioners: Array<{ userId: string; userName: string; count: number }>;
  recentMentions: UserMention[];
  mentionTrends: Array<{ date: string; count: number }>;
  responseRate: number;
  avgResponseTime: number;
}

export interface MentionOptions {
  sourceId: string;
  sourceType: MentionSourceType;
  sourceContent: string;
  mentionedUsers: Array<{
    userId: string;
    userName: string;
    position: number;
    context?: string;
  }>;
  mentionedByUserId: string;
  mentionedByUserName: string;
  urgency?: MentionUrgency;
  category?: MentionCategory;
  tags?: string[];
  relatedEntities?: RelatedEntity[];
  contextInfo?: ContextInfo;
}

class UserMentionsService {
  /**
   * Crée des mentions d'utilisateurs
   */
  async createMentions(options: MentionOptions): Promise<UserMention[]> {
    try {
      const mentions: UserMention[] = [];
      
      for (const mentionedUser of options.mentionedUsers) {
        // Vérifier si l'utilisateur mentionné existe et est actif
        const { data: user } = await supabase
          .from('profiles')
          .select('id, username, is_active')
          .eq('id', mentionedUser.userId)
          .eq('is_active', true)
          .single();

        if (!user) {
          console.warn(`Utilisateur ${mentionedUser.userId} non trouvé ou inactif`);
          continue;
        }

        // Vérifier si cette mention existe déjà
        const { data: existingMention } = await supabase
          .from('user_mentions')
          .select('id')
          .eq('source_id', options.sourceId)
          .eq('mentioned_user_id', mentionedUser.userId)
          .eq('position', mentionedUser.position)
          .single();

        if (existingMention) {
          console.log(`Mention déjà existante pour ${mentionedUser.userName}`);
          continue;
        }

        // Créer la mention
        const { data, error } = await supabase
          .from('user_mentions')
          .insert({
            source_id: options.sourceId,
            source_type: options.sourceType,
            source_content: options.sourceContent,
            mentioned_user_id: mentionedUser.userId,
            mentioned_user_name: mentionedUser.userName,
            mentioned_by_user_id: options.mentionedByUserId,
            mentioned_by_user_name: options.mentionedByUserName,
            position: mentionedUser.position,
            context: mentionedUser.context || this.extractContext(options.sourceContent, mentionedUser.position),
            status: 'pending' as MentionStatus,
            metadata: {
              originalText: this.extractOriginalText(options.sourceContent, mentionedUser.position),
              mentionType: this.detectMentionType(options.sourceContent, mentionedUser.position) as MentionType,
              urgency: options.urgency || 'medium' as MentionUrgency,
              category: options.category || 'info' as MentionCategory,
              tags: options.tags || [],
              relatedEntities: options.relatedEntities || [],
              contextInfo: options.contextInfo || this.buildContextInfo(options.sourceId, options.sourceType)
            }
          })
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error('Impossible de créer la mention');

        const mention = this.mapMentionFromDB(data);
        mentions.push(mention);

        // Créer la notification pour l'utilisateur mentionné
        await this.createMentionNotification(mention);
      }

      console.log(`✅ ${mentions.length} mentions créées avec succès`);
      return mentions;

    } catch (error) {
      console.error('❌ Erreur création mentions:', error);
      throw new Error(`Échec de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les mentions pour un utilisateur
   */
  async getUserMentions(
    userId: string,
    options: {
      status?: MentionStatus;
      sourceType?: MentionSourceType;
      limit?: number;
      offset?: number;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<UserMention[]> {
    try {
      let query = supabase
        .from('user_mentions')
        .select('*')
        .eq('mentioned_user_id', userId);

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.sourceType) {
        query = query.eq('source_type', options.sourceType);
      }

      if (options.dateFrom) {
        query = query.gte('created_at', options.dateFrom);
      }

      if (options.dateTo) {
        query = query.lte('created_at', options.dateTo);
      }

      query = query.order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(this.mapMentionFromDB);

    } catch (error) {
      console.error('❌ Erreur récupération mentions utilisateur:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Marque une mention comme lue
   */
  async markMentionAsRead(mentionId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_mentions')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', mentionId)
        .eq('mentioned_user_id', userId);

      if (error) throw error;

      // Marquer la notification correspondante comme lue
      await this.markNotificationAsRead(mentionId, userId);

      console.log('✅ Mention marquée comme lue:', mentionId);

    } catch (error) {
      console.error('❌ Erreur marquage mention lue:', error);
      throw new Error(`Échec du marquage: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Marque toutes les mentions d'un utilisateur comme lues
   */
  async markAllMentionsAsRead(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_mentions')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('mentioned_user_id', userId)
        .eq('status', 'pending')
        .select('id');

      if (error) throw error;

      const mentionIds = (data || []).map(m => m.id);
      
      // Marquer les notifications correspondantes comme lues
      if (mentionIds.length > 0) {
        await supabase
          .from('mention_notifications')
          .update({
            read: true,
            read_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .in('mention_id', mentionIds)
          .eq('read', false);
      }

      console.log(`✅ ${mentionIds.length} mentions marquées comme lues`);
      return mentionIds.length;

    } catch (error) {
      console.error('❌ Erreur marquage toutes mentions lues:', error);
      throw new Error(`Échec du marquage: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Recherche des suggestions d'utilisateurs pour les mentions
   */
  async searchMentionSuggestions(
    query: string,
    currentUserId: string,
    options: {
      limit?: number;
      includeInactive?: boolean;
      includeTeams?: boolean;
      includeRoles?: boolean;
      context?: string;
    } = {}
  ): Promise<MentionSuggestion[]> {
    try {
      const limit = options.limit || 10;
      
      // Rechercher des utilisateurs par nom ou username
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          avatar_url,
          is_active,
          last_seen,
          role,
          team,
          department
        `)
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('id', currentUserId)
        .eq(options.includeInactive ? 'is_active' : 'is_active', true)
        .limit(limit);

      if (usersError) throw usersError;

      // Calculer les scores de pertinence
      const suggestions: MentionSuggestion[] = (users || []).map(user => {
        const relevanceScore = this.calculateRelevanceScore(query, user, options.context);
        
        return {
          id: user.id,
          userName: user.username,
          displayName: user.display_name || user.username,
          avatar: user.avatar_url,
          role: user.role,
          team: user.team,
          department: user.department,
          isActive: user.is_active,
          lastActive: user.last_seen,
          mentionCount: 0, // À implémenter avec les statistiques
          relevanceScore,
          priority: relevanceScore > 0.8 ? 'high' : relevanceScore > 0.5 ? 'medium' : 'low'
        };
      });

      // Trier par pertinence et activité
      suggestions.sort((a, b) => {
        // D'abord par pertinence
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        
        // Ensuite par activité
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }
        
        // Enfin par dernier activité
        if (a.lastActive && b.lastActive) {
          return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
        }
        
        return 0;
      });

      return suggestions.slice(0, limit);

    } catch (error) {
      console.error('❌ Erreur recherche suggestions mentions:', error);
      throw new Error(`Échec de la recherche: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les notifications de mentions
   */
  async getMentionNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<MentionNotification[]> {
    try {
      let query = supabase
        .from('mention_notifications')
        .select('*')
        .eq('user_id', userId);

      if (options.unreadOnly) {
        query = query.eq('read', false);
      }

      query = query.order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(this.mapNotificationFromDB);

    } catch (error) {
      console.error('❌ Erreur récupération notifications mentions:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Obtient les statistiques des mentions
   */
  async getMentionStats(userId: string): Promise<MentionStats> {
    try {
      const { data, error } = await supabase.rpc('get_mention_stats', { p_user_id: userId });

      if (error) throw error;

      const stats = data || {
        total_mentions: 0,
        mentions_received: 0,
        mentions_sent: 0,
        unread_mentions: 0,
        mentions_by_type: {},
        mentions_by_category: {},
        top_mentioners: [],
        recent_mentions: [],
        mention_trends: [],
        response_rate: 0,
        avg_response_time: 0
      };

      return {
        totalMentions: stats.total_mentions,
        mentionsReceived: stats.mentions_received,
        mentionsSent: stats.mentions_sent,
        unreadMentions: stats.unread_mentions,
        mentionsByType: stats.mentions_by_type,
        mentionsByCategory: stats.mentions_by_category,
        topMentioners: stats.top_mentioners,
        recentMentions: (stats.recent_mentions || []).map(this.mapMentionFromDB),
        mentionTrends: stats.mention_trends,
        responseRate: stats.response_rate,
        avgResponseTime: stats.avg_response_time
      };

    } catch (error) {
      console.error('❌ Erreur statistiques mentions:', error);
      throw new Error(`Échec des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Extrait les mentions d'un texte
   */
  extractMentionsFromText(text: string): Array<{
    position: number;
    length: number;
    text: string;
    userName: string;
  }> {
    const mentions: Array<{
      position: number;
      length: number;
      text: string;
      userName: string;
    }> = [];

    const mentionRegex = /@(\w+(?:\.\w+)*)/g;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push({
        position: match.index,
        length: match[0].length,
        text: match[0],
        userName: match[1]
      });
    }

    return mentions;
  }

  /**
   * Crée une notification pour une mention
   */
  private async createMentionNotification(mention: UserMention): Promise<void> {
    try {
      const notification: Partial<MentionNotification> = {
        userId: mention.mentionedUserId,
        mentionId: mention.id,
        type: 'mention' as NotificationType,
        title: `${mention.mentionedByUserName} vous a mentionné`,
        content: this.buildNotificationContent(mention),
        data: {
          mentionId: mention.id,
          sourceId: mention.sourceId,
          sourceType: mention.sourceType,
          mentionedBy: mention.mentionedByUserName,
          context: mention.context,
          actionUrl: this.buildActionUrl(mention),
          preview: mention.metadata.originalText
        },
        read: false,
        createdAt: new Date().toISOString(),
        priority: this.mapUrgencyToPriority(mention.metadata.urgency) as NotificationPriority,
        channels: ['in_app', 'push'] as NotificationChannel[],
        metadata: {
          deliveryAttempts: 0,
          deliveryStatus: 'pending' as DeliveryStatus,
          retryCount: 0,
          maxRetries: 3
        }
      };

      const { error } = await supabase
        .from('mention_notifications')
        .insert(notification);

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur création notification mention:', error);
    }
  }

  /**
   * Marque une notification comme lue
   */
  private async markNotificationAsRead(mentionId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('mention_notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('mention_id', mentionId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('❌ Erreur marquage notification lue:', error);
    }
  }

  /**
   * Extrait le contexte autour d'une mention
   */
  private extractContext(content: string, position: number, contextLength: number = 100): string {
    const start = Math.max(0, position - contextLength);
    const end = Math.min(content.length, position + contextLength);
    return content.substring(start, end);
  }

  /**
   * Extrait le texte original d'une mention
   */
  private extractOriginalText(content: string, position: number, maxLength: number = 50): string {
    const mentionMatch = content.substring(position).match(/^@\w+/);
    if (!mentionMatch) return '';
    
    const fullMention = mentionMatch[0];
    // Ajouter quelques mots après la mention pour le contexte
    const afterMention = content.substring(position + fullMention.length, position + maxLength);
    return fullMention + afterMention;
  }

  /**
   * Détecte le type de mention
   */
  private detectMentionType(content: string, position: number): MentionType {
    const mentionText = content.substring(position);
    
    if (mentionText.startsWith('@everyone')) return 'everyone';
    if (mentionText.startsWith('@team')) return 'team';
    if (mentionText.startsWith('@role:')) return 'role';
    if (mentionText.startsWith('@channel:')) return 'channel';
    
    return 'direct';
  }

  /**
   * Construit les informations de contexte
   */
  private buildContextInfo(sourceId: string, sourceType: MentionSourceType): ContextInfo {
    // À implémenter selon le type de source
    return {
      title: `Source ${sourceType}`,
      description: '',
      url: `/${sourceType}/${sourceId}`,
      excerpt: '',
      location: `${sourceType}:${sourceId}`
    };
  }

  /**
   * Calcule le score de pertinence pour les suggestions
   */
  private calculateRelevanceScore(
    query: string,
    user: any,
    context?: string
  ): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    const userName = (user.display_name || user.username || '').toLowerCase();
    const username = (user.username || '').toLowerCase();

    // Score de base pour la correspondance exacte
    if (username === queryLower || userName === queryLower) {
      score += 1.0;
    }

    // Score pour la correspondance partielle
    if (username.includes(queryLower) || userName.includes(queryLower)) {
      score += 0.8;
    }

    // Score pour la correspondance de préfixe
    if (username.startsWith(queryLower) || userName.startsWith(queryLower)) {
      score += 0.6;
    }

    // Bonus pour les utilisateurs actifs
    if (user.is_active) {
      score += 0.2;
    }

    // Bonus pour l'activité récente
    if (user.last_seen && new Date(user.last_seen) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      score += 0.1;
    }

    // Bonus pour le même département/équipe (si disponible)
    if (context && (user.team === context || user.department === context)) {
      score += 0.15;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Construit le contenu de la notification
   */
  private buildNotificationContent(mention: UserMention): string {
    const sourceTypeMap = {
      comment: 'dans un commentaire',
      note: 'dans une note',
      conversation: 'dans une conversation',
      chat_message: 'dans un message',
      document_share: 'dans un partage de document',
      task_assignment: 'dans une assignation de tâche',
      announcement: 'dans une annonce'
    };

    const location = sourceTypeMap[mention.sourceType] || 'dans un contenu';
    return `${mention.mentionedByUserName} vous a mentionné ${location}: "${mention.context}"`;
  }

  /**
   * Construit l'URL d'action pour la notification
   */
  private buildActionUrl(mention: UserMention): string {
    const baseUrl = window.location.origin;
    const typeRoutes = {
      comment: '/comments',
      note: '/notes',
      conversation: '/conversations',
      chat_message: '/chat',
      document_share: '/documents',
      task_assignment: '/tasks',
      announcement: '/announcements'
    };

    const route = typeRoutes[mention.sourceType] || '/';
    return `${baseUrl}${route}/${mention.sourceId}`;
  }

  /**
   * Map l'urgence vers la priorité de notification
   */
  private mapUrgencyToPriority(urgency: MentionUrgency): NotificationPriority {
    const mapping: Record<MentionUrgency, NotificationPriority> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      urgent: 'urgent'
    };
    return mapping[urgency];
  }

  /**
   * Mappe une mention depuis la base de données
   */
  private mapMentionFromDB(data: any): UserMention {
    return {
      id: data.id,
      sourceId: data.source_id,
      sourceType: data.source_type,
      sourceContent: data.source_content,
      mentionedUserId: data.mentioned_user_id,
      mentionedUserName: data.mentioned_user_name,
      mentionedByUserId: data.mentioned_by_user_id,
      mentionedByUserName: data.mentioned_by_user_name,
      position: data.position,
      context: data.context,
      status: data.status,
      readAt: data.read_at,
      createdAt: data.created_at,
      metadata: data.metadata || {}
    };
  }

  /**
   * Mappe une notification depuis la base de données
   */
  private mapNotificationFromDB(data: any): MentionNotification {
    return {
      id: data.id,
      userId: data.user_id,
      mentionId: data.mention_id,
      type: data.type,
      title: data.title,
      content: data.content,
      data: data.data || {},
      read: data.read,
      readAt: data.read_at,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      priority: data.priority,
      channels: data.channels || [],
      metadata: data.metadata || {}
    };
  }
}

// Instance singleton
export const userMentionsService = new UserMentionsService();

// Export des fonctions utilitaires
export const createMentions = (options: MentionOptions) => 
  userMentionsService.createMentions(options);

export const getUserMentions = (
  userId: string,
  options?: {
    status?: MentionStatus;
    sourceType?: MentionSourceType;
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }
) => userMentionsService.getUserMentions(userId, options);

export const markMentionAsRead = (mentionId: string, userId: string) => 
  userMentionsService.markMentionAsRead(mentionId, userId);

export const markAllMentionsAsRead = (userId: string) => 
  userMentionsService.markAllMentionsAsRead(userId);

export const searchMentionSuggestions = (
  query: string,
  currentUserId: string,
  options?: {
    limit?: number;
    includeInactive?: boolean;
    includeTeams?: boolean;
    includeRoles?: boolean;
    context?: string;
  }
) => userMentionsService.searchMentionSuggestions(query, currentUserId, options);

export const getMentionNotifications = (
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }
) => userMentionsService.getMentionNotifications(userId, options);

export const getMentionStats = (userId: string) => 
  userMentionsService.getMentionStats(userId);
