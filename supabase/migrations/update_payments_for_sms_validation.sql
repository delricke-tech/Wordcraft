-- ============================================
-- Mise à jour de la table payments
-- pour le système de validation automatique
-- Date: 5 janvier 2025
-- ============================================

-- Ajouter la colonne confirmed_at pour tracker quand le paiement a été confirmé
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone;

-- Ajouter la colonne metadata pour stocker des informations supplémentaires (JSON)
-- Exemple: montant extrait du SMS, informations de debug, etc.
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- ============================================
-- CONTRAINTE UNIQUE sur tid_submitted
-- ============================================

-- S'assurer que la contrainte UNIQUE existe sur tid_submitted
-- (normalement créée lors de la création initiale de la table)
DO $$ 
BEGIN
    -- Vérifier si la contrainte UNIQUE existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'payments' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%tid_submitted%'
    ) THEN
        -- Ajouter la contrainte UNIQUE si elle n'existe pas
        ALTER TABLE public.payments 
        ADD CONSTRAINT payments_tid_submitted_unique UNIQUE (tid_submitted);
        
        RAISE NOTICE '✅ Contrainte UNIQUE ajoutée sur tid_submitted';
    ELSE
        RAISE NOTICE '✅ Contrainte UNIQUE sur tid_submitted déjà présente';
    END IF;
END $$;

-- Ajouter un index sur le TID pour des recherches rapides
-- (Un index UNIQUE sera automatiquement créé par la contrainte UNIQUE ci-dessus)
CREATE INDEX IF NOT EXISTS idx_payments_tid_submitted 
ON public.payments(tid_submitted);

-- Ajouter un index sur le statut pour des recherches rapides
CREATE INDEX IF NOT EXISTS idx_payments_status 
ON public.payments(status);

-- Ajouter un index composite sur (tid_submitted, status) pour optimiser la recherche dans validate-transaction
CREATE INDEX IF NOT EXISTS idx_payments_tid_status 
ON public.payments(tid_submitted, status);

-- ============================================
-- CONTRAINTES CHECK mises à jour
-- ============================================

-- Modifier le CHECK constraint sur operator pour Moov uniquement
DO $$ 
BEGIN
    -- Supprimer l'ancien constraint sur operator si il existe
    ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_operator_check;
    
    -- Ajouter le nouveau constraint (Moov uniquement)
    ALTER TABLE public.payments 
    ADD CONSTRAINT payments_operator_check 
    CHECK (operator = 'moov');
    
    RAISE NOTICE '✅ Constraint operator mis à jour (Moov uniquement)';
END $$;

-- Modifier le CHECK constraint pour inclure 'confirmed' comme statut valide
DO $$ 
BEGIN
    -- Supprimer l'ancien constraint si il existe
    ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
    
    -- Ajouter le nouveau constraint avec les statuts mis à jour
    ALTER TABLE public.payments 
    ADD CONSTRAINT payments_status_check 
    CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled'));
    
    RAISE NOTICE '✅ Constraint status mis à jour';
END $$;

-- ============================================
-- Fonction Helper: Chercher un paiement par TID
-- ============================================

CREATE OR REPLACE FUNCTION find_pending_payment_by_tid(tid_value text)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    amount numeric,
    tid_submitted text,
    operator text,
    status text,
    created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.amount,
        p.tid_submitted,
        p.operator,
        p.status,
        p.created_at
    FROM public.payments p
    WHERE p.tid_submitted = tid_value
      AND p.status = 'pending'
    LIMIT 1;
END;
$$;

-- ============================================
-- Fonction Helper: Confirmer un paiement
-- ============================================

