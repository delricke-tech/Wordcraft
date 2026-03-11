/**
 * Service d'export PDF avec table des matières et mise en page professionnelle
 * 
 * Ce service permet d'exporter des conversations, documents et contenus
 * au format PDF avec mise en page avancée, table des matières et métadonnées
 * 
 * Date: 11 mars 2026
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { ChatMessage } from './openaiService';
import type { Citation, EnhancedCitation } from './citationService';
import type { DocumentContext } from './openaiService';

// Extension pour jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    addPage: () => jsPDF;
    lastAutoTable: any;
  }
}

export interface PdfExportOptions {
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
  includeCitations?: boolean;
  includeTableOfContents?: boolean;
  includePageNumbers?: boolean;
  includeHeader?: boolean;
  includeFooter?: boolean;
  formatting?: 'basic' | 'academic' | 'professional' | 'minimal';
  language?: 'fr' | 'en' | 'es';
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'a3' | 'letter';
  customHeader?: string;
  customFooter?: string;
  watermark?: string;
}

export interface PdfMetadata {
  title: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate: Date;
  modificationDate: Date;
}

class PdfExportService {
  private readonly DEFAULT_OPTIONS: PdfExportOptions = {
    includeMetadata: true,
    includeTimestamps: true,
    includeCitations: true,
    includeTableOfContents: true,
    includePageNumbers: true,
    includeHeader: true,
    includeFooter: true,
    formatting: 'professional',
    language: 'fr',
    fontSize: 12,
    fontFamily: 'helvetica',
    lineHeight: 1.5,
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    orientation: 'portrait',
    pageSize: 'a4'
  };

  /**
   * Exporte une conversation au format PDF
   */
  async exportConversationToPdf(
    messages: ChatMessage[],
    options: PdfExportOptions = {}
  ): Promise<jsPDF> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    console.log('📄 ===== EXPORT PDF CONVERSATION =====');
    console.log('  - Messages:', messages.length);
    console.log('  - Format:', mergedOptions.formatting);

    try {
      const pdf = new jsPDF({
        orientation: mergedOptions.orientation,
        unit: 'mm',
        format: mergedOptions.pageSize
      });

      // Configuration des polices et marges
      pdf.setFont(mergedOptions.fontFamily);
      pdf.setFontSize(mergedOptions.fontSize);

      // Métadonnées
      if (mergedOptions.includeMetadata) {
        this.addConversationMetadata(pdf, messages, mergedOptions);
      }

      // Table des matières
      if (mergedOptions.includeTableOfContents) {
        this.addTableOfContents(pdf, messages, mergedOptions);
      }

      // Contenu de la conversation
      this.addConversationContent(pdf, messages, mergedOptions);

      // Pied de page et numéros de page
      if (mergedOptions.includePageNumbers || mergedOptions.includeFooter) {
        this.addPageNumbersAndFooter(pdf, mergedOptions);
      }

      console.log('✅ Export PDF conversation réussi');
      return pdf;

    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
      throw new Error(`Échec de l'export PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Exporte un document au format PDF
   */
  async exportDocumentToPdf(
    document: DocumentContext,
    options: PdfExportOptions = {}
  ): Promise<jsPDF> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    console.log('📄 ===== EXPORT PDF DOCUMENT =====');
    console.log('  - Document:', document.documentName);
    console.log('  - Taille:', document.extractedText?.length || 0, 'caractères');

    try {
      const pdf = new jsPDF({
        orientation: mergedOptions.orientation,
        unit: 'mm',
        format: mergedOptions.pageSize
      });

      // Configuration des polices et marges
      pdf.setFont(mergedOptions.fontFamily);
      pdf.setFontSize(mergedOptions.fontSize);

      // Métadonnées
      if (mergedOptions.includeMetadata) {
        this.addDocumentMetadata(pdf, document, mergedOptions);
      }

      // Contenu principal
      this.addDocumentContent(pdf, document, mergedOptions);

      // Pied de page et numéros de page
      if (mergedOptions.includePageNumbers || mergedOptions.includeFooter) {
        this.addPageNumbersAndFooter(pdf, mergedOptions);
      }

      console.log('✅ Export PDF document réussi');
      return pdf;

    } catch (error) {
      console.error('❌ Erreur export PDF document:', error);
      throw new Error(`Échec de l'export PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Ajoute les métadonnées de la conversation
   */
  private addConversationMetadata(pdf: jsPDF, messages: ChatMessage[], options: PdfExportOptions): void {
    pdf.setFontSize(20);
    pdf.text('Conversation Exportée', pdf.internal.pageSize.width / 2, 30, { align: 'center' });
    
    pdf.setFontSize(12);
    const totalWords = messages.reduce((sum, msg) => sum + msg.content.split(/\s+/).length, 0);
    const readingTime = Math.ceil(totalWords / 200);
    const totalCitations = messages.reduce((sum, msg) => sum + (msg.citations?.length || 0), 0);

    const metadata = [
      `Nombre de messages: ${messages.length}`,
      `Nombre de mots: ${totalWords}`,
      `Temps de lecture estimé: ${readingTime} minutes`,
      `Sources citées: ${totalCitations}`,
      `Date d'export: ${new Date().toLocaleDateString(options.language || 'fr')}`
    ];

    let yPosition = 50;
    metadata.forEach(item => {
      pdf.text(item, options.margins!.left, yPosition);
      yPosition += 8;
    });

    // Ligne de séparation
    pdf.setDrawColor(0);
    pdf.line(options.margins!.left, yPosition, pdf.internal.pageSize.width - options.margins!.right, yPosition);
    
    pdf.addPage();
  }

  /**
   * Ajoute les métadonnées du document
   */
  private addDocumentMetadata(pdf: jsPDF, document: DocumentContext, options: PdfExportOptions): void {
    pdf.setFontSize(20);
    pdf.text(document.documentName, pdf.internal.pageSize.width / 2, 30, { align: 'center' });
    
    pdf.setFontSize(12);
    const wordCount = (document.extractedText || '').split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const metadata = [
      `Nom du fichier: ${document.documentName}`,
      `Type: ${document.documentName.split('.').pop()?.toUpperCase()}`,
      `Taille: ${(document.extractedText?.length || 0).toLocaleString()} caractères`,
      `Nombre de mots: ${wordCount}`,
      `Temps de lecture estimé: ${readingTime} minutes`,
      `Date d'export: ${new Date().toLocaleDateString(options.language || 'fr')}`
    ];

    let yPosition = 50;
    metadata.forEach(item => {
      pdf.text(item, options.margins!.left, yPosition);
      yPosition += 8;
    });

    // Ligne de séparation
    pdf.setDrawColor(0);
    pdf.line(options.margins!.left, yPosition, pdf.internal.pageSize.width - options.margins!.right, yPosition);
    
    pdf.addPage();
  }

  /**
   * Ajoute la table des matières
   */
  private addTableOfContents(pdf: jsPDF, messages: ChatMessage[], options: PdfExportOptions): void {
    pdf.setFontSize(16);
    pdf.text('Table des matières', options.margins!.left, 30);

    let yPosition = 45;
    pdf.setFontSize(10);

    messages.forEach((message, index) => {
      const role = message.role === 'user' ? '👤 Utilisateur' : '🤖 Assistant';
      const preview = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
      
      // Vérifier si on doit ajouter une nouvelle page
      if (yPosition > pdf.internal.pageSize.height - options.margins!.bottom) {
        pdf.addPage();
        yPosition = options.margins!.top;
      }

      pdf.text(`${index + 1}. ${role} - ${preview}`, options.margins!.left + 10, yPosition);
      yPosition += 8;
    });

    pdf.addPage();
  }

  /**
   * Ajoute le contenu de la conversation
   */
  private addConversationContent(pdf: jsPDF, messages: ChatMessage[], options: PdfExportOptions): void {
    let yPosition = options.margins!.top;

    messages.forEach((message, index) => {
      const role = message.role === 'user' ? '👤 Utilisateur' : '🤖 Assistant';
      
      // Titre du message
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Message ${index + 1}: ${role}`, options.margins!.left, yPosition);
      yPosition += 12;

      // Timestamp
      if (options.includeTimestamps) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`Posté le: ${new Date(message.timestamp).toLocaleString(options.language || 'fr')}`, options.margins!.left, yPosition);
        yPosition += 8;
      }

      // Contenu du message
      pdf.setFontSize(options.fontSize!);
      pdf.setFont('helvetica', 'normal');
      const contentLines = pdf.splitTextToSize(message.content, pdf.internal.pageSize.width - options.margins!.left - options.margins!.right);
      
      contentLines.forEach((line: string) => {
        // Vérifier si on doit ajouter une nouvelle page
        if (yPosition > pdf.internal.pageSize.height - options.margins!.bottom - 20) {
          pdf.addPage();
          yPosition = options.margins!.top;
        }
        
        pdf.text(line, options.margins!.left, yPosition);
        yPosition += options.lineHeight! * options.fontSize! * 0.3528; // Conversion pt -> mm
      });

      yPosition += 10;

      // Citations
      if (options.includeCitations && message.citations && message.citations.length > 0) {
        yPosition = this.addCitationsSection(pdf, message.citations, yPosition, options);
      }

      // Séparateur
      yPosition += 10;
      if (yPosition < pdf.internal.pageSize.height - options.margins!.bottom - 30) {
        pdf.setDrawColor(200);
        pdf.line(options.margins!.left, yPosition, pdf.internal.pageSize.width - options.margins!.right, yPosition);
      }
      
      yPosition += 20;
    });
  }

  /**
   * Ajoute le contenu du document
   */
  private addDocumentContent(pdf: jsPDF, document: DocumentContext, options: PdfExportOptions): void {
    let yPosition = options.margins!.top;
    
    pdf.setFontSize(options.fontSize!);
    pdf.setFont('helvetica', 'normal');
    
    const contentLines = pdf.splitTextToSize(
      document.extractedText || '', 
      pdf.internal.pageSize.width - options.margins!.left - options.margins!.right
    );
    
    contentLines.forEach((line: string) => {
      // Vérifier si on doit ajouter une nouvelle page
      if (yPosition > pdf.internal.pageSize.height - options.margins!.bottom - 20) {
        pdf.addPage();
        yPosition = options.margins!.top;
      }
      
      pdf.text(line, options.margins!.left, yPosition);
      yPosition += options.lineHeight! * options.fontSize! * 0.3528;
    });
  }

  /**
   * Ajoute la section des citations
   */
  private addCitationsSection(
    pdf: jsPDF, 
    citations: (Citation | EnhancedCitation)[], 
    yPosition: number, 
    options: PdfExportOptions
  ): number {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Sources et références:', options.margins!.left + 10, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    citations.forEach((citation, index) => {
      const docName = 'documentName' in citation ? citation.documentName : citation.name;
      
      // Vérifier si on doit ajouter une nouvelle page
      if (yPosition > pdf.internal.pageSize.height - options.margins!.bottom - 20) {
        pdf.addPage();
        yPosition = options.margins!.top;
      }

      pdf.text(`${index + 1}. ${docName}`, options.margins!.left + 20, yPosition);
      yPosition += 6;

      const citationLines = pdf.splitTextToSize(
        citation.excerpt, 
        pdf.internal.pageSize.width - options.margins!.left - options.margins!.right - 30
      );
      
      citationLines.forEach((line: string) => {
        if (yPosition > pdf.internal.pageSize.height - options.margins!.bottom - 20) {
          pdf.addPage();
          yPosition = options.margins!.top;
        }
        
        pdf.setFont('helvetica', 'italic');
        pdf.text(line, options.margins!.left + 30, yPosition);
        pdf.setFont('helvetica', 'normal');
        yPosition += 5;
      });

      yPosition += 8;
    });

    return yPosition;
  }

  /**
   * Ajoute les numéros de page et le pied de page
   */
  private addPageNumbersAndFooter(pdf: jsPDF, options: PdfExportOptions): void {
    const totalPages = pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      let footerText = '';
      if (options.customFooter) {
        footerText = options.customFooter;
      } else {
        footerText = `Généré par WordCraft IA - ${new Date().toLocaleDateString(options.language || 'fr')}`;
      }

      // Numéro de page
      if (options.includePageNumbers) {
        pdf.setFontSize(8);
        pdf.text(
          `Page ${i} / ${totalPages}`,
          pdf.internal.pageSize.width / 2,
          pdf.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Pied de page
      if (options.includeFooter) {
        pdf.setFontSize(8);
        pdf.text(
          footerText,
          pdf.internal.pageSize.width / 2,
          pdf.internal.pageSize.height - 5,
          { align: 'center' }
        );
      }

      // Watermark
      if (options.watermark) {
        pdf.setFontSize(50);
        pdf.setTextColor(230, 230, 230);
        pdf.text(
          options.watermark,
          pdf.internal.pageSize.width / 2,
          pdf.internal.pageSize.height / 2,
          { 
            align: 'center',
            angle: 45
          }
        );
        pdf.setTextColor(0, 0, 0); // Reset color
      }
    }
  }

  /**
   * Télécharge un fichier PDF
   */
  async downloadPdfFile(
    pdf: jsPDF,
    filename: string,
    options: PdfExportOptions = {}
  ): Promise<void> {
    try {
      pdf.save(`${filename}.pdf`);
      
      console.log(`✅ Fichier PDF téléchargé: ${filename}.pdf`);
      
    } catch (error) {
      console.error('❌ Erreur téléchargement PDF:', error);
      throw new Error('Impossible de télécharger le fichier PDF');
    }
  }

  /**
   * Exporte et télécharge une conversation
   */
  async exportAndDownloadConversation(
    messages: ChatMessage[],
    filename: string,
    options: PdfExportOptions = {}
  ): Promise<void> {
    const pdf = await this.exportConversationToPdf(messages, options);
    await this.downloadPdfFile(pdf, filename, options);
  }

  /**
   * Exporte et télécharge un document
   */
  async exportAndDownloadDocument(
    document: DocumentContext,
    filename: string,
    options: PdfExportOptions = {}
  ): Promise<void> {
    const pdf = await this.exportDocumentToPdf(document, options);
    await this.downloadPdfFile(pdf, filename, options);
  }

  /**
   * Génère un aperçu du contenu (texte brut)
   */
  generatePreview(messages: ChatMessage[], options: PdfExportOptions = {}): string {
    let preview = '';
    
    // Titre
    preview += 'CONVERSATION EXPORTÉE (PDF)\n\n';
    
    // Métadonnées
    if (options.includeMetadata) {
      preview += 'Métadonnées:\n';
      preview += `- Messages: ${messages.length}\n`;
      preview += `- Date: ${new Date().toLocaleDateString(options.language || 'fr')}\n`;
      preview += `- Orientation: ${options.orientation || 'portrait'}\n`;
      preview += `- Format: ${options.pageSize || 'a4'}\n\n`;
    }
    
    // Messages
    messages.forEach((message, index) => {
      const role = message.role === 'user' ? 'UTILISATEUR' : 'ASSISTANT';
      preview += `${index + 1}. ${role}\n`;
      preview += `${message.content.substring(0, 200)}${message.content.length > 200 ? '...' : ''}\n\n`;
    });
    
    return preview;
  }
}

// Instance singleton
export const pdfExportService = new PdfExportService();

// Export des fonctions utilitaires
export const exportConversationToPdf = (
  messages: ChatMessage[],
  options?: PdfExportOptions
) => pdfExportService.exportConversationToPdf(messages, options);

export const exportDocumentToPdf = (
  document: DocumentContext,
  options?: PdfExportOptions
) => pdfExportService.exportDocumentToPdf(document, options);

export const exportAndDownloadConversation = (
  messages: ChatMessage[],
  filename: string,
  options?: PdfExportOptions
) => pdfExportService.exportAndDownloadConversation(messages, filename, options);

export const exportAndDownloadDocument = (
  document: DocumentContext,
  filename: string,
  options?: PdfExportOptions
) => pdfExportService.exportAndDownloadDocument(document, filename, options);
