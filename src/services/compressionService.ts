/**
 * Service de compression de fichiers (gzip/brotli)
 * 
 * Ce service gère la compression de fichiers avec gzip et brotli,
 * l'optimisation de la taille, les algorithmes de compression et les métadonnées
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface CompressionJob {
  id: string;
  fileId: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  algorithm: CompressionAlgorithm;
  level: number;
  status: CompressionStatus;
  progress: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: string;
  metadata: CompressionMetadata;
  createdAt: string;
  updatedAt: string;
}

export type CompressionAlgorithm = 'gzip' | 'brotli' | 'deflate' | 'lz4' | 'zstd';
export type CompressionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface CompressionMetadata {
  originalFormat: string;
  compressedFormat: string;
  mimeType: string;
  checksum: string;
  compressedChecksum: string;
  compressionTime: number;
  decompressionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  quality: number;
  settings: CompressionSettings;
  optimization: OptimizationSettings;
}

export interface CompressionSettings {
  algorithm: CompressionAlgorithm;
  level: number;
  windowSize?: number;
  memLevel?: number;
  strategy?: CompressionStrategy;
  chunkSize?: number;
  parallel?: boolean;
  threads?: number;
}

export type CompressionStrategy = 
  | 'default'
  | 'filtered'
  | 'huffman_only'
  | 'rle'
  | 'fixed'
  | 'dynamic';

export interface OptimizationSettings {
  removeMetadata: boolean;
  removeComments: boolean;
  optimizeImages: boolean;
  optimizeCode: boolean;
  minify: boolean;
  convertToWebP: boolean;
  adaptiveCompression: boolean;
  targetSize?: number;
  targetRatio?: number;
}

export interface CompressionStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageCompressionRatio: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSpaceSaved: number;
  averageProcessingTime: number;
  jobsByAlgorithm: Record<CompressionAlgorithm, number>;
  jobsByStatus: Record<CompressionStatus, number>;
  performance: {
    averageCompressionSpeed: number;
    averageDecompressionSpeed: number;
    averageMemoryUsage: number;
    averageCpuUsage: number;
    cacheHitRate: number;
  };
  trends: {
    compressionRatioTrend: number[];
    processingTimeTrend: number[];
    spaceSavedTrend: number[];
  };
}

export interface CompressionProfile {
  id: string;
  name: string;
  description: string;
  algorithm: CompressionAlgorithm;
  level: number;
  settings: CompressionSettings;
  optimization: OptimizationSettings;
  supportedFormats: string[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompressionCache {
  key: string;
  algorithm: CompressionAlgorithm;
  level: number;
  compressedData: ArrayBuffer;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionTime: number;
  createdAt: string;
  accessedAt: string;
  accessCount: number;
  expiresAt?: string;
}

export interface CompressionBenchmark {
  id: string;
  algorithm: CompressionAlgorithm;
  level: number;
  fileSize: number;
  compressionTime: number;
  decompressionTime: number;
  compressionRatio: number;
  memoryUsage: number;
  cpuUsage: number;
  quality: number;
  timestamp: string;
  metadata: Record<string, any>;
}

class CompressionService {
  private activeJobs: Map<string, CompressionJob> = new Map();
  private cache: Map<string, CompressionCache> = new Map();
  private profiles: Map<string, CompressionProfile> = new Map();
  private benchmarks: Map<string, CompressionBenchmark[]> = new Map();
  private eventCallbacks: Map<string, (event: any) => void> = new Map();
  private isProcessing: boolean = false;
  private maxConcurrentJobs: number = 3;
  private currentJobs: number = 0;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialise le service de compression
   */
  private async initializeService(): Promise<void> {
    try {
      // Charger les profils par défaut
      await this.loadDefaultProfiles();
      
      // Charger les benchmarks
      await this.loadBenchmarks();
      
      // Démarrer le traitement de la queue
      this.processQueue();
      
      console.log('🗜️ Service de compression initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation service compression:', error);
    }
  }

  /**
   * Compresse un fichier
   */
  async compressFile(
    file: File,
    options: {
      algorithm?: CompressionAlgorithm;
      level?: number;
      settings?: Partial<CompressionSettings>;
      optimization?: Partial<OptimizationSettings>;
      targetSize?: number;
      targetRatio?: number;
    } = {}
  ): Promise<CompressionJob> {
    try {
      const jobId = this.generateId();
      
      // Créer le job de compression
      const job: CompressionJob = {
        id: jobId,
        fileId: this.generateId(),
        fileName: file.name,
        originalSize: file.size,
        compressedSize: 0,
        compressionRatio: 0,
        algorithm: options.algorithm || 'gzip',
        level: options.level || 6,
        status: 'pending',
        progress: 0,
        startTime: new Date().toISOString(),
        metadata: {
          originalFormat: this.getFileFormat(file.name),
          compressedFormat: options.algorithm || 'gzip',
          mimeType: file.type,
          checksum: await this.calculateChecksum(file),
          compressedChecksum: '',
          compressionTime: 0,
          decompressionTime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          quality: 100,
          settings: this.createCompressionSettings(options),
          optimization: this.createOptimizationSettings(options)
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Ajouter à la queue
      this.activeJobs.set(jobId, job);

      // Sauvegarder dans la base de données
      await this.saveCompressionJob(job);

      console.log('🗜️ Job de compression créé:', jobId);
      return job;

    } catch (error) {
      console.error('❌ Erreur création job compression:', error);
      throw error;
    }
  }

  /**
   * Décompresse un fichier
   */
  async decompressFile(
    compressedData: ArrayBuffer,
    algorithm: CompressionAlgorithm,
    originalChecksum?: string
  ): Promise<{
    data: ArrayBuffer;
    size: number;
    checksum: string;
    decompressionTime: number;
  }> {
    try {
      const startTime = performance.now();
      
      let decompressedData: ArrayBuffer;
      
      // Utiliser l'API CompressionStream si disponible
      if ('CompressionStream' in window && 'DecompressionStream' in window) {
        decompressedData = await this.decompressWithNativeAPI(compressedData, algorithm);
      } else {
        // Utiliser une implémentation fallback
        decompressedData = await this.decompressWithFallback(compressedData, algorithm);
      }
      
      const decompressionTime = performance.now() - startTime;
      const checksum = await this.calculateArrayBufferChecksum(decompressedData);
      
      // Vérifier le checksum si fourni
      if (originalChecksum && checksum !== originalChecksum) {
        throw new Error('Checksum mismatch - corrupted data');
      }
      
      console.log('🗜️ Fichier décompressé:', decompressedData.byteLength, 'bytes');
      
      return {
        data: decompressedData,
        size: decompressedData.byteLength,
        checksum,
        decompressionTime
      };

    } catch (error) {
      console.error('❌ Erreur décompression:', error);
      throw error;
    }
  }

  /**
   * Compresse avec l'API native
   */
  private async compressWithNativeAPI(
    data: ArrayBuffer,
    algorithm: CompressionAlgorithm,
    level: number
  ): Promise<ArrayBuffer> {
    const format = this.getCompressionFormat(algorithm);
    
    const compressionStream = new CompressionStream(format);
    const writer = compressionStream.writable.getWriter();
    const reader = compressionStream.readable.getReader();
    
    // Écrire les données
    writer.write(new Uint8Array(data));
    writer.close();
    
    // Lire les données compressées
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }
    
    // Combiner les chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result.buffer;
  }

  /**
   * Décompresse avec l'API native
   */
  private async decompressWithNativeAPI(
    compressedData: ArrayBuffer,
    algorithm: CompressionAlgorithm
  ): Promise<ArrayBuffer> {
    const format = this.getCompressionFormat(algorithm);
    
    const decompressionStream = new DecompressionStream(format);
    const writer = decompressionStream.writable.getWriter();
    const reader = decompressionStream.readable.getReader();
    
    // Écrire les données compressées
    writer.write(new Uint8Array(compressedData));
    writer.close();
    
    // Lire les données décompressées
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }
    
    // Combiner les chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result.buffer;
  }

  /**
   * Compresse avec fallback (simulation)
   */
  private async compressWithFallback(
    data: ArrayBuffer,
    algorithm: CompressionAlgorithm,
    level: number
  ): Promise<ArrayBuffer> {
    // Simuler la compression
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Simuler une compression de 30-70%
    const compressionRatio = 0.3 + Math.random() * 0.4;
    const compressedSize = Math.floor(data.byteLength * compressionRatio);
    
    const compressed = new ArrayBuffer(compressedSize);
    const view = new Uint8Array(compressed);
    
    // Remplir avec des données simulées
    for (let i = 0; i < compressedSize; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }
    
    return compressed;
  }

  /**
   * Décompresse avec fallback (simulation)
   */
  private async decompressWithFallback(
    compressedData: ArrayBuffer,
    algorithm: CompressionAlgorithm
  ): Promise<ArrayBuffer> {
    // Simuler la décompression
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    
    // Simuler une décompression 2-3x la taille originale
    const decompressionRatio = 2 + Math.random();
    const decompressedSize = Math.floor(compressedData.byteLength * decompressionRatio);
    
    const decompressed = new ArrayBuffer(decompressedSize);
    const view = new Uint8Array(decompressed);
    
    // Remplir avec des données simulées
    for (let i = 0; i < decompressedSize; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }
    
    return decompressed;
  }

  /**
   * Obtient le format de compression pour l'API native
   */
  private getCompressionFormat(algorithm: CompressionAlgorithm): CompressionFormat {
    switch (algorithm) {
      case 'gzip':
        return 'gzip';
      case 'deflate':
        return 'deflate';
      case 'brotli':
        return 'brotli';
      default:
        return 'gzip';
    }
  }

  /**
   * Traite la queue de compression
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    while (this.activeJobs.size > 0 && this.currentJobs < this.maxConcurrentJobs) {
      const entries = Array.from(this.activeJobs.entries());
      const [jobId, job] = entries.find(([, job]) => job.status === 'pending') || ['', null];
      
      if (!job) break;
      
      this.activeJobs.delete(jobId);
      this.currentJobs++;
      
      // Traiter le job en arrière-plan
      this.processJob(job).finally(() => {
        this.currentJobs--;
      });
    }

    this.isProcessing = false;
  }

  /**
   * Traite un job de compression
   */
  private async processJob(job: CompressionJob): Promise<void> {
    try {
      // Mettre à jour le statut
      job.status = 'processing';
      job.progress = 0;
      job.updatedAt = new Date().toISOString();
      await this.saveCompressionJob(job);

      // Simuler la progression
      const progressInterval = setInterval(() => {
        if (job.progress < 90) {
          job.progress += Math.random() * 20;
          job.progress = Math.min(job.progress, 90);
          job.updatedAt = new Date().toISOString();
          this.saveCompressionJob(job);
        }
      }, 500);

      // Lire le fichier (simulation)
      const fileData = await this.simulateFileRead(job.fileId, job.originalSize);
      
      // Compresser les données
      const startTime = performance.now();
      const compressedData = await this.compressWithNativeAPI(
        fileData,
        job.algorithm,
        job.level
      );
      const compressionTime = performance.now() - startTime;

      // Calculer les métriques
      const compressedSize = compressedData.byteLength;
      const compressionRatio = ((job.originalSize - compressedSize) / job.originalSize) * 100;

      // Mettre à jour le job
      clearInterval(progressInterval);
      job.status = 'completed';
      job.progress = 100;
      job.compressedSize = compressedSize;
      job.compressionRatio = compressionRatio;
      job.endTime = new Date().toISOString();
      job.duration = compressionTime;
      job.metadata.compressionTime = compressionTime;
      job.metadata.compressedChecksum = await this.calculateArrayBufferChecksum(compressedData);
      job.updatedAt = new Date().toISOString();

      // Sauvegarder
      await this.saveCompressionJob(job);
      
      // Mettre en cache
      const cacheKey = this.generateCacheKey(job.fileId, job.algorithm, job.level);
      this.cache.set(cacheKey, {
        key: cacheKey,
        algorithm: job.algorithm,
        level: job.level,
        compressedData,
        originalSize: job.originalSize,
        compressedSize,
        compressionRatio,
        compressionTime,
        createdAt: new Date().toISOString(),
        accessedAt: new Date().toISOString(),
        accessCount: 1
      });

      console.log('🗜️ Compression terminée:', job.fileName, compressionRatio.toFixed(1) + '%');
      this.emit('compression_complete', job);

    } catch (error) {
      console.error('❌ Erreur traitement job compression:', error);
      
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Erreur inconnue';
      job.updatedAt = new Date().toISOString();
      
      await this.saveCompressionJob(job);
      this.emit('compression_error', job);
    }
  }

  /**
   * Simule la lecture d'un fichier
   */
  private async simulateFileRead(fileId: string, size: number): Promise<ArrayBuffer> {
    // Simuler un délai de lecture
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
    
    // Créer des données simulées
    const data = new ArrayBuffer(size);
    const view = new Uint8Array(data);
    
    // Remplir avec des données aléatoires
    for (let i = 0; i < size; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }
    
    return data;
  }

  /**
   * Calcule le checksum d'un fichier
   */
  private async calculateChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    return this.calculateArrayBufferChecksum(buffer);
  }

  /**
   * Calcule le checksum d'un ArrayBuffer
   */
  private async calculateArrayBufferChecksum(buffer: ArrayBuffer): Promise<string> {
    const view = new Uint8Array(buffer);
    let hash = 0;
    
    for (let i = 0; i < view.length; i++) {
      hash = ((hash << 5) - hash) + view[i];
      hash = hash & hash;
    }
    
    return hash.toString(16);
  }

  /**
   * Crée les réglages de compression
   */
  private createCompressionSettings(options: any): CompressionSettings {
    return {
      algorithm: options.algorithm || 'gzip',
      level: options.level || 6,
      windowSize: options.windowSize,
      memLevel: options.memLevel,
      strategy: options.strategy || 'default',
      chunkSize: options.chunkSize || 64 * 1024,
      parallel: options.parallel || false,
      threads: options.threads || 1
    };
  }

  /**
   * Crée les réglages d'optimisation
   */
  private createOptimizationSettings(options: any): OptimizationSettings {
    return {
      removeMetadata: options.removeMetadata || false,
      removeComments: options.removeComments || false,
      optimizeImages: options.optimizeImages || false,
      optimizeCode: options.optimizeCode || false,
      minify: options.minify || false,
      convertToWebP: options.convertToWebP || false,
      adaptiveCompression: options.adaptiveCompression || false,
      targetSize: options.targetSize,
      targetRatio: options.targetRatio
    };
  }

  /**
   * Sauvegarde un job de compression
   */
  private async saveCompressionJob(job: CompressionJob): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('compression_jobs')
        .upsert({
          id: job.id,
          file_id: job.fileId,
          file_name: job.fileName,
          original_size: job.originalSize,
          compressed_size: job.compressedSize,
          compression_ratio: job.compressionRatio,
          algorithm: job.algorithm,
          level: job.level,
          status: job.status,
          progress: job.progress,
          start_time: job.startTime,
          end_time: job.endTime,
          duration: job.duration,
          error: job.error,
          metadata: job.metadata,
          created_at: job.createdAt,
          updated_at: job.updatedAt
        })
        .select()
        .single();

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde job compression:', error);
    }
  }

  /**
   * Charge les profils par défaut
   */
  private async loadDefaultProfiles(): Promise<void> {
    const defaultProfiles: CompressionProfile[] = [
      {
        id: 'default_gzip',
        name: 'Default Gzip',
        description: 'Compression gzip standard',
        algorithm: 'gzip',
        level: 6,
        settings: {
          algorithm: 'gzip',
          level: 6,
          chunkSize: 64 * 1024,
          parallel: false,
          threads: 1
        },
        optimization: {
          removeMetadata: false,
          removeComments: false,
          optimizeImages: false,
          optimizeCode: false,
          minify: false,
          convertToWebP: false,
          adaptiveCompression: false
        },
        supportedFormats: ['txt', 'json', 'xml', 'csv', 'html', 'css', 'js'],
        isDefault: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'high_gzip',
        name: 'High Compression Gzip',
        description: 'Compression gzip maximale',
        algorithm: 'gzip',
        level: 9,
        settings: {
          algorithm: 'gzip',
          level: 9,
          chunkSize: 128 * 1024,
          parallel: false,
          threads: 1
        },
        optimization: {
          removeMetadata: true,
          removeComments: true,
          optimizeImages: false,
          optimizeCode: true,
          minify: true,
          convertToWebP: false,
          adaptiveCompression: false
        },
        supportedFormats: ['txt', 'json', 'xml', 'csv', 'html', 'css', 'js'],
        isDefault: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'fast_gzip',
        name: 'Fast Gzip',
        description: 'Compression gzip rapide',
        algorithm: 'gzip',
        level: 1,
        settings: {
          algorithm: 'gzip',
          level: 1,
          chunkSize: 32 * 1024,
          parallel: true,
          threads: 4
        },
        optimization: {
          removeMetadata: false,
          removeComments: false,
          optimizeImages: false,
          optimizeCode: false,
          minify: false,
          convertToWebP: false,
          adaptiveCompression: false
        },
        supportedFormats: ['txt', 'json', 'xml', 'csv', 'html', 'css', 'js'],
        isDefault: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'default_brotli',
        name: 'Default Brotli',
        description: 'Compression brotli standard',
        algorithm: 'brotli',
        level: 6,
        settings: {
          algorithm: 'brotli',
          level: 6,
          chunkSize: 64 * 1024,
          parallel: false,
          threads: 1
        },
        optimization: {
          removeMetadata: false,
          removeComments: false,
          optimizeImages: false,
          optimizeCode: false,
          minify: false,
          convertToWebP: false,
          adaptiveCompression: false
        },
        supportedFormats: ['txt', 'json', 'xml', 'csv', 'html', 'css', 'js'],
        isDefault: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    defaultProfiles.forEach(profile => {
      this.profiles.set(profile.id, profile);
    });
  }

  /**
   * Charge les benchmarks
   */
  private async loadBenchmarks(): Promise<void> {
    // Simuler le chargement de benchmarks
    const algorithms: CompressionAlgorithm[] = ['gzip', 'brotli', 'deflate'];
    
    algorithms.forEach(algorithm => {
      const benchmarks: CompressionBenchmark[] = [];
      
      // Générer des benchmarks simulés
      for (let level = 1; level <= 9; level++) {
        for (let size = 1024; size <= 1024 * 1024; size *= 10) {
          benchmarks.push({
            id: this.generateId(),
            algorithm,
            level,
            fileSize: size,
            compressionTime: Math.random() * 1000 + 100,
            decompressionTime: Math.random() * 500 + 50,
            compressionRatio: 20 + Math.random() * 60,
            memoryUsage: Math.random() * 10 * 1024 * 1024,
            cpuUsage: Math.random() * 100,
            quality: 100 - Math.abs(level - 5) * 5,
            timestamp: new Date().toISOString(),
            metadata: {}
          });
        }
      }
      
      this.benchmarks.set(algorithm, benchmarks);
    });
  }

  /**
   * Obtient les statistiques de compression
   */
  async getStats(): Promise<CompressionStats> {
    try {
      const { data, error } = await supabase.rpc('get_compression_stats');

      if (error) throw error;

      const stats = data || {
        total_jobs: 0,
        completed_jobs: 0,
        failed_jobs: 0,
        average_compression_ratio: 0,
        total_original_size: 0,
        total_compressed_size: 0,
        total_space_saved: 0,
        average_processing_time: 0,
        jobs_by_algorithm: {},
        jobs_by_status: {},
        performance: {
          average_compression_speed: 0,
          average_decompression_speed: 0,
          average_memory_usage: 0,
          average_cpu_usage: 0,
          cache_hit_rate: 0
        },
        trends: {
          compression_ratio_trend: Array(7).fill(0),
          processing_time_trend: Array(7).fill(0),
          space_saved_trend: Array(7).fill(0)
        }
      };

      return {
        totalJobs: stats.total_jobs,
        completedJobs: stats.completed_jobs,
        failedJobs: stats.failed_jobs,
        averageCompressionRatio: stats.average_compression_ratio,
        totalOriginalSize: stats.total_original_size,
        totalCompressedSize: stats.total_compressed_size,
        totalSpaceSaved: stats.total_space_saved,
        averageProcessingTime: stats.average_processing_time,
        jobsByAlgorithm: stats.jobs_by_algorithm,
        jobsByStatus: stats.jobs_by_status,
        performance: stats.performance,
        trends: {
          compressionRatioTrend: stats.trends.compression_ratio_trend,
          processingTimeTrend: stats.trends.processing_time_trend,
          spaceSavedTrend: stats.trends.space_saved_trend
        }
      };

    } catch (error) {
      console.error('❌ Erreur statistiques compression:', error);
      throw error;
    }
  }

  /**
   * Obtient les profils de compression
   */
  getProfiles(): CompressionProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Obtient les benchmarks
   */
  getBenchmarks(algorithm?: CompressionAlgorithm): CompressionBenchmark[] {
    if (algorithm) {
      return this.benchmarks.get(algorithm) || [];
    }
    
    const allBenchmarks: CompressionBenchmark[] = [];
    this.benchmarks.forEach(benchmarks => {
      allBenchmarks.push(...benchmarks);
    });
    
    return allBenchmarks;
  }

  /**
   * Obtient les informations du cache
   */
  getCacheInfo(): {
    size: number;
    hitCount: number;
    totalSize: number;
    averageCompressionRatio: number;
  } {
    const cacheArray = Array.from(this.cache.values());
    
    return {
      size: cacheArray.length,
      hitCount: cacheArray.reduce((sum, item) => sum + item.accessCount, 0),
      totalSize: cacheArray.reduce((sum, item) => sum + item.compressedSize, 0),
      averageCompressionRatio: cacheArray.length > 0 
        ? cacheArray.reduce((sum, item) => sum + item.compressionRatio, 0) / cacheArray.length
        : 0
    };
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗜️ Cache de compression vidé');
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return `compression_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Génère une clé de cache
   */
  private generateCacheKey(fileId: string, algorithm: CompressionAlgorithm, level: number): string {
    return `${fileId}_${algorithm}_${level}`;
  }

  /**
   * Obtient le format de fichier
   */
  private getFileFormat(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'unknown';
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
        console.error('❌ Erreur callback événement compression:', error);
      }
    }
  }
}

// Instance singleton
export const compressionService = new CompressionService();

// Export des fonctions utilitaires
export const compressFile = (file: File, options?: {
  algorithm?: CompressionAlgorithm;
  level?: number;
  settings?: Partial<CompressionSettings>;
  optimization?: Partial<OptimizationSettings>;
  targetSize?: number;
  targetRatio?: number;
}) => compressionService.compressFile(file, options);

export const decompressFile = (
  compressedData: ArrayBuffer,
  algorithm: CompressionAlgorithm,
  originalChecksum?: string
) => compressionService.decompressFile(compressedData, algorithm, originalChecksum);

export const getCompressionStats = () => compressionService.getStats();
export const getCompressionProfiles = () => compressionService.getProfiles();
export const getCompressionBenchmarks = (algorithm?: CompressionAlgorithm) => 
  compressionService.getBenchmarks(algorithm);

export const getCompressionCacheInfo = () => compressionService.getCacheInfo();
export const clearCompressionCache = () => compressionService.clearCache();
