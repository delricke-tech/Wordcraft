/**
 * Composant universel pour afficher différents types de documents
 * Support : PDF, TXT, Images, DOCX (bientôt)
 * 
 * Date: 31 décembre 2024
 */

import { X, Download, FileText, Image as ImageIcon } from 'lucide-react';
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
  documentId, 
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

      // Générer l'URL publique
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
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-8">
            <FileText size={64} className="text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Document DOCX</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              L'aperçu des fichiers DOCX sera bientôt disponible.
              <br />
              En attendant, vous pouvez télécharger le fichier.
            </p>
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download size={20} />
              Télécharger le document
            </button>
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
