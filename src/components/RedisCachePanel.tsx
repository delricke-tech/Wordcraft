import { useState, useEffect } from 'react';
import { 
  Database, 
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  HardDrive,
  Zap
} from 'lucide-react';
import { redisCacheService } from '../services/redisCacheService';
import { toast } from 'sonner';

interface RedisCachePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RedisCachePanel({ isOpen, onClose }: RedisCachePanelProps) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    cacheSize: 0,
    hitRate: 0,
    totalRequests: 0,
    avgResponseTime: 0,
    memoryUsage: 0,
    keysCount: 0
  });

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    setRefreshing(true);
    try {
      const cacheStats = await redisCacheService.getStats();
      setStats({
        cacheSize: cacheStats.totalSize || 0,
        hitRate: Math.round((cacheStats.hitRate || 0) * 100),
        totalRequests: cacheStats.totalEntries || 0,
        avgResponseTime: Math.round(cacheStats.performance?.averageGetTime || 0),
        memoryUsage: cacheStats.performance?.memoryUsage || 0,
        keysCount: cacheStats.totalEntries || 0
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearCache = async () => {
    setLoading(true);
    try {
      await redisCacheService.flush();
      toast.success('Cache vidé avec succès');
      loadStats();
    } catch (error) {
      toast.error('Erreur lors du vidage du cache');
    } finally {
      setLoading(false);
    }
  };

  const handleWarmupCache = async () => {
    setLoading(true);
    try {
      await redisCacheService.startWarmup();
      toast.success('Cache pré-chargé');
      loadStats();
    } catch (error) {
      toast.error('Erreur lors du pré-chargement');
    } finally {
      setLoading(false);
    }
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
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Database className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cache Redis</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monitoring et gestion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadStats}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-5 h-5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Hit Rate</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{stats.hitRate}%</p>
              <p className="text-xs text-gray-500">Efficacité du cache</p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Temps moyen</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{stats.avgResponseTime}ms</p>
              <p className="text-xs text-gray-500">Réponse cache</p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Taille</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">{formatBytes(stats.cacheSize)}</p>
              <p className="text-xs text-gray-500">{stats.keysCount} clés</p>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Requêtes</span>
              </div>
              <p className="text-2xl font-bold text-orange-700">{stats.totalRequests.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClearCache}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              Vider le cache
            </button>
            <button
              onClick={handleWarmupCache}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Pré-charger
            </button>
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Redis améliore les performances en mettant en cache les données fréquemment accédées.
                Un hit rate &gt; 80% est considéré comme excellent.
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
