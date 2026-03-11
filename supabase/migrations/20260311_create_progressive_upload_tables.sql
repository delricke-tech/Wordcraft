-- Migration pour les tables d'upload progressif
-- Création: 11 mars 2026
-- Description: Upload progressif de fichiers volumineux avec découpage en chunks et reprise sur erreur

-- Table principale des uploads progressifs
CREATE TABLE IF NOT EXISTS progressive_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(200) NOT NULL,
    chunks JSONB NOT NULL DEFAULT '[]',
    settings JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    progress JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'paused', 'completed', 'failed', 'cancelled')),
    error JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des chunks d'upload
CREATE TABLE IF NOT EXISTS upload_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES progressive_uploads(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_size BIGINT NOT NULL,
    start_byte BIGINT NOT NULL,
    end_byte BIGINT NOT NULL,
    chunk_hash VARCHAR(128),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'completed', 'failed')),
    uploaded_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    upload_time INTEGER DEFAULT 0, -- en millisecondes
    upload_speed BIGINT DEFAULT 0, -- en bytes/seconde
    storage_path TEXT,
    checksum VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(upload_id, chunk_index)
);

-- Table des templates d'upload
CREATE TABLE IF NOT EXISTS upload_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    settings JSONB NOT NULL DEFAULT '{}',
    file_types TEXT[] DEFAULT '{}',
    max_file_size BIGINT DEFAULT 1073741824, -- 1GB par défaut
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des files d'attente d'upload
CREATE TABLE IF NOT EXISTS upload_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    upload_ids UUID[] DEFAULT '{}',
    max_concurrent INTEGER DEFAULT 3,
    priority VARCHAR(20) DEFAULT 'fifo' CHECK (priority IN ('fifo', 'priority', 'size')),
    auto_start BOOLEAN DEFAULT TRUE,
    pause_on_network_error BOOLEAN DEFAULT TRUE,
    retry_failed_uploads BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des statistiques d'upload
CREATE TABLE IF NOT EXISTS upload_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_uploads INTEGER DEFAULT 0,
    completed_uploads INTEGER DEFAULT 0,
    failed_uploads INTEGER DEFAULT 0,
    total_bytes_uploaded BIGINT DEFAULT 0,
    average_upload_speed BIGINT DEFAULT 0,
    average_upload_time INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    most_uploaded_formats JSONB DEFAULT '{}',
    largest_file_uploaded BIGINT DEFAULT 0,
    active_uploads INTEGER DEFAULT 0,
    queued_uploads INTEGER DEFAULT 0,
    bandwidth_usage JSONB DEFAULT '{}',
    error_rates JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Table des sessions d'upload
CREATE TABLE IF NOT EXISTS upload_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES progressive_uploads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    chunks_uploaded INTEGER DEFAULT 0,
    bytes_uploaded BIGINT DEFAULT 0,
    average_speed BIGINT DEFAULT 0,
    network_type VARCHAR(50),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    ip_address INET,
    user_agent TEXT
);

-- Table des interactions avec les uploads
CREATE TABLE IF NOT EXISTS upload_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES progressive_uploads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('start', 'pause', 'resume', 'cancel', 'retry', 'view_progress', 'change_settings')),
    interaction_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des erreurs d'upload
CREATE TABLE IF NOT EXISTS upload_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES progressive_uploads(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES upload_chunks(id) ON DELETE CASCADE,
    error_code VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_details JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    retry_count INTEGER DEFAULT 0,
    resolved BOOLEAN DEFAULT FALSE,
    resolution_details TEXT
);

-- Table des métadonnées de fichiers
CREATE TABLE IF NOT EXISTS file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES progressive_uploads(id) ON DELETE CASCADE,
    file_type VARCHAR(100) NOT NULL,
    dimensions JSONB, -- width, height pour les images
    duration DECIMAL(10,3), -- pour les vidéos/audios
    bitrate INTEGER, -- pour les médias
    framerate DECIMAL(5,2), -- pour les vidéos
    codec VARCHAR(50), -- pour les médias
    sample_rate INTEGER, -- pour les audios
    channels INTEGER, -- pour les audios
    document_info JSONB, -- pages, words, author pour les documents
    exif_data JSONB, -- données EXIF pour les images
    color_profile VARCHAR(50),
    compression_ratio DECIMAL(5,2),
    quality_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des bandes passantes réseau
