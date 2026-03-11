-- Migration pour créer les tables de quiz générés par IA
-- Date: 10 mars 2026
-- Objectif: Support pour quiz auto-générés avec QCM variés

-- Table principale des quiz générés
CREATE TABLE IF NOT EXISTS generated_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL, -- Array de questions en format JSON
    metadata JSONB DEFAULT '{}', -- Statistiques et métadonnées du quiz
    settings JSONB DEFAULT '{}', -- Configuration du quiz
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT generated_quizzes_unique_document_user UNIQUE (user_id, document_id)
);

-- Table des résultats de quiz
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES generated_quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL, -- Score obtenu
    max_score INTEGER NOT NULL, -- Score maximum possible
    percentage DECIMAL(5,2) NOT NULL, -- Pourcentage de réussite
    passed BOOLEAN NOT NULL, -- Si le quiz est réussi
    time_taken INTEGER, -- Temps en secondes
    answers JSONB NOT NULL, -- Réponses de l'utilisateur
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des statistiques de questions
CREATE TABLE IF NOT EXISTS question_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES generated_quizzes(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    user_answer TEXT,
    correct_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_taken INTEGER, -- Temps pour cette question en secondes
    hints_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_generated_quizzes_user_id ON generated_quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_quizzes_document_id ON generated_quizzes(document_id);
CREATE INDEX IF NOT EXISTS idx_generated_quizzes_created_at ON generated_quizzes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at ON quiz_results(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_statistics_user_id ON question_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_question_statistics_quiz_id ON question_statistics(quiz_id);

-- Trigger pour updated_at
CREATE TRIGGER update_generated_quizzes_updated_at 
    BEFORE UPDATE ON generated_quizzes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS
ALTER TABLE generated_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_statistics ENABLE ROW LEVEL SECURITY;

-- Politiques pour generated_quizzes
CREATE POLICY "Users can view own generated quizzes" ON generated_quizzes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own generated quizzes" ON generated_quizzes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own generated quizzes" ON generated_quizzes
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own generated quizzes" ON generated_quizzes
    FOR DELETE USING (user_id = auth.uid());

-- Politiques pour quiz_results
CREATE POLICY "Users can manage own quiz results" ON quiz_results
    FOR ALL USING (user_id = auth.uid());

-- Politiques pour question_statistics
CREATE POLICY "Users can manage own question statistics" ON question_statistics
    FOR ALL USING (user_id = auth.uid());

-- Fonctions RPC pour l'application

-- Obtenir les quiz d'un utilisateur avec pagination
CREATE OR REPLACE FUNCTION get_user_quizzes(
    p_user_id UUID DEFAULT auth.uid(),
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0,
    p_order_by TEXT DEFAULT 'created_at DESC'
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    document_title TEXT,
    document_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gq.id,
        gq.title,
        gq.description,
        gq.metadata,
        gq.created_at,
        d.name as document_title,
        d.type as document_type
    FROM generated_quizzes gq
    LEFT JOIN documents d ON gq.document_id = d.id
    WHERE gq.user_id = p_user_id
    ORDER BY 
        CASE 
            WHEN p_order_by = 'title' THEN gq.title
            WHEN p_order_by = 'created_at' THEN gq.created_at::TEXT
            ELSE gq.created_at::TEXT
        END
        ${CASE WHEN p_order_by LIKE '%DESC' THEN 'DESC' ELSE 'ASC' END}
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sauvegarder un résultat de quiz complet
CREATE OR REPLACE FUNCTION save_quiz_result(
    p_quiz_id UUID,
    p_score INTEGER,
    p_max_score INTEGER,
    p_time_taken INTEGER,
    p_answers JSONB
)
RETURNS UUID AS $$
DECLARE
    result_id UUID;
    percentage DECIMAL(5,2);
    passed BOOLEAN;
BEGIN
    -- Calculer le pourcentage et si réussi
    percentage := (p_score::DECIMAL / p_max_score::DECIMAL) * 100;
    passed := percentage >= 70; -- Seuil de passage par défaut
    
    -- Insérer le résultat principal
    INSERT INTO quiz_results (
        user_id,
        quiz_id,
        score,
        max_score,
        percentage,
        passed,
        time_taken,
        answers,
        started_at,
        completed_at
    ) VALUES (
        auth.uid(),
        p_quiz_id,
        p_score,
        p_max_score,
        percentage,
        passed,
        p_time_taken,
        p_answers,
        NOW(),
        NOW()
    ) RETURNING id INTO result_id;
    
    -- Insérer les statistiques détaillées par question
    INSERT INTO question_statistics (
        user_id,
        quiz_id,
        question_index,
        question_text,
        user_answer,
        correct_answer,
        is_correct,
        time_taken
    )
    SELECT 
        auth.uid(),
        p_quiz_id,
        elem->>'index'::INTEGER,
        elem->>'question',
        elem->>'userAnswer',
        elem->>'correctAnswer',
        (elem->>'userAnswer') = (elem->>'correctAnswer'),
        (elem->>'timeTaken')::INTEGER
    FROM jsonb_array_elements(p_answers) AS elem;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir les statistiques d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_quiz_stats(
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    total_quizzes INTEGER,
    total_attempts INTEGER,
    average_score DECIMAL(5,2),
    best_score DECIMAL(5,2),
    completion_rate DECIMAL(5,2),
    favorite_category TEXT,
    total_time INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT qr.quiz_id) as total_quizzes,
        COUNT(qr.id) as total_attempts,
        AVG(qr.percentage) as average_score,
        MAX(qr.percentage) as best_score,
        (COUNT(CASE WHEN qr.completed_at IS NOT NULL THEN 1 END)::DECIMAL / COUNT(qr.id)) * 100 as completion_rate,
        NULL as favorite_category, -- À implémenter avec analyse des catégories
        SUM(qr.time_taken) as total_time
    FROM quiz_results qr
    WHERE qr.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir les quiz récents pour le dashboard
CREATE OR REPLACE FUNCTION get_recent_quizzes(
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    document_name TEXT,
    question_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    last_attempt TIMESTAMP WITH TIME ZONE,
    best_score DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gq.id,
        gq.title,
        d.name as document_name,
        (gq.metadata->>'totalQuestions')::INTEGER as question_count,
        gq.created_at,
        MAX(qr.completed_at) as last_attempt,
        MAX(qr.percentage) as best_score
    FROM generated_quizzes gq
    LEFT JOIN documents d ON gq.document_id = d.id
    LEFT JOIN quiz_results qr ON gq.id = qr.quiz_id AND qr.user_id = auth.uid()
    WHERE gq.user_id = auth.uid()
    GROUP BY gq.id, d.name
    ORDER BY gq.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE generated_quizzes IS 'Quiz auto-générés par IA à partir de documents';
COMMENT ON TABLE quiz_results IS 'Résultats des quiz passés par les utilisateurs';
COMMENT ON TABLE question_statistics IS 'Statistiques détaillées par question pour analyse';
COMMENT ON COLUMN generated_quizzes.questions IS 'Questions du quiz en format JSON avec types variés';
COMMENT ON COLUMN generated_quizzes.metadata IS 'Métadonnées du quiz (distribution difficulté, types, etc.)';
COMMENT ON COLUMN quiz_results.answers IS 'Réponses détaillées de l utilisateur en JSON';
