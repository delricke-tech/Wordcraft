-- Migration: Création des tables pour la compression de fichiers (gzip/brotli)
-- Date: 11 mars 2026
-- Description: Tables pour gérer la compression de fichiers, les algorithmes et les statistiques

-- Table des jobs de compression
CREATE TABLE IF NOT EXISTS compression_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    original_size BIGINT NOT NULL,
    compressed_size BIGINT DEFAULT 0,
    compression_ratio DECIMAL(5,2) DEFAULT 0.00 CHECK (compression_ratio >= 0),
    algorithm VARCHAR(20) NOT NULL CHECK (algorithm IN ('gzip', 'brotli', 'deflate', 'lz4', 'zstd')),
    level INTEGER DEFAULT 6 CHECK (level >= 1 AND level <= 9),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- en millisecondes
    error TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des profils de compression
CREATE TABLE IF NOT EXISTS compression_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    algorithm VARCHAR(20) NOT NULL CHECK (algorithm IN ('gzip', 'brotli', 'deflate', 'lz4', 'zstd')),
    level INTEGER DEFAULT 6 CHECK (level >= 1 AND level <= 9),
    settings JSONB NOT NULL DEFAULT '{}',
    optimization JSONB NOT NULL DEFAULT '{}',
    supported_formats TEXT[] DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Table du cache de compression
CREATE TABLE IF NOT EXISTS compression_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    file_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    algorithm VARCHAR(20) NOT NULL,
    level INTEGER NOT NULL,
    compressed_data TEXT, -- Base64 encoded
    original_size BIGINT NOT NULL,
    compressed_size BIGINT NOT NULL,
    compression_ratio DECIMAL(5,2) NOT NULL,
    compression_time INTEGER NOT NULL, -- en millisecondes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Table des benchmarks de compression
CREATE TABLE IF NOT EXISTS compression_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    algorithm VARCHAR(20) NOT NULL CHECK (algorithm IN ('gzip', 'brotli', 'deflate', 'lz4', 'zstd')),
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 9),
    file_size BIGINT NOT NULL,
    compression_time INTEGER NOT NULL, -- en millisecondes
    decompression_time INTEGER NOT NULL, -- en millisecondes
    compression_ratio DECIMAL(5,2) NOT NULL,
    memory_usage BIGINT DEFAULT 0, -- en bytes
    cpu_usage DECIMAL(5,2) DEFAULT 0.00, -- en pourcentage
    quality INTEGER DEFAULT 100 CHECK (quality >= 0 AND quality <= 100),
    file_type VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Table des statistiques de compression
CREATE TABLE IF NOT EXISTS compression_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    total_jobs INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    failed_jobs INTEGER DEFAULT 0,
    average_compression_ratio DECIMAL(5,2) DEFAULT 0.00,
    total_original_size BIGINT DEFAULT 0,
    total_compressed_size BIGINT DEFAULT 0,
    total_space_saved BIGINT DEFAULT 0,
    average_processing_time INTEGER DEFAULT 0, -- en millisecondes
    jobs_by_algorithm JSONB DEFAULT '{}',
    jobs_by_status JSONB DEFAULT '{}',
    performance JSONB DEFAULT '{}',
    trends JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Table des optimisations de compression
CREATE TABLE IF NOT EXISTS compression_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    file_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    optimization_type VARCHAR(50) NOT NULL CHECK (optimization_type IN ('remove_metadata', 'remove_comments', 'optimize_images', 'optimize_code', 'minify', 'convert_webp', 'adaptive_compression')),
    original_size BIGINT NOT NULL,
    optimized_size BIGINT DEFAULT 0,
    size_reduction DECIMAL(5,2) DEFAULT 0.00,
    processing_time INTEGER DEFAULT 0, -- en millisecondes
    quality_impact INTEGER DEFAULT 0, -- -100 à 100
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Table des configurations de compression par type de fichier
CREATE TABLE IF NOT EXISTS compression_file_type_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_type VARCHAR(50) NOT NULL UNIQUE,
    mime_type VARCHAR(100),
    default_algorithm VARCHAR(20) NOT NULL CHECK (default_algorithm IN ('gzip', 'brotli', 'deflate', 'lz4', 'zstd')),
    default_level INTEGER DEFAULT 6 CHECK (default_level >= 1 AND level <= 9),
    recommended_settings JSONB DEFAULT '{}',
    optimization_settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_compression_jobs_file_id ON compression_jobs(file_id);
