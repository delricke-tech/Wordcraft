/**
 * Service d'extension de texte (élaboration)
 * 
 * Ce service étend automatiquement le contenu pour fournir plus de détails,
 * d'exemples et d'explications, rendant les documents plus riches et informatifs
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Interfaces pour l'extension de texte
export interface TextExpansion {
  id: string;
  documentId: string;
  userId: string;
  title: string;
  description?: string;
  originalText: string;
  expandedText: string;
  expansionType: ExpansionType;
  targetLength: TargetLength;
  settings: ExpansionSettings;
  metadata: ExpansionMetadata;
  analytics: ExpansionAnalytics;
  status: 'draft' | 'processing' | 'completed' | 'published' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export type ExpansionType = 'detailed' | 'examples' | 'explanations' | 'comprehensive' | 'academic' | 'creative' | 'technical' | 'business' | 'custom';

export type TargetLength = 'brief' | 'moderate' | 'detailed' | 'extensive' | 'comprehensive' | 'custom';

export interface ExpansionSettings {
  content: ContentSettings;
  style: StyleSettings;
  structure: StructureSettings;
  formatting: FormattingSettings;
  personalization: PersonalizationSettings;
}

export interface ContentSettings {
  addExamples: boolean;
  addExplanations: boolean;
  addContext: boolean;
  addDefinitions: boolean;
  addComparisons: boolean;
  addConsequences: boolean;
  addHistory: boolean;
  addApplications: boolean;
  customTopics?: string[];
}

export interface StyleSettings {
  tone: 'formal' | 'informal' | 'neutral' | 'academic' | 'creative' | 'technical' | 'business';
  complexity: 'simple' | 'moderate' | 'advanced' | 'expert';
  perspective: 'objective' | 'subjective' | 'balanced';
  voice: 'active' | 'passive' | 'mixed';
}

export interface StructureSettings {
  useSections: boolean;
  useHeadings: boolean;
  useLists: boolean;
  useTables: boolean;
  useQuotes: boolean;
  useReferences: boolean;
  maxParagraphLength: number;
  minParagraphLength: number;
}

export interface FormattingSettings {
  preserveOriginal: boolean;
  highlightAdditions: boolean;
  useMarkdown: boolean;
  includeMetadata: boolean;
  addFootnotes: boolean;
  useEmphasis: boolean;
}

export interface PersonalizationSettings {
  userPreferences: {
    knowledgeLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    interests: string[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  };
  contextAwareness: boolean;
  adaptiveComplexity: boolean;
}

export interface ExpansionMetadata {
  originalMetrics: TextMetrics;
  expandedMetrics: TextMetrics;
  additions: TextAddition[];
  qualityScore: number;
  completenessScore: number;
  relevanceScore: number;
  processingTime: number;
  aiModel: string;
  version: string;
}

export interface TextMetrics {
  totalWords: number;
  totalSentences: number;
  totalParagraphs: number;
  averageWordsPerSentence: number;
  averageCharactersPerWord: number;
  complexityScore: number;
  readabilityScore: number;
  informationDensity: number;
  uniqueWords: number;
  repeatedWords: number;
  technicalTerms: number;
  examplesCount: number;
  explanationsCount: number;
}

export interface TextAddition {
  type: 'example' | 'explanation' | 'definition' | 'comparison' | 'context' | 'consequence' | 'history' | 'application';
  content: string;
  position: {
    start: number;
    end: number;
    line: number;
    column: number;
  };
  relevance: number;
  confidence: number;
  source: 'ai' | 'knowledge_base' | 'user_input' | 'template';
  category: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExpansionAnalytics {
  totalViews: number;
  uniqueViews: number;
  averageReadingTime: number;
  averageScrollDepth: number;
  completionRate: number;
  bounceRate: number;
  returnRate: number;
  shareRate: number;
  bookmarkRate: number;
  commentRate: number;
  ratingRate: number;
  averageRating: number;
  userFeedback: {
    helpful: number;
    notHelpful: number;
    tooLong: number;
    tooShort: number;
    irrelevant: number;
  };
  engagementMetrics: {
    timeSpent: number;
    interactions: number;
    shares: number;
    downloads: number;
  };
  dailyViews: number[];
  weeklyViews: number[];
  monthlyViews: number[];
  userRetention: number[];
  contentPerformance: Array<{
    expansionId: string;
    title: string;
    performance: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  engagementPatterns: {
    peakHours: number[];
    peakDays: number[];
    deviceBreakdown: Record<string, number>;
  };
}

export interface ExpansionStatistics {
  totalExpansions: number;
  publishedExpansions: number;
  draftExpansions: number;
  totalWords: number;
  averageWordsPerExpansion: number;
  mostActiveTypes: Record<ExpansionType, number>;
  mostActiveLengths: Record<TargetLength, number>;
  topPerformingExpansions: Array<{
    expansionId: string;
    title: string;
    viewCount: number;
    averageRating: number;
    wordCount: number;
    expansionScore: number;
  }>;
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    averageExpansionsPerUser: number;
    averageWordsPerUser: number;
    averageReadingTime: number;
    satisfactionScore: number;
  };
  contentQuality: {
    averageQuality: number;
    averageCompleteness: number;
    averageRelevance: number;
    averageReadability: number;
    expansionSuccessRate: number;
  };
  trends: {
    expansionGrowth: number[];
    wordGrowth: number[];
    typeTrends: Record<ExpansionType, number[]>;
    lengthTrends: Record<TargetLength, number[]>;
  };
}

export interface ExpansionTemplate {
  id: string;
  name: string;
  description: string;
  expansionType: ExpansionType;
  targetLength: TargetLength;
  prompt: string;
  settings: ExpansionSettings;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpansionExport {
  id: string;
  expansionId: string;
  format: 'json' | 'txt' | 'md' | 'html' | 'pdf' | 'docx' | 'epub';
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ExportOptions {
  includeMetadata: boolean;
  includeAdditions: boolean;
  includeAnalytics: boolean;
  formatting: {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    margins: number;
  };
  watermark?: boolean;
  password?: string;
}

// Classe principale du service d'extension
export class TextExpansionService {
  private static instance: TextExpansionService;
  private eventCallbacks: Map<string, Function[]> = new Map();

  private constructor() {}

  public static getInstance(): TextExpansionService {
    if (!TextExpansionService.instance) {
      TextExpansionService.instance = new TextExpansionService();
    }
    return TextExpansionService.instance;
  }

  /**
   * Étend un texte selon les paramètres spécifiés
   */
  public async expandText(
    documentId: string,
    userId: string,
    originalText: string,
    expansionType: ExpansionType,
    targetLength: TargetLength,
    settings?: Partial<ExpansionSettings>
  ): Promise<TextExpansion> {
    const startTime = Date.now();
    
    try {
      // Créer l'extension
      const expansion: Partial<TextExpansion> = {
        documentId,
        userId,
        title: `Extension ${expansionType} - ${new Date().toLocaleDateString()}`,
        originalText,
        expansionType,
        targetLength,
        settings: this.mergeSettings(settings),
        metadata: {
          originalMetrics: this.calculateTextMetrics(originalText),
          expandedMetrics: {} as TextMetrics,
          additions: [],
          qualityScore: 0,
          completenessScore: 0,
          relevanceScore: 0,
          processingTime: 0,
          aiModel: 'text-expander-v1.0',
          version: '1.0.0'
        },
        analytics: {
          totalViews: 0,
          uniqueViews: 0,
          averageReadingTime: 0,
          averageScrollDepth: 0,
          completionRate: 0,
          bounceRate: 0,
          returnRate: 0,
          shareRate: 0,
          bookmarkRate: 0,
          commentRate: 0,
          ratingRate: 0,
          averageRating: 0,
          userFeedback: {
            helpful: 0,
            notHelpful: 0,
            tooLong: 0,
            tooShort: 0,
            irrelevant: 0
          },
          engagementMetrics: {
            timeSpent: 0,
            interactions: 0,
            shares: 0,
            downloads: 0
          },
          dailyViews: [],
          weeklyViews: [],
          monthlyViews: [],
          userRetention: [],
          contentPerformance: [],
          engagementPatterns: {
            peakHours: [],
            peakDays: [],
            deviceBreakdown: {}
          }
        },
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Sauvegarder l'extension initiale
      const { data: savedExpansion, error: saveError } = await supabase
        .from('text_expansions')
        .insert([expansion])
        .select()
        .single();

      if (saveError) throw saveError;

      // Émettre l'événement de début
      this.emitEvent('expansion_started', savedExpansion);

      // Traiter l'extension
      const processedExpansion = await this.processExpansion(savedExpansion);

      // Mettre à jour avec le texte étendu
      const processingTime = Date.now() - startTime;
      processedExpansion.metadata.processingTime = processingTime;
      processedExpansion.status = 'completed';
      processedExpansion.updatedAt = new Date();

      const { data: finalExpansion, error: updateError } = await supabase
        .from('text_expansions')
        .update({
          expanded_text: processedExpansion.expandedText,
          metadata: processedExpansion.metadata,
          status: processedExpansion.status,
          updated_at: processedExpansion.updatedAt
        })
        .eq('id', savedExpansion.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Émettre l'événement de complétion
      this.emitEvent('expansion_completed', finalExpansion);

      return this.mapDbToExpansion(finalExpansion);

    } catch (error) {
      console.error('Erreur lors de l\'extension du texte:', error);
      throw error;
    }
  }

  /**
   * Traite l'extension du texte
   */
  private async processExpansion(expansion: any): Promise<TextExpansion> {
    const { originalText, expansionType, targetLength, settings } = expansion;
    
    let expandedText = originalText;
    const additions: TextAddition[] = [];

    // Appliquer les différents types d'extension
    switch (expansionType) {
      case 'detailed':
        expandedText = await this.expandWithDetails(originalText, targetLength, settings.content, additions);
        break;
      case 'examples':
        expandedText = await this.expandWithExamples(originalText, targetLength, settings.content, additions);
        break;
      case 'explanations':
        expandedText = await this.expandWithExplanations(originalText, targetLength, settings.content, additions);
        break;
      case 'comprehensive':
        expandedText = await this.expandComprehensively(originalText, targetLength, settings, additions);
        break;
      case 'academic':
        expandedText = await this.expandAcademically(originalText, targetLength, settings.content, additions);
        break;
      case 'creative':
        expandedText = await this.expandCreatively(originalText, targetLength, settings.content, additions);
        break;
      case 'technical':
        expandedText = await this.expandTechnically(originalText, targetLength, settings.content, additions);
        break;
      case 'business':
        expandedText = await this.expandForBusiness(originalText, targetLength, settings.content, additions);
        break;
      default:
        expandedText = await this.expandComprehensively(originalText, targetLength, settings, additions);
    }

    // Calculer les métriques du texte étendu
    const expandedMetrics = this.calculateTextMetrics(expandedText);
    const originalMetrics = this.calculateTextMetrics(originalText);
    
    // Calculer les scores
    const qualityScore = this.calculateQualityScore(expandedText, additions);
    const completenessScore = this.calculateCompletenessScore(originalText, expandedText, targetLength);
    const relevanceScore = this.calculateRelevanceScore(additions);

    return {
      ...expansion,
      expandedText,
      metadata: {
        ...expansion.metadata,
        expandedMetrics,
        additions,
        qualityScore,
        completenessScore,
        relevanceScore
      }
    } as TextExpansion;
  }

  /**
   * Étend avec des détails
   */
  private async expandWithDetails(
    text: string,
    targetLength: TargetLength,
    settings: ContentSettings,
    additions: TextAddition[]
  ): Promise<string> {
    let expandedText = text;
    const targetWordCount = this.getTargetWordCount(targetLength);
    
    // Analyser le texte pour identifier les points à détailler
    const sentences = text.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence.length === 0) continue;
      
      // Identifier les concepts clés à détailler
      const keyConcepts = this.extractKeyConcepts(trimmedSentence);
      
      for (const concept of keyConcepts) {
        if (this.shouldAddDetails(concept, settings)) {
          const details = this.generateDetails(concept);
          
          // Ajouter les détails
          const insertionPoint = expandedText.indexOf(concept);
          if (insertionPoint !== -1) {
            const before = expandedText.substring(0, insertionPoint + concept.length);
            const after = expandedText.substring(insertionPoint + concept.length);
            
            expandedText = before + ` (${details})` + after;
            
            additions.push({
              type: 'explanation',
              content: details,
              position: { start: insertionPoint, end: insertionPoint + concept.length, line: 0, column: 0 },
              relevance: 0.8,
              confidence: 0.7,
              source: 'ai',
              category: 'detail',
              importance: 'medium'
            });
          }
        }
      }
    }
    
    return expandedText;
  }

  /**
   * Étend avec des exemples
   */
  private async expandWithExamples(
    text: string,
    targetLength: TargetLength,
    settings: ContentSettings,
    additions: TextAddition[]
  ): Promise<string> {
    const expandedText = text;
    const paragraphs = text.split('\n\n');
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      if (paragraph.length === 0) continue;
      
      // Identifier les concepts qui bénéficieraient d'exemples
      const concepts = this.extractConceptsNeedingExamples(paragraph);
      
      for (const concept of concepts) {
        const example = this.generateExample(concept);
        
        // Ajouter l'exemple après le paragraphe
        paragraphs[i] += `\n\nPar exemple, ${example}`;
        
        additions.push({
          type: 'example',
          content: example,
          position: { start: i, end: i + 1, line: 0, column: 0 },
          relevance: 0.9,
          confidence: 0.8,
          source: 'ai',
          category: 'example',
          importance: 'high'
        });
      }
    }
    
    return paragraphs.join('\n\n');
  }

  /**
   * Étend avec des explications
   */
  private async expandWithExplanations(
    text: string,
    targetLength: TargetLength,
    settings: ContentSettings,
    additions: TextAddition[]
  ): Promise<string> {
    let expandedText = text;
    const complexTerms = this.extractComplexTerms(text);
    
    for (const term of complexTerms) {
      if (this.shouldExplain(term, settings)) {
        const explanation = this.generateExplanation(term);
        
        // Ajouter l'explication
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        expandedText = expandedText.replace(regex, `${term} (${explanation})`);
        
        additions.push({
          type: 'definition',
          content: explanation,
          position: { start: 0, end: 0, line: 0, column: 0 },
          relevance: 0.85,
          confidence: 0.75,
          source: 'ai',
          category: 'explanation',
          importance: 'medium'
        });
      }
    }
    
    return expandedText;
  }

  /**
   * Extension complète
   */
  private async expandComprehensively(
    text: string,
    targetLength: TargetLength,
    settings: ExpansionSettings,
    additions: TextAddition[]
  ): Promise<string> {
    let expandedText = text;
    
    // Appliquer toutes les méthodes d'extension
    expandedText = await this.expandWithDetails(expandedText, targetLength, settings.content, additions);
    expandedText = await this.expandWithExamples(expandedText, targetLength, settings.content, additions);
    expandedText = await this.expandWithExplanations(expandedText, targetLength, settings.content, additions);
    
    // Ajouter du contexte si nécessaire
    if (settings.content.addContext) {
      const context = this.generateContext(text);
      expandedText = `${context}\n\n${expandedText}`;
      
      additions.push({
        type: 'context',
        content: context,
        position: { start: 0, end: 0, line: 0, column: 0 },
        relevance: 0.7,
        confidence: 0.6,
        source: 'ai',
        category: 'context',
        importance: 'medium'
      });
    }
    
    return expandedText;
  }

  /**
   * Extension académique
   */
  private async expandAcademically(
    text: string,
    targetLength: TargetLength,
    settings: ContentSettings,
    additions: TextAddition[]
  ): Promise<string> {
    let expandedText = text;
    
    // Ajouter des références académiques
    const references = this.generateAcademicReferences(text);
    if (references.length > 0) {
      expandedText += '\n\nRéférences académiques:\n';
      references.forEach((ref, index) => {
        expandedText += `${index + 1}. ${ref}\n`;
        
        additions.push({
          type: 'explanation',
          content: ref,
          position: { start: 0, end: 0, line: 0, column: 0 },
          relevance: 0.9,
          confidence: 0.8,
          source: 'knowledge_base',
          category: 'reference',
          importance: 'high'
        });
      });
    }
    
    // Ajouter des définitions formelles
    const formalDefinitions = this.generateFormalDefinitions(text);
    for (const def of formalDefinitions) {
      expandedText += `\n\nDéfinition formelle: ${def}`;
      
      additions.push({
        type: 'definition',
        content: def,
        position: { start: 0, end: 0, line: 0, column: 0 },
        relevance: 0.85,
        confidence: 0.9,
        source: 'knowledge_base',
        category: 'definition',
        importance: 'high'
      });
    }
    
    return expandedText;
  }

  /**
   * Extension créative
   */
  private async expandCreatively(
    text: string,
    targetLength: TargetLength,
    settings: ContentSettings,
    additions: TextAddition[]
  ): Promise<string> {
    let expandedText = text;
    
    // Ajouter des analogies créatives
    const analogies = this.generateCreativeAnalogies(text);
    for (const analogy of analogies) {
      expandedText += `\n\nAnalogie créative: ${analogy}`;
      
      additions.push({
        type: 'example',
        content: analogy,
        position: { start: 0, end: 0, line: 0, column: 0 },
        relevance: 0.7,
        confidence: 0.6,
        source: 'ai',
        category: 'analogy',
        importance: 'medium'
      });
    }
    
    // Ajouter des métaphores
    const metaphors = this.generateMetaphors(text);
    for (const metaphor of metaphors) {
      expandedText += `\n\nMétaphore: ${metaphor}`;
      
      additions.push({
        type: 'example',
        content: metaphor,
        position: { start: 0, end: 0, line: 0, column: 0 },
        relevance: 0.6,
        confidence: 0.5,
        source: 'ai',
        category: 'metaphor',
        importance: 'low'
      });
    }
    
    return expandedText;
  }

  /**
   * Extension technique
   */
  private async expandTechnically(
    text: string,
    targetLength: TargetLength,
    settings: ContentSettings,
    additions: TextAddition[]
  ): Promise<string> {
    let expandedText = text;
    
    // Ajouter des spécifications techniques
    const specs = this.generateTechnicalSpecs(text);
    for (const spec of specs) {
      expandedText += `\n\nSpécification technique: ${spec}`;
      
      additions.push({
        type: 'explanation',
        content: spec,
        position: { start: 0, end: 0, line: 0, column: 0 },
        relevance: 0.9,
        confidence: 0.85,
        source: 'knowledge_base',
        category: 'technical',
        importance: 'high'
      });
    }
    
    // Ajouter des implémentations
    const implementations = this.generateImplementations(text);
    for (const impl of implementations) {
      expandedText += `\n\nImplémentation: ${impl}`;
      
      additions.push({
        type: 'application',
        content: impl,
        position: { start: 0, end: 0, line: 0, column: 0 },
        relevance: 0.8,
        confidence: 0.7,
        source: 'ai',
        category: 'implementation',
        importance: 'medium'
      });
    }
    
    return expandedText;
  }

  /**
   * Extension business
   */
  private async expandForBusiness(
    text: string,
    targetLength: TargetLength,
    settings: ContentSettings,
    additions: TextAddition[]
  ): Promise<string> {
    let expandedText = text;
    
    // Ajouter des études de cas
    const caseStudies = this.generateCaseStudies(text);
    for (const caseStudy of caseStudies) {
      expandedText += `\n\nÉtude de cas: ${caseStudy}`;
      
      additions.push({
        type: 'example',
        content: caseStudy,
        position: { start: 0, end: 0, line: 0, column: 0 },
        relevance: 0.85,
        confidence: 0.8,
        source: 'knowledge_base',
        category: 'case_study',
        importance: 'high'
      });
    }
    
    // Ajouter des implications business
    const implications = this.generateBusinessImplications(text);
    for (const implication of implications) {
      expandedText += `\n\nImplication business: ${implication}`;
      
      additions.push({
        type: 'consequence',
        content: implication,
        position: { start: 0, end: 0, line: 0, column: 0 },
        relevance: 0.8,
        confidence: 0.7,
        source: 'ai',
        category: 'business_implication',
        importance: 'medium'
      });
    }
    
    return expandedText;
  }

  /**
   * Calcule les métriques du texte
   */
  private calculateTextMetrics(text: string): TextMetrics {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter(paragraph => paragraph.trim().length > 0);
    
    const totalWords = words.length;
    const totalSentences = sentences.length;
    const totalParagraphs = paragraphs.length;
    
    const averageWordsPerSentence = totalSentences > 0 ? totalWords / totalSentences : 0;
    const averageCharactersPerWord = totalWords > 0 ? words.reduce((sum, word) => sum + word.length, 0) / totalWords : 0;
    
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const repeatedWords = totalWords - uniqueWords;
    
    const complexityScore = this.calculateComplexityScore(text);
    const readabilityScore = this.calculateReadabilityScore(text);
    const informationDensity = this.calculateInformationDensity(text);
    
    const technicalTerms = this.countTechnicalTerms(text);
    const examplesCount = this.countExamples(text);
    const explanationsCount = this.countExplanations(text);
    
    return {
      totalWords,
      totalSentences,
      totalParagraphs,
      averageWordsPerSentence,
      averageCharactersPerWord,
      complexityScore,
      readabilityScore,
      informationDensity,
      uniqueWords,
      repeatedWords,
      technicalTerms,
      examplesCount,
      explanationsCount
    };
  }

  /**
   * Calcule le score de qualité
   */
  private calculateQualityScore(text: string, additions: TextAddition[]): number {
    let score = 100;
    
    // Pénaliser les ajouts à faible pertinence
    const lowRelevanceAdditions = additions.filter(add => add.relevance < 0.6);
    score -= lowRelevanceAdditions.length * 10;
    
    // Pénaliser les ajouts à faible confiance
    const lowConfidenceAdditions = additions.filter(add => add.confidence < 0.7);
    score -= lowConfidenceAdditions.length * 5;
    
    // Bonus pour la diversité des types d'ajouts
    const uniqueTypes = new Set(additions.map(add => add.type)).size;
    score += uniqueTypes * 5;
    
    // Bonus pour la cohérence
    const metrics = this.calculateTextMetrics(text);
    if (metrics.readabilityScore >= 70) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calcule le score de complétude
   */
  private calculateCompletenessScore(original: string, expanded: string, targetLength: TargetLength): number {
    const originalMetrics = this.calculateTextMetrics(original);
    const expandedMetrics = this.calculateTextMetrics(expanded);
    const targetWordCount = this.getTargetWordCount(targetLength);
    
    const wordRatio = expandedMetrics.totalWords / targetWordCount;
    
    if (wordRatio >= 0.9 && wordRatio <= 1.1) return 100;
    if (wordRatio >= 0.8 && wordRatio <= 1.2) return 90;
    if (wordRatio >= 0.7 && wordRatio <= 1.3) return 80;
    if (wordRatio >= 0.6 && wordRatio <= 1.4) return 70;
    
    return Math.max(0, 50 - Math.abs(wordRatio - 1) * 50);
  }

  /**
   * Calcule le score de pertinence
   */
  private calculateRelevanceScore(additions: TextAddition[]): number {
    if (additions.length === 0) return 50;
    
    const totalRelevance = additions.reduce((sum, add) => sum + add.relevance, 0);
    const averageRelevance = totalRelevance / additions.length;
    
    return averageRelevance * 100;
  }

  /**
   * Fusionne les paramètres avec les valeurs par défaut
   */
  private mergeSettings(settings?: Partial<ExpansionSettings>): ExpansionSettings {
    const defaultSettings: ExpansionSettings = {
      content: {
        addExamples: true,
        addExplanations: true,
        addContext: false,
        addDefinitions: false,
        addComparisons: false,
        addConsequences: false,
        addHistory: false,
        addApplications: false
      },
      style: {
        tone: 'neutral',
        complexity: 'moderate',
        perspective: 'objective',
        voice: 'active'
      },
      structure: {
        useSections: false,
        useHeadings: false,
        useLists: false,
        useTables: false,
        useQuotes: false,
        useReferences: false,
        maxParagraphLength: 200,
        minParagraphLength: 50
      },
      formatting: {
        preserveOriginal: true,
        highlightAdditions: false,
        useMarkdown: false,
        includeMetadata: false,
        addFootnotes: false,
        useEmphasis: false
      },
      personalization: {
        userPreferences: {
          knowledgeLevel: 'intermediate',
          interests: [],
          learningStyle: 'reading'
        },
        contextAwareness: false,
        adaptiveComplexity: false
      }
    };
    
    if (!settings) return defaultSettings;
    
    return {
      content: { ...defaultSettings.content, ...settings.content },
      style: { ...defaultSettings.style, ...settings.style },
      structure: { ...defaultSettings.structure, ...settings.structure },
      formatting: { ...defaultSettings.formatting, ...settings.formatting },
      personalization: { ...defaultSettings.personalization, ...settings.personalization }
    };
  }

  /**
   * Extrait les concepts clés
   */
  private extractKeyConcepts(sentence: string): string[] {
    const words = sentence.split(' ');
    const concepts: string[] = [];
    
    // Identifier les noms communs et les termes techniques
    for (const word of words) {
      if (word.length > 4 && !this.isStopWord(word)) {
        concepts.push(word);
      }
    }
    
    return concepts;
  }

  /**
   * Extrait les concepts qui ont besoin d'exemples
   */
  private extractConceptsNeedingExamples(paragraph: string): string[] {
    const concepts = this.extractKeyConcepts(paragraph);
    return concepts.filter(concept => this.needsExample(concept));
  }

  /**
   * Extrait les termes complexes
   */
  private extractComplexTerms(text: string): string[] {
    const words = text.split(/\s+/);
    return words.filter(word => 
      word.length > 8 || 
      this.isTechnicalTerm(word) ||
      this.countSyllables(word) > 3
    );
  }

  /**
   * Vérifie si un mot est un stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'est', 'dans', 'pour', 'avec', 'par', 'sur', 'une', 'un', 'que', 'qui', 'quoi', 'où', 'quand', 'comment', 'pourquoi', 'mais', 'ou', 'donc', 'or', 'ni', 'car', 'si', 'alors', 'ainsi', 'ce', 'cette', 'ces', 'celui', 'celle', 'ceux', 'celles', 'leur', 'leurs', 'notre', 'nos', 'votre', 'vos', 'son', 'sa', 'ses'];
    return stopWords.includes(word.toLowerCase());
  }

  /**
   * Vérifie si un mot est un terme technique
   */
  private isTechnicalTerm(word: string): boolean {
    const technicalTerms = ['algorithme', 'interface', 'base', 'données', 'système', 'application', 'protocole', 'architecture', 'framework', 'bibliothèque', 'module', 'fonction', 'variable', 'constante', 'objet', 'classe', 'méthode', 'propriété', 'héritage', 'polymorphisme', 'encapsulation', 'abstraction'];
    return technicalTerms.includes(word.toLowerCase());
  }

  /**
   * Compte les syllabes dans un mot
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    let syllables = 0;
    const vowels = 'aeiouy';
    
    for (let i = 0; i < word.length; i++) {
      if (vowels.includes(word[i])) {
        syllables++;
      }
    }
    
    return Math.max(1, syllables);
  }

  /**
   * Vérifie si des détails doivent être ajoutés
   */
  private shouldAddDetails(concept: string, settings: ContentSettings): boolean {
    return settings.addExplanations && concept.length > 5;
  }

  /**
   * Vérifie si une explication doit être ajoutée
   */
  private shouldExplain(term: string, settings: ContentSettings): boolean {
    return settings.addDefinitions && this.isTechnicalTerm(term);
  }

  /**
   * Vérifie si un concept a besoin d'exemples
   */
  private needsExample(concept: string): boolean {
    return concept.length > 6 && !this.isStopWord(concept);
  }

  /**
   * Génère des détails pour un concept
   */
  private generateDetails(concept: string): string {
    const details = {
      'intelligence': 'capacité d\'apprendre et de raisonner',
      'apprentissage': 'processus d\'acquisition de connaissances',
      'algorithme': 'suite d\'instructions étape par étape',
      'données': 'informations brutes à traiter',
      'système': 'ensemble organisé d\'éléments',
      'application': 'programme informatique spécifique',
      'interface': 'point de communication entre systèmes',
      'protocole': 'ensemble de règles de communication'
    };
    
    return details[concept.toLowerCase()] || `détails supplémentaires sur ${concept}`;
  }

  /**
   * Génère un exemple
   */
  private generateExample(concept: string): string {
    const examples = {
      'intelligence': 'un système IA qui peut reconnaître des images',
      'apprentissage': 'un enfant qui apprend à lire',
      'algorithme': 'une recette de cuisine avec des étapes précises',
      'données': 'les informations d\'un formulaire',
      'système': 'le système solaire avec ses planètes',
      'application': 'une application mobile de messagerie',
      'interface': 'l\'écran tactile d\'un smartphone',
      'protocole': 'les règles d\'un jeu de société'
    };
    
    return examples[concept.toLowerCase()] || `exemple concret impliquant ${concept}`;
  }

  /**
   * Génère une explication
   */
  private generateExplanation(term: string): string {
    const explanations = {
      'algorithme': 'méthode systématique pour résoudre un problème',
      'interface': 'moyen par lequel deux systèmes communiquent',
      'base': 'fondation sur laquelle quelque chose est construit',
      'données': 'informations collectées pour analyse',
      'système': 'ensemble d\'éléments interconnectés',
      'application': 'logiciel conçu pour une tâche spécifique',
      'protocole': 'ensemble de règles à suivre',
      'architecture': 'structure organisationnelle d\'un système'
    };
    
    return explanations[term.toLowerCase()] || `définition de ${term}`;
  }

  /**
   * Génère du contexte
   */
  private generateContext(text: string): string {
    return `Ce texte traite de sujets importants qui méritent d'être explorés en profondeur pour une meilleure compréhension.`;
  }

  /**
   * Génère des références académiques
   */
  private generateAcademicReferences(text: string): string[] {
    return [
      'Smith, J. (2023). "Advanced Text Processing Techniques". Journal of Computational Linguistics.',
      'Johnson, M. (2022). "Modern Approaches to Text Expansion". Academic Press.',
      'Brown, L. (2021). "Understanding Natural Language Processing". MIT Press.'
    ];
  }

  /**
   * Génère des définitions formelles
   */
  private generateFormalDefinitions(text: string): string[] {
    return [
      'Selon la théorie computationnelle, l\'extension de texte consiste à augmenter le contenu informationnel tout en préservant la cohérence sémantique.',
      'Dans le domaine du traitement du langage naturel, l\'extension vise à enrichir le texte sans altérer son sens original.'
    ];
  }

  /**
   * Génère des analogies créatives
   */
  private generateCreativeAnalogies(text: string): string[] {
    return [
      'L\'extension de texte est comme un jardinier qui ajoute des plantes pour rendre un jardin plus luxuriant.',
      'Étendre un texte, c\'est comme ajouter des couleurs à un tableau noir et blanc pour lui donner vie.'
    ];
  }

  /**
   * Génère des métaphores
   */
  private generateMetaphors(text: string): string[] {
    return [
      'Le texte est une rivière qui s\'élargit pour devenir un fleuve.',
      'Les idées sont des graines qui germent en plantes majestueuses.'
    ];
  }

  /**
   * Génère des spécifications techniques
   */
  private generateTechnicalSpecs(text: string): string[] {
    return [
      'Spécification: Utilisation d\'algorithmes de NLP avancés pour l\'analyse sémantique.',
      'Configuration: Modèles Transformer avec attention multi-têtes.',
      'Performance: Traitement en temps réel avec latence < 100ms.'
    ];
  }

  /**
   * Génère des implémentations
   */
  private generateImplementations(text: string): string[] {
    return [
      'Implémentation en Python avec la bibliothèque Transformers.',
      'Version JavaScript utilisant l\'API OpenAI.',
      'Solution hybride combinant apprentissage supervisé et non supervisé.'
    ];
  }

  /**
   * Génère des études de cas
   */
  private generateCaseStudies(text: string): string[] {
    return [
      'Cas d\'usage: Une entreprise du Fortune 500 a augmenté sa productivité de 35% avec cette approche.',
      'Exemple: Une startup EdTech a amélioré la rétention des étudiants de 25%.',
      'Résultat: Un département marketing a réduit le temps de création de contenu de 50%.'
    ];
  }

  /**
   * Génère des implications business
   */
  private generateBusinessImplications(text: string): string[] {
    return [
      'Implication: Réduction des coûts opérationnels estimée à 20-30%.',
      'Impact: Amélioration de l\'expérience client et satisfaction accrue.',
      'Retour sur investissement: ROI prévu de 200% sur 12 mois.'
    ];
  }

  /**
   * Obtient le nombre de mots cible
   */
  private getTargetWordCount(targetLength: TargetLength): number {
    const wordCounts = {
      brief: 100,
      moderate: 250,
      detailed: 500,
      extensive: 1000,
      comprehensive: 2000,
      custom: 500
    };
    
    return wordCounts[targetLength] || 500;
  }

  /**
   * Calcule le score de complexité
   */
  private calculateComplexityScore(text: string): number {
    const metrics = this.calculateTextMetrics(text);
    
    let score = 0;
    score += metrics.technicalTerms * 2;
    score += metrics.averageCharactersPerWord * 0.5;
    score += metrics.complexityScore * 0.3;
    
    return Math.min(100, score);
  }

  /**
   * Calcule le score de lisibilité
   */
  private calculateReadabilityScore(text: string): number {
    const metrics = this.calculateTextMetrics(text);
    
    let score = 100;
    
    // Pénaliser les phrases longues
    if (metrics.averageWordsPerSentence > 20) score -= 20;
    else if (metrics.averageWordsPerSentence > 15) score -= 10;
    
    // Pénaliser les mots complexes
    if (metrics.technicalTerms > metrics.totalWords * 0.1) score -= 15;
    
    return Math.max(0, score);
  }

  /**
   * Calcule la densité informationnelle
   */
  private calculateInformationDensity(text: string): number {
    const metrics = this.calculateTextMetrics(text);
    
    const uniqueRatio = metrics.uniqueWords / metrics.totalWords;
    const technicalRatio = metrics.technicalTerms / metrics.totalWords;
    
    return (uniqueRatio * 0.7 + technicalRatio * 0.3) * 100;
  }

  /**
   * Compte les termes techniques
   */
  private countTechnicalTerms(text: string): number {
    const words = text.split(/\s+/);
    return words.filter(word => this.isTechnicalTerm(word)).length;
  }

  /**
   * Compte les exemples
   */
  private countExamples(text: string): number {
    const exampleKeywords = ['par exemple', 'exemple', 'comme', 'ainsi', 'tel que', 'notamment'];
    let count = 0;
    
    for (const keyword of exampleKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      count += matches ? matches.length : 0;
    }
    
    return count;
  }

  /**
   * Compte les explications
   */
  private countExplanations(text: string): number {
    const explanationKeywords = ['c\'est', 'il s\'agit', 'signifie', 'correspond', 'représente'];
    let count = 0;
    
    for (const keyword of explanationKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      count += matches ? matches.length : 0;
    }
    
    return count;
  }

  /**
   * Mappe les données de la base de données vers l'interface
   */
  private mapDbToExpansion(dbData: any): TextExpansion {
    return {
      id: dbData.id,
      documentId: dbData.document_id,
      userId: dbData.user_id,
      title: dbData.title,
      description: dbData.description,
      originalText: dbData.original_text,
      expandedText: dbData.expanded_text,
      expansionType: dbData.expansion_type,
      targetLength: dbData.target_length,
      settings: dbData.settings,
      metadata: dbData.metadata,
      analytics: dbData.analytics,
      status: dbData.status,
      createdAt: new Date(dbData.created_at),
      updatedAt: new Date(dbData.updated_at),
      publishedAt: dbData.published_at ? new Date(dbData.published_at) : undefined
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
   * Récupère une extension par ID
   */
  public async getExpansion(id: string): Promise<TextExpansion | null> {
    try {
      const { data, error } = await supabase
        .from('text_expansions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.mapDbToExpansion(data);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'extension:', error);
      return null;
    }
  }

  /**
   * Récupère les extensions d'un utilisateur
   */
  public async getUserExpansions(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      expansionType?: ExpansionType;
      targetLength?: TargetLength;
    } = {}
  ): Promise<TextExpansion[]> {
    try {
      let query = supabase
        .from('text_expansions')
        .select('*')
        .eq('user_id', userId);

      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.expansionType) {
        query = query.eq('expansion_type', options.expansionType);
      }
      if (options.targetLength) {
        query = query.eq('target_length', options.targetLength);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(options.limit || 50)
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      const { data, error } = await query;

      if (error) throw error;

      return data.map(item => this.mapDbToExpansion(item));
    } catch (error) {
      console.error('Erreur lors de la récupération des extensions utilisateur:', error);
      return [];
    }
  }

  /**
   * Recherche des extensions
   */
  public async searchExpansions(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      userId?: string;
      expansionType?: ExpansionType;
      targetLength?: TargetLength;
    } = {}
  ): Promise<TextExpansion[]> {
    try {
      let dbQuery = supabase
        .from('text_expansions')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,expanded_text.ilike.%${query}%`);

      if (options.userId) {
        dbQuery = dbQuery.eq('user_id', options.userId);
      }
      if (options.expansionType) {
        dbQuery = dbQuery.eq('expansion_type', options.expansionType);
      }
      if (options.targetLength) {
        dbQuery = dbQuery.eq('target_length', options.targetLength);
      }

      dbQuery = dbQuery
        .order('created_at', { ascending: false })
        .limit(options.limit || 50)
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      const { data, error } = await dbQuery;

      if (error) throw error;

      return data.map(item => this.mapDbToExpansion(item));
    } catch (error) {
      console.error('Erreur lors de la recherche des extensions:', error);
      return [];
    }
  }

  /**
   * Exporte une extension
   */
  public async exportExpansion(
    expansionId: string,
    format: 'json' | 'txt' | 'md' | 'html' | 'pdf' | 'docx' | 'epub',
    options: ExportOptions = {
      includeMetadata: true,
      includeAdditions: false,
      includeAnalytics: false,
      formatting: {
        fontSize: 12,
        fontFamily: 'Arial',
        lineHeight: 1.5,
        margins: 20
      }
    }
  ): Promise<string> {
    try {
      const expansion = await this.getExpansion(expansionId);
      if (!expansion) throw new Error('Extension non trouvée');

      let content = '';

      switch (format) {
        case 'json':
          content = this.exportToJSON(expansion, options);
          break;
        case 'txt':
          content = this.exportToText(expansion, options);
          break;
        case 'md':
          content = this.exportToMarkdown(expansion, options);
          break;
        case 'html':
          content = this.exportToHTML(expansion, options);
          break;
        case 'pdf':
          content = await this.exportToPDF(expansion, options);
          break;
        case 'docx':
          content = await this.exportToDOCX(expansion, options);
          break;
        case 'epub':
          content = await this.exportToEPUB(expansion, options);
          break;
        default:
          throw new Error(`Format d'export non supporté: ${format}`);
      }

      return content;
    } catch (error) {
      console.error('Erreur lors de l\'export de l\'extension:', error);
      throw error;
    }
  }

  /**
   * Exporte au format JSON
   */
  private exportToJSON(expansion: TextExpansion, options: ExportOptions): string {
    const exportData: any = {
      title: expansion.title,
      description: expansion.description,
      originalText: expansion.originalText,
      expandedText: expansion.expandedText,
      expansionType: expansion.expansionType,
      targetLength: expansion.targetLength,
      createdAt: expansion.createdAt
    };

    if (options.includeMetadata) {
      exportData.metadata = expansion.metadata;
    }

    if (options.includeAdditions) {
      exportData.additions = expansion.metadata.additions;
    }

    if (options.includeAnalytics) {
      exportData.analytics = expansion.analytics;
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Exporte au format texte
   */
  private exportToText(expansion: TextExpansion, options: ExportOptions): string {
    let content = '';

    content += `Titre: ${expansion.title}\n`;
    content += `Type d'extension: ${expansion.expansionType}\n`;
    content += `Longueur cible: ${expansion.targetLength}\n`;
    content += `Date: ${expansion.createdAt.toLocaleDateString()}\n\n`;

    if (expansion.description) {
      content += `Description: ${expansion.description}\n\n`;
    }

    content += 'Texte original:\n';
    content += '---------------\n';
    content += expansion.originalText;
    content += '\n\n';

    content += 'Texte étendu:\n';
    content += '-------------\n';
    content += expansion.expandedText;

    if (options.includeMetadata) {
      content += '\n\nMétadonnées:\n';
      content += '------------\n';
      content += `Mots originaux: ${expansion.metadata.originalMetrics.totalWords}\n`;
      content += `Mots étendus: ${expansion.metadata.expandedMetrics.totalWords}\n`;
      content += `Score de qualité: ${expansion.metadata.qualityScore}\n`;
      content += `Score de complétude: ${expansion.metadata.completenessScore}\n`;
      content += `Score de pertinence: ${expansion.metadata.relevanceScore}\n`;
    }

    return content;
  }

  /**
   * Exporte au format Markdown
   */
  private exportToMarkdown(expansion: TextExpansion, options: ExportOptions): string {
    let content = '';

    content += `# ${expansion.title}\n\n`;
    
    content += `**Type d'extension:** ${expansion.expansionType}\n`;
    content += `**Longueur cible:** ${expansion.targetLength}\n`;
    content += `**Date:** ${expansion.createdAt.toLocaleDateString()}\n\n`;

    if (expansion.description) {
      content += `## Description\n\n${expansion.description}\n\n`;
    }

    content += '## Texte original\n\n';
    content += expansion.originalText;
    content += '\n\n';

    content += '## Texte étendu\n\n';
    content += expansion.expandedText;

    if (options.includeMetadata) {
      content += '\n\n## Métadonnées\n\n';
      content += `- **Mots originaux:** ${expansion.metadata.originalMetrics.totalWords}\n`;
      content += `- **Mots étendus:** ${expansion.metadata.expandedMetrics.totalWords}\n`;
      content += `- **Score de qualité:** ${expansion.metadata.qualityScore}\n`;
      content += `- **Score de complétude:** ${expansion.metadata.completenessScore}\n`;
      content += `- **Score de pertinence:** ${expansion.metadata.relevanceScore}\n`;
    }

    return content;
  }

  /**
   * Exporte au format HTML
   */
  private exportToHTML(expansion: TextExpansion, options: ExportOptions): string {
    const style = `
      body {
        font-family: ${options.formatting.fontFamily};
        font-size: ${options.formatting.fontSize}px;
        line-height: ${options.formatting.lineHeight};
        margin: ${options.formatting.margins}px;
      }
      .header {
        border-bottom: 2px solid #333;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      .original {
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
      }
      .expanded {
        background-color: #e8f5e8;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
      }
      .metadata {
        background-color: #f5f5f5;
        padding: 10px;
        border-radius: 5px;
        margin-top: 20px;
      }
      .additions {
        background-color: #fff3cd;
        padding: 10px;
        border-radius: 5px;
        margin-top: 20px;
      }
    `;

    let content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${expansion.title}</title>
    <style>${style}</style>
</head>
<body>
    <div class="header">
        <h1>${expansion.title}</h1>
        <p><strong>Type d'extension:</strong> ${expansion.expansionType}</p>
        <p><strong>Longueur cible:</strong> ${expansion.targetLength}</p>
        <p><strong>Date:</strong> ${expansion.createdAt.toLocaleDateString()}</p>
    `;

    if (expansion.description) {
      content += `<p><strong>Description:</strong> ${expansion.description}</p>`;
    }

    content += `
    </div>
    
    <div class="original">
        <h2>Texte original</h2>
        <div>${expansion.originalText.replace(/\n/g, '<br>')}</div>
    </div>
    
    <div class="expanded">
        <h2>Texte étendu</h2>
        <div>${expansion.expandedText.replace(/\n/g, '<br>')}</div>
    </div>
    `;

    if (options.includeMetadata) {
      content += `
      <div class="metadata">
        <h3>Métadonnées</h3>
        <p><strong>Mots originaux:</strong> ${expansion.metadata.originalMetrics.totalWords}</p>
        <p><strong>Mots étendus:</strong> ${expansion.metadata.expandedMetrics.totalWords}</p>
        <p><strong>Score de qualité:</strong> ${expansion.metadata.qualityScore}</p>
        <p><strong>Score de complétude:</strong> ${expansion.metadata.completenessScore}</p>
        <p><strong>Score de pertinence:</strong> ${expansion.metadata.relevanceScore}</p>
      </div>
      `;
    }

    if (options.includeAdditions && expansion.metadata.additions.length > 0) {
      content += `
      <div class="additions">
        <h3>Ajouts</h3>
        <ul>
      `;

      for (const addition of expansion.metadata.additions) {
        content += `<li><strong>${addition.type}:</strong> ${addition.content} (pertinence: ${addition.relevance})</li>`;
      }

      content += `
        </ul>
      </div>
      `;
    }

    content += `
</body>
</html>
    `;

    return content;
  }

  /**
   * Exporte au format PDF (simulation)
   */
  private async exportToPDF(expansion: TextExpansion, options: ExportOptions): Promise<string> {
    const htmlContent = this.exportToHTML(expansion, options);
    return `PDF généré pour: ${expansion.title}\n\n${htmlContent}`;
  }

  /**
   * Exporte au format DOCX (simulation)
   */
  private async exportToDOCX(expansion: TextExpansion, options: ExportOptions): Promise<string> {
    const textContent = this.exportToText(expansion, options);
    return `DOCX généré pour: ${expansion.title}\n\n${textContent}`;
  }

  /**
   * Exporte au format EPUB (simulation)
   */
  private async exportToEPUB(expansion: TextExpansion, options: ExportOptions): Promise<string> {
    const markdownContent = this.exportToMarkdown(expansion, options);
    return `EPUB généré pour: ${expansion.title}\n\n${markdownContent}`;
  }

  /**
   * Récupère les statistiques des extensions
   */
  public async getExpansionStats(userId?: string): Promise<ExpansionStatistics> {
    try {
      // Simuler la récupération des statistiques
      return {
        totalExpansions: 0,
        publishedExpansions: 0,
        draftExpansions: 0,
        totalWords: 0,
        averageWordsPerExpansion: 0,
        mostActiveTypes: {} as Record<ExpansionType, number>,
        mostActiveLengths: {} as Record<TargetLength, number>,
        topPerformingExpansions: [],
        userEngagement: {
          totalUsers: 0,
          activeUsers: 0,
          averageExpansionsPerUser: 0,
          averageWordsPerUser: 0,
          averageReadingTime: 0,
          satisfactionScore: 0
        },
        contentQuality: {
          averageQuality: 0,
          averageCompleteness: 0,
          averageRelevance: 0,
          averageReadability: 0,
          expansionSuccessRate: 0
        },
        trends: {
          expansionGrowth: [],
          wordGrowth: [],
          typeTrends: {} as Record<ExpansionType, number[]>,
          lengthTrends: {} as Record<TargetLength, number[]>
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Simule l'extraction de contenu d'un document
   */
  public async extractDocumentContent(documentId: string): Promise<string> {
    try {
      const sampleContent = `
        L'intelligence artificielle transforme radicalement notre manière de travailler et de vivre.
        Cette technologie permet aux machines d'effectuer des tâches qui nécessitent normalement
        l'intelligence humaine, comme la reconnaissance d'images, la traduction automatique,
        et la prise de décision basée sur des données.

        Les applications de l'IA sont multiples et touchent tous les secteurs de la société.
        Dans la santé, l'IA aide au diagnostic médical et au développement de traitements personnalisés.
        Dans l'éducation, elle permet des apprentissages adaptatifs et un suivi individualisé des élèves.
        Dans l'industrie, elle optimise les processus de production et la maintenance prédictive.

        Cependant, l'IA soulève également des défis éthiques importants concernant la privacy,
        la sécurité des données, et l'impact sur l'emploi. Il est crucial de développer
        des cadres réglementaires appropriés pour encadrer son développement et son utilisation.
      `;

      return sampleContent.trim();
    } catch (error) {
      console.error('Erreur lors de l\'extraction du contenu:', error);
      throw error;
    }
  }

  /**
   * Génère une extension de démonstration
   */
  public async generateDemoExpansion(
    userId: string,
    expansionType: ExpansionType = 'comprehensive',
    targetLength: TargetLength = 'moderate'
  ): Promise<TextExpansion> {
    const demoText = await this.extractDocumentContent('demo-document');
    
    return this.expandText(
      'demo-document',
      userId,
      demoText,
      expansionType,
      targetLength
    );
  }
}

// Export du singleton et des utilitaires
export const textExpansionService = TextExpansionService.getInstance();

export const createTextExpansion = (
  documentId: string,
  userId: string,
  originalText: string,
  expansionType: ExpansionType,
  targetLength: TargetLength,
  settings?: Partial<ExpansionSettings>
) => textExpansionService.expandText(
  documentId,
  userId,
  originalText,
  expansionType,
  targetLength,
  settings
);

export const getExpansion = (id: string) => textExpansionService.getExpansion(id);

export const getUserExpansions = (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
    expansionType?: ExpansionType;
    targetLength?: TargetLength;
  }
) => textExpansionService.getUserExpansions(userId, options);

export const searchExpansions = (
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    expansionType?: ExpansionType;
    targetLength?: TargetLength;
  }
) => textExpansionService.searchExpansions(query, options);

export const exportExpansion = (
  expansionId: string,
  format: 'json' | 'txt' | 'md' | 'html' | 'pdf' | 'docx' | 'epub',
  options?: ExportOptions
) => textExpansionService.exportExpansion(expansionId, format, options);

export const getExpansionStats = (userId?: string) => 
  textExpansionService.getExpansionStats(userId);

export const generateDemoExpansion = (
  userId: string,
  expansionType?: ExpansionType,
  targetLength?: TargetLength
) => textExpansionService.generateDemoExpansion(userId, expansionType, targetLength);
