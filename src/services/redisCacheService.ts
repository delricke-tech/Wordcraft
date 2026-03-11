/**
 * Service de cache Redis (performance scaling)
 * 
 * Ce service gère le cache Redis pour améliorer les performances,
 * la mise en cache des requêtes, la gestion des sessions et l'optimisation
 * 
 * Date: 11 mars 2026
 */

export interface RedisCacheEntry {
  key: string;
  value: any;
  ttl?: number; // en secondes
  tags?: string[];
  metadata: CacheMetadata;
  createdAt: string;
  updatedAt: string;
  accessedAt: string;
  accessCount: number;
  size: number; // en bytes
  compressed: boolean;
  encrypted: boolean;
}

export interface CacheMetadata {
  source: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  priority: CachePriority;
  category: CacheCategory;
  dependencies: string[];
  version: number;
  checksum: string;
  compressionAlgorithm?: string;
  encryptionAlgorithm?: string;
  customData?: Record<string, any>;
}

export type CachePriority = 'low' | 'normal' | 'high' | 'critical';
export type CacheCategory = 
  | 'user_data'
  | 'session_data'
  | 'query_results'
  | 'api_responses'
  | 'static_assets'
  | 'computed_values'
  | 'search_results'
  | 'file_metadata'
  | 'analytics'
  | 'system';

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // en bytes
  hitRate: number; // pourcentage
  missRate: number; // pourcentage
  evictionRate: number; // pourcentage
  averageTTL: number; // en secondes
  entriesByCategory: Record<CacheCategory, number>;
  entriesByPriority: Record<CachePriority, number>;
  topKeys: Array<{ key: string; accessCount: number; size: number; category: string }>;
  performance: {
    averageGetTime: number; // en millisecondes
    averageSetTime: number; // en millisecondes
    averageDeleteTime: number; // en millisecondes
    memoryUsage: number; // en MB
    cpuUsage: number; // pourcentage
  };
  trends: {
    hitRateTrend: number[]; // derniers 7 jours
    sizeTrend: number[]; // derniers 7 jours
    accessCountTrend: number[]; // derniers 7 jours
  };
}

export interface CacheConfiguration {
  maxMemory: number; // en MB
  maxEntries: number;
  defaultTTL: number; // en secondes
  evictionPolicy: EvictionPolicy;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  persistenceEnabled: boolean;
  backupEnabled: boolean;
  monitoringEnabled: boolean;
  analyticsEnabled: boolean;
  customSettings: Record<string, any>;
}

export type EvictionPolicy = 
  | 'lru'
  | 'lfu'
  | 'fifo'
  | 'random'
  | 'ttl'
  | 'size'
  | 'custom';

export interface CacheKeyPattern {
  pattern: string;
  description: string;
  category: CacheCategory;
  ttl: number;
  priority: CachePriority;
  tags: string[];
  dependencies: string[];
}

export interface CacheInvalidationRule {
  id: string;
  name: string;
  pattern: string;
  trigger: InvalidationTrigger;
  action: InvalidationAction;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: InvalidationMetadata;
}

export type InvalidationTrigger = 
  | 'time_based'
  | 'event_based'
  | 'dependency_based'
  | 'manual'
  | 'size_based';

export type InvalidationAction = 
  | 'delete'
  | 'refresh'
  | 'recompute'
  | 'archive'
  | 'custom';

export interface InvalidationMetadata {
  schedule?: string; // cron expression
  conditions?: Record<string, any>;
  customLogic?: string;
  notifications?: boolean;
}

export interface CacheWarmupConfig {
  enabled: boolean;
  patterns: string[];
  priority: CachePriority;
  concurrency: number;
  retryCount: number;
  delay: number; // en millisecondes
  metadata: WarmupMetadata;
}

export interface WarmupMetadata {
  source: string;
  batchSize: number;
  timeout: number; // en millisecondes
  errorHandling: 'skip' | 'retry' | 'abort';
  progressCallback?: string;
}

