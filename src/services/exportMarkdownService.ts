/**
 * Service pour l'export Markdown avancé
 * Permet d'exporter des conversations et documents avec formatage professionnel
 */

import { ChatMessage } from './openaiService';

export interface ExportMarkdownOptions {
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
  includeCitations?: boolean;
  customTitle?: string;
  includeTableOfContents?: boolean;
  maxHeadingLevel?: number;
  codeTheme?: 'light' | 'dark';
  includeWordCount?: boolean;
  format?: 'github' | 'academic' | 'professional';
}

export interface ExportSection {
  title: string;
  level: number;
  content: string;
  subsections?: ExportSection[];
}

/**
 * Convertit le texte Markdown en formatage professionnel
 */
export function formatMarkdownForExport(
  content: string,
  options: ExportMarkdownOptions = {}
): string {
  const {
    includeMetadata = true,
    includeTimestamps = true,
    includeCitations = true,
    customTitle = 'Document WordCraft IA',
    includeTableOfContents = true,
    maxHeadingLevel = 3,
    codeTheme = 'dark',
    includeWordCount = true,
    format = 'professional'
  } = options;

  let formattedContent = content;

  // Appliquer le formatage selon le style choisi
  switch (format) {
    case 'github':
      formattedContent = applyGitHubMarkdownFormat(formattedContent, codeTheme);
      break;
    case 'academic':
      formattedContent = applyAcademicMarkdownFormat(formattedContent);
      break;
    case 'professional':
    default:
      formattedContent = applyProfessionalMarkdownFormat(formattedContent, codeTheme);
      break;
  }

  // Ajouter les métadonnées
  if (includeMetadata) {
    formattedContent = addMarkdownMetadata(formattedContent, customTitle, includeWordCount);
  }

  // Ajouter la table des matières
  if (includeTableOfContents) {
    const toc = generateTableOfContents(formattedContent, maxHeadingLevel);
    formattedContent = toc + '\n\n' + formattedContent;
  }

  return formattedContent;
}

/**
 * Exporte une conversation au format Markdown
 */
export function exportConversationToMarkdown(
  messages: ChatMessage[],
  options: ExportMarkdownOptions = {}
): string {
  const {
    includeMetadata = true,
    includeTimestamps = true,
    includeCitations = true,
    customTitle = 'Conversation WordCraft IA',
    includeTableOfContents = true,
    format = 'professional'
  } = options;

  let markdownContent = `# ${customTitle}\n\n`;

  if (includeMetadata) {
    const metadata = generateConversationMetadata(messages);
    markdownContent += metadata + '\n\n';
  }

  if (includeTableOfContents) {
    const toc = generateConversationTableOfContents(messages);
    markdownContent += toc + '\n\n---\n\n';
  }

  // Ajouter les messages
  messages.forEach((message, index) => {
    if (message.role === 'user') {
      markdownContent += `## 💬 Question ${index + 1}\n\n`;
      
      if (includeTimestamps && message.timestamp) {
        markdownContent += `*Posté le : ${message.timestamp.toLocaleString('fr-FR')}*\n\n`;
      }
      
      markdownContent += `${message.content}\n\n`;
      
      // Ajouter les citations si présentes
      if (includeCitations && message.citations && message.citations.length > 0) {
        markdownContent += '### 📚 Sources\n\n';
        message.citations.forEach((citation, citationIndex) => {
          markdownContent += `${citationIndex + 1}. **${citation.documentName}**\n`;
          markdownContent += `> ${citation.excerpt}\n\n`;
        });
        markdownContent += '---\n\n';
      }
    } else if (message.role === 'assistant') {
      markdownContent += `## 🤖 Réponse IA ${index + 1}\n\n`;
      
      if (includeTimestamps && message.timestamp) {
        markdownContent += `*Généré le : ${message.timestamp.toLocaleString('fr-FR')}*\n\n`;
      }
      
      markdownContent += `${message.content}\n\n`;
      
      // Ajouter les citations si présentes
      if (includeCitations && message.citations && message.citations.length > 0) {
        markdownContent += '### 📚 Sources citées\n\n';
        message.citations.forEach((citation, citationIndex) => {
          markdownContent += `${citationIndex + 1}. **${citation.documentName}**\n`;
          markdownContent += `> ${citation.excerpt}\n\n`;
        });
        markdownContent += '---\n\n';
      }
    }
  });

  // Appliquer le formatage final
  return formatMarkdownForExport(markdownContent, options);
}

/**
 * Applique le formatage GitHub au Markdown
 */
function applyGitHubMarkdownFormat(content: string, codeTheme: string): string {
  // Améliorer les blocs de code
  content = content.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
    const language = lang || '';
    return `\`\`\`${language}\n${code}\`\`\``;
  });

  // Améliorer les liens
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1]($2)');

  // Améliorer les listes
  content = content.replace(/^(\s*)[-*+]\s/gm, '$1- ');

  return content;
}

