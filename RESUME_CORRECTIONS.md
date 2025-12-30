# ✅ RÉSUMÉ DES CORRECTIONS - ERREUR CORS/INSERTION

## 🎯 Votre Problème
- ✅ Upload vers Supabase Storage fonctionne
- ❌ Insertion en table `documents` échoue
- ❌ Table reste vide
- ❓ Erreur CORS ou RLS ?

---

## ✅ CE QUI A ÉTÉ FAIT

### 1. ✅ URL Supabase Vérifiée
```
VITE_SUPABASE_URL=https://uexuecubafgfhpfebknt.supabase.co
```
Pas de `/` à la fin → **Correct**

### 2. ✅ Logs Détaillés Ajoutés
**Fichier modifié**: `src/pages/Library.tsx`

Maintenant, lors d'un upload, vous verrez dans la console :
```
🔍 Informations de session avant insertion :
  - user existe? true/false
  - user.id: abc-123-def-456
  - user.email: votre@email.com
  - Supabase URL: https://...

💾 Insertion en BDD: {...}
```

Si erreur :
```
❌ ═══════════════════════════════════════════════════════
❌ ERREUR LORS DE L'INSERTION EN BASE DE DONNÉES
❌ ═══════════════════════════════════════════════════════
📋 Code: 42501
📋 Message: new row violates row-level security policy
📋 Détails: ...
💡 Solutions possibles: [...]
```

### 3. ✅ Script SQL de Correction Créé
**Fichier**: `fix-rls-policies.sql`

Ce script :
- Active RLS sur `documents`
- Crée des politiques permissives
- **Accepte user_id NULL** (uploads anonymes)
- **Garde votre trigger de normalisation** [cite: 2025-12-27]

### 4. ✅ Guide Complet Créé
**Fichiers**:
- `GUIDE_CORRECTION_COMPLETE.md` → Diagnostic complet
- `ACTION_PLAN.txt` → Plan d'action détaillé
- `CORRECTION_CORS.md` → Vérifications initiales

---

## 🚀 ACTIONS À FAIRE MAINTENANT

### ÉTAPE 1 : Exécuter le Script SQL ⚡ IMPORTANT

1. Ouvrez **https://supabase.com/dashboard**
2. Sélectionnez votre projet : `uexuecubafgfhpfebknt`
3. Menu gauche → **SQL Editor**
4. **New Query**
5. Copiez le contenu de **`fix-rls-policies.sql`**
6. Cliquez sur **Run** (Ctrl + Enter)
7. Vérifiez le résultat : "Success. No rows returned"

**Ce que ça fait** :
```sql
-- Crée 4 politiques :
✅ Allow INSERT for all users (accepte user_id NULL)
✅ Allow SELECT for all users
✅ Allow UPDATE for document owner
✅ Allow DELETE for document owner
```

---

### ÉTAPE 2 : Vider le Cache du Navigateur

1. Dans votre application, appuyez sur **F12**
2. Onglet **Application** (Chrome) ou **Stockage** (Firefox)
3. Menu gauche → **Local Storage**
4. Cliquez sur votre domaine (ex: `localhost:5173`)
5. Cliquez sur l'icône **poubelle** en haut à droite (Clear All)
6. Fermez et rouvrez le navigateur (ou **Ctrl + Shift + R**)

**Pourquoi ?**  
Pour supprimer l'ancien user_id qui pourrait être en cache.

---

### ÉTAPE 3 : Se Reconnecter

1. Dans votre application, **déconnectez-vous**
2. **Reconnectez-vous** avec votre nouveau compte
3. Ouvrez la console (F12)
4. Vérifiez que le bon user est connecté :

```javascript
// Tapez dans la console :
const { data: { user } } = await supabase.auth.getUser();
console.log('User actuel:', user?.id, user?.email);
```

---

### ÉTAPE 4 : Tester un Upload

1. Gardez la console ouverte (**F12** → **Console**)
2. Uploadez un fichier de test : **"Test Été 2024.pdf"**
3. **Observez les logs** détaillés dans la console
4. Si erreur, **notez le code** (ex: 42501, 23503, etc.)

**Logs attendus si succès** :
```
📤 ===== UPLOAD VERS SUPABASE =====
✅ Fichier uploadé avec succès vers Storage
🔍 Informations de session avant insertion :
  - user existe? true
  - user.id: [votre-id]
  - user.email: [votre-email]
💾 Insertion en BDD: {...}
✅ Document enregistré en BDD avec succès
```

