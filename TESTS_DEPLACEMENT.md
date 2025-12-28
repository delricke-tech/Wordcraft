# 🧪 Guide de Test : Fonction de Déplacement

## 🎯 Objectif des Tests

Vérifier que la fonction de déplacement respecte la règle d'or :
- ✅ Met à jour `folder_id` uniquement
- ❌ Ne modifie JAMAIS `storage_path` ou `name`
- ✅ Le fichier reste physiquement au même endroit dans Supabase Storage

---

## 📋 Prérequis

Avant de commencer les tests :

1. ✅ Migration SQL exécutée (`20251228_fix_documents_columns.sql`)
2. ✅ Au moins 1 dossier créé dans l'application
3. ✅ Au moins 1 fichier uploadé (de préférence avec accents/espaces)
4. ✅ Console du navigateur ouverte (F12) pour voir les logs

---

## 🔬 Série de Tests

### Test 1 : Déplacement Simple (Racine → Dossier)

#### Étapes

1. **Préparation**
   - Créer un dossier "Test Médecine"
   - Uploader un fichier "Cours Été 2024.pdf" à la racine

2. **Action**
   - Sur la page Bibliothèque, rester sur la vue "Racine"
   - Cliquer sur le bouton "Déplacer" du document
   - Sélectionner "Test Médecine" dans le dropdown

3. **Résultats Attendus**
   - ✅ Le document disparaît de la vue Racine
   - ✅ Toast affiché : "Fichier déplacé ! 'Cours Été 2024.pdf' a été déplacé avec succès"
   - ✅ Ouvrir le dossier "Test Médecine" → le document y apparaît
   - ✅ Aucune erreur dans la console

4. **Vérification Technique**

   **Dans la console du navigateur :**
   ```javascript
   🔄 ===== DÉBUT DÉPLACEMENT =====
   📄 File ID: abc-123-def-456
   📁 New Folder ID: folder-test-medecine
   🔍 Étape 1 : Vérification du document...
   ✅ Document trouvé: { name: "Cours Été 2024.pdf", ... }
   🔄 Étape 3 : Mise à jour du folder_id...
   ⚠️ IMPORTANT : storage_path reste INCHANGÉ : 1735245678901-abc123-cours-ete-2024.pdf
   ✅ Mise à jour réussie !
   🎉 ===== DÉPLACEMENT RÉUSSI =====
   ```

   **Dans Supabase Dashboard > Table Editor > documents :**
   ```
   Avant :
   id: abc-123
   name: "Cours Été 2024.pdf"
   folder_id: NULL
   storage_path: "1735245678901-abc123-cours-ete-2024.pdf"

   Après :
   id: abc-123
   name: "Cours Été 2024.pdf"              ← ✅ INCHANGÉ
   folder_id: "folder-test-medecine"        ← ✅ MODIFIÉ
   storage_path: "1735245678901-abc123-cours-ete-2024.pdf"  ← ✅ INCHANGÉ
   ```

   **Dans Supabase Dashboard > Storage > documents :**
   - ✅ Le fichier `1735245678901-abc123-cours-ete-2024.pdf` existe toujours
   - ✅ Aucun nouveau fichier créé
   - ✅ Aucun fichier supprimé

---

### Test 2 : Déplacement Inverse (Dossier → Racine)

#### Étapes

1. **Préparation**
   - Utiliser le document du Test 1 (maintenant dans "Test Médecine")

2. **Action**
   - Ouvrir le dossier "Test Médecine"
   - Cliquer sur "Déplacer" sur le document
   - Sélectionner "Racine (aucun dossier)"

3. **Résultats Attendus**
   - ✅ Le document disparaît du dossier "Test Médecine"
   - ✅ Toast affiché : "Fichier déplacé !"
   - ✅ Retourner à la Racine → le document y réapparaît
   - ✅ Aucune erreur dans la console

4. **Vérification Technique**

   **Dans la console :**
   ```javascript
   🔄 ===== DÉBUT DÉPLACEMENT =====
   📁 New Folder ID: RACINE
   ⚠️ IMPORTANT : storage_path reste INCHANGÉ : 1735245678901-abc123-cours-ete-2024.pdf
   🎉 ===== DÉPLACEMENT RÉUSSI =====
   ```

   **Dans Supabase :**
   ```
   name: "Cours Été 2024.pdf"              ← ✅ INCHANGÉ
   folder_id: NULL                          ← ✅ MODIFIÉ (NULL = racine)
   storage_path: "1735245678901-abc123-cours-ete-2024.pdf"  ← ✅ INCHANGÉ
   ```

