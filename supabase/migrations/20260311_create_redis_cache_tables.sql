-- Migration: Création des tables pour le cache Redis (performance scaling)
-- Date: 11 mars 2026
-- Description: Tables pour gérer le cache Redis, les configurations et les statistiques

-- Table des entrées de cache
CREATE TABLE IF NOT EXISTS redis_cache_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) NOT NULL,
    cache_value JSONB NOT NULL DEFAULT '{}',
    ttl INTEGER DEFAULT 3600, -- en secondes
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    size_bytes BIGINT DEFAULT 0,
    compressed BOOLEAN DEFAULT false,
    encrypted BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(cache_key)
);

-- Table des configurations de cache
CREATE TABLE IF NOT EXISTS redis_cache_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    max_memory_mb INTEGER DEFAULT 1024,
    max_entries INTEGER DEFAULT 10000,
    default_ttl INTEGER DEFAULT 3600,
    eviction_policy VARCHAR(20) DEFAULT 'lru' CHECK (eviction_policy IN ('lru', 'lfu', 'fifo', 'random', 'ttl', 'size', 'custom')),
    compression_enabled BOOLEAN DEFAULT true,
    encryption_enabled BOOLEAN DEFAULT false,
    persistence_enabled BOOLEAN DEFAULT true,
    backup_enabled BOOLEAN DEFAULT false,
    monitoring_enabled BOOLEAN DEFAULT true,
    analytics_enabled BOOLEAN DEFAULT true,
    custom_settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Table des patterns de clés de cache
CREATE TABLE IF NOT EXISTS redis_cache_key_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('user_data', 'session_data', 'query_results', 'api_responses', 'static_assets', 'computed_values', 'search_results', 'file_metadata', 'analytics', 'system')),
    ttl INTEGER DEFAULT 3600,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    tags TEXT[] DEFAULT '{}',
    dependencies TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des règles d'invalidation
CREATE TABLE IF NOT EXISTS redis_cache_invalidation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    pattern VARCHAR(255) NOT NULL,
    trigger VARCHAR(20) NOT NULL CHECK (trigger IN ('time_based', 'event_based', 'dependency_based', 'manual', 'size_based')),
    action VARCHAR(20) NOT NULL CHECK (action IN ('delete', 'refresh', 'recompute', 'archive', 'custom')),
    is_active BOOLEAN DEFAULT true,
    schedule VARCHAR(100), -- cron expression
    conditions JSONB DEFAULT '{}',
    custom_logic TEXT,
    notifications_enabled BOOLEAN DEFAULT false,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des statistiques de cache
CREATE TABLE IF NOT EXISTS redis_cache_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_entries INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    hit_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (hit_rate >= 0 AND hit_rate <= 100),
    miss_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (miss_rate >= 0 AND miss_rate <= 100),
    eviction_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (eviction_rate >= 0 AND eviction_rate <= 100),
    average_ttl INTEGER DEFAULT 0,
    entries_by_category JSONB DEFAULT '{}',
    entries_by_priority JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    trends JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Table des événements de cache
CREATE TABLE IF NOT EXISTS redis_cache_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('set', 'get', 'hit', 'miss', 'delete', 'evict', 'expire', 'invalidate', 'warmup', 'backup', 'restore')),
    cache_key VARCHAR(255),
    category VARCHAR(50),
    priority VARCHAR(20),
    size_bytes BIGINT DEFAULT 0,
    ttl INTEGER,
    duration_ms INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des configurations de warmup
CREATE TABLE IF NOT EXISTS redis_cache_warmup_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    enabled BOOLEAN DEFAULT false,
    patterns TEXT[] DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    concurrency INTEGER DEFAULT 5,
    retry_count INTEGER DEFAULT 3,
    delay_ms INTEGER DEFAULT 100,
    batch_size INTEGER DEFAULT 100,
    timeout_ms INTEGER DEFAULT 5000,
    error_handling VARCHAR(20) DEFAULT 'skip' CHECK (error_handling IN ('skip', 'retry', 'abort')),
    progress_callback_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Table des logs de warmup
CREATE TABLE IF NOT EXISTS redis_cache_warmup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warmup_config_id UUID REFERENCES redis_cache_warmup_configs(id) ON DELETE CASCADE,
    pattern VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    keys_processed INTEGER DEFAULT 0,
    keys_failed INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sauvegardes de cache
