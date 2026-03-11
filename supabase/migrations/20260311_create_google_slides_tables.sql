-- Migration: Création des tables pour l'intégration Google Slides
-- Date: 11 mars 2026
-- Description: Tables pour gérer l'intégration avec Google Slides, la synchronisation et les présentations

-- Table des intégrations Google Slides
CREATE TABLE IF NOT EXISTS google_slides_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    google_account_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    scopes TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_settings JSONB DEFAULT '{}', -- {autoSync, syncInterval, syncFolders, fileTypes, excludeShared, excludeTrashed, maxFileSize, convertToMarkdown, preserveFormatting, extractImages, extractNotes, extractSpeakerNotes, createBackups, notifyChanges}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des présentations Google Slides synchronisées
CREATE TABLE IF NOT EXISTS google_slides_presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES google_slides_integrations(id) ON DELETE CASCADE,
    google_presentation_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE,
    modified_at TIMESTAMP WITH TIME ZONE,
    edited_at TIMESTAMP WITH TIME ZONE,
    web_view_link TEXT,
    web_content_link TEXT,
    export_links JSONB DEFAULT '[]',
    parents TEXT[] DEFAULT '{}',
    owners JSONB DEFAULT '[]',
    permissions JSONB DEFAULT '[]',
    is_shared BOOLEAN DEFAULT false,
    is_trashed BOOLEAN DEFAULT false,
    version VARCHAR(50) DEFAULT '1',
    thumbnail_url TEXT,
    thumbnail_size VARCHAR(50),
    slides JSONB DEFAULT '[]', -- [{id, objectId, title, index, layout, background, elements, notes, thumbnailUrl, thumbnailSize, content, metadata}]
    metadata JSONB DEFAULT '{}', -- {slideCount, wordCount, characterCount, imageCount, tableCount, chartCount, videoCount, linkCount, commentCount, revisionCount, theme, layout, dimensions, language, locale, categories, tags, customProperties, exportSettings}
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed', 'conflict', 'deleted', 'error')),
    imported_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_error TEXT,
    conflict_data JSONB DEFAULT '{}',
    backup_slides JSONB DEFAULT '[]',
    backup_metadata JSONB DEFAULT '{}',
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'error')),
    processing_error TEXT,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sessions de synchronisation Google Slides
CREATE TABLE IF NOT EXISTS google_slides_sync_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES google_slides_integrations(id) ON DELETE CASCADE,
    google_account_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'synced', 'failed', 'conflict', 'error')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- en millisecondes
    presentations_processed INTEGER DEFAULT 0,
    presentations_succeeded INTEGER DEFAULT 0,
    presentations_failed INTEGER DEFAULT 0,
    presentations_skipped INTEGER DEFAULT 0,
    presentations_updated INTEGER DEFAULT 0,
    presentations_deleted INTEGER DEFAULT 0,
    slides_processed INTEGER DEFAULT 0,
    slides_extracted INTEGER DEFAULT 0,
    images_extracted INTEGER DEFAULT 0,
    notes_extracted INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]', -- [{presentationId, presentationName, slideId, slideName, errorType, errorMessage, errorCode, stackTrace, timestamp, resolved, resolvedAt}]
    summary JSONB DEFAULT '{}', -- {totalPresentations, newPresentations, updatedPresentations, deletedPresentations, skippedPresentations, failedPresentations, totalSlides, extractedSlides, extractedImages, extractedNotes, totalSize, processingTime, averagePresentationSize, largestPresentationSize, smallestPresentationSize, presentationTypes, slideTypes, syncEfficiency, errorRate}
    settings JSONB DEFAULT '{}', -- paramètres utilisés pour cette synchronisation
    trigger_type VARCHAR(50) DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'auto', 'scheduled', 'webhook', 'api')),
    trigger_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des conflits de synchronisation Google Slides
CREATE TABLE IF NOT EXISTS google_slides_sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES google_slides_integrations(id) ON DELETE CASCADE,
    presentation_id UUID REFERENCES google_slides_presentations(id) ON DELETE CASCADE,
    google_presentation_id VARCHAR(255) NOT NULL,
    conflict_type VARCHAR(50) NOT NULL CHECK (conflict_type IN ('content', 'metadata', 'permissions', 'version', 'deleted', 'moved', 'renamed', 'slides', 'layout', 'theme')),
    local_version TEXT,
    remote_version TEXT,
    local_metadata JSONB DEFAULT '{}',
    remote_metadata JSONB DEFAULT '{}',
    conflict_details JSONB DEFAULT '{}',
    resolution_strategy VARCHAR(50) DEFAULT 'manual' CHECK (resolution_strategy IN ('manual', 'local_wins', 'remote_wins', 'merge', 'timestamp')),
    resolution_status VARCHAR(20) DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'resolved', 'skipped', 'deferred')),
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des statistiques Google Slides
CREATE TABLE IF NOT EXISTS google_slides_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_integrations INTEGER DEFAULT 0,
    active_integrations INTEGER DEFAULT 0,
    total_presentations INTEGER DEFAULT 0,
    synced_presentations INTEGER DEFAULT 0,
    failed_presentations INTEGER DEFAULT 0,
    new_presentations INTEGER DEFAULT 0,
    updated_presentations INTEGER DEFAULT 0,
    deleted_presentations INTEGER DEFAULT 0,
    total_slides INTEGER DEFAULT 0,
    extracted_slides INTEGER DEFAULT 0,
    average_sync_time INTEGER DEFAULT 0, -- en millisecondes
    total_storage_used BIGINT DEFAULT 0,
    presentation_types JSONB DEFAULT '{}',
    slide_types JSONB DEFAULT '{}',
    presentation_sizes JSONB DEFAULT '{}',
    slide_sizes JSONB DEFAULT '{}',
    sync_performance JSONB DEFAULT '{}',
    user_activity JSONB DEFAULT '{}',
    api_usage JSONB DEFAULT '{}',
    error_types JSONB DEFAULT '{}',
    trends JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Table des logs d'activité Google Slides
CREATE TABLE IF NOT EXISTS google_slides_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    integration_id UUID REFERENCES google_slides_integrations(id) ON DELETE SET NULL,
    presentation_id UUID REFERENCES google_slides_presentations(id) ON DELETE SET NULL,
    session_id UUID REFERENCES google_slides_sync_sessions(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('sync_started', 'sync_completed', 'sync_failed', 'presentation_imported', 'presentation_updated', 'presentation_deleted', 'slide_extracted', 'image_extracted', 'note_extracted', 'conflict_detected', 'conflict_resolved', 'error_occurred', 'api_call', 'token_refreshed', 'settings_updated')),
    activity_details JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('sync', 'presentation', 'slide', 'image', 'note', 'conflict', 'error', 'performance', 'security', 'api', 'user')),
    duration INTEGER, -- en millisecondes
    metadata JSONB DEFAULT '{}'
);

