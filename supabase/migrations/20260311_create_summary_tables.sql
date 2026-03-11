-- Migration: Création des tables pour les résumés personnalisables
-- Date: 11 mars 2026
-- Description: Tables pour gérer les résumés personnalisés avec différentes longueurs et styles

-- Table principale des résumés
CREATE TABLE IF NOT EXISTS summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'executive' CHECK (type IN ('executive', 'technical', 'academic', 'creative', 'legal', 'medical', 'business', 'educational', 'news', 'research', 'custom')),
    style VARCHAR(50) DEFAULT 'professional' CHECK (style IN ('formal', 'casual', 'professional', 'academic', 'creative', 'technical', 'narrative', 'bullet_points', 'outline', 'custom')),
    length VARCHAR(20) DEFAULT 'medium' CHECK (length IN ('very_short', 'short', 'medium', 'long', 'very_long', 'custom')),
    content TEXT NOT NULL,
    key_points JSONB DEFAULT '[]', -- [{id, title, content, importance, category, supportingEvidence, relatedPoints, position, metadata, createdAt}]
    metadata JSONB DEFAULT '{}', -- {totalWords, totalCharacters, totalSentences, totalParagraphs, averageSentenceLength, averageWordLength, readabilityScore, complexityScore, cohesionScore, relevanceScore, completeness, accuracy, originalDocumentLength, compressionRatio, keyPointsCount, evidenceCount, processingTime, model, temperature, tokensUsed, language, sentiment, topics, entities, quality, extraction, version, lastUpdated, customFields}
    settings JSONB DEFAULT '{}', -- {maxLength, minLength, style, type, language, targetAudience, includeKeyPoints, includeEvidence, includeEntities, includeTopics, includeStatistics, tone, structure, content, formatting, personalization}
    analytics JSONB DEFAULT '{}', -- {totalViews, uniqueViews, averageReadingTime, averageScrollDepth, mostViewedSections, userEngagement, readingPatterns, contentPerformance, trends}
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'reviewing', 'approved', 'published', 'archived', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Table des points clés des résumés
CREATE TABLE IF NOT EXISTS summary_key_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_id UUID REFERENCES summaries(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    importance VARCHAR(20) DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(100),
    supporting_evidence JSONB DEFAULT '[]', -- [{id, type, content, source, confidence, relevance, position, metadata}]
    related_points TEXT[] DEFAULT '{}',
    position INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}', -- {extractionMethod, confidence, relevance, accuracy, completeness, processingTime, model, temperature, tokensUsed, language, sentiment, complexity, readability, wordCount, characterCount, customFields}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des preuves des points clés
CREATE TABLE IF NOT EXISTS summary_key_point_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_point_id UUID REFERENCES summary_key_points(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('quote', 'statistic', 'example', 'reference', 'data_point')),
    content TEXT NOT NULL,
    source VARCHAR(255),
    confidence DECIMAL(3,2) DEFAULT 0.00 CHECK (confidence >= 0 AND confidence <= 1),
    relevance DECIMAL(3,2) DEFAULT 0.00 CHECK (relevance >= 0 AND relevance <= 1),
    position JSONB DEFAULT '{}', -- {start, end, pageNumber}
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des entités extraites
CREATE TABLE IF NOT EXISTS summary_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_id UUID REFERENCES summaries(id) ON DELETE CASCADE,
    text VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('person', 'organization', 'location', 'date', 'product', 'concept', 'event', 'number', 'custom')),
    confidence DECIMAL(3,2) DEFAULT 0.00 CHECK (confidence >= 0 AND confidence <= 1),
    position JSONB DEFAULT '{}', -- {start, end}
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des templates de résumés
CREATE TABLE IF NOT EXISTS summary_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('executive', 'technical', 'academic', 'creative', 'legal', 'medical', 'business', 'educational', 'news', 'research', 'custom')),
    style VARCHAR(50) NOT NULL CHECK (style IN ('formal', 'casual', 'professional', 'academic', 'creative', 'technical', 'narrative', 'bullet_points', 'outline', 'custom')),
    length VARCHAR(20) NOT NULL CHECK (length IN ('very_short', 'short', 'medium', 'long', 'very_long', 'custom')),
    prompt TEXT NOT NULL,
    settings JSONB DEFAULT '{}', -- {maxLength, minLength, style, type, language, targetAudience, includeKeyPoints, includeEvidence, includeEntities, includeTopics, includeStatistics, tone, structure, content, formatting, personalization}
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exports de résumés
CREATE TABLE IF NOT EXISTS summary_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_id UUID REFERENCES summaries(id) ON DELETE CASCADE,
    format VARCHAR(10) NOT NULL CHECK (format IN ('json', 'txt', 'md', 'html', 'pdf', 'docx', 'epub')),
    options JSONB DEFAULT '{}', -- {includeMetadata, includeKeyPoints, includeEvidence, includeAnalytics, formatting, customOptions}
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT DEFAULT 0,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des statistiques de résumés
CREATE TABLE IF NOT EXISTS summary_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_summaries INTEGER DEFAULT 0,
    published_summaries INTEGER DEFAULT 0,
    draft_summaries INTEGER DEFAULT 0,
    total_words INTEGER DEFAULT 0,
    average_words_per_summary DECIMAL(5,2) DEFAULT 0.00,
    most_active_types JSONB DEFAULT '{}', -- {type: count}
    most_active_styles JSONB DEFAULT '{}', -- {style: count}
    most_active_lengths JSONB DEFAULT '{}', -- {length: count}
    top_performing_summaries JSONB DEFAULT '[]', -- [{summaryId, title, viewCount, averageRating, wordCount}]
    user_engagement JSONB DEFAULT '{}', -- {totalUsers, activeUsers, averageSummariesPerUser, averageWordsPerUser, averageReadingTime, satisfactionScore}
    content_quality JSONB DEFAULT '{}', -- {averageClarity, averageCoherence, averageConciseness, averageCompleteness, averageAccuracy, averageRelevance, extractionSuccessRate}
    trends JSONB DEFAULT '{}', -- {summaryGrowth, wordGrowth, typeTrends, styleTrends}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, user_id)
);

