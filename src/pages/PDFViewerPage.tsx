import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase, Document } from '../lib/supabase';
import { PDFViewer } from '../components/PDFViewer';
import { ChatPanel } from '../components/ChatPanel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { extractPDFText, DocumentContext } from '../services/openaiService';

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [documentContext, setDocumentContext] = useState<DocumentContext | null>(null);
  const [extractingText, setExtractingText] = useState(false);

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
      // ✅ IMPORTANT : Inclure extracted_text et page_count pour éviter de ré-extraire
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, storage_path, file_type, user_id, extracted_text, page_count, processing_status')
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
        file_type: data.file_type,
        extracted_text_length: data.extracted_text?.length || 0,
        processing_status: data.processing_status
      });

      setDocument(data as Document);

      // ✅ VÉRIFICATION : Si le texte est déjà en BDD, l'utiliser directement
      if (data.extracted_text && data.extracted_text.trim() !== '') {
        console.log('✅ Texte déjà extrait trouvé en BDD:', data.extracted_text.length, 'caractères');
        
        // Préparer le contexte avec le texte déjà disponible
        setDocumentContext({
          documentId: data.id,
          documentName: data.name,
          storagePath: data.storage_path,
          extractedText: data.extracted_text // ✅ Utiliser le texte de la BDD
        });

        toast.success('IA prête', {
          description: 'Le document a déjà été analysé. L\'assistant IA est disponible !'
        });
      } else {
        // Si pas de texte en BDD, préparer le contexte sans texte et lancer l'extraction
        console.log('⚠️ Aucun texte en BDD, extraction nécessaire...');
        
        setDocumentContext({
          documentId: data.id,
          documentName: data.name,
          storagePath: data.storage_path
        });

        // Extraire le texte du PDF en arrière-plan pour l'IA
        extractTextInBackground(data.storage_path, data.id);
      }

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

  // Extraire le texte du PDF pour l'IA (en arrière-plan)
  const extractTextInBackground = async (storagePath: string, documentId: string) => {
    try {
      setExtractingText(true);
      console.log('🤖 ===== EXTRACTION DU TEXTE =====');
      console.log('  - Storage Path:', storagePath);
      console.log('  - Document ID:', documentId);

      // ✅ Utiliser le storage_path (chemin nettoyé) pour l'extraction
      const extractedText = await extractPDFText(storagePath);
      
      console.log('📄 Texte récupéré:', extractedText ? `${extractedText.length} caractères` : 'NULL/VIDE');

      // ✅ VÉRIFICATION : Le texte doit exister
      if (!extractedText || extractedText.trim() === '') {
        throw new Error('Le texte extrait est vide. Le PDF pourrait être scanné ou corrompu.');
      }

      // Mettre à jour le contexte avec le texte extrait
      setDocumentContext(prev => prev ? {
        ...prev,
        extractedText
      } : null);

      console.log('✅ Texte extrait pour l\'IA:', extractedText.length, 'caractères');
      console.log('  - Premiers 100 caractères:', extractedText.slice(0, 100));

      // Sauvegarder le texte en BDD pour éviter de ré-extraire
      try {
        const { error: updateError } = await supabase
          .from('documents')
          .update({ 
            extracted_text: extractedText,
            processing_status: 'completed'
          })
          .eq('id', documentId);

        if (updateError) {
          console.warn('⚠️ Impossible de sauvegarder le texte en BDD:', updateError);
        } else {
          console.log('✅ Texte sauvegardé en BDD');
        }
      } catch (saveError) {
        console.warn('⚠️ Erreur lors de la sauvegarde en BDD:', saveError);
      }

      toast.success('IA prête', {
        description: 'Le document a été analysé et l\'assistant IA est disponible !'
      });
    } catch (error: any) {
      console.error('⚠️ ===== ERREUR EXTRACTION =====');
      console.error('  - Message:', error.message);
      console.error('  - Stack:', error.stack);
      
      toast.error('Erreur d\'extraction', {
        description: 'Impossible d\'extraire le texte du PDF. L\'IA ne sera pas disponible.'
      });

      // Mettre à jour le statut en BDD
      await supabase
        .from('documents')
        .update({ processing_status: 'failed' })
        .eq('id', documentId);
    } finally {
      setExtractingText(false);
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

  if (!document || !documentContext) {
    return null;
  }

  return (
    <>
      <PDFViewer
        documentId={document.id}
        documentName={document.name}
        storagePath={document.storage_path}
        onClose={handleClose}
      />
      <ChatPanel
        documentContext={documentContext}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        isExtractingText={extractingText}
      />
    </>
  );
}

