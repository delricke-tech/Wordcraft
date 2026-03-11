-- ===========================================
-- Migration: Création des tables de sauvegarde
-- Date: 11 mars 2025
-- Phase 3.5 - Production & fiabilité
-- ===========================================

-- Table pour les métadonnées de sauvegardes
CREATE TABLE IF NOT EXISTS backup_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version TEXT NOT NULL DEFAULT '1.0.0',
    config JSONB NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'created',
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les fichiers de sauvegarde (stockage dans Supabase Storage)
CREATE TABLE IF NOT EXISTS backup_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id UUID NOT NULL REFERENCES backup_metadata(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL DEFAULT 'application/json',
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les planifications de sauvegardes automatiques
CREATE TABLE IF NOT EXISTS backup_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    config JSONB NOT NULL,
    next_backup TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les logs de sauvegarde
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id UUID REFERENCES backup_metadata(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    message TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_backup_metadata_user_id ON backup_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_timestamp ON backup_metadata(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_status ON backup_metadata(status);
CREATE INDEX IF NOT EXISTS idx_backup_files_backup_id ON backup_files(backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_user_id ON backup_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_next_backup ON backup_schedules(next_backup);
CREATE INDEX IF NOT EXISTS idx_backup_logs_backup_id ON backup_logs(backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at DESC);

-- RLS (Row Level Security) pour backup_metadata
ALTER TABLE backup_metadata ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres sauvegardes
CREATE POLICY "Users can view own backups" ON backup_metadata
    FOR SELECT USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent créer leurs propres sauvegardes
CREATE POLICY "Users can create own backups" ON backup_metadata
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent mettre à jour leurs propres sauvegardes
CREATE POLICY "Users can update own backups" ON backup_metadata
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres sauvegardes
CREATE POLICY "Users can delete own backups" ON backup_metadata
    FOR DELETE USING (auth.uid() = user_id);

-- RLS pour backup_files
ALTER TABLE backup_files ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir les fichiers de leurs sauvegardes
CREATE POLICY "Users can view own backup files" ON backup_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM backup_metadata bm 
            WHERE bm.id = backup_files.backup_id 
            AND bm.user_id = auth.uid()
        )
    );

-- Politique: Les utilisateurs peuvent créer des fichiers pour leurs sauvegardes
CREATE POLICY "Users can create own backup files" ON backup_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM backup_metadata bm 
            WHERE bm.id = backup_files.backup_id 
            AND bm.user_id = auth.uid()
        )
    );

-- Politique: Les utilisateurs peuvent supprimer les fichiers de leurs sauvegardes
CREATE POLICY "Users can delete own backup files" ON backup_files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM backup_metadata bm 
            WHERE bm.id = backup_files.backup_id 
            AND bm.user_id = auth.uid()
        )
    );

-- RLS pour backup_schedules
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres planifications
CREATE POLICY "Users can view own backup schedules" ON backup_schedules
    FOR SELECT USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent créer leurs propres planifications
CREATE POLICY "Users can create own backup schedules" ON backup_schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent mettre à jour leurs propres planifications
CREATE POLICY "Users can update own backup schedules" ON backup_schedules
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres planifications
CREATE POLICY "Users can delete own backup schedules" ON backup_schedules
    FOR DELETE USING (auth.uid() = user_id);

-- RLS pour backup_logs
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir les logs de leurs sauvegardes
CREATE POLICY "Users can view own backup logs" ON backup_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM backup_metadata bm 
            WHERE bm.id = backup_logs.backup_id 
            AND bm.user_id = auth.uid()
        )
    );

-- Politique: Les utilisateurs peuvent créer des logs pour leurs sauvegardes
CREATE POLICY "Users can create own backup logs" ON backup_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM backup_metadata bm 
            WHERE bm.id = backup_logs.backup_id 
            AND bm.user_id = auth.uid()
        )
    );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_backup_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_backup_metadata_updated_at
    BEFORE UPDATE ON backup_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_backup_metadata_updated_at();

CREATE OR REPLACE FUNCTION update_backup_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_backup_schedules_updated_at
    BEFORE UPDATE ON backup_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_backup_schedules_updated_at();

