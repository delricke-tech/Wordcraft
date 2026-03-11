-- Migration: Création des tables pour l'intégration Google Docs
-- Date: 11 mars 2026
-- Description: Tables pour gérer l'intégration avec Google Docs, la synchronisation et les documents

-- Table des intégrations Google Docs
CREATE TABLE IF NOT EXISTS google_docs_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    google_account_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    scopes TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_settings JSONB DEFAULT '{}', -- {autoSync, syncInterval, syncFolders, fileTypes, excludeShared, excludeTrashed, maxFileSize, convertToMarkdown, preserveFormatting, createBackups, notifyChanges}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des documents Google Docs synchronisés
CREATE TABLE IF NOT EXISTS google_docs_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    google_document_id VARCHAR(255) NOT NULL UNIQUE,
    integration_id UUID REFERENCES google_docs_integrations(id) ON DELETE CASCADE,
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
    content TEXT,
    metadata JSONB DEFAULT '{}', -- {wordCount, characterCount, paragraphCount, pageCount, sectionCount, tableCount, imageCount, linkCount, headingCount, listCount, commentCount, revisionCount, language, locale, categories, tags, customProperties}
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed', 'conflict', 'deleted', 'error')),
    imported_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_error TEXT,
    conflict_data JSONB DEFAULT '{}',
    backup_content TEXT,
    backup_metadata JSONB DEFAULT '{}',
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'error')),
    processing_error TEXT,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sessions de synchronisation
CREATE TABLE IF NOT EXISTS google_docs_sync_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES google_docs_integrations(id) ON DELETE CASCADE,
    google_account_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'synced', 'failed', 'conflict', 'error')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- en millisecondes
    documents_processed INTEGER DEFAULT 0,
    documents_succeeded INTEGER DEFAULT 0,
    documents_failed INTEGER DEFAULT 0,
    documents_skipped INTEGER DEFAULT 0,
    documents_updated INTEGER DEFAULT 0,
    documents_deleted INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]', -- [{documentId, documentName, errorType, errorMessage, errorCode, stackTrace, timestamp, resolved, resolvedAt}]
    summary JSONB DEFAULT '{}', -- {totalDocuments, newDocuments, updatedDocuments, deletedDocuments, skippedDocuments, failedDocuments, totalSize, processingTime, averageDocumentSize, largestDocumentSize, smallestDocumentSize, documentTypes, syncEfficiency, errorRate}
    settings JSONB DEFAULT '{}', -- paramètres utilisés pour cette synchronisation
    trigger_type VARCHAR(50) DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'auto', 'scheduled', 'webhook', 'api')),
    trigger_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des conflits de synchronisation
CREATE TABLE IF NOT EXISTS google_docs_sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES google_docs_integrations(id) ON DELETE CASCADE,
    document_id UUID REFERENCES google_docs_documents(id) ON DELETE CASCADE,
    google_document_id VARCHAR(255) NOT NULL,
    conflict_type VARCHAR(50) NOT NULL CHECK (conflict_type IN ('content', 'metadata', 'permissions', 'version', 'deleted', 'moved', 'renamed')),
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

-- Table des statistiques Google Docs
CREATE TABLE IF NOT EXISTS google_docs_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_integrations INTEGER DEFAULT 0,
    active_integrations INTEGER DEFAULT 0,
    total_documents INTEGER DEFAULT 0,
    synced_documents INTEGER DEFAULT 0,
    failed_documents INTEGER DEFAULT 0,
    new_documents INTEGER DEFAULT 0,
    updated_documents INTEGER DEFAULT 0,
    deleted_documents INTEGER DEFAULT 0,
    average_sync_time INTEGER DEFAULT 0, -- en millisecondes
    total_storage_used BIGINT DEFAULT 0,
    document_types JSONB DEFAULT '{}',
    document_sizes JSONB DEFAULT '{}',
    sync_performance JSONB DEFAULT '{}',
    user_activity JSONB DEFAULT '{}',
    api_usage JSONB DEFAULT '{}',
    error_types JSONB DEFAULT '{}',
    trends JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Table des logs d'activité Google Docs
CREATE TABLE IF NOT EXISTS google_docs_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    integration_id UUID REFERENCES google_docs_integrations(id) ON DELETE SET NULL,
    document_id UUID REFERENCES google_docs_documents(id) ON DELETE SET NULL,
    session_id UUID REFERENCES google_docs_sync_sessions(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('sync_started', 'sync_completed', 'sync_failed', 'document_imported', 'document_updated', 'document_deleted', 'conflict_detected', 'conflict_resolved', 'error_occurred', 'api_call', 'token_refreshed', 'settings_updated')),
    activity_details JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('sync', 'document', 'conflict', 'error', 'performance', 'security', 'api', 'user')),
    duration INTEGER, -- en millisecondes
    metadata JSONB DEFAULT '{}'
);