CREATE INDEX idx_compression_jobs_status ON compression_jobs(status);
CREATE INDEX idx_compression_jobs_algorithm ON compression_jobs(algorithm);
CREATE INDEX idx_compression_jobs_level ON compression_jobs(level);
CREATE INDEX idx_compression_jobs_start_time ON compression_jobs(start_time DESC);
CREATE INDEX idx_compression_jobs_created_at ON compression_jobs(created_at DESC);

CREATE INDEX idx_compression_profiles_user_id ON compression_profiles(user_id);
CREATE INDEX idx_compression_profiles_algorithm ON compression_profiles(algorithm);
CREATE INDEX idx_compression_profiles_is_active ON compression_profiles(is_active);
CREATE INDEX idx_compression_profiles_is_default ON compression_profiles(is_default);

CREATE INDEX idx_compression_cache_file_id ON compression_cache(file_id);
CREATE INDEX idx_compression_cache_algorithm ON compression_cache(algorithm);
CREATE INDEX idx_compression_cache_level ON compression_cache(level);
CREATE INDEX idx_compression_cache_expires_at ON compression_cache(expires_at);
CREATE INDEX idx_compression_cache_access_count ON compression_cache(access_count DESC);
CREATE INDEX idx_compression_cache_accessed_at ON compression_cache(accessed_at DESC);

CREATE INDEX idx_compression_benchmarks_algorithm ON compression_benchmarks(algorithm);
CREATE INDEX idx_compression_benchmarks_level ON compression_benchmarks(level);
CREATE INDEX idx_compression_benchmarks_file_size ON compression_benchmarks(file_size);
CREATE INDEX idx_compression_benchmarks_timestamp ON compression_benchmarks(timestamp DESC);
CREATE INDEX idx_compression_benchmarks_file_type ON compression_benchmarks(file_type);

CREATE INDEX idx_compression_statistics_user_id ON compression_statistics(user_id);
CREATE INDEX idx_compression_statistics_date ON compression_statistics(date);
CREATE INDEX idx_compression_statistics_created_at ON compression_statistics(created_at DESC);

CREATE INDEX idx_compression_optimizations_user_id ON compression_optimizations(user_id);
CREATE INDEX idx_compression_optimizations_file_id ON compression_optimizations(file_id);
CREATE INDEX idx_compression_optimizations_optimization_type ON compression_optimizations(optimization_type);
CREATE INDEX idx_compression_optimizations_applied_at ON compression_optimizations(applied_at DESC);

