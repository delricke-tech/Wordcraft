-- Migration: Création des tables pour les thèmes avancés (mode sombre et personnalisés)
-- Date: 11 mars 2026
-- Description: Tables pour gérer les thèmes personnalisés, préférences utilisateur et configurations

-- Table des thèmes
CREATE TABLE IF NOT EXISTS themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('light', 'dark', 'auto', 'custom')),
    is_system BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    colors JSONB NOT NULL DEFAULT '{}',
    typography JSONB NOT NULL DEFAULT '{}',
    spacing JSONB NOT NULL DEFAULT '{}',
    shadows JSONB NOT NULL DEFAULT '{}',
    borders JSONB NOT NULL DEFAULT '{}',
    animations JSONB NOT NULL DEFAULT '{}',
    custom_css TEXT,
    variables JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    tags TEXT[] DEFAULT '{}'
);

-- Table des préférences de thèmes utilisateurs
CREATE TABLE IF NOT EXISTS user_theme_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
    auto_switch BOOLEAN DEFAULT false,
    schedule_enabled BOOLEAN DEFAULT false,
    schedule JSONB DEFAULT '{}',
    customizations JSONB DEFAULT '{}',
    accessibility JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table des sessions de thèmes (pour suivre l'utilisation)
CREATE TABLE IF NOT EXISTS theme_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- en secondes
    device_info JSONB DEFAULT '{}',
    context JSONB DEFAULT '{}',
    interactions JSONB DEFAULT '[]',
    customizations_applied JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exports de thèmes
CREATE TABLE IF NOT EXISTS theme_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    export_format VARCHAR(20) NOT NULL CHECK (export_format IN ('json', 'css', 'scss', 'tailwind')),
    export_data JSONB NOT NULL,
    file_name VARCHAR(255),
    download_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    public_token UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Table des évaluations de thèmes
CREATE TABLE IF NOT EXISTS theme_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(theme_id, user_id)
);

-- Index pour les performances
CREATE INDEX idx_themes_name ON themes(name);
CREATE INDEX idx_themes_type ON themes(type);
CREATE INDEX idx_themes_is_system ON themes(is_system);
CREATE INDEX idx_themes_is_default ON themes(is_default);
CREATE INDEX idx_themes_is_active ON themes(is_active);
CREATE INDEX idx_themes_created_by ON themes(created_by);
CREATE INDEX idx_themes_usage_count ON themes(usage_count DESC);
CREATE INDEX idx_themes_rating ON themes(rating DESC);
CREATE INDEX idx_themes_created_at ON themes(created_at DESC);
CREATE INDEX idx_themes_tags ON themes USING gin(tags);

CREATE INDEX idx_user_theme_preferences_user_id ON user_theme_preferences(user_id);
CREATE INDEX idx_user_theme_preferences_theme_id ON user_theme_preferences(theme_id);
CREATE INDEX idx_user_theme_preferences_auto_switch ON user_theme_preferences(auto_switch);
CREATE INDEX idx_user_theme_preferences_schedule_enabled ON user_theme_preferences(schedule_enabled);
CREATE INDEX idx_user_theme_preferences_last_used_at ON user_theme_preferences(last_used_at DESC);

CREATE INDEX idx_theme_sessions_user_id ON theme_sessions(user_id);
CREATE INDEX idx_theme_sessions_theme_id ON theme_sessions(theme_id);
CREATE INDEX idx_theme_sessions_session_start ON theme_sessions(session_start DESC);
CREATE INDEX idx_theme_sessions_duration ON theme_sessions(duration DESC);

CREATE INDEX idx_theme_exports_theme_id ON theme_exports(theme_id);
CREATE INDEX idx_theme_exports_user_id ON theme_exports(user_id);
CREATE INDEX idx_theme_exports_export_format ON theme_exports(export_format);
CREATE INDEX idx_theme_exports_is_public ON theme_exports(is_public);
CREATE INDEX idx_theme_exports_public_token ON theme_exports(public_token);
CREATE INDEX idx_theme_exports_created_at ON theme_exports(created_at DESC);

