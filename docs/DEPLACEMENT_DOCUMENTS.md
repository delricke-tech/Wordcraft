# 📁 Guide de Déplacement de Documents - Dépannage

## ✅ Fonction `handleMoveDocument` - Déjà Implémentée !

La fonction de déplacement existe déjà dans votre code et fonctionne correctement.

---

## 🎯 Comment Déplacer un Document

### Méthode 1 : Menu Contextuel (Principal)

1. **Clic droit** sur un document (ou clic sur l'icône ⋮)
2. Le menu contextuel s'affiche avec les options :
   - 📥 Télécharger
   - ✏️ Renommer
   - **📁 Déplacer** ← Cliquez ici
   - 🗑️ Supprimer

3. Une modale s'ouvre avec :
   - Le nom du document
   - La liste de tous vos dossiers
   - Option "Aucun dossier (Racine)"

4. Sélectionnez le dossier de destination

5. Cliquez sur "Déplacer"

6. ✅ Toast de confirmation : `"nom_document" → Dossier_Destination`

---

## 🔧 Code de la Fonction

### Fonction `handleMoveDocument`

```typescript
const handleMoveDocument = async (documentId: string, newFolderId: string | null) => {
  if (!user) {
    toast.error('Erreur', { description: 'Vous devez être connecté' });
    return;
  }

  console.log('📁 Déplacement du document:', documentId, '→', newFolderId || 'Racine');

  // Récupérer le document
  const doc = documents.find(d => d.id === documentId);
  if (!doc) {
    toast.error('Erreur', { description: 'Document introuvable' });
    return;
  }

  // ✅ Vérifier que l'utilisateur est le propriétaire
  if (doc.user_id !== user.id) {
    toast.error('Accès refusé', { 
      description: 'Vous ne pouvez déplacer que vos propres documents' 
    });
    return;
  }

  try {
    // ✅ Mettre à jour UNIQUEMENT le folder_id (pas le storage_path)
    const { error } = await supabase
      .from('documents')
      .update({ folder_id: newFolderId })
      .eq('id', documentId)
      .eq('user_id', user.id); // Sécurité : double vérification

    if (error) {
      console.error('❌ Erreur lors du déplacement:', error);
      toast.error('Erreur', {
        description: 'Impossible de déplacer le document'
      });
      throw error;
    }

    const destinationName = newFolderId 
      ? folders.find(f => f.id === newFolderId)?.name || 'Dossier'
      : 'Racine';

    console.log('✅ Document déplacé');
    
    // ✅ Toast de succès avec Sonner
    toast.success('Document déplacé !', {
      description: `"${doc.name}" → ${destinationName}`
    });

    // Rafraîchir la liste
    await fetchData();
  } catch (error: any) {
    console.error('❌ Erreur:', error);
    throw error;
  }
};
```

---

## 🔐 Règles de Sécurité Respectées

### ✅ Ce Qui Est Modifié

**Uniquement la colonne `folder_id` dans la table `documents`** :

```sql
UPDATE documents 
SET folder_id = 'nouveau-dossier-id'
WHERE id = 'document-id' 
  AND user_id = 'user-id'; -- Sécurité
```

### ❌ Ce Qui N'Est PAS Touché

1. **`storage_path`** : Le chemin du fichier dans Supabase Storage reste inchangé
2. **`name`** : Le nom d'affichage du document reste inchangé
3. **Fichier physique** : Le fichier dans Storage n'est pas déplacé ou renommé

**Exemple** :
```typescript
// Avant déplacement
{
  id: "abc123",
  name: "Virologie Général.pdf",  // ✅ Reste inchangé
  storage_path: "1735246789-virologie-general.pdf",  // ✅ Reste inchangé
  folder_id: "folder-biologie",  // Ancien dossier
  user_id: "user123"
}

// Après déplacement vers "Chimie"
{
  id: "abc123",
  name: "Virologie Général.pdf",  // ✅ Toujours le même
  storage_path: "1735246789-virologie-general.pdf",  // ✅ Toujours le même
  folder_id: "folder-chimie",  // ❗ SEUL CHANGEMENT
  user_id: "user123"
}
```

---

## 🧪 Test de Déplacement

### Étape par Étape

**Setup** :
1. Créez 2 dossiers : "Source" et "Destination"
2. Dans "Source" : Uploadez "Test.pdf"
3. Vérifiez que "Test.pdf" apparaît dans "Source"

**Action** :
1. Ouvrez le dossier "Source"
2. Clic droit sur "Test.pdf"
3. Cliquez sur "📁 Déplacer"
4. Dans la modale, sélectionnez "Destination"
5. Cliquez sur le bouton "Déplacer"

**Résultat Attendu** :
- ✅ Toast : `"Test.pdf" → Destination`
- ✅ "Test.pdf" disparaît du dossier "Source"
- ✅ Ouvrez "Destination" → "Test.pdf" y apparaît
- ✅ Le fichier dans Storage n'a pas bougé

**Console Logs** :
```
📁 Déplacement du document: abc123 → folder-destination-id
✅ Document déplacé
```

---

## 🐛 Dépannage

### Problème 1 : Le menu "Déplacer" n'apparaît pas

**Causes possibles** :
1. Le menu contextuel ne s'ouvre pas
2. Vous cliquez sur un dossier (le déplacement n'est disponible que pour les documents)

**Solution** :
- ✅ Cliquez sur l'icône **⋮** (trois points) sur une **carte de document**
- ✅ Le menu doit montrer : Télécharger, Renommer, **Déplacer**, Supprimer

### Problème 2 : La modale ne s'ouvre pas

**Vérification** :
```typescript
// Vérifier dans la console du navigateur (F12)
// Vous devriez voir les logs
```

**Solution** :
- Rechargez la page (Ctrl+R)
- Vérifiez qu'aucune erreur n'apparaît dans la console

### Problème 3 : "Impossible de déplacer le document"

**Causes possibles** :
1. Erreur de connexion Supabase
2. Problème de permissions RLS
3. Le document n'existe plus

**Vérification** :
```sql
-- Dans Supabase SQL Editor
SELECT id, name, folder_id, user_id 
FROM documents 
WHERE id = 'votre-document-id';
```

**Solution** :
- Vérifiez vos politiques RLS dans Supabase
- Assurez-vous que `user_id` correspond à votre utilisateur

### Problème 4 : Le document ne se déplace pas

**Vérification** :
1. Ouvrez la console (F12)
2. Cherchez les logs :
   - `📁 Déplacement du document...`
   - `✅ Document déplacé`

3. Vérifiez dans Supabase Table Editor :
   - La colonne `folder_id` doit avoir changé
   - Le `storage_path` doit être identique

**Solution** :
- Si `✅ Document déplacé` apparaît mais le document ne bouge pas :
  - Problème de rafraîchissement → Rechargez manuellement (F5)
- Si aucun log n'apparaît :
  - La fonction n'est pas appelée → Vérifiez le menu contextuel

### Problème 5 : Erreur "Accès refusé"

**Cause** :
Vous essayez de déplacer un document qui ne vous appartient pas.

**Vérification** :
```typescript
// Le code vérifie :
if (doc.user_id !== user.id) {
  toast.error('Accès refusé');
  return;
}
```

**Solution** :
- Vous ne pouvez déplacer que vos propres documents
- C'est un comportement de sécurité normal

---

## 📊 Vérification Manuelle dans Supabase

### Étape 1 : Avant le Déplacement

```sql
SELECT 
  id,
  name,
  folder_id,
  storage_path,
  user_id
FROM documents
WHERE name = 'Test.pdf';
```

**Résultat** :
```
id: abc123
name: Test.pdf
folder_id: folder-source-id
storage_path: 1735246789-test.pdf
user_id: user123
```

### Étape 2 : Après le Déplacement

```sql
SELECT 
  id,
  name,
  folder_id,
  storage_path,
  user_id
FROM documents
WHERE name = 'Test.pdf';
```

**Résultat** :
```
id: abc123
name: Test.pdf
folder_id: folder-destination-id  ← CHANGÉ
storage_path: 1735246789-test.pdf  ← INCHANGÉ ✅
user_id: user123
```

---

## 🎯 Checklist de Fonctionnement

- [ ] Le menu contextuel s'ouvre sur clic droit / icône ⋮
- [ ] L'option "📁 Déplacer" est visible dans le menu
- [ ] La modale s'ouvre avec la liste des dossiers
- [ ] Je peux sélectionner un dossier de destination
- [ ] Le bouton "Déplacer" est actif
- [ ] Un toast "Document déplacé !" s'affiche
- [ ] Le document apparaît dans le nouveau dossier
- [ ] Le document a disparu de l'ancien dossier
- [ ] Le `storage_path` n'a pas changé (vérif Supabase)

---

## 💡 Astuces

### Déplacer vers la Racine

Pour sortir un document d'un dossier :
1. Clic droit sur le document
2. "Déplacer"
3. Sélectionnez **"Aucun dossier (Racine)"**
4. Le document sera accessible depuis la vue principale

### Déplacements Multiples

Pour déplacer plusieurs documents :
1. Déplacez-les un par un (pour l'instant)
2. Chaque déplacement prend ~1-2 secondes

### Annulation d'un Déplacement

Si vous avez déplacé un document par erreur :
1. Ouvrez le nouveau dossier
2. Clic droit → "Déplacer"
3. Sélectionnez l'ancien dossier
4. Le document revient

---

## 🔍 Logs Console à Surveiller

### Déplacement Réussi

```
📁 Déplacement du document: abc123 → folder-destination-id
✅ Document déplacé
```

### Erreur de Déplacement

```
📁 Déplacement du document: abc123 → folder-destination-id
❌ Erreur lors du déplacement: [détails de l'erreur]
```

---

## ✅ Résumé

La fonction de déplacement **existe déjà** et fonctionne selon les règles :

1. ✅ Met à jour `folder_id` dans la table `documents`
2. ✅ Ne touche PAS au `storage_path`
3. ✅ Ne touche PAS au fichier physique dans Storage
4. ✅ Vérifie la sécurité (`user_id`)
5. ✅ Affiche un toast de succès avec Sonner
6. ✅ Rafraîchit automatiquement la liste

**Si le déplacement ne fonctionne pas** :
- Vérifiez que le menu contextuel s'ouvre
- Vérifiez les logs de la console (F12)
- Testez avec un document simple
- Vérifiez votre connexion Supabase

---

**Date de création** : 28 décembre 2024  
**Statut** : ✅ Fonction complète et opérationnelle

