# 📱 Intégration Android - Validation SMS Automatique

**Date** : 5 janvier 2025  
**Plateforme** : Android (Kotlin)

---

## 📋 Structure du Projet Android

```
app/
├── src/
│   └── main/
│       ├── java/com/votre/app/
│       │   ├── receivers/
│       │   │   └── SmsReceiver.kt          ← Réception des SMS
│       │   ├── services/
│       │   │   └── PaymentValidationService.kt  ← Appel Edge Function
│       │   ├── utils/
│       │   │   └── NotificationHelper.kt   ← Notifications
│       │   └── models/
│       │       └── PaymentResponse.kt      ← Modèles de données
│       └── AndroidManifest.xml
└── build.gradle
```

---

## 🔧 Configuration

### 1. `build.gradle` (Module: app)

```gradle
dependencies {
    // OkHttp pour les requêtes HTTP
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    
    // Gson pour parser le JSON
    implementation 'com.google.code.gson:gson:2.10.1'
    
    // Coroutines (optionnel, pour async)
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
}
```

### 2. `AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.votre.app">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.RECEIVE_SMS" />
    <uses-permission android:name="android.permission.READ_SMS" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.App">

        <!-- BroadcastReceiver pour les SMS -->
        <receiver
            android:name=".receivers.SmsReceiver"
            android:exported="true"
            android:enabled="true">
            <intent-filter android:priority="1000">
                <action android:name="android.provider.Telephony.SMS_RECEIVED" />
            </intent-filter>
        </receiver>

        <!-- Autres activités... -->
        
    </application>

</manifest>
```

---

## 📄 Fichiers Kotlin

### 1. `models/PaymentResponse.kt`

```kotlin
package com.votre.app.models

import com.google.gson.annotations.SerializedName

data class PaymentResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("payment_id")
    val paymentId: String? = null,
    
    @SerializedName("user_id")
    val userId: String? = null,
    
    @SerializedName("amount")
    val amount: Double? = null,
    
    @SerializedName("tid")
    val tid: String? = null,
    
    @SerializedName("operator")
    val operator: String? = null,
    
    @SerializedName("subscription")
    val subscription: Subscription? = null,
    
    @SerializedName("error")
    val error: String? = null
)

data class Subscription(
    @SerializedName("subscriptionType")
    val subscriptionType: String,
    
    @SerializedName("expiresAt")
    val expiresAt: String
)
```

---

### 2. `services/PaymentValidationService.kt`

```kotlin
package com.votre.app.services

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import com.votre.app.models.PaymentResponse
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

class PaymentValidationService(private val context: Context) {
    
    companion object {
        private const val TAG = "PaymentValidation"
        
        // ⚠️ À REMPLACER par vos vraies valeurs
        private const val EDGE_FUNCTION_URL = "https://votre-projet.supabase.co/functions/v1/validate-transaction"
        private const val SECRET_KEY = "votre-cle-secrete"
    }
    
    private val client = OkHttpClient()
    private val gson = Gson()
    
    /**
     * Valider une transaction via l'Edge Function
     */
    fun validateTransaction(
        message: String,
        from: String,
        onSuccess: (PaymentResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        Log.d(TAG, "Validation de la transaction...")
        Log.d(TAG, "De: $from")
        Log.d(TAG, "Message: ${message.take(100)}...")
        
        // Construire le JSON
        val json = JSONObject().apply {
            put("message", message)
            put("from", from)
        }
        
        // Construire la requête
        val requestBody = json.toString().toRequestBody("application/json".toMediaType())
        
        val request = Request.Builder()
            .url(EDGE_FUNCTION_URL)
            .addHeader("Content-Type", "application/json")
            .addHeader("x-secret-key", SECRET_KEY)
            .post(requestBody)
            .build()
        
        // Exécuter la requête
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string()
                
                Log.d(TAG, "Code HTTP: ${response.code}")
                Log.d(TAG, "Réponse: $responseBody")
                
                if (responseBody == null) {
                    onError("Réponse vide du serveur")
                    return
                }
                
                try {
                    val paymentResponse = gson.fromJson(responseBody, PaymentResponse::class.java)
                    
                    if (paymentResponse.success) {
                        Log.d(TAG, "✅ Paiement validé avec succès!")
                        onSuccess(paymentResponse)
                    } else {
                        Log.w(TAG, "❌ Validation échouée: ${paymentResponse.error}")
                        onError(paymentResponse.error ?: "Erreur inconnue")
                    }
                    
                } catch (e: Exception) {
                    Log.e(TAG, "Erreur de parsing JSON", e)
                    onError("Erreur de parsing: ${e.message}")
                }
            }
            
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Erreur réseau", e)
                onError("Erreur réseau: ${e.message}")
            }
        })
    }
    
    /**
     * Vérifier si un SMS est un SMS de paiement
     */
    fun isPaymentSms(sender: String): Boolean {
        val lowerSender = sender.lowercase()
        
        return lowerSender.contains("airtel") ||
               lowerSender.contains("moov") ||
               lowerSender.contains("libertis") ||
               lowerSender.contains("money")
    }
}
```

---

### 3. `utils/NotificationHelper.kt`

```kotlin
package com.votre.app.utils

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.votre.app.R
import com.votre.app.activities.MainActivity

