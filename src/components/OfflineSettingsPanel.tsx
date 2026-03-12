import { useState, useEffect } from 'react';
import { 
  WifiOff, 
  Bell, 
  BellOff,
  RefreshCw,
  Download,
  Check,
  X,
  AlertCircle,
  Database,
  Cloud,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

interface OfflineSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfflineSettingsPanel({ isOpen, onClose }: OfflineSettingsPanelProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);
  const [syncQueue, setSyncQueue] = useState(0);
  const [offlineDocuments, setOfflineDocuments] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if PWA is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRequestPushPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        toast.success('Notifications activées !');
      } else {
        toast.error('Permission refusée pour les notifications');
      }
    } catch (error) {
      toast.error('Notifications non supportées par ce navigateur');
    }
  };

  const handleClearCache = () => {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
      setCacheSize(0);
      toast.success('Cache vidé !');
    }
  };

  const handleSyncNow = () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        // @ts-ignore
        registration.sync.register('sync-documents');
      });
      toast.success('Synchronisation lancée !');
    } else {
      toast.error('Synchronisation en arrière-plan non supportée');
    }
  };

  const handleInstallPwa = () => {
    // @ts-ignore
    if (window.deferredPrompt) {
      // @ts-ignore
      window.deferredPrompt.prompt();
      // @ts-ignore
      window.deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setIsPwaInstalled(true);
          toast.success('Application installée !');
        }
        // @ts-ignore
        window.deferredPrompt = null;
      });
    } else {
      toast.error('Installation non disponible. Utilisez le menu du navigateur.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOnline ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {isOnline ? (
                <Cloud className="w-6 h-6 text-green-600" />
              ) : (
                <WifiOff className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mode Hors Ligne</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isOnline ? 'Connecté' : 'Hors ligne'}
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cache</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(cacheSize / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">File d'attente</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {syncQueue} éléments
              </p>
            </div>
          </div>

          {/* PWA Installation */}
          {!isPwaInstalled && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    Installer l'application
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Installez Wordcraft sur votre appareil pour un accès rapide et le mode hors ligne complet.
                  </p>
                  <button
                    onClick={handleInstallPwa}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Installer l'application
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Push Notifications */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              {pushEnabled ? (
                <Bell className="w-5 h-5 text-green-600" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              Notifications push
            </h4>
            
            {pushEnabled ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Notifications activées
                </span>
                <button
                  onClick={() => setPushEnabled(false)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Désactiver
                </button>
              </div>
            ) : (
              <button
                onClick={handleRequestPushPermission}
                className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2"
              >
                <Bell className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">Activer les notifications</span>
              </button>
            )}
          </div>

          {/* Offline Documents */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Documents disponibles hors ligne
            </h4>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {offlineDocuments} documents synchronisés
                </span>
                <button
                  onClick={handleSyncNow}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  title="Synchroniser maintenant"
                >
                  <RefreshCw className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Cache Management */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Gestion du cache</h4>
            <div className="flex gap-3">
              <button
                onClick={handleClearCache}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Vider le cache
              </button>
              <button
                onClick={handleSyncNow}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Synchroniser
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Les documents marqués pour le mode hors ligne sont disponibles même sans connexion Internet.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
