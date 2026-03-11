/**
 * Service de transcription vidéo (Whisper API)
 * 
 * Ce service gère la transcription audio/vidéo via l'API Whisper d'OpenAI,
 * le traitement des fichiers, la synchronisation temporelle et la gestion des transcriptions
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface VideoTranscription {
  id: string;
  userId: string;
  videoId: string;
  originalFileName: string;
  fileUrl: string;
  fileSize: number;
  duration: number;
  format: string;
  language: string;
  detectedLanguage?: string;
  transcriptionText: string;
  segments: TranscriptionSegment[];
  metadata: TranscriptionMetadata;
  status: TranscriptionStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

export interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  confidence: number;
  speaker?: string;
  language?: string;
  words: WordInfo[];
  timestamp: string;
  metadata: SegmentMetadata;
}

export interface WordInfo {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuation?: string;
  speaker?: string;
}

export interface SegmentMetadata {
  speakerId?: string;
  speakerName?: string;
  emotion?: string;
  volume?: number;
  speed?: number;
  pitch?: number;
  silence?: boolean;
  music?: boolean;
  noise?: boolean;
  customTags?: string[];
}

export interface TranscriptionMetadata {
  originalFormat: string;
  audioFormat: string;
  sampleRate: number;
  channels: number;
  bitrate: number;
  codec: string;
  duration: number;
  fileSize: number;
  detectedLanguage: string;
  confidence: number;
  wordCount: number;
  speakerCount: number;
  segmentsCount: number;
  processingTime: number;
  model: string;
  temperature: number;
  prompt?: string;
  languageDetection: LanguageDetection;
  audioAnalysis: AudioAnalysis;
  quality: AudioQuality;
}

export interface LanguageDetection {
  primary: string;
  confidence: number;
  alternatives: Array<{
    language: string;
    confidence: number;
  }>;
  mixed: boolean;
  codeSwitching: boolean;
}

export interface AudioAnalysis {
  averageVolume: number;
  peakVolume: number;
  noiseLevel: number;
  silenceRatio: number;
  speechRatio: number;
  musicRatio: number;
  quality: 'low' | 'medium' | 'high';
  issues: string[];
  recommendations: string[];
}

export interface AudioQuality {
  clarity: number;
  noise: number;
  volume: number;
  speed: number;
  overall: number;
  issues: string[];
  improvements: string[];
}

export type TranscriptionStatus = 
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'transcribing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

export interface TranscriptionSettings {
  language: string;
  detectLanguage: boolean;
  model: 'whisper-1' | 'whisper-tiny' | 'whisper-base' | 'whisper-small' | 'whisper-medium' | 'whisper-large';
  temperature: number;
  responseFormat: 'json' | 'text' | 'srt' | 'vtt' | 'verbose_json';
  timestampGranularities: ('word' | 'segment')[];
  prompt?: string;
  maxDuration: number; // en secondes
  maxFileSize: number; // en MB
  enableDiarization: boolean;
  enableEmotionDetection: boolean;
  enableNoiseReduction: boolean;
  enableVolumeNormalization: boolean;
  outputFormat: 'text' | 'json' | 'srt' | 'vtt';
  includeTimestamps: boolean;
  includeConfidence: boolean;
  includeSpeakerLabels: boolean;
  customVocabulary?: string[];
}

export interface TranscriptionSession {
  id: string;
  userId: string;
  videoId: string;
  settings: TranscriptionSettings;
  status: TranscriptionStatus;
  progress: TranscriptionProgress;
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: string;
  result?: VideoTranscription;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptionProgress {
  stage: ProgressStage;
  percentage: number;
  message: string;
  details: Record<string, any>;
  estimatedTimeRemaining?: number;
  currentFile?: string;
  processedFiles?: number;
  totalFiles?: number;
  processedDuration?: number;
  totalDuration?: number;
}

export type ProgressStage = 
  | 'uploading'
  | 'extracting_audio'
  | 'analyzing_audio'
  | 'transcribing'
  | 'processing_segments'
  | 'detecting_speakers'
  | 'analyzing_emotions'
  | 'generating_output'
  | 'finalizing';

export interface VideoTranscriptionStats {
  totalTranscriptions: number;
  completedTranscriptions: number;
  failedTranscriptions: number;
  averageProcessingTime: number;
  totalAudioDuration: number;
  averageAccuracy: number;
  supportedLanguages: string[];
  mostUsedLanguages: Record<string, number>;
  transcriptionModels: Record<string, number>;
  audioFormats: Record<string, number>;
  fileSizes: SizeStats;
  durations: DurationStats;
  qualityScores: QualityStats;
  userActivity: TranscriptionUserActivity;
  trends: {
    transcriptionTrend: number[];
    accuracyTrend: number[];
    durationTrend: number[];
    errorTrend: number[];
  };
}

export interface SizeStats {
  averageSize: number;
  medianSize: number;
  minSize: number;
  maxSize: number;
  totalSize: number;
  sizeDistribution: Record<string, number>;
}

export interface DurationStats {
  averageDuration: number;
  medianDuration: number;
  minDuration: number;
  maxDuration: number;
  totalDuration: number;
  durationDistribution: Record<string, number>;
}

export interface QualityStats {
  averageAccuracy: number;
  medianAccuracy: number;
  minAccuracy: number;
  maxAccuracy: number;
  accuracyDistribution: Record<string, number>;
  languageAccuracy: Record<string, number>;
  modelAccuracy: Record<string, number>;
}

export interface TranscriptionUserActivity {
  lastTranscriptionAt: string;
  totalTranscriptions: number;
  successfulTranscriptions: number;
  failedTranscriptions: number;
  averageAccuracy: number;
  preferredLanguage: string;
  preferredModel: string;
  averageProcessingTime: number;
  totalAudioDuration: number;
  mostActiveDay: string;
  mostActiveHour: number;
  transcriptionPatterns: Record<string, number>;
}

export interface TranscriptionTemplate {
  id: string;
  name: string;
  description: string;
  settings: TranscriptionSettings;
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptionExport {
  id: string;
  transcriptionId: string;
  format: 'text' | 'json' | 'srt' | 'vtt' | 'csv' | 'pdf' | 'docx';
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ExportOptions {
  includeTimestamps: boolean;
  includeConfidence: boolean;
  includeSpeakerLabels: boolean;
  includeMetadata: boolean;
  includeAudioAnalysis: boolean;
  customFormat?: string;
  styling?: ExportStyling;
  filters?: ExportFilters;
}

export interface ExportStyling {
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  padding: number;
  lineHeight: number;
  headerStyle: string;
  segmentStyle: string;
  timestampStyle: string;
  speakerStyle: string;
}

export interface ExportFilters {
  minConfidence: number;
  speakers: string[];
  languages: string[];
  timeRange?: {
    start: number;
    end: number;
  };
  excludeSilence: boolean;
  excludeMusic: boolean;
  excludeNoise: boolean;
}

class VideoTranscriptionService {
  private transcriptions: Map<string, VideoTranscription> = new Map();
  private sessions: Map<string, TranscriptionSession> = new Map();
  private templates: Map<string, TranscriptionTemplate> = new Map();
  private eventCallbacks: Map<string, (event: any) => void> = new Map();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialise le service de transcription vidéo
   */
  private async initializeService(): Promise<void> {
    try {
      // Charger les templates par défaut
      await this.loadDefaultTemplates();
      
      // Démarrer le monitoring
      this.startMonitoring();
      
      console.log('🎥 Service de transcription vidéo initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation service transcription vidéo:', error);
    }
  }

  /**
   * Démarre une nouvelle transcription
   */
  async startTranscription(
    userId: string,
    videoFile: File,
    settings: Partial<TranscriptionSettings> = {}
  ): Promise<TranscriptionSession> {
    try {
      // Valider le fichier
      this.validateVideoFile(videoFile, settings);

      // Créer la session
      const session: TranscriptionSession = {
        id: this.generateId(),
        userId,
        videoId: this.generateId(),
        settings: this.mergeDefaultSettings(settings),
        status: 'uploading',
        progress: {
          stage: 'uploading',
          percentage: 0,
          message: 'Upload du fichier vidéo...',
          details: { fileName: videoFile.name, fileSize: videoFile.size }
        },
        startTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.sessions.set(session.id, session);
      await this.saveSession(session);

      // Démarrer le traitement
      this.processTranscription(session.id, videoFile);

      console.log('🎥 Transcription démarrée:', session.id);
      return session;

    } catch (error) {
      console.error('❌ Erreur démarrage transcription:', error);
      throw error;
    }
  }

  /**
   * Traite une transcription
   */
  private async processTranscription(sessionId: string, videoFile: File): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      // Étape 1: Upload
      await this.updateProgress(sessionId, 'uploading', 10, 'Upload du fichier vidéo...');
      const videoUrl = await this.uploadVideoFile(videoFile);

      // Étape 2: Extraction audio
      await this.updateProgress(sessionId, 'extracting_audio', 20, 'Extraction de la piste audio...');
      const audioData = await this.extractAudio(videoUrl);

      // Étape 3: Analyse audio
      await this.updateProgress(sessionId, 'analyzing_audio', 30, 'Analyse de la qualité audio...');
      const audioAnalysis = await this.analyzeAudio();

      // Étape 4: Transcription
      await this.updateProgress(sessionId, 'transcribing', 50, 'Transcription avec Whisper API...');
      const transcriptionResult = await this.transcribeWithWhisper(audioData);

      // Étape 5: Traitement des segments
      await this.updateProgress(sessionId, 'processing_segments', 70, 'Traitement des segments...');
      const segments = await this.processSegments(transcriptionResult);

      // Étape 6: Détection des speakers
      if (session.settings.enableDiarization) {
        await this.updateProgress(sessionId, 'detecting_speakers', 80, 'Détection des speakers...');
        await this.detectSpeakers(segments);
      }

      // Étape 7: Détection des émotions
      if (session.settings.enableEmotionDetection) {
        await this.updateProgress(sessionId, 'analyzing_emotions', 85, 'Analyse des émotions...');
        await this.analyzeEmotions(segments);
      }

      // Étape 8: Génération du résultat
      await this.updateProgress(sessionId, 'generating_output', 90, 'Génération du résultat...');
      const transcription = await this.generateTranscription(
        session.userId,
        session.videoId,
        videoFile,
        videoUrl,
        transcriptionResult,
        segments,
        audioAnalysis,
        session.settings
      );

      // Étape 9: Finalisation
      await this.updateProgress(sessionId, 'finalizing', 95, 'Finalisation...');
      
      // Mettre à jour la session
      session.status = 'completed';
      session.endTime = new Date().toISOString();
      session.duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
      session.result = transcription;
      session.updatedAt = new Date().toISOString();
      
      this.sessions.set(sessionId, session);
      await this.saveSession(session);

      // Stocker la transcription
      this.transcriptions.set(transcription.id, transcription);
      await this.saveTranscription(transcription);

      await this.updateProgress(sessionId, 'finalizing', 100, 'Transcription terminée !');

      console.log('🎥 Transcription terminée:', transcription.id);

    } catch (error) {
      console.error('❌ Erreur traitement transcription:', error);
      
      session.status = 'failed';
      session.error = error instanceof Error ? error.message : 'Erreur inconnue';
      session.endTime = new Date().toISOString();
      session.duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
      session.updatedAt = new Date().toISOString();
      
      this.sessions.set(sessionId, session);
      await this.saveSession(session);
    }
  }

  /**
   * Met à jour la progression
   */
  private async updateProgress(
    sessionId: string,
    stage: ProgressStage,
    percentage: number,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.progress = {
      stage,
      percentage,
      message,
      details: details || {},
      estimatedTimeRemaining: this.calculateEstimatedTime(sessionId, percentage)
    };

    session.updatedAt = new Date().toISOString();
    this.sessions.set(sessionId, session);
    await this.saveSession(session);

    // Émettre l'événement de progression
    this.emit('progress_updated', {
      sessionId,
      progress: session.progress
    });
  }

  /**
   * Calcule le temps restant estimé
   */
  private calculateEstimatedTime(sessionId: string, currentPercentage: number): number {
    const session = this.sessions.get(sessionId);
    if (!session || currentPercentage === 0) return 0;

    const elapsed = new Date().getTime() - new Date(session.startTime).getTime();
    const estimatedTotal = (elapsed / currentPercentage) * 100;
    const remaining = estimatedTotal - elapsed;

    return Math.max(0, remaining);
  }

  /**
   * Valide le fichier vidéo
   */
  private validateVideoFile(file: File, settings: Partial<TranscriptionSettings>): void {
    const maxSize = settings.maxFileSize || 500; // 500MB par défaut
    const supportedFormats = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];

    if (file.size > maxSize * 1024 * 1024) {
      throw new Error(`Fichier trop volumineux. Maximum: ${maxSize}MB`);
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !supportedFormats.includes(fileExtension)) {
      throw new Error(`Format non supporté. Formats supportés: ${supportedFormats.join(', ')}`);
    }
  }

  /**
   * Upload le fichier vidéo
   */
  private async uploadVideoFile(file: File): Promise<string> {
    try {
      // Simuler l'upload vers Supabase Storage
      const fileName = `transcriptions/${Date.now()}_${file.name}`;
      
      const { error } = await supabase.storage
        .from('transcription-videos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('transcription-videos')
        .getPublicUrl(fileName);

      return publicUrl;

    } catch (error) {
      console.error('❌ Erreur upload vidéo:', error);
      throw error;
    }
  }

  /**
   * Extrait la piste audio
   */
  private async extractAudio(videoUrl: string): Promise<any> {
    try {
      // Simuler l'extraction audio avec FFmpeg
      // Dans un vrai projet, utiliser un service de traitement audio/vidéo
      console.log('🎥 Extraction audio de:', videoUrl);
      
      return {
        audioUrl: videoUrl.replace('.mp4', '.mp3'),
        format: 'mp3',
        sampleRate: 16000,
        channels: 1,
        bitrate: 128000,
        duration: 300, // 5 minutes de simulation
        size: 5000000 // 5MB
      };

    } catch (error) {
      console.error('❌ Erreur extraction audio:', error);
      throw error;
    }
  }

  /**
   * Analyse la qualité audio
   */
  private async analyzeAudio(): Promise<AudioAnalysis> {
    try {
      // Simuler l'analyse audio
      return {
        averageVolume: 0.7,
        peakVolume: 0.9,
        noiseLevel: 0.1,
        silenceRatio: 0.15,
        speechRatio: 0.75,
        musicRatio: 0.1,
        quality: 'high',
        issues: [],
        recommendations: []
      };

    } catch (error) {
      console.error('❌ Erreur analyse audio:', error);
      throw error;
    }
  }

  /**
   * Transcrit avec l'API Whisper
   */
  private async transcribeWithWhisper(audioData: any): Promise<any> {
    try {
      // Simuler l'appel à l'API Whisper d'OpenAI
      // Dans un vrai projet, utiliser l'API OpenAI officielle
      console.log('🎥 Transcription avec Whisper API...');
      
      const mockResponse = {
        text: "Ceci est une transcription de test générée par l'API Whisper. Le contenu est simulé pour démontrer les fonctionnalités du service de transcription vidéo.",
        language: 'fr',
        detectedLanguage: 'fr',
        confidence: 0.95,
        duration: audioData.duration,
        segments: [
          {
            id: 'seg_1',
            start: 0,
            end: 5,
            text: "Ceci est une transcription de test",
            confidence: 0.96,
            words: [
              { word: "Ceci", start: 0, end: 0.5, confidence: 0.98 },
              { word: "est", start: 0.5, end: 0.8, confidence: 0.97 },
              { word: "une", start: 0.8, end: 1.0, confidence: 0.99 },
              { word: "transcription", start: 1.0, end: 1.8, confidence: 0.95 },
              { word: "de", start: 1.8, end: 2.0, confidence: 0.96 },
              { word: "test", start: 2.0, end: 2.5, confidence: 0.94 }
            ]
          },
          {
            id: 'seg_2',
            start: 5,
            end: 10,
            text: "générée par l'API Whisper",
            confidence: 0.94,
            words: [
              { word: "générée", start: 5.0, end: 5.8, confidence: 0.93 },
              { word: "par", start: 5.8, end: 6.2, confidence: 0.95 },
              { word: "l'", start: 6.2, end: 6.5, confidence: 0.96 },
              { word: "API", start: 6.5, end: 7.0, confidence: 0.97 },
              { word: "Whisper", start: 7.0, end: 7.8, confidence: 0.94 }
            ]
          }
        ]
      };

      return mockResponse;

    } catch (error) {
      console.error('❌ Erreur transcription Whisper:', error);
      throw error;
    }
  }

  /**
   * Traite les segments
   */
  private async processSegments(
    transcriptionResult: any
  ): Promise<TranscriptionSegment[]> {
    try {
      const segments: TranscriptionSegment[] = [];

      for (const segmentData of transcriptionResult.segments) {
        const segment: TranscriptionSegment = {
          id: segmentData.id,
          start: segmentData.start,
          end: segmentData.end,
          text: segmentData.text,
          confidence: segmentData.confidence,
          words: segmentData.words,
          timestamp: new Date(segmentData.start * 1000).toISOString(),
          metadata: {
            silence: false,
            music: false,
            noise: false,
            customTags: []
          }
        };
        segments.push(segment);
      }

      return segments;

    } catch (error) {
      console.error('❌ Erreur traitement segments:', error);
      throw error;
    }
  }

  /**
   * Détecte les speakers
   */
  private async detectSpeakers(segments: TranscriptionSegment[]): Promise<void> {
    try {
      // Simuler la détection de speakers (diarization)
      let currentSpeaker = 1;
      
      for (const segment of segments) {
        if (segment.start > 0 && segment.start % 30 < 5) {
          currentSpeaker = currentSpeaker === 1 ? 2 : 1;
        }
        
        segment.speaker = `Speaker ${currentSpeaker}`;
        segment.metadata.speakerId = `speaker_${currentSpeaker}`;
        segment.metadata.speakerName = `Speaker ${currentSpeaker}`;
      }

    } catch (error) {
      console.error('❌ Erreur détection speakers:', error);
      throw error;
    }
  }

  /**
   * Analyse les émotions
   */
  private async analyzeEmotions(segments: TranscriptionSegment[]): Promise<void> {
    try {
      // Simuler l'analyse d'émotions
      const emotions = ['neutral', 'happy', 'sad', 'angry', 'excited', 'calm'];
      
      for (const segment of segments) {
        segment.metadata.emotion = emotions[Math.floor(Math.random() * emotions.length)];
      }

    } catch (error) {
      console.error('❌ Erreur analyse émotions:', error);
      throw error;
    }
  }

  /**
   * Génère la transcription finale
   */
  private async generateTranscription(
    userId: string,
    videoId: string,
    videoFile: File,
    videoUrl: string,
    transcriptionResult: any,
    segments: TranscriptionSegment[],
    audioAnalysis: AudioAnalysis,
    settings: TranscriptionSettings
  ): Promise<VideoTranscription> {
    try {
      const transcription: VideoTranscription = {
        id: this.generateId(),
        userId,
        videoId,
        originalFileName: videoFile.name,
        fileUrl: videoUrl,
        fileSize: videoFile.size,
        duration: transcriptionResult.duration,
        format: videoFile.name.split('.').pop() || 'mp4',
        language: settings.language || 'fr',
        detectedLanguage: transcriptionResult.detectedLanguage,
        transcriptionText: transcriptionResult.text,
        segments,
        metadata: {
          originalFormat: videoFile.name.split('.').pop() || 'mp4',
          audioFormat: 'mp3',
          sampleRate: 16000,
          channels: 1,
          bitrate: 128000,
          codec: 'mp3',
          duration: transcriptionResult.duration,
          fileSize: videoFile.size,
          detectedLanguage: transcriptionResult.detectedLanguage,
          confidence: transcriptionResult.confidence,
          wordCount: transcriptionResult.text.split(/\s+/).length,
          speakerCount: new Set(segments.map(s => s.speaker)).size,
          segmentsCount: segments.length,
          processingTime: 0, // À calculer
          model: settings.model,
          temperature: settings.temperature,
          prompt: settings.prompt,
          languageDetection: {
            primary: transcriptionResult.detectedLanguage,
            confidence: 0.95,
            alternatives: [],
            mixed: false,
            codeSwitching: false
          },
          audioAnalysis,
          quality: {
            clarity: 0.9,
            noise: 0.1,
            volume: 0.8,
            speed: 0.95,
            overall: 0.88,
            issues: [],
            improvements: []
          }
        },
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      };

      return transcription;

    } catch (error) {
      console.error('❌ Erreur génération transcription:', error);
      throw error;
    }
  }

  /**
   * Obtient une transcription
   */
  async getTranscription(transcriptionId: string): Promise<VideoTranscription | null> {
    try {
      const { data, error } = await supabase
        .from('video_transcriptions')
        .select('*')
        .eq('id', transcriptionId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return data as VideoTranscription;

    } catch (error) {
      console.error('❌ Erreur récupération transcription:', error);
      throw error;
    }
  }

  /**
   * Obtient les transcriptions d'un utilisateur
   */
  async getUserTranscriptions(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: TranscriptionStatus;
      language?: string;
    } = {}
  ): Promise<VideoTranscription[]> {
    try {
      let query = supabase
        .from('video_transcriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.language) {
        query = query.eq('language', options.language);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, (options.offset || 0) + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as VideoTranscription[];

    } catch (error) {
      console.error('❌ Erreur récupération transcriptions utilisateur:', error);
      throw error;
    }
  }

  /**
   * Exporte une transcription
   */
  async exportTranscription(
    transcriptionId: string,
    format: 'text' | 'json' | 'srt' | 'vtt' | 'csv' | 'pdf' | 'docx',
    options: ExportOptions = {
      includeTimestamps: true,
      includeConfidence: true,
      includeSpeakerLabels: true,
      includeMetadata: false,
      includeAudioAnalysis: false
    }
  ): Promise<TranscriptionExport> {
    try {
      const transcription = await this.getTranscription(transcriptionId);
      if (!transcription) {
        throw new Error('Transcription non trouvée');
      }

      const exportData: TranscriptionExport = {
        id: this.generateId(),
        transcriptionId,
        format,
        options,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Traiter l'export
      const exportedContent = await this.processExport(transcription, format, options);
      
      // Sauvegarder le fichier exporté
      const fileUrl = await this.saveExportFile(exportData.id, exportedContent, format);
      
      exportData.status = 'completed';
      exportData.fileUrl = fileUrl;
      exportData.fileSize = exportedContent.length;
      exportData.completedAt = new Date().toISOString();

      console.log('🎥 Export terminé:', exportData.id);
      return exportData;

    } catch (error) {
      console.error('❌ Erreur export transcription:', error);
      throw error;
    }
  }

  /**
   * Traite l'export
   */
  private async processExport(
    transcription: VideoTranscription,
    format: string,
    options: ExportOptions
  ): Promise<string> {
    switch (format) {
      case 'text':
        return this.exportToText(transcription, options);
      case 'json':
        return this.exportToJSON(transcription, options);
      case 'srt':
        return this.exportToSRT(transcription, options);
      case 'vtt':
        return this.exportToVTT(transcription, options);
      case 'csv':
        return this.exportToCSV(transcription, options);
      case 'pdf':
        return this.exportToPDF(transcription, options);
      case 'docx':
        return this.exportToDOCX(transcription, options);
      default:
        throw new Error(`Format d'export non supporté: ${format}`);
    }
  }

  /**
   * Export en texte
   */
  private exportToText(transcription: VideoTranscription, options: ExportOptions): string {
    let content = `Transcription: ${transcription.originalFileName}\n`;
    content += `Langue: ${transcription.detectedLanguage || transcription.language}\n`;
    content += `Durée: ${this.formatDuration(transcription.duration)}\n`;
    content += `Confiance: ${(transcription.metadata.confidence * 100).toFixed(1)}%\n\n`;

    for (const segment of transcription.segments) {
      if (options.includeTimestamps) {
        content += `[${this.formatTimestamp(segment.start)} - ${this.formatTimestamp(segment.end)}] `;
      }
      
      if (options.includeSpeakerLabels && segment.speaker) {
        content += `${segment.speaker}: `;
      }
      
      content += segment.text;
      
      if (options.includeConfidence) {
        content += ` (${(segment.confidence * 100).toFixed(1)}%)`;
      }
      
      content += '\n\n';
    }

    return content;
  }

  /**
   * Export en JSON
   */
  private exportToJSON(transcription: VideoTranscription, options: ExportOptions): string {
    const exportData = {
      metadata: options.includeMetadata ? transcription.metadata : undefined,
      segments: transcription.segments,
      fullText: transcription.transcriptionText
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export en SRT
   */
  private exportToSRT(transcription: VideoTranscription, options: ExportOptions): string {
    let srtContent = '';
    
    for (let i = 0; i < transcription.segments.length; i++) {
      const segment = transcription.segments[i];
      
      srtContent += `${i + 1}\n`;
      srtContent += `${this.formatSRTTime(segment.start)} --> ${this.formatSRTTime(segment.end)}\n`;
      
      if (options.includeSpeakerLabels && segment.speaker) {
        srtContent += `${segment.speaker}: `;
      }
      
      srtContent += segment.text;
      srtContent += '\n\n';
    }

    return srtContent;
  }

  /**
   * Export en VTT
   */
  private exportToVTT(transcription: VideoTranscription, options: ExportOptions): string {
    let vttContent = 'WEBVTT\n\n';
    
    for (const segment of transcription.segments) {
      vttContent += `${this.formatVTTTime(segment.start)} --> ${this.formatVTTTime(segment.end)}\n`;
      
      if (options.includeSpeakerLabels && segment.speaker) {
        vttContent += `<v ${segment.speaker}>`;
      }
      
      vttContent += segment.text;
      
      if (options.includeSpeakerLabels && segment.speaker) {
        vttContent += '</v>';
      }
      
      vttContent += '\n\n';
    }

    return vttContent;
  }

  /**
   * Export en CSV
   */
  private exportToCSV(transcription: VideoTranscription, options: ExportOptions): string {
    let csvContent = 'Start,End,Duration,Text,Confidence';
    
    if (options.includeSpeakerLabels) {
      csvContent += ',Speaker';
    }
    
    csvContent += '\n';

    for (const segment of transcription.segments) {
      const duration = segment.end - segment.start;
      csvContent += `${this.formatTimestamp(segment.start)},${this.formatTimestamp(segment.end)},${duration},"${segment.text.replace(/"/g, '""')}",${segment.confidence}`;
      
      if (options.includeSpeakerLabels && segment.speaker) {
        csvContent += `,"${segment.speaker}"`;
      }
      
      csvContent += '\n';
    }

    return csvContent;
  }

  /**
   * Export en PDF
   */
  private exportToPDF(transcription: VideoTranscription, options: ExportOptions): string {
    // Simuler la génération PDF
    // Dans un vrai projet, utiliser une librairie comme jsPDF ou Puppeteer
    const content = this.exportToText(transcription, options);
    return `PDF content: ${content}`;
  }

  /**
   * Export en DOCX
   */
  private exportToDOCX(transcription: VideoTranscription, options: ExportOptions): string {
    // Simuler la génération DOCX
    // Dans un vrai projet, utiliser une librairie comme docx
    const content = this.exportToText(transcription, options);
    return `DOCX content: ${content}`;
  }

  /**
   * Sauvegarde le fichier exporté
   */
  private async saveExportFile(
    exportId: string,
    content: string,
    format: string
  ): Promise<string> {
    try {
      const fileName = `exports/${exportId}.${format}`;
      
      const { error } = await supabase.storage
        .from('transcription-exports')
        .upload(fileName, new Blob([content]));

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('transcription-exports')
        .getPublicUrl(fileName);

      return publicUrl;

    } catch (error) {
      console.error('❌ Erreur sauvegarde fichier export:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques de transcription
   */
  async getStats(): Promise<VideoTranscriptionStats> {
    try {
      const { data, error } = await supabase.rpc('get_video_transcription_stats');

      if (error) throw error;

      const stats = data || {
        total_transcriptions: 0,
        completed_transcriptions: 0,
        failed_transcriptions: 0,
        average_processing_time: 0,
        total_audio_duration: 0,
        average_accuracy: 0,
        supported_languages: [],
        most_used_languages: {},
        transcription_models: {},
        audio_formats: {},
        file_sizes: { average_size: 0, median_size: 0, min_size: 0, max_size: 0, total_size: 0, size_distribution: {} },
        durations: { average_duration: 0, median_duration: 0, min_duration: 0, max_duration: 0, total_duration: 0, duration_distribution: {} },
        quality_scores: { average_accuracy: 0, median_accuracy: 0, min_accuracy: 0, max_accuracy: 0, accuracy_distribution: {}, language_accuracy: {}, model_accuracy: {} },
        user_activity: { last_transcription_at: null, total_transcriptions: 0, successful_transcriptions: 0, failed_transcriptions: 0, average_accuracy: 0, preferred_language: '', preferred_model: '', average_processing_time: 0, total_audio_duration: 0, most_active_day: '', most_active_hour: 0, transcription_patterns: {} },
        trends: { transcription_trend: Array(7).fill(0), accuracy_trend: Array(7).fill(0), duration_trend: Array(7).fill(0), error_trend: Array(7).fill(0) }
      };

      return {
        totalTranscriptions: stats.total_transcriptions,
        completedTranscriptions: stats.completed_transcriptions,
        failedTranscriptions: stats.failed_transcriptions,
        averageProcessingTime: stats.average_processing_time,
        totalAudioDuration: stats.total_audio_duration,
        averageAccuracy: stats.average_accuracy,
        supportedLanguages: stats.supported_languages,
        mostUsedLanguages: stats.most_used_languages,
        transcriptionModels: stats.transcription_models,
        audioFormats: stats.audio_formats,
        fileSizes: stats.file_sizes,
        durations: stats.durations,
        qualityScores: stats.quality_scores,
        userActivity: stats.user_activity,
        trends: {
          transcriptionTrend: stats.trends.transcription_trend,
          accuracyTrend: stats.trends.accuracy_trend,
          durationTrend: stats.trends.duration_trend,
          errorTrend: stats.trends.error_trend
        }
      };

    } catch (error) {
      console.error('❌ Erreur statistiques transcription:', error);
      throw error;
    }
  }

  // Méthodes utilitaires

  private mergeDefaultSettings(settings: Partial<TranscriptionSettings>): TranscriptionSettings {
    return {
      language: 'fr',
      detectLanguage: true,
      model: 'whisper-1',
      temperature: 0.0,
      responseFormat: 'verbose_json',
      timestampGranularities: ['word', 'segment'],
      maxDuration: 3600,
      maxFileSize: 500,
      enableDiarization: true,
      enableEmotionDetection: false,
      enableNoiseReduction: true,
      enableVolumeNormalization: true,
      outputFormat: 'json',
      includeTimestamps: true,
      includeConfidence: true,
      includeSpeakerLabels: true,
      ...settings
    };
  }

  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  private formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  private generateId(): string {
    return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Charge les templates par défaut
   */
  private async loadDefaultTemplates(): Promise<void> {
    // Simuler le chargement des templates par défaut
    console.log('🎥 Chargement des templates de transcription...');
  }

  /**
   * Démarre le monitoring
   */
  private startMonitoring(): void {
    // Monitorer les sessions en cours
    setInterval(() => {
      this.checkActiveSessions();
    }, 30000); // Toutes les 30 secondes
  }

  /**
   * Vérifie les sessions actives
   */
  private checkActiveSessions(): void {
    // Simuler la vérification des sessions actives
    console.log('🎥 Vérification des sessions actives...');
  }

  // Méthodes de base de données (simulées)

  private async saveSession(session: TranscriptionSession): Promise<void> {
    try {
      const { error } = await supabase
        .from('video_transcription_sessions')
        .upsert({
          id: session.id,
          user_id: session.userId,
          video_id: session.videoId,
          settings: session.settings,
          status: session.status,
          progress: session.progress,
          start_time: session.startTime,
          end_time: session.endTime,
          duration: session.duration,
          error: session.error,
          result: session.result,
          created_at: session.createdAt,
          updated_at: session.updatedAt
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde session transcription:', error);
    }
  }

  private async saveTranscription(transcription: VideoTranscription): Promise<void> {
    try {
      const { error } = await supabase
        .from('video_transcriptions')
        .insert({
          id: transcription.id,
          user_id: transcription.userId,
          video_id: transcription.videoId,
          original_file_name: transcription.originalFileName,
          file_url: transcription.fileUrl,
          file_size: transcription.fileSize,
          duration: transcription.duration,
          format: transcription.format,
          language: transcription.language,
          detected_language: transcription.detectedLanguage,
          transcription_text: transcription.transcriptionText,
          segments: transcription.segments,
          metadata: transcription.metadata,
          status: transcription.status,
          error: transcription.error,
          created_at: transcription.createdAt,
          updated_at: transcription.updatedAt,
          processed_at: transcription.processedAt
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde transcription:', error);
    }
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
        console.error('❌ Erreur callback événement transcription:', error);
      }
    }
  }

  /**
   * Détruit le service de transcription
   */
  destroy(): void {
    // Vider les caches
    this.transcriptions.clear();
    this.sessions.clear();
    this.templates.clear();
    this.eventCallbacks.clear();
    
    console.log('🎥 Service de transcription vidéo détruit');
  }
}

// Instance singleton
export const videoTranscriptionService = new VideoTranscriptionService();

// Export des fonctions utilitaires
export const startVideoTranscription = (
  userId: string,
  videoFile: File,
  settings?: Partial<TranscriptionSettings>
) => videoTranscriptionService.startTranscription(userId, videoFile, settings);

export const getVideoTranscription = (transcriptionId: string) => 
  videoTranscriptionService.getTranscription(transcriptionId);

export const getUserVideoTranscriptions = (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: TranscriptionStatus;
    language?: string;
  }
) => videoTranscriptionService.getUserTranscriptions(userId, options);

export const exportVideoTranscription = (
  transcriptionId: string,
  format: 'text' | 'json' | 'srt' | 'vtt' | 'csv' | 'pdf' | 'docx',
  options?: ExportOptions
) => videoTranscriptionService.exportTranscription(transcriptionId, format, options);

export const getVideoTranscriptionStats = () => videoTranscriptionService.getStats();