CREATE TABLE IF NOT EXISTS redis_cache_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    backup_type VARCHAR(20) DEFAULT 'full' CHECK (backup_type IN ('full', 'incremental', 'differential')),
    file_path TEXT,
    file_size_bytes BIGINT DEFAULT 0,
    entries_count INTEGER DEFAULT 0,
    compression_enabled BOOLEAN DEFAULT true,
    encryption_enabled BOOLEAN DEFAULT false,
    checksum VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Index pour les performances
CREATE INDEX idx_redis_cache_entries_cache_key ON redis_cache_entries(cache_key);
CREATE INDEX idx_redis_cache_entries_expires_at ON redis_cache_entries(expires_at);
CREATE INDEX idx_redis_cache_entries_accessed_at ON redis_cache_entries(accessed_at DESC);
CREATE INDEX idx_redis_cache_entries_access_count ON redis_cache_entries(access_count DESC);
CREATE INDEX idx_redis_cache_entries_size_bytes ON redis_cache_entries(size_bytes DESC);
CREATE INDEX idx_redis_cache_entries_created_at ON redis_cache_entries(created_at DESC);

CREATE INDEX idx_redis_cache_configurations_name ON redis_cache_configurations(name);
CREATE INDEX idx_redis_cache_configurations_is_active ON redis_cache_configurations(is_active);
CREATE INDEX idx_redis_cache_configurations_created_by ON redis_cache_configurations(created_by);

CREATE INDEX idx_redis_cache_key_patterns_pattern ON redis_cache_key_patterns(pattern);
CREATE INDEX idx_redis_cache_key_patterns_category ON redis_cache_key_patterns(category);
CREATE INDEX idx_redis_cache_key_patterns_priority ON redis_cache_key_patterns(priority);
CREATE INDEX idx_redis_cache_key_patterns_is_active ON redis_cache_key_patterns(is_active);

CREATE INDEX idx_redis_cache_invalidation_rules_pattern ON redis_cache_invalidation_rules(pattern);
CREATE INDEX idx_redis_cache_invalidation_rules_trigger ON redis_cache_invalidation_rules(trigger);
CREATE INDEX idx_redis_cache_invalidation_rules_is_active ON redis_cache_invalidation_rules(is_active);
CREATE INDEX idx_redis_cache_invalidation_rules_last_executed_at ON redis_cache_invalidation_rules(last_executed_at DESC);

CREATE INDEX idx_redis_cache_statistics_date ON redis_cache_statistics(date);
CREATE INDEX idx_redis_cache_statistics_hit_rate ON redis_cache_statistics(hit_rate DESC);
CREATE INDEX idx_redis_cache_statistics_created_at ON redis_cache_statistics(created_at DESC);

CREATE INDEX idx_redis_cache_events_event_type ON redis_cache_events(event_type);
CREATE INDEX idx_redis_cache_events_cache_key ON redis_cache_events(cache_key);
CREATE INDEX idx_redis_cache_events_category ON redis_cache_events(category);
CREATE INDEX idx_redis_cache_events_user_id ON redis_cache_events(user_id);
CREATE INDEX idx_redis_cache_events_created_at ON redis_cache_events(created_at DESC);

CREATE INDEX idx_redis_cache_warmup_configs_name ON redis_cache_warmup_configs(name);
CREATE INDEX idx_redis_cache_warmup_configs_enabled ON redis_cache_warmup_configs(enabled);
CREATE INDEX idx_redis_cache_warmup_configs_is_active ON redis_cache_warmup_configs(is_active);
CREATE INDEX idx_redis_cache_warmup_configs_created_by ON redis_cache_warmup_configs(created_by);

CREATE INDEX idx_redis_cache_warmup_logs_warmup_config_id ON redis_cache_warmup_logs(warmup_config_id);
CREATE INDEX idx_redis_cache_warmup_logs_status ON redis_cache_warmup_logs(status);
CREATE INDEX idx_redis_cache_warmup_logs_start_time ON redis_cache_warmup_logs(start_time DESC);
CREATE INDEX idx_redis_cache_warmup_logs_created_at ON redis_cache_warmup_logs(created_at DESC);

CREATE INDEX idx_redis_cache_backups_name ON redis_cache_backups(name);
CREATE INDEX idx_redis_cache_backups_backup_type ON redis_cache_backups(backup_type);
CREATE INDEX idx_redis_cache_backups_status ON redis_cache_backups(status);
CREATE INDEX idx_redis_cache_backups_created_at ON redis_cache_backups(created_at DESC);
CREATE INDEX idx_redis_cache_backups_created_by ON redis_cache_backups(created_by);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_redis_cache_entries_updated_at 
    BEFORE UPDATE ON redis_cache_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_redis_cache_configurations_updated_at 
    BEFORE UPDATE ON redis_cache_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_redis_cache_key_patterns_updated_at 
    BEFORE UPDATE ON redis_cache_key_patterns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_redis_cache_invalidation_rules_updated_at 
    BEFORE UPDATE ON redis_cache_invalidation_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_redis_cache_statistics_updated_at 
    BEFORE UPDATE ON redis_cache_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_redis_cache_warmup_configs_updated_at 
    BEFORE UPDATE ON redis_cache_warmup_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour accessed_at et access_count
