/**
 * Service pour l'extraction des transcripts YouTube
 * Utilise YouTube Data API v3
 */

import { supabase } from '../lib/supabase';

export interface YouTubeMetadata {
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  thumbnail: string;
}

export interface YouTubeTranscript {
  url: string;
  videoId: string;
  metadata: YouTubeMetadata;
  transcript: string;
  timestamp: string;
}

/**
 * Extrait le transcript et les métadonnées d'une vidéo YouTube
 */
export async function extractYouTubeTranscript(url: string): Promise<YouTubeTranscript> {
  try {
    console.log('🎬 Lancement extraction YouTube:', url);

    const { data, error } = await supabase.functions.invoke('youtube-transcript', {
      body: { url }
    });

    if (error) {
      console.error('❌ Erreur fonction youtube-transcript:', error);
      throw new Error(`Erreur extraction YouTube: ${error.message}`);
    }

    if (!data || data.error) {
      throw new Error(data?.error || 'Aucune donnée reçue de YouTube');
    }

    console.log('✅ Données YouTube extraites avec succès:', {
      videoId: data.videoId,
      title: data.metadata.title,
      transcriptLength: data.transcript.length
    });

    return data;
  } catch (error) {
    console.error('❌ Erreur extractYouTubeTranscript:', error);
    throw error;
  }
}

/**
 * Vérifie si une chaîne est une URL YouTube valide
 */
export function isYouTubeUrl(url: string): boolean {
  const youtubePatterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  return youtubePatterns.some(pattern => pattern.test(url));
}

/**
 * Extrait l'ID de la vidéo YouTube d'une URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Formate le contenu YouTube pour le contexte IA
 */
export function formatYouTubeContentForAI(youtubeData: YouTubeTranscript): string {
  const { metadata, transcript, url, videoId } = youtubeData;
  
  return `
=== VIDÉO YOUTUBE : ${metadata.title} ===
Source: ${url}
Vidéo ID: ${videoId}
Chaîne: ${metadata.channelTitle}
Publié le: ${new Date(metadata.publishedAt).toLocaleDateString('fr-FR')}
Durée: ${metadata.duration}

DESCRIPTION:
${metadata.description}

TRANSCRIPT:
${transcript}

---`;
}

/**
 * Extrait les URLs YouTube d'un texte
 */
export function extractYouTubeUrls(text: string): string[] {
  const urlPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/g;
  const matches = text.match(urlPattern);
  return matches || [];
}

/**
 * Détecte automatiquement les URLs YouTube dans un message et les extrait
 */
export async function detectAndExtractYouTube(message: string): Promise<{
  processedMessage: string;
  youtubeContents: YouTubeTranscript[];
}> {
  const urls = extractYouTubeUrls(message);
  const youtubeContents: YouTubeTranscript[] = [];
  let processedMessage = message;

  if (urls.length > 0) {
    console.log(`🎬 Détection de ${urls.length} URL(s) YouTube dans le message`);

    // Extraire chaque vidéo YouTube en parallèle
    const extractionPromises = urls.map(url => extractYouTubeTranscript(url));
    const results = await Promise.allSettled(extractionPromises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        youtubeContents.push(result.value);
        // Remplacer l'URL par un format plus lisible
        processedMessage = processedMessage.replace(
          urls[index],
          `[🎬 ${result.value.metadata.title}](${result.value.url})`
        );
      } else {
        console.error(`❌ Erreur extraction YouTube ${urls[index]}:`, result.reason);
        // Garder l'URL originale mais marquer comme non accessible
        processedMessage = processedMessage.replace(
          urls[index],
          `[🎬 Vidéo YouTube non accessible: ${urls[index]}]`
        );
      }
    });
  }

  return {
    processedMessage,
    youtubeContents
  };
}
