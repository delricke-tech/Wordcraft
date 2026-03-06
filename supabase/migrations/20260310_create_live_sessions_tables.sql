-- Migration pour les tables de sessions live (Phase 3.3)
-- Date: 10 mars 2025
-- Description: Tables pour les sessions vidéo, partage d'écran, chat et enregistrements

-- ========================================
-- TABLE: live_sessions
-- ========================================
CREATE TABLE IF NOT EXISTS live_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL, -- Optionnel, pour les sessions de groupe
    session_type TEXT NOT NULL DEFAULT 'meeting', -- 'meeting', 'presentation', 'study_session', 'workshop'
    max_participants INTEGER DEFAULT 50,
    is_public BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'live', 'ended', 'cancelled'
    room_url TEXT, -- URL de la salle vidéo (Daily.co, Zoom, etc.)
    recording_url TEXT, -- URL de l'enregistrement
    recording_enabled BOOLEAN DEFAULT false,
    screen_sharing_enabled BOOLEAN DEFAULT true,
    chat_enabled BOOLEAN DEFAULT true,
    reactions_enabled BOOLEAN DEFAULT true,
    password TEXT, -- Mot de passe optionnel
    tags TEXT[], -- Tags pour la découverte
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT live_sessions_title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
    CONSTRAINT live_sessions_description_length CHECK (char_length(description) <= 1000),
    CONSTRAINT live_sessions_type_valid CHECK (session_type IN ('meeting', 'presentation', 'study_session', 'workshop')),
    CONSTRAINT live_sessions_status_valid CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    CONSTRAINT live_sessions_max_participants_positive CHECK (max_participants > 0),
    CONSTRAINT live_sessions_dates_valid CHECK (
        (scheduled_start IS NULL) OR (scheduled_end IS NULL) OR (scheduled_start < scheduled_end)
    ),
    CONSTRAINT live_sessions_room_url_format CHECK (
        room_url IS NULL OR 
        room_url ~* '^https?://[^\s/$.?#].[^\s]*$'
    )
);

-- ========================================
-- TABLE: live_session_participants
-- ========================================
CREATE TABLE IF NOT EXISTS live_session_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'participant', -- 'host', 'moderator', 'participant', 'speaker'
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    is_approved BOOLEAN DEFAULT true, -- Pour les sessions nécessitant une approbation
    audio_enabled BOOLEAN DEFAULT false,
    video_enabled BOOLEAN DEFAULT false,
    screen_sharing BOOLEAN DEFAULT false,
    hand_raised BOOLEAN DEFAULT false,
    connection_quality TEXT, -- 'excellent', 'good', 'fair', 'poor'
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT live_session_participants_role_valid CHECK (role IN ('host', 'moderator', 'participant', 'speaker')),
    CONSTRAINT live_session_participants_unique UNIQUE(session_id, user_id),
    CONSTRAINT live_session_participants_connection_quality_valid CHECK (
        connection_quality IS NULL OR 
        connection_quality IN ('excellent', 'good', 'fair', 'poor')
    ),
    CONSTRAINT live_session_participants_dates_valid CHECK (
        (joined_at IS NULL) OR (left_at IS NULL) OR (joined_at <= left_at)
    )
);

-- ========================================
-- TABLE: live_session_invitations
-- ========================================
CREATE TABLE IF NOT EXISTS live_session_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    invited_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Pour les invitations directes
    invited_email TEXT, -- Pour les invitations par email
    invitation_token TEXT UNIQUE NOT NULL,
    access_code TEXT UNIQUE, -- Code d'accès court (ex: ABC123)
    message TEXT,
    role TEXT DEFAULT 'participant', -- Rôle attribué à l'invité
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    
    -- Contraintes
    CONSTRAINT live_session_invitations_role_valid CHECK (role IN ('host', 'moderator', 'participant', 'speaker')),
    CONSTRAINT live_session_invitations_status_valid CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    CONSTRAINT live_session_invitations_email_or_user CHECK (
        (invited_email IS NOT NULL AND invited_user_id IS NULL) OR
        (invited_email IS NULL AND invited_user_id IS NOT NULL)
    ),
    CONSTRAINT live_session_invitations_email_format CHECK (
        invited_email IS NULL OR 
        invited_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT live_session_invitations_access_code_length CHECK (
        access_code IS NULL OR 
        (char_length(access_code) >= 4 AND char_length(access_code) <= 10)
    )
);

