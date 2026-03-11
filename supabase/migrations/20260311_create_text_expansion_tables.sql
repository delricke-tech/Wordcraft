-- Migration pour les tables d'extension de texte
-- Création: 11 mars 2026
-- Description: Extension automatique de texte avec élaboration et enrichissement

-- Table principale des extensions de texte
CREATE TABLE IF NOT EXISTS text_expansions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    original_text TEXT NOT NULL,
    expanded_text TEXT NOT NULL,
    expansion_type VARCHAR(50) NOT NULL CHECK (expansion_type IN ('detailed', 'examples', 'explanations', 'comprehensive', 'academic', 'creative', 'technical', 'business', 'custom')),
    target_length VARCHAR(50) NOT NULL CHECK (target_length IN ('brief', 'moderate', 'detailed', 'extensive', 'comprehensive', 'custom')),
    settings JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    analytics JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'published', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Table des ajouts de texte
CREATE TABLE IF NOT EXISTS text_expansion_additions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expansion_id UUID REFERENCES text_expansions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('example', 'explanation', 'definition', 'comparison', 'context', 'consequence', 'history', 'application')),
    content TEXT NOT NULL,
    position JSONB NOT NULL DEFAULT '{}',
    relevance DECIMAL(3,2) NOT NULL CHECK (relevance >= 0 AND relevance <= 1),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    source VARCHAR(50) NOT NULL CHECK (source IN ('ai', 'knowledge_base', 'user_input', 'template')),
    category VARCHAR(100),
    importance VARCHAR(20) NOT NULL CHECK (importance IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des templates d'extension
CREATE TABLE IF NOT EXISTS text_expansion_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    expansion_type VARCHAR(50) NOT NULL CHECK (expansion_type IN ('detailed', 'examples', 'explanations', 'comprehensive', 'academic', 'creative', 'technical', 'business', 'custom')),
    target_length VARCHAR(50) NOT NULL CHECK (target_length IN ('brief', 'moderate', 'detailed', 'extensive', 'comprehensive', 'custom')),
    prompt TEXT NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exports d'extensions
CREATE TABLE IF NOT EXISTS text_expansion_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expansion_id UUID REFERENCES text_expansions(id) ON DELETE CASCADE,
    format VARCHAR(20) NOT NULL CHECK (format IN ('json', 'txt', 'md', 'html', 'pdf', 'docx', 'epub')),
    options JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des statistiques d'extensions
CREATE TABLE IF NOT EXISTS text_expansion_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_expansions INTEGER DEFAULT 0,
    published_expansions INTEGER DEFAULT 0,
    draft_expansions INTEGER DEFAULT 0,
    total_words INTEGER DEFAULT 0,
    average_words_per_expansion DECIMAL(10,2) DEFAULT 0,
    most_active_type VARCHAR(50),
    most_active_length VARCHAR(50),
    average_quality_score DECIMAL(5,2) DEFAULT 0,
    average_completeness_score DECIMAL(5,2) DEFAULT 0,
    average_relevance_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Table des sessions de lecture d'extensions
CREATE TABLE IF NOT EXISTS text_expansion_reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expansion_id UUID REFERENCES text_expansions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    scroll_depth_percentage DECIMAL(5,2),
    completion_percentage DECIMAL(5,2),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    ip_address INET,
    user_agent TEXT
);

-- Table des interactions avec les extensions
CREATE TABLE IF NOT EXISTS text_expansion_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expansion_id UUID REFERENCES text_expansions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('view', 'share', 'bookmark', 'comment', 'rating', 'download', 'copy')),
    interaction_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des feedbacks sur les extensions
CREATE TABLE IF NOT EXISTS text_expansion_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expansion_id UUID REFERENCES text_expansions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type VARCHAR(50) CHECK (feedback_type IN ('helpful', 'not_helpful', 'too_long', 'too_short', 'irrelevant', 'other')),
    comment TEXT,
    suggestions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(expansion_id, user_id)
);

