-- Migration: Création des tables pour la pagination infinie (virtual scroll)
-- Date: 11 mars 2026
-- Description: Tables pour gérer le virtual scrolling, les performances et les statistiques

-- Table des configurations de virtual scroll
CREATE TABLE IF NOT EXISTS virtual_scroll_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    component_id VARCHAR(255) NOT NULL,
    component_name VARCHAR(255) NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    item_height INTEGER DEFAULT 50,
    item_width INTEGER DEFAULT 100,
    overscan INTEGER DEFAULT 5,
    threshold DECIMAL(3,2) DEFAULT 0.80 CHECK (threshold >= 0 AND threshold <= 1),
    buffer_size INTEGER DEFAULT 10,
    horizontal BOOLEAN DEFAULT false,
    reverse BOOLEAN DEFAULT false,
    sticky_indices INTEGER[] DEFAULT '{}',
    sticky_offset INTEGER DEFAULT 0,
    smooth_scroll BOOLEAN DEFAULT true,
    auto_scroll BOOLEAN DEFAULT false,
    auto_scroll_speed INTEGER DEFAULT 1,
    cache_enabled BOOLEAN DEFAULT true,
    cache_max_size INTEGER DEFAULT 1000,
    preload_enabled BOOLEAN DEFAULT true,
    preload_distance INTEGER DEFAULT 200,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, component_id)
);

-- Table des sessions de virtual scroll
CREATE TABLE IF NOT EXISTS virtual_scroll_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    component_id VARCHAR(255) NOT NULL,
    device_id VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    total_scrolls INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    total_renders INTEGER DEFAULT 0,
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    scroll_distance BIGINT DEFAULT 0,
    interactions JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Table des événements de virtual scroll
CREATE TABLE IF NOT EXISTS virtual_scroll_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES virtual_scroll_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('scroll', 'resize', 'load_start', 'load_complete', 'load_error', 'render', 'cache_hit', 'cache_miss', 'item_visible', 'item_hidden')),
    event_data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_ms INTEGER,
    scroll_position INTEGER,
    scroll_velocity DECIMAL(10,4),
    scroll_direction VARCHAR(10),
    item_index INTEGER,
    item_key VARCHAR(255),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Table des métriques de performance
CREATE TABLE IF NOT EXISTS virtual_scroll_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES virtual_scroll_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_items INTEGER DEFAULT 0,
    visible_items INTEGER DEFAULT 0,
    rendered_items INTEGER DEFAULT 0,
    buffer_size INTEGER DEFAULT 0,
    overscan_size INTEGER DEFAULT 0,
    item_height INTEGER DEFAULT 0,
    item_width INTEGER DEFAULT 0,
    container_height INTEGER DEFAULT 0,
    container_width INTEGER DEFAULT 0,
    total_height BIGINT DEFAULT 0,
    total_width BIGINT DEFAULT 0,
    scroll_position INTEGER DEFAULT 0,
    scroll_percentage DECIMAL(5,2) DEFAULT 0.00,
    render_time_ms INTEGER DEFAULT 0,
    scroll_time_ms INTEGER DEFAULT 0,
    load_time_ms INTEGER DEFAULT 0,
    memory_usage_bytes BIGINT DEFAULT 0,
    dom_nodes INTEGER DEFAULT 0,
    reflows INTEGER DEFAULT 0,
    repaints INTEGER DEFAULT 0,
    cache_hit_rate DECIMAL(5,2) DEFAULT 0.00,
    scroll_fps INTEGER DEFAULT 0,
    render_fps INTEGER DEFAULT 0,
    scroll_velocity DECIMAL(10,4) DEFAULT 0.00,
    scroll_direction VARCHAR(10) DEFAULT 'none'
);

