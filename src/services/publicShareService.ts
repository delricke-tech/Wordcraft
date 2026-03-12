/**
 * Service de partage externe de documents (liens publics)
 * 
 * Ce service permet de générer des liens de partage publics pour les documents
 * avec contrôle d'accès, expiration et statistiques d'utilisation
 * 
 * Date: 12 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface PublicShare {
  id: string;
  documentId: string;
  documentName: string;
  documentType: string;
  shareToken: string;
  publicUrl: string;
  password?: string;
  expiresAt?: Date;
  maxDownloads?: number;
  currentDownloads: number;
  allowedEmails?: string[];
  isPasswordProtected: boolean;
  isEmailRestricted: boolean;
  isActive: boolean;
  permissions: SharePermissions;
  metadata: ShareMetadata;
  createdAt: Date;
  createdBy: string;
  lastAccessed?: Date;
  accessCount: number;
}

export interface SharePermissions {
  canDownload: boolean;
  canView: boolean;
  canComment: boolean;
  canCopy: boolean;
  canPrint: boolean;
  watermark?: boolean;
  expirationAction: 'disable' | 'notify' | 'delete';
}

export interface ShareMetadata {
  originalFileName: string;
  fileSize: number;
  thumbnail?: string;
  preview?: string;
  description?: string;
  tags?: string[];
  version?: string;
}

export interface ShareAnalytics {
  shareId: string;
  totalViews: number;
  totalDownloads: number;
  uniqueVisitors: number;
  averageTimeSpent: number;
  bounceRate: number;
  topCountries: Array<{ country: string; views: number }>;
  topReferrers: Array<{ referrer: string; views: number }>;
  dailyStats: Array<{ date: string; views: number; downloads: number }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

export interface CreateShareOptions {
  documentId: string;
  documentName: string;
  documentType: string;
  password?: string;
  expiresAt?: Date;
  maxDownloads?: number;
  allowedEmails?: string[];
  permissions: Partial<SharePermissions>;
  metadata: Partial<ShareMetadata>;
  customMessage?: string;
}

export interface ShareValidation {
  isValid: boolean;
  isExpired: boolean;
  isDownloadLimitReached: boolean;
  isEmailAuthorized: boolean;
  isPasswordValid: boolean;
  remainingDownloads: number;
  timeUntilExpiration: number; // en secondes
}

/**
 * Génère un token de partage sécurisé
 */
function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Génère une URL de partage publique
 */
