-- Migration: Création des tables pour la conformité RGPD/Privacy
-- Date: 11 mars 2026
-- Description: Tables pour gérer le consentement utilisateur, les demandes RGPD et la conformité

-- Table des consentements RGPD
CREATE TABLE IF NOT EXISTS gdpr_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('analytics', 'marketing', 'personalization', 'functional', 'necessary', 'social_media', 'advertising', 'affiliation', 'crisis_management', 'research')),
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    granted BOOLEAN DEFAULT false,
    granted_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    location JSONB DEFAULT '{}', -- {country, region, city, timezone, isEU, gdprApplies}
    purposes JSONB DEFAULT '[]',
    legitimate_interests JSONB DEFAULT '[]',
    data_categories TEXT[] DEFAULT '{}',
    third_parties JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des demandes RGPD
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection', 'withdrawal', 'complaint', 'inquiry')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'expired', 'cancelled')),
    description TEXT NOT NULL,
    data_categories TEXT[] DEFAULT '{}',
    time_range JSONB, -- {startDate, endDate}
    format VARCHAR(20) DEFAULT 'json' CHECK (format IN ('json', 'csv', 'xml', 'pdf', 'html', 'structured')),
    delivery_method VARCHAR(20) DEFAULT 'download' CHECK (delivery_method IN ('download', 'email', 'postal', 'secure_transfer', 'api')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    result_data TEXT, -- Données résultantes (formatées)
    result_file_path TEXT, -- Chemin du fichier de résultat
    rejection_reason TEXT
);

-- Table des enregistrements de données RGPD
CREATE TABLE IF NOT EXISTS gdpr_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('personal_data', 'special_category_data', 'criminal_data', 'children_data', 'employee_data', 'customer_data', 'analytics_data', 'communication_data')),
    data_subject_id VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    category VARCHAR(100) NOT NULL,
    source VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    legal_basis VARCHAR(50) NOT NULL CHECK (legal_basis IN ('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests')),
    consent_id UUID REFERENCES gdpr_consents(id) ON DELETE SET NULL,
    retention_period INTEGER NOT NULL, -- en jours
    expires_at TIMESTAMP WITH TIME ZONE,
    is_anonymized BOOLEAN DEFAULT false,
    is_encrypted BOOLEAN DEFAULT false,
    cross_border_transfer BOOLEAN DEFAULT false,
    third_party_sharing BOOLEAN DEFAULT false,
    processing_activities JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Table des politiques RGPD
CREATE TABLE IF NOT EXISTS gdpr_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    jurisdiction VARCHAR(100) NOT NULL DEFAULT 'EU',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    content JSONB NOT NULL, -- {sections, appendices, definitions, examples}
    consent_requirements JSONB DEFAULT '[]',
    data_subject_rights JSONB DEFAULT '[]',
    retention_policies JSONB DEFAULT '[]',
    breach_procedures JSONB DEFAULT '[]',
    contact_info JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Table des logs d'audit RGPD
CREATE TABLE IF NOT EXISTS gdpr_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('consent', 'request', 'processing', 'security', 'compliance', 'breach')),
    affected_records INTEGER DEFAULT 0,
    automated BOOLEAN DEFAULT false,
    reference_id UUID, -- Référence à l'entité concernée
    reference_type VARCHAR(50) -- Type de l'entité (consent, request, record, policy)
);

-- Table des incidents de sécurité RGPD
CREATE TABLE IF NOT EXISTS gdpr_breach_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id VARCHAR(100) NOT NULL UNIQUE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    breach_type VARCHAR(50) NOT NULL CHECK (breach_type IN ('unauthorized_access', 'data_loss', 'data_corruption', 'system_compromise', 'phishing', 'malware', 'physical_theft', 'human_error')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    affected_data_categories TEXT[] DEFAULT '{}',
    affected_users INTEGER DEFAULT 0,
    discovery_method VARCHAR(100),
    discovery_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notification_date TIMESTAMP WITH TIME ZONE,
    containment_date TIMESTAMP WITH TIME ZONE,
    resolution_date TIMESTAMP WITH TIME ZONE,
    root_cause TEXT,
    impact_assessment JSONB DEFAULT '{}',
    mitigation_actions JSONB DEFAULT '[]',
    preventive_measures JSONB DEFAULT '[]',
    notification_sent BOOLEAN DEFAULT false,
    notification_method TEXT[],
    supervisory_authority_notified BOOLEAN DEFAULT false,
    dpo_notified BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'contained', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Table des sous-traitants RGPD
CREATE TABLE IF NOT EXISTS gdpr_subprocessors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('hosting', 'analytics', 'marketing', 'payment', 'communication', 'security', 'development', 'support')),
    location VARCHAR(100) NOT NULL,
    services TEXT[] NOT NULL,
    data_categories TEXT[] DEFAULT '{}',
    processing_purposes TEXT[] NOT NULL,
    legal_basis VARCHAR(50) NOT NULL CHECK (legal_basis IN ('consent', 'contract', 'legal_obligation', 'legitimate_interests')),
    contract_reference VARCHAR(255),
    contract_signed_date TIMESTAMP WITH TIME ZONE,
    data_protection_impact_assessment BOOLEAN DEFAULT false,
    security_measures JSONB DEFAULT '[]',
    breach_procedures JSONB DEFAULT '[]',
    contact_info JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des transferts de données transfrontaliers
