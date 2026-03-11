/**
 * Composant d'affichage des scores de pertinence des citations
 * 
 * Ce composant affiche des scores de confiance détaillés pour chaque citation
 * avec des visualisations graphiques et des recommandations
 * 
 * Date: 11 mars 2026
 */

import React, { useState } from 'react';
import { calculateCitationScores, exportScoresCSV, type CitationScore, type ScoringResult } from '../services/citationScoringService';
import type { Citation } from '../services/citationService';
import type { EnhancedCitation } from '../services/citationScoringService';

interface CitationScoreDisplayProps {
  citations: (Citation | EnhancedCitation)[];
  query: string;
  documentContext?: string;
  onScoreUpdate?: (scores: CitationScore[]) => void;
  showDetails?: boolean;
  showCharts?: boolean;
  showRecommendations?: boolean;
  className?: string;
}

interface ScoreVisualizationProps {
  score: number;
  label: string;
  color: string;
  size?: 'small' | 'medium' | 'large';
  showPercentage?: boolean;
}

const ScoreVisualization: React.FC<ScoreVisualizationProps> = ({
  score,
  label,
  color,
  size = 'medium',
  showPercentage = true
}) => {
  const percentage = Math.round(score * 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score * circumference);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-20 h-20',
    large: 'w-24 h-24'
  };

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className="score-visualization flex flex-col items-center">
      <div className={`relative ${sizeClasses[size]}`}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="50%"
            cy="50%"
            r="45"
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45"
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${textSizes[size]}`} style={{ color }}>
            {showPercentage ? `${percentage}%` : ''}
          </span>
        </div>
      </div>
      <span className="text-xs text-gray-600 mt-1 text-center">{label}</span>
    </div>
  );
};

const ScoreBar: React.FC<{
  score: number;
  label: string;
  color: string;
}> = ({ score, label, color }) => {
  const percentage = Math.round(score * 100);

  return (
    <div className="score-bar">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-medium" style={{ color }}>
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            minWidth: percentage > 0 ? '4px' : '0'
          }}
        />
      </div>
    </div>
  );
};

export const CitationScoreDisplay: React.FC<CitationScoreDisplayProps> = ({
  citations,
  query,
  documentContext,
  onScoreUpdate,
  showDetails = true,
  showCharts = true,
  showRecommendations = true,
  className = ''
}) => {
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedScores, setExpandedScores] = useState<Set<string>>(new Set());

  // Calculer les scores au montage et quand les données changent
  React.useEffect(() => {
    if (citations.length > 0) {
      calculateScores();
    }
  }, [citations, query, documentContext]);

  const calculateScores = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await calculateCitationScores(citations, query, documentContext, {
        includeTextualAnalysis: true,
        includeSemanticSimilarity: true,
        includeContextualAnalysis: !!documentContext,
        includeSourceQuality: true,
        includeTemporalAnalysis: false
      });

      setScoringResult(result);
      onScoreUpdate?.(result.scores);
      
      console.log(`📊 Scores calculés: ${result.summary.averageScore * 100}% moyen`);
      
    } catch (err) {
      console.error('❌ Erreur calcul scores:', err);
      setError('Impossible de calculer les scores de pertinence');
    } finally {
      setLoading(false);
    }
  };

  const toggleScoreExpansion = (scoreId: string) => {
    setExpandedScores(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scoreId)) {
        newSet.delete(scoreId);
      } else {
        newSet.add(scoreId);
      }
      return newSet;
    });
  };

  const exportToCSV = () => {
    if (!scoringResult) return;
    
    const csv = exportScoresCSV(scoringResult.scores);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citation-scores-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return '#10b981'; // green
    if (score >= 0.6) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getConfidenceBadgeColor = (level: string): string => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className={`citation-score-display loading ${className}`}>
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Calcul des scores de pertinence...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`citation-score-display error ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={calculateScores}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!scoringResult || scoringResult.scores.length === 0) {
    return (
      <div className={`citation-score-display empty ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <span className="text-gray-500">Aucun score à afficher</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`citation-score-display ${className}`}>
      {/* Header avec résumé */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>📊</span>
            Analyse de Pertinence
          </h3>
          <button
            onClick={exportToCSV}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>📥</span>
            Exporter CSV
          </button>
        </div>
        
        {/* Résumé global */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(scoringResult.summary.averageScore * 100)}%
              </div>
              <div className="text-xs text-gray-600">Score moyen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {scoringResult.summary.highConfidenceCount}
              </div>
              <div className="text-xs text-gray-600">Haute confiance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {scoringResult.summary.mediumConfidenceCount}
              </div>
              <div className="text-xs text-gray-600">Confiance moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {scoringResult.summary.lowConfidenceCount}
              </div>
              <div className="text-xs text-gray-600">Faible confiance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Visualisation globale */}
      {showCharts && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-700 mb-3">Vue d'ensemble</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {scoringResult.scores.slice(0, 5).map((score, index) => (
              <ScoreVisualization
                key={score.id}
                score={score.overallScore}
                label={`Source ${index + 1}`}
                color={getScoreColor(score.overallScore)}
                size="small"
              />
            ))}
          </div>
        </div>
      )}

      {/* Scores détaillés */}
      {showDetails && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-700">Scores détaillés</h4>
          
          {scoringResult.scores.map((score, index) => {
            const isExpanded = expandedScores.has(score.id);
            const overallColor = getScoreColor(score.overallScore);

            return (
              <div
                key={score.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                {/* Header du score */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <ScoreVisualization
                      score={score.overallScore}
                      label={`Source ${index + 1}`}
                      color={overallColor}
                      size="small"
                    />
                    <div>
                      <h5 className="font-medium text-gray-800">
                        Citation #{index + 1}
                      </h5>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceBadgeColor(score.metadata.confidenceLevel)}`}>
                          {score.metadata.confidenceLevel === 'high' ? 'Haute' : 
                           score.metadata.confidenceLevel === 'medium' ? 'Moyenne' : 'Faible'} confiance
                        </span>
                        <span className="text-xs text-gray-500">
                          {score.metadata.calculationTime}ms
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleScoreExpansion(score.id)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {isExpanded ? 'Masquer' : 'Détails'}
                  </button>
                </div>

                {/* Score principal */}
                <div className="mb-3">
                  <ScoreBar
                    score={score.overallScore}
                    label="Score global"
                    color={overallColor}
                  />
                </div>

                {/* Détails étendus */}
                {isExpanded && (
                  <div className="border-t pt-3 space-y-3">
                    {/* Scores individuels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Scores principaux</h6>
                        <div className="space-y-2">
                          <ScoreBar
                            score={score.relevanceScore}
                            label="Pertinence"
                            color="#3b82f6"
                          />
                          <ScoreBar
                            score={score.confidenceScore}
                            label="Confiance"
                            color="#8b5cf6"
                          />
                          <ScoreBar
                            score={score.accuracyScore}
                            label="Précision"
                            color="#10b981"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Analyse détaillée</h6>
                        <div className="space-y-2">
                          <ScoreBar
                            score={score.breakdown.textualRelevance}
                            label="Pertinence textuelle"
                            color="#06b6d4"
                          />
                          <ScoreBar
                            score={score.breakdown.semanticSimilarity}
                            label="Similarité sémantique"
                            color="#f59e0b"
                          />
                          <ScoreBar
                            score={score.breakdown.contextualFit}
                            label="Adéquation contextuelle"
                            color="#ec4899"
                          />
                          <ScoreBar
                            score={score.breakdown.sourceQuality}
                            label="Qualité de source"
                            color="#6366f1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Recommandations */}
                    {showRecommendations && score.metadata.recommendations.length > 0 && (
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Recommandations</h6>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {score.metadata.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Facteurs utilisés */}
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Facteurs analysés</h6>
                      <div className="flex flex-wrap gap-1">
                        {score.metadata.factorsUsed.map(factor => (
                          <span
                            key={factor}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recommandations globales */}
      {showRecommendations && scoringResult.recommendations.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-700 mb-3">Recommandations globales</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ul className="text-sm text-blue-800 space-y-2">
              {scoringResult.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span>💡</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {scoringResult.summary.totalCitations} citations analysées en {scoringResult.summary.processingTime}ms
          </span>
          <button
            onClick={calculateScores}
            className="text-blue-600 hover:text-blue-700"
          >
            🔄 Recalculer
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitationScoreDisplay;