CREATE INDEX idx_compression_file_type_configs_file_type ON compression_file_type_configs(file_type);
CREATE INDEX idx_compression_file_type_configs_mime_type ON compression_file_type_configs(mime_type);
CREATE INDEX idx_compression_file_type_configs_is_active ON compression_file_type_configs(is_active);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_compression_jobs_updated_at 
    BEFORE UPDATE ON compression_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compression_profiles_updated_at 
    BEFORE UPDATE ON compression_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compression_statistics_updated_at 
    BEFORE UPDATE ON compression_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compression_file_type_configs_updated_at 
    BEFORE UPDATE ON compression_file_type_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_compression_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO compression_statistics (
        user_id,
        date,
        total_jobs,
        completed_jobs,
        failed_jobs,
        average_compression_ratio,
        total_original_size,
        total_compressed_size,
        total_space_saved,
        average_processing_time,
        jobs_by_algorithm,
        jobs_by_status,
        performance,
        trends
    )
    SELECT 
        COALESCE(NEW.metadata->>'userId', '00000000-0000-0000-0000-000000000000')::UUID,
        CURRENT_DATE,
        1,
        CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
        NEW.compression_ratio,
        NEW.original_size,
        NEW.compressed_size,
        NEW.original_size - NEW.compressed_size,
        NEW.duration,
        jsonb_build_object(NEW.algorithm, 1),
        jsonb_build_object(NEW.status, 1),
        jsonb_build_object(
            'compressionSpeed', CASE WHEN NEW.duration > 0 THEN NEW.original_size / (NEW.duration / 1000.0) ELSE 0 END,
            'memoryUsage', COALESCE((NEW.metadata->>'memoryUsage')::BIGINT, 0),
            'cpuUsage', COALESCE((NEW.metadata->>'cpuUsage')::DECIMAL, 0)
        ),
        jsonb_build_object(
            'compressionRatioTrend', ARRAY[NEW.compression_ratio],
            'processingTimeTrend', ARRAY[NEW.duration],
            'spaceSavedTrend', ARRAY[NEW.original_size - NEW.compressed_size]
        )
    ON CONFLICT (user_id, date) DO UPDATE SET
        total_jobs = compression_statistics.total_jobs + 1,
        completed_jobs = compression_statistics.completed_jobs + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
        failed_jobs = compression_statistics.failed_jobs + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
        average_compression_ratio = (
            (compression_statistics.average_compression_ratio * compression_statistics.total_jobs + NEW.compression_ratio) / 
            (compression_statistics.total_jobs + 1)
        ),
        total_original_size = compression_statistics.total_original_size + NEW.original_size,
        total_compressed_size = compression_statistics.total_compressed_size + NEW.compressed_size,
        total_space_saved = compression_statistics.total_space_saved + (NEW.original_size - NEW.compressed_size),
        average_processing_time = (
            (compression_statistics.average_processing_time * compression_statistics.total_jobs + NEW.duration) / 
            (compression_statistics.total_jobs + 1)
        ),
        jobs_by_algorithm = jsonb_set(
            compression_statistics.jobs_by_algorithm,
            '{' || NEW.algorithm || '}',
            COALESCE((compression_statistics.jobs_by_algorithm->>NEW.algorithm)::INTEGER, 0) + 1
        ),
        jobs_by_status = jsonb_set(
            compression_statistics.jobs_by_status,
            '{' || NEW.status || '}',
            COALESCE((compression_statistics.jobs_by_status->>NEW.status)::INTEGER, 0) + 1
        ),
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_compression_statistics
    AFTER INSERT ON compression_jobs
    FOR EACH ROW EXECUTE FUNCTION update_compression_statistics();

-- Trigger pour mettre à jour le cache
CREATE OR REPLACE FUNCTION update_compression_cache_access()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE compression_cache
    SET 
        accessed_at = NOW(),
        access_count = access_count + 1
    WHERE cache_key = NEW.cache_key;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_compression_cache_access
    AFTER INSERT ON compression_jobs
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_compression_cache_access();

-- Politiques RLS pour les jobs de compression
ALTER TABLE compression_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own compression jobs" ON compression_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = file_id
            AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all compression jobs" ON compression_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les profils
ALTER TABLE compression_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own compression profiles" ON compression_profiles
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all compression profiles" ON compression_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour le cache
ALTER TABLE compression_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own compression cache" ON compression_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = file_id
            AND d.user_id = auth.uid()
        )
    );

-- Politiques RLS pour les benchmarks
ALTER TABLE compression_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view compression benchmarks" ON compression_benchmarks
    FOR SELECT USING (true);

-- Politiques RLS pour les statistiques
ALTER TABLE compression_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own compression statistics" ON compression_statistics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all compression statistics" ON compression_statistics
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
ALTER TABLE compression_optimizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own compression optimizations" ON compression_optimizations
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les configurations par type
ALTER TABLE compression_file_type_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active compression file type configs" ON compression_file_type_configs
    FOR SELECT USING (is_active = true);

-- Fonctions RPC pour la compression

