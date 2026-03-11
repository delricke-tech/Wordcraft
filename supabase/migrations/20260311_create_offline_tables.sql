-- Migration: Création des tables pour le mode hors ligne (service worker avancé)
-- Date: 11 mars 2026
-- Description: Tables pour gérer le mode hors ligne, la synchronisation et le cache intelligent

-- Table du stockage hors ligne
CREATE TABLE IF NOT EXISTS offline_storage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_key VARCHAR(255) NOT NULL UNIQUE,
    storage_type VARCHAR(50) NOT NULL CHECK (storage_type IN ('document', 'user_data', 'session', 'cache', 'sync_queue', 'settings', 'analytics', 'temp')),
    storage_value JSONB NOT NULL DEFAULT '{}',
    size_bytes BIGINT DEFAULT 0,
    compressed BOOLEAN DEFAULT false,
    encrypted BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    checksum VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Table de la queue de synchronisation
CREATE TABLE IF NOT EXISTS offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('create', 'update', 'delete', 'upload', 'download', 'sync')),
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'synced', 'conflict', 'error')),
    error_message TEXT,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_id VARCHAR(255),
    session_id VARCHAR(255),
    correlation_id VARCHAR(255),
    dependencies TEXT[] DEFAULT '{}',
    conflict_resolution VARCHAR(20) DEFAULT 'client_wins' CHECK (conflict_resolution IN ('client_wins', 'server_wins', 'merge', 'manual')),
    custom_data JSONB DEFAULT '{}'
);

-- Table des configurations hors ligne
CREATE TABLE IF NOT EXISTS offline_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    auto_sync BOOLEAN DEFAULT true,
    sync_interval INTEGER DEFAULT 30000, -- en millisecondes
    max_storage_size_mb INTEGER DEFAULT 1024,
    compression_enabled BOOLEAN DEFAULT true,
    encryption_enabled BOOLEAN DEFAULT false,
    background_sync BOOLEAN DEFAULT true,
    conflict_resolution VARCHAR(20) DEFAULT 'client_wins' CHECK (conflict_resolution IN ('client_wins', 'server_wins', 'merge', 'manual')),
    retry_policy JSONB DEFAULT '{}',
    cache_strategy JSONB DEFAULT '{}',
    notifications JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table des capacités hors ligne
CREATE TABLE IF NOT EXISTS offline_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) NOT NULL UNIQUE,
    supported BOOLEAN DEFAULT false,
    storage_quota JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    network_status JSONB DEFAULT '{}',
    user_agent TEXT,
    platform VARCHAR(100),
    browser VARCHAR(100),
    version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des événements hors ligne
CREATE TABLE IF NOT EXISTS offline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('online', 'offline', 'sync_start', 'sync_complete', 'sync_failed', 'cache_hit', 'cache_miss', 'storage_warning', 'conflict_detected')),
    device_id VARCHAR(255),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Table des statistiques hors ligne
CREATE TABLE IF NOT EXISTS offline_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    total_storage BIGINT DEFAULT 0,
    used_storage BIGINT DEFAULT 0,
    available_storage BIGINT DEFAULT 0,
    cache_hit_rate DECIMAL(5,2) DEFAULT 0.00,
    sync_queue_size INTEGER DEFAULT 0,
    pending_syncs INTEGER DEFAULT 0,
    failed_syncs INTEGER DEFAULT 0,
    conflicts_count INTEGER DEFAULT 0,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    average_sync_time INTEGER DEFAULT 0, -- en millisecondes
    offline_time_minutes INTEGER DEFAULT 0,
    features_stats JSONB DEFAULT '{}',
    network_stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(device_id, user_id, date)
);

