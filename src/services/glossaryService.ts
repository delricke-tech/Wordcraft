/**
 * Service de glossaire automatique (termes clés)
 * 
 * Ce service extrait automatiquement les termes clés des documents
 * et crée des glossaires interactifs avec définitions, contextes et relations
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface Glossary {
  id: string;
  documentId: string;
  userId: string;
  title: string;
  description?: string;
  language: string;
  type: GlossaryType;
  terms: GlossaryTerm[];
  settings: GlossarySettings;
  metadata: GlossaryMetadata;
  analytics: GlossaryAnalytics;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export type GlossaryType = 
  | 'technical'
  | 'business'
  | 'academic'
  | 'legal'
  | 'medical'
  | 'scientific'
  | 'general'
  | 'domain_specific'
  | 'multilingual'
  | 'custom';

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  context: string;
  synonyms: string[];
  antonyms: string[];
  relatedTerms: string[];
  translations: Translation[];
  examples: Example[];
  etymology?: string;
  pronunciation?: string;
  partOfSpeech: PartOfSpeech;
  difficulty: DifficultyLevel;
  frequency: FrequencyLevel;
  category: string;
  subcategory?: string;
  tags: string[];
  keywords: string[];
  sources: TermSource[];
  media: TermMedia[];
  metadata: TermMetadata;
  style: TermStyle;
  interactions: TermInteraction[];
  createdAt: string;
  updatedAt: string;
}

export type PartOfSpeech = 
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'interjection'
  | 'article'
  | 'numeral'
  | 'abbreviation'
  | 'acronym'
  | 'unknown';

export type DifficultyLevel = 
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert';

export type FrequencyLevel = 
  | 'rare'
  | 'uncommon'
  | 'common'
  | 'frequent'
  | 'very_frequent';

export interface Translation {
  language: string;
  term: string;
  definition: string;
  pronunciation?: string;
  confidence: number;
  source?: string;
}

export interface Example {
  id: string;
  text: string;
  translation?: string;
  context: string;
  source: string;
  difficulty: DifficultyLevel;
  highlighted: string;
}

export interface TermSource {
  id: string;
  type: 'document' | 'page' | 'section' | 'paragraph' | 'sentence' | 'annotation' | 'url';
  title: string;
  content: string;
  url?: string;
  pageNumber?: number;
  position?: SourcePosition;
  relevance: number;
  confidence: number;
  snippet: string;
  occurrences: number;
  metadata: Record<string, any>;
}

export interface SourcePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  startIndex: number;
  endIndex: number;
}

export interface TermMedia {
  id: string;
  type: 'image' | 'video' | 'audio' | 'diagram' | 'chart' | 'animation' | 'infographic';
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  size?: number;
  format?: string;
  metadata: Record<string, any>;
}

export interface TermMetadata {
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
  semanticContext: SemanticContext;
  linguisticFeatures: LinguisticFeatures;
  domainSpecificity: number;
  customFields: Record<string, any>;
}

export interface SemanticContext {
  topic: string;
  domain: string;
  field: string;
  contextWords: string[];
  relatedConcepts: string[];
  semanticField: string;
  conceptualDensity: number;
}

export interface LinguisticFeatures {
  morphological: {
    prefix?: string;
    suffix?: string;
    root: string;
    inflection: string;
    derivation: string;
  };
  syntactic: {
    phraseStructure: string;
    dependencyRelations: string[];
    grammaticalFunction: string;
  };
  semantic: {
    semanticCategory: string;
    semanticRelations: string[];
    conceptualRelations: string[];
  };
  pragmatic: {
    usageContext: string;
    register: string;
    formality: string;
    politeness: string;
  };
}

export interface TermStyle {
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

export interface TermInteraction {
  id: string;
  userId: string;
  type: 'view' | 'click' | 'share' | 'comment' | 'like' | 'bookmark' | 'edit' | 'translate' | 'pronounce';
  timestamp: string;
  metadata: Record<string, any>;
}

export interface GlossarySettings {
  maxTerms: number;
  language: string;
  targetLanguages: string[];
  categories: string[];
  difficulty: DifficultyLevel[];
  frequency: FrequencyLevel[];
  includeSynonyms: boolean;
  includeAntonyms: boolean;
  includeTranslations: boolean;
  includeExamples: boolean;
  includeEtymology: boolean;
  includePronunciation: boolean;
  minFrequency: FrequencyLevel;
  maxFrequency: FrequencyLevel;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  grouping: GroupingOption;
  filtering: FilteringOption;
  visualization: VisualizationSettings;
  export: ExportSettings;
  personalization: PersonalizationSettings;
}

export interface SortOption {
  field: 'term' | 'frequency' | 'difficulty' | 'length' | 'category' | 'relevance';
  direction: 'asc' | 'desc';
}

export interface GroupingOption {
  enabled: boolean;
  field: 'category' | 'subcategory' | 'partOfSpeech' | 'difficulty' | 'frequency' | 'domain';
  sortOrder: 'asc' | 'desc';
  maxGroups: number;
}

export interface FilteringOption {
  searchQuery?: string;
  tags?: string[];
  keywords?: string[];
  categories?: string[];
  difficulties?: DifficultyLevel[];
  frequencies?: FrequencyLevel[];
  partOfSpeech?: PartOfSpeech[];
  dateRange?: {
    start: string;
    end: string;
  };
  customFilters?: Record<string, any>;
}

export interface VisualizationSettings {
  layout: 'list' | 'grid' | 'cards' | 'mindmap' | 'network' | 'tree';
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
  difficulties: Record<string, string>;
  frequencies: Record<string, string>;
  partsOfSpeech: Record<string, string>;
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
  format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'html' | 'xml' | 'txt';
  quality: 'low' | 'medium' | 'high';
  includeMetadata: boolean;
  includeMedia: boolean;
  includeInteractions: boolean;
  includeTranslations: boolean;
  includeExamples: boolean;
  language?: string;
  customOptions?: Record<string, any>;
}

export interface PersonalizationSettings {
  userLevel: DifficultyLevel;
  interests: string[];
  preferredCategories: string[];
  nativeLanguage: string;
  learningGoals: string[];
  studyStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  customPreferences: Record<string, any>;
}

export interface GlossaryMetadata {
  totalTerms: number;
  uniqueTerms: number;
  averageTermLength: number;
  averageDefinitionLength: number;
  categories: Record<string, number>;
  partsOfSpeech: Record<string, number>;
  difficulties: Record<string, number>;
  frequencies: Record<string, number>;
  languages: Record<string, number>;
  quality: QualityMetrics;
  extraction: ExtractionMetrics;
  linguisticAnalysis: LinguisticAnalysis;
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
  missingDefinitionRate: number;
  contextQuality: number;
}

export interface ExtractionMetrics {
  method: Record<string, number>;
  model: Record<string, number>;
  averageProcessingTime: number;
  totalTokensUsed: number;
  averageTokensPerTerm: number;
  termExtractionAccuracy: number;
  definitionExtractionAccuracy: number;
  contextExtractionAccuracy: number;
  relationExtractionAccuracy: number;
}

export interface LinguisticAnalysis {
  morphologicalComplexity: number;
  syntacticComplexity: number;
  semanticComplexity: number;
  lexicalDiversity: number;
  conceptualDensity: number;
  domainSpecificity: number;
  registerDistribution: Record<string, number>;
  formalityDistribution: Record<string, number>;
  semanticFieldAnalysis: Record<string, number>;
}

export interface GlossaryAnalytics {
  totalViews: number;
  uniqueViews: number;
  averageSessionDuration: number;
  mostViewedTerms: Array<{
    termId: string;
    term: string;
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
    translationRate: number;
    pronunciationRate: number;
  };
  learningPatterns: {
    hourlyViews: number[];
    dailyViews: number[];
    weeklyViews: number[];
    monthlyViews: number[];
    peakTimes: Array<{
      hour: number;
      views: number;
    }>;
    difficultyProgression: Array<{
      difficulty: string;
      viewCount: number;
      averageTime: number;
      successRate: number;
    }>;
  };
  contentPerformance: {
    topCategories: Array<{
      category: string;
      termCount: number;
      averageViews: number;
      averageRating: number;
    }>;
    topPartsOfSpeech: Array<{
      partOfSpeech: string;
      termCount: number;
      averageViews: number;
      averageRating: number;
    }>;
    topDifficulties: Array<{
      difficulty: string;
      termCount: number;
      averageViews: number;
      averageRating: number;
    }>;
  };
  trends: {
    growthRate: number;
    seasonalPatterns: Record<string, number>;
    emergingTerms: Array<{
      term: string;
      growthRate: number;
      confidence: number;
    }>;
    learningProgress: Array<{
      date: string;
      termsLearned: number;
      averageDifficulty: number;
      timeSpent: number;
    }>;
  };
}

export interface GlossaryTemplate {
  id: string;
  name: string;
  description: string;
  type: GlossaryType;
  prompt: string;
  settings: Partial<GlossarySettings>;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GlossaryExport {
  id: string;
  glossaryId: string;
  format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'html' | 'xml' | 'txt';
  options: ExportSettings;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface GlossaryStats {
  totalGlossaries: number;
  publishedGlossaries: number;
  draftGlossaries: number;
  totalTerms: number;
  averageTermsPerGlossary: number;
  mostActiveTypes: Record<string, number>;
  mostActiveCategories: Record<string, number>;
  topPerformingGlossaries: Array<{
    glossaryId: string;
    title: string;
    viewCount: number;
    averageRating: number;
    termCount: number;
  }>;
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    averageGlossariesPerUser: number;
    averageTermsPerUser: number;
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
    glossaryGrowth: number[];
    termGrowth: number[];
    typeTrends: Record<string, number[]>;
    categoryTrends: Record<string, number[]>;
  };
}

class GlossaryService {
  private glossaries: Map<string, Glossary> = new Map();
  private templates: Map<string, GlossaryTemplate> = new Map();
  private eventCallbacks: Map<string, (event: any) => void> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialise le service de glossaire
   */
  private async initializeService(): Promise<void> {
    try {
      // Charger les templates par défaut
      await this.loadDefaultTemplates();
      
      // Démarrer le monitoring
      this.startMonitoring();
      
      this.isInitialized = true;
      console.log('📚 Service de glossaire initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation service glossaire:', error);
    }
  }

  /**
   * Génère un glossaire à partir d'un document
   */
  async generateGlossary(
    documentId: string,
    userId: string,
    settings: Partial<GlossarySettings> = {},
    options: {
      title?: string;
      description?: string;
      type?: GlossaryType;
      language?: string;
      targetLanguages?: string[];
    } = {}
  ): Promise<Glossary> {
    try {
      // Valider les paramètres
      this.validateGlossarySettings(settings);

      // Récupérer le document
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Document non trouvé');
      }

      // Fusionner les paramètres par défaut
      const glossarySettings = this.mergeDefaultSettings(settings);

      // Créer le glossaire
      const glossary: Glossary = {
        id: this.generateId(),
        documentId,
        userId,
        title: options.title || `Glossaire: ${document.title}`,
        description: options.description || `Glossaire automatique extrait du document ${document.title}`,
        language: options.language || 'fr',
        type: options.type || 'general',
        terms: [],
        settings: glossarySettings,
        metadata: {
          totalTerms: 0,
          uniqueTerms: 0,
          averageTermLength: 0,
          averageDefinitionLength: 0,
          categories: {},
          partsOfSpeech: {},
          difficulties: {},
          frequencies: {},
          languages: {},
          quality: {
            averageConfidence: 0,
            averageRelevance: 0,
            averageAccuracy: 0,
            averageCompleteness: 0,
            totalExtractionTime: 0,
            errorRate: 0,
            duplicateRate: 0,
            missingDefinitionRate: 0,
            contextQuality: 0
          },
          extraction: {
            method: {},
            model: {},
            averageProcessingTime: 0,
            totalTokensUsed: 0,
            averageTokensPerTerm: 0,
            termExtractionAccuracy: 0,
            definitionExtractionAccuracy: 0,
            contextExtractionAccuracy: 0,
            relationExtractionAccuracy: 0
          },
          linguisticAnalysis: {
            morphologicalComplexity: 0,
            syntacticComplexity: 0,
            semanticComplexity: 0,
            lexicalDiversity: 0,
            conceptualDensity: 0,
            domainSpecificity: 0,
            registerDistribution: {},
            formalityDistribution: {},
            semanticFieldAnalysis: {}
          },
          version: 1,
          lastUpdated: new Date().toISOString(),
          customFields: {}
        },
        analytics: {
          totalViews: 0,
          uniqueViews: 0,
          averageSessionDuration: 0,
          mostViewedTerms: [],
          userEngagement: {
            averageSessionLength: 0,
            bounceRate: 0,
            returnRate: 0,
            interactionRate: 0,
            shareRate: 0,
            bookmarkRate: 0,
            translationRate: 0,
            pronunciationRate: 0
          },
          learningPatterns: {
            hourlyViews: Array(24).fill(0),
            dailyViews: Array(30).fill(0),
            weeklyViews: Array(52).fill(0),
            monthlyViews: Array(12).fill(0),
            peakTimes: [],
            difficultyProgression: []
          },
          contentPerformance: {
            topCategories: [],
            topPartsOfSpeech: [],
            topDifficulties: []
          },
          trends: {
            growthRate: 0,
            seasonalPatterns: {},
            emergingTerms: [],
            learningProgress: []
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Sauvegarder le glossaire
      this.glossaries.set(glossary.id, glossary);
      await this.saveGlossary(glossary);

      // Émettre l'événement de début de génération
      this.emit('glossary_generation_started', { glossary });

      // Démarrer la génération en arrière-plan
      this.processGlossaryGeneration(glossary, document);

      console.log('📚 Génération glossaire démarrée:', glossary.id);
      return glossary;

    } catch (error) {
      console.error('❌ Erreur génération glossaire:', error);
      throw error;
    }
  }

  /**
   * Traite la génération de glossaire en arrière-plan
   */
  private async processGlossaryGeneration(glossary: Glossary, document: any): Promise<void> {
    try {
      const startTime = Date.now();

      // Mettre à jour le statut
      glossary.status = 'processing';
      await this.saveGlossary(glossary);

      // Extraire le contenu du document
      const content = await this.extractDocumentContent(document);
      
      // Générer les termes
      const terms = await this.extractTerms(content, glossary.settings);
      
      // Traiter et valider les termes
      const processedTerms = await this.processTerms(terms, glossary.settings);
      
      // Calculer les métadonnées
      const metadata = this.calculateGlossaryMetadata(processedTerms, content);
      
      // Mettre à jour le glossaire
      glossary.terms = processedTerms;
      glossary.metadata = { ...glossary.metadata, ...metadata };
      glossary.updatedAt = new Date().toISOString();

      // Sauvegarder le glossaire mis à jour
      await this.saveGlossary(glossary);

      // Émettre l'événement de génération terminée
      this.emit('glossary_generation_completed', { glossary, terms: processedTerms });

      console.log('📚 Génération glossaire terminée:', processedTerms.length, 'termes');

    } catch (error) {
      console.error('❌ Erreur traitement génération glossaire:', error);
      
      // Marquer comme échoué
      glossary.status = 'draft';
      glossary.updatedAt = new Date().toISOString();
      await this.saveGlossary(glossary);
      
      // Émettre l'événement d'erreur
      this.emit('glossary_generation_failed', { glossary, error });
    }
  }

  /**
   * Extrait les termes du contenu
   */
  private async extractTerms(content: string, settings: GlossarySettings): Promise<GlossaryTerm[]> {
    try {
      // Simuler l'extraction de termes avec l'IA
      // Dans un vrai projet, utiliser une librairie NLP ou l'API OpenAI
      
      const terms: GlossaryTerm[] = [];
      
      // Termes basés sur le contenu
      const baseTerms = [
        {
          term: "Intelligence Artificielle",
          definition: "Discipline informatique qui vise à créer des machines capables d'imiter l'intelligence humaine, d'apprendre de l'expérience et de résoudre des problèmes complexes",
          context: "L'intelligence artificielle transforme radicalement notre manière de travailler et d'interagir avec la technologie",
          synonyms: ["IA", "AI", "intelligence machine", "machine learning"],
          antonyms: ["intelligence naturelle", "intelligence humaine"],
          relatedTerms: ["apprentissage automatique", "réseaux de neurones", "deep learning"],
          translations: [
            { language: "en", term: "Artificial Intelligence", definition: "Computer science discipline aimed at creating machines that can mimic human intelligence", confidence: 0.95 },
            { language: "es", term: "Inteligencia Artificial", definition: "Disciplina informática que busca crear máquinas capaces de imitar la inteligencia humana", confidence: 0.90 },
            { language: "de", term: "Künstliche Intelligenz", definition: "Informatikdisziplin, die Maschinen schaffen will, die menschliche Intelligenz nachahmen können", confidence: 0.88 }
          ],
          examples: [
            {
              id: "ex1",
              text: "L'intelligence artificielle peut analyser des millions de données en quelques secondes",
              context: "Analyse de données",
              source: "Document principal",
              difficulty: "intermediate" as DifficultyLevel,
              highlighted: "intelligence artificielle"
            },
            {
              id: "ex2",
              text: "Les systèmes d'intelligence artificielle apprennent continuellement de nouvelles données",
              context: "Apprentissage",
              source: "Document principal",
              difficulty: "advanced" as DifficultyLevel,
              highlighted: "intelligence artificielle"
            }
          ],
          etymology: "Terme popularisé dans les années 1950 par John McCarthy, pionnier de l'IA",
          pronunciation: "/ɛ̃.tɛl.li.ʒɑ̃s aʁ.ti.sjɛl/",
          partOfSpeech: "noun" as PartOfSpeech,
          difficulty: "intermediate" as DifficultyLevel,
          frequency: "frequent" as FrequencyLevel,
          category: "Technologie",
          subcategory: "Informatique",
          tags: ["IA", "machine learning", "réseaux de neurones", "algorithmes"],
          keywords: ["intelligence", "artificielle", "machine", "learning", "algorithmes"],
          sources: [],
          media: [],
          metadata: {
            extractionMethod: 'ai',
            confidence: 0.95,
            relevance: 0.90,
            accuracy: 0.92,
            completeness: 0.88,
            processingTime: 2000,
            model: settings.visualization.model || 'gpt-4',
            temperature: 0.3,
            tokensUsed: 200,
            language: 'fr',
            sentiment: 'positive',
            complexity: 'high',
            readability: 0.6,
            wordCount: 25,
            characterCount: 180,
            semanticContext: {
              topic: "Technologie",
              domain: "Informatique",
              field: "Intelligence Artificielle",
              contextWords: ["ordinateur", "algorithme", "apprentissage", "données"],
              relatedConcepts: ["machine learning", "deep learning", "réseaux de neurones"],
              semanticField: "Technologie de l'information",
              conceptualDensity: 0.8
            },
            linguisticFeatures: {
              morphological: {
                root: "intelligence",
                inflection: "intelligence",
                derivation: "artificielle"
              },
              syntactic: {
                phraseStructure: "Noun + Adjective",
                dependencyRelations: ["det", "adj"],
                grammaticalFunction: "Subject"
              },
              semantic: {
                semanticCategory: "Concept",
                semanticRelations: ["hypernym", "hyponym"],
                conceptualRelations: ["technology", "science"]
              },
              pragmatic: {
                usageContext: "Technical",
                register: "Formal",
                formality: "High",
                politeness: "Neutral"
              }
            },
            domainSpecificity: 0.9,
            customFields: {}
          },
          style: {
            color: '#3B82F6',
            backgroundColor: '#3B82F620',
            borderColor: '#3B82F6',
            borderWidth: 2,
            borderStyle: 'solid',
            borderRadius: 8,
            opacity: 1,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            icon: 'brain',
            iconSize: 20,
            iconColor: '#ffffff',
            shadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          term: "Machine Learning",
          definition: "Sous-domaine de l'intelligence artificielle qui permet aux ordinateurs d'apprendre et de s'améliorer automatiquement à partir de données sans être explicitement programmés",
          context: "Le machine learning est au cœur de nombreuses applications modernes, de la recommandation de produits à la reconnaissance d'images",
          synonyms: ["apprentissage automatique", "ML", "apprentissage machine"],
          antonyms: ["programmation explicite", "algorithmes statiques"],
          relatedTerms: ["deep learning", "réseaux de neurones", "algorithmes d'apprentissage"],
          translations: [
            { language: "en", term: "Machine Learning", definition: "Subfield of AI that enables computers to learn and improve automatically from data", confidence: 0.96 },
            { language: "es", term: "Aprendizaje Automático", definition: "Subcampo de la IA que permite a las computadoras aprender y mejorar automáticamente de los datos", confidence: 0.91 }
          ],
          examples: [
            {
              id: "ex1",
              text: "Les algorithmes de machine learning peuvent prédire les tendances du marché",
              context: "Prédictions",
              source: "Document principal",
              difficulty: "intermediate" as DifficultyLevel,
              highlighted: "machine learning"
            }
          ],
          etymology: "Terme popularisé dans les années 1950-1960 avec les premiers travaux sur l'apprentissage automatique",
          pronunciation: "/məˈʃiːn ˈlɜːrnɪŋ/",
          partOfSpeech: "noun" as PartOfSpeech,
          difficulty: "intermediate" as DifficultyLevel,
          frequency: "frequent" as FrequencyLevel,
          category: "Technologie",
          subcategory: "Intelligence Artificielle",
          tags: ["IA", "algorithmes", "données", "apprentissage"],
          keywords: ["machine", "learning", "algorithmes", "données", "prédiction"],
          sources: [],
          media: [],
          metadata: {
            extractionMethod: 'ai',
            confidence: 0.92,
            relevance: 0.88,
            accuracy: 0.90,
            completeness: 0.85,
            processingTime: 1800,
            model: settings.visualization.model || 'gpt-4',
            temperature: 0.3,
            tokensUsed: 180,
            language: 'fr',
            sentiment: 'positive',
            complexity: 'high',
            readability: 0.6,
            wordCount: 22,
            characterCount: 165,
            semanticContext: {
              topic: "Technologie",
              domain: "Informatique",
              field: "Intelligence Artificielle",
              contextWords: ["algorithmes", "données", "apprentissage", "prédiction"],
              relatedConcepts: ["deep learning", "réseaux de neurones", "statistiques"],
              semanticField: "Apprentissage automatique",
              conceptualDensity: 0.85
            },
            linguisticFeatures: {
              morphological: {
                root: "learn",
                inflection: "learning",
                derivation: "machine"
              },
              syntactic: {
                phraseStructure: "Noun + Noun",
                dependencyRelations: ["det", "noun"],
                grammaticalFunction: "Subject"
              },
              semantic: {
                semanticCategory: "Process",
                semanticRelations: ["hypernym", "hyponym"],
                conceptualRelations: ["technology", "method"]
              },
              pragmatic: {
                usageContext: "Technical",
                register: "Formal",
                formality: "High",
                politeness: "Neutral"
              }
            },
            domainSpecificity: 0.95,
            customFields: {}
          },
          style: {
            color: '#8B5CF6',
            backgroundColor: '#8B5CF620',
            borderColor: '#8B5CF6',
            borderWidth: 2,
            borderStyle: 'solid',
            borderRadius: 8,
            opacity: 1,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            icon: 'cpu',
            iconSize: 20,
            iconColor: '#ffffff',
            shadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          term: "Réseau de Neurones",
          definition: "Modèle informatique inspiré du fonctionnement du cerveau humain, composé de neurones artificiels interconnectés qui traitent l'information",
          context: "Les réseaux de neurones sont la base du deep learning et permettent de résoudre des problèmes complexes de reconnaissance et de classification",
          synonyms: ["neural network", "réseau neuronal", "NN"],
          antonyms: ["algorithmes traditionnels", "programmation linéaire"],
          relatedTerms: ["deep learning", "couches cachées", "propagation arrière", "fonctions d'activation"],
          translations: [
            { language: "en", term: "Neural Network", definition: "Computing model inspired by the human brain, composed of interconnected artificial neurons", confidence: 0.94 },
            { language: "de", term: "Neuronales Netz", definition: "Berechnungsmodell inspiriert vom menschlichen Gehirn", confidence: 0.89 }
          ],
          examples: [
            {
              id: "ex1",
              text: "Les réseaux de neurones convolutifs sont particulièrement efficaces pour la reconnaissance d'images",
              context: "Vision par ordinateur",
              source: "Document principal",
              difficulty: "advanced" as DifficultyLevel,
              highlighted: "réseaux de neurones"
            }
          ],
          etymology: "Concept développé dans les années 1940 par Warren McCulloch et Walter Pitts, popularisé dans les années 1980",
          pronunciation: "/ʁe.zo də nœ.ʁɔn/",
          partOfSpeech: "noun" as PartOfSpeech,
          difficulty: "advanced" as DifficultyLevel,
          frequency: "common" as FrequencyLevel,
          category: "Technologie",
          subcategory: "Intelligence Artificielle",
          tags: ["IA", "deep learning", "couches", "neurones", "algorithmes"],
          keywords: ["réseau", "neurones", "deep learning", "couches", "propagation"],
          sources: [],
          media: [],
          metadata: {
            extractionMethod: 'ai',
            confidence: 0.90,
            relevance: 0.85,
            accuracy: 0.88,
            completeness: 0.83,
            processingTime: 2200,
            model: settings.visualization.model || 'gpt-4',
            temperature: 0.3,
            tokensUsed: 220,
            language: 'fr',
            sentiment: 'positive',
            complexity: 'high',
            readability: 0.5,
            wordCount: 24,
            characterCount: 170,
            semanticContext: {
              topic: "Technologie",
              domain: "Informatique",
              field: "Intelligence Artificielle",
              contextWords: ["neurones", "couches", "algorithmes", "apprentissage"],
              relatedConcepts: ["deep learning", "propagation arrière", "fonctions d'activation"],
              semanticField: "Apprentissage profond",
              conceptualDensity: 0.9
            },
            linguisticFeatures: {
              morphological: {
                root: "neurone",
                inflection: "neurones",
                derivation: "réseau"
              },
              syntactic: {
                phraseStructure: "Noun + Preposition + Noun",
                dependencyRelations: ["det", "prep", "noun"],
                grammaticalFunction: "Subject"
              },
              semantic: {
                semanticCategory: "Structure",
                semanticRelations: ["hypernym", "hyponym"],
                conceptualRelations: ["biology", "technology"]
              },
              pragmatic: {
                usageContext: "Technical",
                register: "Formal",
                formality: "High",
                politeness: "Neutral"
              }
            },
            domainSpecificity: 0.98,
            customFields: {}
          },
          style: {
            color: '#10B981',
            backgroundColor: '#10B98120',
            borderColor: '#10B981',
            borderWidth: 2,
            borderStyle: 'solid',
            borderRadius: 8,
            opacity: 1,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            icon: 'network',
            iconSize: 20,
            iconColor: '#ffffff',
            shadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          term: "Algorithm",
          definition: "Suite d'instructions étape par étape qui décrit comment résoudre un problème ou accomplir une tâche spécifique",
          context: "Les algorithmes sont le fondement de l'informatique et sont utilisés dans tous les domaines, du tri de données à l'intelligence artificielle",
          synonyms: ["procédure", "méthode", "procédure de calcul"],
          antonyms: ["chaos", "désordre", "improvisation"],
          relatedTerms: ["complexité algorithmique", "optimisation", "structures de données", "complexité temporelle"],
          translations: [
            { language: "en", term: "Algorithm", definition: "Step-by-step procedure that describes how to solve a problem or perform a specific task", confidence: 0.97 },
            { language: "es", term: "Algoritmo", definition: "Conjunto de instrucciones paso a paso que describe cómo resolver un problema", confidence: 0.93 },
            { language: "de", term: "Algorithmus", definition: "Schrittweise Anleitung, die beschreibt, wie ein Problem gelöst wird", confidence: 0.91 }
          ],
          examples: [
            {
              id: "ex1",
              text: "L'algorithme de tri rapide (quick sort) peut trier des milliers d'éléments en quelques millisecondes",
              context: "Algorithmique",
              source: "Document principal",
              difficulty: "intermediate" as DifficultyLevel,
              highlighted: "algorithme"
            }
          ],
          etymology: "Du nom du mathématicien perse Al-Khwarizmi (9ème siècle), considéré comme le père de l'algèbre",
          pronunciation: "/al.ɡo.ʁit.m/",
          partOfSpeech: "noun" as PartOfSpeech,
          difficulty: "beginner" as DifficultyLevel,
          frequency: "very_frequent" as FrequencyLevel,
          category: "Informatique",
          subcategory: "Algorithmique",
          tags: ["programmation", "calcul", "procédure", "logique", "optimisation"],
          keywords: ["algorithme", "procédure", "calcul", "logique", "optimisation"],
          sources: [],
          media: [],
          metadata: {
            extractionMethod: 'ai',
            confidence: 0.98,
            relevance: 0.95,
            accuracy: 0.96,
            completeness: 0.92,
            processingTime: 1500,
            model: settings.visualization.model || 'gpt-4',
            temperature: 0.3,
            tokensUsed: 150,
            language: 'fr',
            sentiment: 'neutral',
            complexity: 'medium',
            readability: 0.7,
            wordCount: 20,
            characterCount: 140,
            semanticContext: {
              topic: "Informatique",
              domain: "Algorithmique",
              field: "Théorie",
              contextWords: ["calcul", "procédure", "logique", "optimisation"],
              relatedConcepts: ["complexité", "efficacité", "structures de données"],
              semanticField: "Calcul algorithmique",
              conceptualDensity: 0.75
            },
            linguisticFeatures: {
              morphological: {
                root: "algorithme",
                inflection: "algorithme",
                derivation: ""
              },
              syntactic: {
                phraseStructure: "Noun",
                dependencyRelations: ["det"],
                grammaticalFunction: "Subject"
              },
              semantic: {
                semanticCategory: "Procedure",
                semanticRelations: ["hypernym", "hyponym"],
                conceptualRelations: ["mathematics", "computer science"]
              },
              pragmatic: {
                usageContext: "Technical",
                register: "Formal",
                formality: "High",
                politeness: "Neutral"
              }
            },
            domainSpecificity: 0.85,
            customFields: {}
          },
          style: {
            color: '#F59E0B',
            backgroundColor: '#F59E0B20',
            borderColor: '#F59E0B',
            borderWidth: 2,
            borderStyle: 'solid',
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
          term: "Base de Données",
          definition: "Ensemble organisé de données structurées, généralement stockées électroniquement, conçu pour un accès efficace à la recherche et à la manipulation",
          context: "Les bases de données sont essentielles pour stocker, gérer et analyser des informations dans les applications modernes",
          synonyms: ["database", "BD", "banque de données", "système de gestion de données"],
          antonyms: ["données non structurées", "fichiers plats"],
          relatedTerms: ["SQL", "NoSQL", "SGBD", "tables", "schéma", "requêtes"],
          translations: [
            { language: "en", term: "Database", definition: "Organized collection of structured data stored electronically", confidence: 0.96 },
            { language: "es", term: "Base de Datos", definition: "Conjunto organizado de datos estructurados almacenados electrónicamente", confidence: 0.92 }
          ],
          examples: [
            {
              id: "ex1",
              text: "La base de données client contient toutes les informations personnelles et les historiques d'achats",
              context: "Gestion de données",
              source: "Document principal",
              difficulty: "intermediate" as DifficultyLevel,
              highlighted: "base de données"
            }
          ],
          etymology: "Terme popularisé dans les années 1960 avec l'émergence des systèmes de gestion de bases de données relationnelles",
          pronunciation: "/baz də dɔ.nɛ/",
          partOfSpeech: "noun" as PartOfSpeech,
          difficulty: "beginner" as DifficultyLevel,
          frequency: "frequent" as FrequencyLevel,
          category: "Informatique",
          subcategory: "Gestion de Données",
          tags: ["données", "stockage", "SQL", "NoSQL", "requêtes"],
          keywords: ["base", "données", "stockage", "structuré", "accès"],
          sources: [],
          media: [],
          metadata: {
            extractionMethod: 'ai',
            confidence: 0.94,
            relevance: 0.90,
            accuracy: 0.92,
            completeness: 0.88,
            processingTime: 1700,
            model: settings.visualization.model || 'gpt-4',
            temperature: 0.3,
            tokensUsed: 170,
            language: 'fr',
            sentiment: 'neutral',
            complexity: 'medium',
            readability: 0.7,
            wordCount: 23,
            characterCount: 160,
            semanticContext: {
              topic: "Informatique",
              domain: "Gestion de Données",
              field: "Stockage",
              contextWords: ["données", "stockage", "accès", "requêtes"],
              relatedConcepts: ["SQL", "NoSQL", "tables", "schéma"],
              semanticField: "Systèmes d'information",
              conceptualDensity: 0.8
            },
            linguisticFeatures: {
              morphological: {
                root: "base",
                inflection: "base",
                derivation: "de données"
              },
              syntactic: {
                phraseStructure: "Noun + Preposition + Noun",
                dependencyRelations: ["det", "prep", "noun"],
                grammaticalFunction: "Subject"
              },
              semantic: {
                semanticCategory: "System",
                semanticRelations: ["hypernym", "hyponym"],
                conceptualRelations: ["storage", "information"]
              },
              pragmatic: {
                usageContext: "Technical",
                register: "Formal",
                formality: "High",
                politeness: "Neutral"
              }
            },
            domainSpecificity: 0.88,
            customFields: {}
          },
          style: {
            color: '#06B6D4',
            backgroundColor: '#06B6D420',
            borderColor: '#06B6D4',
            borderWidth: 2,
            borderStyle: 'solid',
            borderRadius: 8,
            opacity: 1,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            icon: 'database',
            iconSize: 20,
            iconColor: '#ffffff',
            shadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          term: "Interface Utilisateur",
          definition: "Point d'interaction entre un utilisateur et un système informatique, permettant la communication et la manipulation des données",
          context: "Une bonne interface utilisateur est essentielle pour garantir une expérience utilisateur positive et intuitive",
          synonyms: ["UI", "interface", "interface homme-machine", "IHM"],
          antonyms: ["interface machine-machine", "backend"],
          relatedTerms: ["UX", "design d'interface", "prototypage", "accessibilité", "responsive design"],
          translations: [
            { language: "en", term: "User Interface", definition: "Point of interaction between a user and a computer system", confidence: 0.95 },
            { language: "es", term: "Interfaz de Usuario", definition: "Punto de interacción entre el usuario y el sistema informático", confidence: 0.90 }
          ],
          examples: [
            {
              id: "ex1",
              text: "L'interface utilisateur de cette application est très intuitive et facile à naviguer",
              context: "Design",
              source: "Document principal",
              difficulty: "beginner" as DifficultyLevel,
              highlighted: "interface utilisateur"
            }
          ],
          etymology: "Terme devenu populaire avec l'émergence de l'informatique personnelle dans les années 1980",
          pronunciation: "/ɛ̃.tɛʁ.fas y.ti.li.zœ/",
          partOfSpeech: "noun" as PartOfSpeech,
          difficulty: "beginner" as DifficultyLevel,
          frequency: "common" as FrequencyLevel,
          category: "Informatique",
          subcategory: "Design",
          tags: ["UI", "UX", "design", "navigation", "accessibilité"],
          keywords: ["interface", "utilisateur", "navigation", "design", "expérience"],
          sources: [],
          media: [],
          metadata: {
            extractionMethod: 'ai',
            confidence: 0.92,
            relevance: 0.88,
            accuracy: 0.90,
            completeness: 0.85,
            processingTime: 1600,
            model: settings.visualization.model || 'gpt-4',
            temperature: 0.3,
            tokensUsed: 160,
            language: 'fr',
            sentiment: 'positive',
            complexity: 'medium',
            readability: 0.7,
            wordCount: 21,
            characterCount: 150,
            semanticContext: {
              topic: "Informatique",
              domain: "Design",
              field: "Interaction",
              contextWords: ["utilisateur", "navigation", "design", "expérience"],
              relatedConcepts: ["UX", "accessibilité", "prototypage"],
              semanticField: "Design d'interface",
              conceptualDensity: 0.82
            },
            linguisticFeatures: {
              morphological: {
                root: "interface",
                inflection: "interface",
                derivation: "utilisateur"
              },
              syntactic: {
                phraseStructure: "Noun + Noun",
                dependencyRelations: ["det", "noun"],
                grammaticalFunction: "Subject"
              },
              semantic: {
                semanticCategory: "Interface",
                semanticRelations: ["hypernym", "hyponym"],
                conceptualRelations: ["design", "interaction"]
              },
              pragmatic: {
                usageContext: "Technical",
                register: "Formal",
                formality: "Medium",
                politeness: "Neutral"
              }
            },
            domainSpecificity: 0.86,
            customFields: {}
          },
          style: {
            color: '#EF4444',
            backgroundColor: '#EF444420',
            borderColor: '#EF4444',
            borderWidth: 2,
            borderStyle: 'solid',
            borderRadius: 8,
            opacity: 1,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            icon: 'monitor',
            iconSize: 20,
            iconColor: '#ffffff',
            shadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          term: "Cloud Computing",
          definition: "Fourniture de services informatiques (serveurs, stockage, bases de données, réseaux, logiciels) via Internet, généralement selon un modèle de paiement à l'utilisation",
          context: "Le cloud computing révolutionne la façon dont les entreprises gèrent leur infrastructure informatique et leurs applications",
          synonyms: ["informatique nuageuse", "cloud", "services cloud", "SaaS"],
          antonyms: ["informatique locale", "on-premise", "infrastructure interne"],
          relatedTerms: ["IaaS", "PaaS", "SaaS", "virtualisation", "scalabilité", "redondance"],
          translations: [
            { language: "en", term: "Cloud Computing", definition: "Delivery of computing services via Internet", confidence: 0.96 },
            { language: "es", term: "Computación en la Nube", definition: "Suministro de servicios informáticos a través de Internet", confidence: 0.91 }
          ],
          examples: [
            {
              id: "ex1",
              text: "Le cloud computing permet aux entreprises de réduire leurs coûts d'infrastructure tout en améliorant la flexibilité",
              context: "Infrastructure",
              source: "Document principal",
              difficulty: "intermediate" as DifficultyLevel,
              highlighted: "cloud computing"
            }
          ],
          etymology: "Terme popularisé dans les années 2000 avec l'émergence des services comme Amazon Web Services et Google Cloud",
          pronunciation: "/klaʊd kəmˈpjuː.tɪŋ/",
          partOfSpeech: "noun" as PartOfSpeech,
          difficulty: "intermediate" as DifficultyLevel,
          frequency: "common" as FrequencyLevel,
          category: "Technologie",
          subcategory: "Infrastructure",
          tags: ["cloud", "SaaS", "IaaS", "PaaS", "virtualisation"],
          keywords: ["cloud", "services", "internet", "scalabilité", "infrastructure"],
          sources: [],
          media: [],
          metadata: {
            extractionMethod: 'ai',
            confidence: 0.91,
            relevance: 0.87,
            accuracy: 0.89,
            completeness: 0.84,
            processingTime: 1900,
            model: settings.visualization.model || 'gpt-4',
            temperature: 0.3,
            tokensUsed: 190,
            language: 'fr',
            sentiment: 'positive',
            complexity: 'medium',
            readability: 0.6,
            wordCount: 22,
            characterCount: 155,
            semanticContext: {
              topic: "Technologie",
              domain: "Infrastructure",
              field: "Services",
              contextWords: ["services", "internet", "scalabilité", "virtualisation"],
              relatedConcepts: ["IaaS", "PaaS", "SaaS", "virtualisation"],
              semanticField: "Services cloud",
              conceptualDensity: 0.87
            },
            linguisticFeatures: {
              morphological: {
                root: "computing",
                inflection: "computing",
                derivation: "cloud"
              },
              syntactic: {
                phraseStructure: "Noun + Noun",
                dependencyRelations: ["det", "noun"],
                grammaticalFunction: "Subject"
              },
              semantic: {
                semanticCategory: "Service",
                semanticRelations: ["hypernym", "hyponym"],
                conceptualRelations: ["technology", "infrastructure"]
              },
              pragmatic: {
                usageContext: "Technical",
                register: "Formal",
                formality: "High",
                politeness: "Neutral"
              }
            },
            domainSpecificity: 0.92,
            customFields: {}
          },
          style: {
            color: '#6366F1',
            backgroundColor: '#6366F120',
            borderColor: '#6366F1',
            borderWidth: 2,
            borderStyle: 'solid',
            borderRadius: 8,
            opacity: 1,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            icon: 'cloud',
            iconSize: 20,
            iconColor: '#ffffff',
            shadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Ajouter des termes spécifiques selon le contenu
      if (content.toLowerCase().includes('sécurité') || content.toLowerCase().includes('sécuriser')) {
        baseTerms.push({
          term: "Cybersécurité",
          definition: "Pratique de protéger les systèmes, réseaux et données contre les attaques numériques, les dommages ou l'accès non autorisé",
          context: "La cybersécurité est devenue une préoccupation majeure pour les entreprises et les gouvernements",
          synonyms: ["sécurité informatique", "sécurité numérique", "cybersecurity"],
          antonyms: ["vulnérabilité", "insécurité", "risque"],
          relatedTerms: ["chiffrement", "pare-feu", "malware", "phishing", "authentification"],
          translations: [
            { language: "en", term: "Cybersecurity", definition: "Practice of protecting systems from digital attacks", confidence: 0.94 },
            { language: "es", term: "Ciberseguridad", definition: "Práctica de proteger sistemas contra ataques digitales", confidence: 0.89 }
          ],
          examples: [
            {
              id: "ex1",
              text: "La cybersécurité protège les données sensibles contre les menaces numériques",
              context: "Sécurité",
              source: "Document principal",
              difficulty: "intermediate" as DifficultyLevel,
              highlighted: "cybersécurité"
            }
          ],
          etymology: "Terme popularisé dans les années 1990 avec l'augmentation des menaces numériques",
          pronunciation: "/saɪ.bəʁ.sɛ.kjʊˈ.rɪ.ti/",
          partOfSpeech: "noun" as PartOfSpeech,
          difficulty: "intermediate" as DifficultyLevel,
          frequency: "common" as FrequencyLevel,
          category: "Sécurité",
          subcategory: "Informatique",
          tags: ["sécurité", "protection", "menaces", "chiffrement"],
          keywords: ["cybersécurité", "sécurité", "protection", "menaces", "chiffrement"],
          sources: [],
          media: [],
          metadata: {
            extractionMethod: 'ai',
            confidence: 0.89,
            relevance: 0.85,
            accuracy: 0.87,
            completeness: 0.82,
            processingTime: 2100,
            model: settings.visualization.model || 'gpt-4',
            temperature: 0.3,
            tokensUsed: 210,
            language: 'fr',
            sentiment: 'neutral',
            complexity: 'high',
            readability: 0.5,
            wordCount: 24,
            characterCount: 180,
            semanticContext: {
              topic: "Sécurité",
              domain: "Informatique",
              field: "Protection",
              contextWords: ["protection", "menaces", "chiffrement", "données"],
              relatedConcepts: ["malware", "phishing", "authentification"],
              semanticField: "Sécurité numérique",
              conceptualDensity: 0.88
            },
            linguisticFeatures: {
              morphological: {
                root: "sécurité",
                inflection: "sécurité",
                derivation: "cyber"
              },
              syntactic: {
                phraseStructure: "Noun",
                dependencyRelations: ["det"],
                grammaticalFunction: "Subject"
              },
              semantic: {
                semanticCategory: "Protection",
                semanticRelations: ["hypernym", "hyponym"],
                conceptualRelations: ["security", "technology"]
              },
              pragmatic: {
                usageContext: "Technical",
                register: "Formal",
                formality: "High",
                politeness: "Neutral"
              }
            },
            domainSpecificity: 0.95,
            customFields: {}
          },
          style: {
            color: '#DC2626',
            backgroundColor: '#DC262620',
            borderColor: '#DC2626',
            borderWidth: 2,
            borderStyle: 'solid',
            borderRadius: 8,
            opacity: 1,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            icon: 'shield',
            iconSize: 20,
            iconColor: '#ffffff',
            shadow: '0 2px 4px rgba(220,38,38,0.2)'
          },
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Filtrer selon les paramètres
      let filteredTerms = baseTerms.filter(term => {
        if (settings.difficulty && settings.difficulty.length > 0) {
          if (!settings.difficulty.includes(term.difficulty)) return false;
        }
        
        if (settings.frequency && settings.frequency.length > 0) {
          if (!settings.frequency.includes(term.frequency)) return false;
        }
        
        if (settings.filtering?.categories && settings.filtering.categories.length > 0) {
          if (!settings.filtering.categories.includes(term.category)) return false;
        }
        
        if (settings.filtering?.partOfSpeech && settings.filtering.partOfSpeech.length > 0) {
          if (!settings.filtering.partOfSpeech.includes(term.partOfSpeech)) return false;
        }
        
        return true;
      });

      // Limiter le nombre de termes
      filteredTerms = filteredTerms.slice(0, settings.maxTerms || 25);

      return filteredTerms;

    } catch (error) {
      console.error('❌ Erreur extraction termes:', error);
      throw error;
    }
  }

  /**
   * Traite et valide les termes
   */
  private async processTerms(terms: GlossaryTerm[], settings: GlossarySettings): Promise<GlossaryTerm[]> {
    try {
      const processedTerms: GlossaryTerm[] = [];

      for (const term of terms) {
        // Valider le terme
        if (this.validateTerm(term)) {
          // Ajouter les métadonnées de traitement
          term.id = this.generateId();
          term.createdAt = new Date().toISOString();
          term.updatedAt = new Date().toISOString();
          
          // Ajouter les sources simulées
          term.sources = this.generateMockSources(term);
          
          // Ajouter les médias simulés
          term.media = this.generateMockMedia(term);
          
          processedTerms.push(term);
        }
      }

      return processedTerms;

    } catch (error) {
      console.error('❌ Erreur traitement termes:', error);
      throw error;
    }
  }

  /**
   * Valide un terme
   */
  private validateTerm(term: GlossaryTerm): boolean {
    return (
      term.term.trim().length > 2 &&
      term.definition.trim().length > 10 &&
      term.partOfSpeech &&
      term.difficulty &&
      term.frequency &&
      term.metadata.confidence >= 0.5 &&
      term.metadata.relevance >= 0.5
    );
  }

  /**
   * Génère des sources simulées
   */
  private generateMockSources(term: GlossaryTerm): TermSource[] {
    return [
      {
        id: this.generateId(),
        type: 'document',
        title: 'Document principal',
        content: term.definition.substring(0, 100) + '...',
        relevance: 0.9,
        confidence: 0.85,
        snippet: term.definition.substring(0, 50) + '...',
        occurrences: 3,
        metadata: {}
      }
    ];
  }

  /**
   * Génère des médias simulés
   */
  private generateMockMedia(term: GlossaryTerm): TermMedia[] {
    // Simuler des médias pour certains termes
    if (term.category === 'Technologie' || term.category === 'Informatique') {
      return [
        {
          id: this.generateId(),
          type: 'diagram',
          url: `https://picsum.photos/seed/${term.term}_diagram/400/300`,
          title: `Diagramme: ${term.term}`,
          description: `Illustration conceptuelle de ${term.term}`,
          thumbnail: `https://picsum.photos/seed/${term.term}_diagram/100/75`,
          metadata: {}
        }
      ];
    }
    
    return [];
  }

  /**
   * Calcule les métadonnées du glossaire
   */
  private calculateGlossaryMetadata(terms: GlossaryTerm[], content: string): GlossaryMetadata {
    const uniqueTerms = new Set(terms.map(t => t.term.toLowerCase()));
    const termLengths = terms.map(t => t.term.length);
    const definitionLengths = terms.map(t => t.definition.length);
    
    const categories: Record<string, number> = {};
    const partsOfSpeech: Record<string, number> = {};
    const difficulties: Record<string, number> = {};
    const frequencies: Record<string, number> = {};
    const languages: Record<string, number> = {};
    
    for (const term of terms) {
      categories[term.category] = (categories[term.category] || 0) + 1;
      partsOfSpeech[term.partOfSpeech] = (partsOfSpeech[term.partOfSpeech] || 0) + 1;
      difficulties[term.difficulty] = (difficulties[term.difficulty] || 0) + 1;
      frequencies[term.frequency] = (frequencies[term.frequency] || 0) + 1;
      
      for (const translation of term.translations) {
        languages[translation.language] = (languages[translation.language] || 0) + 1;
      }
    }
    
    return {
      totalTerms: terms.length,
      uniqueTerms: uniqueTerms.size,
      averageTermLength: termLengths.reduce((sum, len) => sum + len, 0) / termLengths.length,
      averageDefinitionLength: definitionLengths.reduce((sum, len) => sum + len, 0) / definitionLengths.length,
      categories,
      partsOfSpeech,
      difficulties,
      frequencies,
      languages,
      quality: {
        averageConfidence: terms.reduce((sum, t) => sum + t.metadata.confidence, 0) / terms.length,
        averageRelevance: terms.reduce((sum, t) => sum + t.metadata.relevance, 0) / terms.length,
        averageAccuracy: terms.reduce((sum, t) => sum + t.metadata.accuracy, 0) / terms.length,
        averageCompleteness: terms.reduce((sum, t) => sum + t.metadata.completeness, 0) / terms.length,
        totalExtractionTime: terms.reduce((sum, t) => sum + t.metadata.processingTime, 0),
        errorRate: 0,
        duplicateRate: 0,
        missingDefinitionRate: 0,
        contextQuality: terms.reduce((sum, t) => sum + (t.context.length > 50 ? 1 : 0), 0) / terms.length
      },
      extraction: {
        method: { ai: terms.length },
        model: { [terms[0]?.metadata.model || 'gpt-4']: terms.length },
        averageProcessingTime: terms.reduce((sum, t) => sum + t.metadata.processingTime, 0) / terms.length,
        totalTokensUsed: terms.reduce((sum, t) => sum + t.metadata.tokensUsed, 0),
        averageTokensPerTerm: terms.reduce((sum, t) => sum + t.metadata.tokensUsed, 0) / terms.length,
        termExtractionAccuracy: terms.reduce((sum, t) => sum + t.metadata.confidence, 0) / terms.length,
        definitionExtractionAccuracy: terms.reduce((sum, t) => sum + t.metadata.accuracy, 0) / terms.length,
        contextExtractionAccuracy: 0.8, // Simulé
        relationExtractionAccuracy: 0.7 // Simulé
      },
      linguisticAnalysis: {
        morphologicalComplexity: terms.reduce((sum, t) => sum + (t.metadata.linguisticFeatures.morphological?.root ? 1 : 0), 0) / terms.length,
        syntacticComplexity: terms.reduce((sum, t) => sum + (t.metadata.linguisticFeatures.syntactic?.phraseStructure ? 1 : 0), 0) / terms.length,
        semanticComplexity: terms.reduce((sum, t) => sum + (t.metadata.linguisticFeatures.semantic?.semanticCategory ? 1 : 0), 0) / terms.length,
        lexicalDiversity: uniqueTerms.size / terms.length,
        conceptualDensity: terms.reduce((sum, t) => sum + t.metadata.semanticContext.conceptualDensity, 0) / terms.length,
        domainSpecificity: terms.reduce((sum, t) => sum + t.metadata.domainSpecificity, 0) / terms.length,
        registerDistribution: {},
        formalityDistribution: {},
        semanticFieldAnalysis: {}
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
          Guide Complet de l'Intelligence Artificielle et du Machine Learning
          
          Introduction
          Ce document présente les concepts fondamentaux de l'intelligence artificielle et du machine learning. 
          L'intelligence artificielle (IA) est une discipline informatique qui vise à créer des machines 
          capables d'imiter l'intelligence humaine.
          
          Concepts Fondamentaux
          Algorithm: Un algorithme est une suite d'instructions qui décrit comment résoudre un problème.
          Les algorithmes sont essentiels pour le traitement des données et la prise de décision.
          
          Base de données: Une base de données est un système de stockage organisé de données.
          Les bases de données modernes utilisent des structures complexes pour optimiser les requêtes.
          
          Machine Learning
          Le machine learning est une sous-discipline de l'intelligence artificielle.
          Les réseaux de neurones sont inspirés du fonctionnement du cerveau humain.
          Le deep learning utilise des réseaux de neurones multicouches pour des tâches complexes.
          
          Technologies Cloud
          Le cloud computing révolutionne l'infrastructure informatique.
          Les services cloud offrent une flexibilité et une scalabilité sans précédent.
          Les entreprises migrent vers le cloud pour réduire les coûts et améliorer l'efficacité.
          
          Cybersécurité
          La cybersécurité protège les systèmes contre les menaces numériques.
          Le chiffrement est essentiel pour protéger les données sensibles.
          Les pare-feu et les systèmes de détection d'intrusion sont des composants clés.
          
          Interface Utilisateur
          L'interface utilisateur (UI) est le point d'interaction entre l'utilisateur et le système.
          Une bonne UI garantit une expérience utilisateur positive et intuitive.
          L'UX (User Experience) englobe l'ensemble des interactions de l'utilisateur.
          
          Le document se termine par une discussion sur les tendances futures 
          et les défis éthiques de l'intelligence artificielle.
        `;
      } else if (document.type === 'docx') {
        // Simuler l'extraction de texte Word
        content = `
          Glossaire Technique
          
          Table des matières
          
          1. Termes Informatiques
          2. Concepts Technologiques
          3. Définitions Techniques
          
          Ce glossaire contient les termes techniques essentiels pour comprendre
          l'informatique moderne et les technologies émergentes.
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
   * Obtient un glossaire
   */
  async getGlossary(glossaryId: string, userId?: string): Promise<Glossary | null> {
    try {
      const { data, error } = await supabase
        .from('glossaries')
        .select('*')
        .eq('id', glossaryId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Vérifier les permissions
      if (userId && data.user_id !== userId && data.status !== 'published') {
        return null;
      }

      return data as Glossary;

    } catch (error) {
      console.error('❌ Erreur récupération glossaire:', error);
      throw error;
    }
  }

  /**
   * Obtient les glossaires d'un utilisateur
   */
  async getUserGlossaries(
    userId: string,
    options: {
      type?: GlossaryType;
      status?: string;
      language?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'created_at' | 'updated_at' | 'title' | 'term_count';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<Glossary[]> {
    try {
      let query = supabase
        .from('glossaries')
        .select('*')
        .eq('user_id', userId);

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.language) {
        query = query.eq('language', options.language);
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

      return data as Glossary[];

    } catch (error) {
      console.error('❌ Erreur récupération glossaires utilisateur:', error);
      throw error;
    }
  }

  /**
   * Recherche dans les glossaires
   */
  async searchGlossaries(
    userId: string,
    query: string,
    options: {
      type?: GlossaryType;
      category?: string;
      difficulty?: DifficultyLevel;
      partOfSpeech?: PartOfSpeech;
      tags?: string[];
      limit?: number;
    } = {}
  ): Promise<GlossaryTerm[]> {
    try {
      // Simuler la recherche
      const userGlossaries = await this.getUserGlossaries(userId, { status: 'published' });
      
      const results: GlossaryTerm[] = [];
      
      for (const glossary of userGlossaries) {
        for (const term of glossary.terms) {
          // Recherche simple dans le terme et la définition
          if (term.term.toLowerCase().includes(query.toLowerCase()) ||
              term.definition.toLowerCase().includes(query.toLowerCase()) ||
              term.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
            
            // Filtrer selon les options
            if (options.type && glossary.type !== options.type) continue;
            if (options.category && term.category !== options.category) continue;
            if (options.difficulty && term.difficulty !== options.difficulty) continue;
            if (options.partOfSpeech && term.partOfSpeech !== options.partOfSpeech) continue;
            if (options.tags && !options.tags.some(tag => term.tags.includes(tag))) continue;
            
            results.push(term);
          }
        }
      }

      // Limiter les résultats
      if (options.limit) {
        return results.slice(0, options.limit);
      }

      return results;

    } catch (error) {
      console.error('❌ Erreur recherche glossaires:', error);
      throw error;
    }
  }

  /**
   * Ajoute une interaction à un terme
   */
  async addTermInteraction(
    termId: string,
    userId: string,
    interaction: {
      type: 'view' | 'click' | 'share' | 'comment' | 'like' | 'bookmark' | 'edit' | 'translate' | 'pronounce';
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const glossary = await this.getGlossaryByTermId(termId);
      if (!glossary) {
        throw new Error('Terme non trouvé');
      }

      const term = glossary.terms.find(t => t.id === termId);
      if (!term) {
        throw new Error('Terme non trouvé');
      }

      // Ajouter l'interaction
      const interactionEntry: TermInteraction = {
        id: this.generateId(),
        userId,
        type: interaction.type,
        timestamp: new Date().toISOString(),
        metadata: interaction.metadata || {}
      };

      term.interactions.push(interactionEntry);

      // Mettre à jour les analytics
      glossary.analytics.totalViews++;
      
      if (interaction.type === 'view') {
        const viewedTerm = glossary.analytics.mostViewedTerms.find(t => t.termId === termId);
        if (viewedTerm) {
          viewedTerm.viewCount++;
        } else {
          glossary.analytics.mostViewedTerms.push({
            termId,
            term: term.term,
            viewCount: 1,
            averageTime: 0,
            interactionCount: 1
          });
        }
      }

      term.updatedAt = new Date().toISOString();
      glossary.updatedAt = new Date().toISOString();

      // Sauvegarder le glossaire
      await this.saveGlossary(glossary);

      console.log('📚 Interaction ajoutée au terme:', termId);

    } catch (error) {
      console.error('❌ Erreur ajout interaction:', error);
      throw error;
    }
  }

  /**
   * Exporte un glossaire
   */
  async exportGlossary(
    glossaryId: string,
    userId: string,
    format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'html' | 'xml' | 'txt',
    options: ExportSettings = {}
  ): Promise<GlossaryExport> {
    try {
      const glossary = await this.getGlossary(glossaryId, userId);
      if (!glossary) {
        throw new Error('Glossaire non trouvé');
      }

      const exportData: GlossaryExport = {
        id: this.generateId(),
        glossaryId,
        format,
        options,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Traiter l'export
      const exportedContent = await this.processExport(glossary, format, options);
      
      // Sauvegarder le fichier exporté
      const fileUrl = await this.saveExportFile(exportData.id, exportedContent, format);
      
      exportData.status = 'completed';
      exportData.fileUrl = fileUrl;
      exportData.fileSize = exportedContent.length;
      exportData.completedAt = new Date().toISOString();

      console.log('📚 Export glossaire terminé:', exportData.id);
      return exportData;

    } catch (error) {
      console.error('❌ Erreur export glossaire:', error);
      throw error;
    }
  }

  /**
   * Traite l'export
   */
  private async processExport(glossary: Glossary, format: string, options: ExportSettings): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(glossary, null, 2);
      case 'csv':
        return this.convertToCSV(glossary, options);
      case 'html':
        return this.convertToHTML(glossary, options);
      case 'xml':
        return this.convertToXML(glossary, options);
      case 'txt':
        return this.convertToTXT(glossary, options);
      case 'pdf':
        return 'PDF content'; // Simuler
      case 'xlsx':
        return 'XLSX content'; // Simulé
      default:
        throw new Error(`Format non supporté: ${format}`);
    }
  }

  /**
   * Convertit en CSV
   */
  private convertToCSV(glossary: Glossary, options: ExportSettings): string {
    const headers = [
      'Terme',
      'Définition',
      'Catégorie',
      'Partie du discours',
      'Difficulté',
      'Fréquence',
      'Synonymes',
      'Antonymes',
      'Tags',
      'Vues',
      'Interactions'
    ];

    const rows = [headers.join(',')];

    for (const term of glossary.terms) {
      const row = [
        term.term,
        `"${term.definition.replace(/"/g, '""')}"`,
        term.category,
        term.partOfSpeech,
        term.difficulty,
        term.frequency,
        `"${term.synonyms.join(', ')}"`,
        `"${term.antonyms.join(', ')}"`,
        `"${term.tags.join(', ')}"`,
        term.interactions.length,
        term.interactions.length
      ];
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  /**
   * Convertit en HTML
   */
  private convertToHTML(glossary: Glossary, options: ExportSettings): string {
    let html = '<html><head>';
    html += `<title>${glossary.title}</title>`;
    html += '<meta charset="utf-8">';
    html += '<style>';
    html += `
      body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
      h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
      .glossary { }
      .term { margin-bottom: 30px; padding: 20px; border-left: 4px solid #3B82F6; background: #f8f9fa; border-radius: 8px; }
      .term-header { margin-bottom: 15px; }
      .term-title { font-size: 1.4em; font-weight: bold; color: #3B82F6; margin-bottom: 5px; }
      .term-pronunciation { font-style: italic; color: #666; font-size: 0.9em; }
      .term-definition { margin-bottom: 15px; line-height: 1.6; }
      .term-meta { font-size: 0.9em; color: #666; margin-top: 10px; }
      .term-meta span { margin-right: 15px; }
      .term-examples { margin-top: 15px; }
      .example { margin-bottom: 10px; padding: 10px; background: #e9ecef; border-radius: 4px; font-style: italic; }
      .translations { margin-top: 15px; }
      .translation { margin-bottom: 5px; padding: 8px; background: #d1ecf1; border-radius: 4px; }
      .synonyms { color: #28a745; }
      .antonyms { color: #dc3545; }
    `;
    html += '</style></head><body>';

    html += `<h1>${glossary.title}</h1>`;
    
    if (glossary.description) {
      html += `<p>${glossary.description}</p>`;
    }

    html += '<div class="glossary">';

    for (const term of glossary.terms) {
      html += '<div class="term">';
      html += '<div class="term-header">';
      html += `<div class="term-title">${term.term}</div>`;
      
      if (term.pronunciation) {
        html += `<div class="term-pronunciation">Prononciation: ${term.pronunciation}</div>`;
      }
      
      html += '</div>';
      html += `<div class="term-definition">${term.definition}</div>`;
      
      html += '<div class="term-meta">';
      html += `<span>Catégorie: ${term.category}</span>`;
      html += `<span>Partie du discours: ${term.partOfSpeech}</span>`;
      html += `<span>Difficulté: ${term.difficulty}</span>`;
      html += `<span>Fréquence: ${term.frequency}</span>`;
      
      if (term.etymology) {
        html += `<span>Étymologie: ${term.etymology}</span>`;
      }
      
      html += '</div>';
      
      if (term.synonyms.length > 0) {
        html += '<div class="synonyms">';
        html += `<strong>Synonymes:</strong> ${term.synonyms.join(', ')}`;
        html += '</div>';
      }
      
      if (term.antonyms.length > 0) {
        html += '<div class="antonyms">';
        html += `<strong>Antonymes:</strong> ${term.antonyms.join(', ')}`;
        html += '</div>';
      }
      
      if (term.tags.length > 0) {
        html += `<div class="term-meta"><span>Tags: ${term.tags.join(', ')}</span></div>`;
      }
      
      if (term.examples.length > 0) {
        html += '<div class="term-examples">';
        html += '<strong>Exemples:</strong>';
        for (const example of term.examples) {
          html += `<div class="example">${example.text}</div>`;
        }
        html += '</div>';
      }
      
      if (term.translations.length > 0) {
        html += '<div class="translations">';
        html += '<strong>Traductions:</strong>';
        for (const translation of term.translations) {
          html += `<div class="translation"><strong>${translation.language}:</strong> ${translation.term} - ${translation.definition}</div>`;
        }
        html += '</div>';
      }
      
      html += '</div>';
    }

    html += '</div></body></html>';
    return html;
  }

  /**
   * Convertit en XML
   */
  private convertToXML(glossary: Glossary, options: ExportSettings): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<glossary>';
    xml += `<title>${glossary.title}</title>`;
    xml += `<description>${glossary.description || ''}</description>`;
    xml += `<language>${glossary.language}</language>`;
    xml += `<type>${glossary.type}</type>`;
    xml += `<created_at>${glossary.createdAt}</created_at>`;
    xml += `<updated_at>${glossary.updated_at}</updated_at>`;
    xml += '<terms>';

    for (const term of glossary.terms) {
      xml += '<term>';
      xml += `<id>${term.id}</id>`;
      xml += `<term>${term.term}</term>`;
      xml += `<definition>${term.definition}</definition>`;
      xml += `<context>${term.context}</context>`;
      xml += `<part_of_speech>${term.partOfSpeech}</part_of_speech>`;
      xml += `<difficulty>${term.difficulty}</difficulty>`;
      xml += `<frequency>${term.frequency}</frequency>`;
      xml += `<category>${term.category}</category>`;
      xml += `<subcategory>${term.subcategory || ''}</subcategory>`;
      xml += `<pronunciation>${term.pronunciation || ''}</pronunciation>`;
      xml += `<etymology>${term.etymology || ''}</etymology>`;
      xml += `<synonyms>${term.synonyms.join(',')}</synonyms>`;
      xml += `<antonyms>${term.antonyms.join(',')}</antonyms>`;
      xml += `<tags>${term.tags.join(',')}</tags>`;
      xml += `<keywords>${term.keywords.join(',')}</keywords>`;
      xml += `<created_at>${term.createdAt}</created_at>`;
      xml += `<updated_at>${term.updated_at}</updated_at>`;
      xml += '</term>';
    }

    xml += '</terms>';
    xml += '</glossary>';
    return xml;
  }

  /**
   * Convertit en TXT
   */
  private convertToTXT(glossary: Glossary, options: ExportSettings): string {
    let txt = `${glossary.title}\n`;
    txt += `${'='.repeat(glossary.title.length)}\n\n`;
    
    if (glossary.description) {
      txt += `${glossary.description}\n\n`;
    }
    
    txt += `Glossaire - ${glossary.terms.length} termes\n`;
    txt += `${'='.repeat(50)}\n\n`;

    for (const term of glossary.terms) {
      txt += `${term.term.toUpperCase()}\n`;
      txt += `${'-'.repeat(term.term.length)}\n`;
      txt += `Définition: ${term.definition}\n`;
      
      if (term.pronunciation) {
        txt += `Prononciation: ${term.pronunciation}\n`;
      }
      
      txt += `Catégorie: ${term.category}\n`;
      txt += `Partie du discours: ${term.partOfSpeech}\n`;
      txt += `Difficulté: ${term.difficulty}\n`;
      txt += `Fréquence: ${term.frequency}\n`;
      
      if (term.etymology) {
        txt += `Étymologie: ${term.etymology}\n`;
      }
      
      if (term.synonyms.length > 0) {
        txt += `Synonymes: ${term.synonyms.join(', ')}\n`;
      }
      
      if (term.antonyms.length > 0) {
        txt += `Antonymes: ${term.antonyms.join(', ')}\n`;
      }
      
      if (term.tags.length > 0) {
        txt += `Tags: ${term.tags.join(', ')}\n`;
      }
      
      if (term.examples.length > 0) {
        txt += `Exemples:\n`;
        for (const example of term.examples) {
          txt += `  • ${example.text}\n`;
        }
      }
      
      if (term.translations.length > 0) {
        txt += `Traductions:\n`;
        for (const translation of term.translations) {
          txt += `  ${translation.language}: ${translation.term} - ${translation.definition}\n`;
        }
      }
      
      txt += '\n';
    }

    return txt;
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
      const fileName = `glossary-exports/${exportId}.${format}`;
      
      const { error } = await supabase.storage
        .from('glossary-exports')
        .upload(fileName, new Blob([content]));

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('glossary-exports')
        .getPublicUrl(fileName);

      return publicUrl;

    } catch (error) {
      console.error('❌ Erreur sauvegarde fichier export:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques des glossaires
   */
  async getStats(userId?: string): Promise<GlossaryStats> {
    try {
      const { data, error } = await supabase.rpc('get_glossary_stats', {
        p_user_id: userId
      });

      if (error) throw error;

      const stats = data || {
        total_glossaries: 0,
        published_glossaries: 0,
        draft_glossaries: 0,
        total_terms: 0,
        average_terms_per_glossary: 0,
        most_active_types: {},
        most_active_categories: {},
        top_performing_glossaries: [],
        user_engagement: {
          total_users: 0,
          active_users: 0,
          average_glossaries_per_user: 0,
          average_terms_per_user: 0,
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
          glossary_growth: Array(12).fill(0),
          term_growth: Array(12).fill(0),
          type_trends: {},
          category_trends: {}
        }
      };

      return {
        totalGlossaries: stats.total_glossaries,
        publishedGlossaries: stats.published_glossaries,
        draftGlossaries: stats.draft_glossaries,
        totalTerms: stats.total_terms,
        averageTermsPerGlossary: stats.average_terms_per_glossary,
        mostActiveTypes: stats.most_active_types,
        mostActiveCategories: stats.most_active_categories,
        topPerformingGlossaries: stats.top_performing_glossaries,
        userEngagement: stats.user_engagement,
        contentQuality: stats.content_quality,
        trends: stats.trends
      };

    } catch (error) {
      console.error('❌ Erreur statistiques glossaires:', error);
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

  private async getGlossaryByTermId(termId: string): Promise<Glossary | null> {
    try {
      const { data, error } = await supabase
        .from('glossaries')
        .select('*')
        .like('terms', termId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return data as Glossary;

    } catch (error) {
      console.error('❌ Erreur récupération glossaire par term ID:', error);
      return null;
    }
  }

  private mergeDefaultSettings(settings: Partial<GlossarySettings>): GlossarySettings {
    return {
      maxTerms: settings.maxTerms || 25,
      language: settings.language || 'fr',
      targetLanguages: settings.targetLanguages || ['en', 'es', 'de'],
      categories: settings.categories || [],
      difficulty: settings.difficulty || ['beginner', 'intermediate', 'advanced', 'expert'],
      frequency: settings.frequency || ['rare', 'uncommon', 'common', 'frequent', 'very_frequent'],
      includeSynonyms: settings.includeSynonyms ?? true,
      includeAntonyms: settings.includeAntonyms ?? true,
      includeTranslations: settings.includeTranslations ?? true,
      includeExamples: settings.includeExamples ?? true,
      includeEtymology: settings.includeEtymology ?? false,
      includePronunciation: settings.includePronunciation ?? false,
      minFrequency: settings.minFrequency || 'rare',
      maxFrequency: settings.maxFrequency || 'very_frequent',
      sortBy: settings.sortBy || {
        field: 'term',
        direction: 'asc'
      },
      sortOrder: settings.sortOrder || 'asc',
      grouping: settings.grouping || {
        enabled: false,
        field: 'category',
        sortOrder: 'asc',
        maxGroups: 10
      },
      filtering: settings.filtering || {
        searchQuery: '',
        tags: [],
        keywords: [],
        categories: [],
        difficulties: [],
        frequencies: [],
        partOfSpeech: [],
        customFilters: {}
      },
      visualization: settings.visualization || {
        layout: 'list',
        theme: 'auto',
        colors: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#10B981',
          background: '#ffffff',
          text: '#1F2937',
          border: '#E5E7EB',
          categories: {},
          difficulties: {},
          frequencies: {},
          partsOfSpeech: {}
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
        includeInteractions: false,
        includeTranslations: true,
        includeExamples: true,
        language: 'fr',
        customOptions: {}
      },
      personalization: settings.personalization || {
        userLevel: 'intermediate',
        interests: [],
        preferredCategories: [],
        nativeLanguage: 'fr',
        learningGoals: [],
        studyStyle: 'reading',
        timezone: 'Europe/Paris',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        customPreferences: {}
      }
    };
  }

  private validateGlossarySettings(settings: Partial<GlossarySettings>): void {
    if (settings.maxTerms && (settings.maxTerms < 1 || settings.maxTerms > 100)) {
      throw new Error('Le nombre de termes doit être entre 1 et 100');
    }
  }

  private generateId(): string {
    return `glossary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Charge les templates par défaut
   */
  private async loadDefaultTemplates(): Promise<void> {
    // Simuler le chargement des templates par défaut
    console.log('📚 Chargement des templates de glossaire...');
  }

  /**
   * Démarre le monitoring
   */
  private startMonitoring(): void {
    // Monitorer les glossaires en traitement
    setInterval(() => {
      this.checkProcessingGlossaries();
    }, 60000); // Toutes les minutes

    // Monitorer les statistiques
    setInterval(() => {
      this.updateStats();
    }, 300000); // Toutes les 5 minutes
  }

  /**
   * Vérifie les glossaires en traitement
   */
  private checkProcessingGlossaries(): void {
    // Simuler la vérification des glossaires en traitement
    console.log('📚 Vérification des glossaires en traitement...');
  }

  /**
   * Met à jour les statistiques
   */
  private updateStats(): void {
    // Simuler la mise à jour des statistiques
    console.log('📚 Mise à jour des statistiques de glossaire...');
  }

  /**
   * Sauvegarde un glossaire
   */
  private async saveGlossary(glossary: Glossary): Promise<void> {
    try {
      const { error } = await supabase
        .from('glossaries')
        .upsert({
          id: glossary.id,
          document_id: glossary.documentId,
          user_id: glossary.userId,
          title: glossary.title,
          description: glossary.description,
          language: glossary.language,
          type: glossary.type,
          terms: glossary.terms,
          settings: glossary.settings,
          metadata: glossary.metadata,
          analytics: glossary.analytics,
          status: glossary.status,
          created_at: glossary.createdAt,
          updated_at: glossary.updatedAt,
          published_at: glossary.publishedAt
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde glossaire:', error);
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
        console.error('❌ Erreur callback événement glossaire:', error);
      }
    }
  }

  /**
   * Détruit le service de glossaire
   */
  destroy(): void {
    // Vider les caches
    this.glossaries.clear();
    this.templates.clear();
    this.eventCallbacks.clear();
    
    console.log('📚 Service de glossaire détruit');
  }
}

// Instance singleton
export const glossaryService = new GlossaryService();

// Export des fonctions utilitaires
export const generateGlossary = (
  documentId: string,
  userId: string,
  settings?: Partial<GlossarySettings>,
  options?: {
    title?: string;
    description?: string;
    type?: GlossaryType;
    language?: string;
    targetLanguages?: string[];
  }
) => glossaryService.generateGlossary(documentId, userId, settings, options);

export const getGlossary = (glossaryId: string, userId?: string) => 
  glossaryService.getGlossary(glossaryId, userId);

export const getUserGlossaries = (
  userId: string,
  options?: {
    type?: GlossaryType;
    status?: string;
    language?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'updated_at' | 'title' | 'term_count';
    sortOrder?: 'asc' | 'desc';
  }
) => glossaryService.getUserGlossaries(userId, options);

export const searchGlossaries = (
  userId: string,
  query: string,
  options?: {
    type?: GlossaryType;
    category?: string;
    difficulty?: DifficultyLevel;
    partOfSpeech?: PartOfSpeech;
    tags?: string[];
    limit?: number;
  }
) => glossaryService.searchGlossaries(userId, query, options);

export const addGlossaryTermInteraction = (
  termId: string,
  userId: string,
  interaction: {
    type: 'view' | 'click' | 'share' | 'comment' | 'like' | 'bookmark' | 'edit' | 'translate' | 'pronounce';
    metadata?: Record<string, any>;
  }
) => glossaryService.addTermInteraction(termId, userId, interaction);

export const exportGlossary = (
  glossaryId: string,
  userId: string,
  format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'html' | 'xml' | 'txt',
  options?: ExportSettings
) => glossaryService.exportGlossary(glossaryId, userId, format, options);

export const getGlossaryStats = (userId?: string) => glossaryService.getStats(userId);
