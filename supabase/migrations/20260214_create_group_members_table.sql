-- Create the 'group_members' table
CREATE TABLE group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

-- Enable Row Level Security (RLS) for the 'group_members' table
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Group members can view members of their group
CREATE POLICY "Group members can view members" ON group_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_members.group_id AND user_id = auth.uid())
);

-- RLS Policy: Group admins can add/remove members (simplified, will be refined with 'roles' table later)
CREATE POLICY "Group admins can manage members" ON group_members FOR ALL USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role = 'admin')
);
