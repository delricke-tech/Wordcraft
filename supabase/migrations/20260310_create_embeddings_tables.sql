-- Migration: Création des tables pour embeddings vectoriels et citations RAG
-- Date: 10 mars 2026
-- Objectif: Support pour Citations RAG avancées avec OpenAI Embeddings

-- Activer l'extension pgvector pour les embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Table pour les chunks de documents avec embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536), -- Dimension OpenAI text-embedding-3-small
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index vectoriel pour recherche sémantique rapide
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
ON document_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index sur document_id pour les jointures
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id 
ON document_chunks(document_id);

-- Index sur chunk_index pour l'ordre
CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_index 
ON document_chunks(chunk_index);

-- Table pour les citations avec scores de pertinence
CREATE TABLE IF NOT EXISTS document_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
    text_snippet TEXT NOT NULL,
    relevance_score FLOAT DEFAULT 0.0,
    page_number INTEGER,
    chunk_position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les citations par document
CREATE INDEX IF NOT EXISTS idx_document_citations_document_id 
ON document_citations(document_id);

-- Index pour les citations par pertinence
CREATE INDEX IF NOT EXISTS idx_document_citations_relevance_score 
ON document_citations(relevance_score DESC);

-- Index pour les citations par chunk
CREATE INDEX IF NOT EXISTS idx_document_citations_chunk_id 
ON document_citations(chunk_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour document_chunks
CREATE TRIGGER update_document_chunks_updated_at 
    BEFORE UPDATE ON document_chunks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour document_citations
CREATE TRIGGER update_document_citations_updated_at 
    BEFORE UPDATE ON document_citations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS pour document_chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les chunks de leurs documents
CREATE POLICY "Users can view own document chunks" ON document_chunks
    FOR SELECT USING (
        document_id IN (
            SELECT id FROM documents 
            WHERE user_id = auth.uid()
        )
    );

-- Les utilisateurs peuvent insérer des chunks pour leurs documents
CREATE POLICY "Users can insert own document chunks" ON document_chunks
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT id FROM documents 
            WHERE user_id = auth.uid()
        )
    );

-- Les utilisateurs peuvent modifier leurs chunks
CREATE POLICY "Users can update own document chunks" ON document_chunks
    FOR UPDATE USING (
        document_id IN (
            SELECT id FROM documents 
            WHERE user_id = auth.uid()
        )
    );

-- Les utilisateurs peuvent supprimer leurs chunks
CREATE POLICY "Users can delete own document chunks" ON document_chunks
    FOR DELETE USING (
        document_id IN (
            SELECT id FROM documents 
            WHERE user_id = auth.uid()
        )
    );

-- Politiques RLS pour document_citations
ALTER TABLE document_citations ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les citations de leurs documents
CREATE POLICY "Users can view own document citations" ON document_citations
    FOR SELECT USING (
        document_id IN (
            SELECT id FROM documents 
            WHERE user_id = auth.uid()
        )
    );

-- Les utilisateurs peuvent insérer des citations pour leurs documents
CREATE POLICY "Users can insert own document citations" ON document_citations
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT id FROM documents 
            WHERE user_id = auth.uid()
        )
    );

-- Les utilisateurs peuvent modifier leurs citations
CREATE POLICY "Users can update own document citations" ON document_citations
    FOR UPDATE USING (
        document_id IN (
            SELECT id FROM documents 
            WHERE user_id = auth.uid()
        )
    );

-- Les utilisateurs peuvent supprimer leurs citations
CREATE POLICY "Users can delete own document citations" ON document_citations
    FOR DELETE USING (
        document_id IN (
            SELECT id FROM documents 
            WHERE user_id = auth.uid()
        )
    );

-- Fonction pour calculer la similarité cosinus
CREATE OR REPLACE FUNCTION cosine_similarity(vector_a vector, vector_b vector)
RETURNS FLOAT AS $$
BEGIN
    RETURN 1 - (vector_a <=> vector_b);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Commentaires sur les tables
COMMENT ON TABLE document_chunks IS 'Stocke les chunks de documents avec leurs embeddings vectoriels pour la recherche sémantique';
COMMENT ON COLUMN document_chunks.embedding IS 'Embedding vectoriel de dimension 1536 (OpenAI text-embedding-3-small)';
COMMENT ON COLUMN document_chunks.metadata IS 'Métadonnées supplémentaires sur le chunk (position, type, etc.)';

COMMENT ON TABLE document_citations IS 'Stocke les citations extraites avec leurs scores de pertinence';
COMMENT ON COLUMN document_citations.relevance_score IS 'Score de pertinence de la citation (0.0 à 1.0)';
COMMENT ON COLUMN document_citations.text_snippet IS 'Extrait de texte cité';
COMMENT ON COLUMN document_citations.page_number IS 'Numéro de page d\'origine (si applicable)';

-- Validation des contraintes
ALTER TABLE document_chunks ADD CONSTRAINT chk_chunk_index_positive 
CHECK (chunk_index >= 0);

ALTER TABLE document_citations ADD CONSTRAINT chk_relevance_score_range 
CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0);

ALTER TABLE document_citations ADD CONSTRAINT chk_page_number_positive 
CHECK (page_number IS NULL OR page_number > 0);

-- Vue pour les chunks avec leurs documents
CREATE OR REPLACE VIEW document_chunks_with_docs AS
SELECT 
    dc.*,
    d.name as document_name,
    d.type as document_type,
    d.user_id
FROM document_chunks dc
JOIN documents d ON dc.document_id = d.id;

-- Vue pour les citations avec leurs documents et chunks
CREATE OR REPLACE VIEW document_citations_with_details AS
SELECT 
    dc.*,
    d.name as document_name,
    d.type as document_type,
    d.user_id,
    dc.content as chunk_content
FROM document_citations dc
JOIN document_chunks dcc ON dc.chunk_id = dcc.id
JOIN documents d ON dc.document_id = d.id;
