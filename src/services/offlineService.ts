/**
 * Service mode hors ligne (service worker avancé)
 * 
 * Ce service gère le mode hors ligne avec service worker avancé,
 * la synchronisation, le cache intelligent et les fonctionnalités offline-first
 * 
 * Date: 11 mars 2026
 */

export interface OfflineStorage {
  id: string;
  type: StorageType;
  key: string;
  value: any;
  size: number; // en bytes
  compressed: boolean;
  encrypted: boolean;
  version: number;
  checksum: string;
  createdAt: string;
  updatedAt: string;
  accessedAt: string;
  expiresAt?: string;
  metadata: StorageMetadata;
}

export type StorageType = 
  | 'document'
  | 'user_data'
  | 'session'
  | 'cache'
  | 'sync_queue'
  | 'settings'
  | 'analytics'
  | 'temp';

export interface StorageMetadata {
  source: string;
  userId?: string;
  sessionId?: string;
  priority: StoragePriority;
  category: string;
  tags: string[];
  dependencies: string[];
  syncStatus: SyncStatus;
  lastSyncAt?: string;
  conflictResolution?: ConflictResolution;
  customData?: Record<string, any>;
}

export type StoragePriority = 'low' | 'normal' | 'high' | 'critical';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'error';
export type ConflictResolution = 'client_wins' | 'server_wins' | 'merge' | 'manual';

export interface SyncQueueItem {
  id: string;
  type: SyncOperationType;
  entityType: string;
  entityId: string;
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  status: SyncStatus;
  error?: string;
  priority: StoragePriority;
  metadata: SyncMetadata;
}

export type SyncOperationType = 
  | 'create'
  | 'update'
  | 'delete'
  | 'upload'
  | 'download'
  | 'sync';

export interface SyncMetadata {
  userId: string;
  deviceId: string;
  sessionId?: string;
  correlationId?: string;
  dependencies: string[];
  conflictResolution: ConflictResolution;
  customData?: Record<string, any>;
}

export interface OfflineCapabilities {
  supported: boolean;
  storageQuota: {
    used: number;
    available: number;
    total: number;
  };
  features: {
    backgroundSync: boolean;
    pushNotifications: boolean;
    geolocation: boolean;
    camera: boolean;
    microphone: boolean;
    bluetooth: boolean;
    nfc: boolean;
  };
  networkStatus: {
    online: boolean;
    effectiveType: NetworkEffectiveType;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
}

export type NetworkEffectiveType = 
  | 'slow-2g'
  | '2g'
  | '3g'
  | '4g';

export interface OfflineStats {
  totalStorage: number;
  usedStorage: number;
  availableStorage: number;
  cacheHitRate: number;
  syncQueueSize: number;
  pendingSyncs: number;
  failedSyncs: number;
  conflictsCount: number;
  lastSyncAt: string;
  averageSyncTime: number; // en millisecondes
  offlineTime: number; // en minutes
  features: {
    documentsOffline: number;
    userDataOffline: number;
    cacheEntries: number;
    syncQueueItems: number;
  };
}

export interface OfflineConfiguration {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // en secondes
  maxStorageSize: number; // en MB
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  backgroundSync: boolean;
  conflictResolution: ConflictResolution;
  retryPolicy: RetryPolicy;
  cacheStrategy: CacheStrategy;
  notifications: NotificationSettings;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number; // en millisecondes
  maxDelay: number; // en millisecondes
  jitter: boolean;
}

export interface CacheStrategy {
  strategy: 'cache_first' | 'network_first' | 'cache_only' | 'network_only' | 'stale_while_revalidate';
  maxAge: number; // en secondes
  maxEntries: number;
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
}

export interface NotificationSettings {
  syncComplete: boolean;
  syncFailed: boolean;
  conflicts: boolean;
  storageWarning: boolean;
  offlineMode: boolean;
}

class OfflineService {
  private serviceWorker: ServiceWorker | null = null;
  private isOnline: boolean = navigator.onLine;
  private capabilities: OfflineCapabilities;
  private configuration: OfflineConfiguration;
  private syncQueue: Map<string, SyncQueueItem> = new Map();
  private storage: Map<string, OfflineStorage> = new Map();
  private eventCallbacks: Map<string, (event: any) => void> = new Map();
  private syncTimer: NodeJS.Timeout | null = null;
  private deviceId: string;

  constructor() {
    this.capabilities = this.initializeCapabilities();
    this.configuration = this.initializeConfiguration();
    this.deviceId = this.generateDeviceId();
    this.initializeService();
  }