-- Table des paramètres de synchronisation par défaut
CREATE TABLE IF NOT EXISTS google_slides_default_sync_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    settings JSONB NOT NULL, -- {autoSync, syncInterval, syncFolders, fileTypes, excludeShared, excludeTrashed, maxFileSize, convertToMarkdown, preserveFormatting, extractImages, extractNotes, extractSpeakerNotes, createBackups, notifyChanges, batchSize, maxRetries, timeout, imageQuality, imageFormat, noteFormat}
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des templates d'importation
CREATE TABLE IF NOT EXISTS google_slides_import_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('presentation', 'batch', 'slides')),
    settings JSONB NOT NULL, -- {convertToMarkdown, preserveFormatting, extractImages, extractNotes, extractSpeakerNotes, includeComments, includeHiddenSlides, downloadImages, createBackups, overwriteExisting, folderStructure, batchSize, maxRetries, timeout, imageQuality, imageFormat, noteFormat}
    conversion_options JSONB DEFAULT '{}', -- {format, preserveHeadings, preserveLists, preserveTables, preserveImages, preserveLinks, preserveNotes, preserveSpeakerNotes, customStyles, addMetadata, includeTableOfContents, slideSeparators, includeSlideNumbers, includeSlideTitles, includeSlideThumbnails}
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des images extraites
CREATE TABLE IF NOT EXISTS google_slides_extracted_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    presentation_id UUID REFERENCES google_slides_presentations(id) ON DELETE CASCADE,
    slide_id VARCHAR(255) NOT NULL,
    element_id VARCHAR(255) NOT NULL,
    original_url TEXT NOT NULL,
    local_url TEXT,
    file_path TEXT,
    file_name VARCHAR(255),
    file_size BIGINT DEFAULT 0,
    file_format VARCHAR(10) DEFAULT 'png',
    image_quality VARCHAR(10) DEFAULT 'medium',
    width INTEGER DEFAULT 0,
    height INTEGER DEFAULT 0,
    x_position INTEGER DEFAULT 0,
    y_position INTEGER DEFAULT 0,
    rotation INTEGER DEFAULT 0,
    crop_properties JSONB DEFAULT '{}',
    alt_text TEXT,
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'downloading', 'processing', 'completed', 'failed', 'error')),
    processing_error TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notes extraites
CREATE TABLE IF NOT EXISTS google_slides_extracted_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    presentation_id UUID REFERENCES google_slides_presentations(id) ON DELETE CASCADE,
    slide_id VARCHAR(255) NOT NULL,
    note_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    format VARCHAR(20) DEFAULT 'text' CHECK (format IN ('text', 'html', 'markdown')),
    font_size INTEGER DEFAULT 12,
    font_family VARCHAR(100) DEFAULT 'Arial',
    color VARCHAR(20) DEFAULT '#000000',
    background_color VARCHAR(20) DEFAULT '#ffffff',
    padding INTEGER DEFAULT 10,
    timestamp TIMESTAMP WITH TIME ZONE,
    speaker VARCHAR(255),
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'error')),
    processing_error TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_google_slides_integrations_user_id ON google_slides_integrations(user_id);
CREATE INDEX idx_google_slides_integrations_google_account_id ON google_slides_integrations(google_account_id);
CREATE INDEX idx_google_slides_integrations_is_active ON google_slides_integrations(is_active);
CREATE INDEX idx_google_slides_integrations_last_sync_at ON google_slides_integrations(last_sync_at DESC);
CREATE INDEX idx_google_slides_integrations_token_expiry ON google_slides_integrations(token_expiry);
CREATE INDEX idx_google_slides_integrations_created_at ON google_slides_integrations(created_at DESC);

CREATE INDEX idx_google_slides_presentations_user_id ON google_slides_presentations(user_id);
CREATE INDEX idx_google_slides_presentations_integration_id ON google_slides_presentations(integration_id);
CREATE INDEX idx_google_slides_presentations_google_presentation_id ON google_slides_presentations(google_presentation_id);
CREATE INDEX idx_google_slides_presentations_name ON google_slides_presentations(name);
CREATE INDEX idx_google_slides_presentations_mime_type ON google_slides_presentations(mime_type);
CREATE INDEX idx_google_slides_presentations_sync_status ON google_slides_presentations(sync_status);
CREATE INDEX idx_google_slides_presentations_is_trashed ON google_slides_presentations(is_trashed);
CREATE INDEX idx_google_slides_presentations_modified_at ON google_slides_presentations(modified_at DESC);
CREATE INDEX idx_google_slides_presentations_last_sync_at ON google_slides_presentations(last_sync_at DESC);

CREATE INDEX idx_google_slides_sync_sessions_user_id ON google_slides_sync_sessions(user_id);
CREATE INDEX idx_google_slides_sync_sessions_integration_id ON google_slides_sync_sessions(integration_id);
CREATE INDEX idx_google_slides_sync_sessions_status ON google_slides_sync_sessions(status);
CREATE INDEX idx_google_slides_sync_sessions_start_time ON google_slides_sync_sessions(start_time DESC);
CREATE INDEX idx_google_slides_sync_sessions_trigger_type ON google_slides_sync_sessions(trigger_type);
CREATE INDEX idx_google_slides_sync_sessions_created_at ON google_slides_sync_sessions(created_at DESC);

CREATE INDEX idx_google_slides_sync_conflicts_user_id ON google_slides_sync_conflicts(user_id);
CREATE INDEX idx_google_slides_sync_conflicts_integration_id ON google_slides_sync_conflicts(integration_id);
CREATE INDEX idx_google_slides_sync_conflicts_presentation_id ON google_slides_sync_conflicts(presentation_id);
CREATE INDEX idx_google_slides_sync_conflicts_google_presentation_id ON google_slides_sync_conflicts(google_presentation_id);
CREATE INDEX idx_google_slides_sync_conflicts_conflict_type ON google_slides_sync_conflicts(conflict_type);
CREATE INDEX idx_google_slides_sync_conflicts_resolution_status ON google_slides_sync_conflicts(resolution_status);
CREATE INDEX idx_google_slides_sync_conflicts_created_at ON google_slides_sync_conflicts(created_at DESC);