CREATE INDEX idx_theme_ratings_theme_id ON theme_ratings(theme_id);
CREATE INDEX idx_theme_ratings_user_id ON theme_ratings(user_id);
CREATE INDEX idx_theme_ratings_rating ON theme_ratings(rating DESC);
CREATE INDEX idx_theme_ratings_created_at ON theme_ratings(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_themes_updated_at 
    BEFORE UPDATE ON themes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_theme_preferences_updated_at 
    BEFORE UPDATE ON user_theme_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_theme_ratings_updated_at 
    BEFORE UPDATE ON theme_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour le compteur d'utilisation
CREATE OR REPLACE FUNCTION increment_theme_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE themes
    SET usage_count = usage_count + 1
    WHERE id = NEW.theme_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_theme_usage
    AFTER INSERT ON user_theme_preferences
    FOR EACH ROW EXECUTE FUNCTION increment_theme_usage();

-- Trigger pour mettre à jour la note moyenne
CREATE OR REPLACE FUNCTION update_theme_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE themes
    SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM theme_ratings
        WHERE theme_id = COALESCE(NEW.theme_id, OLD.theme_id)
    )
    WHERE id = COALESCE(NEW.theme_id, OLD.theme_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_theme_rating
    AFTER INSERT OR UPDATE OR DELETE ON theme_ratings
    FOR EACH ROW EXECUTE FUNCTION update_theme_rating();

-- Politiques RLS pour les thèmes
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active themes" ON themes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own themes" ON themes
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create themes" ON themes
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own themes" ON themes
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own themes" ON themes
    FOR DELETE USING (created_by = auth.uid());

-- Politiques RLS pour les préférences utilisateur
ALTER TABLE user_theme_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own theme preferences" ON user_theme_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own theme preferences" ON user_theme_preferences
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les sessions de thèmes
ALTER TABLE theme_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own theme sessions" ON theme_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own theme sessions" ON theme_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour les exports de thèmes
ALTER TABLE theme_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own theme exports" ON theme_exports
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view public theme exports" ON theme_exports
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create theme exports" ON theme_exports
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own theme exports" ON theme_exports
    FOR UPDATE USING (user_id = auth.uid());

-- Politiques RLS pour les évaluations
ALTER TABLE theme_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view theme ratings" ON theme_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can create theme ratings" ON theme_ratings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own theme ratings" ON theme_ratings
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own theme ratings" ON theme_ratings
    FOR DELETE USING (user_id = auth.uid());

-- Fonctions RPC pour les thèmes

-- Fonction pour obtenir les statistiques des thèmes
CREATE OR REPLACE FUNCTION get_theme_stats()
RETURNS TABLE (
    total_themes BIGINT,
    active_themes BIGINT,
    system_themes BIGINT,
    custom_themes BIGINT,
    usage_by_type JSONB,
    top_themes JSONB,
    user_preferences JSONB,
    customizations JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH theme_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_active = true) as active,
            COUNT(*) FILTER (WHERE is_system = true) as system,
            COUNT(*) FILTER (WHERE is_system = false) as custom
        FROM themes
    ),
    type_distribution AS (
        SELECT jsonb_object_agg(type, type_count)
        FROM (
            SELECT 
                type,
                COUNT(*) as type_count
            FROM themes
            WHERE is_active = true
            GROUP BY type
        ) dist
    ),
    top_themes_stats AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'themeId', t.id,
                'themeName', t.display_name,
                'usageCount', t.usage_count
            )
        )
        FROM (
            SELECT 
                t.id,
                t.display_name,
                t.usage_count
            FROM themes t
            WHERE t.is_active = true
            ORDER BY t.usage_count DESC
            LIMIT 10
        ) top_themes
    ),
    user_preferences_stats AS (
        SELECT jsonb_build_object(
            'totalUsers', COUNT(DISTINCT utp.user_id),
            'autoSwitchEnabled', COUNT(*) FILTER (WHERE auto_switch = true),
            'scheduleEnabled', COUNT(*) FILTER (WHERE schedule_enabled = true),
            'accessibilityEnabled', COUNT(*) FILTER (WHERE (accessibility->>'reducedMotion')::boolean OR (accessibility->>'highContrast')::boolean OR (accessibility->>'largeText')::boolean)
        )
        FROM user_theme_preferences utp
    ),
    customizations_stats AS (
        SELECT jsonb_build_object(
            'colorCustomizations', COUNT(*) FILTER (WHERE jsonb_typeof(customizations->'colorOverrides') = 'object'),
            'fontCustomizations', COUNT(*) FILTER (WHERE jsonb_typeof(customizations->'fontOverrides') = 'object'),
            'accessibilityCustomizations', COUNT(*) FILTER (WHERE jsonb_typeof(accessibility) = 'object')
        )
        FROM user_theme_preferences
    )
    SELECT 
        ts.total as total_themes,
        ts.active as active_themes,
        ts.system as system_themes,
        ts.custom as custom_themes,
        td.type_distribution as usage_by_type,
        tt.top_themes_stats as top_themes,
        up.user_preferences_stats as user_preferences,
        cs.customizations_stats as customizations
    FROM theme_stats ts, type_distribution td, top_themes_stats tt,
         user_preferences_stats up, customizations_stats cs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les thèmes système par défaut
