/**
 * Service de pagination infinie (virtual scroll)
 * 
 * Ce service gère la pagination infinie, le virtual scrolling,
 * le chargement optimisé et les performances pour les grandes listes
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface VirtualScrollConfig {
  containerRef: React.RefObject<HTMLElement>;
  itemHeight: number;
  itemWidth?: number;
  overscan?: number;
  threshold?: number;
  bufferSize?: number;
  renderItem: (index: number, item: unknown, isVisible: boolean) => React.ReactNode;
  getItemKey?: (index: number, item: unknown) => string | number;
  onItemsChange?: (visibleItems: unknown[], allItems: unknown[]) => void;
  onScrollChange?: (scrollTop: number, scrollLeft: number) => void;
  onLoadMore?: (startIndex: number, endIndex: number) => Promise<unknown[]>;
  estimatedItemHeight?: (index: number, item: unknown) => number;
  horizontal?: boolean;
  reverse?: boolean;
  stickyIndices?: number[];
  stickyOffset?: number;
  scrollToIndex?: number;
  scrollToOffset?: number;
  smoothScroll?: boolean;
  autoScroll?: boolean;
  autoScrollSpeed?: number;
  loadingIndicator?: React.ReactNode;
  emptyIndicator?: React.ReactNode;
  errorIndicator?: React.ReactNode;
}

export interface VirtualScrollState {
  items: any[];
  visibleItems: any[];
  startIndex: number;
  endIndex: number;
  scrollTop: number;
  scrollLeft: number;
  containerHeight: number;
  containerWidth: number;
  totalHeight: number;
  totalWidth: number;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  scrollToIndex: number | null;
  scrollToOffset: number | null;
  isScrolling: boolean;
  scrollDirection: 'up' | 'down' | 'left' | 'right' | null;
  scrollVelocity: number;
  lastScrollTime: number;
  renderCount: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface VirtualScrollMetrics {
  totalItems: number;
  visibleItems: number;
  renderedItems: number;
  bufferSize: number;
  overscanSize: number;
  itemHeight: number;
  itemWidth: number;
  containerHeight: number;
  containerWidth: number;
  totalHeight: number;
  totalWidth: number;
  scrollPosition: number;
  scrollPercentage: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  scrollVelocity: number;
  scrollDirection: string;
}

export interface VirtualScrollCache {
  items: Map<string | number, any>;
  heights: Map<string | number, number>;
  positions: Map<string | number, number>;
  renderCache: Map<string, React.ReactNode>;
  lastAccess: Map<string | number, number>;
  maxSize: number;
  currentSize: number;
  hitCount: number;
  missCount: number;
}

export interface VirtualScrollEvent {
  type: 'scroll' | 'resize' | 'load_start' | 'load_complete' | 'load_error' | 'render' | 'cache_hit' | 'cache_miss';
  timestamp: number;
  data: unknown;
  metrics?: VirtualScrollMetrics;
}

export interface VirtualScrollPerformance {
  renderTime: number;
  scrollTime: number;
  loadTime: number;
  memoryUsage: number;
  domNodes: number;
  reflows: number;
  repaints: number;
  cacheHitRate: number;
  scrollFPS: number;
  renderFPS: number;
}

class VirtualScrollService {
  private config: VirtualScrollConfig | null = null;
  private state: VirtualScrollState;
  private cache: VirtualScrollCache;
  private metrics: VirtualScrollMetrics;
  private performance: VirtualScrollPerformance;
  private eventCallbacks: Map<string, (event: VirtualScrollEvent) => void> = new Map();
  private scrollTimer: NodeJS.Timeout | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private lastScrollTime: number = 0;
  private scrollVelocity: number = 0;
  private scrollDirection: 'up' | 'down' | 'left' | 'right' | null = null;

  constructor() {
    this.state = this.initializeState();
    this.cache = this.initializeCache();
    this.metrics = this.initializeMetrics();
    this.performance = this.initializePerformance();
  }

  /**
   * Initialise le service de virtual scroll
   */
  initialize(config: VirtualScrollConfig): void {
    this.config = config;

    // Configurer les observers
    this.setupResizeObserver();
    this.setupIntersectionObserver();

    // Démarrer le monitoring
    this.startMonitoring();

    console.log('📜 Service Virtual Scroll initialisé');
  }

  /**
   * Initialise l'état par défaut
   */
  private initializeState(): VirtualScrollState {
    return {
      items: [],
      visibleItems: [],
      startIndex: 0,
      endIndex: 0,
      scrollTop: 0,
      scrollLeft: 0,
      containerHeight: 0,
      containerWidth: 0,
      totalHeight: 0,
      totalWidth: 0,
      isLoading: false,
      hasMore: true,
      error: null,
      scrollToIndex: null,
      scrollToOffset: null,
      isScrolling: false,
      scrollDirection: null,
      scrollVelocity: 0,
      lastScrollTime: 0,
      renderCount: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Initialise le cache
   */
  private initializeCache(): VirtualScrollCache {
    return {
      items: new Map(),
      heights: new Map(),
      positions: new Map(),
      renderCache: new Map(),
      lastAccess: new Map(),
      maxSize: 1000,
      currentSize: 0,
      hitCount: 0,
      missCount: 0
    };
  }

  /**
   * Initialise les métriques
   */
  private initializeMetrics(): VirtualScrollMetrics {
    return {
      totalItems: 0,
      visibleItems: 0,
      renderedItems: 0,
      bufferSize: 0,
      overscanSize: 0,
      itemHeight: 0,
      itemWidth: 0,
      containerHeight: 0,
      containerWidth: 0,
      totalHeight: 0,
      totalWidth: 0,
      scrollPosition: 0,
      scrollPercentage: 0,
      renderTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      scrollVelocity: 0,
      scrollDirection: 'none'
    };
  }

  /**
   * Initialise les métriques de performance
   */
  private initializePerformance(): VirtualScrollPerformance {
    return {
      renderTime: 0,
      scrollTime: 0,
      loadTime: 0,
      memoryUsage: 0,
      domNodes: 0,
      reflows: 0,
      repaints: 0,
      cacheHitRate: 0,
      scrollFPS: 0,
      renderFPS: 0
    };
  }

  /**
   * Configure les items
   */
  setItems(items: any[]): void {
    const startTime = performance.now();
    
    this.state.items = items;
    this.metrics.totalItems = items.length;
    
    // Calculer les dimensions totales
    this.calculateTotalDimensions();
    
    // Mettre à jour les items visibles
    this.updateVisibleItems();
    
    const renderTime = performance.now() - startTime;
    this.performance.renderTime = renderTime;
    this.state.renderCount++;
    
    this.emit('render', {
      type: 'render',
      timestamp: Date.now(),
      data: { itemsCount: items.length, renderTime }
    });
    
    this.config?.onItemsChange?.(this.state.visibleItems, items);
  }

  /**
   * Ajoute des items (pour le chargement infini)
   */
  addItems(newItems: any[], prepend: boolean = false): void {
    const startTime = performance.now();
    
    if (prepend) {
      this.state.items = [...newItems, ...this.state.items];
    } else {
      this.state.items = [...this.state.items, ...newItems];
    }
    
    this.metrics.totalItems = this.state.items.length;
    this.calculateTotalDimensions();
    this.updateVisibleItems();
    
    const renderTime = performance.now() - startTime;
    this.performance.renderTime = renderTime;
    this.state.renderCount++;
    
    this.emit('render', {
      type: 'render',
      timestamp: Date.now(),
      data: { itemsCount: newItems.length, prepend, renderTime }
    });
    
    this.config?.onItemsChange?.(this.state.visibleItems, this.state.items);
  }

  /**
   * Gère le scroll
   */
  handleScroll(scrollTop: number, scrollLeft: number = 0): void {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastScrollTime;
    
    // Calculer la vélocité et direction
    if (deltaTime > 0) {
      const deltaScroll = this.config?.horizontal ? scrollLeft - this.state.scrollLeft : scrollTop - this.state.scrollTop;
      this.scrollVelocity = Math.abs(deltaScroll / deltaTime);
      this.scrollDirection = this.getScrollDirection(deltaScroll);
    }
    
    this.state.scrollTop = scrollTop;
    this.state.scrollLeft = scrollLeft;
    this.state.isScrolling = true;
    this.state.scrollVelocity = this.scrollVelocity;
    this.state.scrollDirection = this.scrollDirection;
    this.lastScrollTime = currentTime;
    
    // Mettre à jour les items visibles
    this.updateVisibleItems();
    
    // Vérifier si on doit charger plus d'items
    this.checkLoadMore();
    
    // Notifier le changement de scroll
    this.config?.onScrollChange?.(scrollTop, scrollLeft);
    
    this.emit('scroll', {
      type: 'scroll',
      timestamp: currentTime,
      data: { scrollTop, scrollLeft, velocity: this.scrollVelocity, direction: this.scrollDirection }
    });
    
    // Arrêter le timer de scroll
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    
    this.scrollTimer = setTimeout(() => {
      this.state.isScrolling = false;
      this.state.scrollVelocity = 0;
      this.state.scrollDirection = null;
    }, 150);
  }

  /**
   * Obtient la direction du scroll
   */
  private getScrollDirection(deltaScroll: number): 'up' | 'down' | 'left' | 'right' | null {
    if (this.config?.horizontal) {
      return deltaScroll > 0 ? 'right' : 'left';
    }
    return deltaScroll > 0 ? 'down' : 'up';
  }

  /**
   * Met à jour les items visibles
   */
  private updateVisibleItems(): void {
    if (!this.config) return;
    
    const startTime = performance.now();
    
    const { itemHeight, itemWidth, overscan = 5, horizontal = false } = this.config;
    
    let startIndex: number;
    let endIndex: number;
    
    if (horizontal) {
      startIndex = Math.floor(this.state.scrollLeft / (itemWidth || 100));
      endIndex = Math.ceil((this.state.scrollLeft + 800) / (itemWidth || 100)); // Default container width
    } else {
      startIndex = Math.floor(this.state.scrollTop / (itemHeight || 50));
      endIndex = Math.ceil((this.state.scrollTop + 600) / (itemHeight || 50)); // Default container height
    }
    
    // Ajouter l'overscan
    startIndex = Math.max(0, startIndex - overscan);
    endIndex = Math.min(this.state.items.length - 1, endIndex + overscan);
    
    this.state.startIndex = startIndex;
    this.state.endIndex = endIndex;
    
    // Extraire les items visibles
    this.state.visibleItems = this.state.items.slice(startIndex, endIndex + 1);
    
    // Mettre à jour les métriques
    this.metrics.visibleItems = this.state.visibleItems.length;
    this.metrics.renderedItems = endIndex - startIndex + 1;
    this.metrics.scrollPosition = horizontal ? this.state.scrollLeft : this.state.scrollTop;
    this.metrics.scrollPercentage = (this.metrics.scrollPosition / (horizontal ? this.state.totalWidth : this.state.totalHeight)) * 100;
    this.metrics.scrollVelocity = this.scrollVelocity;
    this.metrics.scrollDirection = this.scrollDirection || 'none';
    
    const updateTime = performance.now() - startTime;
    this.performance.scrollTime = updateTime;
    
    // Mettre à jour le cache
    this.updateCache();
  }

  /**
   * Calcule les dimensions totales
   */
  private calculateTotalDimensions(): void {
    if (!this.config) return;
    
    const { itemHeight, itemWidth, horizontal = false } = this.config;
    
    if (horizontal) {
      this.state.totalWidth = this.state.items.length * (itemWidth || 100);
      this.metrics.totalWidth = this.state.totalWidth;
    } else {
      this.state.totalHeight = this.state.items.length * (itemHeight || 50);
      this.metrics.totalHeight = this.state.totalHeight;
    }
  }

  /**
   * Vérifie si on doit charger plus d'items
   */
  private checkLoadMore(): void {
    if (!this.config || !this.config.onLoadMore || this.state.isLoading || !this.state.hasMore) return;
    
    const { threshold = 0.8, horizontal = false } = this.config;
    const scrollPercentage = horizontal ? 
      (this.state.scrollLeft + this.state.containerWidth) / this.state.totalWidth :
      (this.state.scrollTop + this.state.containerHeight) / this.state.totalHeight;
    
    if (scrollPercentage >= threshold) {
      this.loadMoreItems();
    }
  }

  /**
   * Charge plus d'items
   */
  private async loadMoreItems(): Promise<void> {
    if (!this.config || !this.config.onLoadMore) return;
    
    this.state.isLoading = true;
    this.state.error = null;
    
    const startTime = performance.now();
    
    this.emit('load_start', {
      type: 'load_start',
      timestamp: Date.now(),
      data: { startIndex: this.state.items.length }
    });
    
    try {
      const newItems = await this.config.onLoadMore(
        this.state.items.length,
        this.state.items.length + 50 // Charger 50 items par défaut
      );
      
      this.addItems(newItems);
      this.state.hasMore = newItems.length > 0;
      
      const loadTime = performance.now() - startTime;
      this.performance.loadTime = loadTime;
      
      this.emit('load_complete', {
        type: 'load_complete',
        timestamp: Date.now(),
        data: { itemsCount: newItems.length, loadTime }
      });
      
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Erreur de chargement';
      this.state.hasMore = false;
      
      this.emit('load_error', {
        type: 'load_error',
        timestamp: Date.now(),
        data: { error: this.state.error }
      });
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Met à jour le cache
   */
  private updateCache(): void {
    const currentTime = Date.now();
    
    // Mettre en cache les items visibles
    this.state.visibleItems.forEach((item, index) => {
      const globalIndex = this.state.startIndex + index;
      const key = this.getItemKey(globalIndex, item);
      
      if (!this.cache.items.has(key)) {
        this.cache.items.set(key, item);
        this.cache.lastAccess.set(key, currentTime);
        this.cache.currentSize++;
        this.cache.missCount++;
        this.state.cacheMisses++;
        
        this.emit('cache_miss', {
          type: 'cache_miss',
          timestamp: currentTime,
          data: { key, globalIndex }
        });
      } else {
        this.cache.lastAccess.set(key, currentTime);
        this.cache.hitCount++;
        this.state.cacheHits++;
        
        this.emit('cache_hit', {
          type: 'cache_hit',
          timestamp: currentTime,
          data: { key, globalIndex }
        });
      }
    });
    
    // Nettoyer le cache si nécessaire
    this.cleanupCache();
    
    // Mettre à jour les métriques
    this.metrics.cacheHitRate = this.cache.hitCount / (this.cache.hitCount + this.cache.missCount);
    this.performance.cacheHitRate = this.metrics.cacheHitRate;
  }

  /**
   * Nettoie le cache
   */
  private cleanupCache(): void {
    if (this.cache.currentSize <= this.cache.maxSize) return;
    
    // Trier par dernier accès
    const entries = Array.from(this.cache.lastAccess.entries())
      .sort(([, a], [, b]) => a - b);
    
    // Supprimer les plus anciens
    const toRemove = entries.slice(0, this.cache.currentSize - this.cache.maxSize);
    
    toRemove.forEach(([key]) => {
      this.cache.items.delete(String(key));
      this.cache.heights.delete(String(key));
      this.cache.positions.delete(String(key));
      this.cache.renderCache.delete(String(key));
      this.cache.lastAccess.delete(String(key));
      this.cache.currentSize--;
    });
  }

  /**
   * Obtient la clé d'un item
   */
  private getItemKey(index: number, item: any): string | number {
    if (this.config?.getItemKey) {
      return this.config.getItemKey(index, item);
    }
    return index;
  }

  /**
   * Fait défiler vers un index spécifique
   */
  scrollToIndex(index: number, smooth: boolean = false): void {
    if (!this.config) return;
    
    const { itemHeight, itemWidth, horizontal = false } = this.config;
    const offset = horizontal ? 
      index * (itemWidth || 100) : 
      index * (itemHeight || 50);
    
    this.scrollToOffset(offset, smooth);
  }

  /**
   * Fait défiler vers un offset spécifique
   */
  scrollToOffset(offset: number, smooth: boolean = false): void {
    if (!this.config || !this.config.containerRef.current) return;
    
    const container = this.config.containerRef.current;
    
    if (smooth) {
      container.scrollTo({
        top: this.config.horizontal ? 0 : offset,
        left: this.config.horizontal ? offset : 0,
        behavior: 'smooth'
      });
    } else {
      container.scrollTop = this.config.horizontal ? container.scrollTop : offset;
      container.scrollLeft = this.config.horizontal ? offset : container.scrollLeft;
    }
    
    this.state.scrollToOffset = offset;
  }

  /**
   * Configure le ResizeObserver
   */
  private setupResizeObserver(): void {
    if (!this.config?.containerRef.current || !window.ResizeObserver) return;
    
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        this.state.containerWidth = width;
        this.state.containerHeight = height;
        this.metrics.containerWidth = width;
        this.metrics.containerHeight = height;
        
        this.updateVisibleItems();
      }
    });
    
    this.resizeObserver.observe(this.config.containerRef.current);
  }

  /**
   * Configure l'IntersectionObserver
   */
  private setupIntersectionObserver(): void {
    if (!window.IntersectionObserver) return;
    
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // L'item est visible, on peut le précharger
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            this.preloadItem(index);
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.1
      }
    );
  }

  /**
   * Précharge un item
   */
  private preloadItem(index: number): void {
    if (index >= this.state.items.length) return;
    
    const item = this.state.items[index];
    const key = this.getItemKey(index, item);
    
    // Précharger dans le cache
    if (!this.cache.items.has(key)) {
      this.cache.items.set(key, item);
      this.cache.lastAccess.set(key, Date.now());
      this.cache.currentSize++;
    }
  }

  /**
   * Démarre le monitoring des performances
   */
  private startMonitoring(): void {
    // Monitorer les FPS de scroll
    let lastFrameTime = performance.now();
    let frameCount = 0;
    
    const measureRenderFPS = () => {
      const currentTime = performance.now();
      frameCount++;
      
      if (currentTime - lastFrameTime >= 1000) {
        this.performance.renderFPS = frameCount;
        frameCount = 0;
        lastFrameTime = currentTime;
      }
      
      requestAnimationFrame(measureRenderFPS);
    };
    
    // Monitorer l'utilisation mémoire
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.performance.memoryUsage = memory.usedJSHeapSize;
      }
    };
    
    setInterval(updateMemoryUsage, 5000);
    requestAnimationFrame(measureRenderFPS);
    
    // Démarrer les mesures
    measureRenderFPS();
    
    // Mesurer l'utilisation mémoire
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = (performance as any).memory;
        this.performance.memoryUsage = memory.usedJSHeapSize;
        this.metrics.memoryUsage = memory.usedJSHeapSize;
      };
      
      setInterval(updateMemoryUsage, 5000);
    }
  }

  /**
   * Obtient les métriques actuelles
   */
  getMetrics(): VirtualScrollMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtient les métriques de performance
   */
  getPerformance(): VirtualScrollPerformance {
    return { ...this.performance };
  }

  /**
   * Obtient l'état actuel
   */
  getState(): VirtualScrollState {
    return { ...this.state };
  }

  /**
   * Obtient les informations du cache
   */
  getCacheInfo(): {
    size: number;
    maxSize: number;
    hitRate: number;
    hitCount: number;
    missCount: number;
  } {
    return {
      size: this.cache.currentSize,
      maxSize: this.cache.maxSize,
      hitRate: this.cache.hitCount / (this.cache.hitCount + this.cache.missCount),
      hitCount: this.cache.hitCount,
      missCount: this.cache.missCount
    };
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.cache.items.clear();
    this.cache.heights.clear();
    this.cache.positions.clear();
    this.cache.renderCache.clear();
    this.cache.lastAccess.clear();
    this.cache.currentSize = 0;
    this.cache.hitCount = 0;
    this.cache.missCount = 0;
    
    this.state.cacheHits = 0;
    this.state.cacheMisses = 0;
    
    console.log('📜 Cache Virtual Scroll vidé');
  }

  /**
   * Détruit le service
   */
  destroy(): void {
    // Nettoyer les observers
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    
    // Nettoyer les timers
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = null;
    }
    
    // Vider le cache
    this.clearCache();
    
    // Réinitialiser l'état
    this.state = this.initializeState();
    this.config = null;
    
    console.log('📜 Service Virtual Scroll détruit');
  }

  /**
   * Ajoute un callback d'événement
   */
  on(event: string, callback: (event: VirtualScrollEvent) => void): void {
    this.eventCallbacks.set(event, callback);
  }

  /**
   * Émet un événement
   */
  private emit(type: string, data: VirtualScrollEvent): void {
    const callback = this.eventCallbacks.get(type);
    if (callback) {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Erreur callback événement Virtual Scroll:', error);
      }
    }
  }

  /**
   * Sauvegarde les statistiques dans Supabase
   */
  async saveStats(): Promise<void> {
    try {
      const stats = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        session_id: this.generateSessionId(),
        metrics: this.metrics,
        performance: this.performance,
        cache_info: this.getCacheInfo(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('virtual_scroll_stats')
        .insert(stats);

      if (error) throw error;

      console.log('📜 Statistiques Virtual Scroll sauvegardées');

    } catch (error) {
      console.error('❌ Erreur sauvegarde statistiques Virtual Scroll:', error);
    }
  }

  /**
   * Génère un ID de session
   */
  private generateSessionId(): string {
    return `vs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Instance singleton
export const virtualScrollService = new VirtualScrollService();

// Export des fonctions utilitaires
export const createVirtualScroll = (config: VirtualScrollConfig) => {
  const service = new VirtualScrollService();
  service.initialize(config);
  return service;
};

export const getVirtualScrollMetrics = () => virtualScrollService.getMetrics();
export const getVirtualScrollPerformance = () => virtualScrollService.getPerformance();
export const getVirtualScrollState = () => virtualScrollService.getState();
export const clearVirtualScrollCache = () => virtualScrollService.clearCache();
export const saveVirtualScrollStats = () => virtualScrollService.saveStats();
