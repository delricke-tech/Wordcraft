/**
 * Service PWA (Progressive Web App - application mobile installable)
 * 
 * Ce service gère l'installation de la PWA, le service worker,
 * le cache, les notifications push et l'expérience offline
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'any' | 'natural' | 'landscape' | 'portrait';
  scope: string;
  startUrl: string;
  icons: PWAIcon[];
  categories: PWACategory[];
  screenshots: PWAScreenshot[];
  lang: string;
  dir: 'ltr' | 'rtl';
  preferRelatedApplications: boolean;
  relatedApplications: RelatedApplication[];
  edgeSidePanel?: EdgeSidePanelConfig;
  launchHandler?: LaunchHandler;
  protocolHandlers?: ProtocolHandler[];
  shareTarget?: ShareTargetConfig;
  shortcuts?: PWAShortcut[];
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

export type PWACategory = 
  | 'business'
  | 'education'
  | 'entertainment'
  | 'finance'
  | 'fitness'
  | 'games'
  | 'health'
  | 'lifestyle'
  | 'medical'
  | 'news'
  | 'productivity'
  | 'security'
  | 'shopping'
  | 'social'
  | 'sports'
  | 'travel'
  | 'utilities';

export interface PWAScreenshot {
  src: string;
  sizes: string;
  type: string;
  label?: string;
  platform?: 'narrow' | 'wide';
}

export interface RelatedApplication {
  platform: string;
  url: string;
  id?: string;
}

export interface EdgeSidePanelConfig {
  preferred_width: number;
}

export interface LaunchHandler {
  client_mode: 'navigate-existing' | 'focus-existing' | 'create-new';
}

export interface ProtocolHandler {
  protocol: string;
  url: string;
}

export interface ShareTargetConfig {
  action: string;
  method: 'GET' | 'POST';
  enctype?: string;
  params: ShareTargetParams;
}

export interface ShareTargetParams {
  title?: string;
  text?: string;
  url?: string;
  files?: string[];
}

export interface PWAShortcut {
  name: string;
  shortName?: string;
  description?: string;
  url: string;
  icons: PWAIcon[];
}

export interface ServiceWorkerConfig {
  version: string;
  cacheName: string;
  cacheStrategy: CacheStrategy;
  offlineFallback: string;
  networkTimeout: number;
  maxCacheSize: number;
  maxCacheAge: number;
  precacheAssets: string[];
  runtimeCaching: RuntimeCacheConfig[];
}

export interface CacheStrategy {
  type: 'cacheFirst' | 'networkFirst' | 'cacheOnly' | 'networkOnly' | 'staleWhileRevalidate';
  cacheName?: string;
  networkTimeoutSeconds?: number;
  cacheableResponse: CacheableResponseConfig;
}

export interface CacheableResponseConfig {
  statuses: number[];
  headers: Record<string, string>;
}

export interface RuntimeCacheConfig {
  urlPattern: string;
  handler: string;
  options: CacheStrategy;
}

export interface PWAInstallation {
  id: string;
  userId?: string;
  platform: 'web' | 'ios' | 'android';
  deviceInfo: DeviceInfo;
  installedAt: string;
  lastUsedAt: string;
  isActive: boolean;
  version: string;
  metadata: InstallationMetadata;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  architecture: string;
  model?: string;
  memory?: number;
  cores?: number;
  screenResolution: string;
  pixelRatio: number;
  language: string;
  timezone: string;
  isOnline: boolean;
  connectionType?: string;
  batteryLevel?: number;
}

export interface InstallationMetadata {
  installPromptShown: boolean;
  installPromptDismissed: boolean;
  installSource: 'banner' | 'manual' | 'direct' | 'inapp_browser';
  installTime: number;
  firstLaunchTime: number;
  totalLaunches: number;
  averageSessionDuration: number;
  features: PWAFeature[];
}

export interface PWAFeature {
  name: string;
  enabled: boolean;
  lastUsed?: string;
  usageCount: number;
}

export interface PWANotification {
  id: string;
  userId: string;
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
  timestamp: string;
  expiresAt?: string;
  read: boolean;
  readAt?: string;
  type: NotificationType;
  metadata: NotificationMetadata;
}

export type NotificationType = 
  | 'system'
  | 'reminder'
  | 'update'
  | 'share'
  | 'comment'
  | 'mention'
  | 'document'
  | 'sync'
  | 'offline';

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationMetadata {
  source: string;
  priority: 'low' | 'normal' | 'high';
  ttl?: number;
  renotify?: boolean;
  vibrate?: number[];
  sound?: string;
}

export interface PWAStats {
  totalInstallations: number;
  activeInstallations: number;
  installationsByPlatform: Record<string, number>;
  installationsByVersion: Record<string, number>;
  averageSessionDuration: number;
  totalSessions: number;
  offlineUsage: number;
  cacheHitRate: number;
  notificationStats: {
    sent: number;
    delivered: number;
    clicked: number;
    dismissed: number;
  };
  featureUsage: Record<string, number>;
  performance: {
    averageLoadTime: number;
    cacheSize: number;
    networkRequests: number;
    offlineRequests: number;
  };
}

class PWAService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: any = null;
  private isInstalled: boolean = false;
  private isOnline: boolean = navigator.onLine;
  private installCallbacks: Array<(installed: boolean) => void> = [];

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * Initialise les écouteurs d'événements PWA
   */
  private initializeEventListeners(): void {
    // Écouter l'événement beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('📱 Événement beforeinstallprompt détecté');
      this.deferredPrompt = event;
      this.notifyInstallCallbacks(false);
    });

    // Écouter l'événement appinstalled
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installée avec succès');
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.notifyInstallCallbacks(true);
      this.trackInstallation();
    });

    // Écouter les changements de connexion
    window.addEventListener('online', () => {
      console.log('🌐 Connexion rétablie');
      this.isOnline = true;
      this.handleConnectionChange(true);
    });

    window.addEventListener('offline', () => {
      console.log('📫 Connexion perdue');
      this.isOnline = false;
      this.handleConnectionChange(false);
    });

    // Écouter les clics sur les notifications
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'notification-click') {
          this.handleNotificationClick(event.data.data);
        }
      });
    }
  }

  /**
   * Enregistre le service worker
   */
  async registerServiceWorker(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service Worker non supporté');
        return false;
      }

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.serviceWorkerRegistration = registration;

      // Écouter les mises à jour
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Mise à jour du Service Worker trouvée');
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.handleServiceWorkerUpdate();
            }
          });
        }
      });

      console.log('✅ Service Worker enregistré:', registration.scope);
      return true;

    } catch (error) {
      console.error('❌ Erreur enregistrement Service Worker:', error);
      return false;
    }
  }

  /**
   * Vérifie si la PWA peut être installée
   */
  canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  /**
   * Affiche la prompt d'installation
   */
  async showInstallPrompt(): Promise<boolean> {
    try {
      if (!this.deferredPrompt) {
        console.warn('⚠️ Aucune prompt d\'installation disponible');
        return false;
      }

      const result = await this.deferredPrompt.prompt();
      this.deferredPrompt = null;

      if (result === 'accepted') {
        console.log('✅ Utilisateur a accepté l\'installation');
        return true;
      } else {
        console.log('❌ Utilisateur a refusé l\'installation');
        return false;
      }

    } catch (error) {
      console.error('❌ Erreur prompt d\'installation:', error);
      return false;
    }
  }

  /**
   * Vérifie si la PWA est installée
   */
  isPWAInstalled(): boolean {
    if (this.isInstalled) return true;

    // Vérifier différentes manières selon la plateforme
    const checks = [
      () => window.matchMedia('(display-mode: standalone)').matches,
      () => (window.navigator as any).standalone === true,
      () => document.referrer.includes('android-app://'),
      () => window.location.search.includes('from=homescreen')
    ];

    return checks.some(check => {
      try {
        return check();
      } catch {
        return false;
      }
    });
  }

  /**
   * Obtient la configuration PWA
   */
  getPWAConfig(): PWAConfig {
    return {
      name: 'WordCraft',
      shortName: 'WordCraft',
      description: 'Plateforme IA de gestion de documents et notes',
      themeColor: '#3B82F6',
      backgroundColor: '#ffffff',
      display: 'standalone',
      orientation: 'any',
      scope: '/',
      startUrl: '/',
      icons: [
        {
          src: '/icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png'
        },
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png'
        },
        {
          src: '/icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png'
        },
        {
          src: '/icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png'
        },
        {
          src: '/icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png'
        },
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ],
      categories: ['productivity', 'education'],
      screenshots: [
        {
          src: '/screenshots/desktop-1.png',
          sizes: '1280x720',
          type: 'image/png',
          label: 'Interface principale sur desktop',
          platform: 'wide'
        },
        {
          src: '/screenshots/mobile-1.png',
          sizes: '390x844',
          type: 'image/png',
          label: 'Interface principale sur mobile',
          platform: 'narrow'
        }
      ],
      lang: 'fr',
      dir: 'ltr',
      preferRelatedApplications: false,
      relatedApplications: [],
      shortcuts: [
        {
          name: 'Nouveau document',
          shortName: 'Nouveau',
          description: 'Créer un nouveau document',
          url: '/documents/new',
          icons: [
            {
              src: '/icons/shortcut-new.png',
              sizes: '96x96',
              type: 'image/png'
            }
          ]
        },
        {
          name: 'Recherche',
          shortName: 'Rechercher',
          description: 'Rechercher des documents',
          url: '/search',
          icons: [
            {
              src: '/icons/shortcut-search.png',
              sizes: '96x96',
              type: 'image/png'
            }
          ]
        }
      ],
      shareTarget: {
        action: '/share',
        method: 'POST',
        enctype: 'multipart/form-data',
        params: {
          title: 'title',
          text: 'text',
          url: 'url',
          files: ['files']
        }
      }
    };
  }

  /**
   * Génère le manifeste PWA
   */
  generateManifest(): string {
    const config = this.getPWAConfig();
    return JSON.stringify(config, null, 2);
  }

  /**
   * Demande la permission pour les notifications
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    try {
      if (!('Notification' in window)) {
        console.warn('⚠️ Notifications non supportées');
        return 'denied';
      }

      const permission = await Notification.requestPermission();
      console.log('📢 Permission notifications:', permission);
      return permission;

    } catch (error) {
      console.error('❌ Erreur demande permission notifications:', error);
      return 'denied';
    }
  }

  /**
   * Envoie une notification push
   */
  async sendNotification(
    userId: string,
    notification: Omit<PWANotification, 'id' | 'userId' | 'timestamp' | 'read' | 'readAt'>
  ): Promise<string> {
    try {
      const notificationData: PWANotification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        timestamp: new Date().toISOString(),
        read: false,
        ...notification
      };

      // Sauvegarder la notification
      const { data, error } = await supabase
        .from('pwa_notifications')
        .insert({
          id: notificationData.id,
          user_id: userId,
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
          expires_at: notificationData.expiresAt,
          read: false,
          type: notificationData.type,
          metadata: notificationData.metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Envoyer via le service worker si disponible
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(notificationData.title, {
          body: notificationData.body,
          icon: notificationData.icon,
          badge: notificationData.badge,
          tag: notificationData.tag,
          data: notificationData.data,
          requireInteraction: notificationData.requireInteraction,
          silent: notificationData.silent
        });
      }

      console.log('📢 Notification envoyée:', notificationData.id);
      return notificationData.id;

    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
      throw new Error(`Échec de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Vérifie l'état de la connexion
   */
  getConnectionStatus(): {
    isOnline: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  } {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

    return {
      isOnline: this.isOnline,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData
    };
  }

  /**
   * Obtient les informations sur l'appareil
   */
  getDeviceInfo(): DeviceInfo {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      architecture: (navigator as any).userAgentData?.platform || 'unknown',
      model: (navigator as any).userAgentData?.model,
      memory: (navigator as any).deviceMemory,
      cores: navigator.hardwareConcurrency,
      screenResolution: `${screen.width}x${screen.height}`,
      pixelRatio: window.devicePixelRatio,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isOnline: this.isOnline,
      connectionType: connection?.effectiveType,
      batteryLevel: undefined // Nécessite l'API Battery (non standardisée)
    };
  }

  /**
   * Suit l'installation de la PWA
   */
  private async trackInstallation(): Promise<void> {
    try {
      const deviceInfo = this.getDeviceInfo();
      
      await supabase
        .from('pwa_installations')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          platform: this.detectPlatform(),
          device_info: deviceInfo,
          installed_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
          is_active: true,
          version: this.getCurrentVersion(),
          metadata: {
            installPromptShown: !!this.deferredPrompt,
            installPromptDismissed: false,
            installSource: 'manual',
            installTime: Date.now(),
            firstLaunchTime: Date.now(),
            totalLaunches: 1,
            averageSessionDuration: 0,
            features: []
          }
        });

    } catch (error) {
      console.error('❌ Erreur suivi installation:', error);
    }
  }

  /**
   * Détecte la plateforme
   */
  private detectPlatform(): 'web' | 'ios' | 'android' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    } else {
      return 'web';
    }
  }

  /**
   * Obtient la version actuelle
   */
  private getCurrentVersion(): string {
    return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  }

  /**
   * Gère les changements de connexion
   */
  private handleConnectionChange(isOnline: boolean): void {
    if (isOnline) {
      // Synchroniser les données en attente
      this.syncPendingData();
    } else {
      // Activer le mode hors ligne
      this.enableOfflineMode();
    }
  }

  /**
   * Gère la mise à jour du service worker
   */
  private async handleServiceWorkerUpdate(): Promise<void> {
    try {
      // Notifier l'utilisateur de la mise à jour
      await this.sendNotification(
        (await supabase.auth.getUser()).data.user?.id || 'anonymous',
        {
          title: 'Mise à jour disponible',
          body: 'Une nouvelle version de WordCraft est disponible',
          icon: '/icons/update.png',
          tag: 'app-update',
          type: 'update',
          metadata: {
            source: 'pwa',
            priority: 'high',
            renotify: true
          }
        }
      );

    } catch (error) {
      console.error('❌ Erreur gestion mise à jour SW:', error);
    }
  }

  /**
   * Gère le clic sur une notification
   */
  private handleNotificationClick(data: any): void {
    console.log('📢 Notification cliquée:', data);
    
    // Rediriger vers la page appropriée
    if (data.url) {
      window.location.href = data.url;
    }

    // Marquer la notification comme lue
    if (data.notificationId) {
      this.markNotificationAsRead(data.notificationId);
    }
  }

  /**
   * Marque une notification comme lue
   */
  private async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('pwa_notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

    } catch (error) {
      console.error('❌ Erreur marquage notification lue:', error);
    }
  }

  /**
   * Synchronise les données en attente
   */
  private async syncPendingData(): Promise<void> {
    try {
      if (this.serviceWorkerRegistration) {
        // Envoyer un message au service worker pour synchroniser
        this.serviceWorkerRegistration.active?.postMessage({
          type: 'SYNC_PENDING_DATA'
        });
      }

    } catch (error) {
      console.error('❌ Erreur synchronisation données:', error);
    }
  }

  /**
   * Active le mode hors ligne
   */
  private enableOfflineMode(): void {
    try {
      if (this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration.active?.postMessage({
          type: 'ENABLE_OFFLINE_MODE'
        });
      }

    } catch (error) {
      console.error('❌ Erreur activation mode hors ligne:', error);
    }
  }

  /**
   * Notifie les callbacks d'installation
   */
  private notifyInstallCallbacks(installed: boolean): void {
    this.installCallbacks.forEach(callback => callback(installed));
  }

  /**
   * Ajoute un callback d'écoute d'installation
   */
  onInstallPrompt(callback: (installed: boolean) => void): void {
    this.installCallbacks.push(callback);
  }

  /**
   * Obtient les statistiques PWA
   */
  async getPWAStats(): Promise<PWAStats> {
    try {
      const { data, error } = await supabase.rpc('get_pwa_stats');

      if (error) throw error;

      const stats = data || {
        total_installations: 0,
        active_installations: 0,
        installations_by_platform: {},
        installations_by_version: {},
        average_session_duration: 0,
        total_sessions: 0,
        offline_usage: 0,
        cache_hit_rate: 0,
        notification_stats: {
          sent: 0,
          delivered: 0,
          clicked: 0,
          dismissed: 0
        },
        feature_usage: {},
        performance: {
          average_load_time: 0,
          cache_size: 0,
          network_requests: 0,
          offline_requests: 0
        }
      };

      return {
        totalInstallations: stats.total_installations,
        activeInstallations: stats.active_installations,
        installationsByPlatform: stats.installations_by_platform,
        installationsByVersion: stats.installations_by_version,
        averageSessionDuration: stats.average_session_duration,
        totalSessions: stats.total_sessions,
        offlineUsage: stats.offline_usage,
        cacheHitRate: stats.cache_hit_rate,
        notificationStats: stats.notification_stats,
        featureUsage: stats.feature_usage,
        performance: stats.performance
      };

    } catch (error) {
      console.error('❌ Erreur statistiques PWA:', error);
      throw new Error(`Échec des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

// Instance singleton
export const pwaService = new PWAService();

// Export des fonctions utilitaires
export const registerServiceWorker = () => pwaService.registerServiceWorker();
export const canInstallPWA = () => pwaService.canInstall();
export const showInstallPrompt = () => pwaService.showInstallPrompt();
export const isPWAInstalled = () => pwaService.isPWAInstalled();
export const getPWAConfig = () => pwaService.getPWAConfig();
export const generatePWAManifest = () => pwaService.generateManifest();
export const requestNotificationPermission = () => pwaService.requestNotificationPermission();
export const sendPWANotification = (
  userId: string,
  notification: Omit<PWANotification, 'id' | 'userId' | 'timestamp' | 'read' | 'readAt'>
) => pwaService.sendNotification(userId, notification);
export const getConnectionStatus = () => pwaService.getConnectionStatus();
export const getDeviceInfo = () => pwaService.getDeviceInfo();
export const onPWAInstallPrompt = (callback: (installed: boolean) => void) => pwaService.onInstallPrompt(callback);
export const getPWAStats = () => pwaService.getPWAStats();
