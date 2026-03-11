-- Migration: Création des tables pour l'internationalisation i18n (FR/EN/ES)
-- Date: 11 mars 2026
-- Description: Tables pour gérer les langues, traductions et préférences utilisateur

-- Table des langues
CREATE TABLE IF NOT EXISTS languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    native_name VARCHAR(255) NOT NULL,
    flag VARCHAR(10) NOT NULL,
    rtl BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    region VARCHAR(50),
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(15) DEFAULT 'HH:mm:ss',
    number_format JSONB NOT NULL DEFAULT '{}',
    currency JSONB NOT NULL DEFAULT '{}',
    plural_rules JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (completion_rate >= 0 AND completion_rate <= 100)
);

-- Table des traductions
CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL,
    language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    context VARCHAR(255),
    plural_form VARCHAR(20) DEFAULT 'other',
    is_verified BOOLEAN DEFAULT false,
    is_auto_translated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    translated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    UNIQUE(language_id, key, plural_form)
);

-- Table des espaces de noms de traductions
CREATE TABLE IF NOT EXISTS translation_namespaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    key_count INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des clés de traduction
CREATE TABLE IF NOT EXISTS translation_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    namespace VARCHAR(100) NOT NULL DEFAULT 'common',
    key VARCHAR(255) NOT NULL,
    description TEXT,
    context VARCHAR(255),
    plural BOOLEAN DEFAULT false,
    max_length INTEGER,
    variables TEXT[] DEFAULT '{}',
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(namespace, key)
);

-- Table des préférences de langue utilisateur
CREATE TABLE IF NOT EXISTS user_language_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT true,
    fallback_language_id UUID REFERENCES languages(id) ON DELETE SET NULL,
    auto_detect BOOLEAN DEFAULT false,
    date_format VARCHAR(20),
    time_format VARCHAR(15),
    number_format VARCHAR(50),
    timezone VARCHAR(50),
    custom_translations JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table des sessions de traduction (pour le suivi)
CREATE TABLE IF NOT EXISTS translation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    language_id UUID REFERENCES languages(id) ON DELETE SET NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- en secondes
    translations_requested INTEGER DEFAULT 0,
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    device_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exports de traductions
CREATE TABLE IF NOT EXISTS translation_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    export_format VARCHAR(20) NOT NULL CHECK (export_format IN ('json', 'csv', 'xliff', 'po')),
    export_data JSONB NOT NULL,
    file_name VARCHAR(255),
    download_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    public_token UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Index pour les performances
CREATE INDEX idx_languages_code ON languages(code);
CREATE INDEX idx_languages_is_active ON languages(is_active);
CREATE INDEX idx_languages_is_default ON languages(is_default);
CREATE INDEX idx_languages_usage_count ON languages(usage_count DESC);
CREATE INDEX idx_languages_completion_rate ON languages(completion_rate DESC);
CREATE INDEX idx_languages_created_at ON languages(created_at DESC);

CREATE INDEX idx_translations_key ON translations(key);
CREATE INDEX idx_translations_language_id ON translations(language_id);
CREATE INDEX idx_translations_is_verified ON translations(is_verified);
CREATE INDEX idx_translations_is_auto_translated ON translations(is_auto_translated);
CREATE INDEX idx_translations_plural_form ON translations(plural_form);
CREATE INDEX idx_translations_created_at ON translations(created_at DESC);
CREATE INDEX idx_translations_updated_at ON translations(updated_at DESC);

CREATE INDEX idx_translation_namespaces_name ON translation_namespaces(name);
CREATE INDEX idx_translation_namespaces_is_active ON translation_namespaces(is_active);
CREATE INDEX idx_translation_namespaces_is_system ON translation_namespaces(is_system);

CREATE INDEX idx_translation_keys_namespace ON translation_keys(namespace);
CREATE INDEX idx_translation_keys_key ON translation_keys(key);
CREATE INDEX idx_translation_keys_plural ON translation_keys(plural);
CREATE INDEX idx_translation_keys_is_required ON translation_keys(is_required);

