# 🎨 Architecture Visuelle : Déplacement de Fichiers

## 📊 Vue d'Ensemble du Système

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE STORAGE                             │
│  Bucket: "documents"                                                 │
│                                                                       │
│  📄 1735245678901-abc123-mon-document-ete-2024.pdf                   │
│  📄 1735245678902-def456-virologie-general-1.pdf                     │
│  📄 1735245678903-ghi789-cours-partie-1-notes.pdf                    │
│                                                                       │
│  ⚠️ Les fichiers NE BOUGENT JAMAIS physiquement                      │
│  ⚠️ Les noms sont TOUJOURS nettoyés (sans accents/espaces)          │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
                    (Lien via storage_path)
                                  ↕
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE (PostgreSQL)                   │
│                                                                       │
│  📁 Table: folders                                                   │
│  ┌───────────┬────────────┬──────────┬───────────┐                  │
│  │ id        │ user_id    │ name     │ parent_id │                  │
│  ├───────────┼────────────┼──────────┼───────────┤                  │
│  │ folder-1  │ user-abc   │ Médecine │ NULL      │                  │
│  │ folder-2  │ user-abc   │ Chimie   │ NULL      │                  │
│  │ folder-3  │ user-abc   │ Biologie │ NULL      │                  │
│  └───────────┴────────────┴──────────┴───────────┘                  │
│                                                                       │
│  📄 Table: documents                                                 │
│  ┌────────┬─────────┬──────────────────┬───────────────────┬────────┐
│  │ id     │ user_id │ folder_id        │ name              │ storage│
│  ├────────┼─────────┼──────────────────┼───────────────────┼────────┤
│  │ doc-1  │ user-abc│ folder-1 ✅      │ Mon Doc Été.pdf   │ 173... │
│  │ doc-2  │ user-abc│ NULL (racine) ✅ │ Virologie #1.pdf  │ 173... │
│  │ doc-3  │ user-abc│ folder-2 ✅      │ Cours (p1).pdf    │ 173... │
│  └────────┴─────────┴──────────────────┴───────────────────┴────────┘
│                        ↑                      ↑                ↑      │
│                        │                      │                │      │
│                  MODIFIABLE              JAMAIS           JAMAIS      │
│                  lors du               MODIFIÉ           MODIFIÉ     │
│                  déplacement                                          │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
                    (Lecture et affichage)
                                  ↕
┌─────────────────────────────────────────────────────────────────────┐
│                        INTERFACE UTILISATEUR                         │
│  src/pages/Library.tsx                                               │
│                                                                       │
│  📁 Racine                                                           │
│    └─ 📄 Virologie #1.pdf  [Déplacer ▼]                             │
│                                                                       │
│  📁 Médecine                                                         │
│    └─ 📄 Mon Doc Été.pdf  [Déplacer ▼]                              │
│                                                                       │
│  📁 Chimie                                                           │
│    └─ 📄 Cours (p1).pdf  [Déplacer ▼]                               │
│                                                                       │
│  📁 Biologie                                                         │
│    └─ (vide)                                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flux de Déplacement Détaillé

### Scénario : Déplacer "Virologie #1.pdf" de la Racine vers "Médecine"

