# 🧪 Guide de Test Complet - Validation SMS Moov Money

**Date**: 6 janvier 2025  
**Système**: Validation automatique des paiements via SMS

---

## 📋 Checklist Avant de Tester

- [x] Edge Function `validate-transaction` déployée
- [x] SmsForwarder configuré avec le bon JSON
- [ ] Variable `CUSTOM_AUTH_KEY` configurée dans Supabase
- [ ] Paiement de test créé dans la base de données

---

## 🔐 ÉTAPE 1 : Configurer la Clé Secrète dans Supabase

### 1.1 Aller sur Supabase Dashboard

URL: https://supabase.com/dashboard/project/uexuecubafgfhpfebknt/settings/functions

### 1.2 Ajouter le Secret

1. Cliquez sur **"Add new secret"** ou **"Manage secrets"**
2. Remplissez :
   - **Name**: `CUSTOM_AUTH_KEY`
   - **Value**: `Kj9mP2xR5wN8tL4vC6bQ1zX7hG3fY0sA`
3. Cliquez sur **"Save"**

### 1.3 Vérifier

Vous devriez voir dans la liste des secrets :
```
CUSTOM_AUTH_KEY = Kj9mP2xR5wN8tL4vC6bQ1zX7hG3fY0sA
```

---

## 💾 ÉTAPE 2 : Créer un Paiement de Test

### 2.1 Ouvrir SQL Editor dans Supabase

URL: https://supabase.com/dashboard/project/uexuecubafgfhpfebknt/sql/new

### 2.2 Copier-Coller ce Script

```sql
-- Créer un paiement de test
DO $$
DECLARE
    test_user_id UUID;
    test_payment_id UUID;
BEGIN
    -- Récupérer le premier utilisateur
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'Aucun utilisateur trouvé. Créez un compte d''abord.';
    END IF;
    
    -- Créer le paiement
    INSERT INTO public.payments (
        user_id,
        amount,
        tid_submitted,
        operator,
        status
    ) VALUES (
        test_user_id,
        5000,
        '123456789',
        'moov',
        'pending'
    ) RETURNING id INTO test_payment_id;
    
    RAISE NOTICE '✅ Paiement créé! TID: 123456789';
END $$;
```

### 2.3 Exécuter (bouton "Run")

Vous devriez voir :
```
✅ Paiement créé! TID: 123456789
```

---

## 📱 ÉTAPE 3 : Tester avec SmsForwarder

### 3.1 Option A : Test Manuel dans SmsForwarder

