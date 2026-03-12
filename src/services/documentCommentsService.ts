/**
 * Service de commentaires sur documents (threads imbriqués)
 * 
 * Ce service permet de gérer les commentaires avec threads imbriqués,
 * réponses, mentions et notifications sur tous les types de contenus
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface DocumentComment {
  id: string;
  targetId: string;
  targetType: 'document' | 'note' | 'conversation' | 'flashcard' | 'quiz' | 'collaboration_session';
  content: string;
  position?: CommentPosition;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: string;
  threadId?: string;
  parentId?: string;
  mentions: CommentMention[];
  reactions: CommentReaction[];
  status: CommentStatus;
  priority: CommentPriority;
  tags: string[];
  metadata: CommentMetadata;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  replyCount: number;
  isEdited: boolean;
  editedAt?: string;
}

export interface CommentPosition {
  page?: number;
  line?: number;
  column?: number;
  length?: number;
  selectedText?: string;
  context?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface CommentMention {
  id: string;
  userId: string;
  userName: string;
  position: number; // position dans le texte
  type: 'user' | 'team' | 'role';
  notified: boolean;
  notifiedAt?: string;
}

export interface CommentReaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export type CommentStatus = 'active' | 'resolved' | 'archived' | 'deleted';
export type CommentPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CommentMetadata {
  wordCount?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  language?: string;
  category?: string;
  tags?: string[];
  attachments?: CommentAttachment[];
  links?: CommentLink[];
}

export interface CommentAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface CommentLink {
  id: string;
  url: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  favicon?: string;
  domain: string;
}

export interface CommentThread {
  id: string;
  rootComment: DocumentComment;
  replies: DocumentComment[];
  totalReplies: number;
  lastReplyAt?: string;
  lastReplyBy?: string;
  participants: string[];
  status: CommentStatus;
  priority: CommentPriority;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface CommentOptions {
  targetId: string;
  targetType: 'document' | 'note' | 'conversation' | 'flashcard' | 'quiz' | 'collaboration_session';
  threadId?: string;
  parentId?: string;
  position?: CommentPosition;
  priority?: CommentPriority;
  tags?: string[];
  mentions?: CommentMention[];
  attachments?: CommentAttachment[];
}

export interface CommentStats {
  totalComments: number;
  totalThreads: number;
  resolvedComments: number;
  pendingComments: number;
  commentsByType: Record<string, number>;
  commentsByPriority: Record<CommentPriority, number>;
  topCommenters: Array<{ userId: string; userName: string; count: number }>;
  recentActivity: Array<{ commentId: string; action: string; timestamp: string; userName: string }>;
  tagDistribution: Record<string, number>;
}

class DocumentCommentsService {
  /**
   * Ajoute un commentaire à un document
   */
  async addComment(
    content: string,
    authorId: string,
    authorName: string,
    authorAvatar: string | undefined,
    options: CommentOptions
  ): Promise<DocumentComment> {
    try {
      // Extraire les mentions du contenu
      const mentions = this.extractMentions(content);
      
      // Analyser le contenu pour les métadonnées
      const metadata = this.analyzeContent(content);

      const { data, error } = await supabase
        .from('document_comments')
        .insert({
          target_id: options.targetId,
          target_type: options.targetType,
          content,
          position: options.position,
          author_id: authorId,
          author_name: authorName,
          author_avatar: authorAvatar,
          thread_id: options.threadId,
          parent_id: options.parentId,
          mentions,
          reactions: [],
          status: 'active',
          priority: options.priority || 'medium',
          tags: options.tags || [],
          metadata,
          reply_count: 0,
          is_edited: false
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible d\'ajouter le commentaire');

      // Mettre à jour le compteur de réponses du parent
      if (options.parentId) {
        await this.incrementReplyCount(options.parentId);
      }

      // Envoyer les notifications pour les mentions
      await this.sendMentionNotifications(mentions, data.id, authorId);

      console.log('✅ Commentaire ajouté:', data.id);
      return this.mapCommentFromDB(data);

    } catch (error) {
      console.error('❌ Erreur ajout commentaire:', error);
      throw new Error(`Échec de l'ajout: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les commentaires d'un document
   */
  async getDocumentComments(
    targetId: string,
    targetType: string,
    options: {
      includeReplies?: boolean;
      status?: CommentStatus;
      threadId?: string;
      sortBy?: 'created_at' | 'updated_at' | 'priority' | 'reply_count';
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<DocumentComment[]> {
    try {
      let query = supabase
        .from('document_comments')
        .select('*')
        .eq('target_id', targetId)
        .eq('target_type', targetType)
        .eq('deleted_at', null);

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.threadId) {
        query = query.eq('thread_id', options.threadId);
      } else {
        query = query.is('parent_id', 'null');
      }

      // Appliquer le tri
      const sortBy = options.sortBy || 'created_at';
      const sortOrder = options.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Appliquer la pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      let comments = (data || []).map(this.mapCommentFromDB);

      // Inclure les réponses si demandé
      if (options.includeReplies && comments.length > 0) {
        const commentIds = comments.map(c => c.id);
        const { data: replies } = await supabase
          .from('document_comments')
          .select('*')
          .in('parent_id', commentIds)
          .eq('deleted_at', null)
          .order('created_at', { ascending: true });

        if (replies) {
          const repliesMap = replies.reduce((map, reply) => {
            const parentId = reply.parent_id;
            if (!map[parentId]) map[parentId] = [];
            map[parentId].push(this.mapCommentFromDB(reply));
            return map;
          }, {} as Record<string, DocumentComment[]>);

          comments = comments.map(comment => ({
            ...comment,
            replies: repliesMap[comment.id] || []
          }));
        }
      }

      return comments;

    } catch (error) {
      console.error('❌ Erreur récupération commentaires:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les threads de commentaires d'un document
   */
  async getCommentThreads(
    targetId: string,
    targetType: string,
    options: {
      status?: CommentStatus;
      priority?: CommentPriority;
      tags?: string[];
      sortBy?: 'created_at' | 'updated_at' | 'reply_count' | 'priority';
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<CommentThread[]> {
    try {
      // Récupérer les commentaires racines (sans parent)
      const rootComments = await this.getDocumentComments(targetId, targetType, {
        status: options.status,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
        limit: options.limit,
        offset: options.offset
      });

      // Filtrer par priorité et tags si spécifié
      let filteredComments = rootComments;
      
      if (options.priority) {
        filteredComments = filteredComments.filter(c => c.priority === options.priority);
      }

      if (options.tags && options.tags.length > 0) {
        filteredComments = filteredComments.filter(c => 
          options.tags!.some(tag => c.tags.includes(tag))
        );
      }

      // Récupérer les réponses pour chaque thread
      const threads: CommentThread[] = [];
      
      for (const rootComment of filteredComments) {
        const replies = await this.getDocumentComments(targetId, targetType, {
          threadId: rootComment.id,
          includeReplies: true
        });

        const allReplies = replies.reduce((acc: DocumentComment[], comment) => {
          return [...acc, comment, ...(comment.replies || [])];
        }, []);

        threads.push({
          id: rootComment.id,
          rootComment,
          replies: allReplies,
          totalReplies: allReplies.length,
          lastReplyAt: allReplies.length > 0 ? allReplies[allReplies.length - 1].createdAt : undefined,
          lastReplyBy: allReplies.length > 0 ? allReplies[allReplies.length - 1].authorName : undefined,
          participants: [rootComment.authorId, ...allReplies.map(r => r.authorId)],
          status: rootComment.status,
          priority: rootComment.priority,
          tags: rootComment.tags,
          createdAt: rootComment.createdAt,
          updatedAt: rootComment.updatedAt,
          resolvedAt: rootComment.resolvedAt,
          resolvedBy: rootComment.resolvedBy
        });
      }

      return threads;

    } catch (error) {
      console.error('❌ Erreur récupération threads:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour un commentaire
   */
  async updateComment(
    commentId: string,
    updates: {
      content?: string;
      status?: CommentStatus;
      priority?: CommentPriority;
      tags?: string[];
      position?: CommentPosition;
    },
    authorId: string
  ): Promise<DocumentComment> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
        is_edited: true,
        edited_at: new Date().toISOString()
      };

      // Extraire les nouvelles mentions si le contenu est mis à jour
      if (updates.content) {
        updateData.mentions = this.extractMentions(updates.content);
        updateData.metadata = this.analyzeContent(updates.content);
      }

      const { data, error } = await supabase
        .from('document_comments')
        .update(updateData)
        .eq('id', commentId)
        .eq('author_id', authorId) // Seul l'auteur peut modifier
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Commentaire non trouvé ou permissions insuffisantes');

      console.log('✅ Commentaire mis à jour:', commentId);
      return this.mapCommentFromDB(data);

    } catch (error) {
      console.error('❌ Erreur mise à jour commentaire:', error);
      throw new Error(`Échec de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Résout un commentaire
   */
  async resolveComment(
    commentId: string,
    resolvedBy: string,
    resolutionNote?: string
  ): Promise<DocumentComment> {
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Commentaire non trouvé');

      console.log('✅ Commentaire résolu:', commentId);
      return this.mapCommentFromDB(data);

    } catch (error) {
      console.error('❌ Erreur résolution commentaire:', error);
      throw new Error(`Échec de la résolution: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Supprime un commentaire
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('document_comments')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('author_id', userId); // Seul l'auteur peut supprimer

      if (error) throw error;

      console.log('✅ Commentaire supprimé:', commentId);

    } catch (error) {
      console.error('❌ Erreur suppression commentaire:', error);
      throw new Error(`Échec de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Ajoute une réaction à un commentaire
   */
  async addReaction(
    commentId: string,
    emoji: string,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      // Vérifier si l'utilisateur a déjà réagi avec cet emoji
      const { data: existingReactions } = await supabase
        .from('document_comments')
        .select('reactions')
        .eq('id', commentId)
        .single();

      if (!existingReactions) throw new Error('Commentaire non trouvé');

      const reactions = existingReactions.reactions || [];
      const existingReaction = reactions.find(r => r.emoji === emoji && r.userId === userId);

      if (existingReaction) {
        // Supprimer la réaction existante
        const updatedReactions = reactions.filter(r => !(r.emoji === emoji && r.userId === userId));
        
        await supabase
          .from('document_comments')
          .update({ reactions: updatedReactions, updated_at: new Date().toISOString() })
          .eq('id', commentId);
      } else {
        // Ajouter la nouvelle réaction
        const newReaction = {
          id: `reaction_${Date.now()}_${userId}`,
          emoji,
          userId,
          userName,
          createdAt: new Date().toISOString()
        };

        await supabase
          .from('document_comments')
          .update({ 
            reactions: [...reactions, newReaction], 
            updated_at: new Date().toISOString() 
          })
          .eq('id', commentId);
      }

      console.log('✅ Réaction ajoutée/supprimée:', emoji);

    } catch (error) {
      console.error('❌ Erreur réaction commentaire:', error);
      throw new Error(`Échec de la réaction: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Recherche des commentaires
   */
  async searchComments(
    query: string,
    targetId?: string,
    targetType?: string,
    options: {
      authorId?: string;
      status?: CommentStatus;
      priority?: CommentPriority;
      tags?: string[];
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    } = {}
  ): Promise<DocumentComment[]> {
    try {
      let dbQuery = supabase
        .from('document_comments')
        .select('*')
        .eq('deleted_at', null)
        .ilike('content', `%${query}%`);

      if (targetId && targetType) {
        dbQuery = dbQuery.eq('target_id', targetId).eq('target_type', targetType);
      }

      if (options.authorId) {
        dbQuery = dbQuery.eq('author_id', options.authorId);
      }

      if (options.status) {
        dbQuery = dbQuery.eq('status', options.status);
      }

      if (options.priority) {
        dbQuery = dbQuery.eq('priority', options.priority);
      }

      if (options.dateFrom) {
        dbQuery = dbQuery.gte('created_at', options.dateFrom);
      }

      if (options.dateTo) {
        dbQuery = dbQuery.lte('created_at', options.dateTo);
      }

      if (options.limit) {
        dbQuery = dbQuery.limit(options.limit);
      }

      dbQuery = dbQuery.order('created_at', { ascending: false });

      const { data, error } = await dbQuery;

      if (error) throw error;
      return (data || []).map(this.mapCommentFromDB);

    } catch (error) {
      console.error('❌ Erreur recherche commentaires:', error);
      throw new Error(`Échec de la recherche: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Obtient les statistiques des commentaires
   */
  async getCommentStats(
    targetId?: string,
    targetType?: string
  ): Promise<CommentStats> {
    try {
      let query = supabase
        .from('document_comments')
        .select('*')
        .eq('deleted_at', null);

      if (targetId && targetType) {
        query = query.eq('target_id', targetId).eq('target_type', targetType);
      }

      const { data, error } = await query;

      if (error) throw error;
      const comments = data || [];

      // Calculer les statistiques
      const stats: CommentStats = {
        totalComments: comments.length,
        totalThreads: comments.filter(c => !c.parentId).length,
        resolvedComments: comments.filter(c => c.status === 'resolved').length,
        pendingComments: comments.filter(c => c.status === 'active').length,
        commentsByType: {},
        commentsByPriority: {
          low: comments.filter(c => c.priority === 'low').length,
          medium: comments.filter(c => c.priority === 'medium').length,
          high: comments.filter(c => c.priority === 'high').length,
          urgent: comments.filter(c => c.priority === 'urgent').length
        },
        topCommenters: this.getTopCommenters(comments),
        recentActivity: this.getRecentActivity(comments),
        tagDistribution: this.getTagDistribution(comments)
      };

      return stats;

    } catch (error) {
      console.error('❌ Erreur statistiques commentaires:', error);
      throw new Error(`Échec des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Exporte les commentaires au format JSON
   */
  async exportComments(
    targetId: string,
    targetType: string,
    options: {
      includeReplies?: boolean;
      status?: CommentStatus;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<string> {
    try {
      const comments = await this.getDocumentComments(targetId, targetType, {
        includeReplies: options.includeReplies,
        status: options.status,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo
      });

      const exportData = {
        targetId,
        targetType,
        comments,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      return JSON.stringify(exportData, null, 2);

    } catch (error) {
      console.error('❌ Erreur export commentaires:', error);
      throw new Error(`Échec de l'export: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Extrait les mentions d'un texte
   */
  private extractMentions(content: string): CommentMention[] {
    const mentions: CommentMention[] = [];
    const mentionRegex = /@(\w+(?:\.\w+)*)/g;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push({
        id: `mention_${Date.now()}_${match.index}`,
        userId: match[1], // À remplacer par l'ID réel de l'utilisateur
        userName: match[1],
        position: match.index,
        type: 'user',
        notified: false
      });
    }

    return mentions;
  }

  /**
   * Analyse le contenu d'un commentaire
   */
  private analyzeContent(content: string): CommentMetadata {
    return {
      wordCount: content.split(/\s+/).length,
      sentiment: this.detectSentiment(content),
      language: 'fr', // À implémenter avec une vraie détection
      category: this.categorizeContent(content),
      tags: this.extractTags(content),
      attachments: [],
      links: this.extractLinks(content)
    };
  }

  /**
   * Détecte le sentiment d'un texte
   */
  private detectSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['excellent', 'super', 'génial', 'parfait', 'bien', 'bon', 'merveilleux'];
    const negativeWords = ['mauvais', 'horrible', 'terrible', 'problème', 'erreur', 'bug', 'échec'];
    
    const lowerContent = content.toLowerCase();
    
    if (positiveWords.some(word => lowerContent.includes(word))) {
      return 'positive';
    } else if (negativeWords.some(word => lowerContent.includes(word))) {
      return 'negative';
    }
    
    return 'neutral';
  }

  /**
   * Catégorise le contenu
   */
  private categorizeContent(content: string): string {
    const categories = {
      'question': /\?/,
      'suggestion': /(suggestion|proposition|idée)/i,
      'bug': /(bug|erreur|problème|issue)/i,
      'feedback': /(feedback|avis|retour)/i,
      'praise': /(bravo|excellent|super|bien)/i
    };

    for (const [category, regex] of Object.entries(categories)) {
      if (regex.test(content)) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Extrait les hashtags du contenu
   */
  private extractTags(content: string): string[] {
    const tagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }

    return tags;
  }

  /**
   * Extrait les liens du contenu
   */
  private extractLinks(content: string): CommentLink[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links: CommentLink[] = [];
    let match;

    while ((match = urlRegex.exec(content)) !== null) {
      try {
        const url = new URL(match[0]);
        links.push({
          id: `link_${Date.now()}_${links.length}`,
          url: match[0],
          title: url.hostname,
          domain: url.hostname,
          favicon: `https://www.google.com/s2/favicons?domain=${url.hostname}`
        });
      } catch (e) {
        // Ignorer les URLs invalides
      }
    }

    return links;
  }

  /**
   * Incrémente le compteur de réponses
   */
  private async incrementReplyCount(parentId: string): Promise<void> {
    try {
      await supabase.rpc('increment_comment_reply_count', { parent_comment_id: parentId });
    } catch (error) {
      console.error('❌ Erreur incrémentation réponses:', error);
    }
  }

  /**
   * Envoie les notifications pour les mentions
   */
  private async sendMentionNotifications(mentions: CommentMention[], commentId: string, authorId: string): Promise<void> {
    try {
      for (const mention of mentions) {
        // Créer une notification pour chaque mention
        await supabase
          .from('notifications')
          .insert({
            user_id: mention.userId,
            type: 'comment_mention',
            title: 'Vous avez été mentionné',
            content: `Vous avez été mentionné dans un commentaire`,
            data: {
              commentId,
              mentionId: mention.id,
              mentionedBy: authorId
            },
            read: false,
            created_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('❌ Erreur notifications mentions:', error);
    }
  }

  /**
   * Obtient les meilleurs commenteurs
   */
  private getTopCommenters(comments: any[]): Array<{ userId: string; userName: string; count: number }> {
    const commenterCounts = comments.reduce((acc, comment) => {
      const key = comment.author_id;
      if (!acc[key]) {
        acc[key] = { userId: key, userName: comment.author_name, count: 0 };
      }
      acc[key].count++;
      return acc;
    }, {} as Record<string, { userId: string; userName: string; count: number }>);

    return Object.values(commenterCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Obtient l'activité récente
   */
  private getRecentActivity(comments: any[]): Array<{ commentId: string; action: string; timestamp: string; userName: string }> {
    return comments
      .slice(0, 10)
      .map(comment => ({
        commentId: comment.id,
        action: comment.status === 'resolved' ? 'resolved' : 'commented',
        timestamp: comment.updated_at,
        userName: comment.author_name
      }));
  }

  /**
   * Obtient la distribution des tags
   */
  private getTagDistribution(comments: any[]): Record<string, number> {
    const tagCounts: Record<string, number> = {};
    
    comments.forEach(comment => {
      if (comment.tags && Array.isArray(comment.tags)) {
        comment.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return tagCounts;
  }

  /**
   * Mappe un commentaire depuis la base de données
   */
  private mapCommentFromDB(data: any): DocumentComment {
    return {
      id: data.id,
      targetId: data.target_id,
      targetType: data.target_type,
      content: data.content,
      position: data.position,
      authorId: data.author_id,
      authorName: data.author_name,
      authorAvatar: data.author_avatar,
      authorRole: data.author_role,
      threadId: data.thread_id,
      parentId: data.parent_id,
      mentions: data.mentions || [],
      reactions: data.reactions || [],
      status: data.status,
      priority: data.priority,
      tags: data.tags || [],
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      resolvedAt: data.resolved_at,
      resolvedBy: data.resolved_by,
      deletedAt: data.deleted_at,
      deletedBy: data.deleted_by,
      replyCount: data.reply_count || 0,
      isEdited: data.is_edited || false,
      editedAt: data.edited_at
    };
  }
}

// Instance singleton
export const documentCommentsService = new DocumentCommentsService();

// Export des fonctions utilitaires
export const addComment = (
  content: string,
  authorId: string,
  authorName: string,
  authorAvatar: string | undefined,
  options: CommentOptions
) => documentCommentsService.addComment(content, authorId, authorName, authorAvatar, options);

export const getDocumentComments = (
  targetId: string,
  targetType: string,
  options?: {
    includeReplies?: boolean;
    status?: CommentStatus;
    threadId?: string;
    sortBy?: 'created_at' | 'updated_at' | 'priority' | 'reply_count';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }
) => documentCommentsService.getDocumentComments(targetId, targetType, options);

export const getCommentThreads = (
  targetId: string,
  targetType: string,
  options?: {
    status?: CommentStatus;
    priority?: CommentPriority;
    tags?: string[];
    sortBy?: 'created_at' | 'updated_at' | 'reply_count' | 'priority';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }
) => documentCommentsService.getCommentThreads(targetId, targetType, options);

export const updateComment = (
  commentId: string,
  updates: {
    content?: string;
    status?: CommentStatus;
    priority?: CommentPriority;
    tags?: string[];
    position?: CommentPosition;
  },
  authorId: string
) => documentCommentsService.updateComment(commentId, updates, authorId);

export const resolveComment = (commentId: string, resolvedBy: string, resolutionNote?: string) => 
  documentCommentsService.resolveComment(commentId, resolvedBy, resolutionNote);

export const deleteComment = (commentId: string, userId: string) => 
  documentCommentsService.deleteComment(commentId, userId);

export const addReaction = (commentId: string, emoji: string, userId: string, userName: string) => 
  documentCommentsService.addReaction(commentId, emoji, userId, userName);

export const searchComments = (
  query: string,
  targetId?: string,
  targetType?: string,
  options?: {
    authorId?: string;
    status?: CommentStatus;
    priority?: CommentPriority;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }
) => documentCommentsService.searchComments(query, targetId, targetType, options);

export const getCommentStats = (targetId?: string, targetType?: string) => 
  documentCommentsService.getCommentStats(targetId, targetType);

// NOUVELLES FONCTIONNALITÉS AVANCÉES

/**
 * Interface pour les commentaires avancés avec IA
 */
export interface AdvancedComment extends DocumentComment {
  sentiment?: CommentSentiment;
  aiSummary?: string;
  suggestedActions?: string[];
  autoTagged: boolean;
  priorityScore: number;
  engagement: CommentEngagement;
  moderation?: CommentModeration;
}

/**
 * Analyse de sentiment pour les commentaires
 */
export interface CommentSentiment {
  score: number; // -1 à 1
  label: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0 à 1
  emotions: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
    disgust: number;
  };
}

/**
 * Engagement d'un commentaire
 */
export interface CommentEngagement {
  totalViews: number;
  uniqueViewers: number;
  averageReadTime: number;
  responseTime: number; // temps moyen de réponse
  threadDepth: number;
  participantCount: number;
  shareCount: number;
}

/**
 * Modération de commentaire
 */
export interface CommentModeration {
  isFlagged: boolean;
  flags: CommentFlag[];
  autoModerated: boolean;
  moderationReason?: string;
  moderatedAt?: Date;
  moderatedBy?: string;
  appealStatus?: 'pending' | 'approved' | 'rejected';
}

/**
 * Signalement de commentaire
 */
export interface CommentFlag {
  id: string;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'offensive' | 'off_topic' | 'other';
  description?: string;
  reporterId: string;
  reporterName: string;
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  resolution?: string;
}

/**
 * Template de commentaire
 */
export interface CommentTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  variables: CommentTemplateVariable[];
  tags: string[];
  category: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  usageCount: number;
}

/**
 * Variable de template
 */
export interface CommentTemplateVariable {
  name: string;
  type: 'text' | 'date' | 'user' | 'custom';
  defaultValue?: string;
  required: boolean;
  description?: string;
}

/**
 * Analyse de commentaire avec IA
 */
export async function analyzeCommentWithAI(comment: DocumentComment): Promise<AdvancedComment> {
  try {
    // Analyse de sentiment (placeholder pour intégration IA)
    const sentiment = await analyzeSentiment(comment.content);
    
    // Résumé IA (placeholder)
    const aiSummary = await generateAISummary(comment.content);
    
    // Actions suggérées (placeholder)
    const suggestedActions = await generateSuggestedActions(comment, sentiment);
    
    // Auto-tagging basé sur le contenu
    const autoTags = await generateAutoTags(comment.content);
    
    // Calcul du score de priorité
    const priorityScore = calculatePriorityScore(comment, sentiment);
    
    // Analyse d'engagement
    const engagement = await analyzeCommentEngagement(comment.id);
    
    // Vérification de modération automatique
    const moderation = await autoModerateComment(comment);
    
    const advancedComment: AdvancedComment = {
      ...comment,
      sentiment,
      aiSummary,
      suggestedActions,
      autoTagged: autoTags.length > 0,
      priorityScore,
      engagement,
      moderation
    };
    
    return advancedComment;
  } catch (error) {
    console.error('❌ Erreur analyse IA commentaire:', error);
    throw new Error('Erreur lors de l\'analyse IA du commentaire');
  }
}

/**
 * Analyse de sentiment du contenu
 */
async function analyzeSentiment(content: string): Promise<CommentSentiment> {
  // Placeholder pour intégration avec une vraie IA
  // Dans une vraie implémentation, on utiliserait une API comme OpenAI ou Claude
  
  const sentimentKeywords = {
    positive: ['excellent', 'super', 'génial', 'parfait', 'bravo', 'bien', 'bon', 'merci', 'félicitations'],
    negative: ['mauvais', 'horrible', 'terrible', 'décevant', 'problème', 'erreur', 'échec', 'frustrant', 'inacceptable']
  };
  
  let score = 0;
  const words = content.toLowerCase().split(/\s+/);
  
  words.forEach(word => {
    if (sentimentKeywords.positive.includes(word)) score += 0.2;
    if (sentimentKeywords.negative.includes(word)) score -= 0.2;
  });
  
  score = Math.max(-1, Math.min(1, score));
  
  let label: 'positive' | 'neutral' | 'negative';
  if (score > 0.1) label = 'positive';
  else if (score < -0.1) label = 'negative';
  else label = 'neutral';
  
  return {
    score,
    label,
    confidence: Math.abs(score),
    emotions: {
      joy: Math.max(0, score),
      anger: Math.max(0, -score),
      fear: 0,
      sadness: Math.max(0, -score * 0.5),
      surprise: 0,
      disgust: 0
    }
  };
}

/**
 * Génère un résumé IA du commentaire
 */
async function generateAISummary(content: string): Promise<string> {
  // Placeholder pour intégration IA
  const words = content.split(/\s+/);
  if (words.length <= 20) return content;
  
  // Simple résumé basé sur les premières phrases
  const sentences = content.split(/[.!?]+/);
  return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '...' : '');
}

/**
 * Génère des actions suggérées
 */
async function generateSuggestedActions(comment: DocumentComment, sentiment: CommentSentiment): Promise<string[]> {
  const actions: string[] = [];
  
  // Actions basées sur le sentiment
  if (sentiment.label === 'negative') {
    actions.push('Répondre rapidement pour apaiser la situation');
    actions.push('Identifier les points de friction');
    actions.push('Proposer une solution');
  } else if (sentiment.label === 'positive') {
    actions.push('Remercier pour le feedback positif');
    actions.push('Partager avec l\'équipe');
    actions.push('Utiliser comme témoignage');
  }
  
  // Actions basées sur la priorité
  if (comment.priority === 'high') {
    actions.push('Traiter en priorité');
    actions.push('Notifier les responsables');
  }
  
  // Actions basées sur le type de contenu
  if (comment.content.includes('?')) {
    actions.push('Répondre à la question');
  }
  
  if (comment.mentions.length > 0) {
    actions.push('Notifier les personnes mentionnées');
  }
  
  return actions.slice(0, 3);
}

/**
 * Génère des tags automatiques
 */
async function generateAutoTags(content: string): Promise<string[]> {
  const tags: string[] = [];
  const contentLower = content.toLowerCase();
  
  // Tags basés sur les mots-clés
  const keywordTags = {
    'bug': ['bug', 'erreur', 'problème'],
    'feature': ['fonctionnalité', 'feature', 'ajout'],
    'improvement': ['amélioration', 'améliorer', 'optimiser'],
    'question': ['?', 'question', 'comment', 'pourquoi'],
    'urgent': ['urgent', 'rapidement', 'immédiatement'],
    'feedback': ['feedback', 'avis', 'suggestion'],
    'documentation': ['documentation', 'doc', 'manuel', 'guide']
  };
  
  Object.entries(keywordTags).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => contentLower.includes(keyword))) {
      tags.push(tag);
    }
  });
  
  return [...new Set(tags)];
}

/**
 * Calcule le score de priorité
 */
function calculatePriorityScore(comment: DocumentComment, sentiment: CommentSentiment): number {
  let score = 0;
  
  // Score basé sur la priorité existante
  const priorityScores = { high: 0.8, medium: 0.5, low: 0.2 };
  score += priorityScores[comment.priority];
  
  // Score basé sur le sentiment (négatif = plus prioritaire)
  if (sentiment.label === 'negative') score += 0.3;
  else if (sentiment.label === 'positive') score -= 0.1;
  
  // Score basé sur les mentions (plus de mentions = plus prioritaire)
  score += Math.min(comment.mentions.length * 0.1, 0.3);
  
  // Score basé sur la longueur (plus long = potentiellement plus important)
  if (comment.content.length > 200) score += 0.1;
  
  // Score basé sur les réactions (plus de réactions = plus important)
  score += Math.min(comment.reactions.length * 0.05, 0.2);
  
  return Math.min(1, Math.max(0, score));
}

/**
 * Analyse l'engagement d'un commentaire
 */
async function analyzeCommentEngagement(commentId: string): Promise<CommentEngagement> {
  try {
    // Récupérer les statistiques d'engagement
    const { data, error } = await supabase
      .from('comment_engagement')
      .select('*')
      .eq('comment_id', commentId)
      .single();

    if (error) {
      // Valeurs par défaut si pas de données
      return {
        totalViews: 0,
        uniqueViewers: 0,
        averageReadTime: 0,
        responseTime: 0,
        threadDepth: 0,
        participantCount: 0,
        shareCount: 0
      };
    }

    return {
      totalViews: data.total_views || 0,
      uniqueViewers: data.unique_viewers || 0,
      averageReadTime: data.average_read_time || 0,
      responseTime: data.response_time || 0,
      threadDepth: data.thread_depth || 0,
      participantCount: data.participant_count || 0,
      shareCount: data.share_count || 0
    };
  } catch (error) {
    console.error('❌ Erreur analyse engagement commentaire:', error);
    return {
      totalViews: 0,
      uniqueViewers: 0,
      averageReadTime: 0,
      responseTime: 0,
      threadDepth: 0,
      participantCount: 0,
      shareCount: 0
    };
  }
}

/**
 * Modération automatique de commentaire
 */
async function autoModerateComment(comment: DocumentComment): Promise<CommentModeration | undefined> {
  try {
    const contentLower = comment.content.toLowerCase();
    const flaggedWords = ['insulte', 'vulgaire', 'haine', 'menace', 'violence'];
    const suspiciousPatterns = ['http://', 'https://', '@', 'tel:', 'email:'];
    
    const hasInappropriateContent = flaggedWords.some(word => contentLower.includes(word));
    const hasSuspiciousLinks = suspiciousPatterns.some(pattern => contentLower.includes(pattern));
    
    if (hasInappropriateContent || hasSuspiciousLinks) {
      return {
        isFlagged: true,
        flags: [{
          id: `auto_flag_${Date.now()}`,
          reason: hasInappropriateContent ? 'inappropriate' : 'spam',
          reporterId: 'system',
          reporterName: 'Auto-modération',
          createdAt: new Date(),
          status: 'pending'
        }],
        autoModerated: true,
        moderationReason: hasInappropriateContent ? 'Contenu inapproprié détecté' : 'Contenu suspect détecté'
      };
    }
    
    return undefined;
  } catch (error) {
    console.error('❌ Erreur modération automatique:', error);
    return undefined;
  }
}

/**
 * Crée un template de commentaire
 */
export async function createCommentTemplate(
  name: string,
  content: string,
  description?: string,
  variables: CommentTemplateVariable[] = [],
  tags: string[] = [],
  category: string = 'général',
  isPublic: boolean = false,
  userId: string
): Promise<CommentTemplate> {
  try {
    const templateData = {
      name,
      description: description || null,
      content,
      variables,
      tags,
      category,
      is_public: isPublic,
      created_by: userId,
      created_at: new Date().toISOString(),
      usage_count: 0
    };

    const { data, error } = await supabase
      .from('comment_templates')
      .insert([templateData])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Échec de la création du template');

    return mapTemplateFromDB(data);
  } catch (error) {
    console.error('❌ Erreur création template commentaire:', error);
    throw new Error('Erreur lors de la création du template de commentaire');
  }
}

/**
 * Applique un template de commentaire
 */
export async function applyCommentTemplate(
  templateId: string,
  variables: Record<string, string> = {},
  userId: string
): Promise<string> {
  try {
    const { data: template, error } = await supabase
      .from('comment_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;
    if (!template) throw new Error('Template non trouvé');

    // Incrémenter le compteur d'utilisation
    await supabase
      .from('comment_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', templateId);

    // Remplacer les variables
    let content = template.content;
    template.variables.forEach(variable => {
      const value = variables[variable.name] || variable.defaultValue || `[${variable.name}]`;
      content = content.replace(new RegExp(`\\{${variable.name}\\}`, 'g'), value);
    });

    return content;
  } catch (error) {
    console.error('❌ Erreur application template commentaire:', error);
    throw new Error('Erreur lors de l\'application du template de commentaire');
  }
}

/**
 * Récupère les templates de commentaire
 */
export async function getCommentTemplates(
  userId?: string,
  category?: string,
  isPublic?: boolean
): Promise<CommentTemplate[]> {
  try {
    let query = supabase
      .from('comment_templates')
      .select('*')
      .order('usage_count', { ascending: false });

    if (userId) {
      query = query.or(`created_by.eq.${userId},is_public.eq.true`);
    } else if (isPublic !== undefined) {
      query = query.eq('is_public', isPublic);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map(mapTemplateFromDB);
  } catch (error) {
    console.error('❌ Erreur récupération templates commentaire:', error);
    throw new Error('Erreur lors de la récupération des templates de commentaire');
  }
}

/**
 * Signale un commentaire
 */
export async function flagComment(
  commentId: string,
  reason: 'spam' | 'inappropriate' | 'harassment' | 'offensive' | 'off_topic' | 'other',
  description?: string,
  reporterId: string,
  reporterName: string
): Promise<void> {
  try {
    const flagData = {
      comment_id: commentId,
      reason,
      description: description || null,
      reporter_id: reporterId,
      reporter_name: reporterName,
      created_at: new Date().toISOString(),
      status: 'pending'
    };

    const { error } = await supabase
      .from('comment_flags')
      .insert([flagData]);

    if (error) throw error;

    // Mettre à jour le statut de modération du commentaire
    await supabase
      .from('document_comments')
      .update({ 
        is_flagged: true,
        flagged_at: new Date().toISOString()
      })
      .eq('id', commentId);
  } catch (error) {
    console.error('❌ Erreur signalement commentaire:', error);
    throw new Error('Erreur lors du signalement du commentaire');
  }
}

/**
 * Modère un commentaire
 */
export async function moderateComment(
  commentId: string,
  moderatorId: string,
  action: 'approve' | 'hide' | 'delete' | 'warn',
  reason?: string
): Promise<void> {
  try {
    const moderationData = {
      comment_id: commentId,
      action,
      reason: reason || null,
      moderator_id: moderatorId,
      moderated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('comment_moderations')
      .insert([moderationData]);

    if (error) throw error;

    // Mettre à jour le statut du commentaire selon l'action
    let updateData: any = {};
    switch (action) {
      case 'hide':
        updateData = { is_hidden: true, hidden_at: new Date().toISOString() };
        break;
      case 'delete':
        updateData = { deleted_at: new Date().toISOString(), deleted_by: moderatorId };
        break;
      case 'approve':
        updateData = { is_flagged: false, flagged_at: null };
        break;
      case 'warn':
        updateData = { warning_sent: true, warning_sent_at: new Date().toISOString() };
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('document_comments')
        .update(updateData)
        .eq('id', commentId);
    }
  } catch (error) {
    console.error('❌ Erreur modération commentaire:', error);
    throw new Error('Erreur lors de la modération du commentaire');
  }
}

/**
 * Exporte les commentaires avec analyses avancées
 */
export function exportAdvancedComments(
  comments: AdvancedComment[],
  format: 'json' | 'csv' | 'xlsx'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify({
        comments,
        exportedAt: new Date().toISOString(),
        totalCount: comments.length,
        includesAIAnalysis: true
      }, null, 2);
    
    case 'csv':
      return exportAdvancedCommentsToCSV(comments);
    
    case 'xlsx':
      // Placeholder pour export Excel
      return JSON.stringify(comments, null, 2);
    
    default:
      return JSON.stringify(comments, null, 2);
  }
}

/**
 * Export CSV des commentaires avancés
 */
function exportAdvancedCommentsToCSV(comments: AdvancedComment[]): string {
  const headers = [
    'ID',
    'Contenu',
    'Auteur',
    'Date de création',
    'Priorité',
    'Statut',
    'Score de sentiment',
    'Label de sentiment',
    'Score de priorité',
    'Nombre de vues',
    'Temps de lecture moyen',
    'Profondeur de thread',
    'Nombre de participants',
    'Auto-tagué',
    'Modéré automatiquement'
  ];

  const csvContent = [
    headers.join(','),
    ...comments.map(comment => [
      comment.id,
      `"${comment.content.replace(/"/g, '""')}"`,
      comment.authorName,
      comment.createdAt,
      comment.priority,
      comment.status,
      comment.sentiment?.score || 0,
      comment.sentiment?.label || 'neutral',
      comment.priorityScore,
      comment.engagement.totalViews,
      comment.engagement.averageReadTime,
      comment.engagement.threadDepth,
      comment.engagement.participantCount,
      comment.autoTagged ? 'Oui' : 'Non',
      comment.moderation?.autoModerated ? 'Oui' : 'Non'
    ].join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Fonctions utilitaires
 */
function mapTemplateFromDB(data: any): CommentTemplate {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    content: data.content,
    variables: data.variables || [],
    tags: data.tags || [],
    category: data.category,
    isPublic: data.is_public,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
    usageCount: data.usage_count
  };
}
