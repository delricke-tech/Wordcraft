/**
 * Service unifié d'extraction de documents
 * Support PDF, DOCX, TXT, et autres formats
 * 
 * Date: 10 mars 2026
 */

import { extractPDFFromStorage, type ExtractedPDFResult } from './pdfExtractor';
import { 
  extractDOCXFromStorage, 
  extractDOCXFromFile,
  validateDOCXFile,
  formatDOCXTextForDisplay,
  type DOCXExtractionResult 
} from './docxExtractor';
import { extractTextFromFile, type TextExtractionResult } from './textExtractor';
import { 
  scrapeWebContent, 
  validateScrapableURL,
  formatWebContentForDisplay,
  type WebScrapingResult 
} from './webScraperService';

export type DocumentType = 'pdf' | 'docx' | 'txt' | 'md' | 'rtf' | 'unknown';

export interface UnifiedDocumentResult {
  type: DocumentType;
  text: string;
  metadata: {
    title?: string;
    author?: string;
    created?: string;
    modified?: string;
    pages?: number;
    words: number;
    characters: number;
    paragraphs?: number;
    size?: number;
  };
  structure?: {
    headings?: Array<{ level: number; text: string; position: number }>;
    lists?: Array<{ type: 'ordered' | 'unordered'; items: string[]; position: number }>;
    tables?: Array<{ rows: number; columns: number; position: number }>;
    images?: Array<{ id: string; alt?: string; type: string; size: number }>;
  };
  rawResults?: {
    pdf?: ExtractedPDFResult;
    docx?: DOCXExtractionResult;
    text?: TextExtractionResult;
  };
}

/**
 * Détecte le type de document à partir du nom de fichier
 */
export function detectDocumentType(fileName: string): DocumentType {
  const extension = fileName.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'pdf': return 'pdf';
    case 'docx': return 'docx';
    case 'txt': return 'txt';
    case 'md': 
    case 'markdown': return 'md';
    case 'rtf': return 'rtf';
    default: return 'unknown';
  }
}

/**
 * Extrait le contenu d'un document depuis Supabase Storage
 */
