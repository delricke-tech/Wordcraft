-- Migration: Création des tables pour la génération automatique de FAQ
-- Date: 11 mars 2026
-- Description: Tables pour gérer les FAQ générées par IA avec questions, réponses et analytics

-- Table principale des FAQs
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'fr',
    difficulty VARCHAR(20) DEFAULT 'mixed' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'mixed')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'reviewing', 'approved', 'published', 'archived', 'deleted')),
    questions JSONB DEFAULT '[]', -- [{id, question, answer, context, sources, confidence, relevance, difficulty, category, subcategory, tags, keywords, relatedQuestions, viewCount, helpfulCount, notHelpfulCount, feedback, metadata, createdAt, updatedAt}]
    metadata JSONB DEFAULT '{}', -- {totalQuestions, averageConfidence, averageRelevance, processingTime, model, language, lastUpdated, version, qualityScore, completeness, accuracy, coverage, diversity, customFields}
    settings JSONB DEFAULT '{}', -- {maxQuestions, difficulty, language, categories, includeContext, includeSources, confidenceThreshold, relevanceThreshold, model, temperature, maxTokens, promptTemplate, customInstructions, outputFormat, sorting, filtering, personalization}
    analytics JSONB DEFAULT '{}', -- {totalViews, uniqueViews, averageTimePerQuestion, mostViewedQuestions, searchQueries, userEngagement, performance, trends}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Table des questions de FAQ
CREATE TABLE IF NOT EXISTS faq_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faq_id UUID REFERENCES faqs(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    context TEXT,
    sources JSONB DEFAULT '[]', -- [{id, type, title, content, url, pageNumber, position, relevance, confidence, snippet, metadata}]
    confidence DECIMAL(3,2) DEFAULT 0.00 CHECK (confidence >= 0 AND confidence <= 1),
    relevance DECIMAL(3,2) DEFAULT 0.00 CHECK (relevance >= 0 AND relevance <= 1),
    difficulty VARCHAR(20) DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    related_questions TEXT[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    feedback JSONB DEFAULT '[]', -- [{id, userId, type, comment, rating, timestamp, metadata}]
    metadata JSONB DEFAULT '{}', -- {processingTime, model, temperature, tokensUsed, extractionMethod, confidenceScore, relevanceScore, qualityScore, language, sentiment, complexity, readability, wordCount, characterCount, sentenceCount, paragraphCount, customFields}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des feedbacks sur les questions
CREATE TABLE IF NOT EXISTS faq_question_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES faq_questions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('helpful', 'not_helpful', 'inaccurate', 'incomplete', 'confusing')),
    comment TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(question_id, user_id)
);

-- Table des templates de FAQ
CREATE TABLE IF NOT EXISTS faq_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    prompt_template TEXT NOT NULL,
    settings JSONB DEFAULT '{}', -- {maxQuestions, difficulty, language, categories, includeContext, includeSources, confidenceThreshold, relevanceThreshold, model, temperature, maxTokens}
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des catégories de FAQ
CREATE TABLE IF NOT EXISTS faq_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES faq_categories(id) ON DELETE SET NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    question_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exports de FAQ
CREATE TABLE IF NOT EXISTS faq_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faq_id UUID REFERENCES faqs(id) ON DELETE CASCADE,
    format VARCHAR(10) NOT NULL CHECK (format IN ('json', 'csv', 'xlsx', 'pdf', 'html', 'markdown')),
    options JSONB DEFAULT '{}', -- {includeMetadata, includeSources, includeAnalytics, includeFeedback, filterByCategory, filterByDifficulty, sortBy, sortOrder, format}
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT DEFAULT 0,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des statistiques de FAQ
CREATE TABLE IF NOT EXISTS faq_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_faqs INTEGER DEFAULT 0,
    published_faqs INTEGER DEFAULT 0,
    draft_faqs INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    average_questions_per_faq DECIMAL(5,2) DEFAULT 0.00,
    most_active_categories JSONB DEFAULT '[]', -- [{category, count, averageRating}]
    top_performing_questions JSONB DEFAULT '[]', -- [{question, viewCount, helpfulRate, confidence}]
    user_engagement JSONB DEFAULT '{}', -- {totalUsers, activeUsers, averageSessionsPerUser, averageQuestionsPerSession, feedbackRate, satisfactionScore}
    content_quality JSONB DEFAULT '{}', -- {averageConfidence, averageRelevance, averageQuality, completeness, accuracy}
    trends JSONB DEFAULT '{}', -- {faqGrowth, questionGrowth, categoryTrends, difficultyTrends}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, user_id)
);

