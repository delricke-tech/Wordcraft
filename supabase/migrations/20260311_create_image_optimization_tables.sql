-- Migration: Création des tables pour l'optimisation d'images (WebP, compression)
-- Date: 11 mars 2026
-- Description: Tables pour gérer l'optimisation des images, compression et conversion de formats

-- Table des optimisations d'images
CREATE TABLE IF NOT EXISTS image_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_image_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    original_url TEXT NOT NULL,
    optimized_url TEXT NOT NULL,
    original_format VARCHAR(10) NOT NULL CHECK (original_format IN ('jpeg', 'jpg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff', 'svg', 'ico')),
    optimized_format VARCHAR(10) NOT NULL CHECK (optimized_format IN ('jpeg', 'jpg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff', 'svg', 'ico')),
    original_size BIGINT NOT NULL, -- en bytes
    optimized_size BIGINT NOT NULL, -- en bytes
    compression_ratio DECIMAL(5,2) DEFAULT 0.00 CHECK (compression_ratio >= 0),
    dimensions JSONB NOT NULL DEFAULT '{}',
    quality INTEGER DEFAULT 80 CHECK (quality >= 1 AND quality <= 100),
    optimization_type VARCHAR(50) NOT NULL CHECK (optimization_type IN ('compression', 'format_conversion', 'resize', 'crop', 'quality_adjustment', 'progressive', 'lazy', 'combined')),
    processing_time INTEGER DEFAULT 0, -- en millisecondes
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Table des requêtes d'optimisation
CREATE TABLE IF NOT EXISTS image_optimization_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    callback_url TEXT,
    webhook_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Table des formats d'images supportés
CREATE TABLE IF NOT EXISTS supported_image_formats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    format VARCHAR(10) NOT NULL UNIQUE,
    display_name VARCHAR(50) NOT NULL,
    description TEXT,
    mime_type VARCHAR(100) NOT NULL,
    file_extensions TEXT[] DEFAULT '{}',
    is_lossy BOOLEAN DEFAULT false,
    is_lossless BOOLEAN DEFAULT false,
    supports_transparency BOOLEAN DEFAULT false,
    supports_animation BOOLEAN DEFAULT false,
    max_quality INTEGER DEFAULT 100,
    compression_efficiency DECIMAL(3,2) DEFAULT 0.00, -- 0-1, plus efficace = plus proche de 1
    browser_support JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des profils d'optimisation
CREATE TABLE IF NOT EXISTS optimization_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    target_format VARCHAR(10) NOT NULL,
    quality INTEGER DEFAULT 80 CHECK (quality >= 1 AND quality <= 100),
    max_width INTEGER,
    max_height INTEGER,
    compression_level INTEGER DEFAULT 6 CHECK (compression_level >= 1 AND compression <= 9),
    progressive BOOLEAN DEFAULT true,
    lossless BOOLEAN DEFAULT false,
    preserve_metadata BOOLEAN DEFAULT true,
    strip_exif BOOLEAN DEFAULT false,
    optimize_colors BOOLEAN DEFAULT false,
    reduce_colors INTEGER,
    interlace BOOLEAN DEFAULT false,
    transparency BOOLEAN DEFAULT true,
    animation BOOLEAN DEFAULT true,
    custom_settings JSONB DEFAULT '{}',
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Table des statistiques d'optimisation par utilisateur
CREATE TABLE IF NOT EXISTS user_optimization_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    total_optimizations INTEGER DEFAULT 0,
    successful_optimizations INTEGER DEFAULT 0,
    failed_optimizations INTEGER DEFAULT 0,
    total_original_size BIGINT DEFAULT 0,
    total_optimized_size BIGINT DEFAULT 0,
    total_space_saved BIGINT DEFAULT 0,
    average_compression_ratio DECIMAL(5,2) DEFAULT 0.00,
    average_processing_time INTEGER DEFAULT 0,
    last_optimization_at TIMESTAMP WITH TIME ZONE,
    favorite_format VARCHAR(10),
    favorite_quality INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table du cache d'optimisation
