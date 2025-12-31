# 🧹 Guide du Nettoyage Automatique

## 🎯 **Objectif**

Garantir qu'**aucune suppression ne laisse de trace** dans votre système :
- ✅ Pas de fichiers orphelins dans Storage
- ✅ Pas de références cassées en base de données
- ✅ Suppression en cascade automatique
- ✅ Nettoyage complet et propre

---

## 📋 **Installation (Une seule fois)**

### **Étape 1 : Exécuter le script SQL**

1. **Ouvrez** Supabase Dashboard
2. **Allez dans** SQL Editor
3. **Nouvelle query** : Cliquez sur "+ New query"
4. **Copiez-collez** le contenu de `SUPABASE_AUTO_CLEANUP.sql`
5. **Exécutez** : Cliquez sur "Run" ▶️

### **Résultat attendu :**

```
✅ SYSTÈME DE NETTOYAGE AUTOMATIQUE CONFIGURÉ !

🔧 Composants installés :
  - Fonction delete_storage_file() : ✅
  - Trigger auto_delete_storage_file : ✅
  - Fonction cleanup_orphans() : ✅
  - Fonction delete_user_completely() : ✅

🎯 Comportements automatiques :
  ✅ Suppression document → Fichier Storage supprimé
  ✅ Suppression compte → Tous documents + fichiers supprimés
  ✅ Suppression dossier → Documents restent (folder_id = NULL)
  ✅ Cascades configurées pour toutes les tables
```

---

## 🔄 **Comportements Automatiques**

### **1. Suppression d'un DOCUMENT** 📄

**Ce qui se passe automatiquement :**

```
Document supprimé
    ↓
✅ Fichier Storage supprimé (PDF, images, etc.)
    ↓
✅ Cartes d'étude liées supprimées
    ↓
✅ Quiz liés mis à NULL (conservés mais sans document)
    ↓
✅ Aucun orphelin ne reste
```

**Exemple concret :**

```sql
-- Vous supprimez un document
DELETE FROM documents WHERE id = 'abc-123';

-- Automatiquement :
-- 1. Le fichier "mon-document.pdf" est supprimé du Storage
-- 2. Toutes les flashcards de ce document sont supprimées
-- 3. Les quiz sont conservés mais document_id = NULL
```

---

### **2. Suppression d'un DOSSIER** 📁

**Ce qui se passe automatiquement :**

```
Dossier supprimé
    ↓
✅ Documents déplacés à la racine (folder_id = NULL)
    ↓
✅ Sous-dossiers également supprimés (cascade)
    ↓
✅ Pas de perte de documents
```

**Exemple concret :**

```sql
-- Vous supprimez un dossier
DELETE FROM folders WHERE id = 'folder-xyz';

-- Automatiquement :
-- 1. Les documents dans ce dossier passent à folder_id = NULL
-- 2. Les sous-dossiers sont supprimés
-- 3. Les documents ne sont PAS supprimés (conservés)
```

---

### **3. Suppression d'un COMPTE UTILISATEUR** 👤

**Ce qui se passe automatiquement :**

```
Compte supprimé
    ↓
✅ TOUS les documents supprimés
    ↓
✅ TOUS les fichiers Storage supprimés
    ↓
✅ TOUS les dossiers supprimés
    ↓
✅ Toutes les cartes d'étude supprimées
    ↓
✅ Tous les quiz supprimés
    ↓
✅ Profil supprimé
    ↓
✅ AUCUNE trace ne reste
```

**Exemple concret :**

```sql
-- Vous supprimez un compte
DELETE FROM profiles WHERE id = 'user-abc';

-- OU utilisez la fonction dédiée :
SELECT delete_user_completely('user-abc');

-- Automatiquement :
-- 1. Tous les documents de l'utilisateur sont supprimés
-- 2. Tous les fichiers Storage correspondants sont supprimés
-- 3. Tous les dossiers sont supprimés
-- 4. Toutes les cartes et quiz sont supprimés
-- 5. Le profil est supprimé
-- 6. Plus aucune trace dans la base
```

---

## 🛠️ **Commandes Utiles**

### **Nettoyer les orphelins existants**

Si vous voulez nettoyer manuellement les orphelins :

```sql
SELECT cleanup_orphans();
```

**Ce que ça fait :**
- Supprime les documents sans utilisateur
- Supprime les dossiers sans utilisateur
- Supprime les fichiers Storage sans document correspondant

### **Supprimer un compte complètement**

```sql
SELECT delete_user_completely('user-uuid-here');
```

**Exemple :**
```sql
-- Trouver l'UUID d'un utilisateur
SELECT id, email FROM profiles WHERE email = 'user@example.com';

-- Supprimer complètement ce compte
SELECT delete_user_completely('abc-123-def-456');
```

---

## 📊 **Tableau des Cascades**

