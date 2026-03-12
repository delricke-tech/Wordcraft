import { useState, useEffect } from 'react';
import { 
  Archive, 
  X,
  Check,
  Loader2,
  Plus,
  Trash2,
  Download,
  Upload,
  FileText,
  Zap
} from 'lucide-react';
import { compressionService, CompressionOptions, CompressionResult } from '../services/compressionService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface CompressionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
}

export function CompressionPanel({ isOpen, onClose, documentId }: CompressionPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressions, setCompressions] = useState<CompressionResult[]>([]);
  const [settings, setSettings] = useState<CompressionOptions>({
    algorithm: 'gzip',
    level: 6,
    preserveOriginal: true,
    chunkSize: 1024 * 1024, // 1MB
    parallel: true,
    maxConcurrency: 4
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const compressionAlgorithms = [
    { id: 'gzip', name: 'GZIP', description: 'Compression standard, bonne compatibilité', ratio: 0.6 },
    { id: 'brotli', name: 'Brotli', description: 'Meilleur ratio, plus lent', ratio: 0.7 },
    { id: 'deflate', name: 'DEFLATE', description: 'Rapide, ratio modéré', ratio: 0.5 },
    { id: 'lz4', name: 'LZ4', description: 'Très rapide, ratio faible', ratio: 0.4 }
  ];

  useEffect(() => {
    if (isOpen && user) {
      loadCompressions();
    }
  }, [isOpen, user]);

  const loadCompressions = async () => {
    try {
      const compressionData = await compressionService.getUserCompressions(user!.id);
      setCompressions(compressionData);
    } catch (error) {
      console.error('Erreur chargement compressions:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleCompressFiles = async () => {
    if (!user || selectedFiles.length === 0) return;
    
    setCompressing(true);
    try {
      const results = await Promise.all(
        selectedFiles.map(async (file) => {
          const result = await compressionService.compressFile(file, settings);
          
          // Sauvegarder la compression
          await compressionService.saveCompression({
            userId: user.id,
            originalName: file.name,
            originalSize: file.size,
            compressedSize: result.compressedSize,
            algorithm: settings.algorithm,
            level: settings.level,
            compressionRatio: result.compressionRatio,
            compressedPath: result.compressedPath,
            metadata: {
              mimeType: file.type,
              lastModified: file.lastModified,
              processingTime: result.processingTime
            }
          });
          
          return result;
        })
      );
      
      toast.success(`${results.length} fichier(s) compressé(s) avec succès !`);
      setSelectedFiles([]);
      loadCompressions();
    } catch (error) {
      toast.error('Erreur lors de la compression');
    } finally {
      setCompressing(false);
    }
  };

  const handleDownloadCompressed = async (compression: CompressionResult) => {
    try {
      await compressionService.downloadCompressedFile(compression.id);
      toast.success('Téléchargement démarré');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleDeleteCompression = async (compressionId: string) => {
    setLoading(true);
    try {
      await compressionService.deleteCompression(compressionId);
      toast.success('Compression supprimée');
      loadCompressions();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
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

  const getCompressionIcon = (algorithm: string) => {
    switch (algorithm) {
      case 'gzip': return <Archive className="w-4 h-4 text-blue-500" />;
      case 'brotli': return <Zap className="w-4 h-4 text-green-500" />;
      case 'deflate': return <FileText className="w-4 h-4 text-gray-500" />;
      case 'lz4': return <Zap className="w-4 h-4 text-purple-500" />;
      default: return <Archive className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Archive className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Compression de fichiers</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {compressions.length} compressions • {formatBytes(compressions.reduce((sum, c) => sum + (c.originalSize - c.compressedSize), 0))} économisés
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
        <div className="flex-1 overflow-y-auto p-6">
          {/* Settings */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Paramètres de compression</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Algorithme
                </label>
                <div className="grid gap-2">
                  {compressionAlgorithms.map((algo) => (
                    <button
                      key={algo.id}
                      onClick={() => setSettings({ ...settings, algorithm: algo.id as any })}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        settings.algorithm === algo.id
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getCompressionIcon(algo.id)}
                        <span className="font-medium">{algo.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">Ratio: {algo.ratio}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Niveau de compression: {settings.level}
                </label>
                <input
                  type="range"
                  min="1"
                  max="9"
                  value={settings.level}
                  onChange={(e) => setSettings({ ...settings, level: Number(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Rapide</span>
                  <span>Maximum</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.preserveOriginal}
                  onChange={(e) => setSettings({ ...settings, preserveOriginal: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Conserver l'original</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.parallel}
                  onChange={(e) => setSettings({ ...settings, parallel: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Compression parallèle</span>
              </label>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fichiers à compresser</h3>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {selectedFiles.length > 0 
                      ? `${selectedFiles.length} fichier(s) sélectionné(s)` 
                      : 'Glissez-déposez des fichiers ou cliquez pour sélectionner'
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    Supporte: PDF, DOCX, images, archives
                  </p>
                </div>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedFiles.map(f => f.name).join(', ')}
                </div>
                <button
                  onClick={handleCompressFiles}
                  disabled={compressing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {compressing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Compression...
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" />
                      Compresser
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Compression History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historique des compressions</h3>
            
            {compressions.length > 0 ? (
              <div className="space-y-3">
                {compressions.map((compression) => (
                  <div
                    key={compression.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                        {getCompressionIcon(compression.algorithm)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {compression.originalName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatBytes(compression.originalSize)} → {formatBytes(compression.compressedSize)} 
                          <span className="text-green-600 font-medium">
                            {' '}({Math.round(compression.compressionRatio * 100)}% économisé)
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadCompressed(compression)}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCompression(compression.id)}
                        disabled={loading}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucune compression</p>
                <p className="text-sm mt-1">Compressez vos premiers fichiers</p>
              </div>
            )}
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
