-- Migration: Création des tables pour la transcription vidéo (Whisper API)
-- Date: 11 mars 2026
-- Description: Tables pour gérer la transcription audio/vidéo via l'API Whisper

-- Table principale des transcriptions vidéo
CREATE TABLE IF NOT EXISTS video_transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    video_id VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(500) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    duration INTEGER NOT NULL, -- en secondes
    format VARCHAR(50) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'fr',
    detected_language VARCHAR(10),
    transcription_text TEXT NOT NULL,
    segments JSONB DEFAULT '[]', -- [{id, start, end, text, confidence, speaker, language, words, timestamp, metadata}]
    metadata JSONB DEFAULT '{}', -- {originalFormat, audioFormat, sampleRate, channels, bitrate, codec, duration, fileSize, detectedLanguage, confidence, wordCount, speakerCount, segmentsCount, processingTime, model, temperature, prompt, languageDetection, audioAnalysis, quality}
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'processing', 'transcribing', 'completed', 'failed', 'cancelled', 'retrying')),
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Table des sessions de transcription
CREATE TABLE IF NOT EXISTS video_transcription_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    video_id VARCHAR(255) NOT NULL,
    settings JSONB NOT NULL, -- {language, detectLanguage, model, temperature, responseFormat, timestampGranularities, prompt, maxDuration, maxFileSize, enableDiarization, enableEmotionDetection, enableNoiseReduction, enableVolumeNormalization, outputFormat, includeTimestamps, includeConfidence, includeSpeakerLabels, customVocabulary}
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'processing', 'transcribing', 'completed', 'failed', 'cancelled', 'retrying')),
    progress JSONB DEFAULT '{}', -- {stage, percentage, message, details, estimatedTimeRemaining, currentFile, processedFiles, totalFiles, processedDuration, totalDuration}
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- en millisecondes
    error TEXT,
    result UUID REFERENCES video_transcriptions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des segments de transcription
CREATE TABLE IF NOT EXISTS video_transcription_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcription_id UUID REFERENCES video_transcriptions(id) ON DELETE CASCADE,
    segment_id VARCHAR(255) NOT NULL,
    start_time DECIMAL(10,3) NOT NULL,
    end_time DECIMAL(10,3) NOT NULL,
    duration DECIMAL(10,3) GENERATED ALWAYS AS (end_time - start_time) STORED,
    text TEXT NOT NULL,
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    speaker VARCHAR(100),
    language VARCHAR(10),
    words JSONB DEFAULT '[]', -- [{word, start, end, confidence, punctuation, speaker}]
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}', -- {speakerId, speakerName, emotion, volume, speed, pitch, silence, music, noise, customTags}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des mots de transcription
CREATE TABLE IF NOT EXISTS video_transcription_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id UUID REFERENCES video_transcription_segments(id) ON DELETE CASCADE,
    transcription_id UUID REFERENCES video_transcriptions(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    start_time DECIMAL(10,3) NOT NULL,
    end_time DECIMAL(10,3) NOT NULL,
    duration DECIMAL(10,3) GENERATED ALWAYS AS (end_time - start_time) STORED,
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    punctuation VARCHAR(10),
    speaker VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exports de transcription
CREATE TABLE IF NOT EXISTS video_transcription_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcription_id UUID REFERENCES video_transcriptions(id) ON DELETE CASCADE,
    format VARCHAR(20) NOT NULL CHECK (format IN ('text', 'json', 'srt', 'vtt', 'csv', 'pdf', 'docx')),
    options JSONB DEFAULT '{}', -- {includeTimestamps, includeConfidence, includeSpeakerLabels, includeMetadata, includeAudioAnalysis, customFormat, styling, filters}
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT DEFAULT 0,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des templates de transcription
CREATE TABLE IF NOT EXISTS video_transcription_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB NOT NULL, -- {language, detectLanguage, model, temperature, responseFormat, timestampGranularities, prompt, maxDuration, maxFileSize, enableDiarization, enableEmotionDetection, enableNoiseReduction, enableVolumeNormalization, outputFormat, includeTimestamps, includeConfidence, includeSpeakerLabels, customVocabulary}
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des statistiques de transcription vidéo
CREATE TABLE IF NOT EXISTS video_transcription_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_transcriptions INTEGER DEFAULT 0,
    completed_transcriptions INTEGER DEFAULT 0,
    failed_transcriptions INTEGER DEFAULT 0,
    average_processing_time INTEGER DEFAULT 0, -- en secondes
    total_audio_duration INTEGER DEFAULT 0, -- en secondes
    average_accuracy DECIMAL(5,2) DEFAULT 0.00 CHECK (average_accuracy >= 0 AND average_accuracy <= 100),
    supported_languages TEXT[] DEFAULT '{}',
    most_used_languages JSONB DEFAULT '{}',
    transcription_models JSONB DEFAULT '{}',
    audio_formats JSONB DEFAULT '{}',
    file_sizes JSONB DEFAULT '{}', -- {averageSize, medianSize, minSize, maxSize, totalSize, sizeDistribution}
    durations JSONB DEFAULT '{}', -- {averageDuration, medianDuration, minDuration, maxDuration, totalDuration, durationDistribution}
    quality_scores JSONB DEFAULT '{}', -- {averageAccuracy, medianAccuracy, minAccuracy, maxAccuracy, accuracyDistribution, languageAccuracy, modelAccuracy}
    user_activity JSONB DEFAULT '{}', -- {lastTranscriptionAt, totalTranscriptions, successfulTranscriptions, failedTranscriptions, averageAccuracy, preferredLanguage, preferredModel, averageProcessingTime, totalAudioDuration, mostActiveDay, mostActiveHour, transcriptionPatterns}
    trends JSONB DEFAULT '{}', -- {transcriptionTrend, accuracyTrend, durationTrend, errorTrend}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Table des logs d'activité de transcription
CREATE TABLE IF NOT EXISTS video_transcription_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id UUID REFERENCES video_transcription_sessions(id) ON DELETE SET NULL,
    transcription_id UUID REFERENCES video_transcriptions(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('session_started', 'session_completed', 'session_failed', 'video_uploaded', 'audio_extracted', 'audio_analyzed', 'transcription_started', 'transcription_completed', 'segments_processed', 'speakers_detected', 'emotions_analyzed', 'export_started', 'export_completed', 'error_occurred', 'api_call', 'settings_updated')),
    activity_details JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('session', 'processing', 'transcription', 'export', 'error', 'performance', 'api', 'user')),
    duration INTEGER, -- en millisecondes
    metadata JSONB DEFAULT '{}'
);

