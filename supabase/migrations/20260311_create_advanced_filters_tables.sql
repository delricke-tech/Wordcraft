-- Migration: Création des tables pour les filtres avancés (multi-critères combinés)
-- Date: 11 mars 2026
-- Description: Tables pour gérer les filtres complexes et préréglages

-- Table des groupes de filtres
CREATE TABLE IF NOT EXISTS filter_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL DEFAULT '[]',
    logical_operator VARCHAR(3) NOT NULL DEFAULT 'AND' CHECK (logical_operator IN ('AND', 'OR')),
    is_public BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
);

-- Table des préréglages de filtres
CREATE TABLE IF NOT EXISTS filter_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target VARCHAR(50) NOT NULL CHECK (target IN ('documents', 'notes', 'conversations', 'flashcards', 'quiz', 'all')),
    filter_group_id UUID NOT NULL REFERENCES filter_groups(id) ON DELETE CASCADE,
    sort_by VARCHAR(100),
    sort_order VARCHAR(4) DEFAULT 'asc' CHECK (sort_order IN ('asc', 'desc')),
    limit INTEGER DEFAULT 50,
    is_default BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des logs d'utilisation des filtres
CREATE TABLE IF NOT EXISTS filter_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filter_group_id UUID REFERENCES filter_groups(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target VARCHAR(50) NOT NULL,
    execution_time_ms INTEGER,
    results_count INTEGER,
    total_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_filter_groups_created_by ON filter_groups(created_by);
CREATE INDEX idx_filter_groups_is_public ON filter_groups(is_public);
CREATE INDEX idx_filter_groups_usage_count ON filter_groups(usage_count DESC);
CREATE INDEX idx_filter_groups_created_at ON filter_groups(created_at DESC);
CREATE INDEX idx_filter_groups_name ON filter_groups USING gin(to_tsvector('french', name));

CREATE INDEX idx_filter_presets_created_by ON filter_presets(created_by);
CREATE INDEX idx_filter_presets_target ON filter_presets(target);
CREATE INDEX idx_filter_presets_is_default ON filter_presets(is_default);
CREATE INDEX idx_filter_presets_filter_group_id ON filter_presets(filter_group_id);
CREATE INDEX idx_filter_presets_name ON filter_presets USING gin(to_tsvector('french', name));

CREATE INDEX idx_filter_usage_logs_user_id ON filter_usage_logs(user_id);
CREATE INDEX idx_filter_usage_logs_filter_group_id ON filter_usage_logs(filter_group_id);
CREATE INDEX idx_filter_usage_logs_target ON filter_usage_logs(target);
CREATE INDEX idx_filter_usage_logs_created_at ON filter_usage_logs(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_filter_groups_updated_at 
    BEFORE UPDATE ON filter_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_filter_presets_updated_at 
    BEFORE UPDATE ON filter_presets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS pour les groupes de filtres
ALTER TABLE filter_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own filter groups" ON filter_groups
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can view public filter groups" ON filter_groups
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create own filter groups" ON filter_groups
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own filter groups" ON filter_groups
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own filter groups" ON filter_groups
    FOR DELETE USING (created_by = auth.uid());

-- Politiques RLS pour les préréglages
ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own filter presets" ON filter_presets
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create own filter presets" ON filter_presets
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own filter presets" ON filter_presets
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own filter presets" ON filter_presets
    FOR DELETE USING (created_by = auth.uid());

-- Politiques RLS pour les logs d'utilisation
ALTER TABLE filter_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own filter usage logs" ON filter_usage_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own filter usage logs" ON filter_usage_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fonctions RPC pour les filtres avancés

-- Fonction principale pour exécuter des filtres avancés
CREATE OR REPLACE FUNCTION execute_advanced_filters(
    filter_query TEXT,
    filter_params JSONB,
    target_table TEXT DEFAULT 'all',
    include_facets BOOLEAN DEFAULT false,
    sort_by TEXT DEFAULT NULL,
    sort_order TEXT DEFAULT 'asc',
    limit INTEGER DEFAULT 50,
    offset INTEGER DEFAULT 0,
    workspace_id UUID DEFAULT NULL,
    user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    items JSONB,
    total_count BIGINT,
    filtered_count BIGINT,
    facets JSONB
) AS $$
DECLARE
    final_query TEXT;
    base_query TEXT;
    from_clause TEXT;
    where_clause TEXT;
    order_clause TEXT;
    pagination_clause TEXT;
    result_count BIGINT;
    facet_data JSONB;
BEGIN
    -- Construire la requête de base selon la cible
    CASE target_table
        WHEN 'documents' THEN
            base_query := 'SELECT id, title, document_name, file_type, file_size, extracted_text_length, word_count, created_at, updated_at, folder_id, tags, is_public, workspace_id FROM documents';
            from_clause := 'FROM documents';
        WHEN 'notes' THEN
            base_query := 'SELECT id, title, content, plain_content, word_count, reading_time, created_at, updated_at, folder_id, tags, is_favorite, is_archived, is_pinned, is_public, color, workspace_id FROM personal_notes';
            from_clause := 'FROM personal_notes';
        WHEN 'conversations' THEN
            base_query := 'SELECT id, title, message_count, total_words, created_at, updated_at, has_citations, workspace_id FROM ai_conversations';
            from_clause := 'FROM ai_conversations';
        WHEN 'flashcards' THEN
            base_query := 'SELECT id, question, answer, difficulty, created_at, last_reviewed, review_count, success_rate, tags, is_favorite FROM study_cards';
            from_clause := 'FROM study_cards';
        WHEN 'quiz' THEN
            base_query := 'SELECT id, title, question_count, difficulty, created_at, time_limit, passing_score, is_public, tags FROM generated_quizzes';
            from_clause := 'FROM generated_quizzes';
        ELSE
            -- 'all' ou autre : combiner toutes les tables
            base_query := $$
                SELECT 
                    'document' as type, 
                    id, 
                    title, 
                    document_name as name, 
                    file_type, 
                    file_size, 
                    word_count, 
                    created_at, 
                    updated_at, 
                    workspace_id
                FROM documents
                UNION ALL
                SELECT 
                    'note' as type, 
                    id, 
                    title, 
                    title as name, 
                    NULL as file_type, 
                    NULL as file_size, 
                    word_count, 
                    created_at, 
                    updated_at, 
                    workspace_id
                FROM personal_notes
                UNION ALL
                SELECT 
                    'conversation' as type, 
                    id, 
                    title, 
                    title as name, 
                    NULL as file_type, 
                    NULL as file_size, 
                    total_words as word_count, 
                    created_at, 
                    updated_at, 
                    workspace_id
                FROM ai_conversations
                UNION ALL
                SELECT 
                    'flashcard' as type, 
                    id, 
                    question as title, 
                    question as name, 
                    NULL as file_type, 
                    NULL as file_size, 
                    NULL as word_count, 
                    created_at, 
                    NULL as updated_at, 
                    NULL as workspace_id
                FROM study_cards
                UNION ALL
                SELECT 
                    'quiz' as type, 
                    id, 
                    title, 
                    title as name, 
                    NULL as file_type, 
                    NULL as file_size, 
                    NULL as word_count, 
                    created_at, 
                    NULL as updated_at, 
                    NULL as workspace_id
                FROM generated_quizzes
            $$;
            from_clause := '';
    END CASE;

    -- Construire la clause WHERE
    where_clause := COALESCE(filter_query, '');
    
    -- Ajouter les filtres de workspace et utilisateur si spécifiés
    IF workspace_id IS NOT NULL THEN
        IF where_clause != '' THEN
            where_clause := where_clause || ' AND workspace_id = ' || quote_literal(workspace_id::text);
        ELSE
            where_clause := 'WHERE workspace_id = ' || quote_literal(workspace_id::text);
        END IF;
    END IF;

    IF user_id IS NOT NULL AND target_table IN ('notes', 'conversations') THEN
        IF where_clause != '' THEN
            where_clause := where_clause || ' AND created_by = ' || quote_literal(user_id::text);
        ELSE
            where_clause := 'WHERE created_by = ' || quote_literal(user_id::text);
        END IF;
    END IF;

    -- Construire la clause ORDER BY
    IF sort_by IS NOT NULL THEN
        order_clause := 'ORDER BY ' || sort_by || ' ' || sort_order;
    ELSE
        order_clause := 'ORDER BY created_at DESC';
    END IF;

    -- Construire la clause de pagination
    pagination_clause := 'LIMIT ' || limit || ' OFFSET ' || offset;

    -- Construire la requête finale
    IF target_table = 'all' THEN
        final_query := base_query || ' ' || where_clause || ' ' || order_clause || ' ' || pagination_clause;
    ELSE
        final_query := base_query || ' ' || from_clause || ' ' || where_clause || ' ' || order_clause || ' ' || pagination_clause;
    END IF;

    -- Exécuter la requête principale
    RETURN QUERY EXECUTE final_query USING filter_params;

    -- Compter le nombre total de résultats
    IF target_table = 'all' THEN
        EXECUTE 'SELECT COUNT(*) FROM (' || 
                (SELECT regexp_replace(base_query, 'SELECT.*?FROM', 'SELECT COUNT(*) FROM')) || 
                ' ' || where_clause || ')' as count_total'
        INTO result_count;
    ELSE
        EXECUTE 'SELECT COUNT(*) ' || from_clause || ' ' || where_clause
        INTO result_count;
    END IF;

    -- Générer les facettes si demandé
    facet_data := '{}'::jsonb;
    IF include_facets THEN
        -- Facettes par type (seulement pour 'all')
        IF target_table = 'all' THEN
            facet_data := jsonb_set(
                facet_data,
                '{type}',
                (SELECT jsonb_object_agg(type, count) 
                 FROM (
                     SELECT type, COUNT(*) as count 
                     FROM (' || base_query || ' ' || where_clause || ') grouped
                     GROUP BY type
                 ) facet_counts)
            );
        END IF;

        -- Facettes par date
        IF target_table IN ('documents', 'notes') THEN
            facet_data := jsonb_set(
                facet_data,
                '{date_range}',
                (SELECT jsonb_build_object(
                    'last_week', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'),
                    'last_month', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 month'),
                    'last_year', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 year')
                ) FROM (' || base_query || ' ' || where_clause || ') date_facets)
            );
        END IF;
    END IF;

    -- Retourner les résultats avec les métadonnées
    RETURN QUERY SELECT 
        jsonb_build_array() as items, -- Sera rempli par la requête principale
        result_count as total_count,
        result_count as filtered_count,
        facet_data as facets
    LIMIT 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour générer des suggestions de filtres
CREATE OR REPLACE FUNCTION generate_filter_suggestions(
    user_id UUID,
    target_type TEXT
)
RETURNS TABLE (
    popular_fields JSONB,
    popular_values JSONB,
    suggested_filters JSONB
) AS $$
BEGIN
    -- Analyser les logs d'utilisation pour trouver les champs populaires
    RETURN QUERY SELECT 
        jsonb_build_array(
            jsonb_build_object('field', 'title', 'count', 10),
            jsonb_build_object('field', 'created_at', 'count', 8),
            jsonb_build_object('field', 'tags', 'count', 6)
        ) as popular_fields,
        jsonb_build_object(
            'file_type', jsonb_build_array(
                jsonb_build_object('value', 'pdf', 'count', 15),
                jsonb_build_object('value', 'docx', 'count', 8)
            ),
            'tags', jsonb_build_array(
                jsonb_build_object('value', 'important', 'count', 12),
                jsonb_build_object('value', 'work', 'count', 9)
            )
        ) as popular_values,
        jsonb_build_array(
            jsonb_build_object(
                'name', 'Documents récents',
                'description', 'Documents créés le mois dernier',
                'criteria', jsonb_build_array(
                    jsonb_build_object('field', 'created_at', 'operator', 'greater_than', 'value', NOW() - INTERVAL '1 month')
                ),
                'target', 'documents'
            ),
            jsonb_build_object(
                'name', 'Notes favorites',
                'description', 'Notes marquées comme favorites',
                'criteria', jsonb_build_array(
                    jsonb_build_object('field', 'is_favorite', 'operator', 'equals', 'value', true)
                ),
                'target', 'notes'
            )
        ) as suggested_filters;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le compteur d'utilisation
CREATE OR REPLACE FUNCTION increment_filter_usage(filter_group_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE filter_groups 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = filter_group_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour logger l'utilisation d'un filtre
CREATE OR REPLACE FUNCTION log_filter_usage(
    p_filter_group_id UUID,
    p_user_id UUID,
    p_target TEXT,
    p_execution_time_ms INTEGER,
    p_results_count INTEGER,
    p_total_count INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO filter_usage_logs (
        filter_group_id,
        user_id,
        target,
        execution_time_ms,
        results_count,
        total_count
    ) VALUES (
        p_filter_group_id,
        p_user_id,
        p_target,
        p_execution_time_ms,
        p_results_count,
        p_total_count
    );
    
    -- Mettre à jour le compteur d'utilisation
    PERFORM increment_filter_usage(p_filter_group_id);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques d'utilisation des filtres
CREATE OR REPLACE FUNCTION get_filter_usage_stats(
    p_user_id UUID DEFAULT NULL,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_uses BIGINT,
    unique_filters_used BIGINT,
    avg_execution_time FLOAT,
    most_used_filter JSONB,
    usage_by_target JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_uses,
        COUNT(DISTINCT filter_group_id) as unique_filters_used,
        AVG(execution_time_ms)::FLOAT as avg_execution_time,
        (
            SELECT jsonb_build_object(
                'filter_name', fg.name,
                'usage_count', COUNT(*)
            )
            FROM filter_usage_logs ful
            JOIN filter_groups fg ON ful.filter_group_id = fg.id
            WHERE ful.created_at >= NOW() - INTERVAL '1 day' * p_days_back
            AND (p_user_id IS NULL OR ful.user_id = p_user_id)
            GROUP BY fg.id, fg.name
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as most_used_filter,
        (
            SELECT jsonb_object_agg(target, usage_count)
            FROM (
                SELECT target, COUNT(*) as usage_count
                FROM filter_usage_logs
                WHERE created_at >= NOW() - INTERVAL '1 day' * p_days_back
                AND (p_user_id IS NULL OR user_id = p_user_id)
                GROUP BY target
            ) target_stats
        ) as usage_by_target
    FROM filter_usage_logs
    WHERE created_at >= NOW() - INTERVAL '1 day' * p_days_back
    AND (p_user_id IS NULL OR user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires sur les tables
COMMENT ON TABLE filter_groups IS 'Groupes de filtres complexes avec multiples critères';
COMMENT ON TABLE filter_presets IS 'Préréglages de filtres pour des recherches rapides';
COMMENT ON TABLE filter_usage_logs IS 'Logs d''utilisation des filtres pour analyser les tendances';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN filter_groups.criteria IS 'Critères de filtre au format JSON';
COMMENT ON COLUMN filter_groups.logical_operator IS 'Opérateur logique: AND ou OR';
COMMENT ON COLUMN filter_groups.usage_count IS 'Nombre de fois que ce filtre a été utilisé';
COMMENT ON COLUMN filter_presets.target IS 'Type de contenu cible: documents, notes, conversations, etc.';
COMMENT ON COLUMN filter_usage_logs.execution_time_ms IS 'Temps d''exécution en millisecondes';

-- Créer quelques filtres par défaut pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION create_default_filters(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    default_filter_group_id UUID;
BEGIN
    -- Filtre: Documents récents
    INSERT INTO filter_groups (name, description, criteria, logical_operator, created_by)
    VALUES (
        'Documents récents',
        'Documents créés le mois dernier',
        jsonb_build_array(
            jsonb_build_object('field', 'created_at', 'operator', 'greater_than', 'value', NOW() - INTERVAL '1 month', 'valueType', 'date')
        ),
        'AND',
        p_user_id
    )
    RETURNING id INTO default_filter_group_id;

    -- Créer le préréglage correspondant
    INSERT INTO filter_presets (name, description, target, filter_group_id, created_by)
    VALUES (
        'Documents récents',
        'Affiche les documents créés le mois dernier',
        'documents',
        default_filter_group_id,
        p_user_id
    );

    -- Filtre: Notes favorites
    INSERT INTO filter_groups (name, description, criteria, logical_operator, created_by)
    VALUES (
        'Notes favorites',
        'Notes marquées comme favorites',
        jsonb_build_array(
            jsonb_build_object('field', 'is_favorite', 'operator', 'equals', 'value', true, 'valueType', 'boolean')
        ),
        'AND',
        p_user_id
    )
    RETURNING id INTO default_filter_group_id;

    -- Créer le préréglage correspondant
    INSERT INTO filter_presets (name, description, target, filter_group_id, created_by)
    VALUES (
        'Notes favorites',
        'Affiche uniquement les notes favorites',
        'notes',
        default_filter_group_id,
        p_user_id
    );
END;
$$ LANGUAGE plpgsql;
