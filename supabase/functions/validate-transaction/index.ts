/**
 * Supabase Edge Function: validate-transaction
 * 
 * Validation automatique des transactions Moov Money Gabon via SMS
 * Support de 2 cartes SIM Moov (Libertis)
 * 
 * Date: 6 janvier 2025
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// ============================================
// TYPES
// ============================================

interface SmsData {
  message: string;
  from: string;
  sim_slot?: number;        // Optionnel : numéro du slot SIM (1 ou 2)
  sim_number?: string;      // Optionnel : numéro de la SIM
  timestamp?: string;       // Optionnel : timestamp du SMS
}

interface TransactionInfo {
  tid: string | null;
  amount: number | null;
  reference?: string;
}

// ============================================
// CONFIGURATION
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-authorization',
};

// ============================================
// REGEX PATTERNS - MOOV MONEY GABON
// ============================================

const MOOV_PATTERNS = {
  // Référence transaction : Ref: ou Ref :
  reference: [
    /Ref\s*:\s*(\d+)/i,           // "Ref: 123456" ou "Ref : 123456"
    /Reference\s*:\s*(\d+)/i,     // "Reference: 123456"
    /Transaction\s*:\s*(\d+)/i    // "Transaction: 123456" (backup)
  ],
  
  // Montant : chercher un nombre avec FCFA ou CFA
  amount: [
    /(\d+(?:\s?\d+)*)\s*(?:FCFA|F\s*CFA|CFA)/i,
    /Montant\s*:\s*(\d+(?:\s?\d+)*)/i,
    /(\d{3,})\s*F(?:\s|$)/i       // "5000 F" ou "5000F"
  ]
};

// ============================================
// FONCTIONS HELPER
// ============================================

/**
 * Vérifier le header d'autorisation personnalisé
 */
function verifyAuthorization(request: Request): boolean {
  const authHeader = request.headers.get('x-custom-authorization');
  const expectedAuth = Deno.env.get('CUSTOM_AUTHORIZATION_KEY');
  
  if (!expectedAuth) {
    console.error('❌ CUSTOM_AUTHORIZATION_KEY non configurée dans les variables d\'environnement');
    return false;
  }
  
  return authHeader === expectedAuth;
}

/**
 * Extraire la référence (TID) du SMS Moov Money
 */
function extractTID(message: string): string | null {
  for (const pattern of MOOV_PATTERNS.reference) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const tid = match[1].replace(/\s+/g, ''); // Enlever les espaces
      console.log(`✅ TID trouvé: ${tid}`);
      return tid;
    }
  }
  
  return null;
}

/**
 * Extraire le montant du SMS
 */
function extractAmount(message: string): number | null {
  for (const pattern of MOOV_PATTERNS.amount) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const amountStr = match[1].replace(/\s+/g, ''); // Enlever les espaces
      const amount = parseInt(amountStr, 10);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }
  
  return null;
}

/**
 * Analyser le SMS et extraire les informations
 */
function parseSmsMessage(data: SmsData): TransactionInfo {
  const tid = extractTID(data.message);
  const amount = extractAmount(data.message);
  
  return {
    tid,
    amount
  };
}

/**
 * Logger les informations de la SIM
 */
function logSimInfo(data: SmsData) {
  if (data.sim_slot !== undefined) {
    console.log(`📱 SIM Slot: ${data.sim_slot} (SIM ${data.sim_slot})`);
  }
  
  if (data.sim_number) {
    console.log(`📞 Numéro SIM: ${data.sim_number}`);
  }
  
  if (data.timestamp) {
    console.log(`⏰ Timestamp SMS: ${data.timestamp}`);
  }
  
  if (!data.sim_slot && !data.sim_number) {
    console.log(`📱 Info SIM non fournie par l'application`);
  }
}

/**
 * Chercher un paiement en attente
 */
async function findPendingPayment(supabase: any, tid: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('tid_submitted', tid)
    .eq('status', 'pending')
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // Aucune ligne trouvée
      return null;
    }
    throw error;
  }
  
  return data;
}

/**
 * Confirmer le paiement
 */
async function confirmPayment(supabase: any, paymentId: string, amount: number | null, simInfo?: any) {
  const metadata: any = {
    confirmed_by: 'sms_validation',
    operator: 'moov_gabon'
  };
  
  if (amount) {
    metadata.sms_amount = amount;
  }
  
  if (simInfo) {
    metadata.sim_info = simInfo;
  }
  
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      metadata: metadata
    })
    .eq('id', paymentId);
  
  if (error) throw error;
}

/**
 * Mettre à jour l'abonnement de l'utilisateur
 * CORRECTION BUG : Étend l'abonnement existant au lieu de l'écraser
 */
