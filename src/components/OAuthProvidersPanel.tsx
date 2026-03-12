import { useState, useEffect } from 'react';
import { 
  Globe, 
  X,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { oauthService, OAuthProvider } from '../services/oauthService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface OAuthProvidersPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OAuthProvidersPanel({ isOpen, onClose }: OAuthProvidersPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      loadProviders();
    }
  }, [isOpen, user]);

  const loadProviders = async () => {
    try {
      const connected = await oauthService.getConnectedProviders(user!.id);
      setProviders(connected);
    } catch (error) {
      console.error('Erreur chargement providers:', error);
    }
  };

  const handleConnect = async (provider: string) => {
    setConnecting(provider);
    try {
      await oauthService.initiateOAuth(provider);
    } catch (error) {
      toast.error(`Erreur connexion ${provider}`);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    setLoading(true);
    try {
      await oauthService.disconnectProvider(providerId);
      toast.success('Compte déconnecté');
      loadProviders();
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  };

  const availableProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: '🔍',
      color: 'bg-red-50 border-red-200',
      iconColor: 'text-red-600',
      description: 'Connexion avec votre compte Google'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '👤',
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      description: 'Connexion avec votre compte Facebook'
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      icon: '🪟',
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-700',
      description: 'Connexion avec votre compte Microsoft/Office 365'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: '🐙',
      color: 'bg-gray-50 border-gray-200',
      iconColor: 'text-gray-800',
      description: 'Connexion avec votre compte GitHub'
    }
  ];

  const isConnected = (providerId: string) => {
    return providers.some(p => p.provider === providerId && p.connected);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Comptes connectés</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Connectez vos comptes externes</p>
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
        <div className="p-6 space-y-4">
          {availableProviders.map((provider) => {
            const connected = isConnected(provider.id);
            return (
              <div
                key={provider.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  connected ? 'border-green-200 bg-green-50/50' : provider.color
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center text-xl shadow-sm">
                      {provider.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {provider.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {connected ? 'Connecté' : provider.description}
                      </p>
                    </div>
                  </div>

                  {connected ? (
                    <button
                      onClick={() => handleDisconnect(provider.id)}
                      disabled={loading}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Déconnecter'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(provider.id)}
                      disabled={connecting === provider.id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      {connecting === provider.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                      Connecter
                    </button>
                  )}
                </div>

                {connected && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    <span>Compte connecté avec succès</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Info */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Ces connexions vous permettent d'importer des documents depuis Google Drive, 
                OneDrive, et de partager facilement vos contenus.
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