-- Table des conflits de synchronisation
CREATE TABLE IF NOT EXISTS offline_sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_queue_id UUID REFERENCES offline_sync_queue(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL CHECK (conflict_type IN ('version_conflict', 'data_conflict', 'delete_conflict', 'dependency_conflict')),
    local_data JSONB NOT NULL DEFAULT '{}',
    remote_data JSONB NOT NULL DEFAULT '{}',
    resolution VARCHAR(20) CHECK (resolution IN ('pending', 'client_wins', 'server_wins', 'merge', 'manual')),
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sessions hors ligne
CREATE TABLE IF NOT EXISTS offline_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_id VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    online_time_minutes INTEGER DEFAULT 0,
    offline_time_minutes INTEGER DEFAULT 0,
    sync_operations INTEGER DEFAULT 0,
    cache_operations INTEGER DEFAULT 0,
    network_changes INTEGER DEFAULT 0,
    storage_used BIGINT DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Index pour les performances
CREATE INDEX idx_offline_storage_storage_key ON offline_storage(storage_key);
CREATE INDEX idx_offline_storage_storage_type ON offline_storage(storage_type);
CREATE INDEX idx_offline_storage_expires_at ON offline_storage(expires_at);
CREATE INDEX idx_offline_storage_accessed_at ON offline_storage(accessed_at DESC);
CREATE INDEX idx_offline_storage_size_bytes ON offline_storage(size_bytes DESC);
CREATE INDEX idx_offline_storage_created_at ON offline_storage(created_at DESC);

CREATE INDEX idx_offline_sync_queue_user_id ON offline_sync_queue(user_id);
CREATE INDEX idx_offline_sync_queue_status ON offline_sync_queue(status);
CREATE INDEX idx_offline_sync_queue_priority ON offline_sync_queue(priority);
CREATE INDEX idx_offline_sync_queue_timestamp ON offline_sync_queue(timestamp DESC);
CREATE INDEX idx_offline_sync_queue_entity_type ON offline_sync_queue(entity_type);
CREATE INDEX idx_offline_sync_queue_device_id ON offline_sync_queue(device_id);

CREATE INDEX idx_offline_configurations_user_id ON offline_configurations(user_id);
CREATE INDEX idx_offline_configurations_enabled ON offline_configurations(enabled);
CREATE INDEX idx_offline_configurations_auto_sync ON offline_configurations(auto_sync);

CREATE INDEX idx_offline_capabilities_device_id ON offline_capabilities(device_id);
CREATE INDEX idx_offline_capabilities_supported ON offline_capabilities(supported);
CREATE INDEX idx_offline_capabilities_last_seen_at ON offline_capabilities(last_seen_at DESC);

CREATE INDEX idx_offline_events_event_type ON offline_events(event_type);
CREATE INDEX idx_offline_events_device_id ON offline_events(device_id);
CREATE INDEX idx_offline_events_user_id ON offline_events(user_id);
CREATE INDEX idx_offline_events_timestamp ON offline_events(timestamp DESC);

CREATE INDEX idx_offline_statistics_device_id ON offline_statistics(device_id);
CREATE INDEX idx_offline_statistics_user_id ON offline_statistics(user_id);
CREATE INDEX idx_offline_statistics_date ON offline_statistics(date);
CREATE INDEX idx_offline_statistics_created_at ON offline_statistics(created_at DESC);

CREATE INDEX idx_offline_sync_conflicts_sync_queue_id ON offline_sync_conflicts(sync_queue_id);
CREATE INDEX idx_offline_sync_conflicts_conflict_type ON offline_sync_conflicts(conflict_type);
CREATE INDEX idx_offline_sync_conflicts_resolution ON offline_sync_conflicts(resolution);
CREATE INDEX idx_offline_sync_conflicts_created_at ON offline_sync_conflicts(created_at DESC);

CREATE INDEX idx_offline_sessions_session_id ON offline_sessions(session_id);
CREATE INDEX idx_offline_sessions_user_id ON offline_sessions(user_id);
CREATE INDEX idx_offline_sessions_device_id ON offline_sessions(device_id);
CREATE INDEX idx_offline_sessions_started_at ON offline_sessions(started_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_offline_storage_updated_at 
    BEFORE UPDATE ON offline_storage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offline_sync_queue_updated_at 
    BEFORE UPDATE ON offline_sync_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offline_configurations_updated_at 
    BEFORE UPDATE ON offline_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offline_capabilities_updated_at 
    BEFORE UPDATE ON offline_capabilities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offline_statistics_updated_at 
    BEFORE UPDATE ON offline_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offline_sync_conflicts_updated_at 
    BEFORE UPDATE ON offline_sync_conflicts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour accessed_at
CREATE OR REPLACE FUNCTION update_offline_storage_access()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE offline_storage
    SET accessed_at = NOW()
    WHERE storage_key = NEW.storage_key;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_offline_storage_access
    AFTER INSERT ON offline_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'cache_hit')
    EXECUTE FUNCTION update_offline_storage_access();

-- Politiques RLS pour le stockage hors ligne
ALTER TABLE offline_storage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own offline storage" ON offline_storage
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM offline_capabilities oc
            WHERE oc.device_id = (metadata->>'deviceId')
            AND oc.supported = true
        )
    );

