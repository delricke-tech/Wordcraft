/**
 * Service d'extraction de texte depuis les fichiers DOCX
 * Utilise Mammoth.js pour extraire le texte avec préservation du formatage
 * 
 * Date: 10 mars 2026
 */

import mammoth from 'mammoth';

export interface DOCXExtractionResult {
  text: string;
  html?: string;
  metadata: {
    title?: string;
    author?: string;
    created?: string;
    modified?: string;
    pageCount?: number;
    wordCount?: number;
    paragraphCount?: number;
  };
  images: Array<{
    id: string;
    alt?: string;
    type: string;
    size: number;
  }>;
  formatting: {
    headings: Array<{
      level: number;
      text: string;
      position: number;
    }>;
    lists: Array<{
      type: 'ordered' | 'unordered';
      items: string[];
      position: number;
    }>;
    tables: Array<{
      rows: number;
      columns: number;
      position: number;
    }>;
  };
}

/**
 * Extrait le texte et les métadonnées d'un fichier DOCX
 */
export async function extractDOCXFromStorage(
  storagePath: string,
  options: {
    includeImages?: boolean;
    includeFormatting?: boolean;
    preserveWhitespace?: boolean;
  } = {}
): Promise<DOCXExtractionResult> {
  try {
    console.log('📄 Extraction DOCX depuis Supabase Storage...');
    console.log('  - Storage Path:', storagePath);

    // Importer Supabase dynamiquement pour éviter les erreurs de import
    const { supabase } = await import('../lib/supabase');

    // Télécharger le fichier depuis Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(storagePath);

    if (downloadError) {
      console.error('❌ Erreur téléchargement DOCX:', downloadError);
      throw new Error(`Échec du téléchargement: ${downloadError.message}`);
    }

    if (!fileData) {
      throw new Error('Fichier DOCX introuvable dans le storage');
    }

    console.log('✅ Fichier DOCX téléchargé, début extraction...');

    // Extraire le contenu avec Mammoth
    const result = await mammoth.extractRawText({ arrayBuffer: fileData });
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer: fileData });

    // Nettoyer et structurer le texte
    const cleanText = cleanAndStructureText(result.value, options);
    
    // Extraire les métadonnées
    const metadata = extractMetadata(fileData, cleanText);
    
    // Analyser le formatage
    const formatting = options.includeFormatting ? 
      analyzeFormatting(htmlResult.value) : 
      { headings: [], lists: [], tables: [] };

    // Extraire les images si demandé
    const images = options.includeImages ? 
      await extractImages(fileData) : 
      [];

    const extractionResult: DOCXExtractionResult = {
      text: cleanText,
      html: htmlResult.value,
      metadata,
      images,
      formatting
    };

    console.log('✅ Extraction DOCX terminée:');
    console.log('  - Longueur du texte:', cleanText.length, 'caractères');
    console.log('  - Mots:', metadata.wordCount);
    console.log('  - Paragraphes:', metadata.paragraphCount);
    console.log('  - Titres:', formatting.headings.length);
    console.log('  - Listes:', formatting.lists.length);
    console.log('  - Tableaux:', formatting.tables.length);
    console.log('  - Images:', images.length);

    return extractionResult;

  } catch (error) {
    console.error('💥 Erreur extraction DOCX:', error);
    throw new Error(`Échec de l'extraction DOCX: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Nettoie et structure le texte extrait
 */
function cleanAndStructureText(
  text: string, 
  options: { preserveWhitespace?: boolean }
): string {
  const { preserveWhitespace = false } = options;

  let cleanText = text;

  if (!preserveWhitespace) {
    // Nettoyer les espaces multiples
    cleanText = cleanText.replace(/\s+/g, ' ');
    
    // Nettoyer les sauts de ligne multiples
    cleanText = cleanText.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Supprimer les espaces en début/fin de ligne
    cleanText = cleanText.split('\n').map(line => line.trim()).join('\n');
  }

  // S'assurer qu'il y a des sauts de ligne logiques
  cleanText = cleanText
    .replace(/([.!?])\s*([A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ])/g, '$1\n\n$2')
    .replace(/([:;])\s*([A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ])/g, '$1\n$2');

  return cleanText.trim();
}

/**
 * Extrait les métadonnées du document
 */
function extractMetadata(fileData: ArrayBuffer, text: string): DOCXExtractionResult['metadata'] {
  // Compter les mots et paragraphes
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // Essayer d'extraire le titre (première ligne ou premier gros titre)
  const lines = text.split('\n');
  const potentialTitle = lines.find(line => 
    line.trim().length > 10 && line.trim().length < 100
  ) || lines[0] || '';

  return {
    title: potentialTitle.trim() || undefined,
    wordCount: words.length,
    paragraphCount: paragraphs.length,
    pageCount: Math.ceil(paragraphs.length / 3), // Estimation grossière
  };
}

/**
 * Analyse le formatage du document (titres, listes, tableaux)
 */
function analyzeFormatting(html: string): DOCXExtractionResult['formatting'] {
  const formatting: DOCXExtractionResult['formatting'] = {
    headings: [],
    lists: [],
    tables: []
  };

  // Créer un DOM temporaire pour parser le HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extraire les titres
  const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headingElements.forEach((element, index) => {
    const level = parseInt(element.tagName.charAt(1));
    const text = element.textContent?.trim();
    if (text) {
      formatting.headings.push({
        level,
        text,
        position: index
      });
    }
  });

  // Extraire les listes
  const listElements = doc.querySelectorAll('ul, ol');
  listElements.forEach((element, index) => {
    const items = Array.from(element.querySelectorAll('li')).map(li => 
      li.textContent?.trim() || ''
    ).filter(text => text.length > 0);

    if (items.length > 0) {
      formatting.lists.push({
        type: element.tagName.toLowerCase() === 'ol' ? 'ordered' : 'unordered',
        items,
        position: index
      });
    }
  });

  // Extraire les tableaux
  const tableElements = doc.querySelectorAll('table');
  tableElements.forEach((element, index) => {
    const rows = element.querySelectorAll('tr').length;
    const columns = element.querySelector('tr')?.querySelectorAll('td, th').length || 0;
    
    if (rows > 0 && columns > 0) {
      formatting.tables.push({
        rows,
        columns,
        position: index
      });
    }
  });

  return formatting;
}

/**
 * Extrait les images du document DOCX
 */
async function extractImages(fileData: ArrayBuffer): Promise<DOCXExtractionResult['images']> {
  const images: DOCXExtractionResult['images'] = [];

  try {
    // Mammoth peut extraire les images avec des options supplémentaires
    const result = await mammoth.convertToHtml({
      arrayBuffer: fileData,
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          const imageInfo = {
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            alt: image.alt || '',
            type: image.contentType.split('/')[1] || 'unknown',
            size: imageBuffer.length
          };
          
          images.push(imageInfo);
          
          return {
            src: `data:${image.contentType};base64,${imageBuffer}`
          };
        });
      })
    });

    console.log(`📷 ${images.length} image(s) extraite(s) du DOCX`);
  } catch (error) {
    console.warn('⚠️ Erreur extraction images:', error);
  }

  return images;
}

/**
 * Extrait le texte depuis un fichier DOCX uploadé directement
 */
export async function extractDOCXFromFile(file: File): Promise<DOCXExtractionResult> {
  try {
    console.log('📄 Extraction DOCX depuis fichier uploadé...');
    
    const arrayBuffer = await file.arrayBuffer();
    
    // Utiliser la même logique que pour le storage
    const result = await mammoth.extractRawText({ arrayBuffer });
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });

    const cleanText = cleanAndStructureText(result.value, {});
    const metadata = extractMetadata(arrayBuffer, cleanText);
    const formatting = analyzeFormatting(htmlResult.value);
    const images = await extractImages(arrayBuffer);

    return {
      text: cleanText,
      html: htmlResult.value,
      metadata,
      images,
      formatting
    };

  } catch (error) {
    console.error('💥 Erreur extraction DOCX fichier:', error);
    throw new Error(`Échec de l'extraction DOCX: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Valide si un fichier est un DOCX valide
 */
export function validateDOCXFile(file: File): { isValid: boolean; error?: string } {
  // Vérifier l'extension
  if (!file.name.toLowerCase().endsWith('.docx')) {
    return {
      isValid: false,
      error: 'Le fichier doit avoir l\'extension .docx'
    };
  }

  // Vérifier le type MIME
  if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // Certains navigateurs peuvent ne pas détecter correctement le type
    console.warn('⚠️ Type MIME DOCX non détecté, vérification par extension uniquement');
  }

  // Vérifier la taille (max 25MB)
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Le fichier DOCX est trop volumineux (max 25MB)'
    };
  }

  return { isValid: true };
}

