-- ============================================================================
-- 🔧 FIX IMMÉDIAT : Vérification et Correction des Colonnes Profiles
-- ============================================================================

-- ÉTAPE 1 : DIAGNOSTIC
-- Copier cette requête pour voir quelles colonnes existent déjà
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
AND column_name IN (
  'last_active_at', 
  'is_online', 
  'profile_views', 
  'connections_count', 
  'year_of_study', 
  'interests', 
  'languages', 
  'location'
)
ORDER BY column_name;

-- ============================================================================
-- ÉTAPE 2 : AJOUT SÉCURISÉ DES COLONNES (si elles n'existent pas)
-- ============================================================================

-- Cette section ajoute SEULEMENT les colonnes manquantes
DO $$ 
BEGIN
  -- last_active_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_active_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_active_at timestamptz DEFAULT now();
    RAISE NOTICE '✅ Colonne last_active_at ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne last_active_at existe déjà';
  END IF;

  -- is_online
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_online'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_online boolean DEFAULT false;
    RAISE NOTICE '✅ Colonne is_online ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne is_online existe déjà';
  END IF;

  -- profile_views
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'profile_views'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_views integer DEFAULT 0;
    RAISE NOTICE '✅ Colonne profile_views ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne profile_views existe déjà';
  END IF;

  -- connections_count (CRUCIAL pour les RPC)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'connections_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN connections_count integer DEFAULT 0;
    RAISE NOTICE '✅ Colonne connections_count ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne connections_count existe déjà';
  END IF;

  -- year_of_study
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'year_of_study'
  ) THEN
    ALTER TABLE profiles ADD COLUMN year_of_study integer;
    RAISE NOTICE '✅ Colonne year_of_study ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne year_of_study existe déjà';
  END IF;

  -- interests
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'interests'
  ) THEN
    ALTER TABLE profiles ADD COLUMN interests text[] DEFAULT '{}';
    RAISE NOTICE '✅ Colonne interests ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne interests existe déjà';
  END IF;

  -- languages
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'languages'
  ) THEN
    ALTER TABLE profiles ADD COLUMN languages text[] DEFAULT '{}';
    RAISE NOTICE '✅ Colonne languages ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne languages existe déjà';
  END IF;

  -- location
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location text;
    RAISE NOTICE '✅ Colonne location ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne location existe déjà';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 3 : CRÉER LES INDEX (seulement si colonnes ajoutées)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_profiles_institution ON profiles(institution);
CREATE INDEX IF NOT EXISTS idx_profiles_study_field ON profiles(study_field);
CREATE INDEX IF NOT EXISTS idx_profiles_connections_count ON profiles(connections_count DESC);

-- ============================================================================
-- ÉTAPE 4 : VÉRIFICATION FINALE
-- ============================================================================

DO $$
DECLARE
  missing_count integer;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM (
    VALUES 
      ('last_active_at'),
      ('is_online'),
      ('profile_views'),
      ('connections_count'),
      ('year_of_study'),
      ('interests'),
      ('languages'),
      ('location')
  ) AS required(col)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = required.col
  );

  IF missing_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅✅✅ SUCCÈS COMPLET ! ✅✅✅';
    RAISE NOTICE 'Toutes les colonnes nécessaires sont présentes !';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 La page /discover devrait maintenant fonctionner !';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Il manque encore % colonne(s)', missing_count;
    RAISE NOTICE 'Relancez ce script ou vérifiez les erreurs ci-dessus.';
  END IF;
END $$;

-- ============================================================================
-- MESSAGE FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Prochaines étapes :';
  RAISE NOTICE '1. Actualisez la page /discover dans le navigateur';
  RAISE NOTICE '2. Vérifiez la console (F12) - plus d''erreur 400 !';
  RAISE NOTICE '3. Les suggestions devraient s''afficher';
  RAISE NOTICE '================================================';
END $$;
