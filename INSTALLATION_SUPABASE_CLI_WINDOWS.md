# 🔧 INSTALLATION SUPABASE CLI SUR WINDOWS

## ❌ Problème
```
npm install -g supabase
```
Cette méthode n'est PLUS supportée !

---

## ✅ SOLUTION 1 : Scoop (RECOMMANDÉ - 3 minutes)

### Étape 1 : Installer Scoop (si pas déjà installé)

Ouvrir PowerShell **en tant qu'administrateur** et exécuter :

```powershell
# Autoriser l'exécution de scripts
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Installer Scoop
irm get.scoop.sh | iex
```

### Étape 2 : Installer Supabase CLI via Scoop

```powershell
# Ajouter le bucket Supabase
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# Installer Supabase CLI
scoop install supabase
```

### Étape 3 : Vérifier l'installation

```powershell
supabase --version
```

---

## ✅ SOLUTION 2 : Téléchargement Direct (Alternative - 2 minutes)

Si Scoop ne fonctionne pas :

### Étape 1 : Télécharger le binaire

1. Aller sur : https://github.com/supabase/cli/releases/latest
2. Télécharger : `supabase_windows_amd64.zip`
3. Extraire le fichier ZIP

### Étape 2 : Ajouter au PATH

1. Créer un dossier : `C:\supabase\`
2. Copier `supabase.exe` dedans
3. Ajouter au PATH Windows :
   - Windows + R → `sysdm.cpl`
   - Onglet "Avancé"
   - "Variables d'environnement"
   - Dans "Variables système", double-cliquer "Path"
   - "Nouveau" → `C:\supabase`
   - OK sur tout

4. **Redémarrer PowerShell**

### Étape 3 : Vérifier

```powershell
supabase --version
```

---

## ✅ SOLUTION 3 : Utiliser npx (Sans installation - TEMPORAIRE)

Si vous voulez tester rapidement sans installer :

```powershell
# Au lieu de :
# supabase login

# Utilisez :
npx supabase login

# Pour déployer :
npx supabase functions deploy generate-quiz
```

**⚠️ Moins pratique** mais ça fonctionne !

---

## 🎯 APRÈS INSTALLATION

Une fois Supabase CLI installé, continuez avec :

### 1. Se connecter
```powershell
supabase login
```

### 2. Aller dans votre projet
```powershell
cd "C:\Users\HP I5\Downloads\project"
```

### 3. Lier votre projet Supabase
```powershell
# Récupérer votre Reference ID sur :
# https://supabase.com/dashboard → Settings → General

supabase link --project-ref VOTRE_REF_ID
```

### 4. Configurer votre clé OpenAI
Aller sur Dashboard Supabase :
1. Project Settings → Edge Functions
2. Add secret : `OPENAI_API_KEY` = votre clé

### 5. Déployer les fonctions
```powershell
supabase functions deploy generate-quiz
supabase functions deploy generate-flashcards
supabase functions deploy chat-ai
```

---

## 🆘 DÉPANNAGE

### Erreur "scoop: command not found"
- Installer Scoop d'abord (voir Solution 1)
- OU utiliser Solution 2 (téléchargement direct)

### Erreur "Access Denied"
- Exécuter PowerShell **en tant qu'administrateur**
- Click droit sur PowerShell → "Exécuter en tant qu'administrateur"

### Erreur PowerShell script execution
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📝 RECOMMANDATION

**MÉTHODE RECOMMANDÉE** : Solution 1 (Scoop)
- ✅ Simple
- ✅ Mises à jour faciles
- ✅ Gestion propre

**Si Scoop pose problème** : Solution 2 (Binaire direct)
- ✅ Fonctionne toujours
- ⚠️ Mises à jour manuelles

**Pour tester rapidement** : Solution 3 (npx)
- ✅ Pas d'installation
- ⚠️ Plus lent

---

**Date:** 04 Janvier 2026  
**Priorité:** 🔴 NÉCESSAIRE pour Edge Functions
