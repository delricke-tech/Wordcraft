/**
 * Composant universel pour afficher différents types de documents
 * Support : PDF, TXT, Images, DOCX (bientôt)
 * 
 * Date: 31 décembre 2024
 */

import { X, Download, FileText, Image as ImageIcon, Video as VideoIcon, Music, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface DocumentViewerProps {
  documentId: string;
  documentName: string;
  storagePath: string;
  fileType: string;
  onClose: () => void;
}

export function DocumentViewer({ 
  documentName, 
  storagePath, 
  fileType,
  onClose 
}: DocumentViewerProps) {
  const [publicUrl, setPublicUrl] = useState<string>('');
  const [textContent, setTextContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocument();
  }, [storagePath, fileType]);

  const loadDocument = async () => {
    try {
      setLoading(true);

      // Cas particulier : le document est une URL externe
      if (fileType === 'url') {
        // On considère que storagePath contient l'URL complète
        setPublicUrl(storagePath as string);
        setLoading(false);
        return;
      }

      // Générer l'URL publique pour un fichier stocké
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(storagePath);

      if (!urlData?.publicUrl) {
        throw new Error('Impossible de générer l\'URL du document');
      }

      setPublicUrl(urlData.publicUrl);

      // Pour les fichiers texte, charger le contenu directement
      if (fileType === 'txt') {
        const response = await fetch(urlData.publicUrl);
        const text = await response.text();
        setTextContent(text);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Erreur chargement document:', error);
      toast.error('Erreur', {
        description: 'Impossible de charger le document'
      });
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (publicUrl) {
      const link = document.createElement('a');
      link.href = publicUrl;
      link.download = documentName;
      link.click();
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400">Chargement du document...</div>
        </div>
      );
    }

    switch (fileType) {
      case 'pdf':
        return (
          <iframe
            src={publicUrl}
            className="w-full h-full"
            title={documentName}
          />
        );

      case 'url':
        return (
          <iframe
            src={publicUrl}
            className="w-full h-full"
            title={documentName || publicUrl}
          />
        );

      case 'txt':
        return (
          <div className="w-full h-full overflow-auto bg-white">
            <div className="max-w-4xl mx-auto p-8">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                {textContent}
              </pre>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 p-4">
            <img
              src={publicUrl}
              alt={documentName}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        );

      case 'docx':
        // On utilise le visionneur Google Docs tant que le rendu local n'est pas
        // prêt ; la même technique fonctionne pour pptx.
        return (
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(publicUrl)}&embedded=true`}
            className="w-full h-full"
            title={documentName}
          />
        );

      case 'pptx':
        return (
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(publicUrl)}&embedded=true`}
            className="w-full h-full"
            title={documentName}
          />
        );

      case 'video':
        return (
          <div className="w-full h-full flex items-center justify-center bg-black p-4">
            <video
              src={publicUrl}
              controls
              className="max-w-full max-h-full"
              controlsList="nodownload"
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900 p-8">
            <Music size={64} className="text-white mb-6 animate-pulse" />
            <h2 className="text-2xl font-bold text-white mb-4">{documentName}</h2>
            <div className="w-full max-w-2xl bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <audio
                src={publicUrl}
                controls
                className="w-full"
                controlsList="nodownload"
              >
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            </div>
            <p className="text-white/70 mt-4 text-sm text-center max-w-md">
              💡 La transcription automatique avec Whisper AI sera bientôt disponible
            </p>
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-gray-400">Type de fichier non supporté</div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {fileType === 'image' && <ImageIcon className="text-white" size={24} />}
          {fileType === 'txt' && <FileText className="text-white" size={24} />}
          {fileType === 'pdf' && <FileText className="text-white" size={24} />}
          {(fileType === 'docx' || fileType === 'pptx') && <FileText className="text-white" size={24} />}
          {fileType === 'url' && <Globe className="text-white" size={24} />}
          {fileType === 'video' && <VideoIcon className="text-white" size={24} />}
          {fileType === 'audio' && <Music className="text-white" size={24} />}
          <h1 className="text-lg font-semibold text-white truncate max-w-md">
            {documentName}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white"
            title="Télécharger"
          >
            <Download size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white"
            title="Fermer (Échap)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
