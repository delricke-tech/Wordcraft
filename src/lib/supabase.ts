import { createClient } from '@supabase/supabase-js';
import { generateUniqueFileName } from '../utils/fileUtils';

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
  folder_id?: string | null;
  file_type: 'pdf' | 'docx' | 'txt' | 'image' | 'url' | 'video' | 'audio';
  is_favorite?: boolean; // Indique si le document est marqué comme favori
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
 * 
 * IMPORTANT : Cette fonction nettoie automatiquement le nom du fichier pour éviter
 * les erreurs 'Invalid key' causées par les accents et caractères spéciaux.
 * 
 * @param file - Le fichier à uploader
 * @param userId - L'ID de l'utilisateur (optionnel, non utilisé actuellement)
 * @param fileName - Nom optionnel du fichier (utilise file.name par défaut)
 * @param onProgress - Callback optionnel pour suivre la progression (0-100)
 * @returns L'objet contenant le chemin du fichier et les données d'upload
 */
export async function uploadFile(
  file: File,
  _userId?: string,
  fileName?: string,
  onProgress?: (progress: number) => void
) {
  try {
    // Utiliser l'utilitaire de nettoyage pour générer un nom de fichier sûr
    const originalName = fileName || file.name;
    const safePath = generateUniqueFileName(originalName);

    console.log('📤 Upload vers Supabase - Nom original:', originalName);
    console.log('📤 Upload vers Supabase - Chemin sûr:', safePath);

    // Note: Supabase Storage ne supporte pas onUploadProgress natif
    // On simule la progression si un callback est fourni
    if (onProgress) {
      onProgress(10); // Début de l'upload
    }

    // Upload le fichier dans le bucket 'documents' avec le nom sûr
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(safePath, file, {
        cacheControl: '3600',
        upsert: false // Ne pas écraser si le fichier existe déjà
      });

    if (error) {
      // Capturer tous les détails de l'erreur Supabase
      console.error('❌ Erreur Supabase Storage détaillée:', {
        message: error.message,
        name: error.name,
        cause: (error as any).cause,
        stack: error.stack
      });
      throw error;
    }

    if (onProgress) {
      onProgress(90); // Upload terminé
    }

    // Obtenir l'URL publique du fichier
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(safePath);

    if (onProgress) {
      onProgress(100); // Complet
    }

    // ✅ [cite: 2025-12-27] : Retourner le chemin EXACT retourné par Supabase Storage
    // Un trigger SQL en base de données normalisera automatiquement storage_path si nécessaire
    console.log('✅ Upload terminé vers Storage');
    console.log('  - Path envoyé pour upload:', safePath);
    console.log('  - Path retourné par Storage:', data.path);
    console.log('  → Ce path sera utilisé en BDD puis normalisé par le trigger SQL [cite: 2025-12-27]');

    return {
      success: true,
      data: {
        path: data.path, // ✅ IMPORTANT : Retourner le chemin exact de Storage [cite: 2025-12-27]
        fullPath: data.fullPath,
        publicUrl,
        fileName: originalName,  // Retourner le nom original pour l'affichage
        fileSize: file.size,
        fileType: file.type,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Erreur lors de l\'upload du fichier:', error);
    
    // Construire un message d'erreur détaillé
    let errorMessage = 'Erreur inconnue lors de l\'upload';
    
    if (error.message) {
      errorMessage = error.message;
      
      // Ajouter des détails supplémentaires si disponibles
      if (error.statusCode) {
        errorMessage += ` (Code: ${error.statusCode})`;
      }
      if (error.error) {
        errorMessage += ` - ${error.error}`;
      }
      if (error.cause) {
        errorMessage += ` - Cause: ${error.cause}`;
      }
    }
    
    // Détection des types d'erreurs courants
    const lowerMessage = errorMessage.toLowerCase();
    
    if (lowerMessage.includes('payload') || lowerMessage.includes('too large')) {
      errorMessage += ' [TAILLE DE FICHIER TROP GRANDE]';
    } else if (lowerMessage.includes('policy') || lowerMessage.includes('row level security') || lowerMessage.includes('rls')) {
      errorMessage += ' [PROBLÈME DE DROITS/SÉCURITÉ RLS]';
    } else if (lowerMessage.includes('mime') || lowerMessage.includes('type')) {
      errorMessage += ' [TYPE DE FICHIER INVALIDE]';
    } else if (lowerMessage.includes('key') || lowerMessage.includes('invalid') || lowerMessage.includes('character')) {
      errorMessage += ' [NOM DE FICHIER INVALIDE - CARACTÈRES SPÉCIAUX]';
    } else if (lowerMessage.includes('bucket') || lowerMessage.includes('not found')) {
      errorMessage += ' [BUCKET NON TROUVÉ]';
    }
    
    return {
      success: false,
      data: null,
      error: errorMessage,
    };
  }
}
