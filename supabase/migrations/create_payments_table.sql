-- ============================================
-- Table PAYMENTS pour WordCraft
-- Gestion des paiements mobile (Airtel/Moov)
-- Date: 5 janvier 2025
-- ============================================

-- 1. Créer la table payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    tid_submitted TEXT NOT NULL UNIQUE,
    operator TEXT NOT NULL CHECK (operator IN ('airtel', 'moov')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées additionnelles (optionnel mais utile)
    phone_number TEXT,
    reference TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Créer les indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_operator ON public.payments(operator);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_tid_submitted ON public.payments(tid_submitted);

-- 3. Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Activer Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 5. Créer les policies RLS

-- Policy: Les utilisateurs peuvent voir leurs propres paiements
CREATE POLICY "Users can view their own payments"
    ON public.payments
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent créer leurs propres paiements
CREATE POLICY "Users can create their own payments"
    ON public.payments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres paiements (seulement si status = 'pending')
CREATE POLICY "Users can update their pending payments"
    ON public.payments
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs ne peuvent pas supprimer leurs paiements
-- (Optionnel: décommenter si vous voulez autoriser la suppression)
-- CREATE POLICY "Users cannot delete payments"
--     ON public.payments
--     FOR DELETE
--     USING (false);

-- 6. Créer une vue pour les statistiques de paiements (optionnel)
CREATE OR REPLACE VIEW public.payment_stats AS
SELECT 
    user_id,
    COUNT(*) as total_payments,
    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_payments,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
    SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as total_amount_confirmed,
    SUM(amount) as total_amount_all
FROM public.payments
GROUP BY user_id;

-- 7. Créer une fonction pour valider le TID (optionnel)
CREATE OR REPLACE FUNCTION public.validate_tid_format(tid TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Exemple: TID doit avoir au moins 10 caractères alphanumériques
    RETURN tid ~ '^[A-Za-z0-9]{10,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. Ajouter une contrainte de validation du TID (optionnel)
-- ALTER TABLE public.payments 
-- ADD CONSTRAINT check_tid_format 
-- CHECK (validate_tid_format(tid_submitted));

-- 9. Créer une fonction pour confirmer un paiement
CREATE OR REPLACE FUNCTION public.confirm_payment(payment_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.payments
    SET 
        status = 'confirmed',
        confirmed_at = TIMEZONE('utc', NOW())
    WHERE id = payment_id AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Créer une fonction pour échouer un paiement
CREATE OR REPLACE FUNCTION public.fail_payment(payment_id UUID, error_msg TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
    UPDATE public.payments
    SET 
        status = 'failed',
        error_message = error_msg
    WHERE id = payment_id AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Commentaires sur la table et les colonnes
COMMENT ON TABLE public.payments IS 'Table des paiements mobile money (Airtel/Moov) pour WordCraft';
COMMENT ON COLUMN public.payments.id IS 'Identifiant unique du paiement';
COMMENT ON COLUMN public.payments.user_id IS 'Référence vers l''utilisateur qui effectue le paiement';
COMMENT ON COLUMN public.payments.amount IS 'Montant du paiement (max 99999999.99)';
COMMENT ON COLUMN public.payments.tid_submitted IS 'Code TID soumis par l''utilisateur (unique)';
COMMENT ON COLUMN public.payments.operator IS 'Opérateur mobile: airtel ou moov';
COMMENT ON COLUMN public.payments.status IS 'Statut: pending, confirmed, failed, cancelled';
COMMENT ON COLUMN public.payments.created_at IS 'Date de création du paiement';
COMMENT ON COLUMN public.payments.updated_at IS 'Date de dernière modification';
COMMENT ON COLUMN public.payments.confirmed_at IS 'Date de confirmation du paiement';

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Pour tester la table après création:
-- SELECT * FROM public.payments;
-- SELECT * FROM public.payment_stats;
