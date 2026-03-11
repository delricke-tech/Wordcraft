/**
 * Service de génération automatique de FAQ (Questions/Réponses)
 * 
 * Ce service génère automatiquement des FAQ à partir des documents,
 * utilise l'IA pour créer des questions pertinentes et des réponses précises
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface FAQ {
  id: string;
  documentId: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: FAQStatus;
  questions: FAQQuestion[];
  metadata: FAQMetadata;
  settings: FAQSettings;
  analytics: FAQAnalytics;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface FAQQuestion {
  id: string;
  question: string;
  answer: string;
  context: string;
  sources: FAQSource[];
  confidence: number;
  relevance: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  subcategory?: string;
  tags: string[];
  keywords: string[];
  relatedQuestions: string[];
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  feedback: FAQFeedback[];
  metadata: QuestionMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface FAQSource {
  id: string;
  type: 'document' | 'page' | 'section' | 'paragraph' | 'annotation';
  title: string;
  content: string;
  url?: string;
  pageNumber?: number;
  position?: SourcePosition;
  relevance: number;
  confidence: number;
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

export interface FAQFeedback {
  id: string;
  userId: string;
  type: 'helpful' | 'not_helpful' | 'inaccurate' | 'incomplete' | 'confusing';
  comment?: string;
  rating?: number;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface QuestionMetadata {
  processingTime: number;
  model: string;
  temperature: number;
  tokensUsed: number;
  extractionMethod: 'ai' | 'manual' | 'hybrid';
  confidenceScore: number;
  relevanceScore: number;
  qualityScore: number;
  language: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  complexity: 'low' | 'medium' | 'high';
  readability: number;
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  customFields: Record<string, any>;
}

export interface FAQMetadata {
  totalQuestions: number;
  averageConfidence: number;
  averageRelevance: number;
  processingTime: number;
  model: string;
  language: string;
  lastUpdated: string;
  version: number;
  qualityScore: number;
  completeness: number;
  accuracy: number;
  coverage: number;
  diversity: number;
  customFields: Record<string, any>;
}

export type FAQStatus = 
  | 'draft'
  | 'processing'
  | 'reviewing'
  | 'approved'
  | 'published'
  | 'archived'
  | 'deleted';

export interface FAQSettings {
  maxQuestions: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  language: string;
  categories: string[];
  includeContext: boolean;
  includeSources: boolean;
  confidenceThreshold: number;
  relevanceThreshold: number;
  model: string;
  temperature: number;
  maxTokens: number;
  promptTemplate?: string;
  customInstructions?: string;
  outputFormat: 'structured' | 'plain' | 'markdown' | 'html';
  sorting: 'relevance' | 'confidence' | 'difficulty' | 'alphabetical';
  filtering: FAQFiltering;
  personalization: FAQPersonalization;
}

export interface FAQFiltering {
  minConfidence: number;
  minRelevance: number;
  maxQuestions: number;
  categories: string[];
  tags: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  excludeDuplicates: boolean;
  excludeIncomplete: boolean;
  excludeLowQuality: boolean;
}

export interface FAQPersonalization {
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  previousQuestions: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  customPreferences: Record<string, any>;
}

export interface FAQAnalytics {
  totalViews: number;
  uniqueViews: number;
  averageTimePerQuestion: number;
  mostViewedQuestions: Array<{
    questionId: string;
    viewCount: number;
    averageTime: number;
    helpfulRate: number;
  }>;
  searchQueries: Array<{
    query: string;
    frequency: number;
    successRate: number;
    averageResults: number;
  }>;
  userEngagement: {
    averageSessionDuration: number;
    bounceRate: number;
    returnRate: number;
    feedbackRate: number;
    helpfulRate: number;
  };
  performance: {
    averageConfidence: number;
    averageRelevance: number;
    averageQuality: number;
    processingTime: number;
    errorRate: number;
  };
  trends: {
    dailyViews: number[];
    weeklyViews: number[];
    monthlyViews: number[];
    growthRate: number;
  };
}

export interface FAQTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  promptTemplate: string;
  settings: Partial<FAQSettings>;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  description: string;
  parentCategoryId?: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FAQExport {
  id: string;
  faqId: string;
  format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'html' | 'markdown';
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ExportOptions {
  includeMetadata: boolean;
  includeSources: boolean;
  includeAnalytics: boolean;
  includeFeedback: boolean;
  filterByCategory?: string[];
  filterByDifficulty?: string[];
  sortBy?: 'question' | 'answer' | 'category' | 'difficulty' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  format?: {
    fontSize: number;
    fontFamily: string;
    includeTableOfContents: boolean;
    includeHeaders: boolean;
    includeFooters: boolean;
    pageNumbers: boolean;
  };
}

export interface FAQStats {
  totalFAQs: number;
  publishedFAQs: number;
  draftFAQs: number;
  totalQuestions: number;
  averageQuestionsPerFAQ: number;
  mostActiveCategories: Array<{
    category: string;
    count: number;
    averageRating: number;
  }>;
  topPerformingQuestions: Array<{
    question: string;
    viewCount: number;
    helpfulRate: number;
    confidence: number;
  }>;
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    averageSessionsPerUser: number;
    averageQuestionsPerSession: number;
    feedbackRate: number;
    satisfactionScore: number;
  };
  contentQuality: {
    averageConfidence: number;
    averageRelevance: number;
    averageQuality: number;
    completeness: number;
    accuracy: number;
  };
  trends: {
    faqGrowth: number[];
    questionGrowth: number[];
    categoryTrends: Record<string, number[]>;
    difficultyTrends: Record<string, number[]>;
  };
}

class FAQGenerationService {
  private faqs: Map<string, FAQ> = new Map();
  private templates: Map<string, FAQTemplate> = new Map();
  private categories: Map<string, FAQCategory> = new Map();
  private eventCallbacks: Map<string, (event: any) => void> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialise le service de génération de FAQ
   */
  private async initializeService(): Promise<void> {
    try {
      // Charger les templates par défaut
      await this.loadDefaultTemplates();
      
      // Charger les catégories par défaut
      await this.loadDefaultCategories();
      
      // Démarrer le monitoring
      this.startMonitoring();
      
      this.isInitialized = true;
      console.log('❓ Service de génération FAQ initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation service FAQ:', error);
    }
  }

  /**
   * Génère une FAQ à partir d'un document
   */
  async generateFAQ(
    documentId: string,
    userId: string,
    settings: Partial<FAQSettings> = {},
    options: {
      title?: string;
      description?: string;
      category?: string;
      subcategory?: string;
      tags?: string[];
    } = {}
  ): Promise<FAQ> {
    try {
      // Valider les paramètres
      this.validateFAQSettings(settings);

      // Récupérer le document
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Document non trouvé');
      }

      // Fusionner les paramètres par défaut
      const faqSettings = this.mergeDefaultSettings(settings);

      // Créer la FAQ
      const faq: FAQ = {
        id: this.generateId(),
        documentId,
        userId,
        title: options.title || `FAQ: ${document.title}`,
        description: options.description || `FAQ générée automatiquement à partir du document ${document.title}`,
        category: options.category || 'Général',
        subcategory: options.subcategory,
        tags: options.tags || [],
        language: faqSettings.language,
        difficulty: faqSettings.difficulty as any,
        status: 'processing',
        questions: [],
        metadata: {
          totalQuestions: 0,
          averageConfidence: 0,
          averageRelevance: 0,
          processingTime: 0,
          model: faqSettings.model,
          language: faqSettings.language,
          lastUpdated: new Date().toISOString(),
          version: 1,
          qualityScore: 0,
          completeness: 0,
          accuracy: 0,
          coverage: 0,
          diversity: 0
        },
        settings: faqSettings,
        analytics: {
          totalViews: 0,
          uniqueViews: 0,
          averageTimePerQuestion: 0,
          mostViewedQuestions: [],
          searchQueries: [],
          userEngagement: {
            averageSessionDuration: 0,
            bounceRate: 0,
            returnRate: 0,
            feedbackRate: 0,
            helpfulRate: 0
          },
          performance: {
            averageConfidence: 0,
            averageRelevance: 0,
            averageQuality: 0,
            processingTime: 0,
            errorRate: 0
          },
          trends: {
            dailyViews: Array(30).fill(0),
            weeklyViews: Array(12).fill(0),
            monthlyViews: Array(12).fill(0),
            growthRate: 0
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Sauvegarder la FAQ
      this.faqs.set(faq.id, faq);
      await this.saveFAQ(faq);

      // Émettre l'événement de début de génération
      this.emit('faq_generation_started', { faq });

      // Démarrer la génération en arrière-plan
      this.processFAQGeneration(faq, document);

      console.log('❓ Génération FAQ démarrée:', faq.id);
      return faq;

    } catch (error) {
      console.error('❌ Erreur génération FAQ:', error);
      throw error;
    }
  }

  /**
   * Traite la génération de FAQ en arrière-plan
   */
  private async processFAQGeneration(faq: FAQ, document: any): Promise<void> {
    try {
      const startTime = Date.now();

      // Mettre à jour le statut
      faq.status = 'processing';
      await this.saveFAQ(faq);

      // Extraire le contenu du document
      const content = await this.extractDocumentContent(document);
      
      // Générer les questions
      const questions = await this.generateQuestions(content, faq.settings);
      
      // Traiter et valider les questions
      const processedQuestions = await this.processQuestions(questions, faq.settings);
      
      // Mettre à jour la FAQ
      faq.questions = processedQuestions;
      faq.metadata.totalQuestions = processedQuestions.length;
      faq.metadata.averageConfidence = processedQuestions.reduce((sum, q) => sum + q.confidence, 0) / processedQuestions.length;
      faq.metadata.averageRelevance = processedQuestions.reduce((sum, q) => sum + q.relevance, 0) / processedQuestions.length;
      faq.metadata.processingTime = Date.now() - startTime;
      faq.metadata.qualityScore = this.calculateQualityScore(processedQuestions);
      faq.metadata.completeness = this.calculateCompleteness(processedQuestions, content);
      faq.metadata.accuracy = this.calculateAccuracy(processedQuestions);
      faq.metadata.coverage = this.calculateCoverage(processedQuestions, content);
      faq.metadata.diversity = this.calculateDiversity(processedQuestions);
      faq.status = 'reviewing';
      faq.updatedAt = new Date().toISOString();

      // Sauvegarder la FAQ mise à jour
      await this.saveFAQ(faq);

      // Émettre l'événement de génération terminée
      this.emit('faq_generation_completed', { faq, questions: processedQuestions });

      console.log('❓ Génération FAQ terminée:', processedQuestions.length, 'questions');

    } catch (error) {
      console.error('❌ Erreur traitement génération FAQ:', error);
      
      // Marquer comme échoué
      faq.status = 'draft';
      faq.updatedAt = new Date().toISOString();
      await this.saveFAQ(faq);
      
      // Émettre l'événement d'erreur
      this.emit('faq_generation_failed', { faq, error });
    }
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
          Ce document est un guide complet sur l'utilisation de notre plateforme.
          
          Chapitre 1: Introduction
          Notre plateforme permet de gérer efficacement vos documents numériques.
          Vous pouvez importer des fichiers PDF, Word, Excel et images.
          
          Chapitre 2: Fonctionnalités principales
          La plateforme offre des fonctionnalités avancées de recherche et d'analyse.
          L'IA peut extraire des informations clés et générer des résumés automatiques.
          
          Chapitre 3: Collaboration
          Partagez vos documents avec votre équipe et collaborez en temps réel.
          Les commentaires et annotations facilitent le travail collaboratif.
          
          Chapitre 4: Sécurité
          Vos données sont protégées par un chiffrement de bout en bout.
          Nous respectons les normes RGPD et assurons la confidentialité de vos informations.
          
          Chapitre 5: Support technique
          Notre équipe d'assistance est disponible 24/7 pour vous aider.
          Contactez-nous par email ou via notre chat en direct.
        `;
      } else if (document.type === 'docx') {
        // Simuler l'extraction de texte Word
        content = `
          Manuel d'utilisation - Guide complet
          
          Bienvenue dans notre application !
          
          Table des matières :
          1. Installation et configuration
          2. Interface utilisateur
          3. Gestion des documents
          4. Fonctionnalités avancées
          5. Dépannage
          
          Ce guide vous aidera à maîtriser rapidement notre solution.
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
   * Génère les questions à partir du contenu
   */
  private async generateQuestions(content: string, settings: FAQSettings): Promise<FAQQuestion[]> {
    try {
      // Simuler la génération de questions avec l'IA
      // Dans un vrai projet, utiliser l'API OpenAI ou Claude
      
      const questions: FAQQuestion[] = [];
      
      // Questions basées sur le contenu
      const baseQuestions = [
        {
          question: "Qu'est-ce que cette plateforme et comment fonctionne-t-elle ?",
          answer: "Notre plateforme est une solution complète de gestion de documents numériques. Elle permet d'importer, organiser, rechercher et collaborer sur tous vos fichiers. L'interface intuitive facilite la navigation et les fonctionnalités d'IA aident à extraire rapidement les informations importantes.",
          context: "Introduction générale à la plateforme",
          sources: [],
          confidence: 0.95,
          relevance: 0.9,
          difficulty: settings.difficulty as any,
          category: "Général",
          tags: ["plateforme", "fonctionnement", "introduction"],
          keywords: ["plateforme", "fonctionnement", "utilisation"],
          relatedQuestions: [],
          viewCount: 0,
          helpfulCount: 0,
          notHelpfulCount: 0,
          feedback: [],
          metadata: {
            processingTime: 1500,
            model: settings.model,
            temperature: settings.temperature,
            tokensUsed: 150,
            extractionMethod: 'ai',
            confidenceScore: 0.95,
            relevanceScore: 0.9,
            qualityScore: 0.9,
            language: settings.language,
            sentiment: 'positive',
            complexity: 'medium',
            readability: 0.7,
            wordCount: 45,
            characterCount: 280,
            sentenceCount: 3,
            paragraphCount: 2,
            customFields: {}
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          question: "Quels types de fichiers puis-je importer sur la plateforme ?",
          answer: "Vous pouvez importer une grande variété de fichiers : documents PDF, fichiers Word (.docx), feuilles de calcul Excel (.xlsx), images (JPEG, PNG, GIF, WebP), et bien d'autres formats. Chaque type de fichier est traité spécifiquement pour en extraire le contenu textuel et les métadonnées pertinentes.",
          context: "Importation et gestion des documents",
          sources: [],
          confidence: 0.92,
          relevance: 0.85,
          difficulty: settings.difficulty as any,
          category: "Importation",
          tags: ["import", "fichiers", "formats", "types"],
          keywords: ["import", "fichiers", "formats", "documents"],
          relatedQuestions: [],
          viewCount: 0,
          helpfulCount: 0,
          notHelpfulCount: 0,
          feedback: [],
          metadata: {
            processingTime: 1200,
            model: settings.model,
            temperature: settings.temperature,
            tokensUsed: 120,
            extractionMethod: 'ai',
            confidenceScore: 0.92,
            relevanceScore: 0.85,
            qualityScore: 0.85,
            language: settings.language,
            sentiment: 'positive',
            complexity: 'low',
            readability: 0.8,
            wordCount: 42,
            characterCount: 265,
            sentenceCount: 4,
            paragraphCount: 2,
            customFields: {}
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          question: "Comment l'intelligence artificielle aide-t-elle à analyser mes documents ?",
          answer: "Notre IA utilise des technologies avancées de traitement du langage naturel pour analyser vos documents. Elle peut extraire les informations clés, générer des résumés automatiques, identifier les thèmes principaux, répondre à des questions spécifiques sur le contenu, et même créer des quiz ou flashcards pour vous aider à mieux retenir l'information.",
          context: "Fonctionnalités d'IA et d'analyse",
          sources: [],
          confidence: 0.88,
          relevance: 0.8,
          difficulty: settings.difficulty as any,
          category: "IA et Analyse",
          tags: ["ia", "intelligence", "analyse", "résumés"],
          keywords: ["intelligence", "analyse", "traitement", "automatique"],
          relatedQuestions: [],
          viewCount: 0,
          helpfulCount: 0,
          notHelpfulCount: 0,
          feedback: [],
          metadata: {
            processingTime: 1800,
            model: settings.model,
            temperature: settings.temperature,
            tokensUsed: 180,
            extractionMethod: 'ai',
            confidenceScore: 0.88,
            relevanceScore: 0.8,
            qualityScore: 0.8,
            language: settings.language,
            sentiment: 'positive',
            complexity: 'medium',
            readability: 0.6,
            wordCount: 58,
            characterCount: 350,
            sentenceCount: 5,
            paragraphCount: 3,
            customFields: {}
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          question: "Comment fonctionne la collaboration en temps réel ?",
          answer: "La collaboration en temps réel vous permet de travailler simultanément sur les mêmes documents avec votre équipe. Vous pouvez voir les modifications des autres utilisateurs instantanément, ajouter des commentaires et annotations, et communiquer via un chat intégré. Chaque modification est synchronisée automatiquement pour que tout le monde dispose toujours de la version la plus récente.",
          context: "Collaboration et travail d'équipe",
          sources: [],
          confidence: 0.9,
          relevance: 0.85,
          difficulty: settings.difficulty as any,
          category: "Collaboration",
          tags: ["collaboration", "temps réel", "équipe", "synchronisation"],
          keywords: ["collaboration", "temps", "réel", "équipe"],
          relatedQuestions: [],
          viewCount: 0,
          helpfulCount: 0,
          notHelpfulCount: 0,
          feedback: [],
          metadata: {
            processingTime: 1400,
            model: settings.model,
            temperature: settings.temperature,
            tokensUsed: 140,
            extractionMethod: 'ai',
            confidenceScore: 0.9,
            relevanceScore: 0.85,
            qualityScore: 0.85,
            language: settings.language,
            sentiment: 'positive',
            complexity: 'medium',
            readability: 0.7,
            wordCount: 50,
            characterCount: 310,
            sentenceCount: 4,
            paragraphCount: 2,
            customFields: {}
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          question: "Mes données sont-elles sécurisées sur la plateforme ?",
          answer: "Oui, la sécurité de vos données est notre priorité absolue. Nous utilisons un chiffrement de bout en bout pour protéger vos fichiers pendant le transfert et le stockage. Vos données sont stockées sur des serveurs sécurisés et nous respectons scrupuleusement les réglementations RGPD. Vous avez le contrôle total sur vos données et pouvez les supprimer à tout moment.",
          context: "Sécurité et confidentialité",
          sources: [],
          confidence: 0.94,
          relevance: 0.9,
          difficulty: settings.difficulty as any,
          category: "Sécurité",
          tags: ["sécurité", "chiffrement", "rgpd", "confidentialité"],
          keywords: ["sécurité", "données", "protection", "confidentialité"],
          relatedQuestions: [],
          viewCount: 0,
          helpfulCount: 0,
          notHelpfulCount: 0,
          feedback: [],
          metadata: {
            processingTime: 1300,
            model: settings.model,
            temperature: settings.temperature,
            tokensUsed: 130,
            extractionMethod: 'ai',
            confidenceScore: 0.94,
            relevanceScore: 0.9,
            qualityScore: 0.9,
            language: settings.language,
            sentiment: 'positive',
            complexity: 'low',
            readability: 0.8,
            wordCount: 48,
            characterCount: 295,
            sentenceCount: 4,
            paragraphCount: 2,
            customFields: {}
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          question: "Comment contacter le support technique ?",
          answer: "Vous pouvez contacter notre support technique de plusieurs manières : par email à support@plateforme.com, via notre chat en direct disponible 24/7, ou en remplissant notre formulaire de contact. Notre équipe répond généralement en moins de 2 heures pendant les jours ouvrables. Vous pouvez également consulter notre base de connaissances pour des réponses immédiates.",
          context: "Support et assistance technique",
          sources: [],
          confidence: 0.91,
          relevance: 0.8,
          difficulty: settings.difficulty as any,
          category: "Support",
          tags: ["support", "assistance", "contact", "aide"],
          keywords: ["support", "contact", "aide", "assistance"],
          relatedQuestions: [],
          viewCount: 0,
          helpfulCount: 0,
          notHelpfulCount: 0,
          feedback: [],
          metadata: {
            processingTime: 1100,
            model: settings.model,
            temperature: settings.temperature,
            tokensUsed: 110,
            extractionMethod: 'ai',
            confidenceScore: 0.91,
            relevanceScore: 0.8,
            qualityScore: 0.8,
            language: settings.language,
            sentiment: 'positive',
            complexity: 'low',
            readability: 0.8,
            wordCount: 46,
            characterCount: 285,
            sentenceCount: 4,
            paragraphCount: 2,
            customFields: {}
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Ajouter des questions spécifiques selon le contenu
      if (content.toLowerCase().includes('prix') || content.toLowerCase().includes('tarif')) {
        baseQuestions.push({
          question: "Quels sont les tarifs de la plateforme ?",
          answer: "Nous proposons plusieurs formules adaptées à vos besoins : une version gratuite avec 500MB de stockage, une version Pro à 9,99€/mois avec 10GB et fonctionnalités avancées, et une version Entreprise sur mesure. Contactez-nous pour un devis personnalisé.",
          context: "Tarifs et prix",
          sources: [],
          confidence: 0.85,
          relevance: 0.75,
          difficulty: settings.difficulty as any,
          category: "Tarifs",
          tags: ["tarifs", "prix", "coût", "abonnement"],
          keywords: ["tarifs", "prix", "coût", "abonnement"],
          relatedQuestions: [],
          viewCount: 0,
          helpfulCount: 0,
          notHelpfulCount: 0,
          feedback: [],
          metadata: {
            processingTime: 1000,
            model: settings.model,
            temperature: settings.temperature,
            tokensUsed: 100,
            extractionMethod: 'ai',
            confidenceScore: 0.85,
            relevanceScore: 0.75,
            qualityScore: 0.75,
            language: settings.language,
            sentiment: 'neutral',
            complexity: 'low',
            readability: 0.8,
            wordCount: 42,
            characterCount: 260,
            sentenceCount: 3,
            paragraphCount: 2,
            customFields: {}
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Filtrer selon les paramètres
      let filteredQuestions = baseQuestions.filter(q => {
        if (settings.confidenceThreshold && q.confidence < settings.confidenceThreshold) {
          return false;
        }
        if (settings.relevanceThreshold && q.relevance < settings.relevanceThreshold) {
          return false;
        }
        if (settings.categories.length > 0 && !settings.categories.includes(q.category)) {
          return false;
        }
        return true;
      });

      // Limiter le nombre de questions
      filteredQuestions = filteredQuestions.slice(0, settings.maxQuestions);

      return filteredQuestions;

    } catch (error) {
      console.error('❌ Erreur génération questions:', error);
      throw error;
    }
  }

  /**
   * Traite et valide les questions générées
   */
  private async processQuestions(questions: FAQQuestion[], settings: FAQSettings): Promise<FAQQuestion[]> {
    try {
      const processedQuestions: FAQQuestion[] = [];

      for (const question of questions) {
        // Valider la question
        if (this.validateQuestion(question)) {
          // Ajouter les métadonnées de traitement
          question.id = this.generateId();
          question.createdAt = new Date().toISOString();
          question.updatedAt = new Date().toISOString();
          
          // Ajouter les sources simulées
          question.sources = this.generateMockSources(question);
          
          processedQuestions.push(question);
        }
      }

      return processedQuestions;

    } catch (error) {
      console.error('❌ Erreur traitement questions:', error);
      throw error;
    }
  }

  /**
   * Valide une question
   */
  private validateQuestion(question: FAQQuestion): boolean {
    return (
      question.question.trim().length > 10 &&
      question.answer.trim().length > 20 &&
      question.confidence >= 0.5 &&
      question.relevance >= 0.5 &&
      question.difficulty !== undefined
    );
  }

  /**
   * Génère des sources simulées
   */
  private generateMockSources(question: FAQQuestion): FAQSource[] {
    return [
      {
        id: this.generateId(),
        type: 'document',
        title: 'Document principal',
        content: question.answer.substring(0, 100) + '...',
        relevance: 0.9,
        confidence: 0.85,
        snippet: question.answer.substring(0, 50) + '...',
        metadata: {}
      }
    ];
  }

  /**
   * Calcule le score de qualité
   */
  private calculateQualityScore(questions: FAQQuestion[]): number {
    if (questions.length === 0) return 0;
    
    const totalScore = questions.reduce((sum, q) => {
      return sum + (q.confidence * 0.4 + q.relevance * 0.3 + this.calculateAnswerQuality(q.answer) * 0.3);
    }, 0);
    
    return totalScore / questions.length;
  }

  /**
   * Calcule la qualité d'une réponse
   */
  private calculateAnswerQuality(answer: string): number {
    const length = answer.length;
    const wordCount = answer.split(/\s+/).length;
    const sentenceCount = answer.split(/[.!?]+/).length;
    
    // Score basé sur la longueur et la structure
    let score = 0.5; // Score de base
    
    if (length >= 100 && length <= 500) score += 0.2;
    if (wordCount >= 20 && wordCount <= 100) score += 0.2;
    if (sentenceCount >= 2 && sentenceCount <= 5) score += 0.1;
    
    return Math.min(score, 1);
  }

  /**
   * Calcule la complétude
   */
  private calculateCompleteness(questions: FAQQuestion[], content: string): number {
    const contentWords = content.split(/\s+/).length;
    const questionWords = questions.reduce((sum, q) => sum + q.answer.split(/\s+/).length, 0);
    
    return Math.min(questionWords / contentWords, 1);
  }

  /**
   * Calcule la précision
   */
  private calculateAccuracy(questions: FAQQuestion[]): number {
    if (questions.length === 0) return 0;
    
    const totalConfidence = questions.reduce((sum, q) => sum + q.confidence, 0);
    return totalConfidence / questions.length;
  }

  /**
   * Calcule la couverture
   */
  private calculateCoverage(questions: FAQQuestion[], content: string): number {
    const uniqueKeywords = new Set();
    const contentKeywords = content.toLowerCase().split(/\s+/);
    
    questions.forEach(q => {
      q.keywords.forEach(keyword => uniqueKeywords.add(keyword.toLowerCase()));
    });
    
    return uniqueKeywords.size / contentKeywords.length;
  }

  /**
   * Calcule la diversité
   */
  private calculateDiversity(questions: FAQQuestion[]): number {
    const categories = new Set(questions.map(q => q.category));
    const difficulties = new Set(questions.map(q => q.difficulty));
    
    return (categories.size / 5 + difficulties.size / 3) / 2; // Normalisé
  }

  /**
   * Obtient une FAQ
   */
  async getFAQ(faqId: string, userId?: string): Promise<FAQ | null> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('id', faqId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Vérifier les permissions
      if (userId && data.user_id !== userId && data.status !== 'published') {
        return null;
      }

      return data as FAQ;

    } catch (error) {
      console.error('❌ Erreur récupération FAQ:', error);
      throw error;
    }
  }

  /**
   * Obtient les FAQs d'un utilisateur
   */
  async getUserFAQs(
    userId: string,
    options: {
      status?: FAQStatus;
      category?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'created_at' | 'updated_at' | 'title' | 'status';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<FAQ[]> {
    try {
      let query = supabase
        .from('faqs')
        .select('*')
        .eq('user_id', userId);

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.category) {
        query = query.eq('category', options.category);
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

      return data as FAQ[];

    } catch (error) {
      console.error('❌ Erreur récupération FAQs utilisateur:', error);
      throw error;
    }
  }

  /**
   * Recherche dans les FAQs
   */
  async searchFAQs(
    userId: string,
    query: string,
    options: {
      category?: string;
      difficulty?: string;
      tags?: string[];
      limit?: number;
    } = {}
  ): Promise<FAQQuestion[]> {
    try {
      // Simuler la recherche
      const userFAQs = await this.getUserFAQs(userId, { status: 'published' });
      
      const results: FAQQuestion[] = [];
      
      for (const faq of userFAQs) {
        for (const question of faq.questions) {
          // Recherche simple dans la question et la réponse
          if (question.question.toLowerCase().includes(query.toLowerCase()) ||
              question.answer.toLowerCase().includes(query.toLowerCase()) ||
              question.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
            
            // Filtrer selon les options
            if (options.category && question.category !== options.category) continue;
            if (options.difficulty && question.difficulty !== options.difficulty) continue;
            if (options.tags && !options.tags.some(tag => question.tags.includes(tag))) continue;
            
            results.push(question);
          }
        }
      }

      // Limiter les résultats
      if (options.limit) {
        return results.slice(0, options.limit);
      }

      return results;

    } catch (error) {
      console.error('❌ Erreur recherche FAQs:', error);
      throw error;
    }
  }

  /**
   * Ajoute du feedback à une question
   */
  async addFeedback(
    questionId: string,
    userId: string,
    feedback: {
      type: 'helpful' | 'not_helpful' | 'inaccurate' | 'incomplete' | 'confusing';
      comment?: string;
      rating?: number;
    }
  ): Promise<void> {
    try {
      const faq = await this.getFAQByQuestionId(questionId);
      if (!faq) {
        throw new Error('Question non trouvée');
      }

      const question = faq.questions.find(q => q.id === questionId);
      if (!question) {
        throw new Error('Question non trouvée');
      }

      // Ajouter le feedback
      const feedbackEntry: FAQFeedback = {
        id: this.generateId(),
        userId,
        type: feedback.type,
        comment: feedback.comment,
        rating: feedback.rating,
        timestamp: new Date().toISOString(),
        metadata: {}
      };

      question.feedback.push(feedbackEntry);

      // Mettre à jour les compteurs
      if (feedback.type === 'helpful') {
        question.helpfulCount++;
      } else if (feedback.type === 'not_helpful') {
        question.notHelpfulCount++;
      }

      question.updatedAt = new Date().toISOString();

      // Sauvegarder la FAQ
      await this.saveFAQ(faq);

      console.log('❓ Feedback ajouté à la question:', questionId);

    } catch (error) {
      console.error('❌ Erreur ajout feedback:', error);
      throw error;
    }
  }

  /**
   * Exporte une FAQ
   */
  async exportFAQ(
    faqId: string,
    userId: string,
    format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'html' | 'markdown',
    options: ExportOptions = {}
  ): Promise<FAQExport> {
    try {
      const faq = await this.getFAQ(faqId, userId);
      if (!faq) {
        throw new Error('FAQ non trouvée');
      }

      const exportData: FAQExport = {
        id: this.generateId(),
        faqId,
        format,
        options,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Traiter l'export
      const exportedContent = await this.processExport(faq, format, options);
      
      // Sauvegarder le fichier exporté
      const fileUrl = await this.saveExportFile(exportData.id, exportedContent, format);
      
      exportData.status = 'completed';
      exportData.fileUrl = fileUrl;
      exportData.fileSize = exportedContent.length;
      exportData.completedAt = new Date().toISOString();

      console.log('❓ Export FAQ terminé:', exportData.id);
      return exportData;

    } catch (error) {
      console.error('❌ Erreur export FAQ:', error);
      throw error;
    }
  }

  /**
   * Traite l'export
   */
  private async processExport(faq: FAQ, format: string, options: ExportOptions): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(faq, null, 2);
      case 'csv':
        return this.convertToCSV(faq, options);
      case 'markdown':
        return this.convertToMarkdown(faq, options);
      case 'html':
        return this.convertToHTML(faq, options);
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
  private convertToCSV(faq: FAQ, options: ExportOptions): string {
    const headers = [
      'Question',
      'Réponse',
      'Catégorie',
      'Difficulté',
      'Confiance',
      'Pertinence',
      'Tags',
      'Vues',
      'Utile',
      'Pas utile'
    ];

    const rows = [headers.join(',')];

    for (const question of faq.questions) {
      const row = [
        `"${question.question.replace(/"/g, '""')}"`,
        `"${question.answer.replace(/"/g, '""')}"`,
        question.category,
        question.difficulty,
        question.confidence,
        question.relevance,
        `"${question.tags.join(', ')}"`,
        question.viewCount,
        question.helpfulCount,
        question.notHelpfulCount
      ];
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  /**
   * Convertit en Markdown
   */
  private convertToMarkdown(faq: FAQ, options: ExportOptions): string {
    let markdown = `# ${faq.title}\n\n`;
    
    if (faq.description) {
      markdown += `${faq.description}\n\n`;
    }

    markdown += `**Catégorie :** ${faq.category}\n`;
    markdown += `**Difficulté :** ${faq.difficulty}\n`;
    markdown += `**Nombre de questions :** ${faq.questions.length}\n\n`;

    markdown += '## Questions\n\n';

    for (let i = 0; i < faq.questions.length; i++) {
      const question = faq.questions[i];
      markdown += `### ${i + 1}. ${question.question}\n\n`;
      markdown += `${question.answer}\n\n`;
      
      if (options.includeMetadata) {
        markdown += `**Catégorie :** ${question.category}\n`;
        markdown += `**Difficulté :** ${question.difficulty}\n`;
        markdown += `**Confiance :** ${(question.confidence * 100).toFixed(1)}%\n`;
        markdown += `**Pertinence :** ${(question.relevance * 100).toFixed(1)}%\n`;
        markdown += `**Tags :** ${question.tags.join(', ')}\n\n`;
      }
    }

    return markdown;
  }

  /**
   * Convertit en HTML
   */
  private convertToHTML(faq: FAQ, options: ExportOptions): string {
    let html = '<html><head>';
    html += `<title>${faq.title}</title>`;
    html += '<meta charset="utf-8">';
    html += '<style>body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }';
    html += 'h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }';
    html += '.question { margin-bottom: 30px; }';
    html += '.question h3 { color: #444; margin-bottom: 10px; }';
    html += '.answer { margin-bottom: 20px; line-height: 1.6; }';
    html += '.metadata { font-size: 0.9em; color: #666; margin-top: 10px; }';
    html += '</style></head><body>';

    html += `<h1>${faq.title}</h1>`;
    
    if (faq.description) {
      html += `<p>${faq.description}</p>`;
    }

    html += `<div class="metadata">`;
    html += `<p><strong>Catégorie :</strong> ${faq.category}</p>`;
    html += `<p><strong>Difficulté :</strong> ${faq.difficulty}</p>`;
    html += `<p><strong>Nombre de questions :</strong> ${faq.questions.length}</p>`;
    html += '</div>';

    html += '<div class="questions">';

    for (let i = 0; i < faq.questions.length; i++) {
      const question = faq.questions[i];
      html += '<div class="question">';
      html += `<h3>${i + 1}. ${question.question}</h3>`;
      html += `<div class="answer">${question.answer}</div>`;
      
      if (options.includeMetadata) {
        html += '<div class="metadata">';
        html += `<p><strong>Catégorie :</strong> ${question.category}</p>`;
        html += `<p><strong>Difficulté :</strong> ${question.difficulty}</p>`;
        html += `<p><strong>Confiance :</strong> ${(question.confidence * 100).toFixed(1)}%</p>`;
        html += `<p><strong>Pertinence :</strong> ${(question.relevance * 100).toFixed(1)}%</p>`;
        html += `<p><strong>Tags :</strong> ${question.tags.join(', ')}</p>`;
        html += '</div>';
      }
      
      html += '</div>';
    }

    html += '</div></body></html>';
    return html;
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
      const fileName = `faq-exports/${exportId}.${format}`;
      
      const { error } = await supabase.storage
        .from('faq-exports')
        .upload(fileName, new Blob([content]));

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('faq-exports')
        .getPublicUrl(fileName);

      return publicUrl;

    } catch (error) {
      console.error('❌ Erreur sauvegarde fichier export:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques des FAQs
   */
  async getStats(userId?: string): Promise<FAQStats> {
    try {
      const { data, error } = await supabase.rpc('get_faq_stats', {
        p_user_id: userId
      });

      if (error) throw error;

      const stats = data || {
        total_faqs: 0,
        published_faqs: 0,
        draft_faqs: 0,
        total_questions: 0,
        average_questions_per_faq: 0,
        most_active_categories: [],
        top_performing_questions: [],
        user_engagement: {
          total_users: 0,
          active_users: 0,
          average_sessions_per_user: 0,
          average_questions_per_session: 0,
          feedback_rate: 0,
          satisfaction_score: 0
        },
        content_quality: {
          average_confidence: 0,
          average_relevance: 0,
          average_quality: 0,
          completeness: 0,
          accuracy: 0
        },
        trends: {
          faq_growth: Array(12).fill(0),
          question_growth: Array(12).fill(0),
          category_trends: {},
          difficulty_trends: {}
        }
      };

      return {
        totalFAQs: stats.total_faqs,
        publishedFAQs: stats.published_faqs,
        draftFAQs: stats.draft_faqs,
        totalQuestions: stats.total_questions,
        averageQuestionsPerFAQ: stats.average_questions_per_faq,
        mostActiveCategories: stats.most_active_categories,
        topPerformingQuestions: stats.top_performing_questions,
        userEngagement: stats.user_engagement,
        contentQuality: stats.content_quality,
        trends: stats.trends
      };

    } catch (error) {
      console.error('❌ Erreur statistiques FAQ:', error);
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

  private async getFAQByQuestionId(questionId: string): Promise<FAQ | null> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .like('questions', questionId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return data as FAQ;

    } catch (error) {
      console.error('❌ Erreur récupération FAQ par question ID:', error);
      return null;
    }
  }

  private mergeDefaultSettings(settings: Partial<FAQSettings>): FAQSettings {
    return {
      maxQuestions: settings.maxQuestions || 10,
      difficulty: settings.difficulty || 'mixed',
      language: settings.language || 'fr',
      categories: settings.categories || [],
      includeContext: settings.includeContext ?? true,
      includeSources: settings.includeSources ?? true,
      confidenceThreshold: settings.confidenceThreshold || 0.7,
      relevanceThreshold: settings.relevanceThreshold || 0.7,
      model: settings.model || 'gpt-4',
      temperature: settings.temperature || 0.3,
      maxTokens: settings.maxTokens || 1000,
      outputFormat: settings.outputFormat || 'structured',
      sorting: settings.sorting || 'relevance',
      filtering: settings.filtering || {
        minConfidence: 0.5,
        minRelevance: 0.5,
        maxQuestions: 50,
        categories: [],
        tags: [],
        excludeDuplicates: true,
        excludeIncomplete: true,
        excludeLowQuality: true
      },
      personalization: settings.personalization || {
        userLevel: 'intermediate',
        interests: [],
        previousQuestions: [],
        learningStyle: 'reading',
        preferredDifficulty: 'intermediate',
        customPreferences: {}
      }
    };
  }

  private validateFAQSettings(settings: Partial<FAQSettings>): void {
    if (settings.maxQuestions && (settings.maxQuestions < 1 || settings.maxQuestions > 100)) {
      throw new Error('Le nombre de questions doit être entre 1 et 100');
    }
    
    if (settings.confidenceThreshold && (settings.confidenceThreshold < 0 || settings.confidenceThreshold > 1)) {
      throw new Error('Le seuil de confiance doit être entre 0 et 1');
    }
    
    if (settings.relevanceThreshold && (settings.relevanceThreshold < 0 || settings.relevanceThreshold > 1)) {
      throw new Error('Le seuil de pertinence doit être entre 0 et 1');
    }
  }

  private generateId(): string {
    return `faq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Charge les templates par défaut
   */
  private async loadDefaultTemplates(): Promise<void> {
    // Simuler le chargement des templates par défaut
    console.log('❓ Chargement des templates FAQ...');
  }

  /**
   * Charge les catégories par défaut
   */
  private async loadDefaultCategories(): Promise<void> {
    // Simuler le chargement des catégories par défaut
    console.log('❓ Chargement des catégories FAQ...');
  }

  /**
   * Sauvegarde une FAQ
   */
  private async saveFAQ(faq: FAQ): Promise<void> {
    try {
      const { error } = await supabase
        .from('faqs')
        .upsert({
          id: faq.id,
          document_id: faq.documentId,
          user_id: faq.userId,
          title: faq.title,
          description: faq.description,
          category: faq.category,
          subcategory: faq.subcategory,
          tags: faq.tags,
          language: faq.language,
          difficulty: faq.difficulty,
          status: faq.status,
          questions: faq.questions,
          metadata: faq.metadata,
          settings: faq.settings,
          analytics: faq.analytics,
          created_at: faq.createdAt,
          updated_at: faq.updatedAt,
          published_at: faq.publishedAt
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde FAQ:', error);
    }
  }

  /**
   * Démarre le monitoring
   */
  private startMonitoring(): void {
    // Monitorer les FAQs en traitement
    setInterval(() => {
      this.checkProcessingFAQs();
    }, 60000); // Toutes les minutes

    // Monitorer les statistiques
    setInterval(() => {
      this.updateStats();
    }, 300000); // Toutes les 5 minutes
  }

  /**
   * Vérifie les FAQs en traitement
   */
  private checkProcessingFAQs(): void {
    // Simuler la vérification des FAQs en traitement
    console.log('❓ Vérification des FAQs en traitement...');
  }

  /**
   * Met à jour les statistiques
   */
  private updateStats(): void {
    // Simuler la mise à jour des statistiques
    console.log('❓ Mise à jour des statistiques FAQ...');
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
        console.error('❌ Erreur callback événement FAQ:', error);
      }
    }
  }

  /**
   * Détruit le service de FAQ
   */
  destroy(): void {
    // Vider les caches
    this.faqs.clear();
    this.templates.clear();
    this.categories.clear();
    this.eventCallbacks.clear();
    
    console.log('❓ Service de génération FAQ détruit');
  }
}

// Instance singleton
export const faqGenerationService = new FAQGenerationService();

// Export des fonctions utilitaires
export const generateFAQ = (
  documentId: string,
  userId: string,
  settings?: Partial<FAQSettings>,
  options?: {
    title?: string;
    description?: string;
    category?: string;
    subcategory?: string;
    tags?: string[];
  }
) => faqGenerationService.generateFAQ(documentId, userId, settings, options);

export const getFAQ = (faqId: string, userId?: string) => 
  faqGenerationService.getFAQ(faqId, userId);

export const getUserFAQs = (
  userId: string,
  options?: {
    status?: FAQStatus;
    category?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'updated_at' | 'title' | 'status';
    sortOrder?: 'asc' | 'desc';
  }
) => faqGenerationService.getUserFAQs(userId, options);

export const searchFAQs = (
  userId: string,
  query: string,
  options?: {
    category?: string;
    difficulty?: string;
    tags?: string[];
    limit?: number;
  }
) => faqGenerationService.searchFAQs(userId, query, options);

export const addFAQFeedback = (
  questionId: string,
  userId: string,
  feedback: {
    type: 'helpful' | 'not_helpful' | 'inaccurate' | 'incomplete' | 'confusing';
    comment?: string;
    rating?: number;
  }
) => faqGenerationService.addFeedback(questionId, userId, feedback);

export const exportFAQ = (
  faqId: string,
  userId: string,
  format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'html' | 'markdown',
  options?: ExportOptions
) => faqGenerationService.exportFAQ(faqId, userId, format, options);

export const getFAQStats = (userId?: string) => faqGenerationService.getStats(userId);
