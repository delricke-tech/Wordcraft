/**
 * Composant d'export Markdown avancé
 * 
 * Ce composant fournit une interface complète pour exporter des contenus
 * au format Markdown avec options de formatage professionnel
 * 
 * Date: 11 mars 2026
 */

import React, { useState, useCallback } from 'react';
import { 
  exportConversationToMarkdown, 
  exportDocumentToMarkdown, 
  downloadMarkdownFile,
  type MarkdownExportOptions,
  markdownExportService 
} from '../services/markdownExportService';
import type { ChatMessage } from '../services/openaiService';
import type { DocumentContext } from '../services/openaiService';

interface MarkdownExportProps {
  content: {
    type: 'conversation' | 'document' | 'structured';
    data: ChatMessage[] | DocumentContext | any[];
  };
  onExportComplete?: (filename: string) => void;
  className?: string;
  showPreview?: boolean;
}

interface ExportSettings {
  formatting: 'basic' | 'academic' | 'professional' | 'minimal';
  language: 'fr' | 'en' | 'es';
  includeMetadata: boolean;
  includeTimestamps: boolean;
  includeCitations: boolean;
  includeTableOfContents: boolean;
  includeWordCount: boolean;
  includeReadingTime: boolean;
  customHeader: string;
  customFooter: string;
}

