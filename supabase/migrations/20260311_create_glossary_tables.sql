-- Migration: Création des tables pour les glossaires automatiques
-- Date: 11 mars 2026
-- Description: Tables pour gérer les glossaires avec termes clés extraits automatiquement

-- Table principale des glossaires
CREATE TABLE IF NOT EXISTS glossaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    language VARCHAR(10) DEFAULT 'fr',
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('technical', 'business', 'academic', 'legal', 'medical', 'scientific', 'general', 'domain_specific', 'multilingual', 'custom')),
    terms JSONB DEFAULT '[]', -- [{id, term, definition, context, synonyms, antonyms, relatedTerms, translations, examples, etymology, pronunciation, partOfSpeech, difficulty, frequency, category, subcategory, tags, keywords, sources, media, metadata, style, interactions, createdAt, updatedAt}]
    settings JSONB DEFAULT '{}', -- {maxTerms, language, targetLanguages, categories, difficulty, frequency, includeSynonyms, includeAntonyms, includeTranslations, includeExamples, includeEtymology, includePronunciation, minFrequency, maxFrequency, sortBy, sortOrder, grouping, filtering, visualization, export, personalization}
    metadata JSONB DEFAULT '{}', -- {totalTerms, uniqueTerms, averageTermLength, averageDefinitionLength, categories, partsOfSpeech, difficulties, frequencies, languages, quality, extraction, linguisticAnalysis, version, lastUpdated, customFields}
    analytics JSONB DEFAULT '{}', -- {totalViews, uniqueViews, averageSessionDuration, mostViewedTerms, userEngagement, learningPatterns, contentPerformance, trends}
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'reviewing', 'approved', 'published', 'archived', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Table des termes de glossaire
CREATE TABLE IF NOT EXISTS glossary_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    glossary_id UUID REFERENCES glossaries(id) ON DELETE CASCADE,
    term VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    context TEXT,
    synonyms TEXT[] DEFAULT '{}',
    antonyms TEXT[] DEFAULT '{}',
    related_terms TEXT[] DEFAULT '{}',
    translations JSONB DEFAULT '[]', -- [{language, term, definition, pronunciation, confidence, source}]
    examples JSONB DEFAULT '[]', -- [{id, text, translation, context, source, difficulty, highlighted}]
    etymology TEXT,
    pronunciation VARCHAR(255),
    part_of_speech VARCHAR(20) DEFAULT 'noun' CHECK (part_of_speech IN ('noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'article', 'numeral', 'abbreviation', 'acronym', 'unknown')),
    difficulty VARCHAR(20) DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    frequency VARCHAR(20) DEFAULT 'common' CHECK (frequency IN ('rare', 'uncommon', 'common', 'frequent', 'very_frequent')),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    sources JSONB DEFAULT '[]', -- [{id, type, title, content, url, pageNumber, position, relevance, confidence, snippet, occurrences, metadata}]
    media JSONB DEFAULT '[]', -- [{id, type, url, title, description, thumbnail, duration, size, format, metadata}]
    metadata JSONB DEFAULT '{}', -- {extractionMethod, confidence, relevance, accuracy, completeness, processingTime, model, temperature, tokensUsed, language, sentiment, complexity, readability, wordCount, characterCount, semanticContext, linguisticFeatures, domainSpecificity, customFields}
    style JSONB DEFAULT '{}', -- {color, backgroundColor, borderColor, borderWidth, borderStyle, borderRadius, opacity, fontSize, fontFamily, fontWeight, fontStyle, icon, iconSize, iconColor, shadow, animation}
    interactions JSONB DEFAULT '[]', -- [{id, userId, type, timestamp, metadata}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des traductions de termes
CREATE TABLE IF NOT EXISTS glossary_term_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID REFERENCES glossary_terms(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    term VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    pronunciation VARCHAR(255),
    confidence DECIMAL(3,2) DEFAULT 0.00 CHECK (confidence >= 0 AND confidence <= 1),
    source VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(term_id, language)
);

-- Table des exemples de termes
CREATE TABLE IF NOT EXISTS glossary_term_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID REFERENCES glossary_terms(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    translation TEXT,
    context VARCHAR(255),
    source VARCHAR(255),
    difficulty VARCHAR(20) DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    highlighted TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sources de termes
CREATE TABLE IF NOT EXISTS glossary_term_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID REFERENCES glossary_terms(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('document', 'page', 'section', 'paragraph', 'sentence', 'annotation', 'url')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    url TEXT,
    page_number INTEGER,
    position JSONB DEFAULT '{}', -- {x, y, width, height, pageNumber, startIndex, endIndex}
    relevance DECIMAL(3,2) DEFAULT 0.00 CHECK (relevance >= 0 AND relevance <= 1),
    confidence DECIMAL(3,2) DEFAULT 0.00 CHECK (confidence >= 0 AND confidence <= 1),
    snippet TEXT,
    occurrences INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des médias de termes
CREATE TABLE IF NOT EXISTS glossary_term_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID REFERENCES glossary_terms(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video', 'audio', 'diagram', 'chart', 'animation', 'infographic')),
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

-- Table des interactions de termes
CREATE TABLE IF NOT EXISTS glossary_term_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID REFERENCES glossary_terms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('view', 'click', 'share', 'comment', 'like', 'bookmark', 'edit', 'translate', 'pronounce')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des templates de glossaire
CREATE TABLE IF NOT EXISTS glossary_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('technical', 'business', 'academic', 'legal', 'medical', 'scientific', 'general', 'domain_specific', 'multilingual', 'custom')),
    prompt TEXT NOT NULL,
    settings JSONB DEFAULT '{}', -- {maxTerms, language, targetLanguages, categories, difficulty, frequency, includeSynonyms, includeAntonyms, includeTranslations, includeExamples, includeEtymology, includePronunciation, minFrequency, maxFrequency, sortBy, sortOrder, grouping, filtering, visualization, export, personalization}
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exports de glossaire
CREATE TABLE IF NOT EXISTS glossary_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    glossary_id UUID REFERENCES glossaries(id) ON DELETE CASCADE,
    format VARCHAR(10) NOT NULL CHECK (format IN ('json', 'csv', 'xlsx', 'pdf', 'html', 'xml', 'txt')),
    options JSONB DEFAULT '{}', -- {format, quality, includeMetadata, includeMedia, includeInteractions, includeTranslations, includeExamples, language, customOptions}
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT DEFAULT 0,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des statistiques de glossaire
CREATE TABLE IF NOT EXISTS glossary_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_glossaries INTEGER DEFAULT 0,
    published_glossaries INTEGER DEFAULT 0,
    draft_glossaries INTEGER DEFAULT 0,
    total_terms INTEGER DEFAULT 0,
    average_terms_per_glossary DECIMAL(5,2) DEFAULT 0.00,
    most_active_types JSONB DEFAULT '{}', -- {type: count}
    most_active_categories JSONB DEFAULT '{}', -- {category: count}
    top_performing_glossaries JSONB DEFAULT '[]', -- [{glossaryId, title, viewCount, averageRating, termCount}]
    user_engagement JSONB DEFAULT '{}', -- {totalUsers, activeUsers, averageGlossariesPerUser, averageTermsPerUser, averageSessionDuration, satisfactionScore}
    content_quality JSONB DEFAULT '{}', -- {averageConfidence, averageRelevance, averageAccuracy, averageCompleteness, extractionSuccessRate}
    trends JSONB DEFAULT '{}', -- {glossaryGrowth, termGrowth, typeTrends, categoryTrends}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, user_id)
);

-- Table des sessions de consultation de glossaire
CREATE TABLE IF NOT EXISTS glossary_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    glossary_id UUID REFERENCES glossaries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- en secondes
    terms_viewed TEXT[] DEFAULT '{}',
    terms_searched TEXT[] DEFAULT '{}',
    terms_translated TEXT[] DEFAULT '{}',
    terms_pronounced TEXT[] DEFAULT '{}',
    interactions_count INTEGER DEFAULT 0,
    device VARCHAR(50),
    browser VARCHAR(50),
    location VARCHAR(255),
    session_data JSONB DEFAULT '{}', -- {viewMode, searchQueries, learningProgress, interactionPattern}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_glossaries_document_id ON glossaries(document_id);
CREATE INDEX idx_glossaries_user_id ON glossaries(user_id);
CREATE INDEX idx_glossaries_type ON glossaries(type);
CREATE INDEX idx_glossaries_language ON glossaries(language);
CREATE INDEX idx_glossaries_status ON glossaries(status);
CREATE INDEX idx_glossaries_created_at ON glossaries(created_at DESC);
CREATE INDEX idx_glossaries_updated_at ON glossaries(updated_at DESC);
CREATE INDEX idx_glossaries_published_at ON glossaries(published_at DESC);

CREATE INDEX idx_glossary_terms_glossary_id ON glossary_terms(glossary_id);
CREATE INDEX idx_glossary_terms_term ON glossary_terms(term);
CREATE INDEX idx_glossary_terms_category ON glossary_terms(category);
CREATE INDEX idx_glossary_terms_part_of_speech ON glossary_terms(part_of_speech);
CREATE INDEX idx_glossary_terms_difficulty ON glossary_terms(difficulty);
CREATE INDEX idx_glossary_terms_frequency ON glossary_terms(frequency);
CREATE INDEX idx_glossary_terms_created_at ON glossary_terms(created_at DESC);
CREATE INDEX idx_glossary_terms_tags ON glossary_terms USING GIN (tags);
CREATE INDEX idx_glossary_terms_keywords ON glossary_terms USING GIN (keywords);

CREATE INDEX idx_glossary_term_translations_term_id ON glossary_term_translations(term_id);
CREATE INDEX idx_glossary_term_translations_language ON glossary_term_translations(language);
CREATE INDEX idx_glossary_term_translations_confidence ON glossary_term_translations(confidence DESC);

CREATE INDEX idx_glossary_term_examples_term_id ON glossary_term_examples(term_id);
CREATE INDEX idx_glossary_term_examples_difficulty ON glossary_term_examples(difficulty);
CREATE INDEX idx_glossary_term_examples_created_at ON glossary_term_examples(created_at DESC);

CREATE INDEX idx_glossary_term_sources_term_id ON glossary_term_sources(term_id);
CREATE INDEX idx_glossary_term_sources_type ON glossary_term_sources(type);
CREATE INDEX idx_glossary_term_sources_relevance ON glossary_term_sources(relevance DESC);
CREATE INDEX idx_glossary_term_sources_confidence ON glossary_term_sources(confidence DESC);

CREATE INDEX idx_glossary_term_media_term_id ON glossary_term_media(term_id);
CREATE INDEX idx_glossary_term_media_type ON glossary_term_media(type);
CREATE INDEX idx_glossary_term_media_created_at ON glossary_term_media(created_at DESC);

CREATE INDEX idx_glossary_term_interactions_term_id ON glossary_term_interactions(term_id);
CREATE INDEX idx_glossary_term_interactions_user_id ON glossary_term_interactions(user_id);
CREATE INDEX idx_glossary_term_interactions_type ON glossary_term_interactions(type);
CREATE INDEX idx_glossary_term_interactions_timestamp ON glossary_term_interactions(timestamp DESC);

CREATE INDEX idx_glossary_templates_type ON glossary_templates(type);
CREATE INDEX idx_glossary_templates_is_default ON glossary_templates(is_default);
CREATE INDEX idx_glossary_templates_is_active ON glossary_templates(is_active);
CREATE INDEX idx_glossary_templates_usage_count ON glossary_templates(usage_count DESC);

CREATE INDEX idx_glossary_exports_glossary_id ON glossary_exports(glossary_id);
CREATE INDEX idx_glossary_exports_format ON glossary_exports(format);
CREATE INDEX idx_glossary_exports_status ON glossary_exports(status);
CREATE INDEX idx_glossary_exports_created_at ON glossary_exports(created_at DESC);

CREATE INDEX idx_glossary_statistics_date ON glossary_statistics(date);
CREATE INDEX idx_glossary_statistics_user_id ON glossary_statistics(user_id);
CREATE INDEX idx_glossary_statistics_created_at ON glossary_statistics(created_at DESC);

CREATE INDEX idx_glossary_sessions_glossary_id ON glossary_sessions(glossary_id);
CREATE INDEX idx_glossary_sessions_user_id ON glossary_sessions(user_id);
CREATE INDEX idx_glossary_sessions_session_id ON glossary_sessions(session_id);
CREATE INDEX idx_glossary_sessions_start_time ON glossary_sessions(start_time DESC);
CREATE INDEX idx_glossary_sessions_duration ON glossary_sessions(duration DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_glossaries_updated_at 
    BEFORE UPDATE ON glossaries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_glossary_terms_updated_at 
    BEFORE UPDATE ON glossary_terms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_glossary_templates_updated_at 
    BEFORE UPDATE ON glossary_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_glossary_statistics_updated_at 
    BEFORE UPDATE ON glossary_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_glossary_sessions_updated_at 
    BEFORE UPDATE ON glossary_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_glossary_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO glossary_statistics (
        date,
        user_id,
        total_glossaries,
        published_glossaries,
        draft_glossaries,
        total_terms,
        average_terms_per_glossary,
        most_active_types,
        most_active_categories,
        top_performing_glossaries,
        user_engagement,
        content_quality,
        trends
    )
    SELECT 
        CURRENT_DATE,
        NEW.user_id,
        (SELECT COUNT(*) FROM glossaries WHERE user_id = NEW.user_id),
        (SELECT COUNT(*) FROM glossaries WHERE user_id = NEW.user_id AND status = 'published'),
        (SELECT COUNT(*) FROM glossaries WHERE user_id = NEW.user_id AND status = 'draft'),
        (SELECT COUNT(*) FROM glossary_terms gt JOIN glossaries g ON gt.glossary_id = g.id WHERE g.user_id = NEW.user_id),
        COALESCE(
            (SELECT AVG(term_count)::DECIMAL 
             FROM (SELECT COUNT(*) as term_count 
                   FROM glossary_terms gt 
                   JOIN glossaries g ON gt.glossary_id = g.id 
                   WHERE g.user_id = NEW.user_id 
                   GROUP BY g.id) t), 
            0
        ),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT type),
            ARRAY_AGG(COUNT(*))
        ) FROM glossaries g WHERE g.user_id = NEW.user_id GROUP BY type),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT category),
            ARRAY_AGG(COUNT(*))
        ) FROM glossary_terms gt JOIN glossaries g ON gt.glossary_id = g.id WHERE g.user_id = NEW.user_id GROUP BY category),
        (SELECT jsonb_agg(
            jsonb_build_object(
                'glossaryId', g.id,
                'title', g.title,
                'viewCount', (SELECT COUNT(*) FROM glossary_sessions gs WHERE gs.glossary_id = g.id),
                'averageRating', 4.5, -- Simulé
                'termCount', (SELECT COUNT(*) FROM glossary_terms gt WHERE gt.glossary_id = g.id)
            )
        ) FROM glossaries g WHERE g.user_id = NEW.user_id ORDER BY (SELECT COUNT(*) FROM glossary_sessions gs WHERE gs.glossary_id = g.id) DESC LIMIT 10),
        jsonb_build_object(
            'totalUsers', 1,
            'activeUsers', CASE WHEN DATE(g.updated_at) >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END,
            'averageGlossariesPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) 
                 FROM glossary_sessions 
                 WHERE user_id = NEW.user_id AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'averageTermsPerUser', COALESCE(
                (SELECT AVG(term_count)::INTEGER 
                 FROM (SELECT COUNT(*) as term_count 
                       FROM glossary_terms gt 
                       JOIN glossaries g ON gt.glossary_id = g.id 
                       WHERE g.user_id = NEW.user_id 
                       GROUP BY g.id) t), 
                0
            ),
            'averageSessionDuration', COALESCE(
                (SELECT AVG(duration) 
                 FROM glossary_sessions 
                 WHERE user_id = NEW.user_id AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'satisfactionScore', 4.3 -- Simulé
        ),
        jsonb_build_object(
            'averageConfidence', COALESCE(AVG(confidence), 0),
            'averageRelevance', COALESCE(AVG(relevance), 0),
            'averageAccuracy', COALESCE(AVG((metadata->>'accuracy')::DECIMAL), 0),
            'averageCompleteness', COALESCE(AVG((metadata->>'completeness')::DECIMAL), 0),
            'extractionSuccessRate', COALESCE(AVG((metadata->>'confidence')::DECIMAL), 0)
        ),
        jsonb_build_object(
            'glossaryGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM glossaries 
                WHERE user_id = NEW.user_id AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            ),
            'termGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM glossary_terms gt 
                JOIN glossaries g ON gt.glossary_id = g.id 
                WHERE g.user_id = NEW.user_id AND DATE(gt.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', gt.created_at) 
                ORDER BY DATE_TRUNC('month', gt.created_at)
            ),
            'typeTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT type),
                    ARRAY_AGG(COUNT(*))
                )
                FROM glossaries g 
                WHERE g.user_id = NEW.user_id AND DATE(g.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY type
            ),
            'categoryTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT category),
                    ARRAY_AGG(COUNT(*))
                )
                FROM glossary_terms gt 
                JOIN glossaries g ON gt.glossary_id = g.id 
                WHERE g.user_id = NEW.user_id AND DATE(gt.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY category
            )
        )
    ON CONFLICT (date, user_id) DO UPDATE SET
        total_glossaries = EXCLUDED.total_glossaries,
        published_glossaries = EXCLUDED.published_glossaries,
        draft_glossaries = EXCLUDED.draft_glossaries,
        total_terms = EXCLUDED.total_terms,
        average_terms_per_glossary = EXCLUDED.average_terms_per_glossary,
        most_active_types = EXCLUDED.most_active_types,
        most_active_categories = EXCLUDED.most_active_categories,
        top_performing_glossaries = EXCLUDED.top_performing_glossaries,
        user_engagement = EXCLUDED.user_engagement,
        content_quality = EXCLUDED.content_quality,
        trends = EXCLUDED.trends,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_glossary_statistics_glossaries
    AFTER INSERT OR UPDATE OR DELETE ON glossaries
    FOR EACH ROW EXECUTE FUNCTION update_glossary_statistics();