-- Table des sessions de lecture de résumés
CREATE TABLE IF NOT EXISTS summary_reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_id UUID REFERENCES summaries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- en secondes
    reading_speed INTEGER, -- mots par minute
    scroll_depth DECIMAL(3,2) DEFAULT 0.00, -- pourcentage du contenu lu
    sections_viewed TEXT[] DEFAULT '{}',
    key_points_viewed TEXT[] DEFAULT '{}',
    interactions_count INTEGER DEFAULT 0,
    device VARCHAR(50),
    browser VARCHAR(50),
    location VARCHAR(255),
    session_data JSONB DEFAULT '{}', -- {readingPattern, skipSections, focusAreas, engagementMetrics}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des interactions avec les résumés
CREATE TABLE IF NOT EXISTS summary_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_id UUID REFERENCES summaries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('view', 'read', 'share', 'comment', 'like', 'bookmark', 'rate', 'highlight', 'copy')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}', -- {position, duration, rating, highlightText, copiedText, shareMethod}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_summaries_document_id ON summaries(document_id);
CREATE INDEX idx_summaries_user_id ON summaries(user_id);
CREATE INDEX idx_summaries_type ON summaries(type);
CREATE INDEX idx_summaries_style ON summaries(style);
CREATE INDEX idx_summaries_length ON summaries(length);
CREATE INDEX idx_summaries_status ON summaries(status);
CREATE INDEX idx_summaries_created_at ON summaries(created_at DESC);
CREATE INDEX idx_summaries_updated_at ON summaries(updated_at DESC);
CREATE INDEX idx_summaries_published_at ON summaries(published_at DESC);

CREATE INDEX idx_summary_key_points_summary_id ON summary_key_points(summary_id);
CREATE INDEX idx_summary_key_points_category ON summary_key_points(category);
CREATE INDEX idx_summary_key_points_importance ON summary_key_points(importance);
CREATE INDEX idx_summary_key_points_position ON summary_key_points(position);
CREATE INDEX idx_summary_key_points_created_at ON summary_key_points(created_at DESC);

CREATE INDEX idx_summary_key_point_evidence_key_point_id ON summary_key_point_evidence(key_point_id);
CREATE INDEX idx_summary_key_point_evidence_type ON summary_key_point_evidence(type);
CREATE INDEX idx_summary_key_point_evidence_confidence ON summary_key_point_evidence(confidence DESC);
CREATE INDEX idx_summary_key_point_evidence_relevance ON summary_key_point_evidence(relevance DESC);

CREATE INDEX idx_summary_entities_summary_id ON summary_entities(summary_id);
CREATE INDEX idx_summary_entities_type ON summary_entities(type);
CREATE INDEX idx_summary_entities_confidence ON summary_entities(confidence DESC);

CREATE INDEX idx_summary_templates_type ON summary_templates(type);
CREATE INDEX idx_summary_templates_style ON summary_templates(style);
CREATE INDEX idx_summary_templates_length ON summary_templates(length);
CREATE INDEX idx_summary_templates_is_default ON summary_templates(is_default);
CREATE INDEX idx_summary_templates_is_active ON summary_templates(is_active);
CREATE INDEX idx_summary_templates_usage_count ON summary_templates(usage_count DESC);

