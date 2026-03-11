-- Migration pour les tables de visualisation de données
-- Création: 11 mars 2026
-- Description: Extraction et visualisation automatique de données structurées

-- Table principale des visualisations de données
CREATE TABLE IF NOT EXISTS data_visualizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    original_text TEXT NOT NULL,
    extracted_data JSONB NOT NULL DEFAULT '[]',
    visualizations JSONB NOT NULL DEFAULT '[]',
    settings JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    analytics JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'published', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Table des données extraites
CREATE TABLE IF NOT EXISTS extracted_data_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visualization_id UUID REFERENCES data_visualizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('table', 'list', 'chart', 'timeline', 'hierarchy', 'network', 'statistical', 'custom')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    data JSONB NOT NULL DEFAULT '{}',
    structure JSONB NOT NULL DEFAULT '{}',
    source JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des visualisations générées
CREATE TABLE IF NOT EXISTS generated_visualizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extracted_data_id UUID REFERENCES extracted_data_items(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('table', 'bar', 'line', 'pie', 'scatter', 'heatmap', 'tree', 'network', 'gantt', 'custom')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    chart_data JSONB NOT NULL DEFAULT '{}',
    interactive BOOLEAN DEFAULT TRUE,
    exportable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des templates de visualisation
CREATE TABLE IF NOT EXISTS visualization_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    chart_type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exports de visualisations
CREATE TABLE IF NOT EXISTS visualization_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visualization_id UUID REFERENCES data_visualizations(id) ON DELETE CASCADE,
    format VARCHAR(20) NOT NULL CHECK (format IN ('png', 'jpg', 'svg', 'pdf', 'csv', 'json', 'excel')),
    options JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des statistiques de visualisations
CREATE TABLE IF NOT EXISTS visualization_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_visualizations INTEGER DEFAULT 0,
    published_visualizations INTEGER DEFAULT 0,
    draft_visualizations INTEGER DEFAULT 0,
    total_data_points INTEGER DEFAULT 0,
    average_data_points_per_visualization DECIMAL(10,2) DEFAULT 0,
    most_used_chart_type VARCHAR(50),
    average_extraction_accuracy DECIMAL(5,2) DEFAULT 0,
    average_processing_quality DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Table des sessions de visualisation
CREATE TABLE IF NOT EXISTS visualization_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visualization_id UUID REFERENCES data_visualizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    interactions_count INTEGER DEFAULT 0,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    ip_address INET,
    user_agent TEXT
);

-- Table des interactions avec les visualisations
CREATE TABLE IF NOT EXISTS visualization_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visualization_id UUID REFERENCES data_visualizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('view', 'zoom', 'pan', 'filter', 'hover', 'click', 'export', 'share', 'bookmark')),
    interaction_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des feedbacks sur les visualisations
CREATE TABLE IF NOT EXISTS visualization_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visualization_id UUID REFERENCES data_visualizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type VARCHAR(50) CHECK (feedback_type IN ('helpful', 'not_helpful', 'confusing', 'inaccurate', 'other')),
    comment TEXT,
    suggestions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(visualization_id, user_id)
);

-- Table des patterns de données
CREATE TABLE IF NOT EXISTS data_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN ('table', 'list', 'numerical', 'temporal', 'hierarchical', 'relational')),
    pattern_regex TEXT NOT NULL,
    description TEXT,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 1),
    extraction_rules JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des types de graphiques
CREATE TABLE IF NOT EXISTS chart_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('comparison', 'composition', 'relationship', 'distribution', 'geographical', 'temporal')),
    supported_data_types TEXT[] NOT NULL DEFAULT '{}',
    min_data_points INTEGER DEFAULT 1,
    max_data_points INTEGER DEFAULT 1000,
    config_schema JSONB NOT NULL DEFAULT '{}',
    default_config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des schémas de couleurs