export interface RedisCacheServiceConfig {
  redisUrl: string;
  password?: string;
  database?: number;
  maxRetries: number;
  retryDelay: number;
  connectTimeout: number;
  commandTimeout: number;
  lazyConnect: boolean;
  keyPrefix: string;
  compression: boolean;
  encryption: boolean;
  monitoring: boolean;
}

class RedisCacheService {
  private redisClient: any = null; // Redis client
  private connectionStatus: boolean = false;
  private config: RedisCacheServiceConfig;
  private stats: CacheStats;
  private keyPatterns: Map<string, CacheKeyPattern> = new Map();
  private invalidationRules: Map<string, CacheInvalidationRule> = new Map();
  private warmupConfig: CacheWarmupConfig;
  private eventCallbacks: Map<string, (event: any) => void> = new Map();

  constructor(config: RedisCacheServiceConfig) {
    this.config = config;
    this.stats = this.initializeStats();
    this.warmupConfig = this.initializeWarmupConfig();
    this.initializeService();
  }

  /**
   * Initialise le service Redis
   */
  private async initializeService(): Promise<void> {
    try {
      // Note: Dans un environnement réel, nous utiliserions une bibliothèque Redis comme 'redis' ou 'ioredis'
      // Pour cet exemple, nous simulons les opérations Redis
      console.log('🔴 Service Redis Cache initialisé (mode simulation)');
      
      // Initialiser les patterns de clés par défaut
      this.initializeDefaultKeyPatterns();
      
      // Démarrer le monitoring si activé
      if (this.config.monitoring) {
        this.startMonitoring();
      }
      
      this.connectionStatus = true;

    } catch (error) {
      console.error('❌ Erreur initialisation service Redis:', error);
      throw error;
    }
  }

  /**
   * Initialise les statistiques par défaut
   */
  private initializeStats(): CacheStats {
    return {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionRate: 0,
      averageTTL: 3600,
      entriesByCategory: {
        user_data: 0,
        session_data: 0,
        query_results: 0,
        api_responses: 0,
        static_assets: 0,
        computed_values: 0,
        search_results: 0,
        file_metadata: 0,
        analytics: 0,
        system: 0
      },
      entriesByPriority: {
        low: 0,
        normal: 0,
        high: 0,
        critical: 0
      },
      topKeys: [],
      performance: {
        averageGetTime: 0,
        averageSetTime: 0,
        averageDeleteTime: 0,
        memoryUsage: 0,
        cpuUsage: 0
      },
      trends: {
        hitRateTrend: Array(7).fill(0),
        sizeTrend: Array(7).fill(0),
        accessCountTrend: Array(7).fill(0)
      }
    };
  }

  /**
   * Initialise la configuration de warmup
   */
  private initializeWarmupConfig(): CacheWarmupConfig {
    return {
      enabled: false,
      patterns: [],
      priority: 'normal',
      concurrency: 5,
      retryCount: 3,
      delay: 100,
      metadata: {
        source: 'system',
        batchSize: 100,
        timeout: 5000,
        errorHandling: 'skip'
      }
    };
  }