---

### Test 3 : Déplacement avec Caractères Spéciaux

#### Objectif
Vérifier que les noms de fichiers avec accents, espaces, et caractères spéciaux ne causent pas d'erreur.

#### Étapes

1. **Préparation**
   - Créer un dossier "Virologie Générale"
   - Uploader un fichier avec un nom complexe : `"Résumé #1 (Partie 1) & Notes.pdf"`

2. **Action**
   - Déplacer le fichier vers "Virologie Générale"

3. **Résultats Attendus**
   - ✅ Déplacement réussi sans erreur
   - ✅ Le nom original "Résumé #1 (Partie 1) & Notes.pdf" est toujours affiché
   - ✅ Aucune erreur `Invalid key` dans la console

4. **Vérification Technique**

   **Dans Supabase Storage :**
   - ✅ Le fichier existe avec un nom nettoyé :
     ```
     1735245678901-abc123-resume-1-partie-1-notes.pdf
     ```
   - ✅ Le chemin n'a PAS changé après le déplacement

   **Dans la table documents :**
   ```
   name: "Résumé #1 (Partie 1) & Notes.pdf"   ← ✅ Nom original préservé
   folder_id: "folder-virologie"               ← ✅ Mis à jour
   storage_path: "1735...resume-1-partie-1..." ← ✅ Chemin nettoyé inchangé
   ```

---

### Test 4 : Déplacement Multiple Rapide

#### Objectif
Vérifier que plusieurs déplacements consécutifs fonctionnent sans conflit.

#### Étapes

1. **Préparation**
   - Créer 3 dossiers : "Dossier A", "Dossier B", "Dossier C"
   - Avoir 1 document à la racine

2. **Actions**
   - Déplacer le document : Racine → Dossier A
   - Immédiatement après : Dossier A → Dossier B
   - Immédiatement après : Dossier B → Dossier C

3. **Résultats Attendus**
   - ✅ Tous les déplacements réussissent
   - ✅ Le document finit dans "Dossier C"
   - ✅ Aucun conflit ou erreur de concurrence
   - ✅ Les logs montrent les 3 déplacements

4. **Vérification Technique**

   **Dans la console :**
   ```javascript
   // Déplacement 1
   📁 New Folder ID: dossier-a
   ✅ Mise à jour réussie !

   // Déplacement 2
   📁 New Folder ID: dossier-b
   ✅ Mise à jour réussie !

   // Déplacement 3
   📁 New Folder ID: dossier-c
   ✅ Mise à jour réussie !
   ```

   **État final :**
   ```
   folder_id: "dossier-c"                    ← ✅ Valeur finale correcte
   storage_path: "1735..."                   ← ✅ Toujours le même
   ```

---

### Test 5 : Déplacement vers le Même Dossier

#### Objectif
Vérifier que déplacer un document vers son dossier actuel est géré correctement.

#### Étapes

1. **Préparation**
   - Avoir un document dans "Dossier Test"

2. **Action**
   - Ouvrir "Dossier Test"
   - Cliquer sur "Déplacer" sur le document
   - Sélectionner "Dossier Test" (le même dossier)

3. **Résultats Attendus**
   - ✅ Toast informatif : "Le document est déjà dans ce dossier"
   - ✅ Aucune requête SQL inutile
   - ✅ L'interface reste inchangée

4. **Vérification Technique**

   **Dans la console :**
   ```javascript
   🔍 Étape 3 : Vérifier si le déplacement est nécessaire
   ℹ️ Le document est déjà dans ce dossier
   ```

---

### Test 6 : Sécurité (Tentative de Déplacement d'un Document d'un Autre Utilisateur)

#### Objectif
Vérifier que la sécurité RLS empêche de déplacer les documents d'autres utilisateurs.

#### Préparation Spéciale

**Option 1 : Avec 2 comptes**
1. Créer 2 comptes utilisateurs
2. User A upload un document
3. Se connecter avec User B

**Option 2 : Avec la console du navigateur**
1. Ouvrir la console
2. Récupérer l'ID d'un document
3. Tenter de le déplacer avec un `user_id` différent

#### Test (Console du navigateur)

