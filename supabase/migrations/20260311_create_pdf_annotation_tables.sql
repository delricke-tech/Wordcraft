-- Migration: Création des tables pour les annotations PDF interactives
-- Date: 11 mars 2026
-- Description: Tables pour gérer les annotations, surlignages, et interactions sur les documents PDF

-- Table principale des annotations PDF
CREATE TABLE IF NOT EXISTS pdf_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('highlight', 'underline', 'strikeout', 'squiggly', 'note', 'comment', 'bookmark', 'drawing', 'text', 'signature', 'stamp', 'link', 'image', 'audio', 'video')),
    content JSONB DEFAULT '{}', -- {text, html, markdown, color, backgroundColor, opacity, width, height, points, path, url, mediaUrl, duration, thumbnail, alt, title, description, tags, mentions, attachments}
    position JSONB NOT NULL, -- {pageNumber, x, y, width, height, rotation, scale, zIndex, anchored, anchorPoint, boundingBox}
    style JSONB DEFAULT '{}', -- {color, backgroundColor, borderColor, borderWidth, borderStyle, opacity, fontSize, fontFamily, fontWeight, fontStyle, textDecoration, textAlign, lineHeight, letterSpacing, padding, margin, borderRadius, boxShadow, filter, transform, animation}
    metadata JSONB DEFAULT '{}', -- {source, confidence, extractedText, context, keywords, sentiment, importance, category, subcategory, language, difficulty, timeSpent, viewCount, editCount, version, parentAnnotationId, childAnnotationIds, relatedAnnotationIds, customFields}
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'archived', 'deleted', 'pending', 'approved', 'rejected')),
    permissions JSONB DEFAULT '{}', -- {canView, canEdit, canDelete, canComment, canShare, canExport, canPrint, canCopy, canMove, canResize, canChangeStyle, canAddReplies, canViewHistory, isOwner, sharedWith}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Table des réponses aux annotations
CREATE TABLE IF NOT EXISTS annotation_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annotation_id UUID REFERENCES pdf_annotations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mentions TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    reactions JSONB DEFAULT '[]',
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des réactions aux annotations/réponses
CREATE TABLE IF NOT EXISTS annotation_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL, -- annotation_id ou reply_id
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry', 'custom')),
    custom_emoji TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(target_id, user_id, type)
);

-- Table des historiques d'annotations
CREATE TABLE IF NOT EXISTS annotation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annotation_id UUID REFERENCES pdf_annotations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'moved', 'styled', 'replied')),
    previous_state JSONB,
    new_state JSONB,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Table des templates d'annotations
CREATE TABLE IF NOT EXISTS annotation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('highlight', 'underline', 'strikeout', 'squiggly', 'note', 'comment', 'bookmark', 'drawing', 'text', 'signature', 'stamp', 'link', 'image', 'audio', 'video')),
    content JSONB NOT NULL,
    style JSONB NOT NULL,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exports d'annotations
CREATE TABLE IF NOT EXISTS annotation_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    format VARCHAR(10) NOT NULL CHECK (format IN ('pdf', 'json', 'csv', 'xlsx', 'markdown', 'html')),
    options JSONB DEFAULT '{}', -- {includeAnnotations, includeComments, includeReplies, includeHistory, includeMetadata, includeAttachments, filterByType, filterByUser, filterByStatus, dateRange, pageRange, sortBy, sortOrder, groupBy, format}
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT DEFAULT 0,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des statistiques d'annotations
CREATE TABLE IF NOT EXISTS pdf_annotation_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    total_annotations INTEGER DEFAULT 0,
    annotations_by_type JSONB DEFAULT '{}',
    annotations_by_page JSONB DEFAULT '{}',
    annotations_by_user JSONB DEFAULT '{}',
    average_annotations_per_page DECIMAL(10,2) DEFAULT 0.00,
    most_annotated_page INTEGER DEFAULT 0,
    most_used_type VARCHAR(20),
    most_active_user UUID REFERENCES profiles(id) ON DELETE SET NULL,
    total_replies INTEGER DEFAULT 0,
    total_reactions INTEGER DEFAULT 0,
    average_replies_per_annotation DECIMAL(5,2) DEFAULT 0.00,
    average_reactions_per_annotation DECIMAL(5,2) DEFAULT 0.00,
    annotation_growth JSONB DEFAULT '{}', -- {daily, weekly, monthly}
    user_activity JSONB DEFAULT '{}', -- {totalUsers, activeUsers, averageAnnotationsPerUser, topContributors}
    collaboration_metrics JSONB DEFAULT '{}', -- {sharedAnnotations, collaborativeDocuments, averageCollaboratorsPerDocument, responseTime, engagementRate}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, document_id)
);

