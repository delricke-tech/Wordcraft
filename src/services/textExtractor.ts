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
 * Extrait le texte d'un fichier DOCX avec mammoth
 */
async function extractTextFromDOCX(storagePath: string | File): Promise<string> {
  console.log('📄 Extraction depuis fichier DOCX...');
  
  try {
    // Importer dynamiquement mammoth
    const mammoth = await import('mammoth');
    
    let arrayBuffer: ArrayBuffer;

    if (storagePath instanceof File) {
      arrayBuffer = await storagePath.arrayBuffer();
    } else {
      // Télécharger depuis Supabase Storage
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(storagePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Impossible de générer l\'URL publique du fichier DOCX');
      }

      const response = await fetch(publicUrlData.publicUrl);
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      arrayBuffer = await response.arrayBuffer();
    }

    // Extraire le texte avec mammoth
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    console.log('✅ Texte DOCX extrait:', result.value.length, 'caractères');
    
    if (result.messages.length > 0) {
      console.log('ℹ️  Messages mammoth:', result.messages);
    }
    
    return result.value.trim();
  } catch (error: any) {
    console.error('❌ Erreur extraction DOCX:', error);
    
    // Fallback si mammoth n'est pas installé ou échoue
    if (error.message?.includes('Cannot find module')) {
      console.warn('⚠️ Module mammoth non installé');
      return `[Document Word]\n\nPour activer l'extraction automatique des fichiers DOCX, exécutez :\n\nnpm install mammoth\n\nEn attendant, vous pouvez convertir votre document en PDF ou TXT.`;
    }
    
    throw error;
  }
}

/**
 * Extrait le texte d'une image via OCR avec Tesseract.js
 */
async function extractTextFromImage(storagePath: string | File): Promise<string> {
  console.log('🖼️  Extraction depuis image (OCR)...');
  
  try {
    // Importer dynamiquement Tesseract.js
    const Tesseract = await import('tesseract.js');
    
    let imageSource: string | File;

    if (storagePath instanceof File) {
      imageSource = storagePath;
    } else {
      // Utiliser l'URL publique directement
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(storagePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Impossible de générer l\'URL publique de l\'image');
      }

      imageSource = publicUrlData.publicUrl;
    }

    console.log('🔍 Lancement de l\'OCR (peut prendre 10-30 secondes)...');
    
    // Effectuer l'OCR avec Tesseract
    // Support multilingue : français + anglais
    const { data } = await Tesseract.recognize(
      imageSource,
      'fra+eng', // Français et anglais
      {
        logger: (m: any) => {
          // Logger la progression
          if (m.status === 'recognizing text') {
            console.log(`OCR en cours: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    const extractedText = data.text.trim();
    
    console.log('✅ OCR terminé:', extractedText.length, 'caractères extraits');
    console.log('  - Confiance:', Math.round(data.confidence) + '%');
    
    if (extractedText.length === 0) {
      return `[Image]\n\nAucun texte détecté dans cette image.\n\nSi l'image contient du texte :\n- Assurez-vous que le texte est lisible\n- Essayez avec une image de meilleure qualité\n- Le texte doit être en français ou anglais`;
    }
    
    return `[Texte extrait par OCR - Confiance: ${Math.round(data.confidence)}%]\n\n${extractedText}`;
  } catch (error: any) {
    console.error('❌ Erreur extraction OCR:', error);
    
    // Fallback si Tesseract n'est pas installé ou échoue
    if (error.message?.includes('Cannot find module')) {
      console.warn('⚠️ Module tesseract.js non installé');
      return `[Image]\n\nPour activer l'extraction automatique du texte des images (OCR), exécutez :\n\nnpm install tesseract.js\n\nEn attendant, vous pouvez retaper le texte manuellement.`;
    }
    
    throw error;
  }
}

/**
 * Compte le nombre de mots dans un texte
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
