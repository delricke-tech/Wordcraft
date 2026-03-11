-- Migration: Création des tables pour l'authentification forte (2FA/MFA)
-- Date: 11 mars 2026
-- Description: Tables pour gérer l'authentification multi-facteurs, TOTP, codes de sauvegarde et clés de sécurité

-- Table des configurations MFA
CREATE TABLE IF NOT EXISTS mfa_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    mfa_type VARCHAR(20) NOT NULL CHECK (mfa_type IN ('totp', 'sms', 'email', 'backup_codes', 'hardware_key', 'biometric')),
    secret TEXT, -- Secret TOTP ou autres secrets chiffrés
    qr_code TEXT, -- QR code pour TOTP (base64)
    backup_codes TEXT[], -- Codes de sauvegarde
    phone_number VARCHAR(50), -- Pour SMS
    email_address VARCHAR(255), -- Pour email
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT false,
    verification_attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_verification_at TIMESTAMP WITH TIME ZONE,
    grace_period_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, mfa_type)
);

-- Table des sessions MFA
CREATE TABLE IF NOT EXISTS mfa_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_id VARCHAR(255),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    challenge VARCHAR(255) NOT NULL,
    mfa_type VARCHAR(20) NOT NULL CHECK (mfa_type IN ('totp', 'sms', 'email', 'backup_codes', 'hardware_key', 'biometric')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    is_completed BOOLEAN DEFAULT false,
    is_cancelled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Table des appareils de confiance
CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    device_info JSONB DEFAULT '{}',
    trusted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, device_id)
);

-- Table des logs MFA
CREATE TABLE IF NOT EXISTS mfa_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    log_type VARCHAR(50) NOT NULL CHECK (log_type IN ('setup', 'verification', 'disable', 'backup_used', 'backup_generated', 'device_trusted', 'suspicious_activity', 'rate_limit', 'error')),
    mfa_type VARCHAR(20) NOT NULL CHECK (mfa_type IN ('totp', 'sms', 'email', 'backup_codes', 'hardware_key', 'biometric')),
    success BOOLEAN DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    device_id VARCHAR(255),
    session_id VARCHAR(255),
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_ms INTEGER,
    metadata JSONB DEFAULT '{}'
);

-- Table des préférences MFA
CREATE TABLE IF NOT EXISTS mfa_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    remember_device BOOLEAN DEFAULT true,
    device_expiry_days INTEGER DEFAULT 30,
    require_mfa_on_new_device BOOLEAN DEFAULT true,
    require_mfa_on_sensitive_actions BOOLEAN DEFAULT true,
    grace_period_days INTEGER DEFAULT 7,
    notification_methods TEXT[] DEFAULT ARRAY['email'],
    backup_code_regeneration BOOLEAN DEFAULT false,
    backup_code_count INTEGER DEFAULT 10,
    backup_code_length INTEGER DEFAULT 8,
    totp_period INTEGER DEFAULT 30,
    totp_digits INTEGER DEFAULT 6,
    sms_enabled BOOLEAN DEFAULT false,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des clés de sécurité matérielles
CREATE TABLE IF NOT EXISTS security_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    key_id VARCHAR(255) NOT NULL UNIQUE,
    key_name VARCHAR(255) NOT NULL,
    credential_id VARCHAR(255) NOT NULL,
    public_key TEXT NOT NULL,
    attestation_type VARCHAR(50),
    aaguid UUID,
    sign_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    device_info JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Table des tentatives de connexion suspectes
CREATE TABLE IF NOT EXISTS suspicious_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    device_id VARCHAR(255),
    attempt_count INTEGER DEFAULT 1,
    first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_blocked BOOLEAN DEFAULT false,
    blocked_until TIMESTAMP WITH TIME ZONE,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    threat_type VARCHAR(50),
    metadata JSONB DEFAULT '{}'
);

