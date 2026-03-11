-- Migration pour les tables de collaboration (Phase 3.1)
-- Date: 8 mars 2025
-- Description: Tables pour les groupes, invitations, permissions et partage

-- ========================================
-- TABLE: groups
-- ========================================
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    is_private BOOLEAN DEFAULT false,
    max_members INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT groups_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
    CONSTRAINT groups_max_members_positive CHECK (max_members > 0),
    CONSTRAINT groups_description_length CHECK (char_length(description) <= 500)
);

-- ========================================
-- TABLE: group_members
-- ========================================
CREATE TABLE IF NOT EXISTS group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'moderator', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Contraintes
    CONSTRAINT group_members_role_valid CHECK (role IN ('admin', 'moderator', 'member')),
    CONSTRAINT group_members_unique UNIQUE(group_id, user_id)
);

-- ========================================
-- TABLE: group_invitations
-- ========================================
CREATE TABLE IF NOT EXISTS group_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    invited_email TEXT, -- Pour les invitations par email
    invited_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Pour les invitations directes
    invitation_token TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- Rôle proposé
    message TEXT, -- Message personnalisé
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Contraintes
    CONSTRAINT group_invitations_role_valid CHECK (role IN ('admin', 'moderator', 'member')),
    CONSTRAINT group_invitations_status_valid CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    CONSTRAINT group_invitations_email_or_user CHECK (
        (invited_email IS NOT NULL AND invited_user_id IS NULL) OR
        (invited_email IS NULL AND invited_user_id IS NOT NULL)
    ),
    CONSTRAINT group_invitations_email_format CHECK (
        invited_email IS NULL OR 
        invited_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- ========================================
-- TABLE: shared_documents
-- ========================================
CREATE TABLE IF NOT EXISTS shared_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    shared_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_visible BOOLEAN DEFAULT true, -- Pour masquer temporairement
    permissions TEXT DEFAULT 'view', -- 'view', 'edit', 'admin'
    
    -- Contraintes
    CONSTRAINT shared_documents_permissions_valid CHECK (permissions IN ('view', 'edit', 'admin')),
    CONSTRAINT shared_documents_unique UNIQUE(group_id, document_id)
);

-- ========================================
-- TABLE: shared_study_cards
-- ========================================
CREATE TABLE IF NOT EXISTS shared_study_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    study_card_id UUID REFERENCES study_cards(id) ON DELETE CASCADE NOT NULL,
    shared_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_visible BOOLEAN DEFAULT true,
    permissions TEXT DEFAULT 'view',
    
    -- Contraintes
    CONSTRAINT shared_study_cards_permissions_valid CHECK (permissions IN ('view', 'edit', 'admin')),
    CONSTRAINT shared_study_cards_unique UNIQUE(group_id, study_card_id)
);

-- ========================================
-- TABLE: shared_quizzes
-- ========================================
CREATE TABLE IF NOT EXISTS shared_quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    quiz_id TEXT NOT NULL, -- Référence au quiz dans le document
    quiz_title TEXT NOT NULL,
    quiz_data JSONB NOT NULL, -- Contenu du quiz
    shared_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_visible BOOLEAN DEFAULT true,
    permissions TEXT DEFAULT 'view',
    
    -- Contraintes
    CONSTRAINT shared_quizzes_permissions_valid CHECK (permissions IN ('view', 'edit', 'admin')),
    CONSTRAINT shared_quizzes_title_length CHECK (char_length(quiz_title) <= 200)
);

-- ========================================
-- TABLE: group_messages
-- ========================================
CREATE TABLE IF NOT EXISTS group_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- 'text', 'file', 'system', 'invitation'
    metadata JSONB, -- Pour les messages spéciaux (partage de fichier, etc.)
    parent_message_id UUID REFERENCES group_messages(id) ON DELETE SET NULL, -- Pour les réponses
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT group_messages_content_length CHECK (char_length(content) <= 2000),
    CONSTRAINT group_messages_type_valid CHECK (message_type IN ('text', 'file', 'system', 'invitation'))
);