-- Index pour les performances
CREATE INDEX idx_video_transcriptions_user_id ON video_transcriptions(user_id);
CREATE INDEX idx_video_transcriptions_video_id ON video_transcriptions(video_id);
CREATE INDEX idx_video_transcriptions_status ON video_transcriptions(status);
CREATE INDEX idx_video_transcriptions_language ON video_transcriptions(language);
CREATE INDEX idx_video_transcriptions_detected_language ON video_transcriptions(detected_language);
CREATE INDEX idx_video_transcriptions_created_at ON video_transcriptions(created_at DESC);
CREATE INDEX idx_video_transcriptions_processed_at ON video_transcriptions(processed_at DESC);
CREATE INDEX idx_video_transcriptions_duration ON video_transcriptions(duration);

CREATE INDEX idx_video_transcription_sessions_user_id ON video_transcription_sessions(user_id);
CREATE INDEX idx_video_transcription_sessions_video_id ON video_transcription_sessions(video_id);
CREATE INDEX idx_video_transcription_sessions_status ON video_transcription_sessions(status);
CREATE INDEX idx_video_transcription_sessions_start_time ON video_transcription_sessions(start_time DESC);
CREATE INDEX idx_video_transcription_sessions_created_at ON video_transcription_sessions(created_at DESC);

CREATE INDEX idx_video_transcription_segments_transcription_id ON video_transcription_segments(transcription_id);
CREATE INDEX idx_video_transcription_segments_segment_id ON video_transcription_segments(segment_id);
CREATE INDEX idx_video_transcription_segments_start_time ON video_transcription_segments(start_time);
CREATE INDEX idx_video_transcription_segments_end_time ON video_transcription_segments(end_time);
CREATE INDEX idx_video_transcription_segments_speaker ON video_transcription_segments(speaker);
CREATE INDEX idx_video_transcription_segments_timestamp ON video_transcription_segments(timestamp DESC);

CREATE INDEX idx_video_transcription_words_segment_id ON video_transcription_words(segment_id);
CREATE INDEX idx_video_transcription_words_transcription_id ON video_transcription_words(transcription_id);
CREATE INDEX idx_video_transcription_words_start_time ON video_transcription_words(start_time);
CREATE INDEX idx_video_transcription_words_end_time ON video_transcription_words(end_time);
CREATE INDEX idx_video_transcription_words_speaker ON video_transcription_words(speaker);
CREATE INDEX idx_video_transcription_words_word ON video_transcription_words(word);