CREATE OR REPLACE FUNCTION create_default_themes()
RETURNS VOID AS $$
BEGIN
    -- Thème clair par défaut
    INSERT INTO themes (name, display_name, description, type, is_system, is_default, 
                        colors, typography, spacing, shadows, borders, animations, variables, tags)
    VALUES (
        'default-light',
        'Clair par défaut',
        'Thème clair par défaut avec des couleurs douces et modernes',
        'light',
        true,
        true,
        '{
            "primary": "#3B82F6",
            "primaryHover": "#2563EB",
            "primaryActive": "#1D4ED8",
            "primaryContrast": "#FFFFFF",
            "secondary": "#6B7280",
            "secondaryHover": "#4B5563",
            "secondaryActive": "#374151",
            "secondaryContrast": "#FFFFFF",
            "background": "#FFFFFF",
            "backgroundSecondary": "#F9FAFB",
            "backgroundTertiary": "#F3F4F6",
            "backgroundInverse": "#111827",
            "surface": "#FFFFFF",
            "surfaceSecondary": "#F9FAFB",
            "surfaceTertiary": "#F3F4F6",
            "surfaceInverse": "#1F2937",
            "text": "#111827",
            "textSecondary": "#6B7280",
            "textTertiary": "#9CA3AF",
            "textInverse": "#F9FAFB",
            "textOnPrimary": "#FFFFFF",
            "textOnSecondary": "#FFFFFF",
            "textOnSurface": "#111827",
            "border": "#E5E7EB",
            "borderSecondary": "#D1D5DB",
            "borderTertiary": "#9CA3AF",
            "borderInverse": "#374151",
            "success": "#10B981",
            "successHover": "#059669",
            "successActive": "#047857",
            "successContrast": "#FFFFFF",
            "warning": "#F59E0B",
            "warningHover": "#D97706",
            "warningActive": "#B45309",
            "warningContrast": "#FFFFFF",
            "error": "#EF4444",
            "errorHover": "#DC2626",
            "errorActive": "#B91C1C",
            "errorContrast": "#FFFFFF",
            "info": "#3B82F6",
            "infoHover": "#2563EB",
            "infoActive": "#1D4ED8",
            "infoContrast": "#FFFFFF",
            "gray50": "#F9FAFB",
            "gray100": "#F3F4F6",
            "gray200": "#E5E7EB",
            "gray300": "#D1D5DB",
            "gray400": "#9CA3AF",
            "gray500": "#6B7280",
            "gray600": "#4B5563",
            "gray700": "#374151",
            "gray800": "#1F2937",
            "gray900": "#111827",
            "gray950": "#030712"
        }'::jsonb,
        '{
            "fontFamily": {
                "sans": ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
                "serif": ["Georgia", "Cambria", "Times New Roman", "Times", "serif"],
                "mono": ["JetBrains Mono", "Fira Code", "Consolas", "Monaco", "monospace"]
            },
            "fontSize": {
                "xs": "0.75rem",
                "sm": "0.875rem",
                "base": "1rem",
                "lg": "1.125rem",
                "xl": "1.25rem",
                "2xl": "1.5rem",
                "3xl": "1.875rem",
                "4xl": "2.25rem",
                "5xl": "3rem",
                "6xl": "3.75rem"
            },
            "fontWeight": {
                "thin": 100,
                "light": 300,
                "normal": 400,
                "medium": 500,
                "semibold": 600,
                "bold": 700,
                "extrabold": 800
            },
            "lineHeight": {
                "tight": 1.25,
                "normal": 1.5,
                "relaxed": 1.75
            },
            "letterSpacing": {
                "tight": "-0.025em",
                "normal": "0",
                "wide": "0.025em"
            }
        }'::jsonb,
        '{
            "xs": "0.25rem",
            "sm": "0.5rem",
            "md": "1rem",
            "lg": "1.5rem",
            "xl": "2rem",
            "2xl": "3rem",
            "3xl": "4rem",
            "4xl": "5rem",
            "5xl": "6rem",
            "6xl": "8rem",
            "container": "75rem",
            "section": "4rem",
            "card": "1.5rem",
            "button": "0.5rem",
            "input": "0.5rem",
            "modal": "1.5rem"
        }'::jsonb,
        '{
            "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            "base": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            "inner": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
            "outline": "0 0 0 3px rgba(59, 130, 246, 0.5)",
            "none": "none",
            "colored": {
                "success": "0 4px 6px -1px rgba(16, 185, 129, 0.1)",
                "warning": "0 4px 6px -1px rgba(245, 158, 11, 0.1)",
                "error": "0 4px 6px -1px rgba(239, 68, 68, 0.1)",
                "info": "0 4px 6px -1px rgba(59, 130, 246, 0.1)"
            }
        }'::jsonb,
        '{
            "none": "none",
            "thin": "1px solid",
            "base": "2px solid",
            "thick": "4px solid",
            "rounded": {
                "none": "0",
                "sm": "0.125rem",
                "base": "0.25rem",
                "md": "0.375rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            }
        }'::jsonb,
        '{
            "duration": {
                "fast": "150ms",
                "normal": "300ms",
                "slow": "500ms"
            },
            "easing": {
                "linear": "linear",
                "ease": "cubic-bezier(0.4, 0, 0.2, 1)",
                "easeIn": "cubic-bezier(0.4, 0, 1, 1)",
                "easeOut": "cubic-bezier(0, 0, 0.2, 1)",
                "easeInOut": "cubic-bezier(0.4, 0, 0.2, 1)"
            },
            "spin": "spin 1s linear infinite",
            "bounce": "bounce 1s infinite",
            "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            "shake": "shake 0.5s ease-in-out infinite",
            "fadeIn": "fadeIn 0.3s ease-in-out",
            "slideUp": "slideUp 0.3s ease-out",
            "slideDown": "slideDown 0.3s ease-out",
            "slideLeft": "slideLeft 0.3s ease-out",
            "slideRight": "slideRight 0.3s ease-out"
        }'::jsonb,
        '{
            "custom": {},
            "media": {
                "mobile": "(max-width: 640px)",
                "tablet": "(max-width: 768px)",
                "desktop": "(max-width: 1024px)",
                "wide": "(max-width: 1280px)"
            },
            "accessibility": {
                "reducedMotion": "(prefers-reduced-motion: reduce)",
                "highContrast": "(prefers-contrast: high)",
                "largeText": "(prefers-reduced-motion: reduce)"
            }
        }'::jsonb,
        ARRAY['default', 'light', 'system']
    )
    ON CONFLICT (name) DO NOTHING;

    -- Thème sombre par défaut
    INSERT INTO themes (name, display_name, description, type, is_system, is_default,
                        colors, typography, spacing, shadows, borders, animations, variables, tags)
    VALUES (
        'default-dark',
        'Sombre par défaut',
        'Thème sombre par défaut avec des couleurs profondes et confortables',
        'dark',
        true,
        false,
        '{
            "primary": "#60A5FA",
            "primaryHover": "#3B82F6",
            "primaryActive": "#2563EB",
            "primaryContrast": "#FFFFFF",
            "secondary": "#9CA3AF",
            "secondaryHover": "#6B7280",
            "secondaryActive": "#4B5563",
            "secondaryContrast": "#FFFFFF",
            "background": "#111827",
            "backgroundSecondary": "#1F2937",
            "backgroundTertiary": "#374151",
            "backgroundInverse": "#F9FAFB",
            "surface": "#1F2937",
            "surfaceSecondary": "#374151",
            "surfaceTertiary": "#4B5563",
            "surfaceInverse": "#FFFFFF",
            "text": "#F9FAFB",
            "textSecondary": "#D1D5DB",
            "textTertiary": "#9CA3AF",
            "textInverse": "#111827",
            "textOnPrimary": "#FFFFFF",
            "textOnSecondary": "#FFFFFF",
            "textOnSurface": "#F9FAFB",
            "border": "#374151",
            "borderSecondary": "#4B5563",
            "borderTertiary": "#6B7280",
            "borderInverse": "#E5E7EB",
            "success": "#34D399",
            "successHover": "#10B981",
            "successActive": "#059669",
            "successContrast": "#FFFFFF",
            "warning": "#FBBF24",
            "warningHover": "#F59E0B",
            "warningActive": "#D97706",
            "warningContrast": "#000000",
            "error": "#F87171",
            "errorHover": "#EF4444",
            "errorActive": "#DC2626",
            "errorContrast": "#FFFFFF",
            "info": "#60A5FA",
            "infoHover": "#3B82F6",
            "infoActive": "#2563EB",
            "infoContrast": "#FFFFFF",
            "gray50": "#F9FAFB",
            "gray100": "#F3F4F6",
            "gray200": "#E5E7EB",
            "gray300": "#D1D5DB",
            "gray400": "#9CA3AF",
            "gray500": "#6B7280",
            "gray600": "#4B5563",
            "gray700": "#374151",
            "gray800": "#1F2937",
            "gray900": "#111827",
            "gray950": "#030712"
        }'::jsonb,
        '{
            "fontFamily": {
                "sans": ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
                "serif": ["Georgia", "Cambria", "Times New Roman", "Times", "serif"],
                "mono": ["JetBrains Mono", "Fira Code", "Consolas", "Monaco", "monospace"]
            },
            "fontSize": {
                "xs": "0.75rem",
                "sm": "0.875rem",
                "base": "1rem",
                "lg": "1.125rem",
                "xl": "1.25rem",
                "2xl": "1.5rem",
                "3xl": "1.875rem",
                "4xl": "2.25rem",
                "5xl": "3rem",
                "6xl": "3.75rem"
            },
            "fontWeight": {
                "thin": 100,
                "light": 300,
                "normal": 400,
                "medium": 500,
                "semibold": 600,
                "bold": 700,
                "extrabold": 800
            },
            "lineHeight": {
                "tight": 1.25,
                "normal": 1.5,
                "relaxed": 1.75
            },
            "letterSpacing": {
                "tight": "-0.025em",
                "normal": "0",
                "wide": "0.025em"
            }
        }'::jsonb,
        '{
            "xs": "0.25rem",
            "sm": "0.5rem",
            "md": "1rem",
            "lg": "1.5rem",
            "xl": "2rem",
            "2xl": "3rem",
            "3xl": "4rem",
            "4xl": "5rem",
            "5xl": "6rem",
            "6xl": "8rem",
            "container": "75rem",
            "section": "4rem",
            "card": "1.5rem",
            "button": "0.5rem",
            "input": "0.5rem",
            "modal": "1.5rem"
        }'::jsonb,
        '{
            "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
            "base": "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)",
            "md": "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)",
            "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)",
            "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)",
            "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            "inner": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)",
            "outline": "0 0 0 3px rgba(96, 165, 250, 0.5)",
            "none": "none",
            "colored": {
                "success": "0 4px 6px -1px rgba(52, 211, 153, 0.2)",
                "warning": "0 4px 6px -1px rgba(251, 191, 36, 0.2)",
                "error": "0 4px 6px -1px rgba(248, 113, 113, 0.2)",
                "info": "0 4px 6px -1px rgba(96, 165, 250, 0.2)"
            }
        }'::jsonb,
        '{
            "none": "none",
            "thin": "1px solid",
            "base": "2px solid",
            "thick": "4px solid",
            "rounded": {
                "none": "0",
                "sm": "0.125rem",
                "base": "0.25rem",
                "md": "0.375rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            }
        }'::jsonb,
        '{
            "duration": {
                "fast": "150ms",
                "normal": "300ms",
                "slow": "500ms"
            },
            "easing": {
                "linear": "linear",
                "ease": "cubic-bezier(0.4, 0, 0.2, 1)",
                "easeIn": "cubic-bezier(0.4, 0, 1, 1)",
                "easeOut": "cubic-bezier(0, 0, 0.2, 1)",
                "easeInOut": "cubic-bezier(0.4, 0, 0.2, 1)"
            },
            "spin": "spin 1s linear infinite",
            "bounce": "bounce 1s infinite",
            "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            "shake": "shake 0.5s ease-in-out infinite",
            "fadeIn": "fadeIn 0.3s ease-in-out",
            "slideUp": "slideUp 0.3s ease-out",
            "slideDown": "slideDown 0.3s ease-out",
            "slideLeft": "slideLeft 0.3s ease-out",
            "slideRight": "slideRight 0.3s ease-out"
        }'::jsonb,
        '{
            "custom": {},
            "media": {
                "mobile": "(max-width: 640px)",
                "tablet": "(max-width: 768px)",
                "desktop": "(max-width: 1024px)",
                "wide": "(max-width: 1280px)"
            },
            "accessibility": {
                "reducedMotion": "(prefers-reduced-motion: reduce)",
                "highContrast": "(prefers-contrast: high)",
                "largeText": "(prefers-reduced-motion: reduce)"
            }
        }'::jsonb,
        ARRAY['default', 'dark', 'system']
    )
    ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciens exports de thèmes
