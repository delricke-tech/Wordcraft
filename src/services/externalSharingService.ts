/**
 * Service de partage externe (liens publics)
 * 
 * Ce service permet de créer et gérer des liens de partage publics
 * pour les documents, notes et autres contenus avec contrôle d'accès
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface ShareLink {
  id: string;
  title: string;
  description?: string;
  targetId: string;
  targetType: 'document' | 'note' | 'conversation' | 'flashcard' | 'quiz' | 'collection' | 'folder';
  token: string;
  password?: string;
  expiresAt?: string;
  maxViews?: number;
  currentViews: number;
  permissions: SharePermissions;
  settings: ShareSettings;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastAccessed?: string;
  accessLog: ShareAccessLog[];
}

export interface SharePermissions {
  canView: boolean;
  canDownload: boolean;
  canComment: boolean;
  canShare: boolean;
  canEdit: boolean;
  canPrint: boolean;
}

export interface ShareSettings {
  allowDownload: boolean;
  allowComment: boolean;
  allowShare: boolean;
  showMetadata: boolean;
  watermark: boolean;
  customCSS?: string;
  customLogo?: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'fr' | 'en' | 'es';
}

export interface ShareAccessLog {
  id: string;
  shareId: string;
  accessedAt: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  country?: string;
  city?: string;
  duration?: number;
  downloaded: boolean;
  actions: ShareAction[];
}

export interface ShareAction {
  type: 'view' | 'download' | 'comment' | 'share' | 'print';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ShareAnalytics {
  totalViews: number;
  uniqueViews: number;
  totalDownloads: number;
  totalComments: number;
  totalShares: number;
  averageDuration: number;
  topCountries: Array<{ country: string; views: number }>;
  topReferrers: Array<{ referrer: string; views: number }>;
  dailyViews: Array<{ date: string; views: number }>;
  hourlyViews: Array<{ hour: number; views: number }>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
}

export interface ShareLinkOptions {
  title: string;
  description?: string;
  password?: string;
  expiresAt?: string;
  maxViews?: number;
  permissions: Partial<SharePermissions>;
  settings: Partial<ShareSettings>;
}

export interface PublicShareView {
  share: ShareLink;
  content: any;
  metadata: {
    title: string;
    description?: string;
    type: string;
    createdAt: string;
    fileSize?: number;
    fileType?: string;
    thumbnail?: string;
  };
  settings: ShareSettings;
  permissions: SharePermissions;
  analytics: {
    viewCount: number;
    downloadCount: number;
    remainingViews?: number;
    expiresAt?: string;
  };
}

class ExternalSharingService {
  private readonly DEFAULT_PERMISSIONS: SharePermissions = {
    canView: true,
    canDownload: true,
    canComment: false,
    canShare: false,
    canEdit: false,
    canPrint: false
  };

  private readonly DEFAULT_SETTINGS: ShareSettings = {
    allowDownload: true,
    allowComment: false,
    allowShare: false,
    showMetadata: true,
    watermark: false,
    theme: 'auto',
    language: 'fr'
  };

  /**
   * Crée un nouveau lien de partage
   */
  async createShareLink(
    targetId: string,
    targetType: string,
    options: ShareLinkOptions,
    userId: string
  ): Promise<ShareLink> {
    try {
      // Générer un token unique
      const token = this.generateSecureToken();

      const { data, error } = await supabase
        .from('share_links')
        .insert({
          title: options.title,
          description: options.description,
          target_id: targetId,
          target_type: targetType,
          token,
          password: options.password,
          expires_at: options.expiresAt,
          max_views: options.maxViews,
          permissions: {
            ...this.DEFAULT_PERMISSIONS,
            ...options.permissions
          },
          settings: {
            ...this.DEFAULT_SETTINGS,
            ...options.settings
          },
          is_active: true,
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer le lien de partage');

      console.log('✅ Lien de partage créé:', data.title);
      return this.mapShareLinkFromDB(data);

    } catch (error) {
      console.error('❌ Erreur création lien partage:', error);
      throw new Error(`Échec de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les liens de partage d'un utilisateur
   */
  async getShareLinks(userId: string, options: {
    targetType?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<ShareLink[]> {
    try {
      let query = supabase
        .from('share_links')
        .select(`
          *,
          share_access_logs(accessed_at, ip_address, user_agent, referrer, country, city, duration, downloaded)
        `)
        .eq('created_by', userId);

      if (options.targetType) {
        query = query.eq('target_type', options.targetType);
      }

      if (options.isActive !== undefined) {
        query = query.eq('is_active', options.isActive);
      }

      query = query.order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(this.mapShareLinkFromDB);

    } catch (error) {
      console.error('❌ Erreur récupération liens partage:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère un lien de partage par son token
   */
  async getShareLinkByToken(token: string): Promise<ShareLink | null> {
    try {
      const { data, error } = await supabase
        .from('share_links')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Vérifier si le lien n'a pas expiré
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        await this.deactivateShareLink(data.id);
        return null;
      }

      // Vérifier si le nombre maximal de vues n'est pas atteint
      if (data.max_views && data.current_views >= data.max_views) {
        await this.deactivateShareLink(data.id);
        return null;
      }

      return this.mapShareLinkFromDB(data);

    } catch (error) {
      console.error('❌ Erreur récupération lien partage par token:', error);
      return null;
    }
  }

  /**
   * Obtient la vue publique d'un partage
   */
  async getPublicShareView(token: string, ipAddress: string, userAgent: string): Promise<PublicShareView | null> {
    try {
      const share = await this.getShareLinkByToken(token);
      if (!share) return null;

      // Récupérer le contenu partagé
      const content = await this.getSharedContent(share.targetId, share.targetType);

      // Logger l'accès
      await this.logShareAccess(share.id, ipAddress, userAgent);

      // Incrémenter le compteur de vues
      await this.incrementShareViews(share.id);

      return {
        share,
        content,
        metadata: await this.getContentMetadata(share.targetId, share.targetType),
        settings: share.settings,
        permissions: share.permissions,
        analytics: {
          viewCount: share.currentViews + 1,
          downloadCount: share.accessLog.filter(log => log.downloaded).length,
          remainingViews: share.maxViews ? share.maxViews - (share.currentViews + 1) : undefined,
          expiresAt: share.expiresAt
        }
      };

    } catch (error) {
      console.error('❌ Erreur vue publique partage:', error);
      return null;
    }
  }

  /**
   * Met à jour un lien de partage
   */
  async updateShareLink(id: string, updates: Partial<ShareLink>): Promise<ShareLink> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Mapper les champs camelCase vers snake_case
      if (updates.targetId !== undefined) {
        updateData.target_id = updates.targetId;
        delete updateData.targetId;
      }
      if (updates.targetType !== undefined) {
        updateData.target_type = updates.targetType;
        delete updateData.targetType;
      }
      if (updates.expiresAt !== undefined) {
        updateData.expires_at = updates.expiresAt;
        delete updateData.expiresAt;
      }
      if (updates.maxViews !== undefined) {
        updateData.max_views = updates.maxViews;
        delete updateData.maxViews;
      }
      if (updates.isActive !== undefined) {
        updateData.is_active = updates.isActive;
        delete updateData.isActive;
      }

      const { data, error } = await supabase
        .from('share_links')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Lien de partage non trouvé');

      console.log('✅ Lien de partage mis à jour:', data.title);
      return this.mapShareLinkFromDB(data);

    } catch (error) {
      console.error('❌ Erreur mise à jour lien partage:', error);
      throw new Error(`Échec de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Supprime un lien de partage
   */
  async deleteShareLink(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('share_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Lien de partage supprimé');

    } catch (error) {
      console.error('❌ Erreur suppression lien partage:', error);
      throw new Error(`Échec de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Désactive un lien de partage
   */
  async deactivateShareLink(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('share_links')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Lien de partage désactivé');

    } catch (error) {
      console.error('❌ Erreur désactivation lien partage:', error);
      throw new Error(`Échec de la désactivation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Obtient les analytics d'un lien de partage
   */
  async getShareAnalytics(shareId: string): Promise<ShareAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_share_analytics', { share_id: shareId });

      if (error) throw error;

      return data || {
        totalViews: 0,
        uniqueViews: 0,
        totalDownloads: 0,
        totalComments: 0,
        totalShares: 0,
        averageDuration: 0,
        topCountries: [],
        topReferrers: [],
        dailyViews: [],
        hourlyViews: [],
        deviceBreakdown: {},
        browserBreakdown: {}
      };

    } catch (error) {
      console.error('❌ Erreur analytics partage:', error);
      throw new Error(`Échec des analytics: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Génère un token sécurisé
   */
  private generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    
    // Générer un token de 16 caractères
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return token;
  }

  /**
   * Récupère le contenu partagé
   */
  private async getSharedContent(targetId: string, targetType: string): Promise<any> {
    try {
      switch (targetType) {
        case 'document':
          const { data: doc } = await supabase
            .from('documents')
            .select('*')
            .eq('id', targetId)
            .single();
          return doc;

        case 'note':
          const { data: note } = await supabase
            .from('personal_notes')
            .select('*')
            .eq('id', targetId)
            .single();
          return note;

        case 'conversation':
          const { data: conv } = await supabase
            .from('ai_conversations')
            .select('*')
            .eq('id', targetId)
            .single();
          return conv;

        case 'flashcard':
          const { data: flashcard } = await supabase
            .from('study_cards')
            .select('*')
            .eq('id', targetId)
            .single();
          return flashcard;

        case 'quiz':
          const { data: quiz } = await supabase
            .from('generated_quizzes')
            .select('*')
            .eq('id', targetId)
            .single();
          return quiz;

        default:
          throw new Error('Type de contenu non supporté');
      }

    } catch (error) {
      console.error('❌ Erreur récupération contenu partagé:', error);
      throw new Error('Contenu non trouvé');
    }
  }

  /**
   * Récupère les métadonnées du contenu
   */
  private async getContentMetadata(targetId: string, targetType: string): Promise<any> {
    try {
      const content = await this.getSharedContent(targetId, targetType);

      return {
        title: content.title || 'Sans titre',
        description: content.description || content.plain_content?.substring(0, 200),
        type: targetType,
        createdAt: content.created_at,
        fileSize: content.file_size,
        fileType: content.file_type,
        thumbnail: content.thumbnail_url
      };

    } catch (error) {
      console.error('❌ Erreur métadonnées contenu:', error);
      return {
        title: 'Sans titre',
        type: targetType,
        createdAt: new Date().toISOString()
      };
    }
  }

  /**
   * Logger un accès au partage
   */
  private async logShareAccess(shareId: string, ipAddress: string, userAgent: string): Promise<void> {
    try {
      // Obtenir les informations de géolocalisation (optionnel)
      const geoInfo = await this.getGeoInfo(ipAddress);

      await supabase
        .from('share_access_logs')
        .insert({
          share_id: shareId,
          ip_address: ipAddress,
          user_agent: userAgent,
          country: geoInfo.country,
          city: geoInfo.city,
          accessed_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('❌ Erreur logging accès partage:', error);
    }
  }

  /**
   * Incrémente le compteur de vues
   */
  private async incrementShareViews(shareId: string): Promise<void> {
    try {
      await supabase.rpc('increment_share_views', { share_id: shareId });
    } catch (error) {
      console.error('❌ Erreur incrémentation vues:', error);
    }
  }

  /**
   * Obtient les informations de géolocalisation
   */
  private async getGeoInfo(ipAddress: string): Promise<{ country: string; city: string }> {
    try {
      // Simulation - en production, utiliser un service de géolocalisation réel
      return {
        country: 'FR',
        city: 'Paris'
      };
    } catch (error) {
      return {
        country: 'Unknown',
        city: 'Unknown'
      };
    }
  }

  /**
   * Vérifie si un mot de passe est correct
   */
  async verifySharePassword(shareId: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('share_links')
        .select('password')
        .eq('id', shareId)
        .single();

      if (error) throw error;
      if (!data) return false;

      // Si aucun mot de passe n'est requis
      if (!data.password) return true;

      return data.password === password;

    } catch (error) {
      console.error('❌ Erreur vérification mot de passe:', error);
      return false;
    }
  }

  /**
   * Génère une URL de partage publique
   */
  generateShareUrl(token: string, baseUrl?: string): string {
    const base = baseUrl || window.location.origin;
    return `${base}/share/${token}`;
  }

  /**
   * Exporte les liens de partage
   */
  async exportShareLinks(userId: string): Promise<string> {
    try {
      const shareLinks = await this.getShareLinks(userId);
      
      const exportData = {
        shareLinks,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      return JSON.stringify(exportData, null, 2);

    } catch (error) {
      console.error('❌ Erreur export liens partage:', error);
      throw new Error(`Échec de l'export: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Mappe un lien de partage depuis la base de données
   */
  private mapShareLinkFromDB(data: any): ShareLink {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      targetId: data.target_id,
      targetType: data.target_type,
      token: data.token,
      password: data.password,
      expiresAt: data.expires_at,
      maxViews: data.max_views,
      currentViews: data.current_views || 0,
      permissions: data.permissions || this.DEFAULT_PERMISSIONS,
      settings: data.settings || this.DEFAULT_SETTINGS,
      isActive: data.is_active,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastAccessed: data.last_accessed,
      accessLog: data.share_access_logs || []
    };
  }
}

// Instance singleton
export const externalSharingService = new ExternalSharingService();

// Export des fonctions utilitaires
export const createShareLink = (
  targetId: string,
  targetType: string,
  options: ShareLinkOptions,
  userId: string
) => externalSharingService.createShareLink(targetId, targetType, options, userId);

export const getShareLinks = (userId: string, options?: {
  targetType?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) => externalSharingService.getShareLinks(userId, options);

export const getShareLinkByToken = (token: string) => 
  externalSharingService.getShareLinkByToken(token);

export const getPublicShareView = (token: string, ipAddress: string, userAgent: string) => 
  externalSharingService.getPublicShareView(token, ipAddress, userAgent);

export const updateShareLink = (id: string, updates: Partial<ShareLink>) => 
  externalSharingService.updateShareLink(id, updates);

export const deleteShareLink = (id: string) => 
  externalSharingService.deleteShareLink(id);

export const getShareAnalytics = (shareId: string) => 
  externalSharingService.getShareAnalytics(shareId);

export const verifySharePassword = (shareId: string, password: string) => 
  externalSharingService.verifySharePassword(shareId, password);

export const generateShareUrl = (token: string, baseUrl?: string) => 
  externalSharingService.generateShareUrl(token, baseUrl);
