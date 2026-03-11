-- Migration: Création des tables pour les providers OAuth (Google, Facebook, Microsoft)
-- Date: 11 mars 2026
-- Description: Tables pour gérer l'authentification OAuth2 avec plusieurs providers

-- Table des providers OAuth
CREATE TABLE IF NOT EXISTS oauth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('google', 'facebook', 'microsoft', 'github', 'linkedin', 'apple')),
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    authorization_url TEXT NOT NULL,
    token_url TEXT NOT NULL,
    user_info_url TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    redirect_uri TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    icon VARCHAR(100),
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Table des tokens OAuth
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES oauth_providers(id) ON DELETE CASCADE,
    provider_type VARCHAR(50) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, provider_id, is_active)
);

-- Table des profils utilisateurs OAuth
CREATE TABLE IF NOT EXISTS oauth_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES oauth_providers(id) ON DELETE CASCADE,
    provider_type VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    username VARCHAR(255),
    avatar TEXT,
    profile_url TEXT,
    locale VARCHAR(10),
    timezone VARCHAR(50),
    verified BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, provider_user_id)
);

-- Table des sessions OAuth
CREATE TABLE IF NOT EXISTS oauth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state VARCHAR(255) NOT NULL UNIQUE,
    provider_id UUID NOT NULL REFERENCES oauth_providers(id) ON DELETE CASCADE,
    provider_type VARCHAR(50) NOT NULL,
    redirect_uri TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'
);

-- Table des logs de sécurité OAuth
CREATE TABLE IF NOT EXISTS oauth_security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES oauth_providers(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('login', 'logout', 'token_refresh', 'token_revoke', 'suspicious_activity', 'sync_error')),
    event_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des synchronisations OAuth
CREATE TABLE IF NOT EXISTS oauth_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES oauth_providers(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('profile', 'contacts', 'calendar', 'files', 'full')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'success', 'partial', 'error')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    items_processed INTEGER DEFAULT 0,
    items_total INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}'
);

-- Index pour les performances
CREATE INDEX idx_oauth_providers_name ON oauth_providers(name);
CREATE INDEX idx_oauth_providers_type ON oauth_providers(type);
CREATE INDEX idx_oauth_providers_is_active ON oauth_providers(is_active);
CREATE INDEX idx_oauth_providers_is_default ON oauth_providers(is_default);
CREATE INDEX idx_oauth_providers_created_at ON oauth_providers(created_at DESC);

CREATE INDEX idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX idx_oauth_tokens_provider_id ON oauth_tokens(provider_id);
CREATE INDEX idx_oauth_tokens_provider_type ON oauth_tokens(provider_type);
CREATE INDEX idx_oauth_tokens_is_active ON oauth_tokens(is_active);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);
CREATE INDEX idx_oauth_tokens_last_used_at ON oauth_tokens(last_used_at DESC);
CREATE INDEX idx_oauth_tokens_created_at ON oauth_tokens(created_at DESC);

CREATE INDEX idx_oauth_user_profiles_user_id ON oauth_user_profiles(user_id);
CREATE INDEX idx_oauth_user_profiles_provider_id ON oauth_user_profiles(provider_id);
CREATE INDEX idx_oauth_user_profiles_provider_type ON oauth_user_profiles(provider_type);
CREATE INDEX idx_oauth_user_profiles_email ON oauth_user_profiles(email);
CREATE INDEX idx_oauth_user_profiles_username ON oauth_user_profiles(username);
CREATE INDEX idx_oauth_user_profiles_verified ON oauth_user_profiles(verified);
CREATE INDEX idx_oauth_user_profiles_synced_at ON oauth_user_profiles(synced_at DESC);

CREATE INDEX idx_oauth_sessions_state ON oauth_sessions(state);
CREATE INDEX idx_oauth_sessions_provider_id ON oauth_sessions(provider_id);
CREATE INDEX idx_oauth_sessions_user_id ON oauth_sessions(user_id);
CREATE INDEX idx_oauth_sessions_expires_at ON oauth_sessions(expires_at);
CREATE INDEX idx_oauth_sessions_is_active ON oauth_sessions(is_active);
CREATE INDEX idx_oauth_sessions_created_at ON oauth_sessions(created_at DESC);

