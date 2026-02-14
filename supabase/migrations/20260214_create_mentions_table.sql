-- Create the 'mentions' table (user FKs reference profiles for consistency with existing schema)
CREATE TABLE mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    mentioned_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (RLS) for the 'mentions' table
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view mentions if they can view the comment
-- comments uses target_type + target_id (not document_id); document scope only when target_type = 'document'
CREATE POLICY "Users can view mentions" ON mentions FOR SELECT USING (
    EXISTS (SELECT 1 FROM comments c WHERE c.id = mentions.comment_id AND c.user_id = auth.uid())
    OR
    EXISTS (
        SELECT 1 FROM comments c
        JOIN group_documents gd ON gd.document_id = c.target_id AND c.target_type = 'document'
        WHERE c.id = mentions.comment_id
        AND EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = gd.group_id AND gm.user_id = auth.uid())
    )
    OR
    EXISTS (
        SELECT 1 FROM comments c
        JOIN shares s ON s.document_id = c.target_id AND c.target_type = 'document'
        WHERE c.id = mentions.comment_id AND s.shared_with_user_id = auth.uid()
    )
);

-- RLS Policy: Users can create mentions
CREATE POLICY "Users can create mentions" ON mentions FOR INSERT WITH CHECK (auth.uid() = mentioned_by);

-- RLS Policy: Users can delete mentions (only the mentioned user or the one who mentioned can delete, or group admin)
-- Use target_type/target_id for comment's document; alias gm to avoid RLS circular evaluation
CREATE POLICY "Users can delete own mentions or if they are admin" ON mentions FOR DELETE USING (
    (auth.uid() = mentioned_by) OR (auth.uid() = user_id)
    OR
    EXISTS (
        SELECT 1 FROM group_members gm
        JOIN comments c ON c.id = mentions.comment_id AND c.target_type = 'document'
        JOIN group_documents gd ON gd.document_id = c.target_id AND gd.group_id = gm.group_id
        WHERE gm.user_id = auth.uid() AND gm.role = 'admin'
    )
);
