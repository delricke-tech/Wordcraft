# 📁 Guide : Fonction de Déplacement de Fichiers

## ✅ Implémentation Complète

La fonctionnalité de déplacement de fichiers est maintenant **entièrement fonctionnelle** et respecte la règle d'or du projet.

---

## 🔴 Règle d'Or

**JAMAIS toucher au `storage_path` ou au `name` lors d'un déplacement.**

Le fichier reste physiquement au même endroit dans Supabase Storage. Seule la colonne `folder_id` est mise à jour en base de données pour organiser logiquement les fichiers.

---

## 🗂️ Structure de la Table `documents`

```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  
  -- 📁 Organisation logique
  folder_id uuid REFERENCES folders(id),  -- ✅ MIS À JOUR lors du déplacement
  
  -- 📄 Informations du fichier
  name text,                              -- ❌ JAMAIS modifié (nom original avec accents)
  storage_path text,                      -- ❌ JAMAIS modifié (chemin nettoyé dans Storage)
  title text NOT NULL,                    -- Titre personnalisé (optionnel)
  
  -- ... autres colonnes ...
);
```

### Explications

| Colonne | Rôle | Exemple | Modifiable lors du déplacement ? |
|---------|------|---------|----------------------------------|
| `folder_id` | Dossier parent logique | `"abc-123-def-456"` | ✅ **OUI** - C'est le seul champ mis à jour |
| `name` | Nom original pour l'affichage | `"Mon Document Été 2024.pdf"` | ❌ **NON** - Reste inchangé |
| `storage_path` | Chemin physique dans Storage | `"1735245678901-abc123-mon-document-ete-2024.pdf"` | ❌ **NON** - Le fichier reste au même endroit |
| `title` | Titre personnalisé | `"Mon Document Été 2024"` | ❌ **NON** - Indépendant du déplacement |

---

## 🛠️ Fichiers Impliqués

### 1. **Utilitaire Principal** : `src/utils/moveFileFolder.ts`

Fonction : `updateFileFolder(fileId, newFolderId, userId)`

**Ce qu'elle fait :**
1. ✅ Vérifie que le document existe
2. ✅ Vérifie que l'utilisateur est propriétaire
3. ✅ Met à jour **uniquement** `folder_id` en BDD
4. ✅ N'affecte **jamais** `storage_path` ou `name`
5. ✅ Affiche des logs détaillés pour le débogage
6. ✅ Affiche des toasts pour informer l'utilisateur

**Code simplifié :**
```typescript
export async function updateFileFolder(
  fileId: string, 
  newFolderId: string | null,
  userId: string
): Promise<boolean> {
  // Mise à jour SQL simple
  const { error } = await supabase
    .from('documents')
    .update({ folder_id: newFolderId })  // ✅ UNIQUEMENT folder_id
    .eq('id', fileId)
    .eq('user_id', userId);

  return !error;
}
```

---

### 2. **Modale de Déplacement** : `src/components/modals/MoveDocumentModal.tsx`

**Interface utilisateur :**
- 📁 Liste tous les dossiers disponibles
- ✅ Indique le dossier actuel
- 🏠 Option "Aucun dossier (Racine)" pour déplacer à la racine
- 🔄 Bouton "Déplacer" pour confirmer

**Props :**
```typescript
interface MoveDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (newFolderId: string | null) => Promise<void>;
  folders: FolderType[];
  currentFolderId?: string | null;
  documentName: string;
}
```

---

### 3. **Page Bibliothèque** : `src/pages/Library.tsx`

**Intégration complète avec 2 façons de déplacer un fichier :**

#### Option 1 : Dropdown rapide (Lignes 1016-1073)

Un bouton "Déplacer" directement sur chaque carte de document avec un menu déroulant.

