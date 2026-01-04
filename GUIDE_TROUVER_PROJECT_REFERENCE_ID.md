# 📍 ÉTAPE 2 DÉTAILLÉE : Trouver votre Project Reference ID

## 🎯 Qu'est-ce que le "Project Reference ID" ?

C'est un code unique qui identifie VOTRE projet Supabase. 
Exemple : `abcdefghijklmnop` ou `xyzwkjmlpoqrstu`

---

## 📺 GUIDE VISUEL ÉTAPE PAR ÉTAPE

### **Étape 2.1 : Aller sur Supabase Dashboard**

1. **Ouvrir votre navigateur** (Chrome, Edge, Firefox...)

2. **Aller sur** : https://supabase.com/dashboard

3. **Se connecter** avec votre compte Supabase

---

### **Étape 2.2 : Sélectionner votre projet WordCraft**

Sur la page d'accueil du Dashboard, vous verrez :

```
┌─────────────────────────────────────┐
│  Mes Projets                        │
│                                     │
│  ┌───────────────────────────┐     │
│  │  🏢 WordCraft              │     │
│  │  (ou le nom de votre projet)│   │
│  │  ▸ Active                  │     │
│  └───────────────────────────┘     │
│                                     │
│  ┌───────────────────────────┐     │
│  │  + New Project             │     │
│  └───────────────────────────┘     │
└─────────────────────────────────────┘
```

**➡️ CLIQUER sur votre projet WordCraft**

---

### **Étape 2.3 : Aller dans Settings (Paramètres)**

Une fois dans votre projet, vous verrez un menu à gauche :

```
┌─────────────────┐
│ 📊 Home         │
│ 🗂️  Database    │
│ 🔌 API          │
│ ⚡ Functions    │
│ 📝 SQL Editor   │
│ ...             │
│ ⚙️  Settings    │  ← CLIQUER ICI
└─────────────────┘
```

**➡️ CLIQUER sur "Settings" (⚙️) en bas du menu**

---

### **Étape 2.4 : Cliquer sur "General"**

Dans Settings, vous verrez plusieurs onglets :

```
┌─────────────────────────────────────────┐
│ Settings                                │
├─────────────────────────────────────────┤
│ General  │  API  │  Database  │  Auth  │
│   ↑                                     │
│   CLIQUER ICI                          │
└─────────────────────────────────────────┘
```

**➡️ CLIQUER sur l'onglet "General"**

---

### **Étape 2.5 : Trouver le "Reference ID"**

Sur la page General, **SCROLLEZ UN PEU VERS LE BAS**, vous verrez :

```
┌──────────────────────────────────────────┐
│ General settings                         │
├──────────────────────────────────────────┤
│                                          │
│ Project name                             │
│ ┌──────────────────────────────────┐    │
│ │ WordCraft                        │    │
│ └──────────────────────────────────┘    │
│                                          │
│ Reference ID                             │
│ ┌──────────────────────────────────┐    │
│ │ xyzabcdefghijk  📋 [Copier]      │    │
│ └──────────────────────────────────┘    │
│        ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑                 │
│     C'EST CE CODE ICI !                  │
│                                          │
│ Organization                             │
│ ┌──────────────────────────────────┐    │
│ │ Mon Organisation                 │    │
│ └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

**➡️ COPIER le "Reference ID"** (cliquer sur l'icône 📋 à côté)

---

### **Étape 2.6 : Utiliser le Reference ID**

Une fois copié, retournez dans PowerShell et tapez :

```powershell
cd "C:\Users\HP I5\Downloads\project"

supabase link --project-ref VOTRE_REF_ID_COPIÉ_ICI
```

**EXEMPLE COMPLET :**
```powershell
# SI votre Reference ID est : xyzabcdefghijk
supabase link --project-ref xyzabcdefghijk
```

Remplacez `VOTRE_REF_ID_COPIÉ_ICI` par le code que vous avez copié !

---

## 🎯 RÉCAPITULATIF EN 6 CLICS

1. ✅ Aller sur https://supabase.com/dashboard
2. ✅ Cliquer sur votre projet WordCraft
3. ✅ Cliquer sur "Settings" (⚙️) dans le menu de gauche
4. ✅ Cliquer sur l'onglet "General"
5. ✅ Trouver "Reference ID" et cliquer sur 📋 pour copier
6. ✅ Coller dans PowerShell : `supabase link --project-ref [LE_CODE_COPIÉ]`

---

## ❓ QUESTIONS FRÉQUENTES

### Q : Je ne vois pas "Reference ID"
**R :** Scrollez un peu vers le bas dans la page General

### Q : Le Reference ID est trop long/court
**R :** C'est normal, il fait environ 15-20 caractères

### Q : Je n'ai pas de projet sur Supabase
**R :** Il faut d'abord créer un projet Supabase. Voulez-vous que je vous guide ?

### Q : J'ai plusieurs projets, lequel choisir ?
**R :** Choisissez celui qui correspond à WordCraft (où vous avez créé les tables documents, quiz, etc.)

---

## 🆘 BESOIN D'AIDE ?

Si vous ne trouvez toujours pas, dites-moi :
1. Est-ce que vous voyez votre projet sur le Dashboard ?
2. Est-ce que vous êtes bien connecté à Supabase ?
3. À quelle étape exactement êtes-vous bloqué ?

Je vous aiderai ! 🚀

---

**Date:** 04 Janvier 2026  
**Niveau:** Débutant - Explications détaillées