-- Trigger pour loguer les actions de sauvegarde
CREATE OR REPLACE FUNCTION log_backup_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO backup_logs (backup_id, action, status, message)
        VALUES (NEW.id, 'CREATE', 'started', 'Backup creation started');
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO backup_logs (backup_id, action, status, message)
        VALUES (NEW.id, 'UPDATE', 'modified', 'Backup metadata updated');
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO backup_logs (backup_id, action, status, message)
        VALUES (OLD.id, 'DELETE', 'completed', 'Backup deleted');
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_backup_metadata_actions
    AFTER INSERT OR UPDATE OR DELETE ON backup_metadata
    FOR EACH ROW
    EXECUTE FUNCTION log_backup_action();

-- Vue pour les sauvegardes avec statistiques
CREATE OR REPLACE VIEW backup_summary AS
SELECT 
    bm.id,
    bm.user_id,
    bm.timestamp,
    bm.version,
    bm.status,
    bm.size_bytes,
    bm.file_url,
    bm.created_at,
    bm.updated_at,
    COUNT(bf.id) as file_count,
    SUM(bf.file_size) as total_file_size
FROM backup_metadata bm
LEFT JOIN backup_files bf ON bm.id = bf.backup_id
GROUP BY bm.id, bm.user_id, bm.timestamp, bm.version, bm.status, bm.size_bytes, bm.file_url, bm.created_at, bm.updated_at;

-- Vue pour les sauvegardes récentes par utilisateur
CREATE OR REPLACE VIEW user_recent_backups AS
SELECT 
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY timestamp DESC) as backup_rank,
    id,
    user_id,
    timestamp,
    version,
    status,
    size_bytes,
    created_at
FROM backup_metadata;

-- Fonction pour nettoyer les anciennes sauvegardes
CREATE OR REPLACE FUNCTION cleanup_old_backups(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM backup_metadata 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE backup_metadata IS 'Métadonnées des sauvegardes des utilisateurs';
COMMENT ON TABLE backup_files IS 'Fichiers de sauvegarde stockés dans Supabase Storage';
COMMENT ON TABLE backup_schedules IS 'Planifications des sauvegardes automatiques';
COMMENT ON TABLE backup_logs IS 'Logs des opérations de sauvegarde';

-- Commentaires sur les colonnes
COMMENT ON COLUMN backup_metadata.id IS 'Identifiant unique de la sauvegarde';
COMMENT ON COLUMN backup_metadata.user_id IS 'ID de l''utilisateur propriétaire';
COMMENT ON COLUMN backup_metadata.timestamp IS 'Date et heure de la sauvegarde';
COMMENT ON COLUMN backup_metadata.version IS 'Version du format de sauvegarde';
COMMENT ON COLUMN backup_metadata.config IS 'Configuration de la sauvegarde (JSON)';
COMMENT ON COLUMN backup_metadata.size_bytes IS 'Taille de la sauvegarde en octets';
COMMENT ON COLUMN backup_metadata.checksum IS 'Checksum SHA-256 pour vérifier l''intégrité';
COMMENT ON COLUMN backup_metadata.status IS 'Statut de la sauvegarde (created, completed, failed, deleted)';
COMMENT ON COLUMN backup_metadata.file_url IS 'URL du fichier de sauvegarde dans le stockage';

COMMENT ON COLUMN backup_files.id IS 'Identifiant unique du fichier de sauvegarde';
COMMENT ON COLUMN backup_files.backup_id IS 'Référence à la sauvegarde parente';
COMMENT ON COLUMN backup_files.file_name IS 'Nom du fichier de sauvegarde';
COMMENT ON COLUMN backup_files.file_path IS 'Chemin du fichier dans le stockage';
COMMENT ON COLUMN backup_files.file_size IS 'Taille du fichier en octets';
COMMENT ON COLUMN backup_files.storage_path IS 'Chemin dans Supabase Storage';

COMMENT ON COLUMN backup_schedules.frequency IS 'Fréquence de la sauvegarde automatique';
COMMENT ON COLUMN backup_schedules.next_backup IS 'Date de la prochaine sauvegarde';
COMMENT ON COLUMN backup_schedules.is_active IS 'Indique si la planification est active';

COMMENT ON COLUMN backup_logs.action IS 'Action effectuée (CREATE, UPDATE, DELETE)';
COMMENT ON COLUMN backup_logs.status IS 'Statut de l''action';
COMMENT ON COLUMN backup_logs.message IS 'Message descriptif de l''action';
COMMENT ON COLUMN backup_logs.details IS 'Détails additionnels (JSON)';