CREATE INDEX idx_video_transcription_exports_transcription_id ON video_transcription_exports(transcription_id);
CREATE INDEX idx_video_transcription_exports_format ON video_transcription_exports(format);
CREATE INDEX idx_video_transcription_exports_status ON video_transcription_exports(status);
CREATE INDEX idx_video_transcription_exports_created_at ON video_transcription_exports(created_at DESC);

CREATE INDEX idx_video_transcription_templates_is_default ON video_transcription_templates(is_default);
CREATE INDEX idx_video_transcription_templates_is_active ON video_transcription_templates(is_active);
CREATE INDEX idx_video_transcription_templates_created_by ON video_transcription_templates(created_by);

CREATE INDEX idx_video_transcription_statistics_date ON video_transcription_statistics(date);
CREATE INDEX idx_video_transcription_statistics_created_at ON video_transcription_statistics(created_at DESC);

CREATE INDEX idx_video_transcription_activity_logs_user_id ON video_transcription_activity_logs(user_id);
CREATE INDEX idx_video_transcription_activity_logs_session_id ON video_transcription_activity_logs(session_id);
CREATE INDEX idx_video_transcription_activity_logs_transcription_id ON video_transcription_activity_logs(transcription_id);
CREATE INDEX idx_video_transcription_activity_logs_activity_type ON video_transcription_activity_logs(activity_type);
CREATE INDEX idx_video_transcription_activity_logs_timestamp ON video_transcription_activity_logs(timestamp DESC);
CREATE INDEX idx_video_transcription_activity_logs_severity ON video_transcription_activity_logs(severity);
CREATE INDEX idx_video_transcription_activity_logs_category ON video_transcription_activity_logs(category);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_video_transcriptions_updated_at 
    BEFORE UPDATE ON video_transcriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_transcription_sessions_updated_at 
    BEFORE UPDATE ON video_transcription_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_transcription_segments_updated_at 
    BEFORE UPDATE ON video_transcription_segments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_transcription_templates_updated_at 
    BEFORE UPDATE ON video_transcription_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_transcription_statistics_updated_at 
    BEFORE UPDATE ON video_transcription_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_video_transcription_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO video_transcription_statistics (
        date,
        total_transcriptions,
        completed_transcriptions,
        failed_transcriptions,
        average_processing_time,
        total_audio_duration,
        average_accuracy,
        supported_languages,
        most_used_languages,
        transcription_models,
        audio_formats,
        file_sizes,
        durations,
        quality_scores,
        user_activity,
        trends
    )
    SELECT 
        CURRENT_DATE,
        (SELECT COUNT(*) FROM video_transcriptions) as total_transcriptions,
        (SELECT COUNT(*) FROM video_transcriptions WHERE status = 'completed') as completed_transcriptions,
        (SELECT COUNT(*) FROM video_transcriptions WHERE status = 'failed') as failed_transcriptions,
        COALESCE(AVG((metadata->>'processingTime')::INTEGER), 0)::INTEGER as average_processing_time,
        COALESCE(SUM(duration), 0) as total_audio_duration,
        COALESCE(AVG((metadata->>'confidence')::DECIMAL * 100), 0) as average_accuracy,
        (SELECT ARRAY_AGG(DISTINCT language) FROM video_transcriptions) as supported_languages,
        jsonb_build_object(
            'fr', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'fr'),
            'en', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'en'),
            'es', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'es'),
            'de', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'de'),
            'it', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'it'),
            'pt', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'pt'),
            'nl', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'nl'),
            'ja', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'ja'),
            'ko', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'ko'),
            'zh', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'zh')
        ),
        jsonb_build_object(
            'whisper-1', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-1'),
            'whisper-tiny', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-tiny'),
            'whisper-base', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-base'),
            'whisper-small', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-small'),
            'whisper-medium', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-medium'),
            'whisper-large', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-large')
        ),
        jsonb_build_object(
            'mp3', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'mp3'),
            'wav', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'wav'),
            'flac', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'flac'),
            'aac', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'aac'),
            'ogg', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'ogg')
        ),
        jsonb_build_object(
            'averageSize', COALESCE(AVG(file_size), 0),
            'medianSize', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY file_size) FROM video_transcriptions WHERE file_size > 0),
                0
            ),
            'minSize', COALESCE(MIN(file_size), 0),
            'maxSize', COALESCE(MAX(file_size), 0),
            'totalSize', COALESCE(SUM(file_size), 0)
        ),
        jsonb_build_object(
            'averageDuration', COALESCE(AVG(duration), 0),
            'medianDuration', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration) FROM video_transcriptions WHERE duration > 0),
                0
            ),
            'minDuration', COALESCE(MIN(duration), 0),
            'maxDuration', COALESCE(MAX(duration), 0),
            'totalDuration', COALESCE(SUM(duration), 0)
        ),
        jsonb_build_object(
            'averageAccuracy', COALESCE(AVG((metadata->>'confidence')::DECIMAL * 100), 0),
            'medianAccuracy', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (metadata->>'confidence')::DECIMAL * 100) FROM video_transcriptions WHERE (metadata->>'confidence')::DECIMAL > 0),
                0
            ),
            'minAccuracy', COALESCE(MIN((metadata->>'confidence')::DECIMAL * 100), 0),
            'maxAccuracy', COALESCE(MAX((metadata->>'confidence')::DECIMAL * 100), 0)
        ),
        jsonb_build_object(
            'lastTranscriptionAt', (SELECT MAX(created_at) FROM video_transcriptions WHERE status = 'completed'),
            'totalTranscriptions', (SELECT COUNT(*) FROM video_transcriptions),
            'successfulTranscriptions', (SELECT COUNT(*) FROM video_transcriptions WHERE status = 'completed'),
            'failedTranscriptions', (SELECT COUNT(*) FROM video_transcriptions WHERE status = 'failed'),
            'averageAccuracy', COALESCE(AVG((metadata->>'confidence')::DECIMAL * 100), 0),
            'preferredLanguage', (SELECT language FROM video_transcriptions GROUP BY language ORDER BY COUNT(*) DESC LIMIT 1),
            'preferredModel', (SELECT (metadata->>'model') FROM video_transcriptions GROUP BY (metadata->>'model') ORDER BY COUNT(*) DESC LIMIT 1),
            'averageProcessingTime', COALESCE(AVG((metadata->>'processingTime')::INTEGER), 0),
            'totalAudioDuration', COALESCE(SUM(duration), 0)
        ),
        jsonb_build_object(
            'transcriptionTrend', ARRAY(
                SELECT COUNT(*) 
                FROM video_transcriptions 
                WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'accuracyTrend', ARRAY(
                SELECT COALESCE(AVG((metadata->>'confidence')::DECIMAL * 100), 0)
                FROM video_transcriptions 
                WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'durationTrend', ARRAY(
                SELECT AVG(duration)
                FROM video_transcriptions 
                WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'errorTrend', ARRAY(
                SELECT COUNT(*) 
                FROM video_transcriptions 
                WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days' 
                AND status = 'failed'
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            )
        )
    ON CONFLICT (date) DO UPDATE SET
        total_transcriptions = EXCLUDED.total_transcriptions,
        completed_transcriptions = EXCLUDED.completed_transcriptions,
        failed_transcriptions = EXCLUDED.failed_transcriptions,
        average_processing_time = EXCLUDED.average_processing_time,
        total_audio_duration = EXCLUDED.total_audio_duration,
        average_accuracy = EXCLUDED.average_accuracy,
        supported_languages = EXCLUDED.supported_languages,
        most_used_languages = EXCLUDED.most_used_languages,
        transcription_models = EXCLUDED.transcription_models,
        audio_formats = EXCLUDED.audio_formats,
        file_sizes = EXCLUDED.file_sizes,
        durations = EXCLUDED.durations,
        quality_scores = EXCLUDED.quality_scores,
        user_activity = EXCLUDED.user_activity,
        trends = EXCLUDED.trends,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_transcription_statistics_transcriptions
    AFTER INSERT ON video_transcriptions
    FOR EACH ROW EXECUTE FUNCTION update_video_transcription_statistics();

CREATE TRIGGER trigger_update_video_transcription_statistics_activity
    AFTER INSERT ON video_transcription_activity_logs
    FOR EACH ROW EXECUTE FUNCTION update_video_transcription_statistics();

-- Politiques RLS pour les transcriptions
ALTER TABLE video_transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own video transcriptions" ON video_transcriptions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all video transcriptions" ON video_transcriptions
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
ALTER TABLE video_transcription_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video transcription sessions" ON video_transcription_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all video transcription sessions" ON video_transcription_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les segments
ALTER TABLE video_transcription_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video transcription segments" ON video_transcription_segments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM video_transcriptions vt
            WHERE vt.id = transcription_id AND vt.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all video transcription segments" ON video_transcription_segments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les mots
ALTER TABLE video_transcription_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video transcription words" ON video_transcription_words
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM video_transcriptions vt
            WHERE vt.id = transcription_id AND vt.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all video transcription words" ON video_transcription_words
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les exports
ALTER TABLE video_transcription_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own video transcription exports" ON video_transcription_exports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM video_transcriptions vt
            WHERE vt.id = transcription_id AND vt.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all video transcription exports" ON video_transcription_exports
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
ALTER TABLE video_transcription_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active video transcription templates" ON video_transcription_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage video transcription templates" ON video_transcription_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les statistiques
ALTER TABLE video_transcription_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view video transcription statistics" ON video_transcription_statistics
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage video transcription statistics" ON video_transcription_statistics
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
ALTER TABLE video_transcription_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video transcription activity logs" ON video_transcription_activity_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all video transcription activity logs" ON video_transcription_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour la transcription vidéo

-- Fonction pour obtenir les statistiques de transcription vidéo
CREATE OR REPLACE FUNCTION get_video_transcription_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_transcriptions BIGINT,
    completed_transcriptions BIGINT,
    failed_transcriptions BIGINT,
    average_processing_time INTEGER,
    total_audio_duration BIGINT,
    average_accuracy DECIMAL(5,2),
    supported_languages TEXT[],
    most_used_languages JSONB,
    transcription_models JSONB,
    audio_formats JSONB,
    file_sizes JSONB,
    durations JSONB,
    quality_scores JSONB,
    user_activity JSONB,
    trends JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM video_transcriptions),
        (SELECT COUNT(*) FROM video_transcriptions WHERE status = 'completed'),
        (SELECT COUNT(*) FROM video_transcriptions WHERE status = 'failed'),
        COALESCE(AVG((metadata->>'processingTime')::INTEGER), 0)::INTEGER,
        COALESCE(SUM(duration), 0),
        COALESCE(AVG((metadata->>'confidence')::DECIMAL * 100), 0),
        (SELECT ARRAY_AGG(DISTINCT language) FROM video_transcriptions),
        (SELECT jsonb_build_object(
            'fr', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'fr'),
            'en', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'en'),
            'es', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'es'),
            'de', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'de'),
            'it', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'it'),
            'pt', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'pt'),
            'nl', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'nl'),
            'ja', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'ja'),
            'ko', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'ko'),
            'zh', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'zh')
        )),
        (SELECT jsonb_build_object(
            'whisper-1', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-1'),
            'whisper-tiny', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-tiny'),
            'whisper-base', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-base'),
            'whisper-small', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-small'),
            'whisper-medium', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-medium'),
            'whisper-large', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-large')
        )),
        (SELECT jsonb_build_object(
            'mp3', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'mp3'),
            'wav', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'wav'),
            'flac', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'flac'),
            'aac', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'aac'),
            'ogg', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'ogg')
        )),
        (SELECT jsonb_build_object(
            'averageSize', COALESCE(AVG(file_size), 0),
            'medianSize', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY file_size) FROM video_transcriptions WHERE file_size > 0),
                0
            ),
            'minSize', COALESCE(MIN(file_size), 0),
            'maxSize', COALESCE(MAX(file_size), 0),
            'totalSize', COALESCE(SUM(file_size), 0)
        )),
        (SELECT jsonb_build_object(
            'averageDuration', COALESCE(AVG(duration), 0),
            'medianDuration', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration) FROM video_transcriptions WHERE duration > 0),
                0
            ),
            'minDuration', COALESCE(MIN(duration), 0),
            'maxDuration', COALESCE(MAX(duration), 0),
            'totalDuration', COALESCE(SUM(duration), 0)
        )),
        (SELECT jsonb_build_object(
            'averageAccuracy', COALESCE(AVG((metadata->>'confidence')::DECIMAL * 100), 0),
            'medianAccuracy', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (metadata->>'confidence')::DECIMAL * 100) FROM video_transcriptions WHERE (metadata->>'confidence')::DECIMAL > 0),
                0
            ),
            'minAccuracy', COALESCE(MIN((metadata->>'confidence')::DECIMAL * 100), 0),
            'maxAccuracy', COALESCE(MAX((metadata->>'confidence')::DECIMAL * 100), 0)
        )),
        (SELECT jsonb_build_object(
            'lastTranscriptionAt', (SELECT MAX(created_at) FROM video_transcriptions WHERE status = 'completed'),
            'totalTranscriptions', (SELECT COUNT(*) FROM video_transcriptions),
            'successfulTranscriptions', (SELECT COUNT(*) FROM video_transcriptions WHERE status = 'completed'),
            'failedTranscriptions', (SELECT COUNT(*) FROM video_transcriptions WHERE status = 'failed'),
            'averageAccuracy', COALESCE(AVG((metadata->>'confidence')::DECIMAL * 100), 0),
            'preferredLanguage', (SELECT language FROM video_transcriptions GROUP BY language ORDER BY COUNT(*) DESC LIMIT 1),
            'preferredModel', (SELECT (metadata->>'model') FROM video_transcriptions GROUP BY (metadata->>'model') ORDER BY COUNT(*) DESC LIMIT 1),
            'averageProcessingTime', COALESCE(AVG((metadata->>'processingTime')::INTEGER), 0),
            'totalAudioDuration', COALESCE(SUM(duration), 0)
        )),
        (SELECT jsonb_build_object(
            'transcriptionTrend', ARRAY(
                SELECT COUNT(*) 
                FROM video_transcriptions 
                WHERE DATE(created_at) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'accuracyTrend', ARRAY(
                SELECT COALESCE(AVG((metadata->>'confidence')::DECIMAL * 100), 0)
                FROM video_transcriptions 
                WHERE DATE(created_at) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'durationTrend', ARRAY(
                SELECT AVG(duration)
                FROM video_transcriptions 
                WHERE DATE(created_at) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'errorTrend', ARRAY(
                SELECT COUNT(*) 
                FROM video_transcriptions 
                WHERE DATE(created_at) >= p_date - INTERVAL '7 days' 
                AND status = 'failed'
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            )
        ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les templates de transcription par défaut
CREATE OR REPLACE FUNCTION create_default_video_transcription_templates()
RETURNS VOID AS $$
BEGIN
    INSERT INTO video_transcription_templates (
        name,
        description,
        settings,
        is_default,
        is_active
    ) VALUES 
        ('Standard', 'Template de transcription standard avec détection automatique de langue', 
         '{"language": "fr", "detectLanguage": true, "model": "whisper-1", "temperature": 0.0, "responseFormat": "verbose_json", "timestampGranularities": ["word", "segment"], "maxDuration": 3600, "maxFileSize": 500, "enableDiarization": true, "enableEmotionDetection": false, "enableNoiseReduction": true, "enableVolumeNormalization": true, "outputFormat": "json", "includeTimestamps": true, "includeConfidence": true, "includeSpeakerLabels": true}',
         true, true),
        ('Haute qualité', 'Template avec modèle large et analyse avancée', 
         '{"language": "fr", "detectLanguage": true, "model": "whisper-large", "temperature": 0.0, "responseFormat": "verbose_json", "timestampGranularities": ["word", "segment"], "maxDuration": 7200, "maxFileSize": 1000, "enableDiarization": true, "enableEmotionDetection": true, "enableNoiseReduction": true, "enableVolumeNormalization": true, "outputFormat": "json", "includeTimestamps": true, "includeConfidence": true, "includeSpeakerLabels": true}',
         false, true),
        ('Rapide', 'Template optimisé pour la vitesse avec modèle tiny', 
         '{"language": "fr", "detectLanguage": false, "model": "whisper-tiny", "temperature": 0.0, "responseFormat": "verbose_json", "timestampGranularities": ["segment"], "maxDuration": 1800, "maxFileSize": 250, "enableDiarization": false, "enableEmotionDetection": false, "enableNoiseReduction": true, "enableVolumeNormalization": true, "outputFormat": "json", "includeTimestamps": true, "includeConfidence": false, "includeSpeakerLabels": false}',
         false, true),
        ('Multilingue', 'Template avec détection de langue et support multiple', 
         '{"language": "auto", "detectLanguage": true, "model": "whisper-1", "temperature": 0.0, "responseFormat": "verbose_json", "timestampGranularities": ["word", "segment"], "maxDuration": 3600, "maxFileSize": 500, "enableDiarization": true, "enableEmotionDetection": false, "enableNoiseReduction": true, "enableVolumeNormalization": true, "outputFormat": "json", "includeTimestamps": true, "includeConfidence": true, "includeSpeakerLabels": true}',
         false, true)
    ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        settings = EXCLUDED.settings,
        is_default = EXCLUDED.is_default,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_video_transcription_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO video_transcription_statistics (
        date,
        total_transcriptions,
        completed_transcriptions,
        failed_transcriptions,
        average_processing_time,
        total_audio_duration,
        average_accuracy,
        supported_languages,
        most_used_languages,
        transcription_models,
        audio_formats,
        file_sizes,
        durations,
        quality_scores,
        user_activity,
        trends
    )
    SELECT 
        p_date,
        (SELECT COUNT(*) FROM video_transcriptions) as total_transcriptions,
        (SELECT COUNT(*) FROM video_transcriptions WHERE status = 'completed') as completed_transcriptions,
        (SELECT COUNT(*) FROM video_transcriptions WHERE status = 'failed') as failed_transcriptions,
        COALESCE(AVG((metadata->>'processingTime')::INTEGER), 0)::INTEGER as average_processing_time,
        COALESCE(SUM(duration), 0) as total_audio_duration,
        COALESCE(AVG((metadata->>'confidence')::DECIMAL * 100), 0) as average_accuracy,
        (SELECT ARRAY_AGG(DISTINCT language) FROM video_transcriptions) as supported_languages,
        (SELECT jsonb_build_object(
            'fr', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'fr'),
            'en', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'en'),
            'es', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'es'),
            'de', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'de'),
            'it', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'it'),
            'pt', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'pt'),
            'nl', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'nl'),
            'ja', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'ja'),
            'ko', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'ko'),
            'zh', (SELECT COUNT(*) FROM video_transcriptions WHERE language = 'zh')
        )),
        (SELECT jsonb_build_object(
            'whisper-1', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-1'),
            'whisper-tiny', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-tiny'),
            'whisper-base', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-base'),
            'whisper-small', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-small'),
            'whisper-medium', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-medium'),
            'whisper-large', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'model') = 'whisper-large')
        )),
        (SELECT jsonb_build_object(
            'mp3', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'mp3'),
            'wav', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'wav'),
            'flac', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'flac'),
            'aac', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'aac'),
            'ogg', (SELECT COUNT(*) FROM video_transcriptions WHERE (metadata->>'audioFormat') = 'ogg')
        )),
        (SELECT jsonb_build_object(
            'averageSize', COALESCE(AVG(file_size), 0),
            'medianSize', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY file_size) FROM video_transcriptions WHERE file_size > 0),
                0
            ),
            'minSize', COALESCE(MIN(file_size), 0),
            'maxSize', COALESCE(MAX(file_size), 0),
            'totalSize', COALESCE(SUM(file_size), 0)
        )),
        (SELECT jsonb_build_object(
            'averageDuration', COALESCE(AVG(duration), 0),
            'medianDuration', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration) FROM video_transcriptions WHERE duration > 0),
                0
            ),
            'minDuration', COALESCE(MIN(duration), 0),
            'maxDuration', COALESCE(MAX(duration), 0),
            'totalDuration', COALESCE(SUM(duration), 0)
        )),
        (SELECT jsonb_build_object(
            'averageAccuracy', COALESCE(AVG((metadata->>'confidence')::DECIMAL * 100), 0),
            'medianAccuracy', COALESCE(
                (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (metadata->>'confidence')::DECIMAL * 100) FROM video_transcriptions WHERE (metadata->>'confidence')::DECIMAL > 0),
                0
            ),
            'minAccuracy', COALESCE(MIN((metadata->>'confidence')::DECIMAL * 100), 0),
            'maxAccuracy', COALESCE(MAX((metadata->>'confidence')::DECIMAL * 100), 0)
        )),
        (SELECT jsonb_build_object(
            'lastTranscriptionAt', (SELECT MAX(created_at) FROM video_transcriptions WHERE status = 'completed'),
            'totalTranscriptions', (SELECT COUNT(*) FROM video_transcriptions),
            'successfulTranscriptions', (SELECT COUNT(*) FROM video_transcriptions WHERE status = 'completed'),
            'failedTranscriptions', (SELECT COUNT(*) FROM video_transcriptions WHERE status = 'failed'),
            'averageAccuracy', COALESCE(AVG((metadata->>'confidence')::DECIMAL * 100), 0),
            'preferredLanguage', (SELECT language FROM video_transcriptions GROUP BY language ORDER BY COUNT(*) DESC LIMIT 1),
            'preferredModel', (SELECT (metadata->>'model') FROM video_transcriptions GROUP BY (metadata->>'model') ORDER BY COUNT(*) DESC LIMIT 1),
            'averageProcessingTime', COALESCE(AVG((metadata->>'processingTime')::INTEGER), 0),
            'totalAudioDuration', COALESCE(SUM(duration), 0)
        )),
        (SELECT jsonb_build_object(
            'transcriptionTrend', ARRAY(SELECT COUNT(*) FROM video_transcriptions WHERE DATE(created_at) >= p_date - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY DATE(created_at)),
            'accuracyTrend', ARRAY(SELECT COALESCE(AVG((metadata->>'confidence')::DECIMAL * 100), 0) FROM video_transcriptions WHERE DATE(created_at) >= p_date - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY DATE(created_at)),
            'durationTrend', ARRAY(SELECT AVG(duration) FROM video_transcriptions WHERE DATE(created_at) >= p_date - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY DATE(created_at)),
            'errorTrend', ARRAY(SELECT COUNT(*) FROM video_transcriptions WHERE DATE(created_at) >= p_date - INTERVAL '7 days' AND status = 'failed' GROUP BY DATE(created_at) ORDER BY DATE(created_at)))
        )
    ON CONFLICT (date) DO UPDATE SET
        total_transcriptions = EXCLUDED.total_transcriptions,
        completed_transcriptions = EXCLUDED.completed_transcriptions,
        failed_transcriptions = EXCLUDED.failed_transcriptions,
        average_processing_time = EXCLUDED.average_processing_time,
        total_audio_duration = EXCLUDED.total_audio_duration,
        average_accuracy = EXCLUDED.average_accuracy,
        supported_languages = EXCLUDED.supported_languages,
        most_used_languages = EXCLUDED.most_used_languages,
        transcription_models = EXCLUDED.transcription_models,
        audio_formats = EXCLUDED.audio_formats,
        file_sizes = EXCLUDED.file_sizes,
        durations = EXCLUDED.durations,
        quality_scores = EXCLUDED.quality_scores,
        user_activity = EXCLUDED.user_activity,
        trends = EXCLUDED.trends,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE video_transcriptions IS 'Transcriptions vidéo/audio générées par l\'API Whisper';