CREATE INDEX idx_google_slides_statistics_date ON google_slides_statistics(date);
CREATE INDEX idx_google_slides_statistics_created_at ON google_slides_statistics(created_at DESC);

CREATE INDEX idx_google_slides_activity_logs_user_id ON google_slides_activity_logs(user_id);
CREATE INDEX idx_google_slides_activity_logs_integration_id ON google_slides_activity_logs(integration_id);
CREATE INDEX idx_google_slides_activity_logs_presentation_id ON google_slides_activity_logs(presentation_id);
CREATE INDEX idx_google_slides_activity_logs_session_id ON google_slides_activity_logs(session_id);
CREATE INDEX idx_google_slides_activity_logs_activity_type ON google_slides_activity_logs(activity_type);
CREATE INDEX idx_google_slides_activity_logs_timestamp ON google_slides_activity_logs(timestamp DESC);
CREATE INDEX idx_google_slides_activity_logs_severity ON google_slides_activity_logs(severity);
CREATE INDEX idx_google_slides_activity_logs_category ON google_slides_activity_logs(category);

CREATE INDEX idx_google_slides_default_sync_settings_is_default ON google_slides_default_sync_settings(is_default);
CREATE INDEX idx_google_slides_default_sync_settings_is_active ON google_slides_default_sync_settings(is_active);

CREATE INDEX idx_google_slides_import_templates_template_type ON google_slides_import_templates(template_type);
CREATE INDEX idx_google_slides_import_templates_is_active ON google_slides_import_templates(is_active);

CREATE INDEX idx_google_slides_extracted_images_user_id ON google_slides_extracted_images(user_id);
CREATE INDEX idx_google_slides_extracted_images_presentation_id ON google_slides_extracted_images(presentation_id);
CREATE INDEX idx_google_slides_extracted_images_slide_id ON google_slides_extracted_images(slide_id);
CREATE INDEX idx_google_slides_extracted_images_element_id ON google_slides_extracted_images(element_id);
CREATE INDEX idx_google_slides_extracted_images_processing_status ON google_slides_extracted_images(processing_status);
CREATE INDEX idx_google_slides_extracted_images_extracted_at ON google_slides_extracted_images(extracted_at DESC);