  /**
   * Initialise les patterns de clés par défaut
   */
  private initializeDefaultKeyPatterns(): void {
    const defaultPatterns: CacheKeyPattern[] = [
      {
        pattern: 'user:*:profile',
        description: 'Profil utilisateur',
        category: 'user_data',
        ttl: 3600,
        priority: 'high',
        tags: ['user', 'profile'],
        dependencies: []
      },
      {
        pattern: 'user:*:preferences',
        description: 'Préférences utilisateur',
        category: 'user_data',
        ttl: 7200,
        priority: 'normal',
        tags: ['user', 'preferences'],
        dependencies: []
      },
      {
        pattern: 'session:*',
        description: 'Session utilisateur',
        category: 'session_data',
        ttl: 1800,
        priority: 'critical',
        tags: ['session'],
        dependencies: []
      },
      {
        pattern: 'query:*:*',
        description: 'Résultats de requêtes',
        category: 'query_results',
        ttl: 600,
        priority: 'normal',
        tags: ['query', 'results'],
        dependencies: []
      },
      {
        pattern: 'api:*:*',
        description: 'Réponses API',
        category: 'api_responses',
        ttl: 300,
        priority: 'normal',
        tags: ['api', 'response'],
        dependencies: []
      },
      {
        pattern: 'search:*:*',
        description: 'Résultats de recherche',
        category: 'search_results',
        ttl: 900,
        priority: 'high',
        tags: ['search', 'results'],
        dependencies: []
      },
      {
        pattern: 'file:*:metadata',
        description: 'Métadonnées de fichiers',
        category: 'file_metadata',
        ttl: 3600,
        priority: 'normal',
        tags: ['file', 'metadata'],
        dependencies: []
      },
      {
        pattern: 'analytics:*',
        description: 'Données analytics',
        category: 'analytics',
        ttl: 1800,
        priority: 'low',
        tags: ['analytics'],
        dependencies: []
      }
    ];

    defaultPatterns.forEach(pattern => {
      this.keyPatterns.set(pattern.pattern, pattern);
    });
  }