CREATE TABLE IF NOT EXISTS color_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    colors TEXT[] NOT NULL DEFAULT '{}',
    category VARCHAR(50) CHECK (category IN ('default', 'pastel', 'vibrant', 'monochrome', 'custom')),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_data_visualizations_user_id ON data_visualizations(user_id);
CREATE INDEX IF NOT EXISTS idx_data_visualizations_document_id ON data_visualizations(document_id);
CREATE INDEX IF NOT EXISTS idx_data_visualizations_status ON data_visualizations(status);
CREATE INDEX IF NOT EXISTS idx_data_visualizations_created_at ON data_visualizations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_visualizations_title ON data_visualizations USING gin(to_tsvector('french', title));

CREATE INDEX IF NOT EXISTS idx_extracted_data_items_visualization_id ON extracted_data_items(visualization_id);
CREATE INDEX IF NOT EXISTS idx_extracted_data_items_type ON extracted_data_items(type);
CREATE INDEX IF NOT EXISTS idx_extracted_data_items_created_at ON extracted_data_items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_visualizations_extracted_data_id ON generated_visualizations(extracted_data_id);
CREATE INDEX IF NOT EXISTS idx_generated_visualizations_type ON generated_visualizations(type);
CREATE INDEX IF NOT EXISTS idx_generated_visualizations_interactive ON generated_visualizations(interactive);

CREATE INDEX IF NOT EXISTS idx_visualization_templates_chart_type ON visualization_templates(chart_type);
CREATE INDEX IF NOT EXISTS idx_visualization_templates_is_active ON visualization_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_visualization_templates_usage_count ON visualization_templates(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_visualization_exports_visualization_id ON visualization_exports(visualization_id);
CREATE INDEX IF NOT EXISTS idx_visualization_exports_status ON visualization_exports(status);
CREATE INDEX IF NOT EXISTS idx_visualization_exports_format ON visualization_exports(format);

CREATE INDEX IF NOT EXISTS idx_visualization_statistics_user_id ON visualization_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_visualization_statistics_date ON visualization_statistics(date DESC);

CREATE INDEX IF NOT EXISTS idx_visualization_sessions_visualization_id ON visualization_sessions(visualization_id);
CREATE INDEX IF NOT EXISTS idx_visualization_sessions_user_id ON visualization_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_visualization_sessions_session_id ON visualization_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_visualization_sessions_started_at ON visualization_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_visualization_interactions_visualization_id ON visualization_interactions(visualization_id);
CREATE INDEX IF NOT EXISTS idx_visualization_interactions_user_id ON visualization_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_visualization_interactions_interaction_type ON visualization_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_visualization_interactions_created_at ON visualization_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visualization_feedbacks_visualization_id ON visualization_feedbacks(visualization_id);
CREATE INDEX IF NOT EXISTS idx_visualization_feedbacks_user_id ON visualization_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_visualization_feedbacks_rating ON visualization_feedbacks(rating);
CREATE INDEX IF NOT EXISTS idx_visualization_feedbacks_feedback_type ON visualization_feedbacks(feedback_type);

CREATE INDEX IF NOT EXISTS idx_data_patterns_category ON data_patterns(category);
CREATE INDEX IF NOT EXISTS idx_data_patterns_pattern_type ON data_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_data_patterns_is_active ON data_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_data_patterns_success_rate ON data_patterns(success_rate DESC);

CREATE INDEX IF NOT EXISTS idx_chart_types_category ON chart_types(category);
CREATE INDEX IF NOT EXISTS idx_chart_types_is_active ON chart_types(is_active);
CREATE INDEX IF NOT EXISTS idx_chart_types_usage_count ON chart_types(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_color_schemes_category ON color_schemes(category);
CREATE INDEX IF NOT EXISTS idx_color_schemes_is_default ON color_schemes(is_default);
CREATE INDEX IF NOT EXISTS idx_color_schemes_is_active ON color_schemes(is_active);
CREATE INDEX IF NOT EXISTS idx_color_schemes_usage_count ON color_schemes(usage_count DESC);

-- Row Level Security (RLS)
ALTER TABLE data_visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_data_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualization_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualization_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualization_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualization_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualization_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualization_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_schemes ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour data_visualizations
CREATE POLICY "Users can view own data visualizations" ON data_visualizations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data visualizations" ON data_visualizations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data visualizations" ON data_visualizations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data visualizations" ON data_visualizations
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all data visualizations" ON data_visualizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour extracted_data_items
CREATE POLICY "Users can view own extracted data items" ON extracted_data_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM data_visualizations 
            WHERE data_visualizations.id = visualization_id 
            AND data_visualizations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own extracted data items" ON extracted_data_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM data_visualizations 
            WHERE data_visualizations.id = visualization_id 
            AND data_visualizations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own extracted data items" ON extracted_data_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM data_visualizations 
            WHERE data_visualizations.id = visualization_id 
            AND data_visualizations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own extracted data items" ON extracted_data_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM data_visualizations 
            WHERE data_visualizations.id = visualization_id 
            AND data_visualizations.user_id = auth.uid()
        )
    );

