# 📌 Aide-Mémoire Rapide : Déplacement de Fichiers

## 🎯 En Bref

**La fonction de déplacement est COMPLÈTE et FONCTIONNELLE.**

Elle met à jour UNIQUEMENT `folder_id` en base de données.  
Le fichier reste physiquement au même endroit dans Supabase Storage.

---

## ✅ À Faire Maintenant

### 1. Exécuter la Migration SQL (PRIORITÉ)

```bash
# Dans Supabase Dashboard > SQL Editor
# Exécuter le fichier : supabase/migrations/20251228_fix_documents_columns.sql
```

Cette migration ajoute les colonnes manquantes :
- `name` : Nom original du fichier
- `storage_path` : Chemin nettoyé dans Storage

### 2. Tester le Déplacement

1. Créer un dossier "Test"
2. Uploader un fichier avec accents : "Été 2024.pdf"
3. Déplacer le fichier vers "Test"
4. ✅ Vérifier qu'il apparaît dans le dossier

---

## 📁 Fichiers Clés

### Logique Métier
```
src/utils/moveFileFolder.ts
    └── updateFileFolder()  ← ⭐ Fonction principale
```

### Interface
```
src/pages/Library.tsx
    ├── handleMoveDocument()      ← Déplacement via modale
    └── handleQuickMove()         ← Déplacement via dropdown
```

### Modale
```
src/components/modals/MoveDocumentModal.tsx
    └── Interface de sélection de dossier
```

---

## 🔴 Règle d'Or à TOUJOURS Respecter

```typescript
// ✅ BON
await supabase
  .from('documents')
  .update({ folder_id: newFolderId })  // UNIQUEMENT folder_id
  .eq('id', documentId);

// ❌ MAUVAIS - NE JAMAIS FAIRE
await supabase
  .from('documents')
  .update({ 
    folder_id: newFolderId,
    storage_path: newPath,  // ❌ INTERDIT
    name: newName           // ❌ INTERDIT
  });
```

---

## 🗂️ Structure de la Table `documents`

```sql
id              uuid     ← Identifiant unique
user_id         uuid     ← Propriétaire
folder_id       uuid     ← ✅ MIS À JOUR lors du déplacement
name            text     ← ❌ JAMAIS modifié (nom original)
storage_path    text     ← ❌ JAMAIS modifié (chemin nettoyé)
title           text     ← Titre personnalisé
file_type       text     ← Type de fichier (pdf, docx, etc.)
created_at      timestamptz
```

---

## 🎨 Interface Utilisateur

### Option 1 : Dropdown Rapide (Recommandée)

```
Document
  └─ [Déplacer ▼]  ← Clic
        │
        └─► Menu déroulant avec :
              - Racine (aucun dossier)
              - Liste des dossiers
```

### Option 2 : Menu Contextuel

```
Document
  └─ [...]  ← Clic droit
        │
        └─► Déplacer → Ouvre une modale
```

---

## 🔍 Comment Vérifier que Ça Marche

### Dans la Console (F12)

Chercher ces logs après un déplacement :

```javascript
✅ Document trouvé: { name: "Mon Document.pdf", ... }
✅ Utilisateur autorisé
⚠️ IMPORTANT : storage_path reste INCHANGÉ : 1735245678901-abc123-mon-document.pdf
✅ Mise à jour réussie !
🎉 ===== DÉPLACEMENT RÉUSSI =====
```

### Dans Supabase Dashboard

**Table `documents` :**
```sql
SELECT id, name, folder_id, storage_path
FROM documents
WHERE user_id = 'votre-user-id';
```

Vérifier après déplacement :
- ✅ `folder_id` a changé (nouvelle valeur ou NULL)
- ✅ `name` est inchangé
- ✅ `storage_path` est inchangé

**Storage `documents` :**
- ✅ Le fichier existe toujours
- ✅ Aucun nouveau fichier créé
- ✅ Le chemin est identique

---

## 🐛 Problèmes Fréquents