CREATE TABLE IF NOT EXISTS gdpr_cross_border_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    transfer_type VARCHAR(50) NOT NULL CHECK (transfer_type IN ('export', 'import', 'processing')),
    destination_country VARCHAR(100) NOT NULL,
    destination_entity VARCHAR(255),
    data_categories TEXT[] NOT NULL,
    legal_basis VARCHAR(50) NOT NULL CHECK (legal_basis IN ('adequacy_decision', 'safeguards', 'derogations')),
    safeguards JSONB DEFAULT '{}', -- {type: 'SCCs', 'BCRs', 'binding_contract', etc.}
    purpose TEXT NOT NULL,
    transfer_frequency VARCHAR(20) DEFAULT 'ad_hoc' CHECK (transfer_frequency IN ('ad_hoc', 'daily', 'weekly', 'monthly', 'continuous')),
    volume_estimate VARCHAR(50), -- estimation du volume de données
    risk_assessment JSONB DEFAULT '{}',
    impact_assessment JSONB DEFAULT '{}',
    monitoring_required BOOLEAN DEFAULT false,
    monitoring_frequency VARCHAR(20) DEFAULT 'monthly',
    consent_id UUID REFERENCES gdpr_consents(id) ON DELETE SET NULL,
    subprocessor_id UUID REFERENCES gdpr_subprocessors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Table des statistiques RGPD
CREATE TABLE IF NOT EXISTS gdpr_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_consents INTEGER DEFAULT 0,
    active_consents INTEGER DEFAULT 0,
    expired_consents INTEGER DEFAULT 0,
    revoked_consents INTEGER DEFAULT 0,
    consent_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (consent_rate >= 0 AND consent_rate <= 100),
    withdrawal_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (withdrawal_rate >= 0 AND withdrawal_rate <= 100),
    requests_by_type JSONB DEFAULT '{}',
    requests_by_status JSONB DEFAULT '{}',
    average_processing_time INTEGER DEFAULT 0, -- en jours
    data_records_count INTEGER DEFAULT 0,
    anonymized_records INTEGER DEFAULT 0,
    deleted_records INTEGER DEFAULT 0,
    cross_border_transfers INTEGER DEFAULT 0,
    third_party_sharing INTEGER DEFAULT 0,
    breach_incidents INTEGER DEFAULT 0,
    compliance_score DECIMAL(5,2) DEFAULT 0.00 CHECK (compliance_score >= 0 AND compliance_score <= 100),
    trends JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Index pour les performances
CREATE INDEX idx_gdpr_consents_user_id ON gdpr_consents(user_id);
CREATE INDEX idx_gdpr_consents_consent_type ON gdpr_consents(consent_type);
CREATE INDEX idx_gdpr_consents_granted ON gdpr_consents(granted);
CREATE INDEX idx_gdpr_consents_expires_at ON gdpr_consents(expires_at);
CREATE INDEX idx_gdpr_consents_created_at ON gdpr_consents(created_at DESC);

CREATE INDEX idx_gdpr_requests_user_id ON gdpr_requests(user_id);
CREATE INDEX idx_gdpr_requests_request_type ON gdpr_requests(request_type);
CREATE INDEX idx_gdpr_requests_status ON gdpr_requests(status);
CREATE INDEX idx_gdpr_requests_created_at ON gdpr_requests(created_at DESC);
CREATE INDEX idx_gdpr_requests_expires_at ON gdpr_requests(expires_at);

CREATE INDEX idx_gdpr_records_user_id ON gdpr_records(user_id);
CREATE INDEX idx_gdpr_records_record_type ON gdpr_records(record_type);
CREATE INDEX idx_gdpr_records_category ON gdpr_records(category);
CREATE INDEX idx_gdpr_records_legal_basis ON gdpr_records(legal_basis);
CREATE INDEX idx_gdpr_records_expires_at ON gdpr_records(expires_at);
CREATE INDEX idx_gdpr_records_is_anonymized ON gdpr_records(is_anonymized);
CREATE INDEX idx_gdpr_records_created_at ON gdpr_records(created_at DESC);
CREATE INDEX idx_gdpr_records_deleted_at ON gdpr_records(deleted_at DESC);

CREATE INDEX idx_gdpr_policies_version ON gdpr_policies(version);
CREATE INDEX idx_gdpr_policies_jurisdiction ON gdpr_policies(jurisdiction);
CREATE INDEX idx_gdpr_policies_language ON gdpr_policies(language);
CREATE INDEX idx_gdpr_policies_is_active ON gdpr_policies(is_active);
CREATE INDEX idx_gdpr_policies_effective_date ON gdpr_policies(effective_date DESC);

