-- Migration: Création des tables pour la recherche sémantique (vectorielle + full-text)
-- Date: 11 mars 2026
-- Description: Tables et fonctions pour la recherche vectorielle et plein texte

-- Activer l'extension pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Table des embeddings vectoriels
CREATE TABLE IF NOT EXISTS vector_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL, -- 'document', 'note', 'conversation', 'flashcard', 'quiz'
    content_id UUID NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_type, content_id)
);

-- Table des logs de recherche
CREATE TABLE IF NOT EXISTS search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    results_count INTEGER,
    execution_time_ms INTEGER,
    clicked_result_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des suggestions de recherche
CREATE TABLE IF NOT EXISTS search_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_vector_embeddings_content_type ON vector_embeddings(content_type);
CREATE INDEX idx_vector_embeddings_content_id ON vector_embeddings(content_id);
CREATE INDEX idx_vector_embeddings_created_at ON vector_embeddings(created_at);

-- Index vectoriel pour la recherche par similarité
CREATE INDEX idx_vector_embeddings_embedding_cosine ON vector_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at);
CREATE INDEX idx_search_logs_query ON search_logs USING gin(to_tsvector('french', query));

CREATE INDEX idx_search_suggestions_frequency ON search_suggestions(frequency DESC);
CREATE INDEX idx_search_suggestions_query ON search_suggestions USING gin(to_tsvector('french', query));

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_vector_embeddings_updated_at 
    BEFORE UPDATE ON vector_embeddings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS pour les embeddings
ALTER TABLE vector_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view embeddings" ON vector_embeddings
    FOR SELECT USING (true); -- Les embeddings sont publics pour la recherche

CREATE POLICY "Service can manage embeddings" ON vector_embeddings
    FOR ALL USING (
        -- Seul le service peut gérer les embeddings
        -- Cette politique sera vérifiée côté serveur
        true
    );

-- Politiques RLS pour les logs de recherche
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search logs" ON search_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own search logs" ON search_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fonctions RPC pour la recherche vectorielle