CREATE INDEX idx_summary_exports_summary_id ON summary_exports(summary_id);
CREATE INDEX idx_summary_exports_format ON summary_exports(format);
CREATE INDEX idx_summary_exports_status ON summary_exports(status);
CREATE INDEX idx_summary_exports_created_at ON summary_exports(created_at DESC);

CREATE INDEX idx_summary_statistics_date ON summary_statistics(date);
CREATE INDEX idx_summary_statistics_user_id ON summary_statistics(user_id);
CREATE INDEX idx_summary_statistics_created_at ON summary_statistics(created_at DESC);

CREATE INDEX idx_summary_reading_sessions_summary_id ON summary_reading_sessions(summary_id);
CREATE INDEX idx_summary_reading_sessions_user_id ON summary_reading_sessions(user_id);
CREATE INDEX idx_summary_reading_sessions_session_id ON summary_reading_sessions(session_id);
CREATE INDEX idx_summary_reading_sessions_start_time ON summary_reading_sessions(start_time DESC);
CREATE INDEX idx_summary_reading_sessions_duration ON summary_reading_sessions(duration DESC);
CREATE INDEX idx_summary_reading_sessions_scroll_depth ON summary_reading_sessions(scroll_depth DESC);

CREATE INDEX idx_summary_interactions_summary_id ON summary_interactions(summary_id);
CREATE INDEX idx_summary_interactions_user_id ON summary_interactions(user_id);
CREATE INDEX idx_summary_interactions_type ON summary_interactions(type);
CREATE INDEX idx_summary_interactions_timestamp ON summary_interactions(timestamp DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_summaries_updated_at 
    BEFORE UPDATE ON summaries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_summary_templates_updated_at 
    BEFORE UPDATE ON summary_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_summary_statistics_updated_at 
    BEFORE UPDATE ON summary_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_summary_reading_sessions_updated_at 
    BEFORE UPDATE ON summary_reading_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_summary_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO summary_statistics (
        date,
        user_id,
        total_summaries,
        published_summaries,
        draft_summaries,
        total_words,
        average_words_per_summary,
        most_active_types,
        most_active_styles,
        most_active_lengths,
        top_performing_summaries,
        user_engagement,
        content_quality,
        trends
    )
    SELECT 
        CURRENT_DATE,
        NEW.user_id,
        (SELECT COUNT(*) FROM summaries WHERE user_id = NEW.user_id),
        (SELECT COUNT(*) FROM summaries WHERE user_id = NEW.user_id AND status = 'published'),
        (SELECT COUNT(*) FROM summaries WHERE user_id = NEW.user_id AND status = 'draft'),
        COALESCE(
            (SELECT SUM((metadata->>'totalWords')::INTEGER) 
             FROM summaries 
             WHERE user_id = NEW.user_id), 
            0
        ),
        COALESCE(
            (SELECT AVG((metadata->>'totalWords')::INTEGER) 
             FROM summaries 
             WHERE user_id = NEW.user_id), 
            0
        ),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT type),
            ARRAY_AGG(COUNT(*))
        ) FROM summaries s WHERE s.user_id = NEW.user_id GROUP BY type),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT style),
            ARRAY_AGG(COUNT(*))
        ) FROM summaries s WHERE s.user_id = NEW.user_id GROUP BY style),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT length),
            ARRAY_AGG(COUNT(*))
        ) FROM summaries s WHERE s.user_id = NEW.user_id GROUP BY length),
        (SELECT jsonb_agg(
            jsonb_build_object(
                'summaryId', s.id,
                'title', s.title,
                'viewCount', (SELECT COUNT(*) FROM summary_interactions si WHERE si.summary_id = s.id AND si.type = 'view'),
                'averageRating', COALESCE(
                    (SELECT AVG((metadata->>'rating')::DECIMAL) 
                     FROM summary_interactions si 
                     WHERE si.summary_id = s.id AND si.type = 'rate'), 
                    0
                ),
                'wordCount', (metadata->>'totalWords')::INTEGER
            )
        ) FROM summaries s WHERE s.user_id = NEW.user_id ORDER BY (SELECT COUNT(*) FROM summary_interactions si WHERE si.summary_id = s.id AND si.type = 'view') DESC LIMIT 10),
        jsonb_build_object(
            'totalUsers', 1,
            'activeUsers', CASE WHEN DATE(s.updated_at) >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END,
            'averageSummariesPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) 
                 FROM summary_reading_sessions 
                 WHERE user_id = NEW.user_id AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'averageWordsPerUser', COALESCE(
                (SELECT AVG((metadata->>'totalWords')::INTEGER) 
                 FROM summaries 
                 WHERE user_id = NEW.user_id), 
                0
            ),
            'averageReadingTime', COALESCE(
                (SELECT AVG(duration) 
                 FROM summary_reading_sessions 
                 WHERE user_id = NEW.user_id AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'satisfactionScore', COALESCE(
                (SELECT AVG((metadata->>'rating')::DECIMAL) 
                 FROM summary_interactions si 
                 WHERE si.user_id = NEW.user_id AND si.type = 'rate'), 
                0
            )
        ),
        jsonb_build_object(
            'averageClarity', COALESCE(AVG((metadata->>'readabilityScore')::DECIMAL), 0),
            'averageCoherence', COALESCE(AVG((metadata->>'cohesionScore')::DECIMAL), 0),
            'averageConciseness', COALESCE(AVG((metadata->>'compressionRatio')::DECIMAL), 0),
            'averageCompleteness', COALESCE(AVG((metadata->>'completeness')::DECIMAL), 0),
            'averageAccuracy', COALESCE(AVG((metadata->>'accuracy')::DECIMAL), 0),
            'averageRelevance', COALESCE(AVG((metadata->>'relevanceScore')::DECIMAL), 0),
            'extractionSuccessRate', COALESCE(AVG((metadata->>'relevanceScore')::DECIMAL), 0)
        ),
        jsonb_build_object(
            'summaryGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM summaries 
                WHERE user_id = NEW.user_id AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            ),
            'wordGrowth', ARRAY(
                SELECT SUM((metadata->>'totalWords')::INTEGER) 
                FROM summaries 
                WHERE user_id = NEW.user_id AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            ),
            'typeTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT type),
                    ARRAY_AGG(COUNT(*))
                )
                FROM summaries s 
                WHERE s.user_id = NEW.user_id AND DATE(s.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY type
            ),
            'styleTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT style),
                    ARRAY_AGG(COUNT(*))
                )
                FROM summaries s 
                WHERE s.user_id = NEW.user_id AND DATE(s.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY style
            )
        )
    ON CONFLICT (date, user_id) DO UPDATE SET
        total_summaries = EXCLUDED.total_summaries,
        published_summaries = EXCLUDED.published_summaries,
        draft_summaries = EXCLUDED.draft_summaries,
        total_words = EXCLUDED.total_words,
        average_words_per_summary = EXCLUDED.average_words_per_summary,
        most_active_types = EXCLUDED.most_active_types,
        most_active_styles = EXCLUDED.most_active_styles,
        most_active_lengths = EXCLUDED.most_active_lengths,
        top_performing_summaries = EXCLUDED.top_performing_summaries,
        user_engagement = EXCLUDED.user_engagement,
        content_quality = EXCLUDED.content_quality,
        trends = EXCLUDED.trends,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_summary_statistics_summaries
    AFTER INSERT OR UPDATE OR DELETE ON summaries
    FOR EACH ROW EXECUTE FUNCTION update_summary_statistics();

