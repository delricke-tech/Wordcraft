/**
 * Service d'intégration Google Slides (présentations)
 * 
 * Ce service gère l'intégration avec Google Slides, l'importation automatique,
 * la conversion de présentations et la gestion des slides
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface GoogleSlidesIntegration {
  id: string;
  userId: string;
  googleAccountId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: string;
  scopes: string[];
  isActive: boolean;
  lastSyncAt?: string;
  syncSettings: SlidesSyncSettings;
  createdAt: string;
  updatedAt: string;
}

export interface SlidesSyncSettings {
  autoSync: boolean;
  syncInterval: number; // en minutes
  syncFolders: string[];
  fileTypes: string[];
  excludeShared: boolean;
  excludeTrashed: boolean;
  maxFileSize: number; // en MB
  convertToMarkdown: boolean;
  preserveFormatting: boolean;
  extractImages: boolean;
  extractNotes: boolean;
  extractSpeakerNotes: boolean;
  createBackups: boolean;
  notifyChanges: boolean;
}

export interface GooglePresentation {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  editedAt: string;
  webViewLink: string;
  webContentLink: string;
  exportLinks: ExportLink[];
  parents: string[];
  owners: GoogleUser[];
  permissions: GooglePermission[];
  isShared: boolean;
  isTrashed: boolean;
  version: string;
  thumbnailUrl: string;
  thumbnailSize: string;
  slides: Slide[];
  metadata: PresentationMetadata;
  syncStatus: SyncStatus;
  importedAt?: string;
  lastSyncAt?: string;
  syncError?: string;
}

export interface Slide {
  id: string;
  objectId: string;
  title: string;
  index: number;
  layout: string;
  background: Background;
  elements: SlideElement[];
  notes?: SpeakerNotes;
  thumbnailUrl?: string;
  thumbnailSize?: string;
  content: string; // contenu converti
  metadata: SlideMetadata;
}

export interface Background {
  type: 'solid' | 'gradient' | 'image' | 'pattern';
  color?: string;
  gradient?: Gradient;
  image?: ImageElement;
  pattern?: Pattern;
}

export interface Gradient {
  type: string;
  stops: GradientStop[];
  angle?: number;
}

export interface GradientStop {
  color: string;
  position: number;
}

export interface ImageElement {
  sourceUrl: string;
  contentUrl: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  cropProperties?: CropProperties;
}

export interface CropProperties {
  left: number;
  top: number;
  right: number;
  bottom: number;
  rotation: number;
}

export interface Pattern {
  type: string;
  foreground: string;
  background: string;
}

export interface SlideElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content: string;
  style: ElementStyle;
  metadata: ElementMetadata;
}

export type ElementType = 
  | 'text'
  | 'image'
  | 'shape'
  | 'table'
  | 'chart'
  | 'video'
  | 'line'
  | 'group'
  | 'word_art'
  | 'diagram'
  | 'equation';

export interface ElementStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
  textAlign?: string;
  verticalAlign?: string;
  lineSpacing?: number;
  letterSpacing?: number;
}

export interface ElementMetadata {
  altText?: string;
  link?: string;
  notes?: string;
  tags?: string[];
  customProperties?: Record<string, any>;
}

export interface SpeakerNotes {
  id: string;
  content: string;
  format: 'text' | 'html' | 'markdown';
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  padding?: number;
  timestamp?: string;
  speaker?: string;
}

export interface PresentationMetadata {
  slideCount: number;
  wordCount: number;
  characterCount: number;
  imageCount: number;
  tableCount: number;
  chartCount: number;
  videoCount: number;
  linkCount: number;
  commentCount: number;
  revisionCount: number;
  theme: ThemeInfo;
  layout: LayoutInfo;
  dimensions: Dimensions;
  language: string;
  locale: string;
  categories: string[];
  tags: string[];
  customProperties: Record<string, any>;
  exportSettings: ExportSettings;
}

export interface ThemeInfo {
  name: string;
  id: string;
  colors: ColorPalette;
  fonts: FontFamily[];
  backgrounds: Background[];
  slideMasters: SlideMaster[];
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  accent5: string;
  accent6: string;
  background1: string;
  background2: string;
  text1: string;
  text2: string;
  hyperlink: string;
  followedHyperlink: string;
}

export interface FontFamily {
  name: string;
  fontFamily: string;
  weight: string;
  style: string;
  size: number;
}

export interface SlideMaster {
  id: string;
  name: string;
  layout: string;
  background: Background;
  placeholders: Placeholder[];
}

export interface Placeholder {
  type: string;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  style?: ElementStyle;
}

export interface LayoutInfo {
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  aspectRatio: string;
  margins: Margins;
  slideSize: SlideSize;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SlideSize {
  width: number;
  height: number;
  unit: 'pixels' | 'inches' | 'centimeters' | 'points';
}

export interface Dimensions {
  width: number;
  height: number;
  unit: string;
  dpi: number;
}

export interface ExportSettings {
  format: 'markdown' | 'html' | 'pdf' | 'pptx' | 'png' | 'jpg';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: number;
  includeImages: boolean;
  includeNotes: boolean;
  includeComments: boolean;
  includeHiddenSlides: boolean;
  pageRange?: string;
  customOptions?: Record<string, any>;
}

export type SyncStatus = 
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'failed'
  | 'conflict'
  | 'deleted'
  | 'error';

export interface SlidesSyncSession {
  id: string;
  userId: string;
  googleAccountId: string;
  status: SyncStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  presentationsProcessed: number;
  presentationsSucceeded: number;
  presentationsFailed: number;
  presentationsSkipped: number;
  slidesProcessed: number;
  slidesExtracted: number;
  imagesExtracted: number;
  errors: SlidesSyncError[];
  summary: SlidesSyncSummary;
  createdAt: string;
}

export interface SlidesSyncError {
  presentationId: string;
  presentationName: string;
  slideId?: string;
  slideName?: string;
  errorType: string;
  errorMessage: string;
  errorCode?: string;
  stackTrace?: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface SlidesSyncSummary {
  totalPresentations: number;
  newPresentations: number;
  updatedPresentations: number;
  deletedPresentations: number;
  skippedPresentations: number;
  failedPresentations: number;
  totalSlides: number;
  extractedSlides: number;
  extractedImages: number;
  extractedNotes: number;
  totalSize: number;
  processingTime: number;
  averagePresentationSize: number;
  largestPresentationSize: number;
  smallestPresentationSize: number;
  presentationTypes: Record<string, number>;
  slideTypes: Record<string, number>;
  syncEfficiency: number;
  errorRate: number;
}

export interface GoogleSlidesStats {
  totalIntegrations: number;
  activeIntegrations: number;
  totalPresentations: number;
  syncedPresentations: number;
  failedPresentations: number;
  totalSlides: number;
  extractedSlides: number;
  averageSyncTime: number;
  totalStorageUsed: number;
  presentationTypes: Record<string, number>;
  slideTypes: Record<string, number>;
  presentationSizes: SizeStats;
  slideSizes: SizeStats;
  syncPerformance: SlidesSyncPerformance;
  userActivity: SlidesUserActivity;
  trends: {
    integrationTrend: number[];
    syncTrend: number[];
    presentationTrend: number[];
    slideTrend: number[];
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

export interface SlidesSyncPerformance {
  averageSyncTime: number;
  averageProcessingTime: number;
  averageExtractionTime: number;
  averageConversionTime: number;
  averageImageProcessingTime: number;
  throughput: number; // présentations par minute
  successRate: number;
  errorRate: number;
  retryRate: number;
  timeoutRate: number;
  networkLatency: number;
  apiCallCount: number;
  apiCallTime: number;
  imageProcessingCount: number;
  imageProcessingTime: number;
}

export interface SlidesUserActivity {
  lastLoginAt: string;
  lastSyncAt: string;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  presentationsCreated: number;
  presentationsUpdated: number;
  presentationsDeleted: number;
  slidesExtracted: number;
  imagesExtracted: number;
  averageSyncInterval: number;
  mostActiveDay: string;
  mostActiveHour: number;
  preferredPresentationType: string;
  preferredSlideLayout: string;
  syncPatterns: Record<string, number>;
}

export interface SlidesQuery {
  q?: string;
  fields?: string[];
  orderBy?: string[];
  pageSize?: number;
  pageToken?: string;
  includeItemsFromAllDrives?: boolean;
  driveId?: string;
  corpora?: string[];
  supportsAllDrives?: boolean;
}

export interface SlidesImportOptions {
  convertToMarkdown: boolean;
  preserveFormatting: boolean;
  extractImages: boolean;
  extractNotes: boolean;
  extractSpeakerNotes: boolean;
  includeComments: boolean;
  includeHiddenSlides: boolean;
  downloadImages: boolean;
  createBackups: boolean;
  overwriteExisting: boolean;
  folderStructure: boolean;
  batchSize: number;
  maxRetries: number;
  timeout: number;
  imageQuality: 'low' | 'medium' | 'high' | 'ultra';
  imageFormat: 'png' | 'jpg' | 'webp';
  noteFormat: 'text' | 'html' | 'markdown';
}

export interface SlidesConversionOptions {
  format: 'markdown' | 'html' | 'text' | 'json';
  preserveHeadings: boolean;
  preserveLists: boolean;
  preserveTables: boolean;
  preserveImages: boolean;
  preserveLinks: boolean;
  preserveNotes: boolean;
  preserveSpeakerNotes: boolean;
  customStyles: boolean;
  addMetadata: boolean;
  includeTableOfContents: boolean;
  slideSeparators: boolean;
  includeSlideNumbers: boolean;
  includeSlideTitles: boolean;
  includeSlideThumbnails: boolean;
}

class GoogleSlidesService {
  private integrations: Map<string, GoogleSlidesIntegration> = new Map();
  private presentations: Map<string, GooglePresentation> = new Map();
  private sessions: Map<string, SlidesSyncSession> = new Map();
  private eventCallbacks: Map<string, (event: any) => void> = new Map();
  private isInitialized: boolean = false;
  private syncTimer: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialise le service Google Slides
   */
  private async initializeService(): Promise<void> {
    try {
      // Charger les intégrations existantes
      await this.loadExistingIntegrations();
      
      // Démarrer les synchronisations automatiques
      this.startAutoSync();
      
      // Démarrer le monitoring
      this.startMonitoring();
      
      this.isInitialized = true;
      console.log('📊 Service Google Slides initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation service Google Slides:', error);
    }
  }

  /**
   * Configure une intégration Google Slides
   */
  async setupIntegration(
    userId: string,
    authorizationCode: string,
    syncSettings: SlidesSyncSettings
  ): Promise<GoogleSlidesIntegration> {
    try {
      // Échanger le code d'autorisation contre des tokens
      const tokens = await this.exchangeAuthorizationCode(authorizationCode);
      
      // Récupérer les informations du compte Google
      const userInfo = await this.getUserInfo(tokens.accessToken);
      
      // Créer l'intégration
      const integration: GoogleSlidesIntegration = {
        id: this.generateId(),
        userId,
        googleAccountId: userInfo.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: tokens.expiryDate,
        scopes: tokens.scopes,
        isActive: true,
        syncSettings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Stocker l'intégration
      this.integrations.set(integration.id, integration);

      // Sauvegarder dans la base de données
      await this.saveIntegration(integration);

      // Démarrer la synchronisation automatique
      this.startAutoSyncForIntegration(integration.id);

      console.log('📊 Intégration Google Slides configurée:', integration.id);
      return integration;

    } catch (error) {
      console.error('❌ Erreur configuration intégration Google Slides:', error);
      throw error;
    }
  }

  /**
   * Synchronise les présentations Google Slides
   */
  async syncPresentations(
    integrationId: string,
    options: SlidesImportOptions = {}
  ): Promise<SlidesSyncSession> {
    try {
      const integration = this.integrations.get(integrationId);
      if (!integration || !integration.isActive) {
        throw new Error('Intégration non trouvée ou inactive');
      }

      // Créer la session de synchronisation
      const session: SlidesSyncSession = {
        id: this.generateId(),
        userId: integration.userId,
        googleAccountId: integration.googleAccountId,
        status: 'syncing',
        startTime: new Date().toISOString(),
        presentationsProcessed: 0,
        presentationsSucceeded: 0,
        presentationsFailed: 0,
        presentationsSkipped: 0,
        slidesProcessed: 0,
        slidesExtracted: 0,
        imagesExtracted: 0,
        errors: [],
        summary: {
          totalPresentations: 0,
          newPresentations: 0,
          updatedPresentations: 0,
          deletedPresentations: 0,
          skippedPresentations: 0,
          failedPresentations: 0,
          totalSlides: 0,
          extractedSlides: 0,
          extractedImages: 0,
          extractedNotes: 0,
          totalSize: 0,
          processingTime: 0,
          averagePresentationSize: 0,
          largestPresentationSize: 0,
          smallestPresentationSize: 0,
          presentationTypes: {},
          slideTypes: {},
          syncEfficiency: 0,
          errorRate: 0
        },
        createdAt: new Date().toISOString()
      };

      this.sessions.set(session.id, session);

      try {
        // Récupérer la liste des présentations
        const presentations = await this.listGoogleSlides(integration, integration.syncSettings);
        
        // Traiter chaque présentation
        for (const presentation of presentations) {
          try {
            await this.processPresentation(integration, presentation, options);
            session.presentationsSucceeded++;
            session.summary.totalPresentations++;
          } catch (error) {
            session.presentationsFailed++;
            session.errors.push({
              presentationId: presentation.id,
              presentationName: presentation.name,
              errorType: 'processing_error',
              errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
              timestamp: new Date().toISOString(),
              resolved: false
            });
          }
          session.presentationsProcessed++;
        }

        // Calculer les statistiques
        session.summary = this.calculateSyncSummary(session);
        session.status = session.presentationsFailed === 0 ? 'synced' : 'failed';
        session.endTime = new Date().toISOString();
        session.duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();

      } catch (error) {
        session.status = 'failed';
        session.endTime = new Date().toISOString();
        session.duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
        session.errors.push({
          presentationId: '',
          presentationName: '',
          errorType: 'sync_error',
          errorMessage: error instanceof Error ? error.message : 'Erreur de synchronisation',
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      // Mettre à jour la session
      this.sessions.set(session.id, session);
      await this.saveSyncSession(session);

      // Mettre à jour l'intégration
      integration.lastSyncAt = new Date().toISOString();
      integration.updatedAt = new Date().toISOString();
      this.integrations.set(integrationId, integration);
      await this.updateIntegration(integration);

      console.log('📊 Synchronisation terminée:', session.id);
      return session;

    } catch (error) {
      console.error('❌ Erreur synchronisation Google Slides:', error);
      throw error;
    }
  }

  /**
   * Traite une présentation individuelle
   */
  private async processPresentation(
    integration: GoogleSlidesIntegration,
    presentation: any,
    options: SlidesImportOptions
  ): Promise<void> {
    try {
      // Vérifier si la présentation doit être synchronisée
      if (!this.shouldSyncPresentation(presentation, integration.syncSettings)) {
        return;
      }

      // Récupérer les détails de la présentation
      const presentationDetails = await this.getPresentationDetails(presentation.id, integration.accessToken);
      
      // Récupérer les slides
      const slides = await this.getSlides(presentation.id, integration.accessToken);
      
      // Extraire les images si demandé
      const extractedImages = options.extractImages ? 
        await this.extractImages(slides, options) : [];
      
      // Extraire les notes si demandé
      const extractedNotes = options.extractNotes || options.extractSpeakerNotes ? 
        await this.extractNotes(slides, options) : [];
      
      // Convertir le contenu selon les options
      const convertedContent = await this.convertPresentationContent(
        presentationDetails,
        slides,
        options
      );
      
      // Extraire les métadonnées
      const metadata = await this.extractPresentationMetadata(presentationDetails, slides);
      
      // Créer la présentation dans notre base de données
      const googlePresentation: GooglePresentation = {
        id: presentation.id,
        name: presentation.name,
        mimeType: presentation.mimeType,
        size: presentation.size || 0,
        createdAt: presentation.createdTime,
        modifiedAt: presentation.modifiedTime,
        editedAt: presentation.modifiedTime,
        webViewLink: presentation.webViewLink,
        webContentLink: presentation.webContentLink,
        exportLinks: presentation.exportLinks || [],
        parents: presentation.parents || [],
        owners: presentation.owners || [],
        permissions: presentation.permissions || [],
        isShared: presentation.shared || false,
        isTrashed: presentation.trashed || false,
        version: presentation.version || '1',
        thumbnailUrl: presentation.thumbnailUrl || '',
        thumbnailSize: presentation.thumbnailSize || '',
        slides: slides,
        metadata,
        syncStatus: 'synced',
        importedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString()
      };

      // Stocker la présentation
      this.presentations.set(presentation.id, googlePresentation);
      await this.savePresentation(googlePresentation);

    } catch (error) {
      console.error('❌ Erreur traitement présentation:', presentation.id, error);
      throw error;
    }
  }

  /**
   * Liste les présentations Google Slides
   */
  private async listGoogleSlides(
    integration: GoogleSlidesIntegration,
    syncSettings: SlidesSyncSettings
  ): Promise<any[]> {
    try {
      const query: SlidesQuery = {
        q: this.buildQuery(syncSettings),
        fields: ['id', 'name', 'mimeType', 'size', 'createdTime', 'modifiedTime', 'webViewLink', 'webContentLink', 'exportLinks', 'parents', 'owners', 'permissions', 'shared', 'trashed', 'version', 'thumbnailUrl', 'thumbnailSize'],
        pageSize: 1000,
        orderBy: ['modifiedTime desc']
      };

      const response = await this.makeGoogleSlidesRequest('files', query, integration.accessToken);
      
      return response.files || [];

    } catch (error) {
      console.error('❌ Erreur liste présentations Google Slides:', error);
      throw error;
    }
  }

  /**
   * Construit la requête de recherche
   */
  private buildQuery(syncSettings: SlidesSyncSettings): string {
    const conditions = [];
    
    // Filtre par type MIME
    if (syncSettings.fileTypes.length > 0) {
      const mimeTypeQuery = syncSettings.fileTypes
        .map(type => `mimeType='${type}'`)
        .join(' or ');
      conditions.push(mimeTypeQuery);
    }
    
    // Exclure les présentations partagées
    if (syncSettings.excludeShared) {
      conditions.push('shared=false');
    }
    
    // Exclure les présentations dans la corbeille
    if (syncSettings.excludeTrashed) {
      conditions.push('trashed=false');
    }
    
    return conditions.join(' and ');
  }

  /**
   * Récupère les détails d'une présentation
   */
  private async getPresentationDetails(
    presentationId: string,
    accessToken: string
  ): Promise<any> {
    try {
      const response = await this.makeGoogleSlidesRequest(
        `files/${presentationId}`,
        { fields: 'id, name, size, createdTime, modifiedTime, webViewLink, webContentLink, exportLinks, parents, owners, permissions, shared, trashed, version, thumbnailUrl, thumbnailSize' },
        accessToken
      );
      
      return response;

    } catch (error) {
      console.error('❌ Erreur récupération détails présentation:', presentationId, error);
      throw error;
    }
  }

  /**
   * Récupère les slides d'une présentation
   */
  private async getSlides(
    presentationId: string,
    accessToken: string
  ): Promise<Slide[]> {
    try {
      const response = await this.makeGoogleSlidesRequest(
        `presentations/${presentationId}/pages`,
        { pageSize: 100 },
        accessToken
      );
      
      // Convertir les slides en format Slide
      const slides: Slide[] = [];
      if (response.slides) {
        for (let i = 0; i < response.slides.length; i++) {
          const slideData = response.slides[i];
          const slide: Slide = {
            id: slideData.objectId,
            objectId: slideData.objectId,
            title: slideData.title || `Slide ${i + 1}`,
            index: i,
            layout: slideData.layout || 'TITLE',
            background: slideData.background || { type: 'solid', color: '#ffffff' },
            elements: this.extractElements(slideData),
            notes: slideData.speakerNotes ? {
              id: `notes_${slideData.objectId}`,
              content: slideData.speakerNotes,
              format: 'text',
              fontSize: 12,
              fontFamily: 'Arial',
              color: '#000000',
              backgroundColor: '#ffffff',
              padding: 10
            } : undefined,
            thumbnailUrl: slideData.thumbnailUrl,
            thumbnailSize: slideData.thumbnailSize,
            content: this.convertSlideContent(slideData),
            metadata: {
              altText: slideData.altText || '',
              link: slideData.link || '',
              notes: slideData.speakerNotes || '',
              tags: [],
              customProperties: {}
            }
          };
          slides.push(slide);
        }
      }
      
      return slides;

    } catch (error) {
      console.error('❌ Erreur récupération slides:', presentationId, error);
      throw error;
    }
  }

  /**
   * Extrait les éléments d'un slide
   */
  private extractElements(slideData: any): SlideElement[] {
    const elements: SlideElement[] = [];
    
    if (slideData.pageElements) {
      for (const elementData of slideData.pageElements) {
        const element: SlideElement = {
          id: elementData.objectId,
          type: this.getElementType(elementData),
          x: elementData.transform?.translateX || 0,
          y: elementData.transform?.translateY || 0,
          width: elementData.size?.width || 0,
          height: elementData.size?.height || 0,
          rotation: elementData.transform?.rotate || 0,
          content: this.extractElementContent(elementData),
          style: this.extractElementStyle(elementData),
          metadata: {
            altText: elementData.altText || '',
            link: elementData.link || '',
            notes: '',
            tags: [],
            customProperties: {}
          }
        };
        elements.push(element);
      }
    }
    
    return elements;
  }

  /**
   * Détermine le type d'élément
   */
  private getElementType(elementData: any): ElementType {
    if (elementData.shape) return 'shape';
    if (elementData.image) return 'image';
    if (elementData.table) return 'table';
    if (elementData.chart) return 'chart';
    if (elementData.video) return 'video';
    if (elementData.line) return 'line';
    if (elementData.group) return 'group';
    if (elementData.wordArt) return 'word_art';
    if (elementData.diagram) return 'diagram';
    if (elementData.equation) return 'equation';
    return 'text';
  }

  /**
   * Extrait le contenu d'un élément
   */
  private extractElementContent(elementData: any): string {
    if (elementData.shape?.text?.textElements) {
      return elementData.shape.text.textElements
        .map((textElement: any) => textElement.textRun?.content || '')
        .join('');
    }
    if (elementData.image) {
      return '[Image]';
    }
    if (elementData.table) {
      return '[Table]';
    }
    if (elementData.chart) {
      return '[Chart]';
    }
    if (elementData.video) {
      return '[Video]';
    }
    return '';
  }

  /**
   * Extrait le style d'un élément
   */
  private extractElementStyle(elementData: any): ElementStyle {
    const style: ElementStyle = {};
    
    if (elementData.shape?.text?.style) {
      const textStyle = elementData.shape.text.style;
      style.fontFamily = textStyle.fontFamily;
      style.fontSize = textStyle.fontSize?.magnitude;
      style.fontWeight = textStyle.bold ? 'bold' : 'normal';
      style.fontStyle = textStyle.italic ? 'italic' : 'normal';
      style.color = textStyle.foregroundColor?.opaqueColor?.rgbColor;
      style.textAlign = textStyle.alignment;
    }
    
    return style;
  }

  /**
   * Convertit le contenu d'un slide
   */
  private convertSlideContent(slideData: any): string {
    let content = `# ${slideData.title || `Slide ${slideData.objectId}`}\n\n`;
    
    if (slideData.pageElements) {
      for (const element of slideData.pageElements) {
        const elementContent = this.extractElementContent(element);
        if (elementContent) {
          content += `${elementContent}\n\n`;
        }
      }
    }
    
    if (slideData.speakerNotes) {
      content += `## Notes\n\n${slideData.speakerNotes}\n\n`;
    }
    
    return content;
  }

  /**
   * Extrait les images des slides
   */
  private async extractImages(
    slides: Slide[],
    options: SlidesImportOptions
  ): Promise<any[]> {
    try {
      const images: any[] = [];
      
      for (const slide of slides) {
        for (const element of slide.elements) {
          if (element.type === 'image' && element.metadata.link) {
            const imageData = {
              slideId: slide.id,
              elementId: element.id,
              url: element.metadata.link,
              width: element.width,
              height: element.height,
              format: options.imageFormat,
              quality: options.imageQuality,
              extractedAt: new Date().toISOString()
            };
            images.push(imageData);
          }
        }
      }
      
      return images;

    } catch (error) {
      console.error('❌ Erreur extraction images:', error);
      throw error;
    }
  }

  /**
   * Extrait les notes des slides
   */
  private async extractNotes(
    slides: Slide[],
    options: SlidesImportOptions
  ): Promise<SpeakerNotes[]> {
    try {
      const notes: SpeakerNotes[] = [];
      
      for (const slide of slides) {
        if (slide.notes) {
          notes.push(slide.notes);
        }
      }
      
      return notes;

    } catch (error) {
      console.error('❌ Erreur extraction notes:', error);
      throw error;
    }
  }

  /**
   * Convertit le contenu de la présentation
   */
  private async convertPresentationContent(
    presentationDetails: any,
    slides: Slide[],
    options: SlidesImportOptions
  ): Promise<string> {
    try {
      let content = `# ${presentationDetails.name}\n\n`;
      
      // Ajouter les métadonnées
      content += `## Présentation\n\n`;
      content += `- **Créée le**: ${new Date(presentationDetails.createdTime).toLocaleDateString()}\n`;
      content += `- **Modifiée le**: ${new Date(presentationDetails.modifiedTime).toLocaleDateString()}\n`;
      content += `- **Nombre de slides**: ${slides.length}\n`;
      content += `- **Lien**: [Ouvrir dans Google Slides](${presentationDetails.webViewLink})\n\n`;
      
      // Ajouter les slides
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        content += `---\n\n`;
        content += `## Slide ${i + 1}: ${slide.title}\n\n`;
        content += slide.content;
        
        if (options.includeSlideNumbers) {
          content += `\n*Slide ${i + 1}*`;
        }
        
        if (options.slideSeparators) {
          content += `\n---\n`;
        }
      }
      
      return content;

    } catch (error) {
      console.error('❌ Erreur conversion contenu présentation:', error);
      throw error;
    }
  }

  /**
   * Extrait les métadonnées de la présentation
   */
  private async extractPresentationMetadata(
    presentationDetails: any,
    slides: Slide[]
  ): Promise<PresentationMetadata> {
    try {
      // Compter les éléments
      let wordCount = 0;
      let characterCount = 0;
      let imageCount = 0;
      let tableCount = 0;
      let chartCount = 0;
      let videoCount = 0;
      let linkCount = 0;
      
      for (const slide of slides) {
        for (const element of slide.elements) {
          const content = element.content;
          wordCount += content.split(/\s+/).length;
          characterCount += content.length;
          
          if (element.type === 'image') imageCount++;
          if (element.type === 'table') tableCount++;
          if (element.type === 'chart') chartCount++;
          if (element.type === 'video') videoCount++;
          if (element.metadata.link) linkCount++;
        }
      }
      
      return {
        slideCount: slides.length,
        wordCount,
        characterCount,
        imageCount,
        tableCount,
        chartCount,
        videoCount,
        linkCount,
        commentCount: 0, // À implémenter
        revisionCount: 1,
        theme: {
          name: 'Default Theme',
          id: 'default',
          colors: {
            primary: '#4285f4',
            secondary: '#34a853',
            accent1: '#ea4335',
            accent2: '#fbbc05',
            accent3: '#4285f4',
            accent4: '#34a853',
            accent5: '#ea4335',
            accent6: '#fbbc05',
            background1: '#ffffff',
            background2: '#f8f9fa',
            text1: '#202124',
            text2: '#5f6368',
            hyperlink: '#1a73e8',
            followedHyperlink: '#1a73e8'
          },
          fonts: [],
          backgrounds: [],
          slideMasters: []
        },
        layout: {
          width: 1280,
          height: 720,
          orientation: 'landscape',
          aspectRatio: '16:9',
          margins: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
          },
          slideSize: {
            width: 1280,
            height: 720,
            unit: 'pixels',
            dpi: 96
          }
        },
        dimensions: {
          width: 1280,
          height: 720,
          unit: 'pixels',
          dpi: 96
        },
        language: 'fr',
        locale: 'fr_FR',
        categories: [],
        tags: [],
        customProperties: {},
        exportSettings: {
          format: 'markdown',
          quality: 'medium',
          resolution: 1920,
          includeImages: true,
          includeNotes: true,
          includeComments: false,
          includeHiddenSlides: false
        }
      };

    } catch (error) {
      console.error('❌ Erreur extraction métadonnées présentation:', error);
      throw error;
    }
  }

  /**
   * Vérifie si une présentation doit être synchronisée
   */
  private shouldSyncPresentation(presentation: any, syncSettings: SlidesSyncSettings): boolean {
    // Vérifier le type MIME
    if (syncSettings.fileTypes.length > 0 && !syncSettings.fileTypes.includes(presentation.mimeType)) {
      return false;
    }
    
    // Vérifier si c'est partagé
    if (syncSettings.excludeShared && presentation.shared) {
      return false;
    }
    
    // Vérifier si c'est dans la corbeille
    if (syncSettings.excludeTrashed && presentation.trashed) {
      return false;
    }
    
    // Vérifier la taille
    if (syncSettings.maxFileSize > 0 && presentation.size > syncSettings.maxFileSize * 1024 * 1024) {
      return false;
    }
    
    return true;
  }

  /**
   * Calcule les statistiques de synchronisation
   */
  private calculateSyncSummary(session: SlidesSyncSession): SlidesSyncSummary {
    const total = session.presentationsProcessed || 1;
    return {
      totalPresentations: session.presentationsProcessed,
      newPresentations: session.presentationsSucceeded,
      updatedPresentations: 0, // À calculer
      deletedPresentations: 0, // À calculer
      skippedPresentations: session.presentationsSkipped,
      failedPresentations: session.presentationsFailed,
      totalSlides: session.slidesProcessed,
      extractedSlides: session.slidesExtracted,
      extractedImages: session.imagesExtracted,
      extractedNotes: 0, // À calculer
      totalSize: 0, // À calculer
      processingTime: session.duration || 0,
      averagePresentationSize: 0, // À calculer
      largestPresentationSize: 0, // À calculer
      smallestPresentationSize: 0, // À calculer
      presentationTypes: {}, // À calculer
      slideTypes: {}, // À calculer
      syncEfficiency: (session.presentationsSucceeded / total) * 100,
      errorRate: (session.presentationsFailed / total) * 100
    };
  }

  /**
   * Échange le code d'autorisation contre des tokens
   */
  private async exchangeAuthorizationCode(authorizationCode: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiryDate: string;
    scopes: string[];
  }> {
    try {
      // Simuler l'échange de code d'autorisation
      // Dans un vrai projet, utiliser l'API OAuth2 de Google
      return {
        accessToken: 'mock_access_token_' + Math.random().toString(36).substr(2, 20),
        refreshToken: 'mock_refresh_token_' + Math.random().toString(36).substr(2, 20),
        expiryDate: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 heure
        scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/presentations']
      };

    } catch (error) {
      console.error('❌ Erreur échange code autorisation:', error);
      throw error;
    }
  }

  /**
   * Récupère les informations utilisateur
   */
  private async getUserInfo(accessToken: string): Promise<any> {
    try {
      // Simuler la récupération des infos utilisateur
      // Dans un vrai projet, utiliser l'API Google OAuth2
      return {
        id: 'google_user_' + Math.random().toString(36).substr(2, 10),
        displayName: 'Utilisateur Google',
        email: 'user@gmail.com',
        photoUrl: 'https://lh3.googleusercontent.com/photo.jpg',
        me: true
      };

    } catch (error) {
      console.error('❌ Erreur récupération infos utilisateur:', error);
      throw error;
    }
  }

  /**
   * Fait une requête à l'API Google Slides
   */
  private async makeGoogleSlidesRequest(
    endpoint: string,
    params: any,
    accessToken: string
  ): Promise<any> {
    try {
      // Simuler la requête API
      // Dans un vrai projet, utiliser fetch avec l'API Google Slides
      console.log('📊 Requête Google Slides:', endpoint, params);
      
      return {
        files: [],
        slides: [],
        nextPageToken: null
      };

    } catch (error) {
      console.error('❌ Erreur requête Google Slides:', error);
      throw error;
    }
  }

  /**
   * Démarre la synchronisation automatique
   */
  private startAutoSync(): void {
    for (const [integrationId, integration] of this.integrations.entries()) {
      if (integration.isActive && integration.syncSettings.autoSync) {
        this.startAutoSyncForIntegration(integrationId);
      }
    }
  }

  /**
   * Démarre la synchronisation automatique pour une intégration
   */
  private startAutoSyncForIntegration(integrationId: string): void {
    const integration = this.integrations.get(integrationId);
    if (!integration || !integration.isActive || !integration.syncSettings.autoSync) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        await this.syncPresentations(integrationId);
      } catch (error) {
        console.error('❌ Erreur synchronisation automatique:', integrationId, error);
      }
    }, integration.syncSettings.syncInterval * 60 * 1000); // Convertir en millisecondes

    this.syncTimer.set(integrationId, timer);
  }

  /**
   * Arrête la synchronisation automatique
   */
  private stopAutoSync(integrationId: string): void {
    const timer = this.syncTimer.get(integrationId);
    if (timer) {
      clearInterval(timer);
      this.syncTimer.delete(integrationId);
    }
  }

  /**
   * Démarre le monitoring
   */
  private startMonitoring(): void {
    // Monitorer les tokens expirés
    setInterval(() => {
      this.checkTokenExpiry();
    }, 60000); // Toutes les minutes

    // Monitorer les erreurs de synchronisation
    setInterval(() => {
      this.checkSyncErrors();
    }, 300000); // Toutes les 5 minutes
  }

  /**
   * Vérifie l'expiration des tokens
   */
  private checkTokenExpiry(): void {
    for (const [integrationId, integration] of this.integrations.entries()) {
      if (new Date() > new Date(integration.tokenExpiry)) {
        console.log('📊 Token expiré pour l\'intégration:', integrationId);
        // Tenter de rafraîchir le token
        this.refreshToken(integrationId);
      }
    }
  }

  /**
   * Rafraîchit le token d'accès
   */
  private async refreshToken(integrationId: string): Promise<void> {
    try {
      const integration = this.integrations.get(integrationId);
      if (!integration) return;

      // Simuler le rafraîchissement du token
      const newTokens = await this.exchangeAuthorizationCode('mock_code');
      
      // Mettre à jour l'intégration
      integration.accessToken = newTokens.accessToken;
      integration.refreshToken = newTokens.refreshToken;
      integration.tokenExpiry = newTokens.expiryDate;
      integration.updatedAt = new Date().toISOString();
      
      this.integrations.set(integrationId, integration);
      await this.updateIntegration(integration);

    } catch (error) {
      console.error('❌ Erreur rafraîchissement token:', integrationId, error);
    }
  }

  /**
   * Vérifie les erreurs de synchronisation
   */
  private checkSyncErrors(): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.status === 'failed' && !session.errors.some(e => e.resolved)) {
        console.log('📊 Erreur de synchronisation détectée:', sessionId);
        // Notifier l'utilisateur
        this.notifySyncError(session);
      }
    }
  }

  /**
   * Notifie une erreur de synchronisation
   */
  private notifySyncError(session: SlidesSyncSession): void {
    // Simuler la notification
    console.log('📊 Notification erreur synchronisation:', session.id);
  }

  /**
   * Obtient les statistiques Google Slides
   */
  async getStats(): Promise<GoogleSlidesStats> {
    try {
      const { data, error } = await supabase.rpc('get_google_slides_stats');

      if (error) throw error;

      const stats = data || {
        total_integrations: 0,
        active_integrations: 0,
        total_presentations: 0,
        synced_presentations: 0,
        failed_presentations: 0,
        total_slides: 0,
        extracted_slides: 0,
        average_sync_time: 0,
        total_storage_used: 0,
        presentation_types: {},
        slide_types: {},
        presentation_sizes: {
          average_size: 0,
          median_size: 0,
          min_size: 0,
          max_size: 0,
          total_size: 0,
          size_distribution: {}
        },
        slide_sizes: {
          average_size: 0,
          median_size: 0,
          min_size: 0,
          max_size: 0,
          total_size: 0,
          size_distribution: {}
        },
        sync_performance: {
          average_sync_time: 0,
          average_processing_time: 0,
          average_extraction_time: 0,
          average_conversion_time: 0,
          average_image_processing_time: 0,
          throughput: 0,
          success_rate: 0,
          error_rate: 0,
          retry_rate: 0,
          timeout_rate: 0,
          network_latency: 0,
          api_call_count: 0,
          api_call_time: 0,
          image_processing_count: 0,
          image_processing_time: 0
        },
        user_activity: {
          last_login_at: null,
          last_sync_at: null,
          total_syncs: 0,
          successful_syncs: 0,
          failed_syncs: 0,
          presentations_created: 0,
          presentations_updated: 0,
          presentations_deleted: 0,
          slides_extracted: 0,
          images_extracted: 0,
          average_sync_interval: 0,
          most_active_day: '',
          most_active_hour: 0,
          preferred_presentation_type: '',
          preferred_slide_layout: '',
          sync_patterns: {}
        },
        trends: {
          integration_trend: Array(7).fill(0),
          sync_trend: Array(7).fill(0),
          presentation_trend: Array(7).fill(0),
          slide_trend: Array(7).fill(0),
          error_trend: Array(7).fill(0)
        }
      };

      return {
        totalIntegrations: stats.total_integrations,
        activeIntegrations: stats.active_integrations,
        totalPresentations: stats.total_presentations,
        syncedPresentations: stats.synced_presentations,
        failedPresentations: stats.failed_presentations,
        totalSlides: stats.total_slides,
        extractedSlides: stats.extracted_slides,
        averageSyncTime: stats.average_sync_time,
        totalStorageUsed: stats.total_storage_used,
        presentationTypes: stats.presentation_types,
        slideTypes: stats.slide_types,
        presentationSizes: stats.presentation_sizes,
        slideSizes: stats.slide_sizes,
        syncPerformance: stats.sync_performance,
        userActivity: stats.user_activity,
        trends: {
          integrationTrend: stats.trends.integration_trend,
          syncTrend: stats.trends.sync_trend,
          presentationTrend: stats.trends.presentation_trend,
          slideTrend: stats.trends.slide_trend,
          errorTrend: stats.trends.error_trend
        }
      };

    } catch (error) {
      console.error('❌ Erreur statistiques Google Slides:', error);
      throw error;
    }
  }

  // Méthodes de base de données (simulées)

  private async loadExistingIntegrations(): Promise<void> {
    // Simuler le chargement des intégrations existantes
    console.log('📊 Chargement des intégrations Google Slides existantes...');
  }

  private async saveIntegration(integration: GoogleSlidesIntegration): Promise<void> {
    try {
      const { error } = await supabase
        .from('google_slides_integrations')
        .insert({
          id: integration.id,
          user_id: integration.userId,
          google_account_id: integration.googleAccountId,
          access_token: integration.accessToken,
          refresh_token: integration.refreshToken,
          token_expiry: integration.tokenExpiry,
          scopes: integration.scopes,
          is_active: integration.isActive,
          last_sync_at: integration.lastSyncAt,
          sync_settings: integration.syncSettings,
          created_at: integration.createdAt,
          updated_at: integration.updatedAt
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde intégration Google Slides:', error);
    }
  }

  private async updateIntegration(integration: GoogleSlidesIntegration): Promise<void> {
    try {
      const { error } = await supabase
        .from('google_slides_integrations')
        .update({
          access_token: integration.accessToken,
          refresh_token: integration.refreshToken,
          token_expiry: integration.tokenExpiry,
          is_active: integration.isActive,
          last_sync_at: integration.lastSyncAt,
          sync_settings: integration.syncSettings,
          updated_at: integration.updatedAt
        })
        .eq('id', integration.id);

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur mise à jour intégration Google Slides:', error);
    }
  }

  private async savePresentation(presentation: GooglePresentation): Promise<void> {
    try {
      const { error } = await supabase
        .from('google_slides_presentations')
        .insert({
          id: presentation.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          google_presentation_id: presentation.id,
          name: presentation.name,
          mime_type: presentation.mimeType,
          size: presentation.size,
          created_at: presentation.createdAt,
          modified_at: presentation.modifiedAt,
          edited_at: presentation.editedAt,
          web_view_link: presentation.webViewLink,
          web_content_link: presentation.webContentLink,
          export_links: presentation.exportLinks,
          parents: presentation.parents,
          owners: presentation.owners,
          permissions: presentation.permissions,
          is_shared: presentation.isShared,
          is_trashed: presentation.isTrashed,
          version: presentation.version,
          thumbnail_url: presentation.thumbnailUrl,
          thumbnail_size: presentation.thumbnailSize,
          slides: presentation.slides,
          metadata: presentation.metadata,
          sync_status: presentation.syncStatus,
          imported_at: presentation.importedAt,
          last_sync_at: presentation.lastSyncAt,
          sync_error: presentation.syncError
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde présentation Google Slides:', error);
    }
  }

  private async saveSyncSession(session: SlidesSyncSession): Promise<void> {
    try {
      const { error } = await supabase
        .from('google_slides_sync_sessions')
        .insert({
          id: session.id,
          user_id: session.userId,
          google_account_id: session.googleAccountId,
          status: session.status,
          start_time: session.startTime,
          end_time: session.endTime,
          duration: session.duration,
          presentations_processed: session.presentationsProcessed,
          presentations_succeeded: session.presentationsSucceeded,
          presentations_failed: session.presentationsFailed,
          presentations_skipped: session.presentationsSkipped,
          slides_processed: session.slidesProcessed,
          slides_extracted: session.slidesExtracted,
          images_extracted: session.imagesExtracted,
          errors: session.errors,
          summary: session.summary,
          created_at: session.createdAt
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde session synchronisation:', error);
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
        console.error('❌ Erreur callback événement Google Slides:', error);
      }
    }
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return `slides_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Détruit le service Google Slides
   */
  destroy(): void {
    // Arrêter tous les timers de synchronisation
    for (const timer of this.syncTimer.values()) {
      clearInterval(timer);
    }
    this.syncTimer.clear();

    // Vider les caches
    this.integrations.clear();
    this.presentations.clear();
    this.sessions.clear();
    this.eventCallbacks.clear();
    
    console.log('📊 Service Google Slides détruit');
  }
}

// Instance singleton
export const googleSlidesService = new GoogleSlidesService();

// Export des fonctions utilitaires
export const setupGoogleSlidesIntegration = (
  userId: string,
  authorizationCode: string,
  syncSettings: SlidesSyncSettings
) => googleSlidesService.setupIntegration(userId, authorizationCode, syncSettings);

export const syncGoogleSlides = (
  integrationId: string,
  options?: SlidesImportOptions
) => googleSlidesService.syncPresentations(integrationId, options);

export const getGoogleSlidesStats = () => googleSlidesService.getStats();
