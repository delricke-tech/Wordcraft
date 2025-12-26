import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'student' | 'teacher' | 'admin';
  ai_credits: number; 
};

export type Folder = {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  color: string;
  icon: string;
  created_at: string;
};

// Type Document simplifié pour votre structure de table
export type Document = {
  id: string;
  name: string;
  storage_path: string;
  user_id: string;
  file_type: 'pdf' | 'docx' | 'txt' | 'image' | 'url' | 'video' | 'audio';
  created_at?: string;
};

export type Quiz = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  question_count: number;
  total_attempts: number;
  average_score: number | null;
  is_ai_generated: boolean;
  settings: {
    time_limit_minutes?: number;
    passing_score: number;
    show_correct_answers?: boolean;
    shuffle_questions?: boolean;
    shuffle_answers?: boolean;
  };
  created_at: string;
  updated_at: string;
};