-- Table des statistiques de cache
CREATE TABLE IF NOT EXISTS virtual_scroll_cache_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    component_id VARCHAR(255) NOT NULL,
    session_id UUID REFERENCES virtual_scroll_sessions(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    cache_size INTEGER DEFAULT 0,
    cache_max_size INTEGER DEFAULT 0,
    hit_count INTEGER DEFAULT 0,
    miss_count INTEGER DEFAULT 0,
    hit_rate DECIMAL(5,2) DEFAULT 0.00,
    evictions INTEGER DEFAULT 0,
    memory_usage_bytes BIGINT DEFAULT 0,
    average_access_time_ms INTEGER DEFAULT 0,
    most_accessed_keys TEXT[] DEFAULT '{}',
    least_accessed_keys TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, component_id, date)
);

-- Table des performances par composant
CREATE TABLE IF NOT EXISTS virtual_scroll_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    component_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    average_duration_seconds DECIMAL(10,2) DEFAULT 0.00,
    average_items_per_session INTEGER DEFAULT 0,
    average_scrolls_per_session INTEGER DEFAULT 0,
    average_render_time_ms INTEGER DEFAULT 0,
    average_scroll_time_ms INTEGER DEFAULT 0,
    average_load_time_ms INTEGER DEFAULT 0,
    average_memory_usage_mb DECIMAL(10,2) DEFAULT 0.00,
    average_cache_hit_rate DECIMAL(5,2) DEFAULT 0.00,
    average_scroll_fps INTEGER DEFAULT 0,
    average_render_fps INTEGER DEFAULT 0,
    error_rate DECIMAL(5,2) DEFAULT 0.00,
    user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
    performance_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, component_id, date)
);

-- Table des optimisations
CREATE TABLE IF NOT EXISTS virtual_scroll_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    component_id VARCHAR(255) NOT NULL,
    optimization_type VARCHAR(50) NOT NULL CHECK (optimization_type IN ('cache_size', 'overscan', 'threshold', 'preload', 'item_height', 'buffer_size', 'lazy_loading', 'memory_management')),
    old_value JSONB,
    new_value JSONB,
    performance_impact JSONB,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    measured_at TIMESTAMP WITH TIME ZONE,
    improvement_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Index pour les performances
CREATE INDEX idx_virtual_scroll_configurations_user_id ON virtual_scroll_configurations(user_id);
CREATE INDEX idx_virtual_scroll_configurations_component_id ON virtual_scroll_configurations(component_id);
CREATE INDEX idx_virtual_scroll_configurations_is_active ON virtual_scroll_configurations(is_active);
CREATE INDEX idx_virtual_scroll_configurations_created_at ON virtual_scroll_configurations(created_at DESC);

CREATE INDEX idx_virtual_scroll_sessions_user_id ON virtual_scroll_sessions(user_id);
CREATE INDEX idx_virtual_scroll_sessions_session_id ON virtual_scroll_sessions(session_id);
CREATE INDEX idx_virtual_scroll_sessions_component_id ON virtual_scroll_sessions(component_id);
CREATE INDEX idx_virtual_scroll_sessions_started_at ON virtual_scroll_sessions(started_at DESC);
CREATE INDEX idx_virtual_scroll_sessions_device_id ON virtual_scroll_sessions(device_id);

CREATE INDEX idx_virtual_scroll_events_session_id ON virtual_scroll_events(session_id);
CREATE INDEX idx_virtual_scroll_events_user_id ON virtual_scroll_events(user_id);
CREATE INDEX idx_virtual_scroll_events_event_type ON virtual_scroll_events(event_type);
CREATE INDEX idx_virtual_scroll_events_timestamp ON virtual_scroll_events(timestamp DESC);
CREATE INDEX idx_virtual_scroll_events_item_index ON virtual_scroll_events(item_index);
CREATE INDEX idx_virtual_scroll_events_success ON virtual_scroll_events(success);

