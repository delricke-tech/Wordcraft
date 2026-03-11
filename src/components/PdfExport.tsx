/**
 * Composant d'export PDF avec table des matières et mise en page professionnelle
 * 
 * Ce composant fournit une interface complète pour exporter des contenus
 * au format PDF avec options de formatage avancées
 * 
 * Date: 11 mars 2026
 */

import React, { useState, useCallback } from 'react';
import { 
  exportConversationToPdf, 
  exportDocumentToPdf, 
  exportAndDownloadConversation,
  exportAndDownloadDocument,
  type PdfExportOptions,
  pdfExportService 
} from '../services/pdfExportService';
import type { ChatMessage } from '../services/openaiService';
import type { DocumentContext } from '../services/openaiService';

interface PdfExportProps {
  content: {
    type: 'conversation' | 'document';
    data: ChatMessage[] | DocumentContext;
  };
  onExportComplete?: (filename: string) => void;
  className?: string;
  showPreview?: boolean;
}

interface ExportSettings {
  formatting: 'basic' | 'academic' | 'professional' | 'minimal';
  language: 'fr' | 'en' | 'es';
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  orientation: 'portrait' | 'landscape';
  pageSize: 'a4' | 'a3' | 'letter';
  includeMetadata: boolean;
  includeTimestamps: boolean;
  includeCitations: boolean;
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
  includeHeader: boolean;
  includeFooter: boolean;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  customHeader: string;
  customFooter: string;
  watermark: string;
}

