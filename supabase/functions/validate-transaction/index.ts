/**
 * Supabase Edge Function: validate-transaction
 * 
 * Validation automatique des transactions Mobile Money via SMS
 * Opérateurs: Airtel Money, Moov Money, Libertis
 * 
 * Date: 5 janvier 2025
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// ============================================
// TYPES
// ============================================

interface SmsData {
  message: string;
  from: string;
}

interface TransactionInfo {
  tid: string | null;
  operator: 'airtel' | 'moov' | null;
  amount?: number;
  reference?: string;
}

// ============================================
// CONFIGURATION
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-secret-key',
};

// ============================================
// REGEX PATTERNS
// ============================================

const REGEX_PATTERNS = {
  // Airtel Money: TID: XXXXX ou Transaction ID: XXXXX
  airtel: [
    /TID[:\s]+([A-Z0-9]{10,})/i,
    /Transaction\s+ID[:\s]+([A-Z0-9]{10,})/i,
    /Code[:\s]+([A-Z0-9]{10,})/i
  ],
  
  // Moov Money: Ref: XXXXX ou Reference: XXXXX
  moov: [
    /Ref[:\s]+([A-Z0-9]{10,})/i,
    /Reference[:\s]+([A-Z0-9]{10,})/i,
    /Transaction[:\s]+([A-Z0-9]{10,})/i
  ],
  
  // Libertis (Moov): même format que Moov
  libertis: [
    /Ref[:\s]+([A-Z0-9]{10,})/i,
    /Reference[:\s]+([A-Z0-9]{10,})/i,
    /Transaction[:\s]+([A-Z0-9]{10,})/i
  ],
  
  // Montant: chercher un nombre avec FCFA ou CFA
  amount: [
    /(\d+(?:\s?\d+)*)\s*(?:FCFA|CFA|F\s*CFA)/i,
    /Montant[:\s]+(\d+(?:\s?\d+)*)/i
  ]
};

// ============================================
// FONCTIONS HELPER
// ============================================

/**
 * Vérifier la clé secrète
 */
function verifySecretKey(request: Request): boolean {
  const secretKey = request.headers.get('x-secret-key');
  const expectedKey = Deno.env.get('SMS_SECRET_KEY');
  
  if (!expectedKey) {
    console.error('❌ SMS_SECRET_KEY non configurée dans les variables d\'environnement');
    return false;
  }
  
  return secretKey === expectedKey;
}

/**
 * Détecter l'opérateur depuis l'expéditeur
 */
function detectOperator(from: string): 'airtel' | 'moov' | null {
  const fromLower = from.toLowerCase();
  
  if (fromLower.includes('airtel')) {
    return 'airtel';
  }
  
  if (fromLower.includes('moov') || fromLower.includes('libertis')) {
    return 'moov';
  }
  
  return null;
}

/**
 * Extraire le TID du message selon l'opérateur
 */
function extractTID(message: string, operator: 'airtel' | 'moov'): string | null {
  const patterns = operator === 'airtel' 
    ? REGEX_PATTERNS.airtel 
    : [...REGEX_PATTERNS.moov, ...REGEX_PATTERNS.libertis];
  
  for (const pattern of patterns) {
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
 * Extraire le montant du message
 */
function extractAmount(message: string): number | null {
  for (const pattern of REGEX_PATTERNS.amount) {
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
  const operator = detectOperator(data.from);
  
  if (!operator) {
    console.warn(`⚠️ Opérateur non reconnu: ${data.from}`);
    return { tid: null, operator: null };
  }
  
  const tid = extractTID(data.message, operator);
  const amount = extractAmount(data.message);
  
  return {
    tid,
    operator,
    amount: amount || undefined
  };
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
async function confirmPayment(supabase: any, paymentId: string, amount?: number) {
  const updateData: any = {
    status: 'confirmed',
    confirmed_at: new Date().toISOString()
  };
  
  // Si le montant est extrait du SMS, vérifier qu'il correspond
  if (amount) {
    updateData.metadata = { sms_amount: amount };
  }
  
  const { error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', paymentId);
  
  if (error) throw error;
}

/**
 * Mettre à jour l'abonnement de l'utilisateur
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
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);
  
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
  // Vous pouvez implémenter l'envoi d'une notification ici
  // Par exemple, créer une entrée dans une table notifications
  
  try {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'payment_confirmed',
        title: 'Paiement confirmé',
        message: 'Votre paiement a été confirmé avec succès. Votre abonnement est maintenant actif !',
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
    // 1. Vérifier la clé secrète
    if (!verifySecretKey(req)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: Invalid secret key' 
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
    
    // 3. Extraire les informations
    const transactionInfo = parseSmsMessage(smsData);
    
    if (!transactionInfo.tid || !transactionInfo.operator) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract transaction information from SMS',
          details: {
            operator_detected: transactionInfo.operator,
            tid_found: !!transactionInfo.tid
          }
        }),
        { 
          status: 400, 
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`✅ Transaction Info:`, transactionInfo);
    
    // 4. Se connecter à Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // 5. Chercher le paiement en attente
    const payment = await findPendingPayment(supabaseClient, transactionInfo.tid);
    
    if (!payment) {
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
    
    // 6. Vérifier que l'opérateur correspond
    if (payment.operator !== transactionInfo.operator) {
      console.warn(`⚠️ Opérateur différent: ${payment.operator} vs ${transactionInfo.operator}`);
    }
    
    // 7. Confirmer le paiement
    await confirmPayment(supabaseClient, payment.id, transactionInfo.amount);
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
        operator: transactionInfo.operator,
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