-- Table des pièces jointes d'annotations
CREATE TABLE IF NOT EXISTS annotation_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annotation_id UUID REFERENCES pdf_annotations(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES annotation_replies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    url TEXT NOT NULL,
    thumbnail TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_pdf_annotations_document_id ON pdf_annotations(document_id);
CREATE INDEX idx_pdf_annotations_user_id ON pdf_annotations(user_id);
CREATE INDEX idx_pdf_annotations_type ON pdf_annotations(type);
CREATE INDEX idx_pdf_annotations_status ON pdf_annotations(status);
CREATE INDEX idx_pdf_annotations_created_at ON pdf_annotations(created_at DESC);
CREATE INDEX idx_pdf_annotations_updated_at ON pdf_annotations(updated_at DESC);
CREATE INDEX idx_pdf_annotations_position_page ON pdf_annotations USING GIN ((position->'pageNumber'));
CREATE INDEX idx_pdf_annotations_content ON pdf_annotations USING GIN (to_tsvector('french', COALESCE(content->>'text', '')));
CREATE INDEX idx_pdf_annotations_metadata ON pdf_annotations USING GIN (metadata);

CREATE INDEX idx_annotation_replies_annotation_id ON annotation_replies(annotation_id);
CREATE INDEX idx_annotation_replies_user_id ON annotation_replies(user_id);
CREATE INDEX idx_annotation_replies_created_at ON annotation_replies(created_at DESC);
CREATE INDEX idx_annotation_replies_mentions ON annotation_replies USING GIN (mentions);

CREATE INDEX idx_annotation_reactions_target_id ON annotation_reactions(target_id);
CREATE INDEX idx_annotation_reactions_user_id ON annotation_reactions(user_id);
CREATE INDEX idx_annotation_reactions_type ON annotation_reactions(type);
CREATE INDEX idx_annotation_reactions_created_at ON annotation_reactions(created_at DESC);

CREATE INDEX idx_annotation_history_annotation_id ON annotation_history(annotation_id);
CREATE INDEX idx_annotation_history_user_id ON annotation_history(user_id);
CREATE INDEX idx_annotation_history_action ON annotation_history(action);
CREATE INDEX idx_annotation_history_timestamp ON annotation_history(timestamp DESC);

CREATE INDEX idx_annotation_templates_type ON annotation_templates(type);
CREATE INDEX idx_annotation_templates_category ON annotation_templates(category);
CREATE INDEX idx_annotation_templates_is_default ON annotation_templates(is_default);
CREATE INDEX idx_annotation_templates_is_active ON annotation_templates(is_active);
CREATE INDEX idx_annotation_templates_usage_count ON annotation_templates(usage_count DESC);

CREATE INDEX idx_annotation_exports_document_id ON annotation_exports(document_id);
CREATE INDEX idx_annotation_exports_format ON annotation_exports(format);
CREATE INDEX idx_annotation_exports_status ON annotation_exports(status);
CREATE INDEX idx_annotation_exports_created_at ON annotation_exports(created_at DESC);

CREATE INDEX idx_pdf_annotation_statistics_date ON pdf_annotation_statistics(date);
CREATE INDEX idx_pdf_annotation_statistics_document_id ON pdf_annotation_statistics(document_id);
CREATE INDEX idx_pdf_annotation_statistics_created_at ON pdf_annotation_statistics(created_at DESC);

CREATE INDEX idx_annotation_attachments_annotation_id ON annotation_attachments(annotation_id);
CREATE INDEX idx_annotation_attachments_reply_id ON annotation_attachments(reply_id);
CREATE INDEX idx_annotation_attachments_type ON annotation_attachments(type);
CREATE INDEX idx_annotation_attachments_created_at ON annotation_attachments(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_pdf_annotations_updated_at 
    BEFORE UPDATE ON pdf_annotations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotation_replies_updated_at 
    BEFORE UPDATE ON annotation_replies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotation_templates_updated_at 
    BEFORE UPDATE ON annotation_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdf_annotation_statistics_updated_at 
    BEFORE UPDATE ON pdf_annotation_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_pdf_annotation_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO pdf_annotation_statistics (
        date,
        document_id,
        total_annotations,
        annotations_by_type,
        annotations_by_page,
        annotations_by_user,
        average_annotations_per_page,
        most_annotated_page,
        most_used_type,
        most_active_user,
        total_replies,
        total_reactions,
        average_replies_per_annotation,
        average_reactions_per_annotation,
        annotation_growth,
        user_activity,
        collaboration_metrics
    )
    SELECT 
        CURRENT_DATE,
        NEW.document_id,
        (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND status = 'active') as total_annotations,
        (SELECT jsonb_build_object(
            'highlight', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'highlight' AND status = 'active'),
            'underline', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'underline' AND status = 'active'),
            'strikeout', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'strikeout' AND status = 'active'),
            'squiggly', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'squiggly' AND status = 'active'),
            'note', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'note' AND status = 'active'),
            'comment', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'comment' AND status = 'active'),
            'bookmark', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'bookmark' AND status = 'active'),
            'drawing', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'drawing' AND status = 'active'),
            'text', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'text' AND status = 'active'),
            'signature', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'signature' AND status = 'active'),
            'stamp', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'stamp' AND status = 'active'),
            'link', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'link' AND status = 'active'),
            'image', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'image' AND status = 'active'),
            'audio', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'audio' AND status = 'active'),
            'video', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND type = 'video' AND status = 'active')
        )),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT (position->>'pageNumber')::INTEGER),
            ARRAY_AGG(COUNT(*) FILTER (WHERE status = 'active'))
        ) FROM pdf_annotations WHERE document_id = NEW.document_id AND status = 'active'),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT user_id),
            ARRAY_AGG(COUNT(*) FILTER (WHERE status = 'active'))
        ) FROM pdf_annotations WHERE document_id = NEW.document_id AND status = 'active'),
        COALESCE(
            (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT (position->>'pageNumber')::INTEGER), 0) 
             FROM pdf_annotations WHERE document_id = NEW.document_id AND status = 'active'), 
            0
        ),
        (SELECT (position->>'pageNumber')::INTEGER 
         FROM pdf_annotations 
         WHERE document_id = NEW.document_id AND status = 'active' 
         GROUP BY (position->>'pageNumber')::INTEGER 
         ORDER BY COUNT(*) DESC 
         LIMIT 1),
        (SELECT type 
         FROM pdf_annotations 
         WHERE document_id = NEW.document_id AND status = 'active' 
         GROUP BY type 
         ORDER BY COUNT(*) DESC 
         LIMIT 1),
        (SELECT user_id 
         FROM pdf_annotations 
         WHERE document_id = NEW.document_id AND status = 'active' 
         GROUP BY user_id 
         ORDER BY COUNT(*) DESC 
         LIMIT 1),
        (SELECT COUNT(*) FROM annotation_replies ar JOIN pdf_annotations pa ON ar.annotation_id = pa.id WHERE pa.document_id = NEW.document_id),
        (SELECT COUNT(*) FROM annotation_reactions ar JOIN pdf_annotations pa ON ar.target_id = pa.id WHERE pa.document_id = NEW.document_id),
        COALESCE(
            (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT pa.id), 0) 
             FROM annotation_replies ar 
             JOIN pdf_annotations pa ON ar.annotation_id = pa.id 
             WHERE pa.document_id = NEW.document_id), 
            0
        ),
        COALESCE(
            (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT pa.id), 0) 
             FROM annotation_reactions ar 
             JOIN pdf_annotations pa ON ar.target_id = pa.id 
             WHERE pa.document_id = NEW.document_id), 
            0
        ),
        jsonb_build_object(
            'daily', ARRAY(
                SELECT COUNT(*) 
                FROM pdf_annotations 
                WHERE document_id = NEW.document_id AND DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days' 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at)
            ),
            'weekly', ARRAY(
                SELECT COUNT(*) 
                FROM pdf_annotations 
                WHERE document_id = NEW.document_id AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 weeks' 
                GROUP BY DATE_TRUNC('week', created_at) 
                ORDER BY DATE_TRUNC('week', created_at)
            ),
            'monthly', ARRAY(
                SELECT COUNT(*) 
                FROM pdf_annotations 
                WHERE document_id = NEW.document_id AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' 
                GROUP BY DATE_TRUNC('month', created_at) 
                ORDER BY DATE_TRUNC('month', created_at)
            )
        ),
        jsonb_build_object(
            'totalUsers', (SELECT COUNT(DISTINCT user_id) FROM pdf_annotations WHERE document_id = NEW.document_id AND status = 'active'),
            'activeUsers', (SELECT COUNT(DISTINCT user_id) FROM pdf_annotations WHERE document_id = NEW.document_id AND status = 'active' AND created_at >= CURRENT_DATE - INTERVAL '7 days'),
            'averageAnnotationsPerUser', COALESCE(
                (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT user_id), 0) FROM pdf_annotations WHERE document_id = NEW.document_id AND status = 'active'), 
                0
            ),
            'topContributors', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'userId', user_id,
                        'annotationCount', COUNT(*),
                        'replyCount', (SELECT COUNT(*) FROM annotation_replies WHERE annotation_id = pa.id),
                        'reactionCount', (SELECT COUNT(*) FROM annotation_reactions WHERE target_id = pa.id)
                    )
                )
                FROM pdf_annotations pa 
                WHERE pa.document_id = NEW.document_id AND pa.status = 'active' 
                GROUP BY user_id 
                ORDER BY COUNT(*) DESC 
                LIMIT 10
            )
        ),
        jsonb_build_object(
            'sharedAnnotations', (SELECT COUNT(*) FROM pdf_annotations WHERE document_id = NEW.document_id AND status = 'active' AND (permissions->>'isOwner')::boolean = false),
            'collaborativeDocuments', (SELECT COUNT(DISTINCT document_id) FROM pdf_annotations WHERE document_id = NEW.document_id AND status = 'active' GROUP BY document_id HAVING COUNT(DISTINCT user_id) > 1),
            'averageCollaboratorsPerDocument', COALESCE(
                (SELECT AVG(user_count)::INTEGER 
                 FROM (SELECT COUNT(DISTINCT user_id) as user_count 
                       FROM pdf_annotations 
                       WHERE document_id = NEW.document_id AND status = 'active' 
                       GROUP BY document_id) t), 
                0
            ),
            'responseTime', COALESCE(
                (SELECT AVG(EXTRACT(EPOCH FROM (ar.created_at - pa.created_at)))::INTEGER 
                 FROM annotation_replies ar 
                 JOIN pdf_annotations pa ON ar.annotation_id = pa.id 
                 WHERE pa.document_id = NEW.document_id), 
                0
            ),
            'engagementRate', COALESCE(
                (SELECT (COUNT(DISTINCT ar.user_id)::DECIMAL / NULLIF(COUNT(DISTINCT pa.user_id), 0) * 100) 
                 FROM annotation_replies ar 
                 JOIN pdf_annotations pa ON ar.annotation_id = pa.id 
                 WHERE pa.document_id = NEW.document_id), 
                0
            )
        )
    ON CONFLICT (date, document_id) DO UPDATE SET
        total_annotations = EXCLUDED.total_annotations,
        annotations_by_type = EXCLUDED.annotations_by_type,
        annotations_by_page = EXCLUDED.annotations_by_page,
        annotations_by_user = EXCLUDED.annotations_by_user,
        average_annotations_per_page = EXCLUDED.average_annotations_per_page,
        most_annotated_page = EXCLUDED.most_annotated_page,
        most_used_type = EXCLUDED.most_used_type,
        most_active_user = EXCLUDED.most_active_user,
        total_replies = EXCLUDED.total_replies,
        total_reactions = EXCLUDED.total_reactions,
        average_replies_per_annotation = EXCLUDED.average_replies_per_annotation,
        average_reactions_per_annotation = EXCLUDED.average_reactions_per_annotation,
        annotation_growth = EXCLUDED.annotation_growth,
        user_activity = EXCLUDED.user_activity,
        collaboration_metrics = EXCLUDED.collaboration_metrics,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pdf_annotation_statistics_annotations
    AFTER INSERT OR UPDATE OR DELETE ON pdf_annotations
    FOR EACH ROW EXECUTE FUNCTION update_pdf_annotation_statistics();