CREATE OR REPLACE FUNCTION cleanup_old_theme_exports(p_days_old INTEGER DEFAULT 30)
RETURNS TABLE (
    cleaned_exports BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
BEGIN
    DELETE FROM theme_exports
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days_old
    OR (expires_at IS NOT NULL AND expires_at < NOW());
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_count as cleaned_exports;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE themes IS 'Thèmes personnalisés avec couleurs, typographie et animations';
COMMENT ON TABLE user_theme_preferences IS 'Préférences de thèmes utilisateurs avec personnalisation';
COMMENT ON TABLE theme_sessions IS 'Sessions dutilisation des thèmes pour les statistiques';
COMMENT ON TABLE theme_exports IS 'Exports de thèmes dans différents formats';
COMMENT ON TABLE theme_ratings IS 'Évaluations et avis des utilisateurs sur les thèmes';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN themes.colors IS 'Palette de couleurs complète du thème';
COMMENT ON COLUMN themes.typography IS 'Configuration typographique (polices, tailles, poids)';
COMMENT ON COLUMN themes.spacing IS 'Échelle d\'espacement du thème';
COMMENT ON COLUMN themes.shadows IS 'Ombres et effets visuels du thème';
COMMENT ON COLUMN themes.custom_css IS 'CSS personnalisé additionnel';
COMMENT ON COLUMN themes.variables IS 'Variables CSS personnalisées';
COMMENT ON COLUMN user_theme_preferences.auto_switch IS 'Basculement automatique selon l\'heure';
COMMENT ON COLUMN user_theme_preferences.schedule IS 'Configuration horaire pour le basculement';
COMMENT ON COLUMN user_theme_preferences.customizations IS 'Modifications personnalisées du thème';
COMMENT ON COLUMN user_theme_preferences.accessibility IS 'Paramètres d\'accessibilité';

-- Créer les thèmes système par défaut
SELECT create_default_themes();
