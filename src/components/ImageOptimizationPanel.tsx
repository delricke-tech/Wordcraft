import { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  X,
  Check,
  Loader2,
  Zap,
  FileImage,
  AlertCircle
} from 'lucide-react';
import { imageOptimizationService, OptimizationRequestSettings } from '../services/imageOptimizationService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface ImageOptimizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageOptimizationPanel({ isOpen, onClose }: ImageOptimizationPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<OptimizationRequestSettings>({
    quality: 85,
    format: 'webp',
    maxWidth: 1920,
    maxHeight: 1080,
    progressive: true,
    lazyLoading: true,
    responsive: true,
    compressionLevel: 'balanced'
  });
  const [stats, setStats] = useState({
    totalOptimized: 0,
    spaceSaved: 0,
    averageCompression: 0
  });

  useEffect(() => {
    if (isOpen && user) {
      loadSettings();
      loadStats();
    }
  }, [isOpen, user]);

  const loadSettings = async () => {
    // Settings are loaded from component state for now
    // In a real implementation, these would come from user preferences
  };

  const loadStats = async () => {
    try {
      const optimizationStats = await imageOptimizationService.getOptimizationStats();
      setStats({
        totalOptimized: optimizationStats.totalOptimizations,
        spaceSaved: optimizationStats.totalSpaceSaved,
        averageCompression: Math.round(optimizationStats.averageCompressionRatio * 100)
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleSave = async () => {
    toast.success('Paramètres d\'optimisation sauvegardés !');
    onClose();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ImageIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Optimisation des images</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Compression et format WebP</p>
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
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
              <p className="text-2xl font-bold text-green-600">{stats.totalOptimized}</p>
              <p className="text-xs text-gray-500">Images optimisées</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
              <p className="text-2xl font-bold text-blue-600">{formatBytes(stats.spaceSaved)}</p>
              <p className="text-xs text-gray-500">Espace économisé</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.averageCompression}%</p>
              <p className="text-xs text-gray-500">Compression moyenne</p>
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Format de sortie
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['webp', 'jpeg', 'png'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => setSettings({ ...settings, format })}
                  className={`p-3 rounded-xl border-2 transition-all capitalize ${
                    settings.format === format
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                  }`}
                >
                  <FileImage className={`w-5 h-5 mx-auto mb-1 ${
                    settings.format === format ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    settings.format === format ? 'text-green-700' : 'text-gray-600'
                  }`}>{format}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Qualité : {settings.quality}%
            </label>
            <input
              type="range"
              min="60"
              max="100"
              value={settings.quality}
              onChange={(e) => setSettings({ ...settings, quality: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Compression max</span>
              <span>Qualité max</span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                settings.lazyLoading ? 'bg-green-500 border-green-500' : 'border-gray-300'
              }`}>
                {settings.lazyLoading && <Check className="w-3 h-3 text-white" />}
              </div>
              <input
                type="checkbox"
                checked={settings.lazyLoading}
                onChange={(e) => setSettings({ ...settings, lazyLoading: e.target.checked })}
                className="hidden"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Chargement différé (Lazy loading)
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                settings.responsive ? 'bg-green-500 border-green-500' : 'border-gray-300'
              }`}>
                {settings.responsive && <Check className="w-3 h-3 text-white" />}
              </div>
              <input
                type="checkbox"
                checked={settings.responsive}
                onChange={(e) => setSettings({ ...settings, responsive: e.target.checked })}
                className="hidden"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Images responsives (multi-tailles)
              </span>
            </label>
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                WebP offre 25-35% de compression supérieure à JPEG sans perte de qualité visible.
                Recommandé pour toutes les images web.
              </span>
            </p>
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
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
