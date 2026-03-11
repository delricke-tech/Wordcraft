/**
 * Composant de prévisualisation de sources cliquables
 * 
 * Ce composant affiche des extraits de texte cliquables qui naviguent
 * vers les sources originales avec highlight et contexte
 * 
 * Date: 11 mars 2026
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { Citation, EnhancedCitation } from '../services/citationService';
import type { DocumentContext } from '../services/openaiService';

interface SourcePreviewProps {
  citations: (Citation | EnhancedCitation)[];
  documents: DocumentContext[];
  onSourceClick?: (documentId: string, position?: { start: number; end: number }) => void;
  showContext?: boolean;
  maxExcerptLength?: number;
  className?: string;
  highlightColor?: string;
  showDocumentInfo?: boolean;
}

interface PreviewItem {
  id: string;
  citation: Citation | EnhancedCitation;
  document: DocumentContext;
  excerpt: string;
  context?: string;
  position?: { start: number; end: number };
  relevanceScore?: number;
}

interface SourceModal {
  isOpen: boolean;
  source: PreviewItem | null;
  position: { x: number; y: number };
}

const DEFAULT_COLORS = {
  blue: '#3B82F6',
  green: '#10B981',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  red: '#EF4444'
};

export const SourcePreview: React.FC<SourcePreviewProps> = ({
  citations,
  documents,
  onSourceClick,
  showContext = true,
  maxExcerptLength = 300,
  className = '',
  highlightColor = 'blue',
  showDocumentInfo = true
}) => {
  const [selectedSource, setSelectedSource] = useState<PreviewItem | null>(null);
  const [modal, setModal] = useState<SourceModal>({
    isOpen: false,
    source: null,
    position: { x: 0, y: 0 }
  });
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  // Préparer les items de prévisualisation
  const previewItems = useMemo(() => {
    return citations.map((citation, index): PreviewItem => {
      // Trouver le document correspondant
      const document = documents.find(doc => 
        doc.documentId === citation.documentId || 
        doc.documentName === (citation as any).documentName
      ) || documents[0]; // Fallback

      const excerpt = citation.excerpt;
      const truncatedExcerpt = excerpt.length > maxExcerptLength
        ? excerpt.slice(0, maxExcerptLength) + '...'
        : excerpt;

      const isEnhanced = 'relevanceScore' in citation && 'similarityScore' in citation;

      return {
        id: `source-${index}`,
        citation,
        document,
        excerpt: truncatedExcerpt,
        context: isEnhanced ? citation.context : undefined,
        position: isEnhanced && citation.positionStart !== undefined
          ? { start: citation.positionStart, end: citation.positionEnd }
          : undefined,
        relevanceScore: isEnhanced ? citation.relevanceScore : undefined
      };
    });
  }, [citations, documents, maxExcerptLength]);

  // Gérer le clic sur une source
  const handleSourceClick = useCallback((
    source: PreviewItem,
    event: React.MouseEvent
  ) => {
    event.preventDefault();

    if (onSourceClick) {
      onSourceClick(source.document.documentId, source.position);
    }

    // Ouvrir le modal de détails
    const rect = event.currentTarget.getBoundingClientRect();
    setModal({
      isOpen: true,
      source,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    });
  }, [onSourceClick]);

  // Gérer l'expansion du contexte
  const toggleExpansion = useCallback((sourceId: string) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  }, []);

  // Fermer le modal
  const closeModal = useCallback(() => {
    setModal({ isOpen: false, source: null, position: { x: 0, y: 0 } });
  }, []);

  // Obtenir la couleur de pertinence
  const getRelevanceColor = useCallback((score?: number) => {
    if (!score) return 'gray';
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'yellow';
    return 'red';
  }, []);

  // Formater la taille du document
  const formatFileSize = useCallback((bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  // Obtenir l'icône du type de document
  const getDocumentIcon = useCallback((fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      pdf: '📄',
      docx: '📝',
      xlsx: '📊',
      pptx: '📽️',
      txt: '📃',
      md: '📋',
      jpg: '🖼️',
      png: '🖼️',
      jpeg: '🖼️'
    };
    return icons[ext || ''] || '📄';
  }, []);

  if (previewItems.length === 0) {
    return (
      <div className={`source-preview empty ${className}`}>
        <div className="text-center text-gray-500 py-4">
          <span className="text-2xl">📚</span>
          <p className="mt-2">Aucune source à afficher</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`source-preview ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span>📚</span>
          Sources ({previewItems.length})
        </h3>
        <p className="text-sm text-gray-600">
          Cliquez sur les extraits pour voir les sources complètes
        </p>
      </div>

      {/* Liste des sources */}
      <div className="space-y-3">
        {previewItems.map((source, index) => {
          const isExpanded = expandedSources.has(source.id);
          const relevanceColor = getRelevanceColor(source.relevanceScore);
          const color = DEFAULT_COLORS[highlightColor as keyof typeof DEFAULT_COLORS] || DEFAULT_COLORS.blue;

          return (
            <div
              key={source.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
              onClick={(e) => handleSourceClick(source, e)}
            >
              {/* En-tête de la source */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{getDocumentIcon(source.document.documentName)}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                      {source.document.documentName}
                    </h4>
                    {showDocumentInfo && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>Source #{index + 1}</span>
                        {source.position && (
                          <>
                            <span>•</span>
                            <span>Position: {source.position.start}-{source.position.end}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Score de pertinence */}
                {source.relevanceScore && (
                  <div className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full bg-${relevanceColor}-500`}
                      title={`Pertinence: ${Math.round(source.relevanceScore * 100)}%`}
                    ></span>
                    <span className={`text-xs text-${relevanceColor}-700 font-medium`}>
                      {Math.round(source.relevanceScore * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Extrait principal */}
              <div className="text-sm text-gray-700 mb-2 leading-relaxed">
                <span 
                  className="relative"
                  style={{
                    backgroundColor: isExpanded ? 'transparent' : `${color}20`,
                    padding: isExpanded ? '0' : '2px 4px',
                    borderRadius: '4px',
                    borderLeft: isExpanded ? 'none' : `3px solid ${color}`
                  }}
                >
                  {source.excerpt}
                </span>
              </div>

              {/* Contexte additionnel (expandable) */}
              {showContext && source.context && (
                <div className="mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpansion(source.id);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium mb-2"
                  >
                    {isExpanded ? 'Masquer' : 'Afficher'} le contexte
                  </button>
                  
                  {isExpanded && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-blue-300">
                      <span className="font-medium">Contexte:</span> {source.context}
                    </div>
                  )}
                </div>
              )}

              {/* Métadonnées du document */}
              {showDocumentInfo && (
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span>📁</span>
                      {source.document.storagePath.split('/').pop()}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>📏</span>
                      {formatFileSize(source.document.extractedText?.length || 0)}
                    </span>
                  </div>
                  
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <span>🔗</span>
                    Voir la source
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de détails */}
      {modal.isOpen && modal.source && (
        <SourceDetailModal
          source={modal.source}
          position={modal.position}
          onClose={closeModal}
          onNavigate={() => {
            if (onSourceClick) {
              onSourceClick(modal.source!.document.documentId, modal.source!.position);
            }
            closeModal();
          }}
        />
      )}
    </div>
  );
};

// Modal de détails de source
interface SourceDetailModalProps {
  source: PreviewItem;
  position: { x: number; y: number };
  onClose: () => void;
  onNavigate: () => void;
}

const SourceDetailModal: React.FC<SourceDetailModalProps> = ({
  source,
  position,
  onClose,
  onNavigate
}) => {
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onNavigate]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Source complète
              </h3>
              <p className="text-sm text-gray-600">{source.document.documentName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Métadonnées */}
          <div className="bg-gray-50 rounded p-3 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Document:</span>
                <p className="text-gray-600">{source.document.documentName}</p>
              </div>
              {source.position && (
                <div>
                  <span className="font-medium text-gray-700">Position:</span>
                  <p className="text-gray-600">{source.position.start} - {source.position.end}</p>
                </div>
              )}
              {source.relevanceScore && (
                <div>
                  <span className="font-medium text-gray-700">Pertinence:</span>
                  <p className="text-gray-600">{Math.round(source.relevanceScore * 100)}%</p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="text-gray-600">{source.document.documentName.split('.').pop()?.toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Extrait complet */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Extrait cité:</h4>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
              <p className="text-gray-700 leading-relaxed">{source.citation.excerpt}</p>
            </div>
          </div>

          {/* Contexte */}
          {source.context && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Contexte:</h4>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-600 leading-relaxed">{source.context}</p>
              </div>
            </div>
          )}

          {/* Texte environnant (si disponible) */}
          {source.document.extractedText && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Texte environnant:</h4>
              <div className="bg-gray-50 p-3 rounded max-h-64 overflow-y-auto">
                <p className="text-gray-600 leading-relaxed text-sm font-mono">
                  {source.document.extractedText.slice(0, 2000)}...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={onNavigate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>🔗</span>
              Naviguer vers la source
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourcePreview;