-- ========================================
-- TABLE: live_session_messages
-- ========================================
CREATE TABLE IF NOT EXISTS live_session_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'system', 'reaction', 'file', 'poll'
    metadata JSONB, -- Pour les messages spéciaux (fichiers, sondages, etc.)
    parent_message_id UUID REFERENCES live_session_messages(id) ON DELETE SET NULL, -- Pour les réponses
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT live_session_messages_content_length CHECK (char_length(content) <= 2000),
    CONSTRAINT live_session_messages_type_valid CHECK (message_type IN ('text', 'system', 'reaction', 'file', 'poll')),
    CONSTRAINT live_session_messages_parent_not_self CHECK (parent_message_id != id)
);

-- ========================================
-- TABLE: live_session_reactions
-- ========================================
CREATE TABLE IF NOT EXISTS live_session_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL, -- 'emoji', 'clap', 'heart', 'laugh', 'thumbs_up', 'thumbs_down'
    reaction_value TEXT NOT NULL, -- L'emoji ou le type de réaction
    target_type TEXT NOT NULL, -- 'session', 'message', 'participant'
    target_id TEXT, -- ID de la cible (message_id ou user_id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT live_session_reactions_type_valid CHECK (reaction_type IN ('emoji', 'clap', 'heart', 'laugh', 'thumbs_up', 'thumbs_down')),
    CONSTRAINT live_session_reactions_target_type_valid CHECK (target_type IN ('session', 'message', 'participant')),
    CONSTRAINT live_session_reactions_unique UNIQUE(session_id, user_id, reaction_type, reaction_value, target_type, COALESCE(target_id, ''))
);

-- ========================================
-- TABLE: live_session_polls
-- ========================================
CREATE TABLE IF NOT EXISTS live_session_polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    options TEXT[] NOT NULL, -- Array des options de réponse
    poll_type TEXT NOT NULL DEFAULT 'single', -- 'single', 'multiple', 'ranking'
    is_active BOOLEAN DEFAULT true,
    allow_anonymous BOOLEAN DEFAULT false,
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT live_session_polls_question_length CHECK (char_length(question) >= 5 AND char_length(question) <= 500),
    CONSTRAINT live_session_polls_options_valid CHECK (array_length(options, 1) >= 2 AND array_length(options, 1) <= 10),
    CONSTRAINT live_session_polls_type_valid CHECK (poll_type IN ('single', 'multiple', 'ranking'))
);

-- ========================================
-- TABLE: live_session_poll_votes
-- ========================================
CREATE TABLE IF NOT EXISTS live_session_poll_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES live_session_polls(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL si vote anonyme
    selected_options TEXT[] NOT NULL, -- Options sélectionnées (array pour multiple/ranking)
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT live_session_poll_votes_unique UNIQUE(poll_id, COALESCE(user_id, 'anonymous')),
    CONSTRAINT live_session_poll_votes_options_valid CHECK (array_length(selected_options, 1) >= 1)
);

-- ========================================
-- TABLE: live_session_recordings
-- ========================================
CREATE TABLE IF NOT EXISTS live_session_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
    recording_url TEXT NOT NULL,
    recording_type TEXT NOT NULL DEFAULT 'video', -- 'video', 'audio', 'screen', 'combined'
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    thumbnail_url TEXT,
    processing_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Contraintes
    CONSTRAINT live_session_recordings_type_valid CHECK (recording_type IN ('video', 'audio', 'screen', 'combined')),
    CONSTRAINT live_session_recordings_status_valid CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT live_session_recordings_duration_positive CHECK (duration_seconds IS NULL OR duration_seconds > 0),
    CONSTRAINT live_session_recordings_size_positive CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
    CONSTRAINT live_session_recordings_url_format CHECK (
        recording_url ~* '^https?://[^\s/$.?#].[^\s]*$'
    )
);

