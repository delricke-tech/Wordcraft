-- Migration: Création des tables pour le partage de conversations (liens publics)
-- Date: 11 mars 2026
-- Description: Tables pour gérer le partage des conversations via des liens publics

-- Table principale des partages de conversations
CREATE TABLE IF NOT EXISTS conversation_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    share_token VARCHAR(32) NOT NULL UNIQUE,
    share_url TEXT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}', -- {allowAnonymous, requirePassword, requireEmail, allowDownload, allowCopy, allowPrint, allowShare, allowComments, allowRating, showMetadata, showTimestamps, showUsernames, showDocuments, showCitations, watermark, branding, customCSS, customHeader, customFooter, theme, language, timezone}
    permissions JSONB DEFAULT '{}', -- {canView, canDownload, canCopy, canPrint, canShare, canComment, canRate, canEdit, canDelete, canExport, canPrintPDF, canViewAnalytics, canManageAccess}
    metadata JSONB DEFAULT '{}', -- {originalConversationTitle, originalConversationLength, messageCount, wordCount, characterCount, documentCount, citationCount, averageResponseTime, totalProcessingTime, modelUsed, language, topics, sentiment, complexity, tags, category, subcategory, customFields}
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'revoked', 'suspended', 'deleted')),
    expires_at TIMESTAMP WITH TIME ZONE,
    password VARCHAR(255),
    access_code VARCHAR(10),
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des logs d'accès aux partages
CREATE TABLE IF NOT EXISTS share_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID REFERENCES conversation_shares(id) ON DELETE CASCADE,
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('view', 'download', 'copy', 'print', 'share', 'comment', 'rate')),
    ip_address INET,
    user_agent TEXT,
    location JSONB DEFAULT '{}', -- {country, region, city, latitude, longitude, timezone}
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration INTEGER, -- en secondes
    referrer TEXT,
    session_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    email VARCHAR(255),
    metadata JSONB DEFAULT '{}'
);

-- Table des analytics des partages
CREATE TABLE IF NOT EXISTS share_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID REFERENCES conversation_shares(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    total_downloads INTEGER DEFAULT 0,
    unique_downloads INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    unique_shares INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5),
    average_duration INTEGER DEFAULT 0, -- en secondes
    bounce_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (bounce_rate >= 0 AND bounce_rate <= 100),
    conversion_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (conversion_rate >= 0 AND conversion_rate <= 100),
    top_countries JSONB DEFAULT '{}',
    top_referrers JSONB DEFAULT '{}',
    top_devices JSONB DEFAULT '{}',
    top_browsers JSONB DEFAULT '{}',
    hourly_views INTEGER[] DEFAULT ARRAY_FILL(0, ARRAY[24]),
    daily_views INTEGER[] DEFAULT ARRAY_FILL(0, ARRAY[30]),
    weekly_views INTEGER[] DEFAULT ARRAY_FILL(0, ARRAY[52]),
    monthly_views INTEGER[] DEFAULT ARRAY_FILL(0, ARRAY[12]),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(share_id, date)
);