CREATE TRIGGER trigger_update_pdf_annotation_statistics_replies
    AFTER INSERT OR UPDATE OR DELETE ON annotation_replies
    FOR EACH ROW EXECUTE FUNCTION update_pdf_annotation_statistics();

CREATE TRIGGER trigger_update_pdf_annotation_statistics_reactions
    AFTER INSERT OR UPDATE OR DELETE ON annotation_reactions
    FOR EACH ROW EXECUTE FUNCTION update_pdf_annotation_statistics();

-- Politiques RLS pour les annotations
ALTER TABLE pdf_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pdf annotations" ON pdf_annotations
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view shared pdf annotations" ON pdf_annotations
    FOR SELECT USING (
        status = 'active' 
        AND (
            user_id = auth.uid() 
            OR (permissions->>'canView')::boolean = true
            OR auth.uid() = ANY((permissions->>'sharedWith')::TEXT[])
        )
    );

CREATE POLICY "Admins can view all pdf annotations" ON pdf_annotations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les réponses
ALTER TABLE annotation_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own annotation replies" ON annotation_replies
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view replies to accessible annotations" ON annotation_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pdf_annotations pa
            WHERE pa.id = annotation_id 
            AND (
                pa.user_id = auth.uid() 
                OR (pa.permissions->>'canView')::boolean = true
                OR auth.uid() = ANY((pa.permissions->>'sharedWith')::TEXT[])
            )
        )
    );

