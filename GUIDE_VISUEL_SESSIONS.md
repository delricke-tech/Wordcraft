# 🎯 GUIDE VISUEL RAPIDE - 3 MINUTES CHRONO

## 🚦 STATUT ACTUEL

Voici ce que vous voyez dans la capture d'écran :

### ❌ AVANT (Erreur actuelle)
```
Console (F12) :
├─ ❌ GET https://...supabase.co/rest/v1/study_sessions?select=*
├─ ❌ 500 (Internal Server Error)
└─ ❌ Error: "Infinite recursion detected in policy for relation study_sessions"

Interface :
├─ En cours: 0
├─ À venir: 0
└─ Total sessions: 0
```

### ✅ APRÈS (Une fois corrigé)
```
Console (F12) :
├─ ✅ GET https://...supabase.co/rest/v1/study_sessions?select=*
├─ ✅ 200 (OK)
└─ ✅ Documents récupérés: 0

Interface :
├─ En cours: 0
├─ À venir: 1  ← Vos sessions créées !
└─ Total sessions: 1
```

---

## ⚡ 3 ACTIONS IMMÉDIATES

### 1️⃣ SUPABASE (2 minutes)

**Ouvrir :** https://app.supabase.com

**Étapes :**
```
1. Se connecter
2. Sélectionner votre projet
3. Cliquer sur "SQL Editor" (icône </> dans la barre latérale)
4. Cliquer "New query"
```

**Script 1 à coller :**
```sql
-- Copier TOUT le contenu de FIX_RLS_SESSIONS_RECURSION.sql
-- Coller dans l'éditeur
-- Cliquer "RUN" ou Ctrl+Enter
-- Attendre le message ✅✅✅ RLS CORRIGÉE
```

**Script 2 à coller :**
```sql
-- Copier TOUT le contenu de CREATE_SESSION_FUNCTIONS.sql
-- Coller dans l'éditeur
-- Cliquer "RUN" ou Ctrl+Enter
-- Attendre le message ✅✅✅ FONCTIONS CRÉÉES
```

---

### 2️⃣ FICHIER .env (30 secondes)

**Créer le fichier `.env` à la racine du projet :**

```
project/
├─ src/
├─ public/
├─ package.json
└─ .env  ← ICI !
```

**Contenu du .env :**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Où trouver ces valeurs ?**
```
Supabase Dashboard
└─ Settings (icône ⚙️)
   └─ API
      ├─ Project URL  → VITE_SUPABASE_URL
      └─ anon public  → VITE_SUPABASE_ANON_KEY
```

---

### 3️⃣ LANCER L'APP (30 secondes)

**Option A : Script automatique**
```bash
# Double-cliquer sur :
demarrer-sessions.bat
```

**Option B : Commandes manuelles**
```bash
# Dans PowerShell / Terminal
cd "c:\Users\HP I5\Downloads\project"
npm install  # Si première fois
npm run dev
```

**Résultat attendu :**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🎬 TESTER LA CORRECTION

### Test 1 : Vérifier l'erreur est partie

1. Ouvrir http://localhost:5173
2. Se connecter
3. Aller dans "Sessions" (barre latérale)
4. **Ouvrir la console (F12)**
5. Onglet "Console"

**AVANT (erreur) :**
```javascript
❌ Error fetching sessions: 
   {code: "42P17", message: "Infinite recursion detected..."}
```

**APRÈS (corrigé) :**
```javascript
✅ Pas d'erreur !
✅ L'interface s'affiche normalement
```

---

### Test 2 : Créer une session

**Étapes :**
```
1. Cliquer "Nouvelle session" (bouton vert en haut à droite)
2. Remplir le formulaire :
   Titre : "Ma première session"
   Description : "Test du volet sessions"
   Type : "Session d'étude"
   Date : Aujourd'hui
   Heure : Dans 10 minutes
3. Cliquer "Créer la session"
```

**Résultat attendu :**
```
✅ La modale se ferme
✅ La session apparaît dans "À venir (1)"
✅ Le compteur "Total sessions" passe à 1
```

---

### Test 3 : Rejoindre la session

**Étapes :**
```
1. Cliquer sur "Rejoindre" (bouton sur la session)
2. Vous arrivez dans la salle de session
```

**Ce que vous voyez :**
```
┌────────────────────────────────────────────┐
│ ← Ma première session         👥 1  ⚙️    │
├────────────────────────────────────────────┤
│                                            │
│     Grille Vidéo (Participants)            │
│                                            │
│     [Votre Avatar]                         │
│                                            │
├────────────────────────────────────────────┤
│  🎤  📹  🖥️         📞                    │
│ Mic  Vid Share    Quit                     │
└────────────────────────────────────────────┘
│ Chat │ Participants │ Documents │
├──────────────────────────────────┤
│                                  │
│  Zone de chat/participants       │
│                                  │
└──────────────────────────────────┘
```

---

## 🎥 AJOUTER LA VIDÉO (Optionnel)

Si vous voulez tester la vidéo/audio :

### Étape 1 : Daily.co (2 minutes)

