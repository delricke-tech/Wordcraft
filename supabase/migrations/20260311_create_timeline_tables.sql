-- Migration: Création des tables pour les timelines chronologiques
-- Date: 11 mars 2026
-- Description: Tables pour gérer les timelines chronologiques avec événements extraits

-- Table principale des timelines
CREATE TABLE IF NOT EXISTS timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'historical' CHECK (type IN ('historical', 'project', 'biographical', 'narrative', 'process', 'scientific', 'legal', 'medical', 'educational', 'business', 'custom')),
    events JSONB DEFAULT '[]', -- [{id, title, description, date, startDate, endDate, time, duration, location, participants, category, subcategory, importance, status, type, sources, media, tags, keywords, relatedEvents, metadata, position, style, interactions, createdAt, updatedAt}]
    settings JSONB DEFAULT '{}', -- {maxEvents, dateRange, categories, importance, status, sortBy, sortOrder, grouping, filtering, visualization, export, personalization}
    metadata JSONB DEFAULT '{}', -- {totalEvents, dateRange, categories, types, importance, status, locations, participants, quality, extraction, version, lastUpdated, customFields}
    analytics JSONB DEFAULT '{}', -- {totalViews, uniqueViews, averageSessionDuration, mostViewedEvents, userEngagement, temporalPatterns, geographicPatterns, contentPerformance, trends}
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'reviewing', 'approved', 'published', 'archived', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Table des événements de timeline
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    start_date DATE,
    end_date DATE,
    time TIME,
    duration INTEGER, -- en minutes
    location VARCHAR(255),
    participants TEXT[] DEFAULT '{}',
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    importance VARCHAR(20) DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled', 'postponed')),
    type VARCHAR(50) DEFAULT 'milestone' CHECK (type IN ('milestone', 'meeting', 'decision', 'deadline', 'launch', 'completion', 'review', 'approval', 'change', 'crisis', 'celebration', 'announcement', 'discovery', 'invention', 'publication', 'conflict', 'resolution', 'birth', 'death', 'marriage', 'graduation', 'appointment', 'travel', 'achievement', 'failure', 'success', 'custom')),
    sources JSONB DEFAULT '[]', -- [{id, type, title, content, url, pageNumber, position, confidence, relevance, snippet, metadata}]
    media JSONB DEFAULT '[]', -- [{id, type, url, title, description, thumbnail, duration, size, format, metadata}]
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    related_events TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}', -- {extractionMethod, confidence, relevance, accuracy, completeness, processingTime, model, temperature, tokensUsed, language, sentiment, complexity, readability, wordCount, characterCount, sentenceCount, paragraphCount, dateExtraction, customFields}
    position JSONB DEFAULT '{}', -- {x, y, width, height, lane, zIndex, connections}
    style JSONB DEFAULT '{}', -- {color, backgroundColor, borderColor, borderWidth, borderStyle, borderRadius, opacity, fontSize, fontFamily, fontWeight, fontStyle, icon, iconSize, iconColor, shadow, animation}
    interactions JSONB DEFAULT '[]', -- [{id, userId, type, timestamp, metadata}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sources d'événements
CREATE TABLE IF NOT EXISTS timeline_event_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES timeline_events(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('document', 'page', 'section', 'paragraph', 'annotation', 'url')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    url TEXT,
    page_number INTEGER,
    position JSONB DEFAULT '{}', -- {x, y, width, height, pageNumber}
    confidence DECIMAL(3,2) DEFAULT 0.00 CHECK (confidence >= 0 AND confidence <= 1),
    relevance DECIMAL(3,2) DEFAULT 0.00 CHECK (relevance >= 0 AND relevance <= 1),
    snippet TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des médias d'événements
CREATE TABLE IF NOT EXISTS timeline_event_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES timeline_events(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document', 'chart', 'map', 'infographic')),
    url TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail TEXT,
    duration INTEGER, -- en secondes
    size BIGINT,
    format VARCHAR(10),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des interactions d'événements
CREATE TABLE IF NOT EXISTS timeline_event_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES timeline_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('view', 'click', 'share', 'comment', 'like', 'bookmark', 'edit')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des templates de timeline
CREATE TABLE IF NOT EXISTS timeline_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('historical', 'project', 'biographical', 'narrative', 'process', 'scientific', 'legal', 'medical', 'educational', 'business', 'custom')),
    prompt TEXT NOT NULL,
    settings JSONB DEFAULT '{}', -- {maxEvents, dateRange, categories, importance, status, sortBy, sortOrder, grouping, filtering, visualization, export, personalization}
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exports de timeline
CREATE TABLE IF NOT EXISTS timeline_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
    format VARCHAR(10) NOT NULL CHECK (format IN ('json', 'csv', 'xlsx', 'pdf', 'html', 'svg', 'png')),
    options JSONB DEFAULT '{}', -- {format, quality, includeMetadata, includeMedia, includeInteractions, dateRange, customOptions}
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT DEFAULT 0,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des statistiques de timeline
CREATE TABLE IF NOT EXISTS timeline_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_timelines INTEGER DEFAULT 0,
    published_timelines INTEGER DEFAULT 0,
    draft_timelines INTEGER DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    average_events_per_timeline DECIMAL(5,2) DEFAULT 0.00,
    most_active_types JSONB DEFAULT '{}', -- {type: count}
    most_active_categories JSONB DEFAULT '{}', -- {category: count}
    top_performing_timelines JSONB DEFAULT '[]', -- [{timelineId, title, viewCount, averageRating, eventCount}]
    user_engagement JSONB DEFAULT '{}', -- {totalUsers, activeUsers, averageTimelinesPerUser, averageEventsPerUser, averageSessionDuration, satisfactionScore}
    content_quality JSONB DEFAULT '{}', -- {averageConfidence, averageRelevance, averageAccuracy, averageCompleteness, extractionSuccessRate}
    trends JSONB DEFAULT '{}', -- {timelineGrowth, eventGrowth, typeTrends, categoryTrends}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, user_id)
);

