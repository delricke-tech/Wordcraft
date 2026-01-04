-- ============================================================================
-- 🎥 AJOUT DE LA COLONNE DAILY_ROOM_URL POUR LA VIDÉO
-- ============================================================================

-- Ajouter la colonne pour stocker l'URL de la salle Daily.co
ALTER TABLE study_sessions 
ADD COLUMN IF NOT EXISTS daily_room_url text;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_study_sessions_daily_url ON study_sessions(daily_room_url) 
WHERE daily_room_url IS NOT NULL;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Colonne daily_room_url ajoutée !';
  RAISE NOTICE '';
  RAISE NOTICE '🎥 Prochaines étapes :';
  RAISE NOTICE '   1. Créer compte Daily.co : https://dashboard.daily.co/signup';
  RAISE NOTICE '   2. Récupérer clé API';
  RAISE NOTICE '   3. Installer packages : npm install @daily-co/daily-js';
  RAISE NOTICE '   4. Ajouter VITE_DAILY_API_KEY dans .env';
  RAISE NOTICE '';
END $$;
