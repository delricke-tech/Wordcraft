-- Add original_name and storage_path to the 'documents' table if they don't exist
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS original_name TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Create the 'group_documents' table
CREATE TABLE group_documents (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (group_id, document_id)
);

-- Enable Row Level Security (RLS) for the 'group_documents' table
ALTER TABLE group_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Group members can view documents in their groups
CREATE POLICY "Group members can view group documents" ON group_documents FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_documents.group_id AND user_id = auth.uid())
);

-- RLS Policy: Group admins can add/remove documents from their groups (simplified)
CREATE POLICY "Group admins can manage group documents" ON group_documents FOR ALL USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_documents.group_id AND user_id = auth.uid() AND role = 'admin')
);