CREATE TRIGGER trigger_update_summary_statistics_interactions
    AFTER INSERT ON summary_interactions
    FOR EACH ROW EXECUTE FUNCTION update_summary_statistics();

-- Politiques RLS pour les résumés
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own summaries" ON summaries
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view published summaries" ON summaries
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can view all summaries" ON summaries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les points clés
ALTER TABLE summary_key_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view key points of accessible summaries" ON summary_key_points
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM summaries s
            WHERE s.id = summary_id 
            AND (s.user_id = auth.uid() OR s.status = 'published')
        )
    );

CREATE POLICY "Admins can view all summary key points" ON summary_key_points
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les preuves
ALTER TABLE summary_key_point_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view evidence of accessible key points" ON summary_key_point_evidence
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM summary_key_points skp
            JOIN summaries s ON skp.summary_id = s.id
            WHERE skp.id = key_point_id 
            AND (s.user_id = auth.uid() OR s.status = 'published')
        )
    );

-- Politiques RLS pour les entités
ALTER TABLE summary_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view entities of accessible summaries" ON summary_entities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM summaries s
            WHERE s.id = summary_id 
            AND (s.user_id = auth.uid() OR s.status = 'published')
        )
    );

-- Politiques RLS pour les templates
ALTER TABLE summary_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active summary templates" ON summary_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage summary templates" ON summary_templates
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
ALTER TABLE summary_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own summary exports" ON summary_exports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM summaries s
            WHERE s.id = summary_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all summary exports" ON summary_exports
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
ALTER TABLE summary_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summary statistics" ON summary_statistics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all summary statistics" ON summary_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les sessions de lecture
ALTER TABLE summary_reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reading sessions" ON summary_reading_sessions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all reading sessions" ON summary_reading_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les interactions
ALTER TABLE summary_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own interactions" ON summary_interactions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all interactions" ON summary_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour les résumés

