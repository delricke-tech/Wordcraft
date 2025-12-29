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
 * Télécharge un fichier PDF depuis Supabase Storage en utilisant storage_path
 * 
 * @param storagePath - Le chemin storage nettoyé (sans accents)
 * @returns Blob du fichier PDF
 */
async function downloadPDFFromStorage(storagePath: string): Promise<Blob> {
  console.log('📥 Téléchargement PDF depuis Supabase Storage...');
  console.log('  - Storage path:', storagePath);

  const { data, error } = await supabase.storage
    .from('documents')
    .download(storagePath);

  if (error) {
    console.error('❌ Erreur lors du téléchargement:', error);
    throw new Error(`Impossible de télécharger le PDF: ${error.message}`);
  }

  if (!data) {
    throw new Error('Aucune donnée retournée par Supabase');
  }

  console.log('✅ PDF téléchargé:', data.size, 'bytes');
  return data;
}

/**
 * Extrait le texte d'un PDF en utilisant storage_path
 * 
 * UTILISE storage_path (chemin nettoyé) pour télécharger depuis Supabase Storage
 * 
 * @param storagePath - Le chemin storage nettoyé (depuis la colonne storage_path)
 * @returns Document extrait avec texte et métadonnées
 */
export async function extractPDFFromStorage(
  storagePath: string
): Promise<ExtractedPDFResult> {
  try {
    console.log('📄 ===== EXTRACTION TEXTE PDF =====');
    console.log('  - Storage path:', storagePath);

    // 1. Télécharger le PDF depuis Supabase Storage
    const blob = await downloadPDFFromStorage(storagePath);

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