-- Table des statistiques MFA
CREATE TABLE IF NOT EXISTS mfa_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_users INTEGER DEFAULT 0,
    enabled_users INTEGER DEFAULT 0,
    mfa_enabled_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (mfa_enabled_rate >= 0 AND mfa_enabled_rate <= 100),
    verification_attempts INTEGER DEFAULT 0,
    successful_verifications INTEGER DEFAULT 0,
    failed_verifications INTEGER DEFAULT 0,
    average_verification_time_ms INTEGER DEFAULT 0,
    methods_by_type JSONB DEFAULT '{}',
    suspicious_activities INTEGER DEFAULT 0,
    trusted_devices INTEGER DEFAULT 0,
    backup_codes_used INTEGER DEFAULT 0,
    security_incidents INTEGER DEFAULT 0,
    sessions_created INTEGER DEFAULT 0,
    sessions_completed INTEGER DEFAULT 0,
    sessions_expired INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Index pour les performances
CREATE INDEX idx_mfa_configurations_user_id ON mfa_configurations(user_id);
CREATE INDEX idx_mfa_configurations_mfa_type ON mfa_configurations(mfa_type);
CREATE INDEX idx_mfa_configurations_is_active ON mfa_configurations(is_active);
CREATE INDEX idx_mfa_configurations_is_verified ON mfa_configurations(is_verified);
CREATE INDEX idx_mfa_configurations_created_at ON mfa_configurations(created_at DESC);

CREATE INDEX idx_mfa_sessions_user_id ON mfa_sessions(user_id);
CREATE INDEX idx_mfa_sessions_session_id ON mfa_sessions(session_id);
CREATE INDEX idx_mfa_sessions_mfa_type ON mfa_sessions(mfa_type);
CREATE INDEX idx_mfa_sessions_expires_at ON mfa_sessions(expires_at);
CREATE INDEX idx_mfa_sessions_is_completed ON mfa_sessions(is_completed);
CREATE INDEX idx_mfa_sessions_created_at ON mfa_sessions(created_at DESC);

CREATE INDEX idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_device_id ON trusted_devices(device_id);
CREATE INDEX idx_trusted_devices_expires_at ON trusted_devices(expires_at);
CREATE INDEX idx_trusted_devices_is_active ON trusted_devices(is_active);
CREATE INDEX idx_trusted_devices_last_used_at ON trusted_devices(last_used_at DESC);

CREATE INDEX idx_mfa_logs_user_id ON mfa_logs(user_id);
CREATE INDEX idx_mfa_logs_log_type ON mfa_logs(log_type);
CREATE INDEX idx_mfa_logs_mfa_type ON mfa_logs(mfa_type);
CREATE INDEX idx_mfa_logs_success ON mfa_logs(success);
CREATE INDEX idx_mfa_logs_timestamp ON mfa_logs(timestamp DESC);
CREATE INDEX idx_mfa_logs_ip_address ON mfa_logs(ip_address);

CREATE INDEX idx_mfa_preferences_user_id ON mfa_preferences(user_id);
CREATE INDEX idx_mfa_preferences_require_mfa_on_new_device ON mfa_preferences(require_mfa_on_new_device);
CREATE INDEX idx_mfa_preferences_require_mfa_on_sensitive_actions ON mfa_preferences(require_mfa_on_sensitive_actions);

CREATE INDEX idx_security_keys_user_id ON security_keys(user_id);
CREATE INDEX idx_security_keys_key_id ON security_keys(key_id);
CREATE INDEX idx_security_keys_is_active ON security_keys(is_active);
CREATE INDEX idx_security_keys_last_used_at ON security_keys(last_used_at DESC);

CREATE INDEX idx_suspicious_login_attempts_user_id ON suspicious_login_attempts(user_id);
CREATE INDEX idx_suspicious_login_attempts_ip_address ON suspicious_login_attempts(ip_address);
CREATE INDEX idx_suspicious_login_attempts_is_blocked ON suspicious_login_attempts(is_blocked);
CREATE INDEX idx_suspicious_login_attempts_risk_score ON suspicious_login_attempts(risk_score DESC);
CREATE INDEX idx_suspicious_login_attempts_last_attempt_at ON suspicious_login_attempts(last_attempt_at DESC);