CREATE TABLE IF NOT EXISTS optimization_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    optimized_url TEXT NOT NULL,
    original_size BIGINT NOT NULL,
    optimized_size BIGINT NOT NULL,
    format VARCHAR(10) NOT NULL,
    quality INTEGER,
    settings_hash VARCHAR(64),
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    file_path TEXT, -- chemin du fichier sur le disque
    metadata JSONB DEFAULT '{}'
);

-- Index pour les performances
CREATE INDEX idx_image_optimizations_original_image_id ON image_optimizations(original_image_id);
CREATE INDEX idx_image_optimizations_original_url ON image_optimizations(original_url);
CREATE INDEX idx_image_optimizations_optimized_url ON image_optimizations(optimized_url);
CREATE INDEX idx_image_optimizations_original_format ON image_optimizations(original_format);
CREATE INDEX idx_image_optimizations_optimized_format ON image_optimizations(optimized_format);
CREATE INDEX idx_image_optimizations_optimization_type ON image_optimizations(optimization_type);
CREATE INDEX idx_image_optimizations_status ON image_optimizations(status);
CREATE INDEX idx_image_optimizations_compression_ratio ON image_optimizations(compression_ratio DESC);
CREATE INDEX idx_image_optimizations_created_at ON image_optimizations(created_at DESC);

CREATE INDEX idx_image_optimization_requests_user_id ON image_optimization_requests(user_id);
CREATE INDEX idx_image_optimization_requests_status ON image_optimization_requests(status);
CREATE INDEX idx_image_optimization_requests_priority ON image_optimization_requests(priority);
CREATE INDEX idx_image_optimization_requests_created_at ON image_optimization_requests(created_at DESC);

CREATE INDEX idx_supported_image_formats_format ON supported_image_formats(format);
CREATE INDEX idx_supported_image_formats_is_active ON supported_image_formats(is_active);

CREATE INDEX idx_optimization_profiles_target_format ON optimization_profiles(target_format);
CREATE INDEX idx_optimization_profiles_is_active ON optimization_profiles(is_active);
CREATE INDEX idx_optimization_profiles_is_system ON optimization_profiles(is_system);

CREATE INDEX idx_user_optimization_stats_user_id ON user_optimization_stats(user_id);
CREATE INDEX idx_user_optimization_stats_total_optimizations ON user_optimization_stats(total_optimizations DESC);
CREATE INDEX idx_user_optimization_stats_last_optimization_at ON user_optimization_stats(last_optimization_at DESC);

