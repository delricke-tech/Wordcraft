/**
 * Service pour l'export DOCX (Word) avancé
 * Permet d'exporter des conversations et documents avec mise en page professionnelle
 */

import { ChatMessage } from './openaiService';

export interface ExportDOCXOptions {
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
  includeCitations?: boolean;
  customTitle?: string;
  includeTableOfContents?: boolean;
  maxHeadingLevel?: number;
  includePageNumbers?: boolean;
  includeHeader?: boolean;
  includeFooter?: boolean;
  template?: 'professional' | 'academic' | 'business' | 'modern';
  fontSize?: number;
  fontFamily?: string;
  lineSpacing?: number;
  margins?: 'normal' | 'narrow' | 'wide';
  orientation?: 'portrait' | 'landscape';
}

export interface DOCXSection {
  title: string;
  level: number;
  content: string;
  subsections?: DOCXSection[];
}

/**
 * Convertit le contenu en structure DOCX
 */
export function convertToDOCXStructure(
  content: string,
  options: ExportDOCXOptions = {}
): DOCXSection[] {
  const { maxHeadingLevel = 3 } = options;
  const sections: DOCXSection[] = [];
  
  // Analyser le contenu pour extraire les sections
  const lines = content.split('\n');
  let currentSection: DOCXSection | null = null;
  let currentContent: string[] = [];
  
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch) {
      // Sauvegarder la section précédente
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
      }
      
      // Créer une nouvelle section
      const level = headingMatch[1].length;
      if (level <= maxHeadingLevel) {
        currentSection = {
          title: headingMatch[2],
          level,
          content: '',
          subsections: []
        };
        currentContent = [];
      }
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  
  // Ajouter la dernière section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * Exporte une conversation au format DOCX
 */
export function exportConversationToDOCX(
  messages: ChatMessage[],
  options: ExportDOCXOptions = {}
): string {
  const {
    includeMetadata = true,
    includeTimestamps = true,
    includeCitations = true,
    customTitle = 'Conversation WordCraft IA',
    includeTableOfContents = true,
    template = 'professional',
    fontSize = 11,
    fontFamily = 'Calibri',
    lineSpacing = 1.15,
    margins = 'normal',
    orientation = 'portrait'
  } = options;

  // Générer le contenu DOCX en format XML
  let docxContent = generateDOCXHeader(customTitle, template, fontSize, fontFamily, lineSpacing, margins, orientation);
  
  // Ajouter les métadonnées
  if (includeMetadata) {
    docxContent += generateDOCXMetadata(messages, customTitle);
  }
  
  // Ajouter la table des matières
  if (includeTableOfContents) {
    docxContent += generateDOCXTableOfContents(messages);
  }
  
  // Ajouter les messages
  messages.forEach((message, index) => {
    if (message.role === 'user') {
      docxContent += generateDOCXUserMessage(message, index, includeTimestamps, includeCitations);
    } else if (message.role === 'assistant') {
      docxContent += generateDOCXAssistantMessage(message, index, includeTimestamps, includeCitations);
    }
  });
  
  // Fermer le document
  docxContent += generateDOCXFooter();
  
  return docxContent;
}

/**
 * Exporte un document au format DOCX
 */
export function exportDocumentToDOCX(
  content: string,
  title: string,
  options: ExportDOCXOptions = {}
): string {
  const {
    includeMetadata = true,
    includeTableOfContents = true,
    template = 'professional',
    fontSize = 11,
    fontFamily = 'Calibri',
    lineSpacing = 1.15,
    margins = 'normal',
    orientation = 'portrait'
  } = options;

  let docxContent = generateDOCXHeader(title, template, fontSize, fontFamily, lineSpacing, margins, orientation);
  
  if (includeMetadata) {
    docxContent += generateDocumentMetadata(title, content);
  }
  
  if (includeTableOfContents) {
    const sections = convertToDOCXStructure(content, options);
    docxContent += generateDOCXDocumentTableOfContents(sections);
  }
  
  // Ajouter le contenu structuré
  docxContent += generateDOCXDocumentContent(content, options);
  
  docxContent += generateDOCXFooter();
  
  return docxContent;
}

/**
 * Génère l'en-tête du document DOCX
 */