CREATE TABLE IF NOT EXISTS network_bandwidth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    connection_type VARCHAR(50) NOT NULL,
    effective_type VARCHAR(20) NOT NULL,
    downlink DECIMAL(10,2) NOT NULL, -- en Mbps
    rtt INTEGER NOT NULL, -- en millisecondes
    save_data BOOLEAN DEFAULT FALSE,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    upload_speed BIGINT DEFAULT 0, -- en bytes/seconde
    download_speed BIGINT DEFAULT 0, -- en bytes/seconde
    latency INTEGER DEFAULT 0, -- en millisecondes
    packet_loss DECIMAL(5,4) DEFAULT 0
);

-- Table des limitations d'upload
CREATE TABLE IF NOT EXISTS upload_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'free',
    max_file_size BIGINT NOT NULL DEFAULT 104857600, -- 100MB par défaut
    max_concurrent_uploads INTEGER DEFAULT 3,
    daily_upload_limit BIGINT DEFAULT 1073741824, -- 1GB par jour par défaut
    monthly_upload_limit BIGINT DEFAULT 10737418240, -- 10GB par mois par défaut
    bandwidth_limit BIGINT DEFAULT 104857600, -- 100MB/s par défaut
    storage_quota BIGINT DEFAULT 5368709120, -- 5GB par défaut
    current_usage BIGINT DEFAULT 0,
    reset_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des optimisations d'upload
CREATE TABLE IF NOT EXISTS upload_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES progressive_uploads(id) ON DELETE CASCADE,
    optimization_type VARCHAR(50) NOT NULL CHECK (optimization_type IN ('compression', 'encryption', 'deduplication', 'caching', 'parallelization', 'adaptive_chunking')),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    original_size BIGINT,
    optimized_size BIGINT,
    compression_ratio DECIMAL(5,2),
    time_saved INTEGER, -- en millisecondes
    bandwidth_saved BIGINT, -- en bytes
    effectiveness_score DECIMAL(5,2),
    settings_used JSONB DEFAULT '{}'
);

-- Indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_progressive_uploads_user_id ON progressive_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_progressive_uploads_status ON progressive_uploads(status);
CREATE INDEX IF NOT EXISTS idx_progressive_uploads_created_at ON progressive_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progressive_uploads_file_size ON progressive_uploads(file_size);
CREATE INDEX IF NOT EXISTS idx_progressive_uploads_mime_type ON progressive_uploads(mime_type);
CREATE INDEX IF NOT EXISTS idx_progressive_uploads_file_name ON progressive_uploads USING gin(to_tsvector('french', file_name));

