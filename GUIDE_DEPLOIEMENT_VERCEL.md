# 🚀 GUIDE DÉPLOIEMENT VERCEL - ÉTAPES MANUELLES

## ✅ CE QUE J'AI DÉJÀ FAIT POUR VOUS

- ✅ Vérifié Git (installé)
- ✅ Créé `.gitignore`
- ✅ Créé `vercel.json` (configuration)
- ✅ Commité les changements

---

## 🎯 ÉTAPE 1 : CRÉER COMPTE GITHUB (5 MINUTES)

### Si vous n'avez PAS de compte GitHub :

1. **Allez sur** : https://github.com/signup
2. **Entrez votre email** : `votre-email@gmail.com`
3. **Créez un mot de passe** : (sécurisé)
4. **Choisissez un username** : `votre-nom` ou `wordcraft-dev`
5. **Vérifiez l'email** : Cliquez sur le lien reçu
6. ✅ **Compte créé !**

### Si vous AVEZ déjà un compte GitHub :

1. **Connectez-vous** : https://github.com/login
2. ✅ **Passez à l'étape suivante**

---

## 🎯 ÉTAPE 2 : CRÉER REPO GITHUB (2 MINUTES)

1. **Allez sur** : https://github.com/new

2. **Remplissez** :
   ```
   Repository name : wordcraft
   Description : WordCraft - Plateforme d'apprentissage intelligente
   Visibilité : Public ✅ (ou Private si vous préférez)
   
   NE PAS cocher :
   ❌ Add a README file
   ❌ Add .gitignore
   ❌ Choose a license
   ```

3. **Cliquez** : `Create repository`

4. **Copiez l'URL** qui s'affiche :
   ```
   https://github.com/VOTRE-USERNAME/wordcraft.git
   ```

---

## 🎯 ÉTAPE 3 : CONNECTER VOTRE PROJET À GITHUB (1 MINUTE)

### Dans PowerShell (dans VS Code ou Terminal Windows) :

```powershell
# Allez dans votre projet
cd "c:\Users\HP I5\Downloads\project"

# Connectez au repo GitHub (REMPLACEZ par VOTRE URL)
git remote add origin https://github.com/VOTRE-USERNAME/wordcraft.git

# Vérifiez
git remote -v

# Poussez le code
git branch -M main
git push -u origin main
```

**Si demandé** :
- Username : `votre-username-github`
- Password : Utilisez un **Personal Access Token** (voir ci-dessous)

### Créer un Personal Access Token (si nécessaire) :

1. **Allez sur** : https://github.com/settings/tokens
2. **Cliquez** : `Generate new token` → `Generate new token (classic)`
3. **Nom** : `Vercel Deploy`
4. **Expiration** : 90 days
5. **Cochez** : `repo` (toutes les cases sous repo)
6. **Cliquez** : `Generate token`
7. **COPIEZ LE TOKEN** (il ne sera plus visible après !)
8. **Utilisez ce token comme mot de passe** dans PowerShell

---

## 🎯 ÉTAPE 4 : CRÉER COMPTE VERCEL (2 MINUTES)

1. **Allez sur** : https://vercel.com/signup

2. **Cliquez** : `Continue with GitHub`

3. **Autorisez Vercel** à accéder à GitHub
   ```
   ✅ Cliquez "Authorize Vercel"
   ```

4. ✅ **Vous êtes connecté à Vercel !**

---

## 🎯 ÉTAPE 5 : DÉPLOYER SUR VERCEL (3 MINUTES)

### Dans le Dashboard Vercel :

1. **Cliquez** : `Add New...` → `Project`

2. **Importez votre repo** :
   ```
   Cherchez : wordcraft
   Cliquez : Import
   ```

3. **Configurez le projet** :
   ```
   Project Name : wordcraft (ou wordcraft-app)
   Framework Preset : Vite ✅ (détecté automatiquement)
   Root Directory : ./
   Build Command : npm run build
   Output Directory : dist
   ```

4. **IMPORTANT - Variables d'environnement** :
   
   **Cliquez** : `Environment Variables` (en bas)
   
   **Ajoutez UNE PAR UNE** :
   
   ```
   Name: VITE_SUPABASE_URL
   Value: [Copiez depuis votre .env]
   
   Name: VITE_SUPABASE_ANON_KEY
   Value: [Copiez depuis votre .env]
   
   Name: VITE_OPENAI_API_KEY
   Value: [Copiez depuis votre .env]
   
   Name: VITE_DAILY_API_KEY
   Value: [Copiez depuis votre .env] (si vous l'avez)
   ```