1. Ouvrez **SmsForwarder**
2. Allez dans **"Règles d'expédition"**
3. Trouvez votre règle (celle avec l'URL Supabase)
4. Cliquez sur **"Tester"** ou **"Test"**
5. Dans le champ message, entrez :
   ```
   Paiement confirmé. Montant: 5000 FCFA. Ref: 123456789. Merci d'utiliser Moov Money.
   ```
6. Cliquez sur **"Envoyer le test"**

### 3.2 Option B : Simuler un SMS (ADB)

Si vous avez ADB configuré :

```bash
adb shell am broadcast -a android.provider.Telephony.SMS_RECEIVED --es pdus "00" --es sender "MoovMoney" --es message "Paiement confirme. Montant: 5000 FCFA. Ref: 123456789"
```

### 3.3 Option C : SMS Réel

Envoyez-vous un SMS contenant :
```
Paiement confirmé
Montant: 5000 FCFA
Ref: 123456789
Service: WordCraft
```

---

## 📊 ÉTAPE 4 : Vérifier les Logs

### 4.1 Logs de l'Edge Function

**URL**: https://supabase.com/dashboard/project/uexuecubafgfhpfebknt/logs/edge-functions

**Ce que vous devriez voir** (si succès) :

```
📩 Requête reçue: { message: "...", from: "...", auth_key: "..." }
✅ Autorisation validée
📱 Message de: MoovMoney
📝 Contenu: Paiement confirme...
✅ TID extrait: 123456789
💰 Montant SMS: 5000 FCFA
✅ Paiement trouvé: <uuid>
✅ Paiement confirmé: <uuid>
📅 Extension: 30 jours ajoutés
✅ Abonnement mis à jour: premium jusqu'au 2025-02-05T...
```

### 4.2 Logs de SmsForwarder

Dans SmsForwarder → **Onglet "Logs"** :

**Succès** :
```
✅ 200 OK
{ "success": true, "payment_id": "...", "tid": "123456789" }
```

**Erreur d'authentification** :
```
❌ 401 Unauthorized
```

**Erreur TID non trouvé** :
```
❌ 404 Not Found
{ "success": false, "error": "No pending payment found" }
```

---

## 🔍 ÉTAPE 5 : Vérifier dans la Base de Données

### 5.1 Vérifier le Paiement

Dans SQL Editor :

```sql
SELECT 
    tid_submitted,
    amount,
    status,
    confirmed_at,
    metadata
FROM public.payments
WHERE tid_submitted = '123456789';
```

**Résultat attendu** :
```
tid_submitted | amount | status    | confirmed_at        | metadata
123456789     | 5000   | confirmed | 2025-01-06 12:30... | {"confirmed_by": "sms_validation", ...}
```

### 5.2 Vérifier l'Abonnement

```sql
SELECT 
    id,
    subscription_type,
    subscription_expires_at
FROM public.profiles
WHERE id = (SELECT user_id FROM payments WHERE tid_submitted = '123456789');
```

**Résultat attendu** :
```
subscription_type | subscription_expires_at
premium           | 2025-02-05 12:30:00+00
```

---

## ❌ Résolution de Problèmes

### Erreur 401 "Unauthorized"

**Cause** : La clé secrète ne correspond pas

**Solution** :
1. Vérifier que `CUSTOM_AUTH_KEY` est bien configurée dans Supabase
2. Vérifier que le JSON dans SmsForwarder contient exactement :
   ```json
   "auth_key":"Kj9mP2xR5wN8tL4vC6bQ1zX7hG3fY0sA"
   ```

### Erreur "No pending payment found"

**Cause** : Aucun paiement avec ce TID ou déjà confirmé

**Solution** :
1. Vérifier que le paiement existe :
   ```sql
   SELECT * FROM payments WHERE tid_submitted = '123456789';
   ```
2. Si `status = 'confirmed'`, créer un nouveau paiement avec un autre TID (ex: '987654321')

### Le SMS n'est pas intercepté

**Cause** : Permissions SMS manquantes ou règle SmsForwarder incorrecte

**Solution** :
1. Vérifier les permissions SMS dans Android
2. Vérifier la règle dans SmsForwarder :
   - Expéditeur contient : `Moov` OU `Libertis`
   - Contenu contient : `Ref`

### Aucun log dans Supabase

**Cause** : La requête n'arrive pas à l'Edge Function

**Solution** :
1. Vérifier l'URL dans SmsForwarder :
   ```
   https://uexuecubafgfhpfebknt.supabase.co/functions/v1/validate-transaction
   ```
2. Vérifier la connexion Internet du téléphone
3. Tester manuellement avec curl :
   ```bash
   curl -X POST https://uexuecubafgfhpfebknt.supabase.co/functions/v1/validate-transaction \
     -H "Content-Type: application/json" \
     -d '{"message":"Ref: 123456789","from":"MoovMoney","auth_key":"Kj9mP2xR5wN8tL4vC6bQ1zX7hG3fY0sA"}'
   ```

---

## ✅ Critères de Succès

Votre test est réussi si :

1. ✅ Le paiement passe de `pending` à `confirmed`
2. ✅ Le champ `confirmed_at` est rempli
3. ✅ Le profil utilisateur a `subscription_type = 'premium'`
4. ✅ La date `subscription_expires_at` est dans ~30 jours
5. ✅ Les logs Supabase montrent "✅ Abonnement mis à jour"
6. ✅ SmsForwarder montre "200 OK"

---

## 🔄 Nettoyer les Données de Test

Après vos tests, vous pouvez supprimer le paiement de test :

```sql
DELETE FROM public.payments WHERE tid_submitted = '123456789';
```

---

## 🎯 Prochaines Étapes

Une fois le test réussi :

1. **Créer de vrais paiements** depuis votre application web/mobile
2. **Effectuer de vrais paiements** Moov Money
3. **Surveiller les logs** pour les premières transactions réelles
4. **Documenter** les formats de SMS reçus (pour améliorer la regex si nécessaire)

---

## 📞 Support

**Logs Edge Function** : https://supabase.com/dashboard/project/uexuecubafgfhpfebknt/logs/edge-functions

**SQL Editor** : https://supabase.com/dashboard/project/uexuecubafgfhpfebknt/sql/new

**Clé Secrète** : `Kj9mP2xR5wN8tL4vC6bQ1zX7hG3fY0sA`

**TID de Test** : `123456789`

---

**Date** : 6 janvier 2025  
**Statut** : ✅ **PRÊT POUR TEST**

🎉 **Bonne chance avec vos tests !**