```
1. Aller sur https://dashboard.daily.co/signup
2. S'inscrire (email + mot de passe)
3. Vérifier l'email
4. Se connecter
5. Aller dans "Developers" → "API Keys"
6. Copier la clé "Default API Key"
```

### Étape 2 : Installer (1 minute)

```bash
npm install @daily-co/daily-js @daily-co/daily-react
```

### Étape 3 : Configurer (30 secondes)

Ajouter dans `.env` :
```env
VITE_DAILY_API_KEY=votre_cle_daily
```

### Étape 4 : Me demander de l'intégrer

Je peux créer le code d'intégration Daily.co en 2 minutes !

---

## 📊 CHECKLIST COMPLÈTE

### Phase 1 : Correction SQL
- [ ] Ouvert Supabase Dashboard
- [ ] Exécuté FIX_RLS_SESSIONS_RECURSION.sql
- [ ] Exécuté CREATE_SESSION_FUNCTIONS.sql
- [ ] Vu les messages de confirmation ✅

### Phase 2 : Configuration
- [ ] Créé fichier .env
- [ ] Ajouté VITE_SUPABASE_URL
- [ ] Ajouté VITE_SUPABASE_ANON_KEY
- [ ] Vérifié qu'il n'y a pas d'espaces/guillemets

### Phase 3 : Test
- [ ] Lancé npm run dev
- [ ] Ouvert http://localhost:5173
- [ ] Connecté à l'application
- [ ] Allé dans "Sessions"
- [ ] Pas d'erreur "Infinite recursion" dans la console
- [ ] Créé une session test
- [ ] Session apparaît dans la liste
- [ ] Rejoint la session
- [ ] Interface de session s'affiche

### Phase 4 : Vidéo (Optionnel)
- [ ] Créé compte Daily.co
- [ ] Copié clé API
- [ ] Installé packages Daily.co
- [ ] Ajouté clé dans .env
- [ ] Redémarré l'app
- [ ] Testé la vidéo

---

## 🚨 PROBLÈMES COURANTS

### Problème : "Missing environment variables"

**Solution :**
```bash
# Vérifier que .env existe
dir .env

# Si absent :
# 1. Créer .env à la racine
# 2. Ajouter les clés Supabase
# 3. Redémarrer npm run dev
```

---

### Problème : "Infinite recursion" persiste

**Solution :**
```sql
-- Re-exécuter le script SQL dans Supabase
-- Puis vider le cache du navigateur :
-- Chrome/Edge : Ctrl+Shift+Delete → Tout effacer → Confirmer
-- Puis F5 pour rafraîchir
```

---

### Problème : Page blanche

**Solution :**
```bash
# 1. Ouvrir la console (F12)
# 2. Lire l'erreur exacte
# 3. Vérifier que :
#    - Vous êtes connecté
#    - Les clés .env sont correctes
#    - npm run dev est actif
```

---

### Problème : "Cannot find module SessionRoom"

**Solution :**
```bash
# Le fichier SessionRoom.tsx n'est pas compilé
# Redémarrer npm run dev :
# Ctrl+C pour arrêter
# npm run dev pour relancer
```

---

## 🎯 RÉSUMÉ EN 1 IMAGE

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  1. SUPABASE                                    │
│     ├─ FIX_RLS_SESSIONS_RECURSION.sql  ✅      │
│     └─ CREATE_SESSION_FUNCTIONS.sql    ✅      │
│                                                 │
│  2. FICHIER .env                                │
│     ├─ VITE_SUPABASE_URL               ✅      │
│     └─ VITE_SUPABASE_ANON_KEY          ✅      │
│                                                 │
│  3. LANCER                                      │
│     └─ npm run dev                     ✅      │
│                                                 │
│  4. TESTER                                      │
│     ├─ Sessions s'affichent            ✅      │
│     ├─ Créer session                   ✅      │
│     └─ Rejoindre session               ✅      │
│                                                 │
│  5. VIDÉO (Optionnel)                           │
│     ├─ Daily.co compte                 ⚪      │
│     ├─ npm install @daily-co/...       ⚪      │
│     └─ Intégration code                ⚪      │
│                                                 │
└─────────────────────────────────────────────────┘

Légende :
✅ = Obligatoire
⚪ = Optionnel (pour vidéo)
```

---

## ⏱️ TEMPS TOTAL

- **Correction SQL** : 2 minutes
- **Configuration .env** : 30 secondes
- **Lancement** : 30 secondes
- **Test** : 1 minute
- **TOTAL** : **~4 minutes**

Avec vidéo :
- **Daily.co** : +2 minutes
- **Installation** : +1 minute
- **Configuration** : +30 secondes
- **Intégration** : +10 minutes (avec mon aide)
- **TOTAL** : **~18 minutes**

---

## 📞 PROCHAINE ÉTAPE

**Dites-moi où vous en êtes :**

A. ✅ "J'ai exécuté les scripts SQL et l'erreur est corrigée"
B. ⚠️ "J'ai un problème avec [décrire le problème]"
C. 🎥 "Ça marche ! Je veux ajouter la vidéo maintenant"
D. 📝 "Je veux ajouter d'autres fonctionnalités"

**Je suis là pour vous aider !** 🚀
