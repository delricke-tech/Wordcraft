-- ============================================
-- Script de Test : Workflow Complet de Paiement
-- Date: 6 janvier 2025
-- ============================================

-- 1. Créer un paiement de test
-- ⚠️ REMPLACEZ 'votre-user-id' par votre vrai UUID utilisateur

DO $$
DECLARE
    test_user_id UUID;
    test_payment_id UUID;
BEGIN
    -- Option A : Récupérer le premier utilisateur existant
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    -- Option B : Si vous connaissez votre UUID, décommentez et remplacez :
    -- test_user_id := 'votre-uuid-utilisateur-ici';
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'Aucun utilisateur trouvé. Créez un compte d''abord.';
    END IF;
    
    RAISE NOTICE '👤 Utilisateur de test: %', test_user_id;
    
    -- Créer un paiement de test avec un TID simple
    INSERT INTO public.payments (
        user_id,
        amount,
        tid_submitted,
        operator,
        status,
        phone_number
    ) VALUES (
        test_user_id,
        5000,                  -- 5000 FCFA = abonnement premium 30 jours
        '123456789',           -- TID de test (IMPORTANT: notez-le!)
        'moov',
        'pending',
        '+24177000001'
    ) RETURNING id INTO test_payment_id;
    
    RAISE NOTICE '✅ Paiement de test créé!';
    RAISE NOTICE '💰 Payment ID: %', test_payment_id;
    RAISE NOTICE '🔢 TID à utiliser: 123456789';
    RAISE NOTICE '💵 Montant: 5000 FCFA';
    RAISE NOTICE '';
    RAISE NOTICE '📱 PROCHAINE ÉTAPE:';
    RAISE NOTICE 'Envoyez un SMS de test contenant: "Ref: 123456789"';
    
END $$;

-- 2. Vérifier le paiement créé
SELECT 
    id,
    user_id,
    amount,
    tid_submitted,
    operator,
    status,
    created_at
FROM public.payments
WHERE tid_submitted = '123456789';

-- 3. Fonction helper pour vérifier l'état du paiement
CREATE OR REPLACE FUNCTION check_test_payment()
RETURNS TABLE (
    payment_status TEXT,
    tid TEXT,
    amount NUMERIC,
    created_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    subscription_type TEXT,
    subscription_expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.status,
        p.tid_submitted,
        p.amount,
        p.created_at,
        p.confirmed_at,
        pr.subscription_type,
        pr.subscription_expires_at
    FROM public.payments p
    LEFT JOIN public.profiles pr ON pr.id = p.user_id
    WHERE p.tid_submitted = '123456789';
END;
$$ LANGUAGE plpgsql;

-- Appeler la fonction
SELECT * FROM check_test_payment();
