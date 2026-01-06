/**
 * Types et fonctions pour la gestion des paiements Mobile Money
 * Opérateurs: Airtel Money et Moov Money
 * 
 * Date: 5 janvier 2025
 */

import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export type PaymentOperator = 'airtel' | 'moov';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  tid_submitted: string;
  operator: PaymentOperator;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  phone_number?: string | null;
  reference?: string | null;
  error_message?: string | null;
  metadata?: Record<string, any>;
}

export interface CreatePaymentData {
  amount: number;
  tid_submitted: string;
  operator: PaymentOperator;
  phone_number?: string;
  reference?: string;
}

export interface PaymentStats {
  user_id: string;
  total_payments: number;
  confirmed_payments: number;
  pending_payments: number;
  failed_payments: number;
  total_amount_confirmed: number;
  total_amount_all: number;
}

// ============================================
// FONCTIONS
// ============================================

/**
 * Créer un nouveau paiement
 */
export async function createPayment(data: CreatePaymentData): Promise<Payment> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Utilisateur non authentifié');
  }

  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      amount: data.amount,
      tid_submitted: data.tid_submitted,
      operator: data.operator,
      phone_number: data.phone_number,
      reference: data.reference,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur création paiement:', error);
    throw error;
  }

  return payment;
}

/**
 * Récupérer tous les paiements de l'utilisateur
 */
export async function getUserPayments(): Promise<Payment[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Utilisateur non authentifié');
  }

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur récupération paiements:', error);
    throw error;
  }

  return data || [];
}

/**
 * Récupérer un paiement par son ID
 */
export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (error) {
    console.error('Erreur récupération paiement:', error);
    return null;
  }

  return data;
}

/**
 * Récupérer un paiement par son TID
 */
export async function getPaymentByTid(tid: string): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('tid_submitted', tid)
    .single();

  if (error) {
    console.error('Erreur récupération paiement par TID:', error);
    return null;
  }

  return data;
}

/**
 * Vérifier si un TID existe déjà
 */
export async function tidExists(tid: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('payments')
    .select('id')
    .eq('tid_submitted', tid)
    .single();

  return !error && data !== null;
}

/**
 * Confirmer un paiement (à appeler depuis une Edge Function sécurisée)
 */
export async function confirmPayment(paymentId: string): Promise<void> {
  const { error } = await supabase.rpc('confirm_payment', {
    payment_id: paymentId
  });

  if (error) {
    console.error('Erreur confirmation paiement:', error);
    throw error;
  }
}

/**
 * Marquer un paiement comme échoué
 */
export async function failPayment(paymentId: string, errorMessage?: string): Promise<void> {
  const { error } = await supabase.rpc('fail_payment', {
    payment_id: paymentId,
    error_msg: errorMessage
  });

  if (error) {
    console.error('Erreur échec paiement:', error);
    throw error;
  }
}

/**
 * Annuler un paiement (seulement si pending)
 */
export async function cancelPayment(paymentId: string): Promise<void> {
  const { error } = await supabase
    .from('payments')
    .update({ status: 'cancelled' })
    .eq('id', paymentId)
    .eq('status', 'pending');

  if (error) {
    console.error('Erreur annulation paiement:', error);
    throw error;
  }
}

/**
 * Récupérer les statistiques de paiements de l'utilisateur
 */
export async function getUserPaymentStats(): Promise<PaymentStats | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Utilisateur non authentifié');
  }

  const { data, error } = await supabase
    .from('payment_stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Erreur récupération stats:', error);
    return null;
  }

  return data;
}

/**
 * Valider le format d'un TID
 */
export function validateTidFormat(tid: string): boolean {
  // TID doit avoir au moins 10 caractères alphanumériques
  const tidRegex = /^[A-Za-z0-9]{10,}$/;
  return tidRegex.test(tid);
}

/**
 * Formater le montant pour l'affichage
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF', // Franc CFA (Afrique de l'Ouest)
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Obtenir le nom complet de l'opérateur
 */
export function getOperatorName(operator: PaymentOperator): string {
  return operator === 'airtel' ? 'Airtel Money' : 'Moov Money';
}

/**
 * Obtenir la couleur associée à un statut
 */
export function getStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'pending':
      return 'orange';
    case 'confirmed':
      return 'green';
    case 'failed':
      return 'red';
    case 'cancelled':
      return 'gray';
    default:
      return 'gray';
  }
}

/**
 * Obtenir le label d'un statut en français
 */
export function getStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'confirmed':
      return 'Confirmé';
    case 'failed':
      return 'Échoué';
    case 'cancelled':
      return 'Annulé';
    default:
      return status;
  }
}

/**
 * S'abonner aux changements de paiements en temps réel
 */
export function subscribeToPayments(
  userId: string,
  callback: (payment: Payment) => void
) {
  const channel = supabase
    .channel('payments_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payments',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Changement de paiement:', payload);
        callback(payload.new as Payment);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// EXPORT
// ============================================

export const payments = {
  create: createPayment,
  getAll: getUserPayments,
  getById: getPaymentById,
  getByTid: getPaymentByTid,
  tidExists,
  confirm: confirmPayment,
  fail: failPayment,
  cancel: cancelPayment,
  getStats: getUserPaymentStats,
  subscribe: subscribeToPayments,
};
