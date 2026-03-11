-- Migration: Création des tables pour la navigation PDF avancée
-- Date: 11 mars 2026
-- Description: Tables pour gérer la navigation avancée avec thumbnails, bookmarks, outline et recherche

-- Table des états de navigation PDF
CREATE TABLE IF NOT EXISTS pdf_navigation_states (
    id VARCHAR(255) PRIMARY KEY, -- documentId_userId
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    current_page INTEGER DEFAULT 1,
    total_pages INTEGER DEFAULT 1,
    zoom DECIMAL(5,2) DEFAULT 1.00,
    rotation INTEGER DEFAULT 0,
    scroll_position JSONB DEFAULT '{}', -- {x, y, pageTop, pageLeft, viewportWidth, viewportHeight, scale}
    view_mode VARCHAR(20) DEFAULT 'continuous' CHECK (view_mode IN ('single', 'continuous', 'facing', 'book', 'magazine')),
    layout_mode VARCHAR(20) DEFAULT 'vertical' CHECK (layout_mode IN ('vertical', 'horizontal', 'auto')),
    fit_mode VARCHAR(20) DEFAULT 'page-width' CHECK (fit_mode IN ('auto', 'page-width', 'page-height', 'page-fit', 'custom')),
    sidebar_state JSONB DEFAULT '{}', -- {isOpen, activeTab, width, position, collapsed, tabs}
    search_state JSONB DEFAULT '{}', -- {query, results, currentIndex, isSearching, options, filters, history}
    bookmarks JSONB DEFAULT '[]',
    annotations JSONB DEFAULT '[]',
    thumbnails JSONB DEFAULT '[]',
    outline JSONB DEFAULT '[]',
    history JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}', -- {defaultViewMode, defaultLayoutMode, defaultFitMode, defaultZoom, sidebarWidth, sidebarPosition, autoOpenSidebar, defaultSidebarTab, thumbnailSize, showPageNumbers, smoothScrolling, keyboardShortcuts, mouseGestures, touchGestures, autoSave, autoSync, theme, fontSize, fontFamily, lineHeight, pageTransition, animationSpeed, highlightColor, searchHighlightColor, bookmarkColor, outlineColor}
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reading_progress JSONB DEFAULT '{}', -- {totalPages, readPages, currentPage, readingTime, averageReadingTime, estimatedTotalTime, completionPercentage, lastReadPage, readingSpeed, readingStreak, longestSession, totalSessions, bookmarksCreated, annotationsCreated, searchesPerformed, progressHistory, readingGoals}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des thumbnails PDF
CREATE TABLE IF NOT EXISTS pdf_thumbnails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    size INTEGER NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cache_key VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}', -- {originalWidth, originalHeight, dpi, colorSpace, hasText, wordCount, imageCount, dominantColor, aspectRatio, fileSize, renderTime}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, page_number, cache_key)
);

-- Table des bookmarks PDF
CREATE TABLE IF NOT EXISTS pdf_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    page_number INTEGER NOT NULL,
    position JSONB NOT NULL, -- {x, y, zoom, rotation, scrollX, scrollY, pageTop, pageLeft}
    style JSONB DEFAULT '{}', -- {color, backgroundColor, borderColor, borderWidth, borderRadius, fontSize, fontFamily, fontWeight, opacity, boxShadow, icon, iconSize}
    metadata JSONB DEFAULT '{}', -- {context, snippet, wordCount, characterCount, readingTime, difficulty, importance, category, subcategory, tags, relatedBookmarks, customFields}
    is_public BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    color VARCHAR(20) DEFAULT '#0000ff',
    icon VARCHAR(50) DEFAULT 'bookmark',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_visited TIMESTAMP WITH TIME ZONE,
    visit_count INTEGER DEFAULT 0
);

