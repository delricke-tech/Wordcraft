# 🔑 CLÉS API ET OUTILS NÉCESSAIRES

## 📋 RÉSUMÉ RAPIDE

Pour rendre le volet Sessions **100% fonctionnel**, voici ce dont vous avez besoin :

### ✅ Obligatoire (déjà configuré normalement)
- **Supabase** : Base de données + authentification
  - URL du projet
  - Clé anonyme publique
  - 💰 **Gratuit**

### 🎥 Optionnel (pour vidéo/audio)
- **Daily.co** : Service WebRTC pour vidéo/audio
  - Clé API
  - 💰 **Gratuit** : 10 000 minutes/mois

---

## 1️⃣ SUPABASE (Obligatoire)

### Pourquoi ?
Supabase gère :
- 🗄️ Base de données PostgreSQL
- 🔐 Authentification des utilisateurs
- 📡 Realtime (chat en temps réel)
- 📦 Storage (documents)

### Comment obtenir les clés ?

**Étape 1 : Se connecter**
```
→ Aller sur https://app.supabase.com
→ Se connecter (ou créer un compte si pas encore fait)
→ Sélectionner votre projet
```

**Étape 2 : Récupérer les clés**
```
→ Cliquer sur "Settings" (icône ⚙️ en bas à gauche)
→ Cliquer sur "API" dans le menu latéral
→ Copier ces deux valeurs :
```

**Project URL :**
```
https://xxxxxxxxxx.supabase.co
```

**anon public key :**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtamJj...
(très longue chaîne de caractères)
```

**Étape 3 : Ajouter dans .env**

Créer/modifier le fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT :** 
- Ne JAMAIS commiter le fichier `.env` sur Git
- Vérifier que `.env` est dans `.gitignore`
- Redémarrer le serveur après modification du `.env`

### Coût
- **Plan Gratuit :**
  - 500 Mo de base de données
  - 1 Go de stockage fichiers
  - 2 Go de bande passante
  - Parfait pour développement et tests

---

## 2️⃣ DAILY.CO (Optionnel - Pour Vidéo/Audio)

### Pourquoi ?
Daily.co simplifie énormément WebRTC :
- 🎥 Vidéo HD automatique
- 🎤 Audio haute qualité
- 🖥️ Partage d'écran intégré
- 📹 Enregistrement possible
- 🌐 Gère les connexions difficiles (TURN/STUN)
- ⚡ SDK React prêt à l'emploi

### Alternative : Faire sans Daily.co
Si vous ne voulez pas utiliser Daily.co :
- ✅ Le chat texte fonctionnera quand même
- ✅ La gestion des participants fonctionnera
- ❌ Pas de vidéo/audio (nécessite WebRTC natif = plus complexe)

### Comment obtenir une clé Daily.co ?

**Étape 1 : Créer un compte**
```
→ Aller sur https://dashboard.daily.co/signup
→ S'inscrire avec email (gratuit, pas de CB requise)
→ Vérifier votre email
```

**Étape 2 : Récupérer la clé API**
```
→ Se connecter sur https://dashboard.daily.co
→ Cliquer sur "Developers" dans le menu latéral
→ Cliquer sur "API Keys"
→ Copier la clé "Default API Key"
```

Format de la clé :
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
(chaîne alphanumérique de ~40 caractères)
```

**Étape 3 : Ajouter dans .env**

```env
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DAILY_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Étape 4 : Installer les packages**

```bash
npm install @daily-co/daily-js @daily-co/daily-react
```

**Étape 5 : Redémarrer**

```bash
# Arrêter le serveur (Ctrl+C)
npm run dev
```

### Coût
- **Plan Gratuit :**
  - 10 000 minutes/mois
  - Jusqu'à 10 participants simultanés
  - Qualité vidéo HD
  - Parfait pour commencer

- **Plan Payant (si besoin plus tard) :**
  - ~0.01€ par minute participante
  - Exemple : 100 sessions de 30 min avec 5 participants = ~150€/mois

---

## 3️⃣ ALTERNATIVES WEBRTC (Avancé)

Si vous ne voulez pas utiliser Daily.co, voici les alternatives :

### Option A : WebRTC Natif (Gratuit mais complexe)

**Avantages :**
- ✅ 100% gratuit
- ✅ Contrôle total
- ✅ Pas de dépendance externe

**Inconvénients :**
- ⚠️ Beaucoup plus complexe à implémenter
- ⚠️ Nécessite un serveur de signalisation
- ⚠️ Gestion manuelle des connexions TURN/STUN
- ⚠️ Pas d'enregistrement intégré

**Packages nécessaires :**
```bash
npm install simple-peer socket.io-client
```

**Serveur STUN gratuit (Google) :**
```javascript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
}
```

### Option B : Twilio Video (Payant, professionnel)

**Site :** https://www.twilio.com/video

**Avantages :**
- ✅ Très fiable
- ✅ Scalable
- ✅ Support technique

**Inconvénients :**
- ❌ Payant dès le début
- ❌ Plus cher que Daily.co

**Coût :**
- ~0.04€/minute participante

### Option C : Agora.io (Alternative à Daily.co)

**Site :** https://www.agora.io/

**Avantages :**
- ✅ Gratuit : 10 000 minutes/mois
- ✅ SDK React disponible
- ✅ Bonne qualité

**Inconvénients :**
- ⚠️ Plus complexe que Daily.co
- ⚠️ Documentation moins claire

---

## 4️⃣ AUTRES SERVICES UTILES (Optionnels)

### OpenAI API (Pour assistant IA avancé)

**Utilisé pour :**
- Génération de flashcards depuis documents
- Résumés automatiques de sessions
- Questions/réponses intelligentes

**Comment obtenir :**
```
→ Aller sur https://platform.openai.com/
→ Créer un compte
→ Aller dans "API Keys"
→ Créer une nouvelle clé
```

**Ajout dans .env :**
```env
VITE_OPENAI_API_KEY=sk-proj-...
```

**Coût :**
- Modèle GPT-4o mini : ~0.15€/1M tokens
- Modèle GPT-4 : ~30€/1M tokens

### Google Cloud Vision (Pour OCR)

**Utilisé pour :**
- Extraction de texte depuis images/PDF scannés

**Comment obtenir :**
```
→ Aller sur https://console.cloud.google.com/
→ Créer un projet
→ Activer "Cloud Vision API"
→ Créer des identifiants (clé API)
```

**Ajout dans .env :**
```env
VITE_GOOGLE_VISION_API_KEY=AIzaSy...
```

**Coût :**
- 1000 premières requêtes/mois : Gratuit
- Au-delà : ~1.50€/1000 images

---

## 📝 TEMPLATE .env COMPLET

Voici le fichier `.env` complet avec tous les services :

```env
# ============================================
# OBLIGATOIRE - Supabase
# ============================================
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# OPTIONNEL - Daily.co (Vidéo/Audio)
# ============================================
VITE_DAILY_API_KEY=votre_cle_daily

