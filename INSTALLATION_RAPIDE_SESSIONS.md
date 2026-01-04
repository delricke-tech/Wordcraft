# 🚀 INSTALLATION RAPIDE - VOLET SESSIONS

## ⚡ Installation en 3 Minutes

### ÉTAPE 1 : Corriger la Base de Données (⏱️ 1 minute)

1. **Ouvrir Supabase**
   - Aller sur https://app.supabase.com
   - Sélectionner votre projet
   - Cliquer sur "SQL Editor"

2. **Exécuter les 2 scripts SQL**

   **Script 1 : Corriger RLS**
   ```bash
   # Copier tout le contenu de FIX_RLS_SESSIONS_RECURSION.sql
   # Coller dans SQL Editor
   # Cliquer RUN (Ctrl+Enter)
   ```
   
   **Script 2 : Créer les fonctions**
   ```bash
   # Copier tout le contenu de CREATE_SESSION_FUNCTIONS.sql
   # Coller dans SQL Editor
   # Cliquer RUN (Ctrl+Enter)
   ```

3. **Vérifier que ça marche**
   - Vous devriez voir : "✅✅✅ RLS CORRIGÉE"
   - Puis : "✅✅✅ FONCTIONS ET TABLES SESSIONS CRÉÉES"

---

### ÉTAPE 2 : Configuration Minimale (⏱️ 30 secondes)

1. **Créer le fichier .env**

Créer un fichier `.env` à la racine du projet (à côté de `package.json`) :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

2. **Récupérer vos clés Supabase**
   - Dans Supabase Dashboard
   - Aller dans "Settings" → "API"
   - Copier :
     - Project URL → `VITE_SUPABASE_URL`
     - anon public key → `VITE_SUPABASE_ANON_KEY`

3. **Remplacer dans .env**
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...votre_longue_cle
   ```

---

### ÉTAPE 3 : Lancer l'Application (⏱️ 1 minute)

```bash
# Dans le terminal PowerShell
cd "c:\Users\HP I5\Downloads\project"

# Si première fois : installer les dépendances
npm install

# Lancer l'application
npm run dev
```

**Résultat attendu :**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## ✅ TEST IMMÉDIAT

### 1. Vérifier que l'erreur est corrigée

1. Ouvrir http://localhost:5173
2. Se connecter
3. Aller dans "Sessions"
4. **Ouvrir la console (F12)**

**✅ Avant (erreur) :**
```
❌ Error fetching sessions:
   message: "Infinite recursion detected in policy..."
```

**✅ Après (corrigé) :**
```
✅ Pas d'erreur !
✅ Affichage : "0 sessions" (normal au début)
```

---

### 2. Créer votre première session

1. Cliquer sur **"Nouvelle session"**
2. Remplir le formulaire :
   - **Titre :** Test Session
   - **Description :** Ma première session
   - **Type :** Session d'étude
   - **Date :** Aujourd'hui
   - **Heure :** Dans 10 minutes
3. Cliquer **"Créer la session"**

**✅ Résultat attendu :**
- La session apparaît dans "À venir (1)"
- Le compteur "Total sessions" passe à 1
- Pas d'erreur dans la console

---

### 3. Rejoindre la session (Interface Chat)

1. Cliquer sur **"Rejoindre"** sur votre session
2. Vous arrivez dans la salle de session avec :
   - ✅ Zone vidéo (grille des participants)
   - ✅ Panneau latéral (Chat/Participants/Documents)
   - ✅ Contrôles média (Micro/Vidéo/Partage d'écran/Quitter)

**Note :** La vidéo/audio ne fonctionnera pas encore (normal à ce stade)

---

## 🎥 ÉTAPE 4 : Ajouter la Vidéo/Audio (Optionnel)

### Option A : Daily.co (Recommandé - Gratuit et Simple)

**1. Créer un compte Daily.co**
```
→ Aller sur https://dashboard.daily.co/signup
→ S'inscrire (gratuit)
→ Aller dans "Developers" → "API Keys"
→ Copier votre clé API
```

**2. Installer les dépendances**
```bash
npm install @daily-co/daily-js @daily-co/daily-react
```

**3. Ajouter dans .env**
```env
VITE_DAILY_API_KEY=votre_cle_daily
```

**4. Redémarrer**
```bash
# Arrêter (Ctrl+C)
npm run dev
```

**5. Tester**
- Rejoindre une session
- Autoriser caméra/micro quand demandé
- ✅ Votre vidéo s'affiche !

---

### Option B : Sans Vidéo (Juste Chat)

Si vous voulez juste le chat texte pour l'instant :
- ✅ Rien à installer !
- ✅ Le chat fonctionne déjà
- ✅ Vous pouvez ajouter la vidéo plus tard

---

## 🔍 VÉRIFICATION FINALE

### Liste de contrôle (Checklist)

- [ ] Scripts SQL exécutés sans erreur
- [ ] Fichier `.env` créé avec les bonnes clés
- [ ] `npm run dev` lancé sans erreur
- [ ] Page Sessions accessible (pas d'erreur "Infinite recursion")
- [ ] Création de session fonctionne
- [ ] Rejoindre une session fonctionne
- [ ] Interface de session s'affiche (vidéo + chat + participants)
- [ ] Chat texte fonctionne (optionnel)
- [ ] Vidéo/Audio fonctionne (optionnel si Daily.co configuré)

---

## 🆘 DÉPANNAGE RAPIDE

### Erreur : "Missing environment variables"

```bash
# Vérifier que .env existe
dir .env

