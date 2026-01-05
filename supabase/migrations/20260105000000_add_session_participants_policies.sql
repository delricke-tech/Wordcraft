-- Migration: Ajout des politiques RLS pour session_participants
-- Date: 2026-01-05
-- Description: Politiques de sécurité pour gérer l'accès aux participants des sessions d'étude

-- Politiques RLS pour session_participants

-- Politique 1: Visualisation des participations
-- Les utilisateurs peuvent voir leurs propres participations
-- Les hôtes peuvent voir tous les participants de leurs sessions
CREATE POLICY "Users can view their participations"
  ON session_participants FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM study_sessions
      WHERE study_sessions.id = session_participants.session_id
      AND study_sessions.host_id = auth.uid()
    )
  );

-- Politique 2: Ajout de participants
-- Les hôtes peuvent ajouter des participants à leurs sessions
-- Les utilisateurs peuvent s'auto-inscrire à une session
CREATE POLICY "Hosts can add participants"
  ON session_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_sessions
      WHERE study_sessions.id = session_participants.session_id
      AND study_sessions.host_id = auth.uid()
    )
    OR auth.uid() = user_id
  );

-- Politique 3: Mise à jour de la participation
-- Les utilisateurs peuvent uniquement modifier leur propre participation
CREATE POLICY "Users can update their participation"
  ON session_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique 4: Suppression de participants
-- Les hôtes peuvent retirer des participants de leurs sessions
-- Les utilisateurs peuvent se retirer eux-mêmes d'une session
CREATE POLICY "Hosts can delete participants"
  ON session_participants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM study_sessions
      WHERE study_sessions.id = session_participants.session_id
      AND study_sessions.host_id = auth.uid()
    )
    OR auth.uid() = user_id
  );
