-- Migration: Création des tables pour les notes personnelles (rich text editor)
-- Date: 11 mars 2026
-- Description: Tables pour gérer les notes personnelles avec éditeur riche

-- Table des notes personnelles
CREATE TABLE IF NOT EXISTS personal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- Rich text content (HTML)
    plain_content TEXT NOT NULL, -- Plain text version for search
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES note_folders(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    is_favorite BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    color VARCHAR(7) DEFAULT '#ffffff', -- Hex color code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    word_count INTEGER DEFAULT 0,
    reading_time INTEGER DEFAULT 0, -- Minutes
    metadata JSONB DEFAULT '{}'
);

-- Table des dossiers de notes
CREATE TABLE IF NOT EXISTS note_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#e5e7eb',
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES note_folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- Table des pièces jointes des notes
CREATE TABLE IF NOT EXISTS note_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES personal_notes(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL
);

-- Table des versions des notes
CREATE TABLE IF NOT EXISTS note_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES personal_notes(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    UNIQUE(note_id, version_number)
);

-- Table des partages de notes
CREATE TABLE IF NOT EXISTS note_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES personal_notes(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    shared_with UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    permission VARCHAR(10) NOT NULL CHECK (permission IN ('read', 'write', 'admin')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    UNIQUE(note_id, shared_with)
);

-- Index pour les performances
CREATE INDEX idx_personal_notes_created_by ON personal_notes(created_by);
CREATE INDEX idx_personal_notes_workspace_id ON personal_notes(workspace_id);
CREATE INDEX idx_personal_notes_folder_id ON personal_notes(folder_id);
CREATE INDEX idx_personal_notes_tags ON personal_notes USING GIN(tags);
CREATE INDEX idx_personal_notes_is_favorite ON personal_notes(is_favorite);
CREATE INDEX idx_personal_notes_is_archived ON personal_notes(is_archived);
CREATE INDEX idx_personal_notes_is_pinned ON personal_notes(is_pinned);
CREATE INDEX idx_personal_notes_created_at ON personal_notes(created_at DESC);
CREATE INDEX idx_personal_notes_updated_at ON personal_notes(updated_at DESC);
CREATE INDEX idx_personal_notes_title ON personal_notes USING gin(to_tsvector('french', title));
CREATE INDEX idx_personal_notes_plain_content ON personal_notes USING gin(to_tsvector('french', plain_content));

CREATE INDEX idx_note_folders_created_by ON note_folders(created_by);
CREATE INDEX idx_note_folders_workspace_id ON note_folders(workspace_id);
CREATE INDEX idx_note_folders_parent_id ON note_folders(parent_id);
CREATE INDEX idx_note_folders_name ON note_folders(name);

CREATE INDEX idx_note_attachments_note_id ON note_attachments(note_id);
CREATE INDEX idx_note_attachments_created_by ON note_attachments(created_by);

CREATE INDEX idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX idx_note_versions_created_at ON note_versions(created_at DESC);

CREATE INDEX idx_note_shares_note_id ON note_shares(note_id);
CREATE INDEX idx_note_shares_shared_by ON note_shares(shared_by);
CREATE INDEX idx_note_shares_shared_with ON note_shares(shared_with);
CREATE INDEX idx_note_shares_expires_at ON note_shares(expires_at);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_personal_notes_updated_at 
    BEFORE UPDATE ON personal_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_folders_updated_at 
    BEFORE UPDATE ON note_folders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS pour les notes personnelles
ALTER TABLE personal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes" ON personal_notes
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create their own notes" ON personal_notes
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own notes" ON personal_notes
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own notes" ON personal_notes
    FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Users can view shared notes" ON personal_notes
    FOR SELECT USING (
        id IN (
            SELECT note_id FROM note_shares 
            WHERE shared_with = auth.uid() AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

CREATE POLICY "Users can view public notes" ON personal_notes
    FOR SELECT USING (is_public = true);

CREATE POLICY "Workspace members can view workspace notes" ON personal_notes
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Politiques RLS pour les dossiers de notes
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own folders" ON note_folders
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create their own folders" ON note_folders
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own folders" ON note_folders
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own folders" ON note_folders
    FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Workspace members can view workspace folders" ON note_folders
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Politiques RLS pour les pièces jointes
ALTER TABLE note_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own note attachments" ON note_attachments
    FOR SELECT USING (
        note_id IN (
            SELECT id FROM personal_notes 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create attachments for their notes" ON note_attachments
    FOR INSERT WITH CHECK (
        note_id IN (
            SELECT id FROM personal_notes 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update their own note attachments" ON note_attachments
    FOR UPDATE USING (
        note_id IN (
            SELECT id FROM personal_notes 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own note attachments" ON note_attachments
    FOR DELETE USING (
        note_id IN (
            SELECT id FROM personal_notes 
            WHERE created_by = auth.uid()
        )
    );

-- Politiques RLS pour les versions des notes
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own note versions" ON note_versions
    FOR SELECT USING (
        note_id IN (
            SELECT id FROM personal_notes 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create versions for their notes" ON note_versions
    FOR INSERT WITH CHECK (
        note_id IN (
            SELECT id FROM personal_notes 
            WHERE created_by = auth.uid()
        )
    );

-- Politiques RLS pour les partages de notes
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shared notes" ON note_shares
    FOR SELECT USING (shared_by = auth.uid() OR shared_with = auth.uid());

CREATE POLICY "Users can create shares for their notes" ON note_shares
    FOR INSERT WITH CHECK (
        note_id IN (
            SELECT id FROM personal_notes 
            WHERE created_by = auth.uid()
        ) AND shared_by = auth.uid()
    );

CREATE POLICY "Users can update their shares" ON note_shares
    FOR UPDATE USING (shared_by = auth.uid());

CREATE POLICY "Users can delete their shares" ON note_shares
    FOR DELETE USING (shared_by = auth.uid());

-- Fonctions RPC pour faciliter les opérations

-- Recherche de notes avec texte plein
CREATE OR REPLACE FUNCTION search_personal_notes(
    p_user_id UUID,
    p_query TEXT,
    p_workspace_id UUID DEFAULT NULL,
    p_folder_id UUID DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_include_archived BOOLEAN DEFAULT FALSE,
    p_include_favorites BOOLEAN DEFAULT FALSE,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    content TEXT,
    plain_content TEXT,
    tags TEXT[],
    is_favorite BOOLEAN,
    is_archived BOOLEAN,
    is_pinned BOOLEAN,
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    word_count INTEGER,
    reading_time INTEGER,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.content,
        n.plain_content,
        n.tags,
        n.is_favorite,
        n.is_archived,
        n.is_pinned,
        n.color,
        n.created_at,
        n.updated_at,
        n.word_count,
        n.reading_time,
        ts_rank(
            to_tsvector('french', n.title || ' ' || n.plain_content),
            plainto_tsquery('french', p_query)
        ) as rank
    FROM personal_notes n
    WHERE 
        n.created_by = p_user_id
        AND (p_workspace_id IS NULL OR n.workspace_id = p_workspace_id)
        AND (p_folder_id IS NULL OR n.folder_id = p_folder_id)
        AND (p_tags IS NULL OR n.tags && p_tags)
        AND (p_include_archived OR n.is_archived = false)
        AND (p_include_favorites OR n.is_favorite = false OR n.is_favorite = true)
        AND (
            to_tsvector('french', n.title || ' ' || n.plain_content) 
            @@ plainto_tsquery('french', p_query)
        )
    ORDER BY rank DESC, n.updated_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir les statistiques des notes d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_notes_stats(p_user_id UUID, p_workspace_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_notes BIGINT,
    total_words BIGINT,
    total_reading_time BIGINT,
    favorites_count BIGINT,
    archived_count BIGINT,
    pinned_count BIGINT,
    unique_tags BIGINT,
    folders_count BIGINT,
    recent_notes_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_notes,
        COALESCE(SUM(word_count), 0) as total_words,
        COALESCE(SUM(reading_time), 0) as total_reading_time,
        COUNT(*) FILTER (WHERE is_favorite = true) as favorites_count,
        COUNT(*) FILTER (WHERE is_archived = true) as archived_count,
        COUNT(*) FILTER (WHERE is_pinned = true) as pinned_count,
        (SELECT COUNT(DISTINCT unnest(tags)) FROM personal_notes WHERE created_by = p_user_id) as unique_tags,
        (SELECT COUNT(*) FROM note_folders WHERE created_by = p_user_id) as folders_count,
        (SELECT COUNT(*) FROM personal_notes WHERE created_by = p_user_id AND created_at > NOW() - INTERVAL '7 days') as recent_notes_count
    FROM personal_notes 
    WHERE 
        created_by = p_user_id
        AND (p_workspace_id IS NULL OR workspace_id = p_workspace_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir les notes les plus récentes d'un utilisateur
CREATE OR REPLACE FUNCTION get_recent_notes(
    p_user_id UUID,
    p_workspace_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    plain_content TEXT,
    tags TEXT[],
    is_favorite BOOLEAN,
    is_pinned BOOLEAN,
    color VARCHAR(7),
    updated_at TIMESTAMP WITH TIME ZONE,
    word_count INTEGER,
    reading_time INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.plain_content,
        n.tags,
        n.is_favorite,
        n.is_pinned,
        n.color,
        n.updated_at,
        n.word_count,
        n.reading_time
    FROM personal_notes n
    WHERE 
        n.created_by = p_user_id
        AND (p_workspace_id IS NULL OR n.workspace_id = p_workspace_id)
        AND n.is_archived = false
    ORDER BY 
        n.is_pinned DESC,
        n.updated_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir les notes favorites d'un utilisateur
CREATE OR REPLACE FUNCTION get_favorite_notes(
    p_user_id UUID,
    p_workspace_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    plain_content TEXT,
    tags TEXT[],
    color VARCHAR(7),
    updated_at TIMESTAMP WITH TIME ZONE,
    word_count INTEGER,
    reading_time INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.plain_content,
        n.tags,
        n.color,
        n.updated_at,
        n.word_count,
        n.reading_time
    FROM personal_notes n
    WHERE 
        n.created_by = p_user_id
        AND (p_workspace_id IS NULL OR n.workspace_id = p_workspace_id)
        AND n.is_favorite = true
        AND n.is_archived = false
    ORDER BY n.updated_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires sur les tables
COMMENT ON TABLE personal_notes IS 'Notes personnelles avec éditeur de texte riche';
COMMENT ON TABLE note_folders IS 'Dossiers pour organiser les notes personnelles';
COMMENT ON TABLE note_attachments IS 'Pièces jointes des notes personnelles';
COMMENT ON TABLE note_versions IS 'Versions sauvegardées des notes personnelles';
COMMENT ON TABLE note_shares IS 'Partages des notes personnelles avec d\'autres utilisateurs';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN personal_notes.content IS 'Contenu riche au format HTML';
COMMENT ON COLUMN personal_notes.plain_content IS 'Version texte brut pour la recherche';
COMMENT ON COLUMN personal_notes.metadata IS 'Métadonnées de la note (statistiques, version, etc.)';
COMMENT ON COLUMN personal_notes.color IS 'Couleur de la note en format hexadécimal';
COMMENT ON COLUMN note_folders.color IS 'Couleur du dossier en format hexadécimal';
COMMENT ON COLUMN note_shares.permission IS 'Permission de partage: read, write, ou admin';
COMMENT ON COLUMN note_shares.expires_at IS 'Date d\'expiration du partage (optionnel)';
