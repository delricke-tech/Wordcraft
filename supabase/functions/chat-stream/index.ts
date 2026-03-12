/**
 * Edge Function pour le streaming des réponses IA avec Server-Sent Events (SSE)
 * Permet des réponses en temps réel pour une meilleure expérience utilisateur
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
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
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: corsHeaders
      })
    }

    // Parser le corps de la requête
    const { messages, context } = await req.json()

    console.log('🚀 Début streaming chat IA pour utilisateur:', user.id)
    console.log('  - Messages:', messages.length)
    console.log('  - Contexte disponible:', !!context)

    // Obtenir la clé API OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('Clé API OpenAI non configurée')
    }

    // Préparer le prompt pour OpenAI
    const systemPrompt = `Tu es un assistant IA expert spécialisé dans l'analyse de documents et la génération de contenu. 

CONTEXTE DOCUMENTAIRE:
${context ? `Nom du document: ${context.documentName}
Contenu: ${context.extractedText?.substring(0, 8000) || 'Aucun contenu extrait'}
` : 'Aucun document fourni'}

DIRECTIVES:
- Réponds en français de manière claire et structurée
- Base tes réponses sur le contexte fourni
- Sois concis mais complet
- Utilise le markdown pour formater tes réponses
- Si l'information n'est pas dans le contexte, indique-le clairement

IMPORTANT: La réponse sera diffusée en temps réel via Server-Sent Events.`

    const openaiMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ]

    // Appeler l'API OpenAI avec streaming
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        stream: true,
        max_tokens: 4000,
        temperature: 0.7,
      })
    })

    if (!openaiResponse.ok) {
      throw new Error(`Erreur API OpenAI: ${openaiResponse.status}`)
    }

    // Créer le stream SSE
    const reader = openaiResponse.body?.getReader()
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!reader) {
            throw new Error('Impossible de lire le stream de la réponse')
          }

          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              // Envoyer l'événement de fin
              const endEvent = `event: end\ndata: {"done": true}\n\n`
              controller.enqueue(encoder.encode(endEvent))
              break
            }

            // Décoder le chunk
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                
                if (data === '[DONE]') {
                  const endEvent = `event: end\ndata: {"done": true}\n\n`
                  controller.enqueue(encoder.encode(endEvent))
                  break
                }

                try {
                  const parsed = JSON.parse(data)
                  
                  if (parsed.choices && parsed.choices[0]) {
                    const delta = parsed.choices[0].delta
                    
                    if (delta.content) {
                      // Envoyer le chunk de contenu
                      const chunkEvent = `event: chunk\ndata: ${JSON.stringify({
                        content: delta.content,
                        timestamp: new Date().toISOString()
                      })}\n\n`
                      controller.enqueue(encoder.encode(chunkEvent))
                    }

                    if (delta.role === 'assistant') {
                      // Envoyer l'événement de début
                      const startEvent = `event: start\ndata: ${JSON.stringify({
                        role: delta.role,
                        timestamp: new Date().toISOString()
                      })}\n\n`
                      controller.enqueue(encoder.encode(startEvent))
                    }
                  }
                } catch (parseError) {
                  console.warn('⚠️ Erreur parsing chunk SSE:', parseError)
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Erreur streaming:', error)
          
          // Envoyer l'erreur au client
          const errorEvent = `event: error\ndata: ${JSON.stringify({
            error: error.message || 'Erreur inconnue',
            timestamp: new Date().toISOString()
          })}\n\n`
          controller.enqueue(encoder.encode(errorEvent))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error) {
    console.error('❌ Erreur streaming chat IA:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Erreur lors du streaming',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})