-- Politiques RLS pour generated_visualizations
CREATE POLICY "Users can view own generated visualizations" ON generated_visualizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM extracted_data_items edi
            JOIN data_visualizations dv ON dv.id = edi.visualization_id
            WHERE edi.id = extracted_data_id 
            AND dv.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own generated visualizations" ON generated_visualizations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM extracted_data_items edi
            JOIN data_visualizations dv ON dv.id = edi.visualization_id
            WHERE edi.id = extracted_data_id 
            AND dv.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own generated visualizations" ON generated_visualizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM extracted_data_items edi
            JOIN data_visualizations dv ON dv.id = edi.visualization_id
            WHERE edi.id = extracted_data_id 
            AND dv.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own generated visualizations" ON generated_visualizations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM extracted_data_items edi
            JOIN data_visualizations dv ON dv.id = edi.visualization_id
            WHERE edi.id = extracted_data_id 
            AND dv.user_id = auth.uid()
        )
    );

-- Politiques RLS pour visualization_templates
CREATE POLICY "Users can view active visualization templates" ON visualization_templates
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can insert own visualization templates" ON visualization_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own visualization templates" ON visualization_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own visualization templates" ON visualization_templates
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all visualization templates" ON visualization_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour visualization_exports
CREATE POLICY "Users can view own visualization exports" ON visualization_exports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM data_visualizations 
            WHERE data_visualizations.id = visualization_id 
            AND data_visualizations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own visualization exports" ON visualization_exports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM data_visualizations 
            WHERE data_visualizations.id = visualization_id 
            AND data_visualizations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own visualization exports" ON visualization_exports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM data_visualizations 
            WHERE data_visualizations.id = visualization_id 
            AND data_visualizations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own visualization exports" ON visualization_exports
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM data_visualizations 
            WHERE data_visualizations.id = visualization_id 
            AND data_visualizations.user_id = auth.uid()
        )
    );