```
┌──────────────────────────────────────────────────────────────────┐
│ ÉTAPE 1 : Action Utilisateur                                     │
└──────────────────────────────────────────────────────────────────┘
        User clique sur [Déplacer ▼] → Sélectionne "Médecine"
                                ↓
┌──────────────────────────────────────────────────────────────────┐
│ ÉTAPE 2 : Appel de la Fonction (Library.tsx)                     │
│                                                                   │
│  handleQuickMove('doc-2', 'folder-1')                            │
│         ou                                                        │
│  handleMoveDocument('doc-2', 'folder-1')                         │
└──────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────┐
│ ÉTAPE 3 : Fonction Utilitaire (moveFileFolder.ts)                │
│                                                                   │
│  updateFileFolder('doc-2', 'folder-1', 'user-abc')              │
│                                                                   │
│  🔍 Vérifications :                                              │
│    ✅ Document existe ?         → OUI (doc-2)                    │
│    ✅ Appartient à user-abc ?   → OUI                            │
│    ✅ Déjà dans folder-1 ?      → NON (actuellement NULL)        │
└──────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────┐
│ ÉTAPE 4 : Requête SQL vers Supabase                              │
│                                                                   │
│  UPDATE documents                                                 │
│  SET folder_id = 'folder-1'      ← ✅ SEUL CHAMP MODIFIÉ         │
│  WHERE id = 'doc-2'                                               │
│    AND user_id = 'user-abc'                                       │
│                                                                   │
│  ❌ NE TOUCHE PAS :                                               │
│    - name : "Virologie #1.pdf"   (reste identique)               │
│    - storage_path : "173..."     (reste identique)               │
└──────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────┐
│ ÉTAPE 5 : Mise à Jour en Base de Données                         │
│                                                                   │
│  AVANT :                                                          │
│  ┌────────┬─────────┬───────────┬──────────────────┐             │
│  │ doc-2  │ user-abc│ NULL      │ Virologie #1.pdf │             │
│  └────────┴─────────┴───────────┴──────────────────┘             │
│                                                                   │
│  APRÈS :                                                          │
│  ┌────────┬─────────┬───────────┬──────────────────┐             │
│  │ doc-2  │ user-abc│ folder-1  │ Virologie #1.pdf │             │
│  └────────┴─────────┴───────────┴──────────────────┘             │
│                         ↑                                         │
│                    MODIFICATION                                   │
└──────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────┐
│ ÉTAPE 6 : Rafraîchissement de l'Interface                        │
│                                                                   │
│  fetchData() → Récupère les documents mis à jour                 │
│                                                                   │
│  📁 Racine                                                        │
│    └─ (vide maintenant)                                          │
│                                                                   │
│  📁 Médecine                                                      │
│    ├─ 📄 Mon Doc Été.pdf                                         │
│    └─ 📄 Virologie #1.pdf  ← 🆕 Apparaît ici                     │
└──────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────┐
│ ÉTAPE 7 : Notification Utilisateur                               │
│                                                                   │
│  Toast : ✅ "Fichier déplacé !"                                  │
│           "Virologie #1.pdf" a été déplacé avec succès           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📦 Structure des Composants

```
src/
├── pages/
│   └── Library.tsx                    ← Page principale
│       ├── handleMoveDocument()       ← Déplacement via modale
│       ├── handleQuickMove()          ← Déplacement via dropdown
│       └── filteredDocuments          ← Filtre par folder_id
│
├── components/
│   └── modals/
│       └── MoveDocumentModal.tsx      ← Modale de sélection de dossier
│           ├── Liste des dossiers
│           ├── Option "Racine"
│           └── Bouton "Déplacer"
│
├── utils/
│   ├── moveFileFolder.ts              ← ⭐ Fonction principale
│   │   └── updateFileFolder()         ← Met à jour folder_id UNIQUEMENT
│   │
│   └── fileUtils.ts                   ← Utilitaires de nettoyage
│       ├── generateUniqueFileName()   ← Pour les uploads
│       ├── cleanFileName()
│       └── getFileType()
│
└── lib/
    └── supabase.ts                    ← Types et client Supabase
        ├── type Document
        ├── type Folder
        └── uploadFile()
```

---

## 🗂️ Relations entre Tables

```
┌──────────────┐          ┌──────────────┐
│   profiles   │          │   folders    │
│              │          │              │
│  id (PK)     │◄─────────┤  user_id     │
│  email       │          │  id (PK)     │
│  full_name   │          │  name        │
└──────────────┘          │  parent_id ──┼─┐ (Auto-référence)
       ↑                  └──────────────┘ │ pour sous-dossiers
       │                         ↑         │
       │                         │         │
       │                         └─────────┘
       │
       │
┌──────────────────────────────────────────────────┐
│              documents                            │
│                                                   │
│  id (PK)                                         │
│  user_id ───────────────────┐ (FK vers profiles)│
│  folder_id ─────────────────┼───────┐           │
│  name                        │       │           │
│  storage_path                │       │           │
│  file_type                   │       │           │
└──────────────────────────────┼───────┼───────────┘
                               │       │
                               │       └──► (FK vers folders)
                               │            Peut être NULL
                               │
                               └──► (FK vers profiles)
                                    Toujours requis
```

### Cascade de Suppression

```
User supprimé
    ↓
    Tous ses folders supprimés
    ↓
    Tous ses documents : folder_id → NULL (ON DELETE SET NULL)

Folder supprimé
    ↓
    Documents du folder : folder_id → NULL (ON DELETE SET NULL)
```

---

## 🔐 Règles de Sécurité (RLS)

```
┌────────────────────────────────────────────────┐
│  Row Level Security (RLS) sur 'documents'      │
├────────────────────────────────────────────────┤
│                                                 │
│  SELECT : auth.uid() = user_id                 │
│           OR is_shared = true                  │
│                                                 │
│  INSERT : auth.uid() = user_id                 │
│                                                 │
│  UPDATE : auth.uid() = user_id                 │
│                                                 │
│  DELETE : auth.uid() = user_id                 │
│                                                 │
└────────────────────────────────────────────────┘

Lors du déplacement :
    ✅ Vérification automatique par Supabase
    ✅ Double vérification dans le code (user_id)
    ❌ Impossible de déplacer un document d'un autre utilisateur
```

---

## 🎯 Points Clés à Retenir

### ✅ Ce qui CHANGE lors du déplacement

```sql
documents.folder_id : UUID | NULL
                      ↓
        'folder-1' → 'folder-2'   (vers un autre dossier)
            ou
        'folder-1' → NULL         (vers la racine)
            ou
        NULL → 'folder-1'         (de la racine vers un dossier)
