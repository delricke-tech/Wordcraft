-- Migration pour les tables de transcription audio
-- Création: 11 mars 2026
-- Description: Transcription audio automatique avec Whisper API et analyse avancée

-- Table principale des transcriptions audio
CREATE TABLE IF NOT EXISTS audio_transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    original_file_name VARCHAR(255) NOT NULL,
    audio_file JSONB NOT NULL DEFAULT '{}',
    transcription JSONB NOT NULL DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    analytics JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'transcribing', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des fichiers audio
CREATE TABLE IF NOT EXISTS audio_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcription_id UUID REFERENCES audio_transcriptions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    duration DECIMAL(10,2) NOT NULL,
    sample_rate INTEGER NOT NULL,
    channels INTEGER NOT NULL,
    bit_rate INTEGER,
    format VARCHAR(50) NOT NULL,
    codec VARCHAR(50),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    storage_url TEXT NOT NULL,
    local_path TEXT,
    checksum VARCHAR(64),
    is_processed BOOLEAN DEFAULT FALSE
);

-- Table des segments de transcription
CREATE TABLE IF NOT EXISTS transcription_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcription_id UUID REFERENCES audio_transcriptions(id) ON DELETE CASCADE,
    segment_index INTEGER NOT NULL,
    start_time DECIMAL(10,3) NOT NULL,
    end_time DECIMAL(10,3) NOT NULL,
    text TEXT NOT NULL,
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    speaker INTEGER,
    language VARCHAR(10) DEFAULT 'fr',
    emotions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(transcription_id, segment_index)
);

-- Table des mots de transcription
CREATE TABLE IF NOT EXISTS transcription_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id UUID REFERENCES transcription_segments(id) ON DELETE CASCADE,
    word_index INTEGER NOT NULL,
    word VARCHAR(100) NOT NULL,
    start_time DECIMAL(10,3) NOT NULL,
    end_time DECIMAL(10,3) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    speaker INTEGER,
    punctuation VARCHAR(5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(segment_id, word_index)
);

-- Table des analyses de sentiment
CREATE TABLE IF NOT EXISTS sentiment_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcription_id UUID REFERENCES audio_transcriptions(id) ON DELETE CASCADE,
    overall_sentiment VARCHAR(20) NOT NULL CHECK (overall_sentiment IN ('positive', 'negative', 'neutral')),
    overall_score DECIMAL(5,4) NOT NULL CHECK (overall_score >= -1 AND overall_score <= 1),
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    emotions JSONB DEFAULT '[]',
    segments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des analyses thématiques
CREATE TABLE IF NOT EXISTS topic_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcription_id UUID REFERENCES audio_transcriptions(id) ON DELETE CASCADE,
    topic VARCHAR(200) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    keywords TEXT[] DEFAULT '{}',
    relevance DECIMAL(5,4) NOT NULL CHECK (relevance >= 0 AND relevance <= 1),
    segments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des extractions d'entités
CREATE TABLE IF NOT EXISTS entity_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcription_id UUID REFERENCES audio_transcriptions(id) ON DELETE CASCADE,
    entity VARCHAR(200) NOT NULL,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('person', 'organization', 'location', 'date', 'money', 'product', 'event', 'other')),
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    occurrences JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des templates de transcription
CREATE TABLE IF NOT EXISTS transcription_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    settings JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exports de transcription
CREATE TABLE IF NOT EXISTS transcription_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcription_id UUID REFERENCES audio_transcriptions(id) ON DELETE CASCADE,
    format VARCHAR(20) NOT NULL CHECK (format IN ('txt', 'json', 'srt', 'vtt', 'pdf', 'docx', 'csv')),
    options JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des statistiques de transcription
CREATE TABLE IF NOT EXISTS transcription_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_transcriptions INTEGER DEFAULT 0,
    completed_transcriptions INTEGER DEFAULT 0,
    failed_transcriptions INTEGER DEFAULT 0,
    total_audio_duration DECIMAL(10,2) DEFAULT 0,
    average_transcription_time DECIMAL(10,2) DEFAULT 0,
    average_accuracy DECIMAL(5,2) DEFAULT 0,
    most_used_language VARCHAR(10),
    most_used_model VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Table des sessions de transcription