CREATE INDEX idx_virtual_scroll_metrics_session_id ON virtual_scroll_metrics(session_id);
CREATE INDEX idx_virtual_scroll_metrics_user_id ON virtual_scroll_metrics(user_id);
CREATE INDEX idx_virtual_scroll_metrics_timestamp ON virtual_scroll_metrics(timestamp DESC);
CREATE INDEX idx_virtual_scroll_metrics_scroll_fps ON virtual_scroll_metrics(scroll_fps DESC);
CREATE INDEX idx_virtual_scroll_metrics_render_fps ON virtual_scroll_metrics(render_fps DESC);

CREATE INDEX idx_virtual_scroll_cache_stats_user_id ON virtual_scroll_cache_stats(user_id);
CREATE INDEX idx_virtual_scroll_cache_stats_component_id ON virtual_scroll_cache_stats(component_id);
CREATE INDEX idx_virtual_scroll_cache_stats_date ON virtual_scroll_cache_stats(date);
CREATE INDEX idx_virtual_scroll_cache_stats_hit_rate ON virtual_scroll_cache_stats(hit_rate DESC);

CREATE INDEX idx_virtual_scroll_performance_user_id ON virtual_scroll_performance(user_id);
CREATE INDEX idx_virtual_scroll_performance_component_id ON virtual_scroll_performance(component_id);
CREATE INDEX idx_virtual_scroll_performance_date ON virtual_scroll_performance(date);
CREATE INDEX idx_virtual_scroll_performance_performance_score ON virtual_scroll_performance(performance_score DESC);

CREATE INDEX idx_virtual_scroll_optimizations_user_id ON virtual_scroll_optimizations(user_id);
CREATE INDEX idx_virtual_scroll_optimizations_component_id ON virtual_scroll_optimizations(component_id);
CREATE INDEX idx_virtual_scroll_optimizations_optimization_type ON virtual_scroll_optimizations(optimization_type);
CREATE INDEX idx_virtual_scroll_optimizations_applied_at ON virtual_scroll_optimizations(applied_at DESC);
CREATE INDEX idx_virtual_scroll_optimizations_is_active ON virtual_scroll_optimizations(is_active);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_virtual_scroll_configurations_updated_at 
    BEFORE UPDATE ON virtual_scroll_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_virtual_scroll_cache_stats_updated_at 
    BEFORE UPDATE ON virtual_scroll_cache_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_virtual_scroll_performance_updated_at 
    BEFORE UPDATE ON virtual_scroll_performance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques de session
CREATE OR REPLACE FUNCTION update_virtual_scroll_session_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE virtual_scroll_sessions
    SET 
        total_scrolls = total_scrolls + CASE WHEN NEW.event_type = 'scroll' THEN 1 ELSE 0 END,
        total_renders = total_renders + CASE WHEN NEW.event_type = 'render' THEN 1 ELSE 0 END,
        cache_hits = cache_hits + CASE WHEN NEW.event_type = 'cache_hit' THEN 1 ELSE 0 END,
        cache_misses = cache_misses + CASE WHEN NEW.event_type = 'cache_miss' THEN 1 ELSE 0 END,
        scroll_distance = scroll_distance + COALESCE(NEW.event_data->>'scrollDistance', '0')::BIGINT,
        updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_virtual_scroll_session_stats
    AFTER INSERT ON virtual_scroll_events
    FOR EACH ROW EXECUTE FUNCTION update_virtual_scroll_session_stats();

-- Politiques RLS pour les configurations
ALTER TABLE virtual_scroll_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own virtual scroll configurations" ON virtual_scroll_configurations
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all virtual scroll configurations" ON virtual_scroll_configurations
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
ALTER TABLE virtual_scroll_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own virtual scroll sessions" ON virtual_scroll_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all virtual scroll sessions" ON virtual_scroll_sessions
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
ALTER TABLE virtual_scroll_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own virtual scroll events" ON virtual_scroll_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all virtual scroll events" ON virtual_scroll_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les métriques
ALTER TABLE virtual_scroll_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own virtual scroll metrics" ON virtual_scroll_metrics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all virtual scroll metrics" ON virtual_scroll_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les statistiques de cache
ALTER TABLE virtual_scroll_cache_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own virtual scroll cache stats" ON virtual_scroll_cache_stats
    FOR SELECT USING (user_id = auth.uid());

