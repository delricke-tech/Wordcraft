-- Migration: Création des tables pour la collaboration temps réel (multi-users simultanés)
-- Date: 11 mars 2026
-- Description: Tables pour gérer la collaboration en temps réel avec WebSocket et synchronisation

-- Table des sessions de collaboration
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('document', 'note', 'conversation', 'flashcard', 'quiz')),
    title VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB NOT NULL DEFAULT '{}'
);

-- Table des participants aux sessions
CREATE TABLE IF NOT EXISTS collaboration_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_avatar TEXT,
    user_color VARCHAR(7) NOT NULL,
    cursor JSONB, -- {line, column, length}
    selection JSONB, -- {start: {line, column}, end: {line, column}}
    status VARCHAR(20) DEFAULT 'online' CHECK (status IN ('online', 'away', 'offline')),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    permissions JSONB NOT NULL DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des événements de collaboration
CREATE TABLE IF NOT EXISTS collaboration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'cursor_move', 'selection_change', 'text_insert', 'text_delete', 
        'format_change', 'participant_join', 'participant_leave', 
        'comment_add', 'comment_edit', 'comment_delete', 'chat_message',
        'save_request', 'conflict'
    )),
    event_data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Table des messages de chat de collaboration
CREATE TABLE IF NOT EXISTS collaboration_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'system', 'file', 'emoji')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    reactions JSONB DEFAULT '[]' -- [{emoji, userId, userName, timestamp}]
);

-- Table des versions du document (historique)
CREATE TABLE IF NOT EXISTS collaboration_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    changes JSONB DEFAULT '[]', -- Liste des changements depuis la version précédente
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    is_auto_save BOOLEAN DEFAULT false,
    UNIQUE(session_id, version)
);

-- Table des commentaires de collaboration
CREATE TABLE IF NOT EXISTS collaboration_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_avatar TEXT,
    position JSONB NOT NULL, -- {line, column, length}
    content TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    thread_id UUID REFERENCES collaboration_comments(id) ON DELETE SET NULL -- Pour les réponses
);

-- Index pour les performances
CREATE INDEX idx_collaboration_sessions_document_id ON collaboration_sessions(document_id);
CREATE INDEX idx_collaboration_sessions_document_type ON collaboration_sessions(document_type);
CREATE INDEX idx_collaboration_sessions_is_active ON collaboration_sessions(is_active);
CREATE INDEX idx_collaboration_sessions_created_by ON collaboration_sessions(created_by);
CREATE INDEX idx_collaboration_sessions_created_at ON collaboration_sessions(created_at DESC);
CREATE INDEX idx_collaboration_sessions_title ON collaboration_sessions USING gin(to_tsvector('french', title));

CREATE INDEX idx_collaboration_participants_session_id ON collaboration_participants(session_id);
CREATE INDEX idx_collaboration_participants_user_id ON collaboration_participants(user_id);
CREATE INDEX idx_collaboration_participants_status ON collaboration_participants(status);
CREATE INDEX idx_collaboration_participants_last_seen ON collaboration_participants(last_seen DESC);
CREATE INDEX idx_collaboration_participants_joined_at ON collaboration_participants(joined_at);

CREATE INDEX idx_collaboration_events_session_id ON collaboration_events(session_id);
CREATE INDEX idx_collaboration_events_user_id ON collaboration_events(user_id);
CREATE INDEX idx_collaboration_events_event_type ON collaboration_events(event_type);
CREATE INDEX idx_collaboration_events_timestamp ON collaboration_events(timestamp DESC);
CREATE INDEX idx_collaboration_events_processed ON collaboration_events(processed);

CREATE INDEX idx_collaboration_messages_session_id ON collaboration_messages(session_id);
CREATE INDEX idx_collaboration_messages_user_id ON collaboration_messages(user_id);
CREATE INDEX idx_collaboration_messages_timestamp ON collaboration_messages(timestamp DESC);
CREATE INDEX idx_collaboration_messages_type ON collaboration_messages(type);

CREATE INDEX idx_collaboration_versions_session_id ON collaboration_versions(session_id);
CREATE INDEX idx_collaboration_versions_version ON collaboration_versions(version DESC);
CREATE INDEX idx_collaboration_versions_created_at ON collaboration_versions(created_at DESC);
CREATE INDEX idx_collaboration_versions_is_auto_save ON collaboration_versions(is_auto_save);

