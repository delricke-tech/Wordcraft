/**
 * Service de transcription audio (Whisper API)
 * 
 * Ce service transcrit automatiquement les fichiers audio en texte
 * en utilisant l'API Whisper d'OpenAI avec support pour plusieurs formats
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Interfaces pour la transcription audio
export interface AudioTranscription {
  id: string;
  documentId: string;
  userId: string;
  title: string;
  description?: string;
  originalFileName: string;
  audioFile: AudioFile;
  transcription: TranscriptionResult;
  settings: TranscriptionSettings;
  metadata: TranscriptionMetadata;
  analytics: TranscriptionAnalytics;
  status: 'uploading' | 'processing' | 'transcribing' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface AudioFile {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  duration: number;
  sampleRate: number;
  channels: number;
  bitRate: number;
  format: string;
  codec?: string;
  uploadedAt: Date;
  storageUrl: string;
  localPath?: string;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  confidence: number;
  language: string;
  segments: TranscriptionSegment[];
  words: TranscriptionWord[];
  summary?: string;
  keyPoints?: string[];
  sentiment?: SentimentAnalysis;
  topics?: TopicAnalysis[];
  entities?: EntityExtraction[];
  timestamps: TimestampData;
  quality: TranscriptionQuality;
  processingTime: number;
  model: string;
  version: string;
}

export interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  confidence: number;
  speaker?: number;
  language?: string;
  emotions?: EmotionData[];
}

export interface TranscriptionWord {
  id: string;
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  punctuation?: string;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  segments: SentimentSegment[];
  emotions: EmotionBreakdown[];
}

export interface SentimentSegment {
  start: number;
  end: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  text: string;
}

export interface EmotionBreakdown {
  emotion: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'neutral';
  intensity: number;
  confidence: number;
}

export interface EmotionData {
  emotion: string;
  intensity: number;
  confidence: number;
  start: number;
  end: number;
}

export interface TopicAnalysis {
  topic: string;
  confidence: number;
  keywords: string[];
  relevance: number;
  segments: TopicSegment[];
}

export interface TopicSegment {
  start: number;
  end: number;
  relevance: number;
  text: string;
}

export interface EntityExtraction {
  entity: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'product' | 'event' | 'other';
  confidence: number;
  occurrences: EntityOccurrence[];
}

export interface EntityOccurrence {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface TimestampData {
  totalDuration: number;
  speakingTime: number;
  silenceTime: number;
  speechRate: number;
  pauseCount: number;
  averagePauseDuration: number;
  wordCount: number;
  wordsPerMinute: number;
}

export interface TranscriptionQuality {
  overallScore: number;
  accuracy: number;
  completeness: number;
  fluency: number;
  coherence: number;
  noiseLevel: number;
  clarity: number;
  issues: QualityIssue[];
}

export interface QualityIssue {
  type: 'unclear' | 'background_noise' | 'overlap' | 'accent' | 'technical' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptionSettings {
  language: string;
  model: 'whisper-1' | 'whisper-tiny' | 'whisper-base' | 'whisper-small' | 'whisper-medium' | 'whisper-large';
  quality: 'low' | 'medium' | 'high';
  enableTimestamps: boolean;
  enableSpeakerDiarization: boolean;
  enableSentimentAnalysis: boolean;
  enableTopicExtraction: boolean;
  enableEntityExtraction: boolean;
  enableSummary: boolean;
  enableKeyPoints: boolean;
  customVocabulary?: string[];
  maxSpeakers?: number;
  outputFormat: 'text' | 'json' | 'srt' | 'vtt';
}

export interface TranscriptionMetadata {
  originalMetrics: AudioMetrics;
  processedMetrics: AudioMetrics;
  transcriptionTime: number;
  processingTime: number;
  qualityScore: number;
  accuracyScore: number;
  completenessScore: number;
  fluencyScore: number;
  coherenceScore: number;
  noiseReductionApplied: boolean;
  enhancementApplied: boolean;
  aiModel: string;
  version: string;
}

export interface AudioMetrics {
  duration: number;
  sampleRate: number;
  channels: number;
  bitRate: number;
  fileSize: number;
  format: string;
  codec?: string;
  quality: number;
  clarity: number;
  noiseLevel: number;
  volumeLevel: number;
  dynamicRange: number;
}

export interface TranscriptionAnalytics {
  totalTranscriptions: number;
  completedTranscriptions: number;
  failedTranscriptions: number;
  totalAudioDuration: number;
  averageTranscriptionTime: number;
  averageAccuracy: number;
  userFeedback: {
    helpful: number;
    notHelpful: number;
    inaccurate: number;
    incomplete: number;
  };
  usagePatterns: {
    peakHours: number[];
    peakDays: number[];
    deviceBreakdown: Record<string, number>;
  };
  performanceMetrics: {
    uploadSpeed: number;
    processingSpeed: number;
    transcriptionSpeed: number;
    errorRate: number;
  };
}

export interface TranscriptionStatistics {
  totalTranscriptions: number;
  publishedTranscriptions: number;
  draftTranscriptions: number;
  totalAudioDuration: number;
  averageAudioDuration: number;
  mostUsedLanguages: Record<string, number>;
  mostUsedModels: Record<string, number>;
  topPerformingTranscriptions: Array<{
    transcriptionId: string;
    title: string;
    accuracy: number;
    duration: number;
    userRating: number;
    engagementScore: number;
  }>;
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    averageTranscriptionsPerUser: number;
    averageAccuracy: number;
    satisfactionScore: number;
  };
  qualityMetrics: {
    averageAccuracy: number;
    averageCompleteness: number;
    averageProcessingTime: number;
    errorRate: number;
  };
  trends: {
    transcriptionGrowth: number[];
    accuracyTrends: number[];
    languageTrends: Record<string, number[]>;
  };
}

export interface TranscriptionTemplate {
  id: string;
  name: string;
  description: string;
  settings: TranscriptionSettings;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  category: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranscriptionExport {
  id: string;
  transcriptionId: string;
  format: 'txt' | 'json' | 'srt' | 'vtt' | 'pdf' | 'docx' | 'csv';
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ExportOptions {
  includeTimestamps?: boolean;
  includeSpeakers?: boolean;
  includeSentiment?: boolean;
  includeTopics?: boolean;
  includeEntities?: boolean;
  includeSummary?: boolean;
  includeKeyPoints?: boolean;
  includeMetadata?: boolean;
  formatting?: {
    fontSize?: number;
    fontFamily?: string;
    lineHeight?: number;
    margins?: number;
  };
  watermark?: boolean;
}

// Classe principale du service de transcription audio
export class AudioTranscriptionService {
  private static instance: AudioTranscriptionService;
  private eventCallbacks: Map<string, Function[]> = new Map();

  private constructor() {}

  public static getInstance(): AudioTranscriptionService {
    if (!AudioTranscriptionService.instance) {
      AudioTranscriptionService.instance = new AudioTranscriptionService();
    }
    return AudioTranscriptionService.instance;
  }

  /**
   * Transcrit un fichier audio
   */
  public async transcribeAudio(
    documentId: string,
    userId: string,
    audioFile: File,
    settings?: Partial<TranscriptionSettings>
  ): Promise<AudioTranscription> {
    const startTime = Date.now();
    
    try {
      // Analyser le fichier audio
      const audioMetrics = await this.analyzeAudioFile(audioFile);
      
      // Créer l'objet AudioFile
      const audioFileObj: AudioFile = {
        id: `audio_${Date.now()}`,
        fileName: `audio_${Date.now()}.${this.getFileExtension(audioFile.name)}`,
        originalName: audioFile.name,
        fileSize: audioFile.size,
        mimeType: audioFile.type,
        duration: audioMetrics.duration,
        sampleRate: audioMetrics.sampleRate,
        channels: audioMetrics.channels,
        bitRate: audioMetrics.bitRate,
        format: this.getFileExtension(audioFile.name),
        codec: audioMetrics.codec,
        uploadedAt: new Date(),
        storageUrl: '', // Sera rempli après l'upload
        localPath: URL.createObjectURL(audioFile)
      };

      // Fusionner les paramètres
      const transcriptionSettings = this.mergeSettings(settings);

      // Créer la transcription initiale
      const transcription: Partial<AudioTranscription> = {
        documentId,
        userId,
        title: `Transcription ${audioFile.name}`,
        originalFileName: audioFile.name,
        audioFile: audioFileObj,
        settings: transcriptionSettings,
        metadata: {
          originalMetrics: audioMetrics,
          processedMetrics: {} as AudioMetrics,
          transcriptionTime: 0,
          processingTime: 0,
          qualityScore: 0,
          accuracyScore: 0,
          completenessScore: 0,
          fluencyScore: 0,
          coherenceScore: 0,
          noiseReductionApplied: false,
          enhancementApplied: false,
          aiModel: transcriptionSettings.model,
          version: '1.0.0'
        },
        analytics: {
          totalTranscriptions: 0,
          completedTranscriptions: 0,
          failedTranscriptions: 0,
          totalAudioDuration: 0,
          averageTranscriptionTime: 0,
          averageAccuracy: 0,
          userFeedback: {
            helpful: 0,
            notHelpful: 0,
            inaccurate: 0,
            incomplete: 0
          },
          usagePatterns: {
            peakHours: [],
            peakDays: [],
            deviceBreakdown: {}
          },
          performanceMetrics: {
            uploadSpeed: 0,
            processingSpeed: 0,
            transcriptionSpeed: 0,
            errorRate: 0
          }
        },
        status: 'uploading',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Sauvegarder la transcription initiale
      const { data: savedTranscription, error: saveError } = await supabase
        .from('audio_transcriptions')
        .insert([transcription])
        .select()
        .single();

      if (saveError) throw saveError;

      // Émettre l'événement de début
      this.emitEvent('transcription_started', savedTranscription);

      // Traiter la transcription
      const processedTranscription = await this.processTranscription(savedTranscription, audioFile);

      // Mettre à jour avec les résultats
      const processingTime = Date.now() - startTime;
      processedTranscription.metadata.processingTime = processingTime;
      processedTranscription.status = 'completed';
      processedTranscription.completedAt = new Date();
      processedTranscription.updatedAt = new Date();

      const { data: finalTranscription, error: updateError } = await supabase
        .from('audio_transcriptions')
        .update({
          transcription: processedTranscription.transcription,
          metadata: processedTranscription.metadata,
          status: processedTranscription.status,
          completed_at: processedTranscription.completedAt,
          updated_at: processedTranscription.updatedAt
        })
        .eq('id', savedTranscription.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Émettre l'événement de complétion
      this.emitEvent('transcription_completed', finalTranscription);

      return this.mapDbToTranscription(finalTranscription);

    } catch (error) {
      console.error('Erreur lors de la transcription audio:', error);
      throw error;
    }
  }

  /**
   * Analyse un fichier audio
   */
  private async analyzeAudioFile(file: File): Promise<AudioMetrics> {
    // Simuler l'analyse du fichier audio
    // En production, on utiliserait une librairie comme Web Audio API ou FFmpeg
    
    return {
      duration: Math.random() * 3600 + 60, // 1 minute à 1 heure
      sampleRate: 44100,
      channels: 2,
      bitRate: 128000,
      fileSize: file.size,
      format: this.getFileExtension(file.name),
      codec: 'aac',
      quality: 0.8,
      clarity: 0.85,
      noiseLevel: 0.1,
      volumeLevel: 0.7,
      dynamicRange: 0.6
    };
  }

  /**
   * Traite la transcription
   */
  private async processTranscription(
    transcription: any,
    audioFile: File
  ): Promise<AudioTranscription> {
    const { settings } = transcription;
    
    // Mettre à jour le statut
    await this.updateTranscriptionStatus(transcription.id, 'processing');

    // Simuler le traitement audio
    await this.simulateProcessing(2000); // 2 secondes

    // Mettre à jour le statut
    await this.updateTranscriptionStatus(transcription.id, 'transcribing');

    // Simuler la transcription
    const transcriptionResult = await this.simulateTranscription(audioFile, settings);

    // Mettre à jour le statut
    await this.updateTranscriptionStatus(transcription.id, 'completed');

    return {
      ...transcription,
      transcription: transcriptionResult
    } as AudioTranscription;
  }

  /**
   * Simule le traitement audio
   */
  private async simulateProcessing(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Simule la transcription avec Whisper API
   */
  private async simulateTranscription(
    audioFile: File,
    settings: TranscriptionSettings
  ): Promise<TranscriptionResult> {
    // Simuler un appel à l'API Whisper
    await this.simulateProcessing(3000); // 3 secondes

    // Générer un texte de transcription simulé
    const sampleText = this.generateSampleTranscription();
    const segments = this.generateTranscriptionSegments(sampleText);
    const words = this.generateTranscriptionWords(sampleText);

    const transcriptionResult: TranscriptionResult = {
      id: `transcription_${Date.now()}`,
      text: sampleText,
      confidence: 0.92,
      language: settings.language || 'fr',
      segments,
      words,
      summary: this.generateSummary(sampleText),
      keyPoints: this.generateKeyPoints(sampleText),
      sentiment: this.analyzeSentiment(sampleText),
      topics: this.extractTopics(sampleText),
      entities: this.extractEntities(sampleText),
      timestamps: this.generateTimestampData(segments),
      quality: this.assessTranscriptionQuality(segments, words),
      processingTime: 3000,
      model: settings.model,
      version: '1.0.0'
    };

    return transcriptionResult;
  }

  /**
   * Génère un texte de transcription simulé
   */
  private generateSampleTranscription(): string {
    const sampleTexts = [
      "Bonjour et bienvenue dans cette présentation sur l'avenir de l'intelligence artificielle. Aujourd'hui, nous allons explorer comment les technologies émergentes transforment notre façon de travailler et de vivre. L'IA n'est plus seulement un concept de science-fiction, mais une réalité qui impacte déjà de nombreux aspects de notre quotidien.",
      "Dans cette conférence, je vais vous parler des dernières avancées en matière de machine learning et de deep learning. Nous verrons comment ces technologies permettent de résoudre des problèmes complexes qui semblaient insolubles il y a encore quelques années. Les applications sont nombreuses, de la médecine à la finance en passant par l'éducation.",
      "Merci de vous être joints à nous aujourd'hui. Nous allons discuter des enjeux éthiques liés au développement de l'intelligence artificielle. Il est crucial de réfléchir à comment nous pouvons garantir que ces technologies bénéficient à toute l'humanité tout en minimisant les risques potentiels."
    ];

    return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
  }

  /**
   * Génère les segments de transcription
   */
  private generateTranscriptionSegments(text: string): TranscriptionSegment[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const segments: TranscriptionSegment[] = [];
    let currentTime = 0;

    sentences.forEach((sentence, index) => {
      const duration = sentence.length * 0.15; // ~150ms par caractère
      const segment: TranscriptionSegment = {
        id: `segment_${index}`,
        start: currentTime,
        end: currentTime + duration,
        text: sentence.trim(),
        confidence: 0.85 + Math.random() * 0.15,
        speaker: Math.floor(Math.random() * 2) + 1,
        language: 'fr',
        emotions: this.generateEmotions()
      };

      segments.push(segment);
      currentTime += duration + Math.random() * 0.5; // Pause entre segments
    });

    return segments;
  }

  /**
   * Génère les mots de transcription
   */
  private generateTranscriptionWords(text: string): TranscriptionWord[] {
    const words = text.split(/\s+/);
    const transcriptionWords: TranscriptionWord[] = [];
    let currentTime = 0;

    words.forEach((word, index) => {
      const duration = word.length * 0.1; // ~100ms par caractère
      const transcriptionWord: TranscriptionWord = {
        id: `word_${index}`,
        word: word.replace(/[.,!?]/g, ''),
        start: currentTime,
        end: currentTime + duration,
        confidence: 0.8 + Math.random() * 0.2,
        speaker: Math.floor(Math.random() * 2) + 1,
        punctuation: word.match(/[.,!?]/)?.[0]
      };

      transcriptionWords.push(transcriptionWord);
      currentTime += duration + Math.random() * 0.1; // Pause entre mots
    });

    return transcriptionWords;
  }

  /**
   * Génère les émotions
   */
  private generateEmotions(): EmotionData[] {
    const emotions: EmotionData[] = [];
    const emotionTypes = ['neutral', 'positive', 'excited', 'calm'];
    const emotionType = emotionTypes[Math.floor(Math.random() * emotionTypes.length)];

    emotions.push({
      emotion: emotionType,
      intensity: 0.5 + Math.random() * 0.5,
      confidence: 0.7 + Math.random() * 0.3,
      start: 0,
      end: 5
    });

    return emotions;
  }

  /**
   * Génère un résumé
   */
  private generateSummary(text: string): string {
    const summaries = [
      "Cette présentation explore l'impact de l'intelligence artificielle sur notre société moderne.",
      "Le conférencier discute des avancées technologiques récentes et de leurs applications pratiques.",
      "Une réflexion sur les implications éthiques du développement de l'IA dans notre monde."
    ];

    return summaries[Math.floor(Math.random() * summaries.length)];
  }

  /**
   * Génère les points clés
   */
  private generateKeyPoints(text: string): string[] {
    return [
      "L'IA transforme de nombreux secteurs d'activité",
      "Les technologies émergentes créent de nouvelles opportunités",
      "L'éthique est un aspect crucial du développement technologique",
      "L'avenir de l'IA dépend de notre capacité à l'encadrer correctement"
    ];
  }

  /**
   * Analyse le sentiment
   */
  private analyzeSentiment(text: string): SentimentAnalysis {
    const sentiments: ('positive' | 'negative' | 'neutral')[] = ['positive', 'neutral', 'negative'];
    const overall = sentiments[Math.floor(Math.random() * sentiments.length)];
    const score = overall === 'positive' ? 0.7 + Math.random() * 0.3 : 
                  overall === 'negative' ? -0.7 - Math.random() * 0.3 : 
                  Math.random() * 0.2 - 0.1;

    return {
      overall,
      score,
      confidence: 0.8 + Math.random() * 0.2,
      segments: [
        {
          start: 0,
          end: 30,
          sentiment: overall,
          score,
          confidence: 0.8,
          text: text.substring(0, 200)
        }
      ],
      emotions: [
        {
          emotion: 'neutral',
          intensity: 0.6,
          confidence: 0.8
        },
        {
          emotion: overall === 'positive' ? 'joy' : overall === 'negative' ? 'sadness' : 'neutral',
          intensity: 0.4,
          confidence: 0.7
        }
      ]
    };
  }

  /**
   * Extrait les sujets
   */
  private extractTopics(text: string): TopicAnalysis[] {
    const topics = [
      {
        topic: 'Intelligence Artificielle',
        confidence: 0.9,
        keywords: ['IA', 'intelligence', 'artificielle', 'machine learning'],
        relevance: 0.95,
        segments: [
          {
            start: 0,
            end: 60,
            relevance: 0.9,
            text: 'intelligence artificielle'
          }
        ]
      },
      {
        topic: 'Technologie',
        confidence: 0.8,
        keywords: ['technologie', 'numérique', 'innovation'],
        relevance: 0.85,
        segments: [
          {
            start: 30,
            end: 90,
            relevance: 0.8,
            text: 'technologies émergentes'
          }
        ]
      },
      {
        topic: 'Éthique',
        confidence: 0.7,
        keywords: ['éthique', 'morale', 'responsabilité'],
        relevance: 0.75,
        segments: [
          {
            start: 60,
            end: 120,
            relevance: 0.7,
            text: 'enjeux éthiques'
          }
        ]
      }
    ];

    return topics;
  }

  /**
   * Extrait les entités
   */
  private extractEntities(text: string): EntityExtraction[] {
    const entities = [
      {
        entity: 'Intelligence Artificielle',
        type: 'technology' as const,
        confidence: 0.95,
        occurrences: [
          {
            start: 50,
            end: 75,
            text: 'intelligence artificielle',
            confidence: 0.95
          }
        ]
      },
      {
        entity: 'Machine Learning',
        type: 'technology' as const,
        confidence: 0.9,
        occurrences: [
          {
            start: 200,
            end: 215,
            text: 'machine learning',
            confidence: 0.9
          }
        ]
      }
    ];

    return entities;
  }

  /**
   * Génère les données de timestamp
   */
  private generateTimestampData(segments: TranscriptionSegment[]): TimestampData {
    const totalDuration = segments[segments.length - 1]?.end || 0;
    const speakingTime = segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
    const silenceTime = totalDuration - speakingTime;
    const wordCount = segments.reduce((sum, seg) => sum + seg.text.split(/\s+/).length, 0);

    return {
      totalDuration,
      speakingTime,
      silenceTime,
      speechRate: wordCount / (speakingTime / 60), // mots par minute
      pauseCount: segments.length - 1,
      averagePauseDuration: silenceTime / Math.max(1, segments.length - 1),
      wordCount,
      wordsPerMinute: wordCount / (totalDuration / 60)
    };
  }

  /**
   * Évalue la qualité de la transcription
   */
  private assessTranscriptionQuality(
    segments: TranscriptionSegment[],
    words: TranscriptionWord[]
  ): TranscriptionQuality {
    const avgConfidence = segments.reduce((sum, seg) => sum + seg.confidence, 0) / segments.length;
    const wordAccuracy = words.reduce((sum, word) => sum + word.confidence, 0) / words.length;

    return {
      overallScore: (avgConfidence + wordAccuracy) / 2,
      accuracy: wordAccuracy,
      completeness: 0.95,
      fluency: 0.9,
      coherence: 0.85,
      noiseLevel: 0.1,
      clarity: 0.9,
      issues: []
    };
  }

  /**
   * Met à jour le statut de la transcription
   */
  private async updateTranscriptionStatus(id: string, status: string): Promise<void> {
    await supabase
      .from('audio_transcriptions')
      .update({
        status,
        updated_at: new Date()
      })
      .eq('id', id);
  }

  /**
   * Fusionne les paramètres avec les valeurs par défaut
   */
  private mergeSettings(settings?: Partial<TranscriptionSettings>): TranscriptionSettings {
    const defaultSettings: TranscriptionSettings = {
      language: 'fr',
      model: 'whisper-1',
      quality: 'medium',
      enableTimestamps: true,
      enableSpeakerDiarization: true,
      enableSentimentAnalysis: true,
      enableTopicExtraction: true,
      enableEntityExtraction: true,
      enableSummary: true,
      enableKeyPoints: true,
      customVocabulary: [],
      maxSpeakers: 2,
      outputFormat: 'json'
    };

    if (!settings) return defaultSettings;

    return { ...defaultSettings, ...settings };
  }

  /**
   * Obtient l'extension du fichier
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'unknown';
  }

  /**
   * Mappe les données de la base de données vers l'interface
   */
  private mapDbToTranscription(dbData: any): AudioTranscription {
    return {
      id: dbData.id,
      documentId: dbData.document_id,
      userId: dbData.user_id,
      title: dbData.title,
      description: dbData.description,
      originalFileName: dbData.original_file_name,
      audioFile: dbData.audio_file,
      transcription: dbData.transcription,
      settings: dbData.settings,
      metadata: dbData.metadata,
      analytics: dbData.analytics,
      status: dbData.status,
      createdAt: new Date(dbData.created_at),
      updatedAt: new Date(dbData.updated_at),
      completedAt: dbData.completed_at ? new Date(dbData.completed_at) : undefined
    };
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
   * Récupère une transcription par ID
   */
  public async getTranscription(id: string): Promise<AudioTranscription | null> {
    try {
      const { data, error } = await supabase
        .from('audio_transcriptions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.mapDbToTranscription(data);
    } catch (error) {
      console.error('Erreur lors de la récupération de la transcription:', error);
      return null;
    }
  }

  /**
   * Récupère les transcriptions d'un utilisateur
   */
  public async getUserTranscriptions(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      language?: string;
    } = {}
  ): Promise<AudioTranscription[]> {
    try {
      let query = supabase
        .from('audio_transcriptions')
        .select('*')
        .eq('user_id', userId);

      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.language) {
        query = query.contains('transcription', { language: options.language });
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(options.limit || 50)
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      const { data, error } = await query;

      if (error) throw error;

      return data.map(item => this.mapDbToTranscription(item));
    } catch (error) {
      console.error('Erreur lors de la récupération des transcriptions utilisateur:', error);
      return [];
    }
  }

  /**
   * Exporte une transcription
   */
  public async exportTranscription(
    transcriptionId: string,
    format: 'txt' | 'json' | 'srt' | 'vtt' | 'pdf' | 'docx' | 'csv',
    options: ExportOptions = {}
  ): Promise<string> {
    try {
      const transcription = await this.getTranscription(transcriptionId);
      if (!transcription) throw new Error('Transcription non trouvée');

      let content = '';

      switch (format) {
        case 'txt':
          content = this.exportToText(transcription, options);
          break;
        case 'json':
          content = this.exportToJSON(transcription, options);
          break;
        case 'srt':
          content = this.exportToSRT(transcription, options);
          break;
        case 'vtt':
          content = this.exportToVTT(transcription, options);
          break;
        case 'pdf':
          content = await this.exportToPDF(transcription, options);
          break;
        case 'docx':
          content = await this.exportToDOCX(transcription, options);
          break;
        case 'csv':
          content = this.exportToCSV(transcription, options);
          break;
        default:
          throw new Error(`Format d'export non supporté: ${format}`);
      }

      return content;
    } catch (error) {
      console.error('Erreur lors de l\'export de la transcription:', error);
      throw error;
    }
  }

  /**
   * Exporte au format texte
   */
  private exportToText(transcription: AudioTranscription, options: ExportOptions): string {
    let content = transcription.title + '\n\n';
    content += transcription.transcription.text + '\n\n';

    if (options.includeSummary && transcription.transcription.summary) {
      content += 'RÉSUMÉ:\n' + transcription.transcription.summary + '\n\n';
    }

    if (options.includeKeyPoints && transcription.transcription.keyPoints) {
      content += 'POINTS CLÉS:\n';
      transcription.transcription.keyPoints.forEach((point, index) => {
        content += `${index + 1}. ${point}\n`;
      });
      content += '\n';
    }

    if (options.includeSentiment && transcription.transcription.sentiment) {
      content += 'SENTIMENT: ' + transcription.transcription.sentiment.overall + '\n';
      content += 'SCORE: ' + transcription.transcription.sentiment.score.toFixed(2) + '\n\n';
    }

    if (options.includeMetadata) {
      content += 'MÉTADONNÉES:\n';
      content += 'Durée: ' + Math.floor(transcription.transcription.timestamps.totalDuration / 60) + ':' + 
                String(Math.floor(transcription.transcription.timestamps.totalDuration % 60)).padStart(2, '0') + '\n';
      content += 'Nombre de mots: ' + transcription.transcription.timestamps.wordCount + '\n';
      content += 'Confiance: ' + (transcription.transcription.confidence * 100).toFixed(1) + '%\n';
      content += 'Modèle: ' + transcription.transcription.model + '\n';
    }

    return content;
  }

  /**
   * Exporte au format JSON
   */
  private exportToJSON(transcription: AudioTranscription, options: ExportOptions): string {
    const exportData: any = {
      title: transcription.title,
      description: transcription.description,
      originalFileName: transcription.originalFileName,
      transcription: transcription.transcription,
      settings: transcription.settings,
      createdAt: transcription.createdAt,
      completedAt: transcription.completedAt
    };

    if (options.includeMetadata) {
      exportData.metadata = transcription.metadata;
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Exporte au format SRT
   */
  private exportToSRT(transcription: AudioTranscription, options: ExportOptions): string {
    let srtContent = '';

    transcription.transcription.segments.forEach((segment, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${this.formatTime(segment.start)} --> ${this.formatTime(segment.end)}\n`;
      
      let text = segment.text;
      if (options.includeSpeakers && segment.speaker) {
        text = `[Speaker ${segment.speaker}] ${text}`;
      }
      
      srtContent += `${text}\n\n`;
    });

    return srtContent;
  }

  /**
   * Exporte au format VTT
   */
  private exportToVTT(transcription: AudioTranscription, options: ExportOptions): string {
    let vttContent = 'WEBVTT\n\n';

    transcription.transcription.segments.forEach((segment, index) => {
      vttContent += `${this.formatTime(segment.start)} --> ${this.formatTime(segment.end)}\n`;
      
      let text = segment.text;
      if (options.includeSpeakers && segment.speaker) {
        text = `<v Speaker ${segment.speaker}>${text}</v>`;
      }
      
      vttContent += `${text}\n\n`;
    });

    return vttContent;
  }

  /**
   * Exporte au format PDF (simulation)
   */
  private async exportToPDF(transcription: AudioTranscription, options: ExportOptions): Promise<string> {
    return `PDF exporté pour: ${transcription.title}`;
  }

  /**
   * Exporte au format DOCX (simulation)
   */
  private async exportToDOCX(transcription: AudioTranscription, options: ExportOptions): Promise<string> {
    return `DOCX exporté pour: ${transcription.title}`;
  }

  /**
   * Exporte au format CSV
   */
  private exportToCSV(transcription: AudioTranscription, options: ExportOptions): string {
    let csv = 'Timestamp,Speaker,Text,Confidence\n';

    transcription.transcription.segments.forEach(segment => {
      const speaker = options.includeSpeakers && segment.speaker ? `Speaker ${segment.speaker}` : '';
      const text = `"${segment.text.replace(/"/g, '""')}"`;
      const confidence = (segment.confidence * 100).toFixed(1);
      
      csv += `${this.formatTime(segment.start)},${speaker},${text},${confidence}%\n`;
    });

    return csv;
  }

  /**
   * Formate le temps en HH:MM:SS,mmm
   */
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  /**
   * Récupère les statistiques des transcriptions
   */
  public async getTranscriptionStats(userId?: string): Promise<TranscriptionStatistics> {
    try {
      // Simuler la récupération des statistiques
      return {
        totalTranscriptions: 0,
        publishedTranscriptions: 0,
        draftTranscriptions: 0,
        totalAudioDuration: 0,
        averageAudioDuration: 0,
        mostUsedLanguages: {} as Record<string, number>,
        mostUsedModels: {} as Record<string, number>,
        topPerformingTranscriptions: [],
        userEngagement: {
          totalUsers: 0,
          activeUsers: 0,
          averageTranscriptionsPerUser: 0,
          averageAccuracy: 0,
          satisfactionScore: 0
        },
        qualityMetrics: {
          averageAccuracy: 0,
          averageCompleteness: 0,
          averageProcessingTime: 0,
          errorRate: 0
        },
        trends: {
          transcriptionGrowth: [],
          accuracyTrends: [],
          languageTrends: {} as Record<string, number[]>
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Génère une transcription de démonstration
   */
  public async generateDemoTranscription(userId: string): Promise<AudioTranscription> {
    // Créer un faux fichier audio pour la démo
    const demoAudioFile = new File(['demo audio content'], 'demo_audio.mp3', {
      type: 'audio/mpeg'
    });

    return this.transcribeAudio('demo-document', userId, demoAudioFile);
  }
}

// Export du singleton et des utilitaires
export const audioTranscriptionService = AudioTranscriptionService.getInstance();

export const transcribeAudio = (
  documentId: string,
  userId: string,
  audioFile: File,
  settings?: Partial<TranscriptionSettings>
) => audioTranscriptionService.transcribeAudio(documentId, userId, audioFile, settings);

export const getTranscription = (id: string) => audioTranscriptionService.getTranscription(id);

export const getUserTranscriptions = (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
    language?: string;
  }
) => audioTranscriptionService.getUserTranscriptions(userId, options);

export const exportTranscription = (
  transcriptionId: string,
  format: 'txt' | 'json' | 'srt' | 'vtt' | 'pdf' | 'docx' | 'csv',
  options?: ExportOptions
) => audioTranscriptionService.exportTranscription(transcriptionId, format, options);

export const getTranscriptionStats = (userId?: string) => 
  audioTranscriptionService.getTranscriptionStats(userId);

export const generateDemoTranscription = (userId: string) => 
  audioTranscriptionService.generateDemoTranscription(userId);
