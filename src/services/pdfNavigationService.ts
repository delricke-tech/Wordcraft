/**
 * Service de navigation PDF avancée
 * 
 * Ce service gère la navigation avancée dans les documents PDF avec thumbnails,
 * bookmarks, outline, recherche plein texte et navigation intelligente
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface PDFNavigationState {
  documentId: string;
  userId: string;
  currentPage: number;
  totalPages: number;
  zoom: number;
  rotation: number;
  scrollPosition: ScrollPosition;
  viewMode: ViewMode;
  layoutMode: LayoutMode;
  fitMode: FitMode;
  sidebarState: SidebarState;
  searchState: SearchState;
  bookmarks: Bookmark[];
  annotations: AnnotationMarker[];
  thumbnails: Thumbnail[];
  outline: OutlineItem[];
  history: NavigationHistory[];
  preferences: NavigationPreferences;
  lastAccessed: string;
  readingProgress: ReadingProgress;
}

export interface ScrollPosition {
  x: number;
  y: number;
  pageTop: number;
  pageLeft: number;
  viewportWidth: number;
  viewportHeight: number;
  scale: number;
}

export type ViewMode = 'single' | 'continuous' | 'facing' | 'book' | 'magazine';

export type LayoutMode = 'vertical' | 'horizontal' | 'auto';

export type FitMode = 'auto' | 'page-width' | 'page-height' | 'page-fit' | 'custom';

export interface SidebarState {
  isOpen: boolean;
  activeTab: SidebarTab;
  width: number;
  position: 'left' | 'right';
  collapsed: boolean;
  tabs: SidebarTab[];
}

export type SidebarTab = 'thumbnails' | 'bookmarks' | 'outline' | 'search' | 'annotations' | 'layers' | 'attachments';

export interface SearchState {
  query: string;
  results: SearchResult[];
  currentIndex: number;
  isSearching: boolean;
  options: SearchOptions;
  filters: SearchFilters;
  history: SearchHistory[];
}

export interface SearchResult {
  id: string;
  text: string;
  pageNumber: number;
  position: TextPosition;
  context: string;
  snippet: string;
  relevance: number;
  matchType: MatchType;
  metadata: SearchMetadata;
}

export interface TextPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  textContent: string;
  bbox: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export type MatchType = 'exact' | 'partial' | 'fuzzy' | 'regex' | 'semantic';

export interface SearchMetadata {
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  surroundingText: string;
  distanceFromStart: number;
  distanceFromEnd: number;
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
  fuzzy: boolean;
  semantic: boolean;
  includeAnnotations: boolean;
  includeBookmarks: boolean;
  includeOutline: boolean;
  highlightMatches: boolean;
  maxResults: number;
  contextSize: number;
}

export interface SearchFilters {
  pages: number[];
  dateRange?: {
    start: string;
    end: string;
  };
  annotationTypes: string[];
  bookmarkTypes: string[];
  languages: string[];
}

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
  duration: number;
  options: SearchOptions;
}

export interface Bookmark {
  id: string;
  userId: string;
  documentId: string;
  title: string;
  description?: string;
  pageNumber: number;
  position: BookmarkPosition;
  style: BookmarkStyle;
  metadata: BookmarkMetadata;
  isPublic: boolean;
  isDefault: boolean;
  tags: string[];
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  lastVisited?: string;
  visitCount: number;
}

export interface BookmarkPosition {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
  scrollX: number;
  scrollY: number;
  pageTop: number;
  pageLeft: number;
}

export interface BookmarkStyle {
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  opacity: number;
  boxShadow: string;
  icon: string;
  iconSize: number;
}

export interface BookmarkMetadata {
  context: string;
  snippet: string;
  wordCount: number;
  characterCount: number;
  readingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  importance: 'low' | 'medium' | 'high';
  category: string;
  subcategory: string;
  tags: string[];
  relatedBookmarks: string[];
  customFields: Record<string, any>;
}

export interface Thumbnail {
  id: string;
  pageNumber: number;
  imageUrl: string;
  width: number;
  height: number;
  size: number;
  generatedAt: string;
  cacheKey: string;
  isLoading: boolean;
  error?: string;
  metadata: ThumbnailMetadata;
}

export interface ThumbnailMetadata {
  originalWidth: number;
  originalHeight: number;
  dpi: number;
  colorSpace: string;
  hasText: boolean;
  wordCount: number;
  imageCount: number;
  dominantColor: string;
  aspectRatio: number;
  fileSize: number;
  renderTime: number;
}

export interface OutlineItem {
  id: string;
  title: string;
  level: number;
  pageNumber: number;
  position: OutlinePosition;
  children: OutlineItem[];
  isOpen: boolean;
  metadata: OutlineMetadata;
  style: OutlineStyle;
}

export interface OutlinePosition {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
  destination: PageDestination;
}

export interface PageDestination {
  pageNumber: number;
  x: number;
  y: number;
  zoom: number;
  fit: FitMode;
  scrollMode: LayoutMode;
}

export interface OutlineMetadata {
  action: 'goto' | 'uri' | 'named' | 'launch';
  uri?: string;
  namedAction?: string;
  fileSpec?: string;
  parameters?: Record<string, any>;
  color: string;
  fontStyle: string;
  isBold: boolean;
  isItalic: boolean;
}

export interface OutlineStyle {
  color: string;
  backgroundColor: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  textDecoration: string;
  marginLeft: number;
  marginTop: number;
  marginBottom: number;
  icon?: string;
  iconSize: number;
}

export interface AnnotationMarker {
  id: string;
  type: string;
  pageNumber: number;
  position: AnnotationPosition;
  content: string;
  author: string;
  createdAt: string;
  isRead: boolean;
  color: string;
  icon: string;
}

export interface AnnotationPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface NavigationHistory {
  id: string;
  userId: string;
  documentId: string;
  action: NavigationAction;
  state: NavigationSnapshot;
  timestamp: string;
  duration: number;
  metadata: NavigationMetadata;
}

export type NavigationAction = 
  | 'page_change'
  | 'zoom_change'
  | 'rotation_change'
  | 'scroll'
  | 'search'
  | 'bookmark_create'
  | 'bookmark_visit'
  | 'outline_navigate'
  | 'thumbnail_click'
  | 'annotation_click'
  | 'view_mode_change'
  | 'layout_change'
  | 'fit_change';

export interface NavigationSnapshot {
  currentPage: number;
  zoom: number;
  rotation: number;
  scrollPosition: ScrollPosition;
  viewMode: ViewMode;
  layoutMode: LayoutMode;
  fitMode: FitMode;
  sidebarState: SidebarState;
  searchState?: SearchState;
}

export interface NavigationMetadata {
  source: 'user' | 'auto' | 'search' | 'bookmark' | 'outline';
  trigger: string;
  context: string;
  device: string;
  browser: string;
  sessionId: string;
  referrer?: string;
  utmSource?: string;
}

export interface NavigationPreferences {
  defaultViewMode: ViewMode;
  defaultLayoutMode: LayoutMode;
  defaultFitMode: FitMode;
  defaultZoom: number;
  sidebarWidth: number;
  sidebarPosition: 'left' | 'right';
  autoOpenSidebar: boolean;
  defaultSidebarTab: SidebarTab;
  thumbnailSize: 'small' | 'medium' | 'large';
  showPageNumbers: boolean;
  smoothScrolling: boolean;
  keyboardShortcuts: boolean;
  mouseGestures: boolean;
  touchGestures: boolean;
  autoSave: boolean;
  autoSync: boolean;
  theme: 'light' | 'dark' | 'auto' | 'sepia';
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  pageTransition: 'none' | 'fade' | 'slide' | 'flip';
  animationSpeed: number;
  highlightColor: string;
  searchHighlightColor: string;
  bookmarkColor: string;
  outlineColor: string;
}

export interface ReadingProgress {
  totalPages: number;
  readPages: number;
  currentPage: number;
  readingTime: number;
  averageReadingTime: number;
  estimatedTotalTime: number;
  completionPercentage: number;
  lastReadPage: number;
  readingSpeed: number; // pages per hour
  readingStreak: number; // consecutive days
  longestSession: number; // minutes
  totalSessions: number;
  bookmarksCreated: number;
  annotationsCreated: number;
  searchesPerformed: number;
  progressHistory: ProgressEntry[];
  readingGoals: ReadingGoal[];
}

export interface ProgressEntry {
  date: string;
  pagesRead: number;
  timeSpent: number;
  currentPage: number;
  sessionStart: string;
  sessionEnd: string;
  device: string;
  location?: string;
}

export interface ReadingGoal {
  id: string;
  type: 'pages' | 'time' | 'date' | 'completion';
  target: number;
  current: number;
  deadline: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NavigationStats {
  totalViews: number;
  totalReadingTime: number;
  averageSessionDuration: number;
  totalPagesRead: number;
  averagePagesPerSession: number;
  mostViewedPages: Array<{
    pageNumber: number;
    viewCount: number;
    averageTime: number;
  }>;
  bookmarkStats: {
    totalCreated: number;
    totalVisited: number;
    mostUsedTypes: Record<string, number>;
    averagePerDocument: number;
  };
  searchStats: {
    totalSearches: number;
    averageResults: number;
    mostSearchedTerms: Array<{
      term: string;
      count: number;
      averageResults: number;
    }>;
    searchSuccessRate: number;
  };
  navigationPatterns: {
    commonPaths: Array<{
      from: number;
      to: number;
      frequency: number;
    }>;
    preferredViewModes: Record<ViewMode, number>;
    preferredZoomLevels: Array<{
      zoom: number;
      usage: number;
    }>;
    sidebarUsage: Record<SidebarTab, number>;
  };
  userEngagement: {
    averageSessionLength: number;
    bounceRate: number;
    returnRate: number;
    featureUsage: Record<string, number>;
    satisfactionScore: number;
  };
}

class PDFNavigationService {
  private navigationStates: Map<string, PDFNavigationState> = new Map();
  private thumbnails: Map<string, Thumbnail[]> = new Map();
  private bookmarks: Map<string, Bookmark[]> = new Map();
  private outlines: Map<string, OutlineItem[]> = new Map();
  private searchResults: Map<string, SearchResult[]> = new Map();
  private eventCallbacks: Map<string, (event: any) => void> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialise le service de navigation PDF
   */
  private async initializeService(): Promise<void> {
    try {
      // Démarrer le monitoring
      this.startMonitoring();
      
      this.isInitialized = true;
      console.log('📖 Service de navigation PDF initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation service navigation PDF:', error);
    }
  }

  /**
   * Obtient ou crée l'état de navigation pour un document
   */
  async getNavigationState(
    documentId: string,
    userId: string,
    totalPages: number
  ): Promise<PDFNavigationState> {
    try {
      const cacheKey = `${documentId}_${userId}`;
      
      // Vérifier si l'état existe déjà
      if (this.navigationStates.has(cacheKey)) {
        return this.navigationStates.get(cacheKey)!;
      }

      // Récupérer depuis la base de données
      const { data, error } = await supabase
        .from('pdf_navigation_states')
        .select('*')
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .single();

      let state: PDFNavigationState;

      if (error || !data) {
        // Créer un nouvel état
        const preferences = await this.getUserPreferences(userId);
        
        state = {
          documentId,
          userId,
          currentPage: 1,
          totalPages,
          zoom: preferences.defaultZoom,
          rotation: 0,
          scrollPosition: {
            x: 0,
            y: 0,
            pageTop: 0,
            pageLeft: 0,
            viewportWidth: 800,
            viewportHeight: 600,
            scale: 1
          },
          viewMode: preferences.defaultViewMode,
          layoutMode: preferences.defaultLayoutMode,
          fitMode: preferences.defaultFitMode,
          sidebarState: {
            isOpen: preferences.autoOpenSidebar,
            activeTab: preferences.defaultSidebarTab,
            width: preferences.sidebarWidth,
            position: preferences.sidebarPosition,
            collapsed: false,
            tabs: ['thumbnails', 'bookmarks', 'outline', 'search', 'annotations', 'layers', 'attachments']
          },
          searchState: {
            query: '',
            results: [],
            currentIndex: 0,
            isSearching: false,
            options: {
              caseSensitive: false,
              wholeWord: false,
              regex: false,
              fuzzy: true,
              semantic: false,
              includeAnnotations: true,
              includeBookmarks: true,
              includeOutline: false,
              highlightMatches: true,
              maxResults: 100,
              contextSize: 50
            },
            filters: {
              pages: [],
              annotationTypes: [],
              bookmarkTypes: [],
              languages: []
            },
            history: []
          },
          bookmarks: [],
          annotations: [],
          thumbnails: [],
          outline: [],
          history: [],
          preferences,
          lastAccessed: new Date().toISOString(),
          readingProgress: {
            totalPages,
            readPages: 0,
            currentPage: 1,
            readingTime: 0,
            averageReadingTime: 0,
            estimatedTotalTime: 0,
            completionPercentage: 0,
            lastReadPage: 1,
            readingSpeed: 0,
            readingStreak: 0,
            longestSession: 0,
            totalSessions: 0,
            bookmarksCreated: 0,
            annotationsCreated: 0,
            searchesPerformed: 0,
            progressHistory: [],
            readingGoals: []
          }
        };

        // Sauvegarder le nouvel état
        await this.saveNavigationState(state);
      } else {
        // Reconstruire l'état depuis la base de données
        state = this.reconstructNavigationState(data);
      }

      // Charger les données associées
      await this.loadAssociatedData(state);

      // Mettre en cache
      this.navigationStates.set(cacheKey, state);

      return state;

    } catch (error) {
      console.error('❌ Erreur récupération état navigation:', error);
      throw error;
    }
  }

  /**
   * Met à jour l'état de navigation
   */
  async updateNavigationState(
    documentId: string,
    userId: string,
    updates: Partial<PDFNavigationState>,
    action?: NavigationAction,
    metadata?: Partial<NavigationMetadata>
  ): Promise<PDFNavigationState> {
    try {
      const cacheKey = `${documentId}_${userId}`;
      const state = this.navigationStates.get(cacheKey);
      
      if (!state) {
        throw new Error('État de navigation non trouvé');
      }

      // Sauvegarder l'état précédent pour l'historique
      const previousState = { ...state };

      // Appliquer les mises à jour
      Object.assign(state, updates);
      state.lastAccessed = new Date().toISOString();

      // Mettre à jour la progression de lecture
      if (updates.currentPage) {
        await this.updateReadingProgress(state, updates.currentPage);
      }

      // Enregistrer l'historique de navigation
      if (action) {
        await this.recordNavigationHistory(state, action, previousState, metadata);
      }

      // Sauvegarder l'état
      await this.saveNavigationState(state);

      // Émettre l'événement
      this.emit('navigation_state_updated', { state, updates, action });

      console.log('📖 État navigation mis à jour:', action);
      return state;

    } catch (error) {
      console.error('❌ Erreur mise à jour état navigation:', error);
      throw error;
    }
  }

  /**
   * Génère les thumbnails pour un document
   */
  async generateThumbnails(
    documentId: string,
    userId: string,
    totalPages: number,
    options: {
      size?: 'small' | 'medium' | 'large';
      quality?: 'low' | 'medium' | 'high';
      format?: 'png' | 'jpg' | 'webp';
      dpi?: number;
      force?: boolean;
    } = {}
  ): Promise<Thumbnail[]> {
    try {
      const cacheKey = `${documentId}_thumbnails`;
      
      // Vérifier si les thumbnails existent déjà
      if (!options.force && this.thumbnails.has(cacheKey)) {
        return this.thumbnails.get(cacheKey)!;
      }

      // Récupérer les thumbnails existants
      const { data: existingThumbnails, error } = await supabase
        .from('pdf_thumbnails')
        .select('*')
        .eq('document_id', documentId)
        .order('page_number', { ascending: true });

      if (error) throw error;

      const thumbnails: Thumbnail[] = [];
      const size = options.size || 'medium';
      const quality = options.quality || 'medium';
      const format = options.format || 'png';
      const dpi = options.dpi || 150;

      // Dimensions selon la taille
      const dimensions = {
        small: { width: 100, height: 140 },
        medium: { width: 150, height: 210 },
        large: { width: 200, height: 280 }
      }[size];

      for (let page = 1; page <= totalPages; page++) {
        // Vérifier si le thumbnail existe déjà
        const existing = existingThumbnails?.find(t => t.page_number === page);
        
        if (existing && !options.force) {
          thumbnails.push({
            id: existing.id,
            pageNumber: page,
            imageUrl: existing.image_url,
            width: existing.width,
            height: existing.height,
            size: existing.size,
            generatedAt: existing.generated_at,
            cacheKey: existing.cache_key,
            isLoading: false,
            metadata: existing.metadata
          });
        } else {
          // Générer un nouveau thumbnail
          const thumbnail = await this.generateSingleThumbnail(
            documentId,
            page,
            dimensions,
            quality,
            format,
            dpi
          );
          thumbnails.push(thumbnail);
        }
      }

      // Mettre en cache
      this.thumbnails.set(cacheKey, thumbnails);

      console.log('📖 Thumbnails générés:', thumbnails.length);
      return thumbnails;

    } catch (error) {
      console.error('❌ Erreur génération thumbnails:', error);
      throw error;
    }
  }

  /**
   * Génère un thumbnail pour une page spécifique
   */
  private async generateSingleThumbnail(
    documentId: string,
    pageNumber: number,
    dimensions: { width: number; height: number },
    quality: string,
    format: string,
    dpi: number
  ): Promise<Thumbnail> {
    try {
      // Simuler la génération de thumbnail
      // Dans un vrai projet, utiliser une librairie comme pdf-poppler ou un service externe
      
      const thumbnail: Thumbnail = {
        id: this.generateId(),
        pageNumber,
        imageUrl: `https://picsum.photos/seed/${documentId}_${pageNumber}/${dimensions.width}/${dimensions.height}`,
        width: dimensions.width,
        height: dimensions.height,
        size: dimensions.width * dimensions.height,
        generatedAt: new Date().toISOString(),
        cacheKey: `${documentId}_${pageNumber}_${dimensions.width}x${dimensions.height}`,
        isLoading: false,
        metadata: {
          originalWidth: 612,
          originalHeight: 792,
          dpi,
          colorSpace: 'RGB',
          hasText: true,
          wordCount: Math.floor(Math.random() * 500) + 100,
          imageCount: Math.floor(Math.random() * 5),
          dominantColor: '#ffffff',
          aspectRatio: dimensions.width / dimensions.height,
          fileSize: Math.floor(dimensions.width * dimensions.height * 0.001),
          renderTime: Math.random() * 1000 + 500
        }
      };

      // Sauvegarder dans la base de données
      const { error } = await supabase
        .from('pdf_thumbnails')
        .insert({
          id: thumbnail.id,
          document_id: documentId,
          page_number: pageNumber,
          image_url: thumbnail.imageUrl,
          width: thumbnail.width,
          height: thumbnail.height,
          size: thumbnail.size,
          generated_at: thumbnail.generatedAt,
          cache_key: thumbnail.cacheKey,
          metadata: thumbnail.metadata
        });

      if (error) throw error;

      return thumbnail;

    } catch (error) {
      console.error('❌ Erreur génération thumbnail page:', pageNumber, error);
      throw error;
    }
  }

  /**
   * Crée un bookmark
   */
  async createBookmark(
    documentId: string,
    userId: string,
    bookmark: Omit<Bookmark, 'id' | 'userId' | 'documentId' | 'createdAt' | 'updatedAt' | 'visitCount'>
  ): Promise<Bookmark> {
    try {
      const newBookmark: Bookmark = {
        id: this.generateId(),
        userId,
        documentId,
        ...bookmark,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        visitCount: 0
      };

      // Sauvegarder le bookmark
      const { error } = await supabase
        .from('pdf_bookmarks')
        .insert({
          id: newBookmark.id,
          user_id: userId,
          document_id: documentId,
          title: newBookmark.title,
          description: newBookmark.description,
          page_number: newBookmark.pageNumber,
          position: newBookmark.position,
          style: newBookmark.style,
          metadata: newBookmark.metadata,
          is_public: newBookmark.isPublic,
          is_default: newBookmark.isDefault,
          tags: newBookmark.tags,
          color: newBookmark.color,
          icon: newBookmark.icon,
          created_at: newBookmark.createdAt,
          updated_at: newBookmark.updatedAt,
          visit_count: newBookmark.visitCount
        });

      if (error) throw error;

      // Mettre à jour l'état de navigation
      const state = await this.getNavigationState(documentId, userId, 1);
      state.bookmarks.push(newBookmark);
      await this.updateNavigationState(documentId, userId, state, 'bookmark_create', {
        source: 'user',
        trigger: 'bookmark_creation',
        context: `Bookmark: ${newBookmark.title}`
      });

      // Émettre l'événement
      this.emit('bookmark_created', { bookmark: newBookmark });

      console.log('📖 Bookmark créé:', newBookmark.id);
      return newBookmark;

    } catch (error) {
      console.error('❌ Erreur création bookmark:', error);
      throw error;
    }
  }

  /**
   * Recherche du texte dans le document
   */
  async searchInDocument(
    documentId: string,
    userId: string,
    query: string,
    options: Partial<SearchOptions> = {}
  ): Promise<SearchResult[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      const state = await this.getNavigationState(documentId, userId, 1);
      
      // Fusionner les options de recherche
      const searchOptions = { ...state.searchState.options, ...options };
      
      // Mettre à jour l'état de recherche
      state.searchState.query = query;
      state.searchState.isSearching = true;
      state.searchState.options = searchOptions;

      // Simuler la recherche
      // Dans un vrai projet, utiliser une librairie comme pdf.js pour extraire le texte
      const results = await this.performSearch(documentId, query, searchOptions);

      // Mettre à jour l'état
      state.searchState.results = results;
      state.searchState.currentIndex = 0;
      state.searchState.isSearching = false;

      // Ajouter à l'historique
      state.searchState.history.unshift({
        id: this.generateId(),
        query,
        timestamp: new Date().toISOString(),
        resultCount: results.length,
        duration: Math.random() * 1000 + 100,
        options: searchOptions
      });

      // Limiter l'historique
      if (state.searchState.history.length > 50) {
        state.searchState.history = state.searchState.history.slice(0, 50);
      }

      await this.updateNavigationState(documentId, userId, state, 'search', {
        source: 'user',
        trigger: 'search_query',
        context: `Search: ${query}`
      });

      // Émettre l'événement
      this.emit('search_completed', { query, results, options: searchOptions });

      console.log('📖 Recherche terminée:', results.length, 'résultats');
      return results;

    } catch (error) {
      console.error('❌ Erreur recherche document:', error);
      throw error;
    }
  }

  /**
   * Effectue la recherche dans le document
   */
  private async performSearch(
    documentId: string,
    query: string,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    try {
      // Simuler la recherche
      const results: SearchResult[] = [];
      const totalPages = 10; // Simuler 10 pages

      for (let page = 1; page <= totalPages; page++) {
        // Simuler des résultats sur chaque page
        const resultCount = Math.floor(Math.random() * 3);
        
        for (let i = 0; i < resultCount; i++) {
          const result: SearchResult = {
            id: this.generateId(),
            text: `Texte trouvé contenant "${query}" sur la page ${page}`,
            pageNumber: page,
            position: {
              x: Math.random() * 400,
              y: Math.random() * 600,
              width: 100 + Math.random() * 200,
              height: 20,
              pageIndex: page,
              textContent: `Texte trouvé contenant "${query}" sur la page ${page}`,
              bbox: {
                x: Math.random() * 400,
                y: Math.random() * 600,
                width: 100 + Math.random() * 200,
                height: 20,
                page
              }
            },
            context: `Contexte autour du texte trouvé contenant "${query}"`,
            snippet: `...texte avant ${query} texte après...`,
            relevance: Math.random(),
            matchType: this.determineMatchType(query, options),
            metadata: {
              fontSize: 12,
              fontFamily: 'Arial',
              color: '#000000',
              backgroundColor: '#ffffff',
              isBold: false,
              isItalic: false,
              isUnderline: false,
              surroundingText: `Texte environnant la recherche de "${query}"`,
              distanceFromStart: Math.floor(Math.random() * 1000),
              distanceFromEnd: Math.floor(Math.random() * 1000)
            }
          };
          results.push(result);
        }
      }

      // Trier par pertinence
      results.sort((a, b) => b.relevance - a.relevance);

      // Limiter les résultats
      return results.slice(0, options.maxResults);

    } catch (error) {
      console.error('❌ Erreur recherche texte:', error);
      return [];
    }
  }

  /**
   * Détermine le type de correspondance
   */
  private determineMatchType(query: string, options: SearchOptions): MatchType {
    if (options.regex) return 'regex';
    if (options.fuzzy) return 'fuzzy';
    if (options.semantic) return 'semantic';
    if (options.wholeWord) return 'exact';
    return 'partial';
  }

  /**
   * Navigue vers une page spécifique
   */
  async navigateToPage(
    documentId: string,
    userId: string,
    pageNumber: number,
    options?: {
      x?: number;
      y?: number;
      zoom?: number;
      fit?: FitMode;
      animation?: boolean;
    }
  ): Promise<PDFNavigationState> {
    try {
      const state = await this.getNavigationState(documentId, userId, 1);
      
      if (pageNumber < 1 || pageNumber > state.totalPages) {
        throw new Error('Numéro de page invalide');
      }

      const updates: Partial<PDFNavigationState> = {
        currentPage: pageNumber
      };

      if (options?.x !== undefined || options?.y !== undefined) {
        updates.scrollPosition = {
          ...state.scrollPosition,
          x: options.x || 0,
          y: options.y || 0
        };
      }

      if (options?.zoom !== undefined) {
        updates.zoom = options.zoom;
      }

      if (options?.fit !== undefined) {
        updates.fitMode = options.fit;
      }

      return await this.updateNavigationState(documentId, userId, updates, 'page_change', {
        source: 'user',
        trigger: 'page_navigation',
        context: `Navigate to page ${pageNumber}`
      });

    } catch (error) {
      console.error('❌ Erreur navigation page:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques de navigation
   */
  async getStats(documentId?: string, userId?: string): Promise<NavigationStats> {
    try {
      const { data, error } = await supabase.rpc('get_pdf_navigation_stats', {
        p_document_id: documentId,
        p_user_id: userId
      });

      if (error) throw error;

      const stats = data || {
        total_views: 0,
        total_reading_time: 0,
        average_session_duration: 0,
        total_pages_read: 0,
        average_pages_per_session: 0,
        most_viewed_pages: [],
        bookmark_stats: {
          total_created: 0,
          total_visited: 0,
          most_used_types: {},
          average_per_document: 0
        },
        search_stats: {
          total_searches: 0,
          average_results: 0,
          most_searched_terms: [],
          search_success_rate: 0
        },
        navigation_patterns: {
          common_paths: [],
          preferred_view_modes: {},
          preferred_zoom_levels: [],
          sidebar_usage: {}
        },
        user_engagement: {
          average_session_length: 0,
          bounce_rate: 0,
          return_rate: 0,
          feature_usage: {},
          satisfaction_score: 0
        }
      };

      return {
        totalViews: stats.total_views,
        totalReadingTime: stats.total_reading_time,
        averageSessionDuration: stats.average_session_duration,
        totalPagesRead: stats.total_pages_read,
        averagePagesPerSession: stats.average_pages_per_session,
        mostViewedPages: stats.most_viewed_pages,
        bookmarkStats: stats.bookmark_stats,
        searchStats: stats.search_stats,
        navigationPatterns: stats.navigation_patterns,
        userEngagement: stats.user_engagement
      };

    } catch (error) {
      console.error('❌ Erreur statistiques navigation:', error);
      throw error;
    }
  }

  // Méthodes privées

  private async getUserPreferences(userId: string): Promise<NavigationPreferences> {
    try {
      const { data, error } = await supabase
        .from('user_navigation_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // Préférences par défaut
        return {
          defaultViewMode: 'continuous',
          defaultLayoutMode: 'vertical',
          defaultFitMode: 'page-width',
          defaultZoom: 1,
          sidebarWidth: 300,
          sidebarPosition: 'left',
          autoOpenSidebar: true,
          defaultSidebarTab: 'thumbnails',
          thumbnailSize: 'medium',
          showPageNumbers: true,
          smoothScrolling: true,
          keyboardShortcuts: true,
          mouseGestures: false,
          touchGestures: true,
          autoSave: true,
          autoSync: true,
          theme: 'auto',
          fontSize: 14,
          fontFamily: 'Arial',
          lineHeight: 1.5,
          pageTransition: 'fade',
          animationSpeed: 300,
          highlightColor: '#ffff00',
          searchHighlightColor: '#00ff00',
          bookmarkColor: '#0000ff',
          outlineColor: '#666666'
        };
      }

      return data.preferences as NavigationPreferences;

    } catch (error) {
      console.error('❌ Erreur récupération préférences utilisateur:', error);
      throw error;
    }
  }

  private reconstructNavigationState(data: any): PDFNavigationState {
    // Reconstruire l'état depuis les données de la base de données
    return {
      documentId: data.document_id,
      userId: data.user_id,
      currentPage: data.current_page,
      totalPages: data.total_pages,
      zoom: data.zoom,
      rotation: data.rotation,
      scrollPosition: data.scroll_position,
      viewMode: data.view_mode,
      layoutMode: data.layout_mode,
      fitMode: data.fit_mode,
      sidebarState: data.sidebar_state,
      searchState: data.search_state,
      bookmarks: data.bookmarks || [],
      annotations: data.annotations || [],
      thumbnails: data.thumbnails || [],
      outline: data.outline || [],
      history: data.history || [],
      preferences: data.preferences,
      lastAccessed: data.last_accessed,
      readingProgress: data.reading_progress
    };
  }

  private async loadAssociatedData(state: PDFNavigationState): Promise<void> {
    try {
      // Charger les bookmarks
      const { data: bookmarks } = await supabase
        .from('pdf_bookmarks')
        .select('*')
        .eq('document_id', state.documentId)
        .eq('user_id', state.userId)
        .order('created_at', { ascending: false });

      if (bookmarks) {
        state.bookmarks = bookmarks as Bookmark[];
      }

      // Charger les thumbnails
      const { data: thumbnails } = await supabase
        .from('pdf_thumbnails')
        .select('*')
        .eq('document_id', state.documentId)
        .order('page_number', { ascending: true });

      if (thumbnails) {
        state.thumbnails = thumbnails.map(t => ({
          id: t.id,
          pageNumber: t.page_number,
          imageUrl: t.image_url,
          width: t.width,
          height: t.height,
          size: t.size,
          generatedAt: t.generated_at,
          cacheKey: t.cache_key,
          isLoading: false,
          metadata: t.metadata
        }));
      }

      // Charger l'outline
      const { data: outline } = await supabase
        .from('pdf_outlines')
        .select('*')
        .eq('document_id', state.documentId)
        .order('level', { ascending: true });

      if (outline) {
        state.outline = outline as OutlineItem[];
      }

    } catch (error) {
      console.error('❌ Erreur chargement données associées:', error);
    }
  }

  private async saveNavigationState(state: PDFNavigationState): Promise<void> {
    try {
      const { error } = await supabase
        .from('pdf_navigation_states')
        .upsert({
          id: `${state.documentId}_${state.userId}`,
          document_id: state.documentId,
          user_id: state.userId,
          current_page: state.currentPage,
          total_pages: state.totalPages,
          zoom: state.zoom,
          rotation: state.rotation,
          scroll_position: state.scrollPosition,
          view_mode: state.viewMode,
          layout_mode: state.layoutMode,
          fit_mode: state.fitMode,
          sidebar_state: state.sidebarState,
          search_state: state.searchState,
          bookmarks: state.bookmarks,
          annotations: state.annotations,
          thumbnails: state.thumbnails,
          outline: state.outline,
          history: state.history,
          preferences: state.preferences,
          last_accessed: state.lastAccessed,
          reading_progress: state.readingProgress
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde état navigation:', error);
    }
  }

  private async updateReadingProgress(state: PDFNavigationState, currentPage: number): Promise<void> {
    try {
      const progress = state.readingProgress;
      
      // Marquer la page comme lue
      if (!progress.readPages) {
        progress.readPages = 0;
      }
      
      // Calculer les pages lues (simplifié)
      const readPages = Math.min(currentPage, progress.totalPages);
      progress.readPages = readPages;
      progress.currentPage = currentPage;
      progress.completionPercentage = (readPages / progress.totalPages) * 100;
      progress.lastReadPage = currentPage;

      // Mettre à jour la vitesse de lecture
      if (progress.readingTime > 0) {
        progress.readingSpeed = (readPages / progress.readingTime) * 3600; // pages par heure
      }

    } catch (error) {
      console.error('❌ Erreur mise à jour progression lecture:', error);
    }
  }

  private async recordNavigationHistory(
    state: PDFNavigationState,
    action: NavigationAction,
    previousState: PDFNavigationState,
    metadata?: Partial<NavigationMetadata>
  ): Promise<void> {
    try {
      const history: NavigationHistory = {
        id: this.generateId(),
        userId: state.userId,
        documentId: state.documentId,
        action,
        state: {
          currentPage: previousState.currentPage,
          zoom: previousState.zoom,
          rotation: previousState.rotation,
          scrollPosition: previousState.scrollPosition,
          viewMode: previousState.viewMode,
          layoutMode: previousState.layoutMode,
          fitMode: previousState.fitMode,
          sidebarState: previousState.sidebarState,
          searchState: previousState.searchState
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - new Date(previousState.lastAccessed).getTime(),
        metadata: {
          source: 'user',
          trigger: action,
          context: '',
          device: 'web',
          browser: 'unknown',
          sessionId: this.generateSessionId(),
          ...metadata
        }
      };

      // Ajouter à l'historique
      state.history.unshift(history);

      // Limiter l'historique
      if (state.history.length > 100) {
        state.history = state.history.slice(0, 100);
      }

      // Sauvegarder dans la base de données
      const { error } = await supabase
        .from('navigation_history')
        .insert({
          id: history.id,
          user_id: history.userId,
          document_id: history.documentId,
          action: history.action,
          state: history.state,
          timestamp: history.timestamp,
          duration: history.duration,
          metadata: history.metadata
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur enregistrement historique navigation:', error);
    }
  }

  private generateId(): string {
    return `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Démarre le monitoring
   */
  private startMonitoring(): void {
    // Monitorer les sessions actives
    setInterval(() => {
      this.checkActiveSessions();
    }, 60000); // Toutes les minutes

    // Monitorer les statistiques
    setInterval(() => {
      this.updateStats();
    }, 300000); // Toutes les 5 minutes
  }

  /**
   * Vérifie les sessions actives
   */
  private checkActiveSessions(): void {
    // Simuler la vérification des sessions actives
    console.log('📖 Vérification des sessions de navigation actives...');
  }

  /**
   * Met à jour les statistiques
   */
  private updateStats(): void {
    // Simuler la mise à jour des statistiques
    console.log('📖 Mise à jour des statistiques de navigation...');
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
        console.error('❌ Erreur callback événement navigation:', error);
      }
    }
  }

  /**
   * Détruit le service de navigation
   */
  destroy(): void {
    // Vider les caches
    this.navigationStates.clear();
    this.thumbnails.clear();
    this.bookmarks.clear();
    this.outlines.clear();
    this.searchResults.clear();
    this.eventCallbacks.clear();
    
    console.log('📖 Service de navigation PDF détruit');
  }
}

// Instance singleton
export const pdfNavigationService = new PDFNavigationService();

// Export des fonctions utilitaires
export const getPDFNavigationState = (
  documentId: string,
  userId: string,
  totalPages: number
) => pdfNavigationService.getNavigationState(documentId, userId, totalPages);

export const updatePDFNavigationState = (
  documentId: string,
  userId: string,
  updates: Partial<PDFNavigationState>,
  action?: NavigationAction,
  metadata?: Partial<NavigationMetadata>
) => pdfNavigationService.updateNavigationState(documentId, userId, updates, action, metadata);

export const generatePDFThumbnails = (
  documentId: string,
  userId: string,
  totalPages: number,
  options?: {
    size?: 'small' | 'medium' | 'large';
    quality?: 'low' | 'medium' | 'high';
    format?: 'png' | 'jpg' | 'webp';
    dpi?: number;
    force?: boolean;
  }
) => pdfNavigationService.generateThumbnails(documentId, userId, totalPages, options);

export const createPDFBookmark = (
  documentId: string,
  userId: string,
  bookmark: Omit<Bookmark, 'id' | 'userId' | 'documentId' | 'createdAt' | 'updatedAt' | 'visitCount'>
) => pdfNavigationService.createBookmark(documentId, userId, bookmark);

export const searchInPDFDocument = (
  documentId: string,
  userId: string,
  query: string,
  options?: Partial<SearchOptions>
) => pdfNavigationService.searchInDocument(documentId, userId, query, options);

export const navigateToPDFPage = (
  documentId: string,
  userId: string,
  pageNumber: number,
  options?: {
    x?: number;
    y?: number;
    zoom?: number;
    fit?: FitMode;
    animation?: boolean;
  }
) => pdfNavigationService.navigateToPage(documentId, userId, pageNumber, options);

export const getPDFNavigationStats = (documentId?: string, userId?: string) => 
  pdfNavigationService.getStats(documentId, userId);
