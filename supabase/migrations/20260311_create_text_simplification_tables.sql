-- Migration: Création des tables de simplification de texte
-- Date: 11 mars 2026
-- Description: Tables pour stocker les simplifications de texte avec différents niveaux de lecture

-- Table principale des simplifications
CREATE TABLE IF NOT EXISTS simplifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    original_text TEXT NOT NULL,
    simplified_text TEXT NOT NULL,
    target_level VARCHAR(20) NOT NULL CHECK (target_level IN ('elementary', 'beginner', 'intermediate', 'advanced', 'expert', 'native', 'custom')),
    original_level VARCHAR(20) NOT NULL DEFAULT 'native' CHECK (original_level IN ('elementary', 'beginner', 'intermediate', 'advanced', 'expert', 'native', 'custom')),
    simplification_type VARCHAR(20) NOT NULL DEFAULT 'comprehensive' CHECK (simplification_type IN ('vocabulary', 'sentence', 'structure', 'comprehensive', 'academic', 'business', 'technical', 'creative', 'custom')),
    settings JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    analytics JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'published', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Table des changements de simplification
CREATE TABLE IF NOT EXISTS simplification_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simplification_id UUID NOT NULL REFERENCES simplifications(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('word', 'sentence', 'structure', 'punctuation', 'format')),
    original TEXT NOT NULL,
    simplified TEXT NOT NULL,
    position JSONB NOT NULL,
    reason TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    impact VARCHAR(10) NOT NULL CHECK (impact IN ('low', 'medium', 'high', 'critical')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des templates de simplification
CREATE TABLE IF NOT EXISTS simplification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_level VARCHAR(20) NOT NULL CHECK (target_level IN ('elementary', 'beginner', 'intermediate', 'advanced', 'expert', 'native', 'custom')),
    simplification_type VARCHAR(20) NOT NULL CHECK (simplification_type IN ('vocabulary', 'sentence', 'structure', 'comprehensive', 'academic', 'business', 'technical', 'creative', 'custom')),
    prompt TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exports de simplifications
CREATE TABLE IF NOT EXISTS simplification_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simplification_id UUID NOT NULL REFERENCES simplifications(id) ON DELETE CASCADE,
    format VARCHAR(10) NOT NULL CHECK (format IN ('json', 'txt', 'md', 'html', 'pdf', 'docx', 'epub')),
    options JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    file_size INTEGER,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des statistiques de simplifications
CREATE TABLE IF NOT EXISTS simplification_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simplification_id UUID NOT NULL REFERENCES simplifications(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    average_reading_time INTEGER DEFAULT 0,
    average_scroll_depth DECIMAL(5,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    return_rate DECIMAL(5,2) DEFAULT 0,
    share_rate DECIMAL(5,2) DEFAULT 0,
    bookmark_rate DECIMAL(5,2) DEFAULT 0,
    comment_rate DECIMAL(5,2) DEFAULT 0,
    rating_rate DECIMAL(5,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(simplification_id, date)
);

-- Table des sessions de lecture
CREATE TABLE IF NOT EXISTS simplification_reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simplification_id UUID NOT NULL REFERENCES simplifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    total_time INTEGER DEFAULT 0,
    words_read INTEGER DEFAULT 0,
    scroll_depth DECIMAL(5,2) DEFAULT 0,
    sections_viewed JSONB DEFAULT '[]',
    completion_rate DECIMAL(5,2) DEFAULT 0,
    understanding_score DECIMAL(3,2) DEFAULT 0,
    device_type VARCHAR(20),
    browser VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des interactions avec les simplifications
CREATE TABLE IF NOT EXISTS simplification_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simplification_id UUID NOT NULL REFERENCES simplifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('view', 'scroll', 'click', 'bookmark', 'share', 'comment', 'rating', 'download', 'print')),
    interaction_data JSONB DEFAULT '{}',
    position JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID REFERENCES simplification_reading_sessions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des feedbacks sur les simplifications
CREATE TABLE IF NOT EXISTS simplification_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simplification_id UUID NOT NULL REFERENCES simplifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type VARCHAR(20) CHECK (feedback_type IN ('useful', 'not_useful', 'inaccurate', 'incomplete', 'confusing', 'too_simple', 'too_complex')),
    comment TEXT,
    suggestions TEXT,
    understanding_level INTEGER CHECK (understanding_level >= 1 AND understanding_level <= 5),
    readability_score INTEGER CHECK (readability_score >= 1 AND readability <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(simplification_id, user_id)
);

-- Table des dictionnaires personnalisés
CREATE TABLE IF NOT EXISTS simplification_dictionaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_level VARCHAR(20) NOT NULL CHECK (target_level IN ('elementary', 'beginner', 'intermediate', 'advanced', 'expert', 'native', 'custom')),
    entries JSONB NOT NULL DEFAULT '[]',
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des niveaux de lecture personnalisés
CREATE TABLE IF NOT EXISTS simplification_custom_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_level VARCHAR(20) NOT NULL CHECK (target_level IN ('elementary', 'beginner', 'intermediate', 'advanced', 'expert', 'native', 'custom')),
    max_words_per_sentence INTEGER NOT NULL CHECK (max_words_per_sentence > 0),
    max_syllables_per_word INTEGER NOT NULL CHECK (max_syllables_per_word > 0),
    max_word_length INTEGER NOT NULL CHECK (max_word_length > 0),
    vocabulary_complexity DECIMAL(3,2) DEFAULT 0.5 CHECK (vocabulary_complexity >= 0 AND vocabulary_complexity <= 1),
    sentence_complexity DECIMAL(3,2) DEFAULT 0.5 CHECK (sentence_complexity >= 0 AND sentence_complexity <= 1),
    structure_complexity DECIMAL(3,2) DEFAULT 0.5 CHECK (structure_complexity >= 0 AND structure_complexity <= 1),
    settings JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour optimiser les performances

-- Index sur les simplifications
CREATE INDEX IF NOT EXISTS idx_simplifications_user_id ON simplifications(user_id);
CREATE INDEX IF NOT EXISTS idx_simplifications_document_id ON simplifications(document_id);
CREATE INDEX IF NOT EXISTS idx_simplifications_target_level ON simplifications(target_level);
CREATE INDEX IF NOT EXISTS idx_simplifications_type ON simplifications(simplification_type);
CREATE INDEX IF NOT EXISTS idx_simplifications_status ON simplifications(status);
CREATE INDEX IF NOT EXISTS idx_simplifications_created_at ON simplifications(created_at);
CREATE INDEX IF NOT EXISTS idx_simplifications_updated_at ON simplifications(updated_at);
CREATE INDEX IF NOT EXISTS idx_simplifications_published_at ON simplifications(published_at);
CREATE INDEX IF NOT EXISTS idx_simplifications_search ON simplifications USING gin(to_tsvector('french', title || ' ' || COALESCE(description, '') || ' ' || simplified_text));

-- Index sur les changements
CREATE INDEX IF NOT EXISTS idx_simplification_changes_simplification_id ON simplification_changes(simplification_id);
CREATE INDEX IF NOT EXISTS idx_simplification_changes_type ON simplification_changes(type);
CREATE INDEX IF NOT EXISTS idx_simplification_changes_impact ON simplification_changes(impact);
CREATE INDEX IF NOT EXISTS idx_simplification_changes_created_at ON simplification_changes(created_at);

-- Index sur les templates
CREATE INDEX IF NOT EXISTS idx_simplification_templates_target_level ON simplification_templates(target_level);
CREATE INDEX IF NOT EXISTS idx_simplification_templates_type ON simplification_templates(simplification_type);
CREATE INDEX IF NOT EXISTS idx_simplification_templates_is_default ON simplification_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_simplification_templates_is_active ON simplification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_simplification_templates_usage_count ON simplification_templates(usage_count);

-- Index sur les exports
CREATE INDEX IF NOT EXISTS idx_simplification_exports_simplification_id ON simplification_exports(simplification_id);
CREATE INDEX IF NOT EXISTS idx_simplification_exports_format ON simplification_exports(format);
CREATE INDEX IF NOT EXISTS idx_simplification_exports_status ON simplification_exports(status);
CREATE INDEX IF NOT EXISTS idx_simplification_exports_created_at ON simplification_exports(created_at);

-- Index sur les statistiques
CREATE INDEX IF NOT EXISTS idx_simplification_statistics_simplification_id ON simplification_statistics(simplification_id);
CREATE INDEX IF NOT EXISTS idx_simplification_statistics_date ON simplification_statistics(date);
CREATE INDEX IF NOT EXISTS idx_simplification_statistics_total_views ON simplification_statistics(total_views);
CREATE INDEX IF NOT EXISTS idx_simplification_statistics_unique_views ON simplification_statistics(unique_views);

-- Index sur les sessions de lecture
CREATE INDEX IF NOT EXISTS idx_simplification_reading_sessions_simplification_id ON simplification_reading_sessions(simplification_id);
CREATE INDEX IF NOT EXISTS idx_simplification_reading_sessions_user_id ON simplification_reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_simplification_reading_sessions_session_start ON simplification_reading_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_simplification_reading_sessions_total_time ON simplification_reading_sessions(total_time);
CREATE INDEX IF NOT EXISTS idx_simplification_reading_sessions_words_read ON simplification_reading_sessions(words_read);

-- Index sur les interactions
CREATE INDEX IF NOT EXISTS idx_simplification_interactions_simplification_id ON simplification_interactions(simplification_id);
CREATE INDEX IF NOT EXISTS idx_simplification_interactions_user_id ON simplification_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_simplification_interactions_type ON simplification_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_simplification_interactions_timestamp ON simplification_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_simplification_interactions_session_id ON simplification_interactions(session_id);

-- Index sur les feedbacks
CREATE INDEX IF NOT EXISTS idx_simplification_feedbacks_simplification_id ON simplification_feedbacks(simplification_id);
CREATE INDEX IF NOT EXISTS idx_simplification_feedbacks_user_id ON simplification_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_simplification_feedbacks_rating ON simplification_feedbacks(rating);
CREATE INDEX IF NOT EXISTS idx_simplification_feedbacks_feedback_type ON simplification_feedbacks(feedback_type);
CREATE INDEX IF NOT EXISTS idx_simplification_feedbacks_created_at ON simplification_feedbacks(created_at);

-- Index sur les dictionnaires
CREATE INDEX IF NOT EXISTS idx_simplification_dictionaries_user_id ON simplification_dictionaries(user_id);
CREATE INDEX IF NOT EXISTS idx_simplification_dictionaries_target_level ON simplification_dictionaries(target_level);
CREATE INDEX IF NOT EXISTS idx_simplification_dictionaries_is_public ON simplification_dictionaries(is_public);
CREATE INDEX IF NOT EXISTS idx_simplification_dictionaries_usage_count ON simplification_dictionaries(usage_count);

-- Index sur les niveaux personnalisés
CREATE INDEX IF NOT EXISTS idx_simplification_custom_levels_user_id ON simplification_custom_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_simplification_custom_levels_target_level ON simplification_custom_levels(target_level);
CREATE INDEX IF NOT EXISTS idx_simplification_custom_levels_is_public ON simplification_custom_levels(is_public);
CREATE INDEX IF NOT EXISTS idx_simplification_custom_levels_usage_count ON simplification_custom_levels(usage_count);

-- Politiques RLS (Row Level Security)

-- Activer RLS sur toutes les tables
ALTER TABLE simplifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE simplification_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE simplification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE simplification_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE simplification_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE simplification_reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simplification_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simplification_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE simplification_dictionaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE simplification_custom_levels ENABLE ROW LEVEL SECURITY;

-- Politiques pour les simplifications
CREATE POLICY "Users can view their own simplifications" ON simplifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view published simplifications" ON simplifications
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can insert their own simplifications" ON simplifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simplifications" ON simplifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simplifications" ON simplifications
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour les changements
CREATE POLICY "Users can view changes of their simplifications" ON simplification_changes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM simplifications 
            WHERE simplifications.id = simplification_changes.simplification_id 
            AND (simplifications.user_id = auth.uid() OR simplifications.status = 'published')
        )
    );

