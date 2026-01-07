import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authKey = Deno.env.get('CUSTOM_AUTH_KEY')
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Lire le body
    const body = await req.json()
    console.log('📩 Requête reçue:', JSON.stringify(body, null, 2))

    // VÉRIFICATION DE LA CLÉ SECRÈTE (dans le body ou header)
    const bodyAuthKey = body.auth_key
    const headerAuthKey = req.headers.get('x-custom-authorization')

    if (authKey && bodyAuthKey !== authKey && headerAuthKey !== authKey) {
      console.log('❌ Clé d\'autorisation invalide')
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 401 }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Autorisation validée')

    // Extraire les données
    const message = body.message || ''
    const from = body.from || ''
    const simSlot = body.sim_slot
    const simNumber = body.sim_number
    const timestamp = body.timestamp

    console.log(`📱 Message de: ${from}`)
    console.log(`📝 Contenu: ${message.substring(0, 100)}...`)

    if (simSlot !== undefined) {
      console.log(`📱 SIM Slot: ${simSlot}`)
    }
    if (simNumber) {
      console.log(`📞 Numéro SIM: ${simNumber}`)
    }

    // EXTRACTION DU TID (Moov Money Gabon)
    const tidRegex = /Ref\s*:\s*(\d+)/i
    const tidMatch = message.match(tidRegex)

    if (!tidMatch || !tidMatch[1]) {
      console.log('❌ Aucun TID trouvé dans le message')
      return new Response(
        JSON.stringify({ success: false, error: 'No TID found in message' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tid = tidMatch[1]
    console.log(`✅ TID extrait: ${tid}`)

    // EXTRACTION DU MONTANT (optionnel)
    const amountRegex = /(\d+)\s*FCFA/i
    const amountMatch = message.match(amountRegex)
    const smsAmount = amountMatch ? parseInt(amountMatch[1], 10) : null

    if (smsAmount) {
      console.log(`💰 Montant SMS: ${smsAmount} FCFA`)
    }

    // CHERCHER LE PAIEMENT PENDING
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('tid_submitted', tid)
      .eq('status', 'pending')
      .eq('operator', 'moov')
      .single()

    if (paymentError || !payment) {
      console.log(`❌ Aucun paiement pending trouvé pour TID: ${tid}`)
      return new Response(
        JSON.stringify({ success: false, error: 'No pending payment found', tid }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Paiement trouvé: ${payment.id}`)

    // CONFIRMER LE PAIEMENT
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'confirmed',
        confirmed_at: timestamp || new Date().toISOString(),
        metadata: {
          confirmed_by: 'sms_validation',
          operator: 'moov_gabon',
          sim_info: {
            slot: simSlot,
            number: simNumber,
            timestamp: timestamp
          },
          sms_amount: smsAmount
        }
      })
      .eq('id', payment.id)

    if (updateError) {
      console.log('❌ Erreur mise à jour paiement:', updateError)
      throw updateError
    }

    console.log(`✅ Paiement confirmé: ${payment.id}`)

    // METTRE À JOUR L'ABONNEMENT (AVEC FIX BUG 2)
    const amount = smsAmount || payment.amount

    // Déterminer le type d'abonnement
    let subscriptionType = 'basic'
    let durationDays = 30

    if (amount >= 10000) {
      subscriptionType = 'premium'
      durationDays = 365
    } else if (amount >= 5000) {
      subscriptionType = 'premium'
      durationDays = 30
    } else if (amount >= 2000) {
      subscriptionType = 'standard'
      durationDays = 30
    }

    // RÉCUPÉRER L'ABONNEMENT EXISTANT
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_expires_at')
      .eq('id', payment.user_id)
      .single()

    // CALCULER LA NOUVELLE DATE (FIX BUG 2: EXTENSION AU LIEU D'ÉCRASEMENT)
    let expiresAt: Date
    if (profile && profile.subscription_expires_at) {
      const currentExpiration = new Date(profile.subscription_expires_at)
      const now = new Date()

      if (currentExpiration > now) {
        // Abonnement actif: ÉTENDRE
        expiresAt = new Date(currentExpiration)
        expiresAt.setDate(expiresAt.getDate() + durationDays)
        console.log(`📅 Extension: ${durationDays} jours ajoutés à ${currentExpiration.toISOString()}`)
      } else {
        // Abonnement expiré: partir de maintenant
        expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + durationDays)
        console.log(`📅 Nouvel abonnement: ${durationDays} jours`)
      }
    } else {
      // Pas d'abonnement: partir de maintenant
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + durationDays)
      console.log(`📅 Premier abonnement: ${durationDays} jours`)
    }

    // METTRE À JOUR LE PROFIL
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: payment.user_id,
        subscription_type: subscriptionType,
        subscription_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.log('⚠️ Erreur mise à jour profil:', profileError)
    } else {
      console.log(`✅ Abonnement mis à jour: ${subscriptionType} jusqu'au ${expiresAt.toISOString()}`)
    }

    // RÉPONSE SUCCÈS
    return new Response(
      JSON.stringify({
        success: true,
        payment_id: payment.id,
        user_id: payment.user_id,
        tid: tid,
        amount: amount,
        subscription: {
          type: subscriptionType,
          expires_at: expiresAt.toISOString(),
          duration_days: durationDays
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.log('❌ Erreur:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})