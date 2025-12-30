# 🔧 Correction du Bug Critique de Migration

## 🐛 Bug Identifié

**Ligne concernée :** `FIX_DOCUMENT_COLUMNS.sql:32-35`

**Problème :** La migration copiait simplement `file_url` vers `storage_path` sans nettoyage :
```sql
UPDATE documents 
SET storage_path = file_url 
WHERE storage_path IS NULL AND file_url IS NOT NULL;
```

**Impact :** Si les anciennes valeurs de `file_url` contenaient des accents ou caractères spéciaux (ex: `"Mon Document Été.pdf"`), cela violait la règle critique du projet et causait des erreurs **"Invalid key"** lors des appels à Supabase Storage.

## ✅ Correction Appliquée

### 1. Fonction de Nettoyage SQL
Création d'une fonction PostgreSQL `clean_file_path()` qui reproduit la logique de `generateUniqueFileName()` en TypeScript :

```sql
CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
RETURNS text AS $$
DECLARE
  cleaned text;
BEGIN
  -- Convertir en minuscules
  cleaned := LOWER(file_path);
  
  -- Remplacer les accents par leurs équivalents sans accent
  cleaned := unaccent(cleaned);
  
  -- Remplacer espaces et underscores par des tirets
  cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
  
  -- Supprimer caractères spéciaux
  cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
  
  -- Nettoyer les tirets multiples
  cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
  cleaned := TRIM(BOTH '-' FROM cleaned);
  
  RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### 2. Activation de l'Extension `unaccent`
```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
```
Cette extension PostgreSQL permet de transformer les caractères accentués en leurs équivalents non accentués.

### 3. Migration Corrigée
```sql
UPDATE documents 
SET storage_path = clean_file_path(file_url)  -- ✅ Nettoyage appliqué
WHERE storage_path IS NULL AND file_url IS NOT NULL;
```

## 📊 Exemples de Transformation

| Avant (`file_url`)                  | Après (`storage_path`)              |
|-------------------------------------|-------------------------------------|
| `Mon Document Été 2024.pdf`         | `mon-document-ete-2024.pdf`         |
| `Virologie_Général #1.pdf`          | `virologie-general-1.pdf`           |
| `Cours (partie 1) & notes.pdf`      | `cours-partie-1-notes.pdf`          |
| `Présentation Français.docx`        | `presentation-francais.docx`        |

## ⚠️ Attention

**Si vous aviez des fichiers existants dans Supabase Storage :**

Les anciens fichiers dans le Storage conservent leurs noms originaux avec accents. Après la migration, les `storage_path` en base de données seront nettoyés, mais les fichiers physiques dans le Storage auront toujours leurs anciens noms.

**Solutions :**
1. **Option recommandée :** Re-uploader les documents via l'application (la nouvelle logique gérera tout correctement)
2. **Option manuelle :** Renommer les fichiers dans Supabase Storage pour correspondre aux nouveaux `storage_path`
3. **Option technique :** Créer un script qui télécharge, renomme et re-uploade automatiquement les fichiers

## 🎯 Conformité aux Règles

Cette correction respecte désormais la **RÈGLE CRITIQUE** du projet (`.cursorrules`) :

> **Les noms de fichiers originaux ne doivent JAMAIS servir de clé (path) pour Supabase Storage.**
> 
> Les accents, espaces et caractères spéciaux causent des erreurs `Invalid key` avec Supabase Storage.

## 📝 Fichiers Modifiés

- ✅ `FIX_DOCUMENT_COLUMNS.sql` - Migration SQL corrigée

## 🚀 Prochaines Étapes

1. Exécuter le script SQL corrigé dans Supabase Dashboard
2. Vérifier que tous les `storage_path` sont bien nettoyés
3. Tester l'upload de nouveaux documents
4. (Optionnel) Re-uploader les anciens documents si nécessaire

---

**Date de correction :** 30 décembre 2024  
**Bug reporté par :** User  
**Sévérité :** 🔴 CRITIQUE (erreurs "Invalid key" à venir)

