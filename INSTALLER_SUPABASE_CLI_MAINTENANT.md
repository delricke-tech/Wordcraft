# 🔧 INSTALLER SUPABASE CLI - GUIDE SIMPLE

## 📍 Vous êtes ici car : `supabase n'est pas reconnu`

Pas de panique ! On va l'installer ensemble maintenant.

---

## ✅ MÉTHODE 1 : Avec Scoop (RECOMMANDÉ)

### **Étape 1.1** : Ouvrir PowerShell EN TANT QU'ADMINISTRATEUR

1. Appuyez sur la touche **Windows** de votre clavier
2. Tapez : **"PowerShell"**
3. **CLIC DROIT** sur "Windows PowerShell"
4. Cliquez sur **"Exécuter en tant qu'administrateur"**
5. Cliquez **"Oui"** si Windows demande la permission

---

### **Étape 1.2** : Autoriser l'exécution de scripts

**Dans PowerShell administrateur**, copiez-collez cette commande :

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Appuyez sur **Entrée**

**Si ça demande Y/N**, tapez **Y** puis **Entrée**

---

### **Étape 1.3** : Installer Scoop

**Copiez-collez cette commande** :

```powershell
irm get.scoop.sh | iex
```

Appuyez sur **Entrée**

**Attendez 1-2 minutes** que ça s'installe...

**✅ Vous devriez voir :** `Scoop was installed successfully!`

---

### **Étape 1.4** : Ajouter le repository Supabase

**Copiez-collez cette commande** :

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
```

Appuyez sur **Entrée**

**✅ Vous devriez voir :** `'supabase' bucket was added successfully`

---

### **Étape 1.5** : Installer Supabase CLI

**Copiez-collez cette commande** :

```powershell
scoop install supabase
```

Appuyez sur **Entrée**

**Attendez 1 minute** que ça s'installe...

**✅ Vous devriez voir :** `'supabase' (version ...) was installed successfully!`

---

### **Étape 1.6** : Vérifier que c'est installé

**Copiez-collez cette commande** :

```powershell
supabase --version
```

**✅ Vous devriez voir :** `supabase version 1.x.x`

**🎉 SI OUI → C'EST BON ! Passez à la section "MAINTENANT QUE C'EST INSTALLÉ" en bas**

---

## ✅ MÉTHODE 2 : Si Scoop ne fonctionne pas (Alternative)

### **Étape 2.1** : Télécharger manuellement

1. Allez sur : https://github.com/supabase/cli/releases/latest
2. Cherchez le fichier : **`supabase_windows_amd64.zip`**
3. Cliquez dessus pour le télécharger
4. Une fois téléchargé, **faites un clic droit** sur le fichier ZIP
5. Cliquez sur **"Extraire tout"**
6. Choisissez comme destination : **`C:\supabase`**
7. Cliquez sur **"Extraire"**

---

### **Étape 2.2** : Ajouter au PATH

1. Appuyez sur **Windows + R**
2. Tapez : **`sysdm.cpl`**
3. Appuyez sur **Entrée**
4. Cliquez sur l'onglet **"Avancé"**
5. Cliquez sur **"Variables d'environnement"**
6. Dans la section **"Variables système"** (en bas), trouvez **"Path"**
7. Double-cliquez sur **"Path"**
8. Cliquez sur **"Nouveau"**
9. Tapez : **`C:\supabase`**
10. Cliquez **OK** sur toutes les fenêtres

---

### **Étape 2.3** : Redémarrer PowerShell

1. **Fermez PowerShell**
2. **Réouvrez PowerShell** (normal, pas administrateur)
3. Tapez : **`supabase --version`**

**✅ Vous devriez voir :** `supabase version 1.x.x`

---

## 🎯 MAINTENANT QUE C'EST INSTALLÉ

**Ouvrez un NOUVEAU PowerShell** (normal, pas administrateur) et suivez ces étapes :

### 1. Se connecter
```powershell
supabase login
```

### 2. Aller dans votre projet
```powershell
cd "C:\Users\HP I5\Downloads\project"
```

### 3. Lier votre projet
**D'ABORD**, récupérez votre Reference ID sur https://supabase.com/dashboard  
→ Settings → General → Reference ID (copier)

**PUIS**, dans PowerShell :
```powershell
supabase link --project-ref VOTRE_CODE_ICI
```

### 4. Ajouter votre clé OpenAI
Sur Dashboard Supabase → Edge Functions → Add secret :
- Name : `OPENAI_API_KEY`
- Value : Votre clé `sk-proj-...`

### 5. Déployer les fonctions
```powershell
supabase functions deploy generate-quiz
supabase functions deploy generate-flashcards
supabase functions deploy chat-ai
```

---

## 📝 RÉCAPITULATIF DES COMMANDES

**Installation (PowerShell Administrateur) :**
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
supabase --version
```

**Après installation (PowerShell Normal) :**
```powershell
supabase login
cd "C:\Users\HP I5\Downloads\project"
supabase link --project-ref VOTRE_CODE
supabase functions deploy generate-quiz
supabase functions deploy generate-flashcards
supabase functions deploy chat-ai
```

---

## 🆘 BESOIN D'AIDE ?

Dites-moi :
- "J'ai installé Scoop mais bloqué à l'étape X"
- "Scoop ne s'installe pas"
- "J'ai fini l'installation, que faire maintenant ?"

Je vous aiderai ! 🚀

**Date:** 04 Janvier 2026
