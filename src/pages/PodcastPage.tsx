import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mic, Headphones, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PodcastPlayer from '../components/PodcastPlayer';

export default function PodcastPage() {
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setDocuments(documents || []);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentContent = async (document: any) => {
    try {
      setSelectedDocument(document);
      setLoading(true);

      // Récupérer le contenu du document
      if (document.extracted_text) {
        setContent(document.extracted_text);
      } else {
        // Si pas de texte extrait, utiliser un contenu par défaut
        setContent(`Contenu du document: ${document.name}\n\nCe document est prêt pour la génération de podcast.`);
      }
    } catch (error) {
      console.error('Erreur chargement contenu:', error);
      setContent('Erreur lors du chargement du contenu.');
    } finally {
      setLoading(false);
    }
  };

  const handlePodcastGenerated = (podcast: any) => {
    console.log('🎉 Podcast généré:', podcast);
    // Optionnel : sauvegarder le podcast dans la base de données
  };

  if (loading && documents.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/library"
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Podcast IA</h1>
                  <p className="text-sm text-gray-600">Audio Overview 2 voix</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Headphones className="w-4 h-4" />
              <span>Audio Overview</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sélection des documents */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <PlayCircle className="w-5 h-5 text-purple-600" />
                <span>Choisir un document</span>
              </h2>
              
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Aucun document disponible</p>
                  <Link
                    to="/library"
                    className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <span>Importer des documents</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => loadDocumentContent(doc)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedDocument?.id === doc.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          selectedDocument?.id === doc.id
                            ? 'bg-purple-600'
                            : 'bg-gray-200'
                        }`}>
                          <PlayCircle className={`w-4 h-4 ${
                            selectedDocument?.id === doc.id ? 'text-white' : 'text-gray-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {doc.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              doc.type === 'pdf' ? 'bg-red-100 text-red-800' :
                              doc.type === 'docx' ? 'bg-blue-100 text-blue-800' :
                              doc.type === 'xlsx' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {doc.type?.toUpperCase() || 'FILE'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(doc.size / 1024)} KB
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Podcast Player */}
          <div className="lg:col-span-2">
            {selectedDocument ? (
              <PodcastPlayer
                content={content}
                title={`Podcast: ${selectedDocument.name}`}
                onPodcastGenerated={handlePodcastGenerated}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-full inline-flex mb-6">
                    <Headphones className="w-12 h-12 text-purple-600" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Créez votre premier Podcast IA
                  </h3>
                  
                  <p className="text-gray-600 mb-6">
                    Sélectionnez un document dans la liste pour générer un podcast audio à 2 voix 
                    qui résume et explique le contenu de manière engageante.
                  </p>
                  
                  <div className="space-y-3 text-left bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-sm text-gray-700">Voix naturelles avec OpenAI TTS</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-sm text-gray-700">Podcast 2 voix dynamique</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-sm text-gray-700">Transcript complet inclus</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-sm text-gray-700">Téléchargement MP3 + Markdown</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