-- Table des paramètres de synchronisation par défaut
CREATE TABLE IF NOT EXISTS google_docs_default_sync_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    settings JSONB NOT NULL, -- {autoSync, syncInterval, syncFolders, fileTypes, excludeShared, excludeTrashed, maxFileSize, convertToMarkdown, preserveFormatting, createBackups, notifyChanges, batchSize, maxRetries, timeout}
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des templates d'importation
CREATE TABLE IF NOT EXISTS google_docs_import_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('document', 'folder', 'batch')),
    settings JSONB NOT NULL, -- {convertToMarkdown, preserveFormatting, includeComments, includeRevisions, includeImages, downloadImages, createBackups, overwriteExisting, folderStructure, batchSize, maxRetries, timeout, conversionOptions}
    conversion_options JSONB DEFAULT '{}', -- {format, preserveHeadings, preserveLists, preserveTables, preserveImages, preserveLinks, preserveComments, customStyles, addMetadata, includeTableOfContents}
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_google_docs_integrations_user_id ON google_docs_integrations(user_id);
CREATE INDEX idx_google_docs_integrations_google_account_id ON google_docs_integrations(google_account_id);
CREATE INDEX idx_google_docs_integrations_is_active ON google_docs_integrations(is_active);
CREATE INDEX idx_google_docs_integrations_last_sync_at ON google_docs_integrations(last_sync_at DESC);
CREATE INDEX idx_google_docs_integrations_token_expiry ON google_docs_integrations(token_expiry);
CREATE INDEX idx_google_docs_integrations_created_at ON google_docs_integrations(created_at DESC);

CREATE INDEX idx_google_docs_documents_user_id ON google_docs_documents(user_id);
CREATE INDEX idx_google_docs_documents_integration_id ON google_docs_documents(integration_id);
CREATE INDEX idx_google_docs_documents_google_document_id ON google_docs_documents(google_document_id);
CREATE INDEX idx_google_docs_documents_name ON google_docs_documents(name);
CREATE INDEX idx_google_docs_documents_mime_type ON google_docs_documents(mime_type);
CREATE INDEX idx_google_docs_documents_sync_status ON google_docs_documents(sync_status);
CREATE INDEX idx_google_docs_documents_is_trashed ON google_docs_documents(is_trashed);
CREATE INDEX idx_google_docs_documents_modified_at ON google_docs_documents(modified_at DESC);
CREATE INDEX idx_google_docs_documents_last_sync_at ON google_docs_documents(last_sync_at DESC);

CREATE INDEX idx_google_docs_sync_sessions_user_id ON google_docs_sync_sessions(user_id);
CREATE INDEX idx_google_docs_sync_sessions_integration_id ON google_docs_sync_sessions(integration_id);
CREATE INDEX idx_google_docs_sync_sessions_status ON google_docs_sync_sessions(status);
CREATE INDEX idx_google_docs_sync_sessions_start_time ON google_docs_sync_sessions(start_time DESC);
CREATE INDEX idx_google_docs_sync_sessions_trigger_type ON google_docs_sync_sessions(trigger_type);
CREATE INDEX idx_google_docs_sync_sessions_created_at ON google_docs_sync_sessions(created_at DESC);

CREATE INDEX idx_google_docs_sync_conflicts_user_id ON google_docs_sync_conflicts(user_id);
CREATE INDEX idx_google_docs_sync_conflicts_integration_id ON google_docs_sync_conflicts(integration_id);
CREATE INDEX idx_google_docs_sync_conflicts_document_id ON google_docs_sync_conflicts(document_id);
CREATE INDEX idx_google_docs_sync_conflicts_google_document_id ON google_docs_sync_conflicts(google_document_id);
CREATE INDEX idx_google_docs_sync_conflicts_conflict_type ON google_docs_sync_conflicts(conflict_type);
CREATE INDEX idx_google_docs_sync_conflicts_resolution_status ON google_docs_sync_conflicts(resolution_status);
CREATE INDEX idx_google_docs_sync_conflicts_created_at ON google_docs_sync_conflicts(created_at DESC);

CREATE INDEX idx_google_docs_statistics_date ON google_docs_statistics(date);
CREATE INDEX idx_google_docs_statistics_created_at ON google_docs_statistics(created_at DESC);

CREATE INDEX idx_google_docs_activity_logs_user_id ON google_docs_activity_logs(user_id);
CREATE INDEX idx_google_docs_activity_logs_integration_id ON google_docs_activity_logs(integration_id);
CREATE INDEX idx_google_docs_activity_logs_document_id ON google_docs_activity_logs(document_id);
CREATE INDEX idx_google_docs_activity_logs_session_id ON google_docs_activity_logs(session_id);
CREATE INDEX idx_google_docs_activity_logs_activity_type ON google_docs_activity_logs(activity_type);
CREATE INDEX idx_google_docs_activity_logs_timestamp ON google_docs_activity_logs(timestamp DESC);
CREATE INDEX idx_google_docs_activity_logs_severity ON google_docs_activity_logs(severity);
CREATE INDEX idx_google_docs_activity_logs_category ON google_docs_activity_logs(category);