5. **Cliquez** : `Deploy`

6. **Attendez** (2-3 minutes) :
   ```
   Building... ⏳
   Deploying... ⏳
   ✅ Deployment successful !
   ```

7. **Cliquez sur le lien** :
   ```
   https://wordcraft-xxxxx.vercel.app
   ```

8. ✅ **VOTRE APP EST EN LIGNE !** 🎉

---

## 🎯 ÉTAPE 6 : CONFIGURER SUPABASE POUR PRODUCTION (2 MINUTES)

### Dans Supabase Dashboard :

1. **Allez dans** : `Authentication` → `URL Configuration`

2. **Ajoutez les URLs de production** :
   ```
   Site URL: https://wordcraft-xxxxx.vercel.app
   
   Redirect URLs (cliquez "+ Add URL" pour chaque) :
   https://wordcraft-xxxxx.vercel.app/**
   https://wordcraft-xxxxx.vercel.app/reset-password
   https://wordcraft-xxxxx.vercel.app/login
   https://wordcraft-xxxxx.vercel.app/dashboard
   ```

3. **Cliquez** : `Save`

4. ✅ **Supabase configuré pour production !**

---

## 🎯 ÉTAPE 7 : TESTER L'APPLICATION EN LIGNE (2 MINUTES)

1. **Ouvrez** : `https://wordcraft-xxxxx.vercel.app`

2. **Testez** :
   - ✅ Page d'accueil s'affiche
   - ✅ Inscription fonctionne
   - ✅ Connexion fonctionne
   - ✅ Dashboard s'affiche
   - ✅ Toutes les pages fonctionnent

3. **Partagez le lien** :
   ```
   Envoyez à vos amis :
   https://wordcraft-xxxxx.vercel.app
   
   Ils peuvent s'inscrire et utiliser l'app ! 🎉
   ```

---

## 🔄 MISES À JOUR FUTURES (AUTOMATIQUES)

### Quand vous modifiez le code :

```powershell
# Après vos modifications
git add .
git commit -m "Description de la modification"
git push

# Vercel détecte automatiquement et redéploie (2-3 min)
# ✅ Votre app est mise à jour !
```

---

## 📊 RÉCAPITULATIF COMPLET

### Ce qui a été fait :
```
✅ Git configuré
✅ .gitignore créé
✅ vercel.json créé
✅ Code commité
```

### Ce que VOUS devez faire :
```
1. Créer compte GitHub (si pas déjà fait)
2. Créer repo "wordcraft" sur GitHub
3. Connecter projet à GitHub (git remote add...)
4. Pousser le code (git push)
5. Créer compte Vercel (avec GitHub)
6. Importer projet sur Vercel
7. Ajouter variables d'environnement
8. Déployer
9. Configurer Supabase URLs
10. Tester
```

### Temps total estimé :
```
⏱️ 10-15 minutes
```

---

## 🆘 PROBLÈMES COURANTS

### Erreur : "Git authentication failed"

**Solution** :
```
Utilisez un Personal Access Token au lieu du mot de passe
https://github.com/settings/tokens
```

### Erreur : "Build failed"

**Solution** :
```
1. Vérifiez variables d'environnement sur Vercel
2. Vérifiez que toutes les clés sont copiées
3. Redéployez
```

### Erreur : "Page blanche après déploiement"

**Solution** :
```
1. F12 → Console
2. Vérifiez les erreurs
3. Souvent : Variables d'environnement manquantes
4. Ajoutez-les sur Vercel → Settings → Environment Variables
5. Redéployez
```

---

## 🎯 URL FINALE POUR CINETPAY

Une fois déployé, utilisez votre URL Vercel dans CinetPay :

```
Site web : https://wordcraft-xxxxx.vercel.app
```

(Remplacez "xxxxx" par votre ID Vercel réel)

---

## 📧 BESOIN D'AIDE ?

Si vous êtes bloqué à une étape :

1. **Dites-moi où vous en êtes**
2. **Envoyez une capture d'écran de l'erreur**
3. **Je vous aide immédiatement !**

---

## 🎉 APRÈS LE DÉPLOIEMENT

Vous aurez :
```
✅ App accessible 24/7 sur Internet
✅ URL à partager : https://wordcraft-xxxxx.vercel.app
✅ Mises à jour automatiques (git push)
✅ HTTPS gratuit
✅ CDN mondial (rapide partout)
✅ 0€ (gratuit)
```

---

**➡️ COMMENCEZ PAR L'ÉTAPE 1 : CRÉER COMPTE GITHUB !**

**Je reste avec vous pour chaque étape !** 🚀✨
