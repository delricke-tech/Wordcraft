-- Fonction RPC pour la recherche sémantique avec pgvector
-- Date: 10 mars 2026
-- Objectif: Recherche vectorielle optimisée pour les embeddings

CREATE OR REPLACE FUNCTION search_document_chunks(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    chunk_index INT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.document_id,
        dc.chunk_index,
        dc.content,
        dc.metadata,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction RPC pour la recherche hybride (sémantique + full-text)
CREATE OR REPLACE FUNCTION hybrid_search_chunks(
    query_embedding vector(1536),
    query_text TEXT,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    chunk_index INT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT,
    text_rank REAL
) AS $$
BEGIN
    RETURN QUERY
    WITH semantic_results AS (
        SELECT 
            dc.id,
            dc.document_id,
            dc.chunk_index,
            dc.content,
            dc.metadata,
            1 - (dc.embedding <=> query_embedding) AS similarity,
            0.0 AS text_rank
        FROM document_chunks dc
        WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
        ORDER BY similarity DESC
        LIMIT match_count
    ),
    text_results AS (
        SELECT 
            dc.id,
            dc.document_id,
            dc.chunk_index,
            dc.content,
            dc.metadata,
            0.0 AS similarity,
            ts_rank(to_tsvector('french', dc.content), plainto_tsquery('french', query_text)) AS text_rank
        FROM document_chunks dc
        WHERE to_tsvector('french', dc.content) @@ plainto_tsquery('french', query_text)
        ORDER BY text_rank DESC
        LIMIT match_count
    )
    SELECT 
        COALESCE(sr.id, tr.id) AS id,
        COALESCE(sr.document_id, tr.document_id) AS document_id,
        COALESCE(sr.chunk_index, tr.chunk_index) AS chunk_index,
        COALESCE(sr.content, tr.content) AS content,
        COALESCE(sr.metadata, tr.metadata) AS metadata,
        COALESCE(sr.similarity, 0.0) AS similarity,
        COALESCE(sr.text_rank, 0.0) AS text_rank
    FROM semantic_results sr
    FULL OUTER JOIN text_results tr ON sr.id = tr.id
    ORDER BY 
        GREATEST(COALESCE(sr.similarity, 0.0), COALESCE(tr.text_rank, 0.0)) DESC,
        COALESCE(sr.similarity, 0.0) DESC,
        COALESCE(tr.text_rank, 0.0) DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Index pour la recherche full-text en français
CREATE INDEX IF NOT EXISTS idx_document_chunks_fts_french 
ON document_chunks 
USING gin(to_tsvector('french', content));

-- Commentaires sur les fonctions
COMMENT ON FUNCTION search_document_chunks IS 'Recherche sémantique vectorielle avec pgvector';
COMMENT ON FUNCTION hybrid_search_chunks IS 'Recherche hybride combinant sémantique et full-text';

-- Octroyer les permissions d'exécution
GRANT EXECUTE ON FUNCTION search_document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION hybrid_search_chunks TO authenticated;