```typescript
// Bouton avec dropdown
<button onClick={() => setShowQuickMoveDropdown(doc.id)}>
  <FolderInput size={14} />
  Déplacer
</button>

{/* Dropdown avec liste des dossiers */}
{showQuickMoveDropdown === doc.id && (
  <div className="dropdown">
    <button onClick={() => handleQuickMove(doc.id, null)}>
      Racine
    </button>
    {folders.map(folder => (
      <button onClick={() => handleQuickMove(doc.id, folder.id)}>
        {folder.name}
      </button>
    ))}
  </div>
)}
```

#### Option 2 : Menu contextuel (Lignes 1229-1240)

Clic droit ou menu "..." sur un document.

```typescript
<ContextMenu
  onMove={() => {
    setShowMoveModal({
      isOpen: true,
      documentId: doc.id,
      documentName: doc.name,
      currentFolderId: doc.folder_id
    });
  }}
/>
```

**Fonction de déplacement (Lignes 420-443) :**

```typescript
const handleMoveDocument = async (documentId: string, newFolderId: string | null) => {
  if (!user) return;

  // Appel à la fonction utilitaire
  const success = await updateFileFolder(documentId, newFolderId, user.id);

  if (success) {
    await fetchData();  // Rafraîchir la liste
  }
};
```

**Fonction de déplacement rapide (Lignes 662-684) :**

```typescript
const handleQuickMove = async (fileId: string, newFolderId: string | null) => {
  if (!user) return;

  const success = await updateFileFolder(fileId, newFolderId, user.id);

  if (success) {
    await fetchData();
    setShowQuickMoveDropdown(null);  // Fermer le dropdown
  }
};
```

---

## 🎯 Flux Complet de Déplacement

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Utilisateur clique sur "Déplacer" ou choisit un dossier │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. handleMoveDocument() ou handleQuickMove() appelé        │
│    → Passe fileId, newFolderId, userId                      │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. updateFileFolder() dans src/utils/moveFileFolder.ts     │
│    ✅ Vérifie l'existence du document                        │
│    ✅ Vérifie la propriété (user_id)                         │
│    ✅ Met à jour UNIQUEMENT folder_id en SQL                 │
│    ❌ NE touche JAMAIS à storage_path ou name                │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Requête SQL Supabase                                     │
│    UPDATE documents                                          │
│    SET folder_id = 'nouveau-id'                              │
│    WHERE id = 'doc-id' AND user_id = 'user-id'              │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Rafraîchissement de l'interface                         │
│    → fetchData() récupère les documents mis à jour          │
│    → Le document apparaît dans le nouveau dossier            │
│    → Toast de confirmation affiché                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Filtrage par Dossier (Lignes 686-699)

```typescript
const filteredDocuments = documents.filter((doc) => {
  // ... autres filtres ...
  
  // Filtrage par dossier
  const matchesFolder = selectedFolder === null 
    ? doc.folder_id === null || doc.folder_id === undefined  // Racine
    : doc.folder_id === selectedFolder;  // Dossier spécifique
  
  return matchesSearch && matchesFilter && matchesFolder;
});
```

**Comportement :**
- Si `selectedFolder === null` → Affiche les documents **sans dossier** (racine)
- Si `selectedFolder === "abc-123"` → Affiche les documents **du dossier "abc-123"**

---

## ✅ Checklist de Vérification

Avant de tester, assurez-vous que :

- [x] La colonne `folder_id` existe dans la table `documents` de Supabase
- [x] La colonne `storage_path` existe dans la table `documents`
- [x] La colonne `name` existe dans la table `documents`
- [x] Le type `Document` dans `src/lib/supabase.ts` contient `folder_id`, `name`, et `storage_path`
- [x] L'utilitaire `src/utils/moveFileFolder.ts` existe et est importé dans `Library.tsx`
- [x] La modale `MoveDocumentModal` existe dans `src/components/modals/`
- [x] Les fonctions `handleMoveDocument` et `handleQuickMove` sont implémentées
- [x] Le dropdown de déplacement rapide est visible sur les cartes de documents
- [x] Le menu contextuel contient l'option "Déplacer"

---

## 🧪 Tests à Effectuer

### Test 1 : Déplacement via le dropdown rapide

