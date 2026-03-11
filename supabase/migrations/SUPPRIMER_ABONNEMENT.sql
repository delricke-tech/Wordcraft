-- ============================================
-- SUPPRESSION DU SYSTÈME D'ABONNEMENT
-- Date: 7 janvier 2025
-- ============================================

-- 1. Supprimer les triggers
DROP TRIGGER IF EXISTS init_trial_on_signup ON public.profiles;

-- 2. Supprimer les fonctions
DROP FUNCTION IF EXISTS public.init_trial_period();
DROP FUNCTION IF EXISTS public.has_app_access(UUID);

-- 3. Supprimer les colonnes d'abonnement de la table profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS trial_expires_at;

-- 4. Message de confirmation
SELECT 'Système d''abonnement supprimé avec succès!' as message;

-- NOTE: Les colonnes subscription_type et subscription_expires_at sont conservées
-- car elles peuvent être utilisées par d'autres parties de l'application.
-- Si vous voulez aussi les supprimer, décommentez les lignes suivantes:

-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_type;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_expires_at;