CREATE INDEX IF NOT EXISTS idx_upload_chunks_upload_id ON upload_chunks(upload_id);
CREATE INDEX IF NOT EXISTS idx_upload_chunks_status ON upload_chunks(status);
CREATE INDEX IF NOT EXISTS idx_upload_chunks_chunk_index ON upload_chunks(chunk_index);
CREATE INDEX IF NOT EXISTS idx_upload_chunks_uploaded_at ON upload_chunks(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_upload_chunks_start_byte ON upload_chunks(start_byte);
CREATE INDEX IF NOT EXISTS idx_upload_chunks_end_byte ON upload_chunks(end_byte);

CREATE INDEX IF NOT EXISTS idx_upload_templates_category ON upload_templates(category);
CREATE INDEX IF NOT EXISTS idx_upload_templates_is_active ON upload_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_upload_templates_is_default ON upload_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_upload_templates_usage_count ON upload_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_upload_templates_tags ON upload_templates USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_upload_templates_file_types ON upload_templates USING gin(file_types);

CREATE INDEX IF NOT EXISTS idx_upload_queues_user_id ON upload_queues(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_queues_priority ON upload_queues(priority);
CREATE INDEX IF NOT EXISTS idx_upload_queues_created_at ON upload_queues(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_upload_statistics_user_id ON upload_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_statistics_date ON upload_statistics(date DESC);
CREATE INDEX IF NOT EXISTS idx_upload_statistics_success_rate ON upload_statistics(success_rate);

CREATE INDEX IF NOT EXISTS idx_upload_sessions_upload_id ON upload_sessions(upload_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_user_id ON upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_session_id ON upload_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_started_at ON upload_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_network_type ON upload_sessions(network_type);

CREATE INDEX IF NOT EXISTS idx_upload_interactions_upload_id ON upload_interactions(upload_id);
CREATE INDEX IF NOT EXISTS idx_upload_interactions_user_id ON upload_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_interactions_interaction_type ON upload_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_upload_interactions_created_at ON upload_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_upload_errors_upload_id ON upload_errors(upload_id);
CREATE INDEX IF NOT EXISTS idx_upload_errors_chunk_id ON upload_errors(chunk_id);
CREATE INDEX IF NOT EXISTS idx_upload_errors_error_code ON upload_errors(error_code);
CREATE INDEX IF NOT EXISTS idx_upload_errors_timestamp ON upload_errors(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_upload_errors_resolved ON upload_errors(resolved);

CREATE INDEX IF NOT EXISTS idx_file_metadata_upload_id ON file_metadata(upload_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_file_type ON file_metadata(file_type);
CREATE INDEX IF NOT EXISTS idx_file_metadata_duration ON file_metadata(duration);
CREATE INDEX IF NOT EXISTS idx_file_metadata_bitrate ON file_metadata(bitrate);

CREATE INDEX IF NOT EXISTS idx_network_bandwidth_user_id ON network_bandwidth(user_id);
CREATE INDEX IF NOT EXISTS idx_network_bandwidth_connection_type ON network_bandwidth(connection_type);
CREATE INDEX IF NOT EXISTS idx_network_bandwidth_measured_at ON network_bandwidth(measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_network_bandwidth_downlink ON network_bandwidth(downlink);

CREATE INDEX IF NOT EXISTS idx_upload_limits_user_id ON upload_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_limits_plan_type ON upload_limits(plan_type);
CREATE INDEX IF NOT EXISTS idx_upload_limits_reset_date ON upload_limits(reset_date);
CREATE INDEX IF NOT EXISTS idx_upload_limits_current_usage ON upload_limits(current_usage);

CREATE INDEX IF NOT EXISTS idx_upload_optimizations_upload_id ON upload_optimizations(upload_id);
CREATE INDEX IF NOT EXISTS idx_upload_optimizations_optimization_type ON upload_optimizations(optimization_type);
CREATE INDEX IF NOT EXISTS idx_upload_optimizations_applied_at ON upload_optimizations(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_upload_optimizations_effectiveness_score ON upload_optimizations(effectiveness_score DESC);

-- Row Level Security (RLS)
ALTER TABLE progressive_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_bandwidth ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_optimizations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour progressive_uploads
CREATE POLICY "Users can view own progressive uploads" ON progressive_uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progressive uploads" ON progressive_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progressive uploads" ON progressive_uploads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progressive uploads" ON progressive_uploads
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progressive uploads" ON progressive_uploads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour upload_chunks
CREATE POLICY "Users can view own upload chunks" ON upload_chunks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM progressive_uploads 
            WHERE progressive_uploads.id = upload_id 
            AND progressive_uploads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own upload chunks" ON upload_chunks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM progressive_uploads 
            WHERE progressive_uploads.id = upload_id 
            AND progressive_uploads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own upload chunks" ON upload_chunks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM progressive_uploads 
            WHERE progressive_uploads.id = upload_id 
            AND progressive_uploads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own upload chunks" ON upload_chunks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM progressive_uploads 
            WHERE progressive_uploads.id = upload_id 
            AND progressive_uploads.user_id = auth.uid()
        )
    );

-- Politiques RLS pour upload_templates
CREATE POLICY "Users can view active upload templates" ON upload_templates
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can insert own upload templates" ON upload_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own upload templates" ON upload_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own upload templates" ON upload_templates
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all upload templates" ON upload_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour upload_queues
CREATE POLICY "Users can view own upload queues" ON upload_queues
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own upload queues" ON upload_queues
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own upload queues" ON upload_queues
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own upload queues" ON upload_queues
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour upload_statistics
CREATE POLICY "Users can view own upload statistics" ON upload_statistics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own upload statistics" ON upload_statistics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own upload statistics" ON upload_statistics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all upload statistics" ON upload_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour upload_sessions
CREATE POLICY "Users can view own upload sessions" ON upload_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own upload sessions" ON upload_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own upload sessions" ON upload_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques RLS pour upload_interactions
CREATE POLICY "Users can view own upload interactions" ON upload_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own upload interactions" ON upload_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own upload interactions" ON upload_interactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques RLS pour upload_errors
CREATE POLICY "Users can view own upload errors" ON upload_errors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM progressive_uploads 
            WHERE progressive_uploads.id = upload_id 
            AND progressive_uploads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own upload errors" ON upload_errors
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM progressive_uploads 
            WHERE progressive_uploads.id = upload_id 
            AND progressive_uploads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own upload errors" ON upload_errors
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM progressive_uploads 
            WHERE progressive_uploads.id = upload_id 
            AND progressive_uploads.user_id = auth.uid()
        )
    );

-- Politiques RLS pour file_metadata
CREATE POLICY "Users can view own file metadata" ON file_metadata
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM progressive_uploads 
            WHERE progressive_uploads.id = upload_id 
            AND progressive_uploads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own file metadata" ON file_metadata
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM progressive_uploads 
            WHERE progressive_uploads.id = upload_id 
            AND progressive_uploads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own file metadata" ON file_metadata
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM progressive_uploads 
            WHERE progressive_uploads.id = upload_id 
            AND progressive_uploads.user_id = auth.uid()
        )
    );

-- Politiques RLS pour network_bandwidth
CREATE POLICY "Users can view own network bandwidth" ON network_bandwidth
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own network bandwidth" ON network_bandwidth
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own network bandwidth" ON network_bandwidth
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques RLS pour upload_limits
CREATE POLICY "Users can view own upload limits" ON upload_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own upload limits" ON upload_limits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own upload limits" ON upload_limits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all upload limits" ON upload_limits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour upload_optimizations
CREATE POLICY "Users can view own upload optimizations" ON upload_optimizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM progressive_uploads 
            WHERE progressive_uploads.id = upload_id 
            AND progressive_uploads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own upload optimizations" ON upload_optimizations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM progressive_uploads 
            WHERE progressive_uploads.id = upload_id 
            AND progressive_uploads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own upload optimizations" ON upload_optimizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM progressive_uploads 
            WHERE progressive_uploads.id = upload_id 
            AND progressive_uploads.user_id = auth.uid()
        )
    );

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_progressive_uploads_updated_at BEFORE UPDATE ON progressive_uploads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upload_templates_updated_at BEFORE UPDATE ON upload_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upload_queues_updated_at BEFORE UPDATE ON upload_queues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upload_statistics_updated_at BEFORE UPDATE ON upload_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upload_limits_updated_at BEFORE UPDATE ON upload_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques d'utilisation des templates
CREATE OR REPLACE FUNCTION update_upload_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE upload_templates 
        SET usage_count = usage_count + 1 
        WHERE is_default = TRUE;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_upload_template_usage_count_trigger AFTER INSERT ON progressive_uploads
    FOR EACH ROW EXECUTE FUNCTION update_upload_template_usage_count();

