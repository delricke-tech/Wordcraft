# 📸 GUIDE VISUEL - Exécuter le Script Supabase

## 🎯 OBJECTIF

Transformer votre **maquette** en **application réelle** en 5 minutes.

---

## 📋 ÉTAPE PAR ÉTAPE AVEC CAPTURES

### ÉTAPE 1️⃣ : Ouvrir Supabase Dashboard

1. **Allez sur** : https://supabase.com/dashboard
2. **Connectez-vous** avec votre compte
3. **Sélectionnez votre projet** (probablement nommé "WordCraft" ou similaire)

```
🌐 URL de votre dashboard : https://supabase.com/dashboard/project/[VOTRE-PROJECT-ID]
```

---

### ÉTAPE 2️⃣ : Ouvrir SQL Editor

1. Dans le **menu latéral gauche**, cherchez l'icône **SQL Editor** 🗃️
2. Cliquez dessus
3. Vous arrivez sur une page avec un **grand éditeur de texte**

```
Navigation : Dashboard > SQL Editor
```

---

### ÉTAPE 3️⃣ : Créer une Nouvelle Requête

1. Cliquez sur le bouton **"+ New query"** (en haut à gauche)
2. Une nouvelle fenêtre d'éditeur s'ouvre

```
Ou utilisez le raccourci : Ctrl+K puis tapez "new query"
```

---

### ÉTAPE 4️⃣ : Copier le Script

1. **Ouvrez le fichier** : `SCRIPT_COMPLET_SUPABASE.sql`
2. **Sélectionnez TOUT le contenu** (Ctrl+A)
3. **Copiez** (Ctrl+C)

```
📁 Fichier : C:\Users\HP I5\Downloads\project\SCRIPT_COMPLET_SUPABASE.sql
📏 Taille : ~300 lignes
⏱️ Temps d'exécution : 2-5 secondes
```

---

### ÉTAPE 5️⃣ : Coller et Exécuter

1. **Collez le script** dans l'éditeur SQL (Ctrl+V)
2. **Cliquez sur le bouton RUN** (▶️) en bas à droite
   - Ou utilisez le raccourci : **Ctrl+Enter**
3. **Attendez** que la barre de chargement disparaisse

```
💡 Astuce : Le bouton RUN devient vert quand c'est prêt
```

---

### ÉTAPE 6️⃣ : Vérifier le Succès

#### ✅ Signes de Succès

Vous devriez voir dans la console en bas :

```
✅ Script complet exécuté avec succès !
📋 Tables créées : posts
⚙️ Fonctions créées : increment_group_members, decrement_group_members, add_owner_as_member
🔧 Triggers créés : Compteurs automatiques pour groups, posts, likes, comments
🔒 Politiques RLS activées sur posts
👁️ Vue créée : posts_with_profiles

🎉 Votre application est maintenant FONCTIONNELLE !
```

#### ❌ Si Vous Voyez des Erreurs

**Erreur courante 1 :** `relation "profiles" does not exist`

**Solution :**
```sql
-- Exécutez d'abord ce script :
-- supabase/migrations/00_complete_schema.sql
-- Puis réessayez le script complet
```

**Erreur courante 2 :** `relation "posts" already exists`

**Pas grave !** Cela signifie que la table existe déjà. Le script est **idempotent** (safe à réexécuter).

**Erreur courante 3 :** `permission denied`

**Solution :** Assurez-vous d'être connecté comme **propriétaire** du projet.

---

### ÉTAPE 7️⃣ : Vérification Rapide

Exécutez ces 3 tests dans une **nouvelle requête** :

#### Test 1 : Table posts existe ?
```sql
SELECT COUNT(*) FROM posts;
```
**Attendu :** `0` (ou le nombre de posts si vous en avez déjà)

#### Test 2 : Fonctions RPC existent ?
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%group%'
ORDER BY routine_name;
```
**Attendu :** Vous devez voir au moins :
- `add_owner_as_member`
- `decrement_group_members`
- `increment_group_members`

#### Test 3 : Triggers actifs ?
```sql
SELECT COUNT(*) 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```
**Attendu :** Au moins **8 triggers**

---

### ÉTAPE 8️⃣ : Redémarrer l'Application

Retournez dans votre **terminal** et :

1. **Arrêtez le serveur** (si il tourne) : `Ctrl+C`
2. **Relancez** :
   ```bash
   npm run dev
   ```
3. **Ouvrez** : http://localhost:5174/feed

---

### ÉTAPE 9️⃣ : Test Final

#### Test A : Créer un Post

1. Allez sur http://localhost:5174/feed
2. Écrivez dans la zone de texte : **"Mon premier vrai post ! 🎉"**
3. Cliquez sur **"Publier"**

**✅ Attendu :**
- Toast vert : "Publication partagée !"
- Le post apparaît immédiatement
- Vous pouvez le liker
- Le compteur augmente

**❌ Si ça ne marche pas :**
- Ouvrez la console (F12)
- Cherchez les erreurs rouges
- Partagez-les

#### Test B : Rejoindre un Groupe

1. Allez sur http://localhost:5174/groups
2. Créez un groupe : **"Test Groupe"**
3. Vérifiez que `member_count = 1` (vous êtes ajouté automatiquement)

**✅ Attendu :**
- Le groupe est créé
- Vous apparaissez dans les membres
- Le compteur indique **"1 membre"**

#### Test C : Partager un Post

1. Sur `/feed`, trouvez un post
2. Cliquez sur l'icône **Partager** (Share2)
3. Le compteur de partages augmente

**✅ Attendu :**
- Toast vert : "Publication partagée !"
- Un nouveau post apparaît avec le texte : "[Nom] a partagé : ..."
- Le compteur `share_count` augmente sur le post original

---

## 🔄 SI QUELQUE CHOSE NE MARCHE PAS

### Option 1 : Réexécuter le Script

Le script est **safe** à réexécuter. Il utilise :
- `CREATE OR REPLACE FUNCTION` (écrase les anciennes)
- `CREATE TABLE IF NOT EXISTS` (ne crée que si ça n'existe pas)
- `DROP TRIGGER IF EXISTS` (supprime avant de recréer)

**Action :** Réexécutez le script complet dans SQL Editor.

---

### Option 2 : Reset Complet

**⚠️ ATTENTION : Cela supprime TOUTES vos données de test**

```sql
-- 1. Supprimer les tables sociales
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;

