# 📧 CONFIGURATION EMAILS SUPABASE - GUIDE COMPLET

## ⚠️ IMPORTANT
La configuration des emails Supabase ne peut PAS se faire via SQL.
Elle doit être faite via le Dashboard Supabase (interface web).

---

## 🎯 GUIDE ÉTAPE PAR ÉTAPE (5 MINUTES)

### ÉTAPE 1 : Ouvrir Supabase Dashboard

1. Allez sur : **https://app.supabase.com**
2. Connectez-vous
3. Sélectionnez votre projet **WordCraft**

---

### ÉTAPE 2 : Configuration des URLs

#### Navigation :
```
Cliquez sur : Authentication (menu gauche)
             ↓
             URL Configuration
```

#### Valeurs à configurer :

##### Site URL
```
http://localhost:5173
```

**En production, changez pour** :
```
https://votre-domaine.com
```

##### Redirect URLs (cliquez "Add URL" pour chaque ligne)
```
http://localhost:5173/**
http://localhost:5173/reset-password
http://localhost:5173/login
http://localhost:5173/dashboard
```

**En production, ajoutez également** :
```
https://votre-domaine.com/**
https://votre-domaine.com/reset-password
https://votre-domaine.com/login
https://votre-domaine.com/dashboard
```

#### Screenshot de ce que vous devez voir :
```
┌─────────────────────────────────────────────────┐
│ URL Configuration                               │
├─────────────────────────────────────────────────┤
│ Site URL                                        │
│ http://localhost:5173                           │
│                                                 │
│ Redirect URLs                                   │
│ • http://localhost:5173/**                      │
│ • http://localhost:5173/reset-password          │
│ • http://localhost:5173/login                   │
│ • http://localhost:5173/dashboard               │
│ [+ Add URL]                                     │
└─────────────────────────────────────────────────┘
```

**Cliquez "Save" en bas de page ✅**

---

### ÉTAPE 3 : Configuration du Template Email

#### Navigation :
```
Cliquez sur : Authentication (menu gauche)
             ↓
             Email Templates
             ↓
             Reset Password (ou "Confirm signup")
```

#### Template HTML à copier-coller :

**Pour "Reset Password"** :

```html
<h2>Réinitialiser votre mot de passe</h2>
<p>Bonjour,</p>
<p>Vous avez demandé la réinitialisation de votre mot de passe WordCraft.</p>
<p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #1559d8; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Réinitialiser mon mot de passe</a></p>
<p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure.</p>
<p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
<p>L'équipe WordCraft</p>
```

#### Confirmation URL (dans le même template) :

**IMPORTANT : Vérifiez que cette ligne est présente dans "Confirmation URL"** :
```
{{ .SiteURL }}/reset-password?token={{ .Token }}&type=recovery
```

**OU utilisez simplement** (plus simple) :
```
{{ .ConfirmationURL }}
```

#### Screenshot de ce que vous devez voir :
```
┌─────────────────────────────────────────────────┐
│ Email Templates > Reset Password                │
├─────────────────────────────────────────────────┤
│ Subject                                         │
│ Réinitialiser votre mot de passe               │
│                                                 │
│ Message (HTML)                                  │
│ <h2>Réinitialiser votre mot de passe</h2>     │
│ <p>Bonjour,</p>                                │
│ <p>Vous avez demandé la réinitialisation...   │
│ ...                                             │
│                                                 │
│ Confirmation URL                                │
│ {{ .ConfirmationURL }}                         │
└─────────────────────────────────────────────────┘
```

**Cliquez "Save" en bas de page ✅**

---

## 🎨 TEMPLATE EMAIL PROFESSIONNEL (OPTIONNEL)

