-- Migration pour les tables de génération de graphiques
-- Création: 11 mars 2026
-- Description: Génération automatique de graphiques avec Chart.js et visualisations interactives

-- Table principale des graphiques
CREATE TABLE IF NOT EXISTS charts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    chart_type VARCHAR(50) NOT NULL CHECK (chart_type IN ('line', 'bar', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble', 'area', 'stackedBar', 'horizontalBar', 'heatmap', 'treemap', 'sankey', 'network', 'gauge', 'funnel', 'candlestick', 'ohlc', 'boxplot', 'violin', 'histogram', 'custom')),
    data_source JSONB NOT NULL DEFAULT '{}',
    config JSONB NOT NULL DEFAULT '{}',
    chart_data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    analytics JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'published', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Table des templates de graphiques
CREATE TABLE IF NOT EXISTS chart_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    chart_type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exports de graphiques
CREATE TABLE IF NOT EXISTS chart_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chart_id UUID REFERENCES charts(id) ON DELETE CASCADE,
    format VARCHAR(20) NOT NULL CHECK (format IN ('png', 'jpg', 'svg', 'pdf', 'json', 'csv', 'excel')),
    options JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des statistiques de graphiques
CREATE TABLE IF NOT EXISTS chart_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_charts INTEGER DEFAULT 0,
    published_charts INTEGER DEFAULT 0,
    draft_charts INTEGER DEFAULT 0,
    most_used_chart_type VARCHAR(50),
    average_data_points_per_chart DECIMAL(10,2) DEFAULT 0,
    average_generation_time DECIMAL(10,2) DEFAULT 0,
    average_quality_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Table des sessions de visualisation de graphiques
CREATE TABLE IF NOT EXISTS chart_viewing_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chart_id UUID REFERENCES charts(id) ON DELETE CASCADE,
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

-- Table des interactions avec les graphiques
CREATE TABLE IF NOT EXISTS chart_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chart_id UUID REFERENCES charts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('view', 'hover', 'click', 'zoom', 'pan', 'filter', 'legend_click', 'tooltip_show', 'export', 'share', 'bookmark')),
    interaction_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des feedbacks sur les graphiques
CREATE TABLE IF NOT EXISTS chart_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chart_id UUID REFERENCES charts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type VARCHAR(50) CHECK (feedback_type IN ('helpful', 'not_helpful', 'confusing', 'inaccurate', 'beautiful', 'other')),
    comment TEXT,
    suggestions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chart_id, user_id)
);

-- Table des types de graphiques disponibles
CREATE TABLE IF NOT EXISTS chart_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('comparison', 'composition', 'relationship', 'distribution', 'geographical', 'temporal', 'statistical', 'specialized')),
    icon VARCHAR(50),
    supported_data_formats TEXT[] NOT NULL DEFAULT '{}',
    min_data_points INTEGER DEFAULT 1,
    max_data_points INTEGER DEFAULT 1000,
    recommended_for TEXT[] DEFAULT '{}',
    config_schema JSONB NOT NULL DEFAULT '{}',
    default_config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des palettes de couleurs
CREATE TABLE IF NOT EXISTS color_palettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    colors TEXT[] NOT NULL DEFAULT '{}',
    category VARCHAR(50) CHECK (category IN ('default', 'pastel', 'vibrant', 'monochrome', 'custom', 'themed')),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des patterns de données pour graphiques
CREATE TABLE IF NOT EXISTS chart_data_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    chart_types TEXT[] NOT NULL DEFAULT '{}',
    detection_rules JSONB NOT NULL DEFAULT '{}',
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 1),
    is_active BOOLEAN DEFAULT TRUE,
    success_rate DECIMAL(5,2) DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des animations de graphiques
CREATE TABLE IF NOT EXISTS chart_animations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    chart_types TEXT[] NOT NULL DEFAULT '{}',
    animation_config JSONB NOT NULL DEFAULT '{}',
    duration_ms INTEGER DEFAULT 1000,
    easing_function VARCHAR(50) DEFAULT 'easeInOutQuart',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_charts_user_id ON charts(user_id);