-- ========================================
-- TABLE: group_message_reactions
-- ========================================
CREATE TABLE IF NOT EXISTS group_message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES group_messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT group_message_reactions_unique UNIQUE(message_id, user_id, emoji),
    CONSTRAINT group_message_reactions_emoji_valid CHECK (char_length(emoji) <= 10)
);

-- ========================================
-- INDEXES
-- ========================================

-- Index pour groups
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_is_private ON groups(is_private);
CREATE INDEX idx_groups_created_at ON groups(created_at);

-- Index pour group_members
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_role ON group_members(role);
CREATE INDEX idx_group_members_joined_at ON group_members(joined_at);

-- Index pour group_invitations
CREATE INDEX idx_group_invitations_group_id ON group_invitations(group_id);
CREATE INDEX idx_group_invitations_invited_email ON group_invitations(invited_email);
CREATE INDEX idx_group_invitations_invited_user_id ON group_invitations(invited_user_id);
CREATE INDEX idx_group_invitations_token ON group_invitations(invitation_token);
CREATE INDEX idx_group_invitations_status ON group_invitations(status);
CREATE INDEX idx_group_invitations_expires_at ON group_invitations(expires_at);

-- Index pour shared_documents
CREATE INDEX idx_shared_documents_group_id ON shared_documents(group_id);
CREATE INDEX idx_shared_documents_document_id ON shared_documents(document_id);
CREATE INDEX idx_shared_documents_shared_by ON shared_documents(shared_by);
CREATE INDEX idx_shared_documents_shared_at ON shared_documents(shared_at);

-- Index pour shared_study_cards
CREATE INDEX idx_shared_study_cards_group_id ON shared_study_cards(group_id);
CREATE INDEX idx_shared_study_cards_study_card_id ON shared_study_cards(study_card_id);
CREATE INDEX idx_shared_study_cards_shared_by ON shared_study_cards(shared_by);

-- Index pour shared_quizzes
CREATE INDEX idx_shared_quizzes_group_id ON shared_quizzes(group_id);
CREATE INDEX idx_shared_quizzes_shared_by ON shared_quizzes(shared_by);
CREATE INDEX idx_shared_quizzes_shared_at ON shared_quizzes(shared_at);

-- Index pour group_messages
CREATE INDEX idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX idx_group_messages_user_id ON group_messages(user_id);
CREATE INDEX idx_group_messages_parent_message_id ON group_messages(parent_message_id);
CREATE INDEX idx_group_messages_created_at ON group_messages(created_at DESC);
CREATE INDEX idx_group_messages_type ON group_messages(message_type);

-- Index pour group_message_reactions
CREATE INDEX idx_group_message_reactions_message_id ON group_message_reactions(message_id);
CREATE INDEX idx_group_message_reactions_user_id ON group_message_reactions(user_id);

-- ========================================
-- RLS (Row Level Security)
-- ========================================

-- Activer RLS sur toutes les tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_study_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_message_reactions ENABLE ROW LEVEL SECURITY;

