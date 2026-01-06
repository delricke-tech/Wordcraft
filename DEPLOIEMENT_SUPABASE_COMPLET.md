# ✅ Déploiement Supabase - 2 Bugs Critiques

**Date** : 6 janvier 2025  
**Statut** : 
- ✅ Edge Function déployée
- ⏳ Migrations SQL à exécuter

---

## 🎉 CE QUI EST DÉJÀ FAIT

✅ **Bug 2 (Edge Function)** : DÉPLOYÉ !
```
Deployed Functions on project uexuecubafgfhpfebknt: validate-transaction
URL: https://supabase.com/dashboard/project/uexuecubafgfhpfebknt/functions
```

---

## ⏳ CE QU'IL RESTE À FAIRE (2 minutes)

### Bug 1 : Exécuter les Migrations SQL

Les migrations doivent être exécutées **directement dans le Dashboard** pour éviter les conflits.

---

## 📋 ÉTAPES DÉTAILLÉES

### Étape 1 : Ouvrir Supabase Dashboard

1. Aller sur : https://supabase.com/dashboard/project/uexuecubafgfhpfebknt
2. Cliquer sur **SQL Editor** dans le menu de gauche
3. Cliquer sur **New query**

---

### Étape 2 : Créer la Table Payments (si elle n'existe pas)

**Copier-coller le contenu de ce fichier** :
```
supabase/migrations/20250106000001_create_payments_table.sql
```

**Ou utiliser ce script** :

```sql
-- ============================================
-- Table PAYMENTS pour WordCraft
-- Gestion des paiements Mobile Money Gabon
-- Opérateur: Moov Money (Libertis) uniquement
-- Date: 6 janvier 2025
-- ============================================

-- 1. Créer la table payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    tid_submitted TEXT NOT NULL UNIQUE,
    operator TEXT NOT NULL CHECK (operator = 'moov'),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    phone_number TEXT,
    reference TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Créer les indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_operator ON public.payments(operator);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_tid_submitted ON public.payments(tid_submitted);

-- 3. Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending payments"
    ON public.payments FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);
```

**Cliquer sur RUN** ✅

---

### Étape 3 : Corriger la Contrainte Operator (BUG 1 - CRITIQUE)

**Copier-coller le contenu de ce fichier** :
```
supabase/migrations/20250106000002_update_payments_for_sms_validation.sql
```

**Ou utiliser cette partie essentielle** :

```sql
-- ============================================
-- FIX BUG 1 : Supprimer TOUTES les contraintes CHECK sur operator
-- ============================================

DO $$ 
DECLARE
    constraint_rec RECORD;
    constraints_dropped INTEGER := 0;
BEGIN
    -- Trouver et supprimer toutes les contraintes CHECK qui concernent 'operator'
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
END $$;

-- Ajouter la nouvelle contrainte (Moov uniquement)
ALTER TABLE public.payments
ADD CONSTRAINT payments_operator_check
CHECK (operator = 'moov');

RAISE NOTICE '✅ Nouvelle contrainte payments_operator_check ajoutée (operator = moov uniquement)';
```

**Cliquer sur RUN** ✅

---

### Étape 4 : Créer la Fonction RPC Atomique (BONUS - Anti Race Condition)

**Copier-coller le contenu de ce fichier** :
```
supabase/migrations/20250106000003_create_rpc_validate_payment_atomic.sql
```

Cette fonction protège contre les validations simultanées par les 2 SIM.

**Cliquer sur RUN** ✅

---

## ✅ VÉRIFICATIONS

### Vérification Bug 1 : Une Seule Contrainte

```sql
SELECT 
    c.conname,
    pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'payments'
  AND c.contype = 'c'
  AND pg_get_constraintdef(c.oid) ILIKE '%operator%';
```

**Résultat attendu** :
```
conname                 | pg_get_constraintdef
------------------------+-------------------------
payments_operator_check | CHECK (operator = 'moov'::text)
```

✅ **Une seule ligne** = Succès !

---

### Vérification Bug 2 : Edge Function Déployée

```bash
supabase functions logs validate-transaction --tail
```

Ou voir dans le Dashboard :
https://supabase.com/dashboard/project/uexuecubafgfhpfebknt/functions/validate-transaction/logs

