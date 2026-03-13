/**
 * Service d'internationalisation i18n (FR/EN/ES)
 * 
 * Ce service gère les traductions, la détection de langue,
 * le chargement dynamique des traductions et les préférences utilisateur
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface Language {
  id: string;
  code: string;
  name: string;
  displayName: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
  isActive: boolean;
  isDefault: boolean;
  region: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: NumberFormat;
  currency: CurrencyFormat;
  pluralRules: PluralRule[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  completionRate: number; // Pourcentage de traductions complètes
}

export interface NumberFormat {
  decimal: string;
  thousands: string;
  grouping: number[];
  currency: string;
  percent: string;
}

export interface CurrencyFormat {
  code: string;
  symbol: string;
  position: 'before' | 'after';
  decimalDigits: number;
}

export interface PluralRule {
  rule: string;
  count: number;
  examples: string[];
}

export interface Translation {
  id: string;
  key: string;
  languageId: string;
  value: string;
  context?: string;
  pluralForm?: string;
  isVerified: boolean;
  isAutoTranslated: boolean;
  createdAt: string;
  updatedAt: string;
  translatedBy?: string;
  metadata: TranslationMetadata;
}

export interface TranslationMetadata {
  source: 'manual' | 'ai' | 'import' | 'crowdsourced';
  confidence?: number;
  alternatives?: string[];
  notes?: string;
  usage?: number;
  lastUsed?: string;
}

export interface UserLanguagePreference {
  id: string;
  userId: string;
  languageId: string;
  isPrimary: boolean;
  fallbackLanguageId?: string;
  autoDetect: boolean;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  timezone: string;
  customTranslations: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string;
}

export interface TranslationNamespace {
  id: string;
  name: string;
  description?: string;
  keyCount: number;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationKey {
  id: string;
  namespace: string;
  key: string;
  description?: string;
  context?: string;
  plural: boolean;
  maxLength?: number;
  variables: string[];
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface I18nStats {
  totalLanguages: number;
  activeLanguages: number;
  totalTranslations: number;
  verifiedTranslations: number;
  autoTranslations: number;
  completionByLanguage: Record<string, number>;
  usageByLanguage: Record<string, number>;
  topTranslations: Array<{ key: string; usage: number; language: string }>;
  userPreferences: {
    totalUsers: number;
    autoDetectEnabled: number;
    customTranslations: number;
  };
  qualityMetrics: {
    averageConfidence: number;
    verificationRate: number;
    errorRate: number;
  };
}

class I18nService {
  private currentLanguage: Language | null = null;
  private translations: Map<string, Record<string, string>> = new Map();
  private userPreference: UserLanguagePreference | null = null;
  private fallbackLanguage: Language | null = null;
  private translationCache: Map<string, string> = new Map();
  private languageChangeCallbacks: Array<(language: Language) => void> = [];

  constructor() {
    this.initializeLanguageDetection();
  }

  /**
   * Initialise la détection automatique de langue
   */
  private initializeLanguageDetection(): void {
    if (typeof window !== 'undefined') {
      // Détecter la langue du navigateur
      const browserLanguage = navigator.language || (navigator as any).userLanguage;
      if (browserLanguage) {
        this.setLanguageByCode(browserLanguage.split('-')[0]);
      }
    }
  }

  /**
   * Récupère toutes les langues actives
   */
  async getLanguages(): Promise<Language[]> {
    try {
      // Utiliser des langues par défaut si la table n'existe pas
      const defaultLanguages: Language[] = [
        { code: 'fr', name: 'Français', is_default: true, is_active: true },
        { code: 'en', name: 'English', is_default: false, is_active: true },
        { code: 'es', name: 'Español', is_default: false, is_active: true }
      ];

      try {
        const { data, error } = await supabase
          .from('languages')
          .select('*')
          .eq('is_active', true)
          .order('is_default', { ascending: false })
          .order('name', { ascending: true });

        if (error) {
          console.warn('⚠️ Table languages non trouvée, utilisation des langues par défaut');
          return defaultLanguages;
        }

        return (data && data.length > 0) ? data.map(this.mapLanguageFromDB) : defaultLanguages;

      } catch (tableError) {
        console.warn('⚠️ Erreur table languages, utilisation des langues par défaut:', tableError);
        return defaultLanguages;
      }

    } catch (error) {
      console.error('❌ Erreur récupération langues:', error);
      // Retourner les langues par défaut en cas d'erreur
      return [
        { code: 'fr', name: 'Français', is_default: true, is_active: true },
        { code: 'en', name: 'English', is_default: false, is_active: true },
        { code: 'es', name: 'Español', is_default: false, is_active: true }
      ];
    }
  }

  /**
   * Définit la langue courante
   */
  async setLanguage(languageId: string, userId?: string): Promise<void> {
    try {
      // Récupérer la langue
      const language = await this.getLanguageById(languageId);
      if (!language) {
        throw new Error('Langue non trouvée');
      }

      // Mettre à jour les préférences utilisateur
      if (userId) {
        await this.updateUserPreference(userId, { languageId });
      }

      // Charger les traductions
      await this.loadTranslations(languageId);

      // Mettre à jour la langue courante
      this.currentLanguage = language;

      // Mettre à jour les attributs HTML
      this.updateHTMLAttributes(language);

      // Notifier les callbacks
      this.notifyLanguageChange(language);

      console.log('🌐 Langue définie:', language.displayName);

    } catch (error) {
      console.error('❌ Erreur définition langue:', error);
      throw new Error(`Échec de la définition: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Définit la langue par code
   */
  async setLanguageByCode(code: string, userId?: string): Promise<void> {
    try {
      const languages = await this.getLanguages();
      const language = languages.find(lang => lang.code === code);
      
      if (language) {
        await this.setLanguage(language.id, userId);
      } else {
        console.warn('⚠️ Langue non trouvée pour le code:', code);
      }

    } catch (error) {
      console.error('❌ Erreur définition langue par code:', error);
    }
  }

  /**
   * Charge les traductions pour une langue
   */
  private async loadTranslations(languageId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('key, value, plural_form')
        .eq('language_id', languageId);

      if (error) throw error;

      const translations: Record<string, string> = {};
      (data || []).forEach(translation => {
        const key = translation.plural_form 
          ? `${translation.key}.${translation.plural_form}`
          : translation.key;
        translations[key] = translation.value;
      });

      this.translations.set(languageId, translations);

    } catch (error) {
      console.error('❌ Erreur chargement traductions:', error);
    }
  }

  /**
   * Traduit une clé
   */
  translate(
    key: string, 
    options: {
      count?: number;
      variables?: Record<string, any>;
      defaultValue?: string;
      context?: string;
    } = {}
  ): string {
    if (!this.currentLanguage) {
      return options.defaultValue || key;
    }

    // Vérifier le cache
    const cacheKey = `${this.currentLanguage.id}:${key}:${options.count || 'singular'}`;
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!;
    }

    const translations = this.translations.get(this.currentLanguage.id) || {};
    
    // Gérer les formes plurielles
    let translationKey = key;
    if (options.count !== undefined) {
      const pluralForm = this.getPluralForm(options.count);
      const pluralKey = `${key}.${pluralForm}`;
      if (translations[pluralKey]) {
        translationKey = pluralKey;
      }
    }

    let translation = translations[translationKey];

    // Utiliser la langue de secours si nécessaire
    if (!translation && this.fallbackLanguage) {
      const fallbackTranslations = this.translations.get(this.fallbackLanguage.id) || {};
      translation = fallbackTranslations[key];
    }

    // Utiliser la valeur par défaut
    if (!translation) {
      translation = options.defaultValue || key;
    }

    // Remplacer les variables
    if (options.variables) {
      translation = this.interpolateVariables(translation, options.variables);
    }

    // Mettre en cache
    this.translationCache.set(cacheKey, translation);

    return translation;
  }

  /**
   * Obtient la forme plurielle appropriée
   */
  private getPluralForm(count: number): string {
    if (!this.currentLanguage) return 'other';

    // Règles plurielles simplifiées
    const { pluralRules } = this.currentLanguage;
    
    for (const rule of pluralRules) {
      if (this.evaluatePluralRule(rule.rule, count)) {
        return rule.count === 1 ? 'one' : 'other';
      }
    }

    return 'other';
  }

  /**
   * Évalue une règle plurielle
   */
  private evaluatePluralRule(rule: string, count: number): boolean {
    // Évaluation simplifiée des règles plurielles
    try {
      // Remplacer les variables dans la règle
      const evaluatedRule = rule.replace(/n/g, count.toString());
      
      // Évaluer la règle (simplifié)
      if (evaluatedRule.includes('== 1')) {
        return count === 1;
      }
      if (evaluatedRule.includes('!= 1')) {
        return count !== 1;
      }
      if (evaluatedRule.includes('> 1')) {
        return count > 1;
      }
      
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Interpole les variables dans la traduction
   */
  private interpolateVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  /**
   * Formate une date selon la langue
   */
  formatDate(date: Date, format?: string): string {
    if (!this.currentLanguage) {
      return date.toLocaleDateString();
    }

    const dateFormat = format || this.currentLanguage.dateFormat;
    const options: Intl.DateTimeFormatOptions = {};

    // Parser le format de date
    if (dateFormat.includes('YYYY')) options.year = 'numeric';
    if (dateFormat.includes('MM')) options.month = '2-digit';
    if (dateFormat.includes('DD')) options.day = '2-digit';

    try {
      return new Intl.DateTimeFormat(this.currentLanguage.code, options).format(date);
    } catch {
      return date.toLocaleDateString();
    }
  }

  /**
   * Formate un nombre selon la langue
   */
  formatNumber(number: number, options?: {
    style?: 'decimal' | 'currency' | 'percent';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }): string {
    if (!this.currentLanguage) {
      return number.toString();
    }

    const format = options?.style || 'decimal';
    const { numberFormat } = this.currentLanguage;

    try {
      if (format === 'currency' && this.currentLanguage.currency) {
        return new Intl.NumberFormat(this.currentLanguage.code, {
          style: 'currency',
          currency: this.currentLanguage.currency.code,
          minimumFractionDigits: options?.minimumFractionDigits || this.currentLanguage.currency.decimalDigits,
          maximumFractionDigits: options?.maximumFractionDigits || this.currentLanguage.currency.decimalDigits
        }).format(number);
      }

      return new Intl.NumberFormat(this.currentLanguage.code, {
        style: format,
        minimumFractionDigits: options?.minimumFractionDigits,
        maximumFractionDigits: options?.maximumFractionDigits
      }).format(number);
    } catch {
      return number.toString();
    }
  }

  /**
   * Formate le temps selon la langue
   */
  formatTime(date: Date, format?: string): string {
    if (!this.currentLanguage) {
      return date.toLocaleTimeString();
    }

    const timeFormat = format || this.currentLanguage.timeFormat;
    const options: Intl.DateTimeFormatOptions = {};

    // Parser le format de temps
    if (timeFormat.includes('HH')) options.hour = '2-digit';
    if (timeFormat.includes('mm')) options.minute = '2-digit';
    if (timeFormat.includes('ss')) options.second = '2-digit';

    try {
      return new Intl.DateTimeFormat(this.currentLanguage.code, options).format(date);
    } catch {
      return date.toLocaleTimeString();
    }
  }

  /**
   * Détecte automatiquement la langue de l'utilisateur
   */
  async detectLanguage(): Promise<Language | null> {
    try {
      // Langue du navigateur
      const browserLanguage = navigator.language || (navigator as any).userLanguage;
      if (browserLanguage) {
        const languageCode = browserLanguage.split('-')[0];
        const languages = await this.getLanguages();
        const language = languages.find(lang => lang.code === languageCode);
        
        if (language) {
          return language;
        }
      }

      // Langue du système
      const systemLanguage = (navigator as any).systemLanguage;
      if (systemLanguage) {
        const languageCode = systemLanguage.split('-')[0];
        const languages = await this.getLanguages();
        const language = languages.find(lang => lang.code === languageCode);
        
        if (language) {
          return language;
        }
      }

      return null;

    } catch (error) {
      console.error('❌ Erreur détection langue:', error);
      return null;
    }
  }

  /**
   * Met à jour les attributs HTML pour la langue
   */
  private updateHTMLAttributes(language: Language): void {
    const html = document.documentElement;
    
    // Attribut lang
    html.lang = language.code;
    
    // Direction RTL/LTR
    html.dir = language.rtl ? 'rtl' : 'ltr';
    
    // Meta tags
    this.updateMetaTags(language);
  }

  /**
   * Met à jour les meta tags pour la langue
   */
  private updateMetaTags(language: Language): void {
    // Meta tag pour la langue
    let metaLang = document.querySelector('meta[name="language"]') as HTMLMetaElement;
    if (!metaLang) {
      metaLang = document.createElement('meta');
      metaLang.name = 'language';
      document.head.appendChild(metaLang);
    }
    metaLang.content = language.code;

    // Meta tag pour la direction
    let metaDir = document.querySelector('meta[name="direction"]') as HTMLMetaElement;
    if (!metaDir) {
      metaDir = document.createElement('meta');
      metaDir.name = 'direction';
      document.head.appendChild(metaDir);
    }
    metaDir.content = language.rtl ? 'rtl' : 'ltr';
  }

  /**
   * Récupère une langue par ID
   */
  async getLanguageById(languageId: string): Promise<Language | null> {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('id', languageId)
        .single();

      if (error) throw error;
      return data ? this.mapLanguageFromDB(data) : null;

    } catch (error) {
      console.error('❌ Erreur récupération langue par ID:', error);
      return null;
    }
  }

  /**
   * Met à jour les préférences utilisateur
   */
  async updateUserPreference(userId: string, updates: Partial<UserLanguagePreference>): Promise<UserLanguagePreference> {
    try {
      const { data, error } = await supabase
        .from('user_language_preferences')
        .upsert({
          user_id: userId,
          language_id: updates.languageId,
          is_primary: updates.isPrimary ?? true,
          fallback_language_id: updates.fallbackLanguageId,
          auto_detect: updates.autoDetect ?? false,
          date_format: updates.dateFormat,
          time_format: updates.timeFormat,
          number_format: updates.numberFormat,
          timezone: updates.timezone,
          custom_translations: updates.customTranslations || {},
          last_used_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de mettre à jour les préférences');

      const preference = this.mapUserPreferenceFromDB(data);
      this.userPreference = preference;
      return preference;

    } catch (error) {
      console.error('❌ Erreur mise à jour préférences langue:', error);
      throw new Error(`Échec de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les préférences utilisateur
   */
  async getUserPreference(userId: string): Promise<UserLanguagePreference | null> {
    try {
      const { data, error } = await supabase
        .from('user_language_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data ? this.mapUserPreferenceFromDB(data) : null;

    } catch (error) {
      console.error('❌ Erreur récupération préférences utilisateur:', error);
      return null;
    }
  }

  /**
   * Ajoute un callback de changement de langue
   */
  onLanguageChange(callback: (language: Language) => void): void {
    this.languageChangeCallbacks.push(callback);
  }

  /**
   * Notifie les callbacks de changement de langue
   */
  private notifyLanguageChange(language: Language): void {
    this.languageChangeCallbacks.forEach(callback => {
      try {
        callback(language);
      } catch (error) {
        console.error('❌ Erreur callback langue:', error);
      }
    });
  }

  /**
   * Obtient les statistiques i18n
   */
  async getI18nStats(): Promise<I18nStats> {
    try {
      const { data, error } = await supabase.rpc('get_i18n_stats');

      if (error) throw error;

      const stats = data || {
        total_languages: 0,
        active_languages: 0,
        total_translations: 0,
        verified_translations: 0,
        auto_translations: 0,
        completion_by_language: {},
        usage_by_language: {},
        top_translations: [],
        user_preferences: {
          total_users: 0,
          auto_detect_enabled: 0,
          custom_translations: 0
        },
        quality_metrics: {
          average_confidence: 0,
          verification_rate: 0,
          error_rate: 0
        }
      };

      return {
        totalLanguages: stats.total_languages,
        activeLanguages: stats.active_languages,
        totalTranslations: stats.total_translations,
        verifiedTranslations: stats.verified_translations,
        autoTranslations: stats.auto_translations,
        completionByLanguage: stats.completion_by_language,
        usageByLanguage: stats.usage_by_language,
        topTranslations: stats.top_translations,
        userPreferences: stats.user_preferences,
        qualityMetrics: stats.quality_metrics
      };

    } catch (error) {
      console.error('❌ Erreur statistiques i18n:', error);
      throw new Error(`Échec des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Nettoie le cache de traductions
   */
  clearCache(): void {
    this.translationCache.clear();
  }

  /**
   * Obtient la langue courante
   */
  getCurrentLanguage(): Language | null {
    return this.currentLanguage;
  }

  // Mappeurs depuis la base de données
  private mapLanguageFromDB(data: any): Language {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      displayName: data.display_name,
      nativeName: data.native_name,
      flag: data.flag,
      rtl: data.rtl,
      isActive: data.is_active,
      isDefault: data.is_default,
      region: data.region,
      dateFormat: data.date_format,
      timeFormat: data.time_format,
      numberFormat: data.number_format,
      currency: data.currency,
      pluralRules: data.plural_rules || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      usageCount: data.usage_count,
      completionRate: data.completion_rate
    };
  }

  private mapUserPreferenceFromDB(data: any): UserLanguagePreference {
    return {
      id: data.id,
      userId: data.user_id,
      languageId: data.language_id,
      isPrimary: data.is_primary,
      fallbackLanguageId: data.fallback_language_id,
      autoDetect: data.auto_detect,
      dateFormat: data.date_format,
      timeFormat: data.time_format,
      numberFormat: data.number_format,
      timezone: data.timezone,
      customTranslations: data.custom_translations || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastUsedAt: data.last_used_at
    };
  }
}

// Instance singleton
export const i18nService = new I18nService();

// Export des fonctions utilitaires
export const getLanguages = () => i18nService.getLanguages();
export const setLanguage = (languageId: string, userId?: string) => i18nService.setLanguage(languageId, userId);
export const setLanguageByCode = (code: string, userId?: string) => i18nService.setLanguageByCode(code, userId);
export const translate = (
  key: string, 
  options?: {
    count?: number;
    variables?: Record<string, any>;
    defaultValue?: string;
    context?: string;
  }
) => i18nService.translate(key, options);

export const formatDate = (date: Date, format?: string) => i18nService.formatDate(date, format);
export const formatTime = (date: Date, format?: string) => i18nService.formatTime(date, format);
export const formatNumber = (
  number: number, 
  options?: {
    style?: 'decimal' | 'currency' | 'percent';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
) => i18nService.formatNumber(number, options);

export const detectLanguage = () => i18nService.detectLanguage();
export const getCurrentLanguage = () => i18nService.getCurrentLanguage();
export const onLanguageChange = (callback: (language: Language) => void) => i18nService.onLanguageChange(callback);
export const getUserLanguagePreference = (userId: string) => i18nService.getUserPreference(userId);
export const updateUserLanguagePreference = (userId: string, updates: Partial<UserLanguagePreference>) => 
  i18nService.updateUserPreference(userId, updates);

export const getI18nStats = () => i18nService.getI18nStats();
