-- Create the 'group_members' table (user_id references profiles for consistency with existing schema)
CREATE TABLE group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

-- Enable Row Level Security (RLS) for the 'group_members' table
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Group members can view members of their group (alias gm to avoid RLS circular evaluation)
CREATE POLICY "Group members can view members" ON group_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
);

-- RLS Policy: Group admins can add/remove members (alias gm to avoid RLS circular evaluation)
CREATE POLICY "Group admins can manage members" ON group_members FOR ALL USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
);
