-- Migration pour créer les tables de guides d'étude générés par IA
-- Date: 10 mars 2026
-- Objectif: Support pour guides d'étude structurés avec sections, activités et évaluations

-- Table principale des guides d'étude
CREATE TABLE IF NOT EXISTS study_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_audience TEXT,
    estimated_duration INTEGER NOT NULL, -- Heures
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
    language TEXT DEFAULT 'fr',
    objectives JSONB DEFAULT '[]',
    structure JSONB NOT NULL, -- Sections du guide
    resources JSONB DEFAULT '[]', -- Ressources complémentaires
    assessments JSONB DEFAULT '[]', -- Évaluations
    schedule JSONB NOT NULL, -- Emploi du temps
    metadata JSONB DEFAULT '{}', -- Métadonnées du guide
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT study_guides_unique_document_user UNIQUE (user_id, document_id)
);

-- Table de progression des utilisateurs dans les guides
CREATE TABLE IF NOT EXISTS study_guide_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES study_guides(id) ON DELETE CASCADE,
    current_section INTEGER DEFAULT 1,
    completed_sections JSONB DEFAULT '[]', -- IDs des sections complétées
    completed_activities JSONB DEFAULT '[]', -- IDs des activités complétées
    assessment_scores JSONB DEFAULT '{}', -- Scores par évaluation
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_access TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    total_time_spent INTEGER DEFAULT 0, -- Minutes
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT study_guide_progress_unique_user_guide UNIQUE (user_id, guide_id)
);