export async function extractDocumentFromStorage(
  storagePath: string,
  fileName: string,
  options: {
    includeImages?: boolean;
    includeFormatting?: boolean;
    preserveWhitespace?: boolean;
  } = {}
): Promise<UnifiedDocumentResult> {
  const documentType = detectDocumentType(fileName);
  
  console.log(`📄 Extraction document ${documentType.toUpperCase()}: ${fileName}`);
  console.log('  - Storage Path:', storagePath);

  try {
    switch (documentType) {
      case 'pdf':
        return await extractPDFDocument(storagePath, options);
      
      case 'docx':
        return await extractDOCXDocument(storagePath, options);
      
      case 'txt':
      case 'md':
      case 'rtf':
        return await extractTextDocument(storagePath, documentType, options);
      
      default:
        throw new Error(`Type de document non supporté: ${documentType}`);
    }
  } catch (error) {
    console.error(`💥 Erreur extraction ${documentType}:`, error);
    throw new Error(`Échec de l'extraction ${documentType}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Extrait le contenu d'un fichier uploadé directement
 */
export async function extractDocumentFromFile(
  file: File,
  options: {
    includeImages?: boolean;
    includeFormatting?: boolean;
    preserveWhitespace?: boolean;
  } = {}
): Promise<UnifiedDocumentResult> {
  const documentType = detectDocumentType(file.name);
  
  console.log(`📄 Extraction fichier ${documentType.toUpperCase()}: ${file.name}`);

  try {
    switch (documentType) {
      case 'pdf':
        // Pour PDF uploadés, on utilise une méthode différente
        return await extractPDFFile(file, options);
      
      case 'docx':
        return await extractDOCXFile(file, options);
      
      case 'txt':
      case 'md':
      case 'rtf':
        return await extractTextFile(file, documentType, options);
      
      default:
        throw new Error(`Type de fichier non supporté: ${documentType}`);
    }
  } catch (error) {
    console.error(`💥 Erreur extraction ${documentType}:`, error);
    throw new Error(`Échec de l'extraction ${documentType}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Extrait un document PDF depuis le storage
 */
async function extractPDFDocument(
  storagePath: string,
  options: any
): Promise<UnifiedDocumentResult> {
  const pdfResult = await extractPDFFromStorage(storagePath);
  
  return {
    type: 'pdf',
    text: pdfResult.cleanText,
    metadata: {
      pages: pdfResult.metadata.pages,
      words: pdfResult.metadata.words,
      characters: pdfResult.metadata.characters,
      extractedAt: pdfResult.metadata.extractedAt
    },
    rawResults: { pdf: pdfResult }
  };
}

/**
 * Extrait un document DOCX depuis le storage
 */
async function extractDOCXDocument(
  storagePath: string,
  options: any
): Promise<UnifiedDocumentResult> {
  const docxResult = await extractDOCXFromStorage(storagePath, options);
  
  return {
    type: 'docx',
    text: docxResult.text,
    metadata: {
      title: docxResult.metadata.title,
      pages: docxResult.metadata.pageCount,
      words: docxResult.metadata.wordCount,
      paragraphs: docxResult.metadata.paragraphCount,
      characters: docxResult.text.length
    },
    structure: {
      headings: docxResult.formatting.headings,
      lists: docxResult.formatting.lists,
      tables: docxResult.formatting.tables,
      images: docxResult.images
    },
    rawResults: { docx: docxResult }
  };
}

/**
 * Extrait un document texte depuis le storage
 */
async function extractTextDocument(
  storagePath: string,
  documentType: 'txt' | 'md' | 'rtf',
  options: any
): Promise<UnifiedDocumentResult> {
  // Importer dynamiquement pour éviter les erreurs
  const { supabase } = await import('../lib/supabase');
  
  const { data: fileData, error } = await supabase.storage
    .from('documents')
    .download(storagePath);

  if (error || !fileData) {
    throw new Error(`Échec du téléchargement: ${error?.message || 'Fichier introuvable'}`);
  }

  const text = await fileData.text();
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

  return {
    type: documentType,
    text,
    metadata: {
      words,
      characters: text.length,
      paragraphs
    }
  };
}

/**
 * Extrait un PDF depuis un fichier uploadé
 */
async function extractPDFFile(file: File, options: any): Promise<UnifiedDocumentResult> {
  // Implémentation simplifiée pour PDF uploadés
  const arrayBuffer = await file.arrayBuffer();
  
  // Utiliser pdfjs-dist directement
  const pdfjsLib = await import('pdfjs-dist');
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }

  const words = fullText.split(/\s+/).filter(w => w.length > 0).length;

  return {
    type: 'pdf',
    text: fullText.trim(),
    metadata: {
      pages: pdf.numPages,
      words,
      characters: fullText.length
    }
  };
}

/**
 * Extrait un DOCX depuis un fichier uploadé
 */
async function extractDOCXFile(file: File, options: any): Promise<UnifiedDocumentResult> {
  const docxResult = await extractDOCXFromFile(file);
  
  return {
    type: 'docx',
    text: docxResult.text,
    metadata: {
      title: docxResult.metadata.title,
      pages: docxResult.metadata.pageCount,
      words: docxResult.metadata.wordCount,
      paragraphs: docxResult.metadata.paragraphCount,
      characters: docxResult.text.length,
      size: file.size
    },
    structure: {
      headings: docxResult.formatting.headings,
      lists: docxResult.formatting.lists,
      tables: docxResult.formatting.tables,
      images: docxResult.images
    },
    rawResults: { docx: docxResult }
  };
}

/**
 * Extrait un fichier texte uploadé
 */
async function extractTextFile(
  file: File,
  documentType: 'txt' | 'md' | 'rtf',
  options: any
): Promise<UnifiedDocumentResult> {
  const text = await file.text();
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

  return {
    type: documentType,
    text,
    metadata: {
      words,
      characters: text.length,
      paragraphs,
      size: file.size
    }
  };
}

/**
 * Valide un fichier avant extraction
 */
export function validateDocumentFile(file: File): { isValid: boolean; error?: string } {
  const documentType = detectDocumentType(file.name);
  
  // Vérifier la taille maximale (25MB)
  const maxSize = 25 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Le fichier est trop volumineux (max 25MB)'
    };
  }

  // Validation spécifique par type
  switch (documentType) {
    case 'docx':
      return validateDOCXFile(file);
    
    case 'pdf':
      if (file.type !== 'application/pdf') {
        return {
          isValid: false,
          error: 'Le fichier doit être un PDF valide'
        };
      }
      break;
    
    case 'txt':
    case 'md':
      if (file.type && !file.type.startsWith('text/')) {
        console.warn('⚠️ Type MIME texte non détecté, vérification par extension');
      }
      break;
    
    case 'unknown':
      return {
        isValid: false,
        error: 'Type de fichier non supporté. Formats supportés: PDF, DOCX, TXT, MD'
      };
  }

  return { isValid: true };
}