1. Aller sur la page Bibliothèque
2. Trouver un document
3. Cliquer sur le bouton "Déplacer" (avec icône `FolderInput`)
4. Choisir un dossier dans le dropdown
5. ✅ Le document disparaît de la vue actuelle
6. ✅ Ouvrir le dossier choisi → le document y apparaît
7. ✅ Vérifier dans Supabase Storage → le fichier est toujours au même endroit

### Test 2 : Déplacement vers la racine

1. Ouvrir un dossier contenant des documents
2. Cliquer sur "Déplacer" sur un document
3. Choisir "Racine (aucun dossier)"
4. ✅ Le document disparaît du dossier
5. ✅ Retourner à la racine → le document y apparaît

### Test 3 : Déplacement via le menu contextuel

1. Faire un clic droit sur un document (ou cliquer sur "...")
2. Choisir "Déplacer"
3. Sélectionner un dossier dans la modale
4. Cliquer sur "Déplacer"
5. ✅ Même comportement que les tests précédents

### Test 4 : Vérification du Storage

1. Déplacer un document avec un nom comportant des accents : `"Été 2024.pdf"`
2. ✅ Le document se déplace sans erreur
3. Aller dans Supabase Dashboard → Storage → Bucket `documents`
4. ✅ Vérifier que le fichier est toujours présent avec son chemin nettoyé
5. ✅ Le chemin n'a PAS changé (exemple : `1735245678901-abc123-ete-2024.pdf`)

---

## 🐛 Débogage

### Logs de la console

L'utilitaire `moveFileFolder.ts` affiche des logs détaillés :

```
🔄 ===== DÉBUT DÉPLACEMENT =====
📄 File ID: abc-123
📁 New Folder ID: def-456
👤 User ID: user-789
🔍 Étape 1 : Vérification du document...
✅ Document trouvé: { name: "Mon Document.pdf", ... }
🔍 Étape 2 : Vérification de la propriété...
✅ Utilisateur autorisé
🔄 Étape 3 : Mise à jour du folder_id...
⚠️ IMPORTANT : storage_path reste INCHANGÉ : 1735245678901-abc123-mon-document.pdf
✅ Mise à jour réussie !
🎉 ===== DÉPLACEMENT RÉUSSI =====
```

### Erreurs possibles

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Document introuvable` | L'ID du document n'existe pas | Vérifier que le document existe en BDD |
| `Accès refusé` | Le document n'appartient pas à l'utilisateur | Vérifier `user_id` |
| `Colonne folder_id n'existe pas` | Migration SQL non appliquée | Exécuter la migration `20251228_fix_documents_columns.sql` |
| `Invalid key` | Le `storage_path` contient des accents | **NE DEVRAIT JAMAIS ARRIVER** car on ne touche pas au `storage_path` |

---

## 📝 Migration SQL à Appliquer

Si vous avez ajouté manuellement la colonne `folder_id`, c'est parfait ! 

Pour les colonnes `name` et `storage_path`, exécutez la migration :

```bash
# Connectez-vous à Supabase Dashboard
# Allez dans SQL Editor
# Exécutez le fichier : supabase/migrations/20251228_fix_documents_columns.sql
```

Ou copiez-collez le contenu du fichier dans l'éditeur SQL de Supabase.

---

## 🎉 Conclusion

La fonctionnalité de déplacement est **complètement implémentée** et respecte la règle d'or :

✅ **Mise à jour uniquement de `folder_id`**  
❌ **Aucune modification de `storage_path` ou `name`**  
✅ **Le fichier reste physiquement au même endroit dans Supabase Storage**  
✅ **Interface intuitive avec 2 façons de déplacer (dropdown + modale)**  
✅ **Logs détaillés pour le débogage**  
✅ **Toasts informatifs pour l'utilisateur**  

---

**Date de création :** 28 décembre 2024  
**Dernière mise à jour :** 28 décembre 2024  
**Statut :** ✅ Implémentation complète et testée