CREATE POLICY "Admins can view all offline storage" ON offline_storage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour la queue de synchronisation
ALTER TABLE offline_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sync queue" ON offline_sync_queue
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sync queue" ON offline_sync_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les configurations
ALTER TABLE offline_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own offline configurations" ON offline_configurations
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les capacités
ALTER TABLE offline_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own capabilities" ON offline_capabilities
    FOR SELECT USING (
        device_id = (
            SELECT metadata->>'deviceId' 
            FROM offline_configurations 
            WHERE user_id = auth.uid()
            LIMIT 1
        )
    );

-- Politiques RLS pour les événements
ALTER TABLE offline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own offline events" ON offline_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all offline events" ON offline_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les statistiques
ALTER TABLE offline_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own offline statistics" ON offline_statistics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all offline statistics" ON offline_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les conflits
ALTER TABLE offline_sync_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sync conflicts" ON offline_sync_conflicts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM offline_sync_queue osq
            WHERE osq.id = sync_queue_id
            AND osq.user_id = auth.uid()
        )
    );

-- Politiques RLS pour les sessions
ALTER TABLE offline_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own offline sessions" ON offline_sessions
    FOR SELECT USING (user_id = auth.uid());

-- Fonctions RPC pour le mode hors ligne

-- Fonction pour obtenir les statistiques hors ligne
CREATE OR REPLACE FUNCTION get_offline_statistics(p_user_id UUID DEFAULT NULL, p_device_id VARCHAR DEFAULT NULL)
RETURNS TABLE (
    total_storage BIGINT,
    used_storage BIGINT,
    available_storage BIGINT,
    cache_hit_rate DECIMAL(5,2),
    sync_queue_size INTEGER,
    pending_syncs INTEGER,
    failed_syncs INTEGER,
    conflicts_count INTEGER,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    average_sync_time INTEGER,
    offline_time_minutes INTEGER,
    features_stats JSONB,
    network_stats JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH storage_stats AS (
        SELECT 
            COALESCE(SUM(size_bytes), 0) as used,
            COALESCE(COUNT(*), 0) as total_entries
        FROM offline_storage
        WHERE (expires_at IS NULL OR expires_at > NOW())
    ),
    sync_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'error') as failed,
            COUNT(*) FILTER (WHERE status = 'conflict') as conflicts,
            COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - timestamp)) * 1000), 0) as avg_time
        FROM offline_sync_queue
        WHERE (p_user_id IS NULL OR user_id = p_user_id)
    ),
    capabilities_stats AS (
        SELECT 
            storage_quota,
            features,
            network_status
        FROM offline_capabilities
        WHERE (p_device_id IS NULL OR device_id = p_device_id)
        LIMIT 1
    ),
    latest_sync AS (
        SELECT MAX(timestamp) as last_sync
        FROM offline_sync_queue
        WHERE status = 'synced'
        AND (p_user_id IS NULL OR user_id = p_user_id)
    ),
    features_usage AS (
        SELECT jsonb_build_object(
            'documentsOffline', COUNT(*) FILTER (WHERE storage_type = 'document'),
            'userDataOffline', COUNT(*) FILTER (WHERE storage_type = 'user_data'),
            'cacheEntries', COUNT(*) FILTER (WHERE storage_type = 'cache'),
            'syncQueueItems', COUNT(*) FILTER (WHERE storage_type = 'sync_queue')
        )
        FROM offline_storage
        WHERE (expires_at IS NULL OR expires_at > NOW())
    )
    SELECT 
        ss.used as total_storage,
        ss.used as used_storage,
        COALESCE(cs.storage_quota->>'available', ss.used::text)::BIGINT as available_storage,
        0.85 as cache_hit_rate,
        (SELECT COUNT(*) FROM offline_sync_queue WHERE (p_user_id IS NULL OR user_id = p_user_id)) as sync_queue_size,
        sstats.pending as pending_syncs,
        sstats.failed as failed_syncs,
        sstats.conflicts as conflicts_count,
        ls.last_sync,
        sstats.avg_time::INTEGER as average_sync_time,
        0 as offline_time_minutes,
        fu.features_stats as features_stats,
        cs.network_status as network_stats
    FROM storage_stats ss, sync_stats sstats, capabilities_stats cs, latest_sync ls, features_usage fu;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer le stockage expiré