CREATE INDEX idx_oauth_security_logs_user_id ON oauth_security_logs(user_id);
CREATE INDEX idx_oauth_security_logs_provider_id ON oauth_security_logs(provider_id);
CREATE INDEX idx_oauth_security_logs_event_type ON oauth_security_logs(event_type);
CREATE INDEX idx_oauth_security_logs_success ON oauth_security_logs(success);
CREATE INDEX idx_oauth_security_logs_risk_score ON oauth_security_logs(risk_score DESC);
CREATE INDEX idx_oauth_security_logs_created_at ON oauth_security_logs(created_at DESC);

CREATE INDEX idx_oauth_sync_logs_user_id ON oauth_sync_logs(user_id);
CREATE INDEX idx_oauth_sync_logs_provider_id ON oauth_sync_logs(provider_id);
CREATE INDEX idx_oauth_sync_logs_sync_type ON oauth_sync_logs(sync_type);
CREATE INDEX idx_oauth_sync_logs_status ON oauth_sync_logs(status);
CREATE INDEX idx_oauth_sync_logs_started_at ON oauth_sync_logs(started_at DESC);
CREATE INDEX idx_oauth_sync_logs_completed_at ON oauth_sync_logs(completed_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_oauth_providers_updated_at 
    BEFORE UPDATE ON oauth_providers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at 
    BEFORE UPDATE ON oauth_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_user_profiles_updated_at 
    BEFORE UPDATE ON oauth_user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour last_used_at lors de l'accès au token
CREATE OR REPLACE FUNCTION update_token_last_used()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE oauth_tokens
    SET last_used_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour nettoyer les sessions OAuth expirées
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_sessions()
RETURNS TABLE (
    cleaned_sessions BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
BEGIN
    UPDATE oauth_sessions
    SET is_active = false
    WHERE is_active = true
    AND expires_at < NOW();
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_count as cleaned_sessions;
END;
$$ LANGUAGE plpgsql;

-- Politiques RLS pour les providers OAuth
ALTER TABLE oauth_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active OAuth providers" ON oauth_providers
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage OAuth providers" ON oauth_providers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80 -- Niveau admin
        )
    );

-- Politiques RLS pour les tokens OAuth
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own OAuth tokens" ON oauth_tokens
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own OAuth tokens" ON oauth_tokens
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les profils utilisateurs OAuth
ALTER TABLE oauth_user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own OAuth profiles" ON oauth_user_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own OAuth profiles" ON oauth_user_profiles
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les sessions OAuth
ALTER TABLE oauth_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own OAuth sessions" ON oauth_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage OAuth sessions" ON oauth_sessions
    FOR ALL USING (true); -- Pour le système de callback

-- Politiques RLS pour les logs de sécurité
ALTER TABLE oauth_security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own OAuth security logs" ON oauth_security_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all OAuth security logs" ON oauth_security_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les logs de synchronisation
ALTER TABLE oauth_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own OAuth sync logs" ON oauth_sync_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all OAuth sync logs" ON oauth_sync_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour les providers OAuth