-- Table des sessions de consultation de FAQ
CREATE TABLE IF NOT EXISTS faq_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faq_id UUID REFERENCES faqs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- en secondes
    questions_viewed TEXT[] DEFAULT '{}',
    questions_searched TEXT[] DEFAULT '{}',
    feedback_given INTEGER DEFAULT 0,
    device VARCHAR(50),
    browser VARCHAR(50),
    location VARCHAR(255),
    session_data JSONB DEFAULT '{}', -- {viewMode, searchQueries, interactionPattern}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des recherches dans les FAQs
CREATE TABLE IF NOT EXISTS faq_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faq_id UUID REFERENCES faqs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    results JSONB DEFAULT '[]', -- [{questionId, score, snippet}]
    result_count INTEGER DEFAULT 0,
    clicked_result_id TEXT,
    session_id VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device VARCHAR(50),
    success BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'
);

-- Index pour les performances
CREATE INDEX idx_faqs_document_id ON faqs(document_id);
CREATE INDEX idx_faqs_user_id ON faqs(user_id);
CREATE INDEX idx_faqs_status ON faqs(status);
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_created_at ON faqs(created_at DESC);
CREATE INDEX idx_faqs_updated_at ON faqs(updated_at DESC);
CREATE INDEX idx_faqs_published_at ON faqs(published_at DESC);
CREATE INDEX idx_faqs_tags ON faqs USING GIN (tags);

CREATE INDEX idx_faq_questions_faq_id ON faq_questions(faq_id);
CREATE INDEX idx_faq_questions_category ON faq_questions(category);
CREATE INDEX idx_faq_questions_difficulty ON faq_questions(difficulty);
CREATE INDEX idx_faq_questions_confidence ON faq_questions(confidence DESC);
CREATE INDEX idx_faq_questions_relevance ON faq_questions(relevance DESC);
CREATE INDEX idx_faq_questions_view_count ON faq_questions(view_count DESC);
CREATE INDEX idx_faq_questions_created_at ON faq_questions(created_at DESC);
CREATE INDEX idx_faq_questions_tags ON faq_questions USING GIN (tags);
CREATE INDEX idx_faq_questions_keywords ON faq_questions USING GIN (keywords);

CREATE INDEX idx_faq_question_feedback_question_id ON faq_question_feedback(question_id);
CREATE INDEX idx_faq_question_feedback_user_id ON faq_question_feedback(user_id);
CREATE INDEX idx_faq_question_feedback_type ON faq_question_feedback(type);
CREATE INDEX idx_faq_question_feedback_timestamp ON faq_question_feedback(timestamp DESC);

CREATE INDEX idx_faq_templates_category ON faq_templates(category);
CREATE INDEX idx_faq_templates_is_default ON faq_templates(is_default);
CREATE INDEX idx_faq_templates_is_active ON faq_templates(is_active);
CREATE INDEX idx_faq_templates_usage_count ON faq_templates(usage_count DESC);

CREATE INDEX idx_faq_categories_parent_id ON faq_categories(parent_id);
CREATE INDEX idx_faq_categories_is_active ON faq_categories(is_active);
CREATE INDEX idx_faq_categories_order_index ON faq_categories(order_index);

CREATE INDEX idx_faq_exports_faq_id ON faq_exports(faq_id);
CREATE INDEX idx_faq_exports_format ON faq_exports(format);
CREATE INDEX idx_faq_exports_status ON faq_exports(status);
CREATE INDEX idx_faq_exports_created_at ON faq_exports(created_at DESC);

CREATE INDEX idx_faq_statistics_date ON faq_statistics(date);
CREATE INDEX idx_faq_statistics_user_id ON faq_statistics(user_id);
CREATE INDEX idx_faq_statistics_created_at ON faq_statistics(created_at DESC);