-- ========================================
-- TABLE: live_session_summaries
-- ========================================
CREATE TABLE IF NOT EXISTS live_session_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
    summary_type TEXT NOT NULL DEFAULT 'ai', -- 'ai', 'manual', 'highlights'
    title TEXT,
    content TEXT NOT NULL,
    key_points TEXT[], -- Points clés de la session
    action_items TEXT[], -- Actions à entreprendre
    tags TEXT[], -- Tags générés automatiquement
    generated_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL si généré par IA
    ai_model_used TEXT, -- Modèle IA utilisé (ex: gpt-4, claude-3)
    confidence_score NUMERIC CHECK (confidence_score BETWEEN 0 AND 1), -- Score de confiance pour les résumés IA
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT live_session_summaries_type_valid CHECK (summary_type IN ('ai', 'manual', 'highlights')),
    CONSTRAINT live_session_summaries_title_length CHECK (char_length(title) <= 200),
    CONSTRAINT live_session_summaries_content_length CHECK (char_length(content) <= 10000)
);

-- ========================================
-- TABLE: live_session_analytics
-- ========================================
CREATE TABLE IF NOT EXISTS live_session_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
    metric_type TEXT NOT NULL, -- 'peak_participants', 'avg_duration', 'message_count', 'reaction_count', 'quality_score'
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT, -- 'count', 'seconds', 'percentage', 'score'
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT live_session_analytics_type_valid CHECK (
        metric_type IN ('peak_participants', 'avg_duration', 'message_count', 'reaction_count', 'quality_score', 'engagement_rate')
    )
);

-- ========================================
-- INDEXES
-- ========================================

-- Index pour live_sessions
CREATE INDEX idx_live_sessions_host_id ON live_sessions(host_id);
CREATE INDEX idx_live_sessions_group_id ON live_sessions(group_id);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);
CREATE INDEX idx_live_sessions_session_type ON live_sessions(session_type);
CREATE INDEX idx_live_sessions_is_public ON live_sessions(is_public);
CREATE INDEX idx_live_sessions_scheduled_start ON live_sessions(scheduled_start);
CREATE INDEX idx_live_sessions_created_at ON live_sessions(created_at);
CREATE INDEX idx_live_sessions_tags ON live_sessions USING GIN(tags);

-- Index pour live_session_participants
CREATE INDEX idx_live_session_participants_session_id ON live_session_participants(session_id);
CREATE INDEX idx_live_session_participants_user_id ON live_session_participants(user_id);
CREATE INDEX idx_live_session_participants_role ON live_session_participants(role);
CREATE INDEX idx_live_session_participants_joined_at ON live_session_participants(joined_at);
CREATE INDEX idx_live_session_participants_is_approved ON live_session_participants(is_approved);

-- Index pour live_session_invitations
CREATE INDEX idx_live_session_invitations_session_id ON live_session_invitations(session_id);
CREATE INDEX idx_live_session_invitations_invited_user_id ON live_session_invitations(invited_user_id);
CREATE INDEX idx_live_session_invitations_invited_email ON live_session_invitations(invited_email);
CREATE INDEX idx_live_session_invitations_token ON live_session_invitations(invitation_token);
CREATE INDEX idx_live_session_invitations_access_code ON live_session_invitations(access_code);
CREATE INDEX idx_live_session_invitations_status ON live_session_invitations(status);
CREATE INDEX idx_live_session_invitations_expires_at ON live_session_invitations(expires_at);

-- Index pour live_session_messages
CREATE INDEX idx_live_session_messages_session_id ON live_session_messages(session_id);
CREATE INDEX idx_live_session_messages_user_id ON live_session_messages(user_id);
CREATE INDEX idx_live_session_messages_parent_message_id ON live_session_messages(parent_message_id);
CREATE INDEX idx_live_session_messages_created_at ON live_session_messages(created_at);
CREATE INDEX idx_live_session_messages_type ON live_session_messages(message_type);

-- Index pour live_session_reactions
CREATE INDEX idx_live_session_reactions_session_id ON live_session_reactions(session_id);
CREATE INDEX idx_live_session_reactions_user_id ON live_session_reactions(user_id);
CREATE INDEX idx_live_session_reactions_target ON live_session_reactions(target_type, target_id);
CREATE INDEX idx_live_session_reactions_created_at ON live_session_reactions(created_at);

