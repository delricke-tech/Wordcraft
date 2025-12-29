# 🚀 Guide de Migration PDF → extracted_text

**Date:** 29 décembre 2024  
**Objectif:** Remplir la colonne `extracted_text` pour que l'IA puisse répondre

## 📋 Problème Résolu

**Situation:** La colonne `extracted_text` est vide dans la table `public.documents`  
**Conséquence:** L'IA ne peut pas répondre car elle n'a pas accès au contenu des PDFs  
**Solution:** Migration automatique qui extrait le texte de tous les PDFs

## 🎯 Solution Implémentée

### 1. Service d'Extraction (`pdfExtractor.ts`)
✅ **Créé et fonctionnel**
- Télécharge les PDFs depuis Supabase Storage
- Utilise `storage_path` (sans accents) pour éviter "Invalid key"
- Extrait le texte avec `pdfjs-dist`
- Nettoie et optimise pour l'IA

### 2. Service de Migration (`migratePDFContent.ts`)
✅ **Créé et fonctionnel**
- Parcourt tous les documents PDF
- Extrait le texte de chaque document
- Met à jour la colonne `extracted_text`
- Gère les erreurs et affiche la progression

### 3. Interface Utilisateur (`MigrationPDF.tsx`)
✅ **Créée et accessible**
- Page dédiée à la migration
- Affichage de la progression en temps réel
- Statistiques détaillées
- Gestion des erreurs

## 🚀 Comment Utiliser

### Étape 1 : Accéder à la Page de Migration

```
URL: http://localhost:5173/migration-pdf
```

Ou ajoutez un lien dans votre menu de navigation.

### Étape 2 : Lancer la Migration

1. Cliquez sur **"Lancer la migration"**
2. La migration démarre automatiquement
3. Suivez la progression en temps réel :
   - Barre de progression
   - Nombre de documents traités
   - Document en cours
   - Statistiques (réussis/échoués)

### Étape 3 : Vérifier les Résultats

**En cas de succès :**
- ✅ Tous les documents ont leur texte extrait
- ✅ La colonne `extracted_text` est remplie
- ✅ L'IA peut maintenant répondre avec le contenu

**En cas d'erreurs :**
- ⚠️ Liste des documents échoués
- ⚠️ Raison de chaque erreur
- ⚠️ Possibilité de relancer

## 🔍 Vérification en Base de Données

```sql
-- Vérifier combien de documents ont du texte extrait
SELECT 
  COUNT(*) as total,
  COUNT(extracted_text) as avec_texte,
  COUNT(*) - COUNT(extracted_text) as sans_texte
FROM documents 
WHERE file_type = 'pdf';

-- Voir les documents sans texte
SELECT id, name, storage_path, extracted_text
FROM documents 
WHERE file_type = 'pdf' 
AND (extracted_text IS NULL OR extracted_text = '');

-- Voir un exemple de texte extrait
SELECT 
  name,
  LEFT(extracted_text, 200) as apercu,
  LENGTH(extracted_text) as taille_texte
FROM documents 
WHERE extracted_text IS NOT NULL
LIMIT 5;
```

## 📊 Processus Détaillé

```
1. Récupération des documents
   ↓
   SELECT * FROM documents 
   WHERE file_type = 'pdf' 
   AND (extracted_text IS NULL OR extracted_text = '')
   
2. Pour chaque document
   ↓
   a) Vérifier storage_path existe
   b) Télécharger depuis Supabase Storage (storage_path)
   c) Extraire texte avec pdfjs-dist
   d) Nettoyer et optimiser le texte
   
3. Mise à jour BDD
   ↓
   UPDATE documents 
   SET 
     extracted_text = [texte extrait],
     page_count = [nombre de pages],
     processing_status = 'completed'
   WHERE id = [document_id]
   
4. Résultat
   ↓
   L'IA peut maintenant utiliser extracted_text
```

## ✅ Règles Respectées

### 1. Utilisation de storage_path
```typescript
// ✅ BON - Utilise storage_path (sans accents)
await extractPDFFromStorage(document.storage_path);
// "1735-abc-cours-ete-2024.pdf"

// ❌ MAUVAIS - Utiliserait name (avec accents)
await extractPDFFromStorage(document.name);
// "Cours Été 2024.pdf" → Invalid key
```