-- Trigger pour mettre à jour les limites d'upload
CREATE OR REPLACE FUNCTION update_upload_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
        UPDATE upload_limits 
        SET current_usage = current_usage + NEW.file_size,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_upload_usage_trigger AFTER INSERT OR UPDATE ON progressive_uploads
    FOR EACH ROW EXECUTE FUNCTION update_upload_usage();

-- Trigger pour enregistrer les erreurs d'upload
CREATE OR REPLACE FUNCTION log_upload_errors()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != 'failed' AND NEW.status = 'failed' AND NEW.error IS NOT NULL THEN
        INSERT INTO upload_errors (upload_id, error_code, error_message, error_details, timestamp)
        VALUES (NEW.id, NEW.error->>'code', NEW.error->>'message', NEW.error, NOW());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_upload_errors_trigger AFTER UPDATE ON progressive_uploads
    FOR EACH ROW EXECUTE FUNCTION log_upload_errors();

-- Fonctions RPC pour les statistiques
CREATE OR REPLACE FUNCTION get_upload_stats(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'total_uploads', COUNT(*),
        'completed_uploads', COUNT(*) FILTER (WHERE status = 'completed'),
        'failed_uploads', COUNT(*) FILTER (WHERE status = 'failed'),
        'total_bytes_uploaded', COALESCE(SUM(file_size) FILTER (WHERE status = 'completed'), 0),
        'average_upload_speed', COALESCE(AVG((progress->>'averageSpeed')::BIGINT), 0),
        'average_upload_time', COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) * 1000) FILTER (WHERE status = 'completed'), 0),
        'success_rate', CASE 
            WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100 
            ELSE 0 
        END,
        'most_uploaded_formats', (
            SELECT json_object_agg(mime_type, cnt) FROM (
                SELECT mime_type, COUNT(*) as cnt 
                FROM progressive_uploads 
                WHERE (p_user_id IS NULL OR user_id = p_user_id)
                AND status = 'completed'
                GROUP BY mime_type 
                ORDER BY cnt DESC 
                LIMIT 10
            ) t
        ),
        'largest_file_uploaded', COALESCE(MAX(file_size) FILTER (WHERE status = 'completed'), 0),
        'active_uploads', COUNT(*) FILTER (WHERE status IN ('uploading', 'paused')),
        'queued_uploads', COUNT(*) FILTER (WHERE status = 'pending')
    ) INTO v_result
    FROM progressive_uploads 
    WHERE (p_user_id IS NULL OR user_id = p_user_id);
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_upload_progress(p_upload_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'upload_id', id,
        'file_name', file_name,
        'file_size', file_size,
        'status', status,
        'progress', progress,
        'chunks_total', jsonb_array_length(chunks),
        'chunks_completed', (SELECT COUNT(*) FROM jsonb_array_elements(chunks) WHERE value->>'status' = 'completed'),
        'created_at', created_at,
        'updated_at', updated_at,
        'completed_at', completed_at
    ) INTO v_result
    FROM progressive_uploads 
    WHERE id = p_upload_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_default_upload_templates()
