# 🚨 INSTALLATION SUPABASE - ACTION IMMÉDIATE REQUISE

## ⚠️ PROBLÈME ACTUEL

**Vous avez une MAQUETTE, pas une application fonctionnelle !**

Sans ces scripts SQL, voici ce qui **NE FONCTIONNE PAS** :

❌ Les posts ne se créent pas (table `posts` inexistante)
❌ Les likes ne comptent pas (triggers manquants)
❌ Les partages ne marchent pas (compteurs absents)
❌ Les groupes ne comptent pas les membres (fonctions RPC manquantes)
❌ Le chat ne s'affiche pas (table `chat_messages` peut-être mal configurée)

---

## 🎯 SOLUTION EN 3 ÉTAPES

### ÉTAPE 1 : Ouvrir Supabase Dashboard

1. Allez sur : **https://supabase.com/dashboard**
2. Connectez-vous
3. Sélectionnez votre projet **WordCraft**
4. Dans le menu de gauche, cliquez sur **"SQL Editor"**

---

### ÉTAPE 2 : Exécuter le Script Complet

Je vais créer **UN SEUL SCRIPT** qui contient **TOUT**.

#### 📋 Copier-Coller ce script dans SQL Editor :

Ouvrez le fichier `SCRIPT_COMPLET_SUPABASE.sql` (voir ci-dessous)

1. **Copiez TOUT le contenu** du script
2. **Collez** dans SQL Editor
3. Cliquez sur **"RUN"** (▶️ en bas à droite)
4. Attendez la confirmation ✅

---

### ÉTAPE 3 : Vérifier que ça marche

Après avoir exécuté le script, testez ces requêtes dans SQL Editor :

#### Test 1 : Vérifier que la table posts existe
```sql
SELECT COUNT(*) FROM posts;
```
**Résultat attendu :** `0` (table vide mais elle existe)

#### Test 2 : Vérifier les fonctions RPC
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%group%';
```
**Résultat attendu :** Vous devez voir :
- `increment_group_members`
- `decrement_group_members`
- `add_owner_as_member`
- Et d'autres fonctions

#### Test 3 : Vérifier les triggers
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```
**Résultat attendu :** Plusieurs triggers sur `posts`, `likes`, `comments`, `group_members`

---

## 🔥 SI VOUS VOYEZ DES ERREURS

### Erreur : "relation already exists"

C'est **NORMAL** si vous avez déjà exécuté certains scripts.

**Solution :** Le script utilise `CREATE TABLE IF NOT EXISTS` et `CREATE OR REPLACE FUNCTION`, donc il est **safe** de le réexécuter.

### Erreur : "table does not exist" dans les triggers

**Solution :** Vérifiez que les tables de base existent :
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Si `profiles`, `groups`, `group_members` n'existent pas, **exécutez d'abord** :
`supabase/migrations/00_complete_schema.sql`

---

## 📦 ORDRE D'EXÉCUTION CORRECT

Si vous partez de zéro :

### 1️⃣ SCHÉMA DE BASE (SI PAS DÉJÀ FAIT)
```
Fichier : supabase/migrations/00_complete_schema.sql
```
**Crée :** profiles, groups, documents, folders, etc.

### 2️⃣ FONCTIONS GROUPES
```
Fichier : supabase/migrations/20260102_groups_functions.sql
```
**Crée :** increment_group_members, triggers

### 3️⃣ SYSTÈME SOCIAL
```
Fichier : supabase/migrations/20260102_social_system.sql
```
**Crée :** table posts, likes, comments, follows, triggers compteurs

---

## 🎯 SCRIPT CONSOLIDÉ CI-DESSOUS

Pour éviter toute confusion, j'ai créé **UN SEUL FICHIER** qui contient tout :

`SCRIPT_COMPLET_SUPABASE.sql`

**Ce script fait TOUT en une fois :**
- ✅ Fonctions RPC pour les groupes
- ✅ Table posts complète
- ✅ Triggers pour les compteurs
- ✅ Politiques RLS
- ✅ Vue posts_with_profiles

---

## ⚡ APRÈS L'EXÉCUTION

### Redémarrez votre application :

1. **Arrêtez le serveur** (Ctrl+C dans le terminal)
2. **Relancez** :
   ```bash
   npm run dev
   ```
3. **Testez** :
   ```
   http://localhost:5174/feed
   ```

### Ce qui devrait maintenant marcher :

✅ Créer un post → Il s'enregistre vraiment en base
✅ Liker un post → Le compteur augmente en temps réel
✅ Partager un post → Le compteur de partages augmente
✅ Rejoindre un groupe → Le compteur de membres augmente
✅ Chatter dans un groupe → Les messages s'affichent en temps réel
✅ Real-time updates → Les nouveaux posts/messages apparaissent instantanément

---

## 🆘 EN CAS DE PROBLÈME

### Option 1 : Tout réinitialiser

**⚠️ ATTENTION : Cela supprime TOUTES les données**

```sql
-- Supprimer les tables sociales
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS follows CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS increment_group_members CASCADE;
DROP FUNCTION IF EXISTS decrement_group_members CASCADE;
DROP FUNCTION IF EXISTS increment_post_like_count CASCADE;
DROP FUNCTION IF EXISTS decrement_post_like_count CASCADE;
DROP FUNCTION IF EXISTS increment_post_comment_count CASCADE;
DROP FUNCTION IF EXISTS decrement_post_comment_count CASCADE;

-- Puis réexécuter le script complet
```

### Option 2 : Support Discord

Si rien ne marche, partagez :
1. Les erreurs dans SQL Editor
2. Le résultat de : `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
3. Le résultat de : `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';`

---

## 📝 CHECKLIST FINALE

Avant de dire "ça marche" :

- [ ] Script SQL exécuté dans Supabase
- [ ] Aucune erreur dans SQL Editor
- [ ] Table `posts` existe (test 1 passe)
- [ ] Fonctions RPC existent (test 2 passe)
- [ ] Triggers créés (test 3 passe)
- [ ] Application redémarrée
- [ ] Post créé avec succès dans `/feed`
- [ ] Like fonctionne et compteur augmente
- [ ] Partage fonctionne
- [ ] Groupe créé et membre_count = 1

---

## 🎉 RÉSULTAT ATTENDU

**AVANT (maquette) :**
- Vous cliquez → Rien ne se passe vraiment
- Les données ne persistent pas
- Pas de temps réel
- Erreurs dans la console : "relation does not exist"

**APRÈS (application réelle) :**
- Vous cliquez → Action instantanée
- Les données sont sauvegardées
- Updates en temps réel
- Console propre ✅

---

**Date :** 2 Janvier 2026  
**Priorité :** 🚨 CRITIQUE - À FAIRE MAINTENANT
