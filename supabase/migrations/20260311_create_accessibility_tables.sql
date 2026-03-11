-- Migration: Création des tables pour l'accessibilité avancée (screen readers)
-- Date: 11 mars 2026
-- Description: Tables pour gérer les profils d'accessibilité, les préférences et les statistiques

-- Table des profils d'accessibilité
CREATE TABLE IF NOT EXISTS accessibility_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB NOT NULL DEFAULT '{}',
    preferences JSONB NOT NULL DEFAULT '{}',
    customizations JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sessions d'accessibilité
CREATE TABLE IF NOT EXISTS accessibility_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES accessibility_profiles(id) ON DELETE SET NULL,
    device_id VARCHAR(255),
    session_id VARCHAR(255) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    features_used JSONB DEFAULT '{}',
    interactions JSONB DEFAULT '{}',
    performance JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Table des événements d'accessibilité
CREATE TABLE IF NOT EXISTS accessibility_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES accessibility_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('screen_reader_start', 'screen_reader_stop', 'voice_command', 'keyboard_shortcut', 'visual_aid_toggle', 'profile_switch', 'error', 'interaction', 'performance')),
    event_data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Table des préférences par défaut
CREATE TABLE IF NOT EXISTS accessibility_default_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category)
);

-- Table des appareils supportés
CREATE TABLE IF NOT EXISTS accessibility_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) NOT NULL UNIQUE,
    user_agent TEXT,
    platform VARCHAR(100),
    capabilities JSONB DEFAULT '{}',
    screen_reader_support JSONB DEFAULT '{}',
    voice_recognition_support JSONB DEFAULT '{}',
    keyboard_support JSONB DEFAULT '{}',
    touch_support JSONB DEFAULT '{}',
    browser_info JSONB DEFAULT '{}',
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Table des statistiques d'accessibilité
CREATE TABLE IF NOT EXISTS accessibility_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    device_id VARCHAR(255),
    date DATE NOT NULL,
    session_count INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    feature_usage JSONB DEFAULT '{}',
    interaction_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    performance_metrics JSONB DEFAULT '{}',
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_id, date)
);

-- Table des commandes vocales personnalisées
CREATE TABLE IF NOT EXISTS accessibility_voice_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES accessibility_profiles(id) ON DELETE CASCADE,
    phrase VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    parameters JSONB DEFAULT '{}',
    confidence_threshold DECIMAL(3,2) DEFAULT 0.80 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 1),
    is_enabled BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des raccourcis clavier personnalisés
CREATE TABLE IF NOT EXISTS accessibility_keyboard_shortcuts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES accessibility_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    keys TEXT[] NOT NULL,
    category VARCHAR(50) NOT NULL,
    action VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    is_global BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des styles personnalisés
CREATE TABLE IF NOT EXISTS accessibility_user_styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES accessibility_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    css_content TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_accessibility_profiles_user_id ON accessibility_profiles(user_id);
CREATE INDEX idx_accessibility_profiles_is_active ON accessibility_profiles(is_active);
CREATE INDEX idx_accessibility_profiles_is_default ON accessibility_profiles(is_default);
CREATE INDEX idx_accessibility_profiles_created_at ON accessibility_profiles(created_at DESC);

CREATE INDEX idx_accessibility_sessions_user_id ON accessibility_sessions(user_id);
CREATE INDEX idx_accessibility_sessions_profile_id ON accessibility_sessions(profile_id);
CREATE INDEX idx_accessibility_sessions_session_id ON accessibility_sessions(session_id);
CREATE INDEX idx_accessibility_sessions_started_at ON accessibility_sessions(started_at DESC);
CREATE INDEX idx_accessibility_sessions_device_id ON accessibility_sessions(device_id);

CREATE INDEX idx_accessibility_events_session_id ON accessibility_events(session_id);
CREATE INDEX idx_accessibility_events_user_id ON accessibility_events(user_id);
CREATE INDEX idx_accessibility_events_event_type ON accessibility_events(event_type);
CREATE INDEX idx_accessibility_events_timestamp ON accessibility_events(timestamp DESC);
CREATE INDEX idx_accessibility_events_success ON accessibility_events(success);