CREATE INDEX idx_google_slides_extracted_notes_user_id ON google_slides_extracted_notes(user_id);
CREATE INDEX idx_google_slides_extracted_notes_presentation_id ON google_slides_extracted_notes(presentation_id);
CREATE INDEX idx_google_slides_extracted_notes_slide_id ON google_slides_extracted_notes(slide_id);
CREATE INDEX idx_google_slides_extracted_notes_processing_status ON google_slides_extracted_notes(processing_status);
CREATE INDEX idx_google_slides_extracted_notes_extracted_at ON google_slides_extracted_notes(extracted_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_google_slides_integrations_updated_at 
    BEFORE UPDATE ON google_slides_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_slides_presentations_updated_at 
    BEFORE UPDATE ON google_slides_presentations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_slides_sync_conflicts_updated_at 
    BEFORE UPDATE ON google_slides_sync_conflicts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_slides_statistics_updated_at 
    BEFORE UPDATE ON google_slides_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_slides_default_sync_settings_updated_at 
    BEFORE UPDATE ON google_slides_default_sync_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_slides_import_templates_updated_at 
    BEFORE UPDATE ON google_slides_import_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_slides_extracted_images_updated_at 
    BEFORE UPDATE ON google_slides_extracted_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_slides_extracted_notes_updated_at 
    BEFORE UPDATE ON google_slides_extracted_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_google_slides_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO google_slides_statistics (
        date,
        total_integrations,
        active_integrations,
        total_presentations,
        synced_presentations,
        failed_presentations,
        new_presentations,
        updated_presentations,
        deleted_presentations,
        total_slides,
        extracted_slides,
        average_sync_time,
        total_storage_used,
        presentation_types,
        slide_types,
        presentation_sizes,
        slide_sizes,
        sync_performance,
        user_activity,
        api_usage,
        error_types,
        trends
    )
    SELECT 
        CURRENT_DATE,
        (SELECT COUNT(*) FROM google_slides_integrations) as total_integrations,
        (SELECT COUNT(*) FROM google_slides_integrations WHERE is_active = true) as active_integrations,
        (SELECT COUNT(*) FROM google_slides_presentations) as total_presentations,
        (SELECT COUNT(*) FROM google_slides_presentations WHERE sync_status = 'synced') as synced_presentations,
        (SELECT COUNT(*) FROM google_slides_presentations WHERE sync_status = 'failed') as failed_presentations,
        (SELECT COUNT(*) FROM google_slides_presentations WHERE DATE(imported_at) = CURRENT_DATE) as new_presentations,
        (SELECT COUNT(*) FROM google_slides_presentations WHERE DATE(last_sync_at) = CURRENT_DATE AND sync_status = 'synced') as updated_presentations,
        (SELECT COUNT(*) FROM google_slides_presentations WHERE sync_status = 'deleted') as deleted_presentations,
        (SELECT COALESCE(SUM((metadata->>'slideCount')::INTEGER), 0) FROM google_slides_presentations) as total_slides,
        (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE DATE(extracted_at) = CURRENT_DATE) as extracted_slides,
        COALESCE(AVG(duration), 0)::INTEGER as average_sync_time,
        COALESCE(SUM(size), 0) as total_storage_used,
        jsonb_build_object(
            'application/vnd.google-apps.presentation', (SELECT COUNT(*) FROM google_slides_presentations WHERE mime_type = 'application/vnd.google-apps.presentation')
        ),
        jsonb_build_object(
            'title', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%title%'),
            'content', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%content%'),
            'image', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%image%'),
            'chart', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%chart%'),
            'table', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%table%')
        ),
        jsonb_build_object(
            'average_size', COALESCE(AVG(size), 0),
            'median_size', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY size) FROM google_slides_presentations WHERE size > 0),
                0
            ),
            'min_size', COALESCE(MIN(size), 0),
            'max_size', COALESCE(MAX(size), 0),
            'total_size', COALESCE(SUM(size), 0)
        ),
        jsonb_build_object(
            'average_size', COALESCE(AVG(width * height), 0),
            'median_size', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY width * height) FROM google_slides_extracted_images WHERE width > 0 AND height > 0),
                0
            ),
            'min_size', COALESCE(MIN(width * height), 0),
            'max_size', COALESCE(MAX(width * height), 0),
            'total_size', COALESCE(SUM(width * height), 0)
        ),
        jsonb_build_object(
            'average_sync_time', COALESCE(AVG(duration), 0),
            'average_processing_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL), 0),
            'average_extraction_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL AND processing_status = 'completed'), 0),
            'average_conversion_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL), 0),
            'average_image_processing_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL AND processing_status = 'completed'), 0),
            'success_rate', COALESCE(
                (SELECT COUNT(*) FILTER (WHERE status = 'synced')::DECIMAL / NULLIF(COUNT(*), 0) * 100
                 FROM google_slides_sync_sessions WHERE DATE(start_time) = CURRENT_DATE), 
                0
            ),
            'error_rate', COALESCE(
                (SELECT COUNT(*) FILTER (WHERE status = 'failed')::DECIMAL / NULLIF(COUNT(*), 0) * 100
                 FROM google_slides_sync_sessions WHERE DATE(start_time) = CURRENT_DATE), 
                0
            ),
            'throughput', COALESCE(
                (SELECT COUNT(*) / AVG(duration / 60000.0)
                 FROM google_slides_sync_sessions WHERE DATE(start_time) = CURRENT_DATE AND duration > 0), 
                0
            )
        ),
        jsonb_build_object(
            'total_syncs', (SELECT COUNT(*) FROM google_slides_sync_sessions WHERE DATE(start_time) = CURRENT_DATE),
            'successful_syncs', (SELECT COUNT(*) FILTER (WHERE status = 'synced') FROM google_slides_sync_sessions WHERE DATE(start_time) = CURRENT_DATE),
            'failed_syncs', (SELECT COUNT(*) FILTER (WHERE status = 'failed') FROM google_slides_sync_sessions WHERE DATE(start_time) = CURRENT_DATE),
            'average_sync_interval', COALESCE(
                (SELECT AVG(EXTRACT(EPOCH FROM (start_time - LAG(start_time) OVER (ORDER BY start_time))) / 60)
                 FROM google_slides_sync_sessions WHERE DATE(start_time) = CURRENT_DATE), 
                0
            )
        ),
        jsonb_build_object(
            'api_calls', (SELECT COUNT(*) FROM google_slides_activity_logs WHERE activity_type = 'api_call' AND DATE(timestamp) = CURRENT_DATE),
            'token_refreshes', (SELECT COUNT(*) FROM google_slides_activity_logs WHERE activity_type = 'token_refreshed' AND DATE(timestamp) = CURRENT_DATE),
            'api_errors', (SELECT COUNT(*) FROM google_slides_activity_logs WHERE activity_type = 'error_occurred' AND category = 'api' AND DATE(timestamp) = CURRENT_DATE)
        ),
        jsonb_build_object(
            'sync_errors', (SELECT COUNT(*) FROM google_slides_activity_logs WHERE activity_type = 'sync_failed' AND DATE(timestamp) = CURRENT_DATE),
            'conflicts', (SELECT COUNT(*) FROM google_slides_activity_logs WHERE activity_type = 'conflict_detected' AND DATE(timestamp) = CURRENT_DATE),
            'processing_errors', (SELECT COUNT(*) FROM google_slides_activity_logs WHERE activity_type = 'error_occurred' AND category = 'presentation' AND DATE(timestamp) = CURRENT_DATE)
        ),
        jsonb_build_object(
            'integrationTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_slides_integrations 
                WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'syncTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_slides_sync_sessions 
                WHERE DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days' 
                GROUP BY DATE(start_time) 
                ORDER BY DATE(start_time)
            ),
            'presentationTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_slides_presentations 
                WHERE DATE(imported_at) >= CURRENT_DATE - INTERVAL '7 days' 
                GROUP BY DATE(imported_at) 
                ORDER BY DATE(imported_at)
            ),
            'slideTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_slides_extracted_notes 
                WHERE DATE(extracted_at) >= CURRENT_DATE - INTERVAL '7 days' 
                GROUP BY DATE(extracted_at) 
                ORDER BY DATE(extracted_at)
            ),
            'errorTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_slides_activity_logs 
                WHERE DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days' 
                AND severity = 'error'
                GROUP BY DATE(timestamp) 
                ORDER BY DATE(timestamp)
            )
        )
    ON CONFLICT (date) DO UPDATE SET
        total_integrations = EXCLUDED.total_integrations,
        active_integrations = EXCLUDED.active_integrations,
        total_presentations = EXCLUDED.total_presentations,
        synced_presentations = EXCLUDED.synced_presentations,
        failed_presentations = EXCLUDED.failed_presentations,
        new_presentations = EXCLUDED.new_presentations,
        updated_presentations = EXCLUDED.updated_presentations,
        deleted_presentations = EXCLUDED.deleted_presentations,
        total_slides = EXCLUDED.total_slides,
        extracted_slides = EXCLUDED.extracted_slides,
        average_sync_time = EXCLUDED.average_sync_time,
        total_storage_used = EXCLUDED.total_storage_used,
        presentation_types = EXCLUDED.presentation_types,
        slide_types = EXCLUDED.slide_types,
        presentation_sizes = EXCLUDED.presentation_sizes,
        slide_sizes = EXCLUDED.slide_sizes,
        sync_performance = EXCLUDED.sync_performance,
        user_activity = EXCLUDED.user_activity,
        api_usage = EXCLUDED.api_usage,
        error_types = EXCLUDED.error_types,
        trends = EXCLUDED.trends,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_google_slides_statistics_integrations
    AFTER INSERT ON google_slides_integrations
    FOR EACH ROW EXECUTE FUNCTION update_google_slides_statistics();

CREATE TRIGGER trigger_update_google_slides_statistics_presentations
    AFTER INSERT ON google_slides_presentations
    FOR EACH ROW EXECUTE FUNCTION update_google_slides_statistics();

CREATE TRIGGER trigger_update_google_slides_statistics_sessions
    AFTER INSERT ON google_slides_sync_sessions
    FOR EACH ROW EXECUTE FUNCTION update_google_slides_statistics();

CREATE TRIGGER trigger_update_google_slides_statistics_activity
    AFTER INSERT ON google_slides_activity_logs
    FOR EACH ROW EXECUTE FUNCTION update_google_slides_statistics();

