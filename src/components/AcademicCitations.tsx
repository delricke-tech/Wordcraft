/**
 * Composant pour l'export de citations académiques
 * Permet de générer des citations dans différents formats (APA, MLA, Chicago, etc.)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  FileText, 
  Settings, 
  BookOpen,
  GraduationCap,
  Copy,
  Eye,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  FileSpreadsheet,
  FileJson,
  Globe,
  Users,
  Calendar,
  Hash
} from 'lucide-react';
import { 
  generateAcademicCitations,
  downloadAcademicCitations,
  type AcademicCitationOptions,
  type FormattedCitation 
} from '../services/academicCitationsService';
import { ChatMessage } from '../services/openaiService';
import { toast } from 'sonner';

interface AcademicCitationsProps {
  messages?: ChatMessage[];
  className?: string;
}

export function AcademicCitations({ 
  messages = [], 
  className = ''
}: AcademicCitationsProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [citations, setCitations] = useState<FormattedCitation[]>([]);
  const [copiedText, setCopiedText] = useState<string>('');
  const [options, setOptions] = useState<AcademicCitationOptions>({
    format: 'APA',
    includeInText: true,
    includeBibliography: true,
    sortBy: 'author',
    groupByType: false,
    includeURLs: true,
    includeDOI: true,
    language: 'fr'
  });

  const citationFormats = [
    { value: 'APA', label: 'APA 7th', description: 'American Psychological Association', icon: GraduationCap },
    { value: 'MLA', label: 'MLA 9th', description: 'Modern Language Association', icon: BookOpen },
    { value: 'Chicago', label: 'Chicago', description: 'Chicago Manual of Style', icon: FileText },
    { value: 'Harvard', label: 'Harvard', description: 'Harvard Referencing System', icon: Users },
    { value: 'IEEE', label: 'IEEE', description: 'Institute of Electrical Engineers', icon: Hash },
    { value: 'Vancouver', label: 'Vancouver', description: 'Vancouver Style', icon: Globe }
  ];

  const sortOptions = [
    { value: 'author', label: 'Auteur', icon: Users },
    { value: 'year', label: 'Année', icon: Calendar },
    { value: 'title', label: 'Titre', icon: FileText },
    { value: 'type', label: 'Type', icon: BookOpen }
  ];

  const handleGenerateCitations = async () => {
    setIsGenerating(true);
    
    try {
      const result = generateAcademicCitations(messages, options);
      setCitations(result.formattedCitations);
      
      toast.success('Citations académiques générées', {
        description: `${result.formattedCitations.length} sources formatées en ${options.format}`
      });
    } catch (error: any) {
      console.error('❌ Erreur génération citations:', error);
      toast.error('Erreur lors de la génération des citations', {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(text);
      toast.success('Copié dans le presse-papiers');
      setTimeout(() => setCopiedText(''), 2000);
    });
  };

  const handleCopyAll = () => {
    const allCitations = citations.map(c => c.bibliography).join('\n\n');
    handleCopyToClipboard(allCitations);
  };

  const handleDownload = (fileType: 'txt' | 'csv' | 'json') => {
    if (citations.length === 0) {
      toast.error('Aucune citation à télécharger');
      return;
    }
    
    downloadAcademicCitations(citations, options.format, fileType, options.language);
    
    toast.success('Téléchargement réussi', {
      description: `Fichier citations-${options.format.toLowerCase()}.${fileType} téléchargé`
    });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      book: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      article: 'bg-green-500/20 text-green-400 border-green-500/30',
      website: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      video: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      document: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      other: 'bg-pink-500/20 text-pink-400 border-pink-500/30'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      book: 'Livre',
      article: 'Article',
      website: 'Site web',
      video: 'Vidéo',
      document: 'Document',
      other: 'Autre'
    };
    return labels[type as keyof typeof labels] || 'Autre';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Citations Académiques</h3>
            <p className="text-sm text-white/70">Générez des citations professionnelles (APA, MLA, Chicago)</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            disabled={citations.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 disabled:opacity-50 rounded-lg transition-colors text-indigo-300 text-sm"
          >
            <Eye className="w-4 h-4" />
            Aperçu
          </button>
          
          <button
            onClick={handleGenerateCitations}
            disabled={isGenerating || messages.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 rounded-lg transition-colors text-purple-300 text-sm"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
            {isGenerating ? 'Génération...' : 'Générer'}
          </button>
        </div>
      </div>

      {/* Options de formatage */}
      <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-white/60" />
            <span className="text-white font-medium">Options de citation</span>
          </div>
          {showOptions ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
        </button>

        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10"
            >
              <div className="p-4 space-y-4">
                {/* Format de citation */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Style de citation
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {citationFormats.map(format => {
                      const Icon = format.icon;
                      return (
                        <button
                          key={format.value}
                          onClick={() => setOptions(prev => ({ ...prev, format: format.value as any }))}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            options.format === format.value
                              ? 'border-indigo-400 bg-indigo-500/20'
                              : 'border-white/20 hover:border-white/40 bg-white/5'
                          }`}
                        >
                          <Icon className="w-4 h-4 mx-auto mb-1 text-white/80" />
                          <div className="text-xs text-white/80 font-medium">{format.label}</div>
                          <div className="text-xs text-white/50">{format.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Options de tri et langue */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Tri par
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {sortOptions.map(sort => {
                        const Icon = sort.icon;
                        return (
                          <button
                            key={sort.value}
                            onClick={() => setOptions(prev => ({ ...prev, sortBy: sort.value as any }))}
                            className={`p-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                              options.sortBy === sort.value
                                ? 'border-indigo-400 bg-indigo-500/20'
                                : 'border-white/20 hover:border-white/40 bg-white/5'
                            }`}
                          >
                            <Icon className="w-3 h-3 text-white/80" />
                            <span className="text-xs text-white/80">{sort.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Langue
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOptions(prev => ({ ...prev, language: 'fr' }))}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          options.language === 'fr'
                            ? 'border-indigo-400 bg-indigo-500/20'
                            : 'border-white/20 hover:border-white/40 bg-white/5'
                        }`}
                      >
                        <span className="text-xs text-white/80">Français</span>
                      </button>
                      <button
                        onClick={() => setOptions(prev => ({ ...prev, language: 'en' }))}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          options.language === 'en'
                            ? 'border-indigo-400 bg-indigo-500/20'
                            : 'border-white/20 hover:border-white/40 bg-white/5'
                        }`}
                      >
                        <span className="text-xs text-white/80">English</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Options d'inclusion */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={options.includeInText}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeInText: e.target.checked }))}
                      className="rounded border-white/20 bg-white/10 text-indigo-400 focus:ring-indigo-400/50"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white/80">Citations in-texte</div>
                      <div className="text-xs text-white/50">Format (Auteur, année)</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={options.includeBibliography}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeBibliography: e.target.checked }))}
                      className="rounded border-white/20 bg-white/10 text-indigo-400 focus:ring-indigo-400/50"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white/80">Bibliographie</div>
                      <div className="text-xs text-white/50">Références complètes</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={options.includeURLs}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeURLs: e.target.checked }))}
                      className="rounded border-white/20 bg-white/10 text-indigo-400 focus:ring-indigo-400/50"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white/80">Inclure URLs</div>
                      <div className="text-xs text-white/50">Liens web dans les citations</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={options.includeDOI}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeDOI: e.target.checked }))}
                      className="rounded border-white/20 bg-white/10 text-indigo-400 focus:ring-indigo-400/50"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white/80">Inclure DOI</div>
                      <div className="text-xs text-white/50">Identifiants numériques</div>
                    </div>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Résultats */}
      {citations.length > 0 && (
        <div className="bg-white/5 rounded-lg border border-white/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">
              {citations.length} source{citations.length > 1 ? 's' : ''} formatée{citations.length > 1 ? 's' : ''} en {options.format}
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/80 text-sm"
              >
                <Copy className="w-3 h-3" />
                Copier tout
              </button>
              <button
                onClick={() => handleDownload('txt')}
                className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg transition-colors text-indigo-300 text-sm"
              >
                <FileText className="w-3 h-3" />
                TXT
              </button>
              <button
                onClick={() => handleDownload('csv')}
                className="flex items-center gap-2 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors text-green-300 text-sm"
              >
                <FileSpreadsheet className="w-3 h-3" />
                CSV
              </button>
              <button
                onClick={() => handleDownload('json')}
                className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors text-purple-300 text-sm"
              >
                <FileJson className="w-3 h-3" />
                JSON
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {citations.map((citation, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(citation.type)}`}>
                      {getTypeLabel(citation.type)}
                    </span>
                    {options.includeInText && (
                      <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">
                        {citation.inText}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopyToClipboard(citation.bibliography)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {copiedText === citation.bibliography ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/60" />
                    )}
                  </button>
                </div>
                
                <div className="text-sm text-white/80">
                  {citation.bibliography}
                </div>

                {citation.metadata.url && options.includeURLs && (
                  <div className="mt-2 text-xs text-white/50">
                    📎 {citation.metadata.url}
                  </div>
                )}

                {citation.metadata.doi && options.includeDOI && (
                  <div className="mt-1 text-xs text-white/50">
                    🔗 DOI: {citation.metadata.doi}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de prévisualisation */}
      <AnimatePresence>
        {showPreview && citations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-xl border border-white/20 p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Aperçu des citations - Style {options.format}
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-white/5 rounded-lg p-4">
                <div className="space-y-4">
                  {options.includeInText && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Citations dans le texte</h4>
                      <div className="space-y-1">
                        {citations.map((citation, index) => (
                          <div key={index} className="text-sm text-white/80">
                            [{index + 1}] {citation.inText}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {options.includeBibliography && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Bibliographie</h4>
                      <div className="space-y-3">
                        {citations.map((citation, index) => (
                          <div key={index} className="text-sm text-white/80">
                            [{index + 1}] {citation.bibliography}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/60"
                >
                  Fermer
                </button>
                <button
                  onClick={handleCopyAll}
                  className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors text-white font-medium"
                >
                  Copier tout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
