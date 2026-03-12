import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Moon, 
  Sun, 
  Monitor,
  Palette,
  Type,
  Eye,
  Save,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface ThemeSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSettingsPanel({ isOpen, onClose }: ThemeSettingsPanelProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [fontSize, setFontSize] = useState(16);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme, isOpen]);

  const handleSave = () => {
    setTheme(selectedTheme);
    
    // Apply font size
    document.documentElement.style.fontSize = `${fontSize}px`;
    
    // Apply reduced motion
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
    
    // Apply high contrast
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    toast.success('Paramètres sauvegardés !');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Palette className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Apparence</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Personnalisez l'interface</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Thème
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedTheme('light')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedTheme === 'light'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
                }`}
              >
                <Sun className={`w-8 h-8 ${
                  selectedTheme === 'light' ? 'text-yellow-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  selectedTheme === 'light' ? 'text-yellow-700' : 'text-gray-600'
                }`}>Clair</span>
              </button>

              <button
                onClick={() => setSelectedTheme('dark')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedTheme === 'dark'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                }`}
              >
                <Moon className={`w-8 h-8 ${
                  selectedTheme === 'dark' ? 'text-indigo-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  selectedTheme === 'dark' ? 'text-indigo-700' : 'text-gray-600'
                }`}>Sombre</span>
              </button>

              <button
                onClick={() => setSelectedTheme('system')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedTheme === 'system'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-teal-300'
                }`}
              >
                <Monitor className={`w-8 h-8 ${
                  selectedTheme === 'system' ? 'text-teal-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  selectedTheme === 'system' ? 'text-teal-700' : 'text-gray-600'
                }`}>Auto</span>
              </button>
            </div>
            {selectedTheme === 'system' && (
              <p className="mt-2 text-xs text-gray-500">
                Système détecté : {resolvedTheme === 'dark' ? 'Sombre' : 'Clair'}
              </p>
            )}
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Type className="w-4 h-4 inline mr-2" />
              Taille de police
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Petite</span>
              <input
                type="range"
                min="14"
                max="20"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500">Grande</span>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Exemple: <span style={{ fontSize: `${fontSize}px` }}>Ceci est un texte d'exemple</span>
            </p>
          </div>

          {/* Accessibility Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                reducedMotion ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
              }`}>
                {reducedMotion && <Check className="w-3 h-3 text-white" />}
              </div>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="hidden"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Réduire les animations
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                highContrast ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
              }`}>
                {highContrast && <Check className="w-3 h-3 text-white" />}
              </div>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="hidden"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Contraste élevé
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
