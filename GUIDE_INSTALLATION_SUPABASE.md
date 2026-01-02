# 🔧 GUIDE COMPLET D'INSTALLATION - Système Social

**IMPORTANT :** Ce guide liste TOUTES les manipulations nécessaires dans Supabase pour que l'application fonctionne à 100%.

---

## 📋 CHECKLIST COMPLÈTE

### ✅ 1. Scripts SQL à Exécuter (OBLIGATOIRE)

#### Script 1 : Groupes
📁 **`supabase/migrations/20260102_groups_functions.sql`**
- Fonctions pour gérer les compteurs de membres
- Trigger pour ajouter le propriétaire comme membre
- **STATUT :** À exécuter

#### Script 2 : Système Social  
📁 **`supabase/migrations/20260102_social_system.sql`**
- Création de la table `posts`
- Triggers pour likes et commentaires
- Politiques de sécurité (RLS)
- **STATUT :** À exécuter

---

## 🚀 PROCÉDURE D'INSTALLATION COMPLÈTE

### ÉTAPE 1 : Vérifier les Tables Existantes

Connectez-vous à Supabase et vérifiez que ces tables existent :

```sql
-- Vérifier les tables existantes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Tables REQUISES (doivent exister) :**
- ✅ `profiles`
- ✅ `groups`
- ✅ `group_members`
- ✅ `chat_messages`
- ✅ `likes`
- ✅ `comments`
- ✅ `follows`
- ✅ `documents`
- ✅ `study_cards`
- ✅ `quizzes`

**Table À CRÉER :**
- ❌ `posts` → Sera créée par le script SQL

---

### ÉTAPE 2 : Vérifier le Storage

1. **Aller dans Storage**
2. **Vérifier que le bucket `documents` existe**
3. **Si non, créer le bucket :**

```sql
-- Créer le bucket documents s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;
```

4. **Configurer les politiques du bucket :**

```sql
-- Politique : Tout le monde peut lire
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Politique : Utilisateurs authentifiés peuvent uploader
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Politique : Propriétaire peut supprimer
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid() = owner);
```

---

### ÉTAPE 3 : Exécuter le Script Groupes

1. **Ouvrir Supabase Dashboard**
2. **Aller dans SQL Editor**
3. **Copier TOUT le contenu de :**
   ```
   supabase/migrations/20260102_groups_functions.sql
   ```

4. **Coller dans l'éditeur SQL**

5. **Cliquer RUN ▶️**

6. **Vérifier le résultat :**
   - ✅ "Success" = Parfait !
   - ❌ Erreur = Lire le message d'erreur

**Fonctions créées :**
- `increment_group_members()`
- `decrement_group_members()`
- `update_group_member_count_on_insert()`
- `update_group_member_count_on_delete()`
- `update_group_member_count_on_update()`
- `add_owner_as_member()`

**Triggers créés :**
- `group_member_count_insert`
- `group_member_count_delete`
- `group_member_count_update`
- `add_owner_as_member_trigger`

---

### ÉTAPE 4 : Exécuter le Script Système Social

1. **Dans SQL Editor (nouvelle requête)**
2. **Copier TOUT le contenu de :**
   ```
   supabase/migrations/20260102_social_system.sql
   ```

3. **Coller dans l'éditeur SQL**

4. **Cliquer RUN ▶️**

5. **Vérifier le résultat :**
   - ✅ "Success" = Parfait !
   - ❌ Erreur = Lire le message

**Éléments créés :**

#### Table :
- `posts`

#### Fonctions :
- `update_posts_updated_at()`
- `increment_post_like_count()`
- `decrement_post_like_count()`
- `increment_post_comment_count()`
- `decrement_post_comment_count()`

#### Triggers :
- `update_posts_updated_at_trigger`
- `post_like_count_insert`
- `post_like_count_delete`
- `post_comment_count_insert`
- `post_comment_count_delete`
- `post_comment_count_update`

#### Vue :
- `posts_with_profiles`

#### Politiques RLS :
- `Users can view posts`
- `Users can create posts`
- `Users can update own posts`
- `Users can delete own posts`

---

### ÉTAPE 5 : Vérifier que Tout est Créé

Exécutez ces requêtes de vérification :

```sql
-- 1. Vérifier que la table posts existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'posts'
);
-- Résultat attendu : true

