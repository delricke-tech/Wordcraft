# 🚨 CORRECTION ERREUR CORS - Guide Complet

## 🎯 Problème
- ✅ Upload vers Supabase Storage fonctionne
- ❌ Insertion en table `documents` échoue
- ❌ Possible erreur CORS ou RLS trop strict

---

## 📋 ÉTAPES DE CORRECTION (À FAIRE DANS L'ORDRE)

### ÉTAPE 1 : Vérifier l'erreur exacte dans la console

1. **Ouvrez votre application** dans le navigateur
2. **Ouvrez la console DevTools** (F12)
3. **Tentez un upload** d'un fichier
4. **Regardez les logs** dans la console :

```
✅ Fichier uploadé avec succès vers Storage
❌ ERREUR LORS DE L'INSERTION EN BASE DE DONNÉES  ← REGARDEZ ICI
📋 Code d'erreur: ...
📋 Message: ...
📋 Détails: ...
```

**Identifiez le type d'erreur** :

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| `42501` | `new row violates row-level security policy` | RLS bloque l'insertion | → Allez à ÉTAPE 2 |
| `23503` | `violates foreign key constraint` | user_id invalide | → Allez à ÉTAPE 3 |
| `PGRST` | `JWT expired` ou `invalid claim` | Token expiré | → Allez à ÉTAPE 4 |
| Autre | CORS ou réseau | Configuration Supabase | → Allez à ÉTAPE 5 |

---

### ÉTAPE 2 : Corriger les Politiques RLS dans Supabase

**Action : Exécuter le script SQL dans Supabase Dashboard**

1. Allez sur **https://supabase.com/dashboard**
2. Sélectionnez votre projet : `uexuecubafgfhpfebknt`
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Créez une nouvelle requête
5. **Copiez-collez le contenu de `fix-rls-policies.sql`**
6. Cliquez sur **Run** (ou Ctrl + Enter)

**Ce que fait le script** :
- ✅ Active RLS sur la table `documents`
- ✅ Supprime les anciennes politiques restrictives
- ✅ Crée des politiques permissives qui acceptent `user_id = NULL`
- ✅ Garde votre trigger de normalisation intact [cite: 2025-12-27]

**Vérification** :
```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'documents';
```

Vous devriez voir :
```
Allow INSERT for all users     | INSERT
Allow SELECT for all users     | SELECT
Allow UPDATE for document owner | UPDATE
Allow DELETE for document owner | DELETE
```

---

### ÉTAPE 3 : Vider le Cache et Rafraîchir la Session

**Si l'erreur est liée au user_id (ancien ID en cache)** :

1. **Ouvrez la console DevTools** (F12)
2. Allez dans l'onglet **Application**
3. Dans le menu de gauche : **Local Storage** → Sélectionnez votre domaine
4. **Cliquez sur "Clear All"** (icône 🗑️)
5. Fermez et rouvrez le navigateur (ou Ctrl + Shift + R)
6. **Reconnectez-vous** avec votre nouveau compte

**Vérification dans la console** :
```javascript
// Tapez ceci dans la console pour voir le user actuel
JSON.parse(localStorage.getItem('sb-uexuecubafgfhpfebknt-auth-token'))?.user?.id
```

Comparez cet ID avec celui dans Supabase Dashboard → **Authentication → Users**.

---

### ÉTAPE 4 : Rafraîchir le Token d'Authentification

**Si le token est expiré** :

Le code suivant force un refresh du token :

```typescript
// Dans AuthContext.tsx (déjà implémenté)
const { data: { session } } = await supabase.auth.getSession();
```

**Action manuelle** :
1. Déconnectez-vous de l'application
2. Reconnectez-vous avec votre compte
3. Le token sera automatiquement rafraîchi

---

### ÉTAPE 5 : Vérifier la Configuration Supabase

**Vérification de l'URL** (déjà fait) :
```env
VITE_SUPABASE_URL=https://uexuecubafgfhpfebknt.supabase.co  ✅ Correct (pas de /)
```

**Vérification des CORS dans Supabase Dashboard** :

1. Allez dans **Settings** → **API**
2. Section **CORS Origins**
3. Ajoutez votre domaine local : `http://localhost:5173` (ou le port utilisé)
4. Si en production, ajoutez aussi votre domaine de production

---

### ÉTAPE 6 : Tester avec les Nouveaux Logs

Le code a été modifié pour afficher des logs détaillés :

**Logs attendus lors d'un upload réussi** :