CREATE INDEX idx_collaboration_comments_session_id ON collaboration_comments(session_id);
CREATE INDEX idx_collaboration_comments_user_id ON collaboration_comments(user_id);
CREATE INDEX idx_collaboration_comments_resolved ON collaboration_comments(resolved);
CREATE INDEX idx_collaboration_comments_thread_id ON collaboration_comments(thread_id);
CREATE INDEX idx_collaboration_comments_created_at ON collaboration_comments(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_collaboration_sessions_updated_at 
    BEFORE UPDATE ON collaboration_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_comments_updated_at 
    BEFORE UPDATE ON collaboration_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS pour les sessions de collaboration
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collaboration sessions" ON collaboration_sessions
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create own collaboration sessions" ON collaboration_sessions
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own collaboration sessions" ON collaboration_sessions
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own collaboration sessions" ON collaboration_sessions
    FOR DELETE USING (created_by = auth.uid());

-- Politiques RLS pour les participants
ALTER TABLE collaboration_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collaboration participants" ON collaboration_participants
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE created_by = auth.uid()
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can manage collaboration participants" ON collaboration_participants
    FOR ALL USING (
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE created_by = auth.uid()
        )
    );

-- Politiques RLS pour les événements
ALTER TABLE collaboration_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collaboration events" ON collaboration_events
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE created_by = auth.uid()
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can create collaboration events" ON collaboration_events
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE created_by = auth.uid()
        ) OR user_id = auth.uid()
    );

-- Politiques RLS pour les messages
ALTER TABLE collaboration_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collaboration messages" ON collaboration_messages
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE created_by = auth.uid()
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can create collaboration messages" ON collaboration_messages
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE created_by = auth.uid()
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can update own collaboration messages" ON collaboration_messages
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own collaboration messages" ON collaboration_messages
    FOR DELETE USING (user_id = auth.uid());

-- Politiques RLS pour les versions
ALTER TABLE collaboration_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collaboration versions" ON collaboration_versions
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE created_by = auth.uid()
        ) OR created_by = auth.uid()
    );

CREATE POLICY "Users can create collaboration versions" ON collaboration_versions
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE created_by = auth.uid()
        ) OR created_by = auth.uid()
    );

-- Politiques RLS pour les commentaires
ALTER TABLE collaboration_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collaboration comments" ON collaboration_comments
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE created_by = auth.uid()
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can create collaboration comments" ON collaboration_comments
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE created_by = auth.uid()
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can update own collaboration comments" ON collaboration_comments
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can resolve collaboration comments" ON collaboration_comments
    FOR UPDATE USING (
        session_id IN (
            SELECT id FROM collaboration_sessions WHERE created_by = auth.uid()
        )
    );

-- Fonctions RPC pour la collaboration temps réel

-- Fonction pour mettre à jour le statut des participants inactifs
CREATE OR REPLACE FUNCTION update_inactive_participants()
RETURNS TABLE (
    updated_count BIGINT
) AS $$
DECLARE
    inactive_count BIGINT;
BEGIN
    -- Mettre à jour les participants inactifs depuis plus de 5 minutes
    UPDATE collaboration_participants
    SET status = 'away', last_seen = NOW()
    WHERE status = 'online'
    AND last_seen < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS inactive_count = ROW_COUNT;
    
    -- Mettre à jour les participants offline depuis plus de 30 minutes
    UPDATE collaboration_participants
    SET status = 'offline', last_seen = NOW()
    WHERE status IN ('online', 'away')
    AND last_seen < NOW() - INTERVAL '30 minutes';
    
    GET DIAGNOSTICS inactive_count = inactive_count + ROW_COUNT;
    
    RETURN QUERY SELECT inactive_count as updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques d'une session