-- 2. Supprimer les fonctions
DROP FUNCTION IF EXISTS increment_group_members CASCADE;
DROP FUNCTION IF EXISTS decrement_group_members CASCADE;
DROP FUNCTION IF EXISTS increment_post_like_count CASCADE;
DROP FUNCTION IF EXISTS decrement_post_like_count CASCADE;
DROP FUNCTION IF EXISTS increment_post_comment_count CASCADE;
DROP FUNCTION IF EXISTS decrement_post_comment_count CASCADE;
DROP FUNCTION IF EXISTS add_owner_as_member CASCADE;

-- 3. Réexécuter le script complet
```

---

### Option 3 : Vérifier les Logs

1. Dans Supabase Dashboard, allez sur **"Logs"**
2. Sélectionnez **"Postgres Logs"**
3. Cherchez les erreurs récentes

---

## 📊 COMPARAISON AVANT / APRÈS

### AVANT (Maquette)

| Action | Résultat |
|--------|----------|
| Créer un post | ❌ Erreur console : `relation "posts" does not exist` |
| Liker | ❌ Le compteur ne bouge pas |
| Rejoindre un groupe | ⚠️ Vous rejoignez mais `member_count` reste à 0 |
| Partager | ❌ Erreur : impossible d'insérer dans `posts` |

### APRÈS (Application Réelle)

| Action | Résultat |
|--------|----------|
| Créer un post | ✅ Post créé, toast de confirmation, apparaît dans le fil |
| Liker | ✅ Compteur augmente instantanément, couleur change |
| Rejoindre un groupe | ✅ `member_count` augmente automatiquement |
| Partager | ✅ Nouveau post créé, compteur `share_count` augmente |

---

## 🎉 CHECKLIST FINALE

Avant de dire "Ça marche" :

- [ ] Script SQL exécuté sans erreur
- [ ] Message de succès visible dans la console SQL
- [ ] Test 1 passe (table posts existe)
- [ ] Test 2 passe (fonctions RPC créées)
- [ ] Test 3 passe (triggers actifs)
- [ ] Application redémarrée
- [ ] Post créé avec succès
- [ ] Like fonctionne
- [ ] Partage fonctionne
- [ ] Compteur de membres de groupe fonctionne
- [ ] Console navigateur sans erreur rouge

---

## 💡 ASTUCES PRO

### Astuce 1 : Sauvegarder la Requête

Dans SQL Editor, après avoir collé le script :
1. Cliquez sur **"Save"** (💾) en haut
2. Nommez-la : **"Setup Complet WordCraft"**
3. Vous pourrez la réutiliser plus tard

### Astuce 2 : Créer un Snippet

Dans SQL Editor :
1. Menu hamburger (☰) > **"Snippets"**
2. Créez un snippet pour les tests de vérification
3. Réutilisable en un clic

### Astuce 3 : Export des Données

Avant un reset complet :
```sql
-- Exporter les posts
COPY posts TO '/tmp/posts_backup.csv' WITH CSV HEADER;

-- Exporter les groupes
COPY groups TO '/tmp/groups_backup.csv' WITH CSV HEADER;
```

---

## 📞 SUPPORT

Si après tout ça, ça ne marche toujours pas :

1. **Vérifiez que vous êtes sur le bon projet Supabase**
2. **Vérifiez que votre `.env` contient les bonnes clés** :
   ```
   VITE_SUPABASE_URL=https://[votre-project-id].supabase.co
   VITE_SUPABASE_ANON_KEY=[votre-anon-key]
   ```
3. **Testez la connexion** :
   ```typescript
   // Dans la console du navigateur (F12)
   console.log(supabase.supabaseUrl)
   console.log(supabase.supabaseKey)
   ```

---

**Date :** 2 Janvier 2026  
**Temps estimé :** 5-10 minutes  
**Niveau de difficulté :** ⭐⭐ (Facile si vous suivez les étapes)
