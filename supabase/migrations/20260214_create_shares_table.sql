-- Create the 'shares' table
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with_email TEXT,
    permissions TEXT NOT NULL DEFAULT 'view',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (RLS) for the 'shares' table
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view shares they created or that were shared with them
CREATE POLICY "Users can view their shares" ON shares FOR SELECT USING (
    auth.uid() = shared_by OR auth.uid() = shared_with_user_id
);

-- RLS Policy: Users can create shares for documents they own
CREATE POLICY "Users can share own documents" ON shares FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM documents WHERE id = shares.document_id AND user_id = auth.uid())
);

-- RLS Policy: Users can update or delete shares they created
CREATE POLICY "Users can manage their shares" ON shares FOR ALL USING (
    auth.uid() = shared_by
);