CREATE OR REPLACE FUNCTION get_collaboration_session_stats(p_session_id UUID)
RETURNS TABLE (
    total_participants BIGINT,
    online_participants BIGINT,
    away_participants BIGINT,
    offline_participants BIGINT,
    total_messages BIGINT,
    total_events BIGINT,
    total_versions BIGINT,
    total_comments BIGINT,
    session_duration INTERVAL,
    most_active_user JSONB,
    recent_activity JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_participants,
        COUNT(*) FILTER (WHERE status = 'online') as online_participants,
        COUNT(*) FILTER (WHERE status = 'away') as away_participants,
        COUNT(*) FILTER (WHERE status = 'offline') as offline_participants,
        COALESCE((SELECT COUNT(*) FROM collaboration_messages WHERE session_id = p_session_id), 0) as total_messages,
        COALESCE((SELECT COUNT(*) FROM collaboration_events WHERE session_id = p_session_id), 0) as total_events,
        COALESCE((SELECT COUNT(*) FROM collaboration_versions WHERE session_id = p_session_id), 0) as total_versions,
        COALESCE((SELECT COUNT(*) FROM collaboration_comments WHERE session_id = p_session_id), 0) as total_comments,
        COALESCE(
            (SELECT MAX(last_seen) - MIN(joined_at) 
             FROM collaboration_participants 
             WHERE session_id = p_session_id),
            INTERVAL '0 seconds'
        ) as session_duration,
        (
            SELECT jsonb_build_object(
                'user_id', user_id,
                'user_name', user_name,
                'event_count', event_count
            )
            FROM (
                SELECT 
                    user_id,
                    user_name,
                    COUNT(*) as event_count
                FROM collaboration_events
                WHERE session_id = p_session_id
                AND timestamp >= NOW() - INTERVAL '1 hour'
                GROUP BY user_id, user_name
                ORDER BY event_count DESC
                LIMIT 1
            ) most_active
        ) as most_active_user,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'type', event_type,
                    'timestamp', timestamp,
                    'user_name', user_name
                )
            )
            FROM (
                SELECT 
                    ce.event_type,
                    ce.timestamp,
                    cp.user_name
                FROM collaboration_events ce
                JOIN collaboration_participants cp ON ce.user_id = cp.user_id AND ce.session_id = cp.session_id
                WHERE ce.session_id = p_session_id
                ORDER BY ce.timestamp DESC
                LIMIT 10
            ) recent
        ) as recent_activity
    FROM collaboration_participants
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer les anciennes données de collaboration
CREATE OR REPLACE FUNCTION cleanup_old_collaboration_data(p_days_old INTEGER DEFAULT 30)
RETURNS TABLE (
    cleaned_events BIGINT,
    cleaned_messages BIGINT,
    cleaned_versions BIGINT
) AS $$
DECLARE
    events_cleaned BIGINT;
    messages_cleaned BIGINT;
    versions_cleaned BIGINT;
BEGIN
    -- Nettoyer les anciens événements
    DELETE FROM collaboration_events
    WHERE timestamp < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS events_cleaned = ROW_COUNT;
    
    -- Conserver seulement les 1000 messages les plus récents par session
    WITH ranked_messages AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY timestamp DESC) as rn
        FROM collaboration_messages
    )
    DELETE FROM collaboration_messages
    WHERE id IN (SELECT id FROM ranked_messages WHERE rn > 1000);
    
    GET DIAGNOSTICS messages_cleaned = ROW_COUNT;
    
    -- Conserver seulement les 50 dernières versions par session
    WITH ranked_versions AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY version DESC) as rn
        FROM collaboration_versions
    )
    DELETE FROM collaboration_versions
    WHERE id IN (SELECT id FROM ranked_versions WHERE rn > 50);
    
    GET DIAGNOSTICS versions_cleaned = ROW_COUNT;
    
    RETURN QUERY SELECT events_cleaned, messages_cleaned, versions_cleaned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour générer un diff entre deux versions
CREATE OR REPLACE FUNCTION generate_version_diff(p_old_content TEXT, p_new_content TEXT)
RETURNS JSONB AS $$
DECLARE
    diff JSONB := '[]'::jsonb;
    old_lines TEXT[];
    new_lines TEXT[];
    i INTEGER := 1;
    j INTEGER := 1;
BEGIN
    -- Diviser le contenu en lignes
    old_lines := string_to_array(p_old_content, E'\n');
    new_lines := string_to_array(p_new_content, E'\n');
    
    -- Algorithme simple de diff (à améliorer avec un algorithme plus complexe)
    WHILE i <= array_length(old_lines, 1) AND j <= array_length(new_lines, 1) LOOP
        IF old_lines[i] = new_lines[j] THEN
            -- Lignes identiques
            i := i + 1;
            j := j + 1;
        ELSIF old_lines[i] IS NULL THEN
            -- Ligne ajoutée
            diff := diff || jsonb_build_object(
                'type', 'insert',
                'line', j,
                'content', new_lines[j]
            );
            j := j + 1;
        ELSIF new_lines[j] IS NULL THEN
            -- Ligne supprimée
            diff := diff || jsonb_build_object(
                'type', 'delete',
                'line', i,
                'content', old_lines[i]
            );
            i := i + 1;
        ELSE
            -- Ligne modifiée
            diff := diff || jsonb_build_object(
                'type', 'change',
                'line', i,
                'old_content', old_lines[i],
                'new_content', new_lines[j]
            );
            i := i + 1;
            j := j + 1;
        END IF;
    END LOOP;
    
    -- Ajouter les lignes restantes
    WHILE i <= array_length(old_lines, 1) LOOP
        diff := diff || jsonb_build_object(
            'type', 'delete',
            'line', i,
            'content', old_lines[i]
        );
        i := i + 1;
    END LOOP;
    
    WHILE j <= array_length(new_lines, 1) LOOP
        diff := diff || jsonb_build_object(
            'type', 'insert',
            'line', j,
            'content', new_lines[j]
        );
        j := j + 1;
    END LOOP;
    
    RETURN diff;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour fusionner les changements concurrents