CREATE INDEX idx_accessibility_default_preferences_category ON accessibility_default_preferences(category);
CREATE INDEX idx_accessibility_default_preferences_is_active ON accessibility_default_preferences(is_active);
CREATE INDEX idx_accessibility_default_preferences_priority ON accessibility_default_preferences(priority);

CREATE INDEX idx_accessibility_devices_device_id ON accessibility_devices(device_id);
CREATE INDEX idx_accessibility_devices_platform ON accessibility_devices(platform);
CREATE INDEX idx_accessibility_devices_is_active ON accessibility_devices(is_active);
CREATE INDEX idx_accessibility_devices_last_seen_at ON accessibility_devices(last_seen_at DESC);

CREATE INDEX idx_accessibility_statistics_user_id ON accessibility_statistics(user_id);
CREATE INDEX idx_accessibility_statistics_device_id ON accessibility_statistics(device_id);
CREATE INDEX idx_accessibility_statistics_date ON accessibility_statistics(date);
CREATE INDEX idx_accessibility_statistics_created_at ON accessibility_statistics(created_at DESC);

CREATE INDEX idx_accessibility_voice_commands_user_id ON accessibility_voice_commands(user_id);
CREATE INDEX idx_accessibility_voice_commands_profile_id ON accessibility_voice_commands(profile_id);
CREATE INDEX idx_accessibility_voice_commands_phrase ON accessibility_voice_commands(phrase);
CREATE INDEX idx_accessibility_voice_commands_is_enabled ON accessibility_voice_commands(is_enabled);
CREATE INDEX idx_accessibility_voice_commands_usage_count ON accessibility_voice_commands(usage_count DESC);

CREATE INDEX idx_accessibility_keyboard_shortcuts_user_id ON accessibility_keyboard_shortcuts(user_id);
CREATE INDEX idx_accessibility_keyboard_shortcuts_profile_id ON accessibility_keyboard_shortcuts(profile_id);
CREATE INDEX idx_accessibility_keyboard_shortcuts_category ON accessibility_keyboard_shortcuts(category);
CREATE INDEX idx_accessibility_keyboard_shortcuts_is_enabled ON accessibility_keyboard_shortcuts(is_enabled);
CREATE INDEX idx_accessibility_keyboard_shortcuts_usage_count ON accessibility_keyboard_shortcuts(usage_count DESC);

CREATE INDEX idx_accessibility_user_styles_user_id ON accessibility_user_styles(user_id);
CREATE INDEX idx_accessibility_user_styles_profile_id ON accessibility_user_styles(profile_id);
CREATE INDEX idx_accessibility_user_styles_is_enabled ON accessibility_user_styles(is_enabled);
CREATE INDEX idx_accessibility_user_styles_is_active ON accessibility_user_styles(is_active);
CREATE INDEX idx_accessibility_user_styles_usage_count ON accessibility_user_styles(usage_count DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_accessibility_profiles_updated_at 
    BEFORE UPDATE ON accessibility_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessibility_sessions_updated_at 
    BEFORE UPDATE ON accessibility_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessibility_default_preferences_updated_at 
    BEFORE UPDATE ON accessibility_default_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessibility_devices_updated_at 
    BEFORE UPDATE ON accessibility_devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessibility_statistics_updated_at 
    BEFORE UPDATE ON accessibility_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessibility_voice_commands_updated_at 
    BEFORE UPDATE ON accessibility_voice_commands 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessibility_keyboard_shortcuts_updated_at 
    BEFORE UPDATE ON accessibility_keyboard_shortcuts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessibility_user_styles_updated_at 
    BEFORE UPDATE ON accessibility_user_styles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les compteurs d'utilisation
CREATE OR REPLACE FUNCTION increment_voice_command_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE accessibility_voice_commands
    SET usage_count = usage_count + 1,
        success_count = success_count + 1,
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_voice_command_usage
    AFTER INSERT ON accessibility_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'voice_command' AND NEW.success = true)
    EXECUTE FUNCTION increment_voice_command_usage();