CREATE POLICY "Admins can view all annotation replies" ON annotation_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les réactions
ALTER TABLE annotation_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own annotation reactions" ON annotation_reactions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view reactions to accessible content" ON annotation_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pdf_annotations pa
            WHERE pa.id = target_id 
            AND (
                pa.user_id = auth.uid() 
                OR (pa.permissions->>'canView')::boolean = true
                OR auth.uid() = ANY((pa.permissions->>'sharedWith')::TEXT[])
            )
        )
        OR EXISTS (
            SELECT 1 FROM annotation_replies ar
            WHERE ar.id = target_id 
            AND EXISTS (
                SELECT 1 FROM pdf_annotations pa
                WHERE pa.id = ar.annotation_id 
                AND (
                    pa.user_id = auth.uid() 
                    OR (pa.permissions->>'canView')::boolean = true
                    OR auth.uid() = ANY((pa.permissions->>'sharedWith')::TEXT[])
                )
            )
        )
    );

-- Politiques RLS pour l'historique
ALTER TABLE annotation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own annotation history" ON annotation_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view history of accessible annotations" ON annotation_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pdf_annotations pa
            WHERE pa.id = annotation_id 
            AND (
                pa.user_id = auth.uid() 
                OR (pa.permissions->>'canViewHistory')::boolean = true
                OR auth.uid() = ANY((pa.permissions->>'sharedWith')::TEXT[])
            )
        )
    );

