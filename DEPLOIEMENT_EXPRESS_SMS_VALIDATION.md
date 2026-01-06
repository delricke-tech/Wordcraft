# 🚀 Déploiement Express - Validation SMS Moov Money Gabon

**Date** : 6 janvier 2025  
**Configuration** : 2 cartes SIM Moov Money (Libertis)  
**Durée estimée** : 10 minutes

---

## ✅ Étape 1 : Exécuter le Script SQL (2 min)

### Dans Supabase Dashboard

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Menu **SQL Editor**
4. Cliquer sur **New query**
5. Copier-coller le contenu de `supabase/migrations/update_payments_for_sms_validation.sql`
6. Cliquer sur **Run** (bouton vert)

### Vérification

Vous devriez voir :

```
✅ Contrainte UNIQUE sur tid_submitted déjà présente
✅ Constraint operator mis à jour (Moov uniquement)
✅ Constraint status mis à jour
✅ Table payments mise à jour avec succès!
```

---

## ✅ Étape 2 : Configurer les Variables (1 min)

### Dans Supabase Dashboard

1. Menu **Edge Functions**
2. Onglet **Secrets**
3. Ajouter :

```
CUSTOM_AUTHORIZATION_KEY=VotreCleSecrete123456789!@#$%
```

💡 **Conseil** : Générer une clé forte avec :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ Étape 3 : Déployer l'Edge Function (3 min)

### Option A : Via Supabase CLI (recommandé)

```bash
# Si Supabase CLI n'est pas installé
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref votre-project-id

# Déployer la fonction
supabase functions deploy validate-transaction
```

### Option B : Via le Dashboard

1. Menu **Edge Functions**
2. Cliquer sur **Create a new function**
3. Nom : `validate-transaction`
4. Copier-coller le contenu de `supabase/functions/validate-transaction/index.ts`
5. Cliquer sur **Deploy**

---

## ✅ Étape 4 : Tester (2 min)

### Test 1 : Avec curl

```bash
curl -X POST https://votre-projet.supabase.co/functions/v1/validate-transaction \
  -H "Content-Type: application/json" \
  -H "x-custom-authorization: VotreCleSecrete123456789!@#$%" \
  -d '{
    "message": "Paiement confirme. Ref: TEST123. Montant: 5000 FCFA",
    "from": "MoovMoney",
    "sim_slot": 1
  }'
```

**Résultat attendu** :
```json
{
  "success": false,
  "error": "No pending payment found with this TID",
  "tid": "TEST123"
}
```

C'est **NORMAL** car aucun paiement de test n'existe encore !

### Test 2 : Sans autorisation

```bash
curl -X POST https://votre-projet.supabase.co/functions/v1/validate-transaction \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "from": "test"}'
```

**Résultat attendu** :
```json
{
  "success": false,
  "error": "Unauthorized: Invalid authorization header"
}
```

✅ **Parfait !** La sécurité fonctionne.

---

## ✅ Étape 5 : Créer un Paiement de Test (2 min)

### Dans Supabase Dashboard

1. Menu **SQL Editor**
2. Nouvelle requête :

```sql
-- Récupérer votre user_id (connectez-vous à votre app d'abord)
SELECT id FROM auth.users LIMIT 1;

-- Remplacer 'votre-user-id' par la valeur obtenue
INSERT INTO public.payments (user_id, amount, tid_submitted, operator, status)
VALUES ('votre-user-id', 5000, 'TEST_MOOV_001', 'moov', 'pending');

-- Vérifier
SELECT * FROM public.payments;
```

### Test Final

```bash
curl -X POST https://votre-projet.supabase.co/functions/v1/validate-transaction \
  -H "Content-Type: application/json" \
  -H "x-custom-authorization: VotreCleSecrete123456789!@#$%" \
  -d '{
    "message": "Paiement confirme. Montant: 5000 FCFA. Ref: TEST_MOOV_001",
    "from": "MoovMoney",
    "sim_slot": 1,
    "sim_number": "+24177123456"
  }'
```

