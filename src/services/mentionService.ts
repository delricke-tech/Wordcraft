/**
 * Service de gestion des mentions @utilisateur
 * 
 * Ce service gère la recherche d'utilisateurs, la création de mentions
 * et les notifications associées
 * 
 * Date: 12 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface MentionUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  isOnline: boolean;
  isTeam: boolean;
  isFollowed: boolean;
  lastActive?: string;
}

export interface MentionNotification {
  id: string;
  mentionedUserId: string;
  mentionedByUserId: string;
  mentionedByUserName: string;
  mentionedByUserAvatar?: string;
  context: 'comment' | 'document' | 'note' | 'conversation' | 'flashcard' | 'quiz';
  targetId?: string;
  targetTitle?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface CreateMentionData {
  mentionedUserId: string;
  mentionedByUserId: string;
  context: 'comment' | 'document' | 'note' | 'conversation' | 'flashcard' | 'quiz';
  targetId?: string;
  targetTitle?: string;
  content: string;
}

export interface MentionOptions {
  query?: string;
  limit?: number;
  excludeIds?: string[];
  includeTeams?: boolean;
  activeOnly?: boolean;
  role?: string;
}

class MentionService {
  // Rechercher des utilisateurs pour les suggestions
  async searchUsers(options: MentionOptions = {}): Promise<MentionUser[]> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          avatar_url,
          role,
          last_active,
          online_status,
          teams!user_teams(user_id, team_id, role)
        `)
        .limit(options.limit || 10);

      // Exclure les IDs spécifiés
      if (options.excludeIds && options.excludeIds.length > 0) {
        query = query.not('id', 'in', `(${options.excludeIds.join(',')})`);
      }

      // Filtrer par rôle
      if (options.role) {
        query = query.eq('role', options.role);
      }

      // Filtrer les utilisateurs actifs uniquement
      if (options.activeOnly) {
        query = query.eq('online_status', true);
      }

      // Rechercher par nom ou email
      if (options.query && options.query.trim()) {
        query = query.or(`name.ilike.%${options.query}%,email.ilike.%${options.query}%`);
      }

      // Trier par pertinence
      if (options.query) {
        query = query.order('name', { ascending: true });
      } else {
        query = query.order('last_active', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transformer les données
      const users: MentionUser[] = (data || []).map(user => ({
        id: user.id,
        name: user.name || 'Utilisateur',
        email: user.email || '',
        avatar: user.avatar_url,
        role: user.role,
        isOnline: user.online_status || false,
        isTeam: false, // Sera géré séparément si includeTeams est true
        isFollowed: false, // TODO: Implémenter la logique de suivi
        lastActive: user.last_active
      }));

      // Inclure les équipes si demandé
      if (options.includeTeams) {
        const teams = await this.searchTeams(options);
        users.push(...teams);
      }

      return users;

    } catch (error) {
      console.error('❌ Erreur recherche utilisateurs:', error);
      return [];
    }
  }

  // Rechercher des équipes (si includeTeams est true)
  private async searchTeams(options: MentionOptions): Promise<MentionUser[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          avatar_url,
          created_at
        `)
        .limit(Math.floor((options.limit || 10) / 2));

      if (error) throw error;

      return (data || []).map(team => ({
        id: team.id,
        name: team.name,
        email: `team-${team.id}@wordcraft.local`,
        avatar: team.avatar_url,
        role: 'team',
        isOnline: true,
        isTeam: true,
        isFollowed: false,
        lastActive: team.created_at
      }));

    } catch (error) {
      console.error('❌ Erreur recherche équipes:', error);
      return [];
    }
  }

  // Créer une mention
  async createMention(data: CreateMentionData): Promise<void> {
    try {
      // Vérifier si la mention existe déjà
      const { data: existing } = await supabase
        .from('user_mentions')
        .select('id')
        .eq('mentioned_user_id', data.mentionedUserId)
        .eq('mentioned_by_user_id', data.mentionedByUserId)
        .eq('context', data.context)
        .eq('target_id', data.targetId || null)
        .single();

      if (existing) {
        console.log('📝 Mention déjà existante');
        return;
      }

      // Créer la mention
      const { error: mentionError } = await supabase
        .from('user_mentions')
        .insert({
          mentioned_user_id: data.mentionedUserId,
          mentioned_by_user_id: data.mentionedByUserId,
          context: data.context,
          target_id: data.targetId || null,
          target_title: data.targetTitle || null,
          content: data.content,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (mentionError) throw mentionError;

      // Créer une notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: data.mentionedUserId,
          type: 'mention',
          title: 'Nouvelle mention',
          message: `Quelqu'un vous a mentionné`,
          data: {
            mentionedByUserId: data.mentionedByUserId,
            context: data.context,
            targetId: data.targetId,
            targetTitle: data.targetTitle,
            content: data.content
          },
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (notificationError) throw notificationError;

      console.log('✅ Mention créée avec succès');

    } catch (error) {
      console.error('❌ Erreur création mention:', error);
      throw error;
    }
  }

  // Récupérer les notifications de mentions d'un utilisateur
  async getMentionNotifications(
    userId: string, 
    options: { unread?: boolean; limit?: number } = {}
  ): Promise<MentionNotification[]> {
    try {
      let query = supabase
        .from('user_mentions')
        .select(`
          id,
          mentioned_user_id,
          mentioned_by_user_id,
          profiles!user_mentions_mentioned_by_user_id_fkey (
            name,
            avatar_url
          ),
          context,
          target_id,
          target_title,
          content,
          is_read,
          created_at,
          read_at
        `)
        .eq('mentioned_user_id', userId)
        .order('created_at', { ascending: false });

      // Filtrer par statut de lecture
      if (options.unread) {
        query = query.eq('is_read', false);
      }

      // Limiter le nombre de résultats
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(mention => ({
        id: mention.id,
        mentionedUserId: mention.mentioned_user_id,
        mentionedByUserId: mention.mentioned_by_user_id,
        mentionedByUserName: mention.profiles?.name || 'Utilisateur',
        mentionedByUserAvatar: mention.profiles?.avatar_url,
        context: mention.context as any,
        targetId: mention.target_id,
        targetTitle: mention.target_title,
        content: mention.content,
        isRead: mention.is_read,
        createdAt: mention.created_at,
        readAt: mention.read_at
      }));

    } catch (error) {
      console.error('❌ Erreur récupération notifications mentions:', error);
      return [];
    }
  }

  // Marquer une mention comme lue
  async markMentionAsRead(mentionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_mentions')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', mentionId);

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur marquage mention lue:', error);
      throw error;
    }
  }

  // Marquer toutes les mentions d'un utilisateur comme lues
  async markAllMentionsAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_mentions')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('mentioned_user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur marquage toutes mentions lues:', error);
      throw error;
    }
  }

  // Supprimer une mention
  async deleteMention(mentionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_mentions')
        .delete()
        .eq('id', mentionId);

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur suppression mention:', error);
      throw error;
    }
  }

  // Obtenir les statistiques de mentions d'un utilisateur
  async getMentionStats(userId: string): Promise<{
    total: number;
    unread: number;
    byContext: Record<string, number>;
    recentActivity: Array<{date: string, count: number}>;
  }> {
    try {
      // Récupérer toutes les mentions
      const { data: mentions, error } = await supabase
        .from('user_mentions')
        .select('context, is_read, created_at')
        .eq('mentioned_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const total = mentions?.length || 0;
      const unread = mentions?.filter(m => !m.is_read).length || 0;

      // Grouper par contexte
      const byContext: Record<string, number> = {};
      mentions?.forEach(mention => {
        byContext[mention.context] = (byContext[mention.context] || 0) + 1;
      });

      // Activité récente (derniers 7 jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivity: Record<string, number> = {};
      mentions?.forEach(mention => {
        const date = new Date(mention.created_at).toLocaleDateString('fr-FR');
        if (new Date(mention.created_at) >= sevenDaysAgo) {
          recentActivity[date] = (recentActivity[date] || 0) + 1;
        }
      });

      const recentActivityArray = Object.entries(recentActivity)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 7);

      return {
        total,
        unread,
        byContext,
        recentActivity: recentActivityArray
      };

    } catch (error) {
      console.error('❌ Erreur statistiques mentions:', error);
      return {
        total: 0,
        unread: 0,
        byContext: {},
        recentActivity: []
      };
    }
  }

  // Obtenir les utilisateurs les plus mentionnés
  async getMostMentionedUsers(limit: number = 10): Promise<Array<{
    userId: string;
    userName: string;
    mentionCount: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('user_mentions')
        .select(`
          mentioned_user_id,
          profiles!user_mentions_mentioned_user_id_fkey (
            name
          )
        `)
        .group('mentioned_user_id')
        .order('count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        userId: item.mentioned_user_id,
        userName: item.profiles?.name || 'Utilisateur',
        mentionCount: parseInt(item.count as string) || 0
      }));

    } catch (error) {
      console.error('❌ Erreur utilisateurs les plus mentionnés:', error);
      return [];
    }
  }

  // Mettre à jour le statut en ligne d'un utilisateur
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          online_status: isOnline,
          last_active: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur mise à jour statut en ligne:', error);
    }
  }
}

export const mentionService = new MentionService();

// Fonctions utilitaires pour l'export
export const searchUsers = mentionService.searchUsers.bind(mentionService);
export const createMention = mentionService.createMention.bind(mentionService);
export const getMentionNotifications = mentionService.getMentionNotifications.bind(mentionService);
export const markMentionAsRead = mentionService.markMentionAsRead.bind(mentionService);
export const markAllMentionsAsRead = mentionService.markAllMentionsAsRead.bind(mentionService);
export const deleteMention = mentionService.deleteMention.bind(mentionService);
export const getMentionStats = mentionService.getMentionStats.bind(mentionService);
export const getMostMentionedUsers = mentionService.getMostMentionedUsers.bind(mentionService);
export const updateOnlineStatus = mentionService.updateOnlineStatus.bind(mentionService);