-- Table des sessions de consultation de timeline
CREATE TABLE IF NOT EXISTS timeline_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- en secondes
    events_viewed TEXT[] DEFAULT '{}',
    events_clicked TEXT[] DEFAULT '{}',
    interactions_count INTEGER DEFAULT 0,
    device VARCHAR(50),
    browser VARCHAR(50),
    location VARCHAR(255),
    session_data JSONB DEFAULT '{}', -- {viewMode, zoomLevel, scrollPosition, interactions}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des connexions entre événements
CREATE TABLE IF NOT EXISTS timeline_event_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_event_id UUID REFERENCES timeline_events(id) ON DELETE CASCADE,
    to_event_id UUID REFERENCES timeline_events(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('causal', 'temporal', 'dependency', 'related', 'custom')),
    label TEXT,
    style JSONB DEFAULT '{}', -- {color, width, style, arrowType, opacity}
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_event_id, to_event_id, type)
);

-- Index pour les performances
CREATE INDEX idx_timelines_document_id ON timelines(document_id);
CREATE INDEX idx_timelines_user_id ON timelines(user_id);
CREATE INDEX idx_timelines_type ON timelines(type);
CREATE INDEX idx_timelines_status ON timelines(status);
CREATE INDEX idx_timelines_created_at ON timelines(created_at DESC);
CREATE INDEX idx_timelines_updated_at ON timelines(updated_at DESC);
CREATE INDEX idx_timelines_published_at ON timelines(published_at DESC);

CREATE INDEX idx_timeline_events_timeline_id ON timeline_events(timeline_id);
CREATE INDEX idx_timeline_events_date ON timeline_events(date);
CREATE INDEX idx_timeline_events_category ON timeline_events(category);
CREATE INDEX idx_timeline_events_type ON timeline_events(type);
CREATE INDEX idx_timeline_events_importance ON timeline_events(importance);
CREATE INDEX idx_timeline_events_status ON timeline_events(status);
CREATE INDEX idx_timeline_events_created_at ON timeline_events(created_at DESC);
CREATE INDEX idx_timeline_events_tags ON timeline_events USING GIN (tags);
CREATE INDEX idx_timeline_events_keywords ON timeline_events USING GIN (keywords);

CREATE INDEX idx_timeline_event_sources_event_id ON timeline_event_sources(event_id);
CREATE INDEX idx_timeline_event_sources_type ON timeline_event_sources(type);
CREATE INDEX idx_timeline_event_sources_confidence ON timeline_event_sources(confidence DESC);
CREATE INDEX idx_timeline_event_sources_relevance ON timeline_event_sources(relevance DESC);

CREATE INDEX idx_timeline_event_media_event_id ON timeline_event_media(event_id);
CREATE INDEX idx_timeline_event_media_type ON timeline_event_media(type);
CREATE INDEX idx_timeline_event_media_created_at ON timeline_event_media(created_at DESC);

CREATE INDEX idx_timeline_event_interactions_event_id ON timeline_event_interactions(event_id);
CREATE INDEX idx_timeline_event_interactions_user_id ON timeline_event_interactions(user_id);
CREATE INDEX idx_timeline_event_interactions_type ON timeline_event_interactions(type);
CREATE INDEX idx_timeline_event_interactions_timestamp ON timeline_event_interactions(timestamp DESC);

