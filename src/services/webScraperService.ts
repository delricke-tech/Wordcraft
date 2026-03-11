/**
 * Service de scraping web avec Jina Reader
 * Extrait le contenu des pages web de manière propre et structurée
 * 
 * Date: 10 mars 2026
 */

// Types
export interface WebScrapingResult {
  url: string;
  title: string;
  content: string;
  excerpt: string;
  author?: string;
  publishDate?: string;
  siteName: string;
  metadata: {
    wordCount: number;
    readingTime: number; // Minutes estimées
    language: string;
    tags: string[];
    images: Array<{
      src: string;
      alt?: string;
      title?: string;
    }>;
    links: Array<{
      url: string;
      text: string;
    }>;
  };
  extraction: {
    method: 'jina-reader' | 'fallback';
    timestamp: string;
    confidence: number; // 0-1
  };
}

export interface ScraperOptions {
  includeImages?: boolean;
  includeLinks?: boolean;
  maxContentLength?: number;
  language?: 'auto' | 'fr' | 'en';
  timeout?: number; // Millisecondes
}

export interface URLValidation {
  isValid: boolean;
  isAccessible: boolean;
  error?: string;
  contentType?: string;
  statusCode?: number;
}

/**
 * Extrait le contenu d'une URL avec Jina Reader
 */