CREATE OR REPLACE FUNCTION increment_keyboard_shortcut_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE accessibility_keyboard_shortcuts
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = (NEW.event_data->>'shortcut_id')::UUID;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_keyboard_shortcut_usage
    AFTER INSERT ON accessibility_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'keyboard_shortcut' AND NEW.success = true)
    EXECUTE FUNCTION increment_keyboard_shortcut_usage();

CREATE OR REPLACE FUNCTION increment_user_style_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE accessibility_user_styles
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = (NEW.event_data->>'style_id')::UUID;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_user_style_usage
    AFTER INSERT ON accessibility_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'visual_aid_toggle' AND NEW.success = true)
    EXECUTE FUNCTION increment_user_style_usage();

-- Politiques RLS pour les profils d'accessibilité
ALTER TABLE accessibility_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own accessibility profiles" ON accessibility_profiles
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all accessibility profiles" ON accessibility_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les sessions
ALTER TABLE accessibility_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accessibility sessions" ON accessibility_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all accessibility sessions" ON accessibility_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les événements
ALTER TABLE accessibility_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accessibility events" ON accessibility_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all accessibility events" ON accessibility_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les préférences par défaut
ALTER TABLE accessibility_default_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active default preferences" ON accessibility_default_preferences
    FOR SELECT USING (is_active = true);

-- Politiques RLS pour les appareils
ALTER TABLE accessibility_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accessibility devices" ON accessibility_devices
    FOR SELECT USING (
        device_id IN (
            SELECT metadata->>'deviceId' 
            FROM accessibility_sessions 
            WHERE user_id = auth.uid()
        )
    );

-- Politiques RLS pour les statistiques
ALTER TABLE accessibility_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accessibility statistics" ON accessibility_statistics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all accessibility statistics" ON accessibility_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les commandes vocales
ALTER TABLE accessibility_voice_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own voice commands" ON accessibility_voice_commands
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les raccourcis clavier
ALTER TABLE accessibility_keyboard_shortcuts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own keyboard shortcuts" ON accessibility_keyboard_shortcuts
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les styles personnalisés
ALTER TABLE accessibility_user_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own user styles" ON accessibility_user_styles
    FOR ALL USING (user_id = auth.uid());

-- Fonctions RPC pour l'accessibilité