-- Table des outlines (sommaires) PDF
CREATE TABLE IF NOT EXISTS pdf_outlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    page_number INTEGER NOT NULL,
    position JSONB NOT NULL, -- {x, y, zoom, rotation, destination}
    children JSONB DEFAULT '[]',
    is_open BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}', -- {action, uri, namedAction, fileSpec, parameters, color, fontStyle, isBold, isItalic}
    style JSONB DEFAULT '{}', -- {color, backgroundColor, fontSize, fontFamily, fontWeight, textDecoration, marginLeft, marginTop, marginBottom, icon, iconSize}
    parent_id UUID REFERENCES pdf_outlines(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des résultats de recherche PDF
CREATE TABLE IF NOT EXISTS pdf_search_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results JSONB DEFAULT '[]', -- [{id, text, pageNumber, position, context, snippet, relevance, matchType, metadata}]
    current_index INTEGER DEFAULT 0,
    is_searching BOOLEAN DEFAULT false,
    options JSONB DEFAULT '{}', -- {caseSensitive, wholeWord, regex, fuzzy, semantic, includeAnnotations, includeBookmarks, includeOutline, highlightMatches, maxResults, contextSize}
    filters JSONB DEFAULT '{}', -- {pages, dateRange, annotationTypes, bookmarkTypes, languages}
    history JSONB DEFAULT '[]', -- [{id, query, timestamp, resultCount, duration, options}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de l'historique de navigation
CREATE TABLE IF NOT EXISTS navigation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    action VARCHAR(30) NOT NULL CHECK (action IN ('page_change', 'zoom_change', 'rotation_change', 'scroll', 'search', 'bookmark_create', 'bookmark_visit', 'outline_navigate', 'thumbnail_click', 'annotation_click', 'view_mode_change', 'layout_change', 'fit_change')),
    state JSONB NOT NULL, -- {currentPage, zoom, rotation, scrollPosition, viewMode, layoutMode, fitMode, sidebarState, searchState}
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration INTEGER, -- en millisecondes
    metadata JSONB DEFAULT '{}', -- {source, trigger, context, device, browser, sessionId, referrer, utmSource}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des préférences de navigation utilisateur
CREATE TABLE IF NOT EXISTS user_navigation_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    preferences JSONB NOT NULL, -- {defaultViewMode, defaultLayoutMode, defaultFitMode, defaultZoom, sidebarWidth, sidebarPosition, autoOpenSidebar, defaultSidebarTab, thumbnailSize, showPageNumbers, smoothScrolling, keyboardShortcuts, mouseGestures, touchGestures, autoSave, autoSync, theme, fontSize, fontFamily, lineHeight, pageTransition, animationSpeed, highlightColor, searchHighlightColor, bookmarkColor, outlineColor}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des statistiques de navigation PDF
CREATE TABLE IF NOT EXISTS pdf_navigation_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_views INTEGER DEFAULT 0,
    total_reading_time INTEGER DEFAULT 0, -- en secondes
    average_session_duration INTEGER DEFAULT 0, -- en secondes
    total_pages_read INTEGER DEFAULT 0,
    average_pages_per_session DECIMAL(5,2) DEFAULT 0.00,
    most_viewed_pages JSONB DEFAULT '[]', -- [{pageNumber, viewCount, averageTime}]
    bookmark_stats JSONB DEFAULT '{}', -- {totalCreated, totalVisited, mostUsedTypes, averagePerDocument}
    search_stats JSONB DEFAULT '{}', -- {totalSearches, averageResults, mostSearchedTerms, searchSuccessRate}
    navigation_patterns JSONB DEFAULT '{}', -- {commonPaths, preferredViewModes, preferredZoomLevels, sidebarUsage}
    user_engagement JSONB DEFAULT '{}', -- {averageSessionLength, bounceRate, returnRate, featureUsage, satisfactionScore}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, document_id, user_id)
);

-- Table des sessions de lecture
CREATE TABLE IF NOT EXISTS reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    start_page INTEGER NOT NULL,
    end_page INTEGER,
    pages_read INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- en secondes
    device VARCHAR(50),
    browser VARCHAR(50),
    location VARCHAR(255),
    bookmarks_created INTEGER DEFAULT 0,
    annotations_created INTEGER DEFAULT 0,
    searches_performed INTEGER DEFAULT 0,
    session_data JSONB DEFAULT '{}', -- {viewMode, layoutMode, fitMode, zoom, rotation, sidebarState}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des objectifs de lecture
CREATE TABLE IF NOT EXISTS reading_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pages', 'time', 'date', 'completion')),
    target INTEGER NOT NULL,
    current INTEGER DEFAULT 0,
    deadline TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_pdf_navigation_states_document_id ON pdf_navigation_states(document_id);
CREATE INDEX idx_pdf_navigation_states_user_id ON pdf_navigation_states(user_id);
CREATE INDEX idx_pdf_navigation_states_last_accessed ON pdf_navigation_states(last_accessed DESC);
CREATE INDEX idx_pdf_navigation_states_updated_at ON pdf_navigation_states(updated_at DESC);

CREATE INDEX idx_pdf_thumbnails_document_id ON pdf_thumbnails(document_id);
CREATE INDEX idx_pdf_thumbnails_page_number ON pdf_thumbnails(page_number);
CREATE INDEX idx_pdf_thumbnails_cache_key ON pdf_thumbnails(cache_key);
CREATE INDEX idx_pdf_thumbnails_generated_at ON pdf_thumbnails(generated_at DESC);

CREATE INDEX idx_pdf_bookmarks_user_id ON pdf_bookmarks(user_id);
CREATE INDEX idx_pdf_bookmarks_document_id ON pdf_bookmarks(document_id);
CREATE INDEX idx_pdf_bookmarks_page_number ON pdf_bookmarks(page_number);
CREATE INDEX idx_pdf_bookmarks_is_public ON pdf_bookmarks(is_public);
CREATE INDEX idx_pdf_bookmarks_created_at ON pdf_bookmarks(created_at DESC);
CREATE INDEX idx_pdf_bookmarks_last_visited ON pdf_bookmarks(last_visited DESC);
CREATE INDEX idx_pdf_bookmarks_tags ON pdf_bookmarks USING GIN (tags);

CREATE INDEX idx_pdf_outlines_document_id ON pdf_outlines(document_id);
CREATE INDEX idx_pdf_outlines_parent_id ON pdf_outlines(parent_id);
CREATE INDEX idx_pdf_outlines_level ON pdf_outlines(level);
CREATE INDEX idx_pdf_outlines_page_number ON pdf_outlines(page_number);

