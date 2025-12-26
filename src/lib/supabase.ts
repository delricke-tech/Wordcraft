import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vérifier que les variables d'environnement sont bien configurées
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERREUR: Les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies dans le fichier .env');
}

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
 * Upload un fichier dans le bucket Supabase 'documents'
 * @param file - Le fichier à uploader
 * @param userId - L'ID de l'utilisateur (pour organiser les fichiers par utilisateur) - Non utilisé actuellement
 * @param fileName - Nom optionnel du fichier (utilise file.name par défaut)
 * @returns L'objet contenant le chemin du fichier et les données d'upload
 */
export async function uploadFile(
  file: File,
  userId?: string,
  fileName?: string
) {
  try {
    // Fonction pour supprimer les accents
    const removeAccents = (str: string) => {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    // Nettoyer le nom du fichier
    const originalName = fileName || file.name;
    const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'pdf';
    const fileNameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    
    // Supprimer les accents, puis remplacer tous les caractères non-alphanumériques par des tirets
    const nameWithoutAccents = removeAccents(fileNameWithoutExt);
    const cleanName = nameWithoutAccents.replace(/[^a-zA-Z0-9]/g, '-');
    
    // Supprimer les tirets multiples et les tirets en début/fin
    const safeFileName = cleanName.replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    // Créer le chemin simple : timestamp-nom-nettoyé.extension
    const filePath = `${Date.now()}-${safeFileName}.${fileExtension}`;

    console.log('📤 Upload vers Supabase - Nom original:', originalName);
    console.log('📤 Upload vers Supabase - Chemin nettoyé:', filePath);

    // Upload le fichier dans le bucket 'documents'
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Ne pas écraser si le fichier existe déjà
      });

    if (error) {
      throw error;
    }

    // Obtenir l'URL publique du fichier
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return {
      success: true,
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl,
        fileName: safeFileName,
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