CREATE INDEX idx_faq_sessions_faq_id ON faq_sessions(faq_id);
CREATE INDEX idx_faq_sessions_user_id ON faq_sessions(user_id);
CREATE INDEX idx_faq_sessions_session_id ON faq_sessions(session_id);
CREATE INDEX idx_faq_sessions_start_time ON faq_sessions(start_time DESC);
CREATE INDEX idx_faq_sessions_duration ON faq_sessions(duration DESC);

CREATE INDEX idx_faq_searches_faq_id ON faq_searches(faq_id);
CREATE INDEX idx_faq_searches_user_id ON faq_searches(user_id);
CREATE INDEX idx_faq_searches_query ON faq_searches(query);
CREATE INDEX idx_faq_searches_timestamp ON faq_searches(timestamp DESC);
CREATE INDEX idx_faq_searches_session_id ON faq_searches(session_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_faqs_updated_at 
    BEFORE UPDATE ON faqs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_questions_updated_at 
    BEFORE UPDATE ON faq_questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_templates_updated_at 
    BEFORE UPDATE ON faq_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_categories_updated_at 
    BEFORE UPDATE ON faq_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_statistics_updated_at 
    BEFORE UPDATE ON faq_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_sessions_updated_at 
    BEFORE UPDATE ON faq_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_faq_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO faq_statistics (
        date,
        user_id,
        total_faqs,
        published_faqs,
        draft_faqs,
        total_questions,
        average_questions_per_faq,
        most_active_categories,
        top_performing_questions,
        user_engagement,
        content_quality,
        trends
    )
    SELECT 
        CURRENT_DATE,
        NEW.user_id,
        (SELECT COUNT(*) FROM faqs WHERE user_id = NEW.user_id),
        (SELECT COUNT(*) FROM faqs WHERE user_id = NEW.user_id AND status = 'published'),
        (SELECT COUNT(*) FROM faqs WHERE user_id = NEW.user_id AND status = 'draft'),
        (SELECT COUNT(*) FROM faq_questions fq JOIN faqs f ON fq.faq_id = f.id WHERE f.user_id = NEW.user_id),
        COALESCE(
            (SELECT AVG(question_count)::DECIMAL 
             FROM (SELECT COUNT(*) as question_count 
                   FROM faq_questions fq 
                   JOIN faqs f ON fq.faq_id = f.id 
                   WHERE f.user_id = NEW.user_id 
                   GROUP BY f.id) t), 
            0
        ),
        (SELECT jsonb_agg(
            jsonb_build_object(
                'category', category,
                'count', COUNT(*),
                'averageRating', COALESCE(AVG(helpful_count::DECIMAL / NULLIF(helpful_count + not_helpful_count, 0)), 0)
            )
        ) FROM faqs WHERE user_id = NEW.user_id GROUP BY category),
        (SELECT jsonb_agg(
            jsonb_build_object(
                'question', question,
                'viewCount', view_count,
                'helpfulRate', COALESCE(helpful_count::DECIMAL / NULLIF(helpful_count + not_helpful_count, 0), 0),
                'confidence', confidence
            )
        ) FROM faq_questions fq 
         JOIN faqs f ON fq.faq_id = f.id 
         WHERE f.user_id = NEW.user_id 
         ORDER BY view_count DESC 
         LIMIT 10),
        jsonb_build_object(
            'totalUsers', (SELECT COUNT(DISTINCT user_id) FROM faqs WHERE user_id = NEW.user_id),
            'activeUsers', (SELECT COUNT(DISTINCT user_id) FROM faqs WHERE user_id = NEW.user_id AND DATE(updated_at) >= CURRENT_DATE - INTERVAL '7 days'),
            'averageSessionsPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) 
                 FROM faq_sessions 
                 WHERE user_id = NEW.user_id AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'averageQuestionsPerSession', COALESCE(
                (SELECT AVG(array_length(questions_viewed, 1))::INTEGER 
                 FROM faq_sessions 
                 WHERE user_id = NEW.user_id AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'feedbackRate', COALESCE(
                (SELECT (COUNT(*) FILTER (WHERE feedback_given > 0))::DECIMAL / NULLIF(COUNT(*), 0) * 100 
                 FROM faq_sessions 
                 WHERE user_id = NEW.user_id AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'satisfactionScore', COALESCE(
                (SELECT AVG(helpful_count::DECIMAL / NULLIF(helpful_count + not_helpful_count, 0)) * 100 
                 FROM faq_questions fq 
                 JOIN faqs f ON fq.faq_id = f.id 
                 WHERE f.user_id = NEW.user_id 
                 AND fq.helpful_count + fq.not_helpful_count > 0), 
                0
            )
        ),
        jsonb_build_object(
            'averageConfidence', COALESCE(AVG(confidence), 0),
            'averageRelevance', COALESCE(AVG(relevance), 0),
            'averageQuality', COALESCE(AVG((metadata->>'qualityScore')::DECIMAL), 0),
            'completeness', COALESCE(AVG((metadata->>'completeness')::DECIMAL), 0),
            'accuracy', COALESCE(AVG((metadata->>'accuracy')::DECIMAL), 0)
        ),
        jsonb_build_object(
            'faqGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM faqs 
                WHERE user_id = NEW.user_id AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            ),
            'questionGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM faq_questions fq 
                JOIN faqs f ON fq.faq_id = f.id 
                WHERE f.user_id = NEW.user_id AND DATE(fq.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', fq.created_at) 
                ORDER BY DATE_TRUNC('month', fq.created_at)
            ),
            'categoryTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT category),
                    ARRAY_AGG(COUNT(*))
                )
                FROM faqs 
                WHERE user_id = NEW.user_id 
                AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY category
            ),
            'difficultyTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT difficulty),
                    ARRAY_AGG(COUNT(*))
                )
                FROM faqs 
                WHERE user_id = NEW.user_id 
                AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY difficulty
            )
        )
    ON CONFLICT (date, user_id) DO UPDATE SET
        total_faqs = EXCLUDED.total_faqs,
        published_faqs = EXCLUDED.published_faqs,
        draft_faqs = EXCLUDED.draft_faqs,
        total_questions = EXCLUDED.total_questions,
        average_questions_per_faq = EXCLUDED.average_questions_per_faq,
        most_active_categories = EXCLUDED.most_active_categories,
        top_performing_questions = EXCLUDED.top_performing_questions,
        user_engagement = EXCLUDED.user_engagement,
        content_quality = EXCLUDED.content_quality,
        trends = EXCLUDED.trends,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_faq_statistics_faqs
    AFTER INSERT OR UPDATE OR DELETE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_faq_statistics();

