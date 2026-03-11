/**
 * Service d'export Markdown avancé avec formatage professionnel
 * 
 * Ce service permet d'exporter des conversations, documents et contenus
 * au format Markdown avec mise en page professionnelle, métadonnées
 * et formatage avancé
 * 
 * Date: 11 mars 2026
 */

import type { ChatMessage } from './openaiService';
import type { Citation, EnhancedCitation } from './citationService';
import type { DocumentContext } from './openaiService';

export interface MarkdownExportOptions {
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
  includeCitations?: boolean;
  includeTableOfContents?: boolean;
  formatting?: 'basic' | 'academic' | 'professional' | 'minimal';
  language?: 'fr' | 'en' | 'es';
  includeWordCount?: boolean;
  includeReadingTime?: boolean;
  customHeader?: string;
  customFooter?: string;
}

export interface ExportMetadata {
  title: string;
  author?: string;
  date: Date;
  wordCount: number;
  readingTime: number;
  tags?: string[];
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  sources: number;
}

export interface MarkdownSection {
  title: string;
  level: number; // 1-6 pour h1-h6
  content: string;
  citations?: (Citation | EnhancedCitation)[];
  metadata?: Record<string, any>;
}

class MarkdownExportService {
  private readonly DEFAULT_OPTIONS: MarkdownExportOptions = {
    includeMetadata: true,
    includeTimestamps: true,
    includeCitations: true,
    includeTableOfContents: true,
    formatting: 'professional',
    language: 'fr',
    includeWordCount: true,
    includeReadingTime: true
  };

  /**
   * Exporte une conversation au format Markdown
   */
  exportConversationToMarkdown(
    messages: ChatMessage[],
    options: MarkdownExportOptions = {}
  ): string {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    console.log('📝 ===== EXPORT MARKDOWN CONVERSATION =====');
    console.log('  - Messages:', messages.length);
    console.log('  - Format:', mergedOptions.formatting);

    try {
      let markdown = '';
      
      // En-tête avec métadonnées
      if (mergedOptions.includeMetadata) {
        markdown += this.generateConversationHeader(messages, mergedOptions);
      }

      // Table des matières
      if (mergedOptions.includeTableOfContents) {
        markdown += this.generateTableOfContents(messages);
      }

      // Contenu de la conversation
      markdown += this.generateConversationContent(messages, mergedOptions);

      // Pied de page
      if (mergedOptions.customFooter) {
        markdown += `\n\n---\n\n${mergedOptions.customFooter}`;
      }

      console.log('✅ Export Markdown conversation réussi');
      return markdown;

    } catch (error) {
      console.error('❌ Erreur export Markdown:', error);
      return this.generateFallbackExport(messages, mergedOptions);
    }
  }

  /**
   * Exporte un document au format Markdown
   */
  exportDocumentToMarkdown(
    document: DocumentContext,
    options: MarkdownExportOptions = {}
  ): string {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    console.log('📝 ===== EXPORT MARKDOWN DOCUMENT =====');
    console.log('  - Document:', document.documentName);
    console.log('  - Taille:', document.extractedText?.length || 0, 'caractères');

    try {
      let markdown = '';
      
      // Métadonnées du document
      if (mergedOptions.includeMetadata) {
        markdown += this.generateDocumentHeader(document, mergedOptions);
      }

      // Contenu principal
      markdown += this.formatDocumentContent(document.extractedText || '', mergedOptions);

      // Pied de page
      if (mergedOptions.customFooter) {
        markdown += `\n\n---\n\n${mergedOptions.customFooter}`;
      }

      console.log('✅ Export Markdown document réussi');
      return markdown;

    } catch (error) {
      console.error('❌ Erreur export Markdown document:', error);
      return this.generateFallbackDocumentExport(document, mergedOptions);
    }
  }

  /**
   * Exporte des sections structurées au format Markdown
   */
  exportStructuredMarkdown(
    sections: MarkdownSection[],
    options: MarkdownExportOptions = {}
  ): string {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    console.log('📝 ===== EXPORT MARKDOWN STRUCTURÉ =====');
    console.log('  - Sections:', sections.length);

    try {
      let markdown = '';
      
      // Métadonnées globales
      if (mergedOptions.includeMetadata) {
        markdown += this.generateStructuredHeader(sections, mergedOptions);
      }

      // Table des matières
      if (mergedOptions.includeTableOfContents) {
        markdown += this.generateStructuredTableOfContents(sections);
      }

      // Contenu des sections
      markdown += this.generateStructuredContent(sections, mergedOptions);

      console.log('✅ Export Markdown structuré réussi');
      return markdown;

    } catch (error) {
      console.error('❌ Erreur export Markdown structuré:', error);
      return this.generateFallbackStructuredExport(sections, mergedOptions);
    }
  }

