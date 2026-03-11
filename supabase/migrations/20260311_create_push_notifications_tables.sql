-- Migration: Création des tables pour les notifications push (web push API)
-- Date: 11 mars 2026
-- Description: Tables pour gérer les abonnements push, notifications et campagnes

-- Table des abonnements push
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL DEFAULT '{}',
    user_agent TEXT,
    platform VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(endpoint)
);

-- Table des notifications push
CREATE TABLE IF NOT EXISTS push_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    icon TEXT,
    image TEXT,
    badge TEXT,
    tag VARCHAR(100),
    data JSONB DEFAULT '{}',
    actions JSONB DEFAULT '[]',
    require_interaction BOOLEAN DEFAULT false,
    silent BOOLEAN DEFAULT false,
    urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('very-low', 'low', 'normal', 'high')),
    ttl INTEGER DEFAULT 3600, -- en secondes
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    category VARCHAR(100),
    priority INTEGER DEFAULT 50,
    metadata JSONB DEFAULT '{}'
);

-- Table des campagnes de notifications
CREATE TABLE IF NOT EXISTS push_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    target_audience JSONB DEFAULT '{}',
    content JSONB DEFAULT '{}',
    schedule JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'failed')),
    statistics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Table des livraisons de notifications
CREATE TABLE IF NOT EXISTS push_notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES push_notifications(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'clicked', 'dismissed', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    response_time INTEGER, -- en secondes
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des catégories de notifications
CREATE TABLE IF NOT EXISTS notification_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    default_enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 50,
    sound TEXT,
    vibration_pattern JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des préférences de notifications utilisateur
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES notification_categories(id) ON DELETE SET NULL,
    enabled BOOLEAN DEFAULT true,
    quiet_hours JSONB DEFAULT '{}',
    frequency VARCHAR(20) DEFAULT 'realtime' CHECK (frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'never')),
    sound BOOLEAN DEFAULT true,
    vibration BOOLEAN DEFAULT true,
    badge BOOLEAN DEFAULT true,
    desktop BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id)
);

-- Table des événements de notifications
CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES push_notifications(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('sent', 'delivered', 'clicked', 'dismissed', 'expired', 'error')),
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Index pour les performances
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX idx_push_subscriptions_platform ON push_subscriptions(platform);
CREATE INDEX idx_push_subscriptions_is_active ON push_subscriptions(is_active);
CREATE INDEX idx_push_subscriptions_created_at ON push_subscriptions(created_at DESC);
CREATE INDEX idx_push_subscriptions_last_used_at ON push_subscriptions(last_used_at DESC);

CREATE INDEX idx_push_notifications_timestamp ON push_notifications(timestamp DESC);
CREATE INDEX idx_push_notifications_category ON push_notifications(category);
CREATE INDEX idx_push_notifications_priority ON push_notifications(priority DESC);
CREATE INDEX idx_push_notifications_tag ON push_notifications(tag);
CREATE INDEX idx_push_notifications_expires_at ON push_notifications(expires_at);

CREATE INDEX idx_push_campaigns_status ON push_campaigns(status);
CREATE INDEX idx_push_campaigns_category ON push_campaigns(category);
CREATE INDEX idx_push_campaigns_created_at ON push_campaigns(created_at DESC);
CREATE INDEX idx_push_campaigns_created_by ON push_campaigns(created_by);

CREATE INDEX idx_push_notification_deliveries_notification_id ON push_notification_deliveries(notification_id);
CREATE INDEX idx_push_notification_deliveries_subscription_id ON push_notification_deliveries(subscription_id);
CREATE INDEX idx_push_notification_deliveries_user_id ON push_notification_deliveries(user_id);
CREATE INDEX idx_push_notification_deliveries_status ON push_notification_deliveries(status);
CREATE INDEX idx_push_notification_deliveries_sent_at ON push_notification_deliveries(sent_at DESC);
CREATE INDEX idx_push_notification_deliveries_delivered_at ON push_notification_deliveries(delivered_at DESC);
CREATE INDEX idx_push_notification_deliveries_clicked_at ON push_notification_deliveries(clicked_at DESC);

CREATE INDEX idx_notification_categories_name ON notification_categories(name);
CREATE INDEX idx_notification_categories_is_active ON notification_categories(is_active);
CREATE INDEX idx_notification_categories_priority ON notification_categories(priority);

