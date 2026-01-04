# 🎯 GUIDE ULTRA-SIMPLE - Copier-Coller les Commandes

## ✅ ÉTAPE 1 : Vérifier ce qui est installé (1 minute)

Ouvrez PowerShell (PAS besoin d'administrateur cette fois) et tapez :

```powershell
supabase --version
```

### 📊 RÉSULTATS POSSIBLES :

**✅ SI vous voyez :** `supabase version 1.x.x`
→ **BRAVO ! Supabase CLI est installé**
→ **PASSEZ DIRECTEMENT À L'ÉTAPE 2**

**❌ SI vous voyez :** `supabase : Le terme 'supabase' n'est pas reconnu`
→ **Supabase CLI n'est PAS installé**
→ **Retournez installer avec Scoop** (voir en bas de ce fichier)

---

## ✅ ÉTAPE 2 : Se connecter à Supabase (2 minutes)

```powershell
supabase login
```

→ Votre navigateur va s'ouvrir
→ Cliquez sur **"Authorize"** ou **"Autoriser"**
→ Revenez dans PowerShell

**✅ Vous devriez voir :** `Logged in successfully`

---

## ✅ ÉTAPE 3 : Aller dans votre projet (10 secondes)

```powershell
cd "C:\Users\HP I5\Downloads\project"
```

---

## ✅ ÉTAPE 4 : Trouver votre Reference ID (2 minutes)

### 🌐 DANS VOTRE NAVIGATEUR :

1. Allez sur : **https://supabase.com/dashboard**

2. **Cliquez sur votre projet WordCraft**

3. Dans le menu de gauche, **cliquez sur "Settings"** (tout en bas, icône ⚙️)

4. **Cliquez sur l'onglet "General"** (en haut)

5. **Trouvez "Reference ID"** (scrollez un peu)

6. **Cliquez sur l'icône 📋 pour copier le code**

   Exemple de code : `xyzabc123def456`

---

## ✅ ÉTAPE 5 : Lier votre projet (30 secondes)

**DANS POWERSHELL**, collez cette commande en **REMPLAÇANT** `VOTRE_CODE_ICI` par le code que vous avez copié :

```powershell
supabase link --project-ref VOTRE_CODE_ICI
```

**EXEMPLE CONCRET :**
```powershell
# Si votre Reference ID est : xyzabc123def456
supabase link --project-ref xyzabc123def456
```

**✅ Vous devriez voir :** `Linked to project xyzabc123def456`

---

## ✅ ÉTAPE 6 : Ajouter votre clé OpenAI (3 minutes)

### 🌐 DANS VOTRE NAVIGATEUR (Dashboard Supabase) :

1. **Dans le menu de gauche**, cliquez sur **"Project Settings"** (⚙️)

2. **Cliquez sur "Edge Functions"** dans le menu

3. **Cliquez sur "Manage secrets"** ou **"Add secret"**

4. **Remplissez** :
   - **Name (Nom)** : `OPENAI_API_KEY`
   - **Value (Valeur)** : Votre clé OpenAI (commence par `sk-proj-...`)

5. **Cliquez sur "Save"** ou **"Create"**

**✅ Vous devriez voir :** `Secret created successfully`

---

## ✅ ÉTAPE 7 : Déployer les 3 fonctions (2 minutes)

**DANS POWERSHELL**, copiez-collez CES 3 COMMANDES une par une :

### Fonction 1 :
```powershell
supabase functions deploy generate-quiz
```
**Attendez que ça finisse** (environ 30 secondes)

### Fonction 2 :
```powershell
supabase functions deploy generate-flashcards
```
**Attendez que ça finisse** (environ 30 secondes)

### Fonction 3 :
```powershell
supabase functions deploy chat-ai
```
**Attendez que ça finisse** (environ 30 secondes)

**✅ Pour chaque fonction, vous devriez voir :** 
```
✓ Deployed function generate-quiz
```

---

## 🎉 ÉTAPE 8 : Vérifier que tout marche (1 minute)

### 🌐 DANS VOTRE NAVIGATEUR (Dashboard Supabase) :

1. Dans le menu de gauche, cliquez sur **"Edge Functions"**

2. **Vous devriez voir vos 3 fonctions** :
   - ✅ `generate-quiz`
   - ✅ `generate-flashcards`
   - ✅ `chat-ai`

**SI OUI → BRAVO ! C'EST TERMINÉ ! 🎉**

---

## 🆘 SI SUPABASE CLI N'EST PAS INSTALLÉ

Si à l'Étape 1 vous aviez l'erreur "supabase n'est pas reconnu", installez-le :

### Dans PowerShell EN TANT QU'ADMINISTRATEUR :

```powershell
# 1. Installer Scoop (si pas déjà fait)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# 2. Installer Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 3. Vérifier
supabase --version
```

Puis retournez à l'ÉTAPE 2 ↑

---

## 📝 RÉCAPITULATIF ULTRA-SIMPLE

```
✅ ÉTAPE 1 : supabase --version
✅ ÉTAPE 2 : supabase login
✅ ÉTAPE 3 : cd "C:\Users\HP I5\Downloads\project"
✅ ÉTAPE 4 : Copier Reference ID depuis Dashboard
✅ ÉTAPE 5 : supabase link --project-ref VOTRE_CODE
✅ ÉTAPE 6 : Ajouter clé OpenAI dans Dashboard
✅ ÉTAPE 7 : supabase functions deploy (x3)
✅ ÉTAPE 8 : Vérifier sur Dashboard
```

---

## ❓ VOUS ÊTES OÙ MAINTENANT ?

**Dites-moi simplement :**
- "J'ai fini l'étape X"
- "Je suis bloqué à l'étape X"
- "Je ne comprends pas l'étape X"

Et je vous aiderai ! 🚀

**Date:** 04 Janvier 2026  
**Niveau:** DÉBUTANT - Commandes simples à copier-coller
