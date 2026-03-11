-- Migration: Création des tables pour le système de bookmarks intelligents
-- Date: 11 mars 2026
-- Description: Tables pour gérer les bookmarks avec tags, catégories et collections

-- Table des bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('document', 'note', 'conversation', 'flashcard', 'quiz', 'folder', 'website', 'article', 'video', 'tool', 'resource')),
    target_id UUID NOT NULL,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('document', 'note', 'conversation', 'flashcard', 'quiz', 'folder', 'external')),
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 0
);

-- Table des catégories de bookmarks
CREATE TABLE IF NOT EXISTS bookmark_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#e5e7eb',
    icon VARCHAR(50),
    parent_id UUID REFERENCES bookmark_categories(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- Table des collections de bookmarks
CREATE TABLE IF NOT EXISTS bookmark_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    bookmark_ids UUID[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- Table des logs d'accès aux bookmarks
CREATE TABLE IF NOT EXISTS bookmark_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bookmark_id UUID NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT
);

-- Index pour les performances
CREATE INDEX idx_bookmarks_created_by ON bookmarks(created_by);
CREATE INDEX idx_bookmarks_target_id ON bookmarks(target_id);
CREATE INDEX idx_bookmarks_target_type ON bookmarks(target_type);
CREATE INDEX idx_bookmarks_type ON bookmarks(type);
CREATE INDEX idx_bookmarks_category ON bookmarks(category);
CREATE INDEX idx_bookmarks_is_public ON bookmarks(is_public);
CREATE INDEX idx_bookmarks_is_pinned ON bookmarks(is_pinned);
CREATE INDEX idx_bookmarks_priority ON bookmarks(priority);
CREATE INDEX idx_bookmarks_tags ON bookmarks USING gin(tags);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX idx_bookmarks_updated_at ON bookmarks(updated_at DESC);
CREATE INDEX idx_bookmarks_last_accessed ON bookmarks(last_accessed DESC);
CREATE INDEX idx_bookmarks_access_count ON bookmarks(access_count DESC);
CREATE INDEX idx_bookmarks_title ON bookmarks USING gin(to_tsvector('french', title));

CREATE INDEX idx_bookmark_categories_created_by ON bookmark_categories(created_by);
CREATE INDEX idx_bookmark_categories_parent_id ON bookmark_categories(parent_id);
CREATE INDEX idx_bookmark_categories_sort_order ON bookmark_categories(sort_order);
CREATE INDEX idx_bookmark_categories_name ON bookmark_categories USING gin(to_tsvector('french', name));

CREATE INDEX idx_bookmark_collections_created_by ON bookmark_collections(created_by);
CREATE INDEX idx_bookmark_collections_is_default ON bookmark_collections(is_default);
CREATE INDEX idx_bookmark_collections_name ON bookmark_collections USING gin(to_tsvector('french', name));
CREATE INDEX idx_bookmark_collections_bookmark_ids ON bookmark_collections USING gin(bookmark_ids);

CREATE INDEX idx_bookmark_access_logs_bookmark_id ON bookmark_access_logs(bookmark_id);
CREATE INDEX idx_bookmark_access_logs_user_id ON bookmark_access_logs(user_id);
CREATE INDEX idx_bookmark_access_logs_accessed_at ON bookmark_access_logs(accessed_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_bookmarks_updated_at 
    BEFORE UPDATE ON bookmarks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookmark_categories_updated_at 
    BEFORE UPDATE ON bookmark_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookmark_collections_updated_at 
    BEFORE UPDATE ON bookmark_collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS pour les bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON bookmarks
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can view public bookmarks" ON bookmarks
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create own bookmarks" ON bookmarks
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own bookmarks" ON bookmarks
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own bookmarks" ON bookmarks
    FOR DELETE USING (created_by = auth.uid());

-- Politiques RLS pour les catégories
ALTER TABLE bookmark_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON bookmark_categories
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can view public categories" ON bookmark_categories
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create own categories" ON bookmark_categories
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own categories" ON bookmark_categories
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own categories" ON bookmark_categories
    FOR DELETE USING (created_by = auth.uid());

-- Politiques RLS pour les collections
ALTER TABLE bookmark_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections" ON bookmark_collections
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can view public collections" ON bookmark_collections
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create own collections" ON bookmark_collections
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own collections" ON bookmark_collections
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own collections" ON bookmark_collections
    FOR DELETE USING (created_by = auth.uid());

-- Politiques RLS pour les logs d'accès
ALTER TABLE bookmark_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own access logs" ON bookmark_access_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own access logs" ON bookmark_access_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fonctions RPC pour les bookmarks

-- Fonction pour incrémenter le compteur d'accès
CREATE OR REPLACE FUNCTION increment_bookmark_access(bookmark_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE bookmarks 
    SET 
        access_count = access_count + 1,
        last_accessed = NOW(),
        updated_at = NOW()
    WHERE id = bookmark_id;
    
    -- Logger l'accès
    INSERT INTO bookmark_access_logs (bookmark_id, user_id, accessed_at)
    VALUES (bookmark_id, auth.uid(), NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques des bookmarks
CREATE OR REPLACE FUNCTION get_bookmark_stats(p_user_id UUID)
RETURNS TABLE (
    total_bookmarks BIGINT,
    bookmarks_by_type JSONB,
    bookmarks_by_category JSONB,
    top_tags JSONB,
    recently_accessed JSONB,
    most_accessed JSONB,
    pinned_bookmarks JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_bookmarks,
        (
            SELECT jsonb_object_agg(type, count) 
            FROM (
                SELECT type, COUNT(*) as count
                FROM bookmarks
                WHERE created_by = p_user_id
                GROUP BY type
            ) type_counts
        ) as bookmarks_by_type,
        (
            SELECT jsonb_object_agg(category, count) 
            FROM (
                SELECT COALESCE(category, 'non-catégorisé') as category, COUNT(*) as count
                FROM bookmarks
                WHERE created_by = p_user_id
                GROUP BY category
            ) category_counts
        ) as bookmarks_by_category,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'tag', tag,
                    'count', tag_count
                )
            )
            FROM (
                SELECT 
                    unnest(tags) as tag,
                    COUNT(*) as tag_count
                FROM bookmarks
                WHERE created_by = p_user_id
                AND tags IS NOT NULL
                GROUP BY tag
                ORDER BY tag_count DESC
                LIMIT 10
            ) tag_stats
        ) as top_tags,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'title', title,
                    'type', type,
                    'target_id', target_id,
                    'target_type', target_type,
                    'last_accessed', last_accessed,
                    'access_count', access_count
                )
            )
            FROM bookmarks
            WHERE created_by = p_user_id
            ORDER BY last_accessed DESC
            LIMIT 5
        ) as recently_accessed,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'title', title,
                    'type', type,
                    'target_id', target_id,
                    'target_type', target_type,
                    'access_count', access_count
                )
            )
            FROM bookmarks
            WHERE created_by = p_user_id
            ORDER BY access_count DESC
            LIMIT 5
        ) as most_accessed,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'title', title,
                    'type', type,
                    'target_id', target_id,
                    'target_type', target_type,
                    'priority', priority
                )
            )
            FROM bookmarks
            WHERE created_by = p_user_id
            AND is_pinned = true
            ORDER BY priority DESC, created_at DESC
        ) as pinned_bookmarks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les suggestions de bookmarks
