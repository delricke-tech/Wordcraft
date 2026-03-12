/**
 * Service de notifications push (web push API)
 * 
 * Ce service gère les notifications push via la Web Push API,
 * l'abonnement des utilisateurs, l'envoi de notifications
 * et la gestion des permissions
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent: string;
  platform: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string;
  metadata: SubscriptionMetadata;
}

export interface SubscriptionMetadata {
  deviceInfo: DeviceInfo;
  browserInfo: BrowserInfo;
  location?: LocationInfo;
  preferences: NotificationPreferences;
  statistics: SubscriptionStatistics;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  osVersion: string;
  manufacturer?: string;
  model?: string;
  screenResolution: string;
  pixelRatio: number;
  memory?: number;
  cores?: number;
  language: string;
  timezone: string;
}

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  engineVersion: string;
  isMobile: boolean;
  isOnline: boolean;
  cookieEnabled: boolean;
  doNotTrack: boolean;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface NotificationPreferences {
  enabled: boolean;
  categories: NotificationCategory[];
  quietHours: QuietHours;
  frequency: NotificationFrequency;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  desktop: boolean;
}

export interface NotificationCategory {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  sound?: string;
  vibrationPattern?: number[];
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  timezone: string;
  exceptions: QuietHoursException[];
}

export interface QuietHoursException {
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  reason?: string;
}

export type NotificationFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'never';

export interface SubscriptionStatistics {
  totalSent: number;
  totalDelivered: number;
  totalClicked: number;
  totalDismissed: number;
  lastSentAt?: string;
  lastDeliveredAt?: string;
  lastClickedAt?: string;
  averageResponseTime: number; // en secondes
  clickRate: number; // pourcentage
  deliveryRate: number; // pourcentage
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  ttl?: number; // en secondes
  timestamp: string;
  expiresAt?: string;
  category: string;
  priority: number;
  metadata: NotificationMetadata;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
  placeholder?: string;
}

export interface NotificationMetadata {
  source: string;
  campaign?: string;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  customData?: Record<string, any>;
  tracking: {
    sent: boolean;
    delivered: boolean;
    clicked: boolean;
    dismissed: boolean;
    error?: string;
  };
}

export interface PushCampaign {
  id: string;
  name: string;
  description?: string;
  category: string;
  targetAudience: CampaignTarget;
  content: CampaignContent;
  schedule: CampaignSchedule;
  status: CampaignStatus;
  statistics: CampaignStatistics;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CampaignTarget {
  users: string[];
  segments: string[];
  filters: CampaignFilter[];
  excludeUsers: string[];
  maxRecipients?: number;
}

export interface CampaignFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

export interface CampaignContent {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  actions?: NotificationAction[];
  data?: any;
  customizations?: Record<string, any>;
}

export interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring';
  sendAt?: string;
  timezone?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    timeOfDay?: string;
    endDate?: string;
  };
}

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled' | 'failed';

export interface CampaignStatistics {
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalClicked: number;
  totalDismissed: number;
  totalErrors: number;
  clickRate: number;
  deliveryRate: number;
  errorRate: number;
  averageResponseTime: number;
  startedAt?: string;
  completedAt?: string;
}

export interface PushNotificationStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  subscriptionsByPlatform: Record<string, number>;
  subscriptionsByCategory: Record<string, number>;
  deliveryStats: {
    totalSent: number;
    totalDelivered: number;
    totalClicked: number;
    totalDismissed: number;
    deliveryRate: number;
    clickRate: number;
    averageResponseTime: number;
  };
  campaignStats: {
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    averageCampaignPerformance: number;
  };
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    averageNotificationsPerUser: number;
    optInRate: number;
    optOutRate: number;
  };
}

class PushNotificationsService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private isSupported: boolean = false;
  private permissionState: NotificationPermission = 'default';
  private notificationCallbacks: Map<string, (event: any) => void> = new Map();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialise le service de notifications push
   */
  private async initializeService(): Promise<void> {
    try {
      // Vérifier le support du navigateur
      this.isSupported = 'serviceWorker' in navigator && 'PushManager' in navigator && 'Notification' in navigator;
      
      if (!this.isSupported) {
        console.warn('⚠️ Notifications push non supportées par ce navigateur');
        return;
      }

      // Enregistrer le service worker
      await this.registerServiceWorker();

      // Vérifier l'état de la permission
      await this.checkPermissionState();

      console.log('🔔 Service notifications push initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation service notifications push:', error);
    }
  }

  /**
   * Enregistre le service worker
   */
  private async registerServiceWorker(): Promise<void> {
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Écouter les mises à jour
      this.registration.addEventListener('updatefound', () => {
        console.log('🔄 Mise à jour du service worker trouvée');
      });

      console.log('✅ Service worker enregistré:', this.registration.scope);

    } catch (error) {
      console.error('❌ Erreur enregistrement service worker:', error);
      throw error;
    }
  }

  /**
   * Vérifie l'état de la permission
   */
  private async checkPermissionState(): Promise<void> {
    try {
      this.permissionState = await Notification.requestPermission();
      console.log('🔔 État permission notifications:', this.permissionState);
    } catch (error) {
      console.error('❌ Erreur vérification permission:', error);
      this.permissionState = 'denied';
    }
  }

  /**
   * Demande la permission pour les notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    try {
      if (!this.isSupported) {
        throw new Error('Notifications push non supportées');
      }

      const permission = await Notification.requestPermission();
      this.permissionState = permission;

      if (permission === 'granted') {
        console.log('✅ Permission notifications accordée');
      } else {
        console.warn('⚠️ Permission notifications refusée');
      }

      return permission;

    } catch (error) {
      console.error('❌ Erreur demande permission notifications:', error);
      throw new Error(`Échec de la demande: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * S'abonne aux notifications push
   */
  async subscribe(userId: string): Promise<PushSubscription> {
    try {
      if (!this.isSupported) {
        throw new Error('Notifications push non supportées');
      }

      if (this.permissionState !== 'granted') {
        const permission = await this.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Permission non accordée');
        }
      }

      if (!this.registration) {
        throw new Error('Service worker non enregistré');
      }

      // S'abonner au push service
      const pushSubscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.getVAPIDPublicKey())
      });

      // Sauvegarder l'abonnement
      const subscription = await this.saveSubscription(userId, pushSubscription);

      this.subscription = pushSubscription;
      console.log('✅ Abonnement push réussi');

      return subscription;

    } catch (error) {
      console.error('❌ Erreur abonnement push:', error);
      throw new Error(`Échec de l'abonnement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Se désabonne des notifications push
   */
  async unsubscribe(): Promise<void> {
    try {
      if (!this.subscription) {
        console.warn('⚠️ Aucun abonnement actif');
        return;
      }

      await this.subscription.unsubscribe();
      await this.removeSubscription(this.subscription);

      this.subscription = null;
      console.log('✅ Désabonnement push réussi');

    } catch (error) {
      console.error('❌ Erreur désabonnement push:', error);
      throw new Error(`Échec du désabonnement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Envoie une notification push
   */
  async sendNotification(notification: Omit<PushNotification, 'id' | 'timestamp' | 'metadata'>, targetUsers?: string[]): Promise<string> {
    try {
      const notificationData: PushNotification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'push_service',
          tracking: {
            sent: true,
            delivered: false,
            clicked: false,
            dismissed: false
          }
        },
        ...notification
      };

      // Sauvegarder la notification
      const { data, error } = await supabase
        .from('push_notifications')
        .insert({
          id: notificationData.id,
          title: notificationData.title,
          body: notificationData.body,
          icon: notificationData.icon,
          image: notificationData.image,
          badge: notificationData.badge,
          tag: notificationData.tag,
          data: notificationData.data,
          actions: notificationData.actions || [],
          require_interaction: notificationData.requireInteraction || false,
          silent: notificationData.silent || false,
          urgency: notificationData.urgency || 'normal',
          ttl: notificationData.ttl,
          expires_at: notificationData.expiresAt,
          category: notificationData.category,
          priority: notificationData.priority,
          metadata: notificationData.metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Envoyer via le service push
      if (targetUsers && targetUsers.length > 0) {
        await this.sendToUsers(notificationData, targetUsers);
      } else {
        await this.sendToAll(notificationData);
      }

      console.log('🔔 Notification push envoyée:', notificationData.id);
      return notificationData.id;

    } catch (error) {
      console.error('❌ Erreur envoi notification push:', error);
      throw new Error(`Échec de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Envoie une notification à des utilisateurs spécifiques
   */
  private async sendToUsers(notification: PushNotification, userIds: string[]): Promise<void> {
    try {
      // Récupérer les abonnements des utilisateurs
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', userIds)
        .eq('is_active', true);

      if (error) throw error;

      // Envoyer à chaque abonnement
      const payloads = (subscriptions || []).map(subscription => ({
        subscription: {
          endpoint: subscription.endpoint,
          keys: subscription.keys
        },
        payload: this.createPayload(notification),
        options: {
          TTL: notification.ttl || 3600,
          urgency: notification.urgency || 'normal'
        }
      }));

      // Envoyer via l'API push
      await this.sendPushNotifications(payloads);

    } catch (error) {
      console.error('❌ Erreur envoi notification aux utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Envoie une notification à tous les abonnés
   */
  private async sendToAll(notification: PushNotification): Promise<void> {
    try {
      // Récupérer tous les abonnements actifs
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Limiter le nombre d'envois pour éviter de surcharger
      const maxRecipients = 1000;
      const limitedSubscriptions = (subscriptions || []).slice(0, maxRecipients);

      const payloads = limitedSubscriptions.map(subscription => ({
        subscription: {
          endpoint: subscription.endpoint,
          keys: subscription.keys
        },
        payload: this.createPayload(notification),
        options: {
          TTL: notification.ttl || 3600,
          urgency: notification.urgency || 'normal'
        }
      }));

      // Envoyer via l'API push
      await this.sendPushNotifications(payloads);

    } catch (error) {
      console.error('❌ Erreur envoi notification à tous:', error);
      throw error;
    }
  }

  /**
   * Crée le payload de la notification
   */
  private createPayload(notification: PushNotification): string {
    return JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      image: notification.image,
      badge: notification.badge,
      tag: notification.tag,
      data: notification.data,
      actions: notification.actions,
      requireInteraction: notification.requireInteraction,
      silent: notification.silent,
      timestamp: notification.timestamp,
      category: notification.category,
      priority: notification.priority
    });
  }

  /**
   * Envoie les notifications push via l'API
   */
  private async sendPushNotifications(payloads: any[]): Promise<void> {
    try {
      // Appeler l'endpoint d'envoi (à implémenter côté serveur)
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          notifications: payloads
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur d'envoi push: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔔 Notifications push envoyées:', result);

    } catch (error) {
      console.error('❌ Erreur envoi notifications push:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde un abonnement
   */
  private async saveSubscription(userId: string, pushSubscription: PushSubscription): Promise<PushSubscription> {
    try {
      const subscriptionData = {
        user_id: userId,
        endpoint: pushSubscription.endpoint,
        keys: pushSubscription.toJSON().keys,
        user_agent: navigator.userAgent,
        platform: this.getPlatform(),
        is_active: true,
        device_info: this.getDeviceInfo(),
        browser_info: this.getBrowserInfo(),
        preferences: this.getDefaultPreferences(),
        statistics: this.getDefaultStatistics()
      };

      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert(subscriptionData)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de sauvegarder l\'abonnement');

      return this.mapSubscriptionFromDB(data);

    } catch (error) {
      console.error('❌ Erreur sauvegarde abonnement:', error);
      throw error;
    }
  }

  /**
   * Supprime un abonnement
   */
  private async removeSubscription(pushSubscription: PushSubscription): Promise<void> {
    try {
      await supabase
        .from('push_subscriptions')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('endpoint', pushSubscription.endpoint);

    } catch (error) {
      console.error('❌ Erreur suppression abonnement:', error);
    }
  }

  /**
   * Obtient la clé VAPID publique
   */
  private getVAPIDPublicKey(): string {
    // Cette clé devrait venir des variables d'environnement
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'your-vapid-public-key';
  }

  /**
   * Convertit une chaîne base64 en Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Obtient la plateforme actuelle
   */
  private getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    
    return 'unknown';
  }

  /**
   * Obtient les informations sur l'appareil
   */
  private getDeviceInfo(): DeviceInfo {
    return {
      type: this.getDeviceType(),
      os: navigator.platform,
      osVersion: navigator.userAgent.match(/[\d.]+/)?.[0] || 'unknown',
      screenResolution: `${screen.width}x${screen.height}`,
      pixelRatio: window.devicePixelRatio,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Obtient le type d'appareil
   */
  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod/.test(userAgent)) {
      return 'mobile';
    }
    if (/tablet|ipad/.test(userAgent)) {
      return 'tablet';
    }
    
    return 'desktop';
  }

  /**
   * Obtient les informations sur le navigateur
   */
  private getBrowserInfo(): BrowserInfo {
    const userAgent = navigator.userAgent;
    
    // Détection simple du navigateur
    let name = 'unknown';
    let version = 'unknown';
    
    if (userAgent.includes('Chrome')) {
      name = 'Chrome';
      version = userAgent.match(/Chrome\/([\d.]+)/)?.[1] || 'unknown';
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      version = userAgent.match(/Firefox\/([\d.]+)/)?.[1] || 'unknown';
    } else if (userAgent.includes('Safari')) {
      name = 'Safari';
      version = userAgent.match(/Version\/([\d.]+)/)?.[1] || 'unknown';
    } else if (userAgent.includes('Edge')) {
      name = 'Edge';
      version = userAgent.match(/Edge\/([\d.]+)/)?.[1] || 'unknown';
    }

    return {
      name,
      version,
      engine: 'unknown',
      engineVersion: 'unknown',
      isMobile: /mobile|android|iphone|ipad/.test(userAgent),
      isOnline: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1'
    };
  }

  /**
   * Obtient les préférences par défaut
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      categories: [
        { id: 'general', name: 'Général', enabled: true, priority: 1 },
        { id: 'documents', name: 'Documents', enabled: true, priority: 2 },
        { id: 'collaboration', name: 'Collaboration', enabled: true, priority: 3 },
        { id: 'system', name: 'Système', enabled: true, priority: 4 }
      ],
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        exceptions: []
      },
      frequency: 'realtime',
      sound: true,
      vibration: true,
      badge: true,
      desktop: true
    };
  }

  /**
   * Obtient les statistiques par défaut
   */
  private getDefaultStatistics(): SubscriptionStatistics {
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalClicked: 0,
      totalDismissed: 0,
      averageResponseTime: 0,
      clickRate: 0,
      deliveryRate: 0
    };
  }

  /**
   * Obtient le token d'authentification
   */
  private async getAuthToken(): Promise<string> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session?.access_token || '';
    } catch (error) {
      console.error('❌ Erreur récupération token auth:', error);
      return '';
    }
  }

  /**
   * Obtient les statistiques des notifications push
   */
  async getPushNotificationStats(): Promise<PushNotificationStats> {
    try {
      const { data, error } = await supabase.rpc('get_push_notification_stats');

      if (error) throw error;

      const stats = data || {
        total_subscriptions: 0,
        active_subscriptions: 0,
        subscriptions_by_platform: {},
        subscriptions_by_category: {},
        delivery_stats: {
          total_sent: 0,
          total_delivered: 0,
          total_clicked: 0,
          total_dismissed: 0,
          delivery_rate: 0,
          click_rate: 0,
          average_response_time: 0
        },
        campaign_stats: {
          total_campaigns: 0,
          active_campaigns: 0,
          completed_campaigns: 0,
          average_campaign_performance: 0
        },
        user_engagement: {
          total_users: 0,
          active_users: 0,
          average_notifications_per_user: 0,
          opt_in_rate: 0,
          opt_out_rate: 0
        }
      };

      return {
        totalSubscriptions: stats.total_subscriptions,
        activeSubscriptions: stats.active_subscriptions,
        subscriptionsByPlatform: stats.subscriptions_by_platform,
        subscriptionsByCategory: stats.subscriptions_by_category,
        deliveryStats: stats.delivery_stats,
        campaignStats: stats.campaign_stats,
        userEngagement: stats.user_engagement
      };

    } catch (error) {
      console.error('❌ Erreur statistiques notifications push:', error);
      throw new Error(`Échec des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Vérifie si les notifications push sont supportées
   */
  isSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Obtient l'état actuel de la permission
   */
  getPermissionState(): NotificationPermission {
    return this.permissionState;
  }

  /**
   * Vérifie si l'utilisateur est abonné
   */
  isSubscribed(): boolean {
    return !!this.subscription;
  }

  // Mappeur depuis la base de données
  private mapSubscriptionFromDB(data: any): PushSubscription {
    return {
      id: data.id,
      userId: data.user_id,
      endpoint: data.endpoint,
      keys: data.keys,
      userAgent: data.user_agent,
      platform: data.platform,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastUsedAt: data.last_used_at,
      metadata: data.metadata || {}
    };
  }
}

// Instance singleton
export const pushNotificationsService = new PushNotificationsService();

// Export des fonctions utilitaires
export const requestNotificationPermission = () => pushNotificationsService.requestPermission();
export const subscribeToPushNotifications = (userId: string) => pushNotificationsService.subscribe(userId);

// NOUVELLES FONCTIONNALITÉS AVANCÉES

/**
 * Interface pour les notifications multi-canaux
 */
export interface MultiChannelNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  ttl?: number;
  timestamp: number;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  category: NotificationCategory;
  targeting?: NotificationTargeting;
  scheduling?: NotificationScheduling;
  analytics?: NotificationAnalytics;
}

/**
 * Canaux de notification
 */
export type NotificationChannel = 'push' | 'email' | 'sms' | 'webhook' | 'in_app' | 'desktop' | 'mobile';

/**
 * Action de notification
 */
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
  placeholder?: string;
}

/**
 * Priorité de notification
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Catégorie de notification
 */
export type NotificationCategory = 
  | 'system'
  | 'security'
  | 'collaboration'
  | 'document'
  | 'message'
  | 'reminder'
  | 'deadline'
  | 'achievement'
  | 'marketing'
  | 'social';

/**
 * Ciblage des notifications
 */
export interface NotificationTargeting {
  users?: string[];
  groups?: string[];
  roles?: string[];
  segments?: string[];
  filters?: NotificationFilter[];
  excludeUsers?: string[];
  excludeGroups?: string[];
}

/**
 * Filtre de notification
 */
export interface NotificationFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

/**
 * Planification des notifications
 */
export interface NotificationScheduling {
  type: 'immediate' | 'scheduled' | 'recurring' | 'conditional';
  sendAt?: Date;
  timezone?: string;
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    interval?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: Date;
  };
  conditions?: NotificationCondition[];
}

/**
 * Condition d'envoi
 */
export interface NotificationCondition {
  type: 'time' | 'event' | 'user_state' | 'external';
  operator: string;
  value: any;
}

/**
 * Analytiques de notification
 */
export interface NotificationAnalytics {
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  dismissed: number;
  failed: number;
  deliveryRate: number;
  readRate: number;
  clickRate: number;
  averageDeliveryTime: number;
  channelBreakdown: Record<NotificationChannel, ChannelAnalytics>;
  userSegmentBreakdown: Record<string, number>;
  timeBreakdown: Record<string, number>;
}

/**
 * Analytiques par canal
 */
export interface ChannelAnalytics {
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  failed: number;
  deliveryRate: number;
  readRate: number;
  clickRate: number;
  averageDeliveryTime: number;
}

/**
 * Template de notification
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  category: NotificationCategory;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  title: string;
  body: string;
  variables: NotificationVariable[];
  actions?: NotificationAction[];
  conditions?: NotificationCondition[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  usageCount: number;
  lastUsed?: Date;
}

/**
 * Variable de template
 */
export interface NotificationVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'user' | 'document' | 'custom';
  defaultValue?: any;
  required: boolean;
  description?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: string[];
  };
}