CREATE INDEX idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX idx_user_notification_preferences_category_id ON user_notification_preferences(category_id);
CREATE INDEX idx_user_notification_preferences_enabled ON user_notification_preferences(enabled);
CREATE INDEX idx_user_notification_preferences_frequency ON user_notification_preferences(frequency);

CREATE INDEX idx_notification_events_notification_id ON notification_events(notification_id);
CREATE INDEX idx_notification_events_subscription_id ON notification_events(subscription_id);
CREATE INDEX idx_notification_events_user_id ON notification_events(user_id);
CREATE INDEX idx_notification_events_event_type ON notification_events(event_type);
CREATE INDEX idx_notification_events_timestamp ON notification_events(timestamp DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_push_subscriptions_updated_at 
    BEFORE UPDATE ON push_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_campaigns_updated_at 
    BEFORE UPDATE ON push_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_categories_updated_at 
    BEFORE UPDATE ON notification_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at 
    BEFORE UPDATE ON user_notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour last_used_at lors de l'utilisation
CREATE OR REPLACE FUNCTION update_subscription_last_used()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE push_subscriptions
    SET last_used_at = NOW()
    WHERE id = NEW.subscription_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_last_used
    AFTER INSERT ON push_notification_deliveries
    FOR EACH ROW EXECUTE FUNCTION update_subscription_last_used();

-- Politiques RLS pour les abonnements push
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les notifications push
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view push notifications" ON push_notifications
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage push notifications" ON push_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les campagnes
ALTER TABLE push_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view push campaigns" ON push_campaigns
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage push campaigns" ON push_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les livraisons
ALTER TABLE push_notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification deliveries" ON push_notification_deliveries
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notification deliveries" ON push_notification_deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les catégories
ALTER TABLE notification_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active notification categories" ON notification_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view category details" ON notification_categories
    FOR SELECT USING (true);

-- Politiques RLS pour les préférences utilisateur
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences" ON user_notification_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own notification preferences" ON user_notification_preferences
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les événements
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification events" ON notification_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notification events" ON notification_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour les notifications push

-- Fonction pour obtenir les statistiques des notifications push
CREATE OR REPLACE FUNCTION get_push_notification_stats()
RETURNS TABLE (
    total_subscriptions BIGINT,
    active_subscriptions BIGINT,
    subscriptions_by_platform JSONB,
    subscriptions_by_category JSONB,
    delivery_stats JSONB,
    campaign_stats JSONB,
    user_engagement JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH subscription_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_active = true) as active
        FROM push_subscriptions
    ),
    platform_distribution AS (
        SELECT jsonb_object_agg(platform, platform_count)
        FROM (
            SELECT 
                platform,
                COUNT(*) as platform_count
            FROM push_subscriptions
            WHERE is_active = true
            GROUP BY platform
        ) dist
    ),
    category_distribution AS (
        SELECT jsonb_object_agg(name, user_count)
        FROM (
            SELECT 
                nc.name,
            COUNT(DISTINCT unp.user_id) as user_count
            FROM notification_categories nc
            LEFT JOIN user_notification_preferences unp ON nc.id = unp.category_id
            WHERE nc.is_active = true
            AND unp.enabled = true
            GROUP BY nc.name
        ) cat_dist
    ),
    delivery_stats AS (
        SELECT jsonb_build_object(
            'totalSent', COUNT(*) FILTER (WHERE status = 'sent'),
            'totalDelivered', COUNT(*) FILTER (WHERE status = 'delivered'),
            'totalClicked', COUNT(*) FILTER (WHERE status = 'clicked'),
            'totalDismissed', COUNT(*) FILTER (WHERE status = 'dismissed'),
            'deliveryRate', COUNT(*) FILTER (WHERE status = 'delivered')::DECIMAL / NULLIF(COUNT(*), 0) * 100,
            'clickRate', COUNT(*) FILTER (WHERE status = 'clicked')::DECIMAL / NULLIF(COUNT(*), 0) * 100,
            'averageResponseTime', COALESCE(AVG(response_time), 0)
        )
        FROM push_notification_deliveries
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    ),
    campaign_stats AS (
        SELECT jsonb_build_object(
            'totalCampaigns', COUNT(*),
            'activeCampaigns', COUNT(*) FILTER (WHERE status = 'sending'),
            'completedCampaigns', COUNT(*) FILTER (WHERE status = 'sent'),
            'averageCampaignPerformance', COALESCE(
                (statistics->>'clickRate')::DECIMAL, 0
            )
        )
        FROM push_campaigns
    ),
    user_engagement_stats AS (
        SELECT jsonb_build_object(
            'totalUsers', COUNT(DISTINCT user_id),
            'activeUsers', COUNT(DISTINCT user_id) FILTER (WHERE last_used_at >= CURRENT_DATE - INTERVAL '7 days'),
            'averageNotificationsPerUser', COALESCE(AVG(notification_count), 0),
            'optInRate', COUNT(DISTINCT user_id)::DECIMAL / NULLIF((SELECT COUNT(*) FROM profiles), 0) * 100,
            'optOutRate', COUNT(*) FILTER (WHERE is_active = false)::DECIMAL / NULLIF(COUNT(*), 0) * 100
        )
        FROM (
            SELECT 
                user_id,
                is_active,
                last_used_at,
                COUNT(*) as notification_count
            FROM push_subscriptions
            GROUP BY user_id, is_active, last_used_at
        ) user_stats
    )
    SELECT 
        ss.total as total_subscriptions,
        ss.active as active_subscriptions,
        pd.platform_distribution as subscriptions_by_platform,
        cd.category_distribution as subscriptions_by_category,
        ds.delivery_stats as delivery_stats,
        cs.campaign_stats as campaign_stats,
        ue.user_engagement_stats as user_engagement
    FROM subscription_stats ss, platform_distribution pd, category_distribution cd,
         delivery_stats ds, campaign_stats cs, user_engagement_stats ue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les catégories de notifications par défaut