CREATE INDEX idx_timeline_templates_type ON timeline_templates(type);
CREATE INDEX idx_timeline_templates_is_default ON timeline_templates(is_default);
CREATE INDEX idx_timeline_templates_is_active ON timeline_templates(is_active);
CREATE INDEX idx_timeline_templates_usage_count ON timeline_templates(usage_count DESC);

CREATE INDEX idx_timeline_exports_timeline_id ON timeline_exports(timeline_id);
CREATE INDEX idx_timeline_exports_format ON timeline_exports(format);
CREATE INDEX idx_timeline_exports_status ON timeline_exports(status);
CREATE INDEX idx_timeline_exports_created_at ON timeline_exports(created_at DESC);

CREATE INDEX idx_timeline_statistics_date ON timeline_statistics(date);
CREATE INDEX idx_timeline_statistics_user_id ON timeline_statistics(user_id);
CREATE INDEX idx_timeline_statistics_created_at ON timeline_statistics(created_at DESC);

CREATE INDEX idx_timeline_sessions_timeline_id ON timeline_sessions(timeline_id);
CREATE INDEX idx_timeline_sessions_user_id ON timeline_sessions(user_id);
CREATE INDEX idx_timeline_sessions_session_id ON timeline_sessions(session_id);
CREATE INDEX idx_timeline_sessions_start_time ON timeline_sessions(start_time DESC);
CREATE INDEX idx_timeline_sessions_duration ON timeline_sessions(duration DESC);

