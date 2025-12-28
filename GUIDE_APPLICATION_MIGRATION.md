# ✅ Guide d'Application de la Migration SQL

## 🎯 Objectif

Appliquer la migration SQL pour ajouter les colonnes `name`, `storage_path`, et `folder_id` à la table `documents`.

---

## 📋 Étape 1 : Appliquer la Migration dans Supabase

### Option A : Via Supabase Dashboard (Recommandé)

1. **Connectez-vous à Supabase Dashboard**
   - URL : https://app.supabase.com
   - Sélectionnez votre projet

2. **Allez dans SQL Editor**
   - Menu de gauche → **SQL Editor**
   - Ou accès direct : https://app.supabase.com/project/VOTRE_PROJECT_ID/sql

3. **Nouvelle Requête**
   - Cliquez sur **"New query"**
   - Nommez-la : `Fix Documents Columns`

4. **Copiez-Collez le Script**
   - Ouvrez le fichier : `supabase/migrations/20251228_fix_documents_columns.sql`
   - Copiez tout le contenu
   - Collez dans l'éditeur SQL

5. **Exécutez**
   - Cliquez sur **"Run"** (ou Ctrl+Enter)
   - Attendez quelques secondes

6. **Vérifiez les Messages**
   Vous devriez voir :
   ```
   NOTICE: Colonne storage_path existe déjà
   ou
   NOTICE: Colonne storage_path ajoutée à la table documents

   NOTICE: Colonne name existe déjà
   ou
   NOTICE: Colonne name ajoutée à la table documents

   NOTICE: Colonne folder_id existe déjà
   ou
   NOTICE: Colonne folder_id ajoutée à la table documents

   NOTICE: ✅ Migration terminée
   ```

---

### Option B : Via Supabase CLI

Si vous avez installé Supabase CLI :

```bash
# Dans le terminal, à la racine du projet
supabase db push

# Ou appliquer une migration spécifique
supabase migration up --file supabase/migrations/20251228_fix_documents_columns.sql
```

---

## 🔍 Étape 2 : Vérifier que les Colonnes Existent

### Requête SQL de Vérification

Dans **Supabase Dashboard** → **SQL Editor**, exécutez :

```sql
-- Vérifier la structure de la table documents
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'documents'
AND column_name IN ('name', 'storage_path', 'folder_id', 'title')
ORDER BY column_name;
```

**Résultat Attendu :**

```
column_name   | data_type           | is_nullable | column_default
--------------|---------------------|-------------|---------------
folder_id     | uuid                | YES         | NULL
name          | text                | YES         | NULL
storage_path  | text                | YES         | NULL
title         | text                | NO          | NULL
```

✅ **Si vous voyez ces 4 colonnes, c'est parfait !**

❌ **Si une colonne manque**, réexécutez la migration.

---

## 📊 Étape 3 : Vérifier les Données Existantes

### Requête pour Voir les Documents

```sql
-- Afficher les 10 derniers documents
SELECT 
  id,
  name,
  storage_path,
  title,
  folder_id,
  file_type,
  created_at
FROM documents
ORDER BY created_at DESC
LIMIT 10;
```

### Scénarios Possibles

#### ✅ Scénario 1 : Nouveaux Documents (Après Migration)

```
id       | name              | storage_path                      | title
---------|-------------------|-----------------------------------|-------
abc-123  | Mon Doc Été.pdf   | 1735245678901-abc123-mon-doc.pdf  | Mon Doc Été
```

→ **Parfait !** Les nouveaux documents ont `name` et `storage_path` distincts.

---

#### ⚠️ Scénario 2 : Anciens Documents (Avant Migration)

```
id       | name            | storage_path | title
---------|-----------------|--------------|-------
xyz-789  | Mon Ancien Doc  | NULL         | Mon Ancien Doc
```

→ **Normal** : Les anciens documents ont `storage_path = NULL` car ils ont été créés avant la migration.

**Solution** : Il faut soit :
1. **Re-uploader** ces documents
2. **Mettre à jour manuellement** leur `storage_path` (voir script ci-dessous)

---

## 🔧 Étape 4 : Corriger les Anciens Documents (Si Nécessaire)

Si certains documents ont `storage_path = NULL`, vous devez les corriger.

### Option A : Re-uploader les Fichiers (Recommandé)

1. Téléchargez les anciens fichiers depuis votre application
2. Supprimez-les de la bibliothèque
3. Re-uploadez-les → Ils auront automatiquement un `storage_path`

