# ⚡ GUIDE EXPRESS - CONFIGURATION EMAILS (2 MINUTES)

## 🎯 VALEURS À COPIER-COLLER

### 1. URL Configuration

**Allez dans** : `Authentication` → `URL Configuration`

**Site URL** :
```
http://localhost:5173
```

**Redirect URLs** (cliquez "+ Add URL" pour chaque) :
```
http://localhost:5173/**
http://localhost:5173/reset-password
http://localhost:5173/login
```

**✅ Cliquez "Save"**

---

### 2. Email Templates

**Allez dans** : `Authentication` → `Email Templates` → `Reset Password`

**Subject** :
```
Réinitialiser votre mot de passe
```

**Confirmation URL** :
```
{{ .ConfirmationURL }}
```

**Message (HTML)** :
```html
<h2>Réinitialiser votre mot de passe</h2>
<p>Bonjour,</p>
<p>Vous avez demandé la réinitialisation de votre mot de passe WordCraft.</p>
<p>Cliquez sur le lien ci-dessous :</p>
<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
<p>Ce lien expire dans 1 heure.</p>
<p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
```

**✅ Cliquez "Save"**

---

## ✅ C'EST TOUT !

**Testez maintenant** :
1. Allez sur `/login`
2. Cliquez "Mot de passe oublié ?"
3. Entrez votre email
4. Vérifiez votre boîte mail
5. Cliquez sur le lien
6. ✅ Changez votre mot de passe !

---

**Temps : 2 minutes** ⏱️
