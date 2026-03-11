-- Migration: Création des tables pour les raccourcis clavier (productivité)
-- Date: 11 mars 2026
-- Description: Tables pour gérer les raccourcis clavier personnalisables et leur utilisation

-- Table des raccourcis clavier
CREATE TABLE IF NOT EXISTS keyboard_shortcuts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('navigation', 'editing', 'formatting', 'search', 'documents', 'collaboration', 'ui', 'productivity', 'accessibility', 'custom')),
    action VARCHAR(255) NOT NULL,
    keys JSONB NOT NULL DEFAULT '[]',
    is_enabled BOOLEAN DEFAULT true,
    is_global BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 50,
    conflicts TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
);

-- Table des préférences de raccourcis utilisateur
CREATE TABLE IF NOT EXISTS user_shortcut_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    shortcut_id UUID NOT NULL REFERENCES keyboard_shortcuts(id) ON DELETE CASCADE,
    custom_keys JSONB DEFAULT '[]',
    is_enabled BOOLEAN DEFAULT true,
    is_overridden BOOLEAN DEFAULT false,
    custom_action VARCHAR(255),
    priority INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, shortcut_id)
);

-- Table des conflits de raccourcis
CREATE TABLE IF NOT EXISTS shortcut_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shortcut_id UUID NOT NULL REFERENCES keyboard_shortcuts(id) ON DELETE CASCADE,
    conflict_with_id UUID NOT NULL REFERENCES keyboard_shortcuts(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL CHECK (conflict_type IN ('key_collision', 'action_conflict', 'context_conflict', 'priority_conflict')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resolution VARCHAR(50) CHECK (resolution IN ('disable_one', 'reassign_keys', 'change_priority', 'custom')),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Table des utilisations de raccourcis
CREATE TABLE IF NOT EXISTS shortcut_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    shortcut_id UUID NOT NULL REFERENCES keyboard_shortcuts(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context VARCHAR(255),
    duration INTEGER DEFAULT 0, -- en millisecondes
    success BOOLEAN DEFAULT true,
    error TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Table des catégories de raccourcis
CREATE TABLE IF NOT EXISTS shortcut_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tutoriels de raccourcis
CREATE TABLE IF NOT EXISTS shortcut_tutorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shortcut_id UUID NOT NULL REFERENCES keyboard_shortcuts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    steps JSONB DEFAULT '[]',
    video_url TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    estimated_time INTEGER, -- en minutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_keyboard_shortcuts_name ON keyboard_shortcuts(name);
CREATE INDEX idx_keyboard_shortcuts_category ON keyboard_shortcuts(category);
CREATE INDEX idx_keyboard_shortcuts_action ON keyboard_shortcuts(action);
CREATE INDEX idx_keyboard_shortcuts_is_enabled ON keyboard_shortcuts(is_enabled);
CREATE INDEX idx_keyboard_shortcuts_is_global ON keyboard_shortcuts(is_global);
CREATE INDEX idx_keyboard_shortcuts_is_system ON keyboard_shortcuts(is_system);
CREATE INDEX idx_keyboard_shortcuts_priority ON keyboard_shortcuts(priority DESC);
CREATE INDEX idx_keyboard_shortcuts_usage_count ON keyboard_shortcuts(usage_count DESC);
CREATE INDEX idx_keyboard_shortcuts_created_at ON keyboard_shortcuts(created_at DESC);

CREATE INDEX idx_user_shortcut_preferences_user_id ON user_shortcut_preferences(user_id);
CREATE INDEX idx_user_shortcut_preferences_shortcut_id ON user_shortcut_preferences(shortcut_id);
CREATE INDEX idx_user_shortcut_preferences_is_enabled ON user_shortcut_preferences(is_enabled);
CREATE INDEX idx_user_shortcut_preferences_is_overridden ON user_shortcut_preferences(is_overridden);
CREATE INDEX idx_user_shortcut_preferences_last_used_at ON user_shortcut_preferences(last_used_at DESC);

CREATE INDEX idx_shortcut_conflicts_shortcut_id ON shortcut_conflicts(shortcut_id);
CREATE INDEX idx_shortcut_conflicts_conflict_with_id ON shortcut_conflicts(conflict_with_id);
CREATE INDEX idx_shortcut_conflicts_conflict_type ON shortcut_conflicts(conflict_type);
CREATE INDEX idx_shortcut_conflicts_severity ON shortcut_conflicts(severity);
CREATE INDEX idx_shortcut_conflicts_detected_at ON shortcut_conflicts(detected_at DESC);
CREATE INDEX idx_shortcut_conflicts_resolved_at ON shortcut_conflicts(resolved_at DESC);

CREATE INDEX idx_shortcut_usage_user_id ON shortcut_usage(user_id);
CREATE INDEX idx_shortcut_usage_shortcut_id ON shortcut_usage(shortcut_id);
CREATE INDEX idx_shortcut_usage_used_at ON shortcut_usage(used_at DESC);
CREATE INDEX idx_shortcut_usage_success ON shortcut_usage(success);
CREATE INDEX idx_shortcut_usage_context ON shortcut_usage(context);

CREATE INDEX idx_shortcut_categories_name ON shortcut_categories(name);
CREATE INDEX idx_shortcut_categories_is_active ON shortcut_categories(is_active);
CREATE INDEX idx_shortcut_categories_sort_order ON shortcut_categories(sort_order);

CREATE INDEX idx_shortcut_tutorials_shortcut_id ON shortcut_tutorials(shortcut_id);
CREATE INDEX idx_shortcut_tutorials_difficulty ON shortcut_tutorials(difficulty);
CREATE INDEX idx_shortcut_tutorials_is_active ON shortcut_tutorials(is_active);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_keyboard_shortcuts_updated_at 
    BEFORE UPDATE ON keyboard_shortcuts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_shortcut_preferences_updated_at 
    BEFORE UPDATE ON user_shortcut_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shortcut_categories_updated_at 
    BEFORE UPDATE ON shortcut_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shortcut_tutorials_updated_at 
    BEFORE UPDATE ON shortcut_tutorials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour le compteur d'utilisation
CREATE OR REPLACE FUNCTION increment_shortcut_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE keyboard_shortcuts
    SET usage_count = usage_count + 1
    WHERE id = NEW.shortcut_id;
    
    -- Mettre à jour last_used_at dans les préférences utilisateur
    UPDATE user_shortcut_preferences
    SET last_used_at = NOW()
    WHERE user_id = NEW.user_id
    AND shortcut_id = NEW.shortcut_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_shortcut_usage
    AFTER INSERT ON shortcut_usage
    FOR EACH ROW EXECUTE FUNCTION increment_shortcut_usage();

-- Politiques RLS pour les raccourcis clavier
ALTER TABLE keyboard_shortcuts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view enabled shortcuts" ON keyboard_shortcuts
    FOR SELECT USING (is_enabled = true);

CREATE POLICY "Users can view shortcut details" ON keyboard_shortcuts
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage shortcuts" ON keyboard_shortcuts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les préférences utilisateur
ALTER TABLE user_shortcut_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shortcut preferences" ON user_shortcut_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own shortcut preferences" ON user_shortcut_preferences
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les conflits
ALTER TABLE shortcut_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shortcut conflicts" ON shortcut_conflicts
    FOR SELECT USING (true);

-- Politiques RLS pour les utilisations
ALTER TABLE shortcut_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shortcut usage" ON shortcut_usage
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own shortcut usage" ON shortcut_usage
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour les catégories
ALTER TABLE shortcut_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active categories" ON shortcut_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view category details" ON shortcut_categories
    FOR SELECT USING (true);

-- Politiques RLS pour les tutoriels
ALTER TABLE shortcut_tutorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active tutorials" ON shortcut_tutorials
    FOR SELECT USING (is_active = true);

-- Fonctions RPC pour les raccourcis clavier

-- Fonction pour obtenir les statistiques des raccourcis
CREATE OR REPLACE FUNCTION get_keyboard_shortcut_stats()
RETURNS TABLE (
    total_shortcuts BIGINT,
    active_shortcuts BIGINT,
    system_shortcuts BIGINT,
    custom_shortcuts BIGINT,
    usage_by_category JSONB,
    top_shortcuts JSONB,
    conflicts JSONB,
    user_preferences JSONB,
    performance JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH shortcut_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_enabled = true) as active,
            COUNT(*) FILTER (WHERE is_system = true) as system,
            COUNT(*) FILTER (WHERE is_system = false) as custom
        FROM keyboard_shortcuts
    ),
    category_usage_stats AS (
        SELECT jsonb_object_agg(category, usage_count)
        FROM (
            SELECT 
                category,
                SUM(usage_count) as usage_count
            FROM keyboard_shortcuts
            WHERE is_enabled = true
            GROUP BY category
        ) category_stats
    ),
    top_shortcuts_stats AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'shortcutId', ks.id,
                'name', ks.name,
                'usageCount', ks.usage_count
            )
        )
        FROM (
            SELECT 
                ks.id,
                ks.name,
                ks.usage_count
            FROM keyboard_shortcuts ks
            WHERE ks.is_enabled = true
            ORDER BY ks.usage_count DESC
            LIMIT 20
        ) top_shorts
    ),
    conflicts_stats AS (
        SELECT jsonb_build_object(
            'total', COUNT(*),
            'resolved', COUNT(*) FILTER (WHERE resolved_at IS NOT NULL),
            'pending', COUNT(*) FILTER (WHERE resolved_at IS NULL),
            'bySeverity', jsonb_object_agg(severity, severity_count)
        )
        FROM (
            SELECT 
                severity,
                COUNT(*) as severity_count
            FROM shortcut_conflicts
            GROUP BY severity
        ) conflict_severity
    ),
    user_preferences_stats AS (
        SELECT jsonb_build_object(
            'totalUsers', COUNT(DISTINCT usp.user_id),
            'customShortcuts', COUNT(*) FILTER (WHERE is_overridden = true),
            'averageShortcutsPerUser', AVG(shortcut_count)
        )
        FROM (
            SELECT 
                usp.user_id,
                COUNT(*) as shortcut_count
            FROM user_shortcut_preferences usp
            WHERE usp.is_enabled = true
            GROUP BY usp.user_id
        ) user_shortcuts
    ),
    performance_stats AS (
        SELECT jsonb_build_object(
            'averageExecutionTime', COALESCE(AVG(duration), 0),
            'successRate', COUNT(*) FILTER (WHERE success = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100,
            'errorRate', COUNT(*) FILTER (WHERE success = false)::DECIMAL / NULLIF(COUNT(*), 0) * 100
        )
        FROM shortcut_usage
        WHERE used_at >= CURRENT_DATE - INTERVAL '7 days'
    )
    SELECT 
        ss.total as total_shortcuts,
        ss.active as active_shortcuts,
        ss.system as system_shortcuts,
        ss.custom as custom_shortcuts,
        cus.category_usage_stats as usage_by_category,
        ts.top_shortcuts_stats as top_shortcuts,
        cs.conflicts_stats as conflicts,
        ups.user_preferences_stats as user_preferences,
        ps.performance_stats as performance
    FROM shortcut_stats ss, category_usage_stats cus, top_shortcuts_stats ts,
         conflicts_stats cs, user_preferences_stats ups, performance_stats ps;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les catégories par défaut
CREATE OR REPLACE FUNCTION create_default_shortcut_categories()
RETURNS VOID AS $$
BEGIN
    INSERT INTO shortcut_categories (name, display_name, description, icon, color, is_system, sort_order)
    VALUES 
        ('navigation', 'Navigation', 'Raccourcis pour naviguer dans l\'application', 'navigation', '#3B82F6', true, 10),
        ('editing', 'Édition', 'Raccourcis pour éditer le contenu', 'edit', '#10B981', true, 20),
        ('formatting', 'Formatage', 'Raccourcis pour formater le texte', 'format', '#F59E0B', true, 30),
        ('search', 'Recherche', 'Raccourcis pour rechercher', 'search', '#EF4444', true, 40),
        ('documents', 'Documents', 'Raccourcis pour gérer les documents', 'document', '#8B5CF6', true, 50),
        ('collaboration', 'Collaboration', 'Raccourcis pour la collaboration', 'users', '#EC4899', true, 60),
        ('ui', 'Interface', 'Raccourcis pour l\'interface utilisateur', 'ui', '#6B7280', true, 70),
        ('productivity', 'Productivité', 'Raccourcis pour améliorer la productivité', 'productivity', '#84CC16', true, 80),
        ('accessibility', 'Accessibilité', 'Raccourcis pour l\'accessibilité', 'accessibility', '#14B8A6', true, 90),
        ('custom', 'Personnalisés', 'Raccourcis personnalisés par l\'utilisateur', 'custom', '#F97316', true, 100)
    ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les raccourcis système par défaut
CREATE OR REPLACE FUNCTION create_default_keyboard_shortcuts()
RETURNS VOID AS $$
BEGIN
    -- Navigation
    INSERT INTO keyboard_shortcuts (name, description, category, action, keys, is_enabled, is_global, is_system, priority, metadata)
    VALUES 
        ('Go to Home', 'Aller à la page d\'accueil', 'navigation', 'navigate_home', 
         '[{"key": "h", "modifiers": ["ctrl"], "platform": "all"}, {"key": "h", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, true, true, 100,
         '{"icon": "home", "badge": "N", "tooltip": "Ctrl+H (Windows) / Cmd+H (Mac)", "tags": ["navigation", "home"], "difficulty": "easy", "frequency": "frequently"}'),
        ('Search', 'Ouvrir la recherche', 'search', 'open_search', 
         '[{"key": "/", "modifiers": [], "platform": "all"}, {"key": "k", "modifiers": ["ctrl"], "platform": "all"}, {"key": "k", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, true, true, 100,
         '{"icon": "search", "badge": "S", "tooltip": "Ctrl+K (Windows) / Cmd+K (Mac)", "tags": ["search", "find"], "difficulty": "easy", "frequency": "frequently"}'),
        ('Go Back', 'Revenir en arrière', 'navigation', 'go_back', 
         '[{"key": "arrowleft", "modifiers": ["alt"], "platform": "all"}]', 
         true, true, true, 90,
         '{"icon": "arrow-left", "badge": "←", "tooltip": "Alt+←", "tags": ["navigation", "back"], "difficulty": "easy", "frequency": "often"}'),
        ('Go Forward', 'Aller en avant', 'navigation', 'go_forward', 
         '[{"key": "arrowright", "modifiers": ["alt"], "platform": "all"}]', 
         true, true, true, 90,
         '{"icon": "arrow-right", "badge": "→", "tooltip": "Alt+→", "tags": ["navigation", "forward"], "difficulty": "easy", "frequency": "often"}'),
        
        -- Édition
        ('Copy', 'Copier la sélection', 'editing', 'copy', 
         '[{"key": "c", "modifiers": ["ctrl"], "platform": "all"}, {"key": "c", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, false, true, 90,
         '{"icon": "copy", "badge": "C", "tooltip": "Ctrl+C (Windows) / Cmd+C (Mac)", "tags": ["editing", "copy"], "difficulty": "easy", "frequency": "frequently"}'),
        ('Paste', 'Coller', 'editing', 'paste', 
         '[{"key": "v", "modifiers": ["ctrl"], "platform": "all"}, {"key": "v", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, false, true, 90,
         '{"icon": "paste", "badge": "V", "tooltip": "Ctrl+V (Windows) / Cmd+V (Mac)", "tags": ["editing", "paste"], "difficulty": "easy", "frequency": "frequently"}'),
        ('Cut', 'Couper', 'editing', 'cut', 
         '[{"key": "x", "modifiers": ["ctrl"], "platform": "all"}, {"key": "x", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, false, true, 90,
         '{"icon": "scissors", "badge": "X", "tooltip": "Ctrl+X (Windows) / Cmd+X (Mac)", "tags": ["editing", "cut"], "difficulty": "easy", "frequency": "frequently"}'),
        ('Undo', 'Annuler', 'editing', 'undo', 
         '[{"key": "z", "modifiers": ["ctrl"], "platform": "all"}, {"key": "z", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, false, true, 85,
         '{"icon": "undo", "badge": "Z", "tooltip": "Ctrl+Z (Windows) / Cmd+Z (Mac)", "tags": ["editing", "undo"], "difficulty": "easy", "frequency": "frequently"}'),
        ('Redo', 'Refaire', 'editing', 'redo', 
         '[{"key": "y", "modifiers": ["ctrl"], "platform": "all"}, {"key": "y", "modifiers": ["cmd"], "platform": "mac"}, {"key": "z", "modifiers": ["ctrl", "shift"], "platform": "all"}, {"key": "z", "modifiers": ["cmd", "shift"], "platform": "mac"}]', 
         true, false, true, 85,
         '{"icon": "redo", "badge": "Y", "tooltip": "Ctrl+Y (Windows) / Cmd+Y (Mac)", "tags": ["editing", "redo"], "difficulty": "easy", "frequency": "sometimes"}'),
        ('Select All', 'Tout sélectionner', 'editing', 'select_all', 
         '[{"key": "a", "modifiers": ["ctrl"], "platform": "all"}, {"key": "a", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, false, true, 85,
         '{"icon": "select-all", "badge": "A", "tooltip": "Ctrl+A (Windows) / Cmd+A (Mac)", "tags": ["editing", "select"], "difficulty": "easy", "frequency": "often"}'),
        
        -- Documents
        ('New Document', 'Créer un nouveau document', 'documents', 'new_document', 
         '[{"key": "n", "modifiers": ["ctrl"], "platform": "all"}, {"key": "n", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, true, true, 80,
         '{"icon": "file-plus", "badge": "N", "tooltip": "Ctrl+N (Windows) / Cmd+N (Mac)", "tags": ["documents", "create"], "difficulty": "easy", "frequency": "often"}'),
        ('Open Document', 'Ouvrir un document', 'documents', 'open_document', 
         '[{"key": "o", "modifiers": ["ctrl"], "platform": "all"}, {"key": "o", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, true, true, 80,
         '{"icon": "folder-open", "badge": "O", "tooltip": "Ctrl+O (Windows) / Cmd+O (Mac)", "tags": ["documents", "open"], "difficulty": "easy", "frequency": "often"}'),
        ('Save Document', 'Sauvegarder le document', 'documents', 'save_document', 
         '[{"key": "s", "modifiers": ["ctrl"], "platform": "all"}, {"key": "s", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, true, true, 95,
         '{"icon": "save", "badge": "S", "tooltip": "Ctrl+S (Windows) / Cmd+S (Mac)", "tags": ["documents", "save"], "difficulty": "easy", "frequency": "frequently"}'),
        ('Print Document', 'Imprimer le document', 'documents', 'print_document', 
         '[{"key": "p", "modifiers": ["ctrl"], "platform": "all"}, {"key": "p", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, true, true, 70,
         '{"icon": "printer", "badge": "P", "tooltip": "Ctrl+P (Windows) / Cmd+P (Mac)", "tags": ["documents", "print"], "difficulty": "easy", "frequency": "sometimes"}'),
        
        -- UI
        ('Toggle Sidebar', 'Afficher/masquer la barre latérale', 'ui', 'toggle_sidebar', 
         '[{"key": "b", "modifiers": ["ctrl"], "platform": "all"}, {"key": "b", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, true, true, 70,
         '{"icon": "sidebar", "badge": "B", "tooltip": "Ctrl+B (Windows) / Cmd+B (Mac)", "tags": ["ui", "sidebar"], "difficulty": "easy", "frequency": "sometimes"}'),
        ('Toggle Dark Mode', 'Basculer le mode sombre', 'ui', 'toggle_dark_mode', 
         '[{"key": "d", "modifiers": ["ctrl", "shift"], "platform": "all"}, {"key": "d", "modifiers": ["cmd", "shift"], "platform": "mac"}]', 
         true, true, true, 60,
         '{"icon": "moon", "badge": "D", "tooltip": "Ctrl+Shift+D (Windows) / Cmd+Shift+D (Mac)", "tags": ["ui", "theme", "dark"], "difficulty": "easy", "frequency": "sometimes"}'),
        ('Toggle Fullscreen', 'Basculer le plein écran', 'ui', 'toggle_fullscreen', 
         '[{"key": "f11", "modifiers": [], "platform": "all"}, {"key": "f", "modifiers": ["ctrl", "shift"], "platform": "all"}, {"key": "f", "modifiers": ["cmd", "shift"], "platform": "mac"}]', 
         true, true, true, 50,
         '{"icon": "maximize", "badge": "F11", "tooltip": "F11 / Ctrl+Shift+F", "tags": ["ui", "fullscreen"], "difficulty": "easy", "frequency": "rarely"}'),
        ('Refresh', 'Actualiser la page', 'ui', 'refresh', 
         '[{"key": "f5", "modifiers": [], "platform": "all"}, {"key": "r", "modifiers": ["ctrl"], "platform": "all"}, {"key": "r", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, true, true, 65,
         '{"icon": "refresh", "badge": "F5", "tooltip": "F5 / Ctrl+R", "tags": ["ui", "refresh"], "difficulty": "easy", "frequency": "sometimes"}'),
        
        -- Productivité
        ('Focus Search', 'Focus sur la recherche', 'productivity', 'focus_search', 
         '[{"key": "/", "modifiers": [], "platform": "all"}]', 
         true, true, true, 75,
         '{"icon": "search", "badge": "/", "tooltip": "Slash", "tags": ["productivity", "focus", "search"], "difficulty": "easy", "frequency": "often"}'),
        ('Escape', 'Échapper/Fermer', 'productivity', 'escape', 
         '[{"key": "escape", "modifiers": [], "platform": "all"}]', 
         true, true, true, 100,
         '{"icon": "x", "badge": "ESC", "tooltip": "Escape", "tags": ["productivity", "escape", "close"], "difficulty": "easy", "frequency": "frequently"}'),
        ('Tab Navigation', 'Navigation par tabulation', 'productivity', 'tab_navigation', 
         '[{"key": "tab", "modifiers": [], "platform": "all"}, {"key": "tab", "modifiers": ["shift"], "platform": "all"}]', 
         true, true, true, 80,
         '{"icon": "arrow-right", "badge": "Tab", "tooltip": "Tab / Shift+Tab", "tags": ["productivity", "navigation", "tab"], "difficulty": "easy", "frequency": "frequently"}'),
        
        -- Formatage
        ('Bold', 'Mettre en gras', 'formatting', 'bold', 
         '[{"key": "b", "modifiers": ["ctrl"], "platform": "all"}, {"key": "b", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, false, true, 75,
         '{"icon": "bold", "badge": "B", "tooltip": "Ctrl+B (Windows) / Cmd+B (Mac)", "tags": ["formatting", "bold", "text"], "difficulty": "easy", "frequency": "often"}'),
        ('Italic', 'Mettre en italique', 'formatting', 'italic', 
         '[{"key": "i", "modifiers": ["ctrl"], "platform": "all"}, {"key": "i", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, false, true, 75,
         '{"icon": "italic", "badge": "I", "tooltip": "Ctrl+I (Windows) / Cmd+I (Mac)", "tags": ["formatting", "italic", "text"], "difficulty": "easy", "frequency": "often"}'),
        ('Underline', 'Souligner', 'formatting', 'underline', 
         '[{"key": "u", "modifiers": ["ctrl"], "platform": "all"}, {"key": "u", "modifiers": ["cmd"], "platform": "mac"}]', 
         true, false, true, 75,
         '{"icon": "underline", "badge": "U", "tooltip": "Ctrl+U (Windows) / Cmd+U (Mac)", "tags": ["formatting", "underline", "text"], "difficulty": "easy", "frequency": "sometimes"}')
    ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciennes données d'utilisation
CREATE OR REPLACE FUNCTION cleanup_old_shortcut_usage(p_days_old INTEGER DEFAULT 90)
RETURNS TABLE (
    cleaned_usage BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
BEGIN
    DELETE FROM shortcut_usage
    WHERE used_at < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_count as cleaned_usage;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE keyboard_shortcuts IS 'Raccourcis clavier avec actions et combinaisons';
COMMENT ON TABLE user_shortcut_preferences IS 'Préférences personnalisées des raccourcis utilisateur';
COMMENT ON TABLE shortcut_conflicts IS 'Détection et résolution des conflits de raccourcis';
COMMENT ON TABLE shortcut_usage IS 'Suivi de l\'utilisation des raccourcis';
COMMENT ON TABLE shortcut_categories IS 'Catégories pour organiser les raccourcis';
COMMENT ON TABLE shortcut_tutorials IS 'Tutoriels pour apprendre les raccourcis';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN keyboard_shortcuts.keys IS 'Combinaisons de touches avec modificateurs et plateforme';
COMMENT ON COLUMN keyboard_shortcuts.metadata IS 'Métadonnées du raccourci {icon, badge, tooltip, tags, difficulty, frequency}';
COMMENT ON COLUMN user_shortcut_preferences.custom_keys IS 'Combinaisons de touches personnalisées par l\'utilisateur';
COMMENT ON COLUMN user_shortcut_preferences.metadata IS 'Métadonnées des préférences {notes, difficulty, learned, favorite}';
COMMENT ON COLUMN shortcut_conflicts.metadata IS 'Métadonnées du conflit {conflictingKeys, conflictingActions, context, platform}';
COMMENT ON COLUMN shortcut_usage.metadata IS 'Métadonnées de l\'utilisation {platform, browser, userAgent, screenResolution}';

-- Créer les données par défaut
SELECT create_default_shortcut_categories();
SELECT create_default_keyboard_shortcuts();