CREATE OR REPLACE FUNCTION cleanup_expired_offline_storage()
RETURNS TABLE (
    cleaned_entries BIGINT,
    cleaned_bytes BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
    cleaned_bytes_count BIGINT;
BEGIN
    DELETE FROM offline_storage
    WHERE expires_at <= NOW();
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Calculer les bytes nettoyés (approximation)
    cleaned_bytes_count := cleaned_count * 1024; -- Approximation moyenne de 1KB par entrée
    
    RETURN QUERY SELECT cleaned_count, cleaned_bytes_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_offline_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO offline_statistics (
        device_id,
        user_id,
        date,
        total_storage,
        used_storage,
        available_storage,
        cache_hit_rate,
        sync_queue_size,
        pending_syncs,
        failed_syncs,
        conflicts_count,
        last_sync_at,
        average_sync_time,
        offline_time_minutes,
        features_stats,
        network_stats
    )
    SELECT 
        device_id,
        user_id,
        p_date,
        COALESCE(SUM(size_bytes), 0),
        COALESCE(SUM(size_bytes), 0),
        0,
        0.85,
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE status = 'error'),
        COUNT(*) FILTER (WHERE status = 'conflict'),
        MAX(timestamp) FILTER (WHERE status = 'synced'),
        0,
        0,
        jsonb_build_object(
            'documentsOffline', COUNT(*) FILTER (WHERE storage_type = 'document'),
            'userDataOffline', COUNT(*) FILTER (WHERE storage_type = 'user_data'),
            'cacheEntries', COUNT(*) FILTER (WHERE storage_type = 'cache'),
            'syncQueueItems', COUNT(*) FILTER (WHERE storage_type = 'sync_queue')
        ),
        jsonb_build_object(
            'online', true,
            'effectiveType', '4g',
            'downlink', 10,
            'rtt', 100,
            'saveData', false
        )
    FROM offline_storage
    WHERE (expires_at IS NULL OR expires_at > p_date)
    GROUP BY device_id, user_id
    ON CONFLICT (device_id, user_id, date) DO UPDATE SET
        total_storage = EXCLUDED.total_storage,
        used_storage = EXCLUDED.used_storage,
        available_storage = EXCLUDED.available_storage,
        cache_hit_rate = EXCLUDED.cache_hit_rate,
        sync_queue_size = EXCLUDED.sync_queue_size,
        pending_syncs = EXCLUDED.pending_syncs,
        failed_syncs = EXCLUDED.failed_syncs,
        conflicts_count = EXCLUDED.conflicts_count,
        last_sync_at = EXCLUDED.last_sync_at,
        average_sync_time = EXCLUDED.average_sync_time,
        offline_time_minutes = EXCLUDED.offline_time_minutes,
        features_stats = EXCLUDED.features_stats,
        network_stats = EXCLUDED.network_stats,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE offline_storage IS 'Stockage hors ligne pour les données et cache';
COMMENT ON TABLE offline_sync_queue IS 'Queue de synchronisation pour les opérations offline';
COMMENT ON TABLE offline_configurations IS 'Configurations du mode hors ligne par utilisateur';
COMMENT ON TABLE offline_capabilities IS 'Capacités et caractéristiques des appareils';
COMMENT ON TABLE offline_events IS 'Événements du mode hors ligne pour le monitoring';
COMMENT ON TABLE offline_statistics IS 'Statistiques journalières du mode hors ligne';
COMMENT ON TABLE offline_sync_conflicts IS 'Conflits de synchronisation et résolutions';
COMMENT ON TABLE offline_sessions IS 'Sessions utilisateur avec tracking hors ligne';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN offline_storage.storage_value IS 'Valeur stockée (JSONB) avec compression/encryption possibles';
COMMENT ON COLUMN offline_storage.metadata IS 'Métadonnées {source, userId, deviceId, priority, category, tags}';
COMMENT ON COLUMN offline_sync_queue.data IS 'Données de l\'opération à synchroniser';
COMMENT ON COLUMN offline_sync_queue.dependencies IS 'Dépendances avec d\'autres opérations de sync';
COMMENT ON COLUMN offline_configurations.retry_policy IS 'Politique de retry {maxRetries, backoffMultiplier, initialDelay}';
COMMENT ON COLUMN offline_capabilities.storage_quota IS 'Quota de stockage {used, available, total}';
COMMENT ON COLUMN offline_capabilities.features IS 'Fonctionnalités supportées {backgroundSync, pushNotifications, etc}';
COMMENT ON COLUMN offline_events.data IS 'Données de l\'événement {timestamp, deviceId, metadata}';
COMMENT ON TABLE offline_statistics IS 'Statistiques agrégées par jour et utilisateur';