CREATE INDEX idx_timeline_event_connections_from_event_id ON timeline_event_connections(from_event_id);
CREATE INDEX idx_timeline_event_connections_to_event_id ON timeline_event_connections(to_event_id);
CREATE INDEX idx_timeline_event_connections_type ON timeline_event_connections(type);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_timelines_updated_at 
    BEFORE UPDATE ON timelines 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_events_updated_at 
    BEFORE UPDATE ON timeline_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_templates_updated_at 
    BEFORE UPDATE ON timeline_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_statistics_updated_at 
    BEFORE UPDATE ON timeline_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_sessions_updated_at 
    BEFORE UPDATE ON timeline_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_timeline_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO timeline_statistics (
        date,
        user_id,
        total_timelines,
        published_timelines,
        draft_timelines,
        total_events,
        average_events_per_timeline,
        most_active_types,
        most_active_categories,
        top_performing_timelines,
        user_engagement,
        content_quality,
        trends
    )
    SELECT 
        CURRENT_DATE,
        NEW.user_id,
        (SELECT COUNT(*) FROM timelines WHERE user_id = NEW.user_id),
        (SELECT COUNT(*) FROM timelines WHERE user_id = NEW.user_id AND status = 'published'),
        (SELECT COUNT(*) FROM timelines WHERE user_id = NEW.user_id AND status = 'draft'),
        (SELECT COUNT(*) FROM timeline_events te JOIN timelines t ON te.timeline_id = t.id WHERE t.user_id = NEW.user_id),
        COALESCE(
            (SELECT AVG(event_count)::DECIMAL 
             FROM (SELECT COUNT(*) as event_count 
                   FROM timeline_events te 
                   JOIN timelines t ON te.timeline_id = t.id 
                   WHERE t.user_id = NEW.user_id 
                   GROUP BY t.id) t), 
            0
        ),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT type),
            ARRAY_AGG(COUNT(*))
        ) FROM timeline_events te JOIN timelines t ON te.timeline_id = t.id WHERE t.user_id = NEW.user_id GROUP BY type),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT category),
            ARRAY_AGG(COUNT(*))
        ) FROM timeline_events te JOIN timelines t ON te.timeline_id = t.id WHERE t.user_id = NEW.user_id GROUP BY category),
        (SELECT jsonb_agg(
            jsonb_build_object(
                'timelineId', t.id,
                'title', t.title,
                'viewCount', (SELECT COUNT(*) FROM timeline_sessions ts WHERE ts.timeline_id = t.id),
                'averageRating', 4.5, -- Simulé
                'eventCount', (SELECT COUNT(*) FROM timeline_events te WHERE te.timeline_id = t.id)
            )
        ) FROM timelines t WHERE t.user_id = NEW.user_id ORDER BY (SELECT COUNT(*) FROM timeline_sessions ts WHERE ts.timeline_id = t.id) DESC LIMIT 10),
        jsonb_build_object(
            'totalUsers', 1,
            'activeUsers', CASE WHEN DATE(t.updated_at) >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END,
            'averageTimelinesPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) 
                 FROM timeline_sessions 
                 WHERE user_id = NEW.user_id AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'averageEventsPerUser', COALESCE(
                (SELECT AVG(event_count)::INTEGER 
                 FROM (SELECT COUNT(*) as event_count 
                       FROM timeline_events te 
                       JOIN timelines t ON te.timeline_id = t.id 
                       WHERE t.user_id = NEW.user_id 
                       GROUP BY t.id) t), 
                0
            ),
            'averageSessionDuration', COALESCE(
                (SELECT AVG(duration) 
                 FROM timeline_sessions 
                 WHERE user_id = NEW.user_id AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'satisfactionScore', 4.2 -- Simulé
        ),
        jsonb_build_object(
            'averageConfidence', COALESCE(AVG(confidence), 0),
            'averageRelevance', COALESCE(AVG(relevance), 0),
            'averageAccuracy', COALESCE(AVG((metadata->>'accuracy')::DECIMAL), 0),
            'averageCompleteness', COALESCE(AVG((metadata->>'completeness')::DECIMAL), 0),
            'extractionSuccessRate', COALESCE(AVG((metadata->>'confidence')::DECIMAL), 0)
        ),
        jsonb_build_object(
            'timelineGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM timelines 
                WHERE user_id = NEW.user_id AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            ),
            'eventGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM timeline_events te 
                JOIN timelines t ON te.timeline_id = t.id 
                WHERE t.user_id = NEW.user_id AND DATE(te.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', te.created_at) 
                ORDER BY DATE_TRUNC('month', te.created_at)
            ),
            'typeTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT type),
                    ARRAY_AGG(COUNT(*))
                )
                FROM timeline_events te 
                JOIN timelines t ON te.timeline_id = t.id 
                WHERE t.user_id = NEW.user_id AND DATE(te.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY type
            ),
            'categoryTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT category),
                    ARRAY_AGG(COUNT(*))
                )
                FROM timeline_events te 
                JOIN timelines t ON te.timeline_id = t.id 
                WHERE t.user_id = NEW.user_id AND DATE(te.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY category
            )
        )
    ON CONFLICT (date, user_id) DO UPDATE SET
        total_timelines = EXCLUDED.total_timelines,
        published_timelines = EXCLUDED.published_timelines,
        draft_timelines = EXCLUDED.draft_timelines,
        total_events = EXCLUDED.total_events,
        average_events_per_timeline = EXCLUDED.average_events_per_timeline,
        most_active_types = EXCLUDED.most_active_types,
        most_active_categories = EXCLUDED.most_active_categories,
        top_performing_timelines = EXCLUDED.top_performing_timelines,
        user_engagement = EXCLUDED.user_engagement,
        content_quality = EXCLUDED.content_quality,
        trends = EXCLUDED.trends,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timeline_statistics_timelines
    AFTER INSERT OR UPDATE OR DELETE ON timelines
    FOR EACH ROW EXECUTE FUNCTION update_timeline_statistics();

CREATE TRIGGER trigger_update_timeline_statistics_events
    AFTER INSERT OR UPDATE OR DELETE ON timeline_events
    FOR EACH ROW EXECUTE FUNCTION update_timeline_statistics();

CREATE TRIGGER trigger_update_timeline_statistics_interactions
    AFTER INSERT ON timeline_event_interactions
    FOR EACH ROW EXECUTE FUNCTION update_timeline_statistics();

-- Politiques RLS pour les timelines
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own timelines" ON timelines
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view published timelines" ON timelines
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can view all timelines" ON timelines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les événements de timeline
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events of accessible timelines" ON timeline_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM timelines t
            WHERE t.id = timeline_id 
            AND (t.user_id = auth.uid() OR t.status = 'published')
        )
    );

CREATE POLICY "Admins can view all timeline events" ON timeline_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les sources d'événements
ALTER TABLE timeline_event_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sources of accessible events" ON timeline_event_sources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM timeline_events te
            JOIN timelines t ON te.timeline_id = t.id
            WHERE te.id = event_id 
            AND (t.user_id = auth.uid() OR t.status = 'published')
        )
    );

-- Politiques RLS pour les médias d'événements
ALTER TABLE timeline_event_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view media of accessible events" ON timeline_event_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM timeline_events te
            JOIN timelines t ON te.timeline_id = t.id
            WHERE te.id = event_id 
            AND (t.user_id = auth.uid() OR t.status = 'published')
        )
    );