CREATE OR REPLACE FUNCTION confirm_payment(
    payment_id uuid,
    sms_amount numeric DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payment_exists boolean;
BEGIN
    -- Vérifier que le paiement existe et est en attente
    SELECT EXISTS(
        SELECT 1 FROM public.payments 
        WHERE id = payment_id AND status = 'pending'
    ) INTO payment_exists;
    
    IF NOT payment_exists THEN
        RAISE EXCEPTION 'Payment not found or not in pending status';
    END IF;
    
    -- Mettre à jour le paiement
    UPDATE public.payments
    SET 
        status = 'confirmed',
        confirmed_at = NOW(),
        metadata = CASE 
            WHEN sms_amount IS NOT NULL THEN 
                jsonb_build_object('sms_amount', sms_amount, 'confirmed_by', 'sms_validation')
            ELSE 
                jsonb_build_object('confirmed_by', 'sms_validation')
        END
    WHERE id = payment_id;
    
    RETURN TRUE;
END;
$$;

-- ============================================
-- Fonction Helper: Mettre à jour l'abonnement
-- ============================================

CREATE OR REPLACE FUNCTION update_user_subscription_from_payment(
    p_user_id uuid,
    p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subscription_type text;
    duration_days integer;
    new_expires_at timestamp with time zone;
    result jsonb;
BEGIN
    -- Déterminer le type d'abonnement selon le montant
    IF p_amount >= 10000 THEN
        subscription_type := 'premium';
        duration_days := 365; -- 1 an
    ELSIF p_amount >= 5000 THEN
        subscription_type := 'premium';
        duration_days := 30; -- 1 mois
    ELSIF p_amount >= 2000 THEN
        subscription_type := 'standard';
        duration_days := 30;
    ELSE
        subscription_type := 'basic';
        duration_days := 30;
    END IF;
    
    -- Calculer la nouvelle date d'expiration
    -- Si l'utilisateur a déjà un abonnement actif, on prolonge
    -- Sinon on part de maintenant
    SELECT 
        CASE 
            WHEN subscription_expires_at > NOW() THEN 
                subscription_expires_at + (duration_days || ' days')::interval
            ELSE 
                NOW() + (duration_days || ' days')::interval
        END
    INTO new_expires_at
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Si l'utilisateur n'existe pas encore dans profiles, utiliser NOW()
    IF new_expires_at IS NULL THEN
        new_expires_at := NOW() + (duration_days || ' days')::interval;
    END IF;
    
    -- Mettre à jour le profil
    UPDATE public.profiles
    SET 
        subscription_type = update_user_subscription_from_payment.subscription_type,
        subscription_expires_at = new_expires_at,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Si le profil n'existe pas, le créer
    IF NOT FOUND THEN
        INSERT INTO public.profiles (
            id, 
            subscription_type, 
            subscription_expires_at,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            update_user_subscription_from_payment.subscription_type,
            new_expires_at,
            NOW(),
            NOW()
        );
    END IF;
    
    -- Retourner les informations
    result := jsonb_build_object(
        'subscription_type', subscription_type,
        'expires_at', new_expires_at,
        'duration_days', duration_days
    );
    
    RETURN result;
END;
$$;

-- ============================================
-- Vue: Statistiques des paiements
-- ============================================

CREATE OR REPLACE VIEW payment_stats AS
SELECT 
    status,
    operator,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    MIN(created_at) as first_payment,
    MAX(created_at) as last_payment
FROM public.payments
GROUP BY status, operator;

-- ============================================
-- Commentaires
-- ============================================

COMMENT ON COLUMN public.payments.confirmed_at IS 'Date et heure de confirmation du paiement via SMS';
COMMENT ON COLUMN public.payments.metadata IS 'Données JSON supplémentaires (montant SMS, infos debug, etc.)';
COMMENT ON FUNCTION find_pending_payment_by_tid IS 'Cherche un paiement en attente par TID';
COMMENT ON FUNCTION confirm_payment IS 'Confirme un paiement et enregistre les métadonnées';
COMMENT ON FUNCTION update_user_subscription_from_payment IS 'Met à jour l\'abonnement utilisateur selon le montant payé';

-- ============================================
-- Vérification
-- ============================================

-- Afficher la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- Afficher les index
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'payments';

-- ============================================
-- Données de test (optionnel)
-- ============================================

-- Décommenter pour insérer des paiements de test

/*
-- Créer un utilisateur de test si nécessaire
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Récupérer ou créer un utilisateur de test
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Aucun utilisateur trouvé. Créez un utilisateur via Supabase Auth d''abord.';
    ELSE
        -- Insérer des paiements de test
        INSERT INTO public.payments (user_id, amount, tid_submitted, operator, status)
        VALUES 
            (test_user_id, 5000, 'TEST_AIRTEL_001', 'airtel', 'pending'),
            (test_user_id, 3000, 'TEST_MOOV_001', 'moov', 'pending'),
            (test_user_id, 10000, 'TEST_AIRTEL_002', 'airtel', 'confirmed');
        
        RAISE NOTICE 'Paiements de test insérés avec succès';
    END IF;
END $$;
*/

-- ============================================
-- Résumé
-- ============================================

SELECT 
    '✅ Table payments mise à jour avec succès!' as message,
    (SELECT COUNT(*) FROM public.payments) as total_payments,
    (SELECT COUNT(*) FROM public.payments WHERE status = 'pending') as pending_payments,
    (SELECT COUNT(*) FROM public.payments WHERE status = 'confirmed') as confirmed_payments;