CREATE TRIGGER trigger_update_glossary_statistics_terms
    AFTER INSERT OR UPDATE OR DELETE ON glossary_terms
    FOR EACH ROW EXECUTE FUNCTION update_glossary_statistics();

CREATE TRIGGER trigger_update_glossary_statistics_interactions
    AFTER INSERT ON glossary_term_interactions
    FOR EACH ROW EXECUTE FUNCTION update_glossary_statistics();

-- Politiques RLS pour les glossaires
ALTER TABLE glossaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own glossaries" ON glossaries
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view published glossaries" ON glossaries
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can view all glossaries" ON glossaries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les termes de glossaire
ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view terms of accessible glossaries" ON glossary_terms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM glossaries g
            WHERE g.id = glossary_id 
            AND (g.user_id = auth.uid() OR g.status = 'published')
        )
    );

CREATE POLICY "Admins can view all glossary terms" ON glossary_terms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les traductions
ALTER TABLE glossary_term_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view translations of accessible terms" ON glossary_term_translations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM glossary_terms gt
            JOIN glossaries g ON gt.glossary_id = g.id
            WHERE gt.id = term_id 
            AND (g.user_id = auth.uid() OR g.status = 'published')
        )
    );

-- Politiques RLS pour les exemples
ALTER TABLE glossary_term_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view examples of accessible terms" ON glossary_term_examples
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM glossary_terms gt
            JOIN glossaries g ON gt.glossary_id = g.id
            WHERE gt.id = term_id 
            AND (g.user_id = auth.uid() OR g.status = 'published')
        )
    );

