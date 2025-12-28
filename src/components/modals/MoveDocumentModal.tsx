import React, { useState } from 'react';
import { FolderInput, X, Loader2, Folder } from 'lucide-react';
import { Folder as FolderType } from '../../lib/supabase';

interface MoveDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (newFolderId: string | null) => Promise<void>;
  folders: FolderType[];
  currentFolderId?: string | null;
  documentName: string;
}

export function MoveDocumentModal({
  isOpen,
  onClose,
  onMove,
  folders,
  currentFolderId,
  documentName,
}: MoveDocumentModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId || null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFolderId === currentFolderId) {
      onClose();
      return;
    }

    setLoading(true);

    try {
      await onMove(selectedFolderId);
      onClose();
    } catch (err: any) {
      console.error('Erreur lors du déplacement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedFolderId(currentFolderId || null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <FolderInput className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Déplacer le document</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
              <p className="text-sm font-medium text-gray-900">{documentName}</p>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Déplacer vers
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* Option "Aucun dossier" */}
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-colors text-left ${
                  selectedFolderId === null
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
                disabled={loading}
              >
                <Folder
                  size={18}
                  className={selectedFolderId === null ? 'text-amber-600' : 'text-gray-400'}
                />
                <span className="flex-1">Aucun dossier (Racine)</span>
                {selectedFolderId === null && (
                  <div className="w-2 h-2 bg-amber-600 rounded-full" />
                )}
              </button>

              {/* Liste des dossiers */}
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-colors text-left ${
                    selectedFolderId === folder.id
                      ? 'border-amber-500 bg-amber-50 text-amber-900'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                  disabled={loading}
                >
                  <Folder
                    size={18}
                    className={selectedFolderId === folder.id ? 'text-amber-600' : 'text-gray-400'}
                  />
                  <span className="flex-1">{folder.name}</span>
                  {selectedFolderId === folder.id && (
                    <div className="w-2 h-2 bg-amber-600 rounded-full" />
                  )}
                  {folder.id === currentFolderId && (
                    <span className="text-xs text-gray-500">(actuel)</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || selectedFolderId === currentFolderId}
              className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Déplacement...
                </>
              ) : (
                <>
                  <FolderInput className="w-4 h-4" />
                  Déplacer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

