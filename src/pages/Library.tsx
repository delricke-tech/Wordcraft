import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  Upload,
  Link as LinkIcon,
  Grid,
  List,
  Search,
  FolderPlus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Share2,
  BookOpen,
  ClipboardList,
  X,
  Folder,
  ChevronRight,
  File,
  Image,
  Video,
  Globe,
  Download,
  Loader2,
  Edit3,
  FolderInput,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Document, Folder as FolderType, uploadFile } from '../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateUniqueFileName, getFileType } from '../utils/fileUtils';
import { toast } from 'sonner';
import { NewFolderModal } from '../components/modals/NewFolderModal';
import { FolderSelector } from '../components/modals/FolderSelector';
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal';
import { RenameModal } from '../components/modals/RenameModal';
import { MoveDocumentModal } from '../components/modals/MoveDocumentModal';
import { updateFileFolder } from '../utils/moveFileFolder';

export function Library() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [contextMenu, setContextMenu] = useState<{ 
    id: string; 
    x: number; 
    y: number; 
    type: 'document' | 'folder';
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [selectedFolderForUpload, setSelectedFolderForUpload] = useState<string | null>(null);
  const [showPdfUploadModal, setShowPdfUploadModal] = useState(false);
  
  // États pour les modales d'actions
  const [showDeleteModal, setShowDeleteModal] = useState<{
    isOpen: boolean;
    itemId: string;
    itemName: string;
    type: 'document' | 'folder';
  }>({ isOpen: false, itemId: '', itemName: '', type: 'document' });
  
  const [showRenameModal, setShowRenameModal] = useState<{
    isOpen: boolean;
    itemId: string;
    currentName: string;
    type: 'document' | 'folder';
  }>({ isOpen: false, itemId: '', currentName: '', type: 'document' });
  
  const [showMoveModal, setShowMoveModal] = useState<{
    isOpen: boolean;
    documentId: string;
    documentName: string;
    currentFolderId: string | null;
  }>({ isOpen: false, documentId: '', documentName: '', currentFolderId: null });

  // État pour le menu déroulant simple de déplacement
  const [showQuickMoveDropdown, setShowQuickMoveDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedFolder]);

  // Fermer le dropdown de déplacement rapide quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      if (showQuickMoveDropdown) {
        setShowQuickMoveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showQuickMoveDropdown]);

  useEffect(() => {
    if (searchParams.get('upload') === 'true') {
      setShowUploadModal(true);
      setSearchParams({});
    }
    if (searchParams.get('import') === 'true') {
      setShowImportModal(true);
      setSearchParams({});
    }
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsResult, foldersResult] = await Promise.all([
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
        supabase.from('folders').select('*').order('name'),
      ]);

      if (docsResult.error) {
        console.error('❌ Erreur lors de la récupération des documents:', docsResult.error);
      }

      // Protection : s'assurer que c'est toujours un tableau
      setDocuments(Array.isArray(docsResult.data) ? docsResult.data : []);
      setFolders(Array.isArray(foldersResult.data) ? foldersResult.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setDocuments([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour créer un nouveau dossier
  const handleCreateFolder = async (folderName: string) => {
    if (!user) {
      toast.error('Erreur', {
        description: 'Vous devez être connecté pour créer un dossier'
      });
      return;
    }

    console.log('📁 Création du dossier:', folderName);

    const { data, error } = await supabase
      .from('folders')
      .insert({
        user_id: user.id,
        name: folderName,
        color: '#6B7280',
        icon: 'folder',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de la création du dossier:', error);
      toast.error('Erreur', {
        description: 'Impossible de créer le dossier'
      });
      throw error;
    }

    console.log('✅ Dossier créé:', data);
    toast.success('Dossier créé !', {
      description: `Le dossier "${folderName}" a été créé avec succès`
    });

    // Rafraîchir la liste des dossiers
    await fetchData();
  };

  // ✅ Fonction pour supprimer un document (BDD + Storage)
  const handleDeleteDocument = async (documentId: string) => {
    if (!user) {
      toast.error('Erreur', { description: 'Vous devez être connecté' });
      return;
    }

    console.log('🗑️ Suppression du document:', documentId);

    // Récupérer les infos du document
    const doc = documents.find(d => d.id === documentId);
    if (!doc) {
      toast.error('Erreur', { description: 'Document introuvable' });
      return;
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (doc.user_id !== user.id) {
      toast.error('Accès refusé', { 
        description: 'Vous ne pouvez supprimer que vos propres documents' 
      });
      return;
    }

    try {
      // 1. Supprimer le fichier du Storage Supabase
      if (doc.storage_path) {
        console.log('🗑️ Suppression du fichier Storage:', doc.storage_path);
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([doc.storage_path]);

        if (storageError) {
          console.warn('⚠️ Erreur lors de la suppression du Storage:', storageError);
          // On continue quand même pour supprimer de la BDD
        } else {
          console.log('✅ Fichier supprimé du Storage');
        }
      }

      // 2. Supprimer le document de la base de données
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id); // Sécurité : double vérification

      if (dbError) {
        console.error('❌ Erreur lors de la suppression en BDD:', dbError);
        toast.error('Erreur', {
          description: 'Impossible de supprimer le document'
        });
        return;
      }

      console.log('✅ Document supprimé de la BDD');
      toast.success('Document supprimé !', {
        description: `"${doc.name}" a été supprimé avec succès`
      });

      // Rafraîchir la liste
      await fetchData();
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression:', error);
      toast.error('Erreur', {
        description: 'Une erreur est survenue lors de la suppression'
      });
    }
  };

  // ✅ Fonction pour supprimer un dossier
  const handleDeleteFolder = async (folderId: string) => {
    if (!user) {
      toast.error('Erreur', { description: 'Vous devez être connecté' });
      return;
    }

    console.log('🗑️ Suppression du dossier:', folderId);

    // Récupérer les infos du dossier
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      toast.error('Erreur', { description: 'Dossier introuvable' });
      return;
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (folder.user_id !== user.id) {
      toast.error('Accès refusé', { 
        description: 'Vous ne pouvez supprimer que vos propres dossiers' 
      });
      return;
    }

    try {
      // Supprimer le dossier (les documents seront déplacés à la racine grâce à ON DELETE SET NULL)
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id); // Sécurité : double vérification

      if (error) {
        console.error('❌ Erreur lors de la suppression du dossier:', error);
        toast.error('Erreur', {
          description: 'Impossible de supprimer le dossier'
        });
        return;
      }

      console.log('✅ Dossier supprimé');
      toast.success('Dossier supprimé !', {
        description: `"${folder.name}" a été supprimé. Les documents ont été déplacés à la racine.`
      });

      // Si on était dans ce dossier, retourner à la racine
      if (selectedFolder === folderId) {
        setSelectedFolder(null);
      }

      // Rafraîchir la liste
      await fetchData();
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression:', error);
      toast.error('Erreur', {
        description: 'Une erreur est survenue lors de la suppression'
      });
    }
  };

  // ✅ Fonction pour renommer un document
  const handleRenameDocument = async (documentId: string, newName: string) => {
    if (!user) {
      toast.error('Erreur', { description: 'Vous devez être connecté' });
      return;
    }

    console.log('✏️ Renommage du document:', documentId, '→', newName);

    // Récupérer le document
    const doc = documents.find(d => d.id === documentId);
    if (!doc) {
      toast.error('Erreur', { description: 'Document introuvable' });
      return;
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (doc.user_id !== user.id) {
      toast.error('Accès refusé', { 
        description: 'Vous ne pouvez renommer que vos propres documents' 
      });
      return;
    }

    try {
      // Mettre à jour le nom (PAS le storage_path)
      const { error } = await supabase
        .from('documents')
        .update({ name: newName })
        .eq('id', documentId)
        .eq('user_id', user.id); // Sécurité : double vérification

      if (error) {
        console.error('❌ Erreur lors du renommage:', error);
        toast.error('Erreur', {
          description: 'Impossible de renommer le document'
        });
        throw error;
      }

      console.log('✅ Document renommé');
      toast.success('Document renommé !', {
        description: `"${doc.name}" → "${newName}"`
      });

      // Rafraîchir la liste
      await fetchData();
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      throw error;
    }
  };

  // ✅ Fonction pour renommer un dossier
  const handleRenameFolder = async (folderId: string, newName: string) => {
    if (!user) {
      toast.error('Erreur', { description: 'Vous devez être connecté' });
      return;
    }

    console.log('✏️ Renommage du dossier:', folderId, '→', newName);

    // Récupérer le dossier
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      toast.error('Erreur', { description: 'Dossier introuvable' });
      return;
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (folder.user_id !== user.id) {
      toast.error('Accès refusé', { 
        description: 'Vous ne pouvez renommer que vos propres dossiers' 
      });
      return;
    }

    try {
      // Mettre à jour le nom
      const { error } = await supabase
        .from('folders')
        .update({ name: newName })
        .eq('id', folderId)
        .eq('user_id', user.id); // Sécurité : double vérification

      if (error) {
        console.error('❌ Erreur lors du renommage:', error);
        toast.error('Erreur', {
          description: 'Impossible de renommer le dossier'
        });
        throw error;
      }

      console.log('✅ Dossier renommé');
      toast.success('Dossier renommé !', {
        description: `"${folder.name}" → "${newName}"`
      });

      // Rafraîchir la liste
      await fetchData();
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      throw error;
    }
  };

  // ✅ Fonction pour déplacer un document
  // RÈGLE D'OR : Ne change JAMAIS le nom du fichier ou son chemin dans le Storage
  // Cette fonction met à jour UNIQUEMENT la colonne folder_id en base de données
  const handleMoveDocument = async (documentId: string, newFolderId: string | null) => {
    if (!user) {
      toast.error('Erreur', { description: 'Vous devez être connecté' });
      return;
    }

    console.log('📁 Déplacement du document:', documentId, '→', newFolderId || 'Racine');

    try {
      // Utiliser la fonction centralisée qui gère tout (vérifications + mise à jour folder_id)
      const success = await updateFileFolder(documentId, newFolderId, user.id);

      if (success) {
        // Rafraîchir la liste des documents pour refléter le changement
        await fetchData();
      }
    } catch (error: any) {
      console.error('❌ Erreur inattendue:', error);
      // L'erreur est déjà gérée par updateFileFolder (toast affiché)
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !user) return;

    setIsUploading(true);
    setUploadProgress(0);
    const totalFiles = files.length;
    
    // Toast de chargement
    const loadingToastId = toast.loading(`Upload de ${totalFiles} fichier(s) en cours...`);

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = Array.from(files)[i];
        
        // Mettre à jour la progression
        const progress = ((i + 1) / totalFiles) * 100;
        setUploadProgress(progress);
        
        // Utiliser l'utilitaire pour déterminer le type de fichier
        const fileType = getFileType(file.name);
        
        // Générer un nom de fichier sûr avec l'utilitaire
        const safePath = generateUniqueFileName(file.name);

        console.log('📤 Upload du fichier vers Supabase Storage:', file.name);
        console.log('📤 Chemin sûr généré:', safePath);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(safePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('❌ Erreur lors de l\'upload:', uploadError);
          toast.error(`Erreur lors de l'upload de ${file.name}`, {
            id: loadingToastId,
            description: uploadError.message
          });
          continue;
        }

        console.log('✅ Fichier uploadé avec succès:', uploadData.path);

        // RÈGLE PROJET : Conserver le nom original en BDD pour l'affichage
        const documentName = file.name || `document-${Date.now()}`;
        
        console.log('💾 Insertion en BDD:', {
          name: documentName,
          storage_path: uploadData.path,
          user_id: user.id,
          file_type: fileType,
        });

        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            name: documentName,
            storage_path: uploadData.path,
            user_id: user.id,
            file_type: fileType,
          });

        if (dbError) {
          console.error('❌ Erreur lors de l\'enregistrement en BDD:', dbError);
          await supabase.storage.from('documents').remove([uploadData.path]);
          toast.error(`Erreur lors de l'enregistrement de ${file.name}`, {
            id: loadingToastId,
            description: dbError.message
          });
          continue;
        }

        console.log('✅ Document enregistré en BDD avec succès');
      }

      await fetchData();
      setShowUploadModal(false);
      
      // Toast de succès
      toast.success('Document ajouté !', {
        id: loadingToastId,
        description: `${totalFiles} fichier(s) uploadé(s) avec succès`
      });
      
    } catch (error) {
      console.error('❌ Erreur générale:', error);
      toast.error('Erreur lors de l\'upload', {
        id: loadingToastId,
        description: 'Une erreur est survenue lors de l\'upload des fichiers.'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Fonction spécifique pour l'upload de PDF uniquement
  const handlePdfUpload = async (files: FileList | null) => {
    if (!files || !user) return;

    // Vérifier que tous les fichiers sont des PDF
    const nonPdfFiles = Array.from(files).filter(file => file.type !== 'application/pdf');
    if (nonPdfFiles.length > 0) {
      toast.error('Fichiers non-PDF rejetés', {
        description: `Seuls les fichiers PDF sont acceptés. Fichiers rejetés : ${nonPdfFiles.map(f => f.name).join(', ')}`
      });
      return;
    }

    const totalFiles = files.length;
    const filesArray = Array.from(files);
    
    setIsUploading(true);
    setUploadProgress(0);

    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = filesArray[i];
        const originalFileName = file.name; // Conserver le nom original avec accents
        
        // Utiliser toast.promise pour une meilleure UX
        await toast.promise(
          (async () => {
            // Mettre à jour la progression globale
            const baseProgress = (i / totalFiles) * 100;
            
            // Callback de progression pour cet upload spécifique
            const onProgress = (fileProgress: number) => {
              const totalProgress = baseProgress + (fileProgress / totalFiles);
              setUploadProgress(totalProgress);
            };
            
            // Upload avec progression
            const result = await uploadFile(file, user.id, undefined, onProgress);

            if (!result.success) {
              throw new Error(result.error || 'Erreur d\'upload');
            }

              // Enregistrer en BDD avec le nom original
              const { error: dbError } = await supabase
                .from('documents')
                .insert({
                  name: originalFileName, // ✅ Nom original avec accents pour l'affichage
                  storage_path: result.data?.path || '',
                  user_id: user.id,
                  file_type: 'pdf',
                  folder_id: selectedFolderForUpload, // ✅ Ajouter le dossier sélectionné
                });

            if (dbError) {
              // Nettoyer le fichier uploadé en cas d'erreur
              if (result.data?.path) {
                await supabase.storage.from('documents').remove([result.data.path]);
              }
              throw new Error(dbError.message);
            }

            successCount++;
            return result;
          })(),
          {
            loading: `Upload de "${originalFileName}"...`, // ✅ Affiche le nom original
            success: `"${originalFileName}" ajouté !`, // ✅ Affiche le nom original
            error: (err) => `Erreur: ${originalFileName} - ${err.message}`, // ✅ Affiche le nom original
          }
        );

        // Délai entre uploads
        if (i < totalFiles - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      await fetchData();
      
      // Toast récapitulatif
      if (successCount === totalFiles) {
        toast.success('Tous les documents ont été ajoutés !', {
          description: `${successCount} fichier(s) PDF uploadé(s) avec succès`
        });
      } else if (successCount > 0) {
        toast.warning('Upload partiel', {
          description: `${successCount} réussi(s), ${errorCount} échec(s)`
        });
      }
      
    } catch (error: any) {
      console.error('❌ Erreur générale lors de l\'upload:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Réinitialiser l'input
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    }
  };

  const handleDownloadDocument = (doc: Document) => {
    if (doc.storage_path) {
      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(doc.storage_path);
      
      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
      }
    }
  };

  // ✅ Fonction SIMPLE wrapper pour déplacer un fichier
  const handleQuickMove = async (fileId: string, newFolderId: string | null) => {
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      toast.error('Erreur', { description: 'Vous devez être connecté' });
      return;
    }

    console.log('🚀 handleQuickMove appelé');
    console.log('  - File ID:', fileId);
    console.log('  - New Folder ID:', newFolderId);
    console.log('  - User ID:', user.id);

    const success = await updateFileFolder(fileId, newFolderId, user.id);

    if (success) {
      console.log('✅ Déplacement confirmé, rafraîchissement de la liste...');
      await fetchData();
      setShowQuickMoveDropdown(null);  // Fermer le dropdown
    } else {
      console.error('❌ Le déplacement a échoué');
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    // Protection : vérifier que doc.name existe
    const matchesSearch = doc.name 
      ? doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesFilter = selectedFilter === 'all' || doc.file_type === selectedFilter;
    
    // ✅ Filtrage par dossier
    const matchesFolder = selectedFolder === null 
      ? doc.folder_id === null || doc.folder_id === undefined  // Afficher les documents sans dossier
      : doc.folder_id === selectedFolder;  // Afficher les documents du dossier sélectionné
    
    return matchesSearch && matchesFilter && matchesFolder;
  });

  // ✅ Filtrer les dossiers également pour la recherche
  const filteredFolders = folders.filter((folder) => {
    const matchesSearch = folder.name
      ? folder.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesSearch;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <File className="text-red-500" />;
      case 'docx':
        return <FileText className="text-blue-500" />;
      case 'image':
        return <Image className="text-green-500" />;
      case 'video':
        return <Video className="text-purple-500" />;
      case 'url':
        return <Globe className="text-amber-500" />;
      default:
        return <FileText className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {/* ✅ Fil d'ariane si un dossier est sélectionné */}
          {selectedFolder ? (
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setSelectedFolder(null)}
                className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <Folder size={16} />
                Tous les dossiers
              </button>
              <ChevronRight size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {folders.find(f => f.id === selectedFolder)?.name || 'Dossier'}
              </span>
            </div>
          ) : null}
          
          <h1 className="text-2xl font-bold text-gray-900">Ma bibliothèque</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredFolders.length} dossier{filteredFolders.length > 1 ? 's' : ''}, {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ Bouton Nouveau dossier */}
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <FolderPlus size={20} />
            Nouveau dossier
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <Upload size={20} />
            Uploader
          </button>
          <button
            onClick={() => setShowPdfUploadModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <File size={20} />
            Upload PDF
          </button>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) => handlePdfUpload(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <LinkIcon size={20} />
            Importer un lien
          </button>
        </div>
      </div>

      {/* Barre de progression de l'upload */}
      {isUploading && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Upload en cours...</span>
            <span className="text-sm font-medium text-teal-600">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-teal-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={
                selectedFolder 
                  ? `Rechercher dans "${folders.find(f => f.id === selectedFolder)?.name || 'ce dossier'}"...`
                  : "Rechercher un document ou un dossier..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Effacer la recherche"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {/* Badge contextuel de recherche */}
          {searchQuery && selectedFolder && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
              <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-full flex items-center gap-1">
                <Folder size={12} />
                Recherche dans : {folders.find(f => f.id === selectedFolder)?.name || 'ce dossier'}
              </span>
              <span className="text-gray-400">•</span>
              <span>{filteredDocuments.length} résultat(s)</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-teal-50 text-teal-600' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-teal-50 text-teal-600' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <List size={20} />
          </button>
        </div>
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">Tous les types</option>
          <option value="pdf">PDF</option>
          <option value="docx">Word</option>
          <option value="txt">Texte</option>
          <option value="image">Images</option>
        </select>
      </div>

      {/* Documents Grid/List */}
      <div className="flex-1 overflow-auto">
        {filteredDocuments.length === 0 && filteredFolders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            {searchQuery ? (
              // Message pour recherche sans résultat
              <>
                <Search size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucun résultat trouvé</p>
                <p className="text-sm text-center px-4">
                  {selectedFolder ? (
                    <>
                      Aucun document dans "<span className="font-medium text-gray-700">
                        {folders.find(f => f.id === selectedFolder)?.name || 'ce dossier'}
                      </span>" ne correspond à "<span className="font-medium text-gray-700">{searchQuery}</span>"
                    </>
                  ) : (
                    <>
                      Aucun document ou dossier ne correspond à "<span className="font-medium text-gray-700">{searchQuery}</span>"
                    </>
                  )}
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  Effacer la recherche
                </button>
              </>
            ) : (
              // Message pour bibliothèque vide
              <>
                <FileText size={48} className="mb-4 opacity-50" />
                {selectedFolder ? (
                  <>
                    <p className="text-lg font-medium">Ce dossier est vide</p>
                    <p className="text-sm">Uploadez un fichier pour commencer</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium">Aucun document ou dossier</p>
                    <p className="text-sm">Commencez par créer un dossier ou uploader un fichier</p>
                  </>
                )}
              </>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* ✅ Afficher les dossiers en premier */}
            {selectedFolder === null && filteredFolders.map((folder) => (
              <div
                key={folder.id}
                className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
              >
                <div 
                  onClick={() => setSelectedFolder(folder.id)}
                  className="aspect-video flex items-center justify-center relative"
                >
                  <Folder size={64} className="text-teal-600" />
                  {/* Menu contextuel dossier */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({ id: folder.id, x: e.clientX, y: e.clientY, type: 'folder' });
                      }}
                      className="p-1.5 bg-white rounded-lg shadow hover:bg-gray-50"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                <div 
                  onClick={() => setSelectedFolder(folder.id)}
                  className="p-4"
                >
                  <h3 className="font-medium text-teal-900 truncate">
                    {folder.name}
                  </h3>
                  <p className="text-sm text-teal-700 mt-1">
                    {documents.filter(d => d.folder_id === folder.id).length} document(s)
                  </p>
                </div>
              </div>
            ))}
            
            {/* ✅ Afficher les documents ensuite */}
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group"
              >
                <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                  <div className="w-16 h-16">{getFileIcon(doc.file_type)}</div>
                  {doc.storage_path && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadDocument(doc);
                      }}
                      className="absolute top-2 left-2 p-1.5 bg-white rounded-lg shadow hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Télécharger"
                    >
                      <Download size={16} className="text-teal-600" />
                    </button>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({ id: doc.id, x: e.clientX, y: e.clientY, type: 'document' });
                      }}
                      className="p-1.5 bg-white rounded-lg shadow hover:bg-gray-50"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {doc.name || 'Document sans nom'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {doc.created_at ? format(new Date(doc.created_at), 'd MMM yyyy', { locale: fr }) : 'Date inconnue'}
                      </p>
                    </div>
                    {/* ✅ BOUTON DÉPLACER SIMPLE */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowQuickMoveDropdown(showQuickMoveDropdown === doc.id ? null : doc.id);
                        }}
                        className="p-1.5 text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 rounded transition-colors flex items-center gap-1"
                        title="Déplacer vers..."
                      >
                        <FolderInput size={14} />
                        <span className="hidden sm:inline">Déplacer</span>
                      </button>
                      
                      {/* Dropdown simple */}
                      {showQuickMoveDropdown === doc.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                          <div className="p-2">
                            <p className="text-xs font-medium text-gray-500 px-2 py-1">Déplacer vers :</p>
                            {/* Option Racine */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('🎯 Clic sur Racine pour document:', doc.id);
                                handleQuickMove(doc.id, null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                            >
                              <Folder size={14} className="text-gray-400" />
                              <span>Racine (aucun dossier)</span>
                            </button>
                            {/* Liste des dossiers */}
                            {folders.map(folder => (
                              <button
                                key={folder.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('🎯 Clic sur dossier:', folder.name, 'pour document:', doc.id);
                                  handleQuickMove(doc.id, folder.id);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-teal-50 rounded flex items-center gap-2 ${
                                  doc.folder_id === folder.id ? 'bg-teal-50 text-teal-900 font-medium' : ''
                                }`}
                              >
                                <Folder size={14} className="text-teal-600" />
                                <span>{folder.name}</span>
                                {doc.folder_id === folder.id && (
                                  <span className="ml-auto text-xs text-teal-600">✓ Actuel</span>
                                )}
                              </button>
                            ))}
                            {folders.length === 0 && (
                              <p className="text-xs text-gray-400 italic px-3 py-2">Aucun dossier disponible</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8">{getFileIcon(doc.file_type)}</div>
                        <span className="font-medium">{doc.name || 'Document sans nom'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 uppercase">{doc.file_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {doc.created_at ? format(new Date(doc.created_at), 'd MMM yyyy', { locale: fr }) : 'Date inconnue'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {doc.storage_path && (
                          <button 
                            onClick={() => handleDownloadDocument(doc)}
                            className="p-1.5 hover:bg-teal-50 rounded" 
                            title="Télécharger"
                          >
                            <Download size={16} className="text-teal-600" />
                          </button>
                        )}
                        <button className="p-1.5 hover:bg-gray-100 rounded" title="Voir">
                          <Eye size={16} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold">Uploader des fichiers</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all"
              >
                <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Cliquez pour sélectionner des fichiers
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          onClose={() => setContextMenu(null)}
          onDelete={() => {
            if (contextMenu.type === 'document') {
              const doc = documents.find(d => d.id === contextMenu.id);
              if (doc) {
                setShowDeleteModal({
                  isOpen: true,
                  itemId: doc.id,
                  itemName: doc.name,
                  type: 'document'
                });
              }
            } else {
              const folder = folders.find(f => f.id === contextMenu.id);
              if (folder) {
                setShowDeleteModal({
                  isOpen: true,
                  itemId: folder.id,
                  itemName: folder.name,
                  type: 'folder'
                });
              }
            }
            setContextMenu(null);
          }}
          onDownload={contextMenu.type === 'document' ? () => {
            const doc = documents.find(d => d.id === contextMenu.id);
            if (doc) handleDownloadDocument(doc);
            setContextMenu(null);
          } : undefined}
          onRename={() => {
            if (contextMenu.type === 'document') {
              const doc = documents.find(d => d.id === contextMenu.id);
              if (doc) {
                setShowRenameModal({
                  isOpen: true,
                  itemId: doc.id,
                  currentName: doc.name,
                  type: 'document'
                });
              }
            } else {
              const folder = folders.find(f => f.id === contextMenu.id);
              if (folder) {
                setShowRenameModal({
                  isOpen: true,
                  itemId: folder.id,
                  currentName: folder.name,
                  type: 'folder'
                });
              }
            }
            setContextMenu(null);
          }}
          onMove={contextMenu.type === 'document' ? () => {
            const doc = documents.find(d => d.id === contextMenu.id);
            if (doc) {
              setShowMoveModal({
                isOpen: true,
                documentId: doc.id,
                documentName: doc.name,
                currentFolderId: doc.folder_id || null
              });
            }
            setContextMenu(null);
          } : undefined}
        />
      )}

      {/* ✅ Modale Nouveau Dossier */}
      <NewFolderModal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        onCreateFolder={handleCreateFolder}
      />

      {/* ✅ Modale Upload PDF avec sélecteur de dossier */}
      {showPdfUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upload PDF</h2>
              <button
                onClick={() => {
                  setShowPdfUploadModal(false);
                  setSelectedFolderForUpload(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <FolderSelector
              folders={folders}
              selectedFolderId={selectedFolderForUpload}
              onSelectFolder={setSelectedFolderForUpload}
            />

            <button
              onClick={() => {
                pdfInputRef.current?.click();
                setShowPdfUploadModal(false);
              }}
              className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              Sélectionner des fichiers PDF
            </button>
          </div>
        </div>
      )}

      {/* ✅ Modale Confirmation de Suppression */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal.isOpen}
        onClose={() => setShowDeleteModal({ isOpen: false, itemId: '', itemName: '', type: 'document' })}
        onConfirm={async () => {
          if (showDeleteModal.type === 'document') {
            await handleDeleteDocument(showDeleteModal.itemId);
          } else {
            await handleDeleteFolder(showDeleteModal.itemId);
          }
        }}
        title={`Supprimer ${showDeleteModal.type === 'folder' ? 'le dossier' : 'le document'}`}
        message={`Êtes-vous sûr de vouloir supprimer ${showDeleteModal.type === 'folder' ? 'ce dossier' : 'ce document'} ?`}
        itemName={showDeleteModal.itemName}
        type={showDeleteModal.type}
      />

      {/* ✅ Modale Renommage */}
      <RenameModal
        isOpen={showRenameModal.isOpen}
        onClose={() => setShowRenameModal({ isOpen: false, itemId: '', currentName: '', type: 'document' })}
        onRename={async (newName) => {
          if (showRenameModal.type === 'document') {
            await handleRenameDocument(showRenameModal.itemId, newName);
          } else {
            await handleRenameFolder(showRenameModal.itemId, newName);
          }
        }}
        currentName={showRenameModal.currentName}
        type={showRenameModal.type}
      />

      {/* ✅ Modale Déplacement */}
      <MoveDocumentModal
        isOpen={showMoveModal.isOpen}
        onClose={() => setShowMoveModal({ isOpen: false, documentId: '', documentName: '', currentFolderId: null })}
        onMove={async (newFolderId) => {
          await handleMoveDocument(showMoveModal.documentId, newFolderId);
        }}
        folders={folders}
        currentFolderId={showMoveModal.currentFolderId}
        documentName={showMoveModal.documentName}
      />
    </div>
  );
}

function ContextMenu({
  x,
  y,
  onClose,
  onDelete,
  onDownload,
  onRename,
  onMove,
  type,
}: {
  x: number;
  y: number;
  onClose: () => void;
  onDelete: () => void;
  onDownload?: () => void;
  onRename: () => void;
  onMove?: () => void;
  type: 'document' | 'folder';
}) {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div
      className="fixed bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 w-56"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Download (documents uniquement) */}
      {type === 'document' && onDownload && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
          >
            <Download size={16} /> Télécharger
          </button>
          <div className="h-px bg-gray-100 my-1" />
        </>
      )}

      {/* Rename */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRename();
        }}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
      >
        <Edit3 size={16} /> Renommer
      </button>

      {/* Move (documents uniquement) */}
      {type === 'document' && onMove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMove();
          }}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
        >
          <FolderInput size={16} /> Déplacer
        </button>
      )}

      <div className="h-px bg-gray-100 my-1" />

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        <Trash2 size={16} /> Supprimer
      </button>
    </div>
  );
}
