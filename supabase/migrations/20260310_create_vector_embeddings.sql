-- Migration pour créer les tables d'embeddings vectoriels et RAG avancé
-- Date: 10 mars 2026
-- Objectif: Support pour citations RAG avec embeddings et scores de pertinence

-- Extension pgvector pour les embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Table des embeddings de documents
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL, -- Dimension pour OpenAI embeddings
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT document_embeddings_unique_chunk UNIQUE (document_id, chunk_index)
);

-- Table des embeddings de requêtes utilisateur (pour cache)
CREATE TABLE IF NOT EXISTS query_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    response_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index pour recherche rapide
    CONSTRAINT query_embeddings_unique_query UNIQUE (user_id, query_text)
);

-- Table des citations améliorées avec scores
CREATE TABLE IF NOT EXISTS enhanced_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES document_embeddings(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    context TEXT,
    relevance_score DECIMAL(5,4) NOT NULL, -- Score entre 0.0000 et 1.0000
    similarity_score DECIMAL(5,4) NOT NULL, -- Score de similarité cosinus
    position_start INTEGER,
    position_end INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche vectorielle rapide
CREATE INDEX IF NOT EXISTS idx_document_embeddings_embedding ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_query_embeddings_embedding ON query_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id ON document_embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_citations_document_id ON enhanced_citations(document_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_citations_chunk_id ON enhanced_citations(chunk_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_citations_relevance_score ON enhanced_citations(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_citations_similarity_score ON enhanced_citations(similarity_score DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_embeddings_updated_at 
    BEFORE UPDATE ON document_embeddings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour rechercher les chunks les plus pertinents
CREATE OR REPLACE FUNCTION search_relevant_chunks(
    query_embedding vector(1536),
    document_id_param UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 5,
    similarity_threshold DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    chunk_index INTEGER,
    chunk_text TEXT,
    similarity DECIMAL,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        de.id,
        de.document_id,
        de.chunk_index,
        de.chunk_text,
        1 - (de.embedding <=> query_embedding) as similarity,
        de.metadata
    FROM document_embeddings de
    WHERE 
        (document_id_param IS NULL OR de.document_id = document_id_param)
        AND (1 - (de.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer et stocker les embeddings d'un document
CREATE OR REPLACE FUNCTION compute_document_embeddings(
    document_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    chunk_count INTEGER;
BEGIN
    -- Cette fonction sera appelée depuis l'application
    -- Les embeddings seront calculés côté client avec OpenAI API
    -- puis insérés via RPC
    
    -- Nettoyer les anciens embeddings
    DELETE FROM document_embeddings WHERE document_id = document_uuid;
    
    -- Le comptage sera fait côté application
    SELECT COUNT(*) INTO chunk_count 
    FROM document_embeddings 
    WHERE document_id = document_uuid;
    
    RETURN chunk_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Politiques RLS (Row Level Security)
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_citations ENABLE ROW LEVEL SECURITY;

-- Politiques pour document_embeddings
CREATE POLICY "Users can view own document embeddings" ON document_embeddings
    FOR SELECT USING (
        document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own document embeddings" ON document_embeddings
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own document embeddings" ON document_embeddings
    FOR UPDATE USING (
        document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own document embeddings" ON document_embeddings
    FOR DELETE USING (
        document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    );

-- Politiques pour query_embeddings
CREATE POLICY "Users can manage own query embeddings" ON query_embeddings
    FOR ALL USING (user_id = auth.uid());

-- Politiques pour enhanced_citations
CREATE POLICY "Users can view own enhanced citations" ON enhanced_citations
    FOR SELECT USING (
        document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own enhanced citations" ON enhanced_citations
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    );

-- Fonctions RPC pour l'application
CREATE OR REPLACE FUNCTION insert_document_chunks(
    p_document_id UUID,
    p_chunks JSONB -- Array de {chunk_index, chunk_text, embedding, metadata}
)
RETURNS INTEGER AS $$
DECLARE
    chunk_count INTEGER := 0;
    chunk_item JSONB;
BEGIN
    -- Insérer les chunks en batch
    FOR chunk_item IN SELECT * FROM jsonb_array_elements(p_chunks)
    LOOP
        INSERT INTO document_embeddings (
            document_id,
            chunk_index,
            chunk_text,
            embedding,
            metadata
        ) VALUES (
            p_document_id,
            (chunk_item->>'chunk_index')::INTEGER,
            chunk_item->>'chunk_text',
            chunk_item->>'embedding'::vector,
            chunk_item->'metadata'
        );
        chunk_count := chunk_count + 1;
    END LOOP;
    
    RETURN chunk_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION search_similar_chunks_rpc(
    query_embedding vector(1536),
    document_id_param UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 5,
    similarity_threshold DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    chunk_index INTEGER,
    chunk_text TEXT,
    similarity DECIMAL,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        de.id,
        de.document_id,
        de.chunk_index,
        de.chunk_text,
        1 - (de.embedding <=> query_embedding) as similarity,
        de.metadata
    FROM document_embeddings de
    WHERE 
        (document_id_param IS NULL OR de.document_id = document_id_param)
        AND (1 - (de.embedding <=> query_embedding)) >= similarity_threshold
        AND de.document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    ORDER BY de.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION save_enhanced_citation(
    p_document_id UUID,
    p_chunk_id UUID,
    p_query_text TEXT,
    p_excerpt TEXT,
    p_context TEXT,
    p_relevance_score DECIMAL,
    p_similarity_score DECIMAL,
    p_position_start INTEGER DEFAULT NULL,
    p_position_end INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    citation_id UUID;
BEGIN
    INSERT INTO enhanced_citations (
        document_id,
        chunk_id,
        query_text,
        excerpt,
        context,
        relevance_score,
        similarity_score,
        position_start,
        position_end,
        metadata
    ) VALUES (
        p_document_id,
        p_chunk_id,
        p_query_text,
        p_excerpt,
        p_context,
        p_relevance_score,
        p_similarity_score,
        p_position_start,
        p_position_end,
        p_metadata
    ) RETURNING id INTO citation_id;
    
    RETURN citation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE document_embeddings IS 'Stocke les embeddings vectoriels des chunks de documents pour recherche sémantique';
COMMENT ON TABLE query_embeddings IS 'Cache des embeddings de requêtes utilisateur pour optimisation';
COMMENT ON TABLE enhanced_citations IS 'Citations avancées avec scores de pertinence et similarité';
COMMENT ON EXTENSION vector IS 'Extension PostgreSQL pour les embeddings vectoriels';