CREATE INDEX idx_mfa_statistics_date ON mfa_statistics(date);
CREATE INDEX idx_mfa_statistics_mfa_enabled_rate ON mfa_statistics(mfa_enabled_rate DESC);
CREATE INDEX idx_mfa_statistics_created_at ON mfa_statistics(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_mfa_configurations_updated_at 
    BEFORE UPDATE ON mfa_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mfa_sessions_updated_at 
    BEFORE UPDATE ON mfa_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trusted_devices_updated_at 
    BEFORE UPDATE ON trusted_devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mfa_preferences_updated_at 
    BEFORE UPDATE ON mfa_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mfa_statistics_updated_at 
    BEFORE UPDATE ON mfa_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_mfa_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO mfa_statistics (
        date,
        total_users,
        enabled_users,
        mfa_enabled_rate,
        verification_attempts,
        successful_verifications,
        failed_verifications,
        average_verification_time_ms,
        methods_by_type,
        suspicious_activities,
        trusted_devices,
        backup_codes_used,
        security_incidents,
        sessions_created,
        sessions_completed,
        sessions_expired
    )
    SELECT 
        CURRENT_DATE,
        (SELECT COUNT(*) FROM profiles) as total_users,
        (SELECT COUNT(*) FROM mfa_configurations WHERE is_active = true) as enabled_users,
        COALESCE(
            (SELECT COUNT(*) FROM mfa_configurations WHERE is_active = true)::DECIMAL / 
            NULLIF((SELECT COUNT(*) FROM profiles), 0) * 100, 
            0
        ) as mfa_enabled_rate,
        CASE WHEN NEW.log_type = 'verification' THEN 1 ELSE 0 END,
        CASE WHEN NEW.log_type = 'verification' AND NEW.success = true THEN 1 ELSE 0 END,
        CASE WHEN NEW.log_type = 'verification' AND NEW.success = false THEN 1 ELSE 0 END,
        COALESCE(NEW.duration_ms, 0),
        jsonb_build_object(NEW.mfa_type, 1),
        CASE WHEN NEW.log_type = 'suspicious_activity' THEN 1 ELSE 0 END,
        CASE WHEN NEW.log_type = 'device_trusted' THEN 1 ELSE 0 END,
        CASE WHEN NEW.log_type = 'backup_used' THEN 1 ELSE 0 END,
        CASE WHEN NEW.log_type = 'error' THEN 1 ELSE 0 END,
        CASE WHEN NEW.log_type = 'verification' THEN 1 ELSE 0 END,
        CASE WHEN NEW.log_type = 'verification' AND NEW.success = true THEN 1 ELSE 0 END,
        0 -- sessions_expired (calculé séparément)
    ON CONFLICT (date) DO UPDATE SET
        total_users = EXCLUDED.total_users,
        enabled_users = EXCLUDED.enabled_users,
        mfa_enabled_rate = EXCLUDED.mfa_enabled_rate,
        verification_attempts = mfa_statistics.verification_attempts + EXCLUDED.verification_attempts,
        successful_verifications = mfa_statistics.successful_verifications + EXCLUDED.successful_verifications,
        failed_verifications = mfa_statistics.failed_verifications + EXCLUDED.failed_verifications,
        average_verification_time_ms = (
            (mfa_statistics.average_verification_time_ms * mfa_statistics.verification_attempts + EXCLUDED.average_verification_time_ms) / 
            (mfa_statistics.verification_attempts + EXCLUDED.verification_attempts)
        ),
        methods_by_type = jsonb_set(
            mfa_statistics.methods_by_type,
            '{' || EXCLUDED.mfa_type || '}',
            COALESCE((mfa_statistics.methods_by_type->>EXCLUDED.mfa_type)::INTEGER, 0) + 1
        ),
        suspicious_activities = mfa_statistics.suspicious_activities + EXCLUDED.suspicious_activities,
        trusted_devices = mfa_statistics.trusted_devices + EXCLUDED.trusted_devices,
        backup_codes_used = mfa_statistics.backup_codes_used + EXCLUDED.backup_codes_used,
        security_incidents = mfa_statistics.security_incidents + EXCLUDED.security_incidents,
        sessions_created = mfa_statistics.sessions_created + EXCLUDED.sessions_created,
        sessions_completed = mfa_statistics.sessions_completed + EXCLUDED.sessions_completed,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mfa_statistics
    AFTER INSERT ON mfa_logs
    FOR EACH ROW EXECUTE FUNCTION update_mfa_statistics();

-- Trigger pour mettre à jour l'utilisation des appareils de confiance
CREATE OR REPLACE FUNCTION update_trusted_device_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE trusted_devices
    SET 
        last_used_at = NOW(),
        usage_count = usage_count + 1
    WHERE user_id = NEW.user_id
    AND device_id = NEW.device_id
    AND is_active = true;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trusted_device_usage
    AFTER INSERT ON mfa_logs
    FOR EACH ROW
    WHEN (NEW.log_type = 'verification' AND NEW.success = true AND NEW.device_id IS NOT NULL)
    EXECUTE FUNCTION update_trusted_device_usage();

-- Politiques RLS pour les configurations MFA
ALTER TABLE mfa_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own MFA configurations" ON mfa_configurations
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all MFA configurations" ON mfa_configurations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les sessions MFA
ALTER TABLE mfa_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own MFA sessions" ON mfa_sessions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all MFA sessions" ON mfa_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les appareils de confiance
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own trusted devices" ON trusted_devices
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all trusted devices" ON trusted_devices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les logs MFA
ALTER TABLE mfa_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own MFA logs" ON mfa_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all MFA logs" ON mfa_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les préférences MFA
ALTER TABLE mfa_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own MFA preferences" ON mfa_preferences
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les clés de sécurité
ALTER TABLE security_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own security keys" ON security_keys
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les tentatives suspectes
ALTER TABLE suspicious_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suspicious login attempts" ON suspicious_login_attempts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all suspicious login attempts" ON suspicious_login_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les statistiques MFA
ALTER TABLE mfa_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view MFA statistics" ON mfa_statistics
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage MFA statistics" ON mfa_statistics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour le MFA

-- Fonction pour obtenir les statistiques MFA
CREATE OR REPLACE FUNCTION get_mfa_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_users BIGINT,
    enabled_users BIGINT,
    mfa_enabled_rate DECIMAL(5,2),
    methods_by_type JSONB,
    verification_attempts BIGINT,
    success_rate DECIMAL(5,2),
    average_verification_time INTEGER,
    suspicious_activities BIGINT,
    trusted_devices BIGINT,
    backup_codes_used BIGINT,
    security_incidents BIGINT,
    trends JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH user_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM mfa_configurations mc 
                WHERE mc.user_id = profiles.id 
                AND mc.is_active = true
            )) as enabled
        FROM profiles
    ),
    method_breakdown AS (
        SELECT jsonb_object_agg(mfa_type, count)
        FROM (
            SELECT 
                mfa_type,
                COUNT(*) as count
            FROM mfa_configurations
            WHERE is_active = true
            GROUP BY mfa_type
        ) method_counts
    ),
    verification_stats AS (
        SELECT 
            COUNT(*) as attempts,
            COUNT(*) FILTER (WHERE success = true) as successful,
            COUNT(*) FILTER (WHERE success = false) as failed,
            COALESCE(AVG(duration_ms), 0) as avg_time
        FROM mfa_logs
        WHERE DATE(timestamp) = p_date
        AND log_type = 'verification'
    ),
    activity_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE log_type = 'suspicious_activity') as suspicious,
            COUNT(*) FILTER (WHERE log_type = 'device_trusted') as trusted,
            COUNT(*) FILTER (WHERE log_type = 'backup_used') as backup_used,
            COUNT(*) FILTER (WHERE log_type = 'error') as incidents
        FROM mfa_logs
        WHERE DATE(timestamp) = p_date
    ),
    trends_stats AS (
        SELECT jsonb_build_object(
            'enablementTrend', ARRAY(
                SELECT COALESCE(mfa_enabled_rate, 0)
                FROM mfa_statistics
                WHERE date >= p_date - INTERVAL '7 days'
                ORDER BY date ASC
            ),
            'verificationTrend', ARRAY(
                SELECT COALESCE(successful_verifications, 0)
                FROM mfa_statistics
                WHERE date >= p_date - INTERVAL '7 days'
                ORDER BY date ASC
            ),
            'securityTrend', ARRAY(
                SELECT COALESCE(suspicious_activities, 0)
                FROM mfa_statistics
                WHERE date >= p_date - INTERVAL '7 days'
                ORDER BY date ASC
            )
        )
    )
    SELECT 
        us.total as total_users,
        us.enabled as enabled_users,
        COALESCE(us.enabled::DECIMAL / NULLIF(us.total, 0) * 100, 0) as mfa_enabled_rate,
        mb.method_breakdown as methods_by_type,
        vs.attempts as verification_attempts,
        COALESCE(vs.successful::DECIMAL / NULLIF(vs.attempts, 0) * 100, 0) as success_rate,
        vs.avg_time::INTEGER as average_verification_time,
        COALESCE(as.suspicious, 0) as suspicious_activities,
        COALESCE(as.trusted, 0) as trusted_devices,
        COALESCE(as.backup_used, 0) as backup_codes_used,
        COALESCE(as.incidents, 0) as security_incidents,
        ts.trends_stats as trends
    FROM user_stats us, method_breakdown mb, verification_stats vs,
         activity_stats as, trends_stats ts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les préférences MFA par défaut