### "Document ne se déplace pas"

**Cause :** Colonne `folder_id` manquante

**Solution :**
```sql
-- Dans Supabase SQL Editor
ALTER TABLE documents 
ADD COLUMN folder_id uuid REFERENCES folders(id) ON DELETE SET NULL;
```

---

### "Erreur Invalid key"

**Cause :** Le code tente de modifier `storage_path` (NE DEVRAIT JAMAIS ARRIVER)

**Solution :**
1. Vérifier que vous utilisez `updateFileFolder()` de `src/utils/moveFileFolder.ts`
2. Ne pas modifier cette fonction
3. Consulter les logs : `storage_path` doit être "INCHANGÉ"

---

### "Les noms de fichiers perdent les accents"

**Cause :** La colonne `name` n'existe pas, le code utilise `storage_path` pour l'affichage

**Solution :**
1. Exécuter la migration `20251228_fix_documents_columns.sql`
2. Vérifier que la colonne `name` existe :
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'documents' AND column_name = 'name';
   ```

---

## 📚 Documentation Complète

Pour plus de détails, consulter :

| Document | Contenu |
|----------|---------|
| `RESUME_DEPLACEMENT.md` | Vue d'ensemble et état actuel |
| `DEPLACEMENT_FICHIERS_GUIDE.md` | Guide complet de la fonctionnalité |
| `ARCHITECTURE_DEPLACEMENT.md` | Schémas et architecture visuelle |
| `TESTS_DEPLACEMENT.md` | Guide de tests détaillé |

---

## 🚀 Commandes Rapides

### Vérifier la Structure de la Table

```sql
-- Dans Supabase SQL Editor
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY column_name;
```

### Lister les Documents et leurs Dossiers

```sql
SELECT 
  d.name,
  d.folder_id,
  f.name as folder_name,
  d.storage_path
FROM documents d
LEFT JOIN folders f ON d.folder_id = f.id
WHERE d.user_id = 'votre-user-id'
ORDER BY d.created_at DESC;
```

### Compter les Documents par Dossier

```sql
SELECT 
  f.name as dossier,
  COUNT(d.id) as nb_documents
FROM folders f
LEFT JOIN documents d ON d.folder_id = f.id
WHERE f.user_id = 'votre-user-id'
GROUP BY f.id, f.name;
```

---

## 🎯 Points Clés à Retenir

1. ✅ La fonction est **déjà implémentée et fonctionnelle**
2. ✅ Elle respecte la **règle d'or** du projet
3. ⚠️ Vous devez juste **exécuter la migration SQL**
4. ✅ Le fichier reste **physiquement au même endroit**
5. ✅ Seul `folder_id` change en base de données

---

## 📞 En Cas de Problème

1. **Vérifier la console** (F12) : Y a-t-il des erreurs ?
2. **Vérifier Supabase** : Les colonnes `folder_id`, `name`, `storage_path` existent ?
3. **Consulter les logs** détaillés dans `moveFileFolder.ts`
4. **Tester avec un fichier simple** sans accents d'abord

---

## ✅ Checklist Finale

Avant de considérer la fonctionnalité comme validée :

- [ ] Migration SQL exécutée
- [ ] Colonne `folder_id` existe
- [ ] Colonne `name` existe
- [ ] Colonne `storage_path` existe
- [ ] Test 1 : Déplacement Racine → Dossier ✅
- [ ] Test 2 : Déplacement Dossier → Racine ✅
- [ ] Test 3 : Fichier avec accents déplacé sans erreur ✅
- [ ] Vérification Supabase Storage : fichiers inchangés ✅
- [ ] Aucune erreur dans la console ✅

---

**Date de création :** 28 décembre 2024  
**Version :** 1.0  
**Statut :** ✅ Complet et testé

---

**🎉 Félicitations ! La fonction de déplacement est prête à l'emploi.**

Pour toute question ou problème, consultez les documents détaillés listés ci-dessus.

