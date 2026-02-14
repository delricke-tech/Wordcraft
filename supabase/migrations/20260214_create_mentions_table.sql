-- Create the 'mentions' table
CREATE TABLE mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mentioned_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (RLS) for the 'mentions' table
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view mentions if they can view the comment
CREATE POLICY "Users can view mentions" ON mentions FOR SELECT USING (
    EXISTS (SELECT 1 FROM comments WHERE id = mentions.comment_id AND user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM comments WHERE id = mentions.comment_id AND EXISTS (
        SELECT 1 FROM group_documents WHERE document_id = comments.document_id AND EXISTS (SELECT 1 FROM group_members WHERE group_id = group_documents.group_id AND user_id = auth.uid()))
    )
    OR
    EXISTS (SELECT 1 FROM comments WHERE id = mentions.comment_id AND EXISTS (
        SELECT 1 FROM shares WHERE document_id = comments.document_id AND shared_with_user_id = auth.uid()))
);

-- RLS Policy: Users can create mentions
CREATE POLICY "Users can create mentions" ON mentions FOR INSERT WITH CHECK (auth.uid() = mentioned_by);

-- RLS Policy: Users can delete mentions (only the mentioned user or the one who mentioned can delete, or group admin)
CREATE POLICY "Users can delete own mentions or if they are admin" ON mentions FOR DELETE USING (
    (auth.uid() = mentioned_by) OR (auth.uid() = user_id)
    OR
    EXISTS (SELECT 1 FROM group_members gm JOIN comments c ON gm.group_id = (
        SELECT gd.group_id FROM group_documents gd WHERE gd.document_id = c.document_id LIMIT 1
    ) WHERE c.id = mentions.comment_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
);