-- Politiques RLS pour les sources de termes
ALTER TABLE glossary_term_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sources of accessible terms" ON glossary_term_sources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM glossary_terms gt
            JOIN glossaries g ON gt.glossary_id = g.id
            WHERE gt.id = term_id 
            AND (g.user_id = auth.uid() OR g.status = 'published')
        )
    );

-- Politiques RLS pour les médias de termes
ALTER TABLE glossary_term_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view media of accessible terms" ON glossary_term_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM glossary_terms gt
            JOIN glossaries g ON gt.glossary_id = g.id
            WHERE gt.id = term_id 
            AND (g.user_id = auth.uid() OR g.status = 'published')
        )
    );

-- Politiques RLS pour les interactions de termes
ALTER TABLE glossary_term_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own term interactions" ON glossary_term_interactions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all term interactions" ON glossary_term_interactions
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
ALTER TABLE glossary_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active glossary templates" ON glossary_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage glossary templates" ON glossary_templates
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
ALTER TABLE glossary_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own glossary exports" ON glossary_exports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM glossaries g
            WHERE g.id = glossary_id AND g.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all glossary exports" ON glossary_exports
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
ALTER TABLE glossary_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own glossary statistics" ON glossary_statistics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all glossary statistics" ON glossary_statistics
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
ALTER TABLE glossary_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own glossary sessions" ON glossary_sessions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all glossary sessions" ON glossary_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour les glossaires

