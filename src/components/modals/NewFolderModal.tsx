import { useState } from 'react';
import { X, Folder, Loader2 } from 'lucide-react';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  // list of existing folders so the user can choose a parent
  folders: Array<{ id: string; name: string; parent_id: string | null }>;
  onCreateFolder: (folderName: string, parentId: string | null) => Promise<void>;
}

export function NewFolderModal({ isOpen, onClose, folders, onCreateFolder }: NewFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // build a flat list with indentation to represent hierarchy
  const folderOptions = (() => {
    // map id -> node
    const map = new Map<string, any>();
    folders.forEach(f => map.set(f.id, { ...f, children: [] }));
    // assign children
    folders.forEach(f => {
      if (f.parent_id && map.has(f.parent_id)) {
        map.get(f.parent_id).children.push(map.get(f.id));
      }
    });
    const roots = Array.from(map.values()).filter(f => !f.parent_id);
    const result: Array<{ id: string; name: string }> = [];
    const traverse = (node: any, depth = 0) => {
      result.push({ id: node.id, name: `${'  '.repeat(depth)}${node.name}` });
      node.children.sort((a: any, b: any) => a.name.localeCompare(b.name)).forEach((child: any) => traverse(child, depth + 1));
    };
    roots.sort((a: any, b: any) => a.name.localeCompare(b.name)).forEach(root => traverse(root));
    return result;
  })();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError('Le nom du dossier est requis');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCreateFolder(folderName.trim(), parentId);
      setFolderName('');
      setParentId(null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du dossier');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFolderName('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Nouveau dossier</h2>
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
            <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-2">
              Nom du dossier
            </label>
            <input
              id="folderName"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Ex: Cours de biologie"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={loading}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
          {/* Parent folder selector */}
          <div className="mb-6">
            <label htmlFor="parentFolder" className="block text-sm font-medium text-gray-700 mb-2">
              Dossier parent (optionnel)
            </label>
            <select
              id="parentFolder"
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value || null)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Aucun (racine)</option>
              {folderOptions.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
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
              disabled={loading || !folderName.trim()}
              className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