-- Politiques RLS pour visualization_statistics
CREATE POLICY "Users can view own visualization statistics" ON visualization_statistics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visualization statistics" ON visualization_statistics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visualization statistics" ON visualization_statistics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all visualization statistics" ON visualization_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour visualization_sessions
CREATE POLICY "Users can view own visualization sessions" ON visualization_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visualization sessions" ON visualization_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visualization sessions" ON visualization_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques RLS pour visualization_interactions
CREATE POLICY "Users can view own visualization interactions" ON visualization_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visualization interactions" ON visualization_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visualization interactions" ON visualization_interactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques RLS pour visualization_feedbacks
CREATE POLICY "Users can view own visualization feedbacks" ON visualization_feedbacks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visualization feedbacks" ON visualization_feedbacks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visualization feedbacks" ON visualization_feedbacks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own visualization feedbacks" ON visualization_feedbacks
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour data_patterns
CREATE POLICY "All users can view active data patterns" ON data_patterns
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage data patterns" ON data_patterns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour chart_types
CREATE POLICY "All users can view active chart types" ON chart_types
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage chart types" ON chart_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour color_schemes
CREATE POLICY "All users can view active color schemes" ON color_schemes
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage color schemes" ON color_schemes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_data_visualizations_updated_at BEFORE UPDATE ON data_visualizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visualization_templates_updated_at BEFORE UPDATE ON visualization_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visualization_statistics_updated_at BEFORE UPDATE ON visualization_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_patterns_updated_at BEFORE UPDATE ON data_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques d'utilisation des templates
CREATE OR REPLACE FUNCTION update_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE visualization_templates 
        SET usage_count = usage_count + 1 
        WHERE chart_type = (
            SELECT type FROM generated_visualizations 
            WHERE id = NEW.extracted_data_id 
            LIMIT 1
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_template_usage_count_trigger AFTER INSERT ON generated_visualizations
    FOR EACH ROW EXECUTE FUNCTION update_template_usage_count();

-- Trigger pour mettre à jour les statistiques d'utilisation des patterns
CREATE OR REPLACE FUNCTION update_pattern_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Mettre à jour le compteur d'utilisation pour les patterns pertinents
        UPDATE data_patterns 
        SET usage_count = usage_count + 1,
            success_rate = CASE 
                WHEN (SELECT metadata->>'qualityScore' FROM data_visualizations WHERE id = NEW.visualization_id) IS NOT NULL
                THEN GREATEST(0, LEAST(1, (SELECT (metadata->>'qualityScore')::DECIMAL FROM data_visualizations WHERE id = NEW.visualization_id) / 100))
                ELSE success_rate
            END
        WHERE is_active = TRUE;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pattern_usage_count_trigger AFTER INSERT ON extracted_data_items
    FOR EACH ROW EXECUTE FUNCTION update_pattern_usage_count();

-- Fonctions RPC pour les statistiques
CREATE OR REPLACE FUNCTION get_visualization_stats(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'total_visualizations', COUNT(*),
        'published_visualizations', COUNT(*) FILTER (WHERE status = 'published'),
        'draft_visualizations', COUNT(*) FILTER (WHERE status = 'draft'),
        'total_data_points', COALESCE(SUM((metadata->>'totalDataPoints')::INTEGER), 0),
        'average_data_points_per_visualization', COALESCE(AVG((metadata->>'totalDataPoints')::INTEGER), 0),
        'most_used_chart_type', (
            SELECT type FROM (
                SELECT type, COUNT(*) as cnt 
                FROM generated_visualizations gv
                JOIN extracted_data_items edi ON edi.id = gv.extracted_data_id
                JOIN data_visualizations dv ON dv.id = edi.visualization_id
                WHERE (p_user_id IS NULL OR dv.user_id = p_user_id)
                GROUP BY type 
                ORDER BY cnt DESC 
                LIMIT 1
            ) t
        ),
        'average_extraction_accuracy', COALESCE(AVG((metadata->>'accuracyScore')::DECIMAL), 0),
        'average_processing_quality', COALESCE(AVG((metadata->>'qualityScore')::DECIMAL), 0)
    ) INTO v_result
    FROM data_visualizations 
    WHERE (p_user_id IS NULL OR user_id = p_user_id);
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_visualization_analytics(p_visualization_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Mettre à jour les analytics de la visualisation
    UPDATE data_visualizations 
    SET analytics = analytics || jsonb_build_object(
        'totalViews', COALESCE((analytics->>'totalViews')::BIGINT, 0) + 1,
        'uniqueViews', (
            SELECT COUNT(DISTINCT user_id) 
            FROM visualization_interactions 
            WHERE visualization_id = p_visualization_id 
            AND interaction_type = 'view'
        ),
        'averageViewTime', (
            SELECT COALESCE(AVG(duration_seconds), 0) 
            FROM visualization_sessions 
            WHERE visualization_id = p_visualization_id 
            AND duration_seconds IS NOT NULL
        ),
        'interactionCount', (
            SELECT COUNT(*) 
            FROM visualization_interactions 
            WHERE visualization_id = p_visualization_id
        ),
        'averageRating', (
            SELECT COALESCE(AVG(rating), 0) 
            FROM visualization_feedbacks 
            WHERE visualization_id = p_visualization_id 
            AND rating IS NOT NULL
        )
    )
    WHERE id = p_visualization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_default_visualization_templates()
RETURNS VOID AS $$
BEGIN
    -- Template tableau
    INSERT INTO visualization_templates (name, description, chart_type, config, is_default)
    VALUES (
        'Tableau Interactif',
        'Affiche les données sous forme de tableau triable et filtrable',
        'table',
        '{"chartType": "table", "colors": ["#36A2EB"], "axes": [], "legend": {"show": false}, "tooltip": {"show": true}, "responsive": true}',
        true
    )
    ON CONFLICT DO NOTHING;
    
    -- Template barres
    INSERT INTO visualization_templates (name, description, chart_type, config, is_default)
    VALUES (
        'Graphique en Barres',
        'Compare les valeurs avec des barres verticales ou horizontales',
        'bar',
        '{"chartType": "bar", "colors": ["#FF6384", "#36A2EB", "#FFCE56"], "axes": [{"type": "x", "label": "Catégories"}, {"type": "y", "label": "Valeurs"}], "legend": {"show": true}, "tooltip": {"show": true}, "responsive": true}',
        true
    )
    ON CONFLICT DO NOTHING;
    
    -- Template lignes
    INSERT INTO visualization_templates (name, description, chart_type, config, is_default)
    VALUES (
        'Graphique en Lignes',
        'Montre les tendances et les évolutions dans le temps',
        'line',
        '{"chartType": "line", "colors": ["#36A2EB", "#FF6384"], "axes": [{"type": "x", "label": "Temps"}, {"type": "y", "label": "Valeurs"}], "legend": {"show": true}, "tooltip": {"show": true}, "responsive": true}',
        true
    )
    ON CONFLICT DO NOTHING;
    
    -- Template circulaire
    INSERT INTO visualization_templates (name, description, chart_type, config, is_default)
    VALUES (
        'Graphique Circulaire',
        'Affiche les proportions et les pourcentages',
        'pie',
        '{"chartType": "pie", "colors": ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"], "axes": [], "legend": {"position": "right", "show": true}, "tooltip": {"show": true}, "responsive": true}',
        true
    )
    ON CONFLICT DO NOTHING;
    
    -- Template nuage de points
    INSERT INTO visualization_templates (name, description, chart_type, config, is_default)
    VALUES (
        'Nuage de Points',
        'Montre les corrélations entre deux variables',
        'scatter',
        '{"chartType": "scatter", "colors": ["#36A2EB"], "axes": [{"type": "x", "label": "Variable X"}, {"type": "y", "label": "Variable Y"}], "legend": {"show": false}, "tooltip": {"show": true}, "responsive": true}',
        true
    )
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insertion des données initiales
INSERT INTO chart_types (name, description, category, supported_data_types, min_data_points, max_data_points, default_config) VALUES
('Table', 'Affichage tabulaire des données', 'comparison', ARRAY['table', 'list'], 1, 1000, '{"responsive": true, "sortable": true, "filterable": true}'),
('Bar', 'Graphique à barres verticales', 'comparison', ARRAY['numerical', 'categorical'], 1, 50, '{"responsive": true, "legend": {"show": true}}'),
('Line', 'Graphique linéaire pour tendances', 'temporal', ARRAY['temporal', 'numerical'], 2, 100, '{"responsive": true, "fill": false}'),
('Pie', 'Graphique circulaire pour proportions', 'composition', ARRAY['categorical', 'numerical'], 1, 10, '{"responsive": true, "legend": {"position": "right"}}'),
('Scatter', 'Nuage de points pour corrélations', 'relationship', ARRAY['numerical'], 2, 500, '{"responsive": true, "showGrid": true}'),
('Heatmap', 'Carte de chaleur pour matrices', 'relationship', ARRAY['numerical'], 3, 100, '{"responsive": true, "colorScale": "viridis"}'),
('Tree', 'Arborescence pour hiérarchies', 'hierarchical', ARRAY['hierarchical'], 2, 1000, '{"responsive": true, "layout": "tree"}'),
('Network', 'Graphe réseau pour relations', 'relationship', ARRAY['relational'], 2, 500, '{"responsive": true, "layout": "force"}')
ON CONFLICT DO NOTHING;

INSERT INTO color_schemes (name, description, colors, category, is_default) VALUES
('Default', 'Schéma de couleurs par défaut', ARRAY['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'], 'default', true),
('Pastel', 'Couleurs pastel douces', ARRAY['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA', '#E0BBE4'], 'pastel', false),
('Vibrant', 'Couleurs vives et énergiques', ARRAY['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF', '#06FFB4'], 'vibrant', false),
('Monochrome', 'Nuances de gris', ARRAY['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7', '#ECF0F1'], 'monochrome', false),
('Ocean', 'Couleurs océaniques', ARRAY['#006BA6', '#0496FF', '#3A86FF', '#7209B7', '#B5179E', '#F72585'], 'custom', false),
('Forest', 'Couleurs forestières', ARRAY['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7'], 'custom', false)
ON CONFLICT DO NOTHING;

-- Commentaires sur les tables
COMMENT ON TABLE data_visualizations IS 'Visualisations de données extraites et traitées';
COMMENT ON TABLE extracted_data_items IS 'Données structurées extraites des documents';
COMMENT ON TABLE generated_visualizations IS 'Graphiques et visualisations générés';
COMMENT ON TABLE visualization_templates IS 'Templates prédéfinis pour les visualisations';
COMMENT ON TABLE visualization_exports IS 'Exports de visualisations dans différents formats';
COMMENT ON TABLE visualization_statistics IS 'Statistiques d\'utilisation des visualisations';
COMMENT ON TABLE visualization_sessions IS 'Sessions de visualisation des utilisateurs';
COMMENT ON TABLE visualization_interactions IS 'Interactions des utilisateurs avec les visualisations';
COMMENT ON TABLE visualization_feedbacks IS 'Feedbacks et évaluations des visualisations';
COMMENT ON TABLE data_patterns IS 'Patterns de reconnaissance pour l\'extraction de données';
COMMENT ON TABLE chart_types IS 'Types de graphiques disponibles';
COMMENT ON TABLE color_schemes IS 'Schémas de couleurs pour les visualisations';

-- Commentaires sur les colonnes principales
COMMENT ON COLUMN data_visualizations.extracted_data IS 'Données extraites du document';
COMMENT ON COLUMN data_visualizations.visualizations IS 'Visualisations générées';
COMMENT ON COLUMN data_visualizations.settings IS 'Paramètres de configuration';
COMMENT ON COLUMN data_visualizations.metadata IS 'Métadonnées incluant les métriques de qualité';
COMMENT ON COLUMN data_visualizations.analytics IS 'Données analytiques sur l\'utilisation';
COMMENT ON COLUMN extracted_data_items.source IS 'Source et confiance de l\'extraction';
COMMENT ON COLUMN extracted_data_items.metadata IS 'Métadonnées sur la qualité et la structure';
COMMENT ON COLUMN generated_visualizations.config IS 'Configuration spécifique du graphique';
COMMENT ON COLUMN generated_visualizations.chart_data IS 'Données formatées pour le graphique';
COMMENT ON COLUMN data_patterns.pattern_regex IS 'Expression régulière pour la reconnaissance';
COMMENT ON COLUMN data_patterns.confidence_threshold IS 'Seuil de confiance minimum';
COMMENT ON COLUMN chart_types.supported_data_types IS 'Types de données supportés';
COMMENT ON COLUMN color_schemes.colors IS 'Palette de couleurs du schéma';
