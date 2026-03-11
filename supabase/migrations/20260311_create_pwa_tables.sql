-- Migration: Création des tables pour la PWA (Progressive Web App)
-- Date: 11 mars 2026
-- Description: Tables pour gérer l'installation, les notifications et l'usage de la PWA

-- Table des installations PWA
CREATE TABLE IF NOT EXISTS pwa_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    device_info JSONB NOT NULL DEFAULT '{}',
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(20) NOT NULL,
    metadata JSONB DEFAULT '{}'
);

-- Table des notifications PWA
CREATE TABLE IF NOT EXISTS pwa_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    icon TEXT,
    image TEXT,
    badge TEXT,
    tag VARCHAR(100),
    data JSONB DEFAULT '{}',
    actions JSONB DEFAULT '[]',
    require_interaction BOOLEAN DEFAULT false,
    silent BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('system', 'reminder', 'update', 'share', 'comment', 'mention', 'document', 'sync', 'offline')),
    metadata JSONB DEFAULT '{}'
);

-- Table des sessions PWA
CREATE TABLE IF NOT EXISTS pwa_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID REFERENCES pwa_installations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- en secondes
    is_active BOOLEAN DEFAULT true,
    pages_visited TEXT[] DEFAULT '{}',
    interactions JSONB DEFAULT '[]',
    offline_time INTEGER DEFAULT 0, -- temps hors ligne en secondes
    network_info JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Table des événements PWA
CREATE TABLE IF NOT EXISTS pwa_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID REFERENCES pwa_installations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id UUID REFERENCES pwa_sessions(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'install', 'uninstall', 'launch', 'background', 'foreground', 
        'offline', 'online', 'notification_click', 'notification_dismiss',
        'cache_hit', 'cache_miss', 'sync_start', 'sync_complete',
        'error', 'performance', 'feature_usage'
    )),
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Table des statistiques de cache PWA
CREATE TABLE IF NOT EXISTS pwa_cache_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID REFERENCES pwa_installations(id) ON DELETE CASCADE,
    cache_name VARCHAR(100) NOT NULL,
    cache_type VARCHAR(50) NOT NULL CHECK (cache_type IN ('precache', 'runtime', 'offline')),
    size_bytes BIGINT DEFAULT 0,
    entries_count INTEGER DEFAULT 0,
    hit_count INTEGER DEFAULT 0,
    miss_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Index pour les performances
CREATE INDEX idx_pwa_installations_user_id ON pwa_installations(user_id);
CREATE INDEX idx_pwa_installations_platform ON pwa_installations(platform);
CREATE INDEX idx_pwa_installations_installed_at ON pwa_installations(installed_at DESC);
CREATE INDEX idx_pwa_installations_last_used_at ON pwa_installations(last_used_at DESC);
CREATE INDEX idx_pwa_installations_is_active ON pwa_installations(is_active);
CREATE INDEX idx_pwa_installations_version ON pwa_installations(version);

CREATE INDEX idx_pwa_notifications_user_id ON pwa_notifications(user_id);
CREATE INDEX idx_pwa_notifications_type ON pwa_notifications(type);
CREATE INDEX idx_pwa_notifications_timestamp ON pwa_notifications(timestamp DESC);
CREATE INDEX idx_pwa_notifications_read ON pwa_notifications(read);
CREATE INDEX idx_pwa_notifications_expires_at ON pwa_notifications(expires_at);
CREATE INDEX idx_pwa_notifications_tag ON pwa_notifications(tag);

CREATE INDEX idx_pwa_sessions_installation_id ON pwa_sessions(installation_id);
CREATE INDEX idx_pwa_sessions_user_id ON pwa_sessions(user_id);
CREATE INDEX idx_pwa_sessions_session_start ON pwa_sessions(session_start DESC);
CREATE INDEX idx_pwa_sessions_is_active ON pwa_sessions(is_active);
CREATE INDEX idx_pwa_sessions_duration ON pwa_sessions(duration DESC);

CREATE INDEX idx_pwa_events_installation_id ON pwa_events(installation_id);
CREATE INDEX idx_pwa_events_user_id ON pwa_events(user_id);
CREATE INDEX idx_pwa_events_session_id ON pwa_events(session_id);
CREATE INDEX idx_pwa_events_event_type ON pwa_events(event_type);
CREATE INDEX idx_pwa_events_timestamp ON pwa_events(timestamp DESC);

CREATE INDEX idx_pwa_cache_stats_installation_id ON pwa_cache_stats(installation_id);
CREATE INDEX idx_pwa_cache_stats_cache_name ON pwa_cache_stats(cache_name);
CREATE INDEX idx_pwa_cache_stats_cache_type ON pwa_cache_stats(cache_type);
CREATE INDEX idx_pwa_cache_stats_last_accessed ON pwa_cache_stats(last_accessed DESC);
CREATE INDEX idx_pwa_cache_stats_size_bytes ON pwa_cache_stats(size_bytes DESC);

