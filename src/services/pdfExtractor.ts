/**
 * Service d'extraction de texte PDF utilisant storage_path
 * 
 * RÈGLE PROJET : Utiliser TOUJOURS storage_path (chemin nettoyé) pour accéder
 * aux fichiers dans Supabase Storage, jamais le nom avec accents.
 * 
 * Date: 29 décembre 2024
 */

import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../lib/supabase';

// Configuration du worker PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface ExtractedPDFResult {
  text: string;
  rawText: string;
  cleanText: string;
  metadata: {
    pages: number;
    words: number;
    characters: number;
    extractedAt: string;
  };
  pages: Array<{
    pageNumber: number;
    text: string;
  }>;
}

/**
 * Télécharge un fichier PDF depuis Supabase Storage PUBLIC en utilisant storage_path
 * 
 * ✅ BUCKET PUBLIC : Utilise getPublicUrl au lieu de download pour un accès direct
 * 
 * @param storagePath - Le chemin storage nettoyé (sans accents) depuis la colonne storage_path
 * @returns Blob du fichier PDF
 */
async function downloadPDFFromStorage(storagePath: string): Promise<Blob> {
  console.log('📥 ===== TÉLÉCHARGEMENT PDF =====');
  console.log('  - Storage path (brut):', storagePath);
  console.log('  - Bucket: documents (PUBLIC)');

  // ✅ RÈGLE 1 : Utiliser getPublicUrl avec la valeur BRUTE de storage_path
  // Ne jamais modifier la clé, juste l'encoder dans l'URL si nécessaire
  const { data: publicUrlData } = supabase.storage
    .from('documents')
    .getPublicUrl(storagePath); // Passer la valeur brute, Supabase encode automatiquement

  if (!publicUrlData?.publicUrl) {
    throw new Error('Impossible de générer l\'URL publique du PDF');
  }

  console.log('  - URL publique générée:', publicUrlData.publicUrl);

  // ✅ RÈGLE 2 : Télécharger via l'URL publique (déjà encodée par Supabase)
  try {
    const response = await fetch(publicUrlData.publicUrl);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('✅ PDF téléchargé:', blob.size, 'bytes');
    console.log('===== FIN TÉLÉCHARGEMENT =====');
    
    return blob;
  } catch (error: any) {
    console.error('❌ Erreur lors du téléchargement:', error);
    throw new Error(`Impossible de télécharger le PDF: ${error.message}`);
  }
}

/**
 * Extrait le texte d'un PDF en utilisant storage_path
 * 
 * ✅ UTILISE storage_path (chemin nettoyé) pour télécharger depuis Supabase Storage PUBLIC
 * ✅ SAUVEGARDE automatiquement dans extracted_text (content_text)
 * 
 * @param storagePath - Le chemin storage nettoyé (depuis la colonne storage_path)
 * @param documentId - ID du document (optionnel, pour sauvegarde en BDD)
 * @returns Document extrait avec texte et métadonnées
 */