---

### ÉTAPE 5 : Vérifier dans Supabase

1. Allez sur **https://supabase.com/dashboard**
2. **Table Editor** → **documents**
3. Vous devriez voir votre fichier uploadé
4. Vérifiez :
   - ✅ `name` : "Test Été 2024.pdf" (nom original)
   - ✅ `storage_path` : "1735...-test-ete-2024.pdf" (normalisé par trigger)
   - ✅ `user_id` : votre ID ou NULL
   - ✅ `file_type` : "pdf"

---

## 🔍 SI ÇA NE FONCTIONNE PAS

### Erreur 42501 : "row-level security policy"
**Solution** : Les politiques RLS bloquent l'insertion  
→ Vérifiez que vous avez bien exécuté `fix-rls-policies.sql`  
→ Dans Supabase : **Authentication → Policies → documents**  
→ Vous devriez voir 4 politiques

### Erreur 23503 : "foreign key constraint"
**Solution** : user_id invalide (ancien compte)  
→ Videz le cache (ÉTAPE 2)  
→ Reconnectez-vous (ÉTAPE 3)  
→ Vérifiez le user.id dans la console

### Erreur "JWT expired"
**Solution** : Token d'authentification expiré  
→ Déconnectez-vous et reconnectez-vous

### Erreur CORS
**Solution** : Configuration Supabase  
→ Supabase Dashboard → **Settings → API**  
→ Section **CORS Origins**  
→ Ajoutez : `http://localhost:5173`

---

## 📊 DIAGNOSTIC RAPIDE

### Test 1 : Upload Storage seul
```typescript
// Dans la console du navigateur
const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
const { data, error } = await supabase.storage
  .from('documents')
  .upload('test-' + Date.now() + '.pdf', testFile);
console.log({ data, error });
```
✅ Si ça marche : Le problème vient de l'insertion BDD

### Test 2 : Insertion BDD seule
```typescript
// Dans la console du navigateur
const { data, error } = await supabase
  .from('documents')
  .insert({
    name: 'Test CORS',
    storage_path: 'test-cors.pdf',
    user_id: null,
    file_type: 'pdf',
    file_size: 12345
  })
  .select();
console.log({ data, error });
```
❌ Si ça échoue : Problème de politiques RLS → Exécutez `fix-rls-policies.sql`

---

## ✅ RÉSULTAT ATTENDU

Après avoir suivi les ÉTAPES 1-5 :

```
✅ Upload vers Storage : Fonctionne
✅ Insertion en BDD : Fonctionne
✅ user_id correct : Nouveau compte
✅ storage_path normalisé : Par trigger SQL [cite: 2025-12-27]
✅ Table documents : Remplie !
✅ Pas d'erreur CORS : Résolu
```

---

## 📁 FICHIERS CRÉÉS

- ✅ `fix-rls-policies.sql` → Script SQL à exécuter dans Supabase
- ✅ `GUIDE_CORRECTION_COMPLETE.md` → Guide détaillé
- ✅ `ACTION_PLAN.txt` → Plan d'action complet
- ✅ `CORRECTION_CORS.md` → Vérifications
- ✅ `RESUME_CORRECTIONS.md` → Ce fichier

---

## 🎊 RÉCAPITULATIF

| Point | Status | Action |
|-------|--------|--------|
| URL Supabase | ✅ Vérifié | Rien à faire |
| Logs détaillés | ✅ Ajoutés | Testez un upload |
| Script SQL RLS | ✅ Créé | **À exécuter** (ÉTAPE 1) |
| Cache navigateur | ⚠️ À vider | **À faire** (ÉTAPE 2) |
| Reconnexion | ⚠️ À faire | **À faire** (ÉTAPE 3) |
| Trigger SQL | ✅ Préservé | Rien à faire |
| user_id NULL | ✅ Géré | Rien à faire |

---

## 📞 BESOIN D'AIDE ?

1. **Copiez l'erreur complète** de la console
2. **Notez le code d'erreur** (42501, 23503, etc.)
3. Consultez `GUIDE_CORRECTION_COMPLETE.md`
4. Vérifiez **Supabase Dashboard → Logs → Postgres Logs**

---

**Date** : 30 décembre 2024  
**Référence** : [cite: 2025-12-27]  
**Statut** : Prêt à tester ! 🚀

