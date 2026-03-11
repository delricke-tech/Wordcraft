/**
 * Service d'optimisation d'images (WebP, compression)
 * 
 * Ce service gère l'optimisation des images, la conversion de formats,
 * la compression, le redimensionnement et le cache d'images optimisées
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface ImageOptimization {
  id: string;
  originalImageId: string;
  originalUrl: string;
  optimizedUrl: string;
  originalFormat: ImageFormat;
  optimizedFormat: ImageFormat;
  originalSize: number; // en bytes
  optimizedSize: number; // en bytes
  compressionRatio: number; // pourcentage
  dimensions: ImageDimensions;
  quality: number; // 1-100
  optimizationType: OptimizationType;
  processingTime: number; // en millisecondes
  status: OptimizationStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
  metadata: OptimizationMetadata;
}

export type ImageFormat = 
  | 'jpeg'
  | 'jpg'
  | 'png'
  | 'webp'
  | 'avif'
  | 'gif'
  | 'bmp'
  | 'tiff'
  | 'svg'
  | 'ico';

export type OptimizationType = 
  | 'compression'
  | 'format_conversion'
  | 'resize'
  | 'crop'
  | 'quality_adjustment'
  | 'progressive'
  | 'lazy'
  | 'combined';

export type OptimizationStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  originalWidth: number;
  originalHeight: number;
}

export interface OptimizationMetadata {
  algorithm: string;
  settings: OptimizationSettings;
  performance: PerformanceMetrics;
  cache: CacheInfo;
  tags: string[];
  aiEnhanced: boolean;
  processingSteps: ProcessingStep[];
}

export interface OptimizationSettings {
  quality: number;
  progressive: boolean;
  lossless: boolean;
  preserveMetadata: boolean;
  stripExif: boolean;
  optimizeColors: boolean;
  reduceColors: boolean;
  interlace: boolean;
  transparency: boolean;
  animation: boolean;
  customSettings: Record<string, any>;
}

export interface PerformanceMetrics {
  compressionSpeed: number; // MB/s
  memoryUsage: number; // MB
  cpuUsage: number; // pourcentage
  qualityScore: number; // 1-100
  structuralSimilarity: number; // 0-1
  perceivedQuality: number; // 1-100
}

export interface CacheInfo {
  cacheKey: string;
  cacheHit: boolean;
  cacheSize: number;
  lastAccessed: string;
  expiresAt: string;
  storageLocation: 'memory' | 'disk' | 'cdn';
}

export interface ProcessingStep {
  step: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration: number;
  inputSize: number;
  outputSize: number;
  metadata: Record<string, any>;
}

export interface ImageOptimizationRequest {
  id: string;
  imageUrl: string;
  userId?: string;
  settings: OptimizationRequestSettings;
  priority: Priority;
  callbackUrl?: string;
  webhookUrl?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata: RequestMetadata;
}

export interface OptimizationRequestSettings {
  targetFormat?: ImageFormat;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  cropToAspectRatio?: number;
  compressionLevel?: number;
  progressive?: boolean;
  lossless?: boolean;
  preserveMetadata?: boolean;
  stripExif?: boolean;
  optimizeColors?: boolean;
  reduceColors?: number;
  interlace?: boolean;
  transparency?: boolean;
  animation?: boolean;
  customSettings?: Record<string, any>;
}

export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type RequestStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface RequestMetadata {
  source: string;
  userAgent: string;
  platform: string;
  referer?: string;
  sessionId?: string;
  correlationId?: string;
  customData?: Record<string, any>;
}

export interface ImageOptimizationStats {
  totalOptimizations: number;
  successfulOptimizations: number;
  failedOptimizations: number;
  averageCompressionRatio: number;
  totalSpaceSaved: number; // en bytes
  averageProcessingTime: number; // en millisecondes
  optimizationsByFormat: Record<ImageFormat, number>;
  optimizationsByType: Record<OptimizationType, number>;
  performance: {
    averageCompressionSpeed: number;
    averageMemoryUsage: number;
    averageQualityScore: number;
    cacheHitRate: number;
  };
  userStats: {
    totalUsers: number;
    activeUsers: number;
    averageOptimizationsPerUser: number;
    topUsers: Array<{ userId: string; optimizationCount: number; spaceSaved: number }>;
  };
}

class ImageOptimizationService {
  private processingQueue: Map<string, ImageOptimizationRequest> = new Map();
  private cache: Map<string, ImageOptimization> = new Map();
  private isProcessing: boolean = false;
  private maxConcurrentJobs: number = 3;
  private currentJobs: number = 0;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialise le service d'optimisation
   */
  private initializeService(): void {
    // Démarrer le traitement de la queue
    this.processQueue();
    console.log('🖼️ Service d\'optimisation d\'images initialisé');
  }

  /**
   * Soumet une requête d'optimisation
   */
  async submitOptimizationRequest(request: Omit<ImageOptimizationRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<ImageOptimizationRequest> {
    try {
      const requestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const optimizationRequest: ImageOptimizationRequest = {
        id: requestId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...request
      };

      // Sauvegarder la requête
      await this.saveOptimizationRequest(optimizationRequest);

      // Ajouter à la queue
      this.processingQueue.set(requestId, optimizationRequest);

      console.log('🖼️ Requête d\'optimisation soumise:', requestId);
      return optimizationRequest;

    } catch (error) {
      console.error('❌ Erreur soumission requête optimisation:', error);
      throw new Error(`Échec de la soumission: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Optimise une image
   */
  async optimizeImage(imageUrl: string, settings: OptimizationRequestSettings, userId?: string): Promise<ImageOptimization> {
    try {
      // Vérifier le cache
      const cacheKey = this.generateCacheKey(imageUrl, settings);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log('🖼️ Image trouvée dans le cache:', cacheKey);
        return cached;
      }

      // Télécharger l'image originale
      const originalImage = await this.downloadImage(imageUrl);
      
      // Optimiser l'image
      const optimizedImage = await this.processImage(originalImage, settings, imageUrl);
      
      // Sauvegarder l'optimisation
      const savedOptimization = await this.saveOptimization(optimizedImage, imageUrl, userId);
      
      // Mettre en cache
      this.cache.set(cacheKey, savedOptimization);
      
      console.log('🖼️ Image optimisée avec succès:', savedOptimization.id);
      return savedOptimization;

    } catch (error) {
      console.error('❌ Erreur optimisation image:', error);
      throw new Error(`Échec de l'optimisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Télécharge une image depuis une URL
   */
  private async downloadImage(imageUrl: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Erreur de téléchargement: ${response.statusText}`);
      }
      
      return await response.arrayBuffer();

    } catch (error) {
      console.error('❌ Erreur téléchargement image:', error);
      throw error;
    }
  }

  /**
   * Traite une image
   */
  private async processImage(imageBuffer: ArrayBuffer, settings: OptimizationRequestSettings, originalUrl: string): Promise<Omit<ImageOptimization, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>> {
    try {
      const startTime = Date.now();
      
      // Créer un canvas pour le traitement
      const image = await this.createImageFromBuffer(imageBuffer);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Calculer les dimensions optimisées
      const dimensions = this.calculateOptimizedDimensions(image, settings);
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      // Dessiner l'image optimisée
      ctx.drawImage(image, 0, 0, dimensions.width, dimensions.height);

      // Convertir selon le format cible
      const targetFormat = settings.targetFormat || 'webp';
      const quality = settings.quality || 80;
      
      let optimizedBlob: Blob;
      let optimizedFormat: ImageFormat;

      switch (targetFormat) {
        case 'webp':
          optimizedBlob = await this.convertToWebP(canvas, quality, settings);
          optimizedFormat = 'webp';
          break;
        case 'avif':
          optimizedBlob = await this.convertToAvif(canvas, quality, settings);
          optimizedFormat = 'avif';
          break;
        case 'jpeg':
        case 'jpg':
          optimizedBlob = await this.convertToJPEG(canvas, quality, settings);
          optimizedFormat = 'jpeg';
          break;
        case 'png':
          optimizedBlob = await this.convertToPNG(canvas, settings);
          optimizedFormat = 'png';
          break;
        default:
          optimizedBlob = await this.convertToWebP(canvas, quality, settings);
          optimizedFormat = 'webp';
      }

      const processingTime = Date.now() - startTime;
      const originalSize = imageBuffer.byteLength;
      const optimizedSize = optimizedBlob.size;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

      // Convertir en ArrayBuffer (optionnel, non utilisé pour le moment)
      // const optimizedBuffer = await optimizedBlob.arrayBuffer();

      return {
        originalImageId: '', // À remplir avec l'ID de l'image originale
        originalUrl: '', // À remplir avec l'URL originale
        optimizedUrl: '', // À remplir après upload
        originalFormat: this.detectImageFormat(originalUrl || ''),
        optimizedFormat,
        originalSize,
        optimizedSize,
        compressionRatio,
        dimensions,
        quality,
        optimizationType: this.determineOptimizationType(settings),
        processingTime,
        status: 'completed'
      };

    } catch (error) {
      console.error('❌ Erreur traitement image:', error);
      throw error;
    }
  }

  /**
   * Crée une image depuis un buffer
   */
  private async createImageFromBuffer(buffer: ArrayBuffer): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([buffer]);
      const url = URL.createObjectURL(blob);
      const img = new Image();
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Erreur de chargement de l\'image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Calcule les dimensions optimisées
   */
  private calculateOptimizedDimensions(image: HTMLImageElement, settings: OptimizationRequestSettings): ImageDimensions {
    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;
    const originalAspectRatio = originalWidth / originalHeight;

    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    // Appliquer les limites de taille
    if (settings.maxWidth && targetWidth > settings.maxWidth) {
      targetWidth = settings.maxWidth;
      targetHeight = Math.round(targetWidth / originalAspectRatio);
    }

    if (settings.maxHeight && targetHeight > settings.maxHeight) {
      targetHeight = settings.maxHeight;
      targetWidth = Math.round(targetHeight * originalAspectRatio);
    }

    // Appliquer le recadrage si nécessaire
    if (settings.cropToAspectRatio) {
      const targetAspectRatio = settings.cropToAspectRatio;
      if (targetAspectRatio > originalAspectRatio) {
        targetHeight = Math.round(targetWidth / targetAspectRatio);
      } else {
        targetWidth = Math.round(targetHeight * targetAspectRatio);
      }
    }

    return {
      width: targetWidth,
      height: targetHeight,
      aspectRatio: targetWidth / targetHeight,
      originalWidth,
      originalHeight
    };
  }

  /**
   * Convertit vers WebP
   */
  private async convertToWebP(canvas: HTMLCanvasElement, quality: number, _settings: OptimizationRequestSettings): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erreur de conversion WebP'));
          }
        },
        'image/webp',
        quality / 100
      );
    });
  }

  /**
   * Convertit vers AVIF
   */
  private async convertToAvif(canvas: HTMLCanvasElement, quality: number, _settings: OptimizationRequestSettings): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erreur de conversion AVIF'));
          }
        },
        'image/avif',
        quality / 100
      );
    });
  }

  /**
   * Convertit vers JPEG
   */
  private async convertToJPEG(canvas: HTMLCanvasElement, quality: number, _settings: OptimizationRequestSettings): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erreur de conversion JPEG'));
          }
        },
        'image/jpeg',
        quality / 100
      );
    });
  }

  /**
   * Convertit vers PNG
   */
  private async convertToPNG(canvas: HTMLCanvasElement, _settings: OptimizationRequestSettings): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erreur de conversion PNG'));
          }
        },
        'image/png'
      );
    });
  }

  /**
   * Détecte le format d'image depuis l'URL
   */
  private detectImageFormat(url: string): ImageFormat {
    const extension = url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'jpeg';
      case 'png':
        return 'png';
      case 'webp':
        return 'webp';
      case 'avif':
        return 'avif';
      case 'gif':
        return 'gif';
      case 'bmp':
        return 'bmp';
      case 'tiff':
      case 'tif':
        return 'tiff';
      case 'svg':
        return 'svg';
      case 'ico':
        return 'ico';
      default:
        return 'jpeg'; // Par défaut
    }
  }

  /**
   * Détermine le type d'optimisation
   */
  private determineOptimizationType(settings: OptimizationRequestSettings): OptimizationType {
    const types: OptimizationType[] = [];

    if (settings.targetFormat && settings.targetFormat !== 'jpeg') {
      types.push('format_conversion');
    }

    if (settings.quality !== undefined && settings.quality < 100) {
      types.push('compression');
    }

    if (settings.maxWidth || settings.maxHeight) {
      types.push('resize');
    }

    if (settings.cropToAspectRatio) {
      types.push('crop');
    }

    if (settings.progressive) {
      types.push('progressive');
    }

    return types.length > 0 ? types[0] : 'compression';
  }

  /**
   * Génère une clé de cache
   */
  private generateCacheKey(imageUrl: string, settings: OptimizationRequestSettings): string {
    const settingsHash = this.hashObject(settings);
    return `${imageUrl}_${settingsHash}`;
  }

  /**
   * Crée un hash d'objet
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Traite la queue d'optimisation
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    while (this.processingQueue.size > 0 && this.currentJobs < this.maxConcurrentJobs) {
      const entries = Array.from(this.processingQueue.entries());
      const [requestId, request] = entries[0];
      
      this.processingQueue.delete(requestId);
      this.currentJobs++;
      
      // Traiter la requête en arrière-plan
      this.processRequest(request).finally(() => {
        this.currentJobs--;
      });
    }

    this.isProcessing = false;
  }

  /**
   * Traite une requête individuelle
   */
  private async processRequest(request: ImageOptimizationRequest): Promise<void> {
    try {
      // Mettre à jour le statut
      request.status = 'processing';
      request.updatedAt = new Date().toISOString();
      await this.saveOptimizationRequest(request);

      // Optimiser l'image
      const optimization = await this.optimizeImage(request.imageUrl, request.settings, request.userId);
      
      // Mettre à jour le statut
      request.status = 'completed';
      request.completedAt = new Date().toISOString();
      request.updatedAt = new Date().toISOString();
      await this.saveOptimizationRequest(request);

      // Envoyer le callback si nécessaire
      if (request.callbackUrl) {
        await this.sendCallback(request, optimization);
      }

    } catch (error) {
      console.error('❌ Erreur traitement requête:', error);
      
      // Mettre à jour le statut d'erreur
      request.status = 'failed';
      request.updatedAt = new Date().toISOString();
      await this.saveOptimizationRequest(request);
    }
  }

  /**
   * Envoie un callback de complétion
   */
  private async sendCallback(request: ImageOptimizationRequest, optimization: ImageOptimization): Promise<void> {
    try {
      await fetch(request.callbackUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request.id,
          status: request.status,
          optimization,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('❌ Erreur envoi callback:', error);
    }
  }

  /**
   * Sauvegarde une requête d'optimisation
   */
  private async saveOptimizationRequest(request: ImageOptimizationRequest): Promise<void> {
    try {
      const { error } = await supabase
        .from('image_optimization_requests')
        .upsert({
          id: request.id,
          image_url: request.imageUrl,
          user_id: request.userId,
          settings: request.settings,
          priority: request.priority,
          callback_url: request.callbackUrl,
          webhook_url: request.webhookUrl,
          status: request.status,
          created_at: request.createdAt,
          updated_at: request.updatedAt,
          completed_at: request.completedAt,
          metadata: request.metadata
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde requête optimisation:', error);
    }
  }

  /**
   * Sauvegarde une optimisation
   */
  private async saveOptimization(optimization: Omit<ImageOptimization, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>, originalUrl: string, _userId?: string): Promise<ImageOptimization> {
    try {
      const { data, error } = await supabase
        .from('image_optimizations')
        .insert({
          original_image_id: optimization.originalImageId,
          original_url: originalUrl,
          optimized_url: optimization.optimizedUrl,
          original_format: optimization.originalFormat,
          optimized_format: optimization.optimizedFormat,
          original_size: optimization.originalSize,
          optimized_size: optimization.optimizedSize,
          compression_ratio: optimization.compressionRatio,
          dimensions: optimization.dimensions,
          quality: optimization.quality,
          optimization_type: optimization.optimizationType,
          processing_time: optimization.processingTime,
          status: optimization.status,
          error: optimization.error,
          metadata: {
          algorithm: 'canvas',
          settings: {},
          performance: {
            compressionSpeed: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            qualityScore: 80,
            structuralSimilarity: 0.9,
            perceivedQuality: 85
          },
          cache: {
            cacheKey: '',
            cacheHit: false,
            cacheSize: 0,
            lastAccessed: new Date().toISOString(),
            expiresAt: '',
            storageLocation: 'memory'
          },
          tags: [],
          aiEnhanced: false,
          processingSteps: []
        }
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de sauvegarder l\'optimisation');

      return this.mapOptimizationFromDB(data);

    } catch (error) {
      console.error('❌ Erreur sauvegarde optimisation:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques d'optimisation
   */
  async getOptimizationStats(): Promise<ImageOptimizationStats> {
    try {
      const { data, error } = await supabase.rpc('get_image_optimization_stats');

      if (error) throw error;

      const stats = data || {
        total_optimizations: 0,
        successful_optimizations: 0,
        failed_optimizations: 0,
        average_compression_ratio: 0,
        total_space_saved: 0,
        average_processing_time: 0,
        optimizations_by_format: {},
        optimizations_by_type: {},
        performance: {
          average_compression_speed: 0,
          average_memory_usage: 0,
          average_quality_score: 0,
          cache_hit_rate: 0
        },
        user_stats: {
          total_users: 0,
          active_users: 0,
          average_optimizations_per_user: 0,
          top_users: []
        }
      };

      return {
        totalOptimizations: stats.total_optimizations,
        successfulOptimizations: stats.successful_optimizations,
        failedOptimizations: stats.failed_optimizations,
        averageCompressionRatio: stats.average_compression_ratio,
        totalSpaceSaved: stats.total_space_saved,
        averageProcessingTime: stats.average_processing_time,
        optimizationsByFormat: stats.optimizations_by_format,
        optimizationsByType: stats.optimizations_by_type,
        performance: stats.performance,
        userStats: stats.user_stats
      };

    } catch (error) {
      console.error('❌ Erreur statistiques optimisation:', error);
      throw new Error(`Échec des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🖼️ Cache d\'optimisation vidé');
  }

  /**
   * Obtient les informations du cache
   */
  getCacheInfo(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Mappeur depuis la base de données
  private mapOptimizationFromDB(data: any): ImageOptimization {
    return {
      id: data.id,
      originalImageId: data.original_image_id,
      originalUrl: data.original_url,
      optimizedUrl: data.optimized_url,
      originalFormat: data.original_format,
      optimizedFormat: data.optimized_format,
      originalSize: data.original_size,
      optimizedSize: data.optimized_size,
      compressionRatio: data.compression_ratio,
      dimensions: data.dimensions,
      quality: data.quality,
      optimizationType: data.optimization_type,
      processingTime: data.processing_time,
      status: data.status,
      error: data.error,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      metadata: data.metadata || {}
    };
  }
}

// Instance singleton
export const imageOptimizationService = new ImageOptimizationService();

// Export des fonctions utilitaires
export const submitImageOptimization = (request: Omit<ImageOptimizationRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => 
  imageOptimizationService.submitOptimizationRequest(request);

export const optimizeImage = (imageUrl: string, settings: OptimizationRequestSettings, userId?: string) => 
  imageOptimizationService.optimizeImage(imageUrl, settings, userId);

export const getOptimizationStats = () => imageOptimizationService.getOptimizationStats();
export const clearOptimizationCache = () => imageOptimizationService.clearCache();
export const getOptimizationCacheInfo = () => imageOptimizationService.getCacheInfo();