# Si absent, le créer avec vos clés Supabase
```

### Erreur : "Infinite recursion" persiste

```bash
# Re-exécuter le script RLS dans Supabase
# Vérifier que vous l'avez bien exécuté
# Vider le cache du navigateur (Ctrl+Shift+Delete)
```

### Erreur : "Cannot read property 'id' of null"

```bash
# Vous n'êtes pas connecté
# → Se connecter/créer un compte d'abord
```

### La page Sessions est blanche

```bash
# Ouvrir la console (F12)
# Regarder les erreurs
# Vérifier que les clés .env sont bonnes
```

---

## 📊 ARCHITECTURE ACTUELLE

### Ce qui fonctionne MAINTENANT :

✅ **Base de données**
- Tables `study_sessions`, `session_participants`, `session_messages`
- Politiques RLS corrigées (pas de récursion)
- Fonctions RPC pour gérer les compteurs

✅ **Interface**
- Page liste des sessions
- Création de sessions
- Salle de session avec grille vidéo
- Panneau latéral (Chat/Participants/Documents)
- Contrôles média (boutons fonctionnels)

✅ **Chat en temps réel**
- Messages envoyés en base de données
- Subscription Realtime active
- Affichage des messages instantané

⚠️ **Ce qui manque (optionnel) :**
- WebRTC (vidéo/audio) → Nécessite Daily.co ou autre
- Partage d'écran → Nécessite WebRTC
- Enregistrement → Nécessite Daily.co ou serveur média

---

## 🎯 PROCHAINES ÉTAPES

### Utilisation immédiate (sans vidéo)

Vous pouvez déjà utiliser :
1. Création de sessions planifiées
2. Chat texte en temps réel
3. Gestion des participants
4. Partage de documents

### Ajouter la vidéo plus tard

Quand vous êtes prêt :
1. Créer compte Daily.co (5 minutes)
2. Installer les packages (1 minute)
3. Configurer la clé API (30 secondes)
4. Redémarrer → Vidéo fonctionne !

---

## 💡 RAPPEL IMPORTANT

### Clés API gratuites disponibles :

**Supabase** (déjà utilisé)
- ✅ Gratuit : 500 Mo base de données
- ✅ Pas de carte bancaire requise

**Daily.co** (pour vidéo)
- ✅ Gratuit : 10 000 minutes/mois
- ✅ Pas de carte bancaire pour commencer
- ✅ Parfait pour tester et développer

**Total : 0€** pour démarrer et tester !

---

## 📞 BESOIN D'AIDE ?

Si quelque chose ne fonctionne pas :

1. **Vérifier la console (F12)**
   - Lire les messages d'erreur
   - Copier l'erreur exacte

2. **Vérifier Supabase**
   - Les scripts SQL sont-ils exécutés ?
   - Les tables existent-elles ?
   - Les politiques RLS sont-elles actives ?

3. **Vérifier .env**
   - Le fichier existe-t-il ?
   - Les clés sont-elles correctes ?
   - Avez-vous redémarré après modification ?

**Je suis là pour vous aider !** 🚀