CREATE TRIGGER trigger_update_faq_statistics_questions
    AFTER INSERT OR UPDATE OR DELETE ON faq_questions
    FOR EACH ROW EXECUTE FUNCTION update_faq_statistics();

CREATE TRIGGER trigger_update_faq_statistics_feedback
    AFTER INSERT OR UPDATE ON faq_question_feedback
    FOR EACH ROW EXECUTE FUNCTION update_faq_statistics();

-- Politiques RLS pour les FAQs
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own faqs" ON faqs
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view published faqs" ON faqs
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can view all faqs" ON faqs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les questions de FAQ
ALTER TABLE faq_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view questions of accessible faqs" ON faq_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM faqs f
            WHERE f.id = faq_id 
            AND (f.user_id = auth.uid() OR f.status = 'published')
        )
    );

CREATE POLICY "Admins can view all faq questions" ON faq_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les feedbacks
ALTER TABLE faq_question_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own faq feedback" ON faq_question_feedback
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all faq feedback" ON faq_question_feedback
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
ALTER TABLE faq_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active faq templates" ON faq_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage faq templates" ON faq_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les catégories
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active faq categories" ON faq_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage faq categories" ON faq_categories
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
ALTER TABLE faq_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own faq exports" ON faq_exports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM faqs f
            WHERE f.id = faq_id AND f.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all faq exports" ON faq_exports
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
ALTER TABLE faq_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own faq statistics" ON faq_statistics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all faq statistics" ON faq_statistics
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
ALTER TABLE faq_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own faq sessions" ON faq_sessions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all faq sessions" ON faq_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les recherches
ALTER TABLE faq_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own faq searches" ON faq_searches
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all faq searches" ON faq_searches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour les FAQs