CREATE TABLE IF NOT EXISTS transcription_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcription_id UUID REFERENCES audio_transcriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    interactions_count INTEGER DEFAULT 0,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    ip_address INET,
    user_agent TEXT
);

-- Table des interactions avec les transcriptions
CREATE TABLE IF NOT EXISTS transcription_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcription_id UUID REFERENCES audio_transcriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('view', 'play', 'pause', 'seek', 'download', 'export', 'share', 'bookmark', 'edit')),
    interaction_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des feedbacks sur les transcriptions
CREATE TABLE IF NOT EXISTS transcription_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcription_id UUID REFERENCES audio_transcriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type VARCHAR(50) CHECK (feedback_type IN ('helpful', 'not_helpful', 'inaccurate', 'incomplete', 'other')),
    comment TEXT,
    suggestions TEXT,
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
    completeness_rating INTEGER CHECK (completeness_rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(transcription_id, user_id)
);

-- Table des modèles de transcription disponibles
CREATE TABLE IF NOT EXISTS transcription_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('whisper', 'custom', 'third_party')),
    model_size VARCHAR(50) NOT NULL CHECK (model_size IN ('tiny', 'base', 'small', 'medium', 'large', 'xl')),
    languages_supported TEXT[] NOT NULL DEFAULT '{}',
    max_duration INTEGER DEFAULT 3600, -- en secondes
    max_file_size BIGINT DEFAULT 26214400, -- 25MB en bytes
    accuracy_score DECIMAL(5,4) DEFAULT 0,
    processing_speed VARCHAR(20) DEFAULT 'medium',
    cost_per_minute DECIMAL(10,4) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des langues supportées
CREATE TABLE IF NOT EXISTS supported_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_audio_transcriptions_user_id ON audio_transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_transcriptions_document_id ON audio_transcriptions(document_id);
CREATE INDEX IF NOT EXISTS idx_audio_transcriptions_status ON audio_transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_audio_transcriptions_created_at ON audio_transcriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_transcriptions_title ON audio_transcriptions USING gin(to_tsvector('french', title));