CREATE INDEX IF NOT EXISTS idx_charts_document_id ON charts(document_id);
CREATE INDEX IF NOT EXISTS idx_charts_status ON charts(status);
CREATE INDEX IF NOT EXISTS idx_charts_chart_type ON charts(chart_type);
CREATE INDEX IF NOT EXISTS idx_charts_created_at ON charts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_charts_title ON charts USING gin(to_tsvector('french', title));

CREATE INDEX IF NOT EXISTS idx_chart_templates_chart_type ON chart_templates(chart_type);
CREATE INDEX IF NOT EXISTS idx_chart_templates_category ON chart_templates(category);
CREATE INDEX IF NOT EXISTS idx_chart_templates_is_active ON chart_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_chart_templates_usage_count ON chart_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_chart_templates_tags ON chart_templates USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_chart_exports_chart_id ON chart_exports(chart_id);
CREATE INDEX IF NOT EXISTS idx_chart_exports_status ON chart_exports(status);
CREATE INDEX IF NOT EXISTS idx_chart_exports_format ON chart_exports(format);

CREATE INDEX IF NOT EXISTS idx_chart_statistics_user_id ON chart_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_statistics_date ON chart_statistics(date DESC);

CREATE INDEX IF NOT EXISTS idx_chart_viewing_sessions_chart_id ON chart_viewing_sessions(chart_id);
CREATE INDEX IF NOT EXISTS idx_chart_viewing_sessions_user_id ON chart_viewing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_viewing_sessions_session_id ON chart_viewing_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chart_viewing_sessions_started_at ON chart_viewing_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_chart_interactions_chart_id ON chart_interactions(chart_id);
CREATE INDEX IF NOT EXISTS idx_chart_interactions_user_id ON chart_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_interactions_interaction_type ON chart_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_chart_interactions_created_at ON chart_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chart_feedbacks_chart_id ON chart_feedbacks(chart_id);
CREATE INDEX IF NOT EXISTS idx_chart_feedbacks_user_id ON chart_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_feedbacks_rating ON chart_feedbacks(rating);
CREATE INDEX IF NOT EXISTS idx_chart_feedbacks_feedback_type ON chart_feedbacks(feedback_type);

CREATE INDEX IF NOT EXISTS idx_chart_types_category ON chart_types(category);
CREATE INDEX IF NOT EXISTS idx_chart_types_is_active ON chart_types(is_active);
CREATE INDEX IF NOT EXISTS idx_chart_types_usage_count ON chart_types(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_chart_types_recommended_for ON chart_types USING gin(recommended_for);

CREATE INDEX IF NOT EXISTS idx_color_palettes_category ON color_palettes(category);
CREATE INDEX IF NOT EXISTS idx_color_palettes_is_default ON color_palettes(is_default);
CREATE INDEX IF NOT EXISTS idx_color_palettes_is_active ON color_palettes(is_active);
CREATE INDEX IF NOT EXISTS idx_color_palettes_usage_count ON color_palettes(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_chart_data_patterns_chart_types ON chart_data_patterns USING gin(chart_types);
CREATE INDEX IF NOT EXISTS idx_chart_data_patterns_is_active ON chart_data_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_chart_data_patterns_success_rate ON chart_data_patterns(success_rate DESC);

CREATE INDEX IF NOT EXISTS idx_chart_animations_chart_types ON chart_animations USING gin(chart_types);
CREATE INDEX IF NOT EXISTS idx_chart_animations_is_active ON chart_animations(is_active);
CREATE INDEX IF NOT EXISTS idx_chart_animations_usage_count ON chart_animations(usage_count DESC);

-- Row Level Security (RLS)
ALTER TABLE charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_viewing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_data_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_animations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour charts
CREATE POLICY "Users can view own charts" ON charts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own charts" ON charts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own charts" ON charts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own charts" ON charts
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all charts" ON charts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour chart_templates
CREATE POLICY "Users can view active chart templates" ON chart_templates
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can insert own chart templates" ON chart_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own chart templates" ON chart_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own chart templates" ON chart_templates
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all chart templates" ON chart_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour chart_exports
CREATE POLICY "Users can view own chart exports" ON chart_exports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM charts 
            WHERE charts.id = chart_id 
            AND charts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own chart exports" ON chart_exports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM charts 
            WHERE charts.id = chart_id 
            AND charts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own chart exports" ON chart_exports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM charts 
            WHERE charts.id = chart_id 
            AND charts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own chart exports" ON chart_exports
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM charts 
            WHERE charts.id = chart_id 
            AND charts.user_id = auth.uid()
        )
    );

