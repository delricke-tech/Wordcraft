import { Folder } from 'lucide-react';
import { Folder as FolderType } from '../../lib/supabase';

interface FolderSelectorProps {
  folders: FolderType[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

export function FolderSelector({ folders, selectedFolderId, onSelectFolder }: FolderSelectorProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Dossier de destination
      </label>
      <div className="space-y-1">
        {/* Option "Aucun dossier" */}
        <button
          type="button"
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-colors text-left ${
            selectedFolderId === null
              ? 'border-teal-500 bg-teal-50 text-teal-900'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <Folder
            size={18}
            className={selectedFolderId === null ? 'text-teal-600' : 'text-gray-400'}
          />
          <span className="flex-1">Aucun dossier (Racine)</span>
          {selectedFolderId === null && (
            <div className="w-2 h-2 bg-teal-600 rounded-full" />
          )}
        </button>

        {/* Liste des dossiers */}
        {folders.length > 0 ? (
          folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => onSelectFolder(folder.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-colors text-left ${
                selectedFolderId === folder.id
                  ? 'border-teal-500 bg-teal-50 text-teal-900'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Folder
                size={18}
                className={selectedFolderId === folder.id ? 'text-teal-600' : 'text-gray-400'}
              />
              <span className="flex-1">{folder.name}</span>
              {selectedFolderId === folder.id && (
                <div className="w-2 h-2 bg-teal-600 rounded-full" />
              )}
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic px-4 py-2">
            Aucun dossier disponible. Créez-en un d'abord !
          </p>
        )}
      </div>
    </div>
  );
}

