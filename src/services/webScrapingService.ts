/**
 * Service pour le web scraping avec Jina Reader
 * Permet d'extraire le contenu des pages web
 */

import { supabase } from '../lib/supabase';

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  originalLength: number;
  timestamp: string;
}

export interface WebSearchResult {
  url: string;
  title: string;
  content: string;
  relevanceScore?: number;
}

/**
 * Scrape le contenu d'une URL avec Jina Reader
 */
export async function scrapeWebPage(url: string): Promise<ScrapedContent> {
  try {
    console.log('🌐 Lancement du web scraping pour:', url);

    const { data, error } = await supabase.functions.invoke('web-scraper', {
      body: { url }
    });

    if (error) {
      console.error('❌ Erreur fonction web-scraper:', error);
      throw new Error(`Erreur scraping: ${error.message}`);
    }

    if (!data || data.error) {
      throw new Error(data?.error || 'Aucune donnée reçue du scraper');
    }

    console.log('✅ Contenu web scrapé avec succès:', {
      url: data.url,
      title: data.title,
      length: data.content.length
    });

    return data;
  } catch (error) {
    console.error('❌ Erreur scrapeWebPage:', error);
    throw error;
  }
}

/**
 * Vérifie si une chaîne est une URL valide
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Extrait les URLs d'un texte
 */
export function extractUrls(text: string): string[] {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlPattern);
  return matches || [];
}

/**
 * Formate le contenu web pour le contexte IA
 */
export function formatWebContentForAI(scrapedContent: ScrapedContent): string {
  return `
=== CONTENU WEB : ${scrapedContent.title} ===
Source: ${scrapedContent.url}
Extrait le: ${new Date(scrapedContent.timestamp).toLocaleDateString('fr-FR')}

${scrapedContent.content}
`;
}

/**
 * Détecte automatiquement les URLs dans un message et les scrape
 */
export async function detectAndScrapeUrls(message: string): Promise<{
  processedMessage: string;
  scrapedContents: ScrapedContent[];
}> {
  const urls = extractUrls(message);
  const scrapedContents: ScrapedContent[] = [];
  let processedMessage = message;

  if (urls.length > 0) {
    console.log(`🔍 Détection de ${urls.length} URL(s) dans le message`);

    // Scrape chaque URL en parallèle
    const scrapePromises = urls.map(url => scrapeWebPage(url));
    const results = await Promise.allSettled(scrapePromises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        scrapedContents.push(result.value);
        // Remplacer l'URL par un format plus lisible
        processedMessage = processedMessage.replace(
          urls[index],
          `[${result.value.title}](${result.value.url})`
        );
      } else {
        console.error(`❌ Erreur scraping URL ${urls[index]}:`, result.reason);
        // Garder l'URL originale mais marquer comme non accessible
        processedMessage = processedMessage.replace(
          urls[index],
          `[URL non accessible: ${urls[index]}]`
        );
      }
    });
  }

  return {
    processedMessage,
    scrapedContents
  };
}