CREATE INDEX idx_user_language_preferences_user_id ON user_language_preferences(user_id);
CREATE INDEX idx_user_language_preferences_language_id ON user_language_preferences(language_id);
CREATE INDEX idx_user_language_preferences_is_primary ON user_language_preferences(is_primary);
CREATE INDEX idx_user_language_preferences_auto_detect ON user_language_preferences(auto_detect);
CREATE INDEX idx_user_language_preferences_last_used_at ON user_language_preferences(last_used_at DESC);

CREATE INDEX idx_translation_sessions_user_id ON translation_sessions(user_id);
CREATE INDEX idx_translation_sessions_language_id ON translation_sessions(language_id);
CREATE INDEX idx_translation_sessions_session_start ON translation_sessions(session_start DESC);
CREATE INDEX idx_translation_sessions_duration ON translation_sessions(duration DESC);

CREATE INDEX idx_translation_exports_language_id ON translation_exports(language_id);
CREATE INDEX idx_translation_exports_user_id ON translation_exports(user_id);
CREATE INDEX idx_translation_exports_export_format ON translation_exports(export_format);
CREATE INDEX idx_translation_exports_is_public ON translation_exports(is_public);
CREATE INDEX idx_translation_exports_public_token ON translation_exports(public_token);
CREATE INDEX idx_translation_exports_created_at ON translation_exports(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_languages_updated_at 
    BEFORE UPDATE ON languages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translations_updated_at 
    BEFORE UPDATE ON translations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translation_namespaces_updated_at 
    BEFORE UPDATE ON translation_namespaces 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translation_keys_updated_at 
    BEFORE UPDATE ON translation_keys 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_language_preferences_updated_at 
    BEFORE UPDATE ON user_language_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour le compteur d'utilisation des langues
CREATE OR REPLACE FUNCTION increment_language_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE languages
    SET usage_count = usage_count + 1
    WHERE id = NEW.language_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_language_usage
    AFTER INSERT ON user_language_preferences
    FOR EACH ROW EXECUTE FUNCTION increment_language_usage();

-- Trigger pour mettre à jour le taux de complétion
CREATE OR REPLACE FUNCTION update_language_completion_rate()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE languages
    SET completion_rate = (
        SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE (COUNT(*) FILTER (WHERE value IS NOT NULL AND value != '') * 100.0 / COUNT(*))
            END
        FROM translations
        WHERE language_id = COALESCE(NEW.language_id, OLD.language_id)
    )
    WHERE id = COALESCE(NEW.language_id, OLD.language_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_language_completion_rate
    AFTER INSERT OR UPDATE OR DELETE ON translations
    FOR EACH ROW EXECUTE FUNCTION update_language_completion_rate();

-- Politiques RLS pour les langues
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active languages" ON languages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view language details" ON languages
    FOR SELECT USING (true);

-- Politiques RLS pour les traductions
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view translations" ON translations
    FOR SELECT USING (true);

CREATE POLICY "Users can create translations" ON translations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own translations" ON translations
    FOR UPDATE USING (translated_by = auth.uid());

-- Politiques RLS pour les espaces de noms
ALTER TABLE translation_namespaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active namespaces" ON translation_namespaces
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view namespace details" ON translation_namespaces
    FOR SELECT USING (true);

-- Politiques RLS pour les clés de traduction
ALTER TABLE translation_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view translation keys" ON translation_keys
    FOR SELECT USING (true);

-- Politiques RLS pour les préférences utilisateur
ALTER TABLE user_language_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own language preferences" ON user_language_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own language preferences" ON user_language_preferences
    FOR ALL USING (user_id = auth.uid());

-- Politiques RLS pour les sessions de traduction
ALTER TABLE translation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own translation sessions" ON translation_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own translation sessions" ON translation_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour les exports
ALTER TABLE translation_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own translation exports" ON translation_exports
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view public translation exports" ON translation_exports
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create translation exports" ON translation_exports
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fonctions RPC pour l'i18n

-- Fonction pour obtenir les statistiques i18n
CREATE OR REPLACE FUNCTION get_i18n_stats()
RETURNS TABLE (
    total_languages BIGINT,
    active_languages BIGINT,
    total_translations BIGINT,
    verified_translations BIGINT,
    auto_translations BIGINT,
    completion_by_language JSONB,
    usage_by_language JSONB,
    top_translations JSONB,
    user_preferences JSONB,
    quality_metrics JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH language_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_active = true) as active
        FROM languages
    ),
    translation_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_verified = true) as verified,
            COUNT(*) FILTER (WHERE is_auto_translated = true) as auto_translated
        FROM translations
    ),
    completion_by_language_stats AS (
        SELECT jsonb_object_agg(code, completion_rate)
        FROM (
            SELECT 
                l.code,
                l.completion_rate
            FROM languages l
            WHERE l.is_active = true
        ) completion_stats
    ),
    usage_by_language_stats AS (
        SELECT jsonb_object_agg(code, usage_count)
        FROM (
            SELECT 
                l.code,
                l.usage_count
            FROM languages l
            WHERE l.is_active = true
            AND l.usage_count > 0
        ) usage_stats
    ),
    top_translations_stats AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'key', t.key,
                'usage', COALESCE(ts.usage_count, 0),
                'language', l.code
            )
        )
        FROM (
            SELECT 
                t.key,
                l.code,
                COUNT(*) as usage_count
            FROM translation_sessions ts
            JOIN languages l ON ts.language_id = l.id
            CROSS JOIN LATERAL unnest(string_to_array(ts.device_info->>'requested_keys', ',')) AS t(key)
            WHERE ts.session_start >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY t.key, l.code
            ORDER BY usage_count DESC
            LIMIT 20
        ) top_transs
    ),
    user_preferences_stats AS (
        SELECT jsonb_build_object(
            'totalUsers', COUNT(DISTINCT ulp.user_id),
            'autoDetectEnabled', COUNT(*) FILTER (WHERE auto_detect = true),
            'customTranslations', COUNT(*) FILTER (WHERE jsonb_typeof(custom_translations) = 'object' AND jsonb_array_length(custom_translations) > 0)
        )
        FROM user_language_preferences ulp
    ),
    quality_metrics_stats AS (
        SELECT jsonb_build_object(
            'averageConfidence', COALESCE(AVG((metadata->>'confidence')::DECIMAL), 0),
            'verificationRate', COUNT(*) FILTER (WHERE is_verified = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100,
            'errorRate', COUNT(*) FILTER (WHERE value IS NULL OR value = '')::DECIMAL / NULLIF(COUNT(*), 0) * 100
        )
        FROM translations
    )
    SELECT 
        ls.total as total_languages,
        ls.active as active_languages,
        ts.total as total_translations,
        ts.verified as verified_translations,
        ts.auto_translated as auto_translations,
        cbs.completion_by_language as completion_by_language,
        ubs.usage_by_language as usage_by_language,
        tts.top_translations_stats as top_translations,
        ups.user_preferences_stats as user_preferences,
        qms.quality_metrics_stats as quality_metrics
    FROM language_stats ls, translation_stats ts, completion_by_language_stats cbs,
         usage_by_language_stats ubs, top_translations_stats tts,
         user_preferences_stats ups, quality_metrics_stats qms;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les langues par défaut
CREATE OR REPLACE FUNCTION create_default_languages()
RETURNS VOID AS $$
BEGIN
    -- Français
    INSERT INTO languages (code, name, display_name, native_name, flag, rtl, is_default,
                           date_format, time_format, number_format, currency, plural_rules)
    VALUES (
        'fr',
        'French',
        'Français',
        'Français',
        '🇫🇷',
        false,
        true,
        'DD/MM/YYYY',
        'HH:mm',
        '{
            "decimal": ",",
            "thousands": " ",
            "grouping": [3],
            "currency": "€",
            "percent": "%"
        }'::jsonb,
        '{
            "code": "EUR",
            "symbol": "€",
            "position": "after",
            "decimalDigits": 2
        }'::jsonb,
        '[{"rule": "n == 1", "count": 1, "examples": ["1"]}, {"rule": "n != 1", "count": 2, "examples": ["0", "2", "5"]}]'
    )
    ON CONFLICT (code) DO NOTHING;

    -- Anglais
    INSERT INTO languages (code, name, display_name, native_name, flag, rtl, is_default,
                           date_format, time_format, number_format, currency, plural_rules)
    VALUES (
        'en',
        'English',
        'English',
        'English',
        '🇬🇧',
        false,
        false,
        'MM/DD/YYYY',
        'h:mm A',
        '{
            "decimal": ".",
            "thousands": ",",
            "grouping": [3],
            "currency": "$",
            "percent": "%"
        }'::jsonb,
        '{
            "code": "USD",
            "symbol": "$",
            "position": "before",
            "decimalDigits": 2
        }'::jsonb,
        '[{"rule": "n == 1", "count": 1, "examples": ["1"]}, {"rule": "n != 1", "count": 2, "examples": ["0", "2", "5"]}]'
    )
    ON CONFLICT (code) DO NOTHING;

    -- Espagnol
    INSERT INTO languages (code, name, display_name, native_name, flag, rtl, is_default,
                           date_format, time_format, number_format, currency, plural_rules)
    VALUES (
        'es',
        'Spanish',
        'Español',
        'Español',
        '🇪🇸',
        false,
        false,
        'DD/MM/YYYY',
        'HH:mm',
        '{
            "decimal": ",",
            "thousands": ".",
            "grouping": [3],
            "currency": "€",
            "percent": "%"
        }'::jsonb,
        '{
            "code": "EUR",
            "symbol": "€",
            "position": "after",
            "decimalDigits": 2
        }'::jsonb,
        '[{"rule": "n == 1", "count": 1, "examples": ["1"]}, {"rule": "n != 1", "count": 2, "examples": ["0", "2", "5"]}]'
    )
    ON CONFLICT (code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les clés de traduction de base
CREATE OR REPLACE FUNCTION create_basic_translation_keys()
RETURNS VOID AS $$
BEGIN
    -- Espaces de noms
    INSERT INTO translation_namespaces (name, description, is_system)
    VALUES 
        ('common', 'Traductions communes générales', true),
        ('navigation', 'Navigation et menus', true),
        ('auth', 'Authentification et autorisation', true),
        ('documents', 'Gestion des documents', true),
        ('errors', 'Messages d\'erreur', true),
        ('success', 'Messages de succès', true),
        ('ui', 'Interface utilisateur', true)
    ON CONFLICT (name) DO NOTHING;

    -- Clés de traduction communes
    INSERT INTO translation_keys (namespace, key, description, plural, variables, is_required)
    VALUES 
        ('common', 'welcome', 'Message de bienvenue', false, ARRAY['name'], true),
        ('common', 'loading', 'Message de chargement', false, ARRAY[], true),
        ('common', 'save', 'Bouton sauvegarder', false, ARRAY[], true),
        ('common', 'cancel', 'Bouton annuler', false, ARRAY[], true),
        ('common', 'delete', 'Bouton supprimer', false, ARRAY[], true),
        ('common', 'edit', 'Bouton éditer', false, ARRAY[], true),
        ('common', 'search', 'Rechercher', false, ARRAY[], true),
        ('common', 'filter', 'Filtrer', false, ARRAY[], true),
        ('common', 'sort', 'Trier', false, ARRAY[], true),
        ('common', 'items', 'Éléments (pluriel)', true, ARRAY['count'], true),
        ('navigation', 'home', 'Accueil', false, ARRAY[], true),
        ('navigation', 'dashboard', 'Tableau de bord', false, ARRAY[], true),
        ('navigation', 'profile', 'Profil', false, ARRAY[], true),
        ('navigation', 'settings', 'Paramètres', false, ARRAY[], true),
        ('auth', 'login', 'Connexion', false, ARRAY[], true),
        ('auth', 'logout', 'Déconnexion', false, ARRAY[], true),
        ('auth', 'register', 'Inscription', false, ARRAY[], true),
        ('auth', 'forgot_password', 'Mot de passe oublié', false, ARRAY[], true),
        ('documents', 'upload', 'Téléverser', false, ARRAY[], true),
        ('documents', 'download', 'Télécharger', false, ARRAY[], true),
        ('documents', 'share', 'Partager', false, ARRAY[], true),
        ('documents', 'delete', 'Supprimer', false, ARRAY[], true),
        ('errors', 'required_field', 'Champ requis', false, ARRAY['field'], true),
        ('errors', 'invalid_email', 'Email invalide', false, ARRAY[], true),
        ('errors', 'network_error', 'Erreur réseau', false, ARRAY[], true),
        ('success', 'saved', 'Sauvegardé avec succès', false, ARRAY[], true),
        ('success', 'deleted', 'Supprimé avec succès', false, ARRAY[], true),
        ('success', 'updated', 'Mis à jour avec succès', false, ARRAY[], true),
        ('ui', 'close', 'Fermer', false, ARRAY[], true),
        ('ui', 'confirm', 'Confirmer', false, ARRAY[], true),
        ('ui', 'back', 'Retour', false, ARRAY[], true),
        ('ui', 'next', 'Suivant', false, ARRAY[], true),
        ('ui', 'previous', 'Précédent', false, ARRAY[], true)
    ON CONFLICT (namespace, key) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les traductions de base
CREATE OR REPLACE FUNCTION create_basic_translations()
RETURNS VOID AS $$
BEGIN
    -- Traductions françaises
    INSERT INTO translations (key, language_id, value, context, is_verified)
    SELECT 
        tk.key,
        l.id,
        CASE tk.key
            WHEN 'common.welcome' THEN 'Bienvenue {{name}} !'
            WHEN 'common.loading' THEN 'Chargement...'
            WHEN 'common.save' THEN 'Sauvegarder'
            WHEN 'common.cancel' THEN 'Annuler'
            WHEN 'common.delete' THEN 'Supprimer'
            WHEN 'common.edit' THEN 'Éditer'
            WHEN 'common.search' THEN 'Rechercher'
            WHEN 'common.filter' THEN 'Filtrer'
            WHEN 'common.sort' THEN 'Trier'
            WHEN 'common.items' THEN 'Élément'
            WHEN 'common.items.one' THEN 'Élément'
            WHEN 'common.items.other' THEN 'Éléments'
            WHEN 'navigation.home' THEN 'Accueil'
            WHEN 'navigation.dashboard' THEN 'Tableau de bord'
            WHEN 'navigation.profile' THEN 'Profil'
            WHEN 'navigation.settings' THEN 'Paramètres'
            WHEN 'auth.login' THEN 'Connexion'
            WHEN 'auth.logout' THEN 'Déconnexion'
            WHEN 'auth.register' THEN 'Inscription'
            WHEN 'auth.forgot_password' THEN 'Mot de passe oublié'
            WHEN 'documents.upload' THEN 'Téléverser'
            WHEN 'documents.download' THEN 'Télécharger'
            WHEN 'documents.share' THEN 'Partager'
            WHEN 'documents.delete' THEN 'Supprimer'
            WHEN 'errors.required_field' THEN 'Le champ {{field}} est requis'
            WHEN 'errors.invalid_email' THEN 'Email invalide'
            WHEN 'errors.network_error' THEN 'Erreur réseau'
            WHEN 'success.saved' THEN 'Sauvegardé avec succès'
            WHEN 'success.deleted' THEN 'Supprimé avec succès'
            WHEN 'success.updated' THEN 'Mis à jour avec succès'
            WHEN 'ui.close' THEN 'Fermer'
            WHEN 'ui.confirm' THEN 'Confirmer'
            WHEN 'ui.back' THEN 'Retour'
            WHEN 'ui.next' THEN 'Suivant'
            WHEN 'ui.previous' THEN 'Précédent'
            ELSE tk.key
        END,
        tk.description,
        true
    FROM translation_keys tk
    JOIN languages l ON l.code = 'fr'
    ON CONFLICT (language_id, key, plural_form) DO NOTHING;

    -- Traductions anglaises
    INSERT INTO translations (key, language_id, value, context, is_verified)
    SELECT 
        tk.key,
        l.id,
        CASE tk.key
            WHEN 'common.welcome' THEN 'Welcome {{name}}!'
            WHEN 'common.loading' THEN 'Loading...'
            WHEN 'common.save' THEN 'Save'
            WHEN 'common.cancel' THEN 'Cancel'
            WHEN 'common.delete' THEN 'Delete'
            WHEN 'common.edit' THEN 'Edit'
            WHEN 'common.search' THEN 'Search'
            WHEN 'common.filter' THEN 'Filter'
            WHEN 'common.sort' THEN 'Sort'
            WHEN 'common.items' THEN 'Item'
            WHEN 'common.items.one' THEN 'Item'
            WHEN 'common.items.other' THEN 'Items'
            WHEN 'navigation.home' THEN 'Home'
            WHEN 'navigation.dashboard' THEN 'Dashboard'
            WHEN 'navigation.profile' THEN 'Profile'
            WHEN 'navigation.settings' THEN 'Settings'
            WHEN 'auth.login' THEN 'Login'
            WHEN 'auth.logout' THEN 'Logout'
            WHEN 'auth.register' THEN 'Register'
            WHEN 'auth.forgot_password' THEN 'Forgot password'
            WHEN 'documents.upload' THEN 'Upload'
            WHEN 'documents.download' THEN 'Download'
            WHEN 'documents.share' THEN 'Share'
            WHEN 'documents.delete' THEN 'Delete'
            WHEN 'errors.required_field' THEN 'The {{field}} field is required'
            WHEN 'errors.invalid_email' THEN 'Invalid email'
            WHEN 'errors.network_error' THEN 'Network error'
            WHEN 'success.saved' THEN 'Saved successfully'
            WHEN 'success.deleted' THEN 'Deleted successfully'
            WHEN 'success.updated' THEN 'Updated successfully'
            WHEN 'ui.close' THEN 'Close'
            WHEN 'ui.confirm' THEN 'Confirm'
            WHEN 'ui.back' THEN 'Back'
            WHEN 'ui.next' THEN 'Next'
            WHEN 'ui.previous' THEN 'Previous'
            ELSE tk.key
        END,
        tk.description,
        true
    FROM translation_keys tk
    JOIN languages l ON l.code = 'en'
    ON CONFLICT (language_id, key, plural_form) DO NOTHING;

    -- Traductions espagnoles
    INSERT INTO translations (key, language_id, value, context, is_verified)
    SELECT 
        tk.key,
        l.id,
        CASE tk.key
            WHEN 'common.welcome' THEN '¡Bienvenido {{name}}!'
            WHEN 'common.loading' THEN 'Cargando...'
            WHEN 'common.save' THEN 'Guardar'
            WHEN 'common.cancel' THEN 'Cancelar'
            WHEN 'common.delete' THEN 'Eliminar'
            WHEN 'common.edit' THEN 'Editar'
            WHEN 'common.search' THEN 'Buscar'
            WHEN 'common.filter' THEN 'Filtrar'
            WHEN 'common.sort' THEN 'Ordenar'
            WHEN 'common.items' THEN 'Elemento'
            WHEN 'common.items.one' THEN 'Elemento'
            WHEN 'common.items.other' THEN 'Elementos'
            WHEN 'navigation.home' THEN 'Inicio'
            WHEN 'navigation.dashboard' THEN 'Panel'
            WHEN 'navigation.profile' THEN 'Perfil'
            WHEN 'navigation.settings' THEN 'Configuración'
            WHEN 'auth.login' THEN 'Iniciar sesión'
            WHEN 'auth.logout' THEN 'Cerrar sesión'
            WHEN 'auth.register' THEN 'Registrarse'
            WHEN 'auth.forgot_password' THEN 'Contraseña olvidada'
            WHEN 'documents.upload' THEN 'Subir'
            WHEN 'documents.download' THEN 'Descargar'
            WHEN 'documents.share' THEN 'Compartir'
            WHEN 'documents.delete' THEN 'Eliminar'
            WHEN 'errors.required_field' THEN 'El campo {{field}} es requerido'
            WHEN 'errors.invalid_email' THEN 'Email inválido'
            WHEN 'errors.network_error' THEN 'Error de red'
            WHEN 'success.saved' THEN 'Guardado con éxito'
            WHEN 'success.deleted' THEN 'Eliminado con éxito'
            WHEN 'success.updated' THEN 'Actualizado con éxito'
            WHEN 'ui.close' THEN 'Cerrar'
            WHEN 'ui.confirm' THEN 'Confirmar'
            WHEN 'ui.back' THEN 'Atrás'
            WHEN 'ui.next' THEN 'Siguiente'
            WHEN 'ui.previous' THEN 'Anterior'
            ELSE tk.key
        END,
        tk.description,
        true
    FROM translation_keys tk
    JOIN languages l ON l.code = 'es'
    ON CONFLICT (language_id, key, plural_form) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciens exports
CREATE OR REPLACE FUNCTION cleanup_old_translation_exports(p_days_old INTEGER DEFAULT 30)
RETURNS TABLE (
    cleaned_exports BIGINT
) AS $$
DECLARE
    cleaned_count BIGINT;
BEGIN
    DELETE FROM translation_exports
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days_old
    OR (expires_at IS NOT NULL AND expires_at < NOW());
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT cleaned_count as cleaned_exports;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE languages IS 'Langues supportées avec formats et règles plurielles';
COMMENT ON TABLE translations IS 'Traductions pour toutes les langues et clés';
COMMENT ON TABLE translation_namespaces IS 'Espaces de noms pour organiser les traductions';
COMMENT ON TABLE translation_keys IS 'Clés de traduction avec métadonnées';
COMMENT ON TABLE user_language_preferences IS 'Préférences de langue des utilisateurs';
COMMENT ON TABLE translation_sessions IS 'Sessions pour le suivi d\'utilisation des traductions';
COMMENT ON TABLE translation_exports IS 'Exports de traductions dans différents formats';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN languages.number_format IS 'Formatage des nombres (décimales, milliers, etc.)';
COMMENT ON COLUMN languages.currency IS 'Configuration de la devise locale';
COMMENT ON COLUMN languages.plural_rules IS 'Règles plurielles pour la langue';
COMMENT ON COLUMN translations.metadata IS 'Métadonnées de traduction (source, confiance, etc.)';
COMMENT ON COLUMN translations.plural_form IS 'Forme plurielle (one, other, few, many, etc.)';
COMMENT ON COLUMN user_language_preferences.custom_translations IS 'Traductions personnalisées de l\'utilisateur';
COMMENT ON COLUMN translation_keys.variables IS 'Variables utilisables dans la traduction';

-- Créer les données par défaut
SELECT create_default_languages();
SELECT create_basic_translation_keys();
SELECT create_basic_translations();