CREATE INDEX idx_google_docs_default_sync_settings_is_default ON google_docs_default_sync_settings(is_default);
CREATE INDEX idx_google_docs_default_sync_settings_is_active ON google_docs_default_sync_settings(is_active);

CREATE INDEX idx_google_docs_import_templates_template_type ON google_docs_import_templates(template_type);
CREATE INDEX idx_google_docs_import_templates_is_active ON google_docs_import_templates(is_active);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_google_docs_integrations_updated_at 
    BEFORE UPDATE ON google_docs_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_docs_documents_updated_at 
    BEFORE UPDATE ON google_docs_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_docs_sync_conflicts_updated_at 
    BEFORE UPDATE ON google_docs_sync_conflicts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_docs_statistics_updated_at 
    BEFORE UPDATE ON google_docs_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_docs_default_sync_settings_updated_at 
    BEFORE UPDATE ON google_docs_default_sync_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_docs_import_templates_updated_at 
    BEFORE UPDATE ON google_docs_import_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_google_docs_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO google_docs_statistics (
        date,
        total_integrations,
        active_integrations,
        total_documents,
        synced_documents,
        failed_documents,
        new_documents,
        updated_documents,
        deleted_documents,
        average_sync_time,
        total_storage_used,
        document_types,
        document_sizes,
        sync_performance,
        user_activity,
        api_usage,
        error_types,
        trends
    )
    SELECT 
        CURRENT_DATE,
        (SELECT COUNT(*) FROM google_docs_integrations) as total_integrations,
        (SELECT COUNT(*) FROM google_docs_integrations WHERE is_active = true) as active_integrations,
        (SELECT COUNT(*) FROM google_docs_documents) as total_documents,
        (SELECT COUNT(*) FROM google_docs_documents WHERE sync_status = 'synced') as synced_documents,
        (SELECT COUNT(*) FROM google_docs_documents WHERE sync_status = 'failed') as failed_documents,
        (SELECT COUNT(*) FROM google_docs_documents WHERE DATE(imported_at) = CURRENT_DATE) as new_documents,
        (SELECT COUNT(*) FROM google_docs_documents WHERE DATE(last_sync_at) = CURRENT_DATE AND sync_status = 'synced') as updated_documents,
        (SELECT COUNT(*) FROM google_docs_documents WHERE sync_status = 'deleted') as deleted_documents,
        COALESCE(AVG(duration), 0)::INTEGER as average_sync_time,
        COALESCE(SUM(size), 0) as total_storage_used,
        jsonb_build_object(
            'application/vnd.google-apps.document', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.document'),
            'application/vnd.google-apps.spreadsheet', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.spreadsheet'),
            'application/vnd.google-apps.presentation', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.presentation'),
            'application/vnd.google-apps.drawing', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.drawing'),
            'application/vnd.google-apps.form', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.form'),
            'application/vnd.google-apps.map', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.map')
        ),
        jsonb_build_object(
            'average_size', COALESCE(AVG(size), 0),
            'median_size', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY size) FROM google_docs_documents WHERE size > 0),
                0
            ),
            'min_size', COALESCE(MIN(size), 0),
            'max_size', COALESCE(MAX(size), 0),
            'total_size', COALESCE(SUM(size), 0)
        ),
        jsonb_build_object(
            'average_sync_time', COALESCE(AVG(duration), 0),
            'average_processing_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL), 0),
            'success_rate', COALESCE(
                (SELECT COUNT(*) FILTER (WHERE status = 'synced')::DECIMAL / NULLIF(COUNT(*), 0) * 100
                 FROM google_docs_sync_sessions WHERE DATE(start_time) = CURRENT_DATE), 
                0
            ),
            'error_rate', COALESCE(
                (SELECT COUNT(*) FILTER (WHERE status = 'failed')::DECIMAL / NULLIF(COUNT(*), 0) * 100
                 FROM google_docs_sync_sessions WHERE DATE(start_time) = CURRENT_DATE), 
                0
            ),
            'throughput', COALESCE(
                (SELECT COUNT(*) / AVG(duration / 60000.0)
                 FROM google_docs_sync_sessions WHERE DATE(start_time) = CURRENT_DATE AND duration > 0), 
                0
            )
        ),
        jsonb_build_object(
            'total_syncs', (SELECT COUNT(*) FROM google_docs_sync_sessions WHERE DATE(start_time) = CURRENT_DATE),
            'successful_syncs', (SELECT COUNT(*) FILTER (WHERE status = 'synced') FROM google_docs_sync_sessions WHERE DATE(start_time) = CURRENT_DATE),
            'failed_syncs', (SELECT COUNT(*) FILTER (WHERE status = 'failed') FROM google_docs_sync_sessions WHERE DATE(start_time) = CURRENT_DATE),
            'average_sync_interval', COALESCE(
                (SELECT AVG(EXTRACT(EPOCH FROM (start_time - LAG(start_time) OVER (ORDER BY start_time))) / 60)
                 FROM google_docs_sync_sessions WHERE DATE(start_time) = CURRENT_DATE), 
                0
            )
        ),
        jsonb_build_object(
            'api_calls', (SELECT COUNT(*) FROM google_docs_activity_logs WHERE activity_type = 'api_call' AND DATE(timestamp) = CURRENT_DATE),
            'token_refreshes', (SELECT COUNT(*) FROM google_docs_activity_logs WHERE activity_type = 'token_refreshed' AND DATE(timestamp) = CURRENT_DATE),
            'api_errors', (SELECT COUNT(*) FROM google_docs_activity_logs WHERE activity_type = 'error_occurred' AND category = 'api' AND DATE(timestamp) = CURRENT_DATE)
        ),
        jsonb_build_object(
            'sync_errors', (SELECT COUNT(*) FROM google_docs_activity_logs WHERE activity_type = 'sync_failed' AND DATE(timestamp) = CURRENT_DATE),
            'conflicts', (SELECT COUNT(*) FROM google_docs_activity_logs WHERE activity_type = 'conflict_detected' AND DATE(timestamp) = CURRENT_DATE),
            'processing_errors', (SELECT COUNT(*) FROM google_docs_activity_logs WHERE activity_type = 'error_occurred' AND category = 'document' AND DATE(timestamp) = CURRENT_DATE)
        ),
        jsonb_build_object(
            'integrationTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_docs_integrations 
                WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'syncTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_docs_sync_sessions 
                WHERE DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days' 
                GROUP BY DATE(start_time) 
                ORDER BY DATE(start_time)
            ),
            'documentTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_docs_documents 
                WHERE DATE(imported_at) >= CURRENT_DATE - INTERVAL '7 days' 
                GROUP BY DATE(imported_at) 
                ORDER BY DATE(imported_at)
            ),
            'errorTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_docs_activity_logs 
                WHERE DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days' 
                AND severity = 'error'
                GROUP BY DATE(timestamp) 
                ORDER BY DATE(timestamp)
            )
        )
    ON CONFLICT (date) DO UPDATE SET
        total_integrations = EXCLUDED.total_integrations,
        active_integrations = EXCLUDED.active_integrations,
        total_documents = EXCLUDED.total_documents,
        synced_documents = EXCLUDED.synced_documents,
        failed_documents = EXCLUDED.failed_documents,
        new_documents = EXCLUDED.new_documents,
        updated_documents = EXCLUDED.updated_documents,
        deleted_documents = EXCLUDED.deleted_documents,
        average_sync_time = EXCLUDED.average_sync_time,
        total_storage_used = EXCLUDED.total_storage_used,
        document_types = EXCLUDED.document_types,
        document_sizes = EXCLUDED.document_sizes,
        sync_performance = EXCLUDED.sync_performance,
        user_activity = EXCLUDED.user_activity,
        api_usage = EXCLUDED.api_usage,
        error_types = EXCLUDED.error_types,
        trends = EXCLUDED.trends,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_google_docs_statistics_integrations
    AFTER INSERT ON google_docs_integrations
    FOR EACH ROW EXECUTE FUNCTION update_google_docs_statistics();

