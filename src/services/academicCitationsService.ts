/**
 * Service pour l'export de citations académiques
 * Permet de générer des citations dans différents formats (APA, MLA, Chicago, etc.)
 */

import { ChatMessage } from './openaiService';

export interface Citation {
  documentName: string;
  excerpt: string;
  author?: string;
  year?: string;
  title?: string;
  url?: string;
  publisher?: string;
  page?: string;
  doi?: string;
  isbn?: string;
}

export interface AcademicCitationOptions {
  format: 'APA' | 'MLA' | 'Chicago' | 'Harvard' | 'IEEE' | 'Vancouver';
  includeInText?: boolean;
  includeBibliography?: boolean;
  sortBy?: 'author' | 'year' | 'title' | 'type';
  groupByType?: boolean;
  includeURLs?: boolean;
  includeDOI?: boolean;
  language: 'fr' | 'en';
}

export interface FormattedCitation {
  inText: string;
  bibliography: string;
  type: 'book' | 'article' | 'website' | 'document' | 'video' | 'other';
  metadata: Citation;
}

/**
 * Détecte automatiquement le type de source
 */
export function detectSourceType(citation: Citation): 'book' | 'article' | 'website' | 'document' | 'video' | 'other' {
  const { documentName, url, publisher, doi, isbn } = citation;
  
  if (isbn) return 'book';
  if (doi && publisher) return 'article';
  if (url) return 'website';
  if (publisher) return 'book';
  if (documentName.toLowerCase().includes('video') || documentName.toLowerCase().includes('youtube')) return 'video';
  
  return 'document';
}

/**
 * Formate une citation selon le style APA 7th edition
 */
export function formatAPACitation(citation: Citation, language: 'fr' | 'en' = 'fr'): FormattedCitation {
  const type = detectSourceType(citation);
  const { author, year, title, publisher, url, doi, page, documentName } = citation;
  
  let inText = '';
  let bibliography = '';
  
  // Citation in-texte APA
  if (author && year) {
    inText = `(${author}, ${year})`;
  } else if (author) {
    inText = `(${author}, s.d.)`;
  } else if (year) {
    inText = `(${documentName}, ${year})`;
  } else {
    inText = `(${documentName}, s.d.)`;
  }
  
  // Bibliographie APA
  switch (type) {
    case 'book':
      bibliography = formatAPABook(citation, language);
      break;
    case 'article':
      bibliography = formatAPAArticle(citation, language);
      break;
    case 'website':
      bibliography = formatAPAWebsite(citation, language);
      break;
    case 'video':
      bibliography = formatPAVideo(citation, language);
      break;
    default:
      bibliography = formatPADocument(citation, language);
  }
  
  return { inText, bibliography, type, metadata: citation };
}

/**
 * Formate un livre selon APA
 */
function formatAPABook(citation: Citation, language: 'fr' | 'en'): string {
  const { author, year, title, publisher, url, doi } = citation;
  
  let citationText = '';
  
  if (author) {
    citationText += `${author}. `;
  }
  
  if (year) {
    citationText += `(${year}). `;
  } else {
    citationText += `(s.d.). `;
  }
  
  if (title) {
    citationText += `*${title}*`;
    if (publisher) {
      citationText += `. ${publisher}`;
    }
  }
  
  if (doi) {
    citationText += `. https://doi.org/${doi}`;
  } else if (url) {
    citationText += `. ${url}`;
  }
  
  return citationText;
}

/**
 * Formate un article selon APA
 */
function formatAPAArticle(citation: Citation, language: 'fr' | 'en'): string {
  const { author, year, title, publisher, url, doi, page } = citation;
  
  let citationText = '';
  
  if (author) {
    citationText += `${author}. `;
  }
  
  if (year) {
    citationText += `(${year}). `;
  } else {
    citationText += `(s.d.). `;
  }
  
  if (title) {
    citationText += `${title}. `;
  }
  
  if (publisher) {
    citationText += `*${publisher}*`;
    if (page) {
      citationText += `, ${page}`;
    }
  }
  
  if (doi) {
    citationText += `. https://doi.org/${doi}`;
  } else if (url) {
    citationText += `. ${url}`;
  }
  
  return citationText;
}

/**
 * Formate un site web selon APA
 */
function formatAPAWebsite(citation: Citation, language: 'fr' | 'en'): string {
  const { author, year, title, documentName, url, publisher } = citation;
  
  let citationText = '';
  
  if (author) {
    citationText += `${author}. `;
  }
  
  if (year) {
    citationText += `(${year}). `;
  } else {
    citationText += `(s.d.). `;
  }
  
  const pageTitle = title || documentName;
  if (pageTitle) {
    citationText += `*${pageTitle}*. `;
  }
  
  if (publisher) {
    citationText += `Site ${publisher}. `;
  }
  
  if (url) {
    citationText += url;
  }
  
  return citationText;
}