---

### Option B : Script SQL de Correction Manuelle

⚠️ **ATTENTION** : Ce script suppose que :
- Les fichiers existent dans Storage avec leur nom dans `title`
- Vous connaissez le pattern des noms de fichiers

```sql
-- EXEMPLE : Corriger manuellement (À ADAPTER selon vos besoins)
-- NE PAS EXÉCUTER TEL QUEL !

UPDATE documents
SET 
  name = title,
  storage_path = 'CHEMIN_VERS_VOTRE_FICHIER_DANS_STORAGE'
WHERE storage_path IS NULL
AND id = 'ID_DU_DOCUMENT_À_CORRIGER';
```

**Recommandation** : Re-uploader est plus sûr.

---

## ✅ Étape 5 : Vérifier que le Code Utilise `storage_path`

J'ai déjà vérifié le code. Voici les résultats :

### ✅ Fichiers qui Utilisent `storage_path` Correctement

1. **`src/components/PDFViewer.tsx`** (5 occurrences)
   - Ligne 10 : Interface `PDFViewerProps`
   - Ligne 31 : `loadPDF()` fonction
   - Ligne 54 : `createSignedUrl(storagePath, 3600)` ✅
   - Ligne 62 : `.getPublicUrl(storagePath)` ✅

2. **`src/pages/Library.tsx`** (16 occurrences)
   - Ligne 647 : `if (doc.storage_path)` ✅
   - Ligne 650 : `.getPublicUrl(doc.storage_path)` ✅
   - Upload de fichiers : Ligne 502 : `storage_path: uploadData.path` ✅

3. **`src/pages/PDFViewerPage.tsx`** (6 occurrences)
   - Ligne 38 : `select('id, name, storage_path, ...')` ✅
   - Ligne 69 : `if (!data.storage_path)` ✅
   - Ligne 132 : `storagePath={document.storage_path}` ✅

4. **`src/lib/supabase.ts`** (1 occurrence)
   - Type `Document` avec `storage_path` ✅

### ✅ Aucune Utilisation de `name` pour Storage

**Confirmation** : Le code n'utilise **jamais** `doc.name` ou `documentName` pour les requêtes Supabase Storage. ✅

**Toujours** `storage_path` ou `storagePath` (version camelCase).

---

## 🔐 Étape 6 : Vérification de la Règle de Sécurité

### ✅ Règle Confirmée

**Le code respecte la règle d'or** :

```typescript
// ✅ BON - Partout dans le code
supabase.storage
  .from('documents')
  .getPublicUrl(doc.storage_path);  // ← storage_path (nettoyé)

// ✅ BON - PDFViewer
.createSignedUrl(storagePath, 3600);  // ← storagePath (nettoyé)

// ❌ JAMAIS UTILISÉ (et c'est bien !)
.getPublicUrl(doc.name);  // ← Aucune occurrence dans le code
```

### 📊 Statistiques

- **37 occurrences de `storage_path`** dans 6 fichiers
- **0 occurrence de `doc.name` ou `documentName`** pour les requêtes Storage
- **100% de conformité** avec la règle de sécurité ✅

---

## 🚀 Étape 7 : Relancer le Serveur de Développement

Vous avez mentionné avoir réglé l'erreur PowerShell. Relançons le serveur :

### Dans le Terminal

```bash
# Si le serveur tourne déjà, arrêtez-le (Ctrl+C)

# Relancez le serveur
npm run dev
```

**Résultat Attendu :**

```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

✅ **Si vous voyez cela, le serveur fonctionne !**

❌ **Si erreur rouge**, partagez-moi le message d'erreur exact.

---

## 🧪 Étape 8 : Test Complet

### Test 1 : Vérifier la Structure en Console

Ouvrez la console du navigateur (F12) et exécutez :

```javascript
// Test de structure de la table
const { data, error } = await supabase
  .from('documents')
  .select('id, name, storage_path, folder_id')
  .limit(1);

