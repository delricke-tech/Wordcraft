# 🔧 CORRECTION : Installer Supabase CLI (PowerShell NORMAL)

## ❌ ERREUR : "Running the installer as administrator is disabled"

**Cause :** Scoop ne s'installe PAS en mode administrateur !

**Solution :** Utiliser PowerShell **NORMAL** (pas administrateur)

---

## ✅ NOUVELLE PROCÉDURE (PowerShell NORMAL)

### **Étape 1** : Ouvrir PowerShell NORMAL (PAS administrateur)

1. Appuyez sur la touche **Windows** ⊞
2. Tapez : **"PowerShell"**
3. **CLIQUEZ NORMALEMENT** sur "Windows PowerShell" (PAS clic droit)
   **OU** appuyez juste sur **Entrée**

**⚠️ NE PAS faire clic droit → "Exécuter en tant qu'administrateur"**

---

### **Étape 2** : Autoriser les scripts

**Dans PowerShell NORMAL**, copiez-collez :

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Appuyez sur **Entrée**

**Si ça demande Y/N**, tapez **Y** puis **Entrée**

---

### **Étape 3** : Installer Scoop

**Copiez-collez cette commande** :

```powershell
irm get.scoop.sh | iex
```

Appuyez sur **Entrée**

**Attendez 1-2 minutes...**

**✅ Vous devriez voir :** `Scoop was installed successfully!`

---

### **Étape 4** : Ajouter le repository Supabase

**Copiez-collez cette commande** :

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
```

Appuyez sur **Entrée**

---

### **Étape 5** : Installer Supabase CLI

**Copiez-collez cette commande** :

```powershell
scoop install supabase
```

Appuyez sur **Entrée**

**Attendez 1 minute...**

---

### **Étape 6** : Vérifier l'installation

**Copiez-collez cette commande** :

```powershell
supabase --version
```

**✅ Vous devriez voir :** `supabase version 1.x.x`

**🎉 SI OUI → BRAVO ! Continuez ci-dessous ↓**

---

## 🚀 MAINTENANT : Utiliser Supabase CLI

### 1. Se connecter à Supabase
```powershell
supabase login
```
*(Votre navigateur va s'ouvrir, cliquez "Authorize")*

---

### 2. Aller dans votre projet
```powershell
cd "C:\Users\HP I5\Downloads\project"
```

---

### 3. Récupérer votre Reference ID

**Dans votre navigateur** :
1. Allez sur https://supabase.com/dashboard
2. Cliquez sur votre projet WordCraft
3. Menu → **Settings** (⚙️)
4. Onglet **General**
5. Trouvez **"Reference ID"** et cliquez sur 📋

**Le code ressemble à :** `abc123xyz456`

---

### 4. Lier votre projet

**Dans PowerShell**, remplacez `VOTRE_CODE` par ce que vous avez copié :

```powershell
supabase link --project-ref VOTRE_CODE
```

**Exemple :**
```powershell
supabase link --project-ref abc123xyz456
```

---

### 5. Ajouter votre clé OpenAI

**Dans le Dashboard Supabase** (navigateur) :
1. Menu → **Edge Functions**
2. Cliquez **"Add secret"** ou **"Manage secrets"**
3. Remplissez :
   - **Name** : `OPENAI_API_KEY`
   - **Value** : Votre clé OpenAI (commence par `sk-proj-...`)
4. Cliquez **"Save"**

---

### 6. Déployer les 3 fonctions

**Dans PowerShell, une par une :**

```powershell
supabase functions deploy generate-quiz
```

```powershell
supabase functions deploy generate-flashcards
```

```powershell
supabase functions deploy chat-ai
```

**Attendez après chaque commande** (~30 secondes chacune)

---

## 📝 RÉSUMÉ DES COMMANDES (PowerShell NORMAL)

```powershell
# Installation
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
supabase --version

# Utilisation
supabase login
cd "C:\Users\HP I5\Downloads\project"
supabase link --project-ref VOTRE_CODE
supabase functions deploy generate-quiz
supabase functions deploy generate-flashcards
supabase functions deploy chat-ai
```

---

## 🎯 IMPORTANT À RETENIR

✅ **PowerShell NORMAL** pour installer Scoop  
❌ **PAS PowerShell Administrateur** pour Scoop  

Une fois Scoop et Supabase CLI installés, vous pouvez tout faire en mode normal !

---

## 🆘 BESOIN D'AIDE ?

Dites-moi simplement :
- "Ça marche maintenant !"
- "Je suis bloqué à l'étape X"
- "J'ai une autre erreur : [message]"

Je vous aiderai ! 🚀

**Date:** 04 Janvier 2026  
**Fix:** Utiliser PowerShell NORMAL, pas Administrateur
