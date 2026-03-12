import { useState, useEffect } from 'react';
import { 
  Keyboard, 
  X,
  Command,
  Search,
  FileText,
  BookOpen,
  Save,
  Share2,
  Moon,
  HelpCircle,
  Check,
  Edit3,
  Trash2,
  Plus,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  id: string;
  key: string;
  modifiers: string[];
  description: string;
  category: 'navigation' | 'documents' | 'actions' | 'interface';
  icon: React.ElementType;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { id: '1', key: 'k', modifiers: ['Ctrl'], description: 'Ouvrir la recherche rapide', category: 'navigation', icon: Search },
  { id: '2', key: 'l', modifiers: ['Ctrl'], description: 'Aller à la bibliothèque', category: 'navigation', icon: FileText },
  { id: '3', key: 'c', modifiers: ['Ctrl'], description: 'Aller aux fiches', category: 'navigation', icon: BookOpen },
  { id: '4', key: 'h', modifiers: ['Ctrl'], description: 'Retour à l\'accueil', category: 'navigation', icon: ArrowLeft },
  
  // Documents
  { id: '5', key: 'n', modifiers: ['Ctrl'], description: 'Nouveau document', category: 'documents', icon: Plus },
  { id: '6', key: 'e', modifiers: ['Ctrl'], description: 'Exporter le document', category: 'documents', icon: Share2 },
  { id: '7', key: 's', modifiers: ['Ctrl'], description: 'Sauvegarder', category: 'documents', icon: Save },
  { id: '8', key: 'Delete', modifiers: [], description: 'Supprimer la sélection', category: 'documents', icon: Trash2 },
  
  // Actions
  { id: '9', key: 'f', modifiers: ['Ctrl'], description: 'Ouvrir les filtres', category: 'actions', icon: Search },
  { id: '10', key: 'a', modifiers: ['Ctrl'], description: 'Sélectionner tout', category: 'actions', icon: Check },
  { id: '11', key: 'Escape', modifiers: [], description: 'Fermer le panneau/dossier', category: 'actions', icon: X },
  
  // Interface
  { id: '12', key: 'd', modifiers: ['Ctrl'], description: 'Mode sombre/clair', category: 'interface', icon: Moon },
  { id: '13', key: ',', modifiers: ['Ctrl'], description: 'Ouvrir les paramètres', category: 'interface', icon: Settings },
  { id: '14', key: '?', modifiers: [], description: 'Afficher l\'aide raccourcis', category: 'interface', icon: HelpCircle },
];

export function KeyboardShortcutsPanel({ isOpen, onClose }: KeyboardShortcutsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keys: string[] = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      if (e.metaKey) keys.push('Cmd');
      keys.push(e.key);
      
      setPressedKeys(keys);
      
      // Reset after animation
      setTimeout(() => setPressedKeys([]), 500);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const getModifierSymbol = (modifier: string) => {
    switch (modifier) {
      case 'Ctrl': return '⌃';
      case 'Alt': return '⌥';
      case 'Shift': return '⇧';
      case 'Cmd': return '⌘';
      default: return modifier;
    }
  };

  const filteredShortcuts = activeCategory === 'all' 
    ? shortcuts 
    : shortcuts.filter(s => s.category === activeCategory);

  const categories = [
    { id: 'all', label: 'Tous', count: shortcuts.length },
    { id: 'navigation', label: 'Navigation', count: shortcuts.filter(s => s.category === 'navigation').length },
    { id: 'documents', label: 'Documents', count: shortcuts.filter(s => s.category === 'documents').length },
    { id: 'actions', label: 'Actions', count: shortcuts.filter(s => s.category === 'actions').length },
    { id: 'interface', label: 'Interface', count: shortcuts.filter(s => s.category === 'interface').length },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Keyboard className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Raccourcis clavier</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pressedKeys.length > 0 ? (
                  <span className="flex items-center gap-1">
                    <Command className="w-4 h-4" />
                    Touches détectées: {pressedKeys.join(' + ')}
                  </span>
                ) : (
                  'Appuyez sur une combinaison pour la tester'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {cat.label}
              <span className="ml-2 text-xs text-gray-500">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Shortcuts Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredShortcuts.map((shortcut) => (
              <div
                key={shortcut.id}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="p-2 bg-white dark:bg-gray-600 rounded-lg shadow-sm">
                  <shortcut.icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {shortcut.description}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {shortcut.category}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {shortcut.modifiers.map((mod) => (
                    <kbd
                      key={mod}
                      className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm font-mono text-gray-700 dark:text-gray-300 shadow-sm"
                    >
                      {getModifierSymbol(mod)}
                    </kbd>
                  ))}
                  <kbd
                    className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm font-mono text-gray-700 dark:text-gray-300 shadow-sm"
                  >
                    {shortcut.key}
                  </kbd>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Appuyez sur <kbd className="px-1 py-0.5 bg-white dark:bg-gray-600 border rounded">?</kbd> à tout moment pour afficher cette aide
            </span>
            <button
              onClick={() => {
                toast.success('Raccourcis clavier activés !');
                onClose();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook pour gérer les raccourcis clavier globaux
export function useKeyboardShortcuts() {
  const [showShortcutsPanel, setShowShortcutsPanel] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts panel with ?
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setShowShortcutsPanel(true);
      }

      // Ctrl+K: Search
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        toast.info('Recherche rapide (à implémenter)');
      }

      // Ctrl+D: Toggle dark mode
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        toast.info('Toggle dark mode (à implémenter)');
      }

      // Ctrl+Comma: Settings
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        window.location.href = '/settings';
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        setShowShortcutsPanel(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { showShortcutsPanel, setShowShortcutsPanel };
}