const MarkdownExport: React.FC<MarkdownExportProps> = ({
  content,
  onExportComplete,
  className = '',
  showPreview = true
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [settings, setSettings] = useState<ExportSettings>({
    formatting: 'professional',
    language: 'fr',
    includeMetadata: true,
    includeTimestamps: true,
    includeCitations: true,
    includeTableOfContents: true,
    includeWordCount: true,
    includeReadingTime: true,
    customHeader: '',
    customFooter: ''
  });

  // Générer le nom de fichier par défaut
  const generateFilename = useCallback(() => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const type = content.type === 'conversation' ? 'conversation' : 
                 content.type === 'document' ? 'document' : 'export';
    return `${type}_${timestamp}`;
  }, [content.type]);

  // Générer l'aperçu
  const generatePreview = useCallback(() => {
    try {
      let markdown = '';
      
      const options: MarkdownExportOptions = {
        includeMetadata: settings.includeMetadata,
        includeTimestamps: settings.includeTimestamps,
        includeCitations: settings.includeCitations,
        includeTableOfContents: settings.includeTableOfContents,
        formatting: settings.formatting,
        language: settings.language,
        includeWordCount: settings.includeWordCount,
        includeReadingTime: settings.includeReadingTime,
        customHeader: settings.customHeader || undefined,
        customFooter: settings.customFooter || undefined
      };

      switch (content.type) {
        case 'conversation':
          markdown = exportConversationToMarkdown(content.data as ChatMessage[], options);
          break;
        case 'document':
          markdown = exportDocumentToMarkdown(content.data as DocumentContext, options);
          break;
        case 'structured':
          markdown = markdownExportService.exportStructuredMarkdown(content.data as any[], options);
          break;
      }

      setPreview(markdown);
      setShowPreviewModal(true);
      
    } catch (error) {
      console.error('❌ Erreur génération aperçu:', error);
      setPreview('# Erreur de génération\n\nImpossible de générer l\'aperçu Markdown.');
      setShowPreviewModal(true);
    }
  }, [content, settings]);

  // Exporter le fichier
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    
    try {
      const options: MarkdownExportOptions = {
        includeMetadata: settings.includeMetadata,
        includeTimestamps: settings.includeTimestamps,
        includeCitations: settings.includeCitations,
        includeTableOfContents: settings.includeTableOfContents,
        formatting: settings.formatting,
        language: settings.language,
        includeWordCount: settings.includeWordCount,
        includeReadingTime: settings.includeReadingTime,
        customHeader: settings.customHeader || undefined,
        customFooter: settings.customFooter || undefined
      };

      let markdown = '';
      
      switch (content.type) {
        case 'conversation':
          markdown = exportConversationToMarkdown(content.data as ChatMessage[], options);
          break;
        case 'document':
          markdown = exportDocumentToMarkdown(content.data as DocumentContext, options);
          break;
        case 'structured':
          markdown = markdownExportService.exportStructuredMarkdown(content.data as any[], options);
          break;
      }

      const filename = generateFilename();
      await downloadMarkdownFile(markdown, filename, options);
      
      onExportComplete?.(filename);
      console.log(`✅ Export Markdown réussi: ${filename}.md`);
      
    } catch (error) {
      console.error('❌ Erreur export Markdown:', error);
    } finally {
      setIsExporting(false);
    }
  }, [content, settings, generateFilename, onExportComplete]);

  // Copier dans le presse-papiers
  const handleCopyToClipboard = useCallback(async () => {
    try {
      const options: MarkdownExportOptions = {
        includeMetadata: settings.includeMetadata,
        includeTimestamps: settings.includeTimestamps,
        includeCitations: settings.includeCitations,
        includeTableOfContents: settings.includeTableOfContents,
        formatting: settings.formatting,
        language: settings.language,
        includeWordCount: settings.includeWordCount,
        includeReadingTime: settings.includeReadingTime,
        customHeader: settings.customHeader || undefined,
        customFooter: settings.customFooter || undefined
      };

      let markdown = '';
      
      switch (content.type) {
        case 'conversation':
          markdown = exportConversationToMarkdown(content.data as ChatMessage[], options);
          break;
        case 'document':
          markdown = exportDocumentToMarkdown(content.data as DocumentContext, options);
          break;
        case 'structured':
          markdown = markdownExportService.exportStructuredMarkdown(content.data as any[], options);
          break;
      }

      await navigator.clipboard.writeText(markdown);
      console.log('✅ Markdown copié dans le presse-papiers');
      
    } catch (error) {
      console.error('❌ Erreur copie presse-papiers:', error);
    }
  }, [content, settings]);

  const updateSetting = useCallback((key: keyof ExportSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className={`markdown-export ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>📝</span>
            Export Markdown
          </h3>
          <p className="text-sm text-gray-600">
            Exporter au format Markdown avec formatage professionnel
          </p>
        </div>
        
        <div className="flex gap-2">
          {showPreview && (
            <button
              onClick={generatePreview}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              👁️ Aperçu
            </button>
          )}
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            ⚙️ Paramètres
          </button>
          
          <button
            onClick={handleCopyToClipboard}
            className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            📋 Copier
          </button>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Export...
              </>
            ) : (
              <>
                <span>💾</span>
                Exporter
              </>
            )}
          </button>
        </div>
      </div>

      {/* Paramètres */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-800 mb-3">Paramètres d'export</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Formatage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Style de formatage
              </label>
              <select
                value={settings.formatting}
                onChange={(e) => updateSetting('formatting', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="basic">Basic</option>
                <option value="professional">Professionnel</option>
                <option value="academic">Académique</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>

            {/* Langue */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Langue
              </label>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.includeMetadata}
                  onChange={(e) => updateSetting('includeMetadata', e.target.checked)}
                  className="rounded"
                />
                Inclure métadonnées
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.includeTimestamps}
                  onChange={(e) => updateSetting('includeTimestamps', e.target.checked)}
                  className="rounded"
                />
                Inclure timestamps
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.includeCitations}
                  onChange={(e) => updateSetting('includeCitations', e.target.checked)}
                  className="rounded"
                />
                Inclure citations
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.includeTableOfContents}
                  onChange={(e) => updateSetting('includeTableOfContents', e.target.checked)}
                  className="rounded"
                />
                Table des matières
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.includeWordCount}
                  onChange={(e) => updateSetting('includeWordCount', e.target.checked)}
                  className="rounded"
                />
                Nombre de mots
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.includeReadingTime}
                  onChange={(e) => updateSetting('includeReadingTime', e.target.checked)}
                  className="rounded"
                />
                Temps de lecture
              </label>
            </div>

            {/* En-tête personnalisé */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                En-tête personnalisé (optionnel)
              </label>
              <textarea
                value={settings.customHeader}
                onChange={(e) => updateSetting('customHeader', e.target.value)}
                placeholder="En-tête personnalisé..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={2}
              />
            </div>

            {/* Pied de page personnalisé */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pied de page personnalisé (optionnel)
              </label>
              <textarea
                value={settings.customFooter}
                onChange={(e) => updateSetting('customFooter', e.target.value)}
                placeholder="Pied de page personnalisé..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={2}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal d'aperçu */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Aperçu Markdown
                </h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="bg-gray-50 rounded p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {preview}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={handleCopyToClipboard}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  📋 Copier
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleExport();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  💾 Exporter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownExport;