/**
 * Préférences de notification utilisateur
 */
export interface UserNotificationPreferences {
  userId: string;
  channels: {
    push: ChannelPreferences;
    email: ChannelPreferences;
    sms: ChannelPreferences;
    webhook: ChannelPreferences;
    in_app: ChannelPreferences;
    desktop: ChannelPreferences;
    mobile: ChannelPreferences;
  };
  categories: Record<NotificationCategory, CategoryPreferences>;
  quietHours: QuietHours;
  frequencyLimits: FrequencyLimits;
  doNotDisturb: DoNotDisturbSettings;
  customRules: CustomNotificationRule[];
  updatedAt: Date;
}

/**
 * Préférences par canal
 */
export interface ChannelPreferences {
  enabled: boolean;
  priority: NotificationPriority;
  quietHours: boolean;
  maxPerHour?: number;
  maxPerDay?: number;
  sounds: boolean;
  vibrations: boolean;
  led: boolean;
  badge: boolean;
}

/**
 * Préférences par catégorie
 */
export interface CategoryPreferences {
  enabled: boolean;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  quietHours: boolean;
  batch: boolean;
  batchInterval?: number; // en minutes
}

/**
 * Heures de calme
 */
export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  timezone: string;
  weekends: boolean;
  holidays: boolean;
  emergencyOverride: boolean;
}

