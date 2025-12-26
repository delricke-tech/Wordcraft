# 📁 Configuration de l'Upload de Documents vers Supabase

## ✅ Ce qui a été implémenté

Votre interface **Library** a été mise à jour pour permettre l'upload complet de documents vers Supabase Storage !

### 🎯 Fonctionnalités ajoutées :

1. ✅ **Bouton "Uploader un document"** avec interface moderne
2. ✅ **Upload réel vers Supabase Storage** (bucket 'documents')
3. ✅ **Enregistrement automatique en base de données** avec toutes les informations
4. ✅ **Support des fichiers** : PDF, DOCX, TXT, Images (JPG, PNG, GIF, WEBP)
5. ✅ **Prévisualisation des fichiers** avant upload
6. ✅ **Gestion des erreurs** avec messages clairs
7. ✅ **Téléchargement des documents** uploadés
8. ✅ **Suppression** des documents (fichier + BDD)
9. ✅ **Drag & Drop** pour uploader facilement

## 🗄️ Structure de la table `documents`

La table `documents` existe déjà dans votre base de données avec les champs suivants :

```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt', 'image', 'url', 'video', 'audio')),
  file_url text,  -- ✅ URL du fichier dans Supabase Storage
  original_url text,
  file_size bigint DEFAULT 0,
  mime_type text,
  extracted_text text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ai_tags text[] DEFAULT '{}',
  ai_summary text,
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error text,
  has_cards boolean DEFAULT false,
  has_quiz boolean DEFAULT false,
  has_audio boolean DEFAULT false,
  confidence_score numeric(3,2),
  page_count integer,
  duration_seconds integer,
  is_shared boolean DEFAULT false,
  share_token text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Politiques RLS (déjà configurées)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_shared = true);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

## 🪣 Configuration du bucket Supabase Storage

### Vérifier que le bucket 'documents' existe :

1. Allez dans Supabase Dashboard → Storage
2. Vérifiez que le bucket **'documents'** existe
3. Si ce n'est pas le cas, créez-le avec ces paramètres :
   - Nom : `documents`
   - Public : ✅ Oui (pour générer des URLs publiques)
   - Taille max : 50 MB

### Politiques Storage (à configurer dans Supabase) :

```sql
-- Permettre aux utilisateurs authentifiés d'uploader dans leur dossier
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permettre aux utilisateurs de voir leurs propres documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permettre aux utilisateurs de supprimer leurs propres documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permettre l'accès public en lecture (pour les URLs publiques)
CREATE POLICY "Public documents are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
```

## 🔧 Comment ça fonctionne

### 1. Upload d'un fichier

```typescript
// Étape 1 : Upload vers Storage
const { data, error } = await supabase.storage
  .from('documents')
  .upload(uniqueFileName, file);

// Étape 2 : Obtenir l'URL publique
const { data: { publicUrl } } = supabase.storage
  .from('documents')
  .getPublicUrl(data.path);

// Étape 3 : Enregistrer en BDD
await supabase.from('documents').insert({
  user_id: user.id,
  title: file.name,
  file_url: publicUrl,  // ✅ URL du fichier
  file_size: file.size,
  mime_type: file.type,
  processing_status: 'completed',
});
```

### 2. Structure des fichiers dans Storage

```
documents/
  └── user-id-1234/
      ├── 1234567890-abc123-document1.pdf
      ├── 1234567891-def456-image.jpg
      └── 1234567892-ghi789-document2.docx
```

Chaque fichier est stocké dans un dossier portant l'ID de l'utilisateur.

## 🎨 Utilisation de l'interface

### Pour uploader un document :

1. Cliquez sur **"Uploader un document"** (bouton bleu en haut à droite)
2. **Glissez-déposez** des fichiers OU cliquez sur "parcourir les fichiers"
3. Sélectionnez un ou plusieurs fichiers (PDF, DOCX, TXT, Images)
4. Vérifiez la liste des fichiers sélectionnés
5. Cliquez sur **"Uploader X fichier(s)"**
6. Les fichiers sont uploadés vers Supabase et enregistrés en BDD ! ✅

### Pour télécharger un document :

- **Vue grille** : Survolez une carte → Cliquez sur l'icône de téléchargement (en haut à gauche)
- **Vue liste** : Cliquez sur l'icône de téléchargement dans la colonne "Actions"
- **Menu contextuel** : Clic droit → "Télécharger"

### Pour supprimer un document :

- La suppression enlève à la fois le fichier du Storage ET l'entrée de la base de données

## 🐛 Résolution de problèmes

### Erreur : "Row Level Security policy violation"
→ Les politiques RLS ne sont pas configurées correctement. Appliquez les politiques Storage ci-dessus.

### Erreur : "Bucket not found"
→ Le bucket 'documents' n'existe pas. Créez-le dans Supabase Dashboard → Storage.

### Erreur : "Failed to upload"
→ Vérifiez que le bucket est configuré comme **public** dans Supabase.

### Les URLs publiques ne fonctionnent pas
→ Vérifiez que la politique "Public documents are viewable by everyone" est active.

## ✅ Checklist de configuration

- [ ] Le bucket 'documents' existe dans Supabase Storage
- [ ] Le bucket est configuré en mode **public**
- [ ] Les politiques Storage sont appliquées (voir ci-dessus)
- [ ] La table `documents` existe (déjà fait ✅)
- [ ] Les politiques RLS sur la table `documents` sont actives (déjà fait ✅)
- [ ] L'application est redémarrée après les modifications
- [ ] Vous êtes connecté avec un compte utilisateur

## 🎉 Test de l'upload

1. Connectez-vous à l'application
2. Allez dans **Bibliothèque**
3. Cliquez sur **"Uploader un document"**
4. Uploadez un fichier PDF de test
5. Le fichier devrait apparaître dans la liste avec un badge "Terminé"
6. Survolez la carte → Téléchargez le fichier pour vérifier

**Tout est prêt !** 🚀