/**
 * Formate le texte extrait pour l'affichage
 */
export function formatDocumentTextForDisplay(
  result: UnifiedDocumentResult,
  options: {
    includeMetadata?: boolean;
    includeStructure?: boolean;
    compact?: boolean;
  } = {}
): string {
  const {
    includeMetadata = true,
    includeStructure = true,
    compact = false
  } = options;

  let formattedText = '';

  // Métadonnées
  if (includeMetadata && result.metadata) {
    formattedText += '📄 **Informations du document**\n\n';
    
    if (result.metadata.title) {
      formattedText += `**Titre :** ${result.metadata.title}\n`;
    }
    
    formattedText += `**Type :** ${result.type.toUpperCase()}\n`;
    formattedText += `**Mots :** ${result.metadata.words}\n`;
    formattedText += `**Caractères :** ${result.metadata.characters}\n`;
    
    if (result.metadata.pages) {
      formattedText += `**Pages :** ${result.metadata.pages}\n`;
    }
    
    if (result.metadata.paragraphs) {
      formattedText += `**Paragraphes :** ${result.metadata.paragraphs}\n`;
    }
    
    formattedText += '\n---\n\n';
  }

  // Structure (titres, listes, etc.)
  if (includeStructure && result.structure) {
    if (result.structure.headings && result.structure.headings.length > 0) {
      formattedText += '📑 **Structure du document**\n\n';
      result.structure.headings.forEach(heading => {
        const prefix = '#'.repeat(heading.level);
        formattedText += `${prefix} ${heading.text}\n\n`;
      });
      formattedText += '---\n\n';
    }
  }

  // Texte principal
  if (compact) {
    // Version compacte : premiers paragraphes seulement
    const paragraphs = result.text.split('\n\n');
    const maxParagraphs = 5;
    formattedText += paragraphs.slice(0, maxParagraphs).join('\n\n');
    
    if (paragraphs.length > maxParagraphs) {
      formattedText += `\n\n... *(${paragraphs.length - maxParagraphs} paragraphes supplémentaires)*`;
    }
  } else {
    formattedText += result.text;
  }

  return formattedText;
}

/**
 * Obtient les statistiques d'extraction pour monitoring
 */
export function getExtractionStats(result: UnifiedDocumentResult): {
  extractionTime: number;
  efficiency: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
} {
  // Calculs basiques pour l'instant
  const wordsPerChar = result.metadata.words / result.metadata.characters;
  let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
  
  if (wordsPerChar < 0.1) quality = 'poor';
  else if (wordsPerChar < 0.15) quality = 'fair';
  else if (wordsPerChar < 0.2) quality = 'good';

  return {
    extractionTime: 0, // À implémenter avec chronomètre
    efficiency: Math.min(wordsPerChar * 5, 1), // Normalisé 0-1
    quality
  };
}
