-- Migration: Création des tables pour les workspaces (multi-projets organisés)
-- Date: 11 mars 2026
-- Description: Tables pour gérer les espaces de travail multi-projets

-- Table des workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des membres des workspaces
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(workspace_id, user_id)
);

-- Table des projets dans les workspaces
CREATE TABLE IF NOT EXISTS workspace_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des documents liés aux workspaces
CREATE TABLE IF NOT EXISTS workspace_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES workspace_projects(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, workspace_id)
);

-- Index pour les performances
CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX idx_workspaces_status ON workspaces(status);
CREATE INDEX idx_workspaces_created_at ON workspaces(created_at DESC);

CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_role ON workspace_members(role);
CREATE INDEX idx_workspace_members_joined_at ON workspace_members(joined_at DESC);

CREATE INDEX idx_workspace_projects_workspace_id ON workspace_projects(workspace_id);
CREATE INDEX idx_workspace_projects_status ON workspace_projects(status);
CREATE INDEX idx_workspace_projects_created_by ON workspace_projects(created_by);
CREATE INDEX idx_workspace_projects_created_at ON workspace_projects(created_at DESC);

CREATE INDEX idx_workspace_documents_workspace_id ON workspace_documents(workspace_id);
CREATE INDEX idx_workspace_documents_project_id ON workspace_documents(project_id);
CREATE INDEX idx_workspace_documents_document_id ON workspace_documents(document_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workspaces_updated_at 
    BEFORE UPDATE ON workspaces 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_projects_updated_at 
    BEFORE UPDATE ON workspace_projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS pour les workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspaces they are members of" ON workspaces
    FOR SELECT USING (
        id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert workspaces" ON workspaces
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can update workspaces" ON workspaces
    FOR UPDATE USING (
        owner_id = auth.uid() OR
        id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Workspace owners can delete workspaces" ON workspaces
    FOR DELETE USING (
        owner_id = auth.uid()
    );

-- Politiques RLS pour les membres des workspaces
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace memberships" ON workspace_members
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert workspace members" ON workspace_members
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Workspace admins can update members" ON workspace_members
    FOR UPDATE USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Workspace admins can delete members" ON workspace_members
    FOR DELETE USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        ) AND user_id != auth.uid()
    );

-- Politiques RLS pour les projets des workspaces
ALTER TABLE workspace_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace projects" ON workspace_projects
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can create projects" ON workspace_projects
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Project creators and admins can update projects" ON workspace_projects
    FOR UPDATE USING (
        created_by = auth.uid() OR
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Project creators and admins can delete projects" ON workspace_projects
    FOR DELETE USING (
        created_by = auth.uid() OR
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Politiques RLS pour les documents des workspaces
ALTER TABLE workspace_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace documents" ON workspace_documents
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can add documents" ON workspace_documents
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Document owners and admins can remove documents" ON workspace_documents
    FOR DELETE USING (
        added_by = auth.uid() OR
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Fonctions RPC pour faciliter les opérations

-- Obtenir les workspaces d'un utilisateur avec les détails
CREATE OR REPLACE FUNCTION get_user_workspaces_with_details(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    is_public BOOLEAN,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    member_count BIGINT,
    document_count BIGINT,
    project_count BIGINT,
    user_role VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        w.description,
        w.is_public,
        w.status,
        w.created_at,
        w.updated_at,
        (SELECT COUNT(*) FROM workspace_members wm WHERE wm.workspace_id = w.id) as member_count,
        (SELECT COUNT(*) FROM workspace_documents wd WHERE wd.workspace_id = w.id) as document_count,
        (SELECT COUNT(*) FROM workspace_projects wp WHERE wp.workspace_id = w.id AND wp.status = 'active') as project_count,
        wm.role as user_role
    FROM workspaces w
    INNER JOIN workspace_members wm ON w.id = wm.workspace_id
    WHERE wm.user_id = p_user_id AND w.status = 'active'
    ORDER BY w.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir les membres d'un workspace avec les détails des utilisateurs
CREATE OR REPLACE FUNCTION get_workspace_members_with_users(p_workspace_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    role VARCHAR(20),
    permissions JSONB,
    joined_at TIMESTAMP WITH TIME ZONE,
    last_active_at TIMESTAMP WITH TIME ZONE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wm.id,
        wm.user_id,
        wm.role,
        wm.permissions,
        wm.joined_at,
        wm.last_active_at,
        p.email,
        p.full_name,
        p.avatar_url
    FROM workspace_members wm
    INNER JOIN profiles p ON wm.user_id = p.id
    WHERE wm.workspace_id = p_workspace_id
    ORDER BY 
        CASE wm.role 
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'member' THEN 3
            WHEN 'viewer' THEN 4
        END,
        wm.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérifier les permissions d'un utilisateur dans un workspace
CREATE OR REPLACE FUNCTION check_workspace_permission(
    p_workspace_id UUID, 
    p_user_id UUID, 
    p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_permissions JSONB;
BEGIN
    SELECT permissions INTO v_permissions
    FROM workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id;
    
    IF v_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN (v_permissions ->> p_permission)::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compter les éléments d'un workspace
CREATE OR REPLACE FUNCTION get_workspace_stats(p_workspace_id UUID)
RETURNS TABLE (
    member_count BIGINT,
    document_count BIGINT,
    project_count BIGINT,
    active_project_count BIGINT,
    archived_project_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = p_workspace_id) as member_count,
        (SELECT COUNT(*) FROM workspace_documents WHERE workspace_id = p_workspace_id) as document_count,
        (SELECT COUNT(*) FROM workspace_projects WHERE workspace_id = p_workspace_id) as project_count,
        (SELECT COUNT(*) FROM workspace_projects WHERE workspace_id = p_workspace_id AND status = 'active') as active_project_count,
        (SELECT COUNT(*) FROM workspace_projects WHERE workspace_id = p_workspace_id AND status = 'archived') as archived_project_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires sur les tables
COMMENT ON TABLE workspaces IS 'Espaces de travail pour organiser les projets et collaborations';
COMMENT ON TABLE workspace_members IS 'Membres des workspaces avec leurs rôles et permissions';
COMMENT ON TABLE workspace_projects IS 'Projets organisés dans les workspaces';
COMMENT ON TABLE workspace_documents IS 'Documents liés aux workspaces et projets';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN workspaces.settings IS 'Paramètres de configuration du workspace (thème, langue, notifications, etc.)';
COMMENT ON COLUMN workspace_members.permissions IS 'Permissions détaillées du membre selon son rôle';
COMMENT ON COLUMN workspace_projects.settings IS 'Paramètres spécifiques au projet';
COMMENT ON COLUMN workspace_projects.tags IS 'Tags pour organiser et filtrer les projets';

-- Créer un workspace par défaut pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION create_default_workspace_for_user()
RETURNS TRIGGER AS $$
DECLARE
    v_workspace_id UUID;
BEGIN
    -- Créer le workspace par défaut
    INSERT INTO workspaces (name, description, owner_id, settings)
    VALUES (
        'Mon Espace de Travail',
        'Workspace par défaut pour organiser vos documents et projets',
        NEW.id,
        '{
            "theme": "light",
            "language": "fr",
            "timezone": "Europe/Paris",
            "notifications": {
                "email": true,
                "push": true,
                "mentions": true,
                "comments": true,
                "shares": true
            },
            "privacy": {
                "allow_invites": true,
                "require_approval": false,
                "default_member_role": "member"
            },
            "features": {
                "enable_chat": true,
                "enable_collaboration": true,
                "enable_ai_features": true,
                "enable_analytics": true,
                "enable_exports": true
            }
        }'::jsonb
    )
    RETURNING id INTO v_workspace_id;
    
    -- Ajouter l'utilisateur comme owner
    INSERT INTO workspace_members (workspace_id, user_id, role, permissions)
    VALUES (
        v_workspace_id,
        NEW.id,
        'owner',
        '{
            "can_view": true,
            "can_edit": true,
            "can_delete": true,
            "can_invite": true,
            "can_manage_members": true,
            "can_manage_settings": true,
            "can_export": true,
            "can_share": true
        }'::jsonb
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer un workspace par défaut
CREATE TRIGGER create_default_workspace
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_workspace_for_user();