/**
 * Formate le texte extrait pour l'affichage
 */
export function formatDOCXTextForDisplay(
  extractionResult: DOCXExtractionResult,
  options: {
    includeHeadings?: boolean;
    includeLists?: boolean;
    includeMetadata?: boolean;
  } = {}
): string {
  const {
    includeHeadings = true,
    includeLists = true,
    includeMetadata = true
  } = options;

  let formattedText = '';

  // Ajouter les métadonnées
  if (includeMetadata && extractionResult.metadata) {
    const meta = extractionResult.metadata;
    formattedText += '📄 **Informations du document**\n\n';
    if (meta.title) formattedText += `**Titre :** ${meta.title}\n`;
    if (meta.wordCount) formattedText += `**Mots :** ${meta.wordCount}\n`;
    if (meta.paragraphCount) formattedText += `**Paragraphes :** ${meta.paragraphCount}\n`;
    if (meta.pageCount) formattedText += `**Pages estimées :** ${meta.pageCount}\n`;
    formattedText += '\n---\n\n';
  }

  // Ajouter les titres
  if (includeHeadings && extractionResult.formatting.headings.length > 0) {
    formattedText += '📑 **Structure du document**\n\n';
    extractionResult.formatting.headings.forEach(heading => {
      const prefix = '#'.repeat(heading.level);
      formattedText += `${prefix} ${heading.text}\n\n`;
    });
    formattedText += '---\n\n';
  }

  // Ajouter le texte principal
  formattedText += extractionResult.text;

  // Ajouter les listes si présentes
  if (includeLists && extractionResult.formatting.lists.length > 0) {
    formattedText += '\n\n📋 **Listes trouvées**\n\n';
    extractionResult.formatting.lists.forEach((list, index) => {
      formattedText += `**Liste ${index + 1}** (${list.type === 'ordered' ? 'numérotée' : 'à puces'}) :\n`;
      list.items.forEach(item => {
        const prefix = list.type === 'ordered' ? '1.' : '•';
        formattedText += `${prefix} ${item}\n`;
      });
      formattedText += '\n';
    });
  }

  return formattedText;
}