-- Fonction pour obtenir les statistiques des FAQs
CREATE OR REPLACE FUNCTION get_faq_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_faqs BIGINT,
    published_faqs BIGINT,
    draft_faqs BIGINT,
    total_questions BIGINT,
    average_questions_per_faq DECIMAL(5,2),
    most_active_categories JSONB,
    top_performing_questions JSONB,
    user_engagement JSONB,
    content_quality JSONB,
    trends JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(total_faqs), 0),
        COALESCE(SUM(published_faqs), 0),
        COALESCE(SUM(draft_faqs), 0),
        COALESCE(SUM(total_questions), 0),
        COALESCE(AVG(average_questions_per_faq), 0),
        (SELECT jsonb_agg(most_active_categories) FROM (
            SELECT jsonb_build_object(
                'category', category,
                'count', count,
                'averageRating', averageRating
            ) as most_active_categories
            FROM (
                SELECT 
                    category,
                    COUNT(*) as count,
                    COALESCE(AVG(helpful_count::DECIMAL / NULLIF(helpful_count + not_helpful_count, 0)), 0) as averageRating
                FROM faqs 
                WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                GROUP BY category
            ) t
        ) sub),
        (SELECT jsonb_agg(top_performing_questions) FROM (
            SELECT jsonb_build_object(
                'question', question,
                'viewCount', viewCount,
                'helpfulRate', helpfulRate,
                'confidence', confidence
            ) as top_performing_questions
            FROM (
                SELECT 
                    question,
                    view_count,
                    COALESCE(helpful_count::DECIMAL / NULLIF(helpful_count + not_helpful_count, 0), 0) as helpfulRate,
                    confidence
                FROM faq_questions fq 
                JOIN faqs f ON fq.faq_id = f.id 
                WHERE (p_user_id IS NULL OR f.user_id = p_user_id) 
                ORDER BY view_count DESC 
                LIMIT 10
            ) t
        ) sub),
        jsonb_build_object(
            'totalUsers', (SELECT COUNT(DISTINCT user_id) FROM faqs WHERE (p_user_id IS NULL OR user_id = p_user_id)),
            'activeUsers', (SELECT COUNT(DISTINCT user_id) FROM faqs WHERE (p_user_id IS NULL OR user_id = p_user_id) AND DATE(updated_at) >= CURRENT_DATE - INTERVAL '7 days'),
            'averageSessionsPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) 
                 FROM faq_sessions 
                 WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                 AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'averageQuestionsPerSession', COALESCE(
                (SELECT AVG(array_length(questions_viewed, 1))::INTEGER 
                 FROM faq_sessions 
                 WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                 AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'feedbackRate', COALESCE(
                (SELECT (COUNT(*) FILTER (WHERE feedback_given > 0))::DECIMAL / NULLIF(COUNT(*), 0) * 100 
                 FROM faq_sessions 
                 WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                 AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'satisfactionScore', COALESCE(
                (SELECT AVG(helpful_count::DECIMAL / NULLIF(helpful_count + not_helpful_count, 0)) * 100 
                 FROM faq_questions fq 
                 JOIN faqs f ON fq.faq_id = f.id 
                 WHERE (p_user_id IS NULL OR f.user_id = p_user_id) 
                 AND fq.helpful_count + fq.not_helpful_count > 0), 
                0
            )
        ),
        jsonb_build_object(
            'averageConfidence', COALESCE(AVG(confidence), 0),
            'averageRelevance', COALESCE(AVG(relevance), 0),
            'averageQuality', COALESCE(AVG((metadata->>'qualityScore')::DECIMAL), 0),
            'completeness', COALESCE(AVG((metadata->>'completeness')::DECIMAL), 0),
            'accuracy', COALESCE(AVG((metadata->>'accuracy')::DECIMAL), 0)
        ),
        jsonb_build_object(
            'faqGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM faqs 
                WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            ),
            'questionGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM faq_questions fq 
                JOIN faqs f ON fq.faq_id = f.id 
                WHERE (p_user_id IS NULL OR f.user_id = p_user_id) 
                AND DATE(fq.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', fq.created_at) 
                ORDER BY DATE_TRUNC('month', fq.created_at)
            ),
            'categoryTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT category),
                    ARRAY_AGG(COUNT(*))
                )
                FROM faqs 
                WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY category
            ),
            'difficultyTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT difficulty),
                    ARRAY_AGG(COUNT(*))
                )
                FROM faqs 
                WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY difficulty
            )
        )
    FROM faq_statistics
    WHERE (p_user_id IS NULL OR user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les templates de FAQ par défaut
CREATE OR REPLACE FUNCTION create_default_faq_templates()
RETURNS VOID AS $$
BEGIN
    INSERT INTO faq_templates (
        name,
        description,
        category,
        prompt_template,
        settings,
        is_default,
        is_active
    ) VALUES 
        ('FAQ Général', 'Template standard pour générer des FAQ générales', 
         'général',
         'Génère une FAQ complète avec des questions et réponses pertinentes basées sur le contenu fourni. Inclut des questions sur les fonctionnalités principales, l''utilisation, et les aspects importants du document.',
         '{"maxQuestions": 10, "difficulty": "mixed", "language": "fr", "confidenceThreshold": 0.7, "relevanceThreshold": 0.7, "model": "gpt-4", "temperature": 0.3}',
         true, true),
        ('FAQ Technique', 'Template spécialisé pour documentation technique', 
         'technique',
         'Génère une FAQ axée sur les aspects techniques, l''installation, la configuration, et le dépannage. Questions plus détaillées avec des réponses précises et des étapes claires.',
         '{"maxQuestions": 15, "difficulty": "intermediate", "language": "fr", "confidenceThreshold": 0.8, "relevanceThreshold": 0.8, "model": "gpt-4", "temperature": 0.2}',
         false, true),
        ('FAQ Utilisateur', 'Template pour guides d''utilisation', 
         'utilisateur',
         'Génère une FAQ orientée utilisateur avec des questions simples et directes sur l''utilisation quotidienne. Réponses claires et concises adaptées aux débutants.',
         '{"maxQuestions": 8, "difficulty": "beginner", "language": "fr", "confidenceThreshold": 0.6, "relevanceThreshold": 0.6, "model": "gpt-3.5-turbo", "temperature": 0.4}',
         false, true),
        ('FAQ Avancée', 'Template pour documents complexes', 
         'avancée',
         'Génère une FAQ complète avec des questions avancées, des cas d''usage complexes, et des réponses détaillées. Inclut des références croisées et des liens internes.',
         '{"maxQuestions": 20, "difficulty": "advanced", "language": "fr", "confidenceThreshold": 0.9, "relevanceThreshold": 0.9, "model": "gpt-4", "temperature": 0.1}',
         false, true)
    ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        prompt_template = EXCLUDED.prompt_template,
        settings = EXCLUDED.settings,
        is_default = EXCLUDED.is_default,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les catégories de FAQ par défaut
CREATE OR REPLACE FUNCTION create_default_faq_categories()
RETURNS VOID AS $$
BEGIN
    INSERT INTO faq_categories (
        name,
        description,
        icon,
        color,
        order_index,
        is_active
    ) VALUES 
        ('Général', 'Questions générales et d''introduction', 'help', '#6B7280', 1, true),
        ('Installation', 'Questions sur l''installation et la configuration', 'download', '#10B981', 2, true),
        ('Utilisation', 'Questions sur l''utilisation quotidienne', 'play', '#3B82F6', 3, true),
        ('Fonctionnalités', 'Questions sur les fonctionnalités spécifiques', 'star', '#8B5CF6', 4, true),
        ('Dépannage', 'Questions sur les problèmes et solutions', 'tool', '#EF4444', 5, true),
        ('Sécurité', 'Questions sur la sécurité et la confidentialité', 'lock', '#F59E0B', 6, true),
        ('Support', 'Questions sur le support technique', 'phone', '#06B6D4', 7, true),
        ('Tarifs', 'Questions sur les prix et abonnements', 'credit-card', '#84CC16', 8, true)
    ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        color = EXCLUDED.color,
        order_index = EXCLUDED.order_index,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_faq_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO faq_statistics (
        date,
        user_id,
        total_faqs,
        published_faqs,
        draft_faqs,
        total_questions,
        average_questions_per_faq,
        most_active_categories,
        top_performing_questions,
        user_engagement,
        content_quality,
        trends
    )
    SELECT 
        p_date,
        f.user_id,
        COUNT(*) as total_faqs,
        COUNT(*) FILTER (WHERE f.status = 'published') as published_faqs,
        COUNT(*) FILTER (WHERE f.status = 'draft') as draft_faqs,
        COALESCE(faq_counts.question_count, 0) as total_questions,
        COALESCE(faq_counts.question_count::DECIMAL / NULLIF(COUNT(*), 0), 0) as average_questions_per_faq,
        (SELECT jsonb_agg(
            jsonb_build_object(
                'category', category,
                'count', COUNT(*),
                'averageRating', COALESCE(AVG(helpful_count::DECIMAL / NULLIF(helpful_count + not_helpful_count, 0)), 0)
            )
        ) FROM faqs WHERE user_id = f.user_id AND DATE(created_at) = p_date GROUP BY category),
        (SELECT jsonb_agg(
            jsonb_build_object(
                'question', question,
                'viewCount', view_count,
                'helpfulRate', COALESCE(helpful_count::DECIMAL / NULLIF(helpful_count + not_helpful_count, 0), 0),
                'confidence', confidence
            )
        ) FROM faq_questions fq 
         JOIN faqs f2 ON fq.faq_id = f2.id 
         WHERE f2.user_id = f.user_id AND DATE(fq.created_at) = p_date 
         ORDER BY view_count DESC 
         LIMIT 10),
        jsonb_build_object(
            'totalUsers', 1,
            'activeUsers', CASE WHEN DATE(f.updated_at) >= p_date - INTERVAL '7 days' THEN 1 ELSE 0 END,
            'averageSessionsPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) 
                 FROM faq_sessions 
                 WHERE user_id = f.user_id AND DATE(start_time) >= p_date - INTERVAL '7 days'), 
                0
            ),
            'averageQuestionsPerSession', COALESCE(
                (SELECT AVG(array_length(questions_viewed, 1))::INTEGER 
                 FROM faq_sessions 
                 WHERE user_id = f.user_id AND DATE(start_time) >= p_date - INTERVAL '7 days'), 
                0
            ),
            'feedbackRate', COALESCE(
                (SELECT (COUNT(*) FILTER (WHERE feedback_given > 0))::DECIMAL / NULLIF(COUNT(*), 0) * 100 
                 FROM faq_sessions 
                 WHERE user_id = f.user_id AND DATE(start_time) >= p_date - INTERVAL '7 days'), 
                0
            ),
            'satisfactionScore', COALESCE(
                (SELECT AVG(helpful_count::DECIMAL / NULLIF(helpful_count + not_helpful_count, 0)) * 100 
                 FROM faq_questions fq 
                 JOIN faqs f2 ON fq.faq_id = f2.id 
                 WHERE f2.user_id = f.user_id 
                 AND fq.helpful_count + fq.not_helpful_count > 0), 
                0
            )
        ),
        jsonb_build_object(
            'averageConfidence', COALESCE(AVG(confidence), 0),
            'averageRelevance', COALESCE(AVG(relevance), 0),
            'averageQuality', COALESCE(AVG((metadata->>'qualityScore')::DECIMAL), 0),
            'completeness', COALESCE(AVG((metadata->>'completeness')::DECIMAL), 0),
            'accuracy', COALESCE(AVG((metadata->>'accuracy')::DECIMAL), 0)
        ),
        jsonb_build_object(
            'faqGrowth', ARRAY(SELECT COUNT(*) FROM faqs WHERE user_id = f.user_id AND DATE(created_at) >= p_date - INTERVAL '12 months' GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)),
            'questionGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM faq_questions fq 
                JOIN faqs f2 ON fq.faq_id = f2.id 
                WHERE f2.user_id = f.user_id AND DATE(fq.created_at) >= p_date - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', fq.created_at) 
                ORDER BY DATE_TRUNC('month', fq.created_at)
            ),
            'categoryTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT category),
                    ARRAY_AGG(COUNT(*))
                )
                FROM faqs 
                WHERE user_id = f.user_id AND DATE(created_at) >= p_date - INTERVAL '12 months' 
                GROUP BY category
            ),
            'difficultyTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT difficulty),
                    ARRAY_AGG(COUNT(*))
                )
                FROM faqs 
                WHERE user_id = f.user_id AND DATE(created_at) >= p_date - INTERVAL '12 months' 
                GROUP BY difficulty
            )
        )
    FROM faqs f
    LEFT JOIN (
        SELECT faq_id, COUNT(*) as question_count
        FROM faq_questions fq
        JOIN faqs f2 ON fq.faq_id = f2.id
        WHERE DATE(fq.created_at) = p_date
        GROUP BY faq_id
    ) faq_counts ON f.id = faq_counts.faq_id
    WHERE DATE(f.created_at) = p_date
    GROUP BY f.user_id, faq_counts.question_count
    ON CONFLICT (date, user_id) DO UPDATE SET
        total_faqs = EXCLUDED.total_faqs,
        published_faqs = EXCLUDED.published_faqs,
        draft_faqs = EXCLUDED.draft_faqs,
        total_questions = EXCLUDED.total_questions,
        average_questions_per_faq = EXCLUDED.average_questions_per_faq,
        most_active_categories = EXCLUDED.most_active_categories,
        top_performing_questions = EXCLUDED.top_performing_questions,
        user_engagement = EXCLUDED.user_engagement,
        content_quality = EXCLUDED.content_quality,
        trends = EXCLUDED.trends,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE faqs IS 'FAQs générées automatiquement avec questions, réponses et métadonnées';