  /**
   * Initialise le service hors ligne
   */
  private async initializeService(): Promise<void> {
    try {
      // Enregistrer le service worker
      await this.registerServiceWorker();

      // Initialiser les écouteurs d'événements
      this.initializeEventListeners();

      // Charger les données depuis le stockage local
      await this.loadFromStorage();

      // Démarrer la synchronisation si activée
      if (this.configuration.autoSync && this.isOnline) {
        this.startAutoSync();
      }

      console.log('📱 Service hors ligne initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation service hors ligne:', error);
    }
  }

  /**
   * Initialise les capacités hors ligne
   */
  private initializeCapabilities(): OfflineCapabilities {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    return {
      supported: 'serviceWorker' in navigator && 'caches' in window && 'indexedDB' in window,
      storageQuota: {
        used: 0,
        available: 0,
        total: 0
      },
      features: {
        backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
        pushNotifications: 'serviceWorker' in navigator && 'PushManager' in window,
        geolocation: 'geolocation' in navigator,
        camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        bluetooth: 'bluetooth' in navigator,
        nfc: 'nfc' in navigator
      },
      networkStatus: {
        online: navigator.onLine,
        effectiveType: connection?.effectiveType || '4g',
        downlink: connection?.downlink || 10,
        rtt: connection?.rtt || 100,
        saveData: connection?.saveData || false
      }
    };
  }

  /**
   * Initialise la configuration par défaut
   */
  private initializeConfiguration(): OfflineConfiguration {
    return {
      enabled: true,
      autoSync: true,
      syncInterval: 30000, // 30 secondes
      maxStorageSize: 1024, // 1GB
      compressionEnabled: true,
      encryptionEnabled: false,
      backgroundSync: true,
      conflictResolution: 'client_wins',
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
        maxDelay: 30000,
        jitter: true
      },
      cacheStrategy: {
        strategy: 'cache_first',
        maxAge: 3600, // 1 heure
        maxEntries: 1000,
        evictionPolicy: 'lru'
      },
      notifications: {
        syncComplete: true,
        syncFailed: true,
        conflicts: true,
        storageWarning: true,
        offlineMode: true
      }
    };
  }