  /**
   * Génère l'en-tête pour une conversation
   */
  private generateConversationHeader(messages: ChatMessage[], options: MarkdownExportOptions): string {
    const metadata = this.calculateConversationMetadata(messages);
    const date = new Date().toLocaleDateString(options.language || 'fr');
    
    let header = '---\n';
    header += `title: ${this.escapeMarkdown(metadata.title)}\n`;
    header += `author: ${this.escapeMarkdown(metadata.author || 'Utilisateur')}\n`;
    header += `date: ${date}\n`;
    header += `word_count: ${metadata.wordCount}\n`;
    header += `reading_time: ${metadata.readingTime} min\n`;
    header += `messages: ${messages.length}\n`;
    header += `sources: ${metadata.sources}\n`;
    
    if (metadata.tags && metadata.tags.length > 0) {
      header += `tags: [${metadata.tags.map(tag => `"${tag}"`).join(', ')}]\n`;
    }
    
    header += 'format: markdown\n';
    header += '---\n\n';

    // Titre principal
    header += `# ${metadata.title}\n\n`;

    // Métadonnées visuelles
    if (options.includeWordCount || options.includeReadingTime) {
      header += '> **Métadonnées**\n';
      if (options.includeWordCount) {
        header += `> - **Mots**: ${metadata.wordCount}\n`;
      }
      if (options.includeReadingTime) {
        header += `> - **Temps de lecture**: ${metadata.readingTime} min\n`;
      }
      header += `> - **Sources**: ${metadata.sources}\n`;
      header += `> - **Date**: ${date}\n\n`;
    }

    return header;
  }

  /**
   * Génère l'en-tête pour un document
   */
  private generateDocumentHeader(document: DocumentContext, options: MarkdownExportOptions): string {
    const date = new Date().toLocaleDateString(options.language || 'fr');
    const wordCount = this.countWords(document.extractedText || '');
    const readingTime = Math.ceil(wordCount / 200); // ~200 mots/min
    
    let header = '---\n';
    header += `title: ${this.escapeMarkdown(document.documentName)}\n`;
    header += `date: ${date}\n`;
    header += `word_count: ${wordCount}\n`;
    header += `reading_time: ${readingTime} min\n`;
    header += `file_size: ${document.extractedText?.length || 0}\n`;
    header += `file_type: ${document.documentName.split('.').pop()?.toUpperCase()}\n`;
    header += 'format: markdown\n';
    header += '---\n\n';

    // Titre principal
    header += `# ${document.documentName}\n\n`;

    // Métadonnées visuelles
    if (options.includeWordCount || options.includeReadingTime) {
      header += '> **Informations du document**\n';
      if (options.includeWordCount) {
        header += `> - **Mots**: ${wordCount}\n`;
      }
      if (options.includeReadingTime) {
        header += `> - **Temps de lecture**: ${readingTime} min\n`;
      }
      header += `> - **Taille**: ${(document.extractedText?.length || 0).toLocaleString()} caractères\n`;
      header += `> - **Type**: ${document.documentName.split('.').pop()?.toUpperCase()}\n`;
      header += `> - **Date**: ${date}\n\n`;
    }

    return header;
  }

  /**
   * Génère l'en-tête pour du contenu structuré
   */
  private generateStructuredHeader(sections: MarkdownSection[], options: MarkdownExportOptions): string {
    const totalWords = sections.reduce((sum, section) => sum + this.countWords(section.content), 0);
    const readingTime = Math.ceil(totalWords / 200);
    const date = new Date().toLocaleDateString(options.language || 'fr');
    
    let header = '---\n';
    header += `title: ${this.escapeMarkdown(sections[0]?.title || 'Document')}\n`;
    header += `date: ${date}\n`;
    header += `word_count: ${totalWords}\n`;
    header += `reading_time: ${readingTime} min\n`;
    header += `sections: ${sections.length}\n`;
    header += 'format: markdown\n';
    header += '---\n\n';

    // Titre principal
    header += `# ${sections[0]?.title || 'Document'}\n\n`;

    // Métadonnées visuelles
    if (options.includeWordCount || options.includeReadingTime) {
      header += '> **Métadonnées**\n';
      if (options.includeWordCount) {
        header += `> - **Mots**: ${totalWords}\n`;
      }
      if (options.includeReadingTime) {
        header += `> - **Temps de lecture**: ${readingTime} min\n`;
      }
      header += `> - **Sections**: ${sections.length}\n`;
      header += `> - **Date**: ${date}\n\n`;
    }

    return header;
  }