# ============================================
# OPTIONNEL - OpenAI (Assistant IA)
# ============================================
VITE_OPENAI_API_KEY=sk-proj-...

# ============================================
# OPTIONNEL - Google Cloud Vision (OCR)
# ============================================
VITE_GOOGLE_VISION_API_KEY=AIzaSy...

# ============================================
# OPTIONNEL - Twilio (Alternative WebRTC)
# ============================================
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=votre_auth_token
```

---

## ✅ CHECKLIST DE CONFIGURATION

### Configuration Minimale (Chat seulement)
- [ ] Compte Supabase créé
- [ ] Clés Supabase récupérées
- [ ] Fichier `.env` créé avec clés Supabase
- [ ] Scripts SQL exécutés dans Supabase
- [ ] Application lancée (`npm run dev`)

### Configuration Complète (Avec Vidéo)
- [ ] ✅ Configuration minimale terminée
- [ ] Compte Daily.co créé
- [ ] Clé API Daily.co récupérée
- [ ] Packages Daily.co installés (`npm install @daily-co/daily-js @daily-co/daily-react`)
- [ ] Clé ajoutée dans `.env`
- [ ] Application redémarrée

---

## 🔒 SÉCURITÉ DES CLÉS

### ⚠️ À NE JAMAIS FAIRE :
- ❌ Commiter `.env` sur Git
- ❌ Partager vos clés publiquement
- ❌ Mettre les clés directement dans le code
- ❌ Publier les clés sur forums/Discord

### ✅ Bonnes Pratiques :
- ✅ Toujours utiliser `.env` pour les clés
- ✅ Vérifier que `.env` est dans `.gitignore`
- ✅ Régénérer les clés si elles sont compromises
- ✅ Utiliser des variables d'environnement différentes pour dev/prod

---

## 🆘 DÉPANNAGE

### Erreur : "Missing environment variables"

**Solution :**
```bash
# Vérifier que .env existe
dir .env

# Vérifier le contenu
type .env

# Redémarrer après modification
npm run dev
```

### Erreur : "Invalid API Key"

**Vérifications :**
1. La clé est-elle complète ? (pas coupée)
2. Y a-t-il des espaces avant/après ?
3. Le nom de la variable est-il correct ? (`VITE_` obligatoire pour Vite)
4. Avez-vous redémarré le serveur ?

### Vidéo ne fonctionne pas

**Vérifications :**
1. Daily.co configuré ?
2. Packages installés ?
3. Clé API valide ?
4. HTTPS activé ? (requis pour WebRTC)
5. Autorisations caméra/micro données ?

---

## 💰 RÉCAPITULATIF DES COÛTS

### Développement / Tests
- **Supabase** : Gratuit (500 Mo)
- **Daily.co** : Gratuit (10 000 min/mois)
- **Total** : **0€/mois**

### Production (Petit projet)
- **Supabase Pro** : 25€/mois
- **Daily.co** : ~50€/mois (5000 minutes)
- **Total** : **~75€/mois**

### Production (Moyen projet)
- **Supabase Pro** : 25€/mois
- **Daily.co** : ~200€/mois (20 000 minutes)
- **OpenAI** : ~50€/mois
- **Total** : **~275€/mois**

---

## 📞 BESOIN D'AIDE ?

Si vous avez des questions sur :
- Configuration des clés API
- Création de comptes
- Problèmes de connexion
- Erreurs de configuration

**Je suis là pour vous aider !** N'hésitez pas à demander. 🚀