-- Trigger pour mettre à jour last_used_at lors de l'utilisation
CREATE OR REPLACE FUNCTION update_pwa_installation_last_used()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE pwa_installations
    SET last_used_at = NOW()
    WHERE id = NEW.installation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pwa_installation_last_used
    AFTER INSERT ON pwa_sessions
    FOR EACH ROW EXECUTE FUNCTION update_pwa_installation_last_used();

-- Politiques RLS pour les installations PWA
ALTER TABLE pwa_installations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PWA installations" ON pwa_installations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own PWA installations" ON pwa_installations
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les notifications PWA
ALTER TABLE pwa_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PWA notifications" ON pwa_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own PWA notifications" ON pwa_notifications
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les sessions PWA
ALTER TABLE pwa_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PWA sessions" ON pwa_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own PWA sessions" ON pwa_sessions
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les événements PWA
ALTER TABLE pwa_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PWA events" ON pwa_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own PWA events" ON pwa_events
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour les statistiques de cache
ALTER TABLE pwa_cache_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PWA cache stats" ON pwa_cache_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pwa_installations pi
            WHERE pi.id = installation_id
            AND pi.user_id = auth.uid()
        )
    );

-- Fonctions RPC pour la PWA

-- Fonction pour obtenir les statistiques PWA
CREATE OR REPLACE FUNCTION get_pwa_stats()
RETURNS TABLE (
    total_installations BIGINT,
    active_installations BIGINT,
    installations_by_platform JSONB,
    installations_by_version JSONB,
    average_session_duration FLOAT,
    total_sessions BIGINT,
    offline_usage BIGINT,
    cache_hit_rate FLOAT,
    notification_stats JSONB,
    feature_usage JSONB,
    performance JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH installation_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_active = true) as active
        FROM pwa_installations
    ),
    platform_distribution AS (
        SELECT jsonb_object_agg(platform, platform_count)
        FROM (
            SELECT 
                platform,
                COUNT(*) as platform_count
            FROM pwa_installations
            WHERE is_active = true
            GROUP BY platform
        ) dist
    ),
    version_distribution AS (
        SELECT jsonb_object_agg(version, version_count)
        FROM (
            SELECT 
                version,
                COUNT(*) as version_count
            FROM pwa_installations
            WHERE is_active = true
            GROUP BY version
        ) version_stats
    ),
    session_stats AS (
        SELECT 
            COALESCE(AVG(duration), 0) as avg_duration,
            COUNT(*) as total_sessions
        FROM pwa_sessions
        WHERE session_end IS NOT NULL
    ),
    offline_stats AS (
        SELECT 
            COALESCE(SUM(offline_time), 0) as total_offline_time
        FROM pwa_sessions
        WHERE offline_time > 0
    ),
    cache_stats AS (
        SELECT 
            COALESCE(
                SUM(hit_count)::FLOAT / NULLIF(SUM(hit_count + miss_count), 0), 
                0
            ) as hit_rate
        FROM pwa_cache_stats
    ),
    notification_stats AS (
        SELECT jsonb_build_object(
            'sent', COUNT(*) FILTER (WHERE type IN ('system', 'reminder', 'update')),
            'delivered', COUNT(*) FILTER (WHERE read = true),
            'clicked', COUNT(*) FILTER (WHERE type = 'notification_click'),
            'dismissed', COUNT(*) FILTER (WHERE type = 'notification_dismiss')
        )
        FROM pwa_events
        WHERE event_type IN ('notification_click', 'notification_dismiss')
        AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
    ),
    feature_usage_stats AS (
        SELECT jsonb_object_agg(feature, usage_count)
        FROM (
            SELECT 
                event_data->>'feature' as feature,
                COUNT(*) as usage_count
            FROM pwa_events
            WHERE event_type = 'feature_usage'
            AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY event_data->>'feature'
        ) feature_stats
    ),
    performance_stats AS (
        SELECT jsonb_build_object(
            'average_load_time', COALESCE(AVG((event_data->>'loadTime')::INTEGER), 0),
            'cache_size', COALESCE(SUM((event_data->>'cacheSize')::INTEGER), 0),
            'network_requests', COALESCE(COUNT(*) FILTER (WHERE event_type = 'cache_miss'), 0),
            'offline_requests', COALESCE(COUNT(*) FILTER (WHERE event_type = 'offline'), 0)
        )
        FROM pwa_events
        WHERE event_type IN ('cache_hit', 'cache_miss', 'offline')
        AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
    )
    SELECT 
        ins.total as total_installations,
        ins.active as active_installations,
        pd.installations_by_platform,
        vd.installations_by_version,
        ss.avg_duration as average_session_duration,
        ss.total_sessions,
        os.total_offline_time as offline_usage,
        cs.hit_rate as cache_hit_rate,
        ns.notification_stats,
        fu.feature_usage_stats as feature_usage,
        perf.performance_stats as performance
    FROM installation_stats ins, platform_distribution pd, version_distribution vd,
         session_stats ss, offline_stats os, cache_stats cs,
         notification_stats ns, feature_usage_stats fu, performance_stats perf;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer les anciennes données PWA
