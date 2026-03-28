/**
 * Service de timeline chronologique (événements extraits)
 * 
 * Ce service extrait automatiquement les événements chronologiques des documents
 * et crée des timelines interactives avec visualisation temporelle
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface Timeline {
  id: string;
  documentId: string;
  userId: string;
  title: string;
  description?: string;
  type: TimelineType;
  events: TimelineEvent[];
  settings: TimelineSettings;
  metadata: TimelineMetadata;
  analytics: TimelineAnalytics;
  status?: 'draft' | 'processing' | 'completed' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export type TimelineType = 
  | 'historical'
  | 'project'
  | 'biographical'
  | 'narrative'
  | 'process'
  | 'scientific'
  | 'legal'
  | 'medical'
  | 'educational'
  | 'business'
  | 'custom';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startDate?: string;
  endDate?: string;
  time?: string;
  duration?: number;
  location?: string;
  participants?: string[];
  category: string;
  subcategory?: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  type: EventType;
  sources: EventSource[];
  media: EventMedia[];
  tags: string[];
  keywords: string[];
  relatedEvents: string[];
  metadata: EventMetadata;
  position: EventPosition;
  style: EventStyle;
  interactions: EventInteraction[];
  createdAt: string;
  updatedAt: string;
}

export type EventType = 
  | 'milestone'
  | 'meeting'
  | 'decision'
  | 'deadline'
  | 'launch'
  | 'completion'
  | 'review'
  | 'approval'
  | 'change'
  | 'crisis'
  | 'celebration'
  | 'announcement'
  | 'discovery'
  | 'invention'
  | 'publication'
  | 'conflict'
  | 'resolution'
  | 'birth'
  | 'death'
  | 'marriage'
  | 'graduation'
  | 'appointment'
  | 'travel'
  | 'achievement'
  | 'failure'
  | 'success'
  | 'custom';

export interface EventSource {
  id: string;
  type: 'document' | 'page' | 'section' | 'paragraph' | 'annotation' | 'url';
  title: string;
  content: string;
  url?: string;
  pageNumber?: number;
  position?: SourcePosition;
  confidence: number;
  relevance: number;
  snippet: string;
  metadata: Record<string, any>;
}

export interface SourcePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}

export interface EventMedia {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'chart' | 'map' | 'infographic';
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  size?: number;
  format?: string;
  metadata: Record<string, any>;
}

export interface EventMetadata {
  extractionMethod: 'ai' | 'manual' | 'hybrid';
  confidence: number;
  relevance: number;
  accuracy: number;
  completeness: number;
  processingTime: number;
  model: string;
  temperature: number;
  tokensUsed: number;
  language: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  complexity: 'low' | 'medium' | 'high';
  readability: number;
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  dateExtraction: DateExtractionInfo;
  customFields: Record<string, any>;
}

export interface DateExtractionInfo {
  originalText: string;
  extractedDate: string;
  dateFormat: string;
  confidence: number;
  method: 'regex' | 'nlp' | 'ml' | 'manual';
  timezone?: string;
  isApproximate: boolean;
  isEstimated: boolean;
  hasTime: boolean;
  context: string;
}

export interface EventPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  lane: number;
  zIndex: number;
  connections: EventConnection[];
}

export interface EventConnection {
  fromEventId: string;
  toEventId: string;
  type: 'causal' | 'temporal' | 'dependency' | 'related' | 'custom';
  label?: string;
  style: ConnectionStyle;
  metadata: Record<string, any>;
}

export interface ConnectionStyle {
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'double';
  arrowType: 'none' | 'arrow' | 'double-arrow';
  opacity: number;
}

export interface EventStyle {
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double';
  borderRadius: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  icon: string;
  iconSize: number;
  iconColor: string;
  shadow: string;
  animation?: string;
}

export interface EventInteraction {
  id: string;
  userId: string;
  type: 'view' | 'click' | 'share' | 'comment' | 'like' | 'bookmark' | 'edit';
  timestamp: string;
  metadata: Record<string, any>;
}

export interface TimelineSettings {
  maxEvents: number;
  dateRange: DateRange;
  categories: string[];
  importance: ImportanceFilter;
  status: StatusFilter;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  grouping: GroupingOption;
  filtering: FilteringOption;
  visualization: VisualizationSettings;
  export: ExportSettings;
  personalization: PersonalizationSettings;
}

export interface DateRange {
  start?: string;
  end?: string;
  isDynamic: boolean;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'decade' | 'century';
}

export interface ImportanceFilter {
  includeLow: boolean;
  includeMedium: boolean;
  includeHigh: boolean;
  includeCritical: boolean;
  minImportance?: number;
}

export interface StatusFilter {
  includePlanned: boolean;
  includeInProgress: boolean;
  includeCompleted: boolean;
  includeCancelled: boolean;
  includePostponed: boolean;
}

export interface SortOption {
  field: 'date' | 'title' | 'importance' | 'duration' | 'category' | 'status';
  direction: 'asc' | 'desc';
}

export interface GroupingOption {
  enabled: boolean;
  field: 'category' | 'subcategory' | 'year' | 'month' | 'decade' | 'location' | 'participants';
  sortOrder: 'asc' | 'desc';
}

export interface FilteringOption {
  searchQuery?: string;
  tags?: string[];
  keywords?: string[];
  participants?: string[];
  locations?: string[];
  dateRange?: DateRange;
  customFilters?: Record<string, any>;
  importance?: {
    includeLow: boolean;
    includeMedium: boolean;
    includeHigh: boolean;
    includeCritical: boolean;
  };
  status?: {
    includePlanned: boolean;
    includeInProgress: boolean;
    includeCompleted: boolean;
    includeCancelled: boolean;
    includePostponed: boolean;
  };
  categories?: string[];
}

export interface VisualizationSettings {
  layout: 'horizontal' | 'vertical' | 'spiral' | 'grid' | 'gantt' | 'mindmap';
  theme: 'light' | 'dark' | 'auto' | 'custom';
  colors: ColorScheme;
  fonts: FontSettings;
  animations: AnimationSettings;
  interactions: InteractionSettings;
  responsive: ResponsiveSettings;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
  categories: Record<string, string>;
  importance: Record<string, string>;
  status: Record<string, string>;
}

export interface FontSettings {
  family: string;
  size: number;
  weight: string;
  lineHeight: number;
  letterSpacing: number;
}

export interface AnimationSettings {
  enabled: boolean;
  duration: number;
  easing: string;
  stagger: number;
  autoplay: boolean;
  triggers: string[];
}

export interface InteractionSettings {
  hover: boolean;
  click: boolean;
  drag: boolean;
  zoom: boolean;
  pan: boolean;
  select: boolean;
  keyboard: boolean;
  touch: boolean;
}

export interface ResponsiveSettings {
  breakpoints: Record<string, number>;
  adaptiveLayout: boolean;
  adaptiveColors: boolean;
  adaptiveFonts: boolean;
  touchOptimized: boolean;
}

export interface ExportSettings {
  format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'html' | 'svg' | 'png';
  quality: 'low' | 'medium' | 'high';
  includeMetadata: boolean;
  includeMedia: boolean;
  includeInteractions: boolean;
  dateRange?: DateRange;
  customOptions?: Record<string, any>;
}

export interface PersonalizationSettings {
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  preferredCategories: string[];
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  customPreferences: Record<string, any>;
}

export interface TimelineMetadata {
  totalEvents: number;
  dateRange: {
    earliest: string;
    latest: string;
    span: number; // en jours
  };
  categories: Record<string, number>;
  types: Record<string, number>;
  importance: Record<string, number>;
  status: Record<string, number>;
  locations: Record<string, number>;
  participants: Record<string, number>;
  quality: QualityMetrics;
  extraction: ExtractionMetrics;
  version: number;
  lastUpdated: string;
  customFields: Record<string, any>;
}

export interface QualityMetrics {
  averageConfidence: number;
  averageRelevance: number;
  averageAccuracy: number;
  averageCompleteness: number;
  totalExtractionTime: number;
  errorRate: number;
  duplicateRate: number;
  missingDataRate: number;
}

export interface ExtractionMetrics {
  method: Record<string, number>;
  model: Record<string, number>;
  averageProcessingTime: number;
  totalTokensUsed: number;
  averageTokensPerEvent: number;
  dateExtractionAccuracy: number;
  locationExtractionAccuracy: number;
  participantExtractionAccuracy: number;
}

export interface TimelineAnalytics {
  totalViews: number;
  uniqueViews: number;
  averageSessionDuration: number;
  mostViewedEvents: Array<{
    eventId: string;
    viewCount: number;
    averageTime: number;
    interactionCount: number;
  }>;
  userEngagement: {
    averageSessionLength: number;
    bounceRate: number;
    returnRate: number;
    interactionRate: number;
    shareRate: number;
    bookmarkRate: number;
  };
  temporalPatterns: {
    hourlyViews: number[];
    dailyViews: number[];
    weeklyViews: number[];
    monthlyViews: number[];
    peakTimes: Array<{
      hour: number;
      views: number;
    }>;
  };
  geographicPatterns: {
    locations: Record<string, number>;
    regions: Record<string, number>;
    countries: Record<string, number>;
  };
  contentPerformance: {
    topCategories: Array<{
      category: string;
      eventCount: number;
      averageViews: number;
      averageRating: number;
    }>;
    topTypes: Array<{
      type: string;
      eventCount: number;
      averageViews: number;
      averageRating: number;
    }>;
    topImportance: Array<{
      importance: string;
      eventCount: number;
      averageViews: number;
      averageRating: number;
    }>;
  };
  trends: {
    growthRate: number;
    seasonalPatterns: Record<string, number>;
    emergingEvents: Array<{
      eventType: string;
      growthRate: number;
      confidence: number;
    }>;
  };
}

export interface TimelineTemplate {
  id: string;
  name: string;
  description: string;
  type: TimelineType;
  prompt: string;
  settings: Partial<TimelineSettings>;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineExport {
  id: string;
  timelineId: string;
  format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'html' | 'svg' | 'png';
  options: ExportSettings;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TimelineStats {
  totalTimelines: number;
  publishedTimelines: number;
  draftTimelines: number;
  totalEvents: number;
  averageEventsPerTimeline: number;
  mostActiveTypes: Record<string, number>;
  mostActiveCategories: Record<string, number>;
  topPerformingTimelines: Array<{
    timelineId: string;
    title: string;
    viewCount: number;
    averageRating: number;
    eventCount: number;
  }>;
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    averageTimelinesPerUser: number;
    averageEventsPerUser: number;
    averageSessionDuration: number;
    satisfactionScore: number;
  };
  contentQuality: {
    averageConfidence: number;
    averageRelevance: number;
    averageAccuracy: number;
    averageCompleteness: number;
    extractionSuccessRate: number;
  };
  trends: {
    timelineGrowth: number[];
    eventGrowth: number[];
    typeTrends: Record<string, number[]>;
    categoryTrends: Record<string, number[]>;
  };
}

class TimelineService {
  private timelines: Map<string, Timeline> = new Map();
  private templates: Map<string, TimelineTemplate> = new Map();
  private eventCallbacks: Map<string, (event: any) => void> = new Map();
  private monitoringTimers: Array<ReturnType<typeof setInterval>> = [];

  constructor() {
    this.initializeService();
  }

  /**
   * Initialise le service de timeline
   */
  private async initializeService(): Promise<void> {
    try {
      // Charger les templates par défaut
      await this.loadDefaultTemplates();
      
      // Démarrer le monitoring
      this.startMonitoring();
      
      console.log('📅 Service de timeline initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation service timeline:', error);
    }
  }

  /**
   * Génère une timeline à partir d'un document
   */
  async generateTimeline(
    documentId: string,
    userId: string,
    settings: Partial<TimelineSettings> = {},
    options: {
      title?: string;
      description?: string;
      type?: TimelineType;
      categories?: string[];
    } = {}
  ): Promise<Timeline> {
    try {
      // Valider les paramètres
      this.validateTimelineSettings(settings);

      // Récupérer le document
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Document non trouvé');
      }

      // Fusionner les paramètres par défaut
      const timelineSettings = this.mergeDefaultSettings(settings);

      // Créer la timeline
      const timeline: Timeline = {
        id: this.generateId(),
        documentId,
        userId,
        title: options.title || `Timeline: ${document.title}`,
        description: options.description || `Timeline chronologique extraite automatiquement du document ${document.title}`,
        type: options.type || 'historical',
        events: [],
        settings: timelineSettings,
        metadata: {
          totalEvents: 0,
          dateRange: {
            earliest: '',
            latest: '',
            span: 0
          },
          categories: {},
          types: {},
          importance: {},
          status: {},
          locations: {},
          participants: {},
          quality: {
            averageConfidence: 0,
            averageRelevance: 0,
            averageAccuracy: 0,
            averageCompleteness: 0,
            totalExtractionTime: 0,
            errorRate: 0,
            duplicateRate: 0,
            missingDataRate: 0
          },
          extraction: {
            method: {},
            model: {},
            averageProcessingTime: 0,
            totalTokensUsed: 0,
            averageTokensPerEvent: 0,
            dateExtractionAccuracy: 0,
            locationExtractionAccuracy: 0,
            participantExtractionAccuracy: 0
          },
          version: 1,
          lastUpdated: new Date().toISOString(),
          customFields: {}
        },
        analytics: {
          totalViews: 0,
          uniqueViews: 0,
          averageSessionDuration: 0,
          mostViewedEvents: [],
          userEngagement: {
            averageSessionLength: 0,
            bounceRate: 0,
            returnRate: 0,
            interactionRate: 0,
            shareRate: 0,
            bookmarkRate: 0
          },
          temporalPatterns: {
            hourlyViews: Array(24).fill(0),
            dailyViews: Array(30).fill(0),
            weeklyViews: Array(52).fill(0),
            monthlyViews: Array(12).fill(0),
            peakTimes: []
          },
          geographicPatterns: {
            locations: {},
            regions: {},
            countries: {}
          },
          contentPerformance: {
            topCategories: [],
            topTypes: [],
            topImportance: []
          },
          trends: {
            growthRate: 0,
            seasonalPatterns: {},
            emergingEvents: []
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Sauvegarder la timeline
      this.timelines.set(timeline.id, timeline);
      await this.saveTimeline(timeline);

      // Émettre l'événement de début de génération
      this.emit('timeline_generation_started', { timeline });

      // Démarrer la génération en arrière-plan
      this.processTimelineGeneration(timeline, document);

      console.log('📅 Génération timeline démarrée:', timeline.id);
      return timeline;

    } catch (error) {
      console.error('❌ Erreur génération timeline:', error);
      throw error;
    }
  }

  /**
   * Traite la génération de timeline en arrière-plan
   */
  private async processTimelineGeneration(timeline: Timeline, document: any): Promise<void> {
    try {
      const startTime = Date.now();

      // Mettre à jour le statut
      timeline.status = 'processing';
      await this.saveTimeline(timeline);

      // Extraire le contenu du document
      const content = await this.extractDocumentContent(document);
      
      // Générer les événements
      const events = await this.extractEvents(content, timeline.settings);
      
      // Traiter et valider les événements
      const processedEvents = await this.processEvents(events, timeline.settings);
      
      // Calculer les métadonnées
      const metadata = this.calculateTimelineMetadata(processedEvents, content);
      
      // Mettre à jour la timeline
      timeline.events = processedEvents;
      timeline.metadata = { ...timeline.metadata, ...metadata };
      timeline.updatedAt = new Date().toISOString();

      // Sauvegarder la timeline mise à jour
      await this.saveTimeline(timeline);

      // Émettre l'événement de génération terminée
      this.emit('timeline_generation_completed', { timeline, events: processedEvents });

      console.log('📅 Génération timeline terminée:', processedEvents.length, 'événements');

    } catch (error) {
      console.error('❌ Erreur traitement génération timeline:', error);
      
      // Marquer comme échoué
      timeline.status = 'draft';
      timeline.updatedAt = new Date().toISOString();
      await this.saveTimeline(timeline);
      
      // Émettre l'événement d'erreur
      this.emit('timeline_generation_failed', { timeline, error });
    }
  }

  /**
   * Extrait les événements du contenu
   */
  private async extractEvents(content: string, settings: TimelineSettings): Promise<TimelineEvent[]> {
    try {
      // Simuler l'extraction d'événements avec l'IA
      // Dans un vrai projet, utiliser une librairie NLP ou l'API OpenAI
      
      const events: TimelineEvent[] = [];
      
      // Événements basés sur le contenu
      const baseEvents = [
        {
          id: "event-1",
          title: "Début du projet",
          description: "Lancement officiel du projet avec définition des objectifs initiaux et constitution de l'équipe fondatrice",
          date: "2023-01-15",
          time: "09:00",
          location: "Paris, France",
          participants: ["Équipe fondatrice", "Direction"],
          category: "Projet",
          type: "milestone" as EventType,
          importance: "high" as const,
          status: "completed" as const,
          sources: [],
          media: [],
          tags: ["lancement", "projet", "équipe"],
          keywords: ["début", "lancement", "fondation"],
          relatedEvents: [],
          metadata: {
            extractionMethod: 'ai' as const,
            confidence: 0.95,
            relevance: 0.9,
            accuracy: 0.9,
            completeness: 0.85,
            processingTime: 1500,
            model: 'gpt-4',
            temperature: 0.3,
            tokensUsed: 150,
            language: 'fr',
            sentiment: 'positive' as const,
            complexity: 'medium' as const,
            readability: 0.7,
            wordCount: 25,
            characterCount: 150,
            sentenceCount: 3,
            paragraphCount: 2,
            dateExtraction: {
              originalText: "15 janvier 2023 à 9h00",
              extractedDate: "2023-01-15",
              dateFormat: "DD/MM/YYYY",
              confidence: 0.95,
              method: 'regex' as const,
              timezone: 'Europe/Paris',
              isApproximate: false,
              isEstimated: false,
              hasTime: true,
              context: "Lancement du projet"
            },
            customFields: {}
          },
          position: {
            x: 0,
            y: 0,
            width: 200,
            height: 80,
            lane: 0,
            zIndex: 1,
            connections: []
          },
          style: {
            color: '#10B981',
            backgroundColor: '#10B98120',
            borderColor: '#10B981',
            borderWidth: 2,
            borderStyle: 'solid' as const,
            borderRadius: 8,
            opacity: 1,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            icon: 'rocket',
            iconSize: 20,
            iconColor: '#ffffff',
            shadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "event-2",
          title: "Phase de planification",
          description: "Définition des objectifs, planification des phases et allocation des ressources nécessaires",
          date: "2023-02-01",
          time: "14:00",
          location: "Paris, France",
          participants: ["Équipe projet", "Direction", "Stakeholders"],
          category: "Planification",
          type: "milestone" as EventType,
          importance: "medium" as const,
          status: "completed" as const,
          sources: [],
          media: [],
          tags: ["planification", "objectifs", "ressources"],
          keywords: ["planification", "objectifs", "phase"],
          relatedEvents: [],
          metadata: {
            extractionMethod: 'ai' as const,
            confidence: 0.88,
            relevance: 0.85,
            accuracy: 0.85,
            completeness: 0.8,
            processingTime: 1200,
            model: 'gpt-4',
            temperature: 0.3,
            tokensUsed: 120,
            language: 'fr',
            sentiment: 'neutral' as const,
            complexity: 'medium' as const,
            readability: 0.75,
            wordCount: 22,
            characterCount: 140,
            sentenceCount: 3,
            paragraphCount: 2,
            dateExtraction: {
              originalText: "1er février 2023 à 14h00",
              extractedDate: "2023-02-01",
              dateFormat: "DD/MM/YYYY",
              confidence: 0.88,
              method: 'regex' as const,
              timezone: 'Europe/Paris',
              isApproximate: false,
              isEstimated: false,
              hasTime: true,
              context: "Phase de planification"
            },
            customFields: {}
          },
          position: {
            x: 250,
            y: 0,
            width: 200,
            height: 80,
            lane: 0,
            zIndex: 1,
            connections: []
          },
          style: {
            color: '#3B82F6',
            backgroundColor: '#3B82F620',
            borderColor: '#3B82F6',
            borderWidth: 2,
            borderStyle: 'solid' as const,
            borderRadius: 8,
            opacity: 1,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            icon: 'calendar',
            iconSize: 20,
            iconColor: '#ffffff',
            shadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "event-3",
          title: "Développement Phase 1",
          description: "Développement des fonctionnalités principales avec équipe de 5 développeurs sur 3 mois",
          date: "2023-03-15",
          time: "10:00",
          endDate: "2023-06-15",
          duration: 90,
          location: "Paris, France",
          participants: ["Équipe développement", "Chef de projet", "Développeurs"],
          category: "Développement",
          type: "milestone" as EventType,
          importance: "high" as const,
          status: "completed" as const,
          sources: [],
          media: [],
          tags: ["développement", "phase1", "équipe"],
          keywords: ["développement", "phase", "équipe"],
          relatedEvents: [],
          metadata: {
            extractionMethod: 'ai' as const,
            confidence: 0.92,
            relevance: 0.9,
            accuracy: 0.9,
            completeness: 0.85,
            processingTime: 1800,
            model: 'gpt-4',
            temperature: 0.3,
            tokensUsed: 180,
            language: 'fr',
            sentiment: 'positive' as const,
            complexity: 'medium' as const,
            readability: 0.7,
            wordCount: 28,
            characterCount: 180,
            sentenceCount: 4,
            paragraphCount: 2,
            dateExtraction: {
              originalText: "15 mars 2023 au 15 juin 2023",
              extractedDate: "2023-03-15",
              dateFormat: "DD/MM/YYYY",
              confidence: 0.92,
              method: 'regex' as const,
              timezone: 'Europe/Paris',
              isApproximate: false,
              isEstimated: false,
              hasTime: true,
              context: "Développement Phase 1"
            },
            customFields: {}
          },
          position: {
            x: 500,
            y: 0,
            width: 250,
            height: 80,
            lane: 0,
            zIndex: 1,
            connections: []
          },
          style: {
            color: '#8B5CF6',
            backgroundColor: '#8B5CF620',
            borderColor: '#8B5CF6',
            borderWidth: 2,
            borderStyle: 'solid' as const,
            borderRadius: 8,
            opacity: 1,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            icon: 'code',
            iconSize: 20,
            iconColor: '#ffffff',
            shadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "event-4",
          title: "Réunion de revue de mi-projet",
          description: "Évaluation des progrès, ajustement des objectifs et planification de la phase 2",
          date: "2023-05-01",
          time: "15:00",
          duration: 120,
          location: "Paris, France",
          participants: ["Équipe projet", "Direction", "Stakeholders"],
          category: "Réunion",
          type: "review" as EventType,
          importance: "medium" as const,
          status: "completed" as const,
          sources: [],
          media: [],
          tags: ["réunion", "revue", "mi-projet"],
          keywords: ["réunion", "revue", "mi-projet", "évaluation"],
          relatedEvents: [],
          metadata: {
            extractionMethod: 'ai' as const,
            confidence: 0.85,
            relevance: 0.8,
            accuracy: 0.8,
            completeness: 0.75,
            processingTime: 1000,
            model: 'gpt-4',
            temperature: 0.3,
            tokensUsed: 100,
            language: 'fr',
            sentiment: 'neutral' as const,
            complexity: 'medium' as const,
            readability: 0.8,
            wordCount: 24,
            characterCount: 160,
            sentenceCount: 3,
            paragraphCount: 2,
            dateExtraction: {
              originalText: "1er mai 2023 à 15h00",
              extractedDate: "2023-05-01",
              dateFormat: "DD/MM/YYYY",
              confidence: 0.85,
              method: 'regex' as const,
              timezone: 'Europe/Paris',
              isApproximate: false,
              isEstimated: false,
              hasTime: true,
              context: "Réunion de revue"
            },
            customFields: {}
          },
          position: {
            x: 800,
            y: 0,
            width: 200,
            height: 80,
            lane: 0,
            zIndex: 1,
            connections: []
          },
          style: {
            color: '#F59E0B',
            backgroundColor: '#F59E0B20',
            borderColor: '#F59E0B',
            borderWidth: 2,
            borderStyle: 'solid' as const,
            borderRadius: 8,
            opacity: 1,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            icon: 'users',
            iconSize: 20,
            iconColor: '#ffffff',
            shadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "event-5",
          title: "Lancement officiel",
          description: "Mise en production de la version 1.0 avec cérémonie de lancement et communication marketing",
          date: "2023-07-01",
          time: "18:00",
          location: "Paris, France",
          participants: ["Équipe complète", "Direction", "Marketing", "Clients"],
          category: "Lancement",
          type: "launch" as EventType,
          importance: "critical" as const,
          status: "completed" as const,
          sources: [],
          media: [],
          tags: ["lancement", "production", "v1.0"],
          keywords: ["lancement", "production", "version", "officiel"],
          relatedEvents: [],
          metadata: {
            extractionMethod: 'ai' as const,
            confidence: 0.98,
            relevance: 0.95,
            accuracy: 0.95,
            completeness: 0.9,
            processingTime: 2000,
            model: 'gpt-4',
            temperature: 0.3,
            tokensUsed: 200,
            language: 'fr',
            sentiment: 'positive' as const,
            complexity: 'medium' as const,
            readability: 0.7,
            wordCount: 26,
            characterCount: 170,
            sentenceCount: 3,
            paragraphCount: 2,
            dateExtraction: {
              originalText: "1er juillet 2023 à 18h00",
              extractedDate: "2023-07-01",
              dateFormat: "DD/MM/YYYY",
              confidence: 0.98,
              method: 'regex' as const,
              timezone: 'Europe/Paris',
              isApproximate: false,
              isEstimated: false,
              hasTime: true,
              context: "Lancement officiel"
            },
            customFields: {}
          },
          position: {
            x: 1050,
            y: 0,
            width: 200,
            height: 80,
            lane: 0,
            zIndex: 1,
            connections: []
          },
          style: {
            color: '#EF4444',
            backgroundColor: '#EF444420',
            borderColor: '#EF4444',
            borderWidth: 3,
            borderStyle: 'solid' as const,
            borderRadius: 8,
            opacity: 1,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            icon: 'flag',
            iconSize: 20,
            iconColor: '#ffffff',
            shadow: '0 4px 8px rgba(239,68,68,0.2)'
          },
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "event-6",
          title: "Premier retour client",
          description: "Réception des premiers retours positifs des clients avec taux de satisfaction de 85%",
          date: "2023-08-15",
          time: "11:00",
          location: "Paris, France",
          participants: ["Équipe support", "Clients", "Direction"],
          category: "Feedback",
          type: "celebration" as EventType,
          importance: "medium" as const,
          status: "completed" as const,
          sources: [],
          media: [],
          tags: ["feedback", "satisfaction", "clients"],
          keywords: ["feedback", "retour", "satisfaction", "clients"],
          relatedEvents: [],
          metadata: {
            extractionMethod: 'ai' as const,
            confidence: 0.9,
            relevance: 0.85,
            accuracy: 0.85,
            completeness: 0.8,
            processingTime: 1100,
            model: 'gpt-4',
            temperature: 0.3,
            tokensUsed: 110,
            language: 'fr',
            sentiment: 'positive' as const,
            complexity: 'medium' as const,
            readability: 0.8,
            wordCount: 23,
            characterCount: 145,
            sentenceCount: 3,
            paragraphCount: 2,
            dateExtraction: {
              originalText: "15 août 2023 à 11h00",
              extractedDate: "2023-08-15",
              dateFormat: "DD/MM/YYYY",
              confidence: 0.9,
              method: 'regex' as const,
              timezone: 'Europe/Paris',
              isApproximate: false,
              isEstimated: false,
              hasTime: true,
              context: "Premier retour client"
            },
            customFields: {}
          },
          position: {
            x: 1300,
            y: 0,
            width: 200,
            height: 80,
            lane: 0,
            zIndex: 1,
            connections: []
          },
          style: {
            color: '#06B6D4',
            backgroundColor: '#06B6D420',
            borderColor: '#06B6D4',
            borderWidth: 2,
            borderStyle: 'solid' as const,
            borderRadius: 8,
            opacity: 1,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            icon: 'heart',
            iconSize: 20,
            iconColor: '#ffffff',
            shadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Ajouter des événements spécifiques selon le contenu
      if (content.toLowerCase().includes('crise') || content.toLowerCase().includes('problème')) {
        baseEvents.push({
          id: "event-7",
          title: "Crise majeure",
          description: "Problème technique critique nécessitant une intervention d'urgence et réorganisation",
          date: "2023-04-10",
          time: "22:00",
          location: "Paris, France",
          participants: ["Équipe technique", "Direction"],
          category: "Crisis",
          type: "crisis" as EventType,
          importance: "critical" as const,
          status: "completed" as const,
          sources: [],
          media: [],
          tags: ["crise", "problème", "urgence"],
          keywords: ["crise", "problème", "urgence", "technique"],
          relatedEvents: [],
          metadata: {
            extractionMethod: 'ai' as const,
            confidence: 0.88,
            relevance: 0.85,
            accuracy: 0.85,
            completeness: 0.8,
            processingTime: 1300,
            model: 'gpt-4',
            temperature: 0.3,
            tokensUsed: 130,
            language: 'fr',
            sentiment: 'positive' as const,
            complexity: 'medium' as const,
            readability: 0.7,
            wordCount: 25,
            characterCount: 160,
            sentenceCount: 3,
            paragraphCount: 2,
            dateExtraction: {
              originalText: "10 avril 2023 à 22h00",
              extractedDate: "2023-04-10",
              dateFormat: "DD/MM/YYYY",
              confidence: 0.88,
              method: 'regex' as const,
              timezone: 'Europe/Paris',
              isApproximate: false,
              isEstimated: false,
              hasTime: true,
              context: "Crise majeure"
            },
            customFields: {}
          },
          position: {
            x: 400,
            y: 100,
            width: 200,
            height: 80,
            lane: 1,
            zIndex: 1,
            connections: []
          },
          style: {
            color: '#DC2626',
            backgroundColor: '#DC262620',
            borderColor: '#DC2626',
            borderWidth: 3,
            borderStyle: 'solid' as const,
            borderRadius: 8,
            opacity: 1,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            icon: 'alert-triangle',
            iconSize: 20,
            iconColor: '#ffffff',
            shadow: '0 4px 8px rgba(220,38,38,0.2)'
          },
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Filtrer selon les paramètres
      let filteredEvents = baseEvents.filter(event => {
        if (settings.filtering?.importance) {
          const imp = settings.filtering.importance;
          if (!imp.includeLow && event.importance === 'low') return false;
          if (!imp.includeMedium && event.importance === 'medium') return false;
          if (!imp.includeHigh && event.importance === 'high') return false;
          if (!imp.includeCritical && event.importance === 'critical') return false;
        }
        
        if (settings.filtering?.status) {
          const stat = settings.filtering.status;
          if (!stat.includePlanned && event.status === 'planned') return false;
          if (!stat.includeInProgress && event.status === 'in_progress') return false;
          if (!stat.includeCompleted && event.status === 'completed') return false;
          if (!stat.includeCancelled && event.status === 'cancelled') return false;
          if (!stat.includePostponed && event.status === 'postponed') return false;
        }
        
        if (settings.filtering?.categories && settings.filtering.categories.length > 0) {
          if (!settings.filtering.categories.includes(event.category)) return false;
        }
        
        return true;
      });

      // Limiter le nombre d'événements
      filteredEvents = filteredEvents.slice(0, settings.maxEvents || 20);

      return filteredEvents;

    } catch (error) {
      console.error('❌ Erreur extraction événements:', error);
      throw error;
    }
  }

  /**
   * Traite et valide les événements
   */
  private async processEvents(events: TimelineEvent[], settings: TimelineSettings): Promise<TimelineEvent[]> {
    try {
      const processedEvents: TimelineEvent[] = [];

      for (const event of events) {
        // Ajouter l'ID si manquant
        if (!event.id) {
          event.id = this.generateId();
        }
        
        // Valider l'événement
        if (this.validateEvent(event)) {
          // Ajouter les métadonnées de traitement
          event.createdAt = new Date().toISOString();
          event.updatedAt = new Date().toISOString();
          
          // Ajouter les sources simulées
          event.sources = this.generateMockSources();
          
          // Calculer la position
          event.position = this.calculateEventPosition(event, processedEvents.length, settings);
          
          // Ajouter les connexions
          event.position.connections = this.calculateEventConnections(event, processedEvents);
          
          processedEvents.push(event);
        }
      }

      return processedEvents;

    } catch (error) {
      console.error('❌ Erreur traitement événements:', error);
      throw error;
    }
  }

  /**
   * Valide un événement
   */
  private validateEvent(event: TimelineEvent): boolean {
    return (
      event.title.trim().length > 3 &&
      event.description.trim().length > 10 &&
      !!event.date &&
      !!event.type &&
      !!event.importance &&
      !!event.status &&
      event.metadata.confidence >= 0.5 &&
      event.metadata.relevance >= 0.5
    );
  }

  /**
   * Génère des sources simulées
   */
  private generateMockSources(): EventSource[] {
    return [
      {
        id: this.generateId(),
        type: 'document',
        title: 'Document principal',
        content: 'Extrait de document...',
        relevance: 0.9,
        confidence: 0.85,
        snippet: 'Extrait de document...',
        metadata: {}
      }
    ];
  }

  /**
   * Calcule la position d'un événement
   */
  private calculateEventPosition(event: TimelineEvent, index: number, settings: TimelineSettings): EventPosition {
    const layout = settings.visualization.layout || 'horizontal';
    
    if (layout === 'horizontal') {
      return {
        x: index * 250,
        y: 0,
        width: 200,
        height: 80,
        lane: 0,
        zIndex: 1,
        connections: []
      };
    } else if (layout === 'vertical') {
      return {
        x: 0,
        y: index * 100,
        width: 200,
        height: 80,
        lane: 0,
        zIndex: 1,
        connections: []
      };
    } else {
      // Layout par défaut
      return {
        x: index * 250,
        y: 0,
        width: 200,
        height: 80,
        lane: 0,
        zIndex: 1,
        connections: []
      };
    }
  }

  /**
   * Calcule les connexions entre événements
   */
  private calculateEventConnections(event: TimelineEvent, existingEvents: TimelineEvent[]): EventConnection[] {
    const connections: EventConnection[] = [];
    
    // Connexions causales simples
    const relevantEvents = existingEvents.filter(e => 
      Math.abs(new Date(e.date).getTime() - new Date(event.date).getTime()) < 90 * 24 * 60 * 60 * 1000 // 90 jours
    );
    
    for (const relatedEvent of relevantEvents) {
      if (relatedEvent.type === 'milestone' && event.type === 'milestone') {
        connections.push({
          fromEventId: relatedEvent.id,
          toEventId: event.id,
          type: 'temporal',
          style: {
            color: '#6B7280',
            width: 2,
            style: 'solid',
            arrowType: 'arrow',
            opacity: 0.6
          },
          metadata: {}
        });
      }
    }
    
    return connections;
  }

  /**
   * Calcule les métadonnées de la timeline
   */
  private calculateTimelineMetadata(events: TimelineEvent[], content: string): TimelineMetadata {
    const dates = events.map(e => new Date(e.date)).sort((a, b) => a.getTime() - b.getTime());
    const earliest = dates[0]?.toISOString() || '';
    const latest = dates[dates.length - 1]?.toISOString() || '';
    const span = dates.length > 1 ? Math.ceil((dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    const categories: Record<string, number> = {};
    const types: Record<string, number> = {};
    const importance: Record<string, number> = {};
    const status: Record<string, number> = {};
    const locations: Record<string, number> = {};
    const participants: Record<string, number> = {};
    
    for (const event of events) {
      categories[event.category] = (categories[event.category] || 0) + 1;
      types[event.type] = (types[event.type] || 0) + 1;
      importance[event.importance] = (importance[event.importance] || 0) + 1;
      status[event.status] = (status[event.status] || 0) + 1;
      
      if (event.location) {
        locations[event.location] = (locations[event.location] || 0) + 1;
      }
      
      if (event.participants) {
        for (const participant of event.participants) {
          participants[participant] = (participants[participant] || 0) + 1;
        }
      }
    }
    
    return {
      totalEvents: events.length,
      dateRange: { earliest, latest, span },
      categories,
      types,
      importance,
      status,
      locations,
      participants,
      quality: {
        averageConfidence: events.reduce((sum, e) => sum + e.metadata.confidence, 0) / events.length,
        averageRelevance: events.reduce((sum, e) => sum + e.metadata.relevance, 0) / events.length,
        averageAccuracy: events.reduce((sum, e) => sum + e.metadata.accuracy, 0) / events.length,
        averageCompleteness: events.reduce((sum, e) => sum + e.metadata.completeness, 0) / events.length,
        totalExtractionTime: events.reduce((sum, e) => sum + e.metadata.processingTime, 0),
        errorRate: 0,
        duplicateRate: 0,
        missingDataRate: 0
      },
      extraction: {
        method: { ai: events.length },
        model: { [events[0]?.metadata.model || 'gpt-4']: events.length },
        averageProcessingTime: events.reduce((sum, e) => sum + e.metadata.processingTime, 0) / events.length,
        totalTokensUsed: events.reduce((sum, e) => sum + e.metadata.tokensUsed, 0),
        averageTokensPerEvent: events.reduce((sum, e) => sum + e.metadata.tokensUsed, 0) / events.length,
        dateExtractionAccuracy: events.reduce((sum, e) => sum + e.metadata.dateExtraction.confidence, 0) / events.length,
        locationExtractionAccuracy: 0.8, // Simulé
        participantExtractionAccuracy: 0.7 // Simulé
      },
      version: 1,
      lastUpdated: new Date().toISOString(),
      customFields: {}
    };
  }

  /**
   * Extrait le contenu du document
   */
  private async extractDocumentContent(document: any): Promise<string> {
    try {
      // Simuler l'extraction de contenu
      // Dans un vrai projet, utiliser une librairie comme pdf-parse ou un service OCR
      
      let content = '';
      
      if (document.type === 'pdf') {
        // Simuler l'extraction de texte PDF
        content = `
          Projet de Développement d'Application Web
          
          Historique du Projet
          
          Janvier 2023: Lancement du projet
          L'équipe fondatrice se réunit pour définir les objectifs principaux de l'application. 
          Le projet vise à créer une plateforme web moderne pour la gestion de documents.
          
          Février 2023: Phase de planification
          Définition des objectifs spécifiques et planification des phases de développement.
          Allocation des ressources et constitution de l'équipe technique.
          
          Mars 2023 - Juin 2023: Développement Phase 1
          Développement des fonctionnalités principales de l'application.
          Équipe de 5 développeurs travaillant sur différentes parties du projet.
          Utilisation de technologies modernes et meilleures pratiques.
          
          Avril 2023: Crise technique
          Problème majeur avec l'architecture de base nécessitant une refonte complète.
          L'équipe travaille jour et nuit pour résoudre la situation.
          Le problème est résolu en 3 jours avec une nouvelle approche.
          
          Mai 2023: Revue de mi-projet
          Évaluation des progrès réalisés et ajustement des objectifs.
          Planification de la phase 2 avec nouvelles priorités.
          Réunion avec les stakeholders pour valider la direction.
          
          Juillet 2023: Lancement officiel
          Mise en production de la version 1.0 de l'application.
          Cérémonie de lancement avec toute l'équipe et les partenaires.
          Communication marketing et annonce publique du projet.
          
          Août 2023: Premiers retours
          Réception des premiers retours des utilisateurs avec satisfaction élevée.
          Taux de satisfaction de 85% pour la première version.
          Planification des améliorations pour la version 2.0.
          
          Le projet continue d'évoluer avec de nouvelles fonctionnalités et améliorations régulières.
          L'équipe reste engagée à fournir la meilleure expérience utilisateur possible.
        `;
      } else if (document.type === 'docx') {
        // Simuler l'extraction de texte Word
        content = `
          Rapport de Projet - Timeline Chronologique
          
          Table des matières
          
          1. Introduction
          2. Événements clés
          3. Analyse chronologique
          4. Recommandations
          
          Ce document présente la timeline chronologique du projet avec tous les événements importants.
        `;
      } else {
        // Contenu par défaut
        content = `Contenu du document ${document.title}`;
      }

      return content;

    } catch (error) {
      console.error('❌ Erreur extraction contenu document:', error);
      throw error;
    }
  }

  /**
   * Obtient une timeline
   */
  async getTimeline(timelineId: string, userId?: string): Promise<Timeline | null> {
    try {
      const { data, error } = await supabase
        .from('timelines')
        .select('*')
        .eq('id', timelineId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Vérifier les permissions
      if (userId && data.user_id !== userId && data.status !== 'published') {
        return null;
      }

      return data as Timeline;

    } catch (error) {
      console.error('❌ Erreur récupération timeline:', error);
      throw error;
    }
  }

  /**
   * Obtient les timelines d'un utilisateur
   */
  async getUserTimelines(
    userId: string,
    options: {
      type?: TimelineType;
      status?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'created_at' | 'updated_at' | 'title' | 'date';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<Timeline[]> {
    try {
      let query = supabase
        .from('timelines')
        .select('*')
        .eq('user_id', userId);

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      const sortBy = options.sortBy || 'created_at';
      const sortOrder = options.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, (options.offset || 0) + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as Timeline[];

    } catch (error) {
      console.error('❌ Erreur récupération timelines utilisateur:', error);
      throw error;
    }
  }

  /**
   * Recherche dans les timelines
   */
  async searchTimelines(
    userId: string,
    query: string,
    options: {
      type?: TimelineType;
      category?: string;
      tags?: string[];
      limit?: number;
    } = {}
  ): Promise<TimelineEvent[]> {
    try {
      // Simuler la recherche
      const userTimelines = await this.getUserTimelines(userId, { status: 'published' });
      
      const results: TimelineEvent[] = [];
      
      for (const timeline of userTimelines) {
        for (const event of timeline.events) {
          // Recherche simple dans le titre et la description
          if (event.title.toLowerCase().includes(query.toLowerCase()) ||
              event.description.toLowerCase().includes(query.toLowerCase()) ||
              event.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
            
            // Filtrer selon les options
            if (options.type && timeline.type !== options.type) continue;
            if (options.category && event.category !== options.category) continue;
            if (options.tags && !options.tags.some(tag => event.tags.includes(tag))) continue;
            
            results.push(event);
          }
        }
      }

      // Limiter les résultats
      if (options.limit) {
        return results.slice(0, options.limit);
      }

      return results;

    } catch (error) {
      console.error('❌ Erreur recherche timelines:', error);
      throw error;
    }
  }

  /**
   * Ajoute une interaction à un événement
   */
  async addEventInteraction(
    eventId: string,
    userId: string,
    interaction: {
      type: 'view' | 'click' | 'share' | 'comment' | 'like' | 'bookmark' | 'edit';
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const timeline = await this.getTimelineByEventId(eventId);
      if (!timeline) {
        throw new Error('Événement non trouvé');
      }

      const event = timeline.events.find(e => e.id === eventId);
      if (!event) {
        throw new Error('Événement non trouvé');
      }

      // Ajouter l'interaction
      const interactionEntry: EventInteraction = {
        id: this.generateId(),
        userId,
        type: interaction.type,
        timestamp: new Date().toISOString(),
        metadata: interaction.metadata || {}
      };

      event.interactions.push(interactionEntry);

      // Mettre à jour les analytics
      timeline.analytics.totalViews++;
      
      if (interaction.type === 'view') {
        const viewedEvent = timeline.analytics.mostViewedEvents.find(e => e.eventId === eventId);
        if (viewedEvent) {
          viewedEvent.viewCount++;
        } else {
          timeline.analytics.mostViewedEvents.push({
            eventId,
            viewCount: 1,
            averageTime: 0,
            interactionCount: 1
          });
        }
      }

      event.updatedAt = new Date().toISOString();
      timeline.updatedAt = new Date().toISOString();

      // Sauvegarder la timeline
      await this.saveTimeline(timeline);

      console.log('📅 Interaction ajoutée à l\'événement:', eventId);

    } catch (error) {
      console.error('❌ Erreur ajout interaction:', error);
      throw error;
    }
  }

  /**
   * Exporte une timeline
   */
  async exportTimeline(
    timelineId: string,
    userId: string,
    format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'html' | 'svg' | 'png',
    options: ExportSettings = {
      format: 'json',
      quality: 'high',
      includeMetadata: true,
      includeMedia: true,
      includeInteractions: true
    }
  ): Promise<TimelineExport> {
    try {
      const timeline = await this.getTimeline(timelineId, userId);
      if (!timeline) {
        throw new Error('Timeline non trouvée');
      }

      const exportData: TimelineExport = {
        id: this.generateId(),
        timelineId,
        format,
        options,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Traiter l'export
      const exportedContent = await this.processExport(timeline, format, options);
      
      // Sauvegarder le fichier exporté
      const fileUrl = await this.saveExportFile(exportData.id, exportedContent, format);
      
      exportData.status = 'completed';
      exportData.fileUrl = fileUrl;
      exportData.fileSize = exportedContent.length;
      exportData.completedAt = new Date().toISOString();

      console.log('📅 Export timeline terminé:', exportData.id);
      return exportData;

    } catch (error) {
      console.error('❌ Erreur export timeline:', error);
      throw error;
    }
  }

  /**
   * Traite l'export
   */
  private async processExport(timeline: Timeline, format: string, options: ExportSettings): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(timeline, null, 2);
      case 'csv':
        return this.convertToCSV(timeline);
      case 'html':
        return this.convertToHTML(timeline);
      case 'svg':
        return this.convertToSVG(timeline);
      case 'png':
        return 'PNG content'; // Simuler
      case 'pdf':
        return 'PDF content'; // Simuler
      case 'xlsx':
        return 'XLSX content'; // Simuler
      default:
        throw new Error(`Format non supporté: ${format}`);
    }
  }

  /**
   * Convertit en CSV
   */
  private convertToCSV(timeline: Timeline): string {
    const headers = [
      'Date',
      'Titre',
      'Description',
      'Catégorie',
      'Type',
      'Importance',
      'Statut',
      'Lieu',
      'Participants',
      'Tags',
      'Vues',
      'Interactions'
    ];

    const rows = [headers.join(',')];

    for (const event of timeline.events) {
      const row = [
        event.date,
        `"${event.title.replace(/"/g, '""')}"`,
        `"${event.description.replace(/"/g, '""')}"`,
        event.category,
        event.type,
        event.importance,
        event.status,
        event.location || '',
        `"${(event.participants || []).join(', ')}"`,
        `"${event.tags.join(', ')}"`,
        event.interactions.length,
        event.interactions.length
      ];
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  /**
   * Convertit en HTML
   */
  private convertToHTML(timeline: Timeline): string {
    let html = '<html><head>';
    html += `<title>${timeline.title}</title>`;
    html += '<meta charset="utf-8">';
    html += '<style>';
    html += `
      body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
      h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
      .timeline { position: relative; padding: 20px 0; }
      .event { margin-bottom: 30px; padding: 20px; border-left: 4px solid #3B82F6; background: #f8f9fa; border-radius: 8px; }
      .event-date { font-weight: bold; color: #3B82F6; margin-bottom: 10px; }
      .event-title { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; }
      .event-description { margin-bottom: 15px; line-height: 1.6; }
      .event-meta { font-size: 0.9em; color: #666; margin-top: 10px; }
      .event-meta span { margin-right: 15px; }
    `;
    html += '</style></head><body>';

    html += `<h1>${timeline.title}</h1>`;
    
    if (timeline.description) {
      html += `<p>${timeline.description}</p>`;
    }

    html += '<div class="timeline">';

    for (const event of timeline.events) {
      html += '<div class="event">';
      html += `<div class="event-date">${new Date(event.date).toLocaleDateString('fr-FR')} ${event.time || ''}</div>`;
      html += `<div class="event-title">${event.title}</div>`;
      html += `<div class="event-description">${event.description}</div>`;
      
      html += '<div class="event-meta">';
      html += `<span>Catégorie: ${event.category}</span>`;
      html += `<span>Type: ${event.type}</span>`;
      html += `<span>Importance: ${event.importance}</span>`;
      html += `<span>Statut: ${event.status}</span>`;
      
      if (event.location) {
        html += `<span>Lieu: ${event.location}</span>`;
      }
      
      if (event.participants && event.participants.length > 0) {
        html += `<span>Participants: ${event.participants.join(', ')}</span>`;
      }
      
      if (event.tags && event.tags.length > 0) {
        html += `<span>Tags: ${event.tags.join(', ')}</span>`;
      }
      
      html += '</div>';
      html += '</div>';
    }

    html += '</div></body></html>';
    return html;
  }

  /**
   * Convertit en SVG
   */
  private convertToSVG(timeline: Timeline): string {
    const width = 1400;
    const height = 400;
    const eventWidth = 200;
    const eventHeight = 80;
    const eventSpacing = 50;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Fond
    svg += `<rect width="${width}" height="${height}" fill="#f8f9fa"/>`;
    
    // Titre
    svg += `<text x="${width/2}" y="30" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="#333">${timeline.title}</text>`;
    
    // Événements
    for (let i = 0; i < timeline.events.length; i++) {
      const event = timeline.events[i];
      const x = 50 + i * (eventWidth + eventSpacing);
      const y = height / 2 - eventHeight / 2;
      
      // Rectangle de l'événement
      svg += `<rect x="${x}" y="${y}" width="${eventWidth}" height="${eventHeight}" fill="${event.style.backgroundColor}" stroke="${event.style.borderColor}" stroke-width="${event.style.borderWidth}" rx="${event.style.borderRadius}"/>`;
      
      // Titre
      svg += `<text x="${x + eventWidth/2}" y="${y + 25}" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="${event.style.color}">${event.title}</text>`;
      
      // Date
      svg += `<text x="${x + eventWidth/2}" y="${y + 45}" text-anchor="middle" font-family="Arial" font-size="10" fill="#666">${new Date(event.date).toLocaleDateString('fr-FR')}</text>`;
      
      // Connexions
      for (const connection of event.position.connections) {
        const fromEvent = timeline.events.find(e => e.id === connection.fromEventId);
        if (fromEvent) {
          const fromIndex = timeline.events.indexOf(fromEvent);
          const fromX = 50 + fromIndex * (eventWidth + eventSpacing) + eventWidth;
          const fromY = height / 2;
          
          svg += `<line x1="${fromX}" y1="${fromY}" x2="${x}" y2="${y}" stroke="${connection.style.color}" stroke-width="${connection.style.width}" stroke-dasharray="${connection.style.style === 'dashed' ? '5,5' : ''}"/>`;
        }
      }
    }
    
    svg += '</svg>';
    return svg;
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
      const fileName = `timeline-exports/${exportId}.${format}`;
      
      const { error } = await supabase.storage
        .from('timeline-exports')
        .upload(fileName, new Blob([content]));

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('timeline-exports')
        .getPublicUrl(fileName);

      return publicUrl;

    } catch (error) {
      console.error('❌ Erreur sauvegarde fichier export:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques des timelines
   */
  async getStats(userId?: string): Promise<TimelineStats> {
    try {
      const { data, error } = await supabase.rpc('get_timeline_stats', {
        p_user_id: userId
      });

      if (error) throw error;

      const stats = data || {
        total_timelines: 0,
        published_timelines: 0,
        draft_timelines: 0,
        total_events: 0,
        average_events_per_timeline: 0,
        most_active_types: {},
        most_active_categories: {},
        top_performing_timelines: [],
        user_engagement: {
          total_users: 0,
          active_users: 0,
          average_timelines_per_user: 0,
          average_events_per_user: 0,
          average_session_duration: 0,
          satisfaction_score: 0
        },
        content_quality: {
          average_confidence: 0,
          average_relevance: 0,
          average_accuracy: 0,
          average_completeness: 0,
          extraction_success_rate: 0
        },
        trends: {
          timeline_growth: Array(12).fill(0),
          event_growth: Array(12).fill(0),
          type_trends: {},
          category_trends: {}
        }
      };

      return {
        totalTimelines: stats.total_timelines,
        publishedTimelines: stats.published_timelines,
        draftTimelines: stats.draft_timelines,
        totalEvents: stats.total_events,
        averageEventsPerTimeline: stats.average_events_per_timeline,
        mostActiveTypes: stats.most_active_types,
        mostActiveCategories: stats.most_active_categories,
        topPerformingTimelines: stats.top_performing_timelines,
        userEngagement: stats.user_engagement,
        contentQuality: stats.content_quality,
        trends: stats.trends
      };

    } catch (error) {
      console.error('❌ Erreur statistiques timelines:', error);
      throw error;
    }
  }

  // Méthodes privées

  private async getDocument(documentId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('❌ Erreur récupération document:', error);
      throw error;
    }
  }

  private async getTimelineByEventId(eventId: string): Promise<Timeline | null> {
    try {
      const { data, error } = await supabase
        .from('timelines')
        .select('*')
        .like('events', eventId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return data as Timeline;

    } catch (error) {
      console.error('❌ Erreur récupération timeline par event ID:', error);
      return null;
    }
  }

  private mergeDefaultSettings(settings: Partial<TimelineSettings>): TimelineSettings {
    return {
      maxEvents: settings.maxEvents || 20,
      dateRange: settings.dateRange || {
        isDynamic: false,
        period: 'year'
      },
      categories: settings.categories || [],
      importance: settings.importance || {
        includeLow: true,
        includeMedium: true,
        includeHigh: true,
        includeCritical: true
      },
      status: settings.status || {
        includePlanned: true,
        includeInProgress: true,
        includeCompleted: true,
        includeCancelled: false,
        includePostponed: false
      },
      sortBy: settings.sortBy || {
        field: 'date',
        direction: 'asc'
      },
      sortOrder: settings.sortOrder || 'asc',
      grouping: settings.grouping || {
        enabled: false,
        field: 'year',
        sortOrder: 'asc'
      },
      filtering: settings.filtering || {
        searchQuery: '',
        tags: [],
        keywords: [],
        participants: [],
        locations: [],
        customFilters: {}
      },
      visualization: settings.visualization || {
        layout: 'horizontal',
        theme: 'auto',
        colors: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#10B981',
          background: '#ffffff',
          text: '#1F2937',
          border: '#E5E7EB',
          categories: {},
          importance: {},
          status: {}
        },
        fonts: {
          family: 'Arial',
          size: 14,
          weight: 'normal',
          lineHeight: 1.5,
          letterSpacing: 0
        },
        animations: {
          enabled: true,
          duration: 300,
          easing: 'ease-in-out',
          stagger: 100,
          autoplay: false,
          triggers: []
        },
        interactions: {
          hover: true,
          click: true,
          drag: false,
          zoom: true,
          pan: false,
          select: true,
          keyboard: true,
          touch: true
        },
        responsive: {
          breakpoints: {
            mobile: 768,
          tablet: 1024,
          desktop: 1200
          },
          adaptiveLayout: true,
          adaptiveColors: true,
          adaptiveFonts: true,
          touchOptimized: true
        }
      },
      export: settings.export || {
        format: 'json',
        quality: 'medium',
        includeMetadata: true,
        includeMedia: false,
        includeInteractions: false
      },
      personalization: settings.personalization || {
        userLevel: 'intermediate',
        interests: [],
        preferredCategories: [],
        language: 'fr',
        timezone: 'Europe/Paris',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        customPreferences: {}
      }
    };
  }

  private validateTimelineSettings(settings: Partial<TimelineSettings>): void {
    if (settings.maxEvents && (settings.maxEvents < 1 || settings.maxEvents > 100)) {
      throw new Error('Le nombre d\'événements doit être entre 1 et 100');
    }
  }

  private generateId(): string {
    return `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Charge les templates par défaut
   */
  private async loadDefaultTemplates(): Promise<void> {
    // Simuler le chargement des templates par défaut
    console.log('📅 Chargement des templates de timeline...');
  }

  /**
   * Démarre le monitoring
   */
  private startMonitoring(): void {
    // Monitorer les timelines en traitement
    this.monitoringTimers.push(setInterval(() => {
      this.checkProcessingTimelines();
    }, 60000)); // Toutes les minutes

    // Monitorer les statistiques
    this.monitoringTimers.push(setInterval(() => {
      this.updateStats();
    }, 300000)); // Toutes les 5 minutes
  }

  /**
   * Vérifie les timelines en traitement
   */
  private checkProcessingTimelines(): void {
    // Simuler la vérification des timelines en traitement
    console.log('📅 Vérification des timelines en traitement...');
  }

  /**
   * Met à jour les statistiques
   */
  private updateStats(): void {
    // Simuler la mise à jour des statistiques
    console.log('📅 Mise à jour des statistiques de timeline...');
  }

  /**
   * Sauvegarde une timeline
   */
  private async saveTimeline(timeline: Timeline): Promise<void> {
    try {
      const { error } = await supabase
        .from('timelines')
        .upsert({
          id: timeline.id,
          document_id: timeline.documentId,
          user_id: timeline.userId,
          title: timeline.title,
          description: timeline.description,
          type: timeline.type,
          events: timeline.events,
          settings: timeline.settings,
          metadata: timeline.metadata,
          analytics: timeline.analytics,
          created_at: timeline.createdAt,
          updated_at: timeline.updatedAt,
          published_at: timeline.publishedAt
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde timeline:', error);
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
        console.error('❌ Erreur callback événement timeline:', error);
      }
    }
  }

  /**
   * Détruit le service de timeline
   */
  destroy(): void {
    this.monitoringTimers.forEach(t => clearInterval(t));
    this.monitoringTimers = [];

    // Vider les caches
    this.timelines.clear();
    this.templates.clear();
    this.eventCallbacks.clear();
    
    console.log('📅 Service de timeline détruit');
  }
}

// Instance singleton
export const timelineService = new TimelineService();

// Export des fonctions utilitaires
export const generateTimeline = (
  documentId: string,
  userId: string,
  settings?: Partial<TimelineSettings>,
  options?: {
    title?: string;
    description?: string;
    type?: TimelineType;
    categories?: string[];
  }
) => timelineService.generateTimeline(documentId, userId, settings, options);

export const getTimeline = (timelineId: string, userId?: string) => 
  timelineService.getTimeline(timelineId, userId);

export const getUserTimelines = (
  userId: string,
  options?: {
    type?: TimelineType;
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'updated_at' | 'title' | 'date';
    sortOrder?: 'asc' | 'desc';
  }
) => timelineService.getUserTimelines(userId, options);

export const searchTimelines = (
  userId: string,
  query: string,
  options?: {
    type?: TimelineType;
    category?: string;
    tags?: string[];
    limit?: number;
  }
) => timelineService.searchTimelines(userId, query, options);

export const addTimelineEventInteraction = (
  eventId: string,
  userId: string,
  interaction: {
    type: 'view' | 'click' | 'share' | 'comment' | 'like' | 'bookmark' | 'edit';
    metadata?: Record<string, any>;
  }
) => timelineService.addEventInteraction(eventId, userId, interaction);

export const exportTimeline = (
  timelineId: string,
  userId: string,
  format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'html' | 'svg' | 'png',
  options?: ExportSettings
) => timelineService.exportTimeline(timelineId, userId, format, options);

export const getTimelineStats = (userId?: string) => timelineService.getStats(userId);