-- Politiques RLS pour les interactions d'événements
ALTER TABLE timeline_event_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own event interactions" ON timeline_event_interactions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all event interactions" ON timeline_event_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les templates
ALTER TABLE timeline_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active timeline templates" ON timeline_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage timeline templates" ON timeline_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les exports
ALTER TABLE timeline_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own timeline exports" ON timeline_exports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM timelines t
            WHERE t.id = timeline_id AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all timeline exports" ON timeline_exports
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
ALTER TABLE timeline_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timeline statistics" ON timeline_statistics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all timeline statistics" ON timeline_statistics
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
ALTER TABLE timeline_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own timeline sessions" ON timeline_sessions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all timeline sessions" ON timeline_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les connexions d'événements
ALTER TABLE timeline_event_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view connections of accessible events" ON timeline_event_connections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM timeline_events te
            JOIN timelines t ON te.timeline_id = t.id
            WHERE te.id = from_event_id 
            AND (t.user_id = auth.uid() OR t.status = 'published')
        )
    );

-- Fonctions RPC pour les timelines

-- Fonction pour obtenir les statistiques des timelines
CREATE OR REPLACE FUNCTION get_timeline_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_timelines BIGINT,
    published_timelines BIGINT,
    draft_timelines BIGINT,
    total_events BIGINT,
    average_events_per_timeline DECIMAL(5,2),
    most_active_types JSONB,
    most_active_categories JSONB,
    top_performing_timelines JSONB,
    user_engagement JSONB,
    content_quality JSONB,
    trends JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(total_timelines), 0),
        COALESCE(SUM(published_timelines), 0),
        COALESCE(SUM(draft_timelines), 0),
        COALESCE(SUM(total_events), 0),
        COALESCE(AVG(average_events_per_timeline), 0),
        (SELECT jsonb_agg(most_active_types) FROM (
            SELECT jsonb_build_object(
                'type', type,
                'count', count
            ) as most_active_types
            FROM (
                SELECT 
                    type,
                    COUNT(*) as count
                FROM timeline_events te 
                JOIN timelines t ON te.timeline_id = t.id 
                WHERE (p_user_id IS NULL OR t.user_id = p_user_id) 
                GROUP BY type
            ) t
        ) sub),
        (SELECT jsonb_agg(most_active_categories) FROM (
            SELECT jsonb_build_object(
                'category', category,
                'count', count
            ) as most_active_categories
            FROM (
                SELECT 
                    category,
                    COUNT(*) as count
                FROM timeline_events te 
                JOIN timelines t ON te.timeline_id = t.id 
                WHERE (p_user_id IS NULL OR t.user_id = p_user_id) 
                GROUP BY category
            ) t
        ) sub),
        (SELECT jsonb_agg(top_performing_timelines) FROM (
            SELECT jsonb_build_object(
                'timelineId', t.id,
                'title', t.title,
                'viewCount', viewCount,
                'averageRating', 4.5,
                'eventCount', eventCount
            ) as top_performing_timelines
            FROM (
                SELECT 
                    t.id,
                    t.title,
                    (SELECT COUNT(*) FROM timeline_sessions ts WHERE ts.timeline_id = t.id) as viewCount,
                    (SELECT COUNT(*) FROM timeline_events te WHERE te.timeline_id = t.id) as eventCount
                FROM timelines t 
                WHERE (p_user_id IS NULL OR t.user_id = p_user_id) 
                ORDER BY viewCount DESC 
                LIMIT 10
            ) t
        ) sub),
        jsonb_build_object(
            'totalUsers', (SELECT COUNT(DISTINCT user_id) FROM timelines WHERE (p_user_id IS NULL OR user_id = p_user_id)),
            'activeUsers', (SELECT COUNT(DISTINCT user_id) FROM timelines WHERE (p_user_id IS NULL OR user_id = p_user_id) AND DATE(updated_at) >= CURRENT_DATE - INTERVAL '7 days'),
            'averageTimelinesPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) 
                 FROM timeline_sessions 
                 WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                 AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'averageEventsPerUser', COALESCE(
                (SELECT AVG(event_count)::INTEGER 
                 FROM (SELECT COUNT(*) as event_count 
                       FROM timeline_events te 
                       JOIN timelines t ON te.timeline_id = t.id 
                       WHERE (p_user_id IS NULL OR t.user_id = p_user_id) 
                       GROUP BY t.id) t), 
                0
            ),
            'averageSessionDuration', COALESCE(
                (SELECT AVG(duration) 
                 FROM timeline_sessions 
                 WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                 AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'satisfactionScore', 4.2
        ),
        jsonb_build_object(
            'averageConfidence', COALESCE(AVG(confidence), 0),
            'averageRelevance', COALESCE(AVG(relevance), 0),
            'averageAccuracy', COALESCE(AVG((metadata->>'accuracy')::DECIMAL), 0),
            'averageCompleteness', COALESCE(AVG((metadata->>'completeness')::DECIMAL), 0),
            'extractionSuccessRate', COALESCE(AVG((metadata->>'confidence')::DECIMAL), 0)
        ),
        jsonb_build_object(
            'timelineGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM timelines 
                WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            ),
            'eventGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM timeline_events te 
                JOIN timelines t ON te.timeline_id = t.id 
                WHERE (p_user_id IS NULL OR t.user_id = p_user_id) 
                AND DATE(te.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', te.created_at) 
                ORDER BY DATE_TRUNC('month', te.created_at)
            ),
            'typeTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT type),
                    ARRAY_AGG(COUNT(*))
                )
                FROM timeline_events te 
                JOIN timelines t ON te.timeline_id = t.id 
                WHERE (p_user_id IS NULL OR t.user_id = p_user_id) 
                AND DATE(te.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY type
            ),
            'categoryTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT category),
                    ARRAY_AGG(COUNT(*))
                )
                FROM timeline_events te 
                JOIN timelines t ON te.timeline_id = t.id 
                WHERE (p_user_id IS NULL OR t.user_id = p_user_id) 
                AND DATE(te.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY category
            )
        )
    FROM timeline_statistics
    WHERE (p_user_id IS NULL OR user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les templates de timeline par défaut
CREATE OR REPLACE FUNCTION create_default_timeline_templates()
RETURNS VOID AS $$
BEGIN
    INSERT INTO timeline_templates (
        name,
        description,
        type,
        prompt,
        settings,
        is_default,
        is_active
    ) VALUES 
        ('Timeline Historique', 'Template pour créer des timelines historiques avec événements chronologiques', 
         'historical',
         'Extrais les événements historiques importants avec dates précises, lieux, participants et contexte. Organise-les chronologiquement et identifie les relations causales entre les événements.',
         '{"maxEvents": 20, "dateRange": {"isDynamic": false, "period": "year"}, "importance": {"includeLow": true, "includeMedium": true, "includeHigh": true, "includeCritical": true}, "visualization": {"layout": "horizontal", "theme": "auto"}}',
         true, true),
        ('Timeline Projet', 'Template pour les timelines de gestion de projet', 
         'project',
         'Extrais les phases du projet, jalons, réunions, décisions et livrables. Organise-les par phases et identifie les dépendances et relations entre les tâches.',
         '{"maxEvents": 15, "dateRange": {"isDynamic": false, "period": "month"}, "importance": {"includeLow": false, "includeMedium": true, "includeHigh": true, "includeCritical": true}, "visualization": {"layout": "gantt", "theme": "auto"}}',
         false, true),
        ('Timeline Biographique', 'Template pour les timelines biographiques', 
         'biographical',
         'Extrais les événements de vie importants: naissance, éducation, carrière, réalisations, relations. Organise-les chronologiquement avec contexte personnel et professionnel.',
         '{"maxEvents": 25, "dateRange": {"isDynamic": false, "period": "year"}, "importance": {"includeLow": true, "includeMedium": true, "includeHigh": true, "includeCritical": true}, "visualization": {"layout": "vertical", "theme": "auto"}}',
         false, true),
        ('Timeline Processus', 'Template pour les timelines de processus et workflows', 
         'process',
         'Extrais les étapes du processus, points de décision, validations et livrables. Organise-les séquentiellement avec indication des durées et dépendances.',
         '{"maxEvents": 12, "dateRange": {"isDynamic": false, "period": "week"}, "importance": {"includeLow": false, "includeMedium": true, "includeHigh": true, "includeCritical": true}, "visualization": {"layout": "horizontal", "theme": "auto"}}',
         false, true)
    ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        type = EXCLUDED.type,
        prompt = EXCLUDED.prompt,
        settings = EXCLUDED.settings,
        is_default = EXCLUDED.is_default,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_timeline_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO timeline_statistics (
        date,
        user_id,
        total_timelines,
        published_timelines,
        draft_timelines,
        total_events,
        average_events_per_timeline,
        most_active_types,
        most_active_categories,
        top_performing_timelines,
        user_engagement,
        content_quality,
        trends
    )
    SELECT 
        p_date,
        t.user_id,
        COUNT(*) as total_timelines,
        COUNT(*) FILTER (WHERE t.status = 'published') as published_timelines,
        COUNT(*) FILTER (WHERE t.status = 'draft') as draft_timelines,
        COALESCE(event_counts.event_count, 0) as total_events,
        COALESCE(event_counts.event_count::DECIMAL / NULLIF(COUNT(*), 0), 0) as average_events_per_timeline,
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT type),
            ARRAY_AGG(COUNT(*))
        ) FROM timeline_events te JOIN timelines t2 ON te.timeline_id = t2.id WHERE t2.user_id = t.user_id AND DATE(te.created_at) = p_date GROUP BY type),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT category),
            ARRAY_AGG(COUNT(*))
        ) FROM timeline_events te JOIN timelines t2 ON te.timeline_id = t2.id WHERE t2.user_id = t.user_id AND DATE(te.created_at) = p_date GROUP BY category),
        (SELECT jsonb_agg(
            jsonb_build_object(
                'timelineId', t2.id,
                'title', t2.title,
                'viewCount', (SELECT COUNT(*) FROM timeline_sessions ts WHERE ts.timeline_id = t2.id AND DATE(ts.start_time) = p_date),
                'averageRating', 4.5,
                'eventCount', (SELECT COUNT(*) FROM timeline_events te WHERE te.timeline_id = t2.id)
            )
        ) FROM timelines t2 WHERE t2.user_id = t.user_id AND DATE(t2.created_at) = p_date ORDER BY (SELECT COUNT(*) FROM timeline_sessions ts WHERE ts.timeline_id = t2.id AND DATE(ts.start_time) = p_date) DESC LIMIT 10),
        jsonb_build_object(
            'totalUsers', 1,
            'activeUsers', CASE WHEN DATE(t.updated_at) >= p_date - INTERVAL '7 days' THEN 1 ELSE 0 END,
            'averageTimelinesPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) 
                 FROM timeline_sessions 
                 WHERE user_id = t.user_id AND DATE(start_time) >= p_date - INTERVAL '7 days'), 
                0
            ),
            'averageEventsPerUser', COALESCE(
                (SELECT AVG(event_count)::INTEGER 
                 FROM (SELECT COUNT(*) as event_count 
                       FROM timeline_events te 
                       JOIN timelines t2 ON te.timeline_id = t2.id 
                       WHERE t2.user_id = t.user_id 
                       GROUP BY t2.id) t), 
                0
            ),
            'averageSessionDuration', COALESCE(
                (SELECT AVG(duration) 
                 FROM timeline_sessions 
                 WHERE user_id = t.user_id AND DATE(start_time) >= p_date - INTERVAL '7 days'), 
                0
            ),
            'satisfactionScore', 4.2
        ),
        jsonb_build_object(
            'averageConfidence', COALESCE(AVG(confidence), 0),
            'averageRelevance', COALESCE(AVG(relevance), 0),
            'averageAccuracy', COALESCE(AVG((metadata->>'accuracy')::DECIMAL), 0),
            'averageCompleteness', COALESCE(AVG((metadata->>'completeness')::DECIMAL), 0),
            'extractionSuccessRate', COALESCE(AVG((metadata->>'confidence')::DECIMAL), 0)
        ),
        jsonb_build_object(
            'timelineGrowth', ARRAY(SELECT COUNT(*) FROM timelines WHERE user_id = t.user_id AND DATE(created_at) >= p_date - INTERVAL '12 months' GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)),
            'eventGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM timeline_events te 
                JOIN timelines t2 ON te.timeline_id = t2.id 
                WHERE t2.user_id = t.user_id AND DATE(te.created_at) >= p_date - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', te.created_at) 
                ORDER BY DATE_TRUNC('month', te.created_at)
            ),
            'typeTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT type),
                    ARRAY_AGG(COUNT(*))
                )
                FROM timeline_events te 
                JOIN timelines t2 ON te.timeline_id = t2.id 
                WHERE t2.user_id = t.user_id AND DATE(te.created_at) >= p_date - INTERVAL '12 months' 
                GROUP BY type
            ),
            'categoryTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT category),
                    ARRAY_AGG(COUNT(*))
                )
                FROM timeline_events te 
                JOIN timelines t2 ON te.timeline_id = t2.id 
                WHERE t2.user_id = t.user_id AND DATE(te.created_at) >= p_date - INTERVAL '12 months' 
                GROUP BY category
            )
        )
    FROM timelines t
    LEFT JOIN (
        SELECT timeline_id, COUNT(*) as event_count
        FROM timeline_events te
        JOIN timelines t2 ON te.timeline_id = t2.id
        WHERE DATE(te.created_at) = p_date
        GROUP BY timeline_id
    ) event_counts ON t.id = event_counts.timeline_id
    WHERE DATE(t.created_at) = p_date
    GROUP BY t.user_id, event_counts.event_count
    ON CONFLICT (date, user_id) DO UPDATE SET
        total_timelines = EXCLUDED.total_timelines,
        published_timelines = EXCLUDED.published_timelines,
        draft_timelines = EXCLUDED.draft_timelines,
        total_events = EXCLUDED.total_events,
        average_events_per_timeline = EXCLUDED.average_events_per_timeline,
        most_active_types = EXCLUDED.most_active_types,
        most_active_categories = EXCLUDED.most_active_categories,
        top_performing_timelines = EXCLUDED.top_performing_timelines,
        user_engagement = EXCLUDED.user_engagement,
        content_quality = EXCLUDED.content_quality,
        trends = EXCLUDED.trends,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE timelines IS 'Timelines chronologiques avec événements extraits automatiquement';