/**
 * Formate une vidéo selon APA
 */
function formatPAVideo(citation: Citation, language: 'fr' | 'en'): string {
  const { author, year, title, url, publisher } = citation;
  
  let citationText = '';
  
  if (author) {
    citationText += `${author}. `;
  }
  
  if (year) {
    citationText += `(${year}). `;
  } else {
    citationText += `(s.d.). `;
  }
  
  if (title) {
    citationText += `[*${title}*] [Vidéo]. `;
  }
  
  if (publisher) {
    citationText += `${publisher}. `;
  }
  
  if (url) {
    citationText += url;
  }
  
  return citationText;
}

/**
 * Formate un document selon APA
 */
function formatPADocument(citation: Citation, language: 'fr' | 'en'): string {
  const { author, year, title, documentName, publisher, url } = citation;
  
  let citationText = '';
  
  if (author) {
    citationText += `${author}. `;
  }
  
  if (year) {
    citationText += `(${year}). `;
  } else {
    citationText += `(s.d.). `;
  }
  
  const docTitle = title || documentName;
  if (docTitle) {
    citationText += `*${docTitle}*`;
    if (publisher) {
      citationText += `. ${publisher}`;
    }
  }
  
  if (url) {
    citationText += `. ${url}`;
  }
  
  return citationText;
}

/**
 * Formate une citation selon le style MLA 9th edition
 */
export function formatMLACitation(citation: Citation, language: 'fr' | 'en' = 'fr'): FormattedCitation {
  const type = detectSourceType(citation);
  const { author, year, title, publisher, url, doi, page, documentName } = citation;
  
  let inText = '';
  let bibliography = '';
  
  // Citation in-texte MLA
  if (author) {
    const authorShort = author.split(' ').pop()?.replace(',', '');
    if (year) {
      inText = `(${authorShort} ${year})`;
    } else {
      inText = `(${authorShort})`;
    }
  } else {
    const titleShort = (title || documentName).substring(0, 3);
    inText = `("${titleShort}")`;
  }
  
  // Bibliographie MLA
  switch (type) {
    case 'book':
      bibliography = formatMLABook(citation, language);
      break;
    case 'article':
      bibliography = formatMLAArticle(citation, language);
      break;
    case 'website':
      bibliography = formatMLAWebsite(citation, language);
      break;
    case 'video':
      bibliography = formatMLAVideo(citation, language);
      break;
    default:
      bibliography = formatMLADocument(citation, language);
  }
  
  return { inText, bibliography, type, metadata: citation };
}

/**
 * Formate un livre selon MLA
 */
function formatMLABook(citation: Citation, language: 'fr' | 'en'): string {
  const { author, title, publisher, year, url } = citation;
  
  let citationText = '';
  
  if (author) {
    citationText += `${author}. `;
  }
  
  if (title) {
    citationText += `*${title}*`;
  }
  
  if (publisher) {
    citationText += `. ${publisher}`;
  }
  
  if (year) {
    citationText += `, ${year}`;
  }
  
  if (url) {
    citationText += `. ${url}`;
  }
  
  return citationText;
}

/**
 * Formate un article selon MLA
 */
function formatMLAArticle(citation: Citation, language: 'fr' | 'en'): string {
  const { author, title, publisher, year, page, url } = citation;
  
  let citationText = '';
  
  if (author) {
    citationText += `${author}. `;
  }
  
  if (title) {
    citationText += `"${title}." `;
  }
  
  if (publisher) {
    citationText += `*${publisher}*`;
  }
  
  if (year) {
    citationText += `, ${year}`;
  }
  
  if (page) {
    citationText += `, pp. ${page}`;
  }
  
  if (url) {
    citationText += `. ${url}`;
  }
  
  return citationText;
}

/**
 * Formate un site web selon MLA
 */
function formatMLAWebsite(citation: Citation, language: 'fr' | 'en'): string {
  const { author, title, documentName, publisher, year, url } = citation;
  
  let citationText = '';
  
  if (author) {
    citationText += `${author}. `;
  }
  
  const pageTitle = title || documentName;
  if (pageTitle) {
    citationText += `"${pageTitle}." `;
  }
  
  if (publisher) {
    citationText += `*${publisher}*`;
  }
  
  if (year) {
    citationText += `, ${year}`;
  }
  
  if (url) {
    citationText += `. ${url}`;
  }
  
  return citationText;
}

/**
 * Formate une vidéo selon MLA
 */
function formatMLAVideo(citation: Citation, language: 'fr' | 'en'): string {
  const { author, title, publisher, year, url } = citation;
  
  let citationText = '';
  
  if (author) {
    citationText += `${author}. `;
  }
  
  if (title) {
    citationText += `"${title}." `;
  }
  
  if (publisher) {
    citationText += `*${publisher}*`;
  }
  
  if (year) {
    citationText += `, ${year}`;
  }
  
  if (url) {
    citationText += `. ${url}`;
  }
  
  return citationText;
}

