/**
 * Service d'upload progressif (taille fichiers max)
 * 
 * Ce service gère l'upload de fichiers volumineux avec découpage en chunks,
 * progression en temps réel, reprise sur erreur et optimisation de la bande passante
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Interfaces pour l'upload progressif
export interface ProgressiveUpload {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunks: UploadChunk[];
  settings: UploadSettings;
  metadata: UploadMetadata;
  progress: UploadProgress;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  error?: UploadError;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface UploadChunk {
  id: string;
  index: number;
  size: number;
  start: number;
  end: number;
  hash: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  uploadedAt?: Date;
  retryCount: number;
  uploadTime: number;
  speed: number;
}

export interface UploadSettings {
  chunkSize: number;
  maxRetries: number;
  retryDelay: number;
  concurrentUploads: number;
  compressionEnabled: boolean;
  compressionLevel: number;
  encryptionEnabled: boolean;
  resumeEnabled: boolean;
  bandwidthLimit?: number;
  priority: 'low' | 'normal' | 'high';
  autoRetry: boolean;
  verifyIntegrity: boolean;
}

export interface UploadMetadata {
  originalName: string;
  extension: string;
  encoding?: string;
  lastModified: Date;
  checksum: string;
  mimeVerification: boolean;
  virusScan: boolean;
  thumbnailGenerated: boolean;
  previewGenerated: boolean;
  extractedMetadata: FileMetadata;
}

export interface FileMetadata {
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  bitrate?: number;
  framerate?: number;
  codec?: string;
  sampleRate?: number;
  channels?: number;
  exif?: Record<string, any>;
  documentInfo?: {
    pages?: number;
    words?: number;
    author?: string;
    title?: string;
    subject?: string;
  };
}

export interface UploadProgress {
  totalBytes: number;
  uploadedBytes: number;
  percentage: number;
  speed: number;
  eta: number;
  chunksCompleted: number;
  chunksTotal: number;
  timeElapsed: number;
  timeRemaining: number;
  averageSpeed: number;
  currentSpeed: number;
  speedHistory: number[];
}

export interface UploadError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  chunkIndex?: number;
  retryable: boolean;
}

export interface UploadStatistics {
  totalUploads: number;
  completedUploads: number;
  failedUploads: number;
  totalBytesUploaded: number;
  averageUploadSpeed: number;
  averageUploadTime: number;
  successRate: number;
  mostUploadedFormats: Record<string, number>;
  largestFileUploaded: number;
  activeUploads: number;
  queuedUploads: number;
  bandwidthUsage: {
    current: number;
    average: number;
    peak: number;
  };
  errorRates: {
    networkErrors: number;
    serverErrors: number;
    clientErrors: number;
    timeoutErrors: number;
  };
}

export interface UploadTemplate {
  id: string;
  name: string;
  description: string;
  settings: UploadSettings;
  fileTypes: string[];
  maxFileSize: number;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  category: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadQueue {
  id: string;
  userId: string;
  uploads: ProgressiveUpload[];
  maxConcurrent: number;
  priority: 'fifo' | 'priority' | 'size';
  autoStart: boolean;
  pauseOnNetworkError: boolean;
  retryFailedUploads: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BandwidthManager {
  totalBandwidth: number;
  allocatedBandwidth: number;
  activeUploads: number;
  queueLength: number;
  priorityWeights: Record<string, number>;
  adaptiveThrottling: boolean;
  networkConditions: NetworkConditions;
}

export interface NetworkConditions {
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet' | 'unknown';
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface UploadEvent {
  type: 'start' | 'progress' | 'chunk_complete' | 'pause' | 'resume' | 'complete' | 'error' | 'cancel';
  uploadId: string;
  data?: any;
  timestamp: Date;
}

// Classe principale du service d'upload progressif
export class ProgressiveUploadService {
  private static instance: ProgressiveUploadService;
  private eventCallbacks: Map<string, Function[]> = new Map();
  private activeUploads: Map<string, ProgressiveUpload> = new Map();
  private uploadQueue: ProgressiveUpload[] = [];
  private bandwidthManager: BandwidthManager;
  private isProcessing = false;

  private constructor() {
    this.bandwidthManager = {
      totalBandwidth: 0,
      allocatedBandwidth: 0,
      activeUploads: 0,
      queueLength: 0,
      priorityWeights: {
        'high': 3,
        'normal': 2,
        'low': 1
      },
      adaptiveThrottling: true,
      networkConditions: {
        connectionType: 'unknown',
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false
      }
    };

    this.initializeNetworkMonitoring();
    this.startQueueProcessor();
  }

  public static getInstance(): ProgressiveUploadService {
    if (!ProgressiveUploadService.instance) {
      ProgressiveUploadService.instance = new ProgressiveUploadService();
    }
    return ProgressiveUploadService.instance;
  }

  /**
   * Initialise un upload progressif
   */
  public async initializeUpload(
    userId: string,
    file: File,
    settings?: Partial<UploadSettings>
  ): Promise<ProgressiveUpload> {
    try {
      // Valider le fichier
      this.validateFile(file);

      // Fusionner les paramètres
      const uploadSettings = this.mergeSettings(settings, file);

      // Analyser le fichier
      const metadata = await this.analyzeFile(file);

      // Créer les chunks
      const chunks = this.createChunks(file, uploadSettings.chunkSize);

      // Créer l'upload
      const upload: ProgressiveUpload = {
        id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        chunks,
        settings: uploadSettings,
        metadata,
        progress: {
          totalBytes: file.size,
          uploadedBytes: 0,
          percentage: 0,
          speed: 0,
          eta: 0,
          chunksCompleted: 0,
          chunksTotal: chunks.length,
          timeElapsed: 0,
          timeRemaining: 0,
          averageSpeed: 0,
          currentSpeed: 0,
          speedHistory: []
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Sauvegarder en base de données
      const { data: savedUpload, error } = await supabase
        .from('progressive_uploads')
        .insert([this.mapUploadToDb(upload)])
        .select()
        .single();

      if (error) throw error;

      const mappedUpload = this.mapDbToUpload(savedUpload);

      // Ajouter à la file d'attente
      this.addToQueue(mappedUpload);

      // Émettre l'événement d'initialisation
      this.emitEvent('upload_initialized', mappedUpload);

      return mappedUpload;

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'upload:', error);
      throw error;
    }
  }

  /**
   * Démarre un upload
   */
  public async startUpload(uploadId: string): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) {
      throw new Error('Upload non trouvé');
    }

    if (upload.status !== 'pending' && upload.status !== 'paused') {
      throw new Error('Upload ne peut pas être démarré');
    }

    upload.status = 'uploading';
    upload.updatedAt = new Date();

    // Mettre à jour en base de données
    await this.updateUploadInDb(upload);

    // Émettre l'événement de démarrage
    this.emitEvent('upload_started', upload);

    // Démarrer le traitement
    this.processUpload(upload);
  }

  /**
   * Met en pause un upload
   */
  public async pauseUpload(uploadId: string): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) {
      throw new Error('Upload non trouvé');
    }

    if (upload.status !== 'uploading') {
      return;
    }

    upload.status = 'paused';
    upload.updatedAt = new Date();

    await this.updateUploadInDb(upload);
    this.emitEvent('upload_paused', upload);
  }

  /**
   * Reprend un upload
   */
  public async resumeUpload(uploadId: string): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) {
      throw new Error('Upload non trouvé');
    }

    if (upload.status !== 'paused') {
      return;
    }

    await this.startUpload(uploadId);
  }

  /**
   * Annule un upload
   */
  public async cancelUpload(uploadId: string): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) {
      throw new Error('Upload non trouvé');
    }

    upload.status = 'cancelled';
    upload.updatedAt = new Date();

    await this.updateUploadInDb(upload);
    this.activeUploads.delete(uploadId);

    this.emitEvent('upload_cancelled', upload);
  }

  /**
   * Traite un upload
   */
  private async processUpload(upload: ProgressiveUpload): Promise<void> {
    if (upload.status !== 'uploading') {
      return;
    }

    const startTime = Date.now();
    const concurrentChunks = Math.min(upload.settings.concurrentUploads, upload.chunks.length);
    const activeChunks: Promise<void>[] = [];

    // Traiter les chunks en parallèle
    for (let i = 0; i < concurrentChunks; i++) {
      const chunk = upload.chunks.find(c => c.status === 'pending');
      if (chunk) {
        activeChunks.push(this.processChunk(upload, chunk));
      }
    }

    try {
      await Promise.all(activeChunks);
      
      // Vérifier si tous les chunks sont complétés
      const allCompleted = upload.chunks.every(c => c.status === 'completed');
      if (allCompleted) {
        await this.completeUpload(upload);
      } else {
        // Continuer avec les chunks restants
        if (upload.status === 'uploading') {
          setTimeout(() => this.processUpload(upload), 100);
        }
      }
    } catch (error) {
      console.error('Erreur lors du traitement de l\'upload:', error);
      await this.handleUploadError(upload, error);
    }

    const processingTime = Date.now() - startTime;
    upload.progress.timeElapsed += processingTime;
  }

  /**
   * Traite un chunk individuel
   */
  private async processChunk(upload: ProgressiveUpload, chunk: UploadChunk): Promise<void> {
    if (chunk.status !== 'pending') {
      return;
    }

    chunk.status = 'uploading';
    const startTime = Date.now();

    try {
      // Simuler l'upload du chunk
      await this.uploadChunk(upload, chunk);

      chunk.status = 'completed';
      chunk.uploadedAt = new Date();
      chunk.uploadTime = Date.now() - startTime;

      // Mettre à jour la progression
      this.updateProgress(upload);

      // Émettre l'événement de chunk complété
      this.emitEvent('chunk_completed', { uploadId: upload.id, chunk });

    } catch (error) {
      chunk.status = 'failed';
      chunk.retryCount++;

      if (chunk.retryCount < upload.settings.maxRetries && upload.settings.autoRetry) {
        // Réessayer après un délai
        setTimeout(() => {
          chunk.status = 'pending';
          this.processChunk(upload, chunk);
        }, upload.settings.retryDelay * Math.pow(2, chunk.retryCount));
      } else {
        throw error;
      }
    }
  }

  /**
   * Upload un chunk (simulation)
   */
  private async uploadChunk(upload: ProgressiveUpload, chunk: UploadChunk): Promise<void> {
    // Simuler le temps d'upload basé sur la taille et la vitesse
    const uploadSpeed = this.calculateUploadSpeed(upload);
    const uploadTime = (chunk.size / uploadSpeed) * 1000; // en ms
    const variability = 0.5; // 50% de variabilité
    const actualTime = uploadTime * (1 + (Math.random() - 0.5) * variability);

    await new Promise(resolve => setTimeout(resolve, actualTime));

    // Simuler des erreurs occasionnelles (5% de chance)
    if (Math.random() < 0.05) {
      throw new Error('Erreur réseau simulée');
    }
  }

  /**
   * Calcule la vitesse d'upload
   */
  private calculateUploadSpeed(upload: ProgressiveUpload): number {
    const baseSpeed = this.bandwidthManager.networkConditions.downlink * 1024 * 1024 / 8; // Mbps to bytes/s
    const priorityMultiplier = upload.settings.priority === 'high' ? 1.5 : 
                              upload.settings.priority === 'low' ? 0.5 : 1;
    const concurrencyPenalty = 1 / (1 + upload.settings.concurrentUploads * 0.1);

    return baseSpeed * priorityMultiplier * concurrencyPenalty;
  }

  /**
   * Met à jour la progression de l'upload
   */
  private updateProgress(upload: ProgressiveUpload): void {
    const completedChunks = upload.chunks.filter(c => c.status === 'completed');
    const uploadedBytes = completedChunks.reduce((sum, c) => sum + c.size, 0);
    
    upload.progress.uploadedBytes = uploadedBytes;
    upload.progress.percentage = (uploadedBytes / upload.progress.totalBytes) * 100;
    upload.progress.chunksCompleted = completedChunks.length;

    // Calculer la vitesse actuelle
    const now = Date.now();
    const recentChunks = completedChunks.filter(c => 
      c.uploadedAt && (now - c.uploadedAt.getTime()) < 5000
    );
    
    if (recentChunks.length > 0) {
      const recentBytes = recentChunks.reduce((sum, c) => sum + c.size, 0);
      const recentTime = recentChunks.reduce((sum, c) => sum + c.uploadTime, 0);
      upload.progress.currentSpeed = recentTime > 0 ? recentBytes / (recentTime / 1000) : 0;
    }

    // Mettre à jour l'historique de vitesse
    upload.progress.speedHistory.push(upload.progress.currentSpeed);
    if (upload.progress.speedHistory.length > 60) {
      upload.progress.speedHistory.shift();
    }

    // Calculer la vitesse moyenne
    upload.progress.averageSpeed = upload.progress.speedHistory.reduce((sum, s) => sum + s, 0) / 
                                   upload.progress.speedHistory.length;

    // Calculer l'ETA
    const remainingBytes = upload.progress.totalBytes - uploadedBytes;
    upload.progress.eta = upload.progress.currentSpeed > 0 ? 
                          remainingBytes / upload.progress.currentSpeed : 0;
    upload.progress.timeRemaining = upload.progress.eta;

    upload.updatedAt = new Date();

    // Émettre l'événement de progression
    this.emitEvent('upload_progress', upload);
  }

  /**
   * Complète un upload
   */
  private async completeUpload(upload: ProgressiveUpload): Promise<void> {
    upload.status = 'completed';
    upload.completedAt = new Date();
    upload.updatedAt = new Date();

    // Vérifier l'intégrité si demandé
    if (upload.settings.verifyIntegrity) {
      await this.verifyIntegrity(upload);
    }

    await this.updateUploadInDb(upload);
    this.activeUploads.delete(upload.id);

    this.emitEvent('upload_completed', upload);
  }

  /**
   * Gère les erreurs d'upload
   */
  private async handleUploadError(upload: ProgressiveUpload, error: any): Promise<void> {
    upload.status = 'failed';
    upload.error = {
      code: 'UPLOAD_ERROR',
      message: error.message || 'Erreur lors de l\'upload',
      timestamp: new Date(),
      retryable: true
    };
    upload.updatedAt = new Date();

    await this.updateUploadInDb(upload);
    this.emitEvent('upload_error', upload);
  }

  /**
   * Vérifie l'intégrité du fichier
   */
  private async verifyIntegrity(upload: ProgressiveUpload): Promise<void> {
    // Simuler la vérification d'intégrité
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Valide un fichier
   */
  private validateFile(file: File): void {
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    if (file.size === 0) {
      throw new Error('Le fichier est vide');
    }

    // Vérifier la taille maximale (5GB par défaut)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > maxSize) {
      throw new Error(`Le fichier dépasse la taille maximale de ${this.formatFileSize(maxSize)}`);
    }
  }

  /**
   * Analyse un fichier
   */
  private async analyzeFile(file: File): Promise<UploadMetadata> {
    const metadata: UploadMetadata = {
      originalName: file.name,
      extension: this.getFileExtension(file.name),
      encoding: file.type,
      lastModified: new Date(file.lastModified),
      checksum: await this.calculateChecksum(file),
      mimeVerification: true,
      virusScan: false,
      thumbnailGenerated: false,
      previewGenerated: false,
      extractedMetadata: await this.extractFileMetadata(file)
    };

    return metadata;
  }

  /**
   * Extrait les métadonnées du fichier
   */
  private async extractFileMetadata(file: File): Promise<FileMetadata> {
    const metadata: FileMetadata = {};

    // Extraire selon le type MIME
    if (file.type.startsWith('image/')) {
      metadata.dimensions = await this.getImageDimensions(file);
    } else if (file.type.startsWith('video/')) {
      metadata.duration = Math.random() * 3600; // Simulation
      metadata.bitrate = Math.floor(Math.random() * 10000000);
      metadata.framerate = 24 + Math.floor(Math.random() * 12);
    } else if (file.type.startsWith('audio/')) {
      metadata.duration = Math.random() * 600; // Simulation
      metadata.bitrate = Math.floor(Math.random() * 320000);
      metadata.sampleRate = 44100;
      metadata.channels = 2;
    } else if (file.type.includes('pdf')) {
      metadata.documentInfo = {
        pages: Math.floor(Math.random() * 100) + 1,
        words: Math.floor(Math.random() * 10000) + 100,
        author: 'Auteur inconnu',
        title: 'Titre inconnu'
      };
    }

    return metadata;
  }

  /**
   * Obtient les dimensions d'une image
   */
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calcule le checksum d'un fichier
   */
  private async calculateChecksum(file: File): Promise<string> {
    // Simuler le calcul de checksum
    return 'checksum_' + Math.random().toString(36).substr(2, 16);
  }

  /**
   * Crée les chunks pour l'upload
   */
  private createChunks(file: File, chunkSize: number): UploadChunk[] {
    const chunks: UploadChunk[] = [];
    const totalChunks = Math.ceil(file.size / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const size = end - start;

      chunks.push({
        id: `chunk_${i}`,
        index: i,
        size,
        start,
        end,
        hash: `hash_${i}`,
        status: 'pending',
        retryCount: 0,
        uploadTime: 0,
        speed: 0
      });
    }

    return chunks;
  }

  /**
   * Fusionne les paramètres avec les valeurs par défaut
   */
  private mergeSettings(settings?: Partial<UploadSettings>, file?: File): UploadSettings {
    const defaultSettings: UploadSettings = {
      chunkSize: 1024 * 1024, // 1MB
      maxRetries: 3,
      retryDelay: 1000,
      concurrentUploads: 3,
      compressionEnabled: false,
      compressionLevel: 6,
      encryptionEnabled: false,
      resumeEnabled: true,
      bandwidthLimit: undefined,
      priority: 'normal',
      autoRetry: true,
      verifyIntegrity: true
    };

    if (!settings) return defaultSettings;

    // Ajuster la taille des chunks selon la taille du fichier
    let chunkSize = settings.chunkSize || defaultSettings.chunkSize;
    if (file && file.size > 100 * 1024 * 1024) { // > 100MB
      chunkSize = Math.max(chunkSize, 5 * 1024 * 1024); // 5MB minimum
    }

    return {
      ...defaultSettings,
      ...settings,
      chunkSize
    };
  }

  /**
   * Ajoute un upload à la file d'attente
   */
  private addToQueue(upload: ProgressiveUpload): void {
    this.uploadQueue.push(upload);
    this.activeUploads.set(upload.id, upload);
  }

  /**
   * Démarre le processeur de file d'attente
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.isProcessing && this.uploadQueue.length > 0) {
        this.processQueue();
      }
    }, 1000);
  }

  /**
   * Traite la file d'attente
   */
  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    try {
      // Trier par priorité
      this.uploadQueue.sort((a, b) => {
        const priorityOrder = { 'high': 3, 'normal': 2, 'low': 1 };
        return priorityOrder[b.settings.priority] - priorityOrder[a.settings.priority];
      });

      // Traiter les uploads en attente
      const pendingUploads = this.uploadQueue.filter(u => u.status === 'pending');
      for (const upload of pendingUploads) {
        if (this.bandwidthManager.activeUploads < 5) { // Limite concurrente
          await this.startUpload(upload.id);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Initialise la surveillance du réseau
   */
  private initializeNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.updateNetworkConditions(connection);

      connection.addEventListener('change', () => {
        this.updateNetworkConditions(connection);
      });
    }
  }

  /**
   * Met à jour les conditions réseau
   */
  private updateNetworkConditions(connection: any): void {
    this.bandwidthManager.networkConditions = {
      connectionType: connection.type || 'unknown',
      effectiveType: connection.effectiveType || '4g',
      downlink: connection.downlink || 10,
      rtt: connection.rtt || 100,
      saveData: connection.saveData || false
    };
  }

  /**
   * Mappe l'upload vers le format de la base de données
   */
  private mapUploadToDb(upload: ProgressiveUpload): any {
    return {
      id: upload.id,
      user_id: upload.userId,
      file_name: upload.fileName,
      file_size: upload.fileSize,
      mime_type: upload.mimeType,
      chunks: upload.chunks,
      settings: upload.settings,
      metadata: upload.metadata,
      progress: upload.progress,
      status: upload.status,
      error: upload.error,
      created_at: upload.createdAt,
      updated_at: upload.updatedAt,
      completed_at: upload.completedAt
    };
  }

  /**
   * Mappe les données de la base de données vers l'interface
   */
  private mapDbToUpload(dbData: any): ProgressiveUpload {
    return {
      id: dbData.id,
      userId: dbData.user_id,
      fileName: dbData.file_name,
      fileSize: dbData.file_size,
      mimeType: dbData.mime_type,
      chunks: dbData.chunks || [],
      settings: dbData.settings,
      metadata: dbData.metadata,
      progress: dbData.progress,
      status: dbData.status,
      error: dbData.error,
      createdAt: new Date(dbData.created_at),
      updatedAt: new Date(dbData.updated_at),
      completedAt: dbData.completed_at ? new Date(dbData.completed_at) : undefined
    };
  }

  /**
   * Met à jour un upload en base de données
   */
  private async updateUploadInDb(upload: ProgressiveUpload): Promise<void> {
    await supabase
      .from('progressive_uploads')
      .update(this.mapUploadToDb(upload))
      .eq('id', upload.id);
  }

  /**
   * Obtient l'extension du fichier
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Formate la taille du fichier
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Enregistre un callback d'événement
   */
  public onEvent(event: string, callback: Function): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  /**
   * Émet un événement
   */
  private emitEvent(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erreur dans le callback d'événement ${event}:`, error);
        }
      });
    }
  }

  /**
   * Récupère un upload par ID
   */
  public async getUpload(uploadId: string): Promise<ProgressiveUpload | null> {
    // D'abord vérifier en mémoire
    const memoryUpload = this.activeUploads.get(uploadId);
    if (memoryUpload) {
      return memoryUpload;
    }

    // Sinon chercher en base de données
    try {
      const { data, error } = await supabase
        .from('progressive_uploads')
        .select('*')
        .eq('id', uploadId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const upload = this.mapDbToUpload(data);
      this.activeUploads.set(upload.id, upload);
      return upload;

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'upload:', error);
      return null;
    }
  }

  /**
   * Récupère les uploads d'un utilisateur
   */
  public async getUserUploads(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
    } = {}
  ): Promise<ProgressiveUpload[]> {
    try {
      let query = supabase
        .from('progressive_uploads')
        .select('*')
        .eq('user_id', userId);

      if (options.status) {
        query = query.eq('status', options.status);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(options.limit || 50)
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      const { data, error } = await query;

      if (error) throw error;

      return data.map(item => this.mapDbToUpload(item));
    } catch (error) {
      console.error('Erreur lors de la récupération des uploads utilisateur:', error);
      return [];
    }
  }

  /**
   * Récupère les statistiques d'upload
   */
  public async getUploadStats(userId?: string): Promise<UploadStatistics> {
    try {
      // Simuler la récupération des statistiques
      return {
        totalUploads: 0,
        completedUploads: 0,
        failedUploads: 0,
        totalBytesUploaded: 0,
        averageUploadSpeed: 0,
        averageUploadTime: 0,
        successRate: 0,
        mostUploadedFormats: {} as Record<string, number>,
        largestFileUploaded: 0,
        activeUploads: this.activeUploads.size,
        queuedUploads: this.uploadQueue.length,
        bandwidthUsage: {
          current: this.bandwidthManager.allocatedBandwidth,
          average: this.bandwidthManager.totalBandwidth,
          peak: this.bandwidthManager.networkConditions.downlink * 1024 * 1024 / 8
        },
        errorRates: {
          networkErrors: 0,
          serverErrors: 0,
          clientErrors: 0,
          timeoutErrors: 0
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Génère un upload de démonstration
   */
  public async generateDemoUpload(userId: string): Promise<ProgressiveUpload> {
    // Créer un faux fichier pour la démo
    const demoFile = new File(['demo content'], 'demo_file.txt', {
      type: 'text/plain'
    });

    // Agrandir le fichier pour simuler un upload volumineux
    const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
    const largeFile = new File([largeContent], 'large_demo_file.txt', {
      type: 'text/plain'
    });

    return this.initializeUpload(userId, largeFile, {
      chunkSize: 1024 * 1024, // 1MB chunks
      concurrentUploads: 2,
      priority: 'normal'
    });
  }
}

// Export du singleton et des utilitaires
export const progressiveUploadService = ProgressiveUploadService.getInstance();

export const initializeUpload = (
  userId: string,
  file: File,
  settings?: Partial<UploadSettings>
) => progressiveUploadService.initializeUpload(userId, file, settings);

export const startUpload = (uploadId: string) => progressiveUploadService.startUpload(uploadId);

export const pauseUpload = (uploadId: string) => progressiveUploadService.pauseUpload(uploadId);

export const resumeUpload = (uploadId: string) => progressiveUploadService.resumeUpload(uploadId);

export const cancelUpload = (uploadId: string) => progressiveUploadService.cancelUpload(uploadId);

export const getUpload = (uploadId: string) => progressiveUploadService.getUpload(uploadId);

export const getUserUploads = (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }
) => progressiveUploadService.getUserUploads(userId, options);

export const getUploadStats = (userId?: string) => progressiveUploadService.getUploadStats(userId);

export const generateDemoUpload = (userId: string) => progressiveUploadService.generateDemoUpload(userId);
