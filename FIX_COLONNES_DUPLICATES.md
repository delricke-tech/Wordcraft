# 🔧 CORRECTION ERREUR "column specified more than once"

## ❌ PROBLÈME RENCONTRÉ

```
ERROR: 42701: column "profile_views" specified more than once
```

**Cause :** La colonne `profile_views` (ou autres) existe déjà dans la table `profiles`.

---

## ✅ SOLUTION APPLIQUÉE

Le script `SCRIPT_COMMUNAUTE_SOCIALE.sql` a été corrigé pour **gérer les colonnes existantes**.

### Ancien Code (Problématique)
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_views integer DEFAULT 0;
-- "IF NOT EXISTS" ne fonctionne pas toujours correctement
```

### Nouveau Code (Solution)
```sql
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE profiles ADD COLUMN profile_views integer DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN 
    NULL;  -- Ignore si la colonne existe déjà
  END;
END $$;
```

---

## 🚀 MARCHE À SUIVRE

### Option 1 : Réexécuter le Script Corrigé

1. **Ouvrez** : `SCRIPT_COMMUNAUTE_SOCIALE.sql` (déjà corrigé)
2. **Copiez TOUT** le contenu
3. **Collez** dans Supabase SQL Editor
4. **RUN** ▶️
5. Le script va maintenant **ignorer les colonnes existantes** et continuer

---

### Option 2 : Nettoyer et Recommencer

Si vous voulez repartir de zéro :

```sql
-- 1. Supprimer les colonnes ajoutées
ALTER TABLE profiles DROP COLUMN IF EXISTS last_active_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS is_online;
ALTER TABLE profiles DROP COLUMN IF EXISTS profile_views;
ALTER TABLE profiles DROP COLUMN IF EXISTS connections_count;
ALTER TABLE profiles DROP COLUMN IF EXISTS year_of_study;
ALTER TABLE profiles DROP COLUMN IF EXISTS interests;
ALTER TABLE profiles DROP COLUMN IF EXISTS languages;
ALTER TABLE profiles DROP COLUMN IF EXISTS location;

-- 2. Supprimer les tables créées
DROP TABLE IF EXISTS connection_requests CASCADE;
DROP TABLE IF EXISTS connections CASCADE;

-- 3. Réexécuter le script corrigé
```

---

### Option 3 : Vérifier et Continuer

Si certaines colonnes existent déjà, vérifiez :

```sql
-- Voir toutes les colonnes de profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY column_name;
```

Puis exécutez uniquement les parties manquantes du script.

---

## 🎯 VÉRIFICATION APRÈS EXÉCUTION

### Test 1 : Colonnes Ajoutées
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN (
  'last_active_at', 
  'is_online', 
  'profile_views', 
  'connections_count'
);
```

**Résultat attendu :** 4 lignes (les 4 colonnes)

### Test 2 : Tables Créées
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('connection_requests', 'connections');
```

**Résultat attendu :** 2 lignes

### Test 3 : Fonctions Créées
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'get_user_suggestions',
  'search_users',
  'accept_connection_request'
);
```

**Résultat attendu :** 3 lignes

---

## 📝 NOTES IMPORTANTES

### Colonnes Existantes
Si vous voyez l'erreur "column already exists", c'est **NORMAL** maintenant. Le script va :
- ✅ Ignorer les colonnes existantes
- ✅ Créer uniquement les manquantes
- ✅ Continuer sans erreur

### Sécurité des Données
Le nouveau script **ne supprime AUCUNE donnée**. Il ajoute uniquement ce qui manque.

---

## 🆘 SI ÇA NE MARCHE TOUJOURS PAS

### Erreur : "relation already exists"
```sql
-- Supprimer les tables problématiques
DROP TABLE IF EXISTS connection_requests CASCADE;
DROP TABLE IF EXISTS connections CASCADE;

-- Réexécuter le script
```

### Erreur : "function already exists"
```sql
-- Les fonctions utilisent CREATE OR REPLACE
-- Pas besoin de les supprimer, elles seront remplacées
```

### Erreur : "syntax error"
Vérifiez que vous avez copié **TOUT le script** y compris :
- Les `DO $$` blocks
- Les `END $$;`
- Les points-virgules `;`

---

## ✅ RÉSULTAT FINAL

Après avoir réexécuté le script corrigé, vous devriez voir :

```
✅ Système communautaire installé avec succès !

📋 Éléments créés :
   - Table connection_requests (demandes de connexion)
   - Table connections (connexions actives)
   - Fonctions : accept_connection_request, reject_connection_request
   - Fonction : get_user_suggestions (suggestions personnalisées)
   - Fonction : get_community_feed (feed communautaire)
   - Fonction : search_users (recherche utilisateurs)
   - Vues : new_users, recently_active_users, popular_users
   - Notifications automatiques pour connexions
```

**Pas d'erreur = Succès ! 🎉**

---

**Date :** 3 Janvier 2026  
**Fix Version :** 1.1 - Gestion des colonnes duplicates
