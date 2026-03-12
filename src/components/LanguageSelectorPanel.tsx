import { useState, useEffect } from 'react';
import { 
  Globe, 
  Check,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { i18nService, Language } from '../services/i18nService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface LanguageSelectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LanguageSelectorPanel({ isOpen, onClose }: LanguageSelectorPanelProps) {
  const { user } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('fr');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoDetect, setAutoDetect] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLanguages();
    }
  }, [isOpen]);

  const loadLanguages = async () => {
    setLoading(true);
    try {
      const langs = await i18nService.getLanguages();
      setLanguages(langs);
      
      // Load user preference
      if (user) {
        const preference = await i18nService.getUserPreference(user.id);
        if (preference) {
          setSelectedLanguage(preference.languageId);
          setAutoDetect(preference.autoDetect);
        }
      }
    } catch (error) {
      console.error('Erreur chargement langues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    setSaving(true);
    try {
      await i18nService.updateUserPreference(user.id, {
        languageId: selectedLanguage,
        autoDetect,
        isPrimary: true,
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        numberFormat: 'fr-FR',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      toast.success('Préférences de langue sauvegardées !');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getFlagEmoji = (flag: string) => {
    const flagEmojis: Record<string, string> = {
      'fr': '🇫🇷',
      'en': '🇬🇧',
      'es': '🇪🇸',
      'de': '🇩🇪',
      'it': '🇮🇹',
      'pt': '🇵🇹',
    };
    return flagEmojis[flag] || '🌐';
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Langue et région</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Personnalisez votre langue préférée</p>
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
          {/* Auto-detect */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              autoDetect ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
            }`}>
              {autoDetect && <Check className="w-3 h-3 text-white" />}
            </div>
            <input
              type="checkbox"
              checked={autoDetect}
              onChange={(e) => setAutoDetect(e.target.checked)}
              className="hidden"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Détecter automatiquement la langue du navigateur
            </span>
          </label>

          {/* Language List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Langues disponibles
              </h3>
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    selectedLanguage === lang.code
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <span className="text-2xl">{getFlagEmoji(lang.flag)}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {lang.nativeName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {lang.name}
                    </p>
                  </div>
                  {selectedLanguage === lang.code && (
                    <div className="p-1 bg-blue-500 rounded-full">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Note :</strong> La traduction complète de l'interface sera progressive. 
              Certaines fonctionnalités peuvent rester en anglais temporairement.
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
            disabled={saving || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook pour utiliser les traductions
export function useI18n() {
  const [currentLanguage, setCurrentLanguage] = useState<string>('fr');
  const { user } = useAuth();

  useEffect(() => {
    const loadLanguage = async () => {
      if (user) {
        try {
          const preference = await i18nService.getUserPreference(user.id);
          if (preference) {
            setCurrentLanguage(preference.languageId);
          }
        } catch (error) {
          console.error('Erreur chargement langue:', error);
        }
      }
    };

    loadLanguage();
  }, [user]);

  const t = (key: string, fallback?: string): string => {
    // Simplified translation - in real app would fetch from service
    const translations: Record<string, Record<string, string>> = {
      'fr': {
        'welcome': 'Bienvenue',
        'documents': 'Documents',
        'library': 'Bibliothèque',
        'settings': 'Paramètres',
        'profile': 'Profil',
        'logout': 'Déconnexion',
        'search': 'Rechercher',
        'create': 'Créer',
        'save': 'Sauvegarder',
        'cancel': 'Annuler',
        'delete': 'Supprimer',
        'edit': 'Modifier',
        'share': 'Partager',
        'export': 'Exporter',
      },
      'en': {
        'welcome': 'Welcome',
        'documents': 'Documents',
        'library': 'Library',
        'settings': 'Settings',
        'profile': 'Profile',
        'logout': 'Logout',
        'search': 'Search',
        'create': 'Create',
        'save': 'Save',
        'cancel': 'Cancel',
        'delete': 'Delete',
        'edit': 'Edit',
        'share': 'Share',
        'export': 'Export',
      },
      'es': {
        'welcome': 'Bienvenido',
        'documents': 'Documentos',
        'library': 'Biblioteca',
        'settings': 'Configuración',
        'profile': 'Perfil',
        'logout': 'Cerrar sesión',
        'search': 'Buscar',
        'create': 'Crear',
        'save': 'Guardar',
        'cancel': 'Cancelar',
        'delete': 'Eliminar',
        'edit': 'Editar',
        'share': 'Compartir',
        'export': 'Exportar',
      }
    };

    return translations[currentLanguage]?.[key] || fallback || key;
  };

  return { t, currentLanguage };
}
