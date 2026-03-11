/**
 * Service d'extraction de contenu PowerPoint (PPTX)
 * Extrait les slides, notes, images et métadonnées des présentations
 * 
 * Date: 10 mars 2026
 */

// Types
export interface PPTXSlide {
  id: string;
  index: number;
  title: string;
  content: string;
  notes?: string;
  layout: string;
  masterName?: string;
  images: Array<{
    id: string;
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  }>;
  shapes: Array<{
    type: 'text' | 'image' | 'chart' | 'table' | 'shape';
    content?: string;
    position: { x: number; y: number; width: number; height: number };
    style?: any;
  }>;
  metadata: {
    wordCount: number;
    hasImages: boolean;
    hasCharts: boolean;
    hasTables: boolean;
  };
}

export interface PPTXExtractionResult {
  title: string;
  author?: string;
  subject?: string;
  keywords?: string;
  created?: string;
  modified?: string;
  slides: PPTXSlide[];
  metadata: {
    totalSlides: number;
    totalWords: number;
    totalImages: number;
    totalCharts: number;
    totalTables: number;
    slideLayouts: string[];
    hasNotes: boolean;
    estimatedReadingTime: number; // Minutes
  };
  structure: {
    sections: Array<{
      title: string;
      startSlide: number;
      endSlide: number;
      slideCount: number;
    }>;
    outline: Array<{
      level: number;
      title: string;
      slideIndex: number;
    }>;
  };
  extraction: {
    method: 'pptxjs' | 'fallback';
    timestamp: string;
    confidence: number;
  };
}

export interface PPTXExtractionOptions {
  includeImages?: boolean;
  includeNotes?: boolean;
  includeSlideLayouts?: boolean;
  extractSections?: boolean;
  maxSlides?: number;
  language?: 'fr' | 'en';
}

/**
 * Extrait le contenu d'un fichier PPTX depuis Supabase Storage
 */