CREATE POLICY "Users can insert changes for their simplifications" ON simplification_changes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM simplifications 
            WHERE simplifications.id = simplification_changes.simplification_id 
            AND simplifications.user_id = auth.uid()
        )
    );

-- Politiques pour les templates
CREATE POLICY "Users can view active templates" ON simplification_templates
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can view their own templates" ON simplification_templates
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own templates" ON simplification_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" ON simplification_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates" ON simplification_templates
    FOR DELETE USING (auth.uid() = created_by);

-- Politiques pour les exports
CREATE POLICY "Users can view their own exports" ON simplification_exports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM simplifications 
            WHERE simplifications.id = simplification_exports.simplification_id 
            AND simplifications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert exports for their simplifications" ON simplification_exports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM simplifications 
            WHERE simplifications.id = simplification_exports.simplification_id 
            AND simplifications.user_id = auth.uid()
        )
    );

-- Politiques pour les statistiques
CREATE POLICY "Users can view statistics of their simplifications" ON simplification_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM simplifications 
            WHERE simplifications.id = simplification_statistics.simplification_id 
            AND (simplifications.user_id = auth.uid() OR simplifications.status = 'published')
        )
    );

-- Politiques pour les sessions de lecture
CREATE POLICY "Users can view their own reading sessions" ON simplification_reading_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading sessions" ON simplification_reading_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading sessions" ON simplification_reading_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour les interactions
CREATE POLICY "Users can view their own interactions" ON simplification_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON simplification_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques pour les feedbacks
CREATE POLICY "Users can view feedbacks of their simplifications" ON simplification_feedbacks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM simplifications 
            WHERE simplifications.id = simplification_feedbacks.simplification_id 
            AND simplifications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert feedbacks for simplifications they can view" ON simplification_feedbacks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM simplifications 
            WHERE simplifications.id = simplification_feedbacks.simplification_id 
            AND (simplifications.user_id = auth.uid() OR simplifications.status = 'published')
        )
    );