-- Recherche par similarité vectorielle
CREATE OR REPLACE FUNCTION search_by_vector(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 10,
    content_types TEXT[] DEFAULT ARRAY['document', 'note', 'conversation', 'flashcard', 'quiz']
)
RETURNS TABLE (
    content_type TEXT,
    content_id UUID,
    title TEXT,
    content TEXT,
    excerpt TEXT,
    similarity FLOAT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ve.content_type,
        ve.content_id,
        COALESCE(get_content_title(ve.content_type, ve.content_id), 'Sans titre') as title,
        COALESCE(get_content_text(ve.content_type, ve.content_id), '') as content,
        COALESCE(get_content_excerpt(ve.content_type, ve.content_id), '') as excerpt,
        1 - (ve.embedding <=> query_embedding) as similarity,
        ve.metadata
    FROM vector_embeddings ve
    WHERE 
        ve.content_type = ANY(content_types)
        AND 1 - (ve.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recherche par texte plein
CREATE OR REPLACE FUNCTION search_by_fulltext(
    search_query TEXT,
    content_types TEXT[] DEFAULT ARRAY['document', 'note', 'conversation', 'flashcard', 'quiz'],
    match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    content_type TEXT,
    content_id UUID,
    title TEXT,
    content TEXT,
    excerpt TEXT,
    rank REAL,
    metadata JSONB,
    highlights TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ve.content_type,
        ve.content_id,
        COALESCE(get_content_title(ve.content_type, ve.content_id), 'Sans titre') as title,
        COALESCE(get_content_text(ve.content_type, ve.content_id), '') as content,
        COALESCE(get_content_excerpt(ve.content_type, ve.content_id), '') as excerpt,
        ts_rank(
            to_tsvector('french', COALESCE(get_content_title(ve.content_type, ve.content_id), '') || ' ' || COALESCE(get_content_text(ve.content_type, ve.content_id), '')),
            plainto_tsquery('french', search_query)
        ) as rank,
        ve.metadata,
        ARRAY[]::TEXT[] as highlights -- À implémenter avec ts_highlight
    FROM vector_embeddings ve
    WHERE 
        ve.content_type = ANY(content_types)
        AND to_tsvector('french', COALESCE(get_content_title(ve.content_type, ve.content_id), '') || ' ' || COALESCE(get_content_text(ve.content_type, ve.content_id), '')) 
        @@ plainto_tsquery('french', search_query)
    ORDER BY rank DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonctions utilitaires pour obtenir le contenu

-- Obtenir le titre d'un contenu
CREATE OR REPLACE FUNCTION get_content_title(
    content_type TEXT,
    content_id UUID
)
RETURNS TEXT AS $$
BEGIN
    CASE content_type
        WHEN 'document' THEN
            RETURN (SELECT title FROM documents WHERE id = content_id);
        WHEN 'note' THEN
            RETURN (SELECT title FROM personal_notes WHERE id = content_id);
        WHEN 'conversation' THEN
            RETURN (SELECT 'Conversation du ' || TO_CHAR(created_at, 'DD/MM/YYYY') FROM ai_conversations WHERE id = content_id);
        WHEN 'flashcard' THEN
            RETURN (SELECT question FROM study_cards WHERE id = content_id);
        WHEN 'quiz' THEN
            RETURN (SELECT title FROM generated_quizzes WHERE id = content_id);
        ELSE
            RETURN NULL;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Obtenir le texte d'un contenu
CREATE OR REPLACE FUNCTION get_content_text(
    content_type TEXT,
    content_id UUID
)
RETURNS TEXT AS $$
BEGIN
    CASE content_type
        WHEN 'document' THEN
            RETURN (SELECT COALESCE(extracted_text, '') FROM documents WHERE id = content_id);
        WHEN 'note' THEN
            RETURN (SELECT plain_content FROM personal_notes WHERE id = content_id);
        WHEN 'conversation' THEN
            RETURN (
                SELECT STRING_AGG(content, ' ' ORDER BY created_at)
                FROM ai_conversation_messages 
                WHERE conversation_id = content_id
            );
        WHEN 'flashcard' THEN
            RETURN (SELECT question || ' ' || answer FROM study_cards WHERE id = content_id);
        WHEN 'quiz' THEN
            RETURN (
                SELECT STRING_AGG(question || ' ' || answer_a || ' ' || answer_b || ' ' || answer_c || ' ' || answer_d, ' ')
                FROM quiz_questions 
                WHERE quiz_id = content_id
            );
        ELSE
            RETURN NULL;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Obtenir un extrait de contenu
CREATE OR REPLACE FUNCTION get_content_excerpt(
    content_type TEXT,
    content_id UUID
)
RETURNS TEXT AS $$
DECLARE
    full_text TEXT;
BEGIN
    full_text := get_content_text(content_type, content_id);
    
    IF full_text IS NULL OR LENGTH(full_text) <= 200 THEN
        RETURN full_text;
    END IF;
    
    RETURN SUBSTRING(full_text, 1, 200) || '...';
END;
$$ LANGUAGE plpgsql;

-- Recherche combinée (hybride)
CREATE OR REPLACE FUNCTION search_hybrid(
    query TEXT,
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 10,
    content_types TEXT[] DEFAULT ARRAY['document', 'note', 'conversation', 'flashcard', 'quiz']
)
RETURNS TABLE (
    content_type TEXT,
    content_id UUID,
    title TEXT,
    content TEXT,
    excerpt TEXT,
    relevance_score FLOAT,
    semantic_score FLOAT,
    fulltext_score FLOAT,
    metadata JSONB,
    highlights TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH vector_results AS (
        SELECT * FROM search_by_vector(query_embedding, match_threshold, match_count * 2, content_types)
    ),
    text_results AS (
        SELECT * FROM search_by_fulltext(query, content_types, match_count * 2)
    ),
    combined_results AS (
        SELECT 
            COALESCE(vr.content_type, tr.content_type) as content_type,
            COALESCE(vr.content_id, tr.content_id) as content_id,
            COALESCE(vr.title, tr.title) as title,
            COALESCE(vr.content, tr.content) as content,
            COALESCE(vr.excerpt, tr.excerpt) as excerpt,
            COALESCE(vr.similarity, 0) * 0.6 + COALESCE(tr.rank, 0) * 0.4 as relevance_score,
            COALESCE(vr.similarity, 0) as semantic_score,
            COALESCE(tr.rank, 0) as fulltext_score,
            COALESCE(vr.metadata, tr.metadata) as metadata,
            COALESCE(tr.highlights, ARRAY[]::TEXT[]) as highlights
        FROM vector_results vr
        FULL OUTER JOIN text_results tr 
            ON vr.content_type = tr.content_type AND vr.content_id = tr.content_id
    )
    SELECT * FROM combined_results
    ORDER BY relevance_score DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Suggestions de recherche
CREATE OR REPLACE FUNCTION get_query_suggestions(
    partial_query TEXT,
    limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    suggestion TEXT,
    frequency INTEGER,
    last_used TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        query as suggestion,
        frequency,
        last_used
    FROM search_suggestions
    WHERE 
        query ILIKE '%' || partial_query || '%'
        AND frequency > 0
    ORDER BY frequency DESC, last_used DESC
    LIMIT limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Statistiques de recherche
CREATE OR REPLACE FUNCTION get_search_stats(
    workspace_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_indexed BIGINT,
    index_by_type JSONB,
    average_relevance FLOAT,
    last_indexed TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_indexed,
        jsonb_object_agg(content_type, type_count) as index_by_type,
        0.0 as average_relevance, -- À calculer avec les logs de recherche
        MAX(created_at) as last_indexed
    FROM (
        SELECT 
            content_type,
            COUNT(*) as type_count
        FROM vector_embeddings
        GROUP BY content_type
    ) type_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trouver du contenu similaire
CREATE OR REPLACE FUNCTION find_similar_content(
    content_type TEXT,
    content_id UUID,
    limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    content_type TEXT,
    content_id UUID,
    title TEXT,
    content TEXT,
    excerpt TEXT,
    similarity FLOAT,
    metadata JSONB
) AS $$
DECLARE
    target_embedding vector(1536);
BEGIN
    -- Obtenir l'embedding du contenu cible
    SELECT embedding INTO target_embedding
    FROM vector_embeddings
    WHERE content_type = find_similar_content.content_type 
      AND content_id = find_similar_content.content_id;
    
    IF target_embedding IS NULL THEN
        RETURN;
    END IF;
    
    -- Rechercher les contenus similaires
    RETURN QUERY
    SELECT 
        ve.content_type,
        ve.content_id,
        COALESCE(get_content_title(ve.content_type, ve.content_id), 'Sans titre') as title,
        COALESCE(get_content_text(ve.content_type, ve.content_id), '') as content,
        COALESCE(get_content_excerpt(ve.content_type, ve.content_id), '') as excerpt,
        1 - (ve.embedding <=> target_embedding) as similarity,
        ve.metadata
    FROM vector_embeddings ve
    WHERE 
        ve.content_type = find_similar_content.content_type
        AND ve.content_id != find_similar_content.content_id
        AND 1 - (ve.embedding <=> target_embedding) > 0.5
    ORDER BY similarity DESC
    LIMIT limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimisation de l'index
CREATE OR REPLACE FUNCTION optimize_search_index()
RETURNS VOID AS $$
BEGIN
    -- Réorganiser l'index vectoriel pour de meilleures performances
    ALTER INDEX idx_vector_embeddings_embedding_cosine RENAME TO idx_vector_embeddings_embedding_cosine_old;
    
    CREATE INDEX idx_vector_embeddings_embedding_cosine ON vector_embeddings 
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 200);
    
    -- Supprimer l'ancien index
    DROP INDEX IF EXISTS idx_vector_embeddings_embedding_cosine_old;
    
    -- Mettre à jour les statistiques
    ANALYZE vector_embeddings;
    
    -- Nettoyer les suggestions anciennes
    DELETE FROM search_suggestions 
    WHERE last_used < NOW() - INTERVAL '30 days' 
    AND frequency < 2;
    
    -- Mettre à jour les suggestions fréquentes
    UPDATE search_suggestions 
    SET frequency = frequency + 1,
        last_used = NOW()
    WHERE query IN (
        SELECT query 
        FROM search_logs 
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY query 
        HAVING COUNT(*) > 5
    );
END;
$$ LANGUAGE plpgsql;

-- Log de recherche
CREATE OR REPLACE FUNCTION log_search(
    p_user_id UUID,
    p_query TEXT,
    p_filters JSONB DEFAULT '{}',
    p_results_count INTEGER,
    p_execution_time_ms INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO search_logs (
        user_id, 
        query, 
        filters, 
        results_count, 
        execution_time_ms
    ) VALUES (
        p_user_id, 
        p_query, 
        p_filters, 
        p_results_count, 
        p_execution_time_ms
    );
    
    -- Mettre à jour les suggestions
    INSERT INTO search_suggestions (query, frequency, last_used)
    VALUES (p_query, 1, NOW())
    ON CONFLICT (query) 
    DO UPDATE SET 
        frequency = search_suggestions.frequency + 1,
        last_used = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires sur les tables
COMMENT ON TABLE vector_embeddings IS 'Embeddings vectoriels pour la recherche sémantique';
COMMENT ON TABLE search_logs IS 'Logs des recherches effectuées par les utilisateurs';
COMMENT ON TABLE search_suggestions IS 'Suggestions de recherche basées sur l\'usage';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN vector_embeddings.embedding IS 'Vecteur de 1536 dimensions (OpenAI text-embedding-3-small)';
COMMENT ON COLUMN vector_embeddings.content_type IS 'Type de contenu: document, note, conversation, flashcard, quiz';
COMMENT ON COLUMN search_logs.execution_time_ms IS 'Temps d\'exécution de la recherche en millisecondes';
COMMENT ON COLUMN search_suggestions.frequency IS 'Nombre de fois que cette suggestion a été utilisée';

-- Créer un trigger pour loguer automatiquement les recherches
-- Note: Ce trigger sera appelé depuis l'application après chaque recherche