CREATE OR REPLACE FUNCTION create_default_notification_categories()
RETURNS VOID AS $$
BEGIN
    INSERT INTO notification_categories (name, display_name, description, icon, color, is_system, default_enabled, priority)
    VALUES 
        ('general', 'Général', 'Notifications générales et système', 'bell', '#3B82F6', true, true, 10),
        ('documents', 'Documents', 'Notifications relatives aux documents', 'document', '#10B981', true, true, 20),
        ('collaboration', 'Collaboration', 'Notifications de collaboration et partage', 'users', '#8B5CF6', true, true, 30),
        ('messages', 'Messages', 'Notifications de messagerie et chat', 'message', '#EC4899', true, true, 40),
        ('reminders', 'Rappels', 'Notifications de rappel et planning', 'calendar', '#F59E0B', true, true, 50),
        ('security', 'Sécurité', 'Notifications de sécurité et authentification', 'shield', '#EF4444', true, true, 60),
        ('updates', 'Mises à jour', 'Notifications de mises à jour et nouvelles fonctionnalités', 'refresh', '#6B7280', true, true, 70),
        ('marketing', 'Marketing', 'Notifications marketing et promotionnelles', 'megaphone', '#F97316', true, false, 80)
    ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les préférences par défaut
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS VOID AS $$
BEGIN
    -- Créer les préférences pour tous les utilisateurs existants
    INSERT INTO user_notification_preferences (user_id, category_id, enabled, frequency, sound, vibration, badge, desktop)
    SELECT 
        p.id as user_id,
        nc.id as category_id,
        true as enabled,
        'realtime' as frequency,
        true as sound,
        true as vibration,
        true as badge,
        true as desktop
    FROM profiles p
    CROSS JOIN notification_categories nc
    WHERE nc.is_system = true
    AND nc.default_enabled = true
    AND NOT EXISTS (
        SELECT 1 FROM user_notification_preferences unp
        WHERE unp.user_id = p.id
        AND unp.category_id = nc.id
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciennes notifications
CREATE OR REPLACE FUNCTION cleanup_old_push_notifications(p_days_old INTEGER DEFAULT 90)
RETURNS TABLE (
    cleaned_notifications BIGINT,
    cleaned_deliveries BIGINT,
    cleaned_events BIGINT
) AS $$
DECLARE
    cleaned_notifications_count BIGINT;
    cleaned_deliveries_count BIGINT;
    cleaned_events_count BIGINT;
BEGIN
    -- Nettoyer les anciennes notifications
    DELETE FROM push_notifications
    WHERE timestamp < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cleaned_notifications_count = ROW_COUNT;
    
    -- Nettoyer les anciennes livraisons
    DELETE FROM push_notification_deliveries
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cleaned_deliveries_count = ROW_COUNT;
    
    -- Nettoyer les anciens événements
    DELETE FROM notification_events
    WHERE timestamp < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS cleaned_events_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_notifications_count, cleaned_deliveries_count, cleaned_events_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les statistiques des campagnes
CREATE OR REPLACE FUNCTION update_campaign_statistics(p_campaign_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE push_campaigns
    SET statistics = jsonb_build_object(
        'totalRecipients', (
            SELECT COUNT(DISTINCT user_id)
            FROM push_notification_deliveries pnd
            JOIN push_notifications pn ON pnd.notification_id = pn.id
            WHERE pn.data->>'campaignId' = p_campaign_id::text
        ),
        'totalSent', (
            SELECT COUNT(*)
            FROM push_notification_deliveries pnd
            JOIN push_notifications pn ON pnd.notification_id = pn.id
            WHERE pn.data->>'campaignId' = p_campaign_id::text
        ),
        'totalDelivered', (
            SELECT COUNT(*)
            FROM push_notification_deliveries pnd
            JOIN push_notifications pn ON pnd.notification_id = pn.id
            WHERE pn.data->>'campaignId' = p_campaign_id::text
            AND pnd.status = 'delivered'
        ),
        'totalClicked', (
            SELECT COUNT(*)
            FROM push_notification_deliveries pnd
            JOIN push_notifications pn ON pnd.notification_id = pn.id
            WHERE pn.data->>'campaignId' = p_campaign_id::text
            AND pnd.status = 'clicked'
        ),
        'totalDismissed', (
            SELECT COUNT(*)
            FROM push_notification_deliveries pnd
            JOIN push_notifications pn ON pnd.notification_id = pn.id
            WHERE pn.data->>'campaignId' = p_campaign_id::text
            AND pnd.status = 'dismissed'
        ),
        'clickRate', (
            SELECT COUNT(*) FILTER (WHERE status = 'clicked')::DECIMAL / NULLIF(COUNT(*), 0) * 100
            FROM push_notification_deliveries pnd
            JOIN push_notifications pn ON pnd.notification_id = pn.id
            WHERE pn.data->>'campaignId' = p_campaign_id::text
        ),
        'deliveryRate', (
            SELECT COUNT(*) FILTER (WHERE status = 'delivered')::DECIMAL / NULLIF(COUNT(*), 0) * 100
            FROM push_notification_deliveries pnd
            JOIN push_notifications pn ON pnd.notification_id = pn.id
            WHERE pn.data->>'campaignId' = p_campaign_id::text
        ),
        'averageResponseTime', (
            SELECT COALESCE(AVG(response_time), 0)
            FROM push_notification_deliveries pnd
            JOIN push_notifications pn ON pnd.notification_id = pn.id
            WHERE pn.data->>'campaignId' = p_campaign_id::text
            AND pnd.clicked_at IS NOT NULL
        )
    )
    WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE push_subscriptions IS 'Abonnements des utilisateurs aux notifications push';
COMMENT ON TABLE push_notifications IS 'Notifications push envoyées aux utilisateurs';
COMMENT ON TABLE push_campaigns IS 'Campagnes de notifications push groupées';
COMMENT ON TABLE push_notification_deliveries IS 'Suivi des livraisons de notifications push';
COMMENT ON TABLE notification_categories IS 'Catégories pour organiser les notifications';
COMMENT ON TABLE user_notification_preferences IS 'Préférences de notifications des utilisateurs';
COMMENT ON TABLE notification_events IS 'Événements de notifications pour le suivi';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN push_subscriptions.keys IS 'Clés VAPID pour l\'abonnement push';
COMMENT ON COLUMN push_subscriptions.metadata IS 'Métadonnées de l\'abonnement {deviceInfo, browserInfo, preferences, statistics}';
COMMENT ON COLUMN push_notifications.actions IS 'Actions possibles dans la notification';
COMMENT ON COLUMN push_notifications.urgency IS 'Niveau d\'urgence pour la livraison';
COMMENT ON COLUMN push_campaigns.target_audience IS 'Audience cible de la campagne';
COMMENT ON COLUMN push_campaigns.content IS 'Contenu de la campagne avec personnalisations';
COMMENT ON COLUMN push_campaigns.statistics IS 'Statistiques de performance de la campagne';
COMMENT ON COLUMN push_notification_deliveries.response_time IS 'Temps de réponse entre livraison et clic';
COMMENT ON COLUMN notification_categories.vibration_pattern IS 'Pattern de vibration pour la catégorie';
COMMENT ON COLUMN user_notification_preferences.quiet_hours IS 'Heures de silence pour l\'utilisateur';

-- Créer les données par défaut
SELECT create_default_notification_categories();