CREATE INDEX idx_optimization_cache_cache_key ON optimization_cache(cache_key);
CREATE INDEX idx_optimization_cache_original_url ON optimization_cache(original_url);
CREATE INDEX idx_optimization_cache_format ON optimization_cache(format);
CREATE INDEX idx_optimization_cache_expires_at ON optimization_cache(expires_at);
CREATE INDEX idx_optimization_cache_access_count ON optimization_cache(access_count DESC);
CREATE INDEX idx_optimization_cache_last_accessed ON optimization_cache(last_accessed DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_image_optimizations_updated_at 
    BEFORE UPDATE ON image_optimizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_image_optimization_requests_updated_at 
    BEFORE UPDATE ON image_optimization_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supported_image_formats_updated_at 
    BEFORE UPDATE ON supported_image_formats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_optimization_profiles_updated_at 
    BEFORE UPDATE ON optimization_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_optimization_stats_updated_at 
    BEFORE UPDATE ON user_optimization_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques utilisateur
CREATE OR REPLACE FUNCTION update_user_optimization_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_optimization_stats (
        user_id,
        total_optimizations,
        successful_optimizations,
        failed_optimizations,
        total_original_size,
        total_optimized_size,
        total_space_saved,
        average_compression_ratio,
        average_processing_time,
        last_optimization_at,
        favorite_format,
        favorite_quality
    )
    VALUES (
        COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000'),
        1,
        CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
        NEW.original_size,
        NEW.optimized_size,
        NEW.original_size - NEW.optimized_size,
        NEW.compression_ratio,
        NEW.processing_time,
        NEW.created_at,
        NEW.optimized_format,
        NEW.quality
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_optimizations = user_optimization_stats.total_optimizations + 1,
        successful_optimizations = user_optimization_stats.successful_optimizations + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
        failed_optimizations = user_optimization_stats.failed_optimizations + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
        total_original_size = user_optimization_stats.total_original_size + NEW.original_size,
        total_optimized_size = user_optimization_stats.total_optimized_size + NEW.optimized_size,
        total_space_saved = user_optimization_stats.total_space_saved + (NEW.original_size - NEW.optimized_size),
        average_compression_ratio = (
            (user_optimization_stats.average_compression_ratio * user_optimization_stats.total_optimizations + NEW.compression_ratio) / 
            (user_optimization_stats.total_optimizations + 1)
        ),
        average_processing_time = (
            (user_optimization_stats.average_processing_time * user_optimization_stats.total_optimizations + NEW.processing_time) / 
            (user_optimization_stats.total_optimizations + 1)
        ),
        last_optimization_at = NEW.created_at,
        favorite_format = NEW.optimized_format,
        favorite_quality = NEW.quality,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_optimization_stats
    AFTER INSERT ON image_optimizations
    FOR EACH ROW EXECUTE FUNCTION update_user_optimization_stats();

-- Politiques RLS pour les optimisations
ALTER TABLE image_optimizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own image optimizations" ON image_optimizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = original_image_id
            AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all image optimizations" ON image_optimizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

CREATE POLICY "Admins can manage image optimizations" ON image_optimizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les requêtes
ALTER TABLE image_optimization_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own optimization requests" ON image_optimization_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own optimization requests" ON image_optimization_requests
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les formats supportés
ALTER TABLE supported_image_formats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active supported formats" ON supported_image_formats
    FOR SELECT USING (is_active = true);

-- Politiques RLS pour les profils
ALTER TABLE optimization_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active optimization profiles" ON optimization_profiles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own optimization profiles" ON optimization_profiles
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can manage own optimization profiles" ON optimization_profiles
    FOR ALL USING (created_by = auth.uid());

-- Politiques RLS pour les statistiques utilisateur
ALTER TABLE user_optimization_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own optimization stats" ON user_optimization_stats
    FOR SELECT USING (user_id = auth.uid());

-- Politiques RLS pour le cache
ALTER TABLE optimization_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage optimization cache" ON optimization_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour l'optimisation d'images

-- Fonction pour obtenir les statistiques d'optimisation
CREATE OR REPLACE FUNCTION get_image_optimization_stats()
RETURNS TABLE (
    total_optimizations BIGINT,
    successful_optimizations BIGINT,
    failed_optimizations BIGINT,
    average_compression_ratio DECIMAL(5,2),
    total_space_saved BIGINT,
    average_processing_time INTEGER,
    optimizations_by_format JSONB,
    optimizations_by_type JSONB,
    performance JSONB,
    user_stats JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH optimization_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'completed') as successful,
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            COALESCE(AVG(compression_ratio), 0) as avg_compression,
            COALESCE(SUM(original_size - optimized_size), 0) as space_saved,
            COALESCE(AVG(processing_time), 0) as avg_processing_time
        FROM image_optimizations
    ),
    format_distribution AS (
        SELECT jsonb_object_agg(optimized_format, format_count)
        FROM (
            SELECT 
                optimized_format,
                COUNT(*) as format_count
            FROM image_optimizations
            WHERE status = 'completed'
            GROUP BY optimized_format
        ) format_stats
    ),
    type_distribution AS (
        SELECT jsonb_object_agg(optimization_type, type_count)
        FROM (
            SELECT 
                optimization_type,
                COUNT(*) as type_count
            FROM image_optimizations
            WHERE status = 'completed'
            GROUP BY optimization_type
        ) type_stats
    ),
    performance_stats AS (
        SELECT jsonb_build_object(
            'averageCompressionSpeed', COALESCE(AVG(original_size / NULLIF(processing_time, 0)), 0),
            'averageQualityScore', COALESCE(AVG(quality), 0),
            'cacheHitRate', COALESCE(
                (SELECT COUNT(*) FROM optimization_cache WHERE last_accessed >= CURRENT_DATE - INTERVAL '7 days')::DECIMAL / 
                NULLIF((SELECT COUNT(*) FROM image_optimizations WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'), 0) * 100,
                0
            )
        )
        FROM image_optimizations
        WHERE status = 'completed'
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    ),
    user_stats AS (
        SELECT jsonb_build_object(
            'totalUsers', COUNT(DISTINCT user_id),
            'activeUsers', COUNT(DISTINCT user_id) FILTER (WHERE last_optimization_at >= CURRENT_DATE - INTERVAL '7 days'),
            'averageOptimizationsPerUser', COALESCE(AVG(total_optimizations), 0),
            'topUsers', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'userId', user_id,
                        'optimizationCount', total_optimizations,
                        'spaceSaved', total_space_saved
                    )
                )
                FROM (
                    SELECT 
                        user_id,
                        total_optimizations,
                        total_space_saved
                    FROM user_optimization_stats
                    ORDER BY total_optimizations DESC
                    LIMIT 10
                ) top_users
            )
        )
        FROM user_optimization_stats
    )
    SELECT 
        os.total as total_optimizations,
        os.successful as successful_optimizations,
        os.failed as failed_optimizations,
        os.avg_compression as average_compression_ratio,
        os.space_saved as total_space_saved,
        os.avg_processing_time as average_processing_time,
        fd.format_distribution as optimizations_by_format,
        td.type_distribution as optimizations_by_type,
        ps.performance_stats as performance,
        us.user_stats as user_stats
    FROM optimization_stats os, format_distribution fd, type_distribution td,
         performance_stats ps, user_stats us;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les formats supportés par défaut