-- Table des commentaires sur les partages
CREATE TABLE IF NOT EXISTS share_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID REFERENCES conversation_shares(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES share_comments(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255),
    author_website TEXT,
    content TEXT NOT NULL,
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_approved BOOLEAN DEFAULT true,
    is_spam BOOLEAN DEFAULT false,
    replies JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des évaluations des partages
CREATE TABLE IF NOT EXISTS share_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID REFERENCES conversation_shares(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    author_name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255),
    helpful_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des templates de partage
CREATE TABLE IF NOT EXISTS share_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB NOT NULL,
    permissions JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exports d'analytics
CREATE TABLE IF NOT EXISTS share_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID REFERENCES conversation_shares(id) ON DELETE CASCADE,
    format VARCHAR(10) NOT NULL CHECK (format IN ('json', 'csv', 'pdf', 'xlsx')),
    options JSONB DEFAULT '{}', -- {includeAnalytics, includeComments, includeRatings, includeAccessLogs, dateRange, filters, format}
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT DEFAULT 0,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des statistiques globales de partage
CREATE TABLE IF NOT EXISTS conversation_sharing_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_shares INTEGER DEFAULT 0,
    active_shares INTEGER DEFAULT 0,
    expired_shares INTEGER DEFAULT 0,
    revoked_shares INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    total_downloads INTEGER DEFAULT 0,
    total_shares_generated INTEGER DEFAULT 0,
    average_views_per_share DECIMAL(10,2) DEFAULT 0.00,
    average_duration INTEGER DEFAULT 0, -- en secondes
    conversion_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (conversion_rate >= 0 AND conversion_rate <= 100),
    top_countries JSONB DEFAULT '{}',
    top_languages JSONB DEFAULT '{}',
    top_categories JSONB DEFAULT '{}',
    share_trends JSONB DEFAULT '{}', -- {daily, weekly, monthly}
    user_activity JSONB DEFAULT '{}', -- {totalUsers, activeUsers, averageSharesPerUser, mostActiveUser, userGrowth}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Index pour les performances
CREATE INDEX idx_conversation_shares_user_id ON conversation_shares(user_id);
CREATE INDEX idx_conversation_shares_conversation_id ON conversation_shares(conversation_id);
CREATE INDEX idx_conversation_shares_share_token ON conversation_shares(share_token);
CREATE INDEX idx_conversation_shares_status ON conversation_shares(status);
CREATE INDEX idx_conversation_shares_expires_at ON conversation_shares(expires_at);
CREATE INDEX idx_conversation_shares_created_at ON conversation_shares(created_at DESC);
CREATE INDEX idx_conversation_shares_updated_at ON conversation_shares(updated_at DESC);
CREATE INDEX idx_conversation_shares_view_count ON conversation_shares(view_count DESC);

CREATE INDEX idx_share_access_logs_share_id ON share_access_logs(share_id);
CREATE INDEX idx_share_access_logs_access_type ON share_access_logs(access_type);
CREATE INDEX idx_share_access_logs_timestamp ON share_access_logs(timestamp DESC);
CREATE INDEX idx_share_access_logs_session_id ON share_access_logs(session_id);
CREATE INDEX idx_share_access_logs_ip_address ON share_access_logs(ip_address);
CREATE INDEX idx_share_access_logs_user_id ON share_access_logs(user_id);

CREATE INDEX idx_share_analytics_share_id ON share_analytics(share_id);
CREATE INDEX idx_share_analytics_date ON share_analytics(date);
CREATE INDEX idx_share_analytics_created_at ON share_analytics(created_at DESC);

CREATE INDEX idx_share_comments_share_id ON share_comments(share_id);
CREATE INDEX idx_share_comments_parent_comment_id ON share_comments(parent_comment_id);
CREATE INDEX idx_share_comments_is_approved ON share_comments(is_approved);
CREATE INDEX idx_share_comments_created_at ON share_comments(created_at DESC);

CREATE INDEX idx_share_ratings_share_id ON share_ratings(share_id);
CREATE INDEX idx_share_ratings_rating ON share_ratings(rating);
CREATE INDEX idx_share_ratings_created_at ON share_ratings(created_at DESC);

CREATE INDEX idx_share_templates_is_default ON share_templates(is_default);
CREATE INDEX idx_share_templates_is_active ON share_templates(is_active);
CREATE INDEX idx_share_templates_created_by ON share_templates(created_by);

CREATE INDEX idx_share_exports_share_id ON share_exports(share_id);
CREATE INDEX idx_share_exports_format ON share_exports(format);
CREATE INDEX idx_share_exports_status ON share_exports(status);
CREATE INDEX idx_share_exports_created_at ON share_exports(created_at DESC);

CREATE INDEX idx_conversation_sharing_statistics_date ON conversation_sharing_statistics(date);
CREATE INDEX idx_conversation_sharing_statistics_created_at ON conversation_sharing_statistics(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_conversation_shares_updated_at 
    BEFORE UPDATE ON conversation_shares 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_share_comments_updated_at 
    BEFORE UPDATE ON share_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_share_ratings_updated_at 
    BEFORE UPDATE ON share_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_share_templates_updated_at 
    BEFORE UPDATE ON share_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_sharing_statistics_updated_at 
    BEFORE UPDATE ON conversation_sharing_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_conversation_sharing_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO conversation_sharing_statistics (
        date,
        total_shares,
        active_shares,
        expired_shares,
        revoked_shares,
        total_views,
        unique_views,
        total_downloads,
        total_shares_generated,
        average_views_per_share,
        average_duration,
        conversion_rate,
        top_countries,
        top_languages,
        top_categories,
        share_trends,
        user_activity
    )
    SELECT 
        CURRENT_DATE,
        (SELECT COUNT(*) FROM conversation_shares) as total_shares,
        (SELECT COUNT(*) FROM conversation_shares WHERE status = 'active') as active_shares,
        (SELECT COUNT(*) FROM conversation_shares WHERE status = 'expired') as expired_shares,
        (SELECT COUNT(*) FROM conversation_shares WHERE status = 'revoked') as revoked_shares,
        (SELECT SUM(view_count) FROM conversation_shares) as total_views,
        (SELECT COUNT(DISTINCT session_id) FROM share_access_logs WHERE DATE(timestamp) = CURRENT_DATE) as unique_views,
        (SELECT SUM(download_count) FROM conversation_shares) as total_downloads,
        (SELECT SUM(share_count) FROM conversation_shares) as total_shares_generated,
        COALESCE(AVG(view_count), 0) as average_views_per_share,
        COALESCE(AVG(duration), 0) as average_duration,
        COALESCE(
            (SELECT COUNT(DISTINCT session_id) FILTER (WHERE access_type = 'download')::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) * 100
             FROM share_access_logs WHERE DATE(timestamp) = CURRENT_DATE), 
            0
        ) as conversion_rate,
        jsonb_build_object(
            'fr', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'fr' AND DATE(timestamp) = CURRENT_DATE),
            'us', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'us' AND DATE(timestamp) = CURRENT_DATE),
            'gb', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'gb' AND DATE(timestamp) = CURRENT_DATE),
            'de', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'de' AND DATE(timestamp) = CURRENT_DATE),
            'ca', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'ca' AND DATE(timestamp) = CURRENT_DATE),
            'au', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'au' AND DATE(timestamp) = CURRENT_DATE),
            'es', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'es' AND DATE(timestamp) = CURRENT_DATE),
            'it', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'it' AND DATE(timestamp) = CURRENT_DATE)
        ),
        jsonb_build_object(
            'fr', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'fr'),
            'en', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'en'),
            'es', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'es'),
            'de', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'de'),
            'it', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'it'),
            'pt', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'pt'),
            'nl', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'nl'),
            'ja', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'ja')
        ),
        jsonb_build_object(
            'general', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'general'),
            'academic', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'academic'),
            'business', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'business'),
            'technical', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'technical'),
            'creative', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'creative'),
            'education', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'education'),
            'research', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'research'),
            'personal', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'personal')
        ),
        jsonb_build_object(
            'daily', ARRAY(
                SELECT COUNT(*) 
                FROM conversation_shares 
                WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'weekly', ARRAY(
                SELECT COUNT(*) 
                FROM conversation_shares 
                WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '12 weeks' 
                GROUP BY DATE_TRUNC('week', created_at) 
                ORDER BY DATE_TRUNC('week', created_at)
            ),
            'monthly', ARRAY(
                SELECT COUNT(*) 
                FROM conversation_shares 
                WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            )
        ),
        jsonb_build_object(
            'totalUsers', (SELECT COUNT(DISTINCT user_id) FROM conversation_shares),
            'activeUsers', (SELECT COUNT(DISTINCT user_id) FROM conversation_shares WHERE status = 'active'),
            'averageSharesPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT user_id), 0) FROM conversation_shares), 
                0
            ),
            'mostActiveUser', (SELECT user_id FROM conversation_shares GROUP BY user_id ORDER BY COUNT(*) DESC LIMIT 1),
            'userGrowth', ARRAY(
                SELECT COUNT(DISTINCT user_id)
                FROM conversation_shares 
                WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            )
        )
    ON CONFLICT (date) DO UPDATE SET
        total_shares = EXCLUDED.total_shares,
        active_shares = EXCLUDED.active_shares,
        expired_shares = EXCLUDED.expired_shares,
        revoked_shares = EXCLUDED.revoked_shares,
        total_views = EXCLUDED.total_views,
        unique_views = EXCLUDED.unique_views,
        total_downloads = EXCLUDED.total_downloads,
        total_shares_generated = EXCLUDED.total_shares_generated,
        average_views_per_share = EXCLUDED.average_views_per_share,
        average_duration = EXCLUDED.average_duration,
        conversion_rate = EXCLUDED.conversion_rate,
        top_countries = EXCLUDED.top_countries,
        top_languages = EXCLUDED.top_languages,
        top_categories = EXCLUDED.top_categories,
        share_trends = EXCLUDED.share_trends,
        user_activity = EXCLUDED.user_activity,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_sharing_statistics_shares
    AFTER INSERT ON conversation_shares
    FOR EACH ROW EXECUTE FUNCTION update_conversation_sharing_statistics();