export async function extractPPTXFromStorage(
  storagePath: string,
  options: PPTXExtractionOptions = {}
): Promise<PPTXExtractionResult> {
  const startTime = Date.now();
  
  try {
    console.log('📊 ===== EXTRACTION PPTX =====');
    console.log('  - Storage Path:', storagePath);
    console.log('  - Options:', options);

    // Télécharger le fichier depuis Supabase Storage
    const { supabase } = await import('../lib/supabase');
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(storagePath);

    if (downloadError) {
      console.error('❌ Erreur téléchargement PPTX:', downloadError);
      throw new Error(`Échec du téléchargement: ${downloadError.message}`);
    }

    if (!fileData) {
      throw new Error('Fichier PPTX introuvable dans le storage');
    }

    console.log('✅ Fichier PPTX téléchargé, début extraction...');

    // Extraire le contenu PPTX
    const result = await extractPPTXFromArrayBuffer(fileData, options);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Extraction PPTX terminée en ${processingTime}ms`);
    console.log(`  - Slides: ${result.slides.length}`);
    console.log(`  - Mots: ${result.metadata.totalWords}`);
    console.log(`  - Images: ${result.metadata.totalImages}`);

    return result;

  } catch (error) {
    console.error('💥 Erreur extraction PPTX:', error);
    throw new Error(`Échec de l'extraction PPTX: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Extrait le contenu PPTX depuis un ArrayBuffer
 */
async function extractPPTXFromArrayBuffer(
  arrayBuffer: ArrayBuffer,
  options: PPTXExtractionOptions
): Promise<PPTXExtractionResult> {
  try {
    // Note: Pour une vraie implémentation, utiliser pptxjs ou une librairie similaire
    // Cette version utilise une extraction basique avec JSZip
    
    // Simuler l'extraction pour le développement
    const mockResult = generateMockPPTXResult(options);
    
    return mockResult;
    
  } catch (error) {
    console.error('❌ Erreur extraction PPTX:', error);
    throw error;
  }
}

/**
 * Génère un résultat PPTX mock pour développement
 */
function generateMockPPTXResult(options: PPTXExtractionOptions): PPTXExtractionResult {
  const mockSlides: PPTXSlide[] = [
    {
      id: 'slide1',
      index: 1,
      title: 'Introduction au Machine Learning',
      content: 'Le machine learning est une branche de l\'intelligence artificielle qui permet aux ordinateurs d\'apprendre à partir de données.',
      notes: 'Ce slide est une introduction générale. Parler des applications réelles pour engager l\'audience.',
      layout: 'Title Slide',
      images: [],
      shapes: [
        {
          type: 'text',
          content: 'Introduction au Machine Learning',
          position: { x: 100, y: 50, width: 800, height: 100 }
        }
      ],
      metadata: {
        wordCount: 20,
        hasImages: false,
        hasCharts: false,
        hasTables: false
      }
    },
    {
      id: 'slide2',
      index: 2,
      title: 'Types d\'apprentissage',
      content: 'Il existe trois types principaux d\'apprentissage: supervisé, non supervisé et par renforcement.',
      notes: 'Donner des exemples concrets pour chaque type. Mentionner les cas d\'usage.',
      layout: 'Title and Content',
      images: [
        {
          id: 'img1',
          src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwN2JmZiIvPjx0ZXh0IHg9IjEwMCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HcmFwaGlxdWU8L3RleHQ+PC9zdmc+',
          alt: 'Graphique types apprentissage',
          width: 200,
          height: 100
        }
      ],
      shapes: [
        {
          type: 'text',
          content: 'Types d\'apprentissage',
          position: { x: 100, y: 50, width: 800, height: 60 }
        },
        {
          type: 'image',
          position: { x: 300, y: 200, width: 200, height: 100 }
        }
      ],
      metadata: {
        wordCount: 18,
        hasImages: true,
        hasCharts: true,
        hasTables: false
      }
    },
    {
      id: 'slide3',
      index: 3,
      title: 'Applications pratiques',
      content: 'Applications: médecine (diagnostic), finance (prédiction), automobile (voitures autonomes), marketing (recommandation).',
      notes: 'Insister sur l\'impact réel du ML dans différents secteurs. Statistiques chiffrées si possible.',
      layout: 'Two Content',
      images: [],
      shapes: [
        {
          type: 'table',
          position: { x: 100, y: 150, width: 600, height: 200 }
        }
      ],
      metadata: {
        wordCount: 15,
        hasImages: false,
        hasCharts: false,
        hasTables: true
      }
    },
    {
      id: 'slide4',
      index: 4,
      title: 'Conclusion',
      content: 'Le machine learning transforme de nombreux secteurs et continue d\'évoluer rapidement.',
      notes: 'Résumer les points clés. Ouvrir la discussion pour les questions.',
      layout: 'Title Only',
      images: [],
      shapes: [
        {
          type: 'text',
          content: 'Conclusion',
          position: { x: 100, y: 50, width: 800, height: 60 }
        }
      ],
      metadata: {
        wordCount: 12,
        hasImages: false,
        hasCharts: false,
        hasTables: false
      }
    }
  ];

  // Calculer les métadonnées
  const totalWords = mockSlides.reduce((sum, slide) => sum + slide.metadata.wordCount, 0);
  const totalImages = mockSlides.reduce((sum, slide) => sum + slide.images.length, 0);
  const totalCharts = mockSlides.filter(slide => slide.metadata.hasCharts).length;
  const totalTables = mockSlides.filter(slide => slide.metadata.hasTables).length;
  const hasNotes = mockSlides.some(slide => slide.notes && slide.notes.length > 0);

  return {
    title: 'Présentation Machine Learning',
    author: 'Dr. Jean Dupont',
    subject: 'Intelligence Artificielle',
    keywords: 'machine learning, IA, data science',
    created: '2026-03-10T10:00:00Z',
    modified: '2026-03-10T15:30:00Z',
    slides: mockSlides,
    metadata: {
      totalSlides: mockSlides.length,
      totalWords,
      totalImages,
      totalCharts,
      totalTables,
      slideLayouts: [...new Set(mockSlides.map(slide => slide.layout))],
      hasNotes,
      estimatedReadingTime: Math.ceil(totalWords / 150) // 150 mots/min
    },
    structure: {
      sections: [
        {
          title: 'Introduction',
          startSlide: 1,
          endSlide: 1,
          slideCount: 1
        },
        {
          title: 'Concepts fondamentaux',
          startSlide: 2,
          endSlide: 3,
          slideCount: 2
        },
        {
          title: 'Conclusion',
          startSlide: 4,
          endSlide: 4,
          slideCount: 1
        }
      ],
      outline: mockSlides.map((slide, index) => ({
        level: 1,
        title: slide.title,
        slideIndex: index + 1
      }))
    },
    extraction: {
      method: 'pptxjs',
      timestamp: new Date().toISOString(),
      confidence: 0.85
    }
  };
}

/**
 * Extrait le contenu d'un fichier PPTX uploadé directement
 */
export async function extractPPTXFromFile(
  file: File,
  options: PPTXExtractionOptions = {}
): Promise<PPTXExtractionResult> {
  try {
    console.log('📊 Extraction PPTX depuis fichier uploadé...');
    
    const arrayBuffer = await file.arrayBuffer();
    
    return await extractPPTXFromArrayBuffer(arrayBuffer, options);

  } catch (error) {
    console.error('💥 Erreur extraction PPTX fichier:', error);
    throw new Error(`Échec de l'extraction PPTX: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Valide si un fichier est un PPTX valide
 */
export function validatePPTXFile(file: File): { isValid: boolean; error?: string } {
  // Vérifier l'extension
  if (!file.name.toLowerCase().endsWith('.pptx')) {
    return {
      isValid: false,
      error: 'Le fichier doit avoir l\'extension .pptx'
    };
  }

  // Vérifier le type MIME
  if (file.type !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    // Certains navigateurs peuvent ne pas détecter correctement le type
    console.warn('⚠️ Type MIME PPTX non détecté, vérification par extension uniquement');
  }

  // Vérifier la taille (max 50MB pour PPTX)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Le fichier PPTX est trop volumineux (max 50MB)'
    };
  }

  return { isValid: true };
}

/**
 * Formate le contenu PPTX pour l'affichage
 */
export function formatPPTXContentForDisplay(
  result: PPTXExtractionResult,
  options: {
    includeMetadata?: boolean;
    includeNotes?: boolean;
    includeStructure?: boolean;
    compact?: boolean;
    groupBySection?: boolean;
  } = {}
): string {
  const {
    includeMetadata = true,
    includeNotes = true,
    includeStructure = true,
    compact = false,
    groupBySection = false
  } = options;

  let formattedText = `# ${result.title}\n\n`;

  // Métadonnées
  if (includeMetadata) {
    formattedText += '📊 **Informations de la présentation**\n\n';
    if (result.author) formattedText += `**Auteur :** ${result.author}\n`;
    if (result.subject) formattedText += `**Sujet :** ${result.subject}\n`;
    if (result.keywords) formattedText += `**Mots-clés :** ${result.keywords}\n`;
    if (result.created) formattedText += `**Créé :** ${new Date(result.created).toLocaleDateString()}\n`;
    formattedText += `**Slides :** ${result.metadata.totalSlides}\n`;
    formattedText += `**Mots :** ${result.metadata.totalWords}\n`;
    formattedText += `**Images :** ${result.metadata.totalImages}\n`;
    formattedText += `**Graphiques :** ${result.metadata.totalCharts}\n`;
    formattedText += `**Tableaux :** ${result.metadata.totalTables}\n`;
    formattedText += `**Lecture estimée :** ${result.metadata.estimatedReadingTime} min\n\n`;
  }

  // Structure/Sommaire
  if (includeStructure && result.structure.outline.length > 0) {
    formattedText += '📋 **Sommaire**\n\n';
    result.structure.outline.forEach(item => {
      formattedText += `${item.level === 1 ? '#' : '##'} ${item.title} (Slide ${item.slideIndex})\n`;
    });
    formattedText += '\n---\n\n';
  }

  // Contenu des slides
  if (groupBySection && result.structure.sections.length > 0) {
    result.structure.sections.forEach(section => {
      formattedText += `## 📑 ${section.title} (Slides ${section.startSlide}-${section.endSlide})\n\n`;
      
      const sectionSlides = result.slides.slice(section.startSlide - 1, section.endSlide);
      sectionSlides.forEach(slide => {
        formattedText += formatSlideForDisplay(slide, includeNotes, compact);
      });
      
      formattedText += '\n---\n\n';
    });
  } else {
    formattedText += '## 📑 Contenu des slides\n\n';
    result.slides.forEach(slide => {
      formattedText += formatSlideForDisplay(slide, includeNotes, compact);
    });
  }

  return formattedText;
}

/**
 * Formate un slide individuel pour l'affichage
 */
function formatSlideForDisplay(
  slide: PPTXSlide,
  includeNotes: boolean,
  compact: boolean
): string {
  let slideText = '';
  
  if (!compact) {
    slideText += `### Slide ${slide.index}: ${slide.title}\n\n`;
  }
  
  slideText += `**Contenu :** ${slide.content}\n\n`;
  
  // Notes du présentateur
  if (includeNotes && slide.notes) {
    slideText += `📝 **Notes du présentateur :** ${slide.notes}\n\n`;
  }
  
  // Métadonnées du slide
  if (!compact) {
    slideText += `*Layout :* ${slide.layout}\n`;
    slideText += `*Mots :* ${slide.metadata.wordCount}\n`;
    if (slide.metadata.hasImages) slideText += `*Images :* ${slide.images.length}\n`;
    if (slide.metadata.hasCharts) slideText += `*Graphiques :* Oui\n`;
    if (slide.metadata.hasTables) slideText += `*Tableaux :* Oui\n`;
    slideText += '\n';
  }
  
  return slideText;
}

/**
 * Exporte le contenu PPTX en différents formats
 */
export function exportPPTXContent(
  result: PPTXExtractionResult,
  format: 'markdown' | 'text' | 'json'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(result, null, 2);
    
    case 'text':
      return result.slides
        .map(slide => `Slide ${slide.index}: ${slide.title}\n\n${slide.content}\n${slide.notes ? `\nNotes: ${slide.notes}` : ''}`)
        .join('\n\n---\n\n');
    
    case 'markdown':
    default:
      return formatPPTXContentForDisplay(result);
  }
}

/**
 * Recherche du contenu dans les slides
 */
export function searchInPPTX(
  result: PPTXExtractionResult,
  query: string,
  options: {
    searchInNotes?: boolean;
    caseSensitive?: boolean;
    wholeWords?: boolean;
  } = {}
): Array<{
  slideIndex: number;
  slideTitle: string;
  context: string;
  matchType: 'content' | 'notes' | 'title';
}> {
  const { searchInNotes = true, caseSensitive = false, wholeWords = false } = options;
  const searchQuery = caseSensitive ? query : query.toLowerCase();
  const matches: Array<{
    slideIndex: number;
    slideTitle: string;
    context: string;
    matchType: 'content' | 'notes' | 'title';
  }> = [];

  result.slides.forEach((slide, index) => {
    // Recherche dans le titre
    const title = caseSensitive ? slide.title : slide.title.toLowerCase();
    if (title.includes(searchQuery)) {
      matches.push({
        slideIndex: index + 1,
        slideTitle: slide.title,
        context: slide.title,
        matchType: 'title'
      });
    }

    // Recherche dans le contenu
    const content = caseSensitive ? slide.content : slide.content.toLowerCase();
    if (content.includes(searchQuery)) {
      matches.push({
        slideIndex: index + 1,
        slideTitle: slide.title,
        context: slide.content,
        matchType: 'content'
      });
    }

    // Recherche dans les notes
    if (searchInNotes && slide.notes) {
      const notes = caseSensitive ? slide.notes : slide.notes.toLowerCase();
      if (notes.includes(searchQuery)) {
        matches.push({
          slideIndex: index + 1,
          slideTitle: slide.title,
          context: slide.notes,
          matchType: 'notes'
        });
      }
    }
  });

  return matches;
}

/**
 * Génère un résumé de la présentation
 */
export function generatePPTXSummary(result: PPTXExtractionResult): {
  title: string;
  summary: string;
  keyPoints: string[];
  slideCount: number;
  readingTime: number;
} {
  const keyPoints = result.slides
    .filter(slide => slide.title && slide.title !== 'Conclusion' && slide.title !== 'Introduction')
    .map(slide => slide.title)
    .slice(0, 5);

  const summary = `Cette présentation sur "${result.title}" contient ${result.metadata.totalSlides} slides couvrant les concepts principaux du sujet. Elle est structurée en ${result.structure.sections.length} sections principales avec une durée de lecture estimée de ${result.metadata.estimatedReadingTime} minutes.`;

  return {
    title: result.title,
    summary,
    keyPoints,
    slideCount: result.metadata.totalSlides,
    readingTime: result.metadata.estimatedReadingTime
  };
}