CREATE OR REPLACE FUNCTION merge_concurrent_changes(
    p_base_content TEXT,
    p_local_changes JSONB,
    p_remote_changes JSONB
)
RETURNS TEXT AS $$
DECLARE
    merged_content TEXT := p_base_content;
    change JSONB;
BEGIN
    -- Appliquer les changements locaux
    FOREACH change IN ARRAY p_local_changes
    LOOP
        CASE change->>'type'
            WHEN 'insert' THEN
                merged_content := apply_text_insert(merged_content, change->>'position', change->>'text');
            WHEN 'delete' THEN
                merged_content := apply_text_delete(merged_content, change->>'position', (change->>'length')::INTEGER);
        END CASE;
    END LOOP;
    
    -- Appliquer les changements distants
    FOREACH change IN ARRAY p_remote_changes
    LOOP
        CASE change->>'type'
            WHEN 'insert' THEN
                merged_content := apply_text_insert(merged_content, change->>'position', change->>'text');
            WHEN 'delete' THEN
                merged_content := apply_text_delete(merged_content, change->>'position', (change->>'length')::INTEGER);
        END CASE;
    END LOOP;
    
    RETURN merged_content;
END;
$$ LANGUAGE plpgsql;

-- Fonctions utilitaires pour appliquer les changements
CREATE OR REPLACE FUNCTION apply_text_insert(p_content TEXT, p_position TEXT, p_text TEXT)
RETURNS TEXT AS $$
DECLARE
    pos INTEGER;
BEGIN
    pos := (p_position::JSONB->>'column')::INTEGER;
    
    -- Insérer le texte à la position spécifiée
    RETURN substr(p_content, 1, pos - 1) || p_text || substr(p_content, pos);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION apply_text_delete(p_content TEXT, p_position TEXT, p_length INTEGER)
RETURNS TEXT AS $$
DECLARE
    pos INTEGER;
BEGIN
    pos := (p_position::JSONB->>'column')::INTEGER;
    
    -- Supprimer le texte à la position spécifiée
    RETURN substr(p_content, 1, pos - 1) || substr(p_content, pos + p_length);
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE collaboration_sessions IS 'Sessions de collaboration temps réel avec paramètres';
COMMENT ON TABLE collaboration_participants IS 'Participants aux sessions avec curseurs et sélections';
COMMENT ON TABLE collaboration_events IS 'Événements de collaboration (curseur, texte, etc.)';
COMMENT ON TABLE collaboration_messages IS 'Messages de chat pour la collaboration';
COMMENT ON TABLE collaboration_versions IS 'Historique des versions du document collaboratif';
COMMENT ON TABLE collaboration_comments IS 'Commentaires sur le document avec threads';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN collaboration_sessions.settings IS 'Paramètres de la session (auto-save, max participants, etc.)';
COMMENT ON COLUMN collaboration_participants.cursor IS 'Position du curseur {line, column, length}';
COMMENT ON COLUMN collaboration_participants.selection IS 'Sélection de texte {start, end}';
COMMENT ON COLUMN collaboration_events.event_data IS 'Données spécifiques à chaque type d\'événement';
COMMENT ON COLUMN collaboration_versions.changes IS 'Liste des changements depuis la version précédente';
COMMENT ON COLUMN collaboration_comments.position IS 'Position du commentaire dans le document';

-- Créer une fonction pour nettoyer automatiquement les données anciennes
CREATE OR REPLACE FUNCTION schedule_cleanup_collaboration_data()
RETURNS VOID AS $$
BEGIN
    PERFORM cleanup_old_collaboration_data(30);
END;
$$ LANGUAGE plpgsql;