RETURNS VOID AS $$
BEGIN
    -- Template standard
    INSERT INTO upload_templates (name, description, settings, file_types, max_file_size, category, tags, is_default)
    VALUES (
        'Upload Standard',
        'Configuration standard pour la plupart des fichiers',
        '{"chunkSize": 1048576, "maxRetries": 3, "retryDelay": 1000, "concurrentUploads": 3, "compressionEnabled": false, "encryptionEnabled": false, "resumeEnabled": true, "priority": "normal", "autoRetry": true, "verifyIntegrity": true}',
        ARRAY['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'],
        1073741824, -- 1GB
        'général',
        ARRAY['standard', 'polyvalent', 'sécurisé'],
        true
    )
    ON CONFLICT DO NOTHING;
    
    -- Template pour gros fichiers
    INSERT INTO upload_templates (name, description, settings, file_types, max_file_size, category, tags, is_default)
    VALUES (
        'Gros Fichiers',
        'Optimisé pour les fichiers volumineux (>100MB)',
        '{"chunkSize": 5242880, "maxRetries": 5, "retryDelay": 2000, "concurrentUploads": 2, "compressionEnabled": true, "compressionLevel": 6, "encryptionEnabled": false, "resumeEnabled": true, "priority": "low", "autoRetry": true, "verifyIntegrity": true}',
        ARRAY['video/*', 'application/zip', 'application/x-rar-compressed'],
        10737418240, -- 10GB
        'volumineux',
        ARRAY['gros fichiers', 'volumineux', 'optimisé', 'compression'],
        false
    )
    ON CONFLICT DO NOTHING;
    
    -- Template rapide
    INSERT INTO upload_templates (name, description, settings, file_types, max_file_size, category, tags, is_default)
    VALUES (
        'Upload Rapide',
        'Optimisé pour la vitesse de transfert',
        '{"chunkSize": 2097152, "maxRetries": 2, "retryDelay": 500, "concurrentUploads": 5, "compressionEnabled": false, "encryptionEnabled": false, "resumeEnabled": true, "priority": "high", "autoRetry": true, "verifyIntegrity": false}',
        ARRAY['image/*', 'text/*', 'application/json'],
        104857600, -- 100MB
        'rapide',
        ARRAY['rapide', 'petits fichiers', 'priorité haute'],
        false
    )
    ON CONFLICT DO NOTHING;
    
    -- Template sécurisé
    INSERT INTO upload_templates (name, description, settings, file_types, max_file_size, category, tags, is_default)
    VALUES (
        'Upload Sécurisé',
        'Avec chiffrement et vérification d\'intégrité',
        '{"chunkSize": 1048576, "maxRetries": 3, "retryDelay": 1000, "concurrentUploads": 2, "compressionEnabled": false, "encryptionEnabled": true, "resumeEnabled": true, "priority": "normal", "autoRetry": true, "verifyIntegrity": true}',
        ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.*'],
        524288000, -- 500MB
        'sécurité',
        ARRAY['sécurisé', 'chiffrement', 'documents sensibles'],
        false
    )
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insertion des données initiales
INSERT INTO upload_limits (user_id, plan_type, max_file_size, max_concurrent_uploads, daily_upload_limit, monthly_upload_limit, bandwidth_limit, storage_quota, reset_date)
SELECT 
    id,
    'free',
    104857600, -- 100MB
    3,
    1073741824, -- 1GB par jour
    10737418240, -- 10GB par mois
    104857600, -- 100MB/s
    5368709120, -- 5GB de stockage
    CURRENT_DATE + INTERVAL '1 month'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM upload_limits)
