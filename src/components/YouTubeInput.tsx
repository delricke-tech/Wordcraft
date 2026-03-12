/**
 * Composant pour la gestion des URLs YouTube dans le chat
 * Permet d'ajouter manuellement des URLs YouTube et affiche celles détectées automatiquement
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Plus, 
  X, 
  ExternalLink, 
  Loader2, 
  CheckCircle, 
  Youtube,
  Clock,
  User
} from 'lucide-react';
import { 
  extractYouTubeTranscript, 
  isYouTubeUrl, 
  type YouTubeTranscript 
} from '../services/youtubeService';
import { toast } from 'sonner';

interface YouTubeInputProps {
  onYouTubeChange?: (youtubeContents: YouTubeTranscript[]) => void;
  className?: string;
}

export function YouTubeInput({ onYouTubeChange, className = '' }: YouTubeInputProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [youtubeContents, setYoutubeContents] = useState<YouTubeTranscript[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showInput, setShowInput] = useState(false);

  // Notifier le parent quand les contenus YouTube changent
  useEffect(() => {
    onYouTubeChange?.(youtubeContents);
  }, [youtubeContents, onYouTubeChange]);

  const handleAddYouTube = async () => {
    if (!inputUrl.trim()) return;

    if (!isYouTubeUrl(inputUrl)) {
      toast.error('URL YouTube invalide', {
        description: 'Veuillez entrer une URL YouTube valide (ex: https://youtube.com/watch?v=...)'
      });
      return;
    }

    // Vérifier si l'URL n'est pas déjà ajoutée
    if (youtubeContents.some(content => content.url === inputUrl)) {
      toast.error('URL YouTube déjà ajoutée', {
        description: 'Cette vidéo a déjà été analysée'
      });
      return;
    }

    setIsExtracting(true);
    const loadingToast = toast.loading('Extraction du transcript en cours...');

    try {
      const youtubeContent = await extractYouTubeTranscript(inputUrl);
      
      setYoutubeContents(prev => [...prev, youtubeContent]);
      setInputUrl('');
      setShowInput(false);
      
      toast.success('Vidéo YouTube analysée avec succès', {
        id: loadingToast,
        description: `${youtubeContent.metadata.title} (${youtubeContent.transcript.length} caractères)`
      });
    } catch (error: any) {
      console.error('❌ Erreur extraction YouTube:', error);
      toast.error('Erreur lors de l\'extraction', {
        id: loadingToast,
        description: error.message || 'Impossible d\'extraire le transcript de cette vidéo'
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRemoveYouTube = (urlToRemove: string) => {
    setYoutubeContents(prev => prev.filter(content => content.url !== urlToRemove));
    toast.success('Vidéo YouTube supprimée');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddYouTube();
    }
  };

  // Formater la durée YouTube (PT4M13S -> 4:13)
  const formatDuration = (duration: string): string => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return duration;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Bouton d'ajout d'URL YouTube */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-white/80">
            Vidéos YouTube ({youtubeContents.length})
          </span>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/80 text-sm"
        >
          {showInput ? (
            <>
              <X className="w-3 h-3" />
              Annuler
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              Ajouter YouTube
            </>
          )}
        </button>
      </div>

      {/* Input pour ajouter une URL YouTube */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex gap-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-transparent"
                disabled={isExtracting}
              />
              <button
                onClick={handleAddYouTube}
                disabled={!inputUrl.trim() || isExtracting}
                className="px-4 py-2 bg-red-500/80 hover:bg-red-600/80 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium text-sm flex items-center gap-2"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extraction...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des vidéos YouTube extraites */}
      <AnimatePresence>
        {youtubeContents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {youtubeContents.map((content, index) => (
              <motion.div
                key={content.url}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
              >
                {/* Thumbnail */}
                <div className="relative flex-shrink-0">
                  <img
                    src={content.metadata.thumbnail}
                    alt={content.metadata.title}
                    className="w-16 h-12 rounded object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white/80" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-white/90 truncate">
                      {content.metadata.title}
                    </h4>
                    <a
                      href={content.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Ouvrir dans YouTube"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-white/60 mb-1">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {content.metadata.channelTitle}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(content.metadata.duration)}
                    </div>
                  </div>
                  
                  <p className="text-xs text-white/50">
                    {content.transcript.length} caractères • 
                    {new Date(content.timestamp).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <button
                  onClick={() => handleRemoveYouTube(content.url)}
                  className="p-1 text-white/40 hover:text-white/60 hover:bg-white/10 rounded transition-colors"
                  title="Supprimer cette vidéo"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message d'aide */}
      {youtubeContents.length === 0 && !showInput && (
        <div className="text-center py-4">
          <Youtube className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-xs text-white/50">
            Ajoutez des vidéos YouTube pour enrichir le contexte
          </p>
          <p className="text-xs text-white/40 mt-1">
            Les URLs YouTube dans vos messages seront détectées automatiquement
          </p>
        </div>
      )}
    </div>
  );
}