CREATE POLICY "Users can update their own feedbacks" ON simplification_feedbacks
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour les dictionnaires
CREATE POLICY "Users can view public dictionaries" ON simplification_dictionaries
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can view their own dictionaries" ON simplification_dictionaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dictionaries" ON simplification_dictionaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dictionaries" ON simplification_dictionaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dictionaries" ON simplification_dictionaries
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour les niveaux personnalisés
CREATE POLICY "Users can view public custom levels" ON simplification_custom_levels
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can view their own custom levels" ON simplification_custom_levels
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom levels" ON simplification_custom_levels
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom levels" ON simplification_custom_levels
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom levels" ON simplification_custom_levels
    FOR DELETE USING (auth.uid() = user_id);

-- Triggers

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger sur les tables pertinentes
CREATE TRIGGER update_simplifications_updated_at BEFORE UPDATE ON simplifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simplification_templates_updated_at BEFORE UPDATE ON simplification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simplification_statistics_updated_at BEFORE UPDATE ON simplification_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simplification_feedbacks_updated_at BEFORE UPDATE ON simplification_feedbacks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simplification_dictionaries_updated_at BEFORE UPDATE ON simplification_dictionaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simplification_custom_levels_updated_at BEFORE UPDATE ON simplification_custom_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_simplification_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les statistiques quotidiennes
    INSERT INTO simplification_statistics (
        simplification_id, 
        date, 
        total_views, 
        unique_views, 
        average_reading_time,
        average_scroll_depth,
        completion_rate,
        bounce_rate,
        return_rate,
        share_rate,
        bookmark_rate,
        comment_rate,
        rating_rate,
        average_rating
    )
    VALUES (
        NEW.id,
        CURRENT_DATE,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    )
    ON CONFLICT (simplification_id, date) 
    DO UPDATE SET
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_simplification_statistics AFTER INSERT ON simplifications
    FOR EACH ROW EXECUTE FUNCTION update_simplification_statistics();

