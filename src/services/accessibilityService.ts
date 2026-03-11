/**
 * Service d'accessibilité avancée (screen readers)
 * 
 * Ce service gère l'accessibilité avancée, le support des lecteurs d'écran,
 * les commandes vocales, la navigation au clavier et l'adaptation UI
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface AccessibilityProfile {
  id: string;
  userId: string;
  name: string;
  description?: string;
  settings: AccessibilitySettings;
  preferences: UserPreferences;
  customizations: CustomAccessibilitySettings;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccessibilitySettings {
  screenReader: ScreenReaderSettings;
  keyboardNavigation: KeyboardNavigationSettings;
  visualAids: VisualAidSettings;
  voiceCommands: VoiceCommandSettings;
  colorBlindness: ColorBlindnessSettings;
  motorAssistance: MotorAssistanceSettings;
  cognitiveAssistance: CognitiveAssistanceSettings;
}

export interface ScreenReaderSettings {
  enabled: boolean;
  voice: VoiceSettings;
  readingSpeed: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 2.0
  volume: number; // 0 - 1
  language: string;
  announceFocus: boolean;
  announceChanges: boolean;
  announceErrors: boolean;
  readingMode: ReadingMode;
  punctuationLevel: PunctuationLevel;
}

export interface VoiceSettings {
  name: string;
  gender: 'male' | 'female' | 'neutral';
  accent: string;
  age: 'young' | 'adult' | 'elderly';
}

export type ReadingMode = 'word' | 'sentence' | 'paragraph' | 'continuous';
export type PunctuationLevel = 'none' | 'some' | 'all';

export interface KeyboardNavigationSettings {
  enabled: boolean;
  skipLinks: boolean;
  focusIndicators: FocusIndicatorSettings;
  shortcuts: KeyboardShortcut[];
  tabNavigation: TabNavigationSettings;
  ariaLabels: boolean;
  landmarks: boolean;
  headings: boolean;
}

export interface FocusIndicatorSettings {
  style: 'outline' | 'background' | 'border' | 'glow';
  color: string;
  width: number;
  animated: boolean;
  highContrast: boolean;
}

export interface TabNavigationSettings {
  wrapAround: boolean;
  trapFocus: boolean;
  skipToContent: boolean;
  visualFocusOrder: boolean;
}

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  keys: string[];
  category: ShortcutCategory;
  action: string;
  isEnabled: boolean;
  isGlobal: boolean;
}

export type ShortcutCategory = 
  | 'navigation'
  | 'reading'
  | 'interaction'
  | 'media'
  | 'forms'
  | 'search'
  | 'custom';

export interface VisualAidSettings {
  highContrast: boolean;
  largeText: boolean;
  zoomLevel: number; // 1.0 - 3.0
  cursorSize: CursorSize;
  cursorColor: string;
  linkUnderlines: boolean;
  buttonOutlines: boolean;
  spacing: SpacingSettings;
  animations: AnimationSettings;
}

export type CursorSize = 'small' | 'medium' | 'large' | 'extra-large';

export interface SpacingSettings {
  letterSpacing: number;
  wordSpacing: number;
  lineHeight: number;
  paragraphSpacing: number;
}

export interface AnimationSettings {
  enabled: boolean;
  reducedMotion: boolean;
  duration: number; // en secondes
  easing: string;
}

export interface VoiceCommandSettings {
  enabled: boolean;
  language: string;
  sensitivity: number; // 0.1 - 1.0
  commands: VoiceCommand[];
  wakeWord: string;
  continuous: boolean;
  feedback: VoiceFeedbackSettings;
}

export interface VoiceCommand {
  id: string;
  phrase: string;
  action: string;
  parameters?: Record<string, any>;
  confidence: number;
  isEnabled: boolean;
}

export interface VoiceFeedbackSettings {
  enabled: boolean;
  voice: VoiceSettings;
  volume: number;
  successSound: boolean;
  errorSound: boolean;
}

export interface ColorBlindnessSettings {
  enabled: boolean;
  type: ColorBlindnessType;
  intensity: number; // 0 - 1
  customFilters: ColorFilter[];
  simulator: boolean;
}

export type ColorBlindnessType = 
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia'
  | 'custom';

export interface ColorFilter {
  name: string;
  type: ColorBlindnessType;
  matrix: number[][];
  intensity: number;
}

export interface MotorAssistanceSettings {
  stickyKeys: boolean;
  filterKeys: boolean;
  toggleKeys: boolean;
  mouseKeys: boolean;
  delay: number; // en millisecondes
  clickAssist: boolean;
  dwellTime: number; // en millisecondes
  gestureControl: boolean;
}

export interface CognitiveAssistanceSettings {
  simplifiedUI: boolean;
  readingGuide: boolean;
  wordHighlighting: boolean;
  sentenceHighlighting: boolean;
  dyslexiaFont: boolean;
  iconsOnly: boolean;
  stepByStep: boolean;
  reminders: boolean;
}

export interface UserPreferences {
  autoDetect: boolean;
  rememberSettings: boolean;
  profileSwitching: boolean;
  notifications: NotificationSettings;
  analytics: AnalyticsSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  screenReaderAnnouncements: boolean;
  visualAlerts: boolean;
  soundAlerts: boolean;
  vibrationAlerts: boolean;
}

export interface AnalyticsSettings {
  enabled: boolean;
  shareUsageData: boolean;
  trackInteractions: boolean;
  trackErrors: boolean;
}

export interface PrivacySettings {
  shareProfile: boolean;
  shareSettings: boolean;
  shareUsageStats: boolean;
  anonymizeData: boolean;
}

export interface CustomAccessibilitySettings {
  cssOverrides: string;
  javascriptExtensions: string[];
  customCommands: CustomCommand[];
  userStyles: UserStyle[];
  thirdPartyIntegrations: ThirdPartyIntegration[];
}

export interface CustomCommand {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  parameters: Record<string, any>;
}

export interface UserStyle {
  id: string;
  name: string;
  css: string;
  enabled: boolean;
}

export interface ThirdPartyIntegration {
  id: string;
  name: string;
  type: 'screen_reader' | 'voice_recognition' | 'switch_device' | 'braille_display';
  enabled: boolean;
  configuration: Record<string, any>;
}

export interface AccessibilityStats {
  totalUsers: number;
  activeProfiles: number;
  profilesByType: Record<string, number>;
  featureUsage: {
    screenReader: number;
    keyboardNavigation: number;
    voiceCommands: number;
    visualAids: number;
    colorBlindness: number;
    motorAssistance: number;
    cognitiveAssistance: number;
  };
  deviceSupport: {
    screenReaders: Record<string, number>;
    voiceRecognition: Record<string, number>;
    brailleDisplays: number;
    switchDevices: number;
  };
  userSatisfaction: {
    overall: number;
    easeOfUse: number;
    effectiveness: number;
    support: number;
  };
  performance: {
    averageLoadTime: number;
    errorRate: number;
    successRate: number;
    userRetention: number;
  };
}

class AccessibilityService {
  private currentProfile: AccessibilityProfile | null = null;
  private screenReader: ScreenReaderManager;
  private keyboardNavigation: KeyboardNavigationManager;
  private voiceCommands: VoiceCommandManager;
  private visualAids: VisualAidManager;
  private eventCallbacks: Map<string, (event: any) => void> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.screenReader = new ScreenReaderManager();
    this.keyboardNavigation = new KeyboardNavigationManager();
    this.voiceCommands = new VoiceCommandManager();
    this.visualAids = new VisualAidManager();
    this.initializeService();
  }

  /**
   * Initialise le service d'accessibilité
   */
  private async initializeService(): Promise<void> {
    try {
      // Détecter automatiquement les préférences
      await this.detectUserPreferences();

      // Charger le profil par défaut
      await this.loadDefaultProfile();

      // Initialiser les managers
      await this.initializeManagers();

      // Démarrer le monitoring
      this.startMonitoring();

      this.isInitialized = true;
      console.log('♿ Service d\'accessibilité initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation service accessibilité:', error);
    }
  }

  /**
   * Détecte les préférences utilisateur
   */
  private async detectUserPreferences(): Promise<void> {
    try {
      const preferences = {
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
        prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        systemFontSize: getComputedStyle(document.documentElement).fontSize,
        systemLanguage: navigator.language,
        hasTouchScreen: 'ontouchstart' in window,
        hasScreenReader: this.detectScreenReader(),
        hasKeyboardNavigation: this.detectKeyboardNavigation()
      };

      console.log('♿ Préférences détectées:', preferences);
      this.emit('preferences_detected', preferences);

    } catch (error) {
      console.error('❌ Erreur détection préférences:', error);
    }
  }

  /**
   * Détecte si un lecteur d'écran est utilisé
   */
  private detectScreenReader(): boolean {
    // Techniques de détection de lecteurs d'écran
    const indicators = [
      navigator.userAgent.includes('NVDA'),
      navigator.userAgent.includes('JAWS'),
      navigator.userAgent.includes('VoiceOver'),
      navigator.userAgent.includes('TalkBack'),
      window.speechSynthesis !== undefined,
      'aria-live' in document.documentElement,
      'role' in document.documentElement
    ];

    return indicators.some(indicator => indicator);
  }

  /**
   * Détecte si la navigation au clavier est utilisée
   */
  private detectKeyboardNavigation(): boolean {
    let keyboardUsage = false;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
        keyboardUsage = true;
        document.removeEventListener('keydown', handleKeyDown);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Nettoyer après 5 secondes
    setTimeout(() => {
      document.removeEventListener('keydown', handleKeyDown);
    }, 5000);

    return keyboardUsage;
  }

  /**
   * Charge le profil par défaut
   */
  private async loadDefaultProfile(): Promise<void> {
    try {
      const defaultProfile: AccessibilityProfile = {
        id: 'default',
        userId: 'system',
        name: 'Default',
        settings: this.createDefaultSettings(),
        preferences: this.createDefaultPreferences(),
        customizations: this.createDefaultCustomizations(),
        isActive: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.currentProfile = defaultProfile;
      console.log('♿ Profil par défaut chargé');

    } catch (error) {
      console.error('❌ Erreur chargement profil par défaut:', error);
    }
  }

  /**
   * Crée les réglages par défaut
   */
  private createDefaultSettings(): AccessibilitySettings {
    return {
      screenReader: {
        enabled: false,
        voice: {
          name: 'Default',
          gender: 'neutral',
          accent: 'en-US',
          age: 'adult'
        },
        readingSpeed: 1.0,
        pitch: 1.0,
        volume: 0.8,
        language: navigator.language || 'en-US',
        announceFocus: true,
        announceChanges: true,
        announceErrors: true,
        readingMode: 'continuous',
        punctuationLevel: 'some'
      },
      keyboardNavigation: {
        enabled: true,
        skipLinks: true,
        focusIndicators: {
          style: 'outline',
          color: '#0066cc',
          width: 2,
          animated: true,
          highContrast: false
        },
        shortcuts: this.createDefaultShortcuts(),
        tabNavigation: {
          wrapAround: true,
          trapFocus: true,
          skipToContent: true,
          visualFocusOrder: true
        },
        ariaLabels: true,
        landmarks: true,
        headings: true
      },
      visualAids: {
        highContrast: false,
        largeText: false,
        zoomLevel: 1.0,
        cursorSize: 'medium',
        cursorColor: '#000000',
        linkUnderlines: true,
        buttonOutlines: false,
        spacing: {
          letterSpacing: 0,
          wordSpacing: 0,
          lineHeight: 1.5,
          paragraphSpacing: 1.0
        },
        animations: {
          enabled: true,
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          duration: 0.3,
          easing: 'ease-in-out'
        }
      },
      voiceCommands: {
        enabled: false,
        language: navigator.language || 'en-US',
        sensitivity: 0.7,
        commands: this.createDefaultVoiceCommands(),
        wakeWord: 'computer',
        continuous: false,
        feedback: {
          enabled: true,
          voice: {
            name: 'Default',
            gender: 'neutral',
            accent: 'en-US',
            age: 'adult'
          },
          volume: 0.6,
          successSound: true,
          errorSound: true
        }
      },
      colorBlindness: {
        enabled: false,
        type: 'protanopia',
        intensity: 0.5,
        customFilters: [],
        simulator: false
      },
      motorAssistance: {
        stickyKeys: false,
        filterKeys: false,
        toggleKeys: false,
        mouseKeys: false,
        delay: 500,
        clickAssist: false,
        dwellTime: 1000,
        gestureControl: false
      },
      cognitiveAssistance: {
        simplifiedUI: false,
        readingGuide: false,
        wordHighlighting: false,
        sentenceHighlighting: false,
        dyslexiaFont: false,
        iconsOnly: false,
        stepByStep: false,
        reminders: false
      }
    };
  }

  /**
   * Crée les préférences par défaut
   */
  private createDefaultPreferences(): UserPreferences {
    return {
      autoDetect: true,
      rememberSettings: true,
      profileSwitching: true,
      notifications: {
        screenReaderAnnouncements: true,
        visualAlerts: true,
        soundAlerts: false,
        vibrationAlerts: false
      },
      analytics: {
        enabled: true,
        shareUsageData: false,
        trackInteractions: true,
        trackErrors: true
      },
      privacy: {
        shareProfile: false,
        shareSettings: false,
        shareUsageStats: false,
        anonymizeData: true
      }
    };
  }

  /**
   * Crée les personnalisations par défaut
   */
  private createDefaultCustomizations(): CustomAccessibilitySettings {
    return {
      cssOverrides: '',
      javascriptExtensions: [],
      customCommands: [],
      userStyles: [],
      thirdPartyIntegrations: []
    };
  }

  /**
   * Crée les raccourcis clavier par défaut
   */
  private createDefaultShortcuts(): KeyboardShortcut[] {
    return [
      {
        id: 'skip_to_main',
        name: 'Skip to main content',
        description: 'Jump directly to main content',
        keys: ['Alt', 'M'],
        category: 'navigation',
        action: 'skip_to_main',
        isEnabled: true,
        isGlobal: true
      },
      {
        id: 'skip_to_navigation',
        name: 'Skip to navigation',
        description: 'Jump to navigation menu',
        keys: ['Alt', 'N'],
        category: 'navigation',
        action: 'skip_to_navigation',
        isEnabled: true,
        isGlobal: true
      },
      {
        id: 'toggle_screen_reader',
        name: 'Toggle screen reader',
        description: 'Enable/disable screen reader',
        keys: ['Alt', 'S'],
        category: 'reading',
        action: 'toggle_screen_reader',
        isEnabled: true,
        isGlobal: true
      },
      {
        id: 'increase_font_size',
        name: 'Increase font size',
        description: 'Make text larger',
        keys: ['Alt', 'Plus'],
        category: 'visual',
        action: 'increase_font_size',
        isEnabled: true,
        isGlobal: true
      },
      {
        id: 'decrease_font_size',
        name: 'Decrease font size',
        description: 'Make text smaller',
        keys: ['Alt', 'Minus'],
        category: 'visual',
        action: 'decrease_font_size',
        isEnabled: true,
        isGlobal: true
      },
      {
        id: 'toggle_high_contrast',
        name: 'Toggle high contrast',
        description: 'Switch to high contrast mode',
        keys: ['Alt', 'H'],
        category: 'visual',
        action: 'toggle_high_contrast',
        isEnabled: true,
        isGlobal: true
      },
      {
        id: 'toggle_voice_commands',
        name: 'Toggle voice commands',
        description: 'Enable/disable voice commands',
        keys: ['Alt', 'V'],
        category: 'interaction',
        action: 'toggle_voice_commands',
        isEnabled: true,
        isGlobal: true
      },
      {
        id: 'help_accessibility',
        name: 'Accessibility help',
        description: 'Show accessibility help',
        keys: ['Alt', 'Help'],
        category: 'custom',
        action: 'show_accessibility_help',
        isEnabled: true,
        isGlobal: true
      }
    ];
  }

  /**
   * Crée les commandes vocales par défaut
   */
  private createDefaultVoiceCommands(): VoiceCommand[] {
    return [
      {
        id: 'scroll_down',
        phrase: 'scroll down',
        action: 'scroll_down',
        confidence: 0.8,
        isEnabled: true
      },
      {
        id: 'scroll_up',
        phrase: 'scroll up',
        action: 'scroll_up',
        confidence: 0.8,
        isEnabled: true
      },
      {
        id: 'next_element',
        phrase: 'next element',
        action: 'next_focusable',
        confidence: 0.8,
        isEnabled: true
      },
      {
        id: 'previous_element',
        phrase: 'previous element',
        action: 'previous_focusable',
        confidence: 0.8,
        isEnabled: true
      },
      {
        id: 'click_element',
        phrase: 'click',
        action: 'click_current',
        confidence: 0.8,
        isEnabled: true
      },
      {
        id: 'type_text',
        phrase: 'type',
        action: 'start_typing',
        confidence: 0.8,
        isEnabled: true
      },
      {
        id: 'search',
        phrase: 'search',
        action: 'open_search',
        confidence: 0.8,
        isEnabled: true
      },
      {
        id: 'help',
        phrase: 'help',
        action: 'show_help',
        confidence: 0.8,
        isEnabled: true
      }
    ];
  }

  /**
   * Initialise les managers
   */
  private async initializeManagers(): Promise<void> {
    if (this.currentProfile) {
      await this.screenReader.initialize(this.currentProfile.settings.screenReader);
      await this.keyboardNavigation.initialize(this.currentProfile.settings.keyboardNavigation);
      await this.voiceCommands.initialize(this.currentProfile.settings.voiceCommands);
      await this.visualAids.initialize(this.currentProfile.settings.visualAids);
    }
  }

  /**
   * Active le lecteur d'écran
   */
  async enableScreenReader(settings?: Partial<ScreenReaderSettings>): Promise<void> {
    try {
      if (!this.currentProfile) return;

      const updatedSettings = { ...this.currentProfile.settings.screenReader, ...settings };
      this.currentProfile.settings.screenReader = updatedSettings;

      await this.screenReader.enable(updatedSettings);
      console.log('♿ Lecteur d\'écran activé');
      this.emit('screen_reader_enabled', updatedSettings);

    } catch (error) {
      console.error('❌ Erreur activation lecteur d\'écran:', error);
      throw error;
    }
  }

  /**
   * Désactive le lecteur d'écran
   */
  async disableScreenReader(): Promise<void> {
    try {
      if (!this.currentProfile) return;

      await this.screenReader.disable();
      this.currentProfile.settings.screenReader.enabled = false;
      
      console.log('♿ Lecteur d\'écran désactivé');
      this.emit('screen_reader_disabled', {});

    } catch (error) {
      console.error('❌ Erreur désactivation lecteur d\'écran:', error);
      throw error;
    }
  }

  /**
   * Active la navigation au clavier
   */
  async enableKeyboardNavigation(settings?: Partial<KeyboardNavigationSettings>): Promise<void> {
    try {
      if (!this.currentProfile) return;

      const updatedSettings = { ...this.currentProfile.settings.keyboardNavigation, ...settings };
      this.currentProfile.settings.keyboardNavigation = updatedSettings;

      await this.keyboardNavigation.enable(updatedSettings);
      console.log('♿ Navigation clavier activée');
      this.emit('keyboard_navigation_enabled', updatedSettings);

    } catch (error) {
      console.error('❌ Erreur activation navigation clavier:', error);
      throw error;
    }
  }

  /**
   * Active les commandes vocales
   */
  async enableVoiceCommands(settings?: Partial<VoiceCommandSettings>): Promise<void> {
    try {
      if (!this.currentProfile) return;

      const updatedSettings = { ...this.currentProfile.settings.voiceCommands, ...settings };
      this.currentProfile.settings.voiceCommands = updatedSettings;

      await this.voiceCommands.enable(updatedSettings);
      console.log('♿ Commandes vocales activées');
      this.emit('voice_commands_enabled', updatedSettings);

    } catch (error) {
      console.error('❌ Erreur activation commandes vocales:', error);
      throw error;
    }
  }

  /**
   * Active les aides visuelles
   */
  async enableVisualAids(settings?: Partial<VisualAidSettings>): Promise<void> {
    try {
      if (!this.currentProfile) return;

      const updatedSettings = { ...this.currentProfile.settings.visualAids, ...settings };
      this.currentProfile.settings.visualAids = updatedSettings;

      await this.visualAids.enable(updatedSettings);
      console.log('♿ Aides visuelles activées');
      this.emit('visual_aids_enabled', updatedSettings);

    } catch (error) {
      console.error('❌ Erreur activation aides visuelles:', error);
      throw error;
    }
  }

  /**
   * Applique un profil d'accessibilité
   */
  async applyProfile(profile: AccessibilityProfile): Promise<void> {
    try {
      this.currentProfile = profile;

      // Appliquer tous les settings
      if (profile.settings.screenReader.enabled) {
        await this.screenReader.enable(profile.settings.screenReader);
      }

      if (profile.settings.keyboardNavigation.enabled) {
        await this.keyboardNavigation.enable(profile.settings.keyboardNavigation);
      }

      if (profile.settings.voiceCommands.enabled) {
        await this.voiceCommands.enable(profile.settings.voiceCommands);
      }

      await this.visualAids.enable(profile.settings.visualAids);

      console.log('♿ Profil d\'accessibilité appliqué:', profile.name);
      this.emit('profile_applied', profile);

    } catch (error) {
      console.error('❌ Erreur application profil:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau profil d'accessibilité
   */
  async createProfile(userId: string, profile: Omit<AccessibilityProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<AccessibilityProfile> {
    try {
      const newProfile: AccessibilityProfile = {
        id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...profile
      };

      // Sauvegarder dans la base de données
      const { data, error } = await supabase
        .from('accessibility_profiles')
        .insert({
          id: newProfile.id,
          user_id: userId,
          name: newProfile.name,
          description: newProfile.description,
          settings: newProfile.settings,
          preferences: newProfile.preferences,
          customizations: newProfile.customizations,
          is_active: newProfile.isActive,
          is_default: newProfile.isDefault
        })
        .select()
        .single();

      if (error) throw error;

      console.log('♿ Profil d\'accessibilité créé:', newProfile.name);
      return newProfile;

    } catch (error) {
      console.error('❌ Erreur création profil:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques d'accessibilité
   */
  async getStats(): Promise<AccessibilityStats> {
    try {
      const { data, error } = await supabase.rpc('get_accessibility_stats');

      if (error) throw error;

      const stats = data || {
        total_users: 0,
        active_profiles: 0,
        profiles_by_type: {},
        feature_usage: {
          screenReader: 0,
          keyboardNavigation: 0,
          voiceCommands: 0,
          visualAids: 0,
          colorBlindness: 0,
          motorAssistance: 0,
          cognitiveAssistance: 0
        },
        device_support: {
          screenReaders: {},
          voiceRecognition: {},
          brailleDisplays: 0,
          switchDevices: 0
        },
        user_satisfaction: {
          overall: 0,
          easeOfUse: 0,
          effectiveness: 0,
          support: 0
        },
        performance: {
          averageLoadTime: 0,
          errorRate: 0,
          successRate: 0,
          userRetention: 0
        }
      };

      return {
        totalUsers: stats.total_users,
        activeProfiles: stats.active_profiles,
        profilesByType: stats.profiles_by_type,
        featureUsage: stats.feature_usage,
        deviceSupport: stats.device_support,
        userSatisfaction: stats.user_satisfaction,
        performance: stats.performance
      };

    } catch (error) {
      console.error('❌ Erreur statistiques accessibilité:', error);
      throw error;
    }
  }

  /**
   * Obtient le profil actuel
   */
  getCurrentProfile(): AccessibilityProfile | null {
    return this.currentProfile;
  }

  /**
   * Vérifie si le service est initialisé
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Ajoute un callback d'événement
   */
  on(event: string, callback: (event: any) => void): void {
    this.eventCallbacks.set(event, callback);
  }

  /**
   * Émet un événement
   */
  private emit(event: string, data: any): void {
    const callback = this.eventCallbacks.get(event);
    if (callback) {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Erreur callback événement:', error);
      }
    }
  }

  /**
   * Démarre le monitoring
   */
  private startMonitoring(): void {
    // Monitoring des interactions
    document.addEventListener('click', this.trackInteraction.bind(this));
    document.addEventListener('keydown', this.trackInteraction.bind(this));
    document.addEventListener('focus', this.trackInteraction.bind(this));
    
    // Monitoring des erreurs
    window.addEventListener('error', this.trackError.bind(this));
    
    // Monitoring des performances
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        this.trackPerformance(list.getEntries());
      });
      observer.observe({ entryTypes: ['navigation', 'measure', 'paint'] });
    }
  }

  /**
   * Suit les interactions utilisateur
   */
  private trackInteraction(event: Event): void {
    if (!this.currentProfile?.preferences.analytics.trackInteractions) return;

    const interaction = {
      type: event.type,
      target: (event.target as Element)?.tagName,
      timestamp: new Date().toISOString(),
      profileId: this.currentProfile.id
    };

    this.emit('interaction_tracked', interaction);
  }

  /**
   * Suit les erreurs
   */
  private trackError(event: ErrorEvent): void {
    if (!this.currentProfile?.preferences.analytics.trackErrors) return;

    const error = {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: new Date().toISOString(),
      profileId: this.currentProfile.id
    };

    this.emit('error_tracked', error);
  }

  /**
   * Suit les performances
   */
  private trackPerformance(entries: PerformanceEntry[]): void {
    const performance = {
      entries: entries.map(entry => ({
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
        timestamp: new Date().toISOString()
      })),
      profileId: this.currentProfile?.id
    };

    this.emit('performance_tracked', performance);
  }
}

// Classes des managers

class ScreenReaderManager {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private isEnabled: boolean = false;
  private settings: ScreenReaderSettings | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
  }

  private loadVoices(): void {
    this.voices = this.synth.getVoices();
    this.synth.addEventListener('voiceschanged', () => {
      this.voices = this.synth.getVoices();
    });
  }

  async initialize(settings: ScreenReaderSettings): Promise<void> {
    this.settings = settings;
    if (settings.enabled) {
      await this.enable(settings);
    }
  }

  async enable(settings: ScreenReaderSettings): Promise<void> {
    this.settings = settings;
    this.isEnabled = true;
    console.log('♿ Screen Reader Manager activé');
  }

  disable(): void {
    this.isEnabled = false;
    this.synth.cancel();
    console.log('♿ Screen Reader Manager désactivé');
  }

  speak(text: string, options?: Partial<SpeechSynthesisUtterance>): void {
    if (!this.isEnabled || !this.settings) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Appliquer les settings
    utterance.rate = this.settings.readingSpeed;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume;
    
    // Appliquer les options
    if (options) {
      Object.assign(utterance, options);
    }

    // Sélectionner la voix
    const voice = this.selectVoice();
    if (voice) {
      utterance.voice = voice;
    }

    this.synth.speak(utterance);
  }

  private selectVoice(): SpeechSynthesisVoice | null {
    if (!this.settings) return null;

    return this.voices.find(voice => 
      voice.lang.startsWith(this.settings.language.split('-')[0]) &&
      voice.name.toLowerCase().includes(this.settings.voice.gender)
    ) || this.voices[0];
  }
}

class KeyboardNavigationManager {
  private isEnabled: boolean = false;
  private settings: KeyboardNavigationSettings | null = null;
  private shortcuts: Map<string, KeyboardShortcut> = new Map();

  async initialize(settings: KeyboardNavigationSettings): Promise<void> {
    this.settings = settings;
    if (settings.enabled) {
      await this.enable(settings);
    }
  }

  async enable(settings: KeyboardNavigationSettings): Promise<void> {
    this.settings = settings;
    this.isEnabled = true;
    
    // Créer la carte de raccourcis
    settings.shortcuts.forEach(shortcut => {
      const key = shortcut.keys.join('+');
      this.shortcuts.set(key, shortcut);
    });

    // Ajouter les écouteurs d'événements
    this.setupEventListeners();
    
    console.log('♿ Keyboard Navigation Manager activé');
  }

  disable(): void {
    this.isEnabled = false;
    this.removeEventListeners();
    console.log('♿ Keyboard Navigation Manager désactivé');
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private removeEventListeners(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    const key = this.getKeyString(event);
    const shortcut = this.shortcuts.get(key);
    
    if (shortcut && shortcut.isEnabled) {
      event.preventDefault();
      this.executeShortcut(shortcut);
    }
  }

  private getKeyString(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.altKey) parts.push('Alt');
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');
    
    parts.push(event.key);
    
    return parts.join('+');
  }

  private executeShortcut(shortcut: KeyboardShortcut): void {
    console.log('♿ Raccourci exécuté:', shortcut.name);
    // Émettre l'événement pour que le service principal le traite
    window.dispatchEvent(new CustomEvent('accessibility_shortcut', {
      detail: shortcut
    }));
  }
}

class VoiceCommandManager {
  private isEnabled: boolean = false;
  private settings: VoiceCommandSettings | null = null;
  private recognition: SpeechRecognition | null = null;

  async initialize(settings: VoiceCommandSettings): Promise<void> {
    this.settings = settings;
    if (settings.enabled) {
      await this.enable(settings);
    }
  }

  async enable(settings: VoiceCommandSettings): Promise<void> {
    this.settings = settings;
    this.isEnabled = true;
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      this.setupRecognition();
    }
    
    console.log('♿ Voice Command Manager activé');
  }

  disable(): void {
    this.isEnabled = false;
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    console.log('♿ Voice Command Manager désactivé');
  }

  private setupRecognition(): void {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('⚠️ Voice Recognition non supporté');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.settings?.continuous || false;
    this.recognition.interimResults = true;
    this.recognition.lang = this.settings?.language || 'en-US';

    this.recognition.onresult = this.handleRecognitionResult.bind(this);
    this.recognition.onerror = this.handleRecognitionError.bind(this);
    this.recognition.onend = this.handleRecognitionEnd.bind(this);

    this.recognition.start();
  }

  private handleRecognitionResult(event: SpeechRecognitionEvent): void {
    const last = event.results.length - 1;
    const transcript = event.results[last][0].transcript.toLowerCase();
    const confidence = event.results[last][0].confidence;

    if (confidence >= (this.settings?.sensitivity || 0.7)) {
      this.processVoiceCommand(transcript);
    }
  }

  private handleRecognitionError(event: any): void {
    console.error('❌ Erreur reconnaissance vocale:', event.error);
  }

  private handleRecognitionEnd(): void {
    if (this.isEnabled && this.settings?.continuous) {
      setTimeout(() => {
        this.recognition?.start();
      }, 1000);
    }
  }

  private processVoiceCommand(transcript: string): void {
    if (!this.settings) return;

    const command = this.settings.commands.find(cmd => 
      cmd.isEnabled && transcript.includes(cmd.phrase)
    );

    if (command) {
      console.log('♿ Commande vocale détectée:', command.phrase);
      // Émettre l'événement pour que le service principal le traite
      window.dispatchEvent(new CustomEvent('voice_command', {
        detail: command
      }));
    }
  }
}

class VisualAidManager {
  private isEnabled: boolean = false;
  private settings: VisualAidSettings | null = null;

  async initialize(settings: VisualAidSettings): Promise<void> {
    this.settings = settings;
    if (settings.highContrast || settings.largeText) {
      await this.enable(settings);
    }
  }

  async enable(settings: VisualAidSettings): Promise<void> {
    this.settings = settings;
    this.isEnabled = true;
    
    this.applyVisualSettings(settings);
    console.log('♿ Visual Aid Manager activé');
  }

  disable(): void {
    this.isEnabled = false;
    this.removeVisualSettings();
    console.log('♿ Visual Aid Manager désactivé');
  }

  private applyVisualSettings(settings: VisualAidSettings): void {
    const root = document.documentElement;

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    }

    // Large text
    if (settings.largeText) {
      root.style.fontSize = `${18 * settings.zoomLevel}px`;
    }

    // Zoom level
    if (settings.zoomLevel !== 1.0) {
      root.style.zoom = settings.zoomLevel.toString();
    }

    // Spacing
    if (settings.spacing) {
      root.style.letterSpacing = `${settings.spacing.letterSpacing}px`;
      root.style.wordSpacing = `${settings.spacing.wordSpacing}px`;
      root.style.lineHeight = settings.spacing.lineHeight.toString();
    }

    // Animations
    if (settings.animations?.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.001s');
    }
  }

  private removeVisualSettings(): void {
    const root = document.documentElement;
    
    root.classList.remove('high-contrast');
    root.style.removeProperty('font-size');
    root.style.removeProperty('zoom');
    root.style.removeProperty('letter-spacing');
    root.style.removeProperty('word-spacing');
    root.style.removeProperty('line-height');
    root.style.removeProperty('--animation-duration');
  }
}

// Instance singleton
export const accessibilityService = new AccessibilityService();

// Export des fonctions utilitaires
export const enableScreenReader = (settings?: Partial<ScreenReaderSettings>) => 
  accessibilityService.enableScreenReader(settings);

export const disableScreenReader = () => accessibilityService.disableScreenReader();
export const enableKeyboardNavigation = (settings?: Partial<KeyboardNavigationSettings>) => 
  accessibilityService.enableKeyboardNavigation(settings);

export const enableVoiceCommands = (settings?: Partial<VoiceCommandSettings>) => 
  accessibilityService.enableVoiceCommands(settings);

export const enableVisualAids = (settings?: Partial<VisualAidSettings>) => 
  accessibilityService.enableVisualAids(settings);

export const applyAccessibilityProfile = (profile: AccessibilityProfile) => 
  accessibilityService.applyProfile(profile);

export const createAccessibilityProfile = (userId: string, profile: Omit<AccessibilityProfile, 'id' | 'createdAt' | 'updatedAt'>) => 
  accessibilityService.createProfile(userId, profile);

export const getAccessibilityStats = () => accessibilityService.getStats();
export const getCurrentAccessibilityProfile = () => accessibilityService.getCurrentProfile();