```
📤 ===== UPLOAD VERS SUPABASE =====
  - Nom original: Mon Document.pdf
  - Storage path normalisé: 1735...-mon-document.pdf
  - User ID: abc-123-def-456 (ou NULL)

✅ Fichier uploadé avec succès vers Storage

🔍 Informations de session avant insertion :
  - user existe? true
  - user.id: abc-123-def-456
  - user.email: votre@email.com
  - Supabase URL: https://uexuecubafgfhpfebknt.supabase.co

💾 Insertion en BDD: { name: "...", storage_path: "...", user_id: "..." }

✅ Document enregistré en BDD avec succès
  - Document ID: xyz-789
  - Storage path en BDD: ...
```

**Si ça échoue, vous verrez** :
```
❌ ═══════════════════════════════════════════════════════
❌ ERREUR LORS DE L'INSERTION EN BASE DE DONNÉES
❌ ═══════════════════════════════════════════════════════
📋 Code: 42501
📋 Message: new row violates row-level security policy
📋 Détails: ...
💡 Solutions possibles: [liste des solutions]
```

---

## 🔍 DIAGNOSTIC RAPIDE

### Test 1 : Upload vers Storage (isolé)

Pour tester uniquement l'upload Storage sans insertion BDD :

```typescript
// Testez dans la console du navigateur
const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
const { data, error } = await supabase.storage
  .from('documents')
  .upload('test-' + Date.now() + '.pdf', testFile);

console.log('Storage upload result:', { data, error });
```

Si ça fonctionne : Le problème vient de l'insertion BDD (RLS ou contrainte).

---

### Test 2 : Insertion BDD directe (isolée)

Pour tester uniquement l'insertion sans upload :

```typescript
// Testez dans la console du navigateur
const { data, error } = await supabase
  .from('documents')
  .insert({
    name: 'Test CORS',
    storage_path: 'test-cors.pdf',
    user_id: null,  // ou votre user.id
    file_type: 'pdf',
    file_size: 12345
  })
  .select();

console.log('BDD insert result:', { data, error });
```

Si ça échoue : Le problème vient des politiques RLS → Allez à ÉTAPE 2.

---

### Test 3 : Vérifier le User Actuel

```typescript
// Dans la console du navigateur
const { data: { user } } = await supabase.auth.getUser();
console.log('User actuel:', user);
```

Comparez `user.id` avec les documents dans la table `documents`.

---

## ✅ CHECKLIST DE VÉRIFICATION

Avant de tester à nouveau :

- [ ] **RLS configuré** : Politiques permissives créées (ÉTAPE 2)
- [ ] **Cache vidé** : Local Storage nettoyé (ÉTAPE 3)
- [ ] **Reconnecté** : Session rafraîchie avec le nouveau compte (ÉTAPE 3)
- [ ] **URL correcte** : Pas de `/` à la fin (déjà vérifié ✅)
- [ ] **CORS configuré** : Domaine local ajouté dans Supabase (ÉTAPE 5)
- [ ] **Logs activés** : Code modifié avec logs détaillés ✅

---

## 🎯 SOLUTION RAPIDE (Si pressé)

**OPTION A : Autoriser tout le monde (temporaire pour déboguer)**

Dans Supabase SQL Editor :
```sql
DROP POLICY IF EXISTS "Allow INSERT for all users" ON documents;

CREATE POLICY "Allow INSERT without restrictions (temporary)"
ON documents
FOR INSERT
TO public
WITH CHECK (true);
```

⚠️ **Attention** : Cette politique est trop permissive pour la production. À utiliser uniquement pour déboguer.

**OPTION B : Désactiver RLS temporairement**

```sql
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
```

⚠️ **Attention** : Ne JAMAIS faire ça en production ! Uniquement pour tester localement.

---

## 📞 SI ÇA NE FONCTIONNE TOUJOURS PAS

1. **Copiez l'erreur complète** de la console
2. **Vérifiez dans Supabase Dashboard** → **Logs** → **Postgres Logs**
3. **Cherchez "documents"** pour voir les requêtes qui échouent
4. **Partagez l'erreur exacte** pour un diagnostic plus précis

---

## 🎊 RÉSULTAT ATTENDU

Après avoir suivi toutes les étapes :

```
✅ Upload vers Storage : OK
✅ Insertion en BDD : OK
✅ Trigger normalise storage_path : OK
✅ Table documents remplie : OK
✅ Pas d'erreur CORS : OK
```

**La table `documents` ne devrait plus être vide !** 🎉

[cite: 2025-12-27]