/**
 * Applique le formatage académique au Markdown
 */
function applyAcademicMarkdownFormat(content: string): string {
  // Ajouter des numéros de section automatiques
  let sectionNumber = 1;
  content = content.replace(/^#{1,6}\s+(.+)$/gm, (match) => {
    return `${sectionNumber++}. ${match}`;
  });

  // Améliorer les citations
  content = content.replace(/^>\s(.+)$/gm, '> [$1]');

  // Ajouter des références académiques
  if (!content.includes('## Références')) {
    content += '\n\n## Références\n\n*À compléter selon les besoins*';
  }

  return content;
}

/**
 * Applique le formatage professionnel au Markdown
 */
function applyProfessionalMarkdownFormat(content: string, codeTheme: string): string {
  // Nettoyer et structurer le contenu
  content = content.replace(/\n{3,}/g, '\n\n'); // Réduire les sauts de ligne excessifs
  
  // Améliorer les titres
  content = content.replace(/^#{1,6}\s+(.+)$/gm, (match) => {
    const level = match.match(/^#+/)?.[0].length || 1;
    const emoji = getHeadingEmoji(level);
    return `${'#'.repeat(level)} ${emoji} ${match.replace(/^#+\s+/, '')}`;
  });

  // Améliorer les blocs de code avec thème
  content = content.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
    const language = lang || 'text';
    const themeClass = codeTheme === 'dark' ? 'github-dark' : 'github';
    return `\`\`\`${language}\n${code}\`\`\``;
  });

  // Améliorer les tableaux
  content = content.replace(/\|(.+)\|/g, (match) => {
    return `| ${match.split('|').map(cell => cell.trim()).join(' | ')} |`;
  });

  return content;
}

/**
 * Ajoute les métadonnées au document Markdown
 */
function addMarkdownMetadata(content: string, title: string, includeWordCount: boolean): string {
  const now = new Date().toLocaleString('fr-FR');
  const wordCount = content.split(/\s+/).length;
  
  let metadata = `---\n`;
  metadata += `titre: ${title}\n`;
  metadata += `date: ${now}\n`;
  metadata += `généré par: WordCraft IA\n`;
  metadata += `format: Markdown\n`;
  
  if (includeWordCount) {
    metadata += `mots: ${wordCount}\n`;
  }
  
  metadata += `---\n\n`;
  
  return metadata + content;
}

/**
 * Génère une table des matières à partir des titres
 */
function generateTableOfContents(content: string, maxLevel: number): string {
  const headings = content.match(/^#{1,${maxLevel}}\s+(.+)$/gm) || [];
  
  if (headings.length === 0) {
    return '';
  }

  let toc = '## 📋 Table des matières\n\n';
  
  headings.forEach((heading, index) => {
    const level = heading.match(/^#+/)?.[0].length || 1;
    const title = heading.replace(/^#+\s+/, '');
    const indent = '  '.repeat(level - 1);
    const anchor = title.toLowerCase().replace(/[^\w\s-]/g, '-');
    
    toc += `${indent}${index + 1}. [${title}](#${anchor})\n`;
  });
  
  return toc;
}

/**
 * Génère une table des matières pour une conversation
 */
function generateConversationTableOfContents(messages: ChatMessage[]): string {
  let toc = '## 📋 Sommaire de la conversation\n\n';
  
  messages.forEach((message, index) => {
    if (message.role === 'user') {
      const questionPreview = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
      toc += `${index + 1}. [${questionPreview}](#question-${index})\n`;
    }
  });
  
  return toc;
}

/**
 * Génère les métadonnées d'une conversation
 */
function generateConversationMetadata(messages: ChatMessage[]): string {
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  
  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];
  
  let metadata = `---\n`;
  metadata += `type: conversation\n`;
  metadata += `questions: ${userMessages.length}\n`;
  metadata += `réponses: ${assistantMessages.length}\n`;
  
  if (firstMessage?.timestamp) {
    metadata += `début: ${firstMessage.timestamp.toLocaleString('fr-FR')}\n`;
  }
  
  if (lastMessage?.timestamp) {
    metadata += `fin: ${lastMessage.timestamp.toLocaleString('fr-FR')}\n`;
  }
  
  metadata += `généré par: WordCraft IA\n`;
  metadata += `format: Markdown\n`;
  metadata += `---\n\n`;
  
  return metadata;
}

/**
 * Retourne un emoji approprié pour le niveau de titre
 */
function getHeadingEmoji(level: number): string {
  const emojis = ['', '📌', '📝', '📚', '📖', '📄', '📃'];
  return emojis[level] || '📌';
}

/**
 * Télécharge le contenu Markdown en tant que fichier
 */
export function downloadMarkdownFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.md`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Prévisualise le Markdown dans une nouvelle fenêtre
 */
export function previewMarkdown(content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  window.open(url, '_blank');
  
  // Nettoyer après 5 minutes
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 5 * 60 * 1000);
}