/**
 * Formate un document selon MLA
 */
function formatMLADocument(citation: Citation, language: 'fr' | 'en'): string {
  const { author, title, documentName, publisher, year, url } = citation;
  
  let citationText = '';
  
  if (author) {
    citationText += `${author}. `;
  }
  
  const docTitle = title || documentName;
  if (docTitle) {
    citationText += `"${docTitle}." `;
  }
  
  if (publisher) {
    citationText += `*${publisher}*`;
  }
  
  if (year) {
    citationText += `, ${year}`;
  }
  
  if (url) {
    citationText += `. ${url}`;
  }
  
  return citationText;
}

/**
 * Formate une citation selon le style Chicago
 */
export function formatChicagoCitation(citation: Citation, language: 'fr' | 'en' = 'fr'): FormattedCitation {
  const type = detectSourceType(citation);
  const { author, year, title, publisher, url, doi, page, documentName } = citation;
  
  let inText = '';
  let bibliography = '';
  
  // Citation in-texte Chicago (author-date)
  if (author && year) {
    inText = `(${author} ${year})`;
  } else if (author) {
    inText = `(${author} s.d.)`;
  } else if (year) {
    inText = `(${documentName} ${year})`;
  } else {
    inText = `(${documentName} s.d.)`;
  }
  
  // Bibliographie Chicago
  switch (type) {
    case 'book':
      bibliography = formatChicagoBook(citation, language);
      break;
    case 'article':
      bibliography = formatChicagoArticle(citation, language);
      break;
    case 'website':
      bibliography = formatChicagoWebsite(citation, language);
      break;
    default:
      bibliography = formatChicagoDocument(citation, language);
  }
  
  return { inText, bibliography, type, metadata: citation };
}

/**
 * Formate un livre selon Chicago
 */
function formatChicagoBook(citation: Citation, language: 'fr' | 'en'): string {
  const { author, title, publisher, year, url } = citation;
  
  let citationText = '';
  
  if (author) {
    citationText += `${author}. `;
  }
  
  if (title) {
    citationText += `*${title}*`;
  }
  
  if (publisher) {
    citationText += `. ${publisher}`;
  }
  
  if (year) {
    citationText += `, ${year}`;
  }
  
  if (url) {
    citationText += `. ${url}`;
  }
  
  return citationText;
}

/**
 * Formate un article selon Chicago
 */
function formatChicagoArticle(citation: Citation, language: 'fr' | 'en'): string {
  const { author, title, publisher, year, page, url } = citation;
  
  let citationText = '';
  
  if (author) {
    citationText += `${author}. `;
  }
  
  if (title) {
    citationText += `"${title}." `;
  }
  
  if (publisher) {
    citationText += `*${publisher}*`;
  }
  
  if (year) {
    citationText += `, ${year}`;
  }
  
  if (page) {
    citationText += `, ${page}`;
  }
  
  if (url) {
    citationText += `. ${url}`;
  }
  
  return citationText;
}

/**
 * Formate un site web selon Chicago
 */
function formatChicagoWebsite(citation: Citation, language: 'fr' | 'en'): string {
  const { author, title, documentName, publisher, year, url } = citation;
  
  let citationText = '';
  
  if (author) {
    citationText += `${author}. `;
  }
  
  const pageTitle = title || documentName;
  if (pageTitle) {
    citationText += `"${pageTitle}." `;
  }
  
  if (publisher) {
    citationText += `Site ${publisher}. `;
  }
  
  if (year) {
    citationText += `Publié le ${year}. `;
  }
  
  if (url) {
    citationText += url;
  }
  
  return citationText;
}

/**
 * Formate un document selon Chicago
 */
function formatChicagoDocument(citation: Citation, language: 'fr' | 'en'): string {
  const { author, title, documentName, publisher, year, url } = citation;
  
  let citationText = '';
  
  if (author) {
    citationText += `${author}. `;
  }
  
  const docTitle = title || documentName;
  if (docTitle) {
    citationText += `"${docTitle}." `;
  }
  
  if (publisher) {
    citationText += `${publisher}. `;
  }
  
  if (year) {
    citationText += `${year}. `;
  }
  
  if (url) {
    citationText += url;
  }
  
  return citationText;
}

/**
 * Génère des citations académiques à partir des messages
 */