CREATE INDEX idx_gdpr_audit_logs_user_id ON gdpr_audit_logs(user_id);
CREATE INDEX idx_gdpr_audit_logs_event_type ON gdpr_audit_logs(event_type);
CREATE INDEX idx_gdpr_audit_logs_timestamp ON gdpr_audit_logs(timestamp DESC);
CREATE INDEX idx_gdpr_audit_logs_severity ON gdpr_audit_logs(severity);
CREATE INDEX idx_gdpr_audit_logs_category ON gdpr_audit_logs(category);
CREATE INDEX idx_gdpr_audit_logs_reference_id ON gdpr_audit_logs(reference_id);

CREATE INDEX idx_gdpr_breach_incidents_user_id ON gdpr_breach_incidents(user_id);
CREATE INDEX idx_gdpr_breach_incidents_breach_type ON gdpr_breach_incidents(breach_type);
CREATE INDEX idx_gdpr_breach_incidents_severity ON gdpr_breach_incidents(severity);
CREATE INDEX idx_gdpr_breach_incidents_status ON gdpr_breach_incidents(status);
CREATE INDEX idx_gdpr_breach_incidents_discovery_date ON gdpr_breach_incidents(discovery_date DESC);
CREATE INDEX idx_gdpr_breach_incidents_created_at ON gdpr_breach_incidents(created_at DESC);

CREATE INDEX idx_gdpr_subprocessors_category ON gdpr_subprocessors(category);
CREATE INDEX idx_gdpr_subprocessors_location ON gdpr_subprocessors(location);
CREATE INDEX idx_gdpr_subprocessors_is_active ON gdpr_subprocessors(is_active);
CREATE INDEX idx_gdpr_subprocessors_created_at ON gdpr_subprocessors(created_at DESC);

CREATE INDEX idx_gdpr_cross_border_transfers_user_id ON gdpr_cross_border_transfers(user_id);
CREATE INDEX idx_gdpr_cross_border_transfers_destination_country ON gdpr_cross_border_transfers(destination_country);
CREATE INDEX idx_gdpr_cross_border_transfers_legal_basis ON gdpr_cross_border_transfers(legal_basis);
CREATE INDEX idx_gdpr_cross_border_transfers_created_at ON gdpr_cross_border_transfers(created_at DESC);
CREATE INDEX idx_gdpr_cross_border_transfers_expires_at ON gdpr_cross_border_transfers(expires_at);

