# 🔧 Guide de Correction CORS et Insertion BDD

## Problème Identifié
- ✅ Upload vers Storage fonctionne
- ❌ Insertion en table `documents` échoue (CORS ou autre erreur)
- ❌ Table reste vide

## Vérifications Effectuées

### 1. ✅ URL Supabase (pas de slash final)
```
VITE_SUPABASE_URL=https://uexuecubafgfhpfebknt.supabase.co
```
→ **Correct** : Pas de `/` à la fin

### 2. Variables d'environnement détectées
```env
VITE_SUPABASE_URL=https://uexuecubafgfhpfebknt.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_W8LyatUUDO_INLxJ6FiAHg_mdt7EYpI
VITE_OPENAI_API_KEY=sk-proj-...
```

## Solutions à Appliquer

### Solution 1 : Vérifier les Politiques RLS dans Supabase

**IMPORTANT** : L'erreur CORS peut être causée par les Row Level Security (RLS) policies qui bloquent l'insertion.

#### Action à faire dans Supabase Dashboard :

1. Allez dans **Authentication → Policies** pour la table `documents`
2. Ajoutez une politique INSERT pour utilisateurs anonymes :

```sql
-- Politique pour permettre les insertions (avec ou sans user_id)
CREATE POLICY "Allow INSERT for all users"
ON documents
FOR INSERT
TO public
WITH CHECK (true);

-- OU si vous voulez limiter aux utilisateurs authentifiés :
CREATE POLICY "Allow INSERT for authenticated users"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
```

3. Vérifiez que RLS est activé :
```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
```

### Solution 2 : Vider le Cache et Actualiser le Token

**Action dans le code** :

Votre `AuthContext.tsx` gère déjà correctement le user actuel, mais pour forcer un refresh :

1. Ouvrez la console DevTools (F12)
2. Onglet **Application** → **Local Storage** → Supprimez tout
3. Rechargez la page (Ctrl + Shift + R)
4. Reconnectez-vous avec votre nouveau compte

### Solution 3 : Logs Détaillés pour Identifier l'Erreur

Ajoutez des logs détaillés dans `Library.tsx` pour voir l'erreur exacte.

---

## 🔍 Checklist de Débogage

### Dans la Console du Navigateur (F12) :

Lors de l'upload, vous devriez voir :

```
✅ Fichier uploadé avec succès vers Storage
  - Path retourné par Supabase Storage: ...

💾 Insertion en BDD (APRÈS upload): { ... }
  - Le trigger SQL va normaliser storage_path automatiquement

❌ Erreur lors de l'enregistrement en BDD: ...  ← REGARDEZ ICI
  - Code: ...
  - Message: ...
  - Détails: ...
```

### Erreurs CORS Typiques :

| Message d'erreur | Cause | Solution |
|-----------------|-------|----------|
| `CORS policy: No 'Access-Control-Allow-Origin'` | Mauvaise URL ou RLS trop strict | Vérifier URL + Policies RLS |
| `Failed to fetch` | Problème réseau ou URL incorrecte | Vérifier connexion + URL |
| `403 Forbidden` | Pas d'autorisation RLS | Ajouter politique INSERT |
| `401 Unauthorized` | Token invalide ou expiré | Se reconnecter |
| `400 Bad Request` | user_id invalide ou contrainte violée | Vérifier user_id |

---

## 🛠️ Modifications du Code

Les modifications suivantes ont été préparées pour garantir que tout fonctionne.