export function generateAcademicCitations(
  messages: ChatMessage[],
  options: AcademicCitationOptions
): {
  inTextCitations: string[];
  bibliography: string[];
  formattedCitations: FormattedCitation[];
} {
  const { format, includeInText = true, includeBibliography = true, language = 'fr' } = options;
  
  const allCitations: Citation[] = [];
  const formattedCitations: FormattedCitation[] = [];
  
  // Extraire toutes les citations des messages
  messages.forEach(message => {
    if (message.citations) {
      message.citations.forEach(citation => {
        if (!allCitations.find(c => c.documentName === citation.documentName && c.excerpt === citation.excerpt)) {
          allCitations.push(citation);
        }
      });
    }
  });
  
  // Formatter chaque citation selon le style demandé
  allCitations.forEach(citation => {
    let formatted: FormattedCitation;
    
    switch (format) {
      case 'APA':
        formatted = formatAPACitation(citation, language);
        break;
      case 'MLA':
        formatted = formatMLACitation(citation, language);
        break;
      case 'Chicago':
        formatted = formatChicagoCitation(citation, language);
        break;
      default:
        formatted = formatAPACitation(citation, language);
    }
    
    formattedCitations.push(formatted);
  });
  
  // Trier les citations si demandé
  if (options.sortBy) {
    formattedCitations.sort((a, b) => {
      switch (options.sortBy) {
        case 'author':
          return (a.metadata.author || '').localeCompare(b.metadata.author || '');
        case 'year':
          return (a.metadata.year || '').localeCompare(b.metadata.year || '');
        case 'title':
          return (a.metadata.title || a.metadata.documentName || '').localeCompare(b.metadata.title || b.metadata.documentName || '');
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });
  }
  
  // Générer les citations in-texte et la bibliographie
  const inTextCitations = includeInText ? formattedCitations.map(c => c.inText) : [];
  const bibliography = includeBibliography ? formattedCitations.map(c => c.bibliography) : [];
  
  return {
    inTextCitations,
    bibliography,
    formattedCitations
  };
}

/**
 * Exporte les citations académiques en format texte
 */
export function exportAcademicCitationsToText(
  citations: FormattedCitation[],
  format: string,
  language: 'fr' | 'en' = 'fr'
): string {
  let text = '';
  
  // En-tête
  if (language === 'fr') {
    text += `Citations académiques - Style ${format}\n`;
    text += `Généré le ${new Date().toLocaleString('fr-FR')}\n`;
    text += `Nombre de sources : ${citations.length}\n\n`;
  } else {
    text += `Academic Citations - ${format} Style\n`;
    text += `Generated on ${new Date().toLocaleString('en-US')}\n`;
    text += `Number of sources: ${citations.length}\n\n`;
  }
  
  // Citations in-texte
  if (citations.length > 0) {
    text += language === 'fr' ? 'Citations dans le texte :\n' : 'In-text citations:\n';
    citations.forEach((citation, index) => {
      text += `[${index + 1}] ${citation.inText}\n`;
    });
    text += '\n';
  }
  
  // Bibliographie
  text += language === 'fr' ? 'Bibliographie :\n' : 'Bibliography:\n';
  citations.forEach((citation, index) => {
    text += `[${index + 1}] ${citation.bibliography}\n\n`;
  });
  
  return text;
}

/**
 * Exporte les citations académiques en format CSV
 */
export function exportAcademicCitationsToCSV(
  citations: FormattedCitation[],
  format: string
): string {
  let csv = 'Type,Auteur,Année,Titre,Source,URL,DOI,Éditeur,Citation In-Texte,Bibliographie\n';
  
  citations.forEach(citation => {
    const { metadata, type, inText, bibliography } = citation;
    
    csv += `"${type}",`;
    csv += `"${metadata.author || ''}",`;
    csv += `"${metadata.year || ''}",`;
    csv += `"${metadata.title || metadata.documentName || ''}",`;
    csv += `"${metadata.documentName || ''}",`;
    csv += `"${metadata.url || ''}",`;
    csv += `"${metadata.doi || ''}",`;
    csv += `"${metadata.publisher || ''}",`;
    csv += `"${inText}",`;
    csv += `"${bibliography.replace(/"/g, '""')}"\n`;
  });
  
  return csv;
}

/**
 * Télécharge les citations académiques
 */
export function downloadAcademicCitations(
  citations: FormattedCitation[],
  format: string,
  fileType: 'txt' | 'csv' | 'json',
  language: 'fr' | 'en' = 'fr'
): void {
  let content: string;
  let mimeType: string;
  let filename: string;
  
  switch (fileType) {
    case 'txt':
      content = exportAcademicCitationsToText(citations, format, language);
      mimeType = 'text/plain';
      filename = `citations-${format.toLowerCase()}.txt`;
      break;
    case 'csv':
      content = exportAcademicCitationsToCSV(citations, format);
      mimeType = 'text/csv';
      filename = `citations-${format.toLowerCase()}.csv`;
      break;
    case 'json':
      content = JSON.stringify(citations, null, 2);
      mimeType = 'application/json';
      filename = `citations-${format.toLowerCase()}.json`;
      break;
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