  /**
   * Génère la table des matières pour une conversation
   */
  private generateTableOfContents(messages: ChatMessage[]): string {
    let toc = '## 📋 Table des matières\n\n';
    
    messages.forEach((message, index) => {
      const role = message.role === 'user' ? '👤 Utilisateur' : '🤖 Assistant';
      const preview = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
      toc += `${index + 1}. [${role} - ${this.escapeMarkdown(preview)}](#message-${index + 1})\n`;
    });
    
    toc += '\n---\n\n';
    return toc;
  }

  /**
   * Génère la table des matières pour du contenu structuré
   */
  private generateStructuredTableOfContents(sections: MarkdownSection[]): string {
    let toc = '## 📋 Table des matières\n\n';
    
    sections.forEach((section, index) => {
      const indent = '  '.repeat(section.level - 1);
      const anchor = this.generateAnchor(section.title);
      toc += `${indent}${index + 1}. [${this.escapeMarkdown(section.title)}](#${anchor})\n`;
    });
    
    toc += '\n---\n\n';
    return toc;
  }

  /**
   * Génère le contenu d'une conversation
   */
  private generateConversationContent(messages: ChatMessage[], options: MarkdownExportOptions): string {
    let content = '';
    
    messages.forEach((message, index) => {
      const role = message.role === 'user' ? '👤 Utilisateur' : '🤖 Assistant';
      const timestamp = options.includeTimestamps ? new Date(message.timestamp).toLocaleString() : '';
      
      content += `## Message ${index + 1}: ${role}\n\n`;
      
      if (options.includeTimestamps && timestamp) {
        content += `> **${options.language === 'fr' ? 'Posté le' : 'Posted on'}**: ${timestamp}\n\n`;
      }
      
      // Formatage du contenu selon le style
      const formattedContent = this.formatMessageContent(message.content, options.formatting);
      content += formattedContent + '\n\n';
      
      // Citations
      if (options.includeCitations && message.citations && message.citations.length > 0) {
        content += this.generateCitationsSection(message.citations);
      }
      
      content += '---\n\n';
    });
    
    return content;
  }

  /**
   * Génère le contenu structuré
   */
  private generateStructuredContent(sections: MarkdownSection[], options: MarkdownExportOptions): string {
    let content = '';
    
    sections.forEach((section, index) => {
      const headingLevel = '#'.repeat(section.level + 1);
      content += `${headingLevel} ${this.escapeMarkdown(section.title)}\n\n`;
      
      // Métadonnées de section
      if (section.metadata && Object.keys(section.metadata).length > 0) {
        content += '> **Métadonnées de la section**\n';
        Object.entries(section.metadata).forEach(([key, value]) => {
          content += `> - **${key}**: ${value}\n`;
        });
        content += '\n';
      }
      
      // Contenu formaté
      const formattedContent = this.formatSectionContent(section.content, options.formatting);
      content += formattedContent + '\n\n';
      
      // Citations
      if (options.includeCitations && section.citations && section.citations.length > 0) {
        content += this.generateCitationsSection(section.citations);
      }
      
      content += '\n';
    });
    
    return content;
  }

  /**
   * Formate le contenu d'un message
   */
  private formatMessageContent(content: string, formatting: string): string {
    switch (formatting) {
      case 'academic':
        return this.formatAcademic(content);
      case 'professional':
        return this.formatProfessional(content);
      case 'minimal':
        return this.formatMinimal(content);
      case 'basic':
      default:
        return this.formatBasic(content);
    }
  }

  /**
   * Formate le contenu d'une section
   */
  private formatSectionContent(content: string, formatting: string): string {
    return this.formatMessageContent(content, formatting);
  }

  /**
   * Formatage académique
   */
  private formatAcademic(content: string): string {
    // Ajoute des paragraphes structurés et des citations formelles
    return content
      .split('\n\n')
      .map(paragraph => {
        if (paragraph.trim()) {
          return `${paragraph}\n\n`;
        }
        return '';
      })
      .join('');
  }

