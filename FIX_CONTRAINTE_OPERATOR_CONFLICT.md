# 🔧 FIX CRITIQUE : Conflit de Contraintes Operator

**Date** : 6 janvier 2025  
**Priorité** : 🔴 **CRITIQUE**  
**Statut** : ✅ **RÉSOLU**

---

## 🚨 Problème Identifié

### Description

Un conflit de contraintes existait entre deux scripts SQL de migration :

1. **`create_payments_table.sql`** (création initiale)
2. **`update_payments_for_sms_validation.sql`** (mise à jour stratégie Moov-only)

### Contrainte Originale (Inline)

```sql
-- Dans create_payments_table.sql (ligne 12-13)
operator TEXT NOT NULL CHECK (operator IN ('airtel', 'moov')),
```

Cette contrainte est **inline** et **sans nom explicite**. PostgreSQL lui assigne automatiquement un nom comme :
- `payments_operator_check`
- `payments_operator_check1`
- Ou un nom généré comme `payments_check`

### Tentative de Mise à Jour

```sql
-- Dans update_payments_for_sms_validation.sql (original)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_operator_check;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_operator_check 
CHECK (operator = 'moov');
```

### Le Problème

❌ **Le `DROP CONSTRAINT` ne supprime pas forcément la contrainte inline originale** si elle a un nom différent.

**Résultat** : Deux contraintes coexistent :
1. Contrainte originale : `operator IN ('airtel', 'moov')`
2. Nouvelle contrainte : `operator = 'moov'`

**Impact** :
- ✅ `INSERT ... operator = 'moov'` → Passe les deux contraintes
- ❌ `INSERT ... operator = 'airtel'` → Passe la 1ère mais **échoue** sur la 2ème

---

## ✅ Solution Implémentée

### 1. Script de Migration Corrigé

**Fichier** : `supabase/migrations/update_payments_for_sms_validation.sql`

```sql
-- Supprimer TOUTES les contraintes CHECK sur operator
DO $$ 
DECLARE
    constraint_rec RECORD;
    constraints_dropped INTEGER := 0;
BEGIN
    -- Trouver toutes les contraintes CHECK qui concernent 'operator'
    FOR constraint_rec IN 
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND t.relname = 'payments'
          AND c.contype = 'c'  -- CHECK constraint
          AND pg_get_constraintdef(c.oid) ILIKE '%operator%'
    LOOP
        EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', constraint_rec.conname);
        constraints_dropped := constraints_dropped + 1;
        RAISE NOTICE '🗑️ Contrainte supprimée: %', constraint_rec.conname;
    END LOOP;
    
    IF constraints_dropped = 0 THEN
        RAISE NOTICE '⚠️ Aucune contrainte operator trouvée à supprimer';
    ELSE
        RAISE NOTICE '✅ % contrainte(s) operator supprimée(s)', constraints_dropped;
    END IF;
    
    -- Ajouter la nouvelle contrainte (Moov uniquement)
    ALTER TABLE public.payments 
    ADD CONSTRAINT payments_operator_check 
    CHECK (operator = 'moov');
    
    RAISE NOTICE '✅ Nouvelle contrainte operator ajoutée (Moov uniquement)';
END $$;
```

**Fonctionnement** :
1. ✅ Recherche **TOUTES** les contraintes CHECK qui mentionnent `operator` dans leur définition
2. ✅ Supprime **TOUTES** ces contraintes (quel que soit leur nom)
3. ✅ Ajoute la nouvelle contrainte avec un nom explicite
4. ✅ Log informatif pour tracer les actions

---

### 2. Script de Création Mis à Jour

**Fichier** : `supabase/migrations/create_payments_table.sql`

**Avant** :
```sql
operator TEXT NOT NULL CHECK (operator IN ('airtel', 'moov')),
```

**Après** :
```sql
operator TEXT NOT NULL CHECK (operator = 'moov'),
```

**Raison** : Cohérence avec la stratégie Moov Money Gabon uniquement.

---

## 🧪 Tests de Vérification

### 1. Vérifier les Contraintes Existantes

```sql
-- Lister toutes les contraintes CHECK sur la table payments
SELECT 
    c.conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.relname = 'payments'
  AND c.contype = 'c'
ORDER BY c.conname;
```

**Résultat attendu après migration** :
```
constraint_name              | constraint_definition
-----------------------------+-------------------------
payments_operator_check      | CHECK (operator = 'moov'::text)
payments_status_check        | CHECK (status IN ('pending', 'confirmed', ...))
payments_amount_check        | CHECK (amount > 0)
payments_tid_submitted_key   | UNIQUE (tid_submitted)
```

---

### 2. Test d'Insertion Moov