```

### ❌ Ce qui NE CHANGE JAMAIS

```sql
documents.name          : "Mon Document Été 2024.pdf"  (JAMAIS modifié)
documents.storage_path  : "1735...mon-document..."     (JAMAIS modifié)
documents.title         : "Mon Document Été 2024"      (JAMAIS modifié)
documents.user_id       : "user-abc"                   (JAMAIS modifié)
```

### 🔄 Fichier Physique dans Supabase Storage

```
Bucket: documents
    │
    ├─ 1735245678901-abc123-mon-document-ete-2024.pdf  ← RESTE ICI
    ├─ 1735245678902-def456-virologie-general-1.pdf    ← RESTE ICI
    └─ 1735245678903-ghi789-cours-partie-1-notes.pdf   ← RESTE ICI

⚠️ Les fichiers NE SE DÉPLACENT JAMAIS physiquement
⚠️ Seule l'organisation logique change en base de données
```

---

## 🎨 Interface Utilisateur

### Vue Grille (Grid View)

```
┌─────────────────────────────────────────────────────────────┐
│  Bibliothèque                      [Nouveau dossier] [Upload]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 📁           │  │ 📁           │  │ 📁           │      │
│  │   Médecine   │  │   Chimie     │  │   Biologie   │      │
│  │ 3 documents  │  │ 5 documents  │  │ 0 documents  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ 📄 PDF       │  │ 📄 DOCX      │                        │
│  │ Virology.pdf │  │ Notes.docx   │                        │
│  │ 27 Dec 2024  │  │ 28 Dec 2024  │                        │
│  │ [Déplacer ▼] │  │ [Déplacer ▼] │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Dropdown de Déplacement

```
┌──────────────┐
│ 📄 Virology  │
│ [Déplacer ▼] │ ← Clic
└──────┬───────┘
       │
       └─────► ┌──────────────────────┐
                │ Déplacer vers :      │
                ├──────────────────────┤
                │ 📁 Racine (aucun)    │
                │ 📁 Médecine       ✓  │
                │ 📁 Chimie            │
                │ 📁 Biologie          │
                └──────────────────────┘
```

### Modale de Déplacement

```
┌───────────────────────────────────────────┐
│  Déplacer le document                  ×  │
├───────────────────────────────────────────┤
│                                           │
│  Virology.pdf                             │
│                                           │
│  Déplacer vers :                          │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ ○ 📁 Aucun dossier (Racine)         │ │
│  │ ● 📁 Médecine            (actuel)   │ │
│  │ ○ 📁 Chimie                         │ │
│  │ ○ 📁 Biologie                       │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  [Annuler]              [Déplacer]        │
└───────────────────────────────────────────┘
```

---

## 📈 Performance et Optimisation

### Indexes SQL

```sql
-- Indexes existants pour optimiser les requêtes

CREATE INDEX idx_documents_user_id 
    ON documents(user_id);

CREATE INDEX idx_documents_folder_id 
    ON documents(folder_id);

CREATE INDEX idx_documents_storage_path 
    ON documents(storage_path);
```

### Requêtes Optimisées

```typescript
// Récupérer tous les documents d'un dossier
const { data } = await supabase
  .from('documents')
  .select('*')
  .eq('user_id', userId)
  .eq('folder_id', folderId);  // ← Utilise idx_documents_folder_id

// Récupérer les documents de la racine
const { data } = await supabase
  .from('documents')
  .select('*')
  .eq('user_id', userId)
  .is('folder_id', null);
```

---

## 🚀 Évolutions Futures Possibles

### 1. Sous-dossiers Imbriqués

```
📁 Médecine
  ├─ 📁 Anatomie
  │   └─ 📄 Coeur.pdf
  ├─ 📁 Physiologie
  │   └─ 📄 Respiration.pdf
  └─ 📄 Généralités.pdf
```

Déjà supporté en base (colonne `parent_id` dans `folders`).
Interface à implémenter.

### 2. Déplacement Multiple

```typescript
// Déplacer plusieurs documents en une fois
await Promise.all(
  selectedDocuments.map(doc => 
    updateFileFolder(doc.id, newFolderId, userId)
  )
);
```

### 3. Drag & Drop

```tsx
<div
  onDrop={(e) => {
    const docId = e.dataTransfer.getData('docId');
    handleQuickMove(docId, folder.id);
  }}
>
  📁 {folder.name}
</div>
```

---

Cette architecture garantit :
- ✅ Performance optimale (indexes SQL)
- ✅ Sécurité (RLS + double vérification)
- ✅ Fiabilité (pas de modification du Storage)
- ✅ Traçabilité (logs détaillés)
- ✅ Expérience utilisateur fluide (toasts + rafraîchissement)