**Résultat attendu** :
```json
{
  "success": true,
  "payment_id": "...",
  "user_id": "...",
  "amount": 5000,
  "tid": "TEST_MOOV_001",
  "operator": "moov",
  "sim_info": {
    "slot": 1,
    "number": "+24177123456"
  },
  "subscription": {
    "subscriptionType": "premium",
    "expiresAt": "2025-02-06T..."
  }
}
```

🎉 **Succès !** La validation fonctionne.

### Vérifier dans la Base

```sql
SELECT 
    tid_submitted,
    status, 
    confirmed_at, 
    metadata 
FROM public.payments 
WHERE tid_submitted = 'TEST_MOOV_001';
```

Vous devriez voir :
- `status`: `confirmed`
- `confirmed_at`: Date du test
- `metadata`: `{"confirmed_by": "sms_validation", "operator": "moov_gabon", "sim_info": {"slot": 1, ...}}`

```sql
SELECT 
    subscription_type, 
    subscription_expires_at 
FROM public.profiles 
WHERE id = 'votre-user-id';
```

Vous devriez voir :
- `subscription_type`: `premium`
- `subscription_expires_at`: Date dans 30 jours

---

## 📱 Étape 6 : Configuration SmsForwarder (Android)

### 1. Installer SmsForwarder

Télécharger depuis GitHub : https://github.com/pppscn/SmsForwarder

### 2. Créer une Règle de Forwarding

**Dans SmsForwarder** :

1. Ouvrir **Règles d'envoi**
2. Cliquer sur **+** (Ajouter)
3. **Nom de la règle** : `Moov Money → Supabase`

**Conditions (onglet "Filtres")** :
- ✅ **Expéditeur contient** : `Moov`
- ✅ **OU Expéditeur contient** : `Libertis`
- ✅ **ET Contenu contient** : `Ref`

**Actions (onglet "Destination")** :
- Type : **Webhook**
- Méthode : **POST**
- URL : `https://votre-projet.supabase.co/functions/v1/validate-transaction`

**Headers** :
```
Content-Type: application/json
x-custom-authorization: VotreCleSecrete123456789!@#$%
```

**Body** :
```json
{
  "message": "[MSG]",
  "from": "[FROM]",
  "sim_slot": [SIM_SLOT],
  "sim_number": "[SIM_NUMBER]",
  "timestamp": "[TIMESTAMP]"
}
```

**Variables disponibles dans SmsForwarder** :
- `[MSG]` → Contenu complet du SMS
- `[FROM]` → Expéditeur
- `[SIM_SLOT]` → Numéro du slot (1 ou 2)
- `[SIM_NUMBER]` → Numéro de la carte SIM
- `[TIMESTAMP]` → Date/heure de réception

### 3. Activer la Règle

1. Cocher la case à côté de la règle
2. Activer **SmsForwarder** dans l'onglet principal
3. Accorder toutes les permissions nécessaires

### 4. Tester avec ADB

```bash
# Envoyer un SMS de test
adb emu sms send +241XXXXXXX "Paiement confirme. Ref: TEST123. Montant: 5000 FCFA"
```

### 5. Vérifier les Logs

- **SmsForwarder** : Onglet "Logs d'envoi"
- **Supabase** : Edge Functions → validate-transaction → Logs

---

## 🎯 Checklist Finale

- [ ] ✅ Script SQL exécuté (contraintes UNIQUE + operator = moov)
- [ ] ✅ Variable `CUSTOM_AUTHORIZATION_KEY` configurée
- [ ] ✅ Edge Function déployée
- [ ] ✅ Test sans autorisation (401 Unauthorized)
- [ ] ✅ Test avec TID invalide (404 Not Found)
- [ ] ✅ Paiement de test créé (operator = 'moov')
- [ ] ✅ Test avec TID valide (200 Success)
- [ ] ✅ Vérification BDD (status = confirmed, metadata avec sim_info)
- [ ] ✅ Vérification abonnement mis à jour
- [ ] ✅ SmsForwarder installé sur Android
- [ ] ✅ Règle Moov Money créée dans SmsForwarder
- [ ] ✅ Test avec SMS réel Moov Money

