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

/**
 * Upload un fichier dans le bucket Supabase 'Documents'
 * @param file - Le fichier à uploader
 * @param userId - L'ID de l'utilisateur (pour organiser les fichiers par utilisateur)
 * @param fileName - Nom optionnel du fichier (utilise file.name par défaut)
 * @returns L'objet contenant le chemin du fichier et les données d'upload
 */
export async function handleUpload(
  file: File,
  userId: string,
  fileName?: string
) {
  try {
    // Générer un nom de fichier unique avec timestamp
    const timestamp = Date.now();
    const finalFileName = fileName || `${timestamp}-${file.name}`;
    
    // Chemin dans le bucket : user_id/fichier
    const filePath = `${userId}/${finalFileName}`;

    // Upload le fichier dans le bucket 'Documents'
    const { data, error } = await supabase.storage
      .from('Documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Ne pas écraser si le fichier existe déjà
      });

    if (error) {
      throw error;
    }

    // Obtenir l'URL publique du fichier
    const { data: { publicUrl } } = supabase.storage
      .from('Documents')
      .getPublicUrl(filePath);

    return {
      success: true,
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl,
        fileName: finalFileName,
        fileSize: file.size,
        fileType: file.type,
      },
      error: null,
    };
  } catch (error) {
    console.error('Erreur lors de l\'upload du fichier:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'upload',
    };
  }
}