```javascript
// Dans la console du navigateur
import { updateFileFolder } from './src/utils/moveFileFolder';

// Tenter de déplacer un document avec un user_id invalide
await updateFileFolder(
  'id-du-document-de-quelqu-un-d-autre',
  'folder-test',
  'fake-user-id'
);
```

#### Résultats Attendus

- ❌ Erreur affichée : "Accès refusé : Ce document ne vous appartient pas"
- ❌ Aucune modification en base de données
- ✅ Toast d'erreur affiché
- ✅ Logs indiquant le refus d'accès

---

### Test 7 : Suppression de Dossier (Cascade)

#### Objectif
Vérifier que les documents reviennent à la racine quand leur dossier est supprimé.

#### Étapes

1. **Préparation**
   - Créer un dossier "Dossier Temporaire"
   - Déplacer 2 documents dans ce dossier

2. **Action**
   - Supprimer le dossier "Dossier Temporaire"

3. **Résultats Attendus**
   - ✅ Le dossier est supprimé
   - ✅ Les 2 documents réapparaissent à la racine
   - ✅ Aucune erreur

4. **Vérification Technique**

   **Dans la table documents :**
   ```
   Avant suppression du dossier :
   doc-1: folder_id = "dossier-temp"
   doc-2: folder_id = "dossier-temp"

   Après suppression du dossier :
   doc-1: folder_id = NULL               ← ✅ ON DELETE SET NULL
   doc-2: folder_id = NULL               ← ✅ ON DELETE SET NULL
   ```

   **Dans Supabase Storage :**
   - ✅ Les fichiers existent toujours
   - ✅ Aucun fichier supprimé

---

## 📊 Tableau Récapitulatif des Tests

| # | Test | Statut | Durée | Points Clés |
|---|------|--------|-------|-------------|
| 1 | Racine → Dossier | ✅ | ~30s | Déplacement basique |
| 2 | Dossier → Racine | ✅ | ~30s | Retour à la racine |
| 3 | Caractères spéciaux | ✅ | ~1min | Nom avec accents/# |
| 4 | Déplacements multiples | ✅ | ~1min | 3 déplacements consécutifs |
| 5 | Même dossier | ✅ | ~20s | Gestion intelligente |
| 6 | Sécurité RLS | ✅ | ~2min | Accès refusé |
| 7 | Suppression dossier | ✅ | ~1min | Cascade SET NULL |

---

## 🔍 Checklist de Vérification Manuelle

Après avoir effectué tous les tests, vérifiez manuellement :

### Dans l'Interface

- [ ] Les documents se déplacent instantanément
- [ ] Les noms originaux sont toujours affichés correctement
- [ ] Les dossiers affichent le bon nombre de documents
- [ ] Aucun message d'erreur visible
- [ ] Les toasts sont clairs et informatifs

### Dans la Console du Navigateur

- [ ] Les logs montrent chaque étape du déplacement
- [ ] Le `storage_path` est toujours marqué "INCHANGÉ"
- [ ] Aucune erreur JavaScript
- [ ] Aucune erreur Supabase

### Dans Supabase Dashboard

#### Table `documents`
```sql
SELECT 
  id,
  name,
  folder_id,
  storage_path,
  user_id
FROM documents
WHERE user_id = 'votre-user-id'
ORDER BY created_at DESC;
```

Vérifier :
- [ ] La colonne `name` contient les noms originaux (avec accents)
- [ ] La colonne `folder_id` contient les UUIDs corrects ou NULL
- [ ] La colonne `storage_path` contient les chemins nettoyés
- [ ] Aucune valeur NULL dans `storage_path` (sauf anciens documents)

#### Storage `documents`
```
Bucket: documents
```

Vérifier :
- [ ] Tous les fichiers uploadés sont présents
- [ ] Les noms de fichiers sont nettoyés (sans accents/espaces)
- [ ] Aucun fichier dupliqué
- [ ] Aucun fichier orphelin

---

## 🐛 Débogage des Problèmes Courants

### Problème 1 : Document ne se déplace pas

**Symptômes :**
- Clic sur "Déplacer" mais rien ne se passe
- Aucun toast affiché

**Solutions :**
1. Vérifier la console : Y a-t-il une erreur JavaScript ?
2. Vérifier que l'utilisateur est connecté (`user` existe)
3. Vérifier que `folder_id` existe dans la table `documents`

**Test SQL :**
```sql
-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
AND column_name = 'folder_id';
```

---

### Problème 2 : Erreur "Invalid key"

