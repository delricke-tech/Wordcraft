/**
 * Service de navigation dans les sources avec highlight
 * 
 * Ce service gère la navigation vers les documents sources
 * avec mise en évidence des passages cités et positionnement
 * 
 * Date: 11 mars 2026
 */

import type { DocumentContext } from './openaiService';
import type { Citation, EnhancedCitation } from './citationService';

export interface SourceNavigationOptions {
  highlightColor?: string;
  scrollBehavior?: 'smooth' | 'auto' | 'instant';
  showContextLines?: number;
  enableTextSelection?: boolean;
  autoExpand?: boolean;
}

export interface HighlightedPosition {
  start: number;
  end: number;
  color: string;
  id: string;
  citationId: string;
}

export interface NavigationResult {
  success: boolean;
  documentId: string;
  position?: { start: number; end: number };
  highlightedText?: string;
  contextBefore?: string;
  contextAfter?: string;
  error?: string;
}

class SourceNavigationService {
  private readonly DEFAULT_OPTIONS: SourceNavigationOptions = {
    highlightColor: '#3B82F6',
    scrollBehavior: 'smooth',
    showContextLines: 3,
    enableTextSelection: true,
    autoExpand: true
  };

  private activeHighlights: Map<string, HighlightedPosition[]> = new Map();
  private navigationHistory: Array<{
    documentId: string;
    position: { start: number; end: number };
    timestamp: number;
  }> = [];

  /**
   * Navigue vers une position spécifique dans un document
   */
  async navigateToSource(
    documentId: string,
    position: { start: number; end: number },
    options: SourceNavigationOptions = {}
  ): Promise<NavigationResult> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    console.log('🔗 ===== NAVIGATION VERS SOURCE =====');
    console.log('  - Document ID:', documentId);
    console.log('  - Position:', position);
    console.log('  - Couleur highlight:', mergedOptions.highlightColor);