COMMENT ON TABLE faq_questions IS 'Questions individuelles des FAQs avec sources, feedback et analytics';
COMMENT ON TABLE faq_question_feedback IS 'Feedback des utilisateurs sur les questions de FAQ';
COMMENT ON TABLE faq_templates IS 'Templates de génération de FAQ avec paramètres configurables';
COMMENT ON TABLE faq_categories IS 'Catégories de FAQ pour organisation et navigation';
COMMENT ON TABLE faq_exports IS 'Exports de FAQs dans différents formats';
COMMENT ON TABLE faq_statistics IS 'Statistiques d''utilisation et de performance des FAQs';
COMMENT ON TABLE faq_sessions IS 'Sessions de consultation de FAQ avec tracking utilisateur';
COMMENT ON TABLE faq_searches IS 'Recherches effectuées dans les FAQs avec analytics';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN faqs.questions IS 'Questions de la FAQ [{id, question, answer, context, sources, confidence, relevance, difficulty, category, subcategory, tags, keywords, relatedQuestions, viewCount, helpfulCount, notHelpfulCount, feedback, metadata, createdAt, updatedAt}]';
COMMENT ON COLUMN faqs.metadata IS 'Métadonnées de la FAQ {totalQuestions, averageConfidence, averageRelevance, processingTime, model, language, lastUpdated, version, qualityScore, completeness, accuracy, coverage, diversity, customFields}';
COMMENT ON COLUMN faqs.settings IS 'Paramètres de génération {maxQuestions, difficulty, language, categories, includeContext, includeSources, confidenceThreshold, relevanceThreshold, model, temperature, maxTokens, promptTemplate, customInstructions, outputFormat, sorting, filtering, personalization}';
COMMENT ON COLUMN faqs.analytics IS 'Analytics d\'utilisation {totalViews, uniqueViews, averageTimePerQuestion, mostViewedQuestions, searchQueries, userEngagement, performance, trends}';
COMMENT ON COLUMN faq_questions.sources IS 'Sources de la question [{id, type, title, content, url, pageNumber, position, relevance, confidence, snippet, metadata}]';
COMMENT ON COLUMN faq_questions.feedback IS 'Feedback des utilisateurs [{id, userId, type, comment, rating, timestamp, metadata}]';
COMMENT ON COLUMN faq_questions.metadata IS 'Métadonnées de la question {processingTime, model, temperature, tokensUsed, extractionMethod, confidenceScore, relevanceScore, qualityScore, language, sentiment, complexity, readability, wordCount, characterCount, sentenceCount, paragraphCount, customFields}';
COMMENT ON COLUMN faq_templates.prompt_template IS 'Template de prompt pour la génération de FAQ';
COMMENT ON COLUMN faq_statistics.trends IS 'Tendances d\'utilisation {faqGrowth, questionGrowth, categoryTrends, difficultyTrends}';
COMMENT ON COLUMN faq_statistics.user_engagement IS 'Engagement utilisateur {totalUsers, activeUsers, averageSessionsPerUser, averageQuestionsPerSession, feedbackRate, satisfactionScore}';
COMMENT ON COLUMN faq_statistics.content_quality IS 'Qualité du contenu {averageConfidence, averageRelevance, averageQuality, completeness, accuracy}';

-- Créer les données par défaut
SELECT create_default_faq_templates();
SELECT create_default_faq_categories();