CREATE OR REPLACE FUNCTION update_cache_entry_access()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE redis_cache_entries
    SET 
        accessed_at = NOW(),
        access_count = access_count + 1
    WHERE cache_key = NEW.cache_key;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cache_entry_access
    AFTER INSERT ON redis_cache_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'get' AND NEW.success = true)
    EXECUTE FUNCTION update_cache_entry_access();

-- Politiques RLS pour les entrées de cache
ALTER TABLE redis_cache_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cache entries" ON redis_cache_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les configurations
ALTER TABLE redis_cache_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active cache configurations" ON redis_cache_configurations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage cache configurations" ON redis_cache_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les patterns de clés
ALTER TABLE redis_cache_key_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active key patterns" ON redis_cache_key_patterns
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage key patterns" ON redis_cache_key_patterns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les règles d'invalidation
ALTER TABLE redis_cache_invalidation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active invalidation rules" ON redis_cache_invalidation_rules
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage invalidation rules" ON redis_cache_invalidation_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les statistiques
ALTER TABLE redis_cache_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cache statistics" ON redis_cache_statistics
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage cache statistics" ON redis_cache_statistics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les événements
ALTER TABLE redis_cache_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cache events" ON redis_cache_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all cache events" ON redis_cache_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les configurations de warmup
ALTER TABLE redis_cache_warmup_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own warmup configs" ON redis_cache_warmup_configs
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Admins can manage warmup configs" ON redis_cache_warmup_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les logs de warmup
ALTER TABLE redis_cache_warmup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own warmup logs" ON redis_cache_warmup_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM redis_cache_warmup_configs wc
            WHERE wc.id = warmup_config_id
            AND wc.created_by = auth.uid()
        )
    );

CREATE POLICY "Admins can view all warmup logs" ON redis_cache_warmup_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les sauvegardes
ALTER TABLE redis_cache_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cache backups" ON redis_cache_backups
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Admins can manage cache backups" ON redis_cache_backups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour le cache Redis