CREATE INDEX IF NOT EXISTS idx_audio_files_transcription_id ON audio_files(transcription_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_mime_type ON audio_files(mime_type);
CREATE INDEX IF NOT EXISTS idx_audio_files_format ON audio_files(format);
CREATE INDEX IF NOT EXISTS idx_audio_files_uploaded_at ON audio_files(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_transcription_segments_transcription_id ON transcription_segments(transcription_id);
CREATE INDEX IF NOT EXISTS idx_transcription_segments_start_time ON transcription_segments(start_time);
CREATE INDEX IF NOT EXISTS idx_transcription_segments_end_time ON transcription_segments(end_time);
CREATE INDEX IF NOT EXISTS idx_transcription_segments_speaker ON transcription_segments(speaker);
CREATE INDEX IF NOT EXISTS idx_transcription_segments_language ON transcription_segments(language);

CREATE INDEX IF NOT EXISTS idx_transcription_words_segment_id ON transcription_words(segment_id);
CREATE INDEX IF NOT EXISTS idx_transcription_words_start_time ON transcription_words(start_time);
CREATE INDEX IF NOT EXISTS idx_transcription_words_end_time ON transcription_words(end_time);
CREATE INDEX IF NOT EXISTS idx_transcription_words_speaker ON transcription_words(speaker);
CREATE INDEX IF NOT EXISTS idx_transcription_words_word ON transcription_words USING gin(to_tsvector('french', word));

CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_transcription_id ON sentiment_analyses(transcription_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_overall_sentiment ON sentiment_analyses(overall_sentiment);
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_confidence ON sentiment_analyses(confidence);

CREATE INDEX IF NOT EXISTS idx_topic_analyses_transcription_id ON topic_analyses(transcription_id);
CREATE INDEX IF NOT EXISTS idx_topic_analyses_topic ON topic_analyses(topic);
CREATE INDEX IF NOT EXISTS idx_topic_analyses_confidence ON topic_analyses(confidence);
CREATE INDEX IF NOT EXISTS idx_topic_analyses_keywords ON topic_analyses USING gin(keywords);

CREATE INDEX IF NOT EXISTS idx_entity_extractions_transcription_id ON entity_extractions(transcription_id);
CREATE INDEX IF NOT EXISTS idx_entity_extractions_entity_type ON entity_extractions(entity_type);
CREATE INDEX IF NOT EXISTS idx_entity_extractions_entity ON entity_extractions USING gin(to_tsvector('french', entity));
CREATE INDEX IF NOT EXISTS idx_entity_extractions_confidence ON entity_extractions(confidence);

CREATE INDEX IF NOT EXISTS idx_transcription_templates_category ON transcription_templates(category);
CREATE INDEX IF NOT EXISTS idx_transcription_templates_is_active ON transcription_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_transcription_templates_usage_count ON transcription_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_transcription_templates_tags ON transcription_templates USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_transcription_exports_transcription_id ON transcription_exports(transcription_id);
CREATE INDEX IF NOT EXISTS idx_transcription_exports_status ON transcription_exports(status);
CREATE INDEX IF NOT EXISTS idx_transcription_exports_format ON transcription_exports(format);

CREATE INDEX IF NOT EXISTS idx_transcription_statistics_user_id ON transcription_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_transcription_statistics_date ON transcription_statistics(date DESC);

CREATE INDEX IF NOT EXISTS idx_transcription_sessions_transcription_id ON transcription_sessions(transcription_id);
CREATE INDEX IF NOT EXISTS idx_transcription_sessions_user_id ON transcription_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcription_sessions_session_id ON transcription_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_transcription_sessions_started_at ON transcription_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_transcription_interactions_transcription_id ON transcription_interactions(transcription_id);
CREATE INDEX IF NOT EXISTS idx_transcription_interactions_user_id ON transcription_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcription_interactions_interaction_type ON transcription_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_transcription_interactions_created_at ON transcription_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transcription_feedbacks_transcription_id ON transcription_feedbacks(transcription_id);
CREATE INDEX IF NOT EXISTS idx_transcription_feedbacks_user_id ON transcription_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_transcription_feedbacks_rating ON transcription_feedbacks(rating);
CREATE INDEX IF NOT EXISTS idx_transcription_feedbacks_feedback_type ON transcription_feedbacks(feedback_type);

CREATE INDEX IF NOT EXISTS idx_transcription_models_model_type ON transcription_models(model_type);
CREATE INDEX IF NOT EXISTS idx_transcription_models_model_size ON transcription_models(model_size);
CREATE INDEX IF NOT EXISTS idx_transcription_models_is_active ON transcription_models(is_active);
CREATE INDEX IF NOT EXISTS idx_transcription_models_usage_count ON transcription_models(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_transcription_models_languages_supported ON transcription_models USING gin(languages_supported);

CREATE INDEX IF NOT EXISTS idx_supported_languages_code ON supported_languages(code);
CREATE INDEX IF NOT EXISTS idx_supported_languages_is_active ON supported_languages(is_active);
CREATE INDEX IF NOT EXISTS idx_supported_languages_usage_count ON supported_languages(usage_count DESC);

-- Row Level Security (RLS)
ALTER TABLE audio_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE supported_languages ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour audio_transcriptions
CREATE POLICY "Users can view own audio transcriptions" ON audio_transcriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audio transcriptions" ON audio_transcriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audio transcriptions" ON audio_transcriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audio transcriptions" ON audio_transcriptions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audio transcriptions" ON audio_transcriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour audio_files
CREATE POLICY "Users can view own audio files" ON audio_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own audio files" ON audio_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own audio files" ON audio_files
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own audio files" ON audio_files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

-- Politiques RLS pour transcription_segments
CREATE POLICY "Users can view own transcription segments" ON transcription_segments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own transcription segments" ON transcription_segments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own transcription segments" ON transcription_segments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own transcription segments" ON transcription_segments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

-- Politiques RLS pour transcription_words
CREATE POLICY "Users can view own transcription words" ON transcription_words
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM transcription_segments ts
            JOIN audio_transcriptions at ON at.id = ts.transcription_id
            WHERE ts.id = segment_id 
            AND at.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own transcription words" ON transcription_words
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM transcription_segments ts
            JOIN audio_transcriptions at ON at.id = ts.transcription_id
            WHERE ts.id = segment_id 
            AND at.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own transcription words" ON transcription_words
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM transcription_segments ts
            JOIN audio_transcriptions at ON at.id = ts.transcription_id
            WHERE ts.id = segment_id 
            AND at.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own transcription words" ON transcription_words
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM transcription_segments ts
            JOIN audio_transcriptions at ON at.id = ts.transcription_id
            WHERE ts.id = segment_id 
            AND at.user_id = auth.uid()
        )
    );

-- Politiques RLS pour sentiment_analyses
CREATE POLICY "Users can view own sentiment analyses" ON sentiment_analyses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own sentiment analyses" ON sentiment_analyses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own sentiment analyses" ON sentiment_analyses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own sentiment analyses" ON sentiment_analyses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

-- Politiques RLS pour topic_analyses
CREATE POLICY "Users can view own topic analyses" ON topic_analyses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own topic analyses" ON topic_analyses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own topic analyses" ON topic_analyses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own topic analyses" ON topic_analyses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

-- Politiques RLS pour entity_extractions
CREATE POLICY "Users can view own entity extractions" ON entity_extractions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own entity extractions" ON entity_extractions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own entity extractions" ON entity_extractions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own entity extractions" ON entity_extractions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

-- Politiques RLS pour transcription_templates
CREATE POLICY "Users can view active transcription templates" ON transcription_templates
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can insert own transcription templates" ON transcription_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own transcription templates" ON transcription_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own transcription templates" ON transcription_templates
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all transcription templates" ON transcription_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour transcription_exports
CREATE POLICY "Users can view own transcription exports" ON transcription_exports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own transcription exports" ON transcription_exports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own transcription exports" ON transcription_exports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own transcription exports" ON transcription_exports
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM audio_transcriptions 
            WHERE audio_transcriptions.id = transcription_id 
            AND audio_transcriptions.user_id = auth.uid()
        )
    );