  /**
   * Enregistre le service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker non supporté');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.serviceWorker = registration.active;
      
      // Écouter les mises à jour
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Mise à jour du Service Worker trouvée');
      });

      console.log('✅ Service Worker enregistré:', registration.scope);

    } catch (error) {
      console.error('❌ Erreur enregistrement Service Worker:', error);
      throw error;
    }
  }

  /**
   * Initialise les écouteurs d'événements
   */
  private initializeEventListeners(): void {
    // Événements réseau
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Événements du service worker
    if (this.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
    }

    // Événements de stockage
    window.addEventListener('storage', this.handleStorageChange.bind(this));

    // Événements de synchronisation en arrière-plan
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        // Note: Background Sync API peut ne pas être disponible dans tous les navigateurs
        console.log('🔄 Background Sync API disponible');
      });
    }
  }

  /**
   * Gère la connexion en ligne
   */
  private handleOnline(): void {
    this.isOnline = true;
    this.capabilities.networkStatus.online = true;
    
    console.log('🌐 Connexion rétablie');
    this.emit('online', { timestamp: new Date().toISOString() });

    // Démarrer la synchronisation automatique
    if (this.configuration.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Gère la déconnexion
   */
  private handleOffline(): void {
    this.isOnline = false;
    this.capabilities.networkStatus.online = false;
    
    console.log('📱 Mode hors ligne activé');
    this.emit('offline', { timestamp: new Date().toISOString() });

    // Arrêter la synchronisation automatique
    this.stopAutoSync();
  }

  /**
   * Gère les messages du service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;
    
    switch (type) {
      case 'sync_complete':
        this.handleSyncComplete(data);
        break;
      case 'sync_failed':
        this.handleSyncFailed(data);
        break;
      case 'cache_updated':
        this.handleCacheUpdated(data);
        break;
      default:
        console.log('📱 Message Service Worker:', type, data);
    }
  }

  /**
   * Gère la synchronisation en arrière-plan
   */
  private handleBackgroundSync(event: any): void {
    console.log('🔄 Synchronisation en arrière-plan:', event.tag);
    
    // Traiter la synchronisation
    this.processSyncQueue();
  }

  /**
   * Gère les changements de stockage
   */
  private handleStorageChange(event: StorageEvent): void {
    if (event.key && event.key.startsWith('offline_')) {
      console.log('📱 Changement de stockage détecté:', event.key);
      this.emit('storage_changed', { key: event.key, oldValue: event.oldValue, newValue: event.newValue });
    }
  }

  /**
   * Stocke une donnée hors ligne
   */
  async store(key: string, value: any, options: {
    type?: StorageType;
    priority?: StoragePriority;
    expiresAt?: string;
    tags?: string[];
    compress?: boolean;
    encrypt?: boolean;
  } = {}): Promise<void> {
    try {
      const storageItem: OfflineStorage = {
        id: this.generateId(),
        type: options.type || 'cache',
        key,
        value: options.compress ? await this.compress(value) : value,
        size: this.calculateSize(value),
        compressed: options.compress || this.configuration.compressionEnabled,
        encrypted: options.encrypt || this.configuration.encryptionEnabled,
        version: 1,
        checksum: this.calculateChecksum(value),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessedAt: new Date().toISOString(),
        expiresAt: options.expiresAt,
        metadata: {
          source: 'user',
          priority: options.priority || 'normal',
          category: this.getCategoryFromType(options.type || 'cache'),
          tags: options.tags || [],
          dependencies: [],
          syncStatus: 'pending',
          conflictResolution: this.configuration.conflictResolution
        }
      };

      // Ajouter au stockage local
      this.storage.set(key, storageItem);

      // Sauvegarder dans IndexedDB
      await this.saveToIndexedDB(storageItem);

      console.log('📱 Donnée stockée hors ligne:', key);

    } catch (error) {
      console.error('❌ Erreur stockage hors ligne:', error);
      throw error;
    }
  }

  /**
   * Récupère une donnée hors ligne
   */
  async retrieve(key: string): Promise<any> {
    try {
      // Vérifier d'abord le stockage en mémoire
      let item = this.storage.get(key);

      if (!item) {
        // Charger depuis IndexedDB
        item = await this.loadFromIndexedDB(key) || undefined;
        if (item) {
          this.storage.set(key, item);
        }
      }

      if (!item) {
        return undefined;
      }

      // Vérifier l'expiration
      if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
        await this.remove(key);
        return null;
      }

      // Mettre à jour l'accès
      item.accessedAt = new Date().toISOString();
      await this.saveToIndexedDB(item);

      // Décompresser si nécessaire
      let value = item.value;
      if (item.compressed) {
        value = await this.decompress(value);
      }

      console.log('📱 Donnée récupérée hors ligne:', key);
      return value;

    } catch (error) {
      console.error('❌ Erreur récupération hors ligne:', error);
      throw error;
    }
  }

  /**
   * Supprime une donnée hors ligne
   */
  async remove(key: string): Promise<void> {
    try {
      // Supprimer du stockage en mémoire
      this.storage.delete(key);

      // Supprimer d'IndexedDB
      await this.removeFromIndexedDB(key);

      console.log('📱 Donnée supprimée hors ligne:', key);

    } catch (error) {
      console.error('❌ Erreur suppression hors ligne:', error);
      throw error;
    }
  }

  /**
   * Ajoute une opération à la queue de synchronisation
   */
  async addToSyncQueue(operation: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void> {
    try {
      const syncItem: SyncQueueItem = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: 'pending',
        ...operation
      };

      this.syncQueue.set(syncItem.id, syncItem);
      await this.saveSyncQueue();

      console.log('🔄 Opération ajoutée à la queue de sync:', syncItem.id);

      // Traiter immédiatement si en ligne
      if (this.isOnline && this.configuration.autoSync) {
        this.processSyncQueue();
      }

    } catch (error) {
      console.error('❌ Erreur ajout à la queue de sync:', error);
      throw error;
    }
  }

  /**
   * Traite la queue de synchronisation
   */
  async processSyncQueue(): Promise<void> {
    if (!this.isOnline) {
      console.log('📱 Mode hors ligne - synchronisation en pause');
      return;
    }

    const pendingItems = Array.from(this.syncQueue.values())
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        // Prioriser par priorité puis par timestamp
        const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

    for (const item of pendingItems) {
      try {
        await this.processSyncItem(item);
      } catch (error) {
        console.error('❌ Erreur traitement item sync:', item.id, error);
        await this.handleSyncError(item, error);
      }
    }
  }

  /**
   * Traite un item de synchronisation
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    item.status = 'syncing';
    await this.saveSyncQueue();

    try {
      // Simuler la synchronisation
      await this.simulateSyncOperation(item);

      item.status = 'synced';
      this.syncQueue.delete(item.id);
      await this.saveSyncQueue();

      console.log('✅ Synchronisation réussie:', item.id);

    } catch (error) {
      await this.handleSyncError(item, error);
    }
  }

  /**
   * Simule une opération de synchronisation
   */
  private async simulateSyncOperation(item: SyncQueueItem): Promise<void> {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

    // Simuler une erreur occasionnelle
    if (Math.random() < 0.1) {
      throw new Error('Erreur de synchronisation simulée');
    }

    console.log('🔄 Sync simulée:', item.type, item.entityType, item.entityId);
  }

  /**
   * Gère les erreurs de synchronisation
   */
  private async handleSyncError(item: SyncQueueItem, error: any): Promise<void> {
    item.retryCount++;
    item.error = error instanceof Error ? error.message : 'Erreur inconnue';

    if (item.retryCount >= item.maxRetries) {
      item.status = 'error';
      console.error('❌ Échec de la synchronisation après retries:', item.id);
    } else {
      item.status = 'pending';
      // Calculer le délai de retry avec backoff exponentiel
      const delay = Math.min(
        this.configuration.retryPolicy.initialDelay * 
        Math.pow(this.configuration.retryPolicy.backoffMultiplier, item.retryCount - 1),
        this.configuration.retryPolicy.maxDelay
      );
      
      setTimeout(() => {
        this.processSyncItem(item);
      }, delay);
    }

    await this.saveSyncQueue();
  }

  /**
   * Démarre la synchronisation automatique
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.processSyncQueue();
    }, this.configuration.syncInterval);

    console.log('🔄 Synchronisation automatique démarrée');
  }

  /**
   * Arrête la synchronisation automatique
   */
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    console.log('⏸️ Synchronisation automatique arrêtée');
  }

  /**
   * Obtient les statistiques hors ligne
   */
  async getStats(): Promise<OfflineStats> {
    try {
      const totalStorage = await this.getStorageQuota();
      const usedStorage = this.calculateUsedStorage();
      const pendingSyncs = Array.from(this.syncQueue.values()).filter(item => item.status === 'pending').length;
      const failedSyncs = Array.from(this.syncQueue.values()).filter(item => item.status === 'error').length;
      const conflictsCount = Array.from(this.syncQueue.values()).filter(item => item.status === 'conflict').length;

      return {
        totalStorage: totalStorage.total,
        usedStorage,
        availableStorage: totalStorage.total - usedStorage,
        cacheHitRate: 0.85, // Simulé
        syncQueueSize: this.syncQueue.size,
        pendingSyncs,
        failedSyncs,
        conflictsCount,
        lastSyncAt: new Date().toISOString(),
        averageSyncTime: 1500, // Simulé
        offlineTime: 0, // À calculer
        features: {
          documentsOffline: Array.from(this.storage.values()).filter(item => item.type === 'document').length,
          userDataOffline: Array.from(this.storage.values()).filter(item => item.type === 'user_data').length,
          cacheEntries: Array.from(this.storage.values()).filter(item => item.type === 'cache').length,
          syncQueueItems: this.syncQueue.size
        }
      };

    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
      throw error;
    }
  }

  /**
   * Vide le cache hors ligne
   */
  async clearCache(): Promise<void> {
    try {
      // Vider le stockage en mémoire
      this.storage.clear();

      // Vider IndexedDB
      await this.clearIndexedDB();

      // Vider la queue de synchronisation
      this.syncQueue.clear();
      await this.saveSyncQueue();

      console.log('📱 Cache hors ligne vidé');

    } catch (error) {
      console.error('❌ Erreur vidage cache:', error);
      throw error;
    }
  }

  /**
   * Vérifie si le mode hors ligne est supporté
   */
  isSupported(): boolean {
    return this.capabilities.supported;
  }

  /**
   * Vérifie si l'application est en ligne
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Obtient les capacités hors ligne
   */
  getCapabilities(): OfflineCapabilities {
    return this.capabilities;
  }

  /**
   * Met à jour la configuration
   */
  updateConfiguration(config: Partial<OfflineConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
    
    // Redémarrer la synchronisation si nécessaire
    if (config.autoSync !== undefined) {
      if (config.autoSync && this.isOnline) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }

    console.log('📱 Configuration mise à jour');
  }

  // Méthodes utilitaires privées

  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('offline_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('offline_device_id', deviceId);
    }
    return deviceId;
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Approximation
  }

  private calculateChecksum(value: any): string {
    const str = JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private getCategoryFromType(type: StorageType): string {
    const categoryMap: Record<StorageType, string> = {
      document: 'documents',
      user_data: 'user',
      session: 'session',
      cache: 'cache',
      sync_queue: 'sync',
      settings: 'settings',
      analytics: 'analytics',
      temp: 'temp'
    };
    return categoryMap[type] || 'other';
  }

  private async compress(data: any): Promise<any> {
    // Simuler la compression
    return { _compressed: true, data: btoa(JSON.stringify(data)) };
  }

  private async decompress(data: any): Promise<any> {
    // Simuler la décompression
    if (data._compressed) {
      return JSON.parse(atob(data.data));
    }
    return data;
  }

  private async saveToIndexedDB(item: OfflineStorage): Promise<void> {
    // Simuler la sauvegarde IndexedDB
    localStorage.setItem(`offline_${item.key}`, JSON.stringify(item));
  }

  private async loadFromIndexedDB(key: string): Promise<OfflineStorage | undefined> {
    // Simuler le chargement IndexedDB
    const item = localStorage.getItem(`offline_${key}`);
    return item ? JSON.parse(item) : undefined;
  }

  private async removeFromIndexedDB(key: string): Promise<void> {
    // Simuler la suppression IndexedDB
    localStorage.removeItem(`offline_${key}`);
  }

  private async clearIndexedDB(): Promise<void> {
    // Simuler le vidage IndexedDB
    const keys = Object.keys(localStorage).filter(key => key.startsWith('offline_'));
    keys.forEach(key => localStorage.removeItem(key));
  }

  private async loadFromStorage(): Promise<void> {
    // Charger les données depuis localStorage
    const keys = Object.keys(localStorage).filter(key => key.startsWith('offline_'));
    
    for (const key of keys) {
      try {
        const item = JSON.parse(localStorage.getItem(key)!);
        const storageKey = key.replace('offline_', '');
        this.storage.set(storageKey, item);
      } catch (error) {
        console.error('❌ Erreur chargement item:', key, error);
      }
    }

    // Charger la queue de synchronisation
    const syncQueueData = localStorage.getItem('offline_sync_queue');
    if (syncQueueData) {
      try {
        const queue = JSON.parse(syncQueueData);
        this.syncQueue = new Map(Object.entries(queue));
      } catch (error) {
        console.error('❌ Erreur chargement queue sync:', error);
      }
    }

    console.log('📱 Données hors ligne chargées:', this.storage.size, 'items');
  }

  private async saveSyncQueue(): Promise<void> {
    const queueObject = Object.fromEntries(this.syncQueue);
    localStorage.setItem('offline_sync_queue', JSON.stringify(queueObject));
  }

  private async getStorageQuota(): Promise<{ used: number; available: number; total: number }> {
    // Simuler le quota de stockage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0),
        total: estimate.quota || 0
      };
    }

    // Valeur par défaut
    return {
      used: this.calculateUsedStorage(),
      available: this.configuration.maxStorageSize * 1024 * 1024 - this.calculateUsedStorage(),
      total: this.configuration.maxStorageSize * 1024 * 1024
    };
  }

  private calculateUsedStorage(): number {
    return Array.from(this.storage.values()).reduce((total, item) => total + item.size, 0);
  }

  private handleSyncComplete(data: any): void {
    console.log('✅ Synchronisation complétée:', data);
    this.emit('sync_complete', data);
  }

  private handleSyncFailed(data: any): void {
    console.log('❌ Échec de synchronisation:', data);
    this.emit('sync_failed', data);
  }

  private handleCacheUpdated(data: any): void {
    console.log('🔄 Cache mis à jour:', data);
    this.emit('cache_updated', data);
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
        console.error('❌ Erreur callback événement:', error);
      }
    }
  }
}

// Instance singleton
export const offlineService = new OfflineService();

// Export des fonctions utilitaires
export const storeOffline = (key: string, value: any, options?: {
  type?: StorageType;
  priority?: StoragePriority;
  expiresAt?: string;
  tags?: string[];
  compress?: boolean;
  encrypt?: boolean;
}) => offlineService.store(key, value, options);

export const retrieveOffline = (key: string) => offlineService.retrieve(key);
export const removeOffline = (key: string) => offlineService.remove(key);
export const addToSyncQueue = (operation: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>) => 
  offlineService.addToSyncQueue(operation);

export const getOfflineStats = () => offlineService.getStats();
export const clearOfflineCache = () => offlineService.clearCache();
export const isOfflineSupported = () => offlineService.isSupported();
export const isOnline = () => offlineService.isOnlineStatus();
export const getOfflineCapabilities = () => offlineService.getCapabilities();
