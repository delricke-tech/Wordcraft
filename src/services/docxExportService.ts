/**
 * Service d'export DOCX (Word) avec mise en page professionnelle
 * 
 * Ce service permet d'exporter des conversations, documents et contenus
 * au format DOCX avec mise en page avancée, styles et métadonnées
 * 
 * Date: 11 mars 2026
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import type { ChatMessage } from './openaiService';
import type { Citation } from './citationService';

// Interface locale pour EnhancedCitation
interface EnhancedCitation {
  id: string;
  documentName: string;
  excerpt: string;
  positionStart?: number;
  positionEnd?: number;
  context?: string;
  similarityScore?: number;
  confidence?: number;
}
import type { DocumentContext } from './openaiService';

export interface DocxExportOptions {
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
  spacing?: number;
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  customHeader?: string;
  customFooter?: string;
}

export interface DocxMetadata {
  title: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  category?: string;
  comments?: string;
  created: Date;
  modified: Date;
}

class DocxExportService {
  private readonly DEFAULT_OPTIONS: DocxExportOptions = {
    includeMetadata: true,
    includeTimestamps: true,
    includeCitations: true,
    includeTableOfContents: true,
    includePageNumbers: true,
    includeHeader: true,
    includeFooter: true,
    formatting: 'professional',
    language: 'fr',
    fontSize: 11,
    fontFamily: 'Calibri',
    lineHeight: 1.15,
    spacing: 6,
    margins: {
      top: 2.54, // cm
      right: 2.54,
      bottom: 2.54,
      left: 2.54
    }
  };

  /**
   * Exporte une conversation au format DOCX
   */
  async exportConversationToDocx(
    messages: ChatMessage[],
    options: DocxExportOptions = {}
  ): Promise<Document> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    console.log('📝 ===== EXPORT DOCX CONVERSATION =====');
    console.log('  - Messages:', messages.length);
    console.log('  - Format:', mergedOptions.formatting);

    try {
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: mergedOptions.margins!.top * 567, // Conversion cm -> twips
                right: mergedOptions.margins!.right * 567,
                bottom: mergedOptions.margins!.bottom * 567,
                left: mergedOptions.margins!.left * 567
              }
            }
          },
          children: this.generateConversationContent(messages, mergedOptions)
        }]
      });

      console.log('✅ Export DOCX conversation réussi');
      return doc;

    } catch (error) {
      console.error('❌ Erreur export DOCX:', error);
      throw new Error(`Échec de l'export DOCX: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Exporte un document au format DOCX
   */
  async exportDocumentToDocx(
    document: DocumentContext,
    options: DocxExportOptions = {}
  ): Promise<Document> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    console.log('📝 ===== EXPORT DOCX DOCUMENT =====');
    console.log('  - Document:', document.documentName);
    console.log('  - Taille:', document.extractedText?.length || 0, 'caractères');

    try {
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: mergedOptions.margins!.top * 567,
                right: mergedOptions.margins!.right * 567,
                bottom: mergedOptions.margins!.bottom * 567,
                left: mergedOptions.margins!.left * 567
              }
            }
          },
          children: this.generateDocumentContent(document, mergedOptions)
        }]
      });

      console.log('✅ Export DOCX document réussi');
      return doc;

    } catch (error) {
      console.error('❌ Erreur export DOCX document:', error);
      throw new Error(`Échec de l'export DOCX: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Génère le contenu d'une conversation
   */
  private generateConversationContent(messages: ChatMessage[], options: DocxExportOptions): Paragraph[] {
    const content: Paragraph[] = [];

    // Titre principal
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Conversation Exportée",
            bold: true,
            size: 32,
            font: options.fontFamily
          })
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Métadonnées
    if (options.includeMetadata) {
      content.push(...this.generateConversationMetadata(messages, options));
    }

    // Table des matières
    if (options.includeTableOfContents) {
      content.push(...this.generateTableOfContents(messages, options));
    }

    // Messages
    messages.forEach((message, index) => {
      content.push(...this.generateMessageSection(message, index + 1, options));
    });

    return content;
  }

  /**
   * Génère le contenu d'un document
   */
  private generateDocumentContent(document: DocumentContext, options: DocxExportOptions): Paragraph[] {
    const content: Paragraph[] = [];

    // Titre principal
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: document.documentName,
            bold: true,
            size: 32,
            font: options.fontFamily
          })
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Métadonnées
    if (options.includeMetadata) {
      content.push(...this.generateDocumentMetadata(document, options));
    }

    // Contenu principal
    content.push(...this.formatDocumentText(document.extractedText || '', options));

    return content;
  }

  /**
   * Génère les métadonnées de la conversation
   */
  private generateConversationMetadata(messages: ChatMessage[], options: DocxExportOptions): Paragraph[] {
    const metadata: Paragraph[] = [];
    
    metadata.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Métadonnées",
            bold: true,
            size: 24,
            font: options.fontFamily
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      })
    );

    const totalWords = messages.reduce((sum, msg) => sum + msg.content.split(/\s+/).length, 0);
    const readingTime = Math.ceil(totalWords / 200);
    const totalCitations = messages.reduce((sum, msg) => sum + (msg.citations?.length || 0), 0);

    const metadataItems = [
      `Nombre de messages: ${messages.length}`,
      `Nombre de mots: ${totalWords}`,
      `Temps de lecture estimé: ${readingTime} minutes`,
      `Sources citées: ${totalCitations}`,
      `Date d'export: ${new Date().toLocaleDateString(options.language || 'fr')}`
    ];

    metadataItems.forEach(item => {
      metadata.push(
        new Paragraph({
          children: [
            new TextRun({
              text: item,
              size: options.fontSize! * 2,
              font: options.fontFamily
            })
          ],
          spacing: { after: options.spacing! * 10 }
        })
      );
    });

    metadata.push(
      new Paragraph({
        text: "",
        border: {
          bottom: {
            color: "auto",
            size: 18,
            style: BorderStyle.SINGLE
          }
        },
        spacing: { before: 200, after: 400 }
      })
    );

    return metadata;
  }

  /**
   * Génère les métadonnées du document
   */
  private generateDocumentMetadata(document: DocumentContext, options: DocxExportOptions): Paragraph[] {
    const metadata: Paragraph[] = [];
    
    metadata.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Informations du document",
            bold: true,
            size: 24,
            font: options.fontFamily
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      })
    );

    const wordCount = (document.extractedText || '').split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const metadataItems = [
      `Nom du fichier: ${document.documentName}`,
      `Type: ${document.documentName.split('.').pop()?.toUpperCase()}`,
      `Taille: ${(document.extractedText?.length || 0).toLocaleString()} caractères`,
      `Nombre de mots: ${wordCount}`,
      `Temps de lecture estimé: ${readingTime} minutes`,
      `Date d'export: ${new Date().toLocaleDateString(options.language || 'fr')}`
    ];

    metadataItems.forEach(item => {
      metadata.push(
        new Paragraph({
          children: [
            new TextRun({
              text: item,
              size: options.fontSize! * 2,
              font: options.fontFamily
            })
          ],
          spacing: { after: options.spacing! * 10 }
        })
      );
    });

    metadata.push(
      new Paragraph({
        text: "",
        border: {
          bottom: {
            color: "auto",
            size: 18,
            style: BorderStyle.SINGLE
          }
        },
        spacing: { before: 200, after: 400 }
      })
    );

    return metadata;
  }

  /**
   * Génère la table des matières
   */
  private generateTableOfContents(messages: ChatMessage[], options: DocxExportOptions): Paragraph[] {
    const toc: Paragraph[] = [];
    
    toc.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Table des matières",
            bold: true,
            size: 24,
            font: options.fontFamily
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      })
    );

    messages.forEach((message, index) => {
      const role = message.role === 'user' ? '👤 Utilisateur' : '🤖 Assistant';
      const preview = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
      
      toc.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${role} - ${preview}`,
              size: options.fontSize! * 2,
              font: options.fontFamily
            })
          ],
          spacing: { after: options.spacing! * 10 }
        })
      );
    });

    toc.push(
      new Paragraph({
        text: "",
        border: {
          bottom: {
            color: "auto",
            size: 18,
            style: BorderStyle.SINGLE
          }
        },
        spacing: { before: 200, after: 400 }
      })
    );

    return toc;
  }

  /**
   * Génère une section de message
   */
  private generateMessageSection(message: ChatMessage, messageNumber: number, options: DocxExportOptions): Paragraph[] {
    const section: Paragraph[] = [];
    
    const role = message.role === 'user' ? '👤 Utilisateur' : '🤖 Assistant';
    
    // En-tête du message
    section.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Message ${messageNumber}: ${role}`,
            bold: true,
            size: 20,
            font: options.fontFamily
          })
        ],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 400, after: 200 }
      })
    );

    // Timestamp
    if (options.includeTimestamps) {
      section.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Posté le: ${new Date(message.timestamp || new Date()).toLocaleString(options.language || 'fr')}`,
              italics: true,
              size: options.fontSize! * 2,
              font: options.fontFamily
            })
          ],
          spacing: { after: options.spacing! * 10 }
        })
      );
    }

    // Contenu du message
    section.push(...this.formatMessageContent(message.content, options));

    // Citations
    if (options.includeCitations && message.citations && message.citations.length > 0) {
      section.push(...this.generateCitationsSection(message.citations, options));
    }

    // Séparateur
    section.push(
      new Paragraph({
        text: "",
        border: {
          bottom: {
            color: "auto",
            size: 12,
            style: BorderStyle.DASHED
          }
        },
        spacing: { before: 200, after: 400 }
      })
    );

    return section;
  }

  /**
   * Formate le contenu d'un message
   */
  private formatMessageContent(content: string, options: DocxExportOptions): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    // Diviser le contenu en paragraphes
    const contentParagraphs = content.split('\n\n');
    
    contentParagraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph.trim(),
                size: options.fontSize! * 2,
                font: options.fontFamily
              })
            ],
            spacing: {
              after: options.spacing! * 10,
              line: options.lineHeight! * 240
            }
          })
        );
      }
    });

    return paragraphs;
  }

  /**
   * Formate le texte d'un document
   */
  private formatDocumentText(text: string, options: DocxExportOptions): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    // Diviser le texte en paragraphes
    const textParagraphs = text.split('\n\n');
    
    textParagraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph.trim(),
                size: options.fontSize! * 2,
                font: options.fontFamily
              })
            ],
            spacing: {
              after: options.spacing! * 10,
              line: options.lineHeight! * 240
            }
          })
        );
      }
    });

    return paragraphs;
  }

  /**
   * Génère la section des citations
   */
  private generateCitationsSection(citations: (Citation | EnhancedCitation)[], options: DocxExportOptions): Paragraph[] {
    const citationSection: Paragraph[] = [];
    
    citationSection.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Sources et références",
            bold: true,
            size: 18,
            font: options.fontFamily
          })
        ],
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 300, after: 200 }
      })
    );

    citations.forEach((citation, index) => {
      const docName = 'documentName' in citation ? citation.documentName : 'name' in citation ? (citation as any).name : 'Document sans nom';
      
      citationSection.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${docName}`,
              bold: true,
              size: options.fontSize! * 2,
              font: options.fontFamily
            })
          ],
          spacing: { after: options.spacing! * 5 }
        })
      );

      citationSection.push(
        new Paragraph({
          children: [
            new TextRun({
              text: citation.excerpt,
              italics: true,
              size: options.fontSize! * 2,
              font: options.fontFamily
            })
          ],
          spacing: { after: options.spacing! * 15 }
        })
      );
    });

    return citationSection;
  }

  /**
   * Télécharge un fichier DOCX
   */
  async downloadDocxFile(
    doc: Document,
    filename: string,
    _options: DocxExportOptions = {}
  ): Promise<void> {
    try {
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([new Uint8Array(buffer)], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      saveAs(blob, `${filename}.docx`);
      
      console.log(`✅ Fichier DOCX téléchargé: ${filename}.docx`);
      
    } catch (error) {
      console.error('❌ Erreur téléchargement DOCX:', error);
      throw new Error('Impossible de télécharger le fichier DOCX');
    }
  }

  /**
   * Exporte et télécharge une conversation
   */
  async exportAndDownloadConversation(
    messages: ChatMessage[],
    filename: string,
    options: DocxExportOptions = {}
  ): Promise<void> {
    const doc = await this.exportConversationToDocx(messages, options);
    await this.downloadDocxFile(doc, filename, options);
  }

  /**
   * Exporte et télécharge un document
   */
  async exportAndDownloadDocument(
    document: DocumentContext,
    filename: string,
    options: DocxExportOptions = {}
  ): Promise<void> {
    const doc = await this.exportDocumentToDocx(document, options);
    await this.downloadDocxFile(doc, filename, options);
  }

  /**
   * Génère un aperçu du contenu (texte brut)
   */
  generatePreview(messages: ChatMessage[], options: DocxExportOptions = {}): string {
    let preview = '';
    
    // Titre
    preview += 'CONVERSATION EXPORTÉE\n\n';
    
    // Métadonnées
    if (options.includeMetadata) {
      preview += 'Métadonnées:\n';
      preview += `- Messages: ${messages.length}\n`;
      preview += `- Date: ${new Date().toLocaleDateString(options.language || 'fr')}\n\n`;
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
export const docxExportService = new DocxExportService();

// Export des fonctions utilitaires
export const exportConversationToDocx = (
  messages: ChatMessage[],
  options?: DocxExportOptions
) => docxExportService.exportConversationToDocx(messages, options);

export const exportDocumentToDocx = (
  document: DocumentContext,
  options?: DocxExportOptions
) => docxExportService.exportDocumentToDocx(document, options);

export const exportAndDownloadConversation = (
  messages: ChatMessage[],
  filename: string,
  options?: DocxExportOptions
) => docxExportService.exportAndDownloadConversation(messages, filename, options);

export const exportAndDownloadDocument = (
  document: DocumentContext,
  filename: string,
  options?: DocxExportOptions
) => docxExportService.exportAndDownloadDocument(document, filename, options);
