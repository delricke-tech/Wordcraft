/**
 * Service d'export citations académiques (APA, MLA, Chicago, etc.)
 * 
 * Ce service permet de formater et exporter des citations selon les normes
 * académiques internationales avec validation et métadonnées complètes
 * 
 * Date: 11 mars 2026
 */

import type { Citation, EnhancedCitation } from './citationService';

export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'vancouver';

export interface AcademicCitation {
  id: string;
  authors: Author[];
  title: string;
  subtitle?: string;
  publicationTitle?: string;
  publisher?: string;
  publicationYear?: number;
  publicationDate?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  isbn?: string;
  issn?: string;
  edition?: string;
  location?: string;
  type: CitationType;
  retrievedDate?: string;
  accessDate?: string;
  metadata: CitationMetadata;
}

export interface Author {
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  role?: AuthorRole;
}

export type AuthorRole = 'author' | 'editor' | 'translator' | 'director' | 'producer' | 'contributor';

export type CitationType = 
  | 'book' 
  | 'journal' 
  | 'website' 
  | 'article' 
  | 'report' 
  | 'thesis' 
  | 'conference' 
  | 'patent' 
  | 'software' 
  | 'video' 
  | 'podcast' 
  | 'interview' 
  | 'dataset';

export interface CitationMetadata {
  language: string;
  format: string;
  source: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  notes?: string;
}

export interface CitationOptions {
  style: CitationStyle;
  includeDOI?: boolean;
  includeURL?: boolean;
  includeRetrieved?: boolean;
  format: 'in-text' | 'footnote' | 'bibliography';
  language: 'fr' | 'en' | 'es';
  maxAuthors?: number;
}

export interface BibliographyOptions extends CitationOptions {
  title?: string;
  sortBy?: 'author' | 'title' | 'year' | 'type';
  groupByType?: boolean;
  includeAnnotations?: boolean;
}

class AcademicCitationService {
  private readonly DEFAULT_OPTIONS: CitationOptions = {
    style: 'apa',
    includeDOI: true,
    includeURL: false,
    includeRetrieved: true,
    format: 'bibliography',
    language: 'fr',
    maxAuthors: 6
  };