| Action | Conséquence automatique |
|--------|------------------------|
| **Supprimer un document** | ✅ Fichier Storage supprimé<br>✅ Cartes d'étude supprimées<br>✅ Quiz.document_id = NULL |
| **Supprimer un dossier** | ✅ Sous-dossiers supprimés<br>✅ Documents.folder_id = NULL |
| **Supprimer un compte** | ✅ Tous documents supprimés<br>✅ Tous fichiers Storage supprimés<br>✅ Tous dossiers supprimés<br>✅ Toutes cartes supprimées<br>✅ Tous quiz supprimés |
| **Supprimer une carte** | ✅ Versions de carte supprimées |
| **Supprimer un quiz** | ✅ Questions supprimées<br>✅ Tentatives supprimées |

---

## 🔍 **Vérifications**

### **Vérifier qu'il n'y a pas d'orphelins**

```sql
-- Documents sans utilisateur
SELECT COUNT(*) as orphan_documents
FROM documents
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = documents.user_id);

-- Fichiers Storage sans document
SELECT COUNT(*) as orphan_files
FROM storage.objects
WHERE bucket_id = 'documents'
AND NOT EXISTS (SELECT 1 FROM documents WHERE documents.storage_path = storage.objects.name);

-- Dossiers sans utilisateur
SELECT COUNT(*) as orphan_folders
FROM folders
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = folders.user_id);
```

**Résultat attendu :** Tous les comptes doivent être à **0**

---

## 🧪 **Tests**

### **Test 1 : Suppression d'un document**

1. **Uploadez** un document de test
2. **Notez** son `storage_path` et son `id`
3. **Supprimez-le** depuis l'application ou SQL :
   ```sql
   DELETE FROM documents WHERE id = 'votre-id';
   ```
4. **Vérifiez** dans Storage → documents
5. ✅ Le fichier doit avoir disparu

### **Test 2 : Suppression d'un dossier**

1. **Créez** un dossier avec quelques documents dedans
2. **Supprimez** le dossier
3. **Vérifiez** que les documents sont toujours là (mais folder_id = NULL)

### **Test 3 : Nettoyage des orphelins**

1. **Exécutez** :
   ```sql
   SELECT cleanup_orphans();
   ```
2. **Vérifiez** le message dans les résultats
3. ✅ Devrait indiquer 0 orphelins si tout est propre

---

## ⚠️ **Avertissements**

### **Suppression de compte = IRRÉVERSIBLE**

Quand vous supprimez un compte :
- ❌ **TOUS les documents sont perdus**
- ❌ **TOUS les fichiers Storage sont perdus**
- ❌ **TOUTES les cartes d'étude sont perdues**
- ❌ **IMPOSSIBLE de récupérer**

**Solution :** Implémenter une "soft delete" (désactivation au lieu de suppression)

### **Pas de corbeille**

Actuellement, il n'y a **pas de corbeille** :
- Les suppressions sont définitives
- Pas de récupération possible

**Solution future :** Ajouter une table `deleted_items` avec une période de rétention

---

## 🔐 **Sécurité**

### **Qui peut supprimer quoi ?**

Les politiques RLS (Row Level Security) garantissent :

| Action | Permission requise |
|--------|--------------------|
| Supprimer ses documents | ✅ Utilisateur propriétaire |
| Supprimer ses dossiers | ✅ Utilisateur propriétaire |
| Supprimer son compte | ✅ Utilisateur lui-même |
| Supprimer documents d'autrui | ❌ INTERDIT |
| Nettoyer orphelins | ⚠️ Admin seulement |

---

## 📞 **Maintenance**

### **Nettoyage mensuel recommandé**

Exécutez une fois par mois :

```sql
-- Nettoyer les orphelins
SELECT cleanup_orphans();

-- Vérifier l'espace Storage utilisé
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::BIGINT / 1024 / 1024 as total_mb
FROM storage.objects
WHERE bucket_id = 'documents'
GROUP BY bucket_id;
```

---

## ✅ **Checklist de vérification**

Après installation, vérifiez :

- [ ] Le trigger `auto_delete_storage_file` existe
- [ ] La fonction `delete_storage_file()` existe
- [ ] La fonction `cleanup_orphans()` existe
- [ ] La fonction `delete_user_completely()` existe
- [ ] Les contraintes CASCADE sont configurées
- [ ] Aucun orphelin n'existe (exécuter `cleanup_orphans()`)
- [ ] Test de suppression d'un document réussi
- [ ] Test de suppression d'un dossier réussi

---

## 🎉 **Résultat Final**

Avec ce système :
- ✅ **Aucun fichier orphelin** dans Storage
- ✅ **Aucune référence cassée** en base
- ✅ **Suppressions propres** et complètes
- ✅ **Base de données saine** et optimisée

**Votre système est maintenant 100% propre automatiquement !** 🚀

---

**Date :** 31 décembre 2024
**Fichiers :** `SUPABASE_AUTO_CLEANUP.sql`
