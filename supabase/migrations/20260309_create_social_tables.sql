-- Migration pour les tables sociales (Phase 3.2)
-- Date: 9 mars 2025
-- Description: Tables pour les profils publics, découverte, demandes d'amis et activité

-- ========================================
-- TABLE: public_profiles
-- ========================================
CREATE TABLE IF NOT EXISTS public_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    location TEXT,
    website TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    is_public BOOLEAN DEFAULT true,
    show_email BOOLEAN DEFAULT false,
    show_groups BOOLEAN DEFAULT true,
    show_stats BOOLEAN DEFAULT true,
    allow_friend_requests BOOLEAN DEFAULT true,
    interests TEXT[], -- Array d'intérêts/tags
    skills TEXT[], -- Array de compétences
    education JSONB, -- Formation: [{school: "", degree: "", year: ""}]
    experience JSONB, -- Expérience: [{company: "", position: "", years: ""}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT public_profiles_display_name_length CHECK (char_length(display_name) >= 2 AND char_length(display_name) <= 50),
    CONSTRAINT public_profiles_bio_length CHECK (char_length(bio) <= 500),
    CONSTRAINT public_profiles_location_length CHECK (char_length(location) <= 100),
    CONSTRAINT public_profiles_website_format CHECK (
        website IS NULL OR 
        website ~* '^https?://[^\s/$.?#].[^\s]*$'
    ),
    CONSTRAINT public_profiles_github_format CHECK (
        github_url IS NULL OR 
        github_url ~* '^https?://(www\.)?github\.com/[\w\-]+$'
    ),
    CONSTRAINT public_profiles_linkedin_format CHECK (
        linkedin_url IS NULL OR 
        linkedin_url ~* '^https?://(www\.)?linkedin\.com/in/[\w\-]+$'
    ),
    CONSTRAINT public_profiles_twitter_format CHECK (
        twitter_url IS NULL OR 
        twitter_url ~* '^https?://(www\.)?twitter\.com/[\w\-]+$'
    )
);

-- ========================================
-- TABLE: friend_requests
-- ========================================
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'withdrawn'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Contraintes
    CONSTRAINT friend_requests_status_valid CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
    CONSTRAINT friend_requests_unique UNIQUE(sender_id, receiver_id),
    CONSTRAINT friend_requests_no_self CHECK (sender_id != receiver_id),
    CONSTRAINT friend_requests_message_length CHECK (char_length(message) <= 200)
);

-- ========================================
-- TABLE: friendships
-- ========================================
CREATE TABLE IF NOT EXISTS friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT friendships_unique UNIQUE(user1_id, user2_id),
    CONSTRAINT friendships_no_self CHECK (user1_id != user2_id),
    CONSTRAINT friendships_ordered CHECK (user1_id < user2_id) -- Pour éviter les doublons inversés
);

-- ========================================
-- TABLE: group_join_requests
-- ========================================
CREATE TABLE IF NOT EXISTS group_join_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'withdrawn'
    requested_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- Qui a fait la demande
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Contraintes
    CONSTRAINT group_join_requests_status_valid CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
    CONSTRAINT group_join_requests_unique UNIQUE(group_id, user_id),
    CONSTRAINT group_join_requests_message_length CHECK (char_length(message) <= 300)
);

-- ========================================
-- TABLE: activity_feed
-- ========================================
CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL, -- 'joined_group', 'shared_document', 'shared_card', 'shared_quiz', 'created_group', 'added_friend', 'left_group'
    target_type TEXT, -- 'group', 'document', 'study_card', 'quiz', 'user'
    target_id TEXT, -- ID de la cible
    target_name TEXT, -- Nom lisible de la cible
    metadata JSONB, -- Données supplémentaires selon le type d'action
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT activity_feed_action_type_valid CHECK (
        action_type IN ('joined_group', 'shared_document', 'shared_card', 'shared_quiz', 'created_group', 'added_friend', 'left_group', 'updated_profile')
    ),
    CONSTRAINT activity_feed_target_name_length CHECK (char_length(target_name) <= 100)
);

