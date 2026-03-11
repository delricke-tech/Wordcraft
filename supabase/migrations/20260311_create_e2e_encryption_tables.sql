-- Migration: Création des tables pour le chiffrement E2E (sécurité maximale)
-- Date: 11 mars 2026
-- Description: Tables pour gérer le chiffrement de bout en bout, les clés asymétriques et la sécurité

-- Table des paires de clés E2E
CREATE TABLE IF NOT EXISTS e2e_key_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    key_id VARCHAR(255) NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    private_key TEXT NOT NULL, -- chiffré
    algorithm VARCHAR(20) NOT NULL CHECK (algorithm IN ('RSA-OAEP', 'RSA-PSS', 'ECDH', 'ECDSA', 'AES-GCM', 'AES-CBC')),
    key_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT,
    usage_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Table des messages chiffrés E2E
CREATE TABLE IF NOT EXISTS e2e_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    encrypted_content TEXT NOT NULL,
    encrypted_key TEXT NOT NULL,
    signature TEXT,
    algorithm VARCHAR(20) NOT NULL CHECK (algorithm IN ('RSA-OAEP', 'RSA-PSS', 'ECDH', 'ECDSA', 'AES-GCM', 'AES-CBC')),
    key_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) DEFAULT 'text/plain',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    decrypted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT false,
    is_forwarded BOOLEAN DEFAULT false,
    reply_to_id UUID REFERENCES e2e_messages(id) ON DELETE SET NULL,
    thread_id UUID,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10)
);