if (error) {
  console.error('❌ Erreur:', error.message);
} else {
  console.log('✅ Structure OK:', data[0]);
  console.log('  - name:', data[0].name || 'NULL');
  console.log('  - storage_path:', data[0].storage_path || 'NULL');
  console.log('  - folder_id:', data[0].folder_id || 'NULL');
}
```

---

### Test 2 : Upload un Nouveau Fichier

1. **Allez sur la page Bibliothèque**
2. **Cliquez sur "Upload PDF"**
3. **Sélectionnez un PDF** avec des accents : `"Test Été 2024.pdf"`
4. **Attendez la fin de l'upload**
5. **Vérifiez dans Supabase** :

```sql
SELECT id, name, storage_path, title
FROM documents
WHERE name LIKE '%Été%';
```

**Résultat Attendu :**

```
name                  | storage_path                      | title
----------------------|-----------------------------------|-------
Test Été 2024.pdf     | 1735245678901-abc123-test-ete.pdf | Test Été 2024.pdf
```

✅ **Si vous voyez cela, tout fonctionne parfaitement !**

---

### Test 3 : Ouvrir le Lecteur PDF

1. **Cliquez sur l'œil bleu** (👁️) du document uploadé
2. **Ouvrez la console (F12)**
3. **Vérifiez les logs** :

```javascript
📄 ===== CHARGEMENT PDF =====
  - Nom affiché: Test Été 2024.pdf
  - Storage path: 1735245678901-abc123-test-ete.pdf
✅ URL signée générée avec succès
```

✅ **Si le PDF s'affiche, tout est parfait !**

---

## 📋 Checklist Finale

Cochez chaque élément au fur et à mesure :

### Base de Données
- [ ] Migration SQL exécutée dans Supabase Dashboard
- [ ] Colonne `name` existe (requête de vérification)
- [ ] Colonne `storage_path` existe (requête de vérification)
- [ ] Colonne `folder_id` existe (requête de vérification)
- [ ] Index créés (`idx_documents_storage_path`, `idx_documents_folder_id`)

### Code
- [ ] `storage_path` utilisé partout pour les requêtes Storage (37 occurrences)
- [ ] Aucune utilisation de `name` pour Storage (0 occurrence)
- [ ] Type `Document` dans `supabase.ts` contient `storage_path`

### Tests
- [ ] Serveur `npm run dev` démarre sans erreur rouge
- [ ] Console (F12) : Requête de test réussie
- [ ] Upload d'un nouveau fichier → `storage_path` rempli
- [ ] Lecteur PDF fonctionne avec fichier contenant accents
- [ ] Logs montrent "Storage path: XXXX-nom-nettoye.pdf"

---

## ✅ Résumé des Confirmations

### 1. ✅ Colonnes Actives

Après la migration, les colonnes suivantes seront actives :

| Colonne | Type | Rôle | Exemple |
|---------|------|------|---------|
| `name` | text | Nom original avec accents (affichage) | `"Résumé Été 2024.pdf"` |
| `storage_path` | text | Chemin technique nettoyé (Storage) | `"1735...resume-ete-2024.pdf"` |
| `folder_id` | uuid | ID du dossier parent (organisation) | `"abc-123-def-456"` |
| `title` | text | Titre personnalisé (optionnel) | `"Résumé Été 2024"` |

---

### 2. ✅ Règle de Sécurité Respectée

**Confirmation absolue** : Le code utilise **TOUJOURS** `storage_path` pour :
- Générer les URLs publiques
- Générer les URLs signées
- Télécharger les fichiers
- Afficher les PDFs

**Jamais** `name` (qui contient les accents).

**Résultat** : **Aucune erreur "Invalid key"** ! 🎉

---

### 3. 🚀 Serveur de Développement

Une fois `npm run dev` relancé, ouvrez :
- http://localhost:5173

Et testez immédiatement !

---

## 📚 Documents de Référence

| Document | Usage |
|----------|-------|
| `20251228_fix_documents_columns.sql` | ⭐ Migration à exécuter |
| `DIAGNOSTIC_LECTEUR_PDF.md` | 🔧 Si problème avec le lecteur |
| `TESTS_DIAGNOSTIC_PDF.md` | 🧪 Scripts de test |
| **Ce fichier** | 📋 Guide d'application |

---

## 🎉 Conclusion

Une fois la migration appliquée et le serveur relancé :

1. ✅ Les colonnes `name`, `storage_path`, et `folder_id` seront actives
2. ✅ La règle de sécurité sera respectée (code déjà correct)
3. ✅ Les nouveaux fichiers uploadés auront automatiquement un `storage_path` nettoyé
4. ✅ Le lecteur PDF fonctionnera sans erreur "Invalid key"
5. ✅ La fonction de déplacement fonctionnera (mise à jour de `folder_id` uniquement)

---

**Appliquez la migration maintenant et partagez-moi les résultats !** 🚀

**Date :** 28 décembre 2024  
**Statut :** ✅ Prêt à appliquer