class NotificationHelper(private val context: Context) {
    
    companion object {
        private const val CHANNEL_ID = "payment_notifications"
        private const val NOTIFICATION_ID = 1001
    }
    
    init {
        createNotificationChannel()
    }
    
    /**
     * Créer le canal de notification (Android 8+)
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Paiements"
            val descriptionText = "Notifications de paiements confirmés"
            val importance = NotificationManager.IMPORTANCE_HIGH
            
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
            }
            
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    /**
     * Afficher une notification de succès
     */
    fun showPaymentSuccessNotification(
        amount: Double,
        subscriptionType: String,
        expiresAt: String
    ) {
        // Intent pour ouvrir l'app au clic
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )
        
        // Construire la notification
        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_payment_success) // ⚠️ Créer cette icône
            .setContentTitle("✅ Paiement confirmé!")
            .setContentText("${amount.toInt()} FCFA - Abonnement $subscriptionType activé")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(
                        "Votre paiement de ${amount.toInt()} FCFA a été confirmé.\n\n" +
                        "🎉 Abonnement $subscriptionType activé jusqu'au $expiresAt\n\n" +
                        "Profitez de toutes les fonctionnalités!"
                    )
            )
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setVibrate(longArrayOf(0, 500, 200, 500))
        
        // Afficher la notification
        with(NotificationManagerCompat.from(context)) {
            notify(NOTIFICATION_ID, builder.build())
        }
    }
    
    /**
     * Afficher une notification d'erreur
     */
    fun showPaymentErrorNotification(errorMessage: String) {
        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_payment_error) // ⚠️ Créer cette icône
            .setContentTitle("❌ Problème de paiement")
            .setContentText(errorMessage)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
        
        with(NotificationManagerCompat.from(context)) {
            notify(NOTIFICATION_ID + 1, builder.build())
        }
    }
}
```

---

### 4. `receivers/SmsReceiver.kt`

```kotlin
package com.votre.app.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log
import com.votre.app.services.PaymentValidationService
import com.votre.app.utils.NotificationHelper

class SmsReceiver : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "SmsReceiver"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "SMS reçu!")
        
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val bundle = intent.extras ?: return
            val pdus = bundle["pdus"] as? Array<*> ?: return
            
            for (pdu in pdus) {
                try {
                    val message = SmsMessage.createFromPdu(pdu as ByteArray)
                    val sender = message.displayOriginatingAddress ?: continue
                    val body = message.messageBody ?: continue
                    
                    Log.d(TAG, "De: $sender")
                    Log.d(TAG, "Message: ${body.take(50)}...")
                    
                    // Vérifier si c'est un SMS de paiement
                    val validationService = PaymentValidationService(context)
                    
                    if (validationService.isPaymentSms(sender)) {
                        Log.d(TAG, "✅ SMS de paiement détecté!")
                        handlePaymentSms(context, body, sender)
                    } else {
                        Log.d(TAG, "⏭️ Pas un SMS de paiement")
                    }
                    
                } catch (e: Exception) {
                    Log.e(TAG, "Erreur lors du traitement du SMS", e)
                }
            }
        }
    }
    
    /**
     * Traiter un SMS de paiement
     */
    private fun handlePaymentSms(context: Context, message: String, from: String) {
        val validationService = PaymentValidationService(context)
        val notificationHelper = NotificationHelper(context)
        
        // Valider la transaction via l'Edge Function
        validationService.validateTransaction(
            message = message,
            from = from,
            onSuccess = { response ->
                Log.d(TAG, "🎉 Paiement validé avec succès!")
                
                // Afficher une notification
                notificationHelper.showPaymentSuccessNotification(
                    amount = response.amount ?: 0.0,
                    subscriptionType = response.subscription?.subscriptionType ?: "basic",
                    expiresAt = formatDate(response.subscription?.expiresAt)
                )
                
                // Vous pouvez aussi :
                // - Envoyer un broadcast pour mettre à jour l'UI
                // - Stocker dans SharedPreferences
                // - Synchroniser avec Supabase
            },
            onError = { error ->
                Log.e(TAG, "❌ Erreur de validation: $error")
                
                // Ne pas notifier l'utilisateur pour toutes les erreurs
                // (ex: TID non trouvé = pas grave, l'utilisateur n'a peut-être pas encore créé de paiement)
                
                if (error.contains("Unauthorized") || error.contains("réseau")) {
                    notificationHelper.showPaymentErrorNotification(error)
                }
            }
        )
    }
    
    /**
     * Formater une date ISO en format lisible
     */
    private fun formatDate(isoDate: String?): String {
        if (isoDate == null) return "N/A"
        
        try {
            // Exemple simple (vous pouvez utiliser SimpleDateFormat pour plus de contrôle)
            return isoDate.substring(0, 10) // "2025-02-05"
        } catch (e: Exception) {
            return isoDate
        }
    }
}
```

---

## 🔐 Demander les Permissions

### Dans votre `MainActivity` ou lors du premier lancement :

```kotlin
class MainActivity : AppCompatActivity() {
    