CREATE OR REPLACE FUNCTION cleanup_old_pwa_data(p_days_old INTEGER DEFAULT 90)
RETURNS TABLE (
    cleaned_sessions BIGINT,
    cleaned_events BIGINT,
    cleaned_notifications BIGINT,
    cleaned_cache_stats BIGINT
) AS $$
DECLARE
    sessions_cleaned BIGINT;
    events_cleaned BIGINT;
    notifications_cleaned BIGINT;
    cache_stats_cleaned BIGINT;
BEGIN
    -- Nettoyer les anciennes sessions
    DELETE FROM pwa_sessions
    WHERE session_end < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS sessions_cleaned = ROW_COUNT;
    
    -- Nettoyer les anciens événements
    DELETE FROM pwa_events
    WHERE timestamp < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS events_cleaned = ROW_COUNT;
    
    -- Nettoyer les anciennes notifications lues
    DELETE FROM pwa_notifications
    WHERE read = true
    AND read_at < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS notifications_cleaned = ROW_COUNT;
    
    -- Nettoyer les anciennes statistiques de cache
    DELETE FROM pwa_cache_stats
    WHERE last_accessed < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cache_stats_cleaned = ROW_COUNT;
    
    RETURN QUERY SELECT sessions_cleaned, events_cleaned, notifications_cleaned, cache_stats_cleaned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour les statistiques de cache
CREATE OR REPLACE FUNCTION update_cache_stats(
    p_installation_id UUID,
    p_cache_name VARCHAR(100),
    p_cache_type VARCHAR(50),
    p_size_bytes BIGINT,
    p_entries_count INTEGER,
    p_hit_count INTEGER,
    p_miss_count INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO pwa_cache_stats (
        installation_id,
        cache_name,
        cache_type,
        size_bytes,
        entries_count,
        hit_count,
        miss_count,
        last_accessed
    )
    VALUES (
        p_installation_id,
        p_cache_name,
        p_cache_type,
        p_size_bytes,
        p_entries_count,
        p_hit_count,
        p_miss_count,
        NOW()
    )
    ON CONFLICT (installation_id, cache_name)
    DO UPDATE SET
        size_bytes = p_size_bytes,
        entries_count = p_entries_count,
        hit_count = p_hit_count,
        miss_count = p_miss_count,
        last_accessed = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour suivre un événement PWA
CREATE OR REPLACE FUNCTION track_pwa_event(
    p_installation_id UUID,
    p_user_id UUID,
    p_session_id UUID,
    p_event_type VARCHAR(50),
    p_event_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO pwa_events (
        installation_id,
        user_id,
        session_id,
        event_type,
        event_data,
        timestamp
    )
    VALUES (
        p_installation_id,
        p_user_id,
        p_session_id,
        p_event_type,
        COALESCE(p_event_data, '{}'),
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE pwa_installations IS 'Installations de la PWA par utilisateur et plateforme';
COMMENT ON TABLE pwa_notifications IS 'Notifications push envoyées via la PWA';
COMMENT ON TABLE pwa_sessions IS 'Sessions dutilisation de la PWA avec métriques';
COMMENT ON TABLE pwa_events IS 'Événements PWA pour le suivi des interactions';
COMMENT ON TABLE pwa_cache_stats IS 'Statistiques du cache de la PWA';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN pwa_installations.device_info IS 'Informations sur lappareil {userAgent, platform, screenResolution, etc.}';
COMMENT ON COLUMN pwa_installations.metadata IS 'Métadonnées dinstallation {installPromptShown, installSource, features, etc.}';
COMMENT ON COLUMN pwa_notifications.data IS 'Données personnalisées de la notification';
COMMENT ON COLUMN pwa_notifications.actions IS 'Actions possibles pour la notification';
COMMENT ON COLUMN pwa_sessions.offline_time IS 'Temps passé hors ligne pendant la session';
COMMENT ON COLUMN pwa_sessions.performance_metrics IS 'Métriques de performance {loadTime, renderTime, memoryUsage}';
COMMENT ON COLUMN pwa_events.event_data IS 'Données spécifiques à lévénement';
COMMENT ON COLUMN pwa_cache_stats.hit_rate IS 'Taux de succès du cache (hits / total)';

-- Créer une fonction pour nettoyer automatiquement les anciennes données
CREATE OR REPLACE FUNCTION schedule_cleanup_pwa_data()
RETURNS VOID AS $$
BEGIN
    PERFORM cleanup_old_pwa_data(90);
END;
$$ LANGUAGE plpgsql;