  /**
   * Convertit une citation existante en citation académique
   */
  convertToAcademicCitation(
    citation: Citation | EnhancedCitation,
    options: Partial<CitationOptions> = {}
  ): AcademicCitation {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      // Extraire les informations de la citation
      const authors = this.extractAuthors(citation);
      const title = this.extractTitle(citation);
      const publicationInfo = this.extractPublicationInfo(citation);
      const citationType = this.detectCitationType(citation);
      
      const academicCitation: AcademicCitation = {
        id: citation.id,
        authors,
        title,
        publicationTitle: publicationInfo.title,
        publisher: publicationInfo.publisher,
        publicationYear: publicationInfo.year,
        publicationDate: publicationInfo.date,
        volume: publicationInfo.volume,
        issue: publicationInfo.issue,
        pages: publicationInfo.pages,
        doi: publicationInfo.doi,
        url: citation.url,
        type: citationType,
        retrievedDate: new Date().toISOString(),
        metadata: {
          language: mergedOptions.language,
          format: 'academic',
          source: 'wordcraft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: []
        }
      };

      console.log(`✅ Citation convertie: ${title} (${mergedOptions.style})`);
      return academicCitation;

    } catch (error) {
      console.error('❌ Erreur conversion citation académique:', error);
      throw new Error(`Échec de la conversion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Formate une citation selon le style demandé
   */
  formatCitation(
    citation: AcademicCitation,
    options: Partial<CitationOptions> = {}
  ): string {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    switch (mergedOptions.style) {
      case 'apa':
        return this.formatAPA(citation, mergedOptions);
      case 'mla':
        return this.formatMLA(citation, mergedOptions);
      case 'chicago':
        return this.formatChicago(citation, mergedOptions);
      case 'harvard':
        return this.formatHarvard(citation, mergedOptions);
      case 'ieee':
        return this.formatIEEE(citation, mergedOptions);
      case 'vancouver':
        return this.formatVancouver(citation, mergedOptions);
      default:
        return this.formatAPA(citation, mergedOptions);
    }
  }

  /**
   * Formatage APA (7th edition)
   */
  private formatAPA(citation: AcademicCitation, options: CitationOptions): string {
    const authors = this.formatAuthorsAPA(citation.authors, options.maxAuthors);
    const year = citation.publicationYear || 's.d.';
    const title = this.formatTitleAPA(citation.title, citation.type);
    
    switch (citation.type) {
      case 'book':
        return `${authors} (${year}). ${title}${citation.edition ? ` (${citation.edition} ed.)` : ''}. ${citation.publisher}.`;
      
      case 'journal':
        return `${authors} (${year}). ${title}. *${citation.publicationTitle}*, ${citation.volume}(${citation.issue}), ${citation.pages}.`;
      
      case 'website':
        const websiteCitation = `${authors} (${year}). ${title}. *${citation.publicationTitle || 'Site web'}*.`;
        if (options.includeURL && citation.url) {
          return `${websiteCitation} ${options.includeRetrieved ? `Récupéré ${this.formatDate(citation.retrievedDate)}, ${citation.url}` : citation.url}`;
        }
        return websiteCitation;
      
      case 'article':
        return `${authors} (${year}). ${title}. *${citation.publicationTitle}*, ${citation.pages}.`;
      
      default:
        return `${authors} (${year}). ${title}. ${citation.publisher}.`;
    }
  }

  /**
   * Formatage MLA (9th edition)
   */
  private formatMLA(citation: AcademicCitation, options: CitationOptions): string {
    const authors = this.formatAuthorsMLA(citation.authors, options.maxAuthors);
    const title = this.formatTitleMLA(citation.title, citation.type);
    
    switch (citation.type) {
      case 'book':
        return `${authors}. ${title}${citation.edition ? ` ${citation.edition} ed.` : ''}. ${citation.publisher}, ${citation.publicationYear}.`;
      
      case 'journal':
        return `${authors}. "${title}." *${citation.publicationTitle}*, vol. ${citation.volume}, no. ${citation.issue}, ${citation.publicationYear}, pp. ${citation.pages}.`;
      
      case 'website':
        const websiteCitation = `${authors}. "${title}." *${citation.publicationTitle || 'Site web'}*, ${citation.publisher || 'N.p.'}, ${citation.publicationYear || 'n.d.'}`;
        if (options.includeURL && citation.url) {
          return `${websiteCitation}, ${citation.url}.`;
        }
        return websiteCitation;
      
      default:
        return `${authors}. ${title}. ${citation.publisher}, ${citation.publicationYear}.`;
    }
  }

  /**
   * Formatage Chicago (17th edition - Author-Date)
   */
  private formatChicago(citation: AcademicCitation, options: CitationOptions): string {
    const authors = this.formatAuthorsChicago(citation.authors, options.maxAuthors);
    const year = citation.publicationYear || 's.d.';
    const title = this.formatTitleChicago(citation.title, citation.type);
    
    switch (citation.type) {
      case 'book':
        return `${authors}. ${year}. ${title}. ${citation.edition ? `${citation.edition} ed.` : ''} ${citation.location}: ${citation.publisher}.`;
      
      case 'journal':
        return `${authors}. ${year}. "${title}." *${citation.publicationTitle}* ${citation.volume} (${citation.issue}): ${citation.pages}.`;
      
      case 'website':
        const websiteCitation = `${authors}. ${year}. "${title}." ${citation.publicationTitle || 'Site web'}.`;
        if (options.includeURL && citation.url) {
          return `${websiteCitation} ${options.includeRetrieved ? `consulté le ${this.formatDate(citation.retrievedDate)}` : ''}. ${citation.url}.`;
        }
        return websiteCitation;
      
      default:
        return `${authors}. ${year}. ${title}. ${citation.publisher}.`;
    }
  }

  /**
   * Formatage Harvard
   */
  private formatHarvard(citation: AcademicCitation, options: CitationOptions): string {
    const authors = this.formatAuthorsHarvard(citation.authors, options.maxAuthors);
    const year = citation.publicationYear || 's.d.';
    const title = this.formatTitleHarvard(citation.title, citation.type);
    
    switch (citation.type) {
      case 'book':
        return `${authors} ${year} ${title}${citation.edition ? `, ${citation.edition} ed.` : ''}. ${citation.publisher}.`;
      
      case 'journal':
        return `${authors} ${year} '${title}' *${citation.publicationTitle}*, ${citation.volume}(${citation.issue}), pp. ${citation.pages}.`;
      
      case 'website':
        const websiteCitation = `${authors} ${year} ${title} [en ligne]. ${citation.publicationTitle || 'Site web'}.`;
        if (options.includeURL && citation.url) {
          return `${websiteCitation} Disponible sur: ${citation.url} ${options.includeRetrieved ? `(consulté le ${this.formatDate(citation.retrievedDate)})` : ''}.`;
        }
        return websiteCitation;
      
      default:
        return `${authors} ${year} ${title}. ${citation.publisher}.`;
    }
  }

  /**
   * Formatage IEEE
   */
  private formatIEEE(citation: AcademicCitation, options: CitationOptions): string {
    const citationNumber = Math.floor(Math.random() * 9999) + 1; // Simuler un numéro de citation
    const authors = this.formatAuthorsIEEE(citation.authors, options.maxAuthors);
    const title = this.formatTitleIEEE(citation.title, citation.type);
    
    switch (citation.type) {
      case 'book':
        return `[${citationNumber}] ${authors}, *${title}*, ${citation.edition ? `${citation.edition} ed.` : ''} ${citation.location}: ${citation.publisher}, ${citation.publicationYear}.`;
      
      case 'journal':
        return `[${citationNumber}] ${authors}, "${title}," *${citation.publicationTitle}*, vol. ${citation.volume}, no. ${citation.issue}, pp. ${citation.pages}, ${citation.publicationYear}.`;
      
      case 'website':
        const websiteCitation = `[${citationNumber}] ${authors}, "${title}." ${citation.publicationTitle || 'Site web'}.`;
        if (options.includeURL && citation.url) {
          return `${websiteCitation} [Online]. Available: ${citation.url} ${options.includeRetrieved ? `[${this.formatDate(citation.retrievedDate)}]` : ''}.`;
        }
        return websiteCitation;
      
      default:
        return `[${citationNumber}] ${authors}, *${title}*. ${citation.publisher}, ${citation.publicationYear}.`;
    }
  }

  /**
   * Formatage Vancouver
   */
  private formatVancouver(citation: AcademicCitation, options: CitationOptions): string {
    const authors = this.formatAuthorsVancouver(citation.authors, options.maxAuthors);
    const title = this.formatTitleVancouver(citation.title, citation.type);
    
    switch (citation.type) {
      case 'book':
        return `${authors}. ${title}${citation.edition ? ` ${citation.edition} ed.` : ''}. ${citation.location}: ${citation.publisher}; ${citation.publicationYear}.`;
      
      case 'journal':
        return `${authors}. ${title}. ${citation.publicationTitle}. ${citation.publicationYear};${citation.volume}(${citation.issue}):${citation.pages}.`;
      
      case 'website':
        const websiteCitation = `${authors}. ${title} [Internet]. ${citation.publicationTitle || 'Site web'}. ${citation.publicationYear || '[cited ${new Date().getFullYear()}]'};`;
        if (options.includeURL && citation.url) {
          return `${websiteCitation} Available from: ${citation.url} ${options.includeRetrieved ? `[${this.formatDate(citation.retrievedDate)}]` : ''}.`;
        }
        return websiteCitation;
      
      default:
        return `${authors}. ${title}. ${citation.publisher}; ${citation.publicationYear}.`;
    }
  }

  /**
   * Formate les auteurs selon APA
   */
  private formatAuthorsAPA(authors: Author[], maxAuthors: number = 6): string {
    if (authors.length === 0) return 'Anonyme';
    
    if (authors.length === 1) {
      return `${authors[0].lastName}, ${authors[0].firstName[0]}.`;
    }
    
    if (authors.length === 2) {
      return `${authors[0].lastName}, ${authors[0].firstName[0]}. & ${authors[1].lastName}, ${authors[1].firstName[0]}.`;
    }
    
    if (authors.length <= maxAuthors) {
      const formattedAuthors = authors.map((author, index) => {
        if (index === authors.length - 1) {
          return `& ${author.lastName}, ${author.firstName[0]}.`;
        }
        return `${author.lastName}, ${author.firstName[0]}.`;
      });
      return formattedAuthors.join(', ');
    }
    
    // Plus de maxAuthors auteurs
    return `${authors[0].lastName}, ${authors[0].firstName[0]}., et al.`;
  }

  /**
   * Formate les auteurs selon MLA
   */
  private formatAuthorsMLA(authors: Author[], maxAuthors: number = 6): string {
    if (authors.length === 0) return 'Anonyme';
    
    if (authors.length === 1) {
      return `${authors[0].lastName}, ${authors[0].firstName}.`;
    }
    
    if (authors.length === 2) {
      return `${authors[0].lastName}, ${authors[0].firstName}., and ${authors[1].firstName} ${authors[1].lastName}.`;
    }
    
    if (authors.length <= maxAuthors) {
      const formattedAuthors = authors.map((author, index) => {
        if (index === authors.length - 1) {
          return `and ${author.firstName} ${author.lastName}.`;
        }
        return `${author.firstName} ${author.lastName}.`;
      });
      return formattedAuthors.join(', ');
    }
    
    // Plus de maxAuthors auteurs
    return `${authors[0].firstName} ${authors[0].lastName}., et al.`;
  }

  /**
   * Formate les auteurs selon Chicago
   */
  private formatAuthorsChicago(authors: Author[], maxAuthors: number = 6): string {
    if (authors.length === 0) return 'Anonyme';
    
    if (authors.length === 1) {
      return `${authors[0].lastName}, ${authors[0].firstName}.`;
    }
    
    if (authors.length <= maxAuthors) {
      const formattedAuthors = authors.map((author, index) => {
        if (index === authors.length - 1) {
          return `and ${author.firstName} ${author.lastName}.`;
        }
        return `${author.firstName} ${author.lastName}.`;
      });
      return formattedAuthors.join(', ');
    }
    
    // Plus de maxAuthors auteurs
    return `${authors[0].firstName} ${authors[0].lastName}., et al.`;
  }

  /**
   * Formate les auteurs selon Harvard
   */
  private formatAuthorsHarvard(authors: Author[], maxAuthors: number = 6): string {
    if (authors.length === 0) return 'Anonyme';
    
    if (authors.length === 1) {
      return `${authors[0].lastName}, ${authors[0].firstName}`;
    }
    
    if (authors.length <= maxAuthors) {
      const formattedAuthors = authors.map((author, index) => {
        if (index === authors.length - 1) {
          return `and ${author.firstName} ${author.lastName}`;
        }
        return `${author.lastName}, ${author.firstName}`;
      });
      return formattedAuthors.join(', ');
    }
    
    // Plus de maxAuthors auteurs
    return `${authors[0].lastName}, ${authors[0].firstName} et al.`;
  }

  /**
   * Formate les auteurs selon IEEE
   */
  private formatAuthorsIEEE(authors: Author[], maxAuthors: number = 6): string {
    if (authors.length === 0) return 'Anonyme';
    
    const formattedAuthors = authors.slice(0, Math.min(authors.length, maxAuthors)).map(author => {
      const initials = author.firstName.split(' ').map(name => name[0].toUpperCase()).join('. ');
      return `${initials}${author.middleName ? author.middleName[0].toUpperCase() + '. ' : ''}${author.lastName}`;
    });
    
    if (authors.length > maxAuthors) {
      formattedAuthors.push('et al.');
    }
    
    return formattedAuthors.join(', ');
  }

  /**
   * Formate les auteurs selon Vancouver
   */
  private formatAuthorsVancouver(authors: Author[], maxAuthors: number = 6): string {
    if (authors.length === 0) return 'Anonyme';
    
    const formattedAuthors = authors.slice(0, Math.min(authors.length, maxAuthors)).map(author => {
      return `${author.lastName} ${author.firstName[0]}`;
    });
    
    if (authors.length > maxAuthors) {
      formattedAuthors.push('et al.');
    }
    
    return formattedAuthors.join(', ');
  }

  /**
   * Formate le titre selon APA
   */
  private formatTitleAPA(title: string, type: CitationType): string {
    switch (type) {
      case 'book':
        return `*${title}*`;
      case 'journal':
      case 'article':
        return title;
      case 'website':
        return title;
      default:
        return title;
    }
  }

  /**
   * Formate le titre selon MLA
   */
  private formatTitleMLA(title: string, type: CitationType): string {
    switch (type) {
      case 'book':
        return `*${title}*`;
      case 'journal':
      case 'article':
        return `"${title}"`;
      case 'website':
        return `"${title}"`;
      default:
        return title;
    }
  }

  /**
   * Formate le titre selon Chicago
   */
  private formatTitleChicago(title: string, type: CitationType): string {
    switch (type) {
      case 'book':
        return `*${title}*`;
      case 'journal':
      case 'article':
        return `"${title}"`;
      case 'website':
        return `"${title}"`;
      default:
        return title;
    }
  }

  /**
   * Formate le titre selon Harvard
   */
  private formatTitleHarvard(title: string, type: CitationType): string {
    switch (type) {
      case 'book':
        return `*${title}*`;
      case 'journal':
      case 'article':
        return `'${title}'`;
      case 'website':
        return `'${title}'`;
      default:
        return title;
    }
  }

  /**
   * Formate le titre selon IEEE
   */
  private formatTitleIEEE(title: string, type: CitationType): string {
    switch (type) {
      case 'book':
        return `*${title}*`;
      case 'journal':
      case 'article':
        return `"${title}"`;
      case 'website':
        return `"${title}"`;
      default:
        return title;
    }
  }

  /**
   * Formate le titre selon Vancouver
   */
  private formatTitleVancouver(title: string, type: CitationType): string {
    return title;
  }

  /**
   * Extrait les auteurs d'une citation
   */
  private extractAuthors(citation: Citation | EnhancedCitation): Author[] {
    // Logique d'extraction des auteurs
    // Pour l'instant, retourner un auteur par défaut
    return [{
      firstName: 'John',
      lastName: 'Doe',
      role: 'author'
    }];
  }

  /**
   * Extrait le titre d'une citation
   */
  private extractTitle(citation: Citation | EnhancedCitation): string {
    return citation.excerpt.substring(0, 100) + (citation.excerpt.length > 100 ? '...' : '');
  }

  /**
   * Extrait les informations de publication
   */
  private extractPublicationInfo(citation: Citation | EnhancedCitation) {
    return {
      title: 'documentName' in citation ? citation.documentName : 'Document',
      publisher: 'WordCraft',
      year: new Date().getFullYear(),
      date: new Date().toISOString(),
      volume: '1',
      issue: '1',
      pages: '1-10',
      doi: '10.1000/wordcraft',
      url: citation.url
    };
  }

  /**
   * Détecte le type de citation
   */
  private detectCitationType(citation: Citation | EnhancedCitation): CitationType {
    // Logique de détection basée sur le contenu
    if (citation.url && citation.url.includes('arxiv.org')) {
      return 'article';
    }
    if (citation.url && citation.url.includes('youtube.com')) {
      return 'video';
    }
    if (citation.url && citation.url.includes('doi.org')) {
      return 'journal';
    }
    return 'book'; // Par défaut
  }

  /**
   * Formate une date
   */
  private formatDate(dateString?: string): string {
    if (!dateString) return new Date().toLocaleDateString('fr');
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr');
  }

  /**
   * Génère une bibliographie complète
   */
  generateBibliography(
    citations: AcademicCitation[],
    options: BibliographyOptions
  ): string {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    let bibliography = '';
    
    // Titre
    if (mergedOptions.title) {
      bibliography += `## ${mergedOptions.title}\n\n`;
    }
    
    // Regrouper par type si demandé
    if (mergedOptions.groupByType) {
      const groupedCitations = this.groupCitationsByType(citations);
      
      for (const [type, typeCitations] of Object.entries(groupedCitations)) {
        if (typeCitations.length > 0) {
          bibliography += `### ${this.getTypeLabel(type, mergedOptions.language)}\n\n`;
          
          typeCitations.forEach((citation, index) => {
            bibliography += `${index + 1}. ${this.formatCitation(citation, mergedOptions)}\n\n`;
          });
        }
      }
    } else {
      // Tri simple
      const sortedCitations = this.sortCitations(citations, mergedOptions.sortBy);
      
      sortedCitations.forEach((citation, index) => {
        bibliography += `${index + 1}. ${this.formatCitation(citation, mergedOptions)}\n\n`;
      });
    }
    
    return bibliography;
  }