-- 2. Vérifier les triggers sur posts
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'posts';
-- Résultat attendu : 1 trigger (update_posts_updated_at_trigger)

-- 3. Vérifier les triggers sur likes
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'likes'
AND trigger_name LIKE '%post%';
-- Résultat attendu : post_like_count_insert, post_like_count_delete

-- 4. Vérifier les triggers sur comments
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'comments'
AND trigger_name LIKE '%post%';
-- Résultat attendu : post_comment_count_insert, post_comment_count_delete, post_comment_count_update

-- 5. Vérifier les triggers sur groups
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'groups';
-- Résultat attendu : add_owner_as_member_trigger

-- 6. Vérifier les triggers sur group_members
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'group_members';
-- Résultat attendu : group_member_count_insert, group_member_count_delete, group_member_count_update

-- 7. Compter les posts
SELECT COUNT(*) FROM posts;
-- Résultat attendu : 0 (ou plus si vous avez créé des posts)

-- 8. Vérifier les politiques RLS sur posts
SELECT COUNT(*) 
FROM pg_policies 
WHERE tablename = 'posts';
-- Résultat attendu : 4 (view, create, update, delete)
```

---

### ÉTAPE 6 : Vérifier Row Level Security (RLS)

```sql
-- Vérifier que RLS est activé sur les tables importantes
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('posts', 'groups', 'group_members', 'chat_messages', 'likes', 'follows')
ORDER BY tablename;
```

**Résultat attendu :** Toutes les tables doivent avoir `rowsecurity = true`

---

### ÉTAPE 7 : Créer des Données de Test (Optionnel)

Pour tester rapidement l'application :

```sql
-- Créer un post de test
INSERT INTO posts (user_id, content, post_type, visibility)
VALUES (
  auth.uid(),
  'Mon premier post ! 🎉',
  'status',
  'public'
);

-- Créer un groupe de test
INSERT INTO groups (owner_id, name, description, is_public, is_discoverable)
VALUES (
  auth.uid(),
  'Groupe de test',
  'Un groupe pour tester les fonctionnalités',
  true,
  true
);
```

---

## 🔍 DIAGNOSTIC EN CAS DE PROBLÈME

### Problème 1 : "Table posts n'existe pas"

**Solution :**
1. Exécutez à nouveau le script `20260102_social_system.sql`
2. Vérifiez les erreurs dans le output

### Problème 2 : "Trigger déjà existant"

**Solution :**
```sql
-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS update_posts_updated_at_trigger ON posts;
DROP TRIGGER IF EXISTS post_like_count_insert ON likes;
DROP TRIGGER IF EXISTS post_like_count_delete ON likes;
DROP TRIGGER IF EXISTS post_comment_count_insert ON comments;
DROP TRIGGER IF EXISTS post_comment_count_delete ON comments;
DROP TRIGGER IF EXISTS post_comment_count_update ON comments;
DROP TRIGGER IF EXISTS group_member_count_insert ON group_members;
DROP TRIGGER IF EXISTS group_member_count_delete ON group_members;
DROP TRIGGER IF EXISTS group_member_count_update ON group_members;
DROP TRIGGER IF EXISTS add_owner_as_member_trigger ON groups;

-- Puis réexécutez les scripts SQL
```

### Problème 3 : "RLS policy already exists"

**Solution :**
```sql
-- Supprimer les politiques existantes sur posts
DROP POLICY IF EXISTS "Users can view posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- Puis réexécutez le script social_system.sql
```

### Problème 4 : "Permission denied"

**Solution :**
1. Vérifiez que vous êtes connecté en tant qu'utilisateur authentifié
2. Vérifiez que RLS est bien activé
3. Vérifiez les politiques avec :

```sql
SELECT * FROM pg_policies WHERE tablename = 'posts';
```

### Problème 5 : "Compteur ne s'incrémente pas"

**Solution :**
```sql
-- Vérifier que les triggers existent
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%count%';

-- Si aucun résultat, réexécutez les scripts SQL
```

---

## 📊 COMMANDES DE MAINTENANCE

### Réinitialiser les Compteurs

Si les compteurs sont désynchronisés :

```sql
-- Recalculer le member_count pour tous les groupes
UPDATE groups g
SET member_count = (
  SELECT COUNT(*)
  FROM group_members gm
  WHERE gm.group_id = g.id
  AND gm.status = 'active'
);

