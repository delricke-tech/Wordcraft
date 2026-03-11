/**
 * Service de visualisation de données (tableaux extraits)
 * 
 * Ce service extrait automatiquement des données structurées des documents
 * et les présente sous forme de tableaux interactifs et visualisations
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Interfaces pour la visualisation de données
export interface DataVisualization {
  id: string;
  documentId: string;
  userId: string;
  title: string;
  description?: string;
  originalText: string;
  extractedData: ExtractedData[];
  visualizations: Visualization[];
  settings: VisualizationSettings;
  metadata: VisualizationMetadata;
  analytics: VisualizationAnalytics;
  status: 'draft' | 'processing' | 'completed' | 'published' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface ExtractedData {
  id: string;
  type: 'table' | 'list' | 'chart' | 'timeline' | 'hierarchy' | 'network' | 'statistical' | 'custom';
  title: string;
  description?: string;
  data: any;
  structure: DataStructure;
  source: {
    position: {
      start: number;
      end: number;
      line: number;
      column: number;
    };
    context: string;
    confidence: number;
  };
  metadata: {
    rowCount?: number;
    columnCount?: number;
    dataType: string;
    format: string;
    quality: number;
  };
}

export interface DataStructure {
  headers?: string[];
  rows?: any[][];
  columns?: any[];
  relationships?: Relationship[];
  hierarchy?: HierarchyNode[];
  timeline?: TimelineEvent[];
  statistics?: StatisticalData;
}

export interface Relationship {
  from: string;
  to: string;
  type: 'parent-child' | 'association' | 'dependency' | 'correlation' | 'causation';
  strength: number;
  description?: string;
}

export interface HierarchyNode {
  id: string;
  name: string;
  level: number;
  parent?: string;
  children?: string[];
  metadata?: any;
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: Date;
  description?: string;
  category?: string;
  importance?: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
}

export interface StatisticalData {
  mean?: number;
  median?: number;
  mode?: any;
  standardDeviation?: number;
  variance?: number;
  min?: number;
  max?: number;
  quartiles?: number[];
  correlation?: CorrelationData[];
  distribution?: DistributionData;
}

export interface CorrelationData {
  variable1: string;
  variable2: string;
  coefficient: number;
  significance: number;
}

export interface DistributionData {
  type: 'normal' | 'uniform' | 'exponential' | 'poisson' | 'custom';
  parameters: any;
  histogram?: number[][];
}

export interface Visualization {
  id: string;
  extractedDataId: string;
  type: 'table' | 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'tree' | 'network' | 'gantt' | 'custom';
  title: string;
  description?: string;
  config: VisualizationConfig;
  chartData: ChartData;
  interactive: boolean;
  exportable: boolean;
}

export interface VisualizationConfig {
  chartType: string;
  colors: string[];
  axes: AxisConfig[];
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  animation?: AnimationConfig;
  responsive: boolean;
  theme: 'light' | 'dark' | 'custom';
}

export interface AxisConfig {
  type: 'x' | 'y' | 'z';
  label: string;
  scale: 'linear' | 'logarithmic' | 'categorical' | 'time';
  min?: number;
  max?: number;
  format?: string;
}

export interface LegendConfig {
  position: 'top' | 'bottom' | 'left' | 'right';
  show: boolean;
  format: string;
}

export interface TooltipConfig {
  show: boolean;
  format: string;
  fields: string[];
}

export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: string;
}

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

export interface VisualizationSettings {
  extraction: ExtractionSettings;
  processing: ProcessingSettings;
  display: DisplaySettings;
  export: ExportSettings;
}

export interface ExtractionSettings {
  detectTables: boolean;
  detectLists: boolean;
  detectNumbers: boolean;
  detectDates: boolean;
  detectRelationships: boolean;
  detectHierarchies: boolean;
  detectTimelines: boolean;
  minDataPoints: number;
  confidenceThreshold: number;
}

export interface ProcessingSettings {
  cleanData: boolean;
  normalizeData: boolean;
  validateData: boolean;
  inferTypes: boolean;
  handleMissing: 'remove' | 'interpolate' | 'ignore';
  aggregateData: boolean;
}

export interface DisplaySettings {
  defaultChartType: string;
  colorScheme: string;
  showGrid: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  enableZoom: boolean;
  enablePan: boolean;
  enableFilter: boolean;
}

export interface ExportSettings {
  formats: ('png' | 'jpg' | 'svg' | 'pdf' | 'csv' | 'json' | 'excel')[];
  quality: number;
  includeData: boolean;
  includeMetadata: boolean;
  watermark?: boolean;
}

export interface VisualizationMetadata {
  originalMetrics: DataMetrics;
  processedMetrics: DataMetrics;
  extractionTime: number;
  processingTime: number;
  qualityScore: number;
  completenessScore: number;
  accuracyScore: number;
  aiModel: string;
  version: string;
}

export interface DataMetrics {
  totalDataPoints: number;
  dataTypes: Record<string, number>;
  dataQuality: number;
  completeness: number;
  consistency: number;
  validity: number;
}

export interface VisualizationAnalytics {
  totalViews: number;
  uniqueViews: number;
  averageViewTime: number;
  interactionCount: number;
  exportCount: number;
  shareCount: number;
  userFeedback: {
    helpful: number;
    notHelpful: number;
    confusing: number;
    inaccurate: number;
  };
  engagementPatterns: {
    peakHours: number[];
    peakDays: number[];
    deviceBreakdown: Record<string, number>;
  };
  performanceMetrics: {
    loadTime: number;
    renderTime: number;
    interactionLatency: number;
  };
}

export interface VisualizationStatistics {
  totalVisualizations: number;
  publishedVisualizations: number;
  draftVisualizations: number;
  totalDataPoints: number;
  averageDataPointsPerVisualization: number;
  mostUsedChartTypes: Record<string, number>;
  topPerformingVisualizations: Array<{
    visualizationId: string;
    title: string;
    viewCount: number;
    averageRating: number;
    dataPointCount: number;
    engagementScore: number;
  }>;
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    averageVisualizationsPerUser: number;
    averageViewTime: number;
    satisfactionScore: number;
  };
  dataQuality: {
    averageExtractionAccuracy: number;
    averageDataCompleteness: number;
    averageProcessingQuality: number;
    errorRate: number;
  };
  trends: {
    visualizationGrowth: number[];
    dataPointGrowth: number[];
    chartTypeTrends: Record<string, number[]>;
  };
}

export interface VisualizationTemplate {
  id: string;
  name: string;
  description: string;
  chartType: string;
  config: VisualizationConfig;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VisualizationExport {
  id: string;
  visualizationId: string;
  format: 'png' | 'jpg' | 'svg' | 'pdf' | 'csv' | 'json' | 'excel';
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ExportOptions {
  width?: number;
  height?: number;
  quality?: number;
  includeData?: boolean;
  includeMetadata?: boolean;
  backgroundColor?: string;
  watermark?: boolean;
  password?: string;
}

// Classe principale du service de visualisation
export class DataVisualizationService {
  private static instance: DataVisualizationService;
  private eventCallbacks: Map<string, Function[]> = new Map();

  private constructor() {}

  public static getInstance(): DataVisualizationService {
    if (!DataVisualizationService.instance) {
      DataVisualizationService.instance = new DataVisualizationService();
    }
    return DataVisualizationService.instance;
  }

  /**
   * Crée une visualisation de données
   */
  public async createVisualization(
    documentId: string,
    userId: string,
    originalText: string,
    settings?: Partial<VisualizationSettings>
  ): Promise<DataVisualization> {
    const startTime = Date.now();
    
    try {
      // Créer la visualisation
      const visualization: Partial<DataVisualization> = {
        documentId,
        userId,
        title: `Visualisation ${new Date().toLocaleDateString()}`,
        originalText,
        extractedData: [],
        visualizations: [],
        settings: this.mergeSettings(settings),
        metadata: {
          originalMetrics: this.calculateDataMetrics(originalText),
          processedMetrics: {} as DataMetrics,
          extractionTime: 0,
          processingTime: 0,
          qualityScore: 0,
          completenessScore: 0,
          accuracyScore: 0,
          aiModel: 'data-visualizer-v1.0',
          version: '1.0.0'
        },
        analytics: {
          totalViews: 0,
          uniqueViews: 0,
          averageViewTime: 0,
          interactionCount: 0,
          exportCount: 0,
          shareCount: 0,
          userFeedback: {
            helpful: 0,
            notHelpful: 0,
            confusing: 0,
            inaccurate: 0
          },
          engagementPatterns: {
            peakHours: [],
            peakDays: [],
            deviceBreakdown: {}
          },
          performanceMetrics: {
            loadTime: 0,
            renderTime: 0,
            interactionLatency: 0
          }
        },
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Sauvegarder la visualisation initiale
      const { data: savedVisualization, error: saveError } = await supabase
        .from('data_visualizations')
        .insert([visualization])
        .select()
        .single();

      if (saveError) throw saveError;

      // Émettre l'événement de début
      this.emitEvent('visualization_started', savedVisualization);

      // Traiter la visualisation
      const processedVisualization = await this.processVisualization(savedVisualization);

      // Mettre à jour avec les données extraites
      const processingTime = Date.now() - startTime;
      processedVisualization.metadata.processingTime = processingTime;
      processedVisualization.status = 'completed';
      processedVisualization.updatedAt = new Date();

      const { data: finalVisualization, error: updateError } = await supabase
        .from('data_visualizations')
        .update({
          extracted_data: processedVisualization.extractedData,
          visualizations: processedVisualization.visualizations,
          metadata: processedVisualization.metadata,
          status: processedVisualization.status,
          updated_at: processedVisualization.updatedAt
        })
        .eq('id', savedVisualization.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Émettre l'événement de complétion
      this.emitEvent('visualization_completed', finalVisualization);

      return this.mapDbToVisualization(finalVisualization);

    } catch (error) {
      console.error('Erreur lors de la création de la visualisation:', error);
      throw error;
    }
  }

  /**
   * Traite la visualisation
   */
  private async processVisualization(visualization: any): Promise<DataVisualization> {
    const { originalText, settings } = visualization;
    
    const extractionStartTime = Date.now();
    const extractedData = await this.extractData(originalText, settings.extraction);
    const extractionTime = Date.now() - extractionStartTime;

    const processingStartTime = Date.now();
    const processedData = await this.processExtractedData(extractedData, settings.processing);
    const processingTime = Date.now() - processingStartTime;

    const visualizations = await this.generateVisualizations(processedData, settings.display);

    // Calculer les métriques
    const processedMetrics = this.calculateDataMetrics(JSON.stringify(processedData));
    const qualityScore = this.calculateQualityScore(extractedData, processedData);
    const completenessScore = this.calculateCompletenessScore(extractedData);
    const accuracyScore = this.calculateAccuracyScore(extractedData);

    return {
      ...visualization,
      extractedData: processedData,
      visualizations,
      metadata: {
        ...visualization.metadata,
        processedMetrics,
        extractionTime,
        processingTime,
        qualityScore,
        completenessScore,
        accuracyScore
      }
    } as DataVisualization;
  }

  /**
   * Extrait les données du texte
   */
  private async extractData(text: string, settings: ExtractionSettings): Promise<ExtractedData[]> {
    const extractedData: ExtractedData[] = [];

    // Extraire les tableaux
    if (settings.detectTables) {
      const tables = await this.extractTables(text);
      extractedData.push(...tables);
    }

    // Extraire les listes
    if (settings.detectLists) {
      const lists = await this.extractLists(text);
      extractedData.push(...lists);
    }

    // Extraire les données numériques
    if (settings.detectNumbers) {
      const numbers = await this.extractNumericalData(text);
      extractedData.push(...numbers);
    }

    // Extraire les dates
    if (settings.detectDates) {
      const dates = await this.extractDateData(text);
      extractedData.push(...dates);
    }

    // Extraire les relations
    if (settings.detectRelationships) {
      const relationships = await this.extractRelationships(text);
      extractedData.push(...relationships);
    }

    // Extraire les hiérarchies
    if (settings.detectHierarchies) {
      const hierarchies = await this.extractHierarchies(text);
      extractedData.push(...hierarchies);
    }

    // Extraire les timelines
    if (settings.detectTimelines) {
      const timelines = await this.extractTimelines(text);
      extractedData.push(...timelines);
    }

    // Filtrer par confiance et nombre minimum de points
    return extractedData.filter(data => 
      data.source.confidence >= settings.confidenceThreshold &&
      this.getDataPointCount(data) >= settings.minDataPoints
    );
  }

  /**
   * Extrait les tableaux du texte
   */
  private async extractTables(text: string): Promise<ExtractedData[]> {
    const tables: ExtractedData[] = [];
    
    // Détecter les tableaux avec des séparateurs
    const tablePatterns = [
      // Tableaux avec | comme séparateur
      { pattern: /\|(.+)\|/g, separator: '|' },
      // Tableaux avec tabulations
      { pattern: /([^\t]+\t)+[^\t]+/g, separator: '\t' },
      // Tableaux avec espaces multiples
      { pattern: /([^\s]{2,}\s{2,})+[^\s]{2,}/g, separator: /\s{2,}/ }
    ];

    for (const { pattern, separator } of tablePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const tableText = match[0];
        const rows = tableText.split('\n').filter(row => row.trim());
        
        if (rows.length >= 2) {
          const headers = rows[0].split(separator).map(h => h.trim());
          const dataRows = rows.slice(1).map(row => 
            row.split(separator).map(cell => cell.trim())
          );

          const extractedTable: ExtractedData = {
            id: `table_${tables.length}`,
            type: 'table',
            title: `Tableau extrait ${tables.length + 1}`,
            data: { headers, rows: dataRows },
            structure: {
              headers,
              rows: dataRows
            },
            source: {
              position: {
                start: match.index,
                end: match.index + match[0].length,
                line: this.getLineNumber(text, match.index),
                column: this.getColumnNumber(text, match.index)
              },
              context: this.getContext(text, match.index, 50),
              confidence: 0.8
            },
            metadata: {
              rowCount: dataRows.length,
              columnCount: headers.length,
              dataType: 'tabular',
              format: 'table',
              quality: this.assessTableQuality(headers, dataRows)
            }
          };

          tables.push(extractedTable);
        }
      }
    }

    return tables;
  }

  /**
   * Extrait les listes du texte
   */
  private async extractLists(text: string): Promise<ExtractedData[]> {
    const lists: ExtractedData[] = [];
    
    // Détecter les listes à puces
    const bulletListPattern = /[-*+•]\s+(.+)(?:\n[-*+•]\s+.+)*/g;
    const numberedListPattern = /\d+\.\s+(.+)(?:\n\d+\.\s+.+)*/g;

    const listPatterns = [
      { pattern: bulletListPattern, type: 'bullet' as const },
      { pattern: numberedListPattern, type: 'numbered' as const }
    ];

    for (const { pattern, type } of listPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const listText = match[0];
        const items = listText.split('\n').map(item => {
          const cleanedItem = item.replace(/^[-*+•]\s+|\d+\.\s+/, '').trim();
          return cleanedItem;
        }).filter(item => item.length > 0);

        if (items.length >= 2) {
          const extractedList: ExtractedData = {
            id: `list_${lists.length}`,
            type: 'list',
            title: `Liste ${type === 'bullet' ? 'à puces' : 'numérotée'} ${lists.length + 1}`,
            data: { items, type },
            structure: {
              columns: items
            },
            source: {
              position: {
                start: match.index,
                end: match.index + match[0].length,
                line: this.getLineNumber(text, match.index),
                column: this.getColumnNumber(text, match.index)
              },
              context: this.getContext(text, match.index, 50),
              confidence: 0.7
            },
            metadata: {
              rowCount: items.length,
              columnCount: 1,
              dataType: 'list',
              format: type,
              quality: this.assessListQuality(items)
            }
          };

          lists.push(extractedList);
        }
      }
    }

    return lists;
  }

  /**
   * Extrait les données numériques
   */
  private async extractNumericalData(text: string): Promise<ExtractedData[]> {
    const numericalData: ExtractedData[] = [];
    
    // Détecter les séries de nombres
    const numberPattern = /(\d+(?:[.,]\d+)?)(?:\s*[,;]\s*(\d+(?:[.,]\d+)?))*/g;
    
    let match;
    while ((match = numberPattern.exec(text)) !== null) {
      const numberText = match[0];
      const numbers = numberText.split(/[,;]/).map(n => 
        parseFloat(n.replace(',', '.'))
      ).filter(n => !isNaN(n));

      if (numbers.length >= 3) {
        const extractedNumbers: ExtractedData = {
          id: `numbers_${numericalData.length}`,
          type: 'statistical',
          title: `Série numérique ${numericalData.length + 1}`,
          data: { numbers },
          structure: {
            statistics: this.calculateStatistics(numbers)
          },
          source: {
            position: {
              start: match.index,
              end: match.index + match[0].length,
              line: this.getLineNumber(text, match.index),
              column: this.getColumnNumber(text, match.index)
            },
            context: this.getContext(text, match.index, 50),
              confidence: 0.6
            },
            metadata: {
              rowCount: numbers.length,
              columnCount: 1,
              dataType: 'numerical',
              format: 'series',
              quality: this.assessNumericalQuality(numbers)
            }
          };

          numericalData.push(extractedNumbers);
        }
      }

      return numericalData;
    }

  /**
   * Extrait les données de dates
   */
  private async extractDateData(text: string): Promise<ExtractedData[]> {
    const dateData: ExtractedData[] = [];
    
    // Détecter les formats de date
    const datePatterns = [
      /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g,  // JJ/MM/AAAA
      /\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/g,  // AAAA/MM/JJ
      /\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{2,4}/gi,  // JJ mois AAAA
      /(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{1,2},?\s+\d{2,4}/gi  // mois JJ AAAA
    ];

    for (const pattern of datePatterns) {
      let match;
      const dates: Date[] = [];
      
      while ((match = pattern.exec(text)) !== null) {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          dates.push(date);
        }
      }

      if (dates.length >= 2) {
        const extractedDates: ExtractedData = {
          id: `dates_${dateData.length}`,
          type: 'timeline',
          title: `Chronologie ${dateData.length + 1}`,
          data: { dates },
          structure: {
            timeline: dates.map((date, index) => ({
              id: `event_${index}`,
              title: `Événement ${index + 1}`,
              date,
              importance: 'medium' as const
            }))
          },
          source: {
            position: {
              start: 0,
              end: 0,
              line: 0,
              column: 0
            },
            context: '',
            confidence: 0.7
          },
          metadata: {
            rowCount: dates.length,
            columnCount: 1,
            dataType: 'temporal',
            format: 'timeline',
            quality: this.assessDateQuality(dates)
          }
        };

        dateData.push(extractedDates);
      }
    }

    return dateData;
  }

  /**
   * Extrait les relations
   */
  private async extractRelationships(text: string): Promise<ExtractedData[]> {
    const relationships: ExtractedData[] = [];
    
    // Détecter les patterns de relations
    const relationPatterns = [
      /(\w+)\s+(?:est|sont|est un|sont des|fait partie de|appartient à)\s+(\w+)/gi,
      /(\w+)\s+(?:contient|inclut|comprend)\s+(\w+)/gi,
      /(\w+)\s+(?:dépend de|requiert|nécessite)\s+(\w+)/gi
    ];

    const extractedRelations: Relationship[] = [];

    for (const pattern of relationPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const relation: Relationship = {
          from: match[1],
          to: match[2],
          type: this.inferRelationType(match[0]),
          strength: 0.8,
          description: match[0]
        };

        extractedRelations.push(relation);
      }
    }

    if (extractedRelations.length >= 2) {
      const extractedRelationships: ExtractedData = {
        id: `relationships_${relationships.length}`,
        type: 'network',
        title: `Réseau de relations ${relationships.length + 1}`,
        data: { relationships: extractedRelations },
        structure: {
          relationships: extractedRelations
        },
        source: {
          position: {
            start: 0,
            end: 0,
            line: 0,
            column: 0
          },
          context: '',
          confidence: 0.6
        },
        metadata: {
          rowCount: extractedRelations.length,
          columnCount: 3,
          dataType: 'relational',
          format: 'network',
          quality: this.assessRelationshipQuality(extractedRelations)
        }
      };

      relationships.push(extractedRelationships);
    }

    return relationships;
  }

  /**
   * Extrait les hiérarchies
   */
  private async extractHierarchies(text: string): Promise<ExtractedData[]> {
    const hierarchies: ExtractedData[] = [];
    
    // Détecter les structures hiérarchiques (indentations, numérotations complexes)
    const hierarchyPattern = /^(\s*)([\d\.]+|[A-Za-z]\.)\s+(.+)$/gm;
    
    const hierarchyNodes: HierarchyNode[] = [];
    const nodeMap = new Map<string, HierarchyNode>();

    let match;
    while ((match = hierarchyPattern.exec(text)) !== null) {
      const indentation = match[1].length;
      const marker = match[2];
      const title = match[3];
      
      const nodeId = `node_${hierarchyNodes.length}`;
      const node: HierarchyNode = {
        id: nodeId,
        name: title,
        level: Math.floor(indentation / 2) + 1,
        children: []
      };

      // Trouver le parent
      if (hierarchyNodes.length > 0) {
        const potentialParent = hierarchyNodes
          .slice()
          .reverse()
          .find(n => n.level < node.level);
        
        if (potentialParent) {
          node.parent = potentialParent.id;
          potentialParent.children?.push(nodeId);
        }
      }

      hierarchyNodes.push(node);
      nodeMap.set(nodeId, node);
    }

    if (hierarchyNodes.length >= 3) {
      const extractedHierarchy: ExtractedData = {
        id: `hierarchy_${hierarchies.length}`,
        type: 'hierarchy',
        title: `Hiérarchie ${hierarchies.length + 1}`,
        data: { nodes: hierarchyNodes },
        structure: {
          hierarchy: hierarchyNodes
        },
        source: {
          position: {
            start: 0,
            end: 0,
            line: 0,
            column: 0
          },
          context: '',
          confidence: 0.7
        },
        metadata: {
          rowCount: hierarchyNodes.length,
          columnCount: 3,
          dataType: 'hierarchical',
          format: 'tree',
          quality: this.assessHierarchyQuality(hierarchyNodes)
        }
      };

      hierarchies.push(extractedHierarchy);
    }

    return hierarchies;
  }

  /**
   * Extrait les timelines
   */
  private async extractTimelines(text: string): Promise<ExtractedData[]> {
    const timelines: ExtractedData[] = [];
    
    // Détecter les événements avec dates
    const eventPattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s*[:\-]\s*(.+)/gi;
    
    const events: TimelineEvent[] = [];
    
    let match;
    while ((match = eventPattern.exec(text)) !== null) {
      const dateStr = match[1];
      const description = match[2];
      
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const event: TimelineEvent = {
          id: `event_${events.length}`,
          title: description.split(':')[0] || description,
          date,
          description,
          importance: 'medium'
        };

        events.push(event);
      }
    }

    // Trier par date
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    if (events.length >= 2) {
      const extractedTimeline: ExtractedData = {
        id: `timeline_${timelines.length}`,
        type: 'timeline',
        title: `Timeline ${timelines.length + 1}`,
        data: { events },
        structure: {
          timeline: events
        },
        source: {
          position: {
            start: 0,
            end: 0,
            line: 0,
            column: 0
          },
          context: '',
          confidence: 0.8
        },
        metadata: {
          rowCount: events.length,
          columnCount: 4,
          dataType: 'temporal',
          format: 'timeline',
          quality: this.assessTimelineQuality(events)
        }
      };

      timelines.push(extractedTimeline);
    }

    return timelines;
  }

  /**
   * Traite les données extraites
   */
  private async processExtractedData(
    extractedData: ExtractedData[], 
    settings: ProcessingSettings
  ): Promise<ExtractedData[]> {
    const processedData: ExtractedData[] = [];

    for (const data of extractedData) {
      let processedDataItem = { ...data };

      // Nettoyer les données
      if (settings.cleanData) {
        processedDataItem = this.cleanData(processedDataItem);
      }

      // Normaliser les données
      if (settings.normalizeData) {
        processedDataItem = this.normalizeData(processedDataItem);
      }

      // Valider les données
      if (settings.validateData) {
        processedDataItem = this.validateData(processedDataItem);
      }

      // Inférer les types
      if (settings.inferTypes) {
        processedDataItem = this.inferDataTypes(processedDataItem);
      }

      // Gérer les valeurs manquantes
      if (settings.handleMissing !== 'ignore') {
        processedDataItem = this.handleMissingValues(processedDataItem, settings.handleMissing);
      }

      // Agréger les données
      if (settings.aggregateData) {
        processedDataItem = this.aggregateData(processedDataItem);
      }

      processedData.push(processedDataItem);
    }

    return processedData;
  }

  /**
   * Génère les visualisations
   */
  private async generateVisualizations(
    extractedData: ExtractedData[], 
    settings: DisplaySettings
  ): Promise<Visualization[]> {
    const visualizations: Visualization[] = [];

    for (const data of extractedData) {
      const viz = await this.generateVisualizationForData(data, settings);
      visualizations.push(viz);
    }

    return visualizations;
  }

  /**
   * Génère une visualisation pour un type de données
   */
  private async generateVisualizationForData(
    data: ExtractedData, 
    settings: DisplaySettings
  ): Promise<Visualization> {
    const chartType = this.selectChartType(data, settings.defaultChartType);
    const chartData = this.convertToChartData(data, chartType);
    const config = this.generateChartConfig(chartType, settings);

    const visualization: Visualization = {
      id: `viz_${data.id}`,
      extractedDataId: data.id,
      type: chartType as any,
      title: data.title,
      description: data.description,
      config,
      chartData,
      interactive: settings.enableZoom || settings.enablePan,
      exportable: true
    };

    return visualization;
  }

  /**
   * Sélectionne le type de graphique approprié
   */
  private selectChartType(data: ExtractedData, defaultType: string): string {
    switch (data.type) {
      case 'table':
        return 'table';
      case 'list':
        return 'bar';
      case 'statistical':
        return 'line';
      case 'timeline':
        return 'line';
      case 'hierarchy':
        return 'tree';
      case 'network':
        return 'network';
      default:
        return defaultType;
    }
  }

  /**
   * Convertit les données en format de graphique
   */
  private convertToChartData(data: ExtractedData, chartType: string): ChartData {
    switch (data.type) {
      case 'table':
        return this.convertTableToChartData(data);
      case 'list':
        return this.convertListToChartData(data);
      case 'statistical':
        return this.convertStatisticalToChartData(data);
      case 'timeline':
        return this.convertTimelineToChartData(data);
      default:
        return { labels: [], datasets: [] };
    }
  }

  /**
   * Convertit un tableau en données de graphique
   */
  private convertTableToChartData(data: ExtractedData): ChartData {
    const { headers, rows } = data.structure;
    
    if (!headers || !rows) {
      return { labels: [], datasets: [] };
    }

    // Utiliser la première colonne comme labels et les autres comme datasets
    const labels = rows.map(row => row[0]);
    const datasets = headers.slice(1).map((header, index) => ({
      label: header,
      data: rows.map(row => parseFloat(row[index + 1]) || 0),
      backgroundColor: this.getColor(index),
      borderColor: this.getColor(index),
      borderWidth: 2
    }));

    return { labels, datasets };
  }

  /**
   * Convertit une liste en données de graphique
   */
  private convertListToChartData(data: ExtractedData): ChartData {
    const { columns } = data.structure;
    
    if (!columns) {
      return { labels: [], datasets: [] };
    }

    const labels = columns.map((_, index) => `Item ${index + 1}`);
    const datasets = [{
      label: 'List Items',
      data: columns.map(() => Math.random() * 100), // Placeholder
      backgroundColor: this.getColor(0),
      borderColor: this.getColor(0),
      borderWidth: 2
    }];

    return { labels, datasets };
  }

  /**
   * Convertit des données statistiques en données de graphique
   */
  private convertStatisticalToChartData(data: ExtractedData): ChartData {
    const { statistics } = data.structure;
    
    if (!statistics || !statistics.mean) {
      return { labels: [], datasets: [] };
    }

    const labels = ['Mean', 'Median', 'Min', 'Max', 'Std Dev'];
    const datasets = [{
      label: 'Statistical Values',
      data: [
        statistics.mean || 0,
        statistics.median || 0,
        statistics.min || 0,
        statistics.max || 0,
        statistics.standardDeviation || 0
      ],
      backgroundColor: this.getColor(0),
      borderColor: this.getColor(0),
      borderWidth: 2
    }];

    return { labels, datasets };
  }

  /**
   * Convertit une timeline en données de graphique
   */
  private convertTimelineToChartData(data: ExtractedData): ChartData {
    const { timeline } = data.structure;
    
    if (!timeline) {
      return { labels: [], datasets: [] };
    }

    const labels = timeline.map(event => 
      event.date.toLocaleDateString()
    );
    const datasets = [{
      label: 'Events',
      data: timeline.map(() => Math.random() * 100), // Placeholder
      backgroundColor: this.getColor(0),
      borderColor: this.getColor(0),
      borderWidth: 2,
      fill: false
    }];

    return { labels, datasets };
  }

  /**
   * Génère la configuration du graphique
   */
  private generateChartConfig(chartType: string, settings: DisplaySettings): VisualizationConfig {
    return {
      chartType,
      colors: this.generateColorScheme(settings.colorScheme),
      axes: this.generateAxes(chartType),
      legend: {
        position: 'bottom',
        show: settings.showLegend,
        format: '{label}'
      },
      tooltip: {
        show: settings.showTooltip,
        format: '{label}: {value}',
        fields: ['label', 'value']
      },
      animation: {
        enabled: true,
        duration: 1000,
        easing: 'easeInOutQuart'
      },
      responsive: true,
      theme: 'light'
    };
  }

  /**
   * Calcule les métriques des données
   */
  private calculateDataMetrics(text: string): DataMetrics {
    const dataTypes: Record<string, number> = {
      text: 0,
      number: 0,
      date: 0,
      boolean: 0
    };

    // Analyser le texte pour déterminer les types de données
    const words = text.split(/\s+/);
    
    for (const word of words) {
      if (!isNaN(parseFloat(word))) {
        dataTypes.number++;
      } else if (!isNaN(Date.parse(word))) {
        dataTypes.date++;
      } else if (['true', 'false', 'vrai', 'faux'].includes(word.toLowerCase())) {
        dataTypes.boolean++;
      } else {
        dataTypes.text++;
      }
    }

    const totalDataPoints = Object.values(dataTypes).reduce((sum, count) => sum + count, 0);
    
    return {
      totalDataPoints,
      dataTypes,
      dataQuality: 0.8, // Placeholder
      completeness: 0.9, // Placeholder
      consistency: 0.85, // Placeholder
      validity: 0.9 // Placeholder
    };
  }

  /**
   * Calcule le score de qualité
   */
  private calculateQualityScore(extracted: ExtractedData[], processed: ExtractedData[]): number {
    let score = 100;
    
    // Pénaliser les données à faible confiance
    const lowConfidenceData = extracted.filter(data => data.source.confidence < 0.7);
    score -= lowConfidenceData.length * 10;
    
    // Bonus pour la diversité des types de données
    const uniqueTypes = new Set(extracted.map(data => data.type)).size;
    score += uniqueTypes * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calcule le score de complétude
   */
  private calculateCompletenessScore(extractedData: ExtractedData[]): number {
    if (extractedData.length === 0) return 0;
    
    const totalCompleteness = extractedData.reduce((sum, data) => 
      sum + (data.metadata.quality || 0), 0
    );
    
    return totalCompleteness / extractedData.length;
  }

  /**
   * Calcule le score d'exactitude
   */
  private calculateAccuracyScore(extractedData: ExtractedData[]): number {
    if (extractedData.length === 0) return 0;
    
    const totalAccuracy = extractedData.reduce((sum, data) => 
      sum + data.source.confidence, 0
    );
    
    return totalAccuracy / extractedData.length * 100;
  }

  /**
   * Fusionne les paramètres avec les valeurs par défaut
   */
  private mergeSettings(settings?: Partial<VisualizationSettings>): VisualizationSettings {
    const defaultSettings: VisualizationSettings = {
      extraction: {
        detectTables: true,
        detectLists: true,
        detectNumbers: true,
        detectDates: true,
        detectRelationships: false,
        detectHierarchies: false,
        detectTimelines: true,
        minDataPoints: 3,
        confidenceThreshold: 0.6
      },
      processing: {
        cleanData: true,
        normalizeData: false,
        validateData: true,
        inferTypes: true,
        handleMissing: 'ignore',
        aggregateData: false
      },
      display: {
        defaultChartType: 'bar',
        colorScheme: 'default',
        showGrid: true,
        showLegend: true,
        showTooltip: true,
        enableZoom: false,
        enablePan: false,
        enableFilter: false
      },
      export: {
        formats: ['png', 'svg', 'csv'],
        quality: 0.9,
        includeData: true,
        includeMetadata: false
      }
    };
    
    if (!settings) return defaultSettings;
    
    return {
      extraction: { ...defaultSettings.extraction, ...settings.extraction },
      processing: { ...defaultSettings.processing, ...settings.processing },
      display: { ...defaultSettings.display, ...settings.display },
      export: { ...defaultSettings.export, ...settings.export }
    };
  }

  /**
   * Méthodes utilitaires
   */
  private getLineNumber(text: string, index: number): number {
    return text.substring(0, index).split('\n').length;
  }

  private getColumnNumber(text: string, index: number): number {
    const lineStart = text.lastIndexOf('\n', index) + 1;
    return index - lineStart + 1;
  }

  private getContext(text: string, index: number, radius: number): string {
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + radius);
    return text.substring(start, end);
  }

  private getDataPointCount(data: ExtractedData): number {
    switch (data.type) {
      case 'table':
        return data.metadata.rowCount || 0;
      case 'list':
        return data.metadata.rowCount || 0;
      case 'statistical':
        return data.metadata.rowCount || 0;
      case 'timeline':
        return data.metadata.rowCount || 0;
      default:
        return 0;
    }
  }

  private inferRelationType(text: string): Relationship['type'] {
    if (text.includes('contient') || text.includes('inclut')) return 'parent-child';
    if (text.includes('dépend') || text.includes('requiert')) return 'dependency';
    if (text.includes('corréle') || text.includes('associe')) return 'correlation';
    return 'association';
  }

  private assessTableQuality(headers: string[], rows: any[][]): number {
    let score = 100;
    
    // Pénaliser les tableaux avec trop de valeurs manquantes
    const missingValues = rows.flat().filter(cell => !cell || cell.trim() === '').length;
    const totalCells = headers.length * rows.length;
    if (totalCells > 0) {
      score -= (missingValues / totalCells) * 50;
    }
    
    // Pénaliser les tableaux avec colonnes incohérentes
    const columnConsistency = rows.every(row => row.length === headers.length);
    if (!columnConsistency) score -= 30;
    
    return Math.max(0, score);
  }

  private assessListQuality(items: string[]): number {
    let score = 100;
    
    // Pénaliser les listes avec beaucoup d'éléments vides
    const emptyItems = items.filter(item => !item || item.trim() === '').length;
    score -= (emptyItems / items.length) * 50;
    
    return Math.max(0, score);
  }

  private assessNumericalQuality(numbers: number[]): number {
    let score = 100;
    
    // Pénaliser les séries avec beaucoup de zéros
    const zeros = numbers.filter(n => n === 0).length;
    if (zeros > numbers.length * 0.5) score -= 30;
    
    return Math.max(0, score);
  }

  private assessDateQuality(dates: Date[]): number {
    let score = 100;
    
    // Pénaliser les dates invalides
    const invalidDates = dates.filter(date => isNaN(date.getTime())).length;
    score -= (invalidDates / dates.length) * 50;
    
    return Math.max(0, score);
  }

  private assessRelationshipQuality(relationships: Relationship[]): number {
    let score = 100;
    
    // Pénaliser les relations à faible force
    const weakRelations = relationships.filter(r => r.strength < 0.5).length;
    score -= (weakRelations / relationships.length) * 30;
    
    return Math.max(0, score);
  }

  private assessHierarchyQuality(nodes: HierarchyNode[]): number {
    let score = 100;
    
    // Pénaliser les hiérarchies avec des cycles
    const hasCycles = this.detectCycles(nodes);
    if (hasCycles) score -= 50;
    
    return Math.max(0, score);
  }

  private assessTimelineQuality(events: TimelineEvent[]): number {
    let score = 100;
    
    // Pénaliser les timelines non chronologiques
    const isChronological = events.every((event, index) => {
      if (index === 0) return true;
      return event.date >= events[index - 1].date;
    });
    
    if (!isChronological) score -= 30;
    
    return Math.max(0, score);
  }

  private detectCycles(nodes: HierarchyNode[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (node && node.children) {
        for (const childId of node.children) {
          if (hasCycle(childId)) return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    return nodes.some(node => hasCycle(node.id));
  }

  private calculateStatistics(numbers: number[]): StatisticalData {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      mean,
      median,
      standardDeviation,
      variance,
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      quartiles: [
        sorted[Math.floor(sorted.length * 0.25)],
        sorted[Math.floor(sorted.length * 0.5)],
        sorted[Math.floor(sorted.length * 0.75)]
      ]
    };
  }

  private cleanData(data: ExtractedData): ExtractedData {
    // Implémenter le nettoyage des données
    return data;
  }

  private normalizeData(data: ExtractedData): ExtractedData {
    // Implémenter la normalisation des données
    return data;
  }

  private validateData(data: ExtractedData): ExtractedData {
    // Implémenter la validation des données
    return data;
  }

  private inferDataTypes(data: ExtractedData): ExtractedData {
    // Implémenter l'inférence de types
    return data;
  }

  private handleMissingValues(data: ExtractedData, strategy: string): ExtractedData {
    // Implémenter la gestion des valeurs manquantes
    return data;
  }

  private aggregateData(data: ExtractedData): ExtractedData {
    // Implémenter l'agrégation des données
    return data;
  }

  private getColor(index: number): string {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    return colors[index % colors.length];
  }

  private generateColorScheme(scheme: string): string[] {
    const schemes = {
      default: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA'],
      vibrant: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF'],
      monochrome: ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7']
    };
    
    return schemes[scheme as keyof typeof schemes] || schemes.default;
  }

  private generateAxes(chartType: string): AxisConfig[] {
    const axes: AxisConfig[] = [];
    
    if (['bar', 'line', 'scatter'].includes(chartType)) {
      axes.push(
        {
          type: 'x',
          label: 'X Axis',
          scale: 'categorical'
        },
        {
          type: 'y',
          label: 'Y Axis',
          scale: 'linear'
        }
      );
    }
    
    return axes;
  }

  /**
   * Mappe les données de la base de données vers l'interface
   */
  private mapDbToVisualization(dbData: any): DataVisualization {
    return {
      id: dbData.id,
      documentId: dbData.document_id,
      userId: dbData.user_id,
      title: dbData.title,
      description: dbData.description,
      originalText: dbData.original_text,
      extractedData: dbData.extracted_data || [],
      visualizations: dbData.visualizations || [],
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
   * Récupère une visualisation par ID
   */
  public async getVisualization(id: string): Promise<DataVisualization | null> {
    try {
      const { data, error } = await supabase
        .from('data_visualizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.mapDbToVisualization(data);
    } catch (error) {
      console.error('Erreur lors de la récupération de la visualisation:', error);
      return null;
    }
  }

  /**
   * Récupère les visualisations d'un utilisateur
   */
  public async getUserVisualizations(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
    } = {}
  ): Promise<DataVisualization[]> {
    try {
      let query = supabase
        .from('data_visualizations')
        .select('*')
        .eq('user_id', userId);

      if (options.status) {
        query = query.eq('status', options.status);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(options.limit || 50)
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      const { data, error } = await query;

      if (error) throw error;

      return data.map(item => this.mapDbToVisualization(item));
    } catch (error) {
      console.error('Erreur lors de la récupération des visualisations utilisateur:', error);
      return [];
    }
  }

  /**
   * Exporte une visualisation
   */
  public async exportVisualization(
    visualizationId: string,
    format: 'png' | 'jpg' | 'svg' | 'pdf' | 'csv' | 'json' | 'excel',
    options: ExportOptions = {
      width: 800,
      height: 600,
      quality: 0.9,
      includeData: true,
      includeMetadata: false
    }
  ): Promise<string> {
    try {
      const visualization = await this.getVisualization(visualizationId);
      if (!visualization) throw new Error('Visualisation non trouvée');

      let content = '';

      switch (format) {
        case 'json':
          content = this.exportToJSON(visualization, options);
          break;
        case 'csv':
          content = this.exportToCSV(visualization, options);
          break;
        case 'png':
        case 'jpg':
        case 'svg':
        case 'pdf':
          content = await this.exportToImage(visualization, format, options);
          break;
        case 'excel':
          content = await this.exportToExcel(visualization, options);
          break;
        default:
          throw new Error(`Format d'export non supporté: ${format}`);
      }

      return content;
    } catch (error) {
      console.error('Erreur lors de l\'export de la visualisation:', error);
      throw error;
    }
  }

  /**
   * Exporte au format JSON
   */
  private exportToJSON(visualization: DataVisualization, options: ExportOptions): string {
    const exportData: any = {
      title: visualization.title,
      description: visualization.description,
      extractedData: visualization.extractedData,
      visualizations: visualization.visualizations,
      createdAt: visualization.createdAt
    };

    if (options.includeMetadata) {
      exportData.metadata = visualization.metadata;
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Exporte au format CSV
   */
  private exportToCSV(visualization: DataVisualization, options: ExportOptions): string {
    let csv = '';

    for (const data of visualization.extractedData) {
      if (data.type === 'table' && data.structure.headers && data.structure.rows) {
        csv += data.title + '\n';
        csv += data.structure.headers.join(',') + '\n';
        
        for (const row of data.structure.rows) {
          csv += row.join(',') + '\n';
        }
        
        csv += '\n';
      }
    }

    return csv;
  }

  /**
   * Exporte au format image (simulation)
   */
  private async exportToImage(
    visualization: DataVisualization, 
    format: string, 
    options: ExportOptions
  ): Promise<string> {
    return `${format.toUpperCase()} exporté pour: ${visualization.title} (${options.width}x${options.height})`;
  }

  /**
   * Exporte au format Excel (simulation)
   */
  private async exportToExcel(visualization: DataVisualization, options: ExportOptions): Promise<string> {
    return `Excel exporté pour: ${visualization.title}`;
  }

  /**
   * Récupère les statistiques des visualisations
   */
  public async getVisualizationStats(userId?: string): Promise<VisualizationStatistics> {
    try {
      // Simuler la récupération des statistiques
      return {
        totalVisualizations: 0,
        publishedVisualizations: 0,
        draftVisualizations: 0,
        totalDataPoints: 0,
        averageDataPointsPerVisualization: 0,
        mostUsedChartTypes: {} as Record<string, number>,
        topPerformingVisualizations: [],
        userEngagement: {
          totalUsers: 0,
          activeUsers: 0,
          averageVisualizationsPerUser: 0,
          averageViewTime: 0,
          satisfactionScore: 0
        },
        dataQuality: {
          averageExtractionAccuracy: 0,
          averageDataCompleteness: 0,
          averageProcessingQuality: 0,
          errorRate: 0
        },
        trends: {
          visualizationGrowth: [],
          dataPointGrowth: [],
          chartTypeTrends: {} as Record<string, number[]>
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
        Rapport de Ventes - Année 2023
        
        | Mois | Ventes | Bénéfices | Croissance |
        |------|--------|----------|-----------|
        | Janvier | 150000 | 45000 | 12% |
        | Février | 165000 | 52000 | 10% |
        | Mars | 180000 | 58000 | 15% |
        | Avril | 175000 | 55000 | 8% |
        | Mai | 195000 | 62000 | 18% |
        | Juin | 210000 | 68000 | 20% |
        
        Statistiques clés:
        - Total des ventes: 1,075,000€
        - Total des bénéfices: 340,000€
        - Croissance moyenne: 13.8%
        - Meilleur mois: Juin
        - Mois le plus faible: Janvier
        
        Événements importants:
        15/01/2023 - Lancement nouveau produit
        20/03/2023 - Campagne marketing printemps
        10/05/2023 - Expansion marché européen
        01/06/2023 - Partenariat stratégique signé
        
        Structure organisationnelle:
        1. Direction Générale
           1.1 Direction Commerciale
              1.1.1 Équipe Ventes France
              1.1.2 Équipe Ventes International
           1.2 Direction Marketing
              1.2.1 Équipe Digital
              1.2.2 Équipe Événementiel
        2. Direction Opérationnelle
           2.1 Production
           2.2 Logistique
      `;

      return sampleContent.trim();
    } catch (error) {
      console.error('Erreur lors de l\'extraction du contenu:', error);
      throw error;
    }
  }

  /**
   * Génère une visualisation de démonstration
   */
  public async generateDemoVisualization(userId: string): Promise<DataVisualization> {
    const demoText = await this.extractDocumentContent('demo-document');
    
    return this.createVisualization('demo-document', userId, demoText);
  }
}

// Export du singleton et des utilitaires
export const dataVisualizationService = DataVisualizationService.getInstance();

export const createDataVisualization = (
  documentId: string,
  userId: string,
  originalText: string,
  settings?: Partial<VisualizationSettings>
) => dataVisualizationService.createVisualization(documentId, userId, originalText, settings);

export const getVisualization = (id: string) => dataVisualizationService.getVisualization(id);

export const getUserVisualizations = (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }
) => dataVisualizationService.getUserVisualizations(userId, options);

export const exportVisualization = (
  visualizationId: string,
  format: 'png' | 'jpg' | 'svg' | 'pdf' | 'csv' | 'json' | 'excel',
  options?: ExportOptions
) => dataVisualizationService.exportVisualization(visualizationId, format, options);

export const getVisualizationStats = (userId?: string) => 
  dataVisualizationService.getVisualizationStats(userId);

export const generateDemoVisualization = (userId: string) => 
  dataVisualizationService.generateDemoVisualization(userId);
