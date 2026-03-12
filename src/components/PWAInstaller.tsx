/**
 * Composant d'installation PWA (Progressive Web App)
 * 
 * Ce composant gère l'installation de l'application PWA
 * avec détection automatique et invitation personnalisée
 * 
 * Date: 12 mars 2026
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  X, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Check, 
  ArrowRight,
  Star,
  Zap,
  Shield,
  Wifi,
  Bell,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface PWAInstallerProps {
  className?: string;
  showOnLoad?: boolean;
  delay?: number;
  forceShow?: boolean;
}

interface InstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstaller: React.FC<PWAInstallerProps> = ({
  className = '',
  showOnLoad = true,
  delay = 3000,
  forceShow = false
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPrompt | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installStep, setInstallStep] = useState<'prompt' | 'installing' | 'success'>('prompt');

  // Détecter si l'app est déjà installée
  useEffect(() => {
    const checkInstalled = () => {
      // Vérifier si l'app est en mode standalone
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      
      setIsStandalone(standalone);
      setIsInstalled(standalone);
    };

    // Détecter iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    checkInstalled();

    // Écouter les changements de display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addListener(checkInstalled);

    return () => {
      mediaQuery.removeListener(checkInstalled);
    };
  }, []);

  // Écouter l'événement beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as any);
      
      if (showOnLoad && !isInstalled) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, delay);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      toast.success('WordCraft IA a été installée avec succès !');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [showOnLoad, delay, isInstalled]);

  // Forcer l'affichage si demandé
  useEffect(() => {
    if (forceShow && !isInstalled && deferredPrompt) {
      setShowInstallPrompt(true);
    }
  }, [forceShow, isInstalled, deferredPrompt]);

  // Installer l'application
  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Instructions pour iOS
      if (isIOS) {
        setShowInstallPrompt(false);
        // Afficher les instructions iOS
        toast.info('Pour installer sur iOS: Tapez l\'icône "Partager" puis "Ajouter à l\'écran d\'accueil"');
        return;
      }
      return;
    }

    try {
      setInstallStep('installing');
      
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstallStep('success');
        setTimeout(() => {
          setShowInstallPrompt(false);
          setIsInstalled(true);
        }, 2000);
      } else {
        setInstallStep('prompt');
        setShowInstallPrompt(false);
      }
      
      setDeferredPrompt(null);
      
    } catch (error) {
      console.error('❌ Erreur installation PWA:', error);
      setInstallStep('prompt');
      toast.error('Erreur lors de l\'installation');
    }
  };

  // Ignorer l'invitation
  const handleDismiss = () => {
    setShowInstallPrompt(false);
    
    // Ne plus montrer pendant 7 jours
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Vérifier si l'invitation a été ignorée récemment
  const shouldShowPrompt = useCallback(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) return true;
    
    const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
    return daysSinceDismissed > 7;
  }, []);

  // Si l'app est déjà installée, ne rien afficher
  if (isInstalled || isStandalone) {
    return null;
  }

  // Si l'invitation ne doit pas être montrée
  if (!shouldShowPrompt() && !forceShow) {
    return null;
  }

  // Rendu de l'invitation d'installation
  const renderInstallPrompt = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`pwa-install-prompt ${className}`}
    >
      <div className="flex items-start gap-4">
        {/* Icône de l'app */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white mb-1">Installez WordCraft IA</h3>
          <p className="text-blue-100 text-sm mb-3">
            Accédez à vos documents même hors ligne et profitez d'une expérience optimale
          </p>

          {/* Avantages */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-1 text-xs text-blue-100">
              <Wifi className="w-3 h-3" />
              <span>Hors ligne</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-100">
              <Zap className="w-3 h-3" />
              <span>Rapide</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-100">
              <Bell className="w-3 h-3" />
              <span>Notifications</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-100">
              <Shield className="w-3 h-3" />
              <span>Sécurisé</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {installStep === 'prompt' && (
              <>
                <button
                  onClick={handleInstall}
                  className="pwa-install-button flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Installer
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-blue-100 hover:text-white text-sm"
                >
                  Plus tard
                </button>
              </>
            )}
            
            {installStep === 'installing' && (
              <div className="flex items-center gap-2 text-white">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Installation...</span>
              </div>
            )}
            
            {installStep === 'success' && (
              <div className="flex items-center gap-2 text-white">
                <Check className="w-4 h-4" />
                <span>Installée !</span>
              </div>
            )}
          </div>
        </div>

        {/* Bouton fermer */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-blue-100 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );

  // Instructions spécifiques pour iOS
  const renderIOSInstructions = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`pwa-install-prompt ${className}`}
    >
      <div className="text-center">
        <Smartphone className="w-12 h-12 text-white mx-auto mb-3" />
        <h3 className="font-semibold text-white mb-2">Installez sur iOS</h3>
        <p className="text-blue-100 text-sm mb-4">
          Suivez ces étapes simples pour installer WordCraft IA sur votre iPhone/iPad
        </p>
        
        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3 bg-white bg-opacity-10 rounded-lg p-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">1</span>
            </div>
            <p className="text-white text-sm">
              Tapez l'icône <strong>Partager</strong> <span className="text-blue-200">↓</span> en bas de l'écran
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white bg-opacity-10 rounded-lg p-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">2</span>
            </div>
            <p className="text-white text-sm">
              Faites défiler et tapez <strong>"Ajouter à l'écran d'accueil"</strong>
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white bg-opacity-10 rounded-lg p-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">3</span>
            </div>
            <p className="text-white text-sm">
              Tapez <strong>"Ajouter"</strong> pour finaliser l'installation
            </p>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="mt-4 text-blue-100 hover:text-white text-sm"
        >
          J'ai compris
        </button>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {showInstallPrompt && !isInstalled && (
        <>
          {isIOS ? renderIOSInstructions() : renderInstallPrompt()}
        </>
      )}
    </AnimatePresence>
  );
};

export default PWAInstaller;
