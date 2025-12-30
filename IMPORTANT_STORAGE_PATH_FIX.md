# 🔴 CORRECTION CRITIQUE : storage_path

## ⚠️ Pourquoi cette correction est OBLIGATOIRE ?

### Le Problème
Supabase Storage rejette les clés de fichiers contenant :
- ❌ Accents : `é`, `è`, `à`, `ç`, etc.
- ❌ Espaces : `Mon Document.pdf`
- ❌ Caractères spéciaux : `#`, `&`, `()`, `[]`, etc.

**Erreur renvoyée :** `Invalid key`

### Exemple Concret

```typescript
// ❌ MAUVAIS - Causera une erreur "Invalid key"
const path = "Mon Document Été 2024.pdf";
await supabase.storage.from('documents').download(path);
// ❌ Erreur: Invalid key

// ✅ BON - Fonctionne parfaitement
const path = "mon-document-ete-2024.pdf";
await supabase.storage.from('documents').download(path);
// ✅ Succès
```

### Ce que fait la Correction

**Avant (DANGEREUX) :**
```sql
UPDATE documents 
SET storage_path = file_url;
-- Si file_url = "Cours Été.pdf"
-- Alors storage_path = "Cours Été.pdf" ❌ ERREUR !
```

**Après (SÉCURISÉ) :**
```sql
UPDATE documents 
SET storage_path = clean_file_path(file_url);
-- Si file_url = "Cours Été.pdf"
-- Alors storage_path = "cours-ete.pdf" ✅ OK !
```

## 🔧 La Fonction `clean_file_path()`

```sql
CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
RETURNS text AS $$
DECLARE
  cleaned text;
BEGIN
  cleaned := LOWER(file_path);                          -- Minuscules
  cleaned := unaccent(cleaned);                         -- Supprime accents
  cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');    -- Espaces → tirets
  cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g'); -- Supprime spéciaux
  cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');        -- Nettoie tirets
  cleaned := TRIM(BOTH '-' FROM cleaned);                    -- Nettoie bords
  
  RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

## 📊 Exemples de Transformations

| Input (file_url)                  | Output (storage_path)              |
|-----------------------------------|------------------------------------|
| `Mon Document Été 2024.pdf`       | `mon-document-ete-2024.pdf`        |
| `Virologie_Général #1.pdf`        | `virologie-general-1.pdf`          |
| `Cours (partie 1) & notes.pdf`    | `cours-partie-1-notes.pdf`         |
| `Présentation Français.docx`      | `presentation-francais.docx`       |
| `Archive___Multiple___Spaces.pdf` | `archive-multiple-spaces.pdf`      |

## 🎯 Conformité aux Règles du Projet

Cette correction respecte la **RÈGLE CRITIQUE** du fichier `.cursorrules` :

> **Les noms de fichiers originaux ne doivent JAMAIS servir de clé (path) pour Supabase Storage.**
>
> Les accents, espaces et caractères spéciaux causent des erreurs `Invalid key` avec Supabase Storage.
>
> **TOUJOURS utiliser `generateUniqueFileName()` pour créer `storage_path`.**

## 🚀 Comment Appliquer la Correction

1. **Ouvrez Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Ouvrez SQL Editor**
   - Menu latéral → "SQL Editor"

3. **Exécutez le script**
   - Copiez le contenu de `FIX_DOCUMENT_COLUMNS.sql`
   - Collez dans l'éditeur SQL
   - Cliquez sur "Run"

4. **Vérifiez le résultat**
   - Vous devriez voir : "✅ Colonne storage_path ajoutée avec chemins nettoyés"

## ⚠️ Important à Savoir

### Si vous avez des documents existants dans Storage

Les fichiers physiques dans Supabase Storage gardent leurs noms originaux. Après la migration :
- ✅ **Base de données** : `storage_path` nettoyé (`cours-ete.pdf`)
- ❌ **Storage (fichier physique)** : Nom original possible (`Cours Été.pdf`)

**Conséquence :** Si les noms diffèrent, l'application ne pourra pas télécharger ces anciens fichiers.

### Solutions Possibles

**Option 1 : Re-uploader les documents (RECOMMANDÉ)**
- Les nouveaux uploads utiliseront automatiquement des chemins propres
- Les fichiers seront correctement liés

**Option 2 : Renommer manuellement dans Storage**
- Allez dans Supabase Storage
- Renommez chaque fichier pour correspondre au `storage_path` en BDD

**Option 3 : Script de migration automatique**
- Créer un script qui télécharge, renomme et re-uploade tous les fichiers
- Plus complexe mais automatise le processus

## ✅ Vérification Post-Migration

Pour vérifier que tout fonctionne :

```sql
-- Vérifier que tous les storage_path sont propres
SELECT 
  id,
  name,
  storage_path,
  CASE 
    WHEN storage_path ~ '[^a-z0-9\-\.]' THEN '❌ Contient caractères invalides'
    WHEN storage_path ~ '[A-Z]' THEN '❌ Contient majuscules'
    ELSE '✅ Propre'
  END as status
FROM documents
WHERE storage_path IS NOT NULL
ORDER BY status DESC;
```

**Si tous les résultats montrent "✅ Propre", la migration a réussi !**

## 📞 En Cas de Problème

Si après la migration vos documents ne se téléchargent plus :
1. Vérifiez que `storage_path` en BDD correspond aux noms dans Storage
2. Consultez les logs de votre application pour voir les chemins demandés
3. Re-uploadez les documents problématiques via l'interface

---

**Date de création :** 30 décembre 2024  
**Priorité :** 🔴 CRITIQUE  
**Impact si non appliqué :** Erreurs "Invalid key" sur tous les documents avec accents