-- Table des sessions d'étude
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES study_guides(id) ON DELETE CASCADE,
    session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration INTEGER NOT NULL, -- Minutes
    sections_completed JSONB DEFAULT '[]', -- IDs des sections étudiées
    activities_completed JSONB DEFAULT '[]', -- IDs des activités faites
    notes TEXT,
    self_rating INTEGER CHECK (self_rating >= 1 AND self_rating <= 5), -- Auto-évaluation 1-5
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_study_guides_user_id ON study_guides(user_id);
CREATE INDEX IF NOT EXISTS idx_study_guides_document_id ON study_guides(document_id);
CREATE INDEX IF NOT EXISTS idx_study_guides_created_at ON study_guides(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_guides_difficulty ON study_guides(difficulty);

CREATE INDEX IF NOT EXISTS idx_study_guide_progress_user_id ON study_guide_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_study_guide_progress_guide_id ON study_guide_progress(guide_id);
CREATE INDEX IF NOT EXISTS idx_study_guide_progress_completion ON study_guide_progress(completion_date DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_guide_id ON study_sessions(guide_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(session_date DESC);

-- Trigger pour updated_at
CREATE TRIGGER update_study_guides_updated_at 
    BEFORE UPDATE ON study_guides 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_guide_progress_updated_at 
    BEFORE UPDATE ON study_guide_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS
ALTER TABLE study_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_guide_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques pour study_guides
CREATE POLICY "Users can view own study guides" ON study_guides
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own study guides" ON study_guides
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own study guides" ON study_guides
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own study guides" ON study_guides
    FOR DELETE USING (user_id = auth.uid());

-- Politiques pour study_guide_progress
CREATE POLICY "Users can manage own study guide progress" ON study_guide_progress
    FOR ALL USING (user_id = auth.uid());

-- Politiques pour study_sessions
CREATE POLICY "Users can manage own study sessions" ON study_sessions
    FOR ALL USING (user_id = auth.uid());

-- Fonctions RPC pour l'application

-- Obtenir les guides d'un utilisateur avec pagination
CREATE OR REPLACE FUNCTION get_user_study_guides(
    p_user_id UUID DEFAULT auth.uid(),
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0,
    p_order_by TEXT DEFAULT 'created_at DESC'
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    target_audience TEXT,
    estimated_duration INTEGER,
    difficulty TEXT,
    document_title TEXT,
    document_type TEXT,
    progress_percentage DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sg.id,
        sg.title,
        sg.description,
        sg.target_audience,
        sg.estimated_duration,
        sg.difficulty,
        d.name as document_title,
        d.type as document_type,
        CASE 
            WHEN sgp.completion_date IS NOT NULL THEN 100
            WHEN sgp.current_section > 1 THEN 
                ((sgp.current_section - 1)::DECIMAL / (sg.structure->>'sectionCount')::INTEGER * 100)
            ELSE 0
        END as progress_percentage,
        sg.created_at
    FROM study_guides sg
    LEFT JOIN documents d ON sg.document_id = d.id
    LEFT JOIN study_guide_progress sgp ON sg.id = sgp.guide_id AND sgp.user_id = p_user_id
    WHERE sg.user_id = p_user_id
    ORDER BY 
        CASE 
            WHEN p_order_by = 'title' THEN sg.title
            WHEN p_order_by = 'duration' THEN sg.estimated_duration::TEXT
            WHEN p_order_by = 'difficulty' THEN sg.difficulty
            ELSE sg.created_at::TEXT
        END
        ${CASE WHEN p_order_by LIKE '%DESC' THEN 'DESC' ELSE 'ASC' END}
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Démarrer ou mettre à jour la progression d'un guide
CREATE OR REPLACE FUNCTION start_or_update_guide_progress(
    p_guide_id UUID,
    p_section_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    progress_id UUID;
    guide_sections JSONB;
BEGIN
    -- Obtenir les sections du guide
    SELECT structure INTO guide_sections
    FROM study_guides
    WHERE id = p_guide_id AND user_id = auth.uid();
    
    -- Insérer ou mettre à jour la progression
    INSERT INTO study_guide_progress (
        user_id,
        guide_id,
        current_section,
        last_access
    ) VALUES (
        auth.uid(),
        p_guide_id,
        COALESCE(
            (SELECT current_section FROM study_guide_progress 
             WHERE user_id = auth.uid() AND guide_id = p_guide_id),
            1
        ),
        NOW()
    )
    ON CONFLICT (user_id, guide_id) 
    DO UPDATE SET
        last_access = NOW(),
        current_section = CASE 
            WHEN p_section_id IS NOT NULL THEN 
                LEAST(
                    study_guide_progress.current_section + 1,
                    jsonb_array_length(guide_sections)
                )
            ELSE study_guide_progress.current_section
        END
    RETURNING id INTO progress_id;
    
    RETURN progress_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enregistrer une session d'étude
CREATE OR REPLACE FUNCTION record_study_session(
    p_guide_id UUID,
    p_duration INTEGER,
    p_sections_completed JSONB DEFAULT '[]',
    p_activities_completed JSONB DEFAULT '[]',
    p_notes TEXT DEFAULT NULL,
    p_self_rating INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    -- Insérer la session
    INSERT INTO study_sessions (
        user_id,
        guide_id,
        duration,
        sections_completed,
        activities_completed,
        notes,
        self_rating
    ) VALUES (
        auth.uid(),
        p_guide_id,
        p_duration,
        p_sections_completed,
        p_activities_completed,
        p_notes,
        p_self_rating
    ) RETURNING id INTO session_id;
    
    -- Mettre à jour la progression totale
    UPDATE study_guide_progress
    SET 
        total_time_spent = total_time_spent + p_duration,
        last_access = NOW(),
        completed_sections = array_cat(
            COALESCE(completed_sections, '[]'::jsonb),
            p_sections_completed
        ),
        completed_activities = array_cat(
            COALESCE(completed_activities, '[]'::jsonb),
            p_activities_completed
        )
    WHERE guide_id = p_guide_id AND user_id = auth.uid();
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir les statistiques d'étude d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_study_stats(
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    total_guides INTEGER,
    completed_guides INTEGER,
    in_progress_guides INTEGER,
    total_study_time INTEGER, -- Minutes
    average_session_duration DECIMAL,
    favorite_difficulty TEXT,
    guides_this_month INTEGER,
    completion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT sg.id) as total_guides,
        COUNT(DISTINCT CASE WHEN sgp.completion_date IS NOT NULL THEN sg.id END) as completed_guides,
        COUNT(DISTINCT CASE WHEN sgp.completion_date IS NULL THEN sg.id END) as in_progress_guides,
        COALESCE(SUM(sgp.total_time_spent), 0) as total_study_time,
        COALESCE(AVG(ss.duration), 0) as average_session_duration,
        mode() WITHIN GROUP (ORDER BY sg.difficulty) as favorite_difficulty,
        COUNT(DISTINCT CASE WHEN sg.created_at >= date_trunc('month', CURRENT_DATE) THEN sg.id END) as guides_this_month,
        CASE 
            WHEN COUNT(DISTINCT sg.id) > 0 THEN 
                (COUNT(DISTINCT CASE WHEN sgp.completion_date IS NOT NULL THEN sg.id END)::DECIMAL / COUNT(DISTINCT sg.id)) * 100
            ELSE 0
        END as completion_rate
    FROM study_guides sg
    LEFT JOIN study_guide_progress sgp ON sg.id = sgp.guide_id AND sgp.user_id = p_user_id
    LEFT JOIN study_sessions ss ON sg.id = ss.guide_id AND ss.user_id = p_user_id
    WHERE sg.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir les guides récents pour le dashboard
CREATE OR REPLACE FUNCTION get_recent_study_guides(
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    document_name TEXT,
    estimated_duration INTEGER,
    difficulty TEXT,
    progress_percentage DECIMAL,
    last_session_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sg.id,
        sg.title,
        d.name as document_name,
        sg.estimated_duration,
        sg.difficulty,
        CASE 
            WHEN sgp.completion_date IS NOT NULL THEN 100
            WHEN sgp.current_section > 1 THEN 
                ((sgp.current_section - 1)::DECIMAL / jsonb_array_length(sg.structure)) * 100
            ELSE 0
        END as progress_percentage,
        MAX(ss.session_date) as last_session_date,
        sg.created_at
    FROM study_guides sg
    LEFT JOIN documents d ON sg.document_id = d.id
    LEFT JOIN study_guide_progress sgp ON sg.id = sgp.guide_id AND sgp.user_id = auth.uid()
    LEFT JOIN study_sessions ss ON sg.id = ss.guide_id AND ss.user_id = auth.uid()
    WHERE sg.user_id = auth.uid()
    GROUP BY sg.id, d.name, sgp.current_section, sgp.completion_date
    ORDER BY sg.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE study_guides IS 'Guides d\'étude générés par IA à partir de documents';
COMMENT ON TABLE study_guide_progress IS 'Progression des utilisateurs dans les guides d\'étude';
COMMENT ON TABLE study_sessions IS 'Sessions d\'étude individuelles des utilisateurs';
COMMENT ON COLUMN study_guides.structure IS 'Structure du guide avec sections, activités et objectifs';
COMMENT ON COLUMN study_guides.schedule IS 'Emploi du temps du guide (sessions, durée, rythme)';
COMMENT ON COLUMN study_guide_progress.completed_sections IS 'Liste des IDs des sections complétées';
COMMENT ON COLUMN study_sessions.self_rating IS 'Auto-évaluation de la session (1-5 étoiles)';
