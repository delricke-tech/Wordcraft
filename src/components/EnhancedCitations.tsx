/**
 * Composant pour afficher les citations avancées avec scores de pertinence
 * Support RAG avancé avec embeddings vectoriels
 * 
 * Date: 10 mars 2026
 */

import React from 'react';
import type { EnhancedCitation } from '../services/vectorEmbeddingService';

interface EnhancedCitationsProps {
  citations: EnhancedCitation[];
  onCitationClick?: (citation: EnhancedCitation) => void;
  showScores?: boolean;
  maxCitations?: number;
}

export const EnhancedCitations: React.FC<EnhancedCitationsProps> = ({
  citations,
  onCitationClick,
  showScores = true,
  maxCitations = 5
}) => {
  if (!citations || citations.length === 0) {
    return null;
  }

  const displayedCitations = citations.slice(0, maxCitations);

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return '🔥';
    if (score >= 0.6) return '⭐';
    if (score >= 0.4) return '📚';
    return '📄';
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-red-500';
    if (score >= 0.6) return 'text-orange-500';
    if (score >= 0.4) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Très pertinent';
    if (score >= 0.6) return 'Pertinent';
    if (score >= 0.4) return 'Modérément pertinent';
    return 'Peu pertinent';
  };

  return (
    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          📚 Sources et références avancées
        </h3>
        <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
          {displayedCitations.length} citations
        </span>
      </div>

      <div className="space-y-3">
        {displayedCitations.map((citation, index) => (
          <div
            key={citation.id}
            className="p-3 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onCitationClick?.(citation)}
          >
            {/* En-tête avec document et scores */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {index + 1}. {citation.documentName}
                  </span>
                  <span className="text-lg">
                    {getScoreIcon(citation.relevanceScore)}
                  </span>
                </div>
                
                {showScores && (
                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Pertinence:</span>
                      <span className={`font-medium ${getScoreColor(citation.relevanceScore)}`}>
                        {(citation.relevanceScore * 100).toFixed(1)}%
                      </span>
                      <span className="text-gray-400">({getScoreLabel(citation.relevanceScore)})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Similarité:</span>
                      <span className="font-medium text-blue-500">
                        {(citation.similarityScore * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Extrait principal */}
            <div className="mb-2">
              <blockquote className="border-l-4 border-blue-500 pl-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="text-sm text-gray-800 dark:text-gray-200 italic">
                  "{citation.excerpt}"
                </p>
              </blockquote>
            </div>

            {/* Contexte étendu */}
            {citation.context && citation.context !== citation.excerpt && (
              <div className="mt-2">
                <details className="group">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                    📖 Voir le contexte complet
                  </summary>
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-300">
                    {citation.context}
                  </div>
                </details>
              </div>
            )}

            {/* Métadonnées */}
            {citation.metadata && Object.keys(citation.metadata).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(citation.metadata).map(([key, value]) => (
                  <span
                    key={key}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                  >
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Légende des scores */}
      {showScores && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 <strong>Légende:</strong> Les citations sont classées par ordre de pertinence avec scores de similarité vectorielle. 
            🔥 Très pertinent (80%+) | ⭐ Pertinent (60-79%) | 📚 Modéré (40-59%) | 📄 Faible (moins de 40%)
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">
        *Les citations sont générées automatiquement avec RAG avancé et embeddings vectoriels*
      </div>
    </div>
  );
};

export default EnhancedCitations;
