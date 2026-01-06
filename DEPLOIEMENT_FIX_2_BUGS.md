# 🚀 Déploiement Express - Fix 2 Bugs Critiques

**Date** : 6 janvier 2025  
**Durée estimée** : 5 minutes  
**Priorité** : 🔴 **CRITIQUE**

---

## 📋 Checklist Rapide

- [ ] 1. Bug 1 : Exécuter SQL dans Supabase
- [ ] 2. Bug 1 : Vérifier la contrainte
- [ ] 3. Bug 2 : Redéployer l'Edge Function
- [ ] 4. Bug 2 : Vérifier les logs
- [ ] 5. Tester les deux fixes

---

## 🐛 Bug 1 : Contraintes Operator (SQL)

### Étape 1 : Exécuter le SQL

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Copier-coller le contenu de :

```
supabase/migrations/update_payments_for_sms_validation.sql
```

3. Cliquer sur **Run**

**OU** en ligne de commande :

```bash
supabase db push
```

### Étape 2 : Vérifier

```sql
-- Dans SQL Editor
SELECT 
    c.conname,
    pg_get_constraintdef(c.oid)
FROM pg_constraint c
WHERE c.conrelid = 'payments'::regclass
  AND pg_get_constraintdef(c.oid) ILIKE '%operator%';
```

**Résultat attendu** :
```
conname                 | pg_get_constraintdef
------------------------+-------------------------
payments_operator_check | CHECK (operator = 'moov'::text)
```

✅ **Une seule ligne** = Succès !

### Étape 3 : Test Rapide

```sql
-- Doit réussir
INSERT INTO payments (user_id, amount, tid_submitted, operator, status)
VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    5000, 'TEST_MOOV_' || floor(random()*1000)::text, 'moov', 'pending'
);

-- Doit échouer
INSERT INTO payments (user_id, amount, tid_submitted, operator, status)
VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    5000, 'TEST_AIRTEL_' || floor(random()*1000)::text, 'airtel', 'pending'
);
-- Erreur attendue : "violates check constraint payments_operator_check"

-- Nettoyer
DELETE FROM payments WHERE tid_submitted LIKE 'TEST_%';
```

---

## 🐛 Bug 2 : Extension Abonnement (Edge Function)

### Étape 1 : Redéployer

```bash
cd supabase/functions/validate-transaction
supabase functions deploy validate-transaction
```

**OU** via Dashboard :
1. Functions → validate-transaction
2. Deploy → Upload new version

### Étape 2 : Vérifier les Logs

```bash
supabase functions logs validate-transaction --tail
```

**OU** via Dashboard :
1. Functions → validate-transaction → Logs

### Étape 3 : Test Rapide

```sql
-- 1. Créer un profil avec abonnement actif (expire dans 10 jours)
INSERT INTO profiles (id, subscription_type, subscription_expires_at)
VALUES (
    'test-extension-001',
    'basic',
    NOW() + INTERVAL '10 days'
);

-- 2. Créer un paiement
INSERT INTO payments (user_id, amount, tid_submitted, operator, status)
VALUES (
    'test-extension-001',
    5000,
    'TEST_EXTENSION_001',
    'moov',
    'pending'
);

-- 3. Simuler la validation SMS
```

```bash
curl -X POST https://votre-projet.supabase.co/functions/v1/validate-transaction \
  -H "Content-Type: application/json" \
  -H "x-custom-authorization: VOTRE_CLE_SECRETE" \
  -d '{
    "message": "Ref: TEST_EXTENSION_001\n5000 FCFA",
    "from": "MoovMoney",
    "sim_slot": 1
  }'
```

**4. Vérifier le résultat**

```sql
SELECT 
    subscription_type,
    subscription_expires_at,
    EXTRACT(DAY FROM (subscription_expires_at - NOW())) as jours_restants
FROM profiles
WHERE id = 'test-extension-001';
```

**Résultat attendu** :
- `jours_restants` ≈ **40** (10 jours restants + 30 nouveaux)
- ❌ Avant fix : ~30 jours (écrasement)
- ✅ Après fix : ~40 jours (extension)

**5. Vérifier les logs**

Chercher dans les logs de l'Edge Function :
```
📅 Extension: 30 jours ajoutés à [date actuelle + 10 jours]
```

