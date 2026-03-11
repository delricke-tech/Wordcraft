-- Migration: Création des tables pour les mentions @utilisateur avec notifications
-- Date: 11 mars 2026
-- Description: Tables pour gérer les mentions, notifications, suggestions et statistiques

-- Table des mentions d'utilisateurs
CREATE TABLE IF NOT EXISTS user_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('comment', 'note', 'conversation', 'chat_message', 'document_share', 'task_assignment', 'announcement')),
    source_content TEXT NOT NULL,
    mentioned_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mentioned_user_name VARCHAR(255) NOT NULL,
    mentioned_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mentioned_by_user_name VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    context TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'acknowledged', 'dismissed')),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Table des notifications de mentions
CREATE TABLE IF NOT EXISTS mention_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mention_id UUID NOT NULL REFERENCES user_mentions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('mention', 'reply_to_mention', 'mention_resolved', 'team_mention', 'role_mention', 'everyone_mention')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    channels TEXT[] DEFAULT ARRAY['in_app'],
    metadata JSONB DEFAULT '{}'
);

-- Table des statistiques de mentions par utilisateur
CREATE TABLE IF NOT EXISTS user_mention_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_mentions_received INTEGER DEFAULT 0,
    total_mentions_sent INTEGER DEFAULT 0,
    unread_mentions INTEGER DEFAULT 0,
    mentions_by_type JSONB DEFAULT '{}',
    mentions_by_source JSONB DEFAULT '{}',
    response_rate FLOAT DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0, -- en minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Table des suggestions de mentions (cache pour l'auto-complétion)
CREATE TABLE IF NOT EXISTS mention_suggestions_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash VARCHAR(64) NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    suggestions JSONB NOT NULL DEFAULT '[]',
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMP WITH TIME ZONE
);

-- Table des logs de livraison de notifications
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES mention_notifications(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('in_app', 'email', 'push', 'slack', 'webhook')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'delivered', 'failed', 'expired')),
    attempt_number INTEGER DEFAULT 1,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    response_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_user_mentions_source_id ON user_mentions(source_id);
CREATE INDEX idx_user_mentions_source_type ON user_mentions(source_type);
CREATE INDEX idx_user_mentions_mentioned_user_id ON user_mentions(mentioned_user_id);
CREATE INDEX idx_user_mentions_mentioned_by_user_id ON user_mentions(mentioned_by_user_id);
CREATE INDEX idx_user_mentions_status ON user_mentions(status);
CREATE INDEX idx_user_mentions_created_at ON user_mentions(created_at DESC);
CREATE INDEX idx_user_mentions_read_at ON user_mentions(read_at DESC);
CREATE INDEX idx_user_mentions_content ON user_mentions USING gin(to_tsvector('french', source_content));

CREATE INDEX idx_mention_notifications_user_id ON mention_notifications(user_id);
CREATE INDEX idx_mention_notifications_mention_id ON mention_notifications(mention_id);
CREATE INDEX idx_mention_notifications_type ON mention_notifications(type);
CREATE INDEX idx_mention_notifications_read ON mention_notifications(read);
CREATE INDEX idx_mention_notifications_priority ON mention_notifications(priority);
CREATE INDEX idx_mention_notifications_created_at ON mention_notifications(created_at DESC);
CREATE INDEX idx_mention_notifications_expires_at ON mention_notifications(expires_at);
CREATE INDEX idx_mention_notifications_channels ON mention_notifications USING gin(channels);

CREATE INDEX idx_user_mention_stats_user_id ON user_mention_stats(user_id);
CREATE INDEX idx_user_mention_stats_date ON user_mention_stats(date);
CREATE INDEX idx_user_mention_stats_unread_mentions ON user_mention_stats(unread_mentions DESC);

CREATE INDEX idx_mention_suggestions_cache_query_hash ON mention_suggestions_cache(query_hash);
CREATE INDEX idx_mention_suggestions_cache_user_id ON mention_suggestions_cache(user_id);
CREATE INDEX idx_mention_suggestions_cache_expires_at ON mention_suggestions_cache(expires_at);
CREATE INDEX idx_mention_suggestions_cache_hit_count ON mention_suggestions_cache(hit_count DESC);

