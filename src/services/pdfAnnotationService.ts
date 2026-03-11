/**
 * Service d'annotations PDF interactives
 * 
 * Ce service gère les annotations, surlignages, et interactions sur les documents PDF
 * avec sauvegarde en temps réel, collaboration et export avancé
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface PDFAnnotation {
  id: string;
  documentId: string;
  userId: string;
  type: AnnotationType;
  content: AnnotationContent;
  position: AnnotationPosition;
  style: AnnotationStyle;
  metadata: AnnotationMetadata;
  status: AnnotationStatus;
  permissions: AnnotationPermissions;
  createdAt: string;
  updatedAt: string;
  lastModifiedBy?: string;
}

export type AnnotationType = 
  | 'highlight'
  | 'underline'
  | 'strikeout'
  | 'squiggly'
  | 'note'
  | 'comment'
  | 'bookmark'
  | 'drawing'
  | 'text'
  | 'signature'
  | 'stamp'
  | 'link'
  | 'image'
  | 'audio'
  | 'video';

export interface AnnotationContent {
  text?: string;
  html?: string;
  markdown?: string;
  color?: string;
  backgroundColor?: string;
  opacity?: number;
  width?: number;
  height?: number;
  points?: Point[];
  path?: string;
  url?: string;
  mediaUrl?: string;
  duration?: number;
  thumbnail?: string;
  alt?: string;
  title?: string;
  description?: string;
  tags?: string[];
  mentions?: string[];
  attachments?: Attachment[];
}

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  tiltX?: number;
  tiltY?: number;
  timestamp?: number;
}

export interface AnnotationPosition {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scale?: number;
  zIndex?: number;
  anchored?: boolean;
  anchorPoint?: Point;
  boundingBox?: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  page?: number;
}

export interface AnnotationStyle {
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  opacity: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | 'light';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  padding?: number;
  margin?: number;
  borderRadius?: number;
  boxShadow?: string;
  filter?: string;
  transform?: string;
  animation?: string;
}

export interface AnnotationMetadata {
  source: 'manual' | 'ai' | 'import' | 'template';
  confidence?: number;
  extractedText?: string;
  context?: string;
  keywords?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  importance?: 'low' | 'medium' | 'high';
  category?: string;
  subcategory?: string;
  language?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  timeSpent?: number;
  viewCount?: number;
  editCount?: number;
  version?: number;
  parentAnnotationId?: string;
  childAnnotationIds?: string[];
  relatedAnnotationIds?: string[];
  customFields?: Record<string, any>;
}

export type AnnotationStatus = 
  | 'active'
  | 'hidden'
  | 'archived'
  | 'deleted'
  | 'pending'
  | 'approved'
  | 'rejected';

export interface AnnotationPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canComment: boolean;
  canShare: boolean;
  canExport: boolean;
  canPrint: boolean;
  canCopy: boolean;
  canMove: boolean;
  canResize: boolean;
  canChangeStyle: boolean;
  canAddReplies: boolean;
  canViewHistory: boolean;
  isOwner: boolean;
  sharedWith?: string[];
}

export interface AnnotationReply {
  id: string;
  annotationId: string;
  userId: string;
  content: string;
  mentions?: string[];
  attachments?: Attachment[];
  reactions?: Reaction[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  id: string;
  userId: string;
  type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry' | 'custom';
  customEmoji?: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

export interface AnnotationHistory {
  id: string;
  annotationId: string;
  userId: string;
  action: 'created' | 'updated' | 'deleted' | 'moved' | 'styled' | 'replied';
  previousState?: Partial<PDFAnnotation>;
  newState?: Partial<PDFAnnotation>;
  description?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AnnotationTemplate {
  id: string;
  name: string;
  description: string;
  type: AnnotationType;
  content: AnnotationContent;
  style: AnnotationStyle;
  category: string;
  tags: string[];
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnotationExport {
  id: string;
  documentId: string;
  format: 'pdf' | 'json' | 'csv' | 'xlsx' | 'markdown' | 'html';
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ExportOptions {
  includeAnnotations: boolean;
  includeComments: boolean;
  includeReplies: boolean;
  includeHistory: boolean;
  includeMetadata: boolean;
  includeAttachments: boolean;
  filterByType?: AnnotationType[];
  filterByUser?: string[];
  filterByStatus?: AnnotationStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  pageRange?: {
    start: number;
    end: number;
  };
  sortBy?: 'created_at' | 'updated_at' | 'type' | 'page';
  sortOrder?: 'asc' | 'desc';
  groupBy?: 'type' | 'page' | 'user' | 'category';
  format?: {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    colors: boolean;
    images: boolean;
    hyperlinks: boolean;
  };
}

export interface AnnotationStats {
  totalAnnotations: number;
  annotationsByType: Record<AnnotationType, number>;
  annotationsByPage: Record<number, number>;
  annotationsByUser: Record<string, number>;
  averageAnnotationsPerPage: number;
  mostAnnotatedPage: number;
  mostUsedType: AnnotationType;
  mostActiveUser: string;
  totalReplies: number;
  totalReactions: number;
  averageRepliesPerAnnotation: number;
  averageReactionsPerAnnotation: number;
  annotationGrowth: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  userActivity: {
    totalUsers: number;
    activeUsers: number;
    averageAnnotationsPerUser: number;
    topContributors: Array<{
      userId: string;
      annotationCount: number;
      replyCount: number;
      reactionCount: number;
    }>;
  };
  collaborationMetrics: {
    sharedAnnotations: number;
    collaborativeDocuments: number;
    averageCollaboratorsPerDocument: number;
    responseTime: number;
    engagementRate: number;
  };
}

class PDFAnnotationService {
  private annotations: Map<string, PDFAnnotation> = new Map();
  private templates: Map<string, AnnotationTemplate> = new Map();
  private history: Map<string, AnnotationHistory[]> = new Map();
  private eventCallbacks: Map<string, (event: any) => void> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialise le service d'annotations PDF
   */
  private async initializeService(): Promise<void> {
    try {
      // Charger les templates par défaut
      await this.loadDefaultTemplates();
      
      // Démarrer le monitoring
      this.startMonitoring();
      
      this.isInitialized = true;
      console.log('📝 Service d\'annotations PDF initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation service annotations PDF:', error);
    }
  }

  /**
   * Crée une nouvelle annotation
   */
  async createAnnotation(
    documentId: string,
    userId: string,
    type: AnnotationType,
    content: Partial<AnnotationContent>,
    position: AnnotationPosition,
    style?: Partial<AnnotationStyle>,
    metadata?: Partial<AnnotationMetadata>
  ): Promise<PDFAnnotation> {
    try {
      // Valider les données
      this.validateAnnotationData(type, content, position);

      // Créer l'annotation
      const annotation: PDFAnnotation = {
        id: this.generateId(),
        documentId,
        userId,
        type,
        content: this.mergeDefaultContent(type, content),
        position,
        style: this.mergeDefaultStyle(type, style),
        metadata: this.mergeDefaultMetadata(metadata),
        status: 'active',
        permissions: this.createDefaultPermissions(userId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Stocker l'annotation
      this.annotations.set(annotation.id, annotation);
      await this.saveAnnotation(annotation);

      // Enregistrer l'historique
      await this.recordHistory(annotation.id, userId, 'created', undefined, annotation);

      // Émettre l'événement
      this.emit('annotation_created', { annotation });

      console.log('📝 Annotation créée:', annotation.id);
      return annotation;

    } catch (error) {
      console.error('❌ Erreur création annotation:', error);
      throw error;
    }
  }

  /**
   * Met à jour une annotation
   */
  async updateAnnotation(
    annotationId: string,
    userId: string,
    updates: Partial<{
      content: Partial<AnnotationContent>;
      position: Partial<AnnotationPosition>;
      style: Partial<AnnotationStyle>;
      metadata: Partial<AnnotationMetadata>;
      status: AnnotationStatus;
    }>
  ): Promise<PDFAnnotation> {
    try {
      const annotation = this.annotations.get(annotationId);
      if (!annotation) {
        throw new Error('Annotation non trouvée');
      }

      // Vérifier les permissions
      if (!annotation.permissions.canEdit && annotation.userId !== userId) {
        throw new Error('Permission refusée');
      }

      // Sauvegarder l'état précédent
      const previousState = { ...annotation };

      // Appliquer les mises à jour
      if (updates.content) {
        annotation.content = { ...annotation.content, ...updates.content };
      }
      if (updates.position) {
        annotation.position = { ...annotation.position, ...updates.position };
      }
      if (updates.style) {
        annotation.style = { ...annotation.style, ...updates.style };
      }
      if (updates.metadata) {
        annotation.metadata = { ...annotation.metadata, ...updates.metadata };
      }
      if (updates.status) {
        annotation.status = updates.status;
      }

      annotation.updatedAt = new Date().toISOString();
      annotation.lastModifiedBy = userId;

      // Stocker et sauvegarder
      this.annotations.set(annotationId, annotation);
      await this.saveAnnotation(annotation);

      // Enregistrer l'historique
      await this.recordHistory(annotationId, userId, 'updated', previousState, annotation);

      // Émettre l'événement
      this.emit('annotation_updated', { annotation, previousState });

      console.log('📝 Annotation mise à jour:', annotationId);
      return annotation;

    } catch (error) {
      console.error('❌ Erreur mise à jour annotation:', error);
      throw error;
    }
  }

  /**
   * Supprime une annotation
   */
  async deleteAnnotation(annotationId: string, userId: string): Promise<void> {
    try {
      const annotation = this.annotations.get(annotationId);
      if (!annotation) {
        throw new Error('Annotation non trouvée');
      }

      // Vérifier les permissions
      if (!annotation.permissions.canDelete && annotation.userId !== userId) {
        throw new Error('Permission refusée');
      }

      // Marquer comme supprimée
      annotation.status = 'deleted';
      annotation.updatedAt = new Date().toISOString();
      annotation.lastModifiedBy = userId;

      // Sauvegarder
      this.annotations.set(annotationId, annotation);
      await this.saveAnnotation(annotation);

      // Enregistrer l'historique
      await this.recordHistory(annotationId, userId, 'deleted', annotation, undefined);

      // Émettre l'événement
      this.emit('annotation_deleted', { annotation });

      console.log('📝 Annotation supprimée:', annotationId);

    } catch (error) {
      console.error('❌ Erreur suppression annotation:', error);
      throw error;
    }
  }

  /**
   * Obtient les annotations d'un document
   */
  async getDocumentAnnotations(
    documentId: string,
    userId: string,
    options: {
      types?: AnnotationType[];
      status?: AnnotationStatus;
      page?: number;
      sortBy?: 'created_at' | 'updated_at' | 'type' | 'page';
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<PDFAnnotation[]> {
    try {
      let query = supabase
        .from('pdf_annotations')
        .select('*')
        .eq('document_id', documentId);

      // Filtrer par statut (par défaut active)
      if (options.status) {
        query = query.eq('status', options.status);
      } else {
        query = query.eq('status', 'active');
      }

      // Filtrer par types
      if (options.types && options.types.length > 0) {
        query = query.in('type', options.types);
      }

      // Filtrer par page
      if (options.page !== undefined) {
        query = query.eq('position->>pageNumber', options.page);
      }

      // Trier
      const sortBy = options.sortBy || 'created_at';
      const sortOrder = options.orderDesc || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, (options.offset || 0) + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrer par permissions
      const annotations = (data as PDFAnnotation[]).filter(annotation => 
        annotation.permissions.canView || 
        annotation.userId === userId ||
        annotation.permissions.sharedWith?.includes(userId)
      );

      return annotations;

    } catch (error) {
      console.error('❌ Erreur récupération annotations document:', error);
      throw error;
    }
  }

  /**
   * Ajoute une réponse à une annotation
   */
  async addReply(
    annotationId: string,
    userId: string,
    content: string,
    mentions?: string[],
    attachments?: Attachment[]
  ): Promise<AnnotationReply> {
    try {
      const annotation = this.annotations.get(annotationId);
      if (!annotation) {
        throw new Error('Annotation non trouvée');
      }

      // Vérifier les permissions
      if (!annotation.permissions.canAddReplies) {
        throw new Error('Permission refusée');
      }

      const reply: AnnotationReply = {
        id: this.generateId(),
        annotationId,
        userId,
        content,
        mentions: mentions || [],
        attachments: attachments || [],
        reactions: [],
        isEdited: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Sauvegarder la réponse
      await this.saveReply(reply);

      // Mettre à jour les métadonnées de l'annotation
      annotation.metadata.childAnnotationIds = [
        ...(annotation.metadata.childAnnotationIds || []),
        reply.id
      ];
      annotation.updatedAt = new Date().toISOString();
      await this.saveAnnotation(annotation);

      // Émettre l'événement
      this.emit('reply_added', { reply, annotation });

      console.log('📝 Réponse ajoutée:', reply.id);
      return reply;

    } catch (error) {
      console.error('❌ Erreur ajout réponse:', error);
      throw error;
    }
  }

  /**
   * Ajoute une réaction à une annotation ou réponse
   */
  async addReaction(
    targetId: string,
    userId: string,
    type: Reaction['type'],
    customEmoji?: string
  ): Promise<Reaction> {
    try {
      const reaction: Reaction = {
        id: this.generateId(),
        userId,
        type,
        customEmoji,
        createdAt: new Date().toISOString()
      };

      // Sauvegarder la réaction
      await this.saveReaction(targetId, reaction);

      // Émettre l'événement
      this.emit('reaction_added', { reaction, targetId });

      console.log('📝 Réaction ajoutée:', reaction.id);
      return reaction;

    } catch (error) {
      console.error('❌ Erreur ajout réaction:', error);
      throw error;
    }
  }

  /**
   * Exporte les annotations d'un document
   */
  async exportAnnotations(
    documentId: string,
    userId: string,
    format: 'pdf' | 'json' | 'csv' | 'xlsx' | 'markdown' | 'html',
    options: ExportOptions = {}
  ): Promise<AnnotationExport> {
    try {
      // Vérifier les permissions
      const annotations = await this.getDocumentAnnotations(documentId, userId);
      if (annotations.length === 0) {
        throw new Error('Aucune annotation à exporter');
      }

      const exportData: AnnotationExport = {
        id: this.generateId(),
        documentId,
        format,
        options,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Traiter l'export
      const exportedContent = await this.processExport(annotations, format, options);
      
      // Sauvegarder le fichier exporté
      const fileUrl = await this.saveExportFile(exportData.id, exportedContent, format);
      
      exportData.status = 'completed';
      exportData.fileUrl = fileUrl;
      exportData.fileSize = exportedContent.length;
      exportData.completedAt = new Date().toISOString();

      console.log('📝 Export annotations terminé:', exportData.id);
      return exportData;

    } catch (error) {
      console.error('❌ Erreur export annotations:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques d'annotations
   */
  async getStats(documentId?: string): Promise<AnnotationStats> {
    try {
      const { data, error } = await supabase.rpc('get_pdf_annotation_stats', {
        p_document_id: documentId
      });

      if (error) throw error;

      const stats = data || {
        total_annotations: 0,
        annotations_by_type: {},
        annotations_by_page: {},
        annotations_by_user: {},
        average_annotations_per_page: 0,
        most_annotated_page: 0,
        most_used_type: 'highlight',
        most_active_user: '',
        total_replies: 0,
        total_reactions: 0,
        average_replies_per_annotation: 0,
        average_reactions_per_annotation: 0,
        annotation_growth: { daily: Array(30).fill(0), weekly: Array(12).fill(0), monthly: Array(12).fill(0) },
        user_activity: { total_users: 0, active_users: 0, average_annotations_per_user: 0, top_contributors: [] },
        collaboration_metrics: { shared_annotations: 0, collaborative_documents: 0, average_collaborators_per_document: 0, response_time: 0, engagement_rate: 0 }
      };

      return {
        totalAnnotations: stats.total_annotations,
        annotationsByType: stats.annotations_by_type,
        annotationsByPage: stats.annotations_by_page,
        annotationsByUser: stats.annotations_by_user,
        averageAnnotationsPerPage: stats.average_annotations_per_page,
        mostAnnotatedPage: stats.most_annotated_page,
        mostUsedType: stats.most_used_type,
        mostActiveUser: stats.most_active_user,
        totalReplies: stats.total_replies,
        totalReactions: stats.total_reactions,
        averageRepliesPerAnnotation: stats.average_replies_per_annotation,
        averageReactionsPerAnnotation: stats.average_reactions_per_annotation,
        annotationGrowth: stats.annotation_growth,
        userActivity: stats.user_activity,
        collaborationMetrics: stats.collaboration_metrics
      };

    } catch (error) {
      console.error('❌ Erreur statistiques annotations:', error);
      throw error;
    }
  }

  // Méthodes privées

  private validateAnnotationData(
    type: AnnotationType,
    content: Partial<AnnotationContent>,
    position: AnnotationPosition
  ): void {
    if (!type) {
      throw new Error('Type d\'annotation requis');
    }

    if (!position || position.pageNumber < 1) {
      throw new Error('Position invalide');
    }

    // Validation spécifique au type
    switch (type) {
      case 'highlight':
      case 'underline':
      case 'strikeout':
        if (!content.text && !content.html) {
          throw new Error('Texte requis pour ce type d\'annotation');
        }
        break;
      case 'note':
      case 'comment':
        if (!content.text && !content.markdown) {
          throw new Error('Contenu requis pour ce type d\'annotation');
        }
        break;
      case 'link':
        if (!content.url) {
          throw new Error('URL requise pour les liens');
        }
        break;
      case 'media':
        if (!content.mediaUrl) {
          throw new Error('URL média requise');
        }
        break;
    }
  }

  private mergeDefaultContent(
    type: AnnotationType,
    content: Partial<AnnotationContent>
  ): AnnotationContent {
    const defaults: Record<AnnotationType, AnnotationContent> = {
      highlight: { color: '#ffff00', opacity: 0.3 },
      underline: { color: '#0000ff', opacity: 0.5 },
      strikeout: { color: '#ff0000', opacity: 0.5 },
      squiggly: { color: '#ff00ff', opacity: 0.5 },
      note: { color: '#ffffcc', backgroundColor: '#ffffcc', opacity: 0.9 },
      comment: { color: '#000000', backgroundColor: '#f0f0f0', opacity: 0.9 },
      bookmark: { color: '#0000ff', opacity: 1 },
      drawing: { color: '#000000', opacity: 1, points: [] },
      text: { color: '#000000', fontSize: 12, fontFamily: 'Arial' },
      signature: { color: '#000000', opacity: 1 },
      stamp: { color: '#000000', opacity: 1 },
      link: { color: '#0000ff', textDecoration: 'underline' },
      image: { opacity: 1 },
      audio: { opacity: 1 },
      video: { opacity: 1 }
    };

    return { ...defaults[type], ...content };
  }

  private mergeDefaultStyle(
    type: AnnotationType,
    style?: Partial<AnnotationStyle>
  ): AnnotationStyle {
    const defaults: Record<AnnotationType, AnnotationStyle> = {
      highlight: { color: '#ffff00', opacity: 0.3 },
      underline: { color: '#0000ff', opacity: 0.5, borderWidth: 2 },
      strikeout: { color: '#ff0000', opacity: 0.5, borderWidth: 2 },
      squiggly: { color: '#ff00ff', opacity: 0.5, borderWidth: 2 },
      note: { color: '#000000', backgroundColor: '#ffffcc', opacity: 0.9, padding: 5 },
      comment: { color: '#000000', backgroundColor: '#f0f0f0', opacity: 0.9, padding: 5 },
      bookmark: { color: '#0000ff', opacity: 1 },
      drawing: { color: '#000000', opacity: 1, borderWidth: 2 },
      text: { color: '#000000', fontSize: 12, fontFamily: 'Arial', opacity: 1 },
      signature: { color: '#000000', opacity: 1 },
      stamp: { color: '#000000', opacity: 1 },
      link: { color: '#0000ff', textDecoration: 'underline', opacity: 1 },
      image: { opacity: 1 },
      audio: { opacity: 1 },
      video: { opacity: 1 }
    };

    return { ...defaults[type], ...style };
  }

  private mergeDefaultMetadata(metadata?: Partial<AnnotationMetadata>): AnnotationMetadata {
    return {
      source: 'manual',
      confidence: 1,
      keywords: [],
      sentiment: 'neutral',
      importance: 'medium',
      language: 'fr',
      difficulty: 'medium',
      timeSpent: 0,
      viewCount: 0,
      editCount: 0,
      version: 1,
      childAnnotationIds: [],
      relatedAnnotationIds: [],
      customFields: {},
      ...metadata
    };
  }

  private createDefaultPermissions(userId: string): AnnotationPermissions {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canComment: true,
      canShare: true,
      canExport: true,
      canPrint: true,
      canCopy: true,
      canMove: true,
      canResize: true,
      canChangeStyle: true,
      canAddReplies: true,
      canViewHistory: true,
      isOwner: true,
      sharedWith: []
    };
  }

  private async saveAnnotation(annotation: PDFAnnotation): Promise<void> {
    try {
      const { error } = await supabase
        .from('pdf_annotations')
        .upsert({
          id: annotation.id,
          document_id: annotation.documentId,
          user_id: annotation.userId,
          type: annotation.type,
          content: annotation.content,
          position: annotation.position,
          style: annotation.style,
          metadata: annotation.metadata,
          status: annotation.status,
          permissions: annotation.permissions,
          created_at: annotation.createdAt,
          updated_at: annotation.updatedAt,
          last_modified_by: annotation.lastModifiedBy
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde annotation:', error);
    }
  }

  private async saveReply(reply: AnnotationReply): Promise<void> {
    try {
      const { error } = await supabase
        .from('annotation_replies')
        .insert({
          id: reply.id,
          annotation_id: reply.annotationId,
          user_id: reply.userId,
          content: reply.content,
          mentions: reply.mentions,
          attachments: reply.attachments,
          reactions: reply.reactions,
          is_edited: reply.isEdited,
          created_at: reply.createdAt,
          updated_at: reply.updatedAt
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde réponse:', error);
    }
  }

  private async saveReaction(targetId: string, reaction: Reaction): Promise<void> {
    try {
      const { error } = await supabase
        .from('annotation_reactions')
        .insert({
          id: reaction.id,
          target_id: targetId,
          user_id: reaction.userId,
          type: reaction.type,
          custom_emoji: reaction.customEmoji,
          created_at: reaction.createdAt
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde réaction:', error);
    }
  }

  private async recordHistory(
    annotationId: string,
    userId: string,
    action: string,
    previousState?: any,
    newState?: any
  ): Promise<void> {
    try {
      const history: AnnotationHistory = {
        id: this.generateId(),
        annotationId,
        userId,
        action: action as any,
        previousState,
        newState,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('annotation_history')
        .insert(history);

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur enregistrement historique:', error);
    }
  }

  private async processExport(
    annotations: PDFAnnotation[],
    format: string,
    options: ExportOptions
  ): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(annotations, null, 2);
      case 'csv':
        return this.convertToCSV(annotations, options);
      case 'markdown':
        return this.convertToMarkdown(annotations, options);
      case 'html':
        return this.convertToHTML(annotations, options);
      case 'pdf':
        return 'PDF content'; // Simuler
      case 'xlsx':
        return 'XLSX content'; // Simuler
      default:
        throw new Error(`Format non supporté: ${format}`);
    }
  }

  private convertToCSV(annotations: PDFAnnotation[], options: ExportOptions): string {
    const headers = [
      'ID',
      'Type',
      'Page',
      'Content',
      'User',
      'Created At',
      'Updated At',
      'Status'
    ];

    const rows = [headers.join(',')];

    for (const annotation of annotations) {
      const row = [
        annotation.id,
        annotation.type,
        annotation.position.pageNumber,
        `"${(annotation.content.text || '').replace(/"/g, '""')}"`,
        annotation.userId,
        annotation.createdAt,
        annotation.updatedAt,
        annotation.status
      ];
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  private convertToMarkdown(annotations: PDFAnnotation[], options: ExportOptions): string {
    let markdown = '# Annotations\n\n';

    if (options.groupBy === 'page') {
      const pages = new Map<number, PDFAnnotation[]>();
      for (const annotation of annotations) {
        const page = annotation.position.pageNumber;
        if (!pages.has(page)) {
          pages.set(page, []);
        }
        pages.get(page)!.push(annotation);
      }

      for (const [page, pageAnnotations] of pages) {
        markdown += `## Page ${page}\n\n`;
        for (const annotation of pageAnnotations) {
          markdown += `### ${annotation.type}\n`;
          if (annotation.content.text) {
            markdown += `${annotation.content.text}\n`;
          }
          markdown += `*Créé le ${new Date(annotation.createdAt).toLocaleDateString()}*\n\n`;
        }
      }
    } else {
      for (const annotation of annotations) {
        markdown += `## ${annotation.type} (Page ${annotation.position.pageNumber})\n`;
        if (annotation.content.text) {
          markdown += `${annotation.content.text}\n`;
        }
        markdown += `*Créé le ${new Date(annotation.createdAt).toLocaleDateString()}*\n\n`;
      }
    }

    return markdown;
  }

  private convertToHTML(annotations: PDFAnnotation[], options: ExportOptions): string {
    let html = '<html><head><title>Annotations</title></head><body>';
    html += '<h1>Annotations</h1>';

    for (const annotation of annotations) {
      html += `<div class="annotation" data-type="${annotation.type}" data-page="${annotation.position.pageNumber}">`;
      html += `<h3>${annotation.type} - Page ${annotation.position.pageNumber}</h3>`;
      if (annotation.content.text) {
        html += `<p>${annotation.content.text}</p>`;
      }
      html += `<small>Créé le ${new Date(annotation.createdAt).toLocaleDateString()}</small>`;
      html += '</div>';
    }

    html += '</body></html>';
    return html;
  }

  private async saveExportFile(
    exportId: string,
    content: string,
    format: string
  ): Promise<string> {
    try {
      const fileName = `annotation-exports/${exportId}.${format}`;
      
      const { error } = await supabase.storage
        .from('annotation-exports')
        .upload(fileName, new Blob([content]));

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('annotation-exports')
        .getPublicUrl(fileName);

      return publicUrl;

    } catch (error) {
      console.error('❌ Erreur sauvegarde fichier export:', error);
      throw error;
    }
  }

  private generateId(): string {
    return `annot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Charge les templates par défaut
   */
  private async loadDefaultTemplates(): Promise<void> {
    // Simuler le chargement des templates par défaut
    console.log('📝 Chargement des templates d\'annotations...');
  }

  /**
   * Démarre le monitoring
   */
  private startMonitoring(): void {
    // Monitorer les annotations actives
    setInterval(() => {
      this.checkActiveAnnotations();
    }, 60000); // Toutes les minutes

    // Monitorer les statistiques
    setInterval(() => {
      this.updateStats();
    }, 300000); // Toutes les 5 minutes
  }

  /**
   * Vérifie les annotations actives
   */
  private checkActiveAnnotations(): void {
    // Simuler la vérification des annotations actives
    console.log('📝 Vérification des annotations actives...');
  }

  /**
   * Met à jour les statistiques
   */
  private updateStats(): void {
    // Simuler la mise à jour des statistiques
    console.log('📝 Mise à jour des statistiques d\'annotations...');
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
        console.error('❌ Erreur callback événement annotation:', error);
      }
    }
  }

  /**
   * Détruit le service d'annotations
   */
  destroy(): void {
    // Vider les caches
    this.annotations.clear();
    this.templates.clear();
    this.history.clear();
    this.eventCallbacks.clear();
    
    console.log('📝 Service d\'annotations PDF détruit');
  }
}

// Instance singleton
export const pdfAnnotationService = new PDFAnnotationService();

// Export des fonctions utilitaires
export const createPDFAnnotation = (
  documentId: string,
  userId: string,
  type: AnnotationType,
  content: Partial<AnnotationContent>,
  position: AnnotationPosition,
  style?: Partial<AnnotationStyle>,
  metadata?: Partial<AnnotationMetadata>
) => pdfAnnotationService.createAnnotation(documentId, userId, type, content, position, style, metadata);

export const getPDFAnnotations = (
  documentId: string,
  userId: string,
  options?: {
    types?: AnnotationType[];
    status?: AnnotationStatus;
    page?: number;
    sortBy?: 'created_at' | 'updated_at' | 'type' | 'page';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }
) => pdfAnnotationService.getDocumentAnnotations(documentId, userId, options);

export const exportPDFAnnotations = (
  documentId: string,
  userId: string,
  format: 'pdf' | 'json' | 'csv' | 'xlsx' | 'markdown' | 'html',
  options?: ExportOptions
) => pdfAnnotationService.exportAnnotations(documentId, userId, format, options);

export const getPDFAnnotationStats = (documentId?: string) => pdfAnnotationService.getStats(documentId);