-- Politiques RLS pour chart_statistics
CREATE POLICY "Users can view own chart statistics" ON chart_statistics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chart statistics" ON chart_statistics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chart statistics" ON chart_statistics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chart statistics" ON chart_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour chart_viewing_sessions
CREATE POLICY "Users can view own chart viewing sessions" ON chart_viewing_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chart viewing sessions" ON chart_viewing_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chart viewing sessions" ON chart_viewing_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques RLS pour chart_interactions
CREATE POLICY "Users can view own chart interactions" ON chart_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chart interactions" ON chart_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chart interactions" ON chart_interactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques RLS pour chart_feedbacks
CREATE POLICY "Users can view own chart feedbacks" ON chart_feedbacks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chart feedbacks" ON chart_feedbacks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chart feedbacks" ON chart_feedbacks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chart feedbacks" ON chart_feedbacks
    FOR DELETE USING (auth.uid() = user_id);

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

-- Politiques RLS pour color_palettes
CREATE POLICY "All users can view active color palettes" ON color_palettes
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage color palettes" ON color_palettes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour chart_data_patterns
CREATE POLICY "All users can view active chart data patterns" ON chart_data_patterns
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage chart data patterns" ON chart_data_patterns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour chart_animations
CREATE POLICY "All users can view active chart animations" ON chart_animations
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage chart animations" ON chart_animations
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

CREATE TRIGGER update_charts_updated_at BEFORE UPDATE ON charts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_templates_updated_at BEFORE UPDATE ON chart_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_statistics_updated_at BEFORE UPDATE ON chart_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_data_patterns_updated_at BEFORE UPDATE ON chart_data_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques d'utilisation des templates
CREATE OR REPLACE FUNCTION update_chart_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chart_templates 
        SET usage_count = usage_count + 1 
        WHERE chart_type = NEW.chart_type AND is_default = TRUE;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chart_template_usage_count_trigger AFTER INSERT ON charts
    FOR EACH ROW EXECUTE FUNCTION update_chart_template_usage_count();

-- Trigger pour mettre à jour les statistiques d'utilisation des types
CREATE OR REPLACE FUNCTION update_chart_type_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chart_types 
        SET usage_count = usage_count + 1 
        WHERE name = NEW.chart_type AND is_active = TRUE;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chart_type_usage_count_trigger AFTER INSERT ON charts
    FOR EACH ROW EXECUTE FUNCTION update_chart_type_usage_count();

-- Trigger pour mettre à jour les statistiques d'utilisation des patterns
CREATE OR REPLACE FUNCTION update_chart_pattern_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Mettre à jour le compteur d'utilisation pour les patterns pertinents
        UPDATE chart_data_patterns 
        SET usage_count = usage_count + 1,
            success_rate = CASE 
                WHEN (SELECT metadata->>'dataQuality' FROM charts WHERE id = NEW.id) IS NOT NULL
                THEN GREATEST(0, LEAST(1, (SELECT (metadata->>'dataQuality')::DECIMAL FROM charts WHERE id = NEW.id) / 100))
                ELSE success_rate
            END
        WHERE is_active = TRUE 
        AND NEW.chart_type = ANY(chart_types);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chart_pattern_usage_count_trigger AFTER INSERT ON charts
    FOR EACH ROW EXECUTE FUNCTION update_chart_pattern_usage_count();

