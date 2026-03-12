/**
 * Service pour l'export PDF avancé
 * Permet d'exporter des conversations et documents avec table des matières et mise en page professionnelle
 */

import { ChatMessage } from './openaiService';

export interface ExportPDFOptions {
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
  pageSize?: 'A4' | 'A3' | 'Letter' | 'Legal';
  tocDepth?: number;
  includeBookmarks?: boolean;
  watermark?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface PDFSection {
  title: string;
  level: number;
  content: string;
  pageNumber?: number;
  subsections?: PDFSection[];
}

/**
 * Convertit le contenu en structure PDF
 */
export function convertToPDFStructure(
  content: string,
  options: ExportPDFOptions = {}
): PDFSection[] {
  const { maxHeadingLevel = 3 } = options;
  const sections: PDFSection[] = [];
  
  // Analyser le contenu pour extraire les sections
  const lines = content.split('\n');
  let currentSection: PDFSection | null = null;
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
 * Exporte une conversation au format PDF
 */
export function exportConversationToPDF(
  messages: ChatMessage[],
  options: ExportPDFOptions = {}
): string {
  const {
    includeMetadata = true,
    includeTimestamps = true,
    includeCitations = true,
    customTitle = 'Conversation WordCraft IA',
    includeTableOfContents = true,
    template = 'professional',
    fontSize = 12,
    fontFamily = 'Helvetica',
    lineSpacing = 1.2,
    margins = 'normal',
    orientation = 'portrait',
    pageSize = 'A4',
    tocDepth = 3,
    includePageNumbers = true,
    includeHeader = true,
    includeFooter = true,
    textColor = '#000000',
    backgroundColor = '#ffffff'
  } = options;

  // Générer le contenu PDF en format HTML (pour conversion ultérieure)
  let pdfContent = generatePDFHeader(customTitle, template, fontSize, fontFamily, lineSpacing, margins, orientation, pageSize, textColor, backgroundColor);
  
  // Ajouter les métadonnées
  if (includeMetadata) {
    pdfContent += generatePDFMetadata(messages, customTitle);
  }
  
  // Ajouter la table des matières
  if (includeTableOfContents) {
    pdfContent += generatePDFTableOfContents(messages, tocDepth);
  }
  
  // Ajouter les messages
  messages.forEach((message, index) => {
    if (message.role === 'user') {
      pdfContent += generatePDFUserMessage(message, index, includeTimestamps, includeCitations, template);
    } else if (message.role === 'assistant') {
      pdfContent += generatePDFAssistantMessage(message, index, includeTimestamps, includeCitations, template);
    }
  });
  
  // Fermer le document
  pdfContent += generatePDFFooter(includePageNumbers, includeHeader, includeFooter, customTitle);
  
  return pdfContent;
}

/**
 * Exporte un document au format PDF
 */
export function exportDocumentToPDF(
  content: string,
  title: string,
  options: ExportPDFOptions = {}
): string {
  const {
    includeMetadata = true,
    includeTableOfContents = true,
    template = 'professional',
    fontSize = 12,
    fontFamily = 'Helvetica',
    lineSpacing = 1.2,
    margins = 'normal',
    orientation = 'portrait',
    pageSize = 'A4',
    tocDepth = 3,
    includePageNumbers = true,
    includeHeader = true,
    includeFooter = true,
    textColor = '#000000',
    backgroundColor = '#ffffff'
  } = options;

  let pdfContent = generatePDFHeader(title, template, fontSize, fontFamily, lineSpacing, margins, orientation, pageSize, textColor, backgroundColor);
  
  if (includeMetadata) {
    pdfContent += generateDocumentMetadata(title, content);
  }
  
  if (includeTableOfContents) {
    const sections = convertToPDFStructure(content, options);
    pdfContent += generatePDFDocumentTableOfContents(sections, tocDepth);
  }
  
  // Ajouter le contenu structuré
  pdfContent += generatePDFDocumentContent(content, options);
  
  pdfContent += generatePDFFooter(includePageNumbers, includeHeader, includeFooter, title);
  
  return pdfContent;
}

/**
 * Génère l'en-tête du document PDF
 */
function generatePDFHeader(
  title: string,
  template: string,
  fontSize: number,
  fontFamily: string,
  lineSpacing: number,
  margins: string,
  orientation: string,
  pageSize: string,
  textColor: string,
  backgroundColor: string
): string {
  const marginValues = {
    normal: { top: 20, right: 20, bottom: 20, left: 20 },
    narrow: { top: 10, right: 10, bottom: 10, left: 10 },
    wide: { top: 30, right: 30, bottom: 30, left: 30 }
  };
  
  const margin = marginValues[margins as keyof typeof marginValues] || marginValues.normal;
  const templateColors = {
    professional: { primary: '#2E74B5', secondary: '#70AD47', accent: '#FFC000' },
    academic: { primary: '#5B9BD5', secondary: '#A9D18E', accent: '#FFD966' },
    business: { primary: '#4472C4', secondary: '#70AD47', accent: '#FFC000' },
    modern: { primary: '#70AD47', secondary: '#5B9BD5', accent: '#ED7D31' }
  };
  
  const colors = templateColors[template as keyof typeof templateColors] || templateColors.professional;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      size: ${pageSize} ${orientation};
      margin: ${margin.top}mm ${margin.right}mm ${margin.bottom}mm ${margin.left}mm;
    }
    
    body {
      font-family: '${fontFamily}', Arial, sans-serif;
      font-size: ${fontSize}pt;
      line-height: ${lineSpacing};
      color: ${textColor};
      background-color: ${backgroundColor};
      margin: 0;
      padding: 0;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid ${colors.primary};
      padding-bottom: 20px;
    }
    
    .title {
      font-size: ${fontSize + 8}pt;
      font-weight: bold;
      color: ${colors.primary};
      margin-bottom: 10px;
    }
    
    .subtitle {
      font-size: ${fontSize + 2}pt;
      color: ${colors.secondary};
      font-style: italic;
    }
    
    .metadata {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      border-left: 4px solid ${colors.accent};
    }
    
    .toc {
      margin: 30px 0;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 5px;
      border: 1px solid #ddd;
    }
    
    .toc-title {
      font-size: ${fontSize + 4}pt;
      font-weight: bold;
      color: ${colors.primary};
      margin-bottom: 15px;
      text-align: center;
    }
    
    .toc-item {
      margin: 5px 0;
      padding: 3px 0;
    }
    
    .toc-level-1 {
      font-weight: bold;
      margin-left: 0;
    }
    
    .toc-level-2 {
      margin-left: 20px;
      font-weight: normal;
    }
    
    .toc-level-3 {
      margin-left: 40px;
      font-size: ${fontSize - 1}pt;
      font-style: italic;
    }
    
    .user-message {
      background-color: #e8f4f8;
      border-left: 4px solid ${colors.primary};
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 5px 5px 0;
    }
    
    .assistant-message {
      background-color: #f0f8e8;
      border-left: 4px solid ${colors.secondary};
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 5px 5px 0;
    }
    
    .message-header {
      font-weight: bold;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .timestamp {
      font-size: ${fontSize - 1}pt;
      color: #666;
      font-style: italic;
      margin-bottom: 10px;
    }
    
    .citations {
      margin-top: 15px;
      padding: 10px;
      background-color: #f9f9f9;
      border-radius: 3px;
      border-left: 3px solid ${colors.accent};
    }
    
    .citation-title {
      font-weight: bold;
      margin-bottom: 8px;
      color: ${colors.accent};
    }
    
    .citation-item {
      margin: 5px 0;
      padding: 5px;
      background-color: white;
      border-radius: 3px;
    }
    
    .citation-source {
      font-weight: bold;
      color: ${colors.primary};
    }
    
    .citation-excerpt {
      font-style: italic;
      color: #555;
      margin-left: 10px;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: ${fontSize - 1}pt;
      color: #666;
    }
    
    .page-number {
      text-align: center;
      margin-top: 20px;
      font-size: ${fontSize - 1}pt;
      color: #666;
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: ${colors.primary};
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    h1 { font-size: ${fontSize + 6}pt; }
    h2 { font-size: ${fontSize + 4}pt; }
    h3 { font-size: ${fontSize + 2}pt; }
    h4 { font-size: ${fontSize + 1}pt; }
    h5 { font-size: ${fontSize}pt; }
    h6 { font-size: ${fontSize - 1}pt; }
    
    p {
      margin: 10px 0;
      text-align: justify;
    }
    
    .content-section {
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    @media print {
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>`;
}

/**
 * Génère les métadonnées pour une conversation
 */
function generatePDFMetadata(messages: ChatMessage[], title: string): string {
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  const now = new Date().toLocaleString('fr-FR');
  
  return `
  <div class="metadata">
    <h2>Métadonnées du document</h2>
    <p><strong>Titre :</strong> ${title}</p>
    <p><strong>Date de génération :</strong> ${now}</p>
    <p><strong>Généré par :</strong> WordCraft IA</p>
    <p><strong>Nombre de questions :</strong> ${userMessages.length}</p>
    <p><strong>Nombre de réponses :</strong> ${assistantMessages.length}</p>
  </div>`;
}

/**
 * Génère les métadonnées pour un document
 */
function generateDocumentMetadata(title: string, content: string): string {
  const wordCount = content.split(/\s+/).length;
  const charCount = content.length;
  const now = new Date().toLocaleString('fr-FR');
  
  return `
  <div class="metadata">
    <h2>Informations du document</h2>
    <p><strong>Titre :</strong> ${title}</p>
    <p><strong>Date de génération :</strong> ${now}</p>
    <p><strong>Généré par :</strong> WordCraft IA</p>
    <p><strong>Nombre de mots :</strong> ${wordCount}</p>
    <p><strong>Nombre de caractères :</strong> ${charCount}</p>
  </div>`;
}

/**
 * Génère la table des matières pour une conversation
 */
function generatePDFTableOfContents(messages: ChatMessage[], depth: number): string {
  let toc = `
  <div class="toc">
    <div class="toc-title">Sommaire de la conversation</div>`;
  
  messages.forEach((message, index) => {
    if (message.role === 'user') {
      const questionPreview = message.content.substring(0, 60) + (message.content.length > 60 ? '...' : '');
      toc += `
    <div class="toc-item toc-level-1">
      ${index + 1}. ${questionPreview}
    </div>`;
    }
  });
  
  toc += `
  </div>`;
  
  return toc;
}

/**
 * Génère la table des matières pour un document
 */
function generatePDFDocumentTableOfContents(sections: PDFSection[], depth: number): string {
  let toc = `
  <div class="toc">
    <div class="toc-title">Table des matières</div>`;
  
  sections.forEach((section, index) => {
    if (section.level <= depth) {
      toc += `
    <div class="toc-item toc-level-${section.level}">
      ${index + 1}. ${section.title}
    </div>`;
      
      // Ajouter les sous-sections si nécessaire
      if (section.subsections && section.level < depth) {
        section.subsections.forEach((subsection, subIndex) => {
          if (subsection.level <= depth) {
            toc += `
    <div class="toc-item toc-level-${subsection.level}">
      ${index + 1}.${subIndex + 1} ${subsection.title}
    </div>`;
          }
        });
      }
    }
  });
  
  toc += `
  </div>`;
  
  return toc;
}

/**
 * Génère un message utilisateur au format PDF
 */
function generatePDFUserMessage(
  message: ChatMessage,
  index: number,
  includeTimestamps: boolean,
  includeCitations: boolean,
  template: string
): string {
  let content = `
  <div class="content-section">
    <div class="user-message">
      <div class="message-header">
        💬 Question ${index + 1}
      </div>`;
  
  if (includeTimestamps && message.timestamp) {
    content += `
      <div class="timestamp">
        Posté le : ${message.timestamp.toLocaleString('fr-FR')}
      </div>`;
  }
  
  // Ajouter le contenu du message
  content += `
      <div>${message.content.replace(/\n/g, '<br>')}</div>`;
  
  // Ajouter les citations
  if (includeCitations && message.citations && message.citations.length > 0) {
    content += `
      <div class="citations">
        <div class="citation-title">📚 Sources</div>`;
    
    message.citations.forEach((citation, citationIndex) => {
      content += `
        <div class="citation-item">
          <div class="citation-source">${citationIndex + 1}. ${citation.documentName}</div>
          <div class="citation-excerpt">${citation.excerpt}</div>
        </div>`;
    });
    
    content += `
      </div>`;
  }
  
  content += `
    </div>
  </div>`;
  
  return content;
}

/**
 * Génère un message assistant au format PDF
 */
function generatePDFAssistantMessage(
  message: ChatMessage,
  index: number,
  includeTimestamps: boolean,
  includeCitations: boolean,
  template: string
): string {
  let content = `
  <div class="content-section">
    <div class="assistant-message">
      <div class="message-header">
        🤖 Réponse IA ${index + 1}
      </div>`;
  
  if (includeTimestamps && message.timestamp) {
    content += `
      <div class="timestamp">
        Généré le : ${message.timestamp.toLocaleString('fr-FR')}
      </div>`;
  }
  
  // Ajouter le contenu du message
  content += `
      <div>${message.content.replace(/\n/g, '<br>')}</div>`;
  
  // Ajouter les citations
  if (includeCitations && message.citations && message.citations.length > 0) {
    content += `
      <div class="citations">
        <div class="citation-title">📚 Sources citées</div>`;
    
    message.citations.forEach((citation, citationIndex) => {
      content += `
        <div class="citation-item">
          <div class="citation-source">${citationIndex + 1}. ${citation.documentName}</div>
          <div class="citation-excerpt">${citation.excerpt}</div>
        </div>`;
    });
    
    content += `
      </div>`;
  }
  
  content += `
    </div>
  </div>`;
  
  return content;
}

/**
 * Génère le contenu d'un document au format PDF
 */
function generatePDFDocumentContent(content: string, options: ExportPDFOptions): string {
  const sections = convertToPDFStructure(content, options);
  let pdfContent = '';
  
  sections.forEach(section => {
    pdfContent += `
  <div class="content-section">
    <h${section.level}>${section.title}</h${section.level}>
    <div>${section.content.replace(/\n/g, '<br>')}</div>
  </div>`;
    
    // Ajouter les sous-sections
    if (section.subsections) {
      section.subsections.forEach(subsection => {
        pdfContent += `
  <div class="content-section">
    <h${subsection.level}>${subsection.title}</h${subsection.level}>
    <div>${subsection.content.replace(/\n/g, '<br>')}</div>
  </div>`;
      });
    }
  });
  
  return pdfContent;
}

/**
 * Génère le pied de page du document PDF
 */
function generatePDFFooter(
  includePageNumbers: boolean,
  includeHeader: boolean,
  includeFooter: boolean,
  title: string
): string {
  let footer = '';
  
  if (includeFooter) {
    footer += `
  <div class="footer">
    <p>Document généré par WordCraft IA</p>
    <p>${title}</p>
  </div>`;
  }
  
  if (includePageNumbers) {
    footer += `
  <div class="page-number">
    Page <span class="page-number"></span>
  </div>`;
  }
  
  footer += `
</body>
</html>`;
  
  return footer;
}

/**
 * Télécharge le contenu PDF en tant que fichier
 */
export async function downloadPDFFile(content: string, filename: string): Promise<void> {
  try {
    // Utiliser l'API de print du navigateur pour générer le PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      
      // Attendre que le contenu soit chargé
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
    
    // Alternative : utiliser une bibliothèque PDF comme jsPDF ou pdf-lib
    // Pour l'instant, nous utilisons la fonctionnalité native du navigateur
    
    // Afficher un message de succès
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    notification.textContent = `PDF "${filename}" prêt pour l'impression`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
    
  } catch (error) {
    console.error('❌ Erreur export PDF:', error);
    throw new Error('Erreur lors de la génération du PDF');
  }
}

/**
 * Crée un fichier PDF avec une bibliothèque externe (placeholder pour future implémentation)
 */
export async function createPDFWithLibrary(
  content: string,
  options: ExportPDFOptions = {}
): Promise<Blob> {
  // Placeholder pour l'intégration avec une bibliothèque PDF comme jsPDF ou pdf-lib
  // Pour l'instant, nous retournons une implémentation HTML-to-PDF
  
  const pdfContent = typeof content === 'string' 
    ? content 
    : exportDocumentToPDF(content, options.customTitle || 'Document', options);
  
  // Dans une implémentation complète, utiliser jsPDF ou pdf-lib ici
  return new Blob([pdfContent], { 
    type: 'application/pdf' 
  });
}

/**
 * Prévisualise le PDF dans une nouvelle fenêtre
 */
export function previewPDF(content: string): void {
  const previewWindow = window.open('', '_blank');
  if (previewWindow) {
    previewWindow.document.write(content);
    previewWindow.document.close();
  }
}

/**
 * Convertit le HTML en PDF en utilisant une bibliothèque externe
 */
export async function convertHTMLToPDF(htmlContent: string, options: ExportPDFOptions = {}): Promise<Blob> {
  // Placeholder pour l'intégration avec html2canvas + jsPDF
  // ou avec une API de conversion serveur
  
  return new Promise((resolve, reject) => {
    try {
      // Simulation de conversion
      setTimeout(() => {
        resolve(new Blob([htmlContent], { type: 'application/pdf' }));
      }, 1000);
    } catch (error) {
      reject(error);
    }
  });
}
