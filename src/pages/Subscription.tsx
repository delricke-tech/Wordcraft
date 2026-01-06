import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface SubscriptionData {
  trialExpiresAt: string | null;
  subscriptionType: string | null;
  subscriptionExpiresAt: string | null;
  hasAccess: boolean;
  daysRemaining: number;
}

const MOOV_NUMBERS = [
  '+241 06 69 46 697',
  '+241 06 66 68 257'
];

const PRICING = [
  { amount: 2000, duration: '1 mois', days: 30, type: 'basic' },
  { amount: 5000, duration: '3 mois', days: 90, type: 'standard' },
  { amount: 15000, duration: '1 an', days: 365, type: 'premium' }
];

export default function Subscription() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(2000);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données du profil
      const { data, error } = await supabase
        .from('profiles')
        .select('trial_expires_at, subscription_type, subscription_expires_at')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      // Calculer les jours restants
      let daysRemaining = 0;
      let hasAccess = false;

      if (data.trial_expires_at) {
        const trialExpiry = new Date(data.trial_expires_at);
        const now = new Date();
        if (trialExpiry > now) {
          daysRemaining = Math.ceil((trialExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          hasAccess = true;
        }
      }

      if (data.subscription_expires_at) {
        const subExpiry = new Date(data.subscription_expires_at);
        const now = new Date();
        if (subExpiry > now) {
          daysRemaining = Math.ceil((subExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          hasAccess = true;
        }
      }

      setSubscription({
        trialExpiresAt: data.trial_expires_at,
        subscriptionType: data.subscription_type,
        subscriptionExpiresAt: data.subscription_expires_at,
        hasAccess,
        daysRemaining
      });

    } catch (error) {
      console.error('Erreur de chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionRef.trim()) {
      setMessage({ type: 'error', text: 'Veuillez entrer la référence de transaction' });
      return;
    }

    try {
      setValidating(true);
      setMessage(null);

      // 1. Créer le paiement dans la base de données
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user?.id,
          amount: selectedAmount,
          tid_submitted: transactionRef.trim(),
          operator: 'moov',
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError) {
        if (paymentError.code === '23505') {
          setMessage({ type: 'error', text: 'Cette référence a déjà été utilisée' });
        } else {
          throw paymentError;
        }
        return;
      }

      // 2. Attendre quelques secondes pour la validation automatique via SMS
      setMessage({ type: 'success', text: 'Vérification en cours...' });
      
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 3. Vérifier si le paiement a été confirmé
      const { data: updatedPayment } = await supabase
        .from('payments')
        .select('status')
        .eq('id', payment.id)
        .single();

      if (updatedPayment?.status === 'confirmed') {
        setMessage({ 
          type: 'success', 
          text: '✅ Paiement validé ! Votre abonnement est actif.' 
        });
        setTimeout(() => {
          loadSubscriptionData();
          setTransactionRef('');
        }, 2000);
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Paiement en attente de confirmation. Veuillez réessayer dans quelques instants.' 
        });
      }

    } catch (error: any) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: error.message || 'Erreur de validation' });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Abonnement</h1>

        {/* Statut actuel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {subscription?.hasAccess ? (
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Accès actif
                </h2>
                <p className="text-gray-600 mt-1">
                  {subscription.subscriptionExpiresAt && new Date(subscription.subscriptionExpiresAt) > new Date()
                    ? `Abonnement ${subscription.subscriptionType} actif`
                    : 'Période d\'essai gratuite'
                  }
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {subscription.daysRemaining} jour{subscription.daysRemaining > 1 ? 's' : ''} restant{subscription.daysRemaining > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Abonnement expiré
                </h2>
                <p className="text-gray-600 mt-1">
                  Renouvelez votre abonnement pour continuer à utiliser l'application
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tarifs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Nos Tarifs</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {PRICING.map((plan) => (
              <div
                key={plan.amount}
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  selectedAmount === plan.amount
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedAmount(plan.amount)}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {plan.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">FCFA</div>
                  <div className="text-lg font-semibold text-gray-700 mt-2">
                    {plan.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions de paiement */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            <CreditCard className="inline mr-2" />
            Comment payer ?
          </h2>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-2">Étape 1 : Effectuez le paiement</p>
              <p className="text-gray-700 mb-3">
                Envoyez <strong>{selectedAmount.toLocaleString()} FCFA</strong> via Moov Money vers l'un de ces numéros :
              </p>
              <div className="space-y-2">
                {MOOV_NUMBERS.map((number, idx) => (
                  <div key={idx} className="bg-white rounded px-4 py-2 font-mono text-lg">
                    📱 {number}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-2">Étape 2 : Récupérez la référence</p>
              <p className="text-gray-700">
                Après le paiement, vous recevrez un SMS de confirmation contenant une <strong>référence de transaction</strong> (ex: Ref: 123456789)
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-2">Étape 3 : Validez ci-dessous</p>
              <p className="text-gray-700">
                Entrez la référence dans le formulaire ci-dessous pour activer votre abonnement
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire de validation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Valider mon paiement
          </h2>

          <form onSubmit={handleValidatePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Référence de transaction (Ref)
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Ex: 123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={validating}
              />
              <p className="text-sm text-gray-500 mt-1">
                Entrez uniquement les chiffres de la référence (sans "Ref:" ni espaces)
              </p>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={validating || !transactionRef.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {validating ? 'Validation en cours...' : 'Valider le paiement'}
            </button>
          </form>
        </div>

        {/* Note importante */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note :</strong> La validation peut prendre quelques secondes. Si le paiement n'est pas validé immédiatement, 
            il sera confirmé automatiquement dès réception du SMS de Moov Money sur nos téléphones.
          </p>
        </div>
      </div>
    </div>
  );
}