function generateDOCXHeader(
  title: string,
  template: string,
  fontSize: number,
  fontFamily: string,
  lineSpacing: number,
  margins: string,
  orientation: string
): string {
  const marginValues = {
    normal: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
    narrow: { top: 720, right: 720, bottom: 720, left: 720 },
    wide: { top: 2160, right: 2160, bottom: 2160, left: 2160 }
  };
  
  const margin = marginValues[margins as keyof typeof marginValues] || marginValues.normal;
  const orientationValue = orientation === 'landscape' ? 'landscape' : 'portrait';
  
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840" w:orient="${orientationValue}" />
      <w:pgMar w:top="${margin.top}" w:right="${margin.right}" w:bottom="${margin.bottom}" w:left="${margin.left}" w:header="720" w:footer="720" w:gutter="0" />
      <w:cols w:space="720" />
      <w:docGrid w:linePitch="360" />
    </w:sectPr>
    <w:p>
      <w:pPr>
        <w:jc w:val="center" />
        <w:spacing w:before="240" w:after="240" />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b />
          <w:sz w:val="${fontSize * 2}" />
          <w:color w:val="2E74B5" />
        </w:rPr>
        <w:t>${title}</w:t>
      </w:r>
    </w:p>`;
}

/**
 * Génère les métadonnées pour une conversation
 */
function generateDOCXMetadata(messages: ChatMessage[], title: string): string {
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  const now = new Date().toLocaleString('fr-FR');
  
  return `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Metadata" />
        <w:spacing w:before="120" w:after="120" />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b />
          <w:sz w:val="20" />
        </w:rPr>
        <w:t>Métadonnées du document</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Titre : ${title}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Date de génération : ${now}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Généré par : WordCraft IA</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Nombre de questions : ${userMessages.length}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Nombre de réponses : ${assistantMessages.length}</w:t>
      </w:r>
    </w:p>`;
}

/**
 * Génère les métadonnées pour un document
 */
function generateDocumentMetadata(title: string, content: string): string {
  const wordCount = content.split(/\s+/).length;
  const now = new Date().toLocaleString('fr-FR');
  
  return `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Metadata" />
        <w:spacing w:before="120" w:after="120" />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b />
          <w:sz w:val="20" />
        </w:rPr>
        <w:t>Informations du document</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Titre : ${title}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Date de génération : ${now}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Généré par : WordCraft IA</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Nombre de mots : ${wordCount}</w:t>
      </w:r>
    </w:p>`;
}

/**
 * Génère la table des matières pour une conversation
 */
function generateDOCXTableOfContents(messages: ChatMessage[]): string {
  let toc = `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="TOCHeading" />
        <w:spacing w:before="240" w:after="120" />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b />
          <w:sz w:val="24" />
        </w:rPr>
        <w:t>Sommaire de la conversation</w:t>
      </w:r>
    </w:p>`;
  
  messages.forEach((message, index) => {
    if (message.role === 'user') {
      const questionPreview = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
      toc += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="TOC1" />
        <w:tabs>
          <w:tab w:val="right" w:leader="dot" w:pos="8640" />
        </w:tabs>
      </w:pPr>
      <w:r>
        <w:t>${index + 1}. ${questionPreview}</w:t>
      </w:r>
      <w:tab />
      <w:r>
        <w:t>${index + 1}</w:t>
      </w:r>
    </w:p>`;
    }
  });
  
  return toc;
}

/**
 * Génère la table des matières pour un document
 */
