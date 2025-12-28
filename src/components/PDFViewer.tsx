import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface PDFViewerProps {
  documentId: string;
  documentName: string;
  storagePath: string;
  onClose?: () => void;
}

/**
 * Composant PDFViewer pour afficher les PDFs
 * 
 * IMPORTANT : Utilise le storage_path (nom nettoyé) pour récupérer le fichier
 * depuis Supabase Storage, mais affiche le name original (avec accents) à l'utilisateur.
 * 
 * Cela évite les erreurs "Invalid key" dues aux accents et caractères spéciaux.
 */
export function PDFViewer({ documentId, documentName, storagePath, onClose }: PDFViewerProps) {
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    loadPDF();
  }, [storagePath]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📄 ===== CHARGEMENT PDF =====');
      console.log('  - Document ID:', documentId);
      console.log('  - Nom affiché:', documentName);
      console.log('  - Storage path:', storagePath);

      // RÈGLE IMPORTANTE : Utiliser storage_path (nom nettoyé) pour récupérer le fichier
      // Cela évite les erreurs "Invalid key" dues aux accents
      
      // Méthode 1 : URL publique (si le bucket est public)
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(storagePath);

      if (publicUrlData?.publicUrl) {
        console.log('✅ URL publique générée:', publicUrlData.publicUrl);
        setPdfUrl(publicUrlData.publicUrl);
        setLoading(false);
        return;
      }

      // Méthode 2 : URL signée (si le bucket est privé)
      // URL signée valide pendant 1 heure
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(storagePath, 3600); // 3600 secondes = 1 heure

      if (signedUrlError) {
        console.error('❌ Erreur lors de la génération de l\'URL signée:', signedUrlError);
        throw new Error(`Impossible de charger le PDF : ${signedUrlError.message}`);
      }

      if (signedUrlData?.signedUrl) {
        console.log('✅ URL signée générée (valide 1h)');
        setPdfUrl(signedUrlData.signedUrl);
      } else {
        throw new Error('Impossible de générer une URL pour le PDF');
      }

    } catch (err: any) {
      console.error('💥 Erreur lors du chargement du PDF:', err);
      setError(err.message || 'Erreur lors du chargement du PDF');
      toast.error('Erreur', {
        description: 'Impossible de charger le PDF'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/library');
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;

    try {
      console.log('⬇️ Téléchargement du PDF:', documentName);
      
      // Créer un lien temporaire pour télécharger le fichier
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = documentName; // Utiliser le nom original avec accents
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Téléchargement démarré', {
        description: `"${documentName}" est en cours de téléchargement`
      });
    } catch (err: any) {
      console.error('❌ Erreur lors du téléchargement:', err);
      toast.error('Erreur', {
        description: 'Impossible de télécharger le fichier'
      });
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0)); // Max 300%
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5)); // Min 50%
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={handleClose}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Fermer"
          >
            <X size={24} />
          </button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-white truncate">
              {documentName}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Lecteur PDF
            </p>
          </div>
        </div>

        {/* Contrôles de Zoom */}
        <div className="flex items-center gap-2 mx-4">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Dézoomer"
          >
            <ZoomOut size={20} />
          </button>
          
          <button
            onClick={handleResetZoom}
            className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Réinitialiser le zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoomer"
          >
            <ZoomIn size={20} />
          </button>
        </div>

        {/* Bouton Télécharger */}
        <button
          onClick={handleDownload}
          disabled={!pdfUrl}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={20} />
          <span className="hidden sm:inline">Télécharger</span>
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-auto bg-gray-800 flex items-center justify-center p-4">
        {loading && (
          <div className="flex flex-col items-center gap-4 text-gray-300">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="text-lg">Chargement du PDF...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 text-red-400 max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <X size={32} />
            </div>
            <div>
              <p className="text-lg font-semibold mb-2">Erreur de chargement</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
            <button
              onClick={loadPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && pdfUrl && (
          <div className="w-full h-full flex items-center justify-center">
            <iframe
              src={`${pdfUrl}#zoom=${scale * 100}`}
              className="w-full h-full border-0 rounded-lg shadow-2xl"
              style={{
                maxWidth: `${scale * 100}%`,
                maxHeight: `${scale * 100}%`,
              }}
              title={documentName}
            />
          </div>
        )}
      </div>

      {/* Footer avec infos */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>📄 Format: PDF</span>
            <span>🔒 Connexion sécurisée</span>
          </div>
          <div>
            <span className="text-gray-500">
              Appuyez sur <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">Échap</kbd> pour fermer
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

