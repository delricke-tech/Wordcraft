/**
 * Composant d'affichage des citations numérotées [1] [2] [3]
 * 
 * Ce composant parse le texte pour identifier et formater les citations
 * avec des numéros cliquables qui affichent les sources
 * 
 * Date: 11 mars 2026
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { Citation, EnhancedCitation } from '../services/citationService';

interface NumberedCitationsProps {
  text: string;
  citations: (Citation | EnhancedCitation)[];
  onCitationClick?: (citation: Citation | EnhancedCitation) => void;
  showPreview?: boolean;
  className?: string;
  numberingStyle?: 'brackets' | 'superscript' | 'inline';
  highlightColor?: string;
}

interface CitationPreview {
  citation: Citation | EnhancedCitation;
  position: { x: number; y: number };
  isVisible: boolean;
}

interface ParsedTextSegment {
  type: 'text' | 'citation';
  content: string;
  citationIndex?: number;
}

const CITATION_PATTERNS = [
  /\[citation:(\d+)\]/g,
  /\[ref:(\d+)\]/g,
  /\[(\d+)\]/g,
  /\[source:(\d+)\]/g
];

const DEFAULT_COLORS = {
  blue: '#3B82F6',
  green: '#10B981',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  red: '#EF4444'
};

export const NumberedCitations: React.FC<NumberedCitationsProps> = ({
  text,
  citations,
  onCitationClick,
  showPreview = true,
  className = '',
  numberingStyle = 'brackets',
  highlightColor = 'blue'
}) => {
  const [hoveredCitation, setHoveredCitation] = useState<number | null>(null);
  const [preview, setPreview] = useState<CitationPreview | null>(null);

  // Parser le texte pour identifier les citations
  const parsedText = useMemo(() => {
    const segments: ParsedTextSegment[] = [];
    let lastIndex = 0;
    const citationMatches: Array<{index: number, citationId: string, pattern: string}> = [];

    // Trouver toutes les correspondances de citations
    CITATION_PATTERNS.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        citationMatches.push({
          index: match.index,
          citationId: match[1],
          pattern: pattern.source
        });
      }
    });

    // Trier par position
    citationMatches.sort((a, b) => a.index - b.index);

    // Construire les segments
    citationMatches.forEach((match, index) => {
      // Ajouter le texte avant la citation
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Ajouter la citation
      const citationIndex = parseInt(match.citationId) - 1; // Convertir en index 0-based
      if (citationIndex >= 0 && citationIndex < citations.length) {
        segments.push({
          type: 'citation',
          content: match[0],
          citationIndex
        });
      }

      lastIndex = match.index + match[0].length;
    });

    // Ajouter le texte restant
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return segments;
  }, [text, citations]);

  // Gérer le clic sur une citation
  const handleCitationClick = useCallback((
    citation: Citation | EnhancedCitation,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    
    if (onCitationClick) {
      onCitationClick(citation);
    }

    // Afficher l'aperçu si activé
    if (showPreview) {
      const rect = event.currentTarget.getBoundingClientRect();
      setPreview({
        citation,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        },
        isVisible: true
      });
    }
  }, [onCitationClick, showPreview]);

  // Gérer le survol
  const handleCitationHover = useCallback((index: number | null, event?: React.MouseEvent) => {
    setHoveredCitation(index);
    
    if (showPreview && index !== null && event) {
      const citation = citations[index];
      const rect = event.currentTarget.getBoundingClientRect();
      setPreview({
        citation,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        },
        isVisible: true
      });
    } else if (index === null) {
      setPreview(null);
    }
  }, [citations, showPreview]);

  // Fermer l'aperçu
  const closePreview = useCallback(() => {
    setPreview(null);
    setHoveredCitation(null);
  }, []);

  // Rendre le numéro de citation selon le style
  const renderCitationNumber = useCallback((index: number) => {
    const citationNumber = index + 1;
    const color = DEFAULT_COLORS[highlightColor as keyof typeof DEFAULT_COLORS] || DEFAULT_COLORS.blue;
    
    switch (numberingStyle) {
      case 'superscript':
        return (
          <sup
            className="citation-number cursor-pointer transition-all hover:scale-110"
            style={{ color, fontWeight: 'bold' }}
          >
            {citationNumber}
          </sup>
        );
      
      case 'inline':
        return (
          <span
            className="citation-number cursor-pointer transition-all hover:scale-110 font-bold"
            style={{ color, fontSize: '0.9em' }}
          >
            {citationNumber}
          </span>
        );
      
      case 'brackets':
      default:
        return (
          <span
            className="citation-number cursor-pointer transition-all hover:scale-110 font-semibold"
            style={{ color, fontSize: '0.85em' }}
          >
            [{citationNumber}]
          </span>
        );
    }
  }, [numberingStyle, highlightColor]);

  // Obtenir le score de pertinence pour les citations améliorées
  const getRelevanceScore = useCallback((citation: Citation | EnhancedCitation) => {
    if ('relevanceScore' in citation && 'similarityScore' in citation) {
      return citation.relevanceScore;
    }
    return null;
  }, []);

  // Obtenir le badge de score
  const getScoreBadge = useCallback((citation: Citation | EnhancedCitation) => {
    const score = getRelevanceScore(citation);
    if (score === null) return null;

    const scoreColor = score >= 0.8 ? 'green' : score >= 0.6 ? 'yellow' : 'red';
    const scoreLabel = Math.round(score * 100);

    return (
      <span
        className={`ml-1 px-1 py-0.5 text-xs rounded-full bg-${scoreColor}-100 text-${scoreColor}-700`}
        title={`Score de pertinence: ${scoreLabel}%`}
      >
        {scoreLabel}%
      </span>
    );
  }, [getRelevanceScore]);

  return (
    <div className={`numbered-citations ${className}`}>
      {/* Texte avec citations numérotées */}
      <div className="citation-text leading-relaxed">
        {parsedText.map((segment, index) => {
          if (segment.type === 'text') {
            return <span key={index}>{segment.content}</span>;
          }

          const citation = citations[segment.citationIndex!];
          const isHovered = hoveredCitation === segment.citationIndex;

          return (
            <span
              key={index}
              className={`citation-marker inline-block mx-1 transition-all ${
                isHovered ? 'transform scale-110' : ''
              }`}
              onMouseEnter={(e) => handleCitationHover(segment.citationIndex!, e)}
              onMouseLeave={() => handleCitationHover(null)}
              onClick={(e) => handleCitationClick(citation, e)}
            >
              {renderCitationNumber(segment.citationIndex!)}
              {getScoreBadge(citation)}
            </span>
          );
        })}
      </div>

      {/* Aperçu de citation */}
      {preview && preview.isVisible && (
        <CitationPreviewPopup
          citation={preview.citation}
          position={preview.position}
          onClose={closePreview}
          showScore={getRelevanceScore(preview.citation) !== null}
        />
      )}
    </div>
  );
};