-- Fonction pour obtenir les statistiques de compression
CREATE OR REPLACE FUNCTION get_compression_stats(p_user_id UUID DEFAULT NULL, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_jobs BIGINT,
    completed_jobs BIGINT,
    failed_jobs BIGINT,
    average_compression_ratio DECIMAL(5,2),
    total_original_size BIGINT,
    total_compressed_size BIGINT,
    total_space_saved BIGINT,
    average_processing_time INTEGER,
    jobs_by_algorithm JSONB,
    jobs_by_status JSONB,
    performance JSONB,
    trends JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH job_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            COALESCE(AVG(compression_ratio), 0) as avg_ratio,
            COALESCE(SUM(original_size), 0) as total_orig,
            COALESCE(SUM(compressed_size), 0) as total_comp,
            COALESCE(AVG(duration), 0) as avg_duration
        FROM compression_jobs
        WHERE (p_user_id IS NULL OR metadata->>'userId' = p_user_id::text)
        AND DATE(start_time) = p_date
    ),
    algorithm_breakdown AS (
        SELECT jsonb_object_agg(algorithm, job_count)
        FROM (
            SELECT 
                algorithm,
                COUNT(*) as job_count
            FROM compression_jobs
            WHERE (p_user_id IS NULL OR metadata->>'userId' = p_user_id::text)
            AND DATE(start_time) = p_date
            GROUP BY algorithm
        ) algo_counts
    ),
    status_breakdown AS (
        SELECT jsonb_object_agg(status, job_count)
        FROM (
            SELECT 
                status,
                COUNT(*) as job_count
            FROM compression_jobs
            WHERE (p_user_id IS NULL OR metadata->>'userId' = p_user_id::text)
            AND DATE(start_time) = p_date
            GROUP BY status
        ) status_counts
    ),
    performance_stats AS (
        SELECT jsonb_build_object(
            'averageCompressionSpeed', COALESCE(AVG(CASE WHEN duration > 0 THEN original_size / (duration / 1000.0) ELSE 0 END), 0),
            'averageDecompressionSpeed', COALESCE(AVG((metadata->>'decompressionTime')::INTEGER), 0),
            'averageMemoryUsage', COALESCE(AVG((metadata->>'memoryUsage')::BIGINT), 0),
            'averageCpuUsage', COALESCE(AVG((metadata->>'cpuUsage')::DECIMAL), 0),
            'cacheHitRate', COALESCE(
                (SELECT COUNT(*) FROM compression_cache WHERE DATE(accessed_at) = p_date)::DECIMAL / 
                NULLIF((SELECT COUNT(*) FROM compression_jobs WHERE DATE(start_time) = p_date), 0) * 100,
                0
            )
        )
        FROM compression_jobs
        WHERE (p_user_id IS NULL OR metadata->>'userId' = p_user_id::text)
        AND DATE(start_time) = p_date
    ),
    trends_stats AS (
        SELECT jsonb_build_object(
            'compressionRatioTrend', ARRAY(
                SELECT COALESCE(AVG(compression_ratio), 0)
                FROM compression_jobs
                WHERE DATE(start_time) >= p_date - INTERVAL '7 days'
                GROUP BY DATE(start_time)
                ORDER BY DATE(start_time) ASC
            ),
            'processingTimeTrend', ARRAY(
                SELECT COALESCE(AVG(duration), 0)
                FROM compression_jobs
                WHERE DATE(start_time) >= p_date - INTERVAL '7 days'
                GROUP BY DATE(start_time)
                ORDER BY DATE(start_time) ASC
            ),
            'spaceSavedTrend', ARRAY(
                SELECT COALESCE(SUM(original_size - compressed_size), 0)
                FROM compression_jobs
                WHERE DATE(start_time) >= p_date - INTERVAL '7 days'
                GROUP BY DATE(start_time)
                ORDER BY DATE(start_time) ASC
            )
        )
    )
    SELECT 
        js.total as total_jobs,
        js.completed as completed_jobs,
        js.failed as failed_jobs,
        js.avg_ratio as average_compression_ratio,
        js.total_orig as total_original_size,
        js.total_comp as total_compressed_size,
        js.total_orig - js.total_comp as total_space_saved,
        js.avg_duration as average_processing_time,
        ab.algorithm_breakdown as jobs_by_algorithm,
        sb.status_breakdown as jobs_by_status,
        ps.performance_stats as performance,
        ts.trends_stats as trends
    FROM job_stats js, algorithm_breakdown ab, status_breakdown sb,
         performance_stats ps, trends_stats ts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les configurations par type de fichier