CREATE INDEX idx_pdf_search_results_document_id ON pdf_search_results(document_id);
CREATE INDEX idx_pdf_search_results_user_id ON pdf_search_results(user_id);
CREATE INDEX idx_pdf_search_results_query ON pdf_search_results(query);
CREATE INDEX idx_pdf_search_results_created_at ON pdf_search_results(created_at DESC);

CREATE INDEX idx_navigation_history_user_id ON navigation_history(user_id);
CREATE INDEX idx_navigation_history_document_id ON navigation_history(document_id);
CREATE INDEX idx_navigation_history_action ON navigation_history(action);
CREATE INDEX idx_navigation_history_timestamp ON navigation_history(timestamp DESC);

CREATE INDEX idx_user_navigation_preferences_user_id ON user_navigation_preferences(user_id);

CREATE INDEX idx_pdf_navigation_statistics_date ON pdf_navigation_statistics(date);
CREATE INDEX idx_pdf_navigation_statistics_document_id ON pdf_navigation_statistics(document_id);
CREATE INDEX idx_pdf_navigation_statistics_user_id ON pdf_navigation_statistics(user_id);
CREATE INDEX idx_pdf_navigation_statistics_created_at ON pdf_navigation_statistics(created_at DESC);

CREATE INDEX idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_document_id ON reading_sessions(document_id);
CREATE INDEX idx_reading_sessions_start_time ON reading_sessions(start_time DESC);
CREATE INDEX idx_reading_sessions_duration ON reading_sessions(duration DESC);