CREATE TRIGGER trigger_update_google_docs_statistics_documents
    AFTER INSERT ON google_docs_documents
    FOR EACH ROW EXECUTE FUNCTION update_google_docs_statistics();

CREATE TRIGGER trigger_update_google_docs_statistics_sessions
    AFTER INSERT ON google_docs_sync_sessions
    FOR EACH ROW EXECUTE FUNCTION update_google_docs_statistics();

CREATE TRIGGER trigger_update_google_docs_statistics_activity
    AFTER INSERT ON google_docs_activity_logs
    FOR EACH ROW EXECUTE FUNCTION update_google_docs_statistics();

-- Politiques RLS pour les intégrations
ALTER TABLE google_docs_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own Google Docs integrations" ON google_docs_integrations
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all Google Docs integrations" ON google_docs_integrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les documents
ALTER TABLE google_docs_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own Google Docs documents" ON google_docs_documents
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all Google Docs documents" ON google_docs_documents
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
ALTER TABLE google_docs_sync_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Google Docs sync sessions" ON google_docs_sync_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all Google Docs sync sessions" ON google_docs_sync_sessions
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
ALTER TABLE google_docs_sync_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own Google Docs sync conflicts" ON google_docs_sync_conflicts
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all Google Docs sync conflicts" ON google_docs_sync_conflicts
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
ALTER TABLE google_docs_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view Google Docs statistics" ON google_docs_statistics
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage Google Docs statistics" ON google_docs_statistics
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
ALTER TABLE google_docs_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Google Docs activity logs" ON google_docs_activity_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all Google Docs activity logs" ON google_docs_activity_logs
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
ALTER TABLE google_docs_default_sync_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view Google Docs default sync settings" ON google_docs_default_sync_settings
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage Google Docs default sync settings" ON google_docs_default_sync_settings
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
ALTER TABLE google_docs_import_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active Google Docs import templates" ON google_docs_import_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage Google Docs import templates" ON google_docs_import_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour Google Docs