-- Fonction pour obtenir les statistiques des glossaires
CREATE OR REPLACE FUNCTION get_glossary_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_glossaries BIGINT,
    published_glossaries BIGINT,
    draft_glossaries BIGINT,
    total_terms BIGINT,
    average_terms_per_glossary DECIMAL(5,2),
    most_active_types JSONB,
    most_active_categories JSONB,
    top_performing_glossaries JSONB,
    user_engagement JSONB,
    content_quality JSONB,
    trends JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(total_glossaries), 0),
        COALESCE(SUM(published_glossaries), 0),
        COALESCE(SUM(draft_glossaries), 0),
        COALESCE(SUM(total_terms), 0),
        COALESCE(AVG(average_terms_per_glossary), 0),
        (SELECT jsonb_agg(most_active_types) FROM (
            SELECT jsonb_build_object(
                'type', type,
                'count', count
            ) as most_active_types
            FROM (
                SELECT 
                    type,
                    COUNT(*) as count
                FROM glossaries g 
                WHERE (p_user_id IS NULL OR g.user_id = p_user_id) 
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
                FROM glossary_terms gt 
                JOIN glossaries g ON gt.glossary_id = g.id 
                WHERE (p_user_id IS NULL OR g.user_id = p_user_id) 
                GROUP BY category
            ) t
        ) sub),
        (SELECT jsonb_agg(top_performing_glossaries) FROM (
            SELECT jsonb_build_object(
                'glossaryId', g.id,
                'title', g.title,
                'viewCount', viewCount,
                'averageRating', 4.5,
                'termCount', termCount
            ) as top_performing_glossaries
            FROM (
                SELECT 
                    g.id,
                    g.title,
                    (SELECT COUNT(*) FROM glossary_sessions gs WHERE gs.glossary_id = g.id) as viewCount,
                    (SELECT COUNT(*) FROM glossary_terms gt WHERE gt.glossary_id = g.id) as termCount
                FROM glossaries g 
                WHERE (p_user_id IS NULL OR g.user_id = p_user_id) 
                ORDER BY viewCount DESC 
                LIMIT 10
            ) t
        ) sub),
        jsonb_build_object(
            'totalUsers', (SELECT COUNT(DISTINCT user_id) FROM glossaries WHERE (p_user_id IS NULL OR user_id = p_user_id)),
            'activeUsers', (SELECT COUNT(DISTINCT user_id) FROM glossaries WHERE (p_user_id IS NULL OR user_id = p_user_id) AND DATE(updated_at) >= CURRENT_DATE - INTERVAL '7 days'),
            'averageGlossariesPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) 
                 FROM glossary_sessions 
                 WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                 AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'averageTermsPerUser', COALESCE(
                (SELECT AVG(term_count)::INTEGER 
                 FROM (SELECT COUNT(*) as term_count 
                       FROM glossary_terms gt 
                       JOIN glossaries g ON gt.glossary_id = g.id 
                       WHERE (p_user_id IS NULL OR g.user_id = p_user_id) 
                       GROUP BY g.id) t), 
                0
            ),
            'averageSessionDuration', COALESCE(
                (SELECT AVG(duration) 
                 FROM glossary_sessions 
                 WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                 AND DATE(start_time) >= CURRENT_DATE - INTERVAL '7 days'), 
                0
            ),
            'satisfactionScore', 4.3
        ),
        jsonb_build_object(
            'averageConfidence', COALESCE(AVG(confidence), 0),
            'averageRelevance', COALESCE(AVG(relevance), 0),
            'averageAccuracy', COALESCE(AVG((metadata->>'accuracy')::DECIMAL), 0),
            'averageCompleteness', COALESCE(AVG((metadata->>'completeness')::DECIMAL), 0),
            'extractionSuccessRate', COALESCE(AVG((metadata->>'confidence')::DECIMAL), 0)
        ),
        jsonb_build_object(
            'glossaryGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM glossaries 
                WHERE (p_user_id IS NULL OR user_id = p_user_id) 
                AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            ),
            'termGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM glossary_terms gt 
                JOIN glossaries g ON gt.glossary_id = g.id 
                WHERE (p_user_id IS NULL OR g.user_id = p_user_id) 
                AND DATE(gt.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', gt.created_at) 
                ORDER BY DATE_TRUNC('month', gt.created_at)
            ),
            'typeTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT type),
                    ARRAY_AGG(COUNT(*))
                )
                FROM glossaries g 
                WHERE (p_user_id IS NULL OR g.user_id = p_user_id) 
                AND DATE(g.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY type
            ),
            'categoryTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT category),
                    ARRAY_AGG(COUNT(*))
                )
                FROM glossary_terms gt 
                JOIN glossaries g ON gt.glossary_id = g.id 
                WHERE (p_user_id IS NULL OR g.user_id = p_user_id) 
                AND DATE(gt.created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY category
            )
        )
    FROM glossary_statistics
    WHERE (p_user_id IS NULL OR user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les templates de glossaire par défaut
CREATE OR REPLACE FUNCTION create_default_glossary_templates()
RETURNS VOID AS $$
BEGIN
    INSERT INTO glossary_templates (
        name,
        description,
        type,
        prompt,
        settings,
        is_default,
        is_active
    ) VALUES 
        ('Glossaire Technique', 'Template pour créer des glossaires techniques avec terminologie spécialisée', 
         'technical',
         'Extrais les termes techniques importants avec leurs définitions précises, contextes d''utilisation et relations. Inclut les acronymes, les abréviations et les termes spécifiques au domaine.',
         '{"maxTerms": 30, "language": "fr", "targetLanguages": ["en", "es", "de"], "difficulty": ["intermediate", "advanced", "expert"], "includeSynonyms": true, "includeAntonyms": false, "includeTranslations": true, "includeExamples": true, "includeEtymology": true, "visualization": {"layout": "list", "theme": "auto"}}',
         true, true),
        ('Glossaire Business', 'Template pour les glossaires d''entreprise et de business', 
         'business',
         'Extrais les termes business, financiers et marketing avec leurs définitions contextuelles. Inclut les acronymes d''entreprise et les termes spécifiques au secteur.',
         '{"maxTerms": 25, "language": "fr", "targetLanguages": ["en", "es"], "difficulty": ["beginner", "intermediate", "advanced"], "includeSynonyms": true, "includeAntonyms": false, "includeTranslations": true, "includeExamples": true, "visualization": {"layout": "cards", "theme": "auto"}}',
         false, true),
        ('Glossaire Académique', 'Template pour les glossaires académiques et scientifiques', 
         'academic',
         'Extrais les termes académiques, concepts scientifiques et théories avec leurs définitions formelles et contextes historiques. Inclut les références et les relations conceptuelles.',
         '{"maxTerms": 35, "language": "fr", "targetLanguages": ["en", "de", "es"], "difficulty": ["intermediate", "advanced", "expert"], "includeSynonyms": true, "includeAntonyms": true, "includeTranslations": true, "includeExamples": true, "includeEtymology": true, "visualization": {"layout": "mindmap", "theme": "auto"}}',
         false, true),
        ('Glossaire Multilingue', 'Template pour les glossaires multilingues', 
         'multilingual',
         'Extrais les termes avec leurs traductions dans plusieurs langues. Focalise sur les équivalences culturelles et les nuances linguistiques.',
         '{"maxTerms": 20, "language": "fr", "targetLanguages": ["en", "es", "de", "it", "pt"], "difficulty": ["beginner", "intermediate", "advanced"], "includeSynonyms": true, "includeAntonyms": true, "includeTranslations": true, "includeExamples": true, "visualization": {"layout": "network", "theme": "auto"}}',
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
CREATE OR REPLACE FUNCTION create_daily_glossary_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO glossary_statistics (
        date,
        user_id,
        total_glossaries,
        published_glossaries,
        draft_glossaries,
        total_terms,
        average_terms_per_glossary,
        most_active_types,
        most_active_categories,
        top_performing_glossaries,
        user_engagement,
        content_quality,
        trends
    )
    SELECT 
        p_date,
        g.user_id,
        COUNT(*) as total_glossaries,
        COUNT(*) FILTER (WHERE g.status = 'published') as published_glossaries,
        COUNT(*) FILTER (WHERE g.status = 'draft') as draft_glossaries,
        COALESCE(term_counts.term_count, 0) as total_terms,
        COALESCE(term_counts.term_count::DECIMAL / NULLIF(COUNT(*), 0), 0) as average_terms_per_glossary,
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT type),
            ARRAY_AGG(COUNT(*))
        ) FROM glossaries g2 WHERE g2.user_id = g.user_id AND DATE(g2.created_at) = p_date GROUP BY type),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT category),
            ARRAY_AGG(COUNT(*))
        ) FROM glossary_terms gt JOIN glossaries g2 ON gt.glossary_id = g2.id WHERE g2.user_id = g.user_id AND DATE(gt.created_at) = p_date GROUP BY category),
        (SELECT jsonb_agg(
            jsonb_build_object(
                'glossaryId', g2.id,
                'title', g2.title,
                'viewCount', (SELECT COUNT(*) FROM glossary_sessions gs WHERE gs.glossary_id = g2.id AND DATE(gs.start_time) = p_date),
                'averageRating', 4.5,
                'termCount', (SELECT COUNT(*) FROM glossary_terms gt WHERE gt.glossary_id = g2.id)
            )
        ) FROM glossaries g2 WHERE g2.user_id = g.user_id AND DATE(g2.created_at) = p_date ORDER BY (SELECT COUNT(*) FROM glossary_sessions gs WHERE gs.glossary_id = g2.id AND DATE(gs.start_time) = p_date) DESC LIMIT 10),
        jsonb_build_object(
            'totalUsers', 1,
            'activeUsers', CASE WHEN DATE(g.updated_at) >= p_date - INTERVAL '7 days' THEN 1 ELSE 0 END,
            'averageGlossariesPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) 
                 FROM glossary_sessions 
                 WHERE user_id = g.user_id AND DATE(start_time) >= p_date - INTERVAL '7 days'), 
                0
            ),
            'averageTermsPerUser', COALESCE(
                (SELECT AVG(term_count)::INTEGER 
                 FROM (SELECT COUNT(*) as term_count 
                       FROM glossary_terms gt 
                       JOIN glossaries g2 ON gt.glossary_id = g2.id 
                       WHERE g2.user_id = g.user_id 
                       GROUP BY g2.id) t), 
                0
            ),
            'averageSessionDuration', COALESCE(
                (SELECT AVG(duration) 
                 FROM glossary_sessions 
                 WHERE user_id = g.user_id AND DATE(start_time) >= p_date - INTERVAL '7 days'), 
                0
            ),
            'satisfactionScore', 4.3
        ),
        jsonb_build_object(
            'averageConfidence', COALESCE(AVG(confidence), 0),
            'averageRelevance', COALESCE(AVG(relevance), 0),
            'averageAccuracy', COALESCE(AVG((metadata->>'accuracy')::DECIMAL), 0),
            'averageCompleteness', COALESCE(AVG((metadata->>'completeness')::DECIMAL), 0),
            'extractionSuccessRate', COALESCE(AVG((metadata->>'confidence')::DECIMAL), 0)
        ),
        jsonb_build_object(
            'glossaryGrowth', ARRAY(SELECT COUNT(*) FROM glossaries WHERE user_id = g.user_id AND DATE(created_at) >= p_date - INTERVAL '12 months' GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)),
            'termGrowth', ARRAY(
                SELECT COUNT(*) 
                FROM glossary_terms gt 
                JOIN glossaries g2 ON gt.glossary_id = g2.id 
                WHERE g2.user_id = g.user_id AND DATE(gt.created_at) >= p_date - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', gt.created_at) 
                ORDER BY DATE_TRUNC('month', gt.created_at)
            ),
            'typeTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT type),
                    ARRAY_AGG(COUNT(*))
                )
                FROM glossaries g2 
                WHERE g2.user_id = g.user_id AND DATE(g2.created_at) >= p_date - INTERVAL '12 months' 
                GROUP BY type
            ),
            'categoryTrends', (
                SELECT jsonb_build_object(
                    ARRAY_AGG(DISTINCT category),
                    ARRAY_AGG(COUNT(*))
                )
                FROM glossary_terms gt 
                JOIN glossaries g2 ON gt.glossary_id = g2.id 
                WHERE g2.user_id = g.user_id AND DATE(gt.created_at) >= p_date - INTERVAL '12 months' 
                GROUP BY category
            )
        )
    FROM glossaries g
    LEFT JOIN (
        SELECT glossary_id, COUNT(*) as term_count
        FROM glossary_terms gt
        JOIN glossaries g2 ON gt.glossary_id = g2.id
        WHERE DATE(gt.created_at) = p_date
        GROUP BY glossary_id
    ) term_counts ON g.id = term_counts.glossary_id
    WHERE DATE(g.created_at) = p_date
    GROUP BY g.user_id, term_counts.term_count
    ON CONFLICT (date, user_id) DO UPDATE SET
        total_glossaries = EXCLUDED.total_glossaries,
        published_glossaries = EXCLUDED.published_glossaries,
        draft_glossaries = EXCLUDED.draft_glossaries,
        total_terms = EXCLUDED.total_terms,
        average_terms_per_glossary = EXCLUDED.average_terms_per_glossary,
        most_active_types = EXCLUDED.most_active_types,
        most_active_categories = EXCLUDED.most_active_categories,
        top_performing_glossaries = EXCLUDED.top_performing_glossaries,
        user_engagement = EXCLUDED.user_engagement,
        content_quality = EXCLUDED.content_quality,
        trends = EXCLUDED.trends,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE glossaries IS 'Glossaires avec termes clés extraits automatiquement des documents';
