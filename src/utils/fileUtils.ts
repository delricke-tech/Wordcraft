/**
 * Utilitaires pour la gestion des fichiers
 * 
 * RÈGLE PROJET : Les noms de fichiers originaux ne doivent JAMAIS servir de clé (path) 
 * pour Supabase Storage car les accents et espaces causent des erreurs 'Invalid key'.
 * 
 * Utilisez toujours cleanFileName() pour générer les chemins Storage.
 * Le nom original doit être conservé dans la base de données SQL pour l'affichage.
 */

/**
 * Nettoie un nom de fichier pour le rendre compatible avec Supabase Storage
 * 
 * Transformations appliquées :
 * - Suppression des accents (é → e, à → a, etc.)
 * - Remplacement des espaces par des tirets
 * - Suppression de tous les caractères spéciaux
 * - Conversion en minuscules
 * - Suppression des tirets multiples et en début/fin
 * 
 * @param fileName - Le nom du fichier à nettoyer
 * @returns Le nom nettoyé, compatible avec Supabase Storage
 * 
 * @example
 * cleanFileName("Mon Document (Été 2024).pdf")
 * // Returns: "mon-document-ete-2024.pdf"
 * 
 * cleanFileName("Virologie_Général #1.pdf")
 * // Returns: "virologie-general-1.pdf"
 */
export function cleanFileName(fileName: string): string {
  // Séparer le nom et l'extension
  const lastDotIndex = fileName.lastIndexOf('.');
  const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  const nameWithoutExt = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
  
  // Supprimer les accents en décomposant puis retirant les diacritiques
  const withoutAccents = nameWithoutExt.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Nettoyer le nom :
  // 1. Remplacer les espaces par des tirets
  // 2. Remplacer tous les caractères non alphanumériques par des tirets
  // 3. Convertir en minuscules
  const cleaned = withoutAccents
    .toLowerCase()
    .replace(/\s+/g, '-')                    // Espaces → tirets
    .replace(/[^a-z0-9-]/g, '-')             // Caractères spéciaux → tirets
    .replace(/-+/g, '-')                     // Tirets multiples → un seul tiret
    .replace(/^-|-$/g, '');                  // Supprimer tirets début/fin
  
  // Nettoyer l'extension aussi (en minuscules, sans caractères spéciaux)
  const cleanedExtension = extension
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '');
  
  return cleaned + cleanedExtension;
}

/**
 * Génère un nom de fichier unique pour le stockage
 * 
 * Format : timestamp-random-nom-nettoyé.extension
 * 
 * @param fileName - Le nom du fichier original
 * @returns Un nom de fichier unique, nettoyé et sûr pour Supabase Storage
 * 
 * @example
 * generateUniqueFileName("Mon Document.pdf")
 * // Returns: "1735245678901-abc123-mon-document.pdf"
 */
export function generateUniqueFileName(fileName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const cleanName = cleanFileName(fileName);
  
  // Séparer le nom et l'extension du nom nettoyé
  const lastDotIndex = cleanName.lastIndexOf('.');
  const extension = lastDotIndex !== -1 ? cleanName.substring(lastDotIndex) : '';
  const nameWithoutExt = lastDotIndex !== -1 ? cleanName.substring(0, lastDotIndex) : cleanName;
  
  return `${timestamp}-${randomString}-${nameWithoutExt}${extension}`;
}

/**
 * Valide si un nom de fichier est sûr pour Supabase Storage
 * 
 * @param fileName - Le nom du fichier à valider
 * @returns true si le nom est sûr, false sinon
 */
export function isFileNameSafe(fileName: string): boolean {
  // Un nom est sûr s'il ne contient que des caractères alphanumériques, tirets, points et underscores
  const safePattern = /^[a-z0-9._-]+$/i;
  return safePattern.test(fileName);
}

/**
 * Obtient l'extension d'un fichier
 * 
 * @param fileName - Le nom du fichier
 * @returns L'extension (avec le point) ou une chaîne vide
 */
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
}

/**
 * Obtient le type de fichier basé sur l'extension
 * 
 * @param fileName - Le nom du fichier
 * @returns Le type de fichier (pdf, docx, txt, image, video, audio, url)
 */
export function getFileType(fileName: string): 'pdf' | 'docx' | 'txt' | 'image' | 'video' | 'audio' | 'url' {
  const ext = getFileExtension(fileName).toLowerCase();
  
  if (ext === '.pdf') return 'pdf';
  if (['.doc', '.docx'].includes(ext)) return 'docx';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) return 'image';
  if (['.mp4', '.avi', '.mov', '.webm'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.ogg'].includes(ext)) return 'audio';
  
  return 'txt';
}