/**
 * Limites de fréquence
 */
export interface FrequencyLimits {
  maxPerHour: number;
  maxPerDay: number;
  maxPerWeek: number;
  cooldownPeriod: number; // en minutes
  burstLimit: number;
  burstWindow: number; // en minutes
}

/**
 * Paramètres Ne Pas Déranger
 */
export interface DoNotDisturbSettings {
  enabled: boolean;
  schedule: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    timezone: string;
  };
  exceptions: {
    repeatCalls: boolean;
    urgentMessages: boolean;
    criticalAlerts: boolean;
    specificUsers: string[];
    specificCategories: NotificationCategory[];
  };
  autoReply?: {
    enabled: boolean;
    message: string;
    categories: NotificationCategory[];
  };
}

/**
 * Règle de notification personnalisée
 */
export interface CustomNotificationRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditions: NotificationCondition[];
  actions: NotificationRuleAction[];
  priority: number;
  createdBy: string;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

/**
 * Action de règle de notification
 */
export interface NotificationRuleAction {
  type: 'allow' | 'block' | 'modify' | 'redirect' | 'delay';
  parameters?: Record<string, any>;
}

/**
 * Campagne de notification
 */
export interface NotificationCampaign {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  targeting: NotificationTargeting;
  scheduling: NotificationScheduling;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'cancelled';
  progress: CampaignProgress;
  analytics: CampaignAnalytics;
  createdBy: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Progression de campagne
 */
export interface CampaignProgress {
  totalRecipients: number;
  sentNotifications: number;
  deliveredNotifications: number;
  readNotifications: number;
  clickedNotifications: number;
  failedNotifications: number;
  percentageComplete: number;
  estimatedCompletion?: Date;
}

/**
 * Analytiques de campagne
 */
export interface CampaignAnalytics {
  deliveryRate: number;
  readRate: number;
  clickRate: number;
  conversionRate: number;
  unsubscribeRate: number;
  averageDeliveryTime: number;
  channelPerformance: Record<NotificationChannel, ChannelAnalytics>;
  segmentPerformance: Record<string, CampaignSegmentAnalytics>;
  timePerformance: Record<string, number>;
}

/**
 * Analytiques par segment de campagne
 */
export interface CampaignSegmentAnalytics {
  recipients: number;
  delivered: number;
  read: number;
  clicked: number;
  converted: number;
  deliveryRate: number;
  readRate: number;
  clickRate: number;
  conversionRate: number;
}

/**
 * Envoie une notification multi-canaux
 */
export async function sendMultiChannelNotification(
  notification: Omit<MultiChannelNotification, 'id' | 'timestamp' | 'analytics'>
): Promise<MultiChannelNotification> {
  try {
    const notificationId = generateNotificationId();
    const timestamp = Date.now();
    
    // Créer la notification complète
    const fullNotification: MultiChannelNotification = {
      ...notification,
      id: notificationId,
      timestamp,
      analytics: {
        sent: 0,
        delivered: 0,
        read: 0,
        clicked: 0,
        dismissed: 0,
        failed: 0,
        deliveryRate: 0,
        readRate: 0,
        clickRate: 0,
        averageDeliveryTime: 0,
        channelBreakdown: {} as Record<NotificationChannel, ChannelAnalytics>,
        userSegmentBreakdown: {},
        timeBreakdown: {}
      }
    };

    // Récupérer les utilisateurs ciblés
    const targetUsers = await getTargetUsers(notification.targeting);
    
    // Envoyer via chaque canal activé
    const channelPromises = notification.channels.map(channel => 
      sendNotificationViaChannel(fullNotification, channel, targetUsers)
    );

    const channelResults = await Promise.allSettled(channelPromises);
    
    // Agréger les résultats
    channelResults.forEach((result, index) => {
      const channel = notification.channels[index];
      if (result.status === 'fulfilled') {
        const channelAnalytics = result.value;
        fullNotification.analytics!.channelBreakdown[channel] = channelAnalytics;
        fullNotification.analytics!.sent += channelAnalytics.sent;
        fullNotification.analytics!.delivered += channelAnalytics.delivered;
        fullNotification.analytics!.read += channelAnalytics.read;
        fullNotification.analytics!.clicked += channelAnalytics.clicked;
        fullNotification.analytics!.failed += channelAnalytics.failed;
      } else {
        console.error(`❌ Erreur canal ${channel}:`, result.reason);
        fullNotification.analytics!.failed += targetUsers.length;
      }
    });

    // Calculer les taux
    const total = fullNotification.analytics!.sent;
    if (total > 0) {
      fullNotification.analytics!.deliveryRate = (fullNotification.analytics!.delivered / total) * 100;
      fullNotification.analytics!.readRate = (fullNotification.analytics!.read / total) * 100;
      fullNotification.analytics!.clickRate = (fullNotification.analytics!.clicked / total) * 100;
    }

    // Sauvegarder en base de données
    await saveNotificationAnalytics(fullNotification);

    return fullNotification;
  } catch (error) {
    console.error('❌ Erreur envoi notification multi-canaux:', error);
    throw new Error('Erreur lors de l\'envoi de la notification multi-canaux');
  }
}

/**
 * Envoie une notification via un canal spécifique
 */
async function sendNotificationViaChannel(
  notification: MultiChannelNotification,
  channel: NotificationChannel,
  users: string[]
): Promise<ChannelAnalytics> {
  const startTime = Date.now();
  const analytics: ChannelAnalytics = {
    sent: 0,
    delivered: 0,
    read: 0,
    clicked: 0,
    failed: 0,
    deliveryRate: 0,
    readRate: 0,
    clickRate: 0,
    averageDeliveryTime: 0
  };

  try {
    switch (channel) {
      case 'push':
        return await sendPushNotification(notification, users);
      case 'email':
        return await sendEmailNotification(notification, users);
      case 'sms':
        return await sendSMSNotification(notification, users);
      case 'webhook':
        return await sendWebhookNotification(notification, users);
      case 'in_app':
        return await sendInAppNotification(notification, users);
      case 'desktop':
        return await sendDesktopNotification(notification, users);
      case 'mobile':
        return await sendMobileNotification(notification, users);
      default:
        throw new Error(`Canal non supporté: ${channel}`);
    }
  } catch (error) {
    console.error(`❌ Erreur envoi canal ${channel}:`, error);
    analytics.failed = users.length;
    return analytics;
  }
}

/**
 * Envoie une notification push
 */
async function sendPushNotification(
  notification: MultiChannelNotification,
  users: string[]
): Promise<ChannelAnalytics> {
  const analytics: ChannelAnalytics = {
    sent: 0,
    delivered: 0,
    read: 0,
    clicked: 0,
    failed: 0,
    deliveryRate: 0,
    readRate: 0,
    clickRate: 0,
    averageDeliveryTime: 0
  };

  try {
    // Récupérer les abonnements push des utilisateurs
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', users)
      .eq('is_active', true);

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      analytics.failed = users.length;
      return analytics;
    }

    // Envoyer à chaque abonnement
    for (const subscription of subscriptions) {
      try {
        const payload = {
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
          image: notification.image,
          badge: notification.badge,
          tag: notification.tag,
          data: notification.data,
          actions: notification.actions,
          requireInteraction: notification.requireInteraction,
          silent: notification.silent,
          urgency: notification.urgency,
          ttl: notification.ttl,
          timestamp: notification.timestamp
        };

        // Utiliser le service push existant
        await pushNotificationsService.sendNotification(subscription, payload);
        analytics.sent++;
        analytics.delivered++; // Simplifié - en réalité, on attendrait la confirmation
      } catch (error) {
        console.error(`❌ Erreur envoi push à ${subscription.user_id}:`, error);
        analytics.failed++;
      }
    }

    // Calculer les taux
    if (analytics.sent > 0) {
      analytics.deliveryRate = (analytics.delivered / analytics.sent) * 100;
    }

    return analytics;
  } catch (error) {
    console.error('❌ Erreur envoi notifications push:', error);
    analytics.failed = users.length;
    return analytics;
  }
}

