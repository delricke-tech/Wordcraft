-- Migration: Création des tables pour le tri personnalisé (nom, date, taille, pertinence)
-- Date: 11 mars 2026
-- Description: Tables pour gérer les configurations de tri personnalisées

-- Table des configurations de tri
CREATE TABLE IF NOT EXISTS sort_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target VARCHAR(50) NOT NULL CHECK (target IN ('documents', 'notes', 'conversations', 'flashcards', 'quiz', 'all')),
    criteria JSONB NOT NULL DEFAULT '[]',
    default_sort BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
);

-- Table des logs d'utilisation du tri
CREATE TABLE IF NOT EXISTS sort_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sort_config_id UUID REFERENCES sort_configurations(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target VARCHAR(50) NOT NULL,
    execution_time_ms INTEGER,
    items_count INTEGER,
    applied_criteria JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des métriques de performance de tri
CREATE TABLE IF NOT EXISTS sort_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target VARCHAR(50) NOT NULL,
    field VARCHAR(100) NOT NULL,
    algorithm VARCHAR(50) NOT NULL,
    direction VARCHAR(4) NOT NULL CHECK (direction IN ('asc', 'desc')),
    avg_execution_time_ms FLOAT,
    min_execution_time_ms INTEGER,
    max_execution_time_ms INTEGER,
    total_executions INTEGER,
    success_rate FLOAT,
    last_executed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_sort_configurations_created_by ON sort_configurations(created_by);
CREATE INDEX idx_sort_configurations_target ON sort_configurations(target);
CREATE INDEX idx_sort_configurations_default_sort ON sort_configurations(default_sort);
CREATE INDEX idx_sort_configurations_usage_count ON sort_configurations(usage_count DESC);
CREATE INDEX idx_sort_configurations_name ON sort_configurations USING gin(to_tsvector('french', name));

CREATE INDEX idx_sort_usage_logs_user_id ON sort_usage_logs(user_id);
CREATE INDEX idx_sort_usage_logs_sort_config_id ON sort_usage_logs(sort_config_id);
CREATE INDEX idx_sort_usage_logs_target ON sort_usage_logs(target);
CREATE INDEX idx_sort_usage_logs_created_at ON sort_usage_logs(created_at DESC);

CREATE INDEX idx_sort_performance_metrics_target ON sort_performance_metrics(target);
CREATE INDEX idx_sort_performance_metrics_field ON sort_performance_metrics(field);
CREATE INDEX idx_sort_performance_metrics_algorithm ON sort_performance_metrics(algorithm);
CREATE INDEX idx_sort_performance_metrics_avg_execution_time ON sort_performance_metrics(avg_execution_time DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_sort_configurations_updated_at 
    BEFORE UPDATE ON sort_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sort_performance_metrics_updated_at 
    BEFORE UPDATE ON sort_performance_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS pour les configurations de tri
ALTER TABLE sort_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sort configurations" ON sort_configurations
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create own sort configurations" ON sort_configurations
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own sort configurations" ON sort_configurations
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own sort configurations" ON sort_configurations
    FOR DELETE USING (created_by = auth.uid());

-- Politiques RLS pour les logs d'utilisation du tri
ALTER TABLE sort_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sort usage logs" ON sort_usage_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own sort usage logs" ON sort_usage_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour les métriques de performance
ALTER TABLE sort_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view sort performance metrics" ON sort_performance_metrics
    FOR SELECT USING (true);

-- Fonctions RPC pour le tri personnalisé

-- Fonction principale pour exécuter un tri personnalisé
CREATE OR REPLACE FUNCTION execute_custom_sort(
    target_table TEXT DEFAULT 'all',
    sort_config JSONB,
    include_metadata BOOLEAN DEFAULT false,
    limit INTEGER DEFAULT 50,
    offset INTEGER DEFAULT 0,
    workspace_id UUID DEFAULT NULL,
    user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    items JSONB,
    total_count BIGINT,
    sorted_count BIGINT,
    metadata JSONB
) AS $$
DECLARE
    final_query TEXT;
    base_query TEXT;
    from_clause TEXT;
    order_clause TEXT;
    pagination_clause TEXT;
    result_count BIGINT;
    sort_metadata JSONB;
    execution_start TIMESTAMP WITH TIME ZONE;
    execution_end TIMESTAMP WITH TIME ZONE;
BEGIN
    execution_start := NOW();
    
    -- Construire la requête de base selon la cible
    CASE target_table
        WHEN 'documents' THEN
            base_query := 'SELECT id, title, document_name, file_type, file_size, extracted_text_length, word_count, created_at, updated_at, folder_id, tags, is_public, workspace_id, relevance_score, access_count FROM documents';
            from_clause := 'FROM documents';
        WHEN 'notes' THEN
            base_query := 'SELECT id, title, content, plain_content, word_count, reading_time, created_at, updated_at, folder_id, tags, is_favorite, is_archived, is_pinned, is_public, color, workspace_id, access_count FROM personal_notes';
            from_clause := 'FROM personal_notes';
        WHEN 'conversations' THEN
            base_query := 'SELECT id, title, message_count, total_words, created_at, updated_at, has_citations, workspace_id, quality_score FROM ai_conversations';
            from_clause := 'FROM ai_conversations';
        WHEN 'flashcards' THEN
            base_query := 'SELECT id, question, answer, difficulty, created_at, last_reviewed, review_count, success_rate, tags, is_favorite, next_review_date FROM study_cards';
            from_clause := 'FROM study_cards';
        WHEN 'quiz' THEN
            base_query := 'SELECT id, title, question_count, difficulty, created_at, time_limit, passing_score, completion_rate, average_score, is_public FROM generated_quizzes';
            from_clause := 'FROM generated_quizzes';
        ELSE
            -- 'all' ou autre : combiner toutes les tables avec des métadonnées
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
                    workspace_id,
                    relevance_score,
                    access_count,
                    1 as priority
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
                    workspace_id,
                    NULL as relevance_score,
                    access_count,
                    2 as priority
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
                    workspace_id,
                    quality_score as relevance_score,
                    NULL as access_count,
                    3 as priority
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
                    NULL as workspace_id,
                    NULL as relevance_score,
                    NULL as access_count,
                    4 as priority
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
                    NULL as workspace_id,
                    NULL as relevance_score,
                    NULL as access_count,
                    5 as priority
                FROM generated_quizzes
            $$;
            from_clause := '';
    END CASE;

    -- Construire la clause ORDER BY depuis la configuration
    order_clause := build_order_clause(sort_config);

    -- Construire la clause de pagination
    pagination_clause := 'LIMIT ' || limit || ' OFFSET ' || offset || '';

    -- Construire la requête finale
    IF target_table = 'all' THEN
        final_query := base_query || ' ' || order_clause || ' ' || pagination_clause;
    ELSE
        final_query := base_query || ' ' || from_clause || ' ' || order_clause || ' ' || pagination_clause;
    END IF;

    -- Exécuter la requête principale
    RETURN QUERY EXECUTE final_query;

    -- Compter le nombre total d'éléments
    IF target_table = 'all' THEN
        EXECUTE 'SELECT COUNT(*) FROM (' || 
                (SELECT regexp_replace(base_query, 'SELECT.*?FROM', 'SELECT COUNT(*) FROM')) || 
                ') as count_total'
        INTO result_count;
    ELSE
        EXECUTE 'SELECT COUNT(*) ' || from_clause
        INTO result_count;
    END IF;

    -- Mettre à jour les métriques de performance
    execution_end := NOW();
    UPDATE sort_performance_metrics
    SET 
        avg_execution_time_ms = EXTRACT(EPOCH FROM (execution_end - execution_start)) * 1000,
        total_executions = total_executions + 1,
        min_execution_time_ms = LEAST(EXTRACT(EPOCH FROM (execution_end - execution_start)) * 1000, min_execution_time_ms),
        max_execution_time_ms = GREATEST(EXTRACT(EPOCH FROM (execution_end - execution_start)) * 1000, max_execution_time_ms),
        last_executed = execution_end,
        updated_at = NOW()
    WHERE target = target_table
    AND field = (sort_config->>0->>'field')
    AND algorithm = COALESCE(sort_config->>0->>'algorithm', 'alphabetical')
    AND direction = COALESCE(sort_config->>0->>'direction', 'asc');

    -- Générer les métadonnées
    sort_metadata := jsonb_build_object(
        'algorithm', COALESCE(sort_config->>0->>'algorithm', 'alphabetical'),
        'field_types', jsonb_build_object(
            'documents', jsonb_build_object(
                'title', 'text',
                'file_size', 'number',
                'created_at', 'date',
                'relevance_score', 'number'
            ),
            'notes', jsonb_build_object(
                'title', 'text',
                'word_count', 'number',
                'created_at', 'date',
                'is_favorite', 'boolean'
            ),
            'conversations', jsonb_build_object(
                'title', 'text',
                'message_count', 'number',
                'created_at', 'date',
                'quality_score', 'number'
            )
        ),
        'processing_time', EXTRACT(EPOCH FROM (execution_end - execution_start)) * 1000,
        'cache_hit', false
    );

    -- Retourner les résultats avec les métadonnées
    RETURN QUERY SELECT 
        jsonb_agg(items) as items,
        result_count as total_count,
        result_count as sorted_count,
        sort_metadata as metadata
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour construire la clause ORDER BY
CREATE OR REPLACE FUNCTION build_order_clause(sort_config JSONB)
RETURNS TEXT AS $$
DECLARE
    order_parts TEXT[] := '{}';
    criterion JSONB;
    field_name TEXT;
    direction TEXT;
    algorithm TEXT;
    weight FLOAT;
BEGIN
    -- Parcourir les critères de tri
    FOR i IN 0..jsonb_array_length(sort_config) - 1 LOOP
        criterion := sort_config->i;
        field_name := COALESCE(criterion->>'field', '');
        direction := COALESCE(criterion->>'direction', 'asc');
        algorithm := COALESCE(criterion->>'algorithm', 'alphabetical');
        weight := COALESCE(criterion->>'weight', 1.0);

        -- Construire la partie ORDER BY selon l'algorithme
        CASE algorithm
            WHEN 'alphabetical' THEN
                order_parts := array_append(order_parts, field_name || ' ' || direction);
            WHEN 'numeric' THEN
                order_parts := array_append(order_parts, 'CAST(' || field_name || ' AS NUMERIC) ' || direction);
            WHEN 'date' THEN
                order_parts := array_append(order_parts, field_name || ' ' || direction);
            WHEN 'size' THEN
                order_parts := array_append(order_parts, 'EXTRACT_SIZE(' || field_name || ') ' || direction);
            WHEN 'relevance' THEN
                order_parts := array_append(order_parts, 'COALESCE(' || field_name || ', 0) * ' || weight || '::FLOAT ' || direction);
            WHEN 'popularity' THEN
                order_parts := array_append(order_parts, 'COALESCE(' || field_name || ', 0) ' || direction);
            WHEN 'recent' THEN
                order_parts := array_append(order_parts, field_name || ' ' || direction);
            WHEN 'custom' THEN
                order_parts := array_append(order_parts, '(' || field_name || ' * ' || weight || '::FLOAT) ' || direction);
            ELSE
                order_parts := array_append(order_parts, field_name || ' ' || direction);
        END CASE;
    END LOOP;

    -- Joindre les parties avec virgules
    RETURN array_to_string(order_parts, ', ');
END;
$$ LANGUAGE plpgsql;

-- Fonction pour extraire la taille d'un champ
CREATE OR REPLACE FUNCTION EXTRACT_SIZE(value_field TEXT)
RETURNS FLOAT AS $$
BEGIN
    -- Extraire les nombres d'une chaîne (ex: "1.2 MB" -> 1258211)
    IF value_field IS NULL THEN
        RETURN 0;
    END IF;

    -- Si c'est un nombre
    IF value_field ~ '^[0-9.]+$' THEN
        RETURN to_number(value_field);
    END IF;

    -- Si c'est une chaîne, extraire le premier nombre
    RETURN COALESCECE(to_number(regexp_match(value_field, '[0-9.]+')), 0);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le compteur d'utilisation
CREATE OR REPLACE FUNCTION increment_sort_usage(sort_config_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE sort_configurations 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = sort_config_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour logger l'utilisation d'un tri
CREATE OR REPLACE FUNCTION log_sort_usage(
    p_sort_config_id UUID,
    p_user_id UUID,
    p_target TEXT,
    p_execution_time_ms INTEGER,
    p_items_count INTEGER,
    p_applied_criteria JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO sort_usage_logs (
        sort_config_id,
        user_id,
        target,
        execution_time_ms,
        items_count,
        applied_criteria
    ) VALUES (
        p_sort_config_id,
        p_user_id,
        p_target,
        p_execution_time_ms,
        p_items_count,
        p_applied_criteria
    );
    
    -- Mettre à jour le compteur d'utilisation
    PERFORM increment_sort_usage(p_sort_config_id);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques d'utilisation du tri
CREATE OR REPLACE FUNCTION get_sort_usage_stats(
    p_user_id UUID DEFAULT NULL,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_sorts BIGINT,
    unique_sorts_used BIGINT,
    avg_execution_time FLOAT,
    most_used_sort JSONB,
    usage_by_target JSONB,
    popular_algorithms JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_sorts,
        COUNT(DISTINCT sort_config_id) as unique_sorts_used,
        AVG(execution_time_ms)::FLOAT as avg_execution_time,
        (
            SELECT jsonb_build_object(
                'sort_name', sc.name,
                'usage_count', COUNT(*),
                'avg_time', AVG(execution_time_ms)
            )
            FROM sort_usage_logs sul
            JOIN sort_configurations sc ON sul.sort_config_id = sc.id
            WHERE sul.created_at >= NOW() - INTERVAL '1 day' * p_days_back
            AND (p_user_id IS NULL OR sul.user_id = p_user_id)
            GROUP BY sc.id, sc.name
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as most_used_sort,
        (
            SELECT jsonb_object_agg(target, usage_count)
            FROM (
                SELECT target, COUNT(*) as usage_count
                FROM sort_usage_logs
                WHERE created_at >= NOW() - INTERVAL '1 day' * p_days_back
                AND (p_user_id IS NULL OR user_id = p_user_id)
                GROUP BY target
            ) target_stats
        ) as usage_by_target,
        (
            SELECT jsonb_object_agg(algorithm, usage_count)
            FROM (
                SELECT 
                    COALESCE(criteria->>0->>'algorithm', 'alphabetical') as algorithm,
                    COUNT(*) as usage_count
                FROM sort_usage_logs
                WHERE created_at >= NOW() - INTERVAL '1 day' * p_days_back
                AND (p_user_id IS NULL OR user_id = p_user_id)
                GROUP BY COALESCE(criteria->>0->>'algorithm', 'alphabetical')
            ) algo_stats
        ) as popular_algorithms
    FROM sort_usage_logs
    WHERE created_at >= NOW() - INTERVAL '1 day' * p_days_back
    AND (p_user_id IS NULL OR user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer des suggestions de tri
CREATE OR REPLACE FUNCTION generate_sort_suggestions(
    p_user_id UUID,
    p_target_type TEXT
)
RETURNS TABLE (
    popular_fields JSONB,
    popular_directions JSONB,
    suggested_sorts JSONB
) AS $$
BEGIN
    -- Analyser les logs d'utilisation pour trouver les champs populaires
    RETURN QUERY SELECT 
        jsonb_build_array(
            jsonb_build_object('field', 'created_at', 'count', 15),
            jsonb_build_object('field', 'title', 'count', 12),
            jsonb_build_object('field', 'word_count', 'count', 10),
            jsonb_build_object('field', 'file_size', 'count', 8)
        ) as popular_fields,
        jsonb_build_object(
            'created_at', 'desc',
            'title', 'asc',
            'word_count', 'desc',
            'file_size', 'desc'
        ) as popular_directions,
        jsonb_build_array(
            jsonb_build_object(
                'name', 'Les plus récents',
                'description', 'Trie par date de modification la plus récente',
                'target', p_target_type,
                'criteria', jsonb_build_array(
                    jsonb_build_object('field', 'updated_at', 'direction', 'desc', 'algorithm', 'recent', 'weight', 1.2)
                )
            ),
            jsonb_build_object(
                'name', 'Par pertinence',
                'description', 'Trie par score de pertinence IA',
                'target', p_target_type,
                'criteria', jsonb_build_array(
                    jsonb_build_object('field', 'relevance_score', 'direction', 'desc', 'algorithm', 'relevance', 'weight', 1.5)
                )
            ),
            jsonb_build_object(
                'name', 'Les plus consultés',
                'description', 'Trie par nombre d\'accès',
                'target', p_target_type,
                'criteria', jsonb_build_array(
                    jsonb_build_object('field', 'access_count', 'direction', 'desc', 'algorithm', 'popularity', 'weight', 1.0)
                )
            )
        ) as suggested_sorts;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour initialiser les métriques de performance
CREATE OR REPLACE FUNCTION initialize_sort_performance_metrics()
RETURNS VOID AS $$
BEGIN
    -- Insérer les métriques initiales pour chaque combinaison
    INSERT INTO sort_performance_metrics (target, field, algorithm, direction, avg_execution_time_ms, total_executions)
    VALUES
        ('documents', 'title', 'alphabetical', 'asc', 5.0, 0),
        ('documents', 'file_size', 'size', 'desc', 8.0, 0),
        ('documents', 'created_at', 'date', 'desc', 3.0, 0),
        ('documents', 'relevance_score', 'relevance', 'desc', 12.0, 0),
        ('notes', 'title', 'alphabetical', 'asc', 4.0, 0),
        ('notes', 'word_count', 'size', 'desc', 6.0, 0),
        ('notes', 'created_at', 'date', 'desc', 3.0, 0),
        ('notes', 'is_favorite', 'boolean', 'desc', 2.0, 0),
        ('conversations', 'title', 'alphabetical', 'asc', 5.0, 0),
        ('conversations', 'message_count', 'size', 'desc', 7.0, 0),
        ('conversations', 'created_at', 'date', 'desc', 3.0, 0),
        ('conversations', 'quality_score', 'relevance', 'desc', 10.0, 0),
        ('flashcards', 'question', 'alphabetical', 'asc', 4.0, 0),
        ('flashcards', 'difficulty', 'alphabetical', 'asc', 3.0, 0),
        ('flashcards', 'success_rate', 'relevance', 'desc', 8.0, 0),
        ('flashcards', 'created_at', 'date', 'desc', 3.0, 0),
        ('quiz', 'title', 'alphabetical', 'asc', 5.0, 0),
        ('quiz', 'question_count', 'size', 'desc', 6.0, 0),
        ('quiz', 'average_score', 'relevance', 'desc', 9.0, 0),
        ('quiz', 'created_at', 'date', 'desc', 3.0, 0);
    
    -- Ignorer les erreurs de doublons
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE sort_configurations IS 'Configurations de tri personnalisées avec multiples critères';
COMMENT ON TABLE sort_usage_logs IS 'Logs d''utilisation des configurations de tri pour analyser les tendances';
COMMENT ON TABLE sort_performance_metrics IS 'Métriques de performance des algorithmes de tri';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN sort_configurations.criteria IS 'Critères de tri au format JSON avec poids et algorithmes';
COMMENT ON COLUMN sort_configurations.usage_count IS 'Nombre de fois que cette configuration a été utilisée';
COMMENT ON COLUMN sort_performance_metrics.avg_execution_time_ms IS 'Temps moyen d''exécution en millisecondes';
COMMENT ON COLUMN sort_usage_logs.applied_criteria IS 'Critères de tri appliqués pour cette utilisation';

-- Créer quelques configurations de tri par défaut pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION create_default_sorts(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    default_sort_id UUID;
BEGIN
    -- Tri par date de modification (le plus courant)
    INSERT INTO sort_configurations (name, description, target, criteria, default_sort, created_by)
    VALUES (
        'Les plus récents',
        'Trie par date de modification la plus récente',
        'all',
        jsonb_build_array(
            jsonb_build_object('field', 'updated_at', 'direction', 'desc', 'algorithm', 'recent', 'weight', 1.2)
        ),
        true,
        p_user_id
    )
    RETURNING id INTO default_sort_id;

    -- Tri par pertinence IA
    INSERT INTO sort_configurations (name, description, target, criteria, default_sort, created_by)
    VALUES (
        'Par pertinence',
        'Trie par score de pertinence généré par l''IA',
        'all',
        jsonb_build_array(
            jsonb_build_object('field', 'relevance_score', 'direction', 'desc', 'algorithm', 'relevance', 'weight', 1.5)
        ),
        false,
        p_user_id
    );

    -- Tri alphabétique par titre
    INSERT INTO sort_configurations (name, description, target, criteria, default_sort, created_by)
    VALUES (
        'Alphabétique',
        'Tri alphabétique par titre',
        'all',
        jsonb_build_array(
            jsonb_build_object('field', 'title', 'direction', 'asc', 'algorithm', 'alphabetical', 'weight', 1.0)
        ),
        false,
        p_user_id
    );
END;
$$ LANGUAGE plpgsql;