export async function scrapeWebContent(
  url: string,
  options: ScraperOptions = {}
): Promise<WebScrapingResult> {
  const startTime = Date.now();
  
  try {
    console.log('🌐 ===== SCRAPING WEB CONTENT =====');
    console.log('  - URL:', url);
    console.log('  - Options:', options);

    // Valider et normaliser l'URL
    const normalizedUrl = normalizeURL(url);
    console.log('  - URL normalisée:', normalizedUrl);

    // Valider l'accessibilité
    const validation = await validateURL(normalizedUrl);
    if (!validation.isValid) {
      throw new Error(`URL invalide: ${validation.error}`);
    }

    // Tenter avec Jina Reader d'abord
    let result = await scrapeWithJinaReader(normalizedUrl, options);
    
    // Si Jina échoue, essayer le fallback
    if (!result || result.content.length < 100) {
      console.warn('⚠️ Jina Reader échoué, tentative fallback...');
      result = await scrapeWithFallback(normalizedUrl, options);
    }

    // Post-traitement du contenu
    const processedResult = processScrapedContent(result, options);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Scraping terminé en ${processingTime}ms`);
    console.log(`  - Titre: ${processedResult.title}`);
    console.log(`  - Contenu: ${processedResult.content.length} caractères`);

    return processedResult;

  } catch (error) {
    console.error('💥 Erreur scraping web:', error);
    throw new Error(`Échec du scraping: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Scrape avec Jina Reader API
 */
async function scrapeWithJinaReader(
  url: string,
  options: ScraperOptions
): Promise<WebScrapingResult | null> {
  try {
    const jinaUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
    
    console.log('📡 Appel Jina Reader...');
    
    const response = await fetch(jinaUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'WordCraft-IA/1.0 (Educational Content Scraper)'
      },
      signal: AbortSignal.timeout(options.timeout || 15000)
    });

    if (!response.ok) {
      throw new Error(`Jina Reader error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    
    if (!text || text.trim().length < 50) {
      console.warn('⚠️ Contenu Jina trop court ou vide');
      return null;
    }

    // Parser le contenu de Jina
    return parseJinaContent(text, url);

  } catch (error) {
    console.warn('⚠️ Erreur Jina Reader:', error);
    return null;
  }
}

/**
 * Scrape avec méthode fallback (fetch direct + parsing)
 */
async function scrapeWithFallback(
  url: string,
  options: ScraperOptions
): Promise<WebScrapingResult> {
  try {
    console.log('🔄 Tentative fallback scraping...');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WordCraft-IA/1.0; +https://wordcraft.ai)'
      },
      signal: AbortSignal.timeout(options.timeout || 10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Parser le HTML basique
    return parseHTMLContent(html, url);

  } catch (error) {
    console.error('❌ Erreur fallback scraping:', error);
    throw error;
  }
}

/**
 * Parse le contenu retourné par Jina Reader
 */
function parseJinaContent(text: string, url: string): WebScrapingResult {
  const lines = text.split('\n');
  let title = '';
  let content = '';
  let author = '';
  let publishDate = '';
  let siteName = '';

  // Extraire les métadonnées du format Jina
  for (const line of lines) {
    if (line.startsWith('Title: ')) {
      title = line.replace('Title: ', '').trim();
    } else if (line.startsWith('Author: ')) {
      author = line.replace('Author: ', '').trim();
    } else if (line.startsWith('Published Time: ')) {
      publishDate = line.replace('Published Time: ', '').trim();
    } else if (line.startsWith('URL Source: ')) {
      siteName = extractSiteName(line.replace('URL Source: ', '').trim());
    } else if (line.trim() && !line.includes(': ')) {
      content += line + '\n';
    }
  }

  // Nettoyer le contenu
  content = cleanWebContent(content);

  return {
    url,
    title: title || extractTitleFromURL(url),
    content,
    excerpt: extractExcerpt(content),
    author: author || undefined,
    publishDate: publishDate || undefined,
    siteName: siteName || extractSiteName(url),
    metadata: {
      wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
      readingTime: Math.ceil(content.split(/\s+/).length / 200), // 200 mots/min
      language: detectLanguage(content),
      tags: extractTags(content),
      images: [], // Jina ne fournit pas les images
      links: extractLinks(content)
    },
    extraction: {
      method: 'jina-reader',
      timestamp: new Date().toISOString(),
      confidence: 0.9
    }
  };
}

/**
 * Parse le contenu HTML basique
 */
function parseHTMLContent(html: string, url: string): WebScrapingResult {
  try {
    // Parser HTML basique avec expressions régulières
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : extractTitleFromURL(url);
    
    // Extraire le contenu principal (très basique)
    const contentMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let content = contentMatch ? contentMatch[1] : html;
    
    // Nettoyer le HTML
    content = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    content = cleanWebContent(content);

    return {
      url,
      title,
      content,
      excerpt: extractExcerpt(content),
      siteName: extractSiteName(url),
      metadata: {
        wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
        readingTime: Math.ceil(content.split(/\s+/).length / 200),
        language: detectLanguage(content),
        tags: extractTags(content),
        images: extractImages(html, url),
        links: extractLinks(content)
      },
      extraction: {
        method: 'fallback',
        timestamp: new Date().toISOString(),
        confidence: 0.6
      }
    };

  } catch (error) {
    console.error('❌ Erreur parsing HTML:', error);
    throw new Error('Échec du parsing HTML');
  }
}

/**
 * Post-traite le contenu scrapé
 */
function processScrapedContent(
  result: WebScrapingResult,
  options: ScraperOptions
): WebScrapingResult {
  const { maxContentLength, includeImages = true, includeLinks = true } = options;

  // Limiter la longueur du contenu
  let processedContent = result.content;
  if (maxContentLength && processedContent.length > maxContentLength) {
    processedContent = processedContent.slice(0, maxContentLength) + '...';
  }

  // Filtrer les images/links si nécessaire
  const metadata = { ...result.metadata };
  if (!includeImages) {
    metadata.images = [];
  }
  if (!includeLinks) {
    metadata.links = [];
  }

  return {
    ...result,
    content: processedContent,
    metadata
  };
}

/**
 * Valide et normalise une URL
 */
function normalizeURL(url: string): string {
  try {
    // Ajouter le protocole si manquant
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const urlObj = new URL(url);
    return urlObj.toString();
  } catch {
    throw new Error('URL invalide');
  }
}

/**
 * Valide l'accessibilité d'une URL
 */
async function validateURL(url: string): Promise<URLValidation> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });

    return {
      isValid: true,
      isAccessible: response.ok,
      contentType: response.headers.get('content-type') || undefined,
      statusCode: response.status
    };
  } catch (error) {
    return {
      isValid: false,
      isAccessible: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Fonctions utilitaires pour le traitement
 */
function cleanWebContent(content: string): string {
  return content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

function extractExcerpt(content: string, maxLength: number = 200): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  let excerpt = sentences[0] || '';
  
  if (excerpt.length > maxLength) {
    excerpt = excerpt.slice(0, maxLength) + '...';
  }
  
  return excerpt;
}

function extractTitleFromURL(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    const lastPart = pathParts[pathParts.length - 1];
    
    if (lastPart) {
      return lastPart.replace(/[-_]/g, ' ').replace(/\.(html?|php|aspx?)$/i, '');
    }
    
    return urlObj.hostname;
  } catch {
    return url;
  }
}

function extractSiteName(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function detectLanguage(content: string): string {
  // Détection basique de langue
  const frenchWords = ['le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'est', 'sont', 'dans'];
  const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
  
  const words = content.toLowerCase().split(/\s+/).slice(0, 100); // Premier 100 mots
  const frenchCount = words.filter(w => frenchWords.includes(w)).length;
  const englishCount = words.filter(w => englishWords.includes(w)).length;
  
  if (frenchCount > englishCount) return 'fr';
  if (englishCount > frenchCount) return 'en';
  return 'auto';
}

function extractTags(content: string): string[] {
  // Extraction basique de tags (mots en majuscules, hashtags, etc.)
  const tags: string[] = [];
  
  // Mots en majuscules
  const capitalizedWords = content.match(/\b[A-Z][a-z]+\b/g) || [];
  tags.push(...capitalizedWords.slice(0, 5));
  
  // Hashtags
  const hashtags = content.match(/#\w+/g) || [];
  tags.push(...hashtags.map(tag => tag.slice(1)).slice(0, 3));
  
  return [...new Set(tags)].slice(0, 10);
}

function extractLinks(content: string): Array<{ url: string; text: string }> {
  const linkRegex = /https?:\/\/[^\s)]+/g;
  const matches = content.match(linkRegex) || [];
  
  return matches.slice(0, 20).map(url => ({
    url: url.trim(),
    text: '' // Texte du lien non disponible dans le contenu brut
  }));
}

function extractImages(html: string, baseUrl: string): Array<{ src: string; alt?: string; title?: string }> {
  const imgRegex = /<img[^>]+src=['"]([^'"]+)['"][^>]*>/gi;
  const matches = [...html.matchAll(imgRegex)];
  
  return matches.slice(0, 10).map(match => {
    const imgTag = match[0];
    const src = match[1];
    const altMatch = imgTag.match(/alt=['"]([^'"]*)['"]/i);
    const titleMatch = imgTag.match(/title=['"]([^'"]*)['"]/i);
    
    return {
      src: src.startsWith('http') ? src : new URL(src, baseUrl).toString(),
      alt: altMatch ? altMatch[1] : undefined,
      title: titleMatch ? titleMatch[1] : undefined
    };
  });
}

/**
 * Valide si une URL est supportée pour le scraping
 */
export function validateScrapableURL(url: string): { isValid: boolean; reason?: string } {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    // Extensions de fichiers non supportées
    const unsupportedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar'];
    if (unsupportedExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext))) {
      return {
        isValid: false,
        reason: `Type de fichier non supporté: ${unsupportedExtensions.find(ext => urlObj.pathname.toLowerCase().endsWith(ext))}`
      };
    }
    
    // Domaines potentiellement problématiques
    const blockedDomains = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com'];
    if (blockedDomains.some(blocked => domain.includes(blocked))) {
      return {
        isValid: false,
        reason: 'Réseaux sociaux non supportés pour le scraping'
      };
    }
    
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      reason: 'URL invalide'
    };
  }
}

/**
 * Formate le résultat pour l'affichage
 */
export function formatWebContentForDisplay(
  result: WebScrapingResult,
  options: {
    includeMetadata?: boolean;
    includeImages?: boolean;
    includeLinks?: boolean;
    compact?: boolean;
  } = {}
): string {
  const {
    includeMetadata = true,
    includeImages = true,
    includeLinks = true,
    compact = false
  } = options;

  let formattedText = `# ${result.title}\n\n`;
  
  // Métadonnées
  if (includeMetadata) {
    formattedText += `📄 **Informations**\n\n`;
    formattedText += `- **Source :** ${result.siteName}\n`;
    formattedText += `- **URL :** ${result.url}\n`;
    if (result.author) formattedText += `- **Auteur :** ${result.author}\n`;
    if (result.publishDate) formattedText += `- **Date :** ${result.publishDate}\n`;
    formattedText += `- **Mots :** ${result.metadata.wordCount}\n`;
    formattedText += `- **Lecture :** ${result.metadata.readingTime} min\n`;
    formattedText += `- **Langue :** ${result.metadata.language}\n\n`;
  }

  // Extrait
  formattedText += `📋 **Extrait**\n\n`;
  formattedText += `${result.excerpt}\n\n`;

  // Contenu complet
  if (!compact) {
    formattedText += `📖 **Contenu complet**\n\n`;
    formattedText += `${result.content}\n\n`;
  }

  // Tags
  if (result.metadata.tags.length > 0) {
    formattedText += `🏷️ **Tags**\n\n`;
    formattedText += `${result.metadata.tags.join(', ')}\n\n`;
  }

  // Images
  if (includeImages && result.metadata.images.length > 0) {
    formattedText += `🖼️ **Images** (${result.metadata.images.length})\n\n`;
    result.metadata.images.slice(0, 5).forEach((img, index) => {
      formattedText += `${index + 1}. ${img.alt || img.title || 'Image'}\n`;
      formattedText += `   - ${img.src}\n`;
    });
    formattedText += '\n';
  }

  // Liens
  if (includeLinks && result.metadata.links.length > 0) {
    formattedText += `🔗 **Liens** (${result.metadata.links.length})\n\n`;
    result.metadata.links.slice(0, 10).forEach((link, index) => {
      formattedText += `${index + 1}. ${link.text || link.url}\n`;
      formattedText += `   - ${link.url}\n`;
    });
    formattedText += '\n';
  }

  // Métadonnées d'extraction
  formattedText += `---\n`;
  formattedText += `*Extrait le ${new Date(result.extraction.timestamp).toLocaleDateString()} `;
  formattedText += `avec ${result.extraction.method} `;
  formattedText += `(confiance: ${(result.extraction.confidence * 100).toFixed(1)}%)*`;

  return formattedText;
}