-- Trigger pour incrémenter le compteur d'utilisation des templates
CREATE OR REPLACE FUNCTION increment_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE simplification_templates 
    SET usage_count = usage_count + 1 
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Fonctions RPC

-- Fonction pour obtenir les statistiques des simplifications
CREATE OR REPLACE FUNCTION get_simplification_stats(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_simplifications', COUNT(*),
        'published_simplifications', COUNT(*) FILTER (WHERE status = 'published'),
        'draft_simplifications', COUNT(*) FILTER (WHERE status = 'draft'),
        'total_words', COALESCE(SUM((metadata->>'totalWords')::INTEGER), 0),
        'average_words_per_simplification', COALESCE(AVG((metadata->>'totalWords')::INTEGER), 0),
        'most_active_levels', (
            SELECT json_object_agg(target_level, cnt)
            FROM (
                SELECT target_level, COUNT(*) as cnt
                FROM simplifications
                WHERE (p_user_id IS NULL OR user_id = p_user_id)
                GROUP BY target_level
            ) t
        ),
        'most_active_types', (
            SELECT json_object_agg(simplification_type, cnt)
            FROM (
                SELECT simplification_type, COUNT(*) as cnt
                FROM simplifications
                WHERE (p_user_id IS NULL OR user_id = p_user_id)
                GROUP BY simplification_type
            ) t
        ),
        'top_performing_simplifications', (
            SELECT json_agg(
                json_build_object(
                    'simplification_id', id,
                    'title', title,
                    'view_count', COALESCE((analytics->>'totalViews')::INTEGER, 0),
                    'average_rating', COALESCE(AVG(rating), 0),
                    'word_count', COALESCE((metadata->>'totalWords')::INTEGER, 0),
                    'improvement_score', COALESCE((metadata->>'readabilityImprovement')::DECIMAL, 0)
                )
            )
            FROM (
                SELECT 
                    s.id,
                    s.title,
                    s.analytics,
                    s.metadata,
                    AVG(f.rating) as rating
                FROM simplifications s
                LEFT JOIN simplification_feedbacks f ON s.id = f.simplification_id
                WHERE (p_user_id IS NULL OR s.user_id = p_user_id)
                    AND s.status = 'published'
                GROUP BY s.id, s.title, s.analytics, s.metadata
                ORDER BY COALESCE((s.analytics->>'totalViews')::INTEGER, 0) DESC
                LIMIT 10
            ) top_simplifications
        ),
        'user_engagement', (
            SELECT json_build_object(
                'total_users', COUNT(DISTINCT user_id),
                'active_users', COUNT(DISTINCT user_id) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'),
                'average_simplifications_per_user', COALESCE(AVG(user_counts), 0),
                'average_words_per_user', COALESCE(AVG(user_words), 0),
                'average_reading_time', COALESCE(AVG(avg_reading_time), 0),
                'satisfaction_score', COALESCE(AVG(avg_rating), 0)
            )
            FROM (
                SELECT 
                    user_id,
                    COUNT(*) as user_counts,
                    COALESCE(AVG((metadata->>'totalWords')::INTEGER), 0) as user_words,
                    COALESCE(AVG((analytics->>'averageReadingTime')::INTEGER), 0) as avg_reading_time,
                    COALESCE(AVG(avg_rating), 0) as avg_rating
                FROM simplifications s
                LEFT JOIN simplification_feedbacks f ON s.id = f.simplification_id
                WHERE (p_user_id IS NULL OR s.user_id = p_user_id)
                    AND s.status = 'published'
                GROUP BY user_id
            ) user_stats
        ),
        'content_quality', (
            SELECT json_build_object(
                'average_clarity', COALESCE(AVG((metadata->>'clarity')::DECIMAL), 0),
                'average_coherence', COALESCE(AVG((metadata->>'coherence')::DECIMAL), 0),
                'average_simplicity', COALESCE(AVG((metadata->>'simplicity')::DECIMAL), 0),
                'average_accuracy', COALESCE(AVG((metadata->>'accuracy')::DECIMAL), 0),
                'average_completeness', COALESCE(AVG((metadata->>'completeness')::DECIMAL), 0),
                'average_readability', COALESCE(AVG((metadata->>'readability')::DECIMAL), 0),
                'extraction_success_rate', COALESCE(
                    (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
                    0
                )
            )
            FROM simplifications
            WHERE (p_user_id IS NULL OR user_id = p_user_id)
        ),
        'trends', (
            SELECT json_build_object(
                'simplification_growth', growth_data,
                'word_growth', word_data,
                'level_trends', level_data,
                'type_trends', type_data
            )
            FROM (
                SELECT 
                    ARRAY_AGG(COALESCE(monthly_counts, 0)) as growth_data,
                    ARRAY_AGG(COALESCE(monthly_words, 0)) as word_data
                FROM (
                    SELECT 
                        DATE_TRUNC('month', created_at) as month,
                        COUNT(*) as monthly_counts,
                        COALESCE(SUM((metadata->>'totalWords')::INTEGER), 0) as monthly_words
                    FROM simplifications
                    WHERE (p_user_id IS NULL OR user_id = p_user_id)
                        AND created_at >= NOW() - INTERVAL '12 months'
                    GROUP BY DATE_TRUNC('month', created_at)
                    ORDER BY month
                ) monthly_stats
            ) growth,
            (
                SELECT 
                    json_object_agg(target_level, level_counts)
                FROM (
                    SELECT 
                        target_level,
                        ARRAY_AGG(COALESCE(monthly_counts, 0)) as level_counts
                    FROM (
                        SELECT 
                            target_level,
                            DATE_TRUNC('month', created_at) as month,
                            COUNT(*) as monthly_counts
                        FROM simplifications
                        WHERE (p_user_id IS NULL OR user_id = p_user_id)
                            AND created_at >= NOW() - INTERVAL '12 months'
                        GROUP BY target_level, DATE_TRUNC('month', created_at)
                        ORDER BY target_level, month
                    ) level_monthly
                    GROUP BY target_level
                ) level_data
            ) level_trends,
            (
                SELECT 
                    json_object_agg(simplification_type, type_counts)
                FROM (
                    SELECT 
                        simplification_type,
                        ARRAY_AGG(COALESCE(monthly_counts, 0)) as type_counts
                    FROM (
                        SELECT 
                            simplification_type,
                            DATE_TRUNC('month', created_at) as month,
                            COUNT(*) as monthly_counts
                        FROM simplifications
                        WHERE (p_user_id IS NULL OR user_id = p_user_id)
                            AND created_at >= NOW() - INTERVAL '12 months'
                        GROUP BY simplification_type, DATE_TRUNC('month', created_at)
                        ORDER BY simplification_type, month
                    ) type_monthly
                    GROUP BY simplification_type
                ) type_data
            ) type_trends
        )
    ) INTO result
    FROM simplifications
    WHERE (p_user_id IS NULL OR user_id = p_user_id);
    
    RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les templates par défaut
CREATE OR REPLACE FUNCTION create_default_simplification_templates()
RETURNS VOID AS $$
BEGIN
    -- Template pour niveau élémentaire
    INSERT INTO simplification_templates (
        name, description, target_level, simplification_type, prompt, settings, is_default, created_by
    ) VALUES (
        'Niveau Élémentaire',
        'Simplification pour les enfants (6-8 ans)',
        'elementary',
        'comprehensive',
        'Simplifie ce texte pour un enfant de 6-8 ans. Utilise des mots simples, des phrases courtes, et des exemples concrets.',
        '{"maxWordsPerSentence": 8, "maxSyllablesPerWord": 2, "avoidComplexWords": true, "useSimpleTenses": true}',
        true,
        '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT DO NOTHING;

    -- Template pour niveau débutant
    INSERT INTO simplification_templates (
        name, description, target_level, simplification_type, prompt, settings, is_default, created_by
    ) VALUES (
        'Niveau Débutant',
        'Simplification pour les débutants (7-9 ans)',
        'beginner',
        'comprehensive',
        'Simplifie ce texte pour un débutant. Utilise un vocabulaire simple et des phrases claires.',
        '{"maxWordsPerSentence": 10, "maxSyllablesPerWord": 3, "avoidComplexWords": true, "useSimpleTenses": true}',
        true,
        '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT DO NOTHING;

    -- Template pour niveau intermédiaire
    INSERT INTO simplification_templates (
        name, description, target_level, simplification_type, prompt, settings, is_default, created_by
    ) VALUES (
        'Niveau Intermédiaire',
        'Simplification pour le niveau intermédiaire (9-12 ans)',
        'intermediate',
        'comprehensive',
        'Simplifie ce texte pour un niveau intermédiaire. Garde le sens principal avec un vocabulaire accessible.',
        '{"maxWordsPerSentence": 15, "maxSyllablesPerWord": 4, "avoidComplexWords": false, "useSimpleTenses": false}',
        true,
        '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT DO NOTHING;

    -- Template pour niveau avancé
    INSERT INTO simplification_templates (
        name, description, target_level, simplification_type, prompt, settings, is_default, created_by
    ) VALUES (
        'Niveau Avancé',
        'Simplification pour le niveau avancé (11-14 ans)',
        'advanced',
        'comprehensive',
        'Simplifie ce texte pour un niveau avancé. Rends le contenu plus accessible sans perdre la complexité.',
        '{"maxWordsPerSentence": 20, "maxSyllablesPerWord": 5, "avoidComplexWords": false, "useSimpleTenses": false}',
        true,
        '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT DO NOTHING;

    -- Template pour vocabulaire
    INSERT INTO simplification_templates (
        name, description, target_level, simplification_type, prompt, settings, is_default, created_by
    ) VALUES (
        'Simplification Vocabulaire',
        'Remplace les mots complexes par des équivalents simples',
        'intermediate',
        'vocabulary',
        'Simplifie uniquement le vocabulaire de ce texte. Remplace les mots complexes par des synonymes plus simples.',
        '{"replaceComplexWords": true, "provideDefinitions": true, "useCommonWords": true}',
        true,
        '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT DO NOTHING;

    -- Template pour phrases
    INSERT INTO simplification_templates (
        name, description, target_level, simplification_type, prompt, settings, is_default, created_by
    ) VALUES (
        'Simplification Phrases',
        'Simplifie la structure des phrases',
        'intermediate',
        'sentence',
        'Simplifie la structure des phrases de ce texte. Divise les phrases longues et utilise la voix active.',
        '{"maxSentenceLength": 15, "simpleStructure": true, "useActiveVoice": true}',
        true,
        '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT DO NOTHING;

    -- Template pour contenu académique
    INSERT INTO simplification_templates (
        name, description, target_level, simplification_type, prompt, settings, is_default, created_by
    ) VALUES (
        'Simplification Académique',
        'Simplifie le contenu académique et scientifique',
        'intermediate',
        'academic',
        'Simplifie ce contenu académique. Explique les concepts complexes avec un langage accessible.',
        '{"avoidJargon": true, "explainComplexTerms": true, "addExamples": true}',
        true,
        '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT DO NOTHING;

    -- Template pour contenu business
    INSERT INTO simplification_templates (
        name, description, target_level, simplification_type, prompt, settings, is_default, created_by
    ) VALUES (
        'Simplification Business',
        'Simplifie le jargon business et corporatif',
        'intermediate',
        'business',
        'Simplifie ce contenu business. Remplace le jargon corporatif par des termes clairs.',
        '{"avoidJargon": true, "useCommonWords": true, "explainComplexTerms": false}',
        true,
        '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT DO NOTHING;

    -- Template pour contenu technique
    INSERT INTO simplification_templates (
        name, description, target_level, simplification_type, prompt, settings, is_default, created_by
    ) VALUES (
        'Simplification Technique',
        'Simplifie le contenu technique et informatique',
        'intermediate',
        'technical',
        'Simplifie ce contenu technique. Explique les termes techniques avec des analogies.',
        '{"avoidJargon": true, "useAnalogies": true, "addExamples": true}',
        true,
        '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT DO NOTHING;

    -- Template pour contenu créatif
    INSERT INTO simplification_templates (
        name, description, target_level, simplification_type, prompt, settings, is_default, created_by
    ) VALUES (
        'Simplification Créative',
        'Simplifie avec des analogies et exemples créatifs',
        'intermediate',
        'creative',
        'Simplifie ce texte de manière créative. Utilise des analogies et des exemples imagés.',
        '{"useAnalogies": true, "addExamples": true, "explainComplexTerms": true}',
        true,
        '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques quotidiennes
CREATE OR REPLACE FUNCTION create_daily_simplification_statistics()
RETURNS VOID AS $$
BEGIN
    -- Créer les statistiques pour toutes les simplifications publiées
    INSERT INTO simplification_statistics (
        simplification_id, 
        date, 
        total_views, 
        unique_views, 
        average_reading_time,
        average_scroll_depth,
        completion_rate,
        bounce_rate,
        return_rate,
        share_rate,
        bookmark_rate,
        comment_rate,
        rating_rate,
        average_rating
    )
    SELECT 
        id,
        CURRENT_DATE,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    FROM simplifications
    WHERE status = 'published'
    ON CONFLICT (simplification_id, date) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour analyser les métriques de texte
CREATE OR REPLACE FUNCTION analyze_text_metrics(p_text TEXT)
RETURNS JSON AS $$
DECLARE
    words TEXT[];
    sentences TEXT[];
    paragraphs TEXT[];
    total_words INTEGER;
    total_sentences INTEGER;
    total_paragraphs INTEGER;
    avg_words_per_sentence DECIMAL;
    avg_syllables_per_word DECIMAL;
    avg_chars_per_word DECIMAL;
    complex_words INTEGER;
    simple_words INTEGER;
    readability_score DECIMAL;
BEGIN
    -- Diviser le texte en mots
    words := string_to_array(p_text, ' ');
    total_words := array_length(words, 1);
    
    -- Diviser le texte en phrases
    sentences := regexp_split_to_array(p_text, '[.!?]+');
    total_sentences := array_length(sentences, 1);
    
    -- Diviser le texte en paragraphes
    paragraphs := regexp_split_to_array(p_text, '\n\n+');
    total_paragraphs := array_length(paragraphs, 1);
    
    -- Calculer les moyennes
    avg_words_per_sentence := CASE WHEN total_sentences > 0 THEN total_words::DECIMAL / total_sentences ELSE 0 END;
    avg_chars_per_word := CASE WHEN total_words > 0 THEN (LENGTH(p_text) - LENGTH(REPLACE(p_text, ' ', '')))::DECIMAL / total_words ELSE 0 END;
    
    -- Compter les mots complexes (simplification)
    complex_words := 0;
    simple_words := 0;
    
    FOR i IN 1..total_words LOOP
        IF LENGTH(words[i]) > 8 THEN
            complex_words := complex_words + 1;
        ELSE
            simple_words := simple_words + 1;
        END IF;
    END LOOP;
    
    -- Calculer le score de lisibilité (simplifié)
    readability_score := CASE 
        WHEN avg_words_per_sentence > 20 THEN 60
        WHEN avg_words_per_sentence > 15 THEN 75
        WHEN avg_words_per_sentence > 10 THEN 85
        ELSE 95
    END;
    
    avg_syllables_per_word := 2.5; -- Approximation
    
    RETURN json_build_object(
        'totalWords', total_words,
        'totalSentences', total_sentences,
        'totalParagraphs', total_paragraphs,
        'averageWordsPerSentence', avg_words_per_sentence,
        'averageSyllablesPerWord', avg_syllables_per_word,
        'averageCharactersPerWord', avg_chars_per_word,
        'complexWordsCount', complex_words,
        'simpleWordsCount', simple_words,
        'readabilityScore', readability_score,
        'fleschKincaidScore', readability_score,
        'vocabularyLevel', (complex_words::DECIMAL / total_words * 100),
        'sentenceComplexity', (avg_words_per_sentence / 20 * 100),
        'structureComplexity', (total_paragraphs::DECIMAL / total_sentences * 100)
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les statistiques d'une simplification
CREATE OR REPLACE FUNCTION update_simplification_analytics(p_simplification_id UUID)
RETURNS VOID AS $$
DECLARE
    total_views INTEGER;
    unique_views INTEGER;
    avg_reading_time INTEGER;
    avg_scroll_depth DECIMAL;
    completion_rate DECIMAL;
    bounce_rate DECIMAL;
    return_rate DECIMAL;
    share_rate DECIMAL;
    bookmark_rate DECIMAL;
    comment_rate DECIMAL;
    rating_rate DECIMAL;
    avg_rating DECIMAL;
BEGIN
    -- Calculer les vues totales
    SELECT COUNT(*) INTO total_views
    FROM simplification_interactions
    WHERE simplification_id = p_simplification_id AND interaction_type = 'view';
    
    -- Calculer les vues uniques
    SELECT COUNT(DISTINCT user_id) INTO unique_views
    FROM simplification_interactions
    WHERE simplification_id = p_simplification_id AND interaction_type = 'view';
    
    -- Calculer le temps de lecture moyen
    SELECT COALESCE(AVG(total_time), 0) INTO avg_reading_time
    FROM simplification_reading_sessions
    WHERE simplification_id = p_simplification_id;
    
    -- Calculer le scroll depth moyen
    SELECT COALESCE(AVG(scroll_depth), 0) INTO avg_scroll_depth
    FROM simplification_reading_sessions
    WHERE simplification_id = p_simplification_id;
    
    -- Calculer le taux de complétion
    SELECT COALESCE(AVG(completion_rate), 0) INTO completion_rate
    FROM simplification_reading_sessions
    WHERE simplification_id = p_simplification_id;
    
    -- Calculer le taux de rebond
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE total_time < 30)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        0
    ) INTO bounce_rate
    FROM simplification_reading_sessions
    WHERE simplification_id = p_simplification_id;
    
    -- Calculer le taux de retour
    SELECT COALESCE(
        (COUNT(DISTINCT user_id) FILTER (WHERE session_start > (
            SELECT MAX(session_start) 
            FROM simplification_reading_sessions s2 
            WHERE s2.simplification_id = p_simplification_id 
            AND s2.user_id = simplification_reading_sessions.user_id
            AND s2.session_start < simplification_reading_sessions.session_start
        ))::DECIMAL / NULLIF(COUNT(DISTINCT user_id), 0)) * 100,
        0
    ) INTO return_rate
    FROM simplification_reading_sessions
    WHERE simplification_id = p_simplification_id;
    
    -- Calculer les taux d'interaction
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE interaction_type = 'share')::DECIMAL / NULLIF(total_views, 0)) * 100,
        0
    ) INTO share_rate
    FROM simplification_interactions
    WHERE simplification_id = p_simplification_id AND interaction_type = 'view';
    
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE interaction_type = 'bookmark')::DECIMAL / NULLIF(total_views, 0)) * 100,
        0
    ) INTO bookmark_rate
    FROM simplification_interactions
    WHERE simplification_id = p_simplification_id AND interaction_type = 'view';
    
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE interaction_type = 'comment')::DECIMAL / NULLIF(total_views, 0)) * 100,
        0
    ) INTO comment_rate
    FROM simplification_interactions
    WHERE simplification_id = p_simplification_id AND interaction_type = 'view';
    
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE interaction_type = 'rating')::DECIMAL / NULLIF(total_views, 0)) * 100,
        0
    ) INTO rating_rate
    FROM simplification_interactions
    WHERE simplification_id = p_simplification_id AND interaction_type = 'view';
    
    -- Calculer la note moyenne
    SELECT COALESCE(AVG(rating), 0) INTO avg_rating
    FROM simplification_feedbacks
    WHERE simplification_id = p_simplification_id;
    
    -- Mettre à jour les analytics
    UPDATE simplifications
    SET analytics = json_build_object(
        'totalViews', total_views,
        'uniqueViews', unique_views,
        'averageReadingTime', avg_reading_time,
        'averageScrollDepth', avg_scroll_depth,
        'completionRate', completion_rate,
        'bounceRate', bounce_rate,
        'returnRate', return_rate,
        'shareRate', share_rate,
        'bookmarkRate', bookmark_rate,
        'commentRate', comment_rate,
        'ratingRate', rating_rate,
        'averageRating', avg_rating
    )
    WHERE id = p_simplification_id;
END;
$$ LANGUAGE plpgsql;

-- Créer les templates par défaut
SELECT create_default_simplification_templates();

-- Créer les statistiques quotidiennes pour les simplifications existantes
SELECT create_daily_simplification_statistics();

COMMENT ON TABLE simplifications IS 'Table principale des simplifications de texte';
COMMENT ON TABLE simplification_changes IS 'Table des changements de simplification';
COMMENT ON TABLE simplification_templates IS 'Table des templates de simplification';
COMMENT ON TABLE simplification_exports IS 'Table des exports de simplifications';
COMMENT ON TABLE simplification_statistics IS 'Table des statistiques de simplifications';
COMMENT ON TABLE simplification_reading_sessions IS 'Table des sessions de lecture';
COMMENT ON TABLE simplification_interactions IS 'Table des interactions avec les simplifications';
COMMENT ON TABLE simplification_feedbacks IS 'Table des feedbacks sur les simplifications';
COMMENT ON TABLE simplification_dictionaries IS 'Table des dictionnaires personnalisés';
COMMENT ON TABLE simplification_custom_levels IS 'Table des niveaux de lecture personnalisés';
