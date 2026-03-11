/**
 * Composant d'export citations académiques (APA, MLA, Chicago, etc.)
 * 
 * Ce composant permet de formater et exporter des citations selon les normes
 * académiques internationales avec interface complète et prévisualisation
 * 
 * Date: 11 mars 2026
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  convertToAcademicCitation,
  formatCitation,
  generateBibliography,
  exportCitations,
  convertMultipleCitations,
  generateInTextCitations,
  validateCitation,
  type AcademicCitation,
  type CitationStyle,
  type BibliographyOptions,
  type CitationOptions
} from '../services/academicCitationService';
import type { Citation, EnhancedCitation } from '../services/citationService';

interface AcademicCitationExportProps {
  citations: (Citation | EnhancedCitation)[];
  onExportComplete?: (filename: string) => void;
  className?: string;
  showPreview?: boolean;
}

interface ExportSettings {
  style: CitationStyle;
  format: 'in-text' | 'footnote' | 'bibliography';
  language: 'fr' | 'en' | 'es';
  includeDOI: boolean;
  includeURL: boolean;
  includeRetrieved: boolean;
  maxAuthors: number;
  bibliographyTitle: string;
  sortBy: 'author' | 'title' | 'year' | 'type';
  groupByType: boolean;
  includeAnnotations: boolean;
}

const AcademicCitationExport: React.FC<AcademicCitationExportProps> = ({
  citations,
  onExportComplete,
  className = '',
  showPreview = true
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    style: 'apa',
    format: 'bibliography',
    language: 'fr',
    includeDOI: true,
    includeURL: false,
    includeRetrieved: true,
    maxAuthors: 6,
    bibliographyTitle: 'Bibliographie',
    sortBy: 'author',
    groupByType: false,
    includeAnnotations: false
  });

  const [showSettings, setShowSettings] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'in-text' | 'validation'>('preview');

  // Convertir les citations en format académique
  const academicCitations = useMemo(() => {
    return convertMultipleCitations(citations, {
      style: settings.style,
      format: settings.format,
      language: settings.language,
      includeDOI: settings.includeDOI,
      includeURL: settings.includeURL,
      includeRetrieved: settings.includeRetrieved,
      maxAuthors: settings.maxAuthors
    });
  }, [citations, settings]);

  // Générer l'aperçu
  const generatePreview = useCallback(() => {
    try {
      let previewText = '';

      if (settings.format === 'bibliography') {
        const bibliographyOptions: BibliographyOptions = {
          style: settings.style,
          format: settings.format,
          language: settings.language,
          includeDOI: settings.includeDOI,
          includeURL: settings.includeURL,
          includeRetrieved: settings.includeRetrieved,
          maxAuthors: settings.maxAuthors,
          title: settings.bibliographyTitle,
          sortBy: settings.sortBy,
          groupByType: settings.groupByType,
          includeAnnotations: settings.includeAnnotations
        };

        previewText = generateBibliography(academicCitations, bibliographyOptions);
      } else {
        // Format in-text ou footnote
        academicCitations.forEach((citation, index) => {
          const formattedCitation = formatCitation(citation, {
            style: settings.style,
            format: settings.format,
            language: settings.language,
            includeDOI: settings.includeDOI,
            includeURL: settings.includeURL,
            includeRetrieved: settings.includeRetrieved,
            maxAuthors: settings.maxAuthors
          });

          if (settings.format === 'in-text') {
            const inTextCitations = generateInTextCitations([citation], settings.style);
            previewText += `${index + 1}. ${inTextCitations[0]}\n`;
          } else {
            previewText += `${index + 1}. ${formattedCitation}\n`;
          }
        });
      }

      setPreview(previewText);
      setShowPreviewModal(true);

    } catch (error) {
      console.error('❌ Erreur génération aperçu:', error);
      setPreview('# Erreur de génération\n\nImpossible de générer l\'aperçu des citations académiques.');
      setShowPreviewModal(true);
    }
  }, [academicCitations, settings]);

  // Exporter les citations
  const handleExport = useCallback(async () => {
    setIsExporting(true);

    try {
      const bibliographyOptions: BibliographyOptions = {
        style: settings.style,
        format: settings.format,
        language: settings.language,
        includeDOI: settings.includeDOI,
        includeURL: settings.includeURL,
        includeRetrieved: settings.includeRetrieved,
        maxAuthors: settings.maxAuthors,
        title: settings.bibliographyTitle,
        sortBy: settings.sortBy,
        groupByType: settings.groupByType,
        includeAnnotations: settings.includeAnnotations
      };

      const filename = `bibliography_${settings.style}_${new Date().toISOString().slice(0, 10)}`;
      
      exportCitations(academicCitations, bibliographyOptions);
      
      onExportComplete?.(filename);
      console.log(`✅ Bibliographie exportée: ${filename}`);

    } catch (error) {
      console.error('❌ Erreur export citations:', error);
    } finally {
      setIsExporting(false);
    }
  }, [academicCitations, settings, onExportComplete]);

  // Valider les citations
  const validationResults = useMemo(() => {
    return academicCitations.map(citation => ({
      citation,
      validation: validateCitation(citation)
    }));
  }, [academicCitations]);

  const hasErrors = validationResults.some(result => result.validation.errors.length > 0);
  const hasWarnings = validationResults.some(result => result.validation.warnings.length > 0);

  // Mettre à jour les paramètres
  const updateSetting = useCallback((key: keyof ExportSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Render des options de style
  const renderStyleOptions = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {[
        { value: 'apa', label: 'APA (7th)', description: 'American Psychological Association' },
        { value: 'mla', label: 'MLA (9th)', description: 'Modern Language Association' },
        { value: 'chicago', label: 'Chicago (17th)', description: 'Chicago Manual of Style' },
        { value: 'harvard', label: 'Harvard', description: 'Harvard Referencing System' },
        { value: 'ieee', label: 'IEEE', description: 'Institute of Electrical Engineers' },
        { value: 'vancouver', label: 'Vancouver', description: 'Vancouver System' }
      ].map(style => (
        <label
          key={style.value}
          className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-colors ${
            settings.style === style.value 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="style"
              value={style.value}
              checked={settings.style === style.value}
              onChange={(e) => updateSetting('style', e.target.value)}
              className="text-blue-600"
            />
            <span className="font-medium text-sm">{style.label}</span>
          </div>
          <span className="text-xs text-gray-600 mt-1">{style.description}</span>
        </label>
      ))}
    </div>
  );

  // Render de l'aperçu
  const renderPreview = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-800">Aperçu des citations</h4>
        <div className="text-sm text-gray-600">
          {academicCitations.length} citation{academicCitations.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
        {academicCitations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📚</div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">Aucune citation</h4>
            <p className="text-gray-600">Ajoutez des citations pour voir l'aperçu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {academicCitations.slice(0, 5).map((citation, index) => (
              <div key={citation.id} className="text-sm">
                <span className="text-gray-500 mr-2">{index + 1}.</span>
                <span className="text-gray-700">
                  {formatCitation(citation, {
                    style: settings.style,
                    format: settings.format,
                    language: settings.language,
                    includeDOI: settings.includeDOI,
                    includeURL: settings.includeURL,
                    includeRetrieved: settings.includeRetrieved,
                    maxAuthors: settings.maxAuthors
                  })}
                </span>
              </div>
            ))}
            {academicCitations.length > 5 && (
              <div className="text-sm text-gray-500 italic">
                ... et {academicCitations.length - 5} autres citations
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Render des citations in-text
  const renderInTextCitations = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-800">Citations dans le texte</h4>
        <div className="text-sm text-gray-600">
          Format {settings.style.toUpperCase()}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
        {academicCitations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📝</div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">Aucune citation</h4>
            <p className="text-gray-600">Ajoutez des citations pour voir les citations in-text</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-3">
              Exemple d'utilisation dans un texte :
            </p>
            <div className="bg-white border border-gray-300 rounded p-3 text-sm">
              <p className="mb-2">
                Selon les recherches récentes {generateInTextCitations([academicCitations[0]], settings.style)[0]}, 
                les résultats montrent une amélioration significative {generateInTextCitations([academicCitations[1] || academicCitations[0]], settings.style)[0]}. 
                D'autres études confirment ces tendances {generateInTextCitations([academicCitations[2] || academicCitations[0]], settings.style)[0]}.
              </p>
            </div>
            
            <div className="mt-4">
              <h5 className="font-medium text-sm text-gray-700 mb-2">Liste des citations in-text :</h5>
              <div className="space-y-1">
                {academicCitations.slice(0, 10).map((citation, index) => (
                  <div key={citation.id} className="text-xs text-gray-600">
                    {index + 1}. {generateInTextCitations([citation], settings.style)[0]}
                  </div>
                ))}
                {academicCitations.length > 10 && (
                  <div className="text-xs text-gray-500 italic">
                    ... et {academicCitations.length - 10} autres
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render de la validation
  const renderValidation = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-800">Validation des citations</h4>
        <div className="flex items-center gap-2">
          {hasErrors && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
              {validationResults.filter(r => r.validation.errors.length > 0).length} erreurs
            </span>
          )}
          {hasWarnings && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
              {validationResults.filter(r => r.validation.warnings.length > 0).length} avertissements
            </span>
          )}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
        {validationResults.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">Aucune citation à valider</h4>
            <p className="text-gray-600">Ajoutez des citations pour voir la validation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {validationResults.map((result, index) => (
              <div key={result.citation.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {result.validation.isValid ? (
                      <span className="text-green-500">✅</span>
                    ) : (
                      <span className="text-red-500">❌</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800 mb-1">
                      Citation {index + 1}
                    </div>
                    <div className="text-xs text-gray-600 mb-2 truncate">
                      {result.citation.title}
                    </div>
                    
                    {result.validation.errors.length > 0 && (
                      <div className="space-y-1">
                        {result.validation.errors.map((error, errorIndex) => (
                          <div key={errorIndex} className="text-xs text-red-600">
                            • {error}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {result.validation.warnings.length > 0 && (
                      <div className="space-y-1">
                        {result.validation.warnings.map((warning, warningIndex) => (
                          <div key={warningIndex} className="text-xs text-yellow-600">
                            ⚠️ {warning}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`academic-citation-export ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>🎓</span>
            Export Citations Académiques
          </h3>
          <p className="text-sm text-gray-600">
            Formater et exporter selon les normes APA, MLA, Chicago, etc.
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
            disabled={isExporting || academicCitations.length === 0}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Export...
              </>
            ) : (
              <>
                <span>📚</span>
                Exporter
              </>
            )}
          </button>
        </div>
      </div>

      {/* Paramètres */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
          <h4 className="font-medium text-gray-800 mb-4">Paramètres d'export académique</h4>
          
          {/* Style de citation */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Style de citation
            </label>
            {renderStyleOptions()}
          </div>

          {/* Options de formatage */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <select
                value={settings.format}
                onChange={(e) => updateSetting('format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="bibliography">Bibliographie</option>
                <option value="in-text">In-text</option>
                <option value="footnote">Notes de bas de page</option>
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

            {/* Nombre maximum d'auteurs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max. auteurs
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.maxAuthors}
                onChange={(e) => updateSetting('maxAuthors', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Options d'inclusion */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.includeDOI}
                  onChange={(e) => updateSetting('includeDOI', e.target.checked)}
                  className="rounded"
                />
                Inclure DOI
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.includeURL}
                  onChange={(e) => updateSetting('includeURL', e.target.checked)}
                  className="rounded"
                />
                Inclure URL
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.includeRetrieved}
                  onChange={(e) => updateSetting('includeRetrieved', e.target.checked)}
                  className="rounded"
                />
                Inclure date de consultation
              </label>
            </div>

            {/* Options de bibliographie */}
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de la bibliographie
                </label>
                <input
                  type="text"
                  value={settings.bibliographyTitle}
                  onChange={(e) => updateSetting('bibliographyTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tri par
                </label>
                <select
                  value={settings.sortBy}
                  onChange={(e) => updateSetting('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="author">Auteur</option>
                  <option value="title">Titre</option>
                  <option value="year">Année</option>
                  <option value="type">Type</option>
                </select>
              </div>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.groupByType}
                  onChange={(e) => updateSetting('groupByType', e.target.checked)}
                  className="rounded"
                />
                Regrouper par type
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex space-x-8">
          {['preview', 'in-text', 'validation'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'preview' && 'Aperçu'}
              {tab === 'in-text' && 'Citations in-text'}
              {tab === 'validation' && 'Validation'}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'preview' && renderPreview()}
        {activeTab === 'in-text' && renderInTextCitations()}
        {activeTab === 'validation' && renderValidation()}
      </div>

      {/* Modal d'aperçu */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Aperçu - Style {settings.style.toUpperCase()}
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
                  📚 Exporter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicCitationExport;