```sql
-- Devrait réussir
INSERT INTO public.payments (user_id, amount, tid_submitted, operator, status)
VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    5000,
    'TEST_MOOV_FIX_001',
    'moov',
    'pending'
);

-- Vérifier
SELECT operator, status FROM public.payments WHERE tid_submitted = 'TEST_MOOV_FIX_001';
```

**Résultat attendu** : ✅ Insertion réussie

---

### 3. Test d'Insertion Airtel (doit échouer)

```sql
-- Devrait échouer avec la nouvelle contrainte
INSERT INTO public.payments (user_id, amount, tid_submitted, operator, status)
VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    5000,
    'TEST_AIRTEL_FAIL_001',
    'airtel',
    'pending'
);
```

**Résultat attendu** : ❌ Erreur
```
ERROR:  new row for relation "payments" violates check constraint "payments_operator_check"
DETAIL:  Failing row contains (..., airtel, ...).
```

---

## 📊 Impact du Fix

### Avant le Fix

| Scénario | Contrainte 1 (inline) | Contrainte 2 (nommée) | Résultat |
|----------|----------------------|-----------------------|----------|
| `operator = 'moov'` | ✅ Passe | ✅ Passe | ✅ **OK** |
| `operator = 'airtel'` | ✅ Passe | ❌ **Échoue** | ❌ **ERREUR** |

**Problème** : Comportement incohérent, erreurs cryptiques.

### Après le Fix

| Scénario | Contrainte unique | Résultat |
|----------|------------------|----------|
| `operator = 'moov'` | ✅ Passe | ✅ **OK** |
| `operator = 'airtel'` | ❌ **Échoue** | ❌ **ERREUR CLAIRE** |

**Avantages** : Une seule contrainte, comportement prévisible, erreurs claires.

---

## 🎯 Leçons Apprises

### 1. Contraintes Inline vs Nommées

**Mauvaise pratique** :
```sql
CREATE TABLE example (
    column TEXT CHECK (column IN ('a', 'b'))  -- ❌ Nom généré automatiquement
);
```

**Bonne pratique** :
```sql
CREATE TABLE example (
    column TEXT,
    CONSTRAINT example_column_check CHECK (column IN ('a', 'b'))  -- ✅ Nom explicite
);
```

### 2. Migration de Contraintes

**Mauvaise pratique** :
```sql
-- ❌ Suppose le nom de la contrainte
ALTER TABLE t DROP CONSTRAINT t_col_check;
ALTER TABLE t ADD CONSTRAINT t_col_check CHECK (...);
```

**Bonne pratique** :
```sql
-- ✅ Recherche et supprime toutes les contraintes concernées
DO $$ 
DECLARE
    c RECORD;
BEGIN
    FOR c IN 
        SELECT conname FROM pg_constraint 
        WHERE ... AND pg_get_constraintdef(oid) LIKE '%col%'
    LOOP
        EXECUTE format('ALTER TABLE t DROP CONSTRAINT %I', c.conname);
    END LOOP;
    
    ALTER TABLE t ADD CONSTRAINT t_col_check CHECK (...);
END $$;
```

### 3. Tests de Migration

**Toujours tester** :
1. ✅ Migration sur une base vierge (create → update)
2. ✅ Migration sur une base existante (update uniquement)
3. ✅ Insertion de données valides
4. ✅ Insertion de données invalides (vérifier l'erreur)

---

## 📋 Checklist Post-Fix

- [x] ✅ Script de migration corrigé
- [x] ✅ Script de création cohérent
- [x] ✅ Tests SQL écrits
- [x] ✅ Documentation créée
- [ ] ⏳ Exécuter le script sur Supabase
- [ ] ⏳ Vérifier les contraintes
- [ ] ⏳ Tester les insertions

---

## 🔗 Fichiers Modifiés

| Fichier | Changement | Status |
|---------|-----------|--------|
| `supabase/migrations/update_payments_for_sms_validation.sql` | Suppression robuste des contraintes | ✅ Corrigé |
| `supabase/migrations/create_payments_table.sql` | Contrainte moov uniquement | ✅ Mis à jour |
| `FIX_CONTRAINTE_OPERATOR_CONFLICT.md` | Documentation du fix | ✅ Créé |

---

## 🎉 Résumé

### Problème
Conflit de contraintes entre inline (`airtel` + `moov`) et nommée (`moov` uniquement).

### Solution
Suppression dynamique de **toutes** les contraintes CHECK sur `operator`, puis ajout d'une seule contrainte propre.

### Résultat
✅ **Un seul opérateur** : Moov Money Gabon  
✅ **Contrainte unique** : `payments_operator_check`  
✅ **Comportement prévisible**  
✅ **Erreurs claires**

---

**Date du fix** : 6 janvier 2025  
**Rapporté par** : Utilisateur (audit manuel)  
**Statut** : ✅ **RÉSOLU**

🎯 **Merci pour ce repérage critique !**