CREATE INDEX idx_reading_goals_user_id ON reading_goals(user_id);
CREATE INDEX idx_reading_goals_document_id ON reading_goals(document_id);
CREATE INDEX idx_reading_goals_type ON reading_goals(type);
CREATE INDEX idx_reading_goals_deadline ON reading_goals(deadline);
CREATE INDEX idx_reading_goals_is_active ON reading_goals(is_active);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_pdf_navigation_states_updated_at 
    BEFORE UPDATE ON pdf_navigation_states 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdf_bookmarks_updated_at 
    BEFORE UPDATE ON pdf_bookmarks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdf_outlines_updated_at 
    BEFORE UPDATE ON pdf_outlines 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdf_search_results_updated_at 
    BEFORE UPDATE ON pdf_search_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_navigation_preferences_updated_at 
    BEFORE UPDATE ON user_navigation_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdf_navigation_statistics_updated_at 
    BEFORE UPDATE ON pdf_navigation_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_sessions_updated_at 
    BEFORE UPDATE ON reading_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_goals_updated_at 
    BEFORE UPDATE ON reading_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_pdf_navigation_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO pdf_navigation_statistics (
        date,
        document_id,
        user_id,
        total_views,
        total_reading_time,
        average_session_duration,
        total_pages_read,
        average_pages_per_session,
        most_viewed_pages,
        bookmark_stats,
        search_stats,
        navigation_patterns,
        user_engagement
    )
    SELECT 
        CURRENT_DATE,
        NEW.document_id,
        NEW.user_id,
        (SELECT COUNT(*) FROM navigation_history nh WHERE nh.document_id = NEW.document_id AND nh.user_id = NEW.user_id AND DATE(nh.timestamp) = CURRENT_DATE),
        (SELECT COALESCE(SUM(duration), 0) FROM navigation_history nh WHERE nh.document_id = NEW.document_id AND nh.user_id = NEW.user_id AND DATE(nh.timestamp) = CURRENT_DATE),
        COALESCE(
            (SELECT AVG(duration) FROM navigation_history nh WHERE nh.document_id = NEW.document_id AND nh.user_id = NEW.user_id AND DATE(nh.timestamp) = CURRENT_DATE), 
            0
        ),
        (SELECT COUNT(DISTINCT (state->>'currentPage')::INTEGER) FROM navigation_history nh WHERE nh.document_id = NEW.document_id AND nh.user_id = NEW.user_id AND DATE(nh.timestamp) = CURRENT_DATE),
        COALESCE(
            (SELECT AVG(COUNT(DISTINCT (state->>'currentPage')::INTEGER)) 
             FROM navigation_history nh 
             WHERE nh.document_id = NEW.document_id AND nh.user_id = NEW.user_id 
             AND DATE(nh.timestamp) = CURRENT_DATE 
             GROUP BY DATE(nh.timestamp)), 
            0
        ),
        (SELECT jsonb_agg(
            jsonb_build_object(
                'pageNumber', (state->>'currentPage')::INTEGER,
                'viewCount', COUNT(*),
                'averageTime', COALESCE(AVG(duration), 0)
            )
        ) FROM navigation_history nh WHERE nh.document_id = NEW.document_id AND nh.user_id = NEW.user_id AND DATE(nh.timestamp) = CURRENT_DATE GROUP BY (state->>'currentPage')::INTEGER),
        jsonb_build_object(
            'totalCreated', (SELECT COUNT(*) FROM pdf_bookmarks WHERE document_id = NEW.document_id AND user_id = NEW.user_id),
            'totalVisited', (SELECT COUNT(*) FROM pdf_bookmarks WHERE document_id = NEW.document_id AND user_id = NEW.user_id AND last_visited IS NOT NULL),
            'mostUsedTypes', (SELECT jsonb_build_object(ARRAY_AGG(DISTINCT icon), ARRAY_AGG(COUNT(*))) FROM pdf_bookmarks WHERE document_id = NEW.document_id AND user_id = NEW.user_id GROUP BY icon),
            'averagePerDocument', COALESCE((SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT document_id), 0) FROM pdf_bookmarks WHERE user_id = NEW.user_id), 0)
        ),
        jsonb_build_object(
            'totalSearches', (SELECT COUNT(*) FROM pdf_search_results WHERE document_id = NEW.document_id AND user_id = NEW.user_id AND DATE(created_at) = CURRENT_DATE),
            'averageResults', COALESCE((SELECT AVG(jsonb_array_length(results)) FROM pdf_search_results WHERE document_id = NEW.document_id AND user_id = NEW.user_id AND DATE(created_at) = CURRENT_DATE), 0),
            'mostSearchedTerms', (SELECT jsonb_agg(jsonb_build_object('term', query, 'count', COUNT(*), 'averageResults', COALESCE(AVG(jsonb_array_length(results)), 0))) FROM pdf_search_results WHERE document_id = NEW.document_id AND user_id = NEW.user_id AND DATE(created_at) = CURRENT_DATE GROUP BY query ORDER BY COUNT(*) DESC LIMIT 10),
            'searchSuccessRate', COALESCE((SELECT (COUNT(*) FILTER (WHERE jsonb_array_length(results) > 0))::DECIMAL / NULLIF(COUNT(*), 0) * 100 FROM pdf_search_results WHERE document_id = NEW.document_id AND user_id = NEW.user_id AND DATE(created_at) = CURRENT_DATE), 0)
        ),
        jsonb_build_object(
            'commonPaths', (SELECT jsonb_agg(jsonb_build_object('from', (state->>'currentPage')::INTEGER, 'to', LEAD((state->>'currentPage')::INTEGER) OVER (ORDER BY timestamp), 'frequency', COUNT(*)) FILTER (WHERE LEAD((state->>'currentPage')::INTEGER) OVER (ORDER BY timestamp) IS NOT NULL) FROM navigation_history nh WHERE nh.document_id = NEW.document_id AND nh.user_id = NEW.user_id AND DATE(nh.timestamp) = CURRENT_DATE GROUP BY (state->>'currentPage')::INTEGER, LEAD((state->>'currentPage')::INTEGER) OVER (ORDER BY timestamp) ORDER BY COUNT(*) DESC LIMIT 10),
            'preferredViewModes', (SELECT jsonb_build_object(ARRAY_AGG(DISTINCT (state->>'viewMode')), ARRAY_AGG(COUNT(*))) FROM navigation_history nh WHERE nh.document_id = NEW.document_id AND nh.user_id = NEW.user_id AND DATE(nh.timestamp) = CURRENT_DATE GROUP BY (state->>'viewMode')),
            'preferredZoomLevels', (SELECT jsonb_agg(jsonb_build_object('zoom', (state->>'zoom')::DECIMAL, 'usage', COUNT(*))) FROM navigation_history nh WHERE nh.document_id = NEW.document_id AND nh.user_id = NEW.user_id AND DATE(nh.timestamp) = CURRENT_DATE GROUP BY (state->>'zoom')::DECIMAL ORDER BY COUNT(*) DESC LIMIT 10),
            'sidebarUsage', (SELECT jsonb_build_object(ARRAY_AGG(DISTINCT (sidebar_state->>'activeTab')), ARRAY_AGG(COUNT(*))) FROM pdf_navigation_states pns WHERE pns.document_id = NEW.document_id AND pns.user_id = NEW.user_id AND DATE(pns.last_accessed) = CURRENT_DATE GROUP BY (sidebar_state->>'activeTab'))
        ),
        jsonb_build_object(
            'averageSessionLength', COALESCE((SELECT AVG(duration) FROM navigation_history nh WHERE nh.document_id = NEW.document_id AND nh.user_id = NEW.user_id AND DATE(nh.timestamp) = CURRENT_DATE), 0),
            'bounceRate', COALESCE((SELECT (COUNT(*) FILTER (WHERE duration < 30000)::DECIMAL / NULLIF(COUNT(*), 0) * 100 FROM navigation_history nh WHERE nh.document_id = NEW.document_id AND nh.user_id = NEW.user_id AND DATE(nh.timestamp) = CURRENT_DATE), 0),
            'returnRate', COALESCE((SELECT (COUNT(DISTINCT DATE(timestamp))::DECIMAL / NULLIF(COUNT(*), 0) * 100 FROM navigation_history nh WHERE nh.document_id = NEW.document_id AND nh.user_id = NEW.user_id AND DATE(nh.timestamp) >= CURRENT_DATE - INTERVAL '7 days'), 0),
            'featureUsage', (SELECT jsonb_build_object(
                'bookmarks', (SELECT COUNT(*) FROM pdf_bookmarks WHERE document_id = NEW.document_id AND user_id = NEW.user_id AND DATE(created_at) = CURRENT_DATE),
                'searches', (SELECT COUNT(*) FROM pdf_search_results WHERE document_id = NEW.document_id AND user_id = NEW.user_id AND DATE(created_at) = CURRENT_DATE),
                'outlines', (SELECT COUNT(*) FROM navigation_history nh WHERE nh.document_id = NEW.document_id AND nh.user_id = NEW.user_id AND action = 'outline_navigate' AND DATE(nh.timestamp) = CURRENT_DATE),
                'thumbnails', (SELECT COUNT(*) FROM navigation_history nh WHERE nh.document_id = NEW.document_id AND nh.user_id = NEW.user_id AND action = 'thumbnail_click' AND DATE(nh.timestamp) = CURRENT_DATE)
            )),
            'satisfactionScore', 85 -- Simulé
        )
    ON CONFLICT (date, document_id, user_id) DO UPDATE SET
        total_views = EXCLUDED.total_views,
        total_reading_time = EXCLUDED.total_reading_time,
        average_session_duration = EXCLUDED.average_session_duration,
        total_pages_read = EXCLUDED.total_pages_read,
        average_pages_per_session = EXCLUDED.average_pages_per_session,
        most_viewed_pages = EXCLUDED.most_viewed_pages,
        bookmark_stats = EXCLUDED.bookmark_stats,
        search_stats = EXCLUDED.search_stats,
        navigation_patterns = EXCLUDED.navigation_patterns,
        user_engagement = EXCLUDED.user_engagement,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pdf_navigation_statistics_navigation
    AFTER INSERT OR UPDATE ON pdf_navigation_states
    FOR EACH ROW EXECUTE FUNCTION update_pdf_navigation_statistics();

CREATE TRIGGER trigger_update_pdf_navigation_statistics_history
    AFTER INSERT ON navigation_history
    FOR EACH ROW EXECUTE FUNCTION update_pdf_navigation_statistics();

-- Politiques RLS pour les états de navigation
ALTER TABLE pdf_navigation_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pdf navigation states" ON pdf_navigation_states
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all pdf navigation states" ON pdf_navigation_states
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les thumbnails
ALTER TABLE pdf_thumbnails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pdf thumbnails" ON pdf_thumbnails
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all pdf thumbnails" ON pdf_thumbnails
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les bookmarks
ALTER TABLE pdf_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pdf bookmarks" ON pdf_bookmarks
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view public pdf bookmarks" ON pdf_bookmarks
    FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can view all pdf bookmarks" ON pdf_bookmarks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les outlines
ALTER TABLE pdf_outlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pdf outlines" ON pdf_outlines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all pdf outlines" ON pdf_outlines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les résultats de recherche
ALTER TABLE pdf_search_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pdf search results" ON pdf_search_results
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all pdf search results" ON pdf_search_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour l'historique de navigation
ALTER TABLE navigation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own navigation history" ON navigation_history
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all navigation history" ON navigation_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les préférences
ALTER TABLE user_navigation_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own navigation preferences" ON user_navigation_preferences
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all navigation preferences" ON user_navigation_preferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les statistiques
ALTER TABLE pdf_navigation_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own navigation statistics" ON pdf_navigation_statistics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all navigation statistics" ON pdf_navigation_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les sessions de lecture
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reading sessions" ON reading_sessions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all reading sessions" ON reading_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Politiques RLS pour les objectifs de lecture
ALTER TABLE reading_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reading goals" ON reading_goals
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all reading goals" ON reading_goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
            AND r.level >= 80
        )
    );

-- Fonctions RPC pour la navigation PDF

-- Fonction pour obtenir les statistiques de navigation
CREATE OR REPLACE FUNCTION get_pdf_navigation_stats(p_document_id UUID DEFAULT NULL, p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_views BIGINT,
    total_reading_time BIGINT,
    average_session_duration INTEGER,
    total_pages_read BIGINT,
    average_pages_per_session DECIMAL(5,2),
    most_viewed_pages JSONB,
    bookmark_stats JSONB,
    search_stats JSONB,
    navigation_patterns JSONB,
    user_engagement JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(total_views), 0),
        COALESCE(SUM(total_reading_time), 0),
        COALESCE(AVG(average_session_duration), 0)::INTEGER,
        COALESCE(SUM(total_pages_read), 0),
        COALESCE(AVG(average_pages_per_session), 0),
        (SELECT jsonb_agg_pages FROM (
            SELECT jsonb_agg(jsonb_build_object(
                'pageNumber', page_number::INTEGER,
                'viewCount', view_count,
                'averageTime', average_time
            )) as jsonb_agg_pages
            FROM (
                SELECT UNNEST(most_viewed_pages)->>'pageNumber'::INTEGER as page_number,
                       UNNEST(most_viewed_pages)->>'viewCount'::INTEGER as view_count,
                       UNNEST(most_viewed_pages)->>'averageTime'::INTEGER as average_time
            ) t
        ) sub),
        jsonb_build_object(
            'totalCreated', COALESCE(SUM((bookmark_stats->>'totalCreated')::INTEGER), 0),
            'totalVisited', COALESCE(SUM((bookmark_stats->>'totalVisited')::INTEGER), 0),
            'mostUsedTypes', COALESCE(jsonb_agg(bookmark_stats->>'mostUsedTypes'), '{}'),
            'averagePerDocument', COALESCE(AVG((bookmark_stats->>'averagePerDocument')::DECIMAL), 0)
        ),
        jsonb_build_object(
            'totalSearches', COALESCE(SUM((search_stats->>'totalSearches')::INTEGER), 0),
            'averageResults', COALESCE(AVG((search_stats->>'averageResults')::DECIMAL), 0),
            'mostSearchedTerms', COALESCE(jsonb_agg(search_stats->>'mostSearchedTerms'), '[]'),
            'searchSuccessRate', COALESCE(AVG((search_stats->>'searchSuccessRate')::DECIMAL), 0)
        ),
        jsonb_build_object(
            'commonPaths', COALESCE(jsonb_agg(navigation_patterns->>'commonPaths'), '[]'),
            'preferredViewModes', COALESCE(jsonb_agg(navigation_patterns->>'preferredViewModes'), '{}'),
            'preferredZoomLevels', COALESCE(jsonb_agg(navigation_patterns->>'preferredZoomLevels'), '[]'),
            'sidebarUsage', COALESCE(jsonb_agg(navigation_patterns->>'sidebarUsage'), '{}')
        ),
        jsonb_build_object(
            'averageSessionLength', COALESCE(AVG((user_engagement->>'averageSessionLength')::DECIMAL), 0),
            'bounceRate', COALESCE(AVG((user_engagement->>'bounceRate')::DECIMAL), 0),
            'returnRate', COALESCE(AVG((user_engagement->>'returnRate')::DECIMAL), 0),
            'featureUsage', COALESCE(jsonb_agg(user_engagement->>'featureUsage'), '{}'),
            'satisfactionScore', COALESCE(AVG((user_engagement->>'satisfactionScore')::DECIMAL), 0)
        )
    FROM pdf_navigation_statistics
    WHERE (p_document_id IS NULL OR document_id = p_document_id)
      AND (p_user_id IS NULL OR user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les préférences par défaut
CREATE OR REPLACE FUNCTION create_default_navigation_preferences(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_navigation_preferences (
        user_id,
        preferences
    ) VALUES (
        p_user_id,
        jsonb_build_object(
            'defaultViewMode', 'continuous',
            'defaultLayoutMode', 'vertical',
            'defaultFitMode', 'page-width',
            'defaultZoom', 1.0,
            'sidebarWidth', 300,
            'sidebarPosition', 'left',
            'autoOpenSidebar', true,
            'defaultSidebarTab', 'thumbnails',
            'thumbnailSize', 'medium',
            'showPageNumbers', true,
            'smoothScrolling', true,
            'keyboardShortcuts', true,
            'mouseGestures', false,
            'touchGestures', true,
            'autoSave', true,
            'autoSync', true,
            'theme', 'auto',
            'fontSize', 14,
            'fontFamily', 'Arial',
            'lineHeight', 1.5,
            'pageTransition', 'fade',
            'animationSpeed', 300,
            'highlightColor', '#ffff00',
            'searchHighlightColor', '#00ff00',
            'bookmarkColor', '#0000ff',
            'outlineColor', '#666666'
        )
    )
    ON CONFLICT (user_id) DO UPDATE SET
        preferences = EXCLUDED.preferences,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer les statistiques journalières
CREATE OR REPLACE FUNCTION create_daily_pdf_navigation_statistics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO pdf_navigation_statistics (
        date,
        document_id,
        user_id,
        total_views,
        total_reading_time,
        average_session_duration,
        total_pages_read,
        average_pages_per_session,
        most_viewed_pages,
        bookmark_stats,
        search_stats,
        navigation_patterns,
        user_engagement
    )
    SELECT 
        p_date,
        nh.document_id,
        nh.user_id,
        COUNT(*) as total_views,
        COALESCE(SUM(nh.duration), 0) as total_reading_time,
        COALESCE(AVG(nh.duration), 0)::INTEGER as average_session_duration,
        COUNT(DISTINCT (nh.state->>'currentPage')::INTEGER) as total_pages_read,
        COALESCE(
            (SELECT AVG(COUNT(DISTINCT (nh2.state->>'currentPage')::INTEGER)) 
             FROM navigation_history nh2 
             WHERE nh2.document_id = nh.document_id 
             AND nh2.user_id = nh.user_id 
             AND DATE(nh2.timestamp) = p_date 
             GROUP BY DATE(nh2.timestamp)), 
            0
        ) as average_pages_per_session,
        (SELECT jsonb_agg(
            jsonb_build_object(
                'pageNumber', (nh.state->>'currentPage')::INTEGER,
                'viewCount', COUNT(*),
                'averageTime', COALESCE(AVG(nh.duration), 0)
            )
        ) FROM navigation_history nh2 
         WHERE nh2.document_id = nh.document_id 
         AND nh2.user_id = nh.user_id 
         AND DATE(nh2.timestamp) = p_date 
         GROUP BY (nh2.state->>'currentPage')::INTEGER) as most_viewed_pages,
        jsonb_build_object(
            'totalCreated', (SELECT COUNT(*) FROM pdf_bookmarks WHERE document_id = nh.document_id AND user_id = nh.user_id AND DATE(created_at) = p_date),
            'totalVisited', (SELECT COUNT(*) FROM pdf_bookmarks WHERE document_id = nh.document_id AND user_id = nh.user_id AND DATE(last_visited) = p_date),
            'mostUsedTypes', (SELECT jsonb_build_object(ARRAY_AGG(DISTINCT icon), ARRAY_AGG(COUNT(*))) FROM pdf_bookmarks WHERE document_id = nh.document_id AND user_id = nh.user_id AND DATE(created_at) = p_date GROUP BY icon),
            'averagePerDocument', (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT document_id), 0) FROM pdf_bookmarks WHERE user_id = nh.user_id AND DATE(created_at) = p_date)
        ),
        jsonb_build_object(
            'totalSearches', (SELECT COUNT(*) FROM pdf_search_results WHERE document_id = nh.document_id AND user_id = nh.user_id AND DATE(created_at) = p_date),
            'averageResults', (SELECT AVG(jsonb_array_length(results)) FROM pdf_search_results WHERE document_id = nh.document_id AND user_id = nh.user_id AND DATE(created_at) = p_date),
            'mostSearchedTerms', (SELECT jsonb_agg(jsonb_build_object('term', query, 'count', COUNT(*), 'averageResults', COALESCE(AVG(jsonb_array_length(results)), 0))) FROM pdf_search_results WHERE document_id = nh.document_id AND user_id = nh.user_id AND DATE(created_at) = p_date GROUP BY query ORDER BY COUNT(*) DESC LIMIT 10),
            'searchSuccessRate', (SELECT (COUNT(*) FILTER (WHERE jsonb_array_length(results) > 0))::DECIMAL / NULLIF(COUNT(*), 0) * 100 FROM pdf_search_results WHERE document_id = nh.document_id AND user_id = nh.user_id AND DATE(created_at) = p_date)
        ),
        jsonb_build_object(
            'commonPaths', (SELECT jsonb_agg(jsonb_build_object('from', (nh.state->>'currentPage')::INTEGER, 'to', LEAD((nh.state->>'currentPage')::INTEGER) OVER (ORDER BY timestamp), 'frequency', COUNT(*)) FILTER (WHERE LEAD((nh.state->>'currentPage')::INTEGER) OVER (ORDER BY timestamp) IS NOT NULL) FROM navigation_history nh2 WHERE nh2.document_id = nh.document_id AND nh2.user_id = nh.user_id AND DATE(nh2.timestamp) = p_date GROUP BY (nh2.state->>'currentPage')::INTEGER, LEAD((nh2.state->>'currentPage')::INTEGER) OVER (ORDER BY timestamp) ORDER BY COUNT(*) DESC LIMIT 10),
            'preferredViewModes', (SELECT jsonb_build_object(ARRAY_AGG(DISTINCT (nh2.state->>'viewMode')), ARRAY_AGG(COUNT(*))) FROM navigation_history nh2 WHERE nh2.document_id = nh.document_id AND nh2.user_id = nh.user_id AND DATE(nh2.timestamp) = p_date GROUP BY (nh2.state->>'viewMode')),
            'preferredZoomLevels', (SELECT jsonb_agg(jsonb_build_object('zoom', (nh2.state->>'zoom')::DECIMAL, 'usage', COUNT(*))) FROM navigation_history nh2 WHERE nh2.document_id = nh.document_id AND nh2.user_id = nh.user_id AND DATE(nh2.timestamp) = p_date GROUP BY (nh2.state->>'zoom')::DECIMAL ORDER BY COUNT(*) DESC LIMIT 10),
            'sidebarUsage', (SELECT jsonb_build_object(ARRAY_AGG(DISTINCT (pns.sidebar_state->>'activeTab')), ARRAY_AGG(COUNT(*))) FROM pdf_navigation_states pns WHERE pns.document_id = nh.document_id AND pns.user_id = nh.user_id AND DATE(pns.last_accessed) = p_date GROUP BY (pns.sidebar_state->>'activeTab'))
        ),
        jsonb_build_object(
            'averageSessionLength', COALESCE(AVG(nh.duration), 0),
            'bounceRate', COALESCE((COUNT(*) FILTER (WHERE nh.duration < 30000)::DECIMAL / NULLIF(COUNT(*), 0) * 100), 0),
            'returnRate', COALESCE((COUNT(DISTINCT DATE(nh.timestamp))::DECIMAL / NULLIF(COUNT(*), 0) * 100), 0),
            'featureUsage', (SELECT jsonb_build_object(
                'bookmarks', (SELECT COUNT(*) FROM pdf_bookmarks WHERE document_id = nh.document_id AND user_id = nh.user_id AND DATE(created_at) = p_date),
                'searches', (SELECT COUNT(*) FROM pdf_search_results WHERE document_id = nh.document_id AND user_id = nh.user_id AND DATE(created_at) = p_date),
                'outlines', (SELECT COUNT(*) FROM navigation_history nh2 WHERE nh2.document_id = nh.document_id AND nh2.user_id = nh.user_id AND action = 'outline_navigate' AND DATE(nh2.timestamp) = p_date),
                'thumbnails', (SELECT COUNT(*) FROM navigation_history nh2 WHERE nh2.document_id = nh.document_id AND nh2.user_id = nh.user_id AND action = 'thumbnail_click' AND DATE(nh2.timestamp) = p_date)
            )),
            'satisfactionScore', 85 -- Simulé
        )
    FROM navigation_history nh
    WHERE DATE(nh.timestamp) = p_date
    GROUP BY nh.document_id, nh.user_id
    ON CONFLICT (date, document_id, user_id) DO UPDATE SET
        total_views = EXCLUDED.total_views,
        total_reading_time = EXCLUDED.total_reading_time,
        average_session_duration = EXCLUDED.average_session_duration,
        total_pages_read = EXCLUDED.total_pages_read,
        average_pages_per_session = EXCLUDED.average_pages_per_session,
        most_viewed_pages = EXCLUDED.most_viewed_pages,
        bookmark_stats = EXCLUDED.bookmark_stats,
        search_stats = EXCLUDED.search_stats,
        navigation_patterns = EXCLUDED.navigation_patterns,
        user_engagement = EXCLUDED.user_engagement,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE pdf_navigation_states IS 'États de navigation PDF avec position, zoom, et préférences utilisateur';
COMMENT ON TABLE pdf_thumbnails IS 'Miniatures des pages PDF générées pour navigation rapide';
COMMENT ON TABLE pdf_bookmarks IS 'Signets personnalisés avec position, style et métadonnées';
COMMENT ON TABLE pdf_outlines IS 'Sommaires (table des matières) des documents PDF';
COMMENT ON TABLE pdf_search_results IS 'Résultats de recherche dans les documents PDF';
COMMENT ON TABLE navigation_history IS 'Historique complet des actions de navigation';
COMMENT ON TABLE user_navigation_preferences IS 'Préférences de navigation personnalisées par utilisateur';
COMMENT ON TABLE pdf_navigation_statistics IS 'Statistiques détaillées d\'utilisation et de navigation';
COMMENT ON TABLE reading_sessions IS 'Sessions de lecture avec progression et temps';
COMMENT ON TABLE reading_goals IS 'Objectifs de lecture personnalisés';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN pdf_navigation_states.scroll_position IS 'Position de défilement {x, y, pageTop, pageLeft, viewportWidth, viewportHeight, scale}';
COMMENT ON COLUMN pdf_navigation_states.sidebar_state IS 'État de la barre latérale {isOpen, activeTab, width, position, collapsed, tabs}';
COMMENT ON COLUMN pdf_navigation_states.search_state IS 'État de recherche {query, results, currentIndex, isSearching, options, filters, history}';
COMMENT ON COLUMN pdf_navigation_states.reading_progress IS 'Progression de lecture {totalPages, readPages, currentPage, readingTime, averageReadingTime, estimatedTotalTime, completionPercentage, lastReadPage, readingSpeed, readingStreak, longestSession, totalSessions, bookmarksCreated, annotationsCreated, searchesPerformed, progressHistory, readingGoals}';
COMMENT ON COLUMN pdf_thumbnails.metadata IS 'Métadonnées du thumbnail {originalWidth, originalHeight, dpi, colorSpace, hasText, wordCount, imageCount, dominantColor, aspectRatio, fileSize, renderTime}';
COMMENT ON COLUMN pdf_bookmarks.position IS 'Position du bookmark {x, y, zoom, rotation, scrollX, scrollY, pageTop, pageLeft}';
COMMENT ON COLUMN pdf_bookmarks.metadata IS 'Métadonnées du bookmark {context, snippet, wordCount, characterCount, readingTime, difficulty, importance, category, subcategory, tags, relatedBookmarks, customFields}';
COMMENT ON COLUMN pdf_outlines.position IS 'Position de l\'outline {x, y, zoom, rotation, destination}';
COMMENT ON COLUMN pdf_outlines.metadata IS 'Métadonnées de l\'outline {action, uri, namedAction, fileSpec, parameters, color, fontStyle, isBold, isItalic}';
COMMENT ON COLUMN pdf_search_results.results IS 'Résultats de recherche [{id, text, pageNumber, position, context, snippet, relevance, matchType, metadata}]';
COMMENT ON COLUMN navigation_history.state IS 'État de navigation au moment de l\'action {currentPage, zoom, rotation, scrollPosition, viewMode, layoutMode, fitMode, sidebarState, searchState}';
COMMENT ON COLUMN navigation_history.metadata IS 'Métadonnées de l\'action {source, trigger, context, device, browser, sessionId, referrer, utmSource}';
COMMENT ON COLUMN user_navigation_preferences.preferences IS 'Préférences utilisateur {defaultViewMode, defaultLayoutMode, defaultFitMode, defaultZoom, sidebarWidth, sidebarPosition, autoOpenSidebar, defaultSidebarTab, thumbnailSize, showPageNumbers, smoothScrolling, keyboardShortcuts, mouseGestures, touchGestures, autoSave, autoSync, theme, fontSize, fontFamily, lineHeight, pageTransition, animationSpeed, highlightColor, searchHighlightColor, bookmarkColor, outlineColor}';
COMMENT ON COLUMN pdf_navigation_statistics.navigation_patterns IS 'Patterns de navigation {commonPaths, preferredViewModes, preferredZoomLevels, sidebarUsage}';
COMMENT ON COLUMN pdf_navigation_statistics.user_engagement IS 'Engagement utilisateur {averageSessionLength, bounceRate, returnRate, featureUsage, satisfactionScore}';
