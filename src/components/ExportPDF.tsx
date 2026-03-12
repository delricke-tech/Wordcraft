/**
 * Composant pour l'export PDF avancé
 * Permet d'exporter des conversations et documents avec table des matières et mise en page professionnelle
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
  Layout,
  Printer,
  BookOpen,
  Bookmark
} from 'lucide-react';
import { 
  exportConversationToPDF,
  exportDocumentToPDF,
  downloadPDFFile,
  createPDFWithLibrary,
  previewPDF,
  convertHTMLToPDF,
  type ExportPDFOptions 
} from '../services/exportPDFService';
import { ChatMessage } from '../services/openaiService';
import { toast } from 'sonner';

interface ExportPDFProps {
  messages?: ChatMessage[];
  documentContent?: string;
  documentTitle?: string;
  className?: string;
}

export function ExportPDF({ 
  messages = [], 
  documentContent, 
  documentTitle = 'Document WordCraft IA',
  className = ''
}: ExportPDFProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [options, setOptions] = useState<ExportPDFOptions>({
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
    fontSize: 12,
    fontFamily: 'Helvetica',
    lineSpacing: 1.2,
    margins: 'normal',
    orientation: 'portrait',
    pageSize: 'A4',
    tocDepth: 3,
    includeBookmarks: false,
    watermark: '',
    backgroundColor: '#ffffff',
    textColor: '#000000'
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let content: string;
      const filename = options.customTitle || documentTitle;
      
      if (messages.length > 0) {
        // Exporter une conversation
        content = exportConversationToPDF(messages, {
          ...options,
          customTitle: filename
        });
      } else if (documentContent) {
        // Exporter un document
        content = exportDocumentToPDF(documentContent, filename, options);
      } else {
        throw new Error('Aucun contenu à exporter');
      }
      
      await downloadPDFFile(content, filename);
      
      toast.success('Export PDF réussi', {
        description: `Fichier ${filename}.pdf généré pour impression`
      });
    } catch (error: any) {
      console.error('❌ Erreur export PDF:', error);
      toast.error('Erreur lors de l\'export PDF', {
        description: error.message
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAdvancedExport = async () => {
    setIsExporting(true);
    
    try {
      let pdfBlob: Blob;
      const filename = options.customTitle || documentTitle;
      
      if (messages.length > 0) {
        // Exporter une conversation avec bibliothèque avancée
        pdfBlob = await createPDFWithLibrary(
          JSON.stringify(messages), 
          {
            ...options,
            customTitle: filename
          }
        );
      } else if (documentContent) {
        // Exporter un document avec bibliothèque avancée
        pdfBlob = await createPDFWithLibrary(documentContent, {
          ...options,
          customTitle: filename
        });
      } else {
        throw new Error('Aucun contenu à exporter');
      }
      
      // Télécharger le fichier
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.pdf`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast.success('Export PDF avancé réussi', {
        description: `Fichier ${filename}.pdf téléchargé avec mise en page professionnelle`
      });
    } catch (error: any) {
      console.error('❌ Erreur export PDF avancé:', error);
      toast.error('Erreur lors de l\'export PDF avancé', {
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
        content = exportConversationToPDF(messages, options);
      } else if (documentContent) {
        content = exportDocumentToPDF(documentContent, options.customTitle || documentTitle, options);
      } else {
        throw new Error('Aucun contenu à prévisualiser');
      }
      
      setPreviewContent(content);
      setShowPreview(true);
    } catch (error: any) {
      console.error('❌ Erreur prévisualisation PDF:', error);
      toast.error('Erreur lors de la prévisualisation PDF', {
        description: error.message
      });
    }
  };

  const handlePrintPreview = () => {
    if (previewContent) {
      previewPDF(previewContent);
    } else {
      handlePreview().then(() => {
        if (previewContent) {
          previewPDF(previewContent);
        }
      });
    }
  };

  const templates = [
    { value: 'professional', label: 'Professionnel', icon: FileText, color: 'blue' },
    { value: 'academic', label: 'Académique', icon: BookOpen, color: 'green' },
    { value: 'business', label: 'Business', icon: Layout, color: 'purple' },
    { value: 'modern', label: 'Moderne', icon: Palette, color: 'orange' }
  ];

  const pageSizes = [
    { value: 'A4', label: 'A4', description: '210 × 297 mm' },
    { value: 'A3', label: 'A3', description: '297 × 420 mm' },
    { value: 'Letter', label: 'Letter', description: '8.5 × 11 pouces' },
    { value: 'Legal', label: 'Legal', description: '8.5 × 14 pouces' }
  ];

  const fontFamilies = [
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Courier New', label: 'Courier New' }
  ];

  const marginOptions = [
    { value: 'narrow', label: 'Étroites', description: '1.0 cm' },
    { value: 'normal', label: 'Normales', description: '2.0 cm' },
    { value: 'wide', label: 'Larges', description: '3.0 cm' }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Export PDF</h3>
            <p className="text-sm text-white/70">Export professionnel avec table des matières</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePreview}
            disabled={isExporting || (!messages.length && !documentContent)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 rounded-lg transition-colors text-purple-300 text-sm"
          >
            <Eye className="w-4 h-4" />
            Aperçu
          </button>
          
          <button
            onClick={handleExport}
            disabled={isExporting || (!messages.length && !documentContent)}
            className="flex items-center gap-2 px-3 py-2 bg-pink-500/20 hover:bg-pink-500/30 disabled:opacity-50 rounded-lg transition-colors text-pink-300 text-sm"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-pink-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Export...' : 'Exporter'}
          </button>

          <button
            onClick={handlePrintPreview}
            disabled={isExporting || (!messages.length && !documentContent)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 disabled:opacity-50 rounded-lg transition-colors text-indigo-300 text-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimer
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
            <span className="text-white font-medium">Options d'export PDF</span>
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
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent"
                  />
                </div>

                {/* Template et format de page */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Template de mise en page
                    </label>
                    <div className="grid grid-cols-2 gap-2">
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

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Format de page
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {pageSizes.map(pageSize => (
                        <button
                          key={pageSize.value}
                          onClick={() => setOptions(prev => ({ ...prev, pageSize: pageSize.value as any }))}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            options.pageSize === pageSize.value
                              ? 'border-purple-400 bg-purple-500/20'
                              : 'border-white/20 hover:border-white/40 bg-white/5'
                          }`}
                        >
                          <div className="text-xs text-white/80 font-medium">{pageSize.label}</div>
                          <div className="text-xs text-white/50">{pageSize.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Options de mise en page */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Police de caractères
                    </label>
                    <select
                      value={options.fontFamily}
                      onChange={(e) => setOptions(prev => ({ ...prev, fontFamily: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent"
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
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent"
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
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent"
                    >
                      <option value={1.0} className="bg-slate-800">Simple</option>
                      <option value={1.2} className="bg-slate-800">1.2</option>
                      <option value={1.5} className="bg-slate-800">1.5</option>
                      <option value={2.0} className="bg-slate-800">Double</option>
                    </select>
                  </div>
                </div>

                {/* Orientation et marges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Orientation
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOptions(prev => ({ ...prev, orientation: 'portrait' }))}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          options.orientation === 'portrait'
                            ? 'border-purple-400 bg-purple-500/20'
                            : 'border-white/20 hover:border-white/40 bg-white/5'
                        }`}
                      >
                        <AlignLeft className="w-4 h-4 mx-auto text-white/80" />
                        <div className="text-xs text-white/80 mt-1">Portrait</div>
                      </button>
                      <button
                        onClick={() => setOptions(prev => ({ ...prev, orientation: 'landscape' }))}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          options.orientation === 'landscape'
                            ? 'border-purple-400 bg-purple-500/20'
                            : 'border-white/20 hover:border-white/40 bg-white/5'
                        }`}
                      >
                        <AlignLeft className="w-4 h-4 mx-auto text-white/80 rotate-90" />
                        <div className="text-xs text-white/80 mt-1">Paysage</div>
                      </button>
                    </div>
                  </div>

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
                              ? 'border-purple-400 bg-purple-500/20'
                              : 'border-white/20 hover:border-white/40 bg-white/5'
                          }`}
                        >
                          <div className="text-sm text-white/80">{margin.label}</div>
                          <div className="text-xs text-white/50">{margin.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Table des matières */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Profondeur table des matières
                    </label>
                    <select
                      value={options.tocDepth}
                      onChange={(e) => setOptions(prev => ({ ...prev, tocDepth: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent"
                    >
                      <option value={1} className="bg-slate-800">Niveau 1</option>
                      <option value={2} className="bg-slate-800">Niveaux 1-2</option>
                      <option value={3} className="bg-slate-800">Niveaux 1-3</option>
                      <option value={4} className="bg-slate-800">Niveaux 1-4</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Filigrane (watermark)
                    </label>
                    <input
                      type="text"
                      value={options.watermark}
                      onChange={(e) => setOptions(prev => ({ ...prev, watermark: e.target.value }))}
                      placeholder="Texte du filigrane..."
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Options d'inclusion */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={options.includeMetadata}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                      className="rounded border-white/20 bg-white/10 text-purple-400 focus:ring-purple-400/50"
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
                      className="rounded border-white/20 bg-white/10 text-purple-400 focus:ring-purple-400/50"
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
                      className="rounded border-white/20 bg-white/10 text-purple-400 focus:ring-purple-400/50"
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
                      className="rounded border-white/20 bg-white/10 text-purple-400 focus:ring-purple-400/50"
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
                      className="rounded border-white/20 bg-white/10 text-purple-400 focus:ring-purple-400/50"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white/80">Numéros de page</div>
                      <div className="text-xs text-white/50">Pagination automatique</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={options.includeBookmarks}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeBookmarks: e.target.checked }))}
                      className="rounded border-white/20 bg-white/10 text-purple-400 focus:ring-purple-400/50"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white/80">Signets</div>
                      <div className="text-xs text-white/50">Navigation par sections</div>
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
              className="bg-slate-900 rounded-xl border border-white/20 p-6 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Aperçu PDF</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrintPreview}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Imprimer l'aperçu"
                  >
                    <Printer className="w-5 h-5 text-white/60" />
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-white rounded-lg p-4">
                <iframe
                  srcDoc={previewContent}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
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
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors text-white font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
