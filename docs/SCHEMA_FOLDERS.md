# Schéma de Base de Données - Système de Dossiers

## ✅ Statut : Déjà implémenté dans votre base Supabase

Votre base de données possède déjà la structure nécessaire pour le système de dossiers. Voici le schéma pour référence :

## Table `folders`

```sql
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  color text DEFAULT '#6B7280',
  icon text DEFAULT 'folder',
  created_at timestamptz DEFAULT now()
);
```

### Champs:
- `id` : Identifiant unique du dossier (UUID)
- `user_id` : Référence vers l'utilisateur propriétaire
- `name` : Nom du dossier (affiché dans l'interface)
- `parent_id` : Référence vers un dossier parent (pour des sous-dossiers)
- `color` : Couleur du dossier (hex, par défaut gris)
- `icon` : Icône du dossier (par défaut 'folder')
- `created_at` : Date de création

### Politiques RLS (Row Level Security)

```sql
-- Les utilisateurs peuvent voir leurs propres dossiers
CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres dossiers
CREATE POLICY "Users can insert own folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres dossiers
CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres dossiers
CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

## Table `documents` (modification)

La table `documents` a été étendue avec la colonne `folder_id` :

```sql
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,  -- ✅ Nouvelle colonne
  title text NOT NULL,
  -- ... autres colonnes ...
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### `folder_id` :
- Référence optionnelle vers un dossier
- `ON DELETE SET NULL` : Si le dossier est supprimé, le document reste mais `folder_id` devient `NULL`
- Les documents avec `folder_id = NULL` sont affichés à la racine (sans dossier)

## Index de Performance

```sql
-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
```

## Utilisation dans l'application

### Créer un dossier

```typescript
const { data, error } = await supabase
  .from('folders')
  .insert({
    user_id: user.id,
    name: 'Mon dossier',
    color: '#6B7280',
    icon: 'folder',
  })
  .select()
  .single();
```

### Uploader un document dans un dossier

```typescript
const { data, error } = await supabase
  .from('documents')
  .insert({
    name: 'document.pdf',
    storage_path: 'chemin/vers/fichier.pdf',
    user_id: user.id,
    file_type: 'pdf',
    folder_id: 'id-du-dossier', // ✅ Associer au dossier
  });
```

### Récupérer les documents d'un dossier

```typescript
// Tous les documents d'un dossier spécifique
const { data } = await supabase
  .from('documents')
  .select('*')
  .eq('folder_id', folderId);

// Tous les documents sans dossier (racine)
const { data } = await supabase
  .from('documents')
  .select('*')
  .is('folder_id', null);
```

## Architecture de l'Interface

### Composants créés

1. **`NewFolderModal`** : Modale pour créer un nouveau dossier
2. **`FolderSelector`** : Sélecteur de dossier pour l'upload de documents

### Flux utilisateur

1. **Vue principale (racine)** :
   - Affiche tous les dossiers en haut (grille de cartes)
   - Affiche tous les documents sans dossier en dessous

2. **Vue dossier** :
   - Cliquer sur un dossier → filtre les documents
   - Fil d'ariane en haut : "Tous les dossiers > Nom du dossier"
   - Bouton retour pour revenir à la racine

3. **Upload avec dossier** :
   - Cliquer sur "Upload PDF" → modale avec sélecteur
   - Choisir un dossier ou "Aucun dossier (Racine)"
   - Les documents sont automatiquement associés au dossier choisi

## Règles Respectées

✅ **Nettoyage des noms de fichiers** : Les noms de fichiers sont nettoyés pour Supabase Storage mais le nom original est conservé dans `documents.name` pour l'affichage.

✅ **Sécurité RLS** : Chaque utilisateur ne voit que ses propres dossiers et documents.

✅ **Performance** : Index sur `folder_id` pour des requêtes rapides.

---

**Date de création** : 28 décembre 2024