    companion object {
        private const val REQUEST_SMS_PERMISSION = 100
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Demander la permission SMS
        checkSmsPermission()
    }
    
    private fun checkSmsPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS)
            != PackageManager.PERMISSION_GRANTED) {
            
            // Expliquer pourquoi la permission est nécessaire
            if (ActivityCompat.shouldShowRequestPermissionRationale(this, Manifest.permission.RECEIVE_SMS)) {
                AlertDialog.Builder(this)
                    .setTitle("Permission SMS")
                    .setMessage("Cette permission permet de valider automatiquement vos paiements Mobile Money dès réception du SMS de confirmation.")
                    .setPositiveButton("OK") { _, _ ->
                        requestSmsPermission()
                    }
                    .setNegativeButton("Annuler", null)
                    .show()
            } else {
                requestSmsPermission()
            }
        }
    }
    
    private fun requestSmsPermission() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.READ_SMS
            ),
            REQUEST_SMS_PERMISSION
        )
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == REQUEST_SMS_PERMISSION) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "✅ Permission SMS accordée", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "❌ Permission SMS refusée", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
```

---

## 🧪 Tests

### 1. Test en Local

Pour tester sans attendre de vrais SMS, vous pouvez utiliser ADB :

```bash
# Envoyer un SMS de test via ADB
adb emu sms send +22367000000 "Paiement confirme. Montant: 5000 FCFA. TID: TEST_AIRTEL_001"
```

### 2. Test avec Logcat

Suivre les logs en temps réel :

```bash
adb logcat | grep -E "SmsReceiver|PaymentValidation"
```

Vous devriez voir :

```
D/SmsReceiver: SMS reçu!
D/SmsReceiver: De: +22367000000
D/SmsReceiver: Message: Paiement confirme...
D/SmsReceiver: ✅ SMS de paiement détecté!
D/PaymentValidation: Validation de la transaction...
D/PaymentValidation: Code HTTP: 200
D/PaymentValidation: ✅ Paiement validé avec succès!
D/SmsReceiver: 🎉 Paiement validé avec succès!
```

---

## 📊 Monitoring

### Dashboard Supabase

Pour voir les transactions en temps réel :

```sql
-- Dans SQL Editor de Supabase
SELECT 
    p.tid_submitted,
    p.amount,
    p.operator,
    p.status,
    p.created_at,
    p.confirmed_at,
    EXTRACT(EPOCH FROM (p.confirmed_at - p.created_at)) as seconds_to_confirm
FROM payments p
WHERE p.confirmed_at IS NOT NULL
ORDER BY p.confirmed_at DESC
LIMIT 20;
```

---

## 🔒 Sécurité

### ⚠️ IMPORTANT : Ne jamais hardcoder la clé secrète

Au lieu de :

```kotlin
private const val SECRET_KEY = "votre-cle-secrete"  // ❌ MAUVAIS
```

Utilisez :

```kotlin
// Dans local.properties (NON versionné dans Git)
sms.secret.key=votre-cle-secrete

// Dans build.gradle
android {
    defaultConfig {
        // Lire depuis local.properties
        Properties properties = new Properties()
        properties.load(project.rootProject.file('local.properties').newDataInputStream())
        buildConfigField "String", "SMS_SECRET_KEY", "\"${properties.getProperty('sms.secret.key')}\""
    }
}

// Dans le code Kotlin
private val SECRET_KEY = BuildConfig.SMS_SECRET_KEY  // ✅ BON
```

---

## ✅ Checklist Finale

- [ ] Permissions ajoutées dans `AndroidManifest.xml`
- [ ] `OkHttp` et `Gson` ajoutés dans `build.gradle`
- [ ] Tous les fichiers Kotlin créés
- [ ] URL de l'Edge Function configurée
- [ ] Clé secrète configurée de manière sécurisée
- [ ] Permissions demandées au runtime
- [ ] Tests effectués avec ADB
- [ ] Logs vérifiés dans Logcat
- [ ] Notification testée
- [ ] Testé avec un vrai SMS (production)

---

## 🎉 Félicitations !

Votre intégration Android pour la validation automatique des paiements est **complète** !

**Date** : 5 janvier 2025  
**Statut** : ✅ **PRÊT POUR PRODUCTION**