/**
 * Envoie une notification email
 */
async function sendEmailNotification(
  notification: MultiChannelNotification,
  users: string[]
): Promise<ChannelAnalytics> {
  const analytics: ChannelAnalytics = {
    sent: 0,
    delivered: 0,
    read: 0,
    clicked: 0,
    failed: 0,
    deliveryRate: 0,
    readRate: 0,
    clickRate: 0,
    averageDeliveryTime: 0
  };

  try {
    // Récupérer les emails des utilisateurs
    const { data: userProfiles, error } = await supabase
      .from('user_profiles')
      .select('id, email, name')
      .in('id', users);

    if (error) throw error;
    if (!userProfiles || userProfiles.length === 0) {
      analytics.failed = users.length;
      return analytics;
    }

    // Envoyer les emails
    for (const user of userProfiles) {
      try {
        const emailData = {
          to: user.email,
          subject: notification.title,
          template: 'notification',
          data: {
            userName: user.name,
            title: notification.title,
            body: notification.body,
            actions: notification.actions,
            data: notification.data
          }
        };

        // Placeholder pour envoi email - intégrer avec service email existant
        await sendEmail(emailData);
        analytics.sent++;
        analytics.delivered++; // Simplifié
      } catch (error) {
        console.error(`❌ Erreur envoi email à ${user.email}:`, error);
        analytics.failed++;
      }
    }

    if (analytics.sent > 0) {
      analytics.deliveryRate = (analytics.delivered / analytics.sent) * 100;
    }

    return analytics;
  } catch (error) {
    console.error('❌ Erreur envoi notifications email:', error);
    analytics.failed = users.length;
    return analytics;
  }
}