-- Index pour live_session_polls
CREATE INDEX idx_live_session_polls_session_id ON live_session_polls(session_id);
CREATE INDEX idx_live_session_polls_created_by ON live_session_polls(created_by);
CREATE INDEX idx_live_session_polls_is_active ON live_session_polls(is_active);
CREATE INDEX idx_live_session_polls_ends_at ON live_session_polls(ends_at);

-- Index pour live_session_poll_votes
CREATE INDEX idx_live_session_poll_votes_poll_id ON live_session_poll_votes(poll_id);
CREATE INDEX idx_live_session_poll_votes_user_id ON live_session_poll_votes(user_id);
CREATE INDEX idx_live_session_poll_votes_voted_at ON live_session_poll_votes(voted_at);

-- Index pour live_session_recordings
CREATE INDEX idx_live_session_recordings_session_id ON live_session_recordings(session_id);
CREATE INDEX idx_live_session_recordings_processing_status ON live_session_recordings(processing_status);
CREATE INDEX idx_live_session_recordings_is_public ON live_session_recordings(is_public);
CREATE INDEX idx_live_session_recordings_created_at ON live_session_recordings(created_at);

-- Index pour live_session_summaries
CREATE INDEX idx_live_session_summaries_session_id ON live_session_summaries(session_id);
CREATE INDEX idx_live_session_summaries_summary_type ON live_session_summaries(summary_type);
CREATE INDEX idx_live_session_summaries_is_public ON live_session_summaries(is_public);
CREATE INDEX idx_live_session_summaries_created_at ON live_session_summaries(created_at);

-- Index pour live_session_analytics
CREATE INDEX idx_live_session_analytics_session_id ON live_session_analytics(session_id);
CREATE INDEX idx_live_session_analytics_metric_type ON live_session_analytics(metric_type);
CREATE INDEX idx_live_session_analytics_recorded_at ON live_session_analytics(recorded_at);

-- ========================================
-- RLS (Row Level Security)
-- ========================================

-- Activer RLS sur toutes les tables
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_analytics ENABLE ROW LEVEL SECURITY;

-- Politiques pour live_sessions
CREATE POLICY "Users can view public sessions" ON live_sessions
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view sessions they're invited to" ON live_sessions
    FOR SELECT USING (
        id IN (
            SELECT session_id FROM live_session_invitations 
            WHERE (invited_user_id = auth.uid() OR invited_email = (
                SELECT email FROM profiles WHERE id = auth.uid()
            )) AND status = 'accepted'
        )
    );

CREATE POLICY "Users can view group sessions" ON live_sessions
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own sessions" ON live_sessions
    FOR SELECT USING (host_id = auth.uid());

CREATE POLICY "Users can create sessions" ON live_sessions
    FOR INSERT WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can update their sessions" ON live_sessions
    FOR UPDATE USING (host_id = auth.uid());

CREATE POLICY "Hosts can delete their sessions" ON live_sessions
    FOR DELETE USING (host_id = auth.uid());

-- Politiques pour live_session_participants
CREATE POLICY "Users can view session participants" ON live_session_participants
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM live_sessions 
            WHERE is_public = true 
               OR host_id = auth.uid()
               OR group_id IN (
                   SELECT group_id FROM group_members WHERE user_id = auth.uid()
               )
               OR id IN (
                   SELECT session_id FROM live_session_invitations 
                   WHERE (invited_user_id = auth.uid() OR invited_email = (
                       SELECT email FROM profiles WHERE id = auth.uid()
                   )) AND status = 'accepted'
               )
        )
    );

CREATE POLICY "Users can manage their participation" ON live_session_participants
    FOR ALL USING (user_id = auth.uid());

-- Politiques pour live_session_invitations
CREATE POLICY "Users can view their session invitations" ON live_session_invitations
    FOR SELECT USING (
        invited_user_id = auth.uid() OR 
        invited_email = (SELECT email FROM profiles WHERE id = auth.uid()) OR
        session_id IN (
            SELECT id FROM live_sessions WHERE host_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can create invitations" ON live_session_invitations
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM live_sessions WHERE host_id = auth.uid()
        )
    );

