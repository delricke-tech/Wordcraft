-- ============================================================================
-- CODE SQL FINAL POUR CRÉER LES TABLES FOLDERS ET DOCUMENTS
-- ============================================================================
-- Ce fichier contient le code SQL complet pour créer les tables folders et documents
-- Si elles n'existent pas encore dans votre base de données Supabase.

-- ============================================================================
-- TABLE FOLDERS (Dossiers pour organiser les documents)
-- ============================================================================

CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'folder',
  created_at timestamptz DEFAULT now()
);

-- Activer Row Level Security
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour folders
CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

-- ============================================================================
-- TABLE DOCUMENTS (Fichiers et ressources)
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  
  -- Type de fichier avec contrainte
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt', 'image', 'url', 'video', 'audio')),
  
  -- URLs et métadonnées du fichier
  file_url text,  -- URL du fichier dans Supabase Storage
  original_url text,  -- URL d'origine si importé depuis le web
  file_size bigint DEFAULT 0,
  mime_type text,
  
  -- Contenu extrait et analyse IA
  extracted_text text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ai_tags text[] DEFAULT '{}',
  ai_summary text,
  
  -- Statut de traitement
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error text,
  
  -- Contenu généré
  has_cards boolean DEFAULT false,
  has_quiz boolean DEFAULT false,
  has_audio boolean DEFAULT false,
  
  -- Métriques
  confidence_score numeric(3,2),
  page_count integer,
  duration_seconds integer,
  
  -- Partage
  is_shared boolean DEFAULT false,
  share_token text UNIQUE,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour documents
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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);

-- ============================================================================
-- TRIGGER POUR METTRE À JOUR updated_at AUTOMATIQUEMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger sur documents
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VÉRIFICATION DES TABLES CRÉÉES
-- ============================================================================

-- Pour vérifier que tout est créé correctement, exécutez :
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('folders', 'documents');

-- Pour vérifier les politiques RLS :
-- SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('folders', 'documents');

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
--
-- 1. FOLDERS :
--    - Permet d'organiser les documents en arborescence
--    - parent_id permet de créer des sous-dossiers
--    - Chaque utilisateur voit uniquement ses propres dossiers
--
-- 2. DOCUMENTS :
--    - Stocke les informations sur les fichiers uploadés
--    - file_url contient l'URL du fichier dans Supabase Storage
--    - processing_status suit le traitement du document
--    - Les documents peuvent être partagés via share_token
--
-- 3. SÉCURITÉ :
--    - Row Level Security (RLS) activé sur les deux tables
--    - Chaque utilisateur ne peut voir que ses propres données
--    - Les documents partagés (is_shared = true) sont visibles par tous
--
-- 4. PERFORMANCES :
--    - Index créés sur les colonnes fréquemment utilisées
--    - Trigger pour updated_at automatique
--
-- ============================================================================
