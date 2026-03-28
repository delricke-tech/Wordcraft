/**
 * Service de thèmes avancés (mode sombre et personnalisés)
 * 
 * Ce service gère les thèmes personnalisés, le mode sombre/clair,
 * les couleurs personnalisées et les préférences visuelles
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface Theme {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  type: ThemeType;
  isSystem: boolean;
  isDefault: boolean;
  isActive: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  shadows: ThemeShadows;
  borders: ThemeBorders;
  animations: ThemeAnimations;
  customCSS?: string;
  variables: ThemeVariables;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  usageCount: number;
  rating: number;
  tags: string[];
}

export type ThemeType = 'light' | 'dark' | 'auto' | 'custom';

export interface ThemeColors {
  // Couleurs principales
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryContrast: string;
  
  // Couleurs secondaires
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  secondaryContrast: string;
  
  // Couleurs de fond
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  backgroundInverse: string;
  
  // Couleurs de surface
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  surfaceInverse: string;
  
  // Couleurs de texte
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  textOnPrimary: string;
  textOnSecondary: string;
  textOnSurface: string;
  
  // Couleurs de bordure
  border: string;
  borderSecondary: string;
  borderTertiary: string;
  borderInverse: string;
  
  // Couleurs d'état
  success: string;
  successHover: string;
  successActive: string;
  successContrast: string;
  
  warning: string;
  warningHover: string;
  warningActive: string;
  warningContrast: string;
  
  error: string;
  errorHover: string;
  errorActive: string;
  errorContrast: string;
  
  info: string;
  infoHover: string;
  infoActive: string;
  infoContrast: string;
  
  // Couleurs neutres
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
  gray950: string;
}

export interface ThemeTypography {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
  };
  fontWeight: {
    thin: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface ThemeSpacing {
  // Echelle d'espacement
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  
  // Espacements spécifiques
  container: string;
  section: string;
  card: string;
  button: string;
  input: string;
  modal: string;
}

export interface ThemeShadows {
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  outline: string;
  none: string;
  colored: Record<string, string>;
}

export interface ThemeBorders {
  none: string;
  thin: string;
  base: string;
  thick: string;
  rounded: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
}

export interface ThemeAnimations {
  // Durées
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  
  // Fonctions de timing
  easing: {
    linear: string;
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
  
  // Animations prédéfinies
  spin: string;
  bounce: string;
  pulse: string;
  shake: string;
  fadeIn: string;
  slideUp: string;
  slideDown: string;
  slideLeft: string;
  slideRight: string;
}

export interface ThemeVariables {
  // Variables CSS personnalisées
  custom: Record<string, string>;
  
  // Variables de média
  media: {
    mobile: string;
    tablet: string;
    desktop: string;
    wide: string;
  };
  
  // Variables d'accessibilité
  accessibility: {
    reducedMotion: string;
    highContrast: string;
    largeText: string;
  };
}

export interface UserThemePreference {
  id: string;
  userId: string;
  themeId: string;
  autoSwitch: boolean;
  scheduleEnabled: boolean;
  schedule: ThemeSchedule;
  customizations: ThemeCustomizations;
  accessibility: AccessibilitySettings;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string;
}

export interface ThemeSchedule {
  lightStart: string; // HH:MM
  lightEnd: string;   // HH:MM
  timezone: string;
  exceptions: ScheduleException[];
}

export interface ScheduleException {
  date: string; // YYYY-MM-DD
  forceTheme: 'light' | 'dark';
  reason?: string;
}

export interface ThemeCustomizations {
  colorOverrides: Partial<ThemeColors>;
  fontOverrides: Partial<ThemeTypography>;
  spacingOverrides: Partial<ThemeSpacing>;
  shadowOverrides: Partial<ThemeShadows>;
  borderOverrides: Partial<ThemeBorders>;
  customVariables: Record<string, string>;
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  customCSS: string;
  colorBlindness: ColorBlindnessType;
  fontSize: number; // 1.0 - 2.0
  lineHeight: number; // 1.0 - 2.0
}

export type ColorBlindnessType = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface ThemeStats {
  totalThemes: number;
  activeThemes: number;
  systemThemes: number;
  customThemes: number;
  usageByType: Record<ThemeType, number>;
  topThemes: Array<{ themeId: string; themeName: string; usageCount: number }>;
  userPreferences: {
    totalUsers: number;
    autoSwitchEnabled: number;
    scheduleEnabled: number;
    accessibilityEnabled: number;
  };
  customizations: {
    colorCustomizations: number;
    fontCustomizations: number;
    accessibilityCustomizations: number;
  };
}

class ThemeService {
  public currentTheme: Theme | null = null;
  private userPreference: UserThemePreference | null = null;
  private mediaQuery: MediaQueryList | null = null;
  private themeChangeCallbacks: Array<(theme: Theme) => void> = [];
  private boundMediaQueryHandler: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null = null;

  constructor() {
    this.initializeThemeDetection();
  }

  /**
   * Initialise la détection du thème système
   */
  private initializeThemeDetection(): void {
    if (typeof window !== 'undefined') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.boundMediaQueryHandler = this.handleSystemThemeChange.bind(this) as any;
      this.mediaQuery.addEventListener('change', this.boundMediaQueryHandler);
    }
  }

  /**
   * Gère les changements de thème système
   */
  private handleSystemThemeChange(): void {
    if (this.userPreference?.autoSwitch) {
      this.applyAutoTheme();
    }
  }

  destroy(): void {
    if (this.mediaQuery && this.boundMediaQueryHandler) {
      this.mediaQuery.removeEventListener('change', this.boundMediaQueryHandler);
    }
    this.boundMediaQueryHandler = null;
    this.mediaQuery = null;
    this.themeChangeCallbacks = [];
    this.currentTheme = null;
    this.userPreference = null;
  }

  /**
   * Crée un nouveau thème
   */
  async createTheme(theme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating'>): Promise<Theme> {
    try {
      const { data, error } = await supabase
        .from('themes')
        .insert({
          name: theme.name,
          display_name: theme.displayName,
          description: theme.description,
          type: theme.type,
          is_system: theme.isSystem,
          is_default: theme.isDefault,
          is_active: theme.isActive,
          colors: theme.colors,
          typography: theme.typography,
          spacing: theme.spacing,
          shadows: theme.shadows,
          borders: theme.borders,
          animations: theme.animations,
          custom_css: theme.customCSS,
          variables: theme.variables,
          created_by: theme.createdBy,
          usage_count: 0,
          rating: 0,
          tags: theme.tags || []
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer le thème');

      console.log('🎨 Thème créé:', data.name);
      return this.mapThemeFromDB(data);

    } catch (error) {
      console.error('❌ Erreur création thème:', error);
      throw new Error(`Échec de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère tous les thèmes
   */
  async getThemes(options: {
    type?: ThemeType;
    includeInactive?: boolean;
    includeSystem?: boolean;
    tags?: string[];
    limit?: number;
  } = {}): Promise<Theme[]> {
    try {
      let query = supabase
        .from('themes')
        .select('*');

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (!options.includeInactive) {
        query = query.eq('is_active', true);
      }

      if (!options.includeSystem) {
        query = query.eq('is_system', false);
      }

      if (options.tags && options.tags.length > 0) {
        query = query.contains('tags', options.tags);
      }

      query = query.order('is_default', { ascending: false })
               .order('usage_count', { ascending: false })
               .order('rating', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(this.mapThemeFromDB);

    } catch (error) {
      console.error('❌ Erreur récupération thèmes:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Applique un thème
   */
  async applyTheme(themeId: string, userId?: string): Promise<void> {
    try {
      // Récupérer le thème
      const theme = await this.getThemeById(themeId);
      if (!theme) {
        throw new Error('Thème non trouvé');
      }

      // Mettre à jour les préférences utilisateur
      if (userId) {
        await this.updateUserPreference(userId, { themeId });
      }

      // Appliquer le thème
      this.applyThemeToDOM(theme);

      // Mettre à jour le thème courant
      this.currentTheme = theme;

      // Notifier les callbacks
      this.notifyThemeChange(theme);

      console.log('🎨 Thème appliqué:', theme.displayName);

    } catch (error) {
      console.error('❌ Erreur application thème:', error);
      throw new Error(`Échec de l'application: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Applique le thème automatiquement selon les préférences
   */
  async applyAutoTheme(userId?: string): Promise<void> {
    try {
      if (!userId) {
        // Utiliser le thème système par défaut
        const systemTheme = await this.getSystemTheme();
        this.applyThemeToDOM(systemTheme);
        this.currentTheme = systemTheme;
        return;
      }

      const preference = await this.getUserPreference(userId);
      if (!preference || !preference.autoSwitch) {
        return;
      }

      const currentHour = new Date().getHours();
      const schedule = preference.schedule;

      // Extraire les heures de début et de fin
      const [startHour, startMinute] = schedule.lightStart.split(':').map(Number);
      const [endHour, endMinute] = schedule.lightEnd.split(':').map(Number);
      const currentTime = currentHour * 60 + new Date().getMinutes();
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      // Vérifier les exceptions
      const today = new Date().toISOString().split('T')[0];
      const exception = schedule.exceptions.find(e => e.date === today);
      
      let targetTheme: ThemeType;
      if (exception) {
        targetTheme = exception.forceTheme;
      } else if (currentTime >= startTime && currentTime <= endTime) {
        targetTheme = 'light';
      } else {
        targetTheme = 'dark';
      }

      // Appliquer le thème correspondant
      const theme = await this.getThemeByType(targetTheme);
      if (theme) {
        this.applyThemeToDOM(theme);
        this.currentTheme = theme;
      }

    } catch (error) {
      console.error('❌ Erreur application thème auto:', error);
    }
  }

  /**
   * Applique le thème système
   */
  async applySystemTheme(): Promise<void> {
    try {
      const theme = await this.getSystemTheme();
      this.applyThemeToDOM(theme);
      this.currentTheme = theme;
      this.notifyThemeChange(theme);

    } catch (error) {
      console.error('❌ Erreur application thème système:', error);
    }
  }

  /**
   * Récupère le thème système
   */
  async getSystemTheme(): Promise<Theme> {
    const isDark = this.mediaQuery?.matches || false;
    const themeType = isDark ? 'dark' : 'light';
    
    const theme = await this.getThemeByType(themeType);
    return theme || this.getDefaultTheme();
  }

  /**
   * Récupère un thème par ID
   */
  async getThemeById(themeId: string): Promise<Theme | null> {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('id', themeId)
        .single();

      if (error) throw error;
      return data ? this.mapThemeFromDB(data) : null;

    } catch (error) {
      console.error('❌ Erreur récupération thème par ID:', error);
      return null;
    }
  }

  /**
   * Récupère un thème par type
   */
  async getThemeByType(type: ThemeType): Promise<Theme | null> {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data ? this.mapThemeFromDB(data) : null;

    } catch (error) {
      console.error('❌ Erreur récupération thème par type:', error);
      return null;
    }
  }

  /**
   * Récupère le thème par défaut
   */
  async getDefaultTheme(): Promise<Theme> {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error) throw error;
      if (!data) {
        throw new Error('Aucun thème par défaut trouvé');
      }

      return this.mapThemeFromDB(data);

    } catch (error) {
      console.error('❌ Erreur récupération thème par défaut:', error);
      return this.createDefaultTheme();
    }
  }

  /**
   * Crée le thème par défaut
   */
  private async createDefaultTheme(): Promise<Theme> {
    const defaultTheme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating'> = {
      name: 'default-light',
      displayName: 'Clair par défaut',
      description: 'Thème clair par défaut',
      type: 'light',
      isSystem: true,
      isDefault: true,
      isActive: true,
      colors: this.getDefaultLightColors(),
      typography: this.getDefaultTypography(),
      spacing: this.getDefaultSpacing(),
      shadows: this.getDefaultShadows(),
      borders: this.getDefaultBorders(),
      animations: this.getDefaultAnimations(),
      variables: this.getDefaultVariables(),
      tags: ['default', 'light']
    };

    return await this.createTheme(defaultTheme);
  }

  /**
   * Met à jour les préférences utilisateur
   */
  async updateUserPreference(userId: string, updates: Partial<UserThemePreference>): Promise<UserThemePreference> {
    try {
      const { data, error } = await supabase
        .from('user_theme_preferences')
        .upsert({
          user_id: userId,
          theme_id: updates.themeId,
          auto_switch: updates.autoSwitch ?? false,
          schedule_enabled: updates.scheduleEnabled ?? false,
          schedule: updates.schedule || this.getDefaultSchedule(),
          customizations: updates.customizations || {},
          accessibility: updates.accessibility || this.getDefaultAccessibility(),
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
      console.error('❌ Erreur mise à jour préférences:', error);
      throw new Error(`Échec de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les préférences utilisateur
   */
  async getUserPreference(userId: string): Promise<UserThemePreference | null> {
    try {
      const { data, error } = await supabase
        .from('user_theme_preferences')
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
   * Applique le thème au DOM
   */
  private applyThemeToDOM(theme: Theme): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    
    // Appliquer les variables CSS
    const cssVariables = this.generateCSSVariables(theme);
    root.style.cssText = cssVariables;

    // Appliquer la classe de thème
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${theme.type}`);
    
    // Appliquer les attributs d'accessibilité
    this.applyAccessibilitySettings(theme.variables.accessibility);

    // Mettre à jour le meta tag theme-color
    this.updateThemeColorMeta(theme.colors.primary);
  }

  /**
   * Génère les variables CSS pour le thème
   */
  private generateCSSVariables(theme: Theme): string {
    const variables: string[] = [];

    // Variables de couleurs
    Object.entries(theme.colors).forEach(([key, value]) => {
      variables.push(`--color-${key}: ${value};`);
    });

    // Variables de typographie
    Object.entries(theme.typography.fontFamily).forEach(([key, value]) => {
      variables.push(`--font-family-${key}: ${value.join(', ')};`);
    });

    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      variables.push(`--font-size-${key}: ${value};`);
    });

    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      variables.push(`--font-weight-${key}: ${value};`);
    });

    // Variables d'espacement
    Object.entries(theme.spacing).forEach(([key, value]) => {
      variables.push(`--spacing-${key}: ${value};`);
    });

    // Variables d'ombres
    Object.entries(theme.shadows).forEach(([key, value]) => {
      if (key !== 'colored') {
        variables.push(`--shadow-${key}: ${value};`);
      }
    });

    // Variables de bordures
    Object.entries(theme.borders.rounded).forEach(([key, value]) => {
      variables.push(`--border-radius-${key}: ${value};`);
    });

    // Variables personnalisées
    Object.entries(theme.variables.custom || {}).forEach(([key, value]) => {
      variables.push(`--${key}: ${value};`);
    });

    return variables.join('\n');
  }

  /**
   * Applique les paramètres d'accessibilité
   */
  private applyAccessibilitySettings(accessibility: ThemeVariables['accessibility']): void {
    const root = document.documentElement;

    // Mouvement réduit
    if (accessibility.reducedMotion) {
      root.style.setProperty('--motion-duration', '0s');
      root.style.setProperty('--motion-easing', 'linear');
      root.classList.add('reduced-motion');
    }

    // Contraste élevé
    if (accessibility.highContrast) {
      root.classList.add('high-contrast');
    }

    // Texte agrandi
    if (accessibility.largeText) {
      root.style.setProperty('--font-scale', '1.2');
      root.classList.add('large-text');
    }
  }

  /**
   * Met à jour le meta tag theme-color
   */
  private updateThemeColorMeta(color: string): void {
    let metaTag = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'theme-color';
      document.head.appendChild(metaTag);
    }
    
    metaTag.content = color;
  }

  /**
   * Ajoute un callback de changement de thème
   */
  onThemeChange(callback: (theme: Theme) => void): void {
    this.themeChangeCallbacks.push(callback);
  }

  /**
   * Notifie les callbacks de changement de thème
   */
  private notifyThemeChange(theme: Theme): void {
    this.themeChangeCallbacks.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('❌ Erreur callback thème:', error);
      }
    });
  }

  /**
   * Obtient les statistiques des thèmes
   */
  async getThemeStats(): Promise<ThemeStats> {
    try {
      const { data, error } = await supabase.rpc('get_theme_stats');

      if (error) throw error;

      const stats = data || {
        total_themes: 0,
        active_themes: 0,
        system_themes: 0,
        custom_themes: 0,
        usage_by_type: {},
        top_themes: [],
        user_preferences: {
          total_users: 0,
          auto_switch_enabled: 0,
          schedule_enabled: 0,
          accessibility_enabled: 0
        },
        customizations: {
          color_customizations: 0,
          font_customizations: 0,
          accessibility_customizations: 0
        }
      };

      return {
        totalThemes: stats.total_themes,
        activeThemes: stats.active_themes,
        systemThemes: stats.system_themes,
        customThemes: stats.custom_themes,
        usageByType: stats.usage_by_type,
        topThemes: stats.top_themes,
        userPreferences: stats.user_preferences,
        customizations: stats.customizations
      };

    } catch (error) {
      console.error('❌ Erreur statistiques thèmes:', error);
      throw new Error(`Échec des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Méthodes utilitaires pour les valeurs par défaut
  private getDefaultLightColors(): ThemeColors {
    return {
      primary: '#3B82F6',
      primaryHover: '#2563EB',
      primaryActive: '#1D4ED8',
      primaryContrast: '#FFFFFF',
      secondary: '#6B7280',
      secondaryHover: '#4B5563',
      secondaryActive: '#374151',
      secondaryContrast: '#FFFFFF',
      background: '#FFFFFF',
      backgroundSecondary: '#F9FAFB',
      backgroundTertiary: '#F3F4F6',
      backgroundInverse: '#111827',
      surface: '#FFFFFF',
      surfaceSecondary: '#F9FAFB',
      surfaceTertiary: '#F3F4F6',
      surfaceInverse: '#1F2937',
      text: '#111827',
      textSecondary: '#6B7280',
      textTertiary: '#9CA3AF',
      textInverse: '#F9FAFB',
      textOnPrimary: '#FFFFFF',
      textOnSecondary: '#FFFFFF',
      textOnSurface: '#111827',
      border: '#E5E7EB',
      borderSecondary: '#D1D5DB',
      borderTertiary: '#9CA3AF',
      borderInverse: '#374151',
      success: '#10B981',
      successHover: '#059669',
      successActive: '#047857',
      successContrast: '#FFFFFF',
      warning: '#F59E0B',
      warningHover: '#D97706',
      warningActive: '#B45309',
      warningContrast: '#FFFFFF',
      error: '#EF4444',
      errorHover: '#DC2626',
      errorActive: '#B91C1C',
      errorContrast: '#FFFFFF',
      info: '#3B82F6',
      infoHover: '#2563EB',
      infoActive: '#1D4ED8',
      infoContrast: '#FFFFFF',
      gray50: '#F9FAFB',
      gray100: '#F3F4F6',
      gray200: '#E5E7EB',
      gray300: '#D1D5DB',
      gray400: '#9CA3AF',
      gray500: '#6B7280',
      gray600: '#4B5563',
      gray700: '#374151',
      gray800: '#1F2937',
      gray900: '#111827',
      gray950: '#030712'
    };
  }

  private getDefaultTypography(): ThemeTypography {
    return {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace']
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem'
      },
      fontWeight: {
        thin: 100,
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75
      },
      letterSpacing: {
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em'
      }
    };
  }

  private getDefaultSpacing(): ThemeSpacing {
    return {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
      '4xl': '5rem',
      '5xl': '6rem',
      '6xl': '8rem',
      container: '75rem',
      section: '4rem',
      card: '1.5rem',
      button: '0.5rem',
      input: '0.5rem',
      modal: '1.5rem'
    };
  }

  private getDefaultShadows(): ThemeShadows {
    return {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      outline: '0 0 0 3px rgba(59, 130, 246, 0.5)',
      none: 'none',
      colored: {
        success: '0 4px 6px -1px rgba(16, 185, 129, 0.1)',
        warning: '0 4px 6px -1px rgba(245, 158, 11, 0.1)',
        error: '0 4px 6px -1px rgba(239, 68, 68, 0.1)',
        info: '0 4px 6px -1px rgba(59, 130, 246, 0.1)'
      }
    };
  }

  private getDefaultBorders(): ThemeBorders {
    return {
      none: 'none',
      thin: '1px solid',
      base: '2px solid',
      thick: '4px solid',
      rounded: {
        none: '0',
        sm: '0.125rem',
        base: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      }
    };
  }

  private getDefaultAnimations(): ThemeAnimations {
    return {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms'
      },
      easing: {
        linear: 'linear',
        ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      spin: 'spin 1s linear infinite',
      bounce: 'bounce 1s infinite',
      pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      shake: 'shake 0.5s ease-in-out infinite',
      fadeIn: 'fadeIn 0.3s ease-in-out',
      slideUp: 'slideUp 0.3s ease-out',
      slideDown: 'slideDown 0.3s ease-out',
      slideLeft: 'slideLeft 0.3s ease-out',
      slideRight: 'slideRight 0.3s ease-out'
    };
  }

  private getDefaultVariables(): ThemeVariables {
    return {
      custom: {},
      media: {
        mobile: '(max-width: 640px)',
        tablet: '(max-width: 768px)',
        desktop: '(max-width: 1024px)',
        wide: '(max-width: 1280px)'
      },
      accessibility: {
        reducedMotion: '(prefers-reduced-motion: reduce)',
        highContrast: '(prefers-contrast: high)',
        largeText: '(prefers-reduced-motion: reduce)'
      }
    };
  }

  private getDefaultSchedule(): ThemeSchedule {
    return {
      lightStart: '06:00',
      lightEnd: '20:00',
      timezone: 'Europe/Paris',
      exceptions: []
    };
  }

  private getDefaultAccessibility(): AccessibilitySettings {
    return {
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      customCSS: '',
      colorBlindness: 'normal',
      fontSize: 1.0,
      lineHeight: 1.5
    };
  }

  // Mappeurs depuis la base de données
  private mapThemeFromDB(data: any): Theme {
    return {
      id: data.id,
      name: data.name,
      displayName: data.display_name,
      description: data.description,
      type: data.type,
      isSystem: data.is_system,
      isDefault: data.is_default,
      isActive: data.is_active,
      colors: data.colors,
      typography: data.typography,
      spacing: data.spacing,
      shadows: data.shadows,
      borders: data.borders,
      animations: data.animations,
      customCSS: data.custom_css,
      variables: data.variables,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      usageCount: data.usage_count,
      rating: data.rating,
      tags: data.tags || []
    };
  }

  private mapUserPreferenceFromDB(data: any): UserThemePreference {
    return {
      id: data.id,
      userId: data.user_id,
      themeId: data.theme_id,
      autoSwitch: data.auto_switch,
      scheduleEnabled: data.schedule_enabled,
      schedule: data.schedule,
      customizations: data.customizations,
      accessibility: data.accessibility,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastUsedAt: data.last_used_at
    };
  }
}

// Instance singleton
export const themeService = new ThemeService();

// Export des fonctions utilitaires
export const createTheme = (theme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating'>) => 
  themeService.createTheme(theme);

export const getThemes = (options?: {
  type?: ThemeType;
  includeInactive?: boolean;
  includeSystem?: boolean;
  tags?: string[];
  limit?: number;
}) => themeService.getThemes(options);

export const applyTheme = (themeId: string, userId?: string) => 
  themeService.applyTheme(themeId, userId);

export const applyAutoTheme = (userId?: string) => 
  themeService.applyAutoTheme(userId);

export const applySystemTheme = () => 
  themeService.applySystemTheme();

export const getCurrentTheme = () => themeService.currentTheme;

export const getUserThemePreference = (userId: string) => 
  themeService.getUserPreference(userId);

export const updateUserThemePreference = (userId: string, updates: Partial<UserThemePreference>) => 
  themeService.updateUserPreference(userId, updates);

export const onThemeChange = (callback: (theme: Theme) => void) => 
  themeService.onThemeChange(callback);

export const getThemeStats = () => 
  themeService.getThemeStats();