-- Fonction pour obtenir les statistiques Google Docs
CREATE OR REPLACE FUNCTION get_google_docs_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_integrations BIGINT,
    active_integrations BIGINT,
    total_documents BIGINT,
    synced_documents BIGINT,
    failed_documents BIGINT,
    average_sync_time INTEGER,
    total_storage_used BIGINT,
    document_types JSONB,
    document_sizes JSONB,
    sync_performance JSONB,
    user_activity JSONB,
    trends JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM google_docs_integrations),
        (SELECT COUNT(*) FROM google_docs_integrations WHERE is_active = true),
        (SELECT COUNT(*) FROM google_docs_documents),
        (SELECT COUNT(*) FROM google_docs_documents WHERE sync_status = 'synced'),
        (SELECT COUNT(*) FROM google_docs_documents WHERE sync_status = 'failed'),
        COALESCE(AVG(duration), 0)::INTEGER,
        COALESCE(SUM(size), 0),
        (SELECT jsonb_build_object(
            'application/vnd.google-apps.document', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.document'),
            'application/vnd.google-apps.spreadsheet', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.spreadsheet'),
            'application/vnd.google-apps.presentation', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.presentation'),
            'application/vnd.google-apps.drawing', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.drawing'),
            'application/vnd.google-apps.form', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.form'),
            'application/vnd.google-apps.map', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.map')
        )),
        (SELECT jsonb_build_object(
            'average_size', COALESCE(AVG(size), 0),
            'median_size', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY size) FROM google_docs_documents WHERE size > 0),
                0
            ),
            'min_size', COALESCE(MIN(size), 0),
            'max_size', COALESCE(MAX(size), 0),
            'total_size', COALESCE(SUM(size), 0)
        )),
        (SELECT jsonb_build_object(
            'average_sync_time', COALESCE(AVG(duration), 0),
            'average_processing_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL), 0),
            'success_rate', COALESCE(
                (SELECT COUNT(*) FILTER (WHERE status = 'synced')::DECIMAL / NULLIF(COUNT(*), 0) * 100
                 FROM google_docs_sync_sessions WHERE DATE(start_time) = p_date), 
                0
            ),
            'error_rate', COALESCE(
                (SELECT COUNT(*) FILTER (WHERE status = 'failed')::DECIMAL / NULLIF(COUNT(*), 0) * 100
                 FROM google_docs_sync_sessions WHERE DATE(start_time) = p_date), 
                0
            ),
            'throughput', COALESCE(
                (SELECT COUNT(*) / AVG(duration / 60000.0)
                 FROM google_docs_sync_sessions WHERE DATE(start_time) = p_date AND duration > 0), 
                0
            )
        )),
        (SELECT jsonb_build_object(
            'total_syncs', (SELECT COUNT(*) FROM google_docs_sync_sessions WHERE DATE(start_time) = p_date),
            'successful_syncs', (SELECT COUNT(*) FILTER (WHERE status = 'synced') FROM google_docs_sync_sessions WHERE DATE(start_time) = p_date),
            'failed_syncs', (SELECT COUNT(*) FILTER (WHERE status = 'failed') FROM google_docs_sync_sessions WHERE DATE(start_time) = p_date),
            'average_sync_interval', COALESCE(
                (SELECT AVG(EXTRACT(EPOCH FROM (start_time - LAG(start_time) OVER (ORDER BY start_time))) / 60)
                 FROM google_docs_sync_sessions WHERE DATE(start_time) = p_date), 
                0
            )
        )),
        (SELECT jsonb_build_object(
            'integrationTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_docs_integrations 
                WHERE DATE(created_at) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'syncTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_docs_sync_sessions 
                WHERE DATE(start_time) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(start_time) 
                ORDER BY DATE(start_time)
            ),
            'documentTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_docs_documents 
                WHERE DATE(imported_at) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(imported_at) 
                ORDER BY DATE(imported_at)
            ),
            'errorTrend', ARRAY(
                SELECT COUNT(*) 
                FROM google_docs_activity_logs 
                WHERE DATE(timestamp) >= p_date - INTERVAL '7 days' 
                AND severity = 'error'
                GROUP BY DATE(timestamp) 
                ORDER BY DATE(timestamp)
            )
        ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les paramètres de synchronisation par défaut