**6. Nettoyer**

```sql
DELETE FROM payments WHERE tid_submitted = 'TEST_EXTENSION_001';
DELETE FROM profiles WHERE id = 'test-extension-001';
```

---

## 🧪 Validation Complète (Optionnel)

### Bug 1

```bash
# Exécuter le script de test complet
psql -f supabase/migrations/test_operator_constraint_fix.sql
```

### Bug 2

```bash
# Exécuter les tests détaillés
node test_subscription_extension.js
```

---

## 📊 Résumé des Corrections

| Bug | Fichier | Changement | Impact |
|-----|---------|------------|--------|
| **1** | `update_payments_for_sms_validation.sql` | Boucle FOR pour supprimer toutes contraintes operator | ✅ Une seule contrainte propre |
| **1** | `create_payments_table.sql` | `CHECK (operator = 'moov')` directement | ✅ Cohérent dès le départ |
| **2** | `validate-transaction/index.ts` | Vérifier abonnement existant avant calcul | ✅ Extension au lieu d'écrasement |

---

## ⚠️ Points d'Attention

### Bug 1
- ✅ **Sans impact** si vous utilisez uniquement Moov (stratégie actuelle)
- ⚠️ **Bloquant** si vous voulez revenir à Airtel + Moov

### Bug 2
- 🔴 **Impact financier majeur** si non corrigé
- ✅ **Critique** : affecte tous les renouvellements anticipés
- 💰 **Perte** : ~10 jours par utilisateur en moyenne

---

## 🎯 Validation Finale

### Critères de Succès

**Bug 1** :
- [ ] ✅ Une seule contrainte CHECK sur `operator`
- [ ] ✅ Insertion `operator='moov'` réussit
- [ ] ✅ Insertion `operator='airtel'` échoue proprement

**Bug 2** :
- [ ] ✅ Logs montrent "Extension: X jours ajoutés à [date]"
- [ ] ✅ Test extension donne ~40 jours (pas ~30)
- [ ] ✅ Pas d'erreur dans les logs

---

## 🚨 En Cas de Problème

### Bug 1 : Plusieurs contraintes

```sql
-- Lister toutes les contraintes
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'payments'::regclass AND contype = 'c';

-- Supprimer manuellement chaque contrainte operator
ALTER TABLE payments DROP CONSTRAINT nom_contrainte_1;
ALTER TABLE payments DROP CONSTRAINT nom_contrainte_2;

-- Ajouter la bonne contrainte
ALTER TABLE payments 
ADD CONSTRAINT payments_operator_check 
CHECK (operator = 'moov');
```

### Bug 2 : Logs d'erreur

```bash
# Voir les logs détaillés
supabase functions logs validate-transaction --tail

# Vérifier le code déployé
supabase functions list
```

Si erreur :
1. Vérifier que le fichier a bien été modifié
2. Redéployer : `supabase functions deploy validate-transaction`
3. Tester à nouveau

---

## 📞 Support

Si vous rencontrez un problème :

1. **Bug 1** : Vérifier `supabase/migrations/update_payments_for_sms_validation.sql`
2. **Bug 2** : Vérifier `supabase/functions/validate-transaction/index.ts` lignes 201-259
3. Consulter `FIX_2_BUGS_CRITIQUES.md` pour les détails complets

---

## ✅ Checklist Post-Déploiement

- [ ] SQL migrations exécutées
- [ ] Contrainte operator vérifiée (1 seule)
- [ ] Edge Function redéployée
- [ ] Logs vérifiés (pas d'erreur)
- [ ] Test Bug 1 passé
- [ ] Test Bug 2 passé
- [ ] Documentation lue
- [ ] Équipe informée

---

**🎯 Durée totale estimée** : 5 minutes  
**🔴 Priorité** : CRITIQUE  
**✅ Statut** : Prêt pour déploiement

---

📚 **Fichiers de référence** :
- `FIX_2_BUGS_CRITIQUES.md` - Documentation complète
- `test_subscription_extension.js` - Tests Bug 2
- `test_operator_constraint_fix.sql` - Tests Bug 1
- `SUMMARY_FIX_CONTRAINTE_OPERATOR.md` - Résumé Bug 1
