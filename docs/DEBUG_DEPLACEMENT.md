# 🔧 Déplacement Simple - Guide de Debug

## ✅ Solution Ultra-Simple Implémentée

J'ai créé une solution **ultra-debuggable** avec des logs détaillés à chaque étape.

---

## 🎯 Ce Qui A Été Créé

### 1. **Script SQL de Vérification**

Fichier : `supabase/verify_folder_id_column.sql`

**À exécuter dans Supabase SQL Editor** :
```sql
-- Vérifier la structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents';

-- Ajouter la colonne si nécessaire
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES folders(id) ON DELETE SET NULL;

-- Créer l'index
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
```

---

### 2. **Fonction Simple `updateFileFolder`**

Fichier : `src/utils/moveFileFolder.ts`

**Caractéristiques** :
- ✅ Logs détaillés à chaque étape
- ✅ Modifie UNIQUEMENT `folder_id`
- ❌ Ne touche JAMAIS à `storage_path`
- ❌ Ne touche JAMAIS à `name`
- ✅ Vérifications de sécurité
- ✅ Toasts avec Sonner
- ✅ Retourne `true/false` pour le succès

**Logs Console** :
```
🔄 ===== DÉBUT DÉPLACEMENT =====
📄 File ID: abc123
📁 New Folder ID: folder-xyz ou RACINE
👤 User ID: user-id
🔍 Étape 1 : Vérification du document...
✅ Document trouvé: { id, name, folder_id, storage_path }
🔍 Étape 2 : Vérification de la propriété...
✅ Utilisateur autorisé
🔄 Étape 3 : Mise à jour du folder_id...
⚠️ IMPORTANT : storage_path reste INCHANGÉ : [path]
✅ Mise à jour réussie !
🔍 Étape 4 : Vérification finale...
✅ Vérification OK
🎉 ===== DÉPLACEMENT RÉUSSI =====
```

---

### 3. **Bouton Simple "Déplacer"**

**Apparence** :
- 📁 Petit bouton teal à côté du nom du document
- Texte : "Déplacer" (masqué sur mobile, seulement icône)
- Clic → Ouvre un dropdown

**Dropdown** :
- Option "Racine (aucun dossier)"
- Liste de tous vos dossiers
- Dossier actuel marqué avec "✓ Actuel"
- Scroll si beaucoup de dossiers

**Logs au Clic** :
```
🎯 Clic sur dossier: Biologie pour document: abc123
🚀 handleQuickMove appelé
  - File ID: abc123
  - New Folder ID: folder-bio
  - User ID: user-id
[...puis tous les logs de updateFileFolder...]
✅ Déplacement confirmé, rafraîchissement de la liste...
```

---

## 🧪 Test Complet

### Étape 1 : Vérifier la Base de Données

1. Ouvrez Supabase Dashboard
2. Allez dans **SQL Editor**
3. Copiez et exécutez le contenu de `supabase/verify_folder_id_column.sql`
4. Vérifiez que ça affiche les colonnes de la table `documents`
5. La colonne `folder_id` doit apparaître

---

### Étape 2 : Test Visuel

1. Allez sur http://localhost:5173/library
2. Créez 2 dossiers : "Test A" et "Test B"
3. Uploadez un PDF "Mon Document.pdf" dans "Test A"
4. Ouvrez "Test A"
5. **Vous devez voir** :
   - Le document "Mon Document.pdf"
   - Un bouton teal **"📁 Déplacer"** à côté du nom

---

### Étape 3 : Test de Déplacement

1. **Ouvrez la Console** (F12 dans le navigateur)
2. Cliquez sur le bouton **"Déplacer"** du document
3. **Un dropdown doit s'ouvrir** avec :
   - "Racine (aucun dossier)"
   - "Test A" ✓ Actuel
   - "Test B"
4. Cliquez sur **"Test B"**
5. **Regardez la console** :

```
🎯 Clic sur dossier: Test B pour document: [id]
🚀 handleQuickMove appelé
  - File ID: [id]
  - New Folder ID: [folder-test-b-id]
  - User ID: [your-user-id]
🔄 ===== DÉBUT DÉPLACEMENT =====
📄 File ID: [id]
📁 New Folder ID: [folder-test-b-id]
👤 User ID: [your-user-id]
🔍 Étape 1 : Vérification du document...
✅ Document trouvé: {...}
  - Nom: Mon Document.pdf
  - Dossier actuel: [folder-test-a-id]
  - Storage path: 1735246789-mon-document.pdf
🔍 Étape 2 : Vérification de la propriété...
✅ Utilisateur autorisé
🔄 Étape 3 : Mise à jour du folder_id...
  - Ancien folder_id: [folder-test-a-id]
  - Nouveau folder_id: [folder-test-b-id]
⚠️ IMPORTANT : storage_path reste INCHANGÉ : 1735246789-mon-document.pdf
✅ Mise à jour réussie !
🔍 Étape 4 : Vérification finale...
✅ Vérification OK: {...}
  - Nouveau folder_id: [folder-test-b-id]
  - Storage path inchangé: 1735246789-mon-document.pdf
🎉 ===== DÉPLACEMENT RÉUSSI =====
✅ Déplacement confirmé, rafraîchissement de la liste...
```

6. **Un toast doit apparaître** : "Fichier déplacé ! 'Mon Document.pdf' a été déplacé avec succès"
7. **Le document disparaît** de "Test A"
8. Ouvrez "Test B"
9. **Le document apparaît** dans "Test B"

---

### Étape 4 : Vérification Supabase

