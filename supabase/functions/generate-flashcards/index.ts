// Edge Function pour générer des flashcards via OpenAI
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
    const { text, documentName, cardCount = 15 } = await req.json()

    if (!text || !documentName) {
      throw new Error('Texte et nom du document requis')
    }

    console.log(`Génération de ${cardCount} flashcards pour: ${documentName}`)

    // Appeler OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('Clé OpenAI non configurée')
    }

    const prompt = `Tu es un expert en création de flashcards pédagogiques. Génère ${cardCount} flashcards de qualité basées sur le texte suivant.

Texte source : "${text.substring(0, 3000)}..."

IMPORTANT:
- Crée exactement ${cardCount} flashcards variées
- Types: définitions, concepts, dates, formules
- Couv différents aspects importants
- Format recto (question) / verso (réponse)

Réponds UNIQUEMENT avec un JSON valide dans ce format exact:
{
  "title": "Flashcards - [Titre basé sur le contenu]",
  "cards": [
    {
      "front": "Question ou terme",
      "back": "Réponse ou définition",
      "type": "definition" (ou "concept", "date", "formula")
    }
  ]
}`

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
            content: 'Tu es un expert en création de flashcards pédagogiques. Réponds UNIQUEMENT en JSON valide.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
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

    // Parser le JSON
    let flashcardsData
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      flashcardsData = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch (e) {
      console.error('Erreur parsing JSON:', e)
      throw new Error('Format de réponse invalide')
    }

    console.log(`✅ ${flashcardsData.cards.length} flashcards générées`)

    return new Response(
      JSON.stringify(flashcardsData),
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