-- Politiques RLS pour les intégrations
ALTER TABLE google_slides_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own Google Slides integrations" ON google_slides_integrations
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all Google Slides integrations" ON google_slides_integrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les présentations
ALTER TABLE google_slides_presentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own Google Slides presentations" ON google_slides_presentations
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all Google Slides presentations" ON google_slides_presentations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les sessions de synchronisation
ALTER TABLE google_slides_sync_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Google Slides sync sessions" ON google_slides_sync_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all Google Slides sync sessions" ON google_slides_sync_sessions
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
ALTER TABLE google_slides_sync_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own Google Slides sync conflicts" ON google_slides_sync_conflicts
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all Google Slides sync conflicts" ON google_slides_sync_conflicts
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
ALTER TABLE google_slides_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view Google Slides statistics" ON google_slides_statistics
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage Google Slides statistics" ON google_slides_statistics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les logs d'activité
ALTER TABLE google_slides_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Google Slides activity logs" ON google_slides_activity_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all Google Slides activity logs" ON google_slides_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les paramètres par défaut
ALTER TABLE google_slides_default_sync_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view Google Slides default sync settings" ON google_slides_default_sync_settings
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage Google Slides default sync settings" ON google_slides_default_sync_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les templates d'importation
ALTER TABLE google_slides_import_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active Google Slides import templates" ON google_slides_import_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage Google Slides import templates" ON google_slides_import_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les images extraites
ALTER TABLE google_slides_extracted_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own Google Slides extracted images" ON google_slides_extracted_images
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all Google Slides extracted images" ON google_slides_extracted_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les notes extraites
ALTER TABLE google_slides_extracted_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own Google Slides extracted notes" ON google_slides_extracted_notes
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all Google Slides extracted notes" ON google_slides_extracted_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour Google Slides

-- Fonction pour obtenir les statistiques Google Slides
CREATE OR REPLACE FUNCTION get_google_slides_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_integrations BIGINT,
    active_integrations BIGINT,
    total_presentations BIGINT,
    synced_presentations BIGINT,
    failed_presentations BIGINT,
    total_slides BIGINT,
    extracted_slides BIGINT,
    average_sync_time INTEGER,
    total_storage_used BIGINT,
    presentation_types JSONB,
    slide_types JSONB,
    presentation_sizes JSONB,
    slide_sizes JSONB,
    sync_performance JSONB,
    user_activity JSONB,
    trends JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM google_slides_integrations),
        (SELECT COUNT(*) FROM google_slides_integrations WHERE is_active = true),
        (SELECT COUNT(*) FROM google_slides_presentations),
        (SELECT COUNT(*) FROM google_slides_presentations WHERE sync_status = 'synced'),
        (SELECT COUNT(*) FROM google_slides_presentations WHERE sync_status = 'failed'),
        (SELECT COALESCE(SUM((metadata->>'slideCount')::INTEGER), 0) FROM google_slides_presentations),
        (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE DATE(extracted_at) = p_date),
        COALESCE(AVG(duration), 0)::INTEGER,
        COALESCE(SUM(size), 0),
        (SELECT jsonb_build_object(
            'application/vnd.google-apps.presentation', (SELECT COUNT(*) FROM google_slides_presentations WHERE mime_type = 'application/vnd.google-apps.presentation')
        )),
        (SELECT jsonb_build_object(
            'title', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%title%'),
            'content', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%content%'),
            'image', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%image%'),
            'chart', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%chart%'),
            'table', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%table%')
        )),
        (SELECT jsonb_build_object(
            'average_size', COALESCE(AVG(size), 0),
            'median_size', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY size) FROM google_slides_presentations WHERE size > 0),
                0
            ),
            'min_size', COALESCE(MIN(size), 0),
            'max_size', COALESCE(MAX(size), 0),
            'total_size', COALESCE(SUM(size), 0)
        )),
        (SELECT jsonb_build_object(
            'average_size', COALESCE(AVG(width * height), 0),
            'median_size', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY width * height) FROM google_slides_extracted_images WHERE width > 0 AND height > 0),
                0
            ),
            'min_size', COALESCE(MIN(width * height), 0),
            'max_size', COALESCE(MAX(width * height), 0),
            'total_size', COALESCE(SUM(width * height), 0)
        )),
        (SELECT jsonb_build_object(
            'average_sync_time', COALESCE(AVG(duration), 0),
            'average_processing_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL), 0),
            'average_extraction_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL AND processing_status = 'completed'), 0),
            'average_conversion_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL), 0),
            'average_image_processing_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL AND processing_status = 'completed'), 0),
            'success_rate', COALESCE(
                (SELECT COUNT(*) FILTER (WHERE status = 'synced')::DECIMAL / NULLIF(COUNT(*), 0) * 100
                 FROM google_slides_sync_sessions WHERE DATE(start_time) = p_date), 
                0
            ),
            'error_rate', COALESCE(
                (SELECT COUNT(*) FILTER (WHERE status = 'failed')::DECIMAL / NULLIF(COUNT(*), 0) * 100
                 FROM google_slides_sync_sessions WHERE DATE(start_time) = p_date), 
                0
            ),
            'throughput', COALESCE(
                (SELECT COUNT(*) / AVG(duration / 60000.0)
                 FROM google_slides_sync_sessions WHERE DATE(start_time) = p_date AND duration > 0), 
                0
            )
        )),
        (SELECT jsonb_build_object(
            'total_syncs', (SELECT COUNT(*) FROM google_slides_sync_sessions WHERE DATE(start_time) = p_date),
            'successful_syncs', (SELECT COUNT(*) FILTER (WHERE status = 'synced') FROM google_slides_sync_sessions WHERE DATE(start_time) = p_date),
            'failed_syncs', (SELECT COUNT(*) FILTER (WHERE status = 'failed') FROM google_slides_sync_sessions WHERE DATE(start_time) = p_date),
            'average_sync_interval', COALESCE(
                (SELECT AVG(EXTRACT(EPOCH FROM (start_time - LAG(start_time) OVER (ORDER BY start_time))) / 60)
                 FROM google_slides_sync_sessions WHERE DATE(start_time) = p_date), 
                0
            )
        )),
        (SELECT jsonb_build_object(
            'integrationTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_slides_integrations 
                WHERE DATE(created_at) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'syncTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_slides_sync_sessions 
                WHERE DATE(start_time) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(start_time) 
                ORDER BY DATE(start_time)
            ),
            'presentationTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_slides_presentations 
                WHERE DATE(imported_at) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(imported_at) 
                ORDER BY DATE(imported_at)
            ),
            'slideTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_slides_extracted_notes 
                WHERE DATE(extracted_at) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(extracted_at) 
                ORDER BY DATE(extracted_at)
            ),
            'errorTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_slides_activity_logs 
                WHERE DATE(timestamp) >= p_date - INTERVAL '7 days' 
                AND severity = 'error'
                GROUP BY DATE(timestamp) 
                ORDER BY DATE(timestamp)
            )
        ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les paramètres de synchronisation par défaut
