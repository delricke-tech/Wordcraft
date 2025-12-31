/**
 * Service d'extraction de texte universel
 * Support pour PDF, DOCX, TXT, et images (OCR)
 * 
 * Date: 31 décembre 2024
 */

import { extractPDFFromStorage } from './pdfExtractor';
import { supabase } from '../lib/supabase';

export interface ExtractedTextResult {
  text: string;
  wordCount: number;
  characterCount: number;
}

/**
 * Extrait le texte d'un fichier selon son type
 * 
 * @param storagePath - Chemin du fichier dans Supabase Storage
 * @param fileType - Type de fichier (pdf, docx, txt, image)
 * @param documentId - ID du document (optionnel, pour sauvegarde en BDD)
 * @returns Texte extrait avec métadonnées
 */
export async function extractText(
  storagePath: string | File,
  fileType: string,
  documentId?: string
): Promise<ExtractedTextResult> {
  console.log('📄 ===== EXTRACTION DE TEXTE UNIVERSELLE =====');
  console.log('  - Type de fichier:', fileType);
  console.log('  - Storage path:', storagePath instanceof File ? 'File object' : storagePath);

  try {
    let extractedText = '';

    switch (fileType) {
      case 'pdf':
        // Utiliser le service PDF existant
        const pdfResult = await extractPDFFromStorage(storagePath, documentId);
        extractedText = pdfResult.cleanText;
        break;

      case 'txt':
        // Extraire le texte d'un fichier TXT
        extractedText = await extractTextFromTXT(storagePath);
        break;

      case 'docx':
        // Extraire le texte d'un fichier DOCX (nécessite une bibliothèque)
        extractedText = await extractTextFromDOCX(storagePath);
        break;

      case 'image':
        // Extraire le texte d'une image via OCR (optionnel, nécessite Tesseract.js)
        extractedText = await extractTextFromImage(storagePath);
        break;

      default:
        throw new Error(`Type de fichier non supporté pour l'extraction: ${fileType}`);
    }

    const wordCount = countWords(extractedText);
    const characterCount = extractedText.length;

    // Sauvegarder en BDD si documentId fourni
    if (documentId && typeof storagePath === 'string') {
      console.log('💾 Sauvegarde du texte extrait en BDD...');
      await supabase
        .from('documents')
        .update({
          extracted_text: extractedText,
          processing_status: 'completed'
        })
        .eq('id', documentId);
      console.log('✅ Texte sauvegardé en BDD');
    }

    console.log('✅ Extraction terminée:', {
      words: wordCount,
      characters: characterCount
    });

    return {
      text: extractedText,
      wordCount,
      characterCount
    };
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'extraction:', error);
    
    // Marquer le document comme échoué si documentId fourni
    if (documentId) {
      await supabase
        .from('documents')
        .update({
          processing_status: 'failed',
          processing_error: error.message
        })
        .eq('id', documentId);
    }
    
    throw error;
  }
}

/**
 * Extrait le texte d'un fichier TXT
 */
async function extractTextFromTXT(storagePath: string | File): Promise<string> {
  console.log('📝 Extraction depuis fichier TXT...');
  
  let blob: Blob;

  if (storagePath instanceof File) {
    blob = storagePath;
  } else {
    // Télécharger depuis Supabase Storage
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Impossible de générer l\'URL publique du fichier TXT');
    }

    const response = await fetch(publicUrlData.publicUrl);
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    blob = await response.blob();
  }

  const text = await blob.text();
  console.log('✅ Texte TXT extrait:', text.length, 'caractères');
  
  return text.trim();
}

/**
 * Extrait le texte d'un fichier DOCX
 * Note: Nécessite l'installation de 'mammoth' ou une alternative
 */
async function extractTextFromDOCX(storagePath: string | File): Promise<string> {
  console.log('📄 Extraction depuis fichier DOCX...');
  
  // Pour l'instant, retourner un placeholder
  // TODO: Installer et utiliser la bibliothèque 'mammoth' ou 'docx-parser'
  console.warn('⚠️ Extraction DOCX pas encore implémentée');
  
  return `[Contenu DOCX]\n\nL'extraction automatique des fichiers DOCX sera bientôt disponible.\n\nEn attendant, vous pouvez :\n1. Convertir votre DOCX en PDF\n2. Ou copier-coller le contenu dans un fichier TXT`;
}

/**
 * Extrait le texte d'une image via OCR
 * Note: Nécessite l'installation de 'tesseract.js'
 */
async function extractTextFromImage(storagePath: string | File): Promise<string> {
  console.log('🖼️  Extraction depuis image (OCR)...');
  
  // Pour l'instant, retourner un placeholder
  // TODO: Installer et utiliser Tesseract.js pour l'OCR
  console.warn('⚠️ Extraction via OCR pas encore implémentée');
  
  return `[Image]\n\nL'extraction automatique du texte des images (OCR) sera bientôt disponible.\n\nEn attendant, pour les documents scannés :\n1. Utilisez un service OCR en ligne\n2. Ou retapez le texte dans un fichier TXT`;
}

/**
 * Compte le nombre de mots dans un texte
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
