import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase, Document } from '../lib/supabase';
import { PDFViewer } from '../components/PDFViewer';
import { DocumentViewer } from '../components/DocumentViewer';
import { ChatPanel } from '../components/ChatPanel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { extractPDFFromStorage } from '../services/pdfExtractor';
import { extractText } from '../services/textExtractor';
import { DocumentContext } from '../services/openaiService';

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
        .select('*') // Sélectionner toutes les colonnes pour éviter les erreurs de colonnes manquantes
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('❌ Erreur lors du chargement du document:', error);
        console.error('  - Code:', error.code);
        console.error('  - Message:', error.message);
        console.error('  - Details:', error.details);
        toast.error('Erreur', {
          description: `Document introuvable : ${error.message}`
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

      // Vérifier que c'est un type supporté
      const supportedTypes = ['pdf', 'txt', 'image', 'docx'];
      if (!supportedTypes.includes(data.file_type)) {
        toast.error('Erreur', {
          description: 'Type de fichier non supporté'
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

      // ✅ FALLBACK : Si 'name' n'existe pas, utiliser 'title'
      const documentName = data.name || data.title || 'Document sans nom';
      
      // ✅ FALLBACK : Si 'storage_path' n'existe pas, utiliser 'file_url'
      const storagePath = data.storage_path || data.file_url || '';

      console.log('✅ Document chargé:', {
        id: data.id,
        name: documentName,
        storage_path: storagePath,
        file_type: data.file_type,
        extracted_text_length: data.extracted_text?.length || 0,
        processing_status: data.processing_status,
        has_name_column: !!data.name,
        has_storage_path_column: !!data.storage_path
      });

      // Mettre à jour l'objet data avec les fallbacks
      const documentData = {
        ...data,
        name: documentName,
        storage_path: storagePath
      };

      setDocument(documentData as Document);

      // ⚠️ Vérifier si les colonnes essentielles existent
      if (!data.name || !data.storage_path) {
        console.warn('⚠️ ===== COLONNES MANQUANTES =====');
        console.warn('  Les colonnes "name" et/ou "storage_path" n\'existent pas dans la BDD');
        console.warn('  📝 Solution : Exécuter le script FIX_DOCUMENT_COLUMNS.sql');
        console.warn('  📍 Localisation : FIX_DOCUMENT_COLUMNS.sql à la racine du projet');
        toast.warning('Configuration incomplète', {
          description: 'Certaines colonnes sont manquantes. Veuillez exécuter le script de migration SQL. (Voir console F12)',
          duration: 6000
        });
      }

      // ✅ VÉRIFICATION : Si le texte est déjà en BDD, l'utiliser directement
      if (data.extracted_text && data.extracted_text.trim() !== '') {
        console.log('✅ Texte déjà extrait trouvé en BDD:', data.extracted_text.length, 'caractères');
        
        // Préparer le contexte avec le texte déjà disponible
        setDocumentContext({
          documentId: data.id,
          documentName: documentName,
          storagePath: storagePath,
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
          documentName: documentName,
          storagePath: storagePath
        });

        // Extraire le texte du document en arrière-plan pour l'IA
        if (storagePath) {
          extractTextInBackground(storagePath, data.id, data.file_type);
        } else {
          toast.error('Erreur', {
            description: 'Impossible de localiser le fichier. Chemin manquant.'
          });
        }
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

  // Extraire le texte du document pour l'IA (en arrière-plan)
  const extractTextInBackground = async (storagePath: string, documentId: string, fileType: string) => {
    try {
      setExtractingText(true);
      console.log('🤖 ===== EXTRACTION DU TEXTE =====');
      console.log('  - Storage Path:', storagePath);
      console.log('  - Document ID:', documentId);
      console.log('  - Type de fichier:', fileType);

      // ✅ Utiliser le service d'extraction universel
      const extracted = await extractText(storagePath, fileType, documentId);
      
      console.log('📄 Texte récupéré:', extracted.text ? `${extracted.text.length} caractères` : 'NULL/VIDE');

      // ✅ VÉRIFICATION : Le texte doit exister
      if (!extracted.text || extracted.text.trim() === '') {
        throw new Error('Le texte extrait est vide. Le document pourrait être corrompu.');
      }

      // Mettre à jour le contexte avec le texte extrait
      setDocumentContext(prev => prev ? {
        ...prev,
        extractedText: extracted.text
      } : null);

      console.log('✅ Texte extrait pour l\'IA:', extracted.text.length, 'caractères');
      console.log('  - Premiers 100 caractères:', extracted.text.slice(0, 100));
      console.log('💾 Texte déjà sauvegardé en BDD par extractText()');

      // ✅ RÈGLE 4 : Changer l'état du chat de 'Impossible d'extraire' à 'Prêt pour vos questions'
      toast.success('IA prête pour vos questions ! 🎉', {
        description: `Document analysé : ${extracted.wordCount} mots, ${extracted.characterCount} caractères. Cliquez sur la bulle violette pour discuter !`,
        duration: 5000
      });

      // ✅ CORRECTION : Ouvrir automatiquement le chat après extraction réussie
      setTimeout(() => {
        setIsChatOpen(true);
      }, 1000); // Attendre 1 seconde pour que le toast soit visible
    } catch (error: any) {
      console.error('⚠️ ===== ERREUR EXTRACTION =====');
      console.error('  - Message:', error.message);
      console.error('  - Stack:', error.stack);
      
      toast.error('Impossible d\'extraire le texte', {
        description: `Le ${fileType.toUpperCase()} ne peut pas être analysé. L\'IA ne sera pas disponible pour ce document.`
      });

      // Mettre à jour le statut en BDD
      await supabase
        .from('documents')
        .update({ 
          processing_status: 'failed',
          processing_error: error.message
        })
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
      {document.file_type === 'pdf' ? (
        <PDFViewer
          documentId={document.id}
          documentName={document.name}
          storagePath={document.storage_path}
          onClose={handleClose}
        />
      ) : (
        <DocumentViewer
          documentId={document.id}
          documentName={document.name}
          storagePath={document.storage_path}
          fileType={document.file_type}
          onClose={handleClose}
        />
      )}
      <ChatPanel
        documentContext={documentContext}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        isExtractingText={extractingText}
      />
    </>
  );
}

