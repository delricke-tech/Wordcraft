-- Migration: Ajouter une colonne questions JSONB à la table quizzes
-- Date: 31 décembre 2024
-- Description: Permet de stocker les questions générées par l'IA directement dans la table quizzes

-- Ajouter la colonne questions de type JSONB pour stocker les questions générées
ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]'::jsonb;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN quizzes.questions IS 'Questions du quiz au format JSON [{question, options, correctAnswer, explanation}]';

-- Créer un index GIN pour optimiser les requêtes JSON
CREATE INDEX IF NOT EXISTS idx_quizzes_questions ON quizzes USING GIN (questions);