CREATE OR REPLACE FUNCTION create_default_mfa_preferences(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO mfa_preferences (
        user_id,
        remember_device,
        device_expiry_days,
        require_mfa_on_new_device,
        require_mfa_on_sensitive_actions,
        grace_period_days,
        notification_methods,
        backup_code_regeneration,
        backup_code_count,
        backup_code_length,
        totp_period,
        totp_digits,
        sms_enabled,
        email_enabled,
        push_enabled
    ) VALUES (
        p_user_id,
        true,
        30,
        true,
        true,
        7,
        ARRAY['email'],
        false,
        10,
        8,
        30,
        6,
        false,
        true,
        false
    )
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les sessions MFA expirées
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_sessions()
RETURNS TABLE (
    cleaned_sessions BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
BEGIN
    DELETE FROM mfa_sessions
    WHERE expires_at < NOW()
    OR (is_completed = false AND created_at < NOW() - INTERVAL '1 hour');
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les appareils de confiance expirés
CREATE OR REPLACE FUNCTION cleanup_expired_trusted_devices()
RETURNS TABLE (
    cleaned_devices BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
BEGIN
    UPDATE trusted_devices
    SET is_active = false
    WHERE expires_at < NOW()
    AND is_active = true;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_mfa_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO mfa_statistics (
        date,
        total_users,
        enabled_users,
        mfa_enabled_rate,
        verification_attempts,
        successful_verifications,
        failed_verifications,
        average_verification_time_ms,
        methods_by_type,
        suspicious_activities,
        trusted_devices,
        backup_codes_used,
        security_incidents,
        sessions_created,
        sessions_completed,
        sessions_expired
    )
    SELECT 
        p_date,
        (SELECT COUNT(*) FROM profiles) as total_users,
        (SELECT COUNT(*) FROM mfa_configurations WHERE is_active = true) as enabled_users,
        COALESCE(
            (SELECT COUNT(*) FROM mfa_configurations WHERE is_active = true)::DECIMAL / 
            NULLIF((SELECT COUNT(*) FROM profiles), 0) * 100, 
            0
        ) as mfa_enabled_rate,
        (SELECT COUNT(*) FROM mfa_logs WHERE DATE(timestamp) = p_date AND log_type = 'verification') as verification_attempts,
        (SELECT COUNT(*) FROM mfa_logs WHERE DATE(timestamp) = p_date AND log_type = 'verification' AND success = true) as successful_verifications,
        (SELECT COUNT(*) FROM mfa_logs WHERE DATE(timestamp) = p_date AND log_type = 'verification' AND success = false) as failed_verifications,
        COALESCE((SELECT AVG(duration_ms) FROM mfa_logs WHERE DATE(timestamp) = p_date AND log_type = 'verification'), 0) as average_verification_time_ms,
        (SELECT jsonb_object_agg(mfa_type, count) FROM (
            SELECT mfa_type, COUNT(*) as count
            FROM mfa_configurations
            WHERE is_active = true
            GROUP BY mfa_type
        ) method_counts) as methods_by_type,
        (SELECT COUNT(*) FROM mfa_logs WHERE DATE(timestamp) = p_date AND log_type = 'suspicious_activity') as suspicious_activities,
        (SELECT COUNT(*) FROM trusted_devices WHERE DATE(last_used_at) = p_date AND is_active = true) as trusted_devices,
        (SELECT COUNT(*) FROM mfa_logs WHERE DATE(timestamp) = p_date AND log_type = 'backup_used') as backup_codes_used,
        (SELECT COUNT(*) FROM mfa_logs WHERE DATE(timestamp) = p_date AND log_type = 'error') as security_incidents,
        (SELECT COUNT(*) FROM mfa_sessions WHERE DATE(created_at) = p_date) as sessions_created,
        (SELECT COUNT(*) FROM mfa_sessions WHERE DATE(completed_at) = p_date AND is_completed = true) as sessions_completed,
        (SELECT COUNT(*) FROM mfa_sessions WHERE DATE(expires_at) = p_date AND is_completed = false) as sessions_expired
    ON CONFLICT (date) DO UPDATE SET
        total_users = EXCLUDED.total_users,
        enabled_users = EXCLUDED.enabled_users,
        mfa_enabled_rate = EXCLUDED.mfa_enabled_rate,
        verification_attempts = EXCLUDED.verification_attempts,
        successful_verifications = EXCLUDED.successful_verifications,
        failed_verifications = EXCLUDED.failed_verifications,
        average_verification_time_ms = EXCLUDED.average_verification_time_ms,
        methods_by_type = EXCLUDED.methods_by_type,
        suspicious_activities = EXCLUDED.suspicious_activities,
        trusted_devices = EXCLUDED.trusted_devices,
        backup_codes_used = EXCLUDED.backup_codes_used,
        security_incidents = EXCLUDED.security_incidents,
        sessions_created = EXCLUDED.sessions_created,
        sessions_completed = EXCLUDED.sessions_completed,
        sessions_expired = EXCLUDED.sessions_expired,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE mfa_configurations IS 'Configurations MFA par utilisateur et type';
COMMENT ON TABLE mfa_sessions IS 'Sessions MFA temporaires pour la vérification';
COMMENT ON TABLE trusted_devices IS 'Appareils de confiance pour contourner MFA';
COMMENT ON TABLE mfa_logs IS 'Logs détaillés des activités MFA pour la sécurité';
COMMENT ON TABLE mfa_preferences IS 'Préférences MFA personnalisées par utilisateur';
COMMENT ON TABLE security_keys IS 'Clés de sécurité matérielles (WebAuthn)';
COMMENT ON TABLE suspicious_login_attempts IS 'Tentatives de connexion suspectes et blocages';
COMMENT ON TABLE mfa_statistics IS 'Statistiques agrégées du MFA par jour';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN mfa_configurations.secret IS 'Secret TOTP ou autres secrets chiffrés';
COMMENT ON COLUMN mfa_configurations.backup_codes IS 'Codes de sauvegarde chiffrés';
COMMENT ON COLUMN mfa_sessions.challenge IS 'Challenge pour la vérification MFA';
COMMENT ON COLUMN mfa_logs.metadata IS 'Métadonnées détaillées {sessionId, deviceId, riskScore}';
COMMENT ON TABLE trusted_devices IS 'Appareils de confiance avec expiration automatique';
COMMENT ON COLUMN suspicious_login_attempts.risk_score IS 'Score de risque 0-100 basé sur divers facteurs';
COMMENT ON COLUMN mfa_statistics.methods_by_type IS 'Répartition des méthodes MFA utilisées {totp: 10, sms: 5}';