function generateDOCXDocumentTableOfContents(sections: DOCXSection[]): string {
  let toc = `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="TOCHeading" />
        <w:spacing w:before="240" w:after="120" />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b />
          <w:sz w:val="24" />
        </w:rPr>
        <w:t>Table des matières</w:t>
      </w:r>
    </w:p>`;
  
  sections.forEach((section, index) => {
    const indent = '  '.repeat(section.level - 1);
    toc += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="TOC${section.level}" />
        <w:ind w:left="${(section.level - 1) * 720}" />
        <w:tabs>
          <w:tab w:val="right" w:leader="dot" w:pos="8640" />
        </w:tabs>
      </w:pPr>
      <w:r>
        <w:t>${indent}${section.title}</w:t>
      </w:r>
      <w:tab />
      <w:r>
        <w:t>${index + 1}</w:t>
      </w:r>
    </w:p>`;
  });
  
  return toc;
}

/**
 * Génère un message utilisateur au format DOCX
 */
function generateDOCXUserMessage(
  message: ChatMessage,
  index: number,
  includeTimestamps: boolean,
  includeCitations: boolean
): string {
  let content = `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="UserMessage" />
        <w:spacing w:before="240" w:after="120" />
        <w:keepNext />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b />
          <w:sz w:val="22" />
          <w:color w:val="2E74B5" />
        </w:rPr>
        <w:t>💬 Question ${index + 1}</w:t>
      </w:r>
    </w:p>`;
  
  if (includeTimestamps && message.timestamp) {
    content += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Timestamp" />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i />
          <w:sz w:val="18" />
          <w:color w:val="666666" />
        </w:rPr>
        <w:t>Posté le : ${message.timestamp.toLocaleString('fr-FR')}</w:t>
      </w:r>
    </w:p>`;
  }
  
  // Ajouter le contenu du message
  const paragraphs = message.content.split('\n\n');
  paragraphs.forEach(paragraph => {
    content += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Normal" />
        <w:spacing w:after="120" />
      </w:pPr>
      <w:r>
        <w:t>${paragraph}</w:t>
      </w:r>
    </w:p>`;
  });
  
  // Ajouter les citations
  if (includeCitations && message.citations && message.citations.length > 0) {
    content += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="CitationHeading" />
        <w:spacing w:before="180" w:after="60" />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b />
          <w:sz w:val="20" />
        </w:rPr>
        <w:t>📚 Sources</w:t>
      </w:r>
    </w:p>`;
    
    message.citations.forEach((citation, citationIndex) => {
      content += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Citation" />
        <w:ind w:left="720" />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b />
        </w:rPr>
        <w:t>${citationIndex + 1}. ${citation.documentName}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="CitationQuote" />
        <w:ind w:left="1440" />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i />
          <w:color w:val="666666" />
        </w:rPr>
        <w:t>${citation.excerpt}</w:t>
      </w:r>
    </w:p>`;
    });
  }
  
  return content;
}

/**
 * Génère un message assistant au format DOCX
 */
function generateDOCXAssistantMessage(
  message: ChatMessage,
  index: number,
  includeTimestamps: boolean,
  includeCitations: boolean
): string {
  let content = `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="AssistantMessage" />
        <w:spacing w:before="240" w:after="120" />
        <w:keepNext />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b />
          <w:sz w:val="22" />
          <w:color w:val="70AD47" />
        </w:rPr>
        <w:t>🤖 Réponse IA ${index + 1}</w:t>
      </w:r>
    </w:p>`;
  
  if (includeTimestamps && message.timestamp) {
    content += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Timestamp" />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i />
          <w:sz w:val="18" />
          <w:color w:val="666666" />
        </w:rPr>
        <w:t>Généré le : ${message.timestamp.toLocaleString('fr-FR')}</w:t>
      </w:r>
    </w:p>`;
  }
  
  // Ajouter le contenu du message
  const paragraphs = message.content.split('\n\n');
  paragraphs.forEach(paragraph => {
    content += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Normal" />
        <w:spacing w:after="120" />
      </w:pPr>
      <w:r>
        <w:t>${paragraph}</w:t>
      </w:r>
    </w:p>`;
  });
  
  // Ajouter les citations
  if (includeCitations && message.citations && message.citations.length > 0) {
    content += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="CitationHeading" />
        <w:spacing w:before="180" w:after="60" />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b />
          <w:sz w:val="20" />
        </w:rPr>
        <w:t>📚 Sources citées</w:t>
      </w:r>
    </w:p>`;
    
    message.citations.forEach((citation, citationIndex) => {
      content += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Citation" />
        <w:ind w:left="720" />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b />
        </w:rPr>
        <w:t>${citationIndex + 1}. ${citation.documentName}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="CitationQuote" />
        <w:ind w:left="1440" />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i />
          <w:color w:val="666666" />
        </w:rPr>
        <w:t>${citation.excerpt}</w:t>
      </w:r>
    </w:p>`;
    });
  }
  
  return content;
}

/**
 * Génère le contenu d'un document au format DOCX
 */
function generateDOCXDocumentContent(content: string, options: ExportDOCXOptions): string {
  const sections = convertToDOCXStructure(content, options);
  let docxContent = '';
  
  sections.forEach(section => {
    const headingSize = Math.max(22 - (section.level - 1) * 2, 16);
    docxContent += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading${section.level}" />
        <w:spacing w:before="240" w:after="120" />
        <w:keepNext />
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b />
          <w:sz w:val="${headingSize * 2}" />
          <w:color w:val="2E74B5" />
        </w:rPr>
        <w:t>${section.title}</w:t>
      </w:r>
    </w:p>`;
    
    // Ajouter le contenu de la section
    const paragraphs = section.content.split('\n\n');
    paragraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        docxContent += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Normal" />
        <w:spacing w:after="120" />
      </w:pPr>
      <w:r>
        <w:t>${paragraph}</w:t>
      </w:r>
    </w:p>`;
      }
    });
  });
  
  return docxContent;
}

/**
 * Génère le pied de page du document DOCX
 */
function generateDOCXFooter(): string {
  return `
  </w:body>
</w:document>`;
}

/**
 * Télécharge le contenu DOCX en tant que fichier
 */
export function downloadDOCXFile(content: string, filename: string): void {
  // Pour l'instant, nous allons créer un fichier XML simple
  // Dans une implémentation complète, il faudrait utiliser une bibliothèque comme docx.js
  const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.docx`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Crée un fichier DOCX avec une bibliothèque externe (placeholder pour future implémentation)
 */
export async function createDOCXWithLibrary(
  content: string,
  options: ExportDOCXOptions = {}
): Promise<Blob> {
  // Placeholder pour l'intégration avec une bibliothèque DOCX comme docx.js ou docxtemplater
  // Pour l'instant, nous retournons une implémentation simplifiée
  
  const docxContent = typeof content === 'string' 
    ? content 
    : exportDocumentToDOCX(content, options.customTitle || 'Document', options);
  
  return new Blob([docxContent], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
}
