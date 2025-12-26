// Service d'extraction de texte depuis PDF
// Utilise pdfjs-dist pour extraire le contenu texte des fichiers PDF

import * as pdfjsLib from 'pdfjs-dist';

// Configuration du worker PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Extrait le texte complet d'un fichier PDF depuis une URL
 * @param pdfUrl - URL du fichier PDF
 * @returns Texte extrait du PDF
 */
export async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    console.log('📄 Chargement du PDF depuis:', pdfUrl);

    // Charger le document PDF
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    console.log(`📄 PDF chargé avec succès. Nombre de pages: ${pdf.numPages}`);

    let fullText = '';

    // Extraire le texte de chaque page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combiner tous les éléments de texte
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += pageText + '\n\n';
      console.log(`✅ Page ${pageNum}/${pdf.numPages} extraite`);
    }

    console.log(`✅ Extraction terminée. Longueur du texte: ${fullText.length} caractères`);
    return fullText.trim();
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction du PDF:', error);
    throw new Error(`Impossible d'extraire le texte du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Extrait un résumé du texte (premiers X caractères)
 * Utile pour les prévisualisations
 * @param text - Texte complet
 * @param maxLength - Longueur maximale du résumé
 * @returns Résumé du texte
 */
export function getTextSummary(text: string, maxLength: number = 500): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * Compte le nombre de mots dans un texte
 * @param text - Texte à analyser
 * @returns Nombre de mots
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Nettoie le texte extrait (supprime les espaces multiples, lignes vides, etc.)
 * @param text - Texte à nettoyer
 * @returns Texte nettoyé
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Remplace les espaces multiples par un seul
    .replace(/\n\s*\n/g, '\n\n') // Nettoie les lignes vides multiples
    .trim();
}