  /**
   * Formatage professionnel
   */
  private formatProfessional(content: string): string {
    // Formatage avec mise en évidence et structure claire
    return content
      .replace(/\*\*(.*?)\*\*/g, '**$1**') // Conserve le bold
      .replace(/\*(.*?)\*/g, '*$1*') // Conserve l'italic
      .replace(/^### (.*$)/gim, '### $1') // Conserve les sous-titres
      .replace(/^## (.*$)/gim, '## $1'); // Conserve les titres
  }

  /**
   * Formatage minimal
   */
  private formatMinimal(content: string): string {
    // Formatage simple et épuré
    return content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^#{1,6}\s/gm, '');
  }

  /**
   * Formatage basic
   */
  private formatBasic(content: string): string {
    // Formatage Markdown standard
    return content;
  }

  /**
   * Formate le contenu d'un document
   */
  private formatDocumentContent(content: string, options: MarkdownExportOptions): string {
    // Nettoie et structure le contenu du document
    let formatted = content;
    
    // Ajoute des paragraphes si nécessaire
    if (!formatted.includes('\n\n')) {
      formatted = formatted.split('\n').join('\n\n');
    }
    
    // Applique le formatage demandé
    return this.formatMessageContent(formatted, options.formatting);
  }

  /**
   * Génère la section des citations
   */
  private generateCitationsSection(citations: (Citation | EnhancedCitation)[]): string {
    let citationsSection = '\n### 📚 Sources et références\n\n';
    
    citations.forEach((citation, index) => {
      const docName = 'documentName' in citation ? citation.documentName : citation.name;
      citationsSection += `${index + 1}. **${this.escapeMarkdown(docName)}**\n`;
      citationsSection += `   > ${this.escapeMarkdown(citation.excerpt)}\n\n`;
    });
    
    return citationsSection;
  }

  /**
   * Calcule les métadonnées d'une conversation
   */
  private calculateConversationMetadata(messages: ChatMessage[]): ExportMetadata {
    const allText = messages.map(m => m.content).join(' ');
    const wordCount = this.countWords(allText);
    const readingTime = Math.ceil(wordCount / 200);
    const sources = messages.reduce((sum, m) => sum + (m.citations?.length || 0), 0);
    
    return {
      title: 'Conversation exportée',
      author: messages.find(m => m.role === 'user')?.content.substring(0, 50) || 'Utilisateur',
      date: new Date(),
      wordCount,
      readingTime,
      sources,
      tags: ['conversation', 'export', 'ia']
    };
  }

  /**
   * Compte les mots dans un texte
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Échappe les caractères Markdown
   */
  private escapeMarkdown(text: string): string {
    return text
      .replace(/\*/g, '\\*')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_')
      .replace(/`/g, '\\`')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]');
  }

  /**
   * Génère une ancre pour les liens
   */
  private generateAnchor(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  /**
   * Génère un export de fallback
   */
  private generateFallbackExport(messages: ChatMessage[], options: MarkdownExportOptions): string {
    let fallback = '# Conversation Exportée\n\n';
    fallback += '> ⚠️ Export généré en mode fallback\n\n';
    
    messages.forEach((message, index) => {
      const role = message.role === 'user' ? 'Utilisateur' : 'Assistant';
      fallback += `## ${index + 1}. ${role}\n\n`;
      fallback += `${message.content}\n\n`;
    });
    
    return fallback;
  }

  /**
   * Génère un export de fallback pour documents
   */
  private generateFallbackDocumentExport(document: DocumentContext, options: MarkdownExportOptions): string {
    let fallback = `# ${document.documentName}\n\n`;
    fallback += '> ⚠️ Export généré en mode fallback\n\n';
    fallback += document.extractedText || 'Contenu non disponible';
    
    return fallback;
  }

  /**
   * Génère un export de fallback structuré
   */
  private generateFallbackStructuredExport(sections: MarkdownSection[], options: MarkdownExportOptions): string {
    let fallback = '# Document Exporté\n\n';
    fallback += '> ⚠️ Export généré en mode fallback\n\n';
    
    sections.forEach((section, index) => {
      fallback += `## ${section.title}\n\n`;
      fallback += `${section.content}\n\n`;
    });
    
    return fallback;
  }

  /**
   * Exporte et télécharge un fichier Markdown
   */
  async downloadMarkdownFile(
    content: string,
    filename: string,
    options: MarkdownExportOptions = {}
  ): Promise<void> {
    try {
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log(`✅ Fichier Markdown téléchargé: ${filename}.md`);
      
    } catch (error) {
      console.error('❌ Erreur téléchargement Markdown:', error);
      throw new Error('Impossible de télécharger le fichier Markdown');
    }
  }

  /**
   * Prévisualise le Markdown en HTML
   */
  previewMarkdownAsHTML(content: string): string {
    // Conversion simple Markdown vers HTML
    const html = content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    return `<div class="markdown-preview">${html}</div>`;
  }
}

// Instance singleton
export const markdownExportService = new MarkdownExportService();

// Export des fonctions utilitaires
export const exportConversationToMarkdown = (
  messages: ChatMessage[],
  options?: MarkdownExportOptions
) => markdownExportService.exportConversationToMarkdown(messages, options);

export const exportDocumentToMarkdown = (
  document: DocumentContext,
  options?: MarkdownExportOptions
) => markdownExportService.exportDocumentToMarkdown(document, options);

export const downloadMarkdownFile = (
  content: string,
  filename: string,
  options?: MarkdownExportOptions
) => markdownExportService.downloadMarkdownFile(content, filename, options);