CREATE OR REPLACE FUNCTION create_default_supported_formats()
RETURNS VOID AS $$
BEGIN
    INSERT INTO supported_image_formats (format, display_name, description, mime_type, file_extensions, is_lossy, is_lossless, supports_transparency, supports_animation, compression_efficiency, browser_support)
    VALUES 
        ('jpeg', 'JPEG', 'Format JPEG avec perte', 'image/jpeg', ARRAY['jpg', 'jpeg', 'jfif'], true, false, false, false, 0.8, 
         '{"chrome": "full", "firefox": "full", "safari": "full", "edge": "full"}'),
        ('png', 'PNG', 'Format PNG sans perte', 'image/png', ARRAY['png'], false, true, true, false, 0.3,
         '{"chrome": "full", "firefox": "full", "safari": "full", "edge": "full"}'),
        ('webp', 'WebP', 'Format WebP moderne', 'image/webp', ARRAY['webp'], true, true, true, true, 0.9,
         '{"chrome": "full", "firefox": "full", "safari": "partial", "edge": "full"}'),
        ('avif', 'AVIF', 'Format AVIF ultra-moderne', 'image/avif', ARRAY['avif'], true, true, true, false, 0.95,
         '{"chrome": "full", "firefox": "partial", "safari": "none", "edge": "partial"}'),
        ('gif', 'GIF', 'Format GIF animé', 'image/gif', ARRAY['gif'], false, true, true, true, 0.2,
         '{"chrome": "full", "firefox": "full", "safari": "full", "edge": "full"}'),
        ('bmp', 'BMP', 'Format BMP non compressé', 'image/bmp', ARRAY['bmp'], false, true, false, false, 0.1,
         '{"chrome": "full", "firefox": "full", "safari": "full", "edge": "full"}'),
        ('tiff', 'TIFF', 'Format TIFF haute qualité', 'image/tiff', ARRAY['tiff', 'tif'], false, true, true, false, 0.4,
         '{"chrome": "partial", "firefox": "partial", "safari": "partial", "edge": "partial"}'),
        ('svg', 'SVG', 'Format SVG vectoriel', 'image/svg+xml', ARRAY['svg'], false, true, true, false, 1.0,
         '{"chrome": "full", "firefox": "full", "safari": "full", "edge": "full"}'),
        ('ico', 'ICO', 'Format ICO pour icônes', 'image/x-icon', ARRAY['ico'], false, true, true, false, 0.5,
         '{"chrome": "full", "firefox": "full", "safari": "full", "edge": "full"}')
    ON CONFLICT (format) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les profils d'optimisation par défaut