/**
 * Envoie une notification SMS
 */
async function sendSMSNotification(
  notification: MultiChannelNotification,
  users: string[]
): Promise<ChannelAnalytics> {
  const analytics: ChannelAnalytics = {
    sent: 0,
    delivered: 0,
    read: 0,
    clicked: 0,
    failed: 0,
    deliveryRate: 0,
    readRate: 0,
    clickRate: 0,
    averageDeliveryTime: 0
  };

  try {
    // Récupérer les numéros de téléphone des utilisateurs
    const { data: userProfiles, error } = await supabase
      .from('user_profiles')
      .select('id, phone, name')
      .in('id', users)
      .not('phone', 'is', null);

    if (error) throw error;
    if (!userProfiles || userProfiles.length === 0) {
      analytics.failed = users.length;
      return analytics;
    }

    // Envoyer les SMS
    for (const user of userProfiles) {
      try {
        const smsData = {
          to: user.phone,
          message: `${notification.title}: ${notification.body}`,
          priority: notification.priority
        };

        // Placeholder pour envoi SMS
        await sendSMS(smsData);
        analytics.sent++;
        analytics.delivered++; // Simplifié
      } catch (error) {
        console.error(`❌ Erreur envoi SMS à ${user.phone}:`, error);
        analytics.failed++;
      }
    }

    if (analytics.sent > 0) {
      analytics.deliveryRate = (analytics.delivered / analytics.sent) * 100;
    }

    return analytics;
  } catch (error) {
    console.error('❌ Erreur envoi notifications SMS:', error);
    analytics.failed = users.length;
    return analytics;
  }
}