-- Recalculer le like_count pour tous les posts
UPDATE posts p
SET like_count = (
  SELECT COUNT(*)
  FROM likes l
  WHERE l.target_type = 'post'
  AND l.target_id = p.id
);

-- Recalculer le comment_count pour tous les posts
UPDATE posts p
SET comment_count = (
  SELECT COUNT(*)
  FROM comments c
  WHERE c.target_type = 'post'
  AND c.target_id = p.id
  AND c.is_deleted = false
);
```

---

## ✅ CHECKLIST FINALE

Cochez au fur et à mesure :

### Base de Données
- [ ] Table `posts` créée
- [ ] Table `groups` existe
- [ ] Table `group_members` existe
- [ ] Table `chat_messages` existe
- [ ] Table `likes` existe
- [ ] Table `comments` existe
- [ ] Table `follows` existe

### Storage
- [ ] Bucket `documents` existe
- [ ] Bucket est public
- [ ] Politiques configurées

### Fonctions SQL
- [ ] Fonctions de groupes créées (6)
- [ ] Fonctions de posts créées (5)

### Triggers
- [ ] Triggers de posts créés (1)
- [ ] Triggers de likes créés (2)
- [ ] Triggers de comments créés (3)
- [ ] Triggers de groups créés (1)
- [ ] Triggers de group_members créés (3)

### Row Level Security
- [ ] RLS activé sur `posts`
- [ ] 4 politiques sur `posts`
- [ ] RLS activé sur `groups`
- [ ] RLS activé sur `group_members`
- [ ] RLS activé sur `chat_messages`

### Vérification Finale
- [ ] Requêtes de vérification exécutées
- [ ] Aucune erreur dans les logs
- [ ] Données de test créées (optionnel)

---

## 🎯 RÉSUMÉ RAPIDE

### 2 Scripts à Exécuter dans Supabase SQL Editor

1. **`20260102_groups_functions.sql`** (102 lignes)
   - Compteurs de membres
   - Auto-ajout du propriétaire

2. **`20260102_social_system.sql`** (200 lignes)
   - Table posts
   - Compteurs likes/comments
   - Politiques RLS

### Vérification Rapide

```sql
-- Une seule requête pour tout vérifier
SELECT 
  'posts' as element,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'posts')
    THEN '✅ OK'
    ELSE '❌ MANQUANT'
  END as statut
UNION ALL
SELECT 
  'triggers_posts',
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.triggers WHERE event_object_table = 'posts')
    THEN '✅ OK'
    ELSE '❌ MANQUANT'
  END
UNION ALL
SELECT 
  'triggers_groups',
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.triggers WHERE event_object_table = 'groups')
    THEN '✅ OK'
    ELSE '❌ MANQUANT'
  END
UNION ALL
SELECT 
  'triggers_group_members',
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.triggers WHERE event_object_table = 'group_members')
    THEN '✅ OK'
    ELSE '❌ MANQUANT'
  END
UNION ALL
SELECT 
  'rls_posts',
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'posts') = 4
    THEN '✅ OK'
    ELSE '❌ MANQUANT'
  END;
```

**Résultat attendu :** Tous les éléments doivent afficher "✅ OK"

---

## 🚀 APRÈS L'INSTALLATION

Une fois tous les scripts exécutés :

1. **Démarrer l'application**
   ```bash
   npm run dev
   ```

2. **Tester le Fil d'Actualité**
   - Aller sur `/feed`
   - Créer un post
   - Liker le post
   - Vérifier que les compteurs fonctionnent

3. **Tester les Groupes**
   - Aller sur `/groups`
   - Créer un groupe
   - Vérifier que vous êtes automatiquement membre
   - Envoyer un message

4. **Tester les Profils**
   - Aller sur `/profile`
   - Voir vos stats
   - Suivre quelqu'un
   - Vérifier les compteurs

---

## 📞 SUPPORT

Si vous rencontrez des erreurs :

1. **Lire le message d'erreur** dans Supabase
2. **Vérifier les logs** (F12 dans le navigateur)
3. **Exécuter les requêtes de diagnostic** ci-dessus
4. **Réexécuter les scripts** si nécessaire

---

**Document créé le :** 2 janvier 2026  
**Statut :** Guide complet d'installation
