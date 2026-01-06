import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionAccess {
  hasAccess: boolean;
  isTrial: boolean;
  daysRemaining: number;
  subscriptionType: string | null;
  loading: boolean;
}

export function useSubscriptionAccess(): SubscriptionAccess {
  const { user } = useAuth();
  const [access, setAccess] = useState<SubscriptionAccess>({
    hasAccess: false,
    isTrial: false,
    daysRemaining: 0,
    subscriptionType: null,
    loading: true
  });

  useEffect(() => {
    if (!user) {
      setAccess({
        hasAccess: false,
        isTrial: false,
        daysRemaining: 0,
        subscriptionType: null,
        loading: false
      });
      return;
    }

    checkAccess();
  }, [user]);

  const checkAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('trial_expires_at, subscription_type, subscription_expires_at')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      const now = new Date();
      let hasAccess = false;
      let isTrial = false;
      let daysRemaining = 0;

      // Vérifier l'essai gratuit
      if (data.trial_expires_at) {
        const trialExpiry = new Date(data.trial_expires_at);
        if (trialExpiry > now) {
          hasAccess = true;
          isTrial = true;
          daysRemaining = Math.ceil((trialExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      // Vérifier l'abonnement
      if (data.subscription_expires_at) {
        const subExpiry = new Date(data.subscription_expires_at);
        if (subExpiry > now) {
          hasAccess = true;
          isTrial = false;
          daysRemaining = Math.ceil((subExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      setAccess({
        hasAccess,
        isTrial,
        daysRemaining,
        subscriptionType: data.subscription_type,
        loading: false
      });

    } catch (error) {
      console.error('Erreur de vérification d\'accès:', error);
      setAccess({
        hasAccess: false,
        isTrial: false,
        daysRemaining: 0,
        subscriptionType: null,
        loading: false
      });
    }
  };

  return access;
}