CREATE OR REPLACE FUNCTION create_default_google_docs_sync_settings()
RETURNS VOID AS $$
BEGIN
    INSERT INTO google_docs_default_sync_settings (
        name,
        description,
        settings,
        is_default,
        is_active
    ) VALUES 
        ('Standard', 'Paramètres de synchronisation standard pour tous les types de documents', 
         '{"autoSync": true, "syncInterval": 60, "syncFolders": [], "fileTypes": ["application/vnd.google-apps.document", "application/vnd.google-apps.spreadsheet", "application/vnd.google-apps.presentation"], "excludeShared": false, "excludeTrashed": true, "maxFileSize": 100, "convertToMarkdown": true, "preserveFormatting": true, "createBackups": true, "notifyChanges": true, "batchSize": 50, "maxRetries": 3, "timeout": 30000}',
         true, true),
        ('Documents uniquement', 'Synchronisation des documents Google Docs uniquement', 
         '{"autoSync": true, "syncInterval": 30, "syncFolders": [], "fileTypes": ["application/vnd.google-apps.document"], "excludeShared": false, "excludeTrashed": true, "maxFileSize": 50, "convertToMarkdown": true, "preserveFormatting": true, "createBackups": true, "notifyChanges": true, "batchSize": 25, "maxRetries": 3, "timeout": 15000}',
         false, true),
        ('Présentations uniquement', 'Synchronisation des présentations Google Slides uniquement', 
         '{"autoSync": true, "syncInterval": 45, "syncFolders": [], "fileTypes": ["application/vnd.google-apps.presentation"], "excludeShared": false, "excludeTrashed": true, "maxFileSize": 200, "convertToMarkdown": true, "preserveFormatting": true, "createBackups": true, "notifyChanges": true, "batchSize": 30, "maxRetries": 3, "timeout": 45000}',
         false, true),
        ('Tous les types', 'Synchronisation de tous les types de fichiers Google', 
         '{"autoSync": true, "syncInterval": 120, "syncFolders": [], "fileTypes": ["application/vnd.google-apps.document", "application/vnd.google-apps.spreadsheet", "application/vnd.google-apps.presentation", "application/vnd.google-apps.drawing", "application/vnd.google-apps.form", "application/vnd.google-apps.map"], "excludeShared": false, "excludeTrashed": true, "maxFileSize": 500, "convertToMarkdown": true, "preserveFormatting": true, "createBackups": true, "notifyChanges": true, "batchSize": 100, "maxRetries": 3, "timeout": 60000}',
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
CREATE OR REPLACE FUNCTION create_default_google_docs_import_templates()
RETURNS VOID AS $$
BEGIN
    INSERT INTO google_docs_import_templates (
        name,
        description,
        template_type,
        settings,
        conversion_options,
        is_active
    ) VALUES 
        ('Markdown standard', 'Conversion standard en Markdown avec préservation du formatage', 
         'document',
         '{"convertToMarkdown": true, "preserveFormatting": true, "includeComments": false, "includeRevisions": false, "includeImages": true, "downloadImages": true, "createBackups": true, "overwriteExisting": true, "folderStructure": true, "batchSize": 50, "maxRetries": 3, "timeout": 30000}',
         '{"format": "markdown", "preserveHeadings": true, "preserveLists": true, "preserveTables": true, "preserveImages": true, "preserveLinks": true, "preserveComments": false, "customStyles": false, "addMetadata": true, "includeTableOfContents": true}',
         true),
        ('Markdown complet', 'Conversion complète en Markdown avec tous les éléments', 
         'document',
         '{"convertToMarkdown": true, "preserveFormatting": true, "includeComments": true, "includeRevisions": true, "includeImages": true, "downloadImages": true, "createBackups": true, "overwriteExisting": true, "folderStructure": true, "batchSize": 25, "maxRetries": 3, "timeout": 60000}',
         '{"format": "markdown", "preserveHeadings": true, "preserveLists": true, "preserveTables": true, "preserveImages": true, "preserveLinks": true, "preserveComments": true, "customStyles": true, "addMetadata": true, "includeTableOfContents": true}',
         true),
        ('HTML brut', 'Conversion en HTML brut sans traitement', 
         'document',
         '{"convertToMarkdown": false, "preserveFormatting": false, "includeComments": false, "includeRevisions": false, "includeImages": false, "downloadImages": false, "createBackups": true, "overwriteExisting": true, "folderStructure": true, "batchSize": 100, "maxRetries": 3, "timeout": 15000}',
         '{"format": "html", "preserveHeadings": false, "preserveLists": false, "preserveTables": false, "preserveImages": false, "preserveLinks": false, "preserveComments": false, "customStyles": false, "addMetadata": false, "includeTableOfContents": false}',
         true),
        ('Texte brut', 'Conversion en texte brut sans formatage', 
         'document',
         '{"convertToMarkdown": false, "preserveFormatting": false, "includeComments": false, "includeRevisions": false, "includeImages": false, "downloadImages": false, "createBackups": true, "overwriteExisting": true, "folderStructure": true, "batchSize": 100, "maxRetries": 3, "timeout": 10000}',
         '{"format": "text", "preserveHeadings": false, "preserveLists": false, "preserveTables": false, "preserveImages": false, "preserveLinks": false, "preserveComments": false, "customStyles": false, "addMetadata": false, "includeTableOfContents": false}',
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
CREATE OR REPLACE FUNCTION cleanup_old_google_docs_sync_sessions(p_days_old INTEGER DEFAULT 30)
RETURNS TABLE (
    cleaned_sessions BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
BEGIN
    DELETE FROM google_docs_sync_sessions
    WHERE start_time < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_google_docs_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO google_docs_statistics (
        date,
        total_integrations,
        active_integrations,
        total_documents,
        synced_documents,
        failed_documents,
        new_documents,
        updated_documents,
        deleted_documents,
        average_sync_time,
        total_storage_used,
        document_types,
        document_sizes,
        sync_performance,
        user_activity,
        api_usage,
        error_types,
        trends
    )
    SELECT 
        p_date,
        (SELECT COUNT(*) FROM google_docs_integrations) as total_integrations,
        (SELECT COUNT(*) FROM google_docs_integrations WHERE is_active = true) as active_integrations,
        (SELECT COUNT(*) FROM google_docs_documents) as total_documents,
        (SELECT COUNT(*) FROM google_docs_documents WHERE sync_status = 'synced') as synced_documents,
        (SELECT COUNT(*) FROM google_docs_documents WHERE sync_status = 'failed') as failed_documents,
        (SELECT COUNT(*) FROM google_docs_documents WHERE DATE(imported_at) = p_date) as new_documents,
        (SELECT COUNT(*) FROM google_docs_documents WHERE DATE(last_sync_at) = p_date AND sync_status = 'synced') as updated_documents,
        (SELECT COUNT(*) FROM google_docs_documents WHERE sync_status = 'deleted') as deleted_documents,
        COALESCE(AVG(duration), 0)::INTEGER as average_sync_time,
        COALESCE(SUM(size), 0) as total_storage_used,
        jsonb_build_object(
            'application/vnd.google-apps.document', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.document'),
            'application/vnd.google-apps.spreadsheet', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.spreadsheet'),
            'application/vnd.google-apps.presentation', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.presentation'),
            'application/vnd.google-apps.drawing', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.drawing'),
            'application/vnd.google-apps.form', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.form'),
            'application/vnd.google-apps.map', (SELECT COUNT(*) FROM google_docs_documents WHERE mime_type = 'application/vnd.google-apps.map')
        ),
        jsonb_build_object(
            'average_size', COALESCE(AVG(size), 0),
            'median_size', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY size) FROM google_docs_documents WHERE size > 0),
                0
            ),
            'min_size', COALESCE(MIN(size), 0),
            'max_size', COALESCE(MAX(size), 0),
            'total_size', COALESCE(SUM(size), 0)
        ),
        jsonb_build_object(
            'average_sync_time', COALESCE(AVG(duration), 0),
            'average_processing_time', COALESCE(AVG(processing_completed_at - processing_started_at) FILTER (WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NOT NULL), 0),
            'success_rate', COALESCE(
                (SELECT COUNT(*) FILTER (WHERE status = 'synced')::DECIMAL / NULLIF(COUNT(*), 0) * 100
                 FROM google_docs_sync_sessions WHERE DATE(start_time) = p_date), 
                0
            ),
            'error_rate', COALESCE(
                (SELECT COUNT(*) FILTER (WHERE status = 'failed')::DECIMAL / NULLIF(COUNT(*), 0) * 100
                 FROM google_docs_sync_sessions WHERE DATE(start_time) = p_date), 
                0
            ),
            'throughput', COALESCE(
                (SELECT COUNT(*) / AVG(duration / 60000.0)
                 FROM google_docs_sync_sessions WHERE DATE(start_time) = p_date AND duration > 0), 
                0
            )
        ),
        jsonb_build_object(
            'total_syncs', (SELECT COUNT(*) FROM google_docs_sync_sessions WHERE DATE(start_time) = p_date),
            'successful_syncs', (SELECT COUNT(*) FILTER (WHERE status = 'synced') FROM google_docs_sync_sessions WHERE DATE(start_time) = p_date),
            'failed_syncs', (SELECT COUNT(*) FILTER (WHERE status = 'failed') FROM google_docs_sync_sessions WHERE DATE(start_time) = p_date),
            'average_sync_interval', COALESCE(
                (SELECT AVG(EXTRACT(EPOCH FROM (start_time - LAG(start_time) OVER (ORDER BY start_time))) / 60)
                 FROM google_docs_sync_sessions WHERE DATE(start_time) = p_date), 
                0
            )
        ),
        jsonb_build_object(
            'api_calls', (SELECT COUNT(*) FROM google_docs_activity_logs WHERE activity_type = 'api_call' AND DATE(timestamp) = p_date),
            'token_refreshes', (SELECT COUNT(*) FROM google_docs_activity_logs WHERE activity_type = 'token_refreshed' AND DATE(timestamp) = p_date),
            'api_errors', (SELECT COUNT(*) FROM google_docs_activity_logs WHERE activity_type = 'error_occurred' AND category = 'api' AND DATE(timestamp) = p_date)
        ),
        jsonb_build_object(
            'sync_errors', (SELECT COUNT(*) FROM google_docs_activity_logs WHERE activity_type = 'sync_failed' AND DATE(timestamp) = p_date),
            'conflicts', (SELECT COUNT(*) FROM google_docs_activity_logs WHERE activity_type = 'conflict_detected' AND DATE(timestamp) = p_date),
            'processing_errors', (SELECT COUNT(*) FROM google_docs_activity_logs WHERE activity_type = 'error_occurred' AND category = 'document' AND DATE(timestamp) = p_date)
        ),
        jsonb_build_object(
            'integrationTrend', ARRAY(SELECT COUNT(*) FROM google_docs_integrations WHERE DATE(created_at) >= p_date - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY DATE(created_at)),
            'syncTrend', ARRAY(SELECT COUNT(*) FROM google_docs_sync_sessions WHERE DATE(start_time) >= p_date - INTERVAL '7 days' GROUP BY DATE(start_time) ORDER BY DATE(start_time)),
            'documentTrend', ARRAY(SELECT COUNT(*) FROM google_docs_documents WHERE DATE(imported_at) >= p_date - INTERVAL '7 days' GROUP BY DATE(imported_at) ORDER BY DATE(imported_at)),
            'errorTrend', ARRAY(SELECT COUNT(*) FROM google_docs_activity_logs WHERE DATE(timestamp) >= p_date - INTERVAL '7 days' AND severity = 'error' GROUP BY DATE(timestamp) ORDER BY DATE(timestamp))
        )
    ON CONFLICT (date) DO UPDATE SET
        total_integrations = EXCLUDED.total_integrations,
        active_integrations = EXCLUDED.active_integrations,
        total_documents = EXCLUDED.total_documents,
        synced_documents = EXCLUDED.synced_documents,
        failed_documents = EXCLUDED.failed_documents,
        new_documents = EXCLUDED.new_documents,
        updated_documents = EXCLUDED.updated_documents,
        deleted_documents = EXCLUDED.deleted_documents,
        average_sync_time = EXCLUDED.average_sync_time,
        total_storage_used = EXCLUDED.total_storage_used,
        document_types = EXCLUDED.document_types,
        document_sizes = EXCLUDED.document_sizes,
        sync_performance = EXCLUDED.sync_performance,
        user_activity = EXCLUDED.user_activity,
        api_usage = EXCLUDED.api_usage,
        error_types = EXCLUDED.error_types,
        trends = EXCLUDED.trends,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE google_docs_integrations IS 'Configurations d\'intégration avec Google Docs par utilisateur';