CREATE OR REPLACE FUNCTION create_default_google_slides_sync_settings()
RETURNS VOID AS $$
BEGIN
    INSERT INTO google_slides_default_sync_settings (
        name,
        description,
        settings,
        is_default,
        is_active
    ) VALUES 
        ('Standard', 'Paramètres de synchronisation standard pour les présentations Google Slides', 
         '{"autoSync": true, "syncInterval": 60, "syncFolders": [], "fileTypes": ["application/vnd.google-apps.presentation"], "excludeShared": false, "excludeTrashed": true, "maxFileSize": 50, "convertToMarkdown": true, "preserveFormatting": true, "extractImages": true, "extractNotes": true, "extractSpeakerNotes": true, "createBackups": true, "notifyChanges": true, "batchSize": 25, "maxRetries": 3, "timeout": 30000, "imageQuality": "medium", "imageFormat": "png", "noteFormat": "markdown"}',
         true, true),
        ('Images haute qualité', 'Synchronisation avec extraction d\'images haute qualité', 
         '{"autoSync": true, "syncInterval": 120, "syncFolders": [], "fileTypes": ["application/vnd.google-apps.presentation"], "excludeShared": false, "excludeTrashed": true, "maxFileSize": 100, "convertToMarkdown": true, "preserveFormatting": true, "extractImages": true, "extractNotes": true, "extractSpeakerNotes": true, "createBackups": true, "notifyChanges": true, "batchSize": 15, "maxRetries": 3, "timeout": 60000, "imageQuality": "high", "imageFormat": "png", "noteFormat": "markdown"}',
         false, true),
        ('Notes uniquement', 'Synchronisation avec extraction des notes uniquement', 
         '{"autoSync": true, "syncInterval": 30, "syncFolders": [], "fileTypes": ["application/vnd.google-apps.presentation"], "excludeShared": false, "excludeTrashed": true, "maxFileSize": 25, "convertToMarkdown": true, "preserveFormatting": false, "extractImages": false, "extractNotes": true, "extractSpeakerNotes": true, "createBackups": true, "notifyChanges": true, "batchSize": 50, "maxRetries": 3, "timeout": 15000, "imageQuality": "low", "imageFormat": "jpg", "noteFormat": "text"}',
         false, true),
        ('Tous les types', 'Synchronisation de tous les types de fichiers Google', 
         '{"autoSync": true, "syncInterval": 180, "syncFolders": [], "fileTypes": ["application/vnd.google-apps.presentation", "application/vnd.google-apps.document", "application/vnd.google-apps.spreadsheet", "application/vnd.google-apps.drawing"], "excludeShared": false, "excludeTrashed": true, "maxFileSize": 200, "convertToMarkdown": true, "preserveFormatting": true, "extractImages": true, "extractNotes": true, "extractSpeakerNotes": true, "createBackups": true, "notifyChanges": true, "batchSize": 10, "maxRetries": 3, "timeout": 90000, "imageQuality": "ultra", "imageFormat": "webp", "noteFormat": "html"}',
         false, true)
    ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        settings = EXCLUDED.settings,
        is_default = EXCLUDED.is_default,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les templates d'importation par défaut
CREATE OR REPLACE FUNCTION create_default_google_slides_import_templates()
RETURNS VOID AS $$
BEGIN
    INSERT INTO google_slides_import_templates (
        name,
        description,
        template_type,
        settings,
        conversion_options,
        is_active
    ) VALUES 
        ('Markdown standard', 'Conversion standard en Markdown avec préservation du formatage des slides', 
         'presentation',
         '{"convertToMarkdown": true, "preserveFormatting": true, "extractImages": false, "extractNotes": true, "extractSpeakerNotes": true, "includeComments": false, "includeHiddenSlides": false, "downloadImages": true, "createBackups": true, "overwriteExisting": true, "folderStructure": true, "batchSize": 25, "maxRetries": 3, "timeout": 30000, "imageQuality": "medium", "imageFormat": "png", "noteFormat": "markdown"}',
         '{"format": "markdown", "preserveHeadings": true, "preserveLists": true, "preserveTables": true, "preserveImages": false, "preserveLinks": true, "preserveNotes": true, "preserveSpeakerNotes": true, "customStyles": false, "addMetadata": true, "includeTableOfContents": true, "slideSeparators": true, "includeSlideNumbers": true, "includeSlideTitles": true, "includeSlideThumbnails": false}',
         true),
        ('Markdown complet', 'Conversion complète en Markdown avec tous les éléments des slides', 
         'presentation',
         '{"convertToMarkdown": true, "preserveFormatting": true, "extractImages": true, "extractNotes": true, "extractSpeakerNotes": true, "includeComments": true, "includeHiddenSlides": true, "downloadImages": true, "createBackups": true, "overwriteExisting": true, "folderStructure": true, "batchSize": 15, "maxRetries": 3, "timeout": 60000, "imageQuality": "high", "imageFormat": "png", "noteFormat": "markdown"}',
         '{"format": "markdown", "preserveHeadings": true, "preserveLists": true, "preserveTables": true, "preserveImages": true, "preserveLinks": true, "preserveNotes": true, "preserveSpeakerNotes": true, "customStyles": true, "addMetadata": true, "includeTableOfContents": true, "slideSeparators": true, "includeSlideNumbers": true, "includeSlideTitles": true, "includeSlideThumbnails": true}',
         true),
        ('HTML brut', 'Conversion en HTML brut sans traitement', 
         'presentation',
         '{"convertToMarkdown": false, "preserveFormatting": false, "extractImages": false, "extractNotes": false, "extractSpeakerNotes": false, "includeComments": false, "includeHiddenSlides": false, "downloadImages": false, "createBackups": true, "overwriteExisting": true, "folderStructure": true, "batchSize": 50, "maxRetries": 3, "timeout": 15000, "imageQuality": "low", "imageFormat": "jpg", "noteFormat": "text"}',
         '{"format": "html", "preserveHeadings": false, "preserveLists": false, "preserveTables": false, "preserveImages": false, "preserveLinks": false, "preserveNotes": false, "preserveSpeakerNotes": false, "customStyles": false, "addMetadata": false, "includeTableOfContents": false, "slideSeparators": false, "includeSlideNumbers": false, "includeSlideTitles": false, "includeSlideThumbnails": false}',
         true),
        ('Texte brut', 'Conversion en texte brut sans formatage', 
         'presentation',
         '{"convertToMarkdown": false, "preserveFormatting": false, "extractImages": false, "extractNotes": false, "extractSpeakerNotes": false, "includeComments": false, "includeHiddenSlides": false, "downloadImages": false, "createBackups": true, "overwriteExisting": true, "folderStructure": true, "batchSize": 50, "maxRetries": 3, "timeout": 10000, "imageQuality": "low", "imageFormat": "jpg", "noteFormat": "text"}',
         '{"format": "text", "preserveHeadings": false, "preserveLists": false, "preserveTables": false, "preserveImages": false, "preserveLinks": false, "preserveNotes": false, "preserveSpeakerNotes": false, "customStyles": false, "addMetadata": false, "includeTableOfContents": false, "slideSeparators": false, "includeSlideNumbers": false, "includeSlideTitles": false, "includeSlideThumbnails": false}',
         true)
    ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        template_type = EXCLUDED.template_type,
        settings = EXCLUDED.settings,
        conversion_options = EXCLUDED.conversion_options,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciennes sessions de synchronisation