-- Fonctions RPC pour les statistiques
CREATE OR REPLACE FUNCTION get_chart_stats(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'total_charts', COUNT(*),
        'published_charts', COUNT(*) FILTER (WHERE status = 'published'),
        'draft_charts', COUNT(*) FILTER (WHERE status = 'draft'),
        'most_used_chart_type', (
            SELECT chart_type FROM (
                SELECT chart_type, COUNT(*) as cnt 
                FROM charts 
                WHERE (p_user_id IS NULL OR user_id = p_user_id)
                GROUP BY chart_type 
                ORDER BY cnt DESC 
                LIMIT 1
            ) t
        ),
        'average_data_points_per_chart', COALESCE(AVG((metadata->>'processedDataSize')::INTEGER), 0),
        'average_generation_time', COALESCE(AVG((metadata->>'generationTime')::DECIMAL), 0),
        'average_quality_score', COALESCE(AVG((metadata->>'dataQuality')::DECIMAL), 0)
    ) INTO v_result
    FROM charts 
    WHERE (p_user_id IS NULL OR user_id = p_user_id);
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_chart_analytics(p_chart_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Mettre à jour les analytics du graphique
    UPDATE charts 
    SET analytics = analytics || jsonb_build_object(
        'totalViews', COALESCE((analytics->>'totalViews')::BIGINT, 0) + 1,
        'uniqueViews', (
            SELECT COUNT(DISTINCT user_id) 
            FROM chart_interactions 
            WHERE chart_id = p_chart_id 
            AND interaction_type = 'view'
        ),
        'averageViewTime', (
            SELECT COALESCE(AVG(duration_seconds), 0) 
            FROM chart_viewing_sessions 
            WHERE chart_id = p_chart_id 
            AND duration_seconds IS NOT NULL
        ),
        'interactionCount', (
            SELECT COUNT(*) 
            FROM chart_interactions 
            WHERE chart_id = p_chart_id
        ),
        'averageRating', (
            SELECT COALESCE(AVG(rating), 0) 
            FROM chart_feedbacks 
            WHERE chart_id = p_chart_id 
            AND rating IS NOT NULL
        )
    )
    WHERE id = p_chart_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_default_chart_templates()
RETURNS VOID AS $$
BEGIN
    -- Template ligne
    INSERT INTO chart_templates (name, description, chart_type, config, category, tags, is_default)
    VALUES (
        'Graphique Linéaire',
        'Idéal pour montrer des tendances et des évolutions dans le temps',
        'line',
        '{"type": "line", "options": {"responsive": true, "scales": [{"type": "linear", "position": "left"}, {"type": "category", "position": "bottom"}]}, "animation": {"duration": 1000, "easing": "easeInOutQuart"}}',
        'temporal',
        ARRAY['tendance', 'temps', 'évolution'],
        true
    )
    ON CONFLICT DO NOTHING;
    
    -- Template barres
    INSERT INTO chart_templates (name, description, chart_type, config, category, tags, is_default)
    VALUES (
        'Graphique en Barres',
        'Parfait pour comparer des valeurs entre différentes catégories',
        'bar',
        '{"type": "bar", "options": {"responsive": true, "scales": [{"type": "linear", "position": "left"}, {"type": "category", "position": "bottom"}]}, "animation": {"duration": 1000, "easing": "easeInOutQuart"}}',
        'comparison',
        ARRAY['comparaison', 'catégorie', 'valeur'],
        true
    )
    ON CONFLICT DO NOTHING;
    
    -- Template circulaire
    INSERT INTO chart_templates (name, description, chart_type, config, category, tags, is_default)
    VALUES (
        'Graphique Circulaire',
        'Excellent pour montrer des proportions et des pourcentages',
        'pie',
        '{"type": "pie", "options": {"responsive": true, "plugins": {"legend": {"position": "right"}}}, "animation": {"duration": 1000, "easing": "easeInOutQuart"}}',
        'composition',
        ARRAY['proportion', 'pourcentage', 'part'],
        true
    )
    ON CONFLICT DO NOTHING;
    
    -- Template nuage de points
    INSERT INTO chart_templates (name, description, chart_type, config, category, tags, is_default)
    VALUES (
        'Nuage de Points',
        'Idéal pour visualiser les corrélations entre deux variables',
        'scatter',
        '{"type": "scatter", "options": {"responsive": true, "scales": [{"type": "linear", "position": "left"}, {"type": "linear", "position": "bottom"}]}, "animation": {"duration": 1000, "easing": "easeInOutQuart"}}',
        'relationship',
        ARRAY['corrélation', 'relation', 'distribution'],
        true
    )
    ON CONFLICT DO NOTHING;
    
    -- Template radar
    INSERT INTO chart_templates (name, description, chart_type, config, category, tags, is_default)
    VALUES (
        'Graphique Radar',
        'Parfait pour comparer plusieurs variables sur plusieurs axes',
        'radar',
        '{"type": "radar", "options": {"responsive": true, "scales": [{"type": "radial"}]}, "animation": {"duration": 1000, "easing": "easeInOutQuart"}}',
        'comparison',
        ARRAY['multidimensionnel', 'comparaison', 'performance'],
        true
    )
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insertion des données initiales
INSERT INTO chart_types (name, description, category, icon, supported_data_formats, min_data_points, max_data_points, recommended_for, default_config) VALUES
('Line', 'Graphique linéaire pour tendances', 'temporal', 'line-chart', ARRAY['table', 'csv', 'json'], 2, 1000, ARRAY['tendances', 'séries temporelles', 'évolutions'], '{"responsive": true, "elements": {"line": {"tension": 0.4}}}'),
('Bar', 'Graphique à barres pour comparaisons', 'comparison', 'bar-chart', ARRAY['table', 'csv', 'json'], 1, 50, ARRAY['comparaisons', 'catégories', 'valeurs'], '{"responsive": true, "elements": {"bar": {"borderWidth": 1}}}'),
('Pie', 'Graphique circulaire pour proportions', 'composition', 'pie-chart', ARRAY['table', 'csv', 'json'], 1, 10, ARRAY['proportions', 'pourcentages', 'parts'], '{"responsive": true, "elements": {"arc": {"borderWidth": 2}}}'),
('Doughnut', 'Graphique en beignet pour proportions', 'composition', 'donut-chart', ARRAY['table', 'csv', 'json'], 1, 10, ARRAY['proportions', 'pourcentages'], '{"responsive": true, "cutout": "50%"}'),
('Radar', 'Graphique radar pour comparaisons multidimensionnelles', 'comparison', 'radar-chart', ARRAY['table', 'csv', 'json'], 3, 20, ARRAY['performance', 'multidimensionnel', 'comparaison'], '{"responsive": true, "elements": {"line": {"tension": 0.1}}}'),
('Scatter', 'Nuage de points pour corrélations', 'relationship', 'scatter-chart', ARRAY['table', 'csv', 'json'], 2, 500, ARRAY['corrélation', 'distribution', 'relation'], '{"responsive": true, "elements": {"point": {"radius": 5}}}'),
('Bubble', 'Graphique à bulles pour données 3D', 'relationship', 'bubble-chart', ARRAY['table', 'csv', 'json'], 2, 300, ARRAY['multidimensionnel', 'corrélation', 'taille'], '{"responsive": true, "elements": {"point": {"radius": 8}}}'),
('Area', 'Graphique en aires pour volumes', 'temporal', 'area-chart', ARRAY['table', 'csv', 'json'], 2, 1000, ARRAY['volume', 'accumulation', 'tendance'], '{"responsive": true, "elements": {"line": {"fill": true}}}'),
('Horizontal Bar', 'Barres horizontales pour catégories', 'comparison', 'horizontal-bar-chart', ARRAY['table', 'csv', 'json'], 1, 50, ARRAY['catégories', 'comparaison', 'labels longs'], '{"responsive": true, "indexAxis": "y"}'),
('Heatmap', 'Carte de chaleur pour matrices', 'relationship', 'heatmap', ARRAY['table', 'csv', 'json'], 3, 100, ARRAY['matrice', 'intensité', 'corrélation'], '{"responsive": true, "plugins": {"tooltip": {"callbacks": {"title": "function(context) { return context[0].label + \", \" + context[0].dataset.label; }"}}}}'),
('Treemap', 'Arborescence pour hiérarchies', 'composition', 'treemap', ARRAY['json', 'hierarchical'], 2, 1000, ARRAY['hiérarchie', 'proportion', 'arbre'], '{"responsive": true}'),
('Sankey', 'Diagramme de Sankey pour flux', 'relationship', 'sankey', ARRAY['json', 'flow'], 3, 50, ARRAY['flux', 'transition', 'processus'], '{"responsive": true}'),
('Network', 'Graphe réseau pour relations', 'relationship', 'network', ARRAY['json', 'graph'], 2, 500, ARRAY['réseau', 'connexion', 'graphe'], '{"responsive": true}'),
('Gauge', 'Jauge pour indicateurs', 'statistical', 'gauge', ARRAY['single', 'kpi'], 1, 1, ARRAY['indicateur', 'kpi', 'jauge'], '{"responsive": true}'),
('Funnel', 'Entonnoir pour conversions', 'composition', 'funnel', ARRAY['table', 'csv', 'json'], 2, 10, ARRAY['conversion', 'entonnoir', 'processus'], '{"responsive": true}'),
('Candlestick', 'Chandelier pour finances', 'temporal', 'candlestick', ARRAY['financial', 'ohlc'], 1, 1000, ARRAY['finance', 'bourse', 'trading'], '{"responsive": true}'),
('OHLC', 'OHLC pour finances', 'temporal', 'ohlc', ARRAY['financial', 'ohlc'], 1, 1000, ARRAY['finance', 'bourse', 'prix'], '{"responsive": true}'),
('Boxplot', 'Boîte à moustaches pour distribution', 'statistical', 'boxplot', ARRAY['table', 'csv', 'json'], 1, 100, ARRAY['distribution', 'statistiques', 'quartiles'], '{"responsive": true}'),
('Violin', 'Violon pour distribution', 'statistical', 'violin', ARRAY['table', 'csv', 'json'], 1, 100, ARRAY['distribution', 'densité', 'statistiques'], '{"responsive": true}'),
('Histogram', 'Histogramme pour distribution', 'statistical', 'histogram', ARRAY['table', 'csv', 'json'], 1, 1000, ARRAY['distribution', 'fréquence', 'statistiques'], '{"responsive": true}'),
('Polar Area', 'Aire polaire pour comparaisons', 'composition', 'polar-area', ARRAY['table', 'csv', 'json'], 1, 10, ARRAY['comparaison', 'polaire', 'proportion'], '{"responsive": true}'),
('Custom', 'Type de graphique personnalisé', 'specialized', 'custom-chart', ARRAY['custom'], 1, 1000, ARRAY['personnalisé', 'custom'], '{"responsive": true}')
ON CONFLICT DO NOTHING;

INSERT INTO color_palettes (name, description, colors, category, is_default) VALUES
('Default', 'Palette de couleurs par défaut', ARRAY['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'], 'default', true),
('Pastel', 'Couleurs pastel douces', ARRAY['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA', '#E0BBE4'], 'pastel', false),
('Vibrant', 'Couleurs vives et énergiques', ARRAY['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF', '#06FFB4'], 'vibrant', false),
('Monochrome', 'Nuances de gris', ARRAY['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7', '#ECF0F1'], 'monochrome', false),
('Ocean', 'Couleurs océaniques', ARRAY['#006BA6', '#0496FF', '#3A86FF', '#7209B7', '#B5179E', '#F72585'], 'themed', false),
('Forest', 'Couleurs forestières', ARRAY['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7'], 'themed', false),
('Sunset', 'Couleurs de coucher de soleil', ARRAY['#FF6B35', '#F77B71', '#FF9F7C', '#FFB4A2', '#E5989B', '#B5838D'], 'themed', false),
('Corporate', 'Palette professionnelle', ARRAY['#1F2937', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6'], 'themed', false)
ON CONFLICT DO NOTHING;

INSERT INTO chart_data_patterns (name, description, chart_types, detection_rules, confidence_threshold) VALUES
('Time Series', 'Détection de séries temporelles', ARRAY['line', 'area', 'scatter'], '{"date_column": true, "numeric_columns": 1, "pattern": "date_pattern"}', 0.8),
('Categorical Comparison', 'Comparaison de catégories', ARRAY['bar', 'horizontalBar', 'pie'], '{"categorical_columns": 1, "numeric_columns": 1, "pattern": "category_value"}', 0.7),
('Correlation Data', 'Données de corrélation', ARRAY['scatter', 'bubble', 'heatmap'], '{"numeric_columns": 2, "pattern": "numeric_numeric"}', 0.75),
('Hierarchical Data', 'Données hiérarchiques', ARRAY['treemap', 'sunburst'], '{"hierarchical_columns": true, "pattern": "parent_child"}', 0.6),
('Distribution Data', 'Données de distribution', ARRAY['histogram', 'boxplot', 'violin'], '{"numeric_columns": 1, "pattern": "distribution"}', 0.7),
('Multi-Series', 'Séries multiples', ARRAY['line', 'bar', 'radar'], '{"numeric_columns": ">1", "pattern": "multi_series"}', 0.8),
('Proportional Data', 'Données proportionnelles', ARRAY['pie', 'doughnut', 'polarArea'], '{"numeric_columns": 1, "sum_to_100": true, "pattern": "proportional"}', 0.7),
('Financial Data', 'Données financières', ARRAY['candlestick', 'ohlc'], '{"ohlc_columns": true, "pattern": "ohlcv"}', 0.9)
ON CONFLICT DO NOTHING;

INSERT INTO chart_animations (name, description, chart_types, animation_config, duration_ms, easing_function) VALUES
('Fade In', 'Animation de fondu', ARRAY['line', 'bar', 'pie', 'scatter'], '{"type": "fadeIn", "delay": 0}', 800, 'easeInOutQuad'),
('Slide Up', 'Animation de glissement vers le haut', ARRAY['bar', 'horizontalBar'], '{"type": "slideUp", "delay": 100}', 1000, 'easeOutCubic'),
('Rotate In', 'Animation de rotation', ARRAY['pie', 'doughnut', 'polarArea'], '{"type": "rotateIn", "delay": 50}', 1200, 'easeInOutQuart'),
('Scale In', 'Animation de mise à l\'échelle', ARRAY['scatter', 'bubble'], '{"type": "scaleIn", "delay": 75}', 900, 'easeOutBack'),
('Draw Line', 'Animation de dessin de ligne', ARRAY['line', 'area'], '{"type": "drawLine", "delay": 200}', 1500, 'easeInOutSine'),
('Bounce In', 'Animation de rebond', ARRAY['bar', 'horizontalBar'], '{"type": "bounceIn", "delay": 150}', 1100, 'easeOutBounce'),
('Sequential', 'Animation séquentielle', ARRAY['line', 'bar', 'scatter'], '{"type": "sequential", "delay": 100}', 1000, 'easeInOutQuart'),
('Simultaneous', 'Animation simultanée', ARRAY['pie', 'doughnut', 'radar'], '{"type": "simultaneous", "delay": 0}', 800, 'easeInOutQuad')
ON CONFLICT DO NOTHING;

-- Commentaires sur les tables
COMMENT ON TABLE charts IS 'Graphiques générés automatiquement avec Chart.js';
COMMENT ON TABLE chart_templates IS 'Templates prédéfinis pour les graphiques';
COMMENT ON TABLE chart_exports IS 'Exports de graphiques dans différents formats';
COMMENT ON TABLE chart_statistics IS 'Statistiques d\'utilisation des graphiques';
COMMENT ON TABLE chart_viewing_sessions IS 'Sessions de visualisation des graphiques';
COMMENT ON TABLE chart_interactions IS 'Interactions des utilisateurs avec les graphiques';
COMMENT ON TABLE chart_feedbacks IS 'Feedbacks et évaluations des graphiques';
COMMENT ON TABLE chart_types IS 'Types de graphiques disponibles avec configurations';
COMMENT ON TABLE color_palettes IS 'Palettes de couleurs pour les graphiques';
COMMENT ON TABLE chart_data_patterns IS 'Patterns de reconnaissance pour les données de graphiques';
COMMENT ON TABLE chart_animations IS 'Animations disponibles pour les graphiques';

-- Commentaires sur les colonnes principales
COMMENT ON COLUMN charts.chart_type IS 'Type de graphique (line, bar, pie, etc.)';
COMMENT ON COLUMN charts.data_source IS 'Source et format des données';
COMMENT ON COLUMN charts.config IS 'Configuration complète du graphique';
COMMENT ON COLUMN charts.chart_data IS 'Données formatées pour Chart.js';
COMMENT ON COLUMN charts.metadata IS 'Métadonnées incluant qualité et insights';
COMMENT ON COLUMN charts.analytics IS 'Données analytiques sur l\'utilisation';
COMMENT ON COLUMN chart_templates.tags IS 'Tags pour la recherche et classification';
COMMENT ON COLUMN chart_types.recommended_for IS 'Cas d\'usage recommandés';
COMMENT ON COLUMN color_palettes.colors IS 'Palette de couleurs du schéma';
COMMENT ON COLUMN chart_data_patterns.detection_rules IS 'Règles de détection automatique';
COMMENT ON COLUMN chart_animations.animation_config IS 'Configuration de l\'animation';
