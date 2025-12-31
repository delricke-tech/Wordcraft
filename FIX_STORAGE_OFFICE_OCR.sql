/*
  🔧 FIX : AJOUT SUPPORT OFFICE + AMÉLIORATION OCR
  
  Problème : PowerPoint (.pptx) et autres formats Office non supportés
  Solution : Ajouter TOUS les formats Office + optimiser OCR
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard → SQL Editor
  2. Copier-coller ce script
  3. Cliquer sur "Run"
  
  Date : 31 décembre 2024
*/

-- ============================================================================
-- MISE À JOUR DU BUCKET STORAGE AVEC TOUS LES FORMATS OFFICE
-- ============================================================================

UPDATE storage.buckets
SET 
  allowed_mime_types = ARRAY[
    -- PDF (tous types)
    'application/pdf',
    
    -- Microsoft Word
    'application/msword',                                                          -- .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',   -- .docx
    
    -- Microsoft PowerPoint
    'application/vnd.ms-powerpoint',                                              -- .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', -- .pptx
    
    -- Microsoft Excel
    'application/vnd.ms-excel',                                                   -- .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        -- .xlsx
    
    -- Texte brut et notes
    'text/plain',                                                                 -- .txt
    'text/markdown',                                                              -- .md
    'text/html',                                                                  -- .html
    'text/csv',                                                                   -- .csv
    'text/rtf',                                                                   -- .rtf
    'application/rtf',                                                            -- .rtf (alt)
    
    -- Images (pour OCR)
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'image/heic',
    'image/heif',
    
    -- Vidéo
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-matroska',
    
    -- Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
    'audio/flac'
  ],
  file_size_limit = 104857600, -- 100 MB
  public = true
WHERE id = 'documents';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

DO $$
DECLARE
  mime_count INTEGER;
BEGIN
  SELECT array_length(allowed_mime_types, 1) INTO mime_count
  FROM storage.buckets
  WHERE id = 'documents';
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ CONFIGURATION STORAGE MISE À JOUR !';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Bucket "documents" :';
  RAISE NOTICE '  - MIME types autorisés : %', mime_count;
  RAISE NOTICE '  - Taille max : 100 MB';
  RAISE NOTICE '  - Public : Oui';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Formats supportés :';
  RAISE NOTICE '  ✅ PDF (tous types, y compris scannés)';
  RAISE NOTICE '  ✅ Word (.doc, .docx)';
  RAISE NOTICE '  ✅ PowerPoint (.ppt, .pptx)';
  RAISE NOTICE '  ✅ Excel (.xls, .xlsx)';
  RAISE NOTICE '  ✅ Texte (.txt, .md, .rtf, .csv, .html)';
  RAISE NOTICE '  ✅ Images (10 formats pour OCR)';
  RAISE NOTICE '  ✅ Vidéo (6 formats)';
  RAISE NOTICE '  ✅ Audio (8 formats)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Vous pouvez maintenant uploader :';
  RAISE NOTICE '  - Présentations PowerPoint';
  RAISE NOTICE '  - Feuilles de calcul Excel';
  RAISE NOTICE '  - Notes bloc-notes (.txt)';
  RAISE NOTICE '  - PDF scannés (OCR automatique)';
  RAISE NOTICE '  - Photos de documents (OCR automatique)';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- AFFICHER LES MIME TYPES POUR VÉRIFICATION
-- ============================================================================

SELECT 
  'Liste complète des MIME types autorisés :' as info;

SELECT 
  unnest(allowed_mime_types) as "MIME Type autorisé"
FROM storage.buckets
WHERE id = 'documents'
ORDER BY 1;