ON CONFLICT DO NOTHING;

-- Commentaires sur les tables
COMMENT ON TABLE progressive_uploads IS 'Uploads progressifs de fichiers volumineux avec découpage en chunks';
COMMENT ON TABLE upload_chunks IS 'Chunks individuels pour les uploads progressifs';
COMMENT ON TABLE upload_templates IS 'Templates prédéfinis pour les configurations d\'upload';
COMMENT ON TABLE upload_queues IS 'Files d\'attente pour les uploads';
COMMENT ON TABLE upload_statistics IS 'Statistiques d\'utilisation des uploads';
COMMENT ON TABLE upload_sessions IS 'Sessions d\'upload avec métadonnées réseau';
COMMENT ON TABLE upload_interactions IS 'Interactions des utilisateurs avec les uploads';
COMMENT ON TABLE upload_errors IS 'Erreurs rencontrées lors des uploads';
COMMENT ON TABLE file_metadata IS 'Métadonnées extraites des fichiers uploadés';
COMMENT ON TABLE network_bandwidth IS 'Mesures de bande passante réseau';
COMMENT ON TABLE upload_limits IS 'Limites d\'upload par utilisateur et plan';
COMMENT ON TABLE upload_optimizations IS 'Optimisations appliquées aux uploads';

-- Commentaires sur les colonnes principales
COMMENT ON COLUMN progressive_uploads.chunks IS 'Configuration et statut des chunks de l\'upload';
COMMENT ON COLUMN progressive_uploads.settings IS 'Paramètres de configuration de l\'upload';
COMMENT ON COLUMN progressive_uploads.metadata IS 'Métadonnées du fichier original';
COMMENT ON COLUMN progressive_uploads.progress IS 'Informations de progression en temps réel';
COMMENT ON COLUMN progressive_uploads.error IS 'Détails de l\'erreur si l\'upload a échoué';
COMMENT ON COLUMN upload_chunks.chunk_hash IS 'Hash du chunk pour vérification d\'intégrité';
COMMENT ON COLUMN upload_chunks.upload_speed IS 'Vitesse d\'upload mesurée pour ce chunk';
COMMENT ON COLUMN upload_templates.file_types IS 'Types MIME supportés par ce template';
COMMENT ON COLUMN upload_templates.max_file_size IS 'Taille maximale de fichier pour ce template';
COMMENT ON COLUMN upload_statistics.bandwidth_usage IS 'Utilisation de bande passante actuelle et historique';
COMMENT ON COLUMN upload_statistics.error_rates IS 'Taux d\'erreurs par type';
COMMENT ON COLUMN file_metadata.dimensions IS 'Dimensions pour les images (width, height)';
COMMENT ON COLUMN file_metadata.document_info IS 'Informations spécifiques aux documents';
COMMENT ON COLUMN network_bandwidth.downlink IS 'Vitesse de connexion descendante en Mbps';
COMMENT ON COLUMN network_bandwidth.rtt IS 'Temps de aller-retour en millisecondes';
COMMENT ON COLUMN upload_limits.plan_type IS 'Type d\'abonnement de l\'utilisateur';
COMMENT ON COLUMN upload_limits.current_usage IS 'Utilisation actuelle du quota';
COMMENT ON COLUMN upload_optimizations.optimization_type IS 'Type d\'optimisation appliquée';
COMMENT ON COLUMN upload_optimizations.effectiveness_score IS 'Score d\'efficacité de l\'optimisation';
