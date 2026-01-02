-- Fonction pour incrémenter le compteur de membres d'un groupe
CREATE OR REPLACE FUNCTION increment_group_members(group_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE groups
  SET member_count = member_count + 1
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour décrémenter le compteur de membres d'un groupe
CREATE OR REPLACE FUNCTION decrement_group_members(group_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE groups
  SET member_count = GREATEST(member_count - 1, 0)
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour automatiquement le compteur de membres
-- Quand un membre est ajouté
CREATE OR REPLACE FUNCTION update_group_member_count_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE groups
    SET member_count = member_count + 1
    WHERE id = NEW.group_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Quand un membre est supprimé
CREATE OR REPLACE FUNCTION update_group_member_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'active' THEN
    UPDATE groups
    SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.group_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Quand le statut d'un membre change
CREATE OR REPLACE FUNCTION update_group_member_count_on_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'active' AND NEW.status != 'active' THEN
    UPDATE groups
    SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.group_id;
  ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
    UPDATE groups
    SET member_count = member_count + 1
    WHERE id = NEW.group_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS group_member_count_insert ON group_members;
DROP TRIGGER IF EXISTS group_member_count_delete ON group_members;
DROP TRIGGER IF EXISTS group_member_count_update ON group_members;

-- Créer les triggers
CREATE TRIGGER group_member_count_insert
  AFTER INSERT ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count_on_insert();

CREATE TRIGGER group_member_count_delete
  AFTER DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count_on_delete();

CREATE TRIGGER group_member_count_update
  AFTER UPDATE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count_on_update();

-- Ajouter le propriétaire comme premier membre lors de la création d'un groupe
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role, status)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS add_owner_as_member_trigger ON groups;

CREATE TRIGGER add_owner_as_member_trigger
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_member();
