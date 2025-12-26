// Service avancé d'extraction de texte depuis PDF
// Transforme les documents PDF en texte brut optimisé pour l'IA

import * as pdfjsLib from 'pdfjs-dist';

// Configuration du worker PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface ExtractedDocument {
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
 * Extrait et transforme le texte d'un PDF en format optimisé pour l'IA
 * @param pdfUrl - URL du fichier PDF
 * @param documentId - ID du document dans Supabase
 * @returns Document extrait avec texte brut et métadonnées
 */
export async function extractAndTransformPDF(
  pdfUrl: string,
  documentId?: string
): Promise<ExtractedDocument> {
  try {
    console.log('📄 Démarrage de l\'extraction PDF depuis:', pdfUrl);

    // Charger le document PDF
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    console.log(`📄 PDF chargé avec succès. Pages: ${pdf.numPages}`);

    const pages: Array<{ pageNumber: number; text: string }> = [];
    let rawText = '';

    // Extraire le texte de chaque page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Extraire et formater le texte
      const pageText = textContent.items
        .map((item: any) => {
          // Conserver la structure avec les espaces appropriés
          return item.str;
        })
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

    // Nettoyer et optimiser le texte pour l'IA
    const cleanText = cleanTextForAI(rawText);

    // Compter les mots
    const wordCount = countWords(cleanText);

    const result: ExtractedDocument = {
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

    console.log(`✅ Extraction complète:`, {
      pages: result.metadata.pages,
      words: result.metadata.words,
      characters: result.metadata.characters
    });

    return result;
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction du PDF:', error);
    throw new Error(`Impossible d'extraire le texte du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Nettoie et optimise le texte pour être utilisé par l'IA
 * Supprime les artefacts, normalise les espaces, structure le texte
 * @param text - Texte brut extrait
 * @returns Texte nettoyé et optimisé
 */
export function cleanTextForAI(text: string): string {
  let cleaned = text;

  // 1. Supprimer les en-têtes/pieds de page répétitifs
  cleaned = removeRepetitiveHeaders(cleaned);

  // 2. Normaliser les espaces
  cleaned = cleaned
    .replace(/\s+/g, ' ') // Espaces multiples → un seul espace
    .replace(/\n{3,}/g, '\n\n') // Lignes vides multiples → deux lignes
    .trim();

  // 3. Nettoyer les caractères spéciaux problématiques
  cleaned = cleaned
    .replace(/['']/g, "'") // Normaliser les apostrophes
    .replace(/[""]/g, '"') // Normaliser les guillemets
    .replace(/…/g, '...') // Normaliser les ellipses
    .replace(/—/g, '-'); // Normaliser les tirets longs

  // 4. Supprimer les numéros de page isolés
  cleaned = cleaned.replace(/^\d+\s*$/gm, '');

  // 5. Restructurer les paragraphes
  cleaned = cleaned
    .split('\n')
    .filter(line => line.trim().length > 0) // Supprimer les lignes vides
    .join('\n\n'); // Réinsérer des paragraphes propres

  return cleaned.trim();
}

/**
 * Supprime les en-têtes et pieds de page répétitifs
 * @param text - Texte à nettoyer
 * @returns Texte sans répétitions
 */
function removeRepetitiveHeaders(text: string): string {
  const lines = text.split('\n');
  const lineFrequency: Record<string, number> = {};

  // Compter la fréquence de chaque ligne
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.length > 0 && trimmed.length < 100) { // Seulement les lignes courtes
      lineFrequency[trimmed] = (lineFrequency[trimmed] || 0) + 1;
    }
  });

  // Identifier les lignes répétitives (en-têtes/pieds de page)
  const repetitiveLines = new Set(
    Object.entries(lineFrequency)
      .filter(([_, count]) => count > 2) // Répété plus de 2 fois
      .map(([line]) => line)
  );

  // Supprimer les lignes répétitives
  const cleaned = lines
    .filter(line => !repetitiveLines.has(line.trim()))
    .join('\n');

  return cleaned;
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
 * Tronque le texte pour respecter une limite de tokens (pour les APIs)
 * @param text - Texte à tronquer
 * @param maxTokens - Nombre maximum de tokens (~4 caractères par token)
 * @returns Texte tronqué
 */
export function truncateForAI(text: string, maxTokens: number = 2000): string {
  const maxChars = maxTokens * 4; // Approximation: 1 token ≈ 4 caractères
  
  if (text.length <= maxChars) {
    return text;
  }

  // Tronquer en gardant des phrases complètes
  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  
  if (lastPeriod > maxChars * 0.8) { // Si on a au moins 80% du texte
    return truncated.substring(0, lastPeriod + 1);
  }

  return truncated + '...';
}

/**
 * Divise le texte en chunks de taille optimale pour l'IA
 * Utile pour traiter de longs documents
 * @param text - Texte à diviser
 * @param chunkSize - Taille de chaque chunk en tokens
 * @param overlap - Chevauchement entre chunks (pour le contexte)
 * @returns Array de chunks
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 2000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let currentSize = 0;
  
  for (const sentence of sentences) {
    const sentenceSize = Math.ceil(sentence.length / 4); // Approximation tokens
    
    if (currentSize + sentenceSize > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Garder un overlap pour le contexte
      const overlapWords = currentChunk.split(' ').slice(-overlap);
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
      currentSize = Math.ceil(currentChunk.length / 4);
    } else {
      currentChunk += sentence + '. ';
      currentSize += sentenceSize;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Génère un résumé du document pour prévisualisation
 * @param text - Texte complet
 * @param maxLength - Longueur maximale du résumé
 * @returns Résumé du texte
 */
export function generatePreview(text: string, maxLength: number = 500): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Tronquer au dernier espace avant la limite
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return truncated.substring(0, lastSpace) + '...';
}

/**
 * Analyse le contenu du texte pour détecter le type de document
 * @param text - Texte à analyser
 * @returns Type de document détecté
 */
export function detectDocumentType(text: string): string {
  const lowercased = text.toLowerCase();
  
  // Mots-clés pour différents types de documents
  const patterns = {
    'Cours académique': ['chapitre', 'section', 'exercice', 'cours', 'leçon'],
    'Article scientifique': ['abstract', 'résumé', 'introduction', 'conclusion', 'références'],
    'Présentation': ['slide', 'diapositive', 'présentation'],
    'Livre': ['sommaire', 'table des matières', 'préface', 'avant-propos'],
    'Document technique': ['spécification', 'documentation', 'manuel', 'guide']
  };
  
  for (const [type, keywords] of Object.entries(patterns)) {
    const matches = keywords.filter(keyword => lowercased.includes(keyword));
    if (matches.length >= 2) {
      return type;
    }
  }
  
  return 'Document général';
}
