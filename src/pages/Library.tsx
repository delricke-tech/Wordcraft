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
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Document, Folder as FolderType, uploadFile } from '../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateUniqueFileName, getFileType } from '../utils/fileUtils';
import { toast } from 'sonner';

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
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [selectedFolder]);

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

  const handleDeleteDocument = async (id: string) => {
    const doc = documents.find(d => d.id === id);
    
    if (doc?.storage_path) {
      await supabase.storage.from('documents').remove([doc.storage_path]);
    }
    
    await supabase.from('documents').delete().eq('id', id);
    await fetchData();
    setContextMenu(null);
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

  const filteredDocuments = documents.filter((doc) => {
    // Protection : vérifier que doc.name existe
    const matchesSearch = doc.name 
      ? doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesFilter = selectedFilter === 'all' || doc.file_type === selectedFilter;
    return matchesSearch && matchesFilter;
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
          <h1 className="text-2xl font-bold text-gray-900">Ma bibliothèque</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <Upload size={20} />
            Uploader
          </button>
          <button
            onClick={() => pdfInputRef.current?.click()}
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
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
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
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FileText size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">Aucun document</p>
            <p className="text-sm">Commencez par uploader un fichier</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                        setContextMenu({ id: doc.id, x: e.clientX, y: e.clientY });
                      }}
                      className="p-1.5 bg-white rounded-lg shadow hover:bg-gray-50"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate">
                    {doc.name || 'Document sans nom'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {doc.created_at ? format(new Date(doc.created_at), 'd MMM yyyy', { locale: fr }) : 'Date inconnue'}
                  </p>
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
          onClose={() => setContextMenu(null)}
          onDelete={() => handleDeleteDocument(contextMenu.id)}
          onDownload={() => {
            const doc = documents.find(d => d.id === contextMenu.id);
            if (doc) handleDownloadDocument(doc);
            setContextMenu(null);
          }}
        />
      )}
    </div>
  );
}

function ContextMenu({
  x,
  y,
  onClose,
  onDelete,
  onDownload,
}: {
  x: number;
  y: number;
  onClose: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div
      className="fixed bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 w-48"
      style={{ left: x, top: y }}
    >
      <button 
        onClick={onDownload}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"
      >
        <Download size={16} /> Télécharger
      </button>
      <div className="h-px bg-gray-100 my-1" />
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        <Trash2 size={16} /> Supprimer
      </button>
    </div>
  );
}