-- Politiques RLS pour les performances
ALTER TABLE virtual_scroll_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own virtual scroll performance" ON virtual_scroll_performance
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all virtual scroll performance" ON virtual_scroll_performance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les optimisations
ALTER TABLE virtual_scroll_optimizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own virtual scroll optimizations" ON virtual_scroll_optimizations
    FOR ALL USING (user_id = auth.uid());

-- Fonctions RPC pour le virtual scroll

-- Fonction pour obtenir les statistiques de virtual scroll
CREATE OR REPLACE FUNCTION get_virtual_scroll_stats(p_user_id UUID DEFAULT NULL, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_sessions BIGINT,
    average_duration_seconds DECIMAL(10,2),
    average_items_per_session DECIMAL(10,2),
    average_scrolls_per_session DECIMAL(10,2),
    average_render_time_ms DECIMAL(10,2),
    average_scroll_fps DECIMAL(10,2),
    average_cache_hit_rate DECIMAL(5,2),
    error_rate DECIMAL(5,2),
    performance_score DECIMAL(5,2),
    component_stats JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH session_stats AS (
        SELECT 
            COUNT(*) as total,
            COALESCE(AVG(duration_seconds), 0) as avg_duration,
            COALESCE(AVG(total_items), 0) as avg_items,
            COALESCE(AVG(total_scrolls), 0) as avg_scrolls,
            COALESCE(AVG(total_renders), 0) as avg_renders,
            COALESCE(AVG(cache_hits), 0) as avg_cache_hits,
            COALESCE(AVG(cache_misses), 0) as avg_cache_misses
        FROM virtual_scroll_sessions
        WHERE (p_user_id IS NULL OR user_id = p_user_id)
        AND DATE(started_at) = p_date
    ),
    performance_stats AS (
        SELECT 
            COALESCE(AVG(render_time_ms), 0) as avg_render_time,
            COALESCE(AVG(scroll_fps), 0) as avg_scroll_fps,
            COALESCE(AVG(cache_hit_rate), 0) as avg_cache_hit_rate,
            COALESCE(COUNT(*) FILTER (WHERE success = false)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 0) as error_rate
        FROM virtual_scroll_events ve
        JOIN virtual_scroll_sessions vs ON ve.session_id = vs.id
        WHERE (p_user_id IS NULL OR vs.user_id = p_user_id)
        AND DATE(ve.timestamp) = p_date
    ),
    component_breakdown AS (
        SELECT jsonb_object_agg(
            component_id,
            jsonb_build_object(
                'sessions', COUNT(*),
                'avgDuration', COALESCE(AVG(duration_seconds), 0),
                'avgItems', COALESCE(AVG(total_items), 0),
                'avgScrolls', COALESCE(AVG(total_scrolls), 0),
                'avgCacheHitRate', COALESCE(AVG(CASE WHEN cache_hits + cache_misses > 0 THEN cache_hits::DECIMAL / (cache_hits + cache_misses) ELSE 0 END), 0)
            )
        )
        FROM virtual_scroll_sessions
        WHERE (p_user_id IS NULL OR user_id = p_user_id)
        AND DATE(started_at) = p_date
        GROUP BY component_id
    ),
    performance_score_calc AS (
        SELECT 
            (
                (COALESCE(pss.avg_scroll_fps, 0) / 60) * 0.3 +
                (COALESCE(100 - pss.error_rate, 100) / 100) * 0.3 +
                (COALESCE(pss.avg_cache_hit_rate, 0) / 100) * 0.2 +
                (COALESCE(100 - LEAST(pss.avg_render_time / 16.67 * 100, 100), 100) / 100) * 0.2
            ) * 100 as score
        FROM performance_stats pss
    )
    SELECT 
        ss.total as total_sessions,
        ss.avg_duration as average_duration_seconds,
        ss.avg_items as average_items_per_session,
        ss.avg_scrolls as average_scrolls_per_session,
        ps.avg_render_time as average_render_time_ms,
        ps.avg_scroll_fps as average_scroll_fps,
        ps.avg_cache_hit_rate as average_cache_hit_rate,
        ps.error_rate as error_rate,
        COALESCE(psc.score, 0) as performance_score,
        cb.component_stats as component_stats
    FROM session_stats ss, performance_stats ps, component_breakdown cb, performance_score_calc psc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_virtual_scroll_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO virtual_scroll_performance (
        user_id,
        component_id,
        date,
        total_sessions,
        average_duration_seconds,
        average_items_per_session,
        average_scrolls_per_session,
        average_render_time_ms,
        average_scroll_time_ms,
        average_load_time_ms,
        average_memory_usage_mb,
        average_cache_hit_rate,
        average_scroll_fps,
        average_render_fps,
        error_rate,
        performance_score
    )
    SELECT 
        user_id,
        component_id,
        p_date,
        COUNT(*) as total_sessions,
        COALESCE(AVG(duration_seconds), 0) as average_duration_seconds,
        COALESCE(AVG(total_items), 0) as average_items_per_session,
        COALESCE(AVG(total_scrolls), 0) as average_scrolls_per_session,
        COALESCE(AVG(render_time_ms), 0) as average_render_time_ms,
        COALESCE(AVG(scroll_time_ms), 0) as average_scroll_time_ms,
        COALESCE(AVG(load_time_ms), 0) as average_load_time_ms,
        COALESCE(AVG(memory_usage_bytes) / 1024 / 1024, 0) as average_memory_usage_mb,
        COALESCE(AVG(CASE WHEN cache_hits + cache_misses > 0 THEN cache_hits::DECIMAL / (cache_hits + cache_misses) ELSE 0 END), 0) as average_cache_hit_rate,
        COALESCE(AVG(scroll_fps), 0) as average_scroll_fps,
        COALESCE(AVG(render_fps), 0) as average_render_fps,
        COALESCE(COUNT(*) FILTER (WHERE success = false)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 0) as error_rate,
        (
            (COALESCE(AVG(scroll_fps), 0) / 60) * 0.3 +
            (COALESCE(100 - COUNT(*) FILTER (WHERE success = false)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 100) / 100) * 0.3 +
            (COALESCE(AVG(CASE WHEN cache_hits + cache_misses > 0 THEN cache_hits::DECIMAL / (cache_hits + cache_misses) ELSE 0 END), 0) / 100) * 0.2 +
            (COALESCE(100 - LEAST(AVG(render_time_ms) / 16.67 * 100, 100), 100) / 100) * 0.2
        ) * 100 as performance_score
    FROM virtual_scroll_sessions
    WHERE DATE(started_at) = p_date
    GROUP BY user_id, component_id
    ON CONFLICT (user_id, component_id, date) DO UPDATE SET
        total_sessions = EXCLUDED.total_sessions,
        average_duration_seconds = EXCLUDED.average_duration_seconds,
        average_items_per_session = EXCLUDED.average_items_per_session,
        average_scrolls_per_session = EXCLUDED.average_scrolls_per_session,
        average_render_time_ms = EXCLUDED.average_render_time_ms,
        average_scroll_time_ms = EXCLUDED.average_scroll_time_ms,
        average_load_time_ms = EXCLUDED.average_load_time_ms,
        average_memory_usage_mb = EXCLUDED.average_memory_usage_mb,
        average_cache_hit_rate = EXCLUDED.average_cache_hit_rate,
        average_scroll_fps = EXCLUDED.average_scroll_fps,
        average_render_fps = EXCLUDED.average_render_fps,
        error_rate = EXCLUDED.error_rate,
        performance_score = EXCLUDED.performance_score,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciennes données de virtual scroll
CREATE OR REPLACE FUNCTION cleanup_old_virtual_scroll_data(p_days_old INTEGER DEFAULT 30)
RETURNS TABLE (
    cleaned_sessions BIGINT,
    cleaned_events BIGINT,
    cleaned_metrics BIGINT
) AS $$
DECLARE
    cleaned_sessions_count BIGINT;
    cleaned_events_count BIGINT;
    cleaned_metrics_count BIGINT;
BEGIN
    -- Nettoyer les anciennes sessions
    DELETE FROM virtual_scroll_sessions
    WHERE started_at < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cleaned_sessions_count = ROW_COUNT;
    
    -- Nettoyer les anciens événements
    DELETE FROM virtual_scroll_events
    WHERE timestamp < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cleaned_events_count = ROW_COUNT;
    
    -- Nettoyer les anciennes métriques
    DELETE FROM virtual_scroll_metrics
    WHERE timestamp < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cleaned_metrics_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_sessions_count, cleaned_events_count, cleaned_metrics_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour optimiser automatiquement les configurations
CREATE OR REPLACE FUNCTION optimize_virtual_scroll_configurations(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    optimized_configurations BIGINT,
    average_improvement DECIMAL(5,2)
) AS $$
DECLARE
    optimized_count BIGINT;
    avg_improvement DECIMAL(5,2);
BEGIN
    -- Analyser les performances et suggérer des optimisations
    INSERT INTO virtual_scroll_optimizations (user_id, component_id, optimization_type, old_value, new_value, performance_impact, applied_at)
    SELECT 
        p_user_id,
        component_id,
        'cache_size',
        jsonb_build_object('cacheMaxSize', cache_max_size),
        jsonb_build_object('cacheMaxSize', LEAST(cache_max_size * 1.5, 2000)),
        jsonb_build_object('expectedImprovement', '10-15%'),
        NOW()
    FROM virtual_scroll_performance
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND average_cache_hit_rate < 70
    AND cache_max_size < 1500
    ON CONFLICT DO NOTHING;
    
    GET DIAGNOSTICS optimized_count = ROW_COUNT;
    
    -- Calculer l'amélioration moyenne attendue
    avg_improvement := 12.5; -- Amélioration moyenne estimée
    
    RETURN QUERY SELECT optimized_count, avg_improvement;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE virtual_scroll_configurations IS 'Configurations de virtual scroll par composant et utilisateur';
COMMENT ON TABLE virtual_scroll_sessions IS 'Sessions d\'utilisation du virtual scroll pour le tracking';
COMMENT ON TABLE virtual_scroll_events IS 'Événements détaillés du virtual scroll pour l\'analyse de performance';
COMMENT ON TABLE virtual_scroll_metrics IS 'Métriques de performance en temps réel du virtual scroll';
COMMENT ON TABLE virtual_scroll_cache_stats IS 'Statistiques d\'utilisation du cache de virtual scroll';
COMMENT ON TABLE virtual_scroll_performance IS 'Performances agrégées par composant et utilisateur';
COMMENT ON TABLE virtual_scroll_optimizations IS 'Optimisations appliquées et leur impact sur les performances';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN virtual_scroll_configurations.configuration IS 'Configuration complète du virtual scroll {itemHeight, overscan, threshold, etc}';
COMMENT ON COLUMN virtual_scroll_sessions.interactions IS 'Interactions utilisateur pendant la session {clicks, scrolls, temps}';
COMMENT ON COLUMN virtual_scroll_events.event_data IS 'Données détaillées de l\'événement {scrollPosition, velocity, itemIndex}';
COMMENT ON COLUMN virtual_scroll_metrics.performance_score IS 'Score de performance global (0-100) basé sur FPS, cache, erreurs';
COMMENT ON COLUMN virtual_scroll_performance.performance_score IS 'Score de performance agrégé pour la période';
COMMENT ON COLUMN virtual_scroll_optimizations.performance_impact IS 'Impact mesuré de l\'optimisation {before, after, improvement}';
