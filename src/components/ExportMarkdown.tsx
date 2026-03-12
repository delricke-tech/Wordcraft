/**
 * Composant pour l'export Markdown avancé
 * Permet d'exporter des conversations et documents avec options professionnelles
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Eye, 
  Settings, 
  FileText, 
  MessageSquare,
  Calendar,
  Hash,
  Code,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Check,
  X
} from 'lucide-react';
import { 
  exportConversationToMarkdown,
  downloadMarkdownFile,
  previewMarkdown,
  formatMarkdownForExport,
  type ExportMarkdownOptions 
} from '../services/exportMarkdownService';
import { ChatMessage } from '../services/openaiService';
import { toast } from 'sonner';

interface ExportMarkdownProps {
  messages?: ChatMessage[];
  documentContent?: string;
  documentTitle?: string;
  className?: string;
}

export function ExportMarkdown({ 
  messages = [], 
  documentContent, 
  documentTitle = 'Document WordCraft IA',
  className = ''
}: ExportMarkdownProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [options, setOptions] = useState<ExportMarkdownOptions>({
    includeMetadata: true,
    includeTimestamps: true,
    includeCitations: true,
    customTitle: documentTitle,
    includeTableOfContents: true,
    maxHeadingLevel: 3,
    codeTheme: 'dark',
    includeWordCount: true,
    format: 'professional'
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let content: string;
      const filename = options.customTitle || documentTitle;
      
      if (messages.length > 0) {
        // Exporter une conversation
        content = exportConversationToMarkdown(messages, {
          ...options,
          customTitle: filename
        });
        downloadMarkdownFile(content, `conversation-${filename}`);
      } else if (documentContent) {
        // Exporter un document
        content = formatMarkdownForExport(documentContent, {
          ...options,
          customTitle: filename
        });
        downloadMarkdownFile(content, `document-${filename}`);
      } else {
        throw new Error('Aucun contenu à exporter');
      }
      
      toast.success('Export réussi', {
        description: `Fichier ${filename}.md téléchargé`
      });
    } catch (error: any) {
      console.error('❌ Erreur export Markdown:', error);
      toast.error('Erreur lors de l\'export', {
        description: error.message
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = async () => {
    try {
      let content: string;
      
      if (messages.length > 0) {
        content = exportConversationToMarkdown(messages, options);
      } else if (documentContent) {
        content = formatMarkdownForExport(documentContent, options);
      } else {
        throw new Error('Aucun contenu à prévisualiser');
      }
      
      setPreviewContent(content);
      setShowPreview(true);
    } catch (error: any) {
      console.error('❌ Erreur prévisualisation:', error);
      toast.error('Erreur lors de la prévisualisation', {
        description: error.message
      });
    }
  };

  const formatOptions = [
    { value: 'professional', label: 'Professionnel', icon: BookOpen },
    { value: 'github', label: 'GitHub', icon: Code },
    { value: 'academic', label: 'Académique', icon: FileText }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-green-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Export Markdown</h3>
            <p className="text-sm text-white/70">Export professionnel avec formatage avancé</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePreview}
            disabled={isExporting || (!messages.length && !documentContent)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 rounded-lg transition-colors text-blue-300 text-sm"
          >
            <Eye className="w-4 h-4" />
            Aperçu
          </button>
          
          <button
            onClick={handleExport}
            disabled={isExporting || (!messages.length && !documentContent)}
            className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 rounded-lg transition-colors text-green-300 text-sm"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-green-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Export...' : 'Exporter'}
          </button>
        </div>
      </div>

      {/* Options d'export */}
      <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-white/60" />
            <span className="text-white font-medium">Options d'export</span>
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
                {/* Titre personnalisé */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Titre personnalisé
                  </label>
                  <input
                    type="text"
                    value={options.customTitle}
                    onChange={(e) => setOptions(prev => ({ ...prev, customTitle: e.target.value }))}
                    placeholder="Entrez un titre personnalisé..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-transparent"
                  />
                </div>

                {/* Format de sortie */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Format de sortie
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {formatOptions.map(format => {
                      const Icon = format.icon;
                      return (
                        <button
                          key={format.value}
                          onClick={() => setOptions(prev => ({ ...prev, format: format.value as any }))}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            options.format === format.value
                              ? 'border-green-400 bg-green-500/20'
                              : 'border-white/20 hover:border-white/40 bg-white/5'
                          }`}
                        >
                          <Icon className="w-4 h-4 mx-auto mb-1 text-white/80" />
                          <div className="text-xs text-white/80">{format.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Options d'inclusion */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={options.includeMetadata}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                      className="rounded border-white/20 bg-white/10 text-green-400 focus:ring-green-400/50"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white/80">Métadonnées</div>
                      <div className="text-xs text-white/50">Date, auteur, statistiques</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={options.includeTimestamps}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeTimestamps: e.target.checked }))}
                      className="rounded border-white/20 bg-white/10 text-green-400 focus:ring-green-400/50"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white/80">Horodatages</div>
                      <div className="text-xs text-white/50">Dates et heures des messages</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={options.includeCitations}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeCitations: e.target.checked }))}
                      className="rounded border-white/20 bg-white/10 text-green-400 focus:ring-green-400/50"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white/80">Citations</div>
                      <div className="text-xs text-white/50">Sources et références</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={options.includeTableOfContents}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeTableOfContents: e.target.checked }))}
                      className="rounded border-white/20 bg-white/10 text-green-400 focus:ring-green-400/50"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white/80">Table des matières</div>
                      <div className="text-xs text-white/50">Sommaire automatique</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={options.includeWordCount}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeWordCount: e.target.checked }))}
                      className="rounded border-white/20 bg-white/10 text-green-400 focus:ring-green-400/50"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white/80">Compteur de mots</div>
                      <div className="text-xs text-white/50">Statistiques de contenu</div>
                    </div>
                  </label>
                </div>

                {/* Niveau max de titres */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Niveau max des titres
                  </label>
                  <select
                    value={options.maxHeadingLevel}
                    onChange={(e) => setOptions(prev => ({ ...prev, maxHeadingLevel: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-transparent"
                  >
                    <option value={1}>Niveau 1 (H1 seulement)</option>
                    <option value={2}>Niveau 2 (H1-H2)</option>
                    <option value={3}>Niveau 3 (H1-H3)</option>
                    <option value={4}>Niveau 4 (H1-H4)</option>
                    <option value={5}>Niveau 5 (H1-H5)</option>
                    <option value={6}>Niveau 6 (H1-H6)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de prévisualisation */}
      <AnimatePresence>
        {showPreview && (
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
                <h3 className="text-xl font-semibold text-white">Aperçu Markdown</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-white/5 rounded-lg p-4">
                <pre className="text-sm text-white/80 whitespace-pre-wrap font-mono">
                  {previewContent}
                </pre>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/60"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    downloadMarkdownFile(previewContent, `preview-${options.customTitle}`);
                    toast.success('Aperçu téléchargé', {
                      description: 'Fichier preview.md enregistré'
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-white font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger l'aperçu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