/**
 * Envoie une notification webhook
 */
async function sendWebhookNotification(
  notification: MultiChannelNotification,
  users: string[]
): Promise<ChannelAnalytics> {
  const analytics: ChannelAnalytics = {
    sent: 0,
    delivered: 0,
    read: 0,
    clicked: 0,
    failed: 0,
    deliveryRate: 0,
    readRate: 0,
    clickRate: 0,
    averageDeliveryTime: 0
  };

  try {
    // Récupérer les webhooks des utilisateurs
    const { data: webhooks, error } = await supabase
      .from('user_webhooks')
      .select('*')
      .in('user_id', users)
      .eq('is_active', true);

    if (error) throw error;
    if (!webhooks || webhooks.length === 0) {
      analytics.failed = users.length;
      return analytics;
    }

    // Envoyer les webhooks
    for (const webhook of webhooks) {
      try {
        const payload = {
          notification: {
            id: notification.id,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            timestamp: notification.timestamp,
            category: notification.category,
            priority: notification.priority
          },
          user: {
            id: webhook.user_id
          }
        };

        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Notification-Signature': generateWebhookSignature(payload, webhook.secret)
          },
          body: JSON.stringify(payload)
        });

        analytics.sent++;
        analytics.delivered++;
      } catch (error) {
        console.error(`❌ Erreur envoi webhook ${webhook.url}:`, error);
        analytics.failed++;
      }
    }

    if (analytics.sent > 0) {
      analytics.deliveryRate = (analytics.delivered / analytics.sent) * 100;
    }

    return analytics;
  } catch (error) {
    console.error('❌ Erreur envoi notifications webhook:', error);
    analytics.failed = users.length;
    return analytics;
  }
}

