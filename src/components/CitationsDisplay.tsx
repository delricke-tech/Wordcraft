/**
 * Composant pour afficher les citations numérotées dans le chat
 * Permet de cliquer sur les numéros [1], [2], [3] pour voir les sources
 * VERSION AMÉLIORÉE : Support des extraits cliquables avec preview
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Quote,
  Search,
  Eye,
  BookOpen,
  Maximize2
} from 'lucide-react';

interface Citation {
  id: string;
  documentId: string;
  documentName: string;
  excerpt: string;
  startIndex: number;
  endIndex: number;
  context: string;
  relevanceScore?: number;
}

interface CitationsDisplayProps {
  citations: Citation[];
  className?: string;
  onCitationClick?: (citation: Citation) => void;
}

export function CitationsDisplay({ citations, className = '', onCitationClick }: CitationsDisplayProps) {
  const [expandedCitations, setExpandedCitations] = useState<Set<number>>(new Set());
  const [showAllCitations, setShowAllCitations] = useState(false);
  const [previewingCitation, setPreviewingCitation] = useState<number | null>(null);

  if (citations.length === 0) {
    return null;
  }

  const toggleCitation = (index: number) => {
    const newExpanded = new Set(expandedCitations);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCitations(newExpanded);
  };

  const toggleAllCitations = () => {
    if (showAllCitations) {
      setExpandedCitations(new Set());
      setShowAllCitations(false);
    } else {
      setExpandedCitations(new Set(citations.map((_, index) => index)));
      setShowAllCitations(true);
    }
  };

  const handleCitationClick = (citation: Citation, index: number) => {
    setPreviewingCitation(index);
    onCitationClick?.(citation);
  };

  const closePreview = () => {
    setPreviewingCitation(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header des citations */}
      <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <div className="flex items-center gap-2">
          <Quote className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">
            {citations.length} source{citations.length > 1 ? 's' : ''} citée{citations.length > 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={toggleAllCitations}
          className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded transition-colors text-blue-300 text-xs"
        >
          {showAllCitations ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Réduire
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Voir tout
            </>
          )}
        </button>
      </div>

      {/* Liste des citations */}
      <div className="space-y-2">
        {citations.map((citation, index) => {
          const isExpanded = expandedCitations.has(index);
          const citationNumber = index + 1;

          return (
            <motion.div
              key={citation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-white/10 rounded-lg overflow-hidden bg-white/5"
            >
              {/* En-tête de la citation */}
              <button
                onClick={() => toggleCitation(index)}
                className="w-full p-3 flex items-center justify-between hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {/* Numéro de citation cliquable */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCitationClick(citation, index);
                    }}
                    className="flex items-center justify-center w-6 h-6 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold hover:bg-blue-500/30 transition-colors"
                    title={`Voir l'extrait complet ${citationNumber}`}
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  
                  {/* Nom du document */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-white/60 flex-shrink-0" />
                      <h4 className="text-sm font-medium text-white/90 truncate">
                        {citation.documentName}
                      </h4>
                    </div>
                    
                    {/* Score de pertinence avec indicateur visuel */}
                    {citation.relevanceScore && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Search className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-green-400">
                            {Math.round(citation.relevanceScore * 100)}% pertinence
                          </span>
                        </div>
                        
                        {/* Barre de progression visuelle */}
                        <div className="flex-1 max-w-20 bg-white/10 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${citation.relevanceScore * 100}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`h-full rounded-full ${
                              citation.relevanceScore >= 0.8 
                                ? 'bg-green-500' 
                                : citation.relevanceScore >= 0.6 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                            }`}
                          />
                        </div>
                        
                        {/* Badge de confiance */}
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          citation.relevanceScore >= 0.8 
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : citation.relevanceScore >= 0.6 
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {citation.relevanceScore >= 0.8 
                            ? 'Élevée' 
                            : citation.relevanceScore >= 0.6 
                            ? 'Moyenne' 
                            : 'Faible'
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Icône d'expansion */}
                <ChevronDown 
                  className={`w-4 h-4 text-white/60 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Contenu détaillé de la citation */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-3">
                      {/* Extrait principal cliquable */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-xs font-medium text-white/70">Extrait principal:</h5>
                          <button
                            onClick={() => handleCitationClick(citation, index)}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded transition-colors text-blue-300 text-xs"
                            title="Voir le contexte complet"
                          >
                            <Maximize2 className="w-3 h-3" />
                            Agrandir
                          </button>
                        </div>
                        <blockquote 
                          className="pl-4 border-l-2 border-blue-400/50 text-white/80 text-sm italic cursor-pointer hover:bg-white/5 p-2 rounded transition-colors"
                          onClick={() => handleCitationClick(citation, index)}
                          title="Cliquer pour voir le contexte complet"
                        >
                          "{citation.excerpt}"
                        </blockquote>
                      </div>

                      {/* Contexte additionnel */}
                      {citation.context && citation.context !== citation.excerpt && (
                        <div>
                          <h5 className="text-xs font-medium text-white/70 mb-2">Contexte:</h5>
                          <p className="text-white/60 text-xs leading-relaxed">
                            {citation.context}
                          </p>
                        </div>
                      )}

                      {/* Métadonnées */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <div className="text-xs text-white/50">
                          Position: {citation.startIndex}-{citation.endIndex}
                        </div>
                        <button
                          className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors text-white/60 text-xs"
                          title="Ouvrir le document"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Document
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Modal de preview d'extrait */}
      <AnimatePresence>
        {previewingCitation !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closePreview}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-slate-900 rounded-xl border border-white/20 max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-white font-medium">
                      Extrait {previewingCitation + 1} - {citations[previewingCitation].documentName}
                    </h3>
                    {citations[previewingCitation].relevanceScore && (
                      <p className="text-xs text-green-400">
                        {Math.round(citations[previewingCitation].relevanceScore! * 100)}% de pertinence
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={closePreview}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>

              {/* Contenu */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  {/* Extrait principal */}
                  <div>
                    <h4 className="text-sm font-medium text-white/70 mb-3">Extrait principal:</h4>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <blockquote className="text-white text-lg leading-relaxed">
                        "{citations[previewingCitation].excerpt}"
                      </blockquote>
                    </div>
                  </div>

                  {/* Contexte complet */}
                  {citations[previewingCitation].context && (
                    <div>
                      <h4 className="text-sm font-medium text-white/70 mb-3">Contexte complet:</h4>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <p className="text-white/80 leading-relaxed">
                          {citations[previewingCitation].context}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Métadonnées */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-sm text-white/50">
                      <p>Position: {citations[previewingCitation].startIndex}-{citations[previewingCitation].endIndex}</p>
                      <p>Document ID: {citations[previewingCitation].documentId}</p>
                    </div>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors text-blue-300"
                      title="Ouvrir le document complet"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ouvrir le document
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Légende */}
      <div className="text-center py-2">
        <p className="text-xs text-white/50">
          💡 Cliquez sur les extraits pour voir le contexte complet dans une fenêtre modale
        </p>
      </div>
    </div>
  );
}

/**
 * Composant pour afficher les numéros de citation cliquables dans le texte
 */
export function CitationNumber({ 
  number, 
  onClick, 
  isActive = false 
}: { 
  number: number; 
  onClick: () => void; 
  isActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded transition-all ${
        isActive 
          ? 'bg-blue-500 text-white scale-110' 
          : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:scale-105'
      }`}
      title={`Voir la source ${number}`}
    >
      [{number}]
    </button>
  );
}