export async function extractPDFFromStorage(
  storagePath: string | File,
  documentId?: string
): Promise<ExtractedPDFResult> {
  try {
    console.log('📄 ===== EXTRACTION TEXTE PDF =====');
    
    let blob: Blob;

    // Gérer le cas où on passe un File object directement (upload depuis chat)
    if (storagePath instanceof File) {
      console.log('  - Source: File object (upload direct)');
      blob = storagePath;
    } else {
      // Cas normal : télécharger depuis Supabase Storage
      console.log('  - Source: Supabase Storage');
      console.log('  - Storage path:', storagePath);
      console.log('  - Document ID:', documentId || 'Non fourni');
      blob = await downloadPDFFromStorage(storagePath);
    }

    // 2. Convertir le Blob en ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();
    
    // 3. Charger le document PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    console.log(`📖 PDF chargé avec succès. Pages: ${pdf.numPages}`);

    const pages: Array<{ pageNumber: number; text: string }> = [];
    let rawText = '';

    // 4. Extraire le texte de chaque page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Extraire et formater le texte
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ') // Nettoyer les espaces multiples
        .trim();

      pages.push({
        pageNumber: pageNum,
        text: pageText
      });

      rawText += pageText + '\n\n';
      console.log(`✅ Page ${pageNum}/${pdf.numPages} extraite (${pageText.length} caractères)`);
    }

    // 5. Nettoyer et optimiser le texte pour l'IA
    const cleanText = cleanTextForAI(rawText);

    // 6. Compter les mots
    const wordCount = countWords(cleanText);

    const result: ExtractedPDFResult = {
      text: rawText,
      rawText: rawText,
      cleanText: cleanText,
      metadata: {
        pages: pdf.numPages,
        words: wordCount,
        characters: cleanText.length,
        extractedAt: new Date().toISOString()
      },
      pages: pages
    };

    console.log('✅ Extraction complète:', {
      pages: result.metadata.pages,
      words: result.metadata.words,
      characters: result.metadata.characters
    });

    // ✅ RÈGLE 3 : FORCE UPDATE - Sauvegarder immédiatement dans extracted_text (content_text)
    if (documentId && typeof storagePath === 'string') {
      console.log('💾 Sauvegarde du texte extrait en BDD...');
      console.log('  - Document ID:', documentId);
      console.log('  - Colonne: extracted_text (content_text)');
      console.log('  - Texte: ', cleanText.length, 'caractères');

      try {
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            extracted_text: cleanText, // Alias: content_text
            page_count: result.metadata.pages,
            processing_status: 'completed'
          })
          .eq('id', documentId);

        if (updateError) {
          console.error('⚠️ Erreur lors de la sauvegarde en BDD:', updateError);
        } else {
          console.log('✅ Texte sauvegardé en BDD avec succès !');
          console.log('   → L\'IA n\'aura plus besoin de relire le PDF à l\'avenir');
        }
      } catch (saveError: any) {
        console.error('⚠️ Erreur inattendue lors de la sauvegarde:', saveError);
      }
    }

    console.log('===== FIN EXTRACTION =====');

    return result;
  } catch (error: any) {
    console.error('💥 Erreur lors de l\'extraction du texte:', error);
    throw new Error(`Échec de l'extraction du texte: ${error.message}`);
  }
}

/**
 * Nettoie et optimise le texte pour être utilisé par l'IA
 */
function cleanTextForAI(text: string): string {
  let cleaned = text;

  // 1. Normaliser les espaces
  cleaned = cleaned
    .replace(/\s+/g, ' ') // Espaces multiples → un seul espace
    .replace(/\n{3,}/g, '\n\n') // Lignes vides multiples → deux lignes
    .trim();

  // 2. Nettoyer les caractères spéciaux problématiques
  cleaned = cleaned
    .replace(/['']/g, "'") // Normaliser les apostrophes
    .replace(/[""]/g, '"') // Normaliser les guillemets
    .replace(/…/g, '...') // Normaliser les ellipses
    .replace(/—/g, '-'); // Normaliser les tirets longs

  // 3. Supprimer les numéros de page isolés
  cleaned = cleaned.replace(/^\d+\s*$/gm, '');

  // 4. Restructurer les paragraphes
  cleaned = cleaned
    .split('\n')
    .filter(line => line.trim().length > 0) // Supprimer les lignes vides
    .join('\n\n'); // Réinsérer des paragraphes propres

  return cleaned.trim();
}

/**
 * Compte le nombre de mots dans un texte
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Tronque le texte pour respecter une limite de tokens
 */
export function truncateForAI(text: string, maxTokens: number = 2000): string {
  const maxChars = maxTokens * 4; // Approximation: 1 token ≈ 4 caractères
  
  if (text.length <= maxChars) {
    return text;
  }

  // Tronquer en gardant des phrases complètes
  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  
  if (lastPeriod > maxChars * 0.8) {
    return truncated.substring(0, lastPeriod + 1);
  }

  return truncated + '...';
}
