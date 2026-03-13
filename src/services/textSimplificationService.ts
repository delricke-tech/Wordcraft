/**
 * Service de simplification de texte (niveau lecture)
 * 
 * Ce service simplifie automatiquement le contenu pour différents niveaux de lecture,
 * rendant les documents plus accessibles et faciles à comprendre
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Interfaces pour la simplification de texte
export interface TextSimplification {
  id: string;
  documentId: string;
  userId: string;
  title: string;
  description?: string;
  originalText: string;
  simplifiedText: string;
  targetLevel: ReadingLevel;
  originalLevel: ReadingLevel;
  simplificationType: SimplificationType;
  settings: SimplificationSettings;
  metadata: SimplificationMetadata;
  analytics: SimplificationAnalytics;
  status: 'draft' | 'processing' | 'completed' | 'published' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export type ReadingLevel = 'elementary' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'native' | 'custom';

export type SimplificationType = 'vocabulary' | 'sentence' | 'structure' | 'comprehensive' | 'academic' | 'business' | 'technical' | 'creative' | 'custom';

export interface SimplificationSettings {
  vocabulary: VocabularySettings;
  sentence: SentenceSettings;
  structure: StructureSettings;
  formatting: FormattingSettings;
  personalization: PersonalizationSettings;
}

export interface VocabularySettings {
  maxWordLength: number;
  maxSyllablesPerWord: number;
  avoidComplexWords: boolean;
  provideDefinitions: boolean;
  useCommonWords: boolean;
  customDictionary?: string[];
}

export interface SentenceSettings {
  maxWordsPerSentence: number;
  maxSentenceLength: number;
  simpleStructure: boolean;
  useActiveVoice: boolean;
  avoidSubordinateClauses: boolean;
}

export interface StructureSettings {
  maxParagraphLength: number;
  useSimpleConnectors: boolean;
  avoidNestedStructures: boolean;
  maintainLogicalFlow: boolean;
}

export interface FormattingSettings {
  preserveFormatting: boolean;
  useSimplePunctuation: boolean;
  addLineBreaks: boolean;
  highlightChanges: boolean;
}

export interface PersonalizationSettings {
  userPreferences: {
    learningStyle: 'visual' | 'auditory' | 'kinesthetic';
    comprehensionLevel: number;
    preferredLanguage: string;
  };
  contextAwareness: boolean;
  adaptiveDifficulty: boolean;
}

export interface SimplificationMetadata {
  originalMetrics: TextMetrics;
  simplifiedMetrics: TextMetrics;
  changes: TextChange[];
  qualityScore: number;
  readabilityImprovement: number;
  processingTime: number;
  aiModel: string;
  version: string;
}

export interface TextMetrics {
  totalWords: number;
  totalSentences: number;
  totalParagraphs: number;
  averageWordsPerSentence: number;
  averageSyllablesPerWord: number;
  averageCharactersPerWord: number;
  complexWordsCount: number;
  simpleWordsCount: number;
  readabilityScore: number;
  fleschKincaidScore: number;
  colemanLiauIndex: number;
  fogIndex: number;
  smogIndex: number;
  daleChallScore: number;
  spacheScore: number;
  gunningFogIndex: number;
  ariScore: number;
  lexileScore: number;
  vocabularyLevel: number;
  sentenceComplexity: number;
  structureComplexity: number;
}

export interface TextChange {
  type: 'word' | 'sentence' | 'structure' | 'punctuation' | 'format';
  original: string;
  simplified: string;
  position: {
    start: number;
    end: number;
    line: number;
    column: number;
  };
  reason: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  metadata: {
    category: string;
    difficulty: number;
    alternative?: string;
  };
}

export interface SimplificationAnalytics {
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
    tooSimple: number;
    tooComplex: number;
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
    simplificationId: string;
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

export interface QualityMetrics {
  clarity: number;
  coherence: number;
  simplicity: number;
  accuracy: number;
  completeness: number;
  readability: number;
  engagement: number;
  satisfaction: number;
}

export interface SimplificationStatistics {
  totalSimplifications: number;
  publishedSimplifications: number;
  draftSimplifications: number;
  totalWords: number;
  averageWordsPerSimplification: number;
  mostActiveLevels: Record<ReadingLevel, number>;
  mostActiveTypes: Record<SimplificationType, number>;
  topPerformingSimplifications: Array<{
    simplificationId: string;
    title: string;
    viewCount: number;
    averageRating: number;
    wordCount: number;
    improvementScore: number;
  }>;
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    averageSimplificationsPerUser: number;
    averageWordsPerUser: number;
    averageReadingTime: number;
    satisfactionScore: number;
  };
  contentQuality: {
    averageClarity: number;
    averageCoherence: number;
    averageSimplicity: number;
    averageAccuracy: number;
    averageCompleteness: number;
    averageReadability: number;
    extractionSuccessRate: number;
  };
  trends: {
    simplificationGrowth: number[];
    wordGrowth: number[];
    levelTrends: Record<ReadingLevel, number[]>;
    typeTrends: Record<SimplificationType, number[]>;
  };
}

export interface SimplificationAnalytics {
  dailyViews: number[];
  weeklyViews: number[];
  monthlyViews: number[];
  userRetention: number[];
  contentPerformance: Array<{
    simplificationId: string;
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

export interface SimplificationTemplate {
  id: string;
  name: string;
  description: string;
  targetLevel: ReadingLevel;
  simplificationType: SimplificationType;
  prompt: string;
  settings: SimplificationSettings;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SimplificationExport {
  id: string;
  simplificationId: string;
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
  includeChanges: boolean;
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

export interface SimplificationStats {
  totalSimplifications: number;
  averageProcessingTime: number;
  successRate: number;
  errorRate: number;
  averageQualityScore: number;
  userSatisfactionScore: number;
  mostUsedLevel: ReadingLevel;
  mostUsedType: SimplificationType;
}

// Classe principale du service de simplification
export class TextSimplificationService {
  private static instance: TextSimplificationService;
  private eventCallbacks: Map<string, Function[]> = new Map();

  private constructor() {}

  public static getInstance(): TextSimplificationService {
    if (!TextSimplificationService.instance) {
      TextSimplificationService.instance = new TextSimplificationService();
    }
    return TextSimplificationService.instance;
  }

  /**
   * Simplifie un texte selon les paramètres spécifiés
   */
  public async simplifyText(
    documentId: string,
    userId: string,
    originalText: string,
    targetLevel: ReadingLevel,
    simplificationType: SimplificationType,
    settings?: Partial<SimplificationSettings>
  ): Promise<TextSimplification> {
    const startTime = Date.now();
    
    try {
      // Créer la simplification
      const simplification: Partial<TextSimplification> = {
        documentId,
        userId,
        title: `Simplification ${targetLevel} - ${new Date().toLocaleDateString()}`,
        originalText,
        targetLevel,
        originalLevel: this.analyzeReadingLevel(originalText),
        simplificationType,
        settings: this.mergeSettings(settings),
        metadata: {
          originalMetrics: this.calculateTextMetrics(originalText),
          simplifiedMetrics: {} as TextMetrics,
          changes: [],
          qualityScore: 0,
          readabilityImprovement: 0,
          processingTime: 0,
          aiModel: 'text-simplifier-v1.0',
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
            tooSimple: 0,
            tooComplex: 0
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

      // Sauvegarder la simplification initiale
      const { data: savedSimplification, error: saveError } = await supabase
        .from('simplifications')
        .insert([simplification])
        .select()
        .single();

      if (saveError) throw saveError;

      // Émettre l'événement de début
      this.emitEvent('simplification_started', savedSimplification);

      // Traiter la simplification
      const processedSimplification = await this.processSimplification(savedSimplification);

      // Mettre à jour avec le texte simplifié
      const processingTime = Date.now() - startTime;
      processedSimplification.metadata.processingTime = processingTime;
      processedSimplification.status = 'completed';
      processedSimplification.updatedAt = new Date();

      const { data: finalSimplification, error: updateError } = await supabase
        .from('simplifications')
        .update({
          simplified_text: processedSimplification.simplifiedText,
          metadata: processedSimplification.metadata,
          status: processedSimplification.status,
          updated_at: processedSimplification.updatedAt
        })
        .eq('id', savedSimplification.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Émettre l'événement de complétion
      this.emitEvent('simplification_completed', finalSimplification);

      return this.mapDbToSimplification(finalSimplification);

    } catch (error) {
      console.error('Erreur lors de la simplification du texte:', error);
      throw error;
    }
  }

  /**
   * Traite la simplification du texte
   */
  private async processSimplification(simplification: any): Promise<TextSimplification> {
    const { originalText, targetLevel, simplificationType, settings } = simplification;
    
    let simplifiedText = originalText;
    const changes: TextChange[] = [];

    // Appliquer les différents types de simplification
    switch (simplificationType) {
      case 'vocabulary':
        simplifiedText = await this.simplifyVocabulary(originalText, targetLevel, settings.vocabulary, changes);
        break;
      case 'sentence':
        simplifiedText = await this.simplifySentences(originalText, targetLevel, settings.sentence, changes);
        break;
      case 'structure':
        simplifiedText = await this.simplifyStructure(originalText, targetLevel, settings.structure, changes);
        break;
      case 'comprehensive':
        simplifiedText = await this.simplifyComprehensively(originalText, targetLevel, settings, changes);
        break;
      case 'academic':
        simplifiedText = await this.simplifyAcademicContent(originalText, targetLevel, changes);
        break;
      case 'business':
        simplifiedText = await this.simplifyBusinessContent(originalText, targetLevel, changes);
        break;
      case 'technical':
        simplifiedText = await this.simplifyTechnicalContent(originalText, targetLevel, changes);
        break;
      case 'creative':
        simplifiedText = await this.simplifyCreativeContent(originalText, targetLevel, changes);
        break;
      default:
        simplifiedText = await this.simplifyComprehensively(originalText, targetLevel, settings, changes);
    }

    // Calculer les métriques du texte simplifié
    const simplifiedMetrics = this.calculateTextMetrics(simplifiedText);
    const originalMetrics = this.calculateTextMetrics(originalText);
    
    // Calculer le score de qualité
    const qualityScore = this.calculateQualityScore(simplifiedText, targetLevel, changes);
    const readabilityImprovement = this.calculateReadabilityImprovement(originalMetrics, simplifiedMetrics);

    return {
      ...simplification,
      simplifiedText,
      metadata: {
        ...simplification.metadata,
        simplifiedMetrics,
        changes,
        qualityScore,
        readabilityImprovement
      }
    } as TextSimplification;
  }

  /**
   * Simplifie le vocabulaire
   */
  private async simplifyVocabulary(
    text: string,
    level: ReadingLevel,
    settings: VocabularySettings,
    changes: TextChange[]
  ): Promise<string> {
    const words = text.split(' ');
    const complexWords = this.getComplexWordsForLevel(level);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase().replace(/[.,!?;:]/g, '');
      const complexWord = complexWords.find(cw => cw.word.toLowerCase() === word);
      
      if (complexWord && this.shouldReplaceWord(words[i], settings)) {
        const originalWord = words[i];
        words[i] = words[i].replace(word, complexWord.simpleWord);
        
        changes.push({
          type: 'word',
          original: originalWord,
          simplified: words[i],
          position: { start: i, end: i + 1, line: 0, column: 0 },
          reason: `Remplacement de "${complexWord.word}" par "${complexWord.simpleWord}" (${complexWord.definition})`,
          confidence: 0.9,
          impact: this.calculateImpact(complexWord.word, complexWord.simpleWord),
          metadata: {
            category: 'vocabulary',
            difficulty: this.getWordDifficulty(complexWord.word),
            alternative: complexWord.definition
          }
        });
      }
    }
    
    return words.join(' ');
  }

  /**
   * Simplifie les phrases
   */
  private async simplifySentences(
    text: string,
    _level: ReadingLevel,
    settings: SentenceSettings,
    changes: TextChange[]
  ): Promise<string> {
    const sentences = text.split(/[.!?]+/);
    const simplifiedSentences: string[] = [];
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (sentence.length === 0) continue;
      
      const words = sentence.split(' ');
      
      // Si la phrase est trop longue, la diviser
      if (words.length > settings.maxWordsPerSentence) {
        const splitSentences = this.splitLongSentence(sentence, settings.maxWordsPerSentence);
        simplifiedSentences.push(...splitSentences);
        
        changes.push({
          type: 'sentence',
          original: sentence,
          simplified: splitSentences.join('. '),
          position: { start: i, end: i + 1, line: 0, column: 0 },
          reason: `Division d'une phrase trop longue (${words.length} mots)`,
          confidence: 0.8,
          impact: 'medium',
          metadata: {
            category: 'sentence',
            difficulty: this.getSentenceDifficulty(sentence)
          }
        });
      } else {
        simplifiedSentences.push(sentence);
      }
    }
    
    return simplifiedSentences.join('. ');
  }

  /**
   * Simplifie la structure
   */
  private async simplifyStructure(
    text: string,
    _level: ReadingLevel,
    settings: StructureSettings,
    changes: TextChange[]
  ): Promise<string> {
    const paragraphs = text.split('\n\n');
    const simplifiedParagraphs: string[] = [];
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      if (paragraph.length === 0) continue;
      
      // Si le paragraphe est trop long, le diviser
      if (paragraph.length > settings.maxParagraphLength) {
        const splitParagraphs = this.splitLongParagraph(paragraph, settings.maxParagraphLength);
        simplifiedParagraphs.push(...splitParagraphs);
        
        changes.push({
          type: 'structure',
          original: paragraph,
          simplified: splitParagraphs.join('\n\n'),
          position: { start: i, end: i + 1, line: 0, column: 0 },
          reason: `Division d'un paragraphe trop long (${paragraph.length} caractères)`,
          confidence: 0.7,
          impact: 'medium',
          metadata: {
            category: 'structure',
            difficulty: this.getParagraphDifficulty(paragraph)
          }
        });
      } else {
        simplifiedParagraphs.push(paragraph);
      }
    }
    
    return simplifiedParagraphs.join('\n\n');
  }

  /**
   * Simplification complète
   */
  private async simplifyComprehensively(
    text: string,
    level: ReadingLevel,
    settings: SimplificationSettings,
    changes: TextChange[]
  ): Promise<string> {
    let simplifiedText = text;
    
    // Appliquer toutes les simplifications
    simplifiedText = await this.simplifyVocabulary(simplifiedText, level, settings.vocabulary, changes);
    simplifiedText = await this.simplifySentences(simplifiedText, level, settings.sentence, changes);
    simplifiedText = await this.simplifyStructure(simplifiedText, level, settings.structure, changes);
    
    return simplifiedText;
  }

  /**
   * Simplifie le contenu académique
   */
  private async simplifyAcademicContent(
    text: string,
    _level: ReadingLevel,
    changes: TextChange[]
  ): Promise<string> {
    const academicTerms = this.getAcademicTerms();
    let simplifiedText = text;
    
    for (const term of academicTerms) {
      const regex = new RegExp(`\\b${term.term}\\b`, 'gi');
      const matches = simplifiedText.match(regex);
      
      if (matches) {
        simplifiedText = simplifiedText.replace(regex, term.simpleTerm);
        
        changes.push({
          type: 'word',
          original: term.term,
          simplified: term.simpleTerm,
          position: { start: 0, end: 0, line: 0, column: 0 },
          reason: `Remplacement du terme académique "${term.term}" par "${term.simpleTerm}" (${term.explanation})`,
          confidence: 0.85,
          impact: 'high',
          metadata: {
            category: 'academic',
            difficulty: term.difficulty,
            alternative: term.explanation
          }
        });
      }
    }
    
    return simplifiedText;
  }

  /**
   * Simplifie le contenu business
   */
  private async simplifyBusinessContent(
    text: string,
    _level: ReadingLevel,
    changes: TextChange[]
  ): Promise<string> {
    const businessJargon = this.getBusinessJargon();
    let simplifiedText = text;
    
    for (const jargon of businessJargon) {
      const regex = new RegExp(`\\b${jargon.term}\\b`, 'gi');
      const matches = simplifiedText.match(regex);
      
      if (matches) {
        simplifiedText = simplifiedText.replace(regex, jargon.simpleTerm);
        
        changes.push({
          type: 'word',
          original: jargon.term,
          simplified: jargon.simpleTerm,
          position: { start: 0, end: 0, line: 0, column: 0 },
          reason: `Remplacement du jargon business "${jargon.term}" par "${jargon.simpleTerm}" (${jargon.explanation})`,
          confidence: 0.8,
          impact: 'medium',
          metadata: {
            category: 'business',
            difficulty: jargon.difficulty,
            alternative: jargon.explanation
          }
        });
      }
    }
    
    return simplifiedText;
  }

  /**
   * Simplifie le contenu technique
   */
  private async simplifyTechnicalContent(
    text: string,
    _level: ReadingLevel,
    changes: TextChange[]
  ): Promise<string> {
    const technicalTerms = this.getTechnicalTerms();
    let simplifiedText = text;
    
    for (const term of technicalTerms) {
      const regex = new RegExp(`\\b${term.term}\\b`, 'gi');
      const matches = simplifiedText.match(regex);
      
      if (matches) {
        simplifiedText = simplifiedText.replace(regex, term.simpleTerm);
        
        changes.push({
          type: 'word',
          original: term.term,
          simplified: term.simpleTerm,
          position: { start: 0, end: 0, line: 0, column: 0 },
          reason: `Remplacement du terme technique "${term.term}" par "${term.simpleTerm}" (${term.explanation})`,
          confidence: 0.9,
          impact: 'high',
          metadata: {
            category: 'technical',
            difficulty: term.difficulty,
            alternative: term.explanation
          }
        });
      }
    }
    
    return simplifiedText;
  }

  /**
   * Simplifie le contenu créatif
   */
  private async simplifyCreativeContent(
    text: string,
    _level: ReadingLevel,
    changes: TextChange[]
  ): Promise<string> {
    // Utiliser des analogies et des exemples créatifs
    const creativeAnalogies = this.getCreativeAnalogies();
    let simplifiedText = text;
    
    for (const analogy of creativeAnalogies) {
      const regex = new RegExp(`\\b${analogy.complexConcept}\\b`, 'gi');
      const matches = simplifiedText.match(regex);
      
      if (matches) {
        simplifiedText = simplifiedText.replace(regex, analogy.simpleExplanation);
        
        changes.push({
          type: 'word',
          original: analogy.complexConcept,
          simplified: analogy.simpleExplanation,
          position: { start: 0, end: 0, line: 0, column: 0 },
          reason: `Remplacement du concept complexe "${analogy.complexConcept}" par une analogie créative`,
          confidence: 0.75,
          impact: 'medium',
          metadata: {
            category: 'creative',
            difficulty: analogy.difficulty,
            alternative: analogy.analogy
          }
        });
      }
    }
    
    return simplifiedText;
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
    const averageSyllablesPerWord = totalWords > 0 ? words.reduce((sum, word) => sum + this.countSyllables(word), 0) / totalWords : 0;
    
    const complexWords = words.filter(word => this.isComplexWord(word));
    const complexWordsCount = complexWords.length;
    const simpleWordsCount = totalWords - complexWordsCount;
    
    // Calculer les différents scores de lisibilité
    const readabilityScore = this.calculateReadabilityScore(text);
    const fleschKincaidScore = this.calculateFleschKincaidScore(text);
    const colemanLiauIndex = this.calculateColemanLiauIndex(text);
    const fogIndex = this.calculateFogIndex(text);
    const smogIndex = this.calculateSmogIndex(text);
    const daleChallScore = this.calculateDaleChallScore(text);
    const spacheScore = this.calculateSpacheScore(text);
    const gunningFogIndex = this.calculateGunningFogIndex(text);
    const ariScore = this.calculateARI(text);
    const lexileScore = this.calculateLexileScore(text);
    
    const vocabularyLevel = (complexWordsCount / totalWords) * 100;
    const sentenceComplexity = (averageWordsPerSentence / 20) * 100;
    const structureComplexity = (totalParagraphs / totalSentences) * 100;
    
    return {
      totalWords,
      totalSentences,
      totalParagraphs,
      averageWordsPerSentence,
      averageSyllablesPerWord,
      averageCharactersPerWord,
      complexWordsCount,
      simpleWordsCount,
      readabilityScore,
      fleschKincaidScore,
      colemanLiauIndex,
      fogIndex,
      smogIndex,
      daleChallScore,
      spacheScore,
      gunningFogIndex,
      ariScore,
      lexileScore,
      vocabularyLevel,
      sentenceComplexity,
      structureComplexity
    };
  }

  /**
   * Calcule le score de qualité
   */
  private calculateQualityScore(text: string, targetLevel: ReadingLevel, changes: TextChange[]): number {
    let score = 100;
    
    // Pénaliser les changements avec faible confiance
    const lowConfidenceChanges = changes.filter(change => change.confidence < 0.7);
    score -= lowConfidenceChanges.length * 5;
    
    // Pénaliser les changements à fort impact
    const highImpactChanges = changes.filter(change => change.impact === 'high' || change.impact === 'critical');
    score -= highImpactChanges.length * 3;
    
    // Bonus pour la cohérence
    const metrics = this.calculateTextMetrics(text);
    if (metrics.averageWordsPerSentence <= this.getMaxWordsPerSentence(targetLevel)) {
      score += 10;
    }
    
    if (metrics.readabilityScore >= this.getMinReadabilityScore(targetLevel)) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calcule l'amélioration de la lisibilité
   */
  private calculateReadabilityImprovement(original: TextMetrics, simplified: TextMetrics): number {
    const originalScore = original.readabilityScore;
    const simplifiedScore = simplified.readabilityScore;
    
    return ((simplifiedScore - originalScore) / originalScore) * 100;
  }

  /**
   * Analyse le niveau de lecture d'un texte
   */
  private analyzeReadingLevel(text: string): ReadingLevel {
    const metrics = this.calculateTextMetrics(text);
    
    if (metrics.readabilityScore >= 90) return 'elementary';
    if (metrics.readabilityScore >= 80) return 'beginner';
    if (metrics.readabilityScore >= 70) return 'intermediate';
    if (metrics.readabilityScore >= 60) return 'advanced';
    if (metrics.readabilityScore >= 50) return 'expert';
    
    return 'native';
  }

  /**
   * Fusionne les paramètres avec les valeurs par défaut
   */
  private mergeSettings(settings?: Partial<SimplificationSettings>): SimplificationSettings {
    const defaultSettings: SimplificationSettings = {
      vocabulary: {
        maxWordLength: 8,
        maxSyllablesPerWord: 2,
        avoidComplexWords: true,
        provideDefinitions: false,
        useCommonWords: true
      },
      sentence: {
        maxWordsPerSentence: 15,
        maxSentenceLength: 100,
        simpleStructure: true,
        useActiveVoice: true,
        avoidSubordinateClauses: true
      },
      structure: {
        maxParagraphLength: 200,
        useSimpleConnectors: true,
        avoidNestedStructures: true,
        maintainLogicalFlow: true
      },
      formatting: {
        preserveFormatting: true,
        useSimplePunctuation: true,
        addLineBreaks: false,
        highlightChanges: false
      },
      personalization: {
        userPreferences: {
          learningStyle: 'visual',
          comprehensionLevel: 0.7,
          preferredLanguage: 'fr'
        },
        contextAwareness: false,
        adaptiveDifficulty: false
      }
    };
    
    if (!settings) return defaultSettings;
    
    return {
      vocabulary: { ...defaultSettings.vocabulary, ...settings.vocabulary },
      sentence: { ...defaultSettings.sentence, ...settings.sentence },
      structure: { ...defaultSettings.structure, ...settings.structure },
      formatting: { ...defaultSettings.formatting, ...settings.formatting },
      personalization: { ...defaultSettings.personalization, ...settings.personalization }
    };
  }

  /**
   * Vérifie si un mot doit être remplacé
   */
  private shouldReplaceWord(word: string, settings: VocabularySettings): boolean {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
    
    if (cleanWord.length > settings.maxWordLength) return true;
    if (this.countSyllables(cleanWord) > settings.maxSyllablesPerWord) return true;
    if (settings.avoidComplexWords && this.isComplexWord(cleanWord)) return true;
    
    return false;
  }

  /**
   * Divise une phrase longue
   */
  private splitLongSentence(sentence: string, maxWords: number): string[] {
    const words = sentence.split(' ');
    const sentences: string[] = [];
    
    for (let i = 0; i < words.length; i += maxWords) {
      const chunk = words.slice(i, i + maxWords).join(' ');
      sentences.push(chunk);
    }
    
    return sentences;
  }

  /**
   * Divise un paragraphe long
   */
  private splitLongParagraph(paragraph: string, maxLength: number): string[] {
    const sentences = paragraph.split(/[.!?]+/);
    const paragraphs: string[] = [];
    let currentParagraph = '';
    
    for (const sentence of sentences) {
      if ((currentParagraph + sentence).length > maxLength) {
        if (currentParagraph) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = sentence;
        } else {
          // La phrase est trop longue, la diviser
          const words = sentence.split(' ');
          let currentSentence = '';
          
          for (const word of words) {
            if ((currentSentence + word).length > maxLength) {
              if (currentSentence) {
                paragraphs.push(currentSentence.trim());
                currentSentence = word;
              } else {
                // Le mot est trop long, le garder tel quel
                paragraphs.push(word);
              }
            } else {
              currentSentence += (currentSentence ? ' ' : '') + word;
            }
          }
          
          if (currentSentence) {
            currentParagraph = currentSentence;
          }
        }
      } else {
        currentParagraph += (currentParagraph ? ' ' : '') + sentence;
      }
    }
    
    if (currentParagraph) {
      paragraphs.push(currentParagraph.trim());
    }
    
    return paragraphs;
  }

  /**
   * Calcule l'impact d'un changement
   */
  private calculateImpact(original: string, simplified: string): 'low' | 'medium' | 'high' | 'critical' {
    const lengthDiff = Math.abs(original.length - simplified.length);
    const complexityDiff = this.getWordDifficulty(original) - this.getWordDifficulty(simplified);
    
    if (complexityDiff > 3) return 'critical';
    if (complexityDiff > 2 || lengthDiff > 5) return 'high';
    if (complexityDiff > 1 || lengthDiff > 2) return 'medium';
    
    return 'low';
  }

  /**
   * Obtient les mots complexes pour un niveau
   */
  private getComplexWordsForLevel(level: ReadingLevel): Array<{ word: string; simpleWord: string; definition: string; syllables: number }> {
    const complexWordsByLevel = {
      elementary: [
        { word: 'comprendre', simpleWord: 'comprendre', definition: 'saisir ce que ça veut dire', syllables: 2 },
        { word: 'difficile', simpleWord: 'difficile', definition: 'pas facile', syllables: 3 },
        { word: 'important', simpleWord: 'important', definition: 'très important', syllables: 3 },
        { word: 'très', simpleWord: 'très', definition: 'beaucoup', syllables: 1 }
      ],
      beginner: [
        { word: 'comprendre', simpleWord: 'comprendre', definition: 'saisir ce que ça veut dire', syllables: 2 },
        { word: 'difficile', simpleWord: 'difficile', definition: 'pas facile', syllables: 3 },
        { word: 'important', simpleWord: 'important', definition: 'très important', syllables: 3 },
        { word: 'très', simpleWord: 'très', definition: 'beaucoup', syllables: 1 },
        { word: 'complexe', simpleWord: 'compliqué', definition: 'compliqué', syllables: 2 },
        { word: 'facile', simpleWord: 'facile', definition: 'pas difficile', syllables: 2 }
      ],
      intermediate: [
        { word: 'comprendre', simpleWord: 'comprendre', definition: 'saisir ce que ça veut dire', syllables: 2 },
        { word: 'difficile', simpleWord: 'difficile', definition: 'pas facile', syllables: 3 },
        { word: 'important', simpleWord: 'important', definition: 'très important', syllables: 3 },
        { word: 'très', simpleWord: 'très', definition: 'beaucoup', syllables: 1 },
        { word: 'complexe', simpleWord: 'compliqué', definition: 'compliqué', syllables: 2 },
        { word: 'facile', simpleWord: 'facile', definition: 'pas difficile', syllables: 2 },
        { word: 'nécessaire', simpleWord: 'nécessaire', definition: 'indispensable', syllables: 3 },
        { word: 'suffisant', simpleWord: 'suffisant', definition: 'assez', syllables: 3 },
        { word: 'généralement', simpleWord: 'souvent', definition: 'la plupart du temps', syllables: 4 }
      ],
      advanced: [
        { word: 'comprendre', simpleWord: 'comprendre', definition: 'saisir ce que ça veut dire', syllables: 2 },
        { word: 'difficile', simpleWord: 'difficile', definition: 'pas facile', syllables: 3 },
        { word: 'important', simpleWord: 'important', definition: 'très important', syllables: 3 },
        { word: 'très', simpleWord: 'très', definition: 'beaucoup', syllables: 1 },
        { word: 'complexe', simpleWord: 'compliqué', definition: 'compliqué', syllables: 2 },
        { word: 'facile', simpleWord: 'facile', definition: 'pas difficile', syllables: 2 },
        { word: 'nécessaire', simpleWord: 'nécessaire', definition: 'indispensable', syllables: 3 },
        { word: 'suffisant', simpleWord: 'suffisant', definition: 'assez', syllables: 3 },
        { word: 'généralement', simpleWord: 'souvent', definition: 'la plupart du temps', syllables: 4 },
        { word: 'essentiel', simpleWord: 'essentiel', definition: 'très important', syllables: 3 },
        { word: 'fondamental', simpleWord: 'fondamental', definition: 'de base', syllables: 3 },
        { word: 'considérable', simpleWord: 'considérable', definition: 'beaucoup', syllables: 4 }
      ],
      expert: [
        { word: 'comprendre', simpleWord: 'comprendre', definition: 'saisir ce que ça veut dire', syllables: 2 },
        { word: 'difficile', simpleWord: 'difficile', definition: 'pas facile', syllables: 3 },
        { word: 'important', simpleWord: 'important', definition: 'très important', syllables: 3 },
        { word: 'très', simpleWord: 'très', definition: 'beaucoup', syllables: 1 },
        { word: 'complexe', simpleWord: 'compliqué', definition: 'compliqué', syllables: 2 },
        { word: 'facile', simpleWord: 'facile', definition: 'pas difficile', syllables: 2 },
        { word: 'nécessaire', simpleWord: 'nécessaire', definition: 'indispensable', syllables: 3 },
        { word: 'suffisant', simpleWord: 'suffisant', definition: 'assez', syllables: 3 },
        { word: 'généralement', simpleWord: 'souvent', definition: 'la plupart du temps', syllables: 4 },
        { word: 'essentiel', simpleWord: 'essentiel', definition: 'très important', syllables: 3 },
        { word: 'fondamental', simpleWord: 'fondamental', definition: 'de base', syllables: 3 },
        { word: 'considérable', simpleWord: 'considérable', definition: 'beaucoup', syllables: 4 },
        { word: 'incontournable', simpleWord: 'incontournable', definition: 'indispensable', syllables: 5 },
        { word: 'indispensable', simpleWord: 'indispensable', definition: 'essentiel', syllables: 4 },
        { word: 'primordial', simpleWord: 'primordial', definition: 'très important', syllables: 3 },
        { word: 'crucial', simpleWord: 'crucial', definition: 'décisif', syllables: 2 }
      ],
      native: [],
      custom: []
    };
    
    return complexWordsByLevel[level] || [];
  }

  /**
   * Obtient les termes académiques
   */
  private getAcademicTerms(): Array<{ term: string; simpleTerm: string; explanation: string; difficulty: number }> {
    return [
      { term: 'hypothèse', simpleTerm: 'idée', explanation: 'une supposition', difficulty: 3 },
      { term: 'méthodologie', simpleTerm: 'méthode', explanation: 'la façon de faire', difficulty: 4 },
      { term: 'paradigme', simpleTerm: 'modèle', explanation: 'un exemple ou un modèle', difficulty: 4 },
      { term: 'épistémologie', simpleTerm: 'connaissance', explanation: 'l\'étude de la connaissance', difficulty: 5 },
      { term: 'herméneutique', simpleTerm: 'interprétation', explanation: 'l\'art d\'interpréter', difficulty: 5 }
    ];
  }

  /**
   * Obtient le jargon business
   */
  private getBusinessJargon(): Array<{ term: string; simpleTerm: string; explanation: string; difficulty: number }> {
    return [
      { term: 'synergie', simpleTerm: 'collaboration', explanation: 'travailler ensemble', difficulty: 3 },
      { term: 'leverager', simpleTerm: 'utiliser', explanation: 'se servir de quelque chose', difficulty: 3 },
      { term: 'pivot', simpleTerm: 'changer', explanation: 'changer de direction', difficulty: 2 },
      { term: 'scalable', simpleTerm: 'grandissant', explanation: 'qui peut grandir', difficulty: 3 },
      { term: 'disruptif', simpleTerm: 'nouveau', explanation: 'qui change tout', difficulty: 3 }
    ];
  }

  /**
   * Obtient les termes techniques
   */
  private getTechnicalTerms(): Array<{ term: string; simpleTerm: string; explanation: string; difficulty: number }> {
    return [
      { term: 'algorithme', simpleTerm: 'recette', explanation: 'des étapes pour résoudre un problème', difficulty: 3 },
      { term: 'interface', simpleTerm: 'connexion', explanation: 'la façon de communiquer', difficulty: 3 },
      { term: 'base de données', simpleTerm: 'stockage', explanation: 'un endroit pour garder des informations', difficulty: 2 },
      { term: 'API', simpleTerm: 'pont', explanation: 'un pont entre programmes', difficulty: 4 },
      { term: 'cloud', simpleTerm: 'internet', explanation: 'les services en ligne', difficulty: 2 }
    ];
  }

  /**
   * Obtient les analogies créatives
   */
  private getCreativeAnalogies(): Array<{ complexConcept: string; simpleExplanation: string; analogy: string; difficulty: number }> {
    return [
      { 
        complexConcept: 'abstrait', 
        simpleExplanation: 'comme un rêve', 
        analogy: 'quelque chose qu\'on ne peut pas toucher', 
        difficulty: 3 
      },
      { 
        complexConcept: 'métaphore', 
        simpleExplanation: 'comme une comparaison', 
        analogy: 'dire que quelque chose est comme autre chose', 
        difficulty: 3 
      },
      { 
        complexConcept: 'paradoxe', 
        simpleExplanation: 'comme une contradiction', 
        analogy: 'quelque chose qui semble opposé mais qui est vrai', 
        difficulty: 4 
      }
    ];
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
    
    // Ajustements pour les règles françaises
    if (word.endsWith('e')) syllables--;
    if (word.endsWith('es')) syllables--;
    if (word.startsWith('h')) syllables++;
    
    return Math.max(1, syllables);
  }

  /**
   * Vérifie si un mot est complexe
   */
  private isComplexWord(word: string): boolean {
    return word.length > 8 || this.countSyllables(word) > 2;
  }

  /**
   * Calcule la difficulté d'un mot
   */
  private getWordDifficulty(word: string): number {
    let difficulty = 0;
    
    // Longueur
    if (word.length > 8) difficulty += 2;
    else if (word.length > 6) difficulty += 1;
    
    // Syllabes
    const syllables = this.countSyllables(word);
    if (syllables > 3) difficulty += 2;
    else if (syllables > 2) difficulty += 1;
    
    // Complexité structurelle
    if (word.includes('tion') || word.includes('ment') || word.includes('ité')) difficulty += 1;
    
    return difficulty;
  }

  /**
   * Calcule la difficulté d'une phrase
   */
  private getSentenceDifficulty(sentence: string): number {
    const words = sentence.split(' ');
    let difficulty = 0;
    
    // Longueur de la phrase
    if (words.length > 20) difficulty += 3;
    else if (words.length > 15) difficulty += 2;
    else if (words.length > 10) difficulty += 1;
    
    // Complexité des mots
    const complexWords = words.filter(word => this.isComplexWord(word));
    difficulty += complexWords.length;
    
    // Structure complexe
    if (sentence.includes('qui') || sentence.includes('que') || sentence.includes('dont')) {
      difficulty += 1;
    }
    
    return difficulty;
  }

  /**
   * Calcule la difficulté d'un paragraphe
   */
  private getParagraphDifficulty(paragraph: string): number {
    const sentences = paragraph.split(/[.!?]+/);
    let difficulty = 0;
    
    for (const sentence of sentences) {
      difficulty += this.getSentenceDifficulty(sentence);
    }
    
    return difficulty / sentences.length;
  }

  /**
   * Calcule le score de lisibilité
   */
  private calculateReadabilityScore(text: string): number {
    const metrics = this.calculateTextMetrics(text);
    
    // Formule simplifiée pour le score de lisibilité
    let score = 100;
    
    // Pénaliser les phrases longues
    if (metrics.averageWordsPerSentence > 20) score -= 20;
    else if (metrics.averageWordsPerSentence > 15) score -= 10;
    else if (metrics.averageWordsPerSentence > 10) score -= 5;
    
    // Pénaliser les mots complexes
    if (metrics.vocabularyLevel > 30) score -= 20;
    else if (metrics.vocabularyLevel > 20) score -= 10;
    else if (metrics.vocabularyLevel > 10) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calcule le score Flesch-Kincaid
   */
  private calculateFleschKincaidScore(text: string): number {
    const metrics = this.calculateTextMetrics(text);
    
    // Formule Flesch-Kincaid adaptée pour le français
    const score = 206.835 - (1.015 * metrics.averageWordsPerSentence) - (84.6 * (metrics.averageSyllablesPerWord / 100));
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calcule l'indice de Coleman-Liau
   */
  private calculateColemanLiauIndex(text: string): number {
    const metrics = this.calculateTextMetrics(text);
    
    // Formule Coleman-Liau
    const L = metrics.averageCharactersPerWord;
    const S = metrics.totalSentences > 0 ? (metrics.totalWords / metrics.totalSentences) : 0;
    
    const score = 5.89 * L - 29.5 * (S / 100) - 15.8;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calcule l'indice de Fog
   */
  private calculateFogIndex(text: string): number {
    const metrics = this.calculateTextMetrics(text);
    
    // Formule Gunning Fog Index
    const complexWords = metrics.complexWordsCount;
    const avgWordsPerSentence = metrics.averageWordsPerSentence;
    
    const score = 0.4 * (avgWordsPerSentence + (100 * (complexWords / metrics.totalWords)));
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calcule l'indice SMOG
   */
  private calculateSmogIndex(text: string): number {
    const metrics = this.calculateTextMetrics(text);
    
    // Formule SMOG simplifiée
    const complexWords = metrics.complexWordsCount;
    const sentences = metrics.totalSentences;
    
    const score = 1.043 * Math.sqrt(complexWords * (30 / sentences)) + 3.1291;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calcule le score Dale-Chall
   */
  private calculateDaleChallScore(text: string): number {
    const metrics = this.calculateTextMetrics(text);
    
    // Formule Dale-Chall simplifiée
    const difficultWords = metrics.complexWordsCount;
    const avgWordsPerSentence = metrics.averageWordsPerSentence;
    
    const score = 0.1579 * (difficultWords / metrics.totalWords * 100) + 0.0496 * avgWordsPerSentence;
    
    return Math.max(0, Math.min(100, 100 - score));
  }

  /**
   * Calcule le score Spache
   */
  private calculateSpacheScore(text: string): number {
    const metrics = this.calculateTextMetrics(text);
    
    // Formule Spache simplifiée pour les jeunes lecteurs
    const difficultWords = metrics.complexWordsCount;
    const avgWordsPerSentence = metrics.averageWordsPerSentence;
    
    const score = 0.141 * (difficultWords / metrics.totalWords * 100) + 0.086 * avgWordsPerSentence;
    
    return Math.max(0, Math.min(100, 100 - score));
  }

  /**
   * Calcule l'indice Gunning Fog
   */
  private calculateGunningFogIndex(text: string): number {
    return this.calculateFogIndex(text);
  }

  /**
   * Calcule l'indice ARI (Automated Readability Index)
   */
  private calculateARI(text: string): number {
    const metrics = this.calculateTextMetrics(text);
    
    // Formule ARI
    const characters = metrics.totalWords * metrics.averageCharactersPerWord;
    const words = metrics.totalWords;
    const sentences = metrics.totalSentences;
    
    const score = 4.71 * (characters / words) + 0.5 * (words / sentences) - 21.43;
    
    return Math.max(0, Math.min(100, 100 - score));
  }

  /**
   * Calcule le score Lexile
   */
  private calculateLexileScore(text: string): number {
    const metrics = this.calculateTextMetrics(text);
    
    // Formule Lexile simplifiée
    const avgSentenceLength = metrics.averageWordsPerSentence;
    const avgWordFrequency = 100 - metrics.vocabularyLevel;
    
    const score = 1000 * (avgSentenceLength * 0.1 + avgWordFrequency * 0.05);
    
    return Math.max(0, Math.min(2000, score));
  }

  /**
   * Obtient le nombre maximum de mots par phrase pour un niveau
   */
  private getMaxWordsPerSentence(level: ReadingLevel): number {
    const maxWordsByLevel = {
      elementary: 8,
      beginner: 10,
      intermediate: 15,
      advanced: 20,
      expert: 25,
      native: 30,
      custom: 15
    };
    
    return maxWordsByLevel[level] || 15;
  }

  /**
   * Obtient le score de lisibilité minimum pour un niveau
   */
  private getMinReadabilityScore(level: ReadingLevel): number {
    const minScoresByLevel = {
      elementary: 90,
      beginner: 80,
      intermediate: 70,
      advanced: 60,
      expert: 50,
      native: 40,
      custom: 70
    };
    
    return minScoresByLevel[level] || 70;
  }

  /**
   * Mappe les données de la base de données vers l'interface
   */
  private mapDbToSimplification(dbData: any): TextSimplification {
    return {
      id: dbData.id,
      documentId: dbData.document_id,
      userId: dbData.user_id,
      title: dbData.title,
      description: dbData.description,
      originalText: dbData.original_text,
      simplifiedText: dbData.simplified_text,
      targetLevel: dbData.target_level,
      originalLevel: dbData.original_level,
      simplificationType: dbData.simplification_type,
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
   * Récupère une simplification par ID
   */
  public async getSimplification(id: string): Promise<TextSimplification | null> {
    try {
      const { data, error } = await supabase
        .from('simplifications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.mapDbToSimplification(data);
    } catch (error) {
      console.error('Erreur lors de la récupération de la simplification:', error);
      return null;
    }
  }

  /**
   * Récupère les simplifications d'un utilisateur
   */
  public async getUserSimplifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      targetLevel?: ReadingLevel;
      simplificationType?: SimplificationType;
    } = {}
  ): Promise<TextSimplification[]> {
    try {
      let query = supabase
        .from('simplifications')
        .select('*')
        .eq('user_id', userId);

      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.targetLevel) {
        query = query.eq('target_level', options.targetLevel);
      }
      if (options.simplificationType) {
        query = query.eq('simplification_type', options.simplificationType);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(options.limit || 50)
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      const { data, error } = await query;

      if (error) throw error;

      return data.map(item => this.mapDbToSimplification(item));
    } catch (error) {
      console.error('Erreur lors de la récupération des simplifications utilisateur:', error);
      return [];
    }
  }

  /**
   * Recherche des simplifications
   */
  public async searchSimplifications(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      userId?: string;
      targetLevel?: ReadingLevel;
      simplificationType?: SimplificationType;
    } = {}
  ): Promise<TextSimplification[]> {
    try {
      let dbQuery = supabase
        .from('simplifications')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,simplified_text.ilike.%${query}%`);

      if (options.userId) {
        dbQuery = dbQuery.eq('user_id', options.userId);
      }
      if (options.targetLevel) {
        dbQuery = dbQuery.eq('target_level', options.targetLevel);
      }
      if (options.simplificationType) {
        dbQuery = dbQuery.eq('simplification_type', options.simplificationType);
      }

      dbQuery = dbQuery
        .order('created_at', { ascending: false })
        .limit(options.limit || 50)
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      const { data, error } = await dbQuery;

      if (error) throw error;

      return data.map(item => this.mapDbToSimplification(item));
    } catch (error) {
      console.error('Erreur lors de la recherche des simplifications:', error);
      return [];
    }
  }

  /**
   * Exporte une simplification
   */
  public async exportSimplification(
    simplificationId: string,
    format: 'json' | 'txt' | 'md' | 'html' | 'pdf' | 'docx' | 'epub',
    options: ExportOptions = {
      includeMetadata: true,
      includeChanges: false,
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
      const simplification = await this.getSimplification(simplificationId);
      if (!simplification) throw new Error('Simplification non trouvée');

      let content = '';

      switch (format) {
        case 'json':
          content = this.exportToJSON(simplification, options);
          break;
        case 'txt':
          content = this.exportToText(simplification, options);
          break;
        case 'md':
          content = this.exportToMarkdown(simplification, options);
          break;
        case 'html':
          content = this.exportToHTML(simplification, options);
          break;
        case 'pdf':
          content = await this.exportToPDF(simplification, options);
          break;
        case 'docx':
          content = await this.exportToDOCX(simplification, options);
          break;
        case 'epub':
          content = await this.exportToEPUB(simplification, options);
          break;
        default:
          throw new Error(`Format d'export non supporté: ${format}`);
      }

      // Enregistrer l'export dans la base de données
      const { error: exportError } = await supabase
        .from('simplification_exports')
        .insert([{
          simplification_id: simplificationId,
          format,
          options,
          status: 'completed',
          created_at: new Date()
        }]);

      if (exportError) console.error('Erreur lors de l\'enregistrement de l\'export:', exportError);

      return content;
    } catch (error) {
      console.error('Erreur lors de l\'export de la simplification:', error);
      throw error;
    }
  }

  /**
   * Exporte au format JSON
   */
  private exportToJSON(simplification: TextSimplification, options: ExportOptions): string {
    const exportData: any = {
      title: simplification.title,
      description: simplification.description,
      simplifiedText: simplification.simplifiedText,
      targetLevel: simplification.targetLevel,
      simplificationType: simplification.simplificationType,
      createdAt: simplification.createdAt
    };

    if (options.includeMetadata) {
      exportData.metadata = simplification.metadata;
    }

    if (options.includeChanges) {
      exportData.changes = simplification.metadata.changes;
    }

    if (options.includeAnalytics) {
      exportData.analytics = simplification.analytics;
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Exporte au format texte
   */
  private exportToText(simplification: TextSimplification, options: ExportOptions): string {
    let content = '';

    content += `Titre: ${simplification.title}\n`;
    content += `Niveau cible: ${simplification.targetLevel}\n`;
    content += `Type de simplification: ${simplification.simplificationType}\n`;
    content += `Date: ${simplification.createdAt.toLocaleDateString()}\n\n`;

    if (simplification.description) {
      content += `Description: ${simplification.description}\n\n`;
    }

    content += 'Texte simplifié:\n';
    content += '----------------\n';
    content += simplification.simplifiedText;

    if (options.includeMetadata) {
      content += '\n\nMétadonnées:\n';
      content += '------------\n';
      content += `Mots originaux: ${simplification.metadata.originalMetrics.totalWords}\n`;
      content += `Mots simplifiés: ${simplification.metadata.simplifiedMetrics.totalWords}\n`;
      content += `Score de qualité: ${simplification.metadata.qualityScore}\n`;
      content += `Amélioration de lisibilité: ${simplification.metadata.readabilityImprovement.toFixed(2)}%\n`;
    }

    return content;
  }

  /**
   * Exporte au format Markdown
   */
  private exportToMarkdown(simplification: TextSimplification, options: ExportOptions): string {
    let content = '';

    content += `# ${simplification.title}\n\n`;
    
    content += `**Niveau cible:** ${simplification.targetLevel}\n`;
    content += `**Type de simplification:** ${simplification.simplificationType}\n`;
    content += `**Date:** ${simplification.createdAt.toLocaleDateString()}\n\n`;

    if (simplification.description) {
      content += `## Description\n\n${simplification.description}\n\n`;
    }

    content += '## Texte simplifié\n\n';
    content += simplification.simplifiedText;

    if (options.includeMetadata) {
      content += '\n\n## Métadonnées\n\n';
      content += `- **Mots originaux:** ${simplification.metadata.originalMetrics.totalWords}\n`;
      content += `- **Mots simplifiés:** ${simplification.metadata.simplifiedMetrics.totalWords}\n`;
      content += `- **Score de qualité:** ${simplification.metadata.qualityScore}\n`;
      content += `- **Amélioration de lisibilité:** ${simplification.metadata.readabilityImprovement.toFixed(2)}%\n`;
    }

    return content;
  }

  /**
   * Exporte au format HTML
   */
  private exportToHTML(simplification: TextSimplification, options: ExportOptions): string {
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
      .metadata {
        background-color: #f5f5f5;
        padding: 10px;
        border-radius: 5px;
        margin-top: 20px;
      }
      .changes {
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
    <title>${simplification.title}</title>
    <style>${style}</style>
</head>
<body>
    <div class="header">
        <h1>${simplification.title}</h1>
        <p><strong>Niveau cible:</strong> ${simplification.targetLevel}</p>
        <p><strong>Type de simplification:</strong> ${simplification.simplificationType}</p>
        <p><strong>Date:</strong> ${simplification.createdAt.toLocaleDateString()}</p>
    `;

    if (simplification.description) {
      content += `<p><strong>Description:</strong> ${simplification.description}</p>`;
    }

    content += `
    </div>
    
    <div class="content">
        <h2>Texte simplifié</h2>
        <div>${simplification.simplifiedText.replace(/\n/g, '<br>')}</div>
    </div>
    `;

    if (options.includeMetadata) {
      content += `
      <div class="metadata">
        <h3>Métadonnées</h3>
        <p><strong>Mots originaux:</strong> ${simplification.metadata.originalMetrics.totalWords}</p>
        <p><strong>Mots simplifiés:</strong> ${simplification.metadata.simplifiedMetrics.totalWords}</p>
        <p><strong>Score de qualité:</strong> ${simplification.metadata.qualityScore}</p>
        <p><strong>Amélioration de lisibilité:</strong> ${simplification.metadata.readabilityImprovement.toFixed(2)}%</p>
      </div>
      `;
    }

    if (options.includeChanges && simplification.metadata.changes.length > 0) {
      content += `
      <div class="changes">
        <h3>Changements</h3>
        <ul>
      `;

      for (const change of simplification.metadata.changes) {
        content += `<li><strong>${change.type}:</strong> "${change.original}" → "${change.simplified}" (${change.reason})</li>`;
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
  private async exportToPDF(simplification: TextSimplification, options: ExportOptions): Promise<string> {
    // Simuler la génération PDF
    const htmlContent = this.exportToHTML(simplification, options);
    
    // Dans une vraie implémentation, utiliser une bibliothèque comme puppeteer
    return `PDF généré pour: ${simplification.title}\n\n${htmlContent}`;
  }

  /**
   * Exporte au format DOCX (simulation)
   */
  private async exportToDOCX(simplification: TextSimplification, options: ExportOptions): Promise<string> {
    // Simuler la génération DOCX
    const textContent = this.exportToText(simplification, options);
    
    // Dans une vraie implémentation, utiliser une bibliothèque comme docx
    return `DOCX généré pour: ${simplification.title}\n\n${textContent}`;
  }

  /**
   * Exporte au format EPUB (simulation)
   */
  private async exportToEPUB(simplification: TextSimplification, options: ExportOptions): Promise<string> {
    // Simuler la génération EPUB
    const markdownContent = this.exportToMarkdown(simplification, options);
    
    // Dans une vraie implémentation, utiliser une bibliothèque comme epub-gen
    return `EPUB généré pour: ${simplification.title}\n\n${markdownContent}`;
  }

  /**
   * Récupère les statistiques des simplifications
   */
  public async getSimplificationStats(userId?: string): Promise<SimplificationStatistics> {
    try {
      const { data, error } = await supabase.rpc('get_simplification_stats', {
        p_user_id: userId || null
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      
      // Retourner des statistiques par défaut
      return {
        totalSimplifications: 0,
        publishedSimplifications: 0,
        draftSimplifications: 0,
        totalWords: 0,
        averageWordsPerSimplification: 0,
        mostActiveLevels: {} as Record<ReadingLevel, number>,
        mostActiveTypes: {} as Record<SimplificationType, number>,
        topPerformingSimplifications: [],
        userEngagement: {
          totalUsers: 0,
          activeUsers: 0,
          averageSimplificationsPerUser: 0,
          averageWordsPerUser: 0,
          averageReadingTime: 0,
          satisfactionScore: 0
        },
        contentQuality: {
          averageClarity: 0,
          averageCoherence: 0,
          averageSimplicity: 0,
          averageAccuracy: 0,
          averageCompleteness: 0,
          averageReadability: 0,
          extractionSuccessRate: 0
        },
        trends: {
          simplificationGrowth: [],
          wordGrowth: [],
          levelTrends: {} as Record<ReadingLevel, number[]>,
          typeTrends: {} as Record<SimplificationType, number[]>
        }
      };
    }
  }

  /**
   * Met à jour les statistiques d'une simplification
   */
  public async updateSimplificationAnalytics(simplificationId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_simplification_analytics', {
        p_simplification_id: simplificationId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des analytics:', error);
    }
  }

  /**
   * Simule l'extraction de contenu d'un document
   */
  public async extractDocumentContent(_documentId: string): Promise<string> {
    try {
      // Simuler l'extraction de contenu
      const sampleContent = `
        L'intelligence artificielle représente une révolution technologique majeure qui transforme profondément notre société. 
        Cette discipline scientifique vise à créer des machines capables d'imiter et de dépasser les capacités humaines 
        dans divers domaines tels que l'apprentissage, le raisonnement et la prise de décision.

        Les algorithmes d'apprentissage automatique permettent aux systèmes d'améliorer leurs performances 
        progressivement grâce à l'expérience accumulée. Le deep learning, une branche de l'apprentissage automatique, 
        utilise des réseaux de neurones artificiels multicouches pour traiter des données complexes et non structurées.

        Les applications de l'IA sont omniprésentes dans notre quotidien : assistants virtuels, recommandation 
        de contenu, diagnostic médical, conduite autonome, traduction automatique, et bien d'autres. 
        Cependant, cette technologie soulève également des questions éthiques importantes concernant la confidentialité, 
        la sécurité et l'impact sur l'emploi.
      `;

      return sampleContent.trim();
    } catch (error) {
      console.error('Erreur lors de l\'extraction du contenu:', error);
      throw error;
    }
  }

  /**
   * Génère un texte simplifié de démonstration
   */
  public async generateDemoSimplification(
    userId: string,
    targetLevel: ReadingLevel = 'intermediate',
    simplificationType: SimplificationType = 'comprehensive'
  ): Promise<TextSimplification> {
    const demoText = await this.extractDocumentContent('demo-document');
    
    return this.simplifyText(
      'demo-document',
      userId,
      demoText,
      targetLevel,
      simplificationType
    );
  }
}

// Export du singleton et des utilitaires
export const textSimplificationService = TextSimplificationService.getInstance();

export const createTextSimplification = (
  documentId: string,
  userId: string,
  originalText: string,
  targetLevel: ReadingLevel,
  simplificationType: SimplificationType,
  settings?: Partial<SimplificationSettings>
) => textSimplificationService.simplifyText(
  documentId,
  userId,
  originalText,
  targetLevel,
  simplificationType,
  settings
);

export const getSimplification = (id: string) => textSimplificationService.getSimplification(id);

export const getUserSimplifications = (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
    targetLevel?: ReadingLevel;
    simplificationType?: SimplificationType;
  }
) => textSimplificationService.getUserSimplifications(userId, options);

export const searchSimplifications = (
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    targetLevel?: ReadingLevel;
    simplificationType?: SimplificationType;
  }
) => textSimplificationService.searchSimplifications(query, options);

export const exportSimplification = (
  simplificationId: string,
  format: 'json' | 'txt' | 'md' | 'html' | 'pdf' | 'docx' | 'epub',
  options?: ExportOptions
) => textSimplificationService.exportSimplification(simplificationId, format, options);

export const getSimplificationStats = (userId?: string) => 
  textSimplificationService.getSimplificationStats(userId);

export const generateDemoSimplification = (
  userId: string,
  targetLevel?: ReadingLevel,
  simplificationType?: SimplificationType
) => textSimplificationService.generateDemoSimplification(userId, targetLevel, simplificationType);