COMMENT ON TABLE video_transcription_sessions IS 'Sessions de transcription avec progression et état';
COMMENT ON TABLE video_transcription_segments IS 'Segments temporels des transcriptions avec détails';
COMMENT ON TABLE video_transcription_words IS 'Mots individuels des transcriptions avec timestamps';
COMMENT ON TABLE video_transcription_exports IS 'Exports de transcriptions dans différents formats';
COMMENT ON TABLE video_transcription_templates IS 'Templates de transcription avec paramètres prédéfinis';
COMMENT ON TABLE video_transcription_statistics IS 'Statistiques d\'utilisation et de performance de la transcription vidéo';
COMMENT ON TABLE video_transcription_activity_logs IS 'Logs d\'activité pour la transcription vidéo';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN video_transcriptions.segments IS 'Segments temporels [{id, start, end, text, confidence, speaker, language, words, timestamp, metadata}]';
COMMENT ON COLUMN video_transcriptions.metadata IS 'Métadonnées détaillées {originalFormat, audioFormat, sampleRate, channels, bitrate, codec, duration, fileSize, detectedLanguage, confidence, wordCount, speakerCount, segmentsCount, processingTime, model, temperature, prompt, languageDetection, audioAnalysis, quality}';
COMMENT ON COLUMN video_transcription_sessions.progress IS 'Progression détaillée {stage, percentage, message, details, estimatedTimeRemaining, currentFile, processedFiles, totalFiles, processedDuration, totalDuration}';
COMMENT ON COLUMN video_transcription_segments.metadata IS 'Métadonnées du segment {speakerId, speakerName, emotion, volume, speed, pitch, silence, music, noise, customTags}';
COMMENT ON COLUMN video_transcription_words.duration IS 'Durée du mot calculée automatiquement (end_time - start_time)';
COMMENT ON COLUMN video_transcription_statistics.trends IS 'Tendances sur 7 jours {transcriptionTrend, accuracyTrend, durationTrend, errorTrend}';
COMMENT ON COLUMN video_transcription_templates.settings IS 'Paramètres de transcription {language, detectLanguage, model, temperature, responseFormat, timestampGranularities, prompt, maxDuration, maxFileSize, enableDiarization, enableEmotionDetection, enableNoiseReduction, enableVolumeNormalization, outputFormat, includeTimestamps, includeConfidence, includeSpeakerLabels, customVocabulary}';
COMMENT ON COLUMN video_transcription_exports.options IS 'Options d\'export {includeTimestamps, includeConfidence, includeSpeakerLabels, includeMetadata, includeAudioAnalysis, customFormat, styling, filters}';

-- Créer les données par défaut
SELECT create_default_video_transcription_templates();
