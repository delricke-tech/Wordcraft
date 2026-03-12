import { useState } from 'react';
import { 
  Download, 
  FileText, 
  FileType2, 
  File as FilePdf, 
  Quote,
  X,
  ChevronDown,
  Check,
  Loader2
} from 'lucide-react';
import { markdownExportService, MarkdownExportOptions } from '../services/markdownExportService';
import { docxExportService, DocxExportOptions } from '../services/docxExportService';
import { pdfExportService, PdfExportOptions } from '../services/pdfExportService';
import { academicCitationService, CitationStyle } from '../services/academicCitationService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface DocumentExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
  documentTitle?: string;
  documentContent?: string;
  conversationId?: string;
  conversationMessages?: any[];
}

export function DocumentExportPanel({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  documentContent,
  conversationId,
  conversationMessages
}: DocumentExportPanelProps) {
  const { user } = useAuth();
  const [selectedFormat, setSelectedFormat] = useState<'markdown' | 'docx' | 'pdf' | 'citations'>('markdown');
  const [isExporting, setIsExporting] = useState(false);
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('apa');
  const [showOptions, setShowOptions] = useState(false);

  // Options d'export
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeCitations, setIncludeCitations] = useState(true);
  const [includeTimestamps, setIncludeTimestamps] = useState(false);

  const handleExport = async () => {
    if (!user) {
      toast.error('Connexion requise', { description: 'Vous devez être connecté pour exporter' });
      return;
    }

    setIsExporting(true);
    const loadingToast = toast.loading(`Export en cours au format ${selectedFormat.toUpperCase()}...`);

    try {
      let filename: string = documentTitle || conversationId || 'export';
      // Nettoyer le nom de fichier
      filename = String(filename).replace(/[^a-zA-Z0-9\-_\s]/g, '').substring(0, 50);

      switch (selectedFormat) {
        case 'markdown':
          await exportToMarkdown(String(filename), loadingToast);
          break;
        case 'docx':
          await exportToDocx(String(filename), loadingToast);
          break;
        case 'pdf':
          await exportToPdf(String(filename), loadingToast);
          break;
        case 'citations':
          await exportCitations(String(filename), loadingToast);
          break;
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'export:', error);
      toast.error('Erreur d\'export', {
        id: loadingToast,
        description: error.message || 'Une erreur est survenue'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToMarkdown = async (filename: string, loadingToast: string) => {
    const options: MarkdownExportOptions = {
      includeMetadata,
      includeTimestamps,
      includeCitations,
      includeTableOfContents: true,
      formatting: 'professional',
      language: 'fr',
      includeWordCount: true,
      includeReadingTime: true
    };

    let markdown = '';

    if (conversationMessages && conversationMessages.length > 0) {
      // Export conversation
      markdown = markdownExportService.exportConversationToMarkdown(
        conversationMessages,
        options
      );
    } else if (documentContent) {
      // Export document
      markdown = markdownExportService.exportDocumentToMarkdown(
        {
          documentName: documentTitle || 'Document',
          content: documentContent,
          metadata: {
            title: documentTitle || 'Document',
            author: user?.email || 'Utilisateur',
            date: new Date(),
            wordCount: documentContent.split(' ').length,
            readingTime: Math.ceil(documentContent.split(' ').length / 200),
            sources: 0
          }
        } as any,
        options
      );
    } else {
      throw new Error('Aucun contenu à exporter');
    }

    // Télécharger le fichier
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Export Markdown réussi !', {
      id: loadingToast,
      description: `Fichier "${filename}.md" téléchargé`
    });
  };

  const exportToDocx = async (filename: string, loadingToast: string) => {
    const options: DocxExportOptions = {
      includeMetadata,
      includeTimestamps,
      includeCitations,
      includeTableOfContents: true,
      includePageNumbers: true,
      includeHeader: true,
      includeFooter: true,
      formatting: 'professional',
      language: 'fr'
    };

    if (conversationMessages && conversationMessages.length > 0) {
      await docxExportService.exportConversationToDocx(
        conversationMessages,
        options
      );
    } else if (documentContent) {
      await docxExportService.exportDocumentToDocx(
        {
          documentName: documentTitle || 'Document',
          content: documentContent,
          metadata: {
            title: documentTitle || 'Document',
            created: new Date(),
            modified: new Date()
          }
        } as any,
        options
      );
    } else {
      throw new Error('Aucun contenu à exporter');
    }

    toast.success('Export Word réussi !', {
      id: loadingToast,
      description: `Fichier "${filename}.docx" téléchargé`
    });
  };

  const exportToPdf = async (filename: string, loadingToast: string) => {
    const options: PdfExportOptions = {
      includeMetadata,
      includeTimestamps,
      includeCitations,
      includeTableOfContents: true,
      includePageNumbers: true,
      formatting: 'professional',
      language: 'fr'
    };

    if (conversationMessages && conversationMessages.length > 0) {
      await pdfExportService.exportConversationToPdf(
        conversationMessages,
        options
      );
    } else if (documentContent) {
      await pdfExportService.exportDocumentToPdf(
        {
          documentName: documentTitle || 'Document',
          content: documentContent
        } as any,
        options
      );
    } else {
      throw new Error('Aucun contenu à exporter');
    }

    toast.success('Export PDF réussi !', {
      id: loadingToast,
      description: `Fichier "${filename}.pdf" téléchargé`
    });
  };

  const exportCitations = async (filename: string, loadingToast: string) => {
    // Simuler des citations pour le document
    const citations = [
      {
        id: '1',
        style: citationStyle,
        inText: '(Auteur, 2024)',
        fullReference: 'Auteur, A. (2024). Titre du document. Éditeur.',
        shortReference: 'Auteur (2024)',
        bibliographyEntry: 'Auteur, A. (2024). Titre du document. Éditeur.'
      }
    ];

    const bibliography = academicCitationService.generateBibliography(
      [],
      {
        style: citationStyle,
        format: 'bibliography',
        language: 'fr'
      }
    );

    const content = `# Bibliographie - ${citationStyle.toUpperCase()}\n\n${bibliography}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_bibliographie.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Bibliographie générée !', {
      id: loadingToast,
      description: `Style ${citationStyle.toUpperCase()} - ${citations.length} citations`
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <Download className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Exporter</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {documentTitle || 'Document sans titre'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Format d'export
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedFormat('markdown')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedFormat === 'markdown'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-teal-300'
                }`}
              >
                <FileText className={`w-8 h-8 ${
                  selectedFormat === 'markdown' ? 'text-teal-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  selectedFormat === 'markdown' ? 'text-teal-700' : 'text-gray-600'
                }`}>Markdown</span>
              </button>

              <button
                onClick={() => setSelectedFormat('docx')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedFormat === 'docx'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <FileType2 className={`w-8 h-8 ${
                  selectedFormat === 'docx' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  selectedFormat === 'docx' ? 'text-blue-700' : 'text-gray-600'
                }`}>Word (DOCX)</span>
              </button>

              <button
                onClick={() => setSelectedFormat('pdf')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedFormat === 'pdf'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
                }`}
              >
                <FilePdf className={`w-8 h-8 ${
                  selectedFormat === 'pdf' ? 'text-red-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  selectedFormat === 'pdf' ? 'text-red-700' : 'text-gray-600'
                }`}>PDF</span>
              </button>

              <button
                onClick={() => setSelectedFormat('citations')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedFormat === 'citations'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <Quote className={`w-8 h-8 ${
                  selectedFormat === 'citations' ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  selectedFormat === 'citations' ? 'text-purple-700' : 'text-gray-600'
                }`}>Citations</span>
              </button>
            </div>
          </div>

          {/* Options */}
          <div>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
              Options avancées
            </button>

            {showOptions && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3">
                {selectedFormat !== 'citations' && (
                  <>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        includeMetadata ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                      }`}>
                        {includeMetadata && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={includeMetadata}
                        onChange={(e) => setIncludeMetadata(e.target.checked)}
                        className="hidden"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Inclure les métadonnées</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        includeCitations ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                      }`}>
                        {includeCitations && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={includeCitations}
                        onChange={(e) => setIncludeCitations(e.target.checked)}
                        className="hidden"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Inclure les citations</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        includeTimestamps ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                      }`}>
                        {includeTimestamps && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={includeTimestamps}
                        onChange={(e) => setIncludeTimestamps(e.target.checked)}
                        className="hidden"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Inclure les horodatages</span>
                    </label>
                  </>
                )}

                {selectedFormat === 'citations' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Style de citation
                    </label>
                    <select
                      value={citationStyle}
                      onChange={(e) => setCitationStyle(e.target.value as CitationStyle)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="apa">APA (7th edition)</option>
                      <option value="mla">MLA (9th edition)</option>
                      <option value="chicago">Chicago (17th edition)</option>
                      <option value="harvard">Harvard</option>
                      <option value="ieee">IEEE</option>
                      <option value="vancouver">Vancouver</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Format {selectedFormat.toUpperCase()}</strong> : {' '}
              {selectedFormat === 'markdown' && 'Export en Markdown avec formatage professionnel et métadonnées.'}
              {selectedFormat === 'docx' && 'Export en Word (DOCX) avec mise en page et styles professionnels.'}
              {selectedFormat === 'pdf' && 'Export en PDF avec table des matières et numérotation des pages.'}
              {selectedFormat === 'citations' && 'Génération de bibliographie dans le style académique choisi.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exporter
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