-- Fonction pour obtenir les statistiques du cache
CREATE OR REPLACE FUNCTION get_redis_cache_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_entries BIGINT,
    total_size_bytes BIGINT,
    hit_rate DECIMAL(5,2),
    miss_rate DECIMAL(5,2),
    eviction_rate DECIMAL(5,2),
    average_ttl INTEGER,
    entries_by_category JSONB,
    entries_by_priority JSONB,
    performance_metrics JSONB,
    trends JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH cache_stats AS (
        SELECT 
            COUNT(*) as total,
            COALESCE(SUM(size_bytes), 0) as total_size,
            COALESCE(AVG(ttl), 0) as avg_ttl
        FROM redis_cache_entries
        WHERE expires_at > NOW() OR expires_at IS NULL
    ),
    hit_miss_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE event_type = 'hit')::DECIMAL * 100 / NULLIF(COUNT(*), 0) as hit_rate_calc,
            COUNT(*) FILTER (WHERE event_type = 'miss')::DECIMAL * 100 / NULLIF(COUNT(*), 0) as miss_rate_calc
        FROM redis_cache_events
        WHERE DATE(created_at) = p_date
        AND event_type IN ('hit', 'miss')
    ),
    category_stats AS (
        SELECT jsonb_object_agg(
            COALESCE(metadata->>'category', 'system'), 
            category_count
        )
        FROM (
            SELECT 
                COALESCE(metadata->>'category', 'system') as category,
                COUNT(*) as category_count
            FROM redis_cache_entries
            WHERE expires_at > NOW() OR expires_at IS NULL
            GROUP BY COALESCE(metadata->>'category', 'system')
        ) cat_counts
    ),
    priority_stats AS (
        SELECT jsonb_object_agg(
            COALESCE(metadata->>'priority', 'normal'), 
            priority_count
        )
        FROM (
            SELECT 
                COALESCE(metadata->>'priority', 'normal') as priority,
                COUNT(*) as priority_count
            FROM redis_cache_entries
            WHERE expires_at > NOW() OR expires_at IS NULL
            GROUP BY COALESCE(metadata->>'priority', 'normal')
        ) pri_counts
    ),
    performance_stats AS (
        SELECT jsonb_build_object(
            'averageGetTime', COALESCE(AVG(duration_ms) FILTER (WHERE event_type = 'get'), 0),
            'averageSetTime', COALESCE(AVG(duration_ms) FILTER (WHERE event_type = 'set'), 0),
            'averageDeleteTime', COALESCE(AVG(duration_ms) FILTER (WHERE event_type = 'delete'), 0),
            'totalEvents', COUNT(*),
            'errorRate', COUNT(*) FILTER (WHERE NOT success)::DECIMAL / NULLIF(COUNT(*), 0) * 100
        )
        FROM redis_cache_events
        WHERE DATE(created_at) = p_date
    ),
    trends_stats AS (
        SELECT jsonb_build_object(
            'hitRateTrend', ARRAY(
                SELECT COALESCE(hit_rate, 0)
                FROM redis_cache_statistics
                WHERE date >= p_date - INTERVAL '7 days'
                ORDER BY date ASC
            ),
            'sizeTrend', ARRAY(
                SELECT total_size_bytes
                FROM redis_cache_statistics
                WHERE date >= p_date - INTERVAL '7 days'
                ORDER BY date ASC
            ),
            'accessCountTrend', ARRAY(
                SELECT total_entries
                FROM redis_cache_statistics
                WHERE date >= p_date - INTERVAL '7 days'
                ORDER BY date ASC
            )
        )
    )
    SELECT 
        cs.total as total_entries,
        cs.total_size as total_size_bytes,
        COALESCE(hms.hit_rate_calc, 0) as hit_rate,
        COALESCE(hms.miss_rate_calc, 0) as miss_rate,
        0 as eviction_rate,
        cs.avg_ttl as average_ttl,
        cs.category_stats as entries_by_category,
        cs.priority_stats as entries_by_priority,
        ps.performance_stats as performance_metrics,
        ts.trends_stats as trends
    FROM cache_stats cs, hit_miss_stats hms, category_stats cs, priority_stats ps,
         performance_stats ps2, trends_stats ts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les patterns de clés par défaut
CREATE OR REPLACE FUNCTION create_default_redis_cache_patterns()
RETURNS VOID AS $$
BEGIN
    INSERT INTO redis_cache_key_patterns (pattern, description, category, ttl, priority, tags, dependencies)
    VALUES 
        ('user:*:profile', 'Profil utilisateur', 'user_data', 3600, 'high', ARRAY['user', 'profile'], ARRAY[]),
        ('user:*:preferences', 'Préférences utilisateur', 'user_data', 7200, 'normal', ARRAY['user', 'preferences'], ARRAY[]),
        ('session:*', 'Session utilisateur', 'session_data', 1800, 'critical', ARRAY['session'], ARRAY[]),
        ('query:*:*', 'Résultats de requêtes', 'query_results', 600, 'normal', ARRAY['query', 'results'], ARRAY[]),
        ('api:*:*', 'Réponses API', 'api_responses', 300, 'normal', ARRAY['api', 'response'], ARRAY[]),
        ('search:*:*', 'Résultats de recherche', 'search_results', 900, 'high', ARRAY['search', 'results'], ARRAY[]),
        ('file:*:metadata', 'Métadonnées de fichiers', 'file_metadata', 3600, 'normal', ARRAY['file', 'metadata'], ARRAY[]),
        ('analytics:*', 'Données analytics', 'analytics', 1800, 'low', ARRAY['analytics'], ARRAY[]),
        ('static:*', 'Assets statiques', 'static_assets', 86400, 'normal', ARRAY['static', 'asset'], ARRAY[]),
        ('computed:*', 'Valeurs calculées', 'computed_values', 1800, 'normal', ARRAY['computed', 'value'], ARRAY[])
    ON CONFLICT (pattern) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les entrées expirées