-- ========================================
-- TABLE: trending_groups
-- ========================================
CREATE TABLE IF NOT EXISTS trending_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL UNIQUE,
    score NUMERIC DEFAULT 0, -- Score de tendance calculé
    member_growth_rate NUMERIC DEFAULT 0, -- Taux de croissance des membres
    activity_score NUMERIC DEFAULT 0, -- Score d'activité
    discovery_views INTEGER DEFAULT 0, -- Nombre de vues dans la découverte
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLE: discovery_views
-- ========================================
CREATE TABLE IF NOT EXISTS discovery_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    target_type TEXT NOT NULL, -- 'group', 'user', 'document', 'study_card'
    target_id TEXT NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT discovery_views_target_type_valid CHECK (
        target_type IN ('group', 'user', 'document', 'study_card')
    )
);

-- ========================================
-- TABLE: user_interests
-- ========================================
CREATE TABLE IF NOT EXISTS user_interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    interest TEXT NOT NULL,
    category TEXT, -- 'academic', 'professional', 'hobby', 'other'
    proficiency_level INTEGER DEFAULT 1, -- 1-5: beginner to expert
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT user_interests_unique UNIQUE(user_id, interest),
    CONSTRAINT user_interests_interest_length CHECK (char_length(interest) >= 2 AND char_length(interest) <= 50),
    CONSTRAINT user_interests_category_valid CHECK (category IN ('academic', 'professional', 'hobby', 'other')),
    CONSTRAINT user_interests_proficiency_valid CHECK (proficiency_level BETWEEN 1 AND 5)
);

-- ========================================
-- INDEXES
-- ========================================

-- Index pour public_profiles
CREATE INDEX idx_public_profiles_user_id ON public_profiles(user_id);
CREATE INDEX idx_public_profiles_display_name ON public_profiles(display_name);
CREATE INDEX idx_public_profiles_is_public ON public_profiles(is_public);
CREATE INDEX idx_public_profile_interests ON public_profiles USING GIN(interests);
CREATE INDEX idx_public_profile_skills ON public_profiles USING GIN(skills);
CREATE INDEX idx_public_profiles_created_at ON public_profiles(created_at);

-- Index pour friend_requests
CREATE INDEX idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_friend_requests_created_at ON friend_requests(created_at);

-- Index pour friendships
CREATE INDEX idx_friendships_user1_id ON friendships(user1_id);
CREATE INDEX idx_friendships_user2_id ON friendships(user2_id);
CREATE INDEX idx_friendships_created_at ON friendships(created_at);

-- Index pour group_join_requests
CREATE INDEX idx_group_join_requests_group_id ON group_join_requests(group_id);
CREATE INDEX idx_group_join_requests_user_id ON group_join_requests(user_id);
CREATE INDEX idx_group_join_requests_status ON group_join_requests(status);
CREATE INDEX idx_group_join_requests_created_at ON group_join_requests(created_at);

-- Index pour activity_feed
CREATE INDEX idx_activity_feed_actor_id ON activity_feed(actor_id);
CREATE INDEX idx_activity_feed_action_type ON activity_feed(action_type);
CREATE INDEX idx_activity_feed_target_type ON activity_feed(target_type);
CREATE INDEX idx_activity_feed_is_public ON activity_feed(is_public);
CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at DESC);

-- Index pour trending_groups
CREATE INDEX idx_trending_groups_score ON trending_groups(score DESC);
CREATE INDEX idx_trending_groups_activity_score ON trending_groups(activity_score DESC);
CREATE INDEX idx_trending_groups_member_growth ON trending_groups(member_growth_rate DESC);
CREATE INDEX idx_trending_groups_last_calculated ON trending_groups(last_calculated);

-- Index pour discovery_views
CREATE INDEX idx_discovery_views_user_id ON discovery_views(user_id);
CREATE INDEX idx_discovery_views_target ON discovery_views(target_type, target_id);
CREATE INDEX idx_discovery_views_viewed_at ON discovery_views(viewed_at);

-- Index pour user_interests
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_interest ON user_interests(interest);
CREATE INDEX idx_user_interests_category ON user_interests(category);

-- ========================================
-- RLS (Row Level Security)
-- ========================================

-- Activer RLS sur toutes les tables
ALTER TABLE public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- Politiques pour public_profiles
CREATE POLICY "Users can view public profiles" ON public_profiles
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own profile" ON public_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public_profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own profile" ON public_profiles
    FOR DELETE USING (user_id = auth.uid());

-- Politiques pour friend_requests
CREATE POLICY "Users can view their friend requests" ON friend_requests
    FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can create friend requests" ON friend_requests
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Senders can update their requests" ON friend_requests
    FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Receivers can respond to requests" ON friend_requests
    FOR UPDATE USING (receiver_id = auth.uid());

