// Edge Function pour le chat IA
// Sécurise la clé API côté serveur et évite CORS

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Récupérer les données
    const { messages, context } = await req.json()

    if (!messages || messages.length === 0) {
      throw new Error('Messages requis')
    }

    console.log(`Chat IA - ${messages.length} messages`)

    // Appeler OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('Clé OpenAI non configurée')
    }

    // Préparer le contexte si des documents sont fournis
    let systemMessage = `Tu es un assistant IA pédagogique intelligent. Tu aides les étudiants à comprendre et apprendre.

IMPORTANT - FORMATAGE DES RÉPONSES :
- Saute des lignes entre les paragraphes pour une meilleure lisibilité
- Utilise des sauts de ligne (\n\n) entre les sections
- Structure tes réponses de manière claire et aérée
- Sépare les points importants par des lignes vides
- Utilise des listes quand c'est approprié`
    
    if (context && context.length > 0) {
      systemMessage += `\n\nContexte des documents :\n${context.substring(0, 2000)}`
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Erreur OpenAI:', error)
      throw new Error(`Erreur OpenAI: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('Pas de réponse d\'OpenAI')
    }

    console.log(`✅ Réponse générée`)

    return new Response(
      JSON.stringify({ 
        message: content,
        usage: data.usage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )

  } catch (error) {
    console.error('❌ Erreur complète:', error)
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erreur inconnue',
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
