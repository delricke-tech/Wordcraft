import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  X,
  Check,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Quote,
  BookOpen
} from 'lucide-react';
import { academicCitationService, CitationStyle, AcademicCitation } from '../services/academicCitationService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface AcademicCitationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
}

export function AcademicCitationPanel({ isOpen, onClose, documentId }: AcademicCitationPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [citations, setCitations] = useState<AcademicCitation[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>('apa');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCitation, setNewCitation] = useState({
    title: '',
    authors: '',
    year: '',
    journal: '',
    doi: '',
    url: '',
    pages: '',
    volume: '',
    issue: ''
  });

  const citationStyles: CitationStyle[] = [
    { id: 'apa', name: 'APA 7th', description: 'American Psychological Association' },
    { id: 'mla', name: 'MLA 9th', description: 'Modern Language Association' },
    { id: 'chicago', name: 'Chicago 17th', description: 'Chicago Manual of Style' },
    { id: 'harvard', name: 'Harvard', description: 'Harvard Referencing System' },
    { id: 'ieee', name: 'IEEE', description: 'Institute of Electrical and Electronics Engineers' },
    { id: 'vancouver', name: 'Vancouver', description: 'Vancouver Style' }
  ];

  useEffect(() => {
    if (isOpen && user) {
      loadCitations();
    }
  }, [isOpen, user]);

  const loadCitations = async () => {
    try {
      const citationsData = await academicCitationService.getDocumentCitations(documentId || '');
      setCitations(citationsData);
    } catch (error) {
      console.error('Erreur chargement citations:', error);
    }
  };

  const handleAddCitation = async () => {
    if (!user || !documentId) return;
    
    setLoading(true);
    try {
      await academicCitationService.addCitation({
        documentId,
        userId: user.id,
        title: newCitation.title,
        authors: newCitation.authors.split(',').map(a => a.trim()),
        year: parseInt(newCitation.year),
        journal: newCitation.journal,
        doi: newCitation.doi,
        url: newCitation.url,
        pages: newCitation.pages,
        volume: newCitation.volume,
        issue: newCitation.issue,
        citationType: 'journal',
        citationStyle: selectedStyle
      });
      
      toast.success('Citation ajoutée !');
      setShowAddForm(false);
      setNewCitation({
        title: '',
        authors: '',
        year: '',
        journal: '',
        doi: '',
        url: '',
        pages: '',
        volume: '',
        issue: ''
      });
      loadCitations();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCitation = async (citationId: string) => {
    setLoading(true);
    try {
      await academicCitationService.deleteCitation(citationId);
      toast.success('Citation supprimée');
      loadCitations();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCitations = async () => {
    if (!documentId) return;
    
    setLoading(true);
    try {
      const exportedCitations = await academicCitationService.exportCitations(documentId, selectedStyle);
      
      // Créer un fichier et le télécharger
      const blob = new Blob([exportedCitations], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `citations_${selectedStyle}_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Citations exportées !');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  const formatCitation = (citation: AcademicCitation): string => {
    switch (selectedStyle) {
      case 'apa':
        return `${citation.authors.join(', ')} (${citation.year}). ${citation.title}. ${citation.journal}, ${citation.volume}(${citation.issue}), ${citation.pages}.`;
      case 'mla':
        return `${citation.authors[0]} et al. "${citation.title}." ${citation.journal}, vol. ${citation.issue}, no. ${citation.volume}, ${citation.year}, pp. ${citation.pages}.`;
      default:
        return `${citation.authors.join(', ')} - ${citation.title} (${citation.year})`;
    }
  };

  const getCitationIcon = (type: string) => {
    switch (type) {
      case 'journal': return <FileText className="w-4 h-4" />;
      case 'book': return <BookOpen className="w-4 h-4" />;
      default: return <Quote className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Citations Académiques</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {citations.length} citations • Style: {selectedStyle.toUpperCase()}
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

        {/* Style Selector */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Style de citation</h3>
            <button
              onClick={handleExportCitations}
              disabled={loading || citations.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Exporter
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {citationStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  selectedStyle === style.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <p className="font-medium text-gray-900 dark:text-white">{style.name}</p>
                <p className="text-xs text-gray-500 mt-1">{style.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Citations du document
            </h3>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter une citation
            </button>
          </div>

          {showAddForm && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Titre de l'œuvre"
                  value={newCitation.title}
                  onChange={(e) => setNewCitation({ ...newCitation, title: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
                <input
                  type="text"
                  placeholder="Auteurs (séparés par des virgules)"
                  value={newCitation.authors}
                  onChange={(e) => setNewCitation({ ...newCitation, authors: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
                <input
                  type="number"
                  placeholder="Année"
                  value={newCitation.year}
                  onChange={(e) => setNewCitation({ ...newCitation, year: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
                <input
                  type="text"
                  placeholder="Journal/Revue"
                  value={newCitation.journal}
                  onChange={(e) => setNewCitation({ ...newCitation, journal: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
                <input
                  type="text"
                  placeholder="DOI"
                  value={newCitation.doi}
                  onChange={(e) => setNewCitation({ ...newCitation, doi: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={newCitation.url}
                  onChange={(e) => setNewCitation({ ...newCitation, url: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCitation}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Ajouter
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {citations.length > 0 ? (
            <div className="space-y-3">
              {citations.map((citation) => (
                <div
                  key={citation.id}
                  className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                      {getCitationIcon(citation.citationType)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white mb-1">
                        {citation.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {citation.authors.join(', ')} ({citation.year})
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                        {formatCitation(citation)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCitation(citation.id)}
                    disabled={loading}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Aucune citation</p>
              <p className="text-sm mt-1">Ajoutez vos premières citations académiques</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