**Symptômes :**
- Toast d'erreur avec mention de "Invalid key"
- Erreur dans la console

**Cause :**
Le code tente de modifier `storage_path` (ce qui ne devrait JAMAIS arriver avec l'implémentation actuelle).

**Solutions :**
1. Vérifier que vous utilisez bien `updateFileFolder()` de `src/utils/moveFileFolder.ts`
2. Vérifier qu'aucune modification n'a été apportée à cette fonction
3. Vérifier les logs : le `storage_path` doit être marqué "INCHANGÉ"

---

### Problème 3 : Document apparaît dans le mauvais dossier

**Symptômes :**
- Le document se déplace mais apparaît dans un autre dossier que celui sélectionné

**Causes possibles :**
1. Le filtrage dans `Library.tsx` est incorrect
2. Le `fetchData()` n'a pas été appelé après le déplacement
3. Cache du navigateur

**Solutions :**
1. Rafraîchir la page (F5)
2. Vérifier dans Supabase Dashboard la valeur de `folder_id`
3. Vérifier la fonction `filteredDocuments` dans `Library.tsx`

**Test SQL :**
```sql
-- Vérifier le folder_id du document
SELECT id, name, folder_id
FROM documents
WHERE id = 'id-du-document-problematique';
```

---

### Problème 4 : Les logs ne s'affichent pas

**Cause :**
La console est filtrée ou les logs sont désactivés.

**Solutions :**
1. Ouvrir la console du navigateur (F12)
2. Cliquer sur "Console" (onglet)
3. Vérifier les filtres (ne pas filtrer les logs)
4. Vérifier que `console.log` fonctionne : taper `console.log('test')` dans la console

---

## 📈 Métriques de Performance

### Temps de Réponse Attendu

| Opération | Temps Moyen | Temps Max Acceptable |
|-----------|-------------|---------------------|
| Déplacement simple | < 500ms | 2s |
| Rafraîchissement liste | < 1s | 3s |
| Affichage du dropdown | Instantané | 100ms |
| Ouverture modale | Instantané | 100ms |

### Requêtes SQL Générées

Un déplacement simple génère **1 seule requête SQL** :

```sql
UPDATE documents
SET folder_id = $1
WHERE id = $2 AND user_id = $3;
```

Plus **1 requête de vérification** (avant la mise à jour) :

```sql
SELECT id, name, folder_id, storage_path, user_id
FROM documents
WHERE id = $1;
```

**Total : 2 requêtes SQL par déplacement** (performance optimale).

---

## ✅ Validation Finale

Tous les tests sont réussis si :

1. ✅ Aucune erreur dans la console
2. ✅ Les documents se déplacent instantanément
3. ✅ Les noms originaux sont préservés
4. ✅ Les fichiers restent au même endroit dans Storage
5. ✅ Les logs montrent "storage_path reste INCHANGÉ"
6. ✅ Les toasts informatifs s'affichent
7. ✅ La sécurité RLS fonctionne
8. ✅ Les documents reviennent à la racine quand le dossier est supprimé

---

## 📝 Rapport de Test (Template)

```markdown
# Rapport de Test - Fonction de Déplacement

**Date :** [Date]
**Testeur :** [Nom]
**Environnement :** [Dev / Staging / Prod]

## Résultats

| Test | Statut | Notes |
|------|--------|-------|
| Test 1 : Racine → Dossier | ✅ / ❌ | |
| Test 2 : Dossier → Racine | ✅ / ❌ | |
| Test 3 : Caractères spéciaux | ✅ / ❌ | |
| Test 4 : Déplacements multiples | ✅ / ❌ | |
| Test 5 : Même dossier | ✅ / ❌ | |
| Test 6 : Sécurité RLS | ✅ / ❌ | |
| Test 7 : Suppression dossier | ✅ / ❌ | |

## Problèmes Rencontrés

[Décrire les problèmes le cas échéant]

## Vérifications Manuelles

- [ ] Interface : OK
- [ ] Console : Aucune erreur
- [ ] Supabase Table : folder_id mis à jour
- [ ] Supabase Storage : Fichiers inchangés

## Conclusion

[Fonctionnalité validée / À corriger]

**Signature :** [Nom]
```

---

Bon courage pour les tests ! 🚀

Si vous rencontrez un problème, consultez les logs détaillés dans la console et référez-vous à la section "Débogage" ci-dessus.