### 2. Affichage avec name
```typescript
// Interface : Affiche le nom avec accents
<h3>{document.name}</h3>
// "Cours Été 2024.pdf" ✓

// Extraction : Utilise le chemin sans accents
extractPDFFromStorage(document.storage_path)
// "1735-abc-cours-ete-2024.pdf" ✓
```

## 🎨 Interface de Migration

### Avant Migration
```
┌─────────────────────────────────────┐
│  Migration PDF → extracted_text     │
├─────────────────────────────────────┤
│                                     │
│  [Lancer la migration]              │
│                                     │
│  Cette page extrait le texte de     │
│  tous vos PDFs...                   │
└─────────────────────────────────────┘
```

### Pendant Migration
```
┌─────────────────────────────────────┐
│  Progression: 65%                   │
│  ████████████░░░░░░░░░░              │
│                                     │
│  Total: 10  Traités: 6             │
│  Réussis: 5  Échoués: 1            │
│                                     │
│  En cours...                        │
│  📄 Cours Virologie Été 2024.pdf   │
└─────────────────────────────────────┘
```

### Après Migration
```
┌─────────────────────────────────────┐
│  ✅ Migration réussie !             │
│                                     │
│  10 documents traités               │
│  9 réussis, 1 échoué                │
│                                     │
│  ⚠️ Erreurs (1):                    │
│  - Document X: Pas de storage_path  │
│                                     │
│  [Relancer une migration]           │
└─────────────────────────────────────┘
```

## 🐛 Résolution de Problèmes

### Erreur : "Pas de storage_path"
**Cause:** Le document n'a pas de `storage_path` en BDD  
**Solution:** 
1. Vérifiez que la migration `20251228_fix_documents_columns.sql` est exécutée
2. Re-uploadez le document si nécessaire

### Erreur : "Impossible de télécharger le PDF"
**Cause:** Le fichier n'existe pas dans Supabase Storage  
**Solution:**
1. Vérifiez dans Supabase Dashboard → Storage → documents
2. Le fichier doit avoir le nom du `storage_path`

### Erreur : "Échec de l'extraction du texte"
**Cause:** PDF corrompu ou protégé  
**Solution:**
1. Vérifiez que le PDF s'ouvre correctement
2. Si protégé par mot de passe, déverrouillez-le d'abord

### Migration lente
**Normal:** L'extraction prend ~2-5 secondes par document  
**Optimisation:** Un délai de 500ms est ajouté entre chaque document pour éviter de surcharger

## 📁 Fichiers Créés

| Fichier | Description |
|---------|-------------|
| `src/services/pdfExtractor.ts` | ✅ Service d'extraction PDF |
| `src/services/migratePDFContent.ts` | ✅ Logique de migration |
| `src/pages/MigrationPDF.tsx` | ✅ Interface utilisateur |
| `src/App.tsx` | ✅ Route ajoutée `/migration-pdf` |

## 🎯 Après la Migration

### L'IA Pourra :
1. ✅ Lire le contenu des PDFs via `extracted_text`
2. ✅ Répondre aux questions sur les documents
3. ✅ Générer des résumés précis
4. ✅ Créer des quiz basés sur le contenu
5. ✅ Analyser et comparer plusieurs documents

### Utilisation dans le Code :
```typescript
// Récupérer le texte d'un document
const { data: doc } = await supabase
  .from('documents')
  .select('name, extracted_text')
  .eq('id', documentId)
  .single();

// Envoyer à l'IA
const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    {
      role: 'system',
      content: `Tu es un assistant qui aide avec le document "${doc.name}".
      
Contenu du document:
${doc.extracted_text}`
    },
    {
      role: 'user',
      content: 'Fais-moi un résumé'
    }
  ]
});
```

## ✅ Checklist Finale

- [x] Service `pdfExtractor.ts` créé
- [x] Service `migratePDFContent.ts` créé
- [x] Page `MigrationPDF.tsx` créée
- [x] Route `/migration-pdf` ajoutée
- [x] Utilisation de `storage_path` (sans accents)
- [x] Affichage de `name` (avec accents)
- [x] Gestion des erreurs
- [x] Progression en temps réel
- [x] Aucune erreur de linting

## 🚀 Prêt à Utiliser !

**Accédez maintenant à :** http://localhost:5173/migration-pdf

**Temps estimé :** 2-5 secondes par document

**Une fois terminé :** L'IA pourra répondre en utilisant le contenu de vos PDFs ! 🎉

---

**Note:** Cette migration est idempotente - vous pouvez la relancer sans problème, elle ne traitera que les documents sans `extracted_text`.