CREATE OR REPLACE FUNCTION create_default_compression_file_type_configs()
RETURNS VOID AS $$
BEGIN
    INSERT INTO compression_file_type_configs (file_type, mime_type, default_algorithm, default_level, recommended_settings, optimization_settings)
    VALUES 
        ('txt', 'text/plain', 'gzip', 6, 
         '{"chunkSize": 65536, "parallel": false, "threads": 1}',
         '{"removeMetadata": false, "removeComments": false, "optimizeCode": false, "minify": false}'),
        ('json', 'application/json', 'gzip', 6,
         '{"chunkSize": 65536, "parallel": false, "threads": 1}',
         '{"removeMetadata": true, "removeComments": false, "optimizeCode": true, "minify": true}'),
        ('xml', 'application/xml', 'gzip', 6,
         '{"chunkSize": 65536, "parallel": false, "threads": 1}',
         '{"removeMetadata": true, "removeComments": true, "optimizeCode": false, "minify": false}'),
        ('csv', 'text/csv', 'gzip', 6,
         '{"chunkSize": 131072, "parallel": true, "threads": 2}',
         '{"removeMetadata": false, "removeComments": false, "optimizeCode": false, "minify": false}'),
        ('html', 'text/html', 'brotli', 6,
         '{"chunkSize": 32768, "parallel": false, "threads": 1}',
         '{"removeMetadata": true, "removeComments": true, "optimizeCode": true, "minify": true}'),
        ('css', 'text/css', 'brotli', 6,
         '{"chunkSize": 32768, "parallel": false, "threads": 1}',
         '{"removeMetadata": true, "removeComments": true, "optimizeCode": true, "minify": true}'),
        ('js', 'application/javascript', 'brotli', 6,
         '{"chunkSize": 32768, "parallel": false, "threads": 1}',
         '{"removeMetadata": true, "removeComments": true, "optimizeCode": true, "minify": true}'),
        ('pdf', 'application/pdf', 'gzip', 3,
         '{"chunkSize": 262144, "parallel": true, "threads": 4}',
         '{"removeMetadata": false, "removeComments": false, "optimizeImages": false, "optimizeCode": false}'),
        ('jpg', 'image/jpeg', 'gzip', 1,
         '{"chunkSize": 524288, "parallel": true, "threads": 4}',
         '{"removeMetadata": true, "optimizeImages": false, "convertToWebP": false}'),
        ('png', 'image/png', 'gzip', 3,
         '{"chunkSize": 262144, "parallel": true, "threads": 4}',
         '{"removeMetadata": true, "optimizeImages": false, "convertToWebP": false}'),
        ('svg', 'image/svg+xml', 'brotli', 6,
         '{"chunkSize": 16384, "parallel": false, "threads": 1}',
         '{"removeMetadata": true, "removeComments": true, "optimizeCode": false, "minify": true}')
    ON CONFLICT (file_type) DO UPDATE SET
        mime_type = EXCLUDED.mime_type,
        default_algorithm = EXCLUDED.default_algorithm,
        default_level = EXCLUDED.default_level,
        recommended_settings = EXCLUDED.recommended_settings,
        optimization_settings = EXCLUDED.optimization_settings,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_compression_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO compression_statistics (
        user_id,
        date,
        total_jobs,
        completed_jobs,
        failed_jobs,
        average_compression_ratio,
        total_original_size,
        total_compressed_size,
        total_space_saved,
        average_processing_time,
        jobs_by_algorithm,
        jobs_by_status,
        performance,
        trends
    )
    SELECT 
        COALESCE(metadata->>'userId', '00000000-0000-0000-0000-000000000000')::UUID,
        p_date,
        COUNT(*) as total_jobs,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
        COALESCE(AVG(compression_ratio), 0) as average_compression_ratio,
        COALESCE(SUM(original_size), 0) as total_original_size,
        COALESCE(SUM(compressed_size), 0) as total_compressed_size,
        COALESCE(SUM(original_size - compressed_size), 0) as total_space_saved,
        COALESCE(AVG(duration), 0) as average_processing_time,
        jsonb_object_agg(algorithm, job_count),
        jsonb_object_agg(status, job_count),
        jsonb_build_object(
            'averageCompressionSpeed', COALESCE(AVG(CASE WHEN duration > 0 THEN original_size / (duration / 1000.0) ELSE 0 END), 0),
            'averageDecompressionSpeed', COALESCE(AVG((metadata->>'decompressionTime')::INTEGER), 0),
            'averageMemoryUsage', COALESCE(AVG((metadata->>'memoryUsage')::BIGINT), 0),
            'averageCpuUsage', COALESCE(AVG((metadata->>'cpuUsage')::DECIMAL), 0),
            'cacheHitRate', 0
        ),
        jsonb_build_object(
            'compressionRatioTrend', ARRAY[COALESCE(AVG(compression_ratio), 0)],
            'processingTimeTrend', ARRAY[COALESCE(AVG(duration), 0)],
            'spaceSavedTrend', ARRAY[COALESCE(SUM(original_size - compressed_size), 0)]
        )
    FROM compression_jobs
    WHERE DATE(start_time) = p_date
    GROUP BY COALESCE(metadata->>'userId', '00000000-0000-0000-0000-000000000000')
    ON CONFLICT (user_id, date) DO UPDATE SET
        total_jobs = EXCLUDED.total_jobs,
        completed_jobs = EXCLUDED.completed_jobs,
        failed_jobs = EXCLUDED.failed_jobs,
        average_compression_ratio = EXCLUDED.average_compression_ratio,
        total_original_size = EXCLUDED.total_original_size,
        total_compressed_size = EXCLUDED.total_compressed_size,
        total_space_saved = EXCLUDED.total_space_saved,
        average_processing_time = EXCLUDED.average_processing_time,
        jobs_by_algorithm = EXCLUDED.jobs_by_algorithm,
        jobs_by_status = EXCLUDED.jobs_by_status,
        performance = EXCLUDED.performance,
        trends = EXCLUDED.trends,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciennes données de compression