-- Fonction pour obtenir les statistiques des résumés
CREATE OR REPLACE FUNCTION get_summary_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_summaries BIGINT,
    published_summaries BIGINT,
    draft_summaries BIGINT,
    total_words BIGINT,
    average_words_per_summary DECIMAL(5,2),
    most_active_types JSONB,
    most_active_styles JSONB,
    most_active_lengths JSONB,
    top_performing_summaries JSONB,
    user_engagement JSONB,
    content_quality JSONB,
    trends JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(total_summaries), 0),
        COALESCE(SUM(published_summaries), 0),
        COALESCE(SUM(draft_summaries), 0),
        COALESCE(SUM(total_words), 0),
        COALESCE(AVG(average_words_per_summary), 0),
        (SELECT jsonb_agg(most_active_types) FROM (
            SELECT jsonb_build_object(
                'type', type,
                'count', count
            ) as most_active_types
            FROM (
                SELECT 
                    type,
                    COUNT(*) as count
                FROM summaries s 
                WHERE (p_user_id IS NULL OR s.user_id = p_user_id) 
                GROUP BY type
            ) t
        ) sub),
        (SELECT jsonb_agg(most_active_styles) FROM (
            SELECT jsonb_build_object(
                'style', style,
                'count', count
            ) as most_active_styles
            FROM (
                SELECT 
                    style,
                    COUNT(*) as count
                FROM summaries s 
                WHERE (p_user_id IS NULL OR s.user_id = p_user_id) 
                GROUP BY style
            ) t
        ) sub),
        (SELECT jsonb_agg(most_active_lengths) FROM (
            SELECT jsonb_build_object(
                'length', length,
                'count', count
            ) as most_active_lengths
            FROM (
                SELECT 
                    length,
                    COUNT(*) as count
                FROM summaries s 
                WHERE (p_user_id IS NULL OR s.user_id = p_user_id) 
                GROUP BY length
            ) t
        ) sub),
        (SELECT jsonb_agg(top_performing_summaries) FROM (
            SELECT jsonb_build_object(
                'summaryId', s.id,
                'title', s.title,
                'viewCount', (SELECT COUNT(*) FROM summary_interactions si WHERE si.summary_id = s.id AND si.type = 'view'),
                'averageRating', COALESCE(
                    (SELECT AVG((metadata->>'rating')::DECIMAL) 
                     FROM summary_interactions si 
                     WHERE si.summary_id = s.id AND si.type = 'rate'), 
                    0
                ),
                'wordCount', (metadata->>'totalWords')::INTEGER
            ) as top_performing_summaries
            FROM (
                SELECT 
                    s.id,
                    s.title,
                    s.metadata
                FROM summaries s 
                WHERE (p_user_id IS NULL OR s.user_id = p_user_id) 
                ORDER BY (SELECT COUNT(*) FROM summary_interactions si WHERE si.summary_id = s.id AND si.type = 'view') DESC 
                LIMIT 10
            ) t
        ) sub),
        jsonb_build_object(
            'totalUsers', (SELECT COUNT(DISTINCT user_id) FROM summaries WHERE (p_user_id IS NULL OR user_id = p_user_id)),
            'activeUsers', (SELECT COUNT(DISTINCT user_id) FROM summaries WHERE (p_user_id IS NULL OR user_id = p_user_id) AND DATE(updated_at) >= CURRENT_DATE - INTERVAL '7 days'),
            'averageSummariesPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) 
                 FROM summary_reading_sessions 
                 WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                 AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'averageWordsPerUser', COALESCE(
                (SELECT AVG((metadata->>'totalWords')::INTEGER) 
                 FROM summaries 
                 WHERE (p_user_id IS NULL OR user_id = p_user_id)), 
                0
            ),
            'averageReadingTime', COALESCE(
                (SELECT AVG(duration) 
                 FROM summary_reading_sessions 
                 WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                 AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'satisfactionScore', COALESCE(
                (SELECT AVG((metadata->>'rating')::DECIMAL) 
                 FROM summary_interactions si 
                 WHERE (p_user_id IS NULL OR si.user_id = p_user_id) AND si.type = 'rate'), 
                0
            )
        ),
        jsonb_build_object(
            'averageClarity', COALESCE(AVG((metadata->>'readabilityScore')::DECIMAL), 0),
            'averageCoherence', COALESCE(AVG((metadata->>'cohesionScore')::DECIMAL), 0),
            'averageConciseness', COALESCE(AVG((metadata->>'compressionRatio')::DECIMAL), 0),
            'averageCompleteness', COALESCE(AVG((metadata->>'completeness')::DECIMAL), 0),
            'averageAccuracy', COALESCE(AVG((metadata->>'accuracy')::DECIMAL), 0),
            'averageRelevance', COALESCE(AVG((metadata->>'relevanceScore')::DECIMAL), 0),
            'extractionSuccessRate', COALESCE(AVG((metadata->>'relevanceScore')::DECIMAL), 0)
        ),
        jsonb_build_object(
            'summaryGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM summaries 
                WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            ),
            'wordGrowth', ARRAY(
                SELECT SUM((metadata->>'totalWords')::INTEGER) 
                FROM summaries 
                WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            ),
            'typeTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT type),
                    ARRAY_AGG(COUNT(*))
                )
                FROM summaries s 
                WHERE (p_user_id IS NULL OR s.user_id = p_user_id) 
                AND DATE(s.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY type
            ),
            'styleTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT style),
                    ARRAY_AGG(COUNT(*))
                )
                FROM summaries s 
                WHERE (p_user_id IS NULL OR s.user_id = p_user_id) 
                AND DATE(s.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY style
            )
        )
    FROM summary_statistics
    WHERE (p_user_id IS NULL OR user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les templates de résumé par défaut
CREATE OR REPLACE FUNCTION create_default_summary_templates()
RETURNS VOID AS $$
BEGIN
    INSERT INTO summary_templates (
        name,
        description,
        type,
        style,
        length,
        prompt,
        settings,
        is_default,
        is_active
    ) VALUES 
        ('Résumé Exécutif', 'Template pour les résumés exécutifs concis et stratégiques', 
         'executive', 'professional', 'short',
         'Génère un résumé exécutif concis avec les points clés, recommandations et implications stratégiques. Cible les décideurs et les gestionnaires.',
         '{"maxLength": 250, "minLength": 100, "targetAudience": {"level": "advanced", "background": "management"}, "includeKeyPoints": true, "includeRecommendations": true, "tone": {"formality": "formal", "confidence": "high"}}',
         true, true),
        ('Résumé Technique', 'Template pour les résumés techniques détaillés', 
         'technical', 'technical', 'medium',
         'Génère un résumé technique avec détails sur les méthodes, spécifications et implications techniques. Cible les professionnels techniques.',
         '{"maxLength": 500, "minLength": 250, "targetAudience": {"level": "expert", "background": "technical"}, "includeKeyPoints": true, "includeEvidence": true, "tone": {"formality": "formal", "technicality": "high"}}',
         false, true),
        ('Résumé Académique', 'Template pour les résumés académiques formels', 
         'academic', 'academic', 'long',
         'Génère un résumé académique avec méthodologie, résultats et implications de recherche. Cible les chercheurs et les universitaires.',
         '{"maxLength": 1000, "minLength": 500, "targetAudience": {"level": "expert", "background": "academic"}, "includeKeyPoints": true, "includeEvidence": true, "includeMethodology": true, "tone": {"formality": "very_formal", "objectivity": "objective"}}',
         false, true),
        ('Résumé Business', 'Template pour les résumés business orientés', 
         'business', 'professional', 'medium',
         'Génère un résumé business avec focus sur les implications commerciales et opportunités. Cible les professionnels du business.',
         '{"maxLength": 500, "minLength": 250, "targetAudience": {"level": "advanced", "background": "business"}, "includeKeyPoints": true, "includeRecommendations": true, "tone": {"formality": "formal", "confidence": "high"}}',
         false, true),
        ('Résumé Éducatif', 'Template pour les résumés éducatifs accessibles', 
         'educational', 'casual', 'medium',
         'Génère un résumé éducatif accessible avec objectifs d''apprentissage et applications pratiques. Cible les étudiants et les formateurs.',
         '{"maxLength": 500, "minLength": 250, "targetAudience": {"level": "intermediate", "background": "education"}, "includeKeyPoints": true, "includeExamples": true, "tone": {"formality": "neutral", "creativity": "medium"}}',
         false, true),
        ('Résumé Points', 'Template pour les résumés en points clés', 
         'executive', 'bullet_points', 'short',
         'Génère un résumé structuré en points clés pour une lecture rapide. Cible les lecteurs pressés.',
         '{"maxLength": 200, "minLength": 100, "targetAudience": {"level": "beginner", "background": "general"}, "includeKeyPoints": true, "structure": {"bulletPoints": true, "headings": false}, "tone": {"formality": "neutral"}}',
         false, true),
        ('Résumé Narratif', 'Template pour les résumés narratifs engageants', 
         'creative', 'narrative', 'medium',
         'Génère un résumé narratif engageant avec une progression logique. Cible les lecteurs préférant les histoires.',
         '{"maxLength": 500, "minLength": 250, "targetAudience": {"level": "intermediate", "background": "general"}, "includeKeyPoints": true, "tone": {"formality": "informal", "creativity": "high"}}',
         false, true)
    ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        type = EXCLUDED.type,
        style = EXCLUDED.style,
        length = EXCLUDED.length,
        prompt = EXCLUDED.prompt,
        settings = EXCLUDED.settings,
        is_default = EXCLUDED.is_default,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_summary_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO summary_statistics (
        date,
        user_id,
        total_summaries,
        published_summaries,
        draft_summaries,
        total_words,
        average_words_per_summary,
        most_active_types,
        most_active_styles,
        most_active_lengths,
        top_performing_summaries,
        user_engagement,
        content_quality,
        trends
    )
    SELECT 
        p_date,
        s.user_id,
        COUNT(*) as total_summaries,
        COUNT(*) FILTER (WHERE s.status = 'published') as published_summaries,
        COUNT(*) FILTER (WHERE s.status = 'draft') as draft_summaries,
        COALESCE(SUM((s.metadata->>'totalWords')::INTEGER), 0) as total_words,
        COALESCE(AVG((s.metadata->>'totalWords')::INTEGER), 0) as average_words_per_summary,
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT type),
            ARRAY_AGG(COUNT(*))
        ) FROM summaries s2 WHERE s2.user_id = s.user_id AND DATE(s2.created_at) = p_date GROUP BY type),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT style),
            ARRAY_AGG(COUNT(*))
        ) FROM summaries s2 WHERE s2.user_id = s.user_id AND DATE(s2.created_at) = p_date GROUP BY style),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT length),
            ARRAY_AGG(COUNT(*))
        ) FROM summaries s2 WHERE s2.user_id = s.user_id AND DATE(s2.created_at) = p_date GROUP BY length),
        (SELECT jsonb_agg(
            jsonb_build_object(
                'summaryId', s2.id,
                'title', s2.title,
                'viewCount', (SELECT COUNT(*) FROM summary_interactions si WHERE si.summary_id = s2.id AND si.type = 'view'),
                'averageRating', COALESCE(
                    (SELECT AVG((metadata->>'rating')::DECIMAL) 
                     FROM summary_interactions si 
                     WHERE si.summary_id = s2.id AND si.type = 'rate'), 
                    0
                ),
                'wordCount', (s2.metadata->>'totalWords')::INTEGER
            )
        ) FROM summaries s2 WHERE s2.user_id = s.user_id AND DATE(s2.created_at) = p_date ORDER BY (SELECT COUNT(*) FROM summary_interactions si WHERE si.summary_id = s2.id AND si.type = 'view') DESC LIMIT 10),
        jsonb_build_object(
            'totalUsers', 1,
            'activeUsers', CASE WHEN DATE(s.updated_at) >= p_date - INTERVAL '7 days' THEN 1 ELSE 0 END,
            'averageSummariesPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) 
                 FROM summary_reading_sessions 
                 WHERE user_id = s.user_id AND DATE(start_time) >= p_date - INTERVAL '7 days'), 
                0
            ),
            'averageWordsPerUser', COALESCE(
                (SELECT AVG((metadata->>'totalWords')::INTEGER) 
                 FROM summaries 
                 WHERE user_id = s.user_id), 
                0
            ),
            'averageReadingTime', COALESCE(
                (SELECT AVG(duration) 
                 FROM summary_reading_sessions 
                 WHERE user_id = s.user_id AND DATE(start_time) >= p_date - INTERVAL '7 days'), 
                0
            ),
            'satisfactionScore', COALESCE(
                (SELECT AVG((metadata->>'rating')::DECIMAL) 
                 FROM summary_interactions si 
                 WHERE si.user_id = s.user_id AND si.type = 'rate'), 
                0
            )
        ),
        jsonb_build_object(
            'averageClarity', COALESCE(AVG((s.metadata->>'readabilityScore')::DECIMAL), 0),
            'averageCoherence', COALESCE(AVG((s.metadata->>'cohesionScore')::DECIMAL), 0),
            'averageConciseness', COALESCE(AVG((s.metadata->>'compressionRatio')::DECIMAL), 0),
            'averageCompleteness', COALESCE(AVG((s.metadata->>'completeness')::DECIMAL), 0),
            'averageAccuracy', COALESCE(AVG((s.metadata->>'accuracy')::DECIMAL), 0),
            'averageRelevance', COALESCE(AVG((s.metadata->>'relevanceScore')::DECIMAL), 0),
            'extractionSuccessRate', COALESCE(AVG((s.metadata->>'relevanceScore')::DECIMAL), 0)
        ),
        jsonb_build_object(
            'summaryGrowth', ARRAY(SELECT COUNT(*) FROM summaries WHERE user_id = s.user_id AND DATE(created_at) >= p_date - INTERVAL '12 months' GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)),
            'wordGrowth', ARRAY(
                SELECT SUM((metadata->>'totalWords')::INTEGER) 
                FROM summaries 
                WHERE user_id = s.user_id AND DATE(created_at) >= p_date - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            ),
            'typeTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT type),
                    ARRAY_AGG(COUNT(*))
                )
                FROM summaries s2 
                WHERE s2.user_id = s.user_id AND DATE(s2.created_at) >= p_date - INTERVAL '12 months' 
                GROUP BY type
            ),
            'styleTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT style),
                    ARRAY_AGG(COUNT(*))
                )
                FROM summaries s2 
                WHERE s2.user_id = s.user_id AND DATE(s2.created_at) >= p_date - INTERVAL '12 months' 
                GROUP BY style
            )
        )
    FROM summaries s
    WHERE DATE(s.created_at) = p_date
    GROUP BY s.user_id
    ON CONFLICT (date, user_id) DO UPDATE SET
        total_summaries = EXCLUDED.total_summaries,
        published_summaries = EXCLUDED.published_summaries,
        draft_summaries = EXCLUDED.draft_summaries,
        total_words = EXCLUDED.total_words,
        average_words_per_summary = EXCLUDED.average_words_per_summary,
        most_active_types = EXCLUDED.most_active_types,
        most_active_styles = EXCLUDED.most_active_styles,
        most_active_lengths = EXCLUDED.most_active_lengths,
        top_performing_summaries = EXCLUDED.top_performing_summaries,
        user_engagement = EXCLUDED.user_engagement,
        content_quality = EXCLUDED.content_quality,
        trends = EXCLUDED.trends,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE summaries IS 'Résumés personnalisés avec différentes longueurs et styles d''écriture';