-- Fonction pour obtenir les statistiques d'accessibilité
CREATE OR REPLACE FUNCTION get_accessibility_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_users BIGINT,
    active_profiles BIGINT,
    profiles_by_type JSONB,
    feature_usage JSONB,
    device_support JSONB,
    user_satisfaction JSONB,
    performance JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH profile_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_active = true) as active
        FROM accessibility_profiles
    ),
    profile_types AS (
        SELECT jsonb_object_agg(
            COALESCE(settings->>'screenReader'->>'enabled', 'false'), 
            COUNT(*)
        )
        FROM (
            SELECT 
                CASE 
                    WHEN (settings->>'screenReader'->>'enabled')::boolean = true THEN 'screenReader'
                    WHEN (settings->>'keyboardNavigation'->>'enabled')::boolean = true THEN 'keyboardNavigation'
                    WHEN (settings->>'voiceCommands'->>'enabled')::boolean = true THEN 'voiceCommands'
                    WHEN (settings->>'visualAids'->>'highContrast')::boolean = true THEN 'visualAids'
                    WHEN (settings->>'colorBlindness'->>'enabled')::boolean = true THEN 'colorBlindness'
                    WHEN (settings->>'motorAssistance'->>'stickyKeys')::boolean = true THEN 'motorAssistance'
                    WHEN (settings->>'cognitiveAssistance'->>'simplifiedUI')::boolean = true THEN 'cognitiveAssistance'
                    ELSE 'other'
                END as feature_type,
                COUNT(*) as count
            FROM accessibility_profiles
            WHERE is_active = true
            GROUP BY 
                CASE 
                    WHEN (settings->>'screenReader'->>'enabled')::boolean = true THEN 'screenReader'
                    WHEN (settings->>'keyboardNavigation'->>'enabled')::boolean = true THEN 'keyboardNavigation'
                    WHEN (settings->>'voiceCommands'->>'enabled')::boolean = true THEN 'voiceCommands'
                    WHEN (settings->>'visualAids'->>'highContrast')::boolean = true THEN 'visualAids'
                    WHEN (settings->>'colorBlindness'->>'enabled')::boolean = true THEN 'colorBlindness'
                    WHEN (settings->>'motorAssistance'->>'stickyKeys')::boolean = true THEN 'motorAssistance'
                    WHEN (settings->>'cognitiveAssistance'->>'simplifiedUI')::boolean = true THEN 'cognitiveAssistance'
                    ELSE 'other'
                END
        ) feature_counts
    ),
    feature_usage_stats AS (
        SELECT jsonb_build_object(
            'screenReader', COUNT(*) FILTER (WHERE event_type = 'screen_reader_start'),
            'keyboardNavigation', COUNT(*) FILTER (WHERE event_type = 'keyboard_shortcut'),
            'voiceCommands', COUNT(*) FILTER (WHERE event_type = 'voice_command'),
            'visualAids', COUNT(*) FILTER (WHERE event_type = 'visual_aid_toggle'),
            'colorBlindness', COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM jsonb_array_elements(event_data->>'features_used') WHERE value = 'colorBlindness') > 0),
            'motorAssistance', COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM jsonb_array_elements(event_data->>'features_used') WHERE value = 'motorAssistance') > 0),
            'cognitiveAssistance', COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM jsonb_array_elements(event_data->>'features_used') WHERE value = 'cognitiveAssistance') > 0)
        )
        FROM accessibility_events
        WHERE DATE(timestamp) = p_date
    ),
    device_support_stats AS (
        SELECT jsonb_build_object(
            'screenReaders', jsonb_object_agg(
                COALESCE(screen_reader_support->>'type', 'unknown'), 
                COUNT(*)
            ),
            'voiceRecognition', jsonb_object_agg(
                COALESCE(voice_recognition_support->>'type', 'unknown'), 
                COUNT(*)
            ),
            'brailleDisplays', COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM jsonb_array_elements(capabilities->>'supported') WHERE value = 'braille') > 0),
            'switchDevices', COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM jsonb_array_elements(capabilities->>'supported') WHERE value = 'switch') > 0)
        )
        FROM accessibility_devices
        WHERE is_active = true
    ),
    satisfaction_stats AS (
        SELECT jsonb_build_object(
            'overall', COALESCE(AVG(satisfaction_score), 0),
            'easeOfUse', COALESCE(AVG((event_data->>'ease_of_use')::INTEGER), 0),
            'effectiveness', COALESCE(AVG((event_data->>'effectiveness')::INTEGER), 0),
            'support', COALESCE(AVG((event_data->>'support')::INTEGER), 0)
        )
        FROM accessibility_statistics
        WHERE satisfaction_score IS NOT NULL
        AND date >= p_date - INTERVAL '30 days'
    ),
    performance_stats AS (
        SELECT jsonb_build_object(
            'averageLoadTime', COALESCE(AVG((performance_metrics->>'load_time')::INTEGER), 0),
            'errorRate', COALESCE(COUNT(*) FILTER (WHERE NOT success)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 0),
            'successRate', COALESCE(COUNT(*) FILTER (WHERE success)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 0),
            'userRetention', COALESCE(
                COUNT(DISTINCT user_id)::DECIMAL / NULLIF((SELECT COUNT(*) FROM profiles), 0) * 100, 
                0
            )
        )
        FROM accessibility_events
        WHERE DATE(timestamp) = p_date
    )
    SELECT 
        ps.total as total_users,
        ps.active as active_profiles,
        pt.profile_types as profiles_by_type,
        fus.feature_usage_stats as feature_usage,
        dss.device_support_stats as device_support,
        sstats.satisfaction_stats as user_satisfaction,
        pstats.performance_stats as performance
    FROM profile_stats ps, profile_types pt, feature_usage_stats fus,
         device_support_stats dss, satisfaction_stats sstats, performance_stats pstats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les préférences par défaut