CREATE OR REPLACE FUNCTION cleanup_old_compression_data(p_days_old INTEGER DEFAULT 30)
RETURNS TABLE (
    cleaned_jobs BIGINT,
    cleaned_cache BIGINT,
    cleaned_benchmarks BIGINT
) AS $$
DECLARE
    cleaned_jobs_count BIGINT;
    cleaned_cache_count BIGINT;
    cleaned_benchmarks_count BIGINT;
BEGIN
    -- Nettoyer les anciens jobs
    DELETE FROM compression_jobs
    WHERE start_time < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cleaned_jobs_count = ROW_COUNT;
    
    -- Nettoyer le cache expiré
    DELETE FROM compression_cache
    WHERE expires_at < NOW()
    OR (expires_at IS NULL AND accessed_at < NOW() - INTERVAL '7 days');
    
    GET DIAGNOSTICS cleaned_cache_count = ROW_COUNT;
    
    -- Nettoyer les anciens benchmarks
    DELETE FROM compression_benchmarks
    WHERE timestamp < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cleaned_benchmarks_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_jobs_count, cleaned_cache_count, cleaned_benchmarks_count;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE compression_jobs IS 'Jobs de compression avec suivi de progression et métriques';
COMMENT ON TABLE compression_profiles IS 'Profils de compression personnalisés par utilisateur';
COMMENT ON TABLE compression_cache IS 'Cache des fichiers compressés pour accélérer les traitements';
COMMENT ON TABLE compression_benchmarks IS 'Benchmarks de performance des algorithmes de compression';
COMMENT ON TABLE compression_statistics IS 'Statistiques agrégées de compression par utilisateur et date';
COMMENT ON TABLE compression_optimizations IS 'Optimisations appliquées aux fichiers avant compression';
COMMENT ON TABLE compression_file_type_configs IS 'Configurations de compression recommandées par type de fichier';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN compression_jobs.metadata IS 'Métadonnées du job {userId, compressionTime, decompressionTime, memoryUsage, cpuUsage}';
COMMENT ON COLUMN compression_profiles.settings IS 'Configuration technique {algorithm, level, chunkSize, parallel, threads}';
COMMENT ON COLUMN compression_profiles.optimization IS 'Optimisations appliquées {removeMetadata, removeComments, optimizeCode, minify}';
COMMENT ON COLUMN compression_benchmarks.performance IS 'Métriques de performance {compressionTime, decompressionTime, memoryUsage, cpuUsage}';
COMMENT ON COLUMN compression_statistics.performance IS 'Performances agrégées {compressionSpeed, decompressionSpeed, memoryUsage, cpuUsage, cacheHitRate}';
COMMENT ON COLUMN compression_optimizations.quality_impact IS 'Impact sur la qualité (-100 à 100)';

-- Créer les données par défaut
SELECT create_default_compression_file_type_configs();