✅ **Pas d'erreur** = Succès !

---

## 🧪 TESTS RAPIDES

### Test Bug 1 : Insertions

```sql
-- Doit RÉUSSIR (Moov)
INSERT INTO payments (user_id, amount, tid_submitted, operator, status)
VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    5000,
    'TEST_MOOV_' || floor(random()*1000000)::text,
    'moov',
    'pending'
);

-- Doit ÉCHOUER (Airtel)
INSERT INTO payments (user_id, amount, tid_submitted, operator, status)
VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    5000,
    'TEST_AIRTEL_' || floor(random()*1000000)::text,
    'airtel',
    'pending'
);
-- Résultat attendu : ERROR: violates check constraint "payments_operator_check"

-- Nettoyer
DELETE FROM payments WHERE tid_submitted LIKE 'TEST_%';
```

✅ Si Moov réussit et Airtel échoue = **Succès Bug 1** !

---

### Test Bug 2 : Extension d'Abonnement

```sql
-- 1. Créer un profil test avec abonnement dans 10 jours
INSERT INTO profiles (id, subscription_type, subscription_expires_at)
VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'basic',
    NOW() + INTERVAL '10 days'
) ON CONFLICT (id) DO UPDATE SET
    subscription_expires_at = NOW() + INTERVAL '10 days';

-- 2. Créer un paiement
INSERT INTO payments (user_id, amount, tid_submitted, operator, status)
VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    5000,
    'TEST_EXTENSION_123',
    'moov',
    'pending'
);

-- 3. Simuler la validation (via curl ou depuis Android)
-- 4. Vérifier que l'abonnement expire dans ~40 jours (10 + 30)
SELECT 
    subscription_expires_at,
    EXTRACT(DAY FROM (subscription_expires_at - NOW())) as jours_restants
FROM profiles
WHERE id = (SELECT id FROM auth.users LIMIT 1);

-- Résultat attendu : jours_restants ≈ 40

-- Nettoyer
DELETE FROM payments WHERE tid_submitted = 'TEST_EXTENSION_123';
```

✅ Si ~40 jours (pas ~30) = **Succès Bug 2** !

---

## 📊 RÉCAPITULATIF

| Composant | Statut | Action |
|-----------|--------|--------|
| **Edge Function validate-transaction** | ✅ DÉPLOYÉ | Aucune |
| **Table payments** | ⏳ À exécuter | Étape 2 |
| **Contrainte operator (Bug 1)** | ⏳ À exécuter | Étape 3 |
| **Fonction RPC atomique** | ⏳ À exécuter | Étape 4 |

---

## 🎯 CHECKLIST FINALE

- [ ] ✅ Edge Function déployée (FAIT)
- [ ] ⏳ Étape 2 : Table payments créée
- [ ] ⏳ Étape 3 : Contrainte operator corrigée (Bug 1)
- [ ] ⏳ Étape 4 : Fonction RPC créée
- [ ] ⏳ Vérification : 1 seule contrainte operator
- [ ] ⏳ Test : Insertion Moov OK, Airtel KO
- [ ] ⏳ Test : Extension abonnement ~40 jours

---

## 🚀 TEMPS ESTIMÉ

- Étape 2 : 30 secondes
- Étape 3 : 30 secondes
- Étape 4 : 30 secondes
- Vérifications : 1 minute
- **Total : 2-3 minutes**

---

## 📚 DOCUMENTATION

- `FIX_2_BUGS_CRITIQUES.md` - Détails techniques complets
- `DEPLOIEMENT_FIX_2_BUGS.md` - Guide général
- `test_operator_constraint_fix.sql` - Tests automatisés Bug 1
- `test_subscription_extension.js` - Tests automatisés Bug 2

---

## ✅ STATUT FINAL

```
✅ GitHub : DÉPLOYÉ (commit 4a437f8)
✅ Edge Function : DÉPLOYÉE
⏳ Migrations SQL : À EXÉCUTER (2 minutes)
```

**Prochaine étape** : Exécuter les Étapes 2, 3, 4 dans Supabase SQL Editor 🚀

---

**Date** : 6 janvier 2025  
**Projet** : uexuecubafgfhpfebknt  
**Dashboard** : https://supabase.com/dashboard/project/uexuecubafgfhpfebknt