CREATE INDEX idx_notification_delivery_logs_notification_id ON notification_delivery_logs(notification_id);
CREATE INDEX idx_notification_delivery_logs_channel ON notification_delivery_logs(channel);
CREATE INDEX idx_notification_delivery_logs_status ON notification_delivery_logs(status);
CREATE INDEX idx_notification_delivery_logs_created_at ON notification_delivery_logs(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_user_mention_stats_updated_at 
    BEFORE UPDATE ON user_mention_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques des mentions
CREATE OR REPLACE FUNCTION update_mention_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Mettre à jour les statistiques pour l'utilisateur mentionné
        INSERT INTO user_mention_stats (
            user_id, 
            date, 
            total_mentions_received, 
            unread_mentions,
            mentions_by_type,
            mentions_by_source
        )
        VALUES (
            NEW.mentioned_user_id,
            CURRENT_DATE,
            1,
            CASE WHEN NEW.status = 'pending' THEN 1 ELSE 0 END,
            jsonb_build_object(NEW.source_type, 1),
            jsonb_build_object(NEW.source_type, 1)
        )
        ON CONFLICT (user_id, date)
        DO UPDATE SET
            total_mentions_received = user_mention_stats.total_mentions_received + 1,
            unread_mentions = user_mention_stats.unread_mentions + CASE WHEN NEW.status = 'pending' THEN 1 ELSE 0 END,
            mentions_by_type = jsonb_set(
                user_mention_stats.mentions_by_type,
                array[NEW.source_type],
                COALESCE((user_mention_stats.mentions_by_type->>NEW.source_type)::int, 0) + 1
            ),
            mentions_by_source = jsonb_set(
                user_mention_stats.mentions_by_source,
                array[NEW.source_type],
                COALESCE((user_mention_stats.mentions_by_source->>NEW.source_type)::int, 0) + 1
            ),
            updated_at = NOW();

        -- Mettre à jour les statistiques pour l'utilisateur qui mentionne
        INSERT INTO user_mention_stats (
            user_id, 
            date, 
            total_mentions_sent,
            mentions_by_type,
            mentions_by_source
        )
        VALUES (
            NEW.mentioned_by_user_id,
            CURRENT_DATE,
            1,
            jsonb_build_object(NEW.source_type, 1),
            jsonb_build_object(NEW.source_type, 1)
        )
        ON CONFLICT (user_id, date)
        DO UPDATE SET
            total_mentions_sent = user_mention_stats.total_mentions_sent + 1,
            mentions_by_type = jsonb_set(
                user_mention_stats.mentions_by_type,
                array[NEW.source_type],
                COALESCE((user_mention_stats.mentions_by_type->>NEW.source_type)::int, 0) + 1
            ),
            mentions_by_source = jsonb_set(
                user_mention_stats.mentions_by_source,
                array[NEW.source_type],
                COALESCE((user_mention_stats.mentions_by_source->>NEW.source_type)::int, 0) + 1
            ),
            updated_at = NOW();
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Mettre à jour le compteur de mentions non lues
        IF OLD.status != NEW.status THEN
            IF OLD.status = 'pending' AND NEW.status = 'read' THEN
                UPDATE user_mention_stats
                SET 
                    unread_mentions = unread_mentions - 1,
                    updated_at = NOW()
                WHERE user_id = NEW.mentioned_user_id
                AND date = CURRENT_DATE;
            ELSIF OLD.status = 'read' AND NEW.status = 'pending' THEN
                UPDATE user_mention_stats
                SET 
                    unread_mentions = unread_mentions + 1,
                    updated_at = NOW()
                WHERE user_id = NEW.mentioned_user_id
                AND date = CURRENT_DATE;
            END IF;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
CREATE TRIGGER trigger_update_mention_stats
    AFTER INSERT OR UPDATE ON user_mentions
    FOR EACH ROW EXECUTE FUNCTION update_mention_stats();

-- Politiques RLS pour les mentions
ALTER TABLE user_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mentions where they are mentioned" ON user_mentions
    FOR SELECT USING (mentioned_user_id = auth.uid());

CREATE POLICY "Users can view mentions they created" ON user_mentions
    FOR SELECT USING (mentioned_by_user_id = auth.uid());

CREATE POLICY "Users can create mentions" ON user_mentions
    FOR INSERT WITH CHECK (mentioned_by_user_id = auth.uid());

CREATE POLICY "Users can update their own mentions" ON user_mentions
    FOR UPDATE USING (mentioned_by_user_id = auth.uid());

-- Politiques RLS pour les notifications
ALTER TABLE mention_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON mention_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON mention_notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Politiques RLS pour les statistiques
ALTER TABLE user_mention_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mention stats" ON user_mention_stats
    FOR SELECT USING (user_id = auth.uid());

-- Politiques RLS pour le cache de suggestions
ALTER TABLE mention_suggestions_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suggestion cache" ON mention_suggestions_cache
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own suggestion cache" ON mention_suggestions_cache
    FOR ALL USING (user_id = auth.uid());

-- Fonctions RPC pour les mentions d'utilisateurs

-- Fonction pour obtenir les statistiques des mentions
CREATE OR REPLACE FUNCTION get_mention_stats(p_user_id UUID)
RETURNS TABLE (
    total_mentions BIGINT,
    mentions_received BIGINT,
    mentions_sent BIGINT,
    unread_mentions BIGINT,
    mentions_by_type JSONB,
    mentions_by_category JSONB,
    top_mentioners JSONB,
    recent_mentions JSONB,
    mention_trends JSONB,
    response_rate FLOAT,
    avg_response_time FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COALESCE(SUM(total_mentions_received), 0) as total_received,
            COALESCE(SUM(total_mentions_sent), 0) as total_sent,
            COALESCE(SUM(unread_mentions), 0) as unread,
            jsonb_object_agg(source_type, type_count) as by_source_type
        FROM user_mention_stats
        WHERE user_id = p_user_id
    ),
    top_mentioners AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'userId', mentioned_by_user_id,
                'userName', mentioned_by_user_name,
                'count', mention_count
            )
        )
        FROM (
            SELECT 
                mentioned_by_user_id,
                mentioned_by_user_name,
                COUNT(*) as mention_count
            FROM user_mentions
            WHERE mentioned_user_id = p_user_id
            AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY mentioned_by_user_id, mentioned_by_user_name
            ORDER BY mention_count DESC
            LIMIT 10
        ) top_users
    ),
    recent_mentions AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', id,
                'sourceId', source_id,
                'sourceType', source_type,
                'mentionedByUserName', mentioned_by_user_name,
                'context', context,
                'status', status,
                'createdAt', created_at
            )
        )
        FROM user_mentions
        WHERE mentioned_user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 10
    ),
    mention_trends AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'date', date::text,
                'count', total_mentions_received
            )
        )
        FROM user_mention_stats
        WHERE user_id = p_user_id
        AND date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY date DESC
    ),
    response_metrics AS (
        SELECT 
            -- Calculer le taux de réponse (mentions lues / mentions reçues)
            CASE 
                WHEN stats.total_received > 0 THEN 
                    (stats.total_received - stats.unread)::FLOAT / stats.total_received
                ELSE 0
            END as response_rate,
            -- Calculer le temps moyen de réponse (en minutes)
            COALESCE(
                (
                    SELECT AVG(EXTRACT(EPOCH FROM (read_at - created_at)) / 60)
                    FROM user_mentions
                    WHERE mentioned_user_id = p_user_id
                    AND read_at IS NOT NULL
                    AND created_at >= NOW() - INTERVAL '30 days'
                ), 0
            ) as avg_response_time
        FROM stats
    )
    SELECT 
        stats.total_received as total_mentions,
        stats.total_received as mentions_received,
        stats.total_sent as mentions_sent,
        stats.unread as unread_mentions,
        stats.by_source_type as mentions_by_type,
        '{}' as mentions_by_category, -- À implémenter
        top_mentioners.top_mentioners,
        recent_mentions.recent_mentions,
        mention_trends.mention_trends,
        response_metrics.response_rate,
        response_metrics.avg_response_time
    FROM stats, top_mentioners, recent_mentions, mention_trends, response_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour rechercher des suggestions de mentions
