// Edge Function pour l'extraction des transcripts YouTube
// Utilise YouTube Data API v3 pour obtenir les transcripts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Extraire l'ID de la vidéo YouTube d'une URL
function extractVideoId(url: string): string | null {
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

// Obtenir les métadonnées de la vidéo YouTube
async function getVideoMetadata(videoId: string, apiKey: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error(`Erreur API YouTube: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error('Vidéo non trouvée');
  }
  
  const video = data.items[0];
  return {
    title: video.snippet.title,
    description: video.snippet.description,
    channelTitle: video.snippet.channelTitle,
    publishedAt: video.snippet.publishedAt,
    duration: video.contentDetails.duration,
    thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url
  };
}

// Obtenir les transcripts (simulation - en production, utiliser un service tiers)
async function getTranscript(videoId: string): Promise<string> {
  // Note: YouTube Data API ne fournit pas directement les transcripts
  // En production, utiliser des services comme:
  // - youtube-transcript-api (Python)
  // - AssemblyAI
  // - Deepgram
  // - Ou scraping avec puppeteer
  
  // Pour cette démo, nous retournons une indication
  return `[TRANSCRIPT NON DISPONIBLE - Vidéo ID: ${videoId}]

Note: L'extraction automatique des transcripts YouTube nécessite:
1. Un service de transcription tiers (AssemblyAI, Deepgram)
2. Ou un backend Python avec youtube-transcript-api
3. Ou du scraping avec Puppeteer/Playwright

Métadonnées disponibles via YouTube Data API v3.`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Non authentifié')
    }

    // Récupérer l'URL YouTube
    const { url } = await req.json()

    if (!url) {
      throw new Error('URL YouTube requise')
    }

    // Extraire l'ID de la vidéo
    const videoId = extractVideoId(url)
    if (!videoId) {
      throw new Error('URL YouTube invalide')
    }

    console.log(`🎬 Extraction transcript YouTube: ${videoId}`)

    // Obtenir la clé API YouTube
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!youtubeApiKey) {
      throw new Error('Clé API YouTube non configurée')
    }

    // Obtenir les métadonnées de la vidéo
    const metadata = await getVideoMetadata(videoId, youtubeApiKey)
    
    // Obtenir le transcript (simulé pour cette démo)
    const transcript = await getTranscript(videoId)

    console.log(`✅ Métadonnées YouTube extraites: ${metadata.title}`)

    return new Response(
      JSON.stringify({ 
        url,
        videoId,
        metadata,
        transcript,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )

  } catch (error) {
    console.error('❌ Erreur extraction YouTube:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erreur lors de l\'extraction YouTube',
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      },
    )
  }
})