CREATE OR REPLACE FUNCTION create_default_accessibility_preferences()
RETURNS VOID AS $$
BEGIN
    INSERT INTO accessibility_default_preferences (category, settings, priority)
    VALUES 
        ('screen_reader', '{
            "enabled": false,
            "voice": {"name": "Default", "gender": "neutral", "accent": "en-US", "age": "adult"},
            "readingSpeed": 1.0,
            "pitch": 1.0,
            "volume": 0.8,
            "language": "en-US",
            "announceFocus": true,
            "announceChanges": true,
            "announceErrors": true,
            "readingMode": "continuous",
            "punctuationLevel": "some"
        }', 10),
        ('keyboard_navigation', '{
            "enabled": true,
            "skipLinks": true,
            "focusIndicators": {
                "style": "outline",
                "color": "#0066cc",
                "width": 2,
                "animated": true,
                "highContrast": false
            },
            "tabNavigation": {
                "wrapAround": true,
                "trapFocus": true,
                "skipToContent": true,
                "visualFocusOrder": true
            },
            "ariaLabels": true,
            "landmarks": true,
            "headings": true
        }', 20),
        ('visual_aids', '{
            "highContrast": false,
            "largeText": false,
            "zoomLevel": 1.0,
            "cursorSize": "medium",
            "cursorColor": "#000000",
            "linkUnderlines": true,
            "buttonOutlines": false,
            "spacing": {
                "letterSpacing": 0,
                "wordSpacing": 0,
                "lineHeight": 1.5,
                "paragraphSpacing": 1.0
            },
            "animations": {
                "enabled": true,
                "reducedMotion": false,
                "duration": 0.3,
                "easing": "ease-in-out"
            }
        }', 30),
        ('voice_commands', '{
            "enabled": false,
            "language": "en-US",
            "sensitivity": 0.7,
            "commands": [],
            "wakeWord": "computer",
            "continuous": false,
            "feedback": {
                "enabled": true,
                "voice": {"name": "Default", "gender": "neutral", "accent": "en-US", "age": "adult"},
                "volume": 0.6,
                "successSound": true,
                "errorSound": true
            }
        }', 40),
        ('color_blindness', '{
            "enabled": false,
            "type": "protanopia",
            "intensity": 0.5,
            "customFilters": [],
            "simulator": false
        }', 50),
        ('motor_assistance', '{
            "stickyKeys": false,
            "filterKeys": false,
            "toggleKeys": false,
            "mouseKeys": false,
            "delay": 500,
            "clickAssist": false,
            "dwellTime": 1000,
            "gestureControl": false
        }', 60),
        ('cognitive_assistance', '{
            "simplifiedUI": false,
            "readingGuide": false,
            "wordHighlighting": false,
            "sentenceHighlighting": false,
            "dyslexiaFont": false,
            "iconsOnly": false,
            "stepByStep": false,
            "reminders": false
        }', 70)
    ON CONFLICT (category) DO UPDATE SET
        settings = EXCLUDED.settings,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_accessibility_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO accessibility_statistics (
        user_id,
        device_id,
        date,
        session_count,
        total_duration_minutes,
        feature_usage,
        interaction_count,
        error_count,
        performance_metrics,
        satisfaction_score
    )
    SELECT 
        user_id,
        device_id,
        p_date,
        COUNT(*) as session_count,
        COALESCE(SUM(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60), 0) as total_duration_minutes,
        jsonb_build_object(
            'screenReader', COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM jsonb_array_elements(features_used) WHERE value = 'screenReader') > 0),
            'keyboardNavigation', COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM jsonb_array_elements(features_used) WHERE value = 'keyboardNavigation') > 0),
            'voiceCommands', COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM jsonb_array_elements(features_used) WHERE value = 'voiceCommands') > 0),
            'visualAids', COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM jsonb_array_elements(features_used) WHERE value = 'visualAids') > 0)
        ),
        COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(interactions))::INTEGER, 0) as interaction_count,
        COUNT(*) FILTER (WHERE NOT success) as error_count,
        jsonb_build_object(
            'averageLoadTime', COALESCE(AVG((performance_metrics->>'load_time')::INTEGER), 0),
            'responseTime', COALESCE(AVG((performance_metrics->>'response_time')::INTEGER), 0),
            'memoryUsage', COALESCE(AVG((performance_metrics->>'memory_usage')::INTEGER), 0)
        ),
        NULL
    FROM accessibility_sessions
    WHERE DATE(started_at) = p_date
    GROUP BY user_id, device_id
    ON CONFLICT (user_id, device_id, date) DO UPDATE SET
        session_count = EXCLUDED.session_count,
        total_duration_minutes = EXCLUDED.total_duration_minutes,
        feature_usage = EXCLUDED.feature_usage,
        interaction_count = EXCLUDED.interaction_count,
        error_count = EXCLUDED.error_count,
        performance_metrics = EXCLUDED.performance_metrics,
        satisfaction_score = EXCLUDED.satisfaction_score,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciennes données d'accessibilité