// Composant d'aperçu de citation
interface CitationPreviewPopupProps {
  citation: Citation | EnhancedCitation;
  position: { x: number; y: number };
  onClose: () => void;
  showScore?: boolean;
}

const CitationPreviewPopup: React.FC<CitationPreviewPopupProps> = ({
  citation,
  position,
  onClose,
  showScore = false
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Animation d'apparition
  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Gérer le clic en dehors
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.citation-preview-popup')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const isEnhanced = 'relevanceScore' in citation && 'similarityScore' in citation;

  return (
    <div
      className="citation-preview-popup fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div
        className={`bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm transition-all duration-200 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-800 text-sm">
            Source {isEnhanced ? citation.documentName : citation.name}
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Scores pour citations améliorées */}
        {isEnhanced && showScore && (
          <div className="flex gap-2 mb-2">
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              Pertinence: {Math.round(citation.relevanceScore * 100)}%
            </span>
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
              Similarité: {Math.round(citation.similarityScore * 100)}%
            </span>
          </div>
        )}

        {/* Extrait */}
        <div className="text-sm text-gray-600 mb-2">
          <p className="line-clamp-3">{citation.excerpt}</p>
        </div>

        {/* Métadonnées */}
        {isEnhanced && citation.context && (
          <div className="text-xs text-gray-500 mb-2">
            <span className="font-medium">Contexte:</span> {citation.context}
          </div>
        )}

        {/* Position dans le document */}
        {isEnhanced && citation.positionStart !== undefined && (
          <div className="text-xs text-gray-500">
            Position: {citation.positionStart}-{citation.positionEnd}
          </div>
        )}

        {/* Bouton d'action */}
        <div className="mt-3 pt-2 border-t">
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Voir la source complète →
          </button>
        </div>
      </div>

      {/* Flèche */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
      </div>
    </div>
  );
};

// Utilitaire pour parser les citations dans un texte
export const parseCitationsInText = (
  text: string,
  citations: (Citation | EnhancedCitation)[]
): { parsedText: string; citationMap: Map<number, Citation | EnhancedCitation> } => {
  const citationMap = new Map<number, Citation | EnhancedCitation>();
  let parsedText = text;

  citations.forEach((citation, index) => {
    const citationNumber = index + 1;
    citationMap.set(citationNumber, citation);
    
    // Remplacer les patterns de citation par des numéros
    parsedText = parsedText
      .replace(/\[citation:\d+\]/g, `[${citationNumber}]`)
      .replace(/\[ref:\d+\]/g, `[${citationNumber}]`)
      .replace(/\[source:\d+\]/g, `[${citationNumber}]`);
  });

  return { parsedText, citationMap };
};

export default NumberedCitations;
