/**
 * Composant pour l'export DOCX (Word) avancé
 * Permet d'exporter des conversations et documents avec mise en page professionnelle
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
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  File,
  Palette,
  Layout
} from 'lucide-react';
import { 
  exportConversationToDOCX,
  exportDocumentToDOCX,
  downloadDOCXFile,
  createDOCXWithLibrary,
  type ExportDOCXOptions 
} from '../services/exportDOCXService';
import { ChatMessage } from '../services/openaiService';
import { toast } from 'sonner';

interface ExportDOCXProps {
  messages?: ChatMessage[];
  documentContent?: string;
  documentTitle?: string;
  className?: string;
}

export function ExportDOCX({ 
  messages = [], 
  documentContent, 
  documentTitle = 'Document WordCraft IA',
  className = ''
}: ExportDOCXProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [options, setOptions] = useState<ExportDOCXOptions>({
    includeMetadata: true,
    includeTimestamps: true,
    includeCitations: true,
    customTitle: documentTitle,
    includeTableOfContents: true,
    maxHeadingLevel: 3,
    includePageNumbers: true,
    includeHeader: true,
    includeFooter: true,
    template: 'professional',
    fontSize: 11,
    fontFamily: 'Calibri',
    lineSpacing: 1.15,
    margins: 'normal',
    orientation: 'portrait'
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let content: string;
      const filename = options.customTitle || documentTitle;
      
      if (messages.length > 0) {
        // Exporter une conversation
        content = exportConversationToDOCX(messages, {
          ...options,
          customTitle: filename
        });
        downloadDOCXFile(content, `conversation-${filename}`);
      } else if (documentContent) {
        // Exporter un document
        content = exportDocumentToDOCX(documentContent, filename, options);
        downloadDOCXFile(content, `document-${filename}`);
      } else {
        throw new Error('Aucun contenu à exporter');
      }
      
      toast.success('Export DOCX réussi', {
        description: `Fichier ${filename}.docx téléchargé`
      });
    } catch (error: any) {
      console.error('❌ Erreur export DOCX:', error);
      toast.error('Erreur lors de l\'export DOCX', {
        description: error.message
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAdvancedExport = async () => {
    setIsExporting(true);
    
    try {
      let content: string | Blob;
      const filename = options.customTitle || documentTitle;
      
      if (messages.length > 0) {
        // Exporter une conversation avec bibliothèque avancée
        content = await createDOCXWithLibrary(
          JSON.stringify(messages), 
          {
            ...options,
            customTitle: filename
          }
        );
      } else if (documentContent) {
        // Exporter un document avec bibliothèque avancée
        content = await createDOCXWithLibrary(documentContent, {
          ...options,
          customTitle: filename
        });
      } else {
        throw new Error('Aucun contenu à exporter');
      }
      
      // Télécharger le fichier
      const url = URL.createObjectURL(content as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.docx`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast.success('Export DOCX avancé réussi', {
        description: `Fichier ${filename}.docx téléchargé avec mise en page professionnelle`
      });
    } catch (error: any) {
      console.error('❌ Erreur export DOCX avancé:', error);
      toast.error('Erreur lors de l\'export DOCX avancé', {
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
        content = exportConversationToDOCX(messages, options);
      } else if (documentContent) {
        content = exportDocumentToDOCX(documentContent, options.customTitle || documentTitle, options);
      } else {
        throw new Error('Aucun contenu à prévisualiser');
      }
      
      setPreviewContent(content);
      setShowPreview(true);
    } catch (error: any) {
      console.error('❌ Erreur prévisualisation DOCX:', error);
      toast.error('Erreur lors de la prévisualisation DOCX', {
        description: error.message
      });
    }
  };

  const templates = [
    { value: 'professional', label: 'Professionnel', icon: FileText, color: 'blue' },
    { value: 'academic', label: 'Académique', icon: File, color: 'green' },
    { value: 'business', label: 'Business', icon: Layout, color: 'purple' },
    { value: 'modern', label: 'Moderne', icon: Palette, color: 'orange' }
  ];

  const fontFamilies = [
    { value: 'Calibri', label: 'Calibri' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' }
  ];

  const marginOptions = [
    { value: 'narrow', label: 'Étroites', description: '0.5 cm' },
    { value: 'normal', label: 'Normales', description: '1.0 cm' },
    { value: 'wide', label: 'Larges', description: '1.5 cm' }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg border border-blue-500/20">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Export DOCX (Word)</h3>
            <p className="text-sm text-white/70">Export professionnel avec mise en page Word</p>
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
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 disabled:opacity-50 rounded-lg transition-colors text-indigo-300 text-sm"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Export...' : 'Exporter'}
          </button>

          <button
            onClick={handleAdvancedExport}
            disabled={isExporting || (!messages.length && !documentContent)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 rounded-lg transition-colors text-purple-300 text-sm"
          >
            <Layout className="w-4 h-4" />
            Avancé
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
            <span className="text-white font-medium">Options d'export DOCX</span>
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
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent"
                  />
                </div>

                {/* Template de mise en page */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Template de mise en page
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {templates.map(template => {
                      const Icon = template.icon;
                      return (
                        <button
                          key={template.value}
                          onClick={() => setOptions(prev => ({ ...prev, template: template.value as any }))}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            options.template === template.value
                              ? `border-${template.color}-400 bg-${template.color}-500/20`
                              : 'border-white/20 hover:border-white/40 bg-white/5'
                          }`}
                        >
                          <Icon className="w-4 h-4 mx-auto mb-1 text-white/80" />
                          <div className="text-xs text-white/80">{template.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Options de mise en page */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Police de caractères
                    </label>
                    <select
                      value={options.fontFamily}
                      onChange={(e) => setOptions(prev => ({ ...prev, fontFamily: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent"
                    >
                      {fontFamilies.map(font => (
                        <option key={font.value} value={font.value} className="bg-slate-800">
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Taille de police
                    </label>
                    <select
                      value={options.fontSize}
                      onChange={(e) => setOptions(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent"
                    >
                      <option value={10} className="bg-slate-800">10pt</option>
                      <option value={11} className="bg-slate-800">11pt</option>
                      <option value={12} className="bg-slate-800">12pt</option>
                      <option value={14} className="bg-slate-800">14pt</option>
                      <option value={16} className="bg-slate-800">16pt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Interligne
                    </label>
                    <select
                      value={options.lineSpacing}
                      onChange={(e) => setOptions(prev => ({ ...prev, lineSpacing: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent"
                    >
                      <option value={1.0} className="bg-slate-800">Simple</option>
                      <option value={1.15} className="bg-slate-800">1.15</option>
                      <option value={1.5} className="bg-slate-800">1.5</option>
                      <option value={2.0} className="bg-slate-800">Double</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Orientation
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOptions(prev => ({ ...prev, orientation: 'portrait' }))}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          options.orientation === 'portrait'
                            ? 'border-blue-400 bg-blue-500/20'
                            : 'border-white/20 hover:border-white/40 bg-white/5'
                        }`}
                      >
                        <AlignLeft className="w-4 h-4 mx-auto text-white/80" />
                        <div className="text-xs text-white/80 mt-1">Portrait</div>
                      </button>
                      <button
                        onClick={() => setOptions(prev => ({ ...prev, orientation: 'landscape' }))}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          options.orientation === 'landscape'
                            ? 'border-blue-400 bg-blue-500/20'
                            : 'border-white/20 hover:border-white/40 bg-white/5'
                        }`}
                      >
                        <AlignLeft className="w-4 h-4 mx-auto text-white/80 rotate-90" />
                        <div className="text-xs text-white/80 mt-1">Paysage</div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Marges */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Marges
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {marginOptions.map(margin => (
                      <button
                        key={margin.value}
                        onClick={() => setOptions(prev => ({ ...prev, margins: margin.value as any }))}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          options.margins === margin.value
                            ? 'border-blue-400 bg-blue-500/20'
                            : 'border-white/20 hover:border-white/40 bg-white/5'
                        }`}
                      >
                        <div className="text-sm text-white/80">{margin.label}</div>
                        <div className="text-xs text-white/50">{margin.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options d'inclusion */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={options.includeMetadata}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                      className="rounded border-white/20 bg-white/10 text-blue-400 focus:ring-blue-400/50"
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
                      className="rounded border-white/20 bg-white/10 text-blue-400 focus:ring-blue-400/50"
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
                      className="rounded border-white/20 bg-white/10 text-blue-400 focus:ring-blue-400/50"
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
                      className="rounded border-white/20 bg-white/10 text-blue-400 focus:ring-blue-400/50"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white/80">Table des matières</div>
                      <div className="text-xs text-white/50">Sommaire automatique</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={options.includePageNumbers}
                      onChange={(e) => setOptions(prev => ({ ...prev, includePageNumbers: e.target.checked }))}
                      className="rounded border-white/20 bg-white/10 text-blue-400 focus:ring-blue-400/50"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white/80">Numéros de page</div>
                      <div className="text-xs text-white/50">Pagination automatique</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={options.includeHeader}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeHeader: e.target.checked }))}
                      className="rounded border-white/20 bg-white/10 text-blue-400 focus:ring-blue-400/50"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white/80">En-tête</div>
                      <div className="text-xs text-white/50">Titre en haut de page</div>
                    </div>
                  </label>
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
                <h3 className="text-xl font-semibold text-white">Aperçu DOCX</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-white/5 rounded-lg p-4">
                <div className="text-sm text-white/80 font-mono whitespace-pre-wrap">
                  {previewContent.substring(0, 2000)}
                  {previewContent.length > 2000 && '\n\n... (contenu tronqué pour la prévisualisation)'}
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
                  onClick={handleExport}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-white font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger DOCX
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
