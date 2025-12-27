# Configuration Supabase pour le Développement

## 🚫 Problème : Pas de réception d'emails de vérification

Si vous ne recevez pas les emails de vérification lors de l'inscription, suivez ce guide.

---

## 📋 Solution 1 : Désactiver la confirmation email (Développement)

### Étapes dans le Dashboard Supabase

1. **Accéder aux paramètres d'authentification**
   ```
   Dashboard Supabase
   └─> Votre Projet
       └─> Authentication (dans le menu latéral)
           └─> Providers (onglet)
               └─> Email
   ```

2. **Désactiver la confirmation email**
   - Cliquez sur **"Email"** dans la liste des providers
   - Décochez **"Confirm email"** ou **"Enable email confirmations"**
   - Cliquez sur **"Save"** / **"Enregistrer"**

3. **Paramètres recommandés pour le développement**
   ```
   ✅ Enable email provider: ON
   ❌ Confirm email: OFF
   ✅ Enable auto-confirm: ON (si disponible)
   ```

### Résultat

- ✅ L'utilisateur est **immédiatement connecté** après l'inscription
- ✅ Pas besoin de vérifier l'email
- ✅ Redirection directe vers `/library`
- ⚠️ **À utiliser uniquement en développement**

---

## 📋 Solution 2 : Configurer l'envoi d'emails (Production)

### Option A : Utiliser les emails Supabase (Limité)

**Par défaut, Supabase envoie maximum 3-4 emails/heure en mode gratuit.**

1. Vérifiez les **Email Templates**
   ```
   Authentication
   └─> Email Templates
       └─> Confirm signup
   ```

2. Vérifiez l'URL de redirection
   ```
   Site URL: http://localhost:5173
   Redirect URLs: http://localhost:5173/**
   ```

### Option B : Configurer un SMTP personnalisé (Recommandé)

1. **Accéder aux paramètres SMTP**
   ```
   Project Settings
   └─> Auth
       └─> SMTP Settings
   ```

2. **Configurer avec Gmail (Exemple)**
   ```
   Enable Custom SMTP: ON
   Sender email: votre-email@gmail.com
   Sender name: WordCraft
   Host: smtp.gmail.com
   Port: 587
   Username: votre-email@gmail.com
   Password: [App Password généré]
   ```

3. **Générer un App Password Gmail**
   - Aller sur https://myaccount.google.com/apppasswords
   - Créer un nouveau mot de passe d'application
   - Utiliser ce mot de passe dans Supabase

### Option C : Services d'email recommandés

- **SendGrid** : 100 emails/jour gratuit
- **Mailgun** : 5000 emails/mois gratuit
- **Resend** : 3000 emails/mois gratuit
- **Amazon SES** : Très économique

---

## 🔍 Vérification des Logs

### Dans la Console de votre Application

Après l'inscription, vous devriez voir ces logs :

```
🚀 Début de l'inscription...
📧 Email: test@example.com
👤 Nom complet: Test User
🌍 Environnement: development

📡 Réponse Supabase auth.signUp:
  - Utilisateur créé: ✅ ID: abc-123-def
  - Session créée: ✅ Oui  (ou ❌ Non si confirmation email requise)
  - Email confirmé: ✅ Oui  (ou ⏳ En attente)

✅ Inscription réussie avec connexion automatique!
🎉 L'utilisateur est automatiquement connecté
```

### En cas d'erreur

```
❌ Erreur Supabase lors de l'inscription:
  - Code: 400
  - Message: User already registered
  - Détails complets: {...}
```

**Erreurs courantes :**

| Code | Message | Solution |
|------|---------|----------|
| 400 | User already registered | Email déjà utilisé, essayez la connexion |
| 422 | Email rate limit exceeded | Trop d'emails envoyés, attendez ou désactivez la confirmation |
| 500 | SMTP Error | Vérifiez la configuration SMTP |

---

## 🧪 Mode Développement vs Production

### Développement (localhost)

```typescript
// .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

**Configuration Supabase Dashboard :**
- ❌ Confirm email: **OFF**
- ✅ Enable auto-confirm: **ON**
- Site URL: `http://localhost:5173`

**Résultat :**
- Inscription = Connexion immédiate
- Pas d'email envoyé
- Test rapide

### Production

**Configuration Supabase Dashboard :**
- ✅ Confirm email: **ON**
- ✅ SMTP personnalisé configuré
- Site URL: `https://votre-domaine.com`

**Résultat :**
- Email de confirmation envoyé
- Utilisateur doit vérifier
- Sécurité maximale

---

## 📝 Checklist de Configuration

### Pour tester rapidement (Développement)

- [ ] Aller dans **Authentication > Providers > Email**
- [ ] Décocher **"Confirm email"**
- [ ] Sauvegarder
- [ ] Tester l'inscription
- [ ] Vérifier les logs dans la console
- [ ] L'utilisateur devrait être redirigé vers `/library`

### Pour la production

- [ ] Configurer SMTP personnalisé
- [ ] Activer **"Confirm email"**
- [ ] Tester l'envoi d'email
- [ ] Vérifier les templates d'email
- [ ] Configurer les URL de redirection
- [ ] Tester le flux complet

---

## 🔧 Commandes de Debug

### Vérifier l'état de l'utilisateur après inscription

```typescript
// Dans la console du navigateur
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
console.log('Email confirmé:', user?.email_confirmed_at);
```

### Forcer la confirmation d'un email (SQL Editor dans Supabase)

```sql
-- ⚠️ À utiliser uniquement en développement
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'test@example.com';
```

---

## 💡 Astuce : Variable d'environnement

Vous pouvez créer une variable pour basculer automatiquement :

```typescript
// .env.local
VITE_SKIP_EMAIL_VERIFICATION=true

// Dans AuthContext.tsx
const skipEmailVerification = import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === 'true';
```

---

## 📚 Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

---

**Date de création :** 27 décembre 2024  
**Dernière mise à jour :** 27 décembre 2024

