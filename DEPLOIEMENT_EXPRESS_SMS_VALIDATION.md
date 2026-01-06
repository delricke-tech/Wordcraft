# 🚀 Déploiement Express - Validation SMS

**Date** : 5 janvier 2025  
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
✅ Table payments mise à jour avec succès!
total_payments: 0
pending_payments: 0
confirmed_payments: 0
```

---

## ✅ Étape 2 : Configurer les Variables (1 min)

### Dans Supabase Dashboard

1. Menu **Edge Functions**
2. Onglet **Secrets**
3. Ajouter :

```
SMS_SECRET_KEY=VotreCleSecrete123456789!@#$%
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
  -H "x-secret-key: VotreCleSecrete123456789!@#$%" \
  -d '{
    "message": "Paiement confirme. TID: TEST123",
    "from": "AirtelMoney"
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

### Test 2 : Sans clé secrète

```bash
curl -X POST https://votre-projet.supabase.co/functions/v1/validate-transaction \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "from": "test"}'
```

**Résultat attendu** :
```json
{
  "success": false,
  "error": "Unauthorized: Invalid secret key"
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
VALUES ('votre-user-id', 5000, 'TEST_AIRTEL_001', 'airtel', 'pending');

-- Vérifier
SELECT * FROM public.payments;
```

### Test Final

```bash
curl -X POST https://votre-projet.supabase.co/functions/v1/validate-transaction \
  -H "Content-Type: application/json" \
  -H "x-secret-key: VotreCleSecrete123456789!@#$%" \
  -d '{
    "message": "Paiement confirme. Montant: 5000 FCFA. TID: TEST_AIRTEL_001",
    "from": "AirtelMoney"
  }'
```

**Résultat attendu** :
```json
{
  "success": true,
  "payment_id": "...",
  "user_id": "...",
  "amount": 5000,
  "tid": "TEST_AIRTEL_001",
  "operator": "airtel",
  "subscription": {
    "subscriptionType": "premium",
    "expiresAt": "2025-02-05T..."
  }
}
```

🎉 **Succès !** La validation fonctionne.

### Vérifier dans la Base

```sql
SELECT 
    status, 
    confirmed_at, 
    metadata 
FROM public.payments 
WHERE tid_submitted = 'TEST_AIRTEL_001';
```

Vous devriez voir :
- `status`: `confirmed`
- `confirmed_at`: Date du test
- `metadata`: `{"confirmed_by": "sms_validation"}`

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

## 📱 Étape 6 : Intégration Android (BONUS)

### Fichier `SmsReceiver.kt`

```kotlin
class SmsReceiver : BroadcastReceiver() {
    
    companion object {
        private const val EDGE_FUNCTION_URL = "https://votre-projet.supabase.co/functions/v1/validate-transaction"
        private const val SECRET_KEY = "VotreCleSecrete123456789!@#$%"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val bundle = intent.extras ?: return
            val pdus = bundle["pdus"] as Array<*>
            
            for (pdu in pdus) {
                val message = SmsMessage.createFromPdu(pdu as ByteArray)
                val sender = message.displayOriginatingAddress
                val body = message.messageBody
                
                // Filtrer les SMS de paiement
                if (isPaymentSms(sender)) {
                    validateTransaction(body, sender)
                }
            }
        }
    }
    
    private fun isPaymentSms(sender: String): Boolean {
        val lowerSender = sender.lowercase()
        return lowerSender.contains("airtel") ||
               lowerSender.contains("moov") ||
               lowerSender.contains("libertis")
    }
    
    private fun validateTransaction(message: String, from: String) {
        val client = OkHttpClient()
        val json = JSONObject().apply {
            put("message", message)
            put("from", from)
        }
        
        val request = Request.Builder()
            .url(EDGE_FUNCTION_URL)
            .addHeader("Content-Type", "application/json")
            .addHeader("x-secret-key", SECRET_KEY)
            .post(json.toString().toRequestBody("application/json".toMediaType()))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                val body = response.body?.string()
                Log.d("SmsReceiver", "Response: $body")
                
                if (response.isSuccessful) {
                    // Notifier l'utilisateur
                    showSuccessNotification("Paiement confirmé !")
                }
            }
            
            override fun onFailure(call: Call, e: IOException) {
                Log.e("SmsReceiver", "Error: ${e.message}")
            }
        })
    }
}
```

---

## 🎯 Checklist Finale

- [ ] ✅ Script SQL exécuté
- [ ] ✅ Variable `SMS_SECRET_KEY` configurée
- [ ] ✅ Edge Function déployée
- [ ] ✅ Test sans clé (401 Unauthorized)
- [ ] ✅ Test avec TID invalide (404 Not Found)
- [ ] ✅ Paiement de test créé
- [ ] ✅ Test avec TID valide (200 Success)
- [ ] ✅ Vérification BDD (status = confirmed)
- [ ] ✅ Vérification abonnement mis à jour

---

## 📊 Logs

Pour voir les logs en temps réel :

1. Menu **Edge Functions**
2. Cliquer sur `validate-transaction`
3. Onglet **Logs**

Vous verrez :
```
📱 SMS reçu de: AirtelMoney
📄 Message: Paiement confirme...
✅ Transaction Info: {...}
💰 Paiement trouvé: ...
✅ Paiement confirmé: ...
✅ Abonnement mis à jour: {...}
```

---

## 🆘 Dépannage

### Erreur : "Function not found"

➡️ La fonction n'est pas déployée. Répéter l'étape 3.

### Erreur : "SMS_SECRET_KEY non configurée"

➡️ La variable n'est pas configurée. Répéter l'étape 2.

### Erreur : "Invalid key"

➡️ La clé dans le header ne correspond pas à `SMS_SECRET_KEY`.

### Aucun paiement trouvé

➡️ Le TID ne correspond à aucun paiement en `status = 'pending'`.

### Erreur SQL

➡️ Le script SQL n'a pas été exécuté correctement. Répéter l'étape 1.

---

## 🎉 Félicitations !

Votre système de validation automatique par SMS est **opérationnel** !

### Prochaines Étapes

1. ✅ Tester avec de vrais SMS sur Android
2. ✅ Ajuster les regex si nécessaire
3. ✅ Implémenter les notifications utilisateur
4. ✅ Monitorer les logs en production
5. ✅ Ajouter des statistiques de paiements

---

**Date** : 5 janvier 2025  
**Statut** : ✅ **PRODUCTION READY**