function generatePublicUrl(token: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/shared/${token}`;
}

/**
 * Crée un nouveau partage public
 */
export async function createPublicShare(
  options: CreateShareOptions,
  userId: string
): Promise<PublicShare> {
  try {
    const shareToken = generateShareToken();
    const publicUrl = generatePublicUrl(shareToken);
    
    const shareData = {
      document_id: options.documentId,
      document_name: options.documentName,
      document_type: options.documentType,
      share_token: shareToken,
      public_url: publicUrl,
      password: options.password || null,
      expires_at: options.expiresAt?.toISOString() || null,
      max_downloads: options.maxDownloads || null,
      current_downloads: 0,
      allowed_emails: options.allowedEmails || null,
      is_password_protected: !!options.password,
      is_email_restricted: !!options.allowedEmails && options.allowedEmails.length > 0,
      is_active: true,
      permissions: {
        can_download: options.permissions.canDownload ?? true,
        can_view: options.permissions.canView ?? true,
        can_comment: options.permissions.canComment ?? false,
        can_copy: options.permissions.canCopy ?? true,
        can_print: options.permissions.canPrint ?? true,
        watermark: options.permissions.watermark ?? false,
        expiration_action: options.permissions.expirationAction ?? 'disable'
      },
      metadata: {
        original_file_name: options.metadata.originalFileName || options.documentName,
        file_size: options.metadata.fileSize || 0,
        thumbnail: options.metadata.thumbnail || null,
        preview: options.metadata.preview || null,
        description: options.metadata.description || null,
        tags: options.metadata.tags || null,
        version: options.metadata.version || '1.0'
      },
      created_by: userId,
      access_count: 0
    };

    const { data, error } = await supabase
      .from('public_shares')
      .insert([shareData])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Échec de la création du partage');

    return mapShareFromDB(data);
  } catch (error) {
    console.error('❌ Erreur création partage public:', error);
    throw new Error('Erreur lors de la création du partage public');
  }
}

/**
 * Récupère un partage par son token
 */
export async function getPublicShare(token: string): Promise<PublicShare | null> {
  try {
    const { data, error } = await supabase
      .from('public_shares')
      .select('*')
      .eq('share_token', token)
      .eq('is_active', true)
      .single();

    if (error) return null;
    if (!data) return null;

    return mapShareFromDB(data);
  } catch (error) {
    console.error('❌ Erreur récupération partage public:', error);
    return null;
  }
}

/**
 * Valide un accès à un partage public
 */
export async function validatePublicShare(
  token: string,
  email?: string,
  password?: string
): Promise<ShareValidation> {
  try {
    const share = await getPublicShare(token);
    
    if (!share) {
      return {
        isValid: false,
        isExpired: false,
        isDownloadLimitReached: false,
        isEmailAuthorized: false,
        isPasswordValid: false,
        remainingDownloads: 0,
        timeUntilExpiration: 0
      };
    }

    const now = new Date();
    const validation: ShareValidation = {
      isValid: true,
      isExpired: false,
      isDownloadLimitReached: false,
      isEmailAuthorized: true,
      isPasswordValid: true,
      remainingDownloads: share.maxDownloads ? share.maxDownloads - share.currentDownloads : -1,
      timeUntilExpiration: share.expiresAt ? Math.max(0, share.expiresAt.getTime() - now.getTime()) / 1000 : -1
    };

    // Vérifier l'expiration
    if (share.expiresAt && now > share.expiresAt) {
      validation.isValid = false;
      validation.isExpired = true;
    }

    // Vérifier la limite de téléchargement
    if (share.maxDownloads && share.currentDownloads >= share.maxDownloads) {
      validation.isValid = false;
      validation.isDownloadLimitReached = true;
    }

    // Vérifier l'autorisation email
    if (share.isEmailRestricted && email) {
      const isAuthorized = share.allowedEmails?.includes(email);
      if (!isAuthorized) {
        validation.isValid = false;
        validation.isEmailAuthorized = false;
      }
    }

    // Vérifier le mot de passe
    if (share.isPasswordProtected && password) {
      const isPasswordValid = share.password === password;
      if (!isPasswordValid) {
        validation.isValid = false;
        validation.isPasswordValid = false;
      }
    } else if (share.isPasswordProtected && !password) {
      validation.isValid = false;
      validation.isPasswordValid = false;
    }

    return validation;
  } catch (error) {
    console.error('❌ Erreur validation partage public:', error);
    throw new Error('Erreur lors de la validation du partage public');
  }
}

/**
 * Enregistre un accès à un partage public
 */
export async function recordShareAccess(
  token: string,
  accessType: 'view' | 'download',
  userAgent?: string,
  ipAddress?: string,
  referrer?: string
): Promise<void> {
  try {
    // Mettre à jour les statistiques du partage
    const { error: updateError } = await supabase.rpc('increment_share_access', {
      share_token: token,
      access_type: accessType
    });

    if (updateError) throw updateError;

    // Enregistrer les détails d'accès pour l'analyse
    const { error: analyticsError } = await supabase
      .from('share_analytics')
      .insert({
        share_token: token,
        access_type: accessType,
        user_agent: userAgent,
        ip_address: ipAddress,
        referrer: referrer,
        accessed_at: new Date().toISOString()
      });

    if (analyticsError) {
      console.warn('⚠️ Erreur enregistrement analytique:', analyticsError);
    }
  } catch (error) {
    console.error('❌ Erreur enregistrement accès partage:', error);
    throw new Error('Erreur lors de l\'enregistrement de l\'accès au partage');
  }
}

/**
 * Récupère les partages d'un utilisateur
 */
export async function getUserShares(
  userId: string,
  options: {
    activeOnly?: boolean;
    documentId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<PublicShare[]> {
  try {
    let query = supabase
      .from('public_shares')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (options.activeOnly) {
      query = query.eq('is_active', true);
    }

    if (options.documentId) {
      query = query.eq('document_id', options.documentId);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map(mapShareFromDB);
  } catch (error) {
    console.error('❌ Erreur récupération partages utilisateur:', error);
    throw new Error('Erreur lors de la récupération des partages');
  }
}

/**
 * Met à jour un partage public
 */
export async function updatePublicShare(
  shareId: string,
  updates: Partial<Pick<PublicShare, 
    'expiresAt' | 'maxDownloads' | 'password' | 'allowedEmails' | 'permissions' | 'isActive'
  >>,
  userId: string
): Promise<PublicShare> {
  try {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.expiresAt) {
      updateData.expires_at = updates.expiresAt.toISOString();
    }

    if (updates.allowedEmails) {
      updateData.allowed_emails = updates.allowedEmails;
      updateData.is_email_restricted = updates.allowedEmails.length > 0;
    }

    if (updates.password) {
      updateData.is_password_protected = !!updates.password;
    }

    if (updates.permissions) {
      updateData.permissions = updates.permissions;
    }

    const { data, error } = await supabase
      .from('public_shares')
      .update(updateData)
      .eq('id', shareId)
      .eq('created_by', userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Partage non trouvé');

    return mapShareFromDB(data);
  } catch (error) {
    console.error('❌ Erreur mise à jour partage public:', error);
    throw new Error('Erreur lors de la mise à jour du partage public');
  }
}

/**
 * Supprime un partage public
 */
export async function deletePublicShare(shareId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('public_shares')
      .delete()
      .eq('id', shareId)
      .eq('created_by', userId);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Erreur suppression partage public:', error);
    throw new Error('Erreur lors de la suppression du partage public');
  }
}

/**
 * Désactive un partage public
 */
export async function disablePublicShare(shareId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('public_shares')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', shareId)
      .eq('created_by', userId);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Erreur désactivation partage public:', error);
    throw new Error('Erreur lors de la désactivation du partage public');
  }
}

/**
 * Récupère les analytiques d'un partage
 */
export async function getShareAnalytics(shareId: string, userId: string): Promise<ShareAnalytics> {
  try {
    // Vérifier que l'utilisateur est propriétaire du partage
    const { data: share, error: shareError } = await supabase
      .from('public_shares')
      .select('share_token')
      .eq('id', shareId)
      .eq('created_by', userId)
      .single();

    if (shareError || !share) {
      throw new Error('Partage non trouvé ou accès non autorisé');
    }

    // Récupérer les statistiques de base
    const { data: stats, error: statsError } = await supabase
      .from('public_shares')
      .select('access_count, current_downloads')
      .eq('id', shareId)
      .single();

    if (statsError || !stats) {
      throw new Error('Statistiques non disponibles');
    }

    // Récupérer les analytiques détaillées
    const { data: analytics, error: analyticsError } = await supabase
      .from('share_analytics')
      .select('*')
      .eq('share_token', share.share_token)
      .order('accessed_at', { ascending: false });

    if (analyticsError) {
      console.warn('⚠️ Erreur récupération analytiques détaillées:', analyticsError);
    }

    // Calculer les métriques
    const totalViews = analytics?.filter(a => a.access_type === 'view').length || 0;
    const totalDownloads = analytics?.filter(a => a.access_type === 'download').length || stats.current_downloads;
    const uniqueVisitors = new Set(analytics?.map(a => a.ip_address) || []).size;

    // Statistiques par pays
    const countryStats: Record<string, number> = {};
    analytics?.forEach(a => {
      const country = a.country || 'Unknown';
      countryStats[country] = (countryStats[country] || 0) + 1;
    });

    // Statistiques par referrer
    const referrerStats: Record<string, number> = {};
    analytics?.forEach(a => {
      const referrer = a.referrer || 'Direct';
      referrerStats[referrer] = (referrerStats[referrer] || 0) + 1;
    });

    // Statistiques quotidiennes
    const dailyStats: Record<string, { views: number; downloads: number }> = {};
    analytics?.forEach(a => {
      const date = new Date(a.accessed_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { views: 0, downloads: 0 };
      }
      if (a.access_type === 'view') dailyStats[date].views++;
      else if (a.access_type === 'download') dailyStats[date].downloads++;
    });

    // Analyse des devices
    const deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0 };
    analytics?.forEach(a => {
      const ua = a.user_agent || '';
      if (/Mobile|Android|iPhone|iPad/.test(ua)) {
        if (/iPad/.test(ua)) deviceBreakdown.tablet++;
        else deviceBreakdown.mobile++;
      } else {
        deviceBreakdown.desktop++;
      }
    });

    return {
      shareId,
      totalViews,
      totalDownloads,
      uniqueVisitors,
      averageTimeSpent: 0, // Placeholder - nécessiterait tracking de temps
      bounceRate: 0, // Placeholder - nécessiterait tracking plus avancé
      topCountries: Object.entries(countryStats)
        .map(([country, views]) => ({ country, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10),
      topReferrers: Object.entries(referrerStats)
        .map(([referrer, views]) => ({ referrer, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10),
      dailyStats: Object.entries(dailyStats)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      deviceBreakdown
    };
  } catch (error) {
    console.error('❌ Erreur récupération analytiques partage:', error);
    throw new Error('Erreur lors de la récupération des analytiques du partage');
  }
}

/**
 * Génère un QR code pour le partage
 */
export function generateShareQRCode(share: PublicShare): string {
  const qrData = {
    url: share.publicUrl,
    title: share.documentName,
    type: share.documentType,
    protected: share.isPasswordProtected,
    expires: share.expiresAt?.toISOString()
  };

  // Placeholder pour génération QR code
  // Dans une vraie implémentation, on utiliserait une librairie comme qrcode.js
  return `data:image/png;base64,placeholder_qr_code_${btoa(JSON.stringify(qrData))}`;
}

/**
 * Exporte les statistiques de partage
 */
export function exportShareAnalytics(
  analytics: ShareAnalytics,
  format: 'json' | 'csv' | 'pdf'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(analytics, null, 2);
    
    case 'csv':
      return exportAnalyticsToCSV(analytics);
    
    case 'pdf':
      // Placeholder pour export PDF
      return JSON.stringify(analytics, null, 2);
    
    default:
      return JSON.stringify(analytics, null, 2);
  }
}

/**
 * Export CSV des analytiques
 */
function exportAnalyticsToCSV(analytics: ShareAnalytics): string {
  const headers = [
    'Date',
    'Vues',
    'Téléchargements',
    'Visiteurs uniques',
    'Desktop',
    'Mobile',
    'Tablet'
  ];

  const csvContent = [
    `# Statistiques de partage - ${analytics.shareId}`,
    `# Vues totales: ${analytics.totalViews}`,
    `# Téléchargements totaux: ${analytics.totalDownloads}`,
    `# Visiteurs uniques: ${analytics.uniqueVisitors}`,
    '',
    headers.join(','),
    ...analytics.dailyStats.map(day => [
      day.date,
      day.views,
      day.downloads,
      '', // Placeholder pour visiteurs uniques par jour
      '', // Placeholder pour desktop par jour
      '', // Placeholder pour mobile par jour
      ''  // Placeholder pour tablet par jour
    ].join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Mappe un partage depuis la base de données
 */
function mapShareFromDB(data: any): PublicShare {
  return {
    id: data.id,
    documentId: data.document_id,
    documentName: data.document_name,
    documentType: data.document_type,
    shareToken: data.share_token,
    publicUrl: data.public_url,
    password: data.password || undefined,
    expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    maxDownloads: data.max_downloads || undefined,
    currentDownloads: data.current_downloads,
    allowedEmails: data.allowed_emails || undefined,
    isPasswordProtected: data.is_password_protected,
    isEmailRestricted: data.is_email_restricted,
    isActive: data.is_active,
    permissions: data.permissions,
    metadata: data.metadata,
    createdAt: new Date(data.created_at),
    createdBy: data.created_by,
    lastAccessed: data.last_accessed ? new Date(data.last_accessed) : undefined,
    accessCount: data.access_count
  };
}

/**
 * Vérifie si un document a des partages actifs
 */
export async function hasActiveShares(documentId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('public_shares')
      .select('id')
      .eq('document_id', documentId)
      .eq('is_active', true)
      .limit(1);

    if (error) throw error;
    return !!(data && data.length > 0);
  } catch (error) {
    console.error('❌ Erreur vérification partages actifs:', error);
    return false;
  }
}

/**
 * Récupère les partages expirés pour nettoyage
 */
export async function getExpiredShares(): Promise<PublicShare[]> {
  try {
    const { data, error } = await supabase
      .from('public_shares')
      .select('*')
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true);

    if (error) throw error;
    if (!data) return [];

    return data.map(mapShareFromDB);
  } catch (error) {
    console.error('❌ Erreur récupération partages expirés:', error);
    return [];
  }
}

/**
 * Nettoie automatiquement les partages expirés
 */
export async function cleanupExpiredShares(): Promise<number> {
  try {
    const expiredShares = await getExpiredShares();
    let cleanedCount = 0;

    for (const share of expiredShares) {
      try {
        await disablePublicShare(share.id, share.createdBy);
        cleanedCount++;
      } catch (error) {
        console.error(`❌ Erreur nettoyage partage ${share.id}:`, error);
      }
    }

    return cleanedCount;
  } catch (error) {
    console.error('❌ Erreur nettoyage partages expirés:', error);
    return 0;
  }
}