Si vous voulez un email plus joli, utilisez ce template :

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #152554 0%, #0B1623 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">🧠 WordCraft</h1>
  </div>
  
  <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h2 style="color: #152554; margin-top: 0;">Réinitialiser votre mot de passe</h2>
    
    <p>Bonjour,</p>
    
    <p>Vous avez demandé la réinitialisation de votre mot de passe WordCraft.</p>
    
    <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; 
                padding: 16px 32px; 
                background: linear-gradient(90deg, #1559d8 0%, #217cf3 100%); 
                color: white; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 4px 12px rgba(21, 89, 216, 0.3);">
        Réinitialiser mon mot de passe
      </a>
    </div>
    
    <div style="background: #f8f9fa; border-left: 4px solid #1559d8; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #666; font-size: 14px;">
        ⏰ <strong>Ce lien expire dans 1 heure</strong>
      </p>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe restera inchangé.
    </p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; text-align: center;">
      Vous recevez cet email car vous avez un compte sur WordCraft.<br>
      © 2026 WordCraft - Plateforme d'apprentissage intelligente
    </p>
  </div>
</body>
</html>
```

---

## 🧪 TESTER LA CONFIGURATION

### Test 1 : Vérifier la configuration

1. Dans Supabase Dashboard
2. Authentication → URL Configuration
3. ✅ Vérifiez que tout est sauvegardé
4. Authentication → Email Templates
5. ✅ Vérifiez que le template est configuré

### Test 2 : Tester l'envoi d'email

1. Lancez votre app : `npm run dev`
2. Allez sur : `http://localhost:5173/login`
3. Cliquez "Mot de passe oublié ?"
4. Entrez votre email
5. Cliquez "Envoyer le lien"
6. ✅ Vérifiez votre boîte mail
7. ✅ Cliquez sur le lien dans l'email
8. ✅ Vous devez arriver sur `/reset-password`

---

## 📧 CONFIGURATION SMTP (OPTIONNEL)

Par défaut, Supabase utilise son propre service d'email.

**Pour utiliser votre propre serveur SMTP** :

#### Navigation :
```
Settings (menu gauche)
  ↓
Auth
  ↓
SMTP Settings
```

#### Configuration SMTP (exemple Gmail) :

```
Enable Custom SMTP: ✅ Activé

SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: votre-email@gmail.com
SMTP Password: votre-mot-de-passe-application
Sender Email: votre-email@gmail.com
Sender Name: WordCraft

Enable SSL: ✅ Activé
```

**Note** : Pour Gmail, vous devez créer un "mot de passe d'application" :
1. Compte Google → Sécurité
2. Validation en deux étapes (activez-la)
3. Mots de passe d'application
4. Générez un mot de passe pour "Mail"

---

## ⚠️ PROBLÈMES COURANTS

### Problème 1 : Email non reçu

**Causes** :
- ❌ URL Configuration incorrecte
- ❌ Email dans spam
- ❌ Rate limiting (trop de tentatives)

**Solutions** :
- ✅ Vérifiez URL Configuration
- ✅ Vérifiez dossier spam
- ✅ Attendez 1 minute entre chaque tentative

---

### Problème 2 : Lien invalide

**Causes** :
- ❌ Redirect URL manquante
- ❌ Lien expiré (> 1h)
- ❌ Token déjà utilisé

**Solutions** :
- ✅ Ajoutez `/reset-password` dans Redirect URLs
- ✅ Demandez un nouveau lien
- ✅ Chaque lien ne fonctionne qu'une fois

---

### Problème 3 : Redirection échoue

**Causes** :
- ❌ Site URL incorrect
- ❌ Serveur dev non lancé

**Solutions** :
- ✅ Site URL = `http://localhost:5173`
- ✅ Lancez `npm run dev`

---

## 📋 CHECKLIST FINALE

Avant de tester, vérifiez :

### Dans Supabase Dashboard

- [ ] Authentication → URL Configuration
  - [ ] Site URL configuré
  - [ ] Redirect URLs ajoutées (au moins `/reset-password`)
  - [ ] ✅ Sauvegardé

- [ ] Authentication → Email Templates
  - [ ] Template "Reset Password" configuré
  - [ ] {{ .ConfirmationURL }} présent
  - [ ] ✅ Sauvegardé

### Dans votre application

- [ ] npm run dev lancé
- [ ] http://localhost:5173 accessible
- [ ] Page /login fonctionne
- [ ] Page /forgot-password fonctionne
- [ ] Page /reset-password fonctionne

---

## 🎯 RÉSUMÉ DES VALEURS À CONFIGURER

### URL Configuration
```
Site URL:
http://localhost:5173

Redirect URLs:
http://localhost:5173/**
http://localhost:5173/reset-password
http://localhost:5173/login
http://localhost:5173/dashboard
```

### Email Template (Reset Password)
```
Subject:
Réinitialiser votre mot de passe

Confirmation URL:
{{ .ConfirmationURL }}

Message:
(Utilisez un des templates HTML fournis ci-dessus)
```

---

## ✅ APRÈS CONFIGURATION

1. **Sauvegardez** toutes les modifications
2. **Redémarrez** votre application si nécessaire
3. **Testez** le processus complet
4. **✅ Ça fonctionne !**

---

## 💡 ASTUCE

**Copiez ce fichier** et gardez-le comme référence.

**Si vous changez de domaine** (passage en production), vous devrez :
1. Changer Site URL
2. Ajouter les nouvelles Redirect URLs
3. Tester à nouveau

---

**Temps total : 5-10 minutes** ⏱️

**Difficulté : Facile** ⭐

**Documentation officielle** : https://supabase.com/docs/guides/auth/auth-email-templates