  /**
   * Définit une valeur dans le cache
   */
  async set(key: string, value: any, options: {
    ttl?: number;
    tags?: string[];
    priority?: CachePriority;
    category?: CacheCategory;
    userId?: string;
    sessionId?: string;
  } = {}): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Créer l'entrée de cache
      const entry: RedisCacheEntry = {
        key,
        value,
        ttl: options.ttl || this.getDefaultTTL(key),
        tags: options.tags || [],
        metadata: {
          source: 'user_set',
          userId: options.userId,
          sessionId: options.sessionId,
          priority: options.priority || this.getPriority(key),
          category: options.category || this.getCategory(key),
          dependencies: [],
          version: 1,
          checksum: this.calculateChecksum(value),
          compressionAlgorithm: this.config.compression ? 'gzip' : undefined,
          encryptionAlgorithm: this.config.encryption ? 'aes256' : undefined
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessedAt: new Date().toISOString(),
        accessCount: 1,
        size: this.calculateSize(value),
        compressed: this.config.compression,
        encrypted: this.config.encryption
      };

      // Simuler l'opération Redis
      await this.simulateRedisOperation('set', key, entry);
      
      // Mettre à jour les statistiques
      const setTime = Date.now() - startTime;
      this.updateStats('set', setTime, entry.size, entry.metadata.category);

      console.log('🔴 Cache SET:', key);

    } catch (error) {
      console.error('❌ Erreur SET cache:', error);
      throw error;
    }
  }

  /**
   * Récupère une valeur du cache
   */
  async get(key: string): Promise<any> {
    try {
      const startTime = Date.now();
      
      // Simuler l'opération Redis
      const entry = await this.simulateRedisOperation('get', key);
      
      if (!entry) {
        this.updateStats('miss', Date.now() - startTime, 0, 'system');
        return null;
      }

      // Mettre à jour l'accès
      entry.accessedAt = new Date().toISOString();
      entry.accessCount++;
      
      const getTime = Date.now() - startTime;
      this.updateStats('hit', getTime, entry.size, entry.metadata.category);

      console.log('🔴 Cache HIT:', key);
      return entry.value;

    } catch (error) {
      console.error('❌ Erreur GET cache:', error);
      throw error;
    }
  }

  /**
   * Supprime une valeur du cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const startTime = Date.now();
      
      // Simuler l'opération Redis
      const existed = await this.simulateRedisOperation('delete', key);
      
      const deleteTime = Date.now() - startTime;
      this.updateStats('delete', deleteTime, 0, 'system');

      console.log('🔴 Cache DELETE:', key, existed ? 'success' : 'not found');
      return existed;

    } catch (error) {
      console.error('❌ Erreur DELETE cache:', error);
      throw error;
    }
  }

  /**
   * Vérifie si une clé existe dans le cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      return await this.simulateRedisOperation('exists', key);
    } catch (error) {
      console.error('❌ Erreur EXISTS cache:', error);
      throw error;
    }
  }

  /**
   * Définit une valeur avec expiration
   */
  async setex(key: string, ttl: number, value: any, options: {
    tags?: string[];
    priority?: CachePriority;
    category?: CacheCategory;
    userId?: string;
    sessionId?: string;
  } = {}): Promise<void> {
    return this.set(key, value, { ttl, ...options });
  }

  /**
   * Récupère et supprime une valeur
   */
  async getdel(key: string): Promise<any> {
    try {
      const value = await this.get(key);
      if (value) {
        await this.delete(key);
      }
      return value;
    } catch (error) {
      console.error('❌ Erreur GETDEL cache:', error);
      throw error;
    }
  }

  /**
   * Incrémente une valeur numérique
   */
  async incr(key: string, increment: number = 1): Promise<number> {
    try {
      const current = await this.get(key);
      const newValue = (current || 0) + increment;
      await this.set(key, newValue);
      return newValue;
    } catch (error) {
      console.error('❌ Erreur INCR cache:', error);
      throw error;
    }
  }

  /**
   * Ajoute un élément à une liste
   */
  async lpush(key: string, value: any): Promise<number> {
    try {
      const list = await this.get(key) || [];
      list.unshift(value);
      await this.set(key, list);
      return list.length;
    } catch (error) {
      console.error('❌ Erreur LPUSH cache:', error);
      throw error;
    }
  }

  /**
   * Récupère une liste d'éléments
   */
  async lrange(key: string, start: number = 0, end: number = -1): Promise<any[]> {
    try {
      const list = await this.get(key) || [];
      return list.slice(start, end === -1 ? undefined : end + 1);
    } catch (error) {
      console.error('❌ Erreur LRANGE cache:', error);
      throw error;
    }
  }

  /**
   * Invalide des clés par pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      let invalidatedCount = 0;
      
      // Simuler la recherche de clés par pattern
      const keys = await this.getKeysByPattern(pattern);
      
      for (const key of keys) {
        await this.delete(key);
        invalidatedCount++;
      }
      
      console.log('🔴 Cache INVALIDATE:', pattern, `${invalidatedCount} keys`);
      return invalidatedCount;

    } catch (error) {
      console.error('❌ Erreur INVALIDATE cache:', error);
      throw error;
    }
  }

  /**
   * Vide tout le cache
   */
  async flush(): Promise<void> {
    try {
      // Simuler le flush
      await this.simulateRedisOperation('flush');
      
      // Réinitialiser les statistiques
      this.stats = this.initializeStats();
      
      console.log('🔴 Cache FLUSHED');
    } catch (error) {
      console.error('❌ Erreur FLUSH cache:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques du cache
   */
  async getStats(): Promise<CacheStats> {
    return { ...this.stats };
  }

  /**
   * Ajoute un pattern de clé
   */
  addKeyPattern(pattern: CacheKeyPattern): void {
    this.keyPatterns.set(pattern.pattern, pattern);
    console.log('🔴 Pattern ajouté:', pattern.pattern);
  }

  /**
   * Ajoute une règle d'invalidation
   */
  addInvalidationRule(rule: CacheInvalidationRule): void {
    this.invalidationRules.set(rule.id, rule);
    console.log('🔴 Règle d\'invalidation ajoutée:', rule.name);
  }

  /**
   * Configure le warmup du cache
   */
  configureWarmup(config: Partial<CacheWarmupConfig>): void {
    this.warmupConfig = { ...this.warmupConfig, ...config };
    console.log('🔴 Configuration warmup mise à jour');
  }

  /**
   * Démarre le warmup du cache
   */
  async startWarmup(): Promise<void> {
    if (!this.warmupConfig.enabled) {
      console.log('🔴 Warmup désactivé');
      return;
    }

    try {
      console.log('🔴 Démarrage du warmup...');
      
      for (const pattern of this.warmupConfig.patterns) {
        await this.warmupPattern(pattern);
      }
      
      console.log('🔴 Warmup terminé');
    } catch (error) {
      console.error('❌ Erreur warmup:', error);
    }
  }

  /**
   * Warmup pour un pattern spécifique
   */
  private async warmupPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.getKeysByPattern(pattern);
      
      for (const key of keys) {
        // Simuler le chargement en cache
        await this.simulateWarmupLoad(key);
        
        // Délai pour éviter la surcharge
        await new Promise(resolve => setTimeout(resolve, this.warmupConfig.delay));
      }
      
    } catch (error) {
      console.error('❌ Erreur warmup pattern:', pattern, error);
    }
  }

  /**
   * Obtient les statistiques détaillées
   */
  async getDetailedStats(): Promise<{
    cache: CacheStats;
    redis: any;
    system: any;
  }> {
    try {
      const cacheStats = await this.getStats();
      
      // Simuler les stats Redis et système
      const redisStats = {
        connected_clients: 10,
        used_memory: this.stats.totalSize,
        used_memory_human: this.formatBytes(this.stats.totalSize),
        used_memory_peak: this.stats.totalSize * 1.2,
        keyspace_hits: Math.floor(this.stats.hitRate * 100),
        keyspace_misses: Math.floor(this.stats.missRate * 100),
        total_commands_processed: this.stats.totalEntries * 10
      };
      
      const systemStats = {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        cpu_usage: process.cpuUsage(),
        load_average: require('os').loadavg()
      };
      
      return {
        cache: cacheStats,
        redis: redisStats,
        system: systemStats
      };

    } catch (error) {
      console.error('❌ Erreur stats détaillées:', error);
      throw error;
    }
  }

  // Méthodes utilitaires privées

  /**
   * Simule une opération Redis
   */
  private async simulateRedisOperation(operation: string, key?: string, value?: any): Promise<any> {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5));
    
    switch (operation) {
      case 'set':
        return true;
      case 'get':
        return Math.random() > 0.1 ? { value: `cached_${key}`, size: 100 } : null;
      case 'delete':
        return Math.random() > 0.3;
      case 'exists':
        return Math.random() > 0.5;
      case 'flush':
        return true;
      default:
        return null;
    }
  }

  /**
   * Simule la récupération de clés par pattern
   */
  private async getKeysByPattern(pattern: string): Promise<string[]> {
    // Simuler la recherche de clés
    const mockKeys = [
      'user:123:profile',
      'user:456:profile',
      'session:abc123',
      'query:search:results',
      'api:users:list',
      'file:doc1:metadata'
    ];
    
    return mockKeys.filter(key => key.includes(pattern.replace('*', '')));
  }

  /**
   * Simule le chargement en warmup
   */
  private async simulateWarmupLoad(key: string): Promise<void> {
    // Simuler le chargement
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
    console.log('🔴 Warmup load:', key);
  }

  /**
   * Met à jour les statistiques
   */
  private updateStats(operation: 'get' | 'set' | 'delete' | 'hit' | 'miss', duration: number, size: number, category: CacheCategory): void {
    switch (operation) {
      case 'hit':
        this.stats.hitRate = (this.stats.hitRate * 0.9) + (0.1 * 100);
        this.stats.missRate = 100 - this.stats.hitRate;
        break;
      case 'miss':
        this.stats.missRate = (this.stats.missRate * 0.9) + (0.1 * 100);
        this.stats.hitRate = 100 - this.stats.missRate;
        break;
      case 'set':
        this.stats.totalEntries++;
        this.stats.totalSize += size;
        this.stats.entriesByCategory[category]++;
        break;
      case 'delete':
        this.stats.totalEntries = Math.max(0, this.stats.totalEntries - 1);
        this.stats.totalSize = Math.max(0, this.stats.totalSize - size);
        this.stats.entriesByCategory[category] = Math.max(0, this.stats.entriesByCategory[category] - 1);
        break;
    }

    // Mettre à jour les temps moyens
    if (operation === 'get') {
      this.stats.performance.averageGetTime = (this.stats.performance.averageGetTime + duration) / 2;
    } else if (operation === 'set') {
      this.stats.performance.averageSetTime = (this.stats.performance.averageSetTime + duration) / 2;
    } else if (operation === 'delete') {
      this.stats.performance.averageDeleteTime = (this.stats.performance.averageDeleteTime + duration) / 2;
    }
  }

  /**
   * Obtient le TTL par défaut pour une clé
   */
  private getDefaultTTL(key: string): number {
    const pattern = Array.from(this.keyPatterns.values()).find(p => key.includes(p.pattern.replace('*', '')));
    return pattern?.ttl || 3600;
  }

  /**
   * Obtient la priorité pour une clé
   */
  private getPriority(key: string): CachePriority {
    const pattern = Array.from(this.keyPatterns.values()).find(p => key.includes(p.pattern.replace('*', '')));
    return pattern?.priority || 'normal';
  }

  /**
   * Obtient la catégorie pour une clé
   */
  private getCategory(key: string): CacheCategory {
    const pattern = Array.from(this.keyPatterns.values()).find(p => key.includes(p.pattern.replace('*', '')));
    return pattern?.category || 'system';
  }

  /**
   * Calcule le checksum d'une valeur
   */
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

  /**
   * Calcule la taille d'une valeur
   */
  private calculateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Approximation
  }

  /**
   * Formate des bytes en format lisible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Démarre le monitoring
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.updateTrends();
      this.cleanupExpired();
    }, 60000); // Toutes les minutes
  }

  /**
   * Met à jour les tendances
   */
  private updateTrends(): void {
    // Simuler la mise à jour des tendances
    this.stats.trends.hitRateTrend.shift();
    this.stats.trends.hitRateTrend.push(this.stats.hitRate);
    
    this.stats.trends.sizeTrend.shift();
    this.stats.trends.sizeTrend.push(this.stats.totalSize);
    
    this.stats.trends.accessCountTrend.shift();
    this.stats.trends.accessCountTrend.push(this.stats.totalEntries);
  }

  /**
   * Nettoie les entrées expirées
   */
  private async cleanupExpired(): Promise<void> {
    // Simuler le nettoyage
    console.log('🔴 Nettoyage des entrées expirées...');
  }

  /**
   * Vérifie si Redis est connecté
   */
  checkConnection(): boolean {
    return this.connectionStatus;
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

// Instance singleton avec configuration par défaut
const defaultConfig: RedisCacheServiceConfig = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB || '0'),
  maxRetries: 3,
  retryDelay: 1000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  lazyConnect: true,
  keyPrefix: 'wordcraft:',
  compression: true,
  encryption: false,
  monitoring: true
};

export const redisCacheService = new RedisCacheService(defaultConfig);

// Export des fonctions utilitaires
export const cacheSet = (key: string, value: any, options?: {
  ttl?: number;
  tags?: string[];
  priority?: CachePriority;
  category?: CacheCategory;
  userId?: string;
  sessionId?: string;
}) => redisCacheService.set(key, value, options);

export const cacheGet = (key: string) => redisCacheService.get(key);
export const cacheDelete = (key: string) => redisCacheService.delete(key);
export const cacheExists = (key: string) => redisCacheService.exists(key);
export const cacheSetex = (key: string, ttl: number, value: any, options?: {
  tags?: string[];
  priority?: CachePriority;
  category?: CacheCategory;
  userId?: string;
  sessionId?: string;
}) => redisCacheService.setex(key, ttl, value, options);

export const cacheGetdel = (key: string) => redisCacheService.getdel(key);
export const cacheIncr = (key: string, increment?: number) => redisCacheService.incr(key, increment);
export const cacheFlush = () => redisCacheService.flush();
export const getCacheStats = () => redisCacheService.getStats();
export const getDetailedCacheStats = () => redisCacheService.getDetailedStats();