const PdfExport: React.FC<PdfExportProps> = ({
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
    fontSize: 12,
    fontFamily: 'helvetica',
    lineHeight: 1.5,
    orientation: 'portrait',
    pageSize: 'a4',
    includeMetadata: true,
    includeTimestamps: true,
    includeCitations: true,
    includeTableOfContents: true,
    includePageNumbers: true,
    includeHeader: true,
    includeFooter: true,
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    customHeader: '',
    customFooter: '',
    watermark: ''
  });

  // Générer le nom de fichier par défaut
  const generateFilename = useCallback(() => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const type = content.type === 'conversation' ? 'conversation' : 'document';
    return `${type}_${timestamp}`;
  }, [content.type]);

  // Générer l'aperçu
  const generatePreview = useCallback(() => {
    try {
      let previewText = '';
      
      const options: PdfExportOptions = {
        includeMetadata: settings.includeMetadata,
        includeTimestamps: settings.includeTimestamps,
        includeCitations: settings.includeCitations,
        includeTableOfContents: settings.includeTableOfContents,
        includePageNumbers: settings.includePageNumbers,
        includeHeader: settings.includeHeader,
        includeFooter: settings.includeFooter,
        formatting: settings.formatting,
        language: settings.language,
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        lineHeight: settings.lineHeight,
        orientation: settings.orientation,
        pageSize: settings.pageSize,
        margins: settings.margins,
        customHeader: settings.customHeader || undefined,
        customFooter: settings.customFooter || undefined,
        watermark: settings.watermark || undefined
      };

      if (content.type === 'conversation') {
        previewText = pdfExportService.generatePreview(content.data as ChatMessage[], options);
      } else {
        const document = content.data as DocumentContext;
        previewText = `DOCUMENT: ${document.documentName}\n\n`;
        previewText += `Taille: ${(document.extractedText?.length || 0).toLocaleString()} caractères\n`;
        previewText += `Type: ${document.documentName.split('.').pop()?.toUpperCase()}\n`;
        previewText += `Orientation: ${settings.orientation}\n`;
        previewText += `Format: ${settings.pageSize}\n\n`;
        previewText += `Aperçu du contenu:\n`;
        previewText += (document.extractedText || '').substring(0, 500) + 
                     ((document.extractedText || '').length > 500 ? '...' : '');
      }

      setPreview(previewText);
      setShowPreviewModal(true);
      
    } catch (error) {
      console.error('❌ Erreur génération aperçu:', error);
      setPreview('# Erreur de génération\n\nImpossible de générer l\'aperçu PDF.');
      setShowPreviewModal(true);
    }
  }, [content, settings]);

  // Exporter le fichier
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    
    try {
      const options: PdfExportOptions = {
        includeMetadata: settings.includeMetadata,
        includeTimestamps: settings.includeTimestamps,
        includeCitations: settings.includeCitations,
        includeTableOfContents: settings.includeTableOfContents,
        includePageNumbers: settings.includePageNumbers,
        includeHeader: settings.includeHeader,
        includeFooter: settings.includeFooter,
        formatting: settings.formatting,
        language: settings.language,
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        lineHeight: settings.lineHeight,
        orientation: settings.orientation,
        pageSize: settings.pageSize,
        margins: settings.margins,
        customHeader: settings.customHeader || undefined,
        customFooter: settings.customFooter || undefined,
        watermark: settings.watermark || undefined
      };

      const filename = generateFilename();
      
      if (content.type === 'conversation') {
        await exportAndDownloadConversation(content.data as ChatMessage[], filename, options);
      } else {
        await exportAndDownloadDocument(content.data as DocumentContext, filename, options);
      }
      
      onExportComplete?.(filename);
      console.log(`✅ Export PDF réussi: ${filename}.pdf`);
      
    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  }, [content, settings, generateFilename, onExportComplete]);

  const updateSetting = useCallback((key: keyof ExportSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateMargin = useCallback((side: keyof ExportSettings['margins'], value: number) => {
    setSettings(prev => ({
      ...prev,
      margins: { ...prev.margins, [side]: value }
    }));
  }, []);

  return (
    <div className={`pdf-export ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>📄</span>
            Export PDF
          </h3>
          <p className="text-sm text-gray-600">
            Exporter au format PDF avec table des matières et mise en page
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
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
          <h4 className="font-medium text-gray-800 mb-3">Paramètres d'export PDF</h4>
          
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

            {/* Orientation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orientation
              </label>
              <select
                value={settings.orientation}
                onChange={(e) => updateSetting('orientation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Paysage</option>
              </select>
            </div>

            {/* Format de page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format de page
              </label>
              <select
                value={settings.pageSize}
                onChange={(e) => updateSetting('pageSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="a4">A4</option>
                <option value="a3">A3</option>
                <option value="letter">Letter</option>
              </select>
            </div>

            {/* Police */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Police
              </label>
              <select
                value={settings.fontFamily}
                onChange={(e) => updateSetting('fontFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="helvetica">Helvetica</option>
                <option value="times">Times</option>
                <option value="courier">Courier</option>
                <option value="arial">Arial</option>
              </select>
            </div>

            {/* Taille de police */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taille de police (pt)
              </label>
              <input
                type="number"
                min="8"
                max="24"
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Interligne */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interligne
              </label>
              <input
                type="number"
                min="1"
                max="3"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) => updateSetting('lineHeight', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
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
                  checked={settings.includePageNumbers}
                  onChange={(e) => updateSetting('includePageNumbers', e.target.checked)}
                  className="rounded"
                />
                Numéros de page
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.includeHeader}
                  onChange={(e) => updateSetting('includeHeader', e.target.checked)}
                  className="rounded"
                />
                En-tête
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.includeFooter}
                  onChange={(e) => updateSetting('includeFooter', e.target.checked)}
                  className="rounded"
                />
                Pied de page
              </label>
            </div>

            {/* Marges */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marges (mm)
              </label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs text-gray-600">Haut</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={settings.margins.top}
                    onChange={(e) => updateMargin('top', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Droit</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={settings.margins.right}
                    onChange={(e) => updateMargin('right', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Bas</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={settings.margins.bottom}
                    onChange={(e) => updateMargin('bottom', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Gauche</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={settings.margins.left}
                    onChange={(e) => updateMargin('left', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>

            {/* En-tête personnalisé */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                En-tête personnalisé (optionnel)
              </label>
              <input
                type="text"
                value={settings.customHeader}
                onChange={(e) => updateSetting('customHeader', e.target.value)}
                placeholder="En-tête personnalisé..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Pied de page personnalisé */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pied de page personnalisé (optionnel)
              </label>
              <input
                type="text"
                value={settings.customFooter}
                onChange={(e) => updateSetting('customFooter', e.target.value)}
                placeholder="Pied de page personnalisé..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Watermark */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Watermark (optionnel)
              </label>
              <input
                type="text"
                value={settings.watermark}
                onChange={(e) => updateSetting('watermark', e.target.value)}
                placeholder="Texte du watermark..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                  Aperçu PDF
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

export default PdfExport;
