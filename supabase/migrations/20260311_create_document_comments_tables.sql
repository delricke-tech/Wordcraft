-- Migration: Création des tables pour les commentaires de documents (threads imbriqués)
-- Date: 11 mars 2026
-- Description: Tables pour gérer les commentaires avec threads, réponses, mentions et réactions

-- Table des commentaires de documents
CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('document', 'note', 'conversation', 'flashcard', 'quiz', 'collaboration_session')),
    content TEXT NOT NULL,
    position JSONB, -- {page, line, column, length, selectedText, context, x, y, width, height}
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    author_role VARCHAR(100),
    thread_id UUID, -- Pour grouper les commentaires en threads
    parent_id UUID REFERENCES document_comments(id) ON DELETE CASCADE,
    mentions JSONB DEFAULT '[]', -- [{id, userId, userName, position, type, notified, notifiedAt}]
    reactions JSONB DEFAULT '[]', -- [{id, emoji, userId, userName, createdAt}]
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived', 'deleted')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}', -- {wordCount, sentiment, language, category, attachments, links}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reply_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE
);

-- Table des pièces jointes des commentaires
CREATE TABLE IF NOT EXISTS comment_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES document_comments(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- Table des liens dans les commentaires
CREATE TABLE IF NOT EXISTS comment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES document_comments(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    thumbnail_url TEXT,
    favicon TEXT,
    domain VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications de commentaires
CREATE TABLE IF NOT EXISTS comment_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES document_comments(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('mention', 'reply', 'resolve', 'reaction', 'delete')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_document_comments_target_id ON document_comments(target_id);
CREATE INDEX idx_document_comments_target_type ON document_comments(target_type);
CREATE INDEX idx_document_comments_author_id ON document_comments(author_id);
CREATE INDEX idx_document_comments_thread_id ON document_comments(thread_id);
CREATE INDEX idx_document_comments_parent_id ON document_comments(parent_id);
CREATE INDEX idx_document_comments_status ON document_comments(status);
CREATE INDEX idx_document_comments_priority ON document_comments(priority);
CREATE INDEX idx_document_comments_created_at ON document_comments(created_at DESC);
CREATE INDEX idx_document_comments_updated_at ON document_comments(updated_at DESC);
CREATE INDEX idx_document_comments_resolved_at ON document_comments(resolved_at DESC);
CREATE INDEX idx_document_comments_tags ON document_comments USING gin(tags);
CREATE INDEX idx_document_comments_content ON document_comments USING gin(to_tsvector('french', content));

CREATE INDEX idx_comment_attachments_comment_id ON comment_attachments(comment_id);
CREATE INDEX idx_comment_attachments_uploaded_by ON comment_attachments(uploaded_by);
CREATE INDEX idx_comment_attachments_uploaded_at ON comment_attachments(uploaded_at DESC);

CREATE INDEX idx_comment_links_comment_id ON comment_links(comment_id);
CREATE INDEX idx_comment_links_domain ON comment_links(domain);
CREATE INDEX idx_comment_links_created_at ON comment_links(created_at DESC);

CREATE INDEX idx_comment_notifications_user_id ON comment_notifications(user_id);
CREATE INDEX idx_comment_notifications_comment_id ON comment_notifications(comment_id);
CREATE INDEX idx_comment_notifications_type ON comment_notifications(notification_type);
CREATE INDEX idx_comment_notifications_read ON comment_notifications(read);
CREATE INDEX idx_comment_notifications_created_at ON comment_notifications(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_document_comments_updated_at 
    BEFORE UPDATE ON document_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour le compteur de réponses
CREATE OR REPLACE FUNCTION increment_comment_reply_count(p_parent_comment_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE document_comments 
    SET 
        reply_count = reply_count + 1,
        updated_at = NOW()
    WHERE id = p_parent_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger automatique pour incrémenter les réponses
CREATE OR REPLACE FUNCTION trigger_increment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
        PERFORM increment_comment_reply_count(NEW.parent_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_reply_count_trigger
    AFTER INSERT ON document_comments
    FOR EACH ROW EXECUTE FUNCTION trigger_increment_reply_count();

-- Politiques RLS pour les commentaires
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document comments" ON document_comments
    FOR SELECT USING (
        -- Les utilisateurs peuvent voir les commentaires sur leurs propres documents
        target_id IN (
            SELECT id FROM documents WHERE created_by = auth.uid()
        ) OR
        target_id IN (
            SELECT id FROM personal_notes WHERE created_by = auth.uid()
        ) OR
        -- Les utilisateurs peuvent voir les commentaires où ils sont l'auteur
        author_id = auth.uid()
        -- Les utilisateurs peuvent voir les commentaires où ils sont mentionnés
        OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(mentions) as mention
            WHERE mention->>'userId' = auth.uid()::text
        )
    );

CREATE POLICY "Users can create document comments" ON document_comments
    FOR INSERT WITH CHECK (
        -- Les utilisateurs peuvent commenter leurs propres documents
        target_id IN (
            SELECT id FROM documents WHERE created_by = auth.uid()
        ) OR
        target_id IN (
            SELECT id FROM personal_notes WHERE created_by = auth.uid()
        ) OR
        -- Les utilisateurs peuvent commenter les documents partagés avec eux
        EXISTS (
            SELECT 1 FROM document_shares ds
            WHERE ds.target_id = target_id
            AND ds.target_type = target_type
            AND ds.shared_with = auth.uid()
        )
    );

CREATE POLICY "Users can update own document comments" ON document_comments
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete own document comments" ON document_comments
    FOR DELETE USING (author_id = auth.uid());

-- Politiques RLS pour les pièces jointes
ALTER TABLE comment_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comment attachments" ON comment_attachments
    FOR SELECT USING (
        comment_id IN (
            SELECT id FROM document_comments WHERE author_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage comment attachments" ON comment_attachments
    FOR ALL USING (
        uploaded_by = auth.uid()
    );

-- Politiques RLS pour les liens
ALTER TABLE comment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comment links" ON comment_links
    FOR SELECT USING (
        comment_id IN (
            SELECT id FROM document_comments WHERE author_id = auth.uid()
        )
    );

-- Politiques RLS pour les notifications
ALTER TABLE comment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own comment notifications" ON comment_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own comment notifications" ON comment_notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Fonctions RPC pour les commentaires de documents

-- Fonction pour obtenir les threads de commentaires avec réponses
CREATE OR REPLACE FUNCTION get_comment_threads(
    p_target_id UUID,
    p_target_type VARCHAR(50),
    p_status VARCHAR(20) DEFAULT NULL,
    p_priority VARCHAR(10) DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    thread_id UUID,
    root_comment_id UUID,
    root_content TEXT,
    root_author_id UUID,
    root_author_name VARCHAR(255),
    root_created_at TIMESTAMP WITH TIME ZONE,
    root_updated_at TIMESTAMP WITH TIME ZONE,
    root_status VARCHAR(20),
    root_priority VARCHAR(10),
    root_tags TEXT[],
    total_replies INTEGER,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    last_reply_by VARCHAR(255),
    participants UUID[],
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    reply_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH root_comments AS (
        SELECT 
            id,
            content,
            author_id,
            author_name,
            created_at,
            updated_at,
            status,
            priority,
            tags,
            resolved_at,
            resolved_by,
            COALESCE(
                (SELECT COUNT(*) 
                FROM document_comments dc2 
                WHERE dc2.parent_id = dc1.id 
                AND dc2.deleted_at IS NULL
                ), 0
            ) as reply_count
        FROM document_comments dc1
        WHERE dc1.target_id = p_target_id
        AND dc1.target_type = p_target_type
        AND dc1.parent_id IS NULL
        AND dc1.deleted_at IS NULL
        AND (p_status IS NULL OR dc1.status = p_status)
        AND (p_priority IS NULL OR dc1.priority = p_priority)
        ORDER BY dc1.updated_at DESC
        LIMIT p_limit
        OFFSET p_offset
    ),
    thread_details AS (
        SELECT 
            rc.id as root_comment_id,
            rc.id as thread_id,
            rc.content as root_content,
            rc.author_id as root_author_id,
            rc.author_name as root_author_name,
            rc.created_at as root_created_at,
            rc.updated_at as root_updated_at,
            rc.status as root_status,
            rc.priority as root_priority,
            rc.tags as root_tags,
            rc.reply_count,
            rc.resolved_at,
            rc.resolved_by,
            COALESCE(
                (SELECT MAX(created_at)
                FROM document_comments dc3
                WHERE dc3.parent_id = rc.id
                AND dc3.deleted_at IS NULL
            ), rc.created_at
            ) as last_reply_at,
            COALESCE(
                (SELECT author_name
                FROM document_comments dc4
                WHERE dc4.parent_id = rc.id
                AND dc4.deleted_at IS NULL
                ORDER BY dc4.created_at DESC
                LIMIT 1
            ), rc.author_name
            ) as last_reply_by,
            COALESCE(
                ARRAY_AGG(DISTINCT dc5.author_id)
                FILTER (WHERE dc5.deleted_at IS NULL),
                ARRAY[rc.author_id]
            ) as participants
        FROM root_comments rc
        LEFT JOIN document_comments dc5 ON dc5.parent_id = rc.id
        GROUP BY rc.id, rc.content, rc.author_id, rc.author_name, rc.created_at, rc.updated_at, 
                 rc.status, rc.priority, rc.tags, rc.reply_count, rc.resolved_at, rc.resolved_by
    )
    SELECT * FROM thread_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques des commentaires
CREATE OR REPLACE FUNCTION get_comment_stats(
    p_target_id UUID DEFAULT NULL,
    p_target_type VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    total_comments BIGINT,
    total_threads BIGINT,
    resolved_comments BIGINT,
    pending_comments BIGINT,
    comments_by_type JSONB,
    comments_by_priority JSONB,
    top_commenters JSONB,
    recent_activity JSONB,
    tag_distribution JSONB,
    avg_replies_per_thread FLOAT,
    most_active_day JSONB,
    comment_growth JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Statistiques de base
        COUNT(*) as total_comments,
        COUNT(*) FILTER (WHERE parent_id IS NULL) as total_threads,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_comments,
        COUNT(*) FILTER (WHERE status = 'active') as pending_comments,
        
        -- Commentaires par type
        (
            SELECT jsonb_object_agg(target_type, type_count)
            FROM (
                SELECT target_type, COUNT(*) as type_count
                FROM document_comments
                WHERE deleted_at IS NULL
                AND (p_target_id IS NULL OR target_id = p_target_id)
                AND (p_target_type IS NULL OR target_type = p_target_type)
                GROUP BY target_type
            ) type_stats
        ) as comments_by_type,
        
        -- Commentaires par priorité
        (
            SELECT jsonb_build_object(
                'low', COUNT(*) FILTER (WHERE priority = 'low'),
                'medium', COUNT(*) FILTER (WHERE priority = 'medium'),
                'high', COUNT(*) FILTER (WHERE priority = 'high'),
                'urgent', COUNT(*) FILTER (WHERE priority = 'urgent')
            )
        ) as comments_by_priority,
        
        -- Top commenters
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'user_id', author_id,
                    'user_name', author_name,
                    'count', comment_count
                )
            )
            FROM (
                SELECT 
                    author_id,
                    author_name,
                    COUNT(*) as comment_count
                FROM document_comments
                WHERE deleted_at IS NULL
                AND (p_target_id IS NULL OR target_id = p_target_id)
                AND (p_target_type IS NULL OR target_type = p_target_type)
                GROUP BY author_id, author_name
                ORDER BY comment_count DESC
                LIMIT 10
            ) top_users
        ) as top_commenters,
        
        -- Activité récente
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'comment_id', id,
                    'action', CASE 
                        WHEN status = 'resolved' THEN 'resolved'
                        WHEN is_edited THEN 'edited'
                        ELSE 'created'
                    END,
                    'timestamp', updated_at,
                    'user_name', author_name
                )
            )
            FROM (
                SELECT *
                FROM document_comments
                WHERE deleted_at IS NULL
                AND (p_target_id IS NULL OR target_id = p_target_id)
                AND (p_target_type IS NULL OR target_type = p_target_type)
                ORDER BY updated_at DESC
                LIMIT 10
            ) recent
        ) as recent_activity,
        
        -- Distribution des tags
        (
            SELECT jsonb_object_agg(tag, tag_count)
            FROM (
                SELECT 
                    tag,
                    COUNT(*) as tag_count
                FROM document_comments,
                unnest(tags) as tag
                WHERE deleted_at IS NULL
                AND (p_target_id IS NULL OR target_id = p_target_id)
                AND (p_target_type IS NULL OR target_type = p_target_type)
                GROUP BY tag
            ) tag_stats
        ) as tag_distribution,
        
        -- Moyenne de réponses par thread
        COALESCE(
            (
                SELECT AVG(reply_count::FLOAT)
                FROM (
                    SELECT COUNT(*) as reply_count
                    FROM document_comments
                    WHERE parent_id IS NOT NULL
                    AND deleted_at IS NULL
                    AND (p_target_id IS NULL OR target_id = p_target_id)
                    AND (p_target_type IS NULL OR target_type = p_target_type)
                    GROUP BY parent_id
                ) reply_stats
            ), 0
        ) as avg_replies_per_thread,
        
        -- Jour le plus actif
        (
            SELECT jsonb_build_object(
                'day', EXTRACT(DOW FROM created_at)::INTEGER,
                'count', day_count
            )
            FROM (
                SELECT 
                    EXTRACT(DOW FROM created_at)::INTEGER as day,
                    COUNT(*) as day_count
                FROM document_comments
                WHERE deleted_at IS NULL
                AND (p_target_id IS NULL OR target_id = p_target_id)
                AND (p_target_type IS NULL OR target_type = p_target_type)
                AND created_at >= NOW() - INTERVAL '7 days'
                GROUP BY EXTRACT(DOW FROM created_at)
                ORDER BY day_count DESC
                LIMIT 1
            ) day_stats
        ) as most_active_day,
        
        -- Croissance des commentaires
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'month', month,
                    'count', month_count
                )
            )
            FROM (
                SELECT 
                    DATE_TRUNC('month', created_at)::date as month,
                    COUNT(*) as month_count
                FROM document_comments
                WHERE deleted_at IS NULL
                AND (p_target_id IS NULL OR target_id = p_target_id)
                AND (p_target_type IS NULL OR target_type = p_target_type)
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month DESC
                LIMIT 12
            ) month_stats
        ) as comment_growth
    FROM document_comments
    WHERE deleted_at IS NULL
    AND (p_target_id IS NULL OR target_id = p_target_id)
    AND (p_target_type IS NULL OR target_type = p_target_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour rechercher des commentaires
CREATE OR REPLACE FUNCTION search_comments(
    p_query TEXT,
    p_target_id UUID DEFAULT NULL,
    p_target_type VARCHAR(50) DEFAULT NULL,
    p_author_id UUID DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT NULL,
    p_priority VARCHAR(10) DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    target_id UUID,
    target_type VARCHAR(50),
    content TEXT,
    author_id UUID,
    author_name VARCHAR(255),
    author_avatar TEXT,
    thread_id UUID,
    parent_id UUID,
    mentions JSONB,
    reactions JSONB,
    status VARCHAR(20),
    priority VARCHAR(10),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    reply_count INTEGER,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.*,
        ts_rank(
            to_tsvector('french', COALESCE(dc.content, '')),
            plainto_tsquery('french', p_query)
        ) as rank
    FROM document_comments dc
    WHERE 
        dc.deleted_at IS NULL
        AND to_tsvector('french', COALESCE(dc.content, '')) @@ plainto_tsquery('french', p_query)
        AND (p_target_id IS NULL OR dc.target_id = p_target_id)
        AND (p_target_type IS NULL OR dc.target_type = p_target_type)
        AND (p_author_id IS NULL OR dc.author_id = p_author_id)
        AND (p_status IS NULL OR dc.status = p_status)
        AND (p_priority IS NULL OR dc.priority = p_priority)
        AND (p_tags IS NULL OR dc.tags && p_tags)
        AND (p_date_from IS NULL OR dc.created_at >= p_date_from)
        AND (p_date_to IS NULL OR dc.created_at <= p_date_to)
    ORDER BY rank DESC, dc.updated_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer les anciens commentaires
CREATE OR REPLACE FUNCTION cleanup_old_comments(p_days_old INTEGER DEFAULT 365)
RETURNS TABLE (
    cleaned_comments BIGINT,
    cleaned_attachments BIGINT,
    cleaned_notifications BIGINT
) AS $$
DECLARE
    comments_cleaned BIGINT;
    attachments_cleaned BIGINT;
    notifications_cleaned BIGINT;
BEGIN
    -- Marquer comme supprimés les commentaires très anciens
    UPDATE document_comments
    SET 
        deleted_at = NOW(),
        status = 'deleted'
    WHERE deleted_at IS NULL
    AND created_at < NOW() - INTERVAL '1 day' * p_days_old
    AND status IN ('active', 'archived');
    
    GET DIAGNOSTICS comments_cleaned = ROW_COUNT;
    
    -- Supprimer les pièces jointes des commentaires supprimés
    DELETE FROM comment_attachments
    WHERE comment_id IN (
        SELECT id FROM document_comments WHERE deleted_at IS NOT NULL
    );
    
    GET DIAGNOSTICS attachments_cleaned = ROW_COUNT;
    
    -- Supprimer les notifications des commentaires supprimés
    DELETE FROM comment_notifications
    WHERE comment_id IN (
        SELECT id FROM document_comments WHERE deleted_at IS NOT NULL
    );
    
    GET DIAGNOSTICS notifications_cleaned = ROW_COUNT;
    
    RETURN QUERY SELECT comments_cleaned, attachments_cleaned, notifications_cleaned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires sur les tables
COMMENT ON TABLE document_comments IS 'Commentaires sur les documents avec threads, réponses, mentions et réactions';
COMMENT ON TABLE comment_attachments IS 'Pièces jointes des commentaires (images, fichiers, etc.)';
COMMENT ON TABLE comment_links IS 'Liens partagés dans les commentaires avec métadonnées';
COMMENT ON TABLE comment_notifications IS 'Notifications pour les mentions, réponses et autres activités';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN document_comments.position IS 'Position du commentaire dans le document {page, line, column, etc.}';
COMMENT ON COLUMN document_comments.mentions IS 'Mentions d\'utilisateurs avec notifications';
COMMENT ON COLUMN document_comments.reactions IS 'Réactions (emoji) avec utilisateurs et timestamps';
COMMENT ON COLUMN document_comments.metadata IS 'Métadonnées du commentaire {wordCount, sentiment, language, etc.}';
COMMENT ON COLUMN document_comments.reply_count IS 'Nombre de réponses directes';
COMMENT ON COLUMN document_comments.is_edited IS 'Indique si le commentaire a été modifié';

-- Créer une fonction pour nettoyer automatiquement les anciennes données
CREATE OR REPLACE FUNCTION schedule_cleanup_old_comments()
RETURNS VOID AS $$
BEGIN
    PERFORM cleanup_old_comments(365);
END;
$$ LANGUAGE plpgsql;