COMMENT ON TABLE timeline_events IS 'Événements individuels des timelines avec métadonnées et interactions';
COMMENT ON TABLE timeline_event_sources IS 'Sources des événements avec positions et confiance';
COMMENT ON TABLE timeline_event_media IS 'Médias associés aux événements (images, vidéos, documents)';
COMMENT ON TABLE timeline_event_interactions IS 'Interactions des utilisateurs avec les événements';
COMMENT ON TABLE timeline_templates IS 'Templates de génération de timeline avec prompts configurables';
COMMENT ON TABLE timeline_exports IS 'Exports de timelines dans différents formats';
COMMENT ON TABLE timeline_statistics IS 'Statistiques d''utilisation et de performance des timelines';
COMMENT ON TABLE timeline_sessions IS 'Sessions de consultation de timeline avec tracking utilisateur';
COMMENT ON TABLE timeline_event_connections IS 'Connexions et relations entre événements';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN timelines.events IS 'Événements de la timeline [{id, title, description, date, startDate, endDate, time, duration, location, participants, category, subcategory, importance, status, type, sources, media, tags, keywords, relatedEvents, metadata, position, style, interactions, createdAt, updatedAt}]';
COMMENT ON COLUMN timelines.settings IS 'Paramètres de la timeline {maxEvents, dateRange, categories, importance, status, sortBy, sortOrder, grouping, filtering, visualization, export, personalization}';
COMMENT ON COLUMN timelines.metadata IS 'Métadonnées de la timeline {totalEvents, dateRange, categories, types, importance, status, locations, participants, quality, extraction, version, lastUpdated, customFields}';
COMMENT ON COLUMN timelines.analytics IS 'Analytics d''utilisation {totalViews, uniqueViews, averageSessionDuration, mostViewedEvents, userEngagement, temporalPatterns, geographicPatterns, contentPerformance, trends}';
COMMENT ON COLUMN timeline_events.metadata IS 'Métadonnées de l''événement {extractionMethod, confidence, relevance, accuracy, completeness, processingTime, model, temperature, tokensUsed, language, sentiment, complexity, readability, wordCount, characterCount, sentenceCount, paragraphCount, dateExtraction, customFields}';
COMMENT ON COLUMN timeline_events.position IS 'Position de l''événement {x, y, width, height, lane, zIndex, connections}';
COMMENT ON COLUMN timeline_events.style IS 'Style visuel de l''événement {color, backgroundColor, borderColor, borderWidth, borderStyle, borderRadius, opacity, fontSize, fontFamily, fontWeight, fontStyle, icon, iconSize, iconColor, shadow, animation}';
COMMENT ON COLUMN timeline_events.metadata IS 'Métadonnées de l''événement {extractionMethod, confidence, relevance, accuracy, completeness, processingTime, model, temperature, tokensUsed, language, sentiment, complexity, readability, wordCount, characterCount, sentenceCount, paragraphCount, dateExtraction, customFields}';
COMMENT ON COLUMN timeline_statistics.trends IS 'Tendances d''utilisation {timelineGrowth, eventGrowth, typeTrends, categoryTrends}';
COMMENT ON COLUMN timeline_statistics.user_engagement IS 'Engagement utilisateur {totalUsers, activeUsers, averageTimelinesPerUser, averageEventsPerUser, averageSessionDuration, satisfactionScore}';
COMMENT ON COLUMN timeline_statistics.content_quality IS 'Qualité du contenu {averageConfidence, averageRelevance, averageAccuracy, averageCompleteness, extractionSuccessRate}';

-- Créer les données par défaut
SELECT create_default_timeline_templates();