-- Fonction pour obtenir les statistiques OAuth
CREATE OR REPLACE FUNCTION get_oauth_stats()
RETURNS TABLE (
    total_providers BIGINT,
    active_providers BIGINT,
    total_users BIGINT,
    users_with_oauth BIGINT,
    provider_distribution JSONB,
    login_trends JSONB,
    active_tokens BIGINT,
    expired_tokens BIGINT,
    security_events JSONB,
    sync_errors JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH provider_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_active = true) as active
        FROM oauth_providers
    ),
    user_stats AS (
        SELECT 
            COUNT(DISTINCT p.id) as total_users,
            COUNT(DISTINCT ot.user_id) as users_with_oauth
        FROM profiles p
        LEFT JOIN oauth_tokens ot ON p.id = ot.user_id AND ot.is_active = true
    ),
    provider_distribution AS (
        SELECT jsonb_object_agg(provider_type, user_count)
        FROM (
            SELECT 
                provider_type,
                COUNT(DISTINCT user_id) as user_count
            FROM oauth_tokens
            WHERE is_active = true
            GROUP BY provider_type
        ) dist
    ),
    login_trends AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'date', DATE(created_at),
                'provider', provider_type,
                'count', daily_count
            )
        )
        FROM (
            SELECT 
                created_at::date as date,
                provider_type,
                COUNT(*) as daily_count
            FROM oauth_security_logs
            WHERE event_type = 'login'
            AND success = true
            AND created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(created_at), provider_type
            ORDER BY date DESC, provider_type
        ) trends
    ),
    token_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE is_active = true AND expires_at > NOW()) as active,
            COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired
        FROM oauth_tokens
    ),
    security_events AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'type', event_type,
                'count', event_count,
                'lastEvent', last_event
            )
        )
        FROM (
            SELECT 
                event_type,
                COUNT(*) as event_count,
                MAX(created_at) as last_event
            FROM oauth_security_logs
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY event_type
            ORDER BY event_count DESC
        ) events
    ),
    sync_errors AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'provider', provider_type,
                'errorCount', error_count,
                'lastError', last_error
            )
        )
        FROM (
            SELECT 
                op.type as provider_type,
                COUNT(*) as error_count,
                MAX(osl.created_at) as last_error
            FROM oauth_sync_logs osl
            JOIN oauth_providers op ON osl.provider_id = op.id
            WHERE osl.status = 'error'
            AND osl.created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY op.type
        ) errors
    )
    SELECT 
        ps.total as total_providers,
        ps.active as active_providers,
        us.total_users,
        us.users_with_oauth,
        pd.provider_distribution,
        lt.login_trends,
        ts.active as active_tokens,
        ts.expired as expired_tokens,
        se.security_events,
        serr.sync_errors
    FROM provider_stats ps, user_stats us, provider_distribution pd, 
         login_trends lt, token_stats ts, security_events se, sync_errors serr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les providers OAuth par défaut