-- Politiques pour groups
CREATE POLICY "Users can view groups they are members of" ON groups
    FOR SELECT USING (
        id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group admins can update groups" ON groups
    FOR UPDATE USING (
        created_by = auth.uid() OR
        id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Group admins can delete groups" ON groups
    FOR DELETE USING (
        created_by = auth.uid()
    );

-- Politiques pour group_members
CREATE POLICY "Users can view group memberships" ON group_members
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own memberships" ON group_members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Group admins can manage memberships" ON group_members
    FOR ALL USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Users can join groups via invitation" ON group_members
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        id IN (
            SELECT group_id FROM group_invitations 
            WHERE (invited_user_id = auth.uid() OR invited_email = (
                SELECT email FROM profiles WHERE id = auth.uid()
            )) AND status = 'pending'
        )
    );

-- Politiques pour group_invitations
CREATE POLICY "Users can view invitations they sent or received" ON group_invitations
    FOR SELECT USING (
        invited_by = auth.uid() OR
        invited_user_id = auth.uid() OR
        invited_email = (SELECT email FROM profiles WHERE id = auth.uid()) OR
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Group members can create invitations" ON group_invitations
    FOR INSERT WITH CHECK (
        invited_by = auth.uid() AND
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Invited users can respond to invitations" ON group_invitations
    FOR UPDATE USING (
        invited_user_id = auth.uid() OR
        invited_email = (SELECT email FROM profiles WHERE id = auth.uid())
    );

-- Politiques pour shared_documents
CREATE POLICY "Group members can view shared documents" ON shared_documents
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Group members can share documents" ON shared_documents
    FOR INSERT WITH CHECK (
        shared_by = auth.uid() AND
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Document owners or admins can manage sharing" ON shared_documents
    FOR ALL USING (
        shared_by = auth.uid() OR
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- Politiques pour shared_study_cards
CREATE POLICY "Group members can view shared study cards" ON shared_study_cards
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Group members can share study cards" ON shared_study_cards
    FOR INSERT WITH CHECK (
        shared_by = auth.uid() AND
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

-- Politiques pour shared_quizzes
CREATE POLICY "Group members can view shared quizzes" ON shared_quizzes
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Group members can share quizzes" ON shared_quizzes
    FOR INSERT WITH CHECK (
        shared_by = auth.uid() AND
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

-- Politiques pour group_messages
CREATE POLICY "Group members can view group messages" ON group_messages
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Group members can send messages" ON group_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can edit their own messages" ON group_messages
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON group_messages
    FOR DELETE USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- Politiques pour group_message_reactions
CREATE POLICY "Group members can view message reactions" ON group_message_reactions
    FOR SELECT USING (
        message_id IN (
            SELECT id FROM group_messages 
            WHERE group_id IN (
                SELECT group_id FROM group_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can add reactions" ON group_message_reactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Users can remove their own reactions" ON group_message_reactions
    FOR DELETE USING (user_id = auth.uid());

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger pour updated_at sur groups
CREATE OR REPLACE FUNCTION update_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_groups_update
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_groups_updated_at();

-- Trigger pour nettoyage des invitations expirées
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE group_invitations 
    SET status = 'expired' 
    WHERE status = 'pending' AND expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger quotidien pour le nettoyage (via pg_cron si disponible)
-- SELECT cron.schedule('cleanup-expired-invitations', '0 2 * * *', 'SELECT cleanup_expired_invitations();');

-- ========================================
-- VUES UTILES
-- ========================================

-- Vue pour les groupes avec les informations de membership
CREATE OR REPLACE VIEW group_details AS
SELECT 
    g.*,
    gm.role as user_role,
    gm.joined_at as user_joined_at,
    (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
    (SELECT COUNT(*) FROM group_messages WHERE group_id = g.id) as message_count,
    (SELECT COUNT(*) FROM shared_documents WHERE group_id = g.id) as shared_documents_count,
    (SELECT COUNT(*) FROM shared_study_cards WHERE group_id = g.id) as shared_cards_count
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = auth.uid();

-- Vue pour les invitations en attente
CREATE OR REPLACE VIEW pending_invitations AS
SELECT 
    gi.*,
    g.name as group_name,
    p.full_name as invited_by_name,
    p.avatar_url as invited_by_avatar
FROM group_invitations gi
JOIN groups g ON gi.group_id = g.id
JOIN profiles p ON gi.invited_by = p.id
WHERE gi.status = 'pending' AND (
    gi.invited_user_id = auth.uid() OR 
    gi.invited_email = (SELECT email FROM profiles WHERE id = auth.uid())
);

-- Vue pour les messages avec les informations utilisateur
CREATE OR REPLACE VIEW group_messages_with_user AS
SELECT 
    gm.*,
    p.full_name as user_name,
    p.avatar_url as user_avatar,
    (SELECT COUNT(*) FROM group_message_reactions gmr WHERE gmr.message_id = gm.id) as reaction_count
FROM group_messages gm
JOIN profiles p ON gm.user_id = p.id
WHERE gm.group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
);