/**
 * Envoie une notification in-app
 */
async function sendInAppNotification(
  notification: MultiChannelNotification,
  users: string[]
): Promise<ChannelAnalytics> {
  const analytics: ChannelAnalytics = {
    sent: 0,
    delivered: 0,
    read: 0,
    clicked: 0,
    failed: 0,
    deliveryRate: 0,
    readRate: 0,
    clickRate: 0,
    averageDeliveryTime: 0
  };

  try {
    // Créer les notifications in-app
    const notifications = users.map(userId => ({
      user_id: userId,
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      image: notification.image,
      data: notification.data,
      actions: notification.actions,
      category: notification.category,
      priority: notification.priority,
      read: false,
      clicked: false,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('in_app_notifications')
      .insert(notifications)
      .select();

    if (error) throw error;
    if (!data) {
      analytics.failed = users.length;
      return analytics;
    }

    analytics.sent = data.length;
    analytics.delivered = data.length; // Les notifications in-app sont instantanément "livrées"

    if (analytics.sent > 0) {
      analytics.deliveryRate = 100;
    }

    return analytics;
  } catch (error) {
    console.error('❌ Erreur envoi notifications in-app:', error);
    analytics.failed = users.length;
    return analytics;
  }
}

/**
 * Envoie une notification desktop
 */
async function sendDesktopNotification(
  notification: MultiChannelNotification,
  users: string[]
): Promise<ChannelAnalytics> {
  // Similaire à push mais spécifique aux desktop
  return await sendPushNotification(notification, users);
}

/**
 * Envoie une notification mobile
 */
async function sendMobileNotification(
  notification: MultiChannelNotification,
  users: string[]
): Promise<ChannelAnalytics> {
  // Similaire à push mais spécifique aux mobiles
  return await sendPushNotification(notification, users);
}

/**
 * Récupère les utilisateurs ciblés
 */
async function getTargetUsers(targeting?: NotificationTargeting): Promise<string[]> {
  if (!targeting) return [];

  try {
    let query = supabase.from('user_profiles').select('id');

    // Appliquer les filtres
    if (targeting.users && targeting.users.length > 0) {
      query = query.in('id', targeting.users);
    }

    if (targeting.groups && targeting.groups.length > 0) {
      query = query.in('group_id', targeting.groups);
    }

    if (targeting.roles && targeting.roles.length > 0) {
      query = query.in('role', targeting.roles);
    }

    // Appliquer les filtres personnalisés
    if (targeting.filters && targeting.filters.length > 0) {
      targeting.filters.forEach(filter => {
        switch (filter.operator) {
          case 'equals':
            query = query.eq(filter.field, filter.value);
            break;
          case 'not_equals':
            query = query.neq(filter.field, filter.value);
            break;
          case 'contains':
            query = query.like(filter.field, `%${filter.value}%`);
            break;
          case 'in':
            query = query.in(filter.field, filter.value);
            break;
          // Ajouter d'autres opérateurs au besoin
        }
      });
    }

    // Exclusions
    if (targeting.excludeUsers && targeting.excludeUsers.length > 0) {
      query = query.not('id', 'in', targeting.excludeUsers);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return [];

    return data.map(user => user.id);
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs ciblés:', error);
    return [];
  }
}

/**
 * Crée un template de notification
 */
export async function createNotificationTemplate(
  name: string,
  category: NotificationCategory,
  channels: NotificationChannel[],
  title: string,
  body: string,
  variables: NotificationVariable[] = [],
  actions: NotificationAction[] = [],
  priority: NotificationPriority = 'normal',
  userId: string
): Promise<NotificationTemplate> {
  try {
    const templateData = {
      name,
      description: null,
      category,
      channels,
      priority,
      title,
      body,
      variables,
      actions,
      conditions: null,
      is_active: true,
      created_by: userId,
      created_at: new Date().toISOString(),
      usage_count: 0
    };

    const { data, error } = await supabase
      .from('notification_templates')
      .insert([templateData])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Échec de la création du template');

    return mapTemplateFromDB(data);
  } catch (error) {
    console.error('❌ Erreur création template notification:', error);
    throw new Error('Erreur lors de la création du template de notification');
  }
}

/**
 * Applique un template de notification
 */
export async function applyNotificationTemplate(
  templateId: string,
  variables: Record<string, any> = {},
  targeting?: NotificationTargeting,
  scheduling?: NotificationScheduling
): Promise<Omit<MultiChannelNotification, 'id' | 'timestamp' | 'analytics'>> {
  try {
    const { data: template, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;
    if (!template) throw new Error('Template non trouvé');

    // Incrémenter le compteur d'utilisation
    await supabase
      .from('notification_templates')
      .update({ 
        usage_count: template.usage_count + 1,
        last_used: new Date().toISOString()
      })
      .eq('id', templateId);

    // Remplacer les variables
    let title = template.title;
    let body = template.body;

    template.variables.forEach(variable => {
      const value = variables[variable.name] || variable.defaultValue || `[${variable.name}]`;
      const regex = new RegExp(`\\{${variable.name}\\}`, 'g');
      title = title.replace(regex, value);
      body = body.replace(regex, value);
    });

    return {
      title,
      body,
      icon: undefined,
      image: undefined,
      badge: undefined,
      tag: undefined,
      data: {},
      actions: template.actions || [],
      requireInteraction: false,
      silent: false,
      urgency: 'normal',
      ttl: undefined,
      channels: template.channels,
      priority: template.priority,
      category: template.category,
      targeting,
      scheduling
    };
  } catch (error) {
    console.error('❌ Erreur application template notification:', error);
    throw new Error('Erreur lors de l\'application du template de notification');
  }
}

/**
 * Gère les préférences de notification d'un utilisateur
 */
export async function manageUserNotificationPreferences(
  userId: string,
  preferences: Partial<UserNotificationPreferences>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('❌ Erreur gestion préférences notifications:', error);
    throw new Error('Erreur lors de la gestion des préférences de notifications');
  }
}

/**
 * Fonctions utilitaires
 */
function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateWebhookSignature(payload: any, secret: string): string {
  // Placeholder pour signature HMAC
  return `signature_${btoa(JSON.stringify(payload))}_${secret}`;
}

async function sendEmail(emailData: any): Promise<void> {
  // Placeholder pour intégration avec service email existant
  console.log('📧 Envoi email:', emailData);
}

async function sendSMS(smsData: any): Promise<void> {
  // Placeholder pour intégration avec service SMS existant
  console.log('📱 Envoi SMS:', smsData);
}

async function saveNotificationAnalytics(notification: MultiChannelNotification): Promise<void> {
  try {
    const { error } = await supabase
      .from('notification_analytics')
      .insert({
        notification_id: notification.id,
        analytics: notification.analytics,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('❌ Erreur sauvegarde analytiques notification:', error);
  }
}

function mapTemplateFromDB(data: any): NotificationTemplate {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    category: data.category,
    channels: data.channels,
    priority: data.priority,
    title: data.title,
    body: data.body,
    variables: data.variables || [],
    actions: data.actions || [],
    conditions: data.conditions || [],
    isActive: data.is_active,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
    usageCount: data.usage_count,
    lastUsed: data.last_used ? new Date(data.last_used) : undefined
  };
}
export const unsubscribeFromPushNotifications = () => pushNotificationsService.unsubscribe();
export const sendPushNotification = (
  notification: Omit<PushNotification, 'id' | 'timestamp' | 'metadata'>,
  targetUsers?: string[]
) => pushNotificationsService.sendNotification(notification, targetUsers);
export const isPushNotificationSupported = () => pushNotificationsService.isSupported();
export const getNotificationPermissionState = () => pushNotificationsService.getPermissionState();
export const isSubscribedToPushNotifications = () => pushNotificationsService.isSubscribed();
export const getPushNotificationStats = () => pushNotificationsService.getPushNotificationStats();