-- Politiques RLS pour les templates
ALTER TABLE annotation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active annotation templates" ON annotation_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage annotation templates" ON annotation_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les exports
ALTER TABLE annotation_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own annotation exports" ON annotation_exports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all annotation exports" ON annotation_exports
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
ALTER TABLE pdf_annotation_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own document annotation statistics" ON pdf_annotation_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all annotation statistics" ON pdf_annotation_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les pièces jointes
ALTER TABLE annotation_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own annotation attachments" ON annotation_attachments
    FOR ALL USING (
        annotation_id IN (
            SELECT id FROM pdf_annotations 
            WHERE user_id = auth.uid()
        )
        OR reply_id IN (
            SELECT id FROM annotation_replies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view attachments of accessible content" ON annotation_attachments
    FOR SELECT USING (
        annotation_id IN (
            SELECT id FROM pdf_annotations pa
            WHERE (
                pa.user_id = auth.uid() 
                OR (pa.permissions->>'canView')::boolean = true
                OR auth.uid() = ANY((pa.permissions->>'sharedWith')::TEXT[])
            )
        )
        OR reply_id IN (
            SELECT id FROM annotation_replies ar
            WHERE EXISTS (
                SELECT 1 FROM pdf_annotations pa
                WHERE pa.id = ar.annotation_id 
                AND (
                    pa.user_id = auth.uid() 
                    OR (pa.permissions->>'canView')::boolean = true
                    OR auth.uid() = ANY((pa.permissions->>'sharedWith')::TEXT[])
                )
            )
        )
    );

-- Fonctions RPC pour les annotations PDF

-- Fonction pour obtenir les statistiques d'annotations
CREATE OR REPLACE FUNCTION get_pdf_annotation_stats(p_document_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_annotations BIGINT,
    annotations_by_type JSONB,
    annotations_by_page JSONB,
    annotations_by_user JSONB,
    average_annotations_per_page DECIMAL(10,2),
    most_annotated_page INTEGER,
    most_used_type VARCHAR(20),
    most_active_user UUID,
    total_replies BIGINT,
    total_reactions BIGINT,
    average_replies_per_annotation DECIMAL(5,2),
    average_reactions_per_annotation DECIMAL(5,2),
    annotation_growth JSONB,
    user_activity JSONB,
    collaboration_metrics JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(ps.total_annotations), 0),
        jsonb_build_object(
            'highlight', COALESCE(SUM((ps.annotations_by_type->>'highlight')::INTEGER), 0),
            'underline', COALESCE(SUM((ps.annotations_by_type->>'underline')::INTEGER), 0),
            'strikeout', COALESCE(SUM((ps.annotations_by_type->>'strikeout')::INTEGER), 0),
            'squiggly', COALESCE(SUM((ps.annotations_by_type->>'squiggly')::INTEGER), 0),
            'note', COALESCE(SUM((ps.annotations_by_type->>'note')::INTEGER), 0),
            'comment', COALESCE(SUM((ps.annotations_by_type->>'comment')::INTEGER), 0),
            'bookmark', COALESCE(SUM((ps.annotations_by_type->>'bookmark')::INTEGER), 0),
            'drawing', COALESCE(SUM((ps.annotations_by_type->>'drawing')::INTEGER), 0),
            'text', COALESCE(SUM((ps.annotations_by_type->>'text')::INTEGER), 0),
            'signature', COALESCE(SUM((ps.annotations_by_type->>'signature')::INTEGER), 0),
            'stamp', COALESCE(SUM((ps.annotations_by_type->>'stamp')::INTEGER), 0),
            'link', COALESCE(SUM((ps.annotations_by_type->>'link')::INTEGER), 0),
            'image', COALESCE(SUM((ps.annotations_by_type->>'image')::INTEGER), 0),
            'audio', COALESCE(SUM((ps.annotations_by_type->>'audio')::INTEGER), 0),
            'video', COALESCE(SUM((ps.annotations_by_type->>'video')::INTEGER), 0)
        ),
        (SELECT jsonb_agg_pages FROM (
            SELECT jsonb_object_agg(page::TEXT, count) as jsonb_agg_pages
            FROM (
                SELECT (position->>'pageNumber')::INTEGER as page, COUNT(*) as count
                FROM pdf_annotations 
                WHERE (p_document_id IS NULL OR document_id = p_document_id) AND status = 'active'
                GROUP BY (position->>'pageNumber')::INTEGER
            ) t
        ) sub),
        (SELECT jsonb_agg_users FROM (
            SELECT jsonb_object_agg(user_id::TEXT, count) as jsonb_agg_users
            FROM (
                SELECT user_id, COUNT(*) as count
                FROM pdf_annotations 
                WHERE (p_document_id IS NULL OR document_id = p_document_id) AND status = 'active'
                GROUP BY user_id
            ) t
        ) sub),
        COALESCE(AVG(ps.average_annotations_per_page), 0),
        (SELECT ps.most_annotated_page FROM pdf_annotation_statistics ps 
         WHERE (p_document_id IS NULL OR ps.document_id = p_document_id) 
         ORDER BY ps.total_annotations DESC LIMIT 1),
        (SELECT ps.most_used_type FROM pdf_annotation_statistics ps 
         WHERE (p_document_id IS NULL OR ps.document_id = p_document_id) 
         ORDER BY ps.total_annotations DESC LIMIT 1),
        (SELECT ps.most_active_user FROM pdf_annotation_statistics ps 
         WHERE (p_document_id IS NULL OR ps.document_id = p_document_id) 
         ORDER BY ps.total_annotations DESC LIMIT 1),
        COALESCE(SUM(ps.total_replies), 0),
        COALESCE(SUM(ps.total_reactions), 0),
        COALESCE(AVG(ps.average_replies_per_annotation), 0),
        COALESCE(AVG(ps.average_reactions_per_annotation), 0),
        jsonb_build_object(
            'daily', ARRAY(SELECT COUNT(*) FROM pdf_annotations WHERE (p_document_id IS NULL OR document_id = p_document_id) AND DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY DATE(created_at)),
            'weekly', ARRAY(SELECT COUNT(*) FROM pdf_annotations WHERE (p_document_id IS NULL OR document_id = p_document_id) AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 weeks' GROUP BY DATE_TRUNC('week', created_at) ORDER BY DATE_TRUNC('week', created_at)),
            'monthly', ARRAY(SELECT COUNT(*) FROM pdf_annotations WHERE (p_document_id IS NULL OR document_id = p_document_id) AND DATE(created_at) >= CURRENT_DATE - INTERVAL '12 months' GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at))
        ),
        jsonb_build_object(
            'totalUsers', (SELECT COUNT(DISTINCT user_id) FROM pdf_annotations WHERE (p_document_id IS NULL OR document_id = p_document_id) AND status = 'active'),
            'activeUsers', (SELECT COUNT(DISTINCT user_id) FROM pdf_annotations WHERE (p_document_id IS NULL OR document_id = p_document_id) AND status = 'active' AND created_at >= CURRENT_DATE - INTERVAL '7 days'),
            'averageAnnotationsPerUser', COALESCE((SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT user_id), 0) FROM pdf_annotations WHERE (p_document_id IS NULL OR document_id = p_document_id) AND status = 'active'), 0),
            'topContributors', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'userId', user_id,
                        'annotationCount', COUNT(*),
                        'replyCount', COALESCE((SELECT COUNT(*) FROM annotation_replies WHERE annotation_id = pa.id), 0),
                        'reactionCount', COALESCE((SELECT COUNT(*) FROM annotation_reactions WHERE target_id = pa.id), 0)
                    )
                )
                FROM pdf_annotations pa 
                WHERE (p_document_id IS NULL OR pa.document_id = p_document_id) AND pa.status = 'active' 
                GROUP BY user_id 
                ORDER BY COUNT(*) DESC 
                LIMIT 10
            )
        ),
        jsonb_build_object(
            'sharedAnnotations', (SELECT COUNT(*) FROM pdf_annotations WHERE (p_document_id IS NULL OR document_id = p_document_id) AND status = 'active' AND (permissions->>'isOwner')::boolean = false),
            'collaborativeDocuments', (SELECT COUNT(DISTINCT document_id) FROM pdf_annotations WHERE (p_document_id IS NULL OR document_id = p_document_id) AND status = 'active' GROUP BY document_id HAVING COUNT(DISTINCT user_id) > 1),
            'averageCollaboratorsPerDocument', COALESCE(
                (SELECT AVG(user_count)::INTEGER 
                 FROM (SELECT COUNT(DISTINCT user_id) as user_count 
                       FROM pdf_annotations 
                       WHERE (p_document_id IS NULL OR document_id = p_document_id) AND status = 'active' 
                       GROUP BY document_id) t), 
                0
            ),
            'responseTime', COALESCE(
                (SELECT AVG(EXTRACT(EPOCH FROM (ar.created_at - pa.created_at)))::INTEGER 
                 FROM annotation_replies ar 
                 JOIN pdf_annotations pa ON ar.annotation_id = pa.id 
                 WHERE (p_document_id IS NULL OR pa.document_id = p_document_id)), 
                0
            ),
            'engagementRate', COALESCE(
                (SELECT (COUNT(DISTINCT ar.user_id)::DECIMAL / NULLIF(COUNT(DISTINCT pa.user_id), 0) * 100) 
                 FROM annotation_replies ar 
                 JOIN pdf_annotations pa ON ar.annotation_id = pa.id 
                 WHERE (p_document_id IS NULL OR pa.document_id = p_document_id)), 
                0
            )
        )
    FROM pdf_annotation_statistics ps
    WHERE (p_document_id IS NULL OR ps.document_id = p_document_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les templates d'annotations par défaut
CREATE OR REPLACE FUNCTION create_default_annotation_templates()
RETURNS VOID AS $$
BEGIN
    INSERT INTO annotation_templates (
        name,
        description,
        type,
        content,
        style,
        category,
        tags,
        is_default,
        is_active
    ) VALUES 
        ('Surlignage jaune', 'Surlignage standard en jaune', 
         'highlight', 
         '{"color": "#ffff00", "opacity": 0.3}',
         '{"color": "#ffff00", "opacity": 0.3}',
         'surlignage',
         ARRAY['standard', 'jaune'],
         true, true),
        ('Surlignage vert', 'Surlignage pour points importants', 
         'highlight', 
         '{"color": "#00ff00", "opacity": 0.3}',
         '{"color": "#00ff00", "opacity": 0.3}',
         'surlignage',
         ARRAY['important', 'vert'],
         false, true),
        ('Surlignage rose', 'Surlignage pour passages à revoir', 
         'highlight', 
         '{"color": "#ff69b4", "opacity": 0.3}',
         '{"color": "#ff69b4", "opacity": 0.3}',
         'surlignage',
         ARRAY['revoir', 'rose'],
         false, true),
        ('Note standard', 'Note post-it standard', 
         'note', 
         '{"color": "#000000", "backgroundColor": "#ffffcc", "opacity": 0.9}',
         '{"color": "#000000", "backgroundColor": "#ffffcc", "opacity": 0.9, "padding": 5}',
         'note',
         ARRAY['standard', 'post-it'],
         true, true),
        ('Note importante', 'Note pour informations importantes', 
         'note', 
         '{"color": "#000000", "backgroundColor": "#ffcccc", "opacity": 0.9}',
         '{"color": "#000000", "backgroundColor": "#ffcccc", "opacity": 0.9, "padding": 5}',
         'note',
         ARRAY['important', 'urgent'],
         false, true),
        ('Signet bleu', 'Signet standard en bleu', 
         'bookmark', 
         '{"color": "#0000ff", "opacity": 1}',
         '{"color": "#0000ff", "opacity": 1}',
         'signet',
         ARRAY['standard', 'bleu'],
         true, true),
        ('Signet rouge', 'Signet pour sections critiques', 
         'bookmark', 
         '{"color": "#ff0000", "opacity": 1}',
         '{"color": "#ff0000", "opacity": 1}',
         'signet',
         ARRAY['critique', 'rouge'],
         false, true)
    ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        type = EXCLUDED.type,
        content = EXCLUDED.content,
        style = EXCLUDED.style,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        is_default = EXCLUDED.is_default,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_pdf_annotation_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO pdf_annotation_statistics (
        date,
        document_id,
        total_annotations,
        annotations_by_type,
        annotations_by_page,
        annotations_by_user,
        average_annotations_per_page,
        most_annotated_page,
        most_used_type,
        most_active_user,
        total_replies,
        total_reactions,
        average_replies_per_annotation,
        average_reactions_per_annotation,
        annotation_growth,
        user_activity,
        collaboration_metrics
    )
    SELECT 
        p_date,
        pa.document_id,
        COUNT(*) FILTER (WHERE pa.status = 'active') as total_annotations,
        jsonb_build_object(
            'highlight', COUNT(*) FILTER (WHERE pa.type = 'highlight' AND pa.status = 'active'),
            'underline', COUNT(*) FILTER (WHERE pa.type = 'underline' AND pa.status = 'active'),
            'strikeout', COUNT(*) FILTER (WHERE pa.type = 'strikeout' AND pa.status = 'active'),
            'squiggly', COUNT(*) FILTER (WHERE pa.type = 'squiggly' AND pa.status = 'active'),
            'note', COUNT(*) FILTER (WHERE pa.type = 'note' AND pa.status = 'active'),
            'comment', COUNT(*) FILTER (WHERE pa.type = 'comment' AND pa.status = 'active'),
            'bookmark', COUNT(*) FILTER (WHERE pa.type = 'bookmark' AND pa.status = 'active'),
            'drawing', COUNT(*) FILTER (WHERE pa.type = 'drawing' AND pa.status = 'active'),
            'text', COUNT(*) FILTER (WHERE pa.type = 'text' AND pa.status = 'active'),
            'signature', COUNT(*) FILTER (WHERE pa.type = 'signature' AND pa.status = 'active'),
            'stamp', COUNT(*) FILTER (WHERE pa.type = 'stamp' AND pa.status = 'active'),
            'link', COUNT(*) FILTER (WHERE pa.type = 'link' AND pa.status = 'active'),
            'image', COUNT(*) FILTER (WHERE pa.type = 'image' AND pa.status = 'active'),
            'audio', COUNT(*) FILTER (WHERE pa.type = 'audio' AND pa.status = 'active'),
            'video', COUNT(*) FILTER (WHERE pa.type = 'video' AND pa.status = 'active')
        ),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT (pa.position->>'pageNumber')::INTEGER),
            ARRAY_AGG(COUNT(*) FILTER (WHERE pa.status = 'active'))
        ) FROM pdf_annotations pa WHERE pa.document_id = d.id AND pa.status = 'active'),
        (SELECT jsonb_build_object(
            ARRAY_AGG(DISTINCT pa.user_id),
            ARRAY_AGG(COUNT(*) FILTER (WHERE pa.status = 'active'))
        ) FROM pdf_annotations pa WHERE pa.document_id = d.id AND pa.status = 'active'),
        COALESCE(COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT (pa.position->>'pageNumber')::INTEGER), 0), 0) as average_annotations_per_page,
        (SELECT (pa.position->>'pageNumber')::INTEGER 
         FROM pdf_annotations pa 
         WHERE pa.document_id = d.id AND pa.status = 'active' 
         GROUP BY (pa.position->>'pageNumber')::INTEGER 
         ORDER BY COUNT(*) DESC 
         LIMIT 1),
        (SELECT pa.type 
         FROM pdf_annotations pa 
         WHERE pa.document_id = d.id AND pa.status = 'active' 
         GROUP BY pa.type 
         ORDER BY COUNT(*) DESC 
         LIMIT 1),
        (SELECT pa.user_id 
         FROM pdf_annotations pa 
         WHERE pa.document_id = d.id AND pa.status = 'active' 
         GROUP BY pa.user_id 
         ORDER BY COUNT(*) DESC 
         LIMIT 1),
        (SELECT COUNT(*) FROM annotation_replies ar JOIN pdf_annotations pa ON ar.annotation_id = pa.id WHERE pa.document_id = d.id),
        (SELECT COUNT(*) FROM annotation_reactions ar JOIN pdf_annotations pa ON ar.target_id = pa.id WHERE pa.document_id = d.id),
        COALESCE((SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT pa.id), 0) 
                 FROM annotation_replies ar 
                 JOIN pdf_annotations pa ON ar.annotation_id = pa.id 
                 WHERE pa.document_id = d.id), 0),
        COALESCE((SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT pa.id), 0) 
                 FROM annotation_reactions ar 
                 JOIN pdf_annotations pa ON ar.target_id = pa.id 
                 WHERE pa.document_id = d.id), 0),
        jsonb_build_object(
            'daily', ARRAY(SELECT COUNT(*) FROM pdf_annotations pa WHERE pa.document_id = d.id AND DATE(pa.created_at) >= p_date - INTERVAL '30 days' GROUP BY DATE(pa.created_at) ORDER BY DATE(pa.created_at)),
            'weekly', ARRAY(SELECT COUNT(*) FROM pdf_annotations pa WHERE pa.document_id = d.id AND DATE(pa.created_at) >= p_date - INTERVAL '12 weeks' GROUP BY DATE_TRUNC('week', pa.created_at) ORDER BY DATE_TRUNC('week', pa.created_at)),
            'monthly', ARRAY(SELECT COUNT(*) FROM pdf_annotations pa WHERE pa.document_id = d.id AND DATE(pa.created_at) >= p_date - INTERVAL '12 months' GROUP BY DATE_TRUNC('month', pa.created_at) ORDER BY DATE_TRUNC('month', pa.created_at))
        ),
        jsonb_build_object(
            'totalUsers', (SELECT COUNT(DISTINCT pa.user_id) FROM pdf_annotations pa WHERE pa.document_id = d.id AND pa.status = 'active'),
            'activeUsers', (SELECT COUNT(DISTINCT pa.user_id) FROM pdf_annotations pa WHERE pa.document_id = d.id AND pa.status = 'active' AND pa.created_at >= p_date - INTERVAL '7 days'),
            'averageAnnotationsPerUser', COALESCE((SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT pa.user_id), 0) FROM pdf_annotations pa WHERE pa.document_id = d.id AND pa.status = 'active'), 0),
            'topContributors', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'userId', pa.user_id,
                        'annotationCount', COUNT(*),
                        'replyCount', (SELECT COUNT(*) FROM annotation_replies WHERE annotation_id = pa.id),
                        'reactionCount', (SELECT COUNT(*) FROM annotation_reactions WHERE target_id = pa.id)
                    )
                )
                FROM pdf_annotations pa 
                WHERE pa.document_id = d.id AND pa.status = 'active' 
                GROUP BY pa.user_id 
                ORDER BY COUNT(*) DESC 
                LIMIT 10
            )
        ),
        jsonb_build_object(
            'sharedAnnotations', (SELECT COUNT(*) FROM pdf_annotations pa WHERE pa.document_id = d.id AND pa.status = 'active' AND (pa.permissions->>'isOwner')::boolean = false),
            'collaborativeDocuments', (SELECT COUNT(DISTINCT pa.document_id) FROM pdf_annotations pa WHERE pa.document_id = d.id AND pa.status = 'active' GROUP BY pa.document_id HAVING COUNT(DISTINCT pa.user_id) > 1),
            'averageCollaboratorsPerDocument', COALESCE((SELECT AVG(user_count)::INTEGER FROM (SELECT COUNT(DISTINCT pa.user_id) as user_count FROM pdf_annotations pa WHERE pa.document_id = d.id AND pa.status = 'active' GROUP BY pa.document_id) t), 0),
            'responseTime', COALESCE((SELECT AVG(EXTRACT(EPOCH FROM (ar.created_at - pa.created_at)))::INTEGER FROM annotation_replies ar JOIN pdf_annotations pa ON ar.annotation_id = pa.id WHERE pa.document_id = d.id), 0),
            'engagementRate', COALESCE((SELECT (COUNT(DISTINCT ar.user_id)::DECIMAL / NULLIF(COUNT(DISTINCT pa.user_id), 0) * 100) FROM annotation_replies ar JOIN pdf_annotations pa ON ar.annotation_id = pa.id WHERE pa.document_id = d.id), 0)
        )
    FROM documents d
    WHERE EXISTS (SELECT 1 FROM pdf_annotations pa WHERE pa.document_id = d.id)
    ON CONFLICT (date, document_id) DO UPDATE SET
        total_annotations = EXCLUDED.total_annotations,
        annotations_by_type = EXCLUDED.annotations_by_type,
        annotations_by_page = EXCLUDED.annotations_by_page,
        annotations_by_user = EXCLUDED.annotations_by_user,
        average_annotations_per_page = EXCLUDED.average_annotations_per_page,
        most_annotated_page = EXCLUDED.most_annotated_page,
        most_used_type = EXCLUDED.most_used_type,
        most_active_user = EXCLUDED.most_active_user,
        total_replies = EXCLUDED.total_replies,
        total_reactions = EXCLUDED.total_reactions,
        average_replies_per_annotation = EXCLUDED.average_replies_per_annotation,
        average_reactions_per_annotation = EXCLUDED.average_reactions_per_annotation,
        annotation_growth = EXCLUDED.annotation_growth,
        user_activity = EXCLUDED.user_activity,
        collaboration_metrics = EXCLUDED.collaboration_metrics,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE pdf_annotations IS 'Annotations interactives sur les documents PDF avec surlignages, notes et dessins';
