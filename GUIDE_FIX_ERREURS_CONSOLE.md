# 🔧 GUIDE FIX ERREURS CONSOLE

## 📋 Erreurs Identifiées

### 1. ❌ **Colonne actor_id manquante dans notifications**
```
Error: column "actor_id" of relation "notifications" does not exist
```

### 2. ❌ **CORS OpenAI bloqué**
```
Access-Control-Allow-Origin header is not present
```

### 3. ❌ **401 Unauthorized OpenAI**
```
POST https://api.openai.com/v1/chat/completions net::ERR_FAILED 401
```

---

## ✅ SOLUTION 1: Ajouter actor_id à la table notifications

### Méthode A: Via Supabase Dashboard (RECOMMANDÉ)

1. **Aller sur Supabase Dashboard**
   - https://supabase.com/dashboard
   - Sélectionnez votre projet WordCraft

2. **Ouvrir SQL Editor**
   - Menu latéral → `SQL Editor`
   - Ou: https://supabase.com/dashboard/project/[VOTRE_PROJECT_ID]/sql/new

3. **Copier-coller ce script**
   ```sql
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
       
       RAISE NOTICE 'Colonne actor_id ajoutée !';
     ELSE
       RAISE NOTICE 'Colonne actor_id existe déjà';
     END IF;
   END $$;
   
   -- Créer un index pour les performances
   CREATE INDEX IF NOT EXISTS idx_notifications_actor 
   ON notifications(actor_id) 
   WHERE actor_id IS NOT NULL;
   ```

4. **Exécuter** (bouton `Run` ou Ctrl+Enter)

5. **Vérifier le résultat**
   - Vous devriez voir : `✅ "Colonne actor_id ajoutée !"`

### Méthode B: Via fichier SQL local

1. **Exécuter le fichier** `FIX_ADD_ACTOR_ID_TO_NOTIFICATIONS.sql`
   - Copier le contenu
   - Coller dans Supabase SQL Editor
   - Exécuter

---

## ✅ SOLUTION 2: Configurer correctement OpenAI

### Problème CORS

Le problème CORS vient du fait que vous appelez OpenAI depuis le **navigateur** (frontend).

**2 solutions :**

#### Option A: Utiliser un proxy backend (RECOMMANDÉ pour production)

1. Créer un endpoint backend Supabase Edge Function
2. Le frontend appelle votre fonction
3. Votre fonction appelle OpenAI

#### Option B: Accepter le CORS en développement (TEMPORAIRE)

Pour le moment, en local, vous pouvez:
1. Utiliser une extension Chrome "CORS Unblock"
2. OU utiliser un proxy local

### Problème 401 Unauthorized

**Cause :** Clé API OpenAI invalide ou manquante

**Solution :**

1. **Vérifier votre clé API**
   - Aller sur https://platform.openai.com/api-keys
   - Créer une nouvelle clé si nécessaire

2. **Ajouter la clé dans .env.local**
   ```env
   VITE_OPENAI_API_KEY=sk-proj-VOTRE_CLE_ICI
   ```

3. **Redémarrer le serveur**
   ```bash
   npm run dev
   ```

4. **Vérifier que la clé est chargée**
   ```bash
   # Dans la console navigateur
   console.log(import.meta.env.VITE_OPENAI_API_KEY)
   ```

**⚠️ IMPORTANT SÉCURITÉ**
- **NE JAMAIS** commiter votre `.env.local` sur Git
- **NE JAMAIS** exposer votre clé API dans le code frontend
- Utiliser un backend/Edge Functions pour les appels API en production

---

## 🧪 TEST APRÈS CORRECTIONS

### 1. Tester la table notifications

```sql
-- Dans Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications';
```

Vous devriez voir `actor_id` dans la liste.

### 2. Tester l'insertion

```sql
-- Test d'insertion avec actor_id
INSERT INTO notifications (user_id, type, title, actor_id)
VALUES (
  (SELECT id FROM profiles LIMIT 1),
  'system',
  'Test notification',
  (SELECT id FROM profiles LIMIT 1)
);
```

Si ça fonctionne sans erreur, c'est bon ! ✅

### 3. Tester OpenAI

1. Recharger l'application (Ctrl+F5)
2. Essayer de générer un quiz
3. Vérifier la console → Plus d'erreur 401

---

## 📊 CHECKLIST FINALE

- [ ] Colonne `actor_id` ajoutée à `notifications`
- [ ] Index `idx_notifications_actor` créé
- [ ] Clé API OpenAI configurée dans `.env.local`
- [ ] Application redémarrée
- [ ] Console sans erreurs critiques
- [ ] Génération de quiz fonctionne

---

## 🆘 SI PROBLÈME PERSISTE

1. **Vérifier les logs Supabase**
   - Dashboard → Logs → Postgres Logs

2. **Vérifier la console navigateur**
   - F12 → Console → Copier les nouvelles erreurs

3. **Tester en mode incognito**
   - Éliminer les problèmes de cache

4. **Redéployer sur Vercel**
   ```bash
   git add .
   git commit -m "fix: Corrections erreurs console"
   git push origin main
   ```

---

**Date:** 04 Janvier 2026  
**Auteur:** Cursor AI Assistant  
**Priorité:** 🔴 CRITIQUE - À faire immédiatement