CREATE OR REPLACE FUNCTION cleanup_old_google_slides_sync_sessions(p_days_old INTEGER DEFAULT 30)
RETURNS TABLE (
    cleaned_sessions BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
BEGIN
    DELETE FROM google_slides_sync_sessions
    WHERE start_time < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_google_slides_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO google_slides_statistics (
        date,
        total_integrations,
        active_integrations,
        total_presentations,
        synced_presentations,
        failed_presentations,
        new_presentations,
        updated_presentations,
        deleted_presentations,
        total_slides,
        extracted_slides,
        average_sync_time,
        total_storage_used,
        presentation_types,
        slide_types,
        presentation_sizes,
        slide_sizes,
        sync_performance,
        user_activity,
        api_usage,
        error_types,
        trends
    )
    SELECT 
        p_date,
        (SELECT COUNT(*) FROM google_slides_integrations) as total_integrations,
        (SELECT COUNT(*) FROM google_slides_integrations WHERE is_active = true) as active_integrations,
        (SELECT COUNT(*) FROM google_slides_presentations) as total_presentations,
        (SELECT COUNT(*) FROM google_slides_presentations WHERE sync_status = 'synced') as synced_presentations,
        (SELECT COUNT(*) FROM google_slides_presentations WHERE sync_status = 'failed') as failed_presentations,
        (SELECT COUNT(*) FROM google_slides_presentations WHERE DATE(imported_at) = p_date) as new_presentations,
        (SELECT COUNT(*) FROM google_slides_presentations WHERE DATE(last_sync_at) = p_date AND sync_status = 'synced') as updated_presentations,
        (SELECT COUNT(*) FROM google_slides_presentations WHERE sync_status = 'deleted') as deleted_presentations,
        (SELECT COALESCE(SUM((metadata->>'slideCount')::INTEGER), 0) FROM google_slides_presentations) as total_slides,
        (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE DATE(extracted_at) = p_date) as extracted_slides,
        COALESCE(AVG(duration), 0)::INTEGER as average_sync_time,
        COALESCE(SUM(size), 0) as total_storage_used,
        jsonb_build_object(
            'application/vnd.google-apps.presentation', (SELECT COUNT(*) FROM google_slides_presentations WHERE mime_type = 'application/vnd.google-apps.presentation')
        ),
        jsonb_build_object(
            'title', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%title%'),
            'content', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%content%'),
            'image', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%image%'),
            'chart', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%chart%'),
            'table', (SELECT COUNT(*) FROM google_slides_extracted_notes WHERE slide_id LIKE '%table%')
        ),
        jsonb_build_object(
            'average_size', COALESCE(AVG(size), 0),
            'median_size', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY size) FROM google_slides_presentations WHERE size > 0),
                0
            ),
            'min_size', COALESCE(MIN(size), 0),
            'max_size', COALESCE(MAX(size), 0),
            'total_size', COALESCE(SUM(size), 0)
        ),
        jsonb_build_object(
            'average_size', COALESCE(AVG(width * height), 0),
            'median_size', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY width * height) FROM google_slides_extracted_images WHERE width > 0 AND height > 0),
                0
            ),
            'min_size', COALESCE(MIN(width * height), 0),
            'max_size', COALESCE(MAX(width * height), 0),
            'total_size', COALESCE(SUM(width * height), 0)
        ),
        jsonb_build_object(
            'average_sync_time', COALESCE(AVG(duration), 0),
            'average_processing_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL), 0),
            'average_extraction_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL AND processing_status = 'completed'), 0),
            'average_conversion_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL), 0),
            'average_image_processing_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL AND processing_status = 'completed'), 0),
            'success_rate', COALESCE(
                (SELECT COUNT(*) FILTER (WHERE status = 'synced')::DECIMAL / NULLIF(COUNT(*), 0) * 100
                 FROM google_slides_sync_sessions WHERE DATE(start_time) = p_date), 
                0
            ),
            'error_rate', COALESCE(
                (SELECT COUNT(*) FILTER (WHERE status = 'failed')::DECIMAL / NULLIF(COUNT(*), 0) * 100
                 FROM google_slides_sync_sessions WHERE DATE(start_time) = p_date), 
                0
            ),
            'throughput', COALESCE(
                (SELECT COUNT(*) / AVG(duration / 60000.0)
                 FROM google_slides_sync_sessions WHERE DATE(start_time) = p_date AND duration > 0), 
                0
            )
        ),
        jsonb_build_object(
            'total_syncs', (SELECT COUNT(*) FROM google_slides_sync_sessions WHERE DATE(start_time) = p_date),
            'successful_syncs', (SELECT COUNT(*) FILTER (WHERE status = 'synced') FROM google_slides_sync_sessions WHERE DATE(start_time) = p_date),
            'failed_syncs', (SELECT COUNT(*) FILTER (WHERE status = 'failed') FROM google_slides_sync_sessions WHERE DATE(start_time) = p_date),
            'average_sync_interval', COALESCE(
                (SELECT AVG(EXTRACT(EPOCH FROM (start_time - LAG(start_time) OVER (ORDER BY start_time))) / 60)
                 FROM google_slides_sync_sessions WHERE DATE(start_time) = p_date), 
                0
            )
        ),
        jsonb_build_object(
            'api_calls', (SELECT COUNT(*) FROM google_slides_activity_logs WHERE activity_type = 'api_call' AND DATE(timestamp) = p_date),
            'token_refreshes', (SELECT COUNT(*) FROM google_slides_activity_logs WHERE activity_type = 'token_refreshed' AND DATE(timestamp) = p_date),
            'api_errors', (SELECT COUNT(*) FROM google_slides_activity_logs WHERE activity_type = 'error_occurred' AND category = 'api' AND DATE(timestamp) = p_date)
        ),
        jsonb_build_object(
            'sync_errors', (SELECT COUNT(*) FROM google_slides_activity_logs WHERE activity_type = 'sync_failed' AND DATE(timestamp) = p_date),
            'conflicts', (SELECT COUNT(*) FROM google_slides_activity_logs WHERE activity_type = 'conflict_detected' AND DATE(timestamp) = p_date),
            'processing_errors', (SELECT COUNT(*) FROM google_slides_activity_logs WHERE activity_type = 'error_occurred' AND category = 'presentation' AND DATE(timestamp) = p_date)
        ),
        jsonb_build_object(
            'integrationTrend', ARRAY(SELECT COUNT(*) FROM google_slides_integrations WHERE DATE(created_at) >= p_date - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY DATE(created_at)),
            'syncTrend', ARRAY(SELECT COUNT(*) FROM google_slides_sync_sessions WHERE DATE(start_time) >= p_date - INTERVAL '7 days' GROUP BY DATE(start_time) ORDER BY DATE(start_time)),
            'presentationTrend', ARRAY(SELECT COUNT(*) FROM google_slides_presentations WHERE DATE(imported_at) >= p_date - INTERVAL '7 days' GROUP BY DATE(imported_at) ORDER BY DATE(imported_at)),
            'slideTrend', ARRAY(SELECT COUNT(*) FROM google_slides_extracted_notes WHERE DATE(extracted_at) >= p_date - INTERVAL '7 days' GROUP BY DATE(extracted_at) ORDER BY DATE(extracted_at)),
            'errorTrend', ARRAY(SELECT COUNT(*) FROM google_slides_activity_logs WHERE DATE(timestamp) >= p_date - INTERVAL '7 days' AND severity = 'error' GROUP BY DATE(timestamp) ORDER BY DATE(timestamp)))
        )
    ON CONFLICT (date) DO UPDATE SET
        total_integrations = EXCLUDED.total_integrations,
        active_integrations = EXCLUDED.active_integrations,
        total_presentations = EXCLUDED.total_presentations,
        synced_presentations = EXCLUDED.synced_presentations,
        failed_presentations = EXCLUDED.failed_presentations,
        new_presentations = EXCLUDED.new_presentations,
        updated_presentations = EXCLUDED.updated_presentations,
        deleted_presentations = EXCLUDED.deleted_presentations,
        total_slides = EXCLUDED.total_slides,
        extracted_slides = EXCLUDED.extracted_slides,
        average_sync_time = EXCLUDED.average_sync_time,
        total_storage_used = EXCLUDED.total_storage_used,
        presentation_types = EXCLUDED.presentation_types,
        slide_types = EXCLUDED.slide_types,
        presentation_sizes = EXCLUDED.presentation_sizes,
        slide_sizes = EXCLUDED.slide_sizes,
        sync_performance = EXCLUDED.sync_performance,
        user_activity = EXCLUDED.user_activity,
        api_usage = EXCLUDED.api_usage,
        error_types = EXCLUDED.error_types,
        trends = EXCLUDED.trends,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE google_slides_integrations IS 'Configurations d\'intégration avec Google Slides par utilisateur';