async function updateUserSubscription(supabase: any, userId: string, amount: number) {
  // Déterminer le type d'abonnement selon le montant
  let subscriptionType = 'basic';
  let durationDays = 30;
  
  if (amount >= 10000) {
    subscriptionType = 'premium';
    durationDays = 365; // 1 an
  } else if (amount >= 5000) {
    subscriptionType = 'premium';
    durationDays = 30; // 1 mois
  } else if (amount >= 2000) {
    subscriptionType = 'standard';
    durationDays = 30;
  }
  
  // ✅ FIX: Récupérer d'abord l'abonnement existant
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_expires_at')
    .eq('id', userId)
    .single();
  
  // Calculer la nouvelle date d'expiration
  let expiresAt: Date;
  
  if (profile && profile.subscription_expires_at) {
    const currentExpiration = new Date(profile.subscription_expires_at);
    const now = new Date();
    
    // ✅ Si l'abonnement actuel n'a pas encore expiré, on ÉTEND
    if (currentExpiration > now) {
      expiresAt = new Date(currentExpiration);
      expiresAt.setDate(expiresAt.getDate() + durationDays);
      console.log(`📅 Extension d'abonnement: ${durationDays} jours ajoutés à ${currentExpiration.toISOString()}`);
    } else {
      // Abonnement expiré, on part de maintenant
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);
      console.log(`📅 Nouvel abonnement: ${durationDays} jours à partir de maintenant`);
    }
  } else {
    // Pas d'abonnement existant, on part de maintenant
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);
    console.log(`📅 Premier abonnement: ${durationDays} jours`);
  }
  
  // Mettre à jour le profil utilisateur
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_type: subscriptionType,
      subscription_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
  
  if (error) throw error;
  
  return { subscriptionType, expiresAt };
}

/**
 * Envoyer une notification à l'utilisateur (optionnel)
 */
async function notifyUser(supabase: any, userId: string, paymentId: string) {
  try {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'payment_confirmed',
        title: '💰 Paiement confirmé',
        message: 'Votre paiement Moov Money a été confirmé avec succès. Votre abonnement est maintenant actif !',
        data: { payment_id: paymentId }
      });
  } catch (error) {
    console.warn('⚠️ Impossible d\'envoyer la notification:', error);
  }
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

serve(async (req) => {
  // Gérer CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  
  try {
    console.log('🇬🇦 === VALIDATION MOOV MONEY GABON ===');
    
    // 1. Vérifier l'autorisation personnalisée
    if (!verifyAuthorization(req)) {
      console.error('❌ Autorisation refusée');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: Invalid authorization header' 
        }),
        { 
          status: 401, 
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // 2. Parser le JSON
    const smsData: SmsData = await req.json();
    
    if (!smsData.message || !smsData.from) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: message or from' 
        }),
        { 
          status: 400, 
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('📱 SMS reçu de:', smsData.from);
    console.log('📄 Message:', smsData.message);
    
    // Logger les informations de la SIM
    logSimInfo(smsData);
    
    // 3. Extraire les informations
    const transactionInfo = parseSmsMessage(smsData);
    
    if (!transactionInfo.tid) {
      console.warn('⚠️ TID non trouvé dans le message');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract transaction reference (TID) from SMS',
          details: {
            message_preview: smsData.message.substring(0, 100)
          }
        }),
        { 
          status: 400, 
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`✅ Transaction Info:`, {
      tid: transactionInfo.tid,
      amount: transactionInfo.amount
    });
    
    // 4. Se connecter à Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // 5. Chercher le paiement en attente
    const payment = await findPendingPayment(supabaseClient, transactionInfo.tid);
    
    if (!payment) {
      console.warn(`⚠️ Aucun paiement en attente trouvé pour TID: ${transactionInfo.tid}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No pending payment found with this TID',
          tid: transactionInfo.tid
        }),
        { 
          status: 404, 
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`💰 Paiement trouvé:`, payment.id);
    
    // 6. Vérifier que c'est bien Moov
    if (payment.operator !== 'moov') {
      console.error(`❌ Opérateur incorrect: ${payment.operator} (attendu: moov)`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment operator mismatch',
          details: {
            expected: 'moov',
            found: payment.operator
          }
        }),
        { 
          status: 400, 
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // 7. Confirmer le paiement
    const simInfo = {
      slot: smsData.sim_slot,
      number: smsData.sim_number,
      timestamp: smsData.timestamp
    };
    
    await confirmPayment(supabaseClient, payment.id, transactionInfo.amount, simInfo);
    console.log(`✅ Paiement confirmé:`, payment.id);
    
    // 8. Mettre à jour l'abonnement
    const subscription = await updateUserSubscription(
      supabaseClient, 
      payment.user_id, 
      transactionInfo.amount || payment.amount
    );
    console.log(`✅ Abonnement mis à jour:`, subscription);
    
    // 9. Notifier l'utilisateur (optionnel)
    await notifyUser(supabaseClient, payment.user_id, payment.id);
    
    // 10. Retourner le succès
    return new Response(
      JSON.stringify({ 
        success: true,
        payment_id: payment.id,
        user_id: payment.user_id,
        amount: transactionInfo.amount || payment.amount,
        tid: transactionInfo.tid,
        operator: 'moov',
        sim_info: simInfo,
        subscription: subscription
      }),
      { 
        status: 200, 
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error: any) {
    console.error('❌ Erreur:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
      }
    );
  }
});