-- Politiques pour friendships
CREATE POLICY "Users can view their friendships" ON friendships
    FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "System can create friendships" ON friendships
    FOR INSERT WITH CHECK (true); -- Créé par trigger lors de l'acceptation

-- Politiques pour group_join_requests
CREATE POLICY "Users can view group join requests they're involved in" ON group_join_requests
    FOR SELECT USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Users can create join requests" ON group_join_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Group admins can manage join requests" ON group_join_requests
    FOR UPDATE USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- Politiques pour activity_feed
CREATE POLICY "Users can view public activities" ON activity_feed
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view friend activities" ON activity_feed
    FOR SELECT USING (
        actor_id IN (
            SELECT user2_id FROM friendships WHERE user1_id = auth.uid()
            UNION
            SELECT user1_id FROM friendships WHERE user2_id = auth.uid()
        )
    );

CREATE POLICY "Users can view group member activities" ON activity_feed
    FOR SELECT USING (
        target_type = 'group' AND
        target_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

-- Politiques pour trending_groups
CREATE POLICY "Everyone can view trending groups" ON trending_groups
    FOR SELECT USING (true);

CREATE POLICY "System can update trending groups" ON trending_groups
    FOR ALL USING (false); -- Uniquement par triggers/procédures admin

-- Politiques pour discovery_views
CREATE POLICY "Users can view own discovery views" ON discovery_views
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create discovery views" ON discovery_views
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Politiques pour user_interests
CREATE POLICY "Users can view their interests" ON user_interests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their interests" ON user_interests
    FOR ALL USING (user_id = auth.uid());

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger pour updated_at sur public_profiles
CREATE OR REPLACE FUNCTION update_public_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_public_profiles_update
    BEFORE UPDATE ON public_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_public_profiles_updated_at();

-- Trigger pour updated_at sur trending_groups
CREATE OR REPLACE FUNCTION update_trending_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_trending_groups_update
    BEFORE UPDATE ON trending_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_trending_groups_updated_at();

-- Trigger pour créer une amitié lors de l'acceptation d'une demande
CREATE OR REPLACE FUNCTION create_friendship_on_accept()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer l'amitié
    INSERT INTO friendships (user1_id, user2_id)
    VALUES (
        LEAST(OLD.sender_id, OLD.receiver_id),
        GREATEST(OLD.sender_id, OLD.receiver_id)
    );
    
    -- Ajouter à l'activité feed
    INSERT INTO activity_feed (actor_id, action_type, target_type, target_id, target_name, metadata)
    VALUES (
        OLD.sender_id,
        'added_friend',
        'user',
        OLD.receiver_id::text,
        (SELECT full_name FROM profiles WHERE id = OLD.receiver_id),
        json_build_object('request_id', OLD.id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_friend_request_accept
    AFTER UPDATE ON friend_requests
    FOR EACH ROW
    WHEN (OLD.status = 'pending' AND NEW.status = 'accepted')
    EXECUTE FUNCTION create_friendship_on_accept();

-- Trigger pour enregistrer les activités
CREATE OR REPLACE FUNCTION log_group_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_feed (actor_id, action_type, target_type, target_id, target_name, metadata)
        VALUES (
            NEW.user_id,
            'joined_group',
            'group',
            NEW.group_id::text,
            (SELECT name FROM groups WHERE id = NEW.group_id),
            json_build_object('role', NEW.role)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO activity_feed (actor_id, action_type, target_type, target_id, target_name)
        VALUES (
            OLD.user_id,
            'left_group',
            'group',
            OLD.group_id::text,
            (SELECT name FROM groups WHERE id = OLD.group_id)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_group_member_change
    AFTER INSERT OR DELETE ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION log_group_activity();

-- ========================================
-- VUES UTILES
-- ========================================

-- Vue pour les profils publics avec statistiques
CREATE OR REPLACE VIEW public_profile_details AS
SELECT 
    pp.*,
    p.full_name as private_name,
    p.email as private_email,
    p.created_at as user_created_at,
    (SELECT COUNT(*) FROM friendships WHERE user1_id = pp.user_id OR user2_id = pp.user_id) as friends_count,
    (SELECT COUNT(*) FROM group_members WHERE user_id = pp.user_id) as groups_count,
    (SELECT COUNT(*) FROM shared_documents WHERE shared_by = pp.user_id) as shared_documents_count,
    (SELECT COUNT(*) FROM shared_study_cards WHERE shared_by = pp.user_id) as shared_cards_count,
    (SELECT COUNT(*) FROM activity_feed WHERE actor_id = pp.user_id AND is_public = true) as public_activities_count
FROM public_profiles pp
JOIN profiles p ON pp.user_id = p.id
WHERE pp.is_public = true;

-- Vue pour les demandes d'amis reçues
CREATE OR REPLACE VIEW received_friend_requests AS
SELECT 
    fr.*,
    sender.full_name as sender_name,
    sender.avatar_url as sender_avatar,
    sender_profile.display_name as sender_display_name
FROM friend_requests fr
JOIN profiles sender ON fr.sender_id = sender.id
LEFT JOIN public_profiles sender_profile ON sender.id = sender_profile.user_id
WHERE fr.receiver_id = auth.uid() AND fr.status = 'pending';

-- Vue pour les demandes d'amis envoyées
CREATE OR REPLACE VIEW sent_friend_requests AS
SELECT 
    fr.*,
    receiver.full_name as receiver_name,
    receiver.avatar_url as receiver_avatar,
    receiver_profile.display_name as receiver_display_name
FROM friend_requests fr
JOIN profiles receiver ON fr.receiver_id = receiver.id
LEFT JOIN public_profiles receiver_profile ON receiver.id = receiver_profile.user_id
WHERE fr.sender_id = auth.uid() AND fr.status = 'pending';

-- Vue pour les amis
CREATE OR REPLACE VIEW user_friends AS
SELECT 
    CASE 
        WHEN f.user1_id = auth.uid() THEN f.user2_id
        ELSE f.user1_id
    END as friend_id,
    p.full_name,
    p.avatar_url,
    pp.display_name,
    pp.bio,
    f.created_at as friendship_date
FROM friendships f
JOIN profiles p ON (
    CASE 
        WHEN f.user1_id = auth.uid() THEN f.user2_id
        ELSE f.user1_id
    END = p.id
)
LEFT JOIN public_profiles pp ON p.id = pp.user_id
WHERE f.user1_id = auth.uid() OR f.user2_id = auth.uid();

-- Vue pour le fil d'activité social
CREATE OR REPLACE VIEW social_activity_feed AS
SELECT 
    af.*,
    actor.full_name as actor_name,
    actor.avatar_url as actor_avatar,
    actor_profile.display_name as actor_display_name
FROM activity_feed af
JOIN profiles actor ON af.actor_id = actor.id
LEFT JOIN public_profiles actor_profile ON actor.id = actor_profile.user_id
WHERE af.is_public = true
   OR af.actor_id IN (
       SELECT user2_id FROM friendships WHERE user1_id = auth.uid()
       UNION
       SELECT user1_id FROM friendships WHERE user2_id = auth.uid()
   )
   OR (
       af.target_type = 'group' AND
       af.target_id IN (
           SELECT group_id FROM group_members WHERE user_id = auth.uid()
       )
   )
ORDER BY af.created_at DESC;

-- Vue pour les groupes tendances
CREATE OR REPLACE VIEW trending_groups_details AS
SELECT 
    tg.*,
    g.name,
    g.description,
    g.is_private,
    g.created_at as group_created_at,
    (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as current_member_count,
    (SELECT COUNT(*) FROM group_messages WHERE group_id = g.id AND created_at > NOW() - INTERVAL '7 days') as messages_last_week
FROM trending_groups tg
JOIN groups g ON tg.group_id = g.id
WHERE tg.score > 0
ORDER BY tg.score DESC;

-- Vue pour les suggestions de groupes basées sur les intérêts
CREATE OR REPLACE VIEW suggested_groups AS
SELECT DISTINCT
    g.*,
    gm.user_id as member_count,
    -- Calcul de score de similarité basé sur les intérêts
    (
        SELECT COUNT(*) 
        FROM user_interests ui1
        JOIN user_interests ui2 ON ui1.interest = ui2.interest
        WHERE ui1.user_id = auth.uid() 
        AND ui2.user_id IN (
            SELECT user_id FROM group_members WHERE group_id = g.id
        )
    ) * 10 as interest_similarity_score
FROM groups g
JOIN group_members gm ON g.id = gm.group_id
WHERE g.is_private = false
    AND gm.user_id != auth.uid()
    AND gm.user_id NOT IN (
        SELECT user_id FROM group_members WHERE group_id = g.id AND user_id = auth.uid()
    )
ORDER BY interest_similarity_score DESC, gm.user_id DESC
LIMIT 20;