CREATE OR REPLACE FUNCTION search_mention_suggestions(
    p_query TEXT,
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_include_inactive BOOLEAN DEFAULT false,
    p_context TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    userName VARCHAR(255),
    displayName VARCHAR(255),
    avatar TEXT,
    role VARCHAR(100),
    team VARCHAR(100),
    department VARCHAR(100),
    isActive BOOLEAN,
    lastActive TIMESTAMP WITH TIME ZONE,
    mentionCount BIGINT,
    relevanceScore FLOAT,
    priority TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_data AS (
        SELECT 
            p.id,
            p.username,
            p.display_name,
            p.avatar_url,
            p.role,
            p.team,
            p.department,
            p.is_active,
            p.last_seen,
            COALESCE(
                (SELECT COUNT(*) 
                FROM user_mentions um 
                WHERE um.mentioned_user_id = p.id
                AND um.created_at >= NOW() - INTERVAL '30 days'
                ), 0
            ) as mention_count
        FROM profiles p
        WHERE p.id != p_user_id
        AND (p_include_inactive OR p.is_active = true)
        AND (
            p.username ILIKE CONCAT('%', p_query, '%')
            OR p.display_name ILIKE CONCAT('%', p_query, '%')
        )
        LIMIT p_limit * 2 -- Récupérer plus pour le filtrage
    ),
    scored_users AS (
        SELECT 
            *,
            -- Calculer le score de pertinence
            CASE 
                WHEN LOWER(username) = LOWER(p_query) THEN 1.0
                WHEN LOWER(display_name) = LOWER(p_query) THEN 1.0
                WHEN username ILIKE CONCAT(p_query, '%') THEN 0.8
                WHEN display_name ILIKE CONCAT(p_query, '%') THEN 0.8
                WHEN username ILIKE CONCAT('%', p_query, '%') THEN 0.6
                WHEN display_name ILIKE CONCAT('%', p_query, '%') THEN 0.6
                ELSE 0.3
            END +
            CASE WHEN is_active THEN 0.2 ELSE 0 END +
            CASE 
                WHEN last_seen >= NOW() - INTERVAL '7 days' THEN 0.1
                WHEN last_seen >= NOW() - INTERVAL '30 days' THEN 0.05
                ELSE 0
            END +
            CASE 
                WHEN (team = p_context OR department = p_context) AND p_context IS NOT NULL THEN 0.15
                ELSE 0
            END +
            CASE 
                WHEN mention_count > 10 THEN 0.05
                WHEN mention_count > 5 THEN 0.03
                ELSE 0
            END as relevance_score
        FROM user_data
    )
    SELECT 
        id,
        username as userName,
        display_name as displayName,
        avatar_url as avatar,
        role,
        team,
        department,
        is_active as isActive,
        last_seen as lastActive,
        mention_count as mentionCount,
        relevance_score as relevanceScore,
        CASE 
            WHEN relevance_score > 0.8 THEN 'high'
            WHEN relevance_score > 0.5 THEN 'medium'
            ELSE 'low'
        END as priority
    FROM scored_users
    ORDER BY relevance_score DESC, is_active DESC, last_seen DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer les anciennes mentions
CREATE OR REPLACE FUNCTION cleanup_old_mentions(p_days_old INTEGER DEFAULT 365)
RETURNS TABLE (
    cleaned_mentions BIGINT,
    cleaned_notifications BIGINT,
    cleaned_stats BIGINT
) AS $$
DECLARE
    mentions_cleaned BIGINT;
    notifications_cleaned BIGINT;
    stats_cleaned BIGINT;
BEGIN
    -- Marquer comme lues et archivées les anciennes mentions
    UPDATE user_mentions
    SET 
        status = 'acknowledged',
        read_at = COALESCE(read_at, NOW())
    WHERE 
        created_at < NOW() - INTERVAL '1 day' * p_days_old
        AND status IN ('pending', 'read');
    
    GET DIAGNOSTICS mentions_cleaned = ROW_COUNT;
    
    -- Supprimer les anciennes notifications
    DELETE FROM mention_notifications
    WHERE 
        created_at < NOW() - INTERVAL '1 day' * p_days_old
        OR (expires_at IS NOT NULL AND expires_at < NOW());
    
    GET DIAGNOSTICS notifications_cleaned = ROW_COUNT;
    
    -- Nettoyer les anciennes statistiques
    DELETE FROM user_mention_stats
    WHERE date < CURRENT_DATE - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS stats_cleaned = ROW_COUNT;
    
    RETURN QUERY SELECT mentions_cleaned, notifications_cleaned, stats_cleaned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le cache de suggestions
CREATE OR REPLACE FUNCTION update_mention_suggestions_cache(
    p_query_hash VARCHAR(64),
    p_user_id UUID,
    p_suggestions JSONB,
    p_context JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO mention_suggestions_cache (
        query_hash,
        user_id,
        suggestions,
        context,
        expires_at
    )
    VALUES (
        p_query_hash,
        p_user_id,
        p_suggestions,
        p_context,
        NOW() + INTERVAL '1 hour' -- Cache d'une heure
    )
    ON CONFLICT (query_hash, user_id)
    DO UPDATE SET
        suggestions = p_suggestions,
        context = COALESCE(p_context, mention_suggestions_cache.context),
        expires_at = NOW() + INTERVAL '1 hour',
        hit_count = mention_suggestions_cache.hit_count + 1,
        last_hit_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les suggestions depuis le cache
CREATE OR REPLACE FUNCTION get_cached_mention_suggestions(
    p_query_hash VARCHAR(64),
    p_user_id UUID
)
RETURNS TABLE (
    suggestions JSONB,
    context JSONB,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        suggestions,
        context,
        expires_at > NOW() as is_valid
    FROM mention_suggestions_cache
    WHERE query_hash = p_query_hash
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires sur les tables
COMMENT ON TABLE user_mentions IS 'Mentions d\'utilisateurs avec contexte et notifications';
COMMENT ON TABLE mention_notifications IS 'Notifications pour les mentions avec canaux de livraison';
COMMENT ON TABLE user_mention_stats IS 'Statistiques quotidiennes des mentions par utilisateur';
COMMENT ON TABLE mention_suggestions_cache IS 'Cache pour les suggestions d\'auto-complétion des mentions';
COMMENT ON TABLE notification_delivery_logs IS 'Logs de livraison des notifications par canal';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN user_mentions.position IS 'Position du @ dans le texte original';
COMMENT ON COLUMN user_mentions.context IS 'Contexte autour de la mention pour la notification';
COMMENT ON COLUMN user_mentions.metadata IS 'Métadonnées {originalText, mentionType, urgency, category, etc.}';
COMMENT ON COLUMN mention_notifications.channels IS 'Canaux de livraison [in_app, email, push, slack, webhook]';
COMMENT ON COLUMN mention_notifications.data IS 'Données spécifiques {sourceId, sourceType, mentionedBy, actionUrl, etc.}';
COMMENT ON COLUMN user_mention_stats.response_rate IS 'Taux de réponse (mentions lues / mentions reçues)';
COMMENT ON COLUMN user_mention_stats.avg_response_time IS 'Temps moyen de réponse en minutes';

-- Créer une fonction pour nettoyer automatiquement les anciennes données
CREATE OR REPLACE FUNCTION schedule_cleanup_old_mentions()
RETURNS VOID AS $$
BEGIN
    PERFORM cleanup_old_mentions(365);
END;
$$ LANGUAGE plpgsql;