-- Politiques RLS pour transcription_statistics
CREATE POLICY "Users can view own transcription statistics" ON transcription_statistics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcription statistics" ON transcription_statistics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcription statistics" ON transcription_statistics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transcription statistics" ON transcription_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour transcription_sessions
CREATE POLICY "Users can view own transcription sessions" ON transcription_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcription sessions" ON transcription_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcription sessions" ON transcription_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques RLS pour transcription_interactions
CREATE POLICY "Users can view own transcription interactions" ON transcription_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcription interactions" ON transcription_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcription interactions" ON transcription_interactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques RLS pour transcription_feedbacks
CREATE POLICY "Users can view own transcription feedbacks" ON transcription_feedbacks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcription feedbacks" ON transcription_feedbacks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcription feedbacks" ON transcription_feedbacks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcription feedbacks" ON transcription_feedbacks
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour transcription_models
CREATE POLICY "All users can view active transcription models" ON transcription_models
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage transcription models" ON transcription_models
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour supported_languages
CREATE POLICY "All users can view active supported languages" ON supported_languages
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage supported languages" ON supported_languages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
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

CREATE TRIGGER update_audio_transcriptions_updated_at BEFORE UPDATE ON audio_transcriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcription_templates_updated_at BEFORE UPDATE ON transcription_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcription_statistics_updated_at BEFORE UPDATE ON transcription_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques d'utilisation des templates
CREATE OR REPLACE FUNCTION update_transcription_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE transcription_templates 
        SET usage_count = usage_count + 1 
        WHERE is_default = TRUE;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transcription_template_usage_count_trigger AFTER INSERT ON audio_transcriptions
    FOR EACH ROW EXECUTE FUNCTION update_transcription_template_usage_count();

-- Trigger pour mettre à jour les statistiques d'utilisation des modèles
CREATE OR REPLACE FUNCTION update_transcription_model_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE transcription_models 
        SET usage_count = usage_count + 1 
        WHERE name = (NEW.settings->>'model') AND is_active = TRUE;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transcription_model_usage_count_trigger AFTER INSERT ON audio_transcriptions
    FOR EACH ROW EXECUTE FUNCTION update_transcription_model_usage_count();

