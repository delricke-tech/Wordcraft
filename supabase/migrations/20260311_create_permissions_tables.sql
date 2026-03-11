-- Migration: Création des tables pour les permissions granulaires (rôles détaillés)
-- Date: 11 mars 2026
-- Description: Tables pour gérer les rôles, permissions, héritage et audit des accès

-- Table des rôles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0 AND level <= 100),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '[]',
    restrictions JSONB DEFAULT '[]',
    parent_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    inherits_from UUID[] DEFAULT '{}',
    color VARCHAR(7),
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- Table des assignations de rôles aux utilisateurs
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    context JSONB DEFAULT '{}', -- {workspaceId, projectId, documentId, teamId, scope}
    metadata JSONB DEFAULT '{}', -- {assignmentReason, notes, temporary, autoRenew, lastAccessed, accessCount}
    UNIQUE(user_id, role_id, is_active)
);

-- Table des templates de rôles
CREATE TABLE IF NOT EXISTS role_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]',
    restrictions JSONB DEFAULT '[]',
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags TEXT[] DEFAULT '{}'
);

-- Table des audits de permissions
CREATE TABLE IF NOT EXISTS permission_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    resource VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_id UUID,
    result BOOLEAN NOT NULL,
    effect VARCHAR(20) NOT NULL CHECK (effect IN ('allow', 'deny', 'conditional')),
    role_id UUID,
    role_name VARCHAR(255),
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context JSONB DEFAULT '{}',
    duration INTEGER -- Temps d'évaluation en ms
);

-- Table des logs d'activité des rôles
CREATE TABLE IF NOT EXISTS role_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('assign', 'revoke', 'create', 'update', 'delete', 'activate', 'deactivate')),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_level ON roles(level DESC);
CREATE INDEX idx_roles_is_active ON roles(is_active);
CREATE INDEX idx_roles_is_system ON roles(is_system);
CREATE INDEX idx_roles_created_by ON roles(created_by);
CREATE INDEX idx_roles_created_at ON roles(created_at DESC);
CREATE INDEX idx_roles_updated_at ON roles(updated_at DESC);
CREATE INDEX idx_roles_permissions ON roles USING gin(permissions);
CREATE INDEX idx_roles_inherits_from ON roles USING gin(inherits_from);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_assigned_by ON user_roles(assigned_by);
CREATE INDEX idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);
CREATE INDEX idx_user_roles_assigned_at ON user_roles(assigned_at DESC);
CREATE INDEX idx_user_roles_context ON user_roles USING gin(context);

CREATE INDEX idx_role_templates_category ON role_templates(category);
CREATE INDEX idx_role_templates_is_public ON role_templates(is_public);
CREATE INDEX idx_role_templates_rating ON role_templates(rating DESC);
CREATE INDEX idx_role_templates_usage_count ON role_templates(usage_count DESC);
CREATE INDEX idx_role_templates_tags ON role_templates USING gin(tags);
CREATE INDEX idx_role_templates_created_at ON role_templates(created_at DESC);

CREATE INDEX idx_permission_audit_user_id ON permission_audit(user_id);
CREATE INDEX idx_permission_audit_resource ON permission_audit(resource);
CREATE INDEX idx_permission_audit_action ON permission_audit(action);
CREATE INDEX idx_permission_audit_result ON permission_audit(result);
CREATE INDEX idx_permission_audit_timestamp ON permission_audit(timestamp DESC);
CREATE INDEX idx_permission_audit_role_id ON permission_audit(role_id);
CREATE INDEX idx_permission_audit_context ON permission_audit USING gin(context);

CREATE INDEX idx_role_activity_logs_user_id ON role_activity_logs(user_id);
CREATE INDEX idx_role_activity_logs_target_user_id ON role_activity_logs(target_user_id);
CREATE INDEX idx_role_activity_logs_role_id ON role_activity_logs(role_id);
CREATE INDEX idx_role_activity_logs_action ON role_activity_logs(action);
CREATE INDEX idx_role_activity_logs_timestamp ON role_activity_logs(timestamp DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour le compteur d'utilisation des templates
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE role_templates
    SET usage_count = usage_count + 1
    WHERE id = NEW.role_id
    AND EXISTS (
        SELECT 1 FROM role_templates rt 
        WHERE rt.id = NEW.role_id
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_template_usage
    AFTER INSERT ON user_roles
    FOR EACH ROW EXECUTE FUNCTION increment_template_usage();

-- Politiques RLS pour les rôles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view roles" ON roles
    FOR SELECT USING (true); -- Tous les utilisateurs peuvent voir les rôles

CREATE POLICY "Users can create non-system roles" ON roles
    FOR INSERT WITH CHECK (is_system = false);

CREATE POLICY "Users can update own non-system roles" ON roles
    FOR UPDATE USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete own non-system roles" ON roles
    FOR DELETE USING (created_by = auth.uid() AND is_system = false);

-- Politiques RLS pour les assignations de rôles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Users with permission can manage user roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 50 -- Niveau minimum pour gérer les rôles
        )
    );