COMMENT ON TABLE google_slides_presentations IS 'Présentations Google Slides synchronisées avec slides et métadonnées';
COMMENT ON TABLE google_slides_sync_sessions IS 'Sessions de synchronisation avec statistiques détaillées';
COMMENT ON TABLE google_slides_sync_conflicts IS 'Conflits de synchronisation avec résolution';
COMMENT ON TABLE google_slides_statistics IS 'Statistiques d\'utilisation et de performance de l\'intégration Google Slides';
COMMENT ON TABLE google_slides_activity_logs IS 'Logs d\'activité pour l\'intégration Google Slides';
COMMENT ON TABLE google_slides_default_sync_settings IS 'Paramètres de synchronisation par défaut et prédéfinis';
COMMENT ON TABLE google_slides_import_templates IS 'Templates d\'importation avec options de conversion';
COMMENT ON TABLE google_slides_extracted_images IS 'Images extraites des slides Google Slides';
COMMENT ON TABLE google_slides_extracted_notes IS 'Notes extraites des slides Google Slides';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN google_slides_integrations.sync_settings IS 'Paramètres de synchronisation {autoSync, syncInterval, syncFolders, fileTypes, excludeShared, excludeTrashed, maxFileSize, convertToMarkdown, preserveFormatting, extractImages, extractNotes, extractSpeakerNotes, createBackups, notifyChanges}';
COMMENT ON COLUMN google_slides_presentations.slides IS 'Slides de la présentation [{id, objectId, title, index, layout, background, elements, notes, thumbnailUrl, thumbnailSize, content, metadata}]';
COMMENT ON COLUMN google_slides_presentations.metadata IS 'Métadonnées détaillées {slideCount, wordCount, characterCount, imageCount, tableCount, chartCount, videoCount, linkCount, commentCount, revisionCount, theme, layout, dimensions, language, locale, categories, tags, customProperties, exportSettings}';
COMMENT ON COLUMN google_slides_sync_sessions.summary IS 'Résumé de la synchronisation {totalPresentations, newPresentations, updatedPresentations, deletedPresentations, skippedPresentations, failedPresentations, totalSlides, extractedSlides, extractedImages, extractedNotes, totalSize, processingTime, averagePresentationSize, largestPresentationSize, smallestPresentationSize, presentationTypes, slideTypes, syncEfficiency, errorRate}';
COMMENT ON COLUMN google_slides_sync_conflicts.resolution_strategy IS 'Stratégie de résolution {manual, local_wins, remote_wins, merge, timestamp}';
COMMENT ON COLUMN google_slides_statistics.trends IS 'Tendances sur 7 jours {integrationTrend, syncTrend, presentationTrend, slideTrend, errorTrend}';
COMMENT ON COLUMN google_slides_import_templates.conversion_options IS 'Options de conversion {format, preserveHeadings, preserveLists, preserveTables, preserveImages, preserveLinks, preserveNotes, preserveSpeakerNotes, customStyles, addMetadata, includeTableOfContents, slideSeparators, includeSlideNumbers, includeSlideTitles, includeSlideThumbnails}';
COMMENT ON COLUMN google_slides_extracted_images.crop_properties IS 'Propriétés de recadrage {left, top, right, bottom, rotation}';
COMMENT ON COLUMN google_slides_extracted_notes.metadata IS 'Métadonnées des notes {fontSize, fontFamily, color, backgroundColor, padding, timestamp, speaker}';

-- Créer les données par défaut
SELECT create_default_google_slides_sync_settings();
SELECT create_default_google_slides_import_templates();