-- Trigger pour mettre à jour les statistiques d'utilisation des langues
CREATE OR REPLACE FUNCTION update_transcription_language_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE supported_languages 
        SET usage_count = usage_count + 1 
        WHERE code = (NEW.transcription->>'language') AND is_active = TRUE;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transcription_language_usage_count_trigger AFTER INSERT ON audio_transcriptions
    FOR EACH ROW EXECUTE FUNCTION update_transcription_language_usage_count();

-- Fonctions RPC pour les statistiques
CREATE OR REPLACE FUNCTION get_transcription_stats(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'total_transcriptions', COUNT(*),
        'completed_transcriptions', COUNT(*) FILTER (WHERE status = 'completed'),
        'failed_transcriptions', COUNT(*) FILTER (WHERE status = 'failed'),
        'total_audio_duration', COALESCE(SUM((transcription->>'timestamps'->>'totalDuration')::DECIMAL), 0),
        'average_transcription_time', COALESCE(AVG((metadata->>'processingTime')::DECIMAL), 0),
        'average_accuracy', COALESCE(AVG((transcription->>'confidence')::DECIMAL), 0),
        'most_used_language', (
            SELECT transcription->>'language' FROM (
                SELECT transcription->>'language' as lang, COUNT(*) as cnt 
                FROM audio_transcriptions 
                WHERE (p_user_id IS NULL OR user_id = p_user_id)
                AND status = 'completed'
                GROUP BY transcription->>'language' 
                ORDER BY cnt DESC 
                LIMIT 1
            ) t
        ),
        'most_used_model', (
            SELECT settings->>'model' FROM (
                SELECT settings->>'model' as model, COUNT(*) as cnt 
                FROM audio_transcriptions 
                WHERE (p_user_id IS NULL OR user_id = p_user_id)
                AND status = 'completed'
                GROUP BY settings->>'model' 
                ORDER BY cnt DESC 
                LIMIT 1
            ) t
        )
    ) INTO v_result
    FROM audio_transcriptions 
    WHERE (p_user_id IS NULL OR user_id = p_user_id);
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_transcription_analytics(p_transcription_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Mettre à jour les analytics de la transcription
    UPDATE audio_transcriptions 
    SET analytics = analytics || jsonb_build_object(
        'totalTranscriptions', COALESCE((analytics->>'totalTranscriptions')::BIGINT, 0) + 1,
        'completedTranscriptions', (
            SELECT COUNT(*) 
            FROM audio_transcriptions 
            WHERE user_id = (SELECT user_id FROM audio_transcriptions WHERE id = p_transcription_id)
            AND status = 'completed'
        ),
        'failedTranscriptions', (
            SELECT COUNT(*) 
            FROM audio_transcriptions 
            WHERE user_id = (SELECT user_id FROM audio_transcriptions WHERE id = p_transcription_id)
            AND status = 'failed'
        ),
        'totalAudioDuration', (
            SELECT COALESCE(SUM((transcription->>'timestamps'->>'totalDuration')::DECIMAL), 0)
            FROM audio_transcriptions 
            WHERE user_id = (SELECT user_id FROM audio_transcriptions WHERE id = p_transcription_id)
            AND status = 'completed'
        ),
        'averageTranscriptionTime', (
            SELECT COALESCE(AVG((metadata->>'processingTime')::DECIMAL), 0)
            FROM audio_transcriptions 
            WHERE user_id = (SELECT user_id FROM audio_transcriptions WHERE id = p_transcription_id)
            AND status = 'completed'
        ),
        'averageAccuracy', (
            SELECT COALESCE(AVG((transcription->>'confidence')::DECIMAL), 0)
            FROM audio_transcriptions 
            WHERE user_id = (SELECT user_id FROM audio_transcriptions WHERE id = p_transcription_id)
            AND status = 'completed'
        )
    )
    WHERE id = p_transcription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_default_transcription_templates()
RETURNS VOID AS $$
BEGIN
    -- Template standard
    INSERT INTO transcription_templates (name, description, settings, category, tags, is_default)
    VALUES (
        'Transcription Standard',
        'Configuration standard pour la plupart des fichiers audio',
        '{"language": "fr", "model": "whisper-1", "quality": "medium", "enableTimestamps": true, "enableSpeakerDiarization": true, "enableSentimentAnalysis": true, "enableTopicExtraction": true, "enableEntityExtraction": true, "enableSummary": true, "enableKeyPoints": true, "maxSpeakers": 2, "outputFormat": "json"}',
        'général',
        ARRAY['standard', 'français', 'automatique'],
        true
    )
    ON CONFLICT DO NOTHING;
    
    -- Template haute qualité
    INSERT INTO transcription_templates (name, description, settings, category, tags, is_default)
    VALUES (
        'Transcription Haute Qualité',
        'Configuration optimisée pour une précision maximale',
        '{"language": "fr", "model": "whisper-1", "quality": "high", "enableTimestamps": true, "enableSpeakerDiarization": true, "enableSentimentAnalysis": true, "enableTopicExtraction": true, "enableEntityExtraction": true, "enableSummary": true, "enableKeyPoints": true, "maxSpeakers": 5, "outputFormat": "json"}',
        'professionnel',
        ARRAY['haute qualité', 'précision', 'professionnel'],
        false
    )
    ON CONFLICT DO NOTHING;
    
    -- Template rapide
    INSERT INTO transcription_templates (name, description, settings, category, tags, is_default)
    VALUES (
        'Transcription Rapide',
        'Configuration optimisée pour la vitesse de traitement',
        '{"language": "fr", "model": "whisper-base", "quality": "low", "enableTimestamps": false, "enableSpeakerDiarization": false, "enableSentimentAnalysis": false, "enableTopicExtraction": false, "enableEntityExtraction": false, "enableSummary": false, "enableKeyPoints": false, "maxSpeakers": 1, "outputFormat": "text"}',
        'rapide',
        ARRAY['rapide', 'vitesse', 'simple'],
        false
    )
    ON CONFLICT DO NOTHING;
    
    -- Template multilingue
    INSERT INTO transcription_templates (name, description, settings, category, tags, is_default)
    VALUES (
        'Transcription Multilingue',
        'Configuration pour les fichiers audio multilingues',
        '{"language": "auto", "model": "whisper-1", "quality": "medium", "enableTimestamps": true, "enableSpeakerDiarization": true, "enableSentimentAnalysis": true, "enableTopicExtraction": true, "enableEntityExtraction": true, "enableSummary": true, "enableKeyPoints": true, "maxSpeakers": 3, "outputFormat": "json"}',
        'multilingue',
        ARRAY['multilingue', 'auto', 'international'],
        false
    )
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insertion des données initiales
INSERT INTO transcription_models (name, display_name, description, model_type, model_size, languages_supported, max_duration, max_file_size, accuracy_score, processing_speed, cost_per_minute, is_default) VALUES
('whisper-tiny', 'Whisper Tiny', 'Modèle le plus rapide et léger', 'whisper', 'tiny', ARRAY['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'], 1800, 10485760, 0.75, 'fast', 0.006, false),
('whisper-base', 'Whisper Base', 'Bon équilibre vitesse/précision', 'whisper', 'base', ARRAY['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'], 1800, 26214400, 0.85, 'medium', 0.006, false),
('whisper-small', 'Whisper Small', 'Précision améliorée', 'whisper', 'small', ARRAY['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'], 3600, 52428800, 0.90, 'medium', 0.012, false),
('whisper-medium', 'Whisper Medium', 'Haute précision', 'whisper', 'medium', ARRAY['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'], 3600, 104857600, 0.94, 'slow', 0.024, false),
('whisper-large', 'Whisper Large', 'Précision maximale', 'whisper', 'large', ARRAY['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'], 7200, 209715200, 0.96, 'slow', 0.036, true)
ON CONFLICT DO NOTHING;

INSERT INTO supported_languages (code, name, native_name, is_active) VALUES
('en', 'English', 'English', true),
('fr', 'Français', 'Français', true),
('es', 'Español', 'Español', true),
('de', 'Deutsch', 'Deutsch', true),
('it', 'Italiano', 'Italiano', true),
('pt', 'Português', 'Português', true),
('ru', 'Русский', 'Русский', true),
('ja', '日本語', '日本語', true),
('ko', '한국어', '한국어', true),
('zh', '中文', '中文', true),
('ar', 'العربية', 'العربية', true),
('hi', 'हिन्दी', 'हिन्दी', true),
('th', 'ไทย', 'ไทย', true),
('vi', 'Tiếng Việt', 'Tiếng Việt', true),
('nl', 'Nederlands', 'Nederlands', true),
('sv', 'Svenska', 'Svenska', true),
('no', 'Norsk', 'Norsk', true),
('da', 'Dansk', 'Dansk', true),
('fi', 'Suomi', 'Suomi', true),
('pl', 'Polski', 'Polski', true),
('tr', 'Türkçe', 'Türkçe', true),
('el', 'Ελληνικά', 'Ελληνικά', true),
('he', 'עברית', 'עברית', true),
('cs', 'Čeština', 'Čeština', true),
('hu', 'Magyar', 'Magyar', true),
('ro', 'Română', 'Română', true),
('bg', 'Български', 'Български', true),
('hr', 'Hrvatski', 'Hrvatski', true),
('sk', 'Slovenčina', 'Slovenčina', true),
('sl', 'Slovenščina', 'Slovenščina', true),
('et', 'Eesti', 'Eesti', true),
('lv', 'Latviešu', 'Latviešu', true),
('lt', 'Lietuvių', 'Lietuvių', true),
('uk', 'Українська', 'Українська', true)
ON CONFLICT DO NOTHING;

-- Commentaires sur les tables
COMMENT ON TABLE audio_transcriptions IS 'Transcriptions audio générées avec Whisper API';
COMMENT ON TABLE audio_files IS 'Fichiers audio originaux et métadonnées';
COMMENT ON TABLE transcription_segments IS 'Segments temporels de la transcription';
COMMENT ON TABLE transcription_words IS 'Mots individuels avec timestamps';
COMMENT ON TABLE sentiment_analyses IS 'Analyses de sentiment des transcriptions';
COMMENT ON TABLE topic_analyses IS 'Analyses thématiques des transcriptions';
COMMENT ON TABLE entity_extractions IS 'Extractions d\'entités nommées';
COMMENT ON TABLE transcription_templates IS 'Templates prédéfinis pour les transcriptions';
COMMENT ON TABLE transcription_exports IS 'Exports de transcriptions dans différents formats';
COMMENT ON TABLE transcription_statistics IS 'Statistiques d\'utilisation des transcriptions';
COMMENT ON TABLE transcription_sessions IS 'Sessions d\'écoute et de transcription';
COMMENT ON TABLE transcription_interactions IS 'Interactions des utilisateurs avec les transcriptions';
COMMENT ON TABLE transcription_feedbacks IS 'Feedbacks et évaluations des transcriptions';
COMMENT ON TABLE transcription_models IS 'Modèles de transcription disponibles';
COMMENT ON TABLE supported_languages IS 'Langues supportées par les modèles';

-- Commentaires sur les colonnes principales
COMMENT ON COLUMN audio_transcriptions.audio_file IS 'Métadonnées du fichier audio original';
COMMENT ON COLUMN audio_transcriptions.transcription IS 'Résultat complet de la transcription';
COMMENT ON COLUMN audio_transcriptions.settings IS 'Paramètres de transcription utilisés';
COMMENT ON COLUMN audio_transcriptions.metadata IS 'Métadonnées de traitement et qualité';
COMMENT ON COLUMN audio_transcriptions.analytics IS 'Données analytiques sur l\'utilisation';
COMMENT ON COLUMN transcription_segments.speaker IS 'Identification du locuteur (diarisation)';
COMMENT ON COLUMN transcription_segments.emotions IS 'Analyse émotionnelle du segment';
COMMENT ON COLUMN transcription_words.punctuation IS 'Ponctuation associée au mot';
COMMENT ON COLUMN sentiment_analyses.emotions IS 'Décomposition émotionnelle détaillée';
COMMENT ON COLUMN topic_analyses.keywords IS 'Mots-clés identifiés pour le sujet';
COMMENT ON COLUMN entity_extractions.occurrences IS 'Positions et contexte des entités';
COMMENT ON COLUMN transcription_models.cost_per_minute IS 'Coût par minute de transcription';
COMMENT ON COLUMN supported_languages.usage_count IS 'Nombre d\'utilisations de la langue';