COMMENT ON TABLE summary_key_points IS 'Points clés extraits des résumés avec preuves et métadonnées';
COMMENT ON TABLE summary_key_point_evidence IS 'Preuves supportant les points clés des résumés';
COMMENT ON TABLE summary_entities IS 'Entités extraites des résumés (personnes, lieux, dates, etc.)';
COMMENT ON TABLE summary_templates IS 'Templates de génération de résumé avec prompts configurables';
COMMENT ON TABLE summary_exports IS 'Exports de résumés dans différents formats';
COMMENT ON TABLE summary_statistics IS 'Statistiques d''utilisation et de performance des résumés';
COMMENT ON TABLE summary_reading_sessions IS 'Sessions de lecture de résumés avec tracking utilisateur';
COMMENT ON TABLE summary_interactions IS 'Interactions des utilisateurs avec les résumés';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN summaries.key_points IS 'Points clés du résumé [{id, title, content, importance, category, supportingEvidence, relatedPoints, position, metadata, createdAt}]';
COMMENT ON COLUMN summaries.metadata IS 'Métadonnées du résumé {totalWords, totalCharacters, totalSentences, totalParagraphs, averageSentenceLength, averageWordLength, readabilityScore, complexityScore, cohesionScore, relevanceScore, completeness, accuracy, originalDocumentLength, compressionRatio, keyPointsCount, evidenceCount, processingTime, model, temperature, tokensUsed, language, sentiment, topics, entities, quality, extraction, version, lastUpdated, customFields}';
COMMENT ON COLUMN summaries.settings IS 'Paramètres du résumé {maxLength, minLength, style, type, language, targetAudience, includeKeyPoints, includeEvidence, includeEntities, includeTopics, includeStatistics, tone, structure, content, formatting, personalization}';
COMMENT ON COLUMN summaries.analytics IS 'Analytics d''utilisation {totalViews, uniqueViews, averageReadingTime, averageScrollDepth, mostViewedSections, userEngagement, readingPatterns, contentPerformance, trends}';
COMMENT ON COLUMN summary_key_points.metadata IS 'Métadonnées du point clé {extractionMethod, confidence, relevance, accuracy, completeness, processingTime, model, temperature, tokensUsed, language, sentiment, complexity, readability, wordCount, characterCount, customFields}';
COMMENT ON COLUMN summary_statistics.trends IS 'Tendances d''utilisation {summaryGrowth, wordGrowth, typeTrends, styleTrends}';
COMMENT ON COLUMN summary_statistics.user_engagement IS 'Engagement utilisateur {totalUsers, activeUsers, averageSummariesPerUser, averageWordsPerUser, averageReadingTime, satisfactionScore}';
COMMENT ON COLUMN summary_statistics.content_quality IS 'Qualité du contenu {averageClarity, averageCoherence, averageConciseness, averageCompleteness, averageAccuracy, averageRelevance, extractionSuccessRate}';

-- Créer les données par défaut
SELECT create_default_summary_templates();
