/**
 * Composant pour la gestion des URLs dans le chat
 * Permet d'ajouter manuellement des URLs et affiche celles détectées automatiquement
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  ExternalLink, 
  Loader2, 
  CheckCircle, 
  Globe
} from 'lucide-react';
import { 
  scrapeWebPage, 
  isValidUrl, 
  type ScrapedContent 
} from '../services/webScrapingService';
import { toast } from 'sonner';

interface URLInputProps {
  onUrlsChange?: (urls: ScrapedContent[]) => void;
  className?: string;
}

export function URLInput({ onUrlsChange, className = '' }: URLInputProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [scrapedUrls, setScrapedUrls] = useState<ScrapedContent[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [showInput, setShowInput] = useState(false);

  // Notifier le parent quand les URLs changent
  useEffect(() => {
    onUrlsChange?.(scrapedUrls);
  }, [scrapedUrls, onUrlsChange]);

  const handleAddUrl = async () => {
    if (!inputUrl.trim()) return;

    if (!isValidUrl(inputUrl)) {
      toast.error('URL invalide', {
        description: 'Veuillez entrer une URL valide (ex: https://example.com)'
      });
      return;
    }

    // Vérifier si l'URL n'est pas déjà ajoutée
    if (scrapedUrls.some(scraped => scraped.url === inputUrl)) {
      toast.error('URL déjà ajoutée', {
        description: 'Cette URL a déjà été analysée'
      });
      return;
    }

    setIsScraping(true);
    const loadingToast = toast.loading('Analyse de l\'URL en cours...');

    try {
      const scrapedContent = await scrapeWebPage(inputUrl);
      
      setScrapedUrls(prev => [...prev, scrapedContent]);
      setInputUrl('');
      setShowInput(false);
      
      toast.success('URL analysée avec succès', {
        id: loadingToast,
        description: `${scrapedContent.title} (${scrapedContent.content.length} caractères)`
      });
    } catch (error: any) {
      console.error('❌ Erreur scraping URL:', error);
      toast.error('Erreur lors de l\'analyse', {
        id: loadingToast,
        description: error.message || 'Impossible d\'extraire le contenu de cette URL'
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    setScrapedUrls(prev => prev.filter(scraped => scraped.url !== urlToRemove));
    toast.success('URL supprimée');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddUrl();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Bouton d'ajout d'URL */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white/80">
            Sources web ({scrapedUrls.length})
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
              Ajouter une URL
            </>
          )}
        </button>
      </div>

      {/* Input pour ajouter une URL */}
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
                placeholder="https://example.com"
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent"
                disabled={isScraping}
              />
              <button
                onClick={handleAddUrl}
                disabled={!inputUrl.trim() || isScraping}
                className="px-4 py-2 bg-blue-500/80 hover:bg-blue-600/80 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium text-sm flex items-center gap-2"
              >
                {isScraping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyse...
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

      {/* Liste des URLs scrapées */}
      <AnimatePresence>
        {scrapedUrls.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {scrapedUrls.map((scraped, index) => (
              <motion.div
                key={scraped.url}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-white/90 truncate">
                      {scraped.title}
                    </h4>
                    <a
                      href={scraped.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Ouvrir dans un nouvel onglet"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-white/60 mb-1">
                    {scraped.url}
                  </p>
                  <p className="text-xs text-white/50">
                    {scraped.content.length} caractères • 
                    {new Date(scraped.timestamp).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveUrl(scraped.url)}
                  className="p-1 text-white/40 hover:text-white/60 hover:bg-white/10 rounded transition-colors"
                  title="Supprimer cette URL"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message d'aide */}
      {scrapedUrls.length === 0 && !showInput && (
        <div className="text-center py-4">
          <Globe className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-xs text-white/50">
            Ajoutez des URLs pour enrichir le contexte de votre conversation
          </p>
          <p className="text-xs text-white/40 mt-1">
            Les URLs dans vos messages seront détectées automatiquement
          </p>
        </div>
      )}
    </div>
  );
}