CREATE OR REPLACE FUNCTION create_default_optimization_profiles()
RETURNS VOID AS $$
BEGIN
    INSERT INTO optimization_profiles (name, description, target_format, quality, max_width, max_height, compression_level, progressive, lossless, preserve_metadata, strip_exif, is_system)
    VALUES 
        ('webp_high_quality', 'WebP haute qualité', 'webp', 85, NULL, NULL, 6, true, false, true, false, true),
        ('webp_balanced', 'WebP équilibré', 'webp', 75, 1920, 1080, 6, true, false, false, true, true),
        ('webp_compressed', 'WebP compressé', 'webp', 60, 1280, 720, 8, true, false, false, true, true),
        ('png_lossless', 'PNG sans perte', 'png', 100, NULL, NULL, 0, false, true, true, false, true),
        ('jpeg_standard', 'JPEG standard', 'jpeg', 80, NULL, NULL, 6, true, false, true, false, true),
        ('jpeg_small', 'JPEG petit format', 'jpeg', 70, 800, 600, 8, true, false, false, true, true),
        ('avif_ultra', 'AVIF ultra-compression', 'avif', 70, 1920, 1080, 8, true, false, false, true, true),
        ('auto_optimal', 'Optimisation automatique', 'webp', 80, 1920, 1080, 6, true, false, false, true, true)
    ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer le cache d'optimisation
CREATE OR REPLACE FUNCTION cleanup_optimization_cache(p_days_old INTEGER DEFAULT 30)
RETURNS TABLE (
    cleaned_cache_entries BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
BEGIN
    DELETE FROM optimization_cache
    WHERE expires_at < NOW()
    OR (last_accessed < NOW() - INTERVAL '1 day' * p_days_old AND access_count = 1);
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_count as cleaned_cache_entries;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour optimiser automatiquement les images anciennes
CREATE OR REPLACE FUNCTION auto_optimize_old_images(p_days_old INTEGER DEFAULT 90)
RETURNS TABLE (
    optimized_images BIGINT
) AS $$
DECLARE
    optimized_count BIGINT;
BEGIN
    -- Cette fonction serait implémentée pour optimiser automatiquement
    -- les images anciennes qui n'ont pas encore été optimisées
    -- Pour l'instant, retourne 0
    RETURN QUERY SELECT 0 as optimized_images;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE image_optimizations IS 'Optimisations d\'images avec compression et conversion de formats';
COMMENT ON TABLE image_optimization_requests IS 'Requêtes d\'optimisation d\'images en attente de traitement';
COMMENT ON TABLE supported_image_formats IS 'Formats d\'images supportés avec caractéristiques';
COMMENT ON TABLE optimization_profiles IS 'Profils d\'optimisation prédéfinis pour différents usages';
COMMENT ON TABLE user_optimization_stats IS 'Statistiques d\'optimisation par utilisateur';
COMMENT ON TABLE optimization_cache IS 'Cache des images optimisées pour accélérer les traitements';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN image_optimizations.dimensions IS 'Dimensions de l\'image {width, height, aspectRatio, originalWidth, originalHeight}';
COMMENT ON COLUMN image_optimizations.metadata IS 'Métadonnées d\'optimisation {algorithm, settings, performance, cache, tags}';
COMMENT ON COLUMN image_optimization_requests.settings IS 'Paramètres d\'optimisation {targetFormat, quality, maxWidth, maxHeight, etc.}';
COMMENT ON COLUMN supported_image_formats.browser_support IS 'Support par navigateur {chrome, firefox, safari, edge}';
COMMENT ON COLUMN optimization_profiles.custom_settings IS 'Paramètres personnalisés supplémentaires';
COMMENT ON COLUMN optimization_cache.settings_hash IS 'Hash des paramètres pour identifier les doublons';
COMMENT ON TABLE optimization_cache IS 'Cache des images optimisées pour éviter les traitements répétitifs';

-- Créer les données par défaut
SELECT create_default_supported_formats();
SELECT create_default_optimization_profiles();
