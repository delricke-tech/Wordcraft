/*
  # FIX: Ajouter la colonne actor_id à la table notifications
  
  PROBLÈME:
  - La table notifications existe sans la colonne actor_id
  - Le code essaie d'insérer des notifications avec actor_id
  - Résultat: Erreur SQL '42703' column "actor_id" does not exist
  
  SOLUTION:
  - Ajouter la colonne actor_id si elle n'existe pas déjà
  - Créer un index pour les performances
*/

-- Ajouter la colonne actor_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'actor_id'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN actor_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Colonne actor_id ajoutée à la table notifications';
  ELSE
    RAISE NOTICE 'Colonne actor_id existe déjà dans la table notifications';
  END IF;
END $$;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_notifications_actor 
ON notifications(actor_id) 
WHERE actor_id IS NOT NULL;

-- Vérification finale
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'actor_id'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: La colonne actor_id existe maintenant';
  ELSE
    RAISE EXCEPTION '❌ ERREUR: La colonne actor_id n''a pas été créée';
  END IF;
END $$;