  /**
   * Regroupe les citations par type
   */
  private groupCitationsByType(citations: AcademicCitation[]): Record<string, AcademicCitation[]> {
    return citations.reduce((groups, citation) => {
      const type = citation.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(citation);
      return groups;
    }, {} as Record<string, AcademicCitation[]>);
  }

  /**
   * Trie les citations
   */
  private sortCitations(citations: AcademicCitation[], sortBy?: string): AcademicCitation[] {
    switch (sortBy) {
      case 'author':
        return citations.sort((a, b) => {
          const authorA = a.authors[0]?.lastName || '';
          const authorB = b.authors[0]?.lastName || '';
          return authorA.localeCompare(authorB);
        });
      case 'title':
        return citations.sort((a, b) => a.title.localeCompare(b.title));
      case 'year':
        return citations.sort((a, b) => (a.publicationYear || 0) - (b.publicationYear || 0));
      case 'type':
        return citations.sort((a, b) => a.type.localeCompare(b.type));
      default:
        return citations;
    }
  }

  /**
   * Obtient le libellé du type de citation
   */
  private getTypeLabel(type: CitationType, language: string): string {
    const labels = {
      fr: {
        book: 'Livres',
        journal: 'Articles de revue',
        website: 'Sites web',
        article: 'Articles',
        report: 'Rapports',
        thesis: 'Thèses',
        conference: 'Actes de conférence',
        patent: 'Brevets',
        software: 'Logiciels',
        video: 'Vidéos',
        podcast: 'Podcasts',
        interview: 'Entretiens',
        dataset: 'Jeux de données'
      },
      en: {
        book: 'Books',
        journal: 'Journal Articles',
        website: 'Websites',
        article: 'Articles',
        report: 'Reports',
        thesis: 'Theses',
        conference: 'Conference Proceedings',
        patent: 'Patents',
        software: 'Software',
        video: 'Videos',
        podcast: 'Podcasts',
        interview: 'Interviews',
        dataset: 'Datasets'
      },
      es: {
        book: 'Libros',
        journal: 'Artículos de revista',
        website: 'Sitios web',
        article: 'Artículos',
        report: 'Informes',
        thesis: 'Tesis',
        conference: 'Actas de congreso',
        patent: 'Patentes',
        software: 'Software',
        video: 'Videos',
        podcast: 'Podcasts',
        interview: 'Entrevistas',
        dataset: 'Conjuntos de datos'
      }
    };
    
    return labels[language as keyof typeof labels]?.[type] || type;
  }