CREATE TRIGGER trigger_update_conversation_sharing_statistics_access
    AFTER INSERT ON share_access_logs
    FOR EACH ROW EXECUTE FUNCTION update_conversation_sharing_statistics();

-- Politiques RLS pour les partages
ALTER TABLE conversation_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversation shares" ON conversation_shares
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public can access active shares via token" ON conversation_shares
    FOR SELECT USING (
        status = 'active' 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (settings->>'allowAnonymous')::boolean = true
    );

CREATE POLICY "Admins can view all conversation shares" ON conversation_shares
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les logs d'accès
ALTER TABLE share_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own share access logs" ON share_access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_shares cs
            WHERE cs.id = share_id AND cs.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all share access logs" ON share_access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les analytics
ALTER TABLE share_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own share analytics" ON share_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_shares cs
            WHERE cs.id = share_id AND cs.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all share analytics" ON share_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les commentaires
ALTER TABLE share_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approved share comments" ON share_comments
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can manage own share comments" ON share_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM conversation_shares cs
            WHERE cs.id = share_id AND cs.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all share comments" ON share_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les évaluations
ALTER TABLE share_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view share ratings" ON share_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own share ratings" ON share_ratings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM conversation_shares cs
            WHERE cs.id = share_id AND cs.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all share ratings" ON share_ratings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les templates