CREATE OR REPLACE FUNCTION cleanup_old_accessibility_data(p_days_old INTEGER DEFAULT 90)
RETURNS TABLE (
    cleaned_sessions BIGINT,
    cleaned_events BIGINT,
    cleaned_devices BIGINT
) AS $$
DECLARE
    cleaned_sessions_count BIGINT;
    cleaned_events_count BIGINT;
    cleaned_devices_count BIGINT;
BEGIN
    -- Nettoyer les anciennes sessions
    DELETE FROM accessibility_sessions
    WHERE started_at < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cleaned_sessions_count = ROW_COUNT;
    
    -- Nettoyer les anciens événements
    DELETE FROM accessibility_events
    WHERE timestamp < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cleaned_events_count = ROW_COUNT;
    
    -- Nettoyer les appareils inactifs
    DELETE FROM accessibility_devices
    WHERE last_seen_at < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cleaned_devices_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_sessions_count, cleaned_events_count, cleaned_devices_count;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE accessibility_profiles IS 'Profils d\'accessibilité personnalisés par utilisateur';
COMMENT ON TABLE accessibility_sessions IS 'Sessions d\'utilisation des fonctionnalités d\'accessibilité';
COMMENT ON TABLE accessibility_events IS 'Événements d\'accessibilité pour le monitoring et l\'analyse';
COMMENT ON TABLE accessibility_default_preferences IS 'Préférences par défaut pour les fonctionnalités d\'accessibilité';
COMMENT ON TABLE accessibility_devices IS 'Appareils supportés et leurs capacités d\'accessibilité';
COMMENT ON TABLE accessibility_statistics IS 'Statistiques d\'utilisation et de performance de l\'accessibilité';
COMMENT ON TABLE accessibility_voice_commands IS 'Commandes vocales personnalisées par utilisateur';
COMMENT ON TABLE accessibility_keyboard_shortcuts IS 'Raccourcis clavier personnalisés pour l\'accessibilité';
COMMENT ON TABLE accessibility_user_styles IS 'Styles CSS personnalisés pour l\'accessibilité';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN accessibility_profiles.settings IS 'Configuration complète d\'accessibilité {screenReader, keyboardNavigation, visualAids, etc}';
COMMENT ON COLUMN accessibility_profiles.preferences IS 'Préférences utilisateur {autoDetect, rememberSettings, notifications}';
COMMENT ON COLUMN accessibility_sessions.features_used IS 'Fonctionnalités utilisées pendant la session';
COMMENT ON COLUMN accessibility_sessions.interactions IS 'Interactions utilisateur avec les fonctionnalités';
COMMENT ON COLUMN accessibility_events.event_data IS 'Données détaillées de l\'événement {timestamp, metadata, parameters}';
COMMENT ON COLUMN accessibility_devices.capabilities IS 'Capacités de l\'appareil {screenReader, voiceRecognition, touch, etc}';
COMMENT ON COLUMN accessibility_statistics.feature_usage IS 'Statistiques d\'utilisation par fonctionnalité';
COMMENT ON COLUMN accessibility_statistics.performance_metrics IS 'Métriques de performance {loadTime, responseTime, memoryUsage}';

-- Créer les données par défaut
SELECT create_default_accessibility_preferences();
