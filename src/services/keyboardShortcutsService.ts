/**
 * Service de raccourcis clavier (productivité)
 * 
 * Ce service gère les raccourcis clavier personnalisables,
 * la détection des combinaisons, les conflits et les préférences utilisateur
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  category: ShortcutCategory;
  action: string;
  keys: KeyCombination[];
  isEnabled: boolean;
  isGlobal: boolean;
  isSystem: boolean;
  priority: number;
  conflicts: string[];
  metadata: ShortcutMetadata;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export type ShortcutCategory = 
  | 'navigation'
  | 'editing'
  | 'formatting'
  | 'search'
  | 'documents'
  | 'collaboration'
  | 'ui'
  | 'productivity'
  | 'accessibility'
  | 'custom';

export interface KeyCombination {
  key: string;
  modifiers: ModifierKey[];
  requiresShift?: boolean;
  requiresAlt?: boolean;
  requiresCtrl?: boolean;
  requiresMeta?: boolean;
  platform?: 'all' | 'windows' | 'mac' | 'linux';
  context?: string[];
}

export type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta' | 'cmd' | 'win';

export interface ShortcutMetadata {
  icon?: string;
  badge?: string;
  tooltip?: string;
  documentation?: string;
  examples?: string[];
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  frequency: 'rarely' | 'sometimes' | 'often' | 'frequently';
}

export interface UserShortcutPreference {
  id: string;
  userId: string;
  shortcutId: string;
  customKeys: KeyCombination[];
  isEnabled: boolean;
  isOverridden: boolean;
  customAction?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string;
  metadata: UserPreferenceMetadata;
}

export interface UserPreferenceMetadata {
  notes?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  learned: boolean;
  favorite: boolean;
  usageCount: number;
  averageUsageTime: number; // en secondes
}

export interface ShortcutConflict {
  id: string;
  shortcutId: string;
  conflictWithId: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  resolution?: ConflictResolution;
  detectedAt: string;
  resolvedAt?: string;
  metadata: ConflictMetadata;
}

export type ConflictType = 'key_collision' | 'action_conflict' | 'context_conflict' | 'priority_conflict';
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ConflictResolution = 'disable_one' | 'reassign_keys' | 'change_priority' | 'custom';

export interface ConflictMetadata {
  conflictingKeys: KeyCombination[];
  conflictingActions: string[];
  context: string;
  platform: string;
  userReported: boolean;
}

export interface ShortcutUsage {
  id: string;
  userId: string;
  shortcutId: string;
  usedAt: string;
  context: string;
  duration: number; // temps d'exécution en ms
  success: boolean;
  error?: string;
  metadata: UsageMetadata;
}

export interface UsageMetadata {
  platform: string;
  browser: string;
  userAgent: string;
  screenResolution: string;
  activeElement?: string;
  modifiers: ModifierKey[];
}

export interface KeyboardShortcutStats {
  totalShortcuts: number;
  activeShortcuts: number;
  systemShortcuts: number;
  customShortcuts: number;
  usageByCategory: Record<ShortcutCategory, number>;
  topShortcuts: Array<{ shortcutId: string; name: string; usageCount: number }>;
  conflicts: {
    total: number;
    resolved: number;
    pending: number;
    bySeverity: Record<ConflictSeverity, number>;
  };
  userPreferences: {
    totalUsers: number;
    customShortcuts: number;
    averageShortcutsPerUser: number;
  };
  performance: {
    averageExecutionTime: number;
    successRate: number;
    errorRate: number;
  };
}

class KeyboardShortcutsService {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private userPreferences: Map<string, UserShortcutPreference> = new Map();
  private activeKeys: Set<string> = new Set();
  private keyPressTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private isListening: boolean = false;
  private conflictDetector: ConflictDetector;
  private shortcutCallbacks: Map<string, (event: KeyboardEvent) => void> = new Map();
  private usageTracker: UsageTracker;
  private boundHandlers: {
    keydown: (e: KeyboardEvent) => void;
    keyup: (e: KeyboardEvent) => void;
    blur: () => void;
  } | null = null;

  constructor() {
    this.conflictDetector = new ConflictDetector();
    this.usageTracker = new UsageTracker();
    this.initializeEventListeners();
  }

  /**
   * Initialise les écouteurs d'événements clavier
   */
  private initializeEventListeners(): void {
    if (typeof window === 'undefined' || this.boundHandlers) return;

    this.boundHandlers = {
      keydown: this.handleKeyDown.bind(this),
      keyup: this.handleKeyUp.bind(this),
      blur: this.handleBlur.bind(this)
    };

    window.addEventListener('keydown', this.boundHandlers.keydown);
    window.addEventListener('keyup', this.boundHandlers.keyup);
    window.addEventListener('blur', this.boundHandlers.blur);
  }

  destroy(): void {
    if (typeof window !== 'undefined' && this.boundHandlers) {
      window.removeEventListener('keydown', this.boundHandlers.keydown);
      window.removeEventListener('keyup', this.boundHandlers.keyup);
      window.removeEventListener('blur', this.boundHandlers.blur);
    }
    this.boundHandlers = null;
    this.activeKeys.clear();
    this.keyPressTimeouts.forEach(timeout => clearTimeout(timeout));
    this.keyPressTimeouts.clear();
    this.isListening = false;
  }

  /**
   * Gère les événements keydown
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isListening) return;

    const key = this.normalizeKey(event.key);
    const modifiers = this.getModifiers(event);
    const combination = this.createKeyCombination(key, modifiers);

    // Ajouter la touche active
    this.activeKeys.add(key);

    // Vérifier les raccourcis
    this.checkShortcuts(combination, event);

    // Détecter les conflits
    this.conflictDetector.detectConflict(combination);
  }

  /**
   * Gère les événements keyup
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const key = this.normalizeKey(event.key);
    this.activeKeys.delete(key);

    // Nettoyer les timeouts
    const timeout = this.keyPressTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.keyPressTimeouts.delete(key);
    }
  }

  /**
   * Gère la perte de focus
   */
  private handleBlur(): void {
    this.activeKeys.clear();
    this.keyPressTimeouts.forEach(timeout => clearTimeout(timeout));
    this.keyPressTimeouts.clear();
  }

  /**
   * Normalise les touches
   */
  private normalizeKey(key: string): string {
    const keyMap: Record<string, string> = {
      ' ': 'space',
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'Enter': 'enter',
      'Escape': 'escape',
      'Tab': 'tab',
      'Backspace': 'backspace',
      'Delete': 'delete',
      'Insert': 'insert',
      'Home': 'home',
      'End': 'end',
      'PageUp': 'pageup',
      'PageDown': 'pagedown'
    };

    return keyMap[key] || key.toLowerCase();
  }

  /**
   * Extrait les modificateurs
   */
  private getModifiers(event: KeyboardEvent): ModifierKey[] {
    const modifiers: ModifierKey[] = [];

    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    if (event.metaKey) modifiers.push('meta');

    // Ajouter des alias pour la compatibilité
    const platform = typeof navigator !== 'undefined' ? navigator.platform : '';
    if (event.metaKey && platform.includes('Mac')) {
      modifiers.push('cmd');
    }
    if (event.ctrlKey && !platform.includes('Mac')) {
      modifiers.push('win');
    }

    return modifiers;
  }

  /**
   * Crée une combinaison de touches
   */
  private createKeyCombination(key: string, modifiers: ModifierKey[]): KeyCombination {
    return {
      key,
      modifiers,
      requiresShift: modifiers.includes('shift'),
      requiresAlt: modifiers.includes('alt'),
      requiresCtrl: modifiers.includes('ctrl'),
      requiresMeta: modifiers.includes('meta'),
      platform: this.getCurrentPlatform()
    };
  }

  /**
   * Obtient la plateforme actuelle
   */
  private getCurrentPlatform(): 'windows' | 'mac' | 'linux' {
    const platform = (typeof navigator !== 'undefined' ? navigator.platform : 'win32').toLowerCase();
    
    if (platform.includes('mac')) return 'mac';
    if (platform.includes('win')) return 'windows';
    if (platform.includes('linux')) return 'linux';
    
    return 'windows'; // Par défaut
  }

  /**
   * Vérifie les raccourcis pour une combinaison
   */
  private checkShortcuts(combination: KeyCombination, event: KeyboardEvent): void {
    const matchingShortcuts = Array.from(this.shortcuts.values())
      .filter(shortcut => this.isShortcutMatching(shortcut, combination))
      .sort((a, b) => b.priority - a.priority);

    for (const shortcut of matchingShortcuts) {
      if (this.executeShortcut(shortcut, event)) {
        break; // Exécuter seulement le premier raccourci correspondant
      }
    }
  }

  /**
   * Vérifie si un raccourci correspond à la combinaison
   */
  private isShortcutMatching(shortcut: KeyboardShortcut, combination: KeyCombination): boolean {
    if (!shortcut.isEnabled) return false;

    return shortcut.keys.some(keyCombo => 
      this.isKeyCombinationMatching(keyCombo, combination)
    );
  }

  /**
   * Vérifie si deux combinaisons correspondent
   */
  private isKeyCombinationMatching(combo1: KeyCombination, combo2: KeyCombination): boolean {
    // Vérifier la plateforme
    if (combo1.platform && combo1.platform !== 'all' && combo1.platform !== combo2.platform) {
      return false;
    }

    // Vérifier la touche principale
    if (combo1.key !== combo2.key) return false;

    // Vérifier les modificateurs
    const requiredModifiers = new Set(combo1.modifiers);
    const actualModifiers = new Set(combo2.modifiers);

    // Tous les modificateurs requis doivent être présents
    for (const modifier of requiredModifiers) {
      if (!actualModifiers.has(modifier)) return false;
    }

    // Pas de modificateurs supplémentaires non requis
    for (const modifier of actualModifiers) {
      if (!requiredModifiers.has(modifier)) return false;
    }

    return true;
  }

  /**
   * Exécute un raccourci
   */
  private executeShortcut(shortcut: KeyboardShortcut, event: KeyboardEvent): boolean {
    try {
      // Empêcher le comportement par défaut si nécessaire
      if (this.shouldPreventDefault(shortcut)) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Exécuter l'action
      const callback = this.shortcutCallbacks.get(shortcut.action);
      if (callback) {
        callback(event);
      }

      // Suivre l'utilisation
      this.usageTracker.trackUsage(shortcut.id);

      console.log('⌨️ Raccourci exécuté:', shortcut.name);
      return true;

    } catch (error) {
      console.error('❌ Erreur exécution raccourci:', error);
      return false;
    }
  }

  /**
   * Détermine s'il faut empêcher le comportement par défaut
   */
  private shouldPreventDefault(shortcut: KeyboardShortcut): boolean {
    // Empêcher pour les raccourcis globaux et de navigation
    return shortcut.isGlobal || 
           shortcut.category === 'navigation' || 
           shortcut.category === 'ui';
  }

  /**
   * Enregistre un nouveau raccourci
   */
  async registerShortcut(shortcut: Omit<KeyboardShortcut, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<KeyboardShortcut> {
    try {
      const { data, error } = await supabase
        .from('keyboard_shortcuts')
        .insert({
          name: shortcut.name,
          description: shortcut.description,
          category: shortcut.category,
          action: shortcut.action,
          keys: shortcut.keys,
          is_enabled: shortcut.isEnabled,
          is_global: shortcut.isGlobal,
          is_system: shortcut.isSystem,
          priority: shortcut.priority,
          conflicts: shortcut.conflicts || [],
          metadata: shortcut.metadata,
          usage_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer le raccourci');

      const createdShortcut = this.mapShortcutFromDB(data);
      this.shortcuts.set(createdShortcut.id, createdShortcut);

      console.log('⌨️ Raccourci enregistré:', createdShortcut.name);
      return createdShortcut;

    } catch (error) {
      console.error('❌ Erreur enregistrement raccourci:', error);
      throw new Error(`Échec de l'enregistrement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Enregistre un callback pour une action
   */
  registerAction(action: string, callback: (event: KeyboardEvent) => void): void {
    this.shortcutCallbacks.set(action, callback);
  }

  /**
   * Charge tous les raccourcis
   */
  async loadShortcuts(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('keyboard_shortcuts')
        .select('*')
        .eq('is_enabled', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      this.shortcuts.clear();
      (data || []).forEach(shortcut => {
        this.shortcuts.set(shortcut.id, this.mapShortcutFromDB(shortcut));
      });

      console.log('⌨️ Raccourcis chargés:', this.shortcuts.size);

    } catch (error) {
      console.error('❌ Erreur chargement raccourcis:', error);
    }
  }

  /**
   * Charge les préférences utilisateur
   */
  async loadUserPreferences(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('user_shortcut_preferences')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      this.userPreferences.clear();
      (data || []).forEach(preference => {
        this.userPreferences.set(preference.shortcut_id, this.mapUserPreferenceFromDB(preference));
      });

      console.log('⌨️ Préférences utilisateur chargées:', this.userPreferences.size);

    } catch (error) {
      console.error('❌ Erreur chargement préférences utilisateur:', error);
    }
  }

  /**
   * Active/désactive l'écoute des raccourcis
   */
  setListening(enabled: boolean): void {
    this.isListening = enabled;
    console.log('⌨️ Écoute des raccourcis:', enabled ? 'activée' : 'désactivée');
  }

  /**
   * Obtient les raccourcis par catégorie
   */
  getShortcutsByCategory(category: ShortcutCategory): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
      .filter(shortcut => shortcut.category === category)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Recherche des raccourcis
   */
  searchShortcuts(query: string): KeyboardShortcut[] {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.shortcuts.values())
      .filter(shortcut => 
        shortcut.name.toLowerCase().includes(lowerQuery) ||
        shortcut.description.toLowerCase().includes(lowerQuery) ||
        shortcut.action.toLowerCase().includes(lowerQuery) ||
        shortcut.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Obtient les statistiques des raccourcis
   */
  async getShortcutStats(): Promise<KeyboardShortcutStats> {
    try {
      const { data, error } = await supabase.rpc('get_keyboard_shortcut_stats');

      if (error) throw error;

      const stats = data || {
        total_shortcuts: 0,
        active_shortcuts: 0,
        system_shortcuts: 0,
        custom_shortcuts: 0,
        usage_by_category: {},
        top_shortcuts: [],
        conflicts: {
          total: 0,
          resolved: 0,
          pending: 0,
          by_severity: {}
        },
        user_preferences: {
          total_users: 0,
          custom_shortcuts: 0,
          average_shortcuts_per_user: 0
        },
        performance: {
          average_execution_time: 0,
          success_rate: 0,
          error_rate: 0
        }
      };

      return {
        totalShortcuts: stats.total_shortcuts,
        activeShortcuts: stats.active_shortcuts,
        systemShortcuts: stats.system_shortcuts,
        customShortcuts: stats.custom_shortcuts,
        usageByCategory: stats.usage_by_category,
        topShortcuts: stats.top_shortcuts,
        conflicts: stats.conflicts,
        userPreferences: stats.user_preferences,
        performance: stats.performance
      };

    } catch (error) {
      console.error('❌ Erreur statistiques raccourcis:', error);
      throw new Error(`Échec des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Crée les raccourcis système par défaut
   */
  async createDefaultShortcuts(): Promise<void> {
    const defaultShortcuts: Omit<KeyboardShortcut, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
      // Navigation
      {
        name: 'Go to Home',
        description: 'Aller à la page d\'accueil',
        category: 'navigation',
        action: 'navigate_home',
        keys: [
          { key: 'h', modifiers: ['ctrl'], platform: 'all' },
          { key: 'h', modifiers: ['cmd'], platform: 'mac' }
        ],
        isEnabled: true,
        isGlobal: true,
        isSystem: true,
        priority: 100,
        conflicts: [],
        metadata: {
          icon: 'home',
          badge: 'N',
          tooltip: 'Ctrl+H (Windows) / Cmd+H (Mac)',
          documentation: 'Navigate to the home page',
          examples: ['Press Ctrl+H to go home'],
          tags: ['navigation', 'home'],
          difficulty: 'easy',
          frequency: 'frequently'
        }
      },
      {
        name: 'Search',
        description: 'Ouvrir la recherche',
        category: 'search',
        action: 'open_search',
        keys: [
          { key: '/', modifiers: [], platform: 'all' },
          { key: 'k', modifiers: ['ctrl'], platform: 'all' },
          { key: 'k', modifiers: ['cmd'], platform: 'mac' }
        ],
        isEnabled: true,
        isGlobal: true,
        isSystem: true,
        priority: 100,
        conflicts: [],
        metadata: {
          icon: 'search',
          badge: 'S',
          tooltip: 'Ctrl+K (Windows) / Cmd+K (Mac)',
          documentation: 'Open the search dialog',
          examples: ['Press Ctrl+K to search'],
          tags: ['search', 'find'],
          difficulty: 'easy',
          frequency: 'frequently'
        }
      },
      // Édition
      {
        name: 'Copy',
        description: 'Copier la sélection',
        category: 'editing',
        action: 'copy',
        keys: [
          { key: 'c', modifiers: ['ctrl'], platform: 'all' },
          { key: 'c', modifiers: ['cmd'], platform: 'mac' }
        ],
        isEnabled: true,
        isGlobal: false,
        isSystem: true,
        priority: 90,
        conflicts: [],
        metadata: {
          icon: 'copy',
          badge: 'C',
          tooltip: 'Ctrl+C (Windows) / Cmd+C (Mac)',
          documentation: 'Copy the current selection',
          examples: ['Select text and press Ctrl+C to copy'],
          tags: ['editing', 'copy'],
          difficulty: 'easy',
          frequency: 'frequently'
        }
      },
      {
        name: 'Paste',
        description: 'Coller',
        category: 'editing',
        action: 'paste',
        keys: [
          { key: 'v', modifiers: ['ctrl'], platform: 'all' },
          { key: 'v', modifiers: ['cmd'], platform: 'mac' }
        ],
        isEnabled: true,
        isGlobal: false,
        isSystem: true,
        priority: 90,
        conflicts: [],
        metadata: {
          icon: 'paste',
          badge: 'V',
          tooltip: 'Ctrl+V (Windows) / Cmd+V (Mac)',
          documentation: 'Paste from clipboard',
          examples: ['Press Ctrl+V to paste'],
          tags: ['editing', 'paste'],
          difficulty: 'easy',
          frequency: 'frequently'
        }
      },
      {
        name: 'Undo',
        description: 'Annuler',
        category: 'editing',
        action: 'undo',
        keys: [
          { key: 'z', modifiers: ['ctrl'], platform: 'all' },
          { key: 'z', modifiers: ['cmd'], platform: 'mac' }
        ],
        isEnabled: true,
        isGlobal: false,
        isSystem: true,
        priority: 85,
        conflicts: [],
        metadata: {
          icon: 'undo',
          badge: 'Z',
          tooltip: 'Ctrl+Z (Windows) / Cmd+Z (Mac)',
          documentation: 'Undo the last action',
          examples: ['Press Ctrl+Z to undo'],
          tags: ['editing', 'undo'],
          difficulty: 'easy',
          frequency: 'frequently'
        }
      },
      {
        name: 'Redo',
        description: 'Refaire',
        category: 'editing',
        action: 'redo',
        keys: [
          { key: 'y', modifiers: ['ctrl'], platform: 'all' },
          { key: 'y', modifiers: ['cmd'], platform: 'mac' },
          { key: 'z', modifiers: ['ctrl', 'shift'], platform: 'all' },
          { key: 'z', modifiers: ['cmd', 'shift'], platform: 'mac' }
        ],
        isEnabled: true,
        isGlobal: false,
        isSystem: true,
        priority: 85,
        conflicts: [],
        metadata: {
          icon: 'redo',
          badge: 'Y',
          tooltip: 'Ctrl+Y (Windows) / Cmd+Y (Mac)',
          documentation: 'Redo the last undone action',
          examples: ['Press Ctrl+Y to redo'],
          tags: ['editing', 'redo'],
          difficulty: 'easy',
          frequency: 'sometimes'
        }
      },
      // Documents
      {
        name: 'New Document',
        description: 'Créer un nouveau document',
        category: 'documents',
        action: 'new_document',
        keys: [
          { key: 'n', modifiers: ['ctrl'], platform: 'all' },
          { key: 'n', modifiers: ['cmd'], platform: 'mac' }
        ],
        isEnabled: true,
        isGlobal: true,
        isSystem: true,
        priority: 80,
        conflicts: [],
        metadata: {
          icon: 'file-plus',
          badge: 'N',
          tooltip: 'Ctrl+N (Windows) / Cmd+N (Mac)',
          documentation: 'Create a new document',
          examples: ['Press Ctrl+N to create a new document'],
          tags: ['documents', 'create'],
          difficulty: 'easy',
          frequency: 'often'
        }
      },
      {
        name: 'Open Document',
        description: 'Ouvrir un document',
        category: 'documents',
        action: 'open_document',
        keys: [
          { key: 'o', modifiers: ['ctrl'], platform: 'all' },
          { key: 'o', modifiers: ['cmd'], platform: 'mac' }
        ],
        isEnabled: true,
        isGlobal: true,
        isSystem: true,
        priority: 80,
        conflicts: [],
        metadata: {
          icon: 'folder-open',
          badge: 'O',
          tooltip: 'Ctrl+O (Windows) / Cmd+O (Mac)',
          documentation: 'Open an existing document',
          examples: ['Press Ctrl+O to open a document'],
          tags: ['documents', 'open'],
          difficulty: 'easy',
          frequency: 'often'
        }
      },
      {
        name: 'Save Document',
        description: 'Sauvegarder le document',
        category: 'documents',
        action: 'save_document',
        keys: [
          { key: 's', modifiers: ['ctrl'], platform: 'all' },
          { key: 's', modifiers: ['cmd'], platform: 'mac' }
        ],
        isEnabled: true,
        isGlobal: true,
        isSystem: true,
        priority: 95,
        conflicts: [],
        metadata: {
          icon: 'save',
          badge: 'S',
          tooltip: 'Ctrl+S (Windows) / Cmd+S (Mac)',
          documentation: 'Save the current document',
          examples: ['Press Ctrl+S to save'],
          tags: ['documents', 'save'],
          difficulty: 'easy',
          frequency: 'frequently'
        }
      },
      // UI
      {
        name: 'Toggle Sidebar',
        description: 'Afficher/masquer la barre latérale',
        category: 'ui',
        action: 'toggle_sidebar',
        keys: [
          { key: 'b', modifiers: ['ctrl'], platform: 'all' },
          { key: 'b', modifiers: ['cmd'], platform: 'mac' }
        ],
        isEnabled: true,
        isGlobal: true,
        isSystem: true,
        priority: 70,
        conflicts: [],
        metadata: {
          icon: 'sidebar',
          badge: 'B',
          tooltip: 'Ctrl+B (Windows) / Cmd+B (Mac)',
          documentation: 'Toggle the sidebar visibility',
          examples: ['Press Ctrl+B to toggle sidebar'],
          tags: ['ui', 'sidebar'],
          difficulty: 'easy',
          frequency: 'sometimes'
        }
      },
      {
        name: 'Toggle Dark Mode',
        description: 'Basculer le mode sombre',
        category: 'ui',
        action: 'toggle_dark_mode',
        keys: [
          { key: 'd', modifiers: ['ctrl', 'shift'], platform: 'all' },
          { key: 'd', modifiers: ['cmd', 'shift'], platform: 'mac' }
        ],
        isEnabled: true,
        isGlobal: true,
        isSystem: true,
        priority: 60,
        conflicts: [],
        metadata: {
          icon: 'moon',
          badge: 'D',
          tooltip: 'Ctrl+Shift+D (Windows) / Cmd+Shift+D (Mac)',
          documentation: 'Toggle between light and dark mode',
          examples: ['Press Ctrl+Shift+D to toggle dark mode'],
          tags: ['ui', 'theme', 'dark'],
          difficulty: 'easy',
          frequency: 'sometimes'
        }
      }
    ];

    for (const shortcut of defaultShortcuts) {
      try {
        await this.registerShortcut(shortcut);
      } catch (error) {
        console.error('❌ Erreur création raccourci par défaut:', error);
      }
    }

    console.log('⌨️ Raccourcis par défaut créés:', defaultShortcuts.length);
  }

  // Mappeurs depuis la base de données
  private mapShortcutFromDB(data: any): KeyboardShortcut {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      action: data.action,
      keys: data.keys,
      isEnabled: data.is_enabled,
      isGlobal: data.is_global,
      isSystem: data.is_system,
      priority: data.priority,
      conflicts: data.conflicts || [],
      metadata: data.metadata || { tags: [] },
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      usageCount: data.usage_count
    };
  }

  private mapUserPreferenceFromDB(data: any): UserShortcutPreference {
    return {
      id: data.id,
      userId: data.user_id,
      shortcutId: data.shortcut_id,
      customKeys: data.custom_keys || [],
      isEnabled: data.is_enabled,
      isOverridden: data.is_overridden,
      customAction: data.custom_action,
      priority: data.priority,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastUsedAt: data.last_used_at,
      metadata: data.metadata || {}
    };
  }
}

// Classes utilitaires
class ConflictDetector {
  private conflicts: Map<string, ShortcutConflict> = new Map();

  detectConflict(combination: KeyCombination): void {
    // Logique de détection de conflits
    // À implémenter selon les besoins
  }
}

class UsageTracker {
  private usageQueue: ShortcutUsage[] = [];

  trackUsage(shortcutId: string): void {
    const usage: ShortcutUsage = {
      id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: '', // À remplir avec l'ID utilisateur
      shortcutId,
      usedAt: new Date().toISOString(),
      context: this.getCurrentContext(),
      duration: 0,
      success: true,
      metadata: {
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
        browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        screenResolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '0x0',
        activeElement: typeof document !== 'undefined' ? document.activeElement?.tagName : undefined,
        modifiers: []
      }
    };

    this.usageQueue.push(usage);
    this.flushUsage();
  }

  private getCurrentContext(): string {
    // Logique pour déterminer le contexte actuel
    return typeof document !== 'undefined' ? (document.title || 'unknown') : 'unknown';
  }

  private async flushUsage(): Promise<void> {
    if (this.usageQueue.length === 0) return;

    const usageToFlush = [...this.usageQueue];
    this.usageQueue = [];

    try {
      // Envoyer les données d'utilisation à la base de données
      // À implémenter avec Supabase
    } catch (error) {
      console.error('❌ Erreur envoi données utilisation:', error);
      // Remettre les données dans la queue en cas d'erreur
      this.usageQueue.unshift(...usageToFlush);
    }
  }
}

// Instance singleton
export const keyboardShortcutsService = new KeyboardShortcutsService();

// Export des fonctions utilitaires
export const registerShortcut = (shortcut: Omit<KeyboardShortcut, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => 
  keyboardShortcutsService.registerShortcut(shortcut);

export const registerAction = (action: string, callback: (event: KeyboardEvent) => void) => 
  keyboardShortcutsService.registerAction(action, callback);

export const loadShortcuts = () => keyboardShortcutsService.loadShortcuts();
export const loadUserPreferences = (userId: string) => keyboardShortcutsService.loadUserPreferences(userId);
export const setListening = (enabled: boolean) => keyboardShortcutsService.setListening(enabled);
export const getShortcutsByCategory = (category: ShortcutCategory) => keyboardShortcutsService.getShortcutsByCategory(category);
export const searchShortcuts = (query: string) => keyboardShortcutsService.searchShortcuts(query);
export const getShortcutStats = () => keyboardShortcutsService.getShortcutStats();
export const createDefaultShortcuts = () => keyboardShortcutsService.createDefaultShortcuts();
