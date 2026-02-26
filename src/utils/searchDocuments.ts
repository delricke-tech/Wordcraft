import { supabase } from '../lib/supabase';

/**
 * Recherche full-text simple sur la table `documents`.
 * Utilise les colonnes `name` et `extracted_text` (si présentes).
 * Retourne les documents triés par `created_at`.
 */
export async function searchDocuments(
  userId: string | null,
  query: string,
  folderId: string | null = null,
  onlyFavorites: boolean = false,
  fileType: string | null = null,
  dateRange: string | null = null // 'all' | '24h' | '7d' | '30d' | 'year'
) {
  try {
    if (!query || query.trim().length === 0) {
      // Si pas de query, récupérer les documents classiques
      const q = userId
        ? supabase.from('documents').select('*').eq('user_id', userId)
        : supabase.from('documents').select('*').is('user_id', null);

      if (folderId === null) {
        // nothing
      } else {
        q.eq('folder_id', folderId);
      }

      if (onlyFavorites) q.eq('is_favorite', true);
      if (fileType) q.eq('file_type', fileType);

      // Date filter
      if (dateRange && dateRange !== 'all') {
        const now = new Date();
        let threshold = new Date();
        if (dateRange === '24h') threshold.setDate(now.getDate() - 1);
        else if (dateRange === '7d') threshold.setDate(now.getDate() - 7);
        else if (dateRange === '30d') threshold.setDate(now.getDate() - 30);
        else if (dateRange === 'year') threshold.setFullYear(now.getFullYear() - 1);
        q.gte('created_at', threshold.toISOString());
      }

      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) {
        console.error('searchDocuments error:', error);
        return [];
      }
      return data || [];
    }

    // Recherche sur name et extracted_text via ILIKE pour un comportement simple
    const ilikeQuery = `%${query.replace(/%/g, '\\%')}%`;

    let base = userId
      ? supabase.from('documents').select('*').eq('user_id', userId)
      : supabase.from('documents').select('*').is('user_id', null);

    if (folderId === null) {
      // Allow root docs (folder_id IS NULL)
    } else {
      base = base.eq('folder_id', folderId);
    }

    if (onlyFavorites) base = base.eq('is_favorite', true);
    if (fileType) base = base.eq('file_type', fileType);

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let threshold = new Date();
      if (dateRange === '24h') threshold.setDate(now.getDate() - 1);
      else if (dateRange === '7d') threshold.setDate(now.getDate() - 7);
      else if (dateRange === '30d') threshold.setDate(now.getDate() - 30);
      else if (dateRange === 'year') threshold.setFullYear(now.getFullYear() - 1);
      base = base.gte('created_at', threshold.toISOString());
    }

    // Build OR condition: name ILIKE query OR extracted_text ILIKE query
    const { data, error } = await base
      .or(`name.ilike.${ilikeQuery},extracted_text.ilike.${ilikeQuery}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('searchDocuments error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('searchDocuments unexpected error:', err);
    return [];
  }
}