-- Table des connaissances pour l'extension
CREATE TABLE IF NOT EXISTS text_expansion_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('definition', 'example', 'explanation', 'comparison', 'context', 'consequence', 'history', 'application')),
    source VARCHAR(100),
    relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    language VARCHAR(10) DEFAULT 'fr',
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des niveaux d'extension personnalisés
CREATE TABLE IF NOT EXISTS text_expansion_custom_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    target_word_count INTEGER NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_text_expansions_user_id ON text_expansions(user_id);
CREATE INDEX IF NOT EXISTS idx_text_expansions_document_id ON text_expansions(document_id);
CREATE INDEX IF NOT EXISTS idx_text_expansions_status ON text_expansions(status);
CREATE INDEX IF NOT EXISTS idx_text_expansions_expansion_type ON text_expansions(expansion_type);
CREATE INDEX IF NOT EXISTS idx_text_expansions_target_length ON text_expansions(target_length);
CREATE INDEX IF NOT EXISTS idx_text_expansions_created_at ON text_expansions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_text_expansions_title ON text_expansions USING gin(to_tsvector('french', title));

CREATE INDEX IF NOT EXISTS idx_text_expansion_additions_expansion_id ON text_expansion_additions(expansion_id);
CREATE INDEX IF NOT EXISTS idx_text_expansion_additions_type ON text_expansion_additions(type);
CREATE INDEX IF NOT EXISTS idx_text_expansion_additions_relevance ON text_expansion_additions(relevance DESC);

CREATE INDEX IF NOT EXISTS idx_text_expansion_templates_expansion_type ON text_expansion_templates(expansion_type);
CREATE INDEX IF NOT EXISTS idx_text_expansion_templates_target_length ON text_expansion_templates(target_length);
CREATE INDEX IF NOT EXISTS idx_text_expansion_templates_is_active ON text_expansion_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_text_expansion_templates_usage_count ON text_expansion_templates(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_text_expansion_exports_expansion_id ON text_expansion_exports(expansion_id);
CREATE INDEX IF NOT EXISTS idx_text_expansion_exports_status ON text_expansion_exports(status);
CREATE INDEX IF NOT EXISTS idx_text_expansion_exports_format ON text_expansion_exports(format);

CREATE INDEX IF NOT EXISTS idx_text_expansion_statistics_user_id ON text_expansion_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_text_expansion_statistics_date ON text_expansion_statistics(date DESC);

CREATE INDEX IF NOT EXISTS idx_text_expansion_reading_sessions_expansion_id ON text_expansion_reading_sessions(expansion_id);
CREATE INDEX IF NOT EXISTS idx_text_expansion_reading_sessions_user_id ON text_expansion_reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_text_expansion_reading_sessions_session_id ON text_expansion_reading_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_text_expansion_reading_sessions_started_at ON text_expansion_reading_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_text_expansion_interactions_expansion_id ON text_expansion_interactions(expansion_id);
CREATE INDEX IF NOT EXISTS idx_text_expansion_interactions_user_id ON text_expansion_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_text_expansion_interactions_interaction_type ON text_expansion_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_text_expansion_interactions_created_at ON text_expansion_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_text_expansion_feedbacks_expansion_id ON text_expansion_feedbacks(expansion_id);
CREATE INDEX IF NOT EXISTS idx_text_expansion_feedbacks_user_id ON text_expansion_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_text_expansion_feedbacks_rating ON text_expansion_feedbacks(rating);
CREATE INDEX IF NOT EXISTS idx_text_expansion_feedbacks_feedback_type ON text_expansion_feedbacks(feedback_type);

CREATE INDEX IF NOT EXISTS idx_text_expansion_knowledge_category ON text_expansion_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_text_expansion_knowledge_topic ON text_expansion_knowledge(topic);
CREATE INDEX IF NOT EXISTS idx_text_expansion_knowledge_content_type ON text_expansion_knowledge(content_type);
CREATE INDEX IF NOT EXISTS idx_text_expansion_knowledge_relevance_score ON text_expansion_knowledge(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_text_expansion_knowledge_tags ON text_expansion_knowledge USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_text_expansion_knowledge_is_active ON text_expansion_knowledge(is_active);

CREATE INDEX IF NOT EXISTS idx_text_expansion_custom_levels_user_id ON text_expansion_custom_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_text_expansion_custom_levels_is_default ON text_expansion_custom_levels(is_default);

-- Row Level Security (RLS)
ALTER TABLE text_expansions ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_expansion_additions ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_expansion_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_expansion_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_expansion_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_expansion_reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_expansion_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_expansion_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_expansion_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_expansion_custom_levels ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour text_expansions
CREATE POLICY "Users can view own text expansions" ON text_expansions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own text expansions" ON text_expansions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own text expansions" ON text_expansions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own text expansions" ON text_expansions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all text expansions" ON text_expansions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour text_expansion_additions
CREATE POLICY "Users can view own text expansion additions" ON text_expansion_additions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM text_expansions 
            WHERE text_expansions.id = expansion_id 
            AND text_expansions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own text expansion additions" ON text_expansion_additions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM text_expansions 
            WHERE text_expansions.id = expansion_id 
            AND text_expansions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own text expansion additions" ON text_expansion_additions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM text_expansions 
            WHERE text_expansions.id = expansion_id 
            AND text_expansions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own text expansion additions" ON text_expansion_additions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM text_expansions 
            WHERE text_expansions.id = expansion_id 
            AND text_expansions.user_id = auth.uid()
        )
    );