COMMENT ON TABLE glossary_terms IS 'Termes individuels des glossaires avec définitions, traductions et exemples';
COMMENT ON TABLE glossary_term_translations IS 'Traductions des termes dans différentes langues';
COMMENT ON TABLE glossary_term_examples IS 'Exemples d''utilisation des termes avec contexte';
COMMENT ON TABLE glossary_term_sources IS 'Sources des termes avec positions et confiance';
COMMENT ON TABLE glossary_term_media IS 'Médias associés aux termes (images, diagrammes, etc.)';
COMMENT ON TABLE glossary_term_interactions IS 'Interactions des utilisateurs avec les termes';
COMMENT ON TABLE glossary_templates IS 'Templates de génération de glossaire avec prompts configurables';
COMMENT ON TABLE glossary_exports IS 'Exports de glossaires dans différents formats';
COMMENT ON TABLE glossary_statistics IS 'Statistiques d''utilisation et de performance des glossaires';
COMMENT ON TABLE glossary_sessions IS 'Sessions de consultation de glossaire avec tracking utilisateur';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN glossaries.terms IS 'Termes du glossaire [{id, term, definition, context, synonyms, antonyms, relatedTerms, translations, examples, etymology, pronunciation, partOfSpeech, difficulty, frequency, category, subcategory, tags, keywords, sources, media, metadata, style, interactions, createdAt, updatedAt}]';
COMMENT ON COLUMN glossaries.settings IS 'Paramètres du glossaire {maxTerms, language, targetLanguages, categories, difficulty, frequency, includeSynonyms, includeAntonyms, includeTranslations, includeExamples, includeEtymology, includePronunciation, minFrequency, maxFrequency, sortBy, sortOrder, grouping, filtering, visualization, export, personalization}';
COMMENT ON COLUMN glossaries.metadata IS 'Métadonnées du glossaire {totalTerms, uniqueTerms, averageTermLength, averageDefinitionLength, categories, partsOfSpeech, difficulties, frequencies, languages, quality, extraction, linguisticAnalysis, version, lastUpdated, customFields}';
COMMENT ON COLUMN glossaries.analytics IS 'Analytics d''utilisation {totalViews, uniqueViews, averageSessionDuration, mostViewedTerms, userEngagement, learningPatterns, contentPerformance, trends}';
COMMENT ON COLUMN glossary_terms.metadata IS 'Métadonnées du terme {extractionMethod, confidence, relevance, accuracy, completeness, processingTime, model, temperature, tokensUsed, language, sentiment, complexity, readability, wordCount, characterCount, semanticContext, linguisticFeatures, domainSpecificity, customFields}';
COMMENT ON COLUMN glossary_terms.style IS 'Style visuel du terme {color, backgroundColor, borderColor, borderWidth, borderStyle, borderRadius, opacity, fontSize, fontFamily, fontWeight, fontStyle, icon, iconSize, iconColor, shadow, animation}';
COMMENT ON COLUMN glossary_terms.metadata IS 'Métadonnées du terme {extractionMethod, confidence, relevance, accuracy, completeness, processingTime, model, temperature, tokensUsed, language, sentiment, complexity, readability, wordCount, characterCount, semanticContext, linguisticFeatures, domainSpecificity, customFields}';
COMMENT ON COLUMN glossary_statistics.trends IS 'Tendances d''utilisation {glossaryGrowth, termGrowth, typeTrends, categoryTrends}';
COMMENT ON COLUMN glossary_statistics.user_engagement IS 'Engagement utilisateur {totalUsers, activeUsers, averageGlossariesPerUser, averageTermsPerUser, averageSessionDuration, satisfactionScore}';
COMMENT ON COLUMN glossary_statistics.content_quality IS 'Qualité du contenu {averageConfidence, averageRelevance, averageAccuracy, averageCompleteness, extractionSuccessRate}';

-- Créer les données par défaut
SELECT create_default_glossary_templates();