CREATE INDEX idx_gdpr_statistics_date ON gdpr_statistics(date);
CREATE INDEX idx_gdpr_statistics_created_at ON gdpr_statistics(created_at DESC);
CREATE INDEX idx_gdpr_statistics_compliance_score ON gdpr_statistics(compliance_score DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_gdpr_consents_updated_at 
    BEFORE UPDATE ON gdpr_consents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_requests_updated_at 
    BEFORE UPDATE ON gdpr_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_records_updated_at 
    BEFORE UPDATE ON gdpr_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_policies_updated_at 
    BEFORE UPDATE ON gdpr_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_subprocessors_updated_at 
    BEFORE UPDATE ON gdpr_subprocessors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_cross_border_transfers_updated_at 
    BEFORE UPDATE ON gdpr_cross_border_transfers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_statistics_updated_at 
    BEFORE UPDATE ON gdpr_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_gdpr_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO gdpr_statistics (
        date,
        total_consents,
        active_consents,
        expired_consents,
        revoked_consents,
        consent_rate,
        withdrawal_rate,
        requests_by_type,
        requests_by_status,
        average_processing_time,
        data_records_count,
        anonymized_records,
        deleted_records,
        cross_border_transfers,
        third_party_sharing,
        breach_incidents,
        compliance_score,
        trends
    )
    SELECT 
        CURRENT_DATE,
        (SELECT COUNT(*) FROM gdpr_consents) as total_consents,
        (SELECT COUNT(*) FROM gdpr_consents WHERE granted = true AND (expires_at IS NULL OR expires_at > NOW())) as active_consents,
        (SELECT COUNT(*) FROM gdpr_consents WHERE expires_at <= NOW()) as expired_consents,
        (SELECT COUNT(*) FROM gdpr_consents WHERE granted = false AND revoked_at IS NOT NULL) as revoked_consents,
        COALESCE(
            (SELECT COUNT(*) FILTER (WHERE granted = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100
             FROM gdpr_consents), 
            0
        ) as consent_rate,
        COALESCE(
            (SELECT COUNT(*) FILTER (WHERE granted = false AND revoked_at IS NOT NULL)::DECIMAL / NULLIF(COUNT(*), 0) * 100
             FROM gdpr_consents), 
            0
        ) as withdrawal_rate,
        jsonb_build_object(
            'access', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'access'),
            'rectification', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'rectification'),
            'erasure', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'erasure'),
            'portability', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'portability'),
            'restriction', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'restriction'),
            'objection', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'objection'),
            'withdrawal', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'withdrawal'),
            'complaint', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'complaint'),
            'inquiry', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'inquiry')
        ),
        jsonb_build_object(
            'pending', (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'pending'),
            'processing', (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'processing'),
            'completed', (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'completed'),
            'rejected', (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'rejected'),
            'expired', (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'expired'),
            'cancelled', (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'cancelled')
        ),
        COALESCE(
            AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400),
            0
        )::INTEGER as average_processing_time,
        (SELECT COUNT(*) FROM gdpr_records WHERE deleted_at IS NULL) as data_records_count,
        (SELECT COUNT(*) FROM gdpr_records WHERE is_anonymized = true) as anonymized_records,
        (SELECT COUNT(*) FROM gdpr_records WHERE deleted_at IS NOT NULL) as deleted_records,
        (SELECT COUNT(*) FROM gdpr_cross_border_transfers) as cross_border_transfers,
        (SELECT COUNT(*) FROM gdpr_records WHERE third_party_sharing = true) as third_party_sharing,
        (SELECT COUNT(*) FROM gdpr_breach_incidents) as breach_incidents,
        COALESCE(
            (SELECT AVG(
                (CASE 
                    WHEN (SELECT COUNT(*) FROM gdpr_consents WHERE granted = true) > 0 THEN 25
                    ELSE 0
                END) +
                (CASE 
                    WHEN (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'completed') > 0 THEN 25
                    ELSE 0
                END) +
                (CASE 
                    WHEN (SELECT COUNT(*) FROM gdpr_breach_incidents) = 0 THEN 25
                    ELSE 0
                END) +
                (CASE 
                    WHEN (SELECT COUNT(*) FROM gdpr_records WHERE is_encrypted = true) > 0 THEN 25
                    ELSE 0
                END)
            )), 
            0
        ) as compliance_score,
        jsonb_build_object(
            'consentTrend', ARRAY(
                SELECT COUNT(*) 
                FROM gdpr_consents 
                WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'requestTrend', ARRAY(
                SELECT COUNT(*) 
                FROM gdpr_requests 
                WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'complianceTrend', ARRAY(
                SELECT COALESCE(
                    (CASE 
                        WHEN (SELECT COUNT(*) FROM gdpr_consents WHERE granted = true) > 0 THEN 25
                        ELSE 0
                    END) +
                    (CASE 
                        WHEN (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'completed') > 0 THEN 25
                        ELSE 0
                    END) +
                    (CASE 
                        WHEN (SELECT COUNT(*) FROM gdpr_breach_incidents) = 0 THEN 25
                        ELSE 0
                    END) +
                    (CASE 
                        WHEN (SELECT COUNT(*) FROM gdpr_records WHERE is_encrypted = true) > 0 THEN 25
                        ELSE 0
                    END)
                ), 0)
                FROM generate_series(CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, INTERVAL '1 day') d
            )
        )
    ON CONFLICT (date) DO UPDATE SET
        total_consents = EXCLUDED.total_consents,
        active_consents = EXCLUDED.active_consents,
        expired_consents = EXCLUDED.expired_consents,
        revoked_consents = EXCLUDED.revoked_consents,
        consent_rate = EXCLUDED.consent_rate,
        withdrawal_rate = EXCLUDED.withdrawal_rate,
        requests_by_type = EXCLUDED.requests_by_type,
        requests_by_status = EXCLUDED.requests_by_status,
        average_processing_time = EXCLUDED.average_processing_time,
        data_records_count = EXCLUDED.data_records_count,
        anonymized_records = EXCLUDED.anonymized_records,
        deleted_records = EXCLUDED.deleted_records,
        cross_border_transfers = EXCLUDED.cross_border_transfers,
        third_party_sharing = EXCLUDED.third_party_sharing,
        breach_incidents = EXCLUDED.breach_incidents,
        compliance_score = EXCLUDED.compliance_score,
        trends = EXCLUDED.trends,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gdpr_statistics
    AFTER INSERT ON gdpr_consents
    FOR EACH ROW EXECUTE FUNCTION update_gdpr_statistics();

CREATE TRIGGER trigger_update_gdpr_statistics_requests
    AFTER INSERT ON gdpr_requests
    FOR EACH ROW EXECUTE FUNCTION update_gdpr_statistics();

CREATE TRIGGER trigger_update_gdpr_statistics_records
    AFTER INSERT ON gdpr_records
    FOR EACH ROW EXECUTE FUNCTION update_gdpr_statistics();

CREATE TRIGGER trigger_update_gdpr_statistics_breaches
    AFTER INSERT ON gdpr_breach_incidents
    FOR EACH ROW EXECUTE FUNCTION update_gdpr_statistics();

-- Politiques RLS pour les consentements
ALTER TABLE gdpr_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own GDPR consents" ON gdpr_consents
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all GDPR consents" ON gdpr_consents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les demandes
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own GDPR requests" ON gdpr_requests
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all GDPR requests" ON gdpr_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les enregistrements
ALTER TABLE gdpr_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own GDPR records" ON gdpr_records
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all GDPR records" ON gdpr_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les politiques
ALTER TABLE gdpr_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active GDPR policies" ON gdpr_policies
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage GDPR policies" ON gdpr_policies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les logs d'audit
ALTER TABLE gdpr_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own GDPR audit logs" ON gdpr_audit_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all GDPR audit logs" ON gdpr_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les incidents de sécurité
ALTER TABLE gdpr_breach_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own GDPR breach incidents" ON gdpr_breach_incidents
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all GDPR breach incidents" ON gdpr_breach_incidents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les sous-traitants
ALTER TABLE gdpr_subprocessors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active GDPR subprocessors" ON gdpr_subprocessors
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage GDPR subprocessors" ON gdpr_subprocessors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les transferts transfrontaliers
ALTER TABLE gdpr_cross_border_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own GDPR cross border transfers" ON gdpr_cross_border_transfers
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all GDPR cross border transfers" ON gdpr_cross_border_transfers
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
ALTER TABLE gdpr_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view GDPR statistics" ON gdpr_statistics
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage GDPR statistics" ON gdpr_statistics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour le RGPD

-- Fonction pour obtenir les statistiques RGPD
CREATE OR REPLACE FUNCTION get_gdpr_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_consents BIGINT,
    active_consents BIGINT,
    expired_consents BIGINT,
    revoked_consents BIGINT,
    consent_rate DECIMAL(5,2),
    withdrawal_rate DECIMAL(5,2),
    requests_by_type JSONB,
    requests_by_status JSONB,
    average_processing_time INTEGER,
    data_records_count BIGINT,
    anonymized_records BIGINT,
    deleted_records BIGINT,
    cross_border_transfers BIGINT,
    third_party_sharing BIGINT,
    breach_incidents BIGINT,
    compliance_score DECIMAL(5,2),
    trends JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH consent_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE granted = true AND (expires_at IS NULL OR expires_at > NOW())) as active,
            COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired,
            COUNT(*) FILTER (WHERE granted = false AND revoked_at IS NOT NULL) as revoked
        FROM gdpr_consents
    ),
    request_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'processing') as processing,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
            COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400), 0) as avg_processing_time
        FROM gdpr_requests
        WHERE DATE(created_at) = p_date
    ),
    record_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_anonymized = true) as anonymized,
            COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted,
            COUNT(*) FILTER (WHERE third_party_sharing = true) as sharing
        FROM gdpr_records
    ),
    request_type_breakdown AS (
        SELECT jsonb_object_agg(request_type, count)
        FROM (
            SELECT 
                request_type,
                COUNT(*) as count
            FROM gdpr_requests
            GROUP BY request_type
        ) type_counts
    ),
    request_status_breakdown AS (
        SELECT jsonb_object_agg(status, count)
        FROM (
            SELECT 
                status,
                COUNT(*) as count
            FROM gdpr_requests
            GROUP BY status
        ) status_counts
    ),
    trends_stats AS (
        SELECT jsonb_build_object(
            'consentTrend', ARRAY(
                SELECT COUNT(*) 
                FROM gdpr_consents 
                WHERE DATE(created_at) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'requestTrend', ARRAY(
                SELECT COUNT(*) 
                FROM gdpr_requests 
                WHERE DATE(created_at) >= p_date - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'complianceTrend', ARRAY(
                SELECT COALESCE(
                    (CASE 
                        WHEN (SELECT COUNT(*) FROM gdpr_consents WHERE granted = true) > 0 THEN 25
                        ELSE 0
                    END) +
                    (CASE 
                        WHEN (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'completed') > 0 THEN 25
                        ELSE 0
                    END) +
                    (CASE 
                        WHEN (SELECT COUNT(*) FROM gdpr_breach_incidents) = 0 THEN 25
                        ELSE 0
                    END) +
                    (CASE 
                        WHEN (SELECT COUNT(*) FROM gdpr_records WHERE is_encrypted = true) > 0 THEN 25
                        ELSE 0
                    END)
                ), 0)
                FROM generate_series(p_date - INTERVAL '7 days', p_date, INTERVAL '1 day') d
            )
        )
    )
    SELECT 
        cs.total as total_consents,
        cs.active as active_consents,
        cs.expired as expired_consents,
        cs.revoked as revoked_consents,
        COALESCE(cs.active::DECIMAL / NULLIF(cs.total, 0) * 100, 0) as consent_rate,
        COALESCE(cs.revoked::DECIMAL / NULLIF(cs.total, 0) * 100, 0) as withdrawal_rate,
        rtb.request_type_breakdown as requests_by_type,
        rsb.request_status_breakdown as requests_by_status,
        rs.avg_processing_time::INTEGER as average_processing_time,
        rcs.total as data_records_count,
        rcs.anonymized as anonymized_records,
        rcs.deleted as deleted_records,
        (SELECT COUNT(*) FROM gdpr_cross_border_transfers WHERE DATE(created_at) = p_date) as cross_border_transfers,
        rcs.sharing as third_party_sharing,
        (SELECT COUNT(*) FROM gdpr_breach_incidents WHERE DATE(discovery_date) = p_date) as breach_incidents,
        COALESCE(
            (CASE 
                WHEN cs.active > 0 THEN 25
                ELSE 0
            END) +
            (CASE 
                WHEN rs.completed > 0 THEN 25
                ELSE 0
            END) +
            (CASE 
                WHEN (SELECT COUNT(*) FROM gdpr_breach_incidents) = 0 THEN 25
                ELSE 0
            END) +
            (CASE 
                WHEN (SELECT COUNT(*) FROM gdpr_records WHERE is_encrypted = true) > 0 THEN 25
                ELSE 0
            END),
            0
        ) as compliance_score,
        ts.trends_stats as trends
    FROM consent_stats cs, request_stats rs, record_stats rcs,
         request_type_breakdown rtb, request_status_breakdown rsb, trends_stats ts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les politiques par défaut
CREATE OR REPLACE FUNCTION create_default_gdpr_policy()
RETURNS VOID AS $$
BEGIN
    INSERT INTO gdpr_policies (
        version,
        title,
        description,
        effective_date,
        jurisdiction,
        language,
        content,
        consent_requirements,
        data_subject_rights,
        retention_policies,
        breach_procedures,
        contact_info
    ) VALUES (
        '1.0',
        'Privacy Policy',
        'Default privacy policy for WordCraft',
        NOW(),
        'EU',
        'en',
        jsonb_build_object(
            'sections', jsonb_build_array(
                jsonb_build_object('id', 'intro', 'title', 'Introduction', 'content', 'Welcome to our privacy policy...', 'order', 1, 'required', true, 'type', 'introduction'),
                jsonb_build_object('id', 'collection', 'title', 'Data Collection', 'content', 'We collect the following data...', 'order', 2, 'required', true, 'type', 'data_collection'),
                jsonb_build_object('id', 'usage', 'title', 'Data Usage', 'content', 'How we use your data...', 'order', 3, 'required', true, 'type', 'data_usage'),
                jsonb_build_object('id', 'rights', 'title', 'Your Rights', 'content', 'Your GDPR rights...', 'order', 4, 'required', true, 'type', 'data_rights')
            ),
            'appendices', jsonb_build_array(),
            'definitions', jsonb_build_array(),
            'examples', jsonb_build_array()
        ),
        jsonb_build_array(
            jsonb_build_object('purpose', 'analytics', 'description', 'Website analytics', 'legalBasis', 'legitimate_interests', 'required', false, 'withdrawalMethod', 'easy', 'granularity', 'granular')
        ),
        jsonb_build_array(
            jsonb_build_object('right', 'access', 'description', 'Right to access your data', 'procedure', 'Submit a request', 'timeframe', '30 days', 'format', jsonb_build_array('json', 'csv'), 'fees', false, 'conditions', jsonb_build_array('Identity verification required'))
        ),
        jsonb_build_array(
            jsonb_build_object('dataCategory', 'personal_data', 'retentionPeriod', 365, 'retentionReason', 'Legal requirement', 'deletionMethod', 'secure_delete', 'exceptions', jsonb_build_array('Legal holds'))
        ),
        jsonb_build_array(
            jsonb_build_object('detectionTimeframe', '72 hours', 'notificationTimeframe', '72 hours', 'notificationMethod', jsonb_build_array('email', 'dashboard'), 'content', jsonb_build_array('Breach details', 'Impact assessment'), 'responsible', jsonb_build_array('DPO', 'Security team'), 'mitigation', jsonb_build_array('Immediate containment', 'Investigation'))
        ),
        jsonb_build_object(
            'company', 'WordCraft',
            'address', '123 Street, City, Country',
            'email', 'privacy@wordcraft.com',
            'phone', '+1234567890',
            'website', 'https://wordcraft.com',
            'dpo', jsonb_build_object('name', 'DPO', 'email', 'dpo@wordcraft.com', 'phone', '+1234567890', 'address', '123 Street, City, Country', 'department', 'Privacy'),
            'representative', jsonb_build_object('name', 'Privacy Officer', 'role', 'Data Protection Officer', 'email', 'privacy@wordcraft.com', 'phone', '+1234567890')
        )
    )
    ON CONFLICT (version) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        effective_date = EXCLUDED.effective_date,
        jurisdiction = EXCLUDED.jurisdiction,
        language = EXCLUDED.language,
        content = EXCLUDED.content,
        consent_requirements = EXCLUDED.consent_requirements,
        data_subject_rights = EXCLUDED.data_subject_rights,
        retention_policies = EXCLUDED.retention_policies,
        breach_procedures = EXCLUDED.breach_procedures,
        contact_info = EXCLUDED.contact_info,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les données expirées
CREATE OR REPLACE FUNCTION cleanup_expired_gdpr_data()
RETURNS TABLE (
    cleaned_consents BIGINT,
    cleaned_requests BIGINT,
    cleaned_records BIGINT
) AS $$
DECLARE
    cleaned_consents_count BIGINT;
    cleaned_requests_count BIGINT;
    cleaned_records_count BIGINT;
BEGIN
    -- Nettoyer les consentements expirés
    UPDATE gdpr_consents
    SET granted = false, revoked_at = NOW(), updated_at = NOW()
    WHERE expires_at <= NOW()
    AND granted = true;
    
    GET DIAGNOSTICS cleaned_consents_count = ROW_COUNT;
    
    -- Nettoyer les demandes expirées
    UPDATE gdpr_requests
    SET status = 'expired', updated_at = NOW()
    WHERE expires_at <= NOW()
    AND status IN ('pending', 'processing');
    
    GET DIAGNOSTICS cleaned_requests_count = ROW_COUNT;
    
    -- Anonymiser les enregistrements expirés
    UPDATE gdpr_records
    SET is_anonymized = true, data = '{}', updated_at = NOW()
    WHERE expires_at <= NOW()
    AND is_anonymized = false
    AND deleted_at IS NULL;
    
    GET DIAGNOSTICS cleaned_records_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_consents_count, cleaned_requests_count, cleaned_records_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_gdpr_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO gdpr_statistics (
        date,
        total_consents,
        active_consents,
        expired_consents,
        revoked_consents,
        consent_rate,
        withdrawal_rate,
        requests_by_type,
        requests_by_status,
        average_processing_time,
        data_records_count,
        anonymized_records,
        deleted_records,
        cross_border_transfers,
        third_party_sharing,
        breach_incidents,
        compliance_score,
        trends
    )
    SELECT 
        p_date,
        (SELECT COUNT(*) FROM gdpr_consents) as total_consents,
        (SELECT COUNT(*) FROM gdpr_consents WHERE granted = true AND (expires_at IS NULL OR expires_at > NOW())) as active_consents,
        (SELECT COUNT(*) FROM gdpr_consents WHERE expires_at <= NOW()) as expired_consents,
        (SELECT COUNT(*) FROM gdpr_consents WHERE granted = false AND revoked_at IS NOT NULL) as revoked_consents,
        COALESCE(
            (SELECT COUNT(*) FILTER (WHERE granted = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100
             FROM gdpr_consents), 
            0
        ) as consent_rate,
        COALESCE(
            (SELECT COUNT(*) FILTER (WHERE granted = false AND revoked_at IS NOT NULL)::DECIMAL / NULLIF(COUNT(*), 0) * 100
             FROM gdpr_consents), 
            0
        ) as withdrawal_rate,
        jsonb_build_object(
            'access', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'access'),
            'rectification', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'rectification'),
            'erasure', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'erasure'),
            'portability', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'portability'),
            'restriction', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'restriction'),
            'objection', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'objection'),
            'withdrawal', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'withdrawal'),
            'complaint', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'complaint'),
            'inquiry', (SELECT COUNT(*) FROM gdpr_requests WHERE request_type = 'inquiry')
        ),
        jsonb_build_object(
            'pending', (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'pending'),
            'processing', (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'processing'),
            'completed', (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'completed'),
            'rejected', (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'rejected'),
            'expired', (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'expired'),
            'cancelled', (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'cancelled')
        ),
        COALESCE(
            AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400),
            0
        )::INTEGER as average_processing_time,
        (SELECT COUNT(*) FROM gdpr_records WHERE deleted_at IS NULL) as data_records_count,
        (SELECT COUNT(*) FROM gdpr_records WHERE is_anonymized = true) as anonymized_records,
        (SELECT COUNT(*) FROM gdpr_records WHERE deleted_at IS NOT NULL) as deleted_records,
        (SELECT COUNT(*) FROM gdpr_cross_border_transfers WHERE DATE(created_at) = p_date) as cross_border_transfers,
        (SELECT COUNT(*) FROM gdpr_records WHERE third_party_sharing = true) as third_party_sharing,
        (SELECT COUNT(*) FROM gdpr_breach_incidents WHERE DATE(discovery_date) = p_date) as breach_incidents,
        COALESCE(
            (CASE 
                WHEN (SELECT COUNT(*) FROM gdpr_consents WHERE granted = true) > 0 THEN 25
                ELSE 0
            END) +
            (CASE 
                WHEN (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'completed') > 0 THEN 25
                ELSE 0
            END) +
            (CASE 
                WHEN (SELECT COUNT(*) FROM gdpr_breach_incidents) = 0 THEN 25
                ELSE 0
            END) +
            (CASE 
                WHEN (SELECT COUNT(*) FROM gdpr_records WHERE is_encrypted = true) > 0 THEN 25
                ELSE 0
            END),
            0
        ) as compliance_score,
        jsonb_build_object(
            'consentTrend', ARRAY(SELECT COUNT(*) FROM gdpr_consents WHERE DATE(created_at) >= p_date - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY DATE(created_at)),
            'requestTrend', ARRAY(SELECT COUNT(*) FROM gdpr_requests WHERE DATE(created_at) >= p_date - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY DATE(created_at)),
            'complianceTrend', ARRAY(
                SELECT COALESCE(
                    (CASE 
                        WHEN (SELECT COUNT(*) FROM gdpr_consents WHERE granted = true) > 0 THEN 25
                        ELSE 0
                    END) +
                    (CASE 
                        WHEN (SELECT COUNT(*) FROM gdpr_requests WHERE status = 'completed') > 0 THEN 25
                        ELSE 0
                    END) +
                    (CASE 
                        WHEN (SELECT COUNT(*) FROM gdpr_breach_incidents) = 0 THEN 25
                        ELSE 0
                    END) +
                    (CASE 
                        WHEN (SELECT COUNT(*) FROM gdpr_records WHERE is_encrypted = true) > 0 THEN 25
                        ELSE 0
                    END)
                ), 0)
                FROM generate_series(p_date - INTERVAL '7 days', p_date, INTERVAL '1 day') d
            )
        )
    ON CONFLICT (date) DO UPDATE SET
        total_consents = EXCLUDED.total_consents,
        active_consents = EXCLUDED.active_consents,
        expired_consents = EXCLUDED.expired_consents,
        revoked_consents = EXCLUDED.revoked_consents,
        consent_rate = EXCLUDED.consent_rate,
        withdrawal_rate = EXCLUDED.withdrawal_rate,
        requests_by_type = EXCLUDED.requests_by_type,
        requests_by_status = EXCLUDED.requests_by_status,
        average_processing_time = EXCLUDED.average_processing_time,
        data_records_count = EXCLUDED.data_records_count,
        anonymized_records = EXCLUDED.anonymized_records,
        deleted_records = EXCLUDED.deleted_records,
        cross_border_transfers = EXCLUDED.cross_border_transfers,
        third_party_sharing = EXCLUDED.third_party_sharing,
        breach_incidents = EXCLUDED.breach_incidents,
        compliance_score = EXCLUDED.compliance_score,
        trends = EXCLUDED.trends,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE gdpr_consents IS 'Consentements utilisateur selon le RGPD';