-- Table des sessions E2E
CREATE TABLE IF NOT EXISTS e2e_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    shared_secret TEXT NOT NULL, -- chiffré
    algorithm VARCHAR(20) NOT NULL CHECK (algorithm IN ('RSA-OAEP', 'RSA-PSS', 'ECDH', 'ECDSA', 'AES-GCM', 'AES-CBC')),
    key_id VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    message_count INTEGER DEFAULT 0,
    participant_ids UUID[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Table des échanges de clés E2E
CREATE TABLE IF NOT EXISTS e2e_key_exchanges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    responder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    encrypted_shared_secret TEXT DEFAULT '',
    algorithm VARCHAR(20) NOT NULL CHECK (algorithm IN ('RSA-OAEP', 'RSA-PSS', 'ECDH', 'ECDSA', 'AES-GCM', 'AES-CBC')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Table des signatures numériques E2E
CREATE TABLE IF NOT EXISTS e2e_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES e2e_messages(id) ON DELETE CASCADE,
    signer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    signature TEXT NOT NULL,
    algorithm VARCHAR(20) NOT NULL CHECK (algorithm IN ('RSA-OAEP', 'RSA-PSS', 'ECDH', 'ECDSA', 'AES-GCM', 'AES-CBC')),
    key_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified BOOLEAN DEFAULT false,
    verification_timestamp TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Table des audits de sécurité E2E
CREATE TABLE IF NOT EXISTS e2e_security_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    audit_type VARCHAR(50) NOT NULL CHECK (audit_type IN ('key_generation', 'key_deletion', 'encryption', 'decryption', 'key_exchange', 'signature', 'verification', 'unauthorized_access', 'key_compromise', 'data_leak', 'weak_algorithm')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT
);

-- Table des statistiques E2E
CREATE TABLE IF NOT EXISTS e2e_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_keys INTEGER DEFAULT 0,
    active_keys INTEGER DEFAULT 0,
    expired_keys INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    encrypted_messages INTEGER DEFAULT 0,
    decrypted_messages INTEGER DEFAULT 0,
    average_encryption_time INTEGER DEFAULT 0, -- en millisecondes
    average_decryption_time INTEGER DEFAULT 0, -- en millisecondes
    key_exchange_success_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (key_exchange_success_rate >= 0 AND key_exchange_success_rate <= 100),
    signature_verification_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (signature_verification_rate >= 0 AND signature_verification_rate <= 100),
    security_incidents INTEGER DEFAULT 0,
    algorithms_by_usage JSONB DEFAULT '{}',
    key_types_by_usage JSONB DEFAULT '{}',
    trends JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Table des politiques de sécurité E2E
CREATE TABLE IF NOT EXISTS e2e_security_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    require_e2e BOOLEAN DEFAULT true,
    require_signatures BOOLEAN DEFAULT true,
    key_rotation_days INTEGER DEFAULT 365,
    key_size_minimum INTEGER DEFAULT 2048,
    allowed_algorithms TEXT[] DEFAULT ARRAY['RSA-OAEP', 'ECDH'],
    forbidden_algorithms TEXT[] DEFAULT ARRAY['RSA-PSS', 'AES-CBC'],
    max_message_size_mb INTEGER DEFAULT 100,
    message_retention_days INTEGER DEFAULT 365,
    session_timeout_hours INTEGER DEFAULT 24,
    require_device_verification BOOLEAN DEFAULT false,
    backup_encryption BOOLEAN DEFAULT true,
    audit_logging BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des clés de rotation E2E
CREATE TABLE IF NOT EXISTS e2e_key_rotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    old_key_id VARCHAR(255) NOT NULL,
    new_key_id VARCHAR(255) NOT NULL,
    rotation_reason VARCHAR(100),
    rotation_type VARCHAR(50) NOT NULL CHECK (rotation_type IN ('scheduled', 'compromise', 'policy_update', 'user_request')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    affected_messages INTEGER DEFAULT 0,
    reencrypted_messages INTEGER DEFAULT 0,
    failed_messages INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Index pour les performances
CREATE INDEX idx_e2e_key_pairs_user_id ON e2e_key_pairs(user_id);
CREATE INDEX idx_e2e_key_pairs_key_id ON e2e_key_pairs(key_id);
CREATE INDEX idx_e2e_key_pairs_algorithm ON e2e_key_pairs(algorithm);
CREATE INDEX idx_e2e_key_pairs_is_active ON e2e_key_pairs(is_active);
CREATE INDEX idx_e2e_key_pairs_expires_at ON e2e_key_pairs(expires_at);
CREATE INDEX idx_e2e_key_pairs_created_at ON e2e_key_pairs(created_at DESC);

CREATE INDEX idx_e2e_messages_sender_id ON e2e_messages(sender_id);
CREATE INDEX idx_e2e_messages_recipient_id ON e2e_messages(recipient_id);
CREATE INDEX idx_e2e_messages_algorithm ON e2e_messages(algorithm);
CREATE INDEX idx_e2e_messages_key_id ON e2e_messages(key_id);
CREATE INDEX idx_e2e_messages_created_at ON e2e_messages(created_at DESC);
CREATE INDEX idx_e2e_messages_expires_at ON e2e_messages(expires_at);
CREATE INDEX idx_e2e_messages_is_read ON e2e_messages(is_read);
CREATE INDEX idx_e2e_messages_thread_id ON e2e_messages(thread_id);

CREATE INDEX idx_e2e_sessions_user_id ON e2e_sessions(user_id);
CREATE INDEX idx_e2e_sessions_session_id ON e2e_sessions(session_id);
CREATE INDEX idx_e2e_sessions_algorithm ON e2e_sessions(algorithm);
CREATE INDEX idx_e2e_sessions_expires_at ON e2e_sessions(expires_at);
CREATE INDEX idx_e2e_sessions_is_active ON e2e_sessions(is_active);
CREATE INDEX idx_e2e_sessions_created_at ON e2e_sessions(created_at DESC);

CREATE INDEX idx_e2e_key_exchanges_initiator_id ON e2e_key_exchanges(initiator_id);
CREATE INDEX idx_e2e_key_exchanges_responder_id ON e2e_key_exchanges(responder_id);
CREATE INDEX idx_e2e_key_exchanges_algorithm ON e2e_key_exchanges(algorithm);
CREATE INDEX idx_e2e_key_exchanges_status ON e2e_key_exchanges(status);
CREATE INDEX idx_e2e_key_exchanges_created_at ON e2e_key_exchanges(created_at DESC);
CREATE INDEX idx_e2e_key_exchanges_expires_at ON e2e_key_exchanges(expires_at);

CREATE INDEX idx_e2e_signatures_message_id ON e2e_signatures(message_id);
CREATE INDEX idx_e2e_signatures_signer_id ON e2e_signatures(signer_id);
CREATE INDEX idx_e2e_signatures_algorithm ON e2e_signatures(algorithm);
CREATE INDEX idx_e2e_signatures_verified ON e2e_signatures(verified);
CREATE INDEX idx_e2e_signatures_timestamp ON e2e_signatures(timestamp DESC);

CREATE INDEX idx_e2e_security_audits_user_id ON e2e_security_audits(user_id);
CREATE INDEX idx_e2e_security_audits_audit_type ON e2e_security_audits(audit_type);
CREATE INDEX idx_e2e_security_audits_severity ON e2e_security_audits(severity);
CREATE INDEX idx_e2e_security_audits_timestamp ON e2e_security_audits(timestamp DESC);
CREATE INDEX idx_e2e_security_audits_resolved ON e2e_security_audits(resolved);

CREATE INDEX idx_e2e_statistics_date ON e2e_statistics(date);
CREATE INDEX idx_e2e_statistics_created_at ON e2e_statistics(created_at DESC);

CREATE INDEX idx_e2e_security_policies_user_id ON e2e_security_policies(user_id);
CREATE INDEX idx_e2e_security_policies_require_e2e ON e2e_security_policies(require_e2e);
CREATE INDEX idx_e2e_security_policies_updated_at ON e2e_security_policies(updated_at DESC);

CREATE INDEX idx_e2e_key_rotations_user_id ON e2e_key_rotations(user_id);
CREATE INDEX idx_e2e_key_rotations_old_key_id ON e2e_key_rotations(old_key_id);
CREATE INDEX idx_e2e_key_rotations_new_key_id ON e2e_key_rotations(new_key_id);
CREATE INDEX idx_e2e_key_rotations_rotation_type ON e2e_key_rotations(rotation_type);
CREATE INDEX idx_e2e_key_rotations_status ON e2e_key_rotations(status);
CREATE INDEX idx_e2e_key_rotations_started_at ON e2e_key_rotations(started_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_e2e_key_pairs_updated_at 
    BEFORE UPDATE ON e2e_key_pairs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_e2e_sessions_updated_at 
    BEFORE UPDATE ON e2e_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_e2e_security_policies_updated_at 
    BEFORE UPDATE ON e2e_security_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_e2e_statistics_updated_at 
    BEFORE UPDATE ON e2e_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_e2e_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO e2e_statistics (
        date,
        total_keys,
        active_keys,
        expired_keys,
        total_messages,
        encrypted_messages,
        decrypted_messages,
        average_encryption_time,
        average_decryption_time,
        key_exchange_success_rate,
        signature_verification_rate,
        security_incidents,
        algorithms_by_usage,
        key_types_by_usage,
        trends
    )
    SELECT 
        CURRENT_DATE,
        (SELECT COUNT(*) FROM e2e_key_pairs) as total_keys,
        (SELECT COUNT(*) FROM e2e_key_pairs WHERE is_active = true AND expires_at > NOW()) as active_keys,
        (SELECT COUNT(*) FROM e2e_key_pairs WHERE expires_at <= NOW()) as expired_keys,
        (SELECT COUNT(*) FROM e2e_messages) as total_messages,
        (SELECT COUNT(*) FROM e2e_messages WHERE encrypted_content IS NOT NULL) as encrypted_messages,
        (SELECT COUNT(*) FROM e2e_messages WHERE decrypted_at IS NOT NULL) as decrypted_messages,
        COALESCE(AVG((metadata->>'encryptionTime')::INTEGER), 0) as average_encryption_time,
        COALESCE(AVG((metadata->>'decryptionTime')::INTEGER), 0) as average_decryption_time,
        COALESCE(
            (SELECT COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0) * 100
             FROM e2e_key_exchanges
             WHERE DATE(created_at) = CURRENT_DATE), 
            0
        ) as key_exchange_success_rate,
        COALESCE(
            (SELECT COUNT(*) FILTER (WHERE verified = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100
             FROM e2e_signatures
             WHERE DATE(timestamp) = CURRENT_DATE), 
            0
        ) as signature_verification_rate,
        (SELECT COUNT(*) FROM e2e_security_audits WHERE DATE(timestamp) = CURRENT_DATE) as security_incidents,
        jsonb_build_object(
            'RSA-OAEP', (SELECT COUNT(*) FROM e2e_key_pairs WHERE algorithm = 'RSA-OAEP' AND is_active = true),
            'RSA-PSS', (SELECT COUNT(*) FROM e2e_key_pairs WHERE algorithm = 'RSA-PSS' AND is_active = true),
            'ECDH', (SELECT COUNT(*) FROM e2e_key_pairs WHERE algorithm = 'ECDH' AND is_active = true),
            'ECDSA', (SELECT COUNT(*) FROM e2e_key_pairs WHERE algorithm = 'ECDSA' AND is_active = true),
            'AES-GCM', (SELECT COUNT(*) FROM e2e_key_pairs WHERE algorithm = 'AES-GCM' AND is_active = true),
            'AES-CBC', (SELECT COUNT(*) FROM e2e_key_pairs WHERE algorithm = 'AES-CBC' AND is_active = true)
        ),
        jsonb_build_object(
            'public', (SELECT COUNT(*) FROM e2e_key_pairs WHERE metadata->>'keyType' = 'public' AND is_active = true),
            'private', (SELECT COUNT(*) FROM e2e_key_pairs WHERE metadata->>'keyType' = 'private' AND is_active = true),
            'symmetric', (SELECT COUNT(*) FROM e2e_key_pairs WHERE metadata->>'keyType' = 'symmetric' AND is_active = true)
        ),
        jsonb_build_object(
            'encryptionTrend', ARRAY(SELECT COUNT(*) FROM e2e_messages WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY DATE(created_at)),
            'decryptionTrend', ARRAY(SELECT COUNT(*) FROM e2e_messages WHERE DATE(decrypted_at) >= CURRENT_DATE - INTERVAL '7 days' GROUP BY DATE(decrypted_at) ORDER BY DATE(decrypted_at)),
            'securityTrend', ARRAY(SELECT COUNT(*) FROM e2e_security_audits WHERE DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days' GROUP BY DATE(timestamp) ORDER BY DATE(timestamp))
        )
    ON CONFLICT (date) DO UPDATE SET
        total_keys = EXCLUDED.total_keys,
        active_keys = EXCLUDED.active_keys,
        expired_keys = EXCLUDED.expired_keys,
        total_messages = EXCLUDED.total_messages,
        encrypted_messages = EXCLUDED.encrypted_messages,
        decrypted_messages = EXCLUDED.decrypted_messages,
        average_encryption_time = EXCLUDED.average_encryption_time,
        average_decryption_time = EXCLUDED.average_decryption_time,
        key_exchange_success_rate = EXCLUDED.key_exchange_success_rate,
        signature_verification_rate = EXCLUDED.signature_verification_rate,
        security_incidents = EXCLUDED.security_incidents,
        algorithms_by_usage = EXCLUDED.algorithms_by_usage,
        key_types_by_usage = EXCLUDED.key_types_by_usage,
        trends = EXCLUDED.trends,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_e2e_statistics
    AFTER INSERT ON e2e_key_pairs
    FOR EACH ROW EXECUTE FUNCTION update_e2e_statistics();

CREATE TRIGGER trigger_update_e2e_statistics_messages
    AFTER INSERT ON e2e_messages
    FOR EACH ROW EXECUTE FUNCTION update_e2e_statistics();

CREATE TRIGGER trigger_update_e2e_statistics_audits
    AFTER INSERT ON e2e_security_audits
    FOR EACH ROW EXECUTE FUNCTION update_e2e_statistics();

-- Trigger pour mettre à jour l'utilisation des clés
CREATE OR REPLACE FUNCTION update_e2e_key_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE e2e_key_pairs
    SET 
        last_used_at = NOW(),
        usage_count = usage_count + 1
    WHERE key_id = NEW.key_id
    AND user_id = NEW.recipient_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_e2e_key_usage
    AFTER INSERT ON e2e_messages
    FOR EACH ROW EXECUTE FUNCTION update_e2e_key_usage();

-- Trigger pour mettre à jour les sessions
CREATE OR REPLACE FUNCTION update_e2e_session_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE e2e_sessions
    SET 
        last_used_at = NOW(),
        message_count = message_count + 1
    WHERE session_id = (
        SELECT metadata->>'sessionId' 
        FROM e2e_messages 
        WHERE id = NEW.id
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_e2e_session_usage
    AFTER INSERT ON e2e_messages
    FOR EACH ROW EXECUTE FUNCTION update_e2e_session_usage();

-- Politiques RLS pour les paires de clés
ALTER TABLE e2e_key_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own E2E key pairs" ON e2e_key_pairs
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all E2E key pairs" ON e2e_key_pairs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les messages
ALTER TABLE e2e_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own E2E messages" ON e2e_messages
    FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Admins can view all E2E messages" ON e2e_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les sessions
ALTER TABLE e2e_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own E2E sessions" ON e2e_sessions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all E2E sessions" ON e2e_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les échanges de clés
ALTER TABLE e2e_key_exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own E2E key exchanges" ON e2e_key_exchanges
    FOR ALL USING (initiator_id = auth.uid() OR responder_id = auth.uid());

CREATE POLICY "Admins can view all E2E key exchanges" ON e2e_key_exchanges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les signatures
ALTER TABLE e2e_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own E2E signatures" ON e2e_signatures
    FOR SELECT USING (signer_id = auth.uid());

CREATE POLICY "Admins can view all E2E signatures" ON e2e_signatures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les audits de sécurité
ALTER TABLE e2e_security_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own E2E security audits" ON e2e_security_audits
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all E2E security audits" ON e2e_security_audits
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
ALTER TABLE e2e_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view E2E statistics" ON e2e_statistics
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage E2E statistics" ON e2e_statistics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les politiques de sécurité
ALTER TABLE e2e_security_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own E2E security policies" ON e2e_security_policies
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les rotations de clés
ALTER TABLE e2e_key_rotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own E2E key rotations" ON e2e_key_rotations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all E2E key rotations" ON e2e_key_rotations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour le chiffrement E2E

-- Fonction pour obtenir les statistiques E2E
CREATE OR REPLACE FUNCTION get_e2e_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_keys BIGINT,
    active_keys BIGINT,
    expired_keys BIGINT,
    total_messages BIGINT,
    encrypted_messages BIGINT,
    decrypted_messages BIGINT,
    average_encryption_time INTEGER,
    average_decryption_time INTEGER,
    key_exchange_success_rate DECIMAL(5,2),
    signature_verification_rate DECIMAL(5,2),
    security_incidents BIGINT,
    algorithms_by_usage JSONB,
    key_types_by_usage JSONB,
    trends JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH key_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_active = true AND expires_at > NOW()) as active,
            COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired
        FROM e2e_key_pairs
    ),
    message_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE encrypted_content IS NOT NULL) as encrypted,
            COUNT(*) FILTER (WHERE decrypted_at IS NOT NULL) as decrypted,
            COALESCE(AVG((metadata->>'encryptionTime')::INTEGER), 0) as avg_encryption_time,
            COALESCE(AVG((metadata->>'decryptionTime')::INTEGER), 0) as avg_decryption_time
        FROM e2e_messages
    ),
    exchange_stats AS (
        SELECT 
            COALESCE(
                COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 
                0
            ) as success_rate
        FROM e2e_key_exchanges
        WHERE DATE(created_at) = p_date
    ),
    signature_stats AS (
        SELECT 
            COALESCE(
                COUNT(*) FILTER (WHERE verified = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 
                0
            ) as verification_rate
        FROM e2e_signatures
        WHERE DATE(timestamp) = p_date
    ),
    algorithm_breakdown AS (
        SELECT jsonb_object_agg(algorithm, count)
        FROM (
            SELECT 
                algorithm,
                COUNT(*) as count
            FROM e2e_key_pairs
            WHERE is_active = true
            GROUP BY algorithm
        ) algo_counts
    ),
    key_type_breakdown AS (
        SELECT jsonb_object_agg(key_type, count)
        FROM (
            SELECT 
                metadata->>'keyType' as key_type,
                COUNT(*) as count
            FROM e2e_key_pairs
            WHERE is_active = true
            GROUP BY metadata->>'keyType'
        ) type_counts
    ),
    trends_stats AS (
        SELECT jsonb_build_object(
            'encryptionTrend', ARRAY(
                SELECT COUNT(*) 
                FROM e2e_messages 
                WHERE DATE(created_at) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'decryptionTrend', ARRAY(
                SELECT COUNT(*) 
                FROM e2e_messages 
                WHERE DATE(decrypted_at) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(decrypted_at) 
                ORDER BY DATE(decrypted_at)
            ),
            'securityTrend', ARRAY(
                SELECT COUNT(*) 
                FROM e2e_security_audits 
                WHERE DATE(timestamp) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(timestamp) 
                ORDER BY DATE(timestamp)
            )
        )
    )
    SELECT 
        ks.total as total_keys,
        ks.active as active_keys,
        ks.expired as expired_keys,
        ms.total as total_messages,
        ms.encrypted as encrypted_messages,
        ms.decrypted as decrypted_messages,
        ms.avg_encryption_time as average_encryption_time,
        ms.avg_decryption_time as average_decryption_time,
        es.success_rate as key_exchange_success_rate,
        ss.verification_rate as signature_verification_rate,
        (SELECT COUNT(*) FROM e2e_security_audits WHERE DATE(timestamp) = p_date) as security_incidents,
        ab.algorithm_breakdown as algorithms_by_usage,
        ktb.key_type_breakdown as key_types_by_usage,
        ts.trends_stats as trends
    FROM key_stats ks, message_stats ms, exchange_stats es,
         signature_stats ss, algorithm_breakdown ab, key_type_breakdown ktb,
         trends_stats ts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les politiques de sécurité par défaut
CREATE OR REPLACE FUNCTION create_default_e2e_security_policy(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO e2e_security_policies (
        user_id,
        require_e2e,
        require_signatures,
        key_rotation_days,
        key_size_minimum,
        allowed_algorithms,
        forbidden_algorithms,
        max_message_size_mb,
        message_retention_days,
        session_timeout_hours,
        require_device_verification,
        backup_encryption,
        audit_logging
    ) VALUES (
        p_user_id,
        true,
        true,
        365,
        2048,
        ARRAY['RSA-OAEP', 'ECDH'],
        ARRAY['RSA-PSS', 'AES-CBC'],
        100,
        365,
        24,
        false,
        true,
        true
    )
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les clés expirées
CREATE OR REPLACE FUNCTION cleanup_expired_e2e_keys()
RETURNS TABLE (
    cleaned_keys BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
BEGIN
    UPDATE e2e_key_pairs
    SET is_active = false, is_revoked = true, revoked_at = NOW(), revoked_reason = 'expired'
    WHERE expires_at <= NOW()
    AND is_active = true;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_e2e_sessions()
RETURNS TABLE (
    cleaned_sessions BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
BEGIN
    UPDATE e2e_sessions
    SET is_active = false
    WHERE expires_at <= NOW()
    AND is_active = true;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_e2e_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO e2e_statistics (
        date,
        total_keys,
        active_keys,
        expired_keys,
        total_messages,
        encrypted_messages,
        decrypted_messages,
        average_encryption_time,
        average_decryption_time,
        key_exchange_success_rate,
        signature_verification_rate,
        security_incidents,
        algorithms_by_usage,
        key_types_by_usage,
        trends
    )
    SELECT 
        p_date,
        (SELECT COUNT(*) FROM e2e_key_pairs) as total_keys,
        (SELECT COUNT(*) FROM e2e_key_pairs WHERE is_active = true AND expires_at > NOW()) as active_keys,
        (SELECT COUNT(*) FROM e2e_key_pairs WHERE expires_at <= NOW()) as expired_keys,
        (SELECT COUNT(*) FROM e2e_messages WHERE DATE(created_at) = p_date) as total_messages,
        (SELECT COUNT(*) FROM e2e_messages WHERE DATE(created_at) = p_date AND encrypted_content IS NOT NULL) as encrypted_messages,
        (SELECT COUNT(*) FROM e2e_messages WHERE DATE(decrypted_at) = p_date) as decrypted_messages,
        COALESCE(AVG((metadata->>'encryptionTime')::INTEGER), 0) as average_encryption_time,
        COALESCE(AVG((metadata->>'decryptionTime')::INTEGER), 0) as average_decryption_time,
        COALESCE(
            (SELECT COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0) * 100
             FROM e2e_key_exchanges
             WHERE DATE(created_at) = p_date), 
            0
        ) as key_exchange_success_rate,
        COALESCE(
            (SELECT COUNT(*) FILTER (WHERE verified = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100
             FROM e2e_signatures
             WHERE DATE(timestamp) = p_date), 
            0
        ) as signature_verification_rate,
        (SELECT COUNT(*) FROM e2e_security_audits WHERE DATE(timestamp) = p_date) as security_incidents,
        jsonb_build_object(
            'RSA-OAEP', (SELECT COUNT(*) FROM e2e_key_pairs WHERE algorithm = 'RSA-OAEP' AND is_active = true),
            'RSA-PSS', (SELECT COUNT(*) FROM e2e_key_pairs WHERE algorithm = 'RSA-PSS' AND is_active = true),
            'ECDH', (SELECT COUNT(*) FROM e2e_key_pairs WHERE algorithm = 'ECDH' AND is_active = true),
            'ECDSA', (SELECT COUNT(*) FROM e2e_key_pairs WHERE algorithm = 'ECDSA' AND is_active = true),
            'AES-GCM', (SELECT COUNT(*) FROM e2e_key_pairs WHERE algorithm = 'AES-GCM' AND is_active = true),
            'AES-CBC', (SELECT COUNT(*) FROM e2e_key_pairs WHERE algorithm = 'AES-CBC' AND is_active = true)
        ),
        jsonb_build_object(
            'public', (SELECT COUNT(*) FROM e2e_key_pairs WHERE metadata->>'keyType' = 'public' AND is_active = true),
            'private', (SELECT COUNT(*) FROM e2e_key_pairs WHERE metadata->>'keyType' = 'private' AND is_active = true),
            'symmetric', (SELECT COUNT(*) FROM e2e_key_pairs WHERE metadata->>'keyType' = 'symmetric' AND is_active = true)
        ),
        jsonb_build_object(
            'encryptionTrend', ARRAY(SELECT COUNT(*) FROM e2e_messages WHERE DATE(created_at) >= p_date - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY DATE(created_at)),
            'decryptionTrend', ARRAY(SELECT COUNT(*) FROM e2e_messages WHERE DATE(decrypted_at) >= p_date - INTERVAL '7 days' GROUP BY DATE(decrypted_at) ORDER BY DATE(decrypted_at)),
            'securityTrend', ARRAY(SELECT COUNT(*) FROM e2e_security_audits WHERE DATE(timestamp) >= p_date - INTERVAL '7 days' GROUP BY DATE(timestamp) ORDER BY DATE(timestamp))
        )
    ON CONFLICT (date) DO UPDATE SET
        total_keys = EXCLUDED.total_keys,
        active_keys = EXCLUDED.active_keys,
        expired_keys = EXCLUDED.expired_keys,
        total_messages = EXCLUDED.total_messages,
        encrypted_messages = EXCLUDED.encrypted_messages,
        decrypted_messages = EXCLUDED.decrypted_messages,
        average_encryption_time = EXCLUDED.average_encryption_time,
        average_decryption_time = EXCLUDED.average_decryption_time,
        key_exchange_success_rate = EXCLUDED.key_exchange_success_rate,
        signature_verification_rate = EXCLUDED.signature_verification_rate,
        security_incidents = EXCLUDED.security_incidents,
        algorithms_by_usage = EXCLUDED.algorithms_by_usage,
        key_types_by_usage = EXCLUDED.key_types_by_usage,
        trends = EXCLUDED.trends,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE e2e_key_pairs IS 'Paires de clés asymétriques pour le chiffrement E2E';
COMMENT ON TABLE e2e_messages IS 'Messages chiffrés de bout en bout avec métadonnées';
COMMENT ON TABLE e2e_sessions IS 'Sessions E2E pour le partage de secrets';
COMMENT ON TABLE e2e_key_exchanges IS 'Échanges de clés pour établir des secrets partagés';
COMMENT ON TABLE e2e_signatures IS 'Signatures numériques pour l\'authenticité des messages';
COMMENT ON TABLE e2e_security_audits IS 'Audits de sécurité pour la traçabilité des opérations';
COMMENT ON TABLE e2e_statistics IS 'Statistiques d\'utilisation et de performance du chiffrement E2E';
COMMENT ON TABLE e2e_security_policies IS 'Politiques de sécurité personnalisées par utilisateur';
COMMENT ON TABLE e2e_key_rotations IS 'Rotations automatiques et manuelles des clés E2E';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN e2e_key_pairs.private_key IS 'Clé privée chiffrée avec dérivation de mot de passe';
COMMENT ON COLUMN e2e_key_pairs.metadata IS 'Métadonnées techniques {keyType, usage, extractable, algorithm}';
COMMENT ON COLUMN e2e_messages.encrypted_content IS 'Contenu chiffré avec clé symétrique AES-GCM';
COMMENT ON COLUMN e2e_messages.encrypted_key IS 'Clé symétrique chiffrée avec clé publique du destinataire';
COMMENT ON COLUMN e2e_messages.metadata IS 'Métadonnées du message {size, checksum, compression, nonce}';
COMMENT ON COLUMN e2e_sessions.shared_secret IS 'Secret partagé chiffré pour la session';
COMMENT ON COLUMN e2e_key_exchanges.encrypted_shared_secret IS 'Secret partagé chiffré après échange';
COMMENT ON COLUMN e2e_security_audits.details IS 'Détails de l\'audit {encryptionTime, keySize, algorithm}';
COMMENT ON COLUMN e2e_statistics.algorithms_by_usage IS 'Répartition des algorithmes par type d\'utilisation';