CREATE POLICY "Invited users can respond" ON live_session_invitations
    FOR UPDATE USING (
        invited_user_id = auth.uid() OR 
        invited_email = (SELECT email FROM profiles WHERE id = auth.uid())
    );

-- Politiques pour live_session_messages
CREATE POLICY "Participants can view session messages" ON live_session_messages
    FOR SELECT USING (
        session_id IN (
            SELECT session_id FROM live_session_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can send messages" ON live_session_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        session_id IN (
            SELECT session_id FROM live_session_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages" ON live_session_messages
    FOR UPDATE USING (user_id = auth.uid());

-- Politiques pour live_session_reactions
CREATE POLICY "Participants can view reactions" ON live_session_reactions
    FOR SELECT USING (
        session_id IN (
            SELECT session_id FROM live_session_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can add reactions" ON live_session_reactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own reactions" ON live_session_reactions
    FOR DELETE USING (user_id = auth.uid());

-- Politiques pour live_session_polls
CREATE POLICY "Participants can view polls" ON live_session_polls
    FOR SELECT USING (
        session_id IN (
            SELECT session_id FROM live_session_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Hosts and moderators can create polls" ON live_session_polls
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        session_id IN (
            SELECT session_id FROM live_session_participants 
            WHERE user_id = auth.uid() AND role IN ('host', 'moderator')
        )
    );

-- Politiques pour live_session_poll_votes
CREATE POLICY "Participants can vote in polls" ON live_session_poll_votes
    FOR INSERT WITH CHECK (
        poll_id IN (
            SELECT id FROM live_session_polls 
            WHERE session_id IN (
                SELECT session_id FROM live_session_participants 
                WHERE user_id = auth.uid()
            ) AND is_active = true
        )
    );

-- Politiques pour live_session_recordings
CREATE POLICY "Users can view public recordings" ON live_session_recordings
    FOR SELECT USING (is_public = true);

CREATE POLICY "Participants can view session recordings" ON live_session_recordings
    FOR SELECT USING (
        session_id IN (
            SELECT session_id FROM live_session_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can manage recordings" ON live_session_recordings
    FOR ALL USING (
        session_id IN (
            SELECT id FROM live_sessions WHERE host_id = auth.uid()
        )
    );

-- Politiques pour live_session_summaries
CREATE POLICY "Users can view public summaries" ON live_session_summaries
    FOR SELECT USING (is_public = true);

CREATE POLICY "Participants can view session summaries" ON live_session_summaries
    FOR SELECT USING (
        session_id IN (
            SELECT session_id FROM live_session_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can manage summaries" ON live_session_summaries
    FOR ALL USING (
        session_id IN (
            SELECT id FROM live_sessions WHERE host_id = auth.uid()
        )
    );

-- Politiques pour live_session_analytics
CREATE POLICY "Hosts can view their session analytics" ON live_session_analytics
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM live_sessions WHERE host_id = auth.uid()
        )
    );

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger pour updated_at sur live_sessions
CREATE OR REPLACE FUNCTION update_live_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_live_sessions_update
    BEFORE UPDATE ON live_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_live_sessions_updated_at();

-- Trigger pour créer un participant automatiquement pour l'hôte
CREATE OR REPLACE FUNCTION create_host_participant()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO live_session_participants (
        session_id,
        user_id,
        role,
        joined_at,
        audio_enabled,
        video_enabled,
        is_approved
    ) VALUES (
        NEW.id,
        NEW.host_id,
        'host',
        NEW.actual_start,
        true,
        true,
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_live_session_insert
    AFTER INSERT ON live_sessions
    FOR EACH ROW
    EXECUTE FUNCTION create_host_participant();

-- Trigger pour calculer les statistiques de session
CREATE OR REPLACE FUNCTION calculate_session_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer le nombre de participants maximum
    INSERT INTO live_session_analytics (session_id, metric_type, metric_value, metric_unit)
    SELECT 
        NEW.session_id,
        'peak_participants',
        COUNT(*)::numeric,
        'count'
    FROM live_session_participants 
    WHERE session_id = NEW.session_id AND joined_at IS NOT NULL
    ON CONFLICT (session_id, metric_type) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, recorded_at = NOW();
    
    -- Calculer le nombre de messages
    INSERT INTO live_session_analytics (session_id, metric_type, metric_value, metric_unit)
    SELECT 
        NEW.session_id,
        'message_count',
        COUNT(*)::numeric,
        'count'
    FROM live_session_messages 
    WHERE session_id = NEW.session_id AND is_deleted = false
    ON CONFLICT (session_id, metric_type) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, recorded_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_session_end_analytics
    AFTER UPDATE ON live_sessions
    FOR EACH ROW
    WHEN (OLD.status != 'ended' AND NEW.status = 'ended')
    EXECUTE FUNCTION calculate_session_analytics();

-- ========================================
-- VUES UTILES
-- ========================================

-- Vue pour les sessions avec les informations de l'hôte
CREATE OR REPLACE VIEW live_sessions_with_host AS
SELECT 
    ls.*,
    host.full_name as host_name,
    host.avatar_url as host_avatar,
    host_profile.display_name as host_display_name,
    (SELECT COUNT(*) FROM live_session_participants WHERE session_id = ls.id AND joined_at IS NOT NULL) as current_participants,
    (SELECT COUNT(*) FROM live_session_messages WHERE session_id = ls.id AND is_deleted = false) as message_count,
    (SELECT COUNT(*) FROM live_session_reactions WHERE session_id = ls.id) as reaction_count
FROM live_sessions ls
JOIN profiles host ON ls.host_id = host.id
LEFT JOIN public_profiles host_profile ON host.id = host_profile.user_id;

-- Vue pour les participants avec les informations utilisateur
CREATE OR REPLACE VIEW live_session_participants_with_user AS
SELECT 
    lsp.*,
    participant.full_name as user_name,
    participant.avatar_url as user_avatar,
    participant_profile.display_name as user_display_name,
    EXTRACT(EPOCH FROM (lsp.left_at - lsp.joined_at)) AS duration_seconds
FROM live_session_participants lsp
JOIN profiles participant ON lsp.user_id = participant.id
LEFT JOIN public_profiles participant_profile ON participant.id = participant_profile.user_id;

-- Vue pour les invitations en attente
CREATE OR REPLACE VIEW pending_session_invitations AS
SELECT 
    lsi.*,
    session.title as session_title,
    session.scheduled_start,
    host.full_name as host_name,
    host_profile.display_name as host_display_name
FROM live_session_invitations lsi
JOIN live_sessions session ON lsi.session_id = session.id
JOIN profiles host ON session.host_id = host.id
LEFT JOIN public_profiles host_profile ON host.id = host_profile.user_id
WHERE lsi.status = 'pending' AND (
    lsi.invited_user_id = auth.uid() OR 
    lsi.invited_email = (SELECT email FROM profiles WHERE id = auth.uid())
);

-- Vue pour les messages avec les informations utilisateur
CREATE OR REPLACE VIEW live_session_messages_with_user AS
SELECT 
    lsm.*,
    user_profile.full_name as user_name,
    user_profile.avatar_url as user_avatar,
    user_profile.display_name as user_display_name,
    (SELECT COUNT(*) FROM live_session_reactions WHERE target_type = 'message' AND target_id = lsm.id::text) as reaction_count
FROM live_session_messages lsm
JOIN profiles user_profile ON lsm.user_id = user_profile.id
LEFT JOIN public_profiles user_profile_display ON user_profile.id = user_profile_display.user_id
WHERE lsm.is_deleted = false;

-- Vue pour les sessions à venir de l'utilisateur
CREATE OR REPLACE VIEW upcoming_user_sessions AS
SELECT 
    ls.*,
    host.full_name as host_name,
    host.avatar_url as host_avatar,
    participant.role as user_role,
    participant.is_approved as is_approved
FROM live_sessions ls
JOIN profiles host ON ls.host_id = host.id
LEFT JOIN live_session_participants participant ON ls.id = participant.session_id AND participant.user_id = auth.uid()
WHERE 
    (ls.host_id = auth.uid() OR participant.user_id IS NOT NULL)
    AND ls.status IN ('scheduled', 'live')
    AND (ls.scheduled_start IS NULL OR ls.scheduled_start > NOW() OR ls.status = 'live')
ORDER BY ls.scheduled_start ASC NULLS FIRST;
