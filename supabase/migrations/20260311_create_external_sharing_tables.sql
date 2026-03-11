-- Migration: Création des tables pour le partage externe (liens publics)
-- Date: 11 mars 2026
-- Description: Tables pour gérer les liens de partage publics avec contrôle d'accès

-- Table des liens de partage
CREATE TABLE IF NOT EXISTS share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_id UUID NOT NULL,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('document', 'note', 'conversation', 'flashcard', 'quiz', 'collection', 'folder')),
    token VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    max_views INTEGER,
    current_views INTEGER DEFAULT 0,
    permissions JSONB NOT NULL DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_accessed TIMESTAMP WITH TIME ZONE
);

-- Table des logs d'accès aux partages
CREATE TABLE IF NOT EXISTS share_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(2),
    city VARCHAR(100),
    duration INTEGER, -- en secondes
    downloaded BOOLEAN DEFAULT false,
    actions JSONB DEFAULT '[]', -- liste des actions effectuées
    session_id VARCHAR(255)
);

-- Table des statistiques de partage
CREATE TABLE IF NOT EXISTS share_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    avg_duration INTEGER DEFAULT 0, -- en secondes
    countries JSONB DEFAULT '{}', -- {country: count}
    referrers JSONB DEFAULT '{}', -- {referrer: count}
    devices JSONB DEFAULT '{}', -- {device: count}
    browsers JSONB DEFAULT '{}', -- {browser: count}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_share_links_created_by ON share_links(created_by);
CREATE INDEX idx_share_links_target_id ON share_links(target_id);
CREATE INDEX idx_share_links_target_type ON share_links(target_type);
CREATE INDEX idx_share_links_token ON share_links(token);
CREATE INDEX idx_share_links_is_active ON share_links(is_active);
CREATE INDEX idx_share_links_expires_at ON share_links(expires_at);
CREATE INDEX idx_share_links_created_at ON share_links(created_at DESC);
CREATE INDEX idx_share_links_last_accessed ON share_links(last_accessed DESC);
CREATE INDEX idx_share_links_title ON share_links USING gin(to_tsvector('french', title));

CREATE INDEX idx_share_access_logs_share_id ON share_access_logs(share_id);
CREATE INDEX idx_share_access_logs_accessed_at ON share_access_logs(accessed_at DESC);
CREATE INDEX idx_share_access_logs_ip_address ON share_access_logs(ip_address);
CREATE INDEX idx_share_access_logs_country ON share_access_logs(country);
CREATE INDEX idx_share_access_logs_session_id ON share_access_logs(session_id);