COMMENT ON TABLE annotation_replies IS 'Réponses aux annotations avec mentions et pièces jointes';
COMMENT ON TABLE annotation_reactions IS 'Réactions (likes, emojis) aux annotations et réponses';
COMMENT ON TABLE annotation_history IS 'Historique complet des modifications d\'annotations';
COMMENT ON TABLE annotation_templates IS 'Templates prédéfinis pour créer rapidement des annotations';
COMMENT ON TABLE annotation_exports IS 'Exports d\'annotations dans différents formats';
COMMENT ON TABLE pdf_annotation_statistics IS 'Statistiques détaillées d\'utilisation et de collaboration';
COMMENT ON TABLE annotation_attachments IS 'Pièces jointes (images, documents) pour annotations et réponses';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN pdf_annotations.content IS 'Contenu de l\'annotation {text, html, markdown, color, backgroundColor, opacity, width, height, points, path, url, mediaUrl, duration, thumbnail, alt, title, description, tags, mentions, attachments}';
COMMENT ON COLUMN pdf_annotations.position IS 'Position sur la page {pageNumber, x, y, width, height, rotation, scale, zIndex, anchored, anchorPoint, boundingBox}';
COMMENT ON COLUMN pdf_annotations.style IS 'Style visuel {color, backgroundColor, borderColor, borderWidth, borderStyle, opacity, fontSize, fontFamily, fontWeight, fontStyle, textDecoration, textAlign, lineHeight, letterSpacing, padding, margin, borderRadius, boxShadow, filter, transform, animation}';
COMMENT ON COLUMN pdf_annotations.metadata IS 'Métadonnées {source, confidence, extractedText, context, keywords, sentiment, importance, category, subcategory, language, difficulty, timeSpent, viewCount, editCount, version, parentAnnotationId, childAnnotationIds, relatedAnnotationIds, customFields}';
COMMENT ON COLUMN pdf_annotations.permissions IS 'Permissions d accès {canView, canEdit, canDelete, canComment, canShare, canExport, canPrint, canCopy, canMove, canResize, canChangeStyle, canAddReplies, canViewHistory, isOwner, sharedWith}';
COMMENT ON COLUMN annotation_exports.options IS 'Options d export {includeAnnotations, includeComments, includeReplies, includeHistory, includeMetadata, includeAttachments, filterByType, filterByUser, filterByStatus, dateRange, pageRange, sortBy, sortOrder, groupBy, format}';
COMMENT ON COLUMN pdf_annotation_statistics.annotation_growth IS 'Tendances de croissance {daily, weekly, monthly}';
COMMENT ON COLUMN pdf_annotation_statistics.user_activity IS 'Activité des utilisateurs {totalUsers, activeUsers, averageAnnotationsPerUser, topContributors}';
COMMENT ON COLUMN pdf_annotation_statistics.collaboration_metrics IS 'Métriques de collaboration {sharedAnnotations, collaborativeDocuments, averageCollaboratorsPerDocument, responseTime, engagementRate}';

-- Créer les données par défaut
SELECT create_default_annotation_templates();