ALTER TABLE share_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active share templates" ON share_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage share templates" ON share_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les exports
ALTER TABLE share_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own share exports" ON share_exports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM conversation_shares cs
            WHERE cs.id = share_id AND cs.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all share exports" ON share_exports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les statistiques
ALTER TABLE conversation_sharing_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversation sharing statistics" ON conversation_sharing_statistics
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage conversation sharing statistics" ON conversation_sharing_statistics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour le partage de conversations

-- Fonction pour obtenir les statistiques de partage
CREATE OR REPLACE FUNCTION get_conversation_sharing_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_shares BIGINT,
    active_shares BIGINT,
    expired_shares BIGINT,
    revoked_shares BIGINT,
    total_views BIGINT,
    unique_views BIGINT,
    total_downloads BIGINT,
    total_shares_generated BIGINT,
    average_views_per_share DECIMAL(10,2),
    average_duration INTEGER,
    conversion_rate DECIMAL(5,2),
    top_countries JSONB,
    top_languages JSONB,
    top_categories JSONB,
    share_trends JSONB,
    user_activity JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM conversation_shares),
        (SELECT COUNT(*) FROM conversation_shares WHERE status = 'active'),
        (SELECT COUNT(*) FROM conversation_shares WHERE status = 'expired'),
        (SELECT COUNT(*) FROM conversation_shares WHERE status = 'revoked'),
        (SELECT SUM(view_count) FROM conversation_shares),
        (SELECT COUNT(DISTINCT session_id) FROM share_access_logs WHERE DATE(timestamp) = p_date),
        (SELECT SUM(download_count) FROM conversation_shares),
        (SELECT SUM(share_count) FROM conversation_shares),
        COALESCE(AVG(view_count), 0),
        COALESCE(AVG(duration), 0)::INTEGER,
        COALESCE(
            (SELECT COUNT(DISTINCT session_id) FILTER (WHERE access_type = 'download')::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) * 100
             FROM share_access_logs WHERE DATE(timestamp) = p_date), 
            0
        ),
        (SELECT jsonb_build_object(
            'fr', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'fr' AND DATE(timestamp) = p_date),
            'us', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'us' AND DATE(timestamp) = p_date),
            'gb', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'gb' AND DATE(timestamp) = p_date),
            'de', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'de' AND DATE(timestamp) = p_date),
            'ca', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'ca' AND DATE(timestamp) = p_date),
            'au', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'au' AND DATE(timestamp) = p_date),
            'es', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'es' AND DATE(timestamp) = p_date),
            'it', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'it' AND DATE(timestamp) = p_date)
        )),
        (SELECT jsonb_build_object(
            'fr', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'fr'),
            'en', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'en'),
            'es', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'es'),
            'de', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'de'),
            'it', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'it'),
            'pt', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'pt'),
            'nl', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'nl'),
            'ja', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'ja')
        )),
        (SELECT jsonb_build_object(
            'general', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'general'),
            'academic', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'academic'),
            'business', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'business'),
            'technical', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'technical'),
            'creative', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'creative'),
            'education', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'education'),
            'research', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'research'),
            'personal', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'personal')
        )),
        (SELECT jsonb_build_object(
            'daily', ARRAY(
                SELECT COUNT(*) 
                FROM conversation_shares 
                WHERE DATE(created_at) >= p_date - INTERVAL '30 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'weekly', ARRAY(
                SELECT COUNT(*) 
                FROM conversation_shares 
                WHERE DATE(created_at) >= p_date - INTERVAL '12 weeks' 
                GROUP BY DATE_TRUNC('week', created_at) 
                ORDER BY DATE_TRUNC('week', created_at)
            ),
            'monthly', ARRAY(
                SELECT COUNT(*) 
                FROM conversation_shares 
                WHERE DATE(created_at) >= p_date - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            )
        )),
        (SELECT jsonb_build_object(
            'totalUsers', (SELECT COUNT(DISTINCT user_id) FROM conversation_shares),
            'activeUsers', (SELECT COUNT(DISTINCT user_id) FROM conversation_shares WHERE status = 'active'),
            'averageSharesPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT user_id), 0) FROM conversation_shares), 
                0
            ),
            'mostActiveUser', (SELECT user_id FROM conversation_shares GROUP BY user_id ORDER BY COUNT(*) DESC LIMIT 1),
            'userGrowth', ARRAY(
                SELECT COUNT(DISTINCT user_id)
                FROM conversation_shares 
                WHERE DATE(created_at) >= p_date - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            )
        ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les templates de partage par défaut
CREATE OR REPLACE FUNCTION create_default_share_templates()
RETURNS VOID AS $$
BEGIN
    INSERT INTO share_templates (
        name,
        description,
        settings,
        permissions,
        is_default,
        is_active
    ) VALUES 
        ('Public', 'Template de partage public avec accès anonyme', 
         '{"allowAnonymous": true, "requirePassword": false, "requireEmail": false, "allowDownload": true, "allowCopy": true, "allowPrint": true, "allowShare": true, "allowComments": true, "allowRating": true, "showMetadata": true, "showTimestamps": true, "showUsernames": false, "showDocuments": true, "showCitations": true, "watermark": false, "branding": true, "theme": "light", "language": "fr", "timezone": "Europe/Paris"}',
         '{"canView": true, "canDownload": true, "canCopy": true, "canPrint": true, "canShare": true, "canComment": true, "canRate": true, "canEdit": false, "canDelete": false, "canExport": false, "canPrintPDF": false, "canViewAnalytics": false, "canManageAccess": false}',
         true, true),
        ('Privé', 'Template de partage privé avec authentification requise', 
         '{"allowAnonymous": false, "requirePassword": true, "requireEmail": true, "allowDownload": false, "allowCopy": false, "allowPrint": false, "allowShare": false, "allowComments": true, "allowRating": false, "showMetadata": false, "showTimestamps": true, "showUsernames": true, "showDocuments": false, "showCitations": false, "watermark": true, "branding": false, "theme": "light", "language": "fr", "timezone": "Europe/Paris"}',
         '{"canView": true, "canDownload": false, "canCopy": false, "canPrint": false, "canShare": false, "canComment": true, "canRate": false, "canEdit": false, "canDelete": false, "canExport": false, "canPrintPDF": false, "canViewAnalytics": false, "canManageAccess": false}',
         false, true),
        ('Académique', 'Template pour partage académique avec citations et métadonnées', 
         '{"allowAnonymous": true, "requirePassword": false, "requireEmail": false, "allowDownload": true, "allowCopy": true, "allowPrint": true, "allowShare": true, "allowComments": true, "allowRating": true, "showMetadata": true, "showTimestamps": true, "showUsernames": false, "showDocuments": true, "showCitations": true, "watermark": true, "branding": true, "theme": "light", "language": "fr", "timezone": "Europe/Paris"}',
         '{"canView": true, "canDownload": true, "canCopy": true, "canPrint": true, "canShare": true, "canComment": true, "canRate": true, "canEdit": false, "canDelete": false, "canExport": true, "canPrintPDF": true, "canViewAnalytics": false, "canManageAccess": false}',
         false, true),
        ('Business', 'Template pour partage professionnel avec branding personnalisé', 
         '{"allowAnonymous": false, "requirePassword": false, "requireEmail": true, "allowDownload": false, "allowCopy": false, "allowPrint": false, "allowShare": true, "allowComments": false, "allowRating": false, "showMetadata": false, "showTimestamps": false, "showUsernames": false, "showDocuments": false, "showCitations": false, "watermark": true, "branding": true, "theme": "auto", "language": "fr", "timezone": "Europe/Paris"}',
         '{"canView": true, "canDownload": false, "canCopy": false, "canPrint": false, "canShare": true, "canComment": false, "canRate": false, "canEdit": false, "canDelete": false, "canExport": false, "canPrintPDF": false, "canViewAnalytics": true, "canManageAccess": false}',
         false, true)
    ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        settings = EXCLUDED.settings,
        permissions = EXCLUDED.permissions,
        is_default = EXCLUDED.is_default,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_conversation_sharing_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO conversation_sharing_statistics (
        date,
        total_shares,
        active_shares,
        expired_shares,
        revoked_shares,
        total_views,
        unique_views,
        total_downloads,
        total_shares_generated,
        average_views_per_share,
        average_duration,
        conversion_rate,
        top_countries,
        top_languages,
        top_categories,
        share_trends,
        user_activity
    )
    SELECT 
        p_date,
        (SELECT COUNT(*) FROM conversation_shares) as total_shares,
        (SELECT COUNT(*) FROM conversation_shares WHERE status = 'active') as active_shares,
        (SELECT COUNT(*) FROM conversation_shares WHERE status = 'expired') as expired_shares,
        (SELECT COUNT(*) FROM conversation_shares WHERE status = 'revoked') as revoked_shares,
        (SELECT SUM(view_count) FROM conversation_shares) as total_views,
        (SELECT COUNT(DISTINCT session_id) FROM share_access_logs WHERE DATE(timestamp) = p_date) as unique_views,
        (SELECT SUM(download_count) FROM conversation_shares) as total_downloads,
        (SELECT SUM(share_count) FROM conversation_shares) as total_shares_generated,
        COALESCE(AVG(view_count), 0) as average_views_per_share,
        COALESCE(AVG(duration), 0)::INTEGER as average_duration,
        COALESCE(
            (SELECT COUNT(DISTINCT session_id) FILTER (WHERE access_type = 'download')::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0) * 100
             FROM share_access_logs WHERE DATE(timestamp) = p_date), 
            0
        ) as conversion_rate,
        (SELECT jsonb_build_object(
            'fr', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'fr' AND DATE(timestamp) = p_date),
            'us', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'us' AND DATE(timestamp) = p_date),
            'gb', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'gb' AND DATE(timestamp) = p_date),
            'de', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'de' AND DATE(timestamp) = p_date),
            'ca', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'ca' AND DATE(timestamp) = p_date),
            'au', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'au' AND DATE(timestamp) = p_date),
            'es', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'es' AND DATE(timestamp) = p_date),
            'it', (SELECT COUNT(*) FROM share_access_logs WHERE (location->>'country') = 'it' AND DATE(timestamp) = p_date)
        )),
        (SELECT jsonb_build_object(
            'fr', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'fr'),
            'en', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'en'),
            'es', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'es'),
            'de', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'de'),
            'it', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'it'),
            'pt', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'pt'),
            'nl', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'nl'),
            'ja', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'language') = 'ja')
        )),
        (SELECT jsonb_build_object(
            'general', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'general'),
            'academic', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'academic'),
            'business', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'business'),
            'technical', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'technical'),
            'creative', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'creative'),
            'education', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'education'),
            'research', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'research'),
            'personal', (SELECT COUNT(*) FROM conversation_shares WHERE (metadata->>'category') = 'personal')
        )),
        (SELECT jsonb_build_object(
            'daily', ARRAY(SELECT COUNT(*) FROM conversation_shares WHERE DATE(created_at) >= p_date - INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY DATE(created_at)),
            'weekly', ARRAY(SELECT COUNT(*) FROM conversation_shares WHERE DATE(created_at) >= p_date - INTERVAL '12 weeks' GROUP BY DATE_TRUNC('week', created_at) ORDER BY DATE_TRUNC('week', created_at)),
            'monthly', ARRAY(SELECT COUNT(*) FROM conversation_shares WHERE DATE(created_at) >= p_date - INTERVAL '12 months' GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)))
        ),
        (SELECT jsonb_build_object(
            'totalUsers', (SELECT COUNT(DISTINCT user_id) FROM conversation_shares),
            'activeUsers', (SELECT COUNT(DISTINCT user_id) FROM conversation_shares WHERE status = 'active'),
            'averageSharesPerUser', COALESCE((SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT user_id), 0) FROM conversation_shares), 0),
            'mostActiveUser', (SELECT user_id FROM conversation_shares GROUP BY user_id ORDER BY COUNT(*) DESC LIMIT 1),
            'userGrowth', ARRAY(SELECT COUNT(DISTINCT user_id) FROM conversation_shares WHERE DATE(created_at) >= p_date - INTERVAL '12 months' GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)))
        )
    ON CONFLICT (date) DO UPDATE SET
        total_shares = EXCLUDED.total_shares,
        active_shares = EXCLUDED.active_shares,
        expired_shares = EXCLUDED.expired_shares,
        revoked_shares = EXCLUDED.revoked_shares,
        total_views = EXCLUDED.total_views,
        unique_views = EXCLUDED.unique_views,
        total_downloads = EXCLUDED.total_downloads,
        total_shares_generated = EXCLUDED.total_shares_generated,
        average_views_per_share = EXCLUDED.average_views_per_share,
        average_duration = EXCLUDED.average_duration,
        conversion_rate = EXCLUDED.conversion_rate,
        top_countries = EXCLUDED.top_countries,
        top_languages = EXCLUDED.top_languages,
        top_categories = EXCLUDED.top_categories,
        share_trends = EXCLUDED.share_trends,
        user_activity = EXCLUDED.user_activity,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE conversation_shares IS 'Partages de conversations avec liens publics et contrôles d\'accès';
