-- ============================================
-- Ajout de la période d'essai gratuite (5 jours)
-- Date: 6 janvier 2025
-- ============================================

-- 1. Ajouter la colonne trial_expires_at à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Fonction pour initialiser l'essai gratuit lors de l'inscription
CREATE OR REPLACE FUNCTION public.init_trial_period()
RETURNS TRIGGER AS $$
BEGIN
    -- Définir l'essai gratuit à 5 jours à partir de maintenant
    NEW.trial_expires_at := NOW() + INTERVAL '5 days';
    
    -- Initialiser le type d'abonnement
    IF NEW.subscription_type IS NULL THEN
        NEW.subscription_type := 'trial';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer le trigger pour l'initialisation automatique
DROP TRIGGER IF EXISTS init_trial_on_signup ON public.profiles;

CREATE TRIGGER init_trial_on_signup
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    WHEN (NEW.trial_expires_at IS NULL)
    EXECUTE FUNCTION public.init_trial_period();

-- 4. Initialiser l'essai pour les utilisateurs existants (s'ils n'ont pas d'abonnement)
UPDATE public.profiles
SET 
    trial_expires_at = NOW() + INTERVAL '5 days',
    subscription_type = COALESCE(subscription_type, 'trial')
WHERE trial_expires_at IS NULL
  AND (subscription_expires_at IS NULL OR subscription_expires_at < NOW());

-- 5. Fonction pour vérifier si un utilisateur a accès à l'application
CREATE OR REPLACE FUNCTION public.has_app_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    profile_record RECORD;
BEGIN
    SELECT 
        trial_expires_at,
        subscription_expires_at
    INTO profile_record
    FROM public.profiles
    WHERE id = user_id;
    
    IF NOT FOUND THEN
        -- Utilisateur sans profil = pas d'accès
        RETURN FALSE;
    END IF;
    
    -- Vérifier si l'essai est encore valide
    IF profile_record.trial_expires_at IS NOT NULL 
       AND profile_record.trial_expires_at > NOW() THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier si l'abonnement est encore valide
    IF profile_record.subscription_expires_at IS NOT NULL 
       AND profile_record.subscription_expires_at > NOW() THEN
        RETURN TRUE;
    END IF;
    
    -- Sinon, pas d'accès
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Vue pour les statistiques d'abonnements
CREATE OR REPLACE VIEW public.subscription_stats AS
SELECT 
    COUNT(*) FILTER (
        WHERE trial_expires_at > NOW() 
        AND (subscription_expires_at IS NULL OR subscription_expires_at < NOW())
    ) as active_trials,
    
    COUNT(*) FILTER (
        WHERE subscription_expires_at > NOW()
    ) as active_subscriptions,
    
    COUNT(*) FILTER (
        WHERE (trial_expires_at IS NULL OR trial_expires_at < NOW())
        AND (subscription_expires_at IS NULL OR subscription_expires_at < NOW())
    ) as expired_users,
    
    COUNT(*) as total_users
FROM public.profiles;

-- 7. Commentaires
COMMENT ON COLUMN public.profiles.trial_expires_at IS 'Date d''expiration de la période d''essai gratuite (5 jours)';
COMMENT ON FUNCTION public.has_app_access IS 'Vérifie si un utilisateur a accès à l''application (essai ou abonnement valide)';
COMMENT ON VIEW public.subscription_stats IS 'Statistiques sur les essais et abonnements actifs';

-- 8. Vérification
SELECT 
    'Migration terminée!' as message,
    (SELECT COUNT(*) FROM public.profiles WHERE trial_expires_at IS NOT NULL) as users_with_trial;