COMMENT ON TABLE gdpr_requests IS 'Demandes RGPD (accès, rectification, effacement, portabilité, etc.)';
COMMENT ON TABLE gdpr_records IS 'Enregistrements de données personnelles avec traçabilité';
COMMENT ON TABLE gdpr_policies IS 'Politiques de confidentialité et conformité RGPD';
COMMENT ON TABLE gdpr_audit_logs IS 'Logs d\'audit pour la traçabilité des opérations RGPD';
COMMENT ON TABLE gdpr_breach_incidents IS 'Incidents de sécurité et violations de données';
COMMENT ON TABLE gdpr_subprocessors IS 'Sous-traitants et processeurs de données externes';
COMMENT ON TABLE gdpr_cross_border_transfers IS 'Transferts de données transfrontaliers';
COMMENT ON TABLE gdpr_statistics IS 'Statistiques de conformité et indicateurs RGPD';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN gdpr_consents.location IS 'Localisation géographique {country, region, city, timezone, isEU, gdprApplies}';
COMMENT ON COLUMN gdpr_consents.purposes IS 'Finalités du traitement avec bases légales et durées de rétention';
COMMENT ON COLUMN gdpr_requests.metadata IS 'Métadonnées de la demande {requestId, reference, priority, verification}';
COMMENT ON COLUMN gdpr_records.data IS 'Données personnelles chiffrées et structurées';
COMMENT ON COLUMN gdpr_records.processing_activities IS 'Activités de traitement avec finalités et destinataires';
COMMENT ON COLUMN gdpr_policies.content IS 'Contenu structuré de la politique {sections, appendices, definitions}';
COMMENT ON COLUMN gdpr_breach_incidents.impact_assessment IS 'Évaluation d\'impact {affectedUsers, dataTypes, severity, likelihood}';
COMMENT ON COLUMN gdpr_cross_border_transfers.safeguards IS 'Garanties appropriées {SCCs, BCRs, binding_contract}';
COMMENT ON COLUMN gdpr_statistics.compliance_score IS 'Score de conformité global (0-100) basé sur 4 piliers';

-- Créer les données par défaut
SELECT create_default_gdpr_policy();