COMMENT ON TABLE share_access_logs IS 'Logs d\'accès aux partages avec géolocalisation et analytics';
COMMENT ON TABLE share_analytics IS 'Analytics détaillés par partage avec tendances et statistiques';
COMMENT ON TABLE share_comments IS 'Commentaires sur les partages avec modération et threads';
COMMENT ON TABLE share_ratings IS 'Évaluations des partages avec système de notation';
COMMENT ON TABLE share_templates IS 'Templates de partage prédéfinis avec paramètres configurables';
COMMENT ON TABLE share_exports IS 'Exports d\'analytics dans différents formats';
COMMENT ON TABLE conversation_sharing_statistics IS 'Statistiques globales de partage de conversations';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN conversation_shares.settings IS 'Paramètres de partage {allowAnonymous, requirePassword, requireEmail, allowDownload, allowCopy, allowPrint, allowShare, allowComments, allowRating, showMetadata, showTimestamps, showUsernames, showDocuments, showCitations, watermark, branding, customCSS, customHeader, customFooter, theme, language, timezone}';
COMMENT ON COLUMN conversation_shares.permissions IS 'Permissions de partage {canView, canDownload, canCopy, canPrint, canShare, canComment, canRate, canEdit, canDelete, canExport, canPrintPDF, canViewAnalytics, canManageAccess}';
COMMENT ON COLUMN conversation_shares.metadata IS 'Métadonnées du partage {originalConversationTitle, originalConversationLength, messageCount, wordCount, characterCount, documentCount, citationCount, averageResponseTime, totalProcessingTime, modelUsed, language, topics, sentiment, complexity, tags, category, subcategory, customFields}';
COMMENT ON COLUMN share_analytics.share_trends IS 'Tendances sur différentes périodes {daily, weekly, monthly}';
COMMENT ON COLUMN share_analytics.user_activity IS 'Activité des utilisateurs {totalUsers, activeUsers, averageSharesPerUser, mostActiveUser, userGrowth}';
COMMENT ON COLUMN share_templates.settings IS 'Paramètres du template {allowAnonymous, requirePassword, requireEmail, allowDownload, allowCopy, allowPrint, allowShare, allowComments, allowRating, showMetadata, showTimestamps, showUsernames, showDocuments, showCitations, watermark, branding, theme, language, timezone}';
COMMENT ON COLUMN share_exports.options IS 'Options d\'export {includeAnalytics, includeComments, includeRatings, includeAccessLogs, dateRange, filters, format}';

-- Créer les données par défaut
SELECT create_default_share_templates();