CREATE INDEX idx_share_analytics_share_id ON share_analytics(share_id);
CREATE INDEX idx_share_analytics_date ON share_analytics(date);
CREATE INDEX idx_share_analytics_views ON share_analytics(views DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_share_links_updated_at 
    BEFORE UPDATE ON share_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_share_analytics_updated_at 
    BEFORE UPDATE ON share_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS pour les liens de partage
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own share links" ON share_links
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create own share links" ON share_links
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own share links" ON share_links
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own share links" ON share_links
    FOR DELETE USING (created_by = auth.uid());

-- Politiques RLS pour les logs d'accès
ALTER TABLE share_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own share access logs" ON share_access_logs
    FOR SELECT USING (
        share_id IN (
            SELECT id FROM share_links WHERE created_by = auth.uid()
        )
    );

-- Politiques RLS pour les analytics
ALTER TABLE share_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own share analytics" ON share_analytics
    FOR SELECT USING (
        share_id IN (
            SELECT id FROM share_links WHERE created_by = auth.uid()
        )
    );

-- Fonctions RPC pour le partage externe

-- Fonction pour incrémenter le compteur de vues
CREATE OR REPLACE FUNCTION increment_share_views(share_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE share_links 
    SET 
        current_views = current_views + 1,
        last_accessed = NOW(),
        updated_at = NOW()
    WHERE id = share_id;
    
    -- Mettre à jour les analytics quotidiens
    INSERT INTO share_analytics (share_id, date, views, unique_views)
    VALUES (share_id, CURRENT_DATE, 1, 1)
    ON CONFLICT (share_id, date)
    DO UPDATE SET
        views = share_analytics.views + 1,
        unique_views = share_analytics.unique_views + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour logger une action de partage
CREATE OR REPLACE FUNCTION log_share_action(
    p_share_id UUID,
    p_action_type TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    -- Ajouter l'action au dernier log d'accès
    UPDATE share_access_logs
    SET actions = actions || jsonb_build_object(
        'type', p_action_type,
        'timestamp', NOW(),
        'metadata', p_metadata
    )
    WHERE id = (
        SELECT id 
        FROM share_access_logs 
        WHERE share_id = p_share_id 
        ORDER BY accessed_at DESC 
        LIMIT 1
    );
    
    -- Mettre à jour les analytics selon le type d'action
    IF p_action_type = 'download' THEN
        UPDATE share_access_logs
        SET downloaded = true
        WHERE id = (
            SELECT id 
            FROM share_access_logs 
            WHERE share_id = p_share_id 
            ORDER BY accessed_at DESC 
            LIMIT 1
        );
        
        UPDATE share_analytics
        SET downloads = downloads + 1
        WHERE share_id = p_share_id AND date = CURRENT_DATE;
        
    ELSIF p_action_type = 'comment' THEN
        UPDATE share_analytics
        SET comments = comments + 1
        WHERE share_id = p_share_id AND date = CURRENT_DATE;
        
    ELSIF p_action_type = 'share' THEN
        UPDATE share_analytics
        SET shares = shares + 1
        WHERE share_id = p_share_id AND date = CURRENT_DATE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les analytics d'un partage
CREATE OR REPLACE FUNCTION get_share_analytics(p_share_id UUID)
RETURNS TABLE (
    total_views BIGINT,
    unique_views BIGINT,
    total_downloads BIGINT,
    total_comments BIGINT,
    total_shares BIGINT,
    avg_duration FLOAT,
    top_countries JSONB,
    top_referrers JSONB,
    daily_views JSONB,
    hourly_views JSONB,
    device_breakdown JSONB,
    browser_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Statistiques totales
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(SUM(unique_views), 0) as unique_views,
        COALESCE(SUM(downloads), 0) as total_downloads,
        COALESCE(SUM(comments), 0) as total_comments,
        COALESCE(SUM(shares), 0) as total_shares,
        COALESCE(AVG(avg_duration), 0) as avg_duration,
        
        -- Top pays
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'country', country_key,
                    'views', country_value
                )
            )
            FROM (
                SELECT 
                    key as country_key,
                    value as country_value
                FROM jsonb_each_text(
                    (
                        SELECT jsonb_object_agg(country, country_count) 
                        FROM (
                            SELECT country, COUNT(*) as country_count
                            FROM share_access_logs
                            WHERE share_id = p_share_id
                            AND country IS NOT NULL
                            GROUP BY country
                            ORDER BY country_count DESC
                            LIMIT 10
                        ) country_stats
                    )
                )
            ) top_countries
        ) as top_countries,
        
        -- Top referrers
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'referrer', referrer_key,
                    'views', referrer_value
                )
            )
            FROM (
                SELECT 
                    key as referrer_key,
                    value as referrer_value
                FROM jsonb_each_text(
                    (
                        SELECT jsonb_object_agg(referrer, referrer_count) 
                        FROM (
                            SELECT referrer, COUNT(*) as referrer_count
                            FROM share_access_logs
                            WHERE share_id = p_share_id
                            AND referrer IS NOT NULL
                            GROUP BY referrer
                            ORDER BY referrer_count DESC
                            LIMIT 10
                        ) referrer_stats
                    )
                )
            ) top_referrers
        ) as top_referrers,
        
        -- Vues quotidiennes (30 derniers jours)
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', date,
                    'views', views
                )
            )
            FROM (
                SELECT 
                    date::text as date,
                    views
                FROM share_analytics
                WHERE share_id = p_share_id
                AND date >= CURRENT_DATE - INTERVAL '30 days'
                ORDER BY date DESC
            ) daily_stats
        ) as daily_views,
        
        -- Vues horaires
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'hour', hour,
                    'views', views
                )
            )
            FROM (
                SELECT 
                    EXTRACT(HOUR FROM accessed_at) as hour,
                    COUNT(*) as views
                FROM share_access_logs
                WHERE share_id = p_share_id
                AND accessed_at >= CURRENT_DATE - INTERVAL '7 days'
                GROUP BY EXTRACT(HOUR FROM accessed_at)
                ORDER BY hour
            ) hourly_stats
        ) as hourly_views,
        
        -- Breakdown par device
        (
            SELECT jsonb_object_agg(device, device_count)
            FROM (
                SELECT 
                    CASE 
                        WHEN user_agent ILIKE '%mobile%' THEN 'mobile'
                        WHEN user_agent ILIKE '%tablet%' THEN 'tablet'
                        ELSE 'desktop'
                    END as device,
                    COUNT(*) as device_count
                FROM share_access_logs
                WHERE share_id = p_share_id
                GROUP BY device
            ) device_stats
        ) as device_breakdown,
        
        -- Breakdown par navigateur
        (
            SELECT jsonb_object_agg(browser, browser_count)
            FROM (
                SELECT 
                    CASE 
                        WHEN user_agent ILIKE '%chrome%' THEN 'chrome'
                        WHEN user_agent ILIKE '%firefox%' THEN 'firefox'
                        WHEN user_agent ILIKE '%safari%' THEN 'safari'
                        WHEN user_agent ILIKE '%edge%' THEN 'edge'
                        ELSE 'other'
                    END as browser,
                    COUNT(*) as browser_count
                FROM share_access_logs
                WHERE share_id = p_share_id
                GROUP BY browser
            ) browser_stats
        ) as browser_breakdown
    FROM share_analytics
    WHERE share_id = p_share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer les liens expirés
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS TABLE (
    cleaned_count BIGINT
) AS $$
DECLARE
    expired_count BIGINT;