    try {
      // Récupérer le contexte du document
      const documentContext = await this.getDocumentContext(documentId);
      if (!documentContext) {
        return {
          success: false,
          documentId,
          error: 'Document non trouvé'
        };
      }

      // Extraire le texte à mettre en évidence
      const highlightedText = this.extractHighlightedText(
        documentContext.extractedText || '',
        position
      );

      // Extraire le contexte avant et après
      const { contextBefore, contextAfter } = this.extractContext(
        documentContext.extractedText || '',
        position,
        mergedOptions.showContextLines || 3
      );

      // Appliquer le highlight
      this.applyHighlight(documentId, position, mergedOptions);

      // Ajouter à l'historique de navigation
      this.addToHistory(documentId, position);

      // Scroller vers la position
      await this.scrollToPosition(documentId, position, mergedOptions);

      console.log('✅ Navigation réussie vers la source');
      
      return {
        success: true,
        documentId,
        position,
        highlightedText,
        contextBefore,
        contextAfter
      };

    } catch (error) {
      console.error('❌ Erreur navigation source:', error);
      return {
        success: false,
        documentId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Navigue vers une citation spécifique
   */
  async navigateToCitation(
    citation: Citation | EnhancedCitation,
    documents: DocumentContext[],
    options: SourceNavigationOptions = {}
  ): Promise<NavigationResult> {
    // Trouver le document correspondant
    const document = documents.find(doc => 
      doc.documentId === citation.documentId || 
      doc.documentName === (citation as any).documentName
    );

    if (!document) {
      return {
        success: false,
        documentId: citation.documentId,
        error: 'Document correspondant non trouvé'
      };
    }

    // Extraire la position de la citation
    let position: { start: number; end: number };

    if ('positionStart' in citation && citation.positionStart !== undefined) {
      position = {
        start: citation.positionStart,
        end: citation.positionEnd || citation.positionStart + citation.excerpt.length
      };
    } else {
      // Chercher la position dans le texte du document
      position = this.findCitationPosition(citation.excerpt, document.extractedText || '');
    }

    if (position.start === -1) {
      return {
        success: false,
        documentId: document.documentId,
        error: 'Position de citation non trouvée dans le document'
      };
    }

    return this.navigateToSource(document.documentId, position, options);
  }

  /**
   * Trouve la position d'un texte dans un document
   */
  private findCitationPosition(excerpt: string, documentText: string): { start: number; end: number } {
    // Nettoyer le texte pour la recherche
    const cleanExcerpt = excerpt
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const cleanDocument = documentText
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const index = cleanDocument.indexOf(cleanExcerpt);
    
    if (index === -1) {
      // Essayer avec une recherche partielle
      const words = cleanExcerpt.split(' ').slice(0, 5).join(' ');
      const partialIndex = cleanDocument.indexOf(words);
      
      if (partialIndex !== -1) {
        return {
          start: partialIndex,
          end: partialIndex + words.length
        };
      }
      
      return { start: -1, end: -1 };
    }

    return {
      start: index,
      end: index + cleanExcerpt.length
    };
  }

  /**
   * Extrait le texte mis en évidence
   */
  private extractHighlightedText(
    documentText: string,
    position: { start: number; end: number }
  ): string {
    return documentText.slice(position.start, position.end);
  }

  /**
   * Extrait le contexte avant et après
   */
  private extractContext(
    documentText: string,
    position: { start: number; end: number },
    contextLines: number
  ): { contextBefore: string; contextAfter: string } {
    const lines = documentText.split('\n');
    
    // Trouver les lignes correspondant à la position
    let currentPos = 0;
    let startLine = 0;
    let endLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1; // +1 pour le \n
      
      if (currentPos <= position.start && currentPos + lineLength > position.start) {
        startLine = i;
      }
      
      if (currentPos <= position.end && currentPos + lineLength > position.end) {
        endLine = i;
        break;
      }
      
      currentPos += lineLength;
    }

    // Extraire le contexte
    const contextStart = Math.max(0, startLine - contextLines);
    const contextEnd = Math.min(lines.length - 1, endLine + contextLines);

    const contextBefore = lines.slice(contextStart, startLine).join('\n');
    const contextAfter = lines.slice(endLine + 1, contextEnd + 1).join('\n');

    return {
      contextBefore: contextBefore.trim(),
      contextAfter: contextAfter.trim()
    };
  }

  /**
   * Applique le highlight au texte
   */
  private applyHighlight(
    documentId: string,
    position: { start: number; end: number },
    options: SourceNavigationOptions
  ): void {
    const highlight: HighlightedPosition = {
      start: position.start,
      end: position.end,
      color: options.highlightColor || this.DEFAULT_OPTIONS.highlightColor!,
      id: `highlight-${Date.now()}`,
      citationId: `citation-${documentId}-${position.start}`
    };

    // Nettoyer les anciens highlights pour ce document
    if (!this.activeHighlights.has(documentId)) {
      this.activeHighlights.set(documentId, []);
    }

    const highlights = this.activeHighlights.get(documentId)!;
    highlights.push(highlight);

    // Limiter le nombre de highlights
    if (highlights.length > 10) {
      highlights.shift();
    }

    console.log(`🎨 Highlight appliqué: ${highlight.id}`);
  }

  /**
   * Scrolle vers la position spécifiée
   */
  private async scrollToPosition(
    documentId: string,
    position: { start: number; end: number },
    options: SourceNavigationOptions
  ): Promise<void> {
    // Simuler le scroll (dans une vraie implémentation, cela interagirait avec le DOM)
    console.log(`📍 Scroll vers position ${position.start}-${position.end} dans ${documentId}`);
    
    // Attendre un peu pour l'animation
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  /**
   * Récupère le contexte d'un document
   */
  private async getDocumentContext(documentId: string): Promise<DocumentContext | null> {
    // Dans une vraie implémentation, cela récupérerait depuis le store ou une API
    // Pour l'instant, retourner null pour simuler
    console.log(`📄 Récupération du contexte du document: ${documentId}`);
    return null;
  }

  /**
   * Ajoute à l'historique de navigation
   */
  private addToHistory(
    documentId: string,
    position: { start: number; end: number }
  ): void {
    this.navigationHistory.push({
      documentId,
      position,
      timestamp: Date.now()
    });

    // Limiter l'historique
    if (this.navigationHistory.length > 50) {
      this.navigationHistory.shift();
    }
  }

  /**
   * Obtient tous les highlights pour un document
   */
  getHighlights(documentId: string): HighlightedPosition[] {
    return this.activeHighlights.get(documentId) || [];
  }

  /**
   * Supprime tous les highlights pour un document
   */
  clearHighlights(documentId: string): void {
    this.activeHighlights.delete(documentId);
    console.log(`🧹 Highlights supprimés pour: ${documentId}`);
  }

  /**
   * Supprime un highlight spécifique
   */
  removeHighlight(documentId: string, highlightId: string): void {
    const highlights = this.activeHighlights.get(documentId);
    if (highlights) {
      const index = highlights.findIndex(h => h.id === highlightId);
      if (index !== -1) {
        highlights.splice(index, 1);
        console.log(`🗑️ Highlight supprimé: ${highlightId}`);
      }
    }
  }

  /**
   * Obtient l'historique de navigation
   */
  getNavigationHistory(): Array<{
    documentId: string;
    position: { start: number; end: number };
    timestamp: number;
  }> {
    return [...this.navigationHistory];
  }

  /**
   * Recherche dans l'historique
   */
  searchHistory(documentId?: string): Array<{
    documentId: string;
    position: { start: number; end: number };
    timestamp: number;
  }> {
    let history = [...this.navigationHistory];
    
    if (documentId) {
      history = history.filter(item => item.documentId === documentId);
    }
    
    return history.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Génère un lien permanent vers une position
   */
  generatePermalink(
    documentId: string,
    position: { start: number; end: number }
  ): string {
    const params = new URLSearchParams({
      doc: documentId,
      start: position.start.toString(),
      end: position.end.toString()
    });
    
    return `#/source?${params.toString()}`;
  }

  /**
   * Parse un lien permanent
   */
  parsePermalink(url: string): {
    documentId: string;
    position: { start: number; end: number };
  } | null {
    try {
      const urlObj = new URL(url, window.location.origin);
      const params = urlObj.searchParams;
      
      const doc = params.get('doc');
      const start = params.get('start');
      const end = params.get('end');
      
      if (!doc || !start || !end) {
        return null;
      }
      
      return {
        documentId: doc,
        position: {
          start: parseInt(start),
          end: parseInt(end)
        }
      };
    } catch {
      return null;
    }
  }

  /**
   * Exporte les highlights au format Markdown
   */
  exportHighlightsMarkdown(documentId: string): string {
    const highlights = this.getHighlights(documentId);
    
    if (highlights.length === 0) {
      return 'Aucun highlight à exporter.';
    }
    
    let markdown = `# Highlights - Document: ${documentId}\n\n`;
    
    highlights.forEach((highlight, index) => {
      markdown += `## Highlight ${index + 1}\n\n`;
      markdown += `**Position:** ${highlight.start}-${highlight.end}\n`;
      markdown += `**Couleur:** ${highlight.color}\n`;
      markdown += `**ID:** ${highlight.id}\n\n`;
      markdown += `> ${highlight.citationId}\n\n`;
    });
    
    return markdown;
  }

  /**
   * Statistiques d'utilisation
   */
  getStatistics(): {
    totalHighlights: number;
    documentsWithHighlights: number;
    navigationHistorySize: number;
    mostAccessedDocument: string | null;
  } {
    const totalHighlights = Array.from(this.activeHighlights.values())
      .reduce((sum, highlights) => sum + highlights.length, 0);
    
    const documentsWithHighlights = this.activeHighlights.size;
    
    const documentCounts = new Map<string, number>();
    this.navigationHistory.forEach(item => {
      documentCounts.set(item.documentId, (documentCounts.get(item.documentId) || 0) + 1);
    });
    
    const mostAccessedDocument = documentCounts.size > 0
      ? Array.from(documentCounts.entries())
          .sort(([, a], [, b]) => b - a)[0][0]
      : null;
    
    return {
      totalHighlights,
      documentsWithHighlights,
      navigationHistorySize: this.navigationHistory.length,
      mostAccessedDocument
    };
  }
}

// Instance singleton
export const sourceNavigationService = new SourceNavigationService();

// Export des fonctions utilitaires
export const navigateToSource = (
  documentId: string,
  position: { start: number; end: number },
  options?: SourceNavigationOptions
) => sourceNavigationService.navigateToSource(documentId, position, options);

export const navigateToCitation = (
  citation: Citation | EnhancedCitation,
  documents: DocumentContext[],
  options?: SourceNavigationOptions
) => sourceNavigationService.navigateToCitation(citation, documents, options);

export const getHighlights = (documentId: string) => 
  sourceNavigationService.getHighlights(documentId);

export const clearHighlights = (documentId: string) => 
  sourceNavigationService.clearHighlights(documentId);

export const getNavigationHistory = () => 
  sourceNavigationService.getNavigationHistory();