-- Politiques RLS pour text_expansion_templates
CREATE POLICY "Users can view active text expansion templates" ON text_expansion_templates
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can insert own text expansion templates" ON text_expansion_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own text expansion templates" ON text_expansion_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own text expansion templates" ON text_expansion_templates
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all text expansion templates" ON text_expansion_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour text_expansion_exports
CREATE POLICY "Users can view own text expansion exports" ON text_expansion_exports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM text_expansions 
            WHERE text_expansions.id = expansion_id 
            AND text_expansions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own text expansion exports" ON text_expansion_exports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM text_expansions 
            WHERE text_expansions.id = expansion_id 
            AND text_expansions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own text expansion exports" ON text_expansion_exports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM text_expansions 
            WHERE text_expansions.id = expansion_id 
            AND text_expansions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own text expansion exports" ON text_expansion_exports
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM text_expansions 
            WHERE text_expansions.id = expansion_id 
            AND text_expansions.user_id = auth.uid()
        )
    );

-- Politiques RLS pour text_expansion_statistics
CREATE POLICY "Users can view own text expansion statistics" ON text_expansion_statistics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own text expansion statistics" ON text_expansion_statistics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own text expansion statistics" ON text_expansion_statistics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all text expansion statistics" ON text_expansion_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour text_expansion_reading_sessions
CREATE POLICY "Users can view own text expansion reading sessions" ON text_expansion_reading_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own text expansion reading sessions" ON text_expansion_reading_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own text expansion reading sessions" ON text_expansion_reading_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques RLS pour text_expansion_interactions
CREATE POLICY "Users can view own text expansion interactions" ON text_expansion_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own text expansion interactions" ON text_expansion_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own text expansion interactions" ON text_expansion_interactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques RLS pour text_expansion_feedbacks
CREATE POLICY "Users can view own text expansion feedbacks" ON text_expansion_feedbacks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own text expansion feedbacks" ON text_expansion_feedbacks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own text expansion feedbacks" ON text_expansion_feedbacks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own text expansion feedbacks" ON text_expansion_feedbacks
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour text_expansion_knowledge
CREATE POLICY "All users can view active text expansion knowledge" ON text_expansion_knowledge
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage text expansion knowledge" ON text_expansion_knowledge
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour text_expansion_custom_levels
CREATE POLICY "Users can view own text expansion custom levels" ON text_expansion_custom_levels
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own text expansion custom levels" ON text_expansion_custom_levels
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own text expansion custom levels" ON text_expansion_custom_levels
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own text expansion custom levels" ON text_expansion_custom_levels
    FOR DELETE USING (auth.uid() = user_id);

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_text_expansions_updated_at BEFORE UPDATE ON text_expansions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_text_expansion_templates_updated_at BEFORE UPDATE ON text_expansion_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_text_expansion_statistics_updated_at BEFORE UPDATE ON text_expansion_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_text_expansion_knowledge_updated_at BEFORE UPDATE ON text_expansion_knowledge
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_text_expansion_custom_levels_updated_at BEFORE UPDATE ON text_expansion_custom_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques d'utilisation des templates
CREATE OR REPLACE FUNCTION update_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE text_expansion_templates 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.expansion_id AND EXISTS (
            SELECT 1 FROM text_expansions te 
            WHERE te.id = NEW.expansion_id 
            AND te.settings->>'template_id' = text_expansion_templates.id::text
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_template_usage_count_trigger AFTER INSERT ON text_expansions
    FOR EACH ROW EXECUTE FUNCTION update_template_usage_count();

-- Trigger pour mettre à jour les statistiques d'utilisation des connaissances
CREATE OR REPLACE FUNCTION update_knowledge_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Mettre à jour le compteur d'utilisation pour les connaissances pertinentes
        UPDATE text_expansion_knowledge 
        SET usage_count = usage_count + 1 
        WHERE is_active = TRUE 
        AND (
            SELECT COUNT(*) FROM text_expansion_additions tea 
            WHERE tea.expansion_id = NEW.expansion_id 
            AND tea.source = 'knowledge_base'
            AND tea.category = text_expansion_knowledge.category
        ) > 0;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_knowledge_usage_count_trigger AFTER INSERT ON text_expansions
    FOR EACH ROW EXECUTE FUNCTION update_knowledge_usage_count();

-- Fonctions RPC pour les statistiques
CREATE OR REPLACE FUNCTION get_expansion_stats(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'total_expansions', COUNT(*),
        'published_expansions', COUNT(*) FILTER (WHERE status = 'published'),
        'draft_expansions', COUNT(*) FILTER (WHERE status = 'draft'),
        'total_words', COALESCE(SUM((metadata->>'expandedMetrics'->>'totalWords')::INTEGER), 0),
        'average_words_per_expansion', COALESCE(AVG((metadata->>'expandedMetrics'->>'totalWords')::INTEGER), 0),
        'most_active_type', (
            SELECT expansion_type FROM (
                SELECT expansion_type, COUNT(*) as cnt 
                FROM text_expansions 
                WHERE (p_user_id IS NULL OR user_id = p_user_id)
                GROUP BY expansion_type 
                ORDER BY cnt DESC 
                LIMIT 1
            ) t
        ),
        'most_active_length', (
            SELECT target_length FROM (
                SELECT target_length, COUNT(*) as cnt 
                FROM text_expansions 
                WHERE (p_user_id IS NULL OR user_id = p_user_id)
                GROUP BY target_length 
                ORDER BY cnt DESC 
                LIMIT 1
            ) t
        ),
        'average_quality_score', COALESCE(AVG((metadata->>'qualityScore')::DECIMAL), 0),
        'average_completeness_score', COALESCE(AVG((metadata->>'completenessScore')::DECIMAL), 0),
        'average_relevance_score', COALESCE(AVG((metadata->>'relevanceScore')::DECIMAL), 0)
    ) INTO v_result
    FROM text_expansions 
    WHERE (p_user_id IS NULL OR user_id = p_user_id);
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_expansion_analytics(p_expansion_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Mettre à jour les analytics de l'extension
    UPDATE text_expansions 
    SET analytics = analytics || jsonb_build_object(
        'totalViews', COALESCE((analytics->>'totalViews')::BIGINT, 0) + 1,
        'uniqueViews', (
            SELECT COUNT(DISTINCT user_id) 
            FROM text_expansion_interactions 
            WHERE expansion_id = p_expansion_id 
            AND interaction_type = 'view'
        ),
        'averageReadingTime', (
            SELECT COALESCE(AVG(duration_seconds), 0) 
            FROM text_expansion_reading_sessions 
            WHERE expansion_id = p_expansion_id 
            AND duration_seconds IS NOT NULL
        ),
        'averageScrollDepth', (
            SELECT COALESCE(AVG(scroll_depth_percentage), 0) 
            FROM text_expansion_reading_sessions 
            WHERE expansion_id = p_expansion_id 
            AND scroll_depth_percentage IS NOT NULL
        ),
        'completionRate', (
            SELECT COALESCE(
                (COUNT(*) FILTER (WHERE completion_percentage >= 80) * 100.0 / COUNT(*)), 
                0
            ) 
            FROM text_expansion_reading_sessions 
            WHERE expansion_id = p_expansion_id 
            AND completion_percentage IS NOT NULL
        ),
        'averageRating', (
            SELECT COALESCE(AVG(rating), 0) 
            FROM text_expansion_feedbacks 
            WHERE expansion_id = p_expansion_id 
            AND rating IS NOT NULL
        )
    )
    WHERE id = p_expansion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_default_expansion_templates()
RETURNS VOID AS $$
BEGIN
    -- Template d'extension détaillée
    INSERT INTO text_expansion_templates (name, description, expansion_type, target_length, prompt, settings, is_default)
    VALUES (
        'Extension Détaillée',
        'Ajoute des détails et des explications pour enrichir le contenu',
        'detailed',
        'moderate',
        'Étends ce texte en ajoutant des détails pertinents et des explications claires pour une meilleure compréhension.',
        '{"content": {"addExplanations": true, "addContext": true}, "style": {"tone": "neutral", "complexity": "moderate"}, "structure": {"useSections": false}}',
        true
    )
    ON CONFLICT DO NOTHING;
    
    -- Template d'extension avec exemples
    INSERT INTO text_expansion_templates (name, description, expansion_type, target_length, prompt, settings, is_default)
    VALUES (
        'Extension avec Exemples',
        'Ajoute des exemples concrets pour illustrer les concepts',
        'examples',
        'moderate',
        'Étends ce texte en ajoutant des exemples pratiques et concrets pour mieux illustrer les concepts.',
        '{"content": {"addExamples": true, "addApplications": true}, "style": {"tone": "informal", "complexity": "simple"}, "structure": {"useLists": true}}',
        true
    )
    ON CONFLICT DO NOTHING;
    
    -- Template d'extension académique
    INSERT INTO text_expansion_templates (name, description, expansion_type, target_length, prompt, settings, is_default)
    VALUES (
        'Extension Académique',
        'Ajoute des références académiques et des définitions formelles',
        'academic',
        'detailed',
        'Étends ce texte de manière académique en ajoutant des définitions formelles, des références et des citations.',
        '{"content": {"addDefinitions": true, "addReferences": true}, "style": {"tone": "formal", "complexity": "advanced"}, "structure": {"useReferences": true}}',
        true
    )
    ON CONFLICT DO NOTHING;
    
    -- Template d'extension business
    INSERT INTO text_expansion_templates (name, description, expansion_type, target_length, prompt, settings, is_default)
    VALUES (
        'Extension Business',
        'Ajoute des implications business et des études de cas',
        'business',
        'moderate',
        'Étends ce texte avec une perspective business en ajoutant des implications, des études de cas et des retours sur investissement.',
        '{"content": {"addConsequences": true, "addApplications": true}, "style": {"tone": "business", "complexity": "moderate"}, "structure": {"useSections": true}}',
        true
    )
    ON CONFLICT DO NOTHING;
    
    -- Template d'extension technique
    INSERT INTO text_expansion_templates (name, description, expansion_type, target_length, prompt, settings, is_default)
    VALUES (
        'Extension Technique',
        'Ajoute des spécifications techniques et des implémentations',
        'technical',
        'detailed',
        'Étends ce texte avec des détails techniques, des spécifications et des exemples d\'implémentation.',
        '{"content": {"addDefinitions": true, "addApplications": true}, "style": {"tone": "technical", "complexity": "expert"}, "structure": {"useLists": true}}',
        true
    )
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires sur les tables
COMMENT ON TABLE text_expansions IS 'Extensions de texte avec élaboration et enrichissement automatique';
COMMENT ON TABLE text_expansion_additions IS 'Ajouts spécifiques effectués lors de l\'extension de texte';
COMMENT ON TABLE text_expansion_templates IS 'Templates prédéfinis pour l\'extension de texte';
COMMENT ON TABLE text_expansion_exports IS 'Exports d\'extensions dans différents formats';
COMMENT ON TABLE text_expansion_statistics IS 'Statistiques d\'utilisation des extensions de texte';
COMMENT ON TABLE text_expansion_reading_sessions IS 'Sessions de lecture des extensions';
COMMENT ON TABLE text_expansion_interactions IS 'Interactions des utilisateurs avec les extensions';
COMMENT ON TABLE text_expansion_feedbacks IS 'Feedbacks et évaluations des extensions';
COMMENT ON TABLE text_expansion_knowledge IS 'Base de connaissances pour l\'extension de texte';
COMMENT ON TABLE text_expansion_custom_levels IS 'Niveaux d\'extension personnalisés par utilisateur';

-- Commentaires sur les colonnes principales
COMMENT ON COLUMN text_expansions.expansion_type IS 'Type d\'extension (detailed, examples, explanations, etc.)';
COMMENT ON COLUMN text_expansions.target_length IS 'Longueur cible de l\'extension (brief, moderate, detailed, etc.)';
COMMENT ON COLUMN text_expansions.settings IS 'Paramètres de configuration de l\'extension';
COMMENT ON COLUMN text_expansions.metadata IS 'Métadonnées incluant les métriques et les ajouts';
COMMENT ON COLUMN text_expansions.analytics IS 'Données analytiques sur l\'utilisation';
COMMENT ON COLUMN text_expansion_additions.relevance IS 'Score de pertinence de l\'ajout (0-1)';
COMMENT ON COLUMN text_expansion_additions.confidence IS 'Score de confiance de l\'ajout (0-1)';
COMMENT ON COLUMN text_expansion_knowledge.relevance_score IS 'Score de pertinence de la connaissance (0-1)';
COMMENT ON COLUMN text_expansion_knowledge.confidence_score IS 'Score de confiance de la connaissance (0-1)';