CREATE OR REPLACE FUNCTION cleanup_expired_redis_cache()
RETURNS TABLE (
    cleaned_entries BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
BEGIN
    DELETE FROM redis_cache_entries
    WHERE expires_at <= NOW();
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_count as cleaned_entries;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_redis_cache_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO redis_cache_statistics (
        date,
        total_entries,
        total_size_bytes,
        hit_rate,
        miss_rate,
        eviction_rate,
        average_ttl,
        entries_by_category,
        entries_by_priority,
        performance_metrics,
        trends
    )
    SELECT 
        p_date,
        COUNT(*) FILTER (WHERE expires_at > NOW() OR expires_at IS NULL),
        COALESCE(SUM(size_bytes), 0),
        COALESCE(
            COUNT(*) FILTER (WHERE event_type = 'hit')::DECIMAL * 100 / NULLIF(COUNT(*), 0), 
            0
        ),
        COALESCE(
            COUNT(*) FILTER (WHERE event_type = 'miss')::DECIMAL * 100 / NULLIF(COUNT(*), 0), 
            0
        ),
        0,
        COALESCE(AVG(ttl), 0),
        jsonb_object_agg(
            COALESCE(metadata->>'category', 'system'), 
            category_count
        ),
        jsonb_object_agg(
            COALESCE(metadata->>'priority', 'normal'), 
            priority_count
        ),
        jsonb_build_object(
            'averageGetTime', COALESCE(AVG(duration_ms) FILTER (WHERE event_type = 'get'), 0),
            'averageSetTime', COALESCE(AVG(duration_ms) FILTER (WHERE event_type = 'set'), 0),
            'totalEvents', COUNT(*),
            'errorRate', COUNT(*) FILTER (WHERE NOT success)::DECIMAL / NULLIF(COUNT(*), 0) * 100
        ),
        jsonb_build_object(
            'hitRateTrend', ARRAY(SELECT COALESCE(hit_rate, 0) FROM redis_cache_statistics WHERE date >= p_date - INTERVAL '7 days' ORDER BY date ASC),
            'sizeTrend', ARRAY(SELECT total_size_bytes FROM redis_cache_statistics WHERE date >= p_date - INTERVAL '7 days' ORDER BY date ASC),
            'accessCountTrend', ARRAY(SELECT total_entries FROM redis_cache_statistics WHERE date >= p_date - INTERVAL '7 days' ORDER BY date ASC)
        )
    FROM redis_cache_entries rce
    LEFT JOIN redis_cache_events rcev ON DATE(rcev.created_at) = p_date
    WHERE (rce.expires_at > NOW() OR rce.expires_at IS NULL)
    OR rcev.event_type IS NOT NULL
    ON CONFLICT (date) DO UPDATE SET
        total_entries = EXCLUDED.total_entries,
        total_size_bytes = EXCLUDED.total_size_bytes,
        hit_rate = EXCLUDED.hit_rate,
        miss_rate = EXCLUDED.miss_rate,
        eviction_rate = EXCLUDED.eviction_rate,
        average_ttl = EXCLUDED.average_ttl,
        entries_by_category = EXCLUDED.entries_by_category,
        entries_by_priority = EXCLUDED.entries_by_priority,
        performance_metrics = EXCLUDED.performance_metrics,
        trends = EXCLUDED.trends,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE redis_cache_entries IS 'Entrées du cache Redis avec métadonnées';
COMMENT ON TABLE redis_cache_configurations IS 'Configurations du cache Redis';
COMMENT ON TABLE redis_cache_key_patterns IS 'Patterns de clés pour le cache';
COMMENT ON TABLE redis_cache_invalidation_rules IS 'Règles d\'invalidation du cache';
COMMENT ON TABLE redis_cache_statistics IS 'Statistiques journalières du cache';
COMMENT ON TABLE redis_cache_events IS 'Événements du cache pour le monitoring';
COMMENT ON TABLE redis_cache_warmup_configs IS 'Configurations de warmup du cache';
COMMENT ON TABLE redis_cache_warmup_logs IS 'Logs des opérations de warmup';
COMMENT ON TABLE redis_cache_backups IS 'Sauvegardes du cache Redis';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN redis_cache_entries.cache_value IS 'Valeur mise en cache (JSONB)';
COMMENT ON COLUMN redis_cache_entries.metadata IS 'Métadonnées de l\'entrée {source, userId, sessionId, priority, category, dependencies}';
COMMENT ON COLUMN redis_cache_configurations.custom_settings IS 'Paramètres personnalisés Redis';
COMMENT ON COLUMN redis_cache_key_patterns.dependencies IS 'Dépendances avec d\'autres patterns';
COMMENT ON COLUMN redis_cache_invalidation_rules.conditions IS 'Conditions pour déclencher la règle';
COMMENT ON COLUMN redis_cache_statistics.performance_metrics IS 'Métriques de performance {averageGetTime, averageSetTime, totalEvents, errorRate}';
COMMENT ON COLUMN redis_cache_events.metadata IS 'Métadonnées de l\'événement {requestId, userAgent, platform}';
COMMENT ON TABLE redis_cache_warmup_configs IS 'Configurations pour précharger le cache';

-- Créer les données par défaut
SELECT create_default_redis_cache_patterns();
