/**
 * 
 * Sélecteur de documents pour le chat IA contextuel
 * Permet de choisir un ou plusieurs documents comme contexte
 * 
 * Date: 6 mars 2025
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Check, 
  X, 
  ChevronDown, 
  Search,
  Folder,
  Clock,
  Star
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  file_type: string;
  folder_id?: string;
  created_at: string;
  is_favorite?: boolean;
  extracted_text?: string;
}

interface DocumentSelectorProps {
  selectedDocuments: Document[];
  onSelectionChange: (documents: Document[]) => void;
  maxDocuments?: number;
  className?: string;
}

export function DocumentSelector({ 
  selectedDocuments, 
  onSelectionChange, 
  maxDocuments = 5,
  className = ""
}: DocumentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);

  // Charger les documents de l'utilisateur
  useEffect(() => {
    loadDocuments();
    loadFolders();
  }, []);

  // Filtrer les documents selon la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.file_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
  }, [searchQuery, documents]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          folders:folder_id (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .not('extracted_text', 'is', null)
        .not('extracted_text', 'eq', '')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrer les documents qui ont du texte extrait
      const validDocuments = (data || []).filter(doc => 
        doc.extracted_text && doc.extracted_text.trim().length > 100
      );

      setDocuments(validDocuments);
      setFilteredDocuments(validDocuments);
    } catch (error: any) {
      console.error('Erreur lors du chargement des documents:', error);
      toast.error('Erreur', {
        description: 'Impossible de charger vos documents'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
    }
  };

  const toggleDocument = (document: Document) => {
    const isSelected = selectedDocuments.some(doc => doc.id === document.id);
    
    if (isSelected) {
      // Désélectionner
      onSelectionChange(selectedDocuments.filter(doc => doc.id !== document.id));
    } else {
      // Sélectionner (vérifier la limite)
      if (selectedDocuments.length >= maxDocuments) {
        toast.error('Limite atteinte', {
          description: `Vous pouvez sélectionner au maximum ${maxDocuments} documents`
        });
        return;
      }
      onSelectionChange([...selectedDocuments, document]);
    }
  };

  const getFolderName = (folderId?: string) => {
    if (!folderId) return '📄 Racine';
    const folder = folders.find(f => f.id === folderId);
    return folder ? `📁 ${folder.name}` : '📁 Dossier inconnu';
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'txt': return '📃';
      case 'image': return '🖼️';
      default: return '📄';
    }
  };

  const removeSelectedDocument = (documentId: string) => {
    onSelectionChange(selectedDocuments.filter(doc => doc.id !== documentId));
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bouton d'ouverture et sélection actuelle */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded-lg p-2 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">
                Contexte documentaire ({selectedDocuments.length}/{maxDocuments})
              </p>
              {selectedDocuments.length === 0 ? (
                <p className="text-sm text-gray-500">Sélectionnez des documents pour le chat</p>
              ) : (
                <p className="text-sm text-gray-600">
                  {selectedDocuments.map(doc => doc.name).slice(0, 2).join(', ')}
                  {selectedDocuments.length > 2 && ` +${selectedDocuments.length - 2} autres`}
                </p>
              )}
            </div>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {/* Documents sélectionnés */}
        {selectedDocuments.length > 0 && (
          <div className="mt-3 space-y-2">
            {selectedDocuments.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg"
              >
                <span className="text-lg">{getFileIcon(doc.file_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {doc.extracted_text?.length} caractères
                  </p>
                </div>
                <button
                  onClick={() => removeSelectedDocument(doc.id)}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Panneau de sélection */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-hidden"
          >
            {/* Barre de recherche */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un document..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Liste des documents */}
            <div className="overflow-y-auto max-h-64">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">Chargement...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">
                    {searchQuery ? 'Aucun document trouvé' : 'Aucun document disponible'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Seuls les documents avec texte extrait apparaissent
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredDocuments.map((doc) => {
                    const isSelected = selectedDocuments.some(selected => selected.id === doc.id);
                    return (
                      <motion.button
                        key={doc.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleDocument(doc)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          isSelected 
                            ? 'bg-blue-100 border-2 border-blue-300' 
                            : 'hover:bg-gray-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {isSelected ? (
                              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{getFileIcon(doc.file_type)}</span>
                              <p className="font-medium text-gray-900 truncate">
                                {doc.name}
                              </p>
                              {doc.is_favorite && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Folder className="w-3 h-3" />
                                {getFolderName(doc.folder_id)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(doc.created_at).toLocaleDateString('fr-FR', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              <span>
                                {doc.extracted_text?.length} caractères
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-600 text-center">
                {selectedDocuments.length}/{maxDocuments} documents sélectionnés
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay pour fermer */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