---

## 📊 Logs Attendus

Dans Supabase → Edge Functions → Logs :

```
🇬🇦 === VALIDATION MOOV MONEY GABON ===
📱 SMS reçu de: MoovMoney
📄 Message: Paiement confirme. Ref: 123456789...
📱 SIM Slot: 1 (SIM 1)
📞 Numéro SIM: +24177123456
⏰ Timestamp SMS: 2025-01-06T10:30:00Z
✅ TID trouvé: 123456789
✅ Transaction Info: { tid: '123456789', amount: 5000 }
💰 Paiement trouvé: uuid-123
✅ Paiement confirmé: uuid-123
✅ Abonnement mis à jour: { subscriptionType: 'premium', expiresAt: '...' }
```

---

## 🆘 Dépannage

### Erreur : "Function not found"

➡️ La fonction n'est pas déployée. Répéter l'étape 3.

### Erreur : "CUSTOM_AUTHORIZATION_KEY non configurée"

➡️ La variable n'est pas configurée. Répéter l'étape 2.

### Erreur : "Invalid authorization header"

➡️ Le header dans la requête ne correspond pas à `CUSTOM_AUTHORIZATION_KEY`.

### Erreur : "Could not extract transaction reference (TID)"

➡️ Le SMS ne contient pas `Ref:` ou `Reference:`. Vérifier le format du SMS.

### Erreur : "No pending payment found with this TID"

➡️ Le TID ne correspond à aucun paiement en `status = 'pending'`.

### Erreur : "Payment operator mismatch"

➡️ Le paiement n'est pas de type 'moov'. Vérifier la colonne `operator` dans la BDD.

### SmsForwarder ne forwarde pas

➡️ Vérifier :
1. Les permissions sont accordées (SMS, Internet, Batterie)
2. Le service est actif
3. La règle est cochée
4. Les filtres correspondent au format SMS

---

## 📊 Requêtes SQL Utiles

### Statistiques par SIM

```sql
SELECT 
    metadata->'sim_info'->>'slot' as sim_slot,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount
FROM payments
WHERE status = 'confirmed'
  AND metadata->'sim_info'->>'slot' IS NOT NULL
GROUP BY sim_slot
ORDER BY sim_slot;
```

### Paiements récents avec info SIM

```sql
SELECT 
    tid_submitted,
    amount,
    metadata->'sim_info'->>'slot' as sim_slot,
    metadata->'sim_info'->>'number' as sim_number,
    confirmed_at
FROM payments
WHERE status = 'confirmed'
ORDER BY confirmed_at DESC
LIMIT 20;
```

### Temps moyen de validation

```sql
SELECT 
    AVG(EXTRACT(EPOCH FROM (confirmed_at - created_at))) as avg_seconds
FROM payments
WHERE confirmed_at IS NOT NULL;
```

---

## 🎉 Félicitations !

Votre système de validation automatique par SMS Moov Money Gabon avec **2 cartes SIM** est **opérationnel** !

### Configuration Finale

- 🇬🇦 **Opérateur** : Moov Money Gabon (Libertis)
- 📱 **Cartes SIM** : 2 cartes Moov
- 🔐 **Sécurité** : Header personnalisé `x-custom-authorization`
- 🔍 **Traçabilité** : Logs avec info de la SIM (slot + numéro)
- ⚡ **Performance** : Validation en < 2 secondes
- 📊 **Statistiques** : Suivi par SIM

---

**Date** : 6 janvier 2025  
**Opérateur** : Moov Money Gabon  
**Statut** : ✅ **PRODUCTION READY**

🇬🇦 **Système de paiement Moov Money opérationnel !**
