# 🔴 SOLUTION : Erreur 400 sur /discover

## 🐛 PROBLÈME

```
❌ Error fetching data: Object
❌ Failed to load resource: the server responded with a status of 400 ()
❌ Error: uexuecuD8rg6hpFebknt_ user_suggestions:1
```

**Cause :** Les fonctions RPC `get_user_suggestions` et `search_users` tentent d'accéder à la colonne `connections_count` dans la table `profiles`, mais cette colonne n'existe peut-être pas encore dans votre base de données.

---

## ✅ SOLUTION EN 3 ÉTAPES

### ÉTAPE 1 : Exécuter le Script de Correction

**Fichier :** `FIX_COLONNES_PROFILES.sql`

1. **Ouvrez Supabase Dashboard** :
   ```
   https://supabase.com/dashboard/project/VOTRE_PROJET
   ```

2. **Allez dans SQL Editor** :
   - Menu de gauche → 🔧 **SQL Editor**

3. **Copiez TOUT le contenu** de `FIX_COLONNES_PROFILES.sql` :
   - Ouvrez le fichier dans VSCode
   - `Ctrl+A` → `Ctrl+C`

4. **Collez dans SQL Editor** :
   - `Ctrl+V`

5. **Exécutez** :
   - Bouton **RUN** ▶️ (ou `Ctrl+Enter`)

6. **Vérifiez les messages** :
   ```
   ✅ Colonne connections_count ajoutée
   ✅ Colonne profile_views ajoutée
   ...
   ✅✅✅ SUCCÈS COMPLET ! ✅✅✅
   ```

---

### ÉTAPE 2 : Actualiser l'Application

1. **Dans votre navigateur** :
   - Appuyez sur `F5` ou `Ctrl+R`
   - Ou allez sur : `http://localhost:5174/discover`

2. **Ouvrez la Console** :
   - Appuyez sur `F12`
   - Onglet **Console**

3. **Vérifiez** :
   - ❌ Avant : `Error 400` répété
   - ✅ Après : Aucune erreur, ou seulement warnings React

---

### ÉTAPE 3 : Tester les Fonctionnalités

#### Test 1 : Suggestions Personnalisées
1. Allez sur `/discover`
2. Onglet **"Suggestions"**
3. **Résultat attendu :**
   - Liste d'utilisateurs avec badges
   - "Même école", "Même domaine", etc.
   - Bouton "Se connecter" cliquable

#### Test 2 : Nouveaux Utilisateurs
1. Onglet **"Nouveaux"**
2. **Résultat attendu :**
   - Utilisateurs récemment inscrits
   - Triés par date (plus récents en premier)

#### Test 3 : Recherche
1. Tapez un nom dans la barre de recherche (ex: "Marie")
2. **Résultat attendu :**
   - Résultats instantanés
   - Pas d'erreur 400

---

## 🔍 POURQUOI ÇA NE MARCHAIT PAS

### Historique du Problème

1. **Script `SCRIPT_COMMUNAUTE_SOCIALE.sql` exécuté** :
   - Contenait `ALTER TABLE profiles ADD COLUMN connections_count ...`
   - **MAIS** la colonne existait peut-être déjà → erreur "duplicate column"

2. **Script `SCRIPT_COMMUNAUTE_SAFE.sql` exécuté** :
   - **N'ajoutait PAS** les colonnes à `profiles`
   - Créait seulement les tables `connection_requests` et `connections`
   - **Donc** : Les fonctions RPC ne trouvaient pas `connections_count`

3. **Résultat** :
   ```sql
   -- Dans get_user_suggestions :
   SELECT p.connections_count ... -- ❌ Colonne inexistante !
   ```

---

## 📊 COLONNES AJOUTÉES À `profiles`

| Colonne | Type | Défaut | Utilité |
|---------|------|--------|---------|
| `connections_count` | integer | 0 | Nombre d'amis/connexions |
| `profile_views` | integer | 0 | Vues du profil |
| `last_active_at` | timestamptz | now() | Dernière activité |
| `is_online` | boolean | false | En ligne maintenant |
| `year_of_study` | integer | NULL | Année d'étude (L1, M2...) |
| `interests` | text[] | {} | Centres d'intérêt |
| `languages` | text[] | {} | Langues parlées |
| `location` | text | NULL | Ville/Pays |

---

## 🎯 VÉRIFIER QUE TOUT MARCHE

### Checklist Complète

- [ ] **Script SQL exécuté** sans erreur
- [ ] **Message "SUCCÈS COMPLET"** affiché
- [ ] **Page `/discover` se charge** sans erreur console
- [ ] **Onglet "Suggestions"** affiche des utilisateurs
- [ ] **Onglet "Nouveaux"** affiche des utilisateurs
- [ ] **Barre de recherche** fonctionne
- [ ] **Bouton "Se connecter"** est cliquable
- [ ] **Aucune erreur 400** dans la console

---

## 🚨 SI LE PROBLÈME PERSISTE

### Diagnostic Supplémentaire

**Dans Supabase SQL Editor, exécutez :**

```sql
-- Vérifier si la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'connections_count';
```

**Résultat attendu :**
```
column_name         | data_type
--------------------+-----------
connections_count   | integer
```

**Si vide (aucune ligne) :**
- La colonne n'existe toujours pas
- Réexécutez `FIX_COLONNES_PROFILES.sql`
- Vérifiez les erreurs dans les messages Supabase

---

### Vérifier les Fonctions RPC

**Dans Supabase SQL Editor :**

```sql
-- Tester manuellement get_user_suggestions
SELECT * FROM get_user_suggestions(
  'VOTRE_USER_ID_ICI'::uuid,
  10
);
```

**Résultat attendu :**
- Liste d'utilisateurs avec colonnes : `user_id`, `full_name`, `connections_count`, etc.

**Si erreur :**
- Copiez le message d'erreur complet
- C'est probablement une colonne manquante

---

## 📚 FICHIERS DE RÉFÉRENCE

| Fichier | Utilité |
|---------|---------|
| `FIX_COLONNES_PROFILES.sql` | **Script de correction à exécuter** |
| `SCRIPT_COMMUNAUTE_SAFE.sql` | Script original (sans colonnes) |
| `DIAGNOSTIC_COLONNES.sql` | Vérifier colonnes existantes |
| `GUIDE_SYSTEME_COMMUNAUTAIRE.md` | Guide complet du système |

---

## 🎉 APRÈS LA CORRECTION

Une fois le script exécuté avec succès, votre page `/discover` devrait :

✅ Se charger instantanément  
✅ Afficher des suggestions intelligentes  
✅ Montrer les badges (même école, domaine)  
✅ Permettre d'envoyer des demandes de connexion  
✅ Recherche fonctionnelle  
✅ Aucune erreur dans la console  

---

## 💡 ASTUCE POUR L'AVENIR

Pour éviter ce genre de problème :

1. **Toujours vérifier** que les colonnes existent avant d'exécuter des fonctions qui les utilisent
2. **Utiliser `IF NOT EXISTS`** dans les ALTER TABLE
3. **Tester les fonctions RPC** directement dans Supabase après création

---

**Date :** 3 Janvier 2026  
**Statut :** 🔧 En cours de correction  
**Priorité :** 🔴 URGENTE
