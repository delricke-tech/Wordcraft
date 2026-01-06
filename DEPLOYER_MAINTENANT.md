# 🚀 DÉPLOYER MAINTENANT - Guide Ultra-Rapide

**Temps total : 15 minutes**

---

## ⚡ COMMANDES À EXÉCUTER

### 1️⃣ SQL (3 min)

**Ouvrir** : https://supabase.com/dashboard/project/uexuecubafgfhpfebknt/sql/new

**Coller et exécuter** :

✅ Résultat attendu : `Success`

---

### 2️⃣ Edge Function (2 min)

**Ouvrir PowerShell** et exécuter :

```powershell
cd "C:\Users\HP I5\Downloads\project"
supabase functions deploy validate-transaction --no-verify-jwt
```

✅ Résultat attendu : `Deployed Functions on project...`

---

### 3️⃣ Application Web (5 min)

**Dans le même PowerShell** :

```powershell
git add .
git commit -m "feat: système abonnement complet avec essai gratuit"
git push origin main
```

✅ Vercel déploie automatiquement

---

### 4️⃣ Vérification (5 min)

**Test rapide** :

```powershell
.\test_edge_function.ps1
```

✅ Résultat attendu : Message de succès ou "No pending payment found" (normal)

---

## 🎯 RÉSULTAT

Après ces 4 étapes, votre application aura :

✅ **5 jours gratuits** pour tous les nouveaux utilisateurs  
✅ **Page d'abonnement** avec vos numéros Moov (+241 06 69 46 697 / +241 06 66 68 257)  
✅ **Tarifs** : 2000F (1 mois), 5000F (3 mois), 15000F (1 an)  
✅ **Validation automatique** des paiements via SMS  
✅ **Protection des pages** (redirection si expiré)

---

## 📱 PROCHAINE ÉTAPE

**Tester avec un vrai paiement** :

1. Créer un compte sur votre app
2. Attendre la fin des 5 jours (ou modifier en BDD pour tester)
3. Aller sur `/subscription`
4. Payer 100 FCFA pour tester
5. Entrer la Ref
6. ✅ Déblocage immédiat !

---

**C'EST TOUT ! 🎉**

Votre système d'abonnement est **OPÉRATIONNEL**.