CREATE OR REPLACE FUNCTION get_bookmark_suggestions(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    type VARCHAR(50),
    target_id UUID,
    target_type VARCHAR(50),
    tags TEXT[],
    category VARCHAR(100),
    priority VARCHAR(10),
    access_count INTEGER,
    last_accessed TIMESTAMP WITH TIME ZONE,
    relevance_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.description,
        b.type,
        b.target_id,
        b.target_type,
        b.tags,
        b.category,
        b.priority,
        b.access_count,
        b.last_accessed,
        -- Calculer un score de pertinence
        (
            -- Poids pour l'accès récent
            CASE 
                WHEN b.last_accessed > NOW() - INTERVAL '7 days' THEN 0.4
                WHEN b.last_accessed > NOW() - INTERVAL '30 days' THEN 0.2
                ELSE 0.1
            END +
            -- Poids pour le nombre d'accès
            LEAST(b.access_count * 0.01, 0.3) +
            -- Poids pour la priorité
            CASE 
                WHEN b.priority = 'high' THEN 0.2
                WHEN b.priority = 'medium' THEN 0.1
                ELSE 0.05
            END +
            -- Poids pour les bookmarks épinglés
            CASE WHEN b.is_pinned THEN 0.1 ELSE 0 END
        ) as relevance_score
    FROM bookmarks b
    WHERE b.created_by = p_user_id
    ORDER BY relevance_score DESC, b.last_accessed DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour rechercher des bookmarks
CREATE OR REPLACE FUNCTION search_bookmarks(
    p_user_id UUID,
    p_query TEXT,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    type VARCHAR(50),
    target_id UUID,
    target_type VARCHAR(50),
    tags TEXT[],
    category VARCHAR(100),
    priority VARCHAR(10),
    access_count INTEGER,
    last_accessed TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.description,
        b.type,
        b.target_id,
        b.target_type,
        b.tags,
        b.category,
        b.priority,
        b.access_count,
        b.last_accessed,
        ts_rank(
            to_tsvector('french', COALESCE(b.title, '') || ' ' || COALESCE(b.description, '')),
            plainto_tsquery('french', p_query)
        ) as rank
    FROM bookmarks b
    WHERE 
        b.created_by = p_user_id
        AND to_tsvector('french', COALESCE(b.title, '') || ' ' || COALESCE(b.description, '')) 
        @@ plainto_tsquery('french', p_query)
    ORDER BY rank DESC, b.last_accessed DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les bookmarks par tags
CREATE OR REPLACE FUNCTION get_bookmarks_by_tags(
    p_user_id UUID,
    p_tags TEXT[]
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    type VARCHAR(50),
    target_id UUID,
    target_type VARCHAR(50),
    tags TEXT[],
    category VARCHAR(100),
    priority VARCHAR(10),
    access_count INTEGER,
    last_accessed TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.description,
        b.type,
        b.target_id,
        b.target_type,
        b.tags,
        b.category,
        b.priority,
        b.access_count,
        b.last_accessed
    FROM bookmarks b
    WHERE 
        b.created_by = p_user_id
        AND b.tags && p_tags
    ORDER BY b.last_accessed DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le compteur de bookmarks dans les catégories
CREATE OR REPLACE FUNCTION update_category_bookmark_counts()
RETURNS VOID AS $$
BEGIN
    UPDATE bookmark_categories bc
    SET bookmark_count = (
        SELECT COUNT(*)
        FROM bookmarks b
        WHERE b.category = bc.name
        AND b.created_by = bc.created_by
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le compteur de bookmarks dans les collections
CREATE OR REPLACE FUNCTION update_collection_bookmark_counts()
RETURNS VOID AS $$
BEGIN
    UPDATE bookmark_collections bc
    SET bookmark_count = array_length(bookmark_ids, 1)
    WHERE bookmark_ids IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les compteurs automatiquement
CREATE OR REPLACE FUNCTION update_bookmarks_counts_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        PERFORM update_category_bookmark_counts();
        PERFORM update_collection_bookmark_counts();
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
CREATE TRIGGER update_bookmarks_counts
    AFTER INSERT OR UPDATE OR DELETE ON bookmarks
    FOR EACH ROW EXECUTE FUNCTION update_bookmarks_counts_trigger();

-- Commentaires sur les tables
COMMENT ON TABLE bookmarks IS 'Bookmarks intelligents avec tags, catégories et métadonnées';
COMMENT ON TABLE bookmark_categories IS 'Catégories pour organiser les bookmarks';
COMMENT ON TABLE bookmark_collections IS 'Collections de bookmarks pour regrouper des favoris';
COMMENT ON TABLE bookmark_access_logs IS 'Logs d\'accès aux bookmarks pour analyser l\'usage';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN bookmarks.tags IS 'Tags pour organiser et rechercher les bookmarks';
COMMENT ON COLUMN bookmarks.metadata IS 'Métadonnées additionnelles (thumbnail, preview, etc.)';
COMMENT ON COLUMN bookmarks.access_count IS 'Nombre de fois que ce bookmark a été accédé';
COMMENT ON COLUMN bookmarks.last_accessed IS 'Dernière date d\'accès à ce bookmark';
COMMENT ON COLUMN bookmark_categories.color IS 'Couleur de la catégorie en format hexadécimal';
COMMENT ON COLUMN bookmark_collections.bookmark_ids IS 'Liste des IDs des bookmarks dans cette collection';

-- Créer quelques catégories par défaut pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION create_default_bookmark_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Catégorie par défaut
    INSERT INTO bookmark_categories (name, description, color, icon, sort_order, created_by)
    VALUES (
        'Général',
        'Bookmarks généraux non catégorisés',
        '#e5e7eb',
        'folder',
        0,
        p_user_id
    );
    
    -- Catégories utiles
    INSERT INTO bookmark_categories (name, description, color, icon, sort_order, created_by)
    VALUES 
        ('Travail', 'Bookmarks professionnels et liés au travail', '#3b82f6', 'briefcase', 1, p_user_id),
        ('Personnel', 'Bookmarks personnels et privés', '#10b981', 'user', 2, p_user_id),
        ('Éducation', 'Bookmarks éducatifs et d\'apprentissage', '#8b5cf6', 'graduation-cap', 3, p_user_id),
        ('Recherche', 'Bookmarks pour la recherche et études', '#f59e0b', 'search', 4, p_user_id),
        ('Divertissement', 'Bookmarks pour le divertissement et loisirs', '#ef4444', 'gamepad-2', 5, p_user_id);
    
    -- Ignorer les erreurs de doublons
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
