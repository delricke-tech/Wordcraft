/**
 * Service pour l'extraction de contenu PowerPoint (PPTX)
 * Utilise pptx2json pour extraire slides, notes et images
 */

// @ts-ignore - Pas de types disponibles pour pptx2json
import PPTX2JSON from 'pptx2json';

export interface PPTXSlide {
  slideNumber: number;
  title: string;
  content: string;
  notes: string;
  images: string[];
  layout: string;
}

export interface PPTXContent {
  fileName: string;
  totalSlides: number;
  slides: PPTXSlide[];
  metadata: {
    title?: string;
    author?: string;
    created?: string;
    modified?: string;
  };
  extractedAt: string;
}

/**
 * Extrait le contenu d'un fichier PPTX
 */
export async function extractPPTXContent(file: File): Promise<PPTXContent> {
  try {
    console.log('📊 Extraction PPTX:', file.name);

    // Convertir le File en Buffer pour pptx2json
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Utiliser pptx2json pour extraire le contenu
    const pptxParser = new PPTX2JSON();
    const result = await pptxParser.toJson(buffer);

    // Transformer les données en notre format
    const slides: PPTXSlide[] = [];
    
    if (result.slides && Array.isArray(result.slides)) {
      result.slides.forEach((slide: any, index: number) => {
        const slideContent: PPTXSlide = {
          slideNumber: index + 1,
          title: extractSlideTitle(slide),
          content: extractSlideContent(slide),
          notes: extractSlideNotes(slide),
          images: extractSlideImages(slide),
          layout: slide.layout || 'standard'
        };
        slides.push(slideContent);
      });
    }

    const pptxContent: PPTXContent = {
      fileName: file.name,
      totalSlides: slides.length,
      slides,
      metadata: {
        title: result.properties?.title || file.name.replace('.pptx', ''),
        author: result.properties?.author || 'Inconnu',
        created: result.properties?.created,
        modified: result.properties?.modified
      },
      extractedAt: new Date().toISOString()
    };

    console.log(`✅ PPTX extrait: ${slides.length} slides`);
    return pptxContent;
  } catch (error: any) {
    console.error('❌ Erreur extraction PPTX:', error);
    throw new Error(`Erreur lors de l'extraction PPTX: ${error?.message || error}`);
  }
}

/**
 * Extrait le titre d'une slide
 */
function extractSlideTitle(slide: any): string {
  if (slide.title) return slide.title;
  if (slide.elements && Array.isArray(slide.elements)) {
    const titleElement = slide.elements.find((el: any) => 
      el.type === 'title' || (el.type === 'text' && el.size && el.size > 20)
    );
    if (titleElement && titleElement.text) return titleElement.text;
  }
  return `Slide ${slide.slideNumber || '?'}`;
}

/**
 * Extrait le contenu textuel d'une slide
 */
function extractSlideContent(slide: any): string {
  let content = '';
  
  if (slide.elements && Array.isArray(slide.elements)) {
    slide.elements.forEach((element: any) => {
      if (element.type === 'text' && element.text) {
        content += element.text + '\n';
      } else if (element.type === 'bullet' && element.text) {
        content += '• ' + element.text + '\n';
      } else if (element.type === 'table' && element.rows) {
        element.rows.forEach((row: any) => {
          if (row.cells) {
            content += row.cells.join(' | ') + '\n';
          }
        });
      }
    });
  }
  
  return content.trim();
}

/**
 * Extrait les notes d'une slide
 */
function extractSlideNotes(slide: any): string {
  if (slide.notes && typeof slide.notes === 'string') {
    return slide.notes.trim();
  } else if (slide.notes && slide.notes.text) {
    return slide.notes.text.trim();
  }
  return '';
}

/**
 * Extrait les images d'une slide (retourne les descriptions)
 */
function extractSlideImages(slide: any): string[] {
  const images: string[] = [];
  
  if (slide.elements && Array.isArray(slide.elements)) {
    slide.elements.forEach((element: any) => {
      if (element.type === 'image') {
        const description = element.alt || element.description || `Image ${images.length + 1}`;
        images.push(description);
      }
    });
  }
  
  return images;
}

/**
 * Formate le contenu PPTX pour le contexte IA
 */
export function formatPPTXContentForAI(pptxContent: PPTXContent): string {
  const { fileName, slides, metadata } = pptxContent;
  
  let formattedContent = `=== PRÉSENTATION POWERPOINT : ${metadata.title || fileName} ===\n`;
  formattedContent += `Fichier: ${fileName}\n`;
  formattedContent += `Auteur: ${metadata.author}\n`;
  formattedContent += `Total des slides: ${slides.length}\n`;
  formattedContent += `Extrait le: ${new Date(pptxContent.extractedAt).toLocaleDateString('fr-FR')}\n\n`;

  slides.forEach((slide) => {
    formattedContent += `--- SLIDE ${slide.slideNumber}: ${slide.title} ---\n`;
    
    if (slide.content) {
      formattedContent += `CONTENU:\n${slide.content}\n`;
    }
    
    if (slide.notes) {
      formattedContent += `NOTES DU PRÉSENTATEUR:\n${slide.notes}\n`;
    }
    
    if (slide.images.length > 0) {
      formattedContent += `IMAGES:\n${slide.images.map(img => `- ${img}`).join('\n')}\n`;
    }
    
    formattedContent += '\n';
  });

  return formattedContent;
}

/**
 * Vérifie si un fichier est un PPTX
 */
export function isPPTXFile(file: File): boolean {
  return file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
         file.name.toLowerCase().endsWith('.pptx');
}

/**
 * Analyse un fichier PPTX et retourne le texte extrait
 */
export async function analyzePPTXFile(file: File): Promise<string> {
  if (!isPPTXFile(file)) {
    throw new Error('Le fichier n\'est pas un fichier PPTX valide');
  }

  const pptxContent = await extractPPTXContent(file);
  return formatPPTXContentForAI(pptxContent);
}
