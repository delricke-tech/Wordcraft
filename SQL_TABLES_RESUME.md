# 📊 Code SQL Final - Tables Folders et Documents

## 🎯 Tables à créer dans Supabase

### Fichier SQL : `supabase/create_folders_documents_tables.sql`

---

## 📁 Table FOLDERS

### Structure
```sql
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'folder',
  created_at timestamptz DEFAULT now()
);
```

### Champs
| Nom | Type | Description |
|-----|------|-------------|
| `id` | uuid | Identifiant unique du dossier |
| `user_id` | uuid | ID de l'utilisateur propriétaire |
| `name` | text | Nom du dossier |
| `parent_id` | uuid (nullable) | ID du dossier parent (pour arborescence) |
| `color` | text | Couleur du dossier (hex, défaut: #3B82F6) |
| `icon` | text | Nom de l'icône (défaut: 'folder') |
| `created_at` | timestamptz | Date de création |

### Politiques RLS
- ✅ Lecture : Voir ses propres dossiers
- ✅ Insertion : Créer ses propres dossiers
- ✅ Mise à jour : Modifier ses propres dossiers
- ✅ Suppression : Supprimer ses propres dossiers

### Index
- `idx_folders_user_id` sur `user_id`
- `idx_folders_parent_id` sur `parent_id`

---

## 📄 Table DOCUMENTS

### Structure
```sql
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt', 'image', 'url', 'video', 'audio')),
  file_url text,
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
```

### Champs - Informations de base
| Nom | Type | Description |
|-----|------|-------------|
| `id` | uuid | Identifiant unique du document |
| `user_id` | uuid | ID de l'utilisateur propriétaire |
| `folder_id` | uuid (nullable) | ID du dossier contenant le document |
| `title` | text | Titre/nom du document |
| `description` | text (nullable) | Description du document |

### Champs - Fichier
| Nom | Type | Description |
|-----|------|-------------|
| `file_type` | text | Type : 'pdf', 'docx', 'txt', 'image', 'url', 'video', 'audio' |
| `file_url` | text (nullable) | **URL du fichier dans Supabase Storage** |
| `original_url` | text (nullable) | URL d'origine si importé du web |
| `file_size` | bigint | Taille du fichier en bytes |
| `mime_type` | text (nullable) | Type MIME (ex: application/pdf) |

### Champs - Contenu et IA
| Nom | Type | Description |
|-----|------|-------------|
| `extracted_text` | text (nullable) | Texte extrait du document |
| `metadata` | jsonb | Métadonnées additionnelles (JSON) |
| `ai_tags` | text[] | Tags générés par l'IA |
| `ai_summary` | text (nullable) | Résumé généré par l'IA |

### Champs - Traitement
| Nom | Type | Description |
|-----|------|-------------|
| `processing_status` | text | 'pending', 'processing', 'completed', 'failed' |
| `processing_error` | text (nullable) | Message d'erreur si échec |

### Champs - Contenu généré
| Nom | Type | Description |
|-----|------|-------------|
| `has_cards` | boolean | Le document a des fiches de révision |
| `has_quiz` | boolean | Le document a un quiz |
| `has_audio` | boolean | Le document a un audio |

### Champs - Métriques
| Nom | Type | Description |
|-----|------|-------------|
| `confidence_score` | numeric(3,2) | Score de confiance (0-1) |
| `page_count` | integer (nullable) | Nombre de pages |
| `duration_seconds` | integer (nullable) | Durée en secondes (vidéo/audio) |

### Champs - Partage
| Nom | Type | Description |
|-----|------|-------------|
| `is_shared` | boolean | Document partagé publiquement |
| `share_token` | text (nullable, unique) | Token de partage unique |

### Champs - Timestamps
| Nom | Type | Description |
|-----|------|-------------|
| `created_at` | timestamptz | Date de création |
| `updated_at` | timestamptz | Date de dernière modification |

### Politiques RLS
- ✅ Lecture : Voir ses propres documents + documents partagés
- ✅ Insertion : Créer ses propres documents
- ✅ Mise à jour : Modifier ses propres documents
- ✅ Suppression : Supprimer ses propres documents

### Index
- `idx_documents_user_id` sur `user_id`
- `idx_documents_folder_id` sur `folder_id`
- `idx_documents_processing_status` sur `processing_status`
- `idx_documents_file_type` sur `file_type`

---

## 🔄 Trigger AUTO-UPDATE

Un trigger met automatiquement à jour `updated_at` lors de chaque modification :

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 🚀 Comment utiliser ce SQL

### Méthode 1 : Via Supabase Dashboard
1. Allez sur Supabase Dashboard
2. SQL Editor
3. Copiez le contenu de `supabase/create_folders_documents_tables.sql`
4. Collez et exécutez ▶️

### Méthode 2 : Via CLI Supabase
```bash
supabase db push
```

### Méthode 3 : Créer une migration
```bash
supabase migration new create_folders_documents
# Copiez le contenu SQL dans le fichier de migration créé
supabase db push
```

---

## ✅ Vérification

### Vérifier que les tables existent
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('folders', 'documents');
```

### Vérifier les politiques RLS
```sql
SELECT * 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('folders', 'documents');
```

### Vérifier les index
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('folders', 'documents');
```

---

## 📊 Exemple de données

### Exemple : Créer un dossier
```sql
INSERT INTO folders (user_id, name, color, icon)
VALUES (
  'user-uuid-here',
  'Cours de médecine',
  '#10B981',
  'book-medical'
);
```

### Exemple : Créer un document
```sql
INSERT INTO documents (
  user_id, 
  folder_id, 
  title, 
  file_type, 
  file_url, 
  file_size,
  processing_status
)
VALUES (
  'user-uuid-here',
  'folder-uuid-here',
  'Anatomie_Chapitre1.pdf',
  'pdf',
  'https://xxx.supabase.co/storage/v1/object/public/documents/user-id/file.pdf',
  1048576,
  'completed'
);
```

---

## 🎯 Résumé

**Tables créées :**
- ✅ `folders` - Organisation des documents
- ✅ `documents` - Stockage des fichiers et métadonnées

**Fonctionnalités :**
- ✅ Row Level Security (RLS)
- ✅ Index de performance
- ✅ Trigger auto-update
- ✅ Contraintes de validation
- ✅ Relations entre tables
- ✅ Support multi-formats
- ✅ Partage sécurisé

**Prêt pour :**
- ✅ Upload de fichiers vers Supabase Storage
- ✅ Organisation par dossiers
- ✅ Analyse IA des documents
- ✅ Génération de contenu (fiches, quiz)
- ✅ Partage de documents
