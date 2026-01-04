# 🎥 GUIDE COMPLET - RENDRE LE VOLET SESSIONS FONCTIONNEL

## 📋 TABLE DES MATIÈRES
1. [Résumé du Problème](#résumé-du-problème)
2. [Configuration Requise](#configuration-requise)
3. [Étape 1 : Corriger les Politiques RLS](#étape-1--corriger-les-politiques-rls)
4. [Étape 2 : Configuration Supabase](#étape-2--configuration-supabase)
5. [Étape 3 : Installer les Dépendances WebRTC](#étape-3--installer-les-dépendances-webrtc)
6. [Étape 4 : Créer le Composant de Salle de Session](#étape-4--créer-le-composant-de-salle-de-session)
7. [Étape 5 : Configuration des Variables d'Environnement](#étape-5--configuration-des-variables-denvironnement)
8. [Étape 6 : Tests](#étape-6--tests)

---

## 🔍 Résumé du Problème

### Erreur Actuelle
```
Error fetching sessions:
{ code: "42P17", details: null, hint: null, 
  message: "Infinite recursion detected in policy for relation \"study_sessions\"" }
```

### Cause
Les politiques RLS actuelles créent une **récursion infinie** :
- La politique sur `study_sessions` vérifie `session_participants`
- La politique sur `session_participants` vérifie `study_sessions`
- ⚠️ Boucle infinie → 500 Internal Server Error

### Solution
Utiliser des politiques **permissives et simples** sans dépendances circulaires.

---

## 🛠️ Configuration Requise

### 1. Outils à Installer

#### A. Node.js et npm
```bash
# Vérifier si installé
node --version
npm --version

# Si non installé, télécharger depuis https://nodejs.org/
```

#### B. Git (si pas encore installé)
```bash
# Vérifier
git --version

# Installer depuis https://git-scm.com/downloads si nécessaire
```

### 2. Services Externes Nécessaires

#### A. Compte Supabase
- **Site** : https://supabase.com
- **Gratuit** : Oui (plan gratuit suffisant pour démarrer)
- **Usage** : Base de données, authentification, storage

#### B. Service WebRTC (Optionnel pour production)
Pour les sessions vidéo en production, vous aurez besoin d'un serveur TURN/STUN :

**Option 1 : Google STUN (Gratuit)**
```javascript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' }
]
```

**Option 2 : Twilio (Payant, plus fiable)**
- **Site** : https://www.twilio.com/
- **Usage** : Serveurs TURN pour connexions difficiles
- **Prix** : ~10€/mois pour usage basique

**Option 3 : Metered.ca (Gratuit pour tester)**
- **Site** : https://www.metered.ca/
- **Gratuit** : 50 Go/mois
- **Inscription** : https://dashboard.metered.ca/signup

#### C. Daily.co (Alternative tout-en-un, recommandée)
- **Site** : https://www.daily.co/
- **Gratuit** : 10 000 minutes/mois
- **Avantages** : 
  - SDK React prêt à l'emploi
  - Gère WebRTC automatiquement
  - Enregistrement intégré
  - Partage d'écran facile
- **Inscription** : https://dashboard.daily.co/signup

---

## 🔧 Étape 1 : Corriger les Politiques RLS

### Action Immédiate

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://app.supabase.com
   - Sélectionner votre projet
   - Cliquer sur "SQL Editor" dans la barre latérale

2. **Exécuter le Script de Correction**
   - Ouvrir le fichier `FIX_RLS_SESSIONS_RECURSION.sql`
   - Copier tout le contenu
   - Coller dans l'éditeur SQL de Supabase
   - Cliquer sur "RUN" (ou Ctrl+Enter)

3. **Vérifier la Correction**
   - Vous devriez voir le message : "✅✅✅ RLS CORRIGÉE - RÉCURSION ÉLIMINÉE ! ✅✅✅"
   - Rafraîchir votre application (F5)
   - L'erreur "Infinite recursion" devrait disparaître

### Ce que le Script Fait

```sql
-- Supprime les politiques récursives problématiques
DROP POLICY IF EXISTS "Users can view accessible sessions" ON study_sessions;

-- Crée des politiques simples sans récursion
CREATE POLICY "select_study_sessions_permissive"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (true);  -- ✅ Pas de jointure = pas de récursion

-- Protection toujours présente pour les modifications
CREATE POLICY "update_study_sessions"
  ON study_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id);
```

---

## 🔐 Étape 2 : Configuration Supabase

### Vérifier la Configuration

1. **Récupérer les Clés API**
   - Dans Supabase Dashboard
   - Aller dans "Settings" → "API"
   - Copier :
     - **Project URL** : `https://xxxxx.supabase.co`
     - **anon public** key : `eyJhbGc...` (longue chaîne)

2. **Créer le Fichier .env**

Créer un fichier `.env` à la racine du projet :

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique_ici

# Daily.co Configuration (Optionnel - pour les sessions vidéo)
VITE_DAILY_API_KEY=votre_cle_daily_ici

# Twilio Configuration (Optionnel - alternative WebRTC)
VITE_TWILIO_ACCOUNT_SID=votre_account_sid
VITE_TWILIO_AUTH_TOKEN=votre_auth_token
```

3. **Vérifier que .env est dans .gitignore**

```bash
# Ouvrir .gitignore et vérifier que ces lignes existent
.env
.env.local
.env.*.local
```

---

## 📦 Étape 3 : Installer les Dépendances WebRTC

### Option A : Utiliser Daily.co (Recommandé - Plus Simple)

```bash
# Installer le SDK Daily.co
npm install @daily-co/daily-js @daily-co/daily-react

# Installer les dépendances React
npm install react-router-dom date-fns lucide-react
```

### Option B : WebRTC Natif (Plus Complexe)

```bash
# Installer les bibliothèques WebRTC
npm install simple-peer socket.io-client

# Installer le serveur de signalisation
npm install -D socket.io express cors
```

### Dépendances Communes

```bash
# Installer toutes les dépendances manquantes
npm install

# Vérifier qu'il n'y a pas d'erreurs
npm run build
```

---

## 🎬 Étape 4 : Créer le Composant de Salle de Session

### Option A : Avec Daily.co (Simple et Rapide)

Je vais créer un composant complet qui utilise Daily.co pour gérer les sessions vidéo.

**Avantages** :
- ✅ Plug & Play
- ✅ Vidéo/Audio/Partage d'écran automatique
- ✅ Enregistrement intégré
- ✅ Chat inclus
- ✅ 10 000 minutes gratuites/mois

**Fichiers à créer** :
1. `src/pages/SessionRoom.tsx` - Salle de session principale
2. `src/lib/daily.ts` - Configuration Daily.co
3. `src/components/VideoCall.tsx` - Interface vidéo

### Option B : WebRTC Natif (Plus de Contrôle)

**Avantages** :
- ✅ Gratuit à 100%
- ✅ Contrôle total
- ✅ Pas de dépendance externe

**Inconvénients** :
- ⚠️ Plus complexe à mettre en place
- ⚠️ Nécessite un serveur de signalisation
- ⚠️ Gestion manuelle des connexions

---

## 🔑 Étape 5 : Configuration des Variables d'Environnement

### Configuration Minimale (Sans Vidéo)

Si vous voulez juste tester les sessions sans vidéo d'abord :

```env
# .env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

### Configuration Complète (Avec Daily.co)

1. **Créer un compte Daily.co**
   - Aller sur https://dashboard.daily.co/signup
   - S'inscrire (gratuit)
   - Aller dans "Developers" → "API Keys"
   - Copier votre clé API

2. **Ajouter la clé dans .env**

```env
# .env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon

# Daily.co
VITE_DAILY_API_KEY=votre_cle_daily
```

3. **Redémarrer le serveur de développement**

```bash
# Arrêter le serveur (Ctrl+C)
# Relancer
npm run dev
```

---

## ✅ Étape 6 : Tests

### Test 1 : Vérifier que l'Erreur RLS est Corrigée

1. Ouvrir votre application : http://localhost:5173
2. Se connecter
3. Aller dans "Sessions"
4. Ouvrir la console (F12)
5. **Résultat attendu** : 
   - ✅ "Documents récupérés : 0" (ou plus)
   - ✅ "Dossiers récupérés : 0" (ou plus)
   - ❌ **PAS** d'erreur "Infinite recursion"

### Test 2 : Créer une Session

1. Cliquer sur "Nouvelle session"
2. Remplir le formulaire :
   - Titre : "Session de test"
   - Description : "Test de la fonctionnalité"
   - Type : "Session d'étude"
   - Date/Heure : Aujourd'hui + 1 heure
3. Cliquer sur "Créer la session"
4. **Résultat attendu** :
   - ✅ La session apparaît dans la liste "À venir"
   - ✅ Les compteurs sont mis à jour (0 → 1)

### Test 3 : Rejoindre une Session (Sans Vidéo d'abord)

1. Cliquer sur "Rejoindre" sur une session
2. **Résultat attendu** :
   - ✅ Redirection vers `/sessions/:id/join`
   - ✅ Page de session s'affiche
   - ⚠️ Vidéo pas encore fonctionnelle (normal à ce stade)

### Test 4 : Vidéo/Audio (Après Configuration Daily.co)

1. S'assurer que `VITE_DAILY_API_KEY` est configurée
2. Rejoindre une session
3. Autoriser caméra/micro quand demandé
4. **Résultat attendu** :
   - ✅ Votre vidéo s'affiche
   - ✅ Audio fonctionne
   - ✅ Partage d'écran disponible

---

## 🚀 Récapitulatif : Quelle Option Choisir ?

### Pour Démarrer Rapidement (Recommandé)

```bash
# 1. Corriger RLS
Exécuter FIX_RLS_SESSIONS_RECURSION.sql dans Supabase

# 2. Installer Daily.co
npm install @daily-co/daily-js @daily-co/daily-react

# 3. Créer compte Daily.co (gratuit)
https://dashboard.daily.co/signup

# 4. Configurer .env
VITE_DAILY_API_KEY=votre_cle

# 5. Redémarrer
npm run dev
```

### Pour un Contrôle Total (Avancé)

```bash
# 1. Corriger RLS (pareil)
Exécuter FIX_RLS_SESSIONS_RECURSION.sql

# 2. Installer WebRTC
npm install simple-peer socket.io-client

# 3. Créer serveur de signalisation
Créer server/signaling.js

# 4. Configuration serveur STUN/TURN
Gratuit : Google STUN
Payant : Twilio

# 5. Implémenter la logique WebRTC manuellement
```

---

## 📝 Prochaines Étapes

Dites-moi quelle option vous préférez :

**A. Daily.co (Simple)** 
- Je crée tous les composants prêts à l'emploi
- Configuration en 5 minutes
- Vidéo/Audio/Chat fonctionnels immédiatement

**B. WebRTC Natif (Avancé)**
- Je crée l'architecture complète
- Plus de travail mais gratuit à 100%
- Vous apprendrez le fonctionnement de WebRTC

**C. Version Simple d'abord**
- On commence sans vidéo
- Juste chat texte + partage de documents
- On ajoute la vidéo plus tard

---

## 🆘 Dépannage

### Erreur : "Missing environment variables"

```bash
# Vérifier que .env existe
ls -la | grep .env

# Si absent, le créer
echo "VITE_SUPABASE_URL=votre_url" > .env
echo "VITE_SUPABASE_ANON_KEY=votre_cle" >> .env
```

### Erreur : "Cannot find module @daily-co/daily-js"

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### La Vidéo ne Fonctionne Pas

1. Vérifier que HTTPS est activé (requis pour WebRTC)
2. Autoriser caméra/micro dans le navigateur
3. Vérifier la console pour les erreurs
4. Tester sur Chrome/Edge (Firefox peut avoir des problèmes)

---

## 💰 Coûts Estimés

### Gratuit
- Supabase (plan gratuit) : 500 Mo base de données
- Daily.co (plan gratuit) : 10 000 minutes/mois
- Google STUN : Gratuit
- **Total** : 0€/mois

### Payant (Pour Production)
- Supabase Pro : 25€/mois
- Daily.co Pay-as-you-go : ~0.01€/minute
- Twilio TURN : ~10€/mois
- **Total** : ~40€/mois pour 100 utilisateurs

---

## 📞 Contact et Support

Si vous rencontrez des problèmes :

1. Vérifier les logs de la console (F12)
2. Vérifier les politiques RLS dans Supabase
3. Tester avec un utilisateur différent
4. Vérifier que toutes les variables d'environnement sont définies

**Je suis là pour vous aider !** Dites-moi quelle option vous voulez et je vous guide pas à pas.