BEGIN
    -- Désactiver les liens expirés
    UPDATE share_links
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Désactiver les liens ayant atteint leur limite de vues
    UPDATE share_links
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true
    AND max_views IS NOT NULL
    AND current_views >= max_views;
    
    GET DIAGNOSTICS expired_count = expired_count + ROW_COUNT;
    
    RETURN QUERY SELECT expired_count as cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour générer des statistiques globales
CREATE OR REPLACE FUNCTION get_global_sharing_stats(p_user_id UUID)
RETURNS TABLE (
    total_shares BIGINT,
    active_shares BIGINT,
    total_views BIGINT,
    total_downloads BIGINT,
    most_viewed_share JSONB,
    recent_shares JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_shares,
        COUNT(*) FILTER (WHERE is_active = true) as active_shares,
        COALESCE(SUM(current_views), 0) as total_views,
        COALESCE(
            (
                SELECT SUM(downloads)
                FROM share_analytics sa
                JOIN share_links sl ON sa.share_id = sl.id
                WHERE sl.created_by = p_user_id
            ), 0
        ) as total_downloads,
        (
            SELECT jsonb_build_object(
                'id', id,
                'title', title,
                'views', current_views,
                'target_type', target_type
            )
            FROM share_links
            WHERE created_by = p_user_id
            ORDER BY current_views DESC
            LIMIT 1
        ) as most_viewed_share,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'title', title,
                    'created_at', created_at,
                    'target_type', target_type,
                    'current_views', current_views
                )
            )
            FROM share_links
            WHERE created_by = p_user_id
            ORDER BY created_at DESC
            LIMIT 5
        ) as recent_shares
    FROM share_links
    WHERE created_by = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un partage est accessible
CREATE OR REPLACE FUNCTION is_share_accessible(p_token TEXT)
RETURNS TABLE (
    accessible BOOLEAN,
    reason TEXT,
    share_id UUID
) AS $$
DECLARE
    share_record RECORD;
BEGIN
    -- Récupérer le lien de partage
    SELECT * INTO share_record
    FROM share_links
    WHERE token = p_token
    AND is_active = true;
    
    -- Si le lien n'existe pas
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Lien non trouvé ou désactivé', NULL::UUID;
        RETURN;
    END IF;
    
    -- Vérifier si le lien a expiré
    IF share_record.expires_at IS NOT NULL AND share_record.expires_at < NOW() THEN
        RETURN QUERY SELECT false, 'Lien expiré', share_record.id;
        RETURN;
    END IF;
    
    -- Vérifier si la limite de vues est atteinte
    IF share_record.max_views IS NOT NULL AND share_record.current_views >= share_record.max_views THEN
        RETURN QUERY SELECT false, 'Limite de vues atteinte', share_record.id;
        RETURN;
    END IF;
    
    -- Le lien est accessible
    RETURN QUERY SELECT true, 'Accessible', share_record.id;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour les analytics quotidiens
CREATE OR REPLACE FUNCTION update_share_analytics_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les analytics quotidiens lors de l'accès
    IF TG_OP = 'INSERT' THEN
        PERFORM increment_share_views(NEW.share_id);
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
CREATE TRIGGER update_share_analytics_on_access
    AFTER INSERT ON share_access_logs
    FOR EACH ROW EXECUTE FUNCTION update_share_analytics_trigger();

-- Commentaires sur les tables
COMMENT ON TABLE share_links IS 'Liens de partage publics avec contrôle d\'accès et permissions';
COMMENT ON TABLE share_access_logs IS 'Logs détaillés des accès aux partages avec géolocalisation';
COMMENT ON TABLE share_analytics IS 'Statistiques agrégées des partages par jour';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN share_links.token IS 'Token unique pour accéder au partage';
COMMENT ON COLUMN share_links.permissions IS 'Permissions du partage (view, download, comment, etc.)';
COMMENT ON COLUMN share_links.settings IS 'Paramètres d\'affichage du partage (thème, watermark, etc.)';
COMMENT ON COLUMN share_links.current_views IS 'Nombre de fois que le partage a été consulté';
COMMENT ON COLUMN share_links.max_views IS 'Limite maximale de vues autorisées';
COMMENT ON COLUMN share_access_logs.duration IS 'Durée de la session en secondes';
COMMENT ON COLUMN share_access_logs.actions IS 'Actions effectuées pendant la session (view, download, etc.)';

-- Créer une fonction pour nettoyer automatiquement les liens expirés
CREATE OR REPLACE FUNCTION schedule_cleanup_expired_shares()
RETURNS VOID AS $$
BEGIN
    PERFORM cleanup_expired_shares();
END;
$$ LANGUAGE plpgsql;