COMMENT ON TABLE google_docs_documents IS 'Documents Google Docs synchronisés avec contenu et métadonnées';
COMMENT ON TABLE google_docs_sync_sessions IS 'Sessions de synchronisation avec statistiques détaillées';
COMMENT ON TABLE google_docs_sync_conflicts IS 'Conflits de synchronisation avec résolution';
COMMENT ON TABLE google_docs_statistics IS 'Statistiques d\'utilisation et de performance de l\'intégration Google Docs';
COMMENT ON TABLE google_docs_activity_logs IS 'Logs d\'activité pour l\'intégration Google Docs';
COMMENT ON TABLE google_docs_default_sync_settings IS 'Paramètres de synchronisation par défaut et prédéfinis';
COMMENT ON TABLE google_docs_import_templates IS 'Templates d\'importation avec options de conversion';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN google_docs_integrations.sync_settings IS 'Paramètres de synchronisation {autoSync, syncInterval, syncFolders, fileTypes, excludeShared, excludeTrashed, maxFileSize, convertToMarkdown, preserveFormatting, createBackups, notifyChanges}';
COMMENT ON COLUMN google_docs_documents.content IS 'Contenu converti du document (Markdown, HTML, texte)';
COMMENT ON COLUMN google_docs_documents.metadata IS 'Métadonnées détaillées {wordCount, characterCount, paragraphCount, pageCount, sectionCount, tableCount, imageCount, linkCount, headingCount, listCount, commentCount, revisionCount, language, locale, categories, tags}';
COMMENT ON COLUMN google_docs_sync_sessions.summary IS 'Résumé de la synchronisation {totalDocuments, newDocuments, updatedDocuments, deletedDocuments, skippedDocuments, failedDocuments, totalSize, processingTime, averageDocumentSize, largestDocumentSize, smallestDocumentSize, documentTypes, syncEfficiency, errorRate}';
COMMENT ON COLUMN google_docs_sync_conflicts.resolution_strategy IS 'Stratégie de résolution {manual, local_wins, remote_wins, merge, timestamp}';
COMMENT ON COLUMN google_docs_statistics.trends IS 'Tendances sur 7 jours {integrationTrend, syncTrend, documentTrend, errorTrend}';
COMMENT ON COLUMN google_docs_import_templates.conversion_options IS 'Options de conversion {format, preserveHeadings, preserveLists, preserveTables, preserveImages, preserveLinks, preserveComments, customStyles, addMetadata, includeTableOfContents}';

-- Créer les données par défaut
SELECT create_default_google_docs_sync_settings();
SELECT create_default_google_docs_import_templates();
