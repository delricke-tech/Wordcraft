import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Sparkles, 
  Loader2, 
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Document } from '../lib/supabase';
import { extractPDFFromStorage, ExtractedPDFResult } from '../services/pdfExtractor';
import { generateQuizFromText, GeneratedQuiz } from '../services/quizGenerator';
import { QuizPlayer } from '../components/quiz/QuizPlayer';

// Type compatible avec l'ancien ExtractedDocument
type ExtractedDocument = ExtractedPDFResult;

export function DocumentView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [extractedDocument, setExtractedDocument] = useState<ExtractedDocument | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  // Charger le document
  useState(() => {
    if (id && user) {
      loadDocument();
    }
  });

  const loadDocument = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDocument(data);

      // Si le texte a déjà été extrait, le charger
      if (data.extracted_text) {
        setExtractedDocument({
          text: data.extracted_text,
          rawText: data.extracted_text,
          cleanText: data.extracted_text,
          metadata: {
            pages: data.page_count || 0,
            words: data.extracted_text.split(/\s+/).length,
            characters: data.extracted_text.length,
            extractedAt: data.updated_at
          },
          pages: []
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du document:', error);
      alert('Impossible de charger le document');
    } finally {
      setLoading(false);
    }
  };

  // Extraire et transformer le texte du PDF
  const handleExtractText = async () => {
    // RÈGLE : Utiliser storage_path (chemin nettoyé) pour accéder au fichier
    if (!document || !document.storage_path) return;

    setExtracting(true);
    try {
      console.log('🔍 Extraction du PDF depuis Supabase Storage...');
      console.log('  - Nom avec accents (affichage):', document.name);
      console.log('  - Storage path (téléchargement):', document.storage_path);
      
      // Utiliser le service d'extraction qui télécharge depuis Supabase
      const extracted = await extractPDFFromStorage(document.storage_path);
      setExtractedDocument(extracted);

      console.log('📊 Statistiques du document:', extracted.metadata);

      // Sauvegarder le texte nettoyé dans la BDD
      const { error } = await supabase
        .from('documents')
        .update({ 
          extracted_text: extracted.cleanText,
          page_count: extracted.metadata.pages,
          processing_status: 'completed'
        })
        .eq('id', document.id);

      if (error) {
        console.error('Erreur lors de la sauvegarde du texte:', error);
      } else {
        console.log('✅ Texte extrait, nettoyé et sauvegardé');
      }
    } catch (error) {
      console.error('❌ Erreur extraction:', error);
      alert('Impossible d\'extraire le texte du PDF. Assurez-vous que le fichier est accessible.');
    } finally {
      setExtracting(false);
    }
  };

  // Générer un quiz avec OpenAI
  const handleGenerateQuiz = async () => {
    if (!document || !extractedDocument) {
      alert('Veuillez d\'abord extraire le texte du document');
      return;
    }

    setGenerating(true);
    try {
      console.log('🤖 Génération du quiz avec OpenAI...');
      // Utiliser le texte nettoyé optimisé pour l'IA
      const quiz = await generateQuizFromText(
        extractedDocument.cleanText,
        document.name, // Utiliser name (nom avec accents)
        document.id
      );
      
      setGeneratedQuiz(quiz);
      setShowQuiz(true);

      // Marquer que le document a un quiz
      await supabase
        .from('documents')
        .update({ has_quiz: true })
        .eq('id', document.id);

      console.log('✅ Quiz généré avec succès !');
    } catch (error) {
      console.error('❌ Erreur génération quiz:', error);
      alert('Impossible de générer le quiz. Vérifiez votre clé API OpenAI.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500">Document non trouvé</p>
        <button
          onClick={() => navigate('/library')}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Retour à la bibliothèque
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/library')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            {/* RÈGLE : Afficher name (avec accents) pour l'utilisateur */}
            <h1 className="text-2xl font-bold text-gray-900">{document.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {document.file_type.toUpperCase()} • {Math.round((document.file_size || 0) / 1024)} KB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {document.storage_path && (
            <a
              href={supabase.storage.from('documents').getPublicUrl(document.storage_path).data.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={18} />
              Télécharger
            </a>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Extraire le texte */}
          <button
            onClick={handleExtractText}
            disabled={extracting || (extractedDocument !== null)}
            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {extracting ? (
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            ) : extractedDocument ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <FileText className="w-8 h-8 text-teal-600" />
            )}
            <div className="text-center">
              <p className="font-medium text-gray-900">
                {extractedDocument ? '✅ Texte extrait' : 'Extraire le texte'}
              </p>
              <p className="text-sm text-gray-500">
                {extracting ? 'Extraction en cours...' : extractedDocument ? `${extractedDocument.metadata.pages} pages` : 'Analyser le PDF'}
              </p>
            </div>
          </button>

          {/* Générer un quiz */}
          <button
            onClick={handleGenerateQuiz}
            disabled={!extractedDocument || generating}
            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            ) : (
              <Sparkles className="w-8 h-8 text-purple-600" />
            )}
            <div className="text-center">
              <p className="font-medium text-gray-900">Générer un Quiz</p>
              <p className="text-sm text-gray-500">
                {generating ? 'Génération en cours...' : '5 questions avec IA'}
              </p>
            </div>
          </button>

          {/* Générer des fiches */}
          <button
            disabled={!extractedDocument}
            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div className="text-center">
              <p className="font-medium text-gray-900">Générer des Fiches</p>
              <p className="text-sm text-gray-500">Bientôt disponible</p>
            </div>
          </button>
        </div>
      </div>

      {/* Statistiques et prévisualisation du texte extrait */}
      {extractedDocument && !showQuiz && (
        <div className="space-y-4">
          {/* Statistiques */}
          <div className="bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-semibold text-gray-900">Statistiques du document</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-teal-600">{extractedDocument.metadata.pages}</p>
                <p className="text-sm text-gray-600">Pages</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-teal-600">{extractedDocument.metadata.words.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Mots</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-teal-600">{Math.round(extractedDocument.metadata.characters / 1000)}k</p>
                <p className="text-sm text-gray-600">Caractères</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-teal-600">{Math.round(extractedDocument.metadata.words / 200)}</p>
                <p className="text-sm text-gray-600">Min lecture</p>
              </div>
            </div>
          </div>

          {/* Prévisualisation du texte */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Aperçu du texte extrait</h2>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {extractedDocument.cleanText.substring(0, 3000)}
                {extractedDocument.cleanText.length > 3000 && '...'}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>
                Texte nettoyé et optimisé pour l'IA
              </span>
              <span className="text-green-600 font-medium">
                ✅ Prêt pour la génération de quiz
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quiz généré */}
      {showQuiz && generatedQuiz && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Quiz généré</h2>
            <button
              onClick={() => setShowQuiz(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Masquer
            </button>
          </div>
          <QuizPlayer quiz={generatedQuiz} />
        </div>
      )}
    </div>
  );
}
