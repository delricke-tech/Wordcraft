/**
 * Service de génération de graphiques (Chart.js)
 * 
 * Ce service génère automatiquement des graphiques interactifs à partir des données
 * extraites des documents, avec support pour Chart.js et différents types de visualisations
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Interfaces pour la génération de graphiques
export interface Chart {
  id: string;
  documentId: string;
  userId: string;
  title: string;
  description?: string;
  chartType: ChartType;
  dataSource: DataSource;
  config: ChartConfig;
  data: ChartData;
  metadata: ChartMetadata;
  analytics: ChartAnalytics;
  status: 'draft' | 'processing' | 'completed' | 'published' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export type ChartType = 
  | 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea'
  | 'scatter' | 'bubble' | 'area' | 'stackedBar' | 'horizontalBar'
  | 'heatmap' | 'treemap' | 'sankey' | 'network' | 'gauge' | 'funnel'
  | 'candlestick' | 'ohlc' | 'boxplot' | 'violin' | 'histogram' | 'custom';

export interface DataSource {
  type: 'table' | 'csv' | 'json' | 'api' | 'manual' | 'extracted';
  source: string;
  extractionMethod?: ExtractionMethod;
  data?: any;
  metadata?: DataSourceMetadata;
}

export interface ExtractionMethod {
  pattern: string;
  confidence: number;
  position: {
    start: number;
    end: number;
    line: number;
  };
}

export interface DataSourceMetadata {
  rowCount: number;
  columnCount: number;
  dataTypes: Record<string, string>;
  quality: number;
  completeness: number;
}

export interface ChartConfig {
  type: ChartType;
  data: {
    labels?: string[];
    datasets: DatasetConfig[];
  };
  options: ChartOptions;
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: PluginConfig[];
  animation?: AnimationConfig;
  interaction?: InteractionConfig;
}

export interface DatasetConfig {
  label: string;
  data: number[] | any[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
  yAxisID?: string;
  xAxisID?: string;
  stack?: string;
  order?: number;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  scales?: ScaleConfig[];
  plugins: {
    legend?: LegendConfig;
    title?: TitleConfig;
    tooltip?: TooltipConfig;
    subtitle?: SubtitleConfig;
  };
  layout?: LayoutConfig;
  elements?: ElementConfig;
  animation?: AnimationOptions;
  interaction?: InteractionOptions;
}

export interface ScaleConfig {
  id: string;
  type: 'linear' | 'logarithmic' | 'category' | 'time' | 'timeseries';
  position: 'left' | 'right' | 'top' | 'bottom';
  title?: {
    display: boolean;
    text: string;
  };
  min?: number;
  max?: number;
  ticks?: {
    stepSize?: number;
    maxTicksLimit?: number;
    callback?: (value: any) => string;
  };
  grid?: {
    display: boolean;
    color?: string;
    borderDash?: number[];
  };
}

export interface LegendConfig {
  display: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  labels?: {
    usePointStyle?: boolean;
    padding?: number;
    font?: {
      size?: number;
      weight?: string;
    };
  };
}

export interface TitleConfig {
  display: boolean;
  text: string;
  font?: {
    size?: number;
    weight?: string;
    family?: string;
  };
  padding?: number;
  color?: string;
}

export interface TooltipConfig {
  enabled: boolean;
  mode: 'index' | 'dataset' | 'point' | 'nearest';
  intersect: boolean;
  backgroundColor?: string;
  titleColor?: string;
  bodyColor?: string;
  borderColor?: string;
  borderWidth?: number;
  callbacks?: {
    label?: (context: any) => string;
    title?: (context: any) => string;
  };
}

export interface SubtitleConfig {
  display: boolean;
  text: string;
  position: 'top' | 'bottom';
  font?: {
    size?: number;
    weight?: string;
  };
  padding?: number;
}

export interface LayoutConfig {
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  autoPadding?: boolean;
}

export interface ElementConfig {
  point?: {
    radius?: number;
    hoverRadius?: number;
    backgroundColor?: string;
    borderColor?: string;
  };
  line?: {
    tension?: number;
    borderWidth?: number;
    borderColor?: string;
    backgroundColor?: string;
  };
  bar?: {
    borderWidth?: number;
    borderColor?: string;
    backgroundColor?: string;
  };
}

export interface AnimationOptions {
  duration: number;
  easing: 'linear' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic' | 'easeInQuart' | 'easeOutQuart' | 'easeInOutQuart' | 'easeInQuint' | 'easeOutQuint' | 'easeInOutQuint' | 'easeInSine' | 'easeOutSine' | 'easeInOutSine' | 'easeInExpo' | 'easeOutExpo' | 'easeInOutExpo' | 'easeInCirc' | 'easeOutCirc' | 'easeInOutCirc' | 'easeInElastic' | 'easeOutElastic' | 'easeInOutElastic' | 'easeInBack' | 'easeOutBack' | 'easeInOutBack' | 'easeInBounce' | 'easeOutBounce' | 'easeInOutBounce';
  delay: (context: any) => number;
}

export interface InteractionOptions {
  mode: 'index' | 'dataset' | 'point' | 'nearest';
  intersect: boolean;
  axis: 'x' | 'y' | 'xy' | 'r';
}

export interface PluginConfig {
  name: string;
  enabled: boolean;
  options?: any;
}

export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: string;
  delay: (context: any) => number;
}

export interface InteractionConfig {
  mode: string;
  intersect: boolean;
  axis: string;
}

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  label: string;
  data: number[] | any[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
  yAxisID?: string;
  xAxisID?: string;
  stack?: string;
  order?: number;
}

export interface ChartMetadata {
  originalDataSize: number;
  processedDataSize: number;
  dataQuality: number;
  generationTime: number;
  chartComplexity: 'simple' | 'moderate' | 'complex';
  recommendedChartTypes: ChartType[];
  dataInsights: DataInsight[];
  aiModel: string;
  version: string;
}

export interface DataInsight {
  type: 'trend' | 'outlier' | 'correlation' | 'pattern' | 'anomaly';
  description: string;
  confidence: number;
  value?: any;
  position?: {
    x?: number;
    y?: number;
  };
}

export interface ChartAnalytics {
  totalViews: number;
  uniqueViews: number;
  averageViewTime: number;
  interactionCount: number;
  exportCount: number;
  shareCount: number;
  downloadCount: number;
  userFeedback: {
    helpful: number;
    notHelpful: number;
    confusing: number;
    inaccurate: number;
    beautiful: number;
  };
  performanceMetrics: {
    renderTime: number;
    animationTime: number;
    interactionLatency: number;
  };
  engagementPatterns: {
    peakHours: number[];
    peakDays: number[];
    deviceBreakdown: Record<string, number>;
  };
}

export interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  chartType: ChartType;
  config: ChartConfig;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  category: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChartExport {
  id: string;
  chartId: string;
  format: 'png' | 'jpg' | 'svg' | 'pdf' | 'json' | 'csv' | 'excel';
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
  backgroundColor?: string;
  includeData?: boolean;
  includeConfig?: boolean;
  watermark?: boolean;
  password?: string;
  animation?: boolean;
}

export interface ChartStatistics {
  totalCharts: number;
  publishedCharts: number;
  draftCharts: number;
  mostUsedChartTypes: Record<ChartType, number>;
  averageDataPointsPerChart: number;
  averageGenerationTime: number;
  topPerformingCharts: Array<{
    chartId: string;
    title: string;
    viewCount: number;
    averageRating: number;
    dataPointCount: number;
    engagementScore: number;
  }>;
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    averageChartsPerUser: number;
    averageViewTime: number;
    satisfactionScore: number;
  };
  dataQuality: {
    averageDataQuality: number;
    averageCompleteness: number;
    extractionSuccessRate: number;
    errorRate: number;
  };
  trends: {
    chartGrowth: number[];
    chartTypeTrends: Record<ChartType, number[]>;
    qualityTrends: number[];
  };
}

// Classe principale du service de génération de graphiques
export class ChartGenerationService {
  private static instance: ChartGenerationService;
  private eventCallbacks: Map<string, Function[]> = new Map();

  private constructor() {}

  public static getInstance(): ChartGenerationService {
    if (!ChartGenerationService.instance) {
      ChartGenerationService.instance = new ChartGenerationService();
    }
    return ChartGenerationService.instance;
  }

  /**
   * Génère un graphique à partir des données
   */
  public async generateChart(
    documentId: string,
    userId: string,
    dataSource: DataSource,
    chartType?: ChartType,
    config?: Partial<ChartConfig>
  ): Promise<Chart> {
    const startTime = Date.now();
    
    try {
      // Analyser la source de données
      const analyzedData = await this.analyzeDataSource(dataSource);
      
      // Déterminer le meilleur type de graphique
      const recommendedType = chartType || this.recommendChartType(analyzedData);
      
      // Créer la configuration du graphique
      const chartConfig = this.createChartConfig(recommendedType, analyzedData, config);
      
      // Générer les données du graphique
      const chartData = this.generateChartData(analyzedData, recommendedType);
      
      // Calculer les insights
      const insights = this.generateDataInsights(chartData, recommendedType);
      
      // Créer le graphique
      const chart: Partial<Chart> = {
        documentId,
        userId,
        title: `Graphique ${recommendedType} - ${new Date().toLocaleDateString()}`,
        chartType: recommendedType,
        dataSource,
        config: chartConfig,
        data: chartData,
        metadata: {
          originalDataSize: analyzedData.metadata?.rowCount || 0,
          processedDataSize: chartData.labels.length,
          dataQuality: analyzedData.metadata?.quality || 0,
          generationTime: 0,
          chartComplexity: this.assessChartComplexity(chartData, recommendedType),
          recommendedChartTypes: [recommendedType],
          dataInsights: insights,
          aiModel: 'chart-generator-v1.0',
          version: '1.0.0'
        },
        analytics: {
          totalViews: 0,
          uniqueViews: 0,
          averageViewTime: 0,
          interactionCount: 0,
          exportCount: 0,
          shareCount: 0,
          downloadCount: 0,
          userFeedback: {
            helpful: 0,
            notHelpful: 0,
            confusing: 0,
            inaccurate: 0,
            beautiful: 0
          },
          performanceMetrics: {
            renderTime: 0,
            animationTime: 0,
            interactionLatency: 0
          },
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

      // Sauvegarder le graphique
      const { data: savedChart, error: saveError } = await supabase
        .from('charts')
        .insert([chart])
        .select()
        .single();

      if (saveError) throw saveError;

      // Émettre l'événement de début
      this.emitEvent('chart_generation_started', savedChart);

      // Mettre à jour le temps de génération
      const generationTime = Date.now() - startTime;
      
      const { data: finalChart, error: updateError } = await supabase
        .from('charts')
        .update({
          metadata: {
            ...chart.metadata,
            generationTime
          },
          status: 'completed',
          updated_at: new Date()
        })
        .eq('id', savedChart.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Émettre l'événement de complétion
      this.emitEvent('chart_generation_completed', finalChart);

      return this.mapDbToChart(finalChart);

    } catch (error) {
      console.error('Erreur lors de la génération du graphique:', error);
      throw error;
    }
  }

  /**
   * Analyse la source de données
   */
  private async analyzeDataSource(dataSource: DataSource): Promise<DataSource> {
    switch (dataSource.type) {
      case 'extracted':
        return this.analyzeExtractedData(dataSource);
      case 'table':
        return this.analyzeTableData(dataSource);
      case 'csv':
        return this.analyzeCSVData(dataSource);
      case 'json':
        return this.analyzeJSONData(dataSource);
      case 'manual':
        return this.analyzeManualData(dataSource);
      default:
        throw new Error(`Type de source de données non supporté: ${dataSource.type}`);
    }
  }

  /**
   * Analyse les données extraites
   */
  private async analyzeExtractedData(dataSource: DataSource): Promise<DataSource> {
    // Simuler l'analyse de données extraites
    const sampleData = {
      headers: ['Mois', 'Ventes', 'Bénéfices', 'Croissance'],
      rows: [
        ['Janvier', 150000, 45000, 12],
        ['Février', 165000, 52000, 10],
        ['Mars', 180000, 58000, 15],
        ['Avril', 175000, 55000, 8],
        ['Mai', 195000, 62000, 18],
        ['Juin', 210000, 68000, 20]
      ]
    };

    const metadata: DataSourceMetadata = {
      rowCount: sampleData.rows.length,
      columnCount: sampleData.headers.length,
      dataTypes: {
        'Mois': 'string',
        'Ventes': 'number',
        'Bénéfices': 'number',
        'Croissance': 'number'
      },
      quality: 0.9,
      completeness: 1.0
    };

    return {
      ...dataSource,
      data: sampleData,
      metadata
    };
  }

  /**
   * Analyse les données de tableau
   */
  private async analyzeTableData(dataSource: DataSource): Promise<DataSource> {
    // Implémenter l'analyse de données de tableau
    return dataSource;
  }

  /**
   * Analyse les données CSV
   */
  private async analyzeCSVData(dataSource: DataSource): Promise<DataSource> {
    // Implémenter l'analyse de données CSV
    return dataSource;
  }

  /**
   * Analyse les données JSON
   */
  private async analyzeJSONData(dataSource: DataSource): Promise<DataSource> {
    // Implémenter l'analyse de données JSON
    return dataSource;
  }

  /**
   * Analyse les données manuelles
   */
  private async analyzeManualData(dataSource: DataSource): Promise<DataSource> {
    // Implémenter l'analyse de données manuelles
    return dataSource;
  }

  /**
   * Recommande le meilleur type de graphique
   */
  private recommendChartType(dataSource: DataSource): ChartType {
    const { rowCount, columnCount, dataTypes } = dataSource.metadata || {};
    
    if (!rowCount || !columnCount) return 'bar';

    const numericColumns = Object.values(dataTypes || {}).filter(type => type === 'number').length;
    const categoricalColumns = Object.values(dataTypes || {}).filter(type => type === 'string').length;

    // Logique de recommandation
    if (rowCount <= 5 && numericColumns === 1) {
      return 'pie'; // Petites séries numériques
    } else if (rowCount > 5 && numericColumns >= 1) {
      return 'line'; // Séries temporelles ou tendances
    } else if (numericColumns >= 2 && categoricalColumns >= 1) {
      return 'bar'; // Comparaisons
    } else if (numericColumns >= 2 && categoricalColumns === 0) {
      return 'scatter'; // Corrélations
    } else if (categoricalColumns >= 2) {
      return 'horizontalBar'; // Catégories multiples
    }

    return 'bar'; // Par défaut
  }

  /**
   * Crée la configuration du graphique
   */
  private createChartConfig(
    chartType: ChartType,
    dataSource: DataSource,
    customConfig?: Partial<ChartConfig>
  ): ChartConfig {
    const baseConfig = this.getBaseConfig(chartType);
    const dataConfig = this.createDataConfig(chartType, dataSource);
    
    const config: ChartConfig = {
      type: chartType,
      data: dataConfig,
      options: baseConfig.options,
      responsive: true,
      maintainAspectRatio: false,
      plugins: baseConfig.plugins,
      animation: baseConfig.animation,
      interaction: baseConfig.interaction
    };

    // Fusionner avec la configuration personnalisée
    if (customConfig) {
      return this.mergeConfigs(config, customConfig);
    }

    return config;
  }

  /**
   * Obtient la configuration de base pour un type de graphique
   */
  private getBaseConfig(chartType: ChartType): Partial<ChartConfig> {
    const baseOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        title: {
          display: true,
          text: 'Graphique généré automatiquement'
        },
        tooltip: {
          enabled: true,
          mode: 'nearest',
          intersect: false
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      },
      interaction: {
        mode: 'nearest',
        intersect: false
      }
    };

    // Configuration spécifique par type
    switch (chartType) {
      case 'line':
        return {
          options: {
            ...baseOptions,
            scales: [
              {
                id: 'y',
                type: 'linear',
                position: 'left',
                title: { display: true, text: 'Valeur' }
              },
              {
                id: 'x',
                type: 'category',
                position: 'bottom',
                title: { display: true, text: 'Catégorie' }
              }
            ]
          },
          plugins: [
            { name: 'legend', enabled: true },
            { name: 'title', enabled: true },
            { name: 'tooltip', enabled: true }
          ],
          animation: {
            enabled: true,
            duration: 1000,
            easing: 'easeInOutQuart',
            delay: (context: any) => context.dataIndex * 100
          },
          interaction: {
            mode: 'index',
            intersect: false,
            axis: 'x'
          }
        };

      case 'bar':
        return {
          options: {
            ...baseOptions,
            scales: [
              {
                id: 'y',
                type: 'linear',
                position: 'left',
                title: { display: true, text: 'Valeur' }
              },
              {
                id: 'x',
                type: 'category',
                position: 'bottom',
                title: { display: true, text: 'Catégorie' }
              }
            ]
          },
          plugins: [
            { name: 'legend', enabled: true },
            { name: 'title', enabled: true },
            { name: 'tooltip', enabled: true }
          ],
          animation: {
            enabled: true,
            duration: 1000,
            easing: 'easeInOutQuart',
            delay: (context: any) => context.dataIndex * 50
          },
          interaction: {
            mode: 'index',
            intersect: false,
            axis: 'x'
          }
        };

      case 'pie':
        return {
          options: {
            ...baseOptions,
            plugins: {
              ...baseOptions.plugins,
              legend: {
                display: true,
                position: 'right'
              }
            }
          },
          plugins: [
            { name: 'legend', enabled: true },
            { name: 'title', enabled: true },
            { name: 'tooltip', enabled: true }
          ],
          animation: {
            enabled: true,
            duration: 1000,
            easing: 'easeInOutQuart',
            delay: (context: any) => context.dataIndex * 100
          },
          interaction: {
            mode: 'nearest',
            intersect: true,
            axis: 'r'
          }
        };

      case 'scatter':
        return {
          options: {
            ...baseOptions,
            scales: [
              {
                id: 'y',
                type: 'linear',
                position: 'left',
                title: { display: true, text: 'Y Axis' }
              },
              {
                id: 'x',
                type: 'linear',
                position: 'bottom',
                title: { display: true, text: 'X Axis' }
              }
            ]
          },
          plugins: [
            { name: 'legend', enabled: true },
            { name: 'title', enabled: true },
            { name: 'tooltip', enabled: true }
          ],
          animation: {
            enabled: true,
            duration: 1000,
            easing: 'easeInOutQuart',
            delay: (context: any) => context.dataIndex * 50
          },
          interaction: {
            mode: 'nearest',
            intersect: true,
            axis: 'xy'
          }
        };

      default:
        return {
          options: baseOptions,
          plugins: [
            { name: 'legend', enabled: true },
            { name: 'title', enabled: true },
            { name: 'tooltip', enabled: true }
          ],
          animation: {
            enabled: true,
            duration: 1000,
            easing: 'easeInOutQuart',
            delay: () => 0
          },
          interaction: {
            mode: 'nearest',
            intersect: false,
            axis: 'x'
          }
        };
    }
  }

  /**
   * Crée la configuration des données
   */
  private createDataConfig(chartType: ChartType, dataSource: DataSource): { labels?: string[]; datasets: DatasetConfig[] } {
    const data = dataSource.data;
    
    if (!data || !data.headers || !data.rows) {
      return { datasets: [] };
    }

    const labels = data.rows.map((row: any[]) => row[0]);
    const datasets: DatasetConfig[] = [];

    // Créer un dataset pour chaque colonne numérique (sauf la première qui est généralement les labels)
    for (let i = 1; i < data.headers.length; i++) {
      const header = data.headers[i];
      const values = data.rows.map((row: any[]) => {
        const value = row[i];
        return typeof value === 'string' ? parseFloat(value) || 0 : value;
      });

      const dataset: DatasetConfig = {
        label: header,
        data: values,
        backgroundColor: this.getColor(i - 1),
        borderColor: this.getColor(i - 1, 0.8),
        borderWidth: 2,
        fill: false,
        tension: chartType === 'line' ? 0.4 : 0,
        pointRadius: chartType === 'line' ? 4 : 0,
        pointHoverRadius: chartType === 'line' ? 6 : 0
      };

      // Configuration spécifique par type
      if (chartType === 'pie' || chartType === 'doughnut') {
        dataset.backgroundColor = this.generateColorPalette(values.length);
        dataset.borderWidth = 2;
        dataset.borderColor = '#ffffff';
      } else if (chartType === 'bar') {
        dataset.backgroundColor = this.getColor(i - 1, 0.6);
        dataset.borderWidth = 1;
      } else if (chartType === 'scatter') {
        dataset.pointRadius = 6;
        dataset.pointHoverRadius = 8;
      }

      datasets.push(dataset);
    }

    return { labels, datasets };
  }

  /**
   * Génère les données du graphique
   */
  private generateChartData(dataSource: DataSource, chartType: ChartType): ChartData {
    const dataConfig = this.createDataConfig(chartType, dataSource);
    
    const datasets: Dataset[] = dataConfig.datasets.map(config => ({
      label: config.label,
      data: config.data as number[],
      backgroundColor: config.backgroundColor,
      borderColor: config.borderColor,
      borderWidth: config.borderWidth,
      fill: config.fill,
      tension: config.tension,
      pointRadius: config.pointRadius,
      pointHoverRadius: config.pointHoverRadius,
      yAxisID: config.yAxisID,
      xAxisID: config.xAxisID,
      stack: config.stack,
      order: config.order
    }));

    return {
      labels: dataConfig.labels || [],
      datasets
    };
  }

  /**
   * Génère des insights sur les données
   */
  private generateDataInsights(chartData: ChartData, chartType: ChartType): DataInsight[] {
    const insights: DataInsight[] = [];

    for (const dataset of chartData.datasets) {
      const data = dataset.data as number[];
      
      // Détecter les tendances
      if (data.length >= 3) {
        const trend = this.detectTrend(data);
        if (trend.strength > 0.7) {
          insights.push({
            type: 'trend',
            description: `Tendance ${trend.direction} détectée avec une confiance de ${(trend.strength * 100).toFixed(1)}%`,
            confidence: trend.strength,
            value: trend.slope
          });
        }
      }

      // Détecter les valeurs aberrantes
      const outliers = this.detectOutliers(data);
      outliers.forEach(outlier => {
        insights.push({
          type: 'outlier',
          description: `Valeur aberrante détectée: ${outlier.value}`,
          confidence: 0.8,
          value: outlier.value,
          position: { x: outlier.index, y: outlier.value }
        });
      });

      // Détecter les corrélations (si plusieurs datasets)
      if (chartData.datasets.length > 1) {
        for (const otherDataset of chartData.datasets) {
          if (otherDataset !== dataset) {
            const correlation = this.calculateCorrelation(data, otherDataset.data as number[]);
            if (Math.abs(correlation) > 0.7) {
              insights.push({
                type: 'correlation',
                description: `Corrélation ${correlation > 0 ? 'positive' : 'negative'} forte entre ${dataset.label} et ${otherDataset.label}`,
                confidence: Math.abs(correlation),
                value: correlation
              });
            }
          }
        }
      }
    }

    return insights;
  }

  /**
   * Détecte les tendances dans les données
   */
  private detectTrend(data: number[]): { direction: 'up' | 'down' | 'stable'; strength: number; slope: number } {
    if (data.length < 2) return { direction: 'stable', strength: 0, slope: 0 };

    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    // Calcul de la régression linéaire
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calcul du coefficient de détermination (R²)
    const yMean = sumY / n;
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const residualSumSquares = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);

    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    const strength = Math.max(0, rSquared);

    return {
      direction: slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'stable',
      strength,
      slope
    };
  }

  /**
   * Détecte les valeurs aberrantes
   */
  private detectOutliers(data: number[]): Array<{ index: number; value: number; zScore: number }> {
    const outliers: Array<{ index: number; value: number; zScore: number }> = [];
    
    if (data.length < 4) return outliers;

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    data.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > 2) {
        outliers.push({ index, value, zScore });
      }
    });

    return outliers;
  }

  /**
   * Calcule la corrélation entre deux séries de données
   */
  private calculateCorrelation(data1: number[], data2: number[]): number {
    if (data1.length !== data2.length || data1.length === 0) return 0;

    const n = data1.length;
    const mean1 = data1.reduce((sum, val) => sum + val, 0) / n;
    const mean2 = data2.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let sumSq1 = 0;
    let sumSq2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = data1[i] - mean1;
      const diff2 = data2[i] - mean2;
      numerator += diff1 * diff2;
      sumSq1 += diff1 * diff1;
      sumSq2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sumSq1 * sumSq2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Évalue la complexité du graphique
   */
  private assessChartComplexity(chartData: ChartData, chartType: ChartType): 'simple' | 'moderate' | 'complex' {
    let complexityScore = 0;

    // Nombre de datasets
    complexityScore += chartData.datasets.length * 2;

    // Nombre de points de données
    const totalPoints = chartData.datasets.reduce((sum, dataset) => sum + dataset.data.length, 0);
    complexityScore += totalPoints > 50 ? 3 : totalPoints > 20 ? 2 : 1;

    // Type de graphique
    const typeComplexity: Record<ChartType, number> = {
      'line': 2, 'bar': 1, 'pie': 1, 'doughnut': 1, 'radar': 3, 'polarArea': 2,
      'scatter': 2, 'bubble': 3, 'area': 2, 'stackedBar': 2, 'horizontalBar': 1,
      'heatmap': 4, 'treemap': 3, 'sankey': 4, 'network': 4, 'gauge': 2, 'funnel': 3,
      'candlestick': 3, 'ohlc': 3, 'boxplot': 3, 'violin': 3, 'histogram': 2, 'custom': 3
    };

    complexityScore += typeComplexity[chartType] || 2;

    if (complexityScore <= 4) return 'simple';
    if (complexityScore <= 8) return 'moderate';
    return 'complex';
  }

  /**
   * Fusionne deux configurations
   */
  private mergeConfigs(base: ChartConfig, custom: Partial<ChartConfig>): ChartConfig {
    return {
      ...base,
      ...custom,
      options: {
        ...base.options,
        ...custom.options,
        plugins: {
          ...base.options.plugins,
          ...custom.options?.plugins
        }
      },
      data: {
        ...base.data,
        ...custom.data
      }
    };
  }

  /**
   * Génère une palette de couleurs
   */
  private generateColorPalette(count: number): string[] {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];

    const palette: string[] = [];
    for (let i = 0; i < count; i++) {
      palette.push(colors[i % colors.length]);
    }

    return palette;
  }

  /**
   * Obtient une couleur
   */
  private getColor(index: number, alpha: number = 1): string {
    const colors = [
      `rgba(255, 99, 132, ${alpha})`,
      `rgba(54, 162, 235, ${alpha})`,
      `rgba(255, 206, 86, ${alpha})`,
      `rgba(75, 192, 192, ${alpha})`,
      `rgba(153, 102, 255, ${alpha})`,
      `rgba(255, 159, 64, ${alpha})`
    ];

    return colors[index % colors.length];
  }

  /**
   * Mappe les données de la base de données vers l'interface
   */
  private mapDbToChart(dbData: any): Chart {
    return {
      id: dbData.id,
      documentId: dbData.document_id,
      userId: dbData.user_id,
      title: dbData.title,
      description: dbData.description,
      chartType: dbData.chart_type,
      dataSource: dbData.data_source,
      config: dbData.config,
      data: dbData.data,
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
   * Récupère un graphique par ID
   */
  public async getChart(id: string): Promise<Chart | null> {
    try {
      const { data, error } = await supabase
        .from('charts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.mapDbToChart(data);
    } catch (error) {
      console.error('Erreur lors de la récupération du graphique:', error);
      return null;
    }
  }

  /**
   * Récupère les graphiques d'un utilisateur
   */
  public async getUserCharts(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      chartType?: ChartType;
    } = {}
  ): Promise<Chart[]> {
    try {
      let query = supabase
        .from('charts')
        .select('*')
        .eq('user_id', userId);

      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.chartType) {
        query = query.eq('chart_type', options.chartType);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(options.limit || 50)
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      const { data, error } = await query;

      if (error) throw error;

      return data.map(item => this.mapDbToChart(item));
    } catch (error) {
      console.error('Erreur lors de la récupération des graphiques utilisateur:', error);
      return [];
    }
  }

  /**
   * Exporte un graphique
   */
  public async exportChart(
    chartId: string,
    format: 'png' | 'jpg' | 'svg' | 'pdf' | 'json' | 'csv' | 'excel',
    options: ExportOptions = {
      width: 800,
      height: 600,
      quality: 0.9,
      includeData: true,
      includeConfig: false
    }
  ): Promise<string> {
    try {
      const chart = await this.getChart(chartId);
      if (!chart) throw new Error('Graphique non trouvé');

      let content = '';

      switch (format) {
        case 'json':
          content = this.exportToJSON(chart, options);
          break;
        case 'csv':
          content = this.exportToCSV(chart, options);
          break;
        case 'png':
        case 'jpg':
        case 'svg':
        case 'pdf':
          content = await this.exportToImage(chart, format, options);
          break;
        case 'excel':
          content = await this.exportToExcel(chart, options);
          break;
        default:
          throw new Error(`Format d'export non supporté: ${format}`);
      }

      return content;
    } catch (error) {
      console.error('Erreur lors de l\'export du graphique:', error);
      throw error;
    }
  }

  /**
   * Exporte au format JSON
   */
  private exportToJSON(chart: Chart, options: ExportOptions): string {
    const exportData: any = {
      title: chart.title,
      description: chart.description,
      chartType: chart.chartType,
      data: chart.data,
      config: options.includeConfig ? chart.config : undefined,
      createdAt: chart.createdAt
    };

    if (options.includeData) {
      exportData.dataSource = chart.dataSource;
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Exporte au format CSV
   */
  private exportToCSV(chart: Chart, options: ExportOptions): string {
    let csv = '';

    // En-tête
    csv += chart.title + '\n';
    csv += `Type: ${chart.chartType}\n\n`;

    // Données
    if (chart.data.labels && chart.data.labels.length > 0) {
      csv += ',' + chart.data.labels.join(',') + '\n';
      
      for (const dataset of chart.data.datasets) {
        csv += dataset.label + ',' + dataset.data.join(',') + '\n';
      }
    }

    return csv;
  }

  /**
   * Exporte au format image (simulation)
   */
  private async exportToImage(
    chart: Chart, 
    format: string, 
    options: ExportOptions
  ): Promise<string> {
    return `${format.toUpperCase()} exporté pour: ${chart.title} (${options.width}x${options.height})`;
  }

  /**
   * Exporte au format Excel (simulation)
   */
  private async exportToExcel(chart: Chart, options: ExportOptions): Promise<string> {
    return `Excel exporté pour: ${chart.title}`;
  }

  /**
   * Récupère les statistiques des graphiques
   */
  public async getChartStats(userId?: string): Promise<ChartStatistics> {
    try {
      // Simuler la récupération des statistiques
      return {
        totalCharts: 0,
        publishedCharts: 0,
        draftCharts: 0,
        mostUsedChartTypes: {} as Record<ChartType, number>,
        averageDataPointsPerChart: 0,
        averageGenerationTime: 0,
        topPerformingCharts: [],
        userEngagement: {
          totalUsers: 0,
          activeUsers: 0,
          averageChartsPerUser: 0,
          averageViewTime: 0,
          satisfactionScore: 0
        },
        dataQuality: {
          averageDataQuality: 0,
          averageCompleteness: 0,
          extractionSuccessRate: 0,
          errorRate: 0
        },
        trends: {
          chartGrowth: [],
          chartTypeTrends: {} as Record<ChartType, number[]>,
          qualityTrends: []
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Génère un graphique de démonstration
   */
  public async generateDemoChart(userId: string): Promise<Chart> {
    const demoDataSource: DataSource = {
      type: 'extracted',
      source: 'demo-data',
      data: {
        headers: ['Mois', 'Ventes', 'Bénéfices', 'Croissance'],
        rows: [
          ['Janvier', 150000, 45000, 12],
          ['Février', 165000, 52000, 10],
          ['Mars', 180000, 58000, 15],
          ['Avril', 175000, 55000, 8],
          ['Mai', 195000, 62000, 18],
          ['Juin', 210000, 68000, 20]
        ]
      }
    };

    return this.generateChart('demo-document', userId, demoDataSource, 'line');
  }
}

// Export du singleton et des utilitaires
export const chartGenerationService = ChartGenerationService.getInstance();

export const generateChart = (
  documentId: string,
  userId: string,
  dataSource: DataSource,
  chartType?: ChartType,
  config?: Partial<ChartConfig>
) => chartGenerationService.generateChart(documentId, userId, dataSource, chartType, config);

export const getChart = (id: string) => chartGenerationService.getChart(id);

export const getUserCharts = (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
    chartType?: ChartType;
  }
) => chartGenerationService.getUserCharts(userId, options);

export const exportChart = (
  chartId: string,
  format: 'png' | 'jpg' | 'svg' | 'pdf' | 'json' | 'csv' | 'excel',
  options?: ExportOptions
) => chartGenerationService.exportChart(chartId, format, options);

export const getChartStats = (userId?: string) => 
  chartGenerationService.getChartStats(userId);

export const generateDemoChart = (userId: string) => 
  chartGenerationService.generateDemoChart(userId);