1. Ouvrez Supabase **Table Editor**
2. Ouvrez la table **`documents`**
3. Cherchez "Mon Document.pdf"
4. **Vérifiez** :
   - ✅ `folder_id` = [id de "Test B"]
   - ✅ `storage_path` = "1735246789-mon-document.pdf" (INCHANGÉ)
   - ✅ `name` = "Mon Document.pdf" (INCHANGÉ)

---

## 🐛 Si Ça Ne Fonctionne Pas

### Problème 1 : Le bouton "Déplacer" n'apparaît pas

**Vérifiez** :
- Actualisez la page (Ctrl+R)
- Vérifiez qu'il y a bien des documents

**Si toujours invisible** :
- Ouvrez la console (F12)
- Cherchez des erreurs rouges

---

### Problème 2 : Le dropdown ne s'ouvre pas

**Console Debug** :
1. Ouvrez F12
2. Cliquez sur "Déplacer"
3. Cherchez : `🎯 Clic sur...`

**Si aucun log** :
- L'événement `onClick` n'est pas déclenché
- Vérifiez qu'il n'y a pas d'erreur JS dans la console

---

### Problème 3 : Erreur lors du déplacement

**Dans la Console, cherchez** :

**A. "❌ Erreur lors de la récupération du document"**
→ Le document n'existe pas ou a été supprimé
→ Rechargez la page (F5)

**B. "❌ Accès refusé : user_id ne correspond pas"**
→ Vous essayez de déplacer un document d'un autre utilisateur
→ C'est normal (sécurité)

**C. "❌ Erreur lors de la mise à jour"**
→ Regardez le message d'erreur détaillé
→ Possible causes :
   - Colonne `folder_id` n'existe pas → Exécutez le script SQL
   - Problème de permissions RLS → Vérifiez vos politiques Supabase
   - Dossier destination n'existe pas → Vérifiez l'ID du dossier

---

### Problème 4 : Aucun log dans la console

**Étapes** :
1. Vérifiez que la console est bien ouverte (F12)
2. Vérifiez l'onglet "Console" (pas "Network" ou autre)
3. Actualisez la page
4. Essayez à nouveau

**Si toujours rien** :
- Un autre fichier JS bloque peut-être les logs
- Vérifiez qu'il n'y a pas d'erreurs critiques en haut de la console

---

### Problème 5 : Le document ne se déplace pas

**Vérification Étape par Étape** :

1. **Logs apparaissent jusqu'à "✅ Mise à jour réussie !"** ?
   - OUI → Vérifiez dans Supabase Table Editor si `folder_id` a changé
   - NON → Regardez où les logs s'arrêtent

2. **Dans Supabase, `folder_id` a changé** ?
   - OUI mais le document ne bouge pas dans l'UI → Problème de rafraîchissement
   - NON → La requête SQL n'a pas fonctionné

3. **"✅ Déplacement confirmé, rafraîchissement..."** apparaît ?
   - OUI → La fonction `fetchData()` devrait recharger la liste
   - NON → La fonction n'est pas complète

---

## 📊 Checklist Complète

- [ ] Script SQL exécuté dans Supabase
- [ ] Colonne `folder_id` existe dans table `documents`
- [ ] Serveur Vite tourne (http://localhost:5173)
- [ ] Page actualisée (F5)
- [ ] Console ouverte (F12)
- [ ] Au moins 1 document et 2 dossiers créés
- [ ] Bouton "📁 Déplacer" visible à côté du nom du document
- [ ] Clic sur "Déplacer" ouvre le dropdown
- [ ] Dropdown affiche les dossiers
- [ ] Clic sur un dossier affiche des logs dans la console
- [ ] Logs commencent par "🔄 ===== DÉBUT DÉPLACEMENT ====="
- [ ] Logs se terminent par "🎉 ===== DÉPLACEMENT RÉUSSI ====="
- [ ] Toast "Fichier déplacé !" s'affiche
- [ ] Document disparaît de l'ancien dossier
- [ ] Document apparaît dans le nouveau dossier
- [ ] Dans Supabase, `folder_id` a changé
- [ ] Dans Supabase, `storage_path` est INCHANGÉ

---

## 🎯 Logs Attendus (Succès)

Voici les logs que vous DEVEZ voir dans la console pour un déplacement réussi :

```
🎯 Clic sur dossier: [Nom Dossier] pour document: [doc-id]
🚀 handleQuickMove appelé
  - File ID: [doc-id]
  - New Folder ID: [folder-id]
  - User ID: [user-id]
🔄 ===== DÉBUT DÉPLACEMENT =====
📄 File ID: [doc-id]
📁 New Folder ID: [folder-id]
👤 User ID: [user-id]
🔍 Étape 1 : Vérification du document...
✅ Document trouvé: {id: "[doc-id]", name: "...", ...}
  - Nom: [nom du document]
  - Dossier actuel: [old-folder-id ou null]
  - Storage path: [storage-path]
🔍 Étape 2 : Vérification de la propriété...
✅ Utilisateur autorisé
🔄 Étape 3 : Mise à jour du folder_id...
  - Ancien folder_id: [old-folder-id]
  - Nouveau folder_id: [new-folder-id]
⚠️ IMPORTANT : storage_path reste INCHANGÉ : [storage-path]
✅ Mise à jour réussie !
  - Données mises à jour: [...]
🔍 Étape 4 : Vérification finale...
✅ Vérification OK: {id: "[doc-id]", ...}
  - Nouveau folder_id: [new-folder-id]
  - Storage path inchangé: [storage-path]
🎉 ===== DÉPLACEMENT RÉUSSI =====
✅ Déplacement confirmé, rafraîchissement de la liste...
```

Si vous voyez tous ces logs : **LE DÉPLACEMENT A FONCTIONNÉ** ✅

---

**Date de création** : 28 décembre 2024  
**Statut** : Solution ultra-simple avec logs détaillés

