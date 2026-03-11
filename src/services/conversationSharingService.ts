/**
 * Service de partage de conversations (liens publics)
 * 
 * Ce service gère le partage des conversations via des liens publics,
 * la gestion des permissions, l'accès anonyme et le suivi des consultations
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface ConversationShare {
  id: string;
  userId: string;
  conversationId: string;
  shareToken: string;
  shareUrl: string;
  title: string;
  description?: string;
  settings: ShareSettings;
  permissions: SharePermissions;
  metadata: ShareMetadata;
  status: ShareStatus;
  expiresAt?: string;
  password?: string;
  accessCode?: string;
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  lastViewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareSettings {
  allowAnonymous: boolean;
  requirePassword: boolean;
  requireEmail: boolean;
  allowDownload: boolean;
  allowCopy: boolean;
  allowPrint: boolean;
  allowShare: boolean;
  allowComments: boolean;
  allowRating: boolean;
  showMetadata: boolean;
  showTimestamps: boolean;
  showUsernames: boolean;
  showDocuments: boolean;
  showCitations: boolean;
  watermark: boolean;
  branding: boolean;
  customCSS?: string;
  customHeader?: string;
  customFooter?: string;
  theme: 'light' | 'dark' | 'auto' | 'custom';
  language: string;
  timezone: string;
}

export interface SharePermissions {
  canView: boolean;
  canDownload: boolean;
  canCopy: boolean;
  canPrint: boolean;
  canShare: boolean;
  canComment: boolean;
  canRate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canPrintPDF: boolean;
  canViewAnalytics: boolean;
  canManageAccess: boolean;
}

export interface ShareMetadata {
  originalConversationTitle: string;
  originalConversationLength: number;
  messageCount: number;
  wordCount: number;
  characterCount: number;
  documentCount: number;
  citationCount: number;
  averageResponseTime: number;
  totalProcessingTime: number;
  modelUsed: string;
  language: string;
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  complexity: 'low' | 'medium' | 'high';
  tags: string[];
  category: string;
  subcategory: string;
  customFields: Record<string, any>;
}

export type ShareStatus = 
  | 'active'
  | 'paused'
  | 'expired'
  | 'revoked'
  | 'suspended'
  | 'deleted';

export interface ShareAccess {
  id: string;
  shareId: string;
  accessType: 'view' | 'download' | 'copy' | 'print' | 'share' | 'comment' | 'rate';
  ipAddress: string;
  userAgent: string;
  location?: LocationData;
  timestamp: string;
  duration?: number;
  referrer?: string;
  sessionId: string;
  userId?: string;
  email?: string;
  metadata: Record<string, any>;
}

export interface LocationData {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface ShareAnalytics {
  id: string;
  shareId: string;
  date: string;
  totalViews: number;
  uniqueViews: number;
  totalDownloads: number;
  uniqueDownloads: number;
  totalShares: number;
  uniqueShares: number;
  totalComments: number;
  totalRatings: number;
  averageRating: number;
  averageDuration: number;
  bounceRate: number;
  conversionRate: number;
  topCountries: Record<string, number>;
  topReferrers: Record<string, number>;
  topDevices: Record<string, number>;
  topBrowsers: Record<string, number>;
  hourlyViews: number[];
  dailyViews: number[];
  weeklyViews: number[];
  monthlyViews: number[];
  createdAt: string;
  updatedAt: string;
}

export interface ShareComment {
  id: string;
  shareId: string;
  parentCommentId?: string;
  authorName: string;
  authorEmail?: string;
  authorWebsite?: string;
  content: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  rating?: number;
  isApproved: boolean;
  isSpam: boolean;
  replies: ShareComment[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ShareRating {
  id: string;
  shareId: string;
  rating: number;
  review?: string;
  authorName: string;
  authorEmail?: string;
  helpfulCount: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ShareTemplate {
  id: string;
  name: string;
  description: string;
  settings: ShareSettings;
  permissions: SharePermissions;
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareStats {
  totalShares: number;
  activeShares: number;
  expiredShares: number;
  revokedShares: number;
  totalViews: number;
  uniqueViews: number;
  totalDownloads: number;
  totalSharesGenerated: number;
  averageViewsPerShare: number;
  averageDuration: number;
  conversionRate: number;
  topCountries: Record<string, number>;
  topLanguages: Record<string, number>;
  topCategories: Record<string, number>;
  shareTrends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  userActivity: {
    totalUsers: number;
    activeUsers: number;
    averageSharesPerUser: number;
    mostActiveUser: string;
    userGrowth: number[];
  };
}

export interface ShareExport {
  id: string;
  shareId: string;
  format: 'json' | 'csv' | 'pdf' | 'xlsx';
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ExportOptions {
  includeAnalytics: boolean;
  includeComments: boolean;
  includeRatings: boolean;
  includeAccessLogs: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: {
    countries?: string[];
    devices?: string[];
    browsers?: string[];
    referrers?: string[];
  };
  format?: {
    dateFormat: string;
    numberFormat: string;
    currency: string;
    language: string;
  };
}

class ConversationSharingService {
  private shares: Map<string, ConversationShare> = new Map();
  private analytics: Map<string, ShareAnalytics> = new Map();
  private templates: Map<string, ShareTemplate> = new Map();
  private eventCallbacks: Map<string, (event: any) => void> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialise le service de partage de conversations
   */
  private async initializeService(): Promise<void> {
    try {
      // Charger les templates par défaut
      await this.loadDefaultTemplates();
      
      // Démarrer le monitoring
      this.startMonitoring();
      
      this.isInitialized = true;
      console.log('🔗 Service de partage de conversations initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation service partage conversations:', error);
    }
  }

  /**
   * Crée un nouveau partage de conversation
   */
  async createShare(
    userId: string,
    conversationId: string,
    options: {
      title?: string;
      description?: string;
      settings?: Partial<ShareSettings>;
      permissions?: Partial<SharePermissions>;
      expiresAt?: string;
      password?: string;
    } = {}
  ): Promise<ConversationShare> {
    try {
      // Récupérer les détails de la conversation
      const conversation = await this.getConversationDetails(conversationId);
      if (!conversation) {
        throw new Error('Conversation non trouvée');
      }

      // Générer le token de partage
      const shareToken = this.generateShareToken();
      const shareUrl = this.generateShareUrl(shareToken);

      // Créer le partage
      const share: ConversationShare = {
        id: this.generateId(),
        userId,
        conversationId,
        shareToken,
        shareUrl,
        title: options.title || conversation.title || 'Conversation partagée',
        description: options.description,
        settings: this.mergeDefaultSettings(options.settings),
        permissions: this.mergeDefaultPermissions(options.permissions),
        metadata: await this.extractShareMetadata(conversation),
        status: 'active',
        expiresAt: options.expiresAt,
        password: options.password,
        accessCode: options.password ? this.generateAccessCode() : undefined,
        viewCount: 0,
        downloadCount: 0,
        shareCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Stocker le partage
      this.shares.set(share.id, share);
      await this.saveShare(share);

      console.log('🔗 Partage de conversation créé:', share.id);
      return share;

    } catch (error) {
      console.error('❌ Erreur création partage conversation:', error);
      throw error;
    }
  }

  /**
   * Accède à une conversation partagée
   */
  async accessSharedConversation(
    shareToken: string,
    accessData: {
      password?: string;
      email?: string;
      userAgent?: string;
      ipAddress?: string;
      referrer?: string;
    } = {}
  ): Promise<{
    share: ConversationShare;
    conversation: any;
    accessGranted: boolean;
    requiresAuth: boolean;
  }> {
    try {
      // Récupérer le partage
      const share = await this.getShareByToken(shareToken);
      if (!share) {
        throw new Error('Partage non trouvé');
      }

      // Vérifier le statut du partage
      if (share.status !== 'active') {
        throw new Error('Partage non actif');
      }

      // Vérifier l'expiration
      if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
        throw new Error('Partage expiré');
      }

      // Vérifier le mot de passe si requis
      if (share.settings.requirePassword && accessData.password !== share.password) {
        return {
          share,
          conversation: null,
          accessGranted: false,
          requiresAuth: true
        };
      }

      // Vérifier si l'accès anonyme est autorisé
      if (!share.settings.allowAnonymous && !accessData.email) {
        return {
          share,
          conversation: null,
          accessGranted: false,
          requiresAuth: true
        };
      }

      // Récupérer la conversation
      const conversation = await this.getConversationDetails(share.conversationId);
      if (!conversation) {
        throw new Error('Conversation non trouvée');
      }

      // Filtrer la conversation selon les paramètres
      const filteredConversation = this.filterConversation(conversation, share);

      // Enregistrer l'accès
      await this.recordAccess(share.id, {
        accessType: 'view',
        ipAddress: accessData.ipAddress || 'unknown',
        userAgent: accessData.userAgent || 'unknown',
        referrer: accessData.referrer,
        sessionId: this.generateSessionId(),
        email: accessData.email
      });

      // Mettre à jour les statistiques
      await this.updateShareStats(share.id, 'view');

      return {
        share,
        conversation: filteredConversation,
        accessGranted: true,
        requiresAuth: false
      };

    } catch (error) {
      console.error('❌ Erreur accès conversation partagée:', error);
      throw error;
    }
  }

  /**
   * Met à jour les paramètres de partage
   */
  async updateShareSettings(
    shareId: string,
    userId: string,
    settings: Partial<ShareSettings>,
    permissions?: Partial<SharePermissions>
  ): Promise<ConversationShare> {
    try {
      const share = this.shares.get(shareId);
      if (!share || share.userId !== userId) {
        throw new Error('Partage non trouvé ou accès non autorisé');
      }

      // Mettre à jour les paramètres
      share.settings = { ...share.settings, ...settings };
      if (permissions) {
        share.permissions = { ...share.permissions, ...permissions };
      }
      share.updatedAt = new Date().toISOString();

      // Sauvegarder
      this.shares.set(shareId, share);
      await this.saveShare(share);

      console.log('🔗 Paramètres de partage mis à jour:', shareId);
      return share;

    } catch (error) {
      console.error('❌ Erreur mise à jour paramètres partage:', error);
      throw error;
    }
  }

  /**
   * Révoque un partage
   */
  async revokeShare(shareId: string, userId: string): Promise<void> {
    try {
      const share = this.shares.get(shareId);
      if (!share || share.userId !== userId) {
        throw new Error('Partage non trouvé ou accès non autorisé');
      }

      share.status = 'revoked';
      share.updatedAt = new Date().toISOString();

      this.shares.set(shareId, share);
      await this.saveShare(share);

      console.log('🔗 Partage révoqué:', shareId);

    } catch (error) {
      console.error('❌ Erreur révocation partage:', error);
      throw error;
    }
  }

  /**
   * Obtient les partages d'un utilisateur
   */
  async getUserShares(
    userId: string,
    options: {
      status?: ShareStatus;
      limit?: number;
      offset?: number;
      orderBy?: 'created_at' | 'updated_at' | 'view_count' | 'share_count';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<ConversationShare[]> {
    try {
      let query = supabase
        .from('conversation_shares')
        .select('*')
        .eq('user_id', userId);

      if (options.status) {
        query = query.eq('status', options.status);
      }

      const orderBy = options.orderBy || 'created_at';
      const orderDirection = options.orderDirection || 'desc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, (options.offset || 0) + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as ConversationShare[];

    } catch (error) {
      console.error('❌ Erreur récupération partages utilisateur:', error);
      throw error;
    }
  }

  /**
   * Obtient les analytics d'un partage
   */
  async getShareAnalytics(
    shareId: string,
    userId: string,
    dateRange?: { start: string; end: string }
  ): Promise<ShareAnalytics> {
    try {
      const share = this.shares.get(shareId);
      if (!share || share.userId !== userId) {
        throw new Error('Partage non trouvé ou accès non autorisé');
      }

      let query = supabase
        .from('share_analytics')
        .select('*')
        .eq('share_id', shareId);

      if (dateRange) {
        query = query.gte('date', dateRange.start).lte('date', dateRange.end);
      }

      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Agréger les données si nécessaire
      const analytics = this.aggregateAnalytics(data as ShareAnalytics[]);

      return analytics;

    } catch (error) {
      console.error('❌ Erreur récupération analytics partage:', error);
      throw error;
    }
  }

  /**
   * Ajoute un commentaire à un partage
   */
  async addComment(
    shareId: string,
    comment: {
      parentCommentId?: string;
      authorName: string;
      authorEmail?: string;
      authorWebsite?: string;
      content: string;
    }
  ): Promise<ShareComment> {
    try {
      const share = this.shares.get(shareId);
      if (!share || !share.settings.allowComments) {
        throw new Error('Commentaires non autorisés');
      }

      const newComment: ShareComment = {
        id: this.generateId(),
        shareId,
        parentCommentId: comment.parentCommentId,
        authorName: comment.authorName,
        authorEmail: comment.authorEmail,
        authorWebsite: comment.authorWebsite,
        content: comment.content,
        isApproved: !share.settings.requireEmail || !!comment.authorEmail,
        isSpam: false,
        replies: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Sauvegarder le commentaire
      await this.saveComment(newComment);

      // Enregistrer l'accès
      await this.recordAccess(shareId, {
        accessType: 'comment',
        ipAddress: 'unknown',
        userAgent: 'unknown',
        sessionId: this.generateSessionId(),
        email: comment.authorEmail
      });

      console.log('🔗 Commentaire ajouté:', newComment.id);
      return newComment;

    } catch (error) {
      console.error('❌ Erreur ajout commentaire:', error);
      throw error;
    }
  }

  /**
   * Ajoute une évaluation à un partage
   */
  async addRating(
    shareId: string,
    rating: {
      rating: number;
      review?: string;
      authorName: string;
      authorEmail?: string;
    }
  ): Promise<ShareRating> {
    try {
      const share = this.shares.get(shareId);
      if (!share || !share.settings.allowRating) {
        throw new Error('Évaluations non autorisées');
      }

      const newRating: ShareRating = {
        id: this.generateId(),
        shareId,
        rating: Math.max(1, Math.min(5, rating.rating)),
        review: rating.review,
        authorName: rating.authorName,
        authorEmail: rating.authorEmail,
        helpfulCount: 0,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Sauvegarder l'évaluation
      await this.saveRating(newRating);

      // Mettre à jour les statistiques
      await this.updateShareStats(shareId, 'rating');

      console.log('🔗 Évaluation ajoutée:', newRating.id);
      return newRating;

    } catch (error) {
      console.error('❌ Erreur ajout évaluation:', error);
      throw error;
    }
  }

  /**
   * Exporte les analytics d'un partage
   */
  async exportShareAnalytics(
    shareId: string,
    userId: string,
    format: 'json' | 'csv' | 'pdf' | 'xlsx',
    options: ExportOptions = {}
  ): Promise<ShareExport> {
    try {
      const share = this.shares.get(shareId);
      if (!share || share.userId !== userId) {
        throw new Error('Partage non trouvé ou accès non autorisé');
      }

      const exportData: ShareExport = {
        id: this.generateId(),
        shareId,
        format,
        options,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Traiter l'export
      const analyticsData = await this.getShareAnalytics(shareId, userId, options.dateRange);
      const exportedContent = await this.processAnalyticsExport(analyticsData, format, options);
      
      // Sauvegarder le fichier exporté
      const fileUrl = await this.saveExportFile(exportData.id, exportedContent, format);
      
      exportData.status = 'completed';
      exportData.fileUrl = fileUrl;
      exportData.fileSize = exportedContent.length;
      exportData.completedAt = new Date().toISOString();

      console.log('🔗 Export analytics terminé:', exportData.id);
      return exportData;

    } catch (error) {
      console.error('❌ Erreur export analytics:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques globales de partage
   */
  async getStats(): Promise<ShareStats> {
    try {
      const { data, error } = await supabase.rpc('get_conversation_sharing_stats');

      if (error) throw error;

      const stats = data || {
        total_shares: 0,
        active_shares: 0,
        expired_shares: 0,
        revoked_shares: 0,
        total_views: 0,
        unique_views: 0,
        total_downloads: 0,
        total_shares_generated: 0,
        average_views_per_share: 0,
        average_duration: 0,
        conversion_rate: 0,
        top_countries: {},
        top_languages: {},
        top_categories: {},
        share_trends: { daily: Array(30).fill(0), weekly: Array(12).fill(0), monthly: Array(12).fill(0) },
        user_activity: { total_users: 0, active_users: 0, average_shares_per_user: 0, most_active_user: '', user_growth: Array(12).fill(0) }
      };

      return {
        totalShares: stats.total_shares,
        activeShares: stats.active_shares,
        expiredShares: stats.expired_shares,
        revokedShares: stats.revoked_shares,
        totalViews: stats.total_views,
        uniqueViews: stats.unique_views,
        totalDownloads: stats.total_downloads,
        totalSharesGenerated: stats.total_shares_generated,
        averageViewsPerShare: stats.average_views_per_share,
        averageDuration: stats.average_duration,
        conversionRate: stats.conversion_rate,
        topCountries: stats.top_countries,
        topLanguages: stats.top_languages,
        topCategories: stats.top_categories,
        shareTrends: stats.share_trends,
        userActivity: stats.user_activity
      };

    } catch (error) {
      console.error('❌ Erreur statistiques partage:', error);
      throw error;
    }
  }

  // Méthodes privées

  private async getConversationDetails(conversationId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('❌ Erreur récupération détails conversation:', error);
      throw error;
    }
  }

  private async extractShareMetadata(conversation: any): Promise<ShareMetadata> {
    try {
      // Simuler l'extraction des métadonnées
      return {
        originalConversationTitle: conversation.title || 'Sans titre',
        originalConversationLength: conversation.messages?.length || 0,
        messageCount: conversation.messages?.length || 0,
        wordCount: 1000, // À calculer
        characterCount: 5000, // À calculer
        documentCount: 0, // À calculer
        citationCount: 0, // À calculer
        averageResponseTime: 2.5, // À calculer
        totalProcessingTime: 30, // À calculer
        modelUsed: 'gpt-4',
        language: 'fr',
        topics: [], // À extraire
        sentiment: 'neutral',
        complexity: 'medium',
        tags: [],
        category: 'general',
        subcategory: 'chat',
        customFields: {}
      };

    } catch (error) {
      console.error('❌ Erreur extraction métadonnées partage:', error);
      throw error;
    }
  }

  private mergeDefaultSettings(settings?: Partial<ShareSettings>): ShareSettings {
    return {
      allowAnonymous: true,
      requirePassword: false,
      requireEmail: false,
      allowDownload: true,
      allowCopy: true,
      allowPrint: true,
      allowShare: true,
      allowComments: true,
      allowRating: true,
      showMetadata: true,
      showTimestamps: true,
      showUsernames: false,
      showDocuments: true,
      showCitations: true,
      watermark: false,
      branding: true,
      theme: 'light',
      language: 'fr',
      timezone: 'Europe/Paris',
      ...settings
    };
  }

  private mergeDefaultPermissions(permissions?: Partial<SharePermissions>): SharePermissions {
    return {
      canView: true,
      canDownload: true,
      canCopy: true,
      canPrint: true,
      canShare: true,
      canComment: true,
      canRate: true,
      canEdit: false,
      canDelete: false,
      canExport: false,
      canPrintPDF: false,
      canViewAnalytics: false,
      canManageAccess: false,
      ...permissions
    };
  }

  private filterConversation(conversation: any, share: ConversationShare): any {
    try {
      // Filtrer selon les paramètres de partage
      const filtered = { ...conversation };

      if (!share.settings.showTimestamps) {
        // Supprimer les timestamps
        filtered.messages = filtered.messages?.map((msg: any) => ({
          ...msg,
          created_at: undefined
        }));
      }

      if (!share.settings.showUsernames) {
        // Anonymiser les usernames
        filtered.messages = filtered.messages?.map((msg: any) => ({
          ...msg,
          user_name: msg.role === 'user' ? 'Utilisateur' : 'Assistant'
        }));
      }

      if (!share.settings.showDocuments) {
        // Supprimer les références aux documents
        filtered.messages = filtered.messages?.map((msg: any) => ({
          ...msg,
          documents: undefined
        }));
      }

      if (!share.settings.showCitations) {
        // Supprimer les citations
        filtered.messages = filtered.messages?.map((msg: any) => ({
          ...msg,
          citations: undefined
        }));
      }

      return filtered;

    } catch (error) {
      console.error('❌ Erreur filtrage conversation:', error);
      return conversation;
    }
  }

  private async recordAccess(shareId: string, accessData: any): Promise<void> {
    try {
      const access: ShareAccess = {
        id: this.generateId(),
        shareId,
        accessType: accessData.accessType,
        ipAddress: accessData.ipAddress,
        userAgent: accessData.userAgent,
        timestamp: new Date().toISOString(),
        sessionId: accessData.sessionId,
        userId: accessData.userId,
        email: accessData.email,
        metadata: accessData.metadata || {}
      };

      const { error } = await supabase
        .from('share_access_logs')
        .insert(access);

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur enregistrement accès:', error);
    }
  }

  private async updateShareStats(shareId: string, statType: 'view' | 'download' | 'share' | 'comment' | 'rating'): Promise<void> {
    try {
      const share = this.shares.get(shareId);
      if (!share) return;

      switch (statType) {
        case 'view':
          share.viewCount++;
          share.lastViewedAt = new Date().toISOString();
          break;
        case 'download':
          share.downloadCount++;
          break;
        case 'share':
          share.shareCount++;
          break;
        default:
          break;
      }

      share.updatedAt = new Date().toISOString();
      this.shares.set(shareId, share);
      await this.saveShare(share);

    } catch (error) {
      console.error('❌ Erreur mise à jour statistiques partage:', error);
    }
  }

  private generateShareToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  private generateShareUrl(token: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/shared/${token}`;
  }

  private generateAccessCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getShareByToken(shareToken: string): Promise<ConversationShare | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_shares')
        .select('*')
        .eq('share_token', shareToken)
        .single();

      if (error) throw error;
      if (!data) return null;

      return data as ConversationShare;

    } catch (error) {
      console.error('❌ Erreur récupération partage par token:', error);
      return null;
    }
  }

  private aggregateAnalytics(analyticsData: ShareAnalytics[]): ShareAnalytics {
    // Simuler l'agrégation des analytics
    return {
      id: 'aggregated',
      shareId: analyticsData[0]?.shareId || '',
      date: new Date().toISOString().split('T')[0],
      totalViews: analyticsData.reduce((sum, a) => sum + a.totalViews, 0),
      uniqueViews: analyticsData.reduce((sum, a) => sum + a.uniqueViews, 0),
      totalDownloads: analyticsData.reduce((sum, a) => sum + a.totalDownloads, 0),
      uniqueDownloads: analyticsData.reduce((sum, a) => sum + a.uniqueDownloads, 0),
      totalShares: analyticsData.reduce((sum, a) => sum + a.totalShares, 0),
      uniqueShares: analyticsData.reduce((sum, a) => sum + a.uniqueShares, 0),
      totalComments: analyticsData.reduce((sum, a) => sum + a.totalComments, 0),
      totalRatings: analyticsData.reduce((sum, a) => sum + a.totalRatings, 0),
      averageRating: analyticsData.reduce((sum, a) => sum + a.averageRating, 0) / analyticsData.length,
      averageDuration: analyticsData.reduce((sum, a) => sum + a.averageDuration, 0) / analyticsData.length,
      bounceRate: analyticsData.reduce((sum, a) => sum + a.bounceRate, 0) / analyticsData.length,
      conversionRate: analyticsData.reduce((sum, a) => sum + a.conversionRate, 0) / analyticsData.length,
      topCountries: {},
      topReferrers: {},
      topDevices: {},
      topBrowsers: {},
      hourlyViews: Array(24).fill(0),
      dailyViews: Array(30).fill(0),
      weeklyViews: Array(52).fill(0),
      monthlyViews: Array(12).fill(0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private async processAnalyticsExport(
    analytics: ShareAnalytics,
    format: string,
    options: ExportOptions
  ): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(analytics, null, 2);
      case 'csv':
        return this.convertToCSV(analytics);
      case 'pdf':
        return 'PDF content'; // Simuler
      case 'xlsx':
        return 'XLSX content'; // Simuler
      default:
        throw new Error(`Format non supporté: ${format}`);
    }
  }

  private convertToCSV(analytics: ShareAnalytics): string {
    const headers = [
      'Date',
      'Total Views',
      'Unique Views',
      'Total Downloads',
      'Average Rating',
      'Average Duration',
      'Bounce Rate',
      'Conversion Rate'
    ];

    const rows = [
      headers.join(','),
      [
        analytics.date,
        analytics.totalViews,
        analytics.uniqueViews,
        analytics.totalDownloads,
        analytics.averageRating,
        analytics.averageDuration,
        analytics.bounceRate,
        analytics.conversionRate
      ].join(',')
    ];

    return rows.join('\n');
  }

  private async saveExportFile(
    exportId: string,
    content: string,
    format: string
  ): Promise<string> {
    try {
      const fileName = `share-exports/${exportId}.${format}`;
      
      const { error } = await supabase.storage
        .from('share-exports')
        .upload(fileName, new Blob([content]));

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('share-exports')
        .getPublicUrl(fileName);

      return publicUrl;

    } catch (error) {
      console.error('❌ Erreur sauvegarde fichier export:', error);
      throw error;
    }
  }

  // Méthodes de base de données (simulées)

  private async saveShare(share: ConversationShare): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversation_shares')
        .upsert({
          id: share.id,
          user_id: share.userId,
          conversation_id: share.conversationId,
          share_token: share.shareToken,
          share_url: share.shareUrl,
          title: share.title,
          description: share.description,
          settings: share.settings,
          permissions: share.permissions,
          metadata: share.metadata,
          status: share.status,
          expires_at: share.expiresAt,
          password: share.password,
          access_code: share.accessCode,
          view_count: share.viewCount,
          download_count: share.downloadCount,
          share_count: share.shareCount,
          last_viewed_at: share.lastViewedAt,
          created_at: share.createdAt,
          updated_at: share.updatedAt
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde partage:', error);
    }
  }

  private async saveComment(comment: ShareComment): Promise<void> {
    try {
      const { error } = await supabase
        .from('share_comments')
        .insert({
          id: comment.id,
          share_id: comment.shareId,
          parent_comment_id: comment.parentCommentId,
          author_name: comment.authorName,
          author_email: comment.authorEmail,
          author_website: comment.authorWebsite,
          content: comment.content,
          sentiment: comment.sentiment,
          rating: comment.rating,
          is_approved: comment.isApproved,
          is_spam: comment.isSpam,
          metadata: comment.metadata,
          created_at: comment.createdAt,
          updated_at: comment.updatedAt
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde commentaire:', error);
    }
  }

  private async saveRating(rating: ShareRating): Promise<void> {
    try {
      const { error } = await supabase
        .from('share_ratings')
        .insert({
          id: rating.id,
          share_id: rating.shareId,
          rating: rating.rating,
          review: rating.review,
          author_name: rating.authorName,
          author_email: rating.authorEmail,
          helpful_count: rating.helpfulCount,
          metadata: rating.metadata,
          created_at: rating.createdAt,
          updated_at: rating.updatedAt
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde évaluation:', error);
    }
  }

  /**
   * Charge les templates par défaut
   */
  private async loadDefaultTemplates(): Promise<void> {
    // Simuler le chargement des templates par défaut
    console.log('🔗 Chargement des templates de partage...');
  }

  /**
   * Démarre le monitoring
   */
  private startMonitoring(): void {
    // Monitorer les partages expirés
    setInterval(() => {
      this.checkExpiredShares();
    }, 3600000); // Toutes les heures

    // Monitorer les statistiques
    setInterval(() => {
      this.updateGlobalStats();
    }, 300000); // Toutes les 5 minutes
  }

  /**
   * Vérifie les partages expirés
   */
  private checkExpiredShares(): void {
    // Simuler la vérification des partages expirés
    console.log('🔗 Vérification des partages expirés...');
  }

  /**
   * Met à jour les statistiques globales
   */
  private updateGlobalStats(): void {
    // Simuler la mise à jour des statistiques globales
    console.log('🔗 Mise à jour des statistiques globales...');
  }

  /**
   * Ajoute un callback d'événement
   */
  on(event: string, callback: (event: any) => void): void {
    this.eventCallbacks.set(event, callback);
  }

  /**
   * Émet un événement
   */
  private emit(event: string, data: any): void {
    const callback = this.eventCallbacks.get(event);
    if (callback) {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Erreur callback événement partage:', error);
      }
    }
  }

  /**
   * Détruit le service de partage
   */
  destroy(): void {
    // Vider les caches
    this.shares.clear();
    this.analytics.clear();
    this.templates.clear();
    this.eventCallbacks.clear();
    
    console.log('🔗 Service de partage de conversations détruit');
  }
}

// Instance singleton
export const conversationSharingService = new ConversationSharingService();

// Export des fonctions utilitaires
export const createConversationShare = (
  userId: string,
  conversationId: string,
  options?: {
    title?: string;
    description?: string;
    settings?: Partial<ShareSettings>;
    permissions?: Partial<SharePermissions>;
    expiresAt?: string;
    password?: string;
  }
) => conversationSharingService.createShare(userId, conversationId, options);

export const accessSharedConversation = (
  shareToken: string,
  accessData?: {
    password?: string;
    email?: string;
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
  }
) => conversationSharingService.accessSharedConversation(shareToken, accessData);

export const getUserConversationShares = (
  userId: string,
  options?: {
    status?: ShareStatus;
    limit?: number;
    offset?: number;
    orderBy?: 'created_at' | 'updated_at' | 'view_count' | 'share_count';
    orderDirection?: 'asc' | 'desc';
  }
) => conversationSharingService.getUserShares(userId, options);

export const getConversationSharingStats = () => conversationSharingService.getStats();