CREATE OR REPLACE FUNCTION create_default_oauth_providers()
RETURNS VOID AS $$
BEGIN
    -- Google OAuth
    INSERT INTO oauth_providers (name, display_name, type, client_id, client_secret, 
                                authorization_url, token_url, user_info_url, scopes, 
                                redirect_uri, is_active, is_default, icon, color, metadata)
    VALUES (
        'google',
        'Google',
        'google',
        'your-google-client-id',
        'your-google-client-secret',
        'https://accounts.google.com/o/oauth2/v2/auth',
        'https://oauth2.googleapis.com/token',
        'https://www.googleapis.com/oauth2/v2/userinfo',
        ARRAY['openid', 'email', 'profile'],
        'http://localhost:3000/auth/google/callback',
        false,
        true,
        'google',
        '#4285F4',
        '{
            "version": "2.0",
            "documentation": "https://developers.google.com/identity/protocols/oauth2",
            "supportedFeatures": [
                {"name": "profile_info", "supported": true},
                {"name": "email_verification", "supported": true},
                {"name": "offline_access", "supported": true}
            ],
            "rateLimits": {
                "requestsPerHour": 10000,
                "requestsPerMinute": 100,
                "burstLimit": 10
            },
            "tokenRefreshBuffer": 300,
            "maxTokenAge": 3600,
            "requiresApproval": true
        }'::jsonb
    )
    ON CONFLICT (name) DO NOTHING;

    -- Facebook OAuth
    INSERT INTO oauth_providers (name, display_name, type, client_id, client_secret,
                                authorization_url, token_url, user_info_url, scopes,
                                redirect_uri, is_active, is_default, icon, color, metadata)
    VALUES (
        'facebook',
        'Facebook',
        'facebook',
        'your-facebook-app-id',
        'your-facebook-app-secret',
        'https://www.facebook.com/v18.0/dialog/oauth',
        'https://graph.facebook.com/v18.0/oauth/access_token',
        'https://graph.facebook.com/v18.0/me',
        ARRAY['email', 'public_profile'],
        'http://localhost:3000/auth/facebook/callback',
        false,
        false,
        'facebook',
        '#1877F2',
        '{
            "version": "18.0",
            "documentation": "https://developers.facebook.com/docs/facebook-login",
            "supportedFeatures": [
                {"name": "profile_info", "supported": true},
                {"name": "email_verification", "supported": true},
                {"name": "offline_access", "supported": false}
            ],
            "rateLimits": {
                "requestsPerHour": 200,
                "requestsPerMinute": 200,
                "burstLimit": 200
            },
            "tokenRefreshBuffer": 0,
            "maxTokenAge": 5184000,
            "requiresApproval": true
        }'::jsonb
    )
    ON CONFLICT (name) DO NOTHING;

    -- Microsoft OAuth
    INSERT INTO oauth_providers (name, display_name, type, client_id, client_secret,
                                authorization_url, token_url, user_info_url, scopes,
                                redirect_uri, is_active, is_default, icon, color, metadata)
    VALUES (
        'microsoft',
        'Microsoft',
        'microsoft',
        'your-microsoft-client-id',
        'your-microsoft-client-secret',
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        'https://graph.microsoft.com/v1.0/me',
        ARRAY['openid', 'email', 'profile'],
        'http://localhost:3000/auth/microsoft/callback',
        false,
        false,
        'microsoft',
        '#00A4EF',
        '{
            "version": "2.0",
            "documentation": "https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow",
            "supportedFeatures": [
                {"name": "profile_info", "supported": true},
                {"name": "email_verification", "supported": true},
                {"name": "offline_access", "supported": true}
            ],
            "rateLimits": {
                "requestsPerHour": 10000,
                "requestsPerMinute": 100,
                "burstLimit": 10
            },
            "tokenRefreshBuffer": 300,
            "maxTokenAge": 3600,
            "requiresApproval": false
        }'::jsonb
    )
    ON CONFLICT (name) DO NOTHING;

    -- GitHub OAuth
    INSERT INTO oauth_providers (name, display_name, type, client_id, client_secret,
                                authorization_url, token_url, user_info_url, scopes,
                                redirect_uri, is_active, is_default, icon, color, metadata)
    VALUES (
        'github',
        'GitHub',
        'github',
        'your-github-client-id',
        'your-github-client-secret',
        'https://github.com/login/oauth/authorize',
        'https://github.com/login/oauth/access_token',
        'https://api.github.com/user',
        ARRAY['user:email'],
        'http://localhost:3000/auth/github/callback',
        false,
        false,
        'github',
        '#333333',
        '{
            "version": "v4",
            "documentation": "https://docs.github.com/en/developers/apps/building-oauth-apps",
            "supportedFeatures": [
                {"name": "profile_info", "supported": true},
                {"name": "email_verification", "supported": false},
                {"name": "offline_access", "supported": true}
            ],
            "rateLimits": {
                "requestsPerHour": 5000,
                "requestsPerMinute": 60,
                "burstLimit": 60
            },
            "tokenRefreshBuffer": 0,
            "maxTokenAge": 31536000,
            "requiresApproval": false
        }'::jsonb
    )
    ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les tokens expirés
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_tokens()
RETURNS TABLE (
    cleaned_tokens BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
BEGIN
    UPDATE oauth_tokens
    SET is_active = false
    WHERE is_active = true
    AND expires_at < NOW();
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_count as cleaned_tokens;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE oauth_providers IS 'Configuration des providers OAuth2 (Google, Facebook, Microsoft, etc.)';
COMMENT ON TABLE oauth_tokens IS 'Tokens d\'accès OAuth2 pour les utilisateurs';
COMMENT ON TABLE oauth_user_profiles IS 'Profils utilisateurs synchronisés depuis les providers OAuth';
COMMENT ON TABLE oauth_sessions IS 'Sessions OAuth temporaires pour le flow d\'authentification';
COMMENT ON TABLE oauth_security_logs IS 'Journal de sécurité pour les événements OAuth';
COMMENT ON TABLE oauth_sync_logs IS 'Journal des synchronisations de données OAuth';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN oauth_providers.metadata IS 'Métadonnées du provider {version, features, rateLimits, etc.}';
COMMENT ON COLUMN oauth_tokens.metadata IS 'Métadonnées du token {ipAddress, userAgent, securityFlags, etc.}';
COMMENT ON COLUMN oauth_user_profiles.metadata IS 'Métadonnées du profil {rawResponse, syncErrors, lastSyncStatus, etc.}';
COMMENT ON COLUMN oauth_sessions.metadata IS 'Métadonnées de la session {originalRequest, securityContext, flowType, etc.}';
COMMENT ON COLUMN oauth_security_logs.risk_score IS 'Score de risque de 0 à 100 pour l\'événement';
COMMENT ON COLUMN oauth_sync_logs.status IS 'Statut de la synchronisation {pending, running, success, partial, error}';

-- Créer les providers OAuth par défaut
SELECT create_default_oauth_providers();
