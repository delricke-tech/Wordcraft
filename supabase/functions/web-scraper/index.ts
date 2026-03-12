// Edge Function pour le web scraping avec Jina Reader
// Permet d'extraire le contenu des pages web pour l'analyse IA

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Jina Reader API endpoint
const JINA_READER_API = 'https://r.jina.ai/http://'

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

    // Récupérer l'URL à scraper
    const { url } = await req.json()

    if (!url) {
      throw new Error('URL requise')
    }

    // Valider l'URL
    try {
      new URL(url)
    } catch {
      throw new Error('URL invalide')
    }

    console.log(`🌐 Web scraping de l'URL: ${url}`)

    // Utiliser Jina Reader pour extraire le contenu
    const scraperUrl = `${JINA_READER_API}${encodeURIComponent(url)}`
    
    const response = await fetch(scraperUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'WordCraft-IA/1.0'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur Jina Reader:', errorText)
      throw new Error(`Erreur scraping: ${response.status} - ${errorText}`)
    }

    const content = await response.text()
    
    if (!content || content.trim().length === 0) {
      throw new Error('Aucun contenu trouvé sur cette page')
    }

    // Extraire les métadonnées de base
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname

    // Limiter le contenu pour éviter les tokens excessifs
    const maxContentLength = 15000 // environ 4000 tokens
    const truncatedContent = content.length > maxContentLength 
      ? content.substring(0, maxContentLength) + '\n\n[Contenu tronqué...]'
      : content

    console.log(`✅ Contenu extrait: ${truncatedContent.length} caractères`)

    return new Response(
      JSON.stringify({ 
        url,
        title,
        content: truncatedContent,
        originalLength: content.length,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )

  } catch (error) {
    console.error('❌ Erreur scraping:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erreur lors du scraping',
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
