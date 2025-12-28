import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase, Document } from '../lib/supabase';
import { PDFViewer } from '../components/PDFViewer';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Page PDFViewerPage pour afficher un PDF en plein écran
 * 
 * Route : /library/:id/view
 * 
 * IMPORTANT : Cette page récupère le document depuis la BDD
 * et utilise le storage_path (nom nettoyé) pour charger le fichier,
 * tout en affichant le name original (avec accents) à l'utilisateur.
 */
export function PDFViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadDocument(id);
    }
  }, [id]);

  const loadDocument = async (documentId: string) => {
    try {
      setLoading(true);

      console.log('📄 Chargement du document:', documentId);

      // Récupérer les informations du document depuis la BDD
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, storage_path, file_type, user_id')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('❌ Erreur lors du chargement du document:', error);
        toast.error('Erreur', {
          description: 'Document introuvable'
        });
        navigate('/library');
        return;
      }

      if (!data) {
        toast.error('Erreur', {
          description: 'Document introuvable'
        });
        navigate('/library');
        return;
      }

      // Vérifier que c'est bien un PDF
      if (data.file_type !== 'pdf') {
        toast.error('Erreur', {
          description: 'Ce fichier n\'est pas un PDF'
        });
        navigate('/library');
        return;
      }

      // Vérifier que storage_path existe
      if (!data.storage_path) {
        toast.error('Erreur', {
          description: 'Chemin de fichier manquant'
        });
        navigate('/library');
        return;
      }

      console.log('✅ Document chargé:', {
        id: data.id,
        name: data.name,
        storage_path: data.storage_path,
        file_type: data.file_type
      });

      setDocument(data as Document);

    } catch (err: any) {
      console.error('💥 Erreur inattendue:', err);
      toast.error('Erreur', {
        description: 'Une erreur est survenue'
      });
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/library');
  };

  // Écouteur pour la touche Échap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-300">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="text-lg">Chargement du document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <PDFViewer
      documentId={document.id}
      documentName={document.name}
      storagePath={document.storage_path}
      onClose={handleClose}
    />
  );
}

