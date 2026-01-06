-- ============================================
-- Fonction RPC pour validation atomique
-- Protection contre race condition avec 2 SIM
-- Date: 6 janvier 2025
-- ============================================

-- Fonction pour valider et confirmer un paiement de manière atomique
CREATE OR REPLACE FUNCTION public.validate_and_confirm_payment(
    p_tid TEXT,
    p_sim_slot INTEGER DEFAULT NULL,
    p_sim_number TEXT DEFAULT NULL,
    p_sms_amount NUMERIC DEFAULT NULL,
    p_timestamp TIMESTAMPTZ DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment RECORD;
    v_subscription RECORD;
    v_result jsonb;
    v_subscription_type TEXT;
    v_duration_days INTEGER;
    v_new_expires_at TIMESTAMPTZ;
BEGIN
    -- ============================================
    -- ÉTAPE 1 : SELECT FOR UPDATE (LOCK)
    -- ============================================
    -- Cette requête LOCK la ligne jusqu'à la fin de la transaction
    -- Si 2 SIM essaient en même temps, la 2ème attendra que la 1ère finisse
    
    SELECT * INTO v_payment
    FROM public.payments
    WHERE tid_submitted = p_tid 
      AND status = 'pending'
      AND operator = 'moov'
    FOR UPDATE NOWAIT;  -- NOWAIT : échoue immédiatement si déjà locké
    
    -- Si pas trouvé ou déjà locké
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No pending payment found with this TID or payment is being processed',
            'tid', p_tid
        );
    END IF;
    
    -- ============================================
    -- ÉTAPE 2 : CONFIRMER LE PAIEMENT
    -- ============================================
    
    UPDATE public.payments
    SET 
        status = 'confirmed',
        confirmed_at = COALESCE(p_timestamp, NOW()),
        metadata = jsonb_build_object(
            'confirmed_by', 'sms_validation',
            'operator', 'moov_gabon',
            'sim_info', jsonb_build_object(
                'slot', p_sim_slot,
                'number', p_sim_number,
                'timestamp', p_timestamp
            ),
            'sms_amount', p_sms_amount
        )
    WHERE id = v_payment.id;
    
    RAISE NOTICE '✅ Paiement confirmé: % via SIM %', v_payment.id, p_sim_slot;
    
    -- ============================================
    -- ÉTAPE 3 : METTRE À JOUR L'ABONNEMENT
    -- ============================================
    
    -- Déterminer le type d'abonnement selon le montant
    IF COALESCE(p_sms_amount, v_payment.amount) >= 10000 THEN
        v_subscription_type := 'premium';
        v_duration_days := 365; -- 1 an
    ELSIF COALESCE(p_sms_amount, v_payment.amount) >= 5000 THEN
        v_subscription_type := 'premium';
        v_duration_days := 30; -- 1 mois
    ELSIF COALESCE(p_sms_amount, v_payment.amount) >= 2000 THEN
        v_subscription_type := 'standard';
        v_duration_days := 30;
    ELSE
        v_subscription_type := 'basic';
        v_duration_days := 30;
    END IF;
    
    -- Calculer la nouvelle date d'expiration
    SELECT 
        CASE 
            WHEN subscription_expires_at > NOW() THEN 
                subscription_expires_at + (v_duration_days || ' days')::interval
            ELSE 
                NOW() + (v_duration_days || ' days')::interval
        END
    INTO v_new_expires_at
    FROM public.profiles
    WHERE id = v_payment.user_id;
    
    -- Si pas de date trouvée, partir de maintenant
    IF v_new_expires_at IS NULL THEN
        v_new_expires_at := NOW() + (v_duration_days || ' days')::interval;
    END IF;
    
    -- Mettre à jour ou créer le profil
    INSERT INTO public.profiles (
        id, 
        subscription_type, 
        subscription_expires_at,
        updated_at
    ) VALUES (
        v_payment.user_id,
        v_subscription_type,
        v_new_expires_at,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        subscription_type = v_subscription_type,
        subscription_expires_at = v_new_expires_at,
        updated_at = NOW();
    
    RAISE NOTICE '✅ Abonnement mis à jour: % jusqu''au %', v_subscription_type, v_new_expires_at;
    
    -- ============================================
    -- ÉTAPE 4 : RETOURNER LE RÉSULTAT
    -- ============================================
    
    v_result := jsonb_build_object(
        'success', true,
        'payment_id', v_payment.id,
        'user_id', v_payment.user_id,
        'amount', v_payment.amount,
        'tid', v_payment.tid_submitted,
        'operator', 'moov',
        'sim_info', jsonb_build_object(
            'slot', p_sim_slot,
            'number', p_sim_number,
            'timestamp', p_timestamp
        ),
        'subscription', jsonb_build_object(
            'subscriptionType', v_subscription_type,
            'expiresAt', v_new_expires_at,
            'durationDays', v_duration_days
        )
    );
    
    RETURN v_result;
    
EXCEPTION
    -- Gestion spécifique du lock
    WHEN lock_not_available THEN
        RAISE NOTICE '⚠️ Paiement déjà en cours de traitement: %', p_tid;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Payment is already being processed by another request',
            'tid', p_tid
        );
    
    -- Autres erreurs
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erreur lors de la validation: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'tid', p_tid
        );
END;
$$;

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON FUNCTION public.validate_and_confirm_payment IS 
'Valide et confirme un paiement de manière atomique avec protection contre les race conditions.
Utilisée par l''Edge Function validate-transaction pour gérer les 2 SIM Moov.';

-- ============================================
-- GRANT (si nécessaire)
-- ============================================

-- Permettre au service role d'appeler cette fonction
GRANT EXECUTE ON FUNCTION public.validate_and_confirm_payment TO service_role;

-- ============================================
-- TEST DE LA FONCTION
-- ============================================

-- Test 1 : Validation normale
/*
SELECT public.validate_and_confirm_payment(
    'TEST_RPC_001',  -- TID
    1,               -- SIM slot
    '+24177123456',  -- SIM number
    5000,            -- Amount
    NOW()            -- Timestamp
);
*/

-- Test 2 : TID inexistant
/*
SELECT public.validate_and_confirm_payment(
    'INEXISTANT_TID',
    1,
    '+24177123456',
    5000,
    NOW()
);
-- Résultat attendu: {"success": false, "error": "No pending payment found..."}
*/

-- Test 3 : Double validation (race condition)
/*
-- Dans deux fenêtres SQL différentes, exécuter EN MÊME TEMPS:

-- Fenêtre 1:
BEGIN;
SELECT public.validate_and_confirm_payment('TEST_RACE_001', 1, '+2411', 5000, NOW());
COMMIT;

-- Fenêtre 2 (immédiatement après):
BEGIN;
SELECT public.validate_and_confirm_payment('TEST_RACE_001', 2, '+2412', 5000, NOW());
COMMIT;

-- Résultat attendu:
-- Fenêtre 1: success: true
-- Fenêtre 2: success: false, "Payment is already being processed" ou "No pending payment"
*/

-- ============================================
-- FIN DU SCRIPT
-- ============================================

SELECT '✅ Fonction validate_and_confirm_payment créée avec succès' AS message;