-- Politiques RLS pour les templates de rôles
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public role templates" ON role_templates
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create role templates" ON role_templates
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own role templates" ON role_templates
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own role templates" ON role_templates
    FOR DELETE USING (created_by = auth.uid());

-- Politiques RLS pour les audits
ALTER TABLE permission_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own permission audits" ON permission_audit
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all permission audits" ON permission_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80 -- Niveau admin
        )
    );

-- Politiques RLS pour les logs d'activité
ALTER TABLE role_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role activity logs" ON role_activity_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all role activity logs" ON role_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour les permissions granulaires

-- Fonction pour obtenir les statistiques des permissions
CREATE OR REPLACE FUNCTION get_permission_stats()
RETURNS TABLE (
    total_roles BIGINT,
    active_roles BIGINT,
    total_users BIGINT,
    users_with_roles BIGINT,
    roles_by_category JSONB,
    permission_distribution JSONB,
    top_roles JSONB,
    recent_assignments JSONB,
    audit_events JSONB,
    denied_requests JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH role_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_active = true) as active
        FROM roles
    ),
    user_stats AS (
        SELECT 
            COUNT(DISTINCT id) as total_users,
            COUNT(DISTINCT user_id) as users_with_roles
        FROM profiles p
        LEFT JOIN user_roles ur ON p.id = ur.user_id AND ur.is_active = true
    ),
    category_stats AS (
        SELECT jsonb_object_agg(category, category_count)
        FROM (
            SELECT 
                category,
                COUNT(*) as category_count
            FROM role_templates
            GROUP BY category
        ) cat_stats
    ),
    permission_stats AS (
        SELECT jsonb_build_object(
            'documents', COUNT(*) FILTER (WHERE resource = 'documents'),
            'notes', COUNT(*) FILTER (WHERE resource = 'notes'),
            'conversations', COUNT(*) FILTER (WHERE resource = 'conversations'),
            'flashcards', COUNT(*) FILTER (WHERE resource = 'flashcards'),
            'quiz', COUNT(*) FILTER (WHERE resource = 'quiz'),
            'bookmarks', COUNT(*) FILTER (WHERE resource = 'bookmarks'),
            'sharing', COUNT(*) FILTER (WHERE resource = 'sharing'),
            'collaboration', COUNT(*) FILTER (WHERE resource = 'collaboration'),
            'comments', COUNT(*) FILTER (WHERE resource = 'comments'),
            'mentions', COUNT(*) FILTER (WHERE resource = 'mentions'),
            'users', COUNT(*) FILTER (WHERE resource = 'users'),
            'roles', COUNT(*) FILTER (WHERE resource = 'roles'),
            'settings', COUNT(*) FILTER (WHERE resource = 'settings'),
            'analytics', COUNT(*) FILTER (WHERE resource = 'analytics'),
            'system', COUNT(*) FILTER (WHERE resource = 'system')
        )
        FROM (
            SELECT jsonb_array_elements(permissions)->>'category' as category
            FROM roles
            WHERE is_active = true
        ) perm_stats
    ),
    top_roles_stats AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'roleId', r.id,
                'roleName', r.display_name,
                'userCount', user_count
            )
        )
        FROM (
            SELECT 
                r.id,
                r.display_name,
                COUNT(ur.user_id) as user_count
            FROM roles r
            LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = true
            WHERE r.is_active = true
            GROUP BY r.id, r.display_name
            ORDER BY user_count DESC
            LIMIT 10
        ) top_roles
    ),
    recent_assignments AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', ur.id,
                'userId', ur.user_id,
                'roleId', ur.role_id,
                'assignedBy', ur.assigned_by,
                'assignedAt', ur.assigned_at,
                'expiresAt', ur.expires_at,
                'isActive', ur.is_active
            )
        )
        FROM user_roles ur
        ORDER BY ur.assigned_at DESC
        LIMIT 10
    ),
    recent_audits AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'userId', user_id,
                'resource', resource,
                'action', action,
                'result', result,
                'effect', effect,
                'roleName', role_name,
                'reason', reason,
                'timestamp', timestamp,
                'duration', duration
            )
        )
        FROM permission_audit
        ORDER BY timestamp DESC
        LIMIT 20
    ),
    denied_stats AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'resource', resource,
                'action', action,
                'count', denied_count,
                'lastDenied', last_denied
            )
        )
        FROM (
            SELECT 
                resource,
                action,
                COUNT(*) as denied_count,
                MAX(timestamp) as last_denied
            FROM permission_audit
            WHERE result = false
            AND timestamp >= NOW() - INTERVAL '7 days'
            GROUP BY resource, action
            ORDER BY denied_count DESC
            LIMIT 10
        ) denied_stats
    )
    SELECT 
        rs.total as total_roles,
        rs.active as active_roles,
        us.total_users,
        us.users_with_roles,
        cs.roles_by_category,
        ps.permission_distribution,
        tr.top_roles,
        ra.recent_assignments,
        aud.recent_audits,
        ds.denied_requests
    FROM role_stats rs, user_stats us, category_stats cs, permission_stats ps, 
         top_roles_stats tr, recent_assignments ra, recent_audits aud, denied_stats ds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur a une permission
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_resource VARCHAR(255),
    p_action VARCHAR(100),
    p_context JSONB DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL
)
RETURNS TABLE (
    allowed BOOLEAN,
    effect VARCHAR(20),
    reason TEXT,
    role_id UUID,
    role_name VARCHAR(255),
    evaluated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_allowed BOOLEAN := false;
    v_effect VARCHAR(20) := 'deny';
    v_reason TEXT := 'No active role found';
    v_role_id UUID;
    v_role_name VARCHAR(255);
BEGIN
    -- Récupérer les rôles actifs de l'utilisateur
    WITH user_active_roles AS (
        SELECT 
            r.id,
            r.name,
            r.display_name,
            r.permissions,
            r.restrictions,
            ur.context
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = p_user_id
        AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        AND r.is_active = true
    ),
    permission_check AS (
        SELECT 
            r.id as role_id,
            r.display_name as role_name,
            perm.effect,
            perm.conditions,
            r.restrictions
        FROM user_active_roles r,
        jsonb_array_elements(r.permissions) as perm
        WHERE perm->>'resource' = p_resource
        AND perm->>'action' = p_action
    )
    SELECT 
        allowed,
        effect,
        reason,
        role_id,
        role_name,
        NOW() as evaluated_at
    INTO v_allowed, v_effect, v_reason, v_role_id, v_role_name
    FROM (
        SELECT 
            COALESCE(
                -- Priorité aux deny explicites
                (SELECT false, 'deny', 'Explicitly denied', role_id, role_name
                 FROM permission_check 
                 WHERE effect = 'deny'
                 LIMIT 1),
                -- Ensuite les allow avec conditions valides
                (SELECT true, 'allow', 'Permission granted', role_id, role_name
                 FROM permission_check 
                 WHERE effect = 'allow'
                 AND (conditions IS NULL OR evaluate_conditions(conditions, p_context))
                 LIMIT 1),
                -- Valeur par défaut
                (false, 'deny', 'No matching permission', NULL, NULL)
            )
    ) result;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction utilitaire pour évaluer les conditions
CREATE OR REPLACE FUNCTION evaluate_conditions(
    conditions JSONB,
    context JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    condition JSONB;
    field_value TEXT;
    condition_value TEXT;
    operator TEXT;
    result BOOLEAN := true;
BEGIN
    IF conditions IS NULL OR context IS NULL THEN
        RETURN true;
    END IF;

    FOR condition IN SELECT jsonb_array_elements(conditions)
    LOOP
        field_value := COALESCE(context->>(condition->>'field')::TEXT, '');
        condition_value := COALESCE(condition->>'value'::TEXT, '');
        operator := condition->>'operator';

        CASE operator
            WHEN 'eq' THEN
                result := result AND (field_value = condition_value);
            WHEN 'ne' THEN
                result := result AND (field_value != condition_value);
            WHEN 'gt' THEN
                result := result AND (field_value::NUMERIC > condition_value::NUMERIC);
            WHEN 'gte' THEN
                result := result AND (field_value::NUMERIC >= condition_value::NUMERIC);
            WHEN 'lt' THEN
                result := result AND (field_value::NUMERIC < condition_value::NUMERIC);
            WHEN 'lte' THEN
                result := result AND (field_value::NUMERIC <= condition_value::NUMERIC);
            WHEN 'in' THEN
                result := result AND (field_value = ANY(STRING_TO_ARRAY(condition_value, ',')));
            WHEN 'nin' THEN
                result := result AND (field_value != ALL(STRING_TO_ARRAY(condition_value, ',')));
            WHEN 'contains' THEN
                result := result AND (field_value ILIKE CONCAT('%', condition_value, '%'));
            WHEN 'startsWith' THEN
                result := result AND (field_value ILIKE CONCAT(condition_value, '%'));
            WHEN 'endsWith' THEN
                result := result AND (field_value ILIKE CONCAT('%', condition_value));
            ELSE
                result := result AND false;
        END CASE;

        IF NOT result THEN
            EXIT;
        END IF;
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciennes assignations de rôles
CREATE OR REPLACE FUNCTION cleanup_expired_role_assignments()
RETURNS TABLE (
    cleaned_assignments BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
BEGIN
    UPDATE user_roles
    SET is_active = false
    WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_count as cleaned_assignments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les rôles système par défaut
CREATE OR REPLACE FUNCTION create_system_roles()
RETURNS VOID AS $$
BEGIN
    -- Rôle Super Admin
    INSERT INTO roles (name, display_name, description, level, is_system, is_active, permissions, created_by)
    VALUES (
        'super_admin',
        'Super Administrateur',
        'Accès complet à toutes les fonctionnalités du système',
        100,
        true,
        true,
        '[
            {"resource": "*", "action": "*", "effect": "allow", "priority": 100, "category": "system"}
        ]',
        '00000000-0000-0000-0000-000000000000' -- System user ID
    )
    ON CONFLICT (name) DO NOTHING;

    -- Rôle Admin
    INSERT INTO roles (name, display_name, description, level, is_system, is_active, permissions, created_by)
    VALUES (
        'admin',
        'Administrateur',
        'Accès administratif avec gestion des utilisateurs et rôles',
        80,
        true,
        true,
        '[
            {"resource": "users", "action": "*", "effect": "allow", "priority": 80, "category": "users"},
            {"resource": "roles", "action": "*", "effect": "allow", "priority": 80, "category": "roles"},
            {"resource": "settings", "action": "*", "effect": "allow", "priority": 80, "category": "settings"},
            {"resource": "analytics", "action": "view", "effect": "allow", "priority": 80, "category": "analytics"}
        ]',
        '00000000-0000-0000-0000-000000000000'
    )
    ON CONFLICT (name) DO NOTHING;

    -- Rôle Modérateur
    INSERT INTO roles (name, display_name, description, level, is_system, is_active, permissions, created_by)
    VALUES (
        'moderator',
        'Modérateur',
        'Accès de modération pour le contenu et les interactions',
        60,
        true,
        true,
        '[
            {"resource": "comments", "action": "*", "effect": "allow", "priority": 60, "category": "comments"},
            {"resource": "mentions", "action": "*", "effect": "allow", "priority": 60, "category": "mentions"},
            {"resource": "conversations", "action": "view", "effect": "allow", "priority": 60, "category": "conversations"},
            {"resource": "documents", "action": "view", "effect": "allow", "priority": 60, "category": "documents"}
        ]',
        '00000000-0000-0000-0000-000000000000'
    )
    ON CONFLICT (name) DO NOTHING;

    -- Rôle Utilisateur
    INSERT INTO roles (name, display_name, description, level, is_system, is_active, permissions, created_by)
    VALUES (
        'user',
        'Utilisateur',
        'Accès utilisateur standard pour les fonctionnalités de base',
        20,
        true,
        true,
        '[
            {"resource": "documents", "action": "view", "effect": "allow", "priority": 20, "category": "documents"},
            {"resource": "notes", "action": "*", "effect": "allow", "priority": 20, "category": "notes"},
            {"resource": "flashcards", "action": "*", "effect": "allow", "priority": 20, "category": "flashcards"},
            {"resource": "quiz", "action": "*", "effect": "allow", "priority": 20, "category": "quiz"},
            {"resource": "bookmarks", "action": "*", "effect": "allow", "priority": 20, "category": "bookmarks"}
        ]',
        '00000000-0000-0000-0000-000000000000'
    )
    ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE roles IS 'Rôles avec permissions granulaires et héritage';
COMMENT ON TABLE user_roles IS 'Assignations de rôles aux utilisateurs avec contexte et métadonnées';
COMMENT ON TABLE role_templates IS 'Templates de rôles réutilisables pour une création rapide';
COMMENT ON TABLE permission_audit IS 'Audit complet des vérifications de permissions';
COMMENT ON TABLE role_activity_logs IS 'Journal dactivité pour les opérations sur les rôles';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN roles.level IS 'Niveau hiérarchique du rôle (0-100)';
COMMENT ON COLUMN roles.permissions IS 'Permissions accordées par le rôle';
COMMENT ON COLUMN roles.restrictions IS 'Restrictions spécifiques qui surchargent les permissions';
COMMENT ON COLUMN roles.inherits_from IS 'Liste des IDs des rôles dont hériter les permissions';
COMMENT ON COLUMN user_roles.context IS 'Contexte dapplication du rôle {workspaceId, projectId, scope}';
COMMENT ON COLUMN user_roles.metadata IS 'Métadonnées {assignmentReason, notes, temporary, autoRenew, etc.}';
COMMENT ON COLUMN permission_audit.duration IS 'Temps en millisecondes pour lévaluation de la permission';

-- Créer les rôles système par défaut
SELECT create_system_roles();