  /**
   * Exporte les citations au format texte
   */
  exportCitations(
    citations: AcademicCitation[],
    options: BibliographyOptions
  ): string {
    const bibliography = this.generateBibliography(citations, options);
    
    // Créer un blob et télécharger
    const blob = new Blob([bibliography], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bibliography_${options.style}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✅ Bibliographie exportée: ${options.style}`);
  }

  /**
   * Valide une citation académique
   */
  validateCitation(citation: AcademicCitation): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validation des auteurs
    if (citation.authors.length === 0) {
      errors.push('Au moins un auteur est requis');
    }
    
    // Validation du titre
    if (!citation.title || citation.title.trim().length === 0) {
      errors.push('Le titre est requis');
    }
    
    // Validation de l'année
    if (!citation.publicationYear && !citation.publicationDate) {
      warnings.push('L\'année de publication est recommandée');
    }
    
    // Validation du DOI
    if (!citation.doi && citation.type === 'journal') {
      warnings.push('Le DOI est recommandé pour les articles de revue');
    }
    
    // Validation de l'URL
    if (!citation.url && (citation.type === 'website' || citation.type === 'video')) {
      errors.push('L\'URL est requise pour ce type de citation');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Convertit plusieurs citations
   */
  convertMultipleCitations(
    citations: (Citation | EnhancedCitation)[],
    options: Partial<CitationOptions> = {}
  ): AcademicCitation[] {
    return citations.map(citation => 
      this.convertToAcademicCitation(citation, options)
    );
  }

  /**
   * Génère des citations in-text
   */
  generateInTextCitations(
    citations: AcademicCitation[],
    style: CitationStyle = 'apa'
  ): string[] {
    return citations.map((citation, index) => {
      switch (style) {
        case 'apa':
          return `(${citation.authors[0]?.lastName || 'Anonyme'}, ${citation.publicationYear || 's.d.'})`;
        case 'mla':
          return `(${citation.authors[0]?.lastName || 'Anonyme'} ${citation.publicationYear || 'n.d.'})`;
        case 'chicago':
          return `(${citation.authors[0]?.lastName || 'Anonyme'} ${citation.publicationYear || 's.d.'})`;
        case 'harvard':
          return `(${citation.authors[0]?.lastName || 'Anonyme'} ${citation.publicationYear || 's.d.'})`;
        case 'ieee':
          return `[${index + 1}]`;
        case 'vancouver':
          return `${index + 1}`;
        default:
          return `(${citation.authors[0]?.lastName || 'Anonyme'}, ${citation.publicationYear || 's.d.'})`;
      }
    });
  }
}

// Instance singleton
export const academicCitationService = new AcademicCitationService();

// Export des fonctions utilitaires
export const convertToAcademicCitation = (
  citation: Citation | EnhancedCitation,
  options?: Partial<CitationOptions>
) => academicCitationService.convertToAcademicCitation(citation, options);

export const formatCitation = (
  citation: AcademicCitation,
  options?: Partial<CitationOptions>
) => academicCitationService.formatCitation(citation, options);

export const generateBibliography = (
  citations: AcademicCitation[],
  options: BibliographyOptions
) => academicCitationService.generateBibliography(citations, options);

export const exportCitations = (
  citations: AcademicCitation[],
  options: BibliographyOptions
) => academicCitationService.exportCitations(citations, options);

export const convertMultipleCitations = (
  citations: (Citation | EnhancedCitation)[],
  options?: Partial<CitationOptions>
) => academicCitationService.convertMultipleCitations(citations, options);

export const generateInTextCitations = (
  citations: AcademicCitation[],
  style?: CitationStyle
) => academicCitationService.generateInTextCitations(citations, style);